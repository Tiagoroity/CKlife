\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
reset role;
insert into auth.users values (:A, 'a@t') on conflict do nothing;
select tst_como(:A);
-- 1) cadastro/atualização da própria linha (como o app faz: upsert)
select nega($$ select 1 where false $$, 'controle');
do $$ begin
  insert into alunas (id, email, nome, dados) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'a@t', 'Ana', '{"x":1}')
    on conflict (id) do update set nome = excluded.nome, dados = excluded.dados;
  raise notice 'OK    upsert alunas 1';
  insert into alunas (id, email, nome, dados) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'a@t', 'Ana 2', '{"x":2}')
    on conflict (id) do update set nome = excluded.nome, dados = excluded.dados;
  raise notice 'OK    upsert alunas 2';
exception when others then raise notice 'FALHA upsert alunas: %', sqlerrm; end $$;
do $$ begin insert into eventos (t, c, u) values ('imp', 'x:emp:em1:ver', 'aaaaaaaa-0000-0000-0000-00000000000a'); raise notice 'OK    evento explorar';
exception when others then raise notice 'FALHA evento: %', sqlerrm; end $$;
do $$ begin insert into acessos (dia, user_id) values (current_date, 'aaaaaaaa-0000-0000-0000-00000000000a') on conflict do nothing; raise notice 'OK    acesso';
exception when others then raise notice 'FALHA acesso: %', sqlerrm; end $$;
do $$ begin insert into colecoes (nome, id, dados) values ('cupons', 'cup1', '{"id":"cup1","user":"aaaaaaaa-0000-0000-0000-00000000000a","usado":false}')
  on conflict (nome, id) do update set dados = excluded.dados; raise notice 'OK    cupom upsert';
exception when others then raise notice 'FALHA cupom upsert: %', sqlerrm; end $$;
reset role;
