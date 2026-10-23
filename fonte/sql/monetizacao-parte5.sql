-- CK Life · Monetização · PARTE 5 de 6 (rode na ordem)
-- ---------- 8) Verificação (selo azul = pessoa real, NÃO = pagamento) ----------
alter table public.perfis add column if not exists verificada boolean not null default false;
alter table public.perfis add column if not exists pro_ate timestamptz;
create or replace function public.protege_perfil_selos() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_setting('ck.sistema', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then new.verificada := false;
    new.pro_ate := (select max(fim) from assinaturas where user_id = new.user_id and provider in ('kiwify','apple','google','manual','legado') and status in ('active','canceled','past_due','grace_period') and fim > now());
    return new; end if;
  new.verificada := old.verificada; new.pro_ate := old.pro_ate;    -- ninguém se dá selo ou coroa
  return new;
end $$;
drop trigger if exists protege_perfil_selos on public.perfis;
create trigger protege_perfil_selos before insert or update on public.perfis for each row execute function public.protege_perfil_selos();
-- 👑 pública só para assinatura paga (o teste não mostra coroa)
create or replace function public.sincroniza_coroa(p_uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare f timestamptz;
begin
  if p_uid is null then return; end if;
  select max(fim) into f from assinaturas where user_id = p_uid and provider in ('kiwify','apple','google','manual','legado') and status in ('active','canceled','past_due','grace_period') and fim > now();
  perform set_config('ck.sistema', '1', true);
  update perfis set pro_ate = f where user_id = p_uid and pro_ate is distinct from f;
  perform set_config('ck.sistema', '0', true);
end $$;
create or replace function public.assinatura_mudou() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform sincroniza_coroa(new.user_id); return new; end $$;
drop trigger if exists assinatura_mudou on public.assinaturas;
create trigger assinatura_mudou after insert or update on public.assinaturas for each row execute function public.assinatura_mudou();

create table if not exists public.verificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','verified','rejected','needs_review','revoked')),
  selfie text,          -- foto privada (pasta "verificacao"), só a própria e o revisor abrem
  codigo text,          -- código que ela segura na selfie
  motivo text,
  revisado_por uuid,
  revisado_em timestamptz,
  criado timestamptz not null default now()
);
create index if not exists verif_user_idx on public.verificacoes (user_id, criado desc);
alter table public.verificacoes enable row level security;
drop policy if exists vf_ler on public.verificacoes;
create policy vf_ler on public.verificacoes for select to authenticated using (user_id = auth.uid() or admin_ve('verificacoes'));
drop policy if exists vf_criar on public.verificacoes;
create policy vf_criar on public.verificacoes for insert to authenticated with check (
  user_id = auth.uid() and pode_recurso('verificacao') and (selfie is null or selfie like 'verificacao/' || auth.uid()::text || '/%')
  and not exists (select 1 from verificacoes v where v.user_id = auth.uid() and v.status in ('pending','needs_review','verified')));
create or replace function public.protege_verificacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then new.status := 'pending'; new.revisado_por := null; new.revisado_em := null; new.motivo := null; new.codigo := upper(substr(md5(random()::text), 1, 6)); end if;
  return new;
end $$;
drop trigger if exists protege_verificacao on public.verificacoes;
create trigger protege_verificacao before insert on public.verificacoes for each row execute function public.protege_verificacao();
create or replace function public.verificacao_decidir(p_id uuid, p_status text, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare v verificacoes;
begin
  if not admin_pode('verificacoes') then raise exception 'sem permissão'; end if;
  if p_status not in ('verified','rejected','needs_review','revoked') then raise exception 'status inválido'; end if;
  if p_status in ('rejected','revoked','needs_review') and coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  update verificacoes set status = p_status, motivo = p_motivo, revisado_por = auth.uid(), revisado_em = now() where id = p_id returning * into v;
  if v.id is null then raise exception 'pedido não encontrado'; end if;
  perform set_config('ck.sistema', '1', true);
  update perfis set verificada = (p_status = 'verified') where user_id = v.user_id;
  perform set_config('ck.sistema', '0', true);
  if p_status = 'verified' then insert into eventos_app (nome, user_id) values ('verification_approved', v.user_id); end if;
  perform auditar('verificacao_' || p_status, 'verificacoes', v.user_id::text, 'ok', p_motivo);
end $$;

create or replace function public.verificacao_selfie(p_id uuid, p_selfie text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_selfie not like 'verificacao/' || auth.uid()::text || '/%' then raise exception 'arquivo inválido'; end if;
  update verificacoes set selfie = p_selfie where id = p_id and user_id = auth.uid() and status in ('pending','needs_review');
  if not found then raise exception 'pedido não encontrado'; end if;
  update verificacoes set status = 'pending' where id = p_id;
end $$;
grant execute on function public.verificacao_selfie(uuid, text) to authenticated;
-- storage: pasta privada "verificacao" (só a dona e o revisor)
create or replace function public.social_pode_ler(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/'); dono uuid; conv uuid;
begin
  if auth.uid() is null or array_length(parte, 1) < 3 then return false; end if;
  if parte[1] = 'perfil' then dono := parte[2]::uuid; return dono = auth.uid() or not bloqueio_entre(auth.uid(), dono) or e_admin();
  elsif parte[1] = 'figurinha' then return parte[2] = auth.uid()::text;
  elsif parte[1] = 'verificacao' then return parte[2] = auth.uid()::text or admin_ve('verificacoes');
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
  if auth.uid() is null or array_length(parte, 1) <> 3 then return false; end if;
  if parte[3] !~ '^[a-zA-Z0-9_-]{6,80}\.(jpg|jpeg|png|webp|webm|m4a|mp4|mov|ogg|mp3|aac)$' then return false; end if;
  if parte[1] = 'verificacao' then return parte[2] = auth.uid()::text and pode_recurso('verificacao'); end if;
  if not pode_postar() then return false; end if;
  if parte[1] = 'figurinha' then return parte[2] = auth.uid()::text and pode_recurso('figurinha_propria'); end if;
  if parte[1] in ('perfil','post','story') then return parte[2] = auth.uid()::text; end if;
  if parte[1] = 'chat' then return e_participante(parte[2]::uuid) and not bloqueio_entre(auth.uid(), outro_da_conversa(parte[2]::uuid)); end if;
  return false;
exception when others then return false;
end $$;

-- ---------- 9) Figurinhas Pro validadas no servidor ----------
alter table public.figurinhas_catalogo add column if not exists pro boolean not null default false;
do $$ begin
  if not exists (select 1 from figurinhas_catalogo where pro) then
    update figurinhas_catalogo set pro = id not in ('hoje-teve','a-gata-foi','constancia-linda','ck-girl','create-keep-live','voce-apareceu-por-voce','bora-juntas','treino-concluido',
      'orgulho-de-voce','amei','concluido','mais-um-check','missao-cumprida','que-tudooo','to-com-voce','voce-inspira','isso-ai-mulher','bom-diaaa','partiu','voce-consegue',
      'vai-com-tudo','um-passo-de-cada-vez','sobrevivi-ao-treino','treino-pago','to-feliz');
  end if;
end $$;
create or replace function public.confere_figurinha_pro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.figurinha is not null and exists (select 1 from figurinhas_catalogo where id = new.figurinha and pro) and not pode_recurso('stickers_todos') then
    raise exception 'figurinha disponível no CK Life Pro';
  end if;
  return new;
end $$;
drop trigger if exists confere_figurinha_pro on public.comentarios;
create trigger confere_figurinha_pro before insert on public.comentarios for each row execute function public.confere_figurinha_pro();
drop trigger if exists confere_figurinha_pro on public.posts;
create trigger confere_figurinha_pro before insert on public.posts for each row execute function public.confere_figurinha_pro();
drop policy if exists fg_criar on public.figurinhas;
create policy fg_criar on public.figurinhas for insert to authenticated with check (user_id = auth.uid() and midia like 'figurinha/' || auth.uid()::text || '/%' and pode_recurso('figurinha_propria'));

-- ---------- 10) O que o app pergunta: "qual é o meu plano agora?" ----------
create or replace function public.meu_plano() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); pl jsonb; cr date; m jsonb := (select valor from app_config where chave = 'monetizacao'); o ofertas_usuario; vf text;
begin
  if uid is null then return null; end if;
  pl := _plano(uid);
  select criado into cr from alunas where id = uid;
  select * into o from ofertas_usuario where user_id = uid and expira > now() order by expira desc limit 1;
  select status into vf from verificacoes where user_id = uid order by criado desc limit 1;
  return pl || jsonb_build_object(
    'agora', now(),
    'dias_restantes', case when pl ->> 'fim' is not null then greatest(0, ceil(extract(epoch from ((pl ->> 'fim')::timestamptz - now())) / 86400)) end,
    'anuncios', not (pl ->> 'pro')::boolean and coalesce(cr, current_date) <= current_date - coalesce((m ->> 'ads_free_days')::int, 30),
    'anuncios_a_partir', coalesce(cr, current_date) + coalesce((m ->> 'ads_free_days')::int, 30) + 1,
    'oferta', case when o.id is not null then _oferta_json(o) end,
    'verificacao', coalesce(vf, 'not_requested'),
    'recursos', (select jsonb_object_agg(id, pode_recurso(id, uid)) from recursos),
    'limites', (select jsonb_object_agg(id, case when (pl ->> 'pro')::boolean then limite_pro else limite_free end) from recursos where limite_free is not null or limite_pro is not null)
  );
end $$;
grant execute on function public.meu_plano() to authenticated;

