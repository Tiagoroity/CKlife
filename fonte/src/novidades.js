
/* ===================== NOVIDADES =====================
   Grupos da comunidade, vídeos em posts e Stories, notificações no celular,
   desafios com número real de participantes, figurinhas e humor salvos na conta.
   Tudo depende do novidades.sql; sem ele, os recursos ficam escondidos ou locais, sem erro. */
const NV_OK = () => SO.on();
const GRP = new Map(); let GRP_T = 0;
const nMembras = n => n ? `${int(n)} ${n === 1 ? "membra" : "membras"}` : "Seja a primeira 💚";
async function carregaGrupos(forca){
  if(!NV_OK() || (!forca && Date.now() - GRP_T < 120000)) return [...GRP.values()];
  try{ const L = await q(SB().rpc("grupos_info")); GRP.clear(); (L || []).forEach(g => GRP.set(g.id, g)); GRP_T = Date.now(); }catch(e){}
  return [...GRP.values()];
}
/* ---------- Vídeo ---------- */
function videoValido(f, maxSeg){
  return new Promise(ok => { if(!f) return ok(null);
    if(!/^video\/(mp4|webm|quicktime)$/i.test(f.type || "")){ toast("Use vídeo MP4 ou MOV."); return ok(null); }
    if(f.size > 50 * 1024 * 1024){ toast("Vídeo muito grande (máx. 50 MB). Grave um mais curto."); return ok(null); }
    const v = document.createElement("video"), u = URL.createObjectURL(f); v.preload = "metadata"; v.muted = true;
    v.onloadedmetadata = () => { URL.revokeObjectURL(u); if(v.duration > (maxSeg || 60) + 1){ toast(`Vídeo de até ${maxSeg || 60} segundos.`); return ok(null); } ok(f); };
    v.onerror = () => { URL.revokeObjectURL(u); ok(f); }; v.src = u; });
}
async function storyVideo(f){
  const b = await videoValido(f, 30); if(!b) return;
  const u = URL.createObjectURL(b);
  sheet("Novo Story", `<div class="so-stprev priv"><video src="${u}" playsinline autoplay muted loop style="width:100%;height:100%;object-fit:cover"></video></div>
    <p class="hint">${ic("clock", 13)} Vídeo de até 30 segundos. Fica visível por 24 horas.</p><button class="btn btn-accent btn-block btn-lg" id="sv-ok">Publicar Story</button>`, () => URL.revokeObjectURL(u));
  $("sv-ok").onclick = async () => { const bt = $("sv-ok"); bt.disabled = true; bt.classList.add("carregando");
    try{ await garantePerfil(); const ext = /quicktime/.test(b.type) ? "mov" : /webm/.test(b.type) ? "webm" : "mp4";
      const midia = await sobe("story", NU.uid, b, ext, b.type || "video/mp4"); await q(SB().from("stories").insert({ user_id: NU.uid, midia, texto: null, cor: CORES_ST[0] }));
      SOM.done ? SOM.done() : SOM.check(); fecharSheet(); toast("Story publicado por 24 horas 💚"); carregaStories(); }
    catch(e){ toast(/mime|size|payload|too large|bucket/i.test(String(e && e.message)) ? "Vídeo não aceito ainda. O banco precisa da atualização de vídeos." : ERR_MSG(e)); bt.disabled = false; bt.classList.remove("carregando"); } };
}
/* vídeo do feed toca sozinho (sem som) quando aparece e pausa quando sai da tela */
const VIDOBS = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { const v = e.target; if(e.isIntersecting && v.src) v.play().catch(() => {}); else v.pause(); }), { threshold: .6 }) : null;
new MutationObserver(() => { if(VIDOBS) document.querySelectorAll(".pvid video:not([data-obs])").forEach(v => { v.dataset.obs = 1; VIDOBS.observe(v); }); }).observe(document.body, { childList: true, subtree: true });

/* ---------- Grupos ---------- */
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-grupo]"); if(!b) return; e.stopPropagation(); const g = GRP.get(b.dataset.grupo); if(g) abrirGrupo(g); }, true);
const rJuntasN = rJuntas;
rJuntas = function(){ rJuntasN.apply(this, arguments); if(!NV_OK()) return;
  carregaGrupos().then(L => { const row = $("st-row"); if(!L.length || !row || $("gr-row")) return;
    const meus = L.filter(g => g.eu), outros = L.filter(g => !g.eu);
    row.insertAdjacentHTML("afterend", `<div class="so-grupos"><div class="sec-title"><h3>Grupos</h3><button class="link" id="gr-todos">Ver todos</button></div><div class="hscroll" id="gr-row">${[...meus, ...outros].slice(0, 10).map(g => `<button class="so-gr ${g.eu ? "eu" : ""}" data-grupo="${g.id}" style="--gc:${g.cor || "#2E7D5A"}"><i>${esc(g.emoji || "💚")}</i><b>${esc(g.nome)}</b><small>${nMembras(g.membros)}</small></button>`).join("")}</div></div>`);
    $("gr-todos").onclick = todosGrupos; }); };
async function todosGrupos(){
  const L = await carregaGrupos(true);
  sheet("Grupos", `<p class="hint">Encontre mulheres com os mesmos objetivos. Você pode entrar e sair quando quiser.</p>${L.map(g => `<button class="so-gr-lin" data-grupo="${g.id}" style="--gc:${g.cor || "#2E7D5A"}"><i>${esc(g.emoji || "💚")}</i><span><b>${esc(g.nome)}</b><small>${esc(g.descricao || "")}</small><small class="num">${nMembras(g.membros)}</small></span>${g.eu ? `<em>Participando</em>` : ""}</button>`).join("") || `<div class="card empty"><p>Nenhum grupo ainda.</p></div>`}`);
}
async function abrirGrupo(g){
  sheet(g.nome, `<div class="so-gr-top" style="--gc:${g.cor || "#2E7D5A"}"><i>${esc(g.emoji || "💚")}</i><h2>${esc(g.nome)}</h2><p>${esc(g.descricao || "")}</p><small class="num">${nMembras(g.membros)}</small>
    <div class="acts">${g.eu ? `<button class="btn btn-accent" id="gr-pub">${ic("plus", 16)} Publicar no grupo</button><button class="btn btn-line" id="gr-sair">Sair</button>` : `<button class="btn btn-accent btn-lg" id="gr-entrar">Entrar no grupo</button>`}</div></div>
    <div class="feed" id="gr-feed"><div class="post skel"></div></div>`);
  const ent = $("gr-entrar"); if(ent) ent.onclick = async () => { ent.disabled = true; try{ await q(SB().from("membros_grupo").insert({ grupo_id: g.id, user_id: NU.uid })); SOM.check(); vibra(15); toast(`Bem-vinda ao grupo ${g.nome} 💚`); g.eu = true; g.membros++; abrirGrupo(g); }catch(e){ ent.disabled = false; toast(ERR_MSG(e)); } };
  const sa = $("gr-sair"); if(sa) sa.onclick = async () => { if(!confirm(`Sair do grupo ${g.nome}?`)) return; try{ await q(SB().from("membros_grupo").delete().eq("grupo_id", g.id).eq("user_id", NU.uid)); g.eu = false; g.membros = Math.max(0, g.membros - 1); abrirGrupo(g); }catch(e){ toast(ERR_MSG(e)); } };
  const pb = $("gr-pub"); if(pb) pb.onclick = () => abreComposer("", null, { grupo: g });
  let L = []; try{ L = await completaPosts(await q(SB().from("posts").select("*").eq("grupo_id", g.id).order("criado", { ascending: false }).limit(30))); }catch(e){}
  const box = $("gr-feed"); if(!box) return;
  box.innerHTML = L.length ? L.map(postHtml).join("") : `<div class="card empty"><p>${g.eu ? "Comece a conversa do grupo 💚" : "Entre no grupo para participar das conversas."}</p></div>`;
  box.querySelectorAll(".post").forEach(el => ligaPost(el, L.find(p => p.id === el.dataset.id))); ligaMidia(box);
}

/* ---------- Notificações no celular ---------- */
const VAPID = "BJ7wud6TE-eeF889qLG9sRvdppjzQvNJgifeuMN8MrTEkvSYjKbSrLvPyyxPgRJLXywLSwypDdj9RaoTQm60bCc";
const PUSH_OK = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const pwaInstalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
let SWREG = null;
if("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").then(r => { SWREG = r; }).catch(() => {});
if("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => { if(e.data && e.data.tipo === "push"){ const n = String(e.data.url || ""); if(/n=mensagem|n=story/.test(n)) tab("juntas"); else if(/n=/.test(n)) tab("juntas"); } });
const b64u = s => { const p = "=".repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...b].map(c => c.charCodeAt(0))); };
async function inscrevePush(silencioso){
  if(!PUSH_OK() || !NV_OK()) return false;
  const reg = SWREG || await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
  if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID) });
  const j = sub.toJSON(); await q(SB().from("push_inscricoes").upsert({ endpoint: j.endpoint, user_id: NU.uid, p256dh: j.keys.p256dh, auth: j.keys.auth }));
  if(!silencioso){ SOM.check(); toast("Pronto! Você vai receber avisos no celular 💚"); } return true;
}
async function ativarNotificacoes(){
  if(ehIOS() && !pwaInstalado()) return sheet("Notificações no iPhone", `<p>No iPhone, os avisos funcionam com o CK Life instalado na tela de início:</p><ol class="hint" style="line-height:1.8"><li>Toque em <b>Compartilhar</b> (quadrado com seta) no Safari.</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Abra o CK Life pelo ícone e ative os avisos aqui.</li></ol>`);
  if(!PUSH_OK()) return toast("Este navegador não recebe notificações. Use Chrome ou o app instalado.");
  if(Notification.permission === "denied") return toast("Os avisos estão bloqueados. Libere nas configurações do navegador.");
  const p = await Notification.requestPermission(); if(p !== "granted") return toast("Tudo bem! Você pode ativar depois.");
  try{ await inscrevePush(); rerender(); }catch(e){ console.warn(e); toast(XERR(e) ? "Os avisos no celular estão sendo ativados. Tente mais tarde." : "Não deu para ativar agora."); }
}
async function desativarNotificacoes(){
  try{ const reg = SWREG || await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if(sub){ await SB().from("push_inscricoes").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); } toast("Avisos no celular desligados"); rerender(); }catch(e){ toast("Não deu agora"); }
}
const pushLigado = () => PUSH_OK() && Notification.permission === "granted";
setTimeout(() => { if(pushLigado() && NV_OK()) inscrevePush(true).catch(() => {}); carregaGrupos(); }, 9000);
const rPerfilN = rPerfil;
rPerfil = function(){ rPerfilN.apply(this, arguments); const lem = $("p-lemb"); if(!lem || $("p-push")) return;
  lem.insertAdjacentHTML("beforebegin", setRow("p-push", "bell", "Avisos no celular", pushLigado() ? "Ligados: mensagens, curtidas e conquistas" : "Mensagens, comentários e conquistas", sw(pushLigado())));
  $("p-push").onclick = () => pushLigado() ? desativarNotificacoes() : ativarNotificacoes(); };

/* ---------- Desafios: participantes reais ---------- */
let DCONT = null, DCONT_T = 0;
async function contagemDesafios(){ if(!NV_OK()) return null; if(DCONT && Date.now() - DCONT_T < 120000) return DCONT; try{ DCONT = await q(SB().rpc("desafio_contagem")); DCONT_T = Date.now(); }catch(e){ DCONT = null; } return DCONT; }
const rTreinarN = rTreinar;
rTreinar = function(){ rTreinarN.apply(this, arguments);
  contagemDesafios().then(c => { if(!c) return; document.querySelectorAll("[data-des]").forEach(b => { const n = +c[b.dataset.des] || 0; if(n >= 2 && !b.querySelector(".xe-part")) b.querySelector("small").insertAdjacentHTML("afterend", `<small class="xe-part">${int(n)} mulheres participando</small>`); });
    const meu = document.querySelector(".xe-desafios .xe-des"), id = ME.desafio && !ME.desafio.fim && ME.desafio.id, n = id ? +c[id] || 0 : 0;
    if(meu && n >= 2 && !meu.querySelector(".xe-part")) meu.querySelector("small").insertAdjacentHTML("afterend", `<small class="xe-part">Você e mais ${int(n - 1)} ${n - 1 === 1 ? "mulher" : "mulheres"} neste desafio</small>`); });
  const ok = $("des-ok"); void ok; };
/* sincroniza entrada, saída e conclusão do desafio */
const desafioSync = { async entrar(id, ini){ if(!NV_OK()) return; try{ await q(SB().from("desafio_participantes").update({ saiu: true }).eq("user_id", NU.uid).is("fim", null).eq("saiu", false)); await q(SB().from("desafio_participantes").insert({ desafio: id, user_id: NU.uid, ...(ini ? { inicio: ini } : {}) })); DCONT_T = 0; }catch(e){} },
  async sair(){ if(!NV_OK()) return; try{ await q(SB().from("desafio_participantes").update({ saiu: true }).eq("user_id", NU.uid).is("fim", null).eq("saiu", false)); DCONT_T = 0; }catch(e){} },
  async fim(){ if(!NV_OK()) return; try{ await q(SB().from("desafio_participantes").update({ fim: today() }).eq("user_id", NU.uid).is("fim", null).eq("saiu", false)); }catch(e){} } };
{ let antes = null; setInterval(() => { if(!ME) return; const d = ME.desafio ? ME.desafio.id + "|" + ME.desafio.ini + "|" + (ME.desafio.fim || "") : "";
  if(antes !== null && d !== antes){ const [id, , fim] = d.split("|"); if(!d) desafioSync.sair(); else if(fim) desafioSync.fim(); else desafioSync.entrar(id); } antes = d; }, 1500); }

/* ---------- Humor do dia na conta (só a própria aluna lê) ---------- */
let HUM_SYNC = false;
const HUMset0 = HUM.set.bind(HUM);
HUM.set = v => { const antes = HUM.get(); HUMset0(v); if(!NV_OK()) return;
  Object.entries(v).forEach(([d, x]) => { const a = antes[d]; if(!a || a.h !== x.h || a.e !== x.e) SB().from("humor_diario").upsert({ user_id: NU.uid, dia: d, humor: x.h, energia: x.e || null }).then(() => {}); }); };
setTimeout(async () => { if(!NV_OK() || HUM_SYNC) return; HUM_SYNC = true;
  try{ const L = await q(SB().from("humor_diario").select("dia,humor,energia").gte("dia", addD(today(), -30))); if(!L.length) return; const H = HUM.get(); let mudou = false;
    L.forEach(r => { if(!H[r.dia]){ H[r.dia] = { h: r.humor, e: r.energia }; mudou = true; } }); if(mudou){ HUMset0(H); if(TAB === "inicio") rInicio(); } }catch(e){} }, 7000);

/* ---------- Figurinhas na conta ---------- */
let FIG_NUVEM = null;
async function figNuvem(){
  if(!NV_OK()) return []; if(FIG_NUVEM) return FIG_NUVEM;
  try{ const L = await q(SB().from("figurinhas").select("id,midia").order("criado", { ascending: false }).limit(40)); const us = await urls(L.map(x => x.midia), 3600); FIG_NUVEM = L.map((x, i) => ({ ...x, u: us[i] })).filter(x => x.u); }catch(e){ FIG_NUVEM = []; }
  return FIG_NUVEM;
}
/* sobe as figurinhas que estavam só no aparelho (uma vez) */
setTimeout(async () => { if(!NV_OK()) return; const loc = MINHAS.get(); if(!loc.length) return; const ja = await figNuvem(); if(ja.length >= 40) return;
  for(const u of loc.slice(0, 40 - ja.length)){ try{ const b = await dataBlob(u); const midia = await sobe("figurinha", NU.uid, b, "png", "image/png"); await q(SB().from("figurinhas").insert({ user_id: NU.uid, midia })); }catch(e){ if(XERR(e)) return; } }
  MINHAS.set([]); FIG_NUVEM = null; }, 12000);
const MINHAS_set0 = MINHAS.set.bind(MINHAS);
MINHAS.set = L => { const antes = MINHAS.get(); MINHAS_set0(L); if(!NV_OK()) return; const novas = L.filter(u => !antes.includes(u));
  novas.forEach(async u => { try{ const b = await dataBlob(u); const midia = await sobe("figurinha", NU.uid, b, "png", "image/png"); await q(SB().from("figurinhas").insert({ user_id: NU.uid, midia })); MINHAS_set0(MINHAS.get().filter(x => x !== u)); FIG_NUVEM = null; }catch(e){} }); };
const desenhaPainelN = desenhaPainel;
desenhaPainel = async function(c){ await desenhaPainelN.apply(this, arguments); if(PAN.aba !== "minhas" || !NV_OK()) return;
  const L = await figNuvem(); const box = document.querySelector("#fg-pan .fg-figs"); if(!box || !L.length) return;
  box.querySelector(".fg-nova").insertAdjacentHTML("afterend", L.map(x => `<button data-fn="${x.id}"><img src="${esc(x.u)}" alt="Minha figurinha"></button>`).join(""));
  box.querySelectorAll("[data-fn]").forEach(b => { const x = L.find(y => y.id === b.dataset.fn);
    b.onclick = () => { b.classList.add("pop"); vibra(10); mandaFig(c, x.u); };
    let tm; b.onpointerdown = () => { tm = setTimeout(async () => { if(!confirm("Apagar esta figurinha?")) return; try{ await q(SB().from("figurinhas").delete().eq("id", x.id)); SB().storage.from("social").remove([x.midia]); FIG_NUVEM = null; desenhaPainel(c); }catch(e){ toast(ERR_MSG(e)); } }, 650); }; b.onpointerup = b.onpointerleave = () => clearTimeout(tm); }); };

/* desafio que já estava ativo antes desta versão: registra uma vez */
setTimeout(async () => { if(!NV_OK() || !ME.desafio || ME.desafio.fim) return;
  try{ const L = await q(SB().from("desafio_participantes").select("id").eq("user_id", NU.uid).is("fim", null).eq("saiu", false)); if(!L.length) desafioSync.entrar(ME.desafio.id, ME.desafio.ini); }catch(e){} }, 10000);
