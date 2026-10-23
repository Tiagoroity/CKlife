# Ofertas

- Teste: no dia 5 (`trial_offer_day`), uma vez, campanha `trial-dia5`: Mensal R$ 11,99 por 12 meses (checkout `Ukjfxn9`), Anual R$ 119,88 / 12x R$ 9,99 quando permitido (checkout `FR31cUG`).
- Duração: 48 horas reais (`expira` gravado no servidor). Fechar/atualizar/trocar de aparelho não reinicia.
- Free: só em momentos naturais (`contextos_oferta`: treino_concluido, recurso_pro, sticker_pro, programa_pro, grafico_pro, paywall), intervalo `offer_cooldown_days` (15) após a última oferta, máximo `max_ofertas_90d` por 90 dias, campanhas alternadas (`sentimos-falta`, `condicao-ck`, `volte-completa`, `continue-evolucao`, `acesso-especial`).
- Métricas por campanha: impressões, cliques, checkouts, conversões (`ofertas_usuario`).
- Funções: `oferta_ativar(contexto)`, `oferta_evento(id, tipo)`. Admin: Monetização › Ofertas e Configurações.
- O app nunca abre paywall sozinho durante a navegação.
