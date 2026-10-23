-- =====================================================================
-- CK Life · Expansão: Explorar, agendamentos, avaliações, Meu Ciclo, chat
-- e permissões do painel conferidas pelo banco.
-- Só ADICIONA. Não apaga tabela, coluna nem registro. Pode rodar de novo.
-- Supabase > SQL Editor > New query > colar tudo > Run.
-- =====================================================================

-- 0) Permissão por área do painel, conferida no banco
--    (acesso total, ou "editar" naquela área). Ler continua sendo de qualquer admin.
create or replace function public.admin_pode(p_area text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid()
    and (coalesce((perms->>'total')::boolean, false) or perms->>p_area = 'editar'))
$$;
grant execute on function public.admin_pode(text) to authenticated;
create or replace function public.area_colecao(p_nome text) returns text
language sql immutable as $$
  select case
    when p_nome in ('parceiros','pins') then 'parceiros'
    when p_nome = 'pagamentos' then 'financeiro'
    when p_nome in ('receitasExtras','receitasOcultas') then 'receitas'
    when p_nome = 'exercExtras' then 'exercicios'
    when p_nome in ('config','freq') then 'config'
    else p_nome end
$$;

-- 1) Coleções novas do catálogo: leitura liberada para quem está logada
drop policy if exists colecoes_ler on public.colecoes;
create policy colecoes_ler on public.colecoes for select to authenticated using (
  nome in ('cidades','segmentos','config','freq','anunciantes','campanhas','parceiros','profissionais','avisos','receitasExtras','exercExtras','receitasOcultas',
           'empresas','servicos','produtos','banners','categorias')
  or (nome = 'cupons' and dados->>'user' = auth.uid()::text)
  or e_admin()
);
drop policy if exists colecoes_criar_cupom on public.colecoes;
create policy colecoes_criar_cupom on public.colecoes for insert to authenticated with check (
  admin_pode(area_colecao(nome)) or (nome = 'cupons' and dados->>'user' = auth.uid()::text and coalesce((dados->>'usado')::boolean, false) = false)
);
drop policy if exists colecoes_mudar on public.colecoes;
create policy colecoes_mudar on public.colecoes for update using (admin_pode(area_colecao(nome))) with check (admin_pode(area_colecao(nome)));
drop policy if exists colecoes_apagar on public.colecoes;
create policy colecoes_apagar on public.colecoes for delete using (admin_pode(area_colecao(nome)));

-- alunas: a própria aluna continua mexendo no que é dela; no painel, só quem pode editar "Alunas"
drop policy if exists alunas_criar on public.alunas;
create policy alunas_criar on public.alunas for insert with check (id = auth.uid() or admin_pode('alunos'));
drop policy if exists alunas_mudar on public.alunas;
create policy alunas_mudar on public.alunas for update using (id = auth.uid() or admin_pode('alunos'));
drop policy if exists alunas_apagar on public.alunas;
create policy alunas_apagar on public.alunas for delete using (admin_pode('alunos'));
drop policy if exists admins_mudar on public.admins;
create policy admins_mudar on public.admins for all using (admin_pode('admins')) with check (admin_pode('admins'));
drop policy if exists posts_moderar on public.posts;
create policy posts_moderar on public.posts for update to authenticated using (admin_pode('comunidade')) with check (admin_pode('comunidade'));

-- imagens do catálogo (logo, capa, galeria, produtos, banners): pasta pública, só o painel envia
insert into storage.buckets (id, name, public) values ('catalogo', 'catalogo', true) on conflict (id) do nothing;
drop policy if exists catalogo_ler on storage.objects;
create policy catalogo_ler on storage.objects for select using (bucket_id = 'catalogo');
drop policy if exists catalogo_enviar on storage.objects;
create policy catalogo_enviar on storage.objects for insert to authenticated with check (bucket_id = 'catalogo' and e_admin());
drop policy if exists catalogo_trocar on storage.objects;
create policy catalogo_trocar on storage.objects for update to authenticated using (bucket_id = 'catalogo' and e_admin());
drop policy if exists catalogo_apagar on storage.objects;
create policy catalogo_apagar on storage.objects for delete to authenticated using (bucket_id = 'catalogo' and e_admin());

-- garante a função da comunidade (igual à do comunidade.sql)
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
  nota_adm text,
  criado timestamptz not null default now(), atualizado timestamptz not null default now()
);
create index if not exists agendamentos_user_idx on public.agendamentos (user_id, data);
create index if not exists agendamentos_alvo_idx on public.agendamentos (alvo_tipo, alvo_id, data);
alter table public.agendamentos enable row level security;
create or replace function public.protege_agendamento() returns trigger
language plpgsql security definer set search_path = public as $$
declare novo text;
begin
  if admin_pode('agendamentos') then new.atualizado := now(); return new; end if;
  if tg_op = 'INSERT' then new.status := 'solicitado'; new.user_id := auth.uid(); new.nota_adm := null; new.atualizado := now(); return new; end if;
  -- a aluna só consegue cancelar o próprio agendamento
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
create policy ag_mudar on public.agendamentos for update to authenticated using (user_id = auth.uid() or admin_pode('agendamentos'));
drop policy if exists ag_apagar on public.agendamentos;
create policy ag_apagar on public.agendamentos for delete to authenticated using (admin_pode('agendamentos'));
-- horários já ocupados (sem mostrar quem marcou)
create or replace function public.horarios_ocupados(p_tipo text, p_id text, p_de date, p_ate date) returns table(data date, hora text)
language sql stable security definer set search_path = public as $$
  select ag.data, ag.hora from agendamentos ag where ag.alvo_tipo = p_tipo and ag.alvo_id = p_id and ag.data between p_de and p_ate and ag.status in ('solicitado','confirmado')
$$;
grant execute on function public.horarios_ocupados(text, text, date, date) to authenticated;

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
create index if not exists avaliacoes_alvo_idx on public.avaliacoes (alvo_tipo, alvo_id);
alter table public.avaliacoes enable row level security;
create or replace function public.protege_avaliacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if admin_pode('avaliacoes') then return new; end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid(); new.oculta := false; new.denuncias := 0;
    new.verificada := exists (select 1 from agendamentos a where a.user_id = auth.uid() and a.alvo_id = new.alvo_id and a.status = 'concluido');
  else
    new.verificada := old.verificada; new.oculta := old.oculta; new.denuncias := old.denuncias; new.user_id := old.user_id;
    new.alvo_tipo := old.alvo_tipo; new.alvo_id := old.alvo_id;
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
create policy av_mudar on public.avaliacoes for update to authenticated using (user_id = auth.uid() or admin_pode('avaliacoes'));
drop policy if exists av_apagar on public.avaliacoes;
create policy av_apagar on public.avaliacoes for delete to authenticated using (user_id = auth.uid() or admin_pode('avaliacoes'));
create or replace function public.denunciar_avaliacao(p_id uuid) returns void
language sql security definer set search_path = public as $$ update avaliacoes set denuncias = denuncias + 1 where id = p_id and auth.uid() is not null $$;
grant execute on function public.denunciar_avaliacao(uuid) to authenticated;

-- 4) Meu Ciclo: dado sensível. SÓ a própria aluna lê e grava. O painel NÃO tem acesso individual.
create table if not exists public.ciclo (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  dados jsonb not null default '{}'::jsonb,
  atualizado timestamptz not null default now()
);
alter table public.ciclo enable row level security;
drop policy if exists ciclo_dono on public.ciclo;
create policy ciclo_dono on public.ciclo for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- só números gerais para o painel, sem identificar ninguém
create or replace function public.ciclo_resumo() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_pode('ciclo') and not exists (select 1 from admins where user_id = auth.uid() and perms ? 'ciclo') then return null; end if;
  return json_build_object(
    'ativas', (select count(*) from ciclo where ativo),
    'total', (select count(*) from ciclo),
    'checkins_7d', (select count(*) from ciclo c, jsonb_object_keys(coalesce(c.dados->'checkins', '{}'::jsonb)) k where c.ativo and k >= to_char(current_date - 6, 'YYYY-MM-DD'))
  );
end $$;
grant execute on function public.ciclo_resumo() to authenticated;

-- 5) Chat entre alunas (1 a 1)
create table if not exists public.conversas (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  nome_a text, foto_a text, nome_b text, foto_b text,
  ultima text, ultima_em timestamptz not null default now(), ultimo_autor uuid,
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
  update conversas set ultima = left(new.texto, 90), ultima_em = new.criado, ultimo_autor = new.autor,
    lida_a = case when a = new.autor then new.criado else lida_a end,
    lida_b = case when b = new.autor then new.criado else lida_b end
  where id = new.conversa_id;
  return new;
end $$;
drop trigger if exists atualiza_conversa on public.mensagens;
create trigger atualiza_conversa after insert on public.mensagens for each row execute function public.atualiza_conversa();

select 'Expansão pronta' as status;
