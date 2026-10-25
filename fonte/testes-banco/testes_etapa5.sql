-- Etapa 5: Coach na comunidade, "Amiga, faltou você" e Parceira CK
\set F1 '''f0000000-0000-0000-0000-000000000001'''
\set P1 '''f0000000-0000-0000-0000-0000000000a1'''
\set P2 '''f0000000-0000-0000-0000-0000000000a2'''
\set P3 '''f0000000-0000-0000-0000-0000000000a3'''
reset role;
update coach_config set ligado = true, posts_comunidade = true, hora_post = 9, max_dia = 2, intervalo_h = 3 where id = 1;
select ok((select perfil from coach_config) is not null, 'perfil da Coach criado');
select ok((select equipe and nome = 'Coach CK Life' from perfis where user_id = (select perfil from coach_config)), 'Coach tem selo oficial e nome certo');
select ok((select count(*) from alunas where id = (select perfil from coach_config)) = 0, 'Coach não conta como aluna');
-- post do dia: 10h de uma terça em Cuiabá
select ok(_coach_post_comunidade('2026-11-10 14:00:00+00') is not null, 'Coach publica o post do dia');
select ok(_coach_post_comunidade('2026-11-10 15:00:00+00') is null, 'só 1 post por dia');
select ok(_coach_post_comunidade('2026-11-11 10:00:00+00') is null, 'antes do horário (6h): não publica');
update coach_config set posts_comunidade = false where id = 1;
select ok(_coach_post_comunidade('2026-11-12 14:00:00+00') is null, 'desligado no painel: não publica');
update coach_config set posts_comunidade = true where id = 1;
select ok((select texto from posts where user_id = (select perfil from coach_config) order by criado limit 1) !~ '\{', 'post da Coach sem variável sobrando');
-- segunda-feira com vitórias reais na semana anterior: conta de verdade (5 alunas)
insert into auth.users select ('f1000000-0000-0000-0000-00000000000' || g)::uuid, 'v' || g || '@t' from generate_series(1, 6) g on conflict do nothing;
insert into posts (user_id, nome, texto, conquista, criado) select ('f1000000-0000-0000-0000-00000000000' || g)::uuid, 'Vitória ' || g, 'Treino feito!', '{"emoji":"💪"}', '2026-11-12 15:00:00+00' from generate_series(1, 5) g;
select _coach_post_comunidade('2026-11-16 14:00:00+00');
select ok((select texto from posts where user_id = (select perfil from coach_config) order by criado desc limit 1) like '%5 mulheres compartilharam vitórias%', 'segunda: número real de vitórias da semana');
-- equipe nunca comenta no post oficial
update equipe_config set hora_ini = 0, hora_fim = 24, ligado = true where id = 1;
insert into posts (id, user_id, nome, texto, criado) values ('f2000000-0000-0000-0000-000000000001', (select perfil from coach_config), 'Coach CK Life', 'Bom dia, Legião', now() - interval '3 hours');
select equipe_tick(); select equipe_tick();
select ok((select count(*) from comentarios c join equipe_membros m on m.user_id = c.user_id where c.post_id = 'f2000000-0000-0000-0000-000000000001') = 0, 'Time de Incentivo não comenta no post da Coach');
-- "Amiga, faltou você": participava da comunidade e sumiu 5 dias
insert into auth.users values (:F1, 'f1@t') on conflict do nothing;
insert into alunas (id, email, nome, criado, ultimo, dados) values (:F1, 'f1@t', 'Fabi Comunidade', '2026-09-01', '2026-11-15', '{"treinos":[{"d":"2026-11-19","h":7}]}') on conflict (id) do nothing;
insert into posts (user_id, nome, texto, criado) values (:F1, 'Fabi', 'Oi, meninas!', '2026-11-01 12:00:00+00');
select _coach_tick('2026-11-20 22:00:00+00');
select ok((select regra from coach_envios where user_id = :F1 order by id desc limit 1) = 'faltou_voce', 'sumiu da comunidade: "Amiga, faltou você"');
select _coach_tick('2026-11-21 22:00:00+00');
select ok((select count(*) from coach_envios where user_id = :F1 and regra = 'faltou_voce') = 1, '"Amiga, faltou você" no máximo a cada 10 dias');
-- Parceira CK
insert into auth.users values (:P1, 'p1@t'), (:P2, 'p2@t'), (:P3, 'p3@t') on conflict do nothing;
insert into alunas (id, email, nome, dados) values (:P1, 'p1@t', 'Paula Um', jsonb_build_object('treinos', jsonb_build_array(jsonb_build_object('d', to_char((now() at time zone 'America/Cuiaba')::date, 'YYYY-MM-DD'), 'h', 8), jsonb_build_object('d', '2020-01-01', 'h', 8)), 'pesos', jsonb_build_array(jsonb_build_object('kg', 70)))),
  (:P2, 'p2@t', 'Pri Dois', '{}'), (:P3, 'p3@t', 'Pati Tres', '{}') on conflict (id) do nothing;
select set_config('ck.sistema', '1', false);
insert into perfis (user_id, username, nome) values (:P1, 'paula1', 'Paula Um'), (:P2, 'pri2', 'Pri Dois'), (:P3, 'pati3', 'Pati Tres') on conflict do nothing;
select set_config('ck.sistema', '0', false);
select tst_como(:P1);
insert into seguidores (seguido) values (:P2), (:P3) on conflict do nothing;
reset role;
select tst_como(:P2);
insert into seguidores (seguido) values (:P1) on conflict do nothing;
reset role;
select tst_como(:P1);
select ok(jsonb_array_length(parceira_amigas()) = 1, 'amigas para convidar: só quem segue de volta');
select nega($$ select parceira_convidar('f0000000-0000-0000-0000-0000000000a3') $$, 'não convida quem não segue de volta');
select nega($$ select parceira_convidar((select perfil from coach_config)) $$, 'não convida perfil oficial');
select ok(parceira_convidar(:P2) is not null, 'convida a amiga');
select nega($$ select parceira_convidar('f0000000-0000-0000-0000-0000000000a2') $$, 'não manda convite repetido');
reset role;
select ok((select count(*) from notificacoes where user_id = :P2 and ref like 'parceira:%') = 1, 'amiga recebe o aviso do convite');
select tst_como(:P3);
select ok((select count(*) from parceiras) = 0, 'outra aluna não vê a parceria');
select ok(not parceira_responder((select id from parceiras limit 1), true), 'outra aluna não aceita por ela');
reset role;
select tst_como(:P2);
select ok(jsonb_array_length(parceira_status() -> 'convites') = 1, 'convidada vê o convite');
select ok(parceira_responder((select id from parceiras where status = 'pendente' limit 1), true), 'convidada aceita');
select ok((parceira_status() ->> 'status') = 'ativa' and (parceira_status() ->> 'semana_ela')::int = 1, 'vê só quantos dias a parceira treinou na semana');
select ok(parceira_status()::text !~ '(kg|peso|ciclo|treinos)', 'nada de peso, ciclo ou lista de treinos');
select ok(parceira_incentivar(2), 'manda um incentivo');
select nega($$ select parceira_incentivar(1) $$, 'só 1 incentivo por dia');
reset role;
select ok((select count(*) from notificacoes where user_id = :P1 and texto like 'Orgulho de você%') = 1, 'parceira recebe o incentivo');
select tst_como(:P1);
select ok(parceira_encerrar((select id from parceiras where status = 'ativa' limit 1)), 'qualquer uma encerra quando quiser');
select ok((parceira_status() ->> 'status') = 'nenhuma', 'parceria encerrada');
reset role;
