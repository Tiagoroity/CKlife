/* ===================== MISSÕES, CONQUISTAS E RESUMOS =====================
   DESAFIO CK DE HOJE (pequeno, muitas vezes marcado sozinho) + MISSÃO DA SEMANA (treinar Nx ○○○) no Início.
   Mais conquistas (resiliência, horários, semanas no ritmo, 1 mês e 1 ano de CK Life...), "você já conseguiu X antes"
   quando a sequência cai, resumos SUA SEMANA e OLHA TUDO QUE VOCÊ FEZ (mês), cartões para compartilhar,
   "Chamar uma amiga" depois de grandes conquistas e Minha Jornada ampliada.
   Tudo é comparação só com ela mesma; nada de corpo, peso ou ranking. Nada é punido. */

/* ---------- Desafio CK de hoje ---------- */
const treinosHoje = () => (ME.treinos || []).filter(t => t.d === today());
const DIA_DES = [
  ["agua6", "Beber 6 copos de água", "💧", () => (dia(today()).agua || 0) >= 6, ["agua", "+ 1 copo"]],
  ["treino", "Fazer um treino, de qualquer tamanho", "💪", () => treinosHoje().some(t => t.rapido !== "caminhada"), ["t5", "Treino de 5 min"]],
  ["alonga", "Alongar por 5 minutos", "🧘", () => treinosHoje().some(t => ["c-alo", "q-alo"].includes(t.rapido)), ["alo", "Alongamento leve"]],
  ["caminha", "Caminhar 10 minutos", "🚶‍♀️", () => treinosHoje().some(t => t.rapido === "caminhada"), ["cam", "Registrar caminhada"]],
  ["refeicao", "Registrar uma refeição", "🥗", () => REFS.some(([k]) => (dia(today())[k] || []).length), ["dieta", "Abrir o diário"]],
  ["checkin", "Contar como você está hoje", "💚", () => !!(typeof humorHoje === "function" && humorHoje()), ["topo", "Fazer o check-in"]],
  ["agacho", "Fazer 15 agachamentos", "🏋️‍♀️", null, null],
  ["respira", "Respirar fundo por 1 minuto", "🌬️", null, null],
  ["elogio", "Deixar um incentivo para alguém na comunidade", "💬", null, ["juntas", "Ir para a comunidade"]],
  ["sono", "Deitar 30 minutos mais cedo hoje", "🌙", null, null],
  ["fruta", "Comer uma fruta", "🍎", null, null],
  ["postura", "Alongar pescoço e ombros", "🙆‍♀️", null, ["alo", "Alongamento leve"]]
];
const MIS = () => { const M = (ME.missoes && typeof ME.missoes === "object") ? ME.missoes : (ME.missoes = {}); const ks = Object.keys(M).sort(); if(ks.length > 60) ks.slice(0, ks.length - 60).forEach(k => delete M[k]); return M; };
function desafioHoje(){
  const M = MIS(), d = today(); if(M[d] && DIA_DES.find(x => x[0] === M[d].id)) return M[d];
  const ontem = M[addD(d, -1)] && M[addD(d, -1)].id; let i = cHash(d + (ME.id || "") + "dd") % DIA_DES.length;
  if(DIA_DES[i][0] === ontem) i = (i + 1) % DIA_DES.length;
  M[d] = { id: DIA_DES[i][0], ok: null }; return M[d];
}
function desafioHojeConfere(){   // marca sozinho quando o app consegue ver que ela fez
  const m = desafioHoje(), D = DIA_DES.find(x => x[0] === m.id);
  if(!m.ok && D && D[3] && D[3]()){ m.ok = new Date().toISOString(); ME.missoesN = (ME.missoesN || 0) + 1; save(); return true; }
  return false;
}
/* ---------- Missão da semana ---------- */
const semanaKey = (d = today()) => { const x = new Date(d + "T12:00:00"); return addD(d, -((x.getDay() + 6) % 7)); };
const alvoSemana = () => Math.max(2, Math.min(6, (ME.lembrete && ME.lembrete.dias && ME.lembrete.dias.length) || (ME.perfil && ME.perfil.dias) || 3));
function semanaFeitos(seg){ const dt = diasTreino(); let n = 0; for(let i = 0; i < 7; i++) if(dt.has(addD(seg, i))) n++; return n; }
function missaoSemanaConfere(){
  const seg = semanaKey(), n = semanaFeitos(seg), alvo = alvoSemana(); ME.semanasOk = Array.isArray(ME.semanasOk) ? ME.semanasOk : [];
  if(n >= alvo && !ME.semanasOk.includes(seg)){ ME.semanasOk.push(seg); save(); return true; }
  return false;
}
function missaoCardHTML(){
  const m = desafioHoje(), D = DIA_DES.find(x => x[0] === m.id), seg = semanaKey(), n = semanaFeitos(seg), alvo = alvoSemana(), ok = n >= alvo;
  const dow = (new Date().getDay() + 6) % 7, faltam = Math.max(0, alvo - n), diasRest = 6 - dow + (treinosHoje().length ? 0 : 1);
  const rec = typeof recordeSeq === "function" ? recordeSeq() : 0, s = streak(), volt = (ME.coach && ME.coach.voltas) || 0;
  const semTx = ok ? "Missão cumprida! Você apareceu por você essa semana. 💚" : faltam > diasRest ? "Essa semana apertou. Tudo bem: cada treino ainda conta, e semana que vem é nova." : `Faltam ${faltam} ${faltam === 1 ? "treino" : "treinos"}. Dá tempo, no seu ritmo.`;
  const extra = rec >= 3 && s <= 1 && rec > s ? `Você já conseguiu <b>${rec} dias seguidos</b> antes. Dá para começar de novo hoje.` : volt >= 2 && cHash(today()) % 2 ? `Você já voltou <b>${volt} vezes</b>. Isso é resiliência.` : "";
  return `<section class="mis-ini" id="mis-ini" aria-label="Missões de hoje e da semana">
    <div class="mis-dia ${m.ok ? "ok" : ""}"><span class="mis-eb">Desafio CK de hoje</span>
      <div class="mis-row"><i class="mis-em">${D[2]}</i><b>${esc(D[1])}</b>${m.ok ? `<span class="mis-ok">✓ Feito</span>` : ""}</div>
      ${m.ok ? "" : `<div class="mis-ac">${D[4] ? `<button class="btn mis-b2" data-mi="${D[4][0]}">${esc(D[4][1])}</button>` : ""}${D[3] ? `<small class="muted">Marca sozinho quando você fizer</small>` : `<button class="btn mis-b1" data-mi="feito">FEITO ✓</button>`}</div>`}</div>
    <div class="mis-sem ${ok ? "ok" : ""}"><span class="mis-eb">Missão da semana</span>
      <div class="mis-row"><b>TREINAR ${alvo}X</b><span class="mis-dots" aria-label="${Math.min(n, alvo)} de ${alvo}">${Array.from({ length: alvo }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span></div>
      <small>${semTx}</small></div>
    ${extra ? `<p class="mis-extra">${extra}</p>` : ""}
  </section>`;
}
function missaoAcao(k){
  SOM.tap && SOM.tap();
  if(k === "feito"){ const m = desafioHoje(); if(!m.ok){ m.ok = new Date().toISOString(); ME.missoesN = (ME.missoesN || 0) + 1; save(); vibra([30, 40, 60]); SOM.check && SOM.check(); toast("Desafio de hoje feito! 💚"); try{ checaConquistas(); }catch(e){} } return missaoPinta(true); }
  if(k === "agua"){ const x = dia(today()); x.agua = (x.agua || 0) + 1; SOM.water && SOM.water(); save(); toast(`${x.agua} ${x.agua === 1 ? "copo" : "copos"} hoje 💧`); return rerender(); }
  if(k === "dieta"){ DV = "diario"; return tab("dieta"); }
  if(k === "juntas") return tab("juntas");
  if(k === "topo"){ window.scrollTo({ top: 0, behavior: "smooth" }); const c = document.querySelector(".capa-ck, .xe-ck"); if(c) c.classList.add("pisca"); return; }
  return coachAcao(k);
}
function missaoPinta(forca){
  const ini = $("t-inicio"), co = $("coach-ini"); if(!ini || !co || !ME || !ME.perfil) return;
  const mudouDia = desafioHojeConfere(), mudouSem = missaoSemanaConfere();
  const velho = $("mis-ini"), tmp = document.createElement("div"); tmp.innerHTML = missaoCardHTML(); const novo = tmp.firstElementChild;
  if(velho && !forca && velho.innerHTML === novo.innerHTML){ if(velho.previousElementSibling !== co) co.after(velho); }
  else { if(velho) velho.replaceWith(novo); else co.after(novo); novo.querySelectorAll("[data-mi]").forEach(b => b.onclick = () => missaoAcao(b.dataset.mi)); }
  const el = $("mis-ini"); if(el) el.querySelectorAll("[data-mi]").forEach(b => b.onclick = () => missaoAcao(b.dataset.mi));
  if(mudouSem) setTimeout(() => celebrar(["sem-" + semanaKey(), "x", 0, "🎯", "MISSÃO DA SEMANA CUMPRIDA", `Você treinou ${alvoSemana()} vezes essa semana. Constância é isso.`]), 900);
  if(mudouDia || mudouSem) setTimeout(() => { try{ checaConquistas(); }catch(e){} }, 1500);
}
const coachPintaMis = coachPinta; coachPinta = function(){ const r = coachPintaMis.apply(this, arguments); try{ missaoPinta(); }catch(e){ console.warn(e); } return r; };

/* ---------- Mais conquistas ---------- */
const minTot = () => (ME.treinos || []).reduce((a, t) => a + (t.min || 0), 0);
const idadeConta = () => ME.criado ? Math.round((new Date(today() + "T12:00") - new Date(String(ME.criado).slice(0, 10) + "T12:00")) / 864e5) : 0;
const fdsAtivos = () => new Set([...diasTreino()].filter(d => [0, 6].includes(new Date(d + "T12:00").getDay())).map(d => semanaKey(d))).size;
[["t5", "t", 5, "🌿", "5 TREINOS", "Cinco vezes cuidando de você. O hábito está nascendo."], ["t75", "t", 75, "🌼", "75 TREINOS", "Setenta e cinco vezes você apareceu."],
 ["t150", "t", 150, "💎", "150 TREINOS", "Cento e cinquenta treinos. Que história bonita."], ["t300", "t", 300, "🌳", "300 TREINOS", "Trezentos treinos. Constância de verdade."],
 ["s21", "s", 21, "✨", "21 DIAS DE CONSISTÊNCIA", "Vinte e um dias seguidos. O tempo de um hábito."], ["s45", "s", 45, "🌠", "45 DIAS DE CONSISTÊNCIA", "Quarenta e cinco dias aparecendo por você."],
 ["s100", "s", 100, "👑", "100 DIAS DE CONSISTÊNCIA", "Cem dias seguidos. Você é inspiração."]
].forEach(c => { if(!CONQ.some(x => x[0] === c[0])) CONQ.push(c); });
CONQ.sort((a, b) => a[1] === b[1] ? a[2] - b[2] : a[1] === "t" ? -1 : 1);
const CONQX = [
  ["comp", "🤝", "EU VOLTO POR MIM", "Você fez um compromisso com você mesma.", () => !!(ME.entrada && ME.entrada.compromisso), "Aceitar o compromisso do CK Life"],
  ["volta1", "🌱", "RECOMEÇO CORAJOSO", "Você voltou. Isso vale mais que qualquer sequência.", () => ((ME.coach && ME.coach.voltas) || 0) >= 1, "Voltar depois de uma pausa"],
  ["volta3", "🌿", "RESILIÊNCIA", "Três vezes você escolheu voltar. Isso é força.", () => ((ME.coach && ME.coach.voltas) || 0) >= 3, "Voltar 3 vezes depois de pausas"],
  ["dia10", "✅", "10 DESAFIOS DO DIA", "Dez pequenos desafios cumpridos. Pequeno, todo dia, vira muito.", () => (ME.missoesN || 0) >= 10, "Cumprir 10 desafios do dia"],
  ["dia50", "🏵️", "50 DESAFIOS DO DIA", "Cinquenta desafios do dia. Que constância!", () => (ME.missoesN || 0) >= 50, "Cumprir 50 desafios do dia"],
  ["sem1", "🎯", "PRIMEIRA SEMANA NO RITMO", "Você cumpriu a missão da semana.", () => (ME.semanasOk || []).length >= 1, "Cumprir a missão da semana"],
  ["sem4", "🗓️", "4 SEMANAS NO RITMO", "Um mês de semanas cumpridas.", () => (ME.semanasOk || []).length >= 4, "Cumprir 4 missões da semana"],
  ["sem12", "🏆", "12 SEMANAS NO RITMO", "Três meses de semanas cumpridas. Hábito construído.", () => (ME.semanasOk || []).length >= 12, "Cumprir 12 missões da semana"],
  ["rap10", "⏱️", "POUCO AINDA CONTA", "Dez treinos curtos. Cada minuto contou.", () => (ME.treinos || []).filter(t => /^(c|q)-/.test(t.rapido || "")).length >= 10, "Fazer 10 treinos curtos"],
  ["cam5", "🚶‍♀️", "CAMINHANTE", "Cinco caminhadas registradas.", () => (ME.treinos || []).filter(t => t.rapido === "caminhada").length >= 5, "Registrar 5 caminhadas"],
  ["manha5", "☀️", "MADRUGADORA", "Cinco treinos antes das 8h.", () => (ME.treinos || []).filter(t => t.h != null && t.h < 8).length >= 5, "Treinar 5 vezes antes das 8h"],
  ["noite5", "🌙", "CORUJA FIT", "Cinco treinos depois das 19h.", () => (ME.treinos || []).filter(t => t.h != null && t.h >= 19).length >= 5, "Treinar 5 vezes depois das 19h"],
  ["fds4", "🌤️", "FIM DE SEMANA ATIVO", "Treinou em 4 fins de semana diferentes.", () => fdsAtivos() >= 4, "Treinar em 4 fins de semana"],
  ["min500", "⌛", "500 MINUTOS", "Quinhentos minutos dedicados a você.", () => minTot() >= 500, "Somar 500 minutos de treino"],
  ["min3000", "⏳", "3.000 MINUTOS", "Três mil minutos. Que dedicação.", () => minTot() >= 3000, "Somar 3.000 minutos de treino"],
  ["check7", "💛", "OLHANDO PARA MIM", "Sete check-ins de como você está.", () => (typeof HUM !== "undefined" ? Object.keys(HUM.get()).length : 0) >= 7, "Fazer 7 check-ins"],
  ["mes1", "📅", "1 MÊS DE CK LIFE", "Um mês cuidando de você. Obrigada por continuar voltando.", () => idadeConta() >= 30, "Completar 30 dias de CK Life"],
  ["ano1", "🎂", "1 ANO DE CK LIFE", "Um ano de história. Olha quanto você construiu.", () => idadeConta() >= 365, "Completar 1 ano de CK Life"]
].map(([id, em, nome, frase, fn, dica]) => { const c = [id, "x", 0, em, nome, frase]; c.fn = fn; c.dica = dica; return c; });
const CONQ_TODAS = () => CONQ.concat(CONQX);
function conqOk(c, n, s){ if(c[1] === "t") return n >= c[2]; if(c[1] === "s") return s >= c[2]; try{ return !!(c.fn && c.fn()); }catch(e){ return false; } }
const checaConquistasBase = checaConquistas;
checaConquistas = function(){
  const n = (ME.treinos || []).length, s = streak(); ME.conq = ME.conq || {};
  const novasX = CONQX.filter(c => !ME.conq[c[0]] && conqOk(c, n, s));
  if(!ME.conqV2){ novasX.forEach(c => ME.conq[c[0]] = today()); ME.conqV2 = today(); save(); return checaConquistasBase.apply(this, arguments); }   // quem já tinha histórico: registra sem festa retroativa
  const r = checaConquistasBase.apply(this, arguments);
  if(novasX.length){ novasX.forEach(c => ME.conq[c[0]] = today()); save(); if(!document.getElementById("celebra") || document.getElementById("celebra").hidden) setTimeout(() => celebrar(novasX[novasX.length - 1]), 1200); }
  return r;
};
colecaoConquistas = function(){
  const n = (ME.treinos || []).length, s = streak(), tem = ME.conq || {};
  sheet("Conquistas", `<p class="hint">${Object.keys(tem).filter(k => CONQ_TODAS().some(c => c[0] === k)).length} de ${CONQ_TODAS().length} desbloqueadas. Cada uma conta a sua história, no seu tempo.</p><div class="xe-col">${CONQ_TODAS().map(c => { const ok = tem[c[0]], falta = c[1] === "t" ? c[2] - n : c[2] - s;
    const dica = c[1] === "t" ? `faltam ${Math.max(1, falta)} treino${falta > 1 ? "s" : ""}` : c[1] === "s" ? `${c[2]} dias seguidos` : c.dica;
    return `<button class="xe-cq ${ok ? "ok" : ""}" data-cq="${c[0]}"><i>${ok ? c[3] : "🔒"}</i><b>${esc(c[4].charAt(0) + c[4].slice(1).toLowerCase())}</b><small>${ok ? brD(ok) : esc(dica)}</small></button>`; }).join("")}</div>`);
  $("sheet-body").querySelectorAll(".xe-cq.ok").forEach(b => b.onclick = () => { const c = CONQ_TODAS().find(x => x[0] === b.dataset.cq); fecharSheet(); celebrar(c); });
};
/* "Chamar uma amiga" depois das grandes conquistas */
const GRANDES = /^(t25|t30|t50|t75|t100|t150|t200|t300|s7|s15|s21|s30|s45|s60|s100|mes1|ano1|sem4|sem12|volta3|dia50|min3000|sem-)/;
const celebrarBase = celebrar;
celebrar = async function(c){
  const r = await celebrarBase.apply(this, arguments);
  try{ if(c && GRANDES.test(c[0])){ const sh = $("ce-share"); if(sh && !$("ce-amiga")){ sh.insertAdjacentHTML("afterend", `<button class="btn btn-line btn-block" id="ce-amiga">${ic("people", 18)} Chamar uma amiga para treinar comigo</button>`);
    $("ce-amiga").onclick = () => chamarAmiga(); } } }catch(e){}
  return r;
};
async function chamarAmiga(){
  const tx = "Bora treinar comigo no CK Life? É no seu ritmo, em casa, e tem uma comunidade linda de mulheres 💚 https://cklife.vercel.app";
  try{ if(navigator.share) await navigator.share({ text: tx }); else copyText(tx, "Convite copiado. É só colar no WhatsApp 💚"); }catch(e){}
}

/* ---------- Resumos: SUA SEMANA e OLHA TUDO QUE VOCÊ FEZ ---------- */
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function resumoPeriodo(ini, fim){
  const T = (ME.treinos || []).filter(t => t.d >= ini && t.d <= fim), dias = new Set(T.map(t => t.d));
  const D = ME.diario || {}, meta = metas(ME).agua; let agua = 0, ref = 0;
  Object.entries(D).forEach(([d, x]) => { if(d < ini || d > fim) return; if((x.agua || 0) >= meta) agua++; REFS.forEach(([k]) => ref += (x[k] || []).length); });
  const M = ME.missoes || {}, des = Object.entries(M).filter(([d, m]) => d >= ini && d <= fim && m && m.ok).length;
  const cq = Object.entries(ME.conq || {}).filter(([k, d]) => d >= ini && d <= fim).map(([k]) => CONQ_TODAS().find(c => c[0] === k)).filter(Boolean);
  let best = 0, cur = 0; for(let d = ini; d <= fim; d = addD(d, 1)){ cur = dias.has(d) ? cur + 1 : 0; best = Math.max(best, cur); }
  return { treinos: T.length, dias: dias.size, min: T.reduce((a, t) => a + (t.min || 0), 0), caminhadas: T.filter(t => t.rapido === "caminhada").length, agua, ref, des, cq, best };
}
function resumoFrase(r, tipo){
  if(!r.treinos) return tipo === "mes" ? "Mês difícil? Tudo bem. Um mês novo é uma página em branco, e a gente está aqui." : "Semana difícil? Tudo bem. Semana nova, página nova. Comece com 5 minutos.";
  if(r.dias >= 5) return `Você apareceu ${r.dias} dias por você. Isso é constância de verdade.`;
  if(r.dias >= 3) return `${r.dias} dias cuidando de você. Você está construindo uma rotina.`;
  return "Cada treino contou. Pouco, todo dia, vira muito.";
}
async function cartaoResumo(o){
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
  try{ await document.fonts.load("800 90px 'Bricolage Grotesque'"); }catch(e){}
  const F1 = "'Bricolage Grotesque','Avenir Next',system-ui,sans-serif", F2 = "Figtree,system-ui,sans-serif";
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0E3D32"); g.addColorStop(.65, "#14503E"); g.addColorStop(1, "#1E6B52"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalAlpha = .12; x.fillStyle = "#C9B37E"; x.beginPath(); x.arc(W - 120, 160, 260, 0, 7); x.fill(); x.globalAlpha = 1;
  x.fillStyle = "#fff"; x.font = `800 56px ${F1}`; x.fillText("CK", 90, 140); const w = x.measureText("CK ").width; x.fillStyle = "#C9B37E"; x.fillText("Life", 90 + w, 140);
  x.fillStyle = "#C9B37E"; x.font = `700 38px ${F2}`; x.fillText(o.eb.toUpperCase(), 90, 270);
  x.fillStyle = "#fff"; x.font = `800 86px ${F1}`; const pal = o.titulo.split(" "); let l1 = "", l2 = ""; pal.forEach(p => { if(!l2 && x.measureText((l1 ? l1 + " " : "") + p).width < W - 180) l1 = l1 ? l1 + " " + p : p; else l2 = l2 ? l2 + " " + p : p; });
  x.fillText(l1, 90, 370); if(l2) x.fillText(l2, 90, 465);
  const y0 = l2 ? 560 : 480;
  o.stats.slice(0, 4).forEach(([v, t], i) => { const cx = 90 + (i % 2) * 460, cy = y0 + Math.floor(i / 2) * 230;
    x.fillStyle = "rgba(255,255,255,.08)"; x.beginPath(); x.roundRect ? x.roundRect(cx, cy, 420, 200, 32) : x.rect(cx, cy, 420, 200); x.fill();
    x.fillStyle = "#F2E6C4"; x.font = `800 84px ${F1}`; x.fillText(String(v), cx + 34, cy + 105); x.fillStyle = "rgba(255,255,255,.85)"; x.font = `600 34px ${F2}`; x.fillText(t, cx + 34, cy + 160); });
  x.fillStyle = "#fff"; x.font = `600 40px ${F2}`; const fr = o.frase; let linha = "", yy = y0 + 520; fr.split(" ").forEach(p => { if(x.measureText(linha + p + " ").width > W - 180){ x.fillText(linha, 90, yy); linha = ""; yy += 54; } linha += p + " "; }); x.fillText(linha, 90, yy);
  x.fillStyle = "rgba(255,255,255,.7)"; x.font = `600 32px ${F2}`; x.textAlign = "center"; x.fillText("Sua vida. Seu ritmo. Sua evolução. · cklife.vercel.app", W / 2, H - 70);
  return new Promise(ok => cv.toBlob(ok, "image/jpeg", .9));
}
function abrirResumo(tipo, ini, fim, rotulo){
  const r = resumoPeriodo(ini, fim), nome = cPrim();
  const titulo = tipo === "mes" ? `OLHA TUDO QUE VOCÊ FEZ EM ${rotulo.toUpperCase()}` : "SUA SEMANA";
  const stats = [[r.treinos, r.treinos === 1 ? "treino" : "treinos"], [r.dias, r.dias === 1 ? "dia ativo" : "dias ativos"], [int(r.min), r.min === 1 ? "minuto" : "minutos"], [tipo === "mes" ? r.best : r.des, tipo === "mes" ? "maior sequência" : (r.des === 1 ? "desafio do dia" : "desafios do dia")]];
  const extras = [r.caminhadas ? `🚶‍♀️ ${r.caminhadas} ${r.caminhadas === 1 ? "caminhada" : "caminhadas"}` : "", r.agua ? `💧 meta de água em ${r.agua} ${r.agua === 1 ? "dia" : "dias"}` : "", r.ref ? `🥗 ${r.ref} ${r.ref === 1 ? "refeição registrada" : "refeições registradas"}` : "", tipo === "mes" && r.des ? `✅ ${r.des} desafios do dia` : ""].filter(Boolean);
  const d = document.createElement("div"); d.className = "ent res-ov"; d.id = "res-ov";
  d.innerHTML = `<img class="ent-bg" src="img/modelo.jpg" alt="" onerror="this.remove()"><div class="ent-in">
    <span class="ent-eb">${tipo === "mes" ? "Seu mês no CK Life" : `${brD(ini).slice(0, 5)} a ${brD(fim).slice(0, 5)}`}</span><h1 class="ent-t">${esc(titulo)}</h1>
    <div class="res-grid">${stats.map(([v, t], i) => `<div style="--d:${.15 + i * .1}s"><b class="num">${v}</b><small>${t}</small></div>`).join("")}</div>
    ${extras.length ? `<ul class="ent-tem">${extras.map((t, i) => `<li style="--d:${.6 + i * .1}s">${t}</li>`).join("")}</ul>` : ""}
    ${r.cq.length ? `<p class="ent-l" style="--d:.9s">Conquistas: ${r.cq.map(c => c[3] + " " + esc(c[4].charAt(0) + c[4].slice(1).toLowerCase())).join(" · ")}</p>` : ""}
    <div class="coach-bal"><p class="ent-l" style="--d:1s"><b>Coach CK Life:</b> ${esc(resumoFrase(r, tipo))}${nome ? ` 💚` : ""}</p></div>
    <div class="ent-bt"><button class="btn ent-cta" id="res-ok">${tipo === "mes" ? "COMEÇAR O NOVO MÊS" : "COMEÇAR A NOVA SEMANA"}</button>
      ${r.treinos ? `<button class="btn ent-cta ent-sec2" id="res-sh">${ic("share", 16)} Compartilhar ${tipo === "mes" ? "meu mês" : "minha semana"}</button>` : ""}<button class="link ent-pula" id="res-x">Fechar</button></div></div>`;
  document.body.appendChild(d); SOM.chime && SOM.chime(); if(r.treinos && typeof confete === "function") confete(d);
  const fecha = () => d.remove(); $("res-ok").onclick = fecha; $("res-x").onclick = fecha;
  const sh = $("res-sh"); if(sh) sh.onclick = async () => { sh.disabled = true; try{ const blob = await cartaoResumo({ eb: tipo === "mes" ? `Meu ${rotulo} no CK Life` : "Minha semana no CK Life", titulo: tipo === "mes" ? "Olha tudo que eu fiz" : "Minha semana", stats, frase: resumoFrase(r, tipo) });
    const file = new File([blob], "ck-life-resumo.jpg", { type: "image/jpeg" }), txt = `Meu ${tipo === "mes" ? "mês" : "semana"} no CK Life 💚 ${location.origin}`;
    if(navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: txt }); else if(navigator.share) await navigator.share({ text: txt, url: location.origin }); else copyText(txt, "Texto copiado para compartilhar"); }catch(e){} sh.disabled = false; };
}
const resumoSemana = (seg) => abrirResumo("semana", seg, addD(seg, 6) > today() ? today() : addD(seg, 6));
function resumoMes(ano, mes){ const ini = `${ano}-${String(mes + 1).padStart(2, "0")}-01`, fimM = new Date(ano, mes + 1, 0).getDate(), fim = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(fimM).padStart(2, "0")}`;
  abrirResumo("mes", ini, fim > today() ? today() : fim, MESES[mes]); }
/* aparece sozinho: mês nos dias 1 a 5 (do mês anterior); semana no domingo à noite ou na segunda/terça (da semana anterior) */
function resumoAuto(){
  if(!ME || !ME.perfil || document.querySelector(".ent, .ent-bv, .coach-1o, #celebra:not([hidden])") || !$("sheet").hidden) return;
  const hj = new Date(), d = today(), idade = idadeConta();
  if(hj.getDate() <= 5 && idade >= 20){ const m = hj.getMonth() === 0 ? 11 : hj.getMonth() - 1, a = hj.getMonth() === 0 ? hj.getFullYear() - 1 : hj.getFullYear(), k = `${a}-${String(m + 1).padStart(2, "0")}`;
    if(ME.resumoMesVisto !== k){ const r = resumoPeriodo(k + "-01", k + "-31"); ME.resumoMesVisto = k; save(); if(r.treinos || r.des) return resumoMes(a, m); } }
  const dow = hj.getDay(); let seg = null;
  if(dow === 0 && hj.getHours() >= 17) seg = semanaKey(d); else if(dow === 1 || dow === 2) seg = semanaKey(addD(d, -7));
  if(seg && idade >= 6 && ME.resumoSemVisto !== seg){ ME.resumoSemVisto = seg; save(); const r = resumoPeriodo(seg, addD(seg, 6)); if(r.treinos || r.des) resumoSemana(seg); }
}
const abrirAppMis = abrirApp; abrirApp = function(){ const r = abrirAppMis.apply(this, arguments); setTimeout(() => { try{ checaConquistas(); }catch(e){} }, 3500); setTimeout(() => { try{ resumoAuto(); }catch(e){ console.warn(e); } }, 4500); return r; };

/* ---------- Minha Jornada ampliada ---------- */
const eventosJornadaBase = eventosJornada;
eventosJornada = function(){
  const E = eventosJornadaBase.apply(this, arguments), en = ME.entrada || {};
  Object.entries(ME.conq || {}).forEach(([k, d]) => { const c = CONQX.find(x => x[0] === k); if(c && k !== "comp") E.push([d, c[3], c[4].charAt(0) + c[4].slice(1).toLowerCase()]); });
  if(en.compromisso && !E.some(e => e[2] === "Compromisso: eu volto por mim")) E.push([en.compromisso, "🤝", "Compromisso: eu volto por mim"]);
  if(en.futuroData) E.push([en.futuroData, "💌", "Escreveu uma mensagem para a eu do futuro"]);
  ((ME.coach && ME.coach.voltasD) || []).forEach(d => E.push([d, "🌱", "Voltou depois de uma pausa"]));
  const S = (ME.semanasOk || []).slice().sort(); [1, 4, 12, 26, 52].forEach(n => { if(S[n - 1]) E.push([S[n - 1], "🎯", n === 1 ? "Primeira missão da semana cumprida" : `${n} semanas no ritmo`]); });
  return E.filter(e => e[0]).sort((a, b) => a[0].localeCompare(b[0])).filter((e, i, A) => !A.slice(0, i).some(x => x[0] === e[0] && x[2] === e[2]));
};
const minhaJornadaBase = minhaJornada;
minhaJornada = function(){
  minhaJornadaBase.apply(this, arguments);
  try{
    const T = ME.treinos || [], dias = diasTreino().size, rec = recordeSeq(), s = streak(), volt = (ME.coach && ME.coach.voltas) || 0;
    const head = `<div class="jor-head"><div class="jor-st">${[[dias, dias === 1 ? "dia ativo" : "dias ativos"], [T.length, T.length === 1 ? "treino" : "treinos"], [int(minTot()), minTot() === 1 ? "minuto" : "minutos"], [rec, "maior sequência"], [(ME.semanasOk || []).length, (ME.semanasOk || []).length === 1 ? "semana no ritmo" : "semanas no ritmo"], [ME.missoesN || 0, ME.missoesN === 1 ? "desafio do dia" : "desafios do dia"]].map(([v, t]) => `<div><b class="num">${v}</b><small>${t}</small></div>`).join("")}</div>
      ${volt ? `<p class="jor-res">🌱 Você já voltou <b>${volt} ${volt === 1 ? "vez" : "vezes"}</b> depois de uma pausa. Isso é resiliência.</p>` : ""}
      ${rec >= 3 && s < rec ? `<p class="jor-res">🔥 Você já conseguiu <b>${rec} dias seguidos</b>. Quando quiser, dá para começar de novo.</p>` : ""}
      <div class="jor-bts"><button class="btn btn-line btn-sm" id="jor-sem">${ic("calendar", 15)} Minha semana</button><button class="btn btn-line btn-sm" id="jor-mes">${ic("trophy", 15)} Meu mês</button><button class="btn btn-line btn-sm" id="jor-cq">🏆 Conquistas</button></div></div>`;
    const b = $("sheet-body"), h = b && b.querySelector(".hint"); if(h) h.insertAdjacentHTML("afterend", head);
    $("jor-sem").onclick = () => { fecharSheet(); resumoSemana(semanaKey()); };
    $("jor-mes").onclick = () => { fecharSheet(); const hj = new Date(); resumoMes(hj.getFullYear(), hj.getMonth()); };
    $("jor-cq").onclick = () => colecaoConquistas();
  }catch(e){ console.warn(e); }
};
