-- CK Life · Inteligência e comunidade (vídeo das alunas desligado, Squad CK, Desafio coletivo)
-- Só adiciona. Não apaga vídeos antigos nem colunas. Pode rodar mais de uma vez.

-- ---------- 1) Alunas não enviam mais vídeo (feed, Stories, chat). Conteúdo oficial/admin continua ----------
-- armazenamento das alunas ("social"): aceita foto e áudio, não aceita mais vídeo novo
update storage.buckets set allowed_mime_types = (select array(select x from unnest(coalesce(allowed_mime_types, '{}')) x where x not like 'video/%'))
where id = 'social' and allowed_mime_types is not null;
create or replace function public.bloqueia_video_aluna() returns trigger
language plpgsql security definer set search_path = public as $$
declare v boolean;
begin
  if auth.uid() is null or e_admin() then return new; end if;   -- sistema e administradoras continuam
  if tg_table_name = 'mensagens' then v := new.tipo = 'video';
  else v := coalesce(new.midia, '') ~* '\.(mp4|mov|webm|m4v|avi|mkv)$'; end if;
  if v then raise exception 'Envio de vídeo não está disponível. Você pode enviar foto ou áudio.'; end if;
  return new;
end $$;
drop trigger if exists bloqueia_video_aluna on public.posts;
create trigger bloqueia_video_aluna before insert on public.posts for each row execute function public.bloqueia_video_aluna();
drop trigger if exists bloqueia_video_aluna on public.stories;
create trigger bloqueia_video_aluna before insert on public.stories for each row execute function public.bloqueia_video_aluna();
drop trigger if exists bloqueia_video_aluna on public.mensagens;
create trigger bloqueia_video_aluna before insert on public.mensagens for each row execute function public.bloqueia_video_aluna();

-- ---------- 2) Squad CK: modalidade dos Grupos existentes (5 a 15 integrantes) ----------
alter table public.grupos add column if not exists squad boolean not null default false;
alter table public.grupos add column if not exists max_membros int check (max_membros is null or max_membros between 5 and 15);
create or replace function public.confere_squad() returns trigger
language plpgsql security definer set search_path = public as $$
declare g grupos; n int;
begin
  select * into g from grupos where id = new.grupo_id;
  if g.squad then
    perform pg_advisory_xact_lock(hashtext(new.grupo_id::text));
    select count(*) into n from membros_grupo where grupo_id = new.grupo_id;
    if n >= coalesce(g.max_membros, 15) then raise exception 'Este Squad está completo. Escolha outro Squad 💚'; end if;
  end if;
  return new;
end $$;
drop trigger if exists confere_squad on public.membros_grupo;
create trigger confere_squad before insert on public.membros_grupo for each row execute function public.confere_squad();
create or replace function public.grupos_info() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', g.id, 'slug', g.slug, 'nome', g.nome, 'descricao', g.descricao, 'emoji', g.emoji, 'cor', g.cor, 'cidade', g.cidade,
    'membros', (select count(*) from membros_grupo m where m.grupo_id = g.id),
    'eu', exists (select 1 from membros_grupo m where m.grupo_id = g.id and m.user_id = auth.uid()),
    'squad', g.squad, 'max_membros', case when g.squad then coalesce(g.max_membros, 15) end) order by g.ordem, g.nome), '[]'::json)
  from grupos g where g.ativo and auth.uid() is not null;
$$;
grant execute on function public.grupos_info() to authenticated;

-- ---------- 3) Desafio coletivo (soma real dos minutos de treino da comunidade) ----------
create table if not exists public.desafios_coletivos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 3 and 80),
  meta_min int not null check (meta_min between 100 and 100000000),
  ini date not null,
  fim date not null,
  ativo boolean not null default true,
  total_cache int not null default 0,
  cache_em timestamptz,
  criado timestamptz not null default now(),
  check (fim >= ini)
);
alter table public.desafios_coletivos enable row level security;
drop policy if exists dc_ler on public.desafios_coletivos;
create policy dc_ler on public.desafios_coletivos for select to authenticated using (ativo or admin_ve('comunidade'));
create or replace function public._dc_soma(p_ini date, p_fim date) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(least(greatest(coalesce((t ->> 'min')::numeric, 0), 0), 180)), 0)::int
  from alunas a left join perfis pf on pf.user_id = a.id,
    jsonb_array_elements(case when jsonb_typeof(a.dados -> 'treinos') = 'array' then a.dados -> 'treinos' else '[]'::jsonb end) t
  where not a.bloqueado and coalesce(pf.equipe, false) = false and (t ->> 'd') ~ '^\d{4}-\d{2}-\d{2}$' and (t ->> 'min') ~ '^\d+(\.\d+)?$'
    and (t ->> 'd')::date between p_ini and p_fim
$$;
revoke all on function public._dc_soma(date, date) from public, anon, authenticated;
create or replace function public.desafio_coletivo_atual() returns jsonb
language plpgsql security definer set search_path = public as $$
declare d desafios_coletivos; hoje date := (now() at time zone 'America/Cuiaba')::date;
begin
  if auth.uid() is null then return null; end if;
  select * into d from desafios_coletivos where ativo and hoje between ini and fim order by criado desc limit 1;
  if d.id is null then return null; end if;
  if d.cache_em is null or d.cache_em < now() - interval '10 minutes' then
    update desafios_coletivos set total_cache = _dc_soma(d.ini, d.fim), cache_em = now() where id = d.id returning * into d;
  end if;
  return jsonb_build_object('id', d.id, 'titulo', d.titulo, 'meta', d.meta_min, 'total', d.total_cache, 'ini', d.ini, 'fim', d.fim);
end $$;
revoke all on function public.desafio_coletivo_atual() from public, anon;
grant execute on function public.desafio_coletivo_atual() to authenticated;
create or replace function public.admin_desafio_coletivo(p_id uuid, p_titulo text, p_meta int, p_ini date, p_fim date, p_ativo boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  if not admin_pode('comunidade') then raise exception 'sem permissão'; end if;
  if p_id is null then
    insert into desafios_coletivos (titulo, meta_min, ini, fim, ativo) values (trim(p_titulo), p_meta, p_ini, p_fim, coalesce(p_ativo, true)) returning id into nid;
  else
    update desafios_coletivos set titulo = coalesce(trim(p_titulo), titulo), meta_min = coalesce(p_meta, meta_min), ini = coalesce(p_ini, ini), fim = coalesce(p_fim, fim),
      ativo = coalesce(p_ativo, ativo), cache_em = null where id = p_id returning id into nid;
  end if;
  begin perform auditar('desafio_coletivo', 'comunidade', nid::text, 'ok', null); exception when others then null; end;
  return nid;
end $$;
revoke all on function public.admin_desafio_coletivo(uuid, text, int, date, date, boolean) from public, anon;
grant execute on function public.admin_desafio_coletivo(uuid, text, int, date, date, boolean) to authenticated;
create or replace function public.admin_desafios_coletivos() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('comunidade') then return null; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'titulo', titulo, 'meta', meta_min, 'ini', ini, 'fim', fim, 'ativo', ativo, 'total', _dc_soma(ini, fim)) order by criado desc), '[]') from desafios_coletivos);
end $$;
revoke all on function public.admin_desafios_coletivos() from public, anon;
grant execute on function public.admin_desafios_coletivos() to authenticated;

select 'Inteligência pronta' as status;
