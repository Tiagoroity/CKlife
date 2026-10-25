/* ===================== ETAPA 5 · COMUNIDADE INTEGRADA, PARCEIRA CK E PRO REFINADO =====================
   VITÓRIAS DE HOJE no topo da Comunidade (posts de conquista de hoje, número real de mulheres);
   "COMPARTILHAR MINHA VITÓRIA" no fim do treino; Parceira CK (opcional: só dias de treino na semana + 1 incentivo por dia);
   PRO com acabamento premium (anel champanhe, detalhes perolados) e "Seus insights" (Free também recebe insights).
   Nada de ranking, nada de corpo, nada de número inventado. */

/* ---------- Vitórias de hoje ---------- */
const VIT_CONQ = { emoji: "💪", titulo: "Vitória de hoje", frase: "Cada passo conta.", k: "vitoria" };
async function vitoriasHoje(){
  if(!SO.on()) return null;
  const ini = new Date(today() + "T00:00:00").toISOString();
  let rows = null;
  try{ const r = await SB().from("posts").select("*").not("conquista", "is", null).gte("criado", ini).order("criado", { ascending: false }).limit(300); if(!r.error) rows = r.data; }catch(e){}
  if(!rows) return null;
  rows = rows.filter(p => p.conquista && !p.oculto && !(window.CK_EQUIPE && window.CK_EQUIPE.has(p.user_id)));
  return { rows, mulheres: new Set(rows.map(p => p.user_id)).size };
}
function vitoriasPinta(){
  const box = $("t-juntas"), alvo = box && (box.querySelector(".cm-pdia") || box.querySelector(".cm-atal") || $("cm-nova")); if(!alvo || box.querySelector(".vit-hoje")) return;
  alvo.insertAdjacentHTML("afterend", `<section class="vit-hoje" id="vit-hoje" aria-label="Vitórias de hoje"><div class="vit-h"><span class="eyebrow">Vitórias de hoje</span><small id="vit-n"></small></div><div class="hscroll vit-row" id="vit-row"><div class="vit-sk"></div><div class="vit-sk"></div><div class="vit-sk"></div></div></section>`);
  vitoriasHoje().then(V => {
    const row = $("vit-row"), n = $("vit-n"); if(!row) return;
    const minha = `<button class="vit-it vit-eu" id="vit-eu"><span class="vit-av">${ic("plus", 20, 2.4)}</span><small>Minha vitória</small></button>`;
    if(!V){ $("vit-hoje").remove(); return; }
    if(n) n.textContent = V.mulheres >= 2 ? `${int(V.mulheres)} mulheres comemoraram hoje 💚` : V.mulheres === 1 ? "A primeira vitória do dia já chegou 💚" : "Seja a primeira a comemorar hoje 💚";
    const vistos = new Set(), L = V.rows.filter(p => !vistos.has(p.user_id) && vistos.add(p.user_id)).slice(0, 20);
    row.innerHTML = minha + L.map(p => `<button class="vit-it" data-vp="${esc(p.id)}"><span class="vit-av">${avU(p.user_id, p.nome, p.foto)}<i>${esc((p.conquista && p.conquista.emoji) || "💪")}</i></span><small>${esc((p.nome || "").split(" ")[0])}</small></button>`).join("");
    $("vit-eu").onclick = () => abreComposer("💪 Minha vitória de hoje: ", null, { conquista: VIT_CONQ });
    row.querySelectorAll("[data-vp]").forEach(b => b.onclick = async () => { const p = V.rows.find(x => String(x.id) === b.dataset.vp); if(!p) return; try{ const [m] = await completaPosts([p]); abrePost(m); }catch(e){ toast("Não deu para abrir agora"); } });
  });
}
const rJuntasVit = rJuntas; rJuntas = function(){ const r = rJuntasVit.apply(this, arguments); try{ setTimeout(vitoriasPinta, 50); }catch(e){ console.warn(e); } return r; };

/* ---------- Compartilhar minha vitória (fim do treino) ---------- */
const fimTreinoVit = fimTreino;
fimTreino = function(parcial){
  const T = PL && PL.T, r = fimTreinoVit.apply(this, arguments);
  try{
    const b = $("fim-post"); if(b && !parcial && T){ const ult = (ME.treinos || [])[ME.treinos.length - 1] || {};
      b.innerHTML = `${ic("people", 18)} Compartilhar minha vitória`; b.classList.add("btn-vit");
      b.onclick = async () => { b.classList.add("carregando"); b.disabled = true; let blob = null;
        try{ blob = await comprimeImg(await blobParaURL(await cartaoConquista({ T, min: ult.min || 1, kcal: ult.kcal || 0, dias: streak(), nome: (ME.nome || "").split(" ")[0], parcial: false })), 1080); }catch(e){}
        fimPlay(); tab("juntas"); setTimeout(() => abreComposer(`💪 Treino concluído: ${T.nome} em ${ult.min || 1} min!`, blob, { conquista: { emoji: "💪", titulo: "TREINO CONCLUÍDO", frase: `${T.nome} · ${ult.min || 1} min`, k: "treino" } }), 350); };
    }
  }catch(e){ console.warn(e); }
  return r;
};

/* ---------- Parceira CK ---------- */
let PARC = null;
const PARC_FR = ["Bora treinar hoje? Tô contigo 💚", "Orgulho de você! Continua 💪", "Pouco ainda conta. 5 minutinhos? 💚", "Sentindo sua falta no treino. Bora juntas?", "Você consegue! Tô torcendo por você ✨", "Hoje é dia de cuidar de você 💚"];
async function parcStatus(){ if(!SO.on()) return PARC = null; try{ const r = await SB().rpc("parceira_status"); if(!r.error) PARC = r.data; }catch(e){} return PARC; }
const parcAv = o => `<span class="parc-av">${avU(o.user_id, o.nome, o.foto)}</span>`;
async function parceiraTela(){
  if(!SO.on()) return toast("A comunidade precisa estar ativa para ter uma Parceira CK");
  sheet("Parceira CK", `<div class="parc" id="parc"><p class="muted">Carregando…</p></div>`);
  const s = await parcStatus(), box = $("parc"); if(!box) return;
  if(!s){ box.innerHTML = `<p class="muted">Não deu para carregar agora. Tente de novo em instantes.</p>`; return; }
  if(s.status === "ativa"){
    const o = s.outra || {};
    box.innerHTML = `<div class="parc-top">${parcAv(o)}<div><span class="eyebrow">Sua Parceira CK</span><b>${esc(o.nome || "")}</b><small class="muted">@${esc(o.username || "")}</small></div></div>
      <div class="parc-sem"><div><b class="num">${int(s.semana_ela)}</b><small>${s.semana_ela === 1 ? "dia" : "dias"} com treino dela essa semana</small></div><div><b class="num">${int(s.semana_eu)}</b><small>${s.semana_eu === 1 ? "dia" : "dias"} com treino seu essa semana</small></div></div>
      <p class="hint" style="margin:0">Vocês veem só quantos dias cada uma treinou na semana. Nada de peso, ciclo ou detalhes.</p>
      <div class="parc-inc"><b>${s.incentivo_hoje ? "Incentivo de hoje enviado 💚" : "Mandar um incentivo (1 por dia)"}</b>${s.incentivo_hoje ? "" : `<div class="parc-fr">${PARC_FR.map((f, i) => `<button class="chip" data-pf="${i + 1}">${esc(f)}</button>`).join("")}</div>`}</div>
      <div class="parc-bts"><button class="btn btn-line btn-sm" id="parc-perfil">Ver perfil</button><button class="link" id="parc-fim">Encerrar parceria</button></div>`;
    box.querySelectorAll("[data-pf]").forEach(b => b.onclick = async () => { try{ const r = await SB().rpc("parceira_incentivar", { p_frase: +b.dataset.pf }); if(r.error) throw r.error; SOM.check && SOM.check(); vibra([20, 30, 20]); toast("Incentivo enviado 💚"); parceiraTela(); }catch(e){ toast(e.message || "Não deu agora"); } });
    $("parc-perfil").onclick = () => { fecharSheet(); abrirPerfil(o.user_id); };
    $("parc-fim").onclick = () => { if(!confirm("Encerrar a parceria? Vocês continuam amigas e seguindo uma à outra.")) return; SB().rpc("parceira_encerrar", { p_id: s.id }).then(() => { toast("Parceria encerrada"); PARC = null; parceiraTela(); missaoPinta && missaoPinta(true); }); };
    return;
  }
  const conv = (s.convites || []).map(c => `<div class="parc-conv">${parcAv(c.de)}<div><b>${esc(c.de.nome || "")}</b><small>quer ser sua Parceira CK</small></div><button class="btn btn-accent btn-sm" data-pa="${c.id}">Aceitar</button><button class="iconbtn sm" data-pr="${c.id}" aria-label="Recusar">${ic("close", 14)}</button></div>`).join("");
  box.innerHTML = `<div class="parc-hero"><i>🤝</i><h3>Treinar com uma amiga é mais fácil</h3><p>Escolha uma amiga para se apoiarem na semana. Vocês veem só <b>quantos dias</b> cada uma treinou e podem mandar 1 incentivo por dia. Sem cobrança, sem comparação. Dá para encerrar quando quiser.</p></div>
    ${conv ? `<div class="nb-sec">Convites para você</div>${conv}` : ""}
    ${s.enviado ? `<div class="parc-conv">${parcAv(s.enviado.para)}<div><b>${esc(s.enviado.para.nome || "")}</b><small>convite enviado, esperando resposta</small></div><button class="link" id="parc-canc">Cancelar</button></div>` : `<div class="nb-sec">Convidar uma amiga</div><div id="parc-amigas"><p class="muted">Carregando amigas…</p></div>`}`;
  box.querySelectorAll("[data-pa]").forEach(b => b.onclick = async () => { try{ const r = await SB().rpc("parceira_responder", { p_id: b.dataset.pa, p_aceita: true }); if(r.error) throw r.error; SOM.done && SOM.done(); toast("Agora vocês são Parceiras CK 💚"); parceiraTela(); }catch(e){ toast(e.message || "Não deu agora"); } });
  box.querySelectorAll("[data-pr]").forEach(b => b.onclick = async () => { await SB().rpc("parceira_responder", { p_id: b.dataset.pr, p_aceita: false }); parceiraTela(); });
  const cc = $("parc-canc"); if(cc) cc.onclick = async () => { await SB().rpc("parceira_encerrar", { p_id: s.enviado.id }); toast("Convite cancelado"); parceiraTela(); };
  const am = $("parc-amigas"); if(am) try{ const r = await SB().rpc("parceira_amigas"); const L = (!r.error && r.data) || [];
    am.innerHTML = L.length ? L.map(a => `<div class="parc-conv">${parcAv(a)}<div><b>${esc(a.nome || "")}</b><small>@${esc(a.username || "")}</small></div><button class="btn btn-line btn-sm" data-pc="${a.user_id}">Convidar</button></div>`).join("")
      : `<p class="muted">Para convidar, vocês precisam se seguir. Siga uma amiga na Comunidade e peça para ela te seguir de volta 💚</p>`;
    am.querySelectorAll("[data-pc]").forEach(b => b.onclick = async () => { b.disabled = true; try{ const r = await SB().rpc("parceira_convidar", { p_user: b.dataset.pc }); if(r.error) throw r.error; toast("Convite enviado 💚"); parceiraTela(); }catch(e){ b.disabled = false; toast(e.message || "Não deu agora"); } }); }catch(e){ am.innerHTML = `<p class="muted">Não deu para carregar agora.</p>`; }
}
const rPerfilParc = rPerfil; rPerfil = function(){ const r = rPerfilParc.apply(this, arguments); try{
  const ref = $("p-coach") || $("p-push"); if(ref && !$("p-parc")){ ref.insertAdjacentHTML("afterend", setRow("p-parc", "people", "Parceira CK", PARC && PARC.status === "ativa" ? `Com ${esc((PARC.outra && PARC.outra.nome || "").split(" ")[0])} 💚` : "Treine junto com uma amiga (opcional)")); $("p-parc").onclick = parceiraTela; } }catch(e){ console.warn(e); } return r; };
/* linha da parceira no cartão de missões do Início */
const missaoCardParc = missaoCardHTML;
missaoCardHTML = function(){ let h = missaoCardParc.apply(this, arguments);
  if(PARC && PARC.status === "ativa" && PARC.outra){ const o = PARC.outra, nm = esc((o.nome || "").split(" ")[0]);
    h = h.replace(/<\/section>\s*$/, `<div class="mis-parc">${parcAv(o)}<span><b>${nm}</b>, sua Parceira CK, treinou <b>${int(PARC.semana_ela)} ${PARC.semana_ela === 1 ? "dia" : "dias"}</b> essa semana.</span><button class="btn mis-b2" data-mi="parc">${PARC.incentivo_hoje ? "Ver" : "Incentivar"}</button></div></section>`); }
  return h; };
const missaoAcaoParc = missaoAcao; missaoAcao = function(k){ if(k === "parc") return parceiraTela(); return missaoAcaoParc.apply(this, arguments); };
const abrirAppParc = abrirApp; abrirApp = function(){ const r = abrirAppParc.apply(this, arguments); setTimeout(() => { parcStatus().then(() => { if(TAB === "inicio" && typeof missaoPinta === "function") missaoPinta(true); }); }, 5000); return r; };

/* ---------- PRO refinado + Seus insights ---------- */
function proVisual(){ const on = typeof pagou === "function" && pagou(); document.body.classList.toggle("ck-pro", !!on); }
setInterval(proVisual, 4000); setTimeout(proVisual, 1500);
const DSEM_NOME = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
function insights(){
  const T = (ME.treinos || []).filter(t => t.d), I = [];
  if(T.length < 3) return { I, poucos: true };
  const hs = T.filter(t => t.h != null).map(t => +t.h);
  if(hs.length >= 3){ const per = { manhã: hs.filter(h => h < 12).length, tarde: hs.filter(h => h >= 12 && h < 18).length, noite: hs.filter(h => h >= 18).length }, top = Object.entries(per).sort((a, b) => b[1] - a[1])[0];
    I.push(["⏰", "Seu melhor horário", `Você treina mais de ${top[0]}. Que tal deixar o lembrete nesse horário?`, 0]); }
  const dw = [0, 0, 0, 0, 0, 0, 0]; [...new Set(T.map(t => t.d))].forEach(d => dw[new Date(d + "T12:00").getDay()]++); const di = dw.indexOf(Math.max(...dw));
  I.push(["📅", "Seu dia mais constante", `${DSEM_NOME[di].charAt(0).toUpperCase() + DSEM_NOME[di].slice(1)} é o dia em que você mais aparece por você.`, 0]);
  const soma = (a, b) => T.filter(t => t.d >= addD(today(), -b) && t.d < addD(today(), -a)).reduce((x, t) => x + (t.min || 0), 0), m1 = soma(0, 28), m0 = soma(28, 56);
  if(m1 && m0){ const p = Math.round(100 * (m1 - m0) / m0); I.push(["📈", "Seu ritmo no mês", p >= 5 ? `${p}% mais minutos que nos 28 dias anteriores. Você está crescendo no seu ritmo.` : p <= -5 ? "Um mês mais leve que o anterior. Tudo bem: o importante é continuar." : "Ritmo parecido com o mês anterior. Constância é isso.", 1]); }
  const meta = metas(ME).agua; let ag = 0; for(let i = 0; i < 7; i++){ const x = (ME.diario || {})[addD(today(), -i)]; if(x && (x.agua || 0) >= meta) ag++; }
  I.push(["💧", "Hidratação", ag ? `Você bateu a meta de água em ${ag} dos últimos 7 dias.` : "A semana teve pouca água. Um copo agora já é um bom começo.", 1]);
  const fav = Object.entries(T.reduce((o, t) => (o[t.nome] = (o[t.nome] || 0) + 1, o), {})).sort((a, b) => b[1] - a[1])[0];
  if(fav && fav[1] >= 2) I.push(["💚", "Seu treino favorito", `${fav[0]}: você já fez ${fav[1]} vezes.`, 1]);
  const rec = recordeSeq(); if(rec >= 3) I.push(["🔥", "Sua maior sequência", `${rec} dias seguidos. Você já provou que consegue.`, 1]);
  const comMin = T.filter(t => t.min > 0); if(comMin.length >= 5){ const fx = [[0, 14, "até 15 minutos"], [15, 19, "15 a 20 minutos"], [20, 30, "20 a 30 minutos"], [31, 999, "mais de 30 minutos"]].map(([a, b, n]) => [n, comMin.filter(t => t.min >= a && t.min <= b).length]).sort((a, b) => b[1] - a[1])[0];
    if(fx[1] / comMin.length >= .5) I.push(["⏱️", "O tamanho que encaixa", `Treinos de ${fx[0]} parecem encaixar melhor na sua rotina.`, 1]); }
  const dw2 = dw.map((n, i) => [i, n]).sort((a, b) => b[1] - a[1]); if(dw2[1] && dw2[1][1] >= 2 && dw2[0][1] >= 2) I.push(["🗓️", "Seus dias de constância", `Você costuma manter mais constância às ${DSEM_NOME[Math.min(dw2[0][0], dw2[1][0])]}s e ${DSEM_NOME[Math.max(dw2[0][0], dw2[1][0])]}s.`.replace("sábados", "sábados").replace("domingos", "domingos"), 1]);
  const vd = (ME.coach && ME.coach.voltasD) || []; if(vd.length && vd.some(d => { const pr = T.filter(t => t.d >= d).sort((a, b) => a.d.localeCompare(b.d))[0]; return pr && /^(c|q)-/.test(pr.rapido || ""); })) I.push(["🌱", "O que te ajuda a voltar", "Treinos rápidos ajudaram você a voltar.", 1]);
  return { I, poucos: false };
}
function insightsHTML(){
  const { I, poucos } = insights(), pro = typeof pode === "function" ? pode("graficos_avancados") : false;
  if(poucos || !I.length || !modOn("insights")) return `<section class="ins-ini" id="ins-ini" hidden></section>`;
  const livres = I.filter(x => !x[3]), extras = I.filter(x => x[3]), mostra = pro ? I : livres;
  return `<section class="ins-ini ${pro ? "pro" : ""}" id="ins-ini"><div class="ins-h"><span class="eyebrow">O CK Life aprendeu sobre você</span>${pro ? `<span class="ins-pro">PRO</span>` : ""}</div>
    ${mostra.map(([e, t, x]) => `<div class="ins-it"><i>${e}</i><div><b>${esc(t)}</b><p>${esc(x)}</p></div></div>`).join("")}
    ${!pro && extras.length ? `<button class="link ins-mais" id="ins-mais">Mais ${extras.length} insights no CK Life PRO</button>` : ""}</section>`;
}
const missaoPintaIns = missaoPinta;
missaoPinta = function(forca){ const r = missaoPintaIns.apply(this, arguments);
  try{ const mi = $("mis-ini"); if(!mi) return r; const v = $("ins-ini"), tmp = document.createElement("div"); tmp.innerHTML = insightsHTML(); const n = tmp.firstElementChild;
    if(v && v.innerHTML === n.innerHTML){ if(v.previousElementSibling !== mi) mi.after(v); } else { if(v) v.replaceWith(n); else mi.after(n); }
    const b = $("ins-mais"); if(b) b.onclick = () => paywall("insights"); }catch(e){ console.warn(e); }
  return r; };

/* "Compartilhar minha vitória" no recado da Coach já abre a postagem marcada como vitória */
const coachAcaoVit = coachAcao; coachAcao = function(k){ if(k === "comp"){ SOM.tap && SOM.tap(); tab("juntas"); const u = (ME.treinos || [])[ME.treinos.length - 1];
  return setTimeout(() => abreComposer(u && u.d === today() ? `💪 Treino de hoje feito: ${u.nome}${u.min ? ` em ${u.min} min` : ""}!` : "💪 Minha vitória de hoje: ", null, { conquista: VIT_CONQ }), 350); }
  return coachAcaoVit.apply(this, arguments); };
