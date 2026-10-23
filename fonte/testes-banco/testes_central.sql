-- Central de notificações, lembretes e anúncios
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set A '''c1c1c1c1-0000-0000-0000-0000000000c1'''
\set B '''c2c2c2c2-0000-0000-0000-0000000000c2'''
reset role;
insert into auth.users values (:A, 'ana@t'), (:B, 'bia@t');
insert into alunas (id, email, nome, cidade) values (:A, 'ana@t', 'Ana', 1), (:B, 'bia@t', 'Bia', 2);
insert into push_inscricoes (endpoint, user_id, p256dh, auth) values ('https://push/ana', :A, 'k', 'a');
-- ===== permissões =====
select tst_como(:A);
select nega($$ insert into notif_campanhas (titulo, mensagem) values ('x', 'y') $$, 'aluna não cria notificação');
select ok((select count(*) from notif_campanhas) = 0, 'aluna não lê a central');
select ok(admin_notif_previa('{"tipo":"todas"}') is null, 'aluna não vê o público');
select nega($$ select _notif_disparar(gen_random_uuid()) $$, 'aluna não dispara envio');
select nega($$ select push_tick() $$, 'aluna não roda o relógio');
-- ===== admin cria, prévia, envia =====
select tst_como(:M);
insert into notif_campanhas (titulo, mensagem, publico, enviados) values ('Novo treino', 'Seu treino de glúteos chegou', '{"tipo":"cidade","cidade":"1"}', 999);
select ok((select enviados from notif_campanhas where titulo = 'Novo treino') = 0, 'painel não inventa números');
select ok((admin_notif_previa('{"tipo":"cidade","cidade":"1"}') ->> 'inscritas')::int = 1, 'prévia conta quem tem aviso ligado');
select ok((admin_notif_enviar_agora((select id from notif_campanhas where titulo = 'Novo treino')) ->> 'ok')::boolean, 'envio imediato');
reset role;
select ok((select status from notif_campanhas where titulo = 'Novo treino') = 'enviada', 'status enviada');
select ok((select count(*) from notificacoes where ref like 'camp:%' and user_id = :A) = 1 and (select count(*) from notificacoes where ref like 'camp:%' and user_id = :B) = 0, 'só o público certo recebe na lista do app');
select ok((select count(*) from push_fila where campanha is not null and :A = any(usuarios)) = 1, 'envio para o celular em lote');
select ok((select count(*) from push_fila where user_id = :A and campanha is null) = 0, 'não duplica envio individual');
select ok((select count(*) from net.log) >= 1, 'chamou o servidor de envio');
-- servidor informa resultado
select push_pegar((select id from push_fila where campanha is not null limit 1), (select token from push_fila where campanha is not null limit 1)) is not null as pegou \gset
select push_resultado((select id from push_fila where campanha is not null limit 1), (select token from push_fila where campanha is not null limit 1), 1, 0);
select ok((select enviados from notif_campanhas where titulo = 'Novo treino') = 1, 'conta enviados reais');
select push_resultado((select id from push_fila where campanha is not null limit 1), 'x', 50, 0);
select ok((select enviados from notif_campanhas where titulo = 'Novo treino') = 1, 'resultado não é contado duas vezes');
select id as cid, rk as crk from notif_campanhas where titulo = 'Novo treino' \gset
select tst_como(null);
select push_confirma(:'cid', :'crk', 'recebido');
select push_confirma(:'cid', :'crk', 'recebido');
select push_confirma(:'cid', 'chave-errada', 'clique');
reset role;
select ok((select recebidos from notif_campanhas where titulo = 'Novo treino') = 1, 'recebidos nunca passa de enviados');
select ok((select cliques from notif_campanhas where titulo = 'Novo treino') = 0, 'clique com chave errada é ignorado');
select tst_como(:M);
select nega($$ update notif_campanhas set titulo = 'mudou' where titulo = 'Novo treino' $$, 'enviada não pode ser editada');
-- agendada
insert into notif_campanhas (titulo, mensagem, status, enviar_em) values ('Amanhã', 'Teste agendado', 'agendada', now() - interval '1 minute');
reset role; select push_tick();
select ok((select status from notif_campanhas where titulo = 'Amanhã') = 'enviada', 'agendada sai no horário');
select ok((select count(*) from auditoria where acao like 'notificacao_%') >= 2, 'notificações registradas na auditoria');
-- ===== lembretes =====
select tst_como(:A);
insert into lembretes (tipo, hora, dias, antecedencia, fuso) values ('treino', ((now() at time zone 'America/Cuiaba') + interval '20 minutes')::time, array['MO','TU','WE','TH','FR','SA','SU'], 20, 'America/Cuiaba');
select nega($$ insert into lembretes (user_id, tipo, hora, dias) values ('c2c2c2c2-0000-0000-0000-0000000000c2', 'agua', '10:00', array['MO']) $$, 'não cria lembrete para outra pessoa');
reset role;
select push_tick();
select ok((select count(*) from lembretes_envios where user_id = :A) = 1, 'lembrete de treino enviado 20 min antes');
select ok((select payload ->> 'title' from push_fila where user_id = :A and lembrete_envio is not null order by criado desc limit 1) like 'Seu treino começa em 20 minutos%', 'texto do lembrete');
select push_tick();
select ok((select count(*) from lembretes_envios where user_id = :A) = 1, 'lembrete não duplica');
update lembretes set ativo = false where user_id = :A; delete from lembretes_envios;
select push_tick();
select ok((select count(*) from lembretes_envios where user_id = :A) = 0, 'lembrete desligado não envia');
update lembretes set ativo = true, pausado_ate = current_date + 1;
select push_tick();
select ok((select count(*) from lembretes_envios where user_id = :A) = 0, 'treino pulado/cancelado no dia não envia');
update lembretes set pausado_ate = null, fuso = 'Lugar/Inexistente';
select ok((select fuso from lembretes where user_id = :A) = 'America/Cuiaba', 'fuso inválido vira o de MT');
-- ===== anúncios =====
select tst_como(:A);
select nega($$ insert into storage.objects (bucket_id, name) values ('anuncios', 'img/x.jpg') $$, 'aluna não envia mídia de anúncio');
select tst_como(:M);
insert into storage.objects (bucket_id, name) values ('anuncios', 'img/x.jpg');
select nega($$ insert into storage.objects (bucket_id, name) values ('anuncios', 'qualquer/x.exe') $$, 'só pastas permitidas');
select ok((select allowed_mime_types from storage.buckets where id = 'anuncios') @> array['video/mp4'], 'tipos de arquivo limitados');
-- ===== dashboard =====
select ok((admin_painel_resumo() ->> 'push_inscritas')::int = 1, 'dashboard com números reais');
select tst_como(:A); select ok(admin_painel_resumo() is null, 'aluna não vê dashboard');
reset role;
