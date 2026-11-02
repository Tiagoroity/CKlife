/* ===================== PIXEL DA META (medir anúncios) =====================
   Só funciona se a pessoa aceitar os cookies (LGPD). Nunca no painel do administrador.
   Eventos: PageView (abriu o app), CompleteRegistration (fez cadastro), EntrouNoApp (fez login / abriu já logada).
   Nenhum dado de saúde, ciclo, peso ou e-mail é enviado. */
const PX_ID = "1874194974017339", PX_K = "ck_cookies";
const pxModoAdm = () => /#admin|\/admin/.test(location.href);
let PX_FILA = [];
function pxCarrega(){ if(window.fbq || pxModoAdm()) return; !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', PX_ID); fbq('track', 'PageView'); PX_FILA.forEach(([t, n, d]) => fbq(t, n, d || {})); PX_FILA = []; }
const pxOk = () => { try{ return localStorage.getItem(PX_K) === "sim"; }catch(e){ return false; } };
function pxEvento(n, d, custom){ if(pxModoAdm()) return; const t = custom ? "trackCustom" : "track"; if(window.fbq) try{ fbq(t, n, d || {}); }catch(e){} else { let v = null; try{ v = localStorage.getItem(PX_K); }catch(e){} if(v !== "nao") PX_FILA.push([t, n, d]); } }
function pxBanner(){ if(pxModoAdm() || document.getElementById("px-ck")) return; let v = null; try{ v = localStorage.getItem(PX_K); }catch(e){} if(v) return;
  const d = document.createElement("div"); d.id = "px-ck"; d.className = "px-ck"; d.setAttribute("role", "dialog");
  d.innerHTML = `<p>Usamos cookies para medir nossos anúncios. Nenhum dado de saúde é usado. Você escolhe.</p><div><button class="btn btn-line btn-sm" id="px-nao">Recusar</button><button class="btn btn-accent btn-sm" id="px-sim">Aceitar</button></div>`;
  document.body.appendChild(d);
  document.getElementById("px-sim").onclick = () => { try{ localStorage.setItem(PX_K, "sim"); }catch(e){} d.remove(); pxCarrega(); };
  document.getElementById("px-nao").onclick = () => { try{ localStorage.setItem(PX_K, "nao"); }catch(e){} PX_FILA = []; d.remove(); }; }
/* veio do site cklife.com.br já com a escolha de cookies (ck=1 aceitou, ck=0 recusou): usa a mesma escolha e não pergunta de novo */
try{ const u = new URL(location.href), c = u.searchParams.get("ck");
  if(c === "1" || c === "0"){ if(!localStorage.getItem(PX_K)) localStorage.setItem(PX_K, c === "1" ? "sim" : "nao"); u.searchParams.delete("ck"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); } }catch(e){}
if(pxOk()) pxCarrega(); else setTimeout(pxBanner, 2500);
if(NU && NU.cadastrar){ const cad0 = NU.cadastrar; NU.cadastrar = async function(){ const r = await cad0.apply(this, arguments); if(r && !r.erro) pxEvento("CompleteRegistration", { content_name: "Cadastro CK Life", status: true }); return r; }; }
if(NU && NU.entrar){ const ent0 = NU.entrar; NU.entrar = async function(){ const r = await ent0.apply(this, arguments); if(r && !r.erro) pxEvento("EntrouNoApp", { tipo: "login" }, true); return r; }; }
{ const abrirAppPx = abrirApp; let px1 = false; abrirApp = function(){ const r = abrirAppPx.apply(this, arguments); if(!px1){ px1 = true; pxEvento("EntrouNoApp", { tipo: "abriu" }, true); } return r; }; }
