/* Auditoria de overflow (só para teste local).
   SAI DA TELA: elemento visível além da borda da tela e fora de um rolador horizontal intencional.
   CORTADO: container que esconde conteúdo na horizontal (overflow hidden) sem ser reticências de texto.
   GLOBAL: a página inteira rola para o lado. */
window.AUDOV = function(rotulo){
  const W = document.documentElement.clientWidth, out = [], vistos = new Set();
  const nome = el => (el.id ? "#" + el.id : el.tagName.toLowerCase()) + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
  const add = (t, el, a, b) => { const k = t + nome(el); if(!vistos.has(k)){ vistos.add(k); out.push(`${t} ${nome(el)} ${a}→${b}`); } };
  const rolador = el => { for(let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement){ const o = getComputedStyle(p).overflowX; if(o === "auto" || o === "scroll") return "rola"; if(o === "hidden" || o === "clip") return "corta"; } return null; };
  const escondido = el => { for(let p = el; p; p = p.parentElement){ if(p.hidden) return true; const s = getComputedStyle(p); if(s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return true; if(s.position === "fixed" && s.transform !== "none" && /matrix\(1, 0, 0, 1, -?\d{3,}/.test(s.transform)) return true; } return false; };
  document.querySelectorAll("body *").forEach(el => {
    const r = el.getBoundingClientRect(); if(r.width < 1 || r.height < 1) return;
    if((r.right > W + 1 || r.left < -1) && !escondido(el)){ const k = rolador(el); if(!k) add("SAI DA TELA", el, Math.round(r.left), Math.round(r.right)); }
    const s = getComputedStyle(el);
    if((s.overflowX === "hidden" || s.overflowX === "clip") && el.scrollWidth > el.clientWidth + 2 && s.textOverflow !== "ellipsis" && !/^(IMG|VIDEO|svg|CANVAS)$/i.test(el.tagName) && !escondido(el)){
      const filho = [...el.querySelectorAll("*")].find(c => { const cr = c.getBoundingClientRect(); return cr.width > 1 && (cr.right > r.right + 2 || cr.left < r.left - 2) && getComputedStyle(c).position !== "absolute"; });
      if(filho) add("CORTADO", el, el.clientWidth, el.scrollWidth + " (" + nome(filho) + ")");
    }
  });
  return { rotulo, W, global: document.documentElement.scrollWidth > W + 1 ? document.documentElement.scrollWidth : 0, problemas: out.slice(0, 25) };
};
const esp = ms => new Promise(r => setTimeout(r, ms));
/* percorre as abas do app e algumas telas internas */
window.AUDAPP = async function(){
  const R = [], reg = a => { if(a.global || a.problemas.length) R.push(a); };
  for(const t of ["inicio", "treinar", "dieta", "juntas", "explorar", "perfil"]){ const b = document.querySelector(`#nav [data-tab="${t}"]`); if(!b || b.hidden) continue; b.click(); await esp(700); reg(AUDOV(t)); }
  // nutrição: cardápio e meu dia
  document.querySelector('#nav [data-tab="dieta"]').click(); await esp(500);
  for(const n of ["Cardápio", "Meu dia"]){ const b = [...document.querySelectorAll("#t-dieta button")].find(x => x.textContent.trim() === n); if(b){ b.click(); await esp(500); reg(AUDOV("dieta/" + n)); } }
  // comunidade: perfil social, conversas, notificações
  document.querySelector('#nav [data-tab="juntas"]').click(); await esp(600);
  for(const id of ["cm-eu", "cm-chat", "cm-not", "cm-nova"]){ const b = document.getElementById(id); if(b){ b.click(); await esp(900); reg(AUDOV("juntas/" + id)); const c = document.getElementById("sheet-close"); if(c && !document.getElementById("sheet").hidden) c.click(); await esp(400); } }
  // calendário e evolução
  document.querySelector('#nav [data-tab="inicio"]').click(); await esp(600);
  const d = document.querySelector("[data-cal]"); if(d){ d.click(); await esp(600); reg(AUDOV("inicio/calendario")); document.getElementById("sheet-close").click(); await esp(400); }
  return R;
};
window.AUDADM = async function(){
  const R = [];
  const secs = [...document.querySelectorAll("#adm-tabs [data-s]")].map(b => b.dataset.s);
  for(const s of secs){ const b = document.querySelector(`#adm-tabs [data-s="${s}"]`); b.click(); await esp(600); const a = AUDOV(s); if(a.global || a.problemas.length) R.push(a); }
  // menu (gaveta) aberto no celular
  const mb = document.getElementById("adm-mb"); if(mb && getComputedStyle(mb).display !== "none"){ mb.click(); await esp(400); const a = AUDOV("gaveta"); if(a.global || a.problemas.length) R.push(a); mb.click(); await esp(300); }
  return R;
};
