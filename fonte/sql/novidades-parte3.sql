-- CK Life · Novidades · PARTE 3 de 3 (rode na ordem)
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

