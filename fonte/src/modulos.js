/* ===================== MÓDULOS DO APP (o painel liga/desliga) =====================
   Desligado: some do app da aluna (Explorar, cupons, agendamentos). Ligado de novo: aparece com selo "Novo" por 14 dias
   e um card de novidade no Início (uma vez por módulo). Configuração em DB.modulos (coleção "modulos", lida por todas). */
function aplicaModulos(){
  const b = $("nav") && $("nav").querySelector('[data-tab="explorar"]'); if(b) b.hidden = !explorarOn();
  if(TAB === "explorar" && !explorarOn()) tab("inicio", true);
}
const tabMod = tab; tab = function(t){ if(t === "explorar" && !explorarOn()) t = "inicio"; return tabMod.apply(this, [t, ...[].slice.call(arguments, 1)]); };
/* remove os cartões de cupons quando o módulo está desligado */
const tiraCupons = root => { if(modOn("cupons") || !root) return; root.querySelectorAll(".card").forEach(c => { const h = c.querySelector("h3"); if(h && /cupons/i.test(h.textContent)) c.remove(); }); };
const rInicioMod = rInicio; rInicio = function(){ rInicioMod.apply(this, arguments); aplicaModulos(); tiraCupons($("t-inicio")); novidadeModulo(); };
const rPerfilMod = rPerfil; rPerfil = function(){ rPerfilMod.apply(this, arguments); tiraCupons($("t-perfil")); const ag = $("px-ag"); if(ag && !modOn("servicos")) ag.remove(); };
if(typeof rEvolucao === "function"){ const rEvoMod = rEvolucao; rEvolucao = function(){ rEvoMod.apply(this, arguments); tiraCupons($("t-evolucao")); }; }
/* card de novidade: módulo ligado há pouco (uma vez por módulo, a aluna pode fechar) */
const MOD_SEC = { perto: "academias", online: "profissionais:online", servicos: "servicos", clube: "clube", loja: "loja" };
function novidadeModulo(){
  const box = $("t-inicio"); if(!box || box.querySelector(".mod-novo")) return;
  ME.modVisto = ME.modVisto || {};
  const k = Object.keys(MOD_SEC).find(x => modNovo(x) && ME.modVisto[x] !== ((DB.modulos || {})[x] || {}).desde); if(!k) return;
  const alvo = box.querySelector(".capa") || box.querySelector(".card"); if(!alvo) return;
  alvo.insertAdjacentHTML("afterend", `<div class="mod-novo"><span class="mod-ic">${ic("explorar", 22, 2)}</span><span class="mod-tx"><i class="xp-novo">Novo</i><b>${esc(MOD_INFO[k])} chegou no CK Life</b><small>Toque para conhecer</small></span><button class="iconbtn sm" aria-label="Fechar" data-x>${ic("close", 14)}</button></div>`);
  const el = box.querySelector(".mod-novo"), visto = () => { ME.modVisto[k] = ((DB.modulos || {})[k] || {}).desde; save(); };
  el.onclick = e => { visto(); if(e.target.closest("[data-x]")){ el.remove(); return; } const [sec, modo] = MOD_SEC[k].split(":"); XS.sec = sec; XS.modo = modo || ""; XS.q = ""; tab("explorar"); };
}
setTimeout(aplicaModulos, 300); setInterval(aplicaModulos, 30000);
