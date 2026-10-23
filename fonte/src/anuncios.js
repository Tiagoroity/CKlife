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
