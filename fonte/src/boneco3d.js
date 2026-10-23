/* Boneco 3D: manequim branco brilhante com músculos em vermelho. Usa os mesmos movimentos do boneco 2D.
   Eixos: y para cima, a pessoa olha para +z. Na vista de lado, o "para frente" 2D vira +z. */
(function(){
"use strict";
const B = window.BONECO; if(!B || !window.THREE) return;
const T = window.THREE, X = B._;
let GL = false; try{ const c = document.createElement("canvas"); GL = !!(c.getContext("webgl2") || c.getContext("webgl")); }catch(e){}
if(!GL) return;
const v = (x, y, z) => new T.Vector3(x, y, z);
const DG = Math.PI / 180;
const SH = { m: .2, f: .165 }, HW = { m: .085, f: .095 };
const BACKM = new Set(["costas","lomb","glut","isq","tric","ombroP","trap"]);

/* ---------- Geometrias e materiais ---------- */
const V2 = (r, y) => new T.Vector2(r, y);
const lathe = pts => new T.LatheGeometry([V2(.0001, 0), ...pts.map(([y, r]) => V2(r, y)), V2(.0001, 1)], 32);
const G = { sph: new T.SphereGeometry(1, 36, 26), cyl: new T.CylinderGeometry(1, 1, 1, 28), box: new T.BoxGeometry(1, 1, 1) };
const PROF = {
  m: { th:[[0,.098],[.1,.1],[.45,.084],[.8,.064],[1,.055]], sh:[[0,.055],[.18,.062],[.42,.054],[.8,.037],[1,.032]], ua:[[0,.06],[.4,.054],[.85,.043],[1,.04]], fa:[[0,.046],[.25,.05],[.7,.036],[1,.029]], sl:[[0,.108],[.6,.1],[.92,.095],[1,.09]] },
  f: { th:[[0,.104],[.1,.105],[.45,.084],[.8,.06],[1,.05]], sh:[[0,.05],[.18,.056],[.42,.048],[.8,.033],[1,.028]], ua:[[0,.049],[.4,.044],[.85,.035],[1,.032]], fa:[[0,.038],[.25,.041],[.7,.03],[1,.025]], sl:[[0,.112],[.6,.106],[.92,.1],[1,.095]] }
};
const LGC = {}; const lg = (sx, k) => LGC[sx + k] || (LGC[sx + k] = lathe(PROF[sx][k]));
const MAT = {
  skin: new T.MeshPhysicalMaterial({ color: 0xeeeeee, roughness: .26, metalness: 0, clearcoat: 1, clearcoatRoughness: .1 }),
  cloth: new T.MeshPhysicalMaterial({ color: 0x090909, roughness: .28, metalness: .2, clearcoat: 1, clearcoatRoughness: .18 }),
  red: new T.MeshPhysicalMaterial({ color: 0xe8160a, emissive: 0xc40a00, emissiveIntensity: .6, roughness: .34, clearcoat: 1, clearcoatRoughness: .15 }),
  red2: new T.MeshPhysicalMaterial({ color: 0xf06a5c, emissive: 0x9a1408, emissiveIntensity: .25, roughness: .3, clearcoat: 1, clearcoatRoughness: .15 }),
  halo0: null,
  halo: new T.MeshBasicMaterial({ color: 0xff2a14, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false }),
  halo2: new T.MeshBasicMaterial({ color: 0xff4a30, transparent: true, opacity: .12, blending: T.AdditiveBlending, depthWrite: false }),
  chrome: new T.MeshPhysicalMaterial({ color: 0xc4c8ce, metalness: .95, roughness: .22 }),
  pad: new T.MeshStandardMaterial({ color: 0x161616, roughness: .75, metalness: 0, envMapIntensity: .3 }),
  iron: new T.MeshPhysicalMaterial({ color: 0x141414, metalness: .55, roughness: .3, clearcoat: .7 }),
  cable: new T.MeshStandardMaterial({ color: 0x8a8a8a, metalness: .7, roughness: .35 }),
  mat: new T.MeshStandardMaterial({ color: 0x0f2716, roughness: .85 })
};
Object.values(MAT).forEach(m => { if(!m) return; if(m.color && m !== MAT.skin) m.color.convertSRGBToLinear(); if(m.emissive) m.emissive.convertSRGBToLinear(); });
[MAT.red, MAT.red2, MAT.halo, MAT.halo2].forEach(m => m.toneMapped = false);
MAT.halo.blending = MAT.halo2.blending = T.NormalBlending;

/* ---------- Anatomia ---------- */
const sym = (o, d) => [{ ...o, off: [d, o.off[1]] }, { ...o, off: [-d, o.off[1]] }];
const LIMB = {
  m: [
    { seg:"th", at:.52, off:[0,.042], rad:[.07,.18,.06], mus:"quad" }, { seg:"th", at:.8, off:[-.028,.03], rad:[.042,.07,.04], mus:"quad" }, { seg:"th", at:.6, off:[.03,.025], rad:[.04,.13,.04], mus:"quad" },
    { seg:"th", at:.5, off:[0,-.036], rad:[.056,.16,.046], mus:"isq" }, { seg:"th", at:.28, off:[-.045,0], rad:[.036,.12,.046], mus:"adut" }, { seg:"th", at:.06, off:[.045,0], rad:[.05,.07,.06], mus:"abdut", mat:"cloth" },
    { seg:"sh", at:.27, off:[.008,-.03], rad:[.048,.12,.046], mus:"pant" }, { seg:"sh", at:.24, off:[-.012,-.028], rad:[.04,.1,.04], mus:"pant" },
    { seg:"ua", at:.02, off:[.016,0], rad:[.08,.095,.082], mus:"ombro" }, { seg:"ua", at:.06, off:[.012,-.038], rad:[.046,.06,.036], mus:"ombroP" },
    { seg:"ua", at:.56, off:[0,.03], rad:[.05,.11,.05], mus:"bic" }, { seg:"ua", at:.45, off:[.005,-.032], rad:[.052,.14,.05], mus:"tric" },
    { seg:"fa", at:.27, off:[.006,.004], rad:[.047,.1,.043], mus:"antb" }
  ],
  f: [
    { seg:"th", at:.5, off:[0,.032], rad:[.06,.16,.05], mus:"quad" }, { seg:"th", at:.8, off:[-.024,.026], rad:[.036,.06,.034], mus:"quad" },
    { seg:"th", at:.48, off:[0,-.036], rad:[.058,.16,.048], mus:"isq" }, { seg:"th", at:.28, off:[-.048,0], rad:[.038,.12,.048], mus:"adut" }, { seg:"th", at:.06, off:[.05,0], rad:[.052,.07,.062], mus:"abdut", mat:"cloth" },
    { seg:"sh", at:.27, off:[.006,-.028], rad:[.044,.11,.042], mus:"pant" },
    { seg:"ua", at:.02, off:[.012,0], rad:[.058,.07,.06], mus:"ombro" }, { seg:"ua", at:.06, off:[.01,-.032], rad:[.04,.05,.03], mus:"ombroP" },
    { seg:"ua", at:.56, off:[0,.022], rad:[.034,.09,.034], mus:"bic" }, { seg:"ua", at:.45, off:[.004,-.024], rad:[.036,.12,.035], mus:"tric" },
    { seg:"fa", at:.27, off:[.005,.003], rad:[.038,.09,.035], mus:"antb" }
  ]
};
const TORSO = {
  m: [
    { at:.075, off:[0,-.025], rad:[.19,.13,.155], mat:"cloth" },
    { at:.22, off:[0,0], rad:[.128,.12,.096] }, { at:.4, off:[0,0], rad:[.168,.15,.112] }, { at:.48, off:[0,-.01], rad:[.185,.085,.1] },
    ...sym({ at:.45, off:[0,.078], rad:[.086,.068,.046], mus:"peito" }, .074),
    ...[.14, .205, .27].flatMap(a => sym({ at:a, off:[0,.088], rad:[.032,.03,.022], mus:"abd" }, .036)),
    ...sym({ at:.22, off:[0,.025], rad:[.042,.095,.062], mus:"obl" }, .102),
    ...sym({ at:.36, off:[0,-.045], rad:[.064,.135,.072], mus:"costas" }, .108),
    { at:.53, off:[0,-.04], rad:[.125,.06,.062], mus:"trap" },
    ...sym({ at:.19, off:[0,-.078], rad:[.036,.095,.032], mus:"lomb" }, .042),
    ...sym({ at:.035, off:[0,-.06], rad:[.08,.08,.07], mus:"glut", mat:"cloth" }, .07)
  ],
  f: [
    { at:.07, off:[0,-.03], rad:[.2,.13,.162], mat:"cloth" },
    { at:.23, off:[0,0], rad:[.108,.12,.088] }, { at:.4, off:[0,0], rad:[.142,.14,.102] }, { at:.48, off:[0,-.01], rad:[.155,.075,.092] },
    { at:.43, off:[0,.004], rad:[.15,.06,.11], mat:"cloth" },
    ...sym({ at:.43, off:[0,.07], rad:[.052,.052,.046], mat:"cloth" }, .053),
    ...sym({ at:.5, off:[0,.07], rad:[.06,.035,.03], mus:"peito" }, .06),
    ...[.17, .25].flatMap(a => sym({ at:a, off:[0,.078], rad:[.028,.034,.018], mus:"abd" }, .03)),
    ...sym({ at:.24, off:[0,.02], rad:[.036,.095,.055], mus:"obl" }, .088),
    ...sym({ at:.35, off:[0,-.042], rad:[.055,.12,.062], mus:"costas" }, .092),
    { at:.53, off:[0,-.036], rad:[.1,.05,.052], mus:"trap" },
    ...sym({ at:.2, off:[0,-.07], rad:[.032,.09,.028], mus:"lomb" }, .036),
    ...sym({ at:.03, off:[0,-.07], rad:[.088,.088,.078], mus:"glut", mat:"cloth" }, .076)
  ]
};
function figura(sx){ return H.ready ? figuraH(sx) : figuraV(sx); }
function figuraV(sx){
  const g = new T.Group(), P = [], f = sx === "f";
  const mk = (geo, mat) => { const m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  [0, 1].forEach(i => {
    ["th","sh","ua","fa"].forEach(seg => P.push({ t: "limb", seg, i, m: mk(lg(sx, seg), MAT.skin) }));
    P.push({ t: "limb", seg: "th", i, frac: .3, m: mk(lg(sx, "sl"), MAT.cloth) });
    P.push({ t: "joint", at: "kn", i, r: f ? .046 : .05, m: mk(G.sph, MAT.skin) });
    P.push({ t: "joint", at: "an", i, r: f ? .029 : .032, m: mk(G.sph, MAT.skin) });
    P.push({ t: "joint", at: "el", i, r: f ? .032 : .038, m: mk(G.sph, MAT.skin) });
    P.push({ t: "foot", i, m: mk(G.sph, MAT.skin) });
    P.push({ t: "hand", i, m: mk(G.sph, MAT.skin) });
    LIMB[sx].forEach(d => P.push({ t: "lm", i, ...d, m: mk(G.sph, MAT[d.mat || "skin"]) }));
  });
  TORSO[sx].forEach(d => P.push({ t: "tm", ...d, m: mk(G.sph, MAT[d.mat || "skin"]) }));
  P.push({ t: "neck", m: mk(G.cyl, MAT.skin) }, { t: "head", m: mk(G.sph, MAT.skin) });
  if(f) P.push({ t: "pony", m: mk(G.sph, MAT.skin) }, { t: "tail", m: mk(G.sph, MAT.skin) });
  P.forEach(p => { if(p.mus){ p.base = p.m.material; p.halo = new T.Mesh(G.sph, MAT.halo); p.halo.visible = false; p.halo.renderOrder = 2; g.add(p.halo); } });
  return { g, P, sx };
}

/* ---------- 2D -> 3D ---------- */
const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function map3(J, pat, sx){
  const L = X.L, side = J.v === "side", top = !!pat.top, K = { side, top };
  const keys = ["hp","kn","an","toe","sh","el","ha"];
  if(top){
    const H = .5, P = p => v(p[0], H, -(p[1] - .55));
    K.hip = P(J.hip); K.neck = P(J.neck); K.head = P(J.head);
    keys.forEach(k => K[k] = J[k].map(P));
    [0, 1].forEach(i => {
      K.el[i].y = H + Math.sqrt(Math.max(0, L.ua * L.ua - d2(J.el[i], J.sh[i]) ** 2));
      K.ha[i].y = K.el[i].y + Math.sqrt(Math.max(0, L.fa * L.fa - d2(J.ha[i], J.el[i]) ** 2));
      K.an[i].y = H - Math.sqrt(Math.max(0, L.sh * L.sh - d2(J.an[i], J.kn[i]) ** 2));
      K.toe[i] = K.an[i].clone().add(v(0, -.02, .12));
    });
    K.U = v(0, 0, -1); K.Fw = v(0, 1, 0);
    K.fr = { th: [v(0, 1, 0), v(0, 1, 0)], sh: [v(0, 0, 1), v(0, 0, 1)], ua: [v(0, 0, 1), v(0, 0, 1)], fa: [v(0, 0, 1), v(0, 0, 1)] };
  } else if(side){
    const P = (p, lat = 0) => v(lat, p[1], p[0]), hw = HW[sx], sw = SH[sx];
    K.hip = P(J.hip); K.neck = P(J.neck); K.head = P(J.head);
    const lat = { hp: hw, kn: hw * .95, an: hw * .9, toe: hw * .9, sh: sw, el: sw + .025, ha: sw + .01 };
    keys.forEach(k => K[k] = J[k].map((p, i) => P(p, (i ? -1 : 1) * lat[k])));
    K.U = K.neck.clone().sub(K.hip).normalize(); K.Fw = v(0, J.n[1], J.n[0]);
    const fr = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return v(0, dx / l, -dy / l); };
    K.fr = { th: [0, 1].map(i => fr(J.hp[i], J.kn[i])), sh: [0, 1].map(i => fr(J.kn[i], J.an[i])), ua: [0, 1].map(i => fr(J.sh[i], J.el[i])), fa: [0, 1].map(i => fr(J.el[i], J.ha[i])) };
  } else {
    const P = p => v(p[0], p[1], 0);
    K.hip = P(J.hip); K.neck = P(J.neck); K.head = P(J.head);
    keys.forEach(k => K[k] = J[k].map(P));
    const tl = (J.P && J.P.tl) || 1;
    if(tl < 1){
      const zs = Math.sqrt(Math.max(0, 1 - tl * tl));
      K.neck.z = zs * L.to; K.head.z = zs * (L.to + L.nk + L.hd * .9);
      ["sh","el","ha"].forEach(k => K[k].forEach(p => p.z = zs * L.so));
    }
    K.U = K.neck.clone().sub(K.hip).normalize(); K.Fw = v(0, 0, 1);
    const z = [v(0, 0, 1), v(0, 0, 1)]; K.fr = { th: z, sh: z, ua: z, fa: z };
  }
  K.Fw.sub(K.U.clone().multiplyScalar(K.Fw.dot(K.U))).normalize();
  K.R = new T.Vector3().crossVectors(K.U, K.Fw).normalize();
  return K;
}

/* ---------- Pose do boneco ---------- */
const MT = new T.Matrix4(), Y = v(0, 1, 0);
const basisQ = (x, y, z, q) => { MT.makeBasis(x, y, z); q.setFromRotationMatrix(MT); };
const SEGP = { th: ["hp","kn"], sh: ["kn","an"], ua: ["sh","el"], fa: ["el","ha"] };
function poseFig(F, K, I, prim, sec){
  if(F.H){ poseH(F, K); musH(F, prim, sec); return; }
  const cache = {};
  const segInfo = (seg, i) => {
    const k = seg + i; if(cache[k]) return cache[k];
    const A = K[SEGP[seg][0]][i], Bp = K[SEGP[seg][1]][i], d = Bp.clone().sub(A), L = d.length() || .001; d.divideScalar(L);
    let fr = K.fr[seg][i].clone(); fr.sub(d.clone().multiplyScalar(fr.dot(d)));
    if(fr.lengthSq() < .01){ fr = K.Fw.clone().sub(d.clone().multiplyScalar(K.Fw.dot(d))); if(fr.lengthSq() < .01) fr = v(0, 0, 1); }
    fr.normalize();
    const lat = new T.Vector3().crossVectors(d, fr).normalize();
    const out = K.R.clone().multiplyScalar(i ? -1 : 1); out.sub(d.clone().multiplyScalar(out.dot(d))); if(out.lengthSq() < .001) out.copy(lat); out.normalize();
    return cache[k] = { A, d, L, fr, lat, out };
  };
  for(const p of F.P){
    const m = p.m;
    if(p.t === "limb"){ const s = segInfo(p.seg, p.i); m.position.copy(s.A); basisQ(s.lat, s.d, s.fr, m.quaternion); m.scale.set(1, s.L * (p.frac || 1), 1); }
    else if(p.t === "lm"){ const s = segInfo(p.seg, p.i); m.position.copy(s.A).addScaledVector(s.d, s.L * p.at).addScaledVector(s.out, p.off[0]).addScaledVector(s.fr, p.off[1]); basisQ(s.lat, s.d, s.fr, m.quaternion); m.scale.set(p.rad[0], p.rad[1], p.rad[2]); }
    else if(p.t === "tm"){ m.position.copy(K.hip).addScaledVector(K.U, p.at).addScaledVector(K.R, p.off[0]).addScaledVector(K.Fw, p.off[1]); basisQ(K.R, K.U, K.Fw, m.quaternion); m.scale.set(p.rad[0], p.rad[1], p.rad[2]); }
    else if(p.t === "joint"){ m.position.copy(K[p.at][p.i]); m.scale.setScalar(p.r); }
    else if(p.t === "foot"){ const a = K.an[p.i], b = K.toe[p.i], d = b.clone().sub(a), L = d.length() || .01; m.position.copy(a).addScaledVector(d, .45).add(v(0, -.012, 0)); m.quaternion.setFromUnitVectors(Y, d.normalize()); m.scale.set(.042, L * .62 + .02, .03); }
    else if(p.t === "hand"){ const s = segInfo("fa", p.i); m.position.copy(s.A).addScaledVector(s.d, s.L + .035); basisQ(s.lat, s.d, s.fr, m.quaternion); const k = F.sx === "f" ? .85 : 1; m.scale.set(.034 * k, .052 * k, .027 * k); }
    else if(p.t === "neck"){ const a = K.neck.clone().addScaledVector(K.U, -.04), b = K.head.clone().addScaledVector(K.U, -.07), d = b.clone().sub(a), L = d.length(); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(Y, d.normalize()); const r = F.sx === "f" ? .038 : .05; m.scale.set(r, L, r); }
    else if(p.t === "head"){ m.position.copy(K.head); basisQ(K.R, K.U, K.Fw, m.quaternion); if(F.sx === "f") m.scale.set(.079, .106, .092); else m.scale.set(.084, .112, .098); }
    else if(p.t === "pony"){ m.position.copy(K.head).addScaledVector(K.Fw, -.085).addScaledVector(K.U, .035); basisQ(K.R, K.U, K.Fw, m.quaternion); m.scale.set(.045, .05, .045); }
    else if(p.t === "tail"){ m.position.copy(K.head).addScaledVector(K.Fw, -.115).addScaledVector(K.U, -.06); basisQ(K.R, K.U, K.Fw, m.quaternion); m.scale.set(.033, .1, .032); }
    if(p.mus){
      const lvl = prim.includes(p.mus) ? 1 : sec.includes(p.mus) ? 2 : 0;
      if(lvl){
        m.material = lvl === 1 ? MAT.red : MAT.red2;
        if(lvl === 1) m.scale.multiplyScalar(1 + .07 * I);
        if(p.base === MAT.cloth){ m.scale.multiplyScalar(1.1); const o = m.position.clone().sub(K.hip); o.sub(K.U.clone().multiplyScalar(o.dot(K.U))); if(o.lengthSq() > 1e-6) m.position.addScaledVector(o.normalize(), .07); }
        p.halo.visible = true; p.halo.material = lvl === 1 ? MAT.halo : MAT.halo2;
        p.halo.position.copy(m.position); p.halo.quaternion.copy(m.quaternion); p.halo.scale.copy(m.scale).multiplyScalar(lvl === 1 ? 1.14 + .06 * I : 1.08);
      } else { m.material = p.base; p.halo.visible = false; }
    }
  }
}

/* ---------- Aparelhos ---------- */
function props3(grp, pat, J, P, K){
  (grp.userData.tmp || []).forEach(g => g.dispose()); grp.userData.tmp = [];
  grp.clear();
  const prims = pat.props ? pat.props(J, P) : [], side = K.side, top = K.top;
  const P3 = side ? p => v(0, p[1], p[0]) : top ? p => v(p[0], .5, -(p[1] - .55)) : p => v(p[0], p[1], 0);
  const LAT = side || top ? v(1, 0, 0) : v(0, 0, 1);
  const add = (geo, mat) => { const m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; grp.add(m); return m; };
  const box = (c, sx, sy, sz, mat, q) => { const m = add(G.box, mat); m.position.copy(c); m.scale.set(sx, sy, sz); if(q) m.quaternion.copy(q); return m; };
  const cylAB = (a, b, r, mat) => { const d = b.clone().sub(a), L = d.length() || .001, m = add(G.cyl, mat); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(Y, d.normalize()); m.scale.set(r, L, r); return m; };
  const cylAx = (c, ax, len, r, mat) => cylAB(c.clone().addScaledVector(ax, -len / 2), c.clone().addScaledVector(ax, len / 2), r, mat);
  const dumb = (c0, i) => { const c = i == null ? c0 : c0.clone().addScaledVector(K.ha[i].clone().sub(K.el[i]).normalize(), .075); cylAx(c, LAT, .17, .013, MAT.chrome); [-1, 1].forEach(s => cylAx(c.clone().addScaledVector(LAT, s * .078), LAT, .045, .052, MAT.iron)); };
  const rings = [];
  for(const q of prims){
    if(q.p){
      const xs = q.p.map(p => p[0]), ys = q.p.map(p => p[1]), x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
      if(top) box(v((x1 + x2) / 2, .21, -((y1 + y2) / 2 - .55)), x2 - x1, .42, y2 - y1, MAT.pad);
      else if(side) box(v(0, (y1 + y2) / 2, (x1 + x2) / 2), .4, y2 - y1, x2 - x1, MAT.pad);
      else box(v((x1 + x2) / 2, (y1 + y2) / 2, -.12), x2 - x1, y2 - y1, .4, MAT.pad);
    } else if(q.l){
      const a = P3(q.l[0]), b = P3(q.l[1]);
      if(q.c === "ink") cylAB(a, b, .005, MAT.cable);
      else if(q.c === "mat"){ const c = a.clone().lerp(b, .5); c.y = .006; box(c, side ? .7 : a.distanceTo(b), .012, side ? a.distanceTo(b) : .7, MAT.mat); }
      else if(q.front && q.w < .06){ if(side) cylAx(a.clone().lerp(b, .5), LAT, 1, .016, MAT.chrome); else cylAB(a, b, .014, MAT.chrome); }
      else if(q.w >= .06){ const d = b.clone().sub(a), L = d.length(), m = box(a.clone().lerp(b, .5), side ? .36 : q.w, L, side ? q.w : .36, MAT.pad); m.quaternion.setFromUnitVectors(Y, d.normalize()); }
      else if(side){ [-1, 1].forEach(s => cylAB(a.clone().add(v(s * .16, 0, 0)), b.clone().add(v(s * .16, 0, 0)), q.w / 2, MAT.chrome)); }
      else cylAB(a, b, q.w / 2, MAT.chrome);
    } else if(q.q){
      const curve = new T.QuadraticBezierCurve3(P3(q.q[0]), P3(q.q[1]), P3(q.q[2])), geo = new T.TubeGeometry(curve, 30, .006, 6, false);
      grp.userData.tmp.push(geo); add(geo, MAT.cable);
    } else if(q.c){
      const c = P3(q.c);
      if(q.f === "prop" && q.front) continue;
      if(q.ring){ rings.push(q.c); if(side || top){ cylAx(c, LAT, 1.6, .014, MAT.chrome); [-1, 1].forEach(s => { cylAx(c.clone().addScaledVector(LAT, s * .58), LAT, .07, q.r, MAT.iron); cylAx(c.clone().addScaledVector(LAT, s * .5), LAT, .03, q.r * .75, MAT.iron); }); } continue; }
      if(rings.some(r => d2(r, q.c) < .05)) continue;
      const hi = [0, 1].filter(i => d2(J.ha[i], q.c) < .05);
      if(q.r >= .07 && q.front){ const m = add(G.sph, MAT.iron); m.position.copy(c); m.scale.setScalar(q.r); }
      else if(hi.length && q.r >= .045){ hi.forEach(i => dumb(K.ha[i], i)); }
      else if(hi.length){ cylAx(c, LAT, 1.1, .014, MAT.chrome); }
      else if(q.r <= .04) cylAx(c, LAT, .05, q.r, MAT.chrome);
      else cylAx(c, LAT, .34, q.r, MAT.pad);
    }
  }
}

/* ---------- Cena ---------- */
function floorTex(){
  const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(.5, "rgba(255,255,255,.06)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
}
let FT = null;
function cena(R){
  const sc = new T.Scene(); sc.background = new T.Color(0x0B241D).convertSRGBToLinear();
  const es = new T.Scene(); es.background = new T.Color(0x000000);
  [[0, 3, 2, 3, .2, 2], [-3, 1.5, 0, .2, 2, 3], [3, 2, -1, .2, 2, 2], [0, 1, -3, 3, 1.5, .2]].forEach(([x, y, z, a, b, c]) => { const m = new T.Mesh(G.box, new T.MeshBasicMaterial({ color: 0xffffff })); m.position.set(x, y, z); m.scale.set(a, b, c); es.add(m); });
  const pm = new T.PMREMGenerator(R); sc.environment = pm.fromScene(es, .04).texture; pm.dispose();
  sc.add(new T.HemisphereLight(0xffffff, 0x1a1a1a, .35));
  const key = new T.DirectionalLight(0xffffff, 1.35); key.position.set(2.2, 4.5, 3.2); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -2.2, right: 2.2, top: 3, bottom: -1.5, near: .5, far: 12 }); key.shadow.bias = -.0004; key.shadow.radius = 5;
  sc.add(key);
  const rim = new T.DirectionalLight(0xffffff, 1.2); rim.position.set(-3, 3.2, -3.5); sc.add(rim);
  const rim2 = new T.DirectionalLight(0xe6ecff, .7); rim2.position.set(3.4, 2, -3); sc.add(rim2);
  const fill = new T.DirectionalLight(0xffffff, .3); fill.position.set(-3, 1.4, 2.6); sc.add(fill);
  FT = FT || floorTex();
  const spot = new T.Mesh(new T.CircleGeometry(1.6, 64), new T.MeshBasicMaterial({ map: FT, transparent: true, depthWrite: false })); spot.rotation.x = -Math.PI / 2; spot.position.y = .001; sc.add(spot);
  const sh = new T.Mesh(new T.PlaneGeometry(12, 12), new T.ShadowMaterial({ opacity: .55 })); sh.rotation.x = -Math.PI / 2; sh.position.y = .002; sh.receiveShadow = true; sc.add(sh);
  return sc;
}
function renderer(canvas, keep){
  const R = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!keep, powerPreference: "high-performance" });
  R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.outputEncoding = T.sRGBEncoding;
  R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  return R;
}
function enquadra(anim, pat, sx, inf){
  const bb = new T.Box3();
  for(let k = 0; k <= 10; k++){ const fr = X.frame(anim, k / 10, sx), K = map3(fr.J, pat, sx); [K.hip, K.neck, K.head, ...K.sh, ...K.hp, ...K.kn, ...K.an, ...K.toe, ...K.el, ...K.ha].forEach(p => bb.expandByPoint(p)); }
  bb.expandByScalar(.16); bb.min.y = Math.min(bb.min.y, 0);
  const c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3());
  const back = inf.prim.some(m => BACKM.has(m)) && !inf.prim.some(m => ["peito","abd","quad","bic","ombro","card"].includes(m));
  const side = !pat.view || pat.view === "side";
  const az = pat.top ? 50 : back ? (side ? 140 : 165) : side ? 62 : 22;
  return { c, s, az: az * DG, el: (pat.top ? 34 : 13) * DG };
}
function camPos(cam, fit, az, el, aspect){
  const half = Math.tan(cam.fov * DG / 2);
  const need = Math.max(fit.s.y, Math.max(fit.s.x, fit.s.z) / Math.max(.6, aspect)) * .5;
  const d = need / half * 1.08 + .6;
  cam.position.set(fit.c.x + Math.sin(az) * Math.cos(el) * d, fit.c.y + Math.sin(el) * d, fit.c.z + Math.cos(az) * Math.cos(el) * d);
  cam.lookAt(fit.c);
}
function setGlow(I){ if(H.mat) H.mat.userData.u.uI.value = I; MAT.red.emissiveIntensity = .3 + .9 * I; MAT.red2.emissiveIntensity = .1 + .3 * I; MAT.halo.opacity = .05 + .16 * I; MAT.halo2.opacity = .02 + .05 * I; }


/* ---------- Corpo humano 3D (modelo Xbot, manequim Mixamo) ---------- */
const H = { ready: false, fail: false };
const MUSCS = ["quad","isq","adut","abdut","glut","pant","abd","obl","lomb","costas","trap","peito","ombro","ombroP","bic","tric","antb","card"];
const sm = (x, a, b) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const band = (t, a, b, e = .05) => sm(t, a - e, a + e) * (1 - sm(t, b - e, b + e));
const gs = (x, m, s) => Math.exp(-((x - m) * (x - m)) / (2 * s * s));
const nomeOsso = n => n.replace(/^mixamorig:?/, "");
const GETC = ["getX","getY","getZ","getW"];
function dominante(si, sw, i){ let best = -1, bi = 0; for(let k = 0; k < 4; k++){ const w = sw[GETC[k]](i); if(w > best){ best = w; bi = si[GETC[k]](i); } } return bi; }
function classifica(mesh, BP, L){
  const geo = mesh.geometry, pos = geo.attributes.position, si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight, N = pos.count;
  const bn = mesh.skeleton.bones.map(b => nomeOsso(b.name).replace(/^(Left|Right)/, ""));
  const W = {}; MUSCS.forEach(m => W[m] = new Float32Array(N));
  const cm = new Float32Array(N), cf = new Float32Array(N), BASE = new Array(N), v = new T.Vector3();
  const zc = BP.Spine.z, up = BP.LeftUpLeg, lg = BP.LeftLeg, ar = BP.LeftArm, fa = BP.LeftForeArm;
  for(let i = 0; i < N; i++){
    v.fromBufferAttribute(pos, i);
    const b = bn[dominante(si, sw, i)]; BASE[i] = b;
    const y = v.y, ax = Math.abs(v.x);
    if(b === "UpLeg"){
      const t = (up.y - y) / L.th, rx = ax - up.x, rz = v.z - up.z, rl = Math.hypot(rx, rz) || 1, fr = rz / rl, out = rx / rl;
      W.quad[i] = sm(fr, -.35, .2) * band(t, .15, .95);
      W.isq[i] = sm(-fr, .1, .5) * band(t, .22, .95);
      W.adut[i] = sm(-out, .35, .75) * band(t, .05, .6) * (1 - sm(fr, .4, .8));
      W.abdut[i] = sm(out, .3, .7) * band(t, -.1, .28);
      W.glut[i] = sm(-fr, -.1, .4) * band(t, -.3, .2, .08);
    } else if(b === "Leg"){
      const t = (lg.y - y) / L.sh, rz = v.z - lg.z, rl = Math.hypot(ax - lg.x, rz) || 1;
      W.pant[i] = sm(-rz / rl, -.2, .3) * band(t, .04, .6);
    } else if(b === "Arm" || b === "Shoulder"){
      const t = (ax - ar.x) / L.ua, rz = v.z - ar.z, rl = Math.hypot(v.y - ar.y, rz) || 1, fr = rz / rl;
      if(b === "Shoulder" && ax < ar.x - .05){ W.trap[i] = sm(-fr, -.2, .3) * sm(v.y - (BP.Spine2.y + .06), 0, .04); }
      else {
        W.ombro[i] = band(t, -.35, .32) * sm(fr, -.5, 0);
        W.ombroP[i] = band(t, -.35, .32) * sm(-fr, .1, .5);
        W.bic[i] = band(t, .3, .95) * sm(fr, .1, .5);
        W.tric[i] = band(t, .25, .95) * sm(-fr, .05, .45);
      }
    } else if(b === "ForeArm"){
      W.antb[i] = band((ax - fa.x) / L.fa, 0, .65);
    } else if(["Hips","Spine","Spine1","Spine2","Neck"].includes(b)){
      const rz = v.z - zc, rl = Math.hypot(v.x, rz) || 1, fr = rz / rl, sd = ax / rl;
      W.glut[i] = sm(-fr, .15, .6) * band(y, up.y - .14, BP.Hips.y + .07);
      W.abdut[i] = sm(sd, .75, .95) * band(y, up.y - .05, BP.Hips.y + .04);
      W.abd[i] = sm(fr, .55, .85) * band(y, BP.Hips.y - .02, BP.Spine2.y - .01) * sm(.13 - ax, 0, .03);
      W.obl[i] = sm(sd, .55, .85) * sm(fr, -.4, .1) * band(y, BP.Hips.y, BP.Spine1.y + .05);
      W.lomb[i] = sm(-fr, .6, .9) * band(y, BP.Hips.y - .02, BP.Spine1.y);
      W.costas[i] = sm(-fr, .15, .55) * band(y, BP.Spine1.y - .05, BP.Spine2.y + .1);
      W.trap[i] = sm(-fr, -.1, .4) * band(y, BP.Spine2.y + .08, BP.Neck.y + .06) * sm(.2 - ax, 0, .05);
      W.peito[i] = sm(fr, .35, .7) * band(y, BP.Spine2.y - .02, ar.y + .01) * sm(.2 - ax, 0, .04);
      W.card[i] = gs(v.x, .06, .045) * gs(y, BP.Spine2.y + .04, .045) * sm(fr, .4, .7);
    }
    if(["Hips","Spine","UpLeg"].includes(b)){ const s = band(y, up.y - .3 * L.th, BP.Hips.y + .075, .006); cm[i] = s; cf[i] = s; }
    if(["Spine1","Spine2","Shoulder"].includes(b)) cf[i] = Math.max(cf[i], band(y, BP.Spine2.y - .055, BP.Spine2.y + .085, .006));
  }
  return { W, cm, cf, BASE };
}
function femea(mesh, BP, BASE){
  const g = mesh.geometry.clone(), pos = g.attributes.position, N = pos.count, v = new T.Vector3();
  const zc = BP.Spine.z, up = BP.LeftUpLeg;
  for(let i = 0; i < N; i++){
    v.fromBufferAttribute(pos, i);
    const b = BASE[i], y = v.y, ax = Math.abs(v.x), s = v.x < 0 ? -1 : 1, torso = ["Hips","Spine","Spine1","Spine2"].includes(b);
    if(torso){ const k = gs(y, BP.Spine1.y - .03, .07); v.x *= 1 - .15 * k; v.z = zc + (v.z - zc) * (1 - .06 * k); }
    if(torso || b === "UpLeg"){
      v.x *= 1 + .09 * gs(y, up.y - .03, .07);
      if(v.z < zc) v.z -= .04 * gs(y, up.y - .05, .06) * sm(zc - v.z, 0, .07);
    }
    if(["Spine1","Spine2","Shoulder"].includes(b)){
      if(y > BP.Spine2.y - .05) v.x *= .93;
      if(v.z > zc){ const k = gs(ax * .93, .072, .04) * gs(y, BP.Spine2.y + .035, .043); v.z += .052 * k; v.y -= .012 * k; }
    }
    if(b === "Arm" || b === "ForeArm"){ const a = b === "Arm" ? BP.LeftArm : BP.LeftForeArm; v.y = a.y + (v.y - a.y) * .82; v.z = a.z + (v.z - a.z) * .82; }
    if(b === "Neck"){ v.x *= .85; v.z = BP.Neck.z + (v.z - BP.Neck.z) * .85; }
    if(b === "Leg"){ const a = BP.LeftLeg; v.x = s * (a.x + (ax - a.x) * .92); v.z = a.z + (v.z - a.z) * .92; }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
function matHumano(){
  const m = new T.MeshPhysicalMaterial({ color: new T.Color(0xf2f2f2).convertSRGBToLinear(), roughness: .2, metalness: 0, clearcoat: 1, clearcoatRoughness: .07 });
  const u = { uI: { value: .8 }, uR1: { value: new T.Color(0xe3150a).convertSRGBToLinear() }, uR2: { value: new T.Color(0xf07a6c).convertSRGBToLinear() }, uC: { value: new T.Color(0x0b0b0b).convertSRGBToLinear() } };
  m.userData.u = u;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = "attribute vec2 aMus;\nattribute float aCloth;\nvarying vec2 vMus;\nvarying float vCloth;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvMus = aMus; vCloth = aCloth;");
    sh.fragmentShader = "uniform float uI;\nuniform vec3 uR1;\nuniform vec3 uR2;\nuniform vec3 uC;\nvarying vec2 vMus;\nvarying float vCloth;\n" + sh.fragmentShader
      .replace("#include <color_fragment>", "#include <color_fragment>\nfloat cl = clamp(vCloth, 0.0, 1.0);\nfloat mA = clamp(vMus.x, 0.0, 1.0) * (1.0 - 0.6 * cl);\nfloat mB = clamp(vMus.y, 0.0, 1.0) * (1.0 - mA) * (1.0 - 0.75 * cl);\ndiffuseColor.rgb = mix(diffuseColor.rgb, uC, cl);\ndiffuseColor.rgb = mix(diffuseColor.rgb, uR1, mA * (0.72 + 0.28 * uI));\ndiffuseColor.rgb = mix(diffuseColor.rgb, uR2, mB * 0.8);")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uR1 * mA * (0.12 + 0.8 * uI) + uR2 * mB * 0.12;");
  };
  return m;
}
function prepara(sc){
  sc.updateMatrixWorld(true);
  const BP = {}; sc.traverse(o => { if(o.isBone) BP[nomeOsso(o.name)] = o.getWorldPosition(new T.Vector3()); });
  const L = X.L, up = BP.LeftUpLeg;
  L.th = up.distanceTo(BP.LeftLeg); L.sh = BP.LeftLeg.distanceTo(BP.LeftFoot);
  L.ua = BP.LeftArm.distanceTo(BP.LeftForeArm); L.fa = BP.LeftForeArm.distanceTo(BP.LeftHand);
  L.so = BP.LeftArm.y - up.y; L.to = BP.Neck.y - up.y;
  const hc = (BP.Head.y + BP.HeadTop_End.y) / 2 - up.y; L.hd = .1; L.nk = Math.max(.02, hc - L.to - .09);
  SH.m = SH.f = X.SHW.m = X.SHW.f = BP.LeftArm.x; HW.m = HW.f = X.HPW.m = X.HPW.f = up.x;
  H.BP = BP; H.hipOff = new T.Vector3(0, BP.Hips.y - up.y, BP.Hips.z - up.z);
  H.geo = {};
  sc.traverse(o => {
    if(!o.isSkinnedMesh) return;
    const c = classifica(o, BP, L), N = o.geometry.attributes.position.count;
    const gm = o.geometry.clone(), gf = femea(o, BP, c.BASE);
    gm.setAttribute("aCloth", new T.BufferAttribute(c.cm, 1)); gf.setAttribute("aCloth", new T.BufferAttribute(c.cf, 1));
    [gm, gf].forEach(g => { g.setAttribute("aMus", new T.BufferAttribute(new Float32Array(N * 2), 2)); g.attributes.aMus.setUsage(T.DynamicDrawUsage); });
    H.geo[o.name] = { m: gm, f: gf, W: c.W };
  });
  H.tpl = sc; H.mat = matHumano();
  H.hair = new T.MeshPhysicalMaterial({ color: new T.Color(0xeeeeee).convertSRGBToLinear(), roughness: .32, clearcoat: .8, clearcoatRoughness: .2 });
}
function montaGLB(j){
  const u = j.buffers[0].uri, s = atob(u.slice(u.indexOf(",") + 1)), bin = new Uint8Array(s.length);
  for(let i = 0; i < s.length; i++) bin[i] = s.charCodeAt(i);
  delete j.buffers[0].uri; j.buffers[0].byteLength = bin.length;
  let js = new TextEncoder().encode(JSON.stringify(j));
  const jl = Math.ceil(js.length / 4) * 4, bl = Math.ceil(bin.length / 4) * 4, total = 12 + 8 + jl + 8 + bl;
  const buf = new ArrayBuffer(total), dv = new DataView(buf), u8 = new Uint8Array(buf);
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jl, true); dv.setUint32(16, 0x4E4F534A, true); u8.set(js, 20); for(let i = 20 + js.length; i < 20 + jl; i++) u8[i] = 32;
  dv.setUint32(20 + jl, bl, true); dv.setUint32(24 + jl, 0x004E4942, true); u8.set(bin, 28 + jl);
  return buf;
}
H.falha = m => { H.fail = true; H.erro = m; console.warn("Corpo 3D não carregou:", m); };
if(T.GLTFLoader && T.SkeletonUtils){
  fetch("xbot.json").then(r => { if(!r.ok) throw new Error("arquivo " + r.status); return r.json(); })
    .then(j => new T.GLTFLoader().parse(montaGLB(j), "", g => { try{ prepara(g.scene); H.ready = true; }catch(e){ H.falha("preparo: " + e.message); } }, e => H.falha("leitura: " + (e && e.message || e))))
    .catch(e => H.falha("download: " + (e && e.message || e)));
} else H.falha("biblioteca 3D não carregou");

const QB = (d, f) => {
  const D = d.clone().normalize(), Fv = f.clone().sub(D.clone().multiplyScalar(f.dot(D)));
  if(Fv.lengthSq() < 1e-6){ Fv.set(0, 0, 1).sub(D.clone().multiplyScalar(D.z)); if(Fv.lengthSq() < 1e-6) Fv.set(1, 0, 0); }
  Fv.normalize(); const S = new T.Vector3().crossVectors(D, Fv); MT.makeBasis(D, Fv, S);
  return new T.Quaternion().setFromRotationMatrix(MT);
};
function figuraH(sx){
  const o = T.SkeletonUtils.clone(H.tpl), g = new T.Group(); g.add(o);
  const bones = {}; o.traverse(c => { if(c.isBone) bones[nomeOsso(c.name)] = c; if(c.isSkinnedMesh){ c.geometry = H.geo[c.name][sx]; c.material = H.mat; c.castShadow = true; c.receiveShadow = true; c.frustumCulled = false; if(H.semJuntas && /Joints/.test(c.name)) c.visible = false; } });
  o.updateMatrixWorld(true);
  const rest = {}; Object.entries(bones).forEach(([n, b]) => rest[n] = { lq: b.quaternion.clone(), wq: b.getWorldQuaternion(new T.Quaternion()), wp: b.getWorldPosition(new T.Vector3()) });
  ["Left","Right"].forEach(sd => ["Index","Middle","Ring","Pinky"].forEach(fn => [1, 2, 3].forEach(k => {
    const n = sd + "Hand" + fn + k, b = bones[n]; if(!b) return;
    const ax = v(0, 0, 1).applyQuaternion(rest[n].wq.clone().invert()).normalize();
    b.quaternion.copy(rest[n].lq).multiply(new T.Quaternion().setFromAxisAngle(ax, (sd === "Left" ? -1 : 1) * (k === 1 ? .9 : 1.2)));
  })));
  ["Left","Right"].forEach(sd => { const n = sd + "HandThumb1", b = bones[n]; if(b){ const ax = v(0, 1, 0).applyQuaternion(rest[n].wq.clone().invert()).normalize(); b.quaternion.copy(rest[n].lq).multiply(new T.Quaternion().setFromAxisAngle(ax, (sd === "Left" ? 1 : -1) * .5)); } });
  if(sx === "f" && bones.Head){
    const BP = H.BP, hc = v(0, (BP.Head.y + BP.HeadTop_End.y) / 2, (BP.Head.z + BP.HeadTop_End.z) / 2);
    const peca = (p, s, rx = 0) => { const m = new T.Mesh(G.sph, H.hair); m.position.copy(p); m.scale.set(s[0], s[1], s[2]); m.rotation.x = rx; m.castShadow = true; o.add(m); o.updateMatrixWorld(true); bones.Head.attach(m); };
    peca(hc.clone().add(v(0, .014, -.012)), [.094, .1, .104]);
    peca(hc.clone().add(v(0, .04, -.108)), [.034, .034, .034]);
    peca(hc.clone().add(v(0, -.04, -.135)), [.036, .1, .034], .25);
    peca(hc.clone().add(v(0, -.13, -.15)), [.026, .06, .025], .1);
  }
  o.updateMatrixWorld(true);
  return { g, H: true, o, bones, rest, sx, key: "" };
}
function poseH(F, K){
  const R = F.rest, B = F.bones;
  const setW = (b, wq) => { const pq = b.parent.getWorldQuaternion(new T.Quaternion()); b.quaternion.copy(pq.invert().multiply(wq)); b.updateMatrixWorld(true); };
  const aim = (n, d0, f0, d1, f1) => { const b = B[n]; if(!b) return; setW(b, QB(d1, f1).multiply(QB(d0, f0).invert()).multiply(R[n].wq)); };
  const hq = QB(K.U, K.Fw).multiply(QB(v(0, 1, 0), v(0, 0, 1)).invert()).multiply(R.Hips.wq);
  const hw = K.hip.clone().addScaledVector(K.U, H.hipOff.y).addScaledVector(K.Fw, H.hipOff.z);
  B.Hips.parent.updateWorldMatrix(true, false); B.Hips.position.copy(B.Hips.parent.worldToLocal(hw)); setW(B.Hips, hq);
  const fr = (seg, i, d) => { let f = K.fr[seg][i].clone(); f.sub(d.clone().multiplyScalar(f.dot(d))); if(f.lengthSq() < .01) f = K.Fw.clone(); return f; };
  const Z = v(0, 0, 1);
  [0, 1].forEach(i => {
    const s = i ? "Right" : "Left";
    let d = K.kn[i].clone().sub(K.hp[i]).normalize(); aim(s + "UpLeg", R[s + "Leg"].wp.clone().sub(R[s + "UpLeg"].wp), Z, d, fr("th", i, d));
    d = K.an[i].clone().sub(K.kn[i]).normalize(); aim(s + "Leg", R[s + "Foot"].wp.clone().sub(R[s + "Leg"].wp), Z, d, fr("sh", i, d));
    aim(s + "Foot", R[s + "ToeBase"].wp.clone().sub(R[s + "Foot"].wp), v(0, 1, 0), K.toe[i].clone().sub(K.an[i]), K.kn[i].clone().sub(K.an[i]));
    d = K.el[i].clone().sub(K.sh[i]).normalize(); aim(s + "Arm", R[s + "ForeArm"].wp.clone().sub(R[s + "Arm"].wp), Z, d, fr("ua", i, d));
    d = K.ha[i].clone().sub(K.el[i]).normalize(); aim(s + "ForeArm", R[s + "Hand"].wp.clone().sub(R[s + "ForeArm"].wp), Z, d, fr("fa", i, d));
  });
  F.o.updateMatrixWorld(true);
}
function musH(F, prim, sec){
  const key = prim.join() + "|" + sec.join();
  Object.values(H.geo).forEach(G2 => {
    const g = G2[F.sx]; if(g._mk === key) return; g._mk = key;
    const a = g.attributes.aMus.array, N = a.length / 2;
    for(let i = 0; i < N; i++){
      let p = 0, s = 0;
      for(const m of prim) if(G2.W[m]) p = Math.max(p, G2.W[m][i]);
      for(const m of sec) if(G2.W[m]) s = Math.max(s, G2.W[m][i]);
      a[2 * i] = p; a[2 * i + 1] = s;
    }
    g.attributes.aMus.needsUpdate = true;
  });
}

/* ---------- Player ---------- */
let ATIVO = null;
function mount3(host, ex, opt = {}){
  if(ATIVO) ATIVO.stop();
  if(B._stop2) B._stop2();
  const inf = B.info(ex), pat = X.PAT[inf.anim] || X.PAT.agacho, dur = pat.dur || 3;
  host.innerHTML = ""; const wrap = host.closest(".stage-wrap"); if(wrap) wrap.classList.add("three");
  const canvas = document.createElement("canvas"); canvas.className = "bn-canvas"; canvas.setAttribute("aria-label", "Boneco 3D fazendo o exercício. Arraste para girar."); host.appendChild(canvas);
  const R = renderer(canvas), sc = cena(R), props = new T.Group(); sc.add(props);
  const cam = new T.PerspectiveCamera(28, 1, .05, 60);
  const st = { sx: opt.sexo || "f", speed: 1, playing: !opt.paused, t: 0, last: performance.now(), rep: 1, half: 0, dead: false, drawn: false };
  let fig = figura(st.sx); sc.add(fig.g);
  const aviso = document.createElement("div"); aviso.className = "bn-load"; host.appendChild(aviso);
  const atualizaAviso = () => { if(H.ready) aviso.hidden = true; else if(H.fail){ aviso.hidden = false; aviso.textContent = "Corpo 3D não carregou (" + (H.erro || "erro") + "). Mostrando o boneco simples."; aviso.classList.add("erro"); } else { aviso.hidden = false; aviso.textContent = "Carregando corpo 3D…"; } fig.g.visible = H.ready || H.fail; };
  atualizaAviso();
  let fit = enquadra(inf.anim, pat, st.sx, inf), az = fit.az, el = fit.el;
  const resize = () => { const w = host.clientWidth || 320, h = host.clientHeight || 240; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); st.drawn = false; };
  resize(); let ro = null; try{ ro = new ResizeObserver(resize); ro.observe(host); }catch(e){}
  let drag = null;
  canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; try{ canvas.setPointerCapture(e.pointerId); }catch(_){} });
  canvas.addEventListener("pointermove", e => { if(!drag) return; az -= (e.clientX - drag.x) * .012; el = Math.max(-.05, Math.min(1.1, el + (e.clientY - drag.y) * .008)); drag = { x: e.clientX, y: e.clientY }; st.drawn = false; });
  const up = () => drag = null; canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.style.touchAction = "none";
  const paint = () => {
    const u = (st.t / dur) % 1, fr = X.frame(inf.anim, u, st.sx), K = map3(fr.J, pat, st.sx);
    poseFig(fig, K, fr.I, inf.prim, inf.sec); props3(props, pat, fr.J, fr.P, K); setGlow(fr.I);
    camPos(cam, fit, az, el, cam.aspect); R.render(sc, cam);
    if(opt.onFrame) opt.onFrame({ cue: fr.cue, rep: st.rep });
  };
  let acc = 0, raf = 0;
  const loop = now => {
    if(st.dead) return;
    if(!host.isConnected){ api.stop(); return; }
    if(H.ready && !fig.H) api.setSexo(st.sx);
    if(!aviso.hidden || (!H.ready && !H.fail)) { atualizaAviso(); st.drawn = false; }
    const dt = Math.min(.1, (now - st.last) / 1000); st.last = now;
    if(st.playing){ st.t += dt * st.speed; const cyc = Math.floor(st.t / dur), half = Math.floor(st.t / (dur / 2)); st.rep = cyc + 1; if(half !== st.half){ st.half = half; if(opt.onBeat) opt.onBeat(half % 2); } st.drawn = false; }
    acc += dt;
    if(!st.drawn && acc >= 1 / 40){ acc = 0; st.drawn = true; paint(); }
    raf = requestAnimationFrame(loop);
  };
  paint(); st.drawn = true; raf = requestAnimationFrame(loop);
  const api = {
    stop(){ if(st.dead) return; st.dead = true; cancelAnimationFrame(raf); if(ro) ro.disconnect(); (props.userData.tmp || []).forEach(g => g.dispose()); R.dispose(); try{ R.forceContextLoss(); }catch(e){} if(ATIVO === api) ATIVO = null; },
    toggle(){ st.playing = !st.playing; st.last = performance.now(); return st.playing; },
    setSexo(s){ sc.remove(fig.g); fig = figura(s); sc.add(fig.g); fig.g.visible = H.ready || H.fail; st.sx = s; fit = enquadra(inf.anim, pat, s, inf); st.drawn = false; },
    setSpeed(x){ st.speed = x; },
    get playing(){ return st.playing; }
  };
  ATIVO = api;
  return api;
}

/* ---------- Miniaturas ---------- */
const TH = {}, REG = {}, FILA = []; let TR = null, TSC = null, TPROPS = null, TCAM = null, TFIG = {}, rodando = false;
function thumbImg(ex, sx){
  REG[ex.id] = ex; const k = ex.id + sx;
  return `<img class="bn-img" data-bn="${ex.id}" data-sx="${sx}" alt=""${TH[k] ? ` src="${TH[k]}"` : ""}>`;
}
function renderThumb(ex, sx){
  if(!TR){ const c = document.createElement("canvas"); TR = renderer(c, true); TR.setPixelRatio(1); TR.setSize(240, 240, false); TSC = cena(TR); TPROPS = new T.Group(); TSC.add(TPROPS); TCAM = new T.PerspectiveCamera(28, 1, .05, 60); }
  Object.values(TFIG).forEach(f => f.g.visible = false);
  if(TFIG[sx] && !TFIG[sx].H && H.ready){ TSC.remove(TFIG[sx].g); delete TFIG[sx]; }
  const fig = TFIG[sx] || (TFIG[sx] = (() => { const f = figura(sx); TSC.add(f.g); return f; })()); fig.g.visible = true;
  const inf = B.info(ex), pat = X.PAT[inf.anim] || X.PAT.agacho, u = pat.keys || pat.loop ? .3 : .25;
  const fr = X.frame(inf.anim, u, sx), K = map3(fr.J, pat, sx);
  poseFig(fig, K, .9, inf.prim, inf.sec); props3(TPROPS, pat, fr.J, fr.P, K); setGlow(.9);
  const fit = enquadra(inf.anim, pat, sx, inf); camPos(TCAM, fit, fit.az, fit.el, 1);
  TR.render(TSC, TCAM);
  return TR.domElement.toDataURL("image/jpeg", .86);
}
function processa(){
  if(rodando) return;
  if(!H.ready && !H.fail){ clearTimeout(processa.t); processa.t = setTimeout(processa, 300); return; }
  rodando = true;
  const passo = () => {
    const el = FILA.shift(); if(!el){ rodando = false; return; }
    const id = el.dataset.bn, sx = el.dataset.sx, k = id + sx;
    if(!TH[k] && REG[id]){ try{ TH[k] = renderThumb(REG[id], sx); }catch(e){ console.warn(e); } }
    document.querySelectorAll(`img.bn-img[data-bn="${id}"][data-sx="${sx}"]`).forEach(i => { if(TH[k] && !i.getAttribute("src")) i.src = TH[k]; });
    setTimeout(passo, 0);
  };
  passo();
}
function procura(){ document.querySelectorAll("img.bn-img:not([src])").forEach(i => { if(!FILA.includes(i)) FILA.push(i); }); if(FILA.length) processa(); }
new MutationObserver(() => { clearTimeout(procura.t); procura.t = setTimeout(procura, 30); }).observe(document.documentElement, { childList: true, subtree: true });

/* ---------- Troca o 2D pelo 3D ---------- */
const mount2 = B.mount;
B._stop2 = () => {};
B.mount = (host, ex, opt) => { try{ return mount3(host, ex, opt); }catch(e){ console.warn("3D indisponível, usando 2D", e); return mount2(host, ex, opt); } };
B.thumb = thumbImg;
B._stop3 = () => { if(ATIVO) ATIVO.stop(); };
B.tem3d = true;
B._render3 = renderThumb; B._H = H;
})();
