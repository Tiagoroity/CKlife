-- Módulos, leitura de ajustes e Pro grátis
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set A '''c1c1c1c1-0000-0000-0000-0000000000c1'''
\set S '''e5e5e5e5-0000-0000-0000-0000000000e5'''
reset role;
insert into colecoes (nome, id, dados) values ('modulos', '1', '{"loja":{"on":false}}'), ('exercAjustes', 'x1', '{"id":"agacho"}'), ('receitasPlano', '1', '{"r1":"free"}') on conflict do nothing;
select tst_como(:A);
select ok((select count(*) from colecoes where nome in ('modulos','exercAjustes','receitasPlano')) = 3, 'aluna lê módulos, ajustes de exercício e receitas grátis/Pro');
update colecoes set dados = '{}' where nome = 'modulos';
select ok((select dados ->> 'loja' from colecoes where nome = 'modulos') is not null, 'aluna não muda módulos (continua igual)');
select nega($$ select admin_conceder_pro('c1c1c1c1-0000-0000-0000-0000000000c1', 30, 'eu mesma') $$, 'aluna não se dá Pro');
-- admin só de Alunas pode dar Pro
reset role;
insert into auth.users values (:S, 'suporte@t'); insert into alunas (id, email, nome) values (:S, 'suporte@t', 'Suporte');
insert into admins (user_id, email, perms) values (:S, 'suporte@t', '{"alunos":"editar"}');
select tst_como(:S);
select ok(admin_conceder_pro(:A, 30, 'Cortesia') is not null, 'admin de Alunas dá Pro grátis');
reset role;
select ok((select count(*) from notificacoes where user_id = :A and ref like 'pro:%') = 1, 'aluna recebe aviso do Pro');
select ok((select pro_ate from perfis where user_id = :A) is null or (select pro_ate from perfis where user_id = :A) > now(), 'coroa sincroniza');
select tst_como(:A); select ok((meu_plano() ->> 'pro')::boolean, 'Pro liberado no app na hora');
select tst_como(:S); select ok(admin_remover_pro_usuaria(:A, 'teste') >= 1, 'tira o Pro grátis');
select tst_como(:A); select ok(not coalesce((meu_plano() ->> 'pro')::boolean, false) or (meu_plano() ->> 'provider') not in ('manual','promocao'), 'Pro grátis removido');
reset role;
update admins set perms = '{"comunidade":"editar"}' where user_id = :S;
select tst_como(:S); select nega($$ select admin_conceder_pro('c1c1c1c1-0000-0000-0000-0000000000c1', 30, 'x') $$, 'admin sem Alunas/Monetização não dá Pro');
reset role;
