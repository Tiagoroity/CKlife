-- CK Life · Monetização · PARTE 1 de 6 (rode na ordem)
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

