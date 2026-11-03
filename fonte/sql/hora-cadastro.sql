-- CK Life · hora exata do cadastro (para o painel ordenar por chegada)
-- Só acrescenta. Não apaga nada. Pode rodar de novo.
alter table public.alunas add column if not exists criado_em timestamptz default now();
update public.alunas a set criado_em = u.created_at from auth.users u where u.id = a.id and a.criado_em is distinct from u.created_at;
