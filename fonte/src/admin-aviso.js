/* ===================== Painel · Aviso de aluna nova no celular =====================
   Cada pessoa da equipe liga o próprio aviso. O envio é feito pelo banco quando a conta da aluna é criada.
   No iPhone o aviso chega no app CK Life instalado na tela de início (Perfil > Avisos no celular). */
const AV_VAPID = "BJ7wud6TE-eeF889qLG9sRvdppjzQvNJgifeuMN8MrTEkvSYjKbSrLvPyyxPgRJLXywLSwypDdj9RaoTQm60bCc";
let AV_EST = null;
let AV_AQUI = false;   // este aparelho já recebe avisos?
async function avAqui(){ try{ if(!avPodePush() || Notification.permission !== "granted") return (AV_AQUI = false); const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); AV_AQUI = !!sub; }catch(e){ AV_AQUI = false; } return AV_AQUI; }
const avSB = () => F.nuvem && F.nuvem.ativo && F.nuvem.sb;
const avB64 = s => { const p = "=".repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...b].map(c => c.charCodeAt(0))); };
const avIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const avInstalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const avPodePush = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
async function avStatus(ligar){ const sb = avSB(); if(!sb) return null; const r = await sb.rpc("admin_aviso_nova_aluna", ligar == null ? {} : { p_ligar: ligar }); if(r.error) throw r.error; return (AV_EST = r.data); }
async function avInscreve(){
  const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
  if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: avB64(AV_VAPID) });
  const j = sub.toJSON(), r = await avSB().from("push_inscricoes").upsert({ endpoint: j.endpoint, user_id: F.nuvem.uid, p256dh: j.keys.p256dh, auth: j.keys.auth }); if(r.error) throw r.error;
}
async function avLigar(){
  try{
    if(avIOS() && !avInstalado()){ toast("No iPhone: abra o app CK Admin (ícone dourado) e toque em Ativar neste aparelho"); await avStatus(true); avPinta(); return; }
    if(!avPodePush()) return toast("Este navegador não recebe avisos. Use o Chrome ou o app instalado.");
    if(Notification.permission === "denied") return toast("Os avisos estão bloqueados neste navegador. Libere nas configurações.");
    if(Notification.permission !== "granted" && await Notification.requestPermission() !== "granted") return toast("Tudo bem, você pode ligar depois.");
    await avInscreve(); AV_AQUI = true; await avStatus(true); toast("Pronto! Você vai saber quando chegar aluna nova 💚"); avPinta();
  }catch(e){ console.warn(e); toast("Não deu para ligar agora. Tente de novo."); }
}
async function avDesligar(){ try{ await avStatus(false); toast("Aviso de aluna nova desligado"); avPinta(); }catch(e){ toast("Não deu para desligar agora."); } }
function avPinta(){
  const main = $("adm-main"); if(!main || !avSB()) return;
  const h = main.querySelector(".head"); if(!h) return;
  let box = $("av-nova"); if(!box){ h.insertAdjacentHTML("afterend", `<div class="card" id="av-nova" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px"></div>`); box = $("av-nova"); }
  const e = AV_EST, lig = e && e.ligado, ap = e ? +e.aparelhos || 0 : 0;
  const txt = !e ? "Carregando…" : !lig ? "Desligado. Ligue para receber um aviso no celular sempre que uma aluna nova se cadastrar."
    : AV_AQUI ? `Ligado e funcionando neste aparelho${ap > 1 ? ` (e em mais ${ap - 1})` : ""}. Você recebe "Nova aluna no CK Life" com o primeiro nome e a cidade.`
    : ap ? `Ligado em ${ap} aparelho${ap > 1 ? "s" : ""}, mas não neste. Toque em Ativar neste aparelho se quiser receber aqui também.`
    : avIOS() && !avInstalado() ? "Ligado, mas falta ativar no celular. No iPhone: abra o app CK Admin (ícone dourado) pela tela de início e toque em Ativar neste aparelho."
    : "Ligado, mas nenhum aparelho seu está recebendo avisos ainda. Toque em Ativar neste aparelho.";
  box.innerHTML = `<span style="font-size:24px" aria-hidden="true">🔔</span><div style="flex:1;min-width:220px"><b>Aviso de aluna nova no celular</b><br><small class="muted">${esc(txt)}</small></div>
    ${!lig ? `<button class="btn btn-accent btn-sm" id="av-on">Ligar aviso</button>` : `${!AV_AQUI && avPodePush() && !(avIOS() && !avInstalado()) ? `<button class="btn btn-accent btn-sm" id="av-on">Ativar neste aparelho</button>` : ""}<button class="btn btn-line btn-sm" id="av-off">Desligar</button>`}`;
  const on = $("av-on"), off = $("av-off"); if(on) on.onclick = avLigar; if(off) off.onclick = avDesligar;
}
async function avMostra(){ if(!avSB()) return; avPinta(); try{ await Promise.all([avStatus(), avAqui()]); }catch(e){ AV_EST = null; } if(!AV_EST){ const b = $("av-nova"); if(b) b.remove(); return; } avPinta(); }
["resumo", "alunos"].forEach(k => { const v0 = VIEWS[k]; if(!v0) return; VIEWS[k] = function(){ const r = v0.apply(this, arguments); setTimeout(avMostra, 0); setTimeout(() => { if(!$("av-nova") && AV_EST) avPinta(); }, 1200); return r; }; });
