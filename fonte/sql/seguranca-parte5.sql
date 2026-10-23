-- CK Life · Segurança · PARTE 5 de 5 (rode na ordem)
-- ---------- 10) Limites contra abuso (no banco, não só no app) ----------
create index if not exists comentarios_user_idx on public.comentarios (user_id, criado);
create index if not exists mensagens_autor_idx on public.mensagens (autor, criado);
create index if not exists curtidas_user_idx on public.curtidas (user_id, criado);
create index if not exists seguidores_seguidor_idx on public.seguidores (seguidor, criado);
create or replace function public.limite_uso() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; lim int; jan interval; col text := tg_argv[0];
begin
  if e_admin() then return new; end if;
  lim := tg_argv[1]::int; jan := tg_argv[2]::interval;
  execute format('select count(*) from %I where %I = $1 and criado > now() - $2', tg_table_name, col) into n using auth.uid(), jan;
  if n >= lim then raise exception 'muitas acoes em pouco tempo, tente mais tarde'; end if;
  return new;
end $$;
drop trigger if exists limite_posts on public.posts;
create trigger limite_posts before insert on public.posts for each row execute function public.limite_uso('user_id', '10', '10 minutes');
drop trigger if exists limite_comentarios on public.comentarios;
create trigger limite_comentarios before insert on public.comentarios for each row execute function public.limite_uso('user_id', '30', '10 minutes');
drop trigger if exists limite_mensagens on public.mensagens;
create trigger limite_mensagens before insert on public.mensagens for each row execute function public.limite_uso('autor', '60', '1 minute');
drop trigger if exists limite_curtidas on public.curtidas;
create trigger limite_curtidas before insert on public.curtidas for each row execute function public.limite_uso('user_id', '200', '10 minutes');
drop trigger if exists limite_seguir on public.seguidores;
create trigger limite_seguir before insert on public.seguidores for each row execute function public.limite_uso('seguidor', '80', '1 hour');

-- ---------- 11) Painel: números e verificações técnicas reais ----------
create or replace function public.seguranca_resumo() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('seguranca') then return null; end if;
  return json_build_object(
    'usuarias', (select count(*) from alunas),
    'ativas_30d', (select count(distinct user_id) from acessos where dia > current_date - 30),
    'suspensas', (select count(*) from alunas where situacao = 'suspensa'),
    'bloqueadas', (select count(*) from alunas where situacao = 'bloqueada' or (bloqueado and situacao = 'ativa')),
    'em_exclusao', (select count(*) from alunas where situacao = 'em_exclusao'),
    'denuncias_abertas', (select count(*) from denuncias where status = 'aberta'),
    'denuncias_criticas', (select count(*) from denuncias where status = 'aberta' and prioridade in ('alta','critica')),
    'denuncias_24h', (select count(*) from denuncias where criado > now() - interval '1 day'),
    'lgpd_abertas', (select count(*) from solicitacoes where status not in ('concluida','recusada')),
    'lgpd_exclusao', (select count(*) from solicitacoes where tipo = 'eliminacao' and status not in ('concluida','recusada')),
    'lgpd_vencendo', (select count(*) from solicitacoes where status not in ('concluida','recusada') and prazo <= current_date + 2),
    'incidentes_abertos', (select count(*) from incidentes where status <> 'encerrado' and not arquivado),
    'incidentes_analise', (select count(*) from incidentes where status in ('detectado','investigando')),
    'incidentes_comunicacao', (select count(*) from incidentes where avaliar_comunicacao and decisao_comunicacao is null and not arquivado),
    'acessos_admin_7d', (select count(*) from auditoria where acao = 'login_admin' and criado > now() - interval '7 days'),
    'acessos_negados_7d', (select count(*) from auditoria where resultado = 'negado' and criado > now() - interval '7 days'),
    'config_alterada_7d', (select count(*) from auditoria where recurso = 'seguranca_config' and criado > now() - interval '7 days'),
    'midias_privadas', (select count(*) from storage.objects where bucket_id = 'social'),
    'docs_publicados', (select count(*) from documentos where status = 'publicado'),
    'retencao_pendente', (select count(*) from retencao where not validado),
    'inventario_pendente', (select count(*) from inventario where base_legal = 'VALIDAÇÃO JURÍDICA NECESSÁRIA'),
    'ciclo_ativas', (select count(*) from ciclo where ativo)
  );
end $$;
create or replace function public.seguranca_checagens() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not admin_ve('seguranca') then return null; end if;
  return json_build_object(
    'tabelas_sem_rls', coalesce((select json_agg(c.relname) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity), '[]'),
    'buckets', coalesce((select json_agg(json_build_object('id', b.id, 'publico', b.public, 'limite', b.file_size_limit, 'tipos', b.allowed_mime_types, 'arquivos', (select count(*) from storage.objects o where o.bucket_id = b.id))) from storage.buckets b), '[]'),
    'orfaos_social', (select count(*) from storage.objects o where o.bucket_id = 'social'
        and not exists (select 1 from posts p where p.midia = o.name) and not exists (select 1 from stories s where s.midia = o.name)
        and not exists (select 1 from mensagens m where m.midia = o.name) and not exists (select 1 from perfis f where f.foto = o.name or f.capa = o.name)),
    'stories_vencidos_com_arquivo', (select count(*) from storage.objects o where o.bucket_id = 'social' and o.name like 'story/%' and not exists (select 1 from stories s where s.midia = o.name and s.expira > now())),
    'conteudo_moderado', (select count(*) from posts where oculto) + (select count(*) from comentarios where oculto) + (select count(*) from mensagens where oculto_mod) + (select count(*) from stories where oculto),
    'admins_total', (select count(*) from admins where coalesce((perms->>'total')::boolean, false)),
    'admins', (select count(*) from admins),
    'mfa_obrigatorio', config_valor('mfa_admin_obrigatorio'),
    'idade_minima', config_valor('idade_minima'),
    'idade_validada', config_valor('idade_validada'),
    'auditoria_imutavel', exists (select 1 from pg_trigger where tgname = 'auditoria_imutavel'),
    'limites_ativos', (select count(*) from pg_trigger where tgname like 'limite_%')
  );
end $$;
-- só a área de segurança muda a configuração; tudo registrado
drop policy if exists sc_ler on public.seguranca_config;
create policy sc_ler on public.seguranca_config for select using (chave in ('idade_minima','plataforma','encarregado') or admin_ve('seguranca'));
drop policy if exists sc_mudar on public.seguranca_config;
create policy sc_mudar on public.seguranca_config for update to authenticated using (admin_pode('seguranca')) with check (admin_pode('seguranca'));
create or replace function public.audita_config() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.atualizado := now(); new.atualizado_por := auth.uid(); new.chave := old.chave;
  perform auditar('config_alterada', 'seguranca_config', new.chave, 'ok', old.valor::text || ' -> ' || new.valor::text);
  return new;
end $$;
drop trigger if exists audita_config on public.seguranca_config;
create trigger audita_config before update on public.seguranca_config for each row execute function public.audita_config();

select 'Segurança e privacidade prontas' as status;

