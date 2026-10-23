-- Testes da monetização (relógio do servidor; nada liberado pelo app)
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set N '''a1a1a1a1-0000-0000-0000-0000000000a1'''
\set F '''a2a2a2a2-0000-0000-0000-0000000000a2'''
\set K '''a3a3a3a3-0000-0000-0000-0000000000a3'''
reset role;
insert into auth.users values (:N, 'nova@t'), (:F, 'free@t'), (:K, 'kiwi@t');
-- ===== TRIAL =====
insert into alunas (id, email, nome) values (:N, 'nova@t', 'Nova');
select ok((select count(*) from assinaturas where user_id = :N and provider = 'trial' and status = 'trialing') = 1, 'nova usuária ganha 7 dias de Pro (servidor)');
select tst_como(:N);
select ok((meu_plano() ->> 'pro')::boolean and (meu_plano() ->> 'trial')::boolean, 'durante o teste: Pro liberado');
select ok((meu_plano() ->> 'dias_restantes')::int = 7, 'contador mostra 7 dias restantes');
select ok(not (meu_plano() ->> 'anuncios')::boolean, 'no teste não há anúncios');
select ok(oferta_ativar('abrir_app') is null, 'dia 1: ainda sem oferta');
select nega($$ insert into assinaturas (user_id, provider, status, fim) values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'manual', 'active', now() + interval '1 year') $$, 'aluna não se dá Pro');
update assinaturas set fim = now() + interval '10 years';
reset role; select ok((select fim < now() + interval '8 days' from assinaturas where user_id = :N and provider = 'trial'), 'aluna não estende o próprio teste');
-- dia 5
update assinaturas set inicio = now() - interval '4 days', fim = now() + interval '3 days' where user_id = :N and provider = 'trial';
select tst_como(:N);
select ok(oferta_ativar(null) ->> 'campanha' = 'trial-dia5', 'dia 5: oferta especial liberada');
select ok((meu_plano() -> 'oferta' ->> 'preco_mensal_promo')::numeric = 11.99 and (meu_plano() -> 'oferta' ->> 'preco_anual_promo')::numeric = 119.88, 'oferta com preços definidos (11,99 / 119,88)');
select ok(abs(extract(epoch from ((meu_plano() -> 'oferta' ->> 'expira')::timestamptz - now())) - 48 * 3600) < 60, 'oferta dura 48 horas reais');
select set_config('tst.exp', meu_plano() -> 'oferta' ->> 'expira', false);
select ok(oferta_ativar(null) ->> 'expira' = current_setting('tst.exp'), 'reabrir o app não reinicia o contador');
-- oferta acabou: não volta no teste
reset role; update ofertas_usuario set expira = now() - interval '1 minute' where user_id = :N;
select tst_como(:N); select ok(oferta_ativar(null) is null, 'oferta do teste não se repete');
-- dia 8
reset role; update assinaturas set fim = now() - interval '1 hour' where user_id = :N and provider = 'trial'; select set_config('request.jwt.claim.role','service_role',false); update alunas set premium = null where id = :N;
select tst_como(:N);
select ok(not (meu_plano() ->> 'pro')::boolean, 'dia 8: vira Free automaticamente');
select ok(not (meu_plano() ->> 'anuncios')::boolean, 'Free com menos de 31 dias: sem anúncios');
select ok(not (meu_plano() -> 'recursos' ->> 'stickers_todos')::boolean, 'Free não tem todas as figurinhas');
select ok((meu_plano() -> 'limites' ->> 'stickers_todos')::int = 25, 'Free: limite de 25 figurinhas');
reset role; select set_config('request.jwt.claim.role','service_role',false); update alunas set criado = current_date - 40 where id = :N;
select tst_como(:N); select ok((meu_plano() ->> 'anuncios')::boolean, 'Free a partir do dia 31: pode receber anúncios');
-- ===== OFERTAS PARA FREE =====
select ok(oferta_ativar(null) is null and oferta_ativar('navegando') is null, 'Free: oferta nunca aparece fora de momento natural');
select ok(oferta_ativar('treino_concluido') is null, 'logo após a oferta do teste, espera o intervalo');
reset role; update ofertas_usuario set expira = now() - interval '16 days' where user_id = :N;
select tst_como(:N); select ok(oferta_ativar('treino_concluido') is not null, 'Free: oferta ao concluir treino (passado o intervalo)');
reset role; update ofertas_usuario set expira = now() - interval '2 days' where user_id = :N;
select tst_como(:N); select ok(oferta_ativar('recurso_pro') is null, 'respeita intervalo de 15 dias');
reset role; select set_config('tst.camp', (select campanha_id from ofertas_usuario where user_id = :N order by expira desc limit 1), false);
update ofertas_usuario set expira = now() - interval '16 days' where user_id = :N;
select tst_como(:N); select ok(oferta_ativar('recurso_pro') ->> 'campanha' <> current_setting('tst.camp'), 'depois de 15 dias: nova oferta, com outra campanha');
-- ===== RECURSOS PRO NO SERVIDOR =====
select nega($$ insert into posts (user_id, nome, figurinha) values ('a1a1a1a1-0000-0000-0000-0000000000a1', 'Nova', 'keep-going') $$, 'Free não posta figurinha Pro (servidor)');
insert into posts (user_id, nome, figurinha) values (:N, 'Nova', 'hoje-teve');
select ok(exists (select 1 from posts where figurinha = 'hoje-teve' and user_id = :N), 'Free posta figurinha grátis');
select ok(not social_pode_gravar('figurinha/a1a1a1a1-0000-0000-0000-0000000000a1/abcdef12.png'), 'Free não cria figurinha própria');
select nega($$ insert into verificacoes (user_id) values ('a1a1a1a1-0000-0000-0000-0000000000a1') $$, 'Free não pede verificação');
update recursos set free = true where id = 'stickers_todos';
reset role; select ok(not (select free from recursos where id = 'stickers_todos'), 'aluna não muda regras Free/Pro');
-- ===== KIWIFY =====
select tst_como(:N);
select nega($$ select kiwify_processa('{"webhook_event_type":"order_approved","order_id":"x1"}') $$, 'app não chama o processamento da Kiwify');
reset role; set role service_role; select set_config('request.jwt.claim.role', 'service_role', false);
select ok((kiwify_processa('{"webhook_event_type":"order_approved","order_id":"o1","order_status":"paid","subscription_id":"s1","Customer":{"email":"Free@t"},"Subscription":{"id":"s1","status":"active","plan":{"frequency":"annually"},"customer_access":{"has_access":true,"access_until":"2030-01-01T03:00:00.000Z"},"charges":{"completed":[{"amount":15588}]}}}') ->> 'ok')::boolean, 'compra aprovada processada');
select ok((kiwify_processa('{"webhook_event_type":"order_approved","order_id":"o1","order_status":"paid","subscription_id":"s1","Customer":{"email":"free@t"}}') ->> 'duplicado')::boolean, 'evento repetido não duplica (idempotente)');
reset role;
select ok((select count(*) from assinaturas where provider = 'kiwify' and external_id = 's1' and user_id is null and plano = 'pro_anual') = 1, 'compra antes do cadastro fica guardada (plano anual)');
insert into alunas (id, email, nome) values (:F, 'free@t', 'Fran');
select ok((select user_id from assinaturas where external_id = 's1') = :F, 'ao se cadastrar, a compra é ligada à conta');
select tst_como(:F); select ok((meu_plano() ->> 'pro')::boolean and not (meu_plano() ->> 'trial')::boolean and meu_plano() ->> 'plano' = 'pro_anual', 'assinante anual = Pro');
select ok(not (meu_plano() ->> 'anuncios')::boolean, 'Pro: zero anúncios'); select ok(oferta_ativar('treino_concluido') is null, 'Pro não recebe oferta');
insert into perfis (username, nome) values ('fran', 'Fran');
reset role; select ok((select pro_ate from perfis where user_id = :F) is not null, '👑 aparece para assinante');
select ok((select valor from webhook_eventos where order_id = 'o1') = 155.88, 'receita bruta registrada');
set role service_role;
select kiwify_processa('{"webhook_event_type":"subscription_canceled","order_id":"o1c","subscription_id":"s1","Subscription":{"id":"s1","status":"canceled","customer_access":{"has_access":true,"access_until":"2030-01-01T03:00:00.000Z"}}}');
reset role; select tst_como(:F); select ok((meu_plano() ->> 'pro')::boolean and meu_plano() ->> 'status' = 'canceled', 'cancelou: mantém Pro até o fim do período pago');
reset role; set role service_role;
select kiwify_processa('{"webhook_event_type":"subscription_canceled","order_id":"o1d","subscription_id":"s1","Subscription":{"id":"s1","status":"ended","customer_access":{"has_access":false,"access_until":"2020-01-01T03:00:00.000Z"}}}');
reset role; select set_config('request.jwt.claim.role','service_role',false); update alunas set premium = null where id = :F; update assinaturas set fim = now() - interval '1 second' where user_id = :F and provider = 'trial';
select tst_como(:F); select ok(not (meu_plano() ->> 'pro')::boolean, 'fim do período: volta a Free');
reset role; select ok((select pro_ate from perfis where user_id = :F) is null, '👑 some quando o Pro acaba');
select ok(exists (select 1 from posts where user_id = :N), 'nenhum dado apagado ao virar Free');
-- reembolso e chargeback
insert into alunas (id, email, nome) values (:K, 'kiwi@t', 'Ki'); select set_config('request.jwt.claim.role','service_role',false); update alunas set premium = null where id = :K; update assinaturas set fim = now() - interval '1 second' where user_id = :K;
set role service_role;
select kiwify_processa('{"webhook_event_type":"order_approved","order_id":"o2","subscription_id":"s2","Customer":{"email":"kiwi@t"},"Subscription":{"id":"s2","plan":{"frequency":"monthly"},"customer_access":{"has_access":true,"access_until":"2030-02-01T03:00:00.000Z"}}}');
select kiwify_processa('{"webhook_event_type":"order_refunded","order_id":"o2","subscription_id":"s2","Customer":{"email":"kiwi@t"}}');
reset role; select tst_como(:K); select ok(not (meu_plano() ->> 'pro')::boolean, 'reembolso: Pro cancelado na hora');
reset role; select ok((select status from assinaturas where external_id = 's2') = 'refunded', 'status reembolsado registrado');
set role service_role;
select kiwify_processa('{"webhook_event_type":"subscription_renewed","order_id":"o3","subscription_id":"s3","Customer":{"email":"kiwi@t"},"Subscription":{"id":"s3","plan":{"frequency":"monthly"},"customer_access":{"has_access":true,"access_until":"2031-01-01T03:00:00.000Z"}}}');
select kiwify_processa('{"webhook_event_type":"chargeback","order_id":"o3","subscription_id":"s3"}');
reset role; select ok((select status from assinaturas where external_id = 's3') = 'chargeback', 'chargeback registrado');
select ok(exists (select 1 from webhook_eventos where evento = 'billet_created') = false, 'nada de evento fantasma');
-- ===== ADMIN =====
select tst_como(:N); select nega($$ select admin_conceder_pro('a1a1a1a1-0000-0000-0000-0000000000a1', 30, 'eu quero') $$, 'aluna não se concede Pro');
select tst_como(:M); select nega($$ select admin_conceder_pro('a1a1a1a1-0000-0000-0000-0000000000a1', 30, '') $$, 'conceder exige motivo');
select admin_conceder_pro(:N, 30, 'cortesia de teste');
select tst_como(:N); select ok((meu_plano() ->> 'provider') = 'manual' and (meu_plano() ->> 'pro')::boolean, 'admin concede 30 dias de Pro');
reset role; select ok(exists (select 1 from auditoria where acao = 'pro_concedido'), 'concessão registrada na auditoria');
select tst_como(:M); select ok((admin_monetizacao_resumo() ->> 'pro')::int >= 1, 'painel mostra resumo de assinaturas');
select tst_como(:N); select ok(admin_monetizacao_resumo() is null, 'aluna não vê o resumo financeiro');
-- ===== VERIFICAÇÃO =====
select tst_como(:N); insert into verificacoes (user_id) values (:N);
select ok((select status from verificacoes where user_id = :N) = 'pending', 'Pro pede verificação');
select nega($$ insert into verificacoes (user_id) values ('a1a1a1a1-0000-0000-0000-0000000000a1') $$, 'não pede duas vezes');
update perfis set verificada = true where user_id = :N;
insert into perfis (username, nome) values ('novaa', 'Nova') on conflict do nothing; update perfis set verificada = true;
reset role; select ok(not coalesce((select verificada from perfis where user_id = :N), false), 'aluna não se dá o selo azul');
select tst_como(:N); select nega($$ select verificacao_decidir((select id from verificacoes limit 1), 'verified', null) $$, 'aluna não aprova a si mesma');
select tst_como(:M); select verificacao_decidir((select id from verificacoes where user_id = :N), 'verified', null);
reset role; select ok((select verificada from perfis where user_id = :N), 'aprovada: selo azul ✓');
update assinaturas set fim = now() - interval '1 second' where user_id = :N;
select ok((select verificada from perfis where user_id = :N), 'Pro acabou, selo azul continua (é verificação, não pagamento)');
select tst_como(:M); select nega($$ select verificacao_decidir((select id from verificacoes limit 1), 'revoked', '') $$, 'revogar exige motivo');
select verificacao_decidir((select id from verificacoes where user_id = :N), 'revoked', 'perfil falso detectado');
reset role; select ok(not (select verificada from perfis where user_id = :N), 'revogada: selo removido');
-- ===== ANALYTICS =====
select tst_como(:N); select registra_evento('paywall_viewed', '{"tela":"perfil"}'); select registra_evento('subscription_started', null);
reset role; select ok((select count(*) from eventos_app where user_id = :N and nome = 'paywall_viewed') = 1 and (select count(*) from eventos_app where user_id = :N and nome = 'subscription_started') = 0, 'app registra eventos, mas não finge assinatura');
select tst_como(:N); select ok((select count(*) from eventos_app) = 0, 'aluna não lê analytics');
