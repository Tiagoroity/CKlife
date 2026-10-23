# Entitlement CK_LIFE_PRO

PROVIDER (Kiwify, Apple, Google, manual, promoção) → ASSINATURA (`assinaturas`) → ENTITLEMENT (`_plano()`, `tem_pro()`) → ACESSO (`pode_recurso()`).

- O app pergunta só `meu_plano()` (relógio do servidor). Resposta: `status`, `pro`, `trial`, `fim`, `dias_restantes`, `anuncios`, `oferta`, `verificacao`, `recursos` (feature flags já resolvidas) e `limites`.
- Status: `trialing`, `active`, `past_due`, `grace_period`, `canceled` (Pro até o fim do período), `expired`, `refunded`, `chargeback`, e `free` quando não há acesso.
- Premium antigo (`alunas.premium`) continua valendo até a data dele (provider `legado`).
- Nada é liberado pelo app: usuárias não têm política de escrita em `assinaturas`; `perfis.verificada` e `perfis.pro_ate` são protegidos por gatilho.
- Feature flags: tabela `recursos` (free/trial/pro/limites/ativo). No app: `pode(recurso)`, `limite(recurso)`, `exigePro(recurso)` em `src/plano.js`.
- Validação no servidor: figurinhas Pro em posts/comentários (gatilho), figurinha própria e selfie de verificação (storage), pedido de verificação (RLS), cupom do Clube Pro (`validar_cupom`), ofertas, anúncios.
- Limitação: programas, receitas e o player estão no pacote do app (PWA estático). O bloqueio desses conteúdos é feito no app; para blindar no servidor seria preciso mover o conteúdo para o banco (decisão futura).
- Nunca bloqueados: privacidade, termos, exportar dados, excluir conta, denunciar, bloquear, segurança, sair. Nenhum dado é apagado quando o Pro acaba.
