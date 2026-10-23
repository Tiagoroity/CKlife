
/* ===================== NAVEGAÇÃO (voltar e gestos) =====================
   - Botão voltar do celular/navegador fecha a janela aberta (não sai do app).
   - Fora do Início, o voltar leva para o Início antes de sair.
   - Arrastar da borda esquerda para a direita fecha a janela (como apps de iPhone). */
const CAMADAS = [
  ["#so-pop", () => { $("so-pop").hidden = true; }],
  ["#celebra", () => { const b = $("ce-ok"); if(b) b.click(); else $("celebra").hidden = true; }],
  ["#so-filtro", () => { const b = $("fl-x"); if(b) b.click(); else $("so-filtro").hidden = true; }],
  ["#so-prev", () => { const b = document.querySelector("#so-prev .so-prev-top .iconbtn"); if(b) b.click(); else $("so-prev").hidden = true; }],
  ["#so-foto", () => { const b = $("sf-x"); if(b) b.click(); else $("so-foto").hidden = true; }],
  ["#story", () => fechaStory()],
  ["#modal", () => { const b = document.querySelector("#mbox [data-close]"); if(b) b.click(); else $("modal").hidden = true; }],
  ["#sheet", () => fecharSheet()],
  ["#cook", () => fechaCozinha()],
  ["#play", () => sairTreino()]
];
const visivel = sel => { const e = document.querySelector(sel); return e && !e.hidden && e.isConnected; };
const topo = () => CAMADAS.find(([s]) => visivel(s));
let NAV_M = false, NAV_T = false, NAV_IGN = 0, NAV_TM = null;
function navSinc(){ clearTimeout(NAV_TM); NAV_TM = setTimeout(() => {
  const ab = !!topo();
  if(ab && !NAV_M){ history.pushState({ ckm: 1 }, ""); NAV_M = true; }
  else if(!ab && NAV_M){ NAV_M = false; NAV_IGN++; history.back(); }
}, 30); }
new MutationObserver(ms => { if(ms.some(m => m.type === "childList" ? [...m.addedNodes].some(n => n.nodeType === 1 && /^(so-|celebra|story)/.test(n.id || "")) : true)) navSinc(); })
  .observe(document.body, { attributes: true, attributeFilter: ["hidden"], subtree: true, childList: true });
window.addEventListener("popstate", () => {
  if(NAV_IGN > 0){ NAV_IGN--; return; }
  if(NAV_M){ NAV_M = false; const t = topo(); if(t) t[1](); navSinc(); return; }
  if(NAV_T){ NAV_T = false; if(typeof TAB !== "undefined" && TAB !== "inicio" && !$("v-app").hidden) tab("inicio"); }
});
const tabNav = tab;
tab = function(t){ const r = tabNav.apply(this, arguments);
  if(!$("v-app") || $("v-app").hidden) return r;
  if(t !== "inicio" && !NAV_T && !NAV_M){ history.pushState({ ckt: 1 }, ""); NAV_T = true; }
  else if(t === "inicio" && NAV_T && !NAV_M){ NAV_T = false; NAV_IGN++; history.back(); }
  return r; };

/* ---------- arrastar da borda esquerda para voltar ---------- */
const ARRASTA = ["#sheet", "#so-prev", "#so-foto", "#so-filtro", "#cook"];
let G = null;
document.addEventListener("touchstart", e => {
  const t = e.touches[0]; if(!t || e.touches.length > 1 || t.clientX > 26) return;
  const c = topo(); if(!c || !ARRASTA.includes(c[0])) return;
  const el = document.querySelector(c[0]); G = { el, x0: t.clientX, y0: t.clientY, t0: Date.now(), dx: 0, ativo: false, fecha: c[1] };
}, { passive: true });
document.addEventListener("touchmove", e => {
  if(!G) return; const t = e.touches[0], dx = t.clientX - G.x0, dy = t.clientY - G.y0;
  if(!G.ativo){ if(Math.abs(dy) > 14 && Math.abs(dy) > dx){ G = null; return; } if(dx > 10){ G.ativo = true; G.el.style.transition = "none"; G.el.classList.add("nav-arrasta"); } }
  if(G.ativo){ G.dx = Math.max(0, dx); G.el.style.transform = `translateX(${G.dx}px)`; G.el.style.boxShadow = "-12px 0 30px rgba(0,0,0,.18)"; if(e.cancelable) e.preventDefault(); }
}, { passive: false });
document.addEventListener("touchend", () => {
  if(!G) return; const g = G; G = null; if(!g.ativo) return;
  const vel = g.dx / Math.max(1, Date.now() - g.t0), sai = g.dx > innerWidth * .33 || (g.dx > 60 && vel > .45);
  g.el.style.transition = "transform .22s cubic-bezier(.2,.8,.2,1)";
  if(sai){ g.el.style.transform = "translateX(100%)"; vibra(8);
    setTimeout(() => { g.fecha(); g.el.style.transition = "none"; g.el.style.transform = ""; g.el.style.boxShadow = ""; g.el.classList.remove("nav-arrasta"); }, 210); }
  else { g.el.style.transform = ""; setTimeout(() => { g.el.style.boxShadow = ""; g.el.classList.remove("nav-arrasta"); }, 230); }
});
document.addEventListener("touchcancel", () => { if(G && G.ativo){ G.el.style.transition = "transform .2s"; G.el.style.transform = ""; } G = null; });
