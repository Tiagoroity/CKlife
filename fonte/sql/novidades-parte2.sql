-- CK Life · Novidades · PARTE 2 de 3 (rode na ordem)
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

