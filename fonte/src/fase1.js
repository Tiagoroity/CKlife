/* ===================== FASE 1 · FOCO =====================
   Cartão "Seu dia" no Início (a aba Explorar continua no menu),
   loja de produtos mais forte (achadinhos, indicação por contexto, promoções, compartilhar)
   e comemoração com a meta da semana no fim do treino. Nada é apagado: só reorganizado. */

/* ---------- Anúncio: nunca para quem paga (o servidor já bloqueia; aqui é a segunda trava) ---------- */
const anuncioHtmlF1 = anuncioHtml; anuncioHtml = function(){ if(typeof pagou === "function" && pagou()) return ""; return anuncioHtmlF1.apply(this, arguments); };

/* ---------- Loja: helpers ---------- */
const descPct = p => { const a = +p.preco || 0, b = +p.promo || 0; return a && b && b < a ? Math.round(100 * (1 - b / a)) : 0; };
const prodsCtx = ctx => modOn("loja") ? L_prod().filter(p => p["ctx_" + ctx]) : [];
const achadinhos = () => { if(!modOn("loja")) return []; const L = L_prod(); const d = L.filter(p => p.destaque || p.ctx_inicio); return (d.length ? d : L.filter(descPct)).slice(0, 10); };
const cardProdF1 = p => { const d = descPct(p); return cardProd(p).replace('<span class="xp-cb">', `${d ? `<i class="pr-off">-${d}%</i>` : ""}<span class="xp-cb">`); };
const filaProd = (titulo, sub, L, ver) => L.length ? `<section class="pr-fila"><div class="sec-title"><h3>${titulo}</h3>${ver ? `<button class="link xp-vt" data-lojaver>Ver loja ${ic("back", 14, 2.4)}</button>` : ""}</div>${sub ? `<p class="hint pr-sub">${sub}</p>` : ""}<div class="hscroll xp-row">${L.map(cardProdF1).join("")}</div></section>` : "";
function ligaProd(root){ if(!root) return; root.querySelectorAll("[data-prod]").forEach(b => b.onclick = () => abrirProd(b.dataset.prod)); root.querySelectorAll("[data-lojaver]").forEach(b => b.onclick = () => { fecharSheet && !$("sheet").hidden && fecharSheet(); XS.sec = "loja"; XS.q = ""; XS.cat = ""; tab("explorar"); }); }

/* Loja dentro do Explorar: ordem (destaques, promoções, menor preço) e selo de desconto */
let LORD = "dest";
const xpCorpoF1 = xpCorpo; xpCorpo = function(){
  xpCorpoF1.apply(this, arguments);
  const el = $("xp-body"); if(!el || XS.q || XS.sec !== "loja") return;
  const B = L_prod(), L = XS.cat ? B.filter(p => mesmaCat(p.cat, XS.cat)) : B; if(!L.length) return;
  const val = p => { const a = +p.preco || 0, b = +p.promo || 0; return b && b < a ? b : a || 9e9; };
  const ord = LORD === "promo" ? L.filter(descPct).sort((a, b) => descPct(b) - descPct(a)) : LORD === "preco" ? L.slice().sort((a, b) => val(a) - val(b)) : L.slice().sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
  const g = el.querySelector(".xp-grid"); if(!g) return;
  g.insertAdjacentHTML("beforebegin", `<div class="seg seg-sm pr-ord">${[["dest", "Destaques"], ["promo", "Promoções"], ["preco", "Menor preço"]].map(([k, n]) => `<button data-lord="${k}" aria-pressed="${LORD === k}">${n}</button>`).join("")}</div>`);
  g.innerHTML = ord.length ? ord.map(cardProdF1).join("") : `<div class="card empty" style="grid-column:1/-1">Nenhuma promoção agora. Veja as escolhas da CK.</div>`;
  ligaProd(g); ligaFav(g);
  el.querySelectorAll("[data-lord]").forEach(b => b.onclick = () => { LORD = b.dataset.lord; SOM.tap(); xpCorpo(); });
};
/* Detalhe do produto: "por que a CK indica", compartilhar e produtos parecidos */
const abrirProdF1 = abrirProd; abrirProd = function(id){
  const r = abrirProdF1.apply(this, arguments);
  const p = DB.produtos.find(x => x.id === id), b = $("sheet-body"); if(!p || !b || !$("xd-buy")) return r;
  const d = descPct(p), buy = $("xd-buy");
  const mu = b.querySelector(".xp-dh .muted"); if(mu) mu.textContent = [p.marca, p.cat].filter(Boolean).join(" · ");
  if(d) buy.insertAdjacentHTML("beforebegin", `<div class="pr-econ">${ic("tag", 16)} Você economiza <b>${brl((+p.preco) - (+p.promo))}</b> (${d}% off)</div>`);
  buy.insertAdjacentHTML("afterend", `${p.porque ? `<div class="pr-porque">${ic("star", 18)}<div><b>Por que a CK indica</b><p>${esc(p.porque)}</p></div></div>` : ""}<button class="btn btn-line btn-block" id="pr-share">${ic("share", 17)} Mandar para uma amiga</button>`);
  $("pr-share").onclick = async () => { const url = location.origin + "/?prod=" + encodeURIComponent(p.id), txt = `Olha o que achei no CK Life: ${p.nome}`;
    xev("prod", p.id, "share");
    if(navigator.share){ try{ await navigator.share({ title: p.nome, text: txt, url }); return; }catch(e){ if(e && e.name === "AbortError") return; } }
    window.open("https://wa.me/?text=" + encodeURIComponent(txt + " " + url), "_blank", "noopener"); };
  const par = L_prod().filter(x => x.id !== p.id && p.cat && mesmaCat(x.cat, p.cat)).slice(0, 8);
  const av = $("xd-av"); if(par.length && av) { av.insertAdjacentHTML("beforebegin", filaProd("Você também pode gostar", "", par)); ligaProd(b); }
  return r;
};
/* link compartilhado (?prod=id): abre o produto quando o app carregar */
{ const pid = new URLSearchParams(location.search).get("prod"); if(pid){ let n = 0; const t = setInterval(() => { if(ME && !$("v-app").hidden){ clearInterval(t); history.replaceState(null, "", location.pathname + location.hash); if(modOn("loja")) abrirProd(pid); } else if(++n > 40) clearInterval(t); }, 500); } }

/* Indicação por contexto: equipamentos no Treinos, ingredientes/utensílios na receita (nunca durante o treino) */
const rTreinarF1 = rTreinar; rTreinar = function(){ const r = rTreinarF1.apply(this, arguments); const box = $("t-treinar"); if(box && !box.querySelector(".pr-fila")){ const h = filaProd("Para treinar em casa", "Itens escolhidos pela CK para o seu treino.", prodsCtx("treino"), true); if(h){ box.insertAdjacentHTML("beforeend", h); ligaProd(box); } } return r; };
const abrirReceitaF1 = abrirReceita; abrirReceita = function(){ const r = abrirReceitaF1.apply(this, arguments); const b = $("sheet-body"), L = prodsCtx("receita"); if(b && L.length && !b.querySelector(".pr-fila")){ const ref = b.querySelector(".row2"); const h = filaProd("Facilita na cozinha", "", L.slice(0, 8), true); if(ref) ref.insertAdjacentHTML("afterend", h); else b.insertAdjacentHTML("beforeend", h); ligaProd(b); } return r; };

/* ---------- Início: cartão "Seu dia" ---------- */
const rInicioF1 = rInicio; rInicio = function(){
  rInicioF1.apply(this, arguments);
  const box = $("t-inicio"); if(!box || !ME || box.querySelector(".sd")) return;
  const T = treinoDoDia(), feitos = diasTreino(), hojeFeito = feitos.has(today()), ult = (ME.treinos || []).slice(-1)[0];
  const m = metas(ME), tt = totais(today()), x = dia(today()), ag = x.agua || 0, pk = m.kcal ? Math.min(1, tt.kcal / m.kcal) : 0, pa = m.agua ? Math.min(1, ag / m.agua) : 0;
  const prox = REFS.find(([k]) => !(x[k] || []).length), nOk = (hojeFeito ? 1 : 0) + (pk >= .8 ? 1 : 0) + (pa >= 1 ? 1 : 0);
  const anel = (f, cor) => { const C = 2 * Math.PI * 17; return `<svg class="sd-r" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="17" class="bg"/><circle cx="22" cy="22" r="17" class="fg" style="stroke:${cor};stroke-dasharray:${C};stroke-dashoffset:${C * (1 - f)}"/></svg>`; };
  const sem = semanaAtualDias(), nSem = sem.filter(d => feitos.has(d)).length, metaS = ME.perfil.dias || 3;
  const html = `<section class="sd card" aria-label="Seu dia">
    <div class="sd-h"><div><span class="eyebrow">Seu dia</span><b>${nOk === 3 ? "Dia completo. Que orgulho! 💚" : nOk ? `${nOk} de 3 feitos` : "Três passos para hoje"}</b></div><span class="sd-sem num" title="Treinos nesta semana">${ic("calendar", 13)} ${nSem}/${metaS} na semana</span></div>
    <div class="sd-l ${hojeFeito ? "ok" : ""}"><span class="sd-a">${anel(hojeFeito ? 1 : 0, "#3DDC6E")}${ic(hojeFeito ? "check" : "treinar", 16, 2.4)}</span>
      <span class="sd-t"><b>${hojeFeito ? "Treino feito" : esc(T.nome)}</b><small>${hojeFeito ? (ult ? `${esc(ult.nome)} · ${ult.min} min` : "") : `${minTreino(T)} min · ~${kcalTreino(T)} kcal`}</small></span>
      ${hojeFeito ? `<button class="btn btn-soft btn-sm" id="sd-mais">Mais um?</button>` : `<button class="btn btn-accent btn-sm" id="sd-go">${ic("play", 14)} Começar</button>`}</div>
    <div class="sd-l ${pk >= .8 ? "ok" : ""}"><span class="sd-a">${anel(pk, "#F4B740")}${ic("dieta", 16, 2.2)}</span>
      <span class="sd-t"><b>${int(tt.kcal)} de ${int(m.kcal)} kcal</b><small>${prox ? `Próximo: ${prox[1].toLowerCase()}` : "Todas as refeições registradas"}</small></span>
      <button class="btn btn-soft btn-sm" id="sd-com">${prox ? "Registrar" : "Ver"}</button></div>
    <div class="sd-l ${pa >= 1 ? "ok" : ""}"><span class="sd-a">${anel(pa, "#7EC8E3")}${ic("drop", 16, 2.2)}</span>
      <span class="sd-t"><b>${ag} de ${m.agua} copos</b><small>${pa >= 1 ? "Meta de água batida" : `Faltam ${m.agua - ag}`}</small></span>
      <button class="btn btn-soft btn-sm" id="sd-agua" data-mudo>${ic("plus", 14, 2.6)} Copo</button></div>
  </section>`;
  // o "Seu dia" assume o lugar do cartão de treino, do painel de comida e da água (tudo continua na Nutrição e em Treinos)
  const old = box.querySelector(".today"); if(old) old.insertAdjacentHTML("beforebegin", html); else (box.querySelector(".capa") || box.firstElementChild).insertAdjacentHTML("afterend", html);
  const xe = box.querySelector(".xe-dia"), sd = box.querySelector(".sd"); if(xe && sd && xe.compareDocumentPosition(sd) & Node.DOCUMENT_POSITION_FOLLOWING) sd.after(xe);
  [box.querySelector(".today"), box.querySelector(".pdia"), $("h-agua") && $("h-agua").closest(".card"), box.querySelector(".objlist") && box.querySelector(".objlist").parentElement].forEach(e => e && e.remove());
  const go = $("sd-go"); if(go) go.onclick = () => iniciaTreino(T);
  const ms = $("sd-mais"); if(ms) ms.onclick = () => { TV = "rapidos"; tab("treinar"); };
  $("sd-com").onclick = () => { DV = "diario"; tab("dieta"); if(prox) setTimeout(() => addAlimento(prox[0]), 250); };
  $("sd-agua").onclick = () => { x.agua = (x.agua || 0) + 1; SOM.water && SOM.water(); vibra(15); save(); toast(x.agua >= m.agua ? "Meta de água batida! 💧" : `${x.agua} ${x.agua === 1 ? "copo" : "copos"} hoje. Isso!`); rInicio(); };
  // achadinhos da loja: depois da receita do dia (fora do treino)
  const ach = achadinhos(); if(ach.length && !box.querySelector(".pr-fila")){ const rh = box.querySelector(".rhero"); const h = filaProd("Achadinhos CK", "Seleção da CK com link para a loja.", ach, true); if(rh) rh.insertAdjacentHTML("afterend", h); ligaProd(box); }
};

/* ---------- Fim do treino: comemoração com a meta da semana e o que vem depois ---------- */
const fimTreinoF1 = fimTreino; fimTreino = function(parcial){
  const r = fimTreinoF1.apply(this, arguments);
  try{
    const hero = document.querySelector("#play .done-hero"); if(!hero || parcial) return r;
    const sem = semanaAtualDias(), feitos = diasTreino(), n = sem.filter(d => feitos.has(d)).length, meta = ME.perfil.dias || 3, bateu = n >= meta;
    const bol = sem.map(d => `<i class="${feitos.has(d) ? "on" : ""} ${d === today() ? "hj" : ""}"></i>`).join("");
    const st = hero.querySelector(".done-stats");
    if(st) st.insertAdjacentHTML("afterend", `<div class="fim-sem ${bateu ? "ok" : ""}"><div class="fim-bol">${bol}</div><b>${bateu ? "Meta da semana batida! 🏆" : `${n} de ${meta} treinos na semana`}</b><small>${bateu ? "Tudo que vier agora é bônus." : `Falta${meta - n === 1 ? "" : "m"} ${meta - n} para bater sua meta.`}</small></div>`);
    hero.querySelector(".medalbig") && hero.querySelector(".medalbig").classList.add("pula");
    if(bateu) setTimeout(() => { SOM.coupon && SOM.coupon(); vibra([60, 40, 60, 40, 120]); }, 900);
  }catch(e){ console.warn(e); }
  return r;
};

/* Explorar com o marketplace desligado: texto e busca falam de loja e benefícios */
const soLoja = () => !modOn("perto") && !modOn("online") && !modOn("servicos");
const rExplorarF1 = rExplorar; rExplorar = function(){
  const r = rExplorarF1.apply(this, arguments);
  const box = $("t-explorar"); if(!box) return r;
  if(soLoja()){ const c = box.querySelector(".capa"); if(c){ const h = c.querySelector("h1"), p = c.querySelector("p"); if(p) p.textContent = modOn("clube") ? "Produtos escolhidos pela CK e vantagens do Clube para você." : "Produtos escolhidos pela CK para o seu dia a dia."; }
    const q = $("xq"); if(q) q.placeholder = "Buscar produto ou benefício";
    if(!modOn("clube")){ const cid = box.querySelector(".xp-cid"); if(cid) cid.remove(); } }
  return r;
};

/* ---------- Início: grade "Tudo do CK Life" (atalhos para tudo que o app tem) ---------- */
if(!P.pente) P.pente = '<path d="M4 7h16"/><path d="M6 7v9M9 7v9M12 7v9M15 7v9M18 7v9"/><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/>';
const TUDO = [
  ["treinos", "Treinos", "treinar", "#2E7D5A", () => { TV = "programas"; tab("treinar"); }],
  ["anual", "Plano anual", "calendar", "#0E3D32", () => abrirPrograma("anual"), () => PROGS.some(p => p.id === "anual")],
  ["cardapio", "Cardápio", "bowl", "#E0A21B", () => { DV = "cardapio"; tab("dieta"); }],
  ["receitas", "Receitas", "chef", "#E07B39", () => { DV = "receitas"; tab("dieta"); }],
  ["ciclo", "Meu Ciclo", "ciclo", "#C2557A", () => abrirCiclo(), () => typeof abrirCiclo === "function"],
  ["cabelo", "Cabelo", "pente", "#8A5CC2", () => abreCabelo(), () => typeof cabOn === "function" && cabOn()],
  ["desafios", "Desafios", "trophy", "#D4A017", () => { TV = "programas"; tab("treinar"); setTimeout(() => { const d = document.querySelector("#t-treinar .xe-desafios"); if(d) d.scrollIntoView({ behavior: "smooth", block: "start" }); }, 350); }],
  ["evolucao", "Evolução", "evolucao", "#3D8BD9", () => tab("evolucao")],
  ["loja", "Loja", "bag", "#2E7D5A", () => { XS.sec = "loja"; XS.q = ""; XS.cat = ""; tab("explorar"); }, () => modOn("loja"), () => modNovo("loja")],
  ["clube", "Clube CK", "gift", "#B5527E", () => { XS.sec = "clube"; XS.q = ""; XS.cat = ""; tab("explorar"); }, () => modOn("clube"), () => modNovo("clube")],
  ["juntas", "Comunidade", "juntas", "#5B6CD9", () => tab("juntas")],
  ["lembrete", "Lembretes", "clock", "#65736C", () => editaLembrete()]
];
/* completam a última linha da grade (nunca fica buraco): convidar amiga, favoritos, perfil */
const TUDO_EXTRA = [
  ["convidar", "Convidar", "share", "#E5484D", () => convidar()],
  ["favoritos", "Favoritos", "heart", "#E07B39", () => meusFavoritos()],
  ["perfil", "Meu perfil", "perfil", "#2E7D5A", () => tab("perfil")]
];
const tudoLista = () => { const L = TUDO.filter(x => !x[5] || x[5]()); let i = 0; while(L.length % 4 && i < TUDO_EXTRA.length) L.push(TUDO_EXTRA[i++]); return L; };
const tudoHtml = () => { const L = tudoLista(); return `<section class="tudo card" aria-label="Tudo do CK Life"><div class="tudo-h"><span class="eyebrow">Atalhos</span><b>Tudo do CK Life</b></div>
  <div class="tudo-g">${L.map(([k, n, i, c, , , nv]) => `<button class="tudo-i" data-tudo="${k}" style="--tc:${c}"><span class="tudo-ic">${ic(i, 24, 2)}</span><span class="tudo-n">${n}</span>${nv && nv() ? `<i class="xp-novo">Novo</i>` : ""}</button>`).join("")}</div></section>`; };
const rInicioTudo = rInicio; rInicio = function(){
  rInicioTudo.apply(this, arguments);
  const box = $("t-inicio"); if(!box || box.querySelector(".tudo")) return;
  const ref = box.querySelector(".sd") || box.querySelector(".capa"); if(!ref) return;
  ref.insertAdjacentHTML("afterend", tudoHtml());
  box.querySelectorAll("[data-tudo]").forEach(b => b.onclick = () => { const x = TUDO.concat(TUDO_EXTRA).find(t => t[0] === b.dataset.tudo); if(!x) return; SOM.tap && SOM.tap(); try{ x[4](); }catch(e){ console.warn(e); } });
};
/* o Cabelo descobre se está liberado depois de carregar: atualiza a grade quando isso acontecer */
{ let n = 0; const t = setInterval(() => { if(typeof cabOn === "function" && cabOn()){ clearInterval(t); const g = document.querySelector("#t-inicio .tudo"); if(g && !g.querySelector('[data-tudo="cabelo"]') && TAB === "inicio"){ g.remove(); rInicio(); } } else if(++n > 30) clearInterval(t); }, 2000); }

/* ---------- Início enxuto: topo baixo com check-in, "Pra você agora" (cartõezinhos de deslizar), semana num cartão só ----------
   Nada é apagado: os blocos vão para uma gaveta escondida dentro do Início (continuam funcionando) e viram atalhos. */
const txt = (el, s) => { const e = el && (s ? el.querySelector(s) : el); return e ? e.textContent.trim().replace(/\s+/g, " ") : ""; };
function abreNoSheet(tit, node){
  sheet(tit, ""); const b = $("sheet-body"); b.appendChild(node); node.hidden = false;
  // depois de um toque dentro, se a ação não abriu outra tela, fecha e redesenha o Início
  node.addEventListener("click", e => { if(!e.target.closest("button,a")) return; setTimeout(() => { if(b.contains(node) && !$("sheet").hidden) fecharSheet(); if(TAB === "inicio") rInicio(); }, 80); });
}
/* cada item vira um cartãozinho: [seletor, ícone, cor, título, subtítulo, ação] */
const CTX_INI = [
  [".xe-rec", "bolt", "#F4A62A", n => "Hoje, algo mais leve", n => txt(n, "#xe-leve").replace(/^.*·\s*/, "") || "Treino leve sugerido", n => { const b = n.querySelector("#xe-leve"); if(b) b.click(); }],
  [".card.passos", "check", "#2E7D5A", n => "Primeiros passos", n => { const f = [...n.querySelectorAll(".passo:not(.ok) span:last-child")][0]; return `${txt(n, ".sec-title .num")}${f ? " · Próximo: " + f.textContent.trim() : ""}`; }, n => abreNoSheet("Primeiros passos", n)],
  [".pa-conv", "calendar", "#0E3D32", n => txt(n, "b") || "Plano do ano CK", n => "52 semanas sem repetir treino", n => abreNoSheet("Plano do ano CK", n)],
  [".xp-cic-card", "ciclo", "#C2557A", n => "Meu Ciclo", n => txt(n, "small"), n => abrirCiclo()],
  [".xp-proxag", "calendar", "#3D8BD9", n => txt(n, "b") || "Agendamento", n => txt(n, "small"), n => n.click()],
  [".xe-des", "trophy", "#D4A017", n => txt(n, "b"), n => txt(n, "small"), n => { const b = n.querySelector("[data-desver]"); if(b) b.click(); else { TV = "programas"; tab("treinar"); } }],
  [".mod-novo", "explorar", "#2E7D5A", n => txt(n, "b"), n => "Toque para conhecer", n => n.click()],
  [".cab-ini", "pente", "#8A5CC2", n => txt(n, "b") || "Cabelo para treinar", n => txt(n, "small") || "Penteados rápidos para o treino", n => n.click()],
  ["#xe-ult", "explorar", "#65736C", n => txt(n, "b"), n => "Continue de onde parou", n => { const b = n.querySelector("#xe-ult-go"); if(b) b.click(); }],
  [".inst", "plus", "#2E7D5A", n => "Instale o CK Life", n => "Abre em tela cheia e mais rápido", n => abreNoSheet("Instalar o app", n)],
  [".dica-dia", "leaf", "#7BA77A", n => "Dica do dia", n => txt(n, "p"), n => sheet("Dica do dia", `<p style="font-size:17px;line-height:1.5">${esc(txt(n, "p"))}</p>`)]
];
let ORG = false;
function organizaInicio(){
  const box = $("t-inicio"); if(!box || ORG || !box.querySelector(".capa")) return; ORG = true;
  try{
    box.classList.add("ini2");
    let gav = box.querySelector(".ini-gaveta"); if(!gav){ gav = document.createElement("div"); gav.className = "ini-gaveta"; gav.hidden = true; box.appendChild(gav); }
    const guarda = n => { if(!n || n === gav || n.parentNode === gav || n.contains(gav) || gav.contains(n)) return; gav.appendChild(n); }; // nunca guarda a própria gaveta
    const capa = box.querySelector(".capa"), sd = box.querySelector(".sd");
    // 1) check-in dentro do topo
    const ck = box.querySelector(".xe-ck, .xe-ck-ok"); if(ck && capa && ck.parentNode !== capa){ ck.classList.add("capa-ck"); capa.appendChild(ck); }
    // 2) "Pra você agora"
    let pv = box.querySelector(".pv"); if(!pv){ pv = document.createElement("section"); pv.className = "pv"; pv.setAttribute("aria-label", "Pra você agora"); pv.innerHTML = `<div class="sec-title"><h3>Pra você agora</h3></div><div class="hscroll pv-row"></div>`; }
    const row = pv.querySelector(".pv-row");
    CTX_INI.forEach(([sel, i, cor, ft, fs, fa], k) => box.querySelectorAll(sel).forEach(n => {
      if(n.closest(".ini-gaveta") || n.closest(".pv") || n.closest("#sheet") || n.closest(".capa")) return;
      const id = "pv" + k + "-" + Math.random().toString(36).slice(2, 7); n.dataset.pv = id;
      const sub = (fs(n) || "").slice(0, 90);
      row.insertAdjacentHTML("beforeend", `<button class="pv-c" data-pvk="${k}" data-pvid="${id}" style="--pc:${cor}"><span class="pv-ic">${ic(i, 20, 2)}</span><span class="pv-t"><b>${esc(ft(n) || "")}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</span>${ic("chev", 16, 2.4)}</button>`);
      guarda(n);
    }));
    [...row.children].sort((a, b) => +a.dataset.pvk - +b.dataset.pvk).forEach(c => row.appendChild(c));
    row.querySelectorAll(".pv-c").forEach(c => c.onclick = () => { const it = CTX_INI[+c.dataset.pvk], n = box.querySelector(`[data-pv="${c.dataset.pvid}"]`); SOM.tap && SOM.tap(); if(n) try{ it[5](n); }catch(e){ console.warn(e); } });
    pv.hidden = true; // "Pra você agora" saiu do Início (a grade Tudo do CK Life leva aos mesmos lugares); os blocos seguem na gaveta
    // xp-ini sem nada visível (banners do Início continuam aparecendo se houver)
    const xi = $("xp-ini"); if(xi) xi.hidden = !xi.children.length;
    // 3) Sua semana: calendário + sequência + ritmo + evolução num cartão só
    const sem = [...box.children].find(e => e.classList.contains("card") && /Esta semana/.test(txt(e, "h3")));
    if(sem && !sem.querySelector(".ss")){
      const s = streak(), L = ME.treinos || [], min = L.reduce((a, t) => a + (t.min || 0), 0), r = typeof meuRitmo === "function" ? meuRitmo() : null;
      sem.classList.add("semana2"); const h = sem.querySelector("h3"); if(h) h.textContent = "Sua semana";
      sem.insertAdjacentHTML("beforeend", `<div class="ss"><span><b class="num">🔥 ${s}</b><small>${s === 1 ? "dia seguido" : "dias seguidos"}</small></span>${r ? `<span><b class="num">${r.v}</b><small>Meu Ritmo</small></span>` : ""}<span><b class="num">${L.length}</b><small>treinos</small></span><span><b class="num">${int(min)}</b><small>minutos</small></span></div><button class="link ss-ev" id="ss-ev">Ver minha evolução ${ic("chev", 14, 2.4)}</button>`);
      $("ss-ev").onclick = () => tab("evolucao");
    }
    const evo = $("h-evo"); if(evo && !gav.contains(evo)){ const d = evo.closest("#t-inicio > *"); if(d && d !== sem && d !== gav) guarda(d); }
    box.querySelectorAll(".xe-rit, .xe-seq-tx").forEach(guarda);
    const xd = box.querySelector(".xe-dia"); if(xd && !xd.children.length) guarda(xd);
    // 3b) "Você é CK Life Pro" sai do Início: vira a coroinha no topo, ao lado do foguinho
    box.querySelectorAll(".pl-bloco").forEach(b => { if(b.querySelector(".pl-pro")) guarda(b); });
    proTopo();
    // 4) treinos rápidos saem do Início (ficam na aba Treinos e no "Mais um?")
    const rap = $("h-rap"); if(rap && !gav.contains(rap)){ const t = rap.closest(".sec-title"), hs = t && t.nextElementSibling; guarda(t); if(hs && hs.classList.contains("hscroll")) guarda(hs); }
    // 5) receita compacta
    const rh = box.querySelector(".rhero"); if(rh) rh.classList.add("rhero-mini");
    // 6) ordem final
    const recT = $("h-card") && $("h-card").closest(".sec-title");
    const aviso = box.querySelector(":scope > .notice"); if(aviso) aviso.classList.add("aviso-fino");
    const ordem = [capa, aviso, sd, pv, box.querySelector(".tudo"), xi && !xi.hidden ? xi : null, sem, recT, rh, box.querySelector(".pr-fila")].filter(Boolean);
    const fim = [...box.querySelectorAll(":scope > .ad-card, :scope > .slogan")];
    const resto = [...box.children].filter(e => !ordem.includes(e) && !fim.includes(e) && e !== gav && e !== xi && !e.classList.contains("xe-dia"));
    [...ordem, ...resto, ...fim, gav].forEach(e => box.appendChild(e));
    if(xd){ if(xd.children.length && sd) sd.after(xd); else if(!xd.children.length) guarda(xd); }
  } finally { ORG = false; }
}
const rInicioOrg = rInicio; rInicio = function(){ const r = rInicioOrg.apply(this, arguments); organizaInicio(); return r; };
/* coisas que chegam depois (ciclo, cabelo, novidades, convite do plano): reorganiza de novo */
{ let tm = null; const ob = new MutationObserver(() => { if(ORG) return; clearTimeout(tm); tm = setTimeout(() => { if(TAB === "inicio") organizaInicio(); }, 120); });
  const liga = () => { const b = $("t-inicio"); if(b) ob.observe(b, { childList: true, subtree: true }); else setTimeout(liga, 500); }; setTimeout(liga, 0); }

/* coroinha Pro no topo (só para quem paga); toque abre o status da assinatura */
function proTopo(){
  const sc = $("streak-chip"); if(!sc) return; let b = $("b-pro"); const pro = typeof pagou === "function" && pagou();
  if(!pro){ if(b) b.remove(); return; }
  if(!b){ sc.insertAdjacentHTML("beforebegin", `<button class="pro-top" id="b-pro" aria-label="Você é CK Life Pro" title="Você é CK Life Pro"><i class='ckc' aria-hidden='true'></i></button>`); b = $("b-pro"); b.onclick = () => { SOM.tap && SOM.tap(); paywall(); }; }
}
setInterval(proTopo, 5000); setTimeout(proTopo, 1500);
