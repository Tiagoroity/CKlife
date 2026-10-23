-- CK Life · Novidades · PARTE 1 de 3 (rode na ordem)
-- =====================================================================
-- CK Life · NOVIDADES: grupos da comunidade, vídeos, desafios com contagem real,
-- figurinhas e humor salvos na conta, notificações no celular (push).
-- Só ADICIONA. Não apaga dados. Pode rodar mais de uma vez.
-- =====================================================================

-- ---------- 1) Grupos da comunidade ----------
create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  nome text not null check (char_length(nome) between 3 and 60),
  descricao text check (char_length(coalesce(descricao, '')) <= 300),
  emoji text check (char_length(coalesce(emoji, '')) <= 12),
  cor text check (cor is null or cor ~ '^#[0-9a-fA-F]{6}$'),
  cidade int,
  ativo boolean not null default true,
  ordem int not null default 0,
  criado timestamptz not null default now()
);
alter table public.grupos enable row level security;
drop policy if exists gr_ler on public.grupos;
create policy gr_ler on public.grupos for select to authenticated using (ativo or admin_ve('comunidade'));
drop policy if exists gr_criar on public.grupos;
create policy gr_criar on public.grupos for insert to authenticated with check (admin_pode('comunidade'));
drop policy if exists gr_mudar on public.grupos;
create policy gr_mudar on public.grupos for update to authenticated using (admin_pode('comunidade')) with check (admin_pode('comunidade'));

create table if not exists public.membros_grupo (
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado timestamptz not null default now(),
  primary key (grupo_id, user_id)
);
create index if not exists membros_grupo_user_idx on public.membros_grupo (user_id);
alter table public.membros_grupo enable row level security;
drop policy if exists mg_ler on public.membros_grupo;
create policy mg_ler on public.membros_grupo for select to authenticated using (user_id = auth.uid() or admin_ve('comunidade'));
drop policy if exists mg_entrar on public.membros_grupo;
create policy mg_entrar on public.membros_grupo for insert to authenticated with check (
  user_id = auth.uid() and pode_postar() and exists (select 1 from grupos g where g.id = grupo_id and g.ativo));
drop policy if exists mg_sair on public.membros_grupo;
create policy mg_sair on public.membros_grupo for delete to authenticated using (user_id = auth.uid() or admin_pode('comunidade'));

-- lista de grupos com número de membros (só o total; quem participa não é exposto)
create or replace function public.grupos_info() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', g.id, 'slug', g.slug, 'nome', g.nome, 'descricao', g.descricao, 'emoji', g.emoji, 'cor', g.cor, 'cidade', g.cidade,
    'membros', (select count(*) from membros_grupo m where m.grupo_id = g.id),
    'eu', exists (select 1 from membros_grupo m where m.grupo_id = g.id and m.user_id = auth.uid())) order by g.ordem, g.nome), '[]'::json)
  from grupos g where g.ativo and auth.uid() is not null;
$$;
grant execute on function public.grupos_info() to authenticated;

alter table public.posts add column if not exists grupo_id uuid references public.grupos(id) on delete set null;
create index if not exists posts_grupo_idx on public.posts (grupo_id, criado desc) where grupo_id is not null;
drop policy if exists posts_criar on public.posts;
create policy posts_criar on public.posts for insert to authenticated with check (
  user_id = auth.uid() and pode_postar() and (midia is null or midia like 'post/' || auth.uid()::text || '/%')
  and (grupo_id is null or exists (select 1 from membros_grupo m where m.grupo_id = posts.grupo_id and m.user_id = auth.uid())));

insert into public.grupos (slug, nome, descricao, emoji, cor, ordem) values
  ('iniciantes', 'Iniciantes', 'Para quem está começando agora. Sem pressa e sem julgamento.', '🌱', '#2E7D5A', 1),
  ('treino-em-casa', 'Treino em casa', 'Dicas, rotinas e motivação para treinar em casa.', '🏠', '#0E3D32', 2),
  ('musculacao', 'Musculação', 'Força, técnica e evolução na academia ou em casa.', '🏋️‍♀️', '#6C5FB5', 3),
  ('corrida', 'Corrida e caminhada', 'Do primeiro quilômetro à primeira prova.', '🏃‍♀️', '#D08A2E', 4),
  ('maes-fitness', 'Mães fitness', 'Cuidar de si com a rotina de mãe.', '🤱', '#C2577B', 5),
  ('alimentacao', 'Alimentação saudável', 'Receitas, marmitas e trocas inteligentes.', '🥗', '#2B7BB9', 6)
on conflict (slug) do nothing;

-- ---------- 2) Vídeos (posts e Stories) ----------
update storage.buckets set file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/aac','video/mp4','video/webm','video/quicktime']
where id = 'social';

