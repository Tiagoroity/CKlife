-- CK Life · "Encerrar teste grátis agora" — SÓ para contas com "teste" no nome (para a equipe testar os anúncios)
-- Só acrescenta uma função. Não mexe em Pro pago. Pode rodar de novo.
create or replace function public.admin_encerrar_teste(p_user uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not (admin_pode('monetizacao') or admin_pode('alunos')) then raise exception 'sem permissão'; end if;
  if not exists (select 1 from alunas where id = p_user and nome ilike '%teste%') then raise exception 'só funciona em conta com "teste" no nome'; end if;
  update assinaturas set status = 'expired', fim = now(), motivo = 'Teste encerrado pelo painel (conta de teste)', atualizado = now()
    where user_id = p_user and provider in ('trial','manual','promocao') and status in ('trialing','active') and (fim is null or fim > now());
  get diagnostics n = row_count;
  perform auditar('teste_encerrado', 'assinaturas', p_user::text, 'ok', 'conta de teste');
  return n;
end $$;
revoke all on function public.admin_encerrar_teste(uuid) from public, anon;
grant execute on function public.admin_encerrar_teste(uuid) to authenticated;
