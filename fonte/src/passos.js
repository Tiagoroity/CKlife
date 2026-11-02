/* ===================== PRIMEIROS PASSOS (só para aluna NOVA, logo depois do cadastro) =====================
   3 telas no visual da entrada: 1) deixar o CK Life na tela do celular (iPhone, Android, navegador do Instagram)
   2) ativar os avisos  3) ela mesma marca o dia e a hora do primeiro treino (5 min, em pé, sem equipamento).
   O progresso fica salvo na conta (ME.passos): no iPhone ela instala, abre pelo ícone, entra e continua de onde parou.
   Quem já usa o app não vê nada disso. Nunca força: sempre tem "Agora não". */
const PP_TREINO = "q-dia";   // "Bom dia em 5 min"
const ppAndroid = () => /android/i.test(navigator.userAgent);
const ppCelular = () => ehIOS() || ppAndroid() || /Mobi/i.test(navigator.userAgent);
const ppEmail = () => esc((ME && ME.email) || "seu e-mail");
const ppHoraBase = () => { const h = (typeof ENT_HORARIO !== "undefined") && ENT_HORARIO.find(x => ME && ME.entrada && x[0] === ME.entrada.horario); return h && /^\d\d:\d\d$/.test(h[4] || "") ? h[4] : "19:00"; };
const ppSvg = {
  share: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>`,
  mais: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`,
  pontos: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#1C1C1E"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`,
  baixar: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>`,
  navegador: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`
};
const ppPasso = (n, txt, lado) => `<li style="--d:${.2 + n * .12}s"><span class="pp-n">${n}</span><span class="pp-tx">${txt}</span>${lado || ""}</li>`;
const ppTile = svg => `<span class="pp-tile" aria-hidden="true">${svg}</span>`;
const ppDots = i => `<div class="pp-dots" aria-label="Passo ${i} de 3">${[1, 2, 3].map(n => `<i class="${n < i ? "ok" : n === i ? "on" : ""}"></i>`).join("")}</div>`;

/* registra este celular para receber avisos. Não depende da comunidade estar pronta; tenta de novo até conseguir. */
async function ppInscreve(){
  if(!PUSH_OK() || Notification.permission !== "granted") return false;
  for(let k = 0; k < 15; k++){
    if(NU && NU.ativo && NU.sb && NU.uid){
      try{
        const reg = SWREG || await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
        if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID) });
        const j = sub.toJSON(), r = await NU.sb.from("push_inscricoes").upsert({ endpoint: j.endpoint, user_id: NU.uid, p256dh: j.keys.p256dh, auth: j.keys.auth });
        if(!r.error) return true;
      }catch(e){ console.warn("avisos", e); }
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}
function ppSalva(o){ ME.passos = Object.assign({}, ME.passos || {}, o); save(); }
function ppFecha(){ const b = $("pp"); if(b) b.remove(); document.body.classList.remove("pp-on"); }
function ppTela(html, cls){
  let box = $("pp");
  if(!box){ box = document.createElement("div"); box.id = "pp"; box.className = "ent pp"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); document.body.appendChild(box); document.body.classList.add("pp-on"); }
  box.className = "ent pp " + (cls || ""); box.innerHTML = `<div class="pp-in">${html}</div>`; box.scrollTop = 0;
  try{ SOM.tap && SOM.tap(); }catch(e){}
  return box;
}
/* nada aberto por cima (treino, Pro, outra janela, recado da Coach) */
const ppLivre = () => $("sheet").hidden && $("play").hidden && !$("pw")?.offsetParent && !document.querySelector(".ent:not(.pp), .coach-1o, #ck-inst, #res-ov, .modal:not([hidden]), #d21");

/* decide a próxima tela */
function ppRoda(){
  if(!ME || !ME.passos || ME.passos.fim) return ppFecha();
  const e = ME.passos.etapa || "inst";
  if(e === "inst"){ if(instalado() || !ppCelular()){ ppSalva({ etapa: "avisos" }); return ppRoda(); } return ppInstalar(); }
  if(e === "avisos"){
    const pode = PUSH_OK() && !(ehIOS() && !instalado());
    if(!pode || Notification.permission === "denied"){ ppSalva({ etapa: "treino" }); return ppRoda(); }
    if(Notification.permission === "granted"){ ppInscreve(); ppSalva({ etapa: "treino", avisos: ME.passos.avisos || today() }); return ppRoda(); }
    return ppAvisos();
  }
  if(e === "treino"){ if((ME.treinos || []).length){ ppSalva({ fim: today() }); return ppFecha(); } return ppTreino(); }
  ppSalva({ fim: today() }); ppFecha();
}

/* ---------- 1) deixar na tela do celular ---------- */
function ppInstalar(){
  try{ instMarcaSessao(); }catch(e){}   // o convite antigo não aparece de novo nesta visita
  const ios = ehIOS(), safari = ios && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//i.test(navigator.userAgent), dentro = navInterno(), nativo = !!PEDIDO_INSTALAR && !ios && !dentro;
  const sam = /SamsungBrowser/i.test(navigator.userAgent);
  let guia = "", cta = "";
  if(dentro){
    guia = `<div class="pp-guia"><div class="pp-guia-h"><span class="pp-chip">${ios ? "iPhone" : "Android"}</span>Você está dentro do Instagram ou Facebook</div>
      <ol class="pp-passos">${ppPasso(1, `Toque nos <b>três pontinhos</b> no canto de cima`, ppTile(ppSvg.pontos))}${ppPasso(2, `Escolha <b>Abrir no ${ios ? "Safari" : "navegador"}</b>`, ppTile(ppSvg.navegador))}${ppPasso(3, `Lá, o CK Life abre já logado e mostra como instalar`)}</ol></div>`;
    cta = `<button class="btn ent-cta" id="pp-copia">${ic("share", 18)} COPIAR LINK DO APP</button>`;
  } else if(ios){
    guia = `<div class="pp-guia"><div class="pp-guia-h"><span class="pp-chip">iPhone</span>${safari ? "Faça aqui no Safari" : "Abra <b>app.cklife.com.br</b> no Safari e faça:"}</div>
      <ol class="pp-passos">${ppPasso(1, `Toque em <b>Compartilhar</b><small>ou em ⋯ e depois Compartilhar</small>`, ppTile(ppSvg.share))}${ppPasso(2, `Toque em <b>Adicionar à Tela de Início</b><small>role a lista se precisar</small>`, ppTile(ppSvg.mais))}${ppPasso(3, `Toque em <b>Adicionar</b>`, `<span class="pp-pill">Adicionar</span>`)}</ol>
      <p class="pp-chave">${ic("check", 16, 2.4)}<span>Depois, abra pelo <b>ícone</b> e entre com <b>${ppEmail()}</b>.</span></p></div>`;
    cta = `<button class="btn ent-cta" id="pp-feito">JÁ ADICIONEI ${ic("check", 18, 2.6)}</button>`;
  } else if(nativo){
    guia = `<p class="pp-mini">Uma janelinha do celular vai pedir para confirmar. É só tocar em <b>Instalar</b>.</p>`;
    cta = `<button class="btn ent-cta" id="pp-nativo">${ic("plus", 18, 2.6)} INSTALAR AGORA</button>`;
  } else {
    guia = `<div class="pp-guia"><div class="pp-guia-h"><span class="pp-chip">Android</span>${sam ? "No navegador Samsung:" : "No Chrome:"}</div>
      <ol class="pp-passos">${sam ? ppPasso(1, `Toque no menu <b>☰</b> na barra de baixo`, ppTile(ppSvg.pontos)) + ppPasso(2, `Escolha <b>Adicionar página a</b> › <b>Tela inicial</b>`, ppTile(ppSvg.mais))
        : ppPasso(1, `Toque nos <b>três pontinhos</b> lá em cima`, ppTile(ppSvg.pontos)) + ppPasso(2, `Escolha <b>Instalar app</b><small>ou Adicionar à tela inicial</small>`, ppTile(ppSvg.baixar))}${ppPasso(3, `Confirme em <b>Instalar</b>`, `<span class="pp-pill">Instalar</span>`)}</ol></div>`;
    cta = `<button class="btn ent-cta" id="pp-feito">JÁ INSTALEI ${ic("check", 18, 2.6)}</button>`;
  }
  ppTela(`${ppDots(1)}
    <div class="pp-hero"><img src="img/passos-celular.webp" alt="" onerror="this.parentNode.remove()"></div>
    <span class="ent-eb">Passo 1 de 3 · 30 segundos</span>
    <h1 class="ent-t pp-t">Seu compromisso merece um lugar na sua tela</h1>
    <p class="pp-sub">Assim seu treino fica <b>a um toque</b> e o lembrete chega na hora certa.</p>
    ${guia}<div class="pp-bt">${cta}<button class="pp-pula" id="pp-nao">pular por enquanto</button></div>`, "pp-inst");
  const prox = () => { ppSalva({ etapa: "avisos" }); ppRoda(); };
  $("pp-nao").onclick = () => { try{ instGrava({ nao: today() }); }catch(e){} prox(); };
  const nat = $("pp-nativo"); if(nat) nat.onclick = async () => {
    const p = PEDIDO_INSTALAR; PEDIDO_INSTALAR = null; if(!p) return prox();
    try{ p.prompt(); const r = await p.userChoice; if(r && r.outcome === "accepted"){ try{ instGrava({ ok: true }); }catch(e){} SOM.done && SOM.done(); ppSalva({ inst: today() }); toast("Pronto! O CK Life está na sua tela 💚"); } }catch(e){}
    prox(); };
  const cp = $("pp-copia"); if(cp) cp.onclick = async () => { try{ await navigator.clipboard.writeText("https://app.cklife.com.br"); toast("Link copiado. Cole no " + (ehIOS() ? "Safari" : "Chrome") + " 💚"); }catch(e){ toast("O link é app.cklife.com.br"); } };
  const fe = $("pp-feito"); if(fe) fe.onclick = () => ehIOS() ? ppAbraIcone() : (ppSalva({ inst: today() }), prox());
}
/* iPhone: os avisos só funcionam abrindo pelo ícone */
function ppAbraIcone(){
  ppSalva({ inst: today(), etapa: "avisos" });
  ppTela(`${ppDots(1)}<div class="pp-ok">${ic("check", 34, 2.6)}</div>
    <span class="ent-eb">Quase lá</span><h1 class="ent-t pp-t">Agora abra o CK Life pelo ícone 💚</h1>
    <p class="pp-sub">Toque no ícone na sua tela e entre com <b>${ppEmail()}</b>. Você continua daqui.</p>
    <div class="pp-icone"><img src="img/icone-192.png" alt="" width="64" height="64" onerror="this.remove()"><b>CK Life</b></div>
    <div class="pp-bt"><button class="link ent-pula" id="pp-aqui">Continuar aqui no navegador</button></div>`, "pp-abra");
  $("pp-aqui").onclick = () => { ppSalva({ etapa: "treino" }); ppRoda(); };
}

/* ---------- 2) avisos ---------- */
function ppAvisos(){
  const hh = ppHoraBase();
  ppTela(`${ppDots(2)}
    <div class="pp-notif" aria-hidden="true"><img src="img/icone-192.png" alt="" width="38" height="38" onerror="this.remove()"><div><span><b>CK Life</b><small>agora</small></span><strong>Hora do seu primeiro treino 💚</strong><p>São só 5 minutos. A gente está junto.</p></div></div>
    <div class="pp-notif pp-notif2" aria-hidden="true"><img src="img/icone-192.png" alt="" width="38" height="38" onerror="this.remove()"><div><span><b>CK Life</b><small>${esc(hh)}</small></span><strong>Recado da Coach</strong><p>Pouco ainda conta. Bora?</p></div></div>
    <span class="ent-eb">Passo 2 de 3</span>
    <h1 class="ent-t pp-t">Deixa a gente te lembrar</h1>
    <p class="pp-sub">Do seu treino, das suas conquistas e quando a rotina apertar. Sem spam.</p>
    <div class="pp-bt"><button class="btn ent-cta" id="pp-ativa">${ic("bell", 18, 2.4)} ATIVAR MEUS AVISOS</button><button class="pp-pula" id="pp-nao">pular por enquanto</button></div><p class="pp-msg" id="pp-msg" role="status"></p>`, "pp-av");
  const prox = () => { ppSalva({ etapa: "treino" }); ppRoda(); };
  $("pp-nao").onclick = prox;
  $("pp-ativa").onclick = async () => {
    const b = $("pp-ativa"); b.disabled = true;
    let p = "default"; try{ p = await Notification.requestPermission(); }catch(e){}
    if(p === "granted"){ await ppInscreve(); SOM.done && SOM.done(); ppSalva({ avisos: today() }); toast("Avisos ativados 💚"); return prox(); }
    const m = $("pp-msg"); if(m) m.textContent = "Tudo bem. Dá para ativar depois em Perfil › Avisos no celular.";
    setTimeout(prox, 1400);
  };
}

/* ---------- 3) ela marca o primeiro treino ---------- */
function ppTreino(){
  const q = QUICK.find(x => x.id === PP_TREINO) || QUICK[0], base = ppHoraBase();
  const agora = new Date(), hhmm = d => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  const minHoje = () => { const d = new Date(Date.now() + 30 * 6e4); d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0); return hhmm(d); };
  let dia = base > hhmm(agora) && agora.getHours() < 21 ? "hoje" : "amanha";
  const avOk = pushLigado();
  ppTela(`${ppDots(3)}
    <span class="ent-eb">Passo 3 de 3</span>
    <h1 class="ent-t pp-t">Quando vai ser seu primeiro treino?</h1>
    <p class="pp-sub">Escolha um momento que caiba de verdade no seu dia.</p>
    <div class="pp-tr"><div class="pp-tr-ic">${ic("play", 22, 2.4)}</div><div><b>${esc(q.nome)}</b><div class="pp-tags"><span>5 min</span><span>Em pé</span><span>Sem equipamento</span><span>Sala ou quarto</span></div></div></div>
    <button class="btn ent-cta" id="pp-agora">${ic("play", 18, 2.4)} AGORA, ESTOU PRONTA</button>
    <div class="pp-ou"><span>ou escolha o seu momento</span></div>
    <div class="pp-seg" role="radiogroup" aria-label="Dia"><button role="radio" data-d="hoje">Hoje</button><button role="radio" data-d="amanha">Amanhã</button></div>
    <label class="pp-hora"><span>${ic("clock", 18, 2.2)} Horário</span><input type="time" id="pp-h" value="${dia === "hoje" && base <= hhmm(agora) ? minHoje() : base}" step="300"></label>
    <button class="btn ent-sec" id="pp-marca">${ic("bell", 18, 2.2)} MARCAR MEU LEMBRETE</button>
    <p class="pp-msg" id="pp-msg" role="status">${avOk ? "" : "Sem os avisos ativados, o lembrete aparece quando você abrir o app."}</p>
    <div class="pp-bt"><button class="pp-pula" id="pp-depois">depois eu vejo</button></div>`, "pp-tre");
  const pinta = () => document.querySelectorAll("#pp [data-d]").forEach(b => { const on = b.dataset.d === dia; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
  document.querySelectorAll("#pp [data-d]").forEach(b => b.onclick = () => { dia = b.dataset.d; pinta(); });
  pinta();
  $("pp-depois").onclick = () => { ppSalva({ fim: today(), pulouTreino: today() }); ppFecha(); };
  $("pp-agora").onclick = () => { ppSalva({ fim: today(), agora: today() }); ppFecha(); abrirTreinoPreview(treinoRapido(q)); };
  $("pp-marca").onclick = async () => {
    const h = ($("pp-h").value || "").slice(0, 5), m = $("pp-msg");
    if(!/^\d\d:\d\d$/.test(h)){ m.textContent = "Escolha um horário."; return; }
    const d = dia === "hoje" ? today() : addD(today(), 1);
    if(dia === "hoje" && h <= hhmm(new Date())){ m.textContent = "Esse horário já passou. Escolha mais tarde ou toque em Agora."; return; }
    ME.primeiro = { dia: d, hora: h }; ppSalva({ fim: today(), marcou: today() });
    if(pushLigado()){ await ppInscreve(); await ppLembreteServidor(d, h); }
    ppCombinado(d, h);
  };
}
/* um lembrete só, no dia e hora que ela escolheu (o servidor manda mesmo com o app fechado) */
async function ppLembreteServidor(d, h){
  try{
    if(!(NU.ativo && NU.sb && NU.uid)) return false;
    const dw = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][new Date(d + "T12:00:00").getDay()];
    const fuso = (() => { try{ return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo"; }catch(e){ return "America/Sao_Paulo"; } })();
    const r = await NU.sb.from("lembretes").upsert({ user_id: NU.uid, tipo: "primeiro", hora: h, dias: [dw], antecedencia: 0, fuso, ativo: true, so_em: d, pausado_ate: null }, { onConflict: "user_id,tipo" });
    return !r.error;
  }catch(e){ return false; }
}
function ppCombinado(d, h){
  const quando = (d === today() ? "Hoje" : "Amanhã") + " às " + h;
  ppTela(`<div class="pp-ok">${ic("check", 34, 2.6)}</div><span class="ent-eb">Combinado</span>
    <h1 class="ent-t pp-t">${esc(quando)} é o seu momento 💚</h1>
    <p class="pp-sub">${pushLigado() ? "A gente te avisa na hora. São só 5 minutos, em pé, no seu cantinho." : "Abra o CK Life nesse horário: seu treino de 5 minutos vai estar logo no Início."}</p>
    <div class="pp-bt"><button class="btn ent-cta" id="pp-ir">IR PARA O APP</button></div>`, "pp-fim");
  try{ confete($("pp")); SOM.done && SOM.done(); }catch(e){}
  $("pp-ir").onclick = () => { ppFecha(); try{ rInicio(); }catch(e){} };
}

/* Início: lembrete visível até ela fazer o primeiro treino (só para quem marcou) */
const rInicioPP = rInicio;
rInicio = function(){
  const r = rInicioPP.apply(this, arguments);
  try{
    const p = ME && ME.primeiro, box = $("t-inicio");
    if(p && !p.feito && !(ME.treinos || []).length && p.dia >= addD(today(), -1) && box && !$("pp-card")){
      const q = QUICK.find(x => x.id === PP_TREINO) || QUICK[0], quando = p.dia === today() ? "hoje às " + p.hora : p.dia === addD(today(), 1) ? "amanhã às " + p.hora : "às " + p.hora;
      const alvo = box.querySelector(".sd") || box.firstElementChild;
      const html = `<button class="pp-card" id="pp-card"><span class="pp-card-ic">${ic("play", 20, 2.4)}</span><span><b>Seu primeiro treino: ${esc(quando)}</b><small>${esc(q.nome)} · em pé, sem equipamento</small></span><span class="pp-card-bt">Começar</span></button>`;
      if(alvo) alvo.insertAdjacentHTML("beforebegin", html); else box.insertAdjacentHTML("afterbegin", html);
      $("pp-card").onclick = () => abrirTreinoPreview(treinoRapido(q));
    }
  }catch(e){}
  return r;
};
/* fez o primeiro treino: some o cartão e o lembrete do servidor */
{ const fimPP = fimTreino; fimTreino = function(){
  const r = fimPP.apply(this, arguments);
  try{ if(ME && ME.primeiro && !ME.primeiro.feito){ ME.primeiro.feito = today(); save(); if(NU.ativo && NU.sb && NU.uid) NU.sb.from("lembretes").delete().eq("user_id", NU.uid).eq("tipo", "primeiro").then(() => {}, () => {}); } }catch(e){}
  return r; }; }

/* entrada: aluna nova não vê mais o pedido de avisos no meio do cadastro quando está no iPhone pelo navegador
   (lá não funciona); ela ativa depois de instalar, no passo 2 */
const ppEntPosOrig = entPos;
entPos = function(){
  try{ if(OB && !OB.veterana && entLista()[OB.pos || 0] === "avisos" && ehIOS() && !instalado()){ OB.avisos = false; OB.pos = (OB.pos || 0) + 1; return onboarding(); } }catch(e){}
  return ppEntPosOrig.apply(this, arguments);
};
/* depois do cadastro: no lugar das boas-vindas, a aluna nova faz os 3 passos */
const ppBV = entBoasVindas;
entBoasVindas = function(){
  try{
    if(ME && ME.boasVindas === "mostrar" && !(ME.entrada && ME.entrada.veterana) && !ME.passos && !(typeof modoAdmin === "function" && modoAdmin())){
      ME.boasVindas = today(); ME.passos = { ini: today(), etapa: "inst" }; save();
      if(ME.lembrete && ME.lembrete.celular && typeof sincLembrete === "function") setTimeout(() => sincLembrete(ME.lembrete), 2500);
      return ppQuandoLivre();
    }
  }catch(e){ console.warn(e); }
  return ppBV.apply(this, arguments);
};
function ppQuandoLivre(){ if(ppQuandoLivre.t) return; let n = 0; const t = ppQuandoLivre.t = setInterval(() => { if(++n > 300){ ppQuandoLivre.t = null; clearInterval(t); return; } if(!$("v-app").hidden && ppLivre()){ clearInterval(t); ppQuandoLivre.t = null; ppRoda(); } }, 600); }
/* iPhone: abriu pelo ícone e entrou → continua de onde parou */
{ const abrirPP = abrirApp; abrirApp = function(){ const r = abrirPP.apply(this, arguments);
  try{ if(ME && ME.passos && !ME.passos.fim && ME.boasVindas !== "mostrar" && !(typeof modoAdmin === "function" && modoAdmin())) setTimeout(ppQuandoLivre, 900); }catch(e){}
  return r; }; }

/* ao abrir o app: quem já permitiu avisos neste celular fica registrada (vale para todas, novas e antigas) */
{ let ppGarantiu = false; const abrirAv = abrirApp; abrirApp = function(){ const r = abrirAv.apply(this, arguments);
  try{ if(!ppGarantiu && !(typeof modoAdmin === "function" && modoAdmin()) && PUSH_OK() && Notification.permission === "granted"){ ppGarantiu = true; setTimeout(() => ppInscreve(), 4000); } }catch(e){}
  return r; }; }

/* Início só desenha quando o plano dela já existe (durante o cadastro, a nuvem pode pedir para redesenhar antes) */
{ const rInicioSeg = rInicio; rInicio = function(){ if(!ME || !ME.perfil) return; return rInicioSeg.apply(this, arguments); }; }

/* ===================== Erros do app → painel (sem dado pessoal) ===================== */
const ERR_RUIDO = /ResizeObserver|^Script error|vibrate|Non-Error promise|AbortError|Load failed|NetworkError|Failed to fetch|NotAllowedError|The operation was aborted|cancel/i;
const ERR_VISTOS = new Set(); const ERR_FILA = [];
function errAparelho(){ return ehIOS() ? "iphone" : ppAndroid() ? "android" : /Mobi/i.test(navigator.userAgent) ? "outro" : "computador"; }
function errEnvia(){
  if(!(NU && NU.ativo && NU.sb && NU.uid)) return;
  while(ERR_FILA.length){ const e = ERR_FILA.shift(); NU.sb.rpc("registra_erro", e).then(() => {}, () => {}); }
}
function errRegistra(msg, onde){
  try{
    msg = String(msg || "").replace(/https?:\/\/\S+/g, "").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "@").trim().slice(0, 300);
    if(!msg || ERR_RUIDO.test(msg) || ERR_VISTOS.has(msg) || ERR_VISTOS.size >= 8) return;
    ERR_VISTOS.add(msg);
    ERR_FILA.push({ p_msg: msg, p_onde: String(onde || (typeof TAB !== "undefined" ? TAB : "")).slice(0, 120), p_aparelho: errAparelho(), p_modo: instalado() ? "instalado" : "navegador", p_versao: String(typeof CK_VER !== "undefined" ? CK_VER : "").slice(0, 20) });
    errEnvia();
  }catch(e){}
}
if(/^https?:/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname)){
  window.addEventListener("error", e => { if(e && e.message) errRegistra(e.message + (e.lineno ? " (linha " + e.lineno + ")" : "")); });
  window.addEventListener("unhandledrejection", e => { const r = e && e.reason; errRegistra("promessa: " + ((r && (r.message || r)) || "")); });
  setInterval(errEnvia, 15000);
}
/* só no teste local */
if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__PP = { roda: ppRoda, me: () => ME, salva: ppSalva, livre: ppLivre, ent: k => { OB = { i: 0, itens: [], intro: 9, pos: ENT_POS_NOVA.indexOf(k) }; show("v-onb"); entPos(); }, dias: () => { OB = { i: OBQ.findIndex(q => q.k === "diasSem"), itens: [], intro: 9 }; show("v-onb"); onboarding(); } };
