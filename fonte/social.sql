-- =====================================================================
-- CK Life · Rede social: perfis, seguidores, bloqueios, denúncias, Stories,
-- chat com fotos/áudio e status, notificações e mídia PRIVADA.
-- Só ADICIONA (e afrouxa uma regra antiga do texto da mensagem para aceitar foto/áudio).
-- Não apaga tabela nem dado. Pode rodar mais de uma vez.
-- Supabase > SQL Editor > New query > colar > Run.
-- =====================================================================

-- ---------- 1) Perfil social ----------
create table if not exists public.perfis (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  username text not null,
  nome text not null,
  bio text check (char_length(coalesce(bio, '')) <= 160),
  cidade int,
  mostrar_cidade boolean not null default false,
  interesses text[] not null default '{}',
  objetivo text,
  mostrar_objetivo boolean not null default false,
  foto text,            -- caminho no bucket privado "social" (nunca URL pública)
  capa text,            -- idem
  foto_mini text,       -- miniatura bem pequena (data URL) para listas
  privado boolean not null default false,
  mensagens text not null default 'todas' check (mensagens in ('todas','seguindo','ninguem')),
  mostrar_conquistas boolean not null default true,
  conquistas jsonb not null default '[]'::jsonb,
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now(),
  constraint perfis_username_formato check (username ~ '^[a-z0-9._]{3,20}$'),
  constraint perfis_mini_tamanho check (char_length(coalesce(foto_mini, '')) <= 20000)
);
create unique index if not exists perfis_username_idx on public.perfis (lower(username));
alter table public.perfis enable row level security;

-- ---------- 2) Bloqueios e seguidores ----------
create table if not exists public.bloqueios (
  quem uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bloqueado uuid not null references auth.users(id) on delete cascade,
  criado timestamptz not null default now(),
  primary key (quem, bloqueado), check (quem <> bloqueado)
);
create index if not exists bloqueios_bloqueado_idx on public.bloqueios (bloqueado);
alter table public.bloqueios enable row level security;

create table if not exists public.seguidores (
  seguidor uuid not null default auth.uid() references auth.users(id) on delete cascade,
  seguido uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ativo' check (status in ('ativo','pendente')),
  criado timestamptz not null default now(),
  primary key (seguidor, seguido), check (seguidor <> seguido)
);
create index if not exists seguidores_seguido_idx on public.seguidores (seguido, status);
alter table public.seguidores enable row level security;

create or replace function public.bloqueio_entre(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bloqueios where (quem = x and bloqueado = y) or (quem = y and bloqueado = x))
$$;
create or replace function public.segue(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from seguidores where seguidor = x and seguido = y and status = 'ativo')
$$;
-- quem está logada pode ver o conteúdo de "alvo"? (perfil público, ou privado e eu sigo; nunca com bloqueio)
create or replace function public.pode_ver(alvo uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    alvo = auth.uid() or (
      not bloqueio_entre(auth.uid(), alvo)
      and (not coalesce((select privado from perfis where user_id = alvo), false) or segue(auth.uid(), alvo))
    ))
$$;
-- quem está logada pode mandar mensagem para "dest"?
create or replace function public.pode_mensagem(dest uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and dest <> auth.uid() and not bloqueio_entre(auth.uid(), dest)
    and case coalesce((select mensagens from perfis where user_id = dest), 'todas')
          when 'todas' then true
          when 'seguindo' then segue(dest, auth.uid()) or exists (select 1 from conversas c where (c.a = dest and c.b = auth.uid()) or (c.b = dest and c.a = auth.uid()))
          else exists (select 1 from conversas c where (c.a = dest and c.b = auth.uid()) or (c.b = dest and c.a = auth.uid())) end
$$;
-- admin com acesso total ou à área (ver ou editar)
create or replace function public.admin_ve(p_area text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid() and (coalesce((perms->>'total')::boolean, false) or perms ? p_area))
$$;

-- perfis: qualquer logada vê nome/foto/bio de quem não a bloqueou (posts continuam protegidos pelo pode_ver)
drop policy if exists perfis_ler on public.perfis;
create policy perfis_ler on public.perfis for select to authenticated using (user_id = auth.uid() or not bloqueio_entre(auth.uid(), user_id) or e_admin());
drop policy if exists perfis_criar on public.perfis;
create policy perfis_criar on public.perfis for insert to authenticated with check (user_id = auth.uid());
drop policy if exists perfis_mudar on public.perfis;
create policy perfis_mudar on public.perfis for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function public.protege_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.username := lower(new.username);
  new.atualizado := now();
  if tg_op = 'INSERT' then new.user_id := auth.uid(); new.criado := now(); end if;
  if tg_op = 'UPDATE' then new.user_id := old.user_id; new.criado := old.criado; end if;
  -- fotos só podem apontar para a pasta da própria usuária
  if new.foto is not null and new.foto not like 'perfil/' || new.user_id::text || '/%' then new.foto := (case when tg_op = 'UPDATE' then old.foto else null end); end if;
  if new.capa is not null and new.capa not like 'perfil/' || new.user_id::text || '/%' then new.capa := (case when tg_op = 'UPDATE' then old.capa else null end); end if;
  return new;
end $$;
drop trigger if exists protege_perfil on public.perfis;
create trigger protege_perfil before insert or update on public.perfis for each row execute function public.protege_perfil();
create or replace function public.username_livre(u text) returns boolean
language sql stable security definer set search_path = public as $$
  select lower(u) ~ '^[a-z0-9._]{3,20}$' and not exists (select 1 from perfis where lower(username) = lower(u) and user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid))
$$;
-- contagens confiáveis calculadas no banco
create or replace function public.perfil_contagens(alvo uuid) returns json
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null or bloqueio_entre(auth.uid(), alvo) then null else json_build_object(
    'posts', (select count(*) from posts where user_id = alvo and not oculto),
    'seguidores', (select count(*) from seguidores where seguido = alvo and status = 'ativo'),
    'seguindo', (select count(*) from seguidores where seguidor = alvo and status = 'ativo'),
    'eu_sigo', (select status from seguidores where seguidor = auth.uid() and seguido = alvo),
    'me_segue', segue(alvo, auth.uid())
  ) end
$$;

-- bloqueios: só a própria vê e mexe nos seus bloqueios; bloquear desfaz o seguir nos dois sentidos
drop policy if exists bl_ler on public.bloqueios;
create policy bl_ler on public.bloqueios for select to authenticated using (quem = auth.uid());
drop policy if exists bl_criar on public.bloqueios;
create policy bl_criar on public.bloqueios for insert to authenticated with check (quem = auth.uid());
drop policy if exists bl_apagar on public.bloqueios;
create policy bl_apagar on public.bloqueios for delete to authenticated using (quem = auth.uid());
create or replace function public.ao_bloquear() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from seguidores where (seguidor = new.quem and seguido = new.bloqueado) or (seguidor = new.bloqueado and seguido = new.quem);
  return new;
end $$;
drop trigger if exists ao_bloquear on public.bloqueios;
create trigger ao_bloquear after insert on public.bloqueios for each row execute function public.ao_bloquear();

-- seguidores
drop policy if exists sg_ler on public.seguidores;
create policy sg_ler on public.seguidores for select to authenticated using (
  seguidor = auth.uid() or seguido = auth.uid() or (status = 'ativo' and (pode_ver(seguidor) or pode_ver(seguido))));
drop policy if exists sg_criar on public.seguidores;
create policy sg_criar on public.seguidores for insert to authenticated with check (seguidor = auth.uid() and not bloqueio_entre(seguidor, seguido));
drop policy if exists sg_mudar on public.seguidores;
create policy sg_mudar on public.seguidores for update to authenticated using (seguido = auth.uid());
drop policy if exists sg_apagar on public.seguidores;
create policy sg_apagar on public.seguidores for delete to authenticated using (seguidor = auth.uid() or seguido = auth.uid());
create or replace function public.protege_seguir() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.seguidor := auth.uid(); new.criado := now();
    new.status := case when coalesce((select privado from perfis where user_id = new.seguido), false) then 'pendente' else 'ativo' end;
    return new;
  end if;
  -- só quem é seguida aceita (pendente -> ativo); nada mais muda
  if auth.uid() = old.seguido and new.status = 'ativo' then
    new.seguidor := old.seguidor; new.seguido := old.seguido; new.criado := old.criado; return new;
  end if;
  return old;
end $$;
drop trigger if exists protege_seguir on public.seguidores;
create trigger protege_seguir before insert or update on public.seguidores for each row execute function public.protege_seguir();

-- ---------- 3) Posts, curtidas e comentários respeitam perfil privado e bloqueio ----------
alter table public.posts add column if not exists midia text;           -- foto nova: caminho privado
alter table public.posts add column if not exists conquista jsonb;      -- post de conquista (escolhido pela aluna)
create index if not exists posts_user_idx on public.posts (user_id, criado desc);
alter table public.comentarios add column if not exists oculto boolean not null default false;
drop policy if exists posts_ler on public.posts;
create policy posts_ler on public.posts for select to authenticated using (
  user_id = auth.uid() or e_admin() or (not oculto and pode_ver(user_id)));
drop policy if exists posts_criar on public.posts;
create policy posts_criar on public.posts for insert to authenticated with check (
  user_id = auth.uid() and pode_postar() and (midia is null or midia like 'post/' || auth.uid()::text || '/%'));
drop policy if exists curtidas_ler on public.curtidas;
create policy curtidas_ler on public.curtidas for select to authenticated using (exists (select 1 from posts p where p.id = post_id));
drop policy if exists curtidas_criar on public.curtidas;
create policy curtidas_criar on public.curtidas for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from posts p where p.id = post_id and not p.oculto and pode_ver(p.user_id)));
drop policy if exists comentarios_ler on public.comentarios;
create policy comentarios_ler on public.comentarios for select to authenticated using (
  (user_id = auth.uid() or e_admin() or (not oculto and not bloqueio_entre(auth.uid(), user_id))) and exists (select 1 from posts p where p.id = post_id));
drop policy if exists comentarios_criar on public.comentarios;
create policy comentarios_criar on public.comentarios for insert to authenticated with check (
  user_id = auth.uid() and pode_postar() and exists (select 1 from posts p where p.id = post_id and not p.oculto and pode_ver(p.user_id)));
-- publicações salvas (só a própria vê)
create table if not exists public.salvos (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  criado timestamptz not null default now(),
  primary key (user_id, post_id)
);
alter table public.salvos enable row level security;
drop policy if exists sv_dono on public.salvos;
create policy sv_dono on public.salvos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- 4) Stories (24 horas, expiração no banco) ----------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  midia text not null,
  texto text check (char_length(coalesce(texto, '')) <= 120),
  cor text check (cor is null or cor ~ '^#[0-9a-fA-F]{6}$'),
  criado timestamptz not null default now(),
  expira timestamptz not null default now() + interval '24 hours',
  oculto boolean not null default false
);
create index if not exists stories_user_idx on public.stories (user_id, expira desc);
create index if not exists stories_expira_idx on public.stories (expira);
alter table public.stories enable row level security;
create or replace function public.protege_story() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid(); new.criado := now(); new.expira := now() + interval '24 hours'; new.oculto := false;
    if new.midia not like 'story/' || auth.uid()::text || '/%' then raise exception 'midia invalida'; end if;
  end if;
  return new;
end $$;
drop trigger if exists protege_story on public.stories;
create trigger protege_story before insert on public.stories for each row execute function public.protege_story();
-- expirado NUNCA volta na consulta (filtro no banco, não no aparelho)
drop policy if exists st_ler on public.stories;
create policy st_ler on public.stories for select to authenticated using (expira > now() and (user_id = auth.uid() or (not oculto and pode_ver(user_id))));
drop policy if exists st_criar on public.stories;
create policy st_criar on public.stories for insert to authenticated with check (user_id = auth.uid() and pode_postar());
drop policy if exists st_apagar on public.stories;
create policy st_apagar on public.stories for delete to authenticated using (user_id = auth.uid());

create table if not exists public.story_vistas (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado timestamptz not null default now(),
  primary key (story_id, user_id)
);
alter table public.story_vistas enable row level security;
drop policy if exists sv_ler on public.story_vistas;
create policy sv_ler on public.story_vistas for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from stories s where s.id = story_id and s.user_id = auth.uid()));
drop policy if exists sv_criar on public.story_vistas;
create policy sv_criar on public.story_vistas for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from stories s where s.id = story_id and s.user_id <> auth.uid()));

-- ---------- 5) Chat: fotos, áudio, resposta, status (enviada/entregue/lida), apagar para mim ----------
alter table public.mensagens add column if not exists tipo text not null default 'texto';
alter table public.mensagens add column if not exists midia text;
alter table public.mensagens add column if not exists duracao int;
alter table public.mensagens add column if not exists resposta_id uuid references public.mensagens(id) on delete set null;
alter table public.mensagens add column if not exists story_id uuid;
alter table public.mensagens add column if not exists post_id uuid;
alter table public.mensagens add column if not exists entregue_em timestamptz;
alter table public.mensagens add column if not exists lida_em timestamptz;
alter table public.mensagens add column if not exists ocultar_para uuid[] not null default '{}';
alter table public.mensagens add column if not exists oculto_mod boolean not null default false;
alter table public.mensagens drop constraint if exists mensagens_texto_check;
alter table public.mensagens alter column texto drop not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'mensagens_conteudo_ok') then
    alter table public.mensagens add constraint mensagens_conteudo_ok check (
      tipo in ('texto','foto','audio','story','post')
      and char_length(coalesce(texto, '')) <= 2000
      and (tipo <> 'texto' or char_length(coalesce(texto, '')) >= 1)
      and (tipo not in ('foto','audio') or midia is not null)
      and (duracao is null or duracao between 0 and 300));
  end if;
end $$;
create index if not exists mensagens_nao_lidas_idx on public.mensagens (conversa_id, lida_em) where lida_em is null;
create or replace function public.e_participante(p_conversa uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from conversas c where c.id = p_conversa and auth.uid() in (c.a, c.b))
$$;
create or replace function public.outro_da_conversa(p_conversa uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select case when c.a = auth.uid() then c.b else c.a end from conversas c where c.id = p_conversa
$$;
drop policy if exists cv_criar on public.conversas;
create policy cv_criar on public.conversas for insert to authenticated with check (auth.uid() = a and pode_postar() and pode_mensagem(b));
drop policy if exists mg_ler on public.mensagens;
create policy mg_ler on public.mensagens for select to authenticated using (e_participante(conversa_id) and not (auth.uid() = any(ocultar_para)));
drop policy if exists mg_criar on public.mensagens;
create policy mg_criar on public.mensagens for insert to authenticated with check (
  autor = auth.uid() and pode_postar() and e_participante(conversa_id)
  and not bloqueio_entre(auth.uid(), outro_da_conversa(conversa_id))
  and (midia is null or midia like 'chat/' || conversa_id::text || '/%'));
drop policy if exists mg_mudar on public.mensagens;
create policy mg_mudar on public.mensagens for update to authenticated using (e_participante(conversa_id));
create or replace function public.protege_mensagem() returns trigger
language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); part boolean;
begin
  if tg_op = 'INSERT' then
    new.autor := eu; new.criado := now(); new.entregue_em := null; new.lida_em := null; new.ocultar_para := '{}'; new.oculto_mod := false;
    return new;
  end if;
  part := exists (select 1 from conversas c where c.id = old.conversa_id and eu in (c.a, c.b));
  if not part then
    if e_admin() then return new; end if;   -- só via moderação (função própria)
    return old;
  end if;
  -- participante: destinatária marca entregue/lida; qualquer uma pode esconder para si
  new.id := old.id; new.conversa_id := old.conversa_id; new.autor := old.autor; new.texto := old.texto; new.tipo := old.tipo;
  new.midia := old.midia; new.duracao := old.duracao; new.resposta_id := old.resposta_id; new.story_id := old.story_id; new.post_id := old.post_id;
  new.criado := old.criado; new.oculto_mod := old.oculto_mod;
  if eu = old.autor then new.entregue_em := old.entregue_em; new.lida_em := old.lida_em;
  else new.entregue_em := coalesce(old.entregue_em, new.entregue_em); new.lida_em := coalesce(old.lida_em, new.lida_em); end if;
  new.ocultar_para := (select coalesce(array_agg(distinct x), '{}') from unnest(old.ocultar_para || case when eu = any(new.ocultar_para) then array[eu] else '{}'::uuid[] end) x);
  return new;
end $$;
drop trigger if exists protege_mensagem on public.mensagens;
create trigger protege_mensagem before insert or update on public.mensagens for each row execute function public.protege_mensagem();
-- entregue = o aparelho da destinatária sincronizou; lida = conversa aberta
create or replace function public.marcar_entregues() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update mensagens m set entregue_em = now()
    from conversas c where m.conversa_id = c.id and auth.uid() in (c.a, c.b) and m.autor <> auth.uid() and m.entregue_em is null;
  get diagnostics n = row_count; return n;
end $$;
create or replace function public.marcar_lidas(p_conversa uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not e_participante(p_conversa) then return 0; end if;
  update mensagens set lida_em = now(), entregue_em = coalesce(entregue_em, now())
    where conversa_id = p_conversa and autor <> auth.uid() and lida_em is null;
  get diagnostics n = row_count;
  update notificacoes set lida = true where user_id = auth.uid() and tipo in ('mensagem','story_resposta') and ref = p_conversa::text and not lida;
  return n;
end $$;
-- apagar só para mim (a outra pessoa continua vendo)
create or replace function public.ocultar_mensagem(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update mensagens set ocultar_para = array(select distinct x from unnest(ocultar_para || array[auth.uid()]) x)
    where id = p_id and e_participante(conversa_id);
  return found;
end $$;
-- última mensagem na lista de conversas também para foto, áudio e Story
create or replace function public.atualiza_conversa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update conversas set ultima = left(coalesce(nullif(new.texto, ''), case new.tipo when 'foto' then '📷 Foto' when 'audio' then '🎤 Áudio' when 'story' then 'Respondeu ao Story' when 'post' then 'Publicação compartilhada' else '' end), 90),
    ultima_em = new.criado, ultimo_autor = new.autor,
    lida_a = case when a = new.autor then new.criado else lida_a end,
    lida_b = case when b = new.autor then new.criado else lida_b end
  where id = new.conversa_id;
  return new;
end $$;
create or replace function public.nao_lidas() returns table(conversa_id uuid, n bigint)
language sql stable security definer set search_path = public as $$
  select m.conversa_id, count(*) from mensagens m join conversas c on c.id = m.conversa_id
  where auth.uid() in (c.a, c.b) and m.autor <> auth.uid() and m.lida_em is null and not (auth.uid() = any(m.ocultar_para)) and not m.oculto_mod
  group by m.conversa_id
$$;

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

-- ---------- 8) Storage PRIVADO "social" (perfil, capa, posts, Stories, chat) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social', 'social', false, 10485760, array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/aac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- quem pode LER cada arquivo (a URL temporária só é gerada se isto for verdadeiro)
create or replace function public.social_pode_ler(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/'); dono uuid; conv uuid;
begin
  if auth.uid() is null or array_length(parte, 1) < 3 then return false; end if;
  if parte[1] = 'perfil' then dono := parte[2]::uuid; return dono = auth.uid() or not bloqueio_entre(auth.uid(), dono) or e_admin();
  elsif parte[1] = 'post' then dono := parte[2]::uuid;
    return dono = auth.uid() or exists (select 1 from posts p where p.midia = p_nome and ((not p.oculto and pode_ver(p.user_id)) or e_admin()));
  elsif parte[1] = 'story' then dono := parte[2]::uuid;
    return exists (select 1 from stories s where s.midia = p_nome and s.expira > now() and (s.user_id = auth.uid() or (not s.oculto and pode_ver(s.user_id))))
      or (admin_ve('moderacao') and exists (select 1 from stories s join denuncias d on d.tipo = 'story' and d.alvo_id = s.id::text where s.midia = p_nome));
  elsif parte[1] = 'chat' then conv := parte[2]::uuid;
    return e_participante(conv)
      or (admin_ve('moderacao') and exists (select 1 from mensagens m join denuncias d on d.tipo = 'mensagem' and d.alvo_id = m.id::text where m.midia = p_nome));
  end if;
  return false;
exception when others then return false;
end $$;
create or replace function public.social_pode_gravar(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/');
begin
  if auth.uid() is null or array_length(parte, 1) <> 3 or not pode_postar() then return false; end if;
  if parte[3] !~ '^[a-zA-Z0-9_-]{6,80}\.(jpg|jpeg|png|webp|webm|m4a|mp4|ogg|mp3|aac)$' then return false; end if;
  if parte[1] in ('perfil','post','story') then return parte[2] = auth.uid()::text; end if;
  if parte[1] = 'chat' then return e_participante(parte[2]::uuid) and not bloqueio_entre(auth.uid(), outro_da_conversa(parte[2]::uuid)); end if;
  return false;
exception when others then return false;
end $$;
drop policy if exists social_ler on storage.objects;
create policy social_ler on storage.objects for select to authenticated using (bucket_id = 'social' and public.social_pode_ler(name));
drop policy if exists social_enviar on storage.objects;
create policy social_enviar on storage.objects for insert to authenticated with check (bucket_id = 'social' and public.social_pode_gravar(name));
drop policy if exists social_apagar on storage.objects;
create policy social_apagar on storage.objects for delete to authenticated using (bucket_id = 'social' and owner = auth.uid());

-- ---------- 9) Tempo real (mensagens, conversas, notificações) ----------
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['mensagens','conversas','notificacoes'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

select 'Rede social pronta' as status;
