-- Testes do módulo Segurança & Privacidade (roda depois do testes.sql, no mesmo banco local)
\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set MOD '''eeeeeeee-0000-0000-0000-00000000000e'''
\set SUP '''ffffffff-0000-0000-0000-00000000000f'''
\set PRIV '''99999999-0000-0000-0000-000000000009'''
\set E '''77777777-0000-0000-0000-000000000007'''
reset role;
insert into auth.users values (:MOD, 'mod@t'), (:SUP, 'sup@t'), (:PRIV, 'priv@t'), (:E, 'e@t');
insert into alunas (id, email, nome) values (:MOD, 'mod@t', 'Moderadora'), (:SUP, 'sup@t', 'Suporte'), (:PRIV, 'priv@t', 'Privacidade'), (:E, 'e@t', 'Eva E');
insert into admins (user_id, email, nome, perms) values
  (:MOD, 'mod@t', 'Moderadora', '{"papel":"moderador","moderacao":"editar","comunidade":"editar"}'),
  (:SUP, 'sup@t', 'Suporte', '{"papel":"suporte","alunos":"ver"}'),
  (:PRIV, 'priv@t', 'Privacidade', '{"papel":"privacidade","lgpd":"editar","seguranca":"ver","auditoria":"ver"}');
-- dados de apoio
reset role; insert into ciclo (user_id, dados) values (:A, '{"checkins":{}}') on conflict do nothing;

-- ===== AUDITORIA IMUTÁVEL =====
select tst_como(:M); select auditar('login_admin', 'painel');
select ok((select count(*) from auditoria where acao = 'login_admin') >= 1, 'login do admin registrado');
update auditoria set acao = 'apagado'; delete from auditoria;
reset role; select ok((select count(*) from auditoria where acao = 'apagado') = 0 and (select count(*) from auditoria) >= 1, 'ADMIN não altera nem apaga a auditoria');
select nega($$ update auditoria set acao = 'x' $$, 'nem com acesso direto ao banco a auditoria muda (trava no banco)'); select tst_como(:M);
select tst_como(:A); select ok((select count(*) from auditoria) = 0, 'aluna não lê auditoria');
select auditar('teste_aluna'); reset role; select ok((select ator from auditoria where acao = 'teste_aluna') = :A, 'registro guarda quem fez (não aceita ator falso)');

-- ===== PAPÉIS (menor privilégio) =====
select tst_como(:A);
select nega($$ insert into admins (user_id, email, nome) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'a@t', 'eu') $$, 'aluna não vira admin pelo app');
update admins set perms = '{"total":true}' where user_id = :MOD;
reset role; select ok((select perms->>'total' from admins where user_id = :MOD) is null, 'aluna não altera permissão de ninguém');
select tst_como(:MOD);
select ok((select count(*) from ciclo) = 0, 'MODERADORA não vê ciclo');
select ok((select count(*) from mensagens) = 0, 'MODERADORA não navega mensagens');
select ok((select count(*) from solicitacoes) = 0, 'MODERADORA não vê LGPD');
select ok((select count(*) from incidentes) = 0, 'MODERADORA não vê incidentes');
select nega($$ insert into incidentes (titulo) values ('x') $$, 'MODERADORA não registra incidente');
select ok(seguranca_resumo() is null, 'MODERADORA não vê painel de segurança');
select ok(denuncia_conteudo('66666666-0000-0000-0000-000000000006') is not null, 'MODERADORA vê só o conteúdo denunciado');
select tst_como(:SUP);
select ok((select count(*) from ciclo) = 0, 'SUPORTE não vê ciclo');
select ok(denuncia_conteudo('66666666-0000-0000-0000-000000000006') is null, 'SUPORTE não abre conteúdo denunciado');
update alunas set situacao = 'suspensa' where id = :B;
reset role; select ok((select situacao from alunas where id = :B) = 'ativa', 'SUPORTE (só ver) não suspende conta');
select ok((select count(*) from auditoria where resultado = 'negado' and ator = :SUP) >= 1, 'tentativa negada fica registrada');
select tst_como(:PRIV);
select ok((select count(*) from ciclo) = 0, 'PRIVACIDADE também não vê ciclo individual');
select ok(seguranca_resumo() is not null, 'PRIVACIDADE vê painel de segurança');

-- ===== SOLICITAÇÕES LGPD =====
select tst_como(:A);
insert into solicitacoes (tipo, detalhe, status) values ('acesso', 'Quero meus dados', 'concluida');
select ok((select status from solicitacoes where user_id = :A) = 'recebida' and (select protocolo from solicitacoes where user_id = :A) like 'CK-%', 'pedido nasce "recebida" com protocolo (aluna não força status)');
select ok((select prazo from solicitacoes where user_id = :A) = current_date + 15, 'prazo interno calculado');
update solicitacoes set status = 'concluida' where user_id = :A;
select ok((select status from solicitacoes where user_id = :A) = 'recebida', 'aluna não muda o status do próprio pedido');
select tst_como(:B); select ok((select count(*) from solicitacoes) = 0, 'B não vê pedidos de A');
select tst_como(:PRIV);
update solicitacoes set status = 'em_analise', responsavel = :PRIV where user_id = :A;
select nota_solicitacao((select id from solicitacoes where user_id = :A), 'Identidade confirmada por e-mail');
select ok((select count(*) from solicitacao_eventos e join solicitacoes s on s.id = e.solicitacao_id where s.user_id = :A) = 3, 'histórico do pedido registrado');
select tst_como(:A); select ok((select count(*) from solicitacao_eventos) = 3, 'a titular acompanha o histórico do próprio pedido');

-- ===== EXPORTAÇÃO SÓ DA PRÓPRIA TITULAR =====
select tst_como(:A);
select ok((exportar_meus_dados()->'conta'->>'email') = 'a@t', 'pacote traz os dados da A');
select ok(position('oi Ana!' in exportar_meus_dados()::text) = 0, 'pacote NÃO traz mensagens escritas por B');
select ok(position('oi Bia' in exportar_meus_dados()::text) > 0, 'pacote traz mensagens enviadas pela A');
select tst_como(null); select ok(exportar_meus_dados() is null, 'sem login não exporta nada');

-- ===== CONSENTIMENTOS (histórico, sem sobrescrever) =====
select tst_como(:A);
insert into consentimentos (tipo, aceito, versao) values ('ciclo', true, '1');
insert into consentimentos (tipo, aceito, versao) values ('ciclo', false, '1');
select ok((select aceito from consentimentos_atuais where user_id = :A and tipo = 'ciclo') = false and (select count(*) from consentimentos where user_id = :A and tipo = 'ciclo') = 2, 'revogação vira novo registro (histórico preservado)');
update consentimentos set aceito = true where user_id = :A;
delete from consentimentos where user_id = :A;
reset role; select ok((select count(*) from consentimentos where user_id = :A) = 2, 'aluna não edita nem apaga consentimento antigo');
select tst_como(:A);
select nega($$ insert into consentimentos (user_id, tipo, aceito) values ('bbbbbbbb-0000-0000-0000-00000000000b', 'marketing', true) $$, 'consentimento em nome de outra');
select nega($$ insert into consentimentos (tipo, aceito, origem) values ('marketing', true, 'painel') $$, 'aluna não finge consentimento dado pelo painel');

-- ===== DOCUMENTOS VERSIONADOS =====
select tst_como(:M);
insert into documentos (tipo, nome, versao, conteudo, status) values ('termos', 'Termos de Uso', '1.0', 'texto v1', 'rascunho');
update documentos set status = 'publicado' where tipo = 'termos' and versao = '1.0';
select nega($$ update documentos set conteudo = 'mudado' where tipo = 'termos' and versao = '1.0' $$, 'publicado não pode ser editado');
insert into documentos (tipo, nome, versao, conteudo, status, novo_aceite) values ('termos', 'Termos de Uso', '1.1', 'texto v1.1', 'publicado', true);
select ok((select status from documentos where versao = '1.0') = 'arquivado' and (select status from documentos where versao = '1.1') = 'publicado', 'nova versão publicada arquiva a anterior');
select tst_como(null); select ok((select count(*) from documentos) = 1, 'sem login lê só a versão publicada');
select tst_como(:A); select nega($$ insert into documentos (tipo, nome, versao) values ('privacidade', 'x', '9') $$, 'aluna não cria documento');

-- ===== INCIDENTES =====
select tst_como(:M);
insert into incidentes (titulo, risco, sensiveis, descoberto_em) values ('Teste de incidente', 'alto', true, '2026-10-23 10:00');
select ok((select avaliar_comunicacao from incidentes) and (select prazo_comunicacao from incidentes) = '2026-10-28', 'risco alto: marca avaliar comunicação e prazo em dias úteis');
delete from incidentes;
select ok((select count(*) from incidentes) = 1, 'incidente não pode ser apagado (só arquivado)');
update incidentes set status = 'contido';
select ok((select count(*) from incidente_eventos) = 2, 'histórico do incidente');

-- ===== MFA OBRIGATÓRIO PARA O PAINEL =====
select tst_como(:M); update seguranca_config set valor = 'true' where chave = 'mfa_admin_obrigatorio';
select nega($$ select moderar('66666666-0000-0000-0000-000000000006', 'resolver') $$, 'com MFA obrigatório, sessão sem 2 etapas não modera');
select nega($$ insert into incidentes (titulo) values ('sem mfa') $$, 'com MFA obrigatório, sessão sem 2 etapas não cria incidente');
select set_config('request.jwt.claims', '{"aal":"aal2"}', false);
select ok(moderar('66666666-0000-0000-0000-000000000006', 'resolver'), 'com 2 etapas a ação passa');
update seguranca_config set valor = 'false' where chave = 'mfa_admin_obrigatorio';
select ok((select count(*) from auditoria where acao = 'config_alterada') = 2, 'mudança de configuração registrada');

-- ===== LIMITE CONTRA ABUSO =====
select tst_como(:B);
do $$ begin for i in 1..(10 - (select count(*) from posts where user_id = auth.uid() and criado > now() - interval '10 minutes'))::int loop insert into posts (user_id, nome, texto) values (auth.uid(), 'Bia', 'spam ' || i); end loop; end $$;
select nega($$ insert into posts (user_id, nome, texto) values (auth.uid(), 'Bia', 'spam 11') $$, '11º post em 10 minutos é bloqueado');

-- ===== IDADE MÍNIMA =====
reset role; insert into auth.users values ('12121212-0000-0000-0000-000000000012', 'menor@t');
select tst_como('12121212-0000-0000-0000-000000000012');
select nega($$ insert into alunas (id, email, nome, nasc) values ('12121212-0000-0000-0000-000000000012', 'menor@t', 'Menor', '2015-01-01') $$, 'cadastro abaixo da idade mínima é recusado pelo banco');

-- ===== ÚLTIMO ADMIN TOTAL =====
select tst_como(:M);
select nega($$ delete from admins where user_id = 'dddddddd-0000-0000-0000-00000000000d' $$, 'não dá para remover o último acesso total');

-- ===== ELIMINAÇÃO CONTROLADA =====
select tst_como(:E);
insert into posts (id, user_id, nome, texto) values ('88888888-0000-0000-0000-000000000008', :E, 'Eva', 'post da Eva');
insert into comentarios (post_id, user_id, nome, texto) values ('11111111-0000-0000-0000-000000000001', :E, 'Eva', 'comentário da Eva no post da A');
insert into solicitacoes (tipo, detalhe) values ('eliminacao', 'Quero apagar minha conta');
select tst_como(:MOD); select nega($$ select executar_eliminacao((select id from solicitacoes where tipo = 'eliminacao'), 'teste') $$, 'MODERADORA não executa eliminação');
select tst_como(:PRIV);
select nega($$ select executar_eliminacao((select id from solicitacoes where tipo = 'eliminacao'), '') $$, 'eliminação exige motivo');
select ok((executar_eliminacao((select id from solicitacoes where tipo = 'eliminacao'), 'Pedido da titular')->>'posts')::int = 1, 'eliminação executada');
reset role;
select ok((select count(*) from posts where user_id = :E) = 0, 'posts da titular apagados');
select ok((select texto from comentarios where user_id = :E) = '[comentário removido]', 'comentário no post de outra anonimizado (conversa dela não quebra)');
select ok((select situacao from alunas where id = :E) = 'excluida' and (select nome from alunas where id = :E) = 'Usuária removida', 'conta marcada como excluída e anonimizada');
select ok((select status from solicitacoes where tipo = 'eliminacao') = 'concluida' and (select count(*) from auditoria where acao = 'eliminacao_executada') = 1, 'pedido concluído e registrado');
