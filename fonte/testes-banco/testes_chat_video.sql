-- Vídeo no chat
\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
reset role; delete from bloqueios where true; delete from mensagens where conversa_id = '44444444-0000-0000-0000-000000000004' and tipo = 'video';
select tst_como(:A);
select nega($$ insert into mensagens (conversa_id, tipo, midia, duracao) values ('44444444-0000-0000-0000-000000000004', 'video', 'chat/44444444-0000-0000-0000-000000000004/v1.mp4', 42) $$, 'aluna não envia mais vídeo no chat');
select set_config('ck.ant', coalesce(current_setting('request.jwt.claim.sub', true), ''), false), set_config('request.jwt.claim.sub', 'dddddddd-0000-0000-0000-00000000000d', false), set_config('ck.role', current_user, false);
reset role; insert into mensagens (conversa_id, autor, tipo, midia, duracao) select id, a, 'video', 'chat/44444444-0000-0000-0000-000000000004/antigo.mp4', 10 from conversas where id = '44444444-0000-0000-0000-000000000004';
select set_config('request.jwt.claim.sub', current_setting('ck.ant'), false); select case when current_setting('ck.ant') <> '' then tst_como(current_setting('ck.ant')) end;
select ok((select ultima from conversas where id = '44444444-0000-0000-0000-000000000004') = '🎬 Vídeo', 'vídeo antigo continua aparecendo na lista (🎬 Vídeo)');
select nega($$ insert into mensagens (conversa_id, tipo) values ('44444444-0000-0000-0000-000000000004', 'video') $$, 'vídeo sem arquivo é recusado');
select nega($$ insert into mensagens (conversa_id, tipo, midia) values ('44444444-0000-0000-0000-000000000004', 'video', 'chat/99999999-0000-0000-0000-000000000009/x.mp4') $$, 'vídeo apontando para outra conversa');
select tst_como(:B);
select ok((select count(*) from mensagens where tipo = 'video' and conversa_id = '44444444-0000-0000-0000-000000000004' and midia not like '%antigo.mp4') = 0, 'vídeo de aluna não é gravado (o antigo continua)');
reset role;
select ok((select not exists (select 1 from unnest(allowed_mime_types) x where x like 'video/%') from storage.buckets where id = 'social'), 'armazenamento das alunas não aceita vídeo novo (foto e áudio continuam)');
