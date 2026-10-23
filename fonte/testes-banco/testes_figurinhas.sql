\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set M '''dddddddd-0000-0000-0000-00000000000d'''
reset role;
select ok((select count(*) from figurinhas_catalogo) = 100, '100 figurinhas importadas');
set role anon; select ok((select count(*) from figurinhas_catalogo) = 100, 'visitante vê catálogo (arquivos são públicos)');
select tst_como(:A);
update figurinhas_catalogo set ativa = false where id = 'hoje-teve'; reset role;
select ok((select ativa from figurinhas_catalogo where id = 'hoje-teve'), 'aluna não desativa figurinha (continua ativa)');
select tst_como(:A); select nega($$ insert into figurinhas_catalogo (id, nome, categoria, arquivo) values ('x-1','X','humor','a.webp') $$, 'aluna não cadastra figurinha');
select tst_como(:M); update figurinhas_catalogo set ativa = false where id = 'a-gata-foi';
select tst_como(:A); select ok(not exists (select 1 from figurinhas_catalogo where id = 'a-gata-foi'), 'desativada some para a aluna');
select tst_como(:M); select ok(exists (select 1 from figurinhas_catalogo where id = 'a-gata-foi'), 'admin ainda vê a desativada'); update figurinhas_catalogo set ativa = true where id = 'a-gata-foi';
select tst_como(:A); select ok(exists (select 1 from figurinhas_catalogo where id = 'a-gata-foi'), 'reativada volta a aparecer');
select registra_figurinha('hoje-teve', 'story'); select registra_figurinha('hoje-teve', 'story'); select registra_figurinha('nao-existe', 'chat');
select ok((select count(*) from figurinha_uso) = 0, 'aluna não lê estatística de uso');
select tst_como(:M); select ok((select n from figurinha_uso where figurinha_id = 'hoje-teve' and onde = 'story') = 2, 'uso contado sem identificar a aluna');
select ok((select count(*) from figurinha_uso where figurinha_id = 'nao-existe') = 0, 'figurinha inexistente não conta');
select tst_como(:A);
insert into comentarios (post_id, user_id, nome, texto, figurinha) select id, :A, 'Ana', '', 'orgulho-de-voce' from posts limit 1;
select ok(exists (select 1 from comentarios where figurinha = 'orgulho-de-voce'), 'comentário só com figurinha');
select nega($$ insert into comentarios (post_id, user_id, nome, texto) select id, 'aaaaaaaa-0000-0000-0000-00000000000a', 'Ana', '' from posts limit 1 $$, 'comentário vazio sem figurinha continua proibido');
insert into posts (user_id, nome, texto, figurinha) values (:A, 'Ana', null, 'hoje-teve');
select ok(exists (select 1 from posts where figurinha = 'hoje-teve'), 'publicação com figurinha');
