# Verificação (selo azul ✓)

- ✓ = pessoa real verificada. NÃO significa pagamento. 👑 = assinatura paga ativa (o teste não mostra coroa).
- Assinante Pro pode pedir. Fluxo: pedido → código gerado no servidor → selfie segurando o código → pasta privada `verificacao/` (só a dona e o revisor) → análise.
- Status: not_requested, pending, verified, rejected, needs_review, revoked. `verificacao_decidir()` exige motivo para recusar/revogar/pedir nova análise e registra administrador, data e motivo na auditoria.
- Se o Pro acabar, a 👑 some e o ✓ continua. Nada de CPF, documento, telefone ou e-mail aparece publicamente.
