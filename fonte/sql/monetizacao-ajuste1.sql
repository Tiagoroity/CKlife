-- =====================================================================
-- CK Life · Monetização · AJUSTE 1
-- 1) Quem já assina não vê mais oferta.  2) Valor da venda da Kiwify registrado (e preenche vendas antigas).
-- 3) Lista de vendas para o painel.  Só ajusta funções; não apaga dados.
-- =====================================================================
create or replace function public.meu_plano() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); pl jsonb; cr date; m jsonb := (select valor from app_config where chave = 'monetizacao'); o ofertas_usuario; vf text; pago boolean;
begin
  if uid is null then return null; end if;
  pl := _plano(uid);
  pago := (pl ->> 'pro')::boolean and not coalesce((pl ->> 'trial')::boolean, false);
  select criado into cr from alunas where id = uid;
  if not pago then select * into o from ofertas_usuario where user_id = uid and expira > now() order by expira desc limit 1; end if;
  select status into vf from verificacoes where user_id = uid order by criado desc limit 1;
  return pl || jsonb_build_object(
    'agora', now(),
    'pago', pago,
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

-- valor em reais a partir de "1999" (centavos) ou "19.99"
create or replace function public._valor_kiwify(v text) returns numeric
language plpgsql immutable as $$
begin
  if v is null or trim(v) = '' then return null; end if;
  if v ~ '[.,]' then return replace(v, ',', '.')::numeric; end if;
  return v::numeric / 100;
exception when others then return null;
end $$;

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
  -- valor cobrado: cobrança da assinatura, comissões ou preço base (antes de tirar dados pessoais do registro)
  v_valor := coalesce(_valor_kiwify(p -> 'Subscription' -> 'charges' -> 'completed' -> -1 ->> 'amount'), _valor_kiwify(p -> 'Commissions' ->> 'charge_amount'), _valor_kiwify(p -> 'Commissions' ->> 'product_base_price'));
  insert into webhook_eventos (provider, evento, order_id, external_id, email, payload)
    values ('kiwify', ev, oid, sid, em, p - 'Customer' - 'customer' - 'TrackingParameters' - 'Commissions')
    on conflict (provider, order_id, evento) do nothing returning id into we_id;
  if we_id is null then return jsonb_build_object('ok', true, 'duplicado', true); end if;
  if ev in ('billet_created','pix_created','order_rejected') then
    update webhook_eventos set status = 'ignorado', processado = now() where id = we_id; return jsonb_build_object('ok', true, 'ignorado', ev);
  end if;
  select id into pl from planos where product_id is not null and product_id = prod;
  if pl is null then select id, case when product_anual = prod then 'pro_anual' else 'pro_mensal' end into camp, pl from campanhas_oferta where prod is not null and prod in (product_mensal, product_anual) limit 1; end if;
  if pl is null then pl := case when freq in ('annually','yearly','annual') then 'pro_anual' when v_valor >= 100 then 'pro_anual' else 'pro_mensal' end; end if;
  if v_valor is null and ev in ('order_approved','subscription_renewed') then v_valor := (select preco from planos where id = pl); end if;
  if em is not null then select id into uid from alunas where lower(email) = em limit 1; end if;
  novo_status := case ev when 'order_approved' then 'active' when 'subscription_renewed' then 'active' when 'subscription_late' then case when tem_acesso then 'grace_period' else 'past_due' end
    when 'subscription_canceled' then case when tem_acesso and ate > now() then 'canceled' else 'expired' end when 'order_refunded' then 'refunded' when 'chargeback' then 'chargeback' end;
  update webhook_eventos set valor = v_valor where id = we_id;
  if novo_status is null then update webhook_eventos set status = 'ignorado', processado = now() where id = we_id; return jsonb_build_object('ok', true, 'ignorado', ev); end if;
  if ate is null then ate := case when novo_status = 'active' then now() + case when pl = 'pro_anual' then interval '366 days' else interval '32 days' end else now() end; end if;
  if novo_status in ('refunded','chargeback') then ate := now(); end if;
  if sid is not null and exists (select 1 from assinaturas where provider = 'kiwify' and external_id = sid) then
    update assinaturas set status = novo_status, fim = ate, renova_em = case when novo_status = 'active' then ate else renova_em end, plano = coalesce(pl, plano),
      preco = coalesce(v_valor, preco), user_id = coalesce(user_id, uid), email = coalesce(email, em), atualizado = now() where provider = 'kiwify' and external_id = sid;
  elsif novo_status = 'active' then
    insert into assinaturas (user_id, email, plano, provider, status, inicio, fim, renova_em, campanha, external_id, preco)
      values (uid, em, pl, 'kiwify', 'active', now(), ate, ate, camp, coalesce(sid, oid), v_valor);
  else
    update assinaturas set status = novo_status, fim = least(coalesce(fim, ate), ate), atualizado = now()
      where provider = 'kiwify' and (external_id = oid or (user_id = uid and uid is not null and status in ('active','past_due','grace_period')));
  end if;
  if uid is not null then
    update ofertas_usuario set convertida = true where user_id = uid and novo_status = 'active' and expira > now() - interval '3 days';
    if novo_status = 'active' then update ofertas_usuario set expira = least(expira, now()) where user_id = uid and expira > now(); end if;   -- assinou: oferta acaba
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

-- vendas antigas sem valor: usa o preço do plano da assinatura
update public.webhook_eventos w set valor = (select p.preco from assinaturas a join planos p on p.id = a.plano where a.provider = 'kiwify' and a.external_id in (w.external_id, w.order_id) limit 1)
  where w.valor is null and w.evento in ('order_approved','subscription_renewed') and w.status = 'processado';
update public.assinaturas a set preco = (select preco from planos where id = a.plano) where a.provider = 'kiwify' and a.preco is null;
-- quem já assinou não fica com oferta aberta
update public.ofertas_usuario o set expira = now() where expira > now() and exists (select 1 from assinaturas a where a.user_id = o.user_id and a.provider in ('kiwify','apple','google') and a.status = 'active' and a.fim > now());

-- vendas para o painel (sem dados de cartão; nome e e-mail só para quem tem acesso à monetização)
create or replace function public.admin_vendas(p_limite int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('monetizacao') then return null; end if;
  return (select coalesce(jsonb_agg(x order by x ->> 'quando' desc), '[]') from (
    select jsonb_build_object('quando', w.criado, 'evento', w.evento, 'pedido', w.order_id, 'valor', w.valor, 'status', w.status, 'erro', w.erro,
      'email', w.email, 'nome', (select nome from alunas where lower(email) = w.email limit 1), 'plano', (select plano from assinaturas a where a.provider = 'kiwify' and a.external_id in (w.external_id, w.order_id) limit 1)) x
    from webhook_eventos w where w.provider = 'kiwify' order by w.criado desc limit greatest(1, least(p_limite, 500))) t);
end $$;
grant execute on function public.admin_vendas(int) to authenticated;
-- lista de quem tem Pro agora (para a lista de alunas do painel)
create or replace function public.admin_planos_usuarias() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('alunos') and not admin_ve('monetizacao') then return null; end if;
  return (select coalesce(jsonb_object_agg(id, jsonb_build_object('pro', (pl ->> 'pro')::boolean, 'trial', coalesce((pl ->> 'trial')::boolean, false), 'provider', pl ->> 'provider', 'plano', pl ->> 'plano', 'fim', pl ->> 'fim', 'status', pl ->> 'status')), '{}')
    from (select id, _plano(id) pl from alunas) t);
end $$;
grant execute on function public.admin_planos_usuarias() to authenticated;
select 'Ajuste de monetização pronto' as status;
