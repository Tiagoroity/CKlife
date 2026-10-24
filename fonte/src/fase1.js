/* ===================== FASE 1 · FOCO =====================
   Menu com 5 abas (Explorar vira o botão "Loja" no topo), cartão "Seu dia" no Início,
   loja de produtos mais forte (achadinhos, indicação por contexto, promoções, compartilhar)
   e comemoração com a meta da semana no fim do treino. Nada é apagado: só reorganizado. */

/* ---------- Menu: 5 abas + Loja no topo ---------- */
// roda depois do app inteiro carregar (NAV e TAB são criados mais abaixo no arquivo)
setTimeout(() => { const NAV5 = NAV.filter(([k]) => k !== "explorar");
$("nav").innerHTML = NAV5.map(([k, n]) => `<button role="tab" data-tab="${k}" aria-selected="${k === (NAV_DE[TAB] || TAB)}"><span class="ico">${ic(k, 21)}</span>${n}</button>`).join("");
$("nav").querySelectorAll("[data-tab]").forEach(b => b.onclick = () => tab(b.dataset.tab));
}, 0);
setTimeout(() => { const sc = $("streak-chip"); if(!sc || $("b-loja")) return;
  sc.insertAdjacentHTML("beforebegin", `<button class="iconbtn loja-top" id="b-loja" aria-label="Loja e benefícios" title="Loja e benefícios">${ic("bag", 19)}</button>`);
  $("b-loja").onclick = () => { XS.sec = modOn("loja") ? "loja" : "inicio"; XS.q = ""; XS.cat = ""; tab("explorar"); }; }, 0);
const lojaTop = () => { const b = $("b-loja"); if(b) b.hidden = !explorarOn(); };
const aplicaModulosF1 = aplicaModulos; aplicaModulos = function(){ aplicaModulosF1.apply(this, arguments); lojaTop(); };
setTimeout(lojaTop, 400); setInterval(lojaTop, 30000);

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

/* Explorar com o marketplace desligado: vira "Loja e benefícios" (mesma tela, título e busca certos) */
const soLoja = () => !modOn("perto") && !modOn("online") && !modOn("servicos");
const rExplorarF1 = rExplorar; rExplorar = function(){
  const r = rExplorarF1.apply(this, arguments);
  const box = $("t-explorar"); if(!box) return r;
  if(soLoja()){ const c = box.querySelector(".capa"); if(c){ const h = c.querySelector("h1"), p = c.querySelector("p"); if(h) h.textContent = "Loja e benefícios"; if(p) p.textContent = modOn("clube") ? "Produtos escolhidos pela CK e vantagens do Clube para você." : "Produtos escolhidos pela CK para o seu dia a dia."; }
    const q = $("xq"); if(q) q.placeholder = "Buscar produto ou benefício";
    if(!modOn("clube")){ const cid = box.querySelector(".xp-cid"); if(cid) cid.remove(); } }
  return r;
};
const tabF1 = tab; tab = function(t){ const r = tabF1.apply(this, arguments); const b = $("b-loja"); if(b) b.classList.toggle("on", TAB === "explorar"); return r; };
