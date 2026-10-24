-- Vídeo no chat
\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
reset role; delete from bloqueios where true; delete from mensagens where conversa_id = '44444444-0000-0000-0000-000000000004' and tipo = 'video';
select tst_como(:A);
insert into mensagens (conversa_id, tipo, midia, duracao) values ('44444444-0000-0000-0000-000000000004', 'video', 'chat/44444444-0000-0000-0000-000000000004/v1.mp4', 42);
select ok((select ultima from conversas where id = '44444444-0000-0000-0000-000000000004') = '🎬 Vídeo', 'lista de conversas mostra 🎬 Vídeo');
select nega($$ insert into mensagens (conversa_id, tipo) values ('44444444-0000-0000-0000-000000000004', 'video') $$, 'vídeo sem arquivo é recusado');
select nega($$ insert into mensagens (conversa_id, tipo, midia) values ('44444444-0000-0000-0000-000000000004', 'video', 'chat/99999999-0000-0000-0000-000000000009/x.mp4') $$, 'vídeo apontando para outra conversa');
select tst_como(:B);
select ok((select count(*) from mensagens where tipo = 'video' and conversa_id = '44444444-0000-0000-0000-000000000004') = 1, 'a outra pessoa da conversa vê o vídeo');
reset role;
select ok((select 'video/quicktime' = any(allowed_mime_types) and file_size_limit >= 52428800 from storage.buckets where id = 'social'), 'armazenamento aceita vídeo até 50 MB');
