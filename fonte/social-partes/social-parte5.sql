-- CK Life · Rede social · PARTE 5 de 5 (rode na ordem, uma de cada vez)
-- ---------- 8) Storage PRIVADO "social" (perfil, capa, posts, Stories, chat) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social', 'social', false, 10485760, array['image/jpeg','image/png','image/webp','audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/aac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
-- quem pode LER cada arquivo (a URL temporária só é gerada se isto for verdadeiro)
create or replace function public.social_pode_ler(p_nome text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare parte text[] := string_to_array(p_nome, '/'); dono uuid; conv uuid;
begin
  if auth.uid() is null or array_length(parte, 1) < 3 then return false; end if;
  if parte[1] = 'perfil' then dono := parte[2]::uuid; return dono = auth.uid() or not bloqueio_entre(auth.uid(), dono) or e_admin();
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
  if parte[3] !~ '^[a-zA-Z0-9_-]{6,80}\.(jpg|jpeg|png|webp|webm|m4a|mp4|ogg|mp3|aac)$' then return false; end if;
  if parte[1] in ('perfil','post','story') then return parte[2] = auth.uid()::text; end if;
  if parte[1] = 'chat' then return e_participante(parte[2]::uuid) and not bloqueio_entre(auth.uid(), outro_da_conversa(parte[2]::uuid)); end if;
  return false;
exception when others then return false;
end $$;
drop policy if exists social_ler on storage.objects;
create policy social_ler on storage.objects for select to authenticated using (bucket_id = 'social' and public.social_pode_ler(name));
drop policy if exists social_enviar on storage.objects;
create policy social_enviar on storage.objects for insert to authenticated with check (bucket_id = 'social' and public.social_pode_gravar(name));
drop policy if exists social_apagar on storage.objects;
create policy social_apagar on storage.objects for delete to authenticated using (bucket_id = 'social' and owner = auth.uid());

-- ---------- 9) Tempo real (mensagens, conversas, notificações) ----------
do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['mensagens','conversas','notificacoes'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

select 'Parte 5 pronta' as status;
