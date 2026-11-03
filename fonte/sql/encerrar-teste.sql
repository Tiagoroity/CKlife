-- CK Life · "Encerrar teste grátis agora" — a equipe decide quando o teste/Pro grátis acaba (nunca mexe em Pro pago)
-- Só acrescenta uma função. Não mexe em Pro pago. Pode rodar de novo.
create or replace function public.admin_encerrar_teste(p_user uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not (admin_pode('monetizacao') or admin_pode('alunos')) then raise exception 'sem permissão'; end if;
  update assinaturas set status = 'expired', fim = now(), motivo = 'Teste grátis encerrado pelo painel', atualizado = now()
    where user_id = p_user and provider in ('trial','manual','promocao') and status in ('trialing','active') and (fim is null or fim > now());
  get diagnostics n = row_count;
  perform auditar('teste_encerrado', 'assinaturas', p_user::text, 'ok', 'encerrado pela equipe');
  return n;
end $$;
revoke all on function public.admin_encerrar_teste(uuid) from public, anon;
grant execute on function public.admin_encerrar_teste(uuid) to authenticated;
