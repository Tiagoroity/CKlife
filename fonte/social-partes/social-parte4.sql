-- CK Life · Rede social · PARTE 4 de 5 (rode na ordem, uma de cada vez)
-- ---------- 6) Notificações internas (criadas pelo banco, sem duplicar) ----------
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ator uuid references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('seguiu','solicitou','aceitou','curtida','comentario','mensagem','story_resposta','conquista','sistema')),
  ref text not null default '',
  texto text check (char_length(coalesce(texto, '')) <= 200),
  lida boolean not null default false,
  criado timestamptz not null default now()
);
create index if not exists notificacoes_user_idx on public.notificacoes (user_id, criado desc);
create unique index if not exists notificacoes_unica_idx on public.notificacoes (user_id, tipo, ref, coalesce(ator, '00000000-0000-0000-0000-000000000000'::uuid));
alter table public.notificacoes enable row level security;
drop policy if exists nt_ler on public.notificacoes;
create policy nt_ler on public.notificacoes for select to authenticated using (user_id = auth.uid());
drop policy if exists nt_mudar on public.notificacoes;
create policy nt_mudar on public.notificacoes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists nt_apagar on public.notificacoes;
create policy nt_apagar on public.notificacoes for delete to authenticated using (user_id = auth.uid());
drop policy if exists nt_criar on public.notificacoes;
create policy nt_criar on public.notificacoes for insert to authenticated with check (user_id = auth.uid() and ator is null and tipo = 'conquista');
create or replace function public.protege_notificacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and auth.uid() = old.user_id then
    new.id := old.id; new.user_id := old.user_id; new.ator := old.ator; new.tipo := old.tipo; new.ref := old.ref; new.texto := old.texto; new.criado := old.criado;
  end if;
  return new;
end $$;
drop trigger if exists protege_notificacao on public.notificacoes;
create trigger protege_notificacao before update on public.notificacoes for each row execute function public.protege_notificacao();
create or replace function public.notificar(p_user uuid, p_ator uuid, p_tipo text, p_ref text, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = p_ator or (p_ator is not null and bloqueio_entre(p_user, p_ator)) then return; end if;
  insert into notificacoes (user_id, ator, tipo, ref, texto) values (p_user, p_ator, p_tipo, coalesce(p_ref, ''), p_texto)
  on conflict (user_id, tipo, ref, coalesce(ator, '00000000-0000-0000-0000-000000000000'::uuid)) do update set criado = now(), lida = false, texto = excluded.texto;
end $$;
revoke execute on function public.notificar(uuid, uuid, text, text, text) from public, anon, authenticated;
create or replace function public.nome_de(u uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select split_part(nome, ' ', 1) from perfis where user_id = u), (select split_part(coalesce(nome, 'Uma aluna'), ' ', 1) from alunas where id = u), 'Uma aluna')
$$;
create or replace function public.nt_seguir() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform notificar(new.seguido, new.seguidor, case when new.status = 'pendente' then 'solicitou' else 'seguiu' end, '',
      nome_de(new.seguidor) || case when new.status = 'pendente' then ' pediu para seguir você.' else ' começou a seguir você.' end);
  elsif tg_op = 'UPDATE' and old.status = 'pendente' and new.status = 'ativo' then
    perform notificar(new.seguidor, new.seguido, 'aceitou', '', nome_de(new.seguido) || ' aceitou seu pedido para seguir.');
    delete from notificacoes where user_id = new.seguido and ator = new.seguidor and tipo = 'solicitou';
  end if;
  return new;
end $$;
drop trigger if exists nt_seguir on public.seguidores;
create trigger nt_seguir after insert or update on public.seguidores for each row execute function public.nt_seguir();
create or replace function public.nt_curtida() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notificar((select user_id from posts where id = new.post_id), new.user_id, 'curtida', new.post_id::text, nome_de(new.user_id) || ' curtiu sua publicação.');
  return new;
end $$;
drop trigger if exists nt_curtida on public.curtidas;
create trigger nt_curtida after insert on public.curtidas for each row execute function public.nt_curtida();
create or replace function public.nt_comentario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notificar((select user_id from posts where id = new.post_id), new.user_id, 'comentario', new.post_id::text, nome_de(new.user_id) || ' comentou: ' || left(new.texto, 80));
  return new;
end $$;
drop trigger if exists nt_comentario on public.comentarios;
create trigger nt_comentario after insert on public.comentarios for each row execute function public.nt_comentario();
create or replace function public.nt_mensagem() returns trigger
language plpgsql security definer set search_path = public as $$
declare dest uuid;
begin
  select case when c.a = new.autor then c.b else c.a end into dest from conversas c where c.id = new.conversa_id;
  perform notificar(dest, new.autor, case when new.tipo = 'story' then 'story_resposta' else 'mensagem' end, new.conversa_id::text,
    nome_de(new.autor) || case new.tipo when 'story' then ' respondeu seu Story.' when 'foto' then ' enviou uma foto.' when 'audio' then ' enviou um áudio.' else ' enviou uma mensagem.' end);
  return new;
end $$;
drop trigger if exists nt_mensagem on public.mensagens;
create trigger nt_mensagem after insert on public.mensagens for each row execute function public.nt_mensagem();

-- ---------- 7) Denúncias e moderação (sem navegar livremente pelos chats) ----------
create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('perfil','post','comentario','story','mensagem')),
  alvo_id text not null,
  alvo_user uuid references auth.users(id) on delete set null,
  motivo text not null check (motivo in ('assedio','improprio','spam','ofensivo','outro')),
  detalhe text check (char_length(coalesce(detalhe, '')) <= 500),
  status text not null default 'aberta' check (status in ('aberta','resolvida','descartada')),
  acao text,
  criado timestamptz not null default now(),
  resolvido_por uuid references auth.users(id) on delete set null,
  resolvido_em timestamptz
);
create index if not exists denuncias_status_idx on public.denuncias (status, criado desc);
alter table public.denuncias enable row level security;
create or replace function public.protege_denuncia() returns trigger
language plpgsql security definer set search_path = public as $$
declare dono uuid;
begin
  new.autor := auth.uid(); new.status := 'aberta'; new.acao := null; new.criado := now(); new.resolvido_por := null; new.resolvido_em := null;
  -- quem denuncia precisa conseguir ver o conteúdo; o dono é descoberto pelo banco
  if new.tipo = 'perfil' then dono := new.alvo_id::uuid;
  elsif new.tipo = 'post' then select user_id into dono from posts where id = new.alvo_id::uuid and pode_ver(user_id);
  elsif new.tipo = 'comentario' then select user_id into dono from comentarios where id = new.alvo_id::uuid;
  elsif new.tipo = 'story' then select user_id into dono from stories where id = new.alvo_id::uuid;
  elsif new.tipo = 'mensagem' then select m.autor into dono from mensagens m where m.id = new.alvo_id::uuid and e_participante(m.conversa_id) and m.autor <> auth.uid();
  end if;
  if dono is null then raise exception 'conteudo nao encontrado'; end if;
  new.alvo_user := dono;
  return new;
end $$;
drop trigger if exists protege_denuncia on public.denuncias;
create trigger protege_denuncia before insert on public.denuncias for each row execute function public.protege_denuncia();
drop policy if exists dn_criar on public.denuncias;
create policy dn_criar on public.denuncias for insert to authenticated with check (autor = auth.uid());
drop policy if exists dn_ler on public.denuncias;
create policy dn_ler on public.denuncias for select to authenticated using (autor = auth.uid() or admin_ve('moderacao'));

create table if not exists public.moderacao_log (
  id uuid primary key default gen_random_uuid(),
  admin uuid references auth.users(id) on delete set null,
  denuncia_id uuid references public.denuncias(id) on delete set null,
  acao text not null,
  alvo_tipo text, alvo_id text, alvo_user uuid,
  criado timestamptz not null default now()
);
alter table public.moderacao_log enable row level security;
drop policy if exists ml_ler on public.moderacao_log;
create policy ml_ler on public.moderacao_log for select to authenticated using (admin_ve('moderacao'));

-- o painel só vê o conteúdo EXATO que foi denunciado
create or replace function public.denuncia_conteudo(p_id uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare d denuncias; r json;
begin
  if not admin_ve('moderacao') then return null; end if;
  select * into d from denuncias where id = p_id; if not found then return null; end if;
  if d.tipo = 'post' then select json_build_object('texto', texto, 'midia', midia, 'img', img, 'oculto', oculto) into r from posts where id = d.alvo_id::uuid;
  elsif d.tipo = 'comentario' then select json_build_object('texto', texto, 'oculto', oculto) into r from comentarios where id = d.alvo_id::uuid;
  elsif d.tipo = 'story' then select json_build_object('texto', texto, 'midia', midia, 'oculto', oculto, 'expira', expira) into r from stories where id = d.alvo_id::uuid;
  elsif d.tipo = 'mensagem' then select json_build_object('texto', texto, 'midia', midia, 'tipo', tipo, 'oculto', oculto_mod, 'criado', criado) into r from mensagens where id = d.alvo_id::uuid;
  elsif d.tipo = 'perfil' then select json_build_object('nome', nome, 'username', username, 'bio', bio, 'foto', foto, 'capa', capa) into r from perfis where user_id = d.alvo_id::uuid;
  end if;
  return coalesce(r, json_build_object('removido', true));
end $$;
create or replace function public.moderar(p_id uuid, p_acao text) returns boolean
language plpgsql security definer set search_path = public as $$
declare d denuncias;
begin
  if not admin_pode('moderacao') then raise exception 'sem permissao'; end if;
  select * into d from denuncias where id = p_id; if not found then return false; end if;
  if p_acao in ('ocultar','restaurar') then
    if d.tipo = 'post' then update posts set oculto = (p_acao = 'ocultar') where id = d.alvo_id::uuid;
    elsif d.tipo = 'comentario' then update comentarios set oculto = (p_acao = 'ocultar') where id = d.alvo_id::uuid;
    elsif d.tipo = 'story' then update stories set oculto = (p_acao = 'ocultar') where id = d.alvo_id::uuid;
    elsif d.tipo = 'mensagem' then update mensagens set oculto_mod = (p_acao = 'ocultar') where id = d.alvo_id::uuid;
    end if;
  elsif p_acao = 'suspender' then update alunas set bloqueado = true where id = d.alvo_user;
  elsif p_acao = 'reativar' then update alunas set bloqueado = false where id = d.alvo_user;
  elsif p_acao not in ('resolver','descartar') then raise exception 'acao invalida';
  end if;
  update denuncias set status = case when p_acao = 'descartar' then 'descartada' when p_acao in ('restaurar','reativar') then status else 'resolvida' end,
    acao = p_acao, resolvido_por = auth.uid(), resolvido_em = now() where id = p_id;
  insert into moderacao_log (admin, denuncia_id, acao, alvo_tipo, alvo_id, alvo_user) values (auth.uid(), p_id, p_acao, d.tipo, d.alvo_id, d.alvo_user);
  return true;
end $$;

select 'Parte 4 pronta' as status;
