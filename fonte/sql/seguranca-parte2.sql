-- CK Life · Segurança · PARTE 2 de 5 (rode na ordem)
-- ---------- 4) Documentos legais versionados ----------
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('termos','privacidade','comunidade','conteudo','cookies','seguranca','saude','ciclo','clube','profissionais','marketplace')),
  nome text not null,
  versao text not null,
  conteudo text,
  link text,
  status text not null default 'rascunho' check (status in ('rascunho','publicado','arquivado')),
  vigencia date,
  novo_aceite boolean not null default false,
  criado timestamptz not null default now(),
  publicado_em timestamptz,
  autor uuid default auth.uid(),
  unique (tipo, versao)
);
alter table public.documentos enable row level security;
drop policy if exists doc_ler on public.documentos;
create policy doc_ler on public.documentos for select using (status = 'publicado' or admin_ve('documentos'));
drop policy if exists doc_criar on public.documentos;
create policy doc_criar on public.documentos for insert to authenticated with check (admin_pode('documentos'));
drop policy if exists doc_mudar on public.documentos;
create policy doc_mudar on public.documentos for update to authenticated using (admin_pode('documentos'));
create or replace function public.protege_documento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    -- documento publicado não muda de conteúdo: crie uma nova versão
    if old.status in ('publicado','arquivado') and (new.conteudo is distinct from old.conteudo or new.versao is distinct from old.versao or new.tipo is distinct from old.tipo or new.link is distinct from old.link) then
      raise exception 'documento publicado nao pode ser editado; crie uma nova versao';
    end if;
    if old.status = 'arquivado' and new.status <> 'arquivado' then raise exception 'documento arquivado nao volta'; end if;
    if new.status = 'publicado' and old.status <> 'publicado' then
      new.publicado_em := now();
      update documentos set status = 'arquivado' where tipo = new.tipo and status = 'publicado' and id <> new.id;
    end if;
    perform auditar('documento_' || new.status, 'documentos', new.tipo || ' v' || new.versao);
  else
    if new.status = 'publicado' then new.publicado_em := now(); update documentos set status = 'arquivado' where tipo = new.tipo and status = 'publicado'; end if;
    perform auditar('documento_criado', 'documentos', new.tipo || ' v' || new.versao);
  end if;
  return new;
end $$;
drop trigger if exists protege_documento on public.documentos;
create trigger protege_documento before insert or update on public.documentos for each row execute function public.protege_documento();

-- ---------- 5) Consentimentos (histórico: nunca substitui o anterior) ----------
create table if not exists public.consentimentos (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('termos','privacidade','comunidade','ciclo','notificacoes','localizacao','marketing','cookies','compartilhamento')),
  aceito boolean not null,
  versao text,
  documento_id uuid references public.documentos(id),
  origem text not null default 'app' check (origem in ('app','cadastro','painel','importado')),
  criado timestamptz not null default now()
);
create index if not exists consentimentos_user_idx on public.consentimentos (user_id, tipo, criado desc);
alter table public.consentimentos enable row level security;
drop policy if exists cs_ler on public.consentimentos;
create policy cs_ler on public.consentimentos for select to authenticated using (user_id = auth.uid() or admin_ve('lgpd'));
drop policy if exists cs_criar on public.consentimentos;
create policy cs_criar on public.consentimentos for insert to authenticated with check (user_id = auth.uid() and origem in ('app','cadastro'));
-- estado atual de cada tipo (último registro)
create or replace view public.consentimentos_atuais with (security_invoker = true) as
  select distinct on (user_id, tipo) user_id, tipo, aceito, versao, criado from public.consentimentos order by user_id, tipo, criado desc;

-- ---------- 6) Solicitações de titulares (LGPD) ----------
create table if not exists public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  protocolo text unique,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('confirmacao','acesso','correcao','exportacao','portabilidade','anonimizacao','bloqueio','eliminacao','revogacao','compartilhamento','oposicao','outra')),
  detalhe text check (char_length(coalesce(detalhe, '')) <= 1500),
  status text not null default 'recebida' check (status in ('recebida','verificando_identidade','em_analise','em_execucao','aguardando_informacao','concluida','recusada')),
  responsavel uuid references auth.users(id) on delete set null,
  prazo date,
  resposta text check (char_length(coalesce(resposta, '')) <= 3000),
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
create index if not exists solicitacoes_status_idx on public.solicitacoes (status, prazo);
create index if not exists solicitacoes_user_idx on public.solicitacoes (user_id, criado desc);
alter table public.solicitacoes enable row level security;
create table if not exists public.solicitacao_eventos (
  id bigserial primary key,
  solicitacao_id uuid not null references public.solicitacoes(id) on delete cascade,
  autor uuid,
  status text,
  nota text,
  criado timestamptz not null default now()
);
alter table public.solicitacao_eventos enable row level security;
drop policy if exists sl_ler on public.solicitacoes;
create policy sl_ler on public.solicitacoes for select to authenticated using (user_id = auth.uid() or admin_ve('lgpd'));
drop policy if exists sl_criar on public.solicitacoes;
create policy sl_criar on public.solicitacoes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists sl_mudar on public.solicitacoes;
create policy sl_mudar on public.solicitacoes for update to authenticated using (admin_pode('lgpd'));
drop policy if exists se_ler on public.solicitacao_eventos;
create policy se_ler on public.solicitacao_eventos for select to authenticated using (admin_ve('lgpd') or exists (select 1 from solicitacoes s where s.id = solicitacao_id and s.user_id = auth.uid()));
create or replace function public.protege_solicitacao() returns trigger
language plpgsql security definer set search_path = public as $$
declare dias int := coalesce((select (valor #>> '{}')::int from seguranca_config where chave = 'prazo_lgpd_dias'), 15);
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid(); new.status := 'recebida'; new.responsavel := null; new.resposta := null; new.criado := now(); new.atualizado := now();
    new.prazo := current_date + dias;
    new.protocolo := 'CK-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    if (select count(*) from solicitacoes where user_id = auth.uid() and criado > now() - interval '1 day') >= 5 then raise exception 'limite de solicitacoes por dia'; end if;
    return new;
  end if;
  new.id := old.id; new.protocolo := old.protocolo; new.user_id := old.user_id; new.tipo := old.tipo; new.detalhe := old.detalhe; new.criado := old.criado; new.atualizado := now();
  return new;
end $$;
drop trigger if exists protege_solicitacao on public.solicitacoes;
create trigger protege_solicitacao before insert or update on public.solicitacoes for each row execute function public.protege_solicitacao();
create or replace function public.historico_solicitacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then insert into solicitacao_eventos (solicitacao_id, autor, status, nota) values (new.id, auth.uid(), new.status, 'Solicitação recebida');
  elsif new.status is distinct from old.status or new.responsavel is distinct from old.responsavel or new.resposta is distinct from old.resposta then
    insert into solicitacao_eventos (solicitacao_id, autor, status, nota) values (new.id, auth.uid(), new.status, case when new.resposta is distinct from old.resposta then 'Resposta registrada' else null end);
    perform auditar('lgpd_' || new.status, 'solicitacoes', new.protocolo);
  end if;
  return new;
end $$;
drop trigger if exists historico_solicitacao on public.solicitacoes;
create trigger historico_solicitacao after insert or update on public.solicitacoes for each row execute function public.historico_solicitacao();
-- nota administrativa avulsa no histórico
create or replace function public.nota_solicitacao(p_id uuid, p_nota text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('lgpd') then raise exception 'sem permissao'; end if;
  insert into solicitacao_eventos (solicitacao_id, autor, status, nota) values (p_id, auth.uid(), null, left(p_nota, 1000));
end $$;

