-- Testes da Legião CK Life
do $$
declare n int; u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); hoje date := (now() at time zone 'America/Cuiaba')::date; n0 int;
begin
  select public.legiao_hoje() into n0;
  insert into auth.users(id, email) values (u1, u1||'@t.com'), (u2, u2||'@t.com') on conflict do nothing;
  insert into public.acessos(dia, user_id) values (hoje, u1), (hoje, u2), (hoje - 3, u1) on conflict do nothing;
  select public.legiao_hoje() into n;
  if n = n0 + 2 then raise notice 'OK legiao conta acessos reais de hoje (%)', n; else raise notice 'FALHA legiao: % (antes %)', n, n0; end if;
  if exists(select 1 from information_schema.role_routine_grants where routine_name='legiao_hoje' and grantee='anon') then raise notice 'FALHA anon pode ver'; else raise notice 'OK anon sem acesso'; end if;
end $$;
