-- Inteligência: vídeo das alunas desligado, Squad CK, Desafio coletivo
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set S1 '''e5000000-0000-0000-0000-000000000001'''
reset role;
select ok((select 'audio/webm' = any(allowed_mime_types) and 'image/jpeg' = any(allowed_mime_types) from storage.buckets where id = 'social'), 'foto e áudio continuam aceitos');
-- aluna: post com vídeo recusado, foto aceita
insert into auth.users values (:S1, 's1@t') on conflict do nothing;
insert into alunas (id, email, nome, dados) values (:S1, 's1@t', 'Sara Squad', jsonb_build_object('treinos', jsonb_build_array(jsonb_build_object('d', to_char((now() at time zone 'America/Cuiaba')::date, 'YYYY-MM-DD'), 'min', 24)))) on conflict (id) do nothing;
select set_config('ck.sistema', '1', false); insert into perfis (user_id, username, nome) values (:S1, 'sara.s1', 'Sara Squad') on conflict do nothing; select set_config('ck.sistema', '0', false);
select tst_como(:S1);
select nega($$ insert into posts (user_id, nome, texto, midia) values ('e5000000-0000-0000-0000-000000000001', 'Sara', 'meu vídeo', 'post/e5000000-0000-0000-0000-000000000001/abcdef12.mp4') $$, 'aluna não publica vídeo no feed');
insert into posts (user_id, nome, texto, midia) values (:S1, 'Sara', 'minha foto', 'post/e5000000-0000-0000-0000-000000000001/abcdef12.jpg');
select ok((select count(*) from posts where user_id = auth.uid() and midia like '%.jpg') = 1, 'aluna continua publicando foto');
select nega($$ insert into stories (user_id, midia) values ('e5000000-0000-0000-0000-000000000001', 'story/e5000000-0000-0000-0000-000000000001/abcdef12.mov') $$, 'aluna não publica vídeo em Stories');
reset role;
-- administradora (conteúdo oficial) continua podendo
select tst_como(:M);
insert into posts (user_id, nome, texto, midia) values (:M, 'Admin', 'vídeo oficial', 'post/dddddddd-0000-0000-0000-00000000000d/oficial1.mp4');
select ok((select count(*) from posts where user_id = auth.uid() and midia like '%.mp4') = 1, 'conteúdo oficial em vídeo continua permitido');
reset role;
-- Squad: limite de integrantes
insert into grupos (id, slug, nome, squad, max_membros) values ('e6000000-0000-0000-0000-000000000001', 'squad-teste', 'Squad Teste', true, 5) on conflict do nothing;
insert into auth.users select ('e7000000-0000-0000-0000-00000000000' || g)::uuid, 'q' || g || '@t' from generate_series(1, 6) g on conflict do nothing;
insert into membros_grupo (grupo_id, user_id) select 'e6000000-0000-0000-0000-000000000001', ('e7000000-0000-0000-0000-00000000000' || g)::uuid from generate_series(1, 5) g;
select nega($$ insert into membros_grupo (grupo_id, user_id) values ('e6000000-0000-0000-0000-000000000001', 'e7000000-0000-0000-0000-000000000006') $$, 'Squad completo não aceita a 6ª');
select tst_como(:S1);
select ok((grupos_info()::jsonb @> '[{"slug":"squad-teste","squad":true,"max_membros":5}]'), 'app recebe que é Squad e o limite');
reset role;
-- Desafio coletivo: total real
select tst_como(:S1);
select nega($$ select admin_desafio_coletivo(null, 'Hack', 1000, current_date, current_date, true) $$, 'aluna não cria desafio coletivo');
select ok(desafio_coletivo_atual() is null, 'sem desafio ativo: nada aparece');
reset role;
select tst_como(:M);
select ok(admin_desafio_coletivo(null, '100 mil minutos', 100000, (now() at time zone 'America/Cuiaba')::date - 1, (now() at time zone 'America/Cuiaba')::date + 30, true) is not null, 'admin cria desafio coletivo');
reset role;
select set_config('ck.esp', public._dc_soma((now() at time zone 'America/Cuiaba')::date - 1, (now() at time zone 'America/Cuiaba')::date + 30)::text, false);
select tst_como(:S1);
select ok((desafio_coletivo_atual() ->> 'total') = current_setting('ck.esp'), 'total = soma real dos minutos');
select ok((desafio_coletivo_atual() ->> 'total')::int >= 24, 'inclui os minutos dela');
reset role;
update desafios_coletivos set ativo = false where true;
