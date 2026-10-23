# Player

Fases: `expl` (explicação, relógio parado) → `cont` (3-2-1) → `ex` (execução) → `rest` (descanso) → `expl` do próximo.
Arquivo: `src/treino-voz.js` (substitui iniciaTreino/proximaFase/relogio e acrescenta a tela de explicação, sem mudar o resto do player).
Configuração global: `app_config.treino_voz` = { ativo, idioma, velocidade, modo, contagem, permitir_pular }.
Eventos: exercise_explanation_started/completed/repeated, exercise_started, exercise_completed.
