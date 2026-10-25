-- ---------- 11) Parceira CK (opcional) ----------
-- Duas amigas que se seguem combinam de se apoiar. Cada uma vê da outra só QUANTOS DIAS treinou na semana
-- (nada de peso, ciclo, saúde, treino detalhado ou horário). Dá para mandar 1 incentivo por dia (frases prontas,
-- sempre positivas). Qualquer uma encerra quando quiser. Pode rodar mais de uma vez.
create table if not exists public.parceiras (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users(id) on delete cascade,   -- quem convidou
  b uuid not null references auth.users(id) on delete cascade,   -- quem foi convidada
  status text not null default 'pendente' check (status in ('pendente','ativa','encerrada')),
  criado timestamptz not null default now(),
  aceito timestamptz,
  encerrado timestamptz,
  check (a <> b)
);
create unique index if not exists parceiras_par_vivo on public.parceiras (least(a, b), greatest(a, b)) where status in ('pendente','ativa');
create index if not exists parceiras_a on public.parceiras (a) where status in ('pendente','ativa');
create index if not exists parceiras_b on public.parceiras (b) where status in ('pendente','ativa');
alter table public.parceiras enable row level security;
drop policy if exists pc_ler on public.parceiras;
create policy pc_ler on public.parceiras for select to authenticated using (auth.uid() in (a, b));
create table if not exists public.parceiras_incentivos (
  parceria uuid not null references public.parceiras(id) on delete cascade,
  de uuid not null,
  dia date not null,
  frase int not null,
  criado timestamptz not null default now(),
  primary key (parceria, de, dia)
);
alter table public.parceiras_incentivos enable row level security;
drop policy if exists pci_ler on public.parceiras_incentivos;
create policy pci_ler on public.parceiras_incentivos for select to authenticated using (de = auth.uid());

create or replace function public._parceira_frase(p int) returns text
language sql immutable as $$
  select (array['Bora treinar hoje? Tô contigo 💚', 'Orgulho de você! Continua 💪', 'Pouco ainda conta. 5 minutinhos? 💚', 'Sentindo sua falta no treino. Bora juntas?',
    'Você consegue! Tô torcendo por você ✨', 'Hoje é dia de cuidar de você 💚'])[greatest(1, least(p, 6))]
$$;
-- dias com treino na semana atual (segunda a domingo), só a contagem
create or replace function public._dias_semana(p_uid uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(distinct (t ->> 'd'))::int from alunas a,
    jsonb_array_elements(case when jsonb_typeof(a.dados -> 'treinos') = 'array' then a.dados -> 'treinos' else '[]'::jsonb end) t
  where a.id = p_uid and (t ->> 'd') ~ '^\d{4}-\d{2}-\d{2}$'
    and (t ->> 'd')::date between date_trunc('week', (now() at time zone 'America/Cuiaba'))::date and (now() at time zone 'America/Cuiaba')::date
$$;
revoke all on function public._dias_semana(uuid) from public, anon, authenticated;

create or replace function public.parceira_convidar(p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); nid uuid;
begin
  if eu is null or p_user is null or p_user = eu then raise exception 'convite inválido'; end if;
  if exists (select 1 from perfis where user_id = p_user and equipe) then raise exception 'convite inválido'; end if;
  if bloqueio_entre(eu, p_user) then raise exception 'convite inválido'; end if;
  if not (exists (select 1 from seguidores where seguidor = eu and seguido = p_user and status = 'ativo')
      and exists (select 1 from seguidores where seguidor = p_user and seguido = eu and status = 'ativo')) then
    raise exception 'Vocês precisam se seguir para virar parceiras'; end if;
  if exists (select 1 from parceiras where status = 'ativa' and (eu in (a, b) or p_user in (a, b))) then raise exception 'Uma de vocês já tem uma Parceira CK'; end if;
  if exists (select 1 from parceiras where status = 'pendente' and a = eu) then raise exception 'Você já tem um convite esperando resposta'; end if;
  insert into parceiras (a, b) values (eu, p_user) returning id into nid;
  perform notificar(p_user, eu, 'sistema', 'parceira:' || nid, 'quer ser sua Parceira CK 💚 Abra Perfil › Parceira CK para responder.');
  return nid;
end $$;
revoke all on function public.parceira_convidar(uuid) from public, anon;
grant execute on function public.parceira_convidar(uuid) to authenticated;

create or replace function public.parceira_responder(p_id uuid, p_aceita boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare pc parceiras;
begin
  select * into pc from parceiras where id = p_id and b = auth.uid() and status = 'pendente';
  if pc.id is null then return false; end if;
  if p_aceita then
    if exists (select 1 from parceiras where status = 'ativa' and (pc.a in (a, b) or pc.b in (a, b))) then raise exception 'Uma de vocês já tem uma Parceira CK'; end if;
    update parceiras set status = 'ativa', aceito = now() where id = p_id;
    update parceiras set status = 'encerrada', encerrado = now() where status = 'pendente' and id <> p_id and (pc.a in (a, b) or pc.b in (a, b));
    perform notificar(pc.a, pc.b, 'sistema', 'parceira:' || p_id, 'aceitou ser sua Parceira CK 💚 Agora vocês se apoiam na semana.');
  else
    update parceiras set status = 'encerrada', encerrado = now() where id = p_id;   -- recusa silenciosa (sem aviso para não constranger)
  end if;
  return true;
end $$;
revoke all on function public.parceira_responder(uuid, boolean) from public, anon;
grant execute on function public.parceira_responder(uuid, boolean) to authenticated;

create or replace function public.parceira_encerrar(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update parceiras set status = 'encerrada', encerrado = now() where id = p_id and auth.uid() in (a, b) and status in ('pendente','ativa');
  return found;
end $$;
revoke all on function public.parceira_encerrar(uuid) from public, anon;
grant execute on function public.parceira_encerrar(uuid) to authenticated;

create or replace function public.parceira_status() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare eu uuid := auth.uid(); pc parceiras; outro uuid; pf perfis; res jsonb;
begin
  if eu is null then return null; end if;
  select * into pc from parceiras where status = 'ativa' and eu in (a, b) limit 1;
  if pc.id is not null then
    outro := case when pc.a = eu then pc.b else pc.a end; select * into pf from perfis where user_id = outro;
    return jsonb_build_object('id', pc.id, 'status', 'ativa', 'desde', pc.aceito, 'outra', jsonb_build_object('user_id', outro, 'nome', pf.nome, 'username', pf.username, 'foto', pf.foto_mini),
      'semana_ela', _dias_semana(outro), 'semana_eu', _dias_semana(eu),
      'incentivo_hoje', exists (select 1 from parceiras_incentivos i where i.parceria = pc.id and i.de = eu and i.dia = (now() at time zone 'America/Cuiaba')::date));
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'de', jsonb_build_object('user_id', p.a, 'nome', f.nome, 'username', f.username, 'foto', f.foto_mini))), '[]') into res
    from parceiras p left join perfis f on f.user_id = p.a where p.b = eu and p.status = 'pendente';
  return jsonb_build_object('status', 'nenhuma', 'convites', res,
    'enviado', (select jsonb_build_object('id', p.id, 'para', jsonb_build_object('user_id', p.b, 'nome', f.nome, 'username', f.username, 'foto', f.foto_mini))
      from parceiras p left join perfis f on f.user_id = p.b where p.a = eu and p.status = 'pendente' limit 1));
end $$;
revoke all on function public.parceira_status() from public, anon;
grant execute on function public.parceira_status() to authenticated;

-- amigas que podem ser convidadas (seguem uma à outra)
create or replace function public.parceira_amigas() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('user_id', f.user_id, 'nome', f.nome, 'username', f.username, 'foto', f.foto_mini) order by f.nome), '[]')
  from seguidores s1 join seguidores s2 on s2.seguidor = s1.seguido and s2.seguido = s1.seguidor and s2.status = 'ativo'
  join perfis f on f.user_id = s1.seguido
  where s1.seguidor = auth.uid() and s1.status = 'ativo' and not coalesce(f.equipe, false) and not bloqueio_entre(auth.uid(), f.user_id)
$$;
revoke all on function public.parceira_amigas() from public, anon;
grant execute on function public.parceira_amigas() to authenticated;

create or replace function public.parceira_incentivar(p_frase int) returns boolean
language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); pc parceiras; outro uuid;
begin
  select * into pc from parceiras where status = 'ativa' and eu in (a, b) limit 1;
  if pc.id is null then raise exception 'Você não tem uma Parceira CK agora'; end if;
  outro := case when pc.a = eu then pc.b else pc.a end;
  insert into parceiras_incentivos (parceria, de, dia, frase) values (pc.id, eu, (now() at time zone 'America/Cuiaba')::date, greatest(1, least(p_frase, 6)))
    on conflict do nothing;
  if not found then raise exception 'Você já mandou um incentivo hoje 💚'; end if;
  perform notificar(outro, eu, 'sistema', 'parceira:' || pc.id, _parceira_frase(p_frase));
  return true;
end $$;
revoke all on function public.parceira_incentivar(int) from public, anon;
grant execute on function public.parceira_incentivar(int) to authenticated;

select 'Etapa 5 pronta' as status;
