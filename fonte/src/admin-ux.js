/* ===================== Painel · NAVEGAÇÃO, DASHBOARD E BUSCA GLOBAL =====================
   Menu em seções recolhíveis (computador: barra lateral; celular: gaveta com botão de menu — nada de rolar de lado).
   Dashboard executivo com números reais. Busca global (Ctrl/Cmd + K) leva direto ao lugar certo. */
AIC.menu = '<path d="M4 7h16M4 12h16M4 17h16"/>';
AIC.busca = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>';
AIC.chev = '<path d="m9 6 6 6-6 6"/>';
AIC.treinos = '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>';
AIC.conteudo = '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h8M8 16h5"/>';
AIC.seguranca = AIC.seguranca || AIC.admins;
AIC.relatorios = AIC.metricas;
AIC.explorarg = '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>';
AIC.alerta = '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>';
/* arquitetura do menu: categoria > seção > telas */
const MENU = [
  ["Gestão", [["Usuárias", "alunos", ["alunos", "verificacoes", "ciclo"]], ["Treinos", "treinos", ["exercicios"]], ["Nutrição", "receitas", ["receitas"]], ["Conteúdo", "conteudo", ["avisos", "banners", "destaques", "categorias", "figurinhas"]], ["Comunidade", "comunidade", ["comunidade", "grupos", "moderacao"]]]],
  ["Marketing", [["Notificações", "notificacoes", ["notificacoes"]], ["Anúncios", "campanhas", ["campanhas", "anunciantes"]], ["Clube e Explorar", "explorarg", ["parceiros", "cupons", "produtos", "empresas", "profissionais", "servicos", "agendamentos", "avaliacoes"]]]],
  ["Dados", [["Financeiro", "financeiro", ["monetizacao", "financeiro"]], ["Relatórios", "relatorios", ["metricas", "explorarm"]]]],
  ["Sistema", [["Segurança", "seguranca", ["seguranca", "admins"]], ["Configurações", "config", ["cidades", "segmentos", "config"]]]]
];
const MENU_NOME = { campanhas: "Anúncios", metricas: "Métricas de anúncios", explorarm: "Métricas do Explorar", alunos: "Lista de alunas", exercicios: "Exercícios e voz", receitas: "Receitas", monetizacao: "Assinaturas e planos", financeiro: "Financeiro e vendas", notificacoes: "Central de Notificações", comunidade: "Publicações" };
let MENU_AB = {}; try{ MENU_AB = JSON.parse(localStorage.getItem("ck_adm_menu") || "{}"); }catch(e){}
const grupoDe = s => { for(const [, gs] of MENU) for(const g of gs) if(g[2].includes(s)) return g; return null; };
function montaMenu(nomeSec){
  const NS = nomeSec || Object.fromEntries(SECOES), usados = new Set(MENU.flatMap(c => c[1].flatMap(g => g[2])));
  const extra = GRUPOS.flatMap(g => g[1]).filter(k => !usados.has(k) && k !== "resumo" && podeVer(k));
  const item = k => `<button class="adm-it" data-s="${k}"><span>${esc(MENU_NOME[k] || NS[k] || k)}</span></button>`;
  const grupo = ([nome, ic, ks]) => { const vis = ks.filter(k => podeVer(k) && VIEWS[k]); if(!vis.length) return "";
    if(vis.length === 1) return `<button class="adm-gh solo" data-s="${vis[0]}"><span class="ai">${aic(ic)}</span><span class="adm-gn">${esc(nome)}</span></button>`;
    return `<div class="adm-g" data-g="${esc(nome)}"><button class="adm-gh" aria-expanded="false"><span class="ai">${aic(ic)}</span><span class="adm-gn">${esc(nome)}</span><span class="adm-chev">${aic("chev", 15)}</span></button><div class="adm-gi">${vis.map(item).join("")}</div></div>`; };
  $("adm-tabs").innerHTML = `<button class="adm-busca-bt" id="adm-busca-bt" type="button">${aic("busca", 16)}<span>Buscar no painel</span><kbd>${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"} K</kbd></button>
    ${podeVer("resumo") ? `<button class="adm-gh solo adm-dash" data-s="resumo"><span class="ai">${aic("resumo")}</span><span class="adm-gn">Dashboard</span></button>` : ""}
    ${MENU.map(([cat, gs]) => { const h = gs.map(grupo).join(""); return h ? `<span class="adm-cat">${cat}</span>${h}` : ""; }).join("")}
    ${extra.length ? `<span class="adm-cat">Outros</span>${extra.map(k => `<button class="adm-gh solo" data-s="${k}"><span class="ai">${aic(k)}</span><span class="adm-gn">${esc(NS[k] || k)}</span></button>`).join("")}` : ""}`;
  $("adm-tabs").querySelectorAll("[data-s]").forEach(b => b.onclick = () => { ir(b.dataset.s); fechaMenu(); });
  $("adm-tabs").querySelectorAll(".adm-g > .adm-gh").forEach(b => b.onclick = () => { const g = b.parentNode, ab = !g.classList.contains("ab"); abreGrupo(g, ab); MENU_AB[g.dataset.g] = ab; try{ localStorage.setItem("ck_adm_menu", JSON.stringify(MENU_AB)); }catch(e){} });
  $("adm-busca-bt").onclick = () => { fechaMenu(); abreBusca(); };
  // topo do celular: botão de menu, título da tela e busca
  const top = document.querySelector(".adm-top");
  if(top && !$("adm-mb")){ top.insertAdjacentHTML("afterbegin", `<button class="adm-mb" id="adm-mb" aria-label="Abrir menu" aria-controls="adm-tabs" aria-expanded="false">${aic("menu", 22)}</button>`); top.insertAdjacentHTML("beforeend", `<span class="adm-cur" id="adm-cur"></span><button class="adm-sb" id="adm-sb" aria-label="Buscar">${aic("busca", 20)}</button><div class="adm-veu" id="adm-veu" hidden></div>`);
    $("adm-mb").onclick = () => document.body.classList.contains("adm-menu-on") ? fechaMenu() : abreMenu(); $("adm-veu").onclick = fechaMenu; $("adm-sb").onclick = abreBusca; }
}
function abreGrupo(g, ab){ g.classList.toggle("ab", ab); g.querySelector(".adm-gh").setAttribute("aria-expanded", ab); }
function abreMenu(){ document.body.classList.add("adm-menu-on"); $("adm-veu").hidden = false; $("adm-mb").setAttribute("aria-expanded", "true"); const on = $("adm-tabs").querySelector("button.on"); if(on) on.scrollIntoView({ block: "center" }); }
function fechaMenu(){ document.body.classList.remove("adm-menu-on"); const v = $("adm-veu"); if(v) v.hidden = true; const m = $("adm-mb"); if(m) m.setAttribute("aria-expanded", "false"); }
document.addEventListener("keydown", e => { if(e.key === "Escape" && document.body.classList.contains("adm-menu-on")) fechaMenu(); });
const irUx = ir; ir = function(s){
  irUx(s);
  const t = $("adm-tabs"); if(!t) return;
  t.querySelectorAll("[data-s]").forEach(b => b.classList.toggle("on", b.dataset.s === SEC));
  t.querySelectorAll(".adm-g").forEach(g => { const tem = !!g.querySelector(`[data-s="${SEC}"]`); g.classList.toggle("tem", tem); abreGrupo(g, tem || !!MENU_AB[g.dataset.g]); });
  const g = grupoDe(SEC), cur = $("adm-cur"); if(cur) cur.textContent = SEC === "resumo" ? "Dashboard" : (MENU_NOME[SEC] || (SECOES.find(x => x[0] === SEC) || [, ""])[1]);
  if(history.replaceState && !location.hash.startsWith("#admin-" + SEC)) history.replaceState(null, "", "#admin-" + SEC);
  subNav();
};
/* sub-navegação da seção (ex.: Usuárias → Lista, Verificações, Ciclo); volta sozinha se a tela for redesenhada */
function subNav(){
  const g = grupoDe(SEC); if(!g || $("adm-sub")) return; const vis = g[2].filter(k => podeVer(k) && VIEWS[k]); if(vis.length < 2) return;
  const h = document.querySelector("#adm-main > .head"); if(!h) return;
  h.insertAdjacentHTML("afterend", `<nav class="adm-sub" id="adm-sub" aria-label="${esc(g[0])}">${vis.map(k => `<button class="chip" data-sub="${k}" aria-pressed="${k === SEC}">${esc(MENU_NOME[k] || (SECOES.find(x => x[0] === k) || [, k])[1])}</button>`).join("")}</nav>`);
  document.querySelectorAll("#adm-sub [data-sub]").forEach(b => b.onclick = () => ir(b.dataset.sub));
}
new MutationObserver(() => { if(!$("v-admin").hidden) subNav(); }).observe($("adm-main"), { childList: true });
/* modal: sempre volta ao tamanho normal; "Esc" fecha */
const modalUx = modal; modal = function(){ $("mbox").classList.remove("mbox-wide"); return modalUx.apply(this, arguments); };

/* ---------- Busca global ---------- */
let BUSCA_SEL = 0, BUSCA_R = [];
function abreBusca(){
  let b = $("adm-busca"); if(!b){ b = document.createElement("div"); b.id = "adm-busca"; b.className = "adm-busca"; b.innerHTML = `<div class="adm-bx" role="dialog" aria-modal="true" aria-label="Buscar no painel"><div class="adm-bi">${aic("busca", 18)}<input id="adm-bq" placeholder="Buscar alunas, anúncios, notificações, receitas, telas…" autocomplete="off"><kbd>Esc</kbd></div><div class="adm-br" id="adm-br"></div></div>`; document.body.appendChild(b);
    b.onclick = e => { if(e.target === b) fechaBusca(); };
    let t; $("adm-bq").oninput = () => { clearTimeout(t); t = setTimeout(buscaRoda, 120); };
    $("adm-bq").onkeydown = e => { if(e.key === "ArrowDown"){ e.preventDefault(); BUSCA_SEL = Math.min(BUSCA_R.length - 1, BUSCA_SEL + 1); buscaPinta(); } else if(e.key === "ArrowUp"){ e.preventDefault(); BUSCA_SEL = Math.max(0, BUSCA_SEL - 1); buscaPinta(); } else if(e.key === "Enter"){ const r = BUSCA_R[BUSCA_SEL]; if(r){ fechaBusca(); r.ir(); } } else if(e.key === "Escape") fechaBusca(); }; }
  b.hidden = false; document.body.classList.add("adm-busca-on"); $("adm-bq").value = ""; $("adm-bq").focus(); buscaRoda(); setTimeout(() => $("adm-bq").focus(), 20);
}
function fechaBusca(){ const b = $("adm-busca"); if(b) b.hidden = true; document.body.classList.remove("adm-busca-on"); }
document.addEventListener("keydown", e => { if($("v-admin") && $("v-admin").hidden) return; if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){ e.preventDefault(); abreBusca(); } else if(e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") && $("modal").hidden){ e.preventDefault(); abreBusca(); } });
const sem = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
let BUSCA_POST = 0;
function buscaRoda(){
  const q = sem($("adm-bq").value.trim()), db = DB(), R = [], tem = x => !q || sem(x).includes(q);
  const add = (tipo, ic, titulo, sub, fn) => R.push({ tipo, ic, titulo, sub, ir: fn });
  SECOES.filter(([k]) => podeVer(k) && VIEWS[k]).forEach(([k, n]) => { const g = grupoDe(k), nome = k === "resumo" ? "Dashboard" : MENU_NOME[k] || n; if(tem(nome + " " + n + " " + (g ? g[0] : ""))) add("Tela", k, nome, g ? g[0] : "Painel", () => ir(k)); });
  if(q.length >= 2){
    if(podeVer("alunos")) db.users.filter(u => !u.soAdmin && tem(u.nome + " " + u.email + " " + (u.whats || ""))).slice(0, 8).forEach(u => add("Aluna", "alunos", u.nome || u.email, u.email, () => { AF.q = u.email; ir("alunos"); }));
    if(podeVer("campanhas")) db.campanhas.filter(c => tem((c.titulo || "") + " " + anuNome(c.anunc))).slice(0, 5).forEach(c => add("Anúncio", "campanhas", c.titulo || "(sem título)", anuNome(c.anunc), () => { ir("campanhas"); formCamp(c); }));
    if(podeVer("anunciantes")) db.anunciantes.filter(a => tem(a.nome)).slice(0, 4).forEach(a => add("Anunciante", "anunciantes", a.nome, cidNome(a.cidade), () => ir("anunciantes")));
    if(podeVer("notificacoes") && NT_CACHE) NT_CACHE.filter(n => tem(n.titulo + " " + n.mensagem)).slice(0, 5).forEach(n => add("Notificação", "notificacoes", n.titulo, (NT_ST[n.status] || [n.status])[0], () => ir("notificacoes")));
    if(podeVer("receitas")) F.receitas().filter(r => tem(r.nome)).slice(0, 5).forEach(r => add("Receita", "receitas", r.nome, `${r.kcal} kcal`, () => ir("receitas")));
    if(podeVer("exercicios")) F.exercicios().filter(x => tem(x.nome)).slice(0, 5).forEach(x => add("Exercício", "exercicios", x.nome, "Treinos", () => ir("exercicios")));
    [["pro", "Plano Pro", "Assinaturas e planos", "monetizacao"], ["kiwify", "Vendas Kiwify", "Financeiro", "financeiro"], ["denuncia", "Denúncias", "Comunidade", "moderacao"], ["verificacao", "Verificações de perfil", "Usuárias", "verificacoes"], ["lgpd", "LGPD e privacidade", "Segurança", "seguranca"]].forEach(([k, t, s, sec]) => { if(sem(t + " " + k).includes(q) && podeVer(sec) && VIEWS[sec]) add("Atalho", sec, t, s, () => ir(sec)); });
  }
  BUSCA_R = R.slice(0, 40); BUSCA_SEL = 0; buscaPinta();
  // publicações da comunidade (banco), só com 3+ letras
  if(q.length >= 3 && SB2() && podeVer("comunidade")){ const n = ++BUSCA_POST, termo = $("adm-bq").value.trim().replace(/[%_,()]/g, " ");
    SB2().from("posts").select("id,nome,texto").ilike("texto", `%${termo}%`).order("criado", { ascending: false }).limit(5).then(r => { if(n !== BUSCA_POST || !r.data || !r.data.length) return; r.data.forEach(p => BUSCA_R.push({ tipo: "Publicação", ic: "comunidade", titulo: (p.texto || "").slice(0, 70), sub: p.nome, ir: () => ir("comunidade") })); buscaPinta(); }, () => {}); }
}
function buscaPinta(){
  const box = $("adm-br"); if(!box) return;
  box.innerHTML = BUSCA_R.length ? BUSCA_R.map((r, i) => `<button class="adm-bres ${i === BUSCA_SEL ? "sel" : ""}" data-i="${i}"><span class="ai">${aic(r.ic, 17)}</span><span class="adm-brt"><b>${esc(r.titulo)}</b><small>${esc(r.sub || "")}</small></span><em>${esc(r.tipo)}</em></button>`).join("") : `<div class="adm-bvazio">Nada encontrado. Tente nome, e-mail, título de anúncio ou de notificação.</div>`;
  box.querySelectorAll("[data-i]").forEach(b => { b.onclick = () => { const r = BUSCA_R[+b.dataset.i]; fechaBusca(); r.ir(); }; b.onmousemove = () => { if(BUSCA_SEL !== +b.dataset.i){ BUSCA_SEL = +b.dataset.i; box.querySelectorAll(".adm-bres").forEach((x, j) => x.classList.toggle("sel", j === BUSCA_SEL)); } }; });
  const s = box.querySelector(".sel"); if(s) s.scrollIntoView({ block: "nearest" });
}

/* ---------- Dashboard executivo (números reais; sem dado inventado) ---------- */
let DASH = null, DASH_T = 0;
const relT = s => { const d = (Date.now() - new Date(s).getTime()) / 6e4; return d < 1 ? "agora" : d < 60 ? `há ${Math.round(d)} min` : d < 1440 ? `há ${Math.round(d / 60)} h` : `há ${Math.round(d / 1440)} d`; };
function vDashboard(){
  const db = DB(), al = metricasAlunos(), ini = addD(today(), -29), hoje = today();
  const treinos30 = db.users.reduce((a, u) => a + (u.treinos || []).filter(x => x.d >= ini).length, 0), treinosHoje = db.users.reduce((a, u) => a + (u.treinos || []).filter(x => x.d === hoje).length, 0);
  const adsNoAr = db.campanhas.filter(c => c.ativa && c.inicio <= hoje && (!c.fim || c.fim >= hoje)).length;
  const conv = al.total ? al.pagos / al.total : 0, mesAtras = db.pagamentos.filter(p => p.status !== "pago" && p.venc < hoje).length;
  const D = DASH, h = new Date().getHours();
  const alertas = [];
  if(D){ if(D.denuncias_abertas) alertas.push(["bad", `${int(D.denuncias_abertas)} denúncia(s) aguardando análise`, "moderacao"]); if(D.verificacoes_pendentes) alertas.push(["warn", `${int(D.verificacoes_pendentes)} pedido(s) de verificação com selfie`, "verificacoes"]);
    if(D.webhooks_erro_7d) alertas.push(["bad", `${int(D.webhooks_erro_7d)} pagamento(s) da Kiwify com erro nos últimos 7 dias`, "monetizacao"]); if(D.cron === false) alertas.push(["warn", "Agendador do banco desligado: notificações agendadas e lembretes de treino não saem", "notificacoes"]); }
  if(mesAtras) alertas.push(["warn", `${int(mesAtras)} cobrança(s) de anunciante vencida(s)`, "financeiro"]);
  const ICR = { venda: "financeiro", denuncia: "alerta", notificacao: "notificacoes", cadastro: "alunos" }, SECR = { venda: "financeiro", denuncia: "moderacao", notificacao: "notificacoes", cadastro: "alunos" };
  $("adm-main").innerHTML = `
    <div class="head dash-head"><div><span class="adm-ola">${h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}, ${esc(((ME && ME.nome) || "").split(" ")[0])} · ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span><h1>Dashboard</h1><p class="muted">O que está acontecendo no CK Life agora.</p></div>
      <div class="toolbar">${podeEditar("notificacoes") ? `<button class="btn btn-accent btn-sm" id="dq-not">${aic("notificacoes", 15)} Nova notificação</button>` : ""}${podeEditar("campanhas") ? `<button class="btn btn-line btn-sm" id="dq-ad">Novo anúncio</button>` : ""}</div></div>
    ${alertas.length ? `<div class="dash-alertas">${alertas.map(([k, t, s]) => `<button class="dash-al ${k}" data-ir="${s}"><span>${aic("alerta", 16)}</span>${esc(t)}<i>${aic("chev", 14)}</i></button>`).join("")}</div>` : D ? `<div class="dash-ok">${aic("admins", 16)} Nenhum alerta: denúncias, pagamentos e envios em dia.</div>` : ""}
    <div class="dash-sec"><span class="adm-cat">Usuárias</span></div>
    <div class="grid g4">
      ${kpi("Total de usuárias", int(al.total), `+${int(al.novos7)} nos últimos 7 dias`, "alunos", 1)}
      ${kpi("Ativas hoje", int(al.dau), `${int(al.wau)} na semana · ${int(al.mau)} no mês`, "resumo")}
      ${kpi("Assinantes Pro", int(al.pagos), `Conversão ${pct(al.pagos, al.total)} · ${int(al.teste)} em teste`, "monetizacao")}
      ${kpi("Vendas Pro no mês", money(vendasMes()), VENDAS ? `${(VENDAS || []).filter(v => vendaOk(v) && String(v.quando).slice(0, 7) === hoje.slice(0, 7)).length} venda(s) aprovadas` : "carregando…", "financeiro")}
    </div>
    <div class="dash-sec"><span class="adm-cat">Engajamento</span></div>
    <div class="grid g4">
      ${kpi("Treinos em 30 dias", int(treinos30), `${int(treinosHoje)} hoje`, "exercicios")}
      ${kpi("Comunidade (7 dias)", D ? int(D.posts_7d) + " posts" : "-", D ? `${int(D.comentarios_7d)} comentários · ${int(D.curtidas_7d)} curtidas` : "ative o banco", "comunidade")}
      ${kpi("Notificações (30 dias)", D ? int(D.notif_30d) : "-", D ? `${int(D.notif_enviados_30d)} entregas · ${int(D.notif_agendadas)} agendada(s)` : "", "notificacoes")}
      ${kpi("Anúncios no ar", int(adsNoAr), `${int(db.anunciantes.filter(a => a.ativo).length)} anunciante(s) ativo(s)`, "campanhas")}
    </div>
    <div class="grid g2 dash-g">
      <div class="card"><div class="sec-title"><h3>Alunas ativas por dia</h3><small class="muted">últimos 30 dias</small></div>${barChart(al.serie, "alunos", "alunas")}</div>
      <div class="card"><div class="sec-title"><h3>Atividade recente</h3></div><div class="dash-rec" id="dash-rec">${D ? (D.recentes || []).slice(0, 8).map(r => `<button class="dash-ri" data-ir="${SECR[r.tipo] || "resumo"}"><span class="ai">${aic(ICR[r.tipo] || "resumo", 16)}</span><span><b>${esc(r.texto)}</b><small>${relT(r.quando)}</small></span></button>`).join("") || `<p class="muted" style="margin:0">Sem atividade recente.</p>` : `<div class="skel" style="height:14px;width:80%"></div><div class="skel" style="height:14px;width:60%;margin-top:12px"></div><div class="skel" style="height:14px;width:70%;margin-top:12px"></div>`}</div></div>
    </div>`;
  $("adm-main").querySelectorAll("[data-ir]").forEach(b => b.onclick = () => ir(podeVer(b.dataset.ir) ? b.dataset.ir : "resumo"));
  const n = $("dq-not"); if(n) n.onclick = () => { ir("notificacoes"); setTimeout(() => formNotif(), 50); };
  const a = $("dq-ad"); if(a) a.onclick = () => { ir("campanhas"); formCamp(); };
  if(SB2() && Date.now() - DASH_T > 60000){ DASH_T = Date.now(); SB2().rpc("admin_painel_resumo").then(r => { if(r.data){ DASH = r.data; if(SEC === "resumo") vDashboard(); } }, () => {}); }
}
VIEWS.resumo = comVendas(vDashboard);
