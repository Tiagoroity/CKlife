-- =====================================================================
-- CK Life · CABELO PARA TREINAR (módulo novo, começa DESATIVADO)
-- Pode rodar de novo sem apagar nada. Para liberar: Painel > Conteúdo > Cabelo para Treinar.
-- =====================================================================

-- ---------- 1) Liberação de funcionalidades (disabled | beta | enabled). Sem registro = desativado. ----------
create table if not exists public.feature_flags (
  chave text primary key,
  estado text not null default 'disabled' check (estado in ('disabled','beta','enabled')),
  beta_users uuid[] not null default '{}',
  atualizado timestamptz not null default now(),
  por uuid
);
alter table public.feature_flags enable row level security;
drop policy if exists ff_ler on public.feature_flags;
create policy ff_ler on public.feature_flags for select to authenticated using (admin_ve(chave));
drop policy if exists ff_mudar on public.feature_flags;
create policy ff_mudar on public.feature_flags for update to authenticated using (admin_pode(chave)) with check (admin_pode(chave));
drop policy if exists ff_criar on public.feature_flags;
create policy ff_criar on public.feature_flags for insert to authenticated with check (admin_pode(chave));
insert into public.feature_flags (chave, estado) values ('cabelo', 'disabled') on conflict (chave) do nothing;
create or replace function public.audita_flag() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.atualizado := now(); new.por := auth.uid(); perform auditar('funcionalidade_' || new.estado, 'feature_flags', new.chave, 'ok', coalesce(array_length(new.beta_users, 1), 0) || ' usuária(s) no beta'); return new; end $$;
drop trigger if exists audita_flag on public.feature_flags;
create trigger audita_flag before insert or update on public.feature_flags for each row execute function public.audita_flag();

-- quem vê: ativado = todas; beta = admins + usuárias escolhidas; desativado (ou sem registro, ou erro) = ninguém
create or replace function public.recurso_visivel(p_chave text, p_uid uuid default auth.uid()) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare f feature_flags;
begin
  select * into f from feature_flags where chave = p_chave;
  if f.chave is null then return false; end if;
  return case f.estado when 'enabled' then p_uid is not null
    when 'beta' then p_uid is not null and (p_uid = any(f.beta_users) or exists (select 1 from admins where user_id = p_uid))
    else false end;
exception when others then return false;
end $$;
grant execute on function public.recurso_visivel(text, uuid) to authenticated;
-- o app pergunta só isto (sem ver a lista do beta)
create or replace function public.meus_recursos() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(chave, recurso_visivel(chave)), '{}') from feature_flags;
$$;
grant execute on function public.meus_recursos() to authenticated;
-- painel: estado + e-mails do beta
create or replace function public.admin_flag(p_chave text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve(p_chave) then return null; end if;
  return (select jsonb_build_object('estado', f.estado, 'atualizado', f.atualizado, 'beta', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'nome', a.nome, 'email', a.email)) from alunas a where a.id = any(f.beta_users)), '[]'))
    from feature_flags f where f.chave = p_chave);
end $$;
grant execute on function public.admin_flag(text) to authenticated;
create or replace function public.admin_flag_beta(p_chave text, p_email text, p_add boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  if not admin_pode(p_chave) then raise exception 'sem permissão'; end if;
  select id into u from alunas where lower(email) = lower(trim(p_email)) limit 1;
  if u is null then raise exception 'nenhuma aluna com esse e-mail'; end if;
  update feature_flags set beta_users = case when p_add then array(select distinct x from unnest(beta_users || u) x) else array_remove(beta_users, u) end where chave = p_chave;
  return admin_flag(p_chave);
end $$;
grant execute on function public.admin_flag_beta(text, text, boolean) to authenticated;

-- ---------- 2) Penteados e passos ----------
create table if not exists public.penteados (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,70}$'),
  descricao text check (char_length(coalesce(descricao, '')) <= 160),
  familia text,
  tipos text[] not null default '{}',          -- liso, ondulado, cacheado, crespo
  comprimentos text[] not null default '{}',   -- curto, medio, longo, muito_longo
  treinos text[] not null default '{}',        -- musculacao, corrida, caminhada, bike, funcional, cross, yoga, pilates, danca, intenso, leve
  minutos int not null default 2 check (minutos between 1 and 60),
  dificuldade text not null default 'facil' check (dificuldade in ('facil','media','avancada')),
  fixacao text not null default 'media' check (fixacao in ('leve','media','alta')),
  acessorios text[] not null default '{}',     -- scrunchie, elastico, faixa, bandana, grampos, presilhas, pente, toalha
  thumb text check (thumb is null or thumb ~ '^https://'),
  imagem text check (imagem is null or imagem ~ '^https://'),
  video_url text check (video_url is null or video_url ~ '^https://'),
  produtos text[] not null default '{}',       -- preparado para produtos recomendados / afiliados (não exibido ainda)
  destaque boolean not null default false,
  ordem int not null default 100,
  status text not null default 'rascunho' check (status in ('rascunho','publicado','desativado')),
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
create index if not exists penteados_ordem_idx on public.penteados (status, ordem);
create table if not exists public.penteado_passos (
  id uuid primary key default gen_random_uuid(),
  penteado_id uuid not null references public.penteados(id) on delete cascade,
  numero int not null check (numero between 1 and 12),
  titulo text check (char_length(coalesce(titulo, '')) <= 60),
  instrucao text not null check (char_length(instrucao) between 2 and 300),
  midia text check (midia is null or midia ~ '^https://'),
  vista text not null default 'back' check (vista in ('front','side','back','detail')),
  unique (penteado_id, numero)
);
alter table public.penteados enable row level security;
alter table public.penteado_passos enable row level security;
drop policy if exists pt_ler on public.penteados;
create policy pt_ler on public.penteados for select to authenticated using ((status = 'publicado' and recurso_visivel('cabelo')) or admin_ve('cabelo'));
drop policy if exists pt_criar on public.penteados;
create policy pt_criar on public.penteados for insert to authenticated with check (admin_pode('cabelo'));
drop policy if exists pt_mudar on public.penteados;
create policy pt_mudar on public.penteados for update to authenticated using (admin_pode('cabelo')) with check (admin_pode('cabelo'));
drop policy if exists pt_apagar on public.penteados;
create policy pt_apagar on public.penteados for delete to authenticated using (admin_pode('cabelo'));
drop policy if exists pp_ler on public.penteado_passos;
create policy pp_ler on public.penteado_passos for select to authenticated using (exists (select 1 from penteados p where p.id = penteado_id and ((p.status = 'publicado' and recurso_visivel('cabelo')) or admin_ve('cabelo'))));
drop policy if exists pp_mudar on public.penteado_passos;
create policy pp_mudar on public.penteado_passos for all to authenticated using (admin_pode('cabelo')) with check (admin_pode('cabelo'));
create or replace function public.audita_penteado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'DELETE' then new.atualizado := now(); end if;
  if auth.uid() is not null then perform auditar('penteado_' || lower(tg_op), 'penteados', coalesce(new.slug, old.slug), 'ok', coalesce(new.status, old.status)); end if;
  return coalesce(new, old);
end $$;
drop trigger if exists audita_penteado on public.penteados;
create trigger audita_penteado before insert or update or delete on public.penteados for each row execute function public.audita_penteado();

-- ---------- 3) Favoritos e preferências (de cada aluna) ----------
create table if not exists public.penteado_favoritos (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  penteado_id uuid not null references public.penteados(id) on delete cascade,
  criado timestamptz not null default now(),
  primary key (user_id, penteado_id)
);
alter table public.penteado_favoritos enable row level security;
drop policy if exists pf_dono on public.penteado_favoritos;
create policy pf_dono on public.penteado_favoritos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create table if not exists public.cabelo_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  tipo text check (tipo in ('liso','ondulado','cacheado','crespo')),
  comprimento text check (comprimento in ('curto','medio','longo','muito_longo')),
  atualizado timestamptz not null default now()
);
alter table public.cabelo_prefs enable row level security;
drop policy if exists cp_dono on public.cabelo_prefs;
create policy cp_dono on public.cabelo_prefs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- 4) Fotos e vídeos dos tutoriais (leitura pública; envio só pelo painel) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cabelo', 'cabelo', true, 31457280, array['image/jpeg','image/webp','image/png','video/mp4','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 31457280, allowed_mime_types = array['image/jpeg','image/webp','image/png','video/mp4','video/webm'];
drop policy if exists cabelo_ler on storage.objects;
create policy cabelo_ler on storage.objects for select using (bucket_id = 'cabelo');
drop policy if exists cabelo_enviar on storage.objects;
create policy cabelo_enviar on storage.objects for insert to authenticated with check (bucket_id = 'cabelo' and admin_pode('cabelo') and (storage.foldername(name))[1] in ('thumb','img','passo','video'));
drop policy if exists cabelo_mudar on storage.objects;
create policy cabelo_mudar on storage.objects for update to authenticated using (bucket_id = 'cabelo' and admin_pode('cabelo'));
drop policy if exists cabelo_apagar on storage.objects;
create policy cabelo_apagar on storage.objects for delete to authenticated using (bucket_id = 'cabelo' and admin_pode('cabelo'));

-- ---------- 5) Dados exportados (LGPD): favoritos e preferências entram no "Baixar meus dados" quando a função existir ----------
