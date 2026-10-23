# CK LIFE · DOCUMENTO MESTRE DO PROJETO

> Atualizado em 23/10/2026, depois da GRANDE EXPANSÃO (commit 8b9235f). Este documento resume tudo o que foi construído até agora, para que qualquer pessoa ou agente continue o trabalho sem reler a conversa.
> Legenda: ✅ pronto e no ar · 🟡 parcial · ⬜ não existe ainda.

---

## 1. Visão geral

**CK Life** é um app de treino em casa para mulheres. Slogan: "Sua evolução, todos os dias."

- **App das alunas:** https://cklife.vercel.app
- **Painel administrativo:** https://cklife.vercel.app/admin
- **Demonstração sem banco** (dados de exemplo no aparelho): https://claude.ai/artifact/FYyAokNvw9kzNDTprzkKPd
- **Guia "Como colocar no ar"** (artifact antigo): https://claude.ai/artifact/JPNuGULknxqjEj8PYqU9LS
- **Dono:** Tiago (ROITY). Não é programador.
  - Fala português e escreve rápido, com erros de digitação.
  - Quer respostas em português, simples, com passo a passo de cliques.
  - Quer que o agente faça tudo sozinho e publique sem pedir confirmação para coisas comuns.
  - Pede sempre: "não estrague nada do que já está feito".
- **Modelo da marca:** "Maya", mulher fitness nas fotos dos exercícios (fotos geradas pelo dono).
- **Cores:**
  - Verde escuro `#0E3D32`.
  - Verde `#2E7D5A`.
  - Destaque verde-claro `#3DDC6E`.
  - Laranja `#FFB23F` para avisos e Premium.
- **Preço do Premium:**
  - No app aparece `premiumPreco` (padrão R$ 19,90, configurável no painel).
  - O dono comentou que quer que o app "valha R$ 79/mês".
  - Nenhuma cobrança nova pode ser criada sem autorização dele.

---

## 2. Funcionalidades existentes (resumo)

| Área | O que existe |
|---|---|
| Conta | Cadastro, login, esqueci a senha, nova senha, sessão que não cai, mostrar ou esconder senha, e-mail lembrado |
| Primeiro acesso | Questionário de 7 passos que recomenda um programa |
| Navegação | **6 abas** (pedido do Tiago em 23/10): Início, Treinos, Nutrição, Comunidade, Explorar, Perfil. Evolução virou "Meu progresso" no Perfil |
| Início | Saudação, treino de hoje, anel de calorias, água, primeiros passos, meta semanal, frase e dica do dia, receita do dia, instalar o app. Também mostra card do Meu Ciclo (se ativo e não escondido), próximo agendamento e banners do local "Início" |
| Treinos | Programas, treinos rápidos, biblioteca de exercícios, player com voz, sons, confete, cartão de conquista |
| Nutrição | 197 receitas, cardápio, diário, metas, modo cozinha |
| Evolução ("Meu progresso") | Calendário, sequência, recorde, medalhas, peso, medidas |
| Perfil | Foto, nível, estatísticas, Premium, Meu progresso, Meu Ciclo, Meus agendamentos, Meus favoritos, Minha cidade, Privacidade, dados, plano, objetivo, metas, peso, lembrete, voz, sons, tema, cupons, profissionais (atalho p/ Explorar), convidar, compartilhar sequência, suporte, sair |
| Comunidade | Feed com texto e foto, curtidas, comentários, moderação, **chat 1 a 1 entre alunas**, perfil público (nome, foto, publicações), bloquear aluna, compartilhar sequência (sempre por escolha da aluna) |
| Explorar | Cidade ("Minha cidade" + ver outra cidade sem GPS), busca geral, Destaques, Academias/empresas, Profissionais (presencial/online), Serviços, Clube CK, Loja, banners, favoritos, avaliações, agendamento |
| Agendamentos | Fluxo serviço → data → horário → revisão → confirmação. Status Solicitado, Confirmado, Concluído, Cancelado, Não compareceu. "Meus agendamentos" (Próximos/Concluídos/Cancelados) |
| Avaliações | 1 a 5 estrelas + comentário, selo "Serviço realizado" quando há agendamento concluído, "Denunciar avaliação", moderação no painel |
| Meu Ciclo | Opcional e privado: configuração, previsões em faixa (estimativa), atraso, motivos possíveis, check-in diário, adaptar treino de hoje, calendário, padrões, lembrete discreto, apagar dados |
| Anúncios | Pop-up de campanhas segmentadas (não aparece para Premium) |
| Cupons / Clube CK | Cupom a cada N treinos e cupom "livre" pego no Clube CK. Loja valida com PIN no servidor |
| Lembretes | Arquivo .ics semanal + aviso com app aberto. Ciclo: lembrete discreto opcional (app aberto) |
| Painel admin | Ver seção 15 |
| Relatório PDF | Relatório do anunciante |
| Premium (Kiwify) | Webhook pronto, falta configurar (BLOQUEADO PELO USUÁRIO) |

---

## 3. Telas existentes

### App da aluna (um `index.html` só)

- `#splash`, login/cadastro (`.lhero`), nova senha (`#type=recovery`), onboarding (`#v-onb`), bloqueada (`#v-bloq`).
- `#v-app`:
  - **Topo:** logo, chip de sequência, avatar `#top-av`, botão do painel (só admin).
  - **Barra (6 abas):** `inicio` Início · `treinar` Treinos · `dieta` Nutrição · `juntas` Comunidade · `explorar` Explorar · `perfil` Perfil.
  - **Fora da barra:** `t-evolucao` (Meu progresso, aberto pelo Perfil; destaca a aba Perfil via `NAV_DE`).
  - **Folha `#sheet`:** detalhes (empresa, profissional, produto, Clube), agendamento em passos, Meus agendamentos, favoritos, cidade, privacidade, Meu Ciclo (todas as telas), conversas e chat, perfil público.
  - `#play` (player), `#cook` (modo cozinha), `#ad` (anúncio).

### Painel (`/admin` ou `#admin`)

Grupos do menu (`GRUPOS`, redefinidos em `admin-xp.js`):
- **Visão geral:** Resumo (com bloco Explorar), Métricas (anúncios), Métricas do Explorar.
- **Explorar:** Empresas e academias, Profissionais, Serviços, Agendamentos, Avaliações, Destaques.
- **Clube e loja:** Clube CK (= parceiros), Cupons, Loja e produtos, Banners.
- **Anúncios:** Anunciantes, Campanhas, Financeiro.
- **Conteúdo do app:** Alunas, Comunidade, Receitas, Exercícios, Avisos, Módulo Ciclo.
- **Ajustes:** Cidades, Segmentos, Categorias, Admins, Configurações.

---

## 4. Estrutura e arquitetura

### Página única
HTML, CSS e JS puros, sem framework. Tudo vira um `index.html` pelo `build.py`.

### Montagem (`build.py`)
`src/shell.html` tem marcadores trocados pelos arquivos:

| Marcador | Arquivo |
|---|---|
| `/*CSS*/` | `app.css` |
| `/*DATA*/` | `receitas1-4.js`, `treinos.js`, `casa.js` |
| `/*CONFIG*/` | configuração (Supabase e Kiwify) |
| `<!--SUPABASE-->` | supabase-js |
| `/*NUVEM*/` `/*SONS*/` `/*BONECO*/` `/*FOTOS*/` | `nuvem.js`, `sons.js`, `boneco.js`, `fotos.js` |
| `/*APP*/` | `app.js`, e **dentro dele** o marcador `/*EXPANSAO*/` (antes de `const TABS`) recebe `expansao.js` |
| `/*ADMIN*/` | `admin.js`, e **dentro dele** o marcador `/*ADMINXP*/` (antes de `window.ADMIN = { abrir }`) recebe `admin-xp.js` |

Gera: `fitverde.html` (demonstração, sem charset: o claude.ai coloca), `teste.html` (demonstração com charset, **use este para testar**), `ck-life/site/index.html` (site real).

### Organização do código
- `app.js` e `admin.js` são IIFEs. `expansao.js` e `admin-xp.js` ficam **dentro** delas (mesmo escopo), por isso usam direto `DB`, `ME`, `save`, `sheet`, `toast`, `ic`, `modal`, `crud` etc.
- `window.FV` (app → painel) agora exporta também: `XP`, `xpGarante`, `XCAT`, `xcats`, `lkWhats`, `lkInsta`, `lkSite`, `lkMapa`, `brl`, `XERR`, `STAG`, `modoTxt`.

### Dados
- `DB` ganhou as coleções `empresas`, `servicos`, `produtos`, `banners`, `categorias` (sincronizadas pelo `nuvem.js`, lista `LISTAS`; só o admin grava).
- **Camada `XP` (`expansao.js`)** para as tabelas novas. Na nuvem usa `NU.sb.from(...)`; no modo demonstração guarda no localStorage (`cklife_db_v1_x_<nome>`):
  - `XP.ag` agendamentos (listar, criar, status, apagar, ocupados → RPC `horarios_ocupados`).
  - `XP.av` avaliações (todas, de, salvar, denunciar → RPC, moderar, apagar).
  - `XP.ciclo` (ler, gravar, apagar, resumo → RPC `ciclo_resumo`). **Nunca grava em `ME`/`alunas.dados`.**
  - `XP.chat` (conversas, abrir, mensagens, enviar, apagarMsg, lida).
- Se uma tabela/função ainda não existe no banco, `XERR(e)` reconhece (PGRST205/PGRST202/42P01) e a tela mostra "Esta parte está sendo ativada. Volte daqui a pouco!" em vez de quebrar.
- **Métricas do Explorar:** usam a tabela `eventos` que já existia: `t` = `imp` (visto) ou `clk` (clique) e `c` = `x:<tipo>:<id>:<ação>`. Tipos: `emp`, `prof`, `prod`, `parc`, `ban`. Ações: `ver`, `whats`, `insta`, `site`, `mapa`, `comprar`, `agendar`, `cupom`, `fav`, `clk`. As métricas de campanhas não são afetadas (filtram por id de campanha).
- **Favoritos:** `ME.favx = ["emp:id", "prof:id", "prod:id", "parc:id"]` (receitas continuam em `ME.favs`).
- **Chat bloqueadas:** `ME.chatBloq = [{id, nome}]`.
- **Cidade temporária:** variável `XCID` (não salva); "Mudar para esta" grava `ME.cidade`.
- **Imagens do catálogo:** o painel redimensiona e envia para o bucket `catalogo` (`N.subirImg`). Se o bucket ainda não existe, guarda a imagem em base64 no cadastro e avisa.
- **Modo demonstração:** `xpSemente()` cria exemplos (3 empresas, 5 profissionais, 8 serviços, 3 produtos, 2 banners, Clube) uma vez (`DB.xpSemente`).

### Helpers importantes
- App: ver seção anterior + `rExplorar`, `xpCorpo`, `abrirEmp`, `abrirProf`, `abrirProd`, `abrirParc`, `agendar`/`passoAg`, `meusAgendamentos`, `meusFavoritos`, `escolheCidade`, `blocoAvaliacoes`/`avaliar`, `abrirCiclo`/`cicloTela`/`cicloCalc`/`checkin`/`adaptarTreino`, `xpInicio`, `perfilXP`/`ligaPerfilXP`, `privacidade`, `listaConversas`/`abreConversa`/`perfilPublico`, `areaSw`.
- Painel: `crud(cfg)` + `formX(cfg, item)` (construtor genérico de cadastro: campos text, area, num, money, sel, cid, chk, date, img, imgs, agenda, botão "Testar link"), `PROIBIDO` (bloqueia promessas de resultado garantido, cura, quilos em X dias, alegações médicas), `contaX(dias)` (métricas), `subirFoto`.

---

## 5. Banco de dados (Supabase)

- **Projeto:** `psxmyiudtuozasbqzvnu`, URL `https://psxmyiudtuozasbqzvnu.supabase.co`.
- **Scripts:** ficam em `ck-life/` e foram copiados para `repo/fonte/`.
  - Rodar no Supabase em SQL Editor → New query → colar → Run.
  - Todos podem ser rodados de novo sem estragar nada.
- **Login:** usa o Auth do Supabase com e-mail e senha.

### `banco-de-dados.sql` ✅ (já rodado)

| Tabela | Para quê | Regras (RLS) |
|---|---|---|
| `alunas` | Uma linha por aluna. Colunas `id` (= auth.users), `email`, `nome`, `whats`, `nasc`, `cidade` (int), `criado`, `ultimo`, `bloqueado`, `premium` (jsonb `{tipo, ate}`), `dados` (jsonb: perfil, treinos, diário, pesos, favs, foto, lembrete…) | A aluna lê e altera só a própria linha. O admin vê tudo. O trigger `protege_aluna` impede a aluna de mudar `premium`, `bloqueado` e `email`. No cadastro ela ganha 7 dias de teste, ou Premium se já houver compra aprovada |
| `admins` | `user_id`, `email`, `nome`, `perms` (jsonb), `desde` | Só admin lê e altera |
| `colecoes` | Conteúdo genérico do painel: `(nome, id) → dados jsonb` | `colecoes_ler`: lista fixa de nomes liberados para quem está logada, mais cupons próprios. Anônimo lê só `cidades` e `config`. Só admin grava, exceto a aluna criando o próprio cupom (`colecoes_criar_cupom`). O PIN do parceiro fica separado em `nome='pins'`, que a aluna não lê |
| `eventos` | Visualizações (`imp`) e cliques (`clk`) de anúncios: `t`, `c` (id da campanha), `u`, `d` | Cada um insere o que é seu. Só admin lê tudo |
| `acessos` | `(dia, user_id)`: quem abriu o app em cada dia | Igual a `eventos` |
| `compras` | Vem da Kiwify: `email`, `status` (aprovado ou cancelado), `produto` | Só o servidor (service_role) grava. O trigger `aplica_compra` liga ou desliga o Premium (35 dias) |

**Funções:**

- `e_admin()`.
- `existe_admin()`.
- `virar_primeiro_admin(p_nome)`.
- `validar_cupom(p_cupom, p_pin)`: valida o PIN no servidor e marca o cupom como usado.

**Lista atual liberada em `colecoes_ler`:** cidades, segmentos, config, freq, anunciantes, campanhas, parceiros, profissionais, avisos, receitasExtras, exercExtras, receitasOcultas, além de cupons da própria aluna.

### `comunidade.sql` ✅ (já rodado e conferido)

- **Tabela `posts`:** colunas `id`, `user_id`, `nome`, `foto`, `texto` (até 1000 caracteres), `img`, `oculto` e `criado`.
- **Tabela `curtidas`:** chave `(post_id, user_id)`.
- **Tabela `comentarios`:** colunas `id`, `post_id`, `user_id`, `nome`, `foto`, `texto` (até 500 caracteres) e `criado`.
- **Função `pode_postar()`:** só quem está logada e não bloqueada pode postar.
- **Regras:**
  - Todas as logadas leem.
  - Cada uma cria e apaga só o que é seu.
  - O admin pode ocultar e apagar qualquer coisa.
- **Storage:** bucket público `posts`, caminho `${uid}/${id}.jpg`. Cada uma só envia para a própria pasta.

### `expansao.sql` ✅ RODADO NO SUPABASE em 23/10/2026 (em 5 partes) e conferido

Arquivo final (revisado, só adiciona, pode rodar mais de uma vez). Contém:
- `admin_pode(area)` e `area_colecao(nome)`: permissão "editar" por área conferida no banco. Políticas de escrita de `colecoes`, `alunas`, `admins` e moderação de `posts` passam a usar isso (ler continua igual).
- `colecoes_ler` liberando `empresas`, `servicos`, `produtos`, `banners`, `categorias` para quem está logada.
- Bucket público `catalogo` (só admin envia/troca/apaga).
- `agendamentos` (+ índices, trigger `protege_agendamento`: aluna cria só "solicitado" e só pode cancelar; `nota_adm`) e RPC `horarios_ocupados` (não mostra quem marcou).
- `avaliacoes` (1 por aluna por alvo, `verificada` automática se há agendamento concluído, `oculta`, `denuncias`, trigger impede a aluna de mexer nesses campos) e RPC `denunciar_avaliacao`.
- `ciclo` (RLS: só a dona) e RPC `ciclo_resumo` (só números gerais, só admin com acesso).
- `conversas` e `mensagens` (só as duas participantes; trigger `atualiza_conversa`).
- **Nenhum** `drop table`, `drop column`, `delete` ou `truncate`. Não insere cidade nem dado de exemplo.

### Relacionamentos

- `auth.users` 1–1 `alunas` e 1–1 `admins`.
- `posts` 1–N `curtidas` e `comentarios`.
- `colecoes` é genérica e as ligações ficam por id dentro do jsonb:
  - `campanhas.anunc` → `anunciantes.id`.
  - `cupons.parc` → `parceiros.id`.
  - `cupons.user` → id da aluna.
  - `cidade` → `cidades.id` (número).

---

## 6. Usuários, login e perfis

- **Cadastro:** pede nome, WhatsApp, nascimento, cidade, e-mail e senha. O Supabase pode pedir confirmação por e-mail.
  - Os dados do cadastro ficam guardados em `localStorage[KEY+"_pend_"+email]` até o primeiro login.
- **Gênero:** sempre "feminino" (app só para mulheres).
- **Bloqueio:** aluna bloqueada vê a tela `#v-bloq`.
- **Premium:**
  - Campo `premium` = `{tipo: teste | pago | cortesia | vitalicio, ate: "AAAA-MM-DD"}`.
  - Toda nova aluna ganha 7 dias de teste.
  - O admin pode dar Premium por 7, 30, 90, 180 ou 365 dias, ou vitalício.
- **Admin:**
  - A pessoa precisa ter conta no app. Ela é adicionada em Painel → Admins.
  - Permissões por área: "Só ver" ou "Ver e editar", ou então acesso total.
  - **No servidor só existe a checagem "é admin ou não" (`e_admin`).** As permissões por área valem só no painel. Isso é uma limitação conhecida (seção 20).
- **Perfil (`ME`):**
  - `perfil`: `{peso, altura, objetivo, nivel, local: "casa", itens[], dias, tempo, atividade}`.
  - Treino e histórico: `prog` (programa atual), `treinos[]`.
  - Alimentação e corpo: `diario{}`, `pesos[]`, `medidas`.
  - Preferências: `favs[]` (receitas), `voz`, `vozVel`, `lembrete {dias[], hora}`.
  - Outros: `foto` (JPEG de 320 px em base64), `feedVisto`.

---

## 7. Treinos, exercícios e evolução ✅

### Conteúdo

- **Exercícios:** 51 em `treinos.js`, no formato `[id, nome, grupo, equipamento, passos, erros, respiração]`.
  - Os dados de músculo e animação ficam em `boneco.js`.
  - 43 têm foto (`img/ex-<id>.jpg`).
  - `fotos.js` troca o boneco pela foto. Exercícios sem foto mostram um cartão verde com as iniciais.
  - Alguns usam a foto de outro parecido (`FOTO` em `fotos.js`).
- **Programas:** 10 programas em casa (`casa.js`), com semanas e dias por semana.
  - `recomenda(perfil)` escolhe o programa e `ajusta()` faz a progressão.
- **Treinos rápidos:** 7 em `QUICK` (abdômen, HIIT 7 min, glúteos, braços e peito, pernas, alongamento, bom dia).
- **Exercícios do painel:** o admin pode criar exercícios (`exercExtras`).

### Player

- Preparação de 5 s, exercício por tempo ou repetições, descanso e rodadas.
- Voz em português (`VOZ_PREF`: Luciana, Francisca…) e frases de incentivo (`FR_METADE`, `FR_ULTIMO`, `FR_META`).
- Avisos "Faltam 10 segundos!" e "Prepare-se.".
- Mantém a tela acesa (WakeLock).

### Fim do treino

- Grava em `ME.treinos` `{d, prog, nome, min, kcal}`.
- Mostra confete e dá cupom a cada N treinos.
- Gera o cartão de conquista: canvas de 1080x1920 em JPEG.
- Botões de compartilhar e de postar na comunidade.

### Evolução

- Sequência de dias (`streak`), recorde (`recordeSeq`) e calendário mensal.
- Medalhas, peso com gráfico e medidas (cintura, quadril…).
- Níveis: 0 Começando, 5 Firme, 15 Constante, 30 Dedicada, 60 Imparável.

---

## 8. Comunidade

| Item | Status |
|---|---|
| Feed, foto, curtida, comentário, apagar, moderação, novidade | ✅ |
| **Chat 1 a 1** (botão "Conversas" no topo da Comunidade; tocar no nome/foto da autora → perfil público → Enviar mensagem) | ✅ |
| Perfil público (nome, foto, nº de publicações, fotos postadas) | ✅ sem dados de saúde |
| Bloquear aluna (some do chat; lista em Perfil › Privacidade) | ✅ (bloqueio é do lado de quem bloqueia) |
| Compartilhar sequência (abre o composer com o texto; a aluna decide postar) | ✅ |
| Seguidores | ⬜ não existe |
| Denunciar post/mensagem | ⬜ (moderação do admin existe; denúncia de avaliação existe) |
| Desafios | ⬜ não existem |

Chat atualiza a cada 4 s com a conversa aberta e confere novas mensagens a cada 45 s (badge vermelho). Sem anúncios na Comunidade. Nada de ciclo/peso/saúde é compartilhado automaticamente.

---

## 9. Meu Ciclo ✅

- **Entrada:** Perfil › Meu Ciclo e card na Início (a aluna pode esconder). Fora do menu principal.
- **Ativação opt-in** com tela explicando: opcional e privado, previsões são estimativas, quem decide o treino é ela, **não é contraceptivo nem diagnóstico**.
- **Configuração:** primeiro dia da última menstruação, duração (1–12), ciclo (18–60, padrão 28), regular/irregular/não sei. "Ajustar meu ciclo" mantém o histórico.
- **Cálculo (`cicloCalc`):** média real dos ciclos quando há 2+ intervalos (15–60 dias); margem ±2 (regular), ±3 (não sei), ±5 (irregular) ou pela variação real. Próxima menstruação em faixa; ovulação ≈ próxima − 14 (±2); janela fértil = ovulação −5 a +1. Fases: menstruação, folicular, janela fértil, ovulação, lútea, além da previsão.
- **Atraso:** "Sua menstruação ainda não foi registrada. Está X dias além da previsão." + Registrar menstruação / Atualizar ciclo / Entender possíveis motivos (texto responsável, sem diagnóstico).
- **Registros:** "Menstruação começou" (com data), "Menstruação terminou", histórico com exclusão.
- **Check-in "Como você está hoje?":** fluxo, sintomas, humor, energia, sono, anotações. Tocar num dia passado do calendário abre o check-in daquele dia.
- **ADAPTAR TREINO DE HOJE:** manter (treino do programa), mais leve (Bom dia 5 min), mobilidade (Alongamento), caminhada (registra minutos em `ME.treinos` com `rapido:"caminhada"`), descanso. Texto contextual pelo check-in, **sem regra automática** ("a escolha é sua").
- **Padrões:** só com 2+ ciclos e/ou 7+ check-ins.
- **Lembrete discreto** opcional: 2 dias antes da previsão, texto neutro ("Você tem um lembrete no seu acompanhamento"), só com o app aberto.
- **Privacidade:** dados só na tabela `ciclo` (RLS dona). No demo: `localStorage cklife_db_v1_x_ciclo_<id>`. Painel vê só números gerais (`ciclo_resumo`). "Desativar e apagar meus dados" apaga tudo.

---

## 10. Marketplace de profissionais ✅

- Mesma coleção `profissionais` (os cadastros antigos continuam valendo). Campos novos: `modo` (presencial/online/ambos), `cidade` (vazio = só online), `end`, `registro`, `insta`, `site`, `msg` (1ª mensagem do WhatsApp), `verificado`, `destaque`, `status` (ativo/pendente/suspenso), `agenda {dias, ini, fim, passo}`.
- Categorias gerenciáveis (painel › Categorias); padrão: Personal Trainer, Nutricionista, Fisioterapeuta, Psicólogo, Dermatologista, Esteticista, Massoterapeuta, Cabeleireiro, Manicure, Designer de sobrancelhas, Maquiador, Outros.
- Perfil no app: foto, selo verificado, registro, modalidade, cidade, avaliações, serviços com preço/promoção. Botões: AGENDAR (presencial, só se atende na cidade vista), AGENDAR ONLINE, WHATSAPP, INSTAGRAM, SITE, COMO CHEGAR.
- Painel: aprovar, rejeitar (exclui), suspender, verificar/tirar selo, filtros (pendentes, suspensos, online, verificados), vistas/cliques.
- **Quem confirma o agendamento é a equipe no painel** (profissionais ainda não têm login próprio — ver fila de espera).

---

## 11. Academias, empresas e parceiros ✅

- Coleção `empresas`: logo, capa, galeria (até 12), nome, categoria (`tipo`), cidade, bairro, endereço (Como chegar), horário, modalidades, planos, WhatsApp + 1ª mensagem, Instagram, site, benefício CK, descrição, agenda, `parceira`, `destaque`, `ativo`, `ordem`.
- App: aparece pela cidade (ou se marcada `online`), filtros por categoria, detalhe com benefício, serviços, avaliações e agendamento de visita/aula.
- Anunciantes/campanhas/financeiro continuam iguais.

---

## 12. Clube de vantagens (Clube CK) ✅

- Usa a coleção `parceiros` (mesmo cadastro, PIN separado em `pins`). Campos novos: `beneficio`, `cat`, `whats`, `insta`, `site`, `desc`, `livre`, `destaque`; cidade pode ficar vazia = todas as cidades.
- **Cupom livre** (`livre: true`): a aluna toca "Pegar meu cupom" no Clube CK (1 ativo por parceiro). Sem `livre`, o benefício continua sendo prêmio a cada N treinos (regra antiga mantida).
- Cupons do Clube têm `clube: true`. Validação na loja pelo PIN no servidor (`validar_cupom`), igual antes.
- Painel › Cupons: lista, busca, filtros, marcar usado/reativar, excluir, planilha.

---

## 13. Produtos, lojas e links externos ✅

- Coleção `produtos`: foto, nome, marca, categoria, tipo (próprio/parceiro/afiliado), preço, promoção, link, botão (COMPRAR/VER PRODUTO), descrição, destaque.
- **O link é aberto exatamente como foi colado** (mantém `?ref=`, `utm_` etc.). Aviso de afiliado no produto. **Sem checkout próprio, sem cobrança.**
- Links: endereço → Google Maps (sem chave), WhatsApp → `wa.me` com mensagem pronta (padrão "Olá! Encontrei vocês pelo CK Life e gostaria de saber mais.", configurável por cadastro), Instagram → perfil, site → site, produto → link de compra, serviço → agendamento, benefício → cupom.
- Painel: botão **Testar link** em todos os campos de link e na lista de produtos; colunas de vistas e cliques em comprar.
- Banners (`banners`): imagem, título, texto, local (explorar/início/loja/clube), destino (site, WhatsApp, Clube, ou um item: empresa/profissional/produto/parceiro), cidade, datas, ordem. Nunca na Comunidade.

---

## 14. Localização e mapas ✅

- "Minha cidade: X [Alterar]" no Explorar: escolher outra cidade como **Só ver agora** (temporário) ou **Mudar para esta** (grava). Sem GPS.
- Cidade vale para o presencial (empresas, profissionais presenciais, Clube, banners com cidade). Loja e atendimento online são nacionais.
- Mapa: link do Google Maps com endereço + cidade, sem chave de API.

---

## 15. Painel administrativo ✅

Tudo que já existia continua (Resumo, Métricas, Anunciantes + PDF, Campanhas, Financeiro, Alunas, Comunidade, Receitas, Exercícios, Avisos, Cidades, Segmentos, Admins, Configurações). Novo:

| Seção (id) | O que faz |
|---|---|
| Resumo (`resumo`) | + bloco Explorar: empresas ativas, profissionais ativos/pendentes, produtos, agendamentos aguardando |
| Métricas do Explorar (`explorarm`) | Vistas, cliques, taxa, cliques por ação, top itens por tipo, 7/30/90 dias, planilha |
| Empresas e academias (`empresas`) | CRUD completo + filtros + duplicar + vistas/cliques |
| Profissionais (`profissionais`) | CRUD ampliado + aprovar/rejeitar/suspender/verificar |
| Serviços (`servicos`) | CRUD ligado a profissional ou empresa, preço/promo/duração/modalidade |
| Agendamentos (`agendamentos`) | Lista com filtros (período, status, presencial/**acompanhamentos online**, busca), mudar status, nota para a aluna, WhatsApp com mensagem pronta, planilha |
| Avaliações (`avaliacoes`) | Denunciadas/ocultas/todas, ocultar/mostrar, manter (zera denúncias), excluir |
| Destaques (`destaques`) | Marcar destaque e ordem de empresas, profissionais, produtos e Clube |
| Clube CK (`parceiros`) | Cadastro antigo + benefício, categoria, contatos com Testar, cupom livre, destaque, "todas as cidades" |
| Cupons (`cupons`) | Lista, filtros, marcar usado/reativar, excluir, planilha |
| Loja e produtos (`produtos`) | CRUD + Testar link + métricas |
| Banners (`banners`) | CRUD por local/destino/cidade/datas/ordem + métricas |
| Categorias (`categorias`) | CRUD por grupo + "copiar padrão" |
| Módulo Ciclo (`ciclo`) | Só números gerais (RPC), texto das regras de privacidade |
| Admins | Papéis prontos: **Super Admin** (total), **Administrador** (edita tudo, só vê Admins/Config), **Operador** (edita agendamentos, avaliações, comunidade, cupons; vê o resto; sem financeiro/ciclo/admins/config) |

Filtro de conteúdo (`PROIBIDO`) bloqueia ao salvar: resultado garantido, "perca X kg", "X kg em Y dias", cura/curar, 100% eficaz, sem efeitos colaterais, milagre, diagnóstico automático.

---

## 16. Notificações e lembretes 🟡

- Lembrete de treino: .ics semanal (funciona com app fechado) + aviso com app aberto.
- Meu Ciclo: lembrete discreto opcional, só com app aberto.
- Chat: badge de novas mensagens no app.
- **Push com app fechado** ⬜ (service worker + VAPID + servidor) — fila de espera.

---

## 17. Funcionalidades prontas ✅

Tudo da seção 2. As partes que dependem das tabelas novas (agendamentos, avaliações, Meu Ciclo, chat, leitura do catálogo pelas alunas, imagens no bucket, permissões por área no banco) **já estão no ar no código**, e já funcionam no site real (banco ativado e testado em 23/10).

**Testes feitos em 23/10 (demonstração e banco simulado com/sem tabelas):** agendar (4 passos), horário ocupado bloqueado, status pelo painel, avaliação com selo, denúncia, moderação, favoritos, cupom livre, links (WhatsApp, mapa, afiliado com utm preservado), busca, filtros, cidade, Meu Ciclo (ativar, atraso, registrar, check-in, adaptar, caminhada, ajustar sem perder histórico), chat, perfil público, CRUDs do painel (criar, validar, filtro de promessas, testar link, desativar, duplicar, excluir, aprovar, verificar), papéis. Regressão: login/cadastro na nuvem, treino completo, feed (post/curtida/comentário), receitas, perfil. Layout sem nada fora da tela em 320/375/1366 px; contraste ok no modo escuro.

## 18. Funcionalidades parciais 🟡

- **Premium/Kiwify:** webhook pronto, falta link e variáveis (BLOQUEADO PELO USUÁRIO).
- **Fotos das receitas:** 93 de 197 (BLOQUEADO PELO USUÁRIO).
- **Catálogo real:** o site real começa vazio (exemplos só na demonstração). Cadastrar no painel.
- **Notificações push** com app fechado: não existe.

## 19. Funcionalidades a implementar ⬜

- Login próprio para profissionais/empresas confirmarem a agenda e autocadastro (com aprovação) — hoje a equipe confirma pelo painel.
- Pagamento de agendamentos/PIX/checkout — só com autorização.
- Push com app fechado.
- Seguidores, desafios, denúncia de post/mensagem, bloqueio no servidor (hoje é do lado de quem bloqueia).
- Lista de espera/horários por profissional com várias agendas, fuso horário por cidade.
- Paginação do catálogo quando crescer (hoje `colecoes` é lido inteiro ao abrir).

## 20. Bugs e limitações conhecidas

- **Fotos (corrigido 23/10):** listas e cartões usam miniaturas leves em `img/p/` (geradas pelo `miniaturas.py` no `build.py`, recorte quadrado automático na pessoa + ajustes manuais em `AJUSTE`). Fotos só aparecem depois de carregar inteiras (classe `ok`), e o ícone/foto de reserva some quando a foto carrega. Foto nova de receita/exercício: basta salvar em `img/` e rodar o `build.py` (gera a miniatura). Transições sem esmaecer.

- Permissões por área: com o `expansao.sql`, o banco passa a conferir "editar" por área (`admin_pode`). Ler continua liberado para qualquer admin.
- Agendamento: a regra "1 horário = 1 pessoa" é conferida na hora de escolher (RPC `horarios_ocupados`), não há trava no banco contra duas reservas simultâneas no mesmo segundo.
- Chat: sem tempo real (consulta a cada 4 s); bloquear é só do lado de quem bloqueia.
- Demonstração (`fitverde.html`) sem charset: para testar localmente use `teste.html` (senão os acentos dos exemplos ficam errados no localStorage).
- Downloads não funcionam dentro do visualizador do claude.ai (no site real funcionam).
- `app.old.js`, `app.old.css`, `boneco3d.js` não são usados.

## 21. Arquivos importantes

**Cópia segura:** GitHub `Tiagoroity/CKlife` (público). Site na raiz; código em `fonte/`.

| Arquivo | Para que serve |
|---|---|
| `src/shell.html` | Esqueleto e telas (inclui `#t-explorar`) |
| `src/app.css` | Visual (bloco "Expansão" no fim: classes `xp-*` e `xf-*`) |
| `src/app.js` | App da aluna (abas, `NAV`, ganchos `xpInicio`, `perfilXP`, `chatBotao`, autor clicável) |
| `src/expansao.js` | **Novo.** Explorar, agenda, avaliações, favoritos, loja, Clube, cidade, Meu Ciclo, chat, camada `XP` |
| `src/admin.js` | Painel original |
| `src/admin-xp.js` | **Novo.** Construtor `crud`, módulos novos, papéis, Clube ampliado |
| `src/nuvem.js` | Supabase (+ coleções novas em `LISTAS`, `N.subirImg`) |
| `build.py` | Monta tudo (marcadores `/*EXPANSAO*/` e `/*ADMINXP*/`) |
| `ck-life/banco-de-dados.sql`, `comunidade.sql` | Banco (já rodados) |
| `ck-life/expansao.sql` (= `fonte/expansao.sql`) | **Banco da expansão, pronto para rodar** |
| `mock-supabase.js` + `mk-teste-nuvem.py` → `teste-nuvem.html` | Testar a nuvem sem banco real. `localStorage.MOCKEXP="1"` simula o `expansao.sql` rodado; sem ele, simula as tabelas ausentes |
| `chk.sh`, `audit.js`, `contraste.js` | Sintaxe, layout (`AUD`), contraste (`CONTR`) |
| `ck-life/site/` | Site publicado (index, img, manifest, api/kiwify-webhook.js, vercel.json) |

## 22. Tecnologias e dependências

- HTML, CSS e JavaScript puros (sem framework e sem npm no app).
- Python 3 para o `build.py`.
- **Supabase:** Auth, Postgres com RLS, Storage. Biblioteca `@supabase/supabase-js@2.49.4` (jsDelivr).
- **jsPDF 2.5.1** (cdnjs), carregado só quando o admin gera o PDF.
- **Vercel:** site estático mais a função `api/kiwify-webhook.js` (Node 18+).
- **GitHub:** repositório `Tiagoroity/CKlife`, push por HTTPS com credencial no Keychain do Mac (`osxkeychain`).
- **Recursos do navegador:** Web Speech API (voz), Web Audio (sons), Canvas (cartão, confete, compressão de foto), WakeLock, Notification, PWA manifest.

## 23. Variáveis de ambiente e configurações (sem segredos)

### No site (`/*CONFIG*/` dentro de `build.py`, função `cfg`)

- `SUPABASE_URL`: `https://psxmyiudtuozasbqzvnu.supabase.co`.
- `SUPABASE_ANON_KEY`: chave pública "anon" (pode ficar no site; está no `build.py`).
- `KIWIFY_URL`: link do checkout do Premium. **Vazio, o dono precisa enviar.**
- `SUPORTE`: contato de suporte (opcional, também configurável no painel).

### Na Vercel (Settings → Environment Variables), para o webhook da Kiwify ⬜ ainda não configurado

- `SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: **secreta**. Só vai na Vercel, nunca no site nem no chat.
- `WEBHOOK_CHAVE`: senha inventada.
- Na Kiwify, a URL do webhook fica `https://cklife.vercel.app/api/kiwify-webhook?chave=<WEBHOOK_CHAVE>`.
- Teste: abrir `https://cklife.vercel.app/api/kiwify-webhook` deve mostrar `configurado: true`.

### No painel → Configurações

Nome do app, checkout, suporte, treinos para cupom, preço do Premium e frequência dos anúncios.

### Supabase → Authentication → URL Configuration

O Site URL e os Redirect URLs precisam incluir `https://cklife.vercel.app`.

## 24. O que NÃO pode ser perdido

### Regras do dono (valem sempre)

- NÃO remover funcionalidades existentes.
- NÃO recriar o que já funciona.
- NÃO destruir o feed, a comunidade nem os posts.
- NÃO fazer alterações destrutivas no banco: só `create … if not exists`, `create or replace`, `drop policy if exists` + `create policy`.
- Dados de ciclo, peso, sintomas e saúde nunca são compartilhados automaticamente e nunca são usados para anúncio, marketplace, segmentação, afiliados ou parceiros.
- O admin não navega por dados íntimos individuais.
- Aluna comum não acessa o admin. A permissão é validada no servidor (RLS e `e_admin()`), não só escondendo botões.
- NÃO criar cobrança nova nem checkout próprio sem autorização.
- Não permitir promessa de emagrecimento garantido, de cura, diagnóstico automático nem alegação médica enganosa.

### Segurança no chat

- O agente nunca digita senhas ou tokens.
- Se o dono colar uma senha ou chave por engano, não repetir e orientar a trocar.
- A service_role key vai só na Vercel.

### Como publicar (passo a passo do agente)

1. Editar `src/*`.
2. Rodar `./chk.sh` (sintaxe) e `python3 build.py`.
3. Testar no navegador em `http://localhost:8765/teste.html` (não use `fitverde.html` localmente: sem charset, estraga os acentos). Rodar `AUD()` em 320, 375 e 1366 px, `CONTR()` no modo escuro, e testar o modo nuvem com `python3 mk-teste-nuvem.py` → `teste-nuvem.html`.
4. Copiar `ck-life/site/index.html` (e o `manifest`, `img` novas se houver) para `repo/`. Copiar `src/`, `build.py` e os SQLs para `repo/fonte/`.
5. `git -C repo add -A && git commit` com a mensagem terminando em `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, depois `git push`.
6. Esperar a Vercel: abrir https://cklife.vercel.app e conferir a mudança no ar.
7. Publicar a demonstração: ferramenta Artifact com `fitverde.html`, mesmo endereço `https://claude.ai/artifact/FYyAokNvw9kzNDTprzkKPd`.

### Fotos das receitas

- **Prontas:** 93 de 197 (lotes 1 a 9), em `img/receita-r<N>.jpg`.
- **Faltam:** lotes 10 a 20, 107 fotos, a partir da nº 91 "Escondidinho de abóbora com carne seca".
- **Fonte:** os pedidos estão em `~/Downloads/fotos-ck-life/PEDIDOS-RECEITAS.txt` e a ordem em `ordem-receitas.json`.
- **Processo:**
  - O dono cria as imagens e salva em `~/Downloads` (ou em `~/Downloads/fotos-ck-life`) com nomes como `91_Escondidinho_de_....png`.
  - O agente converte para JPEG, salva como `img/receita-<id>.jpg` (o id vem de `ordem-receitas.json` na posição N−1) e publica.

### Pendências que dependem do dono

Ver "Fila de espera" na seção 25.

## 25. Próximos passos recomendados

### A. Tiago precisa fazer (PENDÊNCIAS QUE PRECISAM DO TIAGO)
1. ~~Rodar `expansao.sql`~~ ✅ feito em 23/10.
2. Cadastrar no painel as empresas, profissionais, serviços, produtos, banners e benefícios reais.
3. Kiwify: link do checkout + 3 variáveis na Vercel + URL do webhook.
4. Fotos das receitas, lotes 10 a 20 (107), e dos 8 exercícios sem foto.
5. Decidir o preço do Premium (hoje R$ 19,90).
6. Decidir se quer: login para profissionais, pagamento de agendamentos, push com app fechado (envolvem custo/decisão).

### B. O agente pode fazer depois
1. ✅ Teste real feito pelo Tiago em 23/10: cadastro de profissional e serviço no painel, agendamento, status, avaliação — tudo funcionou.
2. Denúncia de post/mensagem, bloqueio no servidor, seguidores e desafios.
3. Trava no banco contra reserva dupla do mesmo horário.
4. Paginação do catálogo.
5. Atualizar este documento a cada fase.

---

## COMANDO PARA CONTINUAR O CK LIFE EM UMA NOVA SESSÃO

Copie e cole tudo abaixo numa nova sessão do Claude Code:

```
Você vai continuar o desenvolvimento do CK Life, meu app de treino em casa para mulheres. Eu não sou programador: fale comigo em português, simples, com passo a passo de cliques. Faça sozinho tudo o que der, publique ao fim de cada fase e coloque numa "fila de espera" o que depender de mim.

1) Pegue o projeto no GitHub: o repositório é Tiagoroity/CKlife (branch main). Clone numa pasta de trabalho (ex.: ~/Projetos/ck-life/repo). O site sai da raiz do repo (Vercel publica sozinho a cada push) e o código-fonte fica em repo/fonte (src/, build.py, SQLs). Monte a pasta de trabalho assim: copie repo/fonte/src, repo/fonte/build.py e os .sql para a pasta de trabalho (os SQL em ck-life/), e copie repo/img para ck-life/site/img. Rode python3 build.py para gerar ck-life/site/index.html e fitverde.html.

2) ANTES DE QUALQUER COISA leia inteiro o arquivo repo/fonte/CK-LIFE-CONTEXTO-MESTRE.md. Ele tem a arquitetura, o banco, as regras que não podem ser quebradas, como publicar, o que está pronto, o que falta e a fila de espera.

3) Regras que valem sempre: não remover nem recriar nada que já funciona; não destruir feed/comunidade/posts; banco só com mudanças que adicionam (nada destrutivo); dados de ciclo, peso e saúde nunca compartilhados nem usados para anúncio/parceiros; admin não vê dados íntimos individuais; permissão validada no banco (RLS), não só escondendo botão; nenhuma cobrança ou checkout novo sem eu autorizar; nunca digite nem repita senhas ou chaves.

4) Site: https://cklife.vercel.app (alunas) e /admin (painel). Banco: Supabase, projeto psxmyiudtuozasbqzvnu. Demonstração: atualizar o artifact https://claude.ai/artifact/FYyAokNvw9kzNDTprzkKPd com o fitverde.html.

5) A GRANDE EXPANSÃO já foi implementada e publicada (commit 8b9235f): navegação em 5 áreas, Explorar, agendamentos, avaliações, favoritos, Clube CK, loja, banners, métricas, Meu Ciclo, chat e módulos do painel. O expansao.sql já foi rodado no Supabase e o teste real passou. Siga a seção 25-B do documento mestre e atualize o documento ao final de cada fase.
```

---

## REDE SOCIAL (23/10/2026) — NO AR, aguardando o banco

**App publicado** com a rede social ligada de forma segura: enquanto o `social.sql` não existir no Supabase, a Comunidade continua no modo antigo (feed, curtidas, comentários) e os botões novos avisam "A rede social está sendo ativada". Assim que o banco existir, liga sozinha (`detectaSocial()` testa a tabela `perfis`).
⚠️ Até rodar o banco, o chat fica indisponível (o chat antigo foi substituído pelo novo).

**Banco:** `fonte/social.sql` ou, em partes, `fonte/social-partes/social-parte1..5.sql` (rodar na ordem). 87 testes de segurança passando em Postgres local (`fonte/testes-banco/rodar.sh`, que aplica as 5 partes e roda `testes.sql`).

**App (`src/social.js`, marcador `/*SOCIAL*/` no app.js):**
- Perfil social (`abrirPerfil`, `editarPerfil`): capa, foto, nome, @ único (checagem ao vivo), bio, cidade/objetivo opcionais, interesses, privado, quem manda mensagem, mostrar conquistas; publicações/seguidoras/seguindo (contagem no banco), pedidos para seguir, salvos, compartilhar perfil (`?u=username`).
- Seguir/deixar de seguir/solicitar/aceitar/recusar, bloquear (no banco), denunciar (perfil, post, comentário, Story, mensagem).
- Feed: abas Para você/Seguindo, paginação infinita (12 por vez), boas-vindas, salvar, compartilhar (interno para amiga; externo só do próprio post), fotos novas no bucket privado.
- Stories 24h: criar com texto/cor, visualizador com barras, visto/não visto, quem viu, excluir, denunciar/bloquear, responder → chat.
- Chat: texto, foto, áudio (MediaRecorder), responder, apagar para mim/para as duas, denunciar, silenciar, status com corações (enviada/entregue/lida), não lidas, tempo real (Supabase Realtime) + plano B a cada 20 s.
- Notificações: central (Todas/Interações/Mensagens/Conquistas), avisos discretos no topo, badges.
- Conquistas (1/10/25/50/100/200 treinos; 3/7/15/30/60 dias): celebração com Postar/Compartilhar (cartão 1080x1350, @ opcional, share nativo)/Continuar; quem já tinha histórico não recebe festa retroativa.
- Painel: seção **Denúncias** (`moderacao`): lista, análise só do conteúdo denunciado (`denuncia_conteudo`), ocultar/restaurar/suspender/reativar/resolver/descartar (`moderar`) e histórico.

**Testado:** demonstração (sem rede social) e banco simulado (`mock-supabase.js` com `localStorage.MOCKEXP=1` e `MOCKSOCIAL=1`) com duas contas: perfil, @, editar, seguir, Story (ver, visto, responder), post com foto privada, chat texto+foto, entregue/lida, contadores, notificações. Áudio: código pronto, gravação real depende do microfone do aparelho (não testável aqui).

**Limitações (sem promessa falsa):** PWA no navegador não bloqueia nem detecta print/gravação de tela — não implementado; vídeo em Stories fica para depois; fotos antigas da comunidade seguem no bucket público `posts`; arquivos de Stories vencidos ficam inacessíveis pelo banco mas não são apagados automaticamente.

**Próximos passos:** (1) Tiago roda as 5 partes; (2) testar no site real com duas contas; (3) migrar fotos antigas do bucket `posts` para o privado; (4) limpeza automática de mídia de Stories vencidos; (5) vídeo em Stories.

## SEGURANÇA & PRIVACIDADE (23/10/2026)
- Banco: `fonte/sql/seguranca.sql` (ou partes 1–5, rodar na ordem). Só adiciona; pode rodar mais de uma vez.
  - seguranca_config (idade_minima 18, idade_validada, mfa_admin_obrigatorio, prazo_lgpd_dias 15, prazo_anpd_dias_uteis 3, encarregado, plataforma).
  - auditoria só-inserção via auditar(); trigger impede editar/apagar. Mudanças de admins auditadas; nunca remove o último acesso total.
  - alunas.situacao (ativa/suspensa/bloqueada/em_exclusao/excluida); idade mínima conferida no cadastro (autodeclaração).
  - documentos versionados (publicado é imutável; publicar arquiva a anterior; novo_aceite pede aceite no app).
  - consentimentos só-inserção + view consentimentos_atuais.
  - solicitacoes LGPD (protocolo CK-AAAAMMDD-XXXXXX, prazo, histórico) + exportar_meus_dados() + executar_eliminacao() (apaga/anonimiza; falta apagar o login no Supabase manualmente).
  - incidentes (INC-…, nunca apagados, avaliação de comunicação ANPD com prazo em dias úteis).
  - retencao / inventario / ripd com "VALIDAÇÃO JURÍDICA NECESSÁRIA".
  - denúncias com prioridade automática e acesso ao conteúdo registrado; limites contra abuso (posts, comentários, mensagens, curtidas, seguir).
  - admin_pode() exige 2 etapas (aal2) quando mfa_admin_obrigatorio = true.
- Testes: testes-banco/testes_seguranca.sql (papéis A, B, C, ADMIN, MODERADOR, SUPORTE, PRIVACIDADE). 142 OK, 0 falhas.
- Painel: src/admin-seg.js → seção "Segurança & Privacidade" (18 sub-abas). Papéis prontos: Super Admin, Administrador, Operador, Moderador, Suporte, Privacidade/LGPD.
- App: src/meus-dados.js → Perfil › Privacidade › "Privacidade e meus dados" (documentos, baixar meus dados, pedidos com protocolo, autorizações, sair de todos os aparelhos). Meu Ciclo registra consentimento.
- Limites reais: PWA não bloqueia nem detecta print; lista de aparelhos e falhas de login só nos logs do Supabase; limpeza de arquivos órfãos precisa da chave de serviço.
- Pendências jurídicas: idade mínima, prazos de retenção, bases legais, textos de Termos/Privacidade, decisão sobre comunicação de incidentes.

## EXPERIÊNCIA PREMIUM (23/10/2026)
- src/experiencia.js: Início "Meu dia" (saudação contextual, check-in de humor/energia guardado SÓ no aparelho, Meu Ritmo 0–100 de consistência pessoal, sequência com marcos 3/7/15/30/50/100, card de recuperação quando energia baixa — sugere, não troca o treino; "Você estava vendo" do Explorar).
- Desafios pessoais 7/21/30 dias (Treinos › Programas), sem ranking nem contagem de participantes (não temos número real ainda).
- Momentos: "CK Moment" na celebração, novas conquistas (30 treinos, 50 e 100 dias), aniversário de jornada, botão "Adicionar aos Stories" (Story gerado automaticamente) na conquista e no fim do treino.
- Perfil: Minha Jornada (linha do tempo) e coleção de conquistas (bloqueadas/desbloqueadas).
- Comunidade: frase contextual na caixa de publicar. Explorar: sugestões de busca.
- src/figurinhas.js: no chat, painel de emojis (com recentes), figurinhas CK (treino, humor, amigas), "Minhas" figurinhas criadas com foto (guardadas no aparelho), filtros de foto (Natural, Glow, Rosado, Dourado, Suave, Vivo, P&B) no chat, Stories e posts. Figurinha vai como PNG e aparece sem balão.
- Admin: menu agrupado em Métricas, Usuárias, Social e moderação, Conteúdo, Comercial, Proteção, Configurações.
- Pendentes: maquiagem virtual com detecção de rosto (precisa biblioteca de IA de rosto), grupos da comunidade, vídeo, notificações push.

## NOVIDADES (23/10/2026)
- Banco: fonte/sql/novidades.sql (partes 1–3). Grupos (grupos, membros_grupo, posts.grupo_id, grupos_info), vídeo no bucket social (50 MB, mp4/webm/mov), figurinhas (só a dona), humor_diario (só a dona; admin não lê), desafio_participantes + desafio_contagem (só totais), push_inscricoes + push_fila (privada) + push_pegar/push_expirou (código de uso único) + gatilho em notificacoes usando pg_net → https://cklife.vercel.app/api/push.
- Testes: testes-banco/testes_novidades.sql. Total 172 OK, 0 falhas.
- Vercel: api/push.js (web-push). Precisa da variável VAPID_PRIVATE (chave entregue ao Tiago em arquivo local; NÃO está no GitHub). Chave pública fica no app (src/novidades.js) e na função.
- sw.js na raiz: só notificações (sem cache).
- App: src/novidades.js (grupos na Comunidade, vídeo em posts/Stories, avisos no celular em Perfil, contagem real dos desafios, figurinhas e humor sincronizados). Maquiagem virtual (batom/blush) em src/figurinhas.js com MediaPipe Face Landmarker carregado do jsDelivr na hora (a foto não sai do aparelho).
- Correção da foto de perfil: seletor de arquivo agora fica no documento (iPhone perdia a foto); recorte prioriza o rosto; perfis de outras alunas atualizam a cada 3 min.
- Admin: seção Grupos (Social e moderação).
