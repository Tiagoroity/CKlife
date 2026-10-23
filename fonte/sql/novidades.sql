-- =====================================================================
-- CK Life · NOVIDADES: grupos da comunidade, vídeos, desafios com contagem real,
-- figurinhas e humor salvos na conta, notificações no celular (push).
-- Só ADICIONA. Não apaga dados. Pode rodar mais de uma vez.
-- =====================================================================

-- ---------- 1) Grupos da comunidade ----------
create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  nome text not null check (char_length(nome) between 3 and 60),
  descricao text check (char_length(coalesce(descricao, '')) <= 300),
  emoji text check (char_length(coalesce(emoji, '')) <= 12),
  cor text check (cor is null or cor ~ '^#[0-9a-fA-F]{6}$'),
  cidade int,
  ativo boolean not null default true,
  ordem int not null default 0,
  criado timestamptz not null default now()
);
alter table public.grupos enable row level security;
drop policy if exists gr_ler on public.grupos;
create policy gr_ler on public.grupos for select to authenticated using (ativo or admin_ve('comunidade'));
drop policy if exists gr_criar on public.grupos;
create policy gr_criar on public.grupos for insert to authenticated with check (admin_pode('comunidade'));
drop policy if exists gr_mudar on public.grupos;
create policy gr_mudar on public.grupos for update to authenticated using (admin_pode('comunidade')) with check (admin_pode('comunidade'));

create table if not exists public.membros_grupo (
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado timestamptz not null default now(),
  primary key (grupo_id, user_id)
);
create index if not exists membros_grupo_user_idx on public.membros_grupo (user_id);
alter table public.membros_grupo enable row level security;
drop policy if exists mg_ler on public.membros_grupo;
create policy mg_ler on public.membros_grupo for select to authenticated using (user_id = auth.uid() or admin_ve('comunidade'));
drop policy if exists mg_entrar on public.membros_grupo;
create policy mg_entrar on public.membros_grupo for insert to authenticated with check (
  user_id = auth.uid() and pode_postar() and exists (select 1 from grupos g where g.id = grupo_id and g.ativo));
drop policy if exists mg_sair on public.membros_grupo;
create policy mg_sair on public.membros_grupo for delete to authenticated using (user_id = auth.uid() or admin_pode('comunidade'));

-- lista de grupos com número de membros (só o total; quem participa não é exposto)
create or replace function public.grupos_info() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', g.id, 'slug', g.slug, 'nome', g.nome, 'descricao', g.descricao, 'emoji', g.emoji, 'cor', g.cor, 'cidade', g.cidade,
    'membros', (select count(*) from membros_grupo m where m.grupo_id = g.id),
    'eu', exists (select 1 from membros_grupo m where m.grupo_id = g.id and m.user_id = auth.uid())) order by g.ordem, g.nome), '[]'::json)
  from grupos g where g.ativo and auth.uid() is not null;
$$;
grant execute on function public.grupos_info() to authenticated;

alter table public.posts add column if not exists grupo_id uuid references public.grupos(id) on delete set null;
create index if not exists posts_grupo_idx on public.posts (grupo_id, criado desc) where grupo_id is not null;
drop policy if exists posts_criar on public.posts;
create policy posts_criar on public.posts for insert to authenticated with check (
  user_id = auth.uid() and pode_postar() and (midia is null or midia like 'post/' || auth.uid()::text || '/%')
  and (grupo_id is null or exists (select 1 from membros_grupo m where m.grupo_id = posts.grupo_id and m.user_id = auth.uid())));

insert into public.grupos (slug, nome, descricao, emoji, cor, ordem) values
  ('iniciantes', 'Iniciantes', 'Para quem está começando agora. Sem pressa e sem julgamento.', '🌱', '#2E7D5A', 1),
  ('treino-em-casa', 'Treino em casa', 'Dicas, rotinas e motivação para treinar em casa.', '🏠', '#0E3D32', 2),
  ('musculacao', 'Musculação', 'Força, técnica e evolução na academia ou em casa.', '🏋️‍♀️', '#6C5FB5', 3),
  ('corrida', 'Corrida e caminhada', 'Do primeiro quilômetro à primeira prova.', '🏃‍♀️', '#D08A2E', 4),
  ('maes-fitness', 'Mães fitness', 'Cuidar de si com a rotina de mãe.', '🤱', '#C2577B', 5),
  ('alimentacao', 'Alimentação saudável', 'Receitas, marmitas e trocas inteligentes.', '🥗', '#2B7BB9', 6)
on conflict (slug) do nothing;

-- ---------- 2) Vídeos (posts e Stories) ----------
update storage.buckets set file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/aac','video/mp4','video/webm','video/quicktime']
where id = 'social';

-- ---------- 3) Figurinhas da aluna (guardadas na conta) ----------
create table if not exists public.figurinhas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  midia text not null,
  criado timestamptz not null default now()
);
create index if not exists figurinhas_user_idx on public.figurinhas (user_id, criado desc);
alter table public.figurinhas enable row level security;
drop policy if exists fg_ler on public.figurinhas;
create policy fg_ler on public.figurinhas for select to authenticated using (user_id = auth.uid());
drop policy if exists fg_criar on public.figurinhas;
create policy fg_criar on public.figurinhas for insert to authenticated with check (user_id = auth.uid() and midia like 'figurinha/' || auth.uid()::text || '/%');
drop policy if exists fg_apagar on public.figurinhas;
create policy fg_apagar on public.figurinhas for delete to authenticated using (user_id = auth.uid());
create or replace function public.limite_figurinhas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from figurinhas where user_id = new.user_id) >= 40 then raise exception 'limite de 40 figurinhas'; end if;
  return new;
end $$;
drop trigger if exists limite_figurinhas on public.figurinhas;
create trigger limite_figurinhas before insert on public.figurinhas for each row execute function public.limite_figurinhas();

-- regras do storage privado: figurinha só a dona lê; aceita vídeo .mov
create or replace function public.social_pode_ler(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/'); dono uuid; conv uuid;
begin
  if auth.uid() is null or array_length(parte, 1) < 3 then return false; end if;
  if parte[1] = 'perfil' then dono := parte[2]::uuid; return dono = auth.uid() or not bloqueio_entre(auth.uid(), dono) or e_admin();
  elsif parte[1] = 'figurinha' then return parte[2] = auth.uid()::text;
  elsif parte[1] = 'post' then dono := parte[2]::uuid;
    return dono = auth.uid() or exists (select 1 from posts p where p.midia = p_nome and ((not p.oculto and pode_ver(p.user_id)) or e_admin()));
  elsif parte[1] = 'story' then dono := parte[2]::uuid;
    return exists (select 1 from stories s where s.midia = p_nome and s.expira > now() and (s.user_id = auth.uid() or (not s.oculto and pode_ver(s.user_id))))
      or (admin_ve('moderacao') and exists (select 1 from stories s join denuncias d on d.tipo = 'story' and d.alvo_id = s.id::text where s.midia = p_nome));
  elsif parte[1] = 'chat' then conv := parte[2]::uuid;
    return e_participante(conv)
      or (admin_ve('moderacao') and exists (select 1 from mensagens m join denuncias d on d.tipo = 'mensagem' and d.alvo_id = m.id::text where m.midia = p_nome));
  end if;
  return false;
exception when others then return false;
end $$;
create or replace function public.social_pode_gravar(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/');
begin
  if auth.uid() is null or array_length(parte, 1) <> 3 or not pode_postar() then return false; end if;
  if parte[3] !~ '^[a-zA-Z0-9_-]{6,80}\.(jpg|jpeg|png|webp|webm|m4a|mp4|mov|ogg|mp3|aac)$' then return false; end if;
  if parte[1] in ('perfil','post','story','figurinha') then return parte[2] = auth.uid()::text; end if;
  if parte[1] = 'chat' then return e_participante(parte[2]::uuid) and not bloqueio_entre(auth.uid(), outro_da_conversa(parte[2]::uuid)); end if;
  return false;
exception when others then return false;
end $$;

-- ---------- 4) Humor do dia (só a própria aluna; nenhum admin lê) ----------
create table if not exists public.humor_diario (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  dia date not null default current_date,
  humor text not null check (humor in ('1','2','3','4')),
  energia text check (energia in ('baixa','ok','alta')),
  primary key (user_id, dia)
);
alter table public.humor_diario enable row level security;
drop policy if exists hu_ler on public.humor_diario;
create policy hu_ler on public.humor_diario for select to authenticated using (user_id = auth.uid());
drop policy if exists hu_criar on public.humor_diario;
create policy hu_criar on public.humor_diario for insert to authenticated with check (user_id = auth.uid());
drop policy if exists hu_mudar on public.humor_diario;
create policy hu_mudar on public.humor_diario for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists hu_apagar on public.humor_diario;
create policy hu_apagar on public.humor_diario for delete to authenticated using (user_id = auth.uid());

-- ---------- 5) Desafios com número real de participantes ----------
create table if not exists public.desafio_participantes (
  id uuid primary key default gen_random_uuid(),
  desafio text not null check (desafio in ('d7','d21','d30')),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  inicio date not null default current_date,
  fim date,
  saiu boolean not null default false
);
create unique index if not exists desafio_ativo_idx on public.desafio_participantes (user_id) where fim is null and not saiu;
alter table public.desafio_participantes enable row level security;
drop policy if exists dp_ler on public.desafio_participantes;
create policy dp_ler on public.desafio_participantes for select to authenticated using (user_id = auth.uid());
drop policy if exists dp_criar on public.desafio_participantes;
create policy dp_criar on public.desafio_participantes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists dp_mudar on public.desafio_participantes;
create policy dp_mudar on public.desafio_participantes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- só o total por desafio (participando agora + quem concluiu)
create or replace function public.desafio_contagem() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'd7',  (select count(distinct user_id) from desafio_participantes where desafio = 'd7'  and not saiu and (fim is not null or inicio >= current_date - 30)),
    'd21', (select count(distinct user_id) from desafio_participantes where desafio = 'd21' and not saiu and (fim is not null or inicio >= current_date - 60)),
    'd30', (select count(distinct user_id) from desafio_participantes where desafio = 'd30' and not saiu and (fim is not null or inicio >= current_date - 90)));
$$;
grant execute on function public.desafio_contagem() to authenticated;

-- ---------- 6) Notificações no celular (push) ----------
create table if not exists public.push_inscricoes (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  criado timestamptz not null default now()
);
create index if not exists push_user_idx on public.push_inscricoes (user_id);
alter table public.push_inscricoes enable row level security;
drop policy if exists pi_ler on public.push_inscricoes;
create policy pi_ler on public.push_inscricoes for select to authenticated using (user_id = auth.uid());
drop policy if exists pi_criar on public.push_inscricoes;
create policy pi_criar on public.push_inscricoes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists pi_mudar on public.push_inscricoes;
create policy pi_mudar on public.push_inscricoes for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists pi_apagar on public.push_inscricoes;
create policy pi_apagar on public.push_inscricoes for delete to authenticated using (user_id = auth.uid());

-- fila privada (sem políticas = ninguém lê pelo app); o envio usa um código de uso único
create table if not exists public.push_fila (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  user_id uuid not null,
  payload jsonb not null,
  criado timestamptz not null default now(),
  usado timestamptz
);
alter table public.push_fila enable row level security;
create index if not exists push_fila_criado_idx on public.push_fila (criado);

do $$ begin
  begin create extension if not exists pg_net; exception when others then raise notice 'pg_net indisponível: as notificações ficam só dentro do app'; end;
end $$;

create or replace function public.push_enfileira() returns trigger
language plpgsql security definer set search_path = public as $$
declare tk text; fid uuid; titulo text;
begin
  if new.lida then return new; end if;
  if tg_op = 'UPDATE' and new.criado = old.criado then return new; end if;
  if not exists (select 1 from push_inscricoes where user_id = new.user_id) then return new; end if;
  delete from push_fila where criado < now() - interval '1 day';
  titulo := case new.tipo when 'mensagem' then 'Nova mensagem' when 'story_resposta' then 'Resposta ao seu Story' when 'curtida' then 'Nova curtida'
    when 'comentario' then 'Novo comentário' when 'seguiu' then 'Nova seguidora' when 'solicitou' then 'Pedido para seguir' when 'aceitou' then 'Pedido aceito'
    when 'conquista' then 'Nova conquista' else 'CK Life' end;
  tk := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into push_fila (token, user_id, payload) values (tk, new.user_id,
    jsonb_build_object('title', titulo, 'body', coalesce(new.texto, 'Você tem uma novidade no CK Life.'), 'tag', new.tipo || ':' || new.ref, 'url', '/?n=' || new.tipo))
    returning id into fid;
  begin
    perform net.http_post(url := 'https://cklife.vercel.app/api/push', body := jsonb_build_object('id', fid, 'token', tk), headers := '{"Content-Type":"application/json"}'::jsonb);
  exception when others then null;   -- sem pg_net: só não envia para o celular
  end;
  return new;
end $$;
drop trigger if exists push_enfileira on public.notificacoes;
create trigger push_enfileira after insert or update on public.notificacoes for each row execute function public.push_enfileira();

-- o servidor de envio troca o código pelo aviso (uma vez só, válido por 10 minutos)
create or replace function public.push_pegar(p_id uuid, p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare f push_fila;
begin
  update push_fila set usado = now() where id = p_id and token = p_token and usado is null and criado > now() - interval '10 minutes' returning * into f;
  if f.id is null then return null; end if;
  return json_build_object('payload', f.payload, 'subs', (select coalesce(json_agg(json_build_object('endpoint', endpoint, 'keys', json_build_object('p256dh', p256dh, 'auth', auth))), '[]'::json) from push_inscricoes where user_id = f.user_id));
end $$;
grant execute on function public.push_pegar(uuid, text) to anon, authenticated;
-- inscrição que o celular cancelou: o servidor avisa e ela é removida
create or replace function public.push_expirou(p_id uuid, p_token text, p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from push_fila where id = p_id and token = p_token and usado > now() - interval '10 minutes') then
    delete from push_inscricoes where endpoint = p_endpoint and user_id = (select user_id from push_fila where id = p_id);
  end if;
end $$;
grant execute on function public.push_expirou(uuid, text, text) to anon, authenticated;

select 'Novidades prontas' as status;
