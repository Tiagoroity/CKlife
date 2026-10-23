
/* ===================== TREINO: EXPLICAÇÃO POR VOZ ANTES DE CADA EXERCÍCIO =====================
   Fluxo: EXERCÍCIO → explicação (voz + texto) → REPETIR ou INICIAR → 3, 2, 1, VAI! → execução → descanso → próximo exercício → nova explicação.
   Nenhum cronômetro, contagem ou repetição começa antes de ela tocar em Iniciar (no modo "Sempre explicar").
   O texto vem do catálogo do exercício (passos, respiração, erros comuns, segurança) ou do texto revisado no Admin — nunca de IA. */
const CFGV = () => Object.assign({ ativo: true, idioma: "pt-BR", velocidade: 1, modo: "sempre", contagem: 3, permitir_pular: true }, DB.config.treinoVoz || {}, ENT.cfgVoz || {});
const modoExpl = () => (ME && ME.vozExpl) || CFGV().modo || "sempre";
const minuscula = t => t ? t.charAt(0).toLowerCase() + t.slice(1) : "";
const ponto = t => String(t || "").trim().replace(/[.!?]?$/, ".");
function textoExplicacao(e){
  if(e.voz && String(e.voz).trim()) return String(e.voz).trim();
  const partes = [ponto(e.nome), (e.passos || []).map(ponto).join(" ")];
  if(e.resp) partes.push(ponto(e.resp));
  if((e.erros || []).length) partes.push("Evite: " + e.erros.map(x => minuscula(x).replace(/\.$/, "")).join("; ") + ".");
  partes.push(ponto(e.seguranca || "Se sentir dor aguda, interrompa o exercício"));
  return partes.filter(Boolean).join(" ");
}
function precisaExplicar(e){
  const m = modoExpl(); if(m === "off") return false;
  if(m === "primeira") return !(ME.exVistos || []).includes(e.id);
  return true;
}
function entraExercicio(i){
  if(!PL) return;
  calar(); PL.i = i; PL.token = (PL.token || 0) + 1;
  const e = exById(PL.T.steps[i].id);
  if(!precisaExplicar(e)) return contagem();
  PL.fase = "expl"; PL.rem = 0; PL.expl = { estado: "falando", rep: 0 };
  desenhaPlay(); explica(false);
}
function explica(repetir){
  if(!PL || PL.fase !== "expl") return;
  const e = exById(PL.T.steps[PL.i].id), tk = PL.token, txt = textoExplicacao(e);
  registraEvento(repetir ? "exercise_explanation_repeated" : "exercise_explanation_started", { exercicio: e.id });
  PL.expl = { estado: "falando", rep: (PL.expl.rep || 0) + (repetir ? 1 : 0) }; atualizaExpl();
  const vozOk = VOZ.ok && ME.voz !== false && CFGV().ativo !== false;
  if(!vozOk){ PL.expl.estado = ME.voz === false || CFGV().ativo === false ? "texto" : "falhou"; return atualizaExpl(); }
  if(!ME.vozVel) ME.vozVel = CFGV().velocidade || 1;
  let comecou = false;
  const fim = () => { if(!PL || PL.token !== tk || PL.fase !== "expl") return; PL.expl.estado = "ok"; ME.exVistos = [...new Set([...(ME.exVistos || []), e.id])].slice(-200); save(); registraEvento("exercise_explanation_completed", { exercicio: e.id }); atualizaExpl(); };
  falar(txt, fim);
  setTimeout(() => { try{ comecou = speechSynthesis.speaking || speechSynthesis.pending; }catch(er){} if(!comecou && PL && PL.token === tk && PL.fase === "expl" && PL.expl.estado === "falando"){ calar(); PL.expl.estado = "falhou"; atualizaExpl(); } }, 2500);
}
function contagem(){
  if(!PL) return; calar();
  PL.fase = "cont"; PL.rem = Math.max(1, +CFGV().contagem || 3); PL.token = (PL.token || 0) + 1;
  desenhaPlay(); SOM.tick && SOM.tick(); falar(String(PL.rem));
}
/* tela de explicação */
function atualizaExpl(){
  const st = $("pl-ex-st"), bt = $("pl-ex-bt"); if(!st || !bt || !PL || PL.fase !== "expl") return;
  const s = PL.expl.estado, pular = CFGV().permitir_pular !== false;
  st.className = "ex-st " + s;
  st.innerHTML = s === "falando" ? `<i class="ex-onda"><b></b><b></b><b></b></i> Explicando…` : s === "ok" ? "✓ Explicação concluída" : s === "texto" ? "Leia como fazer" : "Não conseguimos reproduzir a explicação por voz. Leia abaixo.";
  bt.innerHTML = s === "falando" ? (pular ? `<button class="btn btn-line btn-block" id="pl-ja">Já sei fazer — iniciar</button>` : "")
    : `<button class="btn btn-line" id="pl-rep">🔊 ${s === "falhou" ? "Tentar novamente" : "Repetir explicação"}</button><button class="btn btn-accent btn-lg" id="pl-ini">Iniciar exercício</button>`;
  const ja = $("pl-ja"); if(ja) ja.onclick = () => { calar(); contagem(); };
  const rp = $("pl-rep"); if(rp) rp.onclick = () => { calar(); explica(true); };
  const ini = $("pl-ini"); if(ini) ini.onclick = () => { calar(); vibra(20); contagem(); };
}
const desenhaPlayV = desenhaPlay;
desenhaPlay = function(){
  if(!PL || (PL.fase !== "expl" && PL.fase !== "cont")){ desenhaPlayV.apply(this, arguments); const pv = $("pl-prev"); if(pv && PL) pv.onclick = () => { if(PL.i > 0) entraExercicio(PL.i - 1); }; return; }
  const T = PL.T, s = T.steps[PL.i], e = exById(s.id);
  window.BONECO.stop();
  const head = `<div class="phd"><button class="iconbtn" id="pl-x" aria-label="Sair do treino">${ic("close", 20)}</button>${segsHtml()}<span class="num pcount"><span id="pl-tt">${mmss(Math.round((Date.now() - PL.ini) / 1000))}</span> · ${PL.i + 1}/${T.steps.length}</span></div>`;
  const meta = `${s.series > 1 ? s.series + " x " : ""}${s.modo === "t" ? s.val + " segundos" : s.val + " repetições"}`;
  if(PL.fase === "cont"){
    $("play").innerHTML = `<div class="pfull"><div class="stage" id="pl-stage"></div><div class="pgrad"></div>${head}<div class="pcont"><small>${esc(e.nome)} · ${meta}</small><b class="num" id="pl-cnum">${PL.rem}</b></div></div>`;
    window.BONECO.mount($("pl-stage"), e, { paused: true });
  } else {
    $("play").innerHTML = `<div class="pexpl">${head}<div class="pex-top"><div class="stage" id="pl-stage"></div></div>
      <div class="pex-c"><span class="eyebrow">${PL.i === 0 ? "Primeiro exercício" : "Próximo exercício"} · Veja como fazer</span><h2>${esc(e.nome)}</h2><small class="psub">${meta}${e.grupo ? " · " + esc(e.grupo) : ""}</small>
        <p class="ex-st" id="pl-ex-st"></p>
        <div class="ex-txt"><ol>${(e.passos || []).map(p => `<li>${esc(p)}</li>`).join("")}</ol>
          ${e.resp ? `<p><b>Respiração:</b> ${esc(e.resp)}</p>` : ""}${(e.erros || []).length ? `<p><b>Evite:</b> ${e.erros.map(esc).join(" · ")}</p>` : ""}<p class="ex-seg">⚠️ ${esc(e.seguranca || "Se sentir dor aguda, interrompa o exercício.")}</p></div>
        <div class="ex-bt" id="pl-ex-bt"></div><button class="link ex-pula" id="pl-skip">Pular este exercício</button></div></div>`;
    window.BONECO.mount($("pl-stage"), e, {});
    $("pl-skip").onclick = () => { calar(); if(PL.i >= PL.T.steps.length - 1) return fimTreino(); entraExercicio(PL.i + 1); };
    atualizaExpl();
  }
  $("pl-x").onclick = sairTreino;
};
/* o relógio NÃO anda durante a explicação; a contagem 3-2-1 só depois de Iniciar */
relogio = function(){
  clearInterval(PL.int);
  PL.int = setInterval(() => {
    if(!PL || PL.pausa) return;
    if(PL.relogioParado){ PL.ini = Date.now(); } // o tempo de treino só conta a partir do primeiro "Iniciar"
    const tt = $("pl-tt"); if(tt) tt.textContent = mmss(Math.round((Date.now() - PL.ini) / 1000));
    if(PL.fase === "expl" || PL.fase === "fim") return;
    if(PL.fase === "cont"){ PL.rem--; const n = $("pl-cnum");
      if(PL.rem <= 0){ if(n) n.textContent = "VAI!"; falar("Vai!"); vibra(80); clearInterval(PL.int); setTimeout(() => { if(PL && PL.fase === "cont"){ relogio(); comecaExercicio(); } }, 700); return; }
      if(n){ n.textContent = PL.rem; n.classList.remove("pulso"); void n.offsetWidth; n.classList.add("pulso"); } SOM.tick && SOM.tick(); falar(String(PL.rem)); return; }
    const s = PL.T.steps[PL.i];
    if(PL.fase === "ex"){ PL.ativo++; PL.kcal += kcalDe(s, 1); }
    if(PL.fase === "ex" && s.modo === "r"){ atualizaPlay(); return; }
    PL.rem--;
    if(PL.rem <= 3 && PL.rem > 0){ SOM.tick(); if(PL.fase !== "ex") vibra(40); }
    if(PL.fase === "ex" && s.modo === "t" && PL.rem === Math.floor(s.val / 2) && s.val >= 30) falar("Metade. Continue!");
    if(PL.fase === "ex" && s.modo === "t" && PL.rem === 10 && s.val >= 25) falar("Faltam 10 segundos!");
    if(PL.rem <= 0){ proximaFase(); return; }
    atualizaPlay();
  }, 1000);
};
const comecaExercicioV = comecaExercicio;
comecaExercicio = function(){ if(PL.relogioParado){ PL.relogioParado = false; PL.ini = Date.now(); } registraEvento("exercise_started", { exercicio: PL.T.steps[PL.i].id }); return comecaExercicioV.apply(this, arguments); };
proximaFase = function(){
  if(!PL) return;
  if(PL.fase === "ex"){
    PL.feitos.add(PL.i); SOM.check();
    const s = PL.T.steps[PL.i];
    if(PL.i >= PL.T.steps.length - 1){ fimTreino(); return; }
    if(s.desc > 0){ PL.fase = "rest"; PL.rem = s.desc; const nx = PL.T.steps[PL.i + 1]; SOM.restStart(); falar(`Descanse. Próximo: ${exById(nx.id).nome}.`); desenhaPlay(); }
    else entraExercicio(PL.i + 1);
    return;
  }
  if(PL.fase === "rest" || PL.fase === "prep") entraExercicio(PL.fase === "prep" ? PL.i : PL.i + 1);
};
iniciaTreino = function(T){
  if(!T || !T.steps.length) return;
  window.BONECO.stop(); calar();
  PL = { T, i: 0, fase: "expl", rem: 0, ini: Date.now(), relogioParado: true, pausa: false, kcal: 0, ativo: 0, feitos: new Set(), int: null, token: 0, expl: { estado: "falando", rep: 0 } };
  $("play").hidden = false; document.body.style.overflow = "hidden"; telaAcesa(true);
  relogio(); entraExercicio(0);
};
/* saiu do app durante a explicação: para a voz e espera ela voltar (nunca começa sozinho) */
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden" && PL && PL.fase === "expl" && PL.expl && PL.expl.estado === "falando"){ calar(); PL.token++; PL.expl.estado = "ok"; atualizaExpl(); }
  if(document.visibilityState === "hidden" && PL && PL.fase === "cont"){ PL.fase = "expl"; PL.expl = { estado: "ok", rep: 0 }; calar(); desenhaPlay(); } });
/* configurações: explicação e velocidade */
const editaVozV = editaVoz;
editaVoz = function(){ editaVozV.apply(this, arguments); const b = $("sheet-body"); if(!b) return;
  const m = modoExpl(), v = ME.vozVel || CFGV().velocidade || 1;
  b.insertAdjacentHTML("afterbegin", `<div><h3 style="font-size:18px;margin-bottom:10px">Explicação antes dos exercícios</h3><div class="seg">${[["sempre", "Sempre"], ["primeira", "Só na 1ª vez"], ["off", "Desativada"]].map(([k, n]) => `<button data-xm="${k}" aria-pressed="${m === k}">${n}</button>`).join("")}</div>
    <p class="hint" style="margin:8px 0 0">A explicação também aparece escrita. Com "Desativada", o exercício começa direto com 3, 2, 1.</p></div>
    <div><h3 style="font-size:18px;margin-bottom:10px">Velocidade da voz</h3><div class="seg">${[[.8, "0,8x"], [1, "1x"], [1.2, "1,2x"]].map(([k, n]) => `<button data-xv="${k}" aria-pressed="${Math.abs(v - k) < .06}">${n}</button>`).join("")}</div></div>`);
  b.querySelectorAll("[data-xm]").forEach(x => x.onclick = () => { ME.vozExpl = x.dataset.xm; save(); b.querySelectorAll("[data-xm]").forEach(y => y.setAttribute("aria-pressed", y === x)); SOM.tap(); });
  b.querySelectorAll("[data-xv]").forEach(x => x.onclick = () => { ME.vozVel = +x.dataset.xv; save(); b.querySelectorAll("[data-xv]").forEach(y => y.setAttribute("aria-pressed", y === x)); falar("Assim fica a velocidade da voz."); });
  const velAntiga = b.querySelectorAll("[data-vel]"); if(velAntiga.length) velAntiga[0].closest("div").parentElement.remove();
};
window.CKVOZ = { texto: textoExplicacao };
