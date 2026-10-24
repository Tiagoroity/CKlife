-- CK Life · TIME DE INCENTIVO CK (perfis oficiais da equipe, identificados com selo)
-- Seguro rodar mais de uma vez. Não apaga nada de alunas.
-- Regras: 1 comentário da equipe por post · só posts de alunas reais · só frases positivas · curte · ❤️ em Stories
--         nunca responde, nunca manda mensagem, nunca avalia produto/profissional · sem login e sem acesso ao painel
--         horário humano · limite por dia · liga/desliga geral e um por um no painel · histórico de tudo.

-- ---------- 1) selo nos perfis ----------
alter table public.perfis add column if not exists equipe boolean not null default false;
create or replace function public.protege_perfil_equipe() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('ck.sistema', true) = '1' then return new; end if;
  new.equipe := case when tg_op = 'UPDATE' then old.equipe else false end;   -- ninguém se dá o selo da equipe
  return new;
end $$;
drop trigger if exists protege_perfil_equipe on public.perfis;
create trigger protege_perfil_equipe before insert or update on public.perfis for each row execute function public.protege_perfil_equipe();
-- o perfil comum sempre usa o login de quem cria; só o sistema (ck.sistema) cria perfis da equipe
create or replace function public.protege_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.username := lower(new.username);
  new.atualizado := now();
  if current_setting('ck.sistema', true) = '1' and auth.uid() is null then
    if tg_op = 'INSERT' then new.criado := now(); end if;
    return new;
  end if;
  if tg_op = 'INSERT' then new.user_id := auth.uid(); new.criado := now(); end if;
  if tg_op = 'UPDATE' then new.user_id := old.user_id; new.criado := old.criado; end if;
  if new.foto is not null and new.foto not like 'perfil/' || new.user_id::text || '/%' then new.foto := (case when tg_op = 'UPDATE' then old.foto else null end); end if;
  if new.capa is not null and new.capa not like 'perfil/' || new.user_id::text || '/%' then new.capa := (case when tg_op = 'UPDATE' then old.capa else null end); end if;
  return new;
end $$;
-- nas notificações aparece "Nome · Equipe CK"
create or replace function public.nome_de(u uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select split_part(nome, ' ', 1) || case when equipe then ' · Equipe CK' else '' end from perfis where user_id = u), (select split_part(coalesce(nome, 'Uma aluna'), ' ', 1) from alunas where id = u), 'Uma aluna')
$$;

-- ---------- 2) tabelas ----------
create table if not exists public.equipe_config (
  id int primary key default 1 check (id = 1),
  ligado boolean not null default true,
  hora_ini int not null default 8 check (hora_ini between 0 and 23),
  hora_fim int not null default 22 check (hora_fim between 1 and 24),
  max_coment_dia int not null default 15 check (max_coment_dia between 0 and 100),
  max_curt_dia int not null default 40 check (max_curt_dia between 0 and 300),
  atualizado timestamptz not null default now()
);
insert into public.equipe_config (id) values (1) on conflict do nothing;
create table if not exists public.equipe_membros (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  criado timestamptz not null default now()
);
create table if not exists public.equipe_frases (
  id serial primary key,
  tipo text not null check (tipo in ('treino','receita','conquista','foto','video','primeiro','geral')),
  texto text not null check (char_length(texto) between 2 and 200),
  ativo boolean not null default true,
  unique (tipo, texto)
);
create table if not exists public.equipe_log (
  id bigserial primary key,
  user_id uuid not null,
  acao text not null check (acao in ('comentou','curtiu','story')),
  post_id uuid,
  story_id uuid,
  texto text,
  criado timestamptz not null default now()
);
create unique index if not exists equipe_um_coment_por_post on public.equipe_log (post_id) where acao = 'comentou';
create unique index if not exists equipe_um_story on public.equipe_log (story_id) where acao = 'story';
create index if not exists equipe_log_dia on public.equipe_log (user_id, acao, criado desc);
alter table public.equipe_config enable row level security;
alter table public.equipe_membros enable row level security;
alter table public.equipe_frases enable row level security;
alter table public.equipe_log enable row level security;
-- ninguém lê/escreve direto: tudo pelas funções abaixo (o painel usa funções com checagem de admin)

-- ---------- 3) frases (só coisas boas, sem perguntas) ----------
insert into public.equipe_frases (tipo, texto) values
 ('treino','Que treino! Orgulho de você 💪'),('treino','Isso é constância! Bora que bora 🔥'),('treino','Mais um treino na conta. Você tá voando! 💚'),
 ('treino','Amei ver isso! Seu corpo agradece 🙌'),('treino','Arrasou demais nesse treino! ✨'),('treino','Disciplina linda de ver 👏'),
 ('treino','Cada treino conta. Continua assim! 💪'),('treino','Você inspira a gente, {nome}! 🔥'),('treino','Foco total! Que orgulho 💚'),
 ('receita','Que delícia! Já salvei a ideia 😍'),('receita','Comida de verdade e linda assim? Amei 🥗'),('receita','Ficou com uma cara ótima! 💚'),
 ('receita','Que prato caprichado! 👏'),('receita','Inspiração pra semana toda 😋'),
 ('conquista','Parabéns pela conquista, {nome}! Você merece 🏆'),('conquista','Que orgulho! Conquista linda 🎉'),('conquista','Isso é só o começo! Parabéns 💚'),
 ('conquista','Vitória mais que merecida! Arrasou 👏'),
 ('foto','Que energia linda nessa foto! ✨'),('foto','Brilhando demais! 💚'),('foto','Amei a foto! Que vibe boa 😍'),('foto','Você tá radiante, {nome}! ✨'),
 ('video','Que vídeo incrível! Arrasou 🔥'),('video','Amei ver você em ação! 💪'),('video','Que execução! Inspirou demais 👏'),
 ('primeiro','Seja muito bem-vinda, {nome}! Que bom ter você aqui 💚'),('primeiro','Bem-vinda à comunidade! Estamos juntas 🌸'),('primeiro','Que alegria ver seu primeiro post! 💚'),
 ('geral','Amei isso! 💚'),('geral','Que bom ver você por aqui! ✨'),('geral','Força e foco, você tá indo muito bem! 💪'),
 ('geral','Isso aí! Uma puxando a outra 💚'),('geral','Que post bom de ver! 🙌'),('geral','Energia boa demais! ✨')
on conflict (tipo, texto) do nothing;

-- ---------- 4) criar os 50 perfis da equipe (sem login: a conta fica bloqueada para entrar) ----------
create or replace function public.equipe_cria_membro(p_nome text, p_user text) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid; email text := p_user || '@equipe.cklife.app'; cols text[]; sql text; vals text;
begin
  select user_id into uid from equipe_membros where nome = p_nome; if uid is not null then return uid; end if;
  uid := gen_random_uuid();
  select array_agg(column_name::text) into cols from information_schema.columns where table_schema = 'auth' and table_name = 'users';
  if 'encrypted_password' = any(cols) then
    -- conta real do Supabase, mas sem senha válida e bloqueada (não consegue entrar no app nem no painel)
    execute format($f$insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, banned_until,
      confirmation_token, recovery_token, email_change_token_new, email_change)
      values ('00000000-0000-0000-0000-000000000000', %L, 'authenticated', 'authenticated', %L, %L, now(), '{"provider":"email","providers":["email"],"equipe":true}', '{"equipe":true}', now(), now(), '2999-12-31', '', '', '', '')$f$,
      uid, email, 'sem-login-' || md5(random()::text));
  else
    insert into auth.users (id, email) values (uid, email);   -- banco de testes
  end if;
  perform set_config('ck.sistema', '1', true);
  insert into perfis (user_id, username, nome, bio, privado, equipe)
  values (uid, p_user, p_nome, 'Equipe de Incentivo CK Life 💚 Tô aqui pra comemorar cada conquista com você.', false, true);
  perform set_config('ck.sistema', '0', true);
  insert into equipe_membros (user_id, nome) values (uid, p_nome);
  return uid;
end $$;
revoke all on function public.equipe_cria_membro(text, text) from public, anon, authenticated;
do $$ declare n text; i int := 0;
  nomes text[] := array['Ana Clara Souza','Beatriz Lima','Camila Rocha','Daniela Martins','Eduarda Alves','Fernanda Costa','Gabriela Nunes','Helena Ribeiro','Isabela Moraes','Júlia Ferreira',
    'Larissa Gomes','Mariana Dias','Natália Barros','Olívia Castro','Paula Mendes','Rafaela Pinto','Sofia Carvalho','Tatiane Freitas','Valentina Duarte','Vitória Araújo',
    'Alice Monteiro','Bruna Teixeira','Carolina Lopes','Débora Vieira','Elisa Cardoso','Flávia Ramos','Giovana Pires','Heloísa Batista','Ingrid Correia','Jéssica Moura',
    'Karina Farias','Letícia Rezende','Manuela Azevedo','Nicole Fonseca','Priscila Campos','Renata Siqueira','Sabrina Prado','Thaís Andrade','Vanessa Brito','Yasmin Leal',
    'Amanda Cunha','Bianca Tavares','Cecília Macedo','Diana Queiroz','Estela Peixoto','Fabiana Rangel','Graziela Torres','Joana Pacheco','Lívia Bastos','Marina Coelho'];
begin
  foreach n in array nomes loop i := i + 1;
    perform public.equipe_cria_membro(n, 'equipe.' || lower(regexp_replace(translate(split_part(n, ' ', 1), 'áàâãéêíóôõúçÁÉÍÓÚÇ', 'aaaaeeioooucAEIOUC'), '[^a-zA-Z]', '', 'g')));
  end loop;
end $$;

-- ---------- 5) o robô do servidor (roda a cada 5 minutos) ----------
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
    insert into comentarios (post_id, user_id, nome, texto) values (p.id, bot, nomeb, frase);
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
revoke all on function public.equipe_tick() from public, anon, authenticated;
do $$ begin
  begin perform cron.unschedule('ck-equipe-tick'); exception when others then null; end;
  begin perform cron.schedule('ck-equipe-tick', '*/5 * * * *', 'select public.equipe_tick()'); exception when others then raise notice 'Agendador não ativado: ative o Cron em Integrations e rode de novo.'; end;
end $$;

-- ---------- 6) painel: ver, ligar/desligar geral e um por um ----------
create or replace function public.admin_equipe() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('comunidade') then raise exception 'sem permissão'; end if;
  return json_build_object(
    'config', (select row_to_json(c) from equipe_config c where id = 1),
    'membros', coalesce((select json_agg(x order by x.nome) from (
      select m.user_id, m.nome, m.ativo, p.username,
        (select count(*) from equipe_log l where l.user_id = m.user_id and l.acao = 'comentou' and l.criado > now() - interval '24 hours') as coment_24h,
        (select count(*) from equipe_log l where l.user_id = m.user_id and l.acao in ('curtiu','story') and l.criado > now() - interval '24 hours') as curt_24h,
        (select count(*) from equipe_log l where l.user_id = m.user_id) as total
      from equipe_membros m left join perfis p on p.user_id = m.user_id) x), '[]'::json),
    'log', coalesce((select json_agg(y) from (select l.id, l.user_id, m.nome, l.acao, l.texto, l.post_id, l.story_id, l.criado from equipe_log l left join equipe_membros m on m.user_id = l.user_id order by l.criado desc limit 60) y), '[]'::json),
    'hoje', json_build_object('comentarios', (select count(*) from equipe_log where acao = 'comentou' and criado > now() - interval '24 hours'),
                              'curtidas', (select count(*) from equipe_log where acao = 'curtiu' and criado > now() - interval '24 hours'),
                              'stories', (select count(*) from equipe_log where acao = 'story' and criado > now() - interval '24 hours')));
end $$;
create or replace function public.admin_equipe_membro(p_user uuid, p_ativo boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('comunidade') then raise exception 'sem permissão'; end if;
  update equipe_membros set ativo = p_ativo where user_id = p_user;
  begin perform auditar('equipe_membro', 'equipe', p_user::text, 'ok', case when p_ativo then 'ligou' else 'desligou' end); exception when others then null; end;
  return found;
end $$;
create or replace function public.admin_equipe_config(p_ligado boolean, p_ini int, p_fim int, p_coment int, p_curt int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('comunidade') then raise exception 'sem permissão'; end if;
  update equipe_config set ligado = coalesce(p_ligado, ligado), hora_ini = coalesce(p_ini, hora_ini), hora_fim = coalesce(p_fim, hora_fim),
    max_coment_dia = coalesce(p_coment, max_coment_dia), max_curt_dia = coalesce(p_curt, max_curt_dia), atualizado = now() where id = 1;
  begin perform auditar('equipe_config', 'equipe', '1', 'ok', case when p_ligado then 'ligado' else 'desligado' end); exception when others then null; end;
  return true;
end $$;
revoke all on function public.admin_equipe() from public, anon;
revoke all on function public.admin_equipe_membro(uuid, boolean) from public, anon;
revoke all on function public.admin_equipe_config(boolean, int, int, int, int) from public, anon;
grant execute on function public.admin_equipe() to authenticated;
grant execute on function public.admin_equipe_membro(uuid, boolean) to authenticated;
grant execute on function public.admin_equipe_config(boolean, int, int, int, int) to authenticated;
