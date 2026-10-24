-- CK Life · TIME DE INCENTIVO: fotos nos 50 perfis + rodando 24 horas
-- Seguro rodar mais de uma vez. Não apaga nada.

-- 1) fotos (ficam no próprio site: img/equipe/01.jpg … 50.jpg, na mesma ordem dos nomes)
do $$ begin
  perform set_config('ck.sistema', '1', true);
  update perfis p set foto_mini = 'img/equipe/' || lpad(x.ord::text, 2, '0') || '.jpg'
  from unnest(array['Ana Clara Souza','Beatriz Lima','Camila Rocha','Daniela Martins','Eduarda Alves','Fernanda Costa','Gabriela Nunes','Helena Ribeiro','Isabela Moraes','Júlia Ferreira',
    'Larissa Gomes','Mariana Dias','Natália Barros','Olívia Castro','Paula Mendes','Rafaela Pinto','Sofia Carvalho','Tatiane Freitas','Valentina Duarte','Vitória Araújo',
    'Alice Monteiro','Bruna Teixeira','Carolina Lopes','Débora Vieira','Elisa Cardoso','Flávia Ramos','Giovana Pires','Heloísa Batista','Ingrid Correia','Jéssica Moura',
    'Karina Farias','Letícia Rezende','Manuela Azevedo','Nicole Fonseca','Priscila Campos','Renata Siqueira','Sabrina Prado','Thaís Andrade','Vanessa Brito','Yasmin Leal',
    'Amanda Cunha','Bianca Tavares','Cecília Macedo','Diana Queiroz','Estela Peixoto','Fabiana Rangel','Graziela Torres','Joana Pacheco','Lívia Bastos','Marina Coelho']) with ordinality as x(nome, ord), equipe_membros m
  where m.nome = x.nome and p.user_id = m.user_id;
  perform set_config('ck.sistema', '0', true);
end $$;
-- comentários que a equipe já fez passam a mostrar a foto
update comentarios c set foto = p.foto_mini from perfis p, equipe_membros m
where c.user_id = m.user_id and p.user_id = m.user_id and c.foto is distinct from p.foto_mini;

-- 2) rodando 24 horas
update equipe_config set hora_ini = 0, hora_fim = 24, atualizado = now() where id = 1;

-- 3) próximos comentários já saem com a foto
create or replace function public.equipe_tick() returns int
language plpgsql security definer set search_path = public as $$
declare cfg equipe_config; h int; p record; s record; bot uuid; bot2 uuid; t text; frase text; nomeb text; feitos int := 0; primeiro_nome text;
begin
  select * into cfg from equipe_config where id = 1;
  if cfg is null or not cfg.ligado then return 0; end if;
  h := extract(hour from now() at time zone 'America/Cuiaba');
  if h < cfg.hora_ini or h >= cfg.hora_fim then return 0; end if;
  -- posts de alunas reais das últimas 48 h, ainda sem comentário da equipe, depois de alguns minutos (cada post com um atraso diferente)
  for p in select po.* from posts po
    where po.criado > now() - interval '48 hours' and not po.oculto
      and not exists (select 1 from equipe_membros m where m.user_id = po.user_id)
      and not exists (select 1 from equipe_log l where l.post_id = po.id and l.acao = 'comentou')
      and po.criado < now() - ((abs(hashtext(po.id::text)) % 26) + 4) * interval '1 minute'
    order by po.criado limit 5
  loop
    select m.user_id, m.nome into bot, nomeb from equipe_membros m
      where m.ativo and (select count(*) from equipe_log l where l.user_id = m.user_id and l.acao = 'comentou' and l.criado > now() - interval '24 hours') < cfg.max_coment_dia
        and not bloqueio_entre(m.user_id, p.user_id)
      order by md5(p.id::text || m.user_id::text) limit 1;
    if bot is null then continue; end if;
    t := case
      when (select count(*) from posts x where x.user_id = p.user_id) = 1 then 'primeiro'
      when to_jsonb(p) ? 'conquista' and (to_jsonb(p) ->> 'conquista') is not null then 'conquista'
      when coalesce(to_jsonb(p) ->> 'midia', '') ~* '\.(mp4|webm|mov)$' then 'video'
      when coalesce(p.texto, '') ~* '(receita|comida|almo[cç]o|jantar|caf[eé] da manh|lanche|prato|marmita)' then 'receita'
      when coalesce(p.texto, '') ~* '(treino|treinei|academia|agachament|corrida|caminhada|exerc[ií]cio|suor|💪)' then 'treino'
      when coalesce(to_jsonb(p) ->> 'midia', '') <> '' or p.img is not null then 'foto'
      else 'geral' end;
    select texto into frase from equipe_frases where ativo and tipo in (t, case when t = 'primeiro' then 'primeiro' else 'geral' end)
      order by (tipo = t) desc, md5(p.id::text || id::text) limit 1;
    if frase is null then continue; end if;
    primeiro_nome := split_part(coalesce(p.nome, ''), ' ', 1);
    frase := case when primeiro_nome = '' then replace(replace(frase, ', {nome}', ''), '{nome}', '') else replace(frase, '{nome}', primeiro_nome) end;
    insert into comentarios (post_id, user_id, nome, foto, texto) values (p.id, bot, nomeb, (select foto_mini from perfis where user_id = bot), frase);
    insert into curtidas (post_id, user_id) values (p.id, bot) on conflict do nothing;
    insert into equipe_log (user_id, acao, post_id, texto) values (bot, 'comentou', p.id, frase);
    insert into equipe_log (user_id, acao, post_id) values (bot, 'curtiu', p.id);
    feitos := feitos + 1;
    -- metade dos posts ganha mais uma curtida de outra pessoa da equipe (só curtida)
    if abs(hashtext(p.id::text || 'x')) % 2 = 0 then
      select m.user_id into bot2 from equipe_membros m where m.ativo and m.user_id <> bot
        and (select count(*) from equipe_log l where l.user_id = m.user_id and l.acao = 'curtiu' and l.criado > now() - interval '24 hours') < cfg.max_curt_dia
        and not bloqueio_entre(m.user_id, p.user_id) order by md5(p.id::text || m.user_id::text || 'c') limit 1;
      if bot2 is not null then insert into curtidas (post_id, user_id) values (p.id, bot2) on conflict do nothing; insert into equipe_log (user_id, acao, post_id) values (bot2, 'curtiu', p.id); end if;
    end if;
  end loop;
  -- Stories: uma reação ❤️ por Story (vê o Story e avisa a aluna), nunca mensagem
  for s in select st.* from stories st
    where st.expira > now() and not st.oculto and st.criado < now() - interval '8 minutes'
      and not exists (select 1 from equipe_membros m where m.user_id = st.user_id)
      and not exists (select 1 from equipe_log l where l.story_id = st.id and l.acao = 'story')
    order by st.criado limit 5
  loop
    select m.user_id into bot from equipe_membros m where m.ativo and not bloqueio_entre(m.user_id, s.user_id)
      and (select count(*) from equipe_log l where l.user_id = m.user_id and l.acao in ('curtiu','story') and l.criado > now() - interval '24 hours') < cfg.max_curt_dia
      order by md5(s.id::text || m.user_id::text) limit 1;
    if bot is null then continue; end if;
    insert into story_vistas (story_id, user_id) values (s.id, bot) on conflict do nothing;
    perform notificar(s.user_id, bot, 'sistema', 'equipe-story:' || s.id::text, nome_de(bot) || ' reagiu com ❤️ ao seu Story');
    insert into equipe_log (user_id, acao, story_id, texto) values (bot, 'story', s.id, '❤️');
    feitos := feitos + 1;
  end loop;
  return feitos;
end $$;

-- 4) painel mostra a foto de cada perfil
create or replace function public.admin_equipe() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('comunidade') then raise exception 'sem permissão'; end if;
  return json_build_object(
    'config', (select row_to_json(c) from equipe_config c where id = 1),
    'membros', coalesce((select json_agg(x order by x.nome) from (
      select m.user_id, m.nome, m.ativo, p.username, p.foto_mini,
        (select count(*) from equipe_log l where l.user_id = m.user_id and l.acao = 'comentou' and l.criado > now() - interval '24 hours') as coment_24h,
        (select count(*) from equipe_log l where l.user_id = m.user_id and l.acao in ('curtiu','story') and l.criado > now() - interval '24 hours') as curt_24h,
        (select count(*) from equipe_log l where l.user_id = m.user_id) as total
      from equipe_membros m left join perfis p on p.user_id = m.user_id) x), '[]'::json),
    'log', coalesce((select json_agg(y) from (select l.id, l.user_id, m.nome, l.acao, l.texto, l.post_id, l.story_id, l.criado from equipe_log l left join equipe_membros m on m.user_id = l.user_id order by l.criado desc limit 60) y), '[]'::json),
    'hoje', json_build_object('comentarios', (select count(*) from equipe_log where acao = 'comentou' and criado > now() - interval '24 hours'),
                              'curtidas', (select count(*) from equipe_log where acao = 'curtiu' and criado > now() - interval '24 hours'),
                              'stories', (select count(*) from equipe_log where acao = 'story' and criado > now() - interval '24 hours')));
end $$;
