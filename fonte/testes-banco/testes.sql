-- Testes de segurança da rede social (rodar só no Postgres local de teste)
\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set C '''cccccccc-0000-0000-0000-00000000000c'''
\set M '''dddddddd-0000-0000-0000-00000000000d'''
reset role;
create or replace function public.ok(c boolean, msg text) returns void language plpgsql as $$
begin if coalesce(c, false) then raise notice 'OK    %', msg; else raise notice 'FALHA %', msg; end if; end $$;
create or replace function public.nega(sql text, msg text) returns void language plpgsql as $$
begin execute sql; raise notice 'FALHA % (deveria ser negado)', msg;
exception when others then raise notice 'OK    % (negado: %)', msg, left(sqlerrm, 60); end $$;
grant execute on function public.ok(boolean, text), public.nega(text, text) to anon, authenticated;
insert into auth.users values (:A, 'a@t'), (:B, 'b@t'), (:C, 'c@t'), (:M, 'adm@t');
insert into alunas (id, email, nome) values (:A, 'a@t', 'Ana A'), (:B, 'b@t', 'Bia B'), (:C, 'c@t', 'Carla C'), (:M, 'adm@t', 'Admin');
insert into admins (user_id, email, nome) values (:M, 'adm@t', 'Admin');

-- ===== PERFIS =====
select tst_como(:A); insert into perfis (username, nome, bio) values ('Ana.Fit', 'Ana A', 'oi');
select tst_como(:B); insert into perfis (username, nome) values ('bia', 'Bia B');
select tst_como(:C); insert into perfis (username, nome) values ('carla', 'Carla C');
select ok((select username from perfis where user_id = :A) = 'ana.fit', 'username salvo em minúsculas');
select tst_como(:M); select nega($$ insert into perfis (username, nome) values ('ANA.FIT', 'x') $$, 'username repetido (outra caixa)'); select tst_como(:C);
select nega($$ update perfis set username = 'ab' where user_id = auth.uid() $$, 'username curto demais');
select ok(not username_livre('bia'), 'username_livre detecta ocupado');
select ok(username_livre('nova.aluna'), 'username_livre aceita livre');
select tst_como(:C); update perfis set nome = 'HACK' where user_id = :A;
select ok((select nome from perfis where user_id = :A) = 'Ana A', 'C não edita perfil de A');
update perfis set foto = 'perfil/' || :A || '/x.jpg' where user_id = :C;
select ok((select foto from perfis where user_id = :C) is null, 'foto não aponta para pasta de outra');

-- ===== B fica privada =====
select tst_como(:B); update perfis set privado = true where user_id = auth.uid();
select tst_como(:A); insert into posts (id, user_id, nome, texto) values ('11111111-0000-0000-0000-000000000001', :A, 'Ana', 'post da A');
select tst_como(:B); insert into posts (id, user_id, nome, texto, midia) values ('22222222-0000-0000-0000-000000000002', :B, 'Bia', 'post privado da B', 'post/' || :B || '/foto1.jpg');
select nega($$ insert into posts (user_id, nome, texto, midia) values (auth.uid(), 'x', 'y', 'post/aaaaaaaa-0000-0000-0000-00000000000a/z.jpg') $$, 'post com mídia na pasta de outra');
select tst_como(:C);
select ok((select count(*) from posts where user_id = :B) = 0, 'C (não segue B privada) não vê posts de B');
select ok((select count(*) from posts where user_id = :A) = 1, 'C vê post de A (pública)');
select nega($$ insert into curtidas (post_id, user_id) values ('22222222-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-00000000000c') $$, 'C curte post privado de B');
select nega($$ insert into curtidas (post_id, user_id) values ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-00000000000a') $$, 'C falsifica curtida em nome de A');

-- ===== SEGUIR =====
insert into seguidores (seguido) values (:B);
select ok((select status from seguidores where seguidor = :C and seguido = :B) = 'pendente', 'seguir privada vira pedido pendente');
update seguidores set status = 'ativo' where seguidor = :C and seguido = :B;
select ok((select status from seguidores where seguidor = :C and seguido = :B) = 'pendente', 'C não aprova o próprio pedido');
select nega($$ insert into seguidores (seguidor, seguido) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'bbbbbbbb-0000-0000-0000-00000000000b') $$, 'C cria seguidor em nome de A');
select tst_como(:B);
select ok((select count(*) from notificacoes where user_id = :B and tipo = 'solicitou') = 1, 'B recebe notificação de pedido');
update seguidores set status = 'ativo' where seguidor = :C and seguido = :B;
select tst_como(:C);
select ok((select status from seguidores where seguidor = :C and seguido = :B) = 'ativo', 'B aceitou: C segue B');
select ok((select count(*) from posts where user_id = :B) = 1, 'agora C vê post de B');
select ok((select count(*) from notificacoes where user_id = :C and tipo = 'aceitou') = 1, 'C notificada do aceite');
select ok((perfil_contagens(:B)->>'seguidores')::int = 1, 'contagem de seguidores de B = 1');
select tst_como(:A); insert into seguidores (seguido) values (:C);
select ok((perfil_contagens(:C)->>'seguidores')::int = 1 and (perfil_contagens(:A)->>'seguindo')::int = 1, 'contagens seguir público');
select ok((select count(*) from notificacoes where user_id = :A) = 0, 'A não lê notificações de C');

-- ===== CURTIDAS / COMENTÁRIOS geram notificação sem duplicar =====
select tst_como(:C); insert into curtidas (post_id) values ('11111111-0000-0000-0000-000000000001');
delete from curtidas where post_id = '11111111-0000-0000-0000-000000000001' and user_id = :C;
insert into curtidas (post_id) values ('11111111-0000-0000-0000-000000000001');
select tst_como(:A); select ok((select count(*) from notificacoes where user_id = :A and tipo = 'curtida') = 1, 'curtir/descurtir/curtir não duplica notificação');

-- ===== STORIES =====
select tst_como(:B); insert into stories (id, midia, texto) values ('33333333-0000-0000-0000-000000000003', 'story/' || :B || '/s1.jpg', 'bom dia');
select nega($$ insert into stories (midia) values ('story/aaaaaaaa-0000-0000-0000-00000000000a/s.jpg') $$, 'Story com mídia na pasta de outra');
select tst_como(:A);
select ok((select count(*) from stories where user_id = :B) = 0, 'A (não segue B privada) não vê Story de B');
select nega($$ insert into story_vistas (story_id) values ('33333333-0000-0000-0000-000000000003') $$, 'A marca vista em Story que não pode ver');
select tst_como(:C);
select ok((select count(*) from stories where user_id = :B) = 1, 'C (seguidora) vê Story de B');
insert into story_vistas (story_id) values ('33333333-0000-0000-0000-000000000003');
insert into story_vistas (story_id) values ('33333333-0000-0000-0000-000000000003') on conflict do nothing;
select nega($$ insert into story_vistas (story_id, user_id) values ('33333333-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-00000000000a') $$, 'C falsifica visualização em nome de A');
delete from stories where id = '33333333-0000-0000-0000-000000000003';
reset role; select ok((select count(*) from stories where id = '33333333-0000-0000-0000-000000000003') = 1, 'C NÃO consegue apagar Story de B'); select tst_como(:C);
select ok((select count(*) from story_vistas) = 1, 'C só vê a própria visualização');
select tst_como(:B); select ok((select count(*) from story_vistas where story_id = '33333333-0000-0000-0000-000000000003') = 1, 'B vê quem viu seu Story');
-- expiração: o banco esconde Story vencido
reset role; update stories set expira = now() - interval '1 minute' where id = '33333333-0000-0000-0000-000000000003';
select tst_como(:C); select ok((select count(*) from stories where user_id = :B) = 0, 'Story vencido não aparece (filtro no banco)');
select tst_como(:B); select ok((select count(*) from stories where user_id = :B) = 0, 'Story vencido some até para a autora');
reset role; update stories set expira = now() + interval '1 hour' where id = '33333333-0000-0000-0000-000000000003';

-- ===== CHAT A <-> B (B aceita mensagens de todas) =====
select tst_como(:A); insert into conversas (id, a, b, nome_a, nome_b) values ('44444444-0000-0000-0000-000000000004', :A, :B, 'Ana', 'Bia');
insert into mensagens (id, conversa_id, texto) values ('55555555-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000004', 'oi Bia');
insert into mensagens (id, conversa_id, tipo, midia) values ('55555555-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000004', 'foto', 'chat/44444444-0000-0000-0000-000000000004/foto1.jpg');
select ok((select autor from mensagens where id = '55555555-0000-0000-0000-000000000005') = :A and (select entregue_em from mensagens where id = '55555555-0000-0000-0000-000000000005') is null, 'mensagem enviada (servidor), ainda não entregue');
select nega($$ insert into mensagens (conversa_id, texto) values ('44444444-0000-0000-0000-000000000004', '') $$, 'mensagem de texto vazia');
select nega($$ insert into mensagens (conversa_id, tipo, midia) values ('44444444-0000-0000-0000-000000000004', 'foto', 'chat/99999999-0000-0000-0000-000000000009/x.jpg') $$, 'foto apontando para outra conversa');
update mensagens set lida_em = now() where id = '55555555-0000-0000-0000-000000000005';
select ok((select lida_em from mensagens where id = '55555555-0000-0000-0000-000000000005') is null, 'autora NÃO consegue marcar a própria como lida');
select tst_como(:B);
select ok((select count(*) from mensagens where conversa_id = '44444444-0000-0000-0000-000000000004') = 2, 'B recebe as 2 mensagens');
select ok((select count(*) from notificacoes where user_id = :B and tipo = 'mensagem') = 1, 'uma notificação por conversa (sem duplicar)');
select ok((select n from nao_lidas() where conversa_id = '44444444-0000-0000-0000-000000000004') = 2, 'B tem 2 não lidas');
select ok(marcar_entregues() = 2, 'B marca entregues');
select ok((select count(*) from mensagens where entregue_em is not null and lida_em is null) = 2, 'entregue sem lida');
update mensagens set texto = 'editado por B' where id = '55555555-0000-0000-0000-000000000005';
select ok((select texto from mensagens where id = '55555555-0000-0000-0000-000000000005') = 'oi Bia', 'B não edita mensagem de A');
select ok(marcar_lidas('44444444-0000-0000-0000-000000000004') = 2, 'B abre a conversa: 2 lidas');
select ok((select count(*) from nao_lidas()) = 0, 'B sem não lidas');
select ok((select bool_and(lida) from notificacoes where user_id = :B and tipo = 'mensagem'), 'notificação de mensagem marcada como lida');
insert into mensagens (conversa_id, texto, resposta_id) values ('44444444-0000-0000-0000-000000000004', 'oi Ana!', '55555555-0000-0000-0000-000000000005');
select ocultar_mensagem('55555555-0000-0000-0000-000000000006');
select ok((select count(*) from mensagens where id = '55555555-0000-0000-0000-000000000006') = 0, 'B apaga a foto só para si');
select tst_como(:A);
select ok((select count(*) from mensagens where conversa_id = '44444444-0000-0000-0000-000000000004') = 3, 'para A a foto continua e a resposta chegou');
select ok((select lida_em from mensagens where id = '55555555-0000-0000-0000-000000000005') is not null, 'A vê que foi lida');

-- ===== C TENTA ENTRAR NA CONVERSA DE A E B =====
select tst_como(:C);
select ok((select count(*) from mensagens where conversa_id = '44444444-0000-0000-0000-000000000004') = 0, '[8] C não lê mensagens de A e B pela API');
select ok((select count(*) from conversas where id = '44444444-0000-0000-0000-000000000004') = 0, '[5] C não abre a conversa manipulando o ID');
select nega($$ insert into mensagens (conversa_id, texto) values ('44444444-0000-0000-0000-000000000004', 'intrusa') $$, 'C envia mensagem na conversa alheia');
select ok(marcar_lidas('44444444-0000-0000-0000-000000000004') = 0, 'C não marca leitura alheia');
select ok(not ocultar_mensagem('55555555-0000-0000-0000-000000000005'), 'C não mexe em mensagem alheia');
select nega($$ insert into denuncias (tipo, alvo_id, motivo) values ('mensagem', '55555555-0000-0000-0000-000000000005', 'spam') $$, 'C denuncia mensagem de conversa da qual não participa');

-- ===== STORAGE PRIVADO (URL temporária só sai se a regra deixar) =====
reset role;
insert into storage.objects (bucket_id, name, owner) values
 ('social', 'chat/44444444-0000-0000-0000-000000000004/foto1.jpg', :A),
 ('social', 'post/' || :B || '/foto1.jpg', :B),
 ('social', 'story/' || :B || '/s1.jpg', :B),
 ('social', 'perfil/' || :A || '/avatar1.jpg', :A);
select ok((select public from storage.buckets where id = 'social') = false, 'bucket social é privado');
select tst_como(:B); select ok((select count(*) from storage.objects where name like 'chat/44444444%') = 1, 'B (participante) acessa foto do chat');
select tst_como(:C);
select ok((select count(*) from storage.objects where name like 'chat/%') = 0, '[1][6] C NÃO acessa foto do chat de A e B');
select ok((select count(*) from storage.objects where name like 'story/%') = 1, 'C (seguidora) acessa Story de B');
select ok((select count(*) from storage.objects where name like 'perfil/%') = 1, 'C vê foto de perfil de A');
select nega($$ insert into storage.objects (bucket_id, name) values ('social', 'chat/44444444-0000-0000-0000-000000000004/hack1.jpg') $$, 'C envia arquivo para conversa alheia');
select nega($$ insert into storage.objects (bucket_id, name) values ('social', 'perfil/aaaaaaaa-0000-0000-0000-00000000000a/hack1.jpg') $$, 'C envia arquivo para pasta de A');
select nega($$ insert into storage.objects (bucket_id, name) values ('social', 'perfil/cccccccc-0000-0000-0000-00000000000c/evil.exe') $$, 'arquivo com extensão proibida');
select tst_como(:A);
select ok((select count(*) from storage.objects where name like 'story/%') = 0, '[7] A (não seguidora) NÃO acessa Story privado de B');
select ok((select count(*) from storage.objects where name like 'post/%') = 0, 'A NÃO acessa foto de post privado de B');
select tst_como(null);
select ok((select count(*) from storage.objects) = 0, '[3][4] sem login: nenhum arquivo acessível');
select ok((select count(*) from mensagens) = 0 and (select count(*) from perfis) = 0 and (select count(*) from stories) = 0, 'sem login: nada de mensagens, perfis ou Stories');
select tst_como(:C);
reset role; update stories set expira = now() - interval '1 minute';
select tst_como(:C); select ok((select count(*) from storage.objects where name like 'story/%') = 0, 'arquivo de Story vencido deixa de ser acessível');

-- ===== BLOQUEIO =====
select tst_como(:B); insert into bloqueios (bloqueado) values (:A);
select ok((select count(*) from seguidores where (seguidor = :A and seguido = :B) or (seguidor = :B and seguido = :A)) = 0, 'bloquear desfaz o seguir');
select tst_como(:A);
select nega($$ insert into mensagens (conversa_id, texto) values ('44444444-0000-0000-0000-000000000004', 'insistindo') $$, 'A bloqueada não manda mensagem para B');
select nega($$ insert into seguidores (seguido) values ('bbbbbbbb-0000-0000-0000-00000000000b') $$, 'A bloqueada não segue B');
select ok((select count(*) from perfis where user_id = :B) = 0, 'A bloqueada não vê o perfil de B');
select ok((select count(*) from bloqueios) = 0, 'A não vê a lista de bloqueios de B');
select ok(perfil_contagens(:B) is null, 'A bloqueada não vê contagens de B');

-- ===== DENÚNCIA E MODERAÇÃO =====
select tst_como(:B); insert into denuncias (id, tipo, alvo_id, motivo) values ('66666666-0000-0000-0000-000000000006', 'mensagem', '55555555-0000-0000-0000-000000000005', 'assedio');
select ok((select alvo_user from denuncias where id = '66666666-0000-0000-0000-000000000006') = :A, 'denúncia identifica a autora pelo banco');
select tst_como(:C); select ok((select count(*) from denuncias) = 0, 'C não vê denúncias de outras');
select ok(denuncia_conteudo('66666666-0000-0000-0000-000000000006') is null, 'C não lê conteúdo denunciado');
select nega($$ select moderar('66666666-0000-0000-0000-000000000006', 'ocultar') $$, 'C não modera');
select tst_como(:M);
select ok((select count(*) from mensagens) = 0, 'ADMIN não navega pelas conversas');
select ok(denuncia_conteudo('66666666-0000-0000-0000-000000000006')->>'texto' = 'oi Bia', 'admin vê SÓ a mensagem denunciada');
select ok(moderar('66666666-0000-0000-0000-000000000006', 'ocultar'), 'admin oculta a mensagem');
select ok((select status from denuncias where id = '66666666-0000-0000-0000-000000000006') = 'resolvida' and (select count(*) from moderacao_log) = 1, 'denúncia resolvida e registrada no histórico');
select ok((select count(*) from storage.objects where name like 'chat/%') = 0, 'admin não abre foto de chat sem denúncia daquela foto');
select tst_como(:B); select ok((select count(*) from nao_lidas()) = 0, 'mensagem ocultada não conta como não lida');

-- ===== NOTIFICAÇÕES =====
select tst_como(:C);
select nega($$ insert into notificacoes (user_id, tipo, texto) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'sistema', 'falsa') $$, 'C cria notificação para A');
insert into notificacoes (user_id, tipo, ref, texto) values (:C, 'conquista', 'treinos-1', 'Primeiro treino!');
select nega($$ insert into notificacoes (user_id, tipo, ref, texto) values ('cccccccc-0000-0000-0000-00000000000c', 'conquista', 'treinos-1', 'de novo') $$, 'conquista não duplica');
update notificacoes set texto = 'alterada', lida = true where user_id = :C;
select ok((select count(*) from notificacoes where user_id = :C and texto = 'alterada') = 0 and (select bool_and(lida) from notificacoes where user_id = :C), 'só marca como lida, não altera o texto');
reset role;
