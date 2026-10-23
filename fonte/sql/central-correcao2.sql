-- CK Life · Central de Notificações · CORREÇÃO 2 (link opcional + envio). Já inclui a correção 1.
-- link opcional da notificação (produto/compra ou área do app), também na lista dentro do app
alter table public.notificacoes add column if not exists link text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notificacoes_link_ok') then
    alter table public.notificacoes add constraint notificacoes_link_ok check (link is null or link ~ '^(/|https://)');
  end if;
end $$;

-- disparo (interno): lista do app + envio para o celular em lotes de 300
create or replace function public._notif_disparar(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c notif_campanhas; lote uuid[]; tk text; fid uuid; n_alvo int; n_insc int; pl jsonb; ok_net boolean := true;
begin
  select * into c from notif_campanhas where id = p_id and status = 'agendada' for update skip locked;
  if c.id is null then return jsonb_build_object('ok', false, 'erro', 'não está agendada'); end if;
  perform set_config('ck.sistema', '1', true);
  update notif_campanhas set status = 'enviando' where id = c.id;
  create temp table if not exists _alvo_tmp (uid uuid primary key) on commit drop;
  delete from _alvo_tmp where true;   -- o Supabase exige WHERE em todo DELETE
  insert into _alvo_tmp select distinct uid from _notif_alvos(c.publico);
  select count(*) into n_alvo from _alvo_tmp;
  -- aparece também na lista de notificações dentro do app
  insert into notificacoes (user_id, tipo, ref, texto, link) select uid, 'sistema', 'camp:' || c.id, left(c.titulo || ' · ' || c.mensagem, 200), c.link from _alvo_tmp on conflict do nothing;
  select count(distinct t.uid) into n_insc from _alvo_tmp t where exists (select 1 from push_inscricoes s where s.user_id = t.uid);
  pl := jsonb_build_object('title', c.titulo, 'body', c.mensagem, 'tag', 'camp:' || c.id, 'url', coalesce(c.link, '/?n=sistema'), 'image', c.imagem, 'cid', c.id, 'rk', c.rk);
  for lote in select array_agg(uid) from (select t.uid, (row_number() over () - 1) / 300 grp from _alvo_tmp t where exists (select 1 from push_inscricoes s where s.user_id = t.uid)) z group by grp loop
    tk := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    insert into push_fila (token, user_id, usuarios, campanha, payload) values (tk, null, lote, c.id, pl) returning id into fid;
    begin
      perform net.http_post(url := 'https://cklife.vercel.app/api/push', body := jsonb_build_object('id', fid, 'token', tk), headers := '{"Content-Type":"application/json"}'::jsonb);
    exception when others then ok_net := false;
    end;
  end loop;
  update notif_campanhas set status = case when ok_net then 'enviada' else 'erro' end, alvo = n_alvo, inscritos = n_insc, enviado_em = now(),
    erro = case when not ok_net then 'Envio para o celular indisponível (extensão pg_net). O aviso ficou na lista do app.' when n_insc = 0 then 'Nenhuma pessoa deste público ativou avisos no celular; ficou só na lista do app.' end
    where id = c.id;
  perform set_config('ck.sistema', '0', true);
  return jsonb_build_object('ok', true, 'alvo', n_alvo, 'inscritas', n_insc);
end $$;
revoke all on function public._notif_disparar(uuid) from public, anon, authenticated;

select 'Correção 2 pronta' as status;
