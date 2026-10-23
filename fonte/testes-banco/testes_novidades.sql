-- Testes das novidades: grupos, figurinhas, humor, desafios, push
\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set MOD '''eeeeeeee-0000-0000-0000-00000000000e'''
reset role;
-- GRUPOS
select tst_como(:A);
select ok(json_array_length(grupos_info()) >= 6, 'aluna vê os grupos prontos');
select nega($$ insert into grupos (slug, nome) values ('hack', 'Hack') $$, 'aluna não cria grupo');
insert into membros_grupo (grupo_id) select id from grupos where slug = 'iniciantes';
select ok((select (x->>'eu')::boolean from json_array_elements(grupos_info()) x where x->>'slug' = 'iniciantes'), 'aluna entrou no grupo');
select ok((select (x->>'membros')::int from json_array_elements(grupos_info()) x where x->>'slug' = 'iniciantes') = 1, 'contagem de membras real');
insert into posts (user_id, nome, texto, grupo_id) select :A, 'Ana', 'Oi grupo!', id from grupos where slug = 'iniciantes';
select ok(exists (select 1 from posts where texto = 'Oi grupo!'), 'membra publica no grupo');
select nega($$ insert into posts (user_id, nome, texto, grupo_id) select 'aaaaaaaa-0000-0000-0000-00000000000a', 'Ana', 'intrusa', id from grupos where slug = 'corrida' $$, 'não publica em grupo do qual não participa');
select tst_como(:B);
select ok((select count(*) from membros_grupo) = 0, 'B não vê quem participa dos grupos');
select nega($$ insert into membros_grupo (grupo_id, user_id) select id, 'aaaaaaaa-0000-0000-0000-00000000000a' from grupos where slug = 'corrida' $$, 'B não coloca A em grupo');
select tst_como(:M); insert into grupos (slug, nome, emoji) values ('barra-do-garcas', 'Barra do Garças', '📍');
select ok(exists (select 1 from grupos where slug = 'barra-do-garcas'), 'admin cria grupo da cidade');
-- FIGURINHAS
select tst_como(:A);
insert into figurinhas (midia) values ('figurinha/aaaaaaaa-0000-0000-0000-00000000000a/abc123def.png');
select ok((select count(*) from figurinhas) = 1, 'aluna salva figurinha na conta');
select nega($$ insert into figurinhas (midia) values ('figurinha/bbbbbbbb-0000-0000-0000-00000000000b/abc123def.png') $$, 'não salva figurinha em pasta de outra');
select ok(social_pode_gravar('figurinha/aaaaaaaa-0000-0000-0000-00000000000a/abc123def.png'), 'pode subir arquivo de figurinha própria');
select ok(not social_pode_gravar('figurinha/bbbbbbbb-0000-0000-0000-00000000000b/abc123def.png'), 'não sobe figurinha na pasta de outra');
select ok(social_pode_gravar('post/aaaaaaaa-0000-0000-0000-00000000000a/video12345.mp4') and social_pode_gravar('post/aaaaaaaa-0000-0000-0000-00000000000a/video12345.mov'), 'aceita vídeo mp4 e mov');
select tst_como(:B);
select ok((select count(*) from figurinhas) = 0, 'B não vê figurinhas de A');
select ok(not social_pode_ler('figurinha/aaaaaaaa-0000-0000-0000-00000000000a/abc123def.png'), 'B não abre arquivo de figurinha de A');
-- HUMOR
select tst_como(:A); insert into humor_diario (humor, energia) values ('1', 'baixa');
select ok((select count(*) from humor_diario) = 1, 'humor salvo');
select tst_como(:M); select ok((select count(*) from humor_diario) = 0, 'ADMIN não lê humor das alunas');
select tst_como(:B); select ok((select count(*) from humor_diario) = 0, 'outra aluna não lê humor');
-- DESAFIOS
select tst_como(:A); insert into desafio_participantes (desafio) values ('d7');
select nega($$ insert into desafio_participantes (desafio) values ('d21') $$, 'só um desafio ativo por vez');
select tst_como(:B); insert into desafio_participantes (desafio) values ('d7');
select ok((desafio_contagem()->>'d7')::int = 2, 'contagem real do desafio (2)');
select ok((select count(*) from desafio_participantes) = 1, 'cada uma só vê a própria participação');
update desafio_participantes set saiu = true; select ok((desafio_contagem()->>'d7')::int = 1, 'quem saiu não conta');
-- PUSH
select tst_como(:A); insert into push_inscricoes (endpoint, p256dh, auth) values ('https://push.exemplo/abc', 'k1', 'a1');
select tst_como(:B); select ok((select count(*) from push_inscricoes) = 0, 'B não vê inscrições de A');
select ok((select count(*) from push_fila) = 0, 'ninguém lê a fila pelo app');
reset role; insert into notificacoes (user_id, tipo, ref, texto) values (:A, 'sistema', 'x1', 'Teste de aviso');
select ok((select count(*) from push_fila where user_id = :A) = 1, 'notificação entra na fila de envio');
select tst_como(:B);
select ok(push_pegar((select id from push_fila limit 1), 'errado') is null, 'código errado não libera nada');
reset role; select set_config('tst.fid', (select id::text from push_fila limit 1), false), set_config('tst.tk', (select token from push_fila limit 1), false);
set role anon;
select ok((push_pegar(current_setting('tst.fid')::uuid, current_setting('tst.tk'))->'subs'->0->>'endpoint') = 'https://push.exemplo/abc', 'servidor de envio pega o aviso com o código');
select ok(push_pegar(current_setting('tst.fid')::uuid, current_setting('tst.tk')) is null, 'código só vale uma vez');
select push_expirou(current_setting('tst.fid')::uuid, current_setting('tst.tk'), 'https://push.exemplo/abc');
reset role; select ok((select count(*) from push_inscricoes where user_id = :A) = 0, 'inscrição cancelada é removida');
