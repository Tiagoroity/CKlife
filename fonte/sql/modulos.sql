-- =====================================================================
-- CK Life · Módulos do app, Pro grátis pelo painel e leitura de ajustes
-- Pode rodar de novo. Não apaga dados.
-- =====================================================================
-- 1) O que as alunas podem ler do conteúdo do painel (inclui módulos, ajustes de voz dos exercícios e receitas grátis/Pro)
drop policy if exists colecoes_ler on public.colecoes;
create policy colecoes_ler on public.colecoes for select to authenticated using (
  nome in ('cidades','segmentos','config','freq','anunciantes','campanhas','parceiros','profissionais','avisos','receitasExtras','exercExtras','receitasOcultas',
           'empresas','servicos','produtos','banners','categorias','exercAjustes','receitasPlano','modulos')
  or (nome = 'cupons' and dados->>'user' = auth.uid()::text)
  or e_admin()
);

-- 2) Pro grátis: quem cuida de Alunas ou de Monetização pode dar/tirar; a aluna recebe um aviso; tudo na auditoria
create or replace function public.admin_conceder_pro(p_user uuid, p_dias int, p_motivo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare nid uuid;
begin
  if not (admin_pode('monetizacao') or admin_pode('alunos')) then raise exception 'sem permissão'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  if p_dias is null or p_dias < 1 or p_dias > 3660 then raise exception 'período inválido'; end if;
  insert into assinaturas (user_id, email, plano, provider, status, inicio, fim, motivo, criado_por)
    select p_user, email, case when p_dias >= 365 then 'pro_anual' else 'pro_mensal' end, 'manual', 'active', now(), now() + make_interval(days => p_dias), p_motivo, auth.uid() from alunas where id = p_user returning id into nid;
  if nid is null then raise exception 'aluna não encontrada'; end if;
  perform auditar('pro_concedido', 'assinaturas', p_user::text, 'ok', p_dias || ' dias · ' || p_motivo);
  insert into notificacoes (user_id, tipo, ref, texto) values (p_user, 'sistema', 'pro:' || nid,
    'Você ganhou o CK Life Pro por ' || case when p_dias >= 3650 then 'tempo indeterminado' when p_dias >= 365 then (p_dias / 365) || ' ano(s)' else p_dias || ' dias' end || '. Aproveite tudo liberado!') on conflict do nothing;
  return nid;
end $$;
grant execute on function public.admin_conceder_pro(uuid, int, text) to authenticated;

create or replace function public.admin_remover_pro_usuaria(p_user uuid, p_motivo text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not (admin_pode('monetizacao') or admin_pode('alunos')) then raise exception 'sem permissão'; end if;
  if coalesce(trim(p_motivo), '') = '' then raise exception 'informe o motivo'; end if;
  update assinaturas set status = 'expired', fim = now(), motivo = p_motivo, atualizado = now()
    where user_id = p_user and provider in ('manual','promocao') and status in ('active','trialing') and fim > now();
  get diagnostics n = row_count;
  perform auditar('pro_removido', 'assinaturas', p_user::text, 'ok', p_motivo);
  return n;
end $$;
grant execute on function public.admin_remover_pro_usuaria(uuid, text) to authenticated;
-- lista de planos no painel também para quem cuida de Alunas (já existia; só reforça)
select 'Módulos e Pro grátis prontos' as status;
