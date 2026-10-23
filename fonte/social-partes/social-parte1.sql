-- CK Life · Rede social · PARTE 1 de 5 (rode na ordem, uma de cada vez)
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

select 'Parte 1 pronta' as status;
