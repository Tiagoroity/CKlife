# CK LIFE · DOCUMENTO MESTRE DO PROJETO

> Atualizado em 23/10/2026. Este documento resume tudo o que foi construído até agora, para que qualquer pessoa ou agente continue o trabalho sem reler a conversa.
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
| Primeiro acesso | Questionário de 7 passos (objetivo, itens de casa, nível, tempo, dias, medidas) que recomenda um programa |
| Início | Saudação, treino de hoje, anel de calorias, água (+1 copo), checklist "primeiros passos", meta semanal, frase e dica do dia, receita do dia, card para instalar o app |
| Treinos | Programas de várias semanas, treinos rápidos, biblioteca de exercícios com busca e filtro por músculo |
| Player de treino | Foto do exercício, contagem regressiva, descanso, voz da treinadora, bipes e sino, "A seguir", tempo total, confete, recorde, cartão de conquista para compartilhar, postar na comunidade |
| Nutrição | 197 receitas (café, almoço e jantar, saladas, sopas, lanches, sobremesas fit), cardápio automático, diário "Meu dia", metas de calorias e proteína, modo cozinha com voz e timer |
| Evolução | Calendário de treinos, sequência de dias, recorde, "Este mês", medalhas, gráfico de peso, medidas |
| Perfil | Foto de perfil, nível (Começando → Imparável), estatísticas, Premium, dados, plano, objetivo, treino em casa, metas, peso, lembrete, voz, sons, tema claro ou escuro, cupons, profissionais (lista simples), convidar amiga, suporte, sair |
| Comunidade ("Juntas") | Feed com texto e foto, curtir (também com dois toques), comentários, apagar o que é seu, bolinha vermelha de novidade, atualização a cada 25 s |
| Anúncios | Pop-up de campanhas segmentadas por cidade, idade e gênero, com frequência configurável. Quem é Premium não vê. Mede visualizações e cliques |
| Cupons | A cada N treinos (padrão 8) a aluna ganha um cupom de loja parceira. A loja valida com PIN |
| Lembretes | Arquivo de calendário (.ics) semanal com alarme, mais aviso do navegador enquanto o app está aberto |
| Instalar | Funciona como app (PWA): manifest, ícones, instruções para iPhone e aviso para quem abriu pelo navegador do Instagram ou WhatsApp |
| Computador | Layout próprio a partir de 1024 px, com menu lateral |
| Painel admin | Ver seção 15 |
| Relatório PDF | Relatório do anunciante gerado dentro do painel, com logo, números e gráfico |
| Premium (Kiwify) | O webhook já existe no código, mas falta configurar (seção 23) |

---

## 3. Telas existentes

### App da aluna

O app é um arquivo `index.html` só, com telas que aparecem e somem.

- `#splash`: tela de carregamento.
- Login e cadastro: `.lhero`, com foto, abas Entrar e Criar conta, e esqueci a senha.
- Nova senha: chega pelo link do e-mail, `#type=recovery`.
- Onboarding: `#v-onb`, 7 perguntas.
- Conta bloqueada: `#v-bloq`.
- App: `#v-app`.
  - **Topo:** logo, chip de sequência 🔥, avatar `#top-av` que abre o Perfil, e botão do painel (só admin).
  - **Abas:** são 6 hoje.

    | Código | Nome na tela |
    |---|---|
    | `inicio` | Início |
    | `treinar` | Treinos |
    | `juntas` | Juntas |
    | `dieta` | Nutrição |
    | `evolucao` | Evolução |
    | `perfil` | Perfil |

    O painel de cada aba é `<section id="t-...">`.
  - **Folha:** `#sheet`, uma tela por cima usada para detalhes, formulários e comentários.
  - **Player de treino:** `#play`.
  - **Modo cozinha:** `#cook`.
  - **Anúncio:** `#ad`.

### Painel admin (`/admin` ou `#admin`)

- Login de admin próprio. Se ainda não houver admin, existe o fluxo "virar primeiro admin".
- Cabeçalho: `.adm-brand`, abas `#adm-tabs` agrupadas (menu lateral no computador) e `.adm-user`.
- Conteúdo em `#adm-main`. Os formulários abrem em `#modal`.

---

## 4. Estrutura e arquitetura

### Página única

- HTML, CSS e JS puros, sem framework.
- Tudo é montado em um único `index.html` pelo `build.py`.

### Montagem (`build.py`)

`src/shell.html` tem marcadores que são trocados pelos arquivos:

| Marcador | Arquivo |
|---|---|
| `/*CSS*/` | `app.css` |
| `/*DATA*/` | `receitas1-4.js`, `treinos.js`, `casa.js` |
| `/*CONFIG*/` | configuração (Supabase e Kiwify) |
| `<!--SUPABASE-->` | script do supabase-js |
| `/*NUVEM*/` | `nuvem.js` |
| `/*SONS*/` | `sons.js` |
| `/*BONECO*/` | `boneco.js` |
| `/*FOTOS*/` | `fotos.js` |
| `/*APP*/` | `app.js` |
| `/*ADMIN*/` | `admin.js` |

O `build.py` gera três arquivos:

1. `fitverde.html` e `teste.html`: demonstração sem banco, usando localStorage.
2. `ck-life/site/index.html`: o site de verdade, com Supabase, manifest e meta tags da Apple.
3. Copia `ck-life/site/img` para `./img`, para a demonstração local.

### Organização do código

- **`app.js`:** fica todo dentro de uma IIFE `(function(){ ... })();`.
  - Termina com `window.FV = {...}`, que expõe funções para o painel, e com `iniciar()`.
  - **Módulos novos precisam ficar DENTRO dessa IIFE**, por exemplo inseridos antes de `const TABS`.
- **`admin.js`:** outra IIFE. Usa `window.FV` (abreviado como `F`) e expõe `window.ADMIN = { abrir }`.

### Dados

- Objeto global `DB`, com `users`, `cidades`, `segmentos`, `anunciantes`, `campanhas`, `pagamentos`, `profissionais`, `parceiros`, `cupons`, `avisos`, `receitasExtras`, `receitasOcultas`, `exercExtras`, `eventos`, `acessos`, `config` e `freq`.
- `ME` é a aluna logada, um item de `DB.users`.
- `save()`:
  - Na nuvem chama `NUVEM.salvar(DB)`, que espera 700 ms e grava só o que mudou.
  - No modo demonstração grava em localStorage, na chave `cklife_db_v1`.
- **Modo nuvem** (`window.NUVEM.ativo`):
  - `nuvem.js` carrega do Supabase e converte linhas em objetos.
  - Ao gravar, compara com uma "foto" do último estado e envia só as diferenças.
  - Se a gravação falhar, tenta de novo em 4 s.
  - Grava também ao fechar ou esconder a página.
  - Ao abrir, tenta carregar até 3 vezes.
- **Modo demonstração:** `semente()` cria dados de exemplo (24 alunas, campanhas, eventos etc.).

### Helpers importantes em `app.js`

- **Formatação e datas:** `$`, `esc`, `int`, `brD` (data BR), `today()`, `addD`, `uid()`, `norm`.
- **Interface:** `toast`, `sheet(title, html)`, `fecharSheet`, `ic(nome, tamanho)` (ícones SVG do objeto `P`), `capa(titulo, sub, extra, foto)`, `setRow`, `sw`, `ring`.
- **Sons e voz:** `SOM.*` (sons), `falar()` e `calar()` (voz).
- **Treinos:** `treinoDoDia`, `montaTreino`, `treinoRapido`, `QUICK`, `abrirTreinoPreview`, `iniciaTreino`.
- **Outros:**
  - `streak()`, `diasTreino()`, `metas()`, `isPremium()`.
  - `darCupom()`, `linkCamp()`, `mostrarAnuncio()`.
  - `rInicio`, `rTreinar`, `rDieta`, `rEvolucao`, `rPerfil`, `rJuntas`.
  - `tab(t)`, `rerender()`.
- **Comunidade:** objeto `CM` com `carregar`, `publicar`, `curtir`, `comentar`, `apagaPost`, `apagaComent`, `ocultar` e `ultimo`.

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

### `expansao.sql` 🟡 RASCUNHO (ainda NÃO foi rodado)

Arquivo escrito para a grande expansão, salvo em `repo/fonte/expansao-RASCUNHO.sql`. Ele é só aditivo e contém:

- Novas coleções liberadas na leitura: `empresas`, `servicos`, `produtos`, `banners`, `categorias`.
- Tabela `agendamentos`: status `solicitado`, `confirmado`, `concluido`, `cancelado` ou `faltou`.
  - O trigger `protege_agendamento` faz o seguinte:
    - Na criação, a aluna só cria com status "solicitado".
    - Depois disso, ela só pode mudar para "cancelado".
    - O admin muda qualquer coisa.
- Tabela `avaliacoes`: notas de 1 a 5, uma por aluna em cada alvo.
  - Fica marcada como `verificada` quando existe um agendamento concluído.
  - Tem campos `oculta` e `denuncias`, e a função `denunciar_avaliacao`.
  - Empresa ou profissional não edita avaliação.
- Tabela `ciclo`, com dados sensíveis:
  - Só a dona lê e grava (`ciclo_dono`).
  - O admin vê apenas números gerais, pela função `ciclo_resumo()`.
- Tabelas `conversas` e `mensagens` (chat 1 a 1): só as duas participantes leem. O trigger `atualiza_conversa` guarda a última mensagem.

**Antes de rodar, corrigir no rascunho:**

1. Remover a linha `insert into public.colecoes ... 'Barra do Garças'`. Foi um exemplo e não deve ir para o banco.
2. A tabela `cliques` pode sair. A ideia final é reaproveitar a tabela `eventos` já existente, com `t` = imp ou clk e `c` = `"x:<tipo>:<id>:<ação>"`, por exemplo `x:emp:abc:whats`. Isso evita tabela nova e as métricas das campanhas continuam iguais, porque os ids de campanha não começam com `x:`.
3. Conferir que `pode_postar()` já existe (o rascunho recria igual, sem problema).

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
| Feed (aba "Juntas") com texto e foto (comprimida antes de enviar) | ✅ |
| Curtir e descurtir, dois toques na foto, animação | ✅ |
| Comentários (folha de comentários), apagar o próprio | ✅ |
| Nome e foto de perfil da autora em posts e comentários | ✅ |
| Apagar o próprio post | ✅ |
| Moderação no painel (ocultar, mostrar, excluir post e comentário) | ✅ |
| Aviso de novidade (bolinha na aba) e atualização a cada 25 s | ✅ |
| Postar o cartão de conquista do treino | ✅ (a aluna escolhe postar) |
| **Seguidores** | ⬜ não existe |
| **Conversas / chat privado** | ⬜ não existe. Só o SQL do rascunho. A especificação dizia "não destruir o chat", mas ele nunca foi criado |
| Perfil público da aluna | ⬜ |
| Denunciar post | ⬜ (só a moderação do admin) |
| Compartilhar sequência ou desafio | 🟡 o cartão de conquista existe, desafios não |

**Regra:** nunca compartilhar automaticamente ciclo, peso, sintomas ou dados de saúde. Nada de anúncios dentro da comunidade.

---

## 9. Ciclo menstrual ("Meu Ciclo") ⬜ NÃO IMPLEMENTADO

Só existe a tabela `ciclo` no rascunho SQL. Regras definidas pelo dono, que precisam ser seguidas:

- **Ativação:**
  - Opcional, a aluna precisa escolher ativar.
  - Fica fora do menu principal (entrada pelo Perfil e por um card na Início que ela pode esconder).
- **Configuração:** data da última menstruação, duração da menstruação, duração do ciclo e ciclo regular, irregular ou "não sei".
- **Previsões:** sempre como **estimativa, com faixa de dias**, nunca como certeza.
  - Próxima menstruação: último início + média do ciclo, ± 2 dias (regular), ± 3 (não sei) ou ± 5 (irregular).
  - Ovulação: próxima menstruação − 14, ± 2.
  - Janela fértil: ovulação − 5 até ovulação + 1.
  - Fases: menstrual, folicular, ovulatória e lútea.
  - Com 2 ou mais ciclos registrados, usar a média real.
- **Atraso:** mostrar "Sua menstruação ainda não foi registrada. Está X dias além da previsão." com as ações:
  - registrar menstruação;
  - atualizar ciclo;
  - entender possíveis motivos.
  - **Nunca falar em diagnóstico de gravidez.**
- **Aviso fixo:** "Não é método contraceptivo."
- **Conteúdo educativo** por fase.
- **Check-in diário "Como você está hoje?":** fluxo, sintomas, humor, energia, sono e anotações.
- **Botão "ADAPTAR TREINO DE HOJE":**
  - Opções: manter, mais leve, mobilidade, caminhada ou descanso.
  - **A aluna decide.** Nada de regra simplista do tipo "menstruada = não treina".
  - Pode usar os treinos rápidos existentes, por exemplo "Alongamento" como mobilidade.
- **Notificações:** opcionais e discretas, sem palavras íntimas na notificação.
- **Histórico e padrões:** só mostrar quando houver dados suficientes.
- **Privacidade (obrigatória):**
  - Dados só da própria aluna, na tabela `ciclo`, **nunca dentro de `alunas.dados`**, porque o admin lê essa tabela.
  - Proibido usar para publicidade, marketplace, segmentação, afiliados ou parceiros.
  - Nada vai para academias, empresas, profissionais, outras alunas ou anunciantes.
  - O admin vê apenas números gerais.
  - No modo demonstração, guardar em localStorage separado.

---

## 10. Marketplace de profissionais 🟡

**Hoje:**

- Coleção `profissionais` com os campos `nome`, `tipo`, `whats`, `valor`, `desc`, `ordem`, `ativo` e `foto`.
- Tipos disponíveis no formulário: Personal trainer, Nutricionista, Fisioterapeuta, Educador físico.
- Aparece no fim do Perfil como lista com botão de WhatsApp. O admin cadastra.

**Pedido (ainda não feito):**

- **Categorias:**
  - Personal Trainer, Nutricionista, Fisioterapeuta, Psicólogo, Dermatologista, Esteticista.
  - Massoterapeuta, Cabeleireiro, Manicure, Designer de sobrancelhas, Maquiador, Outros.
  - Devem ser gerenciáveis no painel, não fixas no código.
- **Atendimento:** presencial, online ou ambos.
- **Dados do perfil:**
  - cidade, endereço;
  - registro profissional (CREF, CRN…);
  - serviços com preço;
  - selo "verificado", destaque;
  - status: ativo, pendente ou suspenso.
- **Botões:** AGENDAR, AGENDAR ONLINE, WHATSAPP, INSTAGRAM, SITE, COMO CHEGAR.
- **Agenda:** horários (dias, início, fim, intervalo).
- **Fluxo de agendamento:** profissional → serviço → data → horário → revisão → confirmação.
- **Status do agendamento:** Solicitado, Confirmado, Concluído, Cancelado, Não compareceu.
- **"Meus Agendamentos" no Perfil:** Próximos, Concluídos e Cancelados.
- **Avaliações:** 1 a 5 estrelas e comentário.
  - Selo "Serviço realizado" quando houver agendamento concluído.
  - "Denunciar avaliação".
  - O profissional não edita avaliação.
- **Monetização:** sem cobrança agora, só preparar o terreno.

---

## 11. Academias, empresas e parceiros

- **Parceiros (lojas com cupom)** ✅: coleção `parceiros` com os campos `nome`, `cidade`, `tel`, `end`, `desconto` (%), `validade`, `pin`, `regras`, `ativo` e `logo`.
- **Anunciantes** ✅: coleção `anunciantes`, com segmento, cidade, plano (comercial ou exclusivo) e valor. Financeiro em `pagamentos`.
- **Academias e empresas** ⬜. O pedido inclui:
  - logo, capa e galeria;
  - endereço, mapa e "COMO CHEGAR";
  - horário, modalidades e planos;
  - WhatsApp (com primeira mensagem configurável, ex.: "Olá! Encontrei vocês pelo CK Life e gostaria de saber mais."), Instagram e site;
  - benefício CK e avaliações;
  - selos "parceira" e "destaque";
  - filtros.
  - A proposta é a coleção `empresas` com `tipo` (academia, estúdio, clínica, loja, outro).

---

## 12. Clube de vantagens

- **Hoje** 🟡: cupons ganhos a cada 8 treinos, sorteados entre os parceiros ativos (de preferência da cidade da aluna).
  - Ficam em Perfil → "Meus cupons".
  - Na loja, o atendente digita o PIN e o servidor valida (`validar_cupom`).
- **Pedido** ⬜: tela "Clube CK" no Explorar.
  - Lista de benefícios dos parceiros, com regras e validade.
  - Botão para pegar o cupom.
  - A proposta é estender a coleção `parceiros` com `beneficio`, `cat`, `destaque`, `whats`, `insta`, `site` e `desc`.

---

## 13. Produtos, lojas e links externos ⬜

**Pedido:**

- Loja nacional por categorias.
- Tipos de produto: próprio, parceiro ou afiliado.
- URL ou link de afiliado **mantendo os parâmetros de rastreio**.
- Botões COMPRAR ou VER PRODUTO.
- Contar visualizações e cliques.
- **Sem checkout próprio e sem cobrança.**
- A proposta é a coleção `produtos`.

**Lógica de links pedida:**

| Item | Para onde leva |
|---|---|
| endereço | mapa (Google Maps) |
| WhatsApp | conversa, com mensagem pronta |
| Instagram | perfil |
| site | site |
| produto | site de compra |
| serviço | agendamento |
| benefício | cupom |

**No painel:** botão "TESTAR LINK".

**Já existe:** `linkCamp(c)` monta os links de WhatsApp, Instagram e site das campanhas (pode ser reaproveitado).

---

## 14. Localização e mapas ⬜

- **Hoje:** a aluna tem `cidade` (id da lista `cidades`, que o admin gerencia). É usada para anúncios e cupons.
- **Cidades de exemplo** (só no modo demonstração): Cuiabá, Várzea Grande, Rondonópolis, Sinop, "Outra cidade".
- **Pedido:**
  - "Minha cidade: X [ALTERAR]" e busca temporária por outra cidade, **sem GPS obrigatório**.
  - A cidade vale só para o que é presencial. Loja, produtos e profissionais online são nacionais.
  - Mapa e "COMO CHEGAR": usar um link `https://www.google.com/maps/search/?api=1&query=<endereço>`, sem chave de API.

---

## 15. Painel administrativo ✅

Seções (variável `SECOES` em `admin.js`), em grupos:

### Visão geral

- **Resumo:** saudação, indicadores (alunas, ativas, Premium, receita), gráficos.
- **Métricas:**
  - Visualizações, alcance, cliques e CTR.
  - Filtros por dias, anunciante e cidade.
  - Retenção, faixas de idade, "por objetivo".
  - Exportar planilha.

### Anúncios

- **Anunciantes:** criar, editar, excluir, ativar ou pausar. Botão "Relatório" gera o PDF.
- **Campanhas:** título, texto, botão e destino (WhatsApp com mensagem, Instagram ou site).
  - Segmentação por gênero, idade e cidade.
  - Datas de início e fim, ativar ou pausar.
- **Parceiros:** lojas, desconto, validade, PIN, regras, logo. Contadores de cupons entregues e usados.
- **Financeiro:** mensalidades dos anunciantes (pago, pendente, atrasado), por mês.

### Conteúdo do app

- **Alunas:**
  - Busca e filtros (cidade, plano).
  - Editar dados, bloquear ou desbloquear.
  - Dar ou tirar Premium, excluir.
- **Comunidade:** moderação de posts e comentários.
- **Profissionais:** CRUD simples.
- **Receitas:** criar, editar, ocultar receitas da base, foto.
- **Exercícios:** criar e editar exercícios extras.
- **Avisos:** avisos que aparecem para as alunas, com confirmação antes de excluir.

### Ajustes

- **Cidades:** adicionar, ativar ou desativar.
- **Segmentos:** adicionar, ativar ou desativar.
- **Admins:** adicionar por e-mail, permissões por área, remover.
- **Configurações:**
  - Nome do app, link do checkout, suporte, treinos para cupom, preço do Premium.
  - Frequência dos anúncios.
  - Backup (escondido no modo nuvem).

### Ainda não existem no painel ⬜

Empresas e academias, serviços, agendamentos, acompanhamentos online, loja e produtos, categorias, banners, cupons gerais, moderação de avaliações, destaques, métricas do Explorar, módulo ciclo (só números gerais), botão TESTAR LINK, papéis Super Admin, Administrador e Operador.

---

## 16. Notificações e lembretes 🟡

- **Lembrete de treino** (Perfil → Lembrete):
  - A aluna escolhe dias e hora.
  - O app gera um arquivo `.ics` (evento semanal com alarme) que entra no calendário do celular. **Funciona com o app fechado.**
  - Enquanto o app está aberto, também mostra um aviso do navegador no horário.
- **Push de verdade** (com o app fechado, pelo servidor) ⬜: precisa de service worker, chaves VAPID e um servidor de envio. No iPhone só funciona com o app instalado na tela inicial (iOS 16.4+).

---

## 17. Funcionalidades prontas ✅

Login e cadastro, onboarding, Início, treinos e player, nutrição e modo cozinha, evolução, perfil com foto, comunidade (feed, foto, curtida, comentário), anúncios, cupons e parceiros, painel completo da seção 15, relatório PDF, PWA (instalar), layout de computador, modo escuro, sons e voz, lembretes .ics, cartão de conquista.

## 18. Funcionalidades parciais 🟡

- **Profissionais:** só lista com WhatsApp. Sem agendamento, categorias, avaliações ou presencial/online.
- **Clube de vantagens:** existe como cupons por treino, sem tela "Clube CK".
- **Premium e Kiwify:** o código do webhook existe, mas falta o link de checkout e as variáveis na Vercel.
- **Fotos das receitas:** 93 prontas de 197. Detalhes na seção 24.
- **Notificações:** só .ics e aviso com o app aberto.
- **Permissões de admin:** por área só no painel. O servidor só checa se é admin.
- **Rascunho `expansao.sql`:** escrito, não rodado, precisa das correções da seção 5.

## 19. Funcionalidades a implementar ⬜ (grande expansão pedida em 23/10)

Ordem pedida pelo dono:

1. Navegação com no máximo 5 áreas:
   - INÍCIO, TREINOS, COMUNIDADE, EXPLORAR, PERFIL.
   - Plano: Nutrição vira um seletor dentro de Treinos (ou um atalho na Início).
   - Evolução vira "Meu progresso" no Perfil.
   - Os painéis `t-dieta` e `t-evolucao` continuam existindo, só saem da barra.
2. Explorar:
   - Seções Academias, Profissionais, Serviços, Clube CK e Loja.
   - Blocos "Perto de você" e "Atendimento online".
   - Busca, banners e destaques.
3. Cidade: "Minha cidade" mais busca temporária.
4. Empresas e academias.
5. Profissionais completos.
6. Serviços: preço, promoção, duração e modalidade.
7. Agendamentos, com "Meus Agendamentos".
8. Atendimento online.
9. Loja com links de afiliado.
10. Avaliações.
11. "Meus Favoritos" no Perfil. Plano: `ME.favx = ["emp:id", ...]`; `ME.favs` já é usado para receitas.
12. Busca geral.
13. Banners por local, destino, datas e ordem, mais cupons.
14. Métricas de visualização e clique, usando `eventos` com o prefixo `x:`.
15. Meu Ciclo (seção 9), com check-in e adaptação do treino.
16. Card de contexto na Início.
17. Notificações.
18. Comunidade: chat 1 a 1 (ícone de conversa dentro da Comunidade), perfil público, compartilhar sequência e desafio (sempre por escolha da aluna).
19. Perfil organizado:
    - Meu perfil, progresso, ciclo, agendamentos, favoritos.
    - Premium, cidade, histórico.
    - Privacidade, notificações, configurações.
20. Módulos do painel da seção 15 (sem duplicar o que já existe).
21. Telas de vazio, erro e carregando em tudo, por exemplo "Ainda não temos academias parceiras nesta cidade."
22. Carregamento sob demanda das imagens.
23. Testes finais, confirmando que nada antigo quebrou.

**Arquitetura planejada:**

- **Coleções novas do painel em `colecoes`:**
  - `empresas`, `servicos`, `produtos`, `banners`, `categorias`.
  - Também é preciso adicionar esses nomes em `LISTAS` e `N.vazio()` no `nuvem.js`, e em `semente()` ou numa função de "completar DB" para quem já tem dados antigos no localStorage.
- **Tabelas novas do rascunho SQL:**
  - `agendamentos`, `avaliacoes`, `ciclo`, `conversas`, `mensagens`.
  - Acesso direto por `NU.sb.from(...)` no modo nuvem, como já faz o `CM` da comunidade. No modo demonstração, guardar em localStorage.
- **Onde fica o código novo:** um arquivo `src/explorar.js`, inserido DENTRO da IIFE do `app.js` por um marcador (ex.: `/*EXPANSAO*/` antes de `const TABS`), com o `build.py` trocando o marcador pelo arquivo.
- **No painel:** um construtor genérico de cadastro (`crud(cfg)` com campos text, num, money, select, checkbox, área de texto, imagem, galeria, data, cidade, url, telefone) para não repetir código.

## 20. Bugs e limitações conhecidas

- **Permissões por área do admin** não são checadas no servidor. Qualquer admin pode gravar em `colecoes` pelo banco.
- **Push com o app fechado** não existe (seção 16).
- **Navegadores dentro do Instagram ou WhatsApp** podem perder a sessão e não instalam o app. O app avisa e manda abrir no Safari ou Chrome.
- **Demonstração no claude.ai:** downloads (PDF, .ics, cartão) não funcionam dentro do visualizador. No site de verdade funcionam.
- **Fotos de perfil e logos** ficam em base64 dentro do jsonb (pesado se forem muitas). As fotos dos posts já vão para o Storage.
- **Leitura de dados:** `colecoes` é carregada inteira ao abrir. Com catálogo grande, isso pode ficar lento (paginar no futuro).
- **Mock de teste** (`mock-supabase.js`): não tem tabelas de posts, `order()` nem storage.
- **Tabela `eventos`:** só aceita `t` = `imp` ou `clk`.
- **Exercícios sem foto:** 8 dos 51 mostram um cartão com as iniciais.
- **Premium:** a Kiwify ainda não está ligada. O Premium pago só funciona se o admin der manualmente.
- **Arquivos antigos:** `app.old.js`, `app.old.css` e `boneco3d.js` estão no `src` e não são usados.

## 21. Arquivos importantes

**Pasta de trabalho desta sessão:** é temporária e apagada se a sessão for apagada. A cópia segura é o GitHub, em `repo/` e `repo/fonte/`.

| Arquivo | Para que serve |
|---|---|
| `src/shell.html` | Esqueleto HTML com os marcadores e todas as telas |
| `src/app.css` | Todo o visual: tema claro e escuro, computador (≥1024 px), painel, comunidade |
| `src/app.js` | App da aluna inteiro (cerca de 1650 linhas) |
| `src/admin.js` | Painel inteiro (cerca de 800 linhas) |
| `src/nuvem.js` | Ligação com o Supabase: carregar, gravar diferenças, login, cadastro, senha, cupom. `LISTAS` e `UNICOS` |
| `src/sons.js` | Sons gerados pelo navegador (`SOM.tap`, `bell`, `done`, `coupon`, `erro`…) |
| `src/boneco.js` | Dados dos exercícios: músculos, animação, dicas |
| `src/fotos.js` | Troca o boneco pelas fotos `img/ex-*.jpg` |
| `src/treinos.js` | Lista de exercícios (`window.EX`) |
| `src/casa.js` | Programas de treino em casa (`window.PROGRAMAS`, `EXMETA`) |
| `src/receitas1-4.js` | 197 receitas (`R1` a `R4`) |
| `build.py` | Monta a demonstração e o site |
| `ck-life/site/` | Site publicado: `index.html`, `img/` (149 arquivos), `manifest.webmanifest`, `api/kiwify-webhook.js`, `vercel.json` (rewrite `/admin` → `index.html`), `package.json` |
| `ck-life/banco-de-dados.sql`, `ck-life/comunidade.sql` | Banco (já rodados) |
| `ck-life/expansao.sql` | Rascunho da expansão (não rodado) |
| `repo/` | Cópia do GitHub `Tiagoroity/CKlife` (branch `main`). A Vercel publica dela automaticamente |
| `repo/fonte/` | Cópia do código-fonte, SQLs, `build.py` e este documento. Fica fora do site por causa do `.vercelignore` |
| `chk.sh` | Confere erros de sintaxe nos JS (JavaScriptCore do Mac) |
| `audit.js` | Rodado no navegador: `AUD("rótulo")` lista textos e botões fora da tela |
| `contraste.js` | Rodado no navegador: `CONTR()` lista contraste ruim (modo escuro) |
| `mock-supabase.js`, `mk-teste-nuvem.py`, `teste-nuvem.html` | Testar o modo nuvem sem banco de verdade (`MOCKFALHA` simula erro) |
| `.claude/launch.json` | Servidor local "fitverde" em `http://localhost:8765` |
| `ordem-receitas.json` | Ordem das receitas para os lotes de fotos |
| `~/Downloads/fotos-ck-life/PEDIDOS-RECEITAS.txt` | Pedidos (prompts) das fotos das receitas que faltam |

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
3. Testar no navegador em `http://localhost:8765/fitverde.html`. Rodar `AUD()` em 320, 375 e 1366 px, `CONTR()` no modo escuro, e testar o modo nuvem com `python3 mk-teste-nuvem.py` → `teste-nuvem.html`.
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

### A. O agente pode fazer sozinho, nesta ordem

1. Corrigir o rascunho `expansao.sql` (seção 5) e entregar o texto para o dono rodar no Supabase.
2. Navegação em 5 áreas (seção 19, item 1), sem apagar telas.
3. Explorar com cidade, empresas e academias, profissionais completos, serviços, Clube CK e Loja, com dados de exemplo no modo demonstração.
4. Agendamentos, avaliações, favoritos, busca, banners e métricas.
5. Módulos novos do painel, usando o construtor genérico.
6. Meu Ciclo com check-in e "Adaptar treino de hoje" (seguindo à risca a seção 9).
7. Chat 1 a 1 e perfil público na Comunidade.
8. Testes completos (login, cadastro, feed, posts, treinos, perfil, Premium, admin) e publicar.
9. Atualizar este documento.

Dica: publicar ao fim de cada fase, para não perder nada se o uso acabar.

### B. Fila de espera (precisa do dono ou de decisão)

- [ ] Rodar o `expansao.sql` corrigido no Supabase.
- [ ] Link do checkout da Kiwify e as 3 variáveis na Vercel, mais a URL do webhook na Kiwify.
- [ ] Fotos das receitas, lotes 10 a 20.
- [ ] Fotos dos 8 exercícios sem foto.
- [ ] Cadastrar empresas, academias, profissionais, produtos e banners reais no painel (o agente deixa exemplos só na demonstração).
- [ ] Decidir o preço final do Premium (R$ 19,90 hoje × R$ 79 desejado). Nenhuma cobrança nova sem autorização.
- [ ] Push com o app fechado: precisa de service worker, VAPID e servidor (decidir se vale).
- [ ] Cadastro próprio de profissionais e empresas (hoje só o admin cadastra), pagamento de agendamentos e PIX: só com autorização.
- [ ] Permissões por área validadas no servidor (Super Admin, Administrador, Operador): criar função SQL `pode(area)` e regras por coleção.
- [ ] Domínio próprio (opcional).

---

## COMANDO PARA CONTINUAR O CK LIFE EM UMA NOVA SESSÃO

Copie e cole tudo abaixo numa nova sessão do Claude Code:

```
Você vai continuar o desenvolvimento do CK Life, meu app de treino em casa para mulheres. Eu não sou programador: fale comigo em português, simples, com passo a passo de cliques. Faça sozinho tudo o que der, publique ao fim de cada fase e coloque numa "fila de espera" o que depender de mim.

1) Pegue o projeto no GitHub: o repositório é Tiagoroity/CKlife (branch main). Clone numa pasta de trabalho (ex.: ~/Projetos/ck-life/repo). O site sai da raiz do repo (Vercel publica sozinho a cada push) e o código-fonte fica em repo/fonte (src/, build.py, SQLs). Monte a pasta de trabalho assim: copie repo/fonte/src, repo/fonte/build.py e os .sql para a pasta de trabalho (os SQL em ck-life/), e copie repo/img para ck-life/site/img. Rode python3 build.py para gerar ck-life/site/index.html e fitverde.html.

2) ANTES DE QUALQUER COISA leia inteiro o arquivo repo/fonte/CK-LIFE-CONTEXTO-MESTRE.md. Ele tem a arquitetura, o banco, as regras que não podem ser quebradas, como publicar, o que está pronto, o que falta e a fila de espera.

3) Regras que valem sempre: não remover nem recriar nada que já funciona; não destruir feed/comunidade/posts; banco só com mudanças que adicionam (nada destrutivo); dados de ciclo, peso e saúde nunca compartilhados nem usados para anúncio/parceiros; admin não vê dados íntimos individuais; permissão validada no banco (RLS), não só escondendo botão; nenhuma cobrança ou checkout novo sem eu autorizar; nunca digite nem repita senhas ou chaves.

4) Site: https://cklife.vercel.app (alunas) e /admin (painel). Banco: Supabase, projeto psxmyiudtuozasbqzvnu. Demonstração: atualizar o artifact https://claude.ai/artifact/FYyAokNvw9kzNDTprzkKPd com o fitverde.html.

5) Continue de onde parou: seção 25-A do documento mestre (grande expansão: corrigir e me entregar o expansao.sql para eu rodar no Supabase, navegação em 5 áreas INÍCIO/TREINOS/COMUNIDADE/EXPLORAR/PERFIL, Explorar com cidade, academias, profissionais, serviços, agendamentos, avaliações, favoritos, Clube CK, Loja com links de afiliado, banners, métricas, módulos novos no painel, Meu Ciclo com as regras de privacidade e estimativas, chat entre alunas). Depois teste tudo (nada antigo pode quebrar), publique e atualize o documento mestre.
```
