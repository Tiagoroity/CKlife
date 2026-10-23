-- CK Life · Central de Notificações · PARTE 2 de 2 (rode a parte 1 primeiro)
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
