-- =====================================================================
-- CK Life · Aviso de aluna nova só no PAINEL (nunca no app da aluna)
-- Só acrescenta. Não apaga nada. Pode rodar de novo.
-- Antes: o aviso ia para todo celular da conta do admin, inclusive o app
-- da aluna (quando o admin também usa o app como aluna).
-- Agora: só vai para o aparelho que foi ativado DENTRO do painel (CK Admin).
-- Os outros avisos (Coach, mensagens da equipe, lembretes) não mudam.
-- =====================================================================

-- marca de onde veio a inscrição do celular: 'admin' = ativada no painel
alter table public.push_inscricoes add column if not exists app text;

-- envio: aviso marcado "so: admin" só sai para aparelhos do painel
create or replace function public.push_pegar(p_id uuid, p_token text) returns json
language plpgsql security definer set search_path = public as $$
declare f push_fila; so_painel boolean;
begin
  update push_fila set usado = now() where id = p_id and token = p_token and usado is null and criado > now() - interval '10 minutes' returning * into f;
  if f.id is null then return null; end if;
  so_painel := coalesce(f.payload ->> 'so', '') = 'admin';
  return json_build_object('payload', f.payload, 'subs', (select coalesce(json_agg(json_build_object('endpoint', endpoint, 'keys', json_build_object('p256dh', p256dh, 'auth', auth))), '[]'::json)
    from push_inscricoes where (user_id = f.user_id or (f.usuarios is not null and user_id = any(f.usuarios)))
      and (not so_painel or app = 'admin')));
end $$;
grant execute on function public.push_pegar(uuid, text) to anon, authenticated;

-- aviso de aluna nova: só para quem tem aparelho ativado no painel
create or replace function public._aviso_nova_aluna() returns trigger
language plpgsql security definer set search_path = public as $$
declare a record; nome text; cid text; uf text; corpo text;
begin
  begin
    if exists (select 1 from admins where user_id = new.id) then return new; end if;
    nome := nullif(split_part(trim(coalesce(new.nome, new.dados ->> 'nome', '')), ' ', 1), '');
    if new.dados ? 'cidadeInfo' and (new.dados -> 'cidadeInfo' ->> 'id') = new.cidade::text then
      cid := new.dados -> 'cidadeInfo' ->> 'nome'; uf := new.dados -> 'cidadeInfo' ->> 'uf';
    elsif new.cidade is not null then
      select c.dados ->> 'nome', c.dados ->> 'uf' into cid, uf from colecoes c where c.nome = 'cidades' and c.id = new.cidade::text;
    end if;
    corpo := coalesce(nome, 'Uma aluna nova') || case when cid is not null then ', de ' || cid || coalesce(' · ' || nullif(uf, ''), '') else '' end || ', acabou de se cadastrar.';
    for a in select ad.user_id from admins ad
             where ad.aviso_nova_aluna and exists (select 1 from push_inscricoes p where p.user_id = ad.user_id and p.app = 'admin') loop
      begin
        perform _push_um(a.user_id, jsonb_build_object('title', 'Nova aluna no CK Life 💚', 'body', corpo, 'tag', 'nova_aluna', 'url', '/admin#admin-alunos', 'so', 'admin'));
      exception when others then null;
      end;
    end loop;
  exception when others then null; -- o cadastro da aluna nunca pode falhar por causa do aviso
  end;
  return new;
end $$;
revoke all on function public._aviso_nova_aluna() from public, anon, authenticated;

-- o cartão do painel conta só os aparelhos ativados no painel
create or replace function public.admin_aviso_nova_aluna(p_ligar boolean default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v boolean;
begin
  if not exists (select 1 from admins where user_id = auth.uid()) then raise exception 'Sem permissão'; end if;
  if p_ligar is not null then update admins set aviso_nova_aluna = p_ligar where user_id = auth.uid(); end if;
  select aviso_nova_aluna into v from admins where user_id = auth.uid();
  return jsonb_build_object('ligado', v, 'aparelhos', (select count(*) from push_inscricoes where user_id = auth.uid() and app = 'admin'));
end $$;
revoke all on function public.admin_aviso_nova_aluna(boolean) from public, anon;
grant execute on function public.admin_aviso_nova_aluna(boolean) to authenticated;

-- =====================================================================
-- PARTE 2 · Falhas das notificações explicadas no painel
-- Antes: celular que desinstalou o app ou trocou de aparelho contava como
-- "falha" (o serviço da Apple/Google responde "esse aparelho não existe mais").
-- Agora: isso aparece separado como "aparelhos antigos removidos" e o painel
-- mostra o motivo das falhas de verdade.
-- =====================================================================
create table if not exists public.notif_resultados (
  campanha uuid primary key references public.notif_campanhas(id) on delete cascade,
  expirados int not null default 0,
  motivos jsonb not null default '{}'::jsonb,
  atualizado timestamptz not null default now()
);
alter table public.notif_resultados enable row level security;
drop policy if exists nr_ler on public.notif_resultados;
create policy nr_ler on public.notif_resultados for select to authenticated using (admin_ve('notificacoes'));

create or replace function public.push_resultado2(p_id uuid, p_token text, p_enviados int, p_falhas int, p_expirados int default 0, p_motivos jsonb default '{}'::jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare f push_fila; k text; v jsonb; m jsonb := '{}'::jsonb;
begin
  update push_fila set resultado = now() where id = p_id and token = p_token and usado > now() - interval '15 minutes' and resultado is null returning * into f;   -- uma vez só
  if f.id is null then return; end if;
  perform set_config('ck.sistema', '1', true);
  if f.campanha is not null then
    update notif_campanhas set enviados = enviados + greatest(0, least(p_enviados, 100000)), falhas = falhas + greatest(0, least(p_falhas, 100000)) where id = f.campanha;
    -- motivos: só códigos curtos e números (nada vindo de fora é guardado como texto livre)
    if jsonb_typeof(p_motivos) = 'object' then
      for k, v in select * from jsonb_each(p_motivos) loop
        if k ~ '^[a-z0-9_]{1,12}$' and jsonb_typeof(v) = 'number' then m := m || jsonb_build_object(k, greatest(0, least(v::int, 100000))); end if;
      end loop;
    end if;
    insert into notif_resultados (campanha, expirados, motivos) values (f.campanha, greatest(0, least(coalesce(p_expirados, 0), 100000)), m)
    on conflict (campanha) do update set expirados = notif_resultados.expirados + excluded.expirados,
      motivos = (select coalesce(jsonb_object_agg(key, val), '{}'::jsonb) from (select key, sum(value::int) val from (select * from jsonb_each(notif_resultados.motivos) union all select * from jsonb_each(excluded.motivos)) x group by key) y),
      atualizado = now();
  end if;
  if f.lembrete_envio is not null then
    update lembretes_envios set status = case when p_enviados > 0 then 'enviado' else 'falhou' end where id = f.lembrete_envio;
  end if;
  if f.coach_envio is not null then
    update coach_envios set push_status = case when p_enviados > 0 then 'enviado' else 'falhou' end where id = f.coach_envio;
  end if;
  perform set_config('ck.sistema', '0', true);
end $$;
grant execute on function public.push_resultado2(uuid, text, int, int, int, jsonb) to anon, authenticated;
