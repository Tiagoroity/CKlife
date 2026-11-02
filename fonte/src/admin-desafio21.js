/* ===================== PAINEL · DESAFIOS › CK 21 DIAS JUNTAS ›  EDIÇÕES =====================
   Edições, editor dos 21 dias (rascunho → publicar), comunidade controlada (publicar agora/programar/fixar),
   duplicar edição e métricas agregadas (nunca dado pessoal). Tudo protegido no banco (admin_pode('desafios')). */
SECOES.push(["desafios", "Desafios"]); MENU_NOME.desafios = "CK 21 Dias Juntas";
{ const g = MENU.find(m => m[0] === "Gestão"); if(g && !g[1].some(x => x[2].includes("desafios"))) g[1].push(["Desafios", "desafios", ["desafios"]]); }
const DA = { lista: null, ed: null, aba: "geral", erro: null, met: null, posts: null, cont: {} };
const DA_FASE = { rascunho: ["Rascunho", "off"], inscricoes: ["Inscrições abertas", "ok"], aguardando: ["Aguardando início", "ok"], andamento: ["Em andamento", "ok"], finalizada: ["Finalizada", ""], arquivada: ["Arquivada", "off"] };
const daFase = e => { if(["rascunho", "arquivada"].includes(e.status)) return e.status; const h = today(); if(h > e.fim || e.status === "finalizada") return "finalizada"; if(h >= e.inicio) return "andamento"; return e.status === "aguardando" ? "aguardando" : "inscricoes"; };
const daDia = e => Math.floor((Date.parse(today() + "T12:00:00Z") - Date.parse(e.inicio + "T12:00:00Z")) / 864e5) + 1;
const daBr = d => d ? d.split("-").reverse().join("/") : "–";
const daEx = () => Object.keys(window.EXMETA || {}).map(id => ({ id, nome: F.exById(id).nome || id })).sort((a, b) => a.nome.localeCompare(b.nome));
const daRec = () => (F.receitas ? F.receitas() : F.BASE_REC || []).map(r => ({ id: r.id, nome: r.nome }));
const daPode = () => podeEditar("desafios");
const daSem = msg => `<div class="card"><p class="muted" style="margin:0">${msg}</p></div>`;

async function daCarregaLista(){
  const r = await SB2().from("d21_edicoes").select("*").order("inicio", { ascending: false });
  if(r.error) throw r.error; DA.lista = r.data || []; return DA.lista;
}
function vDesafios(){
  const box = $("adm-main");
  if(!SB2()){ box.innerHTML = `<div class="head"><h1>CK 21 Dias Juntas</h1></div>${daSem("Disponível com o banco na nuvem conectado.")}`; return; }
  if(DA.ed) return daEdicao();
  box.innerHTML = `<div class="head"><div><h1>🔥 CK 21 Dias Juntas</h1><p class="muted">Desafios › CK 21 Dias Juntas › Edições</p></div>${daPode() ? `<button class="btn btn-accent" id="da-nova">+ Nova edição</button>` : ""}</div><div id="da-l">${daSem("Carregando…")}</div>`;
  const n = $("da-nova"); if(n) n.onclick = () => daFormEdicao(null);
  daCarregaLista().then(L => {
    const el = $("da-l"); if(!el) return;
    el.innerHTML = L.length ? `<div class="grid g2">${L.map(e => { const f = daFase(e), [ft, fc] = DA_FASE[f];
      return `<div class="card da-ed"><div class="da-ed-top"><span class="st ${fc}">${ft}</span><small class="muted">${daBr(e.inicio)} a ${daBr(e.fim)}</small></div>
        <h3>${esc(e.nome)} · Edição #${String(e.numero).padStart(2, "0")}</h3><p class="muted" style="margin:0">${f === "andamento" ? `Hoje é o Dia ${daDia(e)} de 21` : esc(e.frase || "")}</p>
        ${e.publicado_em ? "" : `<p class="msg msg-bad" style="margin:0">Os 21 dias ainda não foram publicados para as alunas.</p>`}
        <div class="acts"><button class="btn btn-accent btn-sm" data-da-ab="${e.id}">Abrir</button>${daPode() ? `<button class="btn btn-sm" data-da-dup="${e.id}">Duplicar edição</button>` : ""}</div></div>`; }).join("")}</div>`
      : daSem(`Nenhuma edição ainda. Toque em <b>+ Nova edição</b>: os 21 dias já vêm com um plano-base pronto (força + cardio, 3 semanas, com recuperação ativa) para você ajustar. Nada aparece para as alunas até você publicar e abrir as inscrições.`);
    el.querySelectorAll("[data-da-ab]").forEach(b => b.onclick = () => { DA.ed = DA.lista.find(x => x.id === b.dataset.daAb); DA.aba = "geral"; DA.met = DA.posts = null; rerender(); });
    el.querySelectorAll("[data-da-dup]").forEach(b => b.onclick = () => daDuplicar(DA.lista.find(x => x.id === b.dataset.daDup)));
  }).catch(e => { const el = $("da-l"); if(el) el.innerHTML = daSem(/d21_edicoes|schema cache|does not exist/.test(e.message || "") ? "Falta rodar o arquivo <b>desafio21.sql</b> no Supabase (SQL Editor). Depois disso esta área funciona." : "Não deu para carregar: " + esc(e.message || "erro")); });
}
VIEWS.desafios = vDesafios;

/* ---------- uma edição ---------- */
function daEdicao(){
  const e = DA.ed, f = daFase(e), [ft, fc] = DA_FASE[f], mudou = JSON.stringify(e.dias || []) !== JSON.stringify(e.dias_pub || []);
  $("adm-main").innerHTML = `<div class="head"><div><button class="link" id="da-volta">‹ Edições</button><h1>${esc(e.nome)} · #${String(e.numero).padStart(2, "0")}</h1>
      <p class="muted"><span class="st ${fc}">${ft}</span> ${daBr(e.inicio)} a ${daBr(e.fim)}${f === "andamento" ? ` · hoje é o Dia ${daDia(e)}` : ""}${mudou ? ` · <b style="color:#B7791F">há mudanças nos dias não publicadas</b>` : ""}</p></div></div>
    <div class="seg da-seg">${[["geral", "Visão geral"], ["dias", "Os 21 dias"], ["comunidade", "Comunidade"], ["config", "Configurações"]].map(([k, t]) => `<button data-da-aba="${k}" aria-pressed="${DA.aba === k}">${t}</button>`).join("")}</div>
    <div id="da-c"></div>`;
  $("da-volta").onclick = () => { DA.ed = null; rerender(); };
  document.querySelectorAll("[data-da-aba]").forEach(b => b.onclick = () => { DA.aba = b.dataset.daAba; daEdicao(); });
  ({ geral: daGeral, dias: daDias, comunidade: daComunidade, config: daConfig })[DA.aba]();
}
async function daRecarregaEd(){ const r = await SB2().from("d21_edicoes").select("*").eq("id", DA.ed.id); if(!r.error && r.data && r.data[0]) DA.ed = r.data[0]; }
async function daSalvaEd(campos){
  if(!daPode()) throw new Error("Você não tem permissão para editar desafios.");
  const r = await SB2().from("d21_edicoes").update({ ...campos, atualizado: new Date().toISOString() }).eq("id", DA.ed.id).select(); if(r.error) throw r.error;
  if(r.data && r.data[0]) DA.ed = r.data[0]; else Object.assign(DA.ed, campos);
}

/* ---------- visão geral: métricas, funil, treinos e comunidade ---------- */
function daGeral(){
  const c = $("da-c"); c.innerHTML = daSem("Carregando números…");
  SB2().rpc("d21_admin_metricas", { p_edicao: DA.ed.id }).then(r => {
    if(r.error) throw r.error; const M = r.data || {}, el = $("da-c"); if(!el || DA.aba !== "geral") return;
    const I = +M.inscritas || 0, F0 = M.funil || {}, pc = (a, b) => b ? Math.round(100 * a / b) + "%" : "–", C = M.comunidade || {}, MD = M.modos || {}, MI = M.modos_inscritas || {};
    const etapas = [["Inscritas", I], ["Iniciaram", +M.iniciaram || 0], ["Chegaram ao D3", +F0.D3 || 0], ["D7", +F0.D7 || 0], ["D14", +F0.D14 || 0], ["D21", +F0.D21 || 0]];
    const PD = M.por_dia || [], maxD = Math.max(1, ...PD.map(x => +x.iniciados || 0, 1), ...PD.map(x => +x.concluidos || 0));
    const pior = PD.filter(x => +x.iniciados > 0).map(x => ({ ...x, ab: (+x.iniciados) - (+x.concluidos) })).filter(x => x.ab > 0).sort((a, b) => b.ab - a.ab)[0];
    el.innerHTML = `<div class="grid g4">${kpi("Inscritas", int(I), `${int(M.abandonaram || 0)} saíram do desafio`, "alunos", 1)}${kpi("Ativas hoje", int(M.ativas_hoje || 0), M.dia >= 1 && M.dia <= 21 ? `Dia ${M.dia} de 21` : "")}${kpi("Concluíram (D21)", int(M.concluiram || 0), pc(+M.concluiram || 0, I) + " das inscritas")}${kpi("Retornaram", int(M.retornaram || 0), "voltaram depois de 2+ dias sem treinar")}</div>
      <div class="card"><h3>Funil: onde elas estão parando</h3><div class="da-funil">${etapas.map(([t, n], i) => `<div class="da-fl"><span>${t}</span><div><i style="width:${I ? Math.max(2, Math.round(100 * n / I)) : 0}%"></i></div><b class="num">${int(n)}</b><small>${i ? pc(n, etapas[i - 1][1]) + " da etapa anterior" : ""}</small></div>`).join("")}</div>
        <p class="hint" style="margin:8px 0 0">D3/D7/D14/D21 = alunas que treinaram em algum dia a partir desse dia da edição.</p></div>
      <div class="grid g2"><div class="card"><h3>Treinos</h3><dl class="kv"><dt>Treinos iniciados</dt><dd class="num">${int(M.iniciados || 0)}</dd><dt>Treinos completos</dt><dd class="num">${int(M.completos || 0)}</dd><dt>Plano B</dt><dd class="num">${int(M.planob || 0)}</dd>
        <dt>Normal / Hard / Supreme (concluídos)</dt><dd class="num">${int(MD.normal || 0)} / ${int(MD.hard || 0)} / ${int(MD.supreme || 0)}</dd><dt>Modo escolhido hoje</dt><dd class="num">${int(MI.normal || 0)} / ${int(MI.hard || 0)} / ${int(MI.supreme || 0)}</dd>
        ${pior ? `<dt>Dia com mais abandono</dt><dd>Dia ${pior.dia} (${int(pior.ab)} começaram e não terminaram)</dd>` : ""}</dl></div>
        <div class="card"><h3>Comunidade</h3><dl class="kv"><dt>Publicações</dt><dd class="num">${int(C.publicacoes || 0)}</dd><dt>Visualizações</dt><dd class="num">${int(C.vistas || 0)}</dd><dt>Reações</dt><dd class="num">${int(C.reacoes || 0)}</dd><dt>Votos em enquetes</dt><dd class="num">${int(C.votos || 0)}</dd><dt>Check-ins</dt><dd class="num">${int(C.checkins || 0)}</dd><dt>Taxa de interação</dt><dd class="num">${pc(+C.interagiram || 0, I)} das inscritas</dd></dl>
        ${(C.top || []).length ? `<p class="hint" style="margin:10px 0 4px">Publicações mais fortes</p><ol class="da-top">${C.top.map(t => `<li>${esc(t.titulo || "(sem título)")} <small class="muted">${int(t.interacoes)} interações · ${int(t.vistas)} vistas</small></li>`).join("")}</ol>` : ""}</div></div>
      <div class="card"><h3>Dia a dia</h3>${PD.length && M.dia >= 1 ? `<div class="tbl"><table><thead><tr><th>Dia</th><th>Iniciaram</th><th>Concluíram</th><th>Plano B</th><th></th></tr></thead><tbody>${PD.map(x => `<tr><td>Dia ${x.dia}</td><td class="num">${int(x.iniciados)}</td><td class="num">${int(x.concluidos)}</td><td class="num">${int(x.planob)}</td><td style="width:40%"><div class="da-bar"><i style="width:${Math.round(100 * (+x.concluidos) / maxD)}%"></i></div></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted" style="margin:0">Aparece quando a edição começar.</p>`}</div>
      <div class="card" id="da-sum"><h3>💬 Quem sumiu (2 dias ou mais sem treinar)</h3><p class="muted" style="margin:0">Carregando…</p></div>
      ${M.pesquisa && +M.pesquisa.respostas ? `<div class="card"><h3>Pesquisa final</h3><dl class="kv"><dt>Respostas</dt><dd class="num">${int(M.pesquisa.respostas)}</dd><dt>Nota média (0 a 10)</dt><dd class="num">${M.pesquisa.media}</dd><dt>Participariam de outra</dt><dd class="num">${int(M.pesquisa.outra)}</dd></dl><p class="hint" style="margin:6px 0 0">As respostas são privadas e nunca viram depoimento público.</p></div>` : ""}`;
    daSumidas(M.dia);
  }).catch(e => { const el = $("da-c"); if(el) el.innerHTML = daSem("Não deu para carregar os números: " + esc(e.message || "erro")); });
}
/* quem parou: a Micaela chama no WhatsApp com a mensagem pronta (contato pessoal recupera quem ia desistir) */
function daSumidas(dia){
  SB2().rpc("d21_admin_sumidas", { p_edicao: DA.ed.id }).then(r => {
    const el = $("da-sum"); if(!el) return; if(r.error) throw r.error; const L = r.data || [], us = DB().users, dig = x => String(x || "").replace(/\D/g, "");
    const msg = u => `Oi, ${String(u.nome || "").split(" ")[0] || "tudo bem"}! 💚 Aqui é a Micaela do CK Life. A turma do CK 21 Dias Juntas está no Dia ${Math.min(21, dia)} e sentiu sua falta. Você não precisa recuperar nada: hoje dá pra fazer até o Plano B de 10 minutos. Bora voltar com a gente?`;
    el.innerHTML = `<h3>💬 Quem sumiu (2 dias ou mais sem treinar)</h3>${L.length ? `<p class="hint" style="margin:0 0 8px">${L.length} ${L.length === 1 ? "participante" : "participantes"}. Toque em 💬 para abrir o WhatsApp com a mensagem pronta.</p>
      <div class="tbl"><table><thead><tr><th>Aluna</th><th>Dias sem treinar</th><th>Dias feitos</th><th></th></tr></thead><tbody>${L.map(x => { const u = us.find(y => y.id === x.user_id) || {};
        return `<tr><td><b>${esc(u.nome || u.email || "Aluna")}</b><br><small class="muted">${x.ultimo ? "último treino no Dia " + x.ultimo : "ainda não treinou"} · ${esc(x.modo)}</small></td><td class="num"><b>${int(x.dias_sem)}</b></td><td class="num">${int(x.feitos)}/21</td>
          <td>${dig(u.whats).length >= 10 ? `<button class="btn btn-sm zap-bt" data-dsz="${x.user_id}" aria-label="Chamar no WhatsApp">💬</button>` : `<small class="muted">sem WhatsApp</small>`}</td></tr>`; }).join("")}</tbody></table></div>`
      : `<p class="muted" style="margin:0">${dia >= 2 ? "Ninguém parou. A turma está firme 💚" : "Aparece a partir do Dia 3."}</p>`}`;
    el.querySelectorAll("[data-dsz]").forEach(b => b.onclick = () => { const u = us.find(y => y.id === b.dataset.dsz); const url = u && F.lkWhats(u.whats, msg(u)); if(url) window.open(url, "_blank", "noopener"); });
  }).catch(() => { const el = $("da-sum"); if(el) el.querySelector("p").textContent = "Não deu para carregar agora."; });
}
/* ---------- pacote de publicações: 3 por dia, programadas (a Micaela só revisa) ---------- */
const DA_NOITE = [
  { tipo: "checkin", titulo: "COMO VOCÊ ESTÁ HOJE?", opcoes: ["🔥 Tô voando", "💪 Tô firme", "🥵 Tá puxado", "💚 Mas não vou parar"] },
  { tipo: "enquete", titulo: "QUE HORAS VOCÊ TREINOU HOJE?", opcoes: ["Manhã", "Tarde", "Noite", "Ainda vou 💪"] },
  { tipo: "mensagem", titulo: "Recado da Micaela 💚", texto: "Se hoje foi corrido, lembra: Plano B de 10 minutos conta. Não precisa ser perfeito, precisa ser seu." },
  { tipo: "enquete", titulo: "O QUE MAIS TE AJUDA A NÃO PARAR?", opcoes: ["A turma 👭", "Ver meu calendário", "Os recados", "Me sentir melhor"] },
  { tipo: "checkin", titulo: "COMO ESTÁ SUA ENERGIA HOJE?", opcoes: ["⚡ Lá em cima", "🙂 Boa", "😴 Baixinha"] },
  { tipo: "mensagem", titulo: "Orgulho de vocês 🔥", texto: "Cada uma que apareceu hoje está construindo algo que ninguém tira. Amanhã a gente continua." },
  { tipo: "enquete", titulo: "BEBEU ÁGUA HOJE?", opcoes: ["Bati a meta 💧", "Quase lá", "Vou caprichar amanhã"] }];
const DA_MARCOS = { 7: ["🎉 UMA SEMANA JUNTAS!", "7 dias. Uma semana inteira de turma. Quem chegou até aqui merece se orgulhar."], 14: ["🏆 14 DIAS!", "Dois terços do caminho. Falta pouco e a turma está mais forte do que nunca."], 21: ["👑 DIA 21: A GENTE CONSEGUIU!", "21 dias juntas. Não 21 dias perfeitos. Obrigada por cada treino, cada check-in, cada volta."] };
/* recados de motivação (não são treino): manhã, tarde e fim do dia */
const DA_MANHA = ["Bom dia, turma! ☀️ Hoje não precisa ser perfeito. Precisa ser seu.", "Quem acordou com preguiça levanta a mão 🙋‍♀️ Normal! O treino de hoje cabe no seu dia.", "Lembrete do dia: você não está fazendo isso sozinha. Tem uma turma inteira com você 💚", "Uma garrafinha de água do lado e bora. Pequenas escolhas, grandes resultados.", "Seu eu de daqui a 21 dias vai agradecer o que você fizer hoje.", "Disciplina é lembrar o que você quer. Bom dia, turma! 🔥", "Não espere a vontade aparecer. Comece, que ela vem junto."];
const DA_TARDE = ["Ainda dá tempo! ⏰ Se não treinou ainda, separa 20 minutinhos depois do trabalho.", "Já foi? Vai mais tarde? Qualquer hora conta. O importante é aparecer 💪", "Metade do dia já foi. O treino de hoje ainda está esperando por você 🔥", "Tá corrido? Plano B de 10 minutos existe pra isso. Feito é melhor que perfeito.", "Pausa pra água e pra lembrar: você prometeu isso pra você 💚", "Quem treinou de manhã: orgulho! Quem vai de noite: estamos esperando 🙌", "O cansaço vai passar. O orgulho de ter feito fica."];
const DA_FIMDIA = ["Ainda dá tempo! 🌙 10 minutos antes de dormir e o dia conta.", "Hoje não deu? Tudo bem. Amanhã a turma está aqui de novo, te esperando 💚", "Quem treinou hoje: descanse com orgulho. Quem ainda não: o Plano B cabe agora.", "Fim de dia. Bebe uma água, alonga 5 minutinhos e dorme bem. Amanhã tem mais 💤", "Cada dia que você aparece é um voto na mulher que você quer ser.", "Não compare seu dia com o de ninguém. Compare com o seu de ontem.", "Boa noite, turma. Amanhã a gente continua juntas 💚"];
/* fase de espera (antes do Dia 1): movimenta quem já entrou */
const DA_ESPERA = [
  { h: 9, tipo: "mensagem", titulo: "Bem-vinda à turma! 💚", texto: "Que bom ter você aqui. Nos próximos dias a gente se prepara junto: escolha seu cantinho, sua hora e chame uma amiga. Quando o Dia 1 chegar, ninguém começa sozinha." },
  { h: 13, tipo: "enquete", titulo: "QUAL SEU MAIOR OBJETIVO NESSES 21 DIAS?", opcoes: ["Criar o hábito de treinar", "Ter mais energia", "Me sentir mais forte", "Cuidar mais de mim"] },
  { h: 20, tipo: "chamada", titulo: "CHAMA UMA AMIGA 👭", texto: "Quem treina com amiga desiste menos. Manda seu convite pelo botão \"Traga uma amiga\" e ela entra na mesma turma." },
  { h: 9, tipo: "mensagem", titulo: "Prepara o cantinho 🧘‍♀️", texto: "Um espaço pra deitar no chão, roupa confortável e uma garrafinha de água. Só isso. O resto a gente faz junto." },
  { h: 13, tipo: "enquete", titulo: "QUE HORAS VOCÊ VAI TREINAR?", opcoes: ["Manhã", "Almoço", "Tarde", "Noite"] },
  { h: 20, tipo: "checkin", titulo: "COMO VOCÊ ESTÁ PRA COMEÇAR?", opcoes: ["🔥 Ansiosa pra começar", "💪 Pronta", "😅 Com um friozinho na barriga", "💚 Vou com calma"] },
  { h: 9, tipo: "mensagem", titulo: "Normal, Hard ou Supreme? 🤔", texto: "Escolheu seu modo? Dá pra trocar a qualquer momento. Começar no Normal e subir depois é uma ótima ideia." },
  { h: 13, tipo: "enquete", titulo: "JÁ TREINOU EM CASA ANTES?", opcoes: ["Nunca, vai ser a primeira vez", "Já, mas parei", "Já treino às vezes"] },
  { h: 20, tipo: "mensagem", titulo: "Ninguém aqui é perfeita 💚", texto: "21 dias juntas. Não 21 dias perfeitos. Se um dia não der, a turma segue e você segue junto. Sem culpa." }];
async function daGeraPosts(){
  const e = DA.ed, D = e.dias_pub && e.dias_pub.length ? e.dias_pub : (e.dias || []), agora = Date.now(), hoje = today(), dSP = iso => new Date(Date.parse(iso) - 3 * 36e5).toISOString().slice(0, 10), ja = new Set((DA.posts || []).map(p => dSP(p.publicar_em) + "|" + (p.titulo || "")));
  const L = [], hora = (dt, h, m) => new Date(`${dt}T${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}:00-03:00`).toISOString();
  const op = arr => (arr || []).map((t, k) => ({ id: "o" + (k + 1), t }));
  const add = (dt, n, h, m, p) => { const quando = hora(dt, h, m); if(Date.parse(quando) <= agora || ja.has(dt + "|" + p.titulo)) return; ja.add(dt + "|" + p.titulo); L.push({ edicao_id: e.id, dia: n || null, publicar_em: quando, fixado: false, notificar: false, resultado: "sempre", multipla: false, pode_mudar: true, opcoes: [], botao: null, texto: null, ...p }); };
  // fase de espera: de hoje até a véspera do Dia 1 (3 recados por dia + contagem)
  let k = 0;
  for(let dt = hoje > (e.inscricao_ini || hoje) ? hoje : (e.inscricao_ini || hoje); dt < e.inicio; dt = addD(dt, 1)){
    const faltam = Math.round((Date.parse(e.inicio + "T12:00:00Z") - Date.parse(dt + "T12:00:00Z")) / 864e5);
    for(let j = 0; j < 3; j++){ const x = DA_ESPERA[(k * 3 + j) % DA_ESPERA.length]; add(dt, 0, x.h, 0, { tipo: x.tipo, titulo: j === 2 && faltam <= 3 ? (faltam === 1 ? "🔥 É AMANHÃ!" : `⏳ FALTAM ${faltam} DIAS`) : x.titulo, texto: j === 2 && faltam <= 3 ? (faltam === 1 ? "Amanhã começa o Dia 1. Deixa a roupa separada e a garrafinha cheia. A turma vai estar aqui 💚" : `Faltam ${faltam} dias pro Dia 1. Já escolheu seu modo e a hora do seu lembrete?`) : (x.texto || null), opcoes: j === 2 && faltam <= 3 ? [] : op(x.opcoes), tipo: j === 2 && faltam <= 3 ? "chamada" : x.tipo }); }
    k++;
  }
  // os 21 dias: 6 recados por dia (só a abertura e o check-in têm botão de treino; o resto é motivação)
  for(let n = 1; n <= 21; n++){
    const dt = addD(e.inicio, n - 1), dd = D[n - 1] || {}, r = (n - 1) % 7;
    add(dt, n, 7, 0, { tipo: "chamada", titulo: DA_MARCOS[n] ? DA_MARCOS[n][0] : `🔥 DIA ${n}/21 COMEÇOU!`, texto: (DA_MARCOS[n] ? DA_MARCOS[n][1] + "\n\n" : "") + `Hoje: ${dd.titulo || "treino do dia"}. ${dd.msg || "Bora juntas?"}`, botao: "treino" });
    add(dt, n, 10, 0, { tipo: "mensagem", titulo: "Recado da manhã ☀️", texto: DA_MANHA[r] });
    add(dt, n, 13, 0, { tipo: "checkin", titulo: "JÁ FOI OU VAI MAIS TARDE?", opcoes: op(["Já fui 🔥", "Vou mais tarde 💪", "Vou à noite 🌙", "Hoje é Plano B 💚"]) });
    add(dt, n, 16, 0, { tipo: "mensagem", titulo: "Ainda dá tempo ⏰", texto: DA_TARDE[r], botao: "treino" });
    const x = DA_NOITE[r];
    add(dt, n, 19, 30, { tipo: x.tipo, titulo: x.titulo, texto: x.texto || null, opcoes: op(x.opcoes) });
    add(dt, n, 21, 30, { tipo: "mensagem", titulo: "Antes de dormir 🌙", texto: DA_FIMDIA[r] });
  }
  if(!L.length) return toast("Não há dias futuros sem publicação para gerar.");
  if(!confirm(`Programar ${L.length} publicações? Antes do Dia 1: 3 recados por dia para aquecer o grupo. Nos 21 dias: até 6 por dia (7h, 10h, 13h, 16h, 19h30 e 21h30). Você pode editar ou apagar qualquer uma. Nenhuma avisa no celular (o aviso do dia e o lembrete já são automáticos).`)) return;
  try{ for(let i = 0; i < L.length; i += 50){ const r = await SB2().from("d21_posts").insert(L.slice(i, i + 50)); if(r.error) throw r.error; } toast(`${L.length} publicações programadas 💚`); daComunidade(); }
  catch(err){ toast("Não deu para gerar: " + (err.message || "erro")); }
}

/* ---------- os 21 dias: rascunho → pré-visualizar → publicar ---------- */
function daDias(){
  const e = DA.ed, D = e.dias || [], pode = daPode(), mudou = JSON.stringify(D) !== JSON.stringify(e.dias_pub || []), hoje = daFase(e) === "andamento" ? daDia(e) : 0;
  $("da-c").innerHTML = `<div class="card"><div class="da-dias-top"><p class="muted" style="margin:0">Mesmo treino-base para todas no mesmo dia. Normal, Hard e Supreme mudam voltas, tempo e descanso (Hard: +20% de tempo e −25% de descanso; Supreme: +40% e −50%). Mudanças aqui <b>não</b> alteram os treinos normais do CK Life.</p>
      <div class="acts">${pode ? `<button class="btn btn-sm" id="da-prev">Pré-visualizar como aluna</button><button class="btn btn-accent btn-sm" id="da-pub" ${mudou || !e.publicado_em ? "" : "disabled"}>${e.publicado_em ? "Publicar alterações" : "Publicar os 21 dias"}</button>` : ""}</div></div>
      <p class="hint" style="margin:6px 0 0">${e.publicado_em ? `Publicado em ${new Date(e.publicado_em).toLocaleString("pt-BR")}. ` : "Ainda não publicado: as alunas não veem os treinos. "}${mudou ? "<b>Há alterações salvas como rascunho.</b>" : "Rascunho igual ao publicado."}</p></div>
    <div class="da-grid">${Array.from({ length: 21 }, (_, i) => { const d = D[i] || {}; return `<button class="da-dia ${hoje === i + 1 ? "hoje" : ""}" data-da-dia="${i}"><small>DIA ${String(i + 1).padStart(2, "0")}${hoje === i + 1 ? " · HOJE" : ""}</small><b>${esc(d.titulo || "(vazio)")}</b><span class="muted">${(d.itens || []).length} exercícios · ${d.rodadas ? `${d.rodadas.normal}/${d.rodadas.hard}/${d.rodadas.supreme} voltas` : ""}</span></button>`; }).join("")}</div>`;
  document.querySelectorAll("[data-da-dia]").forEach(b => b.onclick = () => daEditorDia(+b.dataset.daDia));
  const pv = $("da-prev"); if(pv) pv.onclick = () => daPreview(0);
  const pb = $("da-pub"); if(pb) pb.onclick = async () => {
    if(!confirm("Publicar os 21 dias? As participantes passam a ver esta versão na hora.")) return;
    try{ await daSalvaEd({ dias_pub: DA.ed.dias, publicado_em: new Date().toISOString() }); toast("Publicado! As alunas já veem a nova versão 💚"); daEdicao(); }catch(err){ toast(err.message || "Não deu para publicar"); }
  };
}
function daItensHTML(pref, itens){
  const EX = daEx();
  return `<div class="da-its" id="${pref}-its">${(itens || []).map((it, k) => `<div class="da-it" data-k="${k}"><select class="input" data-f="id">${EX.map(x => `<option value="${x.id}" ${x.id === it[0] ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select>
      <select class="input" data-f="m"><option value="t" ${it[1] !== "r" ? "selected" : ""}>segundos</option><option value="r" ${it[1] === "r" ? "selected" : ""}>repetições</option></select>
      <input class="input" type="number" min="3" max="300" data-f="v" value="${+it[2] || 30}" aria-label="Tempo ou repetições"><input class="input" type="number" min="0" max="180" data-f="d" value="${+it[3] || 0}" aria-label="Descanso (s)">
      <div class="da-it-bt"><button type="button" data-mv="-1" aria-label="Subir">↑</button><button type="button" data-mv="1" aria-label="Descer">↓</button><button type="button" data-rm aria-label="Remover">✕</button></div></div>`).join("")}</div>
    <button type="button" class="btn btn-sm" data-add="${pref}">+ adicionar exercício</button>`;
}
function daLeItens(pref){ return [...document.querySelectorAll(`#${pref}-its .da-it`)].map(r => [r.querySelector('[data-f="id"]').value, r.querySelector('[data-f="m"]').value, Math.max(3, +r.querySelector('[data-f="v"]').value || 30), Math.max(0, +r.querySelector('[data-f="d"]').value || 0)]); }
function daEditorDia(i){
  const e = DA.ed, D = JSON.parse(JSON.stringify((e.dias || [])[i] || { titulo: "", itens: [], rodadas: { normal: 2, hard: 3, supreme: 4 }, descRodada: 45, cardio: { min: 8, itens: [] }, planob: { itens: [], rodadas: 2 } }));
  D.rodadas = D.rodadas || { normal: 2, hard: 3, supreme: 4 }; D.cardio = D.cardio || { min: 8, itens: [] }; D.planob = D.planob || { itens: [], rodadas: 2 };
  const R = daRec();
  modal(`Dia ${String(i + 1).padStart(2, "0")} de 21`, `<div class="formgrid">
    <div class="field full"><label for="dd-t">Título (aparece para todas)</label><input class="input" id="dd-t" maxlength="60" value="${esc(D.titulo || "")}" placeholder="Ex.: Pernas + Cardio"></div>
    <div class="field full"><label for="dd-m">Mensagem da Micaela no dia</label><textarea class="input" id="dd-m" maxlength="400" rows="2">${esc(D.msg || "")}</textarea></div>
    <div class="field full"><label>Treino principal</label>${daItensHTML("dd-tr", D.itens)}<small class="muted">Cada linha: exercício · segundos ou repetições · descanso depois (segundos).</small></div>
    <div class="field"><label for="dd-rn">Voltas Normal</label><input class="input" type="number" min="1" max="8" id="dd-rn" value="${D.rodadas.normal}"></div>
    <div class="field"><label for="dd-rh">Voltas Hard</label><input class="input" type="number" min="1" max="8" id="dd-rh" value="${D.rodadas.hard}"></div>
    <div class="field"><label for="dd-rs">Voltas Supreme</label><input class="input" type="number" min="1" max="8" id="dd-rs" value="${D.rodadas.supreme}"></div>
    <div class="field"><label for="dd-dr">Descanso entre voltas (s)</label><input class="input" type="number" min="0" max="180" id="dd-dr" value="${D.descRodada || 45}"></div>
    <div class="field full"><label>❤️ Movimento (cardio extra)</label><div style="display:flex;gap:8px;align-items:center"><input class="input" type="number" min="3" max="30" id="dd-cm" value="${D.cardio.min || 8}" style="max-width:90px"><span class="muted">minutos</span></div>${daItensHTML("dd-ca", D.cardio.itens)}</div>
    <div class="field full"><label>💚 Plano B (10 minutos)</label>${daItensHTML("dd-pb", D.planob.itens)}<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><input class="input" type="number" min="1" max="4" id="dd-pr" value="${D.planob.rodadas || 2}" style="max-width:90px"><span class="muted">voltas</span></div></div>
    <div class="field full"><label for="dd-rc">🥗 Receita CK do dia</label><select class="input" id="dd-rc"><option value="">Automática (uma receita gratuita diferente por dia)</option>${R.map(r => `<option value="${esc(r.id)}" ${r.id === D.receita ? "selected" : ""}>${esc(r.nome)}</option>`).join("")}</select></div>
    <div class="field full"><label for="dd-ms">🎯 Desafio extra do dia (missão)</label><input class="input" id="dd-ms" maxlength="80" value="${esc(D.missao || "")}" placeholder="Ex.: Beber 8 copos de água"></div>
  </div><div id="dd-msg"></div><div class="acts" style="margin-top:12px"><button class="btn" id="dd-prev">Pré-visualizar</button><button class="btn btn-accent" id="dd-ok" ${daPode() ? "" : "disabled"}>Salvar rascunho do dia</button></div>`);
  const liga = () => {
    document.querySelectorAll("#mbox [data-add]").forEach(b => b.onclick = () => { const p = b.dataset.add, L = daLeItens(p); L.push(["polichinelo", "t", 40, 20]); $(p + "-its").outerHTML = daItensHTML(p, L).split('<button type="button" class="btn btn-sm" data-add')[0]; liga(); });
    document.querySelectorAll("#mbox .da-it [data-rm]").forEach(b => b.onclick = () => { b.closest(".da-it").remove(); });
    document.querySelectorAll("#mbox .da-it [data-mv]").forEach(b => b.onclick = () => { const r = b.closest(".da-it"), mv = +b.dataset.mv; if(mv < 0 && r.previousElementSibling) r.parentNode.insertBefore(r, r.previousElementSibling); if(mv > 0 && r.nextElementSibling) r.parentNode.insertBefore(r.nextElementSibling, r); });
  };
  liga();
  const le = () => ({ ...D, titulo: val("dd-t"), msg: val("dd-m"), itens: daLeItens("dd-tr"), rodadas: { normal: Math.max(1, +val("dd-rn") || 2), hard: Math.max(1, +val("dd-rh") || 3), supreme: Math.max(1, +val("dd-rs") || 4) }, descRodada: Math.max(0, +val("dd-dr") || 0),
    cardio: { min: Math.max(3, +val("dd-cm") || 8), itens: daLeItens("dd-ca") }, planob: { itens: daLeItens("dd-pb"), rodadas: Math.max(1, +val("dd-pr") || 2) }, receita: val("dd-rc") || null, missao: val("dd-ms") });
  $("dd-prev").onclick = () => daPreviewDia(le(), i);
  $("dd-ok").onclick = async () => {
    const n = le(); if(!n.titulo) return $("dd-msg").innerHTML = `<div class="msg msg-bad">Dê um título ao dia.</div>`; if(!n.itens.length) return $("dd-msg").innerHTML = `<div class="msg msg-bad">Coloque pelo menos um exercício no treino.</div>`;
    const dias = JSON.parse(JSON.stringify(DA.ed.dias || [])); while(dias.length < 21) dias.push({}); dias[i] = n;
    try{ await daSalvaEd({ dias }); fechar(); toast("Rascunho salvo. Toque em Publicar para as alunas verem."); daEdicao(); }catch(err){ $("dd-msg").innerHTML = `<div class="msg msg-bad">${esc(err.message || "Não deu para salvar")}</div>`; }
  };
}
/* pré-visualização: como a aluna vê o dia em cada modo */
function daPreviewDia(D, i){
  const mins = modo => { const mult = { normal: 1, hard: 1.2, supreme: 1.4 }[modo], md = { normal: 1, hard: .75, supreme: .5 }[modo], rod = (D.rodadas || {})[modo] || 1;
    const porVolta = (D.itens || []).reduce((a, it) => a + (it[1] === "r" ? it[2] * 3.2 : it[2]) * mult + (it[3] || 0) * md, 0); return Math.max(1, Math.round((porVolta * rod + (D.descRodada || 0) * md * (rod - 1)) / 60)); };
  const lista = its => (its || []).map(it => `<li>${esc(F.exById(it[0]).nome || it[0])} <small class="muted">${it[1] === "r" ? it[2] + " repetições" : it[2] + "s"}${it[3] ? ` · descanso ${it[3]}s` : ""}</small></li>`).join("");
  modal(`Como a aluna vê · Dia ${String(i + 1).padStart(2, "0")}`, `<div class="da-prev"><span class="da-prev-eye">DIA ${String(i + 1).padStart(2, "0")} DE 21</span><h2>${esc(D.titulo || "")}</h2>${D.msg ? `<p>“${esc(D.msg)}”</p>` : ""}
    <div class="grid g3">${["normal", "hard", "supreme"].map(m => `<div class="card"><b>${m[0].toUpperCase() + m.slice(1)}</b><span class="muted">${(D.rodadas || {})[m] || 1} voltas · ~${mins(m)} min</span></div>`).join("")}</div>
    <h3>🏋️ Treino</h3><ol>${lista(D.itens)}</ol><h3>❤️ Movimento · ${(D.cardio || {}).min || 8} min</h3><ol>${lista((D.cardio || {}).itens)}</ol><h3>💚 Plano B</h3><ol>${lista((D.planob || {}).itens)}</ol>
    ${D.missao ? `<h3>🎯 Desafio extra</h3><p>${esc(D.missao)}</p>` : ""}</div><div class="acts" style="margin-top:12px"><button class="btn" id="dpv-volta">Voltar</button></div>`);
  $("dpv-volta").onclick = () => daEditorDia(i);
}
function daPreview(i){
  const D = (DA.ed.dias || [])[i] || {};
  daPreviewDia(D, i);
  const a = document.querySelector("#mbox .acts"); if(!a) return;
  a.innerHTML = `<button class="btn" id="dpv-a" ${i ? "" : "disabled"}>‹ Dia anterior</button><button class="btn" id="dpv-p" ${i < 20 ? "" : "disabled"}>Próximo dia ›</button><button class="btn btn-accent" data-close>Fechar</button>`;
  $("dpv-a").onclick = () => daPreview(i - 1); $("dpv-p").onclick = () => daPreview(i + 1);
}

/* ---------- comunidade da edição (só a equipe publica) ---------- */
const DA_TIPOS = { mensagem: "Mensagem", aviso: "📢 Aviso", chamada: "🔥 Chamada", enquete: "📊 Enquete", checkin: "💚 Check-in", conquista: "🏆 Conquista coletiva" };
async function daCarregaPosts(){
  const [p, c] = await Promise.all([SB2().from("d21_posts").select("*").eq("edicao_id", DA.ed.id).order("publicar_em", { ascending: false }).limit(300), SB2().rpc("d21_admin_contagens", { p_edicao: DA.ed.id })]);
  if(p.error) throw p.error; DA.posts = (p.data || []).filter(x => !x.apagado); DA.cont = (c && c.data) || {};
}
function daComunidade(){
  $("da-c").innerHTML = daSem("Carregando publicações…");
  daCarregaPosts().then(() => {
    const el = $("da-c"); if(!el || DA.aba !== "comunidade") return; const agora = Date.now(), pode = daPode();
    el.innerHTML = `<div class="card"><div class="da-dias-top"><p class="muted" style="margin:0">Só a equipe publica. As participantes reagem (🔥 💚 💪 😍 🥵), votam e fazem check-in. Não enviam texto, foto, vídeo, áudio, link nem GIF.</p>
        ${pode ? `<div class="acts"><button class="btn btn-sm" id="da-gera">✨ Gerar publicações (espera + 21 dias)</button><button class="btn btn-accent btn-sm" id="da-np">+ Nova publicação</button></div>` : ""}</div>
        ${pode ? `<div class="acts" style="margin-top:8px"><span class="muted" style="font-size:13px">Modelos rápidos:</span><button class="btn btn-sm" data-modelo="dia">🔥 Dia N começou</button><button class="btn btn-sm" data-modelo="treinou">Quem já treinou?</button><button class="btn btn-sm" data-modelo="hora">Que horas vai treinar?</button><button class="btn btn-sm" data-modelo="como">Como vocês estão?</button></div>` : ""}</div>
      ${DA.posts.length ? DA.posts.map(p => { const C = DA.cont[p.id] || {}, prog = Date.parse(p.publicar_em) > agora, reac = Object.entries(C).filter(([k]) => k.startsWith("r:")).map(([k, n]) => `${k.slice(2)} ${int(n)}`).join("  "), vt = (p.opcoes || []).map(o => `${esc(o.t)}: <b>${int(C["v:" + o.id] || 0)}</b>`).join(" · ");
        return `<div class="card da-post"><div class="da-ed-top"><span class="st ${prog ? "off" : "ok"}">${prog ? "Programada " + new Date(p.publicar_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Publicada " + new Date(p.publicar_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span><small class="muted">${DA_TIPOS[p.tipo]}${p.fixado ? " · 📌 fixada" : ""}${p.notificar ? (p.notificado ? " · aviso enviado" : " · vai avisar no celular") : ""}</small></div>
          ${p.titulo ? `<h3 style="margin:4px 0">${esc(p.titulo)}</h3>` : ""}${p.texto ? `<p style="margin:0">${esc(p.texto)}</p>` : ""}${vt ? `<p class="muted" style="margin:6px 0 0">${vt}</p>` : ""}
          <p class="muted" style="margin:6px 0 0;font-size:13px">👁 ${int(C.vistas || 0)} ${reac ? " · " + reac : ""}</p>
          ${pode ? `<div class="acts"><button class="btn btn-sm" data-pfix="${p.id}">${p.fixado ? "Desafixar" : "📌 Fixar"}</button><button class="btn btn-sm" data-ped="${p.id}">Editar</button><button class="btn btn-sm" data-pdel="${p.id}">Apagar</button></div>` : ""}</div>`; }).join("") : daSem("Nenhuma publicação ainda.")}`;
    const np = $("da-np"); if(np) np.onclick = () => daFormPost(null);
    const gp = $("da-gera"); if(gp) gp.onclick = daGeraPosts;
    el.querySelectorAll("[data-modelo]").forEach(b => b.onclick = () => daFormPost(null, b.dataset.modelo));
    el.querySelectorAll("[data-ped]").forEach(b => b.onclick = () => daFormPost(DA.posts.find(p => p.id === b.dataset.ped)));
    el.querySelectorAll("[data-pfix]").forEach(b => b.onclick = async () => { const p = DA.posts.find(x => x.id === b.dataset.pfix); const r = await SB2().from("d21_posts").update({ fixado: !p.fixado }).eq("id", p.id); if(r.error) return toast(r.error.message); toast(p.fixado ? "Desafixada" : "Fixada no topo 📌"); daComunidade(); });
    el.querySelectorAll("[data-pdel]").forEach(b => b.onclick = async () => { if(!confirm("Apagar esta publicação? Ela some para as participantes.")) return; const r = await SB2().from("d21_posts").update({ apagado: true, fixado: false }).eq("id", b.dataset.pdel); if(r.error) return toast(r.error.message); toast("Publicação apagada"); daComunidade(); });
  }).catch(e => { const el = $("da-c"); if(el) el.innerHTML = daSem("Não deu para carregar: " + esc(e.message || "erro")); });
}
function daFormPost(p, modelo){
  const dia = Math.max(1, Math.min(21, daDia(DA.ed)));
  const M = { dia: { tipo: "chamada", titulo: `🔥 DIA ${dia} COMEÇOU!`, texto: "Treino do dia liberado. Quem vem comigo?", botao: "treino", fixado: true, notificar: true },
    treinou: { tipo: "checkin", titulo: "Quem já treinou hoje?", opcoes: [{ id: "ja", t: "Já treinei 🔥" }, { id: "vou", t: "Ainda vou 💪" }, { id: "planob", t: "Hoje vai ser Plano B 💚" }] },
    hora: { tipo: "enquete", titulo: "QUE HORAS VOCÊ VAI TREINAR?", opcoes: [{ id: "m", t: "Manhã" }, { id: "t", t: "Tarde" }, { id: "n", t: "Noite" }, { id: "ja", t: "Já treinei 🔥" }] },
    como: { tipo: "checkin", titulo: "COMO VOCÊ ESTÁ HOJE?", opcoes: [{ id: "voando", t: "🔥 Tô voando" }, { id: "firme", t: "💪 Tô firme" }, { id: "puxado", t: "🥵 Tá puxado" }, { id: "naoparo", t: "💚 Mas não vou parar" }] } };
  const x = p || { tipo: "mensagem", titulo: "", texto: "", opcoes: [], multipla: false, pode_mudar: true, resultado: "sempre", fixado: false, botao: null, dia, notificar: false, ...(modelo ? M[modelo] : {}) };
  const loc = d => { const z = new Date(d), o = z.getTimezoneOffset(); return new Date(z - o * 6e4).toISOString().slice(0, 16); };
  modal(p ? "Editar publicação" : "Nova publicação", `<div class="formgrid">
    <div class="field"><label for="dp-tp">Tipo</label><select class="input" id="dp-tp">${Object.entries(DA_TIPOS).map(([k, t]) => `<option value="${k}" ${x.tipo === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="field"><label for="dp-dia">Dia do desafio (opcional)</label><input class="input" type="number" min="1" max="21" id="dp-dia" value="${x.dia || ""}"></div>
    <div class="field full"><label for="dp-ti">Título</label><input class="input" id="dp-ti" maxlength="120" value="${esc(x.titulo || "")}" placeholder="🔥 DIA 8/21!"></div>
    <div class="field full"><label for="dp-tx">Texto</label><textarea class="input" id="dp-tx" maxlength="2000" rows="3" placeholder="Quem vai treinar comigo hoje?">${esc(x.texto || "")}</textarea></div>
    <div class="field full" id="dp-opbox"><label for="dp-op">Opções (uma por linha)</label><textarea class="input" id="dp-op" rows="4" placeholder="Manhã\nTarde\nNoite">${esc((x.opcoes || []).map(o => o.t).join("\n"))}</textarea>
      <div class="acts" style="margin-top:6px"><label class="chk"><input type="checkbox" id="dp-mu" ${x.multipla ? "checked" : ""}> Pode marcar mais de uma</label><label class="chk"><input type="checkbox" id="dp-pm" ${x.pode_mudar !== false ? "checked" : ""}> Pode mudar a resposta</label></div>
      <div class="formgrid" style="margin-top:6px"><div class="field"><label for="dp-rs">Mostrar resultado</label><select class="input" id="dp-rs"><option value="sempre" ${x.resultado === "sempre" ? "selected" : ""}>Sempre</option><option value="depois" ${x.resultado === "depois" ? "selected" : ""}>Depois que ela votar</option><option value="fim" ${x.resultado === "fim" ? "selected" : ""}>Só quando encerrar</option></select></div>
      <div class="field"><label for="dp-pz">Encerra em (opcional)</label><input class="input" type="datetime-local" id="dp-pz" value="${x.prazo ? loc(x.prazo) : ""}"></div></div></div>
    <div class="field"><label for="dp-bt">Botão na publicação</label><select class="input" id="dp-bt"><option value="">Nenhum</option><option value="treino" ${x.botao === "treino" ? "selected" : ""}>Começar treino</option><option value="receita" ${x.botao === "receita" ? "selected" : ""}>Ver receita do dia</option><option value="jornada" ${x.botao === "jornada" ? "selected" : ""}>Ver minha jornada</option><option value="whatsapp" ${x.botao === "whatsapp" ? "selected" : ""}>Grupo do WhatsApp</option></select></div>
    <div class="field"><label for="dp-qd">Quando publicar</label><select class="input" id="dp-qd"><option value="agora">Publicar agora</option><option value="prog" ${p && Date.parse(p.publicar_em) > Date.now() ? "selected" : ""}>Programar</option></select></div>
    <div class="field" id="dp-qbox"><label for="dp-em">Data e hora</label><input class="input" type="datetime-local" id="dp-em" value="${loc(p ? p.publicar_em : Date.now() + 36e5)}"></div>
    <div class="field full"><label class="chk"><input type="checkbox" id="dp-fx" ${x.fixado ? "checked" : ""}> 📌 Fixar no topo</label><label class="chk"><input type="checkbox" id="dp-nt" ${x.notificar ? "checked" : ""} ${p && p.notificado ? "disabled" : ""}> Avisar as participantes no celular${p && p.notificado ? " (já avisado)" : ""}</label></div>
  </div><div id="dp-msg"></div><div class="acts" style="margin-top:12px"><button class="btn" data-close>Cancelar</button><button class="btn btn-accent" id="dp-ok">${p ? "Salvar" : "Publicar"}</button></div>`);
  const sync = () => { $("dp-opbox").hidden = !["enquete", "checkin"].includes($("dp-tp").value); $("dp-qbox").hidden = $("dp-qd").value !== "prog"; $("dp-ok").textContent = p ? "Salvar" : $("dp-qd").value === "prog" ? "Programar" : "Publicar agora"; };
  $("dp-tp").onchange = sync; $("dp-qd").onchange = sync; sync();
  $("dp-ok").onclick = async () => {
    const tipo = val("dp-tp"), voto = ["enquete", "checkin"].includes(tipo), linhas = voto ? val("dp-op").split("\n").map(s => s.trim()).filter(Boolean).slice(0, 8) : [];
    const msg = t => $("dp-msg").innerHTML = `<div class="msg msg-bad">${t}</div>`;
    if(!val("dp-ti") && !val("dp-tx")) return msg("Escreva um título ou um texto.");
    if(voto && linhas.length < 2) return msg("Coloque pelo menos 2 opções.");
    const velhas = (x.opcoes || []), opcoes = linhas.map((t, k) => { const v = velhas.find(o => o.t === t); return { id: v ? v.id : "o" + (k + 1) + Math.random().toString(36).slice(2, 5), t: t.slice(0, 60) }; });
    const prog = val("dp-qd") === "prog", em = prog ? new Date(val("dp-em")).toISOString() : (p && Date.parse(p.publicar_em) <= Date.now() ? p.publicar_em : new Date().toISOString());
    const d = { edicao_id: DA.ed.id, tipo, titulo: val("dp-ti") || null, texto: val("dp-tx") || null, opcoes, multipla: voto && $("dp-mu").checked, pode_mudar: !voto || $("dp-pm").checked, resultado: val("dp-rs") || "sempre",
      prazo: voto && val("dp-pz") ? new Date(val("dp-pz")).toISOString() : null, fixado: $("dp-fx").checked, botao: val("dp-bt") || null, dia: +val("dp-dia") || null, publicar_em: em, notificar: $("dp-nt").checked };
    const b = $("dp-ok"); b.disabled = true;
    try{ if(d.fixado){ await SB2().from("d21_posts").update({ fixado: false }).eq("edicao_id", DA.ed.id).eq("fixado", true); }   // um fixado por vez
      const r = p ? await SB2().from("d21_posts").update(d).eq("id", p.id) : await SB2().from("d21_posts").insert(d); if(r.error) throw r.error;
      fechar(); toast(prog ? "Programada 💚" : "Publicada para a turma 💚"); daComunidade(); }
    catch(err){ msg(esc(err.message || "Não deu para salvar")); b.disabled = false; }
  };
}

/* ---------- configurações da edição / nova edição ---------- */
function daConfig(){ $("da-c").innerHTML = ""; daFormEdicao(DA.ed, $("da-c")); }
function daFormEdicao(e, alvo){
  const novo = !e, prox = (DA.lista || []).reduce((a, x) => Math.max(a, x.numero || 0), 0) + 1;
  e = e || { numero: prox, nome: "CK 21 Dias Juntas", frase: "21 dias juntas. Não 21 dias perfeitos.", descricao: "", capa: "", inscricao_ini: today(), inicio: addD(today(), 14), status: "rascunho", whatsapp: "", config: { hora_dia: 7, hora_lembrete: 19, notificar: true } };
  const cf = e.config || {}, html = `<div class="card"><div class="formgrid">
    <div class="field"><label for="de-nm">Nome</label><input class="input" id="de-nm" maxlength="80" value="${esc(e.nome)}"></div>
    <div class="field"><label for="de-nu">Número da edição</label><input class="input" type="number" min="1" id="de-nu" value="${e.numero}"></div>
    <div class="field full"><label for="de-fr">Frase</label><input class="input" id="de-fr" maxlength="140" value="${esc(e.frase || "")}"></div>
    <div class="field full"><label for="de-ds">Descrição (aparece na página antes de entrar)</label><textarea class="input" id="de-ds" maxlength="3000" rows="4">${esc(e.descricao || "")}</textarea></div>
    <div class="field full"><label for="de-cp">Capa (link https da imagem, opcional)</label><input class="input" id="de-cp" value="${esc(e.capa || "")}" placeholder="https://..."></div>
    <div class="field"><label for="de-ii">Inscrições abrem em</label><input class="input" type="date" id="de-ii" value="${e.inscricao_ini || ""}"></div>
    <div class="field"><label for="de-in">Início (Dia 1)</label><input class="input" type="date" id="de-in" value="${e.inicio}"><small class="muted" id="de-fim">Término (Dia 21): ${daBr(addD(e.inicio, 20))}</small></div>
    <div class="field"><label for="de-st">Status</label><select class="input" id="de-st">${["rascunho", "inscricoes", "aguardando", "andamento", "finalizada", "arquivada"].map(s => `<option value="${s}" ${e.status === s ? "selected" : ""}>${DA_FASE[s][0]}</option>`).join("")}</select><small class="muted">Inscrições abertas = aparece no app. O dia vira "Em andamento" e "Finalizada" sozinho pelas datas.</small></div>
    <div class="field"><label for="de-wa">Grupo do WhatsApp (opcional)</label><input class="input" id="de-wa" value="${esc(e.whatsapp || "")}" placeholder="https://chat.whatsapp.com/..."></div>
    <div class="field"><label class="chk"><input type="checkbox" id="de-nt" ${cf.notificar !== false ? "checked" : ""}> Avisos automáticos no celular</label><small class="muted">"O Dia N começou" e o lembrete para quem ainda não treinou.</small></div>
    <div class="field"><label for="de-hd">Hora do aviso "Dia começou"</label><input class="input" type="number" min="5" max="12" id="de-hd" value="${cf.hora_dia ?? 7}"></div>
    <div class="field"><label for="de-hl">Hora do lembrete</label><input class="input" type="number" min="12" max="21" id="de-hl" value="${cf.hora_lembrete ?? 19}"></div>
  </div><div id="de-msg"></div><div class="acts" style="margin-top:12px">${novo ? `<button class="btn" data-close>Cancelar</button>` : (e.status === "rascunho" && daPode() ? `<button class="btn" id="de-del">Apagar rascunho</button>` : "")}<button class="btn btn-accent" id="de-ok" ${daPode() ? "" : "disabled"}>${novo ? "Criar edição" : "Salvar"}</button></div>
  ${novo ? `<p class="hint" style="margin:8px 0 0">A edição nasce com o plano-base dos 21 dias como rascunho. Ajuste em "Os 21 dias" e publique quando estiver pronto.</p>` : ""}</div>`;
  if(alvo) alvo.innerHTML = html; else modal("Nova edição", html);
  $("de-in").oninput = () => { const v = val("de-in"); $("de-fim").textContent = "Término (Dia 21): " + (v ? daBr(addD(v, 20)) : "–"); };
  const del = $("de-del"); if(del) del.onclick = async () => { if(!confirm("Apagar este rascunho? Não dá para desfazer.")) return; const r = await SB2().from("d21_edicoes").delete().eq("id", e.id); if(r.error) return toast(r.error.message); DA.ed = null; toast("Rascunho apagado"); rerender(); };
  $("de-ok").onclick = async () => {
    const msg = t => $("de-msg").innerHTML = `<div class="msg msg-bad">${t}</div>`, ini = val("de-in"), wa = val("de-wa"), cp = val("de-cp");
    if(!val("de-nm")) return msg("Dê um nome à edição."); if(!ini) return msg("Escolha a data de início.");
    if(wa && !/^https:\/\/(chat\.whatsapp\.com|wa\.me|whatsapp\.com|api\.whatsapp\.com)\//.test(wa)) return msg("O link do WhatsApp precisa começar com https://chat.whatsapp.com/");
    if(cp && !/^https:\/\//.test(cp)) return msg("A capa precisa ser um link https.");
    const d = { nome: val("de-nm"), numero: Math.max(1, +val("de-nu") || 1), frase: val("de-fr"), descricao: val("de-ds") || null, capa: cp || null, inscricao_ini: val("de-ii") || null, inicio: ini, fim: addD(ini, 20), status: val("de-st"), whatsapp: wa || null,
      config: { ...(e.config || {}), notificar: $("de-nt").checked, hora_dia: Math.min(12, Math.max(5, +val("de-hd") || 7)), hora_lembrete: Math.min(21, Math.max(12, +val("de-hl") || 19)) } };
    if(d.status !== "rascunho" && !(novo ? false : e.publicado_em) && !confirm("Os 21 dias ainda não foram publicados. As alunas vão ver o desafio, mas sem treino até você publicar. Continuar?")) return;
    try{ if(novo){ const plano = window.CK_D21_PLANO ? window.CK_D21_PLANO() : []; const r = await SB2().from("d21_edicoes").insert({ ...d, dias: plano }).select(); if(r.error) throw r.error; DA.ed = r.data && r.data[0]; fechar(); toast("Edição criada 💚"); DA.aba = "dias"; DA.lista = null; rerender(); }
      else { await daSalvaEd(d); toast("Salvo 💚"); daEdicao(); } }
    catch(err){ msg(esc(/check constraint/.test(err.message || "") ? "Confira as datas e os links." : err.message || "Não deu para salvar")); }
  };
}
/* ---------- duplicar edição (copia conteúdo; nunca participantes, votos, reações, progresso ou métricas) ---------- */
function daDuplicar(e){
  const prox = (DA.lista || []).reduce((a, x) => Math.max(a, x.numero || 0), 0) + 1;
  modal(`Duplicar · Edição #${String(e.numero).padStart(2, "0")}`, `<div class="formgrid">
    <div class="field"><label for="du-nu">Nova edição nº</label><input class="input" type="number" id="du-nu" value="${prox}"></div>
    <div class="field"><label for="du-in">Início (Dia 1)</label><input class="input" type="date" id="du-in" value="${addD(today() > e.fim ? today() : e.fim, 14)}"></div>
    <div class="field full"><label class="chk"><input type="checkbox" id="du-d" checked> Copiar os 21 dias (treinos, receitas, missões e mensagens do dia)</label>
      <label class="chk"><input type="checkbox" id="du-c" checked> Copiar configurações (nome, frase, descrição, capa, avisos, WhatsApp)</label>
      <label class="chk"><input type="checkbox" id="du-p"> Copiar as publicações da comunidade como programadas (nas mesmas posições de dia)</label></div></div>
    <p class="hint">Nunca são copiados: participantes, votos, reações, check-ins, progresso e métricas. A nova edição nasce como rascunho.</p>
    <div id="du-msg"></div><div class="acts"><button class="btn" data-close>Cancelar</button><button class="btn btn-accent" id="du-ok">Duplicar</button></div>`);
  $("du-ok").onclick = async () => {
    const ini = val("du-in"); if(!ini) return; const b = $("du-ok"); b.disabled = true;
    const cfg = $("du-c").checked, d = { numero: Math.max(1, +val("du-nu") || prox), inicio: ini, fim: addD(ini, 20), status: "rascunho", nome: cfg ? e.nome : "CK 21 Dias Juntas", frase: cfg ? e.frase : undefined, descricao: cfg ? e.descricao : null, capa: cfg ? e.capa : null,
      whatsapp: cfg ? e.whatsapp : null, config: cfg ? e.config : undefined, dias: $("du-d").checked ? e.dias : (window.CK_D21_PLANO ? window.CK_D21_PLANO() : []), inscricao_ini: today() };
    Object.keys(d).forEach(k => d[k] === undefined && delete d[k]);
    try{ const r = await SB2().from("d21_edicoes").insert(d).select(); if(r.error) throw r.error; const nova = r.data[0];
      if($("du-p").checked){ const ps = await SB2().from("d21_posts").select("*").eq("edicao_id", e.id); ps.data = (ps.data || []).filter(x => !x.apagado); const delta = Date.parse(ini + "T12:00:00Z") - Date.parse(e.inicio + "T12:00:00Z");
        const L = (ps.data || []).map(p => ({ edicao_id: nova.id, tipo: p.tipo, titulo: p.titulo, texto: p.texto, opcoes: p.opcoes, multipla: p.multipla, pode_mudar: p.pode_mudar, resultado: p.resultado, prazo: p.prazo ? new Date(Date.parse(p.prazo) + delta).toISOString() : null,
          fixado: false, botao: p.botao, dia: p.dia, publicar_em: new Date(Date.parse(p.publicar_em) + delta).toISOString(), notificar: p.notificar }));
        if(L.length){ const x = await SB2().from("d21_posts").insert(L); if(x.error) throw x.error; } }
      fechar(); toast("Edição duplicada como rascunho 💚"); DA.ed = nova; DA.aba = "config"; DA.lista = null; rerender(); }
    catch(err){ $("du-msg").innerHTML = `<div class="msg msg-bad">${esc(err.message || "Não deu para duplicar")}</div>`; b.disabled = false; }
  };
}
