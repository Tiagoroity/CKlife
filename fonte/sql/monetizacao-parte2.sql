-- CK Life · Monetização · PARTE 2 de 6 (rode na ordem)
-- ---------- 2) Assinaturas (provider → assinatura → entitlement) ----------
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  plano text not null default 'pro_mensal',
  provider text not null check (provider in ('trial','kiwify','apple','google','manual','promocao','legado')),
  status text not null check (status in ('trialing','active','past_due','grace_period','canceled','expired','refunded','chargeback')),
  inicio timestamptz not null default now(),
  fim timestamptz,
  renova_em timestamptz,
  campanha text,
  preco numeric(10,2),
  external_id text,
  external_customer text,
  motivo text,
  criado_por uuid,
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now()
);
create index if not exists assin_user_idx on public.assinaturas (user_id, fim desc);
create index if not exists assin_email_idx on public.assinaturas (lower(email)) where user_id is null;
create unique index if not exists assin_ext_idx on public.assinaturas (provider, external_id) where external_id is not null;
alter table public.assinaturas enable row level security;
drop policy if exists as_ler on public.assinaturas;
create policy as_ler on public.assinaturas for select to authenticated using (user_id = auth.uid() or admin_ve('monetizacao'));
-- sem políticas de escrita: só funções do servidor, webhook (service role) e RPCs do admin escrevem

-- quem tem acesso Pro agora (pelo relógio do SERVIDOR)
create or replace function public._assinatura_vigente(p_uid uuid) returns assinaturas
language sql stable security definer set search_path = public as $$
  select * from assinaturas where user_id = p_uid and fim > now() and status in ('trialing','active','past_due','grace_period','canceled')
  order by (status = 'active') desc, (status = 'trialing') asc, fim desc limit 1;
$$;
create or replace function public._plano(p_uid uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a assinaturas; pr jsonb;
begin
  if p_uid is null then return jsonb_build_object('status', 'free', 'pro', false); end if;
  a := _assinatura_vigente(p_uid);
  if a.id is not null then
    return jsonb_build_object('status', a.status, 'pro', true, 'trial', a.status = 'trialing', 'plano', a.plano, 'provider', a.provider, 'inicio', a.inicio, 'fim', a.fim, 'renova_em', a.renova_em, 'assinatura_id', a.id);
  end if;
  -- Premium antigo (antes deste módulo) continua valendo até a data dele
  select premium into pr from alunas where id = p_uid;
  if pr is not null and (pr ->> 'tipo' = 'vitalicio' or (pr ->> 'ate')::date >= current_date) then
    return jsonb_build_object('status', case when pr ->> 'tipo' = 'teste' then 'trialing' else 'active' end, 'pro', true, 'trial', pr ->> 'tipo' = 'teste',
      'plano', 'pro_mensal', 'provider', 'legado', 'fim', case when pr ->> 'tipo' = 'vitalicio' then null else ((pr ->> 'ate')::date + 1)::timestamptz end);
  end if;
  return jsonb_build_object('status', coalesce((select status from assinaturas where user_id = p_uid order by atualizado desc limit 1), 'free'), 'pro', false, 'trial', false);
end $$;
create or replace function public.tem_pro(p_uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$ select coalesce((_plano(p_uid) ->> 'pro')::boolean, false) $$;

-- Trial automático só para NOVAS usuárias (sem trial retroativo)
create or replace function public.inicia_trial() returns trigger
language plpgsql security definer set search_path = public as $$
declare dias int := coalesce((cfg('monetizacao', 'trial_days'))::int, 7);
begin
  update assinaturas set user_id = new.id, atualizado = now() where user_id is null and lower(email) = lower(new.email);  -- compra feita antes do cadastro
  if not exists (select 1 from assinaturas where user_id = new.id and provider = 'trial') then
    insert into assinaturas (user_id, email, plano, provider, status, inicio, fim) values (new.id, new.email, 'pro_mensal', 'trial', 'trialing', now(), now() + make_interval(days => dias));
    insert into eventos_app (nome, user_id) values ('trial_started', new.id);
  end if;
  return new;
end $$;

-- ---------- 3) Recursos Free / Trial / Pro (feature flags administráveis) ----------
create table if not exists public.recursos (
  id text primary key,
  nome text not null,
  descricao text,
  free boolean not null default false,
  trial boolean not null default true,
  pro boolean not null default true,
  limite_free int,
  limite_pro int,
  ativo boolean not null default true,
  ordem int not null default 0
);
alter table public.recursos enable row level security;
drop policy if exists rc_ler on public.recursos;
create policy rc_ler on public.recursos for select using (true);
drop policy if exists rc_mudar on public.recursos;
create policy rc_mudar on public.recursos for update to authenticated using (admin_pode('monetizacao')) with check (admin_pode('monetizacao'));
drop policy if exists rc_criar on public.recursos;
create policy rc_criar on public.recursos for insert to authenticated with check (admin_pode('monetizacao'));
drop trigger if exists audita_recursos on public.recursos;
create trigger audita_recursos after insert or update on public.recursos for each row execute function public.audita_mudanca();
insert into public.recursos (id, nome, descricao, free, limite_free, limite_pro, ordem) values
  ('programas_completos', 'Programas completos', 'Programas de várias semanas e programas especiais', false, null, null, 10),
  ('treinos_rapidos_todos', 'Coleção completa de treinos rápidos', 'Free tem os treinos rápidos básicos', false, 3, null, 11),
  ('adaptacao_treino', 'Adaptação e dificuldade dinâmica', 'Avaliação fácil/difícil ajusta os próximos treinos', false, null, null, 12),
  ('desafios_longos', 'Desafios de 21 e 30 dias', 'Desafio de 7 dias é grátis', false, null, null, 13),
  ('graficos_avancados', 'Evolução avançada', 'Gráficos completos de peso, medidas e treinos', false, null, null, 14),
  ('sugestoes_energia', 'Treino adaptado à energia', 'Sugestões inteligentes a partir do check-in', false, null, null, 15),
  ('receitas_todas', 'Todas as receitas', 'Cada receita pode ser Free ou Pro', false, null, null, 20),
  ('cardapio', 'Cardápio semanal', null, false, null, null, 21),
  ('modo_cozinha', 'Modo cozinha por voz', null, false, null, null, 22),
  ('ciclo_avancado', 'Ciclo inteligente', 'Sintomas avançados, insights e adaptação do treino', false, null, null, 30),
  ('stickers_todos', 'Todas as figurinhas', 'Free usa as figurinhas marcadas como grátis', false, 25, null, 40),
  ('figurinha_propria', 'Criar figurinha com a própria foto', null, false, null, null, 41),
  ('filtros_todos', 'Todos os filtros', 'Free usa os filtros marcados como grátis', false, 3, null, 42),
  ('maquiagem', 'Maquiagem virtual', 'Batom, blush e futuras ferramentas', false, null, null, 43),
  ('selos_dados', 'Selos com dados reais do treino', 'No editor de Story', false, null, null, 44),
  ('video_longo', 'Vídeos mais longos', 'Free envia vídeo curto; limites em segundos', true, 15, 60, 45),
  ('clube_pro', 'Clube CK Pro', 'Benefícios marcados como Pro', false, null, null, 50),
  ('verificacao', 'Direito de pedir verificação (selo azul)', 'Pagamento não dá o selo; ele depende de aprovação', false, null, null, 60),
  ('sem_anuncios', 'Sem anúncios', 'Free fica sem anúncios nos primeiros dias (ads_free_days)', false, null, null, 70)
on conflict (id) do nothing;
create or replace function public.pode_recurso(p_id text, p_uid uuid default auth.uid()) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r recursos; pl jsonb;
begin
  select * into r from recursos where id = p_id;
  if r.id is null or not r.ativo then return true; end if;
  pl := _plano(p_uid);
  if (pl ->> 'pro')::boolean then return case when (pl ->> 'trial')::boolean then r.trial else r.pro end; end if;
  return r.free;
end $$;
grant execute on function public.pode_recurso(text, uuid) to authenticated;

