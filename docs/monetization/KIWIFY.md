# Kiwify (web)

Endpoint: `https://cklife.vercel.app/api/kiwify-webhook` (arquivo `api/kiwify-webhook.js`).

Segundo a documentação oficial (docs.kiwify.com.br › Webhooks):
- POST JSON com `?signature=` = HMAC-SHA1 (hex) do CORPO BRUTO, chave = token do webhook. Conferido com comparação de tempo constante (vetor de teste da documentação confere).
- Eventos (`webhook_event_type`): `order_approved` (compra_aprovada), `order_rejected`, `order_refunded`, `chargeback`, `subscription_renewed`, `subscription_late`, `subscription_canceled`, `billet_created`, `pix_created`. Carrinho abandonado não tem `webhook_event_type` e é ignorado.
- Duplicados acontecem: idempotência por (`provider`, `order_id`, `evento`) em `webhook_eventos`.

Mapeamento: aprovado/renovado → `active` (fim = `Subscription.customer_access.access_until` ou `next_payment`); atrasado → `grace_period`/`past_due`; cancelado → `canceled` até o fim pago ou `expired`; reembolso → `refunded`; chargeback → `chargeback`.
Plano: `product_id` do plano/campanha, senão `Subscription.plan.frequency` (`monthly`/`annually`).
Usuária: pelo e-mail do comprador. Compra antes do cadastro fica guardada e é ligada no cadastro.

Variáveis na Vercel: `KIWIFY_TOKEN` (obrigatória), `SUPABASE_SERVICE_ROLE_KEY` (obrigatória), `KIWIFY_TOKEN_ANTIGO` (opcional, rotação).
Reconciliação: a API `GET /sales/{id}` da Kiwify não traz `subscription_id` nem fim do período; o reenvio manual pelo painel da Kiwify ("Ver logs") é o caminho recomendado. Estrutura pronta para um job futuro com credenciais de API.
