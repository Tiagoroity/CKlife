-- CK Life · Segurança · PARTE 4 de 5 (rode na ordem)
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

