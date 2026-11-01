-- =====================================================================
-- CK Life · Aviso no celular para a equipe quando chega aluna nova
-- Só acrescenta. Não apaga nada. Pode rodar de novo.
-- Quem recebe: pessoas do painel (admins) com o aviso ligado e com
-- "Avisos no celular" ativado na conta delas.
-- O aviso diz só o primeiro nome e a cidade (nada de saúde, peso ou ciclo).
-- =====================================================================

alter table public.admins add column if not exists aviso_nova_aluna boolean not null default true;

create or replace function public._aviso_nova_aluna() returns trigger
language plpgsql security definer set search_path = public as $$
declare a record; nome text; cid text; uf text; corpo text;
begin
  begin
    -- a própria equipe entrando no app não conta como aluna nova
    if exists (select 1 from admins where user_id = new.id) then return new; end if;
    nome := nullif(split_part(trim(coalesce(new.nome, new.dados ->> 'nome', '')), ' ', 1), '');
    if new.dados ? 'cidadeInfo' and (new.dados -> 'cidadeInfo' ->> 'id') = new.cidade::text then
      cid := new.dados -> 'cidadeInfo' ->> 'nome'; uf := new.dados -> 'cidadeInfo' ->> 'uf';
    elsif new.cidade is not null then
      select c.dados ->> 'nome', c.dados ->> 'uf' into cid, uf from colecoes c where c.nome = 'cidades' and c.id = new.cidade::text;
    end if;
    corpo := coalesce(nome, 'Uma aluna nova') || case when cid is not null then ', de ' || cid || coalesce(' · ' || nullif(uf, ''), '') else '' end || ', acabou de se cadastrar.';
    for a in select ad.user_id from admins ad
             where ad.aviso_nova_aluna and exists (select 1 from push_inscricoes p where p.user_id = ad.user_id) loop
      begin
        perform _push_um(a.user_id, jsonb_build_object('title', 'Nova aluna no CK Life 💚', 'body', corpo, 'tag', 'nova_aluna', 'url', '/admin#admin-alunos'));
      exception when others then null;
      end;
    end loop;
  exception when others then null; -- o cadastro da aluna nunca pode falhar por causa do aviso
  end;
  return new;
end $$;
revoke all on function public._aviso_nova_aluna() from public, anon, authenticated;

drop trigger if exists aviso_nova_aluna on public.alunas;
create trigger aviso_nova_aluna after insert on public.alunas for each row execute function public._aviso_nova_aluna();

-- a pessoa do painel liga/desliga o próprio aviso
create or replace function public.admin_aviso_nova_aluna(p_ligar boolean default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v boolean;
begin
  if not exists (select 1 from admins where user_id = auth.uid()) then raise exception 'Sem permissão'; end if;
  if p_ligar is not null then update admins set aviso_nova_aluna = p_ligar where user_id = auth.uid(); end if;
  select aviso_nova_aluna into v from admins where user_id = auth.uid();
  return jsonb_build_object('ligado', v, 'aparelhos', (select count(*) from push_inscricoes where user_id = auth.uid()));
end $$;
revoke all on function public.admin_aviso_nova_aluna(boolean) from public, anon;
grant execute on function public.admin_aviso_nova_aluna(boolean) to authenticated;
