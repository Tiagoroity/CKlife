-- Aviso de aluna nova para a equipe
\set A1 '''a7000000-0000-0000-0000-000000000001'''
\set A2 '''a7000000-0000-0000-0000-000000000002'''
\set N1 '''a7000000-0000-0000-0000-0000000000a1'''
\set N2 '''a7000000-0000-0000-0000-0000000000a2'''
reset role;
insert into auth.users values (:A1, 'adm1@t'), (:A2, 'adm2@t'), (:N1, 'n1@t'), (:N2, 'n2@t') on conflict do nothing;
insert into admins (user_id, email, nome) values (:A1, 'adm1@t', 'Adm Um'), (:A2, 'adm2@t', 'Adm Dois') on conflict do nothing;
insert into push_inscricoes (endpoint, user_id, p256dh, auth) values ('https://push.t/a1', :A1, 'k', 'a') on conflict do nothing;
delete from push_fila;
-- aluna nova de outro estado
insert into alunas (id, email, nome, cidade, dados) values (:N1, 'n1@t', 'Gabriela Souza', 3304557, '{"cidadeInfo":{"id":3304557,"nome":"Rio de Janeiro","uf":"RJ"}}');
select ok((select count(*) = 1 from push_fila where user_id = :A1 and payload ->> 'body' = 'Gabriela, de Rio de Janeiro · RJ, acabou de se cadastrar.'), 'admin com celular recebe o aviso com nome e cidade');
select ok((select count(*) = 0 from push_fila where user_id = :A2), 'admin sem celular ativado não gera envio');
select ok((select payload ->> 'url' = '/admin#admin-alunos' from push_fila where user_id = :A1 limit 1), 'aviso abre a lista de alunas');
-- atualizar a aluna não gera aviso de novo
update alunas set nome = 'Gabriela S.' where id = :N1;
select ok((select count(*) = 1 from push_fila where user_id = :A1), 'atualização não repete o aviso');
-- admin entrando no app não conta como aluna nova
insert into alunas (id, email, nome) values (:A2, 'adm2@t', 'Adm Dois') on conflict do nothing;
select ok((select count(*) = 1 from push_fila where user_id = :A1), 'conta da equipe não dispara aviso');
-- desligar o aviso
select tst_como(:A1);
select ok((select (public.admin_aviso_nova_aluna(false) ->> 'ligado')::boolean = false), 'admin desliga o próprio aviso');
reset role;
insert into alunas (id, email, nome) values (:N2, 'n2@t', 'Rosa');
select ok((select count(*) = 1 from push_fila where user_id = :A1), 'desligado não recebe');
select tst_como(:A1); select public.admin_aviso_nova_aluna(true); reset role;
-- aluna comum não mexe no aviso
select tst_como(:N2);
select nega($$ select public.admin_aviso_nova_aluna(true) $$, 'aluna não usa a função da equipe');
reset role;
select ok(not exists(select 1 from information_schema.role_routine_grants where routine_name = '_aviso_nova_aluna' and grantee in ('anon','authenticated')), 'gatilho não é chamável de fora');
