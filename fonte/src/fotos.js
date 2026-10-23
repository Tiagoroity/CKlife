/* CK Life · fotos reais da Maya no lugar do boneco.
   Cada exercício procura img/ex-<foto>.jpg. Para colocar foto num exercício novo,
   basta salvar img/ex-<id do exercício>.jpg (ex.: img/ex-sumocasa.jpg). */
(function(){
const B = window.BONECO, X = B._;
// exercícios que usam a foto de outro bem parecido
const FOTO = { agachsalto: "agacho", afundo: "afundocasa", pontealt: "ponte", elevpelv: "ponte" };
B.fotoDe = e => {
  if(!e) return "";
  if(e.foto) return e.foto;
  return `img/ex-${FOTO[e.id] || e.id}.jpg`;
};
const inicial = e => esc2((e && e.nome || "").split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join("").toUpperCase());
function esc2(s){ return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
// sem foto ainda: cartão verde da marca com as iniciais do exercício
const FALHA = "this.parentNode&&this.parentNode.classList.add('semfoto');this.remove()";
B.thumb = e => `<span class="fx" data-i="${inicial(e)}"><img src="${B.fotoDe(e)}" alt="" loading="lazy" onerror="${FALHA}"></span>`;

let ATIVO = null;
B.mount = (host, e, opt = {}) => {
  if(ATIVO) ATIVO.stop();
  const inf = B.info(e), pat = X.PAT[inf.anim] || X.PAT.agacho, dur = pat.dur || 3;
  host.innerHTML = `<div class="fx-stage" data-i="${inicial(e)}"><img src="${B.fotoDe(e)}" alt="${esc2(e.nome)}" onerror="${FALHA}"></div>`;
  const stage = host.firstChild, im = stage.querySelector("img");
  // foto deitada (horizontal): mostra inteira, com fundo desfocado da própria foto
  const larga = () => { if(im.naturalWidth > im.naturalHeight * 1.1){ stage.classList.add("larga"); stage.style.setProperty("--bg", `url("${im.src}")`); } };
  if(im.complete && im.naturalWidth) larga(); else im.addEventListener("load", larga);
  const st = { playing: !opt.paused, speed: 1, t: 0, last: performance.now(), rep: 1, half: 0, dead: false, cue: "" };
  stage.classList.toggle("pausado", !st.playing);
  const tick = () => {
    if(st.dead) return;
    if(!host.isConnected){ api.stop(); return; }
    const now = performance.now(), dt = Math.min(.25, (now - st.last) / 1000); st.last = now;
    if(st.playing){
      st.t += dt * st.speed;
      st.rep = Math.floor(st.t / dur) + 1;
      const half = Math.floor(st.t / (dur / 2));
      if(half !== st.half){ st.half = half; if(opt.onBeat) opt.onBeat(half % 2); }
    }
    const cue = X.frame(inf.anim, (st.t / dur) % 1, "f").cue || "";
    if(opt.onFrame) opt.onFrame({ cue, rep: st.rep });
  };
  const int = setInterval(tick, 100); tick();
  const api = {
    stop(){ if(st.dead) return; st.dead = true; clearInterval(int); if(ATIVO === api) ATIVO = null; },
    toggle(){ st.playing = !st.playing; st.last = performance.now(); stage.classList.toggle("pausado", !st.playing); return st.playing; },
    setSexo(){}, setSpeed(v){ st.speed = v; stage.style.setProperty("--vel", 1 / v); },
    get playing(){ return st.playing; }, get rep(){ return st.rep; }
  };
  ATIVO = api;
  return api;
};
const stop0 = B.stop;
B.stop = () => { if(ATIVO) ATIVO.stop(); stop0 && stop0(); };
})();
