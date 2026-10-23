
/* ===================== PRIVACIDADE E MEUS DADOS (aluna) =====================
   Documentos, consentimentos, baixar meus dados, pedidos LGPD com protocolo e sair de todos os aparelhos.
   Tudo validado no banco (seguranca.sql). Se o banco ainda não tiver o módulo, os itens somem sem erro. */
if(!P.book) P.book = '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>';
if(!P.download) P.download = '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>';
const mdv = id => $(id).value.trim();
const MD_OK = () => NU.ativo && NU.sb && NU.uid;
const MD_TIPOS = { acesso: "Saber quais dados vocês têm sobre mim", correcao: "Corrigir um dado", eliminacao: "Excluir minha conta e meus dados", revogacao: "Revogar um consentimento", compartilhamento: "Saber com quem meus dados são compartilhados", oposicao: "Me opor a um uso dos meus dados", outra: "Outro pedido sobre meus dados" };
const MD_ST = { recebida: "Recebido", verificando_identidade: "Confirmando sua identidade", em_analise: "Em análise", em_execucao: "Em andamento", aguardando_informacao: "Precisamos de uma informação", concluida: "Concluído", recusada: "Não atendido (veja a resposta)" };
async function meusDados(){
  if(!MD_OK()) return toast("Entre na sua conta para ver seus dados");
  let docs = [], peds = [];
  try{ docs = await q(SB().from("documentos").select("id,tipo,nome,versao,vigencia").eq("status", "publicado")); }catch(e){}
  try{ peds = await q(SB().from("solicitacoes").select("*").eq("user_id", NU.uid).order("criado", { ascending: false })); }catch(e){ if(XERR(e)) return toast("Esta área está sendo ativada. Volte em breve!"); }
  sheet("Privacidade e meus dados", `<div class="card"><p class="hint" style="margin:0">Seus dados são seus. Aqui você vê as regras do CK Life, baixa uma cópia dos seus dados e faz pedidos sobre eles. Cada pedido recebe um protocolo.</p></div>
    ${docs.length ? `<div class="card" style="padding:6px 16px">${docs.map(d => setRow("md-doc-" + d.id, "book", d.nome, "Versão " + d.versao + (d.vigencia ? " · desde " + brD(d.vigencia) : ""))).join("")}</div>` : ""}
    <div class="card" style="padding:6px 16px">${setRow("md-baixar", "download", "Baixar meus dados", "Arquivo com tudo o que é seu")}${setRow("md-pedir", "edit", "Fazer um pedido sobre meus dados", "Corrigir, excluir, saber mais")}${setRow("md-cons", "check", "Minhas autorizações", "O que você aceitou e quando")}${setRow("md-sair", "logout", "Sair de todos os aparelhos", "Encerra o acesso em todo lugar")}</div>
    <div class="card"><h3 style="font-size:16px">Meus pedidos</h3>${peds.length ? peds.map(p => `<button class="md-ped" data-ped="${p.id}"><span><b>${esc(MD_TIPOS[p.tipo] || p.tipo)}</b><small>Protocolo ${esc(p.protocolo)} · ${brD(p.criado)}</small></span><em class="md-st ${p.status}">${MD_ST[p.status] || p.status}</em></button>`).join("") : `<p class="hint" style="margin:6px 0 0">Nenhum pedido ainda.</p>`}</div>`);
  docs.forEach(d => { const e = $("md-doc-" + d.id); if(e) e.onclick = () => verDoc(d.id); });
  $("md-baixar").onclick = baixarMeusDados; $("md-pedir").onclick = fazerPedido; $("md-cons").onclick = minhasAutorizacoes;
  $("md-sair").onclick = () => { if(!confirm("Sair da sua conta em todos os aparelhos, inclusive neste?")) return; NU.sb.auth.signOut({ scope: "global" }).finally(() => location.reload()); };
  $("sheet-body").querySelectorAll("[data-ped]").forEach(b => b.onclick = () => { const p = peds.find(x => x.id === b.dataset.ped);
    sheet("Pedido " + p.protocolo, `<div class="card"><b>${esc(MD_TIPOS[p.tipo] || p.tipo)}</b><p class="hint" style="margin:6px 0 0">Feito em ${brD(p.criado)} · Situação: <b>${MD_ST[p.status]}</b>${p.prazo && !["concluida","recusada"].includes(p.status) ? ` · Previsão: ${brD(p.prazo)}` : ""}</p>${p.detalhe ? `<p style="margin:10px 0 0">${esc(p.detalhe)}</p>` : ""}</div>${p.resposta ? `<div class="card"><h3 style="font-size:16px">Resposta da equipe</h3><p style="margin:6px 0 0;white-space:pre-wrap">${esc(p.resposta)}</p></div>` : ""}`, () => meusDados()); });
}
async function verDoc(id, volta){
  try{ const d = (await q(SB().from("documentos").select("*").eq("id", id)))[0];
    sheet(d.nome, `<p class="hint">Versão ${esc(d.versao)}${d.vigencia ? " · vigente desde " + brD(d.vigencia) : ""}</p>${d.conteudo ? `<div class="card md-doc">${esc(d.conteudo)}</div>` : ""}${d.link ? `<a class="btn btn-line btn-block" href="${esc(d.link)}" target="_blank" rel="noopener">Abrir documento completo</a>` : ""}`, volta || (() => meusDados()));
  }catch(e){ toast("Não deu para abrir agora"); }
}
async function baixarMeusDados(){
  toast("Preparando seus dados…");
  try{ const r = await q(SB().rpc("exportar_meus_dados"));
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `meus-dados-cklife-${today()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Pronto! O arquivo foi salvo no seu aparelho");
  }catch(e){ toast(XERR(e) ? "Esta área está sendo ativada. Volte em breve!" : "Não deu agora. Confira a internet."); }
}
function fazerPedido(){
  sheet("Fazer um pedido", `<div class="field"><label for="md-t">O que você precisa?</label><select class="input" id="md-t">${Object.entries(MD_TIPOS).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
    <div class="field"><label for="md-d">Conte com suas palavras (opcional)</label><textarea class="input" id="md-d" maxlength="2000" placeholder="Ex.: meu nome está escrito errado"></textarea></div>
    <p class="hint" id="md-av"></p><button class="btn btn-accent btn-block" id="md-ok">Enviar pedido</button>`, () => meusDados());
  const av = () => { $("md-av").textContent = mdv("md-t") === "eliminacao" ? "Ao excluir, suas publicações, Stories, seguidoras e Meu Ciclo são apagados. Mensagens em conversas de outras pessoas ficam sem seu nome. Alguns registros podem ser guardados quando a lei exigir." : "Você recebe um protocolo e acompanha a resposta aqui."; };
  $("md-t").onchange = av; av();
  $("md-ok").onclick = async () => { const t = mdv("md-t");
    if(t === "eliminacao" && !confirm("Pedir a exclusão da sua conta e dos seus dados?")) return;
    try{ const r = await q(SB().from("solicitacoes").insert({ user_id: NU.uid, tipo: t, detalhe: mdv("md-d") || null }).select("protocolo")); toast("Pedido enviado · protocolo " + r[0].protocolo); meusDados(); }
    catch(e){ toast(/limite|demais/i.test(e.message || "") ? "Você já fez muitos pedidos hoje. Tente amanhã." : XERR(e) ? "Esta área está sendo ativada. Volte em breve!" : "Não deu agora. Confira a internet."); } };
}
const MD_CONS = { termos: "Termos de Uso", privacidade: "Política de Privacidade", ciclo: "Uso dos dados do Meu Ciclo", notificacoes: "Notificações", comunidade: "Regras da Comunidade" };
async function minhasAutorizacoes(){
  let L = []; try{ L = await q(SB().from("consentimentos_atuais").select("*").eq("user_id", NU.uid)); }catch(e){}
  sheet("Minhas autorizações", `<p class="hint">Cada vez que você aceita ou revoga, guardamos um registro com data e versão.</p>${L.length ? `<div class="card" style="padding:6px 16px">${L.map(c => `<div class="md-cons"><span><b>${esc(MD_CONS[c.tipo] || c.tipo)}</b><small>${c.aceito ? "Aceito" : "Revogado"}${c.versao ? " · versão " + esc(c.versao) : ""} · ${brD(c.criado)}</small></span>${c.tipo === "ciclo" && c.aceito ? `<button class="btn btn-line btn-sm" id="md-rv">Revogar</button>` : ""}</div>`).join("")}</div>` : `<div class="card"><p class="hint" style="margin:0">Nenhum registro ainda.</p></div>`}`, () => meusDados());
  const rv = $("md-rv"); if(rv) rv.onclick = async () => { if(!confirm("Revogar o uso dos dados do Meu Ciclo? Seus registros do ciclo serão apagados.")) return;
    await registraConsent("ciclo", false); try{ await XP.ciclo.apagar(); CIC = null; }catch(e){} toast("Revogado e dados do ciclo apagados"); minhasAutorizacoes(); };
}
async function registraConsent(tipo, aceito, versao){ if(!MD_OK()) return; try{ await q(SB().from("consentimentos").insert({ user_id: NU.uid, tipo, aceito, versao: versao || null, origem: "app" })); }catch(e){} }
/* aceite de nova versão de documento (Termos/Privacidade marcados com "novo aceite") */
async function confereAceites(forca){
  if(!MD_OK() || (!forca && !mdNoApp())) return;
  try{ const docs = await q(SB().from("documentos").select("id,tipo,nome,versao").eq("status", "publicado").eq("novo_aceite", true)); if(!docs.length) return;
    const meus = await q(SB().from("consentimentos_atuais").select("tipo,versao,aceito").eq("user_id", NU.uid));
    const falta = docs.filter(d => !meus.some(c => c.tipo === d.tipo && c.versao === d.versao && c.aceito)); if(!falta.length) return;
    sheet("Atualizamos nossas regras", `<p>Para continuar, leia e aceite:</p><div class="card" style="padding:6px 16px">${falta.map(d => setRow("ac-" + d.id, "book", d.nome, "Versão " + d.versao)).join("")}</div><button class="btn btn-accent btn-block" id="ac-ok">Li e aceito</button>`);
    falta.forEach(d => { const e = $("ac-" + d.id); if(e) e.onclick = () => verDoc(d.id, () => confereAceites(true)); });
    $("ac-ok").onclick = async () => { for(const d of falta) await registraConsent(d.tipo, true, d.versao); fecharSheet(); toast("Obrigada! 💚"); };
  }catch(e){}
}
/* liga nos pontos existentes: Privacidade ganha "Meus dados"; Meu Ciclo registra consentimento */
const privacidade0 = privacidade;
privacidade = async function(){ await privacidade0(); const b = $("sheet-body"); if(!b || !MD_OK()) return;
  b.insertAdjacentHTML("afterbegin", `<div class="card" style="padding:6px 16px">${setRow("pv-md", "shield", "Privacidade e meus dados", "Baixar dados, pedidos, autorizações e documentos")}</div>`); $("pv-md").onclick = meusDados;
  const s = $("pv-sup"); if(s){ s.querySelector("b") && (s.querySelector("b").textContent = "Pedir exclusão da conta"); s.onclick = () => { meusDados().then(fazerPedido); }; } };
const cicloGrava0 = cicloGrava;
let MD_CIC = false;
cicloGrava = async function(){ const r = await cicloGrava0.apply(this, arguments);
  if(r && !MD_CIC && MD_OK()){ MD_CIC = true; try{ const c = await q(SB().from("consentimentos_atuais").select("aceito").eq("user_id", NU.uid).eq("tipo", "ciclo")); if(!c.length || !c[0].aceito) registraConsent("ciclo", true); }catch(e){} }
  return r; };
const mdNoApp = () => { const app = $("v-app"); return !!(app && app.offsetParent !== null && !location.hash.startsWith("#admin") && $("sheet").hidden); };
{ let n = 0; const t = setInterval(() => { if(MD_OK() && mdNoApp()){ clearInterval(t); confereAceites(); } else if(++n > 120) clearInterval(t); }, 4000); }
