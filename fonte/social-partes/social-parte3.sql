-- CK Life · Rede social · PARTE 3 de 5 (rode na ordem, uma de cada vez)
-- ---------- 5) Chat: fotos, áudio, resposta, status (enviada/entregue/lida), apagar para mim ----------
alter table public.mensagens add column if not exists tipo text not null default 'texto';
alter table public.mensagens add column if not exists midia text;
alter table public.mensagens add column if not exists duracao int;
alter table public.mensagens add column if not exists resposta_id uuid references public.mensagens(id) on delete set null;
alter table public.mensagens add column if not exists story_id uuid;
alter table public.mensagens add column if not exists post_id uuid;
alter table public.mensagens add column if not exists entregue_em timestamptz;
alter table public.mensagens add column if not exists lida_em timestamptz;
alter table public.mensagens add column if not exists ocultar_para uuid[] not null default '{}';
alter table public.mensagens add column if not exists oculto_mod boolean not null default false;
alter table public.mensagens drop constraint if exists mensagens_texto_check;
alter table public.mensagens alter column texto drop not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'mensagens_conteudo_ok') then
    alter table public.mensagens add constraint mensagens_conteudo_ok check (
      tipo in ('texto','foto','audio','story','post')
      and char_length(coalesce(texto, '')) <= 2000
      and (tipo <> 'texto' or char_length(coalesce(texto, '')) >= 1)
      and (tipo not in ('foto','audio') or midia is not null)
      and (duracao is null or duracao between 0 and 300));
  end if;
end $$;
create index if not exists mensagens_nao_lidas_idx on public.mensagens (conversa_id, lida_em) where lida_em is null;
create or replace function public.e_participante(p_conversa uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from conversas c where c.id = p_conversa and auth.uid() in (c.a, c.b))
$$;
create or replace function public.outro_da_conversa(p_conversa uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select case when c.a = auth.uid() then c.b else c.a end from conversas c where c.id = p_conversa
$$;
drop policy if exists cv_criar on public.conversas;
create policy cv_criar on public.conversas for insert to authenticated with check (auth.uid() = a and pode_postar() and pode_mensagem(b));
drop policy if exists mg_ler on public.mensagens;
create policy mg_ler on public.mensagens for select to authenticated using (e_participante(conversa_id) and not (auth.uid() = any(ocultar_para)));
drop policy if exists mg_criar on public.mensagens;
create policy mg_criar on public.mensagens for insert to authenticated with check (
  autor = auth.uid() and pode_postar() and e_participante(conversa_id)
  and not bloqueio_entre(auth.uid(), outro_da_conversa(conversa_id))
  and (midia is null or midia like 'chat/' || conversa_id::text || '/%'));
drop policy if exists mg_mudar on public.mensagens;
create policy mg_mudar on public.mensagens for update to authenticated using (e_participante(conversa_id));
create or replace function public.protege_mensagem() returns trigger
language plpgsql security definer set search_path = public as $$
declare eu uuid := auth.uid(); part boolean;
begin
  if tg_op = 'INSERT' then
    new.autor := eu; new.criado := now(); new.entregue_em := null; new.lida_em := null; new.ocultar_para := '{}'; new.oculto_mod := false;
    return new;
  end if;
  part := exists (select 1 from conversas c where c.id = old.conversa_id and eu in (c.a, c.b));
  if not part then
    if e_admin() then return new; end if;   -- só via moderação (função própria)
    return old;
  end if;
  -- participante: destinatária marca entregue/lida; qualquer uma pode esconder para si
  new.id := old.id; new.conversa_id := old.conversa_id; new.autor := old.autor; new.texto := old.texto; new.tipo := old.tipo;
  new.midia := old.midia; new.duracao := old.duracao; new.resposta_id := old.resposta_id; new.story_id := old.story_id; new.post_id := old.post_id;
  new.criado := old.criado; new.oculto_mod := old.oculto_mod;
  if eu = old.autor then new.entregue_em := old.entregue_em; new.lida_em := old.lida_em;
  else new.entregue_em := coalesce(old.entregue_em, new.entregue_em); new.lida_em := coalesce(old.lida_em, new.lida_em); end if;
  new.ocultar_para := (select coalesce(array_agg(distinct x), '{}') from unnest(old.ocultar_para || case when eu = any(new.ocultar_para) then array[eu] else '{}'::uuid[] end) x);
  return new;
end $$;
drop trigger if exists protege_mensagem on public.mensagens;
create trigger protege_mensagem before insert or update on public.mensagens for each row execute function public.protege_mensagem();
-- entregue = o aparelho da destinatária sincronizou; lida = conversa aberta
create or replace function public.marcar_entregues() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update mensagens m set entregue_em = now()
    from conversas c where m.conversa_id = c.id and auth.uid() in (c.a, c.b) and m.autor <> auth.uid() and m.entregue_em is null;
  get diagnostics n = row_count; return n;
end $$;
create or replace function public.marcar_lidas(p_conversa uuid) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not e_participante(p_conversa) then return 0; end if;
  update mensagens set lida_em = now(), entregue_em = coalesce(entregue_em, now())
    where conversa_id = p_conversa and autor <> auth.uid() and lida_em is null;
  get diagnostics n = row_count;
  update notificacoes set lida = true where user_id = auth.uid() and tipo in ('mensagem','story_resposta') and ref = p_conversa::text and not lida;
  return n;
end $$;
-- apagar só para mim (a outra pessoa continua vendo)
create or replace function public.ocultar_mensagem(p_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update mensagens set ocultar_para = array(select distinct x from unnest(ocultar_para || array[auth.uid()]) x)
    where id = p_id and e_participante(conversa_id);
  return found;
end $$;
-- última mensagem na lista de conversas também para foto, áudio e Story
create or replace function public.atualiza_conversa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update conversas set ultima = left(coalesce(nullif(new.texto, ''), case new.tipo when 'foto' then '📷 Foto' when 'audio' then '🎤 Áudio' when 'story' then 'Respondeu ao Story' when 'post' then 'Publicação compartilhada' else '' end), 90),
    ultima_em = new.criado, ultimo_autor = new.autor,
    lida_a = case when a = new.autor then new.criado else lida_a end,
    lida_b = case when b = new.autor then new.criado else lida_b end
  where id = new.conversa_id;
  return new;
end $$;
create or replace function public.nao_lidas() returns table(conversa_id uuid, n bigint)
language sql stable security definer set search_path = public as $$
  select m.conversa_id, count(*) from mensagens m join conversas c on c.id = m.conversa_id
  where auth.uid() in (c.a, c.b) and m.autor <> auth.uid() and m.lida_em is null and not (auth.uid() = any(m.ocultar_para)) and not m.oculto_mod
  group by m.conversa_id
$$;

select 'Parte 3 pronta' as status;
