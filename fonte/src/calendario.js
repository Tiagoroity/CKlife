/* ===================== CALENDÁRIO DO MÊS (aba Treinos) =====================
   Mostra o treino de cada dia do mês (ex.: segunda = Pernas e glúteos, terça = Superior e core).
   A previsão segue a sequência do programa da aluna nos dias de treino dela. Se ela pular um dia,
   o treino passa para o próximo dia de treino (igual ao calendário da semana no Início). */
const CAL_DSEM = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const CAL_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const CAL_CURTO = { "Corpo todo": "Corpo", "Pernas e glúteos": "Pernas", "Glúteos em foco": "Glúteos", "Superior e core": "Braços", "Core e cardio": "Core", "HIIT": "HIIT", "Mobilidade": "Mobilid" };
const CAL_COR = { "Corpo todo": "#1F9E89", "Pernas e glúteos": "#2E7D5A", "Glúteos em foco": "#C2547A", "Superior e core": "#4F6BD8", "Core e cardio": "#E08A2E", "HIIT": "#D9534F", "Mobilidade": "#8E6CD9" };
const calCurto = n => { if(CAL_CURTO[n]) return CAL_CURTO[n]; const t = String(n || "Treino").replace(/^Treino\s+/i, "").trim(), m = t.match(/^(\S+)\s+(\d+|[A-Z])$/);
  return m ? (m[1].length > 5 ? m[1].slice(0, 4) : m[1]) + " " + m[2] : t.split(/[\s·—-]+/)[0].slice(0, 7); };
const calCor = n => CAL_COR[n] || "#2E7D5A";
let CAL_M = 0;   // 0 = mês atual, 1 = próximo, -1 = anterior...

/* mesma regra do Início, com uma correção: em dia de descanso o treino de hoje é opcional,
   então o próximo dia de treino mostra o mesmo treino (a sequência só anda quando ela treina) */
agenda = function(fim){
  const hoje = today(), feitoHoje = diasTreino().has(hoje), M = {}, ate = fim || addD(hoje, 7);
  let k = 0;
  if(!feitoHoje){ M[hoje] = 0; if(ehDiaTreino(hoje)) k = 1; }
  for(let d = addD(hoje, 1); d <= ate; d = addD(d, 1)) if(ehDiaTreino(d)) M[d] = k++;
  return M;
};
const calPrev = (() => { let ch = "", C = {}; return k => { const key = [ME.prog && ME.prog.id, ME.prog && ME.prog.feitos, today()].join("|"); if(key !== ch){ ch = key; C = {}; } return C[k] || (C[k] = treinoPrevisto(k)); }; })();
const calDataTxt = d => { const dt = new Date(d + "T12:00:00"); return `${CAL_DSEM[dt.getDay()]}, ${dt.getDate()} de ${CAL_MES[dt.getMonth()]}`; };
const calRel = d => { const h = today(); return d === h ? "Hoje" : d === addD(h, 1) ? "Amanhã" : ""; };

/* o que acontece em cada dia */
function calInfo(d, A){
  const hoje = today(), feitos = (ME.treinos || []).filter(t => t.d === d);
  if(feitos.length) return { tipo: "feito", nome: feitos[0].nome, feitos };
  if(d < hoje) return { tipo: ehDiaTreino(d) ? "perdeu" : "desc" };
  if(d === hoje && !ehDiaTreino(d)) return { tipo: "desc", opcional: true };
  if(A[d] != null){ const T = calPrev(A[d]); return { tipo: "plan", nome: T.nome, T }; }
  return { tipo: "desc" };
}

function calSheet(d){
  const hoje = today(), lim = addD(hoje, 7);
  if(d <= lim && d >= hoje && !(d === hoje && !ehDiaTreino(d) && !diasTreino().has(d))) return abreDia(d);   // até 7 dias: mesma tela do Início
  const A = agenda(addD(d, 1)), I = calInfo(d, A), tit = calDataTxt(d);
  let h = "";
  if(I.tipo === "feito") h = I.feitos.map(t => `<div class="card cal-feito"><span class="cal-ok">${ic("check", 16, 3)}</span><div><b>${esc(t.nome)}</b><small>${t.min || 0} min · ${int(t.kcal || 0)} kcal</small></div></div>`).join("");
  else if(I.tipo === "perdeu") h = `<div class="card cal-vazio">${ic("calendar", 26, 1.7)}<b>Sem treino registrado</b><p class="hint" style="margin:0">Tudo bem! Esse treino ficou guardado para o próximo dia de treino.</p></div>`;
  else if(I.tipo === "plan"){
    const T = I.T, L = listaTreino(T);
    h = `<div class="cal-hero" style="--c:${esc(calCor(T.nome))}"><span class="eyebrow">Treino previsto</span><b>${esc(T.nome)}</b><small>${esc(T.sub || "")}</small>
        <div class="meta"><span>${ic("clock", 14)} ${minTreino(T)} min</span><span>${ic("flame", 14)} ~${kcalTreino(T)} kcal</span><span>${ic("repeat", 14)} ${L.length} exercícios</span></div></div>
      <div class="card cal-lista">${L.map((x, i) => `<div class="cal-ex"><span class="num">${i + 1}</span><b>${esc(x.nome)}</b><small>${esc(x.txt)}${x.n > 1 ? ` · ${x.n}x` : ""}</small></div>`).join("")}</div>
      <p class="hint" style="text-align:center;margin:0">${ic("calendar", 13)} Previsão para quem treina em todos os dias marcados. Se pular um dia, o treino passa para o próximo dia de treino.</p>`;
  } else if(d === hoje){
    const T = calPrev(0);
    h = `<div class="card cal-vazio">${ic("leaf", 26, 1.7)}<b>Hoje é dia de descanso</b><p class="hint" style="margin:0">Descansar também faz parte. Se quiser treinar mesmo assim, o seu próximo treino é <b>${esc(T.nome)}</b>.</p>
      <button class="btn btn-line btn-sm" id="cal-opc">${ic("play", 15)} Treinar ${esc(calCurto(T.nome))} hoje</button></div>`;
  } else h = `<div class="card cal-vazio">${ic("leaf", 26, 1.7)}<b>Dia de descanso</b><p class="hint" style="margin:0">Descansar também faz parte da evolução.</p></div>`;
  sheet(tit.charAt(0).toUpperCase() + tit.slice(1), h);
  const op = $("cal-opc"); if(op) op.onclick = () => { fecharSheet(); iniciaTreino(treinoDoDia()); };
}

function calMesHTML(){
  const hoje = today(), b = new Date(hoje + "T12:00:00"); b.setDate(1); b.setMonth(b.getMonth() + CAL_M);
  const ano = b.getFullYear(), mes = b.getMonth(), nDias = new Date(ano, mes + 1, 0).getDate();
  const d0 = `${ano}-${String(mes + 1).padStart(2, "0")}-01`, dN = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(nDias).padStart(2, "0")}`;
  const A = agenda(dN), pad = (new Date(d0 + "T12:00:00").getDay() + 6) % 7;
  const dias = Array.from({ length: nDias }, (_, i) => addD(d0, i)), info = Object.fromEntries(dias.map(d => [d, calInfo(d, A)]));
  // destaque: hoje e próximo treino
  const prox = Object.keys(A).filter(d => d >= hoje && A[d] != null && !(d === hoje && !ehDiaTreino(d))).sort()[0];
  const hj = calInfo(hoje, agenda(addD(hoje, 1)));
  const linha = (rot, d, I) => `<button class="cal-dest" data-cd="${d}" style="--c:${esc(I.tipo === "plan" || I.tipo === "feito" ? calCor(I.nome) : "#7BA77A")}"><span class="cal-dest-r">${rot}<small>${esc(CAL_DSEM[new Date(d + "T12:00:00").getDay()])}</small></span><b>${I.tipo === "feito" ? esc(I.nome) + " ✓" : I.tipo === "plan" ? esc(I.nome) : "Descanso"}</b>${ic("back", 15)}</button>`;
  const topo = CAL_M === 0 ? `<div class="cal-top">${linha("Hoje", hoje, hj)}${prox && prox !== hoje ? linha(calRel(prox) || calDataTxt(prox).split(",")[0].replace(/^./, c => c.toUpperCase()), prox, info[prox] || calInfo(prox, A)) : ""}</div>` : "";
  const cel = d => { const I = info[d], dt = new Date(d + "T12:00:00"), cls = ["cal-c", I.tipo, d === hoje ? "hoje" : "", d < hoje ? "pass" : ""].join(" ");
    const lab = I.tipo === "feito" ? `${ic("check", 11, 3)} ${esc(calCurto(I.nome))}` : I.tipo === "plan" ? esc(calCurto(I.nome)) : I.tipo === "perdeu" ? "–" : "";
    return `<button class="${cls}" data-cd="${d}" style="--c:${esc(I.nome ? calCor(I.nome) : "transparent")}" aria-label="${esc(calDataTxt(d))}: ${esc(I.nome || (I.tipo === "perdeu" ? "sem treino" : "descanso"))}"><span class="cal-n">${dt.getDate()}</span><span class="cal-l">${lab}</span></button>`; };
  const lista = dias.filter(d => info[d].tipo === "plan" || info[d].tipo === "feito").map(d => { const I = info[d], dt = new Date(d + "T12:00:00"), T = I.T;
    return `<button class="cal-row ${I.tipo}" data-cd="${d}" style="--c:${esc(calCor(I.nome))}"><span class="cal-row-d"><b>${dt.getDate()}</b><small>${esc(CAL_DSEM[dt.getDay()].slice(0, 3))}</small></span><span class="cal-row-t"><b>${esc(I.nome)}</b><small>${I.tipo === "feito" ? "Feito ✓" : `${listaTreino(T).length} exercícios · ${minTreino(T)} min`}${calRel(d) ? " · " + calRel(d) : ""}</small></span>${ic("back", 15)}</button>`; }).join("");
  const focos = [...new Set(dias.map(d => info[d].nome).filter(Boolean))];
  const pg = progAtual(), focoUnico = pg.id !== "anual" && new Set((pg.dias || []).map(x => String(x.nome).replace(/\s*\d+$/, ""))).size <= 1;
  const progBox = `<div class="cal-prog"><span><small>Seu programa</small><b>${esc(pg.nome)}</b>${focoUnico ? `<em>Este programa treina sempre o mesmo foco. Para variar os dias (pernas, braços, core...), escolha o Plano do ano CK.</em>` : ""}</span><button class="btn btn-sm ${focoUnico ? "btn-accent" : "btn-line"}" id="cal-troca">Trocar programa</button></div>`;
  return `<div class="cal-mes">
    ${CAL_M === 0 ? progBox : ""}
    ${topo}
    <div class="card cal-card">
      <div class="cal-h"><button class="iconbtn sm" data-cm="-1" aria-label="Mês anterior">${ic("back", 15)}</button><b>${CAL_MES[mes].replace(/^./, c => c.toUpperCase())} ${ano}</b><button class="iconbtn sm" data-cm="1" aria-label="Próximo mês" style="transform:rotate(180deg)" ${CAL_M >= 1 ? "disabled" : ""}>${ic("back", 15)}</button></div>
      <div class="cal-g cal-sem">${["S", "T", "Q", "Q", "S", "S", "D"].map(x => `<span>${x}</span>`).join("")}</div>
      <div class="cal-g">${"<i></i>".repeat(pad)}${dias.map(cel).join("")}</div>
      ${focos.length ? `<div class="cal-leg2">${focos.map(f => `<span><i style="background:${esc(calCor(f))}"></i>${esc(f)}</span>`).join("")}</div>` : ""}
    </div>
    ${lista ? `<h3 class="cal-tit">Treinos de ${CAL_MES[mes]}</h3><div class="cal-lista-mes">${lista}</div>` : ""}
    <p class="hint" style="margin:0">Seus dias de treino: ${diasDeTreino().map(k => CAL_DSEM[DSEM_K.indexOf(k)]).join(", ")}. Para mudar, vá em Perfil → Lembrete de treino. Se pular um dia, o treino passa para o próximo dia de treino.</p>
  </div>`;
}
function calLiga(box){
  box.querySelectorAll("[data-cd]").forEach(b => b.onclick = () => { SOM.tap(); calSheet(b.dataset.cd); });
  const tr = box.querySelector("#cal-troca"); if(tr) tr.onclick = () => { SOM.tap(); TV = "programas"; rTreinar(); window.scrollTo(0, 0); };
  box.querySelectorAll("[data-cm]").forEach(b => b.onclick = () => { CAL_M = Math.min(1, CAL_M + +b.dataset.cm); SOM.tap(); rTreinar(); });
}

/* botão "Calendário" ao lado de Programas · Rápidos · Exercícios */
const rTreinarCal = rTreinar;
rTreinar = function(){
  const noCal = TV === "calendario";
  if(noCal) TV = "rapidos";
  const r = rTreinarCal.apply(this, arguments);
  if(noCal) TV = "calendario";
  const el = $("t-treinar"), sg = el && el.querySelector(".seg"); if(!sg) return r;
  if(!sg.querySelector('[data-v="calendario"]')){
    sg.insertAdjacentHTML("beforeend", `<button data-v="calendario" aria-pressed="${TV === "calendario"}">Calendário</button>`);
    sg.classList.add("seg-4");
    sg.querySelector('[data-v="calendario"]').onclick = () => { TV = "calendario"; CAL_M = 0; SOM.tap(); rTreinar(); };
  }
  if(noCal){
    sg.querySelectorAll("[data-v]").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === "calendario"));
    while(sg.nextSibling) sg.nextSibling.remove();
    sg.insertAdjacentHTML("afterend", calMesHTML()); calLiga(el);
  }
  return r;
};

/* Início: a frase do topo diz o dia da semana e o treino (ex.: "Hoje, segunda: Pernas e glúteos.") */
const rInicioCal = rInicio;
rInicio = function(){
  const r = rInicioCal.apply(this, arguments);
  try{
    const p = document.querySelector("#t-inicio .capa-tx p"), hoje = today(); if(!p || diasTreino().has(hoje)) return r;
    const dsem = CAL_DSEM[new Date(hoje + "T12:00:00").getDay()];
    if(ehDiaTreino(hoje)) p.textContent = `Hoje, ${dsem}: ${calPrev(0).nome}.`;
    else { const A = agenda(addD(hoje, 8)), prox = Object.keys(A).filter(d => d > hoje).sort()[0];
      p.textContent = prox ? `Hoje é descanso. ${calRel(prox) === "Amanhã" ? "Amanhã (" + CAL_DSEM[new Date(prox + "T12:00:00").getDay()] + ")" : CAL_DSEM[new Date(prox + "T12:00:00").getDay()].replace(/^./, c => c.toUpperCase())}: ${calPrev(A[prox]).nome}.` : "Hoje é descanso."; }
  }catch(e){ console.warn(e); }
  return r;
};
