/* ===================== ATUALIZAR O APP =====================
   Quem deixa o CK Life aberto (ou instalado na tela inicial) fica com a versão antiga até recarregar.
   O app confere a versão publicada ao abrir, ao voltar do segundo plano e a cada 5 minutos.
   Se houver versão nova, mostra a faixa "ATUALIZAR": um toque e pronto. Nunca aparece no meio do treino. */
const CK_VER = "__CK_VERSAO__";
let CK_VER_NOVA = null;
async function confereVersao(){
  if(!/^\d/.test(CK_VER) || !/^https?:/.test(location.protocol)) return;
  try{
    const r = await fetch("/versao.json?t=" + Date.now(), { cache: "no-store" }); if(!r.ok) return;
    const v = (await r.json()).v; if(v && v !== CK_VER){ CK_VER_NOVA = v; mostraAtualizar(); }
  }catch(e){}
}
function mostraAtualizar(){
  if(!CK_VER_NOVA || document.getElementById("ck-atu")) return;
  const pl = document.getElementById("play"), ck = document.getElementById("cook");
  if((pl && !pl.hidden) || (ck && !ck.hidden)){ setTimeout(mostraAtualizar, 20000); return; }   // espera o treino acabar
  const d = document.createElement("div"); d.id = "ck-atu"; d.className = "ck-atu"; d.setAttribute("role", "status");
  d.innerHTML = `<span class="ck-atu-i">✨</span><span class="ck-atu-t"><b>Nova versão do CK Life</b><small>Toque para atualizar. Seus dados ficam salvos.</small></span><button class="btn ck-atu-b" id="ck-atu-b">ATUALIZAR</button>`;
  document.body.appendChild(d);
  document.getElementById("ck-atu-b").onclick = async () => {
    const b = document.getElementById("ck-atu-b"); b.disabled = true; b.textContent = "Atualizando…";
    try{ if(typeof save === "function") save(); }catch(e){}
    try{ if("caches" in window){ const k = await caches.keys(); await Promise.all(k.map(x => caches.delete(x))); } }catch(e){}
    try{ const reg = await navigator.serviceWorker?.getRegistration(); if(reg) await reg.update(); }catch(e){}
    location.replace(location.pathname + "?v=" + CK_VER_NOVA + location.hash);
  };
}
setTimeout(confereVersao, 4000);
setInterval(() => { if(!document.hidden) confereVersao(); }, 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => { if(!document.hidden) confereVersao(); });
window.addEventListener("pageshow", e => { if(e.persisted) confereVersao(); });
