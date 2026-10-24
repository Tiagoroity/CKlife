-- CK Life · VÍDEO NO CHAT (até 1 minuto, qualidade original do celular)
-- Seguro rodar mais de uma vez. Não apaga nada.

-- 1) mensagens aceitam o tipo "video" (precisa ter o arquivo)
alter table public.mensagens drop constraint if exists mensagens_conteudo_ok;
alter table public.mensagens add constraint mensagens_conteudo_ok check (
  tipo in ('texto','foto','audio','story','post','video')
  and char_length(coalesce(texto, '')) <= 2000
  and (tipo <> 'texto' or char_length(coalesce(texto, '')) >= 1)
  and (tipo not in ('foto','audio','video') or midia is not null)
  and (duracao is null or duracao between 0 and 300));

-- 2) lista de conversas mostra "🎬 Vídeo"
create or replace function public.atualiza_conversa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update conversas set ultima = left(coalesce(nullif(new.texto, ''), case new.tipo when 'foto' then '📷 Foto' when 'audio' then '🎤 Áudio' when 'video' then '🎬 Vídeo' when 'story' then 'Respondeu ao Story' when 'post' then 'Publicação compartilhada' else '' end), 90),
    ultima_em = new.criado, ultimo_autor = new.autor,
    lida_a = case when a = new.autor then new.criado else lida_a end,
    lida_b = case when b = new.autor then new.criado else lida_b end
  where id = new.conversa_id;
  return new;
end $$;

-- 3) armazenamento: garante vídeo até 50 MB na pasta privada (já liberado para posts e Stories)
update storage.buckets set file_size_limit = greatest(coalesce(file_size_limit, 0), 52428800),
  allowed_mime_types = (select array(select distinct x from unnest(coalesce(allowed_mime_types, '{}') || array['video/mp4','video/webm','video/quicktime']) x))
where id = 'social';
