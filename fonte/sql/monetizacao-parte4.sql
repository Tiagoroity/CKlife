-- CK Life · Monetização · PARTE 4 de 6 (rode na ordem)
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

