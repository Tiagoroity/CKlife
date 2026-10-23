-- CK Life · Monetização · PARTE 3 de 6 (rode na ordem)
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

