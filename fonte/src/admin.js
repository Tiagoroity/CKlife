/* Painel do administrador · mesma estrutura do painel do Teygo */
(function(){
"use strict";
const F = window.FV, $ = F.$, esc = F.esc, int = F.int, brD = F.brD, today = F.today, addD = F.addD;
const DB = () => F.DB;
const money = v => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (a, b) => b ? (100 * a / b).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%" : "0%";
const GEN = { feminino: "Feminino", masculino: "Masculino", outro: "Outro", todos: "Todos" };
const DEST = { whatsapp: "WhatsApp", instagram: "Instagram", site: "Site" };
const SECOES = [["resumo","Resumo"],["anunciantes","Anunciantes"],["campanhas","Campanhas"],["metricas","Métricas"],["alunos","Alunas"],["profissionais","Profissionais"],["parceiros","Parceiros"],["financeiro","Financeiro"],["receitas","Receitas"],["exercicios","Exercícios"],["avisos","Avisos"],["comunidade","Comunidade"],["cidades","Cidades"],["segmentos","Segmentos"],["admins","Admins"],["config","Configurações"]];
let SEC = "resumo", ME = null, PERM = { total: true };
const podeVer = s => PERM.total || PERM[s] === "ver" || PERM[s] === "editar";
const podeEditar = s => PERM.total || PERM[s] === "editar";
const toast = F.toast;
const ex = o => o && o.exemplo ? `<span class="ex">exemplo</span>` : "";
const cidNome = id => (DB().cidades.find(c => +c.id === +id) || {}).nome || "";
const segNome = id => (DB().segmentos.find(c => +c.id === +id) || {}).nome || "";
const anuNome = id => (DB().anunciantes.find(c => c.id === id) || {}).nome || "";
const optCid = (sel, todas) => (todas ? `<option value="">Todas as cidades</option>` : "") + DB().cidades.map(c => `<option value="${c.id}" ${+sel === +c.id ? "selected" : ""}>${esc(c.nome)}${c.ativa ? "" : " (inativa)"}</option>`).join("");
const optSeg = sel => `<option value="">Escolha</option>` + DB().segmentos.filter(s => s.ativo || +s.id === +sel).map(s => `<option value="${s.id}" ${+sel === +s.id ? "selected" : ""}>${esc(s.nome)}</option>`).join("");
const optAnu = (sel, todos) => (todos ? `<option value="">Todos os anunciantes</option>` : `<option value="">Escolha</option>`) + DB().anunciantes.map(a => `<option value="${a.id}" ${sel === a.id ? "selected" : ""}>${esc(a.nome)} · ${esc(cidNome(a.cidade))}</option>`).join("");
const save = () => F.save();

/* ---------- Abrir / rotas ---------- */
const AIC = {
  resumo:'<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z"/>',
  metricas:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  anunciantes:'<path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>',
  campanhas:'<path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
  parceiros:'<path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7S10 2 7 3s0 4 5 4zM12 7s2-5 5-4 0 4-5 4z"/>',
  financeiro:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  alunos:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.7 2.6 3 5.2"/>',
  profissionais:'<path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 17l.9-5.4L4.2 7.7l5.4-.8z"/>',
  receitas:'<path d="M6 13.9A4 4 0 1 1 9 6.1 4.5 4.5 0 0 1 18 7a4 4 0 0 1 0 7"/><path d="M6 14h12v6H6z"/>',
  exercicios:'<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  avisos:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21h4"/>',
  cidades:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  segmentos:'<path d="M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
  admins:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  config:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  comunidade:'<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.2A8.5 8.5 0 1 1 21 12z"/><path d="M8 11h8M8 14.5h5"/>',
  pdf:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>'
};
const aic = (k, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AIC[k] || ""}</svg>`;
const GRUPOS = [["Visão geral", ["resumo","metricas"]], ["Anúncios", ["anunciantes","campanhas","parceiros","financeiro"]], ["Conteúdo do app", ["alunos","comunidade","profissionais","receitas","exercicios","avisos"]], ["Ajustes", ["cidades","segmentos","admins","config"]]];
function abrir(){
  ME = F.ME; if(!ME || !ME.admin){ toast("Sua conta não é de administrador"); return; }
  PERM = ME.perms || { total: true };
  F.show("v-admin");
  $("adm-me").textContent = ME.email; const av = $("adm-av"); if(av) av.textContent = (ME.nome || ME.email || "A").trim()[0].toUpperCase();
  const nomeSec = Object.fromEntries(SECOES);
  montaMenu(nomeSec);   // menu lateral/gaveta (admin-ux.js)
  const h = location.hash.replace("#admin", "").replace(/^[-/]/, "");
  ir(SECOES.some(s => s[0] === h) ? h : SEC);
}
$("b-voltar-app").onclick = () => { history.replaceState(null, "", location.pathname); F.abrirApp(); };
function ir(s){
  if(!podeVer(s)){ const ok = SECOES.find(x => podeVer(x[0])); if(!ok){ $("adm-main").innerHTML = `<div class="card empty">Seu acesso ainda não foi liberado. Fale com o administrador principal.</div>`; return; } s = ok[0]; }
  SEC = s; document.body.dataset.ro = podeEditar(s) ? "" : "1";
  $("adm-tabs").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.s === s));
  const on = $("adm-tabs").querySelector("button.on"); if(on && on.offsetParent) on.scrollIntoView({ block: "nearest" });
  VIEWS[s]();
  if(!podeEditar(s)) $("adm-main").insertAdjacentHTML("afterbegin", `<div class="ro-aviso">Você pode ver esta área, mas não pode alterar.</div>`);
  window.scrollTo(0, 0);
}
const rerender = () => ir(SEC);

/* ---------- Modal ---------- */
function modal(title, html){ $("mbox").innerHTML = `<div class="mh"><h2 style="flex:1">${esc(title)}</h2><button class="iconbtn" data-close aria-label="Fechar">×</button></div>${html}`; $("modal").hidden = false; document.body.style.overflow = "hidden"; }
function fechar(){ $("modal").hidden = true; document.body.style.overflow = ""; }
$("modal").addEventListener("click", e => { if(e.target.id === "modal" || e.target.closest("[data-close]")) fechar(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("modal").hidden) fechar(); });
const val = id => { const e = $(id); return e ? (e.type === "checkbox" ? e.checked : e.value.trim()) : ""; };
function confirmar(texto, ok){ modal("Confirmar", `<p style="margin:0">${esc(texto)}</p><div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Cancelar</button><button class="btn btn-bad" id="cf-ok">Sim, continuar</button></div>`); $("cf-ok").onclick = () => { fechar(); ok(); }; }

/* ---------- Gráficos ---------- */
function kpi(t, v, s, icone, destaque){ return `<div class="kpi${destaque ? " kpi-hero" : ""}${icone ? " kpi-ic" : ""}">${icone ? `<i class="kpi-i">${aic(icone, 20)}</i>` : ""}<span>${esc(t)}</span><b class="num">${v}</b>${s ? `<small>${s}</small>` : ""}</div>`; }
let GID = 0;
function barChart(rows, key, label){
  if(!rows.length) return `<div class="empty">Sem dados no período</div>`;
  const W = 640, H = 180, L = 36, B = 22, T = 8, max = Math.max(1, ...rows.map(r => r[key] || 0));
  const step = (W - L) / rows.length, bw = Math.max(2, Math.min(28, step - 2));
  const p = Math.pow(10, Math.floor(Math.log10(max))), m = max / p, nice = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  const y = v => T + (H - T - B) * (1 - v / nice);
  let g = "";
  [0, .5, 1].forEach(f => { const v = nice * f, yy = y(v); g += `<line x1="${L}" x2="${W}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${int(v)}</text>`; });
  let bars = ""; const gid = "bg" + (++GID);
  rows.forEach((r, i) => {
    const v = r[key] || 0, x = L + i * step + (step - bw) / 2, yy = y(v), h = Math.max(0, H - B - yy), rad = Math.min(4, bw / 2, h);
    bars += `<g class="bh" data-tip="${esc(brD(r.dia))}: ${esc(int(v))} ${esc(label)}"><rect x="${L + i * step}" y="${T}" width="${step}" height="${H - T - B}" fill="transparent"/>${v ? `<path d="M${x},${H - B} V${yy + rad} Q${x},${yy} ${x + rad},${yy} H${x + bw - rad} Q${x + bw},${yy} ${x + bw},${yy + rad} V${H - B} Z" fill="url(#${gid})"/>` : ""}</g>`;
  });
  const lab = [0, Math.floor(rows.length / 2), rows.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => `<text x="${L + i * step + step / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(brD(rows[i].dia).slice(0, 5))}</text>`).join("");
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)} por dia"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3DDC6E"/><stop offset="1" stop-color="#2E7D5A"/></linearGradient></defs>${g}${bars}${lab}</svg><div class="tip"></div></div>`;
}
function tipMove(e){
  document.querySelectorAll(".chart .tip").forEach(t => t.style.opacity = 0);
  const g = e.target.closest && e.target.closest(".bh"); if(!g) return;
  const ch = g.closest(".chart"), tip = ch.querySelector(".tip"), r = ch.getBoundingClientRect(), br = g.getBoundingClientRect();
  tip.textContent = g.dataset.tip; tip.style.left = (br.left - r.left + br.width / 2) + "px"; tip.style.top = (br.top - r.top + 10) + "px"; tip.style.opacity = 1;
}
document.addEventListener("mousemove", tipMove); document.addEventListener("touchstart", tipMove, { passive: true });
function hbars(list){
  if(!list.length || !list.some(x => x.v)) return `<div class="empty">Sem dados</div>`;
  const max = Math.max(1, ...list.map(x => x.v)), tot = list.reduce((a, x) => a + x.v, 0);
  return list.map(x => `<div class="hbar"><span title="${esc(x.nome)}">${esc(x.nome)}</span><div class="t"><i style="width:${100 * x.v / max}%"></i></div><span class="v">${int(x.v)} <small class="muted">${pct(x.v, tot)}</small></span></div>`).join("");
}
function serie(ini, fim, fn){ const out = []; for(let d = ini; d <= fim; d = addD(d, 1)) out.push({ dia: d, ...fn(d) }); return out; }
function contaPor(list, keyFn, nomes){ const m = {}; list.forEach(x => { const k = keyFn(x); m[k] = (m[k] || 0) + 1; }); const ks = nomes ? Object.keys(nomes) : Object.keys(m); return ks.map(k => ({ nome: nomes ? nomes[k] : k, v: m[k] || 0 })).sort((a, b) => nomes ? 0 : b.v - a.v); }
const FAIXAS = { "até 17": [0, 17], "18 a 24": [18, 24], "25 a 34": [25, 34], "35 a 44": [35, 44], "45 a 54": [45, 54], "55+": [55, 200] };
const faixa = n => { if(n == null) return "Sem idade"; for(const [k, [a, b]] of Object.entries(FAIXAS)) if(n >= a && n <= b) return k; return "Sem idade"; };
const faixaNomes = Object.fromEntries(Object.keys(FAIXAS).map(k => [k, k]));
function planilha(cab, linhas, nome){
  const c = v => { const s = v == null ? "" : String(v); return /[\t"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  F.copyText([cab, ...linhas].map(l => l.map(c).join("\t")).join("\n"), `Planilha "${nome}" copiada. Cole no Excel ou Google Planilhas.`);
}

/* ---------- Cálculos de alunos ---------- */
/* Plano de cada aluna: vem do servidor (assinaturas: Kiwify, teste, cortesia). Sem banco, usa o Premium antigo. */
let PLU = null, VENDAS = null, PLU_T = 0;
function catPlano(u){ const s = PLU && PLU[u.id]; if(s){ if(!s.pro) return "gratis"; if(s.trial) return "teste"; return ["kiwify", "apple", "google"].includes(s.provider) ? "pago" : "cortesia"; }
  if(!F.isPremium(u)) return "gratis"; return u.premium.tipo === "vitalicio" ? "cortesia" : u.premium.tipo; }
const vendaOk = v => ["order_approved", "subscription_renewed"].includes(v.evento) && v.status === "processado";
const vendasMes = (m = today().slice(0, 7)) => (VENDAS || []).filter(v => vendaOk(v) && String(v.quando).slice(0, 7) === m).reduce((s, v) => s + (+v.valor || 0), 0);
function metricasAlunos(cidade){
  const db = DB(), U = db.users.filter(u => !u.soAdmin && (!cidade || +u.cidade === +cidade));
  const ids = new Set(U.map(u => u.id));
  const acc = d => (db.acessos[d] || []).filter(id => ids.has(id));
  const uni = days => { const s = new Set(); days.forEach(d => acc(d).forEach(x => s.add(x))); return s.size; };
  const ult = n => Array.from({ length: n }, (_, i) => addD(today(), -i));
  const ret = n => { const base = U.filter(u => u.criado <= addD(today(), -n)); if(!base.length) return null; const ok = base.filter(u => Object.keys(db.acessos).some(d => d >= addD(u.criado, n) && (db.acessos[d] || []).includes(u.id))).length; return ok / base.length; };
  return {
    U, total: U.length, novos7: U.filter(u => u.criado >= addD(today(), -6)).length,
    dau: acc(today()).length, wau: uni(ult(7)), mau: uni(ult(30)),
    pagos: U.filter(u => catPlano(u) === "pago").length,
    teste: U.filter(u => catPlano(u) === "teste").length,
    cortesia: U.filter(u => catPlano(u) === "cortesia").length,
    serie: serie(addD(today(), -29), today(), d => ({ alunos: acc(d).length })),
    r1: ret(1), r7: ret(7), r30: ret(30)
  };
}
const fmtRet = v => v == null ? "-" : pct(v, 1);

/* ---------- Eventos de anúncio ---------- */
function eventos(ini, fim, anunc, cidade){
  const db = DB(), camps = new Set(db.campanhas.filter(c => !anunc || c.anunc === anunc).map(c => c.id));
  return db.eventos.filter(e => e.d >= ini && e.d <= fim && camps.has(e.c) && (!cidade || +((F.DB.users.find(u => u.id === e.u) || {}).cidade) === +cidade));
}
function resumoEv(E){ const imp = E.filter(e => e.t === "imp"), clk = E.filter(e => e.t === "clk"); return { imp: imp.length, alc: new Set(imp.map(e => e.u)).size, clk: clk.length }; }

/* ---------- Resumo ---------- */
function vResumo(){
  const db = DB(), al = metricasAlunos(), ini = addD(today(), -29), E = eventos(ini, today()), t = resumoEv(E);
  const ativas = db.campanhas.filter(c => c.ativa && (!c.fim || c.fim >= today())).length;
  const anAt = db.anunciantes.filter(a => a.ativo), mrr = anAt.reduce((s, a) => s + (+a.valor || 0), 0);
  const mes = today().slice(0, 7), pg = db.pagamentos.filter(p => p.ref === mes);
  const rec = pg.filter(p => p.status === "pago").reduce((s, p) => s + +p.valor, 0), ab = pg.filter(p => p.status !== "pago").reduce((s, p) => s + +p.valor, 0);
  const treinos30 = db.users.reduce((a, u) => a + (u.treinos || []).filter(x => x.d >= ini).length, 0);
  const temEx = db.users.some(u => u.exemplo) || db.anunciantes.some(a => a.exemplo);
  $("adm-main").innerHTML = `
    <div class="head"><div><span class="adm-ola">${(h => h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite")(new Date().getHours())}, ${esc(((ME && ME.nome) || "").split(" ")[0])} · ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span><h1>Resumo</h1><p class="muted">Visão geral do app e dos anúncios. Anúncios: últimos 30 dias.</p></div></div>
    ${temEx ? `<div class="msg msg-ok">O painel está com <b>dados de exemplo</b> (marcados com a etiqueta "exemplo") para você ver como fica. Apague em Configurações quando quiser começar do zero.</div>` : ""}
    <div class="grid g4">
      ${kpi("Alunas cadastradas", int(al.total), `+${int(al.novos7)} nos últimos 7 dias`, "alunos", 1)}
      ${kpi("Ativas hoje", int(al.dau), `${int(al.wau)} na semana · ${int(al.mau)} no mês`, "resumo")}
      ${kpi("Assinantes Pro", int(al.pagos), `${int(al.teste)} em teste grátis · ${int(al.cortesia)} cortesia`, "alunos")}
      ${kpi("Anunciantes ativos", int(anAt.length), `${int(ativas)} ${ativas === 1 ? "campanha no ar" : "campanhas no ar"}`, "anunciantes")}
      ${kpi("Impressões", int(t.imp), `Alcance: ${int(t.alc)} alunas`, "campanhas")}
      ${kpi("Cliques", int(t.clk), `Taxa de clique: ${pct(t.clk, t.imp)}`, "metricas")}
      ${kpi("Receita do mês", money(mrr + vendasMes()), `Anúncios ${money(mrr)} · Vendas Pro ${money(vendasMes())}`, "financeiro", 1)}
      ${kpi("Recebido no mês", money(rec), `A receber: ${money(ab)}`, "financeiro")}
    </div>
    <div class="grid g2">
      <div class="card"><h3>Impressões por dia</h3>${barChart(serie(ini, today(), d => ({ v: E.filter(e => e.t === "imp" && e.d === d).length })), "v", "impressões")}</div>
      <div class="card"><h3>Alunas ativas por dia</h3>${barChart(al.serie, "alunos", "alunas")}</div>
    </div>
    <div class="grid g2">
      <div class="card"><h3>Alunas por cidade</h3>${hbars(contaPor(al.U, u => cidNome(u.cidade) || "Sem cidade").slice(0, 10))}</div>
      <div class="card"><h3>Retenção</h3><div class="grid g3" style="margin-top:8px">${kpi("1 dia", fmtRet(al.r1))}${kpi("7 dias", fmtRet(al.r7))}${kpi("30 dias", fmtRet(al.r30))}</div>
        <p class="hint" style="margin:10px 0 0">Das alunas cadastradas há pelo menos N dias, quantos voltaram depois desse prazo.</p>
        <div class="grid g2" style="margin-top:10px">${kpi("Treinos nos últimos 30 dias", int(treinos30))}${kpi("Cupons entregues", int(db.cupons.length), `${int(db.cupons.filter(c => c.usado).length)} usados`)}</div></div>
    </div>`;
}

/* ---------- Anunciantes ---------- */
function vAnunciantes(){
  const db = DB();
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Anunciantes</h1><p class="muted">Empresas que aparecem nos anúncios em tela cheia do app.</p></div><button class="btn btn-accent needs-edit" id="an-new">+ Novo anunciante</button></div>
    <div class="tbl"><table><thead><tr><th>Empresa</th><th>Segmento</th><th>Cidade</th><th>Plano</th><th>Valor/mês</th><th>Status</th><th></th></tr></thead><tbody>
      ${db.anunciantes.map(a => `<tr><td><b>${esc(a.nome)}</b>${ex(a)}<br><small class="muted">${esc(a.contato || "")} ${esc(a.tel || "")}</small></td><td>${esc(segNome(a.seg))}</td><td>${esc(cidNome(a.cidade))}</td><td>${a.plano === "exclusivo" ? "Exclusivo no segmento" : "Comercial (rodízio)"}</td><td class="num">${money(a.valor)}</td><td><span class="st ${a.ativo ? "ok" : "off"}">${a.ativo ? "Ativo" : "Pausado"}</span></td><td><div class="acts"><button class="btn btn-line btn-sm btn-pdf" data-rel="${a.id}">${aic("pdf", 15)} Relatório</button><button class="btn btn-line btn-sm needs-edit" data-ed="${a.id}">Editar</button></div></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Nenhum anunciante ainda.</td></tr>`}
    </tbody></table></div>`;
  const n = $("an-new"); if(n) n.onclick = () => formAnunc();
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formAnunc(db.anunciantes.find(a => a.id === b.dataset.ed)));
  $("adm-main").querySelectorAll("[data-rel]").forEach(b => b.onclick = () => formRelatorio({ anunc: b.dataset.rel, dias: 30, cidade: "" }));
}
function formAnunc(a){
  a = a || { nome:"", seg:"", cidade:"", plano:"comercial", valor:"", contato:"", tel:"", obs:"", ativo:true };
  modal(a.id ? "Editar anunciante" : "Novo anunciante", `<div class="formgrid">
    <div class="field full"><label for="fa-n">Nome da empresa</label><input class="input" id="fa-n" value="${esc(a.nome)}"></div>
    <div class="field"><label for="fa-s">Segmento</label><select class="input" id="fa-s">${optSeg(a.seg)}</select></div>
    <div class="field"><label for="fa-c">Cidade</label><select class="input" id="fa-c">${optCid(a.cidade)}</select></div>
    <div class="field"><label for="fa-p">Plano</label><select class="input" id="fa-p"><option value="comercial" ${a.plano === "comercial" ? "selected" : ""}>Comercial (rodízio)</option><option value="exclusivo" ${a.plano === "exclusivo" ? "selected" : ""}>Exclusivo no segmento</option></select></div>
    <div class="field"><label for="fa-v">Valor mensal (R$)</label><input class="input num" id="fa-v" inputmode="decimal" value="${esc(a.valor)}"></div>
    <div class="field"><label for="fa-ct">Nome do contato</label><input class="input" id="fa-ct" value="${esc(a.contato)}"></div>
    <div class="field"><label for="fa-t">Telefone do contato</label><input class="input" id="fa-t" value="${esc(a.tel)}"></div>
    <div class="field full"><label for="fa-o">Observações</label><textarea class="input" id="fa-o">${esc(a.obs)}</textarea></div>
    <label class="field full" style="flex-direction:row;align-items:center;gap:10px;font-weight:700"><input type="checkbox" id="fa-a" ${a.ativo ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Ativo (aparece no app)</label>
  </div><div id="fa-msg"></div><div class="toolbar" style="justify-content:space-between">${a.id ? `<button class="btn btn-bad" id="fa-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="fa-ok">Salvar</button></div>`);
  $("fa-ok").onclick = () => {
    const d = { nome: val("fa-n"), seg: +val("fa-s") || "", cidade: +val("fa-c") || "", plano: val("fa-p"), valor: parseFloat(val("fa-v").replace(",", ".")) || 0, contato: val("fa-ct"), tel: val("fa-t"), obs: val("fa-o"), ativo: val("fa-a") };
    if(!d.nome || !d.seg || !d.cidade){ $("fa-msg").innerHTML = `<div class="msg msg-bad">Preencha nome, segmento e cidade.</div>`; return; }
    if(d.ativo){
      const outros = DB().anunciantes.filter(x => x.id !== a.id && x.ativo && +x.seg === +d.seg && +x.cidade === +d.cidade);
      const exc = outros.find(x => x.plano === "exclusivo");
      if(exc){ $("fa-msg").innerHTML = `<div class="msg msg-bad">Conflito de exclusividade: ${esc(exc.nome)} tem exclusividade em ${esc(segNome(d.seg))} em ${esc(cidNome(d.cidade))}.</div>`; return; }
      if(d.plano === "exclusivo" && outros.length){ $("fa-msg").innerHTML = `<div class="msg msg-bad">Conflito de exclusividade: já existem ${outros.length} anunciantes ativos neste segmento e cidade (${esc(outros.map(x => x.nome).join(", "))}).</div>`; return; }
    }
    if(a.id) Object.assign(a, d); else DB().anunciantes.push({ id: F.uid(), ...d });
    save(); fechar(); toast("Anunciante salvo"); rerender();
  };
  const del = $("fa-del"); if(del) del.onclick = () => confirmar(`Excluir ${a.nome}? As campanhas dele também serão apagadas.`, () => { const db = DB(); db.anunciantes = db.anunciantes.filter(x => x.id !== a.id); db.campanhas = db.campanhas.filter(c => c.anunc !== a.id); save(); toast("Excluído"); rerender(); });
}

/* ---------- Campanhas ---------- */
function vCampanhas(){
  const db = DB(), f = db.freq;
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Campanhas</h1><p class="muted">Anúncios em tela cheia. Só aparecem para quem não é Premium.</p></div><button class="btn btn-accent needs-edit" id="cp-new">+ Nova campanha</button></div>
    <div class="card"><h3>Anúncio em tela cheia: frequência padrão</h3>
      <div class="grid g4"><div class="field"><label for="fq-c">A cada (cliques)</label><input class="input num" id="fq-c" value="${f.cliques}" inputmode="numeric"></div><div class="field"><label for="fq-m">Ou a cada (minutos)</label><input class="input num" id="fq-m" value="${f.minutos}" inputmode="numeric"></div><div class="field"><label for="fq-i">Intervalo mínimo (min)</label><input class="input num" id="fq-i" value="${f.intervalo}" inputmode="numeric"></div><div class="field"><label for="fq-x">Máximo por dia</label><input class="input num" id="fq-x" value="${f.maxDia}" inputmode="numeric"></div></div>
      <div class="toolbar" style="margin-top:12px"><button class="btn btn-ink btn-sm needs-edit" id="fq-ok">Salvar frequência</button><span class="hint">O anúncio abre ao atingir os cliques ou os minutos, respeitando o intervalo mínimo e o máximo por dia.</span></div></div>
    <div class="tbl"><table><thead><tr><th>Campanha</th><th>Anunciante</th><th>Destino</th><th>Período</th><th>Público</th><th>Status</th><th></th></tr></thead><tbody>
      ${db.campanhas.map(c => { const no = c.ativa && c.inicio <= today() && (!c.fim || c.fim >= today()); return `<tr><td class="wrapcell"><b>${esc(c.titulo)}</b>${ex(c)}</td><td>${esc(anuNome(c.anunc))}</td><td>${DEST[c.destino]}</td><td>${brD(c.inicio)}${c.fim ? " a " + brD(c.fim) : " em diante"}</td><td>${GEN[c.genero]} · ${c.idMin || 0}–${c.idMax || "∞"} anos${c.cidade ? " · " + esc(cidNome(c.cidade)) : ""}</td><td><span class="st ${no ? "ok" : c.ativa ? "warn" : "off"}">${no ? "No ar" : c.ativa ? "Fora do período" : "Pausada"}</span></td><td><div class="acts needs-edit"><button class="btn btn-line btn-sm" data-ed="${c.id}">Editar</button><button class="btn btn-line btn-sm" data-dup="${c.id}">Duplicar</button></div></td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Nenhuma campanha ainda.</td></tr>`}
    </tbody></table></div>`;
  const ok = $("fq-ok"); if(ok) ok.onclick = () => { db.freq = { cliques: Math.max(1, +val("fq-c") || 25), minutos: Math.max(1, +val("fq-m") || 4), intervalo: Math.max(0, +val("fq-i") || 0), maxDia: Math.max(1, +val("fq-x") || 6) }; save(); toast("Frequência salva"); };
  const n = $("cp-new"); if(n) n.onclick = () => formCamp();
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formCamp(db.campanhas.find(c => c.id === b.dataset.ed)));
  $("adm-main").querySelectorAll("[data-dup]").forEach(b => b.onclick = () => { const c = db.campanhas.find(x => x.id === b.dataset.dup); db.campanhas.push({ ...c, id: F.uid(), titulo: c.titulo + " (cópia)", ativa: false, exemplo: false }); save(); toast("Campanha duplicada, está pausada"); rerender(); });
}
function formCamp(c){
  if(!DB().anunciantes.length){ toast("Cadastre um anunciante primeiro"); return; }
  c = c || { anunc:"", titulo:"", texto:"", destino:"whatsapp", botao:"Falar no WhatsApp", whats:"", msg:"Oi! Vi seu anúncio no CK Life.", insta:"", site:"", genero:"todos", idMin:"", idMax:"", cidade:"", inicio: today(), fim:"", ativa:true };
  modal(c.id ? "Editar campanha" : "Nova campanha", `<div class="formgrid">
    <div class="field full"><label for="fc-a">Anunciante</label><select class="input" id="fc-a">${optAnu(c.anunc)}</select></div>
    <div class="field full"><label for="fc-t">Título do anúncio (aparece em destaque)</label><input class="input" id="fc-t" value="${esc(c.titulo)}" maxlength="70"></div>
    <div class="field full"><label for="fc-x">Texto curto (opcional, até 140 letras)</label><textarea class="input" id="fc-x" maxlength="140">${esc(c.texto)}</textarea></div>
    <div class="field"><label for="fc-d">O botão leva para</label><select class="input" id="fc-d">${Object.entries(DEST).map(([k, n]) => `<option value="${k}" ${c.destino === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="field"><label for="fc-b">Texto do botão</label><input class="input" id="fc-b" value="${esc(c.botao)}"></div>
    <div class="field dz dz-whatsapp"><label for="fc-w">WhatsApp da empresa com DDD</label><input class="input" id="fc-w" value="${esc(c.whats)}" inputmode="tel"></div>
    <div class="field dz dz-whatsapp"><label for="fc-m">Mensagem que já vem escrita</label><input class="input" id="fc-m" value="${esc(c.msg)}"></div>
    <div class="field full dz dz-instagram"><label for="fc-i">@ do Instagram</label><input class="input" id="fc-i" value="${esc(c.insta)}"></div>
    <div class="field full dz dz-site"><label for="fc-s">Endereço do site</label><input class="input" id="fc-s" value="${esc(c.site)}" placeholder="https://"></div>
    <div class="field"><label for="fc-g">Público</label><select class="input" id="fc-g"><option value="todos" ${c.genero === "todos" ? "selected" : ""}>Todos</option><option value="feminino" ${c.genero === "feminino" ? "selected" : ""}>Só mulheres</option><option value="masculino" ${c.genero === "masculino" ? "selected" : ""}>Só homens</option></select></div>
    <div class="field"><label for="fc-c">Cidade</label><select class="input" id="fc-c">${optCid(c.cidade, true)}</select></div>
    <div class="field"><label for="fc-i1">Idade mínima</label><input class="input num" id="fc-i1" value="${esc(c.idMin)}" inputmode="numeric"></div>
    <div class="field"><label for="fc-i2">Idade máxima</label><input class="input num" id="fc-i2" value="${esc(c.idMax)}" inputmode="numeric"></div>
    <div class="field"><label for="fc-ini">Começa em</label><input class="input" type="date" id="fc-ini" value="${esc(c.inicio)}"></div>
    <div class="field"><label for="fc-fim">Termina em (opcional)</label><input class="input" type="date" id="fc-fim" value="${esc(c.fim)}"></div>
    <label class="field full" style="flex-direction:row;align-items:center;gap:10px;font-weight:700"><input type="checkbox" id="fc-on" ${c.ativa ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Campanha ativa</label>
  </div><div id="fc-msg"></div><div class="toolbar" style="justify-content:space-between">${c.id ? `<button class="btn btn-bad" id="fc-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="fc-ok">Salvar campanha</button></div>`);
  const dz = () => $("mbox").querySelectorAll(".dz").forEach(e => e.hidden = !e.classList.contains("dz-" + val("fc-d")));
  $("fc-d").onchange = dz; dz();
  $("fc-ok").onclick = () => {
    const d = { anunc: val("fc-a"), titulo: val("fc-t"), texto: val("fc-x"), destino: val("fc-d"), botao: val("fc-b"), whats: val("fc-w"), msg: val("fc-m"), insta: val("fc-i"), site: val("fc-s"), genero: val("fc-g"), cidade: +val("fc-c") || "", idMin: +val("fc-i1") || "", idMax: +val("fc-i2") || "", inicio: val("fc-ini") || today(), fim: val("fc-fim"), ativa: val("fc-on") };
    const err = !d.anunc ? "Escolha o anunciante." : !d.titulo ? "Escreva o título." : d.destino === "whatsapp" && String(d.whats).replace(/\D/g, "").length < 10 ? "Informe o WhatsApp com DDD." : d.destino === "instagram" && !d.insta ? "Informe o @ do Instagram." : d.destino === "site" && !d.site ? "Informe o endereço do site." : d.fim && d.fim < d.inicio ? "A data final é antes da inicial." : "";
    if(err){ $("fc-msg").innerHTML = `<div class="msg msg-bad">${err}</div>`; return; }
    if(c.id) Object.assign(c, d); else DB().campanhas.push({ id: F.uid(), ...d });
    save(); fechar(); toast("Campanha salva"); rerender();
  };
  const del = $("fc-del"); if(del) del.onclick = () => confirmar("Excluir esta campanha?", () => { DB().campanhas = DB().campanhas.filter(x => x.id !== c.id); save(); toast("Excluída"); rerender(); });
}

/* ---------- Métricas ---------- */
let MF = { dias: 30, anunc: "", cidade: "" };
function vMetricas(){
  const q = (location.hash.split("?")[1] || ""); if(q){ const p = new URLSearchParams(q); if(p.get("anunciante")) MF.anunc = p.get("anunciante"); if(p.get("cidade")) MF.cidade = p.get("cidade"); }
  const db = DB(), ini = addD(today(), -(MF.dias - 1)), E = eventos(ini, today(), MF.anunc, MF.cidade), t = resumoEv(E);
  const uOf = id => db.users.find(u => u.id === id) || {};
  const imps = E.filter(e => e.t === "imp");
  const unicos = [...new Set(imps.map(e => e.u))].map(uOf);
  const porCamp = db.campanhas.filter(c => !MF.anunc || c.anunc === MF.anunc).map(c => { const r = resumoEv(E.filter(e => e.c === c.id)); return { c, ...r }; });
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Métricas dos anúncios</h1><p class="muted">Quem viu e quem clicou. Use para prestar contas ao anunciante.</p></div>
      <div class="toolbar"><button class="btn btn-line btn-sm" id="mt-csv">Copiar planilha</button><button class="btn btn-accent btn-sm btn-pdf" id="mt-pdf">${aic("pdf", 16)} Relatório em PDF</button></div></div>
    <div class="toolbar"><select class="input" id="mt-d">${[7, 30, 90].map(n => `<option value="${n}" ${MF.dias === n ? "selected" : ""}>Últimos ${n} dias</option>`).join("")}</select><select class="input" id="mt-a">${optAnu(MF.anunc, true)}</select><select class="input" id="mt-c">${optCid(MF.cidade, true)}</select></div>
    <div class="grid g4">${kpi("Impressões", int(t.imp), "vezes que o anúncio apareceu", "campanhas", 1)}${kpi("Alcance", int(t.alc), "alunas diferentes", "alunos")}${kpi("Cliques", int(t.clk), "toques no botão do anúncio", "metricas")}${kpi("Taxa de clique", pct(t.clk, t.imp), "cliques ÷ impressões", "resumo")}</div>
    <div class="grid g2">
      <div class="card"><h3>Impressões por dia</h3>${barChart(serie(ini, today(), d => ({ v: imps.filter(e => e.d === d).length })), "v", "impressões")}</div>
      <div class="card"><h3>Cliques por dia</h3>${barChart(serie(ini, today(), d => ({ v: E.filter(e => e.t === "clk" && e.d === d).length })), "v", "cliques")}</div>
    </div>
    <div class="grid g3">
      <div class="card"><h3>Por faixa de idade</h3>${hbars(contaPor(unicos, u => faixa(F.idade(u.nasc)), faixaNomes))}</div>
      <div class="card"><h3>Por objetivo</h3>${hbars(contaPor(unicos, u => objNome(u)))}</div>
      <div class="card"><h3>Por cidade</h3>${hbars(contaPor(unicos, u => cidNome(u.cidade) || "Sem cidade"))}</div>
    </div>
    <div class="card"><h3>Por campanha</h3><div class="tbl"><table><thead><tr><th>Campanha</th><th>Anunciante</th><th>Impressões</th><th>Alcance</th><th>Cliques</th><th>Taxa de clique</th></tr></thead><tbody>
      ${porCamp.map(r => `<tr><td>${esc(r.c.titulo)}</td><td>${esc(anuNome(r.c.anunc))}</td><td class="num">${int(r.imp)}</td><td class="num">${int(r.alc)}</td><td class="num">${int(r.clk)}</td><td class="num">${pct(r.clk, r.imp)}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">Sem campanhas</td></tr>`}
    </tbody></table></div></div>`;
  const re = () => { history.replaceState(null, "", location.pathname + "#admin-metricas"); rerender(); };
  $("mt-d").onchange = e => { MF.dias = +e.target.value; re(); };
  $("mt-a").onchange = e => { MF.anunc = e.target.value; re(); };
  $("mt-c").onchange = e => { MF.cidade = e.target.value; re(); };
  $("mt-pdf").onclick = () => formRelatorio({ anunc: MF.anunc, dias: MF.dias, cidade: MF.cidade });
  $("mt-csv").onclick = () => planilha(["Campanha","Anunciante","Impressões","Alcance","Cliques","Taxa de clique"], porCamp.map(r => [r.c.titulo, anuNome(r.c.anunc), r.imp, r.alc, r.clk, pct(r.clk, r.imp)]), "Métricas");
}

/* ---------- Relatório em PDF para o anunciante ---------- */
const objNome = u => { const o = (F.OBJS || []).find(x => x[0] === (u.perfil && u.perfil.objetivo)); return o ? o[1] : "Sem objetivo"; };
let JSPDF = null;
function carregaJsPDF(){
  if(window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  if(JSPDF) return JSPDF;
  return JSPDF = new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = () => ok(window.jspdf.jsPDF); s.onerror = () => { JSPDF = null; no(new Error("sem internet")); }; document.head.appendChild(s); });
}
function imgData(src){
  // logo reduzida e com fundo claro: deixa o PDF leve para mandar no WhatsApp
  return new Promise(ok => { const im = new Image(); im.onload = () => { try{ const k = Math.min(1, 260 / im.naturalHeight), c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); const x = c.getContext("2d"); x.fillStyle = "#F5F8EF"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); ok({ url: c.toDataURL("image/jpeg", .9), w: c.width, h: c.height }); }catch(e){ ok(null); } }; im.onerror = () => ok(null); im.src = src; });
}
function dadosRelatorio(o){
  const db = DB(), fim = o.fim || today(), ini = o.ini || addD(fim, -((o.dias || 30) - 1));
  const E = eventos(ini, fim, o.anunc, o.cidade), t = resumoEv(E), uOf = id => db.users.find(u => u.id === id) || {};
  const imps = E.filter(e => e.t === "imp"), clks = E.filter(e => e.t === "clk"), unicos = [...new Set(imps.map(e => e.u))].map(uOf);
  const dias = serie(ini, fim, d => ({ imp: imps.filter(e => e.d === d).length, clk: clks.filter(e => e.d === d).length }));
  const camps = db.campanhas.filter(c => !o.anunc || c.anunc === o.anunc).map(c => ({ c, ...resumoEv(E.filter(e => e.c === c.id)) })).filter(r => r.imp || r.clk || (r.c.ativa && (!r.c.fim || r.c.fim >= ini)));
  const an = db.anunciantes.find(a => a.id === o.anunc) || null;
  const melhor = dias.reduce((m, d) => d.imp > (m ? m.imp : -1) ? d : m, null);
  const noAr = dias.filter(d => d.imp).length;
  return { ini, fim, E, t, unicos, dias, camps, an, melhor, noAr, cidade: o.cidade ? cidNome(o.cidade) : "" };
}
function formRelatorio(o){
  modal("Relatório em PDF", `<p class="muted" style="margin:0 0 12px">Escolha o cliente e o período. O PDF sai com a marca CK Life, pronto para enviar.</p>
    <div class="formgrid">
      <div class="field full"><label for="rl-a">Cliente (anunciante)</label><select class="input" id="rl-a">${optAnu(o.anunc, true)}</select></div>
      <div class="field"><label for="rl-i">De</label><input class="input" id="rl-i" type="date" value="${addD(today(), -((o.dias || 30) - 1))}"></div>
      <div class="field"><label for="rl-f">Até</label><input class="input" id="rl-f" type="date" value="${today()}"></div>
      <div class="field full"><label for="rl-c">Cidade</label><select class="input" id="rl-c">${optCid(o.cidade, true)}</select></div>
      <div class="field full"><label for="rl-n">Observação para o cliente (opcional)</label><textarea class="input" id="rl-n" maxlength="400" placeholder="Ex.: Obrigado pela parceria! No próximo mês vamos testar um anúncio com cupom."></textarea></div>
    </div>
    <div class="chips" style="margin-top:10px">${[["Últimos 7 dias", 7], ["Últimos 30 dias", 30], ["Este mês", "mes"], ["Mês passado", "ant"]].map(([n, v]) => `<button class="chip" data-per="${v}" type="button">${n}</button>`).join("")}</div>
    <div id="rl-prev" class="rl-prev"></div>
    <div class="toolbar" style="margin-top:14px"><button class="btn btn-accent btn-pdf" id="rl-ok">${aic("pdf", 18)} Gerar PDF</button><span id="rl-st" class="hint"></span></div>`);
  const prev = () => { const d = dadosRelatorio({ anunc: val("rl-a"), cidade: val("rl-c"), ini: val("rl-i"), fim: val("rl-f") }); $("rl-prev").innerHTML = `<div class="grid g4" style="margin-top:12px">${kpi("Impressões", int(d.t.imp))}${kpi("Alcance", int(d.t.alc))}${kpi("Cliques", int(d.t.clk))}${kpi("Taxa de clique", pct(d.t.clk, d.t.imp))}</div>`; };
  ["rl-a", "rl-c", "rl-i", "rl-f"].forEach(id => $(id).onchange = prev); prev();
  $("mbox").querySelectorAll("[data-per]").forEach(b => b.onclick = () => {
    const v = b.dataset.per, h = today();
    if(v === "mes"){ $("rl-i").value = h.slice(0, 8) + "01"; $("rl-f").value = h; }
    else if(v === "ant"){ const p = new Date(h.slice(0, 8) + "01T12:00:00"); p.setDate(0); const f = p.toISOString().slice(0, 10); $("rl-i").value = f.slice(0, 8) + "01"; $("rl-f").value = f; }
    else { $("rl-i").value = addD(h, -(+v - 1)); $("rl-f").value = h; }
    prev();
  });
  $("rl-ok").onclick = async () => {
    const bt = $("rl-ok"); if(val("rl-i") > val("rl-f")) return toast("A data inicial precisa ser antes da final");
    bt.classList.add("carregando"); bt.disabled = true; $("rl-st").textContent = "Montando o relatório…";
    try{
      const r = await gerarPDF({ anunc: val("rl-a"), cidade: val("rl-c"), ini: val("rl-i"), fim: val("rl-f"), nota: val("rl-n") });
      bt.classList.remove("carregando"); bt.disabled = false; $("rl-st").textContent = "";
      const podeEnviar = navigator.canShare && navigator.canShare({ files: [r.file] });
      $("rl-prev").insertAdjacentHTML("beforeend", `<div class="rl-ok"><b>PDF pronto: ${esc(r.nome)}</b><div class="toolbar"><button class="btn btn-accent btn-sm" id="rl-dl">Baixar PDF</button>${podeEnviar ? `<button class="btn btn-line btn-sm" id="rl-sh">Enviar (WhatsApp, e-mail…)</button>` : ""}</div></div>`);
      $("rl-dl").onclick = () => r.baixar();
      const sh = $("rl-sh"); if(sh) sh.onclick = () => navigator.share({ files: [r.file], title: r.nome, text: "Relatório de desempenho · CK Life" }).catch(() => {});
      r.baixar(); toast("Relatório gerado");
    }catch(e){ console.warn(e); bt.classList.remove("carregando"); bt.disabled = false; $("rl-st").textContent = ""; toast(/internet/.test(e.message) ? "Precisa de internet para gerar o PDF" : "Não deu para gerar o PDF. Tente de novo."); }
  };
}
async function gerarPDF(o){
  const jsPDF = await carregaJsPDF(), d = dadosRelatorio(o), logo = await imgData("img/logo.png");
  const doc = new jsPDF({ unit: "mm", format: "a4" }), W = 210, H = 297, M = 16;
  const VERDE = [14, 61, 50], MEIO = [46, 125, 90], CLARO = [123, 167, 122], SUAVE = [213, 231, 211], FUNDO = [245, 248, 239], TINTA = [23, 33, 29], CINZA = [110, 122, 116];
  const cor = (c, tipo = "text") => tipo === "fill" ? doc.setFillColor(...c) : tipo === "draw" ? doc.setDrawColor(...c) : doc.setTextColor(...c);
  const fonte = (tam, peso = "normal") => { doc.setFont("helvetica", peso); doc.setFontSize(tam); };
  const nInt = v => int(v), dBR = s => brD(s);
  const cliente = d.an ? d.an.nome : "Todos os anunciantes";
  let y = 0;
  const rodape = () => { const n = doc.getNumberOfPages(); for(let i = 1; i <= n; i++){ doc.setPage(i); cor(SUAVE, "draw"); doc.setLineWidth(.3); doc.line(M, H - 14, W - M, H - 14); fonte(8); cor(CINZA); doc.text("CK Life · Sua evolução, todos os dias.", M, H - 9); doc.text(`Gerado em ${dBR(today())}`, W / 2, H - 9, { align: "center" }); doc.text(`Página ${i} de ${n}`, W - M, H - 9, { align: "right" }); } };
  const novaPag = alt => { if(y + alt > H - 22){ doc.addPage(); y = 20; } };
  const titulo = (txt, sub) => { novaPag(18); fonte(13, "bold"); cor(VERDE); doc.text(txt, M, y); if(sub){ fonte(8.5); cor(CINZA); doc.text(sub, M, y + 5); y += 4; } y += 6; };
  // capa
  cor(VERDE, "fill"); doc.rect(0, 0, W, 56, "F"); cor(MEIO, "fill"); doc.rect(0, 56, W, 2.2, "F");
  if(logo){ const lh = 26, lw = lh * logo.w / logo.h; cor([245, 248, 239], "fill"); doc.roundedRect(M - 2, 13, lw + 4, lh + 4, 4, 4, "F"); doc.addImage(logo.url, "JPEG", M, 15, lw, lh); }
  const tx = logo ? M + 38 : M;
  fonte(22, "bold"); cor([255, 255, 255]); doc.text("CK Life", tx, 26);
  fonte(11); cor([185, 221, 178]); doc.text("Relatório de desempenho dos anúncios", tx, 34);
  fonte(9); cor([230, 240, 232]); doc.text(`Período: ${dBR(d.ini)} a ${dBR(d.fim)}${d.cidade ? " · " + d.cidade : ""}`, tx, 42);
  y = 72;
  fonte(9); cor(CINZA); doc.text("PREPARADO PARA", M, y); y += 8;
  fonte(20, "bold"); cor(TINTA); doc.text(doc.splitTextToSize(cliente, W - 2 * M)[0], M, y); y += 7;
  if(d.an){ fonte(10); cor(CINZA); doc.text([segNome(d.an.seg), cidNome(d.an.cidade), d.an.plano === "exclusivo" ? "Plano exclusivo no segmento" : "Plano comercial"].filter(Boolean).join(" · "), M, y); y += 6; }
  y += 4;
  // resumo em uma frase
  const freq = d.t.alc ? (d.t.imp / d.t.alc) : 0;
  const frase = d.t.imp ? `Seu anúncio apareceu ${nInt(d.t.imp)} vezes para ${nInt(d.t.alc)} alunas diferentes (em média ${freq.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} vezes cada) e recebeu ${nInt(d.t.clk)} ${d.t.clk === 1 ? "clique" : "cliques"}.` : "Ainda não houve exibições do anúncio neste período.";
  cor(FUNDO, "fill"); cor(SUAVE, "draw"); doc.setLineWidth(.4); const fl = doc.splitTextToSize(frase, W - 2 * M - 12); doc.roundedRect(M, y, W - 2 * M, 8 + fl.length * 5.2, 3, 3, "FD"); fonte(10.5); cor(TINTA); doc.text(fl, M + 6, y + 7.5); y += 14 + fl.length * 5.2;
  // números
  const inv = d.an && +d.an.valor ? +d.an.valor * Math.max(1, Math.round((new Date(d.fim) - new Date(d.ini)) / 864e5 + 1) / 30) : 0;
  const cards = [["Impressões", nInt(d.t.imp), "vezes que o anúncio apareceu"], ["Alcance", nInt(d.t.alc), "alunas diferentes"], ["Cliques", nInt(d.t.clk), "toques no botão"], ["Taxa de clique", pct(d.t.clk, d.t.imp), "cliques ÷ impressões"], ["Frequência", freq.toLocaleString("pt-BR", { maximumFractionDigits: 1 }), "vezes por aluna"], inv && d.t.clk ? ["Custo por clique", money(inv / d.t.clk), "estimado pelo plano"] : ["Dias no ar", nInt(d.noAr), "com exibições"]];
  const cw = (W - 2 * M - 8) / 3, ch = 26;
  cards.forEach(([n, v, s], i) => { const x = M + (i % 3) * (cw + 4), yy = y + Math.floor(i / 3) * (ch + 4); if(i === 0){ cor(VERDE, "fill"); doc.roundedRect(x, yy, cw, ch, 3, 3, "F"); } else { cor([255, 255, 255], "fill"); cor(SUAVE, "draw"); doc.roundedRect(x, yy, cw, ch, 3, 3, "FD"); } fonte(8.5, "bold"); cor(i === 0 ? [185, 221, 178] : CINZA); doc.text(n.toUpperCase(), x + 5, yy + 7); fonte(17, "bold"); cor(i === 0 ? [255, 255, 255] : TINTA); doc.text(String(v), x + 5, yy + 16.5); fonte(7.5); cor(i === 0 ? [214, 236, 220] : CINZA); doc.text(s, x + 5, yy + 22); });
  y += 2 * (ch + 4) + 8;
  // gráfico por dia
  titulo("Impressões e cliques por dia", d.melhor && d.melhor.imp ? `Melhor dia: ${dBR(d.melhor.dia)}, com ${nInt(d.melhor.imp)} impressões.` : "");
  novaPag(62);
  const gx = M + 10, gy = y, gw = W - 2 * M - 10, gh = 48, max = Math.max(1, ...d.dias.map(x => x.imp)), step = gw / d.dias.length, bw = Math.max(.8, Math.min(6, step * .62));
  cor([235, 240, 233], "draw"); doc.setLineWidth(.2); [0, .5, 1].forEach(f => { const yy = gy + gh - gh * f; doc.line(gx, yy, gx + gw, yy); fonte(7); cor(CINZA); doc.text(nInt(Math.round(max * f)), gx - 2, yy + 1, { align: "right" }); });
  d.dias.forEach((x, i) => { const h = gh * x.imp / max, bx = gx + i * step + (step - bw) / 2; if(h > 0){ cor(MEIO, "fill"); doc.roundedRect(bx, gy + gh - h, bw, h, Math.min(1, bw / 2), Math.min(1, bw / 2), "F"); } });
  // cliques: bolinha laranja com o número, só nos dias com clique
  d.dias.forEach((x, i) => { if(x.clk){ const h = gh * x.imp / max, px = gx + i * step + step / 2, py = gy + gh - h - 4.2; cor([233, 132, 60], "fill"); doc.circle(px, py, 2.1, "F"); fonte(6, "bold"); cor([255, 255, 255]); doc.text(String(x.clk), px, py + .9, { align: "center" }); } });
  fonte(7); cor(CINZA); [0, Math.floor(d.dias.length / 2), d.dias.length - 1].filter((v, i, a) => a.indexOf(v) === i).forEach(i => doc.text(dBR(d.dias[i].dia).slice(0, 5), gx + i * step + step / 2, gy + gh + 5, { align: "center" }));
  y = gy + gh + 9; cor(MEIO, "fill"); doc.rect(M + 10, y - 2.4, 4, 3, "F"); fonte(8); cor(TINTA); doc.text("Impressões", M + 16, y); cor([233, 132, 60], "fill"); doc.circle(M + 44, y - 1, 1.6, "F"); cor(TINTA); doc.text("Cliques no dia", M + 47, y); y += 10;
  // tabela por campanha
  titulo("Resultado por campanha");
  const cols = [["Campanha", 66], ["Destino", 26], ["Impressões", 24], ["Alcance", 22], ["Cliques", 18], ["Taxa", 22]];
  const linha = (vals, cab, zebra) => { novaPag(9); let x = M; if(cab){ cor(VERDE, "fill"); doc.roundedRect(M, y - 5.2, W - 2 * M, 8, 1.5, 1.5, "F"); } else if(zebra){ cor(FUNDO, "fill"); doc.rect(M, y - 5.2, W - 2 * M, 8, "F"); } vals.forEach((v, i) => { fonte(cab ? 8 : 9, cab ? "bold" : "normal"); cor(cab ? [255, 255, 255] : TINTA); const txt = doc.splitTextToSize(String(v), cols[i][1] - 3)[0]; doc.text(txt, i > 1 ? x + cols[i][1] - 2 : x + 2, y, { align: i > 1 ? "right" : "left" }); x += cols[i][1]; }); y += 8; };
  linha(cols.map(c => c[0]), true);
  if(d.camps.length) d.camps.forEach((r, i) => linha([r.c.titulo, DEST[r.c.destino] || "", nInt(r.imp), nInt(r.alc), nInt(r.clk), pct(r.clk, r.imp)], false, i % 2)); else { fonte(9); cor(CINZA); doc.text("Nenhuma campanha com exibições no período.", M + 2, y); y += 8; }
  y += 6;
  // público
  titulo("Quem viu seus anúncios", "Alunas únicas que viram o anúncio no período");
  const blocos = [["Faixa de idade", contaPor(d.unicos, u => faixa(F.idade(u.nasc)), faixaNomes).filter(x => x.v)], ["Cidade", contaPor(d.unicos, u => cidNome(u.cidade) || "Sem cidade").slice(0, 6)], ["Objetivo no app", contaPor(d.unicos, u => objNome(u)).slice(0, 6)]];
  novaPag(56); const bwid = (W - 2 * M - 8) / 3, y0 = y;
  blocos.forEach(([nome, L], k) => { const x = M + k * (bwid + 4); let yy = y0; cor([255, 255, 255], "fill"); cor(SUAVE, "draw"); doc.roundedRect(x, yy - 5, bwid, 54, 3, 3, "FD"); fonte(9, "bold"); cor(VERDE); doc.text(nome, x + 4, yy + 1); yy += 7; const tot = L.reduce((a, b) => a + b.v, 0) || 1; if(!L.length){ fonte(8); cor(CINZA); doc.text("Sem dados", x + 4, yy + 2); } L.slice(0, 6).forEach(it => { fonte(7.5); cor(TINTA); doc.text(doc.splitTextToSize(it.nome, bwid - 22)[0], x + 4, yy + 2); fonte(7.5, "bold"); doc.text(Math.round(100 * it.v / tot) + "%", x + bwid - 4, yy + 2, { align: "right" }); cor([233, 240, 231], "fill"); doc.roundedRect(x + 4, yy + 3.5, bwid - 8, 1.8, .9, .9, "F"); cor(MEIO, "fill"); doc.roundedRect(x + 4, yy + 3.5, Math.max(1.8, (bwid - 8) * it.v / tot), 1.8, .9, .9, "F"); yy += 7.3; }); });
  y = y0 + 56;
  // observação
  if(o.nota){ titulo("Observações"); const nl = doc.splitTextToSize(o.nota, W - 2 * M - 12); novaPag(nl.length * 5 + 12); cor(FUNDO, "fill"); doc.roundedRect(M, y - 4, W - 2 * M, nl.length * 5 + 8, 3, 3, "F"); fonte(10); cor(TINTA); doc.text(nl, M + 6, y + 2); y += nl.length * 5 + 10; }
  // explicação dos termos
  novaPag(26); fonte(8.5, "bold"); cor(VERDE); doc.text("Como ler este relatório", M, y); y += 5; fonte(8); cor(CINZA);
  doc.text(doc.splitTextToSize("Impressões: quantas vezes o anúncio apareceu na tela. Alcance: quantas alunas diferentes viram. Cliques: quantas vezes tocaram no botão do anúncio (WhatsApp, Instagram ou site). Taxa de clique: cliques divididos pelas impressões.", W - 2 * M), M, y);
  rodape();
  const nome = `Relatorio-CKLife-${(cliente).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}-${d.ini}-a-${d.fim}.pdf`;
  const blob = doc.output("blob"), file = new File([blob], nome, { type: "application/pdf" });
  return { nome, file, baixar: () => { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); } };
}

/* ---------- Alunos ---------- */
let AF = { q: "", cidade: "", plano: "" };
const statusPrem = u => { const s = PLU && PLU[u.id]; if(s && s.pro){ const ate = s.fim ? " até " + brD(String(s.fim).slice(0, 10)).slice(0, 5) : "";
    if(s.trial) return ["Teste grátis" + ate, "warn"]; return [(["kiwify", "apple", "google"].includes(s.provider) ? "Pro " + (s.plano === "pro_anual" ? "anual" : "mensal") : "Cortesia") + ate, "ok"]; }
  if(s && !s.pro) return ["Gratuito", "off"];
  if(!u.premium) return ["Gratuito", "off"]; if(u.premium.tipo === "vitalicio") return ["Vitalício", "ok"]; if(u.premium.ate < today()) return ["Gratuito", "off"]; return [{ pago: "Premium", teste: "Teste grátis", cortesia: "Cortesia" }[u.premium.tipo] + " até " + brD(u.premium.ate).slice(0, 5), u.premium.tipo === "teste" ? "warn" : "ok"]; };
function vAlunos(){
  const db = DB(), al = metricasAlunos(AF.cidade);
  const imps = {}; db.eventos.forEach(e => { if(e.t === "imp") imps[e.u] = (imps[e.u] || 0) + 1; });
  let L = al.U;
  if(AF.q){ const q = AF.q.toLowerCase(); L = L.filter(u => (u.nome + " " + u.email + " " + (u.whats || "")).toLowerCase().includes(q)); }
  if(AF.plano) L = L.filter(u => catPlano(u) === AF.plano);
  L = L.slice().sort((a, b) => (b.criado || "").localeCompare(a.criado || ""));
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Alunas</h1><p class="muted">Quem usa o app, de onde é e com que frequência volta.</p></div><div class="toolbar"><button class="btn btn-accent btn-sm needs-edit" id="al-prem">Dar Premium cortesia</button><button class="btn btn-line btn-sm" id="al-csv">Copiar planilha</button></div></div>
    <div class="toolbar"><select class="input" id="al-c">${optCid(AF.cidade, true)}</select></div>
    <div class="grid g4">${kpi("Cadastrados", int(al.total), `+${int(al.novos7)} nos últimos 7 dias`)}${kpi("Ativos", int(al.dau), `hoje · ${int(al.wau)} na semana · ${int(al.mau)} no mês`)}${kpi("Pro pago", int(al.pagos))}${kpi("Em teste grátis", int(al.teste), `${int(al.cortesia)} com cortesia`)}</div>
    <div class="card"><h3>Alunas ativas por dia</h3>${barChart(al.serie, "alunos", "alunas")}</div>
    <div class="grid g3">
      <div class="card"><h3>Por cidade</h3>${hbars(contaPor(al.U, u => cidNome(u.cidade) || "Sem cidade"))}</div>
      <div class="card"><h3>Por faixa de idade</h3>${hbars(contaPor(al.U, u => faixa(F.idade(u.nasc)), faixaNomes))}</div>
      <div class="card"><h3>Por gênero</h3>${hbars(contaPor(al.U, u => u.genero || "outro", { feminino: "Feminino", masculino: "Masculino", outro: "Outro" }))}</div>
    </div>
    <div class="card"><h3>Lista de alunas <span class="muted num" style="font-size:16px">(${L.length})</span></h3>
      <div class="toolbar" style="margin-bottom:10px"><input class="input" id="al-q" placeholder="Buscar por nome, e-mail ou WhatsApp" value="${esc(AF.q)}"><select class="input" id="al-p"><option value="">Todos os planos</option><option value="pago" ${AF.plano === "pago" ? "selected" : ""}>Pro pago</option><option value="teste" ${AF.plano === "teste" ? "selected" : ""}>Teste grátis</option><option value="cortesia" ${AF.plano === "cortesia" ? "selected" : ""}>Cortesia</option><option value="gratis" ${AF.plano === "gratis" ? "selected" : ""}>Gratuito</option></select></div>
      <div class="tbl"><table><thead><tr><th>Nome</th><th>WhatsApp</th><th>E-mail</th><th>Cidade</th><th>Idade</th><th>Gênero</th><th>Cadastro</th><th>Plano</th><th>Treinos</th><th>Anúncios</th><th></th></tr></thead><tbody>
        ${L.slice(0, 300).map(u => { const [s, k] = statusPrem(u); return `<tr><td><b>${esc(u.nome)}</b>${ex(u)}${u.admin ? ` <span class="st ok">admin</span>` : ""}${u.bloqueado ? ` <span class="st bad">pausado</span>` : ""}</td><td>${esc(u.whats || "")}</td><td>${esc(u.email)}</td><td>${esc(cidNome(u.cidade))}</td><td class="num">${F.idade(u.nasc) ?? "-"}</td><td>${GEN[u.genero] || "-"}</td><td class="num">${brD(u.criado)}</td><td><span class="st ${k}">${s}</span></td><td class="num">${(u.treinos || []).length}</td><td class="num">${int(imps[u.id] || 0)}</td><td><button class="btn btn-line btn-sm needs-edit" data-ed="${u.id}">Editar</button></td></tr>`; }).join("") || `<tr><td colspan="11" class="empty">Nenhuma aluna encontrada.</td></tr>`}
      </tbody></table></div></div>`;
  $("al-c").onchange = e => { AF.cidade = e.target.value; rerender(); };
  $("al-p").onchange = e => { AF.plano = e.target.value; rerender(); };
  let tq; $("al-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { AF.q = e.target.value; rerender(); const i = $("al-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
  const pb = $("al-prem"); if(pb) pb.onclick = () => formPremium();
  $("al-csv").onclick = () => planilha(["Nome","WhatsApp","E-mail","Cidade","Idade","Gênero","Cadastro","Plano","Treinos","Anúncios vistos"], L.map(u => [u.nome, u.whats, u.email, cidNome(u.cidade), F.idade(u.nasc) ?? "", GEN[u.genero] || "", brD(u.criado), statusPrem(u)[0], (u.treinos || []).length, imps[u.id] || 0]), "Alunos");
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formAluno(db.users.find(u => u.id === b.dataset.ed)));
}
const DURS = [["7","7 dias"],["30","30 dias"],["90","3 meses"],["180","6 meses"],["365","1 ano"],["vitalicio","Vitalício"]];
function aplicaPrem(u, dur){ if(dur === "vitalicio") u.premium = { tipo: "vitalicio", ate: "9999-12-31" }; else { const base = F.isPremium(u) && u.premium.tipo !== "teste" && u.premium.ate !== "9999-12-31" ? u.premium.ate : today(); u.premium = { tipo: "cortesia", ate: addD(base, +dur) }; } }
function formPremium(){
  modal("Dar Premium cortesia", `<div class="field"><label for="pr-e">E-mail da aluna</label><input class="input" id="pr-e" type="email" placeholder="aluna@email.com"></div>
    <div class="field"><label for="pr-d">Por quanto tempo</label><select class="input" id="pr-d">${DURS.map(([k, n]) => `<option value="${k}" ${k === "30" ? "selected" : ""}>${n}</option>`).join("")}</select></div><div id="pr-msg"></div>
    <button class="btn btn-accent" id="pr-ok">Liberar Premium</button>`);
  $("pr-ok").onclick = () => { const u = DB().users.find(x => x.email === val("pr-e").toLowerCase()); if(!u){ $("pr-msg").innerHTML = `<div class="msg msg-bad">Nenhuma aluna com esse e-mail. Ela precisa criar a conta primeiro.</div>`; return; } aplicaPrem(u, val("pr-d")); save(); fechar(); toast("Premium liberado para " + u.nome); rerender(); };
}
function formAluno(u){
  modal("Editar aluna", `<div class="formgrid">
    <div class="field full"><label for="ua-n">Nome</label><input class="input" id="ua-n" value="${esc(u.nome)}"></div>
    <div class="field"><label for="ua-w">WhatsApp</label><input class="input" id="ua-w" value="${esc(u.whats || "")}"></div>
    <div class="field"><label for="ua-c">Cidade</label><select class="input" id="ua-c">${optCid(u.cidade)}</select></div>
    ${F.nuvem && F.nuvem.ativo ? `<label class="field full" style="flex-direction:row;align-items:center;gap:10px;font-weight:600"><input type="checkbox" id="ua-s" value="1" style="width:20px;height:20px;accent-color:var(--accent)"> Enviar para a aluna um e-mail para criar senha nova</label>` : `<div class="field full"><label for="ua-s">Nova senha (deixe vazio para manter)</label><input class="input" id="ua-s" type="text" autocomplete="off" placeholder="Mínimo 6 caracteres"></div>`}
    <div class="field"><label for="ua-pd">Premium cortesia</label><select class="input" id="ua-pd"><option value="">Não mudar</option>${DURS.map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}<option value="tirar">Tirar Premium</option></select></div>
    <div class="field"><span style="font-weight:700;font-size:13px">Situação atual</span><span class="st ${statusPrem(u)[1]}" style="align-self:flex-start">${statusPrem(u)[0]}</span></div>
    <label class="field full" style="flex-direction:row;align-items:center;gap:10px;font-weight:700"><input type="checkbox" id="ua-b" ${u.bloqueado ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--bad)"> Pausar acesso desta conta</label>
  </div><div id="ua-msg"></div><div class="toolbar" style="justify-content:space-between"><button class="btn btn-bad" id="ua-del">Excluir aluna</button><button class="btn btn-accent" id="ua-ok">Salvar</button></div>`);
  $("ua-ok").onclick = async () => {
    const s = F.nuvem && F.nuvem.ativo ? ($("ua-s").checked ? "x" : "") : val("ua-s"); if(s && !(F.nuvem && F.nuvem.ativo) && s.length < 6){ $("ua-msg").innerHTML = `<div class="msg msg-bad">A senha precisa ter pelo menos 6 caracteres.</div>`; return; }
    if(u.id === ME.id && val("ua-b")){ $("ua-msg").innerHTML = `<div class="msg msg-bad">Você não pode pausar a sua própria conta.</div>`; return; }
    u.nome = val("ua-n") || u.nome; u.whats = val("ua-w"); u.cidade = +val("ua-c"); u.bloqueado = val("ua-b");
    if(s && F.nuvem && F.nuvem.ativo){ const e = await F.nuvem.reset(u.email); toast(e ? e : "Enviamos para a aluna um e-mail para criar a senha nova"); }
    else if(s) u.senha = await F.hash(s);
    const pd = val("ua-pd"); if(pd === "tirar") u.premium = null; else if(pd) aplicaPrem(u, pd);
    save(); fechar(); toast(s && !(F.nuvem && F.nuvem.ativo) ? "Salvo. Passe a nova senha para a aluna." : "Aluna salva"); rerender();
  };
  $("ua-del").onclick = () => { if(u.id === ME.id){ toast("Você não pode excluir a sua própria conta"); return; } confirmar(`Excluir ${u.nome}? O histórico dele será apagado.`, () => { const db = DB(); db.users = db.users.filter(x => x.id !== u.id); Object.keys(db.acessos).forEach(d => db.acessos[d] = db.acessos[d].filter(x => x !== u.id)); save(); toast("Aluna excluída"); rerender(); }); };
}

/* ---------- Profissionais ---------- */
function lerFoto(input, cb){
  const f = input.files && input.files[0]; if(!f) return cb(null);
  const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"), s = 160; c.width = c.height = s; const m = Math.min(img.width, img.height); c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s); cb(c.toDataURL("image/jpeg", .82)); }; img.onerror = () => cb(null); img.src = rd.result; }; rd.readAsDataURL(f);
}
function vProfissionais(){
  const L = DB().profissionais.slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Profissionais</h1><p class="muted">Personal trainers e nutricionistas que aparecem no Perfil da aluna, com botão de WhatsApp.</p></div><button class="btn btn-accent needs-edit" id="pf-new">+ Novo profissional</button></div>
    <div class="tbl"><table><thead><tr><th>Nome</th><th>Tipo</th><th>WhatsApp</th><th>Descrição</th><th>Valor/sessão</th><th>Ordem</th><th>Status</th><th></th></tr></thead><tbody>
      ${L.map(p => `<tr><td><b>${esc(p.nome)}</b>${ex(p)}</td><td>${esc(p.tipo)}</td><td>${esc(p.whats)}</td><td class="wrapcell">${esc(p.desc || "")}</td><td class="num">${p.valor ? money(p.valor) : "-"}</td><td class="num">${p.ordem || 0}</td><td><span class="st ${p.ativo ? "ok" : "off"}">${p.ativo ? "Ativo" : "Oculto"}</span></td><td><button class="btn btn-line btn-sm needs-edit" data-ed="${p.id}">Editar</button></td></tr>`).join("") || `<tr><td colspan="8" class="empty">Nenhum profissional ainda.</td></tr>`}
    </tbody></table></div>`;
  const n = $("pf-new"); if(n) n.onclick = () => formProf();
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formProf(DB().profissionais.find(p => p.id === b.dataset.ed)));
}
function formProf(p){
  p = p || { nome:"", tipo:"Personal trainer", whats:"", desc:"", valor:"", ordem: DB().profissionais.length + 1, ativo:true, foto:"" };
  let foto = p.foto;
  modal(p.id ? "Editar profissional" : "Novo profissional", `<div class="formgrid">
    <div class="field full"><label for="pp-f">Foto de perfil (JPG ou PNG, quadrada)</label><input class="input" type="file" id="pp-f" accept="image/*"></div>
    <div class="field"><label for="pp-n">Nome</label><input class="input" id="pp-n" value="${esc(p.nome)}"></div>
    <div class="field"><label for="pp-t">Tipo</label><select class="input" id="pp-t">${["Personal trainer","Nutricionista","Fisioterapeuta","Educador físico"].map(t => `<option ${t === p.tipo ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="field"><label for="pp-w">WhatsApp com DDD</label><input class="input" id="pp-w" value="${esc(p.whats)}" inputmode="tel"></div>
    <div class="field"><label for="pp-v">Valor da sessão (R$, opcional)</label><input class="input num" id="pp-v" value="${esc(p.valor)}" inputmode="decimal"></div>
    <div class="field full"><label for="pp-d">Descrição curta (opcional)</label><textarea class="input" id="pp-d">${esc(p.desc)}</textarea></div>
    <div class="field"><label for="pp-o">Ordem na lista</label><input class="input num" id="pp-o" value="${esc(p.ordem)}" inputmode="numeric"></div>
    <label class="field" style="flex-direction:row;align-items:center;gap:10px;font-weight:700;align-self:end"><input type="checkbox" id="pp-a" ${p.ativo ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Aparece no app</label>
  </div><div id="pp-msg"></div><div class="toolbar" style="justify-content:space-between">${p.id ? `<button class="btn btn-bad" id="pp-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="pp-ok">Salvar</button></div>`);
  $("pp-f").onchange = e => lerFoto(e.target, d => { if(d){ foto = d; toast("Foto carregada"); } else toast("Não deu para ler essa imagem"); });
  $("pp-ok").onclick = () => {
    const d = { nome: val("pp-n"), tipo: val("pp-t"), whats: val("pp-w"), valor: parseFloat(val("pp-v").replace(",", ".")) || "", desc: val("pp-d"), ordem: +val("pp-o") || 0, ativo: val("pp-a"), foto };
    if(!d.nome || String(d.whats).replace(/\D/g, "").length < 10){ $("pp-msg").innerHTML = `<div class="msg msg-bad">Preencha nome e WhatsApp com DDD.</div>`; return; }
    if(p.id) Object.assign(p, d); else DB().profissionais.push({ id: F.uid(), ...d });
    save(); fechar(); toast("Profissional salvo"); rerender();
  };
  const del = $("pp-del"); if(del) del.onclick = () => confirmar(`Excluir ${p.nome}?`, () => { DB().profissionais = DB().profissionais.filter(x => x.id !== p.id); save(); rerender(); });
}

/* ---------- Parceiros ---------- */
function vParceiros(){
  const db = DB();
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Clube CK</h1><p class="muted">Lojas e parceiros com benefícios. A cada ${db.config.treinosParaCupom || 8} treinos a aluna ganha um cupom; com "cupom livre", ela pega direto no Clube CK. A loja valida com o PIN.</p></div><button class="btn btn-accent needs-edit" id="pc-new">+ Novo parceiro</button></div>
    <div class="grid g3">${kpi("Parceiros ativos", int(db.parceiros.filter(p => p.ativo).length))}${kpi("Cupons entregues", int(db.cupons.length))}${kpi("Cupons usados", int(db.cupons.filter(c => c.usado).length), pct(db.cupons.filter(c => c.usado).length, db.cupons.length) + " de uso")}</div>
    <div class="tbl"><table><thead><tr><th>Loja</th><th>Cidade</th><th>Desconto</th><th>Validade</th><th>PIN</th><th>Cupons</th><th>Usados</th><th>Status</th><th></th></tr></thead><tbody>
      ${db.parceiros.map(p => { const cs = db.cupons.filter(c => c.parc === p.id), venc = p.validade && p.validade < today(); return `<tr><td><b>${esc(p.nome)}</b>${ex(p)}<br><small class="muted">${esc(p.end || "")}</small></td><td>${esc(cidNome(p.cidade))}</td><td class="num">${p.desconto}%</td><td>${p.validade ? brD(p.validade) : "-"}</td><td class="num">${esc(p.pin)}</td><td class="num">${cs.length}</td><td class="num">${cs.filter(c => c.usado).length}</td><td><span class="st ${!p.ativo ? "off" : venc ? "warn" : "ok"}">${!p.ativo ? "Pausado" : venc ? "Vencido" : "Ativo"}</span></td><td><button class="btn btn-line btn-sm needs-edit" data-ed="${p.id}">Editar</button></td></tr>`; }).join("") || `<tr><td colspan="9" class="empty">Nenhum parceiro ainda.</td></tr>`}
    </tbody></table></div>`;
  const n = $("pc-new"); if(n) n.onclick = () => formParc();
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formParc(db.parceiros.find(p => p.id === b.dataset.ed)));
}
function formParc(p){
  p = p || { nome:"", cidade:"", tel:"", end:"", desconto:10, validade: addD(today(), 90), pin: String(1000 + Math.floor(Math.random() * 9000)), regras:"", ativo:true, logo:"" };
  let logo = p.logo;
  modal(p.id ? "Editar parceiro" : "Novo parceiro", `<div class="formgrid">
    <div class="field full"><label for="pa-l">Logo da loja (opcional)</label><input class="input" type="file" id="pa-l" accept="image/*"></div>
    <div class="field"><label for="pa-n">Nome da loja</label><input class="input" id="pa-n" value="${esc(p.nome)}"></div>
    <div class="field"><label for="pa-c">Cidade</label><select class="input" id="pa-c">${optCid(p.cidade)}</select></div>
    <div class="field"><label for="pa-t">Telefone</label><input class="input" id="pa-t" value="${esc(p.tel)}"></div>
    <div class="field"><label for="pa-e">Endereço</label><input class="input" id="pa-e" value="${esc(p.end)}"></div>
    <div class="field"><label for="pa-d">Desconto (%)</label><input class="input num" id="pa-d" value="${esc(p.desconto)}" inputmode="numeric"></div>
    <div class="field"><label for="pa-v">Validade</label><input class="input" type="date" id="pa-v" value="${esc(p.validade)}"></div>
    <div class="field"><label for="pa-p">PIN da loja</label><input class="input num" id="pa-p" value="${esc(p.pin)}" inputmode="numeric" maxlength="6"></div>
    <label class="field" style="flex-direction:row;align-items:center;gap:10px;font-weight:700;align-self:end"><input type="checkbox" id="pa-a" ${p.ativo ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Ativo</label>
    <div class="field full"><label for="pa-r">Regras (opcional)</label><textarea class="input" id="pa-r">${esc(p.regras)}</textarea></div>
  </div><div id="pa-msg"></div><div class="toolbar" style="justify-content:space-between">${p.id ? `<button class="btn btn-bad" id="pa-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="pa-ok">Salvar</button></div>`);
  $("pa-l").onchange = e => lerFoto(e.target, d => { if(d){ logo = d; toast("Logo carregada"); } });
  $("pa-ok").onclick = () => {
    const d = { nome: val("pa-n"), cidade: +val("pa-c"), tel: val("pa-t"), end: val("pa-e"), desconto: +val("pa-d") || 0, validade: val("pa-v"), pin: val("pa-p"), regras: val("pa-r"), ativo: val("pa-a"), logo };
    if(!d.nome || !d.desconto || String(d.pin).length < 4){ $("pa-msg").innerHTML = `<div class="msg msg-bad">Preencha nome, desconto e um PIN de 4 a 6 números.</div>`; return; }
    if(p.id) Object.assign(p, d); else DB().parceiros.push({ id: F.uid(), ...d });
    save(); fechar(); toast("Parceiro salvo"); rerender();
  };
  const del = $("pa-del"); if(del) del.onclick = () => confirmar(`Excluir ${p.nome}?`, () => { DB().parceiros = DB().parceiros.filter(x => x.id !== p.id); save(); rerender(); });
}

/* ---------- Financeiro ---------- */
let FM = today().slice(0, 7);
const stPg = p => p.status === "pago" ? "pago" : p.venc < today() ? "atrasado" : "pendente";
function vFinanceiro(){
  const db = DB(), L = db.pagamentos.filter(p => p.ref === FM).sort((a, b) => a.venc.localeCompare(b.venc));
  const prev = db.anunciantes.filter(a => a.ativo).reduce((s, a) => s + (+a.valor || 0), 0);
  const soma = st => L.filter(p => stPg(p) === st).reduce((s, p) => s + +p.valor, 0);
  const meses = Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Financeiro</h1><p class="muted">Cobranças dos anunciantes por mês.</p></div><div class="toolbar"><button class="btn btn-ink btn-sm needs-edit" id="fi-gen">Gerar cobranças do mês</button><button class="btn btn-accent btn-sm needs-edit" id="fi-new">+ Lançamento</button><button class="btn btn-line btn-sm" id="fi-csv">Copiar planilha</button></div></div>
    <div class="toolbar"><select class="input" id="fi-m">${meses.map(m => `<option value="${m}" ${m === FM ? "selected" : ""}>${m.slice(5)}/${m.slice(0, 4)}</option>`).join("")}</select></div>
    <div class="grid g4">${kpi("Previsto por mês", money(prev), "Soma dos anunciantes ativos")}${kpi("Recebido", money(soma("pago")))}${kpi("A receber", money(soma("pendente")))}${kpi("Atrasado", money(soma("atrasado")))}</div>
    <div class="tbl"><table><thead><tr><th>Anunciante</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Pago em</th><th>Forma</th><th></th></tr></thead><tbody>
      ${L.map(p => { const s = stPg(p); return `<tr><td><b>${esc(anuNome(p.anunc) || "Removido")}</b>${ex(p)}${p.obs ? `<br><small class="muted">${esc(p.obs)}</small>` : ""}</td><td class="num">${money(p.valor)}</td><td class="num">${brD(p.venc)}</td><td><span class="st ${s === "pago" ? "ok" : s === "atrasado" ? "bad" : "warn"}">${{ pago: "Pago", pendente: "Pendente", atrasado: "Atrasado" }[s]}</span></td><td class="num">${brD(p.pagoEm) || "-"}</td><td>${esc(p.forma || "-")}</td><td><div class="acts needs-edit">${s !== "pago" ? `<button class="btn btn-accent btn-sm" data-pg="${p.id}">Marcar pago</button>` : ""}<button class="btn btn-line btn-sm" data-ed="${p.id}">Editar</button></div></td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">Nenhuma cobrança neste mês. Toque em "Gerar cobranças do mês".</td></tr>`}
    </tbody></table></div>`;
  $("fi-m").onchange = e => { FM = e.target.value; rerender(); };
  const g = $("fi-gen"); if(g) g.onclick = () => { let n = 0; db.anunciantes.filter(a => a.ativo).forEach(a => { if(!db.pagamentos.some(p => p.ref === FM && p.anunc === a.id)){ db.pagamentos.push({ id: F.uid(), anunc: a.id, ref: FM, valor: a.valor, venc: FM + "-10", status: "pendente", pagoEm: "", forma: "", obs: "" }); n++; } }); save(); toast(n ? `${n} cobranças geradas` : "Todas as cobranças do mês já existem"); rerender(); };
  const nw = $("fi-new"); if(nw) nw.onclick = () => formPg();
  $("fi-csv").onclick = () => planilha(["Anunciante","Mês","Valor","Vencimento","Status","Pago em","Forma","Observação"], L.map(p => [anuNome(p.anunc), p.ref, String(p.valor).replace(".", ","), brD(p.venc), stPg(p), brD(p.pagoEm), p.forma, p.obs]), "Financeiro");
  $("adm-main").querySelectorAll("[data-pg]").forEach(b => b.onclick = () => { const p = db.pagamentos.find(x => x.id === b.dataset.pg); p.status = "pago"; p.pagoEm = today(); p.forma = p.forma || "Pix"; save(); toast("Marcado como pago"); rerender(); });
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formPg(db.pagamentos.find(x => x.id === b.dataset.ed)));
}
function formPg(p){
  p = p || { anunc:"", ref: FM, valor:"", venc: FM + "-10", status:"pendente", pagoEm:"", forma:"", obs:"" };
  modal(p.id ? "Editar lançamento" : "Novo lançamento", `<div class="formgrid">
    <div class="field full"><label for="pg-a">Anunciante</label><select class="input" id="pg-a">${optAnu(p.anunc)}</select></div>
    <div class="field"><label for="pg-r">Mês de referência</label><input class="input" type="month" id="pg-r" value="${esc(p.ref)}"></div>
    <div class="field"><label for="pg-v">Valor (R$)</label><input class="input num" id="pg-v" value="${esc(p.valor)}" inputmode="decimal"></div>
    <div class="field"><label for="pg-vc">Vencimento</label><input class="input" type="date" id="pg-vc" value="${esc(p.venc)}"></div>
    <div class="field"><label for="pg-s">Status</label><select class="input" id="pg-s"><option value="pendente" ${p.status !== "pago" ? "selected" : ""}>Pendente</option><option value="pago" ${p.status === "pago" ? "selected" : ""}>Pago</option></select></div>
    <div class="field"><label for="pg-pe">Pago em</label><input class="input" type="date" id="pg-pe" value="${esc(p.pagoEm)}"></div>
    <div class="field"><label for="pg-f">Forma</label><select class="input" id="pg-f">${["","Pix","Boleto","Cartão","Dinheiro","Transferência"].map(f => `<option ${f === p.forma ? "selected" : ""}>${f}</option>`).join("")}</select></div>
    <div class="field full"><label for="pg-o">Observação</label><input class="input" id="pg-o" value="${esc(p.obs)}"></div>
  </div><div id="pg-msg"></div><div class="toolbar" style="justify-content:space-between">${p.id ? `<button class="btn btn-bad" id="pg-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="pg-ok">Salvar</button></div>`);
  $("pg-ok").onclick = () => {
    const d = { anunc: val("pg-a"), ref: val("pg-r"), valor: parseFloat(val("pg-v").replace(",", ".")) || 0, venc: val("pg-vc"), status: val("pg-s"), pagoEm: val("pg-pe"), forma: val("pg-f"), obs: val("pg-o") };
    if(!d.anunc || !d.valor || !d.ref || !d.venc){ $("pg-msg").innerHTML = `<div class="msg msg-bad">Preencha anunciante, mês, valor e vencimento.</div>`; return; }
    if(d.status === "pago" && !d.pagoEm) d.pagoEm = today();
    if(p.id) Object.assign(p, d); else DB().pagamentos.push({ id: F.uid(), ...d });
    FM = d.ref; save(); fechar(); toast("Lançamento salvo"); rerender();
  };
  const del = $("pg-del"); if(del) del.onclick = () => confirmar("Excluir este lançamento?", () => { DB().pagamentos = DB().pagamentos.filter(x => x.id !== p.id); save(); rerender(); });
}

/* ---------- Receitas ---------- */
let RQ = { q: "", cat: "" };
function vReceitas(){
  const db = DB(), oc = new Set(db.receitasOcultas || []);
  const all = [...F.BASE_REC.map(r => ({ ...r, base: true })), ...(db.receitasExtras || []).map(r => ({ ...r, ing: r.ing.split("|"), passos: r.passos.split("|"), base: false }))];
  let L = all; if(RQ.cat) L = L.filter(r => r.cat === RQ.cat); if(RQ.q){ const q = RQ.q.toLowerCase(); L = L.filter(r => r.nome.toLowerCase().includes(q)); }
  const vis = all.filter(r => !oc.has(r.id));
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Receitas</h1><p class="muted">${vis.filter(r => r.cat !== "doce").length} salgadas e ${vis.filter(r => r.cat === "doce").length} sobremesas visíveis no app.</p></div><button class="btn btn-accent needs-edit" id="rc-new">+ Nova receita</button></div>
    <div class="toolbar"><input class="input" id="rc-q" placeholder="Buscar receita" value="${esc(RQ.q)}"><select class="input" id="rc-c"><option value="">Todas as categorias</option>${Object.entries(F.CATS).map(([k, n]) => `<option value="${k}" ${RQ.cat === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="tbl"><table><thead><tr><th>Receita</th><th>Categoria</th><th>Kcal</th><th>Proteína</th><th>Tempo</th><th>Origem</th><th>No app</th><th></th></tr></thead><tbody>
      ${L.map(r => `<tr><td class="wrapcell"><b>${esc(r.nome)}</b></td><td>${F.CATS[r.cat]}</td><td class="num">${r.kcal}</td><td class="num">${r.p} g</td><td class="num">${r.min} min</td><td>${r.base ? "Padrão" : "Sua"}</td><td><span class="st ${oc.has(r.id) ? "off" : "ok"}">${oc.has(r.id) ? "Oculta" : "Visível"}</span></td><td><div class="acts needs-edit"><button class="btn btn-line btn-sm" data-tg="${r.id}">${oc.has(r.id) ? "Mostrar" : "Ocultar"}</button>${r.base ? "" : `<button class="btn btn-line btn-sm" data-ed="${r.id}">Editar</button>`}</div></td></tr>`).join("") || `<tr><td colspan="8" class="empty">Nenhuma receita encontrada.</td></tr>`}
    </tbody></table></div>`;
  let tq; $("rc-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { RQ.q = e.target.value; rerender(); const i = $("rc-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
  $("rc-c").onchange = e => { RQ.cat = e.target.value; rerender(); };
  const n = $("rc-new"); if(n) n.onclick = () => formRec();
  $("adm-main").querySelectorAll("[data-tg]").forEach(b => b.onclick = () => { const id = b.dataset.tg; db.receitasOcultas = db.receitasOcultas || []; if(oc.has(id)) db.receitasOcultas = db.receitasOcultas.filter(x => x !== id); else db.receitasOcultas.push(id); save(); rerender(); });
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formRec(db.receitasExtras.find(r => r.id === b.dataset.ed)));
}
function formRec(r){
  r = r || { nome:"", cat:"almoco", min:20, porc:2, kcal:"", p:"", c:"", g:"", ing:"", passos:"" };
  modal(r.id ? "Editar receita" : "Nova receita", `<div class="formgrid">
    <div class="field full"><label for="re-n">Nome</label><input class="input" id="re-n" value="${esc(r.nome)}"></div>
    <div class="field"><label for="re-c">Categoria</label><select class="input" id="re-c">${Object.entries(F.CATS).map(([k, n]) => `<option value="${k}" ${r.cat === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="row2"><div class="field"><label for="re-m">Minutos</label><input class="input num" id="re-m" value="${esc(r.min)}"></div><div class="field"><label for="re-po">Porções</label><input class="input num" id="re-po" value="${esc(r.porc)}"></div></div>
    <div class="row2 full row4"><div class="field"><label for="re-k">Kcal/porção</label><input class="input num" id="re-k" value="${esc(r.kcal)}"></div><div class="field"><label for="re-p">Proteína g</label><input class="input num" id="re-p" value="${esc(r.p)}"></div><div class="field"><label for="re-cb">Carbo g</label><input class="input num" id="re-cb" value="${esc(r.c)}"></div><div class="field"><label for="re-g">Gordura g</label><input class="input num" id="re-g" value="${esc(r.g)}"></div></div>
    <div class="field full"><label for="re-i">Ingredientes (um por linha)</label><textarea class="input" id="re-i" style="min-height:120px">${esc(String(r.ing).split("|").join("\n"))}</textarea></div>
    <div class="field full"><label for="re-s">Modo de preparo (um passo por linha)</label><textarea class="input" id="re-s" style="min-height:120px">${esc(String(r.passos).split("|").join("\n"))}</textarea></div>
  </div><div id="re-msg"></div><div class="toolbar" style="justify-content:space-between">${r.id ? `<button class="btn btn-bad" id="re-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="re-ok">Salvar</button></div>`);
  $("re-ok").onclick = () => {
    const lines = id => val(id).split("\n").map(s => s.trim().replace(/\|/g, "/")).filter(Boolean).join("|");
    const n = id => parseFloat(val(id).replace(",", ".")) || 0;
    const d = { nome: val("re-n"), cat: val("re-c"), min: n("re-m"), porc: n("re-po") || 1, kcal: n("re-k"), p: n("re-p"), c: n("re-cb"), g: n("re-g"), ing: lines("re-i"), passos: lines("re-s") };
    if(!d.nome || !d.kcal || !d.ing || !d.passos){ $("re-msg").innerHTML = `<div class="msg msg-bad">Preencha nome, calorias, ingredientes e preparo.</div>`; return; }
    if(r.id) Object.assign(r, d); else DB().receitasExtras.push({ id: "x" + F.uid(), ...d });
    save(); fechar(); toast("Receita salva"); rerender();
  };
  const del = $("re-del"); if(del) del.onclick = () => confirmar(`Excluir ${r.nome}?`, () => { DB().receitasExtras = DB().receitasExtras.filter(x => x.id !== r.id); save(); rerender(); });
}

/* ---------- Exercícios ---------- */
function vExercicios(){
  const L = F.exercicios();
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Exercícios</h1><p class="muted">${L.length} exercícios com passo a passo, erros comuns e respiração. Os planos de treino usam estes exercícios.</p></div><button class="btn btn-accent needs-edit" id="ex-new">+ Novo exercício</button></div>
    <div class="tbl"><table><thead><tr><th></th><th>Exercício</th><th>Grupo</th><th>Equipamento</th><th>Passos</th><th>Origem</th><th></th></tr></thead><tbody>
      ${L.map(e => { const extra = (DB().exercExtras || []).some(x => x.id === e.id); return `<tr><td><span class="exn th" style="width:48px;height:48px;display:block">${window.BONECO.thumb(e, "f")}</span></td><td><b>${esc(e.nome)}</b><br><small class="muted">${esc(window.BONECO.info(e).prim.map(m => window.BONECO.MUSC[m]).join(", "))}</small></td><td>${esc(e.grupo)}</td><td>${esc(e.equip)}</td><td class="num">${e.passos.length}</td><td>${extra ? "Seu" : "Padrão"}</td><td>${extra ? `<button class="btn btn-line btn-sm needs-edit" data-ed="${e.id}">Editar</button>` : ""}</td></tr>`; }).join("")}
    </tbody></table></div>
    <div class="card"><h3>Planos de treino</h3><div class="tbl"><table><thead><tr><th>Plano</th><th>Nível</th><th>Objetivo</th><th>Treinos</th><th>Alunas usando</th></tr></thead><tbody>
      ${F.PLANOS.map(p => `<tr><td><b>${esc(p.nome)}</b></td><td>${p.nivel}</td><td>${esc(p.obj)}</td><td>${p.treinos.map(t => esc(t.nome)).join(", ")}</td><td class="num">${DB().users.filter(u => u.plano === p.id).length}</td></tr>`).join("")}
    </tbody></table></div></div>`;
  const n = $("ex-new"); if(n) n.onclick = () => formEx();
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formEx(DB().exercExtras.find(x => x.id === b.dataset.ed)));
}
function formEx(e){
  e = e || { nome:"", grupo:"Pernas", equip:"", passos:[], erros:[], resp:"" };
  modal(e.id ? "Editar exercício" : "Novo exercício", `<div class="formgrid">
    <div class="field full"><label for="xe-n">Nome</label><input class="input" id="xe-n" value="${esc(e.nome)}"></div>
    <div class="field"><label for="xe-g">Grupo muscular</label><input class="input" id="xe-g" value="${esc(e.grupo)}" list="xe-gl"><datalist id="xe-gl">${[...new Set(F.exercicios().map(x => x.grupo))].map(g => `<option value="${esc(g)}">`).join("")}</datalist></div>
    <div class="field"><label for="xe-q">Equipamento</label><input class="input" id="xe-q" value="${esc(e.equip)}"></div>
    <div class="field full"><label for="xe-p">Como fazer (um passo por linha)</label><textarea class="input" id="xe-p" style="min-height:120px">${esc(e.passos.join("\n"))}</textarea></div>
    <div class="field full"><label for="xe-e">Erros comuns (um por linha)</label><textarea class="input" id="xe-e">${esc(e.erros.join("\n"))}</textarea></div>
    <div class="field full"><label for="xe-r">Respiração</label><input class="input" id="xe-r" value="${esc(e.resp)}"></div>
  </div><div id="xe-msg"></div><div class="toolbar" style="justify-content:space-between">${e.id ? `<button class="btn btn-bad" id="xe-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="xe-ok">Salvar</button></div>`);
  $("xe-ok").onclick = () => {
    const ls = id => val(id).split("\n").map(s => s.trim()).filter(Boolean);
    const d = { nome: val("xe-n"), grupo: val("xe-g") || "Outros", equip: val("xe-q"), passos: ls("xe-p"), erros: ls("xe-e"), resp: val("xe-r") || "Respire de forma contínua, sem prender o ar." };
    if(!d.nome || !d.passos.length){ $("xe-msg").innerHTML = `<div class="msg msg-bad">Preencha o nome e pelo menos um passo.</div>`; return; }
    if(e.id) Object.assign(e, d); else DB().exercExtras.push({ id: "x" + F.uid(), ...d });
    save(); fechar(); toast("Exercício salvo"); rerender();
  };
  const del = $("xe-del"); if(del) del.onclick = () => confirmar(`Excluir ${e.nome}?`, () => { DB().exercExtras = DB().exercExtras.filter(x => x.id !== e.id); save(); rerender(); });
}

/* ---------- Avisos ---------- */
function vAvisos(){
  const L = DB().avisos.slice().reverse();
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Avisos</h1><p class="muted">O aviso ativo mais recente aparece no topo da tela Início de todas as alunas.</p></div></div>
    <div class="card needs-edit"><h3>Novo aviso</h3><div class="formgrid"><div class="field full"><label for="av-t">Título</label><input class="input" id="av-t" maxlength="60"></div><div class="field full"><label for="av-x">Texto</label><textarea class="input" id="av-x" maxlength="240"></textarea></div></div><button class="btn btn-accent" id="av-ok" style="margin-top:12px">Publicar aviso</button></div>
    <div class="tbl"><table><thead><tr><th>Aviso</th><th>Data</th><th>Status</th><th></th></tr></thead><tbody>
      ${L.map(a => `<tr><td class="wrapcell"><b>${esc(a.titulo)}</b><br><small class="muted">${esc(a.texto)}</small></td><td class="num">${brD(a.d)}</td><td><span class="st ${a.ativo ? "ok" : "off"}">${a.ativo ? "Ativo" : "Arquivado"}</span></td><td><div class="acts needs-edit"><button class="btn btn-line btn-sm" data-tg="${a.id}">${a.ativo ? "Arquivar" : "Reativar"}</button><button class="btn btn-bad btn-sm" data-del="${a.id}">Excluir</button></div></td></tr>`).join("") || `<tr><td colspan="4" class="empty">Nenhum aviso.</td></tr>`}
    </tbody></table></div>`;
  const ok = $("av-ok"); if(ok) ok.onclick = () => { const t = val("av-t"), x = val("av-x"); if(!t || !x) return toast("Preencha título e texto"); DB().avisos.push({ id: F.uid(), titulo: t, texto: x, d: today(), ativo: true }); save(); toast("Aviso publicado"); rerender(); };
  $("adm-main").querySelectorAll("[data-tg]").forEach(b => b.onclick = () => { const a = DB().avisos.find(x => x.id === b.dataset.tg); a.ativo = !a.ativo; save(); rerender(); });
  $("adm-main").querySelectorAll("[data-del]").forEach(b => b.onclick = () => confirmar("Excluir este aviso?", () => { DB().avisos = DB().avisos.filter(x => x.id !== b.dataset.del); save(); toast("Aviso excluído"); rerender(); }));
}

/* ---------- Cidades, segmentos e admins ---------- */
function vCidades(){
  const db = DB();
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Cidades</h1><p class="muted">Aparecem no cadastro da aluna e servem para segmentar anúncios.</p></div><button class="btn btn-accent needs-edit" id="ci-new">+ Nova cidade</button></div>
    <div class="tbl"><table><thead><tr><th>Cidade</th><th>UF</th><th>Alunas</th><th>Anunciantes</th><th>Status</th><th></th></tr></thead><tbody>
      ${db.cidades.map(c => `<tr><td><b>${esc(c.nome)}</b></td><td>${esc(c.uf)}</td><td class="num">${db.users.filter(u => +u.cidade === +c.id).length}</td><td class="num">${db.anunciantes.filter(a => +a.cidade === +c.id).length}</td><td><span class="st ${c.ativa ? "ok" : "off"}">${c.ativa ? "Ativa" : "Inativa"}</span></td><td><button class="btn btn-line btn-sm needs-edit" data-tg="${c.id}">${c.ativa ? "Desativar" : "Ativar"}</button></td></tr>`).join("")}
    </tbody></table></div>`;
  const n = $("ci-new"); if(n) n.onclick = () => {
    modal("Nova cidade", `<div class="formgrid"><div class="field"><label for="ci-n">Nome</label><input class="input" id="ci-n"></div><div class="field"><label for="ci-u">UF</label><input class="input" id="ci-u" maxlength="2"></div></div><button class="btn btn-accent" id="ci-ok">Adicionar</button>`);
    $("ci-ok").onclick = () => { const nm = val("ci-n"); if(!nm) return; if(db.cidades.some(c => c.nome.toLowerCase() === nm.toLowerCase())) return toast("Já existe um registro com esse nome."); db.cidades.push({ id: Math.max(0, ...db.cidades.map(c => +c.id)) + 1, nome: nm, uf: val("ci-u").toUpperCase(), ativa: true }); save(); fechar(); rerender(); };
  };
  $("adm-main").querySelectorAll("[data-tg]").forEach(b => b.onclick = () => { const c = db.cidades.find(x => +x.id === +b.dataset.tg); c.ativa = !c.ativa; save(); rerender(); });
}
function vSegmentos(){
  const db = DB();
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Segmentos</h1><p class="muted">Ramos dos anunciantes. A exclusividade vale por segmento e cidade.</p></div></div>
    <div class="toolbar needs-edit"><input class="input" id="sg-n" placeholder="Novo segmento, ex.: Farmácia"><button class="btn btn-accent btn-sm" id="sg-ok">Adicionar</button></div>
    <div class="tbl"><table><thead><tr><th>Segmento</th><th>Anunciantes</th><th>Status</th><th></th></tr></thead><tbody>
      ${db.segmentos.map(s => `<tr><td><b>${esc(s.nome)}</b></td><td class="num">${db.anunciantes.filter(a => +a.seg === +s.id).length}</td><td><span class="st ${s.ativo ? "ok" : "off"}">${s.ativo ? "Ativo" : "Inativo"}</span></td><td><button class="btn btn-line btn-sm needs-edit" data-tg="${s.id}">${s.ativo ? "Desativar" : "Ativar"}</button></td></tr>`).join("")}
    </tbody></table></div>`;
  const ok = $("sg-ok"); if(ok) ok.onclick = () => { const nm = val("sg-n"); if(!nm) return; if(db.segmentos.some(s => s.nome.toLowerCase() === nm.toLowerCase())) return toast("Já existe um registro com esse nome."); db.segmentos.push({ id: Math.max(0, ...db.segmentos.map(s => +s.id)) + 1, nome: nm, ativo: true }); save(); rerender(); };
  $("adm-main").querySelectorAll("[data-tg]").forEach(b => b.onclick = () => { const s = db.segmentos.find(x => +x.id === +b.dataset.tg); s.ativo = !s.ativo; save(); rerender(); });
}
function vAdmins(){
  const db = DB(), L = db.users.filter(u => u.admin);
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Administradores</h1><p class="muted">Quem pode abrir este painel. Cada um pode ter acesso total ou só a algumas áreas.</p></div></div>
    <div class="toolbar needs-edit"><input class="input" id="ad-e" type="email" placeholder="E-mail de quem já tem conta no app"><button class="btn btn-accent btn-sm" id="ad-ok">Adicionar</button></div>
    <div class="tbl"><table><thead><tr><th>E-mail</th><th>Nome</th><th>Acesso</th><th>Desde</th><th></th></tr></thead><tbody>
      ${L.map(u => `<tr><td>${esc(u.email)}</td><td><b>${esc(u.nome)}</b>${u.id === ME.id ? ` <span class="st ok">você</span>` : ""}</td><td>${u.perms && u.perms.total ? "Total" : `${Object.values(u.perms || {}).filter(Boolean).length} áreas`}</td><td class="num">${brD(u.adminDesde || u.criado)}</td><td><div class="acts needs-edit"><button class="btn btn-line btn-sm" data-pm="${u.id}">Permissões</button>${u.id !== ME.id ? `<button class="btn btn-bad btn-sm" data-rm="${u.id}">Remover</button>` : ""}</div></td></tr>`).join("")}
    </tbody></table></div>`;
  const ok = $("ad-ok"); if(ok) ok.onclick = () => { const u = db.users.find(x => x.email === val("ad-e").toLowerCase()); if(!u) return toast("Ninguém com esse e-mail. A pessoa precisa criar a conta no app primeiro."); if(u.admin) return toast("Já é administrador"); u.admin = true; u.perms = { resumo: "ver" }; u.adminDesde = today(); save(); toast("Adicionado com acesso só ao Resumo. Ajuste em Permissões."); rerender(); };
  $("adm-main").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { const u = db.users.find(x => x.id === b.dataset.rm); confirmar(`Tirar o acesso de ${u.nome} ao painel?`, () => { u.admin = false; u.perms = null; save(); rerender(); }); });
  $("adm-main").querySelectorAll("[data-pm]").forEach(b => b.onclick = () => formPerm(db.users.find(x => x.id === b.dataset.pm)));
}
function formPerm(u){
  const p = u.perms || {};
  modal("Permissões · " + u.nome, `<label style="display:flex;gap:10px;align-items:center;font-weight:800"><input type="checkbox" id="pm-t" ${p.total ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Acesso total (todas as áreas, pode editar)</label>
    <div class="permgrid" id="pm-g">${SECOES.map(([k, n]) => `<span>${n}</span><select class="input" data-k="${k}" style="padding:8px 10px;font-size:14px"><option value="">Sem acesso</option><option value="ver" ${p[k] === "ver" ? "selected" : ""}>Só ver</option><option value="editar" ${p[k] === "editar" ? "selected" : ""}>Ver e editar</option></select>`).join("")}</div>
    <div id="pm-msg"></div><button class="btn btn-accent" id="pm-ok">Salvar permissões</button>`);
  const sync = () => $("pm-g").style.opacity = $("pm-t").checked ? .4 : 1; $("pm-t").onchange = sync; sync();
  $("pm-ok").onclick = () => {
    const tot = $("pm-t").checked;
    if(!tot && u.id === ME.id && !DB().users.some(x => x.admin && x.id !== u.id && x.perms && x.perms.total)){ $("pm-msg").innerHTML = `<div class="msg msg-bad">Precisa ficar pelo menos um administrador com acesso total.</div>`; return; }
    const np = tot ? { total: true } : {}; if(!tot) $("pm-g").querySelectorAll("select").forEach(s => { if(s.value) np[s.dataset.k] = s.value; });
    u.perms = np; save(); fechar(); toast("Permissões salvas");
    if(u.id === ME.id){ abrir(); } else rerender();
  };
}

/* ---------- Configurações ---------- */
function vConfig(){
  const db = DB(), c = db.config, nEx = db.users.filter(u => u.exemplo).length;
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Configurações</h1><p class="muted">Assinatura, suporte, recompensas e dados.</p></div></div>
    <div class="card"><h3>Assinatura e suporte</h3><div class="formgrid">
      <div class="field full"><label for="cf-ck">Link de pagamento do Premium (Kiwify, Hotmart, Mercado Pago...)</label><input class="input" id="cf-ck" value="${esc(c.checkout)}" placeholder="https://pay.kiwify.com.br/..."></div>
      <div class="field"><label for="cf-pr">Preço mensal do Premium (R$)</label><input class="input num" id="cf-pr" value="${esc(c.premiumPreco)}" inputmode="decimal"></div>
      <div class="field"><label for="cf-tc">Treinos para ganhar 1 cupom</label><input class="input num" id="cf-tc" value="${esc(c.treinosParaCupom)}" inputmode="numeric"></div>
      <div class="field full"><label for="cf-sp">Contato de suporte (aparece no app)</label><input class="input" id="cf-sp" value="${esc(c.suporte)}" placeholder="WhatsApp (65) 99999-9999"></div>
    </div><button class="btn btn-accent needs-edit" id="cf-ok" style="margin-top:12px">Salvar</button></div>
    <div class="card" ${nEx ? "" : "hidden"}><h3>Dados de exemplo</h3><p style="margin:0 0 12px">${nEx ? `Há ${nEx} alunas, anunciantes, campanhas, parceiros e cobranças de exemplo para demonstrar o painel.` : "Os dados de exemplo já foram apagados."}</p>${nEx ? `<button class="btn btn-bad needs-edit" id="cf-clear">Apagar dados de exemplo</button>` : ""}</div>
    ${F.nuvem && F.nuvem.ativo ? `<div class="card"><h3>Seus dados</h3><p style="margin:0">Tudo fica salvo com segurança no banco de dados (Supabase) e aparece em qualquer aparelho em que você entrar.</p></div>` : ""}
    <div class="card" ${F.nuvem && F.nuvem.ativo ? "hidden" : ""}><h3>Cópia de segurança</h3><p style="margin:0 0 12px">Os dados ficam salvos neste navegador. Copie a cópia de segurança e guarde num bloco de notas, ou cole uma cópia para restaurar.</p>
      <div class="toolbar"><button class="btn btn-ink btn-sm" id="cf-bk">Copiar cópia de segurança</button><button class="btn btn-line btn-sm needs-edit" id="cf-rs">Restaurar de uma cópia</button></div></div>`;
  const ok = $("cf-ok"); if(ok) ok.onclick = () => { c.checkout = val("cf-ck"); c.premiumPreco = parseFloat(val("cf-pr").replace(",", ".")) || 0; c.treinosParaCupom = Math.max(1, +val("cf-tc") || 8); c.suporte = val("cf-sp"); save(); toast("Configurações salvas"); };
  const cl = $("cf-clear"); if(cl) cl.onclick = () => confirmar("Apagar todos os dados de exemplo? Suas contas reais continuam.", () => {
    const ids = new Set(db.users.filter(u => u.exemplo).map(u => u.id));
    db.users = db.users.filter(u => !u.exemplo); Object.keys(db.acessos).forEach(d => db.acessos[d] = db.acessos[d].filter(x => !ids.has(x)));
    ["anunciantes","campanhas","pagamentos","profissionais","parceiros"].forEach(k => db[k] = db[k].filter(x => !x.exemplo));
    const camps = new Set(db.campanhas.map(c => c.id)); db.eventos = db.eventos.filter(e => !e.ex && camps.has(e.c));
    db.cupons = db.cupons.filter(c => db.parceiros.some(p => p.id === c.parc));
    save(); toast("Dados de exemplo apagados"); rerender();
  });
  $("cf-bk").onclick = () => F.copyText(JSON.stringify(db), "Cópia de segurança copiada");
  const rs = $("cf-rs"); if(rs) rs.onclick = () => {
    modal("Restaurar cópia", `<div class="field"><label for="rs-t">Cole aqui a cópia de segurança</label><textarea class="input" id="rs-t" style="min-height:160px"></textarea></div><div id="rs-msg"></div><button class="btn btn-bad" id="rs-ok">Substituir todos os dados</button>`);
    $("rs-ok").onclick = () => { try{ const d = JSON.parse($("rs-t").value); if(!d.versao || !Array.isArray(d.users)) throw 0; F.DB = d; save(); fechar(); toast("Dados restaurados"); F.entrar(); }catch(e){ $("rs-msg").innerHTML = `<div class="msg msg-bad">Esse texto não é uma cópia de segurança válida.</div>`; } };
  };
}

/* ---------- Comunidade: moderação ---------- */
async function vComunidade(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Comunidade</h1><p class="muted">Publicações das alunas na aba Comunidade. Oculte ou exclua o que não combina com o espaço.</p></div><button class="btn btn-line btn-sm" id="cm-at">Atualizar</button></div><div id="cm-l" class="grid g2"><div class="card">Carregando…</div></div>`;
  $("cm-at").onclick = rerender;
  let L = [];
  try{ L = await F.CM.carregar(true); }catch(e){ $("cm-l").innerHTML = `<div class="card"><b>A comunidade ainda não foi ativada no banco.</b><p class="muted" style="margin:6px 0 0">Rode o arquivo comunidade.sql no Supabase (SQL Editor) uma vez.</p></div>`; return; }
  const tot = { p: L.length, c: L.reduce((a, p) => a + (p.coments || []).length, 0), k: L.reduce((a, p) => a + (p.curtidas || []).length, 0) };
  $("cm-l").outerHTML = `<div class="grid g3">${kpi("Publicações", int(tot.p), "", "comunidade", 1)}${kpi("Comentários", int(tot.c), "", "comunidade")}${kpi("Curtidas", int(tot.k), "", "profissionais")}</div>
    <div class="cm-adm">${L.map(p => `<div class="card cm-item ${p.oculto ? "oc" : ""}" data-id="${p.id}">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy">` : ""}<div><b>${esc(p.nome)}</b> <small class="muted">${F.tempoAtras(p.criado)} · ${(p.curtidas || []).length} curtidas · ${(p.coments || []).length} comentários${p.oculto ? " · <span class='st warn'>oculto</span>" : ""}</small>
      ${p.texto ? `<p>${esc(p.texto)}</p>` : ""}
      ${(p.coments || []).map(c => `<div class="cm-c"><span><b>${esc(c.nome)}:</b> ${esc(c.texto)}</span><button class="btn btn-line btn-sm needs-edit" data-dc="${p.id}|${c.id}">Excluir</button></div>`).join("")}
      <div class="acts needs-edit" style="margin-top:8px"><button class="btn btn-line btn-sm" data-oc="${p.id}">${p.oculto ? "Mostrar de novo" : "Ocultar"}</button><button class="btn btn-bad btn-sm" data-dp="${p.id}">Excluir</button></div></div></div>`).join("") || `<div class="card">Nenhuma publicação ainda.</div>`}</div>`;
  const acha = id => L.find(p => p.id === id);
  $("adm-main").querySelectorAll("[data-oc]").forEach(b => b.onclick = async () => { const p = acha(b.dataset.oc), v = !p.oculto; try{ await F.CM.ocultar(p, v); toast(v ? "Publicação ocultada" : "Publicação visível de novo"); rerender(); }catch(e){ toast("Não deu agora. Tente de novo."); } });
  $("adm-main").querySelectorAll("[data-dp]").forEach(b => b.onclick = () => { const p = acha(b.dataset.dp); confirmar(`Excluir a publicação de ${p.nome}? Isso não pode ser desfeito.`, async () => { try{ await F.CM.apagaPost(p); toast("Publicação excluída"); rerender(); }catch(e){ toast("Não deu agora. Tente de novo."); } }); });
  $("adm-main").querySelectorAll("[data-dc]").forEach(b => b.onclick = async () => { const [pid, cid] = b.dataset.dc.split("|"), p = acha(pid), c = p.coments.find(x => x.id === cid); try{ await F.CM.apagaComent(p, c); toast("Comentário excluído"); rerender(); }catch(e){ toast("Não deu agora."); } });
}
const VIEWS = { resumo: vResumo, anunciantes: vAnunciantes, campanhas: vCampanhas, metricas: vMetricas, alunos: vAlunos, profissionais: vProfissionais, parceiros: vParceiros, financeiro: vFinanceiro, receitas: vReceitas, exercicios: vExercicios, avisos: vAvisos, comunidade: vComunidade, cidades: vCidades, segmentos: vSegmentos, admins: vAdmins, config: vConfig };
/*ADMINXP*/
window.ADMIN = { abrir };
})();
