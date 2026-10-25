-- Coach CK Life no servidor
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set U1 '''c0000000-0000-0000-0000-000000000001'''
\set U2 '''c0000000-0000-0000-0000-000000000002'''
\set U3 '''c0000000-0000-0000-0000-000000000003'''
\set U4 '''c0000000-0000-0000-0000-000000000004'''
\set U5 '''c0000000-0000-0000-0000-000000000005'''
\set U6 '''c0000000-0000-0000-0000-000000000006'''
\set U7 '''c0000000-0000-0000-0000-000000000007'''
reset role;
update coach_config set ligado = true, max_dia = 2, intervalo_h = 3, silencio_ini = 21, silencio_fim = 8 where id = 1;
insert into auth.users values (:U1, 'u1@t'), (:U2, 'u2@t'), (:U3, 'u3@t'), (:U4, 'u4@t'), (:U5, 'u5@t'), (:U6, 'u6@t'), (:U7, 'u7@t') on conflict do nothing;
-- "agora" simulado: quarta 04/11/2026, 18h em Cuiabá
insert into alunas (id, email, nome, criado, ultimo, dados) values
 (:U1, 'u1@t', 'Lia Treino', '2026-10-01', '2026-11-04', '{"treinos":[{"d":"2026-11-02","h":10},{"d":"2026-11-03","h":10},{"d":"2026-11-04","h":10}],"perfil":{"tempo":20}}'),
 (:U2, 'u2@t', 'Mara Sumida', '2026-10-01', '2026-11-03', '{"treinos":[{"d":"2026-10-30","h":19},{"d":"2026-11-01","h":19}]}'),
 (:U3, 'u3@t', 'Nina Nova', '2026-11-04', '2026-11-04', '{}'),
 (:U4, 'u4@t', 'Olga Off', '2026-10-01', '2026-11-03', '{"treinos":[{"d":"2026-11-01","h":19}]}'),
 (:U5, 'u5@t', 'Pia Volta', '2026-09-01', '2026-11-04', '{"treinos":[{"d":"2026-10-20","h":9},{"d":"2026-11-04","h":9}]}'),
 (:U6, 'u6@t', 'Quel Silencio', '2026-10-01', '2026-11-03', '{"treinos":[{"d":"2026-11-01","h":19}]}'),
 (:U7, 'u7@t', 'Rita Limite', '2026-10-01', '2026-11-03', '{"treinos":[{"d":"2026-11-01","h":19}]}')
on conflict (id) do nothing;
insert into coach_prefs (user_id, coach) values (:U4, false);
insert into coach_prefs (user_id, silencio_ini, silencio_fim) values (:U6, 17, 8);
insert into coach_prefs (user_id, max_dia) values (:U7, 1);
insert into coach_envios (user_id, categoria, regra, titulo, texto, criado) values (:U7, 'bom_dia', 'bom_dia', 'Bom dia', 'oi', '2026-11-04 12:00:00+00');
insert into push_inscricoes (user_id, endpoint, p256dh, auth) values (:U1, 'https://push.teste/u1', 'k', 'a') on conflict do nothing;

select ok((select count(*) from coach_mensagens) >= 365, '365+ mensagens da Coach');
select ok((select count(distinct categoria) from coach_mensagens) >= 30, '30 categorias');
select ok((select count(*) from coach_mensagens where not _coach_texto_ok(titulo) or not _coach_texto_ok(texto)) = 0, 'nenhuma mensagem com palavra proibida');
select ok(_coach_render('Oi, {primeiro_nome}', '{}') = 'Oi', 'sem nome: "Oi" fica natural');
select ok(_coach_render('{primeiro_nome}, bora?', '{}') = 'Bora?', 'sem nome no começo: "Bora?"');
select ok(_coach_render('{streak} dias, {primeiro_nome} {xyz}', '{"primeiro_nome":"Lia","streak":3}') = '3 dias, Lia', 'variáveis trocadas e desconhecidas removidas');

select ok((_coach_tick('2026-11-04 22:00:00+00') ->> 'enviados')::int >= 3, 'motor rodou e mandou recados');
select ok((select categoria from coach_envios where user_id = :U1 order by id desc limit 1) = 'streak', 'treinou 3 dias seguidos: recado de sequência');
select ok((select texto || titulo from coach_envios where user_id = :U1 order by id desc limit 1) !~ '\{', 'recado sem variável sobrando');
select ok((select canal from coach_envios where user_id = :U1 order by id desc limit 1) = 'push', 'quem ativou avisos recebe no celular');
select ok((select count(*) from push_fila where coach_envio is not null and user_id = :U1) = 1, 'aviso entrou na fila de envio');
select ok((select regra from coach_envios where user_id = :U2 order by id desc limit 1) = 'ausencia_3d', '3 dias sem treinar: recado gentil de 3 dias');
select ok((select canal from coach_envios where user_id = :U2 order by id desc limit 1) = 'inbox', 'sem avisos ativados: fica nos recados do app');
select ok((select regra from coach_envios where user_id = :U5 order by id desc limit 1) = 'voltou', 'voltou depois de 15 dias: "Olha quem voltou"');
select ok((select count(*) from coach_envios where user_id = :U3) = 0, 'conta nova às 18h: nada (espera o horário certo)');
select ok((select count(*) from coach_envios where user_id = :U4) = 0, 'desligou a Coach: nunca recebe');
select ok((select count(*) from coach_envios where user_id = :U6) = 0, 'horário de silêncio dela respeitado');
select ok((select count(*) from coach_envios where user_id = :U7) = 1, 'limite diário dela respeitado');
select _coach_tick('2026-11-04 22:10:00+00');
select ok((select count(*) from coach_envios where user_id in (:U1, :U2, :U5)) = 3, 'rodar de novo 10 min depois não repete (anti-spam)');
select _coach_tick('2026-11-05 14:30:00+00');
select ok((select regra from coach_envios where user_id = :U3 order by id desc limit 1) = 'primeira_semana', 'conta nova no dia seguinte às 10h: dica da primeira semana');
select ok((select count(*) from coach_envios where user_id = :U2 and regra = 'ausencia_3d') = 1, 'recado de 3 dias não se repete na mesma pausa');
-- preferências por categoria: desligou conquistas, não recebe comemoração
insert into coach_prefs (user_id, conquistas) values (:U5, false) on conflict (user_id) do update set conquistas = false;
update alunas set dados = '{"treinos":[{"d":"2026-11-06","h":9}]}' where id = :U5;
select _coach_tick('2026-11-06 22:00:00+00');
select ok((select count(*) from coach_envios where user_id = :U5 and regra = 'pos_treino') = 0, 'desligou Conquistas: sem comemoração');
-- chave geral
update coach_config set ligado = false where id = 1;
select ok((_coach_tick('2026-11-07 22:00:00+00') ->> 'ligado')::boolean = false, 'chave geral desligada: motor parado');
update coach_config set ligado = true where id = 1;

-- a aluna só vê os próprios recados
select tst_como(:U1);
select ok(jsonb_array_length(coach_inbox()) = (select count(*) from coach_envios where user_id = :U1), 'recados: só os dela');
select ok((select count(*) from coach_envios) = (select count(*) from coach_envios where user_id = auth.uid()), 'não lê recados de outras');
select ok(coach_abriu((select id from coach_envios where user_id = :U1 limit 1)), 'marca o próprio recado como aberto');
reset role;
select tst_como(:U1);
select ok(not coach_abriu((select max(id) from coach_envios)), 'não marca recado de outra');
select ok(admin_coach_resumo() is null, 'aluna não vê o painel da Coach');
select ok(admin_coach_mensagens() is null, 'aluna não vê as mensagens do painel');
select nega($$ select admin_coach_msg_salvar(null, 'motivacao', 'Oi', 'Texto teste', null, 5, 'todos', true) $$, 'aluna não cria mensagem');
select nega($$ select admin_coach_config(false, 0, 3, 21, 8) $$, 'aluna não desliga a Coach');
select nega($$ select _coach_tick(now(), 10) $$, 'aluna não roda o motor');
select nega($$ select coach_tick() $$, 'aluna não roda o motor (atalho)');
select ok((select count(*) from coach_mensagens) = 0, 'aluna não lê a tabela de mensagens');
select nega($$ insert into coach_prefs (user_id) values ('c0000000-0000-0000-0000-000000000002') $$, 'não cria preferência de outra');
insert into coach_prefs (user_id, comunidade, fuso) values (auth.uid(), false, 'Zona/Invalida');
select ok((select fuso from coach_prefs where user_id = auth.uid()) = 'America/Cuiaba', 'fuso inválido vira o padrão');
reset role;

-- admin
select tst_como(:M);
select ok((admin_coach_resumo() ->> 'envios') is not null, 'admin vê o resumo');
select ok(jsonb_array_length(admin_coach_mensagens()) >= 365, 'admin vê as mensagens com estatísticas');
select nega($$ select admin_coach_msg_salvar(null, 'motivacao', 'Oi', 'Você está gorda', null, 5, 'todos', true) $$, 'palavra proibida bloqueada');
select ok(admin_coach_msg_salvar(null, 'motivacao', 'Teste', 'Mensagem nova de teste do painel', 'leve', 6, 'pro', true) > 0, 'admin cria mensagem');
select ok(admin_coach_regra('ausencia_24h', true, null), 'admin liga uma automação');
select ok(admin_coach_config(null, 3, 4, 22, 7), 'admin ajusta limites');
select ok(admin_coach_testar((select min(id) from coach_mensagens)) > 0, 'admin manda recado de teste para si');
reset role;
select ok((select max_dia from coach_config) = 3 and (select ativo from coach_regras where id = 'ausencia_24h'), 'ajustes salvos');
update coach_config set max_dia = 2, intervalo_h = 3, silencio_ini = 21, silencio_fim = 8 where id = 1;
update coach_regras set ativo = false where id = 'ausencia_24h';
