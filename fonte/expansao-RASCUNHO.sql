-- RASCUNHO: NÃO RODAR AINDA. Ver seção 5 do CK-LIFE-CONTEXTO-MESTRE.md (correções antes de rodar).
-- =====================================================================
-- CK Life · Expansão (Explorar, agendamentos, avaliações, métricas, Meu Ciclo e chat)
-- Só ADICIONA coisas. Não apaga nada. Pode rodar de novo sem problema.
-- Cole no Supabase (SQL Editor > New query) e clique em Run.
-- =====================================================================

-- 1) Catálogo do Explorar fica nas coleções do painel: libera a leitura para quem está logada
drop policy if exists colecoes_ler on public.colecoes;
create policy colecoes_ler on public.colecoes for select to authenticated using (
  nome in ('cidades','segmentos','config','freq','anunciantes','campanhas','parceiros','profissionais','avisos','receitasExtras','exercExtras','receitasOcultas',
           'empresas','servicos','produtos','banners','categorias')
  or (nome = 'cupons' and dados->>'user' = auth.uid()::text)
  or e_admin()
);
insert into public.colecoes (nome, id, dados) values ('cidades', '50', '{"id":50,"nome":"Barra do Garças","uf":"MT","ativa":true}') on conflict (nome, id) do nothing;

-- função de apoio (criada na comunidade; garante que existe)
create or replace function public.pode_postar() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and not exists (select 1 from alunas where id = auth.uid() and bloqueado)
$$;

-- 2) Agendamentos
create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text, whats text,
  alvo_tipo text not null, alvo_id text not null, alvo_nome text,
  servico_id text, servico_nome text,
  data date not null, hora text not null,
  preco numeric, modo text, local text,
  obs text check (char_length(coalesce(obs, '')) <= 500),
  status text not null default 'solicitado' check (status in ('solicitado','confirmado','concluido','cancelado','faltou')),
  criado timestamptz not null default now(), atualizado timestamptz not null default now()
);
create index if not exists agendamentos_user_idx on public.agendamentos (user_id, data);
alter table public.agendamentos enable row level security;
-- versão simples e segura: aluna só muda o status para cancelado
create or replace function public.protege_agendamento() returns trigger
language plpgsql security definer set search_path = public as $$
declare novo text;
begin
  if e_admin() then new.atualizado := now(); return new; end if;
  if tg_op = 'INSERT' then new.status := 'solicitado'; new.user_id := auth.uid(); new.atualizado := now(); return new; end if;
  novo := case when new.status = 'cancelado' then 'cancelado' else old.status end;
  new := old; new.status := novo; new.atualizado := now();
  return new;
end $$;
drop trigger if exists protege_agendamento on public.agendamentos;
create trigger protege_agendamento before insert or update on public.agendamentos for each row execute function public.protege_agendamento();
drop policy if exists ag_ler on public.agendamentos;
create policy ag_ler on public.agendamentos for select to authenticated using (user_id = auth.uid() or e_admin());
drop policy if exists ag_criar on public.agendamentos;
create policy ag_criar on public.agendamentos for insert to authenticated with check (user_id = auth.uid() and pode_postar());
drop policy if exists ag_mudar on public.agendamentos;
create policy ag_mudar on public.agendamentos for update to authenticated using (user_id = auth.uid() or e_admin());
drop policy if exists ag_apagar on public.agendamentos;
create policy ag_apagar on public.agendamentos for delete to authenticated using (e_admin());

-- 3) Avaliações (1 por aluna em cada lugar; empresa/profissional não edita)
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  alvo_tipo text not null check (alvo_tipo in ('empresa','profissional','servico','produto','clube')),
  alvo_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null,
  nota int not null check (nota between 1 and 5),
  texto text check (char_length(coalesce(texto, '')) <= 600),
  verificada boolean not null default false,
  oculta boolean not null default false,
  denuncias int not null default 0,
  criado timestamptz not null default now(),
  unique (alvo_tipo, alvo_id, user_id)
);
alter table public.avaliacoes enable row level security;
create or replace function public.protege_avaliacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if e_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid(); new.oculta := false; new.denuncias := 0;
    new.verificada := exists (select 1 from agendamentos a where a.user_id = auth.uid() and a.alvo_id = new.alvo_id and a.status = 'concluido');
  else
    new.verificada := old.verificada; new.oculta := old.oculta; new.denuncias := old.denuncias; new.user_id := old.user_id;
  end if;
  return new;
end $$;
drop trigger if exists protege_avaliacao on public.avaliacoes;
create trigger protege_avaliacao before insert or update on public.avaliacoes for each row execute function public.protege_avaliacao();
drop policy if exists av_ler on public.avaliacoes;
create policy av_ler on public.avaliacoes for select to authenticated using (not oculta or user_id = auth.uid() or e_admin());
drop policy if exists av_criar on public.avaliacoes;
create policy av_criar on public.avaliacoes for insert to authenticated with check (user_id = auth.uid() and pode_postar());
drop policy if exists av_mudar on public.avaliacoes;
create policy av_mudar on public.avaliacoes for update to authenticated using (user_id = auth.uid() or e_admin());
drop policy if exists av_apagar on public.avaliacoes;
create policy av_apagar on public.avaliacoes for delete to authenticated using (user_id = auth.uid() or e_admin());
create or replace function public.denunciar_avaliacao(p_id uuid) returns void
language sql security definer set search_path = public as $$ update avaliacoes set denuncias = denuncias + 1 where id = p_id and auth.uid() is not null $$;
grant execute on function public.denunciar_avaliacao(uuid) to authenticated;

-- 4) Métricas de cliques (sem dados de saúde)
create table if not exists public.cliques (
  id bigserial primary key,
  t text not null check (char_length(t) <= 40),
  alvo_tipo text, alvo_id text,
  u uuid default auth.uid(),
  d date not null default current_date,
  criado timestamptz not null default now()
);
create index if not exists cliques_d_idx on public.cliques (d);
alter table public.cliques enable row level security;
drop policy if exists cl_criar on public.cliques;
create policy cl_criar on public.cliques for insert to authenticated with check (u = auth.uid());
drop policy if exists cl_ler on public.cliques;
create policy cl_ler on public.cliques for select to authenticated using (e_admin());

-- 5) Meu Ciclo: dados sensíveis. SÓ a própria aluna lê e grava. O painel NÃO tem acesso individual.
create table if not exists public.ciclo (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  dados jsonb not null default '{}'::jsonb,
  atualizado timestamptz not null default now()
);
alter table public.ciclo enable row level security;
drop policy if exists ciclo_dono on public.ciclo;
create policy ciclo_dono on public.ciclo for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- números gerais para o painel, sem expor ninguém
create or replace function public.ciclo_resumo() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not e_admin() then return null; end if;
  return json_build_object(
    'ativas', (select count(*) from ciclo where ativo),
    'total', (select count(*) from ciclo),
    'checkins_7d', (select count(*) from ciclo c, jsonb_object_keys(coalesce(c.dados->'checkins', '{}'::jsonb)) k where k >= to_char(current_date - 6, 'YYYY-MM-DD'))
  );
end $$;
grant execute on function public.ciclo_resumo() to authenticated;

-- 6) Chat entre alunas
create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  nome_a text, foto_a text, nome_b text, foto_b text,
  ultima text, ultima_em timestamptz not null default now(),
  lida_a timestamptz not null default now(), lida_b timestamptz,
  criado timestamptz not null default now(),
  unique (a, b), check (a <> b)
);
alter table public.conversas enable row level security;
drop policy if exists cv_ler on public.conversas;
create policy cv_ler on public.conversas for select to authenticated using (auth.uid() in (a, b));
drop policy if exists cv_criar on public.conversas;
create policy cv_criar on public.conversas for insert to authenticated with check (auth.uid() = a and pode_postar());
drop policy if exists cv_mudar on public.conversas;
create policy cv_mudar on public.conversas for update to authenticated using (auth.uid() in (a, b));
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references public.conversas(id) on delete cascade,
  autor uuid not null default auth.uid() references auth.users(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 2000),
  criado timestamptz not null default now()
);
create index if not exists mensagens_conv_idx on public.mensagens (conversa_id, criado);
alter table public.mensagens enable row level security;
drop policy if exists mg_ler on public.mensagens;
create policy mg_ler on public.mensagens for select to authenticated using (exists (select 1 from conversas c where c.id = conversa_id and auth.uid() in (c.a, c.b)));
drop policy if exists mg_criar on public.mensagens;
create policy mg_criar on public.mensagens for insert to authenticated with check (autor = auth.uid() and pode_postar() and exists (select 1 from conversas c where c.id = conversa_id and auth.uid() in (c.a, c.b)));
drop policy if exists mg_apagar on public.mensagens;
create policy mg_apagar on public.mensagens for delete to authenticated using (autor = auth.uid());
create or replace function public.atualiza_conversa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update conversas set ultima = left(new.texto, 90), ultima_em = new.criado,
    lida_a = case when a = new.autor then new.criado else lida_a end,
    lida_b = case when b = new.autor then new.criado else lida_b end
  where id = new.conversa_id;
  return new;
end $$;
drop trigger if exists atualiza_conversa on public.mensagens;
create trigger atualiza_conversa after insert on public.mensagens for each row execute function public.atualiza_conversa();

select 'Expansão pronta' as status;
