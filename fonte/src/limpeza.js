/* ===================== INÍCIO E COMUNIDADE MAIS LIMPOS (pedido do Tiago, 25/10) =====================
   Início: sai o cartão Desafio do dia / Missão da semana (a missão continua contando e comemorando por trás);
   "O CK Life aprendeu sobre você" vira um aviso que aparece por 5 segundos e some (ao abrir o app e depois de uma ação).
   Comunidade: sai a caixa "Treino feito? Conta como foi", a faixa Vitórias de hoje e os reconhecimentos;
   "Minha vitória" vai para a fila dos Stories; publicar continua pelo botão + no topo. */

/* ---------- Início: sem o cartão de missões ---------- */
missaoPinta = function(){
  try{ desafioHojeConfere(); const mudouSem = missaoSemanaConfere(); ["mis-ini", "ins-ini"].forEach(id => { const e = $(id); if(e) e.remove(); });
    if(mudouSem) setTimeout(() => celebrar(["sem-" + semanaKey(), "x", 0, "🎯", "MISSÃO DA SEMANA CUMPRIDA", `Você treinou ${alvoSemana()} vezes essa semana. Constância é isso.`]), 900); }catch(e){ console.warn(e); }
};

/* ---------- Insights como aviso rápido (5 segundos) ---------- */
let INS_T = 0;
function insightAviso(){
  if(!modOn("insights") || Date.now() - INS_T < 60000 || document.querySelector(".ent, .ent-bv, .coach-1o, #celebra:not([hidden])") || ($("play") && !$("play").hidden)) return;
  const { I } = insights(); if(!I.length) return;
  const pro = typeof pode === "function" && pode("graficos_avancados"), L = pro ? I : I.filter(x => !x[3]); if(!L.length) return;
  ME.insIdx = ((ME.insIdx || 0) + 1) % L.length; const [e, t, x] = L[ME.insIdx]; INS_T = Date.now();
  const v = $("ins-toast"); if(v) v.remove();
  const d = document.createElement("div"); d.id = "ins-toast"; d.className = "ins-toast"; d.setAttribute("role", "status");
  d.innerHTML = `<i>${e}</i><div><small>O CK Life aprendeu sobre você</small><b>${esc(t)}</b><p>${esc(x)}</p></div>`;
  document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("on"));
  const some = () => { d.classList.remove("on"); setTimeout(() => d.remove(), 400); };
  d.onclick = some; setTimeout(some, 5000);
}
const abrirAppL = abrirApp; abrirApp = function(){ const r = abrirAppL.apply(this, arguments); setTimeout(insightAviso, 9000); return r; };
const fimPlayL = fimPlay; fimPlay = function(){ const r = fimPlayL.apply(this, arguments); setTimeout(insightAviso, 1500); return r; };
const minhasVitoriasL = minhasVitorias; minhasVitorias = function(){ const r = minhasVitoriasL.apply(this, arguments); const ok = $("vt-ok"); if(ok) ok.addEventListener("click", () => setTimeout(insightAviso, 2500)); return r; };

/* ---------- Comunidade mais limpa ---------- */
vitoriasPinta = function(){ const v = $("vit-hoje"); if(v) v.remove(); };
reconhPinta = function(){ const v = $("rc-sem"); if(v) v.remove(); };
function comLimpa(){
  const box = $("t-juntas"); if(!box) return;
  const comp = $("cm-nova"); if(comp) comp.hidden = true;
  const at = box.querySelector(".cm-atal"); if(at) at.hidden = true;
  // cabeçalho enxuto: notificações e "postar" entram na barra Feed · Grupos · Chats · Amigas; o título sai daqui e vai discreto para o topo
  const nav = box.querySelector(".cm-nav"), head = box.querySelector(".so-head");
  if(nav && !nav.querySelector(".cm-acts")){ nav.insertAdjacentHTML("beforeend", `<span class="cm-acts"><button class="iconbtn" id="cm-pub" aria-label="Nova publicação">${ic("plus", 20, 2.4)}</button></span>`);
    $("cm-pub").onclick = () => abreComposer(); const nb = $("cm-not"); if(nb) nav.querySelector(".cm-acts").prepend(nb); }
  if(head && nav) head.hidden = true;
  const row = $("st-row"), novo = $("st-novo");
  if(row && novo && !$("st-vit")){ novo.insertAdjacentHTML("afterend", `<button class="so-st st-vit" id="st-vit"><span class="so-st-av">💪</span><small>Minha vitória</small></button>`); $("st-vit").onclick = () => { SOM.tap && SOM.tap(); criarStory(); }; }
}
new MutationObserver(() => { if(TAB === "juntas") comLimpa(); }).observe($("t-juntas"), { childList: true, subtree: true });

/* ---------- Topo: na Comunidade, só a logo + "Comunidade" discreto ---------- */
function topoNome(){ const w = document.querySelector("#v-app .wordmark"); if(!w) return; if(!w.dataset.orig) w.dataset.orig = w.innerHTML;
  const com = TAB === "juntas"; w.classList.toggle("wm-com", com); w.innerHTML = com ? `<span class="wm-sec">Comunidade</span>` : w.dataset.orig; }
const tabL = tab; tab = function(){ const r = tabL.apply(this, arguments); try{ topoNome(); }catch(e){} return r; };
