-- =====================================================================
-- CK Life · MONETIZAÇÃO (Free / Trial / Pro), ofertas, Kiwify, recursos,
-- verificação (selo azul), analytics e figurinhas Pro.
-- Só ADICIONA. Não apaga dados. Pode rodar mais de uma vez.
-- Regra central: o app pergunta "ela tem CK_LIFE_PRO?" (entitlement), nunca "ela pagou na Kiwify?".
-- =====================================================================

-- ---------- 0) Configuração central (sem segredos) ----------
create table if not exists public.app_config (
  chave text primary key,
  valor jsonb not null,
  atualizado timestamptz not null default now()
);
alter table public.app_config enable row level security;
drop policy if exists ac_ler on public.app_config;
create policy ac_ler on public.app_config for select using (true);
drop policy if exists ac_criar on public.app_config;
create policy ac_criar on public.app_config for insert to authenticated with check (admin_pode('monetizacao'));
drop policy if exists ac_mudar on public.app_config;
create policy ac_mudar on public.app_config for update to authenticated using (admin_pode('monetizacao')) with check (admin_pode('monetizacao'));
insert into public.app_config (chave, valor) values
  ('monetizacao', '{"trial_days":7,"ads_free_days":30,"offer_cooldown_days":15,"offer_duration_hours":48,"trial_offer_day":5,"max_ofertas_90d":4,"contextos_oferta":["treino_concluido","recurso_pro","sticker_pro","programa_pro","grafico_pro","paywall"]}'),
  ('treino_voz', '{"ativo":true,"idioma":"pt-BR","velocidade":1,"modo":"sempre","contagem":3,"permitir_pular":true}'),
  ('video', '{"free_segundos":15,"pro_segundos":60}')
on conflict (chave) do nothing;
create or replace function public.cfg(p_chave text, p_campo text) returns jsonb
language sql stable security definer set search_path = public as $$ select valor -> p_campo from app_config where chave = p_chave $$;
create or replace function public.audita_mudanca() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform auditar(tg_table_name || '_' || lower(tg_op), tg_table_name, coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'chave', to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'chave'));
  return coalesce(new, old);
end $$;
drop trigger if exists audita_app_config on public.app_config;
create trigger audita_app_config after insert or update on public.app_config for each row execute function public.audita_mudanca();

-- ---------- 1) Planos (preço num lugar só) ----------
create table if not exists public.planos (
  id text primary key,
  nome text not null,
  descricao text,
  periodo text not null check (periodo in ('gratis','mes','ano')),
  preco numeric(10,2) not null default 0,
  parcelas int,
  parcela_valor numeric(10,2),
  parcelamento boolean not null default false,   -- só mostra "12x" quando o checkout realmente permitir
  provider text not null default 'kiwify',
  product_id text,
  checkout_url text,
  beneficios text[] not null default '{}',
  ativo boolean not null default true,
  ordem int not null default 0,
  atualizado timestamptz not null default now()
);
alter table public.planos enable row level security;
drop policy if exists pl_ler on public.planos;
create policy pl_ler on public.planos for select using (true);
drop policy if exists pl_criar on public.planos;
create policy pl_criar on public.planos for insert to authenticated with check (admin_pode('monetizacao'));
drop policy if exists pl_mudar on public.planos;
create policy pl_mudar on public.planos for update to authenticated using (admin_pode('monetizacao')) with check (admin_pode('monetizacao'));
drop trigger if exists audita_planos on public.planos;
create trigger audita_planos after insert or update on public.planos for each row execute function public.audita_mudanca();
insert into public.planos (id, nome, descricao, periodo, preco, parcelas, parcela_valor, ordem, beneficios) values
  ('free', 'CK Life Free', 'Treino do dia, comunidade completa, conquistas e Explorar.', 'gratis', 0, null, null, 0, '{}'),
  ('pro_mensal', 'CK Life Pro Mensal', 'Experiência completa, renovada todo mês.', 'mes', 19.99, null, null, 1, array['Programas e treinos completos','Nutrição completa','Ciclo inteligente','Evolução avançada','Stickers e recursos criativos','Clube CK Pro','Direito à verificação','Sem anúncios']),
  ('pro_anual', 'CK Life Pro Anual', 'Experiência completa por 12 meses.', 'ano', 155.88, 12, 12.99, 2, array['Programas e treinos completos','Nutrição completa','Ciclo inteligente','Evolução avançada','Stickers e recursos criativos','Clube CK Pro','Direito à verificação','Sem anúncios'])
on conflict (id) do nothing;

-- links de checkout da Kiwify (só os 4 checkouts; a "Sales Page" não é usada aqui)
update public.planos set checkout_url = 'https://pay.kiwify.com.br/8aZsaN7' where id = 'pro_mensal' and checkout_url is null;
update public.planos set checkout_url = 'https://pay.kiwify.com.br/izQCfTE' where id = 'pro_anual' and checkout_url is null;

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

-- ---------- 4) Ofertas (campanhas + oferta por usuária, prazo REAL no servidor) ----------
create table if not exists public.campanhas_oferta (
  id text primary key,
  nome text not null,
  titulo text not null,
  subtitulo text,
  mensagem text,
  publico text not null default 'free' check (publico in ('trial','free','todos')),
  preco_mensal_promo numeric(10,2),
  meses_promo int,
  preco_anual_promo numeric(10,2),
  parcelas_anual int,
  parcela_anual_valor numeric(10,2),
  duracao_horas int not null default 48,
  provider text not null default 'kiwify',
  product_mensal text,
  product_anual text,
  checkout_mensal_url text,
  checkout_anual_url text,
  ativo boolean not null default true,
  prioridade int not null default 0,
  max_impressoes int not null default 6,
  inicio timestamptz,
  fim timestamptz
);
alter table public.campanhas_oferta enable row level security;
drop policy if exists co_ler on public.campanhas_oferta;
create policy co_ler on public.campanhas_oferta for select to authenticated using (admin_ve('monetizacao'));
drop policy if exists co_criar on public.campanhas_oferta;
create policy co_criar on public.campanhas_oferta for insert to authenticated with check (admin_pode('monetizacao'));
drop policy if exists co_mudar on public.campanhas_oferta;
create policy co_mudar on public.campanhas_oferta for update to authenticated using (admin_pode('monetizacao')) with check (admin_pode('monetizacao'));
drop trigger if exists audita_campanhas_oferta on public.campanhas_oferta;
create trigger audita_campanhas_oferta after insert or update on public.campanhas_oferta for each row execute function public.audita_mudanca();
insert into public.campanhas_oferta (id, nome, titulo, subtitulo, mensagem, publico, preco_mensal_promo, meses_promo, preco_anual_promo, parcelas_anual, parcela_anual_valor, prioridade) values
  ('trial-dia5', 'Fim do teste (dia 5)', 'CK Life Pro', 'Continue vivendo a experiência completa.', 'Condição especial por 48 horas para quem está no teste.', 'trial', 11.99, 12, 119.88, 12, 9.99, 100),
  ('sentimos-falta', 'Sentimos sua falta', 'Sentimos sua falta no Pro.', 'Volte para a experiência completa.', null, 'free', 11.99, 12, 119.88, 12, 9.99, 10),
  ('condicao-ck', 'Condição CK', 'Uma condição CK foi liberada para você.', 'Por tempo limitado.', null, 'free', 11.99, 12, 119.88, 12, 9.99, 10),
  ('volte-completa', 'Volte completa', 'Volte para sua experiência completa.', 'Programas, nutrição e ciclo inteligente.', null, 'free', 11.99, 12, 119.88, 12, 9.99, 10),
  ('continue-evolucao', 'Continue sua evolução', 'Continue sua evolução.', 'Evolução avançada e treinos completos.', null, 'free', 11.99, 12, 119.88, 12, 9.99, 10),
  ('acesso-especial', 'Acesso especial', 'Seu acesso especial voltou.', 'Uma condição só para você.', null, 'free', 11.99, 12, 119.88, 12, 9.99, 10)
on conflict (id) do nothing;
create table if not exists public.ofertas_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campanha_id text not null references public.campanhas_oferta(id),
  contexto text,
  inicio timestamptz not null default now(),
  expira timestamptz not null,
  impressoes int not null default 0,
  cliques int not null default 0,
  checkouts int not null default 0,
  convertida boolean not null default false
);
create index if not exists ofu_user_idx on public.ofertas_usuario (user_id, expira desc);
alter table public.ofertas_usuario enable row level security;
drop policy if exists ofu_ler on public.ofertas_usuario;
create policy ofu_ler on public.ofertas_usuario for select to authenticated using (user_id = auth.uid() or admin_ve('monetizacao'));
create or replace function public._oferta_json(o ofertas_usuario) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', o.id, 'campanha', c.id, 'titulo', c.titulo, 'subtitulo', c.subtitulo, 'mensagem', c.mensagem, 'expira', o.expira, 'agora', now(),
    'preco_mensal_promo', c.preco_mensal_promo, 'meses_promo', c.meses_promo, 'preco_anual_promo', c.preco_anual_promo, 'parcelas_anual', c.parcelas_anual, 'parcela_anual_valor', c.parcela_anual_valor,
    'checkout_mensal_url', c.checkout_mensal_url, 'checkout_anual_url', c.checkout_anual_url, 'provider', c.provider)
  from campanhas_oferta c where c.id = o.campanha_id;
$$;
create or replace function public.oferta_ativar(p_contexto text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pl jsonb; o ofertas_usuario; c campanhas_oferta; ult ofertas_usuario; m jsonb := (select valor from app_config where chave = 'monetizacao');
begin
  if uid is null then return null; end if;
  select * into o from ofertas_usuario where user_id = uid and expira > now() order by expira desc limit 1;
  if o.id is not null then return _oferta_json(o); end if;
  pl := _plano(uid);
  if (pl ->> 'pro')::boolean and not (pl ->> 'trial')::boolean then return null; end if;          -- já assina: sem oferta
  if (pl ->> 'trial')::boolean then
    -- teste: oferta a partir do dia 5 (uma vez)
    if now() < (pl ->> 'inicio')::timestamptz + make_interval(days => coalesce((m ->> 'trial_offer_day')::int, 5) - 1) then return null; end if;
    if exists (select 1 from ofertas_usuario u join campanhas_oferta k on k.id = u.campanha_id where u.user_id = uid and k.publico = 'trial') then return null; end if;
    select * into c from campanhas_oferta where ativo and publico = 'trial' and (inicio is null or inicio <= now()) and (fim is null or fim > now()) order by prioridade desc limit 1;
  else
    -- Free: só em momentos naturais, com intervalo e limite
    if p_contexto is null or not (m -> 'contextos_oferta') ? p_contexto then return null; end if;
    select * into ult from ofertas_usuario where user_id = uid order by expira desc limit 1;
    if ult.id is not null and ult.expira > now() - make_interval(days => coalesce((m ->> 'offer_cooldown_days')::int, 15)) then return null; end if;
    if (select count(*) from ofertas_usuario where user_id = uid and inicio > now() - interval '90 days') >= coalesce((m ->> 'max_ofertas_90d')::int, 4) then return null; end if;
    select * into c from campanhas_oferta where ativo and publico in ('free','todos') and (inicio is null or inicio <= now()) and (fim is null or fim > now())
      and id is distinct from ult.campanha_id order by prioridade desc, random() limit 1;
  end if;
  if c.id is null then return null; end if;
  insert into ofertas_usuario (user_id, campanha_id, contexto, expira) values (uid, c.id, p_contexto, now() + make_interval(hours => coalesce(c.duracao_horas, (m ->> 'offer_duration_hours')::int, 48))) returning * into o;
  insert into eventos_app (nome, user_id, props) values ('trial_offer_shown', uid, jsonb_build_object('campanha', c.id, 'contexto', p_contexto));
  return _oferta_json(o);
end $$;
grant execute on function public.oferta_ativar(text) to authenticated;
create or replace function public.oferta_evento(p_id uuid, p_tipo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update ofertas_usuario set impressoes = impressoes + (p_tipo = 'impressao')::int, cliques = cliques + (p_tipo = 'clique')::int, checkouts = checkouts + (p_tipo = 'checkout')::int
  where id = p_id and user_id = auth.uid() and (p_tipo <> 'impressao' or impressoes < (select max_impressoes from campanhas_oferta c where c.id = campanha_id));
end $$;
grant execute on function public.oferta_evento(uuid, text) to authenticated;

update public.campanhas_oferta set checkout_mensal_url = 'https://pay.kiwify.com.br/Ukjfxn9' where checkout_mensal_url is null;
update public.campanhas_oferta set checkout_anual_url = 'https://pay.kiwify.com.br/FR31cUG' where checkout_anual_url is null;

-- ---------- 5) Analytics (sem conteúdo de conversa, sem sintomas) ----------
create table if not exists public.eventos_app (
  id bigserial primary key,
  nome text not null check (nome in ('trial_started','trial_offer_shown','offer_clicked','paywall_viewed','checkout_started','subscription_started','subscription_renewed','subscription_canceled','subscription_expired',
    'pro_feature_clicked','ad_impression','ad_click','verification_requested','verification_approved','exercise_explanation_started','exercise_explanation_completed','exercise_explanation_repeated','exercise_started','exercise_completed')),
  user_id uuid default auth.uid(),
  props jsonb check (props is null or pg_column_size(props) < 1500),
  criado timestamptz not null default now()
);
create index if not exists ev_app_idx on public.eventos_app (nome, criado desc);
alter table public.eventos_app enable row level security;
drop policy if exists ea_ler on public.eventos_app;
create policy ea_ler on public.eventos_app for select to authenticated using (admin_ve('monetizacao') or admin_ve('metricas'));
create or replace function public.registra_evento(p_nome text, p_props jsonb default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if p_nome in ('subscription_started','subscription_renewed','subscription_canceled','subscription_expired','trial_started','verification_approved') then return; end if;  -- só o servidor registra
  insert into eventos_app (nome, user_id, props) values (p_nome, auth.uid(), p_props);
exception when others then return;
end $$;
grant execute on function public.registra_evento(text, jsonb) to authenticated;
drop trigger if exists inicia_trial on public.alunas;
create trigger inicia_trial after insert on public.alunas for each row execute function public.inicia_trial();

-- ---------- 6) Webhooks (Kiwify agora; Apple/Google depois) ----------
create table if not exists public.webhook_eventos (
  id bigserial primary key,
  provider text not null,
  evento text not null,
  order_id text not null,
  external_id text,
  email text,
  status text not null default 'recebido' check (status in ('recebido','processado','ignorado','erro')),
  erro text,
  valor numeric(10,2),
  payload jsonb,
  criado timestamptz not null default now(),
  processado timestamptz,
  unique (provider, order_id, evento)
);
alter table public.webhook_eventos enable row level security;
drop policy if exists we_ler on public.webhook_eventos;
create policy we_ler on public.webhook_eventos for select to authenticated using (admin_ve('monetizacao'));
-- processa um evento JÁ AUTENTICADO pela função da Vercel (assinatura HMAC-SHA1 conferida lá). Só a chave de serviço chama.
create or replace function public.kiwify_processa(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ev text := p ->> 'webhook_event_type'; oid text := p ->> 'order_id'; sid text := coalesce(p ->> 'subscription_id', p -> 'Subscription' ->> 'id');
  em text := lower(coalesce(p -> 'Customer' ->> 'email', p -> 'customer' ->> 'email', p ->> 'email'));
  prod text := coalesce(p -> 'Product' ->> 'product_id', p -> 'Product' ->> 'id', p -> 'product' ->> 'id');
  freq text := p -> 'Subscription' -> 'plan' ->> 'frequency';
  ate timestamptz := coalesce((p -> 'Subscription' -> 'customer_access' ->> 'access_until')::timestamptz, (p -> 'Subscription' ->> 'next_payment')::timestamptz);
  tem_acesso boolean := coalesce((p -> 'Subscription' -> 'customer_access' ->> 'has_access')::boolean, true);
  pl text; camp text; uid uuid; novo_status text; we_id bigint; v_valor numeric;
begin
  if ev is null or oid is null then return jsonb_build_object('ok', false, 'erro', 'payload sem webhook_event_type/order_id'); end if;
  insert into webhook_eventos (provider, evento, order_id, external_id, email, payload)
    values ('kiwify', ev, oid, sid, em, p - 'Customer' - 'customer' - 'TrackingParameters' - 'Commissions')
    on conflict (provider, order_id, evento) do nothing returning id into we_id;
  if we_id is null then return jsonb_build_object('ok', true, 'duplicado', true); end if;   -- idempotência
  if ev in ('billet_created','pix_created','order_rejected') then
    update webhook_eventos set status = 'ignorado', processado = now() where id = we_id; return jsonb_build_object('ok', true, 'ignorado', ev);
  end if;
  select id into pl from planos where product_id is not null and product_id = prod;
  if pl is null then select id, case when product_anual = prod then 'pro_anual' else 'pro_mensal' end into camp, pl from campanhas_oferta where prod is not null and prod in (product_mensal, product_anual) limit 1; end if;
  if pl is null then pl := case when freq in ('annually','yearly','annual') then 'pro_anual' else 'pro_mensal' end; end if;
  if em is not null then select id into uid from alunas where lower(email) = em limit 1; end if;
  novo_status := case ev when 'order_approved' then 'active' when 'subscription_renewed' then 'active' when 'subscription_late' then case when tem_acesso then 'grace_period' else 'past_due' end
    when 'subscription_canceled' then case when tem_acesso and ate > now() then 'canceled' else 'expired' end when 'order_refunded' then 'refunded' when 'chargeback' then 'chargeback' end;
  if novo_status is null then update webhook_eventos set status = 'ignorado', processado = now() where id = we_id; return jsonb_build_object('ok', true, 'ignorado', ev); end if;
  if ate is null then ate := case when novo_status = 'active' then now() + case when pl = 'pro_anual' then interval '366 days' else interval '32 days' end else now() end; end if;
  if novo_status in ('refunded','chargeback') then ate := now(); end if;
  begin v_valor := ((p -> 'Subscription' -> 'charges' -> 'completed' -> -1 ->> 'amount')::numeric) / 100; exception when others then v_valor := null; end;
  update webhook_eventos set valor = v_valor where id = we_id;
  if sid is not null and exists (select 1 from assinaturas where provider = 'kiwify' and external_id = sid) then
    update assinaturas set status = novo_status, fim = ate, renova_em = case when novo_status = 'active' then ate else renova_em end, plano = coalesce(pl, plano),
      user_id = coalesce(user_id, uid), email = coalesce(email, em), atualizado = now() where provider = 'kiwify' and external_id = sid;
  elsif novo_status = 'active' then
    insert into assinaturas (user_id, email, plano, provider, status, inicio, fim, renova_em, campanha, external_id, preco)
      values (uid, em, pl, 'kiwify', 'active', now(), ate, ate, camp, coalesce(sid, oid), v_valor);
  else
    update assinaturas set status = novo_status, fim = least(coalesce(fim, ate), ate), atualizado = now()
      where provider = 'kiwify' and (external_id = oid or (user_id = uid and uid is not null and status in ('active','past_due','grace_period')));
  end if;
  if uid is not null then
    update ofertas_usuario set convertida = true where user_id = uid and novo_status = 'active' and expira > now() - interval '3 days';
    insert into eventos_app (nome, user_id, props) values (case ev when 'subscription_renewed' then 'subscription_renewed' when 'order_approved' then 'subscription_started'
      when 'subscription_canceled' then 'subscription_canceled' else 'subscription_expired' end, uid, jsonb_build_object('provider', 'kiwify', 'plano', pl, 'status', novo_status));
  end if;
  update webhook_eventos set status = 'processado', processado = now(), erro = case when uid is null then 'usuária ainda sem conta com este e-mail (liga no cadastro)' end where id = we_id;
  return jsonb_build_object('ok', true, 'status', novo_status, 'plano', pl, 'usuaria', uid is not null);
exception when others then
  update webhook_eventos set status = 'erro', erro = left(sqlerrm, 300) where id = we_id;
  return jsonb_build_object('ok', false, 'erro', sqlerrm);
end $$;
revoke all on function public.kiwify_processa(jsonb) from public, anon, authenticated;
grant execute on function public.kiwify_processa(jsonb) to service_role;

-- ---------- 7) Admin: conceder / remover Pro, trial para existentes, resumo ----------
create or replace function public.admin_conceder_pro(p_user uuid, p_dias int, p_motivo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  if not admin_pode('monetizacao') then raise exception 'sem permissão'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  if p_dias is null or p_dias < 1 or p_dias > 3660 then raise exception 'período inválido'; end if;
  insert into assinaturas (user_id, email, plano, provider, status, inicio, fim, motivo, criado_por)
    select p_user, email, case when p_dias >= 365 then 'pro_anual' else 'pro_mensal' end, 'manual', 'active', now(), now() + make_interval(days => p_dias), p_motivo, auth.uid() from alunas where id = p_user returning id into nid;
  perform auditar('pro_concedido', 'assinaturas', p_user::text, 'ok', p_dias || ' dias · ' || p_motivo);
  return nid;
end $$;
create or replace function public.admin_remover_pro(p_assinatura uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('monetizacao') then raise exception 'sem permissão'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  update assinaturas set status = 'expired', fim = now(), motivo = p_motivo, atualizado = now() where id = p_assinatura;
  perform auditar('pro_removido', 'assinaturas', p_assinatura::text, 'ok', p_motivo);
end $$;
create or replace function public.admin_trial_existentes(p_dias int, p_motivo text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not admin_pode('monetizacao') then raise exception 'sem permissão'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  insert into assinaturas (user_id, email, plano, provider, status, inicio, fim, motivo, criado_por)
    select a.id, a.email, 'pro_mensal', 'promocao', 'trialing', now(), now() + make_interval(days => p_dias), p_motivo, auth.uid() from alunas a
    where not tem_pro(a.id);
  get diagnostics n = row_count;
  perform auditar('trial_existentes', 'assinaturas', n::text, 'ok', p_dias || ' dias · ' || p_motivo);
  return n;
end $$;
create or replace function public.admin_monetizacao_resumo() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not admin_ve('monetizacao') then return null; end if;
  with st as (select a.id, a.cidade, _plano(a.id) pl from alunas a)
  select jsonb_build_object(
    'usuarias', (select count(*) from st),
    'free', (select count(*) from st where not (pl ->> 'pro')::boolean),
    'trial', (select count(*) from st where (pl ->> 'pro')::boolean and (pl ->> 'trial')::boolean),
    'pro', (select count(*) from st where (pl ->> 'pro')::boolean and not (pl ->> 'trial')::boolean),
    'mensais', (select count(*) from st where (pl ->> 'pro')::boolean and not (pl ->> 'trial')::boolean and pl ->> 'plano' = 'pro_mensal'),
    'anuais', (select count(*) from st where (pl ->> 'pro')::boolean and not (pl ->> 'trial')::boolean and pl ->> 'plano' = 'pro_anual'),
    'trials_30d', (select count(*) from assinaturas where provider in ('trial','promocao') and inicio > now() - interval '30 days'),
    'trial_termina_hoje', (select count(*) from assinaturas where status = 'trialing' and fim between now() and now() + interval '24 hours'),
    'trial_termina_48h', (select count(*) from assinaturas where status = 'trialing' and fim between now() and now() + interval '48 hours'),
    'trial_expirados_30d', (select count(*) from assinaturas t where t.provider = 'trial' and t.fim between now() - interval '30 days' and now()),
    'trial_convertidos', (select count(distinct t.user_id) from assinaturas t join assinaturas p on p.user_id = t.user_id and p.provider in ('kiwify','apple','google') and p.inicio >= t.inicio where t.provider = 'trial'),
    'cancelamentos_30d', (select count(*) from assinaturas where status in ('canceled','expired') and provider in ('kiwify','apple','google') and atualizado > now() - interval '30 days'),
    'past_due', (select count(*) from assinaturas where status in ('past_due','grace_period') and fim > now()),
    'receita_bruta_30d', (select coalesce(sum(valor), 0) from webhook_eventos where evento in ('order_approved','subscription_renewed') and status = 'processado' and criado > now() - interval '30 days'),
    'reembolsos_30d', (select count(*) from webhook_eventos where evento = 'order_refunded' and criado > now() - interval '30 days'),
    'chargebacks_30d', (select count(*) from webhook_eventos where evento = 'chargeback' and criado > now() - interval '30 days'),
    'pro_por_cidade', (select coalesce(jsonb_object_agg(coalesce(cidade::text, '-'), n), '{}') from (select cidade, count(*) n from st where (pl ->> 'pro')::boolean and not (pl ->> 'trial')::boolean group by cidade) x),
    'ofertas', (select coalesce(jsonb_agg(jsonb_build_object('campanha', campanha_id, 'ofertas', n, 'impressoes', i, 'cliques', c, 'checkouts', k, 'conversoes', v)), '[]') from
      (select campanha_id, count(*) n, sum(impressoes) i, sum(cliques) c, sum(checkouts) k, count(*) filter (where convertida) v from ofertas_usuario group by campanha_id) o)
  ) into r;
  return r;
end $$;

-- ---------- 8) Verificação (selo azul = pessoa real, NÃO = pagamento) ----------
alter table public.perfis add column if not exists verificada boolean not null default false;
alter table public.perfis add column if not exists pro_ate timestamptz;
create or replace function public.protege_perfil_selos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_setting('ck.sistema', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then new.verificada := false;
    new.pro_ate := (select max(fim) from assinaturas where user_id = new.user_id and provider in ('kiwify','apple','google','manual','legado') and status in ('active','canceled','past_due','grace_period') and fim > now());
    return new; end if;
  new.verificada := old.verificada; new.pro_ate := old.pro_ate;    -- ninguém se dá selo ou coroa
  return new;
end $$;
drop trigger if exists protege_perfil_selos on public.perfis;
create trigger protege_perfil_selos before insert or update on public.perfis for each row execute function public.protege_perfil_selos();
-- 👑 pública só para assinatura paga (o teste não mostra coroa)
create or replace function public.sincroniza_coroa(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare f timestamptz;
begin
  if p_uid is null then return; end if;
  select max(fim) into f from assinaturas where user_id = p_uid and provider in ('kiwify','apple','google','manual','legado') and status in ('active','canceled','past_due','grace_period') and fim > now();
  perform set_config('ck.sistema', '1', true);
  update perfis set pro_ate = f where user_id = p_uid and pro_ate is distinct from f;
  perform set_config('ck.sistema', '0', true);
end $$;
create or replace function public.assinatura_mudou() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform sincroniza_coroa(new.user_id); return new; end $$;
drop trigger if exists assinatura_mudou on public.assinaturas;
create trigger assinatura_mudou after insert or update on public.assinaturas for each row execute function public.assinatura_mudou();

create table if not exists public.verificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','verified','rejected','needs_review','revoked')),
  selfie text,          -- foto privada (pasta "verificacao"), só a própria e o revisor abrem
  codigo text,          -- código que ela segura na selfie
  motivo text,
  revisado_por uuid,
  revisado_em timestamptz,
  criado timestamptz not null default now()
);
create index if not exists verif_user_idx on public.verificacoes (user_id, criado desc);
alter table public.verificacoes enable row level security;
drop policy if exists vf_ler on public.verificacoes;
create policy vf_ler on public.verificacoes for select to authenticated using (user_id = auth.uid() or admin_ve('verificacoes'));
drop policy if exists vf_criar on public.verificacoes;
create policy vf_criar on public.verificacoes for insert to authenticated with check (
  user_id = auth.uid() and pode_recurso('verificacao') and (selfie is null or selfie like 'verificacao/' || auth.uid()::text || '/%')
  and not exists (select 1 from verificacoes v where v.user_id = auth.uid() and v.status in ('pending','needs_review','verified')));
create or replace function public.protege_verificacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then new.status := 'pending'; new.revisado_por := null; new.revisado_em := null; new.motivo := null; new.codigo := upper(substr(md5(random()::text), 1, 6)); end if;
  return new;
end $$;
drop trigger if exists protege_verificacao on public.verificacoes;
create trigger protege_verificacao before insert on public.verificacoes for each row execute function public.protege_verificacao();
create or replace function public.verificacao_decidir(p_id uuid, p_status text, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare v verificacoes;
begin
  if not admin_pode('verificacoes') then raise exception 'sem permissão'; end if;
  if p_status not in ('verified','rejected','needs_review','revoked') then raise exception 'status inválido'; end if;
  if p_status in ('rejected','revoked','needs_review') and coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  update verificacoes set status = p_status, motivo = p_motivo, revisado_por = auth.uid(), revisado_em = now() where id = p_id returning * into v;
  if v.id is null then raise exception 'pedido não encontrado'; end if;
  perform set_config('ck.sistema', '1', true);
  update perfis set verificada = (p_status = 'verified') where user_id = v.user_id;
  perform set_config('ck.sistema', '0', true);
  if p_status = 'verified' then insert into eventos_app (nome, user_id) values ('verification_approved', v.user_id); end if;
  perform auditar('verificacao_' || p_status, 'verificacoes', v.user_id::text, 'ok', p_motivo);
end $$;

create or replace function public.verificacao_selfie(p_id uuid, p_selfie text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_selfie not like 'verificacao/' || auth.uid()::text || '/%' then raise exception 'arquivo inválido'; end if;
  update verificacoes set selfie = p_selfie where id = p_id and user_id = auth.uid() and status in ('pending','needs_review');
  if not found then raise exception 'pedido não encontrado'; end if;
  update verificacoes set status = 'pending' where id = p_id;
end $$;
grant execute on function public.verificacao_selfie(uuid, text) to authenticated;
-- storage: pasta privada "verificacao" (só a dona e o revisor)
create or replace function public.social_pode_ler(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/'); dono uuid; conv uuid;
begin
  if auth.uid() is null or array_length(parte, 1) < 3 then return false; end if;
  if parte[1] = 'perfil' then dono := parte[2]::uuid; return dono = auth.uid() or not bloqueio_entre(auth.uid(), dono) or e_admin();
  elsif parte[1] = 'figurinha' then return parte[2] = auth.uid()::text;
  elsif parte[1] = 'verificacao' then return parte[2] = auth.uid()::text or admin_ve('verificacoes');
  elsif parte[1] = 'post' then dono := parte[2]::uuid;
    return dono = auth.uid() or exists (select 1 from posts p where p.midia = p_nome and ((not p.oculto and pode_ver(p.user_id)) or e_admin()));
  elsif parte[1] = 'story' then dono := parte[2]::uuid;
    return exists (select 1 from stories s where s.midia = p_nome and s.expira > now() and (s.user_id = auth.uid() or (not s.oculto and pode_ver(s.user_id))))
      or (admin_ve('moderacao') and exists (select 1 from stories s join denuncias d on d.tipo = 'story' and d.alvo_id = s.id::text where s.midia = p_nome));
  elsif parte[1] = 'chat' then conv := parte[2]::uuid;
    return e_participante(conv)
      or (admin_ve('moderacao') and exists (select 1 from mensagens m join denuncias d on d.tipo = 'mensagem' and d.alvo_id = m.id::text where m.midia = p_nome));
  end if;
  return false;
exception when others then return false;
end $$;
create or replace function public.social_pode_gravar(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/');
begin
  if auth.uid() is null or array_length(parte, 1) <> 3 then return false; end if;
  if parte[3] !~ '^[a-zA-Z0-9_-]{6,80}\.(jpg|jpeg|png|webp|webm|m4a|mp4|mov|ogg|mp3|aac)$' then return false; end if;
  if parte[1] = 'verificacao' then return parte[2] = auth.uid()::text and pode_recurso('verificacao'); end if;
  if not pode_postar() then return false; end if;
  if parte[1] = 'figurinha' then return parte[2] = auth.uid()::text and pode_recurso('figurinha_propria'); end if;
  if parte[1] in ('perfil','post','story') then return parte[2] = auth.uid()::text; end if;
  if parte[1] = 'chat' then return e_participante(parte[2]::uuid) and not bloqueio_entre(auth.uid(), outro_da_conversa(parte[2]::uuid)); end if;
  return false;
exception when others then return false;
end $$;

-- ---------- 9) Figurinhas Pro validadas no servidor ----------
alter table public.figurinhas_catalogo add column if not exists pro boolean not null default false;
do $$ begin
  if not exists (select 1 from figurinhas_catalogo where pro) then
    update figurinhas_catalogo set pro = id not in ('hoje-teve','a-gata-foi','constancia-linda','ck-girl','create-keep-live','voce-apareceu-por-voce','bora-juntas','treino-concluido',
      'orgulho-de-voce','amei','concluido','mais-um-check','missao-cumprida','que-tudooo','to-com-voce','voce-inspira','isso-ai-mulher','bom-diaaa','partiu','voce-consegue',
      'vai-com-tudo','um-passo-de-cada-vez','sobrevivi-ao-treino','treino-pago','to-feliz');
  end if;
end $$;
create or replace function public.confere_figurinha_pro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.figurinha is not null and exists (select 1 from figurinhas_catalogo where id = new.figurinha and pro) and not pode_recurso('stickers_todos') then
    raise exception 'figurinha disponível no CK Life Pro';
  end if;
  return new;
end $$;
drop trigger if exists confere_figurinha_pro on public.comentarios;
create trigger confere_figurinha_pro before insert on public.comentarios for each row execute function public.confere_figurinha_pro();
drop trigger if exists confere_figurinha_pro on public.posts;
create trigger confere_figurinha_pro before insert on public.posts for each row execute function public.confere_figurinha_pro();
drop policy if exists fg_criar on public.figurinhas;
create policy fg_criar on public.figurinhas for insert to authenticated with check (user_id = auth.uid() and midia like 'figurinha/' || auth.uid()::text || '/%' and pode_recurso('figurinha_propria'));

-- ---------- 10) O que o app pergunta: "qual é o meu plano agora?" ----------
create or replace function public.meu_plano() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); pl jsonb; cr date; m jsonb := (select valor from app_config where chave = 'monetizacao'); o ofertas_usuario; vf text;
begin
  if uid is null then return null; end if;
  pl := _plano(uid);
  select criado into cr from alunas where id = uid;
  select * into o from ofertas_usuario where user_id = uid and expira > now() order by expira desc limit 1;
  select status into vf from verificacoes where user_id = uid order by criado desc limit 1;
  return pl || jsonb_build_object(
    'agora', now(),
    'dias_restantes', case when pl ->> 'fim' is not null then greatest(0, ceil(extract(epoch from ((pl ->> 'fim')::timestamptz - now())) / 86400)) end,
    'anuncios', not (pl ->> 'pro')::boolean and coalesce(cr, current_date) <= current_date - coalesce((m ->> 'ads_free_days')::int, 30),
    'anuncios_a_partir', coalesce(cr, current_date) + coalesce((m ->> 'ads_free_days')::int, 30) + 1,
    'oferta', case when o.id is not null then _oferta_json(o) end,
    'verificacao', coalesce(vf, 'not_requested'),
    'recursos', (select jsonb_object_agg(id, pode_recurso(id, uid)) from recursos),
    'limites', (select jsonb_object_agg(id, case when (pl ->> 'pro')::boolean then limite_pro else limite_free end) from recursos where limite_free is not null or limite_pro is not null)
  );
end $$;
grant execute on function public.meu_plano() to authenticated;

-- ---------- 11) Clube CK Pro: benefício marcado como Pro só vale para quem tem Pro ----------
create or replace function public.validar_cupom(p_cupom text, p_pin text) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_cupom jsonb; v_pin text; v_parc jsonb;
begin
  select dados into v_cupom from colecoes where nome = 'cupons' and id = p_cupom;
  if v_cupom is null or v_cupom->>'user' <> auth.uid()::text or (v_cupom->>'usado')::boolean then return false; end if;
  select dados into v_parc from colecoes where nome = 'parceiros' and id = v_cupom->>'parc';
  if coalesce((v_parc->>'pro')::boolean, false) and not pode_recurso('clube_pro') then return false; end if;
  select dados #>> '{}' into v_pin from colecoes where nome = 'pins' and id = v_cupom->>'parc';
  if v_pin is null or v_pin <> p_pin then return false; end if;
  update colecoes set dados = v_cupom || jsonb_build_object('usado', true, 'usadoEm', to_char(current_date, 'YYYY-MM-DD')), atualizado = now()
    where nome = 'cupons' and id = p_cupom;
  return true;
end $$;
grant execute on function public.validar_cupom(text, text) to authenticated;

-- CK Life · cidades de Mato Grosso com mais de 20 mil habitantes (IBGE, estimativa 2026, tabela SIDRA 6579)
-- Preserva os ids já usados pelas alunas; não apaga nenhuma cidade (inclui 'Outra cidade' e cidades de outros estados).
update public.colecoes set dados = dados || '{"uf": "MT", "ibge": "5103403", "populacao": 698917, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb where nome = 'cidades' and id = '1';
update public.colecoes set dados = dados || '{"uf": "MT", "ibge": "5108402", "populacao": 323172, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb where nome = 'cidades' and id = '2';
update public.colecoes set dados = dados || '{"uf": "MT", "ibge": "5107602", "populacao": 268202, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb where nome = 'cidades' and id = '3';
update public.colecoes set dados = dados || '{"uf": "MT", "ibge": "5107909", "populacao": 231452, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb where nome = 'cidades' and id = '4';
insert into public.colecoes (nome, id, dados) values ('cidades', '5107925', '{"id": 5107925, "nome": "Sorriso", "ativa": true, "uf": "MT", "ibge": "5107925", "populacao": 128727, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5107958', '{"id": 5107958, "nome": "Tangará da Serra", "ativa": true, "uf": "MT", "ibge": "5107958", "populacao": 116637, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5105259', '{"id": 5105259, "nome": "Lucas do Rio Verde", "ativa": true, "uf": "MT", "ibge": "5105259", "populacao": 99291, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5107040', '{"id": 5107040, "nome": "Primavera do Leste", "ativa": true, "uf": "MT", "ibge": "5107040", "populacao": 99053, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5102504', '{"id": 5102504, "nome": "Cáceres", "ativa": true, "uf": "MT", "ibge": "5102504", "populacao": 91908, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
update public.colecoes set dados = dados || '{"uf": "MT", "ibge": "5101803", "populacao": 75524, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb where nome = 'cidades' and id = '7';
insert into public.colecoes (nome, id, dados) values ('cidades', '5106224', '{"id": 5106224, "nome": "Nova Mutum", "ativa": true, "uf": "MT", "ibge": "5106224", "populacao": 65663, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5100250', '{"id": 5100250, "nome": "Alta Floresta", "ativa": true, "uf": "MT", "ibge": "5100250", "populacao": 63017, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5106752', '{"id": 5106752, "nome": "Pontes e Lacerda", "ativa": true, "uf": "MT", "ibge": "5106752", "populacao": 56720, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5102637', '{"id": 5102637, "nome": "Campo Novo do Parecis", "ativa": true, "uf": "MT", "ibge": "5102637", "populacao": 53393, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5102678', '{"id": 5102678, "nome": "Campo Verde", "ativa": true, "uf": "MT", "ibge": "5102678", "populacao": 51969, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5105150', '{"id": 5105150, "nome": "Juína", "ativa": true, "uf": "MT", "ibge": "5105150", "populacao": 48987, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5103353', '{"id": 5103353, "nome": "Confresa", "ativa": true, "uf": "MT", "ibge": "5103353", "populacao": 39368, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
update public.colecoes set dados = dados || '{"uf": "MT", "ibge": "5105101", "populacao": 36276, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb where nome = 'cidades' and id = '6';
insert into public.colecoes (nome, id, dados) values ('cidades', '5106422', '{"id": 5106422, "nome": "Peixoto de Azevedo", "ativa": true, "uf": "MT", "ibge": "5106422", "populacao": 33907, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5107875', '{"id": 5107875, "nome": "Sapezal", "ativa": true, "uf": "MT", "ibge": "5107875", "populacao": 33520, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5100201', '{"id": 5100201, "nome": "Água Boa", "ativa": true, "uf": "MT", "ibge": "5100201", "populacao": 32876, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5107065', '{"id": 5107065, "nome": "Querência", "ativa": true, "uf": "MT", "ibge": "5107065", "populacao": 32368, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5103205', '{"id": 5103205, "nome": "Colíder", "ativa": true, "uf": "MT", "ibge": "5103205", "populacao": 32099, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5106505', '{"id": 5106505, "nome": "Poconé", "ativa": true, "uf": "MT", "ibge": "5106505", "populacao": 31138, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5104104', '{"id": 5104104, "nome": "Guarantã do Norte", "ativa": true, "uf": "MT", "ibge": "5104104", "populacao": 31092, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5104807', '{"id": 5104807, "nome": "Jaciara", "ativa": true, "uf": "MT", "ibge": "5104807", "populacao": 30044, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5106307', '{"id": 5106307, "nome": "Paranatinga", "ativa": true, "uf": "MT", "ibge": "5106307", "populacao": 29528, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5101704', '{"id": 5101704, "nome": "Barra do Bugres", "ativa": true, "uf": "MT", "ibge": "5101704", "populacao": 29238, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5102702', '{"id": 5102702, "nome": "Canarana", "ativa": true, "uf": "MT", "ibge": "5102702", "populacao": 28985, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5105622', '{"id": 5105622, "nome": "Mirassol d''Oeste", "ativa": true, "uf": "MT", "ibge": "5105622", "populacao": 27763, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5101407', '{"id": 5101407, "nome": "Aripuanã", "ativa": true, "uf": "MT", "ibge": "5101407", "populacao": 27101, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5106257', '{"id": 5106257, "nome": "Nova Xavantina", "ativa": true, "uf": "MT", "ibge": "5106257", "populacao": 26340, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5103254', '{"id": 5103254, "nome": "Colniza", "ativa": true, "uf": "MT", "ibge": "5103254", "populacao": 25963, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5107008', '{"id": 5107008, "nome": "Poxoréu", "ativa": true, "uf": "MT", "ibge": "5107008", "populacao": 25614, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5103502', '{"id": 5103502, "nome": "Diamantino", "ativa": true, "uf": "MT", "ibge": "5103502", "populacao": 22766, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
insert into public.colecoes (nome, id, dados) values ('cidades', '5105606', '{"id": 5105606, "nome": "Matupá", "ativa": true, "uf": "MT", "ibge": "5105606", "populacao": 22497, "ano_estimativa": 2026, "fonte": "IBGE · Estimativas da População (SIDRA 6579)", "status": "ativa"}'::jsonb) on conflict (nome, id) do nothing;
select 'Cidades de MT prontas: ' || count(*) from public.colecoes where nome = 'cidades';

select 'Monetização pronta' as status;
