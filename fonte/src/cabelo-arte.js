/* ===================== Cabelo para Treinar · ILUSTRAÇÕES =====================
   Desenhos vetoriais próprios, todos no mesmo estilo: silhueta feminina sem rosto, cabelo em destaque,
   cores do CK Life. Variam por família do penteado, altura (alto/médio/baixo), comprimento, textura e vista
   (frente, lado, trás, detalhe). Foto ou vídeo enviados no painel sempre têm prioridade. */
let ARTE_N = 0;
const ARTE_COR = { pele: "#C8977A", peleS: "#A9765B", cabelo: "#3A2620", cabeloL: "#6B4636", top: "#2E7D5A", topS: "#0E3D32", acc: "#D9688F", band: "#F4B740" };
function arteInfo(p, tipo){
  const n = (p.nome + " " + (p.slug || "")).toLowerCase();
  const altura = /alto|abacaxi(?! baixo)|scrunchie alto|top/.test(n) ? "alto" : /baixo|nuca/.test(n) ? "baixo" : "medio";
  const textura = tipo && p.tipos.includes(tipo) ? tipo : p.tipos[0] || "liso";
  const comp = p.comprimentos.includes("longo") ? "longo" : p.comprimentos.includes("muito_longo") ? "muito_longo" : p.comprimentos[0] || "medio";
  return { fam: p.familia || "rabo", altura, crespo: textura === "cacheado" || textura === "crespo", textura, comp, dois: /\bduas\b|\bdois\b/.test(n),
    faixa: /faixa|bandana/.test(n), bandana: /bandana/.test(n), segmentado: /segmentado|bubble/.test(n), tranca: /tran[cç]a|braids|twists/.test(n) && p.familia !== "tranca",
    abacaxi: /abacaxi/.test(n), curto: p.comprimentos.length === 1 && p.comprimentos[0] === "curto" || /mini|curto/.test(n), lateral: /lateral/.test(n) };
}
/* nuvem de cachos: vários círculos com brilho */
function cachos(cx, cy, r, id, densa){
  let h = "", k = 0; const passo = densa ? 0.42 : 0.55;
  for(let a = 0; a < Math.PI * 2; a += passo){ const rr = r * (0.82 + 0.1 * Math.sin(a * 3 + k)); h += `<circle cx="${(cx + Math.cos(a) * rr * 0.78).toFixed(1)}" cy="${(cy + Math.sin(a) * rr * 0.78).toFixed(1)}" r="${(r * 0.36).toFixed(1)}"/>`; k++; }
  h += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.8).toFixed(1)}"/>`;
  let brilho = ""; for(let i = 0; i < 6; i++){ const a = i * 1.1 + 0.4, rr = r * 0.5; brilho += `<path d="M${(cx + Math.cos(a) * rr - 3).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} q3 -4 6 0" />`; }
  return `<g fill="url(#cabB${id})">${h}</g><g fill="none" stroke="${ARTE_COR.cabeloL}" stroke-width="1.4" stroke-linecap="round" opacity=".55">${brilho}</g>`;
}
/* rabo: cai a partir do ponto preso; liso = mecha lisa com fios; cacheado = cachos ao longo */
function rabo(x, y, len, id, I, lado){
  const dx = lado || 0;
  if(I.crespo){ let h = ""; for(let i = 0; i <= 4; i++){ const t = i / 4; h += cachos(x + dx * t * 20 + Math.sin(t * 3) * 4, y + 10 + t * len, 13 - t * 4, id, true); } return h; }
  const w = I.segmentado ? 20 : 22;
  const cv = dx || 0.25;
  let d = `M${x - 5} ${y} C${x - w * 0.75} ${y + len * 0.25} ${x - w * 0.55 + cv * 10} ${y + len * 0.7} ${x + cv * 16} ${y + len} C${x + w * 0.5 + cv * 12} ${y + len * 0.68} ${x + w * 0.7 + cv * 4} ${y + len * 0.25} ${x + 5} ${y} Z`;
  let h = `<path d="${d}" fill="url(#cabB${id})"/><g fill="none" stroke="${ARTE_COR.cabeloL}" stroke-width="1.1" opacity=".5"><path d="M${x - 2} ${y + 4} C${x - 4} ${y + len * 0.4} ${x + dx * 10} ${y + len * 0.8} ${x + dx * 16} ${y + len - 4}"/><path d="M${x + 3} ${y + 4} C${x + 3} ${y + len * 0.4} ${x + dx * 10 + 3} ${y + len * 0.7} ${x + dx * 16 + 2} ${y + len - 10}"/></g>`;
  if(I.segmentado) for(let i = 1; i <= 3; i++){ const yy = y + len * i / 4; h += `<ellipse cx="${x + dx * 18 * i / 4}" cy="${yy}" rx="${I.textura === "liso" && /bubble/.test(I.nome || "") ? 8 : 6.5}" ry="2.6" fill="${ARTE_COR.acc}"/>`; }
  if(I.tranca) h += tranca(x, y + 6, len - 6, id, dx);
  return h;
}
/* trança: elos alternados */
function tranca(x, y, len, id, dx){
  let h = ""; const n = Math.max(4, Math.round(len / 11));
  for(let i = 0; i < n; i++){ const t = i / n, cx = x + (dx || 0) * 16 * t + (i % 2 ? 3 : -3), cy = y + t * len, w = 9 - t * 3;
    h += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${w.toFixed(1)}" ry="7" fill="url(#cabB${id})" stroke="${ARTE_COR.cabeloL}" stroke-width="1" transform="rotate(${i % 2 ? 22 : -22} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`; }
  return h + `<ellipse cx="${x + (dx || 0) * 16}" cy="${y + len + 2}" rx="4" ry="2.4" fill="${ARTE_COR.acc}"/>`;
}
function coque(x, y, r, id, I){
  if(I.crespo) return cachos(x, y, r, id, true);
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#cabB${id})"/><g fill="none" stroke="${ARTE_COR.cabeloL}" stroke-width="1.3" opacity=".6" stroke-linecap="round"><path d="M${x - r * 0.7} ${y - 2} a${r * 0.7} ${r * 0.62} 0 0 1 ${r * 1.4} 0"/><path d="M${x - r * 0.45} ${y + 3} a${r * 0.45} ${r * 0.4} 0 0 1 ${r * 0.9} 0"/></g>`;
}
const elastico = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx || 8}" ry="4" fill="${ARTE_COR.acc}" stroke="#A8456B" stroke-width="1"/><ellipse cx="${x}" cy="${y - 1}" rx="${(rx || 8) - 3}" ry="1.6" fill="#F3A9C0" opacity=".7"/>`;
/* cabeça de costas (cabelo cobre tudo) com textura */
function cabecaTras(id, I, solto){
  const fios = I.crespo ? "" : `<g fill="none" stroke="${ARTE_COR.cabeloL}" stroke-width="1.2" opacity=".45" stroke-linecap="round"><path d="M80 52 C86 78 92 100 96 ${I.altura === "baixo" ? 128 : 100}"/><path d="M120 52 C114 78 108 100 104 ${I.altura === "baixo" ? 128 : 100}"/><path d="M68 74 C78 92 90 110 98 ${I.altura === "baixo" ? 128 : 112}"/><path d="M132 74 C122 92 110 110 102 ${I.altura === "baixo" ? 128 : 112}"/></g>`;
  const borda = I.crespo ? cachosBorda(id) : "";
  const soltoH = solto ? (I.crespo ? cachos(100, 150, 38, id) : `<path d="M58 100 C54 140 58 ${solto} 70 ${solto + 8} L130 ${solto + 8} C142 ${solto} 146 140 142 100 Z" fill="url(#cab${id})"/>`) : "";
  return `${soltoH}<ellipse cx="57" cy="98" rx="6" ry="10" fill="${ARTE_COR.pele}"/><ellipse cx="143" cy="98" rx="6" ry="10" fill="${ARTE_COR.pele}"/>${borda}<ellipse cx="100" cy="92" rx="44" ry="50" fill="url(#cab${id})"/><ellipse cx="86" cy="66" rx="16" ry="10" fill="#fff" opacity=".07"/>${fios}`;
}
function cachosBorda(id){ let h = ""; for(let a = Math.PI * 0.95; a < Math.PI * 2.05; a += 0.32){ h += `<circle cx="${(100 + Math.cos(a) * 44).toFixed(1)}" cy="${(92 + Math.sin(a) * 50).toFixed(1)}" r="9"/>`; } return `<g fill="url(#cab${id})">${h}</g>`; }
const corpo = id => `<path d="M26 222 C30 180 68 168 100 168 C132 168 170 180 174 222 Z" fill="url(#top${id})"/><path d="M78 170 C86 182 114 182 122 170" fill="none" stroke="${ARTE_COR.topS}" stroke-width="2" opacity=".5"/><rect x="87" y="134" width="26" height="40" rx="11" fill="url(#pel${id})"/>`;
/* vista de trás: o penteado pronto */
function vistaTras(p, I, id){
  const T = { alto: [100, 50], medio: [100, 84], baixo: [100, 130] }[I.altura], len = (I.curto ? 22 : { medio: 46, longo: 76, muito_longo: 98 }[I.comp] || 60) + (I.curto ? 0 : I.altura === "alto" ? 44 : I.altura === "medio" ? 22 : 0);
  let fundo = "", frente = "";
  const solto = I.curto ? 0 : { medio: 168, longo: 200, muito_longo: 214 }[I.comp] || 180;
  switch(I.fam){
    case "rabo": if(I.dois){ frente = rabo(72, T[1] + 4, len, id, I, -0.6) + rabo(128, T[1] + 4, len, id, I, 0.6) + elastico(72, T[1] + 2, 6) + elastico(128, T[1] + 2, 6); } else frente = rabo(T[0], T[1] + 4, len, id, I, I.lateral ? 1 : 0) + elastico(T[0], T[1] + 2); break;
    case "coque": frente = I.dois ? coque(74, T[1], 15, id, I) + coque(126, T[1], 15, id, I) : coque(T[0], T[1] - (I.altura === "alto" ? 4 : 0), I.curto ? 12 : 19, id, I) + (I.altura !== "alto" ? "" : ""); break;
    case "tranca": frente = I.dois ? tranca(74, 112, len + 10, id, -0.5) + tranca(126, 112, len + 10, id, 0.5) : I.lateral ? tranca(118, 118, len + 6, id, 1.4) : /embutida/.test(p.nome.toLowerCase()) ? tranca(100, 46, 90, id, 0) + tranca(100, 136, len, id, 0) : /frontal|frontais/.test(p.nome.toLowerCase()) ? "" : tranca(100, 120, len + 10, id, 0); break;
    case "puff": frente = I.dois ? cachos(66, T[1] - 4, 22, id) + cachos(134, T[1] - 4, 22, id) : I.abacaxi ? cachos(100, T[1] - 10, 30, id) : cachos(T[0], T[1] - (I.altura === "alto" ? 8 : 0), 26, id) + (I.faixa || /puff/.test(p.nome.toLowerCase()) ? `<path d="M${T[0] - 24} ${T[1] + 18} Q${T[0]} ${T[1] + 26} ${T[0] + 24} ${T[1] + 18}" fill="none" stroke="${I.faixa ? ARTE_COR.band : ARTE_COR.acc}" stroke-width="5" stroke-linecap="round"/>` : ""); break;
    case "meio": fundo = solto; frente = coque(100, 64, 11, id, I) + elastico(100, 74, 6); break;
    case "presilha": fundo = solto || 150; frente = `<g fill="${ARTE_COR.acc}"><rect x="58" y="72" width="16" height="6" rx="3" transform="rotate(-24 66 75)"/><rect x="126" y="72" width="16" height="6" rx="3" transform="rotate(24 134 75)"/></g>`; break;
    case "faixa": fundo = I.curto ? 0 : solto; if(/preso|rabo/.test(p.nome.toLowerCase())) frente = rabo(100, 54, len, id, I, 0) + elastico(100, 52); else if(I.tranca || /tran/.test(p.nome.toLowerCase())) frente = tranca(76, 110, len, id, -0.4) + tranca(124, 110, len, id, 0.4); break;
    case "twist": fundo = I.curto ? 0 : solto; break;
  }
  if(I.fam === "faixa" || I.faixa) frente += I.bandana ? `<path d="M56 74 Q100 50 144 74 L138 86 Q100 66 62 86 Z" fill="${ARTE_COR.acc}"/><path d="M96 82 L104 82 L108 104 L92 104 Z" fill="${ARTE_COR.acc}" opacity=".9"/>` : `<path d="M57 78 Q100 54 143 78" fill="none" stroke="${ARTE_COR.band}" stroke-width="9" stroke-linecap="round"/>`;
  const atras = (I.fam === "rabo" || I.fam === "coque" || I.fam === "puff") && I.altura !== "alto" ? "" : "";
  return `${corpo(id)}${atras}${cabecaTras(id, I, fundo)}<g filter="url(#sh${id})" stroke="#1E120C" stroke-width="1.1" stroke-linejoin="round">${frente}</g>`;
}
/* vista de lado: perfil simples (sem rosto) mostrando a altura do penteado */
function vistaLado(p, I, id){
  const y = { alto: 52, medio: 86, baixo: 128 }[I.altura], len = I.curto ? 20 : { medio: 44, longo: 70, muito_longo: 90 }[I.comp] || 56;
  let el = "";
  if(["rabo", "faixa"].includes(I.fam)) el = I.crespo ? cachos(58, y + 18, 16, id, true) + cachos(52, y + 18 + len * 0.6, 12, id, true) : `<path d="M62 ${y} C40 ${y + 10} 40 ${y + len * 0.6} 46 ${y + len} C54 ${y + len * 0.6} 58 ${y + 18} 66 ${y + 6} Z" fill="url(#cab${id})"/>${elastico(63, y + 2, 5)}`;
  if(I.fam === "coque" || I.fam === "meio") el = coque(I.fam === "meio" ? 72 : 60, I.fam === "meio" ? 56 : y, I.fam === "meio" ? 10 : 17, id, I);
  if(I.fam === "puff") el = cachos(I.altura === "alto" ? 78 : 60, I.altura === "alto" ? 38 : y, 24, id);
  if(I.fam === "tranca") el = tranca(60, 118, len + 6, id, -0.3);
  const solto = ["presilha", "twist"].includes(I.fam) || (I.fam === "faixa" && !/preso|rabo/.test(p.nome.toLowerCase())) ? `<path d="M64 80 C56 120 60 ${I.curto ? 128 : 160} 72 ${I.curto ? 134 : 172} L104 ${I.curto ? 134 : 172} C100 140 98 110 100 90 Z" fill="url(#cab${id})"/>` : "";
  const faixaL = I.fam === "faixa" || I.faixa ? `<path d="M70 58 Q100 40 128 56" fill="none" stroke="${I.bandana ? ARTE_COR.acc : ARTE_COR.band}" stroke-width="8" stroke-linecap="round"/>` : "";
  return `${corpo(id)}${solto}<path d="M96 118 C96 136 97 152 98 170 L122 170 C120 152 119 136 120 120 Z" fill="url(#pel${id})"/>
    <circle cx="100" cy="88" r="42" fill="url(#cab${id})"/>
    <path d="M122 54 C136 60 144 74 144 88 C144 92 147 95 149 99 C150 101 148 103 145 104 C146 108 145 111 142 112 C143 116 141 120 136 122 C130 126 120 128 112 126 C106 124 104 118 104 110 C112 104 116 92 116 80 C116 70 118 60 122 54 Z" fill="url(#pel${id})"/>
    <path d="M70 70 C80 46 104 40 124 52 C118 62 114 72 112 84 C104 90 96 92 88 90 Z" fill="url(#cab${id})"/>
    <ellipse cx="106" cy="96" rx="5" ry="8" fill="${ARTE_COR.peleS}"/>
    <g filter="url(#sh${id})" stroke="#1E120C" stroke-width="1.1">${el}</g>${I.fam === "presilha" ? `<rect x="96" y="62" width="18" height="6" rx="3" fill="${ARTE_COR.acc}" transform="rotate(-24 105 65)"/>` : ""}${faixaL}`;
}
/* vista de frente: rosto liso (sem traços), cabelo emoldurando */
function vistaFrente(p, I, id){
  const nm = p.nome.toLowerCase();
  const cabAtras = I.crespo ? cachos(100, 92, 52, id) : "";
  const cab = I.crespo ? (() => { let h = ""; for(let a = Math.PI * 1.08; a < Math.PI * 1.95; a += 0.22) h += `<circle cx="${(100 + Math.cos(a) * 34).toFixed(1)}" cy="${(92 + Math.sin(a) * 40).toFixed(1)}" r="9"/>`; return `<g fill="url(#cabB${id})" stroke="#1E120C" stroke-width=".8">${h}</g>`; })() : `<path d="M54 100 C50 56 74 34 100 34 C126 34 150 56 146 100 C140 82 130 70 100 68 C70 70 60 82 54 100 Z" fill="url(#cab${id})"/>`;
  const solto = ["presilha", "twist", "faixa"].includes(I.fam) && !I.curto ? `<path d="M56 96 C50 130 54 160 66 172 L76 172 C70 150 70 120 72 98 Z M144 96 C150 130 146 160 134 172 L124 172 C130 150 130 120 128 98 Z" fill="url(#cab${id})"/>` : "";
  let extra = "";
  if(I.fam === "faixa" || I.faixa) extra = I.bandana ? `<path d="M56 70 Q100 44 144 70 L140 82 Q100 60 60 82 Z" fill="${ARTE_COR.acc}"/>` : `<path d="M58 72 Q100 48 142 72" fill="none" stroke="${ARTE_COR.band}" stroke-width="10" stroke-linecap="round"/>`;
  if(I.fam === "presilha") extra = `<g fill="${ARTE_COR.acc}"><rect x="60" y="74" width="18" height="6" rx="3" transform="rotate(-30 69 77)"/><rect x="122" y="74" width="18" height="6" rx="3" transform="rotate(30 131 77)"/>${/grampo/.test(nm) ? `<rect x="64" y="86" width="16" height="4" rx="2" transform="rotate(30 72 88)"/><rect x="120" y="86" width="16" height="4" rx="2" transform="rotate(-30 128 88)"/>` : ""}</g>`;
  if(I.fam === "twist" || /frontal|frontais/.test(nm)) extra = tranca(74, 54, 40, id, 0.4).replace(/rx="(\d+(\.\d+)?)"/g, (m, v) => `rx="${(+v * 0.7).toFixed(1)}"`) + (/frontais/.test(nm) ? tranca(126, 54, 40, id, -0.4).replace(/rx="(\d+(\.\d+)?)"/g, (m, v) => `rx="${(+v * 0.7).toFixed(1)}"`) : "");
  let topo = "";
  if(I.fam === "puff") topo = I.dois ? cachos(64, 40, 18, id) + cachos(136, 40, 18, id) : cachos(100, 26, 22, id);
  if(I.fam === "coque" && I.altura === "alto") topo = coque(100, 24, 16, id, I);
  if(I.fam === "rabo" && I.altura === "alto") topo = I.crespo ? cachos(100, 26, 14, id, true) : `<path d="M92 30 C88 18 112 18 108 30 Z" fill="url(#cab${id})"/>`;
  return `${corpo(id)}${cabAtras}${solto}${topo}<ellipse cx="100" cy="96" rx="34" ry="42" fill="url(#pel${id})"/><ellipse cx="66" cy="100" rx="5" ry="9" fill="${ARTE_COR.pele}"/><ellipse cx="134" cy="100" rx="5" ry="9" fill="${ARTE_COR.pele}"/>${cab}<g filter="url(#sh${id})" stroke="#1E120C" stroke-width="1">${extra}</g>`;
}
/* setas e brilhos do passo a passo */
function sobrepor(n, I){
  const T = { alto: [100, 52], medio: [100, 86], baixo: [100, 130] }[I.altura];
  if(n === 1) return `<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".92" marker-end="url(#seta)"><path d="M48 112 Q62 ${T[1] + 20} ${T[0] - 14} ${T[1] + 4}"/><path d="M152 112 Q138 ${T[1] + 20} ${T[0] + 14} ${T[1] + 4}"/></g>`;
  if(n === 2) return `<circle cx="${T[0]}" cy="${T[1] + 2}" r="17" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="4 5" opacity=".95"/>`;
  if(n >= 4) return `<g fill="#fff" opacity=".95"><path d="M156 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path d="M42 62 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M164 92 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z"/></g>`;
  return "";
}
/* desenho final (miniatura/tutorial) ou de um passo */
function cabArte(p, opt){
  opt = opt || {}; const id = ++ARTE_N, I = { ...arteInfo(p, opt.tipo), nome: p.nome.toLowerCase() }, vista = opt.vista || "back";
  const corpoV = vista === "side" ? vistaLado(p, I, id) : vista === "front" ? vistaFrente(p, I, id) : vistaTras(p, I, id);
  const zoom = vista === "detail" ? (() => { const y = { alto: 52, medio: 86, baixo: 130 }[I.altura]; return `transform="translate(100 ${y + 10}) scale(1.7) translate(-100 ${-(y + 10)})"`; })() : "";
  return `<svg class="cab-arte" viewBox="0 0 200 220" role="img" aria-label="Ilustração: ${esc(p.nome)}${opt.passo ? ", passo " + opt.passo : ""}" preserveAspectRatio="xMidYMid slice">
    <defs><radialGradient id="bg${id}" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#F6FAF3"/><stop offset=".6" stop-color="#E4EFE0"/><stop offset="1" stop-color="#CFE2CB"/></radialGradient>
      <linearGradient id="cab${id}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#5A3A2E"/><stop offset=".55" stop-color="${ARTE_COR.cabelo}"/><stop offset="1" stop-color="#24170F"/></linearGradient>
      <linearGradient id="cabB${id}" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#8A5C46"/><stop offset=".5" stop-color="#5E3D2F"/><stop offset="1" stop-color="#3A2620"/></linearGradient>
      <filter id="sh${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".28"/></filter>
      <linearGradient id="pel${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D6A88B"/><stop offset="1" stop-color="${ARTE_COR.peleS}"/></linearGradient>
      <linearGradient id="top${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B8F68"/><stop offset="1" stop-color="${ARTE_COR.topS}"/></linearGradient>
      <marker id="seta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#fff"/></marker></defs>
    <rect width="200" height="220" fill="url(#bg${id})"/><circle cx="100" cy="94" r="74" fill="#fff" opacity=".35"/>
    <g ${zoom}>${corpoV}${opt.passo ? sobrepor(opt.passo, I) : ""}</g></svg>`;
}
window.CKCABARTE = cabArte;
