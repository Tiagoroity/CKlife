-- CK Life · Segurança · PARTE 3 de 5 (rode na ordem)
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

