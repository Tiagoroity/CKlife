-- CK Life · Etapa 5 (Coach na comunidade, "Amiga, faltou você", Parceira CK). Inclui a Coach completa; pode rodar mais de uma vez.
-- CK Life · Coach CK Life no servidor (motor de engajamento)
-- O servidor decide, a cada 10 minutos, se vale mandar UM recado útil para cada aluna:
-- comemora treino, chama de volta depois de alguns dias, lembra no horário dela, bom dia, comunidade...
-- Anti-spam: no máximo 2 contatos por dia (contando os lembretes), intervalo mínimo, horário de silêncio
-- e preferências por categoria. Nunca usa ciclo, peso ou saúde. Pode rodar mais de uma vez.

-- ---------- 1) Configuração geral ----------
create table if not exists public.coach_config (
  id int primary key default 1 check (id = 1),
  ligado boolean not null default true,
  max_dia int not null default 2 check (max_dia between 0 and 5),
  intervalo_h int not null default 3 check (intervalo_h between 1 and 24),
  silencio_ini int not null default 21 check (silencio_ini between 0 and 23),
  silencio_fim int not null default 8 check (silencio_fim between 0 and 23),
  atualizado timestamptz not null default now()
);
insert into public.coach_config (id) values (1) on conflict do nothing;
alter table public.coach_config enable row level security;
drop policy if exists cc_ler on public.coach_config;
create policy cc_ler on public.coach_config for select to authenticated using (admin_ve('notificacoes'));

-- ---------- 2) Mensagens ----------
create table if not exists public.coach_mensagens (
  id serial primary key,
  categoria text not null,
  titulo text not null check (char_length(titulo) between 1 and 80),
  texto text not null check (char_length(texto) between 3 and 240),
  tom text not null default 'acolhedor',
  prioridade int not null default 5 check (prioridade between 1 and 10),
  plano text not null default 'todos' check (plano in ('todos','free','pro')),
  ativo boolean not null default true,
  criado timestamptz not null default now(),
  atualizado timestamptz,
  unique (categoria, texto)
);
alter table public.coach_mensagens enable row level security;
drop policy if exists cm_ler on public.coach_mensagens;
create policy cm_ler on public.coach_mensagens for select to authenticated using (admin_ve('notificacoes'));

-- ---------- 3) Preferências de cada aluna ----------
create table if not exists public.coach_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  coach boolean not null default true,
  treino boolean not null default true,
  alimentacao boolean not null default true,
  comunidade boolean not null default true,
  conquistas boolean not null default true,
  desafios boolean not null default true,
  promocoes boolean not null default false,
  silencio_ini int not null default 21 check (silencio_ini between 0 and 23),
  silencio_fim int not null default 8 check (silencio_fim between 0 and 23),
  max_dia int not null default 2 check (max_dia between 1 and 3),
  fuso text not null default 'America/Cuiaba',
  atualizado timestamptz not null default now()
);
alter table public.coach_prefs enable row level security;
drop policy if exists cp_ler on public.coach_prefs;
create policy cp_ler on public.coach_prefs for select to authenticated using (user_id = auth.uid());
drop policy if exists cp_criar on public.coach_prefs;
create policy cp_criar on public.coach_prefs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists cp_mudar on public.coach_prefs;
create policy cp_mudar on public.coach_prefs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create or replace function public.confere_coach_prefs() returns trigger
language plpgsql as $$
begin
  begin perform now() at time zone new.fuso; exception when others then new.fuso := 'America/Cuiaba'; end;
  new.atualizado := now(); return new;
end $$;
drop trigger if exists confere_coach_prefs on public.coach_prefs;
create trigger confere_coach_prefs before insert or update on public.coach_prefs for each row execute function public.confere_coach_prefs();

-- ---------- 4) Automações (QUANDO / SE / AGUARDAR / AÇÃO) ----------
create table if not exists public.coach_regras (
  id text primary key,
  nome text not null,
  quando text not null,
  se text not null,
  aguardar text not null,
  acao text not null,
  prioridade int not null default 50 check (prioridade between 1 and 999),
  ativo boolean not null default true,
  atualizado timestamptz not null default now()
);
alter table public.coach_regras enable row level security;
drop policy if exists cr_ler on public.coach_regras;
create policy cr_ler on public.coach_regras for select to authenticated using (admin_ve('notificacoes'));
insert into public.coach_regras (id, nome, quando, se, aguardar, acao, prioridade, ativo) values
 ('voltou', 'Voltou depois de uma pausa', 'Treinou hoje', 'Tinha ficado 7 dias ou mais sem treinar', '1 hora depois do treino', 'Recado "Olha quem voltou"', 10, true),
 ('pos_treino', 'Comemorar treino', 'Treinou hoje', 'Ainda não recebeu comemoração hoje', '1 hora depois do treino', 'Recado pós-treino, sequência ou marco', 20, true),
 ('ausencia_7d', 'Sumiu 7 dias', '7 dias sem treinar', 'Sem recado de 7 dias na última semana (para depois de 30 dias)', 'Horário preferido dela (ou 18h)', 'Recado "a porta está aberta"', 30, true),
 ('ausencia_5d', 'Sumiu 5 dias', '5 dias sem treinar', 'Ainda não recebeu esse recado nesta pausa', 'Horário preferido dela (ou 18h)', 'Recado de 5 dias', 40, true),
 ('ausencia_3d', 'Sumiu 3 dias', '3 dias sem treinar', 'Ainda não recebeu esse recado nesta pausa', 'Horário preferido dela (ou 18h)', 'Recado de 3 dias', 50, true),
 ('ausencia_48h', 'Sumiu 2 dias', '2 dias sem treinar', 'Ainda não recebeu esse recado nesta pausa', 'Horário preferido dela (ou 18h)', 'Recado "só 5 minutinhos?"', 60, true),
 ('ausencia_24h', 'Faltou ontem', '1 dia sem treinar', 'Ontem era dia de treino no plano dela', 'Horário preferido dela (ou 18h)', 'Recado "ontem não deu? tudo bem"', 70, false),
 ('primeiro_mes', 'Um mês de CK Life', 'Conta faz 30 dias', 'Uma vez só', '10h', 'Recado de primeiro mês', 80, true),
 ('primeira_semana', 'Primeira semana', 'Conta com até 7 dias', 'A cada 2 dias, no máximo', '10h', 'Dicas da primeira semana', 90, true),
 ('pre_treino', 'Antes do horário de treino', 'Dia de treino no plano', 'Não treinou ainda e não tem lembrete de treino ligado', '1 hora antes do horário preferido', 'Recado pré-treino', 100, true),
 ('bom_dia', 'Bom dia', 'Manhã', 'Nenhum recado hoje; a cada 2 dias', 'Fim do horário de silêncio dela', 'Bom dia, segunda, sexta, fim de semana, água, alimentação...', 110, true),
 ('noite', 'Fim de dia', 'Dia de treino no plano', 'Não treinou hoje e não recebeu recado hoje', '20h', 'Recado leve de noite', 120, true),
 ('comunidade', 'Comunidade', 'Quarta-feira', 'Sem recado de comunidade na semana', '12h', 'Convite para a comunidade', 130, true),
 ('faltou_voce', 'Amiga, faltou você', '4 a 14 dias sem abrir o app', 'Participava da comunidade nos últimos 60 dias; uma vez a cada 10 dias', '18h', 'Recado "Amiga, faltou você lá"', 45, true)
on conflict (id) do update set nome = excluded.nome, quando = excluded.quando, se = excluded.se, aguardar = excluded.aguardar, acao = excluded.acao;

-- ---------- 5) Recados enviados (inbox da aluna + histórico) ----------
create table if not exists public.coach_envios (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  msg_id int references public.coach_mensagens(id) on delete set null,
  categoria text not null,
  regra text,
  titulo text not null,
  texto text not null,
  canal text not null default 'inbox' check (canal in ('push','inbox')),
  push_status text,
  criado timestamptz not null default now(),
  aberto timestamptz
);
create index if not exists coach_envios_user_idx on public.coach_envios (user_id, criado desc);
create index if not exists coach_envios_criado_idx on public.coach_envios (criado);
alter table public.coach_envios enable row level security;
drop policy if exists ce_ler on public.coach_envios;
create policy ce_ler on public.coach_envios for select to authenticated using (user_id = auth.uid());
alter table public.push_fila add column if not exists coach_envio bigint;

-- grupo de preferência de cada categoria
create or replace function public._coach_grupo(p_cat text) returns text
language sql immutable as $$
  select case
    when p_cat in ('treino','pre_treino','treino_rapido') then 'treino'
    when p_cat in ('alimentacao','hidratacao') then 'alimentacao'
    when p_cat in ('comunidade','faltou_voce','coach_comunidade') then 'comunidade'
    when p_cat in ('pos_treino','streak','conquista','celebracao') then 'conquistas'
    else 'coach' end
$$;

-- troca as variáveis seguras do texto
create or replace function public._coach_render(p_txt text, v jsonb) returns text
language plpgsql immutable as $$
declare t text := p_txt; nome text := nullif(trim(coalesce(v ->> 'primeiro_nome', '')), '');
begin
  if nome is null then
    t := regexp_replace(t, ',\s*\{primeiro_nome\}', '', 'g');
    t := regexp_replace(t, '^\{primeiro_nome\}\s*[,!]?\s*', '', 'g');
    t := replace(t, '{primeiro_nome}', 'você');
  else t := replace(t, '{primeiro_nome}', nome); end if;
  t := replace(t, '{streak}', coalesce(v ->> 'streak', '0'));
  t := replace(t, '{quantidade_treinos}', coalesce(v ->> 'quantidade_treinos', '0'));
  t := replace(t, '{horario_treino}', coalesce(v ->> 'horario_treino', 'seu horário'));
  t := replace(t, '{dias_ativos}', coalesce(v ->> 'dias_ativos', '0'));
  t := replace(t, '{ultima_atividade}', coalesce(v ->> 'ultima_atividade', 'sua última atividade'));
  t := replace(t, '{objetivo}', coalesce(v ->> 'objetivo', 'seu objetivo'));
  t := replace(t, '{tempo_disponivel}', coalesce(v ->> 'tempo_disponivel', '15'));
  t := regexp_replace(t, '\{[a-z_]+\}', '', 'g');
  t := regexp_replace(t, '\s{2,}', ' ', 'g');
  t := trim(t);
  if t <> '' then t := upper(left(t, 1)) || substr(t, 2); end if;
  return t;
end $$;

-- ---------- 6) Envia um recado (inbox sempre; celular se ela ativou os avisos) ----------
create or replace function public._coach_envia(p_uid uuid, p_cat text, p_regra text, v jsonb, p_pro boolean, p_agora timestamptz default now(), p_msg int default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare m coach_mensagens; eid bigint; tit text; corpo text; tk text; fid uuid; canal text;
begin
  if p_msg is not null then select * into m from coach_mensagens where id = p_msg;
  else
    select * into m from coach_mensagens c where c.categoria = p_cat and c.ativo and (c.plano = 'todos' or (c.plano = 'pro') = p_pro)
      and c.id not in (select e.msg_id from coach_envios e where e.user_id = p_uid and e.msg_id is not null and e.criado > p_agora - interval '60 days')
      order by random() * c.prioridade desc limit 1;
    if m.id is null then
      select * into m from coach_mensagens c where c.categoria = p_cat and c.ativo and (c.plano = 'todos' or (c.plano = 'pro') = p_pro) order by random() limit 1;
    end if;
  end if;
  if m.id is null then return null; end if;
  tit := left(_coach_render(m.titulo, v), 80); corpo := left(_coach_render(m.texto, v), 240);
  canal := case when exists (select 1 from push_inscricoes s where s.user_id = p_uid) then 'push' else 'inbox' end;
  insert into coach_envios (user_id, msg_id, categoria, regra, titulo, texto, canal, criado)
    values (p_uid, m.id, m.categoria, p_regra, tit, corpo, canal, p_agora) returning id into eid;
  if canal = 'push' then
    tk := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    insert into push_fila (token, user_id, payload, coach_envio) values (tk, p_uid,
      jsonb_build_object('title', tit, 'body', corpo, 'tag', 'coach', 'url', '/?coach=' || eid), eid) returning id into fid;
    begin
      perform net.http_post(url := 'https://cklife.vercel.app/api/push', body := jsonb_build_object('id', fid, 'token', tk), headers := '{"Content-Type":"application/json"}'::jsonb);
    exception when others then update coach_envios set push_status = 'sem_envio' where id = eid;   -- sem pg_net: fica só no app
    end;
  end if;
  return eid;
end $$;
revoke all on function public._coach_envia(uuid, text, text, jsonb, boolean, timestamptz, int) from public, anon, authenticated;

-- resultado do envio para o celular (mesma função de antes + recados da Coach)
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
  if f.coach_envio is not null then
    update coach_envios set push_status = case when p_enviados > 0 then 'enviado' else 'falhou' end where id = f.coach_envio;
  end if;
  perform set_config('ck.sistema', '0', true);
end $$;
grant execute on function public.push_resultado(uuid, text, int, int) to anon, authenticated;

-- ---------- Mensagens iniciais (401 em 32 categorias). Rodar de novo não duplica. ----------
insert into public.coach_mensagens (categoria, titulo, texto) values
('bom_dia','Bom dia, {primeiro_nome} 💚','Que tal começar o dia fazendo algo por você? Nem que seja um pouquinho.'),
('bom_dia','Bom dia!','Um copo de água e 5 minutos de movimento já mudam o dia.'),
('bom_dia','Bom dia, {primeiro_nome}','Hoje não precisa ser perfeito. Só precisa ser seu.'),
('bom_dia','Começou o dia ☀️','Respira fundo. Um passo de cada vez. A gente está junto.'),
('bom_dia','Bom dia 💚','Você não precisa de motivação para começar. Precisa de um começo pequeno.'),
('bom_dia','Oi, {primeiro_nome}','Que tal deixar a roupa de treino separada? Já é meio caminho andado.'),
('bom_dia','Bom dia!','Seu treino de hoje já está pronto no CK Life. Quando der, ele te espera.'),
('bom_dia','Dia novo ☀️','Ontem ficou para trás. Hoje é uma página em branco.'),
('bom_dia','Bom dia, {primeiro_nome}','Cuidar de você também é prioridade. Coloca um tempinho na agenda.'),
('bom_dia','Bom dia 💚','Pequenas escolhas, todos os dias. É assim que a rotina nasce.'),
('bom_dia','Acordou? ☀️','Alongar 2 minutinhos antes de pegar o celular já faz diferença.'),
('bom_dia','Bom dia!','Hoje, escolha você. Nem que seja um pouquinho.'),
('bom_dia','Bom dia, {primeiro_nome}','Seu ritmo. Sua evolução. Sua vida. Bora?'),
('treino','Seu treino está pronto 💪','{tempo_disponivel} minutos que são só seus. Quando der, a gente começa.'),
('treino','Hora de você','Seu plano de hoje já está montado. É só apertar o play.'),
('treino','Bora, {primeiro_nome}?','Não precisa ser o melhor treino da sua vida. Só precisa acontecer.'),
('treino','Treino do dia 💚','Coloca uma música que você gosta e vem com a gente.'),
('treino','Seu corpo agradece','Movimento é cuidado. Seu treino de hoje te espera.'),
('treino','{primeiro_nome}, bora?','Começa com 5 minutos. Se quiser continuar, continua.'),
('treino','Lembrete gentil 💚','Você combinou de cuidar de você hoje. Ainda dá tempo.'),
('treino','Treino de hoje','Sem pressa, sem perfeição. No seu ritmo.'),
('treino','Pronta?','Água do lado, roupa confortável e o CK Life aberto. Pronto.'),
('treino','Seu momento','Esse tempo é seu. Sem culpa por tirar um tempo para você.'),
('treino','Vamos juntas?','Hoje tem treino no seu plano. A gente te acompanha do começo ao fim.'),
('treino','Um passo hoje','Constância é aparecer, mesmo quando é pouco.'),
('treino','{primeiro_nome} 💚','Seu treino é curto e cabe no seu dia. Bora?'),
('treino','Hoje tem treino 💚','Seu plano escolheu um treino que cabe em {tempo_disponivel} minutos.'),
('pre_treino','Seu treino começa daqui a pouco','Separe sua água e uma roupa confortável. A gente te espera.'),
('pre_treino','Quase na hora 💚','Que tal já deixar o espaço livre para treinar?'),
('pre_treino','Daqui a pouco é você','Seu treino de hoje está pronto. Só falta você.'),
('pre_treino','Prepara a água 💧','Seu horário de treino está chegando.'),
('pre_treino','{primeiro_nome}, quase lá','Respira, se alonga um pouquinho e vem.'),
('pre_treino','Hora chegando','No seu horário de sempre. Bora manter o combinado com você?'),
('pre_treino','Aquece 🔥','Dois minutinhos de aquecimento já preparam o corpo.'),
('pre_treino','Seu horário está chegando','Se hoje o tempo apertou, tem treino de 5 minutos.'),
('pre_treino','Pronta para hoje?','Música, água e você. É o que precisa.'),
('pre_treino','Lembrete 💚','Seu treino é às {horario_treino}. A gente está aqui.'),
('pre_treino','Quase na hora','Não precisa estar animada. Só precisa começar.'),
('pre_treino','Seu momento vem aí','Avisa a família: daqui a pouco é o seu tempo.'),
('pos_treino','Treino feito 💚','Você apareceu por você hoje. Isso é o que importa.'),
('pos_treino','Orgulho de você, {primeiro_nome}','Agora: água, um bom lanche e descanso.'),
('pos_treino','Mais um ✅','Você já tem {quantidade_treinos} treinos no CK Life. Cada um conta.'),
('pos_treino','Você cumpriu','O combinado com você mesma foi cumprido hoje.'),
('pos_treino','Isso aí! 💪','Hidrata e alonga um pouquinho. Seu corpo agradece.'),
('pos_treino','Treino concluído','Sem perfeição, com constância. É assim.'),
('pos_treino','Feito ✅','Um dia de cada vez. Hoje foi o seu.'),
('pos_treino','Parabéns, {primeiro_nome}','Que tal registrar como você se sentiu? Ajuda a ver sua evolução.'),
('pos_treino','Você conseguiu 💚','Lembra desse sentimento nos dias difíceis.'),
('pos_treino','Mais um passo','Você está construindo uma rotina. Isso leva tempo, e você está fazendo.'),
('pos_treino','Hoje contou','Compartilha sua vitória na comunidade, se quiser. Elas vão comemorar com você.'),
('pos_treino','Treino no bolso ✅','Agora é recuperar. Descansar também é parte do treino.'),
('alimentacao','Hora de cuidar do prato 🥗','Seu cardápio de hoje está no CK Life, com receitas simples.'),
('alimentacao','Comer bem é cuidado','Não é sobre dieta perfeita. É sobre escolhas que te fazem bem.'),
('alimentacao','Ideia de lanche 🍎','Fruta com iogurte ou castanhas: rápido e gostoso.'),
('alimentacao','Seu almoço','Prato colorido: um pouco de cada cor já ajuda.'),
('alimentacao','Sem neura 💚','Uma refeição não define nada. A rotina sim.'),
('alimentacao','Receita do dia','Tem receita nova e simples esperando no Cardápio.'),
('alimentacao','Proteína no café?','Ovo, iogurte ou queijo ajudam a ficar satisfeita por mais tempo.'),
('alimentacao','Jantar leve','Que tal uma receita rápida do CK Life hoje?'),
('alimentacao','Cuidar não é restringir','Coma com calma e preste atenção em como você se sente.'),
('alimentacao','Lanche da tarde 🍌','Uma fruta agora ajuda a chegar bem no jantar.'),
('alimentacao','Prato da semana','Planejar 2 ou 3 refeições já facilita muito a semana.'),
('alimentacao','Comida de verdade 💚','Quanto mais simples, mais fácil de manter.'),
('hidratacao','Já bebeu água? 💧','Um copo agora já ajuda. Marca no CK Life.'),
('hidratacao','Pausa da água 💧','Seu corpo agradece cada copo.'),
('hidratacao','Lembrete gentil','Deixa uma garrafinha por perto hoje.'),
('hidratacao','Água 💧','Muitas vezes o cansaço da tarde é só sede.'),
('hidratacao','Mais um copo?','Você está a alguns copos da sua meta de hoje.'),
('hidratacao','Hidrata, {primeiro_nome}','Um gole agora, outro depois. Sem complicação.'),
('hidratacao','Dica 💧','Água com limão ou hortelã deixa tudo mais gostoso.'),
('hidratacao','Pausa de 10 segundos','Bebe um copo de água e volta para o que estava fazendo.'),
('hidratacao','Cuidado simples','Hidratação é um dos jeitos mais fáceis de se cuidar.'),
('hidratacao','Garrafinha cheia? 💧','Encher agora já é metade do caminho.'),
('hidratacao','Água antes do treino','Um copo meia hora antes ajuda o corpo a render.'),
('hidratacao','💧','Pequenos goles ao longo do dia valem mais que tudo de uma vez.'),
('preguica','Bateu preguiça?','Combina só 5 minutos com você. Depois decide se continua.'),
('preguica','Tudo bem não estar animada','A vontade muitas vezes vem depois que a gente começa.'),
('preguica','Preguiça acontece 😅','Com todo mundo. O segredo é não deixar ela decidir sozinha.'),
('preguica','Só 5 minutinhos','Pouco ainda conta. Pouco, todo dia, vira muito.'),
('preguica','Sem vontade hoje?','Coloca a roupa de treino. Só isso. Depois a gente vê.'),
('preguica','{primeiro_nome}, combinado?','Um exercício só. Se quiser parar depois, pode.'),
('preguica','Dia de sofá?','Que tal um alongamento ali mesmo? Já é movimento.'),
('preguica','Preguiça não é defeito','É só um dia. Escolha algo leve e siga.'),
('preguica','Começa pequeno','Um treino curto hoje é melhor que nenhum.'),
('preguica','Respira 💚','Você não precisa estar motivada. Precisa só dar o primeiro passo.'),
('preguica','Tá difícil hoje?','Abre o CK Life e toca em "Hoje tá difícil?". A gente te ajuda.'),
('preguica','Uma música e vai','Coloca sua música favorita e mexe o corpo por uma faixa.'),
('humor','Treino é remédio para o humor 😄','Seu cérebro também agradece os 10 minutos de hoje.'),
('humor','Plot twist 🎬','A protagonista decidiu treinar mesmo cansada. Que série boa.'),
('humor','Seu tênis ligou 👟','Disse que está com saudade. Vai deixar ele no vácuo?'),
('humor','Notícia urgente 📢','Cientistas confirmam: 5 minutos de treino ainda são 5 minutos de treino.'),
('humor','Previsão do tempo ☀️','Hoje: 100% de chance de você se sentir melhor depois de treinar.'),
('humor','Seu sofá avisou 🛋️','Ele vai estar aí depois do treino. Prometido.'),
('humor','Modo avião? ✈️','Coloca o celular no modo treino por 10 minutinhos.'),
('humor','Meme do dia','Eu: só um exercício. Também eu: fiz o treino todo. 💪'),
('humor','Fofoca boa 🤭','Fiquei sabendo que alguém vai arrasar no treino hoje.'),
('humor','Lembrete divertido','Agachamento conta mesmo se for para pegar o controle remoto? Hoje vamos fazer os de verdade. 😂'),
('humor','Sua playlist chamou 🎧','Ela quer saber se vai rolar treino hoje.'),
('humor','Spoiler 🎉','No final do treino você vai estar orgulhosa.'),
('segunda','Segunda chegou 💚','Sem pressão de começar tudo do zero. Só continuar.'),
('segunda','Semana nova','Que tal definir quantos treinos cabem nessa semana?'),
('segunda','Segunda-feira','Um treino hoje e a semana já começa no seu ritmo.'),
('segunda','Bom começo de semana','Escolha uma coisa só para cuidar de você hoje.'),
('segunda','Segunda 💪','Não é sobre recomeçar. É sobre seguir.'),
('segunda','Oi, {primeiro_nome}','Sua semana começa com você em primeiro lugar?'),
('segunda','Nova semana, mesma você','E você já sabe que consegue.'),
('segunda','Segunda leve','Treino curto conta. Começar a semana com ele é ótimo.'),
('segunda','Semana em branco','Que tal escrever nela: eu volto por mim?'),
('segunda','Segunda 💚','Seu plano da semana está pronto no CK Life.'),
('segunda','Planejamento rápido','Olha sua agenda e escolhe os dias de treino.'),
('segunda','Começou!','Um dia de cada vez. Hoje é o primeiro.'),
('sexta','Sextou 🎉','Que tal fechar a semana com um treino?'),
('sexta','Sexta-feira 💚','Você chegou até aqui. Comemora com um tempo para você.'),
('sexta','Sextou com movimento','Um treino curto antes do fim de semana deixa tudo mais leve.'),
('sexta','Última da semana','Olha quantas vezes você apareceu por você nessa semana.'),
('sexta','Sexta 💪','Treino de 10 minutos e o fim de semana começa melhor.'),
('sexta','Fecha com chave de ouro','Um treino hoje é um presente para você.'),
('sexta','Sexta, {primeiro_nome}!','Semana corrida? Pouco ainda conta.'),
('sexta','Sexta leve','Alongamento também é uma ótima forma de fechar a semana.'),
('sexta','Fim de semana chegando','Que tal planejar uma caminhada no sábado?'),
('sexta','Sextou 💚','Orgulho de você por cada dia dessa semana.'),
('sexta','Sexta-feira','Se a semana não foi como você queria, tudo bem. Ainda dá.'),
('sexta','Encerramento 🎬','Termina a semana fazendo algo por você.'),
('fim_de_semana','Fim de semana 💚','Que tal um treino leve ou uma caminhada ao ar livre?'),
('fim_de_semana','Sábado','Descansar também é importante. Mas um alongamento cai bem.'),
('fim_de_semana','Domingo leve','Prepara a semana: separa as roupas de treino.'),
('fim_de_semana','Fim de semana ativo','Dançar, pedalar, caminhar: tudo é movimento.'),
('fim_de_semana','Sábado 💪','Sem pressa hoje. Treina na hora que quiser.'),
('fim_de_semana','Domingo 💚','Que tal uma receita nova do CK Life para a semana?'),
('fim_de_semana','Fim de semana','Movimento com quem você ama também conta.'),
('fim_de_semana','Hoje é livre','Escolha algo que te faça bem.'),
('fim_de_semana','Domingo de recarga','Durma bem. Semana que vem a gente continua.'),
('fim_de_semana','Sábado de sol? ☀️','Uma caminhada curta e um copo de água.'),
('fim_de_semana','Fim de semana','Seu plano respeita seus dias. Faz o que der.'),
('fim_de_semana','Domingo','Olha sua semana no CK Life. Você fez mais do que imagina.'),
('recomeco','Recomeçar é coragem 💚','E você não começa do zero. Começa da experiência.'),
('recomeco','Bem-vinda de volta','A gente estava te esperando. Sem cobrança.'),
('recomeco','Volta leve','Que tal um treino de 5 minutos para reencontrar o ritmo?'),
('recomeco','Recomeço','Voltar também é progresso.'),
('recomeco','Sem compensar nada','Não precisa treinar dobrado. Só voltar.'),
('recomeco','Oi de novo, {primeiro_nome}','O CK Life guardou seu plano. É só continuar.'),
('recomeco','Um passo de volta','O mais difícil é abrir o app. Isso você já fez.'),
('recomeco','Recomeçar é normal','Rotina de verdade tem pausas. O importante é voltar.'),
('recomeco','Ainda é tempo','Não existe hora certa para voltar. Existe hoje.'),
('recomeco','De volta ao seu ritmo','Comece mais leve. O corpo lembra.'),
('recomeco','Volta por você','Você prometeu voltar. E está voltando. 💚'),
('recomeco','Novo começo','Escolha um treino curto e celebre ter voltado.'),
('recomeco','Dia 1 de novo?','Tudo bem. Todo dia 1 é uma prova de que você não desistiu.'),
('ausencia_24h','Oi, {primeiro_nome} 💚','Ontem não deu? Tudo bem. Hoje é um novo dia.'),
('ausencia_24h','Um dia não muda nada','Hoje você pode continuar de onde parou.'),
('ausencia_24h','A vida acontece','Hoje a gente continua, no seu ritmo.'),
('ausencia_24h','Sem cobrança','Que tal um treino curtinho hoje?'),
('ausencia_24h','Hoje dá?','10 minutos já mantêm o ritmo.'),
('ausencia_24h','Seu plano te espera','Ele não vai embora. Quando der, você volta.'),
('ausencia_24h','Oi!','Passando para lembrar que você está indo bem.'),
('ausencia_24h','Ritmo 💚','Um dia de pausa faz parte. Bora continuar?'),
('ausencia_24h','Hoje é outro dia','Escolha um treino que caiba no seu tempo.'),
('ausencia_24h','Lembrete gentil','Seu treino de hoje é curto. Você consegue.'),
('ausencia_24h','{primeiro_nome}','Que tal um alongamento rápido agora?'),
('ausencia_24h','Volta fácil','Pouco ainda conta. Começa com 5 minutos.'),
('ausencia_48h','Só 5 minutinhos hoje?','Pouco ainda conta. A gente está aqui.'),
('ausencia_48h','{primeiro_nome}, tudo bem?','Não precisa compensar nada. Só voltar com algo leve.'),
('ausencia_48h','Saudade de você 💚','Seu plano está pronto quando você estiver.'),
('ausencia_48h','Dois dias','Sem problema. Hoje pode ser o dia de voltar.'),
('ausencia_48h','Volta leve','Um treino de 5 minutos já reconecta você com a rotina.'),
('ausencia_48h','Tá corrido?','Tem treino de 5, 10 e 15 minutos no CK Life.'),
('ausencia_48h','Oi, sumida 😄','Brincadeira. Sem cobrança. Mas a gente sentiu sua falta.'),
('ausencia_48h','Seu ritmo','Pausas acontecem. O importante é voltar.'),
('ausencia_48h','Hoje?','Escolha o tempo que cabe. A gente ajusta o resto.'),
('ausencia_48h','Lembrete 💚','Você não precisa estar motivada. Só precisa começar.'),
('ausencia_48h','Caminhada conta','Se treinar não der, uma caminhada já vale.'),
('ausencia_48h','Estamos aqui','Quando quiser voltar, é só abrir o app.'),
('ausencia_3d','Faz uns dias, {primeiro_nome}','Sem cobrança: que tal 5 minutos hoje?'),
('ausencia_3d','Voltar também é progresso','Escolha o tempo que cabe hoje.'),
('ausencia_3d','Saudade 💚','Seu plano continua aqui, do jeitinho que você deixou.'),
('ausencia_3d','Ainda dá','Três dias não apagam o que você construiu.'),
('ausencia_3d','Volta no seu tempo','Um alongamento hoje já é um recomeço.'),
('ausencia_3d','Rotina tem pausas','E rotina boa é a que sabe voltar.'),
('ausencia_3d','Oi, {primeiro_nome}','A semana apertou? Pouco ainda conta.'),
('ausencia_3d','Sem compensar','Não precisa treinar dobrado. Só voltar leve.'),
('ausencia_3d','Você já conseguiu antes','E vai conseguir de novo. Um passo de cada vez.'),
('ausencia_3d','Estamos te esperando','Treino de 5 minutos pronto para você.'),
('ausencia_3d','Respira 💚','Hoje pode ser leve. Só não precisa ser zero.'),
('ausencia_3d','Volta?','A comunidade e a Coach estão aqui por você.'),
('ausencia_5d','Oi, {primeiro_nome} 💚','Lembra por que você começou? Isso continua valendo.'),
('ausencia_5d','Ainda estamos aqui','Quando você quiser voltar, seu plano está pronto.'),
('ausencia_5d','Sem culpa','Pausa não é desistência. Que tal voltar com 5 minutos?'),
('ausencia_5d','Saudade de você','O CK Life não é o mesmo sem você por aqui.'),
('ausencia_5d','Recomeço leve','Um treino curto hoje e pronto. Você voltou.'),
('ausencia_5d','Cinco dias','Não importa. Importa o próximo passo.'),
('ausencia_5d','Seu combinado','Você prometeu voltar por você. A gente acredita em você.'),
('ausencia_5d','Volta devagar','Começa com alongamento. O corpo agradece.'),
('ausencia_5d','Uma mensagem sua','Você escreveu para sua eu do futuro. Ela está torcendo por você.'),
('ausencia_5d','Ainda dá tempo','Sempre dá. Hoje é um ótimo dia para voltar.'),
('ausencia_5d','Pouco ainda conta','5 minutos hoje valem mais que um treino perfeito amanhã.'),
('ausencia_5d','Estamos juntas','Abre o app. O resto a gente faz junto.'),
('ausencia_7d','Olha quem pode voltar hoje 💚','Não importa quanto tempo passou. Importa voltar.'),
('ausencia_7d','Uma semana','Sem compensar nada. Sem recomeçar do zero. A gente continua de onde dá.'),
('ausencia_7d','Oi, {primeiro_nome}','Seu plano está guardado. Quando quiser, é só voltar.'),
('ausencia_7d','A porta está aberta','Sempre vai estar. Volta no seu tempo.'),
('ausencia_7d','Saudade 💚','Que tal um treino de 5 minutos só para reencontrar o ritmo?'),
('ausencia_7d','Recomeçar é coragem','E você tem de sobra.'),
('ausencia_7d','Você já voltou antes','Isso se chama resiliência. Bora mais uma vez?'),
('ausencia_7d','Sem cobrança','Só passando para dizer que a gente está aqui.'),
('ausencia_7d','Volta leve','Um alongamento hoje. Amanhã, quem sabe, um treino.'),
('ausencia_7d','Seu ritmo, sua hora','Não existe atraso. Existe o seu tempo.'),
('ausencia_7d','Estamos te esperando','Treinos curtinhos prontos para a sua volta.'),
('ausencia_7d','Constância também é saber recuperar','E hoje pode ser o dia.'),
('primeira_semana','Primeira semana 💚','Cada treino dessa semana é uma vitória. Bora para o próximo?'),
('primeira_semana','Começo é assim','Um pouco de cada vez. Você está indo bem.'),
('primeira_semana','Dica da Coach','Conheça a comunidade: tem mulheres começando junto com você.'),
('primeira_semana','Seu primeiro passo','Que tal fazer seu primeiro treino hoje? São só 5 minutos.'),
('primeira_semana','Bem-vinda, {primeiro_nome}','Explore as receitas do Cardápio. Tem coisa gostosa e simples.'),
('primeira_semana','Semana 1','Não precisa fazer tudo. Faça o que cabe.'),
('primeira_semana','Rotina nasce aqui','Escolha um horário fixo para treinar. Ajuda muito.'),
('primeira_semana','Você começou 💚','Começar é a parte mais difícil. E você já fez.'),
('primeira_semana','Conhece o check-in?','Contar como você está ajuda a Coach a te acompanhar melhor.'),
('primeira_semana','Primeiros dias','Seu corpo vai se acostumando. Respeite seu ritmo.'),
('primeira_semana','Dica','Ative os lembretes no horário que você treina. A gente te avisa.'),
('primeira_semana','Orgulho de você','Você está construindo algo que é seu.'),
('primeiro_mes','Um mês de CK Life 💚','Olha tudo que você já fez. Isso é seu.'),
('primeiro_mes','Primeiro mês','Você já tem {quantidade_treinos} treinos. Cada um conta.'),
('primeiro_mes','30 dias','Lembra da mensagem que você escreveu para você? Ela está te esperando no app.'),
('primeiro_mes','Um mês juntas','Obrigada por continuar voltando.'),
('primeiro_mes','Você está construindo','Rotina leva tempo. E você está fazendo.'),
('primeiro_mes','Mês 1 ✅','Que tal escolher uma meta pequena para o próximo mês?'),
('primeiro_mes','Primeiro mês','Teve dias bons e dias difíceis. Os dois fazem parte.'),
('primeiro_mes','{primeiro_nome}, olha você','Um mês atrás você decidiu cuidar de você. Continua.'),
('primeiro_mes','Marco importante 🎉','Um mês de constância é muito. Comemora!'),
('primeiro_mes','Próximo capítulo','O segundo mês costuma ser mais leve. O hábito está chegando.'),
('primeiro_mes','Obrigada 💚','Por confiar no CK Life para caminhar com você.'),
('primeiro_mes','Um mês','Compartilha sua jornada na comunidade, se quiser.'),
('conquista','Nova conquista 🏅','Você desbloqueou uma conquista no CK Life. Vem ver!'),
('conquista','Conquista sua','Não foi sorte. Foi você aparecendo.'),
('conquista','🏆','Mais uma conquista para a sua coleção.'),
('conquista','Parabéns, {primeiro_nome}','Você chegou num marco importante. Orgulho!'),
('conquista','Desbloqueado ✨','Tem uma conquista nova esperando por você.'),
('conquista','Você conseguiu','Comemora! Cada conquista é um lembrete do quanto você é capaz.'),
('conquista','Conquista 🏅','Que tal compartilhar com a comunidade? Elas vão comemorar.'),
('conquista','Olha isso!','Você está colecionando vitórias.'),
('conquista','Marco atingido','{dias_ativos} dias ativos no CK Life. Lindo de ver.'),
('conquista','Mais uma 🎉','Constância vira conquista. Você é a prova.'),
('conquista','Conquista nova','Guarda esse momento. Você mereceu.'),
('conquista','Uau 💚','Uma conquista nova no seu perfil.'),
('streak','{streak} dias seguidos 🔥','Você está aparecendo por você. Isso é constância.'),
('streak','Sequência linda','{streak} dias seguidos. Um dia de cada vez.'),
('streak','🔥 {streak} dias','Que orgulho, {primeiro_nome}.'),
('streak','Constância','{streak} dias seguidos e contando.'),
('streak','Sequência ativa','Hoje um treino leve já mantém o seu fogo aceso.'),
('streak','{streak} dias!','Lembra: descansar quando precisa também faz parte.'),
('streak','Fogo aceso 🔥','Você está construindo um hábito de verdade.'),
('streak','Olha você','{streak} dias cuidando de você. Lindo.'),
('streak','Sequência','Não precisa ser perfeito. Só precisa continuar.'),
('streak','{primeiro_nome} 🔥','Seus {streak} dias mostram do que você é capaz.'),
('streak','Mantém?','Uma caminhada ou alongamento já conta para a sequência.'),
('streak','Marco 🔥','{streak} dias seguidos. Comemora do seu jeito.'),
('comunidade','A comunidade está ativa 💚','Tem mulheres compartilhando vitórias hoje. Vem ver.'),
('comunidade','Pergunta do dia','Responde a Pergunta do dia na comunidade. É rapidinho.'),
('comunidade','Juntas é mais fácil','Que tal deixar um comentário de incentivo para alguém hoje?'),
('comunidade','Vitórias de hoje','Vem comemorar com quem treinou hoje.'),
('comunidade','Você não está sozinha','Tem um grupo para cada objetivo na comunidade.'),
('comunidade','Compartilhe','Postar sua vitória inspira outras mulheres.'),
('comunidade','Comunidade CK','Uma palavra boa sua pode mudar o dia de alguém.'),
('comunidade','Novidade nos grupos','Entra num grupo e conhece mulheres com o mesmo objetivo.'),
('comunidade','Oi, {primeiro_nome}','A comunidade tem receitas e dicas novas. Dá uma olhada.'),
('comunidade','Juntas 💚','Mulheres diferentes, uma decisão em comum: continuar.'),
('comunidade','Incentivo','Curte e comenta o post de alguém que está começando.'),
('comunidade','Legião CK Life','Você faz parte disso. Vem dar um oi.'),
('comunidade','Alguém precisa ouvir isso','Deixa uma mensagem de incentivo na comunidade hoje.'),
('autoestima','Lembrete 💚','Seu corpo não é um projeto de punição. É a sua casa.'),
('autoestima','Você é suficiente','Hoje, do jeito que você está.'),
('autoestima','Cuide com carinho','Treinar por amor a você muda tudo.'),
('autoestima','Olha para você','Você está fazendo o seu melhor. Isso basta.'),
('autoestima','Seu valor','Não está no espelho nem na balança. Está em quem você é.'),
('autoestima','Fala bonito com você','Você merece a mesma gentileza que dá para os outros.'),
('autoestima','Você é capaz','Já fez coisas difíceis antes. Vai fazer de novo.'),
('autoestima','Seu tempo 💚','Cuidar de você não é egoísmo. É base.'),
('autoestima','Sem comparação','Seu caminho é seu. Seu ritmo é seu.'),
('autoestima','Gentileza','Hoje, troque uma crítica por um elogio para você mesma.'),
('autoestima','Você importa','E o tempo que você dedica a você também.'),
('autoestima','Orgulho 💚','Da mulher que você está escolhendo ser.'),
('autoestima','Você merece cuidado','Inclusive o seu próprio.'),
('disciplina','Disciplina é carinho','É lembrar do que você quer, mesmo nos dias sem vontade.'),
('disciplina','Constância > intensidade','Pouco todo dia vale mais que muito de vez em quando.'),
('disciplina','Combinado é combinado 💚','Você combinou com você. Só você sabe o quanto vale.'),
('disciplina','Rotina','Treinar no mesmo horário ajuda o hábito a se firmar.'),
('disciplina','Um treino ruim','Ainda é melhor que nenhum treino.'),
('disciplina','Disciplina gentil','Faça o mínimo nos dias difíceis. Mas faça.'),
('disciplina','Hábito','Não depende de motivação. Depende de repetição.'),
('disciplina','Sem desculpas, com carinho','Se não dá o treino inteiro, faz metade.'),
('disciplina','Aparecer','É metade do caminho. A outra metade é continuar.'),
('disciplina','Sua palavra','Você prometeu voltar por você. Cumpre com leveza.'),
('disciplina','Um dia de cada vez','Disciplina não é perfeição. É voltar sempre.'),
('disciplina','Ritual','Roupa, água, música, play. Seu ritual de treino.'),
('motivacao','Não buscamos perfeição','Buscamos constância.'),
('motivacao','Pouco ainda conta 💚','Pouco, todo dia, vira muito.'),
('motivacao','Você já começou antes','Você consegue continuar.'),
('motivacao','Seu ritmo','Sua evolução. Sua vida.'),
('motivacao','Ninguém constrói rotina em um dia','Constrói voltando.'),
('motivacao','Você não está atrasada','Está no seu tempo.'),
('motivacao','Hoje','Escolha você. Nem que seja um pouquinho.'),
('motivacao','Um passo pequeno','Ainda é um passo para frente.'),
('motivacao','Você é mais forte','Do que aquele dia de preguiça.'),
('motivacao','Lembre do porquê 💚','O motivo que te trouxe até aqui continua valendo.'),
('motivacao','Constância','É a mágica que ninguém vê, mas todo mundo sente.'),
('motivacao','Acredite no processo','Ele funciona quando você continua.'),
('motivacao','Você consegue','A gente acredita em você. Agora acredite também.'),
('motivacao','Seu futuro agradece','Cada escolha de hoje é um presente para a você de amanhã.'),
('motivacao','Devagar também chega','O importante é não parar de caminhar.'),
('rotina_corrida','Dia corrido? ⏱️','5 minutos já contam. Tem treino rapidinho no app.'),
('rotina_corrida','Sem tempo hoje','Que tal 10 agachamentos entre uma tarefa e outra?'),
('rotina_corrida','Correria 💚','Treino curto também é treino.'),
('rotina_corrida','Encaixa','5 minutos antes do banho já resolvem.'),
('rotina_corrida','Rotina apertada','Escolha o treino de 10 minutos. Cabe no seu dia.'),
('rotina_corrida','Mãe, trabalho, casa…','Você faz muito. Separe 5 minutos só para você.'),
('rotina_corrida','Sem tempo?','Subir escada e caminhar também contam.'),
('rotina_corrida','Agenda cheia','Marca um compromisso com você mesma. 10 minutos.'),
('rotina_corrida','Rápido e bom','Treino de 5 minutos pronto. É só apertar o play.'),
('rotina_corrida','Dia louco','Se hoje não der, um alongamento antes de dormir já vale.'),
('rotina_corrida','Pausa estratégica','Levanta, alonga, respira. 2 minutos. Pronto.'),
('rotina_corrida','Pouco tempo, muito valor','Cada minuto investido em você conta.'),
('rotina_corrida','Entre uma coisa e outra','Um treino curto no intervalo do dia já conta.'),
('treino_rapido','5 minutos que contam ⏱️','Treino rapidinho pronto no CK Life.'),
('treino_rapido','Rapidinho','Um treino de 10 minutos para hoje?'),
('treino_rapido','Treino express','Curto, completo e no seu ritmo.'),
('treino_rapido','Sem desculpa, com carinho','Tem treino de 5 minutos para os dias corridos.'),
('treino_rapido','Pouco ainda conta','5, 10 ou 15 minutos. Você escolhe.'),
('treino_rapido','Treino curto','Faz agora e o resto do dia fica mais leve.'),
('treino_rapido','Só 5 minutos','Polichinelo, agachamento, ponte. Pronto.'),
('treino_rapido','Rápido 💪','Treino curto também mantém sua sequência.'),
('treino_rapido','10 minutos por você','Dá para fazer na sala, no quarto, onde quiser.'),
('treino_rapido','Express ⏱️','Coloca um timer e vai.'),
('treino_rapido','Encaixa um treino','Tem um de 15 minutos perfeito para hoje.'),
('treino_rapido','Começa curtinho','Se quiser mais, continua. Se não, já valeu.'),
('noite','Boa noite, {primeiro_nome} 🌙','Ainda dá tempo de um treino leve, ou de descansar sem culpa.'),
('noite','Fim de dia','Se der, 10 minutinhos. Se não der, amanhã a gente continua.'),
('noite','Alongamento antes de dormir','Ajuda o corpo a relaxar e o sono a vir.'),
('noite','Boa noite 💚','Que tal deixar a roupa de treino separada para amanhã?'),
('noite','Hora de desacelerar','Respira fundo. Você fez o que pôde hoje.'),
('noite','Noite tranquila 🌙','Descansar bem também é cuidar do corpo.'),
('noite','Antes de dormir','Pensa em uma coisa boa que você fez por você hoje.'),
('noite','Boa noite','Amanhã é um novo dia. Seu plano estará pronto.'),
('noite','Noite 🌙','Desliga as telas um pouco antes de dormir. Seu corpo agradece.'),
('noite','Fechando o dia','Mesmo que hoje não tenha treinado, você é bem-vinda amanhã.'),
('noite','Relaxa 💚','5 minutos de alongamento e cama.'),
('noite','Boa noite, {primeiro_nome}','Orgulho de você por mais um dia.'),
('noite','Descansa 🌙','Recuperar bem é parte da constância.'),
('celebracao','Comemora! 🎉','Você está construindo algo lindo.'),
('celebracao','Vitória 💚','Cada treino é uma vitória sua. Celebra!'),
('celebracao','Que semana!','Olha quantas vezes você apareceu por você.'),
('celebracao','Orgulho 🎉','Da sua constância, {primeiro_nome}.'),
('celebracao','Celebra do seu jeito','Um banho demorado, uma música, um descanso. Você merece.'),
('celebracao','Marco 🏅','{quantidade_treinos} treinos no CK Life. Que história!'),
('celebracao','Isso merece festa 🎉','Você continuou escolhendo você.'),
('celebracao','Vitória registrada','Compartilha na comunidade para elas comemorarem junto.'),
('celebracao','Uau 💚','Seu progresso é real porque você é real.'),
('celebracao','Comemoração','Não importa o tamanho do passo. Importa que foi seu.'),
('celebracao','Brinde 🥂','Com água, claro. À sua constância!'),
('celebracao','Você merece','Reconhecer as próprias vitórias também é autocuidado.'),
('voltou','Olha quem voltou 💚','Que alegria ter você de volta, {primeiro_nome}.'),
('voltou','De volta!','Não importa quanto tempo passou. Importa que você voltou.'),
('voltou','Bem-vinda de novo','Seu plano está aqui. Sem compensar nada.'),
('voltou','Voltou 🎉','Isso se chama resiliência.'),
('voltou','Que bom te ver','Comece leve. O corpo lembra.'),
('voltou','Retorno 💚','Você prometeu voltar por você. E voltou.'),
('voltou','De volta ao ritmo','Um treino de 5 minutos para comemorar a volta?'),
('voltou','Você voltou','E isso vale mais que qualquer sequência.'),
('voltou','Saudade matada 💚','Bom demais ter você de novo por aqui.'),
('voltou','Recomeço','Hoje é dia 1 de novo. E tudo bem.'),
('voltou','Voltar é vitória','Comemora! Não é todo mundo que volta.'),
('voltou','Oi de novo!','A comunidade e a Coach estão felizes com a sua volta.'),
('faltou_voce','Amiga, faltou você lá 💚','A comunidade sentiu sua falta. Passa lá para ver as vitórias das meninas.'),
('faltou_voce','Saudade de você na comunidade','Tem mulheres compartilhando conquistas hoje. Vem comemorar junto.'),
('faltou_voce','Faltou você 💚','Seu comentário sempre faz diferença para alguém que está começando.'),
('faltou_voce','Oi, {primeiro_nome}','A Legião CK está ativa hoje. Que tal dar um oi?'),
('faltou_voce','A comunidade está aqui','Sem cobrança. Quando quiser, a gente te recebe de braços abertos.'),
('faltou_voce','Volta lá? 💚','Uma palavra boa sua pode mudar o dia de alguém hoje.'),
('faltou_voce','Sentimos sua falta','Passa na comunidade e veja quem precisou de um incentivo hoje.'),
('faltou_voce','Amiga, cadê você? 😄','Brincadeira. Mas a comunidade fica mais bonita com você.'),
('faltou_voce','Vitórias de hoje','Tem vitória nova na comunidade. Vem ver e comemorar.'),
('faltou_voce','Juntas é mais leve','Lembra que você não está sozinha. A comunidade está aqui.'),
('coach_comunidade','Bom dia, Legião CK 💚','Qual é o seu pequeno passo de hoje? Conta aqui nos comentários.'),
('coach_comunidade','Pergunta da Coach','O que você vai fazer por você hoje, mesmo que seja pouco?'),
('coach_comunidade','Lembrete para todas 💚','Não buscamos perfeição. Buscamos constância. Quem já treinou hoje?'),
('coach_comunidade','Bora, Legião?','Hoje vale treino de 5 minutos, caminhada ou alongamento. Qual vai ser o seu?'),
('coach_comunidade','Momento de celebrar 🎉','Conta uma vitória sua dessa semana. Pode ser pequena. Toda vitória conta.'),
('coach_comunidade','Para quem está recomeçando','Voltar também é progresso. Se você está voltando hoje, comenta um 💚 que a gente comemora junto.'),
('coach_comunidade','Pergunta do dia da Coach','Qual é a sua música favorita para treinar?'),
('coach_comunidade','Água em dia? 💧','Quantos copos você já bebeu hoje? Bora bater a meta juntas.'),
('coach_comunidade','Dica da Coach','Separar a roupa de treino na noite anterior ajuda muito. Quem testa amanhã?'),
('coach_comunidade','Sem comparação 💚','Cada uma tem o seu ritmo. Hoje, comente algo bom que você fez por você.'),
('coach_comunidade','Rotina corrida?','Qual horário funciona melhor para você treinar? Conta aqui.'),
('coach_comunidade','Constância','Quantos dias você treinou essa semana? Qualquer número vale.'),
('coach_comunidade','Receita da semana 🥗','Qual receita do CK Life você mais gostou até agora?'),
('coach_comunidade','Fim de semana ativo','Qual movimento você vai fazer no fim de semana? Caminhada, dança, treino?'),
('coach_comunidade','Incentivo coletivo 💚','Deixa um comentário de incentivo para quem está começando hoje.'),
('coach_comunidade','Segunda-feira, Legião!','Qual é a sua meta pequena para essa semana?'),
('coach_comunidade','Sexta chegou 🎉','Qual foi a melhor coisa que você fez por você nessa semana?'),
('coach_comunidade','Autocuidado','Além do treino, o que você faz para cuidar de você?'),
('coach_comunidade','Dia difícil?','Se hoje está pesado, comenta aqui. A comunidade te acolhe. 💚'),
('coach_comunidade','Gratidão','Pelo que você é grata hoje? Pode ser algo bem simples.')
on conflict (categoria, texto) do nothing;

-- ---------- 7) O motor: decide UM recado útil por aluna, respeitando limites ----------
create or replace function public._coach_tick(p_agora timestamptz default now(), p_limite int default 400) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  cfg coach_config; u record; r record;
  loc timestamp; hoje date; h int; dow int; ini int; fim int; maxd int;
  datas date[]; ult date; prev date; total int; ativos int; hpref int; st int; d date;
  dias int; htd int; treinou boolean; planejado boolean; ontem_plan boolean; idade int; pro boolean; temlemb boolean;
  hal int; enviados int; cat text; regra text; v jsonb; n int := 0; vistos int := 0; dsem text[] := array['SU','MO','TU','WE','TH','FR','SA'];
  rot text[] := array['bom_dia','motivacao','hidratacao','autoestima','treino_rapido','disciplina','alimentacao','humor','rotina_corrida','treino','preguica','bom_dia'];
begin
  select * into cfg from coach_config where id = 1;
  if cfg.id is null or not cfg.ligado or cfg.max_dia = 0 then return jsonb_build_object('ligado', false); end if;
  for u in
    select a.id, a.nome, a.criado, a.ultimo, a.dados, p.coach, p.treino pt, p.alimentacao pa, p.comunidade pc, p.conquistas pq,
      p.silencio_ini, p.silencio_fim, p.max_dia, coalesce(p.fuso, l.fuso, 'America/Cuiaba') fuso,
      l.dias ldias, l.hora lhora, (l.ativo and exists (select 1 from push_inscricoes s where s.user_id = a.id)) lemb_on
    from alunas a
    left join coach_prefs p on p.user_id = a.id
    left join lembretes l on l.user_id = a.id and l.tipo = 'treino'
    left join perfis pf on pf.user_id = a.id
    where not a.bloqueado and coalesce(pf.equipe, false) = false and coalesce(p.coach, true)
      and (a.ultimo is null or a.ultimo >= (p_agora at time zone 'America/Cuiaba')::date - 35 or a.criado >= (p_agora at time zone 'America/Cuiaba')::date - 35)
      and not exists (select 1 from coach_envios e where e.user_id = a.id and e.criado > p_agora - make_interval(hours => cfg.intervalo_h))
    order by (select max(e.criado) from coach_envios e where e.user_id = a.id) nulls first, a.id
    limit greatest(1, least(p_limite, 5000))
  loop
    vistos := vistos + 1;
    loc := p_agora at time zone u.fuso; hoje := loc::date; h := extract(hour from loc)::int; dow := extract(dow from loc)::int;
    ini := coalesce(u.silencio_ini, cfg.silencio_ini); fim := coalesce(u.silencio_fim, cfg.silencio_fim);
    if (ini > fim and (h >= ini or h < fim)) or (ini < fim and h >= ini and h < fim) then continue; end if;   -- horário de silêncio
    maxd := least(cfg.max_dia, coalesce(u.max_dia, cfg.max_dia));
    select (select count(*) from coach_envios e where e.user_id = u.id and (e.criado at time zone u.fuso)::date = hoje)
         + (select count(*) from lembretes_envios le where le.user_id = u.id and le.dia = hoje and le.status <> 'falhou') into enviados;
    if enviados >= maxd then continue; end if;
    -- resumo dos treinos (só datas e horas; nada de peso, ciclo ou saúde)
    select coalesce(array_agg(distinct (t ->> 'd')::date order by (t ->> 'd')::date), '{}'), count(*)
      into datas, total
      from jsonb_array_elements(case when jsonb_typeof(u.dados -> 'treinos') = 'array' then u.dados -> 'treinos' else '[]'::jsonb end) t
      where (t ->> 'd') ~ '^\d{4}-\d{2}-\d{2}$' and (t ->> 'd')::date <= hoje;
    select mode() within group (order by (t ->> 'h')::int) into hpref
      from jsonb_array_elements(case when jsonb_typeof(u.dados -> 'treinos') = 'array' then u.dados -> 'treinos' else '[]'::jsonb end) t
      where (t ->> 'h') ~ '^\d{1,2}$' and (t ->> 'h')::int between 5 and 22;
    if total < 3 then hpref := null; end if;
    select max((t ->> 'h')::int) into htd
      from jsonb_array_elements(case when jsonb_typeof(u.dados -> 'treinos') = 'array' then u.dados -> 'treinos' else '[]'::jsonb end) t
      where (t ->> 'd') = to_char(hoje, 'YYYY-MM-DD') and (t ->> 'h') ~ '^\d{1,2}$';
    ativos := coalesce(array_length(datas, 1), 0);
    ult := case when ativos > 0 then datas[ativos] end;
    treinou := coalesce(ult = hoje, false);
    prev := (select max(x) from unnest(datas) x where x < hoje);
    dias := case when ult is null then null else hoje - ult end;
    st := 0; d := case when treinou then hoje else hoje - 1 end;
    while d = any(datas) loop st := st + 1; d := d - 1; end loop;
    idade := hoje - u.criado;
    planejado := u.ldias is null or dsem[dow + 1] = any(u.ldias);
    ontem_plan := u.ldias is not null and dsem[((dow + 6) % 7) + 1] = any(u.ldias);
    temlemb := coalesce(u.lemb_on, false);
    hal := coalesce(hpref, extract(hour from u.lhora)::int, 18);
    pro := coalesce((_plano(u.id) ->> 'pro')::boolean, false);
    cat := null; regra := null;
    for r in select id from coach_regras where ativo order by prioridade loop
      cat := case r.id
        when 'voltou' then case when treinou and h >= coalesce(htd + 1, 7) and prev is not null and hoje - prev >= 8
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'voltou' and (e.criado at time zone u.fuso)::date = hoje) then 'voltou' end
        when 'pos_treino' then case when treinou and h >= coalesce(htd + 1, 7)
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra in ('pos_treino','voltou') and (e.criado at time zone u.fuso)::date = hoje)
          then case when total in (10,25,50,100,150,200,300,365,500) then 'celebracao' when st in (3,5,7,10,14,21,30,45,60,90,100,150,200,365) then 'streak' else 'pos_treino' end end
        when 'ausencia_7d' then case when dias between 7 and 30 and h between hal and hal + 2
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'ausencia_7d' and e.criado > p_agora - interval '7 days') then 'ausencia_7d' end
        when 'ausencia_5d' then case when dias in (5, 6) and h between hal and hal + 2
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'ausencia_5d' and (e.criado at time zone u.fuso)::date > ult) then 'ausencia_5d' end
        when 'ausencia_3d' then case when dias in (3, 4) and h between hal and hal + 2
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'ausencia_3d' and (e.criado at time zone u.fuso)::date > ult) then 'ausencia_3d' end
        when 'ausencia_48h' then case when dias = 2 and h between hal and hal + 2
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'ausencia_48h' and (e.criado at time zone u.fuso)::date > ult) then 'ausencia_48h' end
        when 'ausencia_24h' then case when dias = 1 and ontem_plan and h between hal and hal + 2
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'ausencia_24h' and (e.criado at time zone u.fuso)::date > ult) then 'ausencia_24h' end
        when 'primeiro_mes' then case when idade = 30 and h between 10 and 12
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'primeiro_mes') then 'primeiro_mes' end
        when 'primeira_semana' then case when idade between 0 and 7 and not treinou and h between 10 and 12
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'primeira_semana' and e.criado > p_agora - interval '40 hours') then 'primeira_semana' end
        when 'pre_treino' then case when planejado and not treinou and not temlemb and hpref is not null and h = hpref - 1 and coalesce(dias, 0) < 3 then 'pre_treino' end
        when 'bom_dia' then case when h between fim and fim + 1 and enviados = 0 and coalesce(dias, 0) < 3
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'bom_dia' and e.criado > p_agora - interval '40 hours')
          then case dow when 1 then 'segunda' when 5 then 'sexta' when 0 then 'fim_de_semana' when 6 then 'fim_de_semana' else rot[1 + (extract(doy from hoje)::int % array_length(rot, 1))] end end
        when 'noite' then case when h = 20 and planejado and not treinou and enviados = 0 and coalesce(dias, 0) < 3 and ult is not null then 'noite' end
        when 'faltou_voce' then case when h between 18 and 19 and u.ultimo is not null and hoje - u.ultimo between 4 and 14
          and (exists (select 1 from posts po where po.user_id = u.id and po.criado > p_agora - interval '60 days') or exists (select 1 from comentarios co where co.user_id = u.id and co.criado > p_agora - interval '60 days'))
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'faltou_voce' and e.criado > p_agora - interval '10 days') then 'faltou_voce' end
        when 'comunidade' then case when dow = 3 and h between 12 and 13
          and not exists (select 1 from coach_envios e where e.user_id = u.id and e.regra = 'comunidade' and e.criado > p_agora - interval '6 days') then 'comunidade' end
      end;
      -- respeita a preferência da categoria (desligou = não manda nada daquele tipo)
      if cat is not null and (
          (_coach_grupo(cat) = 'treino' and not coalesce(u.pt, true)) or (_coach_grupo(cat) = 'alimentacao' and not coalesce(u.pa, true))
       or (_coach_grupo(cat) = 'comunidade' and not coalesce(u.pc, true)) or (_coach_grupo(cat) = 'conquistas' and not coalesce(u.pq, true))) then
        if cat = 'alimentacao' or cat = 'hidratacao' then cat := 'bom_dia'; else cat := null; end if;
      end if;
      if cat is not null then regra := r.id; exit; end if;
    end loop;
    if cat is null then continue; end if;
    v := jsonb_build_object('primeiro_nome', split_part(trim(coalesce(u.nome, u.dados ->> 'nome', '')), ' ', 1), 'streak', st, 'quantidade_treinos', total,
      'horario_treino', coalesce(to_char(u.lhora, 'HH24:MI'), case when hpref is not null then hpref || 'h' end), 'dias_ativos', ativos,
      'ultima_atividade', to_char(ult, 'DD/MM'), 'tempo_disponivel', coalesce(u.dados -> 'perfil' ->> 'tempo', '15'),
      'objetivo', case u.dados -> 'perfil' ->> 'objetivo' when 'emagrecer' then 'ter mais disposição' when 'definir' then 'definir' when 'massa' then 'ganhar força'
        when 'condicionamento' then 'ter mais fôlego' when 'mobilidade' then 'ter mais mobilidade' else 'seu objetivo' end);
    if _coach_envia(u.id, cat, regra, v, pro, p_agora) is not null then n := n + 1; end if;
  end loop;
  delete from coach_envios where criado < p_agora - interval '180 days';
  return jsonb_build_object('ligado', true, 'vistas', vistos, 'enviados', n);
end $$;
revoke all on function public._coach_tick(timestamptz, int) from public, anon, authenticated;
create or replace function public.coach_tick() returns jsonb
language sql security definer set search_path = public as $$ select public._coach_tick(now(), 400) $$;
revoke all on function public.coach_tick() from public, anon, authenticated;

do $$ begin
  begin create extension if not exists pg_cron; exception when others then raise notice 'pg_cron indisponível'; end;
  begin perform cron.unschedule('ck-coach-tick'); exception when others then null; end;
  begin perform cron.schedule('ck-coach-tick', '*/10 * * * *', 'select public.coach_tick()'); exception when others then raise notice 'Agendador não ativado: ative o Cron em Integrations e rode este arquivo de novo'; end;
end $$;

-- ---------- 8) App da aluna ----------
-- recados da Coach (só os dela)
create or replace function public.coach_inbox() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'titulo', titulo, 'texto', texto, 'categoria', categoria, 'criado', criado, 'aberto', aberto) order by criado desc), '[]')
  from (select * from coach_envios where user_id = auth.uid() order by criado desc limit 40) x
$$;
revoke all on function public.coach_inbox() from public, anon;
grant execute on function public.coach_inbox() to authenticated;
-- abriu o recado (pelo aviso no celular ou pela lista)
create or replace function public.coach_abriu(p_id bigint) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_id is null then
    update coach_envios set aberto = now() where user_id = auth.uid() and aberto is null;
  else
    update coach_envios set aberto = now() where id = p_id and user_id = auth.uid() and aberto is null;
  end if;
  return found;
end $$;
revoke all on function public.coach_abriu(bigint) from public, anon;
grant execute on function public.coach_abriu(bigint) to authenticated;

-- ---------- 9) Painel: Engajamento & Coach ----------
create or replace function public._coach_treinou_apos(p_uid uuid, p_quando timestamptz, p_dias int) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from alunas a, jsonb_array_elements(case when jsonb_typeof(a.dados -> 'treinos') = 'array' then a.dados -> 'treinos' else '[]'::jsonb end) t
    where a.id = p_uid and (t ->> 'd') ~ '^\d{4}-\d{2}-\d{2}$'
      and (t ->> 'd')::date between (p_quando at time zone 'America/Cuiaba')::date and (p_quando at time zone 'America/Cuiaba')::date + p_dias)
$$;
revoke all on function public._coach_treinou_apos(uuid, timestamptz, int) from public, anon, authenticated;

create or replace function public.admin_coach_resumo() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare hoje date := (now() at time zone 'America/Cuiaba')::date; res jsonb;
begin
  if not admin_ve('notificacoes') then return null; end if;
  with eq as (select user_id from perfis where coalesce(equipe, false)),
  ac as (select * from acessos where user_id not in (select user_id from eq)),
  al as (select * from alunas where id not in (select user_id from eq)),
  env as (select * from coach_envios where criado > now() - interval '30 days')
  select jsonb_build_object(
    'dau', (select count(distinct user_id) from ac where dia = hoje),
    'wau', (select count(distinct user_id) from ac where dia > hoje - 7),
    'mau', (select count(distinct user_id) from ac where dia > hoje - 30),
    'total', (select count(*) from al),
    'novas7', (select count(*) from al where criado > hoje - 7),
    'd1', (select jsonb_build_object('base', count(*), 'ok', count(*) filter (where exists (select 1 from ac where ac.user_id = al.id and ac.dia = al.criado + 1))) from al where criado between hoje - 60 and hoje - 2),
    'd7', (select jsonb_build_object('base', count(*), 'ok', count(*) filter (where exists (select 1 from ac where ac.user_id = al.id and ac.dia between al.criado + 6 and al.criado + 8))) from al where criado between hoje - 90 and hoje - 9),
    'd30', (select jsonb_build_object('base', count(*), 'ok', count(*) filter (where exists (select 1 from ac where ac.user_id = al.id and ac.dia between al.criado + 28 and al.criado + 32))) from al where criado between hoje - 150 and hoje - 33),
    'envios', (select count(*) from env),
    'push', (select count(*) from env where canal = 'push'),
    'push_ok', (select count(*) from env where push_status = 'enviado'),
    'abertos', (select count(*) from env where aberto is not null),
    'treinos_apos', (select count(*) from env where _coach_treinou_apos(user_id, criado, 1)),
    'recuperadas', (select count(distinct user_id) from env where regra like 'ausencia%' and _coach_treinou_apos(user_id, criado, 3)),
    'optout', (select count(*) from coach_prefs where not coach),
    'optout_grupos', (select jsonb_build_object('treino', count(*) filter (where not treino), 'alimentacao', count(*) filter (where not alimentacao), 'comunidade', count(*) filter (where not comunidade), 'conquistas', count(*) filter (where not conquistas)) from coach_prefs),
    'inativas', (select jsonb_build_object('d3', count(*) filter (where hoje - ultimo between 3 and 6), 'd7', count(*) filter (where hoje - ultimo between 7 and 13),
        'd14', count(*) filter (where hoje - ultimo between 14 and 29), 'd30', count(*) filter (where hoje - ultimo >= 30)) from al where not bloqueado and ultimo is not null),
    'por_categoria', (select coalesce(jsonb_agg(jsonb_build_object('categoria', categoria, 'envios', n, 'abertos', ab) order by n desc), '[]')
        from (select categoria, count(*) n, count(aberto) ab from env group by categoria) x),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('dia', dia, 'envios', n, 'abertos', ab) order by dia), '[]')
        from (select (criado at time zone 'America/Cuiaba')::date dia, count(*) n, count(aberto) ab from env where criado > now() - interval '14 days' group by 1) x),
    'config', (select to_jsonb(c) from coach_config c where id = 1),
    'regras', (select coalesce(jsonb_agg(to_jsonb(r) order by prioridade), '[]') from coach_regras r),
    'mensagens', (select count(*) from coach_mensagens where ativo)
  ) into res;
  return res;
end $$;
revoke all on function public.admin_coach_resumo() from public, anon;
grant execute on function public.admin_coach_resumo() to authenticated;

create or replace function public.admin_coach_mensagens() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('notificacoes') then return null; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'categoria', m.categoria, 'titulo', m.titulo, 'texto', m.texto, 'tom', m.tom, 'prioridade', m.prioridade,
      'plano', m.plano, 'ativo', m.ativo, 'uso', coalesce(s.n, 0), 'abertos', coalesce(s.ab, 0), 'treinou', coalesce(s.tr, 0), 'ultimo', s.ult) order by m.categoria, m.id), '[]')
    from coach_mensagens m
    left join (select msg_id, count(*) n, count(aberto) ab, max(criado) ult,
        count(*) filter (where criado > now() - interval '30 days' and _coach_treinou_apos(user_id, criado, 1)) tr
      from coach_envios group by msg_id) s on s.msg_id = m.id);
end $$;
revoke all on function public.admin_coach_mensagens() from public, anon;
grant execute on function public.admin_coach_mensagens() to authenticated;

-- palavras que nunca entram num recado da Coach (culpa, vergonha, corpo, promessa)
create or replace function public._coach_texto_ok(p text) returns boolean
language sql immutable as $$
  select not (lower(coalesce(p, '')) ~ '(gorda|gordinha|baleia|feia|vergonha|fracassad|preguiçosa|preguicosa|desist[ie]u de você|culpada|vai engordar|emagre[cç]a já|perca \d+ ?kg|garantid|resultado garantido|antes e depois|corpo perfeito|barriga negativa|secar a barriga)')
$$;

create or replace function public.admin_coach_msg_salvar(p_id int, p_categoria text, p_titulo text, p_texto text, p_tom text, p_prioridade int, p_plano text, p_ativo boolean) returns int
language plpgsql security definer set search_path = public as $$
declare nid int;
begin
  if not admin_pode('notificacoes') then raise exception 'sem permissão'; end if;
  if not _coach_texto_ok(p_titulo) or not _coach_texto_ok(p_texto) then raise exception 'O texto tem palavra proibida (culpa, vergonha, corpo ou promessa de resultado)'; end if;
  if coalesce(trim(p_categoria), '') !~ '^[a-z0-9_]{2,30}$' then raise exception 'Categoria inválida'; end if;
  if p_id is null then
    insert into coach_mensagens (categoria, titulo, texto, tom, prioridade, plano, ativo)
      values (p_categoria, trim(p_titulo), trim(p_texto), coalesce(nullif(trim(p_tom), ''), 'acolhedor'), coalesce(p_prioridade, 5), coalesce(p_plano, 'todos'), coalesce(p_ativo, true))
      returning id into nid;
  else
    update coach_mensagens set categoria = p_categoria, titulo = trim(p_titulo), texto = trim(p_texto), tom = coalesce(nullif(trim(p_tom), ''), tom),
      prioridade = coalesce(p_prioridade, prioridade), plano = coalesce(p_plano, plano), ativo = coalesce(p_ativo, ativo), atualizado = now()
      where id = p_id returning id into nid;
  end if;
  begin perform auditar('coach_mensagem', 'coach', nid::text, 'ok', case when p_id is null then 'criada' else 'editada' end); exception when others then null; end;
  return nid;
end $$;
revoke all on function public.admin_coach_msg_salvar(int, text, text, text, text, int, text, boolean) from public, anon;
grant execute on function public.admin_coach_msg_salvar(int, text, text, text, text, int, text, boolean) to authenticated;

create or replace function public.admin_coach_msg_ativo(p_id int, p_ativo boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('notificacoes') then raise exception 'sem permissão'; end if;
  update coach_mensagens set ativo = p_ativo, atualizado = now() where id = p_id;
  begin perform auditar('coach_mensagem', 'coach', p_id::text, 'ok', case when p_ativo then 'ligada' else 'desligada' end); exception when others then null; end;
  return found;
end $$;
revoke all on function public.admin_coach_msg_ativo(int, boolean) from public, anon;
grant execute on function public.admin_coach_msg_ativo(int, boolean) to authenticated;

create or replace function public.admin_coach_regra(p_id text, p_ativo boolean, p_prioridade int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('notificacoes') then raise exception 'sem permissão'; end if;
  update coach_regras set ativo = coalesce(p_ativo, ativo), prioridade = coalesce(greatest(1, least(p_prioridade, 999)), prioridade), atualizado = now() where id = p_id;
  begin perform auditar('coach_regra', 'coach', p_id, 'ok', case when p_ativo then 'ligada' when not p_ativo then 'desligada' else 'prioridade' end); exception when others then null; end;
  return found;
end $$;
revoke all on function public.admin_coach_regra(text, boolean, int) from public, anon;
grant execute on function public.admin_coach_regra(text, boolean, int) to authenticated;

create or replace function public.admin_coach_config(p_ligado boolean, p_max int, p_intervalo int, p_ini int, p_fim int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('notificacoes') then raise exception 'sem permissão'; end if;
  update coach_config set ligado = coalesce(p_ligado, ligado), max_dia = coalesce(greatest(0, least(p_max, 5)), max_dia),
    intervalo_h = coalesce(greatest(1, least(p_intervalo, 24)), intervalo_h), silencio_ini = coalesce(greatest(0, least(p_ini, 23)), silencio_ini),
    silencio_fim = coalesce(greatest(0, least(p_fim, 23)), silencio_fim), atualizado = now() where id = 1;
  begin perform auditar('coach_config', 'coach', '1', 'ok', case when p_ligado then 'ligado' when not p_ligado then 'desligado' else 'ajuste' end); exception when others then null; end;
  return true;
end $$;
revoke all on function public.admin_coach_config(boolean, int, int, int, int) from public, anon;
grant execute on function public.admin_coach_config(boolean, int, int, int, int) to authenticated;

-- manda um recado de teste só para a própria admin (para ver como chega no celular)
create or replace function public.admin_coach_testar(p_msg int) returns bigint
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if not admin_pode('notificacoes') then raise exception 'sem permissão'; end if;
  select nome into nm from alunas where id = auth.uid();
  return _coach_envia(auth.uid(), null, 'teste', jsonb_build_object('primeiro_nome', split_part(coalesce(nm, ''), ' ', 1), 'streak', 3, 'quantidade_treinos', 12, 'horario_treino', '19:00',
    'dias_ativos', 9, 'tempo_disponivel', '15', 'objetivo', 'seu objetivo'), false, now(), p_msg);
end $$;
revoke all on function public.admin_coach_testar(int) from public, anon;
grant execute on function public.admin_coach_testar(int) to authenticated;

select 'Coach CK Life pronta' as status, (select count(*) from public.coach_mensagens) as mensagens;

-- ---------- 10) Coach CK Life na comunidade (Etapa 5) ----------
-- Um perfil oficial "Coach CK Life" (virtual, com selo da equipe, sem login) publica 1 post por dia para todas,
-- puxando conversa e comemorando. Na segunda, se houver dado suficiente, conta quantas mulheres compartilharam
-- vitórias na semana anterior (número real; com menos de 5, usa uma frase sem número). Nunca responde ninguém.
alter table public.coach_config add column if not exists perfil uuid;
alter table public.coach_config add column if not exists posts_comunidade boolean not null default true;
alter table public.coach_config add column if not exists hora_post int not null default 9 check (hora_post between 6 and 21);

create or replace function public._coach_perfil() returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid; cols text[];
begin
  select perfil into uid from coach_config where id = 1;
  if uid is not null and exists (select 1 from perfis where user_id = uid) then return uid; end if;
  select user_id into uid from perfis where username = 'coach.cklife';
  if uid is null then
    uid := gen_random_uuid();
    select array_agg(column_name::text) into cols from information_schema.columns where table_schema = 'auth' and table_name = 'users';
    if 'encrypted_password' = any(cols) then   -- conta real, sem senha válida e bloqueada (não entra no app nem no painel)
      execute format($f$insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, banned_until,
        confirmation_token, recovery_token, email_change_token_new, email_change)
        values ('00000000-0000-0000-0000-000000000000', %L, 'authenticated', 'authenticated', 'coach@equipe.cklife.app', %L, now(), '{"provider":"email","providers":["email"],"equipe":true}', '{"equipe":true}', now(), now(), '2999-12-31', '', '', '', '')$f$,
        uid, 'sem-login-' || md5(random()::text));
    else
      insert into auth.users (id, email) values (uid, 'coach@equipe.cklife.app');   -- banco de testes
    end if;
    perform set_config('ck.sistema', '1', true);
    insert into perfis (user_id, username, nome, bio, privado, equipe, foto_mini)
      values (uid, 'coach.cklife', 'Coach CK Life', 'Sou a coach virtual do CK Life (não sou uma pessoa). Passo aqui todo dia para puxar conversa e comemorar com vocês 💚', false, true, 'img/modelo.jpg');
    perform set_config('ck.sistema', '0', true);
  end if;
  update coach_config set perfil = uid where id = 1;
  return uid;
end $$;
revoke all on function public._coach_perfil() from public, anon, authenticated;
select public._coach_perfil();

create or replace function public._coach_post_comunidade(p_agora timestamptz default now()) returns uuid
language plpgsql security definer set search_path = public as $$
declare cfg coach_config; uid uuid; loc timestamp; hoje date; m coach_mensagens; txt text; n int; pid uuid;
begin
  select * into cfg from coach_config where id = 1;
  if cfg.id is null or not cfg.ligado or not cfg.posts_comunidade then return null; end if;
  loc := p_agora at time zone 'America/Cuiaba'; hoje := loc::date;
  if extract(hour from loc) < cfg.hora_post or extract(hour from loc) > 21 then return null; end if;
  uid := _coach_perfil();
  if exists (select 1 from posts where user_id = uid and (criado at time zone 'America/Cuiaba')::date = hoje) then return null; end if;
  if extract(dow from loc) = 1 then
    select count(distinct po.user_id) into n from posts po left join perfis pf on pf.user_id = po.user_id
      where po.conquista is not null and not po.oculto and coalesce(pf.equipe, false) = false
        and (po.criado at time zone 'America/Cuiaba')::date between hoje - 7 and hoje - 1;
    if n >= 5 then txt := 'Na semana passada, ' || n || ' mulheres compartilharam vitórias por aqui. 💚 Qual foi a sua? Conta nos comentários.'; end if;
  end if;
  if txt is null then
    select * into m from coach_mensagens c where c.categoria = 'coach_comunidade' and c.ativo
      and c.texto not in (select coalesce(split_part(p.texto, E'\n', 2), '') from posts p where p.user_id = uid and p.criado > p_agora - interval '25 days')
      order by random() * c.prioridade desc limit 1;
    if m.id is null then select * into m from coach_mensagens c where c.categoria = 'coach_comunidade' and c.ativo order by random() limit 1; end if;
    if m.id is null then return null; end if;
    txt := m.titulo || E'\n' || m.texto;
  end if;
  insert into posts (user_id, nome, foto, texto, criado) values (uid, 'Coach CK Life', 'img/modelo.jpg', left(txt, 1000), p_agora) returning id into pid;
  return pid;
end $$;
revoke all on function public._coach_post_comunidade(timestamptz) from public, anon, authenticated;

-- o relógio da Coach agora também faz o post do dia na comunidade
create or replace function public.coach_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  r := public._coach_tick(now(), 400);
  begin perform public._coach_post_comunidade(now()); exception when others then null; end;
  return r;
end $$;
revoke all on function public.coach_tick() from public, anon, authenticated;

create or replace function public.admin_coach_comunidade(p_ligado boolean, p_hora int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not admin_pode('notificacoes') then raise exception 'sem permissão'; end if;
  update coach_config set posts_comunidade = coalesce(p_ligado, posts_comunidade), hora_post = coalesce(greatest(6, least(p_hora, 21)), hora_post), atualizado = now() where id = 1;
  begin perform auditar('coach_comunidade', 'coach', '1', 'ok', case when p_ligado then 'ligado' when not p_ligado then 'desligado' else 'horário' end); exception when others then null; end;
  return true;
end $$;
revoke all on function public.admin_coach_comunidade(boolean, int) from public, anon;
grant execute on function public.admin_coach_comunidade(boolean, int) to authenticated;

-- ---------- 12) Time de Incentivo: nunca comenta nem reage em post ou Story oficial (Coach) ----------
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
      and not exists (select 1 from perfis pf where pf.user_id = po.user_id and pf.equipe)   -- nunca em post oficial (Coach)
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
      and not exists (select 1 from perfis pf where pf.user_id = st.user_id and pf.equipe)
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

-- ---------- 11) Parceira CK (opcional) ----------
-- Duas amigas que se seguem combinam de se apoiar. Cada uma vê da outra só QUANTOS DIAS treinou na semana
-- (nada de peso, ciclo, saúde, treino detalhado ou horário). Dá para mandar 1 incentivo por dia (frases prontas,
-- sempre positivas). Qualquer uma encerra quando quiser. Pode rodar mais de uma vez.
create table if not exists public.parceiras (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users(id) on delete cascade,   -- quem convidou
  b uuid not null references auth.users(id) on delete cascade,   -- quem foi convidada
  status text not null default 'pendente' check (status in ('pendente','ativa','encerrada')),
  criado timestamptz not null default now(),
  aceito timestamptz,
  encerrado timestamptz,
  check (a <> b)
);
create unique index if not exists parceiras_par_vivo on public.parceiras (least(a, b), greatest(a, b)) where status in ('pendente','ativa');
create index if not exists parceiras_a on public.parceiras (a) where status in ('pendente','ativa');
create index if not exists parceiras_b on public.parceiras (b) where status in ('pendente','ativa');
alter table public.parceiras enable row level security;
drop policy if exists pc_ler on public.parceiras;
create policy pc_ler on public.parceiras for select to authenticated using (auth.uid() in (a, b));
create table if not exists public.parceiras_incentivos (
  parceria uuid not null references public.parceiras(id) on delete cascade,
  de uuid not null,
  dia date not null,
  frase int not null,
  criado timestamptz not null default now(),
  primary key (parceria, de, dia)
);
alter table public.parceiras_incentivos enable row level security;
drop policy if exists pci_ler on public.parceiras_incentivos;
create policy pci_ler on public.parceiras_incentivos for select to authenticated using (de = auth.uid());

create or replace function public._parceira_frase(p int) returns text
language sql immutable as $$
  select (array['Bora treinar hoje? Tô contigo 💚', 'Orgulho de você! Continua 💪', 'Pouco ainda conta. 5 minutinhos? 💚', 'Sentindo sua falta no treino. Bora juntas?',
    'Você consegue! Tô torcendo por você ✨', 'Hoje é dia de cuidar de você 💚'])[greatest(1, least(p, 6))]
$$;
-- dias com treino na semana atual (segunda a domingo), só a contagem
create or replace function public._dias_semana(p_uid uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(distinct (t ->> 'd'))::int from alunas a,
    jsonb_array_elements(case when jsonb_typeof(a.dados -> 'treinos') = 'array' then a.dados -> 'treinos' else '[]'::jsonb end) t
  where a.id = p_uid and (t ->> 'd') ~ '^\d{4}-\d{2}-\d{2}$'
    and (t ->> 'd')::date between date_trunc('week', (now() at time zone 'America/Cuiaba'))::date and (now() at time zone 'America/Cuiaba')::date
$$;
revoke all on function public._dias_semana(uuid) from public, anon, authenticated;

create or replace function public.parceira_convidar(p_user uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); nid uuid;
begin
  if eu is null or p_user is null or p_user = eu then raise exception 'convite inválido'; end if;
  if exists (select 1 from perfis where user_id = p_user and equipe) then raise exception 'convite inválido'; end if;
  if bloqueio_entre(eu, p_user) then raise exception 'convite inválido'; end if;
  if not (exists (select 1 from seguidores where seguidor = eu and seguido = p_user and status = 'ativo')
      and exists (select 1 from seguidores where seguidor = p_user and seguido = eu and status = 'ativo')) then
    raise exception 'Vocês precisam se seguir para virar parceiras'; end if;
  if exists (select 1 from parceiras where status = 'ativa' and (eu in (a, b) or p_user in (a, b))) then raise exception 'Uma de vocês já tem uma Parceira CK'; end if;
  if exists (select 1 from parceiras where status = 'pendente' and a = eu) then raise exception 'Você já tem um convite esperando resposta'; end if;
  insert into parceiras (a, b) values (eu, p_user) returning id into nid;
  perform notificar(p_user, eu, 'sistema', 'parceira:' || nid, 'quer ser sua Parceira CK 💚 Abra Perfil › Parceira CK para responder.');
  return nid;
end $$;
revoke all on function public.parceira_convidar(uuid) from public, anon;
grant execute on function public.parceira_convidar(uuid) to authenticated;

create or replace function public.parceira_responder(p_id uuid, p_aceita boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare pc parceiras;
begin
  select * into pc from parceiras where id = p_id and b = auth.uid() and status = 'pendente';
  if pc.id is null then return false; end if;
  if p_aceita then
    if exists (select 1 from parceiras where status = 'ativa' and (pc.a in (a, b) or pc.b in (a, b))) then raise exception 'Uma de vocês já tem uma Parceira CK'; end if;
    update parceiras set status = 'ativa', aceito = now() where id = p_id;
    update parceiras set status = 'encerrada', encerrado = now() where status = 'pendente' and id <> p_id and (pc.a in (a, b) or pc.b in (a, b));
    perform notificar(pc.a, pc.b, 'sistema', 'parceira:' || p_id, 'aceitou ser sua Parceira CK 💚 Agora vocês se apoiam na semana.');
  else
    update parceiras set status = 'encerrada', encerrado = now() where id = p_id;   -- recusa silenciosa (sem aviso para não constranger)
  end if;
  return true;
end $$;
revoke all on function public.parceira_responder(uuid, boolean) from public, anon;
grant execute on function public.parceira_responder(uuid, boolean) to authenticated;

create or replace function public.parceira_encerrar(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update parceiras set status = 'encerrada', encerrado = now() where id = p_id and auth.uid() in (a, b) and status in ('pendente','ativa');
  return found;
end $$;
revoke all on function public.parceira_encerrar(uuid) from public, anon;
grant execute on function public.parceira_encerrar(uuid) to authenticated;

create or replace function public.parceira_status() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare eu uuid := auth.uid(); pc parceiras; outro uuid; pf perfis; res jsonb;
begin
  if eu is null then return null; end if;
  select * into pc from parceiras where status = 'ativa' and eu in (a, b) limit 1;
  if pc.id is not null then
    outro := case when pc.a = eu then pc.b else pc.a end; select * into pf from perfis where user_id = outro;
    return jsonb_build_object('id', pc.id, 'status', 'ativa', 'desde', pc.aceito, 'outra', jsonb_build_object('user_id', outro, 'nome', pf.nome, 'username', pf.username, 'foto', pf.foto_mini),
      'semana_ela', _dias_semana(outro), 'semana_eu', _dias_semana(eu),
      'incentivo_hoje', exists (select 1 from parceiras_incentivos i where i.parceria = pc.id and i.de = eu and i.dia = (now() at time zone 'America/Cuiaba')::date));
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'de', jsonb_build_object('user_id', p.a, 'nome', f.nome, 'username', f.username, 'foto', f.foto_mini))), '[]') into res
    from parceiras p left join perfis f on f.user_id = p.a where p.b = eu and p.status = 'pendente';
  return jsonb_build_object('status', 'nenhuma', 'convites', res,
    'enviado', (select jsonb_build_object('id', p.id, 'para', jsonb_build_object('user_id', p.b, 'nome', f.nome, 'username', f.username, 'foto', f.foto_mini))
      from parceiras p left join perfis f on f.user_id = p.b where p.a = eu and p.status = 'pendente' limit 1));
end $$;
revoke all on function public.parceira_status() from public, anon;
grant execute on function public.parceira_status() to authenticated;

-- amigas que podem ser convidadas (seguem uma à outra)
create or replace function public.parceira_amigas() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('user_id', f.user_id, 'nome', f.nome, 'username', f.username, 'foto', f.foto_mini) order by f.nome), '[]')
  from seguidores s1 join seguidores s2 on s2.seguidor = s1.seguido and s2.seguido = s1.seguidor and s2.status = 'ativo'
  join perfis f on f.user_id = s1.seguido
  where s1.seguidor = auth.uid() and s1.status = 'ativo' and not coalesce(f.equipe, false) and not bloqueio_entre(auth.uid(), f.user_id)
$$;
revoke all on function public.parceira_amigas() from public, anon;
grant execute on function public.parceira_amigas() to authenticated;

create or replace function public.parceira_incentivar(p_frase int) returns boolean
language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); pc parceiras; outro uuid;
begin
  select * into pc from parceiras where status = 'ativa' and eu in (a, b) limit 1;
  if pc.id is null then raise exception 'Você não tem uma Parceira CK agora'; end if;
  outro := case when pc.a = eu then pc.b else pc.a end;
  insert into parceiras_incentivos (parceria, de, dia, frase) values (pc.id, eu, (now() at time zone 'America/Cuiaba')::date, greatest(1, least(p_frase, 6)))
    on conflict do nothing;
  if not found then raise exception 'Você já mandou um incentivo hoje 💚'; end if;
  perform notificar(outro, eu, 'sistema', 'parceira:' || pc.id, _parceira_frase(p_frase));
  return true;
end $$;
revoke all on function public.parceira_incentivar(int) from public, anon;
grant execute on function public.parceira_incentivar(int) to authenticated;

select 'Etapa 5 pronta' as status;
