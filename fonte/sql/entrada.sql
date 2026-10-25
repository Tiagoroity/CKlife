-- CK Life · Entrada (Legião CK Life)
-- Número real de mulheres que abriram o app hoje (horário de Cuiabá), sem contar os perfis da equipe.
-- Devolve só o número: nenhum nome, nenhum dado pessoal. Pode rodar mais de uma vez.
create or replace function public.legiao_hoje()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct a.user_id)::int
  from public.acessos a
  left join public.perfis p on p.user_id = a.user_id
  where a.dia = (now() at time zone 'America/Cuiaba')::date
    and coalesce(p.equipe, false) = false;
$$;
revoke all on function public.legiao_hoje() from public, anon;
grant execute on function public.legiao_hoje() to authenticated;
