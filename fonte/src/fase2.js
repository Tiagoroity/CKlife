/* ===================== FASE 2 · O APP QUE SE ADAPTA AO DIA DELA =====================
   Check-in de 10 segundos (humor, energia, tempo, incômodo) + sinais do Meu Ciclo
   → o treino de hoje e o cardápio de hoje se ajustam sozinhos (sempre dá para voltar ao original).
   Desafio de 21 dias em turma: todas começam na mesma segunda-feira; só números da turma, nunca nomes.
   O check-in fica só no aparelho. Nada aqui é conselho médico. */

const TEMPOS = [[10, "10 min"], [20, "20 min"], [30, "30 min"], [45, "45 min ou mais"]];
const DORES = [["", "Nada"], ["pernas", "Pernas ou joelhos"], ["costas", "Costas"], ["bracos", "Ombros ou braços"]];

/* ---------- Check-in de 10 segundos ---------- */
checkinDia = function(h, editar){
  const H0 = humorHoje() || {};
  sheet("Como você está hoje?", `<div class="xe-hum grande">${XHUMOR.map(([k, e, n]) => `<button data-hm="${k}" aria-pressed="${k === h}"><i>${e}</i><small>${n}</small></button>`).join("")}</div>
    <h3 class="ck2-h">Sua energia</h3><div class="chips">${XENERGIA.map(([k, n]) => `<button class="chip" data-en="${k}" aria-pressed="${(H0.e || "") === k}">${n}</button>`).join("")}</div>
    <h3 class="ck2-h">Quanto tempo você tem para treinar?</h3><div class="chips">${TEMPOS.map(([k, n]) => `<button class="chip" data-tp="${k}" aria-pressed="${+H0.t === k}">${n}</button>`).join("")}</div>
    <h3 class="ck2-h">Algo incomodando?</h3><div class="chips">${DORES.map(([k, n]) => `<button class="chip" data-dr="${k}" aria-pressed="${(H0.dor || "") === k}">${n}</button>`).join("")}</div>
    <p class="hint" style="margin-top:14px">${ic("lock", 13)} Fica só neste aparelho. Usamos para ajustar seu treino e seu cardápio de hoje. Dor forte ou diferente do normal: pare e procure um profissional de saúde.</p>
    <button class="btn btn-accent btn-block btn-lg" id="ck-ok">Ajustar meu dia</button>`, rInicio);
  let hs = h, en = H0.e || "", tp = +H0.t || 0, dr = H0.dor || "";
  const b = $("sheet-body");
  const grupo = (sel, set) => b.querySelectorAll(sel).forEach(x => x.onclick = () => { set(x); b.querySelectorAll(sel).forEach(y => y.setAttribute("aria-pressed", y === x)); });
  grupo("[data-hm]", x => hs = x.dataset.hm); grupo("[data-en]", x => en = x.dataset.en); grupo("[data-tp]", x => tp = +x.dataset.tp); grupo("[data-dr]", x => dr = x.dataset.dr);
  $("ck-ok").onclick = () => {
    const H = HUM.get(); H[today()] = { h: hs, e: en || null, t: tp || null, dor: dr || null };
    const ks = Object.keys(H).sort(); if(ks.length > 60) ks.slice(0, ks.length - 60).forEach(k => delete H[k]); HUM.set(H);
    if(ME.ajusteOff === today()) ME.ajusteOff = null;
    refazCardapioHoje(); save();
    SOM.check && SOM.check(); vibra(15); fecharSheet();
    const a = ajusteDoDia(); toast(a.motivos.length ? "Pronto! Ajustei seu treino e seu cardápio de hoje 💚" : editar ? "Atualizado 💚" : "Obrigada por contar 💚");
  };
};

/* ---------- O que muda hoje (check-in + sinais do Meu Ciclo) ---------- */
function ajusteDoDia(){
  const H = humorHoje() || {}, motivos = [];
  const cc = (typeof CIC !== "undefined" && CIC && (CIC.checkins || {})[today()]) || null;
  let fase = null; try{ const k = CIC && cicloCalc(CIC); fase = k ? k.fase : null; }catch(e){}
  const sinaisCiclo = cc ? ((cc.energia === "baixa" ? 1 : 0) + ((cc.sint || []).includes("colica") ? 1 : 0) + (cc.fluxo === "intenso" ? 1 : 0) + (cc.sono === "ruim" ? 1 : 0)) : 0;
  const leve = H.e === "baixa" || H.h === "1" || sinaisCiclo > 0;
  if(H.e === "baixa" || H.h === "1") motivos.push("menos energia hoje");
  if(sinaisCiclo) motivos.push("sinais do Meu Ciclo");
  if(H.t) motivos.push(`${H.t >= 45 ? "45+" : H.t} min disponíveis`);
  if(H.dor) motivos.push("poupando " + (DORES.find(d => d[0] === H.dor) || [, ""])[1].toLowerCase());
  return { leve, tempo: H.t || 0, dor: H.dor || "", fase, motivos, alta: H.e === "alta" && !leve };
}

/* ---------- Ajuste do treino ---------- */
const IMPACTO = { agachsalto: "agacho", burpee: "toqueombro", polichinelo: "abdpe", corrida: "abdpe", skater: "afundocasa", pularcorda: "abdpe", escalador: "prancha" };
const POUPA = {
  pernas: { ex: ["agacho","agachsalto","afundocasa","bulgarocasa","sumocasa","wallsit","stepup","skater","burpee","corrida","pularcorda","polichinelo","panturrilha"], troca: ["prancha","deadbug","abdsupra","flexjoelho","supermann","bicicleta","pranchalat"] },
  costas: { ex: ["supermann","burpee","russo","vup","invrow","barrafixa","hollow","pike"], troca: ["deadbug","ponte","hidrante","coice","alongquad","crianca"] },
  bracos: { ex: ["flexao","flexjoelho","flexinc","flexdiam","pike","mergulho","invrow","barrafixa","prancha","pranchalat","toqueombro","burpee","escalador"], troca: ["agacho","ponte","hidrante","coice","abdpe","deadbug","sumocasa"] }
};
function ajustaTreino(T, a){
  if(!T || !T.steps || !T.steps.length) return T;
  let steps = T.steps.map(s => ({ ...s })); const mud = [];
  // 1) incômodo: troca os exercícios que puxam mais daquela região
  if(a.dor && POUPA[a.dor]){ const P = POUPA[a.dor], ja = new Set(); let k = 0, n = 0;
    const mapa = {}; steps.forEach(s => { if(P.ex.includes(s.id) && !mapa[s.id]){ let t; do { t = P.troca[k++ % P.troca.length]; } while(ja.has(t) && k < 40); ja.add(t); mapa[s.id] = t; n++; } });
    steps = steps.map(s => mapa[s.id] ? { ...s, id: mapa[s.id] } : s); if(n) mud.push(`${n} ${n === 1 ? "exercício trocado" : "exercícios trocados"}`); }
  // 2) pouca energia: sem impacto e um pouco menos de volume
  if(a.leve){ let n = 0; steps = steps.map(s => IMPACTO[s.id] ? (n++, { ...s, id: IMPACTO[s.id] }) : s);
    steps = steps.map(s => ({ ...s, val: Math.max(s.modo === "t" ? 15 : 4, Math.round(s.val * .75)) }));
    mud.push(n ? "sem impacto e mais leve" : "mais leve"); }
  // 3) tempo: tira rodadas, depois séries, depois exercícios do fim
  if(a.tempo){ const alvo = a.tempo >= 45 ? 999 : a.tempo, antes = minTreino({ steps });
    let guard = 0;
    while(minTreino({ steps }) > alvo * 1.1 && steps.length > 3 && guard++ < 60){
      const maxR = Math.max(...steps.map(s => s.rodada || 1)), maxS = Math.max(...steps.map(s => s.serie || 1));
      let prox = maxR > 1 ? steps.filter(s => (s.rodada || 1) < maxR).map(s => ({ ...s, rodadas: maxR - 1 }))
        : maxS > 1 ? steps.filter(s => (s.serie || 1) < maxS || (s.series || 1) === 1).map(s => ({ ...s, series: Math.min(s.series || 1, maxS - 1) })) : null;
      // tirar uma rodada inteira deixaria curto demais? então tira só o último exercício
      if(!prox || minTreino({ steps: prox }) < alvo * .75) prox = steps.slice(0, -1);
      steps = prox;
    }
    const depois = minTreino({ steps }); if(depois < antes) mud.push(`cabe em ${depois} min`); }
  if(!mud.length) return T;
  steps = steps.map((s, i) => ({ ...s, desc: i === steps.length - 1 ? 0 : s.desc || 0 }));
  return { ...T, steps, ajuste: mud, ajusteMotivos: a.motivos, original: T };
}
const treinoDoDiaF2 = treinoDoDia; treinoDoDia = function(){
  const T = treinoDoDiaF2.apply(this, arguments);
  if(!ME || ME.ajusteOff === today()) return T;
  try{ return ajustaTreino(T, ajusteDoDia()); }catch(e){ console.warn(e); return T; }
};
/* prévia do treino: mostra o que foi ajustado e deixa voltar ao original */
const abrirTreinoPreviewF2 = abrirTreinoPreview; abrirTreinoPreview = function(T){
  const r = abrirTreinoPreviewF2.apply(this, arguments);
  if(T && T.ajuste){ const b = $("sheet-body"); if(b && !b.querySelector(".aj-box")){
    b.insertAdjacentHTML("afterbegin", `<div class="aj-box">${ic("bolt", 18)}<div><b>Ajustado ao seu dia</b><small>${esc(T.ajuste.join(" · "))}${T.ajusteMotivos && T.ajusteMotivos.length ? ` (${esc(T.ajusteMotivos.join(", "))})` : ""}</small><button class="link" id="aj-orig">Usar o treino original</button></div></div>`);
    $("aj-orig").onclick = () => { ME.ajusteOff = today(); save(); SOM.tap(); toast("Ok! Hoje vai o treino original."); if(TAB === "inicio") rInicio(); abrirTreinoPreview(treinoDoDia()); }; } }
  return r;
};
/* Seu dia: sinaliza quando o treino foi ajustado; convida ao check-in quando ainda não fez */
const rInicioF2 = rInicio; rInicio = function(){
  const r = rInicioF2.apply(this, arguments);
  try{ const T = treinoDoDia(), l = document.querySelector("#t-inicio .sd-l small");
    if(T.ajuste && l && !diasTreino().has(today())) l.insertAdjacentHTML("beforeend", ` · <b class="aj-tag">ajustado</b>`);
    const go = $("sd-go"); if(go) go.onclick = () => abrirTreinoPreview(T);
    turmaInicio();
  }catch(e){ console.warn(e); }
  return r;
};

/* ---------- Cardápio que acompanha o dia ---------- */
const FERRO = /feij[aã]o|lentilha|gr[aã]o-de-bico|espinafre|carne|patinho|f[ií]gado|ovo|beterraba|couve|quinoa|tofu/i;
candidatos = function(k){
  const m = metas(ME), alvo = m.kcal * PARTES[k], goal = alvoTag(), a = ajusteDoDia(), curto = a.tempo && a.tempo <= 20, ferro = a.fase === "menstrual";
  return receitas().filter(r => CANDS[k].includes(r.cat)).map(r => { const porc = meiaPorc(alvo / r.kcal);
    let s = Math.abs(r.kcal * porc - alvo) - (recTags(r).includes(goal) ? 90 : 0) - r.p * 2;
    if(curto && r.min > 15) s += 160; if(ferro && FERRO.test((r.ing || []).join(" "))) s -= 70;
    return { id: r.id, porc, s }; }).sort((x, y) => x.s - y.s).slice(0, 14);
};
function refazCardapioHoje(){ const d = today(); if(ME.cardapio && ME.cardapio[d] && !(ME.cardapioManual || {})[d]) delete ME.cardapio[d]; }
const rCardapioF2 = rCardapio; rCardapio = function(){
  const r = rCardapioF2.apply(this, arguments);
  const body = $("d-body"); if(!body) return r;
  body.querySelectorAll("[data-troca]").forEach(b => b.addEventListener("click", () => { ME.cardapioManual = ME.cardapioManual || {}; ME.cardapioManual[DD] = true; }, true));
  if(DD === today() && body.querySelector(".meal") && !body.querySelector(".aj-box")){ const a = ajusteDoDia(), L = [];
    if(a.tempo && a.tempo <= 20) L.push("receitas mais rápidas, porque o tempo está curto");
    if(a.fase === "menstrual") L.push("mais receitas com boas fontes de ferro, como feijão, lentilha e ovos");
    if(L.length){ const p = body.querySelector(".cdp") || body.firstElementChild; if(p) p.insertAdjacentHTML("afterend", `<div class="aj-box">${ic("leaf", 18)}<div><b>Cardápio ajustado ao seu dia</b><small>${esc(L.join("; "))}.</small></div></div>`); } }
  return r;
};

/* ---------- Desafio de 21 dias em TURMA ---------- */
const dm = d => d.slice(8, 10) + "/" + d.slice(5, 7);
const segundaTurma = () => { const d = new Date(today() + "T12:00:00"), w = (d.getDay() + 6) % 7; return w === 0 ? today() : addD(today(), 7 - w); };
let TURMA_C = {}, TURMA_T = {};
async function turmaNumeros(t){
  if(!(NU && NU.ativo && NU.sb && NU.uid)) return null;
  if(TURMA_C[t] && Date.now() - (TURMA_T[t] || 0) < 120000) return TURMA_C[t];
  try{ const r = await SB().rpc("desafio_turma", { p_desafio: "d21", p_turma: t }); if(r.error) return null; TURMA_C[t] = r.data; TURMA_T[t] = Date.now(); return r.data; }catch(e){ return null; }
}
const naTurma = () => ME.desafio && ME.desafio.turma && !ME.desafio.fim;
async function turmaSync(){ if(!naTurma() || !(NU && NU.ativo && NU.sb && NU.uid)) return;
  const z = desafioAtual(), t = ME.desafio.turma;
  try{ await SB().from("desafio_participantes").update({ turma: t, inicio: t, progresso: Math.min(30, z ? z.feitos : 0), ...(today() >= t && diasTreino().has(today()) ? { ultimo: today() } : {}) }).eq("user_id", NU.uid).is("fim", null).eq("saiu", false); TURMA_T[t] = 0; }catch(e){} }
function entrarTurma(){
  if(typeof pode === "function" && !pode("desafios_longos")) return paywall("programa_pro");
  if(ME.desafio && !ME.desafio.fim && !confirm("Você já está num desafio. Trocar pelo desafio em turma?")) return;
  const t = segundaTurma(); ME.desafio = { id: "d21", ini: t, turma: t }; save(); SOM.chime && SOM.chime(); vibra(20);
  toast(t === today() ? "Você entrou na turma! Começa hoje 💚" : `Você entrou na turma! Começa segunda, ${dm(t)} 💚`);
  setTimeout(turmaSync, 4000); setTimeout(turmaSync, 12000); rerender();
}
function turmaCardHtml(n){
  const t = segundaTurma(), dentro = naTurma(), tt = dentro ? ME.desafio.turma : t, comecou = today() >= tt, z = dentro ? desafioAtual() : null;
  const num = n ? (dentro && comecou ? `${int(n.inscritas)} na turma · ${int(n.hoje)} treinaram hoje` : `${int(n.inscritas)} ${n.inscritas === 1 ? "inscrita" : "inscritas"} até agora`) : "";
  return `<div class="turma ${dentro ? "on" : ""}"><span class="turma-em">👭</span><div class="turma-tx"><span class="eyebrow">Desafio 21 dias em turma</span>
    <b>${dentro ? (comecou ? `Dia ${Math.min(21, Math.floor((new Date(today()) - new Date(tt)) / 864e5) + 1)} de 21 · ${z ? z.feitos : 0} treinos feitos` : `Sua turma começa ${tt === addD(today(), 1) ? "amanhã" : "segunda, " + dm(tt)}`) : `Próxima turma: ${t === today() ? "começa hoje" : "segunda, " + dm(t)}`}</b>
    <small class="turma-n">${esc(num || "Todas começam juntas. Uma puxando a outra.")}</small></div>
    ${dentro ? "" : `<button class="btn btn-accent btn-sm" id="turma-in">Entrar</button>`}</div>`;
}
/* aba Treinos: cartão da turma acima dos desafios */
const rTreinarF2 = rTreinar; rTreinar = function(){
  const r = rTreinarF2.apply(this, arguments);
  const d = document.querySelector("#t-treinar .xe-desafios"); if(!d || d.querySelector(".turma")) return r;
  const st = d.querySelector(".sec-title"); (st || d).insertAdjacentHTML(st ? "afterend" : "afterbegin", turmaCardHtml(null));
  const b = $("turma-in"); if(b) b.onclick = entrarTurma;
  const t = naTurma() ? ME.desafio.turma : segundaTurma();
  turmaNumeros(t).then(n => { const el = document.querySelector("#t-treinar .turma"); if(n && el){ el.outerHTML = turmaCardHtml(n); const b2 = $("turma-in"); if(b2) b2.onclick = entrarTurma; } });
  return r;
};
/* Início: convite discreto para a próxima turma (vai para "Pra você agora") */
function turmaInicio(){
  const box = $("t-inicio"); if(!box || box.querySelector(".turma-ini") || (ME.desafio && !ME.desafio.fim)) return;
  const t = segundaTurma(); box.insertAdjacentHTML("beforeend", `<div class="turma-ini" hidden data-t="${t}"><b>Turma de 21 dias começa ${t === today() ? "hoje" : "segunda, " + dm(t)}</b><small>Todas começam juntas</small></div>`);
}
if(typeof CTX_INI !== "undefined") CTX_INI.splice(7, 0, [".turma-ini", "people", "#5B6CD9", n => txt(n, "b"), n => txt(n, "small"), n => { TV = "programas"; tab("treinar"); setTimeout(() => { const d = document.querySelector("#t-treinar .turma"); if(d) d.scrollIntoView({ behavior: "smooth", block: "center" }); }, 350); }]);
/* depois de cada treino, atualiza o progresso da turma (só o número) */
const fimTreinoF2 = fimTreino; fimTreino = function(){ const r = fimTreinoF2.apply(this, arguments); setTimeout(turmaSync, 2500); return r; };
