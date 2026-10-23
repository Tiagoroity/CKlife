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

-- pacote dos MEUS dados (só da própria titular; sem conteúdo de outras pessoas)
create or replace function public.exportar_meus_dados() returns json
language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); r json;
begin
  if eu is null then return null; end if;
  select json_build_object(
    'gerado_em', now(),
    'aviso', 'Dados pessoais da titular. Mensagens de outras pessoas não são incluídas.',
    'conta', (select row_to_json(a) from (select id, email, nome, whats, nasc, cidade, criado, ultimo, premium, situacao, dados from alunas where id = eu) a),
    'perfil_social', (select row_to_json(p) from (select username, nome, bio, cidade, mostrar_cidade, interesses, objetivo, privado, mensagens, conquistas, criado from perfis where user_id = eu) p),
    'publicacoes', coalesce((select json_agg(json_build_object('id', id, 'texto', texto, 'tem_foto', midia is not null or img is not null, 'criado', criado)) from posts where user_id = eu), '[]'),
    'comentarios', coalesce((select json_agg(json_build_object('post_id', post_id, 'texto', texto, 'criado', criado)) from comentarios where user_id = eu), '[]'),
    'curtidas', coalesce((select json_agg(json_build_object('post_id', post_id, 'criado', criado)) from curtidas where user_id = eu), '[]'),
    'mensagens_enviadas', coalesce((select json_agg(json_build_object('conversa_id', conversa_id, 'tipo', tipo, 'texto', texto, 'criado', criado)) from mensagens where autor = eu), '[]'),
    'seguindo', coalesce((select json_agg(p.username) from seguidores s join perfis p on p.user_id = s.seguido where s.seguidor = eu and s.status = 'ativo'), '[]'),
    'quantidade_seguidoras', (select count(*) from seguidores where seguido = eu and status = 'ativo'),
    'bloqueios_feitos', (select count(*) from bloqueios where quem = eu),
    'stories_ativos', coalesce((select json_agg(json_build_object('texto', texto, 'criado', criado, 'expira', expira)) from stories where user_id = eu and expira > now()), '[]'),
    'agendamentos', coalesce((select json_agg(json_build_object('servico', servico_nome, 'com', alvo_nome, 'data', data, 'hora', hora, 'status', status)) from agendamentos where user_id = eu), '[]'),
    'avaliacoes', coalesce((select json_agg(json_build_object('nota', nota, 'texto', texto, 'criado', criado)) from avaliacoes where user_id = eu), '[]'),
    'meu_ciclo', (select dados from ciclo where user_id = eu),
    'consentimentos', coalesce((select json_agg(json_build_object('tipo', tipo, 'aceito', aceito, 'versao', versao, 'criado', criado) order by criado) from consentimentos where user_id = eu), '[]'),
    'solicitacoes', coalesce((select json_agg(json_build_object('protocolo', protocolo, 'tipo', tipo, 'status', status, 'criado', criado)) from solicitacoes where user_id = eu), '[]'),
    'denuncias_feitas', (select count(*) from denuncias where autor = eu)
  ) into r;
  perform auditar('exportacao_titular', 'dados', eu::text);
  return r;
end $$;

-- ELIMINAÇÃO controlada (executada pela equipe de privacidade, com etapas registradas)
create or replace function public.executar_eliminacao(p_solicitacao uuid, p_motivo text) returns json
language plpgsql security definer set search_path = public as $$
declare s solicitacoes; u uuid; n_posts int; n_com int; n_msg int; n_st int;
begin
  if not admin_pode('lgpd') then raise exception 'sem permissao'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  select * into s from solicitacoes where id = p_solicitacao; if not found then raise exception 'solicitacao nao encontrada'; end if;
  if s.tipo <> 'eliminacao' then raise exception 'solicitacao nao e de eliminacao'; end if;
  u := s.user_id;
  update alunas set situacao = 'em_exclusao', situacao_motivo = 'Eliminação LGPD ' || s.protocolo where id = u;
  -- conteúdo próprio: apagado
  select count(*) into n_posts from posts where user_id = u; delete from posts where user_id = u;
  select count(*) into n_st from stories where user_id = u; delete from stories where user_id = u;
  delete from curtidas where user_id = u; delete from salvos where user_id = u; delete from story_vistas where user_id = u;
  delete from seguidores where seguidor = u or seguido = u; delete from bloqueios where quem = u;
  delete from notificacoes where user_id = u or ator = u;
  delete from ciclo where user_id = u;
  -- conteúdo em conversas/posts de outras pessoas: anonimizado para não quebrar o histórico delas
  update comentarios set texto = '[comentário removido]', nome = 'Usuária removida', foto = null where user_id = u; get diagnostics n_com = row_count;
  update mensagens set texto = case when tipo = 'texto' then '[mensagem removida]' else null end, midia = null, tipo = 'texto' where autor = u; get diagnostics n_msg = row_count;
  update mensagens set texto = '[mensagem removida]' where autor = u and texto is null;
  update conversas set nome_a = case when a = u then 'Usuária removida' else nome_a end, foto_a = case when a = u then null else foto_a end,
                       nome_b = case when b = u then 'Usuária removida' else nome_b end, foto_b = case when b = u then null else foto_b end where u in (a, b);
  update avaliacoes set nome = 'Usuária removida', texto = null where user_id = u;
  update agendamentos set nome = 'Usuária removida', whats = null, obs = null where user_id = u;  -- VALIDAÇÃO JURÍDICA: prazo de guarda de registros comerciais
  delete from perfis where user_id = u;
  update alunas set nome = 'Usuária removida', whats = null, nasc = null, dados = '{}'::jsonb, situacao = 'excluida' where id = u;
  -- consentimentos, solicitações, denúncias e auditoria ficam guardados (prova de cumprimento) — VALIDAÇÃO JURÍDICA dos prazos
  update solicitacoes set status = 'concluida', resposta = coalesce(resposta, 'Dados eliminados/anonimizados conforme política.') where id = p_solicitacao;
  insert into solicitacao_eventos (solicitacao_id, autor, status, nota) values (p_solicitacao, auth.uid(), 'concluida',
    format('Eliminação executada. Posts apagados: %s; Stories apagados: %s; comentários anonimizados: %s; mensagens anonimizadas: %s. Pendente: apagar login em Authentication do Supabase e arquivos órfãos do storage.', n_posts, n_st, n_com, n_msg));
  perform auditar('eliminacao_executada', 'alunas', u::text, 'ok', p_motivo);
  return json_build_object('posts', n_posts, 'stories', n_st, 'comentarios', n_com, 'mensagens', n_msg);
end $$;

-- ---------- 7) Incidentes de segurança ----------
create table if not exists public.incidentes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  titulo text not null,
  descricao text,
  tipo text,
  ocorreu_em timestamptz,
  descoberto_em timestamptz not null default now(),
  dados_afetados text,
  categorias_titulares text,
  qtd_titulares int,
  sensiveis boolean not null default false,
  menores boolean not null default false,
  risco text not null default 'medio' check (risco in ('baixo','medio','alto','critico')),
  impacto text, causa text, contencao text, correcao text,
  responsavel uuid references auth.users(id) on delete set null,
  status text not null default 'detectado' check (status in ('detectado','investigando','contido','corrigido','monitorando','encerrado')),
  avaliar_comunicacao boolean not null default false,
  prazo_comunicacao date,
  decisao_comunicacao text,
  justificativa text,
  comunicado_anpd_em timestamptz,
  comunicado_titulares_em timestamptz,
  protocolo_anpd text,
  arquivado boolean not null default false,
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
alter table public.incidentes enable row level security;
create table if not exists public.incidente_eventos (
  id bigserial primary key,
  incidente_id uuid not null references public.incidentes(id),
  autor uuid, status text, nota text,
  criado timestamptz not null default now()
);
alter table public.incidente_eventos enable row level security;
drop policy if exists in_ler on public.incidentes;
create policy in_ler on public.incidentes for select to authenticated using (admin_ve('incidentes'));
drop policy if exists in_criar on public.incidentes;
create policy in_criar on public.incidentes for insert to authenticated with check (admin_pode('incidentes'));
drop policy if exists in_mudar on public.incidentes;
create policy in_mudar on public.incidentes for update to authenticated using (admin_pode('incidentes'));
drop policy if exists ie_ler on public.incidente_eventos;
create policy ie_ler on public.incidente_eventos for select to authenticated using (admin_ve('incidentes'));
create or replace function public.protege_incidente() returns trigger
language plpgsql security definer set search_path = public as $$
declare dias int := coalesce((select (valor #>> '{}')::int from seguranca_config where chave = 'prazo_anpd_dias_uteis'), 3); d date; n int := 0;
begin
  if tg_op = 'INSERT' then
    new.codigo := 'INC-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)); new.criado := now();
  else new.codigo := old.codigo; new.criado := old.criado; end if;
  new.atualizado := now();
  -- risco alto/crítico, dados sensíveis ou menores: marcar para avaliar comunicação (decisão é humana)
  if new.risco in ('alto','critico') or new.sensiveis or new.menores then new.avaliar_comunicacao := true; end if;
  if new.avaliar_comunicacao and new.prazo_comunicacao is null then
    d := new.descoberto_em::date;
    while n < dias loop d := d + 1; if extract(isodow from d) < 6 then n := n + 1; end if; end loop;
    new.prazo_comunicacao := d;
  end if;
  return new;
end $$;
drop trigger if exists protege_incidente on public.incidentes;
create trigger protege_incidente before insert or update on public.incidentes for each row execute function public.protege_incidente();
create or replace function public.historico_incidente() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status or new.arquivado is distinct from old.arquivado or new.decisao_comunicacao is distinct from old.decisao_comunicacao then
    insert into incidente_eventos (incidente_id, autor, status, nota) values (new.id, auth.uid(), new.status, case when tg_op = 'INSERT' then 'Registrado' when new.arquivado and not old.arquivado then 'Arquivado' when new.decisao_comunicacao is distinct from old.decisao_comunicacao then 'Decisão sobre comunicação registrada' else null end);
    perform auditar('incidente_' || case when tg_op = 'INSERT' then 'registrado' else new.status end, 'incidentes', new.codigo);
  end if;
  return new;
end $$;
drop trigger if exists historico_incidente on public.incidentes;
create trigger historico_incidente after insert or update on public.incidentes for each row execute function public.historico_incidente();
create or replace function public.nota_incidente(p_id uuid, p_nota text) returns void
language plpgsql security definer set search_path = public as $$
begin if not admin_pode('incidentes') then raise exception 'sem permissao'; end if;
  insert into incidente_eventos (incidente_id, autor, nota) values (p_id, auth.uid(), left(p_nota, 1500)); end $$;

-- ---------- 8) Retenção, inventário (mapa de dados) e RIPD ----------
create table if not exists public.retencao (
  categoria text primary key,
  finalidade text, prazo text not null default 'A DEFINIR — VALIDAÇÃO JURÍDICA NECESSÁRIA',
  regra text, acao text not null default 'conservar' check (acao in ('anonimizar','excluir','conservar')),
  validado boolean not null default false,
  atualizado timestamptz not null default now()
);
alter table public.retencao enable row level security;
drop policy if exists rt_ler on public.retencao;
create policy rt_ler on public.retencao for select to authenticated using (admin_ve('seguranca'));
drop policy if exists rt_mudar on public.retencao;
create policy rt_mudar on public.retencao for all to authenticated using (admin_pode('seguranca')) with check (admin_pode('seguranca'));
insert into public.retencao (categoria, finalidade, regra, acao) values
  ('Contas', 'Prestação do serviço', 'Enquanto a conta existir; depois, eliminação/anonimização', 'anonimizar'),
  ('Logs de auditoria', 'Rastreabilidade e defesa', 'Imutáveis no app', 'conservar'),
  ('Mensagens privadas', 'Comunicação entre alunas', 'Enquanto a conversa existir; anonimizadas na eliminação', 'anonimizar'),
  ('Stories', 'Compartilhamento temporário', 'Ocultos após 24h pelo banco; arquivo removido depois', 'excluir'),
  ('Mídia (fotos e áudios)', 'Conteúdo da comunidade e do chat', 'Removida com o conteúdo; órfãos limpos periodicamente', 'excluir'),
  ('Meu Ciclo (saúde)', 'Acompanhamento opcional', 'Apagado quando a aluna desativa ou pede eliminação', 'excluir'),
  ('Treinos e progresso', 'Evolução da aluna', 'Enquanto a conta existir', 'excluir'),
  ('Solicitações LGPD', 'Prova de atendimento', 'Guardadas após conclusão', 'conservar'),
  ('Incidentes', 'Obrigação de registro', 'Arquivados, não apagados', 'conservar'),
  ('Denúncias', 'Moderação e segurança', 'Guardadas após decisão', 'conservar'),
  ('Agendamentos', 'Relação com profissionais', 'Anonimizados na eliminação', 'anonimizar'),
  ('Transações (futuro)', 'Obrigações fiscais', 'Conforme lei fiscal', 'conservar')
on conflict (categoria) do nothing;

create table if not exists public.inventario (
  id uuid primary key default gen_random_uuid(),
  dado text not null, categoria text, coleta text, finalidade text,
  base_legal text not null default 'VALIDAÇÃO JURÍDICA NECESSÁRIA',
  origem text, armazenamento text, acesso text, terceiros text,
  sensivel boolean not null default false, retencao text, protecao text,
  atualizado timestamptz not null default now()
);
alter table public.inventario enable row level security;
drop policy if exists iv_ler on public.inventario;
create policy iv_ler on public.inventario for select to authenticated using (admin_ve('seguranca'));
drop policy if exists iv_mudar on public.inventario;
create policy iv_mudar on public.inventario for all to authenticated using (admin_pode('seguranca')) with check (admin_pode('seguranca'));
insert into public.inventario (dado, categoria, coleta, finalidade, origem, armazenamento, acesso, terceiros, sensivel, retencao, protecao)
select * from (values
  ('Nome, e-mail, WhatsApp, nascimento, cidade', 'Cadastro', 'Tela de cadastro', 'Conta e contato', 'Titular', 'Supabase (alunas)', 'Titular; admin (Alunas)', 'Supabase', false, 'Contas', 'RLS; admin por área'),
  ('Senha', 'Autenticação', 'Cadastro/login', 'Acesso', 'Titular', 'Supabase Auth (hash)', 'Ninguém (só hash)', 'Supabase', false, 'Contas', 'Hash pelo Supabase Auth'),
  ('Peso, medidas, treinos, alimentação', 'Saúde/bem-estar', 'App', 'Evolução e metas', 'Titular', 'Supabase (alunas.dados)', 'Titular; admin Alunas', 'Supabase', true, 'Treinos e progresso', 'RLS'),
  ('Meu Ciclo (datas, sintomas, check-ins)', 'Saúde (sensível)', 'Meu Ciclo (opcional)', 'Acompanhamento do ciclo', 'Titular', 'Supabase (ciclo)', 'Somente a titular', 'Supabase', true, 'Meu Ciclo (saúde)', 'RLS só dona; painel vê só totais'),
  ('Perfil social (foto, capa, bio, interesses)', 'Comunidade', 'Perfil', 'Rede social', 'Titular', 'Supabase (perfis) + bucket privado', 'Alunas logadas', 'Supabase', false, 'Contas', 'RLS + URLs temporárias'),
  ('Publicações, comentários, curtidas', 'Comunidade', 'Feed', 'Rede social', 'Titular', 'Supabase', 'Conforme privacidade do perfil', 'Supabase', false, 'Contas', 'RLS'),
  ('Mensagens, fotos e áudios do chat', 'Comunicação privada', 'Chat', 'Conversa entre alunas', 'Titular', 'Supabase + bucket privado', 'Só as participantes', 'Supabase', false, 'Mensagens privadas', 'RLS; painel só vê o denunciado'),
  ('Stories', 'Comunidade', 'Stories', 'Compartilhamento temporário', 'Titular', 'Supabase + bucket privado', 'Conforme privacidade', 'Supabase', false, 'Stories', 'Expira em 24h no banco'),
  ('Agendamentos', 'Serviços', 'Explorar', 'Marcar atendimento', 'Titular', 'Supabase', 'Titular; admin Agendamentos', 'Supabase', false, 'Agendamentos', 'RLS'),
  ('Eventos de uso (visto/clique)', 'Métricas', 'App', 'Métricas de anúncios e Explorar', 'Titular', 'Supabase (eventos)', 'Admin Métricas', 'Supabase', false, 'Logs de auditoria', 'Sem conteúdo pessoal'),
  ('Compras Premium', 'Pagamento', 'Kiwify', 'Liberar Premium', 'Kiwify', 'Supabase (compras)', 'Admin', 'Kiwify, Supabase', false, 'Transações (futuro)', 'Só servidor grava')
) v where not exists (select 1 from public.inventario);

create table if not exists public.ripd (
  id uuid primary key default gen_random_uuid(),
  processo text not null, dados text, finalidade text,
  risco text, probabilidade text check (probabilidade in ('baixa','media','alta')), impacto text check (impacto in ('baixo','medio','alto')),
  salvaguardas text, mitigacao text, responsavel text, revisao date, documentos text,
  status text not null default 'rascunho' check (status in ('rascunho','em_revisao','aprovado')),
  atualizado timestamptz not null default now()
);
alter table public.ripd enable row level security;
drop policy if exists rp_ler on public.ripd;
create policy rp_ler on public.ripd for select to authenticated using (admin_ve('seguranca'));
drop policy if exists rp_mudar on public.ripd;
create policy rp_mudar on public.ripd for all to authenticated using (admin_pode('seguranca')) with check (admin_pode('seguranca'));
insert into public.ripd (processo, dados, finalidade, risco, probabilidade, impacto, salvaguardas, mitigacao, status)
select * from (values
  ('Meu Ciclo', 'Datas do ciclo, sintomas, humor, check-ins', 'Acompanhamento opcional do ciclo', 'Exposição de dado de saúde', 'baixa', 'alto', 'Opt-in; RLS só dona; painel só totais; sem uso comercial', 'Revisar com jurídico; avaliar criptografia adicional', 'rascunho'),
  ('Chat privado', 'Mensagens, fotos e áudios entre alunas', 'Comunicação', 'Acesso indevido a conversas', 'baixa', 'alto', 'RLS por participante; bucket privado; URLs temporárias; moderação só do denunciado', 'Revisar com jurídico', 'rascunho')
) v where not exists (select 1 from public.ripd);

-- ---------- 9) Denúncias: mais tipos, prioridade, estado do conteúdo e histórico ----------
alter table public.denuncias drop constraint if exists denuncias_tipo_check;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'denuncias_tipo_ok') then
    alter table public.denuncias add constraint denuncias_tipo_ok check (tipo in ('perfil','post','comentario','story','mensagem','profissional','empresa','comercial'));
  end if;
end $$;
alter table public.denuncias add column if not exists prioridade text not null default 'normal';
alter table public.denuncias add column if not exists estado_conteudo text not null default 'ativo';
alter table public.denuncias add column if not exists moderador uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'denuncias_prio_ok') then
    alter table public.denuncias add constraint denuncias_prio_ok check (prioridade in ('baixa','normal','alta','critica') and estado_conteudo in ('ativo','ocultado','removido','preservado'));
  end if;
end $$;
create or replace function public.protege_denuncia() returns trigger
language plpgsql security definer set search_path = public as $$
declare dono uuid;
begin
  new.autor := auth.uid(); new.status := 'aberta'; new.acao := null; new.criado := now(); new.resolvido_por := null; new.resolvido_em := null; new.moderador := null; new.estado_conteudo := 'ativo';
  new.prioridade := case when new.motivo = 'assedio' then 'alta' else 'normal' end;
  if (select count(*) from denuncias where autor = auth.uid() and criado > now() - interval '1 hour') >= 10 then raise exception 'limite de denuncias por hora'; end if;
  if new.tipo = 'perfil' then dono := new.alvo_id::uuid;
  elsif new.tipo = 'post' then select user_id into dono from posts where id = new.alvo_id::uuid and pode_ver(user_id);
  elsif new.tipo = 'comentario' then select user_id into dono from comentarios where id = new.alvo_id::uuid;
  elsif new.tipo = 'story' then select user_id into dono from stories where id = new.alvo_id::uuid;
  elsif new.tipo = 'mensagem' then select m.autor into dono from mensagens m where m.id = new.alvo_id::uuid and e_participante(m.conversa_id) and m.autor <> auth.uid();
  elsif new.tipo in ('profissional','empresa','comercial') then dono := null; return new;  -- catálogo do painel (sem conta de aluna)
  end if;
  if dono is null then raise exception 'conteudo nao encontrado'; end if;
  -- várias denúncias contra a mesma pessoa em 24h sobem a prioridade
  if (select count(*) from denuncias where alvo_user = dono and criado > now() - interval '1 day') >= 2 then new.prioridade := 'critica'; end if;
  new.alvo_user := dono;
  return new;
end $$;
-- acessar o conteúdo denunciado fica registrado
create or replace function public.denuncia_conteudo(p_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare d denuncias; r json;
begin
  if not admin_ve('moderacao') then perform auditar('acesso_negado', 'denuncias', p_id::text, 'negado'); return null; end if;
  select * into d from denuncias where id = p_id; if not found then return null; end if;
  if d.tipo = 'post' then select json_build_object('texto', texto, 'midia', midia, 'img', img, 'oculto', oculto) into r from posts where id = d.alvo_id::uuid;
  elsif d.tipo = 'comentario' then select json_build_object('texto', texto, 'oculto', oculto) into r from comentarios where id = d.alvo_id::uuid;
  elsif d.tipo = 'story' then select json_build_object('texto', texto, 'midia', midia, 'oculto', oculto, 'expira', expira) into r from stories where id = d.alvo_id::uuid;
  elsif d.tipo = 'mensagem' then select json_build_object('texto', texto, 'midia', midia, 'tipo', tipo, 'oculto', oculto_mod, 'criado', criado) into r from mensagens where id = d.alvo_id::uuid;
  elsif d.tipo = 'perfil' then select json_build_object('nome', nome, 'username', username, 'bio', bio, 'foto', foto, 'capa', capa) into r from perfis where user_id = d.alvo_id::uuid;
  else r := json_build_object('texto', 'Item do catálogo: ' || d.alvo_id);
  end if;
  perform auditar('acesso_conteudo_denunciado', 'denuncias', p_id::text, 'ok', d.tipo);
  return coalesce(r, json_build_object('removido', true));
end $$;
create table if not exists public.denuncia_eventos (
  id bigserial primary key, denuncia_id uuid not null references public.denuncias(id) on delete cascade,
  autor uuid, acao text, nota text, criado timestamptz not null default now()
);
alter table public.denuncia_eventos enable row level security;
drop policy if exists de_ler on public.denuncia_eventos;
create policy de_ler on public.denuncia_eventos for select to authenticated using (admin_ve('moderacao'));
create or replace function public.moderar(p_id uuid, p_acao text) returns boolean
language plpgsql security definer set search_path = public as $$
declare d denuncias;
begin
  if not admin_pode('moderacao') then perform auditar('acesso_negado', 'moderacao', p_id::text, 'negado'); raise exception 'sem permissao'; end if;
  select * into d from denuncias where id = p_id; if not found then return false; end if;
  if p_acao in ('ocultar','restaurar','preservar') then
    if d.tipo = 'post' then update posts set oculto = (p_acao <> 'restaurar') where id = d.alvo_id::uuid;
    elsif d.tipo = 'comentario' then update comentarios set oculto = (p_acao <> 'restaurar') where id = d.alvo_id::uuid;
    elsif d.tipo = 'story' then update stories set oculto = (p_acao <> 'restaurar') where id = d.alvo_id::uuid;
    elsif d.tipo = 'mensagem' then update mensagens set oculto_mod = (p_acao <> 'restaurar') where id = d.alvo_id::uuid;
    end if;
    update denuncias set estado_conteudo = case p_acao when 'ocultar' then 'ocultado' when 'preservar' then 'preservado' else 'ativo' end where id = p_id;
  elsif p_acao = 'suspender' then update alunas set situacao = 'suspensa', situacao_motivo = 'Moderação: denúncia ' || p_id where id = d.alvo_user;
  elsif p_acao = 'reativar' then update alunas set situacao = 'ativa', situacao_motivo = null where id = d.alvo_user;
  elsif p_acao in ('prioridade_alta','prioridade_critica','prioridade_normal') then update denuncias set prioridade = replace(p_acao, 'prioridade_', '') where id = p_id;
  elsif p_acao not in ('resolver','descartar') then raise exception 'acao invalida';
  end if;
  if p_acao not like 'prioridade_%' then
    update denuncias set status = case when p_acao = 'descartar' then 'descartada' when p_acao in ('restaurar','reativar','preservar') then status else 'resolvida' end,
      acao = p_acao, resolvido_por = auth.uid(), resolvido_em = now(), moderador = auth.uid() where id = p_id;
  end if;
  insert into moderacao_log (admin, denuncia_id, acao, alvo_tipo, alvo_id, alvo_user) values (auth.uid(), p_id, p_acao, d.tipo, d.alvo_id, d.alvo_user);
  insert into denuncia_eventos (denuncia_id, autor, acao) values (p_id, auth.uid(), p_acao);
  perform auditar('moderacao_' || p_acao, 'denuncias', p_id::text);
  return true;
end $$;

-- ---------- 10) Limites contra abuso (no banco, não só no app) ----------
create index if not exists comentarios_user_idx on public.comentarios (user_id, criado);
create index if not exists mensagens_autor_idx on public.mensagens (autor, criado);
create index if not exists curtidas_user_idx on public.curtidas (user_id, criado);
create index if not exists seguidores_seguidor_idx on public.seguidores (seguidor, criado);
create or replace function public.limite_uso() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; lim int; jan interval; col text := tg_argv[0];
begin
  if e_admin() then return new; end if;
  lim := tg_argv[1]::int; jan := tg_argv[2]::interval;
  execute format('select count(*) from %I where %I = $1 and criado > now() - $2', tg_table_name, col) into n using auth.uid(), jan;
  if n >= lim then raise exception 'muitas acoes em pouco tempo, tente mais tarde'; end if;
  return new;
end $$;
drop trigger if exists limite_posts on public.posts;
create trigger limite_posts before insert on public.posts for each row execute function public.limite_uso('user_id', '10', '10 minutes');
drop trigger if exists limite_comentarios on public.comentarios;
create trigger limite_comentarios before insert on public.comentarios for each row execute function public.limite_uso('user_id', '30', '10 minutes');
drop trigger if exists limite_mensagens on public.mensagens;
create trigger limite_mensagens before insert on public.mensagens for each row execute function public.limite_uso('autor', '60', '1 minute');
drop trigger if exists limite_curtidas on public.curtidas;
create trigger limite_curtidas before insert on public.curtidas for each row execute function public.limite_uso('user_id', '200', '10 minutes');
drop trigger if exists limite_seguir on public.seguidores;
create trigger limite_seguir before insert on public.seguidores for each row execute function public.limite_uso('seguidor', '80', '1 hour');

-- ---------- 11) Painel: números e verificações técnicas reais ----------
create or replace function public.seguranca_resumo() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('seguranca') then return null; end if;
  return json_build_object(
    'usuarias', (select count(*) from alunas),
    'ativas_30d', (select count(distinct user_id) from acessos where dia > current_date - 30),
    'suspensas', (select count(*) from alunas where situacao = 'suspensa'),
    'bloqueadas', (select count(*) from alunas where situacao = 'bloqueada' or (bloqueado and situacao = 'ativa')),
    'em_exclusao', (select count(*) from alunas where situacao = 'em_exclusao'),
    'denuncias_abertas', (select count(*) from denuncias where status = 'aberta'),
    'denuncias_criticas', (select count(*) from denuncias where status = 'aberta' and prioridade in ('alta','critica')),
    'denuncias_24h', (select count(*) from denuncias where criado > now() - interval '1 day'),
    'lgpd_abertas', (select count(*) from solicitacoes where status not in ('concluida','recusada')),
    'lgpd_exclusao', (select count(*) from solicitacoes where tipo = 'eliminacao' and status not in ('concluida','recusada')),
    'lgpd_vencendo', (select count(*) from solicitacoes where status not in ('concluida','recusada') and prazo <= current_date + 2),
    'incidentes_abertos', (select count(*) from incidentes where status <> 'encerrado' and not arquivado),
    'incidentes_analise', (select count(*) from incidentes where status in ('detectado','investigando')),
    'incidentes_comunicacao', (select count(*) from incidentes where avaliar_comunicacao and decisao_comunicacao is null and not arquivado),
    'acessos_admin_7d', (select count(*) from auditoria where acao = 'login_admin' and criado > now() - interval '7 days'),
    'acessos_negados_7d', (select count(*) from auditoria where resultado = 'negado' and criado > now() - interval '7 days'),
    'config_alterada_7d', (select count(*) from auditoria where recurso = 'seguranca_config' and criado > now() - interval '7 days'),
    'midias_privadas', (select count(*) from storage.objects where bucket_id = 'social'),
    'docs_publicados', (select count(*) from documentos where status = 'publicado'),
    'retencao_pendente', (select count(*) from retencao where not validado),
    'inventario_pendente', (select count(*) from inventario where base_legal = 'VALIDAÇÃO JURÍDICA NECESSÁRIA'),
    'ciclo_ativas', (select count(*) from ciclo where ativo)
  );
end $$;
create or replace function public.seguranca_checagens() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('seguranca') then return null; end if;
  return json_build_object(
    'tabelas_sem_rls', coalesce((select json_agg(c.relname) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), '[]'),
    'buckets', coalesce((select json_agg(json_build_object('id', b.id, 'publico', b.public, 'limite', b.file_size_limit, 'tipos', b.allowed_mime_types, 'arquivos', (select count(*) from storage.objects o where o.bucket_id = b.id))) from storage.buckets b), '[]'),
    'orfaos_social', (select count(*) from storage.objects o where o.bucket_id = 'social'
        and not exists (select 1 from posts p where p.midia = o.name) and not exists (select 1 from stories s where s.midia = o.name)
        and not exists (select 1 from mensagens m where m.midia = o.name) and not exists (select 1 from perfis f where f.foto = o.name or f.capa = o.name)),
    'stories_vencidos_com_arquivo', (select count(*) from storage.objects o where o.bucket_id = 'social' and o.name like 'story/%' and not exists (select 1 from stories s where s.midia = o.name and s.expira > now())),
    'conteudo_moderado', (select count(*) from posts where oculto) + (select count(*) from comentarios where oculto) + (select count(*) from mensagens where oculto_mod) + (select count(*) from stories where oculto),
    'admins_total', (select count(*) from admins where coalesce((perms->>'total')::boolean, false)),
    'admins', (select count(*) from admins),
    'mfa_obrigatorio', config_valor('mfa_admin_obrigatorio'),
    'idade_minima', config_valor('idade_minima'),
    'idade_validada', config_valor('idade_validada'),
    'auditoria_imutavel', exists (select 1 from pg_trigger where tgname = 'auditoria_imutavel'),
    'limites_ativos', (select count(*) from pg_trigger where tgname like 'limite_%')
  );
end $$;
-- só a área de segurança muda a configuração; tudo registrado
drop policy if exists sc_ler on public.seguranca_config;
create policy sc_ler on public.seguranca_config for select using (chave in ('idade_minima','plataforma','encarregado') or admin_ve('seguranca'));
drop policy if exists sc_mudar on public.seguranca_config;
create policy sc_mudar on public.seguranca_config for update to authenticated using (admin_pode('seguranca')) with check (admin_pode('seguranca'));
create or replace function public.audita_config() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.atualizado := now(); new.atualizado_por := auth.uid(); new.chave := old.chave;
  perform auditar('config_alterada', 'seguranca_config', new.chave, 'ok', old.valor::text || ' -> ' || new.valor::text);
  return new;
end $$;
drop trigger if exists audita_config on public.seguranca_config;
create trigger audita_config before update on public.seguranca_config for each row execute function public.audita_config();

select 'Segurança e privacidade prontas' as status;
