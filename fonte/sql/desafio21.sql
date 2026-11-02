-- =====================================================================
-- CK Life · CK 21 DIAS JUNTAS (edições em turma, comunidade controlada, métricas)
-- Só ACRESCENTA tabelas e funções novas. Não apaga nem altera nada que já existe.
-- Pode rodar de novo sem perder dados.
-- O dia da turma vem do relógio do servidor (America/Sao_Paulo), nunca do celular.
-- =====================================================================

create or replace function public.d21_hoje() returns date
language sql stable as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- ---------- 1) Edições ----------
create table if not exists public.d21_edicoes (
  id uuid primary key default gen_random_uuid(),
  numero int not null default 1 check (numero between 1 and 9999),
  nome text not null default 'CK 21 Dias Juntas' check (char_length(nome) between 3 and 80),
  frase text not null default '21 dias juntas. Não 21 dias perfeitos.' check (char_length(frase) <= 140),
  descricao text check (char_length(coalesce(descricao, '')) <= 3000),
  capa text check (capa is null or capa ~ '^(https://|img/)'),
  inscricao_ini date,
  inicio date not null,
  fim date not null,
  status text not null default 'rascunho' check (status in ('rascunho','inscricoes','aguardando','andamento','finalizada','arquivada')),
  whatsapp text check (whatsapp is null or whatsapp ~ '^https://(chat\.whatsapp\.com|wa\.me|whatsapp\.com|api\.whatsapp\.com)/'),
  config jsonb not null default '{"hora_dia":7,"hora_lembrete":19,"notificar":true}'::jsonb,
  dias jsonb not null default '[]'::jsonb,        -- rascunho da Micaela
  dias_pub jsonb not null default '[]'::jsonb,    -- o que as participantes veem (só muda ao PUBLICAR)
  publicado_em timestamptz,
  criado timestamptz not null default now(),
  atualizado timestamptz not null default now(),
  check (fim = inicio + 20)
);
create index if not exists d21_edicoes_status_idx on public.d21_edicoes (status, inicio);

-- ---------- 2) Participantes (entrar no desafio = entrar na comunidade da edição) ----------
create table if not exists public.d21_inscricoes (
  edicao_id uuid not null references public.d21_edicoes(id) on delete cascade,
  user_id uuid not null,
  modo text not null default 'normal' check (modo in ('normal','hard','supreme')),
  entrou timestamptz not null default now(),
  saiu_em timestamptz,
  primary key (edicao_id, user_id)
);
create index if not exists d21_insc_user_idx on public.d21_inscricoes (user_id);

-- ---------- 3) Presença de cada dia (um registro por dia; Plano B fica separado) ----------
create table if not exists public.d21_registros (
  edicao_id uuid not null references public.d21_edicoes(id) on delete cascade,
  user_id uuid not null,
  dia smallint not null check (dia between 1 and 21),
  tipo text not null check (tipo in ('completo','planob')),
  modo text not null default 'normal' check (modo in ('normal','hard','supreme')),
  min smallint check (min between 0 and 300),
  data date not null default public.d21_hoje(),
  feito timestamptz not null default now(),
  primary key (edicao_id, user_id, dia)
);
create index if not exists d21_reg_data_idx on public.d21_registros (edicao_id, data);
create index if not exists d21_reg_dia_idx on public.d21_registros (edicao_id, dia);

-- treinos iniciados (para saber onde abandonam)
create table if not exists public.d21_inicios (
  edicao_id uuid not null references public.d21_edicoes(id) on delete cascade,
  user_id uuid not null,
  dia smallint not null check (dia between 1 and 21),
  modo text not null default 'normal' check (modo in ('normal','hard','supreme','planob')),
  criado timestamptz not null default now(),
  primary key (edicao_id, user_id, dia, modo)
);

-- ---------- 4) Comunidade controlada: só a equipe publica ----------
create table if not exists public.d21_posts (
  id uuid primary key default gen_random_uuid(),
  edicao_id uuid not null references public.d21_edicoes(id) on delete cascade,
  tipo text not null default 'mensagem' check (tipo in ('mensagem','aviso','chamada','enquete','checkin','conquista')),
  titulo text check (char_length(coalesce(titulo, '')) <= 120),
  texto text check (char_length(coalesce(texto, '')) <= 2000),
  opcoes jsonb not null default '[]'::jsonb,          -- [{"id":"a","t":"Manhã"}]
  multipla boolean not null default false,
  pode_mudar boolean not null default true,
  resultado text not null default 'sempre' check (resultado in ('sempre','depois','fim')),
  prazo timestamptz,
  fixado boolean not null default false,
  botao text check (botao is null or botao in ('treino','receita','jornada','whatsapp')),
  dia smallint check (dia is null or dia between 1 and 21),
  publicar_em timestamptz not null default now(),
  notificar boolean not null default false,
  notificado timestamptz,
  apagado boolean not null default false,
  autor uuid default auth.uid(),
  criado timestamptz not null default now()
);
create index if not exists d21_posts_feed_idx on public.d21_posts (edicao_id, publicar_em desc);

create table if not exists public.d21_reacoes (
  post_id uuid not null references public.d21_posts(id) on delete cascade,
  user_id uuid not null,
  emoji text not null check (emoji in ('🔥','💚','💪','😍','🥵','🙋‍♀️','👏','🙌')),
  criado timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.d21_votos (
  post_id uuid not null references public.d21_posts(id) on delete cascade,
  user_id uuid not null,
  opcao text not null check (char_length(opcao) between 1 and 20),
  criado timestamptz not null default now(),
  primary key (post_id, user_id, opcao)
);
create table if not exists public.d21_vistas (
  post_id uuid not null references public.d21_posts(id) on delete cascade,
  user_id uuid not null,
  primary key (post_id, user_id)
);
-- contadores prontos (o feed nunca conta milhares de linhas na hora)
create table if not exists public.d21_contagens (
  post_id uuid not null references public.d21_posts(id) on delete cascade,
  chave text not null,          -- 'r:🔥', 'v:a', 'vistas', 'votantes'
  n int not null default 0,
  primary key (post_id, chave)
);
create or replace function public._d21_conta(p_post uuid, p_chave text, p_delta int) returns void
language sql security definer set search_path = public as $$
  insert into d21_contagens (post_id, chave, n) values (p_post, p_chave, greatest(0, p_delta))
  on conflict (post_id, chave) do update set n = greatest(0, d21_contagens.n + p_delta);
$$;
revoke all on function public._d21_conta(uuid, text, int) from public, anon, authenticated;
create or replace function public._d21_conta_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'd21_reacoes' then
    if tg_op in ('DELETE','UPDATE') then perform _d21_conta(old.post_id, 'r:' || old.emoji, -1); end if;
    if tg_op in ('INSERT','UPDATE') then perform _d21_conta(new.post_id, 'r:' || new.emoji, 1); end if;
  elsif tg_table_name = 'd21_votos' then
    if tg_op = 'DELETE' then perform _d21_conta(old.post_id, 'v:' || old.opcao, -1); end if;
    if tg_op = 'INSERT' then perform _d21_conta(new.post_id, 'v:' || new.opcao, 1); end if;
  elsif tg_table_name = 'd21_vistas' then
    if tg_op = 'INSERT' then perform _d21_conta(new.post_id, 'vistas', 1); end if;
  end if;
  return null;
end $$;
drop trigger if exists d21_reacoes_conta on public.d21_reacoes;
create trigger d21_reacoes_conta after insert or update or delete on public.d21_reacoes for each row execute function public._d21_conta_trg();
drop trigger if exists d21_votos_conta on public.d21_votos;
create trigger d21_votos_conta after insert or delete on public.d21_votos for each row execute function public._d21_conta_trg();
drop trigger if exists d21_vistas_conta on public.d21_vistas;
create trigger d21_vistas_conta after insert on public.d21_vistas for each row execute function public._d21_conta_trg();

-- pesquisa final (nunca vira depoimento público)
create table if not exists public.d21_pesquisa (
  edicao_id uuid not null references public.d21_edicoes(id) on delete cascade,
  user_id uuid not null,
  nota smallint not null check (nota between 0 and 10),
  gostou text check (char_length(coalesce(gostou, '')) <= 1000),
  melhorar text check (char_length(coalesce(melhorar, '')) <= 1000),
  outra boolean,
  criado timestamptz not null default now(),
  primary key (edicao_id, user_id)
);
-- controle das notificações automáticas (uma vez por chave)
create table if not exists public.d21_envios (
  edicao_id uuid not null references public.d21_edicoes(id) on delete cascade,
  chave text not null,
  criado timestamptz not null default now(),
  primary key (edicao_id, chave)
);

-- ---------- 5) Segurança (RLS): participante não lê nem escreve tabela direto; usa as funções abaixo ----------
alter table public.d21_edicoes enable row level security;
alter table public.d21_inscricoes enable row level security;
alter table public.d21_registros enable row level security;
alter table public.d21_inicios enable row level security;
alter table public.d21_posts enable row level security;
alter table public.d21_reacoes enable row level security;
alter table public.d21_votos enable row level security;
alter table public.d21_vistas enable row level security;
alter table public.d21_contagens enable row level security;
alter table public.d21_pesquisa enable row level security;
alter table public.d21_envios enable row level security;

drop policy if exists d21e_adm on public.d21_edicoes;
create policy d21e_adm on public.d21_edicoes for select to authenticated using (admin_ve('desafios'));
drop policy if exists d21e_criar on public.d21_edicoes;
create policy d21e_criar on public.d21_edicoes for insert to authenticated with check (admin_pode('desafios'));
drop policy if exists d21e_mudar on public.d21_edicoes;
create policy d21e_mudar on public.d21_edicoes for update to authenticated using (admin_pode('desafios')) with check (admin_pode('desafios'));
drop policy if exists d21e_apagar on public.d21_edicoes;
create policy d21e_apagar on public.d21_edicoes for delete to authenticated using (admin_pode('desafios') and status = 'rascunho');   -- edição com turma nunca é apagada (só arquivada)
drop policy if exists d21p_adm on public.d21_posts;
create policy d21p_adm on public.d21_posts for all to authenticated using (admin_pode('desafios')) with check (admin_pode('desafios'));
drop policy if exists d21i_meu on public.d21_inscricoes;
create policy d21i_meu on public.d21_inscricoes for select to authenticated using (user_id = auth.uid() or admin_pode('desafios'));
drop policy if exists d21r_meu on public.d21_registros;
create policy d21r_meu on public.d21_registros for select to authenticated using (user_id = auth.uid() or admin_pode('desafios'));
drop policy if exists d21pq_adm on public.d21_pesquisa;
create policy d21pq_adm on public.d21_pesquisa for select to authenticated using (user_id = auth.uid() or admin_pode('desafios'));
-- reações, votos, vistas, contagens, inícios e envios: nenhuma política = ninguém acessa direto (só pelas funções)
revoke all on public.d21_reacoes, public.d21_votos, public.d21_vistas, public.d21_contagens, public.d21_inicios, public.d21_envios from anon;
revoke insert, update, delete on public.d21_inscricoes, public.d21_registros, public.d21_pesquisa from anon, authenticated;

-- ---------- 6) Funções da participante ----------
-- edição ativa: escolhe a que ela participa (não finalizada); senão a aberta mais próxima
create or replace function public._d21_dia(e d21_edicoes) returns int
language sql stable as $$ select (d21_hoje() - e.inicio + 1)::int $$;

create or replace function public._d21_fase(e d21_edicoes) returns text
language sql stable as $$
  select case when e.status in ('rascunho','arquivada') then e.status
              when d21_hoje() > e.fim or e.status = 'finalizada' then 'finalizada'
              when d21_hoje() >= e.inicio then 'andamento'
              when e.status = 'aguardando' then 'aguardando'
              else 'inscricoes' end
$$;

create or replace function public._d21_resumo(p_ed uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'inscritas', (select count(*) from d21_inscricoes where edicao_id = p_ed and saiu_em is null),
    'treinaram_hoje', (select count(*) from d21_registros where edicao_id = p_ed and data = d21_hoje()),
    'hard_hoje', (select count(*) from d21_registros where edicao_id = p_ed and data = d21_hoje() and modo = 'hard'),
    'supreme_hoje', (select count(*) from d21_registros where edicao_id = p_ed and data = d21_hoje() and modo = 'supreme'),
    'planob_hoje', (select count(*) from d21_registros where edicao_id = p_ed and data = d21_hoje() and tipo = 'planob'),
    'no_hard', (select count(*) from d21_inscricoes where edicao_id = p_ed and saiu_em is null and modo = 'hard'),
    'total_treinos', (select count(*) from d21_registros where edicao_id = p_ed))
$$;
revoke all on function public._d21_resumo(uuid) from public, anon, authenticated;

create or replace function public.d21_estado() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); e d21_edicoes; i d21_inscricoes; r jsonb;
begin
  if me is null then return jsonb_build_object('hoje', d21_hoje()); end if;
  -- 1º: a edição em que ela está e que ainda não terminou (ou terminou há até 14 dias)
  select ed.* into e from d21_edicoes ed join d21_inscricoes x on x.edicao_id = ed.id and x.user_id = me and x.saiu_em is null
    where ed.status not in ('rascunho','arquivada') and ed.fim >= d21_hoje() - 14 order by ed.inicio desc limit 1;
  -- 2º: a edição aberta para inscrição / em andamento
  if e.id is null then
    select * into e from d21_edicoes where status in ('inscricoes','aguardando','andamento') and fim >= d21_hoje() order by inicio limit 1;
  end if;
  r := jsonb_build_object('hoje', d21_hoje(), 'agora', now(),
    'historico', coalesce((select jsonb_agg(jsonb_build_object('id', ed.id, 'nome', ed.nome, 'numero', ed.numero, 'inicio', ed.inicio, 'fim', ed.fim,
        'feitos', (select count(*) from d21_registros g where g.edicao_id = ed.id and g.user_id = me),
        'planob', (select count(*) from d21_registros g where g.edicao_id = ed.id and g.user_id = me and g.tipo = 'planob')) order by ed.inicio desc)
      from d21_edicoes ed join d21_inscricoes x on x.edicao_id = ed.id and x.user_id = me where ed.status <> 'rascunho'), '[]'::jsonb));
  if e.id is null then return r; end if;
  select * into i from d21_inscricoes where edicao_id = e.id and user_id = me;
  return r || jsonb_build_object(
    'edicao', jsonb_build_object('id', e.id, 'numero', e.numero, 'nome', e.nome, 'frase', e.frase, 'descricao', e.descricao, 'capa', e.capa,
      'inicio', e.inicio, 'fim', e.fim, 'fase', _d21_fase(e), 'dia', _d21_dia(e), 'whatsapp', case when i.user_id is not null and i.saiu_em is null then e.whatsapp end,
      'publicado_em', e.publicado_em, 'dias', e.dias_pub),
    'inscrita', case when i.user_id is null then null else jsonb_build_object('modo', i.modo, 'entrou', i.entrou, 'saiu_em', i.saiu_em) end,
    'registros', coalesce((select jsonb_agg(jsonb_build_object('dia', g.dia, 'tipo', g.tipo, 'modo', g.modo, 'data', g.data) order by g.dia) from d21_registros g where g.edicao_id = e.id and g.user_id = me), '[]'::jsonb),
    'resumo', _d21_resumo(e.id));
end $$;
grant execute on function public.d21_estado() to authenticated;

create or replace function public.d21_entrar(p_edicao uuid, p_modo text default 'normal') returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); e d21_edicoes;
begin
  if me is null then raise exception 'entre na sua conta'; end if;
  select * into e from d21_edicoes where id = p_edicao;
  if e.id is null or _d21_fase(e) not in ('inscricoes','aguardando','andamento') then raise exception 'esta edição não está aberta'; end if;
  if p_modo not in ('normal','hard','supreme') then p_modo := 'normal'; end if;
  insert into d21_inscricoes (edicao_id, user_id, modo) values (e.id, me, p_modo)
    on conflict (edicao_id, user_id) do update set saiu_em = null;   -- voltar depois de sair: continua de onde estava
  return jsonb_build_object('ok', true, 'dia', _d21_dia(e));
end $$;
grant execute on function public.d21_entrar(uuid, text) to authenticated;

create or replace function public.d21_sair(p_edicao uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update d21_inscricoes set saiu_em = now() where edicao_id = p_edicao and user_id = auth.uid() and saiu_em is null;
  return found;
end $$;
grant execute on function public.d21_sair(uuid) to authenticated;

create or replace function public.d21_modo(p_edicao uuid, p_modo text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_modo not in ('normal','hard','supreme') then raise exception 'modo inválido'; end if;
  update d21_inscricoes set modo = p_modo where edicao_id = p_edicao and user_id = auth.uid() and saiu_em is null;
  return found;
end $$;
grant execute on function public.d21_modo(uuid, text) to authenticated;

-- começou o treino de hoje (métrica de abandono)
create or replace function public.d21_iniciou(p_edicao uuid, p_modo text) returns void
language plpgsql security definer set search_path = public as $$
declare e d21_edicoes; d int;
begin
  select * into e from d21_edicoes where id = p_edicao; if e.id is null then return; end if;
  d := _d21_dia(e); if d < 1 or d > 21 then return; end if;
  if not exists (select 1 from d21_inscricoes where edicao_id = p_edicao and user_id = auth.uid() and saiu_em is null) then return; end if;
  insert into d21_inicios (edicao_id, user_id, dia, modo) values (p_edicao, auth.uid(), d, case when p_modo in ('normal','hard','supreme','planob') then p_modo else 'normal' end) on conflict do nothing;
end $$;
grant execute on function public.d21_iniciou(uuid, text) to authenticated;

-- concluiu o dia de hoje (o servidor decide qual é o dia; não dá para marcar dia passado ou futuro)
create or replace function public.d21_registrar(p_edicao uuid, p_tipo text, p_modo text, p_min int default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); e d21_edicoes; d int;
begin
  if me is null then raise exception 'entre na sua conta'; end if;
  select * into e from d21_edicoes where id = p_edicao;
  if e.id is null then raise exception 'edição não encontrada'; end if;
  d := _d21_dia(e);
  if d < 1 or d > 21 or _d21_fase(e) <> 'andamento' then raise exception 'o desafio não está em andamento hoje'; end if;
  if not exists (select 1 from d21_inscricoes where edicao_id = e.id and user_id = me and saiu_em is null) then raise exception 'você não está nesta edição'; end if;
  if p_tipo not in ('completo','planob') then p_tipo := 'completo'; end if;
  if p_modo not in ('normal','hard','supreme') then p_modo := 'normal'; end if;
  insert into d21_registros (edicao_id, user_id, dia, tipo, modo, min) values (e.id, me, d, p_tipo, p_modo, least(greatest(coalesce(p_min, 0), 0), 300))
    on conflict (edicao_id, user_id, dia) do update set
      tipo = case when d21_registros.tipo = 'completo' then 'completo' else excluded.tipo end,   -- treino completo nunca vira Plano B
      modo = case when excluded.tipo = 'completo' then excluded.modo else d21_registros.modo end,
      min = greatest(coalesce(d21_registros.min, 0), coalesce(excluded.min, 0)), feito = now();
  return jsonb_build_object('ok', true, 'dia', d, 'resumo', _d21_resumo(e.id));
end $$;
grant execute on function public.d21_registrar(uuid, text, text, int) to authenticated;

-- feed da comunidade da edição (só participantes; com contagens prontas e o que ela já marcou)
create or replace function public.d21_feed(p_edicao uuid, p_antes timestamptz default null, p_limite int default 20) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); e d21_edicoes;
begin
  select * into e from d21_edicoes where id = p_edicao;
  if e.id is null or not (exists (select 1 from d21_inscricoes where edicao_id = p_edicao and user_id = me) or admin_ve('desafios')) then raise exception 'só para participantes'; end if;
  return coalesce((select jsonb_agg(x order by (x->>'fixado')::boolean desc, x->>'publicar_em' desc) from (
    select jsonb_build_object('id', p.id, 'tipo', p.tipo, 'titulo', p.titulo, 'texto', p.texto, 'opcoes', p.opcoes, 'multipla', p.multipla, 'pode_mudar', p.pode_mudar,
      'resultado', p.resultado, 'prazo', p.prazo, 'fixado', p.fixado and p_antes is null, 'botao', p.botao, 'dia', p.dia, 'publicar_em', p.publicar_em,
      'contagens', coalesce((select jsonb_object_agg(c.chave, c.n) from d21_contagens c where c.post_id = p.id and c.n > 0), '{}'::jsonb),
      'votantes', (select count(distinct v.user_id) from d21_votos v where v.post_id = p.id and p.tipo in ('enquete','checkin')),
      'minha_reacao', (select r.emoji from d21_reacoes r where r.post_id = p.id and r.user_id = me),
      'meus_votos', coalesce((select jsonb_agg(v.opcao) from d21_votos v where v.post_id = p.id and v.user_id = me), '[]'::jsonb)) x
    from d21_posts p
    where p.edicao_id = p_edicao and not p.apagado and p.publicar_em <= now() and (p_antes is null or p.publicar_em < p_antes)
    order by (p.fixado and p_antes is null) desc, p.publicar_em desc limit least(greatest(coalesce(p_limite, 20), 1), 50)) z), '[]'::jsonb);
end $$;
grant execute on function public.d21_feed(uuid, timestamptz, int) to authenticated;

create or replace function public._d21_pode_interagir(p_post uuid) returns d21_posts
language plpgsql stable security definer set search_path = public as $$
declare p d21_posts;
begin
  select * into p from d21_posts where id = p_post and not apagado and publicar_em <= now();
  if p.id is null then raise exception 'publicação não encontrada'; end if;
  if not exists (select 1 from d21_inscricoes where edicao_id = p.edicao_id and user_id = auth.uid() and saiu_em is null) then raise exception 'só para participantes'; end if;
  return p;
end $$;
revoke all on function public._d21_pode_interagir(uuid) from public, anon, authenticated;

-- reagir: toca = marca; toca no mesmo = tira; toca em outro = troca (uma reação por pessoa)
create or replace function public.d21_reagir(p_post uuid, p_emoji text) returns text
language plpgsql security definer set search_path = public as $$
declare p d21_posts; atual text;
begin
  p := _d21_pode_interagir(p_post);
  select emoji into atual from d21_reacoes where post_id = p.id and user_id = auth.uid();
  if p_emoji is null or p_emoji = atual then delete from d21_reacoes where post_id = p.id and user_id = auth.uid(); return null; end if;
  insert into d21_reacoes (post_id, user_id, emoji) values (p.id, auth.uid(), p_emoji)
    on conflict (post_id, user_id) do update set emoji = excluded.emoji, criado = now();
  return p_emoji;
end $$;
grant execute on function public.d21_reagir(uuid, text) to authenticated;

-- votar em enquete ou check-in
create or replace function public.d21_votar(p_post uuid, p_opcoes text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p d21_posts; validas text[]; ja boolean;
begin
  p := _d21_pode_interagir(p_post);
  if p.tipo not in ('enquete','checkin') then raise exception 'esta publicação não tem votação'; end if;
  if p.prazo is not null and p.prazo < now() then raise exception 'a votação já terminou'; end if;
  select array_agg(o->>'id') into validas from jsonb_array_elements(p.opcoes) o;
  p_opcoes := array(select distinct x from unnest(coalesce(p_opcoes, '{}')) x where x = any(validas));
  if coalesce(array_length(p_opcoes, 1), 0) = 0 then raise exception 'escolha uma opção'; end if;
  if not p.multipla and array_length(p_opcoes, 1) > 1 then p_opcoes := p_opcoes[1:1]; end if;
  ja := exists (select 1 from d21_votos where post_id = p.id and user_id = auth.uid());
  if ja and not p.pode_mudar then raise exception 'você já votou'; end if;
  delete from d21_votos where post_id = p.id and user_id = auth.uid() and not (opcao = any(p_opcoes));
  insert into d21_votos (post_id, user_id, opcao) select p.id, auth.uid(), x from unnest(p_opcoes) x on conflict do nothing;
  return jsonb_build_object('ok', true, 'votos', to_jsonb(p_opcoes));
end $$;
grant execute on function public.d21_votar(uuid, text[]) to authenticated;

-- visualizações (uma por pessoa por publicação)
create or replace function public.d21_vi(p_posts uuid[]) returns void
language sql security definer set search_path = public as $$
  insert into d21_vistas (post_id, user_id)
  select p.id, auth.uid() from d21_posts p where p.id = any(p_posts[1:50]) and p.publicar_em <= now()
    and exists (select 1 from d21_inscricoes i where i.edicao_id = p.edicao_id and i.user_id = auth.uid())
  on conflict do nothing;
$$;
grant execute on function public.d21_vi(uuid[]) to authenticated;

create or replace function public.d21_responder_pesquisa(p_edicao uuid, p_nota int, p_gostou text, p_melhorar text, p_outra boolean) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from d21_inscricoes where edicao_id = p_edicao and user_id = auth.uid()) then raise exception 'só para participantes'; end if;
  insert into d21_pesquisa (edicao_id, user_id, nota, gostou, melhorar, outra) values (p_edicao, auth.uid(), least(greatest(p_nota, 0), 10), left(p_gostou, 1000), left(p_melhorar, 1000), p_outra)
    on conflict (edicao_id, user_id) do update set nota = excluded.nota, gostou = excluded.gostou, melhorar = excluded.melhorar, outra = excluded.outra, criado = now();
  return true;
end $$;
grant execute on function public.d21_responder_pesquisa(uuid, int, text, text, boolean) to authenticated;

-- ---------- 7) Painel: números agregados (nunca lista dado pessoal) ----------
create or replace function public.d21_admin_metricas(p_edicao uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare e d21_edicoes; hoje int;
begin
  if not admin_ve('desafios') then raise exception 'sem permissão'; end if;
  select * into e from d21_edicoes where id = p_edicao; if e.id is null then return null; end if;
  hoje := least(greatest(_d21_dia(e), 0), 21);
  return jsonb_build_object(
    'dia', _d21_dia(e), 'fase', _d21_fase(e),
    'inscritas', (select count(*) from d21_inscricoes where edicao_id = e.id),
    'abandonaram', (select count(*) from d21_inscricoes where edicao_id = e.id and saiu_em is not null),
    'iniciaram', (select count(distinct user_id) from d21_registros where edicao_id = e.id),
    'ativas_hoje', (select count(*) from d21_registros where edicao_id = e.id and data = d21_hoje()),
    'funil', (select jsonb_object_agg('D' || k, (select count(distinct user_id) from d21_registros r where r.edicao_id = e.id and r.dia >= k)) from unnest(array[1,3,7,14,21]) k),
    'concluiram', (select count(*) from (select user_id from d21_registros where edicao_id = e.id group by user_id having max(dia) = 21) z),
    'retornaram', (select count(distinct a.user_id) from d21_registros a where a.edicao_id = e.id and a.dia > 1
        and not exists (select 1 from d21_registros b where b.edicao_id = e.id and b.user_id = a.user_id and b.dia between a.dia - 2 and a.dia - 1)
        and exists (select 1 from d21_registros c where c.edicao_id = e.id and c.user_id = a.user_id and c.dia < a.dia - 2)),
    'planob', (select count(*) from d21_registros where edicao_id = e.id and tipo = 'planob'),
    'completos', (select count(*) from d21_registros where edicao_id = e.id and tipo = 'completo'),
    'modos', (select coalesce(jsonb_object_agg(modo, n), '{}'::jsonb) from (select modo, count(*) n from d21_registros where edicao_id = e.id and tipo = 'completo' group by modo) z),
    'modos_inscritas', (select coalesce(jsonb_object_agg(modo, n), '{}'::jsonb) from (select modo, count(*) n from d21_inscricoes where edicao_id = e.id and saiu_em is null group by modo) z),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('dia', d, 'iniciados', (select count(distinct user_id) from d21_inicios i where i.edicao_id = e.id and i.dia = d),
        'concluidos', (select count(*) from d21_registros r where r.edicao_id = e.id and r.dia = d), 'planob', (select count(*) from d21_registros r where r.edicao_id = e.id and r.dia = d and r.tipo = 'planob')) order by d), '[]'::jsonb) from generate_series(1, greatest(hoje, 1)) d),
    'iniciados', (select count(*) from (select distinct user_id, dia from d21_inicios where edicao_id = e.id) z),
    'comunidade', jsonb_build_object(
      'publicacoes', (select count(*) from d21_posts where edicao_id = e.id and not apagado and publicar_em <= now()),
      'vistas', (select coalesce(sum(c.n), 0) from d21_contagens c join d21_posts p on p.id = c.post_id where p.edicao_id = e.id and c.chave = 'vistas'),
      'reacoes', (select count(*) from d21_reacoes r join d21_posts p on p.id = r.post_id where p.edicao_id = e.id),
      'votos', (select count(*) from d21_votos v join d21_posts p on p.id = v.post_id where p.edicao_id = e.id and p.tipo = 'enquete'),
      'checkins', (select count(*) from d21_votos v join d21_posts p on p.id = v.post_id where p.edicao_id = e.id and p.tipo = 'checkin'),
      'interagiram', (select count(distinct u) from (select r.user_id u from d21_reacoes r join d21_posts p on p.id = r.post_id where p.edicao_id = e.id union select v.user_id from d21_votos v join d21_posts p on p.id = v.post_id where p.edicao_id = e.id) z),
      'top', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (select jsonb_build_object('id', p.id, 'titulo', coalesce(p.titulo, left(p.texto, 60)), 'tipo', p.tipo,
          'interacoes', coalesce((select sum(c.n) from d21_contagens c where c.post_id = p.id and c.chave <> 'vistas'), 0), 'vistas', coalesce((select c.n from d21_contagens c where c.post_id = p.id and c.chave = 'vistas'), 0)) t
        from d21_posts p where p.edicao_id = e.id and not p.apagado order by coalesce((select sum(c.n) from d21_contagens c where c.post_id = p.id and c.chave <> 'vistas'), 0) desc limit 5) z)),
    'pesquisa', jsonb_build_object('respostas', (select count(*) from d21_pesquisa where edicao_id = e.id), 'media', (select round(avg(nota)::numeric, 1) from d21_pesquisa where edicao_id = e.id),
      'outra', (select count(*) from d21_pesquisa where edicao_id = e.id and outra)));
end $$;
grant execute on function public.d21_admin_metricas(uuid) to authenticated;

-- contagens das publicações para o painel (inclui não publicadas ainda)
create or replace function public.d21_admin_contagens(p_edicao uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when admin_ve('desafios') then coalesce((select jsonb_object_agg(post_id, cs) from (
    select c.post_id, jsonb_object_agg(c.chave, c.n) cs from d21_contagens c join d21_posts p on p.id = c.post_id where p.edicao_id = p_edicao group by c.post_id) z), '{}'::jsonb) end
$$;
grant execute on function public.d21_admin_contagens(uuid) to authenticated;

-- ---------- 8) Relógio: status, publicações programadas com aviso e lembretes do dia ----------
create or replace function public._d21_push(p_ed uuid, p_payload jsonb, p_so_pendentes boolean default false) returns int
language plpgsql security definer set search_path = public as $$
declare lote uuid[]; tk text; fid uuid; n int := 0;
begin
  for lote in select array_agg(uid) from (
      select i.user_id uid, (row_number() over () - 1) / 300 grp from d21_inscricoes i
      where i.edicao_id = p_ed and i.saiu_em is null and exists (select 1 from push_inscricoes s where s.user_id = i.user_id)
        and (not p_so_pendentes or not exists (select 1 from d21_registros r where r.edicao_id = p_ed and r.user_id = i.user_id and r.data = d21_hoje()))) z group by grp loop
    tk := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    insert into push_fila (token, user_id, usuarios, payload) values (tk, null, lote, p_payload) returning id into fid;
    begin
      perform net.http_post(url := 'https://cklife.vercel.app/api/push', body := jsonb_build_object('id', fid, 'token', tk), headers := '{"Content-Type":"application/json"}'::jsonb);
    exception when others then null;
    end;
    n := n + coalesce(array_length(lote, 1), 0);
  end loop;
  return n;
end $$;
revoke all on function public._d21_push(uuid, jsonb, boolean) from public, anon, authenticated;

create or replace function public.d21_tick() returns jsonb
language plpgsql security definer set search_path = public as $$
declare e d21_edicoes; p d21_posts; d int; h int := extract(hour from now() at time zone 'America/Sao_Paulo')::int; tit text; n int := 0;
begin
  -- status acompanha as datas (a Micaela só escolhe rascunho / inscrições abertas / arquivada)
  update d21_edicoes set status = 'andamento', atualizado = now() where status in ('inscricoes','aguardando') and inicio <= d21_hoje();
  update d21_edicoes set status = 'finalizada', atualizado = now() where status = 'andamento' and fim < d21_hoje();
  -- publicações programadas que pediram aviso no celular
  for p in select * from d21_posts where notificar and notificado is null and not apagado and publicar_em <= now() and publicar_em > now() - interval '6 hours' order by publicar_em limit 10 loop
    update d21_posts set notificado = now() where id = p.id;
    n := n + _d21_push(p.edicao_id, jsonb_build_object('title', '📢 Recado da Micaela para a turma', 'body', left(coalesce(p.titulo, p.texto, 'Tem novidade na comunidade do desafio.'), 140), 'tag', 'd21p:' || p.id, 'url', '/?d21=comunidade'));
  end loop;
  -- avisos automáticos do dia (uma vez por dia por edição)
  for e in select * from d21_edicoes where status = 'andamento' and coalesce((config->>'notificar')::boolean, true) loop
    d := _d21_dia(e); if d < 1 or d > 21 then continue; end if;
    tit := coalesce(e.dias_pub -> (d - 1) ->> 'titulo', 'Treino do dia');
    if h >= coalesce((e.config->>'hora_dia')::int, 7) and h < coalesce((e.config->>'hora_dia')::int, 7) + 5 then
      insert into d21_envios (edicao_id, chave) values (e.id, 'dia:' || d) on conflict do nothing;
      if found then n := n + _d21_push(e.id, jsonb_build_object('title', '🔥 O Dia ' || d || ' começou!', 'body', tit || '. Seu treino está esperando 💚', 'tag', 'd21dia:' || e.id, 'url', '/?d21=hoje')); end if;
    end if;
    if h >= coalesce((e.config->>'hora_lembrete')::int, 19) and h < least(coalesce((e.config->>'hora_lembrete')::int, 19) + 3, 23) then
      insert into d21_envios (edicao_id, chave) values (e.id, 'lembrete:' || d) on conflict do nothing;
      if found then n := n + _d21_push(e.id, jsonb_build_object('title', '💚 Ainda dá tempo de aparecer por você hoje', 'body', 'Dia ' || d || ' de 21. Nem que seja o Plano B de 10 minutos.', 'tag', 'd21lem:' || e.id, 'url', '/?d21=hoje'), true); end if;
    end if;
  end loop;
  return jsonb_build_object('avisos', n);
end $$;
revoke all on function public.d21_tick() from public, anon, authenticated;

do $$ begin
  begin create extension if not exists pg_cron; exception when others then raise notice 'pg_cron indisponível'; end;
  begin perform cron.unschedule('ck-d21-tick'); exception when others then null; end;
  begin perform cron.schedule('ck-d21-tick', '*/5 * * * *', 'select public.d21_tick()'); exception when others then raise notice 'Agendador não ativado: ative o Cron em Integrations e rode este arquivo de novo'; end;
end $$;
