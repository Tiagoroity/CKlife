-- =====================================================================
-- CK Life · Primeiros passos da aluna nova + erros do app no painel
-- Só acrescenta. Não apaga nada. Pode rodar de novo.
-- 1) Lembrete do PRIMEIRO TREINO: a aluna escolhe o dia e a hora; chega uma vez só.
-- 2) Erros que acontecem no celular das alunas aparecem no painel (sem dado pessoal).
-- =====================================================================

-- ---------- 1) lembrete de uma vez só ----------
alter table public.lembretes add column if not exists so_em date;   -- preenchido = só envia nesse dia
do $$ declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.lembretes'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%refeicao%' loop
    execute format('alter table public.lembretes drop constraint %I', c);
  end loop;
  alter table public.lembretes add constraint lembretes_tipo_check check (tipo in ('treino','agua','refeicao','primeiro'));
end $$;

create or replace function public._lembretes_tick() returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; tit text; corpo text;
begin
  for r in
    with c as (
      select l.*, (now() at time zone l.fuso) loc from lembretes l
      where l.ativo and exists (select 1 from push_inscricoes s where s.user_id = l.user_id)
    ), d as (
      select c.*, dd::date dia, (dd::date + c.hora) - make_interval(mins => c.antecedencia) alvo
      from c, generate_series(c.loc::date, c.loc::date + 1, interval '1 day') dd
    ), novos as (
      insert into lembretes_envios (lembrete_id, user_id, dia, para)
      select d.id, d.user_id, d.dia, (d.dia + d.hora) at time zone d.fuso from d
      where d.loc >= d.alvo and d.loc < d.alvo + interval '10 minutes'
        and (array['SU','MO','TU','WE','TH','FR','SA'])[extract(dow from d.dia)::int + 1] = any(d.dias)
        and (d.pausado_ate is null or d.pausado_ate < d.dia)
        and (d.so_em is null or d.so_em = d.dia)
      on conflict (lembrete_id, dia) do nothing
      returning lembretes_envios.id eid, lembretes_envios.user_id uid, lembretes_envios.lembrete_id lid
    )
    select novos.*, l.tipo, l.antecedencia from novos join lembretes l on l.id = novos.lid
  loop
    tit := case r.tipo when 'treino' then case when r.antecedencia > 0 then 'Seu treino começa em ' || r.antecedencia || ' minutos 💚' else 'Hora do seu treino 💚' end
      when 'primeiro' then 'Chegou a hora do seu primeiro treino 💚'
      when 'agua' then 'Hora de beber água 💧' else 'Hora da sua refeição 🥗' end;
    corpo := case r.tipo when 'treino' then 'Separe sua água e uma roupa confortável. Seu treino de hoje está pronto no CK Life.'
      when 'primeiro' then 'São só 5 minutos, em pé e sem equipamento. Você combinou com você mesma, e a gente está junto.'
      when 'agua' then 'Um copo agora já ajuda. Marque no CK Life.' else 'Seu cardápio de hoje está no CK Life.' end;
    begin
      perform _push_um(r.uid, jsonb_build_object('title', tit, 'body', corpo, 'tag', 'lembrete:' || r.tipo, 'url', '/?n=' || r.tipo), r.eid);
    exception when others then update lembretes_envios set status = 'falhou' where id = r.eid;
    end;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public._lembretes_tick() from public, anon, authenticated;

-- ---------- 2) erros do app ----------
create table if not exists public.app_erros (
  id bigserial primary key,
  user_id uuid default auth.uid(),
  msg text not null check (char_length(msg) <= 300),
  onde text check (char_length(onde) <= 120),
  aparelho text check (aparelho in ('iphone','android','computador','outro')),
  modo text check (modo in ('instalado','navegador')),
  versao text check (char_length(versao) <= 20),
  criado timestamptz not null default now()
);
create index if not exists app_erros_criado_idx on public.app_erros (criado desc);
alter table public.app_erros enable row level security;
drop policy if exists aer_ler on public.app_erros;
create policy aer_ler on public.app_erros for select to authenticated using (admin_ve('metricas'));

-- a aluna só registra (no máximo 30 por dia, para nunca encher o banco)
create or replace function public.registra_erro(p_msg text, p_onde text default null, p_aparelho text default null, p_modo text default null, p_versao text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or coalesce(trim(p_msg), '') = '' then return; end if;
  if (select count(*) from app_erros where user_id = auth.uid() and criado > now() - interval '1 day') >= 30 then return; end if;
  insert into app_erros (msg, onde, aparelho, modo, versao)
  values (left(p_msg, 300), left(p_onde, 120),
    case when p_aparelho in ('iphone','android','computador','outro') then p_aparelho else 'outro' end,
    case when p_modo in ('instalado','navegador') then p_modo else null end, left(p_versao, 20));
  delete from app_erros where criado < now() - interval '60 days';
exception when others then return;
end $$;
revoke all on function public.registra_erro(text, text, text, text, text) from public, anon;
grant execute on function public.registra_erro(text, text, text, text, text) to authenticated;

-- painel: erros agrupados dos últimos 7 dias (sem nome nem e-mail)
create or replace function public.admin_erros(p_dias int default 7) returns jsonb
language plpgsql security definer set search_path = public as $$
declare dd int := greatest(1, least(coalesce(p_dias, 7), 60));
begin
  if not admin_ve('metricas') then raise exception 'Sem permissão'; end if;
  return coalesce((select jsonb_agg(to_jsonb(x) order by x.ultimo desc) from (
    select e.msg, count(*) vezes, count(distinct e.user_id) alunas, max(e.criado) ultimo, max(e.versao) versao, min(e.onde) onde,
      count(*) filter (where e.aparelho = 'iphone') iphone, count(*) filter (where e.aparelho = 'android') android,
      count(*) filter (where e.aparelho not in ('iphone','android')) outros
    from app_erros e where e.criado > now() - make_interval(days => dd)
    group by e.msg order by max(e.criado) desc limit 30) x), '[]'::jsonb);
end $$;
revoke all on function public.admin_erros(int) from public, anon;
grant execute on function public.admin_erros(int) to authenticated;
