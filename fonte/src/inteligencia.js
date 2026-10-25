/* ===================== INTELIGÊNCIA CK LIFE =====================
   Próxima melhor ação (uma só, lógica simples), Plano B, "Hoje só tenho X min", retomar treino, trocar exercício,
   Minha semana mudou / Semana difícil, Minhas vitórias, busca global, Meus salvos, atalhos da Parceira no chat,
   Squad CK, Desafio coletivo, reconhecimentos da semana. Tudo com dados que o app já tem; sem IA, sem serviço novo.
   Cada parte pode ser desligada em Painel › Módulos do app. */
const IOn = k => modOn(k);
/* alunas não publicam vídeo em Stories (foto e texto continuam) */
storyVideo = async function(){ toast("Stories aceitam foto e texto. Envio de vídeo não está disponível."); };

/* ---------- Retomar treino ---------- */
const RET_K = () => "ck_retomar_" + ((ME && ME.id) || "");
function retSalva(){ try{ if(!PL || !PL.T || PL.fase === "fim" || PL.i < 1) return; const T = PL.T;
  localStorage.setItem(RET_K(), JSON.stringify({ T: { nome: T.nome, steps: T.steps, prog: T.prog || null, di: T.di, sem: T.sem, rapido: T.rapido || null, cor: T.cor, sub: T.sub }, i: PL.i, n: T.steps.length, ts: Date.now() })); }catch(e){} }
function retLe(){ try{ const r = JSON.parse(localStorage.getItem(RET_K()) || "null"); if(!r || !r.T || !Array.isArray(r.T.steps) || r.i < 1 || r.i >= r.n || Date.now() - r.ts > 3 * 864e5) return null; return r; }catch(e){ return null; } }
function retLimpa(){ try{ localStorage.removeItem(RET_K()); }catch(e){} }
function retomar(){ const r = retLe(); if(!r) return toast("Não há treino para continuar"); fecharSheet(); iniciaTreino(r.T); calar(); PL.i = r.i; for(let k = 0; k < r.i; k++) PL.feitos.add(k); PL.fase = "prep"; PL.rem = 5; desenhaPlay(); }

/* ---------- Trocar exercício (só catálogo existente) ---------- */
const EXROW = id => (window.EX || []).find(r => r[0] === id);
const EXPAD = id => { for(const [k, L] of Object.entries(typeof PA_POOL !== "undefined" ? PA_POOL : {})) if(L.includes(id)) return k; return null; };
const EXMET = id => (META && META[id] && META[id].met) || 5;
const CASA_IDS = () => new Set([].concat(...Object.values(typeof PA_POOL !== "undefined" ? PA_POOL : {}), ...QUICK.flatMap(q => q.itens.map(i => i[0]))));
const TROCA_MOT = [["equip", "Não tenho equipamento"], ["dificil", "Muito difícil"], ["facil", "Muito fácil"], ["desconforto", "Estou desconfortável"], ["naogosto", "Não gosto desse exercício"]];
function trocaCandidato(id, mot){
  const r = EXROW(id), gr = r && r[2], pad = EXPAD(id), m = EXMET(id), casa = CASA_IDS();
  let L = [...casa].filter(x => x !== id && EXROW(x) && (EXPAD(x) === pad && pad || (EXROW(x)[2] === gr)));
  L.sort((a, b) => (EXPAD(b) === pad) - (EXPAD(a) === pad));
  if(mot === "dificil" || mot === "desconforto") L = L.filter(x => EXMET(x) < m || (mot === "desconforto" && EXMET(x) <= m)).sort((a, b) => EXMET(b) - EXMET(a));
  else if(mot === "facil") L = L.filter(x => EXMET(x) > m).sort((a, b) => EXMET(a) - EXMET(b));
  else if(mot === "equip") L = L.filter(x => /peso do corpo|nenhum|sem equip/i.test(EXROW(x)[3] || "") || casa.has(x));
  return L[0] || null;
}
function trocarExercicio(){
  if(!PL) return; const s = PL.T.steps[PL.i], e = exById(s.id); PL.pausa = true;
  sheet("Trocar exercício", `<p class="muted" style="margin-top:0">${esc(e.nome)} · por que você quer trocar?</p><div class="opts">${TROCA_MOT.map(([k, n]) => `<button class="opt" data-tm="${k}"><span>${n}</span></button>`).join("")}</div>`, () => { if(PL) PL.pausa = false; });
  document.querySelectorAll("[data-tm]").forEach(b => b.onclick = () => {
    const novo = trocaCandidato(s.id, b.dataset.tm);
    if(!novo){ toast("Não encontramos uma troca segura para esse. Você pode pular ou fazer no seu ritmo."); return; }
    const velho = s.id; PL.T.steps.forEach((x, j) => { if(j >= PL.i && x.id === velho) x.id = novo; });
    fecharSheet(); PL.pausa = false; toast(`Trocamos por ${exById(novo).nome} 💚`); if(PL.fase === "ex") comecaExercicio(); else desenhaPlay(); trocaBotao(); });
}
function trocaBotao(){ try{ retSalva(); if(!PL || !IOn("troca") || PL.fase === "rest" || PL.fase === "fim" || $("pl-troca")) return;
  const alvo = document.querySelector("#play .pnext") || $("pl-skip") || $("pl-pula"); if(!alvo) return;
  alvo.insertAdjacentHTML("beforebegin", `<button class="link pl-troca" id="pl-troca">⇄ Trocar exercício</button>`); $("pl-troca").onclick = trocarExercicio; }catch(e){ console.warn(e); } }
new MutationObserver(trocaBotao).observe($("play"), { childList: true });   // vale para todas as telas do player (inclusive a explicação por voz)
const fimTreinoI = fimTreino; fimTreino = function(){ retLimpa(); const r = fimTreinoI.apply(this, arguments); try{ dcPosTreino(); }catch(e){} return r; };

/* ---------- Minha semana mudou / Semana difícil (temporário; o Plano do Ano fica intacto) ---------- */
const SEM_MOT = [["sem_tempo", "Estou sem tempo"], ["poucos_dias", "Só consigo alguns dias"], ["viajando", "Estou viajando"], ["leve", "Quero uma semana mais leve"], ["rotina", "Minha rotina mudou essa semana"]];
function semanaMudou(){ const s = ME.semanaMudou; if(!s || !s.fim || s.fim < today()) return null; return s; }
window.ckAlvoSemana = base => semanaMudou() ? Math.min(2, base) : base;
function minhaSemanaMudou(){
  const s = semanaMudou();
  sheet("Minha semana mudou", s ? `<div class="sm-ativa"><b>Semana difícil ativa até ${brD(s.fim).slice(0, 5)}</b><p>Essa semana vamos diminuir o tamanho do compromisso, não abandonar o processo.</p></div>
      <button class="btn btn-accent btn-block btn-lg" id="sm-volta">VOLTAR AO MEU PLANO NORMAL</button>`
    : `<p class="muted" style="margin-top:0">Seu Plano do Ano continua guardado. Vamos só ajustar o tamanho desta semana.</p><div class="opts">${SEM_MOT.map(([k, n]) => `<button class="opt" data-sm="${k}"><span>${n}</span></button>`).join("")}</div>
      <div class="seg" role="group" id="sm-per" style="margin-top:10px"><button data-sp="semana" aria-pressed="true">Só esta semana</button><button data-sp="7" aria-pressed="false">Próximos 7 dias</button></div>`);
  const v = $("sm-volta"); if(v) v.onclick = () => { delete ME.semanaMudou; save(); fecharSheet(); toast("De volta ao seu plano normal 💚"); rerender(); };
  let per = "semana"; document.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => { per = b.dataset.sp; document.querySelectorAll("[data-sp]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  document.querySelectorAll("[data-sm]").forEach(b => b.onclick = () => { const fim = per === "7" ? addD(today(), 6) : addD(semanaKey(), 6);
    ME.semanaMudou = { motivo: b.dataset.sm, ini: today(), fim }; save(); fecharSheet(); SOM.check && SOM.check(); toast("Essa semana vamos diminuir o tamanho do compromisso, não abandonar o processo."); rerender(); });
}

/* ---------- Plano B e "Hoje só tenho X min" ---------- */
function planoB(){
  sheet("Plano B", `<div class="pb-top"><p>Seu dia apertou? Ainda dá para manter seu compromisso.</p><b>POUCO AINDA CONTA.</b></div>
    <div class="pb-grid">${[["t5", "5 MIN"], ["t10", "10 MIN"], ["t15", "15 MIN"], ["cam", "CAMINHADA"], ["alo", "ALONGAMENTO"], ["desc", "DESCANSAR"]].map(([k, n]) => `<button class="btn ${k === "t5" ? "btn-accent" : "btn-line"}" data-pb="${k}">${n}</button>`).join("")}</div>
    ${IOn("semana") ? `<button class="link" id="pb-sem" style="align-self:center">Minha semana mudou</button>` : ""}`);
  document.querySelectorAll("[data-pb]").forEach(b => b.onclick = () => coachAcao(b.dataset.pb));
  const sm = $("pb-sem"); if(sm) sm.onclick = minhaSemanaMudou;
}
function soTenho(){
  sheet("Hoje só tenho…", `<p class="muted" style="margin-top:0">Escolha o tempo. O CK Life escolhe um treino que cabe.</p><div class="pb-grid">${[5, 10, 15, 20].map(m => `<button class="btn btn-line" data-st="${m}">${m} MIN</button>`).join("")}</div>`);
  document.querySelectorAll("[data-st]").forEach(b => b.onclick = () => {
    const X = +b.dataset.st, H = (typeof humorHoje === "function" && humorHoje()) || {}, cansada = H.h === "1" || H.e === "baixa", C = [];
    try{ if(cDiaDoPlano() && !semanaMudou()){ const T = treinoDoDia(); C.push([minTreino(T), T, 3]); } }catch(e){}
    [5, 10, 15].forEach(k => { const q = COACH_MINI[k], T = montaTreino({ nome: q.nome, tipo: "circuito", rodadas: q.rodadas, descRodada: q.descRodada, itens: q.itens }, 1, { rapido: q.id, cor: "#2E7D5A", sub: q.foco }); C.push([minTreino(T), T, 2]); });
    if(cansada){ const q = COACH_MINI.alo, T = montaTreino({ nome: q.nome, tipo: "circuito", rodadas: 1, descRodada: 0, itens: q.itens }, 1, { rapido: q.id, cor: "#2E7D5A", sub: q.foco }); C.push([minTreino(T), T, 4]); }
    QUICK.forEach((q, i) => { if(i < 3 || pode("treinos_rapidos_todos")){ const T = treinoRapido(q); C.push([minTreino(T), T, 1]); } });
    const ok = C.filter(c => c[0] <= X + 1).sort((a, b) => (b[2] * 100 + b[0]) - (a[2] * 100 + a[0]) || 0);
    const melhor = ok.filter(c => c[0] >= X - 6).sort((a, b) => b[2] - a[2] || b[0] - a[0])[0] || ok.sort((a, b) => b[0] - a[0])[0];
    if(!melhor) return toast("Escolha um tempo um pouco maior 💚");
    fecharSheet(); toast("Sem problema. Vamos adaptar seu dia."); abrirTreinoPreview(melhor[1]); });
}

/* ---------- Próxima melhor ação (uma ação principal) ---------- */
function nbaDecide(){
  const r = IOn("retomar") && retLe(), feito = diasTreino().has(today()), H = (typeof humorHoje === "function" && humorHoje()) || {}, sem = (ME.treinos || []).length ? cDiasSem() : null;
  if(r) return { t: "Continuar treino", s: `Você parou no exercício ${r.i + 1} de ${r.n}: ${r.T.nome}.`, b: ["CONTINUAR TREINO", "ret"] };
  if(!feito && sem != null && sem >= 3) return { t: "Voltar ao plano", s: "Voltar também é progresso. Comece leve, sem compensar nada.", b: ["TREINO 5 MIN", "t5"] };
  if(semanaMudou() && !feito) return { t: "Semana difícil", s: "Essa semana vamos diminuir o tamanho do compromisso, não abandonar o processo.", b: ["VER PLANO B", "planob"], volta: 1 };
  if(COACH().descanso[today()]) return { t: "Hoje é dia de descanso", s: "Descansar também faz parte da constância.", b: ["VER MISSÃO", "mis"] };
  if(feito) return IOn("vitorias") ? { t: "Treino feito hoje 💚", s: "Registre algo bom que você percebeu em você.", b: ["REGISTRAR VITÓRIA", "vit"] } : { t: "Treino feito hoje 💚", s: "Veja como está sua semana.", b: ["VER MISSÃO", "mis"] };
  if(H.h === "1" || H.e === "baixa") return { t: "Vamos no leve hoje", s: "Você contou que está cansada. Um alongamento já conta.", b: ["ALONGAMENTO", "alo"] };
  if(H.t && +H.t <= 10) return { t: "Pouco tempo hoje", s: "10 minutos já mantêm o seu compromisso.", b: ["TREINO 10 MIN", "t10"] };
  if(cDiaDoPlano()){ let T = null; try{ T = treinoDoDia(); }catch(e){}
    return { t: H.h === "4" ? "Animada? Hoje dá para o treino completo" : "Começar treino do dia", s: T ? `${T.nome} · cerca de ${minTreino(T)} min` : "Seu treino de hoje está pronto.", b: ["COMEÇAR TREINO DO DIA", "plano"] }; }
  return { t: "Dia livre no seu plano", s: "Uma caminhada leve ou um alongamento caem bem.", b: ["CAMINHADA", "cam"] };
}
function nbaAcao(k){ SOM.tap && SOM.tap();
  if(k === "ret") return retomar(); if(k === "planob") return planoB(); if(k === "vit") return minhasVitorias(); if(k === "so") return soTenho(); if(k === "sem") return minhaSemanaMudou();
  if(k === "volta"){ delete ME.semanaMudou; save(); toast("De volta ao seu plano normal 💚"); return rerender(); }
  if(k === "mis"){ const m = $("mis-ini"); return m && m.scrollIntoView({ behavior: "smooth", block: "center" }); }
  return coachAcao(k); }
function nbaPinta(){
  const co = $("coach-ini"); if(!co) return; const velho = $("nba-ini");
  if(!IOn("nba")){ if(velho) velho.remove(); return; }
  const a = nbaDecide();
  const html = `<section class="nba-ini" id="nba-ini" aria-label="Próxima melhor ação"><span class="nba-eb">Agora, o mais útil para você</span><b class="nba-t">${esc(a.t)}</b><p class="nba-s">${esc(a.s)}</p>
    <button class="btn nba-b" data-nb="${a.b[1]}">${a.b[1] === "ret" || /^t\d|plano/.test(a.b[1]) ? ic("play", 16) : ""}${a.b[0]}</button>
    <div class="nba-lk">${IOn("planob") ? `<button class="link" data-nb="so">Hoje só tenho…</button><button class="link" data-nb="planob">Plano B</button>` : ""}${IOn("semana") ? (semanaMudou() ? `<button class="link" data-nb="volta">Voltar ao meu plano normal</button>` : `<button class="link" data-nb="sem">Minha semana mudou</button>`) : ""}</div></section>`;
  const tmp = document.createElement("div"); tmp.innerHTML = html; const n = tmp.firstElementChild;
  if(velho && velho.innerHTML === n.innerHTML){ if(velho.nextElementSibling !== co) co.before(velho); } else { if(velho) velho.replaceWith(n); else co.before(n); }
  $("nba-ini").querySelectorAll("[data-nb]").forEach(b => b.onclick = () => nbaAcao(b.dataset.nb));
}
const coachPintaI = coachPinta; coachPinta = function(){ const r = coachPintaI.apply(this, arguments); try{ nbaPinta(); dcPinta(); }catch(e){ console.warn(e); } return r; };

/* ---------- Minhas vitórias ---------- */
const VIT_OP = [["disposicao", "Estou com mais disposição"], ["sono", "Dormi melhor"], ["correr", "Consegui correr mais"], ["forte", "Estou me sentindo mais forte"], ["semvontade", "Treinei mesmo sem vontade"],
  ["voltei", "Voltei depois de parar"], ["rotina", "Mantive minha rotina"], ["dificil", "Consegui algo que antes era difícil"], ["outra", "Outra vitória"]];
const vitNome = k => (VIT_OP.find(v => v[0] === k) || [k, "Vitória"])[1];
function minhasVitorias(){
  const L = (ME.vitorias || []).slice().reverse(); let sel = null;
  sheet("Minhas vitórias", `<p class="muted" style="margin-top:0">Progresso também é o que você sente. Só você vê.</p><div class="vt-op">${VIT_OP.map(([k, n]) => `<button class="chip" data-vt="${k}">${n}</button>`).join("")}</div>
    <div class="field"><textarea class="input" id="vt-tx" maxlength="120" placeholder="Quer contar mais? (opcional)"></textarea></div><button class="btn btn-accent btn-block" id="vt-ok" disabled>Guardar minha vitória</button>
    ${L.length ? `<div class="nb-sec">Suas vitórias</div><div class="vt-lista">${L.slice(0, 30).map(v => `<div class="vt-it"><b>🏅 ${esc(vitNome(v.k))}</b>${v.t ? `<p>${esc(v.t)}</p>` : ""}<small>${brD(v.d)}</small></div>`).join("")}</div>` : ""}`);
  document.querySelectorAll("[data-vt]").forEach(b => b.onclick = () => { sel = b.dataset.vt; document.querySelectorAll("[data-vt]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("vt-ok").disabled = false; });
  $("vt-ok").onclick = () => { if(!sel) return; ME.vitorias = (ME.vitorias || []).concat([{ d: today(), k: sel, t: $("vt-tx").value.trim().slice(0, 120) }]).slice(-200); save(); SOM.chime && SOM.chime(); vibra([30, 40, 60]);
    const v = ME.vitorias[ME.vitorias.length - 1];
    sheet("Vitória guardada 💚", `<div class="pb-top"><b>🏅 ${esc(vitNome(v.k))}</b>${v.t ? `<p>${esc(v.t)}</p>` : ""}<p>Isso também é evolução.</p></div>
      ${SO.on() ? `<button class="btn btn-line btn-block" id="vt-comp">${ic("people", 16)} Compartilhar na comunidade</button>` : ""}<button class="btn btn-accent btn-block" id="vt-fim">Fechar</button>`);
    $("vt-fim").onclick = fecharSheet; const c = $("vt-comp"); if(c) c.onclick = () => { fecharSheet(); tab("juntas"); setTimeout(() => abreComposer(`🏅 ${vitNome(v.k)}${v.t ? ": " + v.t : ""}`, null, { conquista: VIT_CONQ }), 350); }; };
}
const eventosJornadaI = eventosJornada;
eventosJornada = function(){ const E = eventosJornadaI.apply(this, arguments); (ME.vitorias || []).forEach(v => E.push([v.d, "🏅", vitNome(v.k)])); return E.sort((a, b) => a[0].localeCompare(b[0])); };

/* ---------- Busca global ---------- */
const semAc = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function buscaIndice(){
  const I = [];
  QUICK.forEach((q, i) => I.push(["Treinos", q.nome, q.foco, () => abrirTreinoPreview(treinoRapido(q))]));
  [5, 10, 15, "alo"].forEach(k => I.push(["Treinos", COACH_MINI[k].nome, "Pouco ainda conta", () => coachTreino(k)]));
  (PROGS || []).forEach(p => I.push(["Treinos", p.nome, "Programa", () => abrirPrograma(p.id)]));
  (window.EX || []).forEach(r => I.push(["Exercícios", r[1], r[2], () => abrirExercicio(r[0])]));
  (BASE_REC || []).forEach(rc => I.push(["Receitas", rc.nome, rc.cat || "", () => abrirReceita(rc.id)]));
  if(typeof CAB !== "undefined" && cabOn()){ (CAB.L || []).forEach(p => I.push(["Penteados", p.nome, [p.tipos, p.comp].flat().join(" "), () => { fecharSheet(); if(typeof abreCabelo === "function") abreCabelo(); }]));
    if(!(CAB.L || []).length) ["cabelo", "penteado", "cacheado", "crespo", "liso", "ondulado", "trança", "coque", "rabo"].forEach(w => I.push(["Penteados", "Cabelo para Treinar", w, () => { fecharSheet(); if(typeof abreCabelo === "function") abreCabelo(); }])); }
  if(typeof GRP !== "undefined") [...GRP.values()].forEach(g => I.push(["Grupos", g.nome, g.descricao || "", () => abrirGrupo(g)]));
  if(typeof explorarOn === "function" && explorarOn()){
    (DB.profissionais || []).filter(p => p.ativo !== false).forEach(p => I.push(["Profissionais", p.nome, [p.cat, p.esp, p.tipo].filter(Boolean).join(" "), () => abrirProf(p.id)]));
    (DB.empresas || []).filter(p => p.ativo !== false).forEach(p => I.push(["Empresas", p.nome, [p.tipo, p.modalidades].filter(Boolean).join(" "), () => abrirEmp(p.id)]));
    (DB.produtos || []).filter(p => p.ativo !== false).forEach(p => I.push(["Produtos", p.nome, [p.marca, p.cat].filter(Boolean).join(" "), () => abrirProd(p.id)]));
  }
  return I.map(x => (x.k = semAc(x[1] + " " + x[2]), x));
}
function buscaGlobal(){
  sheet("Buscar no CK Life", `<div class="search"><input class="input" id="bg-q" placeholder="Treino, receita, exercício, profissional…" autocomplete="off"></div><div id="bg-r" class="bg-r"><p class="muted">Ex.: frango, agachamento, nutricionista, cacheado</p></div>`);
  let IDX = null, tm = null; const inp = $("bg-q"); setTimeout(() => inp && inp.focus(), 200);
  inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { const q = semAc(inp.value.trim()), box = $("bg-r"); if(!box) return;
    if(q.length < 2){ box.innerHTML = `<p class="muted">Digite pelo menos 2 letras.</p>`; return; }
    IDX = IDX || buscaIndice(); const ws = q.split(/\s+/), R = IDX.filter(x => ws.every(w => x.k.includes(w)));
    const grupos = {}; R.forEach(x => (grupos[x[0]] = grupos[x[0]] || []).push(x));
    box.innerHTML = R.length ? Object.entries(grupos).map(([g, L]) => `<div class="nb-sec">${esc(g)}</div>${L.slice(0, 6).map(x => `<button class="setrow bg-it" data-bi="${IDX.indexOf(x)}"><div><b>${esc(x[1])}</b>${x[2] ? `<small>${esc(String(x[2]).slice(0, 60))}</small>` : ""}</div></button>`).join("")}`).join("")
      : `<p class="muted">Nada encontrado para “${esc(inp.value.trim())}”.</p>`;
    box.querySelectorAll("[data-bi]").forEach(b => b.onclick = () => { const x = IDX[+b.dataset.bi]; fecharSheet(); setTimeout(() => x[3](), 120); }); }, 250); };
}
function buscaBotao(){ if(!IOn("busca")){ const b = $("b-busca"); if(b) b.remove(); return; } const sc = $("streak-chip"); if(!sc || $("b-busca")) return;
  sc.insertAdjacentHTML("beforebegin", `<button class="iconbtn top-busca" id="b-busca" aria-label="Buscar no CK Life">${ic("search", 18)}</button>`); $("b-busca").onclick = buscaGlobal; }
setInterval(buscaBotao, 4000); setTimeout(buscaBotao, 1500);

/* ---------- Meus salvos (junta favoritos que já existem) ---------- */
function meusSalvos(){
  const rec = (ME.favs || []).map(id => BASE_REC.find(r => String(r.id) === String(id))).filter(Boolean);
  const fx = ME.favx || [], pega = (t, L) => fx.filter(x => x.startsWith(t + ":")).map(x => (L || []).find(p => String(p.id) === x.slice(t.length + 1))).filter(Boolean);
  const prof = pega("prof", DB.profissionais), emp = pega("emp", DB.empresas), prod = pega("prod", DB.produtos);
  const pent = typeof CAB !== "undefined" && CAB.favs && CAB.L ? CAB.L.filter(p => CAB.favs.has(p.id)) : [];
  const bloco = (t, L, fn) => L.length ? `<div class="nb-sec">${t}</div>${L.map(x => `<button class="setrow" data-sv="${t}:${x.id}"><div><b>${esc(x.nome)}</b></div></button>`).join("")}` : "";
  const posts = typeof SALVOS !== "undefined" ? SALVOS.size : 0;
  sheet("Meus salvos", `${bloco("Receitas", rec)}${bloco("Penteados", pent)}${bloco("Profissionais", prof)}${bloco("Empresas", emp)}${bloco("Produtos", prod)}
    ${SO.on() ? `<div class="nb-sec">Posts</div><button class="setrow" id="sv-posts"><div><b>Posts salvos</b><small>${posts ? int(posts) + " salvos" : "Ver posts que você salvou"}</small></div></button>` : ""}
    ${!rec.length && !pent.length && !prof.length && !emp.length && !prod.length && !SO.on() ? `<p class="muted">Você ainda não salvou nada. Toque no coração das receitas e dos profissionais para guardar aqui.</p>` : ""}`);
  document.querySelectorAll("[data-sv]").forEach(b => b.onclick = () => { const [t, id] = b.dataset.sv.split(/:(.+)/); fecharSheet(); setTimeout(() => { if(t === "Receitas") abrirReceita(isNaN(+id) ? id : +id); else if(t === "Profissionais") abrirProf(id); else if(t === "Empresas") abrirEmp(id); else if(t === "Produtos") abrirProd(id); else if(typeof abreCabelo === "function") abreCabelo(); }, 120); });
  const sp = $("sv-posts"); if(sp) sp.onclick = () => { fecharSheet(); setTimeout(verSalvos, 120); };
}
const rPerfilI = rPerfil; rPerfil = function(){ const r = rPerfilI.apply(this, arguments); try{
  const ref = $("p-parc") || $("p-coach") || $("p-push");
  if(ref && IOn("vitorias") && !$("p-vit")){ ref.insertAdjacentHTML("afterend", setRow("p-vit", "trophy", "Minhas vitórias", `${(ME.vitorias || []).length} ${(ME.vitorias || []).length === 1 ? "vitória guardada" : "vitórias guardadas"}`)); $("p-vit").onclick = minhasVitorias; }
  const ref2 = $("p-vit") || ref; if(ref2 && !$("p-salvos")){ ref2.insertAdjacentHTML("afterend", setRow("p-salvos", "star", "Meus salvos", "Receitas, profissionais, posts e mais")); $("p-salvos").onclick = meusSalvos; }
  const pp = $("p-parc"); if(pp && !IOn("parceira")) pp.remove(); }catch(e){ console.warn(e); } return r; };

/* ---------- Parceira CK: atalhos no chat existente (mensagens normais) ---------- */
const PARC_ATALHOS = ["Bora? 💚", "Terminei ✅", "Treino feito!", "Fechamos hoje?", "Cadê você? 😂"];
const abreConversaI = abreConversa;
abreConversa = async function(c){ const r = await abreConversaI.apply(this, arguments);
  try{ const pid = PARC && PARC.status === "ativa" && PARC.outra && PARC.outra.user_id; if(pid && IOn("parceira") && c && (c.a === pid || c.b === pid) && !$("pc-at")){ const t = $("cv-t"), env = $("cv-env");
    if(t && env){ t.closest("div").insertAdjacentHTML("beforebegin", `<div class="hscroll pc-at" id="pc-at">${PARC_ATALHOS.map(x => `<button class="chip" data-pa="${esc(x)}">${esc(x)}</button>`).join("")}</div>`);
      document.querySelectorAll("[data-pa]").forEach(b => b.onclick = () => { t.value = b.dataset.pa; t.dispatchEvent(new Event("input", { bubbles: true })); env.click(); }); } } }catch(e){ console.warn(e); }
  return r; };

/* ---------- Squad CK (modalidade dos Grupos) ---------- */
const abrirGrupoI = abrirGrupo; abrirGrupo = async function(g){ const r = await abrirGrupoI.apply(this, arguments);
  try{ if(g && g.squad && IOn("squad")){ const top = document.querySelector("#sheet .so-gr-top small.num"); if(top && !top.dataset.sq){ top.dataset.sq = 1; top.insertAdjacentHTML("beforebegin", `<span class="sq-tag">SQUAD CK · ${int(g.membros)}/${int(g.max_membros || 15)}</span>`);
    if(!g.eu && g.membros >= (g.max_membros || 15)){ const e = $("gr-entrar"); if(e){ e.disabled = true; e.textContent = "Squad completo"; } } } } }catch(e){}
  return r; };

/* ---------- Desafio coletivo (número real do banco) ---------- */
let DC = null, DC_T = 0;
async function dcCarrega(){ if(!IOn("coletivo") || !NU.ativo || !NU.sb) return DC = null; if(Date.now() - DC_T < 600000) return DC; DC_T = Date.now();
  try{ const r = await NU.sb.rpc("desafio_coletivo_atual"); DC = r.error ? null : r.data; }catch(e){ DC = null; } return DC; }
function dcPinta(){ const ref = $("mis-ini") || $("coach-ini"); if(!ref) return; const v = $("dc-ini");
  if(!DC || !IOn("coletivo")){ if(v) v.remove(); return; }
  const pc = Math.min(100, Math.round(100 * DC.total / Math.max(1, DC.meta)));
  const h = `<section class="dc-ini" id="dc-ini"><span class="mis-eb">Desafio coletivo CK</span><b>${esc(DC.titulo)}</b><span class="bar"><i style="width:${pc}%"></i></span><small class="num">${int(DC.total)} / ${int(DC.meta)} minutos de movimento</small></section>`;
  if(v){ if(v.outerHTML !== h){ v.outerHTML = h; } } else ref.after(Object.assign(document.createElement("div"), { innerHTML: h }).firstElementChild); }
function dcPosTreino(){ const ult = (ME.treinos || [])[ME.treinos.length - 1]; if(!DC || !ult || !ult.min) return; const pc = $("play") && $("play").querySelector(".done-hero h2"); if(!pc) return;
  DC.total += ult.min; DC_T = Date.now();
  pc.insertAdjacentHTML("afterend", `<div class="dc-pos">🌍 Seus ${int(ult.min)} ${ult.min === 1 ? "minuto ajudou" : "minutos ajudaram"} a comunidade a chegar mais perto da meta.</div>`); }

/* ---------- Reconhecimentos da semana (só para ela; nunca ranking) ---------- */
async function reconhecimentos(){
  const R = [], seg = semanaKey(), n = semanaFeitos(seg);
  if(n >= alvoSemana()) R.push(["🔥", "Constância", `${n} dias com treino essa semana`]);
  if(idadeConta() <= 7 && n > 0) R.push(["⭐", "Primeira semana", "Você começou e apareceu por você"]);
  if(((ME.coach && ME.coach.voltasD) || []).some(d => d >= seg)) R.push(["🌱", "Recomeço da semana", "Voltar também é progresso"]);
  if(SO.on()) try{ const r = await SB().from("comentarios").select("id", { count: "exact", head: true }).eq("user_id", NU.uid).gte("criado", new Date(Date.now() - 7 * 864e5).toISOString());
    const c = r.count || 0; if(c >= 5) R.push(["💚", "Acolhedora da semana", `${c} comentários de incentivo`]); if(c >= 12) R.push(["🤝", "Ajudou outras mulheres", "Sua presença fez diferença"]); }catch(e){}
  return R;
}
function reconhPinta(){ const ref = $("vit-hoje") || document.querySelector("#t-juntas .cm-pdia") || $("cm-nova"); if(!ref || $("rc-sem")) return;
  reconhecimentos().then(R => { if(!R.length || $("rc-sem")) return; const r2 = $("vit-hoje") || ref;
    r2.insertAdjacentHTML("afterend", `<section class="rc-sem" id="rc-sem"><span class="eyebrow">Seus reconhecimentos da semana</span><div class="rc-l">${R.map(([e, t, s]) => `<div class="rc-it"><i>${e}</i><span><b>${t}</b><small>${esc(s)}</small></span></div>`).join("")}</div><small class="muted">Só você vê. Aqui ninguém compete com ninguém 💚</small></section>`); }); }
const rJuntasI = rJuntas; rJuntas = function(){ const r = rJuntasI.apply(this, arguments); setTimeout(() => { try{ reconhPinta(); }catch(e){} }, 900); return r; };
const abrirAppI = abrirApp; abrirApp = function(){ const r = abrirAppI.apply(this, arguments); setTimeout(() => dcCarrega().then(() => { if(TAB === "inicio") dcPinta(); }), 3000); return r; };
