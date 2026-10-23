# Notificações do CK Life

## Peças
- `push_inscricoes`: um registro por aparelho que ativou avisos (Web Push, chave VAPID).
- `push_fila`: fila privada; cada item tem um código de uso único. Pode ser de uma pessoa (`user_id`) ou de um lote (`usuarios[]`, até 300).
- `/api/push` (Vercel): troca o código pelo aviso + inscrições (`push_pegar`), envia em blocos de 50 e informa o resultado (`push_resultado`).
- `sw.js`: mostra a notificação, confirma recebimento/toque dos avisos da Central (`push_confirma`) e abre a área certa do app.
- `push_tick()`: roda a cada minuto pelo pg_cron (`ck-push-tick`): envia agendadas e lembretes.

## Central de Notificações (painel)
- Tabela `notif_campanhas`; leitura `admin_ve('notificacoes')`, escrita `admin_pode('notificacoes')` (RLS + gatilho `protege_notif`).
- Depois de enviada não pode ser editada. Contadores só o sistema altera. Tudo vai para `auditoria`.
- Públicos (`_notif_alvos`): todas, pro (pagantes), trial, free, ativas/inativas/sem_treino/novas (X dias), grupo, cidade, e-mails específicos. Só contas ativas.
- Números: público, com aviso ligado, enviadas (aceitas pelo serviço de push), recebidas (aparelho confirmou), toques, falhas. Entrega real não é informada pelos provedores de Web Push; "recebidas" depende do aparelho confirmar.

## Lembretes
- Tabela `lembretes` (tipo `treino` | `agua` | `refeicao`, hora, dias, antecedência, fuso IANA, `pausado_ate`).
- `lembretes_envios` com `unique(lembrete_id, dia)`: nunca duplica e fica registrado.
- Desligado, apagado ou "hoje não vou treinar" (`pausado_ate`) não envia. Janela de 10 min para tolerar atraso do agendador.
- Para novos tipos: acrescentar no `check` de `tipo` e no texto de `_lembretes_tick`.

## Som
- App aberto: assinatura sonora própria (`SOM.notif`, WebAudio) em todo aviso interno; o aviso do sistema chega silencioso para não tocar dois sons.
- App fechado: Android/iOS não permitem que um site/PWA escolha o som da notificação; usa o som do sistema e um padrão de vibração próprio (Android).
- Arquivo `som/ck-notificacao.wav` pronto para os apps nativos (Android: canal de notificação com som próprio; iOS: converter para .caf e usar `sound` no payload APNs).
