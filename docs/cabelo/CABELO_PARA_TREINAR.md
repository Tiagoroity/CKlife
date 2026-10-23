# Cabelo para Treinar

- Liberação em `feature_flags` (chave `cabelo`): `disabled` (padrão) | `beta` | `enabled`. Sem registro ou erro = desativado (`recurso_visivel`).
- Beta: administradores + alunas em `beta_users`. Painel: Conteúdo > Cabelo para Treinar (estado, beta por e-mail, "Visualizar como aluna" = `/?preview=cabelo#abrir-cabelo`, só para conta admin, não publica nada).
- Tabelas: `penteados` (nome, slug, descrição, tipos[], comprimentos[], treinos[], minutos, dificuldade, fixação, acessórios[], thumb, imagem, video_url, produtos[] (reservado p/ afiliados), destaque, ordem, status rascunho|publicado|desativado), `penteado_passos` (numero, titulo, instrucao, midia, vista front|side|back|detail), `penteado_favoritos`, `cabelo_prefs`.
- RLS: aluna lê só publicados e só se o recurso estiver visível para ela; escrita só `admin_pode('cabelo')`. Mudanças auditadas.
- Mídia: bucket `cabelo` (leitura pública; envio só pelo painel; JPG/PNG/WebP/MP4/WebM até 30 MB). Imagens redimensionadas para 1200 px no navegador. Sem mídia: placeholder "Mídia pendente" (nenhuma imagem gerada automaticamente).
- App: entra no Início (card) e no Perfil (ao lado de Meu Ciclo) só quando visível. Conteúdo carregado ao abrir; passos ao abrir o tutorial; vídeo só ao tocar.
- Recomendação: filtra tipo/comprimento/tempo/dificuldade/fixação; pontua treino indicado, intensidade x fixação, bike (baixo), yoga/pilates (lateral/baixo), destaque e rapidez.
