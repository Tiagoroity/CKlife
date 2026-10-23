/* ===================== PLANO DO ANO CK + CALENDÁRIO DE TREINOS =====================
   Plano de 52 semanas montado pelo objetivo, nível, dias por semana e tempo da aluna:
   - 13 blocos de 4 semanas com temas que se alternam (base, resistência, força, queima); 4ª semana mais leve (recuperação).
   - Foco do dia segue o objetivo (ex.: Definir = pernas/glúteos, superior/core, glúteos em foco...).
   - Nenhuma combinação de exercícios se repete no ano (conferido treino a treino).
   Calendário: tocar num dia da semana mostra o treino daquele dia; dá para ver até 7 dias à frente. */
const PA_POOL = {
  Q: ["agacho", "sumocasa", "afundocasa", "bulgarocasa", "wallsit", "stepup", "agachsalto", "panturrilha"],
  G: ["ponte", "pontealt", "coice", "elevlatdeit", "hidrante", "abdpe"],
  P: ["flexjoelho", "flexinc", "flexao", "flexdiam", "pike", "mergulho"],
  C: ["invrow", "supermann", "perdigueiro", "barrafixa"],
  A: ["prancha", "pranchalat", "abdsupra", "abdinfra", "bicicleta", "deadbug", "russo", "hollow", "vup", "toqueombro"],
  K: ["polichinelo", "corrida", "escalador", "skater", "burpee", "pularcorda", "agachsalto"],
  M: ["along", "crianca", "alongquad", "perdigueiro", "deadbug", "supermann", "ponte", "pranchalat"]
};
/* exercícios mais difíceis só entram depois da adaptação (iniciante) */
const PA_DIFICIL = new Set(["burpee", "flexao", "flexdiam", "pike", "barrafixa", "vup", "hollow", "agachsalto", "bulgarocasa", "pontealt", "pularcorda"]);
const PA_FOCO = {
  "Corpo todo": "QPGCAK", "Pernas e glúteos": "QGQGA", "Glúteos em foco": "GGQGA", "Superior e core": "PCPAA",
  "Core e cardio": "KAKAA", "HIIT": "KQKPK", "Mobilidade": "MMMMM"
};
const PA_SEMANA = {
  emagrecer: ["Corpo todo", "HIIT", "Pernas e glúteos", "Core e cardio", "Superior e core", "Corpo todo"],
  definir: ["Pernas e glúteos", "Superior e core", "Glúteos em foco", "Core e cardio", "Corpo todo", "Pernas e glúteos"],
  massa: ["Pernas e glúteos", "Superior e core", "Glúteos em foco", "Corpo todo", "Superior e core", "Pernas e glúteos"],
  condicionamento: ["HIIT", "Corpo todo", "Core e cardio", "Pernas e glúteos", "HIIT", "Superior e core"],
  mobilidade: ["Mobilidade", "Corpo todo", "Mobilidade", "Core e cardio", "Mobilidade", "Corpo todo"]
};
const PA_TEMAS = [["Base e técnica", "rep"], ["Resistência", "tempo"], ["Força", "series"], ["Queima", "intervalo"]];
const PA_TEMAS_MOB = [["Soltar o corpo", "tempo"], ["Postura", "tempo"], ["Equilíbrio e core", "rep"], ["Fluxo leve", "tempo"]];
const PA_BASE = { Q: 12, G: 15, P: 8, C: 10, A: 12, K: 30, M: 30 };
const objAnual = () => { const o = (ME && ME.perfil && ME.perfil.objetivo) || "emagrecer"; return PA_SEMANA[o] ? o : ({ perder: "emagrecer", forca: "massa", gluteos: "definir", disposicao: "condicionamento" }[o] || "emagrecer"); };
let PA_CACHE = { k: "", dias: [] };
function geraAnual(){
  const pf = (ME && ME.perfil) || {}, obj = objAnual(), d = Math.max(2, Math.min(6, +pf.dias || 3)), ini = /inic/i.test(pf.nivel || "iniciante"), av = /avan/i.test(pf.nivel || ""), curto = +pf.tempo && +pf.tempo <= 15;
  const k = [obj, d, pf.nivel, curto].join("|"); if(PA_CACHE.k === k) return PA_CACHE.dias;
  const ordem = PA_SEMANA[obj].slice(0, d), temas = obj === "mobilidade" ? PA_TEMAS_MOB : PA_TEMAS, nivelF = ini ? .8 : av ? 1.15 : 1;
  const usados = new Set(), cont = {}, dias = [];
  for(let s = 0; s < 52; s++){
    const bloco = Math.floor(s / 4), sb = s % 4, [tema, metodo] = temas[bloco % temas.length], leve = sb === 3, ciclo = Math.floor(bloco / temas.length);
    const prog = (leve ? .75 : 1 + .1 * sb) * (1 + .05 * ciclo) * nivelF;
    ordem.forEach((foco, j) => {
      let slots = PA_FOCO[foco].split(""); if(curto) slots = slots.slice(0, 4);
      const pode = id => !(ini && s < 8 && PA_DIFICIL.has(id)) && !(ini && s < 20 && ["burpee", "pike", "vup", "barrafixa", "pularcorda"].includes(id)) && (!META || META[id]);
      let tent = 0, ids, sig;
      do {
        const ja = new Set(); let sem = (s * 131 + j * 17 + tent * 7919) >>> 0;
        const rnd = () => { sem = (sem * 1103515245 + 12345) >>> 0; return sem >>> 8; };   // sorteio fixo (sempre igual para a mesma aluna)
        ids = slots.map((g, i) => { const P = PA_POOL[g].filter(pode); cont[g] = (cont[g] || 0) + 1;
          const base = tent < 4 ? cont[g] + bloco * 2 + i + tent : rnd();
          for(let t = 0; t < P.length; t++){ const id = P[(base + t) % P.length]; if(!ja.has(id)){ ja.add(id); return id; } } return P[0]; });
        sig = foco + ":" + ids.join(","); tent++;
      } while(usados.has(sig) && tent < 200);
      usados.add(sig);
      const tempoM = metodo === "tempo" || metodo === "intervalo" || foco === "HIIT" || foco === "Mobilidade";
      const work = metodo === "intervalo" ? (ini ? 30 : 40) : foco === "Mobilidade" ? 40 : ini ? 30 : 40, rest = metodo === "intervalo" ? (ini ? 30 : 20) : 20;
      const itens = ids.map((id, i) => { const g = slots[i];
        if(tempoM || g === "K" || g === "M" || ["prancha", "pranchalat", "wallsit", "hollow"].includes(id)) return [id, "t", Math.round((g === "K" || g === "M" ? work : Math.max(20, work - 5)) * (leve ? .8 : 1) * (1 + .03 * sb)), rest];
        return [id, "r", Math.max(5, Math.round(PA_BASE[g] * prog)), metodo === "series" ? 45 : 30, metodo === "series" ? (leve ? 2 : ini ? 3 : 4) : 1]; });
      const series = metodo === "series" && foco !== "HIIT" && foco !== "Mobilidade";
      dias.push({ nome: foco, tipo: series ? "series" : "circuito", rodadas: curto ? 2 : leve ? 2 : metodo === "intervalo" ? (ini ? 3 : 4) : 3, descRodada: metodo === "intervalo" ? 45 : 60, itens,
        sub: `Bloco ${bloco + 1} · ${tema}${leve ? " · semana leve" : ""}`, semana: s + 1, tema });
    });
  }
  PA_CACHE = { k, dias }; return dias;
}
/* entra na lista de programas como "Plano do ano CK" */
const PROG_ANUAL = { id: "anual", nome: "Plano do ano CK", sub: "52 semanas organizadas pelo seu objetivo, sem repetir treino", nivel: "Todos", local: "casa", semanas: 52, cor: "#0E3D32", foco: "Seu objetivo",
  desc: "Treinos em blocos de 4 semanas (base, resistência, força e queima), com semana leve para recuperar. O foco de cada dia segue o seu objetivo e nenhuma combinação de exercícios se repete no ano.",
  get diasSem(){ return Math.max(2, Math.min(6, +((ME && ME.perfil && ME.perfil.dias) || 3))); }, get min(){ return +((ME && ME.perfil && ME.perfil.tempo) || 25); }, get dias(){ return geraAnual(); } };
if(!PROGS.some(p => p.id === "anual")) PROGS.push(PROG_ANUAL);
/* quem está começando agora já recebe o plano do ano */
recomenda = function(){ return "anual"; };
const treinoDoDiaPA = treinoDoDia; treinoDoDia = function(){ const p = progAtual(); if(p.id !== "anual") return treinoDoDiaPA.apply(this, arguments);
  const di = diaAtual(), dia = p.dias[di]; return montaTreino(dia, 1, { prog: "anual", di, sem: dia.semana, cor: p.cor, sub: `${dia.sub} · semana ${dia.semana} de 52` }); };

/* ---------- Agenda: quais dias são de treino e qual treino cai em cada dia ---------- */
const DSEM_K = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const DIAS_PADRAO = { 2: ["TU", "TH"], 3: ["MO", "WE", "FR"], 4: ["MO", "TU", "TH", "FR"], 5: ["MO", "TU", "WE", "TH", "FR"], 6: ["MO", "TU", "WE", "TH", "FR", "SA"] };
const diasDeTreino = () => (ME.lembrete && ME.lembrete.dias && ME.lembrete.dias.length) ? ME.lembrete.dias : DIAS_PADRAO[Math.max(2, Math.min(6, +((ME.perfil && ME.perfil.dias) || 3)))];
const ehDiaTreino = d => diasDeTreino().includes(DSEM_K[new Date(d + "T12:00:00").getDay()]);
function treinoPrevisto(k){
  const p = progAtual(), n = ((ME.prog && ME.prog.feitos) || 0) + k, di = n % p.dias.length, dia = p.dias[di];
  if(p.id === "anual") return montaTreino(dia, 1, { prog: "anual", di, sub: `${dia.sub} · semana ${dia.semana} de 52` });
  const sem = Math.min(p.semanas, 1 + Math.floor(n / p.diasSem)); return montaTreino(dia, sem, { prog: p.id, di, sub: `${p.nome} · semana ${sem} de ${p.semanas}` });
}
/* posição do treino em cada data (hoje = treino de hoje; próximos dias de treino seguem a sequência) */
function agenda(){
  const hoje = today(), feitoHoje = diasTreino().has(hoje), M = {}; let k = 0;
  if(!feitoHoje){ M[hoje] = 0; k = 1; }
  for(let i = 1; i <= 7; i++){ const d = addD(hoje, i); if(ehDiaTreino(d)) M[d] = k++; }
  return M;
}
const listaTreino = T => { const vistos = new Map(); T.steps.forEach(s => { const e = exById(s.id); const k = s.id; if(!vistos.has(k)) vistos.set(k, { nome: e ? e.nome : s.id, txt: s.modo === "t" ? `${s.val} s` : `${s.val} repetições`, n: 0 }); vistos.get(k).n++; }); return [...vistos.values()]; };
function abreDia(d){
  const hoje = today(), lim = addD(hoje, 7), dt = new Date(d + "T12:00:00"), titulo = dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const feitos = (ME.treinos || []).filter(t => t.d === d), A = agenda();
  let h = "";
  if(d < hoje){
    h = feitos.length ? feitos.map(t => `<div class="card cal-feito"><span class="cal-ok">${ic("check", 16, 3)}</span><div><b>${esc(t.nome)}</b><small>${t.min || 0} min · ${int(t.kcal || 0)} kcal${t.parcial ? " · parcial" : ""}</small></div></div>`).join("")
      : `<div class="card cal-vazio">${ic("calendar", 26, 1.7)}<b>Sem treino registrado</b><p class="hint" style="margin:0">Tudo bem! O importante é continuar. ${ehDiaTreino(d) ? "Esse treino ficou guardado para o próximo dia." : "Era dia de descanso."}</p></div>`;
  } else if(d > lim){
    h = `<div class="card cal-vazio">${ic("lock", 26, 1.7)}<b>Disponível mais perto do dia</b><p class="hint" style="margin:0">Você pode ver os treinos de até 7 dias à frente.</p></div>`;
  } else if(d === hoje && feitos.length){
    h = feitos.map(t => `<div class="card cal-feito"><span class="cal-ok">${ic("check", 16, 3)}</span><div><b>${esc(t.nome)}</b><small>Feito hoje · ${t.min || 0} min · ${int(t.kcal || 0)} kcal</small></div></div>`).join("") + `<p class="hint">Treino de hoje concluído. Descanse e volte no próximo dia de treino 💚</p>`;
  } else if(A[d] != null){
    const T = treinoPrevisto(A[d]), L = listaTreino(T);
    h = `<div class="cal-hero" style="--c:${esc(T.cor || "#2E7D5A")}"><span class="eyebrow">${d === hoje ? "Treino de hoje" : "Treino previsto"}</span><b>${esc(T.nome)}</b><small>${esc(T.sub || "")}</small>
        <div class="meta"><span>${ic("clock", 14)} ${minTreino(T)} min</span><span>${ic("flame", 14)} ~${kcalTreino(T)} kcal</span><span>${ic("repeat", 14)} ${L.length} exercícios</span></div></div>
      <div class="card cal-lista">${L.map((x, i) => `<div class="cal-ex"><span class="num">${i + 1}</span><b>${esc(x.nome)}</b><small>${esc(x.txt)}${x.n > 1 ? ` · ${x.n}x` : ""}</small></div>`).join("")}</div>
      ${d === hoje ? `<button class="btn btn-accent btn-block btn-lg" id="cal-go">${ic("play", 18)} Começar treino</button>` : `<p class="hint" style="text-align:center;margin:0">${ic("lock", 13)} Libera no dia. Se você treinar antes, a sequência avança e este dia mostra o próximo treino.</p>`}`;
  } else {
    h = `<div class="card cal-vazio">${ic("leaf", 26, 1.7)}<b>Dia de descanso</b><p class="hint" style="margin:0">Descansar também faz parte da evolução. Se quiser se mexer, um alongamento leve de 10 minutos ajuda na recuperação.</p>${d === hoje ? `<button class="btn btn-line btn-sm" id="cal-alo">${ic("play", 15)} Alongamento leve</button>` : ""}</div>`;
  }
  sheet(titulo.charAt(0).toUpperCase() + titulo.slice(1), h);
  const go = $("cal-go"); if(go) go.onclick = () => { fecharSheet(); iniciaTreino(treinoDoDia()); };
  const al = $("cal-alo"); if(al) al.onclick = () => { fecharSheet(); const q = QUICK.find(x => x.id === "q-alo"); if(q) iniciaTreino(treinoRapido(q)); };
}
/* calendário da semana no Início: dias clicáveis + próxima semana */
let CAL_SEM = 0;
function calSemana(){
  const box = document.querySelector("#t-inicio .week"); if(!box) return;
  const base = addD(semanaAtualDias()[0], CAL_SEM * 7), dias = Array.from({ length: 7 }, (_, i) => addD(base, i)), hoje = today(), lim = addD(hoje, 7), feitos = diasTreino(), A = agenda();
  box.classList.add("week-cal");
  box.innerHTML = dias.map(d => { const dt = new Date(d + "T12:00:00"), fut = d > hoje, trav = d > lim, plan = A[d] != null && !feitos.has(d);
    return `<button class="wd ${feitos.has(d) ? "done" : ""} ${d === hoje ? "hoje" : ""} ${plan ? "plan" : ""} ${trav ? "trav" : ""} ${fut && !plan && !trav ? "desc" : ""}" data-cal="${d}" aria-label="${dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric" })}"><span>${DIAS_CURTO[dt.getDay()]}</span><i>${feitos.has(d) ? ic("check", 16, 3) : trav ? ic("lock", 13, 2.2) : dt.getDate()}</i>${plan ? `<em></em>` : ""}</button>`; }).join("");
  box.querySelectorAll("[data-cal]").forEach(b => b.onclick = () => { SOM.tap(); abreDia(b.dataset.cal); });
  const card = box.closest(".card"), tit = card && card.querySelector(".sec-title");
  if(tit && !card.querySelector(".cal-nav")){ tit.insertAdjacentHTML("beforeend", `<span class="cal-nav"><button class="iconbtn sm" data-cn="-1" aria-label="Esta semana">${ic("back", 15)}</button><button class="iconbtn sm" data-cn="1" aria-label="Próxima semana" style="transform:rotate(180deg)">${ic("back", 15)}</button></span>`);
    card.querySelectorAll("[data-cn]").forEach(b => b.onclick = () => { CAL_SEM = Math.max(0, Math.min(1, CAL_SEM + +b.dataset.cn)); calSemana(); const h3 = card.querySelector(".sec-title h3"); if(h3) h3.textContent = CAL_SEM ? "Próxima semana" : "Esta semana";
      card.querySelectorAll(".sec-title > .muted, .meta-sem").forEach(e => e.hidden = !!CAL_SEM); }); }
  card && card.querySelectorAll("[data-cn]").forEach(b => b.disabled = (+b.dataset.cn < 0 && CAL_SEM === 0) || (+b.dataset.cn > 0 && CAL_SEM === 1));
  if(card && !card.querySelector(".cal-leg")) box.insertAdjacentHTML("afterend", `<p class="cal-leg"><span><i class="lg-plan"></i>dia de treino</span><span><i class="lg-ok"></i>feito</span><span>Toque num dia para ver o treino</span></p>`);
}
/* convite para o plano do ano (quem já tinha outro programa) */
function convitePlano(){
  const box = $("t-inicio"); if(!box || box.querySelector(".pa-conv") || (ME.prog && ME.prog.id === "anual") || ME.paDispensa) return;
  if(typeof progLiberado === "function" && !progLiberado("anual")) return;
  const alvo = box.querySelector(".today"); if(!alvo) return;
  alvo.insertAdjacentHTML("afterend", `<div class="pa-conv"><span class="pa-ic">${ic("calendar", 22, 2)}</span><span class="pa-tx"><i class="xp-novo">Novo</i><b>Plano do ano CK</b><small>52 semanas organizadas pelo seu objetivo, sem repetir treino.</small></span><span class="pa-bt"><button class="btn btn-sm" id="pa-sim">Ativar</button><button class="link" id="pa-nao">Agora não</button></span></div>`);
  $("pa-sim").onclick = () => { ME.prog = { id: "anual", ini: today(), feitos: 0, fator: (ME.prog && ME.prog.fator) || 0 }; save(); SOM.chime && SOM.chime(); toast("Plano do ano ativado 💚"); rInicio(); };
  $("pa-nao").onclick = () => { ME.paDispensa = true; save(); box.querySelector(".pa-conv").remove(); };
}
const rInicioPA = rInicio; rInicio = function(){ CAL_SEM = 0; rInicioPA.apply(this, arguments); calSemana(); convitePlano(); };
window.CKANUAL = () => geraAnual();   // leitura para conferência (não muda nada)
