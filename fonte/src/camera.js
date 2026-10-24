/* ===================== CÂMERA QUE CONTA REPETIÇÕES =====================
   Reconhecimento de corpo (MediaPipe Pose, Apache-2.0) rodando 100% no celular da aluna.
   Os arquivos ficam no próprio site (pasta ml/) e só são baixados quando ela liga a câmera.
   Nenhuma imagem é gravada, salva ou enviada. Conta repetições por ângulos das articulações
   e dá dicas simples de postura. Não é avaliação profissional. */

/* tipo de movimento de cada exercício: [tipo, posição da câmera] */
const CAM_EX = {
  agacho: ["agacho", "frente"], sumocasa: ["agacho", "frente"], agachsalto: ["agacho", "frente"], wallsit: null,
  afundocasa: ["afundo", "lado"], bulgarocasa: ["afundo", "lado"],
  ponte: ["ponte", "lado"], pontealt: ["ponte", "lado"], elevpelv: ["ponte", "lado"],
  flexao: ["flexao", "lado"], flexjoelho: ["flexao", "lado"], flexinc: ["flexao", "lado"], flexdiam: ["flexao", "lado"],
  polichinelo: ["poli", "frente"]
};
/* liga/desliga: o painel (Módulos do app → Câmera nos treinos) e cada aluna no Perfil */
const camLiberada = () => modOn("camera") && !(ME && ME.camOff);
const camTipo = id => camLiberada() ? CAM_EX[id] || null : null;
const L_ = { nariz: 0, oE: 11, oD: 12, coE: 13, coD: 14, puE: 15, puD: 16, qE: 23, qD: 24, jE: 25, jD: 26, tE: 27, tD: 28 };
const CAM = { on: false, stream: null, video: null, det: null, carregando: null, raf: 0, ts: 0, estado: "pos", n: 0, fase: "cima", ema: null, ext: null, ultimaDica: 0, okDesde: 0, alvo: 0, tipo: null, lado: null, onRep: null, falhou: false };

/* ---------- geometria ---------- */
function angulo(a, b, c){ // ângulo ABC em graus
  const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
  const d = Math.hypot(...v1) * Math.hypot(...v2); if(!d) return 180;
  return Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))) * 180 / Math.PI;
}
const vis = (p, ...k) => k.every(i => p[i] && (p[i].visibility == null || p[i].visibility > .5));
const ladoMelhor = (p, e, d) => ((p[e] && p[e].visibility) || 0) >= ((p[d] && p[d].visibility) || 0) ? "E" : "D";
const inclinacao = (o, q) => Math.abs(Math.atan2(o.x - q.x, q.y - o.y) * 180 / Math.PI); // 0 = tronco em pé

/* ---------- regras de cada movimento ----------
   medida(p) → { v: valor, ok: corpo visível, dica?: texto }
   baixo/alto: limites com folga (histerese) para não contar tremidinha */
const CAM_REGRAS = {
  agacho: { baixo: 110, alto: 155, quase: 132, txtQuase: "Desce um pouco mais",
    precisa: [L_.qE, L_.qD, L_.jE, L_.jD, L_.tE, L_.tD],
    medida(p){ const a = (angulo(p[L_.qE], p[L_.jE], p[L_.tE]) + angulo(p[L_.qD], p[L_.jD], p[L_.tD])) / 2; let dica = "";
      const jx = Math.abs(p[L_.jE].x - p[L_.jD].x), tx = Math.abs(p[L_.tE].x - p[L_.tD].x);
      if(a < 125 && tx > .05 && jx < tx * .72) dica = "Joelhos para fora";
      else if(a < 125 && vis(p, L_.oE, L_.oD) && inclinacao({ x: (p[L_.oE].x + p[L_.oD].x) / 2, y: (p[L_.oE].y + p[L_.oD].y) / 2 }, { x: (p[L_.qE].x + p[L_.qD].x) / 2, y: (p[L_.qE].y + p[L_.qD].y) / 2 }) > 48) dica = "Peito aberto, olhar à frente";
      return { v: a, dica }; } },
  afundo: { baixo: 112, alto: 150, quase: 130, txtQuase: "Desce mais um pouco, joelho de trás perto do chão",
    precisa: [L_.qE, L_.qD, L_.jE, L_.jD, L_.tE, L_.tD],
    medida(p){ const a = Math.min(angulo(p[L_.qE], p[L_.jE], p[L_.tE]), angulo(p[L_.qD], p[L_.jD], p[L_.tD])); let dica = "";
      const s = ladoMelhor(p, L_.oE, L_.oD), o = p[s === "E" ? L_.oE : L_.oD], q = p[s === "E" ? L_.qE : L_.qD];
      if(a < 130 && o && q && inclinacao(o, q) > 30) dica = "Tronco reto";
      return { v: a, dica }; } },
  // ponte: valor = 180 - ângulo ombro-quadril-joelho (quadril no alto = valor pequeno), mesma lógica dos outros
  ponte: { baixo: 26, alto: 45, quase: 37, txtQuase: "Sobe o quadril um pouco mais",
    precisa: null,
    medida(p){ // usa a perna apoiada no chão (tornozelo mais baixo na imagem): na ponte com uma perna, a outra fica no alto
      const s = p[L_.tE] && p[L_.tD] ? (p[L_.tE].y >= p[L_.tD].y ? "E" : "D") : ladoMelhor(p, L_.qE, L_.qD), o = p[s === "E" ? L_.oE : L_.oD], q = p[s === "E" ? L_.qE : L_.qD], j = p[s === "E" ? L_.jE : L_.jD];
      if(!vis(p, s === "E" ? L_.oE : L_.oD, s === "E" ? L_.qE : L_.qD, s === "E" ? L_.jE : L_.jD)) return { v: null };
      return { v: 180 - angulo(o, q, j), dica: "" }; } },
  flexao: { baixo: 100, alto: 145, quase: 120, txtQuase: "Desce o peito mais perto do chão",
    precisa: null,
    medida(p){ const s = ladoMelhor(p, L_.oE, L_.oD), k = s === "E" ? [L_.oE, L_.coE, L_.puE, L_.qE, L_.jE, L_.tE] : [L_.oD, L_.coD, L_.puD, L_.qD, L_.jD, L_.tD];
      if(!vis(p, k[0], k[1], k[2], k[3])) return { v: null };
      const a = angulo(p[k[0]], p[k[1]], p[k[2]]); let dica = "";
      const pe = vis(p, k[5]) ? p[k[5]] : vis(p, k[4]) ? p[k[4]] : null;
      if(pe && angulo(p[k[0]], p[k[3]], pe) < 150) dica = "Alinhe o quadril com o corpo";
      return { v: a, dica }; } },
  // polichinelo: 100 = fechado, 0 = aberto (aberto conta como "embaixo")
  poli: { baixo: 30, alto: 65, quase: 52, txtQuase: "Abre mais os braços e as pernas",
    precisa: [L_.oE, L_.oD, L_.qE, L_.qD, L_.puE, L_.puD, L_.tE, L_.tD],
    medida(p){ // braços: altura dos punhos em relação aos ombros, medida pelo tamanho do tronco; pernas: abertura dos pés pela largura do quadril
      const oy = (p[L_.oE].y + p[L_.oD].y) / 2, qy = (p[L_.qE].y + p[L_.qD].y) / 2, tronco = Math.abs(qy - oy) || .2, qw = Math.abs(p[L_.qE].x - p[L_.qD].x) || .08;
      const bracos = Math.max(0, Math.min(1, (oy - (p[L_.puE].y + p[L_.puD].y) / 2) / tronco + .5));
      const pernas = Math.max(0, Math.min(1, (Math.abs(p[L_.tE].x - p[L_.tD].x) / qw - 2.4) / 1.2)); // em pé normal ≈ 2,2 · aberto ≈ 3,8
      return { v: 100 - 100 * (bracos * .5 + pernas * .5), dica: "" }; } }
};

/* ---------- carregar o reconhecimento (uma vez) ---------- */
async function camCarrega(){
  if(CAM.det) return CAM.det;
  if(CAM.carregando) return CAM.carregando;
  CAM.carregando = (async () => {
    const base = new URL("ml/", document.baseURI).href;
    const mp = await import(base + "vision_bundle.mjs");
    const fs = await mp.FilesetResolver.forVisionTasks(base + "wasm");
    const cria = delegate => mp.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: base + "pose_landmarker_lite.task", delegate }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: .5, minTrackingConfidence: .5 });
    try{ CAM.det = await cria("GPU"); }catch(e){ CAM.det = await cria("CPU"); }
    return CAM.det;
  })();
  try{ return await CAM.carregando; }catch(e){ CAM.carregando = null; throw e; }
}

/* ---------- contagem ---------- */
function camReset(tipo, alvo){ Object.assign(CAM, { tipo, alvo, n: 0, fase: "cima", ema: null, ext: null, estado: "pos", okDesde: 0 }); }
function camDica(t, forte){ const agora = Date.now(); if(!forte && agora - CAM.ultimaDica < 3500) return; CAM.ultimaDica = agora; const el = $("cam-dica"); if(el){ el.textContent = t; el.classList.remove("pisca"); void el.offsetWidth; el.classList.add("pisca"); } falar(t); }
function camProcessa(p){
  const R = CAM_REGRAS[CAM.tipo]; if(!R) return;
  const precisa = R.precisa || [];
  const m = (R.precisa && !vis(p, ...precisa)) ? { v: null } : R.medida(p);
  const st = $("cam-st");
  if(m.v == null){ // corpo fora do quadro
    CAM.okDesde = 0; if(CAM.estado !== "pos"){ CAM.estado = "pos"; }
    if(st) st.textContent = CAM_EX_POS();
    if(Date.now() - CAM.ultimaDica > 7000) camDica(CAM_EX_POS(), true);
    return;
  }
  if(CAM.estado === "pos"){ if(!CAM.okDesde) CAM.okDesde = Date.now(); if(Date.now() - CAM.okDesde > 900){ CAM.estado = "conta"; if(st) st.textContent = "Te vi! Pode começar 💪"; camDica("Te vi! Pode começar.", true); } return; }
  // suaviza (para todos: valor alto = posição inicial, valor baixo = fundo do movimento)
  let v = m.v; const baixo = R.baixo, alto = R.alto, quase = R.quase;
  CAM.ema = CAM.ema == null ? v : CAM.ema * .55 + v * .45; v = CAM.ema;
  if(CAM.fase === "cima"){
    CAM.ext = CAM.ext == null ? v : Math.min(CAM.ext, v);
    if(v < baixo){ CAM.fase = "baixo"; }
    else if(CAM.ext < quase && v > alto - 4 && CAM.ext > baixo){ camDica(R.txtQuase); CAM.ext = null; } // foi quase e voltou
  } else if(v > alto){ // completou: desceu e subiu
    CAM.fase = "cima"; CAM.ext = null; CAM.n++;
    SOM.tap && SOM.tap(); vibra(25);
    if(CAM.onRep) CAM.onRep(CAM.n);
    if(CAM.n < CAM.alvo){ if(!m.dica) falar(String(CAM.n)); }
  }
  if(m.dica && CAM.fase === "baixo") camDica(m.dica);
  const bar = $("cam-bar"); if(bar){ const f = Math.max(0, Math.min(1, (alto - v) / Math.max(1, alto - baixo))); bar.style.height = (f * 100) + "%"; }
}
const CAM_EX_POS = () => CAM.tipo && camLadoTxt() ? `Afaste o celular: preciso ver seu corpo inteiro${camLadoTxt()}` : "Afaste o celular: preciso ver seu corpo inteiro";
function camLadoTxt(){ const t = PL && PL.T && PL.T.steps[PL.i] && camTipo(PL.T.steps[PL.i].id); return t && t[1] === "lado" ? ", de lado para a câmera" : ""; }

/* ---------- desenho do esqueleto ---------- */
const OSSOS = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
function camDesenha(p){
  const c = $("cam-cv"), v = CAM.video; if(!c || !v) return;
  const w = c.clientWidth, h = c.clientHeight; if(c.width !== w) c.width = w; if(c.height !== h) c.height = h;
  const x = c.getContext("2d"); x.clearRect(0, 0, w, h); if(!p) return;
  // vídeo em "cover": calcula recorte para alinhar os pontos com a imagem
  const vw = v.videoWidth || 1, vh = v.videoHeight || 1, esc2 = Math.max(w / vw, h / vh), ox = (w - vw * esc2) / 2, oy = (h - vh * esc2) / 2;
  const P = i => ({ x: w - (p[i].x * vw * esc2 + ox), y: p[i].y * vh * esc2 + oy }); // espelhado
  x.lineWidth = 5; x.lineCap = "round"; x.strokeStyle = "rgba(61,220,110,.9)";
  OSSOS.forEach(([a, b]) => { if(vis(p, a, b)){ const A = P(a), B = P(b); x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke(); } });
  x.fillStyle = "#fff"; [11,12,13,14,15,16,23,24,25,26,27,28].forEach(i => { if(vis(p, i)){ const A = P(i); x.beginPath(); x.arc(A.x, A.y, 5, 0, 7); x.fill(); } });
}

/* ---------- laço de vídeo ---------- */
function camLoop(){
  if(!CAM.on || !CAM.video || !CAM.det) return;
  const v = CAM.video;
  if(v.readyState >= 2){
    const t = performance.now(); if(t <= CAM.ts) { CAM.raf = requestAnimationFrame(camLoop); return; } CAM.ts = t;
    try{ const r = CAM.det.detectForVideo(v, t), p = r && r.landmarks && r.landmarks[0]; camDesenha(p); if(p) camProcessa(p); else camProcessa([]); }catch(e){ console.warn(e); }
  }
  CAM.raf = requestAnimationFrame(camLoop);
}
async function camAbre(){
  if(CAM.stream) return true;
  if(!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)){ toast("Este aparelho não deixa usar a câmera aqui."); return false; }
  try{ CAM.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }); return true; }
  catch(e){ toast(/NotAllowed|Permission/i.test(e && e.name) ? "Sem permissão para a câmera. Libere nas configurações do navegador." : "Não consegui abrir a câmera."); return false; }
}
function camFecha(){
  CAM.on = false; cancelAnimationFrame(CAM.raf);
  if(CAM.stream){ CAM.stream.getTracks().forEach(t => t.stop()); CAM.stream = null; }
  if(CAM.video){ CAM.video.srcObject = null; } CAM.video = null;
  const o = $("cam-ov"); if(o) o.remove();
}

/* ---------- integração com o player do treino ---------- */
function camMonta(s){
  const t = camTipo(s.id); const stage = $("pl-stage"); if(!t || !stage) return;
  window.BONECO.stop();
  stage.insertAdjacentHTML("afterend", `<div class="cam-ov" id="cam-ov"><video id="cam-v" playsinline muted autoplay></video><canvas id="cam-cv"></canvas>
    <div class="cam-top"><span class="cam-st" id="cam-st">Abrindo a câmera…</span><button class="iconbtn sm cam-x" id="cam-x" aria-label="Desligar câmera">${ic("close", 16)}</button></div>
    <div class="cam-meter"><i id="cam-bar"></i></div><p class="cam-dica" id="cam-dica"></p></div>`);
  $("cam-x").onclick = () => { PL.cam = false; camFecha(); desenhaPlay(); };
  camReset(t[0], s.val);
  CAM.onRep = n => { const r = $("pl-rep"), pg = $("pl-prog"); if(r) r.textContent = Math.min(n, s.val); if(pg) pg.style.width = (100 * Math.min(n, s.val) / s.val) + "%";
    if(n === s.val){ SOM.chime && SOM.chime(); vibra([60, 40, 120]); falar(sorteia(["Isso! Todas as repetições feitas!", "Arrasou! Repetições completas.", "Perfeito, meta batida!"])); const mn = $("pl-main"); if(mn) mn.classList.add("pulsa"); setTimeout(() => { if(PL && PL.fase === "ex" && PL.T.steps[PL.i] === s) proximaFase(); }, 1600); } };
  const st = $("cam-st");
  (async () => {
    if(!(await camAbre())){ PL.cam = false; camFecha(); return; }
    const v = $("cam-v"); if(!v) return camFecha(); v.srcObject = CAM.stream; CAM.video = v; try{ await v.play(); }catch(e){}
    if(st) st.textContent = CAM.det ? "Posicione-se" : "Preparando o reconhecimento… (só na primeira vez)";
    try{ await camCarrega(); }catch(e){ console.warn(e); if(st) st.textContent = "Não consegui carregar o reconhecimento. Conte no ✓."; return; }
    if(!$("cam-ov")) return;
    if(st) st.textContent = CAM_EX_POS();
    falar(t[1] === "lado" ? "Apoie o celular e fique de lado para a câmera, com o corpo inteiro aparecendo." : "Apoie o celular a uns dois passos, com o corpo inteiro aparecendo.");
    CAM.on = true; CAM.raf = requestAnimationFrame(camLoop);
  })();
}
/* botão no exercício + religa sozinho no próximo exercício compatível */
const desenhaPlayCam = desenhaPlay; desenhaPlay = function(){
  const r = desenhaPlayCam.apply(this, arguments);
  try{
    if(!PL || PL.fase !== "ex"){ if(CAM.stream && PL && PL.fase !== "ex") { CAM.on = false; cancelAnimationFrame(CAM.raf); const o = $("cam-ov"); if(o) o.remove(); } return r; }
    const s = PL.T.steps[PL.i], t = s.modo === "r" && camTipo(s.id);
    const bot = document.querySelector("#play .pbot");
    if(!t){ if(CAM.stream) camFecha(); return r; } // exercício sem contagem pela câmera: desliga (economiza bateria); religa no próximo compatível
    if(PL.cam){ camMonta(s); const h = document.querySelector("#play .phint"); if(h) h.textContent = "A câmera está contando. Se preferir, toque no ✓."; }
    else if(bot && !$("cam-bt")){ const h = bot.querySelector(".phint"); (h || bot).insertAdjacentHTML(h ? "beforebegin" : "beforeend", `<button class="cam-bt" id="cam-bt">${ic("camera", 18)} Contar com a câmera <i class="xp-novo">Novo</i></button>`);
      $("cam-bt").onclick = () => { if(!ME.camOk){ camAviso(() => { ME.camOk = true; save(); PL.cam = true; desenhaPlay(); }); return; } PL.cam = true; desenhaPlay(); }; }
  }catch(e){ console.warn(e); }
  return r;
};
function camAviso(ok){
  sheet("Contar com a câmera", `<div class="cam-av">${ic("camera", 34, 1.6)}<p><b>A câmera conta suas repetições e dá dicas de postura.</b></p>
    <ul class="ing"><li>Apoie o celular no chão ou numa mesa, a uns <b>2 passos</b> de você.</li><li>Seu <b>corpo inteiro</b> precisa aparecer. Em flexão e ponte, fique <b>de lado</b>.</li><li>Lugar bem iluminado ajuda muito.</li></ul>
    <p class="hint">${ic("lock", 13)} Tudo acontece só no seu celular: nenhuma imagem é gravada, salva ou enviada. As dicas são automáticas e não substituem um profissional. Sentiu dor, pare.</p></div>
    <button class="btn btn-accent btn-block btn-lg" id="cam-ok">${ic("camera", 18)} Ligar a câmera</button>`);
  $("cam-ok").onclick = () => { fecharSheet(); ok(); };
}
/* sair do treino ou terminar: desliga a câmera */
const fimTreinoCam = fimTreino; fimTreino = function(){ camFecha(); return fimTreinoCam.apply(this, arguments); };
if(typeof sairTreino === "function"){ const sairCam = sairTreino; sairTreino = function(){ camFecha(); return sairCam.apply(this, arguments); }; }
if(typeof fimPlay === "function"){ const fimPlayCam = fimPlay; fimPlay = function(){ camFecha(); return fimPlayCam.apply(this, arguments); }; }
document.addEventListener("visibilitychange", () => { if(document.hidden && CAM.stream){ PL && (PL.cam = false); camFecha(); } });

/* teste interno: analisa fotos uma a uma (sem câmera) e passa pela mesma lógica de contagem */
window.CKCAM = { async testar(urls, id){ const t = camTipo(id); if(!t) return "sem regra"; await camCarrega();
  if(!CAM.detImg){ const base = new URL("ml/", document.baseURI).href, mp = await import(base + "vision_bundle.mjs"), fs = await mp.FilesetResolver.forVisionTasks(base + "wasm");
    CAM.detImg = await mp.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: base + "pose_landmarker_lite.task", delegate: "CPU" }, runningMode: "IMAGE", numPoses: 1 }); }
  camReset(t[0], 99); const out = [];
  for(const u of urls){ const im = new Image(); im.src = u; await im.decode(); const p = (CAM.detImg.detect(im).landmarks || [])[0];
    if(!p){ out.push(u.split("/").pop() + " → nada"); continue; }
    const m = CAM_REGRAS[t[0]].medida(p); out.push(u.split("/").pop() + " → " + (m.v == null ? "sem corpo" : Math.round(m.v)) + (m.dica ? " (" + m.dica + ")" : ""));
    for(let k = 0; k < 6; k++){ CAM.estado = "conta"; camProcessa(p); } }
  return { reps: CAM.n, leituras: out }; } };

/* Perfil: chave "Câmera nos treinos" */
const rPerfilCam = rPerfil; rPerfil = function(){ const r = rPerfilCam.apply(this, arguments);
  if(!modOn("camera") || $("p-cam")) return r; const ref = $("p-somn") || $("p-push"); if(!ref) return r;
  const on = !ME.camOff; ref.insertAdjacentHTML("afterend", setRow("p-cam", "camera", "Câmera nos treinos", on ? "Botão para contar repetições pela câmera" : "Desligada", sw(on)));
  $("p-cam").onclick = () => { ME.camOff = !ME.camOff; save(); SOM.tap && SOM.tap(); toast(ME.camOff ? "Câmera desligada nos treinos" : "Câmera ligada: o botão aparece nos exercícios compatíveis"); rPerfil(); };
  return r; };
