/* ===================== CONVITE PARA INSTALAR O CK LIFE (PWA) =====================
   Reaproveita o que já existia: PEDIDO_INSTALAR (beforeinstallprompt, em app.js), instalado(), ehIOS(),
   navInterno() e o cartão do Perfil. Aqui entra só:
   - o convite no momento certo (depois do cadastro, do onboarding e de uma primeira experiência);
   - o fluxo único de "Instalar CK Life" (Android com prompt nativo, Android sem prompt, iPhone, navegador de outro app);
   - a opção fixa "Instalar CK Life" no Perfil.
   Nunca aparece antes do login, no cadastro, no onboarding, no painel admin, durante o treino ou com o app já instalado. */
const INST_K = "ck_inst";            // { nao: "AAAA-MM-DD", vezes: n, ok: true }
const INST_ESPERA = 7, INST_MAX = 3;  // depois de "Agora não": espera 7 dias; no máximo 3 convites automáticos
const instLe = () => { try{ return JSON.parse(localStorage.getItem(INST_K) || "{}") || {}; }catch(e){ return {}; } };
const instGrava = o => { try{ localStorage.setItem(INST_K, JSON.stringify(Object.assign(instLe(), o))); }catch(e){} };
const instSessao = () => { try{ return sessionStorage.getItem(INST_K) === "1"; }catch(e){ return false; } };
const instMarcaSessao = () => { try{ sessionStorage.setItem(INST_K, "1"); }catch(e){} };
const ehSafariIOS = () => ehIOS() && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//i.test(navigator.userAgent);
const ehSamsung = () => /SamsungBrowser/i.test(navigator.userAgent);

window.addEventListener("appinstalled", () => { instGrava({ ok: true }); try{ if(ME && !ME.pwaInstalado){ ME.pwaInstalado = today(); save(); } }catch(e){} PEDIDO_INSTALAR = null; const m = $("ck-inst"); if(m) m.remove(); try{ toast("Pronto! O CK Life está na sua tela inicial 💚"); }catch(e){} });

/* já usa o app instalado (em qualquer aparelho dela): fica salvo na conta, assim o navegador também para de convidar */
const jaInstalou = () => instalado() || instLe().ok || !!(ME && ME.pwaInstalado);
function instMarcaConta(){ try{ if(instalado() && ME && !ME.pwaInstalado && !(typeof modoAdmin === "function" && modoAdmin())){ ME.pwaInstalado = today(); save(); } }catch(e){} }
/* pode convidar agora? */
function instPodeConvidar(){
  instMarcaConta();
  if(jaInstalou() || instSessao()) return false;
  if(typeof modoAdmin === "function" && modoAdmin()) return false;
  if(!ME || !ME.perfil || !ME.perfil.local) return false;                  // onboarding ainda não terminou
  if($("v-app").hidden || !$("v-onb").hidden || !$("v-login").hidden) return false;
  const s = instLe(); if((s.vezes || 0) >= INST_MAX) return false;
  if(s.nao && s.nao > addD(today(), -INST_ESPERA)) return false;
  // vale para todas que ainda não instalaram (pedido da equipe em 02/11/2026); continua respeitando "Agora não" (7 dias) e o limite de 3 convites
  return true;
}
/* nada aberto por cima (treino, celebração, outra janela, apresentação) */
const instLivre = () => $("sheet").hidden && $("play").hidden && (!$("celebra") || $("celebra").hidden) && !$("pw")?.offsetParent
  && !document.querySelector(".ent, .ent-bv, .coach-1o, #res-ov, #ck-inst, .modal:not([hidden])");

let INST_T = null;
function instAgenda(){
  if(INST_T || !instPodeConvidar()) return;
  let n = 0;
  INST_T = setInterval(() => {
    if(++n > 20 || !instPodeConvidar()){ clearInterval(INST_T); INST_T = null; return; }
    if(n >= 2 && instLivre() && TAB === "inicio"){ clearInterval(INST_T); INST_T = null; instConvite(); }
  }, 1500);
}

/* o convite (mesma camada do CK Life Pro: painel que sobe de baixo) */
function instConvite(){
  instMarcaSessao(); const s = instLe(); instGrava({ vezes: (s.vezes || 0) + 1 });
  const box = document.createElement("div"); box.id = "ck-inst"; box.className = "pw";
  box.innerHTML = `<div class="pw-in inst-conv" role="dialog" aria-modal="true" aria-labelledby="inst-t"><button class="iconbtn sm pw-x" id="inst-x" aria-label="Fechar">${ic("close", 16)}</button>
    <img class="inst-logo" src="img/icone-192.png" alt="" width="72" height="72" onerror="this.remove()">
    <h2 id="inst-t">Leve o CK Life com você 💚</h2>
    <p class="pw-sub">Instale o CK Life no seu celular e tenha acesso rápido aos seus treinos, alimentação e evolução.</p>
    <button class="btn btn-accent btn-block btn-lg" id="inst-sim">${ic("plus", 18)} Instalar CK Life</button>
    <button class="btn btn-line btn-block" id="inst-nao">Agora não</button></div>`;
  document.body.appendChild(box);
  const fecha = nao => { if(nao) instGrava({ nao: today() }); box.remove(); };
  $("inst-x").onclick = () => fecha(true);
  $("inst-nao").onclick = () => fecha(true);
  box.onclick = e => { if(e.target === box) fecha(true); };
  $("inst-sim").onclick = () => { box.remove(); instalarCK(); };
}

/* fluxo único do botão "Instalar CK Life" (convite, Perfil e cartão antigo) */
async function instalarCK(){
  if(instalado()){ toast("O CK Life já está instalado neste aparelho 💚"); return; }
  if(PEDIDO_INSTALAR && !ehIOS() && !navInterno()){          // Android/Chrome: janela nativa de instalação
    const p = PEDIDO_INSTALAR; PEDIDO_INSTALAR = null;
    try{ p.prompt(); const r = await p.userChoice; if(r && r.outcome === "accepted"){ instGrava({ ok: true }); SOM.done && SOM.done(); toast("Pronto! O CK Life está na sua tela inicial 💚"); } else instGrava({ nao: today() }); }
    catch(e){ instInstrucoes(); }
    if(TAB === "perfil") rPerfil(); return;
  }
  instInstrucoes();
}
function instInstrucoes(){
  const passo = (n, t, extra) => `<li class="inst-p"><span class="inst-n">${n}</span><span>${t}</span>${extra || ""}</li>`;
  let tit, h;
  if(navInterno()){
    tit = "Abra no navegador para instalar";
    h = `<p class="pw-sub" style="margin:0">Você está usando o navegador de outro app (Instagram, Facebook ou WhatsApp). Para instalar, abra o CK Life no ${ehIOS() ? "Safari" : "Chrome"}:</p>
      <ol class="inst-lista">${passo(1, `Toque nos <b>três pontinhos</b> ${ehIOS() ? "ou no ícone de <b>compartilhar</b>" : ""} no canto da tela`)}${passo(2, `Escolha <b>Abrir no navegador</b>${ehIOS() ? " (Safari)" : " (Chrome)"}`)}${passo(3, "Lá, toque de novo em <b>Instalar CK Life</b> no seu Perfil")}</ol>`;
  } else if(ehIOS()){
    tit = "Instale o CK Life no seu iPhone";
    h = `${ehSafariIOS() ? "" : `<p class="pw-sub" style="margin:0">Se não encontrar a opção, abra <b>app.cklife.com.br</b> no <b>Safari</b> e siga os passos.</p>`}
      <ol class="inst-lista">${passo(1, `Toque nos <b>três pontinhos ⋯</b> no canto de baixo, à direita`)}${passo(2, `Toque em <b>Compartilhar</b>`, `<span class="inst-ic">${ic("share", 18, 2)}</span>`)}${passo(3, `Escolha <b>Adicionar à Tela de Início</b>`, `<span class="inst-ic">${ic("plus", 18, 2)}</span>`)}${passo(4, `Toque em <b>Adicionar</b>`)}</ol>
      <p class="hint" style="margin:0">${ehSafariIOS() ? "Se o Compartilhar já aparecer na barra de baixo, pode tocar direto nele." : "No Chrome do iPhone, o Compartilhar fica no canto de cima, ao lado do endereço."} Depois, abra o CK Life pelo ícone na tela de início.</p>`;
  } else {
    tit = "Instale o CK Life no seu celular";
    h = ehSamsung()
      ? `<ol class="inst-lista">${passo(1, "Toque no menu <b>☰</b> na barra de baixo")}${passo(2, "Escolha <b>Adicionar página a</b>")}${passo(3, "Toque em <b>Tela inicial</b>")}</ol>`
      : `<ol class="inst-lista">${passo(1, "Toque nos <b>três pontinhos ⋮</b> no canto de cima do Chrome")}${passo(2, "Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>")}${passo(3, "Confirme em <b>Instalar</b>")}</ol>
        <p class="hint" style="margin:0">Se a opção não aparecer, abra <b>app.cklife.com.br</b> no Google Chrome.</p>`;
  }
  sheet(tit, `<div class="inst-tut"><img class="inst-logo" src="img/icone-192.png" alt="" width="64" height="64" onerror="this.remove()">${h}
    <button class="btn btn-accent btn-block" id="inst-entendi">Entendi</button></div>`);
  $("inst-entendi").onclick = fecharSheet;
}

/* o botão do cartão que já existia no Perfil passa a usar o mesmo fluxo */
document.addEventListener("click", e => { if(e.target.closest && e.target.closest("#p-inst")){ e.preventDefault(); e.stopPropagation(); instalarCK(); } }, true);
/* Perfil: opção fixa "Instalar CK Life" (some quando já está instalado) */
const rPerfilInst = rPerfil;
rPerfil = function(){
  const r = rPerfilInst.apply(this, arguments);
  try{
    instMarcaConta();
    if(jaInstalou()) document.querySelectorAll("#t-perfil .inst").forEach(e => e.remove());   // o cartão antigo também some
    if(!jaInstalou() && !$("p-instalar")){
      const ref = $("p-tema");
      if(ref){ ref.insertAdjacentHTML("afterend", setRow("p-instalar", "plus", "Instalar CK Life", "Acesso rápido na tela inicial do celular")); $("p-instalar").onclick = instalarCK; }
    }
  }catch(e){ console.warn(e); }
  return r;
};

/* gatilhos: ao voltar para o Início (depois do 1º treino ou em outro dia) */
const rInicioInst = rInicio;
rInicio = function(){ const r = rInicioInst.apply(this, arguments); setTimeout(instAgenda, 800); return r; };

/* registra, uma vez por dia, se ela abriu pelo app instalado ou pelo navegador (o painel mostra quem ainda não instalou) */
{ const abrirAppAc = abrirApp; abrirApp = function(){ const r = abrirAppAc.apply(this, arguments);
  try{ if(ME && !(typeof modoAdmin === "function" && modoAdmin())){ const k = instalado() ? "acApp" : "acWeb"; if(ME[k] !== today()){ ME[k] = today(); if(k === "acApp" && !ME.pwaInstalado) ME.pwaInstalado = today(); save(); } } }catch(e){}
  return r; }; }
