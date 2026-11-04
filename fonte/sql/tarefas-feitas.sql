-- CK Life · Tarefas de hoje compartilhadas entre todos os admins (celular e computador)
-- Só acrescenta. Não apaga nada. Pode rodar de novo.
create table if not exists public.tarefas_feitas (
  dia date not null,
  user_id uuid not null,
  grupo text check (char_length(grupo) <= 20),
  feito_por uuid default auth.uid(),
  feito_em timestamptz not null default now(),
  primary key (dia, user_id)
);
alter table public.tarefas_feitas enable row level security;
drop policy if exists tf_ler on public.tarefas_feitas;
create policy tf_ler on public.tarefas_feitas for select to authenticated using (exists (select 1 from admins where user_id = auth.uid()));
drop policy if exists tf_criar on public.tarefas_feitas;
create policy tf_criar on public.tarefas_feitas for insert to authenticated with check (exists (select 1 from admins where user_id = auth.uid()));
drop policy if exists tf_mudar on public.tarefas_feitas;
create policy tf_mudar on public.tarefas_feitas for update to authenticated using (exists (select 1 from admins where user_id = auth.uid())) with check (exists (select 1 from admins where user_id = auth.uid()));
-- limpeza: guarda só os últimos 60 dias
delete from public.tarefas_feitas where dia < current_date - 60;
