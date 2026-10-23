/* ===================== Painel · CENTRAL DE NOTIFICAÇÕES =====================
   Cria, agenda e envia avisos para o celular das alunas (Web Push) e para a lista de notificações do app.
   Tudo é conferido no banco (admin_pode('notificacoes')); números vêm do envio real, nada é estimado. */
AIC.notificacoes = '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21h4"/><path d="M19.5 3.5 21 2M21 7h1.5"/>';
SECOES.push(["notificacoes", "Central de Notificações"]);
const NT_ST = { rascunho: ["Rascunho", "off"], agendada: ["Agendada", "warn"], enviando: ["Enviando", "warn"], enviada: ["Enviada", "ok"], cancelada: ["Cancelada", "off"], erro: ["Com erro", "bad"] };
const NT_PUB = [["todas", "Todas as usuárias"], ["pro", "Assinantes Pro (pagantes)"], ["trial", "Em teste grátis do Pro"], ["free", "Plano grátis"], ["ativas", "Ativas nos últimos X dias"], ["inativas", "Sem abrir o app há X dias"], ["sem_treino", "Sem treinar há X dias"], ["novas", "Cadastradas nos últimos X dias"], ["grupo", "Membros de um grupo"], ["cidade", "De uma cidade"], ["especificas", "Pessoas específicas (e-mails)"]];
const NT_ACAO = [["", "Abrir o app"], ["/?ir=treinar", "Treinos"], ["/?ir=dieta", "Nutrição"], ["/?ir=juntas", "Comunidade"], ["/?ir=explorar", "Explorar"], ["/?ir=perfil", "Perfil"], ["ext", "Link externo (https://)"]];
let NTF = "todas", NT_CACHE = null;
const pubTxt = p => { p = p || {}; const n = (NT_PUB.find(x => x[0] === p.tipo) || [, "Todas"])[1]; return n.replace("X dias", (p.dias || 7) + " dias") + (p.tipo === "cidade" ? ": " + cidNome(p.cidade) : p.tipo === "especificas" ? ` (${(p.emails || []).length})` : ""); };
const dtH = s => s ? new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";
async function vNotificacoes(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Central de Notificações</h1><p class="muted">Avisos que chegam no celular das alunas e ficam na lista de notificações do app.</p></div><button class="btn btn-accent needs-edit" id="nt-new">${aic("notificacoes", 16)} Nova notificação</button></div>
    <div class="grid g4" id="nt-kpi">${[1, 2, 3, 4].map(() => `<div class="kpi"><div class="skel" style="height:12px;width:50%"></div><div class="skel" style="height:26px;width:40%;margin-top:12px"></div></div>`).join("")}</div>
    <div class="chips scroll seg-sub" id="nt-f">${[["todas", "Todas"], ["agendada", "Agendadas"], ["enviada", "Enviadas"], ["rascunho", "Rascunhos"], ["erro", "Com erro"]].map(([k, n]) => `<button class="chip" data-f="${k}" aria-pressed="${NTF === k}">${n}</button>`).join("")}</div>
    <div id="nt-b"><div class="card"><div class="skel" style="height:14px;width:70%"></div><div class="skel" style="height:14px;width:45%;margin-top:10px"></div></div></div>
    <p class="hint nt-nota"><b>Como ler os números:</b> Público = pessoas que se encaixam no filtro. Com aviso ligado = quem ativou notificações no celular. Enviadas = aceitas pelo serviço de push (Google/Apple/Mozilla). Recebidas = aparelhos que confirmaram a chegada (alguns celulares com economia de bateria não confirmam). Toques = quem abriu pelo aviso.</p>`;
  const nw = $("nt-new"); if(nw) nw.onclick = () => formNotif();
  $("nt-f").querySelectorAll("[data-f]").forEach(b => b.onclick = () => { NTF = b.dataset.f; vNotificacoes(); });
  if(!SB2()) return $("nt-b").innerHTML = `<div class="card adm-vazio"><b>Funciona no app oficial, com o banco conectado.</b></div>`;
  let L = [], R = null, cfg = null;
  try{ [L, R] = await Promise.all([sq(SB2().from("notif_campanhas").select("*").order("criado", { ascending: false }).limit(200)), SB2().rpc("admin_painel_resumo").then(r => r.data).catch(() => null)]); }
  catch(e){ return $("nt-b").innerHTML = semBanco(e).replace("seguranca.sql", "central.sql"); }
  try{ cfg = await (await fetch("/api/push")).json(); }catch(e){}
  NT_CACHE = L; if(SEC !== "notificacoes") return;
  const mes = L.filter(n => n.enviado_em && new Date(n.enviado_em) > new Date(Date.now() - 30 * 864e5));
  $("nt-kpi").innerHTML = kpi("Enviadas em 30 dias", int(mes.length), `${int(mes.reduce((s, n) => s + (n.enviados || 0), 0))} entregas ao serviço de push`, "notificacoes", 1)
    + kpi("Agendadas", int(L.filter(n => n.status === "agendada").length), "saem sozinhas no horário")
    + kpi("Com aviso ligado", R ? int(R.push_inscritas) : "-", "alunas que ativaram no celular")
    + kpi("Lembretes de treino", R ? int(R.lembretes_ativos) : "-", "ativos, 20 min antes do treino");
  const alertas = [];
  if(cfg && !cfg.configurado) alertas.push("O envio para o celular não está configurado na Vercel (VAPID_PRIVATE).");
  if(R && R.cron === false) alertas.push("O agendador do banco (Cron) ainda não está ativo: notificações agendadas e lembretes de treino só saem depois de ativar. Em Supabase: Integrations → Cron → Enable, e rode o central.sql de novo.");
  const V = L.filter(n => NTF === "todas" || n.status === NTF);
  $("nt-b").innerHTML = (alertas.length ? `<div class="msg msg-warn">${alertas.map(esc).join("<br>")}</div>` : "") + (V.length ? `<div class="nt-list">${V.map(n => { const [st, k] = NT_ST[n.status] || [n.status, "off"]; return `<div class="nt-row">
      <div class="nt-main"><div class="nt-top"><span class="st ${k}">${st}</span><small class="muted">${n.status === "agendada" ? "Sai em " + dtH(n.enviar_em) : n.enviado_em ? "Enviada em " + dtH(n.enviado_em) : "Criada em " + dtH(n.criado)}</small></div>
        <b>${esc(n.titulo)}</b><p>${esc(n.mensagem)}</p><small class="muted">${aic("alunos", 13)} ${esc(pubTxt(n.publico))}${n.link ? " · abre " + esc((NT_ACAO.find(a => a[0] === n.link) || [, n.link])[1]) : ""}</small>
        ${n.erro ? `<small class="nt-err">${esc(n.erro)}</small>` : ""}</div>
      ${n.alvo != null ? `<div class="nt-nums"><span><b class="num">${int(n.alvo)}</b>público</span><span><b class="num">${int(n.inscritos || 0)}</b>com aviso</span><span><b class="num">${int(n.enviados)}</b>enviadas</span><span><b class="num">${int(n.recebidos)}</b>recebidas</span><span><b class="num">${int(n.cliques)}</b>toques</span>${n.falhas ? `<span class="bad"><b class="num">${int(n.falhas)}</b>falhas</span>` : ""}</div>` : ""}
      <div class="acts needs-edit">${["rascunho", "agendada"].includes(n.status) ? `<button class="btn btn-accent btn-sm" data-go="${n.id}">Enviar agora</button><button class="btn btn-line btn-sm" data-ed="${n.id}">Editar</button><button class="btn btn-line btn-sm" data-cc="${n.id}">Cancelar</button>` : `<button class="btn btn-line btn-sm" data-dup="${n.id}">Usar como modelo</button>`}</div></div>`; }).join("")}</div>`
    : `<div class="card adm-vazio"><span>${aic("notificacoes", 28)}</span><b>${NTF === "todas" ? "Nenhuma notificação ainda" : "Nada por aqui"}</b><p class="muted">Crie um aviso para todas as alunas ou para um público específico.</p></div>`);
  const ach = id => L.find(n => n.id === id);
  $("nt-b").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formNotif(ach(b.dataset.ed)));
  $("nt-b").querySelectorAll("[data-dup]").forEach(b => b.onclick = () => { const n = ach(b.dataset.dup); formNotif({ titulo: n.titulo, mensagem: n.mensagem, imagem: n.imagem, link: n.link, publico: n.publico }); });
  $("nt-b").querySelectorAll("[data-cc]").forEach(b => b.onclick = () => confirmar("Cancelar esta notificação? Ela não será enviada.", async () => { try{ await sq(SB2().from("notif_campanhas").update({ status: "cancelada" }).eq("id", b.dataset.cc)); toast("Notificação cancelada"); vNotificacoes(); }catch(e){ toast(e.message || "Não deu para cancelar"); } }));
  $("nt-b").querySelectorAll("[data-go]").forEach(b => b.onclick = () => enviaAgora(ach(b.dataset.go)));
}
async function enviaAgora(n){
  let pv = null; try{ pv = (await SB2().rpc("admin_notif_previa", { p: n.publico })).data; }catch(e){}
  confirmar(`Enviar "${n.titulo}" agora para ${pv ? int(pv.alvo) + " pessoa(s)" : "o público escolhido"}${pv ? ` (${int(pv.inscritas)} com aviso no celular)` : ""}? Depois de enviada, não dá para desfazer.`, async () => {
    toast("Enviando…"); try{ const r = await SB2().rpc("admin_notif_enviar_agora", { p_id: n.id }); if(r.error) throw r.error; toast(`Enviada para ${int(r.data.alvo)} pessoa(s)`); }catch(e){ toast("Não deu para enviar: " + (e.message || "erro")); } vNotificacoes(); });
}
/* imagem da notificação: até 1200 px de largura, proporção mantida (ideal 2:1) */
async function imgNotif(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use JPG, PNG ou WebP."); if(file.size > 10 * 1024 * 1024) throw new Error("Imagem muito grande (máximo 10 MB).");
  const b = await createImageBitmap(file), w = Math.min(1200, b.width), h = Math.round(w * b.height / b.width), cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(b, 0, 0, w, h);
  return new Promise(ok => cv.toBlob(ok, "image/jpeg", .84));
}
async function formNotif(n){
  n = n || { titulo: "", mensagem: "", link: "", publico: { tipo: "todas" } }; const P = { tipo: "todas", dias: 7, ...(n.publico || {}) }; let img = n.imagem || "", novaImg = null;
  let grupos = []; try{ grupos = await sq(SB2().from("grupos").select("id,nome,emoji").eq("ativo", true).order("ordem")); }catch(e){}
  const acao = NT_ACAO.some(a => a[0] === (n.link || "")) ? (n.link || "") : "ext";
  const local = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 16); };
  modal(n.id ? "Editar notificação" : "Nova notificação", `<div class="ad-form"><div class="formgrid">
    <div class="field full"><label for="nf-t">Título <small class="muted" id="nf-tc"></small></label><input class="input" id="nf-t" maxlength="65" value="${esc(n.titulo)}" placeholder="Ex.: Novo treino de glúteos liberado"></div>
    <div class="field full"><label for="nf-m">Mensagem <small class="muted" id="nf-mc"></small></label><textarea class="input" id="nf-m" maxlength="240" placeholder="Curta e direta. Ex.: São 20 minutos, dá para fazer em casa.">${esc(n.mensagem)}</textarea></div>
    <div class="field full"><label>Imagem (opcional)</label><div class="ad-up"><input type="file" id="nf-file" accept="image/jpeg,image/png,image/webp" hidden><button type="button" class="btn btn-line btn-sm" id="nf-pick">Escolher imagem</button><button type="button" class="btn btn-line btn-sm" id="nf-rm" ${img ? "" : "hidden"}>Remover</button><span class="hint">Aparece no Android e no computador. Ideal 2:1 (ex.: 1200×600).</span></div></div>
    <div class="field"><label for="nf-a">Ao tocar, abre</label><select class="input" id="nf-a">${NT_ACAO.map(([k, t]) => `<option value="${k}" ${acao === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="field" id="nf-lw" ${acao === "ext" ? "" : "hidden"}><label for="nf-l">Link</label><input class="input" id="nf-l" value="${acao === "ext" ? esc(n.link || "") : ""}" placeholder="https://"></div>
    <div class="field full"><label for="nf-p">Público</label><select class="input" id="nf-p">${NT_PUB.map(([k, t]) => `<option value="${k}" ${P.tipo === k ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    <div class="field nf-x" data-x="dias"><label for="nf-d">Quantos dias (X)</label><input class="input num" id="nf-d" type="number" min="1" max="365" value="${esc(P.dias || 7)}"></div>
    <div class="field nf-x" data-x="grupo"><label for="nf-g">Grupo</label><select class="input" id="nf-g">${grupos.map(g => `<option value="${g.id}" ${P.grupo === g.id ? "selected" : ""}>${esc((g.emoji || "") + " " + g.nome)}</option>`).join("") || `<option value="">Nenhum grupo</option>`}</select></div>
    <div class="field nf-x" data-x="cidade"><label for="nf-c">Cidade</label><select class="input" id="nf-c">${optCid(P.cidade)}</select></div>
    <div class="field full nf-x" data-x="especificas"><label for="nf-e">E-mails (um por linha)</label><textarea class="input" id="nf-e" placeholder="aluna@email.com">${esc((P.emails || []).join("\n"))}</textarea></div>
    <div class="field full"><div class="nf-alvo" id="nf-alvo">Calculando público…</div></div>
    <div class="field full"><label>Quando</label><div class="seg-pills" id="nf-q"><button type="button" class="chip" data-q="agora" aria-pressed="${!n.enviar_em}">Enviar agora</button><button type="button" class="chip" data-q="agendar" aria-pressed="${!!n.enviar_em}">Agendar</button></div></div>
    <div class="field" id="nf-hw" ${n.enviar_em ? "" : "hidden"}><label for="nf-h">Data e horário</label><input class="input" id="nf-h" type="datetime-local" value="${local(n.enviar_em ? new Date(n.enviar_em) : new Date(Date.now() + 36e5))}"></div>
  </div><aside class="ad-prev"><span class="eyebrow">Prévia no celular</span><div class="nf-phone"><div class="nf-not" id="nf-prev"></div></div><small class="hint">A aparência final depende do celular. No iPhone o aviso só chega com o CK Life instalado na tela de início.</small></aside></div>
  <div id="nf-msg"></div><div class="toolbar" style="justify-content:space-between"><button class="btn btn-line" id="nf-rasc">Salvar rascunho</button><button class="btn btn-accent" id="nf-ok">Continuar</button></div>`);
  $("mbox").classList.add("mbox-wide");
  let quando = n.enviar_em ? "agendar" : "agora";
  const pub = () => { const t = val("nf-p"), p = { tipo: t }; if(["ativas", "inativas", "sem_treino", "novas"].includes(t)) p.dias = Math.max(1, Math.min(365, +val("nf-d") || 7)); if(t === "grupo") p.grupo = val("nf-g"); if(t === "cidade") p.cidade = val("nf-c"); if(t === "especificas") p.emails = val("nf-e").split(/[\s,;]+/).map(x => x.trim().toLowerCase()).filter(x => /@/.test(x)).slice(0, 500); return p; };
  const prev = () => { const im = novaImg ? URL.createObjectURL(novaImg) : img;
    $("nf-prev").innerHTML = `<div class="nf-nh"><img src="img/icone-192.png" alt=""><b>CK Life</b><small>agora</small></div><b class="nf-nt">${esc(val("nf-t") || "Título da notificação")}</b><p>${esc(val("nf-m") || "Sua mensagem aparece aqui.")}</p>${im ? `<img class="nf-img" src="${esc(im)}" alt="">` : ""}`;
    $("nf-tc").textContent = `${val("nf-t").length}/65`; $("nf-mc").textContent = `${val("nf-m").length}/240`; };
  let tp; const conta = () => { clearTimeout(tp); tp = setTimeout(async () => { const p = pub(); $("mbox").querySelectorAll(".nf-x").forEach(e => { const x = e.dataset.x; e.hidden = !(x === p.tipo || (x === "dias" && "dias" in p)); });
    try{ const r = await SB2().rpc("admin_notif_previa", { p }); const d = r.data; $("nf-alvo").innerHTML = d ? `${aic("alunos", 16)} <b class="num">${int(d.alvo)}</b> pessoa(s) neste público · <b class="num">${int(d.inscritas)}</b> com aviso ligado no celular` : "Sem permissão para ver o público."; }
    catch(e){ $("nf-alvo").textContent = "Não foi possível calcular o público agora."; } }, 300); };
  ["nf-t", "nf-m"].forEach(id => $(id).addEventListener("input", prev));
  ["nf-p", "nf-d", "nf-g", "nf-c", "nf-e"].forEach(id => $(id).addEventListener("input", conta)); $("nf-p").addEventListener("change", conta);
  $("nf-a").onchange = () => { $("nf-lw").hidden = val("nf-a") !== "ext"; };
  $("nf-q").querySelectorAll("[data-q]").forEach(b => b.onclick = () => { quando = b.dataset.q; $("nf-q").querySelectorAll("[data-q]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("nf-hw").hidden = quando !== "agendar"; $("nf-ok").textContent = quando === "agora" ? "Continuar" : "Agendar envio"; });
  $("nf-ok").textContent = quando === "agora" ? "Continuar" : "Agendar envio";
  $("nf-pick").onclick = () => $("nf-file").click();
  $("nf-file").onchange = async e => { const f = e.target.files[0]; e.target.value = ""; if(!f) return; try{ novaImg = await imgNotif(f); $("nf-rm").hidden = false; prev(); }catch(er){ $("nf-msg").innerHTML = `<div class="msg msg-bad">${esc(er.message)}</div>`; } };
  $("nf-rm").onclick = () => { img = ""; novaImg = null; $("nf-rm").hidden = true; prev(); };
  prev(); conta();
  const salva = async status => {
    const a = val("nf-a"), link = a === "ext" ? val("nf-l") : a, p = pub();
    const err = !val("nf-t") ? "Escreva o título." : !val("nf-m") ? "Escreva a mensagem." : a === "ext" && !/^https:\/\/[\w.-]+\.\w+/.test(link) ? "O link externo precisa começar com https://" : p.tipo === "especificas" && !p.emails.length ? "Informe pelo menos um e-mail." : p.tipo === "grupo" && !p.grupo ? "Escolha o grupo." : p.tipo === "cidade" && !p.cidade ? "Escolha a cidade." : "";
    if(err){ $("nf-msg").innerHTML = `<div class="msg msg-bad">${err}</div>`; return null; }
    let enviar_em = null; if(status === "agendada"){ const h = new Date(val("nf-h")); if(isNaN(h) || h < new Date(Date.now() - 6e4)) { $("nf-msg").innerHTML = `<div class="msg msg-bad">Escolha uma data e horário no futuro.</div>`; return null; } enviar_em = h.toISOString(); }
    if(novaImg){ try{ img = await sobeAnuncio("notif", novaImg, "jpg", "image/jpeg"); novaImg = null; }catch(e){ $("nf-msg").innerHTML = `<div class="msg msg-bad">Não deu para enviar a imagem: ${esc(e.message || "")}</div>`; return null; } }
    const d = { titulo: val("nf-t"), mensagem: val("nf-m"), imagem: img || null, link: link || null, publico: p, status, enviar_em };
    try{ const r = n.id ? await sq(SB2().from("notif_campanhas").update(d).eq("id", n.id).select()) : await sq(SB2().from("notif_campanhas").insert(d).select()); return r[0]; }
    catch(e){ $("nf-msg").innerHTML = `<div class="msg msg-bad">${esc(e.message || "Não foi possível salvar")}</div>`; return null; }
  };
  $("nf-rasc").onclick = async () => { const r = await salva("rascunho"); if(r){ fechar(); toast("Rascunho salvo"); vNotificacoes(); } };
  $("nf-ok").onclick = async () => { const bt = $("nf-ok"); bt.disabled = true; const r = await salva(quando === "agendar" ? "agendada" : "rascunho"); bt.disabled = false; if(!r) return;
    fechar(); if(quando === "agendar"){ toast("Notificação agendada para " + dtH(r.enviar_em)); vNotificacoes(); } else enviaAgora(r); };
}
VIEWS.notificacoes = vNotificacoes;
