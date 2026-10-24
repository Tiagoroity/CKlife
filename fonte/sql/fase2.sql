-- CK Life · FASE 2: desafio de 21 dias em TURMA (todas começam na mesma segunda-feira)
-- Seguro rodar mais de uma vez. Não apaga nada. Só números agregados: ninguém vê nome, peso ou ciclo de outra aluna.

alter table public.desafio_participantes add column if not exists turma date;          -- segunda-feira de início da turma
alter table public.desafio_participantes add column if not exists progresso int not null default 0;   -- dias de treino feitos no desafio
alter table public.desafio_participantes add column if not exists ultimo date;          -- último dia em que treinou
create index if not exists desafio_turma_idx on public.desafio_participantes (desafio, turma) where turma is not null;

-- a turma só pode começar numa segunda-feira, e o progresso fica entre 0 e 30
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'desafio_turma_segunda') then
    alter table public.desafio_participantes add constraint desafio_turma_segunda check (turma is null or extract(isodow from turma) = 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'desafio_progresso_faixa') then
    alter table public.desafio_participantes add constraint desafio_progresso_faixa check (progresso between 0 and 30);
  end if;
end $$;

-- números da turma: inscritas, quem treinou hoje, quem concluiu (nunca quem é)
create or replace function public.desafio_turma(p_desafio text, p_turma date) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'inscritas',  count(*) filter (where not saiu),
    'hoje',       count(*) filter (where not saiu and ultimo = current_date),
    'concluiram', count(*) filter (where not saiu and fim is not null),
    'media',      coalesce(round(avg(progresso) filter (where not saiu))::int, 0))
  from desafio_participantes
  where auth.uid() is not null and desafio = p_desafio and turma = p_turma;
$$;
revoke all on function public.desafio_turma(text, date) from public, anon;
grant execute on function public.desafio_turma(text, date) to authenticated;
