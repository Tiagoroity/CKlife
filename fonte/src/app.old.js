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
let toastT;
function toast(m){ const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400); }
function copyText(txt, ok){
  const done = () => toast(ok || "Copiado");
  const fb = () => { const a = document.createElement("textarea"); a.value = txt; a.setAttribute("readonly",""); a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); done(); }catch(e){ toast("Não deu para copiar"); } a.remove(); };
  try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(fb); else fb(); }catch(e){ fb(); }
}
async function hash(s){
  try{ const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fitverde:" + s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
  catch(e){ let h = 5381; for(const ch of "fitverde:" + s) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return "f" + (h >>> 0).toString(16); }
}
const LOGO = (s = 34) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><rect x="1" y="1" width="38" height="38" rx="11" fill="var(--accent)"/><path d="M11 15v10M8 17v6M29 15v10M32 17v6M11 20h18" stroke="var(--accent-ink)" stroke-width="3.2" stroke-linecap="round" fill="none"/></svg>`;
document.querySelectorAll(".logo-slot").forEach(e => e.innerHTML = LOGO());

/* ---------- Banco local ---------- */
const KEY = "fitverde_db_v1";
const LS = {
  get(){ try{ const v = localStorage.getItem(KEY); return v ? JSON.parse(v) : null; }catch(e){ return null; } },
  set(v){ try{ localStorage.setItem(KEY, JSON.stringify(v)); return true; }catch(e){ return false; } },
  sess(v){ try{ if(v === undefined) return localStorage.getItem(KEY + "_s"); if(v === null) localStorage.removeItem(KEY + "_s"); else localStorage.setItem(KEY + "_s", v); }catch(e){ return null; } }
};
let DB = LS.get();
let memSess = null;
function save(){ if(!LS.set(DB)) { if(!save.warned){ save.warned = true; toast("Este navegador não está salvando. Os dados somem ao fechar."); } } }

/* Receitas e exercícios vindos dos arquivos */
const CATS = { cafe:"Café da manhã", almoco:"Almoço e jantar", salada:"Saladas", sopa:"Sopas", lanche:"Lanches", doce:"Sobremesas fit" };
const CAT_INI = { cafe:"CM", almoco:"AJ", salada:"SA", sopa:"SO", lanche:"LA", doce:"DO" };
const toRec = (r, i, extra) => ({ id: extra ? r.id : "r" + i, nome: r[0] ?? r.nome, cat: r[1] ?? r.cat, min: r[2] ?? r.min, porc: r[3] ?? r.porc, kcal: r[4] ?? r.kcal, p: r[5] ?? r.p, c: r[6] ?? r.c, g: r[7] ?? r.g, ing: (r[8] ?? r.ing).split("|"), passos: (r[9] ?? r.passos).split("|") });
const BASE_REC = [...window.R1, ...window.R2, ...window.R3, ...window.R4].map((r, i) => toRec(r, i));
function receitas(){ const oc = new Set(DB.receitasOcultas || []); return [...BASE_REC, ...(DB.receitasExtras || []).map(r => toRec(r, 0, true))].filter(r => !oc.has(r.id)); }
const toEx = e => Array.isArray(e) ? { id: e[0], nome: e[1], grupo: e[2], equip: e[3], passos: e[4].split("|"), erros: (e[5] || "").split("|").filter(Boolean), resp: e[6] || "Respire de forma contínua, sem prender o ar." } : e;
function exercicios(){ return [...window.EX.map(toEx), ...(DB.exercExtras || [])]; }
const exById = id => exercicios().find(e => e.id === id) || { id, nome: id, grupo: "", equip: "", passos: [], erros: [], resp: "" };
const PLANOS = window.PLANOS.map(p => ({ id: p[0], nome: p[1], nivel: p[2], obj: p[3], dias: p[4], desc: p[5], treinos: p[6].map(t => ({ nome: t[0], ex: t[1].map(x => ({ id: x[0], series: x[1], reps: x[2], desc: x[3] })) })) }));
const ALIM = window.ALIM.map((a, i) => ({ id: "a" + i, nome: a[0], porcao: a[1], kcal: a[2], p: a[3], c: a[4], g: a[5] }));

/* Semente: estrutura inicial e dados de exemplo para o painel */
function rng(seed){ let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function semente(){
  const r = rng(42);
  const pick = a => a[Math.floor(r() * a.length)];
  const db = {
    versao: 1, criado: today(),
    config: { nomeApp: "FitVerde", checkout: "", suporte: "", treinosParaCupom: 8, premiumPreco: 19.9 },
    freq: { cliques: 25, minutos: 4, intervalo: 3, maxDia: 6 },
    users: [], eventos: [], acessos: {},
    cidades: [ {id:1,nome:"Cuiabá",uf:"MT",ativa:true}, {id:2,nome:"Várzea Grande",uf:"MT",ativa:true}, {id:3,nome:"Rondonópolis",uf:"MT",ativa:true}, {id:4,nome:"Sinop",uf:"MT",ativa:true}, {id:5,nome:"Outra cidade",uf:"",ativa:true} ],
    segmentos: [ {id:1,nome:"Academia",ativo:true}, {id:2,nome:"Suplementos",ativo:true}, {id:3,nome:"Restaurante saudável",ativo:true}, {id:4,nome:"Moda fitness",ativo:true}, {id:5,nome:"Clínica e estética",ativo:true} ],
    anunciantes: [], campanhas: [], pagamentos: [], profissionais: [], parceiros: [], cupons: [], avisos: [],
    receitasExtras: [], receitasOcultas: [], exercExtras: []
  };
  db.anunciantes = [
    { id:"an1", nome:"Academia Força Total", seg:1, cidade:1, plano:"exclusivo", valor:450, contato:"Marcos", tel:"(65) 99811-2201", obs:"", ativo:true, exemplo:true },
    { id:"an2", nome:"Nutri Suplementos", seg:2, cidade:1, plano:"comercial", valor:250, contato:"Paula", tel:"(65) 99742-1180", obs:"", ativo:true, exemplo:true },
    { id:"an3", nome:"Verde Marmitas Fit", seg:3, cidade:2, plano:"comercial", valor:200, contato:"Rafa", tel:"(65) 99620-3344", obs:"", ativo:true, exemplo:true }
  ];
  const ini = addD(today(), -29);
  db.campanhas = [
    { id:"cp1", anunc:"an1", titulo:"Primeiro mês grátis na Força Total", texto:"Mostre o app na recepção e treine 30 dias sem pagar matrícula.", destino:"whatsapp", botao:"Quero meu mês grátis", whats:"65998112201", msg:"Oi! Vi o anúncio no FitVerde e quero o mês grátis.", insta:"", site:"", genero:"todos", idMin:16, idMax:70, cidade:1, inicio:ini, fim:"", ativa:true, exemplo:true },
    { id:"cp2", anunc:"an2", titulo:"Whey com 15% de desconto", texto:"Use o cupom FITVERDE na loja ou no site.", destino:"instagram", botao:"Ver no Instagram", whats:"", msg:"", insta:"nutrisuplementos", site:"", genero:"todos", idMin:18, idMax:60, cidade:"", inicio:ini, fim:"", ativa:true, exemplo:true },
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
  db.avisos = [ { id:"av1", titulo:"Bem-vindo ao FitVerde", texto:"Monte seu prato, siga o plano de treino e ganhe cupons nas lojas parceiras a cada 8 treinos concluídos.", d:today(), ativo:true } ];
  const nomes = ["Ana","Bruno","Carla","Diego","Elaine","Felipe","Gabriela","Henrique","Isabela","João","Karina","Lucas","Mariana","Natália","Otávio","Patrícia","Rafael","Sabrina","Thiago","Vanessa","William","Yasmin","Larissa","Gustavo"];
  const sob = ["Silva","Souza","Oliveira","Costa","Pereira","Lima","Almeida","Ferreira"];
  nomes.forEach((n, i) => {
    const gen = /a$|e$|in$|el$/.test(n) && !["Felipe","Henrique","Rafael"].includes(n) ? "feminino" : "masculino";
    const cad = addD(today(), -Math.floor(r() * 60));
    const ano = 1975 + Math.floor(r() * 30);
    const u = { id:"ex" + i, nome: n + " " + pick(sob), email: n.toLowerCase() + i + "@exemplo.com", senha:"", whats:"(65) 9" + Math.floor(80000000 + r() * 19999999), nasc: `${ano}-0${1 + Math.floor(r() * 9)}-1${Math.floor(r() * 9)}`, genero: gen, cidade: 1 + Math.floor(r() * 4), criado: cad, exemplo: true, admin:false, bloqueado:false,
      premium: r() < .3 ? { tipo: pick(["pago","pago","cortesia"]), ate: addD(today(), 20) } : (cad > addD(today(), -7) ? { tipo:"teste", ate: addD(cad, 7) } : null),
      perfil: { peso: 55 + Math.round(r() * 40), altura: 155 + Math.round(r() * 30), objetivo: pick(["emagrecer","manter","ganhar"]), atividade: 1.375, nivel:"iniciante" }, diario:{}, pesos:[], treinos:[], favs:[], plano: pick(["iniciante","abc","casa","hiit"]) };
    for(let d = 0; d < 30; d++){ const dia = addD(today(), -d); if(dia < cad) break; if(r() < .45){ (db.acessos[dia] = db.acessos[dia] || []).push(u.id); if(r() < .5) u.treinos.push({ d: dia, plano: u.plano, dia: 0, min: 35 + Math.floor(r() * 30) }); } }
    db.users.push(u);
  });
  // impressões e cliques de exemplo
  for(let d = 0; d < 30; d++){
    const dia = addD(today(), -d);
    (db.acessos[dia] || []).forEach(u => { db.campanhas.forEach(c => { if(r() < .55){ db.eventos.push({ t:"imp", c:c.id, u, d:dia, ex:1 }); if(r() < .06) db.eventos.push({ t:"clk", c:c.id, u, d:dia, ex:1 }); } }); });
  }
  return db;
}
if(!DB || !DB.versao){ DB = semente(); save(); }

/* ---------- Sessão ---------- */
let ME = null;
const userById = id => DB.users.find(u => u.id === id);
function sessao(){ const id = LS.sess() || memSess; return id ? userById(id) : null; }
function setSess(id){ memSess = id; LS.sess(id); }
function logout(){ setSess(null); ME = null; stopTimer(); location.hash = ""; showLogin(); }
document.querySelectorAll("[data-logout]").forEach(b => b.onclick = logout);
function show(v){ ["v-login","v-onb","v-bloq","v-app","v-admin"].forEach(x => $(x).hidden = x !== v); window.scrollTo(0, 0); }

/* ---------- Login e cadastro ---------- */
function lmsg(t, ok){ if(t && !ok) window.SOM.erro(); const m = $("login-msg"); m.hidden = !t; m.className = "msg " + (ok ? "msg-ok" : "msg-bad"); m.textContent = t || ""; }
function modoAuth(cad){ $("tg-login").setAttribute("aria-pressed", !cad); $("tg-cad").setAttribute("aria-pressed", cad); $("f-login").hidden = cad; $("f-cad").hidden = !cad; lmsg(""); }
$("tg-login").onclick = () => modoAuth(false);
$("tg-cad").onclick = () => modoAuth(true);
function showLogin(){
  $("c-cid").innerHTML = DB.cidades.filter(c => c.ativa).map(c => `<option value="${c.id}">${esc(c.nome)}${c.uf ? " · " + esc(c.uf) : ""}</option>`).join("");
  show("v-login");
}
$("f-login").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("l-email").value.trim().toLowerCase(), s = $("l-senha").value;
  if(!email || !s) return lmsg("Preencha e-mail e senha.");
  const u = DB.users.find(x => x.email === email);
  if(!u || !u.senha || u.senha !== await hash(s)) return lmsg("E-mail ou senha não conferem.");
  setSess(u.id); window.SOM.chime(); entrar();
});
$("b-esqueci").onclick = () => lmsg("Peça ao administrador para criar uma senha nova para você. Ele faz isso em Painel > Alunos > Editar.", true);
$("f-cad").addEventListener("submit", async e => {
  e.preventDefault();
  const v = id => $(id).value.trim();
  const email = v("c-email").toLowerCase();
  if(!v("c-nome")) return lmsg("Digite seu nome.");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return lmsg("Digite um e-mail válido.");
  if($("c-senha").value.length < 6) return lmsg("A senha precisa ter pelo menos 6 caracteres.");
  if($("c-senha").value !== $("c-senha2").value) return lmsg("As duas senhas estão diferentes.");
  if(DB.users.some(u => u.email === email)) return lmsg("Já existe uma conta com esse e-mail. Toque em Entrar.");
  if(!v("c-nasc")) return lmsg("Informe sua data de nascimento.");
  const primeiro = !DB.users.some(u => !u.exemplo);
  const u = { id: uid(), nome: v("c-nome"), email, senha: await hash($("c-senha").value), whats: v("c-whats"), nasc: v("c-nasc"), genero: $("c-gen").value, cidade: +$("c-cid").value, criado: today(),
    admin: primeiro, perms: primeiro ? { total: true } : null, bloqueado:false, premium: { tipo:"teste", ate: addD(today(), 7) }, perfil: null, diario:{}, pesos:[], treinos:[], favs:[], plano:"iniciante" };
  DB.users.push(u); save(); setSess(u.id);
  window.SOM.chime(); if(primeiro) toast("Você é o administrador principal deste app");
  entrar();
});

/* ---------- Boas-vindas ---------- */
let OB = null;
function onboarding(){
  OB = OB || { passo: 0, objetivo: "emagrecer", atividade: 1.375, nivel: "iniciante", peso: "", altura: "" };
  const P = [
    { t: "Qual é o seu objetivo?", k: "objetivo", o: [["emagrecer","Emagrecer","Perder gordura com déficit calórico"],["manter","Manter e definir","Comer na medida e melhorar o corpo"],["ganhar","Ganhar massa","Superávit leve e treino de força"]] },
    { t: "Como é sua rotina?", k: "atividade", o: [[1.2,"Parado","Trabalho sentado, quase sem exercício"],[1.375,"Pouco ativo","Exercício 1 a 3 vezes por semana"],[1.55,"Ativo","Exercício 3 a 5 vezes por semana"],[1.725,"Muito ativo","Treino pesado quase todo dia"]] },
    { t: "Seu nível de treino", k: "nivel", o: [["iniciante","Iniciante","Nunca treinei ou parei há muito tempo"],["intermediario","Intermediário","Treino há alguns meses"],["avancado","Avançado","Treino há mais de 1 ano"]] }
  ];
  const dots = `<div class="steps-dots">${[0,1,2,3].map(i => `<i class="${i <= OB.passo ? "on" : ""}"></i>`).join("")}</div>`;
  if(OB.passo < 3){
    const p = P[OB.passo];
    $("onb").innerHTML = `${dots}<h1 class="bigtitle" style="font-size:44px">${p.t}</h1><div class="opts">${p.o.map(o => `<button class="opt" data-v="${o[0]}" aria-pressed="${String(OB[p.k]) === String(o[0])}">${o[1]}<small>${o[2]}</small></button>`).join("")}</div>
      <div class="row2">${OB.passo ? `<button class="btn btn-line" id="ob-back">Voltar</button>` : "<span></span>"}<button class="btn btn-accent" id="ob-next">Continuar</button></div>`;
    $("onb").querySelectorAll(".opt").forEach(b => b.onclick = () => { const v = b.dataset.v; OB[p.k] = isNaN(+v) ? v : +v; onboarding(); });
  } else {
    $("onb").innerHTML = `${dots}<h1 class="bigtitle" style="font-size:44px">Suas medidas</h1><p class="muted" style="margin:0">Usamos para calcular suas calorias e proteínas do dia.</p>
      <div class="row2"><div class="field"><label for="ob-peso">Peso (kg)</label><input class="input num" id="ob-peso" inputmode="decimal" value="${esc(OB.peso)}" placeholder="70"></div>
      <div class="field"><label for="ob-alt">Altura (cm)</label><input class="input num" id="ob-alt" inputmode="numeric" value="${esc(OB.altura)}" placeholder="170"></div></div>
      <div id="ob-msg"></div>
      <div class="row2"><button class="btn btn-line" id="ob-back">Voltar</button><button class="btn btn-accent" id="ob-next">Montar meu plano</button></div>`;
  }
  const back = $("ob-back"); if(back) back.onclick = () => { OB.passo--; onboarding(); };
  $("ob-next").onclick = () => {
    if(OB.passo < 3){ OB.passo++; onboarding(); return; }
    const peso = parseFloat(String($("ob-peso").value).replace(",", ".")), alt = parseFloat($("ob-alt").value);
    if(!(peso > 30 && peso < 300) || !(alt > 120 && alt < 230)){ $("ob-msg").innerHTML = `<div class="msg msg-bad">Confira peso (em kg) e altura (em cm).</div>`; return; }
    ME.perfil = { peso, altura: alt, objetivo: OB.objetivo, atividade: OB.atividade, nivel: OB.nivel };
    ME.pesos = [{ d: today(), kg: peso }];
    ME.plano = OB.nivel === "iniciante" ? "iniciante" : OB.objetivo === "emagrecer" ? "hiit" : OB.nivel === "avancado" ? "forca" : "abc";
    save(); OB = null; window.SOM.done(); abrirApp();
  };
}

/* ---------- Metas ---------- */
function metas(u){
  const p = u.perfil || { peso: 70, altura: 170, objetivo: "manter", atividade: 1.375 };
  if(p.metaManual) return p.metaManual;
  const id = idade(u.nasc) || 30;
  const tmb = 10 * p.peso + 6.25 * p.altura - 5 * id + (u.genero === "masculino" ? 5 : -161);
  const fat = { emagrecer: .8, manter: 1, ganhar: 1.1 }[p.objetivo] || 1;
  const kcal = Math.round(tmb * p.atividade * fat / 10) * 10;
  const prot = Math.round(p.peso * (p.objetivo === "manter" ? 1.6 : 2));
  const gord = Math.round(p.peso * .9);
  const carb = Math.max(50, Math.round((kcal - prot * 4 - gord * 9) / 4));
  return { kcal, p: prot, c: carb, g: gord, agua: Math.round(p.peso * 35 / 250) };
}
const REFS = [["cafe","Café da manhã"],["almoco","Almoço"],["lanche","Lanche"],["jantar","Jantar"]];
function dia(d){ ME.diario = ME.diario || {}; return ME.diario[d] || (ME.diario[d] = { cafe:[], almoco:[], lanche:[], jantar:[], agua:0 }); }
function totais(d){ const x = dia(d), t = { kcal:0, p:0, c:0, g:0 }; REFS.forEach(([k]) => (x[k] || []).forEach(i => { t.kcal += i.kcal; t.p += i.p; t.c += i.c; t.g += i.g; })); return t; }
function marcaAcesso(){ const d = today(); DB.acessos[d] = DB.acessos[d] || []; if(!DB.acessos[d].includes(ME.id)) { DB.acessos[d].push(ME.id); save(); } }
function streak(){
  const set = new Set(); (ME.treinos || []).forEach(t => set.add(t.d)); Object.entries(ME.diario || {}).forEach(([d, x]) => { if(REFS.some(([k]) => (x[k] || []).length)) set.add(d); });
  let d = today(); if(!set.has(d)) d = addD(d, -1); let n = 0; while(set.has(d)){ n++; d = addD(d, -1); } return n;
}
const isPremium = u => !!(u.premium && (u.premium.tipo === "vitalicio" || u.premium.ate >= today()));

/* ---------- Abertura ---------- */
function entrar(){
  ME = sessao();
  if(!ME){ showLogin(); return; }
  if(ME.bloqueado){ show("v-bloq"); return; }
  ME.ultimo = today(); marcaAcesso();
  if(!ME.perfil){ show("v-onb"); onboarding(); return; }
  if(location.hash.startsWith("#admin") && ME.admin){ window.ADMIN.abrir(); return; }
  abrirApp();
}
let TAB = "hoje";
function abrirApp(){
  show("v-app");
  $("b-adm").hidden = !ME.admin;
  if(location.hash === "#admin") history.replaceState(null, "", location.pathname);
  tab(TAB);
}
$("b-adm").onclick = () => window.ADMIN.abrir();
document.querySelectorAll(".nav [data-tab]").forEach(b => b.onclick = () => tab(b.dataset.tab));
function tab(t){
  if(TAB !== t) window.SOM.tap();
  TAB = t;
  document.querySelectorAll(".nav [data-tab]").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === t));
  ["hoje","dieta","receitas","treino","perfil"].forEach(x => $("t-" + x).hidden = x !== t);
  const s = streak(); $("streak-chip").innerHTML = `${s} ${s === 1 ? "dia" : "dias"}`; $("streak-chip").title = "Dias seguidos com treino ou dieta registrada";
  ({ hoje: rHoje, dieta: rDieta, receitas: rReceitas, treino: rTreino, perfil: rPerfil })[t]();
  window.scrollTo(0, 0);
}

/* ---------- Folha (tela por cima) ---------- */
let sheetClose = null;
function sheet(title, html, onClose){ $("sheet-title").textContent = title; $("sheet-body").innerHTML = html; $("sheet").hidden = false; $("sheet").scrollTop = 0; document.body.style.overflow = "hidden"; sheetClose = onClose || null; }
function fecharSheet(){ $("sheet").hidden = true; document.body.style.overflow = ""; const f = sheetClose; sheetClose = null; if(f) f(); }
$("sheet-close").onclick = fecharSheet;
document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("sheet").hidden) fecharSheet(); });

/* ---------- HOJE ---------- */
function ring(val, max, size = 118){
  const r = size / 2 - 9, C = 2 * Math.PI * r, f = Math.min(1, max ? val / max : 0);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(127,127,127,.25)" stroke-width="12"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${val > max ? "var(--bad)" : "var(--hero-accent)"}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - f)}"/></svg>`;
}
function macroBars(t, m){
  return `<div class="macros">${[["Proteína","p"],["Carbo","c"],["Gordura","g"]].map(([n, k]) => `<div class="mac"><span>${n}</span><span class="tr"><i style="width:${Math.min(100, 100 * t[k] / m[k])}%"></i></span><span class="num">${int(t[k])}/${m[k]} g</span></div>`).join("")}</div>`;
}
function rHoje(){
  const m = metas(ME), d = today(), t = totais(d), x = dia(d);
  const resta = m.kcal - t.kcal;
  const plano = PLANOS.find(p => p.id === ME.plano) || PLANOS[0];
  const prox = (ME.treinos || []).filter(tr => tr.plano === plano.id).length % plano.treinos.length;
  const fezHoje = (ME.treinos || []).some(tr => tr.d === d);
  const h = new Date().getHours(), oi = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const av = (DB.avisos || []).filter(a => a.ativo).slice(-1)[0];
  const nTreinos = (ME.treinos || []).length, meta = DB.config.treinosParaCupom || 8;
  const sug = sugestoes();
  $("t-hoje").innerHTML = `
    <div class="hello"><div class="k">${oi}</div><h2>${esc(ME.nome.split(" ")[0])}</h2></div>
    ${av ? `<div class="notice"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="flex:0 0 auto;margin-top:2px;color:var(--accent-strong)"><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg><div><b>${esc(av.titulo)}</b><p>${esc(av.texto)}</p></div></div>` : ""}
    <div class="hero">
      <div class="ring">${ring(t.kcal, m.kcal)}<b class="num">${int(Math.abs(resta))}<small>${resta >= 0 ? "KCAL RESTAM" : "KCAL ACIMA"}</small></b></div>
      <div><div class="eyebrow">Calorias de hoje</div><div style="font-family:var(--display);font-size:30px;font-weight:800;line-height:1" class="num">${int(t.kcal)} <span style="opacity:.6">/ ${int(m.kcal)}</span></div>${macroBars(t, m)}</div>
    </div>
    <div class="card">
      <div class="sec-title"><h3>Água</h3><span class="muted num">${x.agua || 0} de ${m.agua} copos (250 ml)</span></div>
      <div class="water">${Array.from({ length: Math.max(m.agua, (x.agua || 0)) }, (_, i) => `<button class="cup ${i < (x.agua || 0) ? "on" : ""}" data-cup="${i}" aria-label="Copo ${i + 1}"></button>`).join("")}</div>
    </div>
    <div class="card">
      <div class="sec-title"><h3>Treino de hoje</h3><span class="muted">${esc(plano.nome)}</span></div>
      ${fezHoje ? `<p style="margin:8px 0 0">Treino de hoje concluído. Descanse e coma bem.</p>` : `<p style="margin:8px 0 12px"><b>${esc(plano.treinos[prox].nome)}</b> · ${plano.treinos[prox].ex.length} exercícios · cerca de ${plano.treinos[prox].ex.length * 7} min</p><button class="btn btn-accent btn-block" id="h-treinar">Começar treino</button>`}
    </div>
    <div class="statgrid">
      <div class="stat"><b class="num">${streak()}</b><span>dias seguidos</span></div>
      <div class="stat"><b class="num">${nTreinos}</b><span>treinos feitos</span></div>
      <div class="stat"><b class="num">${ME.pesos && ME.pesos.length ? String(ME.pesos[ME.pesos.length - 1].kg).replace(".", ",") : "-"}</b><span>kg atual</span></div>
    </div>
    <div class="card">
      <div class="sec-title"><h3>Cupons de desconto</h3><span class="muted num">${nTreinos % meta}/${meta}</span></div>
      <p class="hint" style="margin:6px 0 10px">A cada ${meta} treinos concluídos você ganha um cupom numa loja parceira.</p>
      <div class="prog"><i style="width:${100 * (nTreinos % meta) / meta}%"></i></div>
    </div>
    <div class="sec-title"><h3>Sugestões para agora</h3><button class="link" id="h-rec">Ver receitas</button></div>
    <div class="rgrid">${sug.map(rCard).join("")}</div>`;
  $("t-hoje").querySelectorAll("[data-cup]").forEach(b => b.onclick = () => { const i = +b.dataset.cup; const antes = x.agua || 0; x.agua = antes === i + 1 ? i : i + 1; (x.agua > antes ? window.SOM.water : window.SOM.remove)(); save(); rHoje(); });
  const bt = $("h-treinar"); if(bt) bt.onclick = () => abrirSessao(plano.id, prox, true);
  $("h-rec").onclick = () => tab("receitas");
  bindRec($("t-hoje"));
}
function sugestoes(){
  const h = new Date().getHours(), cat = h < 10 ? "cafe" : h < 15 ? "almoco" : h < 18 ? "lanche" : "almoco";
  const L = receitas().filter(r => r.cat === cat), s = new Date().getDate();
  return [0, 1, 2].map(i => L[(s * 7 + i * 13) % L.length]).filter(Boolean);
}

/* ---------- DIETA ---------- */
let DD = today();
function rDieta(){
  const m = metas(ME), t = totais(DD), x = dia(DD);
  const rot = DD === today() ? "Hoje" : DD === addD(today(), -1) ? "Ontem" : brD(DD);
  $("t-dieta").innerHTML = `
    <div class="datebar"><button class="iconbtn" id="d-prev" aria-label="Dia anterior">‹</button><b>${rot}</b><button class="iconbtn" id="d-next" aria-label="Próximo dia" ${DD >= today() ? "disabled" : ""}>›</button></div>
    <div class="hero"><div class="ring">${ring(t.kcal, m.kcal, 104)}<b class="num" style="font-size:24px">${int(t.kcal)}<small>DE ${int(m.kcal)}</small></b></div><div><div class="eyebrow">Total do dia</div>${macroBars(t, m)}</div></div>
    ${REFS.map(([k, n]) => { const L = x[k] || [], kc = L.reduce((a, i) => a + i.kcal, 0); return `<div class="meal"><div class="meal-h"><h4>${n}</h4><span class="num">${int(kc)} kcal</span></div>
      ${L.map((i, j) => `<div class="item"><div><b>${esc(i.nome)}</b><small>${esc(i.qtd)} · P ${int(i.p)} g · C ${int(i.c)} g · G ${int(i.g)} g</small></div><span class="num" style="font-weight:800">${int(i.kcal)}</span><button class="x" data-del="${k}:${j}" aria-label="Remover ${esc(i.nome)}">×</button></div>`).join("")}
      <button class="addrow" data-add="${k}">+ Adicionar alimento</button></div>`; }).join("")}
    <p class="hint" style="margin:0">Valores nutricionais aproximados, de tabelas de referência. Para um plano individual, consulte um nutricionista na aba Perfil.</p>`;
  $("d-prev").onclick = () => { DD = addD(DD, -1); rDieta(); };
  $("d-next").onclick = () => { if(DD < today()){ DD = addD(DD, 1); rDieta(); } };
  $("t-dieta").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { const [k, j] = b.dataset.del.split(":"); x[k].splice(+j, 1); window.SOM.remove(); save(); rDieta(); });
  $("t-dieta").querySelectorAll("[data-add]").forEach(b => b.onclick = () => addAlimento(b.dataset.add));
}
function addAlimento(ref, pre){
  let q = "", src = "alim";
  const draw = () => {
    const L = src === "alim" ? ALIM : receitas().map(r => ({ id: r.id, nome: r.nome, porcao: "1 porção", kcal: r.kcal, p: r.p, c: r.c, g: r.g }));
    const f = q ? L.filter(a => norm(a.nome).includes(norm(q))) : L;
    $("sa-list").innerHTML = f.slice(0, 60).map(a => `<div class="item"><div><b>${esc(a.nome)}</b><small>${esc(a.porcao)} · ${int(a.kcal)} kcal · P ${a.p} g</small></div><select class="input" data-q="${a.id}" aria-label="Quantidade" style="width:76px;padding:8px">${[0.5,1,1.5,2,3].map(n => `<option value="${n}" ${n === 1 ? "selected" : ""}>${String(n).replace(".", ",")}x</option>`).join("")}</select><button class="x" style="background:var(--accent);color:var(--accent-ink)" data-pick="${a.id}" aria-label="Adicionar ${esc(a.nome)}">+</button></div>`).join("") || `<div class="empty">Nada encontrado. Use "Alimento personalizado" abaixo.</div>`;
    $("sa-list").querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
      const a = L.find(z => z.id === b.dataset.pick), n = +$("sa-list").querySelector(`[data-q="${a.id}"]`).value;
      push(ref, { nome: a.nome, qtd: (n === 1 ? "" : String(n).replace(".", ",") + "x ") + a.porcao, kcal: a.kcal * n, p: a.p * n, c: a.c * n, g: a.g * n });
    });
  };
  const push = (k, it) => { dia(DD)[k].push(it); window.SOM.add(); save(); toast("Adicionado: " + it.nome); fecharSheet(); };
  sheet("Adicionar no " + REFS.find(r => r[0] === ref)[1].toLowerCase(), `
    <div class="field"><label for="sa-ref">Refeição</label><select class="input" id="sa-ref">${REFS.map(([k, n]) => `<option value="${k}" ${k === ref ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="seg" role="group"><button id="sa-a" aria-pressed="true">Alimentos</button><button id="sa-r" aria-pressed="false">Receitas do app</button></div>
    <div class="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input class="input" id="sa-q" placeholder="Buscar: arroz, frango, banana..." autocomplete="off"></div>
    <div class="meal" id="sa-list" style="border-top:0"></div>
    <details class="card"><summary style="cursor:pointer;font-weight:800">Alimento personalizado</summary>
      <div class="formgrid" style="margin-top:12px"><div class="field full"><label for="sp-n">Nome</label><input class="input" id="sp-n"></div>
      <div class="field"><label for="sp-k">Calorias</label><input class="input" id="sp-k" inputmode="numeric"></div><div class="field"><label for="sp-p">Proteína (g)</label><input class="input" id="sp-p" inputmode="decimal"></div>
      <div class="field"><label for="sp-c">Carbo (g)</label><input class="input" id="sp-c" inputmode="decimal"></div><div class="field"><label for="sp-g">Gordura (g)</label><input class="input" id="sp-g" inputmode="decimal"></div></div>
      <button class="btn btn-accent btn-block" id="sp-ok" style="margin-top:12px">Adicionar</button></details>`, () => { if(TAB === "dieta") rDieta(); else if(TAB === "hoje") rHoje(); });
  $("sa-ref").onchange = e => { ref = e.target.value; };
  $("sa-q").oninput = e => { q = e.target.value; draw(); };
  $("sa-a").onclick = () => { src = "alim"; $("sa-a").setAttribute("aria-pressed", true); $("sa-r").setAttribute("aria-pressed", false); draw(); };
  $("sa-r").onclick = () => { src = "rec"; $("sa-r").setAttribute("aria-pressed", true); $("sa-a").setAttribute("aria-pressed", false); draw(); };
  $("sp-ok").onclick = () => { const n = $("sp-n").value.trim(), num = id => parseFloat(String($(id).value).replace(",", ".")) || 0; if(!n || !num("sp-k")){ window.SOM.erro(); return toast("Preencha nome e calorias"); } push(ref, { nome: n, qtd: "porção", kcal: num("sp-k"), p: num("sp-p"), c: num("sp-c"), g: num("sp-g") }); };
  if(pre){ src = "rec"; $("sa-r").click(); }
  draw();
}
const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* ---------- RECEITAS ---------- */
let RF = { q: "", cat: "", fav: false, n: 30 };
function rCard(r){ return `<button class="rcard" data-rec="${r.id}"><span class="rthumb ${r.cat === "doce" ? "doce" : ""}">${CAT_INI[r.cat] || "FV"}</span><span style="min-width:0"><b>${esc(r.nome)}</b><small class="num">${r.kcal} kcal · ${r.p} g proteína · ${r.min} min</small><span class="tagline"><span class="tag ${r.cat === "doce" ? "" : "g"}">${CATS[r.cat] || r.cat}</span>${(ME.favs || []).includes(r.id) ? `<span class="tag g">Favorita</span>` : ""}</span></span></button>`; }
function bindRec(root){ root.querySelectorAll("[data-rec]").forEach(b => b.onclick = () => abrirReceita(b.dataset.rec)); }
function rReceitas(){
  const all = receitas();
  const sal = all.filter(r => r.cat !== "doce").length, doc = all.length - sal;
  $("t-receitas").innerHTML = `
    <div class="sec-title"><h3 style="font-size:38px">Receitas</h3><span class="muted num">${sal} salgadas · ${doc} doces</span></div>
    <div class="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input class="input" id="r-q" placeholder="Buscar receita ou ingrediente" value="${esc(RF.q)}" autocomplete="off"></div>
    <div class="chips scroll" id="r-cats">${[["","Todas"], ...Object.entries(CATS)].map(([k, n]) => `<button class="chip" data-cat="${k}" aria-pressed="${RF.cat === k && !RF.fav}">${n}</button>`).join("")}<button class="chip" data-fav="1" aria-pressed="${RF.fav}">Favoritas</button></div>
    <div id="r-list"></div>`;
  const draw = () => {
    let L = all;
    if(RF.fav) L = L.filter(r => (ME.favs || []).includes(r.id)); else if(RF.cat) L = L.filter(r => r.cat === RF.cat);
    if(RF.q){ const q = norm(RF.q); L = L.filter(r => norm(r.nome + " " + r.ing.join(" ")).includes(q)); }
    $("r-list").innerHTML = L.length ? `<p class="hint" style="margin:0 0 10px">${L.length} ${L.length === 1 ? "receita" : "receitas"}</p><div class="rgrid">${L.slice(0, RF.n).map(rCard).join("")}</div>${L.length > RF.n ? `<div class="more" style="margin-top:12px"><button class="btn btn-line" id="r-more">Mostrar mais ${Math.min(30, L.length - RF.n)}</button></div>` : ""}` : `<div class="empty">${RF.fav ? "Você ainda não favoritou nenhuma receita. Abra uma receita e toque em Favoritar." : "Nenhuma receita com esse nome ou ingrediente."}</div>`;
    bindRec($("r-list"));
    const mb = $("r-more"); if(mb) mb.onclick = () => { RF.n += 30; draw(); };
  };
  $("r-q").oninput = e => { RF.q = e.target.value; RF.n = 30; draw(); };
  $("r-cats").querySelectorAll(".chip").forEach(b => b.onclick = () => { if(b.dataset.fav){ RF.fav = !RF.fav; } else { RF.fav = false; RF.cat = b.dataset.cat; } RF.n = 30; $("r-cats").querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.fav ? RF.fav : (!RF.fav && c.dataset.cat === RF.cat))); draw(); });
  draw();
}
function abrirReceita(id){
  const r = receitas().find(x => x.id === id); if(!r) return;
  const fav = (ME.favs || []).includes(id);
  sheet(r.nome, `
    <div class="tagline"><span class="tag ${r.cat === "doce" ? "" : "g"}">${CATS[r.cat]}</span><span class="tag">${r.min} min</span><span class="tag">${r.porc} ${r.porc === 1 ? "porção" : "porções"}</span></div>
    <div class="macrobox"><div><b class="num">${r.kcal}</b><span>kcal</span></div><div><b class="num">${r.p}</b><span>Proteína</span></div><div><b class="num">${r.c}</b><span>Carbo</span></div><div><b class="num">${r.g}</b><span>Gordura</span></div></div>
    <p class="hint" style="margin:-8px 0 0">Valores por porção, aproximados.</p>
    <div><h4 style="font-size:24px;margin-bottom:10px">Ingredientes</h4><ul class="ing">${r.ing.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>
    <div><h4 style="font-size:24px;margin-bottom:12px">Modo de preparo</h4><ol class="steps">${r.passos.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ol></div>
    <div class="row2"><button class="btn btn-line" id="rc-fav">${fav ? "Tirar dos favoritos" : "Favoritar"}</button><button class="btn btn-accent" id="rc-add">Comi esta receita</button></div>`, () => { if(TAB === "receitas") rReceitas(); });
  $("rc-fav").onclick = () => { ME.favs = ME.favs || []; if(fav){ ME.favs = ME.favs.filter(x => x !== id); window.SOM.remove(); } else { ME.favs.push(id); window.SOM.fav(); } save(); toast(fav ? "Removida dos favoritos" : "Salva nos favoritos"); abrirReceita(id); };
  $("rc-add").onclick = () => {
    const h = new Date().getHours(), k = r.cat === "cafe" ? "cafe" : r.cat === "lanche" || r.cat === "doce" ? "lanche" : h < 16 ? "almoco" : "jantar";
    DD = today(); dia(DD)[k].push({ nome: r.nome, qtd: "1 porção", kcal: r.kcal, p: r.p, c: r.c, g: r.g }); window.SOM.add(); save();
    toast("Adicionada ao " + REFS.find(x => x[0] === k)[1].toLowerCase() + " de hoje");
  };
}

/* ---------- TREINO ---------- */
let TV = "plano", GF = "", MODF = "";
function rTreino(){
  const plano = PLANOS.find(p => p.id === ME.plano) || PLANOS[0];
  const seg = `<div class="seg" role="group"><button data-v="plano" aria-pressed="${TV === "plano"}">Meu plano</button><button data-v="planos" aria-pressed="${TV === "planos"}">Trocar plano</button><button data-v="lib" aria-pressed="${TV === "lib"}">Exercícios</button><button data-v="hist" aria-pressed="${TV === "hist"}">Histórico</button></div>`;
  let body = "";
  if(TV === "plano"){
    const prox = (ME.treinos || []).filter(t => t.plano === plano.id).length % plano.treinos.length;
    body = `<div class="card flat" style="padding:0"><h3 style="font-size:34px">${esc(plano.nome)}</h3><p class="muted" style="margin:6px 0 0">${esc(plano.desc)}</p><div class="tagline" style="margin-top:8px"><span class="tag g">${plano.nivel}</span><span class="tag">${plano.dias}x por semana</span><span class="tag">${esc(plano.obj)}</span></div></div>
      ${plano.treinos.map((t, i) => `<div class="dayblock"><div class="dh"><h4>${esc(t.nome)}</h4>${i === prox ? `<span class="st ok">Próximo</span>` : ""}<button class="btn btn-accent btn-sm" data-start="${i}">Começar</button></div>
        ${t.ex.map((x, j) => { const e = exById(x.id); return `<button class="exrow" data-ex="${x.id}">${thumbEx(x.id)}<span style="min-width:0"><b>${j + 1}. ${esc(e.nome)}</b><small>${esc(musNomes(e).slice(0, 2).join(", "))} · descanso ${x.desc}s</small></span><span class="sr num">${x.series}×${esc(x.reps)}<small>SÉRIES×REPS</small></span></button>`; }).join("")}</div>`).join("")}`;
  } else if(TV === "planos"){
    body = PLANOS.map(p => `<button class="plan ${p.id === plano.id ? "on" : ""}" data-plan="${p.id}"><h4>${esc(p.nome)}</h4><p>${esc(p.desc)}</p><span class="tagline"><span class="tag g">${p.nivel}</span><span class="tag">${p.dias}x por semana</span><span class="tag">${p.treinos.length} treinos</span>${p.id === plano.id ? `<span class="tag g">Plano atual</span>` : ""}</span></button>`).join("");
  } else if(TV === "lib"){
    const ex = exercicios(), M = window.BONECO.MUSC;
    const usados = Object.keys(M).filter(m => ex.some(e => { const i = window.BONECO.info(e); return i.prim.includes(m); }));
    const L = GF ? ex.filter(e => window.BONECO.info(e).prim.includes(GF) || (MODF === "sec" && window.BONECO.info(e).sec.includes(GF))) : ex;
    body = `<p class="hint" style="margin:0">Escolha o músculo para ver os exercícios que trabalham ele. Toque no exercício para ver o boneco fazendo.</p>
      <div class="chips scroll">${["", ...usados].map(g => `<button class="chip" data-g="${g}" aria-pressed="${GF === g}">${g ? M[g] : "Todos"}</button>`).join("")}</div>
      <div class="dayblock">${L.map((e, j) => `<button class="exrow" data-ex="${e.id}" ${j === 0 ? 'style="border-top:0"' : ""}>${thumbEx(e.id)}<span style="min-width:0"><b>${esc(e.nome)}</b><small>${esc(musNomes(e).join(", "))}</small><span class="tagline"><span class="tag g">${window.BONECO.modalidade(e.id)}</span><span class="tag">${esc(e.equip)}</span></span></span><span aria-hidden="true">›</span></button>`).join("") || `<div class="empty">Nenhum exercício para esse músculo.</div>`}</div>`;
  } else {
    const H = (ME.treinos || []).slice().reverse();
    const sem = H.filter(t => t.d >= addD(today(), -6)).length;
    body = `<div class="statgrid"><div class="stat"><b class="num">${H.length}</b><span>no total</span></div><div class="stat"><b class="num">${sem}</b><span>nos últimos 7 dias</span></div><div class="stat"><b class="num">${int(H.reduce((a, t) => a + (t.min || 0), 0))}</b><span>minutos</span></div></div>
      ${H.length ? `<div class="dayblock">${H.slice(0, 40).map((t, j) => { const p = PLANOS.find(x => x.id === t.plano); return `<div class="exrow" ${j === 0 ? 'style="border-top:0"' : ""}><span class="exn" style="background:var(--accent);color:var(--accent-ink)">✓</span><span><b>${esc(p ? p.treinos[t.dia] ? p.treinos[t.dia].nome : p.nome : "Treino")}</b><small>${brD(t.d)} · ${t.min || "-"} min</small></span><span></span></div>`; }).join("")}</div>` : `<div class="empty">Nenhum treino concluído ainda. Comece pelo seu plano.</div>`}`;
  }
  $("t-treino").innerHTML = seg + body;
  $("t-treino").querySelectorAll(".seg [data-v]").forEach(b => b.onclick = () => { TV = b.dataset.v; rTreino(); });
  $("t-treino").querySelectorAll("[data-start]").forEach(b => b.onclick = () => abrirSessao(plano.id, +b.dataset.start, true));
  $("t-treino").querySelectorAll("[data-ex]").forEach(b => b.onclick = () => abrirExercicio(b.dataset.ex));
  $("t-treino").querySelectorAll("[data-plan]").forEach(b => b.onclick = () => { ME.plano = b.dataset.plan; window.SOM.check(); save(); TV = "plano"; toast("Plano alterado"); rTreino(); });
  $("t-treino").querySelectorAll("[data-g]").forEach(b => b.onclick = () => { GF = b.dataset.g; rTreino(); });
}
const sexoBoneco = () => ME.boneco || (ME.genero === "masculino" ? "m" : "f");
const thumbEx = id => `<span class="exn th" aria-hidden="true">${window.BONECO.thumb(exById(id), sexoBoneco())}</span>`;
const musNomes = e => { const i = window.BONECO.info(e); return [...i.prim, ...i.sec].map(m => window.BONECO.MUSC[m]); };
function howto(e, x){
  const inf = window.BONECO.info(e), M = window.BONECO.MUSC, sx = sexoBoneco();
  return `<div class="howto">
    <div class="player">
      <div class="stage-wrap"><div class="stage" id="bn-stage"></div><span class="cue" id="bn-cue"></span><span class="rep num" id="bn-rep"></span></div>
      <div class="pl-ctrl">
        <button class="btn btn-accent btn-sm" id="bn-play" data-mudo>Pausar</button>
        <div class="seg seg-sm" role="group" aria-label="Boneco"><button data-sx="f" aria-pressed="${sx === "f"}">Mulher</button><button data-sx="m" aria-pressed="${sx === "m"}">Homem</button></div>
        <button class="btn btn-line btn-sm" id="bn-speed">Velocidade 1x</button>
        <button class="btn btn-line btn-sm" id="bn-ritmo" data-mudo>Ritmo com som: desligado</button>
      </div>
    </div>
    ${x ? `<div class="fig"><div><b class="num">${x.series}</b><span>séries</span></div><div><b class="num" style="font-size:${String(x.reps).length > 5 ? 22 : 38}px">${esc(x.reps)}</b><span>repetições</span></div><div><b class="num">${x.desc}s</b><span>descanso</span></div></div>` : ""}
    <div><h4>Músculos trabalhados</h4>
      <div class="mus-list">${inf.prim.map(m => `<span class="mchip p"><i></i>${M[m]}</span>`).join("")}${inf.sec.map(m => `<span class="mchip"><i></i>${M[m]}</span>`).join("")}</div>
      <p class="hint" style="margin:8px 0 0">Vermelho forte: músculo principal. Vermelho claro: músculos que ajudam. No boneco, o músculo acende quando faz mais força.</p></div>
    <div class="tagline"><span class="tag g">${window.BONECO.modalidade(e.id)}</span><span class="tag">${esc(e.grupo)}</span><span class="tag">${esc(e.equip)}</span></div>
    <div><h4>Como fazer</h4><ol class="steps" style="margin-top:10px">${e.passos.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ol></div>
    ${e.erros.length ? `<div><h4>Erros comuns</h4><ul class="ing errs" style="margin-top:8px">${e.erros.map(p => `<li><span>${esc(p)}</span></li>`).join("")}</ul></div>` : ""}
    <div><h4>Respiração</h4><p style="margin:6px 0 0">${esc(e.resp)}</p></div>
    <a class="yt" href="${yt(e.nome + " execução correta")}" target="_blank" rel="noopener"><span class="play"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg></span><span><strong>Ver vídeo da execução</strong><span>Abre a busca no YouTube</span></span></a>
  </div>`;
}
let RITMO = false;
function bindPlayer(e){
  const host = $("bn-stage"); if(!host) return;
  const reduz = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pl = window.BONECO.mount(host, e, { sexo: sexoBoneco(), paused: reduz,
    onFrame: f => { const c = $("bn-cue"), r = $("bn-rep"); if(c && c.textContent !== f.cue) c.textContent = f.cue; if(r) r.textContent = "Repetição " + f.rep; },
    onBeat: h => { if(RITMO) (h ? window.SOM.beat2 : window.SOM.beat)(); } });
  const bp = $("bn-play"); bp.textContent = pl.playing ? "Pausar" : "Ver movimento";
  bp.onclick = () => { bp.textContent = pl.toggle() ? "Pausar" : "Continuar"; };
  document.querySelectorAll("[data-sx]").forEach(b => b.onclick = () => { ME.boneco = b.dataset.sx; save(); pl.setSexo(b.dataset.sx); document.querySelectorAll("[data-sx]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  let vel = 1; $("bn-speed").onclick = () => { vel = vel === 1 ? .5 : vel === .5 ? 1.5 : 1; pl.setSpeed(vel); $("bn-speed").textContent = "Velocidade " + String(vel).replace(".", ",") + "x"; };
  const br = $("bn-ritmo"); const pr = () => br.textContent = "Ritmo com som: " + (RITMO ? "ligado" : "desligado"); pr();
  br.onclick = () => { RITMO = !RITMO; pr(); if(RITMO) window.SOM.beat(); };
}
function abrirExercicio(id, x){ const e = exById(id); sheet(e.nome, howto(e, x), () => window.BONECO.stop()); bindPlayer(e); }

/* Sessão de treino */
let SES = null;
function abrirSessao(planoId, di, comecar){
  const p = PLANOS.find(x => x.id === planoId), t = p.treinos[di];
  const novo = !(SES && SES.plano === planoId && SES.dia === di);
  SES = novo ? { plano: planoId, dia: di, ini: Date.now(), feito: {} } : SES;
  if(comecar){ window.SOM.bell(); if(novo) setTimeout(() => toast("Treino começou. Bom treino!"), 200); }
  const draw = () => {
    const tot = t.ex.reduce((a, x) => a + x.series, 0), ok = Object.values(SES.feito).filter(Boolean).length;
    $("sheet-body").innerHTML = `
      <div class="prog"><i style="width:${100 * ok / tot}%"></i></div>
      <p class="hint" style="margin:-6px 0 0" class="num">${ok} de ${tot} séries · toque na série quando terminar para iniciar o descanso</p>
      ${t.ex.map((x, j) => { const e = exById(x.id); return `<div class="dayblock"><button class="exrow" style="border-top:0" data-how="${j}">${thumbEx(x.id)}<span style="min-width:0"><b>${j + 1}. ${esc(e.nome)}</b><small>Toque para ver o boneco fazendo</small></span><span class="sr num">${x.series}×${esc(x.reps)}<small>DESCANSO ${x.desc}s</small></span></button>
        <div style="padding:0 14px 14px"><div class="sets">${Array.from({ length: x.series }, (_, s) => { const k = j + ":" + s, d = SES.feito[k]; return `<button class="setb ${d ? "done" : ""}" data-set="${k}" data-rest="${x.desc}"><small>Série ${s + 1}</small>${esc(x.reps)}</button>`; }).join("")}</div></div></div>`; }).join("")}
      <button class="btn btn-accent btn-block" id="s-fim">Concluir treino</button>`;
    $("sheet-body").querySelectorAll("[data-set]").forEach(b => b.onclick = () => { const k = b.dataset.set; SES.feito[k] = !SES.feito[k]; if(SES.feito[k]){ window.SOM.check(); setTimeout(() => startTimer(+b.dataset.rest), 250); } else window.SOM.remove(); draw(); });
    $("sheet-body").querySelectorAll("[data-how]").forEach(b => b.onclick = () => { const x = t.ex[+b.dataset.how]; const e = exById(x.id); $("sheet-body").innerHTML = `<button class="btn btn-line" id="s-back">‹ Voltar ao treino</button>` + howto(e, x); bindPlayer(e); $("s-back").onclick = () => { window.BONECO.stop(); draw(); }; window.scrollTo(0, 0); $("sheet").scrollTop = 0; });
    $("s-fim").onclick = () => {
      if(ok === 0){ window.SOM.erro(); toast("Marque pelo menos uma série"); return; }
      const min = Math.max(1, Math.round((Date.now() - SES.ini) / 60000));
      ME.treinos = ME.treinos || []; ME.treinos.push({ d: today(), plano: planoId, dia: di, min });
      const meta = DB.config.treinosParaCupom || 8;
      let ganhou = null;
      if(ME.treinos.length % meta === 0) ganhou = darCupom();
      save(); SES = null; stopTimer(); window.SOM.done(); if(ganhou) setTimeout(window.SOM.coupon, 900);
      $("sheet-body").innerHTML = `<h1 class="bigtitle" style="font-size:54px">Treino <em>feito!</em></h1><p style="margin:0">${esc(t.nome)} · ${ok} séries · ${min} min</p>
        ${ganhou ? `<div class="coupon"><b>Você ganhou um cupom!</b><span>${ganhou.desconto}% na ${esc(ganhou.loja)}</span><span class="code">${ganhou.codigo}</span><span class="hint">Fica salvo em Perfil > Meus cupons.</span></div>` : `<p class="muted" style="margin:0">Faltam ${meta - (ME.treinos.length % meta)} treinos para o próximo cupom de desconto.</p>`}
        <button class="btn btn-accent btn-block" id="s-ok">Fechar</button>`;
      $("s-ok").onclick = fecharSheet;
    };
  };
  sheet(t.nome, "", () => { window.BONECO.stop(); if(TAB === "treino") rTreino(); else if(TAB === "hoje") rHoje(); });
  draw();
}
let TM = null;
function startTimer(s){
  stopTimer(); let r = s; const el = $("timer");
  const paint = () => { el.innerHTML = `<span>Descanso</span><b class="num">${Math.floor(r / 60)}:${pad(r % 60)}</b><button id="tm-skip">Pular</button>`; $("tm-skip").onclick = stopTimer; };
  el.hidden = false; paint(); window.SOM.restStart();
  TM = setInterval(() => { r--; if(r <= 0){ stopTimer(); window.SOM.restEnd(); toast("Descanso acabou. Próxima série!"); try{ navigator.vibrate && navigator.vibrate(300); }catch(e){} return; } if(r <= 3) window.SOM.tick(); paint(); }, 1000);
}
function stopTimer(){ clearInterval(TM); TM = null; $("timer").hidden = true; }

function darCupom(){
  const ps = (DB.parceiros || []).filter(p => p.ativo && (!p.validade || p.validade >= today()));
  if(!ps.length) return null;
  const prefer = ps.filter(p => +p.cidade === +ME.cidade);
  const p = (prefer.length ? prefer : ps)[Math.floor(Math.random() * (prefer.length || ps.length))];
  const c = { id: uid(), parc: p.id, user: ME.id, codigo: "FV" + Math.random().toString(36).slice(2, 7).toUpperCase(), d: today(), usado: false, usadoEm: "" };
  DB.cupons.push(c);
  return { codigo: c.codigo, loja: p.nome, desconto: p.desconto };
}

/* ---------- PERFIL ---------- */
function rPerfil(){
  const m = metas(ME), p = ME.perfil, prem = isPremium(ME);
  const cups = (DB.cupons || []).filter(c => c.user === ME.id).reverse();
  const profs = (DB.profissionais || []).filter(x => x.ativo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const objN = { emagrecer: "Emagrecer", manter: "Manter e definir", ganhar: "Ganhar massa" };
  $("t-perfil").innerHTML = `
    <div class="hello"><div class="k">${esc(ME.email)}</div><h2>${esc(ME.nome)}</h2></div>
    <div class="card">
      <div class="sec-title"><h3>Plano</h3><span class="st ${prem ? "ok" : "off"}">${prem ? (ME.premium.tipo === "teste" ? "Premium · teste grátis" : "Premium") : "Gratuito"}</span></div>
      <p style="margin:8px 0 12px">${prem ? (ME.premium.tipo === "vitalicio" ? "Acesso Premium vitalício, sem anúncios." : `Premium até ${brD(ME.premium.ate)}. Sem anúncios.`) : "Assine o Premium para usar o app sem anúncios."}</p>
      ${!prem || ME.premium.tipo === "teste" ? (DB.config.checkout ? `<a class="btn btn-accent btn-block" href="${esc(DB.config.checkout)}" target="_blank" rel="noopener">Assinar Premium por R$ ${String(DB.config.premiumPreco || 19.9).replace(".", ",")}/mês</a>` : `<p class="hint" style="margin:0">A assinatura ainda não está disponível. ${DB.config.suporte ? "Fale com o suporte: " + esc(DB.config.suporte) : ""}</p>`) : ""}
    </div>
    <div class="card">
      <div class="sec-title"><h3>Meu peso</h3><button class="link" id="p-peso">Registrar peso</button></div>
      ${pesoChart(ME.pesos || [])}
    </div>
    <div class="card">
      <div class="sec-title"><h3>Minhas metas</h3><button class="link" id="p-edit">Editar</button></div>
      <dl class="kv" style="margin:10px 0 0">
        <dt>Objetivo</dt><dd>${objN[p.objetivo]}</dd><dt>Altura</dt><dd class="num">${p.altura} cm</dd>
        <dt>Calorias por dia</dt><dd class="num">${int(m.kcal)} kcal</dd><dt>Proteína</dt><dd class="num">${m.p} g</dd><dt>Carboidrato</dt><dd class="num">${m.c} g</dd><dt>Gordura</dt><dd class="num">${m.g} g</dd><dt>Água</dt><dd class="num">${(m.agua * .25).toFixed(1).replace(".", ",")} litros</dd>
      </dl>
    </div>
    <div class="card">
      <div class="sec-title"><h3>Meus cupons</h3><span class="muted num">${cups.filter(c => !c.usado).length} disponíveis</span></div>
      ${cups.length ? cups.map(c => { const pc = DB.parceiros.find(x => x.id === c.parc) || {}; return `<div class="coupon" style="margin-top:10px;${c.usado ? "opacity:.55;border-style:solid;border-color:var(--line)" : ""}"><b>${pc.desconto || ""}% na ${esc(pc.nome || "loja parceira")}</b><span class="hint">${esc(pc.end || "")}${pc.regras ? " · " + esc(pc.regras) : ""}</span><span class="code">${c.codigo}</span>${c.usado ? `<span class="st off" style="align-self:flex-start">Usado em ${brD(c.usadoEm)}</span>` : `<div class="toolbar"><input class="input" id="pin-${c.id}" inputmode="numeric" placeholder="PIN da loja" aria-label="PIN da loja" maxlength="6"><button class="btn btn-ink btn-sm" data-usar="${c.id}">Validar na loja</button></div><span class="hint">Mostre esta tela no caixa. O atendente digita o PIN da loja.</span>`}</div>`; }).join("") : `<p class="hint" style="margin:8px 0 0">Complete ${DB.config.treinosParaCupom || 8} treinos para ganhar seu primeiro cupom.</p>`}
    </div>
    <div class="card">
      <h3 style="margin-bottom:6px">Profissionais</h3>
      <p class="hint" style="margin:0 0 6px">Personal trainers e nutricionistas parceiros. Chame no WhatsApp.</p>
      ${profs.length ? profs.map(x => `<div class="prof"><span class="avatar">${x.foto ? `<img src="${esc(x.foto)}" alt="">` : esc(x.nome.replace(/^Dra?\.\s*/, "")[0])}</span><span style="min-width:0"><b>${esc(x.nome)}</b><small>${esc(x.tipo)}${x.valor ? " · R$ " + int(x.valor) + "/sessão" : ""}</small><br><small>${esc(x.desc || "")}</small></span><a class="btn btn-accent btn-sm" href="https://wa.me/55${String(x.whats).replace(/\D/g, "").replace(/^55/, "")}" target="_blank" rel="noopener">WhatsApp</a></div>`).join("") : `<p class="hint">Nenhum profissional cadastrado ainda.</p>`}
    </div>
    <div class="card">
      <h3 style="margin-bottom:6px">Sons</h3>
      <p class="hint" style="margin:0 0 10px">Sino ao começar o treino e no descanso, avisos nos últimos segundos e sons ao registrar refeições e água.</p>
      <div class="toolbar"><div class="seg" role="group" style="flex:1"><button data-som="1" aria-pressed="${window.SOM.on}" data-mudo>Ligados</button><button data-som="0" aria-pressed="${!window.SOM.on}" data-mudo>Desligados</button></div><button class="btn btn-line btn-sm" id="p-testsom" data-mudo>Ouvir o sino</button></div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:10px">Aparência</h3>
      <div class="seg" role="group"><button data-th="" aria-pressed="${!document.documentElement.dataset.theme}">Automático</button><button data-th="dark" aria-pressed="${document.documentElement.dataset.theme === "dark"}">Escuro</button><button data-th="light" aria-pressed="${document.documentElement.dataset.theme === "light"}">Claro</button></div>
    </div>
    ${ME.admin ? `<button class="btn btn-ink btn-block" id="p-adm">Abrir painel do administrador</button>` : ""}
    <button class="btn btn-line btn-block" data-logout>Sair da conta</button>
    ${DB.config.suporte ? `<p class="hint" style="text-align:center;margin:0">Suporte: ${esc(DB.config.suporte)}</p>` : ""}`;
  $("t-perfil").querySelector("[data-logout]").onclick = logout;
  const pa = $("p-adm"); if(pa) pa.onclick = () => window.ADMIN.abrir();
  $("p-peso").onclick = () => {
    sheet("Registrar peso", `<div class="field"><label for="np">Peso de hoje (kg)</label><input class="input num" id="np" inputmode="decimal" placeholder="${p.peso}"></div><button class="btn btn-accent btn-block" id="np-ok">Salvar</button>`, rPerfil);
    $("np-ok").onclick = () => { const v = parseFloat(String($("np").value).replace(",", ".")); if(!(v > 30 && v < 300)) return toast("Digite o peso em kg"); ME.pesos = (ME.pesos || []).filter(x => x.d !== today()); ME.pesos.push({ d: today(), kg: v }); ME.perfil.peso = v; window.SOM.add(); save(); toast("Peso salvo"); fecharSheet(); };
  };
  $("p-edit").onclick = () => {
    sheet("Editar metas", `
      <div class="field"><label for="pe-obj">Objetivo</label><select class="input" id="pe-obj">${Object.entries(objN).map(([k, n]) => `<option value="${k}" ${k === p.objetivo ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="field"><label for="pe-at">Rotina</label><select class="input" id="pe-at">${[[1.2,"Parado"],[1.375,"Pouco ativo"],[1.55,"Ativo"],[1.725,"Muito ativo"]].map(([k, n]) => `<option value="${k}" ${k === p.atividade ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="row2"><div class="field"><label for="pe-alt">Altura (cm)</label><input class="input num" id="pe-alt" value="${p.altura}" inputmode="numeric"></div><div class="field"><label for="pe-kcal">Calorias manuais (opcional)</label><input class="input num" id="pe-kcal" value="${p.metaManual ? p.metaManual.kcal : ""}" inputmode="numeric" placeholder="Automático"></div></div>
      <button class="btn btn-accent btn-block" id="pe-ok">Salvar</button>`, rPerfil);
    $("pe-ok").onclick = () => {
      p.objetivo = $("pe-obj").value; p.atividade = +$("pe-at").value; p.altura = +$("pe-alt").value || p.altura;
      const k = +$("pe-kcal").value; delete p.metaManual;
      if(k > 800){ const base = metas(ME); p.metaManual = { ...base, kcal: k, c: Math.max(50, Math.round((k - base.p * 4 - base.g * 9) / 4)) }; }
      save(); toast("Metas atualizadas"); fecharSheet();
    };
  };
  $("t-perfil").querySelectorAll("[data-usar]").forEach(b => b.onclick = () => {
    const c = DB.cupons.find(x => x.id === b.dataset.usar), pc = DB.parceiros.find(x => x.id === c.parc);
    if(!pc || $("pin-" + c.id).value.trim() !== String(pc.pin)){ window.SOM.erro(); return toast("PIN incorreto"); }
    c.usado = true; c.usadoEm = today(); window.SOM.coupon(); save(); toast("Cupom validado"); rPerfil();
  });
  $("t-perfil").querySelectorAll("[data-som]").forEach(b => b.onclick = () => { window.SOM.on = b.dataset.som === "1"; if(window.SOM.on) window.SOM.check(); rPerfil(); });
  $("p-testsom").onclick = () => { if(!window.SOM.on){ toast("Ligue os sons primeiro"); return; } window.SOM.bell(); };
  $("t-perfil").querySelectorAll("[data-th]").forEach(b => b.onclick = () => { const v = b.dataset.th; if(v) document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme; try{ localStorage.setItem(KEY + "_th", v); }catch(e){} rPerfil(); });
}
function pesoChart(L){
  if(!L.length) return `<p class="hint">Registre seu peso para ver a evolução.</p>`;
  const P = L.slice(-12), W = 600, H = 170, l = 40, b = 24, t = 12;
  const vs = P.map(x => x.kg), mn = Math.floor(Math.min(...vs) - 1), mx = Math.ceil(Math.max(...vs) + 1);
  const x = i => P.length === 1 ? (W + l) / 2 : l + 10 + i * (W - l - 20) / (P.length - 1), y = v => t + (H - t - b) * (1 - (v - mn) / (mx - mn));
  const pts = P.map((p, i) => `${x(i)},${y(p.kg)}`).join(" ");
  const first = P[0].kg, last = P[P.length - 1].kg, dif = last - first;
  return `<p style="margin:6px 0 4px"><b class="num" style="font-family:var(--display);font-size:34px">${String(last).replace(".", ",")} kg</b> <span class="muted num">${P.length > 1 ? (dif > 0 ? "+" : "") + dif.toFixed(1).replace(".", ",") + " kg desde " + brD(P[0].d) : "primeiro registro"}</span></p>
    <div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do peso">
      ${[mn, (mn + mx) / 2, mx].map(v => `<line x1="${l}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${Math.round(v)}</text>`).join("")}
      ${P.length > 1 ? `<polygon points="${x(0)},${H - b} ${pts} ${x(P.length - 1)},${H - b}" fill="var(--accent)" opacity=".12"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>` : ""}
      ${P.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.kg)}" r="${i === P.length - 1 ? 6 : 4}" fill="${i === P.length - 1 ? "var(--accent)" : "var(--bg)"}" stroke="var(--accent)" stroke-width="2.5"/>`).join("")}
      <text x="${x(0)}" y="${H - 6}" text-anchor="${P.length > 1 ? "start" : "middle"}" font-size="12" fill="var(--muted)">${brD(P[0].d).slice(0, 5)}</text>${P.length > 1 ? `<text x="${x(P.length - 1)}" y="${H - 6}" text-anchor="end" font-size="12" fill="var(--muted)">${brD(P[P.length - 1].d).slice(0, 5)}</text>` : ""}
    </svg></div>`;
}

/* ---------- Anúncios em tela cheia (só para quem não é Premium) ---------- */
const AD = { cliques: 0, ultimo: Date.now(), hoje: 0, dia: today() };
document.addEventListener("click", e => {
  if(!ME || $("v-app").hidden || isPremium(ME) || !$("ad").hidden) return;
  if(e.target.closest("#ad")) return;
  AD.cliques++; tentarAnuncio();
}, true);
setInterval(() => { if(ME && !$("v-app").hidden && !isPremium(ME)) tentarAnuncio(); }, 30000);
function campanhasPara(u){
  const id = idade(u.nasc), d = today();
  return (DB.campanhas || []).filter(c => {
    const an = DB.anunciantes.find(a => a.id === c.anunc);
    return c.ativa && an && an.ativo && c.inicio <= d && (!c.fim || c.fim >= d) && (c.genero === "todos" || c.genero === u.genero) && (!c.cidade || +c.cidade === +u.cidade) && (id == null || ((!c.idMin || id >= c.idMin) && (!c.idMax || id <= c.idMax)));
  });
}
function tentarAnuncio(){
  const f = DB.freq, agora = Date.now();
  if(AD.dia !== today()){ AD.dia = today(); AD.hoje = 0; }
  if(AD.hoje >= f.maxDia) return;
  if(agora - AD.ultimo < f.intervalo * 60000) return;
  if(AD.cliques < f.cliques && agora - AD.ultimo < f.minutos * 60000) return;
  if(!$("sheet").hidden && SES) return;
  const L = campanhasPara(ME); if(!L.length) return;
  const vistos = {}; DB.eventos.forEach(e => { if(e.u === ME.id && e.t === "imp" && e.d === today()) vistos[e.c] = (vistos[e.c] || 0) + 1; });
  const c = L.sort((a, b) => (vistos[a.id] || 0) - (vistos[b.id] || 0))[0];
  AD.cliques = 0; AD.ultimo = agora; AD.hoje++;
  mostrarAnuncio(c);
}
function linkCamp(c){
  if(c.destino === "whatsapp") return "https://wa.me/55" + String(c.whats).replace(/\D/g, "").replace(/^55/, "") + (c.msg ? "?text=" + encodeURIComponent(c.msg) : "");
  if(c.destino === "instagram") return "https://instagram.com/" + String(c.insta).replace(/^@/, "");
  return /^https?:\/\//.test(c.site) ? c.site : "https://" + c.site;
}
function mostrarAnuncio(c){
  const an = DB.anunciantes.find(a => a.id === c.anunc);
  DB.eventos.push({ t: "imp", c: c.id, u: ME.id, d: today() }); save(); window.SOM.swoosh();
  $("ad").innerHTML = `<div class="adbox" role="dialog" aria-modal="true" aria-label="Anúncio"><span class="who">Patrocinado · ${esc(an.nome)}</span><h2>${esc(c.titulo)}</h2>${c.texto ? `<p>${esc(c.texto)}</p>` : ""}
    <a class="btn btn-accent btn-block" id="ad-go" href="${esc(linkCamp(c))}" target="_blank" rel="noopener">${esc(c.botao || "Saiba mais")}</a>
    <button class="btn btn-line btn-block" id="ad-x">Fechar</button><p class="hint" style="margin:0;text-align:center">Assine o Premium para não ver anúncios.</p></div>`;
  $("ad").hidden = false;
  $("ad-go").onclick = () => { DB.eventos.push({ t: "clk", c: c.id, u: ME.id, d: today() }); save(); setTimeout(() => $("ad").hidden = true, 300); };
  $("ad-x").onclick = () => $("ad").hidden = true;
}

/* ---------- Exportar para o painel ---------- */
try{ const th = localStorage.getItem(KEY + "_th"); if(th) document.documentElement.dataset.theme = th; }catch(e){}
window.FV = { get DB(){ return DB; }, set DB(v){ DB = v; }, save, semente, $, esc, int, brD, today, addD, idade, uid, hash, toast, copyText, show, receitas, exercicios, exById, PLANOS, BASE_REC, CATS, isPremium, metas, get ME(){ return ME; }, abrirApp, entrar, logout, linkCamp };
window.addEventListener("hashchange", () => { if(ME && location.hash === "#admin" && ME.admin) window.ADMIN.abrir(); });
setTimeout(entrar, 0);
})();
