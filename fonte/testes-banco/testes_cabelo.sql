-- Cabelo para Treinar: começa desativado; beta só para escolhidas + admins; conteúdo só o painel muda
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set A '''c1c1c1c1-0000-0000-0000-0000000000c1'''
\set B '''c2c2c2c2-0000-0000-0000-0000000000c2'''
reset role;
select ok((select estado from feature_flags where chave = 'cabelo') = 'disabled', 'começa DESATIVADO');
select ok((select count(*) from penteados where status = 'publicado') >= 40, 'catálogo inicial com 40+ penteados');
select ok((select count(*) from penteado_passos) >= 160, 'cada penteado tem passos');
select tst_como(:A);
select ok(not (meus_recursos() ->> 'cabelo')::boolean, 'desativado: aluna não vê');
select ok((select count(*) from penteados) = 0, 'desativado: aluna não lê penteados');
select tst_como(:M);
select ok((select count(*) from penteados) >= 40, 'admin vê mesmo desativado (pré-visualização)');
select ok((admin_flag('cabelo') ->> 'estado') = 'disabled', 'painel mostra estado');
update feature_flags set estado = 'beta' where chave = 'cabelo';
select ok((admin_flag_beta('cabelo', 'ana@t', true) -> 'beta' -> 0 ->> 'email') = 'ana@t', 'adiciona aluna ao beta');
select tst_como(:A); select ok((meus_recursos() ->> 'cabelo')::boolean and (select count(*) from penteados) >= 40, 'beta: aluna escolhida vê');
select tst_como(:B); select ok(not (meus_recursos() ->> 'cabelo')::boolean and (select count(*) from penteados) = 0, 'beta: outra aluna não vê');
update feature_flags set estado = 'enabled' where chave = 'cabelo';
reset role; select ok((select estado from feature_flags where chave = 'cabelo') = 'beta', 'aluna não liga a funcionalidade (estado intacto)');
select tst_como(:M); update feature_flags set estado = 'enabled' where chave = 'cabelo';
select tst_como(:B); select ok((meus_recursos() ->> 'cabelo')::boolean, 'ativado: todas veem');
select ok((select count(*) from penteados where status <> 'publicado') = 0, 'aluna só vê publicados');
insert into penteado_favoritos (penteado_id) select id from penteados limit 1;
select ok((select count(*) from penteado_favoritos) = 1, 'aluna salva favorito');
select nega($$ insert into penteado_favoritos (user_id, penteado_id) select 'c1c1c1c1-0000-0000-0000-0000000000c1', id from penteados limit 1 $$, 'não salva favorito para outra');
insert into cabelo_prefs (tipo, comprimento) values ('cacheado', 'longo');
select nega($$ insert into cabelo_prefs (tipo) values ('ruim') $$, 'preferência inválida recusada');
select nega($$ insert into penteados (nome, slug) values ('x', 'xx') $$, 'aluna não cria penteado');
select tst_como(:M); insert into penteados (nome, slug, status) values ('Teste rascunho', 'teste-rascunho', 'rascunho');
select tst_como(:B); select ok(not exists (select 1 from penteados where slug = 'teste-rascunho'), 'rascunho não aparece para aluna');
reset role; update feature_flags set estado = 'disabled' where chave = 'cabelo';
delete from feature_flags where chave = 'cabelo';
select tst_como(:B); select ok(coalesce((meus_recursos() ->> 'cabelo')::boolean, false) = false and not recurso_visivel('cabelo'), 'sem configuração = desativado');
reset role; insert into feature_flags (chave, estado) values ('cabelo', 'disabled') on conflict do nothing;
select ok((select count(*) from auditoria where recurso = 'feature_flags') >= 2, 'mudanças registradas na auditoria');
