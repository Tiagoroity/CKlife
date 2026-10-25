/* ===================== ENTRADA NO CK LIFE (cadastro como experiência) =====================
   Intro emocional (5 telas) → perguntas do plano (com dias da semana, horário, o que faz desistir, o que trouxe,
   mensagem para a eu do futuro) → compromisso "EU VOLTO POR MIM" → acordo → "Dessa vez, você não está sozinha"
   → Legião CK Life (número real do banco, nunca inventado) → Coach CK Life → ativar avisos → plano pronto → boas-vindas.
   Sem culpa, sem promessa de resultado: "Nós não prometemos resultado mágico. Prometemos não deixar você caminhar sem direção." */

const COACH_IMG = "img/modelo.jpg";
const FRASES_ID = ["Não buscamos perfeição. Buscamos constância.", "Você não precisa começar de novo. Precisa continuar.", "Um dia de cada vez. Uma escolha de cada vez.", "Mulheres que aparecem por elas mesmas.", "Pouco ainda conta.", "Voltar também é progresso.", "Seu ritmo. Sua evolução. Sua vida."];
const ENT_INTRO = [
  { t: "Você não entrou aqui só para treinar.", p: ["Você entrou para construir uma rotina que consiga manter."], bt: "QUERO COMEÇAR" },
  { t: "Dessa vez você não precisa fazer tudo sozinha.", p: ["O CK Life vai estar com você nos treinos, na alimentação, na evolução e principalmente nos dias em que a motivação desaparecer."], bt: "Continuar" },
  { t: "Não precisamos de perfeição.", p: ["Precisamos que você continue voltando."], bt: "Continuar" },
  { t: "Existem outras mulheres começando, tentando, errando, evoluindo e recomeçando todos os dias.", p: ["A partir de agora você também faz parte disso."], bt: "Continuar", menor: true },
  { t: "ESSE PROJETO PODE DAR CERTO.", p: ["Porque você não vai depender apenas da motivação.", "Nós vamos te acompanhar.", "Nós vamos te lembrar.", "Nós vamos celebrar.", "Nós vamos te ajudar a continuar."], bt: "ESTOU PRONTA" }
];
const ENT_POS_NOVA = ["compromisso", "acordo", "forte", "legiao", "coach", "avisos"], ENT_POS_VET = ["novo", "compromisso", "acordo", "coach", "avisos"];
const entLista = () => OB && OB.veterana ? ENT_POS_VET : ENT_POS_NOVA;
const ENT_DESISTIR = [["tempo", "Falta de tempo", "clock"], ["preguica", "Preguiça", "moon"], ["motivacao", "Falta de motivação", "bolt"], ["nao_sei", "Não saber o que fazer", "target"], ["animada", "Começo animada e depois paro", "flame"], ["imprevisivel", "Rotina imprevisível", "calendar"], ["cansaco", "Cansaço", "leaf"], ["outro", "Outro motivo", "star"]];
const ENT_MOTIVO = [["disposicao", "Ter mais disposição", "bolt"], ["saude", "Cuidar da saúde", "heart"], ["autoestima", "Me sentir bem comigo", "star"], ["rotina", "Criar uma rotina", "calendar"], ["voltar", "Voltar a treinar", "repeat"], ["objetivo", "Um objetivo específico", "target"]];
const ENT_HORARIO = [["manha", "Manhã", "Antes da correria começar", "sun", "07:00"], ["tarde", "Tarde", "Uma pausa no meio do dia", "sun", "13:00"], ["noite", "Noite", "Depois do trabalho", "moon", "19:00"], ["varia", "Varia bastante", "A gente se adapta", "repeat", "18:00"]];

/* perguntas novas no meio do plano (as que já existiam continuam iguais) */
(() => {
  const iT = OBQ.findIndex(q => q.k === "tempo");
  if(iT >= 0) OBQ[iT].o = [[10, "5 a 15 minutos", "Rápido e possível", "clock"], [20, "15 a 30 minutos", "O equilíbrio ideal", "clock"], [30, "30 a 45 minutos", "Treino completo", "clock"], [45, "45 minutos ou mais", "Sem pressa", "clock"]];
  const iD = OBQ.findIndex(q => q.k === "dias");
  if(iD >= 0) OBQ.splice(iD, 1, { k: "diasSem", custom: 1 },
    { k: "horario", t: "Qual horário normalmente você consegue treinar?", s: "Vamos te lembrar perto do seu horário.", o: ENT_HORARIO.map(h => [h[0], h[1], h[2], h[3]]) },
    { k: "desistir", t: "O que mais costuma fazer você desistir?", s: "Sem julgamento. É só pra gente te ajudar do jeito certo.", o: ENT_DESISTIR.map(d => [d[0], d[1], "", d[2]]) },
    { k: "motivo", t: "O que fez você chegar até aqui?", s: "Vamos lembrar disso nos dias difíceis (só você vê).", o: ENT_MOTIVO.map(m => [m[0], m[1], "", m[2]]) },
    { k: "futuro", custom: 1 });
  OBFOTO.diasSem = "img/ex-agacho.jpg"; OBFOTO.horario = "img/ex-polichinelo.jpg"; OBFOTO.desistir = "img/ex-afundocasa.jpg"; OBFOTO.motivo = "img/modelo.jpg"; OBFOTO.futuro = "img/ex-pranchalat.jpg";
})();

const entTela = (cls, html, passo, total) => `<div class="ent ${cls || ""}"><img class="ent-bg" src="${COACH_IMG}" alt="" onerror="this.remove()"><div class="ent-in">${total ? `<div class="ent-dots">${Array.from({ length: total }, (_, i) => `<i class="${i <= passo ? "on" : ""}"></i>`).join("")}</div>` : ""}${html}</div></div>`;
const entLinhas = L => L.map((p, i) => `<p class="ent-l" style="--d:${.15 + i * .18}s">${p}</p>`).join("");
const entNome = () => esc((ME && ME.nome || "").split(" ")[0] || "você");
let LEGIAO_N = null;
async function legiaoHoje(){ if(LEGIAO_N !== null) return LEGIAO_N; try{ if(NU.ativo && NU.sb){ const r = await NU.sb.rpc("legiao_hoje"); if(!r.error && typeof r.data === "number") LEGIAO_N = r.data; } }catch(e){} return LEGIAO_N; }

const onboardingBase = onboarding;
onboarding = function(){
  OB = OB || { i: 0, itens: [] };
  if(OB.intro == null) OB.intro = 0;
  const box = $("onb");
  // 1) intro emocional
  if(OB.intro < ENT_INTRO.length){
    const s = ENT_INTRO[OB.intro];
    box.innerHTML = entTela(OB.intro === 4 ? "ent-forte" : "", `<h1 class="ent-t ${s.menor ? "menor" : ""}">${s.t}</h1>${entLinhas(s.p)}
      <div class="ent-bt"><button class="btn ent-cta" id="ent-ok">${s.bt}</button>${OB.intro === 0 ? `<button class="link ent-pula" id="ent-pula">Pular introdução</button>` : `<button class="link ent-pula" id="ent-volta">Voltar</button>`}</div>`, OB.intro, ENT_INTRO.length);
    $("ent-ok").onclick = () => { SOM.tap && SOM.tap(); OB.intro++; onboarding(); window.scrollTo(0, 0); };
    const p = $("ent-pula"); if(p) p.onclick = () => { OB.intro = ENT_INTRO.length; onboarding(); };
    const v = $("ent-volta"); if(v) v.onclick = () => { OB.intro--; onboarding(); };
    return;
  }
  const vis = OBQ.filter(q => !(q.pula && q.pula(OB))), q = vis[OB.i];
  // 2) perguntas novas com tela própria
  if(q && q.k === "diasSem"){
    OB.diasSem = OB.diasSem || ["MO", "WE", "FR"];
    const n = vis.length - 1, dots = `<div class="steps-dots">${vis.slice(0, n).map((_, i) => `<i class="${i <= OB.i ? "on" : ""}"></i>`).join("")}</div>`;
    box.innerHTML = obHero("diasSem", `<button class="iconbtn sm" id="ob-back" aria-label="Voltar">${ic("back", 18)}</button>`, dots, "Em quais dias você quer treinar?", "Comece com o que dá para manter. Dá para mudar depois.") + `
      <div class="ent-dias">${DSEM.map(([k, nm]) => `<button class="chip" data-d="${k}" aria-pressed="${OB.diasSem.includes(k)}">${nm}</button>`).join("")}</div>
      <p class="hint" style="text-align:center">${OB.diasSem.length} ${OB.diasSem.length === 1 ? "dia" : "dias"} por semana${OB.diasSem.length >= 3 ? " · ótimo começo" : ""}</p>
      <button class="btn btn-accent btn-block btn-lg" id="ob-next" ${OB.diasSem.length ? "" : "disabled"}>Continuar</button>`;
    box.querySelectorAll("[data-d]").forEach(b => b.onclick = () => { const d = b.dataset.d; OB.diasSem = OB.diasSem.includes(d) ? OB.diasSem.filter(x => x !== d) : DSEM.map(x => x[0]).filter(k => k === d || OB.diasSem.includes(k)); SOM.tap && SOM.tap(); onboarding(); });
    $("ob-back").onclick = () => { OB.i--; onboarding(); };
    $("ob-next").onclick = () => { OB.dias = Math.max(2, Math.min(6, OB.diasSem.length)); OB.i++; SOM.check && SOM.check(); onboarding(); window.scrollTo(0, 0); };
    return;
  }
  if(q && q.k === "futuro"){
    const n = vis.length - 1, dots = `<div class="steps-dots">${vis.slice(0, n).map((_, i) => `<i class="${i <= OB.i ? "on" : ""}"></i>`).join("")}</div>`;
    box.innerHTML = obHero("futuro", `<button class="iconbtn sm" id="ob-back" aria-label="Voltar">${ic("back", 18)}</button>`, dots, "Uma mensagem para a sua eu do futuro", "Opcional. Daqui a 30 dias a gente te mostra o que você escreveu hoje. Só você vê.") + `
      <div class="field"><textarea class="input ent-futuro" id="ob-fut" maxlength="200" placeholder="Ex.: Quero voltar a ter disposição e cuidar de mim.">${esc(OB.futuro || "")}</textarea></div>
      <button class="btn btn-accent btn-block btn-lg" id="ob-next">Guardar e continuar</button><button class="link" id="ob-sem" style="align-self:center">Prefiro não escrever agora</button>`;
    $("ob-back").onclick = () => { OB.i--; onboarding(); };
    const vai = guarda => { OB.futuro = guarda ? $("ob-fut").value.trim().slice(0, 200) : ""; OB.i++; SOM.check && SOM.check(); onboarding(); window.scrollTo(0, 0); };
    $("ob-next").onclick = () => vai(true); $("ob-sem").onclick = () => vai(false);
    return;
  }
  // 3) depois das medidas e antes do plano: compromisso, acordo, legião, coach e avisos
  if(q && q.k === "pronto" && (OB.pos || 0) < entLista().length){ return entPos(); }
  onboardingBase.apply(this, arguments);
  if(q && q.k === "pronto"){ const nx = $("ob-next"); if(nx) nx.addEventListener("click", entSalva, true); }
};
function entPos(){
  const box = $("onb"), k = entLista()[OB.pos || 0], nome = entNome();
  const prox = () => { OB.pos = (OB.pos || 0) + 1; SOM.tap && SOM.tap(); if(OB.veterana){ if(OB.pos >= ENT_POS_VET.length) return entVetFim(); entPos(); } else onboarding(); window.scrollTo(0, 0); };
  if(k === "novo"){
    box.innerHTML = entTela("", `<span class="ent-eb">Novidade no CK Life</span><h1 class="ent-t">${nome}, o CK Life ficou mais perto de você. 💚</h1>
      ${entLinhas(["Agora você tem uma Coach CK Life para te lembrar, comemorar com você e te buscar quando a rotina apertar.", "Leva menos de um minuto. Seu plano e seus dados continuam iguais."])}
      <div class="ent-bt"><button class="btn ent-cta" id="ent-ok">QUERO CONHECER</button><button class="link ent-pula" id="ent-nao">Agora não</button></div>`);
    $("ent-ok").onclick = prox;
    $("ent-nao").onclick = () => { ME.entrada = { pulou: today() }; save(); OB = null; abrirApp(); };
  } else if(k === "compromisso"){
    box.innerHTML = entTela("ent-comp", `<span class="ent-eb">Antes de começar</span><h1 class="ent-t">UM COMPROMISSO COM VOCÊ.</h1>
      ${entLinhas(["Não estamos pedindo que você nunca falhe.", "Não estamos pedindo que você nunca falte.", "Estamos pedindo apenas uma coisa:", "Quando a rotina apertar, quando bater preguiça ou quando você perder alguns dias…"])}
      <p class="ent-volte">VOLTE.</p><p class="ent-perg">Você promete não abandonar você mesma só porque um dia não saiu perfeito?</p>
      <div class="ent-bt"><button class="btn ent-cta" id="ent-ok">EU VOLTO POR MIM 💚</button></div>`);
    $("ent-ok").onclick = () => { OB.compromisso = today(); vibra([30, 40, 60]); SOM.chime && SOM.chime(); prox(); };
  } else if(k === "acordo"){
    box.innerHTML = entTela("", `<h1 class="ent-t">Então nós temos um acordo.</h1>${entLinhas(["O CK Life vai fazer a parte dele.", "Agora começa a sua."])}<div class="ent-bt"><button class="btn ent-cta" id="ent-ok">Continuar</button></div>`);
    $("ent-ok").onclick = prox;
  } else if(k === "forte"){
    box.innerHTML = entTela("ent-forte", `${entLinhas(["Talvez você já tenha começado antes.", "Talvez tenha parado.", "Talvez tenha prometido que dessa vez seria diferente.", "<b>Então vamos fazer diferente.</b>", "Você não precisa depender apenas da motivação."])}
      <ul class="ent-tem">${["Tem treino.", "Tem plano.", "Tem comunidade.", "Tem acompanhamento.", "Tem outras mulheres tentando todos os dias."].map((t, i) => `<li style="--d:${1 + i * .15}s">💚 ${t}</li>`).join("")}</ul>
      <p class="ent-l" style="--d:1.9s">E sempre que você precisar voltar, o CK Life vai estar aqui.</p>
      <h1 class="ent-t ent-grande">DESSA VEZ, VOCÊ NÃO ESTÁ SOZINHA.</h1><div class="ent-bt"><button class="btn ent-cta" id="ent-ok">COMEÇAR MINHA JORNADA</button></div>`);
    $("ent-ok").onclick = prox;
  } else if(k === "legiao"){
    box.innerHTML = entTela("ent-leg", `<span class="ent-eb">Legião CK Life</span><h1 class="ent-t">BEM-VINDA À LEGIÃO CK LIFE 💚</h1>
      <p class="ent-l" style="--d:.15s">Uma comunidade de mulheres que decidiram aparecer por elas mesmas.</p>
      <div class="ent-dif">${["Mulheres diferentes.", "Rotinas diferentes.", "Corpos diferentes.", "Objetivos diferentes."].map((t, i) => `<span style="--d:${.35 + i * .12}s">${t}</span>`).join("")}</div>
      <p class="ent-l ent-dec" style="--d:.9s">Mas uma decisão em comum: <b>continuar.</b></p>
      <p class="ent-num" id="ent-num">Todos os dias mulheres entram aqui tentando construir uma versão mais constante de si mesmas.</p>
      <p class="ent-l" style="--d:1.2s">Hoje começa a sua história aqui.</p>
      <div class="ent-bt"><button class="btn ent-cta" id="ent-ok">EU FAÇO PARTE</button></div>`);
    legiaoHoje().then(n => { const el = $("ent-num"); if(el && n >= 20) el.innerHTML = `Hoje, <b class="num">${int(n)}</b> mulheres apareceram por elas mesmas.`; });   // número sempre do banco
    $("ent-ok").onclick = prox;
  } else if(k === "coach"){
    box.innerHTML = entTela("ent-coach", `<div class="coach-av grande"><img src="${COACH_IMG}" alt="" onerror="this.remove()"><i>${ic("star", 12, 3)}</i></div><span class="ent-eb">Sua coach virtual CK Life</span>
      <div class="coach-bal">${entLinhas([`Oi, ${nome}. 💚 Eu sou a Coach CK Life.`, "Vou aparecer por aqui de vez em quando para te lembrar dos seus treinos, comemorar suas vitórias e te buscar quando você der aquela sumida clássica. 😂", "Sem cobrança absurda.", "Sem perfeição.", "Só quero uma coisa de você: continue voltando."])}</div>
      <div class="ent-bt"><button class="btn ent-cta" id="ent-ok">FECHADO 🤝</button></div>`);
    $("ent-ok").onclick = prox;
  } else if(k === "avisos"){
    const ja = typeof pushLigado === "function" && pushLigado();
    box.innerHTML = entTela("ent-coach", `<div class="coach-av grande"><img src="${COACH_IMG}" alt="" onerror="this.remove()"><i>${ic("bell", 12, 3)}</i></div><h1 class="ent-t">DEIXA A GENTE CAMINHAR COM VOCÊ?</h1>
      ${entLinhas(["Treinos, conquistas, alimentação e aquele empurrãozinho quando você precisar."])}<p class="ent-l" style="--d:.4s;font-size:14px;opacity:.8">Você escolhe o que quer receber e pode mudar quando quiser.</p>
      <div class="ent-bt"><button class="btn ent-cta" id="ent-ok">${ja ? "CONTINUAR" : "ATIVAR MINHA COACH"}</button>${ja ? "" : `<button class="link ent-pula" id="ent-nao">Agora não</button>`}</div><p class="ent-msg" id="ent-msg"></p>`);
    $("ent-ok").onclick = async () => {
      if(!ja && typeof ativarNotificacoes === "function"){ try{ await ativarNotificacoes(); }catch(e){} }   // pede a permissão do aparelho (nunca burla o sistema)
      if(!$("sheet").hidden) return;   // no iPhone abre a explicação de como instalar; ela volta e toca de novo
      OB.avisos = typeof pushLigado === "function" && pushLigado(); prox(); };
    const nao = $("ent-nao"); if(nao) nao.onclick = () => { OB.avisos = false; const m = $("ent-msg"); if(m) m.textContent = "Tudo bem. Você pode ativar quando quiser em Perfil."; setTimeout(prox, 1200); };
  }
}
/* quem já tinha conta antes da atualização: apresentação curta, uma vez só (não refaz o cadastro) */
function entVeterana(){ OB = { i: 0, itens: [], intro: ENT_INTRO.length, veterana: 1, pos: 0 }; show("v-onb"); entPos(); }
function entVetFim(){
  const L = ME.lembrete;
  ME.entrada = Object.assign({}, ME.entrada || {}, { compromisso: OB.compromisso || today(), veterana: true, entrou: today() });
  if(OB.avisos && L && !L.celular){ L.celular = true; }
  ME.boasVindas = "mostrar"; save(); OB = null; abrirApp();
}
/* ao concluir o plano: guarda as respostas novas e cria o lembrete no horário escolhido */
function entSalva(){
  try{
    const h = ENT_HORARIO.find(x => x[0] === OB.horario);
    ME.entrada = { horario: OB.horario || null, desistir: OB.desistir || null, motivo: OB.motivo || null, futuro: OB.futuro || "", futuroData: OB.futuro ? today() : null, compromisso: OB.compromisso || today(), diasSem: OB.diasSem || null, entrou: today() };
    if(OB.diasSem && OB.diasSem.length && !ME.lembrete) ME.lembrete = { dias: OB.diasSem.slice(), hora: h ? h[4] : "19:00", antes: 20, celular: !!OB.avisos };
    ME.boasVindas = "mostrar";
  }catch(e){ console.warn(e); }
}
/* boas-vindas depois do plano: "{nome}, agora você faz parte do CK Life" com 3 ações */
function entBoasVindas(){
  if(!ME || ME.boasVindas !== "mostrar") return;
  ME.boasVindas = today(); save();
  if(ME.lembrete && ME.lembrete.celular && typeof sincLembrete === "function") setTimeout(() => sincLembrete(ME.lembrete), 2500);
  const d = document.createElement("div"); d.className = "ent-bv"; d.id = "ent-bv";
  d.innerHTML = `<div class="ent-bv-in"><div class="ent-burst">💚</div><h1>${entNome()}, agora você faz parte do CK Life. 💚</h1><p>Vamos construir isso juntas.</p>
    <button class="btn ent-cta" data-bv="treino">${ic("play", 18)} FAZER MEU PRIMEIRO TREINO</button>
    <button class="btn ent-sec" data-bv="comunidade">${ic("juntas", 18)} CONHECER A COMUNIDADE</button>
    <button class="btn ent-sec" data-bv="rotina">${ic("clock", 18)} DEFINIR MINHA ROTINA</button>
    <button class="link ent-pula" data-bv="x">Explorar o app</button></div>`;
  document.body.appendChild(d); SOM.done && SOM.done(); if(typeof confete === "function") confete(d);
  d.querySelectorAll("[data-bv]").forEach(b => b.onclick = () => { const a = b.dataset.bv; d.remove();
    if(a === "treino") abrirTreinoPreview(treinoDoDia()); else if(a === "comunidade") tab("juntas"); else if(a === "rotina") editaLembrete(); });
}
const abrirAppEnt = abrirApp; abrirApp = function(){
  if(ME && !ME.admin && ME.perfil && ME.perfil.local && !ME.entrada && !OB){ return entVeterana(); }
  const r = abrirAppEnt.apply(this, arguments); setTimeout(entBoasVindas, 500); return r; };
