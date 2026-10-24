/* Robô de testes do CK Life (só no ambiente de teste). Percorre telas e botões e anota problemas. */
(function(){
const esp = ms => new Promise(r => setTimeout(r, ms));
const ERR = []; let onde = "inicio";
window.addEventListener("error", e => ERR.push(`[${onde}] ${e.message} @${(e.filename || "").split("/").pop()}:${e.lineno}`));
window.addEventListener("unhandledrejection", e => ERR.push(`[${onde}] promessa: ${(e.reason && (e.reason.message || e.reason)) || e.reason}`));
const ce = console.error; console.error = function(...a){ ERR.push(`[${onde}] console: ${a.map(x => (x && x.message) || String(x)).join(" ").slice(0, 200)}`); return ce.apply(this, a); };
window.confirm = () => false; window.prompt = () => null; window.alert = () => {};
window.open = () => null;
HTMLInputElement.prototype.click = function(){ };           // não abre seletor de arquivo
if(navigator.share) navigator.share = async () => {};
const PERIGO = /sair|excluir|apagar|deletar|bloque|denunc|remover|desativ|zerar|limpar|cancelar assinatura|encerrar|esquecer|eliminar|logout|resetar|desligar|deixar de seguir|parar de seguir|publicar|enviar|postar|comprar|ver produto|whatsapp|instagram|site|como chegar|pagar|assinar|instalar|copiar|baixar|exportar|imprimir/i;
const fechaTudo = async () => {
  for(let k = 0; k < 4; k++){
    const sh = document.getElementById("sheet"); if(sh && !sh.hidden){ const x = document.getElementById("sheet-close"); if(x) x.click(); await esp(150); }
    const pl = document.getElementById("play"); if(pl && !pl.hidden){ const x = document.getElementById("pl-x"); if(x) x.click(); await esp(150); if(!pl.hidden){ pl.hidden = true; document.body.style.overflow = ""; } }
    const ck = document.getElementById("cook"); if(ck && !ck.hidden){ const x = ck.querySelector("[id*=x],[aria-label*=Fechar],[aria-label*=Sair]"); if(x) x.click(); else ck.hidden = true; await esp(150); }
    document.querySelectorAll("#rl,#so-prev:not([hidden]),#so-filtro:not([hidden]),.so-story:not([hidden]),.modal,.so-pop:not([hidden]),.so-foto,.so-celebra,.ad").forEach(e => { const b = e.querySelector("[id$=-x],[aria-label=Fechar],[aria-label=Voltar],[aria-label=Cancelar]"); if(b) b.click(); else e.hidden = true; });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await esp(80);
  }
  document.body.style.overflow = "";
};
const imgsQuebradas = root => [...(root || document).querySelectorAll("img")].filter(i => i.complete && i.getAttribute("src") && !i.src.startsWith("data:") && i.naturalWidth === 0 && i.offsetParent !== null).map(i => i.getAttribute("src"));
const vaza = () => { const w = document.documentElement.clientWidth; return [...document.querySelectorAll("#v-app *, #sheet *")].filter(e => { if(e.offsetParent === null) return false; const r = e.getBoundingClientRect(); if(r.width === 0) return false; let p = e.parentElement; while(p){ const s = getComputedStyle(p); if(/(auto|scroll|hidden)/.test(s.overflowX)) return false; p = p.parentElement; } return r.right > w + 2 || r.left < -2; }).slice(0, 3).map(e => (e.id ? "#" + e.id : e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : e.tagName) + " " + (e.textContent || "").trim().slice(0, 25)); };
const rotulo = b => ((b.getAttribute("aria-label") || b.textContent || b.title || "").trim().replace(/\s+/g, " ")).slice(0, 40);
window.QA = {
  ERR,
  async aba(tab, prepara){
    const R = { tab, botoes: 0, problemas: [] };
    const abre = async () => { await fechaTudo(); const n = document.querySelector(`#nav [data-tab="${tab}"]`); if(n) n.click(); else if(window.__tab) window.__tab(tab); await esp(700); if(prepara) await prepara(); await esp(300); };
    await abre(); onde = tab;
    const box = document.getElementById("t-" + tab); if(!box){ R.problemas.push("aba não existe"); return R; }
    const lista = () => [...box.querySelectorAll("button, [role=button], a.btn")].filter(b => b.offsetParent !== null && !b.disabled && !PERIGO.test(rotulo(b)));
    const total = lista().length; R.botoes = total;
    const q0 = imgsQuebradas(box); if(q0.length) R.problemas.push("imagem quebrada: " + q0.slice(0, 4).join(", "));
    const v0 = vaza(); if(v0.length) R.problemas.push("vaza: " + v0.join(" | "));
    for(let i = 0; i < Math.min(total, 70); i++){
      const L = lista(); const b = L[i]; if(!b) continue;
      const nome = rotulo(b); onde = `${tab} › ${nome}`; const e0 = ERR.length;
      try{ b.scrollIntoView({ block: "center" }); b.click(); }catch(e){ ERR.push(`[${onde}] clique: ${e.message}`); }
      await esp(650);
      const sh = document.getElementById("sheet");
      if(sh && !sh.hidden){ const q = imgsQuebradas(sh); if(q.length) R.problemas.push(`${nome}: imagem quebrada ${q.slice(0, 3).join(", ")}`); const v = vaza(); if(v.length) R.problemas.push(`${nome}: vaza ${v.join(" | ")}`); }
      if(ERR.length > e0) R.problemas.push(...ERR.slice(e0));
      await abre(); onde = tab;
    }
    return R;
  },
  fecha: fechaTudo, vaza, imgsQuebradas
};
})();
