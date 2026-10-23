
/* ===================== Painel · MONETIZAÇÃO, VERIFICAÇÕES, EXERCÍCIOS (voz), CIDADES ===================== */
AIC.monetizacao = '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>';
AIC.verificacoes = '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>';
SECOES.push(["monetizacao", "Monetização"], ["verificacoes", "Verificações"]);
GRUPOS.splice(1, 0, ["Monetização", ["monetizacao"]]);
GRUPOS.forEach(g => { if(g[0] === "Social e moderação" && !g[1].includes("verificacoes")) g[1].push("verificacoes"); });
const MON_SUB = [["geral","Visão geral"],["planos","Planos"],["assinaturas","Assinaturas"],["trials","Trials"],["ofertas","Ofertas"],["recursos","Recursos Free/Pro"],["receitas","Receitas Free/Pro"],["webhooks","Pagamentos/Webhooks"],["config","Configurações"]];
let MONA = "geral";
const ST_ASS = { trialing: "Teste", active: "Ativa", past_due: "Pagamento pendente", grace_period: "Carência", canceled: "Cancelada (até o fim)", expired: "Expirada", refunded: "Reembolsada", chargeback: "Chargeback" };
const PROV = { trial: "Teste", kiwify: "Kiwify", apple: "Apple", google: "Google", manual: "Manual", promocao: "Promoção", legado: "Legado" };
const brlA = v => "R$ " + Number(v || 0).toFixed(2).replace(".", ",");
function vMonetizacao(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Monetização</h1><p class="muted">CK Life Free, teste de 7 dias e CK Life Pro. O acesso Pro é decidido no servidor (nunca pelo app).</p></div></div>
    <div class="chips scroll seg-sub">${MON_SUB.map(([k, n]) => `<button class="chip" data-mo="${k}" aria-pressed="${MONA === k}">${n}</button>`).join("")}</div><div id="mo-b"><div class="card">Carregando…</div></div>`;
  $("adm-main").querySelectorAll("[data-mo]").forEach(b => b.onclick = () => { MONA = b.dataset.mo; vMonetizacao(); });
  if(!SB2()) return $("mo-b").innerHTML = `<div class="card">Funciona no app oficial, com o banco conectado.</div>`;
  ({ geral: moGeral, planos: moPlanos, assinaturas: moAssin, trials: moTrials, ofertas: moOfertas, recursos: moRecursos, receitas: moReceitas, webhooks: moWebhooks, config: moConfig })[MONA]().catch(e => { const b = $("mo-b"); if(b) b.innerHTML = semBanco(e).replace("seguranca.sql", "monetizacao.sql"); });
}
const MB = () => $("mo-b");
async function moGeral(){
  const r = await sq(SB2().rpc("admin_monetizacao_resumo")); if(!r) return MB().innerHTML = `<div class="card">Seu acesso não inclui Monetização.</div>`;
  const conv = r.trials_30d ? Math.round(100 * r.trial_convertidos / Math.max(1, r.trials_30d + r.trial_convertidos)) : 0;
  MB().innerHTML = `<div class="grid g4">${kpi("Free", int(r.free), "", "alunos", 1)}${kpi("Em teste", int(r.trial), `${int(r.trial_termina_hoje)} terminam hoje · ${int(r.trial_termina_48h)} em 48h`)}${kpi("Pro", int(r.pro), `${int(r.mensais)} mensais · ${int(r.anuais)} anuais`)}${kpi("Teste → Pro", conv + "%", `${int(r.trial_convertidos)} converteram`)}</div>
    <div class="grid g4">${kpi("Receita bruta (30 dias)", brlA(r.receita_bruta_30d), "valor cobrado pela Kiwify, antes de taxas (não é lucro)", "financeiro")}${kpi("Cancelamentos (30d)", int(r.cancelamentos_30d))}${kpi("Pagamento pendente", int(r.past_due))}${kpi("Reembolsos · chargebacks", `${int(r.reembolsos_30d)} · ${int(r.chargebacks_30d)}`)}</div>
    <div class="grid g2"><div class="card"><h3>Ofertas</h3><div class="tbl"><table><thead><tr><th>Campanha</th><th>Ofertas</th><th>Impressões</th><th>Cliques</th><th>Checkout</th><th>Conversões</th></tr></thead><tbody>${(r.ofertas || []).map(o => `<tr><td>${esc(o.campanha)}</td><td class="num">${int(o.ofertas)}</td><td class="num">${int(o.impressoes)}</td><td class="num">${int(o.cliques)}</td><td class="num">${int(o.checkouts)}</td><td class="num">${int(o.conversoes)}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">Sem ofertas ainda.</td></tr>`}</tbody></table></div></div>
    <div class="card"><h3>Pro por cidade</h3>${Object.entries(r.pro_por_cidade || {}).map(([c, n]) => `<p style="margin:4px 0">${esc((DB().cidades.find(x => String(x.id) === c) || {}).nome || "Sem cidade")} · <b>${int(n)}</b></p>`).join("") || `<p class="muted">Sem assinantes ainda.</p>`}</div></div>`;
}
async function moPlanos(){
  const L = await sq(SB2().from("planos").select("*").order("ordem"));
  MB().innerHTML = `<p class="muted" style="font-size:13px">Preço, produto e link de checkout num lugar só. O "12x" só aparece quando você marcar que o checkout realmente permite o parcelamento sem mudar o valor.</p>
    <div class="tbl"><table><thead><tr><th>Plano</th><th>Preço</th><th>Parcelas</th><th>Provider</th><th>Produto</th><th>Checkout</th><th>Ativo</th><th></th></tr></thead><tbody>${L.map(p => `<tr><td><b>${esc(p.nome)}</b><br><small class="muted">${esc(p.id)}</small></td><td class="num">${brlA(p.preco)}${p.periodo === "ano" ? "/ano" : p.periodo === "mes" ? "/mês" : ""}</td><td>${p.parcelas ? `${p.parcelas}x ${brlA(p.parcela_valor)} ${p.parcelamento ? "✓" : "(oculto)"}` : "-"}</td><td>${esc(PROV[p.provider] || p.provider)}</td><td><small>${esc(p.product_id || "—")}</small></td><td>${p.checkout_url ? `<span class="st ok">configurado</span>` : p.periodo === "gratis" ? "-" : `<span class="st warn">falta</span>`}</td><td>${p.ativo ? "sim" : "não"}</td><td><button class="btn btn-line btn-sm needs-edit" data-pp="${p.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
  MB().querySelectorAll("[data-pp]").forEach(b => b.onclick = () => { const p = L.find(x => x.id === b.dataset.pp);
    modal("Plano · " + p.nome, `<div class="formgrid"><div class="field"><label for="pp-n">Nome</label><input class="input" id="pp-n" value="${esc(p.nome)}"></div><div class="field"><label for="pp-v">Preço (R$)</label><input class="input num" id="pp-v" value="${esc(p.preco)}"></div>
      <div class="field"><label for="pp-pa">Parcelas</label><input class="input num" id="pp-pa" value="${esc(p.parcelas || "")}"></div><div class="field"><label for="pp-pv">Valor da parcela</label><input class="input num" id="pp-pv" value="${esc(p.parcela_valor || "")}"></div>
      <label class="field xf-chk"><input type="checkbox" id="pp-pc" ${p.parcelamento ? "checked" : ""}> O checkout permite esse parcelamento</label><label class="field xf-chk"><input type="checkbox" id="pp-at" ${p.ativo ? "checked" : ""}> Ativo</label>
      <div class="field"><label for="pp-pr">Provider</label><select class="input" id="pp-pr">${Object.entries(PROV).filter(([k]) => ["kiwify","apple","google","manual"].includes(k)).map(([k, n]) => `<option value="${k}" ${p.provider === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="field"><label for="pp-id">ID do produto no provider</label><input class="input" id="pp-id" value="${esc(p.product_id || "")}"></div>
      <div class="field full"><label for="pp-u">Link do checkout</label><input class="input" id="pp-u" value="${esc(p.checkout_url || "")}" placeholder="https://pay.kiwify.com.br/..."></div>
      <div class="field full"><label for="pp-b">Benefícios (um por linha)</label><textarea class="input" id="pp-b">${esc((p.beneficios || []).join("\n"))}</textarea></div></div><button class="btn btn-accent" id="pp-ok">Salvar</button>`);
    $("pp-ok").onclick = async () => { const n = s => s === "" ? null : +String(s).replace(",", ".");
      const d = { nome: val("pp-n"), preco: n(val("pp-v")) || 0, parcelas: n(val("pp-pa")), parcela_valor: n(val("pp-pv")), parcelamento: $("pp-pc").checked, ativo: $("pp-at").checked, provider: val("pp-pr"), product_id: val("pp-id") || null, checkout_url: val("pp-u") || null, beneficios: val("pp-b").split("\n").map(x => x.trim()).filter(Boolean), atualizado: new Date().toISOString() };
      if(d.checkout_url && !/^https:\/\//.test(d.checkout_url)) return toast("O checkout precisa começar com https://");
      try{ await sq(SB2().from("planos").update(d).eq("id", p.id)); fechar(); toast("Plano salvo (registrado na auditoria)"); moPlanos(); }catch(e){ toast("Sem permissão"); } }; });
}
let MOQ = "";
async function moAssin(){
  const L = await sq(SB2().from("assinaturas").select("*").order("atualizado", { ascending: false }).limit(300));
  const nomes = {}; DB().users.forEach(u => nomes[u.id] = u);
  const V = MOQ ? L.filter(a => ((nomes[a.user_id] || {}).nome + " " + (a.email || "") + " " + (a.external_id || "")).toLowerCase().includes(MOQ.toLowerCase())) : L;
  MB().innerHTML = `<div class="toolbar"><input class="input" id="ma-q" placeholder="Buscar nome, e-mail ou ID externo" value="${esc(MOQ)}" style="max-width:320px"><button class="btn btn-accent btn-sm needs-edit" id="ma-dar">+ Conceder Pro</button></div>
    <div class="tbl"><table><thead><tr><th>Usuária</th><th>Plano</th><th>Status</th><th>Provider</th><th>Início</th><th>Fim / renovação</th><th>Campanha</th><th>ID externo</th><th></th></tr></thead><tbody>
    ${V.map(a => `<tr><td><b>${esc((nomes[a.user_id] || {}).nome || "—")}</b><br><small class="muted">${esc(a.email || "")}</small></td><td>${esc(a.plano)}</td><td><span class="st ${["active","trialing"].includes(a.status) ? "ok" : "warn"}">${ST_ASS[a.status] || a.status}</span></td><td>${PROV[a.provider] || a.provider}</td><td>${brD(String(a.inicio).slice(0, 10))}</td><td>${a.fim ? brD(String(a.fim).slice(0, 10)) : "-"}</td><td><small>${esc(a.campanha || "")}</small></td><td><small>${esc(a.external_id || "")}</small></td><td>${new Date(a.fim) > new Date() && a.status !== "trialing" ? `<button class="btn btn-line btn-sm needs-edit" data-rm="${a.id}">Remover</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="9" class="empty">Nenhuma assinatura.</td></tr>`}</tbody></table></div>`;
  let tq; $("ma-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { MOQ = e.target.value; moAssin(); }, 350); };
  const dar = $("ma-dar"); if(dar) dar.onclick = () => {
    modal("Conceder CK Life Pro", `<div class="formgrid"><div class="field full"><label for="cp-u">Usuária (e-mail)</label><input class="input" id="cp-u" list="cp-ul"><datalist id="cp-ul">${DB().users.filter(u => !u.exemplo).map(u => `<option value="${esc(u.email)}">${esc(u.nome)}</option>`).join("")}</datalist></div>
      <div class="field"><label for="cp-d">Período</label><select class="input" id="cp-d">${[[7,"7 dias"],[30,"30 dias"],[90,"90 dias"],[365,"1 ano"],[0,"Personalizado"]].map(([v, n]) => `<option value="${v}">${n}</option>`).join("")}</select></div><div class="field"><label for="cp-x">Dias (personalizado)</label><input class="input num" id="cp-x"></div>
      <div class="field full"><label for="cp-m">Motivo (obrigatório, fica na auditoria)</label><input class="input" id="cp-m" maxlength="200"></div></div><button class="btn btn-accent" id="cp-ok">Conceder</button>`);
    $("cp-ok").onclick = async () => { const u = DB().users.find(x => (x.email || "").toLowerCase() === val("cp-u").toLowerCase()); if(!u) return toast("Usuária não encontrada"); const dias = +val("cp-d") || +val("cp-x"); if(!dias) return toast("Informe o período"); if(!val("cp-m")) return toast("Informe o motivo");
      try{ await sq(SB2().rpc("admin_conceder_pro", { p_user: u.id, p_dias: dias, p_motivo: val("cp-m") })); fechar(); toast(`Pro concedido por ${dias} dias`); moAssin(); }catch(e){ toast(e.message || "Sem permissão"); } }; };
  MB().querySelectorAll("[data-rm]").forEach(b => b.onclick = async () => { const m = prompt("Motivo para remover o Pro (fica na auditoria):"); if(!m) return; try{ await sq(SB2().rpc("admin_remover_pro", { p_assinatura: b.dataset.rm, p_motivo: m })); toast("Pro removido"); moAssin(); }catch(e){ toast("Sem permissão"); } });
}
async function moTrials(){
  const L = await sq(SB2().from("assinaturas").select("*").in("provider", ["trial","promocao"]).order("fim", { ascending: true }).limit(300));
  const nomes = {}; DB().users.forEach(u => nomes[u.id] = u), ag = Date.now();
  MB().innerHTML = `<div class="card"><b>Teste automático: 7 dias de Pro para toda NOVA usuária</b><p class="muted" style="margin:6px 0 0;font-size:13px">Sem cartão. Controlado pelo servidor. Usuárias antigas não ganham teste automático; para uma campanha, use o botão abaixo.</p>
    <button class="btn btn-line btn-sm needs-edit" id="mt-ex" style="margin-top:10px">Conceder 7 dias Pro para usuárias existentes…</button></div>
    <div class="tbl"><table><thead><tr><th>Usuária</th><th>Tipo</th><th>Começou</th><th>Termina</th><th>Situação</th></tr></thead><tbody>${L.map(a => { const f = new Date(a.fim).getTime(); return `<tr><td>${esc((nomes[a.user_id] || {}).nome || a.email || "")}</td><td>${PROV[a.provider]}</td><td>${brD(String(a.inicio).slice(0, 10))}</td><td>${brD(String(a.fim).slice(0, 10))}</td><td>${f < ag ? `<span class="st off">terminou</span>` : f - ag < 864e5 ? `<span class="st warn">termina hoje</span>` : f - ag < 1728e5 ? `<span class="st warn">termina em 48h</span>` : `<span class="st ok">ativo</span>`}</td></tr>`; }).join("") || `<tr><td colspan="5" class="empty">Nenhum teste ainda.</td></tr>`}</tbody></table></div>`;
  const ex = $("mt-ex"); if(ex) ex.onclick = async () => { const m = prompt("Motivo da campanha (fica na auditoria):"); if(!m) return; if(!confirm("Dar 7 dias de Pro para todas as usuárias que hoje não têm Pro?")) return;
    try{ const n = await sq(SB2().rpc("admin_trial_existentes", { p_dias: 7, p_motivo: m })); toast(`${n} usuárias receberam 7 dias de Pro`); moTrials(); }catch(e){ toast("Sem permissão"); } };
}
async function moOfertas(){
  const L = await sq(SB2().from("campanhas_oferta").select("*").order("prioridade", { ascending: false }));
  MB().innerHTML = `<div class="toolbar"><button class="btn btn-accent btn-sm needs-edit" id="mf-novo">+ Nova campanha</button></div><p class="muted" style="font-size:13px">Teste: oferta no dia 5, por 48 horas reais. Free: oferta só em momentos naturais (treino concluído, recurso Pro…), com intervalo de ${esc("15")} dias e limite por período (Configurações). Campanhas se alternam para não parecer promoção eterna.</p>
    <div class="tbl"><table><thead><tr><th>Campanha</th><th>Público</th><th>Mensal promo</th><th>Anual promo</th><th>Duração</th><th>Checkout</th><th>Ativa</th><th></th></tr></thead><tbody>${L.map(c => `<tr><td><b>${esc(c.titulo)}</b><br><small class="muted">${esc(c.id)}</small></td><td>${c.publico}</td><td>${c.preco_mensal_promo ? brlA(c.preco_mensal_promo) + ` × ${c.meses_promo || 12} meses` : "-"}</td><td>${c.preco_anual_promo ? brlA(c.preco_anual_promo) : "-"}</td><td>${c.duracao_horas}h</td><td>${c.checkout_mensal_url && c.checkout_anual_url ? `<span class="st ok">ok</span>` : `<span class="st warn">falta</span>`}</td><td>${c.ativo ? "sim" : "não"}</td><td><button class="btn btn-line btn-sm needs-edit" data-mf="${esc(c.id)}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
  const form = c => { const x = c || { publico: "free", duracao_horas: 48, ativo: true, prioridade: 10, max_impressoes: 6, provider: "kiwify", meses_promo: 12 };
    const F2 = [["titulo","Título"],["subtitulo","Subtítulo"],["mensagem","Mensagem"],["preco_mensal_promo","Mensal promocional (R$)"],["meses_promo","Meses no preço promocional"],["preco_anual_promo","Anual promocional (R$)"],["parcelas_anual","Parcelas do anual"],["parcela_anual_valor","Valor da parcela anual"],["duracao_horas","Duração (horas)"],["prioridade","Prioridade"],["max_impressoes","Máximo de impressões"],["product_mensal","Produto mensal (provider)"],["product_anual","Produto anual (provider)"],["checkout_mensal_url","Checkout mensal"],["checkout_anual_url","Checkout anual"]];
    modal(c ? "Editar campanha" : "Nova campanha", `<div class="formgrid">${c ? "" : `<div class="field"><label for="mf-id">ID (sem espaço)</label><input class="input" id="mf-id"></div>`}<div class="field"><label for="mf-pub">Público</label><select class="input" id="mf-pub">${[["trial","Em teste (dia 5)"],["free","Free"],["todos","Todos sem Pro"]].map(([k, n]) => `<option value="${k}" ${x.publico === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      ${F2.map(([k, n]) => `<div class="field ${/url|mensagem|titulo/.test(k) ? "full" : ""}"><label for="mf-${k}">${n}</label><input class="input" id="mf-${k}" value="${esc(x[k] == null ? "" : x[k])}"></div>`).join("")}
      <label class="field xf-chk"><input type="checkbox" id="mf-at" ${x.ativo ? "checked" : ""}> Ativa</label></div><button class="btn btn-accent" id="mf-ok">Salvar</button>`);
    $("mf-ok").onclick = async () => { const d = { publico: val("mf-pub"), ativo: $("mf-at").checked, provider: "kiwify" }; F2.forEach(([k]) => { const v = val("mf-" + k); d[k] = v === "" ? null : /preco|valor/.test(k) ? +v.replace(",", ".") : /meses|parcelas|horas|prioridade|impressoes/.test(k) ? parseInt(v) : v; });
      if(!d.titulo) return toast("Informe o título"); if(!d.duracao_horas) d.duracao_horas = 48;
      try{ if(c) await sq(SB2().from("campanhas_oferta").update(d).eq("id", c.id)); else { const id = val("mf-id").toLowerCase().replace(/[^a-z0-9-]+/g, "-"); if(!id) return toast("Informe o ID"); await sq(SB2().from("campanhas_oferta").insert({ id, nome: d.titulo, ...d })); } fechar(); toast("Campanha salva"); moOfertas(); }catch(e){ toast("Sem permissão ou dados inválidos"); } }; };
  const nv = $("mf-novo"); if(nv) nv.onclick = () => form();
  MB().querySelectorAll("[data-mf]").forEach(b => b.onclick = () => form(L.find(c => c.id === b.dataset.mf)));
}
async function moRecursos(){
  const L = await sq(SB2().from("recursos").select("*").order("ordem"));
  MB().innerHTML = `<p class="muted" style="font-size:13px">Defina o que é Free e o que é Pro. O app e o banco usam esta mesma tabela. Nunca são bloqueados: privacidade, termos, exportar dados, excluir conta, denunciar, bloquear, segurança e sair.</p>
    <div class="tbl"><table><thead><tr><th>Recurso</th><th>Free</th><th>Teste</th><th>Pro</th><th>Limite Free</th><th>Limite Pro</th><th>Ativo</th></tr></thead><tbody>${L.map(r => `<tr><td><b>${esc(r.nome)}</b><br><small class="muted">${esc(r.descricao || r.id)}</small></td>${["free","trial","pro"].map(k => `<td><input type="checkbox" class="needs-edit" data-rc="${r.id}" data-k="${k}" ${r[k] ? "checked" : ""}></td>`).join("")}<td><input class="input num needs-edit" style="width:70px" data-rl="${r.id}" data-k="limite_free" value="${r.limite_free ?? ""}"></td><td><input class="input num needs-edit" style="width:70px" data-rl="${r.id}" data-k="limite_pro" value="${r.limite_pro ?? ""}"></td><td><input type="checkbox" class="needs-edit" data-rc="${r.id}" data-k="ativo" ${r.ativo ? "checked" : ""}></td></tr>`).join("")}</tbody></table></div>`;
  MB().querySelectorAll("[data-rc]").forEach(c => c.onchange = async () => { try{ await sq(SB2().from("recursos").update({ [c.dataset.k]: c.checked }).eq("id", c.dataset.rc)); toast("Salvo"); }catch(e){ c.checked = !c.checked; toast("Sem permissão"); } });
  MB().querySelectorAll("[data-rl]").forEach(c => c.onchange = async () => { try{ await sq(SB2().from("recursos").update({ [c.dataset.k]: c.value === "" ? null : parseInt(c.value) }).eq("id", c.dataset.rl)); toast("Salvo"); }catch(e){ toast("Sem permissão"); } });
}
let MRQ = "";
async function moReceitas(){
  const R = F.receitas(), pl = DB().receitasPlano || (DB().receitasPlano = {});
  const efetivo = (r, i) => pl[r.id] || (i % 3 === 0 ? "free" : "pro");
  const V = R.map((r, i) => ({ r, i })).filter(x => !MRQ || x.r.nome.toLowerCase().includes(MRQ.toLowerCase()));
  MB().innerHTML = `<div class="toolbar"><input class="input" id="mr-q" placeholder="Buscar receita" value="${esc(MRQ)}" style="max-width:260px"><span class="muted" style="font-size:13px">${R.filter((r, i) => efetivo(r, i) === "free").length} grátis · ${R.filter((r, i) => efetivo(r, i) === "pro").length} Pro</span></div>
    <div class="tbl"><table><thead><tr><th>Receita</th><th>Plano</th></tr></thead><tbody>${V.slice(0, 250).map(({ r, i }) => `<tr><td>${esc(r.nome)}</td><td><select class="input needs-edit" data-rp="${esc(r.id)}" style="max-width:120px"><option value="free" ${efetivo(r, i) === "free" ? "selected" : ""}>Free</option><option value="pro" ${efetivo(r, i) === "pro" ? "selected" : ""}>Pro</option></select></td></tr>`).join("")}</tbody></table></div>`;
  let tq; $("mr-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { MRQ = e.target.value; moReceitas(); }, 300); };
  MB().querySelectorAll("[data-rp]").forEach(s => s.onchange = () => { pl[s.dataset.rp] = s.value; save(); toast("Salvo"); });
}
async function moWebhooks(){
  const L = await sq(SB2().from("webhook_eventos").select("id,provider,evento,order_id,external_id,email,status,erro,valor,criado,processado").order("criado", { ascending: false }).limit(150));
  let cfg = null; try{ cfg = await (await fetch("/api/kiwify-webhook")).json(); }catch(e){}
  MB().innerHTML = `<div class="card"><b>Endpoint Kiwify:</b> <code>${esc(location.origin)}/api/kiwify-webhook</code> · ${cfg ? (cfg.configurado ? `<span class="st ok">configurado</span>` : `<span class="st warn">faltam variáveis na Vercel (KIWIFY_TOKEN e SUPABASE_SERVICE_ROLE_KEY)</span>`) : "-"}
    <p class="muted" style="font-size:13px;margin:6px 0 0">Assinatura HMAC-SHA1 conferida em cada evento; eventos repetidos são ignorados (idempotência). Nenhum segredo é mostrado aqui. Para conferir uma venda, use o painel da Kiwify (Ver logs → reenviar).</p></div>
    <div class="tbl"><table><thead><tr><th>Quando</th><th>Provider</th><th>Evento</th><th>Pedido</th><th>Assinatura</th><th>Valor</th><th>Status</th><th>Erro</th></tr></thead><tbody>${L.map(w => `<tr><td class="num">${new Date(w.criado).toLocaleString("pt-BR")}</td><td>${esc(w.provider)}</td><td><b>${esc(w.evento)}</b></td><td><small>${esc(w.order_id)}</small></td><td><small>${esc(w.external_id || "")}</small></td><td>${w.valor ? brlA(w.valor) : "-"}</td><td><span class="st ${w.status === "processado" ? "ok" : w.status === "erro" ? "bad" : "off"}">${w.status}</span></td><td class="wrapcell"><small>${esc(w.erro || "")}</small></td></tr>`).join("") || `<tr><td colspan="8" class="empty">Nenhum evento recebido ainda.</td></tr>`}</tbody></table></div>`;
}
async function moConfig(){
  const L = await sq(SB2().from("app_config").select("*").order("chave"));
  const ff = DB().config.filtrosFree || ["original", "natural", "glow", "vivo"];
  MB().innerHTML = `<div class="tbl"><table><thead><tr><th>Configuração</th><th>Valor</th><th></th></tr></thead><tbody>${L.map(c => `<tr><td><b>${esc(c.chave)}</b><br><small class="muted">${{ monetizacao: "Teste, anúncios, ofertas", treino_voz: "Explicação por voz dos exercícios", video: "Limites de vídeo" }[c.chave] || ""}</small></td><td><code style="white-space:pre-wrap;font-size:12px">${esc(JSON.stringify(c.valor, null, 1))}</code></td><td><button class="btn btn-line btn-sm needs-edit" data-ac="${esc(c.chave)}">Editar</button></td></tr>`).join("")}</tbody></table></div>
    <div class="card"><h3>Programas grátis</h3><p class="muted" style="font-size:13px">Os demais programas ficam no Pro. Quem estava num programa Pro e voltou ao Free usa o programa grátis do seu objetivo; o progresso fica guardado.</p><div class="chips">${F.PLANOS.map(p => `<label class="chip"><input type="checkbox" data-pg="${p.id}" ${(DB().config.programasFree || ["comecando","hiit","gluteos","mobilidade"]).includes(p.id) ? "checked" : ""}> ${esc(p.nome)}</label>`).join("")}</div></div>
    <div class="card"><h3>Filtros grátis</h3><p class="muted" style="font-size:13px">Os outros filtros e a maquiagem ficam no Pro.</p><div class="chips">${["original","natural","glow","rosado","dourado","suave","vivo","pb"].map(k => `<label class="chip"><input type="checkbox" data-ff="${k}" ${ff.includes(k) ? "checked" : ""}> ${k}</label>`).join("")}</div></div>`;
  MB().querySelectorAll("[data-pg]").forEach(c => c.onchange = () => { const s = new Set(DB().config.programasFree || ["comecando","hiit","gluteos","mobilidade"]); c.checked ? s.add(c.dataset.pg) : s.delete(c.dataset.pg); DB().config.programasFree = [...s]; save(); toast("Salvo"); });
  MB().querySelectorAll("[data-ff]").forEach(c => c.onchange = () => { const s = new Set(DB().config.filtrosFree || ff); c.checked ? s.add(c.dataset.ff) : s.delete(c.dataset.ff); DB().config.filtrosFree = [...s]; save(); toast("Salvo"); });
  MB().querySelectorAll("[data-ac]").forEach(b => b.onclick = () => { const c = L.find(x => x.chave === b.dataset.ac);
    modal("Configuração · " + c.chave, `<textarea class="input" id="ac-v" style="font-family:monospace;min-height:220px">${esc(JSON.stringify(c.valor, null, 2))}</textarea><button class="btn btn-accent" id="ac-ok" style="margin-top:10px">Salvar</button>`);
    $("ac-ok").onclick = async () => { let v; try{ v = JSON.parse(val("ac-v")); }catch(e){ return toast("JSON inválido"); } try{ await sq(SB2().from("app_config").update({ valor: v, atualizado: new Date().toISOString() }).eq("chave", c.chave)); if(c.chave === "treino_voz"){ DB().config.treinoVoz = v; save(); } fechar(); toast("Salvo e registrado"); moConfig(); }catch(e){ toast("Sem permissão"); } }; });
}

/* ---------- Verificações (selo azul) ---------- */
let VFA = "pending";
async function vVerificacoes(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Verificações</h1><p class="muted">Selo azul = pessoa real verificada. Pagamento NÃO dá selo. A selfie é privada e nunca aparece no perfil.</p></div></div>
    <div class="chips">${[["pending","Pendentes"],["needs_review","Nova análise"],["verified","Aprovadas"],["rejected","Recusadas"],["revoked","Revogadas"]].map(([k, n]) => `<button class="chip" data-vf="${k}" aria-pressed="${VFA === k}">${n}</button>`).join("")}</div><div id="vf-b"><div class="card">Carregando…</div></div>`;
  $("adm-main").querySelectorAll("[data-vf]").forEach(b => b.onclick = () => { VFA = b.dataset.vf; vVerificacoes(); });
  if(!SB2()) return;
  let L; try{ L = await sq(SB2().from("verificacoes").select("*").eq("status", VFA).order("criado", { ascending: false }).limit(200)); }catch(e){ return $("vf-b").innerHTML = semBanco(e).replace("seguranca.sql", "monetizacao.sql"); }
  const nomes = {}; DB().users.forEach(u => nomes[u.id] = u);
  const urls = await Promise.all(L.map(v => v.selfie ? SB2().storage.from("social").createSignedUrl(v.selfie, 300).then(r => r.data && r.data.signedUrl, () => null) : null));
  $("vf-b").innerHTML = L.length ? `<div class="vf-grade">${L.map((v, i) => `<div class="card vf-it"><div class="vf-foto">${urls[i] ? `<img src="${esc(urls[i])}" alt="Selfie de verificação">` : `<span class="muted">Sem selfie ainda</span>`}</div><b>${esc((nomes[v.user_id] || {}).nome || "")}</b><small class="muted">Código esperado na foto: <b>${esc(v.codigo || "")}</b> · ${new Date(v.criado).toLocaleDateString("pt-BR")}</small>${v.motivo ? `<small>Motivo: ${esc(v.motivo)}</small>` : ""}
    <div class="acts needs-edit">${v.status !== "verified" ? `<button class="btn btn-accent btn-sm" data-dv="${v.id}" data-s="verified">Aprovar</button>` : `<button class="btn btn-bad btn-sm" data-dv="${v.id}" data-s="revoked">Revogar</button>`}${v.status === "pending" || v.status === "needs_review" ? `<button class="btn btn-line btn-sm" data-dv="${v.id}" data-s="needs_review">Pedir nova foto</button><button class="btn btn-bad btn-sm" data-dv="${v.id}" data-s="rejected">Recusar</button>` : ""}</div></div>`).join("")}</div>` : `<div class="card empty">Nada aqui.</div>`;
  $("vf-b").querySelectorAll("[data-dv]").forEach(b => b.onclick = async () => { const s = b.dataset.s; const m = s === "verified" ? null : prompt("Motivo (obrigatório):"); if(s !== "verified" && !m) return;
    try{ await sq(SB2().rpc("verificacao_decidir", { p_id: b.dataset.dv, p_status: s, p_motivo: m })); toast("Feito e registrado"); vVerificacoes(); }catch(e){ toast(e.message || "Sem permissão"); } });
}

/* ---------- Exercícios: explicação por voz, status e teste de áudio ---------- */
const ST_EX = { rascunho: "Rascunho", revisar: "Revisar", publicado: "Publicado" };
const falaAdmin = t => { try{ speechSynthesis.cancel(); const v = speechSynthesis.getVoices().filter(x => /pt-BR|pt_BR/i.test(x.lang)), pref = ["luciana","francisca","fernanda","vitória","thalita","camila","google português do brasil","maria"].map(n => v.find(x => x.name.toLowerCase().includes(n))).find(Boolean) || v[0];
  const u = new SpeechSynthesisUtterance(t); u.lang = "pt-BR"; if(pref) u.voice = pref; u.rate = ((DB().config.treinoVoz || {}).velocidade) || 1; speechSynthesis.speak(u); return true; }catch(e){ return false; } };
function vExerciciosVoz(){
  const L = F.exercicios(), extras = new Set((DB().exercExtras || []).map(x => x.id));
  const valido = e => (e.passos || []).length >= 1;
  $("adm-main").innerHTML = `<div class="head"><div><h1>Exercícios</h1><p class="muted">${L.length} exercícios. Antes de cada exercício o app explica por voz e por escrito como fazer, usando exatamente o texto daqui.</p></div><button class="btn btn-accent needs-edit" id="ex-new">+ Novo exercício</button></div>
    ${L.some(e => !valido(e)) ? `<div class="card" style="background:var(--warn-soft)"><b>⚠️ ${L.filter(e => !valido(e)).length} exercício(s) sem instrução válida</b></div>` : ""}
    <div class="tbl"><table><thead><tr><th></th><th>Exercício</th><th>Grupo</th><th>Explicação</th><th>Status</th><th></th></tr></thead><tbody>${L.map(e => `<tr><td><span class="exn th" style="width:44px;height:44px;display:block">${window.BONECO.thumb(e, "f")}</span></td><td><b>${esc(e.nome)}</b><br><small class="muted">${extras.has(e.id) ? "Criado no painel" : "Catálogo CK Life"}</small></td><td>${esc(e.grupo)}</td><td>${valido(e) ? (e.voz ? `<span class="st ok">revisada</span>` : `<span class="st ok">automática do passo a passo</span>`) : `<span class="st bad">falta instrução</span>`}</td><td><span class="st ${(e.status || "publicado") === "publicado" ? "ok" : "warn"}">${ST_EX[e.status || "publicado"]}</span></td><td><button class="btn btn-line btn-sm" data-xo="${esc(e.id)}">🔊</button> <button class="btn btn-line btn-sm needs-edit" data-xe="${esc(e.id)}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
  $("adm-main").querySelectorAll("[data-xo]").forEach(b => b.onclick = () => { const e = F.exercicios().find(x => x.id === b.dataset.xo); if(!falaAdmin(window.CKVOZ.texto(e))) toast("Este navegador não tem voz"); });
  $("adm-main").querySelectorAll("[data-xe]").forEach(b => b.onclick = () => formExVoz(F.exercicios().find(x => x.id === b.dataset.xe)));
  const n = $("ex-new"); if(n) n.onclick = () => formExVoz(null);
}
function formExVoz(e){
  const extra = !e || (DB().exercExtras || []).some(x => x.id === e.id), x = e || { nome: "", grupo: "Pernas", equip: "", passos: [], erros: [], resp: "", status: "rascunho" };
  const ta = (id, l, v, ph) => `<div class="field full"><label for="${id}">${l}</label><textarea class="input" id="${id}" ${ph ? `placeholder="${esc(ph)}"` : ""}>${esc(v || "")}</textarea></div>`;
  modal(e ? "Editar exercício" : "Novo exercício", `<div class="formgrid"><div class="field full"><label for="xv-n">Nome</label><input class="input" id="xv-n" value="${esc(x.nome)}"></div>
    ${ta("xv-d", "Descrição", x.descricao)}<div class="field"><label for="xv-g">Grupo muscular</label><input class="input" id="xv-g" value="${esc(x.grupo || "")}"></div><div class="field"><label for="xv-q">Equipamento</label><input class="input" id="xv-q" value="${esc(x.equip || "")}"></div>
    <div class="field"><label for="xv-ni">Nível</label><select class="input" id="xv-ni">${["", "Iniciante", "Intermediário", "Avançado"].map(v => `<option ${x.nivel === v ? "selected" : ""}>${v}</option>`).join("")}</select></div><div class="field"><label for="xv-o">Objetivo</label><input class="input" id="xv-o" value="${esc(x.objetivo || "")}"></div>
    ${ta("xv-p", "Instrução escrita: posição inicial e movimento (um passo por linha)", (x.passos || []).join("\n"))}
    ${ta("xv-e", "Erros comuns (um por linha)", (x.erros || []).join("\n"))}
    <div class="field full"><label for="xv-r">Respiração</label><input class="input" id="xv-r" value="${esc(x.resp || "")}"></div>
    <div class="field full"><label for="xv-s">Aviso de segurança</label><input class="input" id="xv-s" value="${esc(x.seguranca || "")}" placeholder="Se sentir dor aguda, interrompa o exercício."></div>
    ${ta("xv-v", "Texto da explicação por voz (deixe vazio para montar a partir dos campos acima)", x.voz, "")}
    <div class="field"><label for="xv-st">Status</label><select class="input" id="xv-st">${Object.entries(ST_EX).map(([k, n]) => `<option value="${k}" ${(x.status || "publicado") === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <p class="muted" style="font-size:12.5px;grid-column:1/-1">Repetições, tempo e descanso são definidos em cada programa. Use orientações proporcionais, sem promessas médicas.</p></div>
    <div class="card" style="background:var(--surface-2)"><b>Prévia do que será falado</b><p id="xv-prev" style="margin:6px 0 0;font-size:14px"></p></div>
    <div id="xv-msg"></div><div class="toolbar" style="justify-content:space-between"><button class="btn btn-line" id="xv-ouvir">🔊 Testar explicação</button><button class="btn btn-accent" id="xv-ok">Salvar</button></div>`);
  const ls = id => val(id).split("\n").map(s => s.trim()).filter(Boolean);
  const dados = () => ({ nome: val("xv-n"), descricao: val("xv-d") || undefined, grupo: val("xv-g") || "Outros", equip: val("xv-q"), nivel: val("xv-ni") || undefined, objetivo: val("xv-o") || undefined, passos: ls("xv-p"), erros: ls("xv-e"), resp: val("xv-r"), seguranca: val("xv-s") || undefined, voz: val("xv-v") || undefined, status: val("xv-st") });
  const prev = () => { $("xv-prev").textContent = window.CKVOZ.texto({ ...x, ...dados() }); };
  $("mbox").querySelectorAll("input,textarea,select").forEach(i => i.addEventListener("input", prev)); prev();
  $("xv-ouvir").onclick = () => { if(!falaAdmin(window.CKVOZ.texto({ ...x, ...dados() }))) toast("Este navegador não tem voz"); };
  $("xv-ok").onclick = () => { const d = dados();
    if(!d.nome) return $("xv-msg").innerHTML = `<div class="msg msg-bad">Informe o nome.</div>`;
    if(d.status === "publicado" && !d.passos.length) return $("xv-msg").innerHTML = `<div class="msg msg-bad">Para publicar, escreva pelo menos um passo de execução.</div>`;
    if(/garantid|emagrece em|cura|100% seguro|seguro para todo/i.test([d.voz, d.descricao, d.seguranca].join(" "))) return $("xv-msg").innerHTML = `<div class="msg msg-bad">Evite promessas e afirmações médicas absolutas.</div>`;
    Object.keys(d).forEach(k => d[k] === undefined && delete d[k]);
    if(extra){ if(e) Object.assign((DB().exercExtras || []).find(y => y.id === e.id), d); else DB().exercExtras.push({ id: "x" + F.uid(), ...d }); }
    else { DB().exercAjustes = DB().exercAjustes || []; const a = DB().exercAjustes.find(y => y.id === e.id); if(a) Object.assign(a, d); else DB().exercAjustes.push({ id: e.id, ...d }); }
    save(); speechSynthesis.cancel(); fechar(); toast("Exercício salvo"); vExerciciosVoz(); };
}

/* ---------- Cidades com dados oficiais (IBGE) ---------- */
function vCidadesIBGE(){
  const db = DB(), L = db.cidades.slice().sort((a, b) => (b.populacao || 0) - (a.populacao || 0));
  $("adm-main").innerHTML = `<div class="head"><div><h1>Cidades e comunidades</h1><p class="muted">Cidades de MT com mais de 20 mil habitantes (IBGE) e "Outra cidade" para quem mora em município menor. O feed geral continua para todas.</p></div><button class="btn btn-accent needs-edit" id="cg-n">+ Nova cidade</button></div>
    <div class="tbl"><table><thead><tr><th>Cidade</th><th>UF</th><th>População</th><th>IBGE</th><th>Usuárias</th><th>Parceiros</th><th>Status</th><th></th></tr></thead><tbody>${L.map(c => `<tr><td><b>${esc(c.nome)}</b>${c.destaque ? " ★" : ""}${c.fonte ? `<br><small class="muted">${esc(c.fonte)} ${c.ano_estimativa || ""}</small>` : ""}</td><td>${esc(c.uf || "")}</td><td class="num">${c.populacao ? int(c.populacao) : "-"}</td><td class="num">${esc(c.ibge || "-")}</td><td class="num">${db.users.filter(u => +u.cidade === +c.id).length}</td><td class="num">${(db.empresas || []).filter(e => +e.cidade === +c.id).length + (db.parceiros || []).filter(p => +p.cidade === +c.id).length}</td><td><span class="st ${c.ativa ? "ok" : "off"}">${c.ativa ? "Ativa" : "Oculta"}</span></td><td><button class="btn btn-line btn-sm needs-edit" data-cg="${c.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
  const form = c => { const x = c || { ativa: true, uf: "MT" };
    modal(c ? "Editar cidade" : "Nova cidade", `<div class="formgrid"><div class="field"><label for="cg-nm">Nome</label><input class="input" id="cg-nm" value="${esc(x.nome || "")}"></div><div class="field"><label for="cg-uf">UF</label><input class="input" id="cg-uf" maxlength="2" value="${esc(x.uf || "")}"></div>
      <div class="field"><label for="cg-ib">Código IBGE</label><input class="input num" id="cg-ib" value="${esc(x.ibge || "")}"></div><div class="field"><label for="cg-po">População (fonte oficial)</label><input class="input num" id="cg-po" value="${esc(x.populacao || "")}"></div>
      <div class="field"><label for="cg-an">Ano da estimativa</label><input class="input num" id="cg-an" value="${esc(x.ano_estimativa || "")}"></div><div class="field"><label for="cg-fo">Fonte</label><input class="input" id="cg-fo" value="${esc(x.fonte || "")}"></div>
      <label class="field xf-chk"><input type="checkbox" id="cg-at" ${x.ativa ? "checked" : ""}> Ativa</label><label class="field xf-chk"><input type="checkbox" id="cg-de" ${x.destaque ? "checked" : ""}> Destaque</label></div>
      <p class="muted" style="font-size:12.5px">Não invente população: use o número do IBGE e informe ano e fonte.</p><button class="btn btn-accent" id="cg-ok">Salvar</button>`);
    $("cg-ok").onclick = () => { const d = { nome: val("cg-nm"), uf: val("cg-uf").toUpperCase(), ibge: val("cg-ib") || undefined, populacao: +val("cg-po") || undefined, ano_estimativa: +val("cg-an") || undefined, fonte: val("cg-fo") || undefined, ativa: $("cg-at").checked, destaque: $("cg-de").checked };
      if(!d.nome) return toast("Informe o nome"); if(d.populacao && !d.fonte) return toast("Informe a fonte da população");
      if(c){ const ant = c.nome; Object.assign(c, d); if(ant !== d.nome) F.nuvem.sb && F.nuvem.sb.rpc("auditar", { p_acao: "cidade_alterada", p_recurso: "cidades", p_alvo: ant + " → " + d.nome }); }
      else db.cidades.push({ id: d.ibge ? +d.ibge : Math.max(100, ...db.cidades.map(y => +y.id)) + 1, ...d });
      save(); fechar(); toast("Cidade salva"); vCidadesIBGE(); }; };
  const n = $("cg-n"); if(n) n.onclick = () => form();
  $("adm-main").querySelectorAll("[data-cg]").forEach(b => b.onclick = () => form(db.cidades.find(c => String(c.id) === b.dataset.cg)));
}

/* ---------- Clube CK Pro: marcar benefício como Pro, período e limite ---------- */
const formParcPro = formParc;
formParc = function(p){ formParcPro(p); const grid = $("mbox").querySelector(".formgrid"); if(!grid) return; const x = p || {};
  grid.insertAdjacentHTML("beforeend", `<label class="field xf-chk"><input type="checkbox" id="pa-pro" ${x.pro ? "checked" : ""}> <i class='ckc' aria-hidden='true'></i> Benefício do Clube CK Pro</label><div class="field"><label for="pa-ini">Início</label><input class="input" type="date" id="pa-ini" value="${esc(x.inicio || "")}"></div><div class="field"><label for="pa-lim">Limite de cupons</label><input class="input num" id="pa-lim" value="${esc(x.limite || "")}"></div>`);
  const ok = $("pa-ok"), s0 = ok.onclick; ok.onclick = () => { const extra = { pro: $("pa-pro").checked, inicio: val("pa-ini") || null, limite: +val("pa-lim") || null }; const antes = new Set(DB().parceiros.map(y => y.id)); s0(); const alvo = p || DB().parceiros.find(y => !antes.has(y.id)); if(alvo){ Object.assign(alvo, extra); save(); } }; };

/* ---------- papéis prontos novos ---------- */
const formPermMon = formPerm;
formPerm = function(u){ formPermMon(u); const box = $("mbox").querySelector("[data-papel2]"); if(!box) return;
  box.parentNode.insertAdjacentHTML("beforeend", `<button class="btn btn-line btn-sm" data-papel3="financeiro">Financeiro</button><button class="btn btn-line btn-sm" data-papel3="verificacao">Revisor de verificação</button><button class="btn btn-line btn-sm" data-papel3="conteudo">Conteúdo e exercícios</button>`);
  const P3 = { financeiro: { monetizacao: "editar", metricas: "ver", financeiro: "ver" }, verificacao: { verificacoes: "editar" }, conteudo: { exercicios: "editar", receitas: "editar", figurinhas: "editar", avisos: "editar" } };
  $("mbox").querySelectorAll("[data-papel3]").forEach(b => b.onclick = () => { const p = P3[b.dataset.papel3]; $("pm-t").checked = false; $("pm-t").onchange(); $("pm-g").querySelectorAll("select").forEach(s => s.value = p[s.dataset.k] || ""); toast("Papel aplicado. Clique em Salvar permissões."); }); };
/* ---------- Vendas e plano das alunas nas telas antigas (Resumo, Alunas, Financeiro) ---------- */
async function carregaVendasAdm(forca){
  if(!SB2() || (!forca && Date.now() - PLU_T < 60000)) return false; PLU_T = Date.now();
  try{ const [a, b] = await Promise.all([SB2().rpc("admin_planos_usuarias"), SB2().rpc("admin_vendas", { p_limite: 300 })]); if(!a.error && a.data) PLU = a.data; if(!b.error && b.data) VENDAS = b.data; return true; }catch(e){ return false; }
}
const comVendas = v => function(){ v.apply(this, arguments); const sec = SEC; carregaVendasAdm().then(ok => { if(ok && SEC === sec) v.apply(this, arguments), posVendasAdm(); }); posVendasAdm(); };
function posVendasAdm(){ if(SEC === "financeiro") blocoVendas(); }
function blocoVendas(){
  const h = document.querySelector("#adm-main .head"); if(!h || $("fi-vendas")) return;
  if(!VENDAS) return h.insertAdjacentHTML("afterend", `<div class="card" id="fi-vendas"><h3><i class='ckc' aria-hidden='true'></i> Vendas do CK Life Pro</h3><p class="muted" style="margin:6px 0 0">${SB2() ? "Carregando… (se não aparecer, seu acesso não inclui Monetização ou falta rodar o ajuste do banco)" : "Funciona no app oficial, com o banco conectado."}</p></div>`);
  const ok = VENDAS.filter(vendaOk), mes = today().slice(0, 7), tot = ok.reduce((s, v) => s + (+v.valor || 0), 0);
  const ativos = PLU ? Object.values(PLU).filter(x => x.pro && !x.trial && ["kiwify", "apple", "google"].includes(x.provider)).length : 0;
  const EV = { order_approved: "Compra aprovada", subscription_renewed: "Renovação", subscription_canceled: "Cancelamento", subscription_late: "Atrasada", order_refunded: "Reembolso", chargeback: "Chargeback", pix_created: "Pix gerado", billet_created: "Boleto gerado", order_rejected: "Recusada" };
  h.insertAdjacentHTML("afterend", `<div class="card" id="fi-vendas"><div class="sec-title"><h3><i class='ckc' aria-hidden='true'></i> Vendas do CK Life Pro (Kiwify)</h3><button class="btn btn-line btn-sm" id="fv-csv">Copiar planilha</button></div>
    <div class="grid g3" style="margin:10px 0">${kpi("Vendido no mês", money(vendasMes(mes)), `${ok.filter(v => String(v.quando).slice(0, 7) === mes).length} venda(s)`)}${kpi("Assinantes Pro ativos", int(ativos))}${kpi("Total vendido", money(tot), `${ok.length} venda(s) no total`)}</div>
    <div class="tbl"><table><thead><tr><th>Quando</th><th>Aluna</th><th>Plano</th><th>Valor</th><th>Evento</th><th>Pedido</th></tr></thead><tbody>${VENDAS.filter(v => !["pix_created", "billet_created"].includes(v.evento)).slice(0, 100).map(v => `<tr><td class="num">${new Date(v.quando).toLocaleString("pt-BR")}</td><td><b>${esc(v.nome || "Sem conta ainda")}</b><br><small class="muted">${esc(v.email || "")}</small></td><td>${v.plano === "pro_anual" ? "Anual" : v.plano === "pro_mensal" ? "Mensal" : "-"}</td><td class="num">${v.valor != null ? money(v.valor) : "-"}</td><td><span class="st ${vendaOk(v) ? "ok" : v.status === "erro" ? "bad" : "warn"}">${esc(EV[v.evento] || v.evento)}</span>${v.erro ? `<br><small class="muted">${esc(v.erro)}</small>` : ""}</td><td><small>${esc(v.pedido || "")}</small></td></tr>`).join("") || `<tr><td colspan="6" class="empty">Nenhuma venda ainda.</td></tr>`}</tbody></table></div></div>`);
  $("fv-csv").onclick = () => planilha(["Quando", "Aluna", "E-mail", "Plano", "Valor", "Evento", "Pedido"], VENDAS.map(v => [new Date(v.quando).toLocaleString("pt-BR"), v.nome || "", v.email || "", v.plano || "", v.valor != null ? String(v.valor).replace(".", ",") : "", EV[v.evento] || v.evento, v.pedido || ""]), "Vendas CK Life Pro");
}
VIEWS.resumo = comVendas(VIEWS.resumo); VIEWS.alunos = comVendas(VIEWS.alunos); VIEWS.financeiro = comVendas(VIEWS.financeiro);
VIEWS.monetizacao = vMonetizacao; VIEWS.verificacoes = vVerificacoes; VIEWS.exercicios = vExerciciosVoz; VIEWS.cidades = vCidadesIBGE;
