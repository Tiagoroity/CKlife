-- =====================================================================
-- CK Life · CK 21 DIAS JUNTAS · parte 2
-- Hora do lembrete escolhida por cada participante, "Traga uma amiga", lista "quem sumiu" para a equipe
-- e dados públicos da edição (para a página cklife.com.br/21dias). Só ACRESCENTA; não apaga dados.
-- Rode depois do desafio21.sql. Pode rodar de novo.
-- =====================================================================
alter table public.d21_inscricoes add column if not exists hora smallint check (hora is null or hora between 5 and 22);

-- entrar agora aceita a hora do lembrete (troca a versão antiga da função; nenhum dado é apagado)
drop function if exists public.d21_entrar(uuid, text);
create or replace function public.d21_entrar(p_edicao uuid, p_modo text default 'normal', p_hora int default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); e d21_edicoes;
begin
  if me is null then raise exception 'entre na sua conta'; end if;
  select * into e from d21_edicoes where id = p_edicao;
  if e.id is null or _d21_fase(e) not in ('inscricoes','aguardando','andamento') then raise exception 'esta edição não está aberta'; end if;
  if p_modo not in ('normal','hard','supreme') then p_modo := 'normal'; end if;
  if p_hora is not null and (p_hora < 5 or p_hora > 22) then p_hora := null; end if;
  insert into d21_inscricoes (edicao_id, user_id, modo, hora) values (e.id, me, p_modo, p_hora)
    on conflict (edicao_id, user_id) do update set saiu_em = null, hora = coalesce(excluded.hora, d21_inscricoes.hora);
  return jsonb_build_object('ok', true, 'dia', _d21_dia(e));
end $$;
grant execute on function public.d21_entrar(uuid, text, int) to authenticated;

create or replace function public.d21_hora(p_edicao uuid, p_hora int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_hora is not null and (p_hora < 5 or p_hora > 22) then raise exception 'hora inválida'; end if;
  update d21_inscricoes set hora = p_hora where edicao_id = p_edicao and user_id = auth.uid() and saiu_em is null;
  return found;
end $$;
grant execute on function public.d21_hora(uuid, int) to authenticated;

create or replace function public.d21_estado() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); e d21_edicoes; i d21_inscricoes; r jsonb;
begin
  if me is null then return jsonb_build_object('hoje', d21_hoje()); end if;
  -- 1º: a edição em que ela está e que ainda não terminou (ou terminou há até 14 dias)
  select ed.* into e from d21_edicoes ed join d21_inscricoes x on x.edicao_id = ed.id and x.user_id = me and x.saiu_em is null
    where ed.status not in ('rascunho','arquivada') and ed.fim >= d21_hoje() - 14 order by ed.inicio desc limit 1;
  -- 2º: a edição aberta para inscrição / em andamento
  if e.id is null then
    select * into e from d21_edicoes where status in ('inscricoes','aguardando','andamento') and fim >= d21_hoje() order by inicio limit 1;
  end if;
  r := jsonb_build_object('hoje', d21_hoje(), 'agora', now(),
    'historico', coalesce((select jsonb_agg(jsonb_build_object('id', ed.id, 'nome', ed.nome, 'numero', ed.numero, 'inicio', ed.inicio, 'fim', ed.fim,
        'feitos', (select count(*) from d21_registros g where g.edicao_id = ed.id and g.user_id = me),
        'planob', (select count(*) from d21_registros g where g.edicao_id = ed.id and g.user_id = me and g.tipo = 'planob')) order by ed.inicio desc)
      from d21_edicoes ed join d21_inscricoes x on x.edicao_id = ed.id and x.user_id = me where ed.status <> 'rascunho'), '[]'::jsonb));
  if e.id is null then return r; end if;
  select * into i from d21_inscricoes where edicao_id = e.id and user_id = me;
  return r || jsonb_build_object(
    'edicao', jsonb_build_object('id', e.id, 'numero', e.numero, 'nome', e.nome, 'frase', e.frase, 'descricao', e.descricao, 'capa', e.capa,
      'inicio', e.inicio, 'fim', e.fim, 'fase', _d21_fase(e), 'dia', _d21_dia(e), 'whatsapp', case when i.user_id is not null and i.saiu_em is null then e.whatsapp end,
      'publicado_em', e.publicado_em, 'dias', e.dias_pub),
    'inscrita', case when i.user_id is null then null else jsonb_build_object('modo', i.modo, 'entrou', i.entrou, 'saiu_em', i.saiu_em, 'hora', i.hora) end,
    'registros', coalesce((select jsonb_agg(jsonb_build_object('dia', g.dia, 'tipo', g.tipo, 'modo', g.modo, 'data', g.data) order by g.dia) from d21_registros g where g.edicao_id = e.id and g.user_id = me), '[]'::jsonb),
    'resumo', _d21_resumo(e.id));
end $$;
grant execute on function public.d21_estado() to authenticated;

-- quantas amigas ela trouxe pelo link dela (só o número; nunca quem são)
create or replace function public.d21_minhas_amigas() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from alunas a
  where a.id <> auth.uid() and a.dados -> 'origem' ->> 'src' = 'convite'
    and a.dados -> 'origem' ->> 'anuncio' = (select dados ->> 'convite' from alunas where id = auth.uid())
    and coalesce((select dados ->> 'convite' from alunas where id = auth.uid()), '') <> ''
$$;
grant execute on function public.d21_minhas_amigas() to authenticated;

-- equipe: quem está há 2+ dias sem treinar (para a Micaela chamar no WhatsApp). Só ids e números; nome/telefone o painel já tem.
create or replace function public.d21_admin_sumidas(p_edicao uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare e d21_edicoes; hoje int;
begin
  if not admin_ve('desafios') then raise exception 'sem permissão'; end if;
  select * into e from d21_edicoes where id = p_edicao; if e.id is null then return '[]'::jsonb; end if;
  hoje := least(_d21_dia(e), 21); if hoje < 2 then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(w.z order by (w.z->>'dias_sem')::int desc) from (select q.z from (
    select jsonb_build_object('user_id', i.user_id, 'modo', i.modo, 'feitos', (select count(*) from d21_registros r where r.edicao_id = e.id and r.user_id = i.user_id),
      'ultimo', (select max(dia) from d21_registros r where r.edicao_id = e.id and r.user_id = i.user_id),
      'dias_sem', hoje - coalesce((select max(dia) from d21_registros r where r.edicao_id = e.id and r.user_id = i.user_id),
                                 greatest(((i.entrou at time zone 'America/Sao_Paulo')::date - e.inicio + 1)::int, 1) - 1)) z
    from d21_inscricoes i where i.edicao_id = e.id and i.saiu_em is null) q
    where (q.z->>'dias_sem')::int >= 2 limit 300) w), '[]'::jsonb);
end $$;
grant execute on function public.d21_admin_sumidas(uuid) to authenticated;

-- dados públicos da edição aberta (página do site): sem nada pessoal, só número de inscritas
create or replace function public.d21_publico() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('nome', e.nome, 'numero', e.numero, 'frase', e.frase, 'descricao', e.descricao, 'capa', e.capa, 'inicio', e.inicio, 'fim', e.fim,
      'fase', _d21_fase(e), 'dia', _d21_dia(e), 'hoje', d21_hoje(), 'agora', now(), 'inscritas', (select count(*) from d21_inscricoes i where i.edicao_id = e.id and i.saiu_em is null))
    from d21_edicoes e where e.status in ('inscricoes','aguardando','andamento') and e.fim >= d21_hoje() order by e.inicio limit 1), jsonb_build_object('hoje', d21_hoje()))
$$;
grant execute on function public.d21_publico() to anon, authenticated;

-- envios em lote: agora pode filtrar pela hora escolhida
drop function if exists public._d21_push(uuid, jsonb, boolean);
create or replace function public._d21_push(p_ed uuid, p_payload jsonb, p_so_pendentes boolean default false, p_hora int default null) returns int
language plpgsql security definer set search_path = public as $$
declare lote uuid[]; tk text; fid uuid; n int := 0; hp int;
begin
  select coalesce((config->>'hora_lembrete')::int, 19) into hp from d21_edicoes where id = p_ed;
  for lote in select array_agg(uid) from (
      select i.user_id uid, (row_number() over () - 1) / 300 grp from d21_inscricoes i
      where i.edicao_id = p_ed and i.saiu_em is null and exists (select 1 from push_inscricoes s where s.user_id = i.user_id)
        and (p_hora is null or coalesce(i.hora, hp) = p_hora)
        and (not p_so_pendentes or not exists (select 1 from d21_registros r where r.edicao_id = p_ed and r.user_id = i.user_id and r.data = d21_hoje()))) z group by grp loop
    tk := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    insert into push_fila (token, user_id, usuarios, payload) values (tk, null, lote, p_payload) returning id into fid;
    begin
      perform net.http_post(url := 'https://cklife.vercel.app/api/push', body := jsonb_build_object('id', fid, 'token', tk), headers := '{"Content-Type":"application/json"}'::jsonb);
    exception when others then null;
    end;
    n := n + coalesce(array_length(lote, 1), 0);
  end loop;
  return n;
end $$;
revoke all on function public._d21_push(uuid, jsonb, boolean, int) from public, anon, authenticated;

create or replace function public.d21_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare e d21_edicoes; p d21_posts; d int; h int := extract(hour from now() at time zone 'America/Sao_Paulo')::int; tit text; n int := 0;
begin
  -- status acompanha as datas (a Micaela só escolhe rascunho / inscrições abertas / arquivada)
  update d21_edicoes set status = 'andamento', atualizado = now() where status in ('inscricoes','aguardando') and inicio <= d21_hoje();
  update d21_edicoes set status = 'finalizada', atualizado = now() where status = 'andamento' and fim < d21_hoje();
  -- publicações programadas que pediram aviso no celular
  for p in select * from d21_posts where notificar and notificado is null and not apagado and publicar_em <= now() and publicar_em > now() - interval '6 hours' order by publicar_em limit 10 loop
    update d21_posts set notificado = now() where id = p.id;
    n := n + _d21_push(p.edicao_id, jsonb_build_object('title', '📢 Recado da Micaela para a turma', 'body', left(coalesce(p.titulo, p.texto, 'Tem novidade na comunidade do desafio.'), 140), 'tag', 'd21p:' || p.id, 'url', '/?d21=comunidade'));
  end loop;
  -- avisos automáticos do dia (uma vez por dia por edição)
  for e in select * from d21_edicoes where status = 'andamento' and coalesce((config->>'notificar')::boolean, true) loop
    d := _d21_dia(e); if d < 1 or d > 21 then continue; end if;
    tit := coalesce(e.dias_pub -> (d - 1) ->> 'titulo', 'Treino do dia');
    if h >= coalesce((e.config->>'hora_dia')::int, 7) and h < coalesce((e.config->>'hora_dia')::int, 7) + 5 then
      insert into d21_envios (edicao_id, chave) values (e.id, 'dia:' || d) on conflict do nothing;
      if found then n := n + _d21_push(e.id, jsonb_build_object('title', '🔥 O Dia ' || d || ' começou!', 'body', tit || '. Seu treino está esperando 💚', 'tag', 'd21dia:' || e.id, 'url', '/?d21=hoje')); end if;
    end if;
    -- lembrete na hora que CADA participante escolheu (quem ainda não treinou hoje); sem escolha = hora padrão da edição
    if h between 6 and 22 then
      insert into d21_envios (edicao_id, chave) values (e.id, 'lem:' || d || ':' || h) on conflict do nothing;
      if found then n := n + _d21_push(e.id, jsonb_build_object('title', '💚 Seu treino do Dia ' || d || ' está esperando', 'body', tit || '. Nem que seja o Plano B de 10 minutos. A turma está com você.', 'tag', 'd21lem:' || e.id, 'url', '/?d21=hoje'), true, h); end if;
    end if;
  end loop;
  return jsonb_build_object('avisos', n);
end $$;
revoke all on function public.d21_tick() from public, anon, authenticated;
