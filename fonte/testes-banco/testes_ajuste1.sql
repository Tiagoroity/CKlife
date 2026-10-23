-- Ajuste 1: quem pagou não vê oferta; valor do Pix (Commissions) registrado; vendas no painel
\set M '''dddddddd-0000-0000-0000-00000000000d'''
\set P '''a5a5a5a5-0000-0000-0000-0000000000a5'''
reset role;
insert into auth.users values (:P, 'pix@t');
insert into alunas (id, email, nome) values (:P, 'pix@t', 'Pix');
-- trial no dia 5 com oferta aberta
update assinaturas set inicio = now() - interval '4 days', fim = now() + interval '3 days' where user_id = :P and provider = 'trial';
select tst_como(:P); select oferta_ativar('abrir_app');
select ok(meu_plano() -> 'oferta' is not null and meu_plano() -> 'oferta' <> 'null'::jsonb, 'no teste (grátis) a oferta aparece');
reset role; set local request.jwt.claim.role = 'service_role';
select ok((kiwify_processa('{"webhook_event_type":"order_approved","order_id":"PIX1","order_status":"paid","payment_method":"pix","Customer":{"email":"PIX@t"},"Product":{"product_id":"zz"},"Commissions":{"charge_amount":"1999","product_base_price":"1999"}}') ->> 'ok')::boolean, 'compra no Pix processada');
reset role;
select ok((select valor from webhook_eventos where order_id = 'PIX1') = 19.99, 'valor do Pix registrado (R$ 19,99)');
select ok((select preco from assinaturas where user_id = :P and provider = 'kiwify') = 19.99, 'preço na assinatura');
select ok((select pro_ate from perfis where user_id = :P) is null or (select pro_ate from perfis where user_id = :P) > now(), 'coroa sincronizada');
select tst_como(:P);
select ok((meu_plano() ->> 'pago')::boolean and not (meu_plano() ->> 'trial')::boolean, 'depois de pagar: Pro pago');
select ok(meu_plano() -> 'oferta' is null or meu_plano() -> 'oferta' = 'null'::jsonb, 'depois de pagar: sem oferta');
select ok(admin_vendas() is null, 'aluna não vê vendas');
select ok(admin_planos_usuarias() is null, 'aluna não vê planos das outras');
select tst_como(:M);
select ok((select count(*) from jsonb_array_elements(admin_vendas()) x where x ->> 'pedido' = 'PIX1' and (x ->> 'valor')::numeric = 19.99 and x ->> 'nome' = 'Pix') = 1, 'painel mostra a venda com valor e nome');
select ok((admin_planos_usuarias() -> 'a5a5a5a5-0000-0000-0000-0000000000a5' ->> 'provider') = 'kiwify', 'painel sabe que ela é Pro pela Kiwify');
reset role;
