-- =====================================================================
-- CK Life · banco de dados
-- Cole este arquivo inteiro no Supabase (SQL Editor > New query) e clique em Run.
-- Pode rodar de novo sem perder dados.
-- =====================================================================

-- Alunas: uma linha por pessoa cadastrada
create table if not exists public.alunas (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  whats text,
  nasc date,
  cidade int,
  criado date not null default current_date,
  ultimo date,
  bloqueado boolean not null default false,
  premium jsonb,
  dados jsonb not null default '{}'::jsonb,   -- perfil, treinos, alimentação, medidas, favoritos...
  atualizado timestamptz not null default now()
);
create index if not exists alunas_email_idx on public.alunas (lower(email));

-- Quem pode abrir o painel do administrador
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome text,
  perms jsonb not null default '{"total":true}'::jsonb,
  desde date not null default current_date
);

-- Conteúdo do painel: anunciantes, campanhas, parceiros, cupons, avisos, cidades, receitas extras...
create table if not exists public.colecoes (
  nome text not null,
  id text not null,
  dados jsonb not null,
  atualizado timestamptz not null default now(),
  primary key (nome, id)
);

-- Anúncios vistos e clicados
create table if not exists public.eventos (
  id bigserial primary key,
  t text not null check (t in ('imp','clk')),
  c text not null,
  u uuid not null default auth.uid(),
  d date not null default current_date
);
create index if not exists eventos_d_idx on public.eventos (d);

-- Quem abriu o app em cada dia
create table if not exists public.acessos (
  dia date not null,
  user_id uuid not null,
  primary key (dia, user_id)
);

-- Compras vindas da Kiwify (preenchida pelo site, nunca pelo app)
create table if not exists public.compras (
  email text primary key,
  status text not null,
  produto text,
  atualizado timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Funções de apoio
-- ---------------------------------------------------------------------
create or replace function public.e_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

create or replace function public.existe_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins)
$$;
grant execute on function public.existe_admin() to anon, authenticated;

-- A primeira pessoa que criar conta pelo link do painel vira a administradora principal
create or replace function public.virar_primeiro_admin(p_nome text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists (select 1 from admins) then
    return exists (select 1 from admins where user_id = auth.uid());
  end if;
  insert into admins (user_id, email, nome)
    select id, email, p_nome from auth.users where id = auth.uid();
  return true;
end $$;
grant execute on function public.virar_primeiro_admin(text) to authenticated;

-- A loja confere o PIN do cupom sem que a aluna consiga ver o PIN
create or replace function public.validar_cupom(p_cupom text, p_pin text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_cupom jsonb; v_pin text;
begin
  select dados into v_cupom from colecoes where nome = 'cupons' and id = p_cupom;
  if v_cupom is null or v_cupom->>'user' <> auth.uid()::text or (v_cupom->>'usado')::boolean then return false; end if;
  select dados #>> '{}' into v_pin from colecoes where nome = 'pins' and id = v_cupom->>'parc';
  if v_pin is null or v_pin <> p_pin then return false; end if;
  update colecoes set dados = v_cupom || jsonb_build_object('usado', true, 'usadoEm', to_char(current_date, 'YYYY-MM-DD')), atualizado = now()
    where nome = 'cupons' and id = p_cupom;
  return true;
end $$;
grant execute on function public.validar_cupom(text, text) to authenticated;

-- Proteção: a aluna não consegue se dar Premium nem se desbloquear
create or replace function public.protege_aluna() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  if coalesce(auth.role(), '') = 'service_role' or e_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.bloqueado := false;
    select status into v_status from compras where lower(email) = lower(new.email);
    if v_status = 'aprovado' then
      new.premium := jsonb_build_object('tipo', 'pago', 'ate', to_char(current_date + 35, 'YYYY-MM-DD'));
    else
      new.premium := jsonb_build_object('tipo', 'teste', 'ate', to_char(current_date + 7, 'YYYY-MM-DD'));
    end if;
  else
    new.premium := old.premium;
    new.bloqueado := old.bloqueado;
    new.email := old.email;
  end if;
  return new;
end $$;
drop trigger if exists protege_aluna on public.alunas;
create trigger protege_aluna before insert or update on public.alunas
  for each row execute function public.protege_aluna();

-- Kiwify aprovou ou cancelou: atualiza o Premium da aluna
create or replace function public.aplica_compra() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aprovado' then
    update alunas set premium = jsonb_build_object('tipo', 'pago', 'ate', to_char(current_date + 35, 'YYYY-MM-DD'))
      where lower(email) = lower(new.email) and coalesce(premium->>'tipo', '') <> 'vitalicio';
  else
    update alunas set premium = null
      where lower(email) = lower(new.email) and premium->>'tipo' = 'pago';
  end if;
  return new;
end $$;
drop trigger if exists aplica_compra on public.compras;
create trigger aplica_compra after insert or update on public.compras
  for each row execute function public.aplica_compra();

-- ---------------------------------------------------------------------
-- Regras de acesso (cada aluna só vê o que é dela; o admin vê tudo)
-- ---------------------------------------------------------------------
alter table public.alunas enable row level security;
alter table public.admins enable row level security;
alter table public.colecoes enable row level security;
alter table public.eventos enable row level security;
alter table public.acessos enable row level security;
alter table public.compras enable row level security;

drop policy if exists alunas_ler on public.alunas;
create policy alunas_ler on public.alunas for select using (id = auth.uid() or e_admin());
drop policy if exists alunas_criar on public.alunas;
create policy alunas_criar on public.alunas for insert with check (id = auth.uid() or e_admin());
drop policy if exists alunas_mudar on public.alunas;
create policy alunas_mudar on public.alunas for update using (id = auth.uid() or e_admin());
drop policy if exists alunas_apagar on public.alunas;
create policy alunas_apagar on public.alunas for delete using (e_admin());

drop policy if exists admins_ler on public.admins;
create policy admins_ler on public.admins for select using (user_id = auth.uid() or e_admin());
drop policy if exists admins_mudar on public.admins;
create policy admins_mudar on public.admins for all using (e_admin()) with check (e_admin());

drop policy if exists colecoes_ler_publico on public.colecoes;
create policy colecoes_ler_publico on public.colecoes for select to anon using (nome in ('cidades', 'config'));
drop policy if exists colecoes_ler on public.colecoes;
create policy colecoes_ler on public.colecoes for select to authenticated using (
  nome in ('cidades','segmentos','config','freq','anunciantes','campanhas','parceiros','profissionais','avisos','receitasExtras','exercExtras','receitasOcultas')
  or (nome = 'cupons' and dados->>'user' = auth.uid()::text)
  or e_admin()
);
drop policy if exists colecoes_criar_cupom on public.colecoes;
create policy colecoes_criar_cupom on public.colecoes for insert to authenticated with check (
  e_admin() or (nome = 'cupons' and dados->>'user' = auth.uid()::text and coalesce((dados->>'usado')::boolean, false) = false)
);
drop policy if exists colecoes_mudar on public.colecoes;
create policy colecoes_mudar on public.colecoes for update using (e_admin()) with check (e_admin());
drop policy if exists colecoes_apagar on public.colecoes;
create policy colecoes_apagar on public.colecoes for delete using (e_admin());

drop policy if exists eventos_criar on public.eventos;
create policy eventos_criar on public.eventos for insert to authenticated with check (u = auth.uid());
drop policy if exists eventos_ler on public.eventos;
create policy eventos_ler on public.eventos for select using (u = auth.uid() or e_admin());

drop policy if exists acessos_criar on public.acessos;
create policy acessos_criar on public.acessos for insert to authenticated with check (user_id = auth.uid());
drop policy if exists acessos_ler on public.acessos;
create policy acessos_ler on public.acessos for select using (e_admin());

drop policy if exists compras_ler on public.compras;
create policy compras_ler on public.compras for select using (e_admin());

-- ---------------------------------------------------------------------
-- Conteúdo inicial (só entra se ainda não existir)
-- ---------------------------------------------------------------------
insert into public.colecoes (nome, id, dados) values
  ('cidades', '1', '{"id":1,"nome":"Cuiabá","uf":"MT","ativa":true}'),
  ('cidades', '2', '{"id":2,"nome":"Várzea Grande","uf":"MT","ativa":true}'),
  ('cidades', '3', '{"id":3,"nome":"Rondonópolis","uf":"MT","ativa":true}'),
  ('cidades', '4', '{"id":4,"nome":"Sinop","uf":"MT","ativa":true}'),
  ('cidades', '5', '{"id":5,"nome":"Outra cidade","uf":"","ativa":true}'),
  ('segmentos', '1', '{"id":1,"nome":"Academia","ativo":true}'),
  ('segmentos', '2', '{"id":2,"nome":"Suplementos","ativo":true}'),
  ('segmentos', '3', '{"id":3,"nome":"Restaurante saudável","ativo":true}'),
  ('segmentos', '4', '{"id":4,"nome":"Moda fitness","ativo":true}'),
  ('segmentos', '5', '{"id":5,"nome":"Clínica e estética","ativo":true}'),
  ('config', '1', '{"nomeApp":"CK Life","checkout":"","suporte":"","treinosParaCupom":8,"premiumPreco":19.9}'),
  ('freq', '1', '{"cliques":25,"minutos":4,"intervalo":3,"maxDia":6}'),
  ('avisos', 'boasvindas', '{"id":"boasvindas","titulo":"Bem-vinda ao CK Life","texto":"Seu plano está pronto. Treine em casa, cozinhe com a voz guiando cada passo e ganhe cupons a cada 8 treinos.","d":"2026-10-22","ativo":true}')
on conflict (nome, id) do nothing;

-- Teste rápido: deve mostrar 13
select count(*) as itens_iniciais from public.colecoes;

-- ---------------------------------------------------------------------
-- Liberar Premium manualmente (venda fora da Kiwify): troque o e-mail e rode só estas 2 linhas
-- insert into public.compras (email, status, produto) values ('cliente@email.com', 'aprovado', 'manual')
--   on conflict (email) do update set status = 'aprovado', atualizado = now();
-- ---------------------------------------------------------------------
