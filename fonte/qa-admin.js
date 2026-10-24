/* Robô de testes do painel admin (só no ambiente de teste). Abre cada seção, toca nos botões seguros, abre formulários e fecha. */
(function(){
const esp = ms => new Promise(r => setTimeout(r, ms));
const ERR = []; let onde = "";
window.addEventListener("error", e => ERR.push(`[${onde}] ${e.message} :${e.lineno}`));
window.addEventListener("unhandledrejection", e => ERR.push(`[${onde}] promessa: ${(e.reason && (e.reason.message || e.reason)) || e.reason}`));
const ce = console.error; console.error = function(...a){ ERR.push(`[${onde}] console: ${a.map(x => (x && x.message) || String(x)).join(" ").slice(0, 160)}`); return ce.apply(this, a); };
window.confirm = () => false; window.prompt = () => null; window.alert = () => {}; window.open = () => null;
HTMLInputElement.prototype.click = function(){};
const PERIGO = /sair|excluir|apagar|deletar|bloque|remover|desativ|zerar|limpar|cancelar|encerrar|eliminar|resetar|desligar|publicar|enviar|disparar|salvar|confirmar|aprovar|recusar|rejeitar|banir|suspender|dar pro|conceder|tirar pro|ligar|duplicar|testar link|copiar|exportar|pdf|imprimir|baixar|nova notificação|novo anúncio|marcar|resolver|ocultar|restaurar|mover|ordenar|subir|descer|↑|↓/i;
const rot = b => ((b.getAttribute("aria-label") || b.textContent || b.title || "").trim().replace(/\s+/g, " ")).slice(0, 40);
const fecha = async () => { const m = document.getElementById("modal"); if(m && !m.hidden){ m.hidden = true; document.body.style.overflow = ""; } const sh = document.getElementById("sheet"); if(sh && !sh.hidden){ const c = document.getElementById("sheet-close"); c && c.click(); } document.querySelectorAll(".adm-busca").forEach(b => b.hidden = true); await esp(120); };
window.QAA = { ERR,
  async secao(s){
    const R = { s, botoes: 0, problemas: [] };
    const abre = async () => { await fecha(); const b = document.querySelector(`#adm-tabs [data-s="${s}"]`); if(b) b.click(); await esp(550); };
    await abre(); onde = s; const e0 = ERR.length;
    const main = document.getElementById("adm-main");
    const lista = () => [...main.querySelectorAll("button, [role=tab], select")].filter(b => b.offsetParent !== null && !b.disabled && !PERIGO.test(rot(b)));
    const n = Math.min(lista().length, 12); R.botoes = n;
    const quebradas = [...main.querySelectorAll("img")].filter(i => i.complete && i.getAttribute("src") && !i.src.startsWith("data:") && i.naturalWidth === 0 && i.offsetParent).map(i => i.getAttribute("src"));
    if(quebradas.length) R.problemas.push("imagem quebrada: " + quebradas.slice(0, 3).join(", "));
    for(let i = 0; i < n; i++){
      const b = lista()[i]; if(!b) continue; const nome = rot(b); onde = `${s} › ${nome}`; const k0 = ERR.length;
      try{ if(b.tagName === "SELECT"){ if(b.options.length > 1){ b.selectedIndex = (b.selectedIndex + 1) % b.options.length; b.dispatchEvent(new Event("change", { bubbles: true })); } } else b.click(); }catch(e){ ERR.push(`[${onde}] clique: ${e.message}`); }
      await esp(450);
      if(ERR.length > k0) R.problemas.push(...ERR.slice(k0));
      await abre(); onde = s;
    }
    if(ERR.length > e0 && !R.problemas.length) R.problemas.push(...ERR.slice(e0));
    return R;
  }, fecha };
})();
