# CK LIFE · Tudo o que o app é e tudo o que ele já tem

> Atualizado em 24/10/2026. Texto para qualquer pessoa ou outro chat entender o projeto inteiro.
> Ordem: o que é, as regras, o app da aluna tela por tela, Free x PRO, avisos e Coach, o painel do administrador, segurança, tecnologia, o que está em construção e o que depende do dono.

---

## 1. O que é o CK Life

**CK Life** é um app de bem-estar para mulheres: treino em casa, alimentação, rotina, ciclo, comunidade e uma coach virtual que acompanha a aluna todos os dias.

- **Slogan:** "Create. Keep. Live." · "Sua vida. Seu ritmo. Sua evolução."
- **Frase-guia:** "Nós não prometemos resultado mágico. Nós prometemos não deixar a usuária caminhar sem direção."
- **Público:** mulheres que já tentaram treinar, pararam e querem uma rotina que consigam manter.
- **Diferença do CK Life:** não é só uma lista de treinos. O app acompanha, lembra, comemora e chama de volta quando ela some, sempre com carinho e sem culpa. A ideia é a aluna ganhar constância e independência.
- **Dono:** Tiago (ROITY). Não é programador. Quer escala nacional (meta: 50 milhões de usuárias).
- **Endereços:**
  - App: https://cklife.vercel.app
  - Painel do administrador: https://cklife.vercel.app/admin
- **Funciona como app de celular** (PWA): instala na tela inicial pelo navegador, abre em tela cheia e recebe avisos no celular. Não está nas lojas da Apple e do Google ainda.
- **Identidade visual:**
  - Verde-escuro `#0E3D32`, verde `#2E7D5A`, detalhes em dourado/champanhe `#C9B37E`.
  - Letras Bricolage Grotesque (títulos) e Figtree (texto).
  - Modo claro e escuro.
  - A modelo das fotos é a "Maya", mulher fitness. A Coach CK Life usa a imagem dela, sempre identificada como coach virtual.

---

## 2. Regras que nunca podem ser quebradas

- **Nada de** culpa, vergonha, humilhação, medo, obsessão, comparação de corpos, pressão abusiva, falsas promessas, ranking de corpo ou peso, competição por emagrecimento, notificação agressiva.
- **Nada de** promessa de emagrecimento garantido, cura, diagnóstico ou alegação médica. O painel bloqueia textos com essas palavras.
- **Nunca inventar número.** Toda contagem social (mulheres ativas hoje, participantes de desafio, respostas) vem do banco. Sem dado suficiente, aparece um texto geral.
- **Ciclo, peso e saúde** nunca são compartilhados, nunca aparecem em avisos na tela bloqueada e nunca são usados para anúncio, parceiro ou pressão de treino.
- **O admin não navega** em chats, fotos privadas ou ciclo de ninguém. O painel só mostra números gerais.
- **Free nunca é bloqueada** de: privacidade, termos, exportar dados, excluir conta, denunciar, bloquear, segurança, sair.
- **Quando o PRO acaba, nenhum dado é apagado.**
- **PRO nunca é liberado pelo próprio app;** quem decide é o servidor.
- **Nenhuma cobrança nova** sem autorização do dono.
- **Anúncio nunca aparece** durante o treino, no chat ou em telas de segurança.
- **Coroa só por cima da foto** (nunca ao lado do nome).
- **Perfis da equipe** (Time de Incentivo) sempre identificados com selo, nunca fingem ser alunas, nunca respondem perguntas, nunca mandam mensagem, nunca avaliam produtos ou profissionais.
- **A Coach é virtual** e não finge ser pessoa.
- **Avisos do celular:** nunca enganar o sistema do celular para forçar permissão, nunca travar o app.
- **No código:** não remover funcionalidades existentes, não recriar o que já existe, nenhuma mudança destrutiva no banco, permissão sempre conferida no servidor.
- **Segurança no chat:** nunca digitar nem repetir senhas ou chaves. A chave secreta do Supabase fica só na Vercel.

---

## 3. O app da aluna, tela por tela

### 3.1 Entrada no app (cadastro como experiência) · novo

1. **Conta:** cadastro com nome, WhatsApp, nascimento, cidade, e-mail e senha. Também tem login, esqueci a senha e sessão que não cai.
2. **5 telas de abertura**, emocionais, com a foto da modelo ao fundo e texto que entra aos poucos:
   - "Você não entrou aqui só para treinar." → QUERO COMEÇAR
   - "Dessa vez você não precisa fazer tudo sozinha."
   - "Não precisamos de perfeição."
   - "Existem outras mulheres começando, tentando, errando, evoluindo…"
   - "ESSE PROJETO PODE DAR CERTO." → ESTOU PRONTA
   - Tem "Pular introdução".
3. **Perguntas do plano:**
   - objetivo (emagrecer, definir, ganhar massa, condicionamento, mobilidade);
   - o que tem em casa;
   - nível;
   - tempo por treino (5–15 / 15–30 / 30–45 / 45+ min);
   - **dias da semana** (escolhe Seg, Ter…);
   - **horário** (manhã, tarde, noite, varia);
   - **o que mais faz você desistir**;
   - **o que fez você chegar até aqui**;
   - **mensagem para a sua eu do futuro** (opcional; reaparece 30 dias depois);
   - peso e altura (só para calorias e metas).
4. **Compromisso:** "UM COMPROMISSO COM VOCÊ… VOLTE." → botão **EU VOLTO POR MIM 💚** → "Então nós temos um acordo."
5. **"DESSA VEZ, VOCÊ NÃO ESTÁ SOZINHA."** (tem treino, plano, comunidade, acompanhamento) → COMEÇAR MINHA JORNADA
6. **Legião CK Life:** "Bem-vinda à Legião CK Life". Mostra "Hoje, N mulheres apareceram por elas mesmas" com número real do banco, só a partir de 20 no dia; abaixo disso, uma frase geral. → EU FAÇO PARTE
7. **Apresentação da Coach:** "Oi, {nome}. Eu sou a Coach CK Life…" → FECHADO 🤝
8. **Avisos:** "DEIXA A GENTE CAMINHAR COM VOCÊ?" → ATIVAR MINHA COACH (pede a permissão do celular de forma honesta) ou "Agora não" ("Tudo bem, você pode ativar quando quiser").
9. **Plano pronto** (resumo do plano, programa recomendado, meta diária de calorias, proteína e água).
10. **Boas-vindas:** "{nome}, agora você faz parte do CK Life. 💚" com 3 botões: FAZER MEU PRIMEIRO TREINO · CONHECER A COMUNIDADE · DEFINIR MINHA ROTINA.
11. **O lembrete de treino** já fica criado com os dias e o horário escolhidos.
12. **Quem já tinha conta** vê uma vez uma apresentação curta (novidade, compromisso, Coach, avisos), com "Agora não", sem refazer o cadastro.

### 3.2 Botão "Atualizar" · novo

O app confere sozinho se saiu versão nova: ao abrir, ao voltar do segundo plano e a cada 5 minutos. Aparece a faixa "Nova versão do CK Life · ATUALIZAR". Um toque recarrega sem perder dados. Nunca aparece no meio do treino.

### 3.3 Barra de navegação (6 abas)

**Início · Treinos · Nutrição · Comunidade · Explorar · Perfil.**

No topo: logo, coroa PRO (só para quem paga), chip da sequência 🔥 e foto da aluna. O botão voltar do celular fecha janelas em vez de sair do app, e arrastar da borda esquerda também fecha.

### 3.4 Início

- **Topo com foto:**
  - saudação pelo horário ("Boa noite, Ana") e "Vamos cuidar de você hoje?";
  - check-in "Como você está hoje?" (Cansada, Tranquila, Bem, Animada), que adapta o treino e o cardápio do dia.
- **Recado da Coach** (cartão verde com dourado). Muda com a situação:
  - primeiro treino, treinou hoje, dias seguidos;
  - faltou 1, 2, 3 ou mais dias;
  - dia de folga no plano, horário do dia;
  - às vezes lembra o motivo dela.
  - Botões conforme o caso: Treino de 5 min, Treino do dia, 5/10/15 min, Alongamento, Registrar caminhada, Compartilhar vitória.
  - Atalhos fixos: **Hoje tá difícil?**, **Preciso de motivação** e **Recados** (com número de não lidos).
- **Seu dia, três passos para hoje:** treino do dia, calorias do dia e copos de água, com a meta da semana.
- **Grade "Tudo do CK Life":** atalhos para todas as áreas do app, para nada ficar escondido.
- **Sua semana:** calendário, sequência 🔥, Meu Ritmo, treinos, minutos e "Ver minha evolução".
- **Outros cartões:** receita do dia, achadinhos da loja, avisos do CK Life e o card do Meu Ciclo (se ela ativou e não escondeu).

### 3.5 Coach CK Life no app · novo

- **Hoje tá difícil?** Opções: sem tempo, cansada, desanimada, estressada, com dor ou desconforto, sem vontade. A Coach responde com carinho e oferece TREINO 5 MIN, ALONGAMENTO, CAMINHADA ou DESCANSAR HOJE. Descansar também vale.
- **Preciso de motivação:** frase forte, botão "Outra frase" e a lembrança do motivo que ela escreveu no cadastro.
- **Pouco ainda conta:** treinos próprios de 5, 10 e 15 minutos e um alongamento leve, **grátis para todas**.
- **Caminhada:** ela escolhe os minutos e registra quando volta. Não usa localização.
- **"OLHA QUEM VOLTOU 💚":** tela cheia quando ela volta depois de 7 dias ou mais, com 5 MIN / 10 MIN / CONTINUAR MEU PLANO. A partir da segunda volta: "Você já voltou N vezes. Isso é resiliência."
- **Primeiro treino:** comemoração especial "Você começou 💚", com "Chamar uma amiga para treinar comigo".
- **Nos treinos seguintes:** a tela de treino concluído traz uma frase da Coach.
- **30 dias depois do cadastro:** o recado mostra a mensagem que ela escreveu para a eu do futuro.
- **Parceira CK** e **Vitórias de hoje**: veja a seção 9 (Etapa 5).
- **Recados da Coach:** lista com o que o servidor mandou, com novos destacados. Tocar no aviso do celular abre o recado certo.

### 3.6 Treinos

- **Plano do Ano CK:**
  - 52 semanas montadas pelo objetivo, nível, dias e tempo;
  - 13 blocos de 4 semanas (base, resistência, força, queima), com a 4ª semana mais leve;
  - nenhuma combinação de exercícios se repete no ano;
  - calendário mostra o treino de cada dia, até 7 dias à frente.
- **Programas:** 10 programas em casa (com semanas e progressão automática). Alguns são grátis, os completos são PRO.
- **Treinos rápidos:** 6 (abdômen 10 min, HIIT 7 min, glúteos 15 min, pernas 15 min, alongamento, bom dia 5 min), mais os 4 da Coach.
- **Biblioteca:** 51 exercícios com fotos da modelo, passos, erros comuns e respiração. O admin pode criar mais.
- **Player de treino:**
  - antes de cada exercício, explicação por voz e texto (do catálogo, nunca de IA);
  - REPETIR ou INICIAR, contagem 3, 2, 1, VAI!;
  - tempo ou repetições, descanso e rodadas;
  - frases de incentivo e avisos de "faltam 10 segundos";
  - tela sempre acesa e sons próprios do CK Life.
- **Câmera que conta repetições:**
  - reconhece o corpo 100% no celular (MediaPipe), sem gravar nem enviar imagem;
  - conta pelos ângulos das articulações e dá dicas simples de postura;
  - tem botão para ligar e desligar;
  - não é avaliação profissional.
- **Fim do treino:**
  - confete, tempo, calorias, exercícios e % concluído;
  - recorde e sequência;
  - "Como foi?" (fácil / na medida / difícil) ajusta os próximos treinos (PRO);
  - cartão para compartilhar (WhatsApp, Instagram), "Postar na comunidade" e cupom a cada N treinos.
- **Desafios:** 7 dias (grátis), 21 e 30 dias (PRO).
- **Desafio de 21 dias em turma:** todas começam na mesma segunda e só aparecem números da turma, nunca nomes.
- **Adaptação ao dia:**
  - o check-in de 10 segundos (humor, energia, tempo, incômodo) e os sinais do Meu Ciclo ajustam o treino e o cardápio de hoje;
  - sempre dá para voltar ao original;
  - fica só no aparelho.

### 3.7 Nutrição

- **200 receitas, todas com foto**, com tempo, porções, calorias, proteína, carboidrato, gordura, ingredientes e passos. São de café da manhã, almoço, lanche e jantar.
- **Cardápio semanal**, **diário de refeições**, **metas** (calorias, proteína, água calculadas pelo perfil) e **contador de água**.
- **Modo cozinha por voz:** passo a passo falado, com tela grande.
- Cada receita pode ser Free ou PRO (o admin escolhe).

### 3.8 Comunidade (Comunidade 2.0)

- **Menu próprio:** Feed · Grupos · Mensagens · Amigas, com contador de não lidas.
- **Feed:**
  - abas "Para você" e "Seguindo", rolagem infinita;
  - posts com texto, foto e vídeo;
  - curtir, comentar, salvar e compartilhar.
- **Pergunta do dia:** uma pergunta nova por dia, com contagem real de respostas.
- **Stories de 24h:** texto, cores, fotos, vídeos, filtros, figurinhas, selos com dados do treino, quem viu e responder (vai para o chat).
- **Vídeos em tela cheia** (estilo reels).
- **Grupos por objetivo**, com capa e número real de membras.
- **Chat 1 a 1:**
  - texto, foto, vídeo (na melhor qualidade possível) e áudio;
  - figurinhas e emojis;
  - responder, apagar para mim ou para as duas;
  - status com corações (enviada, entregue, lida);
  - silenciar, denunciar e tempo real.
- **Figurinhas:** catálogo de 100 figurinhas oficiais em 10 categorias (humor da mulher que treina). Tem favoritas e recentes, e no PRO ela cria figurinhas com a própria foto. Filtros de foto feitos no aparelho.
- **Perfil social:**
  - capa, foto, nome, @ único, bio, cidade e objetivo opcionais;
  - seguidoras e seguindo, perfil privado e pedidos para seguir;
  - mostrar conquistas, compartilhar perfil;
  - selo azul de verificação (precisa de aprovação; pagar não dá o selo).
- **Segurança:** seguir, bloquear e denunciar (perfil, post, comentário, Story, mensagem). Limites contra abuso.
- **Notificações:** central com Todas, Interações, Mensagens e Conquistas, mais avisos discretos e som do CK Life.
- **Conquistas comemoradas** com cartão bonito para postar ou compartilhar (38 conquistas; veja a seção 9).
- **Time de Incentivo CK:**
  - 50 perfis oficiais da equipe, com fotos, capas e um selo próprio (roseta verde-dourada com coração);
  - comentam no máximo 1 vez por post de aluna real, só com frases positivas, curtem e reagem com ❤️ aos Stories;
  - funcionam 24h, com limites por dia;
  - nunca respondem, nunca mandam mensagem, não avaliam e não têm login;
  - ao tocar no selo aparece a explicação "perfil da equipe";
  - não aparecem nas sugestões de "encontrar mulheres".

### 3.9 Explorar

- **Cidade da aluna** ("Minha cidade", trocar só para ver ou mudar de vez), sem GPS.
- **Empresas e academias**, **profissionais** (presencial e online, com selo verificado e registro) e **serviços com preço**.
- **Agendamento** em passos (serviço → data → horário → revisão), com status e "Meus agendamentos".
- **Avaliações** de 1 a 5 estrelas, com selo "serviço realizado" e denúncia.
- **Clube CK:** benefícios e cupons validados com PIN na loja parceira. Alguns benefícios são PRO.
- **Loja / Achadinhos:** produtos próprios, de parceiros e de afiliado. O link abre exatamente como foi colado (mantém o código de afiliado). Tem promoções, indicação por contexto e compartilhar. Não tem checkout próprio.
- **Banners**, **favoritos**, links prontos (WhatsApp com mensagem, Instagram, site, Como chegar no Google Maps).
- **O painel liga e desliga** cada módulo (Perto de você, Online, cupons, agendamentos, loja…). Quando um módulo volta, ganha selo "Novo" por 14 dias.

### 3.10 Perfil

- **No topo:** foto, nível (Começando, Firme, Constante, Dedicada, Imparável) e estatísticas.
- **Minha Jornada** (linha do tempo da história dela) e **Conquistas** (coleção com o que falta).
- **Meu progresso:** calendário, sequência, recorde, medalhas (14), peso com gráfico, medidas.
- **Meu Ciclo:**
  - opcional e privado;
  - previsões em faixa, atraso, check-in de sintomas e humor, adaptar o treino de hoje, padrões, lembrete discreto;
  - apagar tudo;
  - não é contraceptivo nem diagnóstico.
- **Cabelo para Treinar:**
  - penteados para treinar por tipo de cabelo, comprimento, treino, tempo e dificuldade;
  - passo a passo com ilustrações próprias ou fotos e vídeos do painel;
  - favoritos;
  - liberado pelo painel (desativado / beta / ativado).
- **Configurações e avisos:**
  - Avisos no celular, Som do CK Life;
  - **Coach e avisos** (novo): escolher categorias (Coach, Treinos, Alimentação e água, Comunidade, Conquistas, Desafios, Promoções, esta já desligada), horário de silêncio e até 3 recados por dia;
  - Lembrete de treino (o servidor avisa uns 20 min antes, mesmo com o app fechado).
- **Conta e outros:**
  - voz e velocidade, tema claro ou escuro;
  - plano PRO, Meus agendamentos, favoritos, Minha cidade, cupons, convidar, suporte, sair;
  - **Privacidade e meus dados:** documentos, autorizações, baixar meus dados, pedidos LGPD com protocolo (inclusive pedir a exclusão da conta), sair de todos os aparelhos.

---

## 4. Free x PRO

- **CK Life Free:** treino do dia, comunidade completa, conquistas, Explorar, Coach, treinos de 5/10/15 min, desafio de 7 dias, treinos rápidos básicos, receitas marcadas como grátis, figurinhas grátis e alguns filtros.
- **CK Life PRO (entitlement `CK_LIFE_PRO`):**
  - programas completos e todos os treinos rápidos;
  - adaptação e dificuldade dinâmica, desafios de 21 e 30 dias;
  - evolução avançada, treino adaptado à energia;
  - todas as receitas, cardápio semanal, modo cozinha por voz;
  - ciclo inteligente;
  - todas as figurinhas, figurinha com a própria foto, todos os filtros, maquiagem virtual, selos com dados do treino, vídeos mais longos (60 s, contra 15 s no Free);
  - Clube CK Pro, direito de pedir verificação;
  - sem anúncios.
- **Preços** (configuráveis no painel):
  - Pro Mensal R$ 19,99;
  - Pro Anual R$ 155,88 (12x R$ 12,99).
  - Checkouts na Kiwify; a compra liga o PRO pelo webhook no servidor.
- **Trial, ofertas e "Pro grátis" pelo admin** existem. Cada recurso pode ser mudado entre Free e PRO no painel.
- **Anúncios:** só para Free a partir do 31º dia. No máximo 1 por tela, nunca no treino, no chat ou em segurança.

---

## 5. Avisos, lembretes e a Coach no servidor

- **Avisos no celular (Web Push)** com o app fechado: mensagens, curtidas, comentários, seguidoras, conquistas, avisos da Central, lembretes e recados da Coach.
- **Som:** com o app aberto toca o som próprio do CK Life; fechado, usa o som do celular, com vibração própria.
- **Lembrete de treino:** fica salvo no banco e o servidor envia antes do horário, nos dias escolhidos.
- **Coach no servidor** (novo, já ativada):
  - **Frequência:** a cada 10 minutos o servidor decide se manda **um** recado útil para cada aluna.
  - **14 automações:**
    - voltou depois de pausa;
    - comemorar treino (1h depois; sequência e marcos);
    - sumiu 7, 5, 3 e 2 dias (uma vez por pausa; para depois de 30 dias);
    - faltou ontem (vem desligada);
    - um mês de CK Life; primeira semana;
    - antes do horário de treino;
    - bom dia em rodízio (segunda, sexta, fim de semana, água, alimentação, motivação…);
    - fim de dia; comunidade às quartas.
  - **Anti-spam:**
    - no máximo 2 contatos por dia, contando os lembretes;
    - pelo menos 3 horas entre recados;
    - silêncio das 21h às 8h, no fuso de cada aluna;
    - respeita as categorias que ela desligou.
  - **401 mensagens em 32 categorias**, com variáveis seguras ({primeiro_nome}, {streak}, {quantidade_treinos}, {horario_treino}, {dias_ativos}, {ultima_atividade}, {objetivo}, {tempo_disponivel}).
  - **Entrega e privacidade:** quem não ativou avisos recebe nos "Recados" do app. Nunca usa ciclo, peso ou saúde.

---

## 6. Painel do administrador (/admin)

**Navegação:** menu em grupos recolhíveis (barra lateral no computador, gaveta no celular) e busca global (Ctrl/Cmd + K).

### Visão geral
- **Resumo:** dashboard com números reais.
- **Números do negócio:** retenção, turmas por semana de cadastro, funil, dinheiro e ativas por dia. Sem base suficiente, aparece "-".

### Gestão
- **Usuárias:** lista, dar PRO grátis, bloquear e verificações de selo azul.
- **Treinos e exercícios:** criar exercícios, revisar o texto da voz e configurar a explicação por voz.
- **Receitas:** criar, ocultar, marcar Free ou PRO.
- **Conteúdo:** avisos, banners, destaques, categorias, figurinhas (ativar, desativar, cadastrar).
- **Cabelo para Treinar:** liberação e cadastro de penteados com passos, fotos e vídeo.

### Comunidade
- **Denúncias:** analisa só o conteúdo denunciado; ocultar, restaurar, suspender, resolver, com histórico.
- **Grupos.**
- **Time de Incentivo:** chave geral, horário, limites por dia, liga ou desliga cada um dos 50 perfis, histórico de tudo o que fizeram.

### Marketing
- **Engajamento & Coach** (novo):
  - **Visão geral:** ativas hoje, na semana e no mês; quantas voltam no dia seguinte, na 1ª semana e no 1º mês; recados enviados e abertos; quem treinou depois; recuperadas; recados por dia e por categoria; quem desligou.
  - **Mensagens:** tabela com ID, categoria, texto, tom, gatilho, prioridade, Free/PRO, último envio, uso, CTR, conversão e status. Dá para editar com prévia do celular, pausar e "Testar em mim".
  - **Automações:** QUANDO / SE / AGUARDAR / AÇÃO, com liga/desliga e prioridade.
  - **Inativas e segmentos:** só contagens, sem lista de ninguém.
  - **Configurações:** chave geral, recados por dia, intervalo e silêncio.
  - Testes A/B: em breve.
- **Central de Notificações:** criar, agendar e enviar avisos por público (todas, PRO, trial, Free, ativas, inativas…). A prévia mostra quantas alunas vão receber; enviados, recebidos e cliques são contados de verdade.
- **Anúncios:** anunciantes, campanhas com imagem 1080x1080, vídeo até 30 s ou texto, locais (feed, Explorar, Início), métricas e PDF para o anunciante.
- **Clube e Explorar:** empresas, profissionais (aprovar, verificar, suspender), serviços, agendamentos, avaliações, Clube CK, cupons, loja e produtos (com "Testar link"), métricas do Explorar.

### Monetização
9 abas: visão geral, planos, assinaturas, trials, ofertas, recursos Free/PRO, receitas Free/PRO, pagamentos e webhooks, configurações.

### Sistema
- **Módulos do app:** ligar e desligar cada área.
- **Cidades, segmentos, configurações.**
- **Admins com papéis prontos:** Super Admin, Administrador, Operador, Moderador, Suporte, Privacidade/LGPD. A permissão por área é conferida no banco.
- **Segurança & Privacidade** (18 sub-abas): checklist, LGPD (pedidos com protocolo e prazo), consentimentos, incidentes, auditoria que não se apaga, documentos legais versionados, retenção, autenticação em 2 etapas para admin.

---

## 7. Segurança e privacidade

- **Banco com regras por linha (RLS):** cada aluna só lê o que é dela e o servidor confere toda permissão.
- **Fotos e vídeos da rede social** ficam num armazenamento privado, com links temporários.
- **Auditoria** de ações do admin (não pode ser editada nem apagada).
- **LGPD:** baixar meus dados, pedido de exclusão, consentimentos registrados, documentos com aceite.
- **Idade mínima:** 18 anos, por autodeclaração.
- **Limites técnicos honestos:** um app de navegador não consegue bloquear nem detectar print de tela.

---

## 8. Tecnologia (resumo)

- **App:**
  - página única em HTML, CSS e JavaScript puros (sem framework);
  - montada por um script Python (`build.py`) a partir de vários arquivos em `src/`;
  - PWA com service worker só para avisos (não guarda cache: sempre carrega a versão mais nova).
- **Banco:** Supabase (login, Postgres com RLS, armazenamento de arquivos, tempo real). Tarefas automáticas no servidor com `pg_cron`:
  - avisos e lembretes a cada minuto;
  - Time de Incentivo a cada 5 minutos;
  - Coach a cada 10 minutos.
- **Hospedagem:** Vercel (site + funções `api/push` e `api/kiwify-webhook`). Código no GitHub `Tiagoroity/CKlife` (o site sai da raiz; o código-fonte fica em `fonte/`).
- **Recursos do aparelho:** voz (Web Speech), sons (Web Audio), câmera com MediaPipe no próprio celular, canvas para cartões e fotos, tela sempre acesa.
- **Testes:** 403 testes automáticos de banco (segurança, permissões, Coach, equipe…), robô de testes que toca em todos os botões do app e do painel, e testes em telas de 320 px, 375 px e computador.

---

## 9. Em construção agora: a "evolução profunda"

Objetivo: o CK Life acompanhar a aluna como uma coach, com rotina, missões e comunidade integradas.

- ✅ **Etapa 1:** entrada emocional, compromisso, Legião com número real, apresentação da Coach, ativação de avisos, boas-vindas com 3 ações, versão curta para quem já tinha conta, botão Atualizar.
- ✅ **Etapa 2:** Coach no app (recado do dia, Hoje tá difícil?, Preciso de motivação, treinos de 5/10/15 min, caminhada, Olha quem voltou, primeiro treino especial, mensagem da eu do futuro).
- ✅ **Etapa 3:** Coach no servidor (371 mensagens, 13 automações, anti-spam, preferências, Recados no app, painel Engajamento & Coach). SQL já rodado.
- ✅ **Etapa 4:**
  - no Início, logo abaixo da Coach: **DESAFIO CK DE HOJE** (12 desafios pequenos, um por dia; vários marcam sozinhos quando ela faz, os outros têm o botão FEITO ✓) e **MISSÃO DA SEMANA** (TREINAR Nx ○○○, com N tirado do plano dela, sem cobrança quando a semana aperta);
  - **38 conquistas** (eram 11): 5, 75, 150 e 300 treinos; 21, 45 e 100 dias seguidos; e 18 especiais (eu volto por mim, recomeço corajoso, resiliência, desafios do dia, semanas no ritmo, treinos curtos, caminhante, madrugadora, coruja fit, fim de semana ativo, 500 e 3.000 minutos, check-ins, 1 mês e 1 ano de CK Life);
  - quando a sequência cai: "Você já conseguiu X dias seguidos antes. Dá para começar de novo hoje."; resiliência: "Você já voltou N vezes";
  - resumos automáticos **SUA SEMANA** (domingo à noite ou segunda/terça) e **OLHA TUDO QUE VOCÊ FEZ EM {MÊS}** (dias 1 a 5), uma vez cada, só se houve atividade, com cartão 1080x1350 para compartilhar;
  - **Chamar uma amiga** depois das grandes conquistas;
  - **Minha Jornada ampliada:** números da história dela, resiliência, botões Minha semana / Meu mês / Conquistas e novos momentos na linha do tempo (compromisso, mensagem para a eu do futuro, voltas, semanas no ritmo, conquistas especiais).
- ✅ **Etapa 5:**
  - **VITÓRIAS DE HOJE** no topo da Comunidade: fotos de quem compartilhou uma vitória hoje (com o emoji da conquista), "N mulheres comemoraram hoje" com número real e o botão "Minha vitória";
  - **"Compartilhar minha vitória"** no fim do treino e no recado da Coach: já abre a postagem marcada como vitória, com o cartão do treino;
  - **Coach postando na comunidade:** perfil oficial "Coach CK Life" (virtual, com selo, sem login) faz 1 post por dia (20 perguntas e incentivos em rodízio). Na segunda, se pelo menos 5 mulheres compartilharam vitórias na semana, diz o número real. Nunca responde ninguém, e o Time de Incentivo nunca comenta nos posts dela. O painel liga, desliga e escolhe o horário;
  - **"Amiga, faltou você lá"**: nova automação da Coach para quem participava da comunidade e sumiu de 4 a 14 dias (no máximo a cada 10 dias; 10 mensagens);
  - **Parceira CK** (opcional, em Perfil): convite só entre amigas que se seguem; cada uma vê só quantos dias a outra treinou na semana; 1 incentivo por dia com frases prontas e positivas; recusa silenciosa; qualquer uma encerra quando quiser. Aparece também no cartão de missões do Início;
  - **PRO refinado:** anel champanhe na foto do topo, recado da Coach com brilho perolado, cartões cumpridos com detalhe champanhe;
  - **Seus insights** no Início: melhor horário, dia mais constante, ritmo do mês (comparando só com ela mesma), hidratação, treino favorito e maior sequência. A Free recebe 2 insights e um link discreto para o PRO; o PRO vê todos;
  - **Testes das jornadas:** nova, antiga, sumida, Free, PRO, sem internet, avisos desligados, dados incompletos, celular pequeno; 432 testes de banco OK.
---

## 10. O que depende do dono (Tiago)

- **Capas de 4 perfis da equipe (números 37 a 40):** gerar as imagens no formato certo e mandar.
- **Cadastrar no painel** as empresas, profissionais, produtos, banners e benefícios reais da cidade.
- **Decidir:**
  - lojas da Apple e do Google (precisa de conta de desenvolvedor);
  - preço final do PRO;
  - login para profissionais;
  - pagamento de agendamentos.
- **Pendências jurídicas:** textos de Termos e Privacidade, idade mínima, prazos de retenção.
