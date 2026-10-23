/* Sons do app, gerados na hora (sem arquivos de áudio). */
(function(){
"use strict";
let ctx = null, master = null, busy = 0;
let on = true; try{ on = localStorage.getItem("cklife_som") !== "0"; }catch(e){}
function ac(){
  if(!ctx){ try{ ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = .55; master.connect(ctx.destination); }catch(e){ return null; } }
  if(ctx.state === "suspended") ctx.resume();
  return ctx;
}
function tone(f, t0, dur, o = {}){
  const c = ac(); if(!c) return;
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || "sine"; osc.frequency.setValueAtTime(f, t0);
  if(o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, f * o.slide), t0 + dur);
  g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(o.vol || .2, t0 + (o.a || .006)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  osc.connect(g); g.connect(master); osc.start(t0); osc.stop(t0 + dur + .05);
}
function bell(f, vol, dur, t){
  [[1, 1], [2, .5], [2.76, .32], [5.4, .16], [8.93, .07], [.5, .22]].forEach(([m, v]) => tone(f * m, t, dur * (m < 1 ? 1.15 : 1 / Math.sqrt(m)), { vol: vol * v, a: .002 }));
}
function noise(t, dur, vol, f1, f2){
  const c = ac(); if(!c) return;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0);
  for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; bp.type = "bandpass"; bp.Q.value = 1.2; bp.frequency.setValueAtTime(f1, t); bp.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .3); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + dur);
}
const play = fn => () => { busy = performance.now(); if(!on) return; const c = ac(); if(!c) return; try{ fn(c.currentTime + .01); }catch(e){} };
const S = {
  tap: play(t => tone(1250, t, .045, { type: "triangle", vol: .06 })),
  add: play(t => { tone(660, t, .12, { vol: .14 }); tone(990, t + .07, .2, { vol: .14 }); }),
  remove: play(t => tone(460, t, .14, { type: "triangle", vol: .1, slide: .55 })),
  water: play(t => { tone(280, t, .13, { vol: .2, slide: 2.6 }); tone(520, t + .09, .09, { vol: .08, slide: 1.8 }); }),
  check: play(t => { tone(880, t, .07, { type: "square", vol: .04 }); tone(1320, t + .05, .16, { vol: .12 }); }),
  bell: play(t => bell(784, .38, 2.6, t)),
  restStart: play(t => bell(1046, .16, 1.2, t)),
  tick: play(t => tone(1000, t, .06, { type: "square", vol: .05 })),
  restEnd: play(t => { [0, .2, .4].forEach(d => bell(1318, .26, 1, t + d)); }),
  done: play(t => { [523, 659, 784].forEach((f, i) => tone(f, t + i * .11, .22, { type: "triangle", vol: .14 })); tone(1046, t + .33, .7, { type: "triangle", vol: .16 }); bell(1046, .14, 1.8, t + .33); }),
  coupon: play(t => [1318, 1568, 1976, 2637, 3136].forEach((f, i) => tone(f, t + i * .055, .25, { vol: .07 }))),
  erro: play(t => { tone(230, t, .16, { type: "sawtooth", vol: .05, slide: .8 }); tone(180, t + .12, .2, { type: "sawtooth", vol: .05, slide: .8 }); }),
  swoosh: play(t => noise(t, .32, .09, 400, 3200)),
  /* assinatura sonora do CK Life para notificações: duas notas de sino, sobe e assenta (curta e suave) */
  notif: play(t => { bell(1046.5, .13, 1.0, t); bell(1567.98, .11, 1.25, t + .12); tone(3135.96, t + .12, .35, { vol: .018 }); }),
  chime: play(t => [784, 988, 1318].forEach((f, i) => bell(f, .12, 1.2, t + i * .12))),
  fav: play(t => [1568, 2093].forEach((f, i) => tone(f, t + i * .07, .2, { vol: .08 }))),
  beat: play(t => tone(1600, t, .03, { type: "square", vol: .045 })),
  beat2: play(t => tone(1150, t, .03, { type: "square", vol: .04 })),
  get on(){ return on; },
  set on(v){ on = !!v; try{ localStorage.setItem("cklife_som", on ? "1" : "0"); }catch(e){} }
};
/* Clique leve em botões que não têm som próprio */
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest("button, a.btn, [role=tab], .chip, .opt");
  if(!el || el.dataset.mudo != null) return;
  const t0 = performance.now();
  setTimeout(() => { if(busy < t0) S.tap(); }, 0);
}, true);
window.SOM = S;
})();
