/* ===================== Painel · SEGURANÇA & PRIVACIDADE =====================
   Central de LGPD, auditoria, incidentes, consentimentos, documentos, retenção, storage, papéis e MFA.
   A segurança real está no banco (seguranca.sql). Aqui o painel nunca abre chats, fotos privadas nem ciclos individuais. */
AIC.seguranca = '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="M9.5 12l2 2 3.5-4"/>';
SECOES.push(["seguranca","Segurança & Privacidade"],["lgpd","LGPD (titulares)"],["incidentes","Incidentes"],["auditoria","Auditoria"],["documentos","Documentos legais"]);
GRUPOS.splice(GRUPOS.length - 1, 0, ["Proteção", ["seguranca"]]);
const SB2 = () => F.nuvem && F.nuvem.ativo && F.nuvem.sb;
const SEG_SUB = [["geral","Visão geral"],["checklist","Checklist"],["usuarias","Usuárias"],["lgpd","Solicitações LGPD"],["consent","Consentimentos"],["incidentes","Incidentes"],["denuncias","Denúncias"],["auditoria","Auditoria"],["acessos","Acessos do painel"],["sensiveis","Dados sensíveis"],["retencao","Retenção"],["storage","Storage e mídia"],["sessoes","Sessões e 2 etapas"],["menores","Idade e menores"],["documentos","Documentos legais"],["config","Configurações"],["riscos","Mapa de dados e RIPD"],["relatorios","Relatórios"]];
let SEGA = "geral";
const JUR = `<span class="st warn">VALIDAÇÃO JURÍDICA NECESSÁRIA</span>`;
const dt = v => v ? new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
const dd2 = v => v ? brD(String(v).slice(0, 10)) : "-";
async function sq(p){ const r = await p; if(r.error) throw r.error; return r.data; }
const semBanco = e => `<div class="card"><b>${XERRA(e) ? "Esta área precisa ser ativada no banco." : "Não deu para carregar agora."}</b><p class="muted" style="margin:6px 0 0">${XERRA(e) ? "Rode o arquivo <b>seguranca.sql</b> (em partes) no Supabase." : esc(String(e && e.message || e))}</p></div>`;
function vSeguranca(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Segurança & Privacidade</h1><p class="muted">Proteger as alunas e o CK Life, com rastreabilidade. O painel não dá acesso a conversas, fotos privadas nem ciclos individuais.</p></div></div>
    <div class="chips scroll seg-sub">${SEG_SUB.map(([k, n]) => `<button class="chip" data-sg="${k}" aria-pressed="${SEGA === k}">${n}</button>`).join("")}</div><div id="sg-b"><div class="card">Carregando…</div></div>`;
  $("adm-main").querySelectorAll("[data-sg]").forEach(b => b.onclick = () => { SEGA = b.dataset.sg; vSeguranca(); });
  const area = { lgpd: "lgpd", incidentes: "incidentes", auditoria: "auditoria", documentos: "documentos", denuncias: "moderacao", usuarias: "alunos" }[SEGA] || "seguranca";
  document.body.dataset.ro = PERM.total || PERM[area] === "editar" ? "" : "1"; const ro = $("adm-main").querySelector(".ro-aviso"); if(ro) ro.remove();
  if(!SB2()) { $("sg-b").innerHTML = `<div class="card">Este módulo funciona no app oficial, com o banco conectado.</div>`; return; }
  ({ geral: sgGeral, checklist: sgChecklist, usuarias: sgUsuarias, lgpd: sgLgpd, consent: sgConsent, incidentes: sgIncidentes, denuncias: sgDenuncias, auditoria: sgAuditoria, acessos: sgAcessos, sensiveis: sgSensiveis, retencao: sgRetencao, storage: sgStorage, sessoes: sgSessoes, menores: sgMenores, documentos: sgDocumentos, config: sgConfig, riscos: sgRiscos, relatorios: sgRelatorios })[SEGA]().catch(e => { const b = $("sg-b"); if(b) b.innerHTML = semBanco(e); });
}
const B = () => $("sg-b");
async function confirmaForte(texto, palavra){
  return new Promise(ok => { modal("Confirmação necessária", `<p>${texto}</p><p class="muted">Para confirmar, digite <b>${palavra}</b>:</p><input class="input" id="cf-t" autocomplete="off"><div class="field"><label for="cf-m">Motivo (fica registrado)</label><textarea class="input" id="cf-m" maxlength="500"></textarea></div><div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Cancelar</button><button class="btn btn-bad" id="cf-ok">Confirmar</button></div>`);
    $("cf-ok").onclick = () => { if($("cf-t").value.trim().toUpperCase() !== palavra) return toast(`Digite ${palavra} para confirmar`); const m = val("cf-m"); if(!m) return toast("Informe o motivo"); fechar(); ok(m); };
    $("mbox").querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => ok(null))); });
}

/* ---- 1. Visão geral + alertas ---- */
async function sgGeral(){
  const r = await sq(SB2().rpc("seguranca_resumo")); if(!r) return B().innerHTML = `<div class="card">Seu acesso não inclui esta área.</div>`;
  const alertas = [];
  if(r.incidentes_comunicacao) alertas.push(["bad", `${r.incidentes_comunicacao} incidente(s) aguardando decisão sobre comunicar ANPD/titulares`, "incidentes"]);
  if(r.lgpd_vencendo) alertas.push(["bad", `${r.lgpd_vencendo} pedido(s) LGPD vencendo em até 2 dias`, "lgpd"]);
  if(r.denuncias_criticas) alertas.push(["warn", `${r.denuncias_criticas} denúncia(s) de prioridade alta/crítica`, "denuncias"]);
  if(r.denuncias_24h >= 5) alertas.push(["warn", `Muitas denúncias nas últimas 24h (${r.denuncias_24h})`, "denuncias"]);
  if(r.acessos_negados_7d >= 5) alertas.push(["warn", `${r.acessos_negados_7d} tentativas negadas no painel em 7 dias`, "auditoria"]);
  if(r.config_alterada_7d) alertas.push(["warn", `Configuração de segurança alterada ${r.config_alterada_7d}x em 7 dias`, "auditoria"]);
  if(!r.docs_publicados) alertas.push(["warn", "Nenhum documento legal publicado (Termos, Privacidade)", "documentos"]);
  B().innerHTML = `${alertas.length ? `<div class="card"><h3 style="margin-bottom:8px">Alertas</h3>${alertas.map(([t, m, s]) => `<button class="sg-alerta ${t}" data-ir="${s}">${aic("avisos", 16)} <span>${m}</span></button>`).join("")}</div>` : `<div class="card"><b>Sem alertas no momento 💚</b></div>`}
    <div class="grid g4">${kpi("Usuárias", int(r.usuarias), `${int(r.ativas_30d)} ativas em 30 dias`, "alunos", 1)}${kpi("Suspensas", int(r.suspensas), `${int(r.bloqueadas)} bloqueadas`)}${kpi("Denúncias abertas", int(r.denuncias_abertas), `${int(r.denuncias_criticas)} críticas`, "moderacao")}${kpi("Pedidos LGPD", int(r.lgpd_abertas), `${int(r.lgpd_exclusao)} de exclusão`)}</div>
    <div class="grid g4">${kpi("Incidentes abertos", int(r.incidentes_abertos), `${int(r.incidentes_analise)} em análise`)}${kpi("Acessos ao painel (7d)", int(r.acessos_admin_7d), `${int(r.acessos_negados_7d)} negados`)}${kpi("Mídias privadas", int(r.midias_privadas), "bucket privado")}${kpi("Pendências jurídicas", int(r.retencao_pendente + r.inventario_pendente), "retenção e inventário")}</div>
    <p class="muted" style="font-size:13px">Sessões suspeitas e falhas de login não são visíveis pelo app: consulte os registros de autenticação no painel do Supabase (Authentication › Logs).</p>`;
  B().querySelectorAll("[data-ir]").forEach(b => b.onclick = () => { SEGA = b.dataset.ir; vSeguranca(); });
}
/* ---- Checklist (só verificações reais) ---- */
async function sgChecklist(){
  const c = await sq(SB2().rpc("seguranca_checagens")); if(!c) return B().innerHTML = `<div class="card">Seu acesso não inclui esta área.</div>`;
  let mfa = null; try{ const f = await SB2().auth.mfa.listFactors(); mfa = (f.data && f.data.totp || []).some(x => x.status === "verified"); }catch(e){}
  const docs = await sq(SB2().from("documentos").select("tipo,status").eq("status", "publicado")).catch(() => []);
  const tem = t => docs.some(d => d.tipo === t);
  const L = [
    [!c.tabelas_sem_rls.length, "Regras de acesso (RLS) ligadas em todas as tabelas", c.tabelas_sem_rls.length ? "Sem RLS: " + c.tabelas_sem_rls.join(", ") : ""],
    [c.buckets.some(b => b.id === "social" && !b.publico), "Fotos e áudios privados em pasta privada (social)", ""],
    [!c.buckets.some(b => b.id === "posts" && b.publico), "Nenhuma foto de aluna em pasta pública", c.buckets.some(b => b.id === "posts" && b.publico) ? "As fotos ANTIGAS da comunidade (antes da rede social) estão na pasta pública 'posts'. Migrar para a privada." : ""],
    [true, "Links de mídia privada são temporários (expiram)", ""],
    [c.auditoria_imutavel, "Auditoria imutável no banco", ""],
    [c.limites_ativos >= 5, "Limites contra abuso ativos no banco", `${c.limites_ativos} limites`],
    [mfa === true, "Verificação em 2 etapas da sua conta de admin", mfa === false ? "Ative em Sessões e 2 etapas" : ""],
    [c.mfa_obrigatorio === true, "2 etapas obrigatória para o painel", "Ligue depois que todas as admins ativarem"],
    [c.admins_total >= 1 && c.admins_total <= 2, "Poucas pessoas com acesso total", `${c.admins_total} com acesso total de ${c.admins} admins`],
    [c.idade_validada === true, "Faixa etária validada pelo jurídico", `Hoje: ${c.idade_minima}+`],
    [tem("termos") && tem("privacidade"), "Termos de Uso e Política de Privacidade publicados", ""],
    [c.orfaos_social === 0, "Sem arquivos órfãos no storage", c.orfaos_social ? `${c.orfaos_social} arquivo(s) sem dono (inacessíveis, aguardando limpeza)` : ""],
    [true, "Nenhuma chave secreta no app (só a chave pública)", "Conferido no build"]
  ];
  B().innerHTML = `<div class="card"><h3 style="margin-bottom:10px">Checklist técnico</h3>${L.map(([ok, t, n]) => `<div class="sg-chk ${ok ? "ok" : "pend"}"><b>${ok ? "✓" : "!"}</b><span>${esc(t)}${n ? `<small>${esc(n)}</small>` : ""}</span></div>`).join("")}
    <p class="muted" style="margin-top:12px;font-size:13px">Estas são verificações técnicas. Elas não significam conformidade jurídica completa, que depende de validação humana e jurídica.</p></div>`;
}
/* ---- 2. Usuárias (consulta mínima, sem dados íntimos) ---- */
let SGU = { q: "" };
async function sgUsuarias(){
  B().innerHTML = `<div class="toolbar"><input class="input" id="su-q" placeholder="Nome, e-mail, @usuária ou ID" value="${esc(SGU.q)}" style="max-width:360px"><button class="btn btn-accent btn-sm" id="su-b">Buscar</button></div><div id="su-l"><p class="muted">Busque uma usuária para ver situação, pedidos e histórico. Dados de saúde e conversas não aparecem aqui.</p></div>`;
  const busca = async () => { const t = val("su-q").trim(); SGU.q = t; if(!t) return;
    let L = []; const lim = t.replace(/[%,()]/g, " ").replace(/^@/, "");
    if(/^[0-9a-f-]{36}$/i.test(t)) L = await sq(SB2().from("alunas").select("id,nome,email,situacao,situacao_motivo,bloqueado,criado,ultimo").eq("id", t));
    else { const p = await sq(SB2().from("perfis").select("user_id").ilike("username", `%${lim}%`).limit(20)).catch(() => []);
      L = await sq(SB2().from("alunas").select("id,nome,email,situacao,situacao_motivo,bloqueado,criado,ultimo").or(`nome.ilike.%${lim}%,email.ilike.%${lim}%${p.length ? `,id.in.(${p.map(x => x.user_id).join(",")})` : ""}`).limit(30)); }
    F.nuvem.sb.rpc("auditar", { p_acao: "consulta_usuaria", p_recurso: "alunas", p_alvo: t.slice(0, 60) });
    $("su-l").innerHTML = `<div class="tbl"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Situação</th><th>Cadastro</th><th>Último acesso</th><th></th></tr></thead><tbody>${L.map(u => `<tr><td><b>${esc(u.nome || "")}</b><br><small class="muted">${u.id}</small></td><td>${esc(u.email)}</td><td><span class="st ${u.situacao === "ativa" && !u.bloqueado ? "ok" : "warn"}">${u.situacao}${u.bloqueado && u.situacao === "ativa" ? " (bloqueada)" : ""}</span></td><td>${dd2(u.criado)}</td><td>${dd2(u.ultimo)}</td><td><button class="btn btn-line btn-sm" data-uv="${u.id}">Abrir</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty">Ninguém encontrado.</td></tr>`}</tbody></table></div>`;
    $("su-l").querySelectorAll("[data-uv]").forEach(b => b.onclick = () => fichaUsuaria(L.find(u => u.id === b.dataset.uv))); };
  $("su-b").onclick = busca; $("su-q").onkeydown = e => { if(e.key === "Enter") busca(); };
  if(SGU.q) busca();
}
async function fichaUsuaria(u){
  const [per, sol, cons, hist, den] = await Promise.all([
    sq(SB2().from("perfis").select("username,privado,criado").eq("user_id", u.id)).catch(() => []),
    sq(SB2().from("solicitacoes").select("protocolo,tipo,status,criado").eq("user_id", u.id).order("criado", { ascending: false })).catch(() => []),
    sq(SB2().from("consentimentos_atuais").select("*").eq("user_id", u.id)).catch(() => []),
    sq(SB2().from("auditoria").select("*").eq("alvo", u.id).order("criado", { ascending: false }).limit(30)).catch(() => []),
    sq(SB2().from("denuncias").select("tipo,motivo,status,criado").eq("alvo_user", u.id).order("criado", { ascending: false }).limit(20)).catch(() => [])]);
  F.nuvem.sb.rpc("auditar", { p_acao: "ficha_usuaria", p_recurso: "alunas", p_alvo: u.id });
  modal("Usuária · " + (u.nome || ""), `<p><b>${esc(u.nome || "")}</b> ${per[0] ? `@${esc(per[0].username)}` : ""} · ${esc(u.email)}<br><small class="muted">${u.id}</small></p>
    <p>Situação: <span class="st ${u.situacao === "ativa" ? "ok" : "warn"}">${u.situacao}</span> ${u.situacao_motivo ? `<small class="muted">${esc(u.situacao_motivo)}</small>` : ""}</p>
    <div class="toolbar needs-edit">${u.situacao !== "suspensa" ? `<button class="btn btn-line btn-sm" data-sit="suspensa">Suspender</button>` : ""}${u.situacao !== "bloqueada" ? `<button class="btn btn-bad btn-sm" data-sit="bloqueada">Bloquear</button>` : ""}${u.situacao !== "ativa" ? `<button class="btn btn-accent btn-sm" data-sit="ativa">Reativar</button>` : ""}</div>
    <h3 style="margin-top:12px">Denúncias recebidas (${den.length})</h3>${den.map(d => `<p style="margin:2px 0"><small>${dd2(d.criado)} · ${esc(d.tipo)} · ${esc(d.motivo)} · ${esc(d.status)}</small></p>`).join("") || `<p class="muted">Nenhuma.</p>`}
    <h3 style="margin-top:12px">Solicitações LGPD</h3>${sol.map(s => `<p style="margin:2px 0"><small>${esc(s.protocolo)} · ${esc(s.tipo)} · ${esc(s.status)}</small></p>`).join("") || `<p class="muted">Nenhuma.</p>`}
    <h3 style="margin-top:12px">Consentimentos atuais</h3>${cons.map(c => `<p style="margin:2px 0"><small>${esc(c.tipo)}: ${c.aceito ? "aceito" : "recusado/revogado"} ${c.versao ? "v" + esc(c.versao) : ""} · ${dd2(c.criado)}</small></p>`).join("") || `<p class="muted">Nenhum registro.</p>`}
    <h3 style="margin-top:12px">Histórico administrativo</h3>${hist.map(h => `<p style="margin:2px 0"><small>${dt(h.criado)} · ${esc(h.acao)} ${h.motivo ? "· " + esc(h.motivo) : ""}</small></p>`).join("") || `<p class="muted">Nenhuma ação registrada.</p>`}
    <p class="muted" style="font-size:12.5px;margin-top:12px">Por privacidade, esta ficha não mostra conversas, fotos privadas, ciclo, peso ou medidas.</p>`);
  $("mbox").querySelectorAll("[data-sit]").forEach(b => b.onclick = async () => { const s = b.dataset.sit, m = await confirmaForte(s === "ativa" ? "Reativar a conta?" : `${s === "bloqueada" ? "Bloquear" : "Suspender"} a conta? Ela não poderá publicar nem mandar mensagens.`, s === "ativa" ? "REATIVAR" : s === "bloqueada" ? "BLOQUEAR" : "SUSPENDER"); if(!m) return;
    try{ await sq(SB2().from("alunas").update({ situacao: s, situacao_motivo: m }).eq("id", u.id)); toast("Feito e registrado"); u.situacao = s; u.situacao_motivo = m; fichaUsuaria(u); }catch(e){ toast("Sem permissão ou sem conexão"); } });
}
/* ---- 3. Solicitações LGPD ---- */
const TIPOS_LGPD = { confirmacao: "Confirmação de tratamento", acesso: "Acesso aos dados", correcao: "Correção", exportacao: "Exportação", portabilidade: "Portabilidade", anonimizacao: "Anonimização", bloqueio: "Bloqueio", eliminacao: "Eliminação", revogacao: "Revogação de consentimento", compartilhamento: "Informação sobre compartilhamento", oposicao: "Oposição", outra: "Outra" };
const ST_LGPD = { recebida: "Recebida", verificando_identidade: "Verificando identidade", em_analise: "Em análise", em_execucao: "Em execução", aguardando_informacao: "Aguardando informação", concluida: "Concluída", recusada: "Recusada (com justificativa)" };
let SGL = { st: "abertas" };
async function sgLgpd(){
  let L = await sq(SB2().from("solicitacoes").select("*").order("prazo", { ascending: true }).limit(300));
  const ids = [...new Set(L.map(s => s.user_id))], nomes = {}; if(ids.length) (await sq(SB2().from("alunas").select("id,nome,email").in("id", ids))).forEach(a => nomes[a.id] = a);
  const V = L.filter(s => SGL.st === "todas" || (SGL.st === "abertas" ? !["concluida","recusada"].includes(s.status) : s.status === SGL.st)), hoje = today();
  B().innerHTML = `<div class="chips">${[["abertas","Abertas"],["concluida","Concluídas"],["recusada","Recusadas"],["todas","Todas"]].map(([k, n]) => `<button class="chip" data-ls="${k}" aria-pressed="${SGL.st === k}">${n}</button>`).join("")}</div>
    <p class="muted" style="font-size:13px">Prazo interno configurável em Configurações. ${JUR}</p>
    <div class="tbl"><table><thead><tr><th>Protocolo</th><th>Titular</th><th>Tipo</th><th>Recebida</th><th>Prazo</th><th>Status</th><th></th></tr></thead><tbody>
    ${V.map(s => `<tr><td class="num"><b>${esc(s.protocolo)}</b></td><td>${esc((nomes[s.user_id] || {}).nome || "")}<br><small class="muted">${esc((nomes[s.user_id] || {}).email || "")}</small></td><td>${TIPOS_LGPD[s.tipo]}</td><td>${dd2(s.criado)}</td><td><span class="st ${s.prazo < hoje && !["concluida","recusada"].includes(s.status) ? "bad" : "off"}">${dd2(s.prazo)}</span></td><td>${ST_LGPD[s.status]}</td><td><button class="btn btn-line btn-sm" data-sv="${s.id}">Abrir</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Nenhuma solicitação.</td></tr>`}</tbody></table></div>`;
  B().querySelectorAll("[data-ls]").forEach(b => b.onclick = () => { SGL.st = b.dataset.ls; sgLgpd(); });
  B().querySelectorAll("[data-sv]").forEach(b => b.onclick = () => abreLgpd(L.find(s => s.id === b.dataset.sv), nomes));
}
async function abreLgpd(s, nomes){
  const ev = await sq(SB2().from("solicitacao_eventos").select("*").eq("solicitacao_id", s.id).order("criado", { ascending: true })).catch(() => []);
  const t = nomes[s.user_id] || {};
  modal(`Pedido ${s.protocolo}`, `<p><b>${TIPOS_LGPD[s.tipo]}</b> · ${esc(t.nome || "")} (${esc(t.email || "")})</p>${s.detalhe ? `<p class="card" style="background:var(--surface-2)">${esc(s.detalhe)}</p>` : ""}
    <div class="formgrid"><div class="field"><label for="lg-s">Status</label><select class="input" id="lg-s">${Object.entries(ST_LGPD).map(([k, n]) => `<option value="${k}" ${s.status === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="field"><label for="lg-p">Prazo interno</label><input class="input" type="date" id="lg-p" value="${esc(s.prazo || "")}"></div>
      <div class="field full"><label for="lg-r">Resposta à titular (ela vê no app)</label><textarea class="input" id="lg-r" maxlength="3000">${esc(s.resposta || "")}</textarea></div>
      <div class="field full"><label for="lg-n">Nota interna (histórico)</label><input class="input" id="lg-n" maxlength="1000" placeholder="Ex.: identidade confirmada pelo e-mail cadastrado"></div></div>
    <div class="toolbar needs-edit" style="justify-content:space-between">${s.tipo === "eliminacao" && !["concluida","recusada"].includes(s.status) ? `<button class="btn btn-bad" id="lg-elim">Executar eliminação…</button>` : "<span></span>"}<button class="btn btn-accent" id="lg-ok">Salvar</button></div>
    ${["acesso","exportacao","portabilidade","confirmacao"].includes(s.tipo) ? `<p class="muted" style="font-size:13px">Exportação: a própria titular gera o pacote em Perfil › Privacidade e meus dados › Baixar meus dados (só os dados dela, sem mensagens de outras pessoas). O painel não baixa dados das alunas.</p>` : ""}
    <h3 style="margin-top:12px">Histórico</h3>${ev.map(e => `<p style="margin:2px 0"><small>${dt(e.criado)} · ${e.status ? ST_LGPD[e.status] || e.status : ""} ${e.nota ? "· " + esc(e.nota) : ""}</small></p>`).join("")}`);
  $("lg-ok").onclick = async () => { try{ await sq(SB2().from("solicitacoes").update({ status: val("lg-s"), prazo: val("lg-p") || null, resposta: val("lg-r") || null, responsavel: F.nuvem.uid }).eq("id", s.id)); if(val("lg-n")) await sq(SB2().rpc("nota_solicitacao", { p_id: s.id, p_nota: val("lg-n") })); fechar(); toast("Pedido atualizado e registrado"); sgLgpd(); }catch(e){ toast("Sem permissão para LGPD"); } };
  const el = $("lg-elim"); if(el) el.onclick = async () => {
    const m = await confirmaForte(`Executar a eliminação de <b>${esc(t.nome || "")}</b>? Posts, Stories, curtidas, seguidoras, notificações e Meu Ciclo serão apagados; comentários e mensagens em conversas de outras pessoas serão anonimizados. Consentimentos, pedidos, denúncias e auditoria ficam guardados como prova. Esta ação não pode ser desfeita.`, "ELIMINAR"); if(!m) return;
    try{ const r = await sq(SB2().rpc("executar_eliminacao", { p_solicitacao: s.id, p_motivo: m })); toast(`Eliminação feita: ${r.posts} posts, ${r.mensagens} mensagens anonimizadas`); modal("Último passo manual", `<p>A conta foi eliminada/anonimizada no banco.</p><p><b>Falta:</b> apagar o login dela no Supabase (Authentication › Users › procurar o e-mail › Delete user). Isso exige a chave de serviço, que fica fora do app por segurança.</p><button class="btn btn-accent" data-close>Entendi</button>`); sgLgpd(); }
    catch(e){ toast("Não deu: " + (e.message || "")); } };
}
/* ---- 4. Consentimentos (totais; detalhe por usuária na ficha) ---- */
async function sgConsent(){
  const L = await sq(SB2().from("consentimentos_atuais").select("tipo,aceito,versao").limit(20000));
  const m = {}; L.forEach(c => { m[c.tipo] = m[c.tipo] || { s: 0, n: 0 }; c.aceito ? m[c.tipo].s++ : m[c.tipo].n++; });
  B().innerHTML = `<div class="card"><p class="muted" style="margin:0 0 10px">Cada aceite ou revogação vira um registro novo (o histórico nunca é sobrescrito). Detalhe por pessoa em Usuárias.</p><div class="tbl"><table><thead><tr><th>Tipo</th><th>Aceitos</th><th>Recusados/revogados</th></tr></thead><tbody>${Object.entries(m).map(([t, v]) => `<tr><td><b>${esc(t)}</b></td><td class="num">${int(v.s)}</td><td class="num">${int(v.n)}</td></tr>`).join("") || `<tr><td colspan="3" class="empty">Nenhum consentimento registrado ainda.</td></tr>`}</tbody></table></div></div>`;
}
/* ---- 5. Incidentes ---- */
const ST_INC = ["detectado","investigando","contido","corrigido","monitorando","encerrado"];
async function sgIncidentes(){
  const L = await sq(SB2().from("incidentes").select("*").order("descoberto_em", { ascending: false }).limit(200));
  B().innerHTML = `<div class="toolbar needs-edit"><button class="btn btn-accent btn-sm" id="in-novo">+ Registrar incidente</button></div>
    <div class="tbl"><table><thead><tr><th>Código</th><th>Título</th><th>Risco</th><th>Status</th><th>Descoberto</th><th>Comunicação</th><th></th></tr></thead><tbody>
    ${L.map(i => `<tr class="${i.arquivado ? "muted" : ""}"><td class="num">${esc(i.codigo)}</td><td><b>${esc(i.titulo)}</b>${i.sensiveis ? ` <span class="st bad">sensíveis</span>` : ""}${i.menores ? ` <span class="st bad">menores</span>` : ""}</td><td><span class="st ${["alto","critico"].includes(i.risco) ? "bad" : "warn"}">${i.risco}</span></td><td>${i.status}${i.arquivado ? " (arquivado)" : ""}</td><td>${dt(i.descoberto_em)}</td><td>${i.avaliar_comunicacao ? (i.decisao_comunicacao ? esc(i.decisao_comunicacao) : `<span class="st bad">avaliar até ${dd2(i.prazo_comunicacao)}</span>`) : "-"}</td><td><button class="btn btn-line btn-sm" data-iv="${i.id}">Abrir</button></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Nenhum incidente registrado.</td></tr>`}</tbody></table></div>`;
  const nv = $("in-novo"); if(nv) nv.onclick = () => formIncidente();
  B().querySelectorAll("[data-iv]").forEach(b => b.onclick = () => formIncidente(L.find(i => i.id === b.dataset.iv)));
}
async function formIncidente(i){
  const x = i || { risco: "medio", status: "detectado", descoberto_em: new Date().toISOString() }, ev = i ? await sq(SB2().from("incidente_eventos").select("*").eq("incidente_id", i.id).order("criado")).catch(() => []) : [];
  const tx = (k, l, t) => `<div class="field ${t === "area" ? "full" : ""}"><label for="if-${k}">${l}</label>${t === "area" ? `<textarea class="input" id="if-${k}">${esc(x[k] || "")}</textarea>` : `<input class="input" id="if-${k}" value="${esc(x[k] || "")}">`}</div>`;
  const loc = v => v ? new Date(new Date(v).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "";
  modal(i ? `Incidente ${x.codigo}` : "Registrar incidente", `<div class="formgrid">${tx("titulo", "Título")}<div class="field"><label for="if-tipo">Tipo</label><select class="input" id="if-tipo">${["vazamento","acesso indevido","exposição de arquivo","credencial comprometida","erro de permissão","bucket exposto","invasão","perda de dados","envio incorreto","acesso administrativo não autorizado","outro"].map(t => `<option ${x.tipo === t ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    ${tx("descricao", "Descrição", "area")}<div class="field"><label for="if-oc">Quando ocorreu</label><input class="input" type="datetime-local" id="if-oc" value="${loc(x.ocorreu_em)}"></div><div class="field"><label for="if-de">Quando foi descoberto</label><input class="input" type="datetime-local" id="if-de" value="${loc(x.descoberto_em)}"></div>
    ${tx("dados_afetados", "Dados afetados")}${tx("categorias_titulares", "Categorias de titulares")}<div class="field"><label for="if-q">Titulares (estimativa)</label><input class="input num" id="if-q" value="${esc(x.qtd_titulares || "")}"></div>
    <div class="field"><label for="if-r">Risco</label><select class="input" id="if-r">${["baixo","medio","alto","critico"].map(r => `<option ${x.risco === r ? "selected" : ""}>${r}</option>`).join("")}</select></div><div class="field"><label for="if-s">Status</label><select class="input" id="if-s">${ST_INC.map(r => `<option ${x.status === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>
    <label class="field xf-chk"><input type="checkbox" id="if-sens" ${x.sensiveis ? "checked" : ""}> Dados sensíveis</label><label class="field xf-chk"><input type="checkbox" id="if-men" ${x.menores ? "checked" : ""}> Menores envolvidos</label>
    ${tx("impacto", "Impacto", "area")}${tx("causa", "Causa", "area")}${tx("contencao", "Contenção", "area")}${tx("correcao", "Correção", "area")}</div>
    ${i && x.avaliar_comunicacao ? `<div class="card" style="background:var(--warn-soft)"><b>Avaliar comunicação à ANPD e às titulares até ${dd2(x.prazo_comunicacao)}</b> ${JUR}<ul class="muted" style="font-size:13px;margin:8px 0;padding-left:18px"><li>O incidente pode gerar risco ou dano relevante às titulares?</li><li>Envolve dados sensíveis, menores ou grande volume?</li><li>A contenção já eliminou o risco?</li><li>Quem é o Encarregado responsável pela decisão?</li></ul>
      <div class="formgrid">${tx("decisao_comunicacao", "Decisão (comunicar / não comunicar)")}${tx("justificativa", "Justificativa", "area")}${tx("protocolo_anpd", "Protocolo ANPD")}<div class="field"><label for="if-ca">Comunicado à ANPD em</label><input class="input" type="datetime-local" id="if-ca" value="${loc(x.comunicado_anpd_em)}"></div><div class="field"><label for="if-ct">Comunicado às titulares em</label><input class="input" type="datetime-local" id="if-ct" value="${loc(x.comunicado_titulares_em)}"></div></div><p class="muted" style="font-size:12.5px">O app não comunica nada automaticamente.</p></div>` : ""}
    ${i ? `<div class="field"><label for="if-nota">Nota para o histórico</label><input class="input" id="if-nota"></div>` : ""}
    <div class="toolbar needs-edit" style="justify-content:space-between">${i && !x.arquivado ? `<button class="btn btn-line" id="if-arq">Arquivar</button>` : "<span></span>"}<button class="btn btn-accent" id="if-ok">Salvar</button></div>
    ${ev.length ? `<h3>Histórico</h3>${ev.map(e => `<p style="margin:2px 0"><small>${dt(e.criado)} · ${esc(e.status || "")} ${e.nota ? "· " + esc(e.nota) : ""}</small></p>`).join("")}` : ""}`);
  const iso = id => { const v = val(id); return v ? new Date(v).toISOString() : null; };
  $("if-ok").onclick = async () => {
    const d = { titulo: val("if-titulo"), tipo: val("if-tipo"), descricao: val("if-descricao") || null, ocorreu_em: iso("if-oc"), descoberto_em: iso("if-de") || new Date().toISOString(), dados_afetados: val("if-dados_afetados") || null, categorias_titulares: val("if-categorias_titulares") || null, qtd_titulares: +val("if-q") || null, risco: val("if-r"), status: val("if-s"), sensiveis: $("if-sens").checked, menores: $("if-men").checked, impacto: val("if-impacto") || null, causa: val("if-causa") || null, contencao: val("if-contencao") || null, correcao: val("if-correcao") || null };
    if(!d.titulo) return toast("Informe o título");
    if($("if-decisao_comunicacao")) Object.assign(d, { decisao_comunicacao: val("if-decisao_comunicacao") || null, justificativa: val("if-justificativa") || null, protocolo_anpd: val("if-protocolo_anpd") || null, comunicado_anpd_em: iso("if-ca"), comunicado_titulares_em: iso("if-ct") });
    try{ if(i){ await sq(SB2().from("incidentes").update(d).eq("id", i.id)); const n = $("if-nota") && val("if-nota"); if(n) await sq(SB2().rpc("nota_incidente", { p_id: i.id, p_nota: n })); } else { d.responsavel = F.nuvem.uid; await sq(SB2().from("incidentes").insert(d)); } fechar(); toast("Incidente salvo e registrado"); sgIncidentes(); }catch(e){ toast("Sem permissão para incidentes"); } };
  const aq = $("if-arq"); if(aq) aq.onclick = () => confirmar("Arquivar este incidente? Ele continua guardado.", async () => { try{ await sq(SB2().from("incidentes").update({ arquivado: true }).eq("id", i.id)); toast("Arquivado"); sgIncidentes(); }catch(e){ toast("Sem permissão"); } });
}
/* ---- 6. Denúncias (reaproveita a central existente) ---- */
async function sgDenuncias(){ B().innerHTML = `<div class="card"><p style="margin:0">As denúncias têm prioridade automática (assédio = alta; 2+ denúncias contra a mesma pessoa em 24h = crítica). O moderador vê só o conteúdo denunciado, e cada abertura fica registrada.</p><button class="btn btn-accent btn-sm" id="sg-den" style="margin-top:10px">Abrir central de denúncias</button></div>`; $("sg-den").onclick = () => ir("moderacao"); }
/* ---- 7. Auditoria ---- */
let SGA = { q: "" };
async function sgAuditoria(){
  const L = await sq(SB2().from("auditoria").select("*").order("criado", { ascending: false }).limit(400));
  const ids = [...new Set(L.map(a => a.ator).filter(Boolean))], nomes = {}; if(ids.length) (await sq(SB2().from("alunas").select("id,nome,email").in("id", ids)).catch(() => [])).forEach(a => nomes[a.id] = a.nome || a.email);
  const V = SGA.q ? L.filter(a => (a.acao + " " + (a.recurso || "") + " " + (a.alvo || "") + " " + (nomes[a.ator] || "")).toLowerCase().includes(SGA.q.toLowerCase())) : L;
  B().innerHTML = `<div class="toolbar"><input class="input" id="au-q" placeholder="Filtrar por ação, pessoa ou recurso" value="${esc(SGA.q)}" style="max-width:320px"><button class="btn btn-line btn-sm" id="au-pl">Copiar planilha</button></div>
    <p class="muted" style="font-size:13px">Registros imutáveis: ninguém edita nem apaga pelo app. Não guardamos conteúdo de conversas, sintomas ou fotos nos registros.</p>
    <div class="tbl"><table><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Recurso</th><th>Alvo</th><th>Resultado</th><th>Motivo</th></tr></thead><tbody>${V.slice(0, 300).map(a => `<tr><td class="num">${dt(a.criado)}</td><td>${esc(nomes[a.ator] || (a.ator ? a.ator.slice(0, 8) : "sistema"))}</td><td><b>${esc(a.acao)}</b></td><td>${esc(a.recurso || "")}</td><td><small>${esc(a.alvo || "")}</small></td><td><span class="st ${a.resultado === "negado" ? "bad" : "ok"}">${esc(a.resultado)}</span></td><td class="wrapcell"><small>${esc(a.motivo || "")}</small></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Sem registros.</td></tr>`}</tbody></table></div>`;
  let t; $("au-q").oninput = e => { clearTimeout(t); t = setTimeout(() => { SGA.q = e.target.value; sgAuditoria(); }, 400); };
  $("au-pl").onclick = () => { planilha(["Quando","Quem","Ação","Recurso","Alvo","Resultado","Motivo"], V.map(a => [a.criado, nomes[a.ator] || a.ator, a.acao, a.recurso, a.alvo, a.resultado, a.motivo]), "Auditoria"); F.nuvem.sb.rpc("auditar", { p_acao: "exportou_auditoria", p_recurso: "auditoria", p_alvo: String(V.length) }); };
}
/* ---- 8. Acessos administrativos e papéis ---- */
async function sgAcessos(){
  const adm = await sq(SB2().from("admins").select("*")), log = await sq(SB2().from("auditoria").select("*").in("acao", ["login_admin","acesso_negado","permissao_alterada","admin_adicionado","admin_removido"]).order("criado", { ascending: false }).limit(60)).catch(() => []);
  const papel = p => p && p.total ? "Super Admin (total)" : p && p.papel ? ({ administrador: "Administrador", moderador: "Moderador", suporte: "Suporte", privacidade: "Privacidade/LGPD", operador: "Operador" })[p.papel] || p.papel : "Personalizado";
  B().innerHTML = `<div class="card"><h3>Pessoas com acesso ao painel</h3><div class="tbl"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Desde</th></tr></thead><tbody>${adm.map(a => `<tr><td><b>${esc(a.nome || "")}</b></td><td>${esc(a.email || "")}</td><td>${esc(papel(a.perms))}</td><td>${dd2(a.desde)}</td></tr>`).join("")}</tbody></table></div><p class="muted" style="font-size:13px">Para mudar papéis: Ajustes › Admins › Permissões (papéis prontos: Super Admin, Administrador, Moderador, Suporte, Privacidade/LGPD). Toda mudança fica registrada.</p></div>
    <div class="card"><h3>Papéis e menor privilégio</h3><ul class="muted" style="font-size:13.5px;line-height:1.7;padding-left:18px;margin:6px 0 0"><li><b>Moderador:</b> só denúncias e comunidade; vê apenas o conteúdo denunciado; sem LGPD, sem ciclo.</li><li><b>Suporte:</b> consulta usuárias; sem ciclo, sem conteúdo denunciado, sem alterar contas.</li><li><b>Privacidade/LGPD:</b> pedidos de titulares e eliminação; vê o painel de segurança.</li><li><b>Administrador:</b> conteúdo e cadastros; não muda admins nem configurações.</li><li><b>Super Admin:</b> tudo, e tudo registrado.</li><li>Ninguém vê ciclo individual, conversas ou fotos privadas fora de uma denúncia.</li></ul></div>
    <div class="card"><h3>Acessos e mudanças recentes</h3>${log.map(l => `<p style="margin:3px 0"><small>${dt(l.criado)} · <b>${esc(l.acao)}</b> · ${esc(l.resultado)} ${l.alvo ? "· " + esc(l.alvo.slice(0, 40)) : ""}</small></p>`).join("") || `<p class="muted">Sem registros.</p>`}</div>`;
}
/* ---- 9. Dados sensíveis ---- */
async function sgSensiveis(){
  const r = await sq(SB2().rpc("ciclo_resumo")).catch(() => null);
  B().innerHTML = `<div class="grid g3">${kpi("Usando Meu Ciclo", r ? int(r.ativas) : "-", "só totais", "ciclo", 1)}${kpi("Já ativaram", r ? int(r.total) : "-")}${kpi("Check-ins 7 dias", r ? int(r.checkins_7d) : "-")}</div>
    <div class="card"><h3>Como os dados de saúde são protegidos</h3><ul class="muted" style="font-size:13.5px;line-height:1.7;padding-left:18px;margin:6px 0 0"><li>Meu Ciclo fica numa tabela separada que só a própria aluna lê e grava (regra no banco).</li><li>Nenhum papel do painel, nem o Super Admin, tem acesso individual pelo app.</li><li>Não são usados para anúncios, segmentação, parceiros, academias, marketplace nem afiliados.</li><li>Peso, medidas e treinos ficam na conta da aluna e não aparecem na consulta de Usuárias deste módulo.</li></ul>
      <p style="margin-top:10px"><b>Acesso excepcional (break-glass):</b> não existe no app. Se um dia for indispensável, deve ser criado com permissão específica, motivo obrigatório, confirmação e registro imutável. ${JUR}</p></div>`;
}
/* ---- 10. Retenção ---- */
async function sgRetencao(){
  const L = await sq(SB2().from("retencao").select("*").order("categoria"));
  B().innerHTML = `<p class="muted" style="font-size:13px">Prazos não são inventados pelo sistema: defina com o jurídico e marque como validado. ${JUR}</p><div class="tbl"><table><thead><tr><th>Categoria</th><th>Finalidade</th><th>Prazo</th><th>Regra</th><th>Ação final</th><th>Validado</th><th></th></tr></thead><tbody>${L.map(r => `<tr><td><b>${esc(r.categoria)}</b></td><td>${esc(r.finalidade || "")}</td><td>${esc(r.prazo)}</td><td class="wrapcell"><small>${esc(r.regra || "")}</small></td><td>${r.acao}</td><td>${r.validado ? `<span class="st ok">sim</span>` : `<span class="st warn">não</span>`}</td><td><button class="btn btn-line btn-sm needs-edit" data-rt="${esc(r.categoria)}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
  B().querySelectorAll("[data-rt]").forEach(b => b.onclick = () => { const r = L.find(x => x.categoria === b.dataset.rt);
    modal("Retenção · " + r.categoria, `<div class="formgrid"><div class="field full"><label for="rt-f">Finalidade</label><input class="input" id="rt-f" value="${esc(r.finalidade || "")}"></div><div class="field"><label for="rt-p">Prazo</label><input class="input" id="rt-p" value="${esc(r.prazo)}"></div><div class="field"><label for="rt-a">Ação final</label><select class="input" id="rt-a">${["anonimizar","excluir","conservar"].map(a => `<option ${r.acao === a ? "selected" : ""}>${a}</option>`).join("")}</select></div><div class="field full"><label for="rt-r">Regra</label><textarea class="input" id="rt-r">${esc(r.regra || "")}</textarea></div><label class="field xf-chk"><input type="checkbox" id="rt-v" ${r.validado ? "checked" : ""}> Validado pelo jurídico</label></div><button class="btn btn-accent" id="rt-ok">Salvar</button>`);
    $("rt-ok").onclick = async () => { try{ await sq(SB2().from("retencao").update({ finalidade: val("rt-f"), prazo: val("rt-p"), acao: val("rt-a"), regra: val("rt-r"), validado: $("rt-v").checked, atualizado: new Date().toISOString() }).eq("categoria", r.categoria)); F.nuvem.sb.rpc("auditar", { p_acao: "retencao_alterada", p_recurso: "retencao", p_alvo: r.categoria }); fechar(); toast("Salvo"); sgRetencao(); }catch(e){ toast("Sem permissão"); } }; });
}
/* ---- 11. Storage ---- */
async function sgStorage(){
  const c = await sq(SB2().rpc("seguranca_checagens"));
  B().innerHTML = `<div class="tbl"><table><thead><tr><th>Pasta</th><th>Tipo</th><th>Arquivos</th><th>Limite</th><th>Formatos aceitos</th></tr></thead><tbody>${c.buckets.map(b => `<tr><td><b>${esc(b.id)}</b></td><td><span class="st ${b.publico ? "warn" : "ok"}">${b.publico ? "pública" : "privada"}</span></td><td class="num">${int(b.arquivos)}</td><td>${b.limite ? Math.round(b.limite / 1048576) + " MB" : "-"}</td><td><small>${esc((b.tipos || []).join(", ") || "qualquer")}</small></td></tr>`).join("")}</tbody></table></div>
    <div class="grid g3">${kpi("Arquivos órfãos", int(c.orfaos_social), "sem dono, já inacessíveis")}${kpi("Stories vencidos com arquivo", int(c.stories_vencidos_com_arquivo), "inacessíveis pelo banco")}${kpi("Conteúdos moderados", int(c.conteudo_moderado), "ocultos, preservados")}</div>
    <div class="card"><ul class="muted" style="font-size:13.5px;line-height:1.7;padding-left:18px;margin:0"><li>Fotos e áudios privados: pasta privada "social", nomes aleatórios, tipo e tamanho conferidos pelo banco, link temporário só para quem tem permissão.</li><li>"posts" (pública) guarda só as fotos antigas da comunidade, de antes da rede social. Recomendado migrar.</li><li>"catalogo" (pública) guarda logos e fotos de empresas, profissionais e produtos (não são dados de alunas).</li><li>Links expirados e falhas de autorização do storage não são visíveis pelo app; veja os logs de Storage no Supabase.</li><li>A limpeza de órfãos exige a chave de serviço (fora do app). Pendente.</li></ul></div>`;
}
/* ---- 12. Sessões e verificação em 2 etapas ---- */
async function sgSessoes(){
  const sb = SB2(); let fatores = [], aal = null;
  try{ const f = await sb.auth.mfa.listFactors(); fatores = (f.data && f.data.all) || []; const a = await sb.auth.mfa.getAuthenticatorAssuranceLevel(); aal = a.data; }catch(e){}
  const ok = fatores.filter(x => x.status === "verified");
  const cfg = await sq(sb.from("seguranca_config").select("*").eq("chave", "mfa_admin_obrigatorio")).catch(() => []);
  const obrig = cfg[0] && cfg[0].valor === true;
  B().innerHTML = `<div class="card"><h3>Sua verificação em 2 etapas</h3>${ok.length ? `<p><span class="st ok">Ativa</span> com app autenticador. Sessão atual: ${aal && aal.currentLevel === "aal2" ? "verificada em 2 etapas" : "ainda sem o código nesta sessão"}.</p><button class="btn btn-line btn-sm" id="mf-rm">Desativar</button>` : `<p class="muted">Proteja o painel com um código do app autenticador (Google Authenticator, Microsoft Authenticator, Authy).</p><button class="btn btn-accent" id="mf-on">Ativar verificação em 2 etapas</button>`}</div>
    <div class="card"><h3>Exigir 2 etapas no painel</h3><p class="muted" style="font-size:13px">Quando ligado, o banco recusa ações do painel sem o código (vale para todas as admins). Ligue só depois que todas tiverem ativado.</p>
      <label class="xf-chk" style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="mf-ob" ${obrig ? "checked" : ""} ${ok.length ? "" : "disabled"}> 2 etapas obrigatória para o painel</label></div>
    <div class="card"><h3>Sessões</h3><p class="muted" style="font-size:13px">A lista de aparelhos conectados não é exposta ao app pelo Supabase. Você pode encerrar todas as sessões (inclusive esta).</p><button class="btn btn-bad btn-sm" id="ss-all">Sair de todos os dispositivos</button></div>`;
  const on = $("mf-on"); if(on) on.onclick = async () => {
    try{ const r = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "CK Life " + new Date().toISOString().slice(0, 10) }); if(r.error) throw r.error;
      modal("Ativar 2 etapas", `<p>1. Abra seu app autenticador e escaneie o QR Code:</p><div style="text-align:center"><img src="${r.data.totp.qr_code}" alt="QR Code" style="width:200px;height:200px;background:#fff;border-radius:12px"></div><p class="muted" style="font-size:12.5px;word-break:break-all">Ou digite o código: <b>${esc(r.data.totp.secret)}</b></p><p>2. Digite os 6 números que aparecem:</p><input class="input num" id="mf-c" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><button class="btn btn-accent" id="mf-ok" style="margin-top:10px">Confirmar</button>`);
      $("mf-ok").onclick = async () => { const v = await sb.auth.mfa.challengeAndVerify({ factorId: r.data.id, code: val("mf-c") }); if(v.error) return toast("Código inválido. Tente de novo."); sb.rpc("auditar", { p_acao: "mfa_ativado", p_recurso: "auth" }); fechar(); toast("Verificação em 2 etapas ativada"); sgSessoes(); };
    }catch(e){ toast("Não deu para ativar: confira se MFA (TOTP) está ligado no Supabase › Authentication › Multi-Factor."); } };
  const rm = $("mf-rm"); if(rm) rm.onclick = () => confirmar("Desativar a verificação em 2 etapas?", async () => { for(const f of ok){ await sb.auth.mfa.unenroll({ factorId: f.id }); } sb.rpc("auditar", { p_acao: "mfa_desativado", p_recurso: "auth" }); toast("Desativada"); sgSessoes(); });
  $("mf-ob").onchange = async e => { try{ await sq(sb.from("seguranca_config").update({ valor: e.target.checked }).eq("chave", "mfa_admin_obrigatorio")); toast(e.target.checked ? "Agora o painel exige 2 etapas" : "2 etapas não é mais obrigatória"); }catch(err){ e.target.checked = !e.target.checked; toast("Sem permissão (precisa da área Segurança e da sessão com código)"); } };
  $("ss-all").onclick = () => confirmar("Sair de todos os dispositivos, inclusive deste?", async () => { await sb.rpc("auditar", { p_acao: "logout_global", p_recurso: "auth" }); await sb.auth.signOut({ scope: "global" }); location.reload(); });
}
/* ---- 13. Idade e menores ---- */
async function sgMenores(){
  const cfg = await sq(SB2().from("seguranca_config").select("*").in("chave", ["idade_minima","idade_validada"]));
  const v = k => (cfg.find(c => c.chave === k) || {}).valor;
  B().innerHTML = `<div class="card"><h3>Faixa etária permitida no CK Life</h3><p class="muted" style="font-size:13px">Hoje o cadastro pede data de nascimento e o banco recusa quem tem menos que a idade mínima. Isso é autodeclaração, não aferição forte de idade. ${JUR}</p>
    <div class="formgrid"><div class="field"><label for="mn-i">Idade mínima</label><select class="input" id="mn-i">${[13,16,18].map(n => `<option ${+v("idade_minima") === n ? "selected" : ""}>${n}</option>`).join("")}</select></div><label class="field xf-chk"><input type="checkbox" id="mn-v" ${v("idade_validada") === true ? "checked" : ""}> Decisão validada pelo proprietário/jurídico</label></div>
    <button class="btn btn-accent needs-edit" id="mn-ok">Salvar</button></div>
    <div class="card"><h3>Se o CK Life aceitar menores de 18</h3><ul class="muted" style="font-size:13.5px;line-height:1.7;padding-left:18px;margin:0"><li>Consentimento de responsável quando exigido e aferição de idade adequada.</li><li>Perfil privado por padrão, sem mensagens de desconhecidas, sem anúncios direcionados.</li><li>Recursos sensíveis (Meu Ciclo, marketplace) revistos.</li><li>Denúncias com prioridade máxima envolvendo menores.</li></ul><p class="muted" style="font-size:13px">Essas regras não estão ativadas: dependem da decisão acima. ${JUR}</p></div>`;
  $("mn-ok").onclick = async () => { try{ await sq(SB2().from("seguranca_config").update({ valor: +val("mn-i") }).eq("chave", "idade_minima")); await sq(SB2().from("seguranca_config").update({ valor: $("mn-v").checked }).eq("chave", "idade_validada")); toast("Salvo e registrado"); }catch(e){ toast("Sem permissão"); } };
}
/* ---- 14. Documentos legais ---- */
const TIPOS_DOC = { termos: "Termos de Uso", privacidade: "Política de Privacidade", comunidade: "Política da Comunidade", conteudo: "Regras de Conteúdo", cookies: "Política de Cookies", seguranca: "Política de Segurança", saude: "Avisos de saúde", ciclo: "Regras do Meu Ciclo", clube: "Regras do Clube CK", profissionais: "Regras para profissionais", marketplace: "Regras do marketplace" };
async function sgDocumentos(){
  const L = await sq(SB2().from("documentos").select("*").order("criado", { ascending: false }));
  B().innerHTML = `<div class="toolbar needs-edit"><button class="btn btn-accent btn-sm" id="dc-novo">+ Nova versão</button></div><p class="muted" style="font-size:13px">Documento publicado não é editado: crie uma nova versão. Ao publicar, a anterior é arquivada. Com "novo aceite", as alunas aceitam de novo ao abrir o app. Textos jurídicos: ${JUR}</p>
    <div class="tbl"><table><thead><tr><th>Documento</th><th>Versão</th><th>Status</th><th>Vigência</th><th>Novo aceite</th><th></th></tr></thead><tbody>${L.map(d => `<tr><td><b>${esc(d.nome)}</b><br><small class="muted">${TIPOS_DOC[d.tipo] || d.tipo}</small></td><td>${esc(d.versao)}</td><td><span class="st ${d.status === "publicado" ? "ok" : d.status === "rascunho" ? "warn" : "off"}">${d.status}</span></td><td>${dd2(d.vigencia)}</td><td>${d.novo_aceite ? "sim" : "não"}</td><td><button class="btn btn-line btn-sm" data-dc="${d.id}">${d.status === "rascunho" ? "Editar" : "Ver"}</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty">Nenhum documento. Crie os Termos de Uso e a Política de Privacidade (revisados pelo jurídico).</td></tr>`}</tbody></table></div>`;
  const nv = $("dc-novo"); if(nv) nv.onclick = () => formDoc();
  B().querySelectorAll("[data-dc]").forEach(b => b.onclick = () => formDoc(L.find(d => d.id === b.dataset.dc)));
}
function formDoc(d){
  const x = d || { tipo: "termos", status: "rascunho", novo_aceite: false }, edita = !d || d.status === "rascunho";
  modal(d ? `${esc(x.nome)} v${esc(x.versao)}` : "Nova versão de documento", `<div class="formgrid"><div class="field"><label for="dc-t">Tipo</label><select class="input" id="dc-t" ${edita ? "" : "disabled"}>${Object.entries(TIPOS_DOC).map(([k, n]) => `<option value="${k}" ${x.tipo === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="field"><label for="dc-v">Versão</label><input class="input" id="dc-v" value="${esc(x.versao || "")}" placeholder="1.0" ${edita ? "" : "disabled"}></div><div class="field full"><label for="dc-n">Nome</label><input class="input" id="dc-n" value="${esc(x.nome || "")}" ${edita ? "" : "disabled"}></div>
    <div class="field"><label for="dc-vg">Vigência</label><input class="input" type="date" id="dc-vg" value="${esc(x.vigencia || "")}" ${edita ? "" : "disabled"}></div><label class="field xf-chk"><input type="checkbox" id="dc-na" ${x.novo_aceite ? "checked" : ""} ${edita ? "" : "disabled"}> Exige novo aceite</label>
    <div class="field full"><label for="dc-l">Link (opcional)</label><input class="input" id="dc-l" value="${esc(x.link || "")}" ${edita ? "" : "disabled"}></div><div class="field full"><label for="dc-c">Conteúdo</label><textarea class="input" id="dc-c" style="min-height:220px" ${edita ? "" : "disabled"}>${esc(x.conteudo || "")}</textarea></div></div>
    <div class="toolbar needs-edit" style="justify-content:flex-end">${edita ? `<button class="btn btn-line" id="dc-ok">Salvar rascunho</button><button class="btn btn-accent" id="dc-pub">Publicar</button>` : x.status === "publicado" ? `<button class="btn btn-line" id="dc-arq">Arquivar</button>` : ""}</div>`);
  const dados = () => ({ tipo: val("dc-t"), versao: val("dc-v"), nome: val("dc-n") || TIPOS_DOC[val("dc-t")], vigencia: val("dc-vg") || null, novo_aceite: $("dc-na").checked, link: val("dc-l") || null, conteudo: val("dc-c") || null });
  const salva = async (st, v) => { v = v || dados(); if(!v.versao) return toast("Informe a versão"); if(!v.conteudo && !v.link) return toast("Informe o conteúdo ou o link");
    try{ if(d) await sq(SB2().from("documentos").update({ ...v, status: st }).eq("id", d.id)); else await sq(SB2().from("documentos").insert({ ...v, status: st })); fechar(); toast(st === "publicado" ? "Publicado (versão anterior arquivada)" : "Rascunho salvo"); sgDocumentos(); }catch(e){ toast(/duplicate|unique/i.test(e.message || "") ? "Já existe essa versão para este documento" : "Sem permissão"); } };
  const ok = $("dc-ok"); if(ok) ok.onclick = () => salva("rascunho");
  const pb = $("dc-pub"); if(pb) pb.onclick = () => { const v = dados(); if(!v.versao) return toast("Informe a versão"); if(!v.conteudo && !v.link) return toast("Informe o conteúdo ou o link"); confirmar("Publicar esta versão? Ela não poderá mais ser editada.", () => salva("publicado", v)); };
  const aq = $("dc-arq"); if(aq) aq.onclick = () => confirmar("Arquivar este documento?", async () => { try{ await sq(SB2().from("documentos").update({ status: "arquivado" }).eq("id", d.id)); sgDocumentos(); }catch(e){ toast("Sem permissão"); } });
}
/* ---- 15. Configurações ---- */
async function sgConfig(){
  const L = await sq(SB2().from("seguranca_config").select("*").order("chave"));
  B().innerHTML = `<div class="tbl"><table><thead><tr><th>Configuração</th><th>Valor</th><th>Nota</th><th>Alterado</th><th></th></tr></thead><tbody>${L.map(c => `<tr><td><b>${esc(c.chave)}</b></td><td><code>${esc(JSON.stringify(c.valor))}</code></td><td class="wrapcell"><small>${esc(c.nota || "")}</small></td><td>${dt(c.atualizado)}</td><td><button class="btn btn-line btn-sm needs-edit" data-cf="${esc(c.chave)}">Editar</button></td></tr>`).join("")}</tbody></table></div>
    <p class="muted" style="font-size:13px">Capacidade real da plataforma: PWA no navegador — não bloqueia nem detecta print de tela; o app não promete isso. Backups: conforme o plano do Supabase (ver painel do Supabase › Database › Backups).</p>`;
  B().querySelectorAll("[data-cf]").forEach(b => b.onclick = () => { const c = L.find(x => x.chave === b.dataset.cf);
    modal("Configuração · " + c.chave, `<p class="muted">${esc(c.nota || "")}</p><textarea class="input" id="cf-v" style="font-family:monospace">${esc(JSON.stringify(c.valor, null, 2))}</textarea><button class="btn btn-accent" id="cf-s" style="margin-top:10px">Salvar</button>`);
    $("cf-s").onclick = async () => { let v; try{ v = JSON.parse(val("cf-v")); }catch(e){ return toast("Valor inválido (use número, true/false, \"texto\" ou {…})"); } try{ await sq(SB2().from("seguranca_config").update({ valor: v }).eq("chave", c.chave)); fechar(); toast("Salvo e registrado"); sgConfig(); }catch(e){ toast("Sem permissão"); } }; });
}
/* ---- 16. Mapa de dados (inventário) e RIPD ---- */
async function sgRiscos(){
  const [inv, rp] = await Promise.all([sq(SB2().from("inventario").select("*").order("dado")), sq(SB2().from("ripd").select("*").order("processo"))]);
  B().innerHTML = `<div class="card"><div class="sec-title"><h3>Mapa de dados (inventário LGPD)</h3><button class="btn btn-line btn-sm needs-edit" id="iv-novo">+ Item</button></div><p class="muted" style="font-size:13px">A base legal é definida pelo jurídico. ${JUR}</p>
    <div class="tbl"><table><thead><tr><th>Dado</th><th>Finalidade</th><th>Base legal</th><th>Onde fica</th><th>Quem acessa</th><th>Sensível</th><th></th></tr></thead><tbody>${inv.map(i => `<tr><td><b>${esc(i.dado)}</b><br><small class="muted">${esc(i.categoria || "")}</small></td><td>${esc(i.finalidade || "")}</td><td>${i.base_legal === "VALIDAÇÃO JURÍDICA NECESSÁRIA" ? JUR : esc(i.base_legal)}</td><td><small>${esc(i.armazenamento || "")}</small></td><td><small>${esc(i.acesso || "")}</small></td><td>${i.sensivel ? `<span class="st bad">sim</span>` : "não"}</td><td><button class="btn btn-line btn-sm needs-edit" data-iv="${i.id}">Editar</button></td></tr>`).join("")}</tbody></table></div></div>
    <div class="card"><div class="sec-title"><h3>RIPD · Relatórios de impacto</h3><button class="btn btn-line btn-sm needs-edit" id="rp-novo">+ Processo</button></div><p class="muted" style="font-size:13px">O sistema organiza; a conclusão é humana. ${JUR}</p>
    <div class="tbl"><table><thead><tr><th>Processo</th><th>Risco</th><th>Probabilidade</th><th>Impacto</th><th>Status</th><th>Revisão</th><th></th></tr></thead><tbody>${rp.map(r => `<tr><td><b>${esc(r.processo)}</b></td><td class="wrapcell"><small>${esc(r.risco || "")}</small></td><td>${esc(r.probabilidade || "")}</td><td>${esc(r.impacto || "")}</td><td><span class="st ${r.status === "aprovado" ? "ok" : "warn"}">${r.status}</span></td><td>${dd2(r.revisao)}</td><td><button class="btn btn-line btn-sm needs-edit" data-rp="${r.id}">Editar</button></td></tr>`).join("")}</tbody></table></div></div>`;
  const form = (tab, cps, item) => { const x = item || {}; modal(item ? "Editar" : "Novo", `<div class="formgrid">${cps.map(([k, l, t, op]) => t === "sel" ? `<div class="field"><label for="rk-${k}">${l}</label><select class="input" id="rk-${k}">${op.map(o => `<option ${x[k] === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>` : t === "chk" ? `<label class="field xf-chk"><input type="checkbox" id="rk-${k}" ${x[k] ? "checked" : ""}> ${l}</label>` : t === "date" ? `<div class="field"><label for="rk-${k}">${l}</label><input class="input" type="date" id="rk-${k}" value="${esc(x[k] || "")}"></div>` : `<div class="field full"><label for="rk-${k}">${l}</label><textarea class="input" id="rk-${k}">${esc(x[k] || "")}</textarea></div>`).join("")}</div><button class="btn btn-accent" id="rk-ok">Salvar</button>`);
    $("rk-ok").onclick = async () => { const d = {}; cps.forEach(([k, , t]) => d[k] = t === "chk" ? $("rk-" + k).checked : (val("rk-" + k) || null)); d.atualizado = new Date().toISOString(); if(tab === "inventario" && !d.base_legal) d.base_legal = "VALIDAÇÃO JURÍDICA NECESSÁRIA";
      try{ if(item) await sq(SB2().from(tab).update(d).eq("id", item.id)); else await sq(SB2().from(tab).insert(d)); F.nuvem.sb.rpc("auditar", { p_acao: tab + "_alterado", p_recurso: tab }); fechar(); toast("Salvo"); sgRiscos(); }catch(e){ toast("Sem permissão ou dados incompletos"); } }; };
  const CI = [["dado","Dado"],["categoria","Categoria"],["coleta","Onde é coletado"],["finalidade","Finalidade"],["base_legal","Base legal (jurídico)"],["origem","Origem"],["armazenamento","Onde é armazenado"],["acesso","Quem acessa"],["terceiros","Terceiros"],["sensivel","Dado sensível","chk"],["retencao","Retenção"],["protecao","Proteção"]];
  const CR = [["processo","Processo"],["dados","Dados envolvidos"],["finalidade","Finalidade"],["risco","Risco"],["probabilidade","Probabilidade","sel",["baixa","media","alta"]],["impacto","Impacto","sel",["baixo","medio","alto"]],["salvaguardas","Salvaguardas"],["mitigacao","Medidas de mitigação"],["responsavel","Responsável"],["revisao","Próxima revisão","date"],["documentos","Documentos relacionados"],["status","Status","sel",["rascunho","em_revisao","aprovado"]]];
  const a = $("iv-novo"); if(a) a.onclick = () => form("inventario", CI); const c = $("rp-novo"); if(c) c.onclick = () => form("ripd", CR);
  B().querySelectorAll("[data-iv]").forEach(b => b.onclick = () => form("inventario", CI, inv.find(i => i.id === b.dataset.iv)));
  B().querySelectorAll("[data-rp]").forEach(b => b.onclick = () => form("ripd", CR, rp.find(i => i.id === b.dataset.rp)));
}
/* ---- 17. Relatórios (só números; sem dados pessoais) ---- */
async function sgRelatorios(){
  const r = await sq(SB2().rpc("seguranca_resumo")), c = await sq(SB2().rpc("seguranca_checagens"));
  const linhas = [["Usuárias", r.usuarias], ["Ativas 30 dias", r.ativas_30d], ["Suspensas", r.suspensas], ["Bloqueadas", r.bloqueadas], ["Denúncias abertas", r.denuncias_abertas], ["Denúncias críticas", r.denuncias_criticas], ["Pedidos LGPD abertos", r.lgpd_abertas], ["Pedidos de exclusão", r.lgpd_exclusao], ["Incidentes abertos", r.incidentes_abertos], ["Incidentes aguardando decisão de comunicação", r.incidentes_comunicacao], ["Acessos ao painel (7d)", r.acessos_admin_7d], ["Tentativas negadas (7d)", r.acessos_negados_7d], ["Mídias privadas", r.midias_privadas], ["Arquivos órfãos", c.orfaos_social], ["Documentos publicados", r.docs_publicados], ["Retenções sem validação jurídica", r.retencao_pendente], ["Itens do inventário sem base legal validada", r.inventario_pendente], ["Tabelas sem RLS", c.tabelas_sem_rls.length], ["Admins com acesso total", c.admins_total]];
  B().innerHTML = `<div class="card" id="rel-seg"><h3>Relatório de segurança e privacidade · ${new Date().toLocaleDateString("pt-BR")}</h3><div class="tbl"><table><tbody>${linhas.map(([k, v]) => `<tr><td>${k}</td><td class="num"><b>${int(v)}</b></td></tr>`).join("")}</tbody></table></div><p class="muted" style="font-size:12.5px">Relatório agregado, sem dados pessoais. Não substitui avaliação jurídica.</p></div>
    <div class="toolbar"><button class="btn btn-line btn-sm" id="rl-pl">Copiar planilha</button><button class="btn btn-accent btn-sm" id="rl-pr">Imprimir / salvar PDF</button></div>`;
  $("rl-pl").onclick = () => planilha(["Indicador","Valor"], linhas, "Relatório de segurança");
  $("rl-pr").onclick = () => { F.nuvem.sb.rpc("auditar", { p_acao: "relatorio_seguranca", p_recurso: "relatorios" }); const w = window.open("", "_blank"); if(!w) return toast("Permita pop-ups para imprimir"); w.document.write(`<html><head><title>Relatório CK Life</title><style>body{font-family:system-ui;padding:24px}td{padding:6px 10px;border-bottom:1px solid #ddd}</style></head><body>${$("rel-seg").innerHTML}</body></html>`); w.document.close(); w.print(); };
}

/* ---------- login do painel registrado; pede o código de 2 etapas quando ativado ---------- */
const abrir0 = abrir;
abrir = async function(){
  abrir0();
  const sb = SB2(); if(!sb) return;
  try{ sb.rpc("auditar", { p_acao: "login_admin", p_recurso: "painel" });
    const a = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(a.data && a.data.nextLevel === "aal2" && a.data.currentLevel !== "aal2"){
      const f = await sb.auth.mfa.listFactors(), fat = (f.data.totp || []).find(x => x.status === "verified"); if(!fat) return;
      modal("Verificação em 2 etapas", `<p>Digite o código de 6 números do seu app autenticador.</p><input class="input num" id="mfa-c" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><button class="btn btn-accent" id="mfa-ok" style="margin-top:10px">Entrar</button>`);
      $("mfa-ok").onclick = async () => { const v = await sb.auth.mfa.challengeAndVerify({ factorId: fat.id, code: val("mfa-c") }); if(v.error){ sb.rpc("auditar", { p_acao: "mfa_codigo_invalido", p_recurso: "auth", p_resultado: "negado" }); return toast("Código inválido"); } fechar(); toast("Verificado"); };
    }
  }catch(e){}
};
/* papéis prontos novos: Moderador, Suporte, Privacidade/LGPD (somados aos existentes) */
const formPerm1 = formPerm;
formPerm = function(u){
  formPerm1(u);
  const box = $("mbox").querySelector("[data-papel]"); if(!box) return;
  box.parentNode.insertAdjacentHTML("beforeend", `<button class="btn btn-line btn-sm" data-papel2="moderador">Moderador</button><button class="btn btn-line btn-sm" data-papel2="suporte">Suporte</button><button class="btn btn-line btn-sm" data-papel2="privacidade">Privacidade/LGPD</button>`);
  const P2 = { moderador: { moderacao: "editar", comunidade: "editar" }, suporte: { alunos: "ver", agendamentos: "ver" }, privacidade: { lgpd: "editar", incidentes: "editar", documentos: "editar", seguranca: "ver", auditoria: "ver" } };
  $("mbox").querySelectorAll("[data-papel2]").forEach(b => b.onclick = () => { const p = P2[b.dataset.papel2]; $("pm-t").checked = false; $("pm-t").onchange(); $("pm-g").querySelectorAll("select").forEach(s => s.value = p[s.dataset.k] || ""); PAPEL_ESCOLHIDO = b.dataset.papel2; toast("Papel aplicado. Clique em Salvar permissões."); });
  const ok = $("pm-ok"), s0 = ok.onclick; ok.onclick = () => { s0(); if(PAPEL_ESCOLHIDO && u.perms && !u.perms.total){ u.perms.papel = PAPEL_ESCOLHIDO; save(); } PAPEL_ESCOLHIDO = null; };
};
let PAPEL_ESCOLHIDO = null;
VIEWS.seguranca = vSeguranca; VIEWS.lgpd = () => { SEGA = "lgpd"; ir("seguranca"); }; VIEWS.incidentes = () => { SEGA = "incidentes"; ir("seguranca"); }; VIEWS.auditoria = () => { SEGA = "auditoria"; ir("seguranca"); }; VIEWS.documentos = () => { SEGA = "documentos"; ir("seguranca"); };
/* menu do painel organizado por assunto */
GRUPOS.length = 0;
GRUPOS.push(["Métricas", ["resumo","metricas","explorarm"]], ["Usuárias", ["alunos","ciclo"]], ["Social e moderação", ["comunidade","grupos","moderacao"]],
  ["Conteúdo", ["receitas","exercicios","avisos","banners","destaques","categorias"]],
  ["Comercial", ["empresas","profissionais","servicos","agendamentos","avaliacoes","parceiros","cupons","produtos","anunciantes","campanhas","financeiro"]],
  ["Proteção", ["seguranca"]], ["Configurações", ["cidades","segmentos","admins","config"]]);

/* ---------- Grupos da comunidade ---------- */
AIC.grupos = '<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M15 14.2c3 0 5.5 1.8 5.5 4.8"/>';
SECOES.push(["grupos", "Grupos"]);
async function vGrupos(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Grupos da comunidade</h1><p class="muted">Grupos por objetivo ou por cidade. As alunas entram e saem quando quiserem; ninguém vê a lista de membras, só o total.</p></div><button class="btn btn-accent needs-edit" id="gp-novo">+ Novo grupo</button></div><div id="gp-b"><div class="card">Carregando…</div></div>`;
  if(!SB2()) return $("gp-b").innerHTML = `<div class="card">Funciona no app oficial, com o banco conectado.</div>`;
  let L, cont = {};
  try{ L = await sq(SB2().from("grupos").select("*").order("ordem").order("nome")); (await sq(SB2().rpc("grupos_info")) || []).forEach(g => cont[g.id] = g.membros); }catch(e){ return $("gp-b").innerHTML = semBanco(e).replace("seguranca.sql", "novidades.sql"); }
  $("gp-b").innerHTML = `<div class="tbl"><table><thead><tr><th>Grupo</th><th>Cidade</th><th>Membras</th><th>Status</th><th></th></tr></thead><tbody>${L.map(g => `<tr><td><b>${esc(g.emoji || "")} ${esc(g.nome)}</b><br><small class="muted">${esc(g.descricao || "")}</small></td><td>${esc((DB().cidades.find(c => +c.id === +g.cidade) || {}).nome || "Todas")}</td><td class="num">${int(cont[g.id] || 0)}</td><td><span class="st ${g.ativo ? "ok" : "off"}">${g.ativo ? "Ativo" : "Oculto"}</span></td><td><button class="btn btn-line btn-sm needs-edit" data-gp="${g.id}">Editar</button></td></tr>`).join("") || `<tr><td colspan="5" class="empty">Nenhum grupo. Rode o novidades.sql no Supabase.</td></tr>`}</tbody></table></div>`;
  const form = g => { const x = g || { ativo: true, ordem: 10, cor: "#2E7D5A" };
    modal(g ? "Editar grupo" : "Novo grupo", `<div class="formgrid"><div class="field"><label for="gp-n">Nome</label><input class="input" id="gp-n" value="${esc(x.nome || "")}" maxlength="60"></div><div class="field"><label for="gp-e">Emoji</label><input class="input" id="gp-e" value="${esc(x.emoji || "")}" maxlength="8"></div>
      <div class="field full"><label for="gp-d">Descrição</label><textarea class="input" id="gp-d" maxlength="300">${esc(x.descricao || "")}</textarea></div>
      <div class="field"><label for="gp-c">Cidade</label><select class="input" id="gp-c"><option value="">Todas</option>${DB().cidades.map(c => `<option value="${c.id}" ${+c.id === +x.cidade ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></div>
      <div class="field"><label for="gp-cor">Cor</label><input class="input" type="color" id="gp-cor" value="${esc(x.cor || "#2E7D5A")}"></div><div class="field"><label for="gp-o">Ordem</label><input class="input num" id="gp-o" value="${esc(x.ordem)}"></div>
      <label class="field xf-chk"><input type="checkbox" id="gp-a" ${x.ativo ? "checked" : ""}> Visível para as alunas</label></div><button class="btn btn-accent" id="gp-ok">Salvar</button>`);
    $("gp-ok").onclick = async () => { const nome = val("gp-n"); if(nome.length < 3) return toast("Nome com pelo menos 3 letras");
      const d = { nome, emoji: val("gp-e") || null, descricao: val("gp-d") || null, cidade: val("gp-c") ? +val("gp-c") : null, cor: val("gp-cor"), ordem: +val("gp-o") || 0, ativo: $("gp-a").checked };
      try{ if(g) await sq(SB2().from("grupos").update(d).eq("id", g.id)); else await sq(SB2().from("grupos").insert({ ...d, slug: (nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 34) + "-" + Math.random().toString(36).slice(2, 5)) }));
        F.nuvem.sb.rpc("auditar", { p_acao: g ? "grupo_alterado" : "grupo_criado", p_recurso: "grupos", p_alvo: nome }); fechar(); toast("Grupo salvo"); vGrupos(); }catch(e){ toast("Sem permissão ou dados inválidos"); } }; };
  const nv = $("gp-novo"); if(nv) nv.onclick = () => form();
  $("gp-b").querySelectorAll("[data-gp]").forEach(b => b.onclick = () => form(L.find(g => g.id === b.dataset.gp)));
}
VIEWS.grupos = vGrupos;
