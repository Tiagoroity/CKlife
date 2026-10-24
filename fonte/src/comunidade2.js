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
    <button data-cn="msgs">${ic("chat", 17)}<span>Mensagens</span><i class="cm-nb" id="cm-nav-msg" hidden></i></button>
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
