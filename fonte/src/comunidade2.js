/* ===================== COMUNIDADE 2.0 =====================
   Menu próprio (Feed · Grupos · Mensagens · Amigas) com contador de não lidas,
   Pergunta do dia (puxa conversa todo dia; contagem real de respostas) e atalhos para postar.
   Nada de ranking de corpo, nada de número inventado. */

const PERG_DIA = [
  ["💪", "Qual treino você fez hoje? Conta pra gente!"],
  ["🎧", "Qual música não pode faltar no seu treino?"],
  ["🥗", "Qual foi sua receita favorita desta semana?"],
  ["💚", "O que te motivou a começar a se cuidar?"],
  ["☀️", "Você prefere treinar de manhã, à tarde ou à noite?"],
  ["🏆", "Conta uma pequena vitória sua desta semana."],
  ["😅", "Qual exercício você mais ama (ou mais odeia)?"],
  ["🌙", "Como você se cuida nos dias de pouca energia?"],
  ["🍌", "Qual seu lanche preferido antes do treino?"],
  ["🌱", "Deixe um recado para quem está começando hoje."],
  ["💧", "Qual seu truque para beber mais água?"],
  ["🎯", "Qual meta você quer bater este mês?"],
  ["💇‍♀️", "Qual seu penteado favorito para treinar?"],
  ["🏠", "Treino em casa: qual seu cantinho preferido?"],
  ["😴", "Quantas horas você tem dormido? Alguma dica de sono?"],
  ["👟", "Qual roupa ou tênis te deixa com vontade de treinar?"],
  ["🧘‍♀️", "O que você faz para relaxar depois de um dia puxado?"],
  ["📅", "Como você organiza sua semana para não faltar treino?"],
  ["🍳", "Qual café da manhã te dá energia?"],
  ["✨", "Uma frase que te motiva. Compartilha com a gente!"],
  ["🤝", "Marque (ou conte sobre) a amiga que treina com você."],
  ["📸", "Mostre seu pós-treino de hoje!"]
];
const pergHoje = () => doDia(PERG_DIA);
const ATALHOS_POST = [["💪", "Treino", "💪 Treino de hoje: "], ["🥗", "Receita", "🥗 Receita que eu amo: "], ["🏆", "Conquista", "🏆 Conquista: "], ["💬", "Pergunta", "💬 Pergunta pra vocês: "]];

/* ---------- menu da Comunidade ---------- */
function comNav(){
  const box = $("t-juntas"); if(!box || box.querySelector(".cm-nav") || !SO.on()) return;
  const head = box.querySelector(".so-head"); if(!head) return;
  head.insertAdjacentHTML("afterend", `<nav class="cm-nav" aria-label="Comunidade">
    <button class="on" data-cn="feed">${ic("home", 17)}<span>Feed</span></button>
    <button data-cn="grupos">${ic("people", 17)}<span>Grupos</span></button>
    <button data-cn="msgs">${ic("chat", 17)}<span>Chats</span><i class="cm-nb" id="cm-nav-msg" hidden></i></button>
    <button data-cn="amigas">${ic("search", 17)}<span>Amigas</span></button></nav>`);
  box.querySelectorAll("[data-cn]").forEach(b => b.onclick = () => { SOM.tap && SOM.tap(); const k = b.dataset.cn;
    if(k === "feed") return window.scrollTo({ top: 0, behavior: "smooth" });
    if(k === "grupos") return typeof todosGrupos === "function" ? todosGrupos() : toast("Grupos chegando em breve 💚");
    if(k === "msgs") return listaConversas();
    if(k === "amigas") return encontrarMulheres(); });
  comBadge();
}
function comBadge(){ const n = Object.values(typeof NAOLIDAS === "object" && NAOLIDAS ? NAOLIDAS : {}).reduce((a, b) => a + (+b || 0), 0), e = $("cm-nav-msg"); if(e){ e.hidden = !n; e.textContent = n > 9 ? "9+" : n; } }
const atualizaBadgesC2 = atualizaBadges; atualizaBadges = async function(){ const r = await atualizaBadgesC2.apply(this, arguments); comBadge(); return r; };

/* ---------- Pergunta do dia + atalhos para postar ---------- */
function comPergunta(){
  const box = $("t-juntas"), comp = $("cm-nova"); if(!box || !comp || box.querySelector(".cm-atal")) return;
  comp.insertAdjacentHTML("afterend", `<div class="cm-atal hscroll">${ATALHOS_POST.map(([e, n], i) => `<button data-at="${i}"><i>${e}</i>${n}</button>`).join("")}</div>`);
  box.querySelectorAll("[data-at]").forEach(b => b.onclick = () => abreComposer(ATALHOS_POST[+b.dataset.at][2]));
  if(ME.pdiaOk === today()) return;
  const [em, pq] = pergHoje();
  box.querySelector(".cm-atal").insertAdjacentHTML("afterend", `<div class="cm-pdia"><span class="cm-pdia-em">${em}</span><div class="cm-pdia-tx"><span class="eyebrow">Pergunta do dia</span><b>${esc(pq)}</b><small id="cm-pdia-n"></small></div>
    <div class="cm-pdia-bt"><button class="btn btn-accent btn-sm" id="cm-pdia-r">Responder</button><button class="iconbtn sm" id="cm-pdia-x" aria-label="Fechar">${ic("close", 14)}</button></div></div>`);
  $("cm-pdia-r").onclick = () => abreComposer(`${em} ${pq}\n`);
  $("cm-pdia-x").onclick = () => { ME.pdiaOk = today(); save(); const c = box.querySelector(".cm-pdia"); if(c) c.remove(); };
  // contagem real de quem já respondeu hoje (só aparece a partir de 2)
  if(SO.on()) (async () => { try{ const r = await SB().from("posts").select("id", { count: "exact", head: true }).ilike("texto", `%${pq.slice(0, 40).replace(/[%_]/g, "")}%`).gte("criado", today() + "T00:00:00");
    const n = r.count || 0, el = $("cm-pdia-n"); if(el && n >= 2) el.textContent = `${int(n)} mulheres já responderam hoje`; }catch(e){} })();
}

const rJuntasC2 = rJuntas; rJuntas = function(){ const r = rJuntasC2.apply(this, arguments); try{ comNav(); comPergunta(); }catch(e){ console.warn(e); } return r; };

/* ---------- acabamento: menu grudado logo abaixo do topo, vídeo que toca sozinho, título da conversa ---------- */
function comTopo(){ const t = document.querySelector("#v-app .top"); if(t) document.documentElement.style.setProperty("--topbar-h", t.offsetHeight + "px"); }
window.addEventListener("resize", comTopo); setTimeout(comTopo, 800);
/* vídeos do feed: tocam sem som quando aparecem na tela (como no TikTok/Instagram) e pausam ao sair; o som liga pelo controle do vídeo */
const comToca = v => { if(v.dataset.vis === "1" && (v.src || v.currentSrc)){ v.muted = v.dataset.som !== "1"; v.play().catch(() => {}); } };
const comVidIO = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { const v = e.target; v.dataset.vis = e.isIntersecting && e.intersectionRatio > .6 ? "1" : "0"; if(v.dataset.vis === "1") comToca(v); else if(!v.paused) v.pause(); }), { threshold: [0, .6, 1] }) : null;
function comVideos(root){ if(!comVidIO || !root) return; root.querySelectorAll("video[data-m]:not([data-io])").forEach(v => { v.dataset.io = 1; v.addEventListener("loadeddata", () => comToca(v)); v.addEventListener("volumechange", () => { if(!v.muted) v.dataset.som = "1"; }); comVidIO.observe(v); }); }
const desenhaFeedC2 = desenhaFeed; desenhaFeed = function(){ const r = desenhaFeedC2.apply(this, arguments); comVideos($("feed")); return r; };
/* conversa: o título da tela vira o nome dela (o cabeçalho com foto continua) */
const abreConversaC2 = abreConversa; abreConversa = async function(c){ const pr = abreConversaC2.apply(this, arguments);
  let n = 0; const t = setInterval(() => { try{ const tt = $("sheet-title"); if(tt && $("cv-m") && c){ clearInterval(t); const o = outroDe(c); tt.textContent = nomeP(o, c.a === NU.uid ? c.nome_b : c.nome_a).split(" ")[0]; } else if(++n > 30) clearInterval(t); }catch(e){ clearInterval(t); } }, 150);
  return pr; };

/* ---------- VÍDEOS EM TELA CHEIA (deslizar para cima, como no TikTok/Reels) ---------- */
let RL_SOM = false, RL_IO = null;
function fechaVideos(){ const o = $("rl"); if(o){ o.querySelectorAll("video").forEach(v => { v.pause(); v.removeAttribute("src"); v.load(); }); o.remove(); } if(RL_IO){ RL_IO.disconnect(); RL_IO = null; } document.body.style.overflow = ""; }
async function abrirVideos(inicioId){
  if(!SO.on()) return FORA();
  fechaVideos(); SOM.tap && SOM.tap();
  document.body.insertAdjacentHTML("beforeend", `<div class="rl" id="rl" role="dialog" aria-label="Vídeos da comunidade"><div class="rl-top"><button class="iconbtn rl-b" id="rl-x" aria-label="Voltar">${ic("back", 20)}</button><b>Vídeos</b><button class="iconbtn rl-b" id="rl-som" aria-label="Ligar o som">${ic(RL_SOM ? "speaker" : "mute", 19)}</button></div><div class="rl-lista" id="rl-l"><div class="rl-vazio"><i class="so-spin"></i></div></div></div>`);
  document.body.style.overflow = "hidden";
  $("rl-x").onclick = fechaVideos;
  $("rl-som").onclick = () => { RL_SOM = !RL_SOM; $("rl-som").innerHTML = ic(RL_SOM ? "speaker" : "mute", 19); document.querySelectorAll("#rl video").forEach(v => v.muted = !RL_SOM); SOM.tap && SOM.tap(); };
  let L = [];
  try{ const rows = await q(SB().from("posts").select("*").order("criado", { ascending: false }).limit(120)); L = (await completaPosts(rows.filter(p => eVideo(p.midia)))).filter(p => p.midia && eVideo(p.midia) && !p.oculto); }catch(e){ console.warn(e); }
  const lista = $("rl-l"); if(!lista) return;
  if(!L.length){ lista.innerHTML = `<div class="rl-vazio"><b>Ainda não tem vídeos por aqui 🎬</b><p>Grave seu treino e seja a primeira a postar!</p><button class="btn btn-accent" id="rl-post">${ic("camera", 18)} Postar um vídeo</button></div>`; $("rl-post").onclick = () => { fechaVideos(); abreComposer(); }; return; }
  if(inicioId){ const i = L.findIndex(p => p.id === inicioId); if(i > 0) L = L.slice(i).concat(L.slice(0, i)); }
  lista.innerHTML = L.map(p => { const liked = (p.curtidas || []).includes(ME.id), nl = (p.curtidas || []).length, nc = (p.coments || []).length;
    return `<section class="rl-s" data-id="${p.id}"><video class="priv" data-m="${esc(p.midia)}" playsinline loop muted preload="metadata" disablepictureinpicture></video><i class="rl-play">${ic("play", 54)}</i><i class="rl-heart">${ic("heart", 90)}</i>
      <div class="rl-acts"><button data-rl="perfil" aria-label="Ver perfil">${avU(p.user, p.nome, p.foto)}</button><button data-rl="like" class="${liked ? "on" : ""}" aria-label="Curtir">${ic("heart", 30)}<span>${nl || ""}</span></button><button data-rl="com" aria-label="Comentários">${ic("chat", 28)}<span>${nc || ""}</span></button><button data-rl="share" aria-label="Compartilhar">${ic("send", 26)}</button></div>
      <div class="rl-info"><b>${esc(nomeP(p.user, p.nome))}</b>${userP(p.user) ? `<small>@${esc(userP(p.user))} · ${tempoAtras(p.criado)}</small>` : ""}${p.texto ? `<p>${rico(p.texto)}</p>` : ""}</div></section>`; }).join("");
  ligaMidia(lista, 900);
  RL_IO = new IntersectionObserver(es => es.forEach(e => { const v = e.target.querySelector("video"); if(!v) return; if(e.isIntersecting && e.intersectionRatio > .7){ v.muted = !RL_SOM; const toca = () => v.play().catch(() => {}); if(v.src) toca(); else v.addEventListener("loadeddata", toca, { once: true }); } else { v.pause(); } }), { root: lista, threshold: [0, .7, 1] });
  lista.querySelectorAll(".rl-s").forEach(s => {
    RL_IO.observe(s); const p = L.find(x => x.id === s.dataset.id), v = s.querySelector("video");
    const like = async forcar => { const ja = (p.curtidas || []).includes(ME.id); if(forcar && ja) return; const on = !ja; p.curtidas = (p.curtidas || []).filter(u => u !== ME.id); if(on) p.curtidas.push(ME.id);
      const b = s.querySelector('[data-rl="like"]'); b.classList.toggle("on", on); b.querySelector("span").textContent = p.curtidas.length || ""; if(on){ SOM.fav ? SOM.fav() : SOM.tap(); vibra(12); }
      try{ await CM.curtir(p, on); }catch(e){ toast(ERR_MSG(e)); } };
    let t = 0, tm = null;
    v.addEventListener("click", () => { const n = Date.now();
      if(n - t < 300){ clearTimeout(tm); t = 0; like(true); s.classList.remove("bate"); void s.offsetWidth; s.classList.add("bate"); return; }
      t = n; tm = setTimeout(() => { if(v.paused){ v.play().catch(() => {}); s.classList.remove("pausado"); } else { v.pause(); s.classList.add("pausado"); } }, 300); });
    s.querySelector('[data-rl="like"]').onclick = () => like(false);
    s.querySelector('[data-rl="com"]').onclick = () => abrePost(p, true);
    s.querySelector('[data-rl="share"]').onclick = () => compartilharPost(p);
    s.querySelector('[data-rl="perfil"]').onclick = () => abrirPerfil(p.user);
  });
}
/* entrada: item "Vídeos" no menu e botão de tela cheia nos vídeos do feed */
const comNavRl = comNav; comNav = function(){ comNavRl.apply(this, arguments); const nav = document.querySelector("#t-juntas .cm-nav"); if(!nav || nav.querySelector('[data-cn="videos"]')) return;
  const g = nav.querySelector('[data-cn="grupos"]'); g.insertAdjacentHTML("beforebegin", `<button data-cn="videos">${ic("play", 17)}<span>Vídeos</span></button>`);
  nav.querySelector('[data-cn="videos"]').onclick = () => abrirVideos(); nav.classList.add("cinco"); };
const desenhaFeedRl = desenhaFeed; desenhaFeed = function(){ const r = desenhaFeedRl.apply(this, arguments);
  document.querySelectorAll("#feed .pvid:not([data-rlb])").forEach(d => { d.dataset.rlb = 1; const post = d.closest(".post"); d.insertAdjacentHTML("beforeend", `<button class="rl-abre" aria-label="Ver em tela cheia">${ic("play", 14)} Tela cheia</button>`); d.querySelector(".rl-abre").onclick = e => { e.stopPropagation(); abrirVideos(post && post.dataset.id); }; });
  return r; };
document.addEventListener("keydown", e => { if(e.key === "Escape" && $("rl") && $("sheet").hidden) fechaVideos(); });

/* ---------- GRUPOS: capa colorida, regras e campo para escrever no grupo ---------- */
const abrirGrupoC2 = abrirGrupo; abrirGrupo = async function(g){
  const r = await abrirGrupoC2.apply(this, arguments);
  try{ const top = document.querySelector("#sheet-body .so-gr-top"); if(!top || top.dataset.c2) return r; top.dataset.c2 = 1; top.classList.add("gr2");
    top.insertAdjacentHTML("afterend", `<div class="gr-regras">${ic("heart", 15)} Aqui a gente se apoia: elogie, incentive e respeite. Sem comparação de corpos.</div>${g.eu ? `<button class="composer gr-comp" id="gr-comp">${avU(ME.id, ME.nome, ME.foto)}<span>Escreva para o grupo…</span><i>${ic("camera", 20)}</i></button>` : ""}`);
    const c = $("gr-comp"); if(c) c.onclick = () => abreComposer("", null, { grupo: g });
  }catch(e){ console.warn(e); }
  return r;
};

/* ---------- FOTO e VÍDEO no chat (melhor qualidade possível) ---------- */
fotoChat = function(c){
  menuLeve([["camera", "Tirar foto agora", () => pegaFotoChat(c, "environment")], ["image", "Escolher foto da galeria", () => pegaFotoChat(c, null)],
    ["play", "Gravar vídeo (até 1 min)", () => pegaVideoChat(c, "environment")], ["play", "Escolher vídeo da galeria", () => pegaVideoChat(c, null)]]);
};
function prevChat(c, midiaHtml, envia, limpa){
  let box = $("so-prev"); if(!box){ box = document.createElement("div"); box.id = "so-prev"; box.className = "so-prev priv"; document.body.appendChild(box); }
  box.innerHTML = `<div class="so-prev-top"><button class="iconbtn" id="pv-x" aria-label="Cancelar">${ic("close", 20)}</button><b>Enviar para ${esc(nomeP(outroDe(c)).split(" ")[0])}</b></div>${midiaHtml}<div class="so-prev-pe"><input class="input" id="pv-t" maxlength="500" placeholder="Escreva uma legenda (opcional)"><button class="btn btn-accent so-env" id="pv-ok" aria-label="Enviar">${ic("send", 20)}</button></div>`;
  box.hidden = false; const fecha = () => { box.querySelectorAll("video").forEach(v => v.pause()); box.hidden = true; box.innerHTML = ""; limpa && limpa(); };
  $("pv-x").onclick = fecha;
  $("pv-ok").onclick = () => { const t = $("pv-t").value.trim(); fecha(); envia(t || null); };
  $("pv-t").onkeydown = e => { if(e.key === "Enter") $("pv-ok").click(); };
}
async function pegaFotoChat(c, cap){
  const f = await escolheArquivo("image/*", cap); if(!f) return; let b = await imagemValida(f, 2048); if(!b) return; b = await escolheFiltro(b); if(!b) return;
  const u = URL.createObjectURL(b);
  prevChat(c, `<img src="${u}" alt="" draggable="false">`, t => enviaMsg(c, { tipo: "foto", blob: b, texto: t }).catch(() => {}), () => URL.revokeObjectURL(u));
}
async function pegaVideoChat(c, cap){
  const f = await escolheArquivo("video/*", cap); if(!f) return;
  const v = await videoValido(f, 60); if(!v) return; // até 1 minuto e 50 MB; vai do jeito que o celular entregou (sem reduzir)
  const dur = await new Promise(ok => { const el = document.createElement("video"), u = URL.createObjectURL(v); el.preload = "metadata"; el.onloadedmetadata = () => { URL.revokeObjectURL(u); ok(Math.round(el.duration || 0)); }; el.onerror = () => { URL.revokeObjectURL(u); ok(null); }; el.src = u; });
  const u = URL.createObjectURL(v);
  prevChat(c, `<video src="${u}" playsinline controls autoplay muted loop style="max-width:100%;max-height:70vh;border-radius:16px;background:#000"></video>`,
    t => enviaMsg(c, { tipo: "video", blob: v, mime: v.type || "video/mp4", texto: t, duracao: dur != null ? Math.min(300, dur) : null }).catch(() => {}), () => URL.revokeObjectURL(u));
}
