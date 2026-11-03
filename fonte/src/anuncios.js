/* ===================== ANÚNCIOS INTEGRADOS (imagem 1080x1080, vídeo até 30 s ou texto) =====================
   Regras que continuam valendo: só para quem usa o plano grátis a partir do 31º dia (ENT.d.anuncios), nunca no treino,
   no chat ou em telas de segurança; no máximo 1 anúncio por tela. Vídeo começa mudo, só toca visível e carrega sob demanda. */
const AD_LOCAIS_PADRAO = ["feed", "explorar"];
function adCard(c, an, local, previa){
  const fmt = c.formato === "video" && c.midia ? "video" : c.formato === "imagem" && c.midia ? "imagem" : "texto";
  const prop = fmt === "video" && c.prop ? Math.max(.5, Math.min(2, +c.prop)) : 1, href = esc(linkCamp(c));
  const midia = fmt === "imagem" ? `<div class="adx-m" style="aspect-ratio:1/1"><img src="${esc(c.midia)}" alt="${esc(c.titulo || an.nome)}" width="1080" height="1080" loading="lazy" decoding="async"></div>`
    : fmt === "video" ? `<div class="adx-m" style="aspect-ratio:${prop}"><video muted playsinline preload="none" ${c.capa ? `poster="${esc(c.capa)}"` : ""} data-src="${esc(c.midia)}" aria-label="Vídeo do anúncio"></video><button class="adx-som" type="button" aria-label="Ativar som">${ic("mute", 16)}</button><button class="adx-play" type="button" aria-label="Reproduzir">${ic("play", 26)}</button><i class="adx-prog"></i></div>` : "";
  return `<article class="ad-card adx adx-${fmt}" ${previa ? "" : `data-ad="${c.id}" data-local="${local}"`}>
    <header class="adx-h"><span class="adx-logo">${esc((an.nome || "?").trim()[0] || "?")}</span><span><b>${esc(an.nome || "Anunciante")}</b><small>Patrocinado</small></span></header>
    ${midia}
    ${c.titulo || c.texto ? `<div class="adx-tx">${c.titulo ? `<b>${esc(c.titulo)}</b>` : ""}${c.texto ? `<p>${esc(c.texto)}</p>` : ""}</div>` : ""}
    <a class="adx-cta" href="${href}" target="_blank" rel="noopener sponsored">${esc(c.botao || "Saiba mais")}<span>${ic("back", 15, 2.4)}</span></a>
  </article>`;
}
window.CKAD = { card: (c, an) => adCard(c, an, "previa", true) };
anuncioHtml = function(local){
  if(!ENT.d || !ENT.d.anuncios) return "";
  const L = campanhasPara(ME).filter(c => (c.locais && c.locais.length ? c.locais : AD_LOCAIS_PADRAO).includes(local)); if(!L.length) return "";
  const c = L[(anuncioHtml.n = (anuncioHtml.n || 0) + 1) % L.length], an = DB.anunciantes.find(a => a.id === c.anunc); if(!an) return "";
  return adCard(c, an, local);
};
/* Início: um card discreto, depois do conteúdo principal (só se a campanha escolheu "Início") */
anunciosInicio = function(){ const box = $("t-inicio"); if(!box || box.querySelector(".adx")) return; const h = anuncioHtml("inicio"); if(!h) return;
  const cards = box.querySelectorAll(":scope > .card, :scope .xe-dia ~ .card"); const alvo = cards[Math.min(3, cards.length - 1)]; if(alvo) alvo.insertAdjacentHTML("afterend", h); };

/* vídeo: só carrega/toca quando aparece na tela; mudo por padrão; pausa ao sair */
const adSaveData = () => !!(navigator.connection && navigator.connection.saveData) || matchMedia("(prefers-reduced-motion: reduce)").matches;
const adIO = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { const v = e.target;
  if(e.isIntersecting && e.intersectionRatio >= .6){ if(!v.src && v.dataset.src){ v.src = v.dataset.src; } if(!adSaveData() || v.dataset.quer) v.play().catch(() => {}); }
  else if(!v.paused) v.pause(); }), { threshold: [0, .6] }) : null;
function ligaAdVideo(card){
  const v = card.querySelector("video"); if(!v || v.dataset.lig) return; v.dataset.lig = 1;
  const som = card.querySelector(".adx-som"), play = card.querySelector(".adx-play"), prog = card.querySelector(".adx-prog");
  if(adIO) adIO.observe(v); else { v.src = v.dataset.src; }
  v.addEventListener("play", () => card.classList.add("tocando")); v.addEventListener("pause", () => card.classList.remove("tocando"));
  v.addEventListener("timeupdate", () => { if(v.currentTime > 30.5){ v.pause(); v.currentTime = 0; } if(prog && v.duration) prog.style.width = (100 * v.currentTime / Math.min(30, v.duration)) + "%"; });
  v.addEventListener("ended", () => { v.currentTime = 0; card.classList.remove("tocando"); });
  const toca = e => { e.stopPropagation(); e.preventDefault(); v.dataset.quer = 1; if(!v.src) v.src = v.dataset.src; v.paused ? v.play().catch(() => {}) : v.pause(); };
  if(play) play.onclick = toca; v.onclick = toca;
  if(som) som.onclick = e => { e.stopPropagation(); e.preventDefault(); v.muted = !v.muted; if(!v.muted){ v.volume = .6; if(v.paused) v.play().catch(() => {}); } som.innerHTML = ic(v.muted ? "mute" : "speaker", 16); som.setAttribute("aria-label", v.muted ? "Ativar som" : "Tirar som"); };
}
new MutationObserver(() => document.querySelectorAll(".adx-video:not([data-v])").forEach(c => { c.dataset.v = 1; ligaAdVideo(c); })).observe(document.body, { childList: true, subtree: true });
/* saiu da aba/tela: nenhum vídeo continua tocando */
document.addEventListener("visibilitychange", () => { if(document.hidden) document.querySelectorAll(".adx video").forEach(v => v.pause()); });

/* ===================== ANÚNCIO EM TELA CHEIA (premium) =====================
   Só para quem é gratuita e já passou dos dias sem anúncio (ENT.d.anuncios, decidido no servidor).
   Abre a cada X toques ou Y minutos (o painel controla em Campanhas › frequência), nunca no treino, no chat,
   com outra janela aberta ou durante a entrada. O botão de fechar aparece depois de 5 segundos. */
const adLivre = () => !document.querySelector("#play:not([hidden]), #cook:not([hidden]), #pp, .ent, .ent-bv, .coach-1o, #ck-inst, #d21, .modal:not([hidden])")
  && $("sheet").hidden && !$("v-app").hidden && !(typeof TAB !== "undefined" && TAB === "juntas" && document.querySelector(".so-chat, .chat-box, #chat"));
mostrarAnuncio = function(c){
  const an = DB.anunciantes.find(a => a.id === c.anunc); if(!an) return;
  DB.eventos.push({ t: "imp", c: c.id, u: ME.id, d: today() }); save();
  const fmt = c.formato === "video" && c.midia ? "video" : c.formato === "imagem" && c.midia ? "imagem" : "texto";
  const midia = fmt === "imagem" ? `<img class="adt-m" src="${esc(c.midia)}" alt="${esc(c.titulo || an.nome)}">`
    : fmt === "video" ? `<video class="adt-m" src="${esc(c.midia)}" ${c.capa ? `poster="${esc(c.capa)}"` : ""} autoplay muted playsinline loop></video>` : `<div class="adt-m adt-txt"><b>${esc(c.titulo || an.nome)}</b></div>`;
  const box = $("ad");
  box.className = "ad adt"; box.innerHTML = `<div class="adt-in" role="dialog" aria-modal="true" aria-label="Anúncio">
    <div class="adt-top"><span class="adt-logo">${esc((an.nome || "?").trim()[0] || "?")}</span><span class="adt-who"><b>${esc(an.nome || "Anunciante")}</b><small>Patrocinado</small></span>
      <button class="adt-x" id="ad-x" aria-label="Fechar anúncio" disabled><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" class="adt-r0"/><circle cx="18" cy="18" r="16" class="adt-r1"/></svg><span id="ad-n">5</span></button></div>
    <div class="adt-midia">${midia}</div>
    ${c.titulo || c.texto ? `<div class="adt-tx">${c.titulo && fmt !== "texto" ? `<h2>${esc(c.titulo)}</h2>` : ""}${c.texto ? `<p>${esc(c.texto)}</p>` : ""}</div>` : ""}
    <a class="btn adt-cta" id="ad-go" href="${esc(linkCamp(c))}" target="_blank" rel="noopener sponsored">${esc(c.botao || "Saiba mais")}</a>
    <button class="adt-pro" id="ad-pro">Assine o Pro e treine sem anúncios</button></div>`;
  box.hidden = false; document.body.classList.add("adt-on");
  const fecha = () => { box.hidden = true; box.innerHTML = ""; document.body.classList.remove("adt-on"); };
  let n = 5; const x = $("ad-x"), num = $("ad-n");
  const t = setInterval(() => { n--; if(num) num.textContent = n > 0 ? n : "✕"; if(n <= 0){ clearInterval(t); if(x){ x.disabled = false; x.classList.add("ok"); } } }, 1000);
  x.onclick = () => { if(!x.disabled){ clearInterval(t); fecha(); } };
  $("ad-go").onclick = () => { DB.eventos.push({ t: "clk", c: c.id, u: ME.id, d: today() }); save(); clearInterval(t); setTimeout(fecha, 300); };
  $("ad-pro").onclick = () => { clearInterval(t); fecha(); try{ paywall("anuncio"); }catch(e){} };
};
let adIni = false;   // na primeira vez: o primeiro anúncio pode vir assim que ela atingir os toques (não espera minutos depois de abrir o app)
/* conta os toques no app e confere a frequência */
document.addEventListener("click", e => {
  try{
    if(!ENT.d || !ENT.d.anuncios || !ME || !ME.perfil) return;
    if(!e.target.closest || !e.target.closest("#v-app button, #v-app a, #v-app [role=button], #v-app .chip, #nav button")) return;
    if(e.target.closest("#ad")) return;
    if(!adIni){ adIni = true; AD.ultimo = 0; }
    AD.cliques++;
    setTimeout(() => { if(adLivre()) tentarAnuncio(); }, 700);
  }catch(er){}
}, true);
setInterval(() => { try{ if(ENT.d && ENT.d.anuncios && ME && ME.perfil && document.visibilityState === "visible" && adLivre()) tentarAnuncio(); }catch(e){} }, 60000);

/* ===================== PROTEÇÃO CONTRA TOQUES REPETIDOS =====================
   Tocar 10 vezes rápido no mesmo botão abria telas repetidas e causava erros.
   O mesmo botão só aceita um toque a cada 0,4 s (no treino fica livre, para contar repetições). */
{ const ULT = new WeakMap();
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("button, a.btn, [role=button], .chip, .opt");
    if(!b || b.closest("#play") || b.hasAttribute("data-rapido")) return;
    const agora = Date.now(), u = ULT.get(b) || 0;
    if(agora - u < 400){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    ULT.set(b, agora);
  }, true); }
