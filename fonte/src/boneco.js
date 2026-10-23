/* Bonequinho animado: mostra a execução de cada exercício e acende os músculos trabalhados.
   Coordenadas em metros "de boneco": chão em y = 0, y para cima, o boneco olha para +x. */
(function(){
"use strict";
const D = Math.PI / 180;
const L = { th:.45, sh:.44, to:.56, so:.52, ua:.31, fa:.29, nk:.06, hd:.105, ft:.13 };
const SEX = {
  m:{ to:.21, th:.13, sh:.1, ua:.088, fa:.07, sw:.36, ww:.27, hw:.26 },
  f:{ to:.175, th:.125, sh:.092, ua:.074, fa:.062, sw:.29, ww:.2, hw:.29 }
};
const SHW = { m: .2, f: .165 }, HPW = { m: .085, f: .095 };
const lerp = (a, b, t) => a + (b - a) * t;
const lp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = v => Math.hypot(v[0], v[1]);
const nrm = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
const dd = t => [Math.sin(t * D), -Math.cos(t * D)];      // membro: ângulo a partir de "para baixo", + = para frente
const ang = v => Math.atan2(v[0], -v[1]) / D;               // inverso de dd
const tang = v => Math.atan2(v[0], v[1]) / D;               // tronco: ângulo a partir de "para cima"
const tdir = phi => [Math.sin(phi * D), Math.cos(phi * D)];
const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function ik(a, t, l1, l2, s){
  let v = sub(t, a), d = len(v); const mx = l1 + l2 - 1e-3, mn = Math.abs(l1 - l2) + 1e-3;
  if(d > mx){ v = [v[0] * mx / d, v[1] * mx / d]; d = mx; }
  if(d < mn) d = mn;
  const c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), A = Math.acos(Math.max(-1, Math.min(1, c)));
  const b = Math.atan2(v[1], v[0]) + s * A;
  const j = [a[0] + l1 * Math.cos(b), a[1] + l1 * Math.sin(b)];
  return [j, add(j, nrm(sub(add(a, v), j)), l2)];
}

/* ---------- Pose -> articulações ---------- */
function solve(P, sexo){
  const v = P.view || "side", tl = P.tl || 1, hip = P.hip, phi = P.phi || 0;
  const td = tdir(phi), n = [Math.cos(phi * D), -Math.sin(phi * D)];
  const neck = add(hip, td, L.to * tl), sh = add(hip, td, L.so * tl), head = add(neck, td, L.nk + L.hd * .9);
  const J = { v, hip, neck, head, td, n, phi, kn: [], an: [], toe: [], el: [], ha: [] };
  if(v === "side"){ J.sh = [sh, sh]; J.hp = [hip, hip]; }
  else { const a = SHW[sexo] || .2, b = HPW[sexo] || .085; J.sh = [add(sh, n, a), add(sh, n, -a)]; J.hp = [add(hip, n, b), add(hip, n, -b)]; }
  const legs = [P.lN || P.l || {}, P.lF || (P.l ? { ...P.l, _m: 1 } : {})];
  legs.forEach((s, i) => {
    const root = J.hp[i], m = v === "side" ? 1 : (i === 0 ? 1 : -1);
    const mir = pt => (s._m && v !== "side") ? [2 * hip[0] - pt[0], pt[1]] : pt;
    let k, a;
    if(s.kn){ k = mir(s.kn); a = mir(s.a); }
    else if(s.a){ [k, a] = ik(root, mir(s.a), L.th, L.sh, (s.k == null ? 1 : s.k) * m); }
    else { k = add(root, dd((s.th || 0) * m), L.th); a = add(k, dd((s.sh || 0) * m), L.sh); }
    let toe;
    if(v === "side"){ const d = nrm(sub(a, k)); toe = add(a, rot([-d[1], d[0]], -(s.pe || 0) * D), L.ft); }
    else toe = add(a, [m * .055, -.02]);
    J.kn[i] = k; J.an[i] = a; J.toe[i] = toe;
  });
  const arms = [P.aN || P.a || {}, P.aF || (P.a ? { ...P.a, _m: 1 } : {})];
  arms.forEach((s, i) => {
    const root = J.sh[i], m = v === "side" ? 1 : (i === 0 ? 1 : -1);
    const mir = pt => (s._m && v !== "side") ? [2 * hip[0] - pt[0], pt[1]] : pt;
    let e, h, tgt = s.h;
    if(tgt === "hang") tgt = add(root, [0, -1], L.ua + L.fa - .02);
    else if(tgt === "head") tgt = add(add(head, td, .02), n, -.05);
    else if(tgt === "nape") tgt = add(add(neck, n, -.08), td, -.02);
    else if(tgt === "up") tgt = add(root, td, L.ua + L.fa - .02);
    else if(tgt === "cint") tgt = v === "side" ? add(add(hip, td, .12), n, .05) : add(add(hip, td, .12), n, (i ? -1 : 1) * .17);
    else if(tgt === "peito") tgt = v === "side" ? add(add(root, td, -.14), n, .16) : add(add(root, td, -.14), n, (i ? 1 : -1) * .05);
    else if(tgt === "pe") tgt = J.an[0];
    else if(tgt) tgt = mir(tgt);
    if(s.el){ e = mir(s.el); h = mir(s.h); }
    else if(tgt){ [e, h] = ik(root, tgt, L.ua, L.fa, (s.k == null ? (v === "side" ? -1 : 1) : s.k) * m); }
    else { e = add(root, dd((s.ua || 0) * m), L.ua); h = add(e, dd((s.fa || 0) * m), L.fa); }
    J.el[i] = e; J.ha[i] = h;
  });
  if(P.up){ const U = p => [p[0], p[1] + P.up]; ["hip","neck","head"].forEach(k => J[k] = U(J[k])); ["sh","hp","kn","an","toe","el","ha"].forEach(k => J[k] = J[k].map(U)); }
  J.P = P;
  return J;
}
function blend(A, B, t){
  const J = { ...A, P: t < .5 ? A.P : B.P };
  ["hip","neck","head"].forEach(k => J[k] = lp(A[k], B[k], t));
  ["sh","hp","kn","an","toe","el","ha"].forEach(k => J[k] = A[k].map((p, i) => lp(p, B[k][i], t)));
  J.td = nrm(lp(A.td, B.td, t)); J.n = nrm(lp(A.n, B.n, t)); J.phi = lerp(A.phi, B.phi, t);
  return J;
}

/* ---------- Peças de apoio ---------- */
const db = (J, w = [0, 1]) => w.flatMap(i => [{ c: J.ha[i], r: .062, f: "prop2", front: 1 }, { c: J.ha[i], r: .026, f: "prop", front: 1 }]);
const bar = J => { const c = lp(J.ha[0], J.ha[1], .5); return [{ c, r: .19, ring: .05, f: "prop2", front: 1 }, { c, r: .03, f: "prop2", front: 1 }]; };
const mat = () => [{ l: [[-1.05, .006], [1.05, .006]], w: .022, c: "mat" }];
const box = (x1, x2, y1, y2, c = "prop") => ({ p: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], c });
const cable = (a, b) => ({ l: [a, b], w: .01, c: "ink" });
const pulley = c => ({ c, r: .035, f: "prop2" });
const ST = .87;
const stand = (o = {}) => ({ hip: [0, ST], phi: 3, lN: { a: [.03, 0] }, lF: { a: [-.03, 0] }, aN: { h: "hang" }, aF: { h: "hang" }, ...o });
function plank(h, toeX){
  const A = [toeX, .06], body = L.th + L.sh - .02 + L.so;
  const sx = A[0] + Math.sqrt(Math.max(0, body * body - (h - A[1]) ** 2));
  const u = nrm(sub([sx, h], A)), hip = add(A, u, L.th + L.sh - .02), th = ang([-u[0], -u[1]]);
  return { hip, phi: tang(u), l: { th, sh: th }, _sx: sx };
}
const pp = f => ({ pose: f });
const curvaHip = (A, B) => tang(nrm(sub(B, A)));

/* ---------- Movimentos ---------- */
const PAT = {
  agacho: { dur: 3.4, lab: ["Desce controlando", "Sobe empurrando o chão"],
    pose: p => ({ hip: [-.23 * p, ST - .4 * p], phi: 5 + 37 * p, lN: { a: [.05, 0] }, lF: { a: [-.01, 0] }, aN: { ua: 10 + 72 * p, fa: 10 + 72 * p }, aF: { ua: 6 + 72 * p, fa: 6 + 72 * p } }) },
  afundo: { dur: 3.4, lab: ["Desce os dois joelhos", "Sobe com a perna da frente"],
    pose: p => ({ hip: [-.02, .86 - .35 * p], phi: 4, lN: { a: [.36, 0] }, lF: { a: [-.38, .03], pe: 55 }, aN: { h: "hang" }, aF: { h: "hang" } }), props: J => db(J) },
  leg45: { dur: 3.6, lab: ["Traz os joelhos em direção ao peito", "Empurra a plataforma"],
    pose: p => { const hip = [-.25, .42], d = .86 - .44 * p; return { hip, phi: -52, lN: { a: add(hip, [.72, .69], d), k: 1 }, lF: { a: add(hip, [.72, .69], d - .02), k: 1 }, aN: { h: [hip[0] + .12, hip[1] + .02] }, aF: { h: [hip[0] + .1, hip[1] + .02] } }; },
    props: J => { const u = nrm([.72, .69]), pd = [-u[1], u[0]], c = add(J.an[0], u, .07); return [{ l: [add(J.hip, [.03, -.1]), add(J.neck, [-.1, -.04])], w: .09, c: "prop", back: 1 }, { l: [[-.3, .26], [-.3, 0]], w: .05, c: "prop", back: 1 }, { l: [[-.1, .15], [.95, 1.16]], w: .03, c: "prop", back: 1 }, { l: [add(c, pd, .2), add(c, pd, -.2)], w: .05, c: "prop2" }]; } },
  cadeiraext: { dur: 3, lab: ["Estica as pernas", "Volta devagar"],
    pose: p => ({ hip: [-.2, .52], phi: -8, l: { th: 88, sh: 4 + 82 * p }, aN: { h: [-.12, .47] }, aF: { h: [-.14, .47] } }),
    props: J => [box(-.4, .22, .4, .46), { l: [[-.37, .48], [-.45, 1.12]], w: .08, c: "prop", back: 1 }, { l: [[-.1, 0], [-.1, .4]], w: .06, c: "prop", back: 1 }, { c: add(lp(J.kn[0], J.an[0], .88), nrm(sub(J.an[0], J.kn[0])).reverse().map((x, i) => i ? -x : x), .07), r: .05, f: "prop2" }] },
  mesaflex: { dur: 3, lab: ["Puxa o calcanhar até o glúteo", "Volta devagar"],
    pose: p => ({ hip: [-.15, .58], phi: 88, l: { th: -90, sh: -92 - 88 * p }, aN: { h: [.62, .5] }, aF: { h: [.6, .5] } }),
    props: J => { const d = nrm(sub(J.an[0], J.kn[0])); return [box(-.62, .75, .42, .48), { l: [[-.5, 0], [-.5, .42]], w: .05, c: "prop", back: 1 }, { l: [[.6, 0], [.6, .42]], w: .05, c: "prop", back: 1 }, { c: add(lp(J.kn[0], J.an[0], .86), [d[1], -d[0]], .075), r: .05, f: "prop2" }]; } },
  stiff: { dur: 3.6, lab: ["Quadril para trás, coluna reta", "Sobe contraindo o glúteo"],
    pose: p => ({ hip: [-.13 * p, ST - .04 * p], phi: 4 + 74 * p, lN: { a: [.05, 0] }, lF: { a: [0, 0] }, aN: { h: "hang" }, aF: { h: "hang" } }), props: J => db(J) },
  levterra: { dur: 3.6, lab: ["Desce a barra rente às pernas", "Sobe empurrando o chão"],
    pose: p => ({ hip: [-.17 * p, ST - .34 * p], phi: 4 + 50 * p, lN: { a: [.05, 0] }, lF: { a: [0, 0] }, aN: { h: "hang" }, aF: { h: "hang" } }), props: J => bar(J) },
  goodmorning: { dur: 3.6, lab: ["Inclina o tronco à frente", "Volta contraindo o glúteo"],
    pose: p => ({ hip: [-.13 * p, ST - .04 * p], phi: 4 + 70 * p, lN: { a: [.05, 0] }, lF: { a: [0, 0] }, aN: { h: "nape", k: 1 }, aF: { h: "nape", k: 1 } }), props: J => [{ c: J.ha[0], r: .035, f: "prop2", front: 1 }] },
  elevpelv: { dur: 3, lab: ["Sobe o quadril e aperta o glúteo", "Desce sem encostar"],
    pose: p => { const S = [-.42, .47], hip = [-.02, .17 + .27 * p]; return { hip, phi: curvaHip(hip, S), lN: { a: [.3, 0], k: 1 }, lF: { a: [.27, 0], k: 1 }, aN: { h: add(hip, [.03, .11]) }, aF: { h: add(hip, [.03, .11]) } }; },
    props: J => [box(-.95, -.42, 0, .4), { c: add(J.hip, [.03, .14]), r: .17, ring: .045, f: "prop2", front: 1 }] },
  panturrilha: { dur: 2.4, lab: ["Sobe na ponta dos pés", "Desce o calcanhar"],
    pose: p => ({ hip: [-.02, ST + .06 + .07 * p], phi: 3, lN: { a: [0, .06 + .07 * p], pe: -12 + 42 * p }, lF: { a: [-.04, .06 + .07 * p], pe: -12 + 42 * p }, aN: { h: "hang" }, aF: { h: "hang" } }),
    props: () => [box(-.02, .34, 0, .07)] },
  abdutora: { view: "front", dur: 2.8, lab: ["Abre as pernas", "Volta devagar"],
    pose: p => { const hy = .5, ko = .06 + .17 * p; return { hip: [0, hy], phi: 0, lN: { kn: [.08 + ko, hy - .05], a: [.08 + ko, .05] }, lF: { kn: [-.08 - ko, hy - .05], a: [-.08 - ko, .05] }, aN: { h: [.27, hy - .03] }, aF: { h: [-.27, hy - .03] } }; },
    props: J => [box(-.34, .34, .36, .44), { p: [[-.2, .44], [.2, .44], [.2, 1.05], [-.2, 1.05]], c: "prop", back: 1 }, { c: add(J.kn[0], [.07, 0]), r: .045, f: "prop2", front: 1 }, { c: add(J.kn[1], [-.07, 0]), r: .045, f: "prop2", front: 1 }] },
  sumo: { view: "front", dur: 3.4, lab: ["Desce com os joelhos para fora", "Sobe apertando os glúteos"],
    pose: p => { const hy = ST - .32 * p; return { hip: [0, hy], phi: 0, lN: { a: [.34, 0], k: 1 }, lF: { a: [-.34, 0], k: 1 }, aN: { h: [.04, hy - .12], k: 1 }, aF: { h: [-.04, hy - .12], k: 1 } }; },
    props: J => { const c = add(lp(J.ha[0], J.ha[1], .5), [0, -.07]); return [{ c, r: .075, f: "prop2", front: 1 }, { l: [J.ha[0], J.ha[1]], w: .025, c: "prop2", front: 1 }]; } },
  bulgaro: { dur: 3.4, lab: ["Desce na vertical", "Sobe com a perna da frente"],
    pose: p => ({ hip: [-.06, .88 - .34 * p], phi: 6, lN: { a: [.3, 0] }, lF: { a: [-.6, .44], pe: 60 }, aN: { h: "hang" }, aF: { h: "hang" } }),
    props: J => [box(-.88, -.5, 0, .4), ...db(J)] },
  supino: { dur: 3.2, lab: ["Desce a barra até o peito", "Empurra para cima"],
    pose: p => { const hip = [.08, .5], S = add(hip, [-1, 0], L.so), h = add(S, [.06, .1 + .5 * p]); return { hip, phi: -90, lN: { a: [.42, 0], k: 1 }, lF: { a: [.38, 0], k: 1 }, aN: { h, k: -1 }, aF: { h, k: -1 } }; },
    props: J => [box(-.82, .2, .36, .42), { l: [[-.7, 0], [-.7, .36]], w: .05, c: "prop", back: 1 }, { l: [[.1, 0], [.1, .36]], w: .05, c: "prop", back: 1 }, ...bar(J)] },
  supinoinc: { dur: 3.2, lab: ["Desce os halteres até o peito", "Empurra para cima"],
    pose: p => { const hip = [.05, .45], phi = -56, S = add(hip, tdir(phi), L.so), h = add(S, [.13, .1 + .47 * p]); return { hip, phi, lN: { a: [.42, 0], k: 1 }, lF: { a: [.38, 0], k: 1 }, aN: { h, k: -1 }, aF: { h, k: -1 } }; },
    props: J => [{ l: [add(J.hip, [.0, -.11]), add(J.neck, [-.1, -.08])], w: .09, c: "prop", back: 1 }, { l: [add(J.hip, [-.02, -.11]), add(J.hip, [.26, -.11])], w: .08, c: "prop", back: 1 }, { l: [[-.05, 0], [-.05, .3]], w: .05, c: "prop", back: 1 }, ...db(J)] },
  crucifixo: { view: "front", top: 1, dur: 3.4, lab: ["Abre os braços em arco", "Fecha como num abraço"],
    pose: p => { const hip = [0, .55], a = (8 + 80 * p) * D, out = (.58 * Math.cos(a) - .13 * Math.sin(a)); const sw = .15, S = [sw, hip[1] + L.so];
      const hR = [S[0] + out, S[1] - .02], eR = [lerp(S[0], hR[0], .5), S[1] + .02 + .05 * Math.sin(a)];
      return { hip, phi: 0, lN: { kn: [.1, .12], a: [.1, .02] }, lF: { kn: [-.1, .12], a: [-.1, .02] }, aN: { el: eR, h: hR }, aF: { el: [-eR[0], eR[1]], h: [-hR[0], hR[1]] } }; },
    props: J => [{ p: [[-.17, .02], [.17, .02], [.17, 1.25], [-.17, 1.25]], c: "prop", back: 1 }, ...db(J)] },
  flexao: { dur: 3, lab: ["Desce o peito até perto do chão", "Empurra o chão"],
    pose: p => ({ ...plank(.17 + .3 * p, -.72), a: { h: [.64, 0], k: -1 } }) },
  mergulho: { dur: 3, lab: ["Desce dobrando os cotovelos", "Sobe empurrando o banco"],
    pose: p => ({ hip: [-.12, .14 + .28 * p], phi: 2, l: { a: [.72, 0], k: 1 }, aN: { h: [-.28, .46], k: -1 }, aF: { h: [-.3, .46], k: -1 } }),
    props: () => [box(-.62, -.24, .38, .44), { l: [[-.55, 0], [-.55, .38]], w: .05, c: "prop", back: 1 }, { l: [[-.3, 0], [-.3, .38]], w: .05, c: "prop", back: 1 }] },
  puxada: { dur: 3.2, lab: ["Puxa a barra até o peito", "Volta esticando os braços"],
    pose: p => { const hip = [-.1, .5], phi = -12, S = add(hip, tdir(phi), L.so), h = lp(add(S, [.1, .58]), add(S, [.1, -.03]), p); return { hip, phi, l: { th: 88, sh: 2 }, aN: { h, k: -1 }, aF: { h, k: -1 } }; },
    props: J => { const m = lp(J.ha[0], J.ha[1], .5), top = [m[0], 2.2]; return [box(-.35, .2, .38, .44), { c: add(J.kn[0], [-.02, .1]), r: .05, f: "prop2" }, cable(m, top), pulley([m[0], 2.17]), { l: [add(m, [-.18, 0]), add(m, [.18, 0])], w: .03, c: "prop2", front: 1 }]; } },
  barrafixa: { dur: 3.2, lab: ["Puxa até o queixo passar a barra", "Desce controlando"],
    pose: p => { const B = [.04, 2.08], sy = 1.5 + .36 * p, phi = -6, S = [0, sy], td = tdir(phi), hip = [S[0] - td[0] * L.so, sy - td[1] * L.so]; return { hip, phi, l: { th: -8, sh: -45 }, aN: { h: B, k: -1 }, aF: { h: [B[0] - .01, B[1]], k: -1 } }; },
    props: () => [{ l: [[-.3, 2.08], [.4, 2.08]], w: .035, c: "prop2", front: 1 }] },
  remadacurv: { dur: 3, lab: ["Puxa até o umbigo", "Desce esticando os braços"],
    pose: p => { const hip = [-.14, .78], phi = 62, td = tdir(phi), n = [Math.cos(phi * D), -Math.sin(phi * D)], S = add(hip, td, L.so), h = lp(add(S, [0, -.58]), add(add(hip, td, .14), n, .12), p); return { hip, phi, lN: { a: [.05, 0] }, lF: { a: [0, 0] }, aN: { h, k: -1 }, aF: { h, k: -1 } }; },
    props: J => bar(J) },
  remadaunil: { dur: 3, lab: ["Puxa o halter até a cintura", "Desce esticando o braço"],
    pose: p => { const hip = [-.05, .9], phi = 80, td = tdir(phi), n = [Math.cos(phi * D), -Math.sin(phi * D)], S = add(hip, td, L.so), h = lp(add(S, [0, -.58]), add(add(hip, td, .2), n, .1), p); return { hip, phi, lN: { a: [-.28, 0] }, lF: { th: 0, sh: -90 }, aN: { h, k: -1 }, aF: { h: [S[0] + .02, .47], k: -1 } }; },
    props: J => [box(-.62, .72, .39, .45), { l: [[-.5, 0], [-.5, .39]], w: .05, c: "prop", back: 1 }, { l: [[.6, 0], [.6, .39]], w: .05, c: "prop", back: 1 }, ...db(J, [0])] },
  remadabaixa: { dur: 3, lab: ["Puxa até o abdômen", "Volta esticando os braços"],
    pose: p => { const hip = [-.3, .34], phi = -4 - 8 * p, td = tdir(phi), n = [Math.cos(phi * D), -Math.sin(phi * D)], S = add(hip, td, L.so), h = lp(add(S, [.57, -.12]), add(add(hip, td, .28), n, .1), p); return { hip, phi, lN: { a: [.42, .3], k: 1 }, lF: { a: [.4, .29], k: 1 }, aN: { h, k: -1 }, aF: { h, k: -1 } }; },
    props: J => [box(-.58, -.08, 0, .24), { l: [[.5, .12], [.5, .5]], w: .04, c: "prop2" }, cable(J.ha[0], [.95, .36]), pulley([.95, .36])] },
  desenv: { dur: 3, lab: ["Empurra os halteres para cima", "Desce até a altura das orelhas"],
    pose: p => { const hip = [-.05, .5], S = add(hip, [0, 1], L.so), h = add(S, [.07, .07 + .52 * p]); return { hip, phi: 0, l: { th: 88, sh: 3 }, aN: { h, k: -1 }, aF: { h: add(h, [-.02, 0]), k: -1 } }; },
    props: J => [box(-.25, .2, .38, .44), { l: [[-.22, .44], [-.22, 1.15]], w: .08, c: "prop", back: 1 }, { l: [[-.05, 0], [-.05, .38]], w: .05, c: "prop", back: 1 }, ...db(J)] },
  elevlat: { view: "front", dur: 2.8, lab: ["Sobe os braços até a linha do ombro", "Desce devagar"],
    pose: p => ({ hip: [0, ST], phi: 0, l: { a: [.1, 0] }, a: { ua: 6 + 80 * p, fa: 8 + 80 * p } }), props: J => db(J) },
  elevfront: { dur: 2.8, lab: ["Sobe os braços à frente", "Desce devagar"],
    pose: p => stand({ aN: { ua: 4 + 84 * p, fa: 2 + 86 * p }, aF: { ua: 4 + 84 * p, fa: 2 + 86 * p } }), props: J => db(J) },
  crucinv: { view: "front", dur: 2.8, lab: ["Abre os braços para os lados", "Desce devagar"],
    pose: p => ({ hip: [0, .87], phi: 0, tl: .4, l: { a: [.1, 0] }, a: { ua: 4 + 80 * p, fa: 4 + 80 * p } }), props: J => db(J) },
  roscadir: { dur: 2.8, lab: ["Sobe o peso sem mexer o cotovelo", "Desce devagar"],
    pose: p => stand({ aN: { ua: -4, fa: 6 + 128 * p }, aF: { ua: -4, fa: 6 + 128 * p } }), props: J => db(J) },
  roscamart: { dur: 3, lab: ["Sobe um braço", "Troca o braço"],
    pose: p => stand({ aN: { ua: -4, fa: 6 + 128 * p }, aF: { ua: -4, fa: 6 + 128 * (1 - p) } }), props: J => db(J), alt: 1 },
  tricpolia: { dur: 2.6, lab: ["Estica os braços para baixo", "Volta até 90 graus"],
    pose: p => stand({ hip: [-.04, ST - .02], phi: 14, aN: { ua: 6, fa: 105 - 98 * p }, aF: { ua: 6, fa: 105 - 98 * p } }),
    props: J => [cable(J.ha[0], [.4, 2.15]), pulley([.4, 2.12]), { l: [add(J.ha[0], [-.02, .03]), add(J.ha[0], [.02, -.03])], w: .03, c: "prop2", front: 1 }] },
  tricfrances: { dur: 3, lab: ["Estica os braços acima da cabeça", "Desce o peso atrás da cabeça"],
    pose: p => stand({ aN: { ua: 172, fa: -28 - 160 * p }, aF: { ua: 170, fa: -28 - 160 * p } }), props: J => [{ c: J.ha[0], r: .062, f: "prop2", front: 1 }] },
  prancha: { dur: 4, iso: 1, lab: ["Segura firme", "Respira curto"],
    pose: p => { const S = [.48, .31 + .008 * p], A = [-.85, .06], u = nrm(sub(S, A)), hip = add(A, u, .87), th = ang([-u[0], -u[1]]); return { hip, phi: tang(u), l: { th, sh: th }, aN: { el: [.47, .035], h: [.76, .035] }, aF: { el: [.45, .035], h: [.74, .035] } }; }, props: mat },
  pranchalat: { view: "front", dur: 4, iso: 1, lab: ["Quadril alto e firme", "Respira curto"],
    pose: p => { const S = [.5, .35 + .015 * p], A = [-.8, .06], u = nrm(sub(S, A)), hip = add(A, u, .87); return { hip, phi: tang(u), lN: { a: [-.8, .05] }, lF: { a: [-.79, .14] }, aN: { el: [.53, .03], h: [.8, .03] }, aF: { h: "up" } }; }, props: mat },
  abdsupra: { dur: 2.8, lab: ["Sobe só as escápulas", "Desce devagar"],
    pose: p => ({ hip: [.05, .1], phi: -90 + 30 * p, lN: { a: [.45, 0], k: 1 }, lF: { a: [.42, 0], k: 1 }, aN: { h: "head", k: -1 }, aF: { h: "head", k: -1 } }), props: mat },
  abdinfra: { dur: 3, lab: ["Sobe as pernas juntas", "Desce sem encostar no chão"],
    pose: p => ({ hip: [0, .1], phi: -90, l: { th: 94 + 80 * p, sh: 94 + 80 * p }, a: { ua: 90, fa: 90 } }), props: mat },
  bicicleta: { dur: 2, lab: ["Cotovelo no joelho oposto", "Troca de lado"], alt: 1,
    pose: p => { const leg = q => ({ th: 100 + 62 * q, sh: 100 - 10 * q }); return { hip: [.05, .1], phi: -64 + 6 * (p - .5), lN: leg(p), lF: leg(1 - p), aN: { h: "head", k: -1 }, aF: { h: "head", k: -1 } }; }, props: mat },
  polichinelo: { view: "front", dur: 1.3, lab: ["Abre", "Fecha"],
    pose: p => { const j = .05 * Math.sin(Math.PI * p), fx = .08 + .3 * p; return { hip: [0, ST + j], phi: 0, lN: { a: [fx, j] }, lF: { a: [-fx, j] }, a: { ua: 12 + 158 * p, fa: 12 + 163 * p } }; } },
  corrida: { dur: .9, lab: ["Joelho alto", "Troca de perna"], alt: 1,
    pose: p => { const leg = q => ({ th: -10 + 85 * q, sh: -15 - 5 * q - 80 * q * (1 - q) }), arm = q => ({ ua: 40 - 80 * q, fa: 125 - 80 * q });
      const ext = s => .45 * Math.cos(s.th * D) + .44 * Math.cos(s.sh * D) + .03; const N = leg(p), F = leg(1 - p);
      return { hip: [0, Math.max(ext(N), ext(F))], phi: 8, lN: N, lF: F, aN: arm(p), aF: arm(1 - p) }; } },
  supermann: { dur: 3, lab: ["Sobe braços e pernas juntos", "Desce devagar"],
    pose: p => ({ hip: [-.3, .1], phi: 90 - 12 * p, l: { th: -90 - 12 * p, sh: -90 - 12 * p }, a: { ua: 90 + 14 * p, fa: 90 + 14 * p } }), props: mat },
  along: { dur: 5, lab: ["Inclina com a coluna longa", "Volta e respira"],
    pose: p => { const h = lp([.12, .26], [.6, .16], p); return { hip: [-.35, .1], phi: -2 + 57 * p, l: { th: 90, sh: 90 }, aN: { h, k: -1 }, aF: { h: add(h, [-.02, 0]), k: -1 } }; }, props: mat },
  /* Movimentos em sequência (quadros-chave) */
  agachsalto: { loop: 1, dur: 2.1,
    keys: () => { const A = stand({ aN: { ua: 8, fa: 12 }, aF: { ua: 6, fa: 10 } }), B = { hip: [-.22, .48], phi: 42, lN: { a: [.05, 0] }, lF: { a: [-.01, 0] }, aN: { ua: -45, fa: -38 }, aF: { ua: -48, fa: -40 } }, C = stand({ lN: { a: [.03, 0], pe: 35 }, lF: { a: [-.03, 0], pe: 35 }, aN: { ua: 168, fa: 172 }, aF: { ua: 166, fa: 170 }, up: .24 }), Dl = { hip: [-.08, .74], phi: 16, lN: { a: [.05, 0] }, lF: { a: [-.01, 0] }, aN: { ua: 40, fa: 50 }, aF: { ua: 38, fa: 48 } };
      return [[0, A], [.38, B], [.55, C], [.7, Dl], [.85, A], [1, A]]; },
    cue: u => u < .38 ? "Desce" : u < .55 ? "Salta!" : u < .85 ? "Aterrissa macio" : "Prepara", int: u => u < .38 ? u / .38 : u < .7 ? 1 : Math.max(.2, 1 - (u - .7) * 4) },
  burpee: { loop: 1, dur: 3.4,
    keys: () => { const A = stand(), B = { hip: [-.12, .42], phi: 58, lN: { a: [.05, 0] }, lF: { a: [0, 0] }, aN: { h: [.38, 0], k: -1 }, aF: { h: [.36, 0], k: -1 } };
      const pk = h => { const P = plank(h, -.98); return { ...P, a: { h: [.35, 0], k: -1 } }; };
      const E = stand({ lN: { a: [.03, 0], pe: 35 }, lF: { a: [-.03, 0], pe: 35 }, aN: { ua: 168, fa: 172 }, aF: { ua: 166, fa: 170 }, up: .2 });
      return [[0, A], [.14, B], [.28, pk(.48)], [.38, pk(.2)], [.48, pk(.48)], [.62, B], [.75, A], [.86, E], [1, A]]; },
    cue: u => u < .14 ? "Agacha e apoia as mãos" : u < .28 ? "Joga as pernas para trás" : u < .48 ? "Flexão" : u < .62 ? "Volta os pés" : u < .75 ? "Levanta" : "Salta com os braços para cima", int: u => .55 + .45 * Math.sin(u * Math.PI * 2) ** 2 },
  escalador: { dur: 1.1, lab: ["Joelho no peito", "Troca de perna"], alt: 1,
    pose: p => { const P = plank(.5, -.72), hipP = P.hip, f = q => ({ a: lp([-.72, .06], [-.1, .12], q), k: 1 }); return { hip: hipP, phi: P.phi, lN: f(p), lF: f(1 - p), a: { h: [P._sx + .02, 0], k: -1 } }; } },
  pularcorda: { view: "front", loop: 1, dur: .8,
    pose: u => { const c = Math.cos(2 * Math.PI * u), h = .06 * Math.max(0, -c), hy = ST + h; return { hip: [0, hy], phi: 0, lN: { a: [.07, h] }, lF: { a: [-.07, h] }, aN: { h: [.32, hy + .04], k: 1 }, aF: { h: [-.32, hy + .04], k: 1 }, _c: c, _s: Math.sin(2 * Math.PI * u) }; },
    props: (J, P) => { const a = J.ha[0], b = J.ha[1], mid = -.03 + 2.2 * (P._c + 1) / 2, cy = 2 * mid - (a[1] + b[1]) / 2; return [{ q: [a, [0, cy], b], w: .012, c: "ink", back: P._s > 0 ? 1 : 0, front: P._s > 0 ? 0 : 1 }]; },
    cue: () => "Saltos baixos, na ponta dos pés", int: u => .7 + .3 * Math.abs(Math.cos(2 * Math.PI * u)), box: [-.7, .7, -.08, 2.25] }
};

/* ---------- Movimentos de treino em casa ---------- */
const sinU = u => Math.sin(2 * Math.PI * u);
const quad4 = (hip = [-.15, .52]) => { const S = add(hip, [1, 0], L.so); return { hip, phi: 90, S }; };
const ajoelhada = { th: 0, sh: -90 };
Object.assign(PAT, {
  afundoL: { dur: 3.4, lab: ["Desce os dois joelhos", "Sobe com a perna da frente"], pose: p => ({ ...PAT.afundo.pose(p), aN: { h: "cint" }, aF: { h: "cint" } }) },
  bulgaroL: { dur: 3.4, lab: ["Desce na vertical", "Sobe com a perna da frente"], pose: p => ({ ...PAT.bulgaro.pose(p), aN: { h: "cint" }, aF: { h: "cint" } }), props: () => [box(-.88, -.5, 0, .42)] },
  sumoL: { view: "front", dur: 3.4, lab: ["Desce com os joelhos para fora", "Sobe apertando os glúteos"],
    pose: p => { const hy = ST - .32 * p; return { hip: [0, hy], phi: 0, lN: { a: [.34, 0], k: 1 }, lF: { a: [-.34, 0], k: 1 }, aN: { h: [.03, hy + .4], k: 1 }, aF: { h: [-.03, hy + .4], k: 1 } }; } },
  ponte: { dur: 3, lab: ["Sobe o quadril e aperta o glúteo", "Desce devagar"],
    pose: p => { const S = [-.52, .1], hip = [-.02, .1 + .28 * p]; return { hip, phi: tang(sub(S, hip)), lN: { a: [.3, .02], k: 1 }, lF: { a: [.27, .02], k: 1 }, aN: { ua: 90, fa: 90 }, aF: { ua: 90, fa: 90 } }; }, props: mat },
  pontealt: { dur: 3, lab: ["Sobe empurrando o calcanhar", "Desce devagar"],
    pose: p => { const S = [-.52, .1], hip = [-.02, .1 + .26 * p], th = ang(nrm(sub(hip, S))); return { hip, phi: tang(sub(S, hip)), lN: { a: [.3, .02], k: 1 }, lF: { th: Math.max(th, 95), sh: Math.max(th, 95) }, aN: { ua: 90, fa: 90 }, aF: { ua: 90, fa: 90 } }; }, props: mat },
  wallsit: { dur: 4, iso: 1, lab: ["Segura firme", "Respira"],
    pose: p => ({ hip: [-.1, .47 + .005 * p], phi: 0, l: { th: 90, sh: 0 }, aN: { h: "peito", k: -1 }, aF: { h: "peito", k: -1 } }), props: () => [{ p: [[-.34, 0], [-.27, 0], [-.27, 1.9], [-.34, 1.9]], c: "prop", back: 1 }] },
  stepup: { dur: 3.2, lab: ["Sobe empurrando o calcanhar", "Desce devagar"],
    pose: p => ({ hip: lp([-.02, ST], [.28, .44 + ST], p), phi: 8, lN: { a: [.32, .45] }, lF: { a: lp([-.06, 0], [.2, .64], p) }, aN: { h: "hang" }, aF: { h: "hang" } }),
    props: () => [box(.1, .62, 0, .42), { l: [[.58, .42], [.62, .95]], w: .05, c: "prop", back: 1 }] },
  coice: { dur: 2.6, lab: ["Leva a perna para trás e para cima", "Volta devagar"],
    pose: p => { const q = quad4(); return { hip: q.hip, phi: q.phi, lN: { th: -118 * p, sh: -90 - 22 * p }, lF: ajoelhada, aN: { h: [q.S[0] + .02, 0], k: -1 }, aF: { h: [q.S[0], 0], k: -1 } }; }, props: mat },
  perdigueiro: { dur: 3.2, lab: ["Estica braço e perna opostos", "Volta e troca"],
    pose: p => { const q = quad4(); return { hip: q.hip, phi: q.phi, lN: { th: -90 * p, sh: -90 }, lF: ajoelhada, aN: { h: lp([q.S[0] + .02, 0], add(q.S, [.56, .02]), p), k: -1 }, aF: { h: [q.S[0], 0], k: -1 } }; }, props: mat },
  elevlatdeit: { view: "front", dur: 2.8, lab: ["Sobe a perna de cima", "Desce devagar"],
    pose: p => { const hip = [-.05, .2], hpF = [hip[0], hip[1] + .09], a = (6 + 34 * p) * D; return { hip, phi: 90, lN: { a: [-.93, .06] }, lF: { a: add(hpF, [-Math.cos(a), Math.sin(a)], .86) }, aN: { el: [.47, .04], h: [.6, .22] }, aF: { el: [.18, .4], h: [.0, .34] } }; }, props: mat },
  flexjoelho: { dur: 3, lab: ["Desce o peito até perto do chão", "Empurra o chão"],
    pose: p => { const K = [-.3, .05], h = .2 + .28 * p, B = L.th + L.so, S = [K[0] + Math.sqrt(Math.max(.01, B * B - (h - K[1]) ** 2)), h], u = nrm(sub(S, K)), hip = add(K, u, L.th);
      return { hip, phi: tang(u), l: { th: ang([-u[0], -u[1]]), sh: -96 }, a: { h: [.6, 0], k: -1 } }; }, props: mat },
  flexinc: { dur: 3, lab: ["Desce o peito até a beirada", "Empurra e volta"],
    pose: p => { const H = [.56, .45], S = add(H, [.03, .14 + .36 * p]), B = L.th + L.sh - .02 + L.so, A = [S[0] - Math.sqrt(Math.max(.01, B * B - (S[1] - .06) ** 2)), .06], u = nrm(sub(S, A)), hip = add(A, u, L.th + L.sh - .02), th = ang([-u[0], -u[1]]);
      return { hip, phi: tang(u), l: { th, sh: th }, a: { h: H, k: -1 } }; }, props: () => [box(.45, 1.1, 0, .43)] },
  pike: { dur: 3, lab: ["Desce a cabeça entre as mãos", "Empurra e volta"],
    pose: p => { const hip = [-.1, .84], S = lp([.3, .52], [.38, .24], p); return { hip, phi: tang(sub(S, hip)), lN: { a: [-.6, .06], pe: 50 }, lF: { a: [-.62, .06], pe: 50 }, a: { h: [.44, 0], k: -1 } }; }, props: mat },
  invrow: { dur: 3, lab: ["Puxa o peito até a mesa", "Desce devagar"],
    pose: p => { const H = [-.48, .8], A = [.78, .06], S = lp([-.47, .24], [-.42, .62], p), u = nrm(sub(S, A)), hip = add(A, u, L.th + L.sh - .02), th = ang([-u[0], -u[1]]);
      return { hip, phi: tang(u), l: { th, sh: th }, a: { h: H, k: -1 } }; },
    props: () => [box(-1.12, -.42, .8, .86), { l: [[-.5, 0], [-.5, .8]], w: .05, c: "prop", back: 1 }, { l: [[-1.05, 0], [-1.05, .8]], w: .05, c: "prop", back: 1 }] },
  toqueombro: { loop: 1, dur: 2.4, cue: u => u < .5 ? "Toca o ombro com uma mão" : "Agora a outra mão",
    pose: u => { const P0 = plank(.5, -.72), H = [P0._sx + .02, 0], S = add(P0.hip, tdir(P0.phi), L.so), up = add(S, [-.04, -.1]), qN = Math.max(0, sinU(u)), qF = Math.max(0, -sinU(u));
      return { ...P0, aN: { h: lp(H, up, qN), k: -1 }, aF: { h: lp(H, up, qF), k: -1 } }; }, int: () => .85, props: mat },
  deadbug: { loop: 1, dur: 3.2, cue: u => u < .5 ? "Estica braço e perna opostos" : "Troca de lado",
    pose: u => { const qN = Math.max(0, sinU(u)), qF = Math.max(0, -sinU(u)), leg = q => ({ th: 180 - 82 * q, sh: 90 + 8 * q }), arm = q => ({ ua: 180 + 84 * q, fa: 180 + 84 * q });
      return { hip: [0, .1], phi: -90, lN: leg(qN), lF: leg(qF), aN: arm(qF), aF: arm(qN) }; }, int: u => .5 + .5 * Math.abs(sinU(u)), props: mat },
  hollow: { dur: 4, iso: 1, lab: ["Lombar colada no chão", "Respira curto"],
    pose: p => ({ hip: [.05, .1], phi: -78 + 2 * p, l: { th: 101, sh: 101 }, a: { ua: -96, fa: -96 } }), props: mat },
  vup: { dur: 2.6, lab: ["Sobe tronco e pernas juntos", "Desce devagar"],
    pose: p => ({ hip: [.05, .1], phi: -90 + 48 * p, l: { th: 92 + 46 * p, sh: 92 + 46 * p }, a: { ua: -95 - 132 * p, fa: -95 - 132 * p } }), props: mat },
  skater: { view: "front", loop: 1, dur: 1.4, cue: () => "Salta de um lado para o outro",
    pose: u => { const s = sinU(u), hx = .28 * s, hy = .78 - .06 * Math.abs(Math.cos(2 * Math.PI * u)), sup = [hx + .06 * Math.sign(s || 1), 0], cruz = [hx - .26 * Math.sign(s || 1), .14];
      const nSup = s >= 0; return { hip: [hx, hy], phi: 10 * s, lN: { a: nSup ? sup : cruz }, lF: { a: nSup ? cruz : sup }, aN: { ua: 25 + 40 * s, fa: 50 + 40 * s }, aF: { ua: 25 - 40 * s, fa: 50 - 40 * s } }; },
    int: u => .7 + .3 * Math.abs(sinU(u)), box: [-.85, .85, -.08, 1.9] },
  crianca: { dur: 5, iso: 1, lab: ["Relaxa e respira fundo", "Solta o ar devagar"],
    pose: p => { const hip = [-.12, .3]; return { hip, phi: 102 + 4 * p, lN: { kn: [.25, .06], a: [-.2, .05] }, lF: { kn: [.24, .06], a: [-.21, .05] }, aN: { h: [.86, .03], k: 1 }, aF: { h: [.84, .03], k: 1 } }; }, props: mat },
  alongquad: { dur: 5, iso: 1, lab: ["Segura o pé atrás", "Joelhos juntos"],
    pose: p => { const P = stand({ lN: { th: 2, sh: -165 }, lF: { a: [-.02, 0] } }); return { ...P, phi: 2, aN: { h: "pe", k: -1 }, aF: { ua: 20 + 2 * p, fa: 25 } }; } }
});

/* ---------- Músculos por exercício ---------- */
const MUSC = { quad:"Quadríceps", glut:"Glúteos", isq:"Posteriores da coxa", pant:"Panturrilha", adut:"Adutores", abdut:"Glúteo médio", peito:"Peitoral", costas:"Costas (dorsal)", trap:"Trapézio", lomb:"Lombar", ombro:"Ombros", ombroP:"Ombro posterior", bic:"Bíceps", tric:"Tríceps", antb:"Antebraço", abd:"Abdômen", obl:"Oblíquos", card:"Coração e fôlego" };
const EXM = {
  agacho:["agacho",["quad","glut"],["isq","lomb","abd"]], afundo:["afundo",["quad","glut"],["isq","pant"]], leg45:["leg45",["quad","glut"],["isq"]],
  cadeiraext:["cadeiraext",["quad"],[]], mesaflex:["mesaflex",["isq"],["pant"]], stiff:["stiff",["isq","glut"],["lomb"]], elevpelv:["elevpelv",["glut"],["isq","quad"]],
  panturrilha:["panturrilha",["pant"],[]], abdutora:["abdutora",["abdut"],["glut"]], sumo:["sumo",["quad","glut","adut"],["isq"]], bulgaro:["bulgaro",["quad","glut"],["isq"]],
  supino:["supino",["peito"],["tric","ombro"]], supinoinc:["supinoinc",["peito","ombro"],["tric"]], crucifixo:["crucifixo",["peito"],["ombro"]], flexao:["flexao",["peito","tric"],["ombro","abd"]],
  puxada:["puxada",["costas"],["bic","ombroP"]], remadacurv:["remadacurv",["costas","ombroP"],["bic","lomb"]], remadaunil:["remadaunil",["costas"],["bic","ombroP"]], remadabaixa:["remadabaixa",["costas"],["bic","ombroP"]],
  barrafixa:["barrafixa",["costas","bic"],["antb","abd"]], desenv:["desenv",["ombro"],["tric","trap"]], elevlat:["elevlat",["ombro"],["trap"]], elevfront:["elevfront",["ombro"],["peito"]], crucinv:["crucinv",["ombroP"],["costas","trap"]],
  roscadir:["roscadir",["bic"],["antb"]], roscamart:["roscamart",["bic","antb"],[]], tricpolia:["tricpolia",["tric"],[]], tricfrances:["tricfrances",["tric"],[]], mergulho:["mergulho",["tric"],["peito","ombro"]],
  prancha:["prancha",["abd"],["ombro","glut","lomb"]], abdsupra:["abdsupra",["abd"],[]], abdinfra:["abdinfra",["abd"],["obl"]], bicicleta:["bicicleta",["abd","obl"],[]], pranchalat:["pranchalat",["obl"],["abd","ombro","abdut"]],
  polichinelo:["polichinelo",["card"],["pant","ombro"]], burpee:["burpee",["card"],["quad","peito","ombro"]], escalador:["escalador",["card","abd"],["ombro","quad"]], corrida:["corrida",["card"],["quad","pant"]],
  pularcorda:["pularcorda",["card"],["pant"]], agachsalto:["agachsalto",["card","quad","glut"],["pant"]], levterra:["levterra",["isq","glut","costas"],["lomb","quad","trap","antb"]],
  goodmorning:["goodmorning",["isq"],["glut","lomb"]], supermann:["supermann",["lomb"],["glut","ombroP"]], along:["along",["isq"],["lomb"]],
  afundocasa:["afundoL",["quad","glut"],["isq","pant"]], bulgarocasa:["bulgaroL",["quad","glut"],["isq"]], sumocasa:["sumoL",["quad","glut","adut"],["isq"]],
  ponte:["ponte",["glut"],["isq","lomb"]], pontealt:["pontealt",["glut"],["isq","abd"]], wallsit:["wallsit",["quad"],["glut","pant"]], stepup:["stepup",["quad","glut"],["pant","isq"]],
  coice:["coice",["glut"],["isq","lomb"]], elevlatdeit:["elevlatdeit",["abdut"],["glut","obl"]], flexjoelho:["flexjoelho",["peito","tric"],["ombro"]], flexinc:["flexinc",["peito"],["tric","ombro"]],
  flexdiam:["flexao",["tric","peito"],["ombro"]], pike:["pike",["ombro"],["tric","trap"]], invrow:["invrow",["costas","ombroP"],["bic","lomb"]], perdigueiro:["perdigueiro",["lomb","abd"],["glut","ombro"]],
  toqueombro:["toqueombro",["abd","ombro"],["obl","peito"]], deadbug:["deadbug",["abd"],["obl"]], hollow:["hollow",["abd"],["quad"]], vup:["vup",["abd"],["obl","quad"]],
  skater:["skater",["card","glut"],["quad","abdut"]], crianca:["crianca",["lomb"],["costas","glut"]], alongquad:["alongquad",["quad"],[]],
  hidrante:["hidrante",["abdut","glut"],["abd","lomb"]], abdpe:["abdpe",["abdut"],["glut","abd"]], russo:["russo",["obl","abd"],["lomb"]]
};
// dicas e ritmo dos exercícios novos (a foto da Maya mostra o movimento)
PAT.hidrante = { ...PAT.coice, dur: 2.6, lab: ["Abre o joelho para o lado", "Volta devagar"] };
PAT.abdpe = { ...PAT.elevlatdeit, dur: 2.6, lab: ["Leva a perna esticada para o lado", "Desce sem encostar o pé"] };
PAT.russo = { ...PAT.bicicleta, dur: 2.4, lab: ["Gira o tronco para um lado", "Agora para o outro"] };
const MOD = { cardio: ["polichinelo","burpee","escalador","corrida","pularcorda","agachsalto"], corpo: ["agacho","afundo","flexao","prancha","pranchalat","abdsupra","abdinfra","bicicleta","supermann","elevpelv","mergulho","barrafixa","bulgaro","sumo"], mobilidade: ["along"] };
function info(ex){
  if(EXM[ex.id]) return { anim: EXM[ex.id][0], prim: EXM[ex.id][1], sec: EXM[ex.id][2] };
  const g = String(ex.grupo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const m = [["glut","elevpelv",["glut"],["isq"]],["posterior","stiff",["isq"],["glut"]],["panturr","panturrilha",["pant"],[]],["perna","agacho",["quad","glut"],["isq"]],["peito","flexao",["peito"],["tric"]],["costa","remadacurv",["costas"],["bic"]],["ombro","desenv",["ombro"],["tric"]],["bicep","roscadir",["bic"],["antb"]],["tricep","tricpolia",["tric"],[]],["abd","abdsupra",["abd"],[]],["lombar","supermann",["lomb"],["glut"]],["cardio","polichinelo",["card"],[]],["mobil","along",["isq"],[]]].find(x => g.includes(x[0]));
  return m ? { anim: m[1], prim: m[2], sec: m[3] } : { anim: "agacho", prim: ["quad"], sec: [] };
}
function modalidade(id){ return MOD.cardio.includes(id) || id === "skater" ? "Cardio" : ["along","crianca","alongquad"].includes(id) ? "Mobilidade" : (window.EXMETA && window.EXMETA[id]) || MOD.corpo.includes(id) ? "Em casa" : "Academia"; }

/* ---------- Quadro em um instante ---------- */
function frame(animId, u, sexo){
  const pat = PAT[animId] || PAT.agacho, V = P => (P.view ? P : { ...P, view: pat.view || "side" });
  if(pat.keys){
    const K = pat._k || (pat._k = pat.keys());
    let i = 0; while(i < K.length - 2 && u > K[i + 1][0]) i++;
    const [u0, A] = K[i], [u1, B] = K[i + 1], t = ease(Math.min(1, Math.max(0, (u - u0) / ((u1 - u0) || 1))));
    const J = blend(solve(V(A), sexo), solve(V(B), sexo), t);
    return { J, P: t < .5 ? A : B, I: pat.int ? pat.int(u) : .8, cue: pat.cue ? pat.cue(u) : "" };
  }
  if(pat.loop){ const P = V(pat.pose(u)); return { J: solve(P, sexo), P, I: pat.int ? pat.int(u) : .8, cue: pat.cue ? pat.cue(u) : "" }; }
  const p = .5 - .5 * Math.cos(2 * Math.PI * u), P = V(pat.pose(p));
  const I = pat.iso ? .7 + .3 * p : pat.alt ? .75 + .25 * Math.abs(Math.sin(2 * Math.PI * u)) : p;
  return { J: solve(P, sexo), P, I, cue: pat.lab ? pat.lab[u < .5 ? 0 : 1] : "" };
}

/* ---------- Desenho ---------- */
const MS = { quad:["th",.5,1,.36,.05], isq:["th",.5,-1,.34,.045], glut:["to",.03,-1,.13,.07], pant:["sh",.3,-1,.24,.042], adut:["th",.32,0,.26,.04], abdut:["th",.07,0,.14,.055],
  peito:["to",.8,1,.16,.055], abd:["to",.42,1,.26,.042], obl:["to",.42,0,.24,.05], costas:["to",.66,-1,.26,.055], trap:["to",.96,-1,.1,.045], lomb:["to",.24,-1,.15,.04],
  ombro:["ua",.08,0,.15,.06], ombroP:["ua",.1,-1,.13,.045], bic:["ua",.52,1,.28,.036], tric:["ua",.52,-1,.3,.036], antb:["fa",.35,0,.3,.032] };
const MFT = { peito:[.8,.065,.065,.055], abd:[.42,0,.055,.13], obl:[.42,.085,.03,.1], costas:[.66,.11,.03,.12], trap:[.97,.07,.05,.03], lomb:[.22,.05,.035,.05], glut:[0,.1,.06,.06] };
const MFL = { quad:["th",.5,0,.34,.05], adut:["th",.3,-1,.25,.03], abdut:["th",.08,1,.14,.05], pant:["sh",.3,-1,.22,.035], isq:["th",.5,0,.3,.035], ombro:["ua",.08,0,.15,.06], ombroP:["ua",.1,1,.13,.045], bic:["ua",.5,0,.26,.035], tric:["ua",.5,1,.28,.03], antb:["fa",.35,0,.28,.03] };
const COL = { skin:"var(--skin)", shirt:"var(--fig-shirt)", pants:"var(--fig-pants)", hair:"var(--hair)", shoe:"var(--fig-shoe)", prop:"var(--prop)", prop2:"var(--prop-2)", mus:"var(--muscle)", ink:"var(--ink)", mat:"var(--accent)", line:"var(--line)" };
let UID = 0;
function draw(animId, fr, o){
  const { J, P, I } = fr, pat = PAT[animId] || PAT.agacho, W = SEX[o.sexo], f = o.sexo === "f";
  const X = x => (x * 100).toFixed(1), Y = y => (-y * 100).toFixed(1);
  const ln = (a, b, w, c, x = "") => `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="${c}" stroke-width="${(w * 100).toFixed(1)}" stroke-linecap="round"${x}/>`;
  const ci = (c, r, fl, x = "") => `<circle cx="${X(c[0])}" cy="${Y(c[1])}" r="${(r * 100).toFixed(1)}" fill="${fl}"${x}/>`;
  const po = (pts, fl) => `<polygon points="${pts.map(p => X(p[0]) + "," + Y(p[1])).join(" ")}" fill="${fl}"/>`;
  const prim = q => {
    if(q.l) return ln(q.l[0], q.l[1], q.w, COL[q.c] || q.c);
    if(q.p) return po(q.p, COL[q.c] || q.c);
    if(q.q) return `<path d="M${X(q.q[0][0])} ${Y(q.q[0][1])} Q${X(q.q[1][0])} ${Y(q.q[1][1])} ${X(q.q[2][0])} ${Y(q.q[2][1])}" fill="none" stroke="${COL[q.c]}" stroke-width="${q.w * 100}"/>`;
    if(q.ring) return ci(q.c, q.r, "none", ` stroke="${COL[q.f]}" stroke-width="${q.ring * 100}"`);
    return ci(q.c, q.r, COL[q.f] || q.f);
  };
  const props = pat.props ? pat.props(J, P) : [];
  const leg = i => { const h = J.hp[i], k = J.kn[i], a = J.an[i], t = J.toe[i];
    let s = ln(h, k, W.th, COL.skin) + ln(k, a, W.sh, COL.skin);
    s += f ? ln(h, k, W.th + .012, COL.pants) + ln(k, lp(k, a, .86), W.sh + .01, COL.pants) : ln(h, lp(h, k, .55), W.th + .018, COL.pants);
    return s + ln(lp(a, t, .05), t, .07, COL.shoe); };
  const arm = i => { const s0 = J.sh[i], e = J.el[i], h = J.ha[i];
    let s = ln(s0, e, W.ua, COL.skin) + ln(e, h, W.fa, COL.skin) + ci(h, W.fa * .62, COL.skin);
    return s + (f ? ci(s0, W.ua * .58, COL.shirt) : ln(s0, lp(s0, e, .38), W.ua + .02, COL.shirt)); };
  const torsoSide = () => { const a = add(J.hip, J.td, .03), b = add(J.neck, J.td, -.03); let s = ln(J.neck, J.head, .07, COL.skin);
    if(f) s += ln(a, b, W.to, COL.skin) + ln(lp(a, b, .48), b, W.to + .006, COL.shirt) + ln(a, lp(a, b, .22), W.to + .014, COL.pants) + ci(add(lp(a, b, .73), J.n, W.to * .4), .045, COL.shirt);
    else s += ln(a, b, W.to, COL.shirt) + ln(a, lp(a, b, .1), W.to + .012, COL.pants);
    return s; };
  const torsoFront = () => { const pr = J.n, top = add(J.neck, J.td, -.05), wa = lp(J.hip, J.neck, .45), bot = add(J.hip, J.td, -.04);
    const PR = (c, w) => [add(c, pr, w / 2), add(c, pr, -w / 2)];
    const [t1, t2] = PR(top, SHW[o.sexo] * 1.9), [w1, w2] = PR(wa, W.ww), [b1, b2] = PR(bot, W.hw * .95);
    let s = ln(J.neck, J.head, .075, COL.skin);
    if(f){ s += po([t1, w1, b1, b2, w2, t2], COL.skin); const [m1, m2] = PR(lp(J.hip, J.neck, .62), W.ww * 1.05); s += po([t1, m1, m2, t2], COL.shirt) + po([lp(w1, b1, .45), b1, b2, lp(w2, b2, .45)], COL.pants); }
    else { s += po([t1, w1, b1, b2, w2, t2], COL.shirt); const [s1, s2] = PR(add(bot, J.td, .07), W.hw * .98); s += po([s1, b1, b2, s2], COL.pants); }
    return s + ci(t1, .045, f ? COL.skin : COL.shirt) + ci(t2, .045, f ? COL.skin : COL.shirt); };
  const headSvg = () => { const c = J.head, r = L.hd, n = J.n, td = J.td;
    if(J.v === "side"){ let s = "";
      if(f) s += ln(add(add(c, n, -.08), td, .03), add(add(c, n, -.15), td, -.07), .05, COL.hair) + ci(add(add(c, n, -.1), td, .03), .042, COL.hair);
      return s + ci(add(add(c, n, -.018), td, .016), r * 1.03, COL.hair) + ci(add(c, n, .012), r * .94, COL.skin) + ci(add(add(c, n, .068), td, .016), .011, COL.ink); }
    let s = f ? ln(add(c, n, .085), add(add(c, n, .09), td, -.14), .05, COL.hair) + ln(add(c, n, -.085), add(add(c, n, -.09), td, -.14), .05, COL.hair) : "";
    s += ci(add(c, td, .02), r * 1.04, COL.hair) + ci(add(c, td, -.014), r * .92, COL.skin);
    if(!pat.top && J.td[1] > .3) s += ci(add(add(c, n, .035), td, -.01), .01, COL.ink) + ci(add(add(c, n, -.035), td, -.01), .01, COL.ink);
    return s; };
  /* músculos */
  const seg = { th: i => [J.hp[i], J.kn[i], W.th], sh: i => [J.kn[i], J.an[i], W.sh], ua: i => [J.sh[i], J.el[i], W.ua], fa: i => [J.el[i], J.ha[i], W.fa], to: () => [J.hip, J.neck, W.to] };
  const g = o.glow ? `filter="url(#mg${o.uid})"` : "";
  const ell = (c, rx, ry, d, op, sc) => { const a = (-Math.atan2(d[1], d[0]) / D).toFixed(1), e = `cx="${X(c[0])}" cy="${Y(c[1])}" rx="${(rx * 100).toFixed(1)}" ry="${(ry * 100 * sc).toFixed(1)}" transform="rotate(${a} ${X(c[0])} ${Y(c[1])})"`;
    return (o.glow ? `<ellipse ${e} fill="${COL.mus}" opacity="${(op * .9).toFixed(2)}" ${g}/>` : "") + `<ellipse ${e} fill="${COL.mus}" opacity="${(op * (o.glow ? .55 : .85)).toFixed(2)}"/>`; };
  const heart = (c, op, sc) => `<path d="M0 3 C-6 -3 -3 -8 0 -4 C3 -8 6 -3 0 3Z" fill="${COL.mus}" opacity="${op.toFixed(2)}" transform="translate(${X(c[0])} ${Y(c[1])}) scale(${(1.5 * sc).toFixed(2)})"/>`;
  const mus = (id, lvl) => {
    const op = lvl === 1 ? .28 + .72 * I : .14 + .34 * I, sc = 1 + (lvl === 1 ? .22 : .1) * I;
    if(id === "card"){ const c = J.v === "side" ? add(lp(J.hip, J.neck, .74), J.n, .02) : add(lp(J.hip, J.neck, .74), J.n, .045); return heart(c, .35 + .65 * I, .9 + .5 * I); }
    let s = "";
    if(J.v === "side"){ const m = MS[id]; if(!m) return "";
      (m[0] === "to" ? [0] : [0, 1]).forEach(i => { const [a, b, w] = seg[m[0]](i), d = nrm(sub(b, a)), fn = m[0] === "to" ? J.n : [-d[1], d[0]];
        s += ell(add(lp(a, b, m[1]), fn, m[2] * w * .42), m[3] * len(sub(b, a)), m[4], d, op * (i === 1 ? .45 : 1), sc); });
    } else if(MFT[id]){ const [fa, lat, rx, ry] = MFT[id], c0 = lp(J.hip, J.neck, fa), d = J.n;
      (lat ? [1, -1] : [0]).forEach(sg => s += ell(add(c0, J.n, lat * sg), rx, ry, d, op, sc));
    } else if(MFL[id]){ const m = MFL[id];
      [0, 1].forEach(i => { const [a, b, w] = seg[m[0]](i), d = nrm(sub(b, a)), out = [J.n[0] * (i ? -1 : 1), J.n[1] * (i ? -1 : 1)];
        s += ell(add(lp(a, b, m[1]), out, m[2] * w * .4), m[3] * len(sub(b, a)), m[4], d, op * (id === "isq" ? .5 : 1), sc); });
    }
    return s; };
  const back = props.filter(q => q.back).map(prim).join(""), front = props.filter(q => q.front).map(prim).join(""), mid = props.filter(q => !q.back && !q.front).map(prim).join("");
  let body;
  if(J.v === "side") body = `<g opacity=".55">${arm(1)}${leg(1)}</g>${torsoSide()}${headSvg()}${leg(0)}${arm(0)}`;
  else body = `${leg(0)}${leg(1)}${torsoFront()}${arm(0)}${arm(1)}${headSvg()}`;
  const ms = (o.prim || []).map(id => mus(id, 1)).join("") + (o.sec || []).map(id => mus(id, 2)).join("");
  const floor = pat.top ? "" : `<line x1="-200" y1="0.5" x2="200" y2="0.5" stroke="var(--line)" stroke-width="2"/>`;
  return `${floor}${back}${mid}${body}${front}${ms}`;
}
function bounds(animId, sexo){
  const pat = PAT[animId] || PAT.agacho; if(pat.box) return pat.box;
  let x1 = 9, x2 = -9, y1 = 9, y2 = -9;
  for(let k = 0; k <= 12; k++){ const { J } = frame(animId, k / 12, sexo); [J.hip, J.neck, J.head, ...J.sh, ...J.hp, ...J.kn, ...J.an, ...J.toe, ...J.el, ...J.ha].forEach(p => { x1 = Math.min(x1, p[0]); x2 = Math.max(x2, p[0]); y1 = Math.min(y1, p[1]); y2 = Math.max(y2, p[1]); }); }
  return [x1 - .22, x2 + .22, Math.min(-.06, y1 - .12), y2 + .2];
}
const BCACHE = {};
function svgOpen(animId, sexo, cls, uid){
  const k = animId + sexo, b = BCACHE[k] || (BCACHE[k] = bounds(animId, sexo));
  const w = b[1] - b[0], h = b[3] - b[2], cx = (b[0] + b[1]) / 2;
  const W2 = Math.max(w, h * .9), H2 = Math.max(h, w * .7);
  return `<svg class="${cls}" viewBox="${((cx - W2 / 2) * 100).toFixed(1)} ${(-(b[2] + H2) * 100).toFixed(1)} ${(W2 * 100).toFixed(1)} ${(H2 * 100).toFixed(1)}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Animação do exercício">` + (uid != null ? `<defs><filter id="mg${uid}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>` : "");
}

/* ---------- API ---------- */
const THUMB = {};
function thumb(ex, sexo){
  const inf = info(ex), k = ex.id + sexo;
  if(THUMB[k]) return THUMB[k];
  const pat = PAT[inf.anim] || PAT.agacho, u = pat.keys || pat.loop ? .3 : .25;
  return THUMB[k] = svgOpen(inf.anim, sexo, "bn-thumb") + draw(inf.anim, frame(inf.anim, u, sexo), { sexo, prim: inf.prim, sec: [], glow: false }) + "</svg>";
}
let ATIVO = null;
function mount(host, ex, opt = {}){
  if(ATIVO) ATIVO.stop();
  const inf = info(ex), pat = PAT[inf.anim] || PAT.agacho, uid = ++UID;
  const st = { sexo: opt.sexo || "f", speed: 1, playing: !opt.paused, t: 0, last: performance.now(), rep: 1, half: 0, raf: 0, dead: false };
  const dur = pat.dur || 3;
  const paint = () => {
    const u = (st.t / dur) % 1, fr = frame(inf.anim, u, st.sexo);
    host.innerHTML = svgOpen(inf.anim, st.sexo, "bn-stage", uid) + draw(inf.anim, fr, { sexo: st.sexo, prim: inf.prim, sec: inf.sec, glow: true, uid }) + "</svg>";
    if(opt.onFrame) opt.onFrame({ cue: fr.cue, rep: st.rep });
  };
  let acc = 0;
  const loop = now => {
    if(st.dead) return;
    if(!host.isConnected){ st.dead = true; return; }
    const dt = Math.min(.1, (now - st.last) / 1000); st.last = now;
    if(st.playing){
      st.t += dt * st.speed;
      const cyc = Math.floor(st.t / dur), half = Math.floor(st.t / (dur / 2));
      if(cyc + 1 !== st.rep){ st.rep = cyc + 1; }
      if(half !== st.half){ st.half = half; if(opt.onBeat) opt.onBeat(half % 2); }
    }
    acc += dt;
    if(acc >= 1 / 30 || !st.drawn){ acc = 0; st.drawn = true; paint(); }
    st.raf = requestAnimationFrame(loop);
  };
  paint(); st.drawn = true;
  st.raf = requestAnimationFrame(loop);
  const api = {
    stop(){ st.dead = true; cancelAnimationFrame(st.raf); if(ATIVO === api) ATIVO = null; },
    toggle(){ st.playing = !st.playing; st.last = performance.now(); return st.playing; },
    setSexo(s){ st.sexo = s; st.drawn = false; },
    setSpeed(v){ st.speed = v; },
    get playing(){ return st.playing; }
  };
  ATIVO = api;
  return api;
}
window.BONECO = { mount, thumb, info, modalidade, MUSC, stop(){ if(ATIVO) ATIVO.stop(); if(window.BONECO._stop3) window.BONECO._stop3(); }, _: { frame, PAT, SEX, L, SHW, HPW } };
})();
