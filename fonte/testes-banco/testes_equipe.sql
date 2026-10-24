-- Time de Incentivo CK
\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set M '''dddddddd-0000-0000-0000-00000000000d'''
reset role;
delete from bloqueios where true;
update equipe_config set hora_ini = 0, hora_fim = 24, ligado = true where id = 1;
select ok((select count(*) from equipe_membros) = 50, '50 perfis da equipe criados');
select ok((select count(*) from perfis where equipe) = 50, 'todos com o selo da equipe');
select ok((select count(*) from alunas a join equipe_membros m on m.user_id = a.id) = 0, 'equipe não conta como aluna');
-- post de aluna real (antigo o bastante para passar o atraso)
insert into posts (id, user_id, nome, texto, criado) values ('eeeeeeee-0000-0000-0000-00000000000e', :A, 'Ana Real', 'Treino de hoje feito!', now() - interval '2 hours');
select ok(equipe_tick() >= 1, 'robô age no post da aluna');
select ok((select count(*) from comentarios c join equipe_membros m on m.user_id = c.user_id where c.post_id = 'eeeeeeee-0000-0000-0000-00000000000e') = 1, 'exatamente 1 comentário da equipe no post');
select equipe_tick(); select equipe_tick();
select ok((select count(*) from comentarios c join equipe_membros m on m.user_id = c.user_id where c.post_id = 'eeeeeeee-0000-0000-0000-00000000000e') = 1, 'continua 1 comentário depois de rodar de novo');
select ok((select texto from comentarios c join equipe_membros m on m.user_id = c.user_id where c.post_id = 'eeeeeeee-0000-0000-0000-00000000000e') !~ '\?', 'comentário sem pergunta');
select ok((select count(*) from curtidas c join equipe_membros m on m.user_id = c.user_id where c.post_id = 'eeeeeeee-0000-0000-0000-00000000000e') between 1 and 2, 'curtidas da equipe: 1 ou 2');
select ok((select count(*) from notificacoes where user_id = :A and tipo = 'comentario' and texto like '%Equipe CK%') = 1, 'aviso mostra que é da Equipe CK');
select ok((select count(*) from mensagens m join equipe_membros e on e.user_id = m.autor) = 0, 'equipe nunca manda mensagem');
-- desligado não faz nada
update equipe_config set ligado = false where id = 1;
insert into posts (id, user_id, nome, texto, criado) values ('eeeeeeee-0000-0000-0000-0000000000e2', :A, 'Ana Real', 'Receita do almoço', now() - interval '2 hours');
select ok(equipe_tick() = 0, 'chave geral desligada: nada acontece');
update equipe_config set ligado = true where id = 1;
-- membro desligado nunca age
update equipe_membros set ativo = false where true;
select ok(equipe_tick() = 0, 'todas desligadas uma a uma: nada acontece');
update equipe_membros set ativo = true where true;
-- aluna não se dá o selo e não acessa o painel da equipe
select tst_como(:A);
update perfis set equipe = true where user_id = auth.uid();
select ok(not coalesce((select equipe from perfis where user_id = auth.uid()), false), 'aluna não consegue se dar o selo');
select nega($$ select admin_equipe() $$, 'aluna não vê o painel da equipe');
select nega($$ select admin_equipe_config(false, 0, 24, 0, 0) $$, 'aluna não desliga a equipe');
select nega($$ select equipe_tick() $$, 'aluna não roda o robô');
select ok((select count(*) from equipe_log) = 0, 'aluna não lê o histórico');
reset role;
-- equipe não comenta em post da própria equipe
insert into posts (id, user_id, nome, texto, criado) select 'eeeeeeee-0000-0000-0000-0000000000e3', user_id, nome, 'oi', now() - interval '2 hours' from equipe_membros limit 1;
select equipe_tick();
select ok((select count(*) from comentarios where post_id = 'eeeeeeee-0000-0000-0000-0000000000e3') = 0, 'equipe não comenta em post da equipe');
-- fotos e 24 horas
select ok((select count(*) from perfis p join equipe_membros m on m.user_id = p.user_id where p.foto_mini like 'img/equipe/%.jpg') = 50, 'as 50 com foto');
select ok((select hora_ini = 0 and hora_fim = 24 from equipe_config where id = 1), 'rodando 24 horas');
insert into posts (id, user_id, nome, texto, criado) values ('eeeeeeee-0000-0000-0000-0000000000e9', :A, 'Ana Real', 'Mais um treino', now() - interval '2 hours');
select equipe_tick();
select ok((select c.foto from comentarios c join equipe_membros m on m.user_id = c.user_id where c.post_id = 'eeeeeeee-0000-0000-0000-0000000000e9') like 'img/equipe/%', 'comentário novo sai com a foto');
select ok((select count(*) from comentarios c join equipe_membros m on m.user_id = c.user_id where c.foto is null) = 0, 'comentários antigos ganharam a foto');
