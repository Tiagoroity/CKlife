# Voz (TTS)

Usa o TTS nativo do aparelho (`speechSynthesis`), pt-BR, preferindo vozes femininas naturais (Luciana, Francisca, Fernanda, Vitória…) com fallback para a voz disponível. Sem arquivos de áudio.
Velocidade: 0,8x / 1x / 1,2x (aluna) e padrão em `app_config.treino_voz`. Respeita o volume do aparelho.
Se a fala não começar em 2,5 s: "Não conseguimos reproduzir a explicação por voz." + texto completo + Tentar novamente / Iniciar exercício.
