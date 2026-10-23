-- CK Life · Segurança · PARTE 1 de 5 (rode na ordem)
-- =====================================================================
-- CK Life · SEGURANÇA & PRIVACIDADE
-- Auditoria imutável, papéis, consentimentos versionados, documentos legais,
-- solicitações de titulares (LGPD), incidentes, retenção, inventário de dados,
-- RIPD, idade mínima, limites contra abuso e MFA para o painel.
-- Só ADICIONA (amplia duas regras: tipos de denúncia e permissão de admin com MFA).
-- Não apaga dados. Pode rodar mais de uma vez.
-- Itens marcados VALIDAÇÃO JURÍDICA NECESSÁRIA dependem do jurídico.
-- =====================================================================

-- ---------- 1) Configuração de segurança (uma linha por chave) ----------
create table if not exists public.seguranca_config (
  chave text primary key,
  valor jsonb not null,
  nota text,
  atualizado timestamptz not null default now(),
  atualizado_por uuid
);
alter table public.seguranca_config enable row level security;
insert into public.seguranca_config (chave, valor, nota) values
  ('idade_minima', '18', 'Faixa etária permitida. VALIDAÇÃO JURÍDICA NECESSÁRIA.'),
  ('idade_validada', 'false', 'O proprietário/jurídico confirmou a faixa etária?'),
  ('mfa_admin_obrigatorio', 'false', 'Exigir verificação em 2 etapas para ações do painel'),
  ('prazo_lgpd_dias', '15', 'Prazo interno para responder titulares. VALIDAÇÃO JURÍDICA NECESSÁRIA.'),
  ('prazo_anpd_dias_uteis', '3', 'Prazo de referência para avaliar comunicação de incidente. VALIDAÇÃO JURÍDICA NECESSÁRIA.'),
  ('encarregado', '"A definir"', 'Encarregado (DPO) e contato'),
  ('plataforma', '{"tipo":"PWA no navegador","bloqueio_print":false,"deteccao_print":false,"backup":"Conforme plano do Supabase (ver painel do Supabase)"}', 'Capacidades técnicas reais')
on conflict (chave) do nothing;
create or replace function public.config_valor(p text) returns jsonb
language sql stable security definer set search_path = public as $$ select valor from seguranca_config where chave = p $$;

-- MFA: quando obrigatório, toda ação de escrita do painel exige sessão com 2 etapas (aal2)
create or replace function public.mfa_ok() returns boolean
language sql stable security definer set search_path = public as $$
  select not coalesce((select (valor #>> '{}')::boolean from seguranca_config where chave = 'mfa_admin_obrigatorio'), false)
      or coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;
create or replace function public.admin_pode(p_area text) returns boolean
language sql stable security definer set search_path = public as $$
  select mfa_ok() and exists (select 1 from admins where user_id = auth.uid()
    and (coalesce((perms->>'total')::boolean, false) or perms->>p_area = 'editar'))
$$;

-- ---------- 2) AUDITORIA (só inserção; ninguém edita nem apaga pelo app) ----------
create table if not exists public.auditoria (
  id bigserial primary key,
  ator uuid,
  acao text not null,
  recurso text,
  alvo text,
  resultado text not null default 'ok',
  motivo text,
  criado timestamptz not null default now()
);
create index if not exists auditoria_criado_idx on public.auditoria (criado desc);
create index if not exists auditoria_alvo_idx on public.auditoria (alvo);
alter table public.auditoria enable row level security;
drop policy if exists au_ler on public.auditoria;
create policy au_ler on public.auditoria for select to authenticated using (admin_ve('auditoria'));
create or replace function public.auditar(p_acao text, p_recurso text default null, p_alvo text default null, p_resultado text default 'ok', p_motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into auditoria (ator, acao, recurso, alvo, resultado, motivo) values (auth.uid(), left(p_acao, 60), left(p_recurso, 60), left(p_alvo, 120), left(coalesce(p_resultado, 'ok'), 30), left(p_motivo, 500));
end $$;
grant execute on function public.auditar(text, text, text, text, text) to authenticated;
-- ninguém altera registros de auditoria, nem quem é admin
create or replace function public.auditoria_imutavel() returns trigger
language plpgsql as $$ begin raise exception 'auditoria nao pode ser alterada'; end $$;
drop trigger if exists auditoria_imutavel on public.auditoria;
create trigger auditoria_imutavel before update or delete on public.auditoria for each row execute function public.auditoria_imutavel();

-- mudanças em administradores e permissões ficam registradas; sempre resta um acesso total
create or replace function public.audita_admins() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then perform auditar('admin_adicionado', 'admins', new.user_id::text, 'ok', new.perms::text);
  elsif tg_op = 'UPDATE' and new.perms is distinct from old.perms then perform auditar('permissao_alterada', 'admins', new.user_id::text, 'ok', old.perms::text || ' -> ' || new.perms::text);
  elsif tg_op = 'DELETE' then
    if coalesce((old.perms->>'total')::boolean, false) and not exists (select 1 from admins where user_id <> old.user_id and coalesce((perms->>'total')::boolean, false)) then
      raise exception 'precisa ficar pelo menos um administrador com acesso total';
    end if;
    perform auditar('admin_removido', 'admins', old.user_id::text);
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists audita_admins on public.admins;
create trigger audita_admins after insert or update or delete on public.admins for each row execute function public.audita_admins();

-- situação da conta (ativa, suspensa, bloqueada, em exclusão, excluída) + registro
alter table public.alunas add column if not exists situacao text not null default 'ativa';
alter table public.alunas add column if not exists situacao_motivo text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'alunas_situacao_ok') then
    alter table public.alunas add constraint alunas_situacao_ok check (situacao in ('ativa','suspensa','bloqueada','em_exclusao','excluida'));
  end if;
end $$;
create or replace function public.audita_alunas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and auth.uid() <> new.id then
    if new.situacao is distinct from old.situacao or new.bloqueado is distinct from old.bloqueado then
      perform auditar('conta_' || new.situacao, 'alunas', new.id::text, 'ok', new.situacao_motivo);
    end if;
    if new.premium is distinct from old.premium then perform auditar('premium_alterado', 'alunas', new.id::text); end if;
  end if;
  return new;
end $$;
drop trigger if exists audita_alunas on public.alunas;
create trigger audita_alunas after update on public.alunas for each row execute function public.audita_alunas();
-- a própria aluna não muda a própria situação
create or replace function public.protege_situacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or admin_pode('alunos') or admin_pode('lgpd') or admin_pode('moderacao') then
    if new.situacao in ('suspensa','bloqueada','em_exclusao','excluida') then new.bloqueado := true; elsif new.situacao = 'ativa' and old.situacao <> 'ativa' then new.bloqueado := false; end if;
    return new;
  end if;
  new.situacao := old.situacao; new.situacao_motivo := old.situacao_motivo;
  return new;
end $$;
drop trigger if exists protege_situacao on public.alunas;
create trigger protege_situacao before update on public.alunas for each row execute function public.protege_situacao();

-- ---------- 3) Idade mínima conferida no banco (autodeclaração; não é aferição forte) ----------
create or replace function public.confere_idade() returns trigger
language plpgsql security definer set search_path = public as $$
declare minimo int := coalesce((select (valor #>> '{}')::int from seguranca_config where chave = 'idade_minima'), 18);
begin
  if coalesce(auth.role(), '') = 'service_role' or e_admin() then return new; end if;
  if new.nasc is not null and new.nasc > (current_date - make_interval(years => minimo)) then
    raise exception 'idade minima: % anos', minimo;
  end if;
  return new;
end $$;
drop trigger if exists confere_idade on public.alunas;
create trigger confere_idade before insert on public.alunas for each row execute function public.confere_idade();

