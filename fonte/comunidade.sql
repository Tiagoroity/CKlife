-- =====================================================================
-- CK Life · Comunidade das alunas (posts, curtidas, comentários e fotos)
-- Cole no Supabase (SQL Editor > New query) e clique em Run. Pode rodar de novo.
-- =====================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  foto text,
  texto text check (char_length(coalesce(texto, '')) <= 1000),
  img text,
  oculto boolean not null default false,
  criado timestamptz not null default now()
);
create index if not exists posts_criado_idx on public.posts (criado desc);
create table if not exists public.curtidas (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  foto text,
  texto text not null check (char_length(texto) between 1 and 500),
  criado timestamptz not null default now()
);
create index if not exists comentarios_post_idx on public.comentarios (post_id, criado);

alter table public.posts enable row level security;
alter table public.curtidas enable row level security;
alter table public.comentarios enable row level security;

-- quem está bloqueada não publica
create or replace function public.pode_postar() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and not exists (select 1 from alunas where id = auth.uid() and bloqueado)
$$;

drop policy if exists posts_ler on public.posts;
create policy posts_ler on public.posts for select to authenticated using (not oculto or user_id = auth.uid() or e_admin());
drop policy if exists posts_criar on public.posts;
create policy posts_criar on public.posts for insert to authenticated with check (user_id = auth.uid() and pode_postar());
drop policy if exists posts_apagar on public.posts;
create policy posts_apagar on public.posts for delete to authenticated using (user_id = auth.uid() or e_admin());
drop policy if exists posts_moderar on public.posts;
create policy posts_moderar on public.posts for update to authenticated using (e_admin()) with check (e_admin());

drop policy if exists curtidas_ler on public.curtidas;
create policy curtidas_ler on public.curtidas for select to authenticated using (true);
drop policy if exists curtidas_criar on public.curtidas;
create policy curtidas_criar on public.curtidas for insert to authenticated with check (user_id = auth.uid());
drop policy if exists curtidas_apagar on public.curtidas;
create policy curtidas_apagar on public.curtidas for delete to authenticated using (user_id = auth.uid());

drop policy if exists comentarios_ler on public.comentarios;
create policy comentarios_ler on public.comentarios for select to authenticated using (true);
drop policy if exists comentarios_criar on public.comentarios;
create policy comentarios_criar on public.comentarios for insert to authenticated with check (user_id = auth.uid() and pode_postar());
drop policy if exists comentarios_apagar on public.comentarios;
create policy comentarios_apagar on public.comentarios for delete to authenticated using (user_id = auth.uid() or e_admin());

-- fotos das publicações (pasta pública "posts", cada aluna só mexe na própria pasta)
insert into storage.buckets (id, name, public) values ('posts', 'posts', true) on conflict (id) do nothing;
drop policy if exists posts_fotos_ler on storage.objects;
create policy posts_fotos_ler on storage.objects for select using (bucket_id = 'posts');
drop policy if exists posts_fotos_enviar on storage.objects;
create policy posts_fotos_enviar on storage.objects for insert to authenticated with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists posts_fotos_apagar on storage.objects;
create policy posts_fotos_apagar on storage.objects for delete to authenticated using (bucket_id = 'posts' and ((storage.foldername(name))[1] = auth.uid()::text or e_admin()));

select 'Comunidade pronta' as status;
