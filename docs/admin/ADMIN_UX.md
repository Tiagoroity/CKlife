# Painel administrativo · navegação e padrões

- Menu por categorias (Gestão, Marketing, Dados, Sistema) com seções recolhíveis; a seção da tela atual abre sozinha. Computador: barra lateral. Celular: gaveta pelo botão de menu (sem rolar de lado).
- Sub-navegação em chips dentro da seção (ex.: Usuárias → Lista, Verificações, Ciclo).
- Busca global: Ctrl/Cmd + K ou "/". Procura telas, alunas, anúncios, anunciantes, notificações, receitas, exercícios e publicações.
- Dashboard: só números reais (alunas, ativas, Pro, vendas, treinos, comunidade, notificações, anúncios) + alertas (denúncias, verificações, erros de pagamento, agendador desligado, cobranças vencidas) + atividade recente (`admin_painel_resumo`).
- Padrões: botões 42/36 px com raio 12/10, campos 44 px, cards raio 20, foco com anel verde, esqueleto de carregamento (`.skel`), estado vazio (`.adm-vazio`), confirmação antes de ações perigosas (`confirmar`).
- Anúncios: imagem recortada em 1080×1080 (WebP/JPEG) ou vídeo MP4/WebM até 30 s e 25 MB com capa; pasta `anuncios` (leitura pública, envio só com `admin_pode('campanhas')`). Lugares: Feed, Explorar, Início. Vídeo mudo, carrega e toca só quando visível.
