(function(){
"use strict";
/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const addD = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const brD = s => s ? String(s).slice(0,10).split("-").reverse().join("/") : "";
const int = v => Math.round(Number(v) || 0).toLocaleString("pt-BR");
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const idade = nasc => { if(!nasc) return null; const n = new Date(nasc + "T12:00:00"), h = new Date(); let a = h.getFullYear() - n.getFullYear(); if(h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--; return a; };
const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
const norm = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const DIAS_CURTO = ["D","S","T","Q","Q","S","S"];
let toastT;
function toast(m){ const t = $("toast"); t.innerHTML = `<span class="tk">✓</span><span></span>`; t.lastChild.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }
function copyText(txt, ok){
  const done = () => toast(ok || "Copiado");
  const fb = () => { const a = document.createElement("textarea"); a.value = txt; a.setAttribute("readonly",""); a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); done(); }catch(e){ toast("Não deu para copiar"); } a.remove(); };
  try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(fb); else fb(); }catch(e){ fb(); }
}
async function hash(s){
  try{ const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cklife:" + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  catch(e){ let h = 5381; for(const ch of "cklife:" + s) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return "f" + (h >>> 0).toString(16); }
}
const vibra = ms => { try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} };
let WL = null;
async function telaAcesa(on){ try{ if(on && navigator.wakeLock && !WL){ WL = await navigator.wakeLock.request("screen"); WL.addEventListener("release", () => WL = null); } else if(!on && WL){ await WL.release(); WL = null; } }catch(e){ WL = null; } }

/* ---------- Ícones ---------- */
const P = {
  inicio:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  treinar:'<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  dieta:'<path d="M12 7.5c-1-2-4-3-6-1-3 3-1 10 2 12 1.5 1 2.5 0 4 0s2.5 1 4 0c3-2 5-9 2-12-2-2-5-1-6 1z"/><path d="M12 7.5c0-2 1-4.5 3.5-4.5"/>',
  evolucao:'<path d="M4 20h16"/><path d="M6 15l4-4 3 3 5-6"/><path d="M15 8h3v3"/>',
  perfil:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  play:'<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
  pause:'<path d="M8 5v14M16 5v14" stroke-width="3"/>',
  prev:'<path d="M18 6l-8 6 8 6zM6 6v12"/>', next:'<path d="M6 6l8 6-8 6zM18 6v12"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>', back:'<path d="M15 5l-7 7 7 7"/>', chev:'<path d="M9 5l7 7-7 7"/>', share:'<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', juntas:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.2 2.6 3.5 5.5"/>', heart:'<path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2.1 0 3.6 1.1 5 3 1.4-1.9 2.9-3 5-3 3.4 0 5.5 3.3 4.3 6.6C19.5 15.9 12 20.5 12 20.5z"/>', chat:'<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.2A8.5 8.5 0 1 1 21 12z"/>', camera:'<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>', send:'<path d="M4 12l16-8-6 16-2.5-6.5z"/>', check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  chair:'<path d="M7 3v10h10V3M5 13h14M7 13v8M17 13v8"/>', mesa:'<path d="M3 8h18M5 8v12M19 8v12M3 8l2-3h14l2 3"/>', barra:'<path d="M3 5h18M7 5v4M17 5v4"/><circle cx="12" cy="14" r="2.5"/><path d="M12 16.5V21"/>', corda:'<path d="M5 4v6M19 4v6"/><path d="M5 10c0 8 14 8 14 0"/>',
  flame:'<path d="M12 2s5 4.6 5 10a5 5 0 0 1-10 0c0-2.2 1-3.9 2-5 0 1.6.8 3 2 3 0-3 1-6 1-8z" fill="currentColor" stroke="none"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  leaf:'<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l8-8"/>',
  speaker:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
  chef:'<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M8 7c0-1 1-1 1-2.5M12 7c0-1 1-1 1-2.5M16 7c0-1 1-1 1-2.5"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/>',
  drop:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
  scale:'<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 10a4 4 0 0 1 6 0l-3 2.5"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  grid:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.2 2.6 3.5 5.5"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  logout:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  repeat:'<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M20 4v5h-5M4 20v-5h5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>', lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  cup:'<path d="M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>',
  bowl:'<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M7 7c1-2 3-2 4 0M12 6c1-2 3-2 4 0"/>',
  cake:'<path d="M4 12h16v8H4z"/><path d="M4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 2.5 1 4 0M12 8v4M12 4.5v.5"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>'
};
const foto = (src, alt = "") => `<img class="ph" src="${src}" alt="${alt}" loading="lazy" onerror="this.remove()">`;
/* versão leve (pasta img/p) para listas e cartões; se a leve faltar, usa a grande */
(() => {
  const marca = img => { if(img.complete && img.naturalWidth) img.classList.add("ok"); };
  document.addEventListener("load", e => { if(e.target && e.target.tagName === "IMG") e.target.classList.add("ok"); }, true);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if(n.nodeType !== 1) return; if(n.tagName === "IMG") marca(n); else n.querySelectorAll && n.querySelectorAll("img").forEach(marca); }))).observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll("img").forEach(marca);
})();
const fotoP = (src, alt = "") => `<img class="ph" src="${src.replace(/^img\//, "img/p/")}" alt="${alt}" loading="lazy" onerror="if(!this.dataset.g){this.dataset.g=1;this.src='${src}'}else this.remove()">`;
const capa = (titulo, sub, extra = "", src = "img/modelo.jpg") => `<div class="capa"><img class="capa-foto" src="${src}" alt="" onerror="this.remove()"><div class="capa-tx">${extra}${titulo ? `<h1>${titulo}</h1>` : ""}${sub ? `<p>${sub}</p>` : ""}</div></div>`;
const ic = (k, s = 22, sw = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k] || ""}</svg>`;
let LOGON = 0;
/* ===== MARCA CK LIFE (um lugar só para nome, slogan e logos oficiais) ===== */
const MARCA = {
  nome: "CK Life", slogan: "Create. Keep. Live.", sloganPt: "Crie. Mantenha. Viva.", assinatura: "Sua vida. Seu ritmo. Sua evolução.",
  conceito: [["Create", "Crie uma nova versão de você."], ["Keep", "Mantenha sua constância."], ["Live", "Viva sua evolução."]],
  logo: { completa: "img/marca/ck-logo.webp", completaClara: "img/marca/ck-logo-claro.webp", simbolo: "img/marca/ck-simbolo.webp", simboloClaro: "img/marca/ck-simbolo-claro.webp", icone: "img/icone-192.png" }
};
window.MARCA = MARCA;
const LOGO = (s = 34, claro) => `<img class="ck-simb" src="${claro ? MARCA.logo.simboloClaro : MARCA.logo.simbolo}" alt="CK Life" width="${Math.round(s * 1.24)}" height="${s}" draggable="false">`;
document.querySelectorAll(".logo-slot").forEach(e => e.innerHTML = LOGO(e.closest(".adm-brand") ? 30 : 34, !!e.closest(".lhero,.adm-brand,.splash")));

/* ---------- Voz do celular ---------- */
const VOZ = { ok: "speechSynthesis" in window, v: null, lista: [] };
const VOZ_PREF = ["luciana","francisca","fernanda","vitória","vitoria","thalita","camila","google português do brasil","maria","joana","raquel"];
function achaVoz(){
  try{
    const ROBO = /eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|bad news|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|bahh|fred|junior|kathy|ralph/i;
    const vs = speechSynthesis.getVoices().filter(v => /^pt/i.test(v.lang) && !ROBO.test(v.name)), br = vs.filter(v => /br/i.test(v.lang)), L = br.length ? br : vs;
    let nome = null; try{ nome = ME && ME.vozNome; }catch(e){}
    VOZ.lista = L;
    VOZ.v = (nome && L.find(v => v.name === nome)) || VOZ_PREF.map(n => L.find(v => v.name.toLowerCase().includes(n))).find(Boolean) || L.find(v => v.localService) || L[0] || null;
  }catch(e){}
}
if(VOZ.ok){ achaVoz(); try{ speechSynthesis.onvoiceschanged = achaVoz; }catch(e){} }
const FRAC = { "1/2": "meia", "1/3": "um terço", "1/4": "um quarto", "3/4": "três quartos", "2/3": "dois terços", "1/8": "um oitavo" };
function prepFala(t){
  return String(t)
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, (m, a, b) => FRAC[a + "/" + b] || `${a} de ${b}`)
    .replace(/colher(es)?\s*\((sopa|chá|cha)\)/gi, (m, p, k) => `colher${p || ""} de ${k}`)
    .replace(/xícara(s)?\s*\((chá|cha)\)/gi, (m, p) => `xícara${p || ""} de chá`)
    .replace(/(\d)\s*kg\b/gi, "$1 quilos").replace(/(\d)\s*g\b/g, "$1 gramas").replace(/(\d)\s*ml\b/gi, "$1 mililitros").replace(/(\d)\s*l\b/g, "$1 litros")
    .replace(/(\d)\s*°\s*C\b/gi, "$1 graus").replace(/\bmin\b/g, "minutos").replace(/(\d+)\s*x\b/gi, "$1 vezes").replace(/\bkcal\b/gi, "calorias")
    .replace(/\s*\(([^)]*)\)/g, ", $1,").replace(/\s+/g, " ").trim();
}
function falar(t, fim){
  let ligado = true; try{ ligado = !(ME && ME.voz === false); }catch(e){}
  if(!VOZ.ok || !ligado){ if(fim) setTimeout(fim, 50); return; }
  try{
    speechSynthesis.cancel(); if(!VOZ.v) achaVoz();
    const partes = prepFala(t).split(/(?<=[.!?;:])\s+/).filter(s => s.trim());
    let vel = .97; try{ vel = (ME && ME.vozVel) || .97; }catch(e){}
    partes.forEach((s, i) => {
      const u = new SpeechSynthesisUtterance(s); u.lang = "pt-BR"; if(VOZ.v) u.voice = VOZ.v; u.rate = vel; u.pitch = 1.02;
      if(i === 0) u.onstart = () => document.querySelectorAll(".speaking").forEach(e => e.hidden = false);
      if(i === partes.length - 1) u.onend = u.onerror = () => { document.querySelectorAll(".speaking").forEach(e => e.hidden = true); if(fim) fim(); };
      speechSynthesis.speak(u);
    });
  }catch(e){ if(fim) fim(); }
}
const calar = () => { try{ VOZ.ok && speechSynthesis.cancel(); }catch(e){} };
const SOM = window.SOM;

/* ---------- Banco local ---------- */
const KEY = "cklife_db_v1";
const NU = window.NUVEM || { ativo: false };
const modoAdmin = () => location.hash.startsWith("#admin") || /^\/admin/.test(location.pathname);
const LS = {
  get(){ try{ const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; }catch(e){ return null; } },
  set(v){ try{ localStorage.setItem(KEY, JSON.stringify(v)); return true; }catch(e){ return false; } },
  sess(v){ try{ if(v === undefined) return localStorage.getItem(KEY + "_s"); if(v === null) localStorage.removeItem(KEY + "_s"); else localStorage.setItem(KEY + "_s", v); }catch(e){ return null; } }
};
let DB = LS.get(), ME = null, memSess = null;
function save(){ if(NU.ativo){ NU.salvar(DB); return; } if(!LS.set(DB)){ if(!save.warned){ save.warned = true; toast("Este navegador não está salvando. Os dados somem ao fechar."); } } }

/* Receitas e exercícios */
const CATS = { cafe:"Café da manhã", almoco:"Almoço e jantar", salada:"Saladas", sopa:"Sopas", lanche:"Lanches", doce:"Sobremesas fit" };
const CAT_INI = { cafe:"CM", almoco:"AJ", salada:"SA", sopa:"SO", lanche:"LA", doce:"DO" };
const toRec = (r, i, extra) => ({ id: extra ? r.id : "r" + i, nome: r[0] ?? r.nome, cat: r[1] ?? r.cat, min: r[2] ?? r.min, porc: r[3] ?? r.porc, kcal: r[4] ?? r.kcal, p: r[5] ?? r.p, c: r[6] ?? r.c, g: r[7] ?? r.g, ing: (r[8] ?? r.ing).split("|"), passos: (r[9] ?? r.passos).split("|") });
const BASE_REC = [...window.R1, ...window.R2, ...window.R3, ...window.R4].map((r, i) => toRec(r, i));
function receitas(){ const oc = new Set(DB.receitasOcultas || []); return [...BASE_REC, ...(DB.receitasExtras || []).map(r => toRec(r, 0, true))].filter(r => !oc.has(r.id)); }
const toEx = e => Array.isArray(e) ? { id: e[0], nome: e[1], grupo: e[2], equip: e[3], passos: e[4].split("|"), erros: (e[5] || "").split("|").filter(Boolean), resp: e[6] || "Respire de forma contínua, sem prender o ar." } : e;
function exercicios(){ const aj = new Map((DB.exercAjustes || []).map(a => [a.id, a])); return [...window.EX.map(toEx), ...(DB.exercExtras || [])].map(e => aj.has(e.id) ? { ...e, ...aj.get(e.id) } : e); }
const exById = id => exercicios().find(e => e.id === id) || { id, nome: id, grupo: "", equip: "", passos: [], erros: [], resp: "" };
const META = window.EXMETA, PROGS = window.PROGRAMAS.filter(p => p.local === "casa"), EQN = window.EQ_NOMES;
const emCasa = id => !!META[id];
const ALIM = window.ALIM.map((a, i) => ({ id: "a" + i, nome: a[0], porcao: a[1], kcal: a[2], p: a[3], c: a[4], g: a[5] }));

function rng(seed){ let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function semente(){
  const r = rng(42);
  const pick = a => a[Math.floor(r() * a.length)];
  const db = {
    versao: 1, criado: today(),
    config: { nomeApp: "CK Life", checkout: "", suporte: "", treinosParaCupom: 8, premiumPreco: 19.9 },
    freq: { cliques: 25, minutos: 4, intervalo: 3, maxDia: 6 },
    users: [], eventos: [], acessos: {},
    cidades: [ {id:1,nome:"Cuiabá",uf:"MT",ativa:true}, {id:2,nome:"Várzea Grande",uf:"MT",ativa:true}, {id:3,nome:"Rondonópolis",uf:"MT",ativa:true}, {id:4,nome:"Sinop",uf:"MT",ativa:true}, {id:5,nome:"Outra cidade",uf:"",ativa:true} ],
    segmentos: [ {id:1,nome:"Academia",ativo:true}, {id:2,nome:"Suplementos",ativo:true}, {id:3,nome:"Restaurante saudável",ativo:true}, {id:4,nome:"Moda fitness",ativo:true}, {id:5,nome:"Clínica e estética",ativo:true} ],
    anunciantes: [], campanhas: [], pagamentos: [], profissionais: [], parceiros: [], cupons: [], avisos: [],
    receitasExtras: [], receitasOcultas: [], exercExtras: [], exercAjustes: [], receitasPlano: {}
  };
  db.anunciantes = [
    { id:"an1", nome:"Academia Força Total", seg:1, cidade:1, plano:"exclusivo", valor:450, contato:"Marcos", tel:"(65) 99811-2201", obs:"", ativo:true, exemplo:true },
    { id:"an2", nome:"Nutri Suplementos", seg:2, cidade:1, plano:"comercial", valor:250, contato:"Paula", tel:"(65) 99742-1180", obs:"", ativo:true, exemplo:true },
    { id:"an3", nome:"Verde Marmitas Fit", seg:3, cidade:2, plano:"comercial", valor:200, contato:"Rafa", tel:"(65) 99620-3344", obs:"", ativo:true, exemplo:true }
  ];
  const ini = addD(today(), -29);
  db.campanhas = [
    { id:"cp1", anunc:"an1", titulo:"Primeiro mês grátis na Força Total", texto:"Mostre o app na recepção e treine 30 dias sem pagar matrícula.", destino:"whatsapp", botao:"Quero meu mês grátis", whats:"65998112201", msg:"Oi! Vi o anúncio no CK Life e quero o mês grátis.", insta:"", site:"", genero:"todos", idMin:16, idMax:70, cidade:1, inicio:ini, fim:"", ativa:true, exemplo:true },
    { id:"cp2", anunc:"an2", titulo:"Whey com 15% de desconto", texto:"Use o cupom CKLIFE na loja ou no site.", destino:"instagram", botao:"Ver no Instagram", whats:"", msg:"", insta:"nutrisuplementos", site:"", genero:"todos", idMin:18, idMax:60, cidade:"", inicio:ini, fim:"", ativa:true, exemplo:true },
    { id:"cp3", anunc:"an3", titulo:"Marmitas fit a partir de R$ 16", texto:"Cardápio da semana com entrega em Várzea Grande.", destino:"site", botao:"Ver cardápio", whats:"", msg:"", insta:"", site:"https://exemplo.com.br", genero:"todos", idMin:18, idMax:70, cidade:2, inicio:ini, fim:"", ativa:true, exemplo:true }
  ];
  db.profissionais = [
    { id:"pf1", nome:"Ana Ribeiro", tipo:"Personal trainer", whats:"65999990001", desc:"Treino de força e emagrecimento. Atende em Cuiabá e online.", valor:80, ordem:1, ativo:true, foto:"", exemplo:true },
    { id:"pf2", nome:"Dr. Lucas Mendes", tipo:"Nutricionista", whats:"65999990002", desc:"Plano alimentar para ganho de massa e reeducação alimentar.", valor:150, ordem:2, ativo:true, foto:"", exemplo:true }
  ];
  db.parceiros = [
    { id:"pc1", nome:"Empório Natural", cidade:1, tel:"(65) 3322-1100", end:"Av. Getúlio Vargas, 1200", desconto:10, validade:addD(today(), 120), pin:"4821", regras:"Válido para compras acima de R$ 50.", ativo:true, logo:"", exemplo:true },
    { id:"pc2", nome:"Loja Move Fitness", cidade:2, tel:"(65) 3311-2299", end:"Rua das Palmeiras, 45", desconto:15, validade:addD(today(), 90), pin:"7710", regras:"Uma vez por cliente.", ativo:true, logo:"", exemplo:true }
  ];
  const mes = today().slice(0, 7);
  db.pagamentos = [
    { id:"pg1", anunc:"an1", ref:mes, valor:450, venc:mes + "-10", status:"pago", pagoEm:mes + "-08", forma:"Pix", obs:"", exemplo:true },
    { id:"pg2", anunc:"an2", ref:mes, valor:250, venc:mes + "-10", status:"pendente", pagoEm:"", forma:"", obs:"", exemplo:true },
    { id:"pg3", anunc:"an3", ref:mes, valor:200, venc:mes + "-05", status:"atrasado", pagoEm:"", forma:"", obs:"", exemplo:true }
  ];
  db.avisos = [ { id:"av1", titulo:"Bem-vinda ao CK Life", texto:"Treine em casa com o plano montado para você, cozinhe com a voz guiando cada passo e ganhe cupons a cada 8 treinos.", d:today(), ativo:true } ];
  const nomes = ["Ana","Bruno","Carla","Diego","Elaine","Felipe","Gabriela","Henrique","Isabela","João","Karina","Lucas","Mariana","Natália","Otávio","Patrícia","Rafael","Sabrina","Thiago","Vanessa","William","Yasmin","Larissa","Gustavo"];
  const sob = ["Silva","Souza","Oliveira","Costa","Pereira","Lima","Almeida","Ferreira"];
  nomes.forEach((n, i) => {
    const gen = /a$|e$|in$|el$/.test(n) && !["Felipe","Henrique","Rafael"].includes(n) ? "feminino" : "masculino";
    const cad = addD(today(), -Math.floor(r() * 60));
    const ano = 1975 + Math.floor(r() * 30);
    const u = { id:"ex" + i, nome: n + " " + pick(sob), email: n.toLowerCase() + i + "@exemplo.com", senha:"", whats:"(65) 9" + Math.floor(80000000 + r() * 19999999), nasc: `${ano}-0${1 + Math.floor(r() * 9)}-1${Math.floor(r() * 9)}`, genero: gen, cidade: 1 + Math.floor(r() * 4), criado: cad, exemplo: true, admin:false, bloqueado:false,
      premium: r() < .3 ? { tipo: pick(["pago","pago","cortesia"]), ate: addD(today(), 20) } : (cad > addD(today(), -7) ? { tipo:"teste", ate: addD(cad, 7) } : null),
      perfil: { peso: 55 + Math.round(r() * 40), altura: 155 + Math.round(r() * 30), objetivo: pick(["emagrecer","manter","ganhar"]), atividade: 1.375, nivel:"iniciante" }, diario:{}, pesos:[], treinos:[], favs:[], plano: pick(["comecando","calistenia","hiit","gluteos","abc"]) };
    for(let d = 0; d < 30; d++){ const dia = addD(today(), -d); if(dia < cad) break; if(r() < .45){ (db.acessos[dia] = db.acessos[dia] || []).push(u.id); if(r() < .5) u.treinos.push({ d: dia, prog: u.plano, plano: u.plano, dia: 0, nome: "Treino", min: 15 + Math.floor(r() * 30), kcal: 90 + Math.floor(r() * 200) }); } }
    db.users.push(u);
  });
  // impressões e cliques de exemplo
  for(let d = 0; d < 30; d++){
    const dia = addD(today(), -d);
    (db.acessos[dia] || []).forEach(u => { db.campanhas.forEach(c => { if(r() < .55){ db.eventos.push({ t:"imp", c:c.id, u, d:dia, ex:1 }); if(r() < .06) db.eventos.push({ t:"clk", c:c.id, u, d:dia, ex:1 }); } }); });
  }
  return db;
}

if(NU.ativo){ DB = NU.vazio(); NU.aoErro(() => toast("Sem conexão agora. Seus dados serão salvos quando a internet voltar.")); }
else if(!DB || !DB.versao){ DB = semente(); save(); }

/* ---------- Sessão ---------- */
const userById = id => DB.users.find(u => u.id === id);
function sessao(){ if(NU.ativo) return NU.uid ? userById(NU.uid) || null : null; const id = LS.sess() || memSess; return id ? userById(id) : null; }
function setSess(id){ memSess = id; LS.sess(id); }
async function logout(){ const adm = modoAdmin(); if(NU.ativo){ fechaTudo(); await NU.sair(); location.reload(); return; } setSess(null); ME = null; fechaTudo(); adm ? showAdminLogin() : showLogin(); }
document.querySelectorAll("[data-logout]").forEach(b => b.onclick = logout);
function show(v){ ["v-login","v-admlogin","v-onb","v-bloq","v-app","v-admin"].forEach(x => $(x).hidden = x !== v); escondeSplash(); window.scrollTo(0, 0); }
function escondeSplash(){ const s = $("splash"); if(s && !s.classList.contains("sai")){ s.classList.add("sai"); setTimeout(() => s.remove(), 450); } }
setTimeout(escondeSplash, 15000);

/* ---------- Entrar e criar conta ---------- */
function lmsg(t, ok){ if(t && !ok) SOM.erro(); const m = $("login-msg"); m.hidden = !t; m.className = "msg " + (ok ? "msg-ok" : "msg-bad"); m.textContent = t || "";
  const carregando = !!t && ok && /…$/.test(t);
  document.querySelectorAll("#v-login [type=submit], #b-esqueci").forEach(b => { b.classList.toggle("carregando", carregando); b.disabled = carregando; }); }
function modoAuth(cad){ $("tg-cad").setAttribute("aria-pressed", cad); $("tg-login").setAttribute("aria-pressed", !cad); $("f-cad").hidden = !cad; $("f-login").hidden = cad; lmsg(""); }
$("tg-login").onclick = () => modoAuth(false);
$("tg-cad").onclick = () => modoAuth(true);
function showLogin(){
  try{ const em = localStorage.getItem(KEY + "_email"); if(em && !$("l-email").value) $("l-email").value = em; }catch(e){}
  $("c-cid").innerHTML = DB.cidades.filter(c => c.ativa).map(c => `<option value="${c.id}">${esc(c.nome)}${c.uf ? " · " + esc(c.uf) : ""}</option>`).join("");
  show("v-login");
}
$("f-login").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("l-email").value.trim().toLowerCase(), s = $("l-senha").value;
  try{ localStorage.setItem(KEY + "_email", email); }catch(e){}
  if(!email || !s) return lmsg("Preencha e-mail e senha.");
  if(NU.ativo){
    lmsg("Entrando…", true); const r = await NU.entrar(email, s); if(r.erro) return lmsg(r.erro);
    await NU.carregar(DB, r.user, false); SOM.chime(); lmsg(""); entrar(); return;
  }
  const u = DB.users.find(x => x.email === email);
  if(!u || !u.senha || u.senha !== await hash(s)) return lmsg("E-mail ou senha não conferem. Se ainda não tem conta, toque em Criar conta.");
  setSess(u.id); SOM.chime(); entrar();
});
$("b-esqueci").onclick = async () => {
  if(!NU.ativo) return lmsg("Peça ao administrador para criar uma senha nova para você.", true);
  const email = $("l-email").value.trim().toLowerCase(); if(!email) return lmsg("Digite seu e-mail no campo acima e toque de novo em Esqueci minha senha.");
  lmsg("Enviando o link…", true); const e = await NU.reset(email); e ? lmsg(e) : lmsg("Enviamos um link para criar uma senha nova. Confira seu e-mail (e a caixa de spam).", true);
};
function telaNovaSenha(){
  show("v-login"); modoAuth(false); $("f-login").hidden = true; $("f-cad").hidden = true;
  const m = $("login-msg"); m.hidden = false; m.className = "";
  m.innerHTML = `<form id="f-nova" class="panel" style="gap:12px" novalidate><h2 style="font-size:26px">Crie sua senha nova</h2><div class="field"><label for="ns-1">Senha nova</label><input class="input" id="ns-1" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></div><div class="field"><label for="ns-2">Repita a senha</label><input class="input" id="ns-2" type="password" autocomplete="new-password"></div><button class="btn btn-accent btn-block btn-lg" type="submit">Salvar senha</button><div id="ns-msg"></div></form>`;
  $("f-nova").onsubmit = async ev => { ev.preventDefault(); const a = $("ns-1").value, b = $("ns-2").value, out = $("ns-msg");
    if(a.length < 6 || a !== b){ SOM.erro(); out.innerHTML = `<div class="msg msg-bad">As senhas precisam ser iguais e ter pelo menos 6 caracteres.</div>`; return; }
    const e = await NU.novaSenha(a); if(e){ out.innerHTML = `<div class="msg msg-bad">${esc(e)}</div>`; return; }
    SOM.chime(); toast("Senha salva"); location.hash = ""; location.reload(); };
}
$("f-cad").addEventListener("submit", async e => {
  e.preventDefault();
  const v = id => $(id).value.trim(), email = v("c-email").toLowerCase();
  if(!v("c-nome")) return lmsg("Digite seu nome.");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return lmsg("Digite um e-mail válido.");
  if($("c-senha").value.length < 6) return lmsg("A senha precisa ter pelo menos 6 caracteres.");
  if($("c-senha").value !== $("c-senha2").value) return lmsg("As duas senhas estão diferentes.");
  if(DB.users.some(u => u.email === email)) return lmsg("Já existe uma conta com esse e-mail. Toque em Já tenho conta.");
  if(!v("c-nasc")) return lmsg("Informe sua data de nascimento.");
  { const i = idade(v("c-nasc")), min = +(DB.config.idadeMinima || 18); if(i === null || i < min) return lmsg(`O CK Life é para maiores de ${min} anos.`); if(i > 110) return lmsg("Confira sua data de nascimento."); }
  const primeiro = false;
  let novoId = uid();
  if(NU.ativo){
    lmsg("Criando sua conta…", true);
    const r = await NU.cadastrar(email, $("c-senha").value); if(r.erro) return lmsg(r.erro);
    const pend = { nome: v("c-nome"), whats: v("c-whats"), nasc: v("c-nasc"), cidade: +$("c-cid").value };
    if(r.confirmar){ try{ localStorage.setItem(KEY + "_pend_" + email, JSON.stringify(pend)); }catch(e){} modoAuth(false); $("l-email").value = email; return lmsg("Enviamos um link para o seu e-mail. Toque nele para confirmar a conta e depois entre aqui com sua senha.", true); }
    await NU.carregar(DB, { id: r.id, email }, false); novoId = r.id;
  }
  const u = { id: novoId, nome: v("c-nome"), email, senha: NU.ativo ? undefined : await hash($("c-senha").value), whats: v("c-whats"), nasc: v("c-nasc"), genero: "feminino", cidade: +$("c-cid").value, criado: today(),
    admin: primeiro, perms: primeiro ? { total: true } : null, bloqueado: false, premium: { tipo: "teste", ate: addD(today(), 7) }, perfil: null, diario: {}, pesos: [], treinos: [], favs: [], voz: true };
  DB.users.push(u); save(); if(!NU.ativo) setSess(u.id); SOM.chime();
  entrar();
});


/* ---------- Entrada do painel do administrador (link separado: #admin) ---------- */
function showAdminLogin(aviso){
  const temAdm = NU.ativo ? NU.existeAdmin : DB.users.some(u => u.admin && !u.exemplo);
  $("admlogin").innerHTML = `<div class="brandrow"><span class="logo-slot">${LOGO(34)}</span><div class="wordmark">CK <b>Life</b><small>Admin</small></div></div>
    <h1 class="bigtitle" style="font-size:40px">${temAdm ? "Entrar no <em>painel</em>" : "Criar conta de <em>administrador</em>"}</h1>
    <p class="lead">${temAdm ? "Alunas, anúncios, parceiros, receitas e financeiro." : "Esta é a primeira vez. Crie a conta que vai administrar o app."}</p>
    ${aviso ? `<div class="msg msg-bad">${esc(aviso)}</div>` : ""}
    <form id="fa" class="panel" style="gap:12px" novalidate>
      ${temAdm ? "" : `<div class="field"><label for="fa-n">Seu nome</label><input class="input" id="fa-n" autocomplete="name"></div>`}
      <div class="field"><label for="fa-e">E-mail</label><input class="input" id="fa-e" type="email" autocomplete="email" inputmode="email"></div>
      <div class="field"><label for="fa-s">Senha</label><input class="input" id="fa-s" type="password" autocomplete="${temAdm ? "current-password" : "new-password"}" placeholder="${temAdm ? "" : "Mínimo 6 caracteres"}"></div>
      <button class="btn btn-accent btn-block btn-lg" type="submit">${temAdm ? "Entrar" : "Criar e entrar"}</button>
      <div id="fa-msg"></div>
    </form>`;
  show("v-admlogin");
  $("fa").onsubmit = async e => {
    e.preventDefault();
    const bt = $("fa").querySelector("[type=submit]"), espera = on => { bt.classList.toggle("carregando", on); bt.disabled = on; };
    const em = $("fa-e").value.trim().toLowerCase(), s = $("fa-s").value, erro = m => { espera(false); SOM.erro(); $("fa-msg").innerHTML = `<div class="msg msg-bad">${m}</div>`; };
    if(NU.ativo){
      espera(true);
      if(temAdm){
        const r = await NU.entrar(em, s); if(r.erro) return erro(r.erro);
        await NU.carregar(DB, r.user, true); if(!NU.admin){ await NU.sair(); return erro("Esta conta não tem acesso ao painel."); }
        ME = userById(NU.uid); SOM.chime(); window.ADMIN.abrir(); return;
      }
      const n = $("fa-n").value.trim(); if(!n) return erro("Digite seu nome."); if(s.length < 6) return erro("A senha precisa ter pelo menos 6 caracteres.");
      let r = await NU.cadastrar(em, s);
      if(r.erro && /Já existe/.test(r.erro)){ r = await NU.entrar(em, s); if(r.erro) return erro("Já existe uma conta com esse e-mail. Use a senha dela."); }
      else if(r.erro) return erro(r.erro);
      else if(r.confirmar) return erro("Enviamos um link para o seu e-mail. Confirme e depois volte aqui e entre com a mesma senha.");
      const ok = await NU.primeiroAdmin(n); if(!ok) return erro("Já existe uma administradora. Peça para ela te dar acesso.");
      const { data: { user } } = await NU.sb.auth.getUser(); await NU.carregar(DB, user, true);
      ME = userById(NU.uid); SOM.chime(); toast("Conta de administrador criada"); window.ADMIN.abrir(); return;
    }
    if(temAdm){
      const u = DB.users.find(x => x.email === em);
      if(!u || !u.senha || u.senha !== await hash(s)) return erro("E-mail ou senha não conferem.");
      if(!u.admin) return erro("Esta conta não tem acesso ao painel.");
      setSess(u.id); ME = u; SOM.chime(); window.ADMIN.abrir(); return;
    }
    const n = $("fa-n").value.trim();
    if(!n) return erro("Digite seu nome."); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return erro("Digite um e-mail válido."); if(s.length < 6) return erro("A senha precisa ter pelo menos 6 caracteres.");
    let u = DB.users.find(x => x.email === em);
    if(u){ if(u.senha !== await hash(s)) return erro("Já existe uma conta com esse e-mail. Use a senha dela."); u.admin = true; u.perms = { total: true }; }
    else { u = { id: uid(), nome: n, email: em, senha: await hash(s), criado: today(), admin: true, perms: { total: true }, adminDesde: today(), bloqueado: false, premium: { tipo: "vitalicio", ate: "9999-12-31" }, perfil: null, diario: {}, pesos: [], treinos: [], favs: [], voz: true, genero: "feminino", cidade: 1 }; DB.users.push(u); }
    save(); setSess(u.id); ME = u; SOM.chime(); toast("Conta de administrador criada"); window.ADMIN.abrir();
  };
}

/* ---------- Plano: recomendação e progressão ---------- */
const progById = id => PROGS.find(p => p.id === id) || PROGS[0];
/* Free usa o programa básico do objetivo; os dados do programa Pro ficam guardados e voltam quando ela volta ao Pro */
const progAtual = () => { const id = ME.prog && ME.prog.id; return typeof progLiberado === "function" && !progLiberado(id) ? progById(objById((ME.perfil && ME.perfil.objetivo) || "emagrecer")[4][0]) : progById(id); };
function recomenda(p){
  const o = { perder: "emagrecer", forca: "massa", gluteos: "definir", disposicao: "condicionamento" }[p.objetivo] || p.objetivo, ini = p.nivel === "iniciante";
  if(o === "mobilidade") return "mobilidade";
  if(+p.tempo <= 10) return o === "definir" ? "abdomen" : "seteminutos";
  if(o === "emagrecer") return ini ? "comecando" : "hiit";
  if(o === "definir") return "gluteos";
  if(o === "massa") return ini ? "gluteos" : "calistenia";
  if(o === "condicionamento") return ini ? "seteminutos" : "hiit";
  return "comecando";
}
const TROCA = { bulgarocasa: "afundocasa", stepup: "afundocasa", flexinc: "flexjoelho", mergulho: "flexdiam", invrow: "supermann", barrafixa: "invrow", pularcorda: "polichinelo" };
function troca(id){
  const m = META[id]; if(!m || !ME.perfil || ME.perfil.local === "academia") return id;
  const tem = new Set(["nada", "parede", ...(ME.perfil.itens || [])]);
  let x = id, n = 0; while(META[x] && !tem.has(META[x].eq) && TROCA[x] && n++ < 4) x = TROCA[x];
  return x;
}
function semana(){ const p = progAtual(); return Math.min(p.semanas, 1 + Math.floor(((ME.prog && ME.prog.feitos) || 0) / p.diasSem)); }
function diaAtual(){ const p = progAtual(); return ((ME.prog && ME.prog.feitos) || 0) % p.dias.length; }
function ajusta(it, sem){
  const [id, modo, val, desc, sets] = it, f = 1 + ((ME.prog && ME.prog.fator) || 0);
  let v = modo === "t" ? val + 5 * (sem - 1) : Math.round(val * (1 + .1 * (sem - 1)));
  v = Math.max(modo === "t" ? 10 : 3, Math.round(v * f));
  return { id: troca(id), modo, val: v, desc, sets: sets || 1 };
}
function montaTreino(dia, sem, extra){
  const its = dia.itens.map(i => ajusta(i, sem || 1)), steps = [];
  if(dia.tipo === "series") its.forEach(it => { for(let s = 0; s < it.sets; s++) steps.push({ ...it, serie: s + 1, series: it.sets }); });
  else for(let r = 0; r < (dia.rodadas || 1); r++) its.forEach((it, k) => steps.push({ ...it, rodada: r + 1, rodadas: dia.rodadas || 1, desc: k === its.length - 1 ? (dia.descRodada || it.desc) : it.desc }));
  if(steps.length) steps[steps.length - 1].desc = 0;
  return { nome: dia.nome, steps, ...extra };
}
const segDe = s => s.modo === "t" ? s.val : Math.round(s.val * 3.2);
const minTreino = t => Math.max(1, Math.round(t.steps.reduce((a, s) => a + segDe(s) + (s.desc || 0), 0) / 60));
const kcalDe = (s, seg) => ((META[s.id] && META[s.id].met) || 5) * ((ME.perfil && ME.perfil.peso) || 70) * seg / 3600;
const kcalTreino = t => Math.round(t.steps.reduce((a, s) => a + kcalDe(s, segDe(s)), 0));
function treinoDoDia(){
  const p = progAtual(), sem = semana(), di = diaAtual();
  return montaTreino(p.dias[di], sem, { prog: p.id, di, sem, cor: p.cor, sub: `${p.nome} · semana ${sem} de ${p.semanas}` });
}
const QUICK = [
  { id:"q-abd", nome:"Abdômen em 10 min", foco:"Abdômen", rodadas:2, descRodada:30, itens:[["abdsupra","t",40,15],["bicicleta","t",40,15],["prancha","t",40,15],["abdinfra","t",40,15],["hollow","t",30,15],["pranchalat","t",30,15]] },
  { id:"q-hiit", nome:"HIIT de 7 minutos", foco:"Queimar", rodadas:1, descRodada:0, itens:[["polichinelo","t",40,20],["agachsalto","t",40,20],["escalador","t",40,20],["burpee","t",40,20],["skater","t",40,20],["corrida","t",40,20],["toqueombro","t",40,0]] },
  { id:"q-glu", nome:"Glúteos em 15 min", foco:"Glúteos", rodadas:2, descRodada:40, itens:[["ponte","t",45,15],["coice","t",45,15],["elevlatdeit","t",45,15],["sumocasa","t",45,15],["pontealt","t",45,15]] },
  { id:"q-sup", nome:"Braços e peito", foco:"Superior", rodadas:2, descRodada:45, itens:[["flexjoelho","t",40,20],["flexdiam","t",30,20],["pike","t",30,20],["mergulho","t",40,20],["flexinc","t",40,20]] },
  { id:"q-per", nome:"Pernas em 15 min", foco:"Pernas", rodadas:2, descRodada:40, itens:[["agacho","t",45,15],["afundocasa","t",45,15],["wallsit","t",40,15],["sumocasa","t",45,15],["panturrilha","t",45,15]] },
  { id:"q-alo", nome:"Alongamento", foco:"Mobilidade", rodadas:2, descRodada:10, itens:[["crianca","t",40,10],["alongquad","t",30,10],["along","t",40,10],["perdigueiro","t",30,10]] },
  { id:"q-dia", nome:"Bom dia em 5 min", foco:"Acordar", rodadas:2, descRodada:15, itens:[["polichinelo","t",30,10],["agacho","t",30,10],["perdigueiro","t",30,10],["along","t",30,10]] }
];
const treinoRapido = q => montaTreino({ nome: q.nome, tipo: "circuito", rodadas: q.rodadas, descRodada: q.descRodada, itens: q.itens }, 1, { rapido: q.id, cor: "#2E7D5A", sub: q.foco });

/* ---------- Metas de dieta ---------- */
function metas(u){
  const p = u.perfil || { peso: 70, altura: 170, objetivo: "manter", dias: 3 };
  if(p.metaManual) return p.metaManual;
  const id = idade(u.nasc) || 30, peso = +p.peso || 70, alt = +p.altura || 170;
  const tmb = 10 * peso + 6.25 * alt - 5 * id + (u.genero === "masculino" ? 5 : -161);
  const at = p.atividade || (p.dias >= 5 ? 1.725 : p.dias >= 3 ? 1.55 : 1.375);
  const ob = { perder: "emagrecer", emagrecer: "emagrecer", forca: "ganhar", massa: "ganhar", ganhar: "ganhar", definir: "definir", gluteos: "definir" }[p.objetivo] || "manter";
  const kcal = Math.round(tmb * at * ({ emagrecer: .8, definir: .92, manter: 1, ganhar: 1.1 }[ob]) / 10) * 10;
  const prot = Math.round(peso * (ob === "manter" ? 1.6 : 2)), gord = Math.round(peso * .9);
  return { kcal, p: prot, c: Math.max(50, Math.round((kcal - prot * 4 - gord * 9) / 4)), g: gord, agua: Math.round(peso * 35 / 250) };
}
const REFS = [["cafe","Café da manhã"],["almoco","Almoço"],["lanche","Lanche"],["jantar","Jantar"]];
function dia(d){ ME.diario = ME.diario || {}; return ME.diario[d] || (ME.diario[d] = { cafe: [], almoco: [], lanche: [], jantar: [], agua: 0 }); }
function totais(d){ const x = dia(d), t = { kcal: 0, p: 0, c: 0, g: 0 }; REFS.forEach(([k]) => (x[k] || []).forEach(i => { t.kcal += i.kcal; t.p += i.p; t.c += i.c; t.g += i.g; })); return t; }
function marcaAcesso(){ const d = today(); DB.acessos[d] = DB.acessos[d] || []; if(!DB.acessos[d].includes(ME.id)){ DB.acessos[d].push(ME.id); save(); } }
const diasTreino = () => new Set((ME.treinos || []).map(t => t.d));
function streak(){
  const set = diasTreino(); Object.entries(ME.diario || {}).forEach(([d, x]) => { if(REFS.some(([k]) => (x[k] || []).length)) set.add(d); });
  let d = today(); if(!set.has(d)) d = addD(d, -1); let n = 0; while(set.has(d)){ n++; d = addD(d, -1); } return n;
}
// Premium da aluna logada vem do servidor (entitlement CK_LIFE_PRO); o campo antigo vale para o painel e como reserva
const isPremium = u => (u && typeof ME !== "undefined" && ME && u.id === ME.id && window.__ENT && window.__ENT.d) ? !!window.__ENT.d.pro : !!(u && u.premium && (u.premium.tipo === "vitalicio" || u.premium.ate >= today()));
function migra(u){
  if(u.perfil){ u.perfil.local = u.perfil.local || "casa"; u.perfil.itens = u.perfil.itens || ["cadeira"]; u.perfil.dias = u.perfil.dias || 3; u.perfil.tempo = u.perfil.tempo || 20;
    u.perfil.local = "casa"; u.perfil.objetivo = { perder: "emagrecer", forca: "massa", ganhar: "massa", gluteos: "definir", disposicao: "condicionamento", manter: "definir" }[u.perfil.objetivo] || u.perfil.objetivo; }
  if(u.prog && !PROGS.some(p => p.id === u.prog.id)) u.prog = null;
  if(!u.prog && u.perfil) u.prog = { id: PROGS.some(p => p.id === u.plano) ? u.plano : recomenda(u.perfil), ini: today(), feitos: 0, fator: 0 };
  if(u.prog) u.plano = u.prog.id;
  if(u.voz == null) u.voz = true;
}

/* ---------- Abertura ---------- */
function entrar(){
  ME = sessao(); achaVoz();
  const modoAdm = modoAdmin();
  if(NU.ativo && NU.uid && !ME && !modoAdm){
    let pend = {}; try{ pend = JSON.parse(localStorage.getItem(KEY + "_pend_" + NU.email) || "{}"); }catch(e){}
    ME = { id: NU.uid, email: NU.email, nome: pend.nome || String(NU.email || "").split("@")[0], whats: pend.whats || "", nasc: pend.nasc || null, cidade: pend.cidade || 1, genero: "feminino", criado: today(), bloqueado: false, premium: { tipo: "teste", ate: addD(today(), 7) }, perfil: null, diario: {}, pesos: [], treinos: [], favs: [], voz: true };
    DB.users.push(ME); save();
  }
  if(!ME){ modoAdm ? showAdminLogin() : showLogin(); return; }
  if(modoAdm){ if(ME.admin){ marcaAcesso(); window.ADMIN.abrir(); } else showAdminLogin("Esta conta não é de administrador. Entre com a conta de admin."); return; }
  if(ME.bloqueado){ show("v-bloq"); return; }
  migra(ME); ME.ultimo = today(); marcaAcesso();
  if(!ME.perfil || !ME.perfil.local){ show("v-onb"); onboarding(); return; }
  abrirApp();
}

/* ---------- Objetivos da CK Life ---------- */
const OBJS = [
  ["emagrecer","Emagrecer","Queimar gordura com treinos que cabem na rotina","flame",["hiit","comecando","seteminutos"]],
  ["definir","Definir","Glúteos, pernas e abdômen mais firmes","target",["gluteos","abdomen","calistenia"]],
  ["massa","Ganhar massa","Força e músculo com o peso do corpo","treinar",["calistenia","gluteos","comecando"]],
  ["condicionamento","Condicionamento","Mais fôlego e disposição no dia a dia","bolt",["hiit","seteminutos","comecando"]],
  ["mobilidade","Mobilidade","Corpo solto, postura e menos dores","leaf",["mobilidade","comecando"]]
];
const OBJFOTO = { emagrecer: "polichinelo", definir: "coice", massa: "desenv", condicionamento: "escalador", mobilidade: "pranchalat" };
const objById = id => OBJS.find(o => o[0] === id) || OBJS[0];
const FRASES = ["Cada treino conta.", "Você está mais perto do que ontem.", "Continue evoluindo.", "Seu ritmo. Sua evolução.", "Construa a sua melhor versão."];
const frase = (k = 0) => FRASES[(new Date().getDate() + k) % FRASES.length];

/* ---------- Montagem do plano (primeiro acesso) ---------- */
let OB = null;
const OBQ = [
  { k: "objetivo", t: "Qual é o seu objetivo?", s: "Vamos montar o treino certo para você. Dá para mudar quando quiser.", o: OBJS.map(o => [o[0], o[1], o[2], o[3]]) },
  { k: "itens", multi: 1, t: "O que você tem em casa?", s: "Marque o que tiver. Se não tiver nada, tudo bem: o treino se adapta.", o: [["cadeira","Cadeira firme ou sofá","Para búlgaro, tríceps e subida","chair"],["mesa","Mesa firme","Para a remada invertida","mesa"],["barra","Barra fixa","Para barra e remadas","barra"],["corda","Corda de pular","Para o cardio","corda"]] },
  { k: "nivel", t: "Como está o seu ritmo hoje?", s: "Sem pressão: o plano evolui junto com você.", o: [["iniciante","Estou começando agora","Ou voltando depois de um tempo parada","leaf"],["intermediario","Já treino às vezes","Faço algumas flexões com os joelhos no chão","bolt"],["avancado","Treino com frequência","Quero um desafio de verdade","flame"]] },
  { k: "tempo", t: "Quanto tempo você tem por treino?", s: "Treino bom é o que cabe na sua rotina.", o: [[10,"Até 10 minutos","Rápido e intenso","clock"],[20,"Uns 20 minutos","O equilíbrio ideal","clock"],[30,"Uns 30 minutos","Treino completo","clock"],[45,"45 minutos ou mais","Sem pressa","clock"]] },
  { k: "dias", t: "Quantos dias por semana?", s: "Comece com o que dá para manter.", o: [[2,"2 dias","Leve"],[3,"3 dias","Recomendado"],[4,"4 dias","Focado"],[5,"5 dias","Intenso"],[6,"6 dias","Atleta"]], grade: 1 },
  { k: "medidas" }, { k: "pronto" }
];
const OBFOTO = { pronto: "img/ex-desenv.jpg", objetivo: "img/modelo.jpg", itens: "img/ex-wallsit.jpg", nivel: "img/ex-afundocasa.jpg", tempo: "img/ex-polichinelo.jpg", dias: "img/ex-agacho.jpg", medidas: "img/ex-pranchalat.jpg" };
const OBFOTO_OPC = { "nivel:iniciante": "agacho", "nivel:intermediario": "afundocasa", "nivel:avancado": "escalador" };
const obHero = (k, voltar, dots, t, sub) => `<div class="obhero"><img src="${OBFOTO[k] || "img/modelo.jpg"}" alt="" onerror="this.remove()"><div class="obhero-top">${voltar}<div style="flex:1">${dots}</div></div><div class="obhero-tx"><h1>${t}</h1><p>${sub}</p></div></div>`;
function onboarding(){
  OB = OB || { i: 0, itens: [] };
  const vis = OBQ.filter(q => !(q.pula && q.pula(OB)));
  const q = vis[OB.i], n = vis.length - 1;
  const dots = `<div class="steps-dots">${vis.slice(0, n).map((_, i) => `<i class="${i <= OB.i ? "on" : ""}"></i>`).join("")}</div>`;
  const voltar = OB.i ? `<button class="iconbtn sm" id="ob-back" aria-label="Voltar">${ic("back", 18)}</button>` : "";
  let h = "";
  if(q.o){
    h = obHero(q.k, voltar, dots, q.t, q.s) + `
      <div class="opts ${q.grade ? "two" : ""}">${q.o.map(o => { const on = q.multi ? OB.itens.includes(o[0]) : String(OB[q.k]) === String(o[0]); const fo = OBFOTO_OPC[q.k + ":" + o[0]]; return `<button class="opt${fo ? " comfoto" : ""}" data-v="${o[0]}" aria-pressed="${on}">${fo ? `<span class="ofoto"><img src="img/ex-${fo}.jpg" alt="" loading="lazy" onerror="this.remove()"></span>` : o[3] ? `<span class="oi">${ic(o[3])}</span>` : ""}<span>${o[1]}<small>${o[2]}</small></span>${on ? `<span class="ock">${ic("check", 14, 3)}</span>` : ""}</button>`; }).join("")}</div>
      ${q.multi ? `<button class="btn btn-accent btn-block btn-lg" id="ob-next">${OB.itens.length ? "Continuar" : "Não tenho nada, continuar"}</button>` : ""}`;
  } else if(q.k === "medidas"){
    h = obHero("medidas", voltar, dots, "Me conte um pouco sobre você", "Para calcular calorias gastas e a sua meta de comida.") + `
      <div class="row2"><div class="field"><label for="ob-peso">Peso (kg)</label><input class="input num" id="ob-peso" inputmode="decimal" value="${esc(OB.peso || "")}" placeholder="70"></div>
      <div class="field"><label for="ob-alt">Altura (cm)</label><input class="input num" id="ob-alt" inputmode="numeric" value="${esc(OB.altura || "")}" placeholder="170"></div></div>
      <div id="ob-msg"></div><button class="btn btn-accent btn-block btn-lg" id="ob-next">Montar meu plano</button>`;
  } else {
    const p = progById(OB.prog), m = metas({ ...ME, perfil: OB });
    const NIVN = { iniciante: "Iniciante", intermediario: "Intermediário", avancado: "Avançado" };
    h = obHero("pronto", "", "", `Seu plano está pronto, ${esc(ME.nome.split(" ")[0])}!`, "Com base nas suas respostas, montamos um plano só seu. " + MARCA.sloganPt) + `
      <div class="card planlist"><h3>Seu plano</h3>
        <div>${ic("calendar", 18)}<span>${OB.dias} dias por semana</span></div>
        <div>${ic("inicio", 18)}<span>Em casa${OB.itens && OB.itens.length ? "" : ", sem equipamentos"}</span></div>
        <div>${ic("target", 18)}<span>Objetivo: ${esc(objById(OB.objetivo)[1])}</span></div>
        <div>${ic("star", 18)}<span>Nível: ${NIVN[OB.nivel] || "Iniciante"}</span></div>
        <div>${ic("clock", 18)}<span>${OB.tempo} minutos por treino</span></div>
      </div>
      <div class="pcard on" style="--pc:${p.cor}"><div><span class="tag c">Recomendado para você</span><h4 style="margin-top:10px">${esc(p.nome)}</h4><p>${esc(p.desc)}</p>
        <div class="tags"><span class="tag">${p.semanas} semanas</span><span class="tag">${OB.dias}x por semana</span><span class="tag">~${p.min} min</span></div></div><div class="pf">${window.BONECO.thumb(exById(p.dias[0].itens[0][0]), sexoB())}${foto(`img/treino-${p.id}.jpg`)}</div></div>
      <div class="card"><h3>Sua meta diária</h3><dl class="kv"><dt>Calorias</dt><dd class="num">${int(m.kcal)} kcal</dd><dt>Proteína</dt><dd class="num">${m.p} g</dd><dt>Água</dt><dd class="num">${(m.agua * .25).toFixed(1).replace(".", ",")} litros</dd></dl></div>
      <button class="btn btn-accent btn-block btn-lg" id="ob-next">Começar agora</button>
      <button class="link" id="ob-back" style="align-self:center">Ajustar respostas</button>`;
  }
  $("onb").innerHTML = h;
  const bk = $("ob-back"); if(bk) bk.onclick = () => { OB.i = q.k === "pronto" ? 0 : OB.i - 1; onboarding(); };
  $("onb").querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
    if(q.multi){ OB.itens = OB.itens.includes(v) ? OB.itens.filter(x => x !== v) : [...OB.itens, v]; SOM.tap(); onboarding(); return; }
    OB[q.k] = v; SOM.check(); setTimeout(() => { OB.i++; onboarding(); window.scrollTo(0, 0); }, 160);
  });
  const nx = $("ob-next"); if(nx) nx.onclick = () => {
    if(q.multi){ OB.i++; onboarding(); return; }
    if(q.k === "medidas"){
      const peso = parseFloat(String($("ob-peso").value).replace(",", ".")), alt = parseFloat($("ob-alt").value);
      if(!(peso > 30 && peso < 300) || !(alt > 120 && alt < 230)){ SOM.erro(); $("ob-msg").innerHTML = `<div class="msg msg-bad">Confira o peso (em kg) e a altura (em cm).</div>`; return; }
      OB.peso = peso; OB.altura = alt; OB.local = "casa"; OB.prog = recomenda(OB); OB.i++; SOM.chime(); onboarding(); return;
    }
    ME.perfil = { objetivo: OB.objetivo, local: "casa", itens: OB.itens, nivel: OB.nivel, tempo: OB.tempo, dias: OB.dias, peso: OB.peso, altura: OB.altura };
    ME.pesos = [{ d: today(), kg: OB.peso }]; ME.prog = { id: OB.prog, ini: today(), feitos: 0, fator: OB.nivel === "avancado" ? .15 : 0 }; ME.plano = OB.prog;
    save(); OB = null; SOM.done(); abrirApp();
    setTimeout(() => falar(`Bem-vinda ao CK Life, ${ME.nome.split(" ")[0]}! Seu plano está pronto.`), 400);
  };
}
const sexoB = () => "f";

/* ---------- Estrutura do app ---------- */
/* ---------- Comunidade das alunas (aba Juntas) ---------- */
const novoId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : uid() + uid();
let FEED = [], FEED_ERRO = "", FEED_T = null;
function miniFoto(src, S = 96){ return new Promise(ok => { if(!src) return ok(""); const im = new Image(); im.onload = () => { const c = document.createElement("canvas"); c.width = c.height = S; c.getContext("2d").drawImage(im, 0, 0, S, S); ok(c.toDataURL("image/jpeg", .8)); }; im.onerror = () => ok(""); im.src = src; }); }
function comprimeImg(fonte, max = 1080){ return new Promise((ok, no) => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); c.toBlob(b => b ? ok(b) : no(new Error("img")), "image/jpeg", .82); }; im.onerror = () => no(new Error("img")); im.src = typeof fonte === "string" ? fonte : URL.createObjectURL(fonte); }); }
const blobParaURL = b => new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
const CM = {
  nuvem: () => NU.ativo && NU.sb,
  local(){ DB.posts = DB.posts || []; if(!NU.ativo && !DB.postsSemente){ DB.postsSemente = true; const ex = DB.users.filter(u => u.exemplo).slice(0, 4), h = Date.now();
      const S = [["Primeira semana completa! Nunca achei que ia gostar tanto de treinar em casa 💚", "img/ex-agacho.jpg", 3], ["Panqueca de banana do app é perfeita pro café da manhã 😍", "img/receita-r1.jpg", 9], ["Glúteos em casa de hoje foi pesado, mas eu fiz!! Quem mais tá no programa?", "img/ex-ponte.jpg", 20], ["Meta da semana batida. Bora meninas, uma puxando a outra!", "", 30]];
      S.forEach(([t, img, hrs], i) => { const u = ex[i] || { id: "ex" + i, nome: "Aluna" }; DB.posts.push({ id: novoId(), user: u.id, nome: u.nome, foto: "", texto: t, img, criado: new Date(h - hrs * 36e5).toISOString(), curtidas: ex.slice(0, 2 + i).map(x => x.id), coments: i === 2 ? [{ id: novoId(), user: (ex[0] || {}).id, nome: (ex[0] || {}).nome || "Aluna", foto: "", texto: "Eu tô! Semana 2 aqui 💪", criado: new Date(h - 18 * 36e5).toISOString() }] : [] }); }); save(); }
    return DB.posts; },
  async carregar(admin){
    if(!CM.nuvem()) return CM.local().filter(p => admin || !p.oculto || p.user === ME.id).slice().sort((a, b) => b.criado.localeCompare(a.criado));
    const sb = NU.sb, r = await sb.from("posts").select("*").order("criado", { ascending: false }).limit(80); if(r.error) throw r.error;
    const ps = r.data || [], ids = ps.map(p => p.id); let cu = [], co = [];
    if(ids.length){ const a = await sb.from("curtidas").select("*").in("post_id", ids), b = await sb.from("comentarios").select("*").in("post_id", ids); cu = a.data || []; co = b.data || []; }
    return ps.map(p => ({ id: p.id, user: p.user_id, nome: p.nome, foto: p.foto, texto: p.texto, img: p.img, midia: p.midia, conquista: p.conquista, criado: p.criado, oculto: p.oculto, curtidas: cu.filter(c => c.post_id === p.id).map(c => c.user_id), coments: co.filter(c => c.post_id === p.id).sort((x, y) => String(x.criado).localeCompare(String(y.criado))).map(c => ({ id: c.id, user: c.user_id, nome: c.nome, foto: c.foto, texto: c.texto, criado: c.criado })) })).sort((a, b) => String(b.criado).localeCompare(String(a.criado)));
  },
  async publicar(texto, blob){
    const id = novoId(), foto = await miniFoto(ME.foto), criado = new Date().toISOString();
    if(!CM.nuvem()){ CM.local().push({ id, user: ME.id, nome: ME.nome, foto, texto, img: blob ? await blobParaURL(blob) : "", criado, curtidas: [], coments: [] }); save(); return; }
    let img = ""; if(blob){ const path = `${NU.uid}/${id}.jpg`, up = await NU.sb.storage.from("posts").upload(path, blob, { contentType: "image/jpeg", upsert: true }); if(up.error) throw up.error; img = NU.sb.storage.from("posts").getPublicUrl(path).data.publicUrl; }
    const r = await NU.sb.from("posts").insert({ id, user_id: NU.uid, nome: ME.nome, foto, texto, img }); if(r.error) throw r.error;
  },
  async curtir(p, on){
    if(!CM.nuvem()){ const x = CM.local().find(y => y.id === p.id); if(x){ x.curtidas = (x.curtidas || []).filter(u => u !== ME.id); if(on) x.curtidas.push(ME.id); save(); } return; }
    const r = on ? await NU.sb.from("curtidas").insert({ post_id: p.id, user_id: NU.uid }) : await NU.sb.from("curtidas").delete().eq("post_id", p.id).eq("user_id", NU.uid); if(r.error && !/duplicate/i.test(r.error.message || "")) throw r.error;
  },
  async comentar(p, texto, figurinha){
    const c = { id: novoId(), user: ME.id, nome: ME.nome, foto: await miniFoto(ME.foto, 64), texto: texto || "", figurinha: figurinha || null, criado: new Date().toISOString() };
    if(!CM.nuvem()){ const x = CM.local().find(y => y.id === p.id); x.coments = x.coments || []; x.coments.push(c); save(); return c; }
    const r = await NU.sb.from("comentarios").insert({ id: c.id, post_id: p.id, user_id: NU.uid, nome: c.nome, foto: c.foto, texto: c.texto, ...(figurinha ? { figurinha } : {}) }); if(r.error) throw r.error; return c;
  },
  async apagaPost(p){ if(!CM.nuvem()){ DB.posts = CM.local().filter(x => x.id !== p.id); save(); return; } const r = await NU.sb.from("posts").delete().eq("id", p.id); if(r.error) throw r.error; },
  async apagaComent(p, c){ if(!CM.nuvem()){ const x = CM.local().find(y => y.id === p.id); if(x) x.coments = (x.coments || []).filter(k => k.id !== c.id); save(); return; } const r = await NU.sb.from("comentarios").delete().eq("id", c.id); if(r.error) throw r.error; },
  async ocultar(p, v){ if(!CM.nuvem()){ const x = CM.local().find(y => y.id === p.id); if(x) x.oculto = v; save(); return; } const r = await NU.sb.from("posts").update({ oculto: v }).eq("id", p.id); if(r.error) throw r.error; },
  async ultimo(){ if(!CM.nuvem()){ const L = CM.local(); return L.length ? L.map(p => p.criado).sort().pop() : ""; } const r = await NU.sb.from("posts").select("criado").order("criado", { ascending: false }).limit(1); return r.data && r.data[0] ? r.data[0].criado : ""; }
};
const tempoAtras = iso => { const s = (Date.now() - new Date(iso).getTime()) / 1000; if(s < 60) return "agora"; if(s < 3600) return `há ${Math.floor(s / 60)} min`; if(s < 86400) return `há ${Math.floor(s / 3600)} h`; if(s < 172800) return "ontem"; return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); };
const avPost = (nome, foto) => `<span class="pav">${foto ? `<img src="${foto}" alt="">` : esc(String(nome || "?").trim()[0].toUpperCase())}</span>`;
function marcaNovidade(on){ const b = $("nav") && $("nav").querySelector('[data-tab="juntas"]'); if(b) b.classList.toggle("novo", !!on); }
function confereNovidade(){ CM.ultimo().then(u => { if(u && (!ME.feedVisto || u > ME.feedVisto) && TAB !== "juntas") marcaNovidade(true); }).catch(() => {}); }
/*EXPANSAO*/
/*SOCIAL*/
const TABS = [["inicio","Início"],["treinar","Treinos"],["dieta","Nutrição"],["juntas","Comunidade"],["explorar","Explorar"],["perfil","Perfil"],["evolucao","Evolução"]];
const NAV = TABS.slice(0, 6), NAV_DE = { evolucao: "perfil" };
let TAB = "inicio";
$("nav").innerHTML = NAV.map(([k, n]) => `<button role="tab" data-tab="${k}" aria-selected="false"><span class="ico">${ic(k, 21)}</span>${n}</button>`).join("");
$("nav").querySelectorAll("[data-tab]").forEach(b => b.onclick = () => tab(b.dataset.tab));
$("b-adm").innerHTML = ic("grid", 19);
$("b-adm").onclick = () => window.ADMIN.abrir();
function abrirApp(){
  xpGarante(); setTimeout(iniciaSocial, 1200);
  setTimeout(confereNovidade, 2500);
  show("v-app"); $("b-adm").hidden = true;
  if(location.hash === "#admin") history.replaceState(null, "", location.pathname);
  tab(TAB, true);
}
function tab(t, sil){
  if(TAB !== t && !sil) SOM.tap();
  TAB = t;
  $("nav").querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === (NAV_DE[t] || t)));
  TABS.forEach(([k]) => $("t-" + k).hidden = k !== t);
  atualizaTopo(); const s = streak(); $("streak-chip").classList.toggle("viva", diasTreino().has(today())); $("streak-chip").innerHTML = `${ic("flame", 15)}${s}`; $("streak-chip").title = `${s} ${s === 1 ? "dia seguido" : "dias seguidos"} ativo`;
  ({ inicio: rInicio, treinar: rTreinar, juntas: rJuntas, explorar: rExplorar, dieta: rDieta, evolucao: rEvolucao, perfil: rPerfil })[t]();
  window.scrollTo(0, 0);
}
const rerender = () => tab(TAB, true);

/* Folha (tela por cima) */
let sheetClose = null;
function sheet(title, html, onClose, extra){
  $("sheet-title").textContent = title; $("sheet-body").innerHTML = html; $("sheet-extra").innerHTML = extra || "";
  $("sheet-close").innerHTML = ic("back", 18);
  $("sheet").hidden = false; $("sheet").scrollTop = 0; document.body.style.overflow = "hidden"; sheetClose = onClose || null;
}
function fecharSheet(){ $("sheet").hidden = true; document.body.style.overflow = ""; window.BONECO.stop(); const f = sheetClose; sheetClose = null; if(f) f(); }
$("sheet-close").onclick = fecharSheet;
document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("sheet").hidden && $("play").hidden && $("cook").hidden) fecharSheet(); });
function fechaTudo(){ $("sheet").hidden = true; $("play").hidden = true; $("cook").hidden = true; document.body.style.overflow = ""; calar(); telaAcesa(false); clearInterval(PL && PL.int); PL = null; stopTimer(); }

/* ---------- INÍCIO ---------- */
function ring(val, max, size = 96, cor = "var(--accent)"){
  const r = size / 2 - 8, C = 2 * Math.PI * r, f = Math.min(1, max ? val / max : 0);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="10"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${val > max ? "var(--bad)" : cor}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - f)}"/></svg>`;
}
function semanaAtualDias(){ const d = new Date(), dow = (d.getDay() + 6) % 7, seg = addD(today(), -dow); return Array.from({ length: 7 }, (_, i) => addD(seg, i)); }
const saudacao = () => { const h = new Date().getHours(); return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; };
/* instalar como app (tela inicial do celular) */
let PEDIDO_INSTALAR = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); PEDIDO_INSTALAR = e; });
const instalado = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const navInterno = () => /FBAN|FBAV|Instagram|WhatsApp|Line\/|TikTok/i.test(navigator.userAgent);
function cardInstalar(){
  if(instalado()) return "";
  const passos = navInterno()
    ? `<p>Você abriu pelo navegador de outro app. Para instalar e manter seu login salvo, abra no ${ehIOS() ? "Safari" : "Chrome"}: toque nos <b>três pontinhos</b> e escolha <b>Abrir no navegador</b>.</p>`
    : ehIOS()
      ? `<ol class="inst-passos"><li>Toque em <b>Compartilhar</b> <span class="inst-ic">${ic("share", 15)}</span> na barra do Safari</li><li>Escolha <b>Adicionar à Tela de Início</b></li><li>Toque em <b>Adicionar</b></li></ol>`
      : PEDIDO_INSTALAR ? `<p>Um toque e o CK Life fica na sua tela inicial, como um app.</p>` : `<ol class="inst-passos"><li>Toque nos <b>três pontinhos</b> do navegador</li><li>Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b></li></ol>`;
  return `<div class="inst"><img src="img/icone-192.png" alt="" width="56" height="56" onerror="this.remove()"><div><b>Instale o CK Life no celular</b><span>Abre em tela cheia, mais rápido, e seu login fica salvo.</span></div>${passos}${PEDIDO_INSTALAR && !ehIOS() && !navInterno() ? `<button class="btn btn-accent btn-block" id="p-inst">Instalar agora</button>` : ""}</div>`;
}
/* ---------- Perfil: foto, nível e dados ---------- */
const fotoAv = (u, cls = "") => u && u.foto ? `<img class="avf ${cls}" src="${u.foto}" alt="">` : esc(((u && u.nome) || "?").trim()[0].toUpperCase());
const NIVEIS = [[0, "Começando"], [5, "Firme"], [15, "Constante"], [30, "Dedicada"], [60, "Imparável"]];
const nivelAluna = n => { let atual = NIVEIS[0], prox = null; NIVEIS.forEach((x, i) => { if(n >= x[0]){ atual = x; prox = NIVEIS[i + 1] || null; } }); return { nome: atual[1], prox, falta: prox ? prox[0] - n : 0, pct: prox ? Math.round(100 * (n - atual[0]) / (prox[0] - atual[0])) : 100 }; };
const mascaraTel = v => { const d = String(v).replace(/\D/g, "").slice(0, 11); if(d.length <= 2) return d ? `(${d}` : ""; if(d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if(d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; };
document.addEventListener("input", e => { if(e.target.matches && e.target.matches('input[inputmode="tel"]')){ const a = e.target.value, b = mascaraTel(a); if(a !== b) e.target.value = b; } });
async function escolheFoto(){
  const f = await escolheArquivo("image/*"); if(!f) return;
  if(f.size > 25 * 1024 * 1024) return toast("Foto muito grande. Escolha outra.");
  let b; try{ b = await comprimeImg(f, 900); }catch(e){ return toast("Não deu para abrir essa foto. Tente outra (JPG ou PNG)."); }
  const u = URL.createObjectURL(b), im = new Image();
  im.onload = () => { const S = 320, c = document.createElement("canvas"); c.width = c.height = S; const x = c.getContext("2d"), m = Math.min(im.width, im.height);
    x.drawImage(im, (im.width - m) / 2, Math.max(0, (im.height - m) * (im.height > im.width ? .3 : .5)), m, m, 0, 0, S, S); URL.revokeObjectURL(u);
    ME.foto = c.toDataURL("image/jpeg", .82); save(); sincFotoPerfil(); SOM.chime && SOM.chime(); vibra(15); toast("Foto do perfil atualizada"); rerender(); atualizaTopo(); };
  im.onerror = () => { URL.revokeObjectURL(u); toast("Não deu para abrir essa foto. Tente outra."); }; im.src = u;
}
function menuFoto(){
  sheet("Foto do perfil", `<div class="fotobig">${ME.foto ? `<img src="${ME.foto}" alt="">` : `<span>${esc(ME.nome.trim()[0].toUpperCase())}</span>`}</div>
    <button class="btn btn-accent btn-block btn-lg" id="ft-nova">${ic("perfil", 18)} ${ME.foto ? "Trocar foto" : "Escolher foto"}</button>
    ${ME.foto ? `<button class="btn btn-line btn-block" id="ft-tira">Remover foto</button>` : ""}
    <p class="hint" style="text-align:center;margin:0">Pode tirar uma foto agora ou escolher da galeria. Ela fica redonda e leve.</p>`);
  $("ft-nova").onclick = () => { fecharSheet(); escolheFoto(); };
  const t = $("ft-tira"); if(t) t.onclick = () => { delete ME.foto; save(); fecharSheet(); toast("Foto removida"); rPerfil(); atualizaTopo(); };
}
function editaDados(){
  const cid = DB.cidades.filter(c => c.ativa || +c.id === +ME.cidade);
  sheet("Meus dados", `<div class="formgrid">
    <div class="field full"><label for="md-n">Nome</label><input class="input" id="md-n" value="${esc(ME.nome)}" autocomplete="name"></div>
    <div class="field full"><label for="md-w">WhatsApp</label><input class="input" id="md-w" inputmode="tel" value="${esc(mascaraTel(ME.whats || ""))}" placeholder="(65) 99999-9999"></div>
    <div class="field"><label for="md-d">Nascimento</label><input class="input" id="md-d" type="date" value="${esc(ME.nasc || "")}"></div>
    <div class="field"><label for="md-c">Cidade</label><select class="input" id="md-c">${cid.map(c => `<option value="${c.id}" ${+c.id === +ME.cidade ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></div>
    <div class="field full"><label>E-mail</label><input class="input" value="${esc(ME.email)}" disabled></div></div>
    <button class="btn btn-accent btn-block btn-lg" id="md-ok">Salvar meus dados</button>`);
  $("md-ok").onclick = () => { const n = $("md-n").value.trim(); if(!n) return toast("Digite seu nome"); ME.nome = n; ME.whats = $("md-w").value.trim(); ME.nasc = $("md-d").value || ME.nasc; ME.cidade = +$("md-c").value; save(); SOM.check(); fecharSheet(); toast("Dados salvos"); rPerfil(); atualizaTopo(); };
}
function convidar(){
  const url = location.origin + location.pathname.replace(/admin\/?$/, ""), txt = "Estou treinando em casa com o CK Life 💚 Treinos guiados, receitas com voz e muito mais. Vem comigo!";
  if(navigator.share) navigator.share({ title: "CK Life", text: txt, url }).catch(() => {});
  else window.open("https://wa.me/?text=" + encodeURIComponent(txt + " " + url), "_blank", "noopener");
}
const linkSuporte = () => { const d = String(DB.config.suporte || "").replace(/\D/g, ""); return d.length >= 10 ? "https://wa.me/" + (d.length <= 11 ? "55" + d : d) + "?text=" + encodeURIComponent("Oi! Preciso de ajuda com o CK Life.") : ""; };
/* 👑 em cima da foto: só quem PAGA o Pro (teste grátis não ganha coroa). Vem do servidor (perfis.pro_ate / meu_plano), nunca do app. */
function coroaDe(u){ try{ const e = window.__ENT && window.__ENT.d;
  if(u === "eu" || (ME && u === ME.id) || (typeof NU !== "undefined" && NU.uid && u === NU.uid)){ if(e) return !!(e.pro && !e.trial); u = NU.uid; }
  const p = typeof PERFIS !== "undefined" ? PERFIS.get(u) : null; return !!(p && p.pro_ate && new Date(p.pro_ate) > new Date()); }catch(x){ return false; } }
function atualizaTopo(){ const a = $("top-av"); if(!a || !ME) return; a.innerHTML = fotoAv(ME); a.classList.toggle("cr", coroaDe("eu")); a.onclick = () => tab("perfil"); }
const DICAS_DIA = ["Beba um copo de água antes de cada refeição. Ajuda na saciedade.", "Durma de 7 a 8 horas: é no descanso que o músculo se recupera.", "Proteína em todas as refeições ajuda a manter a massa magra.", "Alongue 5 minutos depois do treino para soltar o corpo.", "Constância vence intensidade. Treinar 3x por semana já transforma.", "Prepare as marmitas no domingo e economize tempo na semana.", "Respire fundo e solte o ar na hora do esforço.", "Caminhar 20 minutos por dia já melhora o fôlego e o humor."];
const doDia = L => L[Math.floor(Date.now() / 864e5) % L.length];
const comeuAlgo = () => Object.values(ME.diario || {}).some(d => REFS.some(([k]) => (d[k] || []).length));
function passosIniciais(){
  const L = [["foto", "Coloque sua foto", !!ME.foto], ["treino", "Faça seu primeiro treino", (ME.treinos || []).length > 0], ["refeicao", "Registre uma refeição", comeuAlgo()], ["agua", "Marque um copo de água", Object.values(ME.diario || {}).some(d => d.agua > 0)], ["lembrete", "Defina seu horário de treino", !!ME.lembrete], ["app", "Instale o app no celular", instalado() || !!ME.instalouApp]];
  return { L, feitos: L.filter(x => x[2]).length };
}
function cardPassos(){
  if(ME.passosOk) return ""; const { L, feitos } = passosIniciais(); if(feitos === L.length) return "";
  return `<div class="card passos"><div class="sec-title"><h3 style="font-size:17px">Seus primeiros passos</h3><span class="muted num" style="font-size:13px">${feitos} de ${L.length}</span></div>
    <div class="prog" style="margin:10px 0 6px"><i style="width:${100 * feitos / L.length}%"></i></div>
    ${L.map(([k, n, ok]) => `<button class="passo ${ok ? "ok" : ""}" data-passo="${k}" ${ok ? "disabled" : ""}><span class="pk">${ok ? ic("check", 14, 3) : ""}</span><span>${n}</span>${ok ? "" : ic("chev", 16)}</button>`).join("")}
    <button class="link" id="ps-x" style="margin-top:6px">Esconder</button></div>`;
}
/* ---------- Lembrete de treino (calendário do celular + aviso com o app aberto) ---------- */
const DSEM = [["MO", "Seg"], ["TU", "Ter"], ["WE", "Qua"], ["TH", "Qui"], ["FR", "Sex"], ["SA", "Sáb"], ["SU", "Dom"]];
function icsLembrete(dias, hora){
  const [h, m] = hora.split(":").map(Number), d = new Date(); d.setHours(h, m, 0, 0); if(d < new Date()) d.setDate(d.getDate() + 1);
  const p2 = n => String(n).padStart(2, "0"), dt = x => `${x.getFullYear()}${p2(x.getMonth() + 1)}${p2(x.getDate())}T${p2(x.getHours())}${p2(x.getMinutes())}00`;
  const fim = new Date(d.getTime() + 30 * 6e4), url = location.origin + "/";
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CK Life//Lembrete//PT", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:cklife-treino-${Date.now()}@cklife`, `DTSTAMP:${dt(new Date())}`, `DTSTART:${dt(d)}`, `DTEND:${dt(fim)}`, `RRULE:FREQ=WEEKLY;BYDAY=${dias.join(",")}`, "SUMMARY:Hora de treinar 💚 CK Life", `DESCRIPTION:Seu treino de hoje está pronto. Abra o CK Life: ${url}`, `URL:${url}`, "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Hora de treinar no CK Life", "TRIGGER:PT0M", "END:VALARM", "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Seu treino começa em 10 minutos", "TRIGGER:-PT10M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
function editaLembrete(){
  const L = ME.lembrete || { dias: ["MO", "WE", "FR"], hora: "07:00", nav: false };
  sheet("Lembrete de treino", `<p class="lead" style="margin:0">Escolha os dias e o horário. O lembrete vai para o calendário do seu celular e avisa mesmo com o app fechado.</p>
    <div><h4 style="margin-bottom:10px">Dias</h4><div class="chips" id="lb-d">${DSEM.map(([k, n]) => `<button class="chip" data-d="${k}" aria-pressed="${L.dias.includes(k)}">${n}</button>`).join("")}</div></div>
    <div class="field"><label for="lb-h">Horário</label><input class="input" id="lb-h" type="time" value="${L.hora}"></div>
    <button class="btn btn-accent btn-block btn-lg" id="lb-ok">${ic("calendar", 18)} Adicionar ao calendário do celular</button>
    <label class="lb-nav"><input type="checkbox" id="lb-n" ${L.nav ? "checked" : ""}> Avisar também por notificação quando o app estiver aberto</label>
    <p class="hint" style="margin:0">No iPhone, toque em <b>Adicionar todos</b> depois. No Android, escolha o app de calendário e toque em <b>Salvar</b>.</p>`);
  $("lb-d").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); SOM.tap(); });
  $("lb-ok").onclick = async () => {
    const dias = [...$("lb-d").querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.d), hora = $("lb-h").value || "07:00";
    if(!dias.length) return toast("Escolha pelo menos um dia");
    ME.lembrete = { dias, hora, nav: $("lb-n").checked }; save();
    if(ME.lembrete.nav && "Notification" in window && Notification.permission === "default"){ try{ await Notification.requestPermission(); }catch(e){} }
    const blob = new Blob([icsLembrete(dias, hora)], { type: "text/calendar;charset=utf-8" }), file = new File([blob], "lembrete-ck-life.ics", { type: "text/calendar" });
    if(navigator.canShare && navigator.canShare({ files: [file] }) && /android/i.test(navigator.userAgent)) await navigator.share({ files: [file], title: "Lembrete CK Life" }).catch(() => {});
    else { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = "lembrete-ck-life.ics"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
    SOM.chime && SOM.chime(); fecharSheet(); toast("Lembrete criado. Confirme no calendário."); if(TAB === "perfil") rPerfil(); else if(TAB === "inicio") rInicio();
  };
}
// aviso com o app aberto, no horário escolhido
setInterval(() => { try{
  if(!ME || !ME.lembrete || !ME.lembrete.nav || !("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Date(), k = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][n.getDay()], hm = String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
  if(ME.lembrete.dias.includes(k) && hm === ME.lembrete.hora && ME.lembrete.ultimo !== today() && !diasTreino().has(today())){ ME.lembrete.ultimo = today(); save(); new Notification("Hora de treinar 💚", { body: "Seu treino de hoje está pronto no CK Life.", icon: "img/icone-192.png" }); }
}catch(e){} }, 30000);
/* olho para mostrar a senha em todos os campos de senha */
function ligaOlhos(raiz){ (raiz || document).querySelectorAll('input[type="password"]:not([data-olho])').forEach(inp => { inp.dataset.olho = 1; const w = document.createElement("span"); w.className = "senha-w"; inp.parentNode.insertBefore(w, inp); w.appendChild(inp); const b = document.createElement("button"); b.type = "button"; b.className = "olho"; b.setAttribute("aria-label", "Mostrar senha"); b.textContent = "Mostrar"; b.onclick = () => { const v = inp.type === "password"; inp.type = v ? "text" : "password"; b.textContent = v ? "Ocultar" : "Mostrar"; b.setAttribute("aria-label", v ? "Ocultar senha" : "Mostrar senha"); }; w.appendChild(b); }); }
new MutationObserver(() => ligaOlhos()).observe(document.body, { childList: true, subtree: true }); ligaOlhos();
function rInicio(){
  const T = treinoDoDia(), p = progAtual(), feitos = diasTreino(), hojeFeito = feitos.has(today());
  const sem = semanaAtualDias(), nSem = sem.filter(d => feitos.has(d)).length, meta = ME.perfil.dias || 3;
  const L = ME.treinos || [], min = L.reduce((a, t) => a + (t.min || 0), 0), s = streak();
  const tot = p.semanas * p.diasSem, pr = Math.min(100, Math.round(100 * ((ME.prog && ME.prog.feitos) || 0) / tot));
  const av = (DB.avisos || []).filter(a => a.ativo).slice(-1)[0], m = metas(ME), tt = totais(today()), x = dia(today()), ultimo = L.slice(-1)[0];
  const nivelN = { Iniciante: "Iniciante", "Intermediário": "Intermediário", Todos: "Todos os níveis" }[p.nivel] || p.nivel;
  const obj = objById(ME.perfil.objetivo), rd = receitaDoDia();
  $("t-inicio").innerHTML = `
    <div class="capa"><img class="capa-foto" src="img/modelo.jpg" alt="" onerror="this.remove()"><button class="avatar${coroaDe("eu") ? " cr" : ""}" id="h-av" aria-label="Perfil">${fotoAv(ME)}</button><div class="capa-tx"><span class="hi">${saudacao()}, ${esc(ME.nome.split(" ")[0])} 👋</span><h1>Vamos evoluir hoje?</h1><p>${hojeFeito ? "Treino de hoje feito. " + frase() : "Seu treino está pronto."}</p></div></div>
    ${hojeFeito ? `<div class="today done"><div><span class="eyebrow">Treino de hoje concluído</span><h2>Você está mais perto do que ontem.</h2><p>${ultimo ? `${esc(ultimo.nome)} · ${ultimo.min} min · ${int(ultimo.kcal)} kcal` : ""}</p><div class="meta" style="margin-bottom:10px"><span>${ic("flame", 14)} ${s} ${s === 1 ? "dia seguido" : "dias seguidos"}</span></div><button class="btn btn-sm" id="h-extra">Quero treinar mais</button></div></div>`
    : `<div class="today"><div><span class="eyebrow">Treino de hoje</span><h2>${esc(T.nome)}</h2><p>Semana ${semana()} de ${p.semanas}</p>
        <div class="meta"><span>${ic("clock", 14)} ${minTreino(T)} min</span><span>${ic("bolt", 14)} ${nivelN}</span><span>${ic("flame", 14)} ~${kcalTreino(T)} kcal</span></div>
        <button class="btn" id="h-go">${ic("play", 16)} Começar treino</button></div>
        <div class="hfig">${window.BONECO.thumb(exById(T.steps[0].id), "f", true)}${foto(`img/treino-${p.id}.jpg`)}</div></div>`}
    ${cardPassos()}
    <div id="xp-ini" class="xp-ini"></div>
    ${av ? `<div class="notice">${ic("speaker", 22)}<div><b>${esc(av.titulo)}</b><p>${esc(av.texto)}</p></div></div>` : ""}
    <div class="frase-dia"><span>${ic("star", 16)} Frase do dia</span><b>${esc(doDia(FRASES.concat(["Um treino de cada vez.", "Disciplina hoje, resultado amanhã.", "Seu corpo agradece cada minuto.", "Não precisa ser perfeito, precisa ser feito."])))}</b></div>
    <div><div class="sec-title"><h3>Sua evolução</h3><button class="link" id="h-evo">Ver tudo</button></div>
      <div class="evo" style="margin-top:12px">
        <div><b class="num">${L.length}</b><span>treinos realizados</span></div>
        <div><b class="num">${s}</b><span>${s === 1 ? "dia seguido" : "dias seguidos"}</span></div>
        <div><b class="num">${int(min)}</b><span>minutos treinados</span></div>
        <div><b class="num">${pr}%</b><span>do programa</span><span class="bar"><i style="width:${pr}%"></i></span></div>
      </div></div>
    <div class="card" style="padding:14px 12px">
      <div class="sec-title" style="padding:0 4px 10px"><h3 style="font-size:17px">Esta semana</h3><span class="muted num" style="font-size:14px">${nSem} de ${meta} treinos</span></div>
      <p class="meta-sem ${nSem >= meta ? "ok" : ""}">${nSem >= meta ? `${ic("trophy", 15)} Meta da semana batida! Você é demais.` : `Falta${meta - nSem === 1 ? "" : "m"} ${meta - nSem} ${meta - nSem === 1 ? "treino" : "treinos"} para bater sua meta da semana.`}</p>
      <div class="week">${sem.map(d => { const dt = new Date(d + "T12:00:00"); return `<div class="wd ${feitos.has(d) ? "done" : ""} ${d === today() ? "hoje" : ""}"><span>${DIAS_CURTO[dt.getDay()]}</span><i>${feitos.has(d) ? ic("check", 16, 3) : dt.getDate()}</i></div>`; }).join("")}</div>
    </div>
    <div><div class="sec-title"><h3>Escolha seu objetivo</h3><span class="muted" style="font-size:13px">Atual: ${obj[1]}</span></div>
      <div class="objlist" style="margin-top:12px">${OBJS.map(o => `<button data-obj="${o[0]}" aria-pressed="${o[0] === ME.perfil.objetivo}"><span class="objf"><img src="img/ex-${OBJFOTO[o[0]]}.jpg" alt="" loading="lazy" onerror="this.remove()"></span><span class="objt"><b>${o[1]}</b><small>${o[2]}</small></span>${o[0] === ME.perfil.objetivo ? `<span class="objok">${ic("check", 14, 3)}</span>` : ic("chev", 18)}</button>`).join("")}</div></div>
    <div class="sec-title"><h3>Treinos rápidos</h3><button class="link" id="h-rap">Ver todos</button></div>
    <div class="hscroll">${QUICK.map(q => { const t = treinoRapido(q); return `<button class="qcard" data-q="${q.id}"><span class="qi">${window.BONECO.thumb(exById(q.itens[0][0]), "f")}<em>${minTreino(t)} min</em></span><b>${esc(q.nome)}</b><small>${esc(q.foco)}</small></button>`; }).join("")}</div>
    <div class="sec-title"><h3>Receita do dia</h3><button class="link" id="h-card">Ver cardápio</button></div>
    <button class="rhero" id="h-rec" data-r="${rd.id}" style="--rc:${CORCAT[rd.cat]}"><span class="rhero-art">${ic(ICCAT[rd.cat], 64, 1.4)}${foto(`img/receita-${rd.id}.jpg`)}</span><span class="rhero-tx"><span class="eyebrow">${TAGN[alvoTag()]}</span><b>${esc(rd.nome)}</b><small class="num">${rd.kcal} kcal · ${rd.p} g proteína · ${rd.min} min</small><span class="btn btn-accent btn-sm" style="margin-top:10px;align-self:flex-start">${ic("chef", 16)} Cozinhar com voz</span></span></button>
    ${painelDia(tt, m, `<button class="pdia-btn" id="h-dieta">${ic("plus", 16, 2.4)} Registrar</button>`)}
    <div class="card">
      <div class="sec-title"><span style="font-weight:700">${ic("drop", 16)} Água</span><span class="muted num" style="font-size:14px">${x.agua || 0} de ${m.agua} copos</span></div>
      <div class="water">${Array.from({ length: Math.max(m.agua, x.agua || 0) }, (_, i) => `<button class="cup ${i < (x.agua || 0) ? "on" : ""}" data-cup="${i}" aria-label="Copo ${i + 1}" data-mudo></button>`).join("")}</div>
      <button class="btn btn-soft btn-sm agua-mais" id="h-agua" data-mudo>${ic("drop", 16)} + 1 copo de água</button>
    </div>
    <div class="dica-dia">${ic("leaf", 20)}<div><b>Dica do dia</b><p>${esc(doDia(DICAS_DIA))}</p></div></div>
    <div class="card"><div class="sec-title"><h3>Cupons de desconto</h3><span class="muted num">${L.length % (DB.config.treinosParaCupom || 8)}/${DB.config.treinosParaCupom || 8}</span></div>
      <p class="hint" style="margin:6px 0 10px">A cada ${DB.config.treinosParaCupom || 8} treinos você ganha um cupom numa loja parceira.</p><div class="prog"><i style="width:${100 * (L.length % (DB.config.treinosParaCupom || 8)) / (DB.config.treinosParaCupom || 8)}%"></i></div></div>
    <p class="slogan"><b>${MARCA.slogan}</b><br>${MARCA.assinatura}</p>`;
  const go = $("h-go"); if(go) go.onclick = () => iniciaTreino(T);
  const ex = $("h-extra"); if(ex) ex.onclick = () => { TV = "rapidos"; tab("treinar"); };
  $("h-av").onclick = () => tab("perfil");
  $("h-evo").onclick = () => tab("evolucao");
  $("h-rap").onclick = () => { TV = "rapidos"; tab("treinar"); };
  $("h-dieta").onclick = () => { DV = "diario"; tab("dieta"); };
  const ha = $("h-agua"); if(ha) ha.onclick = () => { x.agua = (x.agua || 0) + 1; SOM.water && SOM.water(); vibra(15); save(); toast(`${x.agua} ${x.agua === 1 ? "copo" : "copos"} hoje. Isso!`); rInicio(); };
  const psx = $("ps-x"); if(psx) psx.onclick = () => { ME.passosOk = true; save(); rInicio(); };
  $("t-inicio").querySelectorAll("[data-passo]").forEach(b => b.onclick = () => { const k = b.dataset.passo;
    if(k === "foto") menuFoto(); else if(k === "treino") iniciaTreino(treinoDoDia()); else if(k === "refeicao"){ DV = "diario"; tab("dieta"); } else if(k === "agua"){ x.agua = (x.agua || 0) + 1; SOM.water && SOM.water(); save(); rInicio(); } else if(k === "lembrete") editaLembrete(); else if(k === "app"){ tab("perfil"); setTimeout(() => { const i = document.querySelector(".inst"); if(i) i.scrollIntoView({ behavior: "smooth", block: "center" }); else { ME.instalouApp = true; save(); } }, 300); } });
  $("h-card").onclick = () => { DV = "cardapio"; tab("dieta"); };
  $("h-rec").onclick = () => abrirReceita(rd.id);
  $("t-inicio").querySelectorAll("[data-obj]").forEach(b => b.onclick = () => abrirObjetivo(b.dataset.obj));
  $("t-inicio").querySelectorAll("[data-q]").forEach(b => b.onclick = () => abrirTreinoPreview(treinoRapido(QUICK.find(q => q.id === b.dataset.q))));
  xpInicio();
  $("t-inicio").querySelectorAll("[data-cup]").forEach(b => b.onclick = () => { const i = +b.dataset.cup, antes = x.agua || 0; x.agua = antes === i + 1 ? i : i + 1; (x.agua > antes ? SOM.water : SOM.remove)(); save(); rInicio(); });
}
function abrirObjetivo(id){
  const o = objById(id), atual = ME.perfil.objetivo === id, progs = o[4].map(progById).filter((p, i, a) => a.indexOf(p) === i);
  const alvo = id === "emagrecer" ? "secar" : id === "massa" ? "massa" : "proteina", recs = receitas().filter(r => recTags(r).includes(alvo) && r.cat !== "doce").slice(0, 8);
  sheet(o[1], `
    <div class="today" style="grid-template-columns:1fr;min-height:0"><div><span class="eyebrow">Objetivo</span><h2>${o[1]}</h2><p>${o[2]}</p>
      ${atual ? `<div class="meta"><span>${ic("check", 14, 3)} Seu objetivo atual</span></div>` : `<button class="btn" id="ob-set" style="margin-top:14px">Definir como meu objetivo</button>`}</div></div>
    <div><h3 style="font-size:20px;margin-bottom:10px">Programas para ${o[1].toLowerCase()}</h3>
      ${progs.map(p => `<button class="pcard" style="--pc:${p.cor};margin-bottom:10px" data-prog="${p.id}"><div><h4>${esc(p.nome)}</h4><p>${esc(p.sub)}</p><div class="tags"><span class="tag c">${p.nivel}</span><span class="tag">${p.semanas} semanas</span><span class="tag">~${p.min} min</span></div></div><div class="pf">${window.BONECO.thumb(exById(p.dias[0].itens[0][0]), "f")}${fotoP(`img/treino-${p.id}.jpg`)}</div></button>`).join("")}</div>
    <div><h3 style="font-size:20px;margin-bottom:10px">Receitas que ajudam</h3><div class="hscroll">${recs.map(rTile).join("")}</div></div>
    <p class="slogan">${frase(id.length)}</p>`, rerender);
  $("sheet-body").querySelectorAll("[data-prog]").forEach(b => b.onclick = () => abrirPrograma(b.dataset.prog));
  $("sheet-body").querySelectorAll("[data-rec]").forEach(b => b.onclick = () => abrirReceita(b.dataset.rec));
  const st = $("ob-set"); if(st) st.onclick = () => {
    ME.perfil.objetivo = id; const novo = recomenda(ME.perfil);
    if(!ME.prog || novo !== ME.prog.id){ ME.prog = { id: novo, ini: today(), feitos: 0, fator: 0 }; ME.plano = novo; }
    ME.cardapio = {}; save(); SOM.check(); toast(`Objetivo: ${o[1]}. Plano: ${progById(novo).nome}`); abrirObjetivo(id);
  };
}
/* painel de calorias do dia: anel que se completa + macros */
let ANEL = 0;
function anel(val, max, size, esp, cores){
  const id = "an" + (++ANEL), r = size / 2 - esp / 2 - 3, C = 2 * Math.PI * r, f = Math.min(1, max ? val / max : 0), passou = max && val > max;
  const [c1, c2] = passou ? ["#FF6B5B", "#FFB199"] : cores;
  return `<svg class="anel" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="${esp}"/>
    <circle class="anel-p" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${esp}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" style="--c:${C.toFixed(1)};--o:${(C * (1 - f)).toFixed(1)}"/></svg>`;
}
function painelDia(t, m, botao, eb = "Alimentação de hoje"){
  const rest = Math.round(m.kcal - t.kcal), passou = rest < 0, pct = Math.min(100, Math.round(100 * t.kcal / (m.kcal || 1)));
  return `<div class="pdia">
    <div class="pdia-head"><div><span class="pdia-eb">${eb}</span><h3>${passou ? "Você passou da meta" : t.kcal ? `${pct}% da meta do dia` : "Registre sua primeira refeição"}</h3></div>${botao || ""}</div>
    <div class="pdia-ring">${anel(t.kcal, m.kcal, 200, 18, ["#3DDC6E", "#B9DDB2"])}
      <div class="pdia-c"><b class="num">${int(Math.abs(rest))}</b><span>${passou ? "kcal acima" : "kcal restam"}</span><small class="num">${int(t.kcal)} de ${int(m.kcal)} kcal</small></div></div>
    <div class="pdia-mac">${[["Proteína","p",["#3DDC6E","#9BE8B0"]],["Carbo","c",["#F4B740","#FFE08A"]],["Gordura","g",["#FF8A65","#FFC9B3"]]].map(([n, k, c]) => `<div><div class="mring">${anel(t[k], m[k], 76, 9, c)}<b class="num">${int(t[k])}<small>g</small></b></div><span>${n}</span><small class="num">meta ${m[k]} g</small></div>`).join("")}</div>
  </div>`;
}
function macroBars(t, m){
  return `<div class="macros">${[["Proteína","p"],["Carbo","c"],["Gordura","g"]].map(([n, k]) => `<div class="mac"><span>${n}</span><span class="tr"><i style="width:${Math.min(100, 100 * t[k] / m[k])}%"></i></span><span class="num muted">${int(t[k])}/${m[k]} g</span></div>`).join("")}</div>`;
}

/* ---------- TREINAR ---------- */
let TV = "programas", TL = "casa", EXF = { q: "", m: "", lugar: "casa" };
const thumbEx = (id, cls = "exn th") => `<span class="${cls}" aria-hidden="true">${window.BONECO.thumb(exById(id), sexoB())}</span>`;
const valTxt = s => s.modo === "t" ? `${s.val}s` : `${s.val}x`;
function rTreinar(){
  const seg = `<div class="seg" role="group">${[["programas","Programas"],["rapidos","Rápidos"],["exercicios","Exercícios"]].map(([k, n]) => `<button data-v="${k}" aria-pressed="${TV === k}">${n}</button>`).join("")}</div>`;
  let body = "";
  if(TV === "programas"){
    const atual = progAtual(), rec = recomenda(ME.perfil), L = PROGS.filter(p => p.local === TL && p.id !== atual.id).sort((a, b) => (b.id === rec) - (a.id === rec));
    const feitos = (ME.prog && ME.prog.feitos) || 0, tot = atual.semanas * atual.diasSem;
    body = `<button class="pcard on" style="--pc:${atual.cor}" data-prog="${atual.id}"><div><span class="tag c">Seu programa</span><h4 style="margin-top:10px">${esc(atual.nome)}</h4><p>Semana ${semana()} de ${atual.semanas} · ${feitos} de ${tot} treinos</p><div class="prog" style="margin-top:12px"><i style="width:${Math.min(100, 100 * feitos / tot)}%;background:${atual.cor}"></i></div></div><div class="pf">${window.BONECO.thumb(exById(atual.dias[0].itens[0][0]), sexoB())}${fotoP(`img/treino-${atual.id}.jpg`)}</div></button>
      ${L.map(p => `<button class="pcard" style="--pc:${p.cor}" data-prog="${p.id}"><div>${p.id === rec ? `<span class="tag c" style="margin-bottom:8px;display:inline-block">Recomendado para você</span>` : ""}<h4>${esc(p.nome)}</h4><p>${esc(p.sub)}</p><div class="tags"><span class="tag c">${p.nivel}</span><span class="tag">${p.semanas} semanas</span><span class="tag">~${p.min} min</span></div></div><div class="pf">${window.BONECO.thumb(exById(p.dias[0].itens[0][0]), sexoB())}${fotoP(`img/treino-${p.id}.jpg`)}</div></button>`).join("")}`;
  } else if(TV === "rapidos"){
    body = `<p class="hint" style="margin:0">Sem compromisso com o programa. Escolha e comece.</p>` + QUICK.map(q => { const t = treinoRapido(q); return `<button class="pcard" style="--pc:#2E7D5A" data-q="${q.id}"><div><h4>${esc(q.nome)}</h4><p>${new Set(q.itens.map(i => i[0])).size} exercícios · ${q.rodadas} ${q.rodadas > 1 ? "rodadas" : "rodada"}</p><div class="tags"><span class="tag c">${esc(q.foco)}</span><span class="tag">${minTreino(t)} min</span><span class="tag">~${kcalTreino(t)} kcal</span></div></div><div class="pf">${window.BONECO.thumb(exById(q.itens[0][0]), sexoB())}</div></button>`; }).join("");
  } else {
    const M = window.BONECO.MUSC, all = exercicios().filter(e => emCasa(e.id) || (DB.exercExtras || []).some(x => x.id === e.id));
    const usados = Object.keys(M).filter(m => all.some(e => window.BONECO.info(e).prim.includes(m)));
    let L = EXF.m ? all.filter(e => window.BONECO.info(e).prim.includes(EXF.m)) : all;
    if(EXF.q){ const q = norm(EXF.q); L = L.filter(e => norm(e.nome + " " + e.grupo).includes(q)); }
    body = `<div class="search">${ic("search", 18)}<input class="input" id="ex-q" placeholder="Buscar exercício" value="${esc(EXF.q)}" autocomplete="off"></div>
      <div class="chips scroll">${["", ...usados].map(g => `<button class="chip" data-g="${g}" aria-pressed="${EXF.m === g}">${g ? M[g] : "Todos os músculos"}</button>`).join("")}</div>
      <div class="list">${L.map(e => `<button class="exrow" data-ex="${e.id}">${thumbEx(e.id)}<span style="min-width:0"><b>${esc(e.nome)}</b><small>${esc(window.BONECO.info(e).prim.map(m => M[m]).join(", "))}</small><span class="tags" style="margin-top:4px"><span class="tag ${emCasa(e.id) ? "g" : ""}">${emCasa(e.id) ? esc(EQN[META[e.id].eq]) : "Academia"}</span></span></span><span class="muted">${ic("back", 16)}</span></button>`).join("") || `<div class="empty">Nenhum exercício encontrado.</div>`}</div>`;
  }
  $("t-treinar").innerHTML = capa("Treinos", "Escolha seu treino e evolua todos os dias.", "", "img/ex-desenv.jpg") + seg + body;
  $("t-treinar").querySelectorAll(".seg [data-v]").forEach(b => b.onclick = () => { TV = b.dataset.v; SOM.tap(); rTreinar(); });
  $("t-treinar").querySelectorAll("[data-prog]").forEach(b => b.onclick = () => abrirPrograma(b.dataset.prog));
  $("t-treinar").querySelectorAll("[data-l]").forEach(b => b.onclick = () => { TL = b.dataset.l; rTreinar(); });
  $("t-treinar").querySelectorAll("[data-q]").forEach(b => b.onclick = () => abrirTreinoPreview(treinoRapido(QUICK.find(q => q.id === b.dataset.q))));
  $("t-treinar").querySelectorAll("[data-ex]").forEach(b => b.onclick = () => abrirExercicio(b.dataset.ex));
  $("t-treinar").querySelectorAll("[data-lug]").forEach(b => b.onclick = () => { EXF.lugar = b.dataset.lug; EXF.m = ""; rTreinar(); });
  $("t-treinar").querySelectorAll("[data-g]").forEach(b => b.onclick = () => { EXF.m = b.dataset.g; rTreinar(); });
  const iq = $("ex-q"); if(iq){ let tq; iq.oninput = e => { clearTimeout(tq); tq = setTimeout(() => { EXF.q = e.target.value; rTreinar(); const i = $("ex-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); }; }
  $("t-treinar").querySelectorAll(".exrow svg").forEach(s => { if(s.closest(".muted")) s.style.transform = "rotate(180deg)"; });
}
const phero = (src, eyebrow, titulo, desc, chips) => `<div class="phero"><img src="${src}" alt="" onerror="this.remove()"><div class="phero-tx">${eyebrow ? `<span class="phero-eb">${eyebrow}</span>` : ""}<h2>${titulo}</h2>${desc ? `<p>${desc}</p>` : ""}${chips && chips.length ? `<div class="phero-chips">${chips.map(c => `<span>${c}</span>`).join("")}</div>` : ""}</div></div>`;
function abrirPrograma(id){
  const p = progById(id), atual = ME.prog && ME.prog.id === id, sem = atual ? semana() : 1, prox = atual ? diaAtual() : 0;
  sheet(p.nome, `
    ${phero(`img/treino-${p.id}.jpg`, esc(p.nivel), esc(p.nome), esc(p.desc), [`${ic("calendar", 14)} ${p.semanas} semanas`, `${ic("repeat", 14)} ${p.diasSem}x por semana`, `${ic("clock", 14)} ~${p.min} min`])}
    ${atual ? `<div class="card"><div class="sec-title"><h3>Seu progresso</h3><span class="muted num">Semana ${sem} de ${p.semanas}</span></div><div class="prog" style="margin-top:12px"><i style="width:${Math.min(100, 100 * (ME.prog.feitos || 0) / (p.semanas * p.diasSem))}%"></i></div><p class="hint" style="margin:10px 0 0">A cada semana as repetições e o tempo aumentam um pouco. Ao terminar um treino, diga se foi fácil ou difícil e o app ajusta.</p></div>` : ""}
    <div><h3 style="font-size:20px;margin-bottom:6px">Treinos</h3><div class="card" style="padding:4px 16px">${p.dias.map((d, i) => { const t = montaTreino(d, sem, {}); return `<button class="dayrow ${atual && i === prox ? "next" : ""}" data-d="${i}"><span class="dn">${i + 1}</span><span style="min-width:0"><b>${esc(d.nome)}</b><small>${minTreino(t)} min · ${new Set(d.itens.map(x => x[0])).size} exercícios${atual && i === prox ? " · próximo" : ""}</small></span><span class="muted">${ic("chev", 16)}</span></button>`; }).join("")}</div></div>
    ${atual ? `<button class="btn btn-accent btn-block btn-lg" id="pg-go">${ic("play", 16)} Treinar agora</button>` : `<button class="btn btn-accent btn-block btn-lg" id="pg-set">Começar este programa</button>`}`, () => { if(TAB === "treinar") rTreinar(); else if(TAB === "inicio") rInicio(); });
  $("sheet-body").querySelectorAll("[data-d]").forEach(b => b.onclick = () => abrirTreinoPreview(montaTreino(p.dias[+b.dataset.d], sem, { prog: p.id, di: +b.dataset.d, sem, cor: p.cor, sub: p.nome })));
  const go = $("pg-go"); if(go) go.onclick = () => { fecharSheet(); iniciaTreino(treinoDoDia()); };
  const st = $("pg-set"); if(st) st.onclick = () => { ME.prog = { id, ini: today(), feitos: 0, fator: 0 }; ME.plano = id; save(); SOM.check(); toast("Programa escolhido. Bora!"); fecharSheet(); };
}
function abrirTreinoPreview(T){
  const ids = [...new Set(T.steps.map(s => s.id))], first = T.steps.filter((s, i) => T.steps.findIndex(x => x.id === s.id) === i);
  const rod = T.steps[0].rodadas, ser = T.steps.some(s => s.series > 1);
  sheet(T.nome, `
    ${phero(window.BONECO.fotoDe(exById(ids[0])), esc(T.sub || "Treino"), esc(T.nome), "", [`${ic("clock", 14)} ${minTreino(T)} min`, `${ic("flame", 14)} ~${kcalTreino(T)} kcal`, ...(rod > 1 ? [`${ic("repeat", 14)} ${rod} rodadas`] : [])])}
    <div><h3 style="font-size:20px;margin-bottom:8px">${ids.length} exercícios${rod > 1 ? `, repetidos ${rod} vezes` : ""}</h3>
      <div class="list">${first.map(s => { const e = exById(s.id); return `<button class="exrow" data-ex="${s.id}">${thumbEx(s.id)}<span style="min-width:0"><b>${esc(e.nome)}</b><small>${ser ? `${s.series} séries · ` : ""}descanso ${s.desc || 0}s</small></span><span class="sr num">${valTxt(s)}<small>${s.modo === "t" ? "TEMPO" : "REPS"}</small></span></button>`; }).join("")}</div></div>
    <p class="hint" style="margin:0">Toque num exercício para ver como fazer antes de começar.</p>
    <button class="btn btn-accent btn-block btn-lg" id="tp-go">${ic("play", 16)} Começar treino</button>`);
  $("sheet-body").querySelectorAll("[data-ex]").forEach(b => b.onclick = () => abrirExercicio(b.dataset.ex, null, () => abrirTreinoPreview(T)));
  $("tp-go").onclick = () => { fecharSheet(); iniciaTreino(T); };
}

/* Página do exercício com a foto da Maya */
let RITMO = false;
function howto(e, x){
  const inf = window.BONECO.info(e), M = window.BONECO.MUSC;
  const dica = (e.passos[2] || e.passos[e.passos.length - 1] || "");
  return `<div class="howto">
    <div class="player">
      <div class="stage-wrap foto"><div class="stage" id="bn-stage"></div><span class="cue" id="bn-cue"></span><span class="rep num" id="bn-rep"></span></div>
      <div class="pl-ctrl">
        <button class="btn btn-soft btn-sm" id="bn-play" data-mudo>Pausar dicas</button>
        <button class="btn btn-line btn-sm" id="bn-ritmo" data-mudo>Ritmo com som</button>
      </div>
    </div>
    <div class="mus-list">${inf.prim.map(m => `<span class="mchip p"><i></i>${M[m]}</span>`).join("")}${inf.sec.map(m => `<span class="mchip"><i></i>${M[m]}</span>`).join("")}</div>
    ${x ? `<div class="exmeta"><span>${ic("repeat", 16)} ${x.series || 1} x ${esc(x.val)} ${x.modo === "t" ? "segundos" : "repetições"}</span><span>${ic("clock", 16)} Descanso: ${x.desc || 0}s</span></div>` : ""}
    <div class="dica"><span class="fx-mini">${window.BONECO.thumb(e)}</span><span><b>Dica do movimento</b><small>${esc(dica)}</small></span></div>
    <div><h4>Como fazer</h4><ol class="steps" style="margin-top:12px">${e.passos.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ol></div>
    ${e.erros.length ? `<div><h4>Erros comuns</h4><ul class="ing errs" style="margin-top:8px">${e.erros.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ul></div>` : ""}
    <div><h4>Respiração</h4><p style="margin:6px 0 0">${esc(e.resp)}</p></div>
    <div class="tags"><span class="tag g">${window.BONECO.modalidade(e.id)}</span><span class="tag">${esc(e.grupo)}</span><span class="tag">${esc(e.equip)}</span></div>
    <button class="btn btn-soft btn-block" id="bn-ouvir">${ic("speaker", 18)} Ouvir a explicação</button>
    <a class="yt" href="${yt(e.nome + " execução correta")}" target="_blank" rel="noopener"><span class="ytp">${ic("play", 16)}</span><span><strong>Ver vídeo da execução</strong><span>Abre a busca no YouTube</span></span></a>
  </div>`;
}
function bindPlayer(e){
  const host = $("bn-stage"); if(!host) return;
  const reduz = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pl = window.BONECO.mount(host, e, { paused: reduz,
    onFrame: f => { const c = $("bn-cue"), r = $("bn-rep"); if(c && c.textContent !== f.cue) c.textContent = f.cue; if(r) r.textContent = "Repetição " + f.rep; },
    onBeat: h => { if(RITMO) (h ? SOM.beat2 : SOM.beat)(); } });
  const bp = $("bn-play"); bp.textContent = pl.playing ? "Pausar dicas" : "Mostrar dicas";
  bp.onclick = () => { bp.textContent = pl.toggle() ? "Pausar dicas" : "Continuar dicas"; };
  const br = $("bn-ritmo"), pr = () => br.textContent = RITMO ? "Ritmo: ligado" : "Ritmo com som"; pr();
  br.onclick = () => { RITMO = !RITMO; pr(); if(RITMO) SOM.beat(); };
  const ou = $("bn-ouvir"); if(ou) ou.onclick = () => falar(`${e.nome}. ${e.passos.join(". ")}. Respiração: ${e.resp}`);
}
function abrirExercicio(id, x, voltar){ const e = exById(id); sheet(e.nome, howto(e, x), voltar ? () => setTimeout(voltar, 0) : null); bindPlayer(e); }

/* ---------- Treino guiado ---------- */
let PL = null;
const sorteia = L => L[Math.floor(Math.random() * L.length)];
const FR_METADE = ["Metade do treino! Você está indo muito bem.", "Já passou da metade. Continua firme!", "Metade feita. Respira e segue!"];
const FR_ULTIMO = ["Último exercício. Capricha!", "Último! Dá tudo agora.", "Último exercício, você consegue!"];
const FR_META = ["Terminou as repetições? Toque em concluí.", "Fez todas? É só tocar em concluí.", "Quando terminar, toque em concluí."];
function iniciaTreino(T){
  if(!T || !T.steps.length) return;
  window.BONECO.stop(); calar();
  PL = { T, i: 0, fase: "prep", rem: 5, ini: Date.now(), pausa: false, kcal: 0, ativo: 0, feitos: new Set(), int: null };
  $("play").hidden = false; document.body.style.overflow = "hidden"; telaAcesa(true);
  SOM.restStart();
  falar(`Vamos lá! Prepare-se. Primeiro exercício: ${exById(T.steps[0].id).nome}.`);
  desenhaPlay(); relogio();
}
function relogio(){
  clearInterval(PL.int);
  PL.int = setInterval(() => {
    if(!PL || PL.pausa) return;
    const s = PL.T.steps[PL.i];
    if(PL.fase === "ex"){ PL.ativo++; PL.kcal += kcalDe(s, 1); }
    if(PL.fase === "ex" && s.modo === "r"){ atualizaPlay(); return; }
    PL.rem--;
    if(PL.rem <= 3 && PL.rem > 0){ SOM.tick(); if(PL.fase !== "ex") vibra(40); }
    if(PL.fase === "ex" && s.modo === "t" && PL.rem === Math.floor(s.val / 2) && s.val >= 30) falar("Metade. Continue!");
    if(PL.fase === "ex" && s.modo === "t" && PL.rem === 10 && s.val >= 25) falar("Faltam 10 segundos!");
    if(PL.fase === "rest" && PL.rem === 5) falar("Prepare-se.");
    if(PL.rem <= 0){ proximaFase(); return; }
    atualizaPlay();
  }, 1000);
}
function comecaExercicio(){
  const s = PL.T.steps[PL.i], e = exById(s.id);
  PL.fase = "ex"; PL.rem = s.modo === "t" ? s.val : 0;
  SOM.bell(); vibra(120);
  const n = PL.T.steps.length, extra = PL.i === n - 1 && n > 2 ? sorteia(FR_ULTIMO) + " " : PL.i === Math.floor(n / 2) && n > 5 ? sorteia(FR_METADE) + " " : "";
  falar(extra + (s.modo === "t" ? `${e.nome}. ${s.val} segundos. Vai!` : `${e.nome}. ${s.val} repetições, no seu ritmo.`));
  desenhaPlay();
}
function proximaFase(){
  if(PL.fase === "prep"){ comecaExercicio(); return; }
  if(PL.fase === "ex"){
    PL.feitos.add(PL.i); SOM.check();
    const s = PL.T.steps[PL.i];
    if(PL.i >= PL.T.steps.length - 1){ fimTreino(); return; }
    if(s.desc > 0){ PL.fase = "rest"; PL.rem = s.desc; const nx = PL.T.steps[PL.i + 1]; SOM.restStart(); falar(`Descanse. Próximo: ${exById(nx.id).nome}.`); desenhaPlay(); }
    else { PL.i++; comecaExercicio(); }
    return;
  }
  if(PL.fase === "rest"){ PL.i++; comecaExercicio(); }
}
function segsHtml(){ return `<div class="segs">${PL.T.steps.map((_, k) => `<i class="${PL.feitos.has(k) ? "f" : k === PL.i && PL.fase === "ex" ? "c" : ""}"></i>`).join("")}</div>`; }
const mmss = n => { n = Math.max(0, n | 0); return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0"); };
function desenhaPlay(){
  const T = PL.T, s = T.steps[PL.i], e = exById(s.id), nx = T.steps[PL.i + 1];
  window.BONECO.stop();
  const head = `<div class="phd"><button class="iconbtn" id="pl-x" aria-label="Sair do treino">${ic("close", 20)}</button>${segsHtml()}<span class="num pcount"><span id="pl-tt">${mmss(Math.round((Date.now() - PL.ini) / 1000))}</span> · ${PL.i + 1}/${T.steps.length}</span></div>`;
  const etapa = s.rodadas > 1 ? `Rodada ${s.rodada} de ${s.rodadas}` : s.series > 1 ? `Série ${s.serie} de ${s.series}` : "";
  if(PL.fase === "fim") return;
  if(PL.fase === "prep" || PL.fase === "rest"){
    const alvo = PL.fase === "prep" ? s : nx, ea = exById(alvo.id);
    PL.tot = PL.rem;
    $("play").innerHTML = head + `<div class="pc"><div class="rest">
      <h2 class="rest-t">${PL.fase === "prep" ? "Prepare-se" : "Descanso"}</h2>
      <div class="tring" id="pl-ring" style="--p:0"><div><b class="num" id="pl-t">${mmss(PL.rem)}</b><small>${PL.fase === "prep" ? "para começar" : "para voltar"}</small></div></div>
      <p class="rest-sub">${PL.fase === "prep" ? "Posicione-se. O sino avisa quando começar." : "Respire fundo. Prepare-se para o próximo exercício."}</p>
      <div class="nx"><span class="exn th">${window.BONECO.thumb(ea)}</span><span><small>${PL.fase === "prep" ? "Primeiro exercício" : "Próximo exercício"}</small><b>${esc(ea.nome)}</b><small>${alvo.series > 1 ? alvo.series + " x " : ""}${alvo.modo === "t" ? `${alvo.val} segundos` : `${alvo.val} repetições`}${alvo.rodadas > 1 ? ` · rodada ${alvo.rodada}` : ""}</small></span></div>
      <button class="btn btn-line btn-block" id="pl-pula">${PL.fase === "prep" ? "Começar já" : "Pular descanso"}</button>
      ${PL.fase === "rest" ? `<button class="link" id="pl-mais" data-mudo>+20 segundos</button>` : ""}
    </div></div>`;
    const mais = $("pl-mais"); if(mais) mais.onclick = () => { PL.rem += 20; PL.tot += 20; SOM.tap(); atualizaPlay(); };
    $("pl-pula").onclick = () => proximaFase();
  } else {
    const musc = window.BONECO.info(e).prim.map(m => window.BONECO.MUSC[m]).join(", ");
    $("play").innerHTML = `<div class="pfull"><div class="stage" id="pl-stage"></div><div class="pgrad"></div>${head}
      <div class="pbot">
        <span class="pcue" id="pl-cue"></span>
        <h2>${esc(e.nome)}</h2><small class="psub">${s.series > 1 ? s.series + " x " : ""}${s.modo === "t" ? s.val + " segundos" : s.val + " repetições"}${etapa ? " · " + etapa : ""} · ${esc(musc)}</small>
        ${s.modo === "t"
          ? `<div class="pnum num" id="pl-big">${mmss(PL.rem)}</div><div class="pprog"><i id="pl-prog" style="width:${100 * (1 - PL.rem / s.val)}%"></i></div>`
          : `<div class="pnum num"><span id="pl-rep">1</span><em>/${s.val}</em></div><div class="pprog"><i id="pl-prog" style="width:0%"></i></div>`}
        <div class="pbar"><button class="iconbtn" id="pl-prev" aria-label="Exercício anterior" ${PL.i === 0 ? "disabled" : ""}>${ic("prev", 22)}</button>
          ${s.modo === "t" ? `<button class="pmain" id="pl-main" data-mudo aria-label="${PL.pausa ? "Continuar" : "Pausar"}">${PL.pausa ? ic("play", 30) : ic("pause", 30)}</button>` : `<button class="pmain ok" id="pl-main" data-mudo aria-label="Concluí">${ic("check", 30, 3)}</button>`}
          <button class="iconbtn" id="pl-next" aria-label="Pular exercício">${ic("next", 22)}</button></div>
        ${s.modo === "r" ? `<p class="phint">Toque no ✓ quando terminar as ${s.val} repetições</p>` : ""}
        ${nx ? `<p class="pnext">A seguir: <b>${esc(exById(nx.id).nome)}</b></p>` : `<p class="pnext">Último exercício 💪</p>`}
      </div></div>`;
    window.BONECO.mount($("pl-stage"), e, { paused: PL.pausa, onFrame: f => {
      const c = $("pl-cue"); if(c && c.textContent !== f.cue) c.textContent = f.cue;
      if(s.modo === "r"){ const n = Math.min(f.rep, s.val), r = $("pl-rep"), pg = $("pl-prog"); if(r && r.textContent !== String(n)){ r.textContent = n; if(pg) pg.style.width = (100 * n / s.val) + "%"; if(f.rep === s.val + 1 && !PL.avisou){ PL.avisou = true; SOM.chime && SOM.chime(); vibra(60); falar(sorteia(FR_META)); $("pl-main").classList.add("pulsa"); } } }
    } });
    PL.avisou = false;
    $("pl-main").onclick = () => { if(s.modo === "r"){ proximaFase(); return; } PL.pausa = !PL.pausa; SOM.tap(); if(PL.pausa) falar("Pausado."); desenhaPlay(); };
    $("pl-prev").onclick = () => { if(PL.i > 0){ PL.i--; comecaExercicio(); } };
    $("pl-next").onclick = () => proximaFase();
  }
  $("pl-x").onclick = sairTreino;
}
function atualizaPlay(){
  const s = PL.T.steps[PL.i];
  const tt = $("pl-tt"); if(tt) tt.textContent = mmss(Math.round((Date.now() - PL.ini) / 1000));
  const rg = $("pl-ring"); if(rg) rg.classList.toggle("fim", PL.rem <= 5);
  const t = $("pl-t"); if(t){ t.textContent = mmss(PL.rem); const r = $("pl-ring"); if(r && PL.tot) r.style.setProperty("--p", (100 * (1 - PL.rem / PL.tot)).toFixed(1)); }
  const b = $("pl-big"); if(b && s.modo === "t"){ b.textContent = mmss(PL.rem); const pg = $("pl-prog"); if(pg) pg.style.width = (100 * (1 - PL.rem / s.val)) + "%"; }
  const c = document.querySelector(".segs i.c"); if(c && s.modo === "t") c.style.setProperty("--p", (100 * (1 - PL.rem / s.val)) + "%");
}
function sairTreino(){
  if(PL.feitos.size === 0){ fimPlay(); return; }
  PL.pausa = true;
  const box = document.createElement("div"); box.className = "rest"; box.style.cssText = "position:absolute;inset:0;background:rgba(5,5,5,.94);z-index:3;padding:24px";
  box.innerHTML = `<h2 style="font-size:30px;color:#fff">Encerrar o treino?</h2><p style="color:#8B9690;margin:0">Você já fez ${PL.feitos.size} de ${PL.T.steps.length} exercícios.</p>
    <button class="btn btn-accent btn-lg" id="sx-salvar" style="width:100%;max-width:360px">Salvar o que fiz e sair</button><button class="btn btn-line" id="sx-sair" style="width:100%;max-width:360px">Sair sem salvar</button><button class="link" id="sx-volta">Voltar ao treino</button>`;
  $("play").appendChild(box);
  $("sx-salvar").onclick = () => fimTreino(true);
  $("sx-sair").onclick = fimPlay;
  $("sx-volta").onclick = () => { box.remove(); PL.pausa = false; };
}
function fimPlay(){ clearInterval(PL && PL.int); PL = null; window.BONECO.stop(); calar(); telaAcesa(false); $("play").hidden = true; document.body.style.overflow = ""; rerender(); }
/* cartão de conquista em formato de story (1080x1920) */
function carregaImg(src){ return new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; }); }
async function cartaoConquista(o){
  const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  try{ await document.fonts.load("800 90px 'Bricolage Grotesque'"); }catch(e){}
  const F1 = "'Bricolage Grotesque','Avenir Next',system-ui,sans-serif", F2 = "Figtree,system-ui,sans-serif";
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0E3D32"); g.addColorStop(1, "#061813"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const foto = await carregaImg(window.BONECO.fotoDe(exById(o.T.steps[0].id)));
  if(foto){ const fh = H * .66, k = Math.max(W / foto.width, fh / foto.height), fw = foto.width * k, fhh = foto.height * k; x.drawImage(foto, (W - fw) / 2, Math.min(0, (fh - fhh) * .25), fw, fhh); }
  const sh = x.createLinearGradient(0, H * .28, 0, H * .72); sh.addColorStop(0, "rgba(6,24,19,0)"); sh.addColorStop(1, "rgba(6,24,19,1)"); x.fillStyle = sh; x.fillRect(0, 0, W, H * .72 + 2); x.fillStyle = "#061813"; x.fillRect(0, H * .72, W, H * .28);
  const top = x.createLinearGradient(0, 0, 0, 260); top.addColorStop(0, "rgba(6,24,19,.65)"); top.addColorStop(1, "rgba(6,24,19,0)"); x.fillStyle = top; x.fillRect(0, 0, W, 260);
  const ico = await carregaImg("img/icone-192.png"); if(ico){ x.save(); x.beginPath(); x.roundRect ? x.roundRect(80, 86, 110, 110, 28) : x.rect(80, 86, 110, 110); x.clip(); x.drawImage(ico, 80, 86, 110, 110); x.restore(); }
  x.fillStyle = "#fff"; x.font = `800 64px ${F1}`; x.fillText("CK", ico ? 214 : 80, 160); const ckw = x.measureText("CK ").width; x.fillStyle = "#B9DDB2"; x.fillText("Life", (ico ? 214 : 80) + ckw, 160);
  let y = 1180;
  x.fillStyle = "#3DDC6E"; x.font = `800 40px ${F2}`; x.fillText(o.parcial ? "TREINO SALVO" : "TREINO CONCLUÍDO", 80, y); y += 100;
  // nome do treino: diminui a letra até caber na largura
  x.fillStyle = "#fff"; let fs = 110; do { x.font = `800 ${fs}px ${F1}`; fs -= 4; } while(x.measureText(o.T.nome).width > W - 160 && fs > 56); x.fillText(o.T.nome, 80, y); y += 76;
  x.fillStyle = "rgba(255,255,255,.78)"; x.font = `600 42px ${F2}`; x.fillText(`${o.nome} mandou bem hoje 💪`, 80, y); y += 90;
  const box = (bx, v, l) => { x.fillStyle = "rgba(255,255,255,.09)"; x.beginPath(); x.roundRect ? x.roundRect(bx, y, 290, 210, 36) : x.rect(bx, y, 290, 210); x.fill(); x.fillStyle = "#fff"; x.font = `800 84px ${F1}`; x.fillText(v, bx + 36, y + 112); x.fillStyle = "#B9DDB2"; x.font = `700 34px ${F2}`; x.fillText(l, bx + 36, y + 168); };
  box(80, String(o.min), "minutos"); box(395, String(o.kcal), "kcal"); box(710, String(o.dias), o.dias === 1 ? "dia seguido" : "dias seguidos");
  y += 300;
  x.fillStyle = "rgba(255,255,255,.55)"; x.font = `600 36px ${F2}`; x.fillText(new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }), 80, y);
  x.fillStyle = "#B9DDB2"; x.font = `700 40px ${F2}`; x.fillText("Sua evolução, todos os dias.", 80, H - 120);
  return new Promise(ok => c.toBlob(ok, "image/jpeg", .9));
}
function confete(alvo){
  if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.className = "confete"; alvo.appendChild(c); const x = c.getContext("2d"), W = c.width = alvo.clientWidth, H = c.height = alvo.clientHeight;
  const cores = ["#3DDC6E", "#B9DDB2", "#FFD166", "#F4A62A", "#FFFFFF", "#7BA77A"], P = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3.5, r: 4 + Math.random() * 5, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: cores[Math.floor(Math.random() * cores.length)] }));
  let t0 = performance.now();
  const f = now => { const dt = Math.min(2, (now - t0) / 16); t0 = now; x.clearRect(0, 0, W, H); let vivos = 0; P.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .04 * dt; p.a += p.va * dt; if(p.y < H + 20){ vivos++; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * .66); x.restore(); } }); if(vivos && c.isConnected) requestAnimationFrame(f); else c.remove(); };
  requestAnimationFrame(f);
}
function fimTreino(parcial){
  clearInterval(PL.int); window.BONECO.stop(); PL.fase = "fim";
  const T = PL.T, min = Math.max(1, Math.round((Date.now() - PL.ini) / 60000)), kcal = Math.round(PL.kcal), antes = medalhas().filter(m => m.ok).map(m => m.id);
  ME.treinos = ME.treinos || [];
  ME.treinos.push({ d: today(), h: new Date().getHours(), nome: T.nome, prog: T.prog || null, plano: T.prog || null, dia: T.di, rapido: T.rapido || null, min, kcal, exs: PL.feitos.size, parcial: !!parcial });
  if(T.prog && ME.prog && T.prog === ME.prog.id && !parcial) ME.prog.feitos = (ME.prog.feitos || 0) + 1;
  const meta = DB.config.treinosParaCupom || 8; let ganhou = null;
  if(ME.treinos.length % meta === 0) ganhou = darCupom();
  save();
  setTimeout(() => { try{ checaConquistas(); }catch(e){ console.warn(e); } }, 1600);
  const novas = medalhas().filter(m => m.ok && !antes.includes(m.id));
  const recorde = !parcial && ME.treinos.length > 2 && min >= Math.max(...ME.treinos.slice(0, -1).map(t => t.min || 0)) && min > 0;
  SOM.done(); vibra([100, 60, 100]);
  falar(parcial ? "Treino salvo. Cada minuto conta!" : `Treino concluído! Parabéns, ${ME.nome.split(" ")[0]}. Você está mais perto do que ontem.`);
  if(ganhou || novas.length) setTimeout(SOM.coupon, 1100);
  $("play").innerHTML = `<div class="pc" style="overflow-y:auto;padding-top:20px"><div class="done-hero">
    <div class="medalbig">${ic("trophy", 54, 1.8)}</div>
    <h2 style="font-size:34px;color:#fff;margin-top:8px">${parcial ? "Treino salvo" : "Treino concluído!"}</h2><p style="color:#E6EFE4;margin:0">Parabéns! Você deu mais um passo para a sua melhor versão.</p>${recorde ? `<div class="recorde">${ic("trophy", 16)} Seu treino mais longo até hoje!</div>` : ""}<p style="color:#B9DDB2;margin:0;font-weight:700">${frase(min)}</p>
    <p style="color:#8B9690;margin:0">${esc(T.nome)}</p>
    <div class="done-stats"><div>${ic("clock", 22)}<span><b class="num">${min} min</b><small>Tempo total</small></span></div><div>${ic("flame", 22)}<span><b class="num">${kcal}</b><small>Calorias gastas</small></span></div><div>${ic("treinar", 22)}<span><b class="num">${PL.feitos.size}</b><small>Exercícios</small></span></div><div>${ic("trophy", 22)}<span><b class="num">${Math.round(100 * PL.feitos.size / T.steps.length)}%</b><small>Concluído</small></span></div></div>
    <p style="color:#B9DDB2;margin:0;font-weight:700">${streak()} ${streak() === 1 ? "dia seguido" : "dias seguidos"} treinando</p>
    ${novas.map(m => `<div class="nx" style="max-width:none">${`<span class="exn" style="background:radial-gradient(circle at 30% 30%,#FFE08A,#FFB23F);color:#3a2200;width:56px;height:56px;border-radius:50%">${ic(m.ic, 26)}</span>`}<span><b>Nova conquista: ${esc(m.nome)}</b><small>${esc(m.desc)}</small></span></div>`).join("")}
    ${ganhou ? `<div class="coupon" style="width:100%;border-color:#3DDC6E"><b>Você ganhou um cupom!</b><span>${ganhou.desconto}% na ${esc(ganhou.loja)}</span><span class="code">${ganhou.codigo}</span></div>` : ""}
    ${parcial ? "" : `<p style="color:#cfd6d2;margin:10px 0 0;font-weight:600">Como foi o treino?</p><div class="rate"><button data-r="-1">Fácil</button><button data-r="0" aria-pressed="true">Na medida</button><button data-r="1">Difícil</button></div>`}
    <button class="btn btn-accent btn-lg btn-block" id="fim-ok" style="margin-top:8px">Ver minha evolução</button><button class="btn btn-share btn-block" id="fim-share">${ic("share", 18)} Enviar cartão (WhatsApp, Instagram)</button><button class="btn btn-share btn-block" id="fim-post">${ic("juntas", 18)} Postar na comunidade</button><button class="btn btn-line btn-block" id="fim-out">Fazer outro treino</button>
  </div></div>`;
  if(!parcial) confete($("play"));
  let rate = 0;
  $("play").querySelectorAll("[data-r]").forEach(b => b.onclick = () => { rate = +b.dataset.r; $("play").querySelectorAll("[data-r]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  const sai = dest => {
    if(ME.prog && T.prog === ME.prog.id && rate && pode("adaptacao_treino")){ ME.prog.fator = Math.max(-.3, Math.min(.5, (ME.prog.fator || 0) + (rate < 0 ? .1 : -.1))); save(); toast(rate < 0 ? "Vamos aumentar um pouco no próximo treino" : "Vamos pegar mais leve no próximo treino"); }
    fimPlay(); tab(dest);
  };
  $("fim-ok").onclick = () => sai(parcial ? "inicio" : "evolucao");
  $("fim-post").onclick = async () => { const b = $("fim-post"); b.classList.add("carregando"); b.disabled = true; let blob = null; try{ blob = await comprimeImg(await blobParaURL(await cartaoConquista({ T, min, kcal, dias: streak(), nome: ME.nome.split(" ")[0], parcial })), 1080); }catch(e){} b.classList.remove("carregando"); b.disabled = false; sai("juntas"); setTimeout(() => abreComposer(`Treino concluído: ${T.nome} em ${min} min 💪`, blob), 350); };
  $("fim-share").onclick = async () => {
    const b = $("fim-share"); b.classList.add("carregando"); b.disabled = true;
    try{
      const blob = await cartaoConquista({ T, min, kcal, dias: streak(), nome: ME.nome.split(" ")[0], parcial });
      const file = new File([blob], "ck-life-treino.jpg", { type: "image/jpeg" });
      if(navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: "Mais um treino feito no CK Life 💚" }).catch(() => {});
      else { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = "ck-life-treino.jpg"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); toast("Imagem salva. Poste nos stories!"); }
      SOM.chime && SOM.chime();
    }catch(e){ console.warn(e); toast("Não deu para criar a imagem agora."); }
    b.classList.remove("carregando"); b.disabled = false;
  };
  $("fim-out").onclick = () => sai("treinar");
}
function darCupom(){
  const ps = (DB.parceiros || []).filter(p => p.ativo && (!p.validade || p.validade >= today()));
  if(!ps.length) return null;
  const pref = ps.filter(p => +p.cidade === +ME.cidade), L = pref.length ? pref : ps, p = L[Math.floor(Math.random() * L.length)];
  const c = { id: uid(), parc: p.id, user: ME.id, codigo: "FV" + Math.random().toString(36).slice(2, 7).toUpperCase(), d: today(), usado: false, usadoEm: "" };
  DB.cupons.push(c);
  return { codigo: c.codigo, loja: p.nome, desconto: p.desconto };
}

/* ---------- NUTRIÇÃO ---------- */
let DV = "receitas", DD = today(), RF = { q: "", cat: "", tag: "", fav: false, n: 30 }, RV = "home";
const gf = f => f;
const CORCAT = { cafe: "#C99A45", almoco: "#2E7D5A", salada: "#7BA77A", sopa: "#C47A55", lanche: "#7E8FB8", doce: "#B9667E" };
const ICCAT = { cafe: "cup", almoco: "bowl", salada: "leaf", sopa: "chef", lanche: "dieta", doce: "cake" };
const recTags = r => { const t = [], pr = r.p * 4 / Math.max(1, r.kcal); if(r.cat !== "doce" && r.kcal <= 330 && pr >= .2) t.push("secar"); if(r.p >= 25 || (r.kcal >= 380 && r.p >= 18)) t.push("massa"); if(pr >= .3) t.push("proteina"); if(r.min <= 15) t.push("rapida"); return t; };
const TAGN = { secar: "Para perder gordura", massa: "Para ganhar massa", proteina: "Rica em proteína", rapida: "Pronta em 15 min" };
const alvoTag = () => { const o = ME.perfil && ME.perfil.objetivo; return ["perder","emagrecer"].includes(o) ? "secar" : ["forca","massa"].includes(o) ? "massa" : "proteina"; };
const seedDia = (d, k = 0) => { let h = 7 + k * 131; for(const c of d) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; };
function receitaDoDia(){ const L = receitas().filter(r => recTags(r).includes(alvoTag()) && r.cat !== "doce"); return L[seedDia(today()) % L.length] || receitas()[0]; }
const rArt = (r, big) => `<span class="rart" style="--rc:${CORCAT[r.cat] || "#2E7D5A"}">${ic(ICCAT[r.cat] || "dieta", big ? 44 : 30, 1.6)}${fotoP(`img/receita-${r.id}.jpg`)}<em class="num">${r.kcal} kcal</em></span>`;
const rTile = r => `<button class="rtile" data-rec="${r.id}">${rArt(r)}<b>${esc(r.nome)}</b><small class="num">${r.p} g proteína · ${r.min} min</small></button>`;
const rCard = r => `<button class="rcard" data-rec="${r.id}"><span class="rthumb" style="--rc:${CORCAT[r.cat]}">${ic(ICCAT[r.cat] || "dieta", 26, 1.7)}${fotoP(`img/receita-${r.id}.jpg`)}</span><span style="min-width:0"><b>${esc(r.nome)}</b><small class="num">${r.kcal} kcal · ${r.p} g proteína · ${r.min} min</small><span class="tags" style="margin-top:4px"><span class="tag">${CATS[r.cat] || r.cat}</span>${recTags(r).slice(0, 1).map(k => `<span class="tag g">${TAGN[k]}</span>`).join("")}${(ME.favs || []).includes(r.id) ? `<span class="tag g">Favorita</span>` : ""}</span></span></button>`;
function rDieta(){
  const seg = `<div class="seg" role="group">${[["receitas","Receitas"],["cardapio","Cardápio"],["diario","Meu dia"]].map(([k, n]) => `<button data-dv="${k}" aria-pressed="${DV === k}">${n}</button>`).join("")}</div>`;
  $("t-dieta").innerHTML = capa("Nutrição", "Receitas para acompanhar sua evolução.") + seg + `<div id="d-body" class="tab-panel"></div>`;
  $("t-dieta").querySelectorAll("[data-dv]").forEach(b => b.onclick = () => { DV = b.dataset.dv; RV = "home"; SOM.tap(); rDieta(); });
  ({ receitas: rReceitas, cardapio: rCardapio, diario: rDiario })[DV]();
}
function rReceitas(){
  const all = receitas();
  if(RV === "lista") return rListaReceitas(all);
  const rd = receitaDoDia(), alvo = alvoTag();
  const cols = [[alvo, TAGN[alvo], alvo === "secar" ? `Leves e com proteína para te deixar ${gf("saciada", "saciado")}` : alvo === "massa" ? "Mais proteína e energia para construir músculo" : "Mais proteína, mais resultado"],
    ...["secar","massa","proteina","rapida"].filter(k => k !== alvo).map(k => [k, TAGN[k], ""]), ["cat:cafe", "Café da manhã", ""], ["cat:doce", "Sobremesas fit", "Doce sem culpa"]];
  $("d-body").innerHTML = `
    <div class="search">${ic("search", 18)}<input class="input" id="r-q" placeholder="Buscar receita ou ingrediente" autocomplete="off"></div>
    <button class="rhero" data-rec="${rd.id}" style="--rc:${CORCAT[rd.cat]}"><span class="rhero-art">${ic(ICCAT[rd.cat], 64, 1.4)}${foto(`img/receita-${rd.id}.jpg`)}</span><span class="rhero-tx"><span class="eyebrow">Receita do dia · ${TAGN[alvo]}</span><b>${esc(rd.nome)}</b><small class="num">${rd.kcal} kcal · ${rd.p} g proteína · ${rd.min} min</small><span class="btn btn-accent btn-sm" style="margin-top:10px;align-self:flex-start">${ic("chef", 16)} Cozinhar com voz</span></span></button>
    ${cols.map(([k, n, s]) => { const L = k.startsWith("cat:") ? all.filter(r => r.cat === k.slice(4)) : all.filter(r => recTags(r).includes(k) && (k === "massa" || r.cat !== "doce")); const off = seedDia(today(), n.length) % Math.max(1, L.length - 10);
      return L.length ? `<div><div class="sec-title"><div><h3 style="font-size:20px">${n}</h3>${s ? `<small class="muted">${s}</small>` : ""}</div><button class="link" data-ver="${k}">Ver ${L.length}</button></div><div class="hscroll" style="margin-top:10px">${L.slice(off, off + 10).map(rTile).join("")}</div></div>` : ""; }).join("")}
    <button class="btn btn-line btn-block" id="r-todas">Ver todas as ${all.length} receitas</button>`;
  $("d-body").querySelectorAll("[data-rec]").forEach(b => b.onclick = () => abrirReceita(b.dataset.rec));
  $("d-body").querySelectorAll("[data-ver]").forEach(b => b.onclick = () => { const k = b.dataset.ver; RF = { q: "", cat: k.startsWith("cat:") ? k.slice(4) : "", tag: k.startsWith("cat:") ? "" : k, fav: false, n: 30 }; RV = "lista"; rReceitas(); window.scrollTo(0, 0); });
  $("r-todas").onclick = () => { RF = { q: "", cat: "", tag: "", fav: false, n: 30 }; RV = "lista"; rReceitas(); window.scrollTo(0, 0); };
  $("r-q").oninput = e => { RF = { q: e.target.value, cat: "", tag: "", fav: false, n: 30 }; RV = "lista"; rReceitas(); const i = $("r-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
}
function rListaReceitas(all){
  const filtros = [["", "Todas"], ...Object.entries(TAGN).map(([k, n]) => ["t:" + k, n]), ...Object.entries(CATS).map(([k, n]) => ["c:" + k, n]), ["fav", "Favoritas"]];
  const ativo = RF.fav ? "fav" : RF.tag ? "t:" + RF.tag : RF.cat ? "c:" + RF.cat : "";
  $("d-body").innerHTML = `
    <div style="display:flex;gap:10px;align-items:center"><button class="iconbtn sm" id="r-back" aria-label="Voltar">${ic("back", 18)}</button><div class="search" style="flex:1">${ic("search", 18)}<input class="input" id="r-q" placeholder="Buscar receita ou ingrediente" value="${esc(RF.q)}" autocomplete="off"></div></div>
    <div class="chips scroll" id="r-cats">${filtros.map(([k, n]) => `<button class="chip" data-f="${k}" aria-pressed="${ativo === k}">${n}</button>`).join("")}</div>
    <p class="hint" style="margin:0" id="r-n"></p><div id="r-list"></div>`;
  const draw = () => {
    let L = all;
    if(RF.fav) L = L.filter(r => (ME.favs || []).includes(r.id)); if(RF.cat) L = L.filter(r => r.cat === RF.cat); if(RF.tag) L = L.filter(r => recTags(r).includes(RF.tag));
    if(RF.q){ const q = norm(RF.q); L = L.filter(r => norm(r.nome + " " + r.ing.join(" ")).includes(q)); }
    $("r-n").textContent = `${L.length} ${L.length === 1 ? "receita" : "receitas"}`;
    $("r-list").innerHTML = L.length ? `<div class="rgrid">${L.slice(0, RF.n).map(rCard).join("")}</div>${L.length > RF.n ? `<div style="display:flex;justify-content:center;margin-top:12px"><button class="btn btn-line" id="r-more">Mostrar mais</button></div>` : ""}` : `<div class="empty">${RF.fav ? "Você ainda não favoritou receitas." : "Nenhuma receita encontrada."}</div>`;
    $("r-list").querySelectorAll("[data-rec]").forEach(b => b.onclick = () => abrirReceita(b.dataset.rec));
    const mb = $("r-more"); if(mb) mb.onclick = () => { RF.n += 30; draw(); };
  };
  $("r-back").onclick = () => { RV = "home"; rReceitas(); };
  let tq; $("r-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { RF.q = e.target.value; RF.n = 30; draw(); }, 200); };
  $("r-cats").querySelectorAll("[data-f]").forEach(b => b.onclick = () => { const f = b.dataset.f; RF.fav = f === "fav"; RF.tag = f.startsWith("t:") ? f.slice(2) : ""; RF.cat = f.startsWith("c:") ? f.slice(2) : ""; RF.n = 30; $("r-cats").querySelectorAll("[data-f]").forEach(c => c.setAttribute("aria-pressed", c === b)); draw(); });
  draw();
}
function abrirReceita(id){
  const r = receitas().find(x => x.id === id); if(!r) return;
  const fav = (ME.favs || []).includes(id), tg = recTags(r);
  sheet(r.nome, `
    <div class="rdet" style="--rc:${CORCAT[r.cat]}">${foto(`img/receita-${r.id}.jpg`)}<span class="rdet-art">${ic(ICCAT[r.cat], 70, 1.3)}</span>
      <div class="tags" style="margin:0"><span class="tag" style="background:rgba(0,0,0,.28);color:#fff">${CATS[r.cat]}</span>${tg.map(k => `<span class="tag" style="background:rgba(0,0,0,.28);color:#fff">${TAGN[k]}</span>`).join("")}</div>
      <h2>${esc(r.nome)}</h2>
      <div class="rdet-meta"><span>${ic("clock", 15)} ${r.min} min</span><span>${ic("people", 15)} ${r.porc} ${r.porc === 1 ? "porção" : "porções"}</span><span>${ic("flame", 15)} ${r.kcal} kcal</span></div></div>
    <button class="btn btn-accent btn-block btn-lg" id="rc-cook">${ic("chef", 20)} Cozinhar com voz, passo a passo</button>
    <div class="macrobox"><div><b class="num">${r.kcal}</b><span>kcal</span></div><div><b class="num">${r.p}g</b><span>Proteína</span></div><div><b class="num">${r.c}g</b><span>Carbo</span></div><div><b class="num">${r.g}g</b><span>Gordura</span></div></div>
    <div class="card"><div class="sec-title"><h3>Ingredientes</h3><button class="link" id="rc-ing" data-mudo>${ic("speaker", 16)} Ouvir</button></div><div class="ingck" style="margin-top:6px">${r.ing.map(x => `<label><input type="checkbox"><span>${esc(x)}</span></label>`).join("")}</div></div>
    <div class="card"><div class="sec-title"><h3>Modo de preparo</h3><button class="link" id="rc-prep" data-mudo>${ic("speaker", 16)} Ouvir</button></div><ol class="steps" style="margin-top:14px">${r.passos.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ol></div>
    <div class="row2"><button class="btn btn-line" id="rc-fav">${ic("heart", 18)} ${fav ? "Favorita" : "Favoritar"}</button><button class="btn btn-soft" id="rc-add">${ic("check", 18)} Comi esta</button></div>
    <p class="hint" style="margin:0;text-align:center">Valores por porção, aproximados.</p>`, () => { if(TAB === "dieta") rDieta(); });
  $("rc-cook").onclick = () => abrirCozinha(r);
  $("rc-ing").onclick = () => falar(`Ingredientes de ${r.nome}: ${r.ing.join("; ")}.`);
  $("rc-prep").onclick = () => falar(r.passos.map((p, i) => `Passo ${i + 1}: ${p}`).join(" "));
  $("rc-fav").onclick = () => { ME.favs = ME.favs || []; if(fav){ ME.favs = ME.favs.filter(x => x !== id); SOM.remove(); } else { ME.favs.push(id); SOM.fav(); toast("Salva nas favoritas"); } save(); abrirReceita(id); };
  $("rc-add").onclick = () => registraReceita(r);
}

/* Cardápio do dia, montado para a meta da pessoa */
const PARTES = { cafe: .25, almoco: .35, lanche: .15, jantar: .25 };
const CANDS = { cafe: ["cafe"], almoco: ["almoco", "salada"], lanche: ["lanche", "doce"], jantar: ["almoco", "sopa", "salada"] };
const meiaPorc = x => Math.min(2, Math.max(.5, Math.round(x * 2) / 2));
function candidatos(k){
  const m = metas(ME), alvo = m.kcal * PARTES[k], goal = alvoTag();
  return receitas().filter(r => CANDS[k].includes(r.cat)).map(r => { const porc = meiaPorc(alvo / r.kcal); return { id: r.id, porc, s: Math.abs(r.kcal * porc - alvo) - (recTags(r).includes(goal) ? 90 : 0) - r.p * 2 }; }).sort((a, b) => a.s - b.s).slice(0, 14);
}
function cardapio(d){
  ME.cardapio = ME.cardapio || {};
  if(!ME.cardapio[d]){ const c = {}; REFS.forEach(([k], j) => { const L = candidatos(k), i = seedDia(d, j) % L.length; c[k] = { ...L[i], i }; }); ME.cardapio[d] = c; save(); }
  return ME.cardapio[d];
}
const DICAS = {
  secar: ["Coma proteína em todas as refeições: ela segura a fome.", "Metade do prato com salada e legumes.", "Beba água antes das refeições.", "Prefira frutas inteiras ao suco."],
  massa: ["Divida a proteína em 4 a 5 refeições no dia.", "Não pule o pós-treino: carboidrato com proteína.", "Durma bem: o músculo cresce no descanso.", "Se o peso não sobe em duas semanas, aumente uma porção por dia."],
  proteina: ["Monte o prato com proteína, carboidrato e verdura.", "Prefira comida de verdade a industrializados.", "Mantenha horários parecidos todo dia.", "Água é parte da dieta: siga a meta de copos."]
};
function rCardapio(){
  const m = metas(ME), c = cardapio(DD), alvo = alvoTag(), rs = receitas();
  const itens = REFS.map(([k, n]) => { const r = rs.find(x => x.id === c[k].id) || rs[0]; return { k, n, r, porc: c[k].porc }; });
  const tot = itens.reduce((a, x) => ({ kcal: a.kcal + x.r.kcal * x.porc, p: a.p + x.r.p * x.porc }), { kcal: 0, p: 0 });
  const pt = x => String(x).replace(".", ",") + (x === 1 ? " porção" : " porções");
  $("d-body").innerHTML = `
    <div class="card"><span class="eyebrow-s">Cardápio ${TAGN[alvo].toLowerCase()}</span><h3 style="font-size:24px;margin-top:4px">Seu dia de comida pronto</h3>
      <p class="hint" style="margin:6px 0 12px">Montado para a sua meta de ${int(m.kcal)} kcal e ${m.p} g de proteína. Troque o que não gostar.</p>
      <div class="ringrow"><div class="ring">${ring(tot.kcal, m.kcal)}<b class="num">${int(tot.kcal)}<small>KCAL</small></b></div><div class="macros"><div class="mac"><span>Proteína</span><span class="tr"><i style="width:${Math.min(100, 100 * tot.p / m.p)}%"></i></span><span class="num muted">${int(tot.p)}/${m.p} g</span></div><p class="hint" style="margin:4px 0 0">Complete com frutas, salada à vontade e água.</p></div></div></div>
    ${itens.map(x => `<div class="meal"><div class="meal-h"><h4>${x.n}</h4><span class="num">${int(x.r.kcal * x.porc)} kcal</span></div>
      <button class="exrow" data-rec="${x.r.id}" style="grid-template-columns:56px minmax(0,1fr)"><span class="rthumb" style="--rc:${CORCAT[x.r.cat]};width:56px;height:56px">${ic(ICCAT[x.r.cat], 24, 1.7)}</span><span style="min-width:0"><b>${esc(x.r.nome)}</b><small class="num">${pt(x.porc)} · ${int(x.r.p * x.porc)} g proteína · ${x.r.min} min</small></span></button>
      <div class="meal-act"><button class="btn btn-soft btn-sm" data-troca="${x.k}">${ic("repeat", 15)} Trocar</button><button class="btn btn-soft btn-sm" data-cook="${x.r.id}">${ic("chef", 15)} Cozinhar</button><button class="btn btn-accent btn-sm" data-comi="${x.k}">${ic("check", 15, 3)} Comi</button></div></div>`).join("")}
    <div class="card"><h3 style="margin-bottom:8px">Dicas para você</h3><ul class="ing">${DICAS[alvo].map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>`;
  $("d-body").querySelectorAll("[data-rec]").forEach(b => b.onclick = () => abrirReceita(b.dataset.rec));
  $("d-body").querySelectorAll("[data-cook]").forEach(b => b.onclick = () => abrirCozinha(receitas().find(r => r.id === b.dataset.cook)));
  $("d-body").querySelectorAll("[data-troca]").forEach(b => b.onclick = () => { const k = b.dataset.troca, L = candidatos(k), i = ((c[k].i || 0) + 1) % L.length; c[k] = { ...L[i], i }; save(); SOM.tap(); rCardapio(); });
  $("d-body").querySelectorAll("[data-comi]").forEach(b => b.onclick = () => { const x = itens.find(i => i.k === b.dataset.comi); dia(DD)[x.k].push({ nome: x.r.nome, qtd: pt(x.porc), kcal: x.r.kcal * x.porc, p: x.r.p * x.porc, c: x.r.c * x.porc, g: x.r.g * x.porc }); save(); SOM.add(); toast(`Registrado: ${x.r.nome}`); });
}
function rDiario(){
  const m = metas(ME), t = totais(DD), x = dia(DD), rot = DD === today() ? "Hoje" : DD === addD(today(), -1) ? "Ontem" : brD(DD);
  $("d-body").innerHTML = `
    <div class="datebar"><button class="iconbtn" id="d-prev" aria-label="Dia anterior">${ic("back", 18)}</button><b>${rot}</b><button class="iconbtn" id="d-next" aria-label="Próximo dia" ${DD >= today() ? "disabled" : ""} style="transform:rotate(180deg)">${ic("back", 18)}</button></div>
    ${painelDia(t, m, "", "Calorias do dia")}
    <div class="card" style="padding:14px 16px"><div class="sec-title"><span style="font-weight:700">${ic("drop", 16)} Água</span><span class="muted num" style="font-size:14px">${x.agua || 0} de ${m.agua} copos de 250 ml</span></div>
      <div class="water">${Array.from({ length: Math.max(m.agua, x.agua || 0) }, (_, i) => `<button class="cup ${i < (x.agua || 0) ? "on" : ""}" data-cup="${i}" aria-label="Copo ${i + 1}" data-mudo></button>`).join("")}</div></div>
    ${REFS.map(([k, n]) => { const L = x[k] || [], kc = L.reduce((a, i) => a + i.kcal, 0); return `<div class="meal"><div class="meal-h"><h4>${n}</h4><span class="num">${int(kc)} kcal</span></div>
      ${L.map((i, j) => `<div class="item"><div><b>${esc(i.nome)}</b><small>${esc(i.qtd)} · P ${int(i.p)} g · C ${int(i.c)} g · G ${int(i.g)} g</small></div><span class="num" style="font-weight:700">${int(i.kcal)}</span><button class="x" data-del="${k}:${j}" aria-label="Remover ${esc(i.nome)}" data-mudo>×</button></div>`).join("")}
      <button class="addrow" data-add="${k}">+ Adicionar alimento</button></div>`; }).join("")}
    <p class="hint" style="margin:0">Valores aproximados, de tabelas de referência. Para um plano individual, procure um nutricionista em Perfil.</p>`;
  $("d-prev").onclick = () => { DD = addD(DD, -1); rDiario(); };
  $("d-next").onclick = () => { if(DD < today()){ DD = addD(DD, 1); rDiario(); } };
  $("d-body").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { const [k, j] = b.dataset.del.split(":"); x[k].splice(+j, 1); SOM.remove(); save(); rDiario(); });
  $("d-body").querySelectorAll("[data-add]").forEach(b => b.onclick = () => addAlimento(b.dataset.add));
  $("d-body").querySelectorAll("[data-cup]").forEach(b => b.onclick = () => { const i = +b.dataset.cup, antes = x.agua || 0; x.agua = antes === i + 1 ? i : i + 1; (x.agua > antes ? SOM.water : SOM.remove)(); save(); rDiario(); });
}
function addAlimento(ref){
  let q = "", src = "alim";
  const draw = () => {
    const L = src === "alim" ? ALIM : receitas().map(r => ({ id: r.id, nome: r.nome, porcao: "1 porção", kcal: r.kcal, p: r.p, c: r.c, g: r.g }));
    const f = q ? L.filter(a => norm(a.nome).includes(norm(q))) : L;
    $("sa-list").innerHTML = f.slice(0, 60).map(a => `<div class="item"><div><b>${esc(a.nome)}</b><small>${esc(a.porcao)} · ${int(a.kcal)} kcal · P ${a.p} g</small></div><select class="input" data-q="${a.id}" aria-label="Quantidade" style="width:76px;padding:8px">${[0.5,1,1.5,2,3].map(n => `<option value="${n}" ${n === 1 ? "selected" : ""}>${String(n).replace(".", ",")}x</option>`).join("")}</select><button class="x" style="background:var(--accent);color:var(--accent-ink)" data-pick="${a.id}" aria-label="Adicionar ${esc(a.nome)}" data-mudo>+</button></div>`).join("") || `<div class="empty">Nada encontrado. Use "Alimento personalizado".</div>`;
    $("sa-list").querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { const a = L.find(z => z.id === b.dataset.pick), n = +$("sa-list").querySelector(`[data-q="${a.id}"]`).value; push(ref, { nome: a.nome, qtd: (n === 1 ? "" : String(n).replace(".", ",") + "x ") + a.porcao, kcal: a.kcal * n, p: a.p * n, c: a.c * n, g: a.g * n }); });
  };
  const push = (k, it) => { dia(DD)[k].push(it); SOM.add(); save(); toast("Adicionado: " + it.nome); fecharSheet(); };
  sheet("Adicionar alimento", `
    <div class="field"><label for="sa-ref">Refeição</label><select class="input" id="sa-ref">${REFS.map(([k, n]) => `<option value="${k}" ${k === ref ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="seg" role="group"><button id="sa-a" aria-pressed="true">Alimentos</button><button id="sa-r" aria-pressed="false">Receitas do app</button></div>
    <div class="search">${ic("search", 18)}<input class="input" id="sa-q" placeholder="Buscar: arroz, frango, banana..." autocomplete="off"></div>
    <div class="meal" id="sa-list"></div>
    <details class="card"><summary style="cursor:pointer;font-weight:700">Alimento personalizado</summary>
      <div class="formgrid" style="margin-top:12px"><div class="field full"><label for="sp-n">Nome</label><input class="input" id="sp-n"></div>
      <div class="field"><label for="sp-k">Calorias</label><input class="input" id="sp-k" inputmode="numeric"></div><div class="field"><label for="sp-p">Proteína (g)</label><input class="input" id="sp-p" inputmode="decimal"></div>
      <div class="field"><label for="sp-c">Carbo (g)</label><input class="input" id="sp-c" inputmode="decimal"></div><div class="field"><label for="sp-g">Gordura (g)</label><input class="input" id="sp-g" inputmode="decimal"></div></div>
      <button class="btn btn-accent btn-block" id="sp-ok" style="margin-top:12px">Adicionar</button></details>`, () => { if(TAB === "dieta") rDieta(); else rerender(); });
  $("sa-ref").onchange = e => { ref = e.target.value; };
  $("sa-q").oninput = e => { q = e.target.value; draw(); };
  $("sa-a").onclick = () => { src = "alim"; $("sa-a").setAttribute("aria-pressed", true); $("sa-r").setAttribute("aria-pressed", false); draw(); };
  $("sa-r").onclick = () => { src = "rec"; $("sa-r").setAttribute("aria-pressed", true); $("sa-a").setAttribute("aria-pressed", false); draw(); };
  $("sp-ok").onclick = () => { const n = $("sp-n").value.trim(), num = id => parseFloat(String($(id).value).replace(",", ".")) || 0; if(!n || !num("sp-k")){ SOM.erro(); return toast("Preencha nome e calorias"); } push(ref, { nome: n, qtd: "porção", kcal: num("sp-k"), p: num("sp-p"), c: num("sp-c"), g: num("sp-g") }); };
  draw();
}

function registraReceita(r){
  const h = new Date().getHours(), k = r.cat === "cafe" ? "cafe" : r.cat === "lanche" || r.cat === "doce" ? "lanche" : h < 16 ? "almoco" : "jantar";
  DD = today(); dia(DD)[k].push({ nome: r.nome, qtd: "1 porção", kcal: r.kcal, p: r.p, c: r.c, g: r.g }); SOM.add(); save();
  toast("Registrado no " + REFS.find(x => x[0] === k)[1].toLowerCase() + " de hoje");
}

/* ---------- Modo cozinha ---------- */
let CK = null;
const INTRO = ["Agora, ", "Em seguida, ", "Depois disso, ", "Agora faça isso: ", "Próximo passo: "];
function tempoDoPasso(t){
  const m = t.match(/(\d+)\s*(?:a\s*\d+\s*)?(minutos?|min\b|segundos?|horas?)/i); if(!m) return 0;
  const n = +m[1], u = m[2].toLowerCase(); return u.startsWith("h") ? n * 3600 : u.startsWith("s") ? n : n * 60;
}
function abrirCozinha(r){
  fecharSheet(); calar();
  CK = { r, i: -1, tm: null, rem: 0, total: 0, pausa: false };
  $("cook").hidden = false; document.body.style.overflow = "hidden"; telaAcesa(true);
  ME.cozinhou = (ME.cozinhou || 0) + 1; save();
  desenhaCozinha(true);
}
function desenhaCozinha(fala){
  const r = CK.r, n = r.passos.length, i = CK.i, ult = i === n - 1;
  const titulo = i < 0 ? "Separe os ingredientes" : r.passos[i];
  const seg = i >= 0 ? tempoDoPasso(r.passos[i]) : 0;
  $("cook").innerHTML = `
    <div class="sheet-head" style="background:var(--bg)"><button class="iconbtn sm" id="ck-x" aria-label="Fechar modo cozinha">${ic("close", 18)}</button><b>${esc(r.nome)}</b><button class="iconbtn sm" id="ck-voz" aria-label="${ME.voz === false ? "Ligar voz" : "Desligar voz"}" data-mudo>${ic(ME.voz === false ? "mute" : "speaker", 18)}</button></div>
    <div style="max-width:640px;width:100%;margin:0 auto;padding:0 18px"><div class="segs" style="display:flex">${[-1, ...r.passos.map((_, k) => k)].map(k => `<i class="${k < i ? "f" : k === i ? "f" : ""}" style="background:${k <= i ? "var(--accent)" : "var(--surface-3)"}"></i>`).join("")}</div></div>
    <div class="cb">
      <div class="ckfoto${i < 0 ? " baixa" : ""}"><img src="img/receita-${r.id}.jpg" alt="" onerror="this.parentNode.remove()"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span class="stepn">${i < 0 ? "Ingredientes" : `Passo ${i + 1} de ${n}`}</span><span class="speaking" hidden><i></i><i></i><i></i> Falando</span></div>
      <div class="stept">${esc(titulo)}</div>
      ${i < 0 ? `<div class="ingck">${r.ing.map((x, k) => `<label><input type="checkbox" id="ck-i${k}"><span>${esc(x)}</span></label>`).join("")}</div><p class="hint" style="margin:0">Marque o que já separou. Rende ${r.porc} ${r.porc === 1 ? "porção" : "porções"} · ${r.min} min.</p>` : ""}
      ${seg ? `<div class="ctimer">${ic("clock", 26)}<b class="num" id="ck-t">${CK.tm && CK.passoT === i ? fmtT(CK.rem) : fmtT(seg)}</b><button class="btn btn-accent btn-sm" id="ck-tbtn" data-mudo>${CK.tm && CK.passoT === i ? (CK.pausa ? "Continuar" : "Pausar") : "Iniciar cronômetro"}</button></div>` : ""}
      ${i >= 0 && !ult ? `<p class="ck-prox"><b>Depois:</b> ${esc(r.passos[i + 1])}</p>` : ""}
      ${ult ? `<div class="notice">${ic("star", 22)}<div><b>Último passo</b><p>Quando terminar, toque em Concluir. Dá para registrar no seu dia.</p></div></div>` : ""}
    </div>
    <div class="cf"><button class="iconbtn" id="ck-prev" aria-label="Passo anterior" ${i < 0 ? "disabled" : ""}>${ic("back", 20)}</button>
      <button class="btn btn-accent btn-lg" id="ck-next">${i < 0 ? "Começar o preparo" : ult ? "Concluir receita" : "Próximo passo"}</button>
      <button class="iconbtn" id="ck-rep" aria-label="Repetir em voz alta" data-mudo>${ic("repeat", 20)}</button></div>`;
  $("ck-x").onclick = fechaCozinha;
  $("ck-voz").onclick = () => { ME.voz = ME.voz === false; save(); if(ME.voz === false) calar(); else falaPasso(); desenhaCozinha(); };
  $("ck-prev").onclick = () => { if(CK.i >= 0){ CK.i--; SOM.tap(); desenhaCozinha(true); } };
  $("ck-next").onclick = () => { if(ult){ concluiCozinha(); return; } CK.i++; SOM.check(); desenhaCozinha(true); };
  $("ck-rep").onclick = falaPasso;
  const tb = $("ck-tbtn"); if(tb) tb.onclick = () => {
    if(CK.tm && CK.passoT === i){ CK.pausa = !CK.pausa; desenhaCozinha(); return; }
    clearInterval(CK.tm); CK.passoT = i; CK.rem = seg; CK.pausa = false; SOM.restStart(); falar(`Cronômetro de ${fmtFala(seg)} iniciado.`);
    CK.tm = setInterval(() => {
      if(!CK || CK.pausa) return; CK.rem--;
      const t = $("ck-t"); if(t && CK.i === CK.passoT) t.textContent = fmtT(CK.rem);
      if(CK.rem <= 3 && CK.rem > 0) SOM.tick();
      if(CK.rem <= 0){ clearInterval(CK.tm); CK.tm = null; SOM.restEnd(); vibra([200, 100, 200]); falar("Tempo esgotado! Pode seguir para o próximo passo."); toast("Tempo esgotado"); if(CK.i === CK.passoT) desenhaCozinha(); }
    }, 1000);
    desenhaCozinha();
  };
  if(fala) falaPasso();
}
const fmtT = s => `${Math.floor(s / 60)}:${pad(Math.max(0, s) % 60)}`;
const fmtFala = s => s >= 3600 ? `${Math.round(s / 3600)} hora${s >= 7200 ? "s" : ""}` : s >= 60 ? `${Math.round(s / 60)} minuto${s >= 120 ? "s" : ""}` : `${s} segundos`;
function falaPasso(){
  const r = CK.r, i = CK.i;
  if(i < 0) falar(`Vamos fazer ${r.nome}. Separe os ingredientes: ${r.ing.join("; ")}. Quando estiver tudo pronto, toque em começar o preparo.`);
  else { const intro = i === 0 ? "Primeiro passo: " : i === r.passos.length - 1 ? "Último passo: " : INTRO[i % INTRO.length]; const s = tempoDoPasso(r.passos[i]); falar(intro + r.passos[i] + (s ? ` Se quiser, inicie o cronômetro de ${fmtFala(s)}.` : "")); }
}
function concluiCozinha(){
  const r = CK.r; SOM.done(); falar("Pronto! Sua receita está feita. Bom apetite!");
  $("cook").querySelector(".cb").innerHTML = `<div class="done-hero" style="color:var(--ink)"><div class="medalbig">${ic("chef", 54, 1.8)}</div><h2 style="font-size:32px">Receita pronta!</h2><p class="muted" style="margin:0">${esc(r.nome)} · ${r.kcal} kcal por porção</p>
    <button class="btn btn-accent btn-lg btn-block" id="ck-reg">Registrar no meu dia</button><button class="btn btn-line btn-block" id="ck-fim">Fechar</button></div>`;
  $("cook").querySelector(".cf").hidden = true;
  $("ck-reg").onclick = () => { registraReceita(r); fechaCozinha(); };
  $("ck-fim").onclick = fechaCozinha;
}
function fechaCozinha(){ if(CK) clearInterval(CK.tm); CK = null; calar(); telaAcesa(false); $("cook").hidden = true; document.body.style.overflow = ""; rerender(); }

/* ---------- EVOLUÇÃO ---------- */
function medalhas(){
  const T = ME.treinos || [], n = T.length, min = T.reduce((a, t) => a + (t.min || 0), 0), s = streak();
  const sem = semanaAtualDias(), nSem = sem.filter(d => diasTreino().has(d)).length;
  const p = progAtual(), progOk = ME.prog && (ME.prog.feitos || 0) >= p.semanas * p.diasSem;
  const aguaDias = Object.values(ME.diario || {}).filter(x => (x.agua || 0) >= metas(ME).agua).length;
  return [
    { id:"m1", nome:"Primeiro passo", desc:"Fez o primeiro treino", ic:"star", ok: n >= 1 },
    { id:"m3", nome:"Em chamas", desc:"3 dias seguidos ativo", ic:"flame", ok: s >= 3 },
    { id:"m7", nome:"Semana perfeita", desc:"7 dias seguidos ativo", ic:"flame", ok: s >= 7 },
    { id:"mmeta", nome:"Meta da semana", desc:"Bateu os treinos da semana", ic:"target", ok: nSem >= (ME.perfil.dias || 3) },
    { id:"m10", nome:"10 treinos", desc:"Completou 10 treinos", ic:"treinar", ok: n >= 10 },
    { id:"m25", nome:"25 treinos", desc:"Completou 25 treinos", ic:"treinar", ok: n >= 25 },
    { id:"m50", nome:"50 treinos", desc:"Completou 50 treinos", ic:"trophy", ok: n >= 50 },
    { id:"mmin", nome:"100 minutos", desc:"100 minutos treinando", ic:"clock", ok: min >= 100 },
    { id:"mmil", nome:"1.000 minutos", desc:"Mil minutos de treino", ic:"clock", ok: min >= 1000 },
    { id:"mprog", nome:"Programa completo", desc:"Terminou um programa inteiro", ic:"trophy", ok: !!progOk },
    { id:"magua", nome:"Hidratado", desc:"Meta de água em 5 dias", ic:"drop", ok: aguaDias >= 5 },
    { id:"mcook", nome:"Chef fit", desc:"Cozinhou com o modo cozinha", ic:"chef", ok: (ME.cozinhou || 0) >= 1 },
    { id:"mmanha", nome:"Madrugador", desc:"Treinou antes das 7h", ic:"sun", ok: T.some(t => t.h != null && t.h < 7) },
    { id:"mpeso", nome:"De olho na balança", desc:"Registrou o peso 4 vezes", ic:"scale", ok: (ME.pesos || []).length >= 4 }
  ];
}
let CALM = 0;
function recordeSeq(){ const D = [...diasTreino()].sort(); let best = 0, cur = 0, prev = null; D.forEach(d => { cur = prev && addD(prev, 1) === d ? cur + 1 : 1; best = Math.max(best, cur); prev = d; }); return best; }
function rEvolucao(){
  const T = ME.treinos || [], min = T.reduce((a, t) => a + (t.min || 0), 0), kcal = T.reduce((a, t) => a + (t.kcal || 0), 0), feitos = diasTreino(), M = medalhas();
  const ref = new Date(); ref.setDate(1); ref.setMonth(ref.getMonth() + CALM);
  const ano = ref.getFullYear(), mes = ref.getMonth(), ini = (new Date(ano, mes, 1).getDay() + 6) % 7, nd = new Date(ano, mes + 1, 0).getDate();
  const nomeMes = (s => s.charAt(0).toUpperCase() + s.slice(1))(ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
  $("t-evolucao").innerHTML = `<button class="link xp-voltar" data-area="perfil">${ic("back", 15)} Perfil</button>
    ${capa("Sua evolução", frase(3), "", "img/ex-alongquad.jpg")}
    <div class="stats"><div class="stat"><b class="num">${T.length}</b><span>treinos</span></div><div class="stat"><b class="num">${int(min)}</b><span>minutos</span></div><div class="stat"><b class="num">${int(kcal)}</b><span>kcal gastas</span></div></div>
    ${(() => { const mesA = today().slice(0, 7), dA = new Date(); dA.setDate(1); dA.setMonth(dA.getMonth() - 1); const mesB = dA.toISOString().slice(0, 7); const A = T.filter(t => t.d.startsWith(mesA)), B = T.filter(t => t.d.startsWith(mesB)); const dif = A.length - B.length; const rec = recordeSeq(); return `<div class="mes-card"><div><span>Este mês</span><b class="num">${A.length} ${A.length === 1 ? "treino" : "treinos"}</b><small>${int(A.reduce((a, t) => a + (t.min || 0), 0))} min · ${int(A.reduce((a, t) => a + (t.kcal || 0), 0))} kcal</small></div><div class="mes-dif ${dif >= 0 ? "up" : "down"}">${B.length || A.length ? `${dif >= 0 ? "▲" : "▼"} ${Math.abs(dif)} vs. mês passado` : "Primeiro mês!"}</div><div class="mes-rec">${ic("flame", 16)} Recorde: <b>${rec} ${rec === 1 ? "dia seguido" : "dias seguidos"}</b></div></div>`; })()}
    <div class="card"><div class="sec-title"><h3>${nomeMes}</h3><span style="display:flex;gap:6px"><button class="iconbtn sm" id="cal-p" aria-label="Mês anterior">${ic("back", 16)}</button><button class="iconbtn sm" id="cal-n" aria-label="Próximo mês" ${CALM >= 0 ? "disabled" : ""} style="transform:rotate(180deg)">${ic("back", 16)}</button></span></div>
      <div class="cal" style="margin-top:12px">${["S","T","Q","Q","S","S","D"].map(d => `<span class="wh">${d}</span>`).join("")}${Array.from({ length: ini }, () => `<span class="o"></span>`).join("")}${Array.from({ length: nd }, (_, k) => { const d = `${ano}-${pad(mes + 1)}-${pad(k + 1)}`; return `<span class="${feitos.has(d) ? "f" : ""} ${d === today() ? "h" : ""}">${k + 1}</span>`; }).join("")}</div>
      <p class="hint" style="margin:10px 0 0">${[...feitos].filter(d => d.startsWith(`${ano}-${pad(mes + 1)}`)).length} dias treinados neste mês · sequência atual de ${streak()} ${streak() === 1 ? "dia" : "dias"}</p></div>
    <div class="card"><div class="sec-title"><h3>Peso</h3><button class="link" id="ev-peso">Registrar peso</button></div>${pesoChart(ME.pesos || [])}</div>
    ${medidasCard()}
    <div class="card"><div class="sec-title"><h3>Conquistas</h3><span class="muted num">${M.filter(m => m.ok).length} de ${M.length}</span></div>
      <div class="medals" style="margin-top:14px">${M.map(m => `<div class="medal ${m.ok ? "ok" : ""}" title="${esc(m.desc)}"><i>${ic(m.ok ? m.ic : "lock", 24)}</i>${esc(m.nome)}</div>`).join("")}</div></div>
    <div><h3 style="font-size:20px;margin-bottom:8px">Histórico</h3>${T.length ? `<div class="list">${T.slice().reverse().slice(0, 30).map(t => `<div class="exrow" style="grid-template-columns:44px minmax(0,1fr) auto"><span class="dn" style="background:var(--accent);color:var(--accent-ink)">${ic("check", 18, 3)}</span><span><b>${esc(t.nome || "Treino")}</b><small>${brD(t.d)} · ${t.min || "-"} min${t.parcial ? " · parcial" : ""}</small></span><span class="sr num">${int(t.kcal || 0)}<small>KCAL</small></span></div>`).join("")}</div>` : `<div class="card empty">Seu histórico aparece aqui depois do primeiro treino.</div>`}</div>`;
  $("cal-p").onclick = () => { CALM--; rEvolucao(); };
  $("cal-n").onclick = () => { if(CALM < 0){ CALM++; rEvolucao(); } };
  $("ev-peso").onclick = registraPeso;
  $("ev-med").onclick = registraMedidas;
}
function registraPeso(){
  sheet("Registrar peso", `<div class="field"><label for="np">Peso de hoje (kg)</label><input class="input num" id="np" inputmode="decimal" placeholder="${ME.perfil.peso}"></div><button class="btn btn-accent btn-block btn-lg" id="np-ok">Salvar</button>`, rerender);
  $("np-ok").onclick = () => { const v = parseFloat(String($("np").value).replace(",", ".")); if(!(v > 30 && v < 300)){ SOM.erro(); return toast("Digite o peso em kg"); } ME.pesos = (ME.pesos || []).filter(x => x.d !== today()); ME.pesos.push({ d: today(), kg: v }); ME.perfil.peso = v; SOM.add(); save(); toast("Peso salvo"); fecharSheet(); };
}
function pesoChart(L){
  if(!L.length) return `<p class="hint">Registre seu peso para ver a evolução.</p>`;
  const P = L.slice(-12), W = 600, H = 170, l = 40, b = 24, t = 12;
  const vs = P.map(x => x.kg), mn = Math.floor(Math.min(...vs) - 1), mx = Math.ceil(Math.max(...vs) + 1);
  const x = i => P.length === 1 ? (W + l) / 2 : l + 10 + i * (W - l - 20) / (P.length - 1), y = v => t + (H - t - b) * (1 - (v - mn) / (mx - mn));
  const pts = P.map((p, i) => `${x(i)},${y(p.kg)}`).join(" "), dif = P[P.length - 1].kg - P[0].kg;
  return `<p style="margin:8px 0 4px"><b class="num" style="font-family:var(--display);font-size:32px">${String(P[P.length - 1].kg).replace(".", ",")} kg</b> <span class="muted num">${P.length > 1 ? (dif > 0 ? "+" : "") + dif.toFixed(1).replace(".", ",") + " kg desde " + brD(P[0].d) : "primeiro registro"}</span></p>
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do peso">
      ${[mn, (mn + mx) / 2, mx].map(v => `<line x1="${l}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${Math.round(v)}</text>`).join("")}
      ${P.length > 1 ? `<polygon points="${x(0)},${H - b} ${pts} ${x(P.length - 1)},${H - b}" fill="var(--accent)" opacity=".12"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>` : ""}
      ${P.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="${i === P.length - 1 ? 6 : 4}" fill="${i === P.length - 1 ? "var(--accent)" : "var(--surface)"}" stroke="var(--accent)" stroke-width="2.5"/>`).join("")}
    </svg></div>`;
}

/* ---------- PERFIL ---------- */
const OBJN = { perder: "Perder gordura", forca: "Ganhar força e músculos", gluteos: "Glúteos e pernas", disposicao: "Ter mais disposição", mobilidade: "Mobilidade e saúde", manter: "Manter" };
const setRow = (id, icon, t, s, right) => `<button class="setrow" id="${id}"><span class="si">${ic(icon, 19)}</span><div><b>${t}</b>${s ? `<small>${s}</small>` : ""}</div>${right || `<span class="muted" style="transform:rotate(180deg);display:grid">${ic("back", 16)}</span>`}</button>`;
const sw = on => `<span class="sw" role="switch" aria-checked="${!!on}"></span>`;
function rPerfil(){
  const m = metas(ME), p = ME.perfil, prem = isPremium(ME), cups = (DB.cupons || []).filter(c => c.user === ME.id).reverse();
  const profs = (DB.profissionais || []).filter(x => x.ativo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const th = document.documentElement.dataset.theme || "light", nv = nivelAluna((ME.treinos || []).length);
  $("t-perfil").innerHTML = `
    ${capa("", "", `<div class="hello" style="gap:14px"><button class="avatar avedit${coroaDe("eu") ? " cr" : ""}" id="p-foto" aria-label="Trocar foto do perfil" style="width:72px;height:72px;font-size:28px">${fotoAv(ME)}<i class="avcam">${ic("plus", 13, 3)}</i></button><div><h2 style="color:#fff">${esc(ME.nome)}</h2><div class="k" style="color:rgba(245,248,239,.8)">${esc(ME.email)}</div><span class="nivel-chip">${ic("star", 13)} Nível ${nv.nome}</span></div></div>`, "img/ex-panturrilha.jpg")}
    <div class="pstats"><div><b class="num">${int((ME.treinos || []).length)}</b><span>treinos</span></div><div><b class="num">${int((ME.treinos || []).reduce((a, t) => a + (t.min || 0), 0))}</b><span>minutos</span></div><div><b class="num">${streak()}</b><span>${streak() === 1 ? "dia seguido" : "dias seguidos"}</span></div></div>
    ${nv.prox ? `<div class="card nivel-card"><div class="sec-title"><h3 style="font-size:16px">Próximo nível: ${nv.prox[1]}</h3><span class="muted num" style="font-size:13px">faltam ${nv.falta} ${nv.falta === 1 ? "treino" : "treinos"}</span></div><div class="prog" style="margin-top:10px"><i style="width:${nv.pct}%"></i></div><p class="hint" style="margin:8px 0 0">Membro desde ${brD(ME.criado || today())}</p></div>` : `<div class="card nivel-card"><h3 style="font-size:16px">Você chegou ao nível máximo 🏆</h3><p class="hint" style="margin:6px 0 0">Membro desde ${brD(ME.criado || today())}</p></div>`}
    ${perfilXP()}
    <div class="today" style="--pc:${prem ? "#3DDC6E" : "#FFB23F"};min-height:0;grid-template-columns:1fr"><div><span class="eyebrow">${prem ? (ME.premium.tipo === "teste" ? "Premium · teste grátis" : "Premium") : "Plano gratuito"}</span>
      <h2 style="font-size:24px">${prem ? (ME.premium.tipo === "vitalicio" ? "Premium vitalício" : `Premium até ${brD(ME.premium.ate)}`) : "Treine sem anúncios"}</h2>
      <p>${prem ? "Sem anúncios e com tudo liberado." : "Assine o Premium e treine sem interrupções."}</p>
      ${!prem || ME.premium.tipo === "teste" ? (DB.config.checkout ? `<a class="btn btn-accent" style="margin-top:14px" href="${esc(DB.config.checkout)}" target="_blank" rel="noopener">Assinar por R$ ${String(DB.config.premiumPreco || 19.9).replace(".", ",")}/mês</a>` : "") : ""}</div></div>
    ${cardInstalar()}
    <div class="card" style="padding:6px 16px">
      ${setRow("p-dados", "perfil", "Meus dados", `${esc(mascaraTel(ME.whats || "")) || "Nome, WhatsApp e cidade"}`)}
      ${setRow("p-plano", "target", "Meu plano de treino", `${esc(progAtual().nome)} · ${p.dias} dias por semana`)}
      ${setRow("p-obj", "target", "Meu objetivo", objById(p.objetivo)[1])}
      ${setRow("p-pref", "home", "Meu treino em casa", `${p.tempo} min · ${(p.itens || []).length ? (p.itens || []).map(i => EQN[i]).join(", ") : "sem equipamento"}`)}
      ${setRow("p-metas", "dieta", "Metas de alimentação", `${int(m.kcal)} kcal · ${m.p} g de proteína`)}
      ${setRow("p-peso", "scale", "Registrar peso", `Atual: ${String(p.peso).replace(".", ",")} kg`)}
    </div>
    <div class="card" style="padding:6px 16px">
      ${setRow("p-lemb", "clock", "Lembrete de treino", ME.lembrete ? `${ME.lembrete.dias.map(d => (DSEM.find(x => x[0] === d) || [])[1]).join(", ")} às ${ME.lembrete.hora}` : "Defina dias e horário")}
      ${setRow("p-voz", "speaker", "Voz do treinador", ME.voz === false ? "Desligada" : `Ligada${VOZ.v ? " · " + esc(VOZ.v.name.replace(/\s*\(.*\)/, "")) : ""}`)}
      ${setRow("p-som", "bolt", "Sons", "Sino, bipes e efeitos", sw(SOM.on))}
      ${setRow("p-tema", "moon", "Tema", th === "light" ? "Claro" : "Escuro", `<span class="seg" style="padding:3px"><span style="padding:6px 12px;border-radius:999px;font-size:13px;font-weight:700;${th !== "light" ? "background:var(--surface);" : "color:var(--muted)"}">Escuro</span><span style="padding:6px 12px;border-radius:999px;font-size:13px;font-weight:700;${th === "light" ? "background:var(--surface);" : "color:var(--muted)"}">Claro</span></span>`)}
    </div>
    <div class="card"><div class="sec-title"><h3>Meus cupons</h3><span class="muted num">${cups.filter(c => !c.usado).length} disponíveis</span></div>
      ${cups.length ? cups.map(c => { const pc = DB.parceiros.find(x => x.id === c.parc) || {}; return `<div class="coupon" style="margin-top:12px;${c.usado ? "opacity:.55;border-style:solid;border-color:var(--line)" : ""}"><b>${pc.desconto || ""}% na ${esc(pc.nome || "loja parceira")}</b><span class="hint">${esc(pc.end || "")}${pc.regras ? " · " + esc(pc.regras) : ""}</span><span class="code">${c.codigo}</span>${c.usado ? `<span class="st off" style="align-self:flex-start">Usado em ${brD(c.usadoEm)}</span>` : `<div class="toolbar"><input class="input" id="pin-${c.id}" inputmode="numeric" placeholder="PIN da loja" aria-label="PIN da loja" maxlength="6"><button class="btn btn-ink btn-sm" data-usar="${c.id}">Validar na loja</button></div><span class="hint">Mostre esta tela no caixa. O atendente digita o PIN da loja.</span>`}</div>`; }).join("") : `<p class="hint" style="margin:8px 0 0">A cada ${DB.config.treinosParaCupom || 8} treinos você ganha um cupom de desconto.</p>`}</div>
    <div class="card" style="padding:6px 16px">${setRow("px-prof", "people", "Profissionais e academias", "Agende pelo Explorar")}</div>
    <div class="card" style="padding:6px 16px">
      ${setRow("p-conv", "share", "Convide uma amiga", "Treinar junto é mais gostoso")}
      ${setRow("px-share", "flame", "Compartilhar minha sequência", "Você escolhe se quer postar na Comunidade")}
      ${linkSuporte() ? setRow("p-sup", "speaker", "Fale com o suporte", "Atendimento pelo WhatsApp") : ""}
      ${setRow("p-sair", "logout", "Sair da conta", "")}
    </div>
    ${DB.config.suporte ? `<p class="hint" style="text-align:center;margin:0">Suporte: ${esc(DB.config.suporte)}</p>` : ""}`;
  $("p-foto").onclick = menuFoto; ligaPerfilXP();
  $("p-lemb").onclick = editaLembrete;
  $("p-dados").onclick = editaDados;
  $("p-conv").onclick = convidar;
  const psu = $("p-sup"); if(psu) psu.onclick = () => window.open(linkSuporte(), "_blank", "noopener");
  $("p-plano").onclick = () => abrirPrograma(progAtual().id);
  $("p-pref").onclick = editaPreferencias;
  $("p-obj").onclick = () => abrirObjetivo(p.objetivo);
  $("p-metas").onclick = editaMetas;
  $("p-peso").onclick = registraPeso;
  $("p-voz").onclick = editaVoz;
  $("p-som").onclick = () => { SOM.on = !SOM.on; if(SOM.on) SOM.bell(); rPerfil(); };
  const pi = $("p-inst"); if(pi) pi.onclick = async () => { if(!PEDIDO_INSTALAR) return; PEDIDO_INSTALAR.prompt(); const r = await PEDIDO_INSTALAR.userChoice.catch(() => null); PEDIDO_INSTALAR = null; if(r && r.outcome === "accepted"){ SOM.done && SOM.done(); toast("Pronto! O CK Life está na sua tela inicial."); } rPerfil(); };
  $("p-tema").onclick = () => { const v = th === "light" ? "dark" : "light"; document.documentElement.dataset.theme = v; try{ localStorage.setItem(KEY + "_tema", v); }catch(e){} rPerfil(); };
  $("p-sair").onclick = logout;
  $("t-perfil").querySelectorAll("[data-usar]").forEach(b => b.onclick = () => {
    const c = DB.cupons.find(x => x.id === b.dataset.usar), pc = DB.parceiros.find(x => x.id === c.parc);
    if(NU.ativo){ NU.validarCupom(c.id, $("pin-" + c.id).value.trim()).then(ok => { if(!ok){ SOM.erro(); return toast("PIN incorreto"); } c.usado = true; c.usadoEm = today(); SOM.coupon(); save(); toast("Cupom validado"); rPerfil(); }).catch(() => toast("Sem conexão. Tente de novo.")); return; }
    if(!pc || $("pin-" + c.id).value.trim() !== String(pc.pin)){ SOM.erro(); return toast("PIN incorreto"); }
    c.usado = true; c.usadoEm = today(); SOM.coupon(); save(); toast("Cupom validado"); rPerfil();
  });
}
function editaPreferencias(){
  const p = ME.perfil, itens = new Set(p.itens || []);
  const op = (k, v, n, on) => `<button class="chip" data-${k}="${v}" aria-pressed="${on}">${n}</button>`;
  sheet("Meu treino em casa", `
    <div><h3 style="font-size:18px;margin-bottom:10px">Objetivo</h3><div class="chips">${OBJS.map(o => op("ob", o[0], o[1], p.objetivo === o[0])).join("")}</div></div>
    <div><h3 style="font-size:18px;margin-bottom:10px">Tenho em casa</h3><div class="chips">${["cadeira","mesa","barra","corda"].map(k => op("it", k, EQN[k], itens.has(k))).join("")}</div></div>
    <div><h3 style="font-size:18px;margin-bottom:10px">Nível</h3><div class="chips">${[["iniciante","Iniciante"],["intermediario","Intermediário"],["avancado","Avançado"]].map(([k, n]) => op("nv", k, n, p.nivel === k)).join("")}</div></div>
    <div><h3 style="font-size:18px;margin-bottom:10px">Tempo por treino</h3><div class="chips">${[10,20,30,45].map(k => op("tp", k, k + " min", +p.tempo === k)).join("")}</div></div>
    <div><h3 style="font-size:18px;margin-bottom:10px">Dias por semana</h3><div class="chips">${[2,3,4,5,6].map(k => op("ds", k, k + " dias", +p.dias === k)).join("")}</div></div>
    <button class="btn btn-accent btn-block btn-lg" id="pf-ok">Salvar e ajustar meu plano</button>
    <p class="hint" style="margin:0;text-align:center">Exercícios que precisam de algo que você não tem são trocados por outros parecidos.</p>`, rerender);
  const grupo = (attr, set) => $("sheet-body").querySelectorAll(`[data-${attr}]`).forEach(b => b.onclick = () => { $("sheet-body").querySelectorAll(`[data-${attr}]`).forEach(x => x.setAttribute("aria-pressed", x === b)); set(b.dataset[attr]); });
  const N = { ...p, itens: [...itens] };
  grupo("ob", v => N.objetivo = v); grupo("nv", v => N.nivel = v); grupo("tp", v => N.tempo = +v); grupo("ds", v => N.dias = +v);
  $("sheet-body").querySelectorAll("[data-it]").forEach(b => b.onclick = () => { const k = b.dataset.it; N.itens = N.itens.includes(k) ? N.itens.filter(x => x !== k) : [...N.itens, k]; b.setAttribute("aria-pressed", N.itens.includes(k)); });
  $("pf-ok").onclick = () => {
    const novo = recomenda(N); Object.assign(ME.perfil, N);
    if(novo !== ME.prog.id){ ME.prog = { id: novo, ini: today(), feitos: 0, fator: 0 }; ME.plano = novo; toast("Plano novo: " + progById(novo).nome); } else toast("Preferências salvas");
    SOM.check(); save(); fecharSheet();
  };
}
function editaMetas(){
  const p = ME.perfil;
  sheet("Metas de alimentação", `
    <div class="row2"><div class="field"><label for="pe-alt">Altura (cm)</label><input class="input num" id="pe-alt" value="${p.altura}" inputmode="numeric"></div><div class="field"><label for="pe-kcal">Calorias por dia</label><input class="input num" id="pe-kcal" value="${p.metaManual ? p.metaManual.kcal : ""}" inputmode="numeric" placeholder="Automático"></div></div>
    <p class="hint" style="margin:0">Deixe as calorias vazias para o app calcular pelo seu objetivo, peso, altura, idade e dias de treino.</p>
    <button class="btn btn-accent btn-block btn-lg" id="pe-ok">Salvar</button>`, rerender);
  $("pe-ok").onclick = () => {
    p.altura = +$("pe-alt").value || p.altura; const k = +$("pe-kcal").value; delete p.metaManual;
    if(k > 800){ const b = metas(ME); p.metaManual = { ...b, kcal: k, c: Math.max(50, Math.round((k - b.p * 4 - b.g * 9) / 4)) }; }
    SOM.check(); save(); toast("Metas atualizadas"); fecharSheet();
  };
}


/* Medidas do corpo */
const MED = [["cintura","Cintura"],["quadril","Quadril"],["braco","Braço"],["coxa","Coxa"]];
function medidasCard(){
  const L = ME.medidas || [], ult = L[L.length - 1], pri = L[0];
  return `<div class="card"><div class="sec-title"><h3>Medidas</h3><button class="link" id="ev-med">Registrar medidas</button></div>
    ${ult ? `<div class="medidas">${MED.map(([k, n]) => { const v = ult[k], d = pri && pri !== ult && v != null && pri[k] != null ? v - pri[k] : null; return `<div><span>${n}</span><b class="num">${v != null ? String(v).replace(".", ",") : "-"}</b>${v != null ? " cm" : ""}${d ? `<small class="${d < 0 ? "desce" : "sobe"}">${d > 0 ? "+" : ""}${d.toFixed(1).replace(".", ",")}</small>` : ""}</div>`; }).join("")}</div><p class="hint" style="margin:10px 0 0">Última medição em ${brD(ult.d)}${pri !== ult ? ` · comparando com ${brD(pri.d)}` : ""}. Meça sempre no mesmo horário.</p>`
      : `<p class="hint" style="margin:8px 0 0">A balança não conta tudo. Meça cintura, quadril, braço e coxa a cada 2 semanas para ver o corpo mudando.</p>`}</div>`;
}
function registraMedidas(){
  const u = (ME.medidas || []).slice(-1)[0] || {};
  sheet("Registrar medidas", `<p class="lead">Use uma fita métrica, sem apertar. Em centímetros.</p>
    <div class="formgrid">${MED.map(([k, n]) => `<div class="field"><label for="md-${k}">${n} (cm)</label><input class="input num" id="md-${k}" inputmode="decimal" placeholder="${u[k] ? String(u[k]).replace(".", ",") : ""}"></div>`).join("")}</div>
    <button class="btn btn-accent btn-block btn-lg" id="md-ok">Salvar medidas</button>`, rerender);
  $("md-ok").onclick = () => {
    const r = { d: today() }; let ok = false;
    MED.forEach(([k]) => { const v = parseFloat(String($("md-" + k).value).replace(",", ".")); if(v > 10 && v < 250){ r[k] = v; ok = true; } });
    if(!ok){ SOM.erro(); return toast("Preencha pelo menos uma medida"); }
    ME.medidas = (ME.medidas || []).filter(x => x.d !== today()); ME.medidas.push(r); SOM.add(); save(); toast("Medidas salvas"); fecharSheet();
  };
}
/* Voz do treinador: escolher voz e velocidade */
function editaVoz(){
  achaVoz();
  const lista = VOZ.lista || [], atual = VOZ.v && VOZ.v.name, vel = ME.vozVel || .97;
  sheet("Voz do treinador", `
    <div class="card" style="padding:6px 16px"><button class="setrow" id="vz-on"><span class="si">${ic("speaker", 19)}</span><div><b>Voz ligada</b><small>Fala os exercícios, os descansos e as receitas</small></div>${sw(ME.voz !== false)}</button></div>
    <div><h3 style="font-size:18px;margin-bottom:10px">Velocidade</h3><div class="seg">${[[.85,"Devagar"],[.97,"Normal"],[1.1,"Rápida"]].map(([v, n]) => `<button data-vel="${v}" aria-pressed="${Math.abs(vel - v) < .01}">${n}</button>`).join("")}</div></div>
    <div><h3 style="font-size:18px;margin-bottom:10px">Escolha a voz</h3>
      ${lista.length ? `<div class="vozlist">${lista.map(v => `<button class="opt" data-voz="${esc(v.name)}" aria-pressed="${v.name === atual}"><span class="oi">${ic("speaker", 20)}</span><span>${esc(v.name.replace(/\s*\(.*\)/, ""))}<small>${esc(v.lang)}${v.localService ? " · no aparelho" : " · online"}</small></span></button>`).join("")}</div>`
        : `<p class="hint" style="margin:0">Este aparelho não mostrou vozes em português. No iPhone: Ajustes › Acessibilidade › Conteúdo falado › Vozes › Português (Brasil), baixe a "Luciana". No Android: Configurações › Idioma › Saída de conversão de texto em voz.</p>`}</div>
    <button class="btn btn-accent btn-block btn-lg" id="vz-test">${ic("play", 16)} Ouvir um exemplo</button>
    <p class="hint" style="margin:0">A voz é a do próprio celular. As vozes marcadas "no aparelho" funcionam sem internet.</p>`, rerender);
  $("vz-on").onclick = () => { ME.voz = ME.voz === false; save(); if(ME.voz) falar("Voz ligada."); else calar(); editaVoz(); };
  $("sheet-body").querySelectorAll("[data-vel]").forEach(b => b.onclick = () => { ME.vozVel = +b.dataset.vel; save(); $("sheet-body").querySelectorAll("[data-vel]").forEach(x => x.setAttribute("aria-pressed", x === b)); falar("Velocidade ajustada."); });
  $("sheet-body").querySelectorAll("[data-voz]").forEach(b => b.onclick = () => { ME.vozNome = b.dataset.voz; save(); achaVoz(); $("sheet-body").querySelectorAll("[data-voz]").forEach(x => x.setAttribute("aria-pressed", x === b)); falar(`Oi, ${ME.nome.split(" ")[0]}! Esta é a minha voz.`); });
  $("vz-test").onclick = () => falar("Agachamento livre. 12 repetições. Vai! Agora, misture meia xícara de aveia com 1 colher (sopa) de mel e 200 g de iogurte.");
}

/* Cronômetro solto (usado por compatibilidade) */
let TM = null;
function stopTimer(){ clearInterval(TM); TM = null; $("timer").hidden = true; }

/* ---------- Anúncios em tela cheia (só para quem não é Premium) ---------- */
const AD = { cliques: 0, ultimo: Date.now(), hoje: 0, dia: today() };
const ocupado = () => !$("play").hidden || !$("cook").hidden;
// anúncios em tela cheia foram desligados: publicidade só em espaços naturais (Feed e Explorar), ver plano.js
function campanhasPara(u){
  const id = idade(u.nasc), d = today();
  return (DB.campanhas || []).filter(c => { const an = DB.anunciantes.find(a => a.id === c.anunc); return c.ativa && an && an.ativo && c.inicio <= d && (!c.fim || c.fim >= d) && (c.genero === "todos" || c.genero === u.genero) && (!c.cidade || +c.cidade === +u.cidade) && (id == null || ((!c.idMin || id >= c.idMin) && (!c.idMax || id <= c.idMax))); });
}
function tentarAnuncio(){
  const f = DB.freq, agora = Date.now();
  if(AD.dia !== today()){ AD.dia = today(); AD.hoje = 0; }
  if(AD.hoje >= f.maxDia || agora - AD.ultimo < f.intervalo * 60000) return;
  if(AD.cliques < f.cliques && agora - AD.ultimo < f.minutos * 60000) return;
  const L = campanhasPara(ME); if(!L.length) return;
  const vistos = {}; DB.eventos.forEach(e => { if(e.u === ME.id && e.t === "imp" && e.d === today()) vistos[e.c] = (vistos[e.c] || 0) + 1; });
  const c = L.sort((a, b) => (vistos[a.id] || 0) - (vistos[b.id] || 0))[0];
  AD.cliques = 0; AD.ultimo = agora; AD.hoje++; mostrarAnuncio(c);
}
function linkCamp(c){
  if(c.destino === "whatsapp") return "https://wa.me/55" + String(c.whats).replace(/\D/g, "").replace(/^55/, "") + (c.msg ? "?text=" + encodeURIComponent(c.msg) : "");
  if(c.destino === "instagram") return "https://instagram.com/" + String(c.insta).replace(/^@/, "");
  return /^https?:\/\//.test(c.site) ? c.site : "https://" + c.site;
}
function mostrarAnuncio(c){
  const an = DB.anunciantes.find(a => a.id === c.anunc);
  DB.eventos.push({ t: "imp", c: c.id, u: ME.id, d: today() }); save(); SOM.swoosh();
  $("ad").innerHTML = `<div class="adbox" role="dialog" aria-modal="true" aria-label="Anúncio"><span class="who">Patrocinado · ${esc(an.nome)}</span><h2>${esc(c.titulo)}</h2>${c.texto ? `<p>${esc(c.texto)}</p>` : ""}
    <a class="btn btn-accent btn-block" id="ad-go" href="${esc(linkCamp(c))}" target="_blank" rel="noopener">${esc(c.botao || "Saiba mais")}</a>
    <button class="btn btn-line btn-block" id="ad-x">Fechar</button><p class="hint" style="margin:0;text-align:center">Assine o Premium para não ver anúncios.</p></div>`;
  $("ad").hidden = false;
  $("ad-go").onclick = () => { DB.eventos.push({ t: "clk", c: c.id, u: ME.id, d: today() }); save(); setTimeout(() => $("ad").hidden = true, 300); };
  $("ad-x").onclick = () => $("ad").hidden = true;
}

/* ---------- Início ---------- */
try{ const th = localStorage.getItem(KEY + "_tema"); document.documentElement.dataset.theme = th || "light"; }catch(e){ document.documentElement.dataset.theme = "light"; }
const PLANOS = PROGS.map(p => ({ id: p.id, nome: p.nome, nivel: p.nivel, obj: p.foco, treinos: p.dias }));
window.FV = { OBJS, ic, CM, tempoAtras, nuvem: NU, get DB(){ return DB; }, set DB(v){ DB = v; }, save, semente, $, esc, int, brD, today, addD, idade, uid, hash, toast, copyText, show, receitas, exercicios, exById, PLANOS, BASE_REC, CATS, isPremium, metas, get ME(){ return ME; }, abrirApp, entrar, logout, linkCamp, XP, xpGarante, XCAT, xcats, lkWhats, lkInsta, lkSite, lkMapa, brl, XERR, STAG, modoTxt };
window.addEventListener("hashchange", () => { fechaTudo(); entrar(); });
async function iniciar(){ if(NU.ativo){ try{ await NU.iniciar(DB, modoAdmin(), telaNovaSenha); }catch(e){ console.warn(e); toast("Não conseguimos conectar. Confira sua internet."); } } if(!(location.hash.includes("type=recovery"))) entrar(); }
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar); else setTimeout(iniciar, 0);
})();
