# Esquema do exercício

Catálogo (`src/treinos.js`, `src/casa.js`): `[id, nome, grupo, equipamento, passos|, erros comuns|, respiração]` — os 69 exercícios têm passos e erros; a respiração específica foi completada nos 15 que não tinham.
Ajustes do Admin (`exercAjustes`, por id) e exercícios novos (`exercExtras`): `nome`, `descricao`, `grupo`, `equip`, `nivel`, `objetivo`, `passos[]` (instrução escrita), `erros[]`, `resp`, `seguranca`, `voz` (texto revisado; vazio = montado dos campos), `status` (rascunho/revisar/publicado).
Repetições, tempo e descanso ficam em cada passo do programa (`steps`: `modo`, `val`, `desc`, `series`).
Publicar exige pelo menos um passo. Sem promessas médicas absolutas.
