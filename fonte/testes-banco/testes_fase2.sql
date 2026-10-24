-- Fase 2: desafio em turma
\set A '''c1c1c1c1-0000-0000-0000-0000000000c1'''
\set B '''c2c2c2c2-0000-0000-0000-0000000000c2'''
reset role;
update desafio_participantes set saiu = true where true;
select tst_como(:A);
insert into desafio_participantes (desafio, turma, inicio) values ('d21', date_trunc('week', current_date + 7)::date, date_trunc('week', current_date + 7)::date);
select nega($$ insert into desafio_participantes (desafio, turma) values ('d7', current_date - extract(isodow from current_date)::int + 2) $$, 'turma só começa na segunda');
update desafio_participantes set progresso = 3, ultimo = current_date where fim is null and not saiu;
select nega($$ update desafio_participantes set progresso = 99 where fim is null and not saiu $$, 'progresso não passa de 30');
select tst_como(:B);
insert into desafio_participantes (desafio, turma, inicio) values ('d21', date_trunc('week', current_date + 7)::date, date_trunc('week', current_date + 7)::date);
select ok((desafio_turma('d21', date_trunc('week', current_date + 7)::date) ->> 'inscritas')::int = 2, 'turma conta as inscritas (2)');
select ok((desafio_turma('d21', date_trunc('week', current_date + 7)::date) ->> 'hoje')::int = 1, 'turma conta quem treinou hoje');
update desafio_participantes set progresso = 5 where user_id <> auth.uid();
reset role; select ok((select progresso from desafio_participantes where user_id = :A and not saiu) = 3, 'uma não mexe no progresso da outra');
select tst_como(:B);
select ok((select count(*) from desafio_participantes where user_id = :A) = 0, 'não vê a participação da outra');
reset role; set role anon;
select nega($$ select desafio_turma('d21', current_date) $$, 'visitante sem login não consulta');
reset role;
