/* ===================== 🔥 CK 21 DIAS JUNTAS (experiência própria dentro do CK Life) =====================
   - Edições em turma: todas no mesmo dia (o dia vem do servidor, fuso America/Sao_Paulo).
   - "App dentro do app": tela própria por cima do CK Life (Hoje · Comunidade · Jornada).
     "← CK Life" só fecha a tela; não sai do desafio. "Sair do desafio" fica na Jornada, com confirmação.
   - Reaproveita login, exercícios, player de treino, água, receitas, avisos e compartilhar do CK Life.
   - Comunidade controlada: só a equipe publica; participante reage, vota e faz check-in.
   - Sem edição publicada pela equipe, nada disso aparece no app. */
const D21 = { st: null, t: 0, off: 0, aba: "hoje", feed: null, feedFim: false, vistos: new Set(), aberto: false, pend: null };
const D21_K = "ck_d21_in", D21_FILA = "ck_d21_fila";
const D21_MODOS = { normal: ["Normal", "Para começar firme"], hard: ["Hard", "Mais tempo e menos descanso"], supreme: ["Supreme", "Volume e intensidade máximos"] };
const D21_REACOES = ["🔥", "💚", "💪", "😍", "🥵"];
const d21On = () => !!(NU && NU.ativo && NU.sb && NU.uid);
const d21Ev = (n, p) => { try{ registraEvento(n, p || {}); }catch(e){} };
const d21Pad = n => String(n).padStart(2, "0");

/* ---------- plano-base dos 21 dias (a equipe edita no painel; isto é só o ponto de partida) ---------- */
window.CK_D21_PLANO = function(){
  const C = ["polichinelo", "corrida", "skater", "escalador", "agachsalto", "burpee"], CO = ["prancha", "abdsupra", "abdinfra", "bicicleta", "deadbug", "russo", "pranchalat", "hollow"];
  const P = { full: ["agacho", "flexjoelho", "escalador", "ponte", "polichinelo", "prancha"], pernas: ["agacho", "afundocasa", "sumocasa", "wallsit", "panturrilha"], gluteo: ["ponte", "coice", "elevlatdeit", "hidrante", "pontealt"],
    sup: ["flexjoelho", "flexdiam", "pike", "toqueombro", "supermann"], core: ["prancha", "abdsupra", "bicicleta", "deadbug", "pranchalat"], hiit: ["polichinelo", "agachsalto", "escalador", "skater", "corrida", "burpee"],
    mob: ["along", "crianca", "alongquad", "perdigueiro", "ponte"] };
  const DIAS = [
    ["Full body + cardio", "full", "full", 2, "Dia 1. Hoje a gente só precisa começar. Bora juntas?"],
    ["Pernas + cardio", "pernas", "pernas", 1, "Pernas firmes, cabeça leve. Faz no seu ritmo."],
    ["Superior + core", "sup", "core", 0, "Braços, costas e abdômen. Respira e vai."],
    ["Cardio leve", "hiit", null, 0, "Coração acelerado, sem pressa de ser perfeita."],
    ["Glúteos + cardio", "gluteo", "gluteo", 1, "Glúteos ativados. Aperta no topo de cada movimento."],
    ["Core + cardio", "core", "core", 1, "Centro do corpo forte = tudo fica mais fácil."],
    ["Recuperação ativa", "mob", null, 0, "Recuperar também é treino. E conta como dia oficial 💚"],
    ["Pernas + cardio", "pernas", "pernas", 2, "Semana 2 começou. Um pouco mais de tempo em cada exercício."],
    ["Superior + cardio", "sup", "sup", 1, "Hoje os braços trabalham e o coração acompanha."],
    ["HIIT", "hiit", null, 0, "Curto e intenso. Pausa quando precisar."],
    ["Glúteos + core", "gluteo", "core", 1, "Força de dentro pra fora."],
    ["Full body resistência", "full", "full", 2, "Metade do caminho chegando. Olha você aqui!"],
    ["Cardio + core", "hiit", "core", 1, "Suar hoje é presente pro seu amanhã."],
    ["Recuperação ativa", "mob", null, 0, "14 dias juntas. Hoje é dia de soltar o corpo."],
    ["Full body força", "full", "full", 2, "Semana 3: a mais intensa. Você está pronta."],
    ["Pernas + HIIT", "pernas", "hiit", 2, "Pernas e fôlego. Você já é outra pessoa que no Dia 1."],
    ["Superior + core", "sup", "core", 1, "Postura de quem não desiste."],
    ["Cardio intenso", "hiit", null, 0, "Hoje é o dia de suar de verdade. No seu limite, não no da outra."],
    ["Glúteos + pernas", "gluteo", "pernas", 1, "Faltam só 3 dias. Que orgulho!"],
    ["Mobilidade + core leve", "mob", "core", 0, "Prepara o corpo pro grande final."],
    ["Desafio final 🏆", "full", "hiit", 2, "DIA 21. Você chegou. Hoje a turma fecha junta!"]];
  return DIAS.map(([titulo, a, b, nb, msg], i) => {
    const sem = Math.floor(i / 7), seg = [35, 40, 45][sem], desc = [20, 20, 15][sem], mob = a === "mob";
    const itens = [...P[a].map(id => [id, "t", mob ? 40 : seg, mob ? 10 : desc]), ...(b ? P[b].slice(0, nb + 2) : []).filter(id => !P[a].includes(id)).map(id => [id, "t", seg, desc])].slice(0, 8);
    const base = mob ? 1 : sem === 2 ? 3 : 2;
    return { titulo, foco: a, msg, itens, descRodada: mob ? 15 : 45,
      rodadas: { normal: base, hard: mob ? 2 : base + 1, supreme: mob ? 2 : base + 2 },
      cardio: { min: mob ? 5 : [6, 8, 10][sem], itens: C.slice((i % 3), (i % 3) + 4).map(id => [id, "t", 40, 20]) },
      planob: { itens: [...P[a].slice(0, 3), C[i % C.length], CO[i % CO.length]].map(id => [id, "t", 40, 20]), rodadas: 2 },
      receita: null, missao: ["Beber água a cada treino", "Dormir 7 horas hoje", "10 minutos de caminhada extra", "Comer uma fruta no lanche", "Alongar 5 minutos antes de dormir"][i % 5] };
  });
};

/* ---------- dados ---------- */
async function d21Carrega(forca){
  if(!d21On()) return null;
  if(!forca && D21.st && Date.now() - D21.t < 90000) return D21.st;
  try{ const r = await SB().rpc("d21_estado"); if(r.error) throw r.error; D21.st = r.data || null; D21.t = Date.now();
    if(D21.st && D21.st.agora) D21.off = Date.parse(D21.st.agora) - Date.now();
    try{ localStorage.setItem("ck_d21_cache", JSON.stringify(D21.st)); }catch(e){}
    d21Fila(); }
  catch(e){ if(!D21.st){ try{ D21.st = JSON.parse(localStorage.getItem("ck_d21_cache") || "null"); }catch(x){} } }
  return D21.st;
}
const d21Ed = () => D21.st && D21.st.edicao;
const d21Insc = () => D21.st && D21.st.inscrita && !D21.st.inscrita.saiu_em;
const d21Dia = () => { const e = d21Ed(); return e ? Math.max(0, Math.min(22, +e.dia)) : 0; };
const d21Regs = () => (D21.st && D21.st.registros) || [];
const d21Reg = d => d21Regs().find(r => +r.dia === d);
const d21Agora = () => Date.now() + D21.off;
function d21DiaConteudo(d){ const e = d21Ed(), L = (e && e.dias) || []; return L[d - 1] || null; }
/* conclusões que não chegaram ao servidor (sem internet): reenviadas no mesmo dia */
async function d21Fila(){
  let L = []; try{ L = JSON.parse(localStorage.getItem(D21_FILA) || "[]"); }catch(e){}
  if(!L.length || !D21.st) return; const resta = [];
  for(const x of L){ if(x.hoje !== D21.st.hoje) continue; try{ const r = await SB().rpc("d21_registrar", { p_edicao: x.ed, p_tipo: x.tipo, p_modo: x.modo, p_min: x.min }); if(r.error) resta.push(x); }catch(e){ resta.push(x); } }
  try{ localStorage.setItem(D21_FILA, JSON.stringify(resta)); }catch(e){}
}

/* ---------- números da jornada ---------- */
function d21Jornada(){
  const R = d21Regs(), hoje = d21Dia(), feitos = new Set(R.map(r => +r.dia)), entrou = D21.st && D21.st.inscrita && D21.st.inscrita.entrou;
  const e = d21Ed(), diaEntrou = e && entrou ? Math.max(1, Math.floor((Date.parse(entrou) - 3 * 36e5 - Date.parse(e.inicio + "T00:00:00Z")) / 864e5) + 1) : 1;
  let atual = 0, melhor = 0, run = 0;
  for(let d = 1; d <= Math.min(hoje, 21); d++){ if(feitos.has(d)){ run++; melhor = Math.max(melhor, run); } else if(d < hoje) run = 0; }
  atual = feitos.has(hoje) || feitos.has(hoje - 1) ? run : 0;
  const perdidos = []; for(let d = Math.max(1, diaEntrou); d < Math.min(hoje, 22); d++) if(!feitos.has(d)) perdidos.push(d);
  const voltou = R.some(r => +r.dia > 2 && !feitos.has(+r.dia - 1) && !feitos.has(+r.dia - 2) && R.some(x => +x.dia < +r.dia - 2));
  return { completos: R.filter(r => r.tipo === "completo").length, planob: R.filter(r => r.tipo === "planob").length, total: R.length, perdidos, atual, melhor, diaEntrou, feitos, voltou };
}
function d21Medalhas(){
  const J = d21Jornada();
  return [["primeiro", "🏅", "Primeiro passo", J.total >= 1], ["d3", "🔥", "3 dias", J.total >= 3], ["d7", "💪", "7 dias", J.total >= 7], ["planob", "💚", "Plano B", J.planob >= 1],
    ["voltei", "🔄", "Eu voltei", J.voltou], ["d14", "🏆", "14 dias", J.total >= 14], ["d21", "👑", "21 dias", J.total >= 21], ["fim", "🎉", "Desafio concluído", J.feitos.has(21)]];
}

/* ---------- treino do dia (mesmo para todas; muda só a execução) ---------- */
function d21Monta(itens, rodadas, descRodada, modo, extra){
  const mult = { normal: 1, hard: 1.2, supreme: 1.4 }[modo] || 1, md = { normal: 1, hard: .75, supreme: .5 }[modo] || 1, steps = [];
  const its = (itens || []).filter(i => i && META[i[0]]).map(([id, m, v, d]) => ({ id: troca(id), modo: m === "r" ? "r" : "t", val: Math.max(m === "r" ? 3 : 10, Math.round((+v || 30) * mult)), desc: Math.round((+d || 0) * md), sets: 1 }));
  for(let r = 0; r < Math.max(1, rodadas || 1); r++) its.forEach((it, k) => steps.push({ ...it, rodada: r + 1, rodadas: Math.max(1, rodadas || 1), desc: k === its.length - 1 ? Math.round((descRodada || it.desc) * md) : it.desc }));
  if(steps.length) steps[steps.length - 1].desc = 0;
  return { steps, cor: "#E2562B", ...extra };
}
function d21Treino(tipo){
  const e = d21Ed(), d = d21Dia(), D = d21DiaConteudo(d); if(!e || !D) return null;
  const modo = (D21.st.inscrita && D21.st.inscrita.modo) || "normal", base = { ed: e.id, dia: d, modo };
  if(tipo === "planob"){ const pb = D.planob || {}; return d21Monta(pb.itens && pb.itens.length ? pb.itens : D.itens.slice(0, 5).map(i => [i[0], i[1], 40, 20]), pb.rodadas || 2, 20, "normal", { nome: `Dia ${d21Pad(d)} · Plano B (10 min)`, sub: "CK 21 Dias Juntas · Plano B", d21: { ...base, planob: true } }); }
  if(tipo === "cardio"){ const c = D.cardio || {}; const its = c.itens && c.itens.length ? c.itens : [["polichinelo", "t", 40, 20], ["corrida", "t", 40, 20], ["skater", "t", 40, 20], ["escalador", "t", 40, 20]];
    const porRod = its.reduce((a, i) => a + (+i[2] || 40) + (+i[3] || 0), 0) / 60; return d21Monta(its, Math.max(1, Math.round((c.min || 8) / Math.max(1, porRod))), 20, "normal", { nome: `Dia ${d21Pad(d)} · Movimento`, sub: "CK 21 Dias Juntas · Cardio", d21: { ...base, cardio: true } }); }
  const rod = (D.rodadas && D.rodadas[modo]) || { normal: 2, hard: 3, supreme: 4 }[modo];
  return d21Monta(D.itens, rod, D.descRodada || 45, modo, { nome: `Dia ${d21Pad(d)} · ${D.titulo}`, sub: `CK 21 Dias Juntas · ${D21_MODOS[modo][0]}`, d21: base });
}
const d21Min = T => T ? minTreino(T) : 0;
function d21Comecar(tipo){
  const T = d21Treino(tipo); if(!T || !T.steps.length) return toast("O treino de hoje ainda está sendo preparado. Tente daqui a pouco 💚");
  d21Ev(tipo === "planob" ? "challenge_plan_b_used" : "challenge_day_started", { dia: T.d21.dia, modo: T.d21.modo, tipo: tipo || "treino" });
  if(tipo !== "cardio") SB().rpc("d21_iniciou", { p_edicao: T.d21.ed, p_modo: tipo === "planob" ? "planob" : T.d21.modo }).then(() => {}, () => {});
  abrirTreinoPreview(T);
}

/* ---------- a casca da experiência ---------- */
function d21Abrir(aba){
  if(!d21Ed()) return;
  let box = $("d21"); if(!box){ box = document.createElement("div"); box.id = "d21"; box.className = "d21"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "CK 21 Dias Juntas"); document.body.appendChild(box); }
  if(!D21.aberto) d21Ev("challenge_entered", { dia: d21Dia() });
  D21.aberto = true; if(aba) D21.aba = aba; box.hidden = false; document.body.classList.add("d21-on");
  if(d21Insc()) try{ localStorage.setItem(D21_K, d21Ed().id); }catch(e){}
  d21Pinta();
  d21Carrega(true).then(() => { if(D21.aberto) d21Pinta(); });
}
function d21Fechar(){
  const box = $("d21"); if(box){ box.hidden = true; box.innerHTML = ""; }
  if(D21.aberto) d21Ev("challenge_exited_to_ck", { dia: d21Dia() });
  D21.aberto = false; document.body.classList.remove("d21-on"); try{ localStorage.removeItem(D21_K); }catch(e){}
  if(TAB === "inicio") rInicio(); else try{ d21PoeCard(); }catch(e){}
}
function d21Pinta(){
  const box = $("d21"); if(!box || !D21.aberto) return; const e = d21Ed(); if(!e) return d21Fechar();
  const dentro = d21Insc(), aba = dentro ? D21.aba : "conhecer", sc = box.querySelector(".d21-body"), y = sc && sc.dataset.aba === aba ? sc.scrollTop : 0;
  box.innerHTML = `<header class="d21-top"><button class="d21-volta" id="d21-x">${ic("back", 16)} CK Life</button><span class="d21-marca">🔥 CK 21 DIAS JUNTAS</span>${dentro ? `<button class="d21-mais" id="d21-op" aria-label="Opções do desafio">${ic("gear", 18)}</button>` : `<span class="d21-ed">#${d21Pad(e.numero)}</span>`}</header>
    <main class="d21-body" data-aba="${aba}">${aba === "conhecer" ? d21Conhecer() : aba === "comunidade" ? d21ComunidadeHTML() : aba === "jornada" ? d21JornadaHTML() : d21HojeHTML()}</main>
    ${aba === "conhecer" ? `<div class="d21-rodape"><button class="d21-bt" id="d21-entrar">QUERO PARTICIPAR</button></div>` : ""}
    ${dentro ? `<nav class="d21-nav">${[["hoje", "flame", "Hoje"], ["comunidade", "people", "Comunidade"], ["jornada", "trophy", "Jornada"]].map(([k, i, t]) => `<button data-d21tab="${k}" aria-current="${aba === k}">${ic(i, 20)}<span>${t}</span></button>`).join("")}</nav>` : ""}`;
  const b2 = box.querySelector(".d21-body"); if(b2 && y) b2.scrollTop = y;
  $("d21-x").onclick = d21Fechar;
  const op = $("d21-op"); if(op) op.onclick = () => {
    sheet("Opções do desafio", `<div class="d21-conf"><p class="hint" style="margin:0">CK 21 Dias Juntas · Edição #${d21Pad(e.numero)}</p>
      <button class="btn btn-line btn-block" id="d21-o-modo">Trocar meu modo (Normal, Hard, Supreme)</button>
      <button class="btn btn-line btn-block" id="d21-o-jor">Ver minha jornada</button>
      <button class="btn btn-line btn-block" id="d21-o-ck">Voltar ao CK Life (continuo no desafio)</button>
      <button class="btn btn-block d21-o-sair" id="d21-o-sair">Sair do desafio</button></div>`);
    $("d21-o-modo").onclick = $("d21-o-jor").onclick = () => { fecharSheet(); D21.aba = "jornada"; d21Pinta(); };
    $("d21-o-ck").onclick = () => { fecharSheet(); d21Fechar(); };
    $("d21-o-sair").onclick = d21SairConfirma;
  };
  box.querySelectorAll("[data-d21tab]").forEach(b => b.onclick = () => { D21.aba = b.dataset.d21tab; d21Pinta(); box.querySelector(".d21-body").scrollTop = 0; if(D21.aba === "comunidade") d21CarregaFeed(true); });
  if(aba === "conhecer") d21LigaConhecer(); else if(aba === "comunidade") d21LigaFeed(); else if(aba === "jornada") d21LigaJornada(); else d21LigaHoje();
  d21Relogio();
}
/* contagem regressiva / próximo dia (um timer só) */
let D21_TIMER = null;
function d21Relogio(){
  clearInterval(D21_TIMER);
  const pinta = () => { document.querySelectorAll("[data-d21ate]").forEach(el => { const ms = +el.dataset.d21ate - d21Agora(); if(ms <= 0){ el.innerHTML = "agora"; clearInterval(D21_TIMER); setTimeout(() => d21Carrega(true).then(d21Pinta), 1500); return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    el.innerHTML = el.dataset.fmt === "curto" ? `${d ? d + "d " : ""}${d21Pad(h)}h ${d21Pad(m)}min` : `<b>${d21Pad(d)}</b><small>DIAS</small><b>${d21Pad(h)}</b><small>HORAS</small><b>${d21Pad(m)}</b><small>MIN</small>`; }); };
  if(document.querySelector("[data-d21ate]")){ pinta(); D21_TIMER = setInterval(pinta, 20000); }
}
const d21Meia = data => Date.parse(data + "T00:00:00-03:00");   // meia-noite em Brasília
const d21Data = d => { const [a, m, dd] = d.split("-"); return `${dd}/${m}`; };

/* ---------- página antes de entrar ---------- */
function d21Conhecer(){
  const e = d21Ed(), R = D21.st.resumo || {}, fase = e.fase, antes = fase === "inscricoes" || fase === "aguardando";
  const rec = { iniciante: "normal", intermediario: "hard", avancado: "supreme" }[(ME.perfil && ME.perfil.nivel) || ""] || "normal";
  D21.modoEscolha = D21.modoEscolha || rec;
  return `<section class="d21-capa" ${e.capa ? `style="--capa:url('${esc(e.capa)}')"` : ""}><span class="d21-tag">EDIÇÃO #${d21Pad(e.numero)}</span><h1>🔥 ${esc(e.nome.toUpperCase())}</h1><p class="d21-frase">“${esc(e.frase)}”</p>
      <div class="d21-capa-n">${+R.inscritas ? `<b class="num">${int(R.inscritas)}</b> ${+R.inscritas === 1 ? "mulher inscrita" : "mulheres inscritas"}` : "Seja uma das primeiras da turma"}</div></section>
    ${antes ? `<div class="d21-card d21-cont"><span class="d21-eye">COMEÇAMOS EM</span><div class="d21-relogio" data-d21ate="${d21Meia(e.inicio)}"></div><small>${d21Data(e.inicio)} a ${d21Data(e.fim)}</small></div>`
      : `<div class="d21-card d21-cont"><span class="d21-eye">A TURMA ESTÁ NO</span><div class="d21-gr">DIA ${d21Pad(d21Dia())}<small>/21</small></div><small>Você entra hoje e segue junto com a turma. ${d21Data(e.inicio)} a ${d21Data(e.fim)}</small></div>`}
    ${e.descricao ? `<div class="d21-card"><p class="d21-desc">${esc(e.descricao).replace(/\n/g, "<br>")}</p></div>` : ""}
    <div class="d21-card"><h3>Como funciona</h3><ul class="d21-lista">
      <li><i>📅</i><span><b>21 dias, uma turma.</b> Todas começam e terminam juntas. Perdeu um dia? Você continua com a turma, sem ficar para trás.</span></li>
      <li><i>🏋️</i><span><b>Treino em casa, o mesmo para todas.</b> Força + cardio, planejado em 3 semanas: adaptação, progressão e intensidade. Tem dia de recuperação ativa.</span></li>
      <li><i>⚡</i><span><b>Normal, Hard ou Supreme.</b> O mesmo treino, com mais ou menos tempo, descanso e voltas. Você escolhe e pode trocar.</span></li>
      <li><i>💚</i><span><b>Plano B de 10 minutos.</b> Dia corrido? Ainda conta como presença.</span></li>
      <li><i>💬</i><span><b>Comunidade com a Micaela.</b> Recados, enquetes e check-ins todo dia. Você reage e vota.</span></li>
      <li><i>💧</i><span><b>Água e receita do dia</b>, junto com o que você já usa no CK Life.</span></li></ul></div>
    <div class="d21-card"><h3>Escolha seu modo</h3><div class="d21-modos">${Object.entries(D21_MODOS).map(([k, [n, s]]) => `<button class="d21-modo" data-d21modo="${k}" aria-pressed="${D21.modoEscolha === k}"><b>${n}</b><small>${s}</small>${k === rec ? `<em>recomendado</em>` : ""}</button>`).join("")}</div></div>
    <div class="d21-card d21-regras"><h3>Combinados da turma</h3><p>21 dias juntas, não 21 dias perfeitos. Sem comparação de corpos. Respeite seus limites: se sentir dor, pare. Não prometemos quilos perdidos: prometemos constância.</p></div>`;
}
function d21LigaConhecer(){
  document.querySelectorAll("[data-d21modo]").forEach(b => b.onclick = () => { D21.modoEscolha = b.dataset.d21modo; document.querySelectorAll("[data-d21modo]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  const b = $("d21-entrar"); if(b) b.onclick = async () => {
    b.disabled = true; b.classList.add("carregando");
    try{ const r = await SB().rpc("d21_entrar", { p_edicao: d21Ed().id, p_modo: D21.modoEscolha || "normal" }); if(r.error) throw r.error;
      d21Ev("challenge_joined", { modo: D21.modoEscolha }); await d21Carrega(true);
      SOM.done ? SOM.done() : SOM.check && SOM.check(); vibra([30, 40, 30]); D21.aba = "hoje"; d21Pinta(); d21BemVinda(); }
    catch(e){ toast(navigator.onLine === false ? "Sem internet agora. Tente de novo quando conectar." : "Não deu para entrar agora. Tente de novo."); b.disabled = false; b.classList.remove("carregando"); }
  };
}
function d21BemVinda(){
  const el = document.createElement("div"); el.className = "d21 d21-ok";
  el.innerHTML = `<div><div class="d21-ok-em">🔥</div><h2>VOCÊ ESTÁ DENTRO!</h2><p>Agora você faz parte do CK 21 Dias Juntas.</p>
    ${typeof pushLigado === "function" && !pushLigado() ? `<button class="d21-bt" id="d21-av">Ativar avisos do desafio</button><small>Te avisamos quando o dia começar e quando a Micaela deixar recado.</small>` : ""}
    <button class="d21-bt ${typeof pushLigado === "function" && !pushLigado() ? "d21-bt-2" : ""}" id="d21-okk">Bora!</button></div>`;
  document.body.appendChild(el); try{ confete(el); }catch(e){}
  const av = el.querySelector("#d21-av"); if(av) av.onclick = async () => { try{ await ativarNotificacoes(); }catch(e){} el.remove(); };
  el.querySelector("#d21-okk").onclick = () => el.remove();
}

/* ---------- HOJE ---------- */
function d21HojeHTML(){
  const e = d21Ed(), R = D21.st.resumo || {}, fase = e.fase, d = d21Dia();
  if(fase === "inscricoes" || fase === "aguardando") return `<section class="d21-hero"><span class="d21-eye">COMEÇAMOS EM</span><div class="d21-relogio" data-d21ate="${d21Meia(e.inicio)}"></div>
      <p class="d21-frase">“${esc(e.frase)}”</p><div class="d21-pill">👭 ${int(R.inscritas || 0)} ${+R.inscritas === 1 ? "mulher na turma" : "mulheres na turma"}</div></section>
    <div class="d21-card"><h3>Preparação</h3><ul class="d21-lista"><li><i>📍</i><span>Escolha um cantinho com espaço para deitar no chão.</span></li><li><i>👟</i><span>Tênis, roupa confortável e uma garrafa de água.</span></li><li><i>⏰</i><span>Decida a hora do seu treino. 20 a 40 minutos por dia.</span></li><li><i>🔔</i><span>Ative os avisos para saber quando o Dia 1 começar.</span></li></ul>
    ${typeof pushLigado === "function" && !pushLigado() ? `<button class="d21-bt d21-bt-2" id="d21-av2">Ativar avisos</button>` : ""}</div>
    ${d21MiniFeedHTML()}${d21ZapHTML()}`;
  if(fase === "finalizada" || d > 21) return d21FinalHTML();
  const J = d21Jornada(), reg = d21Reg(d), D = d21DiaConteudo(d) || {}, modo = D21.st.inscrita.modo || "normal", T = d21Treino(), Tb = d21Treino("planob"), Tc = d21Treino("cardio");
  const x = dia(today()), m = metas(ME), L = c => (c * .25).toFixed(1).replace(".", ",");
  const rec = d21Receita(D, d), outras = Math.max(0, (+R.treinaram_hoje || 0) - (reg ? 1 : 0));
  let aviso = "";
  if(!reg && d > 1 && J.diaEntrou < d){ const ult = Math.max(0, ...d21Regs().map(r => +r.dia)), gap = d - (ult || J.diaEntrou - 1) - 1;
    if(gap >= 3 && ult) aviso = `<div class="d21-card d21-volta-c"><b>🔥 VOCÊ VOLTOU!</b><p>A turma está no Dia ${d}. Você não precisa recuperar tudo. Vamos continuar juntas?</p></div>`;
    else if(gap >= 1 && !d21Reg(d - 1)) aviso = `<div class="d21-card d21-volta-c"><b>Ontem não deu? 💚</b><p>Tudo bem. A turma está no Dia ${d} e você continua com a gente.</p></div>`;
    if(aviso && !D21.voltouEv){ D21.voltouEv = 1; d21Ev("challenge_returned", { dia: d, gap }); } }
  const amanha = d < 21 ? d21Meia(addD(D21.st.hoje, 1)) : 0;
  return `<section class="d21-hero"><span class="d21-eye">DIA ${d21Pad(d)} DE 21</span><h1 class="d21-titulo">${esc(D.titulo || "Treino do dia")}</h1>
      <p class="d21-frase">“${esc(e.frase)}”</p><div class="d21-barra"><i style="width:${Math.round(100 * d / 21)}%"></i></div><div class="d21-barra-tx"><span>${d}/21</span><span>${J.total} ${J.total === 1 ? "dia feito" : "dias feitos"}</span></div>
      ${+R.treinaram_hoje ? `<div class="d21-pill">🔥 ${int(R.treinaram_hoje)} ${+R.treinaram_hoje === 1 ? "mulher já treinou" : "mulheres já treinaram"} hoje</div>` : `<div class="d21-pill">🔥 Seja a primeira da turma a treinar hoje</div>`}</section>
    ${aviso}
    ${reg ? `<div class="d21-card d21-feito"><b>✅ MISSÃO DE HOJE CONCLUÍDA</b><p>${reg.tipo === "planob" ? "Plano B feito. Presença garantida 💚" : "Você apareceu por você hoje."}${outras ? ` E mais ${int(outras)} ${outras === 1 ? "mulher" : "mulheres"} também.` : ""}</p>
        ${amanha ? `<small>Volte amanhã para continuar. Dia ${d + 1} começa em <span data-d21ate="${amanha}" data-fmt="curto"></span>.</small>` : ""}
        <div class="d21-bts2"><button class="d21-bt d21-bt-2" id="d21-sh">${ic("share", 16)} Compartilhar</button>${reg.tipo === "planob" ? `<button class="d21-bt d21-bt-2" data-d21go="treino">Fazer o treino completo</button>` : ""}</div></div>`
      : `<button class="d21-bt d21-bt-xl" data-d21go="treino">${ic("play", 18)} COMEÇAR TREINO DE HOJE</button>
        <div class="d21-modos d21-modos-s">${Object.entries(D21_MODOS).map(([k, [n]]) => `<button class="d21-modo" data-d21m="${k}" aria-pressed="${modo === k}"><b>${n}</b></button>`).join("")}</div>
        <button class="d21-planob" data-d21go="planob">💚 Hoje só tenho 10 minutos <span>Plano B</span></button>`}
    ${D.msg ? `<div class="d21-card d21-mica"><span class="d21-av">M</span><div><b>MICAELA • CK LIFE</b><p>${esc(D.msg)}</p></div></div>` : ""}
    <h2 class="d21-sec">🔥 MISSÃO DO DIA ${d21Pad(d)}</h2>
    <div class="d21-missao">
      <div class="d21-m ${reg ? "ok" : ""}"><i>🏋️</i><div><b>TREINO</b><small>${esc(D.titulo || "")} · ${d21Min(T)} min · ${D21_MODOS[modo][0]}</small></div>${reg ? "<em>✓</em>" : `<button data-d21go="treino">Começar</button>`}</div>
      <div class="d21-m ${ME.d21c && ME.d21c[e.id + ":" + d] ? "ok" : ""}"><i>❤️</i><div><b>MOVIMENTO</b><small>Cardio extra · ${d21Min(Tc)} minutos</small></div>${ME.d21c && ME.d21c[e.id + ":" + d] ? "<em>✓</em>" : `<button data-d21go="cardio">Fazer</button>`}</div>
      <div class="d21-m ${(x.agua || 0) >= m.agua ? "ok" : ""}"><i>💧</i><div><b>ÁGUA · SUA META DE HOJE</b><small>${L(x.agua || 0)}L / ${L(m.agua)}L</small></div><button id="d21-agua">+1 copo</button></div>
      ${rec ? `<div class="d21-m"><i>🥗</i><div><b>RECEITA CK DO DIA</b><small>${esc(rec.nome)}</small></div><button id="d21-rec" data-rec="${esc(rec.id)}">Ver receita</button></div>` : ""}
      ${D.missao ? `<div class="d21-m ${ME.d21m && ME.d21m[e.id + ":" + d] ? "ok" : ""}"><i>🎯</i><div><b>DESAFIO EXTRA</b><small>${esc(D.missao)}</small></div>${ME.d21m && ME.d21m[e.id + ":" + d] ? "<em>✓</em>" : `<button id="d21-mis">Feito</button>`}</div>` : ""}
      <div class="d21-m"><i>💬</i><div><b>COMUNIDADE</b><small id="d21-ult">${esc((D21.feed && D21.feed[0] && (D21.feed[0].titulo || D21.feed[0].texto)) || "Veja os recados da Micaela")}</small></div><button data-d21tab2="comunidade">Abrir</button></div>
    </div>
    ${d21ZapHTML()}`;
}
function d21Receita(D, d){
  const all = [...(typeof BASE_REC !== "undefined" ? BASE_REC : []), ...((DB.receitasExtras || []).map(r => ({ id: r.id, nome: r.nome })))];
  if(D.receita){ const r = all.find(x => x.id === D.receita); if(r) return r; }
  const livres = all.filter(r => typeof receitaLivre !== "function" || receitaLivre(r.id)); return livres.length ? livres[(d * 7) % livres.length] : null;
}
const d21ZapHTML = () => { const z = d21Ed() && d21Ed().whatsapp; return z ? `<a class="d21-zap" href="${esc(z)}" target="_blank" rel="noopener" id="d21-zap">💬 Entrar também no grupo do WhatsApp</a>` : ""; };
function d21LigaHoje(){
  const box = $("d21"); if(!box) return;
  box.querySelectorAll("[data-d21go]").forEach(b => b.onclick = () => d21Comecar(b.dataset.d21go === "treino" ? null : b.dataset.d21go));
  box.querySelectorAll("[data-d21tab2]").forEach(b => b.onclick = () => { D21.aba = b.dataset.d21tab2; d21Pinta(); d21CarregaFeed(true); });
  box.querySelectorAll("[data-d21m]").forEach(b => b.onclick = async () => { const m = b.dataset.d21m; if(m === D21.st.inscrita.modo) return;
    D21.st.inscrita.modo = m; d21Pinta(); try{ await SB().rpc("d21_modo", { p_edicao: d21Ed().id, p_modo: m }); toast(`Modo ${D21_MODOS[m][0]} 💪`); }catch(e){} });
  const ag = $("d21-agua"); if(ag) ag.onclick = () => { const x = dia(today()); x.agua = (x.agua || 0) + 1; SOM.water && SOM.water(); vibra(15); save(); d21Pinta(); };
  const rc = $("d21-rec"); if(rc) rc.onclick = () => abrirReceita(rc.dataset.rec);
  const ms = $("d21-mis"); if(ms) ms.onclick = () => { ME.d21m = ME.d21m || {}; ME.d21m[d21Ed().id + ":" + d21Dia()] = today(); save(); SOM.check && SOM.check(); vibra(20); d21Pinta(); };
  const sh = $("d21-sh"); if(sh) sh.onclick = () => d21Compartilhar();
  const av = $("d21-av2"); if(av) av.onclick = () => ativarNotificacoes();
  const z = $("d21-zap"); if(z) z.onclick = () => d21Ev("challenge_whatsapp_clicked", {});
  d21LigaPosts();
  if(!D21.feed && !D21.feedErro) d21CarregaFeed(false).then(() => { const u = $("d21-ult"); if(u && D21.feed && D21.feed[0]) u.textContent = D21.feed[0].titulo || D21.feed[0].texto || ""; });
}

/* ---------- final da edição ---------- */
function d21FinalHTML(){
  const J = d21Jornada(), M = d21Medalhas().filter(m => m[3]), p = ME.d21pesq && ME.d21pesq[d21Ed().id];
  return `<section class="d21-hero d21-fim"><div class="d21-ok-em">🏆</div><h1 class="d21-titulo">${J.feitos.has(21) || J.total >= 15 ? "VOCÊ CONSEGUIU!" : "A EDIÇÃO TERMINOU"}</h1><span class="d21-eye">CK 21 DIAS JUNTAS · EDIÇÃO #${d21Pad(d21Ed().numero)}</span>
      <div class="d21-stats"><div><b>${J.total}/21</b><small>dias realizados</small></div><div><b>${J.completos}</b><small>${J.completos === 1 ? "treino completo" : "treinos completos"}</small></div><div><b>${J.planob}</b><small>${J.planob === 1 ? "Plano B" : "Planos B"}</small></div><div><b>${J.melhor}</b><small>sequência máxima</small></div></div>
      <div class="d21-meds">${M.map(m => `<span title="${esc(m[2])}">${m[1]}<small>${esc(m[2])}</small></span>`).join("")}</div>
      <button class="d21-bt" id="d21-sh">${ic("share", 16)} COMPARTILHAR MINHA CONQUISTA</button></section>
    ${p ? `<div class="d21-card"><b>Obrigada por responder 💚</b><p class="hint">Sua opinião ajuda a próxima edição a ser ainda melhor.</p></div>` : `<div class="d21-card"><h3>Como foi sua experiência?</h3>
      <div class="d21-nota">${Array.from({ length: 11 }, (_, i) => `<button data-nota="${i}">${i}</button>`).join("")}</div>
      <label class="d21-lb">O que você mais gostou? <small>(opcional)</small><textarea id="d21-pq1" maxlength="1000" rows="2"></textarea></label>
      <label class="d21-lb">O que podemos melhorar? <small>(opcional)</small><textarea id="d21-pq2" maxlength="1000" rows="2"></textarea></label>
      <label class="d21-chk"><input type="checkbox" id="d21-pq3"> Participaria de outra edição</label>
      <button class="d21-bt d21-bt-2" id="d21-pq">Enviar</button><small class="hint">Sua resposta é só para a equipe. Nada é publicado.</small></div>`}`;
}

/* ---------- COMUNIDADE (só a equipe publica) ---------- */
async function d21CarregaFeed(forca, mais){
  const e = d21Ed(); if(!e || !d21Insc()) return;
  if((D21.feed && !forca && !mais) || D21.feedCarregando) return;
  D21.feedCarregando = true;
  try{ const antes = mais && D21.feed && D21.feed.length ? D21.feed[D21.feed.length - 1].publicar_em : null;
    const r = await SB().rpc("d21_feed", { p_edicao: e.id, p_antes: antes, p_limite: 15 }); if(r.error) throw r.error;
    const L = r.data || []; D21.feed = mais ? [...(D21.feed || []), ...L.filter(p => !D21.feed.some(x => x.id === p.id))] : L; D21.feedFim = L.length < 15; D21.feedErro = false;
    const novos = L.map(p => p.id).filter(id => !D21.vistos.has(id)); novos.forEach(id => D21.vistos.add(id));
    if(novos.length) SB().rpc("d21_vi", { p_posts: novos }).then(() => {}, () => {}); }
  catch(err){ D21.feedErro = true; }
  D21.feedCarregando = false;
  if(D21.aberto && (D21.aba === "comunidade" || D21.aba === "hoje")) d21Pinta();
}
function d21PostHTML(p, mini){
  const C = p.contagens || {}, tipoN = { aviso: "📢 AVISO", chamada: "🔥 CHAMADA", enquete: "📊 ENQUETE", checkin: "💚 CHECK-IN", conquista: "🏆 CONQUISTA DA TURMA", mensagem: "" }[p.tipo] || "";
  const votou = (p.meus_votos || []).length > 0, encerrada = p.prazo && Date.parse(p.prazo) < d21Agora(), total = Math.max(1, (p.opcoes || []).reduce((a, o) => a + (+C["v:" + o.id] || 0), 0));
  const mostra = p.resultado === "sempre" || (p.resultado === "depois" && votou) || (p.resultado === "fim" && encerrada);
  const vot = (p.tipo === "enquete" || p.tipo === "checkin") ? `<div class="d21-ops" data-post="${p.id}">${(p.opcoes || []).map(o => { const n = +C["v:" + o.id] || 0, pc = Math.round(100 * n / total), meu = (p.meus_votos || []).includes(o.id);
      return `<button class="d21-op ${meu ? "meu" : ""}" data-op="${esc(o.id)}" ${encerrada || (votou && !p.pode_mudar) ? "disabled" : ""}>${mostra ? `<i style="width:${pc}%"></i>` : ""}<span>${esc(o.t)}</span>${mostra ? `<b>${pc}%</b>` : meu ? "<b>✓</b>" : ""}</button>`; }).join("")}
      <small>${int(p.votantes || 0)} ${+p.votantes === 1 ? "resposta" : "respostas"}${p.multipla ? " · pode marcar mais de uma" : ""}${encerrada ? " · encerrada" : p.prazo ? " · até " + new Date(p.prazo).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}${!mostra && !encerrada ? " · resultado " + (p.resultado === "fim" ? "no fim" : "depois de votar") : ""}</small></div>` : "";
  const bt = p.botao === "treino" ? `<button class="d21-bt d21-bt-2" data-d21go="treino">Começar treino</button>` : p.botao === "receita" ? `<button class="d21-bt d21-bt-2" data-d21rec="1">Ver receita do dia</button>` : p.botao === "jornada" ? `<button class="d21-bt d21-bt-2" data-d21tab2="jornada">Ver minha jornada</button>` : p.botao === "whatsapp" && d21Ed().whatsapp ? `<a class="d21-bt d21-bt-2" href="${esc(d21Ed().whatsapp)}" target="_blank" rel="noopener">Entrar no grupo</a>` : "";
  const hora = new Date(p.publicar_em), quando = hora.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + hora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `<article class="d21-post ${p.fixado ? "fix" : ""} ${mini ? "mini" : ""}" data-id="${p.id}"><header><span class="d21-av">M</span><div><b>MICAELA • CK LIFE</b><small>${p.fixado ? "📌 Fixado · " : ""}${p.dia ? "Dia " + p.dia + " · " : ""}${quando}</small></div>${tipoN ? `<em>${tipoN}</em>` : ""}</header>
    ${p.titulo ? `<h3>${esc(p.titulo)}</h3>` : ""}${p.texto ? `<p>${esc(p.texto).replace(/\n/g, "<br>")}</p>` : ""}${vot}${bt}
    <div class="d21-reac" data-post="${p.id}">${D21_REACOES.map(r => `<button data-r="${r}" aria-pressed="${p.minha_reacao === r}">${r}<span>${+C["r:" + r] ? int(C["r:" + r]) : ""}</span></button>`).join("")}</div></article>`;
}
function d21ComunidadeHTML(){
  if(!D21.feed && !D21.feedErro) return `<div class="d21-vazio">Carregando a comunidade…</div>`;
  const L = D21.feed || [];
  return `<div class="d21-com-top"><b>💬 Comunidade da turma</b><small>Só a equipe publica aqui. Você reage, vota e faz check-in. ${int((D21.st.resumo || {}).inscritas || 0)} ${+(D21.st.resumo || {}).inscritas === 1 ? "mulher" : "mulheres"} na turma.</small></div>${d21ZapHTML()}
    ${D21.feedErro && !L.length ? `<div class="d21-vazio">Não conseguimos carregar agora. <button class="link" id="d21-tenta">Tentar de novo</button></div>` : ""}
    ${!L.length && !D21.feedErro ? `<div class="d21-vazio">A Micaela ainda não publicou nada. Volte daqui a pouco 💚</div>` : ""}
    ${L.map(p => d21PostHTML(p)).join("")}${L.length && !D21.feedFim ? `<button class="d21-bt d21-bt-2" id="d21-mais">Ver mais</button>` : ""}`;
}
function d21MiniFeedHTML(){ const L = (D21.feed || []).slice(0, 2); return L.length ? `<h2 class="d21-sec">📢 AVISOS DA MICAELA</h2>${L.map(p => d21PostHTML(p, true)).join("")}` : ""; }
function d21LigaFeed(){
  if(!D21.feed && !D21.feedErro) d21CarregaFeed(false);
  const t = $("d21-tenta"); if(t) t.onclick = () => { D21.feedErro = false; d21Pinta(); d21CarregaFeed(true); };
  const m = $("d21-mais"); if(m) m.onclick = () => { m.disabled = true; d21CarregaFeed(false, true); };
  d21LigaPosts();
}
function d21LigaPosts(){
  const box = $("d21"); if(!box) return;
  box.querySelectorAll(".d21-reac button").forEach(b => b.onclick = async () => {
    const id = b.parentElement.dataset.post, p = (D21.feed || []).find(x => x.id === id); if(!p) return;
    const r = b.dataset.r, antes = p.minha_reacao, C = p.contagens = p.contagens || {};
    if(antes) C["r:" + antes] = Math.max(0, (+C["r:" + antes] || 0) - 1);
    p.minha_reacao = antes === r ? null : r; if(p.minha_reacao) C["r:" + r] = (+C["r:" + r] || 0) + 1;
    vibra(10); d21Pinta();
    try{ const x = await SB().rpc("d21_reagir", { p_post: id, p_emoji: r }); if(x.error) throw x.error; d21Ev("challenge_reaction", { emoji: r }); }
    catch(e){ toast("Não deu para reagir agora. Confira a internet."); d21CarregaFeed(true); }
  });
  box.querySelectorAll(".d21-op").forEach(b => b.onclick = async () => {
    const id = b.parentElement.dataset.post, p = (D21.feed || []).find(x => x.id === id); if(!p) return;
    let V = p.multipla ? ((p.meus_votos || []).includes(b.dataset.op) ? p.meus_votos.filter(x => x !== b.dataset.op) : [...(p.meus_votos || []), b.dataset.op]) : [b.dataset.op];
    if(!V.length) return;
    const C = p.contagens = p.contagens || {}, antes = p.meus_votos || [], novo = !antes.length;
    antes.forEach(o => C["v:" + o] = Math.max(0, (+C["v:" + o] || 0) - 1)); V.forEach(o => C["v:" + o] = (+C["v:" + o] || 0) + 1);
    p.meus_votos = V; if(novo) p.votantes = (+p.votantes || 0) + 1; SOM.check && SOM.check(); vibra(15); d21Pinta();
    try{ const x = await SB().rpc("d21_votar", { p_post: id, p_opcoes: V }); if(x.error) throw x.error; d21Ev(p.tipo === "checkin" ? "challenge_checkin" : "challenge_poll_vote", {}); }
    catch(e){ toast((e && e.message && /já votou|terminou/.test(e.message)) ? "Essa votação não aceita mudança." : "Não deu para votar agora. Confira a internet."); d21CarregaFeed(true); }
  });
  box.querySelectorAll(".d21-post [data-d21go]").forEach(b => b.onclick = () => d21Comecar(null));
  box.querySelectorAll(".d21-post [data-d21tab2]").forEach(b => b.onclick = () => { D21.aba = b.dataset.d21tab2; d21Pinta(); });
  box.querySelectorAll("[data-d21rec]").forEach(b => b.onclick = () => { const r = d21Receita(d21DiaConteudo(d21Dia()) || {}, d21Dia()); if(r) abrirReceita(r.id); });
}

/* ---------- JORNADA ---------- */
function d21JornadaHTML(){
  const J = d21Jornada(), d = d21Dia(), e = d21Ed(), M = d21Medalhas(), H = (D21.st.historico || []).filter(h => h.id !== e.id);
  const cel = n => { const r = d21Reg(n); if(r) return [r.tipo === "planob" ? "💚" : "✅", r.tipo === "planob" ? "Plano B" : "Treino completo", "feito"];
    if(n === d) return ["🔥", "Hoje", "hoje"]; if(n > d) return ["🔒", "Ainda não chegou", "fut"]; if(n < J.diaEntrou) return ["·", "Antes de você entrar", "antes"]; return ["⚪", "Não realizado", "nao"]; };
  return `<section class="d21-hero d21-hero-s"><span class="d21-eye">MINHA JORNADA</span><div class="d21-gr">DIA ${d21Pad(Math.min(d, 21))}<small>/21</small></div></section>
    <div class="d21-cal">${Array.from({ length: 21 }, (_, i) => { const [ic2, t, c] = cel(i + 1); return `<div class="d21-dia ${c}" title="Dia ${i + 1}: ${t}"><small>${d21Pad(i + 1)}</small><i>${ic2}</i></div>`; }).join("")}</div>
    <div class="d21-leg"><span>✅ completo</span><span>💚 Plano B</span><span>⚪ não feito</span><span>🔥 hoje</span><span>🔒 futuro</span></div>
    <div class="d21-stats"><div><b>${J.completos}</b><small>${J.completos === 1 ? "treino completo" : "treinos completos"}</small></div><div><b>${J.planob}</b><small>Plano B</small></div><div><b>${J.perdidos.length}</b><small>${J.perdidos.length === 1 ? "dia não realizado" : "dias não realizados"}</small></div><div><b>${J.atual}</b><small>sequência atual</small></div><div><b>${J.melhor}</b><small>melhor sequência</small></div><div><b>${Math.round(100 * J.total / 21)}%</b><small>do desafio</small></div></div>
    <p class="d21-gentil">Não precisa ser perfeito para continuar. 💚</p>
    <h2 class="d21-sec">🏅 MEDALHAS</h2><div class="d21-meds">${M.map(([k, em, n, ok]) => `<button class="${ok ? "ok" : ""}" data-med="${k}" ${ok ? "" : "disabled"}>${ok ? em : "🔒"}<small>${esc(n)}</small></button>`).join("")}</div>
    ${J.total ? `<button class="d21-bt d21-bt-2" id="d21-sh">${ic("share", 16)} Compartilhar meu progresso</button>` : ""}
    <h2 class="d21-sec">⚡ MEU MODO</h2><div class="d21-modos">${Object.entries(D21_MODOS).map(([k, [n, s]]) => `<button class="d21-modo" data-d21m="${k}" aria-pressed="${D21.st.inscrita.modo === k}"><b>${n}</b><small>${s}</small></button>`).join("")}</div>
    ${H.length ? `<h2 class="d21-sec">📚 MEUS DESAFIOS</h2>${H.map(h => `<div class="d21-card d21-hist"><b>${esc(h.nome)} · Edição #${d21Pad(h.numero)}</b><small>${d21Data(h.inicio)} a ${d21Data(h.fim)} · ${h.feitos}/21 dias${+h.planob ? ` · ${h.planob} Plano B` : ""}</small></div>`).join("")}` : ""}
    <h2 class="d21-sec">⚙️ OPÇÕES</h2><button class="d21-sair" id="d21-sair">Sair do desafio</button><small class="d21-sair-tx">Para só voltar ao app, use “← CK Life” no topo. Isso não tira você do desafio.</small>`;
}
function d21LigaJornada(){
  const box = $("d21"); if(!box) return;
  box.querySelectorAll("[data-d21m]").forEach(b => b.onclick = async () => { const m = b.dataset.d21m; D21.st.inscrita.modo = m; d21Pinta(); try{ await SB().rpc("d21_modo", { p_edicao: d21Ed().id, p_modo: m }); toast(`Modo ${D21_MODOS[m][0]} 💪`); }catch(e){} });
  box.querySelectorAll("[data-med]").forEach(b => b.onclick = () => { const m = d21Medalhas().find(x => x[0] === b.dataset.med); if(m) ckCompartilhar({ tipo: "desafio_medalha", emoji: m[1], titulo: m[2].toUpperCase(), sub: "CK 21 DIAS JUNTAS", convite: "Estou fazendo o CK 21 Dias Juntas 💚\nVem comigo no CK Life:", frases: ["Não 21 dias perfeitos. 21 dias juntas.", "Eu continuo. 💚"] }); });
  const sh = $("d21-sh"); if(sh) sh.onclick = () => d21Compartilhar();
  const s = $("d21-sair"); if(s) s.onclick = d21SairConfirma;
}
function d21SairConfirma(){
  {
    sheet("Sair do desafio?", `<div class="d21-conf"><p>Se você só quer voltar para o CK Life, toque em <b>← CK Life</b> no topo. Isso <b>não</b> tira você do desafio.</p>
      <p><b>Sair do desafio</b> tira você da turma: para de receber os avisos e a comunidade da edição. Seu histórico fica guardado e você pode voltar enquanto a edição estiver aberta.</p>
      <button class="btn btn-accent btn-block" id="d21-fica">Continuar no desafio</button><button class="btn btn-line btn-block" id="d21-sai">Sair mesmo assim</button></div>`);
    $("d21-fica").onclick = fecharSheet;
    $("d21-sai").onclick = async () => { try{ await SB().rpc("d21_sair", { p_edicao: d21Ed().id }); d21Ev("challenge_left", { dia: d21Dia() }); }catch(e){} fecharSheet(); await d21Carrega(true); d21Fechar(); toast("Você saiu do desafio. Quando quiser, é só voltar 💚"); };
  };
}
document.addEventListener("click", e => {   // pesquisa final (botões ficam na tela "Hoje" após a edição)
  const n = e.target.closest && e.target.closest("[data-nota]"); if(n){ D21.nota = +n.dataset.nota; document.querySelectorAll("[data-nota]").forEach(b => b.classList.toggle("on", b === n)); return; }
  const env = e.target.closest && e.target.closest("#d21-pq"); if(env){ if(D21.nota == null) return toast("Escolha uma nota de 0 a 10");
    SB().rpc("d21_responder_pesquisa", { p_edicao: d21Ed().id, p_nota: D21.nota, p_gostou: ($("d21-pq1").value || "").trim() || null, p_melhorar: ($("d21-pq2").value || "").trim() || null, p_outra: $("d21-pq3").checked })
      .then(r => { if(r.error) throw r.error; ME.d21pesq = ME.d21pesq || {}; ME.d21pesq[d21Ed().id] = today(); save(); toast("Obrigada! 💚"); d21Pinta(); }).catch(() => toast("Não deu para enviar agora. Tente de novo.")); return; }
});

/* ---------- compartilhar (cartão do CK Life, menu nativo do celular) ---------- */
function d21Compartilhar(final){
  const J = d21Jornada(), d = d21Dia(), base = { sub: "CK 21 DIAS JUNTAS", convite: "Estou fazendo o CK 21 Dias Juntas 💚\nVem comigo no CK Life:" };
  d21Ev("challenge_share", { dia: d, final: !!final });
  if(final || d21Ed().fase === "finalizada" || d > 21) return ckCompartilhar({ ...base, tipo: "desafio_ok", emoji: "🏆", grande: "21 DIAS", titulo: "EU COMPLETEI", frases: [`${J.total} de 21 dias. E eu fui até o fim. 💚`, "Não 21 dias perfeitos. 21 dias juntas."] });
  const reg = d21Reg(d), marco = { 3: ["🔥", "3 dias. O hábito começou."], 7: ["🔥", "Uma semana. Eu continuo."], 14: ["💚", "Falta pouco."], 21: ["🏆", "Eu completei."] }[J.total];
  if(reg && reg.tipo === "planob") return ckCompartilhar({ ...base, tipo: "desafio_planob", emoji: "💚", titulo: "PLANO B CONCLUÍDO", grande: `${d21Pad(d)}/21`, frases: ["Hoje eu só tinha 10 minutos.\nE fiz os 10.", "Pouco ainda conta."] });
  if(marco && reg) return ckCompartilhar({ ...base, tipo: "desafio_marco", emoji: null, grande: `${J.total}/21 ${marco[0]}`, frases: [marco[1], "Hoje eu apareci por mim. 💚"] });
  return ckCompartilhar({ ...base, tipo: "desafio_dia", emoji: "🔥", titulo: reg ? "TREINO CONCLUÍDO" : "EU ESTOU DENTRO", grande: `${d21Pad(d)}/21`, frases: reg ? ["Hoje eu apareci por mim. 💚", "Feito é melhor que perfeito.", "Mais um passo dado. 💚"] : ["21 dias juntas. Não 21 dias perfeitos."] });
}

/* ---------- fim do treino do desafio: recompensa própria ---------- */
const iniciaTreinoD21 = iniciaTreino;
iniciaTreino = function(T){ if(T && T.d21){ try{ fecharSheet(); }catch(e){} } return iniciaTreinoD21.apply(this, arguments); };
const fimTreinoD21 = fimTreino;
fimTreino = function(parcial){
  const T = PL && PL.T, r = fimTreinoD21.apply(this, arguments);
  if(!T || !T.d21 || parcial) return r;
  try{ d21FimTela(T); }catch(e){ console.warn(e); }
  return r;
};
async function d21FimTela(T){
  const z = T.d21, min = ((ME.treinos || []).slice(-1)[0] || {}).min || d21Min(T), antes = new Set(d21Medalhas().filter(m => m[3]).map(m => m[0]));
  if(z.cardio){ ME.d21c = ME.d21c || {}; ME.d21c[z.ed + ":" + z.dia] = today(); save(); }
  const tipo = z.planob ? "planob" : "completo";
  $("play").innerHTML = `<div class="pc d21-fimt"><div class="d21-ok-em">${z.cardio ? "❤️" : z.planob ? "💚" : "🔥"}</div><h2>${z.cardio ? "MOVIMENTO FEITO!" : z.planob ? `PLANO B DO DIA ${d21Pad(z.dia)} FEITO!` : `DIA ${d21Pad(z.dia)} CONCLUÍDO!`}</h2>
    <p>${z.cardio ? "Cardio extra na conta. Que energia! 💚" : z.planob ? "Hoje você só tinha 10 minutos. E fez os 10. Conta como presença 💚" : "Você apareceu por você hoje. 💚"}</p>
    <div class="d21-gr">${d21Pad(z.dia)}<small>/21</small></div><div class="d21-pill" id="d21-fim-n">${z.cardio ? "" : "Salvando seu dia…"}</div><div class="d21-meds" id="d21-fim-med"></div>
    ${z.cardio ? "" : `<button class="d21-bt" id="d21-f-sh">${ic("share", 16)} COMPARTILHAR CONQUISTA</button>`}
    <button class="d21-bt d21-bt-2" id="d21-f-turma">VER A TURMA</button><button class="d21-bt d21-bt-2" id="d21-f-ok">CONTINUAR</button></div>`;
  try{ confete($("play")); }catch(e){}
  const volta = aba => { fimPlay(); d21Abrir(aba); };
  $("d21-f-turma").onclick = () => volta("comunidade"); $("d21-f-ok").onclick = () => volta("hoje");
  const fsh = $("d21-f-sh"); if(fsh) fsh.onclick = () => d21Compartilhar();
  if(z.cardio) return;
  let res = null;
  try{ const x = await SB().rpc("d21_registrar", { p_edicao: z.ed, p_tipo: tipo, p_modo: z.modo, p_min: min }); if(x.error) throw x.error; res = x.data; }
  catch(e){ let L = []; try{ L = JSON.parse(localStorage.getItem(D21_FILA) || "[]"); }catch(x){} L.push({ ed: z.ed, tipo, modo: z.modo, min, hoje: D21.st && D21.st.hoje });
    try{ localStorage.setItem(D21_FILA, JSON.stringify(L)); }catch(x){} }
  d21Ev(z.planob ? "challenge_plan_b_used" : "challenge_day_completed", { dia: z.dia, modo: z.modo, tipo });
  await d21Carrega(true);
  const n = $("d21-fim-n"); if(n){ const t = res && res.resumo ? +res.resumo.treinaram_hoje || 0 : 0;
    n.textContent = res ? (t > 1 ? `🔥 ${int(t - 1)} ${t - 1 === 1 ? "mulher também concluiu" : "mulheres também concluíram"} hoje` : "🔥 Você abriu o dia da turma!") : "Sem internet: seu dia fica salvo e enviamos quando conectar."; }
  const J = d21Jornada(); [[7, "challenge_7_days"], [14, "challenge_14_days"]].forEach(([k, ev]) => { if(J.total === k) d21Ev(ev, {}); });
  if(z.dia === 21 || J.feitos.has(21)) d21Ev("challenge_completed", { total: J.total });
  const novas = d21Medalhas().filter(m => m[3] && !antes.has(m[0])), md = $("d21-fim-med");
  if(md && novas.length){ md.innerHTML = novas.map(m => `<span>${m[1]}<small>${esc(m[2])}</small></span>`).join(""); SOM.coupon && SOM.coupon(); }
  if(z.dia === 21){ const h = document.querySelector(".d21-fimt h2"); if(h) h.textContent = "🏆 VOCÊ CONSEGUIU!"; const p = document.querySelector(".d21-fimt p"); if(p) p.textContent = `CK 21 Dias Juntas: ${J.total}/21 dias realizados, ${J.completos} treinos completos, ${J.planob} Planos B. Que orgulho!`;
    if(fsh) fsh.onclick = () => d21Compartilhar(true); }
}

/* ---------- entrada no CK Life normal (só existe se houver edição publicada) ---------- */
function d21CardHTML(id){
  id = id || "d21-card";
  const e = d21Ed(); if(!e || e.fase === "rascunho" || e.fase === "arquivada") return "";
  const insc = d21Insc(), d = d21Dia(), R = D21.st.resumo || {};
  if(e.fase === "finalizada" || d > 21){ if(!insc) return ""; const J = d21Jornada(), foi = J.feitos.has(21) || J.total >= 15; return `<button class="d21-entrada fim" id="${id}"><span class="d21-eye">🏆 CK 21 DIAS JUNTAS</span><b>${foi ? "Você concluiu o CK 21 Dias Juntas" : `A edição terminou. Você fez ${J.total} de 21 dias 💚`}</b><span class="d21-entrada-bt">VER MINHA JORNADA</span></button>`; }
  if(insc){ const reg = d21Reg(d); return `<button class="d21-entrada" id="${id}"><span class="d21-eye">🔥 CK 21 DIAS JUNTAS</span><b>${e.fase === "andamento" ? `Dia ${d21Pad(d)} de 21 · ${reg ? "missão de hoje concluída ✅" : "seu treino está esperando"}` : "Você está dentro! A turma começa em breve"}</b><span class="d21-entrada-bt">CONTINUAR DESAFIO</span></button>`; }
  return `<button class="d21-entrada" id="${id}"><span class="d21-eye">🔥 CK 21 DIAS JUNTAS</span><b>21 dias. Uma turma.<br>Um objetivo: não parar.</b>${+R.inscritas >= 5 ? `<small>${int(R.inscritas)} mulheres já estão dentro</small>` : ""}<span class="d21-entrada-bt">CONHECER DESAFIO</span></button>`;
}
function d21PoeCard(){
  const box = $("t-inicio"); if(box) d21PoeCardEm(box, "d21-card", b => { const capa = b.querySelector(".capa"); if(capa) capa.insertAdjacentHTML("afterend", d21CardHTML("d21-card")); else b.insertAdjacentHTML("afterbegin", d21CardHTML("d21-card")); });
  /* Treinos › Programas: junto dos outros desafios */
  const ds = document.querySelector("#t-treinar .xe-desafios");
  if(ds) d21PoeCardEm(ds, "d21-card-t", b => { const st = b.querySelector(".sec-title"); (st || b).insertAdjacentHTML(st ? "afterend" : "afterbegin", d21CardHTML("d21-card-t")); });
}
function d21PoeCardEm(box, id, poe){
  const old = $(id), h = d21CardHTML(id);
  if(!h){ if(old) old.remove(); return; }
  if(old) old.outerHTML = h; else poe(box);
  const c = $(id); if(c) c.onclick = () => { if(!d21Insc()) d21Ev("challenge_viewed", { onde: id === "d21-card" ? "inicio" : "treinos" }); d21Abrir(d21Ed().fase === "finalizada" ? "jornada" : "hoje"); };
}
const rTreinarD21 = rTreinar;
rTreinar = function(){
  const r = rTreinarD21.apply(this, arguments);
  try{ if(D21.st) d21PoeCard(); d21Carrega(false).then(() => { if(TAB === "treinar") d21PoeCard(); }); }catch(e){ console.warn(e); }
  return r;
};
const rInicioD21 = rInicio;
rInicio = function(){
  const r = rInicioD21.apply(this, arguments);
  try{ if(D21.st) d21PoeCard(); d21Carrega(false).then(() => { if(TAB === "inicio") d21PoeCard(); d21Retoma(); }); }catch(e){ console.warn(e); }
  return r;
};
/* volta para dentro se ela fechou o app lá dentro, ou se veio de um aviso (?d21=hoje|comunidade) */
let D21_RET = false;
function d21Retoma(){
  if(D21_RET || D21.aberto) return; D21_RET = true;
  let aba = null; try{ const u = new URL(location.href); aba = u.searchParams.get("d21"); if(aba){ u.searchParams.delete("d21"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } }catch(e){}
  let dentro = null; try{ dentro = localStorage.getItem(D21_K); }catch(e){}
  const e = d21Ed(); if(!e || !d21Insc()) return;
  if(aba || (dentro === e.id && e.fase !== "finalizada")) d21Abrir(["hoje", "comunidade", "jornada"].includes(aba) ? aba : "hoje");
}
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && D21.aberto && Date.now() - D21.t > 300000) d21Carrega(true).then(d21Pinta); });
