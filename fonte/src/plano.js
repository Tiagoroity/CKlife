
/* ===================== CK LIFE FREE / PRO (camada central) =====================
   O app pergunta UMA coisa: "ela tem CK_LIFE_PRO agora?" — a resposta vem do servidor (meu_plano), com o relógio do servidor.
   Toda checagem de recurso passa por pode(recurso). Esconder botão é só conforto: o banco valida o que é importante.
   Nunca bloqueados: privacidade, termos, exportar dados, excluir conta, denunciar, bloquear, segurança, sair. */
const ENT = { d: null, t: 0, skew: 0, planos: null, cfgVoz: null };
window.__ENT = ENT;
const agoraServ = () => Date.now() + ENT.skew;
async function carregaPlano(forca){
  if(!NU.ativo || !NU.sb || !NU.uid) return null;
  if(!forca && ENT.d && Date.now() - ENT.t < 300000) return ENT.d;
  try{ const r = await NU.sb.rpc("meu_plano"); if(!r.error && r.data){ ENT.d = r.data; ENT.t = Date.now(); ENT.skew = new Date(r.data.agora).getTime() - Date.now(); } }catch(e){}
  return ENT.d;
}
async function carregaPlanos(){
  if(ENT.planos) return ENT.planos;
  try{ const r = await NU.sb.from("planos").select("*").eq("ativo", true).order("ordem"); if(!r.error) ENT.planos = r.data; }catch(e){}
  return ENT.planos || [{ id: "pro_mensal", nome: "CK Life Pro Mensal", periodo: "mes", preco: 19.99 }, { id: "pro_anual", nome: "CK Life Pro Anual", periodo: "ano", preco: 155.88, parcelas: 12, parcela_valor: 12.99 }];
}
const souPro = () => ENT.d ? !!ENT.d.pro : !!(ME && ME.premium && (ME.premium.tipo === "vitalicio" || ME.premium.ate >= today()));
const emTrial = () => !!(ENT.d && ENT.d.trial);
function pode(f){ if(ENT.d && ENT.d.recursos && f in ENT.d.recursos) return !!ENT.d.recursos[f]; return souPro(); }
function limite(f, padrao){ const l = ENT.d && ENT.d.limites ? ENT.d.limites[f] : undefined; return l == null ? padrao : l; }
function registraEvento(nome, props){ if(NU.ativo && NU.sb && NU.uid) NU.sb.rpc("registra_evento", { p_nome: nome, p_props: props || null }).then(() => {}, () => {}); }
const brlP = v => "R$ " + Number(v || 0).toFixed(2).replace(".", ",");
/* regras de conteúdo (sem número espalhado: limites vêm de recursos) */
const PROG_FREE_PADRAO = ["comecando", "hiit", "gluteos", "mobilidade"];
const progGratis = id => (DB.config.programasFree || PROG_FREE_PADRAO).includes(id);
function progLiberado(id){ return !id || progGratis(id) || pode("programas_completos"); }
function receitaLivre(id){ const pl = (DB.receitasPlano || {})[id]; if(pl) return pl === "free" || pode("receitas_todas"); if(pode("receitas_todas")) return true; const L = BASE_REC; const i = L.findIndex(r => r.id === id); return i < 0 || i % 3 === 0; }
const FIG_FREE = new Set(["hoje-teve","a-gata-foi","constancia-linda","ck-girl","create-keep-live","voce-apareceu-por-voce","bora-juntas","treino-concluido","orgulho-de-voce","amei","concluido","mais-um-check","missao-cumprida","que-tudooo","to-com-voce","voce-inspira","isso-ai-mulher","bom-diaaa","partiu","voce-consegue","vai-com-tudo","um-passo-de-cada-vez","sobrevivi-ao-treino","treino-pago","to-feliz"]);
const figPro = f => f && (f.pro != null ? !!f.pro : !FIG_FREE.has(f.id));
const filtroLivre = k => pode("filtros_todos") || (DB.config.filtrosFree || ["original", "natural", "glow", "vivo"]).includes(k);

/* ---------- paywall (camada própria, por cima de qualquer tela) ---------- */
const BENEF = [["👑", "Programas e treinos completos"], ["🥗", "Nutrição completa"], ["🌸", "Ciclo inteligente"], ["📊", "Evolução avançada"], ["✨", "Stickers e recursos criativos"], ["🎁", "Clube CK Pro"], ["✓", "Direito a pedir verificação"], ["🚫", "Sem anúncios"]];
const pagou = () => !!(ENT.d && ENT.d.pro && !ENT.d.trial);
async function paywall(contexto, preview){
  if(pagou()) return sheet("👑 Você é CK Life Pro", `<div class="card"><b>Sua assinatura está ativa 💚</b><p class="hint" style="margin:6px 0 0">${ENT.d.fim ? "Pro até " + brD(String(ENT.d.fim).slice(0, 10)) + ". " : ""}Todos os recursos Pro estão liberados para você.</p></div>`);
  registraEvento("paywall_viewed", { contexto: contexto || "geral" });
  if(!souPro() || emTrial()){ try{ const o = await NU.sb.rpc("oferta_ativar", { p_contexto: contexto || "paywall" }); if(o && !o.error && o.data) { ENT.d = { ...(ENT.d || {}), oferta: o.data }; } }catch(e){} }
  const P = await carregaPlanos(), of = ENT.d && ENT.d.oferta, men = P.find(p => p.id === "pro_mensal") || {}, anu = P.find(p => p.id === "pro_anual") || {};
  let box = $("pw"); if(!box){ box = document.createElement("div"); box.id = "pw"; box.className = "pw"; document.body.appendChild(box); }
  const parc = (n, v, ok) => ok && n && v ? `<small>ou ${n}x de ${brlP(v)}</small>` : "";
  const cardP = (k, p, promo) => `<button class="pw-plan ${k === "anual" ? "dest" : ""}" data-pl="${k}">${k === "anual" ? `<em>MAIS VANTAJOSO</em>` : ""}<b>${k === "anual" ? "Anual" : "Mensal"}</b>
    ${promo ? `<s>${brlP(p.preco)}${k === "anual" ? "/ano" : "/mês"}</s><strong>${brlP(promo.v)}${k === "anual" ? "/ano" : "/mês"}</strong>${promo.n ? parc(promo.n, promo.pv, anu.parcelamento) : ""}<small>${promo.txt}</small>`
      : `<strong>${brlP(p.preco)}${k === "anual" ? "/ano" : "/mês"}</strong>${parc(p.parcelas, p.parcela_valor, p.parcelamento)}`}</button>`;
  const promoM = of && of.preco_mensal_promo ? { v: of.preco_mensal_promo, txt: `por ${of.meses_promo || 12} meses, depois ${brlP(men.preco)}/mês` } : null;
  const promoA = of && of.preco_anual_promo ? { v: of.preco_anual_promo, n: of.parcelas_anual, pv: of.parcela_anual_valor, txt: `no primeiro ano, depois ${brlP(anu.preco)}/ano` } : null;
  box.innerHTML = `<div class="pw-in" role="dialog" aria-label="CK Life Pro"><button class="iconbtn sm pw-x" id="pw-x" aria-label="Fechar">${ic("close", 16)}</button>
    ${preview ? `<div class="pw-prev">${preview}</div>` : ""}
    <span class="eyebrow">👑 CK LIFE PRO</span><h2>${of ? esc(of.titulo) : "Sua experiência completa"}</h2><p class="pw-sub">${of ? esc(of.subtitulo || "") : "Mais personalização, profundidade e conveniência."}</p>
    ${of ? `<p class="pw-tempo" id="pw-tempo"></p>` : ""}
    <ul class="pw-ben">${BENEF.map(([i, t]) => `<li><i>${i}</i>${t}</li>`).join("")}</ul>
    <div class="pw-plans">${cardP("anual", anu, promoA)}${cardP("mensal", men, promoM)}</div>
    <button class="btn btn-accent btn-block btn-lg" id="pw-go">Continuar</button>
    <p class="hint pw-nota">Sem fidelidade escondida: você cancela quando quiser e continua Pro até o fim do período pago. Na compra, use o e-mail <b>${esc(ME.email || "da sua conta")}</b> para liberar automaticamente.</p></div>`;
  box.hidden = false;
  let esc0 = "anual";
  const marca = () => box.querySelectorAll("[data-pl]").forEach(b => b.setAttribute("aria-pressed", b.dataset.pl === esc0)); marca();
  box.querySelectorAll("[data-pl]").forEach(b => b.onclick = () => { esc0 = b.dataset.pl; marca(); vibra(6); });
  const fecha = () => { box.hidden = true; box.innerHTML = ""; clearInterval(box._t); };
  $("pw-x").onclick = fecha; box.onclick = e => { if(e.target === box) fecha(); };
  if(of){ if(NU.sb) NU.sb.rpc("oferta_evento", { p_id: of.id, p_tipo: "impressao" }).then(() => {}, () => {}); const tick = () => { const e = $("pw-tempo"); if(!e) return clearInterval(box._t); e.textContent = "Condição especial termina em " + tempoRest(of.expira); }; tick(); box._t = setInterval(tick, 1000); }
  $("pw-go").onclick = () => {
    const url = of ? (esc0 === "anual" ? of.checkout_anual_url : of.checkout_mensal_url) : (esc0 === "anual" ? anu.checkout_url : men.checkout_url);
    registraEvento("checkout_started", { plano: esc0, oferta: of ? of.campanha : null }); if(of && NU.sb) NU.sb.rpc("oferta_evento", { p_id: of.id, p_tipo: "checkout" }).then(() => {}, () => {});
    if(!url) return toast("A assinatura será liberada em breve. Fique de olho! 💚");
    ENT.voltouDoCheckout = true; window.open(url, "_blank", "noopener"); };
}
function tempoRest(fim){ const s = Math.max(0, Math.floor((new Date(fim).getTime() - agoraServ()) / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return `${h}h ${String(m).padStart(2, "0")}min ${String(ss).padStart(2, "0")}s`; }
document.addEventListener("visibilitychange", async () => { if(document.visibilityState !== "visible" || !ME) return; const antes = souPro(); await carregaPlano(true); if(ENT.voltouDoCheckout && !antes && souPro()){ ENT.voltouDoCheckout = false; toast("Bem-vinda ao CK Life Pro 👑"); rerender(); } });
function exigePro(f, contexto, preview){ if(pode(f)) return true; registraEvento("pro_feature_clicked", { recurso: f }); paywall(contexto || "recurso_pro", preview); return false; }

/* ---------- 👑 no conteúdo Pro: aparece, mas ao tocar mostra prévia + paywall ---------- */
function decoraPro(root){
  if(!ME) return;
  (root || document).querySelectorAll("[data-prog]:not([data-pz])").forEach(b => { b.dataset.pz = 1; if(!progLiberado(b.dataset.prog)) trava(b, "programas_completos", "programa_pro"); });
  (root || document).querySelectorAll("[data-q]:not([data-pz])").forEach(b => { b.dataset.pz = 1; const i = QUICK.findIndex(q => q.id === b.dataset.q); if(i >= limite("treinos_rapidos_todos", 3) && !pode("treinos_rapidos_todos")) trava(b, "treinos_rapidos_todos", "programa_pro"); });
  (root || document).querySelectorAll("[data-rec]:not([data-pz]),[data-r]:not([data-pz])").forEach(b => { b.dataset.pz = 1; const id = b.dataset.rec || b.dataset.r; if(id && !receitaLivre(id)) trava(b, "receitas_todas", "recurso_pro"); });
  (root || document).querySelectorAll("[data-parc]:not([data-pz])").forEach(b => { b.dataset.pz = 1; const p = (DB.parceiros || []).find(x => x.id === b.dataset.parc); if(p && p.pro && !pode("clube_pro")) trava(b, "clube_pro", "recurso_pro"); });
  (root || document).querySelectorAll(".fg-it[data-f]:not([data-pz]),#fg-pan [data-fg]:not([data-pz]),#cm-reac [data-rq]:not([data-pz])").forEach(b => { b.dataset.pz = 1; const id = b.dataset.f || b.dataset.fg || b.dataset.rq, f = (FCAT.L || []).find(x => x.id === id); if(f && figPro(f) && !pode("stickers_todos")) trava(b, "stickers_todos", "sticker_pro"); });
  (root || document).querySelectorAll("[data-fl]:not([data-pz])").forEach(b => { b.dataset.pz = 1; if(!filtroLivre(b.dataset.fl)) trava(b, "filtros_todos", "recurso_pro"); });
  [["#fl-mk", "maquiagem"], ["#se-dad", "selos_dados"]].forEach(([s, f]) => { const b = (root || document).querySelector(s + ":not([data-pz])"); if(b){ b.dataset.pz = 1; if(!pode(f)) trava(b, f, "recurso_pro"); } });
  (root || document).querySelectorAll("[data-des]:not([data-pz])").forEach(b => { b.dataset.pz = 1; if(b.dataset.des !== "d7" && !pode("desafios_longos")) trava(b, "desafios_longos", "programa_pro"); });
}
function trava(b, f, ctx){ b.classList.add("pro-lock"); b.dataset.exige = f; b.dataset.ctx = ctx; if(!b.querySelector(".pro-cr")) b.insertAdjacentHTML("beforeend", `<span class="pro-cr" aria-label="CK Life Pro">👑</span>`); }
new MutationObserver(() => { clearTimeout(decoraPro._t); decoraPro._t = setTimeout(() => decoraPro(), 60); }).observe(document.body, { childList: true, subtree: true });
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest(".pro-lock[data-exige]"); if(!b || pode(b.dataset.exige)) return; e.preventDefault(); e.stopImmediatePropagation();
  const img = b.querySelector("img"), nome = ([...b.querySelectorAll("h4,b,strong")].map(x => x.textContent.trim()).find(Boolean) || "").replace("👑", "").trim().slice(0, 60); registraEvento("pro_feature_clicked", { recurso: b.dataset.exige }); paywall(b.dataset.ctx, `${img && /figurinhas|fg-it/.test(img.src + b.className) ? `<img src="${esc(img.currentSrc || img.src)}" alt="">` : ""}${nome ? `<b>👑 ${esc(nome)}</b>` : ""}<small>Disponível no CK Life Pro.</small>`); }, true);

/* ---------- recursos Pro com verificação na hora de usar ---------- */
const rCardapioP = rCardapio; rCardapio = function(){ if(pode("cardapio")) return rCardapioP.apply(this, arguments);
  const b = $("d-body"); if(b){ b.innerHTML = `<div class="card pro-tela"><span>🗓️</span><b>👑 Cardápio semanal</b><p class="hint">Um cardápio para a semana toda, montado para a sua meta, com trocas de receitas em um toque.</p><button class="btn btn-accent" data-pw="1">Conhecer o CK Life Pro</button></div>`; b.querySelector("[data-pw]").onclick = () => exigePro("cardapio", "recurso_pro"); } };
const abrirCozinhaP = abrirCozinha; abrirCozinha = function(){ if(!exigePro("modo_cozinha", "recurso_pro")) return; return abrirCozinhaP.apply(this, arguments); };
const abrirReceitaP = abrirReceita; abrirReceita = function(id){ if(!receitaLivre(id)){ const r = receitas().find(x => x.id === id); registraEvento("pro_feature_clicked", { recurso: "receitas_todas" }); return paywall("recurso_pro", r ? `<b>👑 ${esc(r.nome)}</b>` : ""); } return abrirReceitaP.apply(this, arguments); };
const abrirProgramaP = abrirPrograma; abrirPrograma = function(id){ if(!progLiberado(id)){ const p = progById(id); registraEvento("pro_feature_clicked", { recurso: "programas_completos" }); return paywall("programa_pro", p ? `<b>👑 ${esc(p.nome)}</b><small>${p.semanas} semanas · ${esc(p.nivel)}</small>` : ""); } return abrirProgramaP.apply(this, arguments); };
const checkinP = checkin; checkin = function(){ if(!exigePro("ciclo_avancado", "recurso_pro", "<b>🌸 Ciclo inteligente</b><small>Sintomas, insights e treino adaptado à fase</small>")) return; return checkinP.apply(this, arguments); };
const adaptarTreinoP = adaptarTreino; adaptarTreino = function(){ if(!exigePro("ciclo_avancado", "recurso_pro", "<b>🌸 Treino adaptado ao ciclo</b>")) return; return adaptarTreinoP.apply(this, arguments); };
const criarFigurinhaP = criarFigurinha; criarFigurinha = function(){ if(!exigePro("figurinha_propria", "sticker_pro")) return; return criarFigurinhaP.apply(this, arguments); };
const videoValidoP = videoValido; videoValido = function(f, maxSeg){ const lim = limite("video_longo", souPro() ? 60 : 15); return videoValidoP.call(this, f, Math.min(maxSeg || 60, lim)); };
const rEvolucaoP = rEvolucao; rEvolucao = function(){ rEvolucaoP.apply(this, arguments); if(pode("graficos_avancados")) return;
  const cards = [...document.querySelectorAll("#t-evolucao .card")].filter(c => c.querySelector("#ev-peso")); cards.forEach(c => { const g = c.querySelector("svg"); if(g){ g.classList.add("pro-blur"); g.insertAdjacentHTML("afterend", `<button class="btn btn-soft btn-sm pro-graf" data-pw="graficos_avancados">👑 Ver evolução completa</button>`); } });
  document.querySelectorAll("#t-evolucao [data-pw]").forEach(b => b.onclick = () => exigePro("graficos_avancados", "grafico_pro")); };
/* fim do treino (Free): pode aparecer uma condição, nunca no meio do treino */
const fimTreinoPl = fimTreino; fimTreino = function(parcial){ fimTreinoPl.apply(this, arguments); registraEvento("exercise_completed", { treino: PL && PL.T ? PL.T.nome : null });
  if(parcial || (souPro() && !emTrial()) || !NU.sb) return;
  NU.sb.rpc("oferta_ativar", { p_contexto: "treino_concluido" }).then(r => { const o = r && r.data; if(!o) return; ENT.d = { ...(ENT.d || {}), oferta: o }; const ok = $("fim-ok"); if(!ok || $("pw-fim")) return;
    ok.insertAdjacentHTML("afterend", `<button class="pw-mini" id="pw-fim"><span>👑 ${esc(o.titulo)}</span><small>${esc(o.subtitulo || "Ver condição especial")}</small></button>`); $("pw-fim").onclick = () => { NU.sb.rpc("oferta_evento", { p_id: o.id, p_tipo: "clique" }); registraEvento("offer_clicked", { campanha: o.campanha }); paywall("treino_concluido"); }; }, () => {}); };

/* ---------- Início e Perfil: teste, último dia, oferta ---------- */
function blocoPlano(onde){
  const d = ENT.d; if(!d) return "";
  if(d.pro && !d.trial){ if(onde !== "inicio") return ""; return `<div class="pl-bloco"><button class="pl-pro" data-pro="1"><span class="pl-cr">👑</span><span><b>Você é CK Life Pro</b><small>${d.fim ? "Assinatura ativa até " + brD(String(d.fim).slice(0, 10)) : "Assinatura ativa"} · tudo liberado</small></span></button></div>`; }
  const of = d.oferta, dias = d.dias_restantes;
  let h = "";
  if(d.trial && dias != null) h += dias <= 1 ? `<div class="pl-ultimo"><b>Seu último dia de CK Life Pro 💚</b><p>Amanhã você continua usando o CK Life gratuitamente. Você <b>não perde</b> conta, amigas, mensagens, posts, Stories, conquistas, histórico, medidas, progresso, fotos e registros. Só os recursos Pro ficam bloqueados.</p><button class="btn btn-accent btn-sm" data-pw="1">Continuar com o Pro</button></div>`
    : `<button class="pl-chip" data-pw="1">👑 Pro grátis · ${dias} ${dias === 1 ? "dia restante" : "dias restantes"}</button>`;
  if(of){ const falta = new Date(of.expira).getTime() - agoraServ();
    h += `<button class="pl-oferta" data-pw="1"><span class="eyebrow">CONDIÇÃO ESPECIAL</span><b>${esc(of.titulo)}</b><small>${esc(of.subtitulo || "")}</small><em class="pl-cont" data-fim="${esc(of.expira)}">${falta < 864e5 * 2 && falta > 864e5 ? "Sua condição especial termina amanhã." : "Termina em " + tempoRest(of.expira)}</em></button>`;
    if(onde === "inicio" && !blocoPlano.visto){ blocoPlano.visto = 1; NU.sb && NU.sb.rpc("oferta_evento", { p_id: of.id, p_tipo: "impressao" }).then(() => {}, () => {}); } }
  return h ? `<div class="pl-bloco">${h}</div>` : "";
}
setInterval(() => document.querySelectorAll(".pl-cont[data-fim]").forEach(e => { const f = new Date(e.dataset.fim).getTime() - agoraServ(); e.textContent = f <= 0 ? "Condição encerrada" : f > 864e5 && f < 864e5 * 2 ? "Sua condição especial termina amanhã." : "Termina em " + tempoRest(e.dataset.fim); }), 1000);
const rInicioPl = rInicio; rInicio = function(){ rInicioPl.apply(this, arguments); const b = blocoPlano("inicio"), alvo = document.querySelector("#t-inicio .xe-dia"); if(b && alvo) alvo.insertAdjacentHTML("afterbegin", b);
  document.querySelectorAll("#t-inicio [data-pw]").forEach(x => x.onclick = () => paywall("paywall")); document.querySelectorAll("#t-inicio [data-pro]").forEach(x => x.onclick = () => tab("perfil"));
  const rec = document.querySelector("#t-inicio .xe-rec"); if(rec && !pode("sugestoes_energia")){ const bt = rec.querySelector("button"); if(bt){ bt.innerHTML = "👑 Treino adaptado à sua energia"; bt.onclick = e => { e.stopPropagation(); exigePro("sugestoes_energia", "recurso_pro"); }; } }
  anunciosInicio(); };
const rPerfilPl = rPerfil; rPerfil = function(){ rPerfilPl.apply(this, arguments); const el = $("t-perfil"); if(!el || !ENT.d) return;
  const card = [...el.querySelectorAll(".today")].find(c => /Premium|anúncios/i.test(c.textContent)), d = ENT.d;
  const html = `<div class="pl-card ${d.pro ? "on" : ""}${d.pro && !d.trial ? " pago" : ""}"><span class="eyebrow">${d.pro ? (d.trial ? "👑 CK Life Pro · teste grátis" : "👑 CK Life Pro · assinante" + (d.plano === "pro_anual" ? " anual" : d.plano === "pro_mensal" ? " mensal" : "")) : "CK Life Free"}</span>
    <h2>${d.pro ? (d.trial ? `${d.dias_restantes} ${d.dias_restantes === 1 ? "dia" : "dias"} de Pro grátis` : d.fim ? `Pro até ${brD(String(d.fim).slice(0, 10))}` : "Pro ativo") : "Treino, comunidade e conquistas grátis"}</h2>
    <p>${d.pro ? (d.status === "canceled" ? "Assinatura cancelada: você continua Pro até o fim do período." : "Programas completos, nutrição, ciclo inteligente e sem anúncios.") : "Conheça o Pro: programas completos, nutrição, ciclo inteligente e sem anúncios."}</p>
    ${!d.pro || d.trial ? `<button class="btn btn-accent" data-pw="1">${d.oferta ? "Ver condição especial" : "Conhecer o CK Life Pro"}</button>` : ""}</div>${blocoPlano("perfil").replace(/pl-chip/g, "pl-chip pl-oculto")}`;
  if(card) card.outerHTML = html; else el.insertAdjacentHTML("afterbegin", html);
  el.querySelectorAll("[data-pw]").forEach(x => x.onclick = () => paywall("paywall"));
  const lem = $("p-lemb"); if(lem && !$("p-verif")){ const v = d.verificacao, txt = { not_requested: d.pro ? "Peça o selo azul de perfil real" : "Assinantes Pro podem pedir", pending: "Em análise", verified: "Perfil verificado ✓", rejected: "Não aprovado · veja o motivo", needs_review: "Precisamos de uma nova foto", revoked: "Selo removido" }[v] || "";
    lem.insertAdjacentHTML("beforebegin", setRow("p-verif", "shield", "Verificação de perfil (selo azul)", txt)); $("p-verif").onclick = abreVerificacao; } };

/* ---------- Verificação de perfil (selo azul = pessoa real; pagamento NÃO dá selo) ---------- */
async function abreVerificacao(){
  let L = []; try{ L = await q(SB().from("verificacoes").select("*").eq("user_id", NU.uid).order("criado", { ascending: false }).limit(1)); }catch(e){}
  const v = L[0];
  if(v && v.status === "pending" && !v.selfie) return pedeSelfie(v);
  if(v && ["pending", "verified"].includes(v.status)) return sheet("Verificação de perfil", `<div class="card"><b>${v.status === "verified" ? "✓ Seu perfil é verificado" : "⏳ Seu pedido está em análise"}</b><p class="hint" style="margin:6px 0 0">${v.status === "verified" ? "O selo azul mostra que você é uma pessoa real. Ele continua mesmo se o Pro acabar." : "Nossa equipe vai conferir sua foto. Você recebe um aviso quando terminar."}</p></div>`);
  if(!exigePro("verificacao", "recurso_pro", "<b>✓ Selo azul de perfil real</b>")) return;
  sheet("Verificação de perfil", `<div class="card"><b>✓ Selo azul = pessoa real</b><p class="hint" style="margin:6px 0 0">O selo não é comprado: ele mostra que uma pessoa da equipe confirmou que o perfil é seu. Você vai tirar uma selfie segurando um papel com um código. A foto fica privada e só a equipe de verificação vê. Nada disso aparece no seu perfil, só o ✓.</p></div>
    ${v && v.motivo ? `<div class="card"><b>Última análise</b><p class="hint" style="margin:6px 0 0">${esc(v.motivo)}</p></div>` : ""}<button class="btn btn-accent btn-block btn-lg" id="vf-ok">Começar</button>`);
  $("vf-ok").onclick = async () => { try{ const r = await q(SB().from("verificacoes").insert({ user_id: NU.uid }).select()); registraEvento("verification_requested"); pedeSelfie(r[0]); }catch(e){ toast(ERR_MSG(e)); } };
}
function pedeSelfie(v){
  sheet("Sua selfie de verificação", `<div class="card vf-cod"><small>Escreva este código num papel e segure perto do rosto:</small><b class="num">${esc(v.codigo || "")}</b></div><button class="btn btn-accent btn-block btn-lg" id="vf-foto">${ic("camera", 18)} Tirar a selfie</button>`);
  $("vf-foto").onclick = async () => { const f = await escolheArquivo("image/*", "user"); if(!f) return; const b = await imagemValida(f, 1280); if(!b) return;
    try{ const path = await sobe("verificacao", NU.uid, b, "jpg", "image/jpeg"); await q(SB().rpc("verificacao_selfie", { p_id: v.id, p_selfie: path })); fecharSheet(); toast("Recebemos! Seu pedido está em análise ✓"); carregaPlano(true); }
    catch(e){ toast(ERR_MSG(e)); } };
}

/* ---------- Selos ✓ e 👑 ao lado do nome (só o ✓ e a 👑; nada de dado pessoal) ---------- */
const selosP = u => { const p = PERFIS.get(u) || (EU && EU.user_id === u ? EU : {}); return `${p.verificada ? `<i class="sel-ver" title="Perfil verificado">✓</i>` : ""}${p.pro_ate && new Date(p.pro_ate) > new Date() ? `<i class="sel-pro" title="CK Life Pro">👑</i>` : ""}`; };

/* ---------- Publicidade: só Free depois do 30º dia, só em espaços naturais (Feed e Explorar) ---------- */
function anuncioHtml(local){
  if(!ENT.d || !ENT.d.anuncios) return "";
  const L = campanhasPara(ME); if(!L.length) return "";
  const c = L[(anuncioHtml.n = (anuncioHtml.n || 0) + 1) % L.length], an = DB.anunciantes.find(a => a.id === c.anunc); if(!an) return "";
  return `<a class="ad-card" href="${esc(linkCamp(c))}" target="_blank" rel="noopener sponsored" data-ad="${c.id}" data-local="${local}"><span class="ad-tag">Patrocinado · ${esc(an.nome)}</span><b>${esc(c.titulo)}</b>${c.texto ? `<small>${esc(c.texto)}</small>` : ""}<em>${esc(c.botao || "Saiba mais")}</em></a>`;
}
new MutationObserver(() => document.querySelectorAll(".ad-card:not([data-vis])").forEach(a => { a.dataset.vis = 1; DB.eventos.push({ t: "imp", c: a.dataset.ad, u: ME.id, d: today() }); save(); registraEvento("ad_impression", { campanha: a.dataset.ad, local: a.dataset.local });
  a.onclick = () => { DB.eventos.push({ t: "clk", c: a.dataset.ad, u: ME.id, d: today() }); save(); registraEvento("ad_click", { campanha: a.dataset.ad, local: a.dataset.local }); }; })).observe(document.body, { childList: true, subtree: true });
function anunciosInicio(){}
const desenhaFeedPl = desenhaFeed; desenhaFeed = function(){ const r = desenhaFeedPl.apply(this, arguments); const ps = document.querySelectorAll("#feed > .post"); if(ps.length >= 6 && !document.querySelector("#t-juntas .ad-card")){ const h = anuncioHtml("feed"); if(h) ps[5].insertAdjacentHTML("afterend", h); } return r; };
const rExplorarPl = rExplorar; rExplorar = function(){ rExplorarPl.apply(this, arguments); const b = $("xp-body"); if(b && !document.querySelector("#t-explorar .ad-card")){ const h = anuncioHtml("explorar"); if(h) b.insertAdjacentHTML("beforebegin", h); } };

/* ---------- voltou para o app (ex.: depois de pagar): confere o plano de novo ---------- */
document.addEventListener("visibilitychange", async () => { if(document.hidden || !(NU.ativo && NU.sb && NU.uid)) return; const antes = pagou(); await carregaPlano(true);
  if(pagou() && ENT.d) ENT.d.oferta = null; if(antes !== pagou()){ if(pagou()){ $("pw") && $("pw").remove(); toast("👑 Bem-vinda ao CK Life Pro!"); } if(!$("v-app").hidden) rerender(); atualizaTopo(); } });
/* ---------- carga inicial ---------- */
{ let n = 0; const t = setInterval(async () => { if(!(NU.ativo && NU.sb && NU.uid)){ if(++n > 60) clearInterval(t); return; } clearInterval(t);
  await carregaPlano(true); if(pagou()) ENT.d.oferta = null; if(emTrial() && NU.sb){ try{ const r = await NU.sb.rpc("oferta_ativar", { p_contexto: null }); if(r && r.data) ENT.d.oferta = r.data; }catch(e){} }
  try{ const r = await NU.sb.from("app_config").select("chave,valor").in("chave", ["treino_voz"]); (r.data || []).forEach(c => { if(c.chave === "treino_voz") ENT.cfgVoz = c.valor; }); }catch(e){}
  if(ENT.d && !$("v-app").hidden){ rerender(); atualizaTopo(); } }, 1500); }
