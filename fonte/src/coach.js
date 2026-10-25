/* ===================== COACH CK LIFE (no app) =====================
   Coach virtual (nunca finge ser pessoa). Recado no Início que muda com o horário e a situação,
   "Hoje tá difícil?", "Preciso de motivação", "Pouco ainda conta" (5/10/15 min, grátis para todas),
   tela "Olha quem voltou" depois de 7 dias e comemoração do primeiro treino.
   Regras: sem culpa, sem vergonha, sem comparação de corpo, sem promessa de resultado, nunca pressupor ciclo/sintomas. */

const COACH = () => { const C = (ME.coach && typeof ME.coach === "object") ? ME.coach : (ME.coach = {}); if(!C.descanso || typeof C.descanso !== "object") C.descanso = {}; C.voltas = +C.voltas || 0; const ks = Object.keys(C.descanso).sort(); if(ks.length > 40) ks.slice(0, ks.length - 40).forEach(k => delete C.descanso[k]); return C; };
const cPrim = () => esc((ME.nome || "").split(" ")[0] || "");
const cHash = s => { let h = 0; for(const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const cEscolhe = (L, k) => L[cHash(today() + (ME.id || "") + (k || "")) % L.length];   // mesma frase o dia todo
const cVars = t => t.replace(/\{primeiro_nome\}/g, cPrim()).replace(/\{streak\}/g, streak()).replace(/\{quantidade_treinos\}/g, (ME.treinos || []).length);

/* treinos curtinhos da Coach: conteúdo próprio, liberado para todas (não usa os treinos Pro) */
const COACH_MINI = {
  5: { id: "c-5", nome: "5 minutos que contam", foco: "Pouco ainda conta", rodadas: 1, descRodada: 0, itens: [["polichinelo","t",35,10],["agacho","t",35,10],["perdigueiro","t",35,10],["ponte","t",35,10],["toqueombro","t",35,10],["along","t",35,0]] },
  10: { id: "c-10", nome: "10 minutos por você", foco: "Pouco ainda conta", rodadas: 2, descRodada: 20, itens: [["polichinelo","t",35,15],["agacho","t",35,15],["ponte","t",35,15],["prancha","t",30,15],["afundocasa","t",35,15],["abdsupra","t",30,15]] },
  15: { id: "c-15", nome: "15 minutos de constância", foco: "Pouco ainda conta", rodadas: 3, descRodada: 25, itens: [["polichinelo","t",35,15],["sumocasa","t",35,15],["ponte","t",35,15],["toqueombro","t",30,15],["afundocasa","t",35,15],["prancha","t",30,15]] },
  alo: { id: "c-alo", nome: "Alongamento leve", foco: "Corpo solto", rodadas: 1, descRodada: 0, itens: [["crianca","t",45,10],["alongquad","t",40,10],["along","t",45,10],["perdigueiro","t",40,10],["crianca","t",45,0]] }
};
const coachTreino = k => { const q = COACH_MINI[k]; if(!q) return; fecharSheet(); abrirTreinoPreview(montaTreino({ nome: q.nome, tipo: "circuito", rodadas: q.rodadas, descRodada: q.descRodada, itens: q.itens }, 1, { rapido: q.id, cor: "#2E7D5A", sub: q.foco })); };

/* frases (curadas, sem culpa); a central completa com 365+ fica no servidor (Etapa 3) */
const CF = {
  manha: ["Bom dia, {primeiro_nome}. 💚 Que tal começar o dia fazendo algo por você?", "Bom dia! Um copo de água e 5 minutinhos de movimento já mudam o dia.", "Bom dia, {primeiro_nome}. Hoje não precisa ser perfeito. Só precisa ser seu."],
  tarde: ["Boa tarde, {primeiro_nome}. Uma pausa de 10 minutos por você cabe no meio do dia?", "Boa tarde! Já bebeu água hoje? Seu corpo agradece. 💧", "{primeiro_nome}, o dia está corrido? Pouco ainda conta."],
  noite: ["Boa noite, {primeiro_nome}. Ainda dá tempo de um treino leve, ou de descansar sem culpa.", "Fim de dia. Se der, 10 minutinhos. Se não der, amanhã a gente continua. 💚", "Boa noite! Que tal um alongamento leve antes de dormir?"],
  madrugada: ["Tá acordada até tarde, {primeiro_nome}? Descansar também é cuidar de você. 🌙"],
  feito: ["Treino feito hoje. 💚 Você apareceu por você.", "Hoje você cumpriu o combinado com você mesma. Agora é água e descanso.", "Mais um dia contando. Orgulho de você, {primeiro_nome}."],
  primeiro: ["Hoje pode ser o seu primeiro treino aqui. Que tal só 5 minutinhos para começar?", "O primeiro passo é o mais importante. Vamos juntas? 5 minutos já valem."],
  streak: ["{streak} dias seguidos aparecendo por você. Isso é constância. 🔥", "Olha você: {streak} dias seguidos. Um dia de cada vez."],
  falta1: ["Ontem não deu? Tudo bem. Hoje é um novo dia.", "A vida acontece. Hoje a gente continua, no seu ritmo."],
  falta2: ["Que tal só 5 minutinhos hoje? Pouco ainda conta.", "{primeiro_nome}, não precisa compensar nada. Só voltar com algo leve."],
  falta3: ["Faz uns dias que a gente não se vê. Sem cobrança: que tal 5 minutos hoje?", "Voltar também é progresso. Escolha o tempo que cabe hoje."],
  descanso: ["Hoje é dia de descanso. Descansar também faz parte da constância. 💚", "Dia de recuperar. Amanhã a gente continua."],
  folga: ["Hoje não é dia de treino no seu plano. Uma caminhada leve ou um alongamento caem bem.", "Dia livre no seu plano. Que tal só se movimentar um pouco, sem pressão?"],
  tempo: ["Sem tempo hoje? 5 minutos já contam."],
  motivacao: ["Você não precisa de motivação todo dia. Precisa de um próximo passo pequeno.", "Disciplina é lembrar do que você quer, mesmo nos dias sem vontade.", "Não buscamos perfeição. Buscamos constância.", "Um treino ruim ainda é melhor que nenhum treino.", "Você já começou antes. Você consegue continuar.", "Seu ritmo. Sua evolução. Sua vida.", "Cuidar de você não é egoísmo. É base.", "Ninguém constrói rotina em um dia. Constrói voltando.", "Pouco ainda conta. Pouco, todo dia, vira muito.", "Você não está atrasada. Está no seu tempo.", "O dia de hoje não precisa ser perfeito. Precisa ser seu.", "Quando bater preguiça, combine só 5 minutos com você. Depois decide.", "Seu corpo não é um projeto de punição. É a sua casa.", "Constância também é saber recuperar.", "Hoje, escolha você. Nem que seja um pouquinho."]
};
const MOTIVO_TX = { disposicao: "ter mais disposição", saude: "cuidar da sua saúde", autoestima: "se sentir bem com você", rotina: "criar uma rotina", voltar: "voltar a treinar", objetivo: "um objetivo seu" };

function cDiasSem(){
  const L = ME.treinos || []; let ult = L.length ? L[L.length - 1].d : null;
  L.forEach(t => { if(!ult || t.d > ult) ult = t.d; });
  const ref = [ult, window.CK_ULT_ACESSO].filter(Boolean).sort().pop();
  if(!ref) return null;
  return Math.round((new Date(today() + "T12:00") - new Date(ref + "T12:00")) / 864e5);
}
const cDiaDoPlano = () => { const L = ME.lembrete; if(!L || !L.dias || !L.dias.length) return true; const k = ["SU","MO","TU","WE","TH","FR","SA"][new Date().getDay()]; return L.dias.includes(k); };

/* decide o recado do dia */
function coachRecado(){
  const C = COACH(), h = new Date().getHours(), L = ME.treinos || [], feito = diasTreino().has(today()), s = streak();
  const sem = L.length ? cDiasSem() : null, E = ME.entrada || {};
  // mensagem da eu do futuro (30 dias depois)
  if(E.futuro && E.futuroData && !E.futuroVisto && addD(E.futuroData, 30) <= today())
    return { k: "futuro", t: `Há 30 dias você escreveu isso para você:`, q: E.futuro, a: [["futuro-ok", "Guardei no coração 💚"]] };
  if(feito) return { k: "feito", t: s >= 3 ? cEscolhe(CF.streak) : cEscolhe(CF.feito), a: [["comp", "Compartilhar minha vitória"]] };
  if(C.descanso[today()]) return { k: "descanso", t: cEscolhe(CF.descanso) };
  if(!L.length) return { k: "primeiro", t: cEscolhe(CF.primeiro), a: [["t5", "Treino de 5 min"], ["plano", "Treino do dia"]] };
  if(sem >= 3) return { k: "falta3", t: cEscolhe(E.desistir === "tempo" ? CF.tempo.concat(CF.falta3) : CF.falta3), a: [["t5", "5 min"], ["t10", "10 min"], ["t15", "15 min"]], pouco: 1 };
  if(sem === 2) return { k: "falta2", t: cEscolhe(CF.falta2), a: [["t5", "5 min"], ["t10", "10 min"], ["plano", "Treino do dia"]], pouco: 1 };
  if(s >= 3 && h >= 5) return { k: "streak", t: cEscolhe(CF.streak), a: [["plano", "Treino do dia"]] };
  if(!cDiaDoPlano()) return { k: "folga", t: cEscolhe(CF.folga), a: [["alo", "Alongamento leve"], ["cam", "Registrar caminhada"]] };
  if(sem === 1 && h < 12) return { k: "falta1", t: cEscolhe(CF.falta1), a: [["plano", "Treino do dia"], ["t10", "10 min"]] };
  const per = h < 5 ? "madrugada" : h < 12 ? "manha" : h < 18 ? "tarde" : "noite";
  let t = cEscolhe(CF[per]);
  if(E.motivo && MOTIVO_TX[E.motivo] && cHash(today()) % 3 === 0) t = `Lembra por que você começou: ${MOTIVO_TX[E.motivo]}. 💚 Um passo hoje já conta.`;
  return { k: per, t, a: per === "madrugada" ? [] : [["plano", "Treino do dia"], ["t10", "10 min"]] };
}

function coachCardHTML(){
  const r = coachRecado();
  return `<section class="coach-ini" id="coach-ini" aria-label="Recado da Coach CK Life">
    <div class="coach-top"><div class="coach-av"><img src="img/modelo.jpg" alt="" onerror="this.remove()"><i>${ic("star", 10, 3)}</i></div>
      <div class="coach-nm"><b>Recado da Coach</b><small>Coach virtual CK Life</small></div></div>
    <p class="coach-tx">${cVars(r.t)}</p>${r.q ? `<blockquote class="coach-q">“${esc(r.q)}”</blockquote>` : ""}
    ${r.pouco ? `<span class="coach-eb">Pouco ainda conta</span>` : ""}
    ${r.a && r.a.length ? `<div class="coach-ac">${r.a.map(([k, n], i) => `<button class="btn ${i ? "coach-b2" : "coach-b1"}" data-ca="${k}">${k === "plano" || /^t\d/.test(k) ? ic("play", 15) : ""}${n}</button>`).join("")}</div>` : ""}
    <div class="coach-lk"><button class="coach-chip" data-ca="dificil">Hoje tá difícil?</button><button class="coach-chip" data-ca="motiva">Preciso de motivação</button></div>
  </section>`;
}
function coachAcao(k){
  SOM.tap && SOM.tap();
  if(k === "t5") return coachTreino(5); if(k === "t10") return coachTreino(10); if(k === "t15") return coachTreino(15); if(k === "alo") return coachTreino("alo");
  if(k === "plano"){ fecharSheet(); return abrirTreinoPreview(treinoDoDia()); }
  if(k === "cam") return coachCaminhada();
  if(k === "dificil") return coachDificil();
  if(k === "motiva") return coachMotiva();
  if(k === "comp"){ return tab("juntas"); }
  if(k === "futuro-ok"){ ME.entrada.futuroVisto = today(); save(); toast("Continue escrevendo a sua história 💚"); coachPinta(); }
  if(k === "desc"){ COACH().descanso[today()] = true; save(); fecharSheet(); toast("Descansar também faz parte. Amanhã a gente continua 💚"); coachPinta(); }
}
function coachLiga(box){ box.querySelectorAll("[data-ca]").forEach(b => b.onclick = () => coachAcao(b.dataset.ca)); }
function coachPinta(){
  const ini = $("t-inicio"); if(!ini || !ME || !ME.perfil) return;
  const capa = ini.querySelector(".capa"); if(!capa) return;
  const velho = $("coach-ini"), html = coachCardHTML();
  if(velho){ const tmp = document.createElement("div"); tmp.innerHTML = html; const novo = tmp.firstElementChild; if(velho.innerHTML !== novo.innerHTML){ velho.replaceWith(novo); coachLiga(novo); } else coachLiga(velho); }
  else { capa.insertAdjacentHTML("afterend", html); coachLiga($("coach-ini")); }
  const c = $("coach-ini"); if(c && c.previousElementSibling !== capa) capa.after(c);
}

/* "Hoje tá difícil?" */
const DIF = [
  ["tempo", "Estou sem tempo", "clock", "Então vamos no possível: 5 minutos já contam. Treino curto também é treino.", ["t5", "alo"]],
  ["cansada", "Estou cansada", "moon", "Cansaço é sinal para ir leve. Um alongamento ou uma caminhada curta podem ajudar. E descansar também vale.", ["alo", "cam", "desc"]],
  ["desanimada", "Estou desanimada", "leaf", "Tudo bem não estar animada. Combine só 5 minutos com você. Se depois quiser parar, pode.", ["t5", "cam", "desc"]],
  ["estressada", "Estou estressada", "repeat", "Movimento ajuda a soltar a tensão. Que tal uma caminhada ou um alongamento com respiração calma?", ["cam", "alo", "t5"]],
  ["desconforto", "Estou com dor ou desconforto", "heart", "Respeite seu corpo. Se for dor forte, descanse e procure orientação. Se for leve, um alongamento suave pode aliviar.", ["alo", "desc"]],
  ["vontade", "Só não estou com vontade", "bolt", "Acontece com todo mundo. Começa pequeno: 5 minutos. Muitas vezes a vontade vem depois que a gente começa.", ["t5", "t10", "desc"]]
];
const DIF_AC = { t5: ["play", "TREINO 5 MIN"], t10: ["play", "TREINO 10 MIN"], alo: ["leaf", "ALONGAMENTO"], cam: ["sun", "CAMINHADA"], desc: ["moon", "DESCANSAR HOJE"] };
function coachDificil(){
  sheet("Hoje tá difícil?", `<div class="coach-sh"><div class="coach-top"><div class="coach-av"><img src="img/modelo.jpg" alt="" onerror="this.remove()"><i>${ic("star", 10, 3)}</i></div><div class="coach-nm"><b>Coach CK Life</b><small>Me conta. Sem julgamento.</small></div></div>
    <div class="opts coach-dif">${DIF.map(d => `<button class="opt" data-dif="${d[0]}"><span class="oi">${ic(d[2])}</span><span>${d[1]}</span></button>`).join("")}</div><div id="coach-dif-r"></div></div>`);
  document.querySelectorAll("[data-dif]").forEach(b => b.onclick = () => {
    const d = DIF.find(x => x[0] === b.dataset.dif); document.querySelectorAll("[data-dif]").forEach(x => x.setAttribute("aria-pressed", x === b));
    const r = $("coach-dif-r"); r.innerHTML = `<div class="coach-bal2"><p>${d[3]}</p></div><div class="coach-ac col">${d[4].map((k, i) => `<button class="btn ${i ? "coach-b2" : "coach-b1"}" data-ca="${k}">${ic(DIF_AC[k][0], 16)} ${DIF_AC[k][1]}</button>`).join("")}</div>`;
    coachLiga(r); SOM.check && SOM.check(); r.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
}
/* "Preciso de motivação" */
function coachMotiva(){
  const E = ME.entrada || {}; let i = cHash(Date.now()) % CF.motivacao.length;
  const pinta = () => { const el = $("coach-mt"); if(el){ el.classList.remove("in"); void el.offsetWidth; el.textContent = CF.motivacao[i]; el.classList.add("in"); } };
  sheet("Preciso de motivação", `<div class="coach-sh"><div class="coach-top"><div class="coach-av"><img src="img/modelo.jpg" alt="" onerror="this.remove()"><i>${ic("star", 10, 3)}</i></div><div class="coach-nm"><b>Pra você, ${cPrim()} 💚</b><small>Coach virtual CK Life</small></div></div>
    <p class="coach-mt in" id="coach-mt"></p>
    ${E.motivo && MOTIVO_TX[E.motivo] ? `<p class="coach-lembra">Você chegou aqui para <b>${MOTIVO_TX[E.motivo]}</b>. Isso continua valendo.</p>` : ""}
    <div class="coach-ac col"><button class="btn coach-b1" data-ca="t5">${ic("play", 16)} Bora 5 minutos</button><button class="btn coach-b2" id="coach-outra">Outra frase</button></div></div>`);
  pinta(); $("coach-outra").onclick = () => { i = (i + 1) % CF.motivacao.length; SOM.tap && SOM.tap(); pinta(); };
  coachLiga(document.querySelector(".coach-sh"));
}
/* caminhada: a aluna registra quando voltar (sem GPS, sem dado de localização) */
function coachCaminhada(){
  let m = 15;
  sheet("Caminhada", `<div class="coach-sh"><p class="muted">Caminhar é treino também. Vá no seu ritmo e registre quando voltar.</p>
    <div class="coach-min">${[10, 15, 20, 30, 45].map(x => `<button class="chip" data-m="${x}" aria-pressed="${x === m}">${x} min</button>`).join("")}</div>
    <button class="btn btn-accent btn-block btn-lg" id="cam-ok">Registrar minha caminhada</button></div>`);
  document.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { m = +b.dataset.m; document.querySelectorAll("[data-m]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("cam-ok").onclick = () => {
    ME.treinos = ME.treinos || []; const kg = (ME.perfil && ME.perfil.peso) || 70;
    ME.treinos.push({ d: today(), h: new Date().getHours(), nome: "Caminhada", prog: null, plano: null, dia: null, rapido: "caminhada", min: m, kcal: Math.round(3.5 * kg * m / 60), exs: 1, parcial: false });
    save(); SOM.done && SOM.done(); vibra([60, 40, 90]); fecharSheet(); toast(`Caminhada de ${m} min registrada 💚`);
    try{ checaConquistas(); }catch(e){} rerender();
  };
}

/* "OLHA QUEM VOLTOU" (7 dias ou mais sem aparecer) */
function coachVoltou(){
  const C = COACH(); if(C.voltou === today() || !(ME.treinos || []).length) return;
  const n = cDiasSem(); if(n === null || n < 7) return;
  C.voltou = today(); C.voltas = (C.voltas || 0) + 1; save();
  const d = document.createElement("div"); d.className = "ent"; d.id = "coach-volta";
  d.innerHTML = `<img class="ent-bg" src="img/modelo.jpg" alt="" onerror="this.remove()"><div class="ent-in"><div class="coach-av grande"><img src="img/modelo.jpg" alt="" onerror="this.remove()"><i>${ic("star", 12, 3)}</i></div>
    <h1 class="ent-t" style="text-align:center">OLHA QUEM VOLTOU 💚</h1>
    <p class="ent-l" style="--d:.2s;text-align:center">Não importa quanto tempo passou, ${cPrim()}. Importa que você voltou.</p>
    <p class="ent-l" style="--d:.4s;text-align:center">Sem compensar nada. Sem recomeçar do zero. A gente continua de onde dá.</p>
    ${C.voltas > 1 ? `<p class="ent-num" style="text-align:center">Você já voltou <b class="num">${C.voltas}</b> vezes. Isso é resiliência.</p>` : ""}
    <div class="ent-bt"><button class="btn ent-cta" data-v="5">${ic("play", 16)} 5 MIN</button><button class="btn ent-cta ent-sec2" data-v="10">${ic("play", 16)} 10 MIN</button><button class="link ent-pula" data-v="plano">CONTINUAR MEU PLANO</button></div></div>`;
  document.body.appendChild(d); SOM.chime && SOM.chime();
  d.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { d.remove(); const v = b.dataset.v; if(v === "plano") abrirTreinoPreview(treinoDoDia()); else coachTreino(+v); });
}

/* primeiro treino: comemoração especial por cima da tela de treino concluído */
const fimTreinoCoach = fimTreino;
fimTreino = function(parcial){
  const r = fimTreinoCoach.apply(this, arguments);
  try{
    const L = ME.treinos || [], ok = L.filter(t => !t.parcial && t.rapido !== "caminhada");
    const pc = $("play") && $("play").querySelector(".done-hero");
    if(pc && !parcial){
      const fr = ok.length === 1 ? null : cEscolhe(["Você apareceu por você hoje. Isso é o que importa.", "Mais um passo. Sem perfeição, com constância.", "Orgulho de você. Agora: água e descanso.", "Você cumpriu o combinado com você mesma. 💚"], "pos" + L.length);
      if(fr) pc.querySelector("h2")?.insertAdjacentHTML("afterend", `<div class="coach-pos"><div class="coach-av"><img src="img/modelo.jpg" alt="" onerror="this.remove()"><i>${ic("star", 9, 3)}</i></div><p><b>Coach CK Life:</b> ${fr}</p></div>`);
    }
    if(!parcial && ok.length === 1 && !COACH().primeiro){
      COACH().primeiro = today(); save();
      const o = document.createElement("div"); o.className = "coach-1o"; o.id = "coach-1o";
      o.innerHTML = `<div class="coach-1o-in"><div class="ent-burst">🏅</div><span class="ent-eb">Seu primeiro treino no CK Life</span><h1>Você começou, ${cPrim()}. 💚</h1>
        <p>Hoje você fez algo que muita gente só promete. Esse é o primeiro dia de uma história que é sua.</p><p class="coach-1o-q">Agora o combinado é só um: <b>continue voltando.</b></p>
        <button class="btn ent-cta" id="c1o-ok">CONTINUAR</button><button class="link ent-pula" id="c1o-c">Chamar uma amiga para treinar comigo</button></div>`;
      $("play").appendChild(o); confete && confete(o);
      $("c1o-ok").onclick = () => o.remove();
      $("c1o-c").onclick = async () => { const tx = "Comecei a treinar no CK Life hoje 💚 Bora comigo? https://cklife.vercel.app"; try{ if(navigator.share) await navigator.share({ text: tx }); else { await navigator.clipboard.writeText(tx); toast("Convite copiado. É só colar no WhatsApp 💚"); } }catch(e){} };
    }
  }catch(e){ console.warn(e); }
  return r;
};

/* liga tudo: guarda o último acesso antes de hoje, pinta o recado no Início e mostra "Olha quem voltou" */
const migraCoach = migra; migra = function(u){ try{ if(u && ME && u === ME && u.ultimo && u.ultimo !== today()) window.CK_ULT_ACESSO = u.ultimo; }catch(e){} return migraCoach.apply(this, arguments); };
const organizaInicioCoach = organizaInicio;
organizaInicio = function(){ const r = organizaInicioCoach.apply(this, arguments); if(!ORG){ ORG = true; try{ coachPinta(); }catch(e){ console.warn(e); } finally { setTimeout(() => { ORG = false; }, 0); } } return r; };
const abrirAppCoach = abrirApp; abrirApp = function(){ const r = abrirAppCoach.apply(this, arguments); setTimeout(() => { if(!$("onb") || $("v-onb").hidden) try{ if(!$("ent-bv")) coachVoltou(); }catch(e){ console.warn(e); } }, 1200); return r; };
