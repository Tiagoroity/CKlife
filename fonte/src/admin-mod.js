/* ===================== Painel · MÓDULOS DO APP, PERMISSÕES DOS ADMINS e PRO GRÁTIS ===================== */
AIC.modulos = '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><path d="M17.5 14v7M14 17.5h7"/>';
SECOES.push(["modulos", "Módulos do app"]);
MENU_NOME.modulos = "Módulos do app";
const MODS = [
  ["perto", "Perto de você", "Academias, estúdios e profissionais presenciais da cidade da aluna.", () => DB().empresas.filter(e => e.ativo !== false).length + DB().profissionais.filter(p => p.ativo !== false && (p.modo || "presencial") !== "online").length, "empresas"],
  ["online", "Atendimento online", "Nutricionistas, personais e outros profissionais que atendem pela internet.", () => DB().profissionais.filter(p => p.ativo !== false && ["online", "ambos"].includes(p.modo)).length, "profissionais"],
  ["servicos", "Serviços e agendamentos", "Agendar aulas, avaliações e consultas. Some também “Meus agendamentos” do Perfil.", () => DB().servicos.filter(s => s.ativo !== false).length, "servicos"],
  ["clube", "Clube CK", "Benefícios e descontos em parceiros.", () => DB().parceiros.filter(p => p.ativo !== false).length, "parceiros"],
  ["cupons", "Cupons por treino", "A cada X treinos a aluna ganha um cupom (Início, Perfil e fim do treino).", () => DB().parceiros.filter(p => p.ativo !== false && !p.livre).length, "cupons"],
  ["loja", "Loja CK", "Produtos com link para compra (loja própria ou afiliados).", () => DB().produtos.filter(p => p.ativo !== false).length, "produtos"],
  ["camera", "Câmera nos treinos", "Botão “Contar com a câmera”: conta repetições e dá dicas de postura em 5 exercícios. Roda só no celular da aluna, nada é enviado. Cada aluna também pode desligar no Perfil.", () => 5, null]
];
function vModulos(){
  const db = DB(); db.modulos = db.modulos || {};
  const on = k => !(db.modulos[k] && db.modulos[k].on === false);
  $("adm-main").innerHTML = `<div class="head"><div><h1>Módulos do app</h1><p class="muted">Ligue só o que já tem conteúdo. Desligado, some do app das alunas; ao ligar, aparece com o selo <b>Novo</b> por 14 dias e um aviso no Início.</p></div></div>
    <div class="mod-list">${MODS.map(([k, n, d, conta, sec]) => { const ligado = on(k), qt = conta(), m = db.modulos[k] || {};
      return `<div class="mod-row ${ligado ? "on" : ""}"><span class="mod-ai">${aic(sec === "parceiros" ? "parceiros" : sec === "produtos" ? "campanhas" : sec === "cupons" ? "parceiros" : sec === "servicos" ? "resumo" : "explorarg", 20)}</span>
        <span class="mod-info"><b>${esc(n)}</b><small>${esc(d)}</small><small class="mod-st">${ligado ? (m.desde ? `Ligado desde ${brD(m.desde)}` : "Ligado") : "Desligado: não aparece para as alunas"} · ${int(qt)} cadastrado(s)${ligado && !qt ? ` · <span class="mod-alerta">sem conteúdo: a seção fica escondida</span>` : ""}</small></span>
        <span class="mod-acts">${podeVer(sec) && VIEWS[sec] ? `<button class="btn btn-line btn-sm" data-cad="${sec}">Cadastrar</button>` : ""}<button class="mod-sw needs-edit" role="switch" aria-checked="${ligado}" aria-label="${ligado ? "Desligar" : "Ligar"} ${esc(n)}" data-mod="${k}"><i></i></button></span></div>`; }).join("")}</div>
    <p class="hint" style="margin-top:12px">Se todos os módulos do Explorar estiverem desligados, a aba Explorar some do menu das alunas.</p>`;
  $("adm-main").querySelectorAll("[data-cad]").forEach(b => b.onclick = () => ir(b.dataset.cad));
  $("adm-main").querySelectorAll("[data-mod]").forEach(b => b.onclick = () => trocaModulo(b.dataset.mod, vModulos));
}
function modLigado(k){ const m = (DB().modulos || {})[k]; return !(m && m.on === false); }
function trocaModulo(k, depois){
  const db = DB(); db.modulos = db.modulos || {}; if(!podeEditar("modulos") && !PERM.total) return toast("Seu acesso não permite ligar/desligar módulos (área Módulos do app)");
  { const n = MODS.find(x => x[0] === k)[1], liga = !modLigado(k), on = modLigado;
    const aplica = () => { db.modulos[k] = { on: liga, desde: liga ? today() : (db.modulos[k] || {}).desde || null, por: (ME && ME.email) || "" }; db.modulos = { ...db.modulos }; save(); depois && depois();
      if(liga) modal("Módulo ligado", `<p style="margin:0"><b>${esc(n)}</b> já aparece no app com o selo <b>Novo</b> e um aviso no Início das alunas.</p>${podeEditar("notificacoes") ? `<p class="muted" style="margin:0">Quer avisar no celular também?</p><div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Agora não</button><button class="btn btn-accent" id="md-avisa">Criar notificação</button></div>` : `<div class="toolbar" style="justify-content:flex-end"><button class="btn btn-accent" data-close>Ok</button></div>`}`), $("md-avisa") && ($("md-avisa").onclick = () => { fechar(); ir("notificacoes"); setTimeout(() => formNotif({ titulo: `Novidade: ${n} no CK Life`, mensagem: "Toque para conhecer. Chegou para deixar sua rotina ainda mais completa 💚", link: "/?ir=explorar", publico: { tipo: "todas" } }), 60); });
      else toast(`${n} desligado. Já não aparece para as alunas.`); };
    liga ? aplica() : confirmar(`Desligar "${n}"? Ele some do app das alunas na próxima vez que abrirem. Nada é apagado.`, aplica); }
}
VIEWS.modulos = vModulos;
/* barra "Aparece no app" no topo de cada tela ligada a um módulo (não precisa ir em Configurações) */
const SEC_MODS = { parceiros: ["clube"], cupons: ["cupons"], produtos: ["loja"], empresas: ["perto"], profissionais: ["perto", "online"], servicos: ["servicos"], agendamentos: ["servicos"], avaliacoes: ["perto", "online"] };
function barraModulo(){
  const ks = SEC_MODS[SEC]; if(!ks || $("mod-bar")) return; const h = document.querySelector("#adm-main > .adm-sub") || document.querySelector("#adm-main > .head"); if(!h) return;
  h.insertAdjacentHTML("afterend", `<div class="mod-bar" id="mod-bar">${ks.map(k => { const on = modLigado(k), n = MODS.find(x => x[0] === k)[1];
    return `<div class="mod-bi ${on ? "on" : ""}"><span><b>${esc(n)}</b><small>${on ? "Aparece no app das alunas" : "Escondido do app das alunas"}</small></span><button class="mod-sw" role="switch" aria-checked="${on}" aria-label="${on ? "Desligar" : "Ligar"} ${esc(n)} no app" data-mb="${k}"><i></i></button></div>`; }).join("")}</div>`);
  document.querySelectorAll("#mod-bar [data-mb]").forEach(b => b.onclick = () => trocaModulo(b.dataset.mb, () => { const x = $("mod-bar"); if(x) x.remove(); barraModulo(); }));
}
new MutationObserver(() => { if(!$("v-admin").hidden) barraModulo(); }).observe($("adm-main"), { childList: true });
const irMb = ir; ir = function(s){ irMb(s); barraModulo(); };

/* ---------- Permissões dos administradores: por área, com filtro e papéis prontos ---------- */
const PAPEIS = {
  adm: ["Administrador", k => ["admins", "config", "modulos"].includes(k) ? "ver" : "editar"],
  op: ["Operador", k => ["agendamentos", "avaliacoes", "comunidade", "cupons"].includes(k) ? "editar" : ["admins", "config", "financeiro", "monetizacao", "ciclo", "seguranca", "lgpd", "incidentes", "auditoria", "documentos", "modulos"].includes(k) ? "" : "ver"],
  moderador: ["Moderador", { moderacao: "editar", comunidade: "editar", grupos: "editar", verificacoes: "ver" }],
  suporte: ["Suporte", { alunos: "ver", agendamentos: "ver", resumo: "ver" }],
  marketing: ["Marketing", { notificacoes: "editar", campanhas: "editar", anunciantes: "editar", banners: "editar", destaques: "editar", metricas: "ver", resumo: "ver" }],
  conteudo: ["Conteúdo e exercícios", { exercicios: "editar", receitas: "editar", figurinhas: "editar", avisos: "editar", categorias: "editar" }],
  financeiro: ["Financeiro", { monetizacao: "editar", financeiro: "editar", metricas: "ver", resumo: "ver" }],
  verificacao: ["Revisor de verificação", { verificacoes: "editar" }],
  privacidade: ["Privacidade/LGPD", { lgpd: "editar", incidentes: "editar", documentos: "editar", seguranca: "ver", auditoria: "ver" }],
  explorar: ["Parcerias e Explorar", { empresas: "editar", profissionais: "editar", servicos: "editar", agendamentos: "editar", avaliacoes: "ver", parceiros: "editar", cupons: "editar", produtos: "editar", modulos: "editar" }]
};
const PERM_EXTRA = { Segurança: ["lgpd", "incidentes", "auditoria", "documentos"] };
formPerm = function(u){
  const p = u.perms || {}, NS = Object.fromEntries(SECOES), usados = new Set(["resumo"]);
  const grupos = [["Visão geral", ["resumo"]], ...MENU.flatMap(([, gs]) => gs.map(([n, , ks]) => [n, [...ks, ...(PERM_EXTRA[n] || [])].filter(k => NS[k])]))];
  grupos.forEach(([, ks]) => ks.forEach(k => usados.add(k)));
  const resto = SECOES.map(s => s[0]).filter(k => !usados.has(k)); if(resto.length) grupos.push(["Outros", resto]);
  const opt = (k, v) => `<div class="pm-seg" role="radiogroup" data-k="${k}">${[["", "Sem acesso"], ["ver", "Ver"], ["editar", "Editar"]].map(([x, t]) => `<button type="button" role="radio" data-v="${x}" aria-checked="${(p[k] || "") === x}">${t}</button>`).join("")}</div>`;
  modal("Permissões · " + (u.nome || u.email), `<label class="pm-total"><input type="checkbox" id="pm-t" ${p.total ? "checked" : ""}> <span><b>Acesso total</b><small>Vê e edita tudo, inclusive administradores.</small></span></label>
    <div class="pm-pap"><span class="muted">Papel pronto:</span>${Object.entries(PAPEIS).map(([k, [n]]) => `<button type="button" class="chip" data-pap="${k}" aria-pressed="${p.papel === k}">${n}</button>`).join("")}</div>
    <div class="pm-top"><div class="search">${aic("busca", 16)}<input class="input" id="pm-q" placeholder="Filtrar áreas (ex.: anúncios, alunas, financeiro)"></div><span class="muted" id="pm-n"></span></div>
    <div class="pm-gs" id="pm-g">${grupos.map(([g, ks]) => `<div class="pm-g" data-gn="${esc(g)}"><div class="pm-gh"><b>${esc(g)}</b><span class="pm-all"><button type="button" data-all="">Nenhum</button><button type="button" data-all="ver">Ver tudo</button><button type="button" data-all="editar">Editar tudo</button></span></div>
      ${ks.map(k => `<div class="pm-r" data-nome="${esc(sem((MENU_NOME[k] || NS[k] || k) + " " + g))}"><span>${esc(MENU_NOME[k] || NS[k] || k)}</span>${opt(k)}</div>`).join("")}</div>`).join("")}</div>
    <div id="pm-msg"></div><div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Cancelar</button><button class="btn btn-accent" id="pm-ok">Salvar permissões</button></div>`);
  $("mbox").classList.add("mbox-wide");
  let papel = p.papel || null;
  const conta = () => { const n = [...$("pm-g").querySelectorAll(".pm-seg")].filter(s => s.querySelector('[aria-checked="true"]').dataset.v).length; $("pm-n").textContent = $("pm-t").checked ? "Acesso total" : `${n} área(s) liberada(s)`; };
  const marca = (seg, v) => seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", b.dataset.v === v));
  const sync = () => { $("pm-g").classList.toggle("off", $("pm-t").checked); conta(); }; $("pm-t").onchange = sync; sync();
  $("pm-g").querySelectorAll(".pm-seg button").forEach(b => b.onclick = () => { marca(b.parentNode, b.dataset.v); papel = null; $("mbox").querySelectorAll("[data-pap]").forEach(x => x.setAttribute("aria-pressed", "false")); conta(); });
  $("pm-g").querySelectorAll("[data-all]").forEach(b => b.onclick = () => { b.closest(".pm-g").querySelectorAll(".pm-r:not([hidden]) .pm-seg").forEach(s => marca(s, b.dataset.all)); papel = null; conta(); });
  $("mbox").querySelectorAll("[data-pap]").forEach(b => b.onclick = () => { const [, regra] = PAPEIS[b.dataset.pap]; $("pm-t").checked = false; sync();
    $("pm-g").querySelectorAll(".pm-seg").forEach(s => marca(s, typeof regra === "function" ? regra(s.dataset.k) : regra[s.dataset.k] || "")); papel = b.dataset.pap;
    $("mbox").querySelectorAll("[data-pap]").forEach(x => x.setAttribute("aria-pressed", x === b)); conta(); });
  $("pm-q").oninput = () => { const q = sem($("pm-q").value.trim()); $("pm-g").querySelectorAll(".pm-g").forEach(g => { let vis = 0; g.querySelectorAll(".pm-r").forEach(r => { const ok = !q || r.dataset.nome.includes(q); r.hidden = !ok; vis += ok; }); g.hidden = !vis; }); };
  $("pm-ok").onclick = () => {
    const tot = $("pm-t").checked;
    if(!tot && u.id === ME.id && !DB().users.some(x => x.admin && x.id !== u.id && x.perms && x.perms.total)){ $("pm-msg").innerHTML = `<div class="msg msg-bad">Precisa ficar pelo menos um administrador com acesso total.</div>`; return; }
    const np = tot ? { total: true } : {}; if(!tot){ $("pm-g").querySelectorAll(".pm-seg").forEach(s => { const v = s.querySelector('[aria-checked="true"]').dataset.v; if(v) np[s.dataset.k] = v; }); if(papel) np.papel = papel; }
    if(!tot && Object.keys(np).filter(k => k !== "papel").length === 0){ $("pm-msg").innerHTML = `<div class="msg msg-bad">Libere pelo menos uma área (ou remova o administrador).</div>`; return; }
    u.perms = np; save(); fechar(); toast("Permissões salvas"); if(u.id === ME.id) abrir(); else rerender();
  };
};
/* lista de admins: mostra o papel e um resumo das áreas */
const vAdminsM = vAdmins; vAdmins = function(){ vAdminsM(); document.querySelectorAll("#adm-main tbody tr").forEach(tr => { const b = tr.querySelector("[data-pm]"); if(!b) return; const u = DB().users.find(x => x.id === b.dataset.pm); if(!u || !u.perms || u.perms.total) return;
  const td = tr.children[2], ks = Object.keys(u.perms).filter(k => k !== "papel"); td.innerHTML = `${u.perms.papel && PAPEIS[u.perms.papel] ? `<span class="st ok">${esc(PAPEIS[u.perms.papel][0])}</span> ` : ""}<small class="muted">${ks.slice(0, 4).map(k => esc(MENU_NOME[k] || (SECOES.find(s => s[0] === k) || [, k])[1])).join(", ")}${ks.length > 4 ? ` +${ks.length - 4}` : ""}</small>`; }); };
VIEWS.admins = vAdmins;

/* ---------- Pro grátis com um botão (libera no app automaticamente, avisa a aluna, fica na auditoria) ---------- */
const DUR_PRO = [[7, "7 dias"], [30, "30 dias"], [90, "3 meses"], [180, "6 meses"], [365, "1 ano"], [3650, "Sem prazo"]];
const MOT_PRO = ["Cortesia", "Parceria", "Influenciadora / divulgação", "Sorteio ou promoção", "Compensação (suporte)", "Equipe CK Life"];
function modalPro(u){
  const s = u && PLU && PLU[u.id], manual = s && s.pro && ["manual", "promocao"].includes(s.provider);
  modal(u ? `Pro grátis · ${u.nome || u.email}` : "Dar Pro grátis", `${u ? `<div class="pro-atual">${s && s.pro ? `<span class="st ok">${s.trial ? "Em teste grátis" : ["kiwify", "apple", "google"].includes(s.provider) ? "Pro pago" : "Pro grátis"}</span> até ${s.fim ? brD(String(s.fim).slice(0, 10)) : "sem prazo"}` : `<span class="st off">Plano grátis</span>`}</div>` : `<div class="field"><label for="pg-e">E-mail da aluna</label><input class="input" id="pg-e" type="email" list="pg-lista" placeholder="aluna@email.com"><datalist id="pg-lista">${DB().users.filter(x => !x.soAdmin).slice(0, 400).map(x => `<option value="${esc(x.email)}">${esc(x.nome || "")}</option>`).join("")}</datalist></div>`}
    <div class="field"><label>Por quanto tempo</label><div class="seg-pills" id="pg-d">${DUR_PRO.map(([d, t], i) => `<button type="button" class="chip" data-d="${d}" aria-pressed="${i === 1}">${t}</button>`).join("")}</div></div>
    <div class="field"><label for="pg-m">Motivo (fica registrado)</label><select class="input" id="pg-m">${MOT_PRO.map(m => `<option>${m}</option>`).join("")}</select></div>
    <p class="hint" style="margin:0">Libera na hora todos os recursos Pro e a coroa na foto. A aluna recebe um aviso no app e no celular. ${s && s.pro && ["kiwify", "apple", "google"].includes(s.provider) ? "Ela já paga o Pro; o tempo grátis soma a partir de hoje." : ""}</p>
    <div id="pg-msg"></div><div class="toolbar" style="justify-content:space-between">${manual ? `<button class="btn btn-bad" id="pg-tira">Tirar Pro grátis</button>` : "<span></span>"}<button class="btn btn-accent" id="pg-ok"><i class='ckc' aria-hidden='true'></i> Liberar Pro</button></div>`);
  let dias = 30; $("pg-d").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { dias = +b.dataset.d; $("pg-d").querySelectorAll("[data-d]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("pg-ok").onclick = async () => {
    const alvo = u || DB().users.find(x => x.email === val("pg-e").toLowerCase()); if(!alvo){ $("pg-msg").innerHTML = `<div class="msg msg-bad">Nenhuma aluna com esse e-mail. Ela precisa criar a conta primeiro.</div>`; return; }
    if(!SB2()){ aplicaPrem(alvo, dias >= 3650 ? "vitalicio" : String(dias)); save(); fechar(); toast("Pro liberado (modo demonstração)"); return rerender(); }
    const bt = $("pg-ok"); bt.disabled = true;
    try{ await sq(SB2().rpc("admin_conceder_pro", { p_user: alvo.id, p_dias: dias, p_motivo: val("pg-m") })); fechar(); toast(`Pro liberado para ${alvo.nome || alvo.email}`); await carregaVendasAdm(true); rerender(); }
    catch(e){ bt.disabled = false; $("pg-msg").innerHTML = `<div class="msg msg-bad">${/permiss/i.test(e.message || "") ? "Seu acesso não permite dar Pro (precisa de Alunas ou Monetização com edição)." : esc(e.message || "Não deu agora")}${/function|schema cache/i.test(e.message || "") ? " · Rode o modulos.sql no Supabase." : ""}</div>`; }
  };
  const t = $("pg-tira"); if(t) t.onclick = () => confirmar(`Tirar o Pro grátis de ${u.nome || u.email}? Ela volta ao plano grátis agora (nada é apagado).`, async () => {
    try{ await sq(SB2().rpc("admin_remover_pro_usuaria", { p_user: u.id, p_motivo: "Removido pelo painel" })); toast("Pro grátis removido"); await carregaVendasAdm(true); rerender(); }catch(e){ toast("Não deu: " + (e.message || "sem permissão")); } });
}
const vAlunosPro = vAlunos;
VIEWS.alunos = comVendas(function(){ vAlunosPro.apply(this, arguments);
  const pb = $("al-prem"); if(pb){ pb.innerHTML = `<i class='ckc' aria-hidden='true'></i> Dar Pro grátis`; pb.onclick = () => modalPro(); }
  $("adm-main").querySelectorAll("tbody [data-ed]").forEach(b => { if(b.parentNode.querySelector("[data-pro]")) return; const u = DB().users.find(x => x.id === b.dataset.ed); if(!u) return; const s = PLU && PLU[u.id];
    b.insertAdjacentHTML("beforebegin", `<button class="btn btn-sm ${s && s.pro && !s.trial ? "btn-line" : "btn-soft"} needs-edit" data-pro="${u.id}" title="Dar ou tirar Pro grátis">${s && s.pro && !s.trial ? "Pro" : "Dar Pro"}</button> `);
    b.parentNode.querySelector("[data-pro]").onclick = () => modalPro(u); }); });
