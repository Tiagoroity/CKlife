-- CK Life · Rede social · PARTE 2 de 5 (rode na ordem, uma de cada vez)
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

select 'Parte 2 pronta' as status;
