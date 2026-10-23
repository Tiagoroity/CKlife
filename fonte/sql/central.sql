-- =====================================================================
-- CK Life · Central de Notificações, Lembretes, Anúncios com mídia e Dashboard
-- Pode rodar de novo sem perder dados. Não apaga nada que já existe.
-- =====================================================================

-- ---------- 1) Fila de envio: aceita um lote de usuárias (campanhas) ----------
alter table public.push_fila add column if not exists usuarios uuid[];
alter table public.push_fila add column if not exists campanha uuid;
alter table public.push_fila add column if not exists lembrete_envio bigint;
alter table public.push_fila add column if not exists resultado timestamptz;
alter table public.push_fila alter column user_id drop not null;

create or replace function public.push_pegar(p_id uuid, p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare f push_fila;
begin
  update push_fila set usado = now() where id = p_id and token = p_token and usado is null and criado > now() - interval '10 minutes' returning * into f;
  if f.id is null then return null; end if;
  return json_build_object('payload', f.payload, 'subs', (select coalesce(json_agg(json_build_object('endpoint', endpoint, 'keys', json_build_object('p256dh', p256dh, 'auth', auth))), '[]'::json)
    from push_inscricoes where user_id = f.user_id or (f.usuarios is not null and user_id = any(f.usuarios))));
end $$;
grant execute on function public.push_pegar(uuid, text) to anon, authenticated;

create or replace function public.push_expirou(p_id uuid, p_token text, p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
declare f push_fila;
begin
  select * into f from push_fila where id = p_id and token = p_token and usado > now() - interval '10 minutes';
  if f.id is not null then
    delete from push_inscricoes where endpoint = p_endpoint and (user_id = f.user_id or (f.usuarios is not null and user_id = any(f.usuarios)));
  end if;
end $$;
grant execute on function public.push_expirou(uuid, text, text) to anon, authenticated;

-- envia um aviso para UMA pessoa (reaproveitado pelos lembretes)
create or replace function public._push_um(p_uid uuid, p_payload jsonb, p_envio bigint default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare tk text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''); fid uuid;
begin
  insert into push_fila (token, user_id, payload, lembrete_envio) values (tk, p_uid, p_payload, p_envio) returning id into fid;
  perform net.http_post(url := 'https://cklife.vercel.app/api/push', body := jsonb_build_object('id', fid, 'token', tk), headers := '{"Content-Type":"application/json"}'::jsonb);
  return fid;
end $$;
revoke all on function public._push_um(uuid, jsonb, bigint) from public, anon, authenticated;

-- avisos da Central e lembretes não passam pelo envio individual (eles têm envio próprio, em lote)
create or replace function public.push_enfileira() returns trigger
language plpgsql security definer set search_path = public as $$
declare tk text; fid uuid; titulo text;
begin
  if new.lida then return new; end if;
  if new.tipo = 'sistema' and (new.ref like 'camp:%' or new.ref like 'lembrete:%') then return new; end if;
  if tg_op = 'UPDATE' and new.criado = old.criado then return new; end if;
  if not exists (select 1 from push_inscricoes where user_id = new.user_id) then return new; end if;
  delete from push_fila where criado < now() - interval '1 day';
  titulo := case new.tipo when 'mensagem' then 'Nova mensagem' when 'story_resposta' then 'Resposta ao seu Story' when 'curtida' then 'Nova curtida'
    when 'comentario' then 'Novo comentário' when 'seguiu' then 'Nova seguidora' when 'solicitou' then 'Pedido para seguir' when 'aceitou' then 'Pedido aceito'
    when 'conquista' then 'Nova conquista' else 'CK Life' end;
  tk := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into push_fila (token, user_id, payload) values (tk, new.user_id,
    jsonb_build_object('title', titulo, 'body', coalesce(new.texto, 'Você tem uma novidade no CK Life.'), 'tag', new.tipo || ':' || new.ref, 'url', '/?n=' || new.tipo))
    returning id into fid;
  begin
    perform net.http_post(url := 'https://cklife.vercel.app/api/push', body := jsonb_build_object('id', fid, 'token', tk), headers := '{"Content-Type":"application/json"}'::jsonb);
  exception when others then null;
  end;
  return new;
end $$;

-- ---------- 2) Central de Notificações (painel) ----------
create table if not exists public.notif_campanhas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 65),
  mensagem text not null check (char_length(mensagem) between 1 and 240),
  imagem text check (imagem is null or imagem ~ '^https://'),
  link text check (link is null or link ~ '^(/|https://)'),
  publico jsonb not null default '{"tipo":"todas"}'::jsonb,
  enviar_em timestamptz,
  status text not null default 'rascunho' check (status in ('rascunho','agendada','enviando','enviada','cancelada','erro')),
  alvo int,
  inscritos int,
  enviados int not null default 0,
  falhas int not null default 0,
  recebidos int not null default 0,
  cliques int not null default 0,
  erro text,
  rk text not null default replace(gen_random_uuid()::text, '-', ''),
  criado_por uuid default auth.uid(),
  criado timestamptz not null default now(),
  enviado_em timestamptz,
  atualizado timestamptz not null default now()
);
create index if not exists notif_camp_status_idx on public.notif_campanhas (status, enviar_em);
alter table public.notif_campanhas enable row level security;
drop policy if exists nc_ler on public.notif_campanhas;
create policy nc_ler on public.notif_campanhas for select to authenticated using (admin_ve('notificacoes'));
drop policy if exists nc_criar on public.notif_campanhas;
create policy nc_criar on public.notif_campanhas for insert to authenticated with check (admin_pode('notificacoes') and status in ('rascunho','agendada'));
drop policy if exists nc_mudar on public.notif_campanhas;
create policy nc_mudar on public.notif_campanhas for update to authenticated using (admin_pode('notificacoes')) with check (admin_pode('notificacoes'));
drop policy if exists nc_apagar on public.notif_campanhas;
create policy nc_apagar on public.notif_campanhas for delete to authenticated using (admin_pode('notificacoes') and status in ('rascunho','cancelada'));

-- quem é do painel só edita rascunho/agendada; números e envio só o sistema mexe
create or replace function public.protege_notif() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('ck.sistema', true), '0') = '1' then new.atualizado := now(); return new; end if;
  if tg_op = 'INSERT' then
    new.enviados := 0; new.falhas := 0; new.recebidos := 0; new.cliques := 0; new.alvo := null; new.inscritos := null; new.erro := null; new.enviado_em := null;
    new.criado_por := auth.uid(); new.rk := replace(gen_random_uuid()::text, '-', '');
    if new.status = 'agendada' and new.enviar_em is null then raise exception 'informe a data de envio'; end if;
    perform auditar('notificacao_criada', 'notif_campanhas', new.id::text, 'ok', new.titulo);
    return new;
  end if;
  if old.status not in ('rascunho','agendada') then raise exception 'notificação já enviada não pode ser alterada'; end if;
  if new.status not in ('rascunho','agendada','cancelada') then raise exception 'status inválido'; end if;
  if new.status = 'agendada' and new.enviar_em is null then raise exception 'informe a data de envio'; end if;
  new.enviados := old.enviados; new.falhas := old.falhas; new.recebidos := old.recebidos; new.cliques := old.cliques; new.alvo := old.alvo; new.inscritos := old.inscritos;
  new.rk := old.rk; new.criado_por := old.criado_por; new.criado := old.criado; new.enviado_em := old.enviado_em; new.atualizado := now();
  perform auditar(case when new.status = 'cancelada' then 'notificacao_cancelada' else 'notificacao_editada' end, 'notif_campanhas', new.id::text, 'ok', new.titulo);
  return new;
end $$;
drop trigger if exists protege_notif on public.notif_campanhas;
create trigger protege_notif before insert or update on public.notif_campanhas for each row execute function public.protege_notif();

-- público (segmentação). Sempre só contas ativas.
create or replace function public._notif_alvos(p jsonb) returns table (uid uuid)
language plpgsql stable security definer set search_path = public as $$
declare t text := coalesce(p ->> 'tipo', 'todas'); n int := greatest(1, least(coalesce((p ->> 'dias')::int, 7), 365));
begin
  return query select a.id from alunas a
  where coalesce(a.situacao, 'ativa') = 'ativa' and not a.bloqueado
    and case t
      when 'todas' then true
      when 'pro' then coalesce((_plano(a.id) ->> 'pro')::boolean, false) and not coalesce((_plano(a.id) ->> 'trial')::boolean, false)
      when 'trial' then coalesce((_plano(a.id) ->> 'trial')::boolean, false)
      when 'free' then not coalesce((_plano(a.id) ->> 'pro')::boolean, false)
      when 'especificas' then lower(a.email) in (select lower(trim(x)) from jsonb_array_elements_text(coalesce(p -> 'emails', '[]'::jsonb)) x)
      when 'grupo' then exists (select 1 from membros_grupo m where m.user_id = a.id and m.grupo_id::text = p ->> 'grupo')
      when 'ativas' then exists (select 1 from acessos x where x.user_id = a.id and x.dia >= current_date - n)
      when 'inativas' then not exists (select 1 from acessos x where x.user_id = a.id and x.dia >= current_date - n)
      when 'sem_treino' then coalesce((select max(tr ->> 'd') from jsonb_array_elements(case when jsonb_typeof(a.dados -> 'treinos') = 'array' then a.dados -> 'treinos' else '[]'::jsonb end) tr), '0000-00-00') < to_char(current_date - n, 'YYYY-MM-DD')
      when 'cidade' then a.cidade::text = p ->> 'cidade'
      when 'novas' then a.criado >= current_date - n
      else false end;
end $$;
revoke all on function public._notif_alvos(jsonb) from public, anon, authenticated;

create or replace function public.admin_notif_previa(p jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('notificacoes') then return null; end if;
  return (select jsonb_build_object('alvo', count(*), 'inscritas', count(*) filter (where exists (select 1 from push_inscricoes s where s.user_id = t.uid))) from _notif_alvos(p) t);
end $$;
grant execute on function public.admin_notif_previa(jsonb) to authenticated;

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

create or replace function public.admin_notif_enviar_agora(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not admin_pode('notificacoes') then raise exception 'sem permissão'; end if;
  if not exists (select 1 from notif_campanhas where id = p_id and status in ('rascunho','agendada')) then raise exception 'esta notificação não pode mais ser enviada'; end if;
  perform set_config('ck.sistema', '1', true);
  update notif_campanhas set status = 'agendada', enviar_em = now() where id = p_id;
  perform set_config('ck.sistema', '0', true);
  r := _notif_disparar(p_id);
  perform auditar('notificacao_enviada', 'notif_campanhas', p_id::text, 'ok', r::text);
  return r;
end $$;
grant execute on function public.admin_notif_enviar_agora(uuid) to authenticated;

-- o servidor de envio informa quantos foram aceitos pelo serviço de push (por lote)
create or replace function public.push_resultado(p_id uuid, p_token text, p_enviados int, p_falhas int) returns void
language plpgsql security definer set search_path = public as $$
declare f push_fila;
begin
  update push_fila set resultado = now() where id = p_id and token = p_token and usado > now() - interval '15 minutes' and resultado is null returning * into f;   -- uma vez só
  if f.id is null then return; end if;
  perform set_config('ck.sistema', '1', true);
  if f.campanha is not null then
    update notif_campanhas set enviados = enviados + greatest(0, least(p_enviados, 100000)), falhas = falhas + greatest(0, least(p_falhas, 100000)) where id = f.campanha;
  end if;
  if f.lembrete_envio is not null then
    update lembretes_envios set status = case when p_enviados > 0 then 'enviado' else 'falhou' end where id = f.lembrete_envio;
  end if;
  perform set_config('ck.sistema', '0', true);
end $$;
grant execute on function public.push_resultado(uuid, text, int, int) to anon, authenticated;

-- o celular confirma que recebeu / que tocou (só para avisos da Central; nunca passa de "enviados")
create or replace function public.push_confirma(p_cid uuid, p_rk text, p_tipo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('ck.sistema', '1', true);
  if p_tipo = 'recebido' then update notif_campanhas set recebidos = least(recebidos + 1, enviados) where id = p_cid and rk = p_rk and status in ('enviando','enviada');
  elsif p_tipo = 'clique' then update notif_campanhas set cliques = least(cliques + 1, enviados) where id = p_cid and rk = p_rk and status in ('enviando','enviada'); end if;
  perform set_config('ck.sistema', '0', true);
end $$;
grant execute on function public.push_confirma(uuid, text, text) to anon, authenticated;

-- ---------- 3) Lembretes (treino agora; água, refeição e outros depois) ----------
create table if not exists public.lembretes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('treino','agua','refeicao')),
  hora time not null,
  dias text[] not null check (cardinality(dias) between 1 and 7 and dias <@ array['MO','TU','WE','TH','FR','SA','SU']),
  antecedencia int not null default 20 check (antecedencia between 0 and 120),
  fuso text not null default 'America/Cuiaba',
  ativo boolean not null default true,
  pausado_ate date,
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now(),
  unique (user_id, tipo)
);
alter table public.lembretes enable row level security;
drop policy if exists lb_ler on public.lembretes;
create policy lb_ler on public.lembretes for select to authenticated using (user_id = auth.uid());
drop policy if exists lb_criar on public.lembretes;
create policy lb_criar on public.lembretes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists lb_mudar on public.lembretes;
create policy lb_mudar on public.lembretes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists lb_apagar on public.lembretes;
create policy lb_apagar on public.lembretes for delete to authenticated using (user_id = auth.uid());
-- fuso inválido vira o padrão de MT
create or replace function public.confere_lembrete() returns trigger
language plpgsql as $$
begin
  begin perform now() at time zone new.fuso; exception when others then new.fuso := 'America/Cuiaba'; end;
  new.atualizado := now(); return new;
end $$;
drop trigger if exists confere_lembrete on public.lembretes;
create trigger confere_lembrete before insert or update on public.lembretes for each row execute function public.confere_lembrete();

-- registro de cada lembrete enviado (um por dia, nunca duplica)
create table if not exists public.lembretes_envios (
  id bigserial primary key,
  lembrete_id uuid not null references public.lembretes(id) on delete cascade,
  user_id uuid not null,
  dia date not null,
  para timestamptz,
  status text not null default 'enfileirado' check (status in ('enfileirado','enviado','falhou')),
  criado timestamptz not null default now(),
  unique (lembrete_id, dia)
);
alter table public.lembretes_envios enable row level security;
drop policy if exists le_ler on public.lembretes_envios;
create policy le_ler on public.lembretes_envios for select to authenticated using (user_id = auth.uid() or admin_ve('notificacoes'));

create or replace function public._lembretes_tick() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; tit text; corpo text;
begin
  for r in
    with c as (
      select l.*, (now() at time zone l.fuso) loc from lembretes l
      where l.ativo and exists (select 1 from push_inscricoes s where s.user_id = l.user_id)
    ), d as (
      select c.*, dd::date dia, (dd::date + c.hora) - make_interval(mins => c.antecedencia) alvo
      from c, generate_series(c.loc::date, c.loc::date + 1, interval '1 day') dd
    ), novos as (
      insert into lembretes_envios (lembrete_id, user_id, dia, para)
      select d.id, d.user_id, d.dia, (d.dia + d.hora) at time zone d.fuso from d
      where d.loc >= d.alvo and d.loc < d.alvo + interval '10 minutes'
        and (array['SU','MO','TU','WE','TH','FR','SA'])[extract(dow from d.dia)::int + 1] = any(d.dias)
        and (d.pausado_ate is null or d.pausado_ate < d.dia)
      on conflict (lembrete_id, dia) do nothing
      returning lembretes_envios.id eid, lembretes_envios.user_id uid, lembretes_envios.lembrete_id lid
    )
    select novos.*, l.tipo, l.antecedencia from novos join lembretes l on l.id = novos.lid
  loop
    tit := case r.tipo when 'treino' then case when r.antecedencia > 0 then 'Seu treino começa em ' || r.antecedencia || ' minutos 💚' else 'Hora do seu treino 💚' end
      when 'agua' then 'Hora de beber água 💧' else 'Hora da sua refeição 🥗' end;
    corpo := case r.tipo when 'treino' then 'Separe sua água e uma roupa confortável. Seu treino de hoje está pronto no CK Life.'
      when 'agua' then 'Um copo agora já ajuda. Marque no CK Life.' else 'Seu cardápio de hoje está no CK Life.' end;
    begin
      perform _push_um(r.uid, jsonb_build_object('title', tit, 'body', corpo, 'tag', 'lembrete:' || r.tipo, 'url', '/?n=' || r.tipo), r.eid);
    exception when others then update lembretes_envios set status = 'falhou' where id = r.eid;
    end;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public._lembretes_tick() from public, anon, authenticated;

-- ---------- 4) Relógio: a cada minuto envia agendadas e lembretes ----------
create or replace function public.push_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare cid uuid; n int := 0; l int := 0;
begin
  for cid in select id from notif_campanhas where status = 'agendada' and enviar_em <= now() order by enviar_em limit 5 loop
    perform _notif_disparar(cid); n := n + 1;
  end loop;
  l := _lembretes_tick();
  delete from push_fila where criado < now() - interval '1 day';
  return jsonb_build_object('campanhas', n, 'lembretes', l);
end $$;
revoke all on function public.push_tick() from public, anon, authenticated;

do $$ begin
  begin create extension if not exists pg_cron; exception when others then raise notice 'pg_cron indisponível'; end;
  begin perform cron.unschedule('ck-push-tick'); exception when others then null; end;
  begin perform cron.schedule('ck-push-tick', '* * * * *', 'select public.push_tick()'); exception when others then raise notice 'Agendador não ativado: ative o Cron em Integrations e rode este arquivo de novo'; end;
end $$;

-- ---------- 5) Anúncios com imagem/vídeo (pasta pública só para leitura; só o painel envia) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anuncios', 'anuncios', true, 26214400, array['image/jpeg','image/webp','image/png','video/mp4','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 26214400, allowed_mime_types = array['image/jpeg','image/webp','image/png','video/mp4','video/webm'];
drop policy if exists anuncios_ler on storage.objects;
create policy anuncios_ler on storage.objects for select using (bucket_id = 'anuncios');
drop policy if exists anuncios_enviar on storage.objects;
create policy anuncios_enviar on storage.objects for insert to authenticated with check (bucket_id = 'anuncios' and admin_pode('campanhas') and (storage.foldername(name))[1] in ('img','video','capa','notif'));
drop policy if exists anuncios_mudar on storage.objects;
create policy anuncios_mudar on storage.objects for update to authenticated using (bucket_id = 'anuncios' and admin_pode('campanhas'));
drop policy if exists anuncios_apagar on storage.objects;
create policy anuncios_apagar on storage.objects for delete to authenticated using (bucket_id = 'anuncios' and admin_pode('campanhas'));
-- imagem da notificação: quem cuida das notificações também envia (pasta "notif")
drop policy if exists anuncios_notif on storage.objects;
create policy anuncios_notif on storage.objects for insert to authenticated with check (bucket_id = 'anuncios' and admin_pode('notificacoes') and (storage.foldername(name))[1] = 'notif');

-- mudanças em anúncios e anunciantes ficam na auditoria
create or replace function public.audita_colecoes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.nome, old.nome) in ('campanhas','anunciantes') then
    perform auditar(lower(tg_op) || '_' || coalesce(new.nome, old.nome), 'colecoes', coalesce(new.id, old.id), 'ok', left(coalesce(new.dados ->> 'titulo', new.dados ->> 'nome', old.dados ->> 'titulo', old.dados ->> 'nome', ''), 120));
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists audita_colecoes on public.colecoes;
create trigger audita_colecoes after insert or update or delete on public.colecoes for each row execute function public.audita_colecoes();

-- ---------- 6) Dashboard do painel (números reais; sem dado inventado) ----------
create or replace function public.admin_painel_resumo() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('resumo') then return null; end if;
  return jsonb_build_object(
    'posts_7d', (select count(*) from posts where criado > now() - interval '7 days'),
    'comentarios_7d', (select count(*) from comentarios where criado > now() - interval '7 days'),
    'curtidas_7d', (select count(*) from curtidas where criado > now() - interval '7 days'),
    'denuncias_abertas', (select count(*) from denuncias where status = 'aberta'),
    'verificacoes_pendentes', (select count(*) from verificacoes where status = 'pending' and selfie is not null),
    'webhooks_erro_7d', (select count(*) from webhook_eventos where status = 'erro' and criado > now() - interval '7 days'),
    'notif_30d', (select count(*) from notif_campanhas where status in ('enviada','enviando') and enviado_em > now() - interval '30 days'),
    'notif_enviados_30d', (select coalesce(sum(enviados), 0) from notif_campanhas where enviado_em > now() - interval '30 days'),
    'notif_agendadas', (select count(*) from notif_campanhas where status = 'agendada'),
    'push_inscritas', (select count(distinct user_id) from push_inscricoes),
    'lembretes_ativos', (select count(*) from lembretes where ativo),
    'cron', (select exists (select 1 from pg_extension where extname = 'pg_cron')),
    'recentes', (select coalesce(jsonb_agg(x order by x ->> 'quando' desc), '[]') from (
        (select jsonb_build_object('tipo', 'venda', 'quando', criado, 'texto', 'Venda Pro' || coalesce(' · R$ ' || replace(valor::text, '.', ','), ''), 'ref', order_id) x from webhook_eventos where evento = 'order_approved' and status = 'processado' order by criado desc limit 5)
        union all (select jsonb_build_object('tipo', 'denuncia', 'quando', criado, 'texto', 'Nova denúncia (' || motivo || ')', 'ref', id) from denuncias where status = 'aberta' order by criado desc limit 5)
        union all (select jsonb_build_object('tipo', 'notificacao', 'quando', enviado_em, 'texto', 'Notificação enviada: ' || titulo, 'ref', id) from notif_campanhas where enviado_em is not null order by enviado_em desc limit 5)
        union all (select jsonb_build_object('tipo', 'cadastro', 'quando', criado::timestamptz, 'texto', 'Nova aluna: ' || coalesce(split_part(nome, ' ', 1), 'sem nome'), 'ref', id) from alunas order by criado desc limit 5)
      ) t)
  );
end $$;
grant execute on function public.admin_painel_resumo() to authenticated;

select 'Central de notificações pronta' as status,
  (select exists (select 1 from pg_extension where extname = 'pg_cron')) as agendador_ativo,
  (select exists (select 1 from pg_extension where extname = 'pg_net')) as envio_ativo;
