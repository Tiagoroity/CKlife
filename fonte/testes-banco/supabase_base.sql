-- Imita o mínimo do Supabase para testar as regras localmente (NÃO rodar no Supabase).
drop schema if exists public cascade; drop schema if exists auth cascade; drop schema if exists storage cascade; drop schema if exists net cascade;
create schema public; create schema auth; create schema storage;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
create table auth.users (id uuid primary key, email text);
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $$;
grant select on auth.users to authenticated;
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid default auth.uid(), created_at timestamptz default now());
alter table storage.objects enable row level security;
grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
create schema net; create table net.log (id bigserial primary key, url text, body jsonb, criado timestamptz default now());
create or replace function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds int default 5000) returns bigint language sql as $$ insert into net.log (url, body) values (url, body) returning id $$;
grant usage on schema net to anon, authenticated, service_role; grant all on all tables in schema net to anon, authenticated, service_role; grant all on all sequences in schema net to anon, authenticated, service_role;
drop publication if exists supabase_realtime; create publication supabase_realtime;
-- troca de "usuária" nos testes
create or replace function public.tst_como(u text) returns void language plpgsql as $$
begin
  if u is null then perform set_config('request.jwt.claim.sub', '', false); perform set_config('request.jwt.claim.role', 'anon', false); execute 'set role anon';
  else perform set_config('request.jwt.claim.sub', u, false); perform set_config('request.jwt.claim.role', 'authenticated', false); perform set_config('request.jwt.claims', '{"aal":"aal1"}', false); execute 'set role authenticated'; end if;
end $$;
