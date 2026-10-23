/* ===================== CK Life · Rede social =====================
   Perfil social, seguir, bloquear, denunciar, feed, Stories (24h), chat com foto/áudio/status,
   notificações em tempo real e conquistas. Fica dentro do app.js (mesma IIFE).
   Segurança de verdade está no banco (social.sql): RLS + bucket PRIVADO "social" + URLs temporárias.
   Aqui só existem barreiras de interface (sem botão de download, sem arrastar, sem menu de imagem). */
Object.assign(P, {
  bell:'<path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>', dots:'<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', image:'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  reply:'<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>', trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', userplus:'<circle cx="9" cy="8" r="4"/><path d="M2 21c1-4 3.5-6 7-6s6 2 7 6M19 8v6M16 11h6"/>',
  stop:'<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>', ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>'
});
// a rede social só liga depois que o social.sql existir no banco; até lá a comunidade antiga continua funcionando
let SO_PRONTO = null, SO_TESTE = null;
const SO = { on: () => !!(NU.ativo && NU.sb && NU.uid && SO_PRONTO === true) };
function detectaSocial(){
  if(!(NU.ativo && NU.sb && NU.uid)) return Promise.resolve(false);
  if(SO_TESTE) return SO_TESTE;
  SO_TESTE = NU.sb.from("perfis").select("user_id").limit(1).then(r => { SO_PRONTO = !r.error || !XERR(r.error); if(r.error && !XERR(r.error)) SO_TESTE = null; return SO_PRONTO; }, () => { SO_TESTE = null; return false; });
  return SO_TESTE;
}
const FORA = () => toast(NU.ativo ? "A rede social está sendo ativada. Volte daqui a pouco!" : "Esta parte funciona no app oficial (cklife.vercel.app).");
const SB = () => NU.sb;
async function q(p){ const r = await p; if(r.error) throw r.error; return r.data; }
const ERR_MSG = e => XERR(e) ? "A rede social está sendo ativada. Volte daqui a pouco!" : /row-level|permission|42501/i.test(String(e && (e.message || e))) ? "Você não tem permissão para isso." : "Não deu certo agora. Confira a internet e tente de novo.";

/* ---------- Mídia privada: URL temporária (assinada) só depois da autorização do banco ---------- */
const MID = new Map();
async function urls(paths, segs = 600){
  const agora = Date.now(), falta = [...new Set(paths.filter(p => p && !(MID.get(p) && MID.get(p).t > agora)))];
  if(falta.length && SO.on()){
    for(let i = 0; i < falta.length; i += 100){
      try{ const r = await SB().storage.from("social").createSignedUrls(falta.slice(i, i + 100), segs);
        (r.data || []).forEach(x => { if(x && x.signedUrl && !x.error) MID.set(x.path, { u: x.signedUrl, t: agora + (segs - 60) * 1000 }); }); }catch(e){}
    }
  }
  return paths.map(p => (MID.get(p) || {}).u || "");
}
function ligaMidia(root, segs){
  const els = [...(root || document).querySelectorAll("[data-m]:not([data-mok])")]; if(!els.length) return;
  urls(els.map(e => e.dataset.m), segs).then(us => els.forEach((e, i) => { e.dataset.mok = 1;
    if(!us[i]){ e.classList.add("m-falha"); if(e.tagName === "IMG") e.removeAttribute("src"); return; }
    if(e.tagName === "IMG") e.src = us[i]; else e.style.backgroundImage = `url("${us[i]}")`; }));
}
// barreiras de interface para conteúdo privado (não substituem a segurança do banco)
document.addEventListener("contextmenu", e => { if(e.target.closest && e.target.closest(".priv")) e.preventDefault(); });
document.addEventListener("dragstart", e => { if(e.target.closest && e.target.closest(".priv")) e.preventDefault(); });
const nomeArq = ext => ((window.crypto && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, "") : uid() + uid()).slice(0, 24) + "." + ext;
async function sobe(pasta, dono, blob, ext, tipo){
  const path = `${pasta}/${dono}/${nomeArq(ext)}`;
  const r = await SB().storage.from("social").upload(path, blob, { contentType: tipo, cacheControl: "0", upsert: false });
  if(r.error) throw r.error; return path;
}
function escolheArquivo(accept, captura){ return new Promise(ok => { const i = document.createElement("input"); i.type = "file"; i.accept = accept; if(captura) i.setAttribute("capture", captura); i.onchange = () => ok(i.files && i.files[0] || null); i.click(); }); }
async function imagemValida(f, max){
  if(!f) return null;
  if(!/^image\/(jpeg|jpg|png|webp|heic|heif|gif)$/i.test(f.type || "") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name || "")){ toast("Formato não suportado. Use foto JPG ou PNG."); return null; }
  if(f.size > 20 * 1024 * 1024){ toast("Arquivo muito grande (máx. 20 MB)."); return null; }
  try{ return await comprimeImg(f, max || 1440); }catch(e){ toast("Não deu para abrir essa foto. Tente outra."); return null; }
}
function corteQuadrado(blob, S){ return new Promise((ok, no) => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => { const c = document.createElement("canvas"); c.width = c.height = S; const m = Math.min(im.width, im.height); c.getContext("2d").drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, S, S); URL.revokeObjectURL(u); c.toBlob(b => b ? ok(b) : no(), "image/jpeg", .86); }; im.onerror = no; im.src = u; }); }

/* ---------- Perfis ---------- */
const PERFIS = new Map(); let EU = null;
const slug = s => norm(s || "").replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "").slice(0, 15);
async function garantePerfil(){
  if(EU) return EU; if(!SO.on()) return null;
  const r = await q(SB().from("perfis").select("*").eq("user_id", NU.uid));
  if(r[0]){ EU = r[0]; PERFIS.set(EU.user_id, EU); migraBloqueios(); return EU; }
  let base = slug(String(ME.nome || "").split(" ").slice(0, 2).join(".")); if(base.length < 3) base = (base + ".fit").replace(/^\./, "");
  let u = base;
  for(let i = 0; i < 8; i++){ const cand = i ? `${base.slice(0, 15)}${Math.floor(10 + Math.random() * 989)}` : base; const ok = await SB().rpc("username_livre", { u: cand }); if(ok.data){ u = cand; break; } }
  const mini = ME.foto ? await miniFoto(ME.foto, 96) : null;
  let foto = null; if(ME.foto){ try{ foto = await sobe("perfil", NU.uid, await (await fetch(ME.foto)).blob(), "jpg", "image/jpeg"); }catch(e){} }
  EU = (await q(SB().from("perfis").insert({ user_id: NU.uid, username: u, nome: ME.nome, foto_mini: mini, foto, cidade: ME.cidade || null }).select()))[0];
  PERFIS.set(EU.user_id, EU); migraBloqueios(); return EU;
}
function migraBloqueios(){ const L = ME.chatBloq || []; if(!L.length) return; SB().from("bloqueios").insert(L.map(b => ({ quem: NU.uid, bloqueado: b.id }))).then(() => { ME.chatBloq = []; save(); }); }
async function carregaPerfis(ids){
  const falta = [...new Set(ids.filter(i => i && !PERFIS.has(i)))]; if(!falta.length || !SO.on()) return;
  for(let i = 0; i < falta.length; i += 80){ try{ (await q(SB().from("perfis").select("user_id,username,nome,foto_mini,privado").in("user_id", falta.slice(i, i + 80)))).forEach(p => PERFIS.set(p.user_id, p)); }catch(e){} }
}
async function sincFotoPerfil(){ // chamada quando a aluna troca a foto pelo Perfil antigo
  await detectaSocial(); if(!SO.on()) return; try{ await garantePerfil(); const foto = ME.foto ? await sobe("perfil", NU.uid, await (await fetch(ME.foto)).blob(), "jpg", "image/jpeg") : null;
    const mini = ME.foto ? await miniFoto(ME.foto, 96) : null; const rr = await q(SB().from("perfis").update({ foto, foto_mini: mini }).eq("user_id", NU.uid).select()); EU = (rr && rr[0]) || { ...EU, foto, foto_mini: mini }; PERFIS.set(NU.uid, EU); }catch(e){ console.warn(e); }
}
const nomeP = (u, fb) => (PERFIS.get(u) || {}).nome || fb || "Aluna";
const userP = u => (PERFIS.get(u) || {}).username || "";
const avU = (u, nomeFb, fotoFb, cls) => { const p = PERFIS.get(u) || {}, f = p.foto_mini || fotoFb, n = p.nome || nomeFb; return `<span class="pav ${cls || ""}">${f ? `<img src="${esc(f)}" alt="" draggable="false">` : esc(String(n || "?").trim()[0] || "?").toUpperCase()}</span>`; };

/* ---------- Avisos discretos no topo ---------- */
function aviso(html, onAbrir){
  let box = $("aviso"); if(!box){ box = document.createElement("div"); box.id = "aviso"; box.className = "aviso"; document.body.appendChild(box); }
  box.innerHTML = `<div class="aviso-in">${html}${onAbrir ? `<button class="btn btn-accent btn-sm" id="aviso-ab">Abrir</button>` : ""}<button class="iconbtn sm" id="aviso-x" aria-label="Fechar">${ic("close", 14)}</button></div>`;
  box.classList.add("on"); clearTimeout(aviso.t); aviso.t = setTimeout(() => box.classList.remove("on"), 5500);
  $("aviso-x").onclick = () => box.classList.remove("on");
  const ab = $("aviso-ab"); if(ab) ab.onclick = () => { box.classList.remove("on"); onAbrir(); };
}

/* ---------- Seguir, bloquear, denunciar ---------- */
const CONT = new Map();
async function contagens(u){ try{ const r = await q(SB().rpc("perfil_contagens", { alvo: u })); CONT.set(u, r); return r; }catch(e){ return null; } }
async function seguir(u){ try{ await q(SB().from("seguidores").insert({ seguidor: NU.uid, seguido: u })); SOM.check(); }catch(e){ toast(ERR_MSG(e)); } }
async function deixarDeSeguir(u){ try{ await q(SB().from("seguidores").delete().eq("seguidor", NU.uid).eq("seguido", u)); }catch(e){ toast(ERR_MSG(e)); } }
async function bloquear(u, nome){
  if(!confirm(`Bloquear ${nome || "esta aluna"}? Ela não poderá ver seu perfil, seguir você nem mandar mensagens.`)) return false;
  try{ await q(SB().from("bloqueios").insert({ quem: NU.uid, bloqueado: u })); toast("Bloqueada. Você pode desbloquear em Perfil › Privacidade."); FEED = FEED.filter(p => p.user !== u); return true; }catch(e){ toast(ERR_MSG(e)); return false; }
}
const MOTIVOS = [["assedio","Assédio"],["improprio","Conteúdo impróprio"],["spam","Spam"],["ofensivo","Comportamento ofensivo"],["outro","Outro motivo"]];
function denunciar(tipo, alvo, volta){
  if(!SO.on()) return FORA();
  let motivo = "";
  sheet("Denunciar", `<p class="hint" style="margin:0">Sua denúncia é anônima para a outra pessoa. A equipe CK Life analisa com cuidado.</p>
    <div class="list">${MOTIVOS.map(([k, n]) => `<button class="card xp-opt" data-mt="${k}"><span><b>${n}</b></span></button>`).join("")}</div>
    <div class="field"><label for="dn-t">Quer contar mais? (opcional)</label><textarea class="input" id="dn-t" maxlength="500"></textarea></div>
    <button class="btn btn-accent btn-block btn-lg" id="dn-ok" disabled>Enviar denúncia</button>`, volta || null);
  $("sheet-body").querySelectorAll("[data-mt]").forEach(b => b.onclick = () => { motivo = b.dataset.mt; $("sheet-body").querySelectorAll("[data-mt]").forEach(x => x.classList.toggle("sel", x === b)); $("dn-ok").disabled = false; });
  $("dn-ok").onclick = async () => { $("dn-ok").disabled = true;
    try{ await q(SB().from("denuncias").insert({ autor: NU.uid, tipo, alvo_id: String(alvo), motivo, detalhe: $("dn-t").value.trim() || null })); toast("Obrigada. A equipe CK Life vai analisar com cuidado."); fecharSheet(); }
    catch(e){ toast(ERR_MSG(e)); $("dn-ok").disabled = false; } };
}
function menuAcoes(itens){ // itens: [[icone, texto, fn, perigo]]
  sheet("Opções", `<div class="so-menu">${itens.map(([i, t, , p], k) => `<button class="so-mi ${p ? "perigo" : ""}" data-k="${k}">${ic(i, 19)}<span>${t}</span></button>`).join("")}</div>`);
  $("sheet-body").querySelectorAll("[data-k]").forEach(b => b.onclick = () => { const it = itens[+b.dataset.k]; it[2](); });
}

/* ---------- Perfil social ---------- */
const INTERESSES = ["Treino em casa","Musculação","Corrida","Yoga","Pilates","Dança","Alimentação saudável","Receitas fit","Autoestima","Bem-estar","Maternidade","Rotina","Emagrecimento saudável","Força","Mobilidade","Meditação"];
async function abrirPerfil(u){
  if(!SO.on()) return FORA();
  if(!u) return;
  sheet("Perfil", `<div class="post skel" style="height:260px"></div>`);
  try{ if(u === NU.uid) await garantePerfil(); }catch(e){}
  let p; try{ p = (await q(SB().from("perfis").select("*").eq("user_id", u)))[0]; }catch(e){ $("sheet-body").innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
  if(!p){ $("sheet-body").innerHTML = `<div class="empty">${ic("perfil", 34, 1.6)}<p>Este perfil não está disponível.</p></div>`; return; }
  PERFIS.set(u, p); if(u === NU.uid) EU = p;
  const [c] = await Promise.all([contagens(u)]); const meu = u === NU.uid;
  const podeVer = meu || !p.privado || (c && c.eu_sigo === "ativo");
  const st = c && c.eu_sigo, btSeg = meu ? "" : st === "ativo" ? `<button class="btn btn-line" id="pf-seg">${ic("check", 16)} Seguindo</button>` : st === "pendente" ? `<button class="btn btn-line" id="pf-seg">Solicitado</button>` : `<button class="btn btn-accent" id="pf-seg">${ic("userplus", 16)} ${p.privado ? "Solicitar para seguir" : c && c.me_segue ? "Seguir de volta" : "Seguir"}</button>`;
  const conq = p.mostrar_conquistas !== false ? (p.conquistas || []) : [];
  const cid = p.mostrar_cidade && p.cidade ? xcidNome(p.cidade) : "";
  sheet(meu ? "Meu perfil" : "Perfil", `<div class="so-perfil">
    <div class="so-capa priv" ${p.capa ? `data-m="${esc(p.capa)}"` : ""}></div>
    <div class="so-ph"><span class="so-av priv" ${p.foto ? `data-m="${esc(p.foto)}"` : ""}>${p.foto_mini ? `<img src="${esc(p.foto_mini)}" alt="" draggable="false">` : esc((p.nome || "?")[0].toUpperCase())}</span></div>
    <div class="so-id"><h2>${esc(p.nome)}</h2><p class="muted">@${esc(p.username)}${p.privado ? ` · ${ic("lock", 13)} privado` : ""}${c && c.me_segue && !meu ? ` · <span class="so-segue">segue você</span>` : ""}</p>
      ${p.bio ? `<p class="so-bio">${esc(p.bio)}</p>` : ""}
      <div class="xp-tags" style="justify-content:center">${cid ? `<i class="xp-tag">${ic("pin", 12)} ${esc(cid)}</i>` : ""}${p.mostrar_objetivo && p.objetivo ? `<i class="xp-tag ok">${esc(p.objetivo)}</i>` : ""}${(p.interesses || []).slice(0, 6).map(i => `<i class="xp-tag">${esc(i)}</i>`).join("")}</div></div>
    <div class="so-acts">${meu ? `<button class="btn btn-accent" id="pf-ed">${ic("edit", 16)} Editar perfil</button>` : btSeg + `<button class="btn btn-line" id="pf-msg">${ic("chat", 16)} Mensagem</button>`}<button class="iconbtn" id="pf-mais" aria-label="Mais opções">${ic(meu ? "share" : "dots", 18)}</button></div>
    <div class="so-nums"><button data-ls="posts"><b class="num">${int(c ? c.posts : 0)}</b><span>Publicações</span></button><button data-ls="seguidores"><b class="num">${int(c ? c.seguidores : 0)}</b><span>Seguidoras</span></button><button data-ls="seguindo"><b class="num">${int(c ? c.seguindo : 0)}</b><span>Seguindo</span></button></div>
    ${meu ? `<div id="pf-ped"></div>` : ""}
    ${conq.length ? `<div class="so-conq"><h3>Conquistas</h3><div class="hscroll">${conq.slice(-12).reverse().map(k => { const d = CONQ.find(x => x[0] === (k.k || k)); return d ? `<span class="so-badge"><i>${d[2]}</i><b>${d[3]}</b></span>` : ""; }).join("")}</div></div>` : ""}
    <div id="pf-posts">${podeVer ? `<div class="post skel" style="height:120px"></div>` : `<div class="card empty">${ic("lock", 30, 1.6)}<p><b>Perfil privado</b><br>Siga para ver as publicações e os Stories.</p></div>`}</div>
    ${meu ? `<div class="card" style="padding:6px 16px">${setRow("pf-salvos", "bookmark", "Publicações salvas", "Só você vê")}${setRow("pf-priv", "shield", "Privacidade e bloqueios", p.privado ? "Perfil privado" : "Perfil público no CK Life")}</div>` : ""}
  </div>`);
  const b = $("sheet-body"); ligaMidia(b, 3600);
  const on = (id, fn) => { const e = $(id); if(e) e.onclick = fn; };
  on("pf-ed", () => editarPerfil());
  on("pf-salvos", () => verSalvos());
  on("pf-priv", () => privacidade());
  on("pf-msg", async () => { try{ const cv = await conversaCom(u); abreConversa(cv); }catch(e){ toast(/row-level/i.test(String(e.message)) ? "Ela não está recebendo mensagens agora." : ERR_MSG(e)); } });
  on("pf-seg", async () => { if(st === "ativo" || st === "pendente"){ if(!confirm(st === "ativo" ? `Deixar de seguir ${p.nome}?` : "Cancelar o pedido para seguir?")) return; await deixarDeSeguir(u); } else await seguir(u); abrirPerfil(u); });
  on("pf-mais", () => meu ? compartilharPerfil(p) : menuAcoes([["share", "Compartilhar perfil", () => compartilharPerfil(p)], ["flag", "Denunciar perfil", () => denunciar("perfil", u, () => abrirPerfil(u)), 1], ["ban", "Bloquear", async () => { if(await bloquear(u, p.nome)){ fecharSheet(); if(TAB === "juntas") rJuntas(); } }, 1]]));
  b.querySelectorAll("[data-ls]").forEach(x => x.onclick = () => { const t = x.dataset.ls; if(t === "posts"){ const e = $("pf-posts"); if(e) e.scrollIntoView({ behavior: "smooth" }); } else if(podeVer) listaPessoas(u, t, p.nome); else toast("Perfil privado."); });
  if(meu) pedidosSeguir();
  if(podeVer) gradePosts(u);
}
async function gradePosts(u){
  const box = $("pf-posts"); if(!box) return;
  let L = []; try{ L = await q(SB().from("posts").select("id,midia,img,texto,criado,conquista").eq("user_id", u).order("criado", { ascending: false }).limit(30)); }catch(e){ box.innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
  if(!$("pf-posts")) return;
  box.innerHTML = L.length ? `<div class="so-grade">${L.map(x => `<button class="so-gi priv" data-pid="${x.id}">${x.midia ? `<img data-m="${esc(x.midia)}" alt="" draggable="false">` : x.img ? `<img src="${esc(x.img)}" alt="" draggable="false">` : `<span>${esc((x.conquista && x.conquista.titulo) || x.texto || "").slice(0, 70)}</span>`}</button>`).join("")}</div>` : `<div class="card empty"><p>${u === NU.uid ? "Você ainda não publicou. Que tal se apresentar para a comunidade?" : "Ainda sem publicações."}</p>${u === NU.uid ? `<button class="btn btn-accent btn-sm" id="pf-1post">Criar primeira publicação</button>` : ""}</div>`;
  ligaMidia(box);
  const f = $("pf-1post"); if(f) f.onclick = () => abreComposer();
  box.querySelectorAll("[data-pid]").forEach(x => x.onclick = async () => { const ps = await feedBusca([x.dataset.pid]); if(ps[0]) abrePost(ps[0]); });
}
async function pedidosSeguir(){
  const box = $("pf-ped"); if(!box) return;
  let L = []; try{ L = await q(SB().from("seguidores").select("seguidor,criado").eq("seguido", NU.uid).eq("status", "pendente").order("criado", { ascending: false }).limit(50)); }catch(e){ return; }
  if(!L.length || !$("pf-ped")) return; await carregaPerfis(L.map(x => x.seguidor));
  box.innerHTML = `<div class="card"><h3 style="font-size:16px">Pedidos para seguir você (${L.length})</h3>${L.map(x => `<div class="so-pessoa">${avU(x.seguidor)}<span><b>${esc(nomeP(x.seguidor))}</b><small>@${esc(userP(x.seguidor))}</small></span><button class="btn btn-accent btn-sm" data-ac="${x.seguidor}">Aceitar</button><button class="btn btn-line btn-sm" data-rc="${x.seguidor}">Recusar</button></div>`).join("")}</div>`;
  box.querySelectorAll("[data-ac]").forEach(b => b.onclick = async () => { try{ await q(SB().from("seguidores").update({ status: "ativo" }).eq("seguidor", b.dataset.ac).eq("seguido", NU.uid)); toast("Pedido aceito"); abrirPerfil(NU.uid); }catch(e){ toast(ERR_MSG(e)); } });
  box.querySelectorAll("[data-rc]").forEach(b => b.onclick = async () => { try{ await q(SB().from("seguidores").delete().eq("seguidor", b.dataset.rc).eq("seguido", NU.uid)); b.closest(".so-pessoa").remove(); }catch(e){ toast(ERR_MSG(e)); } });
}
async function listaPessoas(u, tipo, nome){
  sheet(tipo === "seguidores" ? "Seguidoras" : "Seguindo", `<div id="lp-l"><div class="post skel" style="height:70px"></div></div>`, () => abrirPerfil(u));
  let L = []; try{ L = await q(SB().from("seguidores").select("seguidor,seguido").eq(tipo === "seguidores" ? "seguido" : "seguidor", u).eq("status", "ativo").limit(300)); }catch(e){ $("lp-l").innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
  const ids = L.map(x => tipo === "seguidores" ? x.seguidor : x.seguido); await carregaPerfis(ids);
  $("lp-l").innerHTML = ids.filter(i => PERFIS.has(i)).map(i => `<button class="so-pessoa" data-u="${i}">${avU(i)}<span><b>${esc(nomeP(i))}</b><small>@${esc(userP(i))}</small></span></button>`).join("") || `<p class="empty">${tipo === "seguidores" ? `${esc(nome || "Ela")} ainda não tem seguidoras.` : "Ainda não segue ninguém."}</p>`;
  $("lp-l").querySelectorAll("[data-u]").forEach(b => b.onclick = () => abrirPerfil(b.dataset.u));
}
async function encontrarMulheres(){
  if(!SO.on()) return FORA();
  await garantePerfil().catch(() => {});
  sheet("Fazer novas amigas", `<div class="search">${ic("search", 18)}<input class="input" id="em-q" placeholder="Buscar por nome ou @usuária" autocomplete="off"></div><div id="em-l"><div class="post skel" style="height:70px"></div></div>`);
  const desenha = async termo => {
    let L = [];
    try{ let qy = SB().from("perfis").select("user_id,username,nome,foto_mini,privado,bio,cidade,mostrar_cidade").neq("user_id", NU.uid).limit(30);
      if(termo){ const t = termo.replace(/[%,()]/g, " ").trim().replace(/^@/, ""); qy = qy.or(`username.ilike.%${t}%,nome.ilike.%${t}%`); } else qy = qy.order("criado", { ascending: false });
      L = await q(qy); }catch(e){ $("em-l").innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
    L.forEach(p => PERFIS.set(p.user_id, Object.assign(PERFIS.get(p.user_id) || {}, p)));
    if(!termo){ const cid = ME.cidade; L.sort((a, b) => ((b.mostrar_cidade && +b.cidade === +cid) - (a.mostrar_cidade && +a.cidade === +cid))); }
    const box = $("em-l"); if(!box) return;
    box.innerHTML = (termo ? "" : `<p class="hint" style="margin:4px 0 8px">Mulheres que chegaram por aqui. Siga quem te inspira 💚</p>`) + (L.map(p => `<button class="so-pessoa" data-u="${p.user_id}">${avU(p.user_id)}<span><b>${esc(p.nome)}</b><small>@${esc(p.username)}${p.bio ? " · " + esc(p.bio.slice(0, 50)) : ""}</small></span>${p.privado ? ic("lock", 15) : ""}</button>`).join("") || `<p class="empty">Ninguém encontrado com “${esc(termo)}”.</p>`);
    box.querySelectorAll("[data-u]").forEach(b => b.onclick = () => abrirPerfil(b.dataset.u));
  };
  let t; $("em-q").oninput = e => { clearTimeout(t); t = setTimeout(() => desenha(e.target.value.trim()), 300); };
  desenha("");
}
function editarPerfil(){
  const p = { ...EU }; let novaFoto = null, novaCapa = null, tiraCapa = false, ints = new Set(p.interesses || []);
  sheet("Editar perfil", `<div class="so-ed-capa priv" id="ed-capa" ${p.capa ? `data-m="${esc(p.capa)}"` : ""}><button class="btn btn-soft btn-sm" id="ed-capa-b">${ic("camera", 15)} Capa</button>${p.capa ? `<button class="btn btn-soft btn-sm" id="ed-capa-x">Tirar</button>` : ""}</div>
    <div class="so-ed-av"><span class="so-av priv" id="ed-av">${p.foto_mini ? `<img src="${esc(p.foto_mini)}" alt="">` : esc((p.nome || "?")[0])}</span><button class="btn btn-line btn-sm" id="ed-foto-b">${ic("camera", 15)} Trocar foto</button></div>
    <div class="formgrid">
      <div class="field full"><label for="ed-n">Nome</label><input class="input" id="ed-n" maxlength="60" value="${esc(p.nome)}"></div>
      <div class="field full"><label for="ed-u">Nome de usuária</label><div class="so-at"><span>@</span><input class="input" id="ed-u" maxlength="20" value="${esc(p.username)}" autocapitalize="none" autocomplete="off"></div><small class="hint" id="ed-u-m">Letras minúsculas, números, ponto ou _ (3 a 20).</small></div>
      <div class="field full"><label for="ed-b">Sobre você</label><textarea class="input" id="ed-b" maxlength="160" placeholder="Ex.: Mãe, treinando em casa e buscando minha melhor versão 💚">${esc(p.bio || "")}</textarea></div>
      <div class="field"><label for="ed-c">Cidade</label><select class="input" id="ed-c"><option value="">Não mostrar</option>${DB.cidades.filter(c => c.ativa !== false).map(c => `<option value="${c.id}" ${p.mostrar_cidade && +p.cidade === +c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select></div>
      <div class="field"><label for="ed-o">Objetivo (opcional)</label><select class="input" id="ed-o"><option value="">Não mostrar</option>${OBJS.map(o => `<option ${p.mostrar_objetivo && p.objetivo === o[1] ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select></div>
    </div>
    <h3>Interesses</h3><div class="chips" id="ed-i">${INTERESSES.map(i => `<button class="chip" data-i="${esc(i)}" aria-pressed="${ints.has(i)}">${esc(i)}</button>`).join("")}</div>
    <h3>Privacidade</h3>
    <div class="card" style="padding:6px 16px">${setRow("ed-pv", "lock", "Perfil privado", "Só quem você aprovar vê suas publicações e Stories", sw(p.privado))}${setRow("ed-cq", "trophy", "Mostrar conquistas no perfil", "Só treinos e sequência. Nunca peso, medidas ou ciclo.", sw(p.mostrar_conquistas !== false))}</div>
    <div class="field"><label for="ed-m">Quem pode me mandar mensagem</label><select class="input" id="ed-m">${[["todas","Todas as alunas"],["seguindo","Só quem eu sigo"],["ninguem","Ninguém (só conversas já abertas)"]].map(([k, n]) => `<option value="${k}" ${p.mensagens === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <p class="hint">${ic("shield", 13)} Seu peso, medidas, ciclo e dados de saúde nunca aparecem no perfil.</p>
    <button class="btn btn-accent btn-block btn-lg" id="ed-ok">Salvar perfil</button>`, () => abrirPerfil(NU.uid));
  ligaMidia($("sheet-body"), 3600);
  let priv = !!p.privado, mconq = p.mostrar_conquistas !== false;
  $("ed-pv").onclick = () => { priv = !priv; $("ed-pv").querySelector(".sw").setAttribute("aria-checked", priv); };
  $("ed-cq").onclick = () => { mconq = !mconq; $("ed-cq").querySelector(".sw").setAttribute("aria-checked", mconq); };
  $("ed-i").querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const i = b.dataset.i; if(ints.has(i)) ints.delete(i); else if(ints.size < 8) ints.add(i); else return toast("Escolha até 8 interesses"); b.setAttribute("aria-pressed", ints.has(i)); });
  let tu, uOk = true; $("ed-u").oninput = e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""); e.target.value = v; clearTimeout(tu); uOk = false;
    tu = setTimeout(async () => { if(v === p.username){ uOk = true; $("ed-u-m").textContent = "É o seu nome de usuária atual."; return; } if(!/^[a-z0-9._]{3,20}$/.test(v)){ $("ed-u-m").textContent = "Use de 3 a 20 letras minúsculas, números, ponto ou _."; return; }
      const r = await SB().rpc("username_livre", { u: v }); uOk = !!r.data; $("ed-u-m").innerHTML = uOk ? `<span style="color:var(--accent-strong)">@${esc(v)} está disponível ✓</span>` : `<span style="color:var(--bad)">@${esc(v)} já está em uso. Tente outro.</span>`; }, 350); };
  $("ed-foto-b").onclick = async () => { const f = await escolheArquivo("image/*"); const b = await imagemValida(f, 1200); if(!b) return; novaFoto = await corteQuadrado(b, 480); $("ed-av").innerHTML = `<img src="${await blobParaURL(novaFoto)}" alt="">`; };
  $("ed-capa-b").onclick = async () => { const f = await escolheArquivo("image/*"); const b = await imagemValida(f, 1600); if(!b) return; novaCapa = b; tiraCapa = false; $("ed-capa").style.backgroundImage = `url("${await blobParaURL(b)}")`; };
  const cx = $("ed-capa-x"); if(cx) cx.onclick = () => { tiraCapa = true; novaCapa = null; $("ed-capa").style.backgroundImage = "none"; };
  $("ed-ok").onclick = async () => {
    const nome = $("ed-n").value.trim(), un = $("ed-u").value.trim();
    if(nome.length < 2) return toast("Digite seu nome");
    if(!uOk || !/^[a-z0-9._]{3,20}$/.test(un)) return toast("Escolha um nome de usuária disponível");
    const bt = $("ed-ok"); bt.disabled = true; bt.classList.add("carregando");
    try{
      const up = { nome, username: un, bio: $("ed-b").value.trim() || null, interesses: [...ints], privado: priv, mostrar_conquistas: mconq, mensagens: $("ed-m").value };
      const cv = $("ed-c").value; up.cidade = cv ? +cv : (ME.cidade || null); up.mostrar_cidade = !!cv;
      const ov = $("ed-o").value; up.objetivo = ov || null; up.mostrar_objetivo = !!ov;
      if(novaFoto){ up.foto = await sobe("perfil", NU.uid, novaFoto, "jpg", "image/jpeg"); up.foto_mini = await miniFoto(await blobParaURL(novaFoto), 96); ME.foto = await blobParaURL(await corteQuadrado(novaFoto, 320)); }
      if(novaCapa) up.capa = await sobe("perfil", NU.uid, novaCapa, "jpg", "image/jpeg"); else if(tiraCapa) up.capa = null;
      const r = await SB().from("perfis").update(up).eq("user_id", NU.uid).select();
      if(r.error){ if(/perfis_username|duplicate/i.test(r.error.message)){ const er = new Error("Esse nome de usuária acabou de ser usado. Escolha outro."); er.nosso = true; throw er; } throw r.error; }
      EU = (r.data && r.data[0]) || (await q(SB().from("perfis").select("*").eq("user_id", NU.uid)))[0] || { ...EU, ...up }; PERFIS.set(NU.uid, EU); if(nome !== ME.nome){ ME.nome = nome; } save(); atualizaTopo(); SOM.check(); toast("Perfil atualizado 💚"); abrirPerfil(NU.uid);
    }catch(e){ console.warn(e); toast(e.nosso ? e.message : /mime|size|payload|too large/i.test(String(e.message)) ? "A foto não foi aceita (tipo ou tamanho). Tente outra." : ERR_MSG(e)); bt.disabled = false; bt.classList.remove("carregando"); }
  };
}
async function compartilharPerfil(p){
  const url = `${location.origin}${location.pathname}?u=${encodeURIComponent(p.username)}`;
  const txt = `Me encontra no CK Life: @${p.username} 💚 Uma comunidade de mulheres que treinam em casa.`;
  try{ if(navigator.share){ await navigator.share({ title: "CK Life", text: txt, url }); return; } }catch(e){ if(e && e.name === "AbortError") return; }
  copyText(`${txt} ${url}`, "Link do perfil copiado");
}
async function verSalvos(){
  sheet("Publicações salvas", `<div id="vs-l" class="feed"><div class="post skel"></div></div>`, () => abrirPerfil(NU.uid));
  let ids = []; try{ ids = (await q(SB().from("salvos").select("post_id").eq("user_id", NU.uid).order("criado", { ascending: false }).limit(60))).map(x => x.post_id); }catch(e){ $("vs-l").innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
  const L = await feedBusca(ids); const box = $("vs-l"); if(!box) return;
  box.innerHTML = L.length ? L.map(postHtml).join("") : `<div class="empty">${ic("bookmark", 32, 1.6)}<p>Toque no marcador de uma publicação para guardar aqui.</p></div>`;
  box.querySelectorAll(".post").forEach(el => ligaPost(el, L.find(p => p.id === el.dataset.id))); ligaMidia(box);
}
async function privacidade(){
  let bl = [];
  if(SO.on()){ try{ bl = await q(SB().from("bloqueios").select("bloqueado").eq("quem", NU.uid)); await carregaPerfis(bl.map(b => b.bloqueado)); }catch(e){} }
  sheet("Privacidade", `<div class="card"><h3 style="font-size:16px">O que outras alunas veem</h3><p class="hint" style="margin:6px 0 0">Nome, @, foto, capa, bio e o que você escolher mostrar no perfil. Com perfil privado, só quem você aprovar vê suas publicações e Stories.</p></div>
    <div class="card"><h3 style="font-size:16px">O que nunca é compartilhado</h3><p class="hint" style="margin:6px 0 0">Meu Ciclo, peso, medidas, sintomas e qualquer dado de saúde. Nada disso vai para anúncios, parceiros, academias ou profissionais. Compartilhar uma conquista é sempre escolha sua.</p></div>
    <div class="card"><h3 style="font-size:16px">Fotos e mensagens</h3><p class="hint" style="margin:6px 0 0">Fotos e áudios do chat, Stories e fotos de perfis privados ficam guardados de forma privada e só abrem para quem tem permissão, por links que expiram. O app não oferece botão de baixar conteúdo de outras pessoas.</p></div>
    ${SO.on() ? `<div class="card" style="padding:6px 16px">${setRow("pv-perfil", "perfil", "Configurar meu perfil", "Perfil privado, mensagens e conquistas")}</div>` : ""}
    <div class="card"><h3 style="font-size:16px">Alunas bloqueadas</h3>${bl.length ? bl.map(b => `<div class="so-pessoa">${avU(b.bloqueado)}<span><b>${esc(nomeP(b.bloqueado))}</b><small>@${esc(userP(b.bloqueado))}</small></span><button class="btn btn-line btn-sm" data-desb="${b.bloqueado}">Desbloquear</button></div>`).join("") : `<p class="hint" style="margin:6px 0 0">Ninguém bloqueado.</p>`}</div>
    <div class="card" style="padding:6px 16px">${setRow("pv-ciclo", "ciclo", "Apagar dados do Meu Ciclo", "Remove tudo o que você registrou")}${linkSuporte() ? setRow("pv-sup", "speaker", "Pedir exclusão da conta", "Fale com o suporte") : ""}</div>`);
  const pp = $("pv-perfil"); if(pp) pp.onclick = async () => { await garantePerfil(); editarPerfil(); };
  $("sheet-body").querySelectorAll("[data-desb]").forEach(b => b.onclick = async () => { try{ await q(SB().from("bloqueios").delete().eq("quem", NU.uid).eq("bloqueado", b.dataset.desb)); toast("Desbloqueada"); privacidade(); }catch(e){ toast(ERR_MSG(e)); } });
  $("pv-ciclo").onclick = () => { if(!confirm("Apagar todos os dados do Meu Ciclo?")) return; XP.ciclo.apagar().then(() => { CIC = null; toast("Dados do Meu Ciclo apagados"); }).catch(e => toast(XERR(e) ? XAVISO : "Não deu agora")); };
  const s = $("pv-sup"); if(s) s.onclick = () => window.open(linkSuporte(), "_blank", "noopener");
}

/* ---------- FEED ---------- */
let FD = { modo: "todos", cursor: null, fim: false, carregando: false }, SALVOS = new Set(), SEGUINDO = null;
async function seguindoIds(){ if(SEGUINDO) return SEGUINDO; try{ SEGUINDO = (await q(SB().from("seguidores").select("seguido").eq("seguidor", NU.uid).eq("status", "ativo").limit(1000))).map(x => x.seguido); }catch(e){ SEGUINDO = []; } return SEGUINDO; }
async function completaPosts(rows){
  const ids = rows.map(p => p.id); let cu = [], co = [], sv = [];
  if(ids.length){ [cu, co, sv] = await Promise.all([q(SB().from("curtidas").select("post_id,user_id").in("post_id", ids)), q(SB().from("comentarios").select("*").in("post_id", ids).order("criado", { ascending: true })), q(SB().from("salvos").select("post_id").eq("user_id", NU.uid).in("post_id", ids)).catch(() => [])]); }
  sv.forEach(s => SALVOS.add(s.post_id));
  await carregaPerfis([...rows.map(p => p.user_id), ...co.map(c => c.user_id)]);
  return rows.map(p => ({ id: p.id, user: p.user_id, nome: p.nome, foto: p.foto, texto: p.texto, img: p.img, midia: p.midia, conquista: p.conquista, criado: p.criado, oculto: p.oculto,
    curtidas: cu.filter(c => c.post_id === p.id).map(c => c.user_id), coments: co.filter(c => c.post_id === p.id).map(c => ({ id: c.id, user: c.user_id, nome: c.nome, foto: c.foto, texto: c.texto, criado: c.criado })) }));
}
async function feedBusca(ids){ if(!ids.length || !SO.on()) return []; const rows = await q(SB().from("posts").select("*").in("id", ids)); const L = await completaPosts(rows); return ids.map(i => L.find(p => p.id === i)).filter(Boolean); }
async function feedPagina(){
  if(FD.carregando || FD.fim) return []; FD.carregando = true;
  try{
    let qy = SB().from("posts").select("*").order("criado", { ascending: false }).limit(12);
    if(FD.cursor) qy = qy.lt("criado", FD.cursor);
    if(FD.modo === "seguindo"){ const ids = await seguindoIds(); qy = qy.in("user_id", [...ids, NU.uid]); }
    const rows = await q(qy); if(rows.length < 12) FD.fim = true; if(rows.length) FD.cursor = rows[rows.length - 1].criado;
    return await completaPosts(rows);
  } finally { FD.carregando = false; }
}
function postHtml(p){
  const meu = p.user === ME.id, liked = (p.curtidas || []).includes(ME.id), nc = (p.coments || []).length, nl = (p.curtidas || []).length, us = userP(p.user), salvo = SALVOS.has(p.id);
  const cq = p.conquista ? `<div class="so-pconq"><i>${esc(p.conquista.emoji || "🏆")}</i><div><b>${esc(p.conquista.titulo || "Conquista")}</b><small>${esc(p.conquista.frase || "")}</small></div></div>` : "";
  return `<article class="post" data-id="${p.id}">
    <header>${avU(p.user, p.nome, p.foto)}<div class="pmeta"><b>${esc(nomeP(p.user, p.nome))}</b><small>${us ? "@" + esc(us) + " · " : ""}${tempoAtras(p.criado)}${p.oculto ? " · oculto pela moderação" : ""}</small></div><button class="iconbtn sm" data-mais aria-label="Opções">${ic("dots", 18)}</button></header>
    ${p.texto ? `<p class="ptx">${esc(p.texto)}</p>` : ""}${cq}
    ${p.midia ? `<div class="pimg priv" data-abre><img data-m="${esc(p.midia)}" alt="" loading="lazy" draggable="false"><i class="pheart">${ic("heart", 70)}</i></div>` : p.img ? `<div class="pimg priv" data-abre><img src="${esc(p.img)}" alt="" loading="lazy" draggable="false"><i class="pheart">${ic("heart", 70)}</i></div>` : ""}
    <div class="pacts"><button class="pl ${liked ? "on" : ""}" data-like aria-label="Curtir">${ic("heart", 22)}<span>${nl || ""}</span></button><button data-abre aria-label="Comentar">${ic("chat", 21)}<span>${nc || ""}</span></button>${SO.on() ? `<button data-share aria-label="Compartilhar">${ic("send", 20)}</button><button class="so-save ${salvo ? "on" : ""}" data-save aria-label="Salvar">${ic("bookmark", 20)}</button>` : ""}
      ${nl ? `<small class="pquem">${liked ? (nl === 1 ? "Você curtiu" : `Você e mais ${nl - 1}`) : `${nl} ${nl === 1 ? "curtida" : "curtidas"}`}</small>` : ""}</div>
    ${(p.coments || []).slice(-2).map(c => `<p class="pc"><b>${esc(nomeP(c.user, c.nome).split(" ")[0])}</b> ${esc(c.texto)}</p>`).join("")}
    ${nc > 2 ? `<button class="link pver" data-abre>Ver os ${nc} comentários</button>` : ""}
    <button class="pcin" data-abre>${avU(ME.id, ME.nome, ME.foto)}<span>Escreva um comentário…</span></button>
  </article>`;
}
function ligaPost(el, p, detalhe){
  if(!el || !p) return;
  const like = async () => { const on = !(p.curtidas || []).includes(ME.id); p.curtidas = (p.curtidas || []).filter(u => u !== ME.id); if(on) p.curtidas.push(ME.id); if(on){ SOM.fav ? SOM.fav() : SOM.tap(); vibra(12); }
    const b = el.querySelector("[data-like]"); b.classList.toggle("on", on); b.classList.remove("pop"); void b.offsetWidth; if(on) b.classList.add("pop"); b.querySelector("span").textContent = p.curtidas.length || "";
    try{ await CM.curtir(p, on); }catch(e){ toast(ERR_MSG(e)); } };
  el.querySelector("[data-like]").onclick = like;
  const im = el.querySelector(".pimg"); if(im){ let t = 0; im.addEventListener("click", e => { const n = Date.now(); if(n - t < 320){ e.stopPropagation(); if(!(p.curtidas || []).includes(ME.id)) like(); im.classList.remove("bate"); void im.offsetWidth; im.classList.add("bate"); t = 0; return; } t = n; if(!detalhe) setTimeout(() => { if(t === n) abrePost(p); }, 330); }); }
  if(!detalhe) el.querySelectorAll("[data-abre]:not(.pimg)").forEach(b => b.onclick = () => abrePost(p, b.classList.contains("pcin")));
  const hd = el.querySelector("header"); if(hd){ [hd.querySelector(".pav"), hd.querySelector(".pmeta b")].forEach(x => { if(x) x.onclick = e => { e.stopPropagation(); if(SO.on()) abrirPerfil(p.user); }; }); }
  const sv = el.querySelector("[data-save]"); if(sv) sv.onclick = async () => { const on = !SALVOS.has(p.id); sv.classList.toggle("on", on); try{ if(on){ await q(SB().from("salvos").insert({ user_id: NU.uid, post_id: p.id })); SALVOS.add(p.id); toast("Salvo. Veja em Perfil › Publicações salvas."); } else { await q(SB().from("salvos").delete().eq("user_id", NU.uid).eq("post_id", p.id)); SALVOS.delete(p.id); } }catch(e){ sv.classList.toggle("on", !on); toast(ERR_MSG(e)); } };
  const sh = el.querySelector("[data-share]"); if(sh) sh.onclick = () => compartilharPost(p);
  const mais = el.querySelector("[data-mais]"); if(mais) mais.onclick = () => {
    const meu = p.user === ME.id;
    if(meu) menuAcoes([["share", "Compartilhar", () => compartilharPost(p)], ["trash", "Excluir publicação", () => { if(!confirm("Excluir esta publicação?")) return; CM.apagaPost(p).then(() => { toast("Publicação excluída"); fecharSheet(); FEED = FEED.filter(x => x.id !== p.id); if(TAB === "juntas") desenhaFeed(); }).catch(e => toast(ERR_MSG(e))); }, 1]]);
    else if(SO.on()) menuAcoes([["perfil", "Ver perfil", () => abrirPerfil(p.user)], ["flag", "Denunciar publicação", () => denunciar("post", p.id), 1], ["ban", "Bloquear " + esc(nomeP(p.user, p.nome).split(" ")[0]), async () => { if(await bloquear(p.user, nomeP(p.user, p.nome))){ fecharSheet(); if(TAB === "juntas") desenhaFeed(); } }, 1]]);
    else FORA();
  };
  ligaMidia(el);
}
function abrePost(p, foca){
  const lista = () => (p.coments || []).map(c => `<div class="cmt">${avU(c.user, c.nome, c.foto)}<div><p><b>${esc(nomeP(c.user, c.nome))}</b> ${esc(c.texto)}</p><small>${tempoAtras(c.criado)}${c.user === ME.id ? ` · <button class="link cdel" data-cdel="${c.id}">Excluir</button>` : SO.on() ? ` · <button class="link cdel" data-cden="${c.id}">Denunciar</button>` : ""}</small></div></div>`).join("") || `<p class="hint" style="margin:0">Seja a primeira a comentar 💚</p>`;
  sheet("Publicação", `<div class="post post-full" data-id="${p.id}">${postHtml(p).replace(/^<article[^>]*>|<\/article>$/g, "")}</div><div class="cmts" id="cmts">${lista()}</div>
    <div class="cbar"><input class="input" id="cm-txt" maxlength="500" placeholder="Escreva um comentário…" autocomplete="off"><button class="btn btn-accent" id="cm-env" aria-label="Enviar">${ic("send", 18)}</button></div>`, () => { if(TAB === "juntas") desenhaFeed(); });
  const el = $("sheet-body").querySelector(".post-full"); el.querySelectorAll(".pcin,.pver,.pc").forEach(x => x.remove()); ligaPost(el, p, true);
  const ligaDel = () => { $("cmts").querySelectorAll("[data-cdel]").forEach(b => b.onclick = () => { const c = p.coments.find(x => x.id === b.dataset.cdel); CM.apagaComent(p, c).then(() => { p.coments = p.coments.filter(x => x !== c); $("cmts").innerHTML = lista(); ligaDel(); }).catch(() => toast("Não deu para excluir agora")); });
    $("cmts").querySelectorAll("[data-cden]").forEach(b => b.onclick = () => denunciar("comentario", b.dataset.cden, () => abrePost(p))); };
  ligaDel();
  const env = async () => { const t = $("cm-txt").value.trim(); if(!t) return; $("cm-env").disabled = true; try{ const c = await CM.comentar(p, t); p.coments = p.coments || []; if(!p.coments.some(x => x.id === c.id)) p.coments.push(c); $("cm-txt").value = ""; $("cmts").innerHTML = lista(); ligaDel(); SOM.check(); const sp = el.querySelector("[data-abre] span"); if(sp) sp.textContent = p.coments.length; const ul = $("cmts").lastElementChild; if(ul) ul.scrollIntoView({ behavior: "smooth", block: "nearest" }); }catch(e){ toast(ERR_MSG(e)); } $("cm-env").disabled = false; };
  $("cm-env").onclick = env; $("cm-txt").onkeydown = e => { if(e.key === "Enter") env(); };
  if(foca) setTimeout(() => $("cm-txt").focus(), 250);
}
function abreComposer(texto0, blob0, extra){
  let blob = blob0 || null; const cq = extra && extra.conquista;
  sheet("Nova publicação", `<div class="cmp-top">${avU(ME.id, ME.nome, ME.foto)}<b>${esc(ME.nome)}</b></div>
    ${cq ? `<div class="so-pconq"><i>${esc(cq.emoji)}</i><div><b>${esc(cq.titulo)}</b><small>${esc(cq.frase)}</small></div></div>` : ""}
    <textarea class="input cmp-tx" id="cp-t" maxlength="1000" placeholder="O que você quer compartilhar hoje? 💚">${esc(texto0 || "")}</textarea>
    <div id="cp-prev" class="cp-prev"></div>
    <div class="toolbar"><button class="btn btn-line" id="cp-foto">${ic("camera", 18)} Foto</button><span class="hint">Compartilhe só o que você quiser. Seu peso, medidas e ciclo nunca são postados.</span></div>
    <button class="btn btn-accent btn-block btn-lg" id="cp-ok">Publicar</button>`);
  const prev = async () => { $("cp-prev").innerHTML = blob ? `<img src="${await blobParaURL(blob)}" alt=""><button class="iconbtn sm" id="cp-x" aria-label="Tirar foto">${ic("close", 16)}</button>` : ""; const x = $("cp-x"); if(x) x.onclick = () => { blob = null; prev(); }; };
  prev();
  $("cp-foto").onclick = async () => { const f = await escolheArquivo("image/*"); const b = await imagemValida(f, 1440); if(b){ blob = b; prev(); } };
  $("cp-ok").onclick = async () => { const t = $("cp-t").value.trim(); if(!t && !blob && !cq) return toast("Escreva algo ou escolha uma foto"); if(ME.bloqueado) return toast("Sua conta está bloqueada");
    const b = $("cp-ok"); b.classList.add("carregando"); b.disabled = true;
    try{ await CM.publicar(t, blob, extra); SOM.done ? SOM.done() : SOM.check(); fecharSheet(); toast("Publicado no CK Life 💚"); FD = { ...FD, cursor: null, fim: false }; if(TAB !== "juntas") tab("juntas"); else rJuntas(); }
    catch(e){ console.warn(e); toast(ERR_MSG(e)); b.classList.remove("carregando"); b.disabled = false; } };
}
// publicar na nuvem: a foto vai para o bucket PRIVADO (caminho), nunca link público
const CM_pub0 = CM.publicar;
CM.publicar = async (texto, blob, extra) => {
  if(!SO.on()) return CM_pub0(texto, blob);
  await garantePerfil();
  const id = novoId(); let midia = null;
  if(blob) midia = await sobe("post", NU.uid, blob, "jpg", "image/jpeg");
  const r = await SB().from("posts").insert({ id, user_id: NU.uid, nome: EU.nome || ME.nome, foto: EU.foto_mini || await miniFoto(ME.foto), texto, midia, conquista: (extra && extra.conquista) || null });
  if(r.error) throw r.error;
};
// o painel (moderação) também enxerga fotos privadas de posts via URL temporária
const CM_car0 = CM.carregar;
CM.carregar = async admin => { const L = await CM_car0(admin); if(SO.on()){ const ps = L.filter(p => p.midia); const us = await urls(ps.map(p => p.midia)); ps.forEach((p, i) => { if(us[i]) p.img = us[i]; }); } return L; };
async function compartilharPost(p){
  const meu = p.user === ME.id, itens = [];
  if(SO.on()) itens.push(["send", "Enviar para uma amiga no chat", () => enviarParaAmiga({ tipo: "post", post_id: p.id, texto: (p.texto || "").slice(0, 120) })]);
  if(meu) itens.push(["share", "Compartilhar fora do CK Life", async () => {
    let file = null; const src = p.midia ? (await urls([p.midia]))[0] : p.img;
    if(src){ try{ const b = await (await fetch(src)).blob(); file = new File([b], "ck-life.jpg", { type: "image/jpeg" }); }catch(e){} }
    const txt = `${p.texto ? p.texto + "\n\n" : ""}Minha evolução no CK Life 💚 ${location.origin}`;
    try{ if(file && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: txt }); else if(navigator.share) await navigator.share({ text: txt }); else copyText(txt, "Texto copiado para colar onde quiser"); }catch(e){} }]);
  if(!itens.length) return FORA();
  menuAcoes(itens);
}

/* ---------- Tela da Comunidade ---------- */
function rJuntas(){
  if(NU.ativo && SO_PRONTO === null){ $("t-juntas").innerHTML = `<div class="feed"><div class="post skel"></div><div class="post skel"></div></div>`; detectaSocial().then(() => { if(TAB === "juntas") rJuntas(); }); return; }
  ME.feedVisto = new Date().toISOString(); save(); marcaNovidade(false);
  const on = SO.on();
  $("t-juntas").innerHTML = `<div class="so-head"><h1>Comunidade</h1><div class="so-hb">${on ? `<button class="iconbtn" id="cm-busca" aria-label="Fazer novas amigas">${ic("search", 19)}</button>` : ""}<button class="iconbtn so-badgebtn" id="cm-not" aria-label="Notificações">${ic("bell", 19)}<i class="so-dot" id="cm-not-n" hidden></i></button><button class="iconbtn so-badgebtn" id="cm-chat" aria-label="Conversas">${ic("chat", 19)}<i class="so-dot" id="cm-chat-n" hidden></i></button><button class="iconbtn" id="cm-eu" aria-label="Meu perfil social">${avU(ME.id, ME.nome, ME.foto)}</button></div></div>
    ${on ? `<div class="so-stories hscroll" id="st-row"><button class="so-st meu" id="st-novo"><span class="so-st-av">${avU(ME.id, ME.nome, ME.foto)}<i>${ic("plus", 12, 3)}</i></span><small>Seu Story</small></button></div>` : ""}
    <button class="composer" id="cm-nova">${avU(ME.id, ME.nome, ME.foto)}<span>O que você quer compartilhar hoje?</span><i>${ic("camera", 20)}</i></button>
    ${on ? `<div class="seg seg-sm" id="fd-modo"><button data-fm="todos" aria-pressed="${FD.modo === "todos"}">Para você</button><button data-fm="seguindo" aria-pressed="${FD.modo === "seguindo"}">Seguindo</button></div>` : ""}
    <div id="feed-boas"></div>
    <div id="feed" class="feed"><div class="post skel"></div><div class="post skel"></div></div>
    <div id="feed-mais"></div>
    <div class="regras">${ic("heart", 15)} Um espaço de apoio entre mulheres: elogie, incentive e respeite. Sem comparação de corpos.</div>`;
  $("cm-nova").onclick = () => abreComposer();
  $("cm-not").onclick = abrirNotificacoes; $("cm-chat").onclick = listaConversas;
  $("cm-eu").onclick = () => on ? abrirPerfil(NU.uid) : tab("perfil");
  const bu = $("cm-busca"); if(bu) bu.onclick = encontrarMulheres;
  const md = $("fd-modo"); if(md) md.querySelectorAll("[data-fm]").forEach(b => b.onclick = () => { FD = { modo: b.dataset.fm, cursor: null, fim: false, carregando: false }; SEGUINDO = null; SOM.tap(); rJuntas(); });
  if(on){ garantePerfil().then(() => { const e = $("cm-eu"); if(e) e.innerHTML = avU(NU.uid); }).catch(() => {}); carregaStories(); atualizaBadges(); }
  FD.cursor = null; FD.fim = false; FEED = [];
  carregaFeed();
}
async function carregaFeed(silencio){
  const f = $("feed"); if(!f) return;
  try{
    if(SO.on()){ const L = await feedPagina(); FEED = silencio ? L : FEED.concat(L); }
    else FEED = await CM.carregar();
    FEED_ERRO = "";
  }catch(e){ console.warn(e); FEED_ERRO = ERR_MSG(e); }
  desenhaFeed();
}
function desenhaFeed(){
  const f = $("feed"); if(!f) return;
  if(FEED_ERRO && !FEED.length){ f.innerHTML = `<div class="card empty-feed">${ic("people", 34)}<b>${FEED_ERRO}</b></div>`; return; }
  const boas = $("feed-boas");
  if(boas){ const novata = SO.on() && FD.modo === "todos" && (SEGUINDO ? !SEGUINDO.length : true) && !FEED.some(p => p.user === ME.id);
    boas.innerHTML = novata && !ME.boasVindasOk ? `<div class="card so-boas"><button class="iconbtn sm so-x" id="bv-x" aria-label="Fechar">${ic("close", 14)}</button><h3>Bem-vinda à comunidade CK Life 💚</h3><p>Um lugar de mulheres que se apoiam na evolução, no treino e na autoestima. Que tal se apresentar?</p><div class="acts"><button class="btn btn-accent btn-sm" id="bv-post">Criar primeira publicação</button><button class="btn btn-line btn-sm" id="bv-perfil">Completar meu perfil</button><button class="btn btn-line btn-sm" id="bv-achar">Fazer novas amigas</button></div></div>` : "";
    const on = (id, fn) => { const e = $(id); if(e) e.onclick = fn; };
    on("bv-x", () => { ME.boasVindasOk = true; save(); boas.innerHTML = ""; }); on("bv-post", () => abreComposer("Oi, meninas! Sou nova por aqui 💚 ")); on("bv-perfil", async () => { await garantePerfil(); editarPerfil(); }); on("bv-achar", encontrarMulheres);
    if(SO.on() && !SEGUINDO) seguindoIds().then(() => { if(TAB === "juntas" && !$("bv-x") && SEGUINDO && !SEGUINDO.length && !ME.boasVindasOk) desenhaFeed(); });
  }
  if(!FEED.length){ f.innerHTML = `<div class="card empty-feed">${ic("people", 34)}<b>${FD.modo === "seguindo" ? "Quem você segue ainda não publicou." : "Seja a primeira a postar!"}</b><p>${FD.modo === "seguindo" ? "Encontre mais mulheres para acompanhar." : "Conte como foi seu treino ou mostre sua receita favorita."}</p>${FD.modo === "seguindo" && SO.on() ? `<button class="btn btn-accent btn-sm" id="fd-achar">Fazer novas amigas</button>` : ""}</div>`; const a = $("fd-achar"); if(a) a.onclick = encontrarMulheres; $("feed-mais").innerHTML = ""; return; }
  f.innerHTML = FEED.map(postHtml).join("");
  f.querySelectorAll(".post").forEach(el => ligaPost(el, FEED.find(p => p.id === el.dataset.id)));
  const mais = $("feed-mais");
  if(mais){ mais.innerHTML = SO.on() && !FD.fim ? `<div class="so-sentinela" id="fd-sent"><div class="post skel" style="height:90px"></div></div>` : FEED.length > 4 ? `<p class="hint" style="text-align:center">Você viu tudo por aqui 💚</p>` : "";
    const s = $("fd-sent"); if(s){ const io = new IntersectionObserver(es => { if(es.some(x => x.isIntersecting)){ io.disconnect(); carregaFeed(); } }, { rootMargin: "400px" }); io.observe(s); } }
}

/* ---------- STORIES (24h; expiração e permissão no banco) ---------- */
let STO = { grupos: [], vistos: new Set() };
async function carregaStories(){
  const row = $("st-row"); if(!row) return;
  let L = [];
  try{ L = await q(SB().from("stories").select("id,user_id,midia,texto,cor,criado,expira").gt("expira", new Date().toISOString()).order("criado", { ascending: true }).limit(300)); }catch(e){ return; }
  if(L.length){ try{ (await q(SB().from("story_vistas").select("story_id").eq("user_id", NU.uid).in("story_id", L.map(s => s.id)))).forEach(v => STO.vistos.add(v.story_id)); }catch(e){} }
  const seg = new Set(await seguindoIds()); await carregaPerfis(L.map(s => s.user_id));
  const por = new Map(); L.forEach(s => { if(!por.has(s.user_id)) por.set(s.user_id, []); por.get(s.user_id).push(s); });
  STO.grupos = [...por.entries()].map(([u, ss]) => ({ u, ss, novo: ss.some(s => !STO.vistos.has(s.id)) })).sort((a, b) => (b.u === NU.uid) - (a.u === NU.uid) || b.novo - a.novo || seg.has(b.u) - seg.has(a.u));
  if(!$("st-row")) return;
  const meu = STO.grupos.find(g => g.u === NU.uid);
  row.innerHTML = `<button class="so-st meu ${meu ? "tem" : ""}" id="st-novo"><span class="so-st-av ${meu ? "visto" : ""}">${avU(NU.uid, ME.nome, ME.foto)}<i>${ic("plus", 12, 3)}</i></span><small>Seu Story</small></button>` +
    STO.grupos.filter(g => g.u !== NU.uid).map(g => `<button class="so-st" data-su="${g.u}"><span class="so-st-av ${g.novo ? "novo" : "visto"}">${avU(g.u)}</span><small>${esc(nomeP(g.u).split(" ")[0])}</small></button>`).join("");
  $("st-novo").onclick = e => { if(meu && !e.target.closest(".so-st-av > i")) verStories(NU.uid); else criarStory(); };
  row.querySelectorAll("[data-su]").forEach(b => b.onclick = () => verStories(b.dataset.su));
}
const CORES_ST = ["#0E3D32","#2E7D5A","#C2577B","#6C5FB5","#D08A2E","#17211D"];
async function criarStory(){
  if(ME.bloqueado) return toast("Sua conta está bloqueada");
  const f = await escolheArquivo("image/*"); const b = await imagemValida(f, 1920); if(!b) return;
  let cor = CORES_ST[0];
  sheet("Novo Story", `<div class="so-stprev priv" id="sp-p"><img src="${await blobParaURL(b)}" alt=""><span id="sp-tx" class="so-sttx" hidden></span></div>
    <div class="field"><label for="sp-t">Texto sobre a foto (opcional)</label><input class="input" id="sp-t" maxlength="120" placeholder="Ex.: Treino feito! 💪"></div>
    <div class="so-cores" id="sp-c">${CORES_ST.map(c => `<button style="background:${c}" data-c="${c}" aria-pressed="${c === cor}" aria-label="Cor ${c}"></button>`).join("")}</div>
    <p class="hint">${ic("clock", 13)} Fica visível por 24 horas. ${EU && EU.privado ? "Seu perfil é privado: só suas seguidoras veem." : "Aparece para quem pode ver seu perfil."}</p>
    <button class="btn btn-accent btn-block btn-lg" id="sp-ok">Publicar Story</button>`);
  const tx = $("sp-tx"), pinta = () => { const v = $("sp-t").value.trim(); tx.hidden = !v; tx.textContent = v; tx.style.background = cor; };
  $("sp-t").oninput = pinta;
  $("sp-c").querySelectorAll("[data-c]").forEach(x => x.onclick = () => { cor = x.dataset.c; $("sp-c").querySelectorAll("[data-c]").forEach(y => y.setAttribute("aria-pressed", y === x)); pinta(); });
  $("sp-ok").onclick = async () => { const bt = $("sp-ok"); bt.disabled = true; bt.classList.add("carregando");
    try{ await garantePerfil(); const final = await montaStory(b, $("sp-t").value.trim(), cor); const midia = await sobe("story", NU.uid, final, "jpg", "image/jpeg");
      await q(SB().from("stories").insert({ user_id: NU.uid, midia, texto: $("sp-t").value.trim() || null, cor }));
      SOM.done ? SOM.done() : SOM.check(); fecharSheet(); toast("Story publicado por 24 horas 💚"); carregaStories(); }
    catch(e){ console.warn(e); toast(ERR_MSG(e)); bt.disabled = false; bt.classList.remove("carregando"); } };
}
function montaStory(blob, texto, cor){ return new Promise((ok, no) => { const u = URL.createObjectURL(blob), im = new Image(); im.onload = () => {
  const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); x.fillStyle = "#0B2A22"; x.fillRect(0, 0, W, H);
  const k = Math.max(W / im.width, H / im.height), w = im.width * k, h = im.height * k; x.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  if(texto){ x.font = "800 64px 'Bricolage Grotesque',system-ui,sans-serif"; const pal = texto.split(" "), linhas = []; let l = "";
    pal.forEach(p => { const t = l ? l + " " + p : p; if(x.measureText(t).width > W - 200){ linhas.push(l); l = p; } else l = t; }); if(l) linhas.push(l);
    const lh = 82, y0 = H * .62 - (linhas.length * lh) / 2; linhas.forEach((ln, i) => { const lw = x.measureText(ln).width; x.fillStyle = cor; const bx = (W - lw) / 2 - 28, by = y0 + i * lh - 60; x.beginPath(); x.roundRect ? x.roundRect(bx, by, lw + 56, 80, 22) : x.rect(bx, by, lw + 56, 80); x.fill(); x.fillStyle = "#fff"; x.fillText(ln, (W - lw) / 2, y0 + i * lh); }); }
  URL.revokeObjectURL(u); c.toBlob(b => b ? ok(b) : no(), "image/jpeg", .86); }; im.onerror = no; im.src = u; }); }
let SV = null;
async function verStories(u){
  const gi = STO.grupos.findIndex(g => g.u === u); if(gi < 0) return;
  SV = { gi, si: 0, t: 0, raf: 0, pausa: false };
  let box = $("story"); if(!box){ box = document.createElement("div"); box.id = "story"; box.className = "so-story priv"; document.body.appendChild(box); }
  box.hidden = false; document.body.style.overflow = "hidden"; mostraStory();
}
function fechaStory(){ const box = $("story"); if(box){ box.hidden = true; box.innerHTML = ""; } cancelAnimationFrame(SV && SV.raf); SV = null; document.body.style.overflow = ""; carregaStories(); }
async function mostraStory(){
  if(!SV) return; const g = STO.grupos[SV.gi]; if(!g) return fechaStory(); const s = g.ss[SV.si]; if(!s) return fechaStory();
  cancelAnimationFrame(SV.raf); const meu = g.u === NU.uid, box = $("story");
  box.innerHTML = `<div class="so-sv-barras">${g.ss.map((x, i) => `<i><b style="width:${i < SV.si ? 100 : 0}%"></b></i>`).join("")}</div>
    <div class="so-sv-top"><button class="so-sv-quem" id="sv-perfil">${avU(g.u)}<span><b>${esc(nomeP(g.u))}</b><small>${tempoAtras(s.criado)}</small></span></button><button class="iconbtn" id="sv-mais" aria-label="Opções">${ic("dots", 18)}</button><button class="iconbtn" id="sv-x" aria-label="Fechar">${ic("close", 18)}</button></div>
    <div class="so-sv-img"><img data-m="${esc(s.midia)}" alt="" draggable="false"></div>
    <button class="so-sv-nav ant" id="sv-ant" aria-label="Anterior"></button><button class="so-sv-nav prox" id="sv-prox" aria-label="Próximo"></button>
    <div class="so-sv-pe">${meu ? `<button class="btn btn-soft btn-sm" id="sv-vistas">${ic("perfil", 15)} <span id="sv-nv">Quem viu</span></button><button class="btn btn-soft btn-sm" id="sv-novo">${ic("plus", 15)} Novo</button>` : `<input class="input" id="sv-resp" maxlength="500" placeholder="Responder a ${esc(nomeP(g.u).split(" ")[0])}…"><button class="btn btn-accent" id="sv-env" aria-label="Enviar">${ic("send", 17)}</button>`}</div>`;
  const img = box.querySelector(".so-sv-img img");
  const us = await urls([s.midia], 300); if(!SV) return;
  if(!us[0]){ img.replaceWith(Object.assign(document.createElement("p"), { className: "so-sv-falha", textContent: "Este Story não está mais disponível." })); }
  else { img.src = us[0]; await new Promise(r => { if(img.complete) r(); else { img.onload = r; img.onerror = r; } }); }
  if(!SV) return;
  if(!meu && !STO.vistos.has(s.id)){ STO.vistos.add(s.id); SB().from("story_vistas").insert({ story_id: s.id, user_id: NU.uid }).then(() => {}); }
  const DUR = 6000; let ini = performance.now(), gasto = 0;
  const barra = box.querySelectorAll(".so-sv-barras b")[SV.si];
  const passo = t => { if(!SV) return; if(SV.pausa){ ini = t - gasto; SV.raf = requestAnimationFrame(passo); return; } gasto = t - ini; barra.style.width = Math.min(100, gasto / DUR * 100) + "%"; if(gasto >= DUR) return avanca(1); SV.raf = requestAnimationFrame(passo); };
  SV.raf = requestAnimationFrame(passo);
  const avanca = d => { if(!SV) return; SV.si += d; if(SV.si < 0){ SV.gi--; if(SV.gi < 0) return fechaStory(); SV.si = 0; } else if(SV.si >= g.ss.length){ SV.gi++; SV.si = 0; if(SV.gi >= STO.grupos.length) return fechaStory(); } mostraStory(); };
  const solto = () => SV && SV.solto && Date.now() - SV.solto < 450;
  $("sv-ant").onclick = () => { if(!solto()) avanca(-1); }; $("sv-prox").onclick = () => { if(!solto()) avanca(1); }; $("sv-x").onclick = fechaStory;
  $("sv-perfil").onclick = () => { fechaStory(); abrirPerfil(g.u); };
  $("sv-mais").onclick = () => { SV.pausa = true;
    const itens = meu ? [["trash", "Excluir este Story", async () => { if(!confirm("Excluir este Story?")) return; try{ await q(SB().from("stories").delete().eq("id", s.id)); SB().storage.from("social").remove([s.midia]); toast("Story excluído"); fecharSheet(); fechaStory(); }catch(e){ toast(ERR_MSG(e)); } }, 1]]
      : [["flag", "Denunciar Story", () => { fechaStory(); denunciar("story", s.id); }, 1], ["ban", "Bloquear " + nomeP(g.u).split(" ")[0], async () => { fechaStory(); if(await bloquear(g.u, nomeP(g.u))){ fecharSheet(); rJuntas(); } }, 1]];
    menuAcoes(itens); sheetClose = () => { if(SV) SV.pausa = false; }; };
  if(meu){ SB().from("story_vistas").select("user_id", { count: "exact", head: true }).eq("story_id", s.id).then(r => { const e = $("sv-nv"); if(e && r.count != null) e.textContent = r.count ? `Visto por ${r.count}` : "Ninguém viu ainda"; }); }
  const nv = $("sv-novo"); if(nv) nv.onclick = () => { fechaStory(); criarStory(); };
  const area = box.querySelector(".so-sv-img"); let y0 = null, segura = null;
  box.onpointerdown = ev => { if(ev.target.closest("button,input")) return; y0 = ev.clientY; segura = setTimeout(() => { if(SV) SV.pausa = true; box.classList.add("pausado"); }, 180); };
  box.onpointerup = ev => { clearTimeout(segura); const dy = y0 == null ? 0 : ev.clientY - y0; y0 = null; if(box.classList.contains("pausado")){ box.classList.remove("pausado"); if(SV){ SV.pausa = false; SV.solto = Date.now(); } } if(dy > 90){ if(SV) SV.solto = Date.now(); fechaStory(); } };
  box.onpointercancel = () => { clearTimeout(segura); box.classList.remove("pausado"); if(SV) SV.pausa = false; };
  void area;
  const vi = $("sv-vistas"); if(vi) vi.onclick = async () => { SV.pausa = true; let L = []; try{ L = await q(SB().from("story_vistas").select("user_id,criado").eq("story_id", s.id).order("criado", { ascending: false })); }catch(e){} await carregaPerfis(L.map(v => v.user_id));
    sheet(`Visto por ${L.length}`, L.map(v => `<div class="so-pessoa">${avU(v.user_id)}<span><b>${esc(nomeP(v.user_id))}</b><small>${tempoAtras(v.criado)}</small></span></div>`).join("") || `<p class="empty">Ninguém viu ainda.</p>`, () => { if(SV) SV.pausa = false; }); };
  const rp = $("sv-resp"); if(rp){ rp.onfocus = () => SV.pausa = true; rp.onblur = () => { if(SV) SV.pausa = false; };
    const env = async () => { const t = rp.value.trim(); if(!t) return; $("sv-env").disabled = true;
      try{ const cv = await conversaCom(g.u); await enviaMsg(cv, { tipo: "story", story_id: s.id, texto: t }); toast("Resposta enviada no chat 💚"); rp.value = ""; rp.blur(); }
      catch(e){ toast(/row-level/i.test(String(e.message)) ? "Ela não está recebendo mensagens agora." : ERR_MSG(e)); } $("sv-env").disabled = false; };
    $("sv-env").onclick = env; rp.onkeydown = e => { if(e.key === "Enter") env(); }; }
}
document.addEventListener("keydown", e => { if(!SV) return; if(e.key === "Escape") fechaStory(); if(e.key === "ArrowRight") $("sv-prox") && $("sv-prox").click(); if(e.key === "ArrowLeft") $("sv-ant") && $("sv-ant").click(); });

/* ---------- CHAT PRIVADO (texto, foto, áudio, resposta, status, tempo real) ---------- */
let CONV = [], NAOLIDAS = {}, CHAT = null;
const outroDe = c => c.a === NU.uid ? c.b : c.a;
async function conversaCom(u){
  await garantePerfil();
  const busca = () => q(SB().from("conversas").select("*").or(`and(a.eq.${NU.uid},b.eq.${u}),and(a.eq.${u},b.eq.${NU.uid})`));
  let r = await busca(); if(r[0]) return r[0];
  await carregaPerfis([u]); const o = PERFIS.get(u) || {};
  const ins = await SB().from("conversas").insert({ a: NU.uid, b: u, nome_a: EU.nome, foto_a: EU.foto_mini, nome_b: o.nome || "", foto_b: o.foto_mini || "" }).select();
  if(ins.error){ r = await busca(); if(r[0]) return r[0]; throw ins.error; }
  return ins.data[0];
}
async function enviarParaAmiga(conteudo){
  let L = []; try{ L = await q(SB().from("conversas").select("*").order("ultima_em", { ascending: false }).limit(40)); }catch(e){ return toast(ERR_MSG(e)); }
  await carregaPerfis(L.map(outroDe));
  sheet("Enviar para", L.length ? L.map(c => `<button class="so-pessoa" data-cv="${c.id}">${avU(outroDe(c))}<span><b>${esc(nomeP(outroDe(c)))}</b><small>@${esc(userP(outroDe(c)))}</small></span>${ic("send", 16)}</button>`).join("") : `<p class="empty">Você ainda não tem conversas. Abra o perfil de uma aluna e toque em Mensagem.</p>`);
  $("sheet-body").querySelectorAll("[data-cv]").forEach(b => b.onclick = async () => { try{ await enviaMsg(L.find(c => c.id === b.dataset.cv), conteudo); toast("Enviado 💚"); fecharSheet(); }catch(e){ toast(ERR_MSG(e)); } });
}
async function listaConversas(){
  if(!SO.on()) return FORA();
  sheet("Conversas", `<button class="so-novaconv" id="cv-nova">${ic("plus", 16)} Nova conversa</button><div id="cv-l"><div class="post skel" style="height:70px"></div></div>`);
  $("cv-nova").onclick = encontrarMulheres;
  try{ await garantePerfil(); CONV = await q(SB().from("conversas").select("*").order("ultima_em", { ascending: false }).limit(100)); await contaNaoLidas(); }
  catch(e){ $("cv-l").innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
  await carregaPerfis(CONV.map(outroDe));
  let st = {}; const minhas = CONV.filter(c => c.ultimo_autor === NU.uid).map(c => c.id);
  if(minhas.length){ try{ (await q(SB().from("mensagens").select("conversa_id,criado,entregue_em,lida_em").in("conversa_id", minhas).eq("autor", NU.uid).order("criado", { ascending: false }).limit(300))).forEach(m => { if(!st[m.conversa_id]) st[m.conversa_id] = m; }); }catch(e){} }
  SB().rpc("marcar_entregues").then(() => {});
  const box = $("cv-l"); if(!box) return;
  box.innerHTML = CONV.length ? CONV.map(c => { const o = outroDe(c), n = NAOLIDAS[c.id] || 0, m = st[c.id]; return `<button class="xp-conv ${n ? "nova" : ""}" data-cv="${c.id}">${avU(o, c.a === NU.uid ? c.nome_b : c.nome_a, c.a === NU.uid ? c.foto_b : c.foto_a)}<span class="xp-ct"><b>${esc(nomeP(o, c.a === NU.uid ? c.nome_b : c.nome_a))}</b><small>${c.ultima ? (c.ultimo_autor === NU.uid ? `${m ? stIcone(m) : ""} Você: ` : "") + esc(c.ultima) : "Diga oi 👋"}</small></span><span class="so-cvr"><small>${c.ultima ? tempoAtras(c.ultima_em) : ""}</small>${n ? `<i class="xp-badge">${n}</i>` : ""}</span></button>`; }).join("")
    : `<div class="empty">${ic("chat", 34, 1.6)}<p>Nenhuma conversa ainda. Encontre mulheres da comunidade e mande um oi 💚</p></div>`;
  box.querySelectorAll("[data-cv]").forEach(b => b.onclick = () => abreConversa(CONV.find(c => c.id === b.dataset.cv)));
}
// status: ✓ enviada · ✓✓ entregue · ✓✓ colorido = visto
const CK1 = `<svg viewBox="0 0 16 12" width="15" height="12" aria-hidden="true"><path d="M1.5 6.5l3.5 3.5L14.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CK2 = `<svg viewBox="0 0 22 12" width="19" height="12" aria-hidden="true"><path d="M1.5 6.5l3.5 3.5L14.5 1M8.5 9l1 1L19.5 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const stIcone = m => m.pend ? `<i class="so-st0" title="Enviando">${ic("clock", 12)}</i>` : m.lida_em ? `<i class="so-st3" title="Visto">${CK2}</i>` : m.entregue_em ? `<i class="so-st2" title="Entregue">${CK2}</i>` : `<i class="so-st1" title="Enviada">${CK1}</i>`;
const stTexto = m => m.pend ? "Enviando…" : m.lida_em ? `Visto ${new Date(m.lida_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : m.entregue_em ? "Entregue" : "Enviada";
async function contaNaoLidas(){ try{ const r = await q(SB().rpc("nao_lidas")); NAOLIDAS = {}; (r || []).forEach(x => NAOLIDAS[x.conversa_id] = +x.n); }catch(e){} return NAOLIDAS; }
async function abreConversa(c){
  if(!c) return; const o = outroDe(c); await carregaPerfis([o]);
  CHAT = { c, msgs: [], fim: false, resp: null, rec: null };
  sheet("Conversa", `<button class="xp-chathead" id="cv-perfil">${avU(o, c.a === NU.uid ? c.nome_b : c.nome_a, c.a === NU.uid ? c.foto_b : c.foto_a)}<span><b>${esc(nomeP(o))}</b><small>${userP(o) ? "@" + esc(userP(o)) + " · " : ""}ver perfil</small></span></button>
    <div class="xp-msgs priv" id="cv-m"><div class="post skel" style="height:60px"></div></div>
    <div class="so-cbar" id="cv-bar"><div id="cv-resp"></div><div class="so-cin"><button class="iconbtn" id="cv-foto" aria-label="Enviar foto">${ic("image", 20)}</button><input class="input" id="cv-t" maxlength="2000" placeholder="Mensagem" autocomplete="off"><button class="iconbtn so-mic" id="cv-mic" aria-label="Gravar áudio">${ic("mic", 20)}</button><button class="btn btn-accent so-env" id="cv-env" aria-label="Enviar" hidden>${ic("send", 18)}</button></div></div>`,
    () => { if(CHAT && CHAT.rec) CHAT.rec.cancelar(); CHAT = null; atualizaBadges(); }, `<button class="iconbtn sm" id="cv-op" aria-label="Opções">${ic("dots", 18)}</button>`);
  $("cv-perfil").onclick = () => abrirPerfil(o);
  $("cv-op").onclick = () => menuAcoes([["perfil", "Ver perfil", () => abrirPerfil(o)], [ME.silenciadas && ME.silenciadas.includes(c.id) ? "bell" : "mute", ME.silenciadas && ME.silenciadas.includes(c.id) ? "Ativar avisos desta conversa" : "Silenciar avisos desta conversa", () => { ME.silenciadas = ME.silenciadas || []; ME.silenciadas = ME.silenciadas.includes(c.id) ? ME.silenciadas.filter(x => x !== c.id) : [...ME.silenciadas, c.id]; save(); toast("Pronto"); abreConversa(c); }], ["flag", "Denunciar perfil", () => denunciar("perfil", o, () => abreConversa(c)), 1], ["ban", "Bloquear", async () => { if(await bloquear(o, nomeP(o))) fecharSheet(); }, 1]]);
  const t = $("cv-t"), env = $("cv-env"), mic = $("cv-mic");
  t.oninput = () => { const tem = !!t.value.trim(); env.hidden = !tem; mic.hidden = tem; };
  const manda = async () => { const v = t.value.trim(); if(!v) return; t.value = ""; t.oninput(); const r = CHAT.resp; CHAT.resp = null; desenhaResp(); await enviaMsg(c, { tipo: "texto", texto: v, resposta_id: r ? r.id : null }); };
  env.onclick = manda; t.onkeydown = e => { if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); manda(); } };
  $("cv-foto").onclick = () => fotoChat(c);
  mic.onclick = () => gravarAudio(c);
  await carregaMsgs();
  marcaLidas();
}
async function carregaMsgs(antes){
  if(!CHAT) return; const c = CHAT.c;
  let qy = SB().from("mensagens").select("*").eq("conversa_id", c.id).order("criado", { ascending: false }).limit(50);
  if(antes) qy = qy.lt("criado", antes);
  let L = []; try{ L = (await q(qy)).reverse(); }catch(e){ const m = $("cv-m"); if(m) m.innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
  if(!CHAT || CHAT.c.id !== c.id) return;
  if(L.length < 50) CHAT.fim = true;
  CHAT.msgs = antes ? L.concat(CHAT.msgs) : L;
  desenhaMsgs(!antes);
}
const fmtDur = s => `${Math.floor((s || 0) / 60)}:${String(Math.round(s || 0) % 60).padStart(2, "0")}`;
function msgCorpo(m){
  if(m.oculto_mod) return `<p class="so-mod">Mensagem removida pela moderação.</p>`;
  const rp = m.resposta_id && CHAT.msgs.find(x => x.id === m.resposta_id);
  let h = rp ? `<div class="so-quote"><b>${rp.autor === NU.uid ? "Você" : esc(nomeP(rp.autor).split(" ")[0])}</b><span>${esc(rp.tipo === "foto" ? "📷 Foto" : rp.tipo === "audio" ? "🎤 Áudio" : (rp.texto || "").slice(0, 80))}</span></div>` : "";
  if(m.tipo === "story") h += `<div class="so-mstory" data-story="${m.story_id}"><small>${m.autor === NU.uid ? "Você respondeu ao Story" : "Respondeu ao seu Story"}</small><span class="so-mstory-img priv"></span></div>`;
  if(m.tipo === "post") h += `<button class="so-mpost" data-post="${m.post_id}">${ic("image", 16)} <span>Publicação compartilhada</span></button>`;
  if(m.pend && m.tipo === "foto") h += `<div class="so-mfoto so-enviando"><img src="${m.previa}" alt=""><i class="so-spin"></i></div>`;
  else if(m.pend && m.tipo === "audio") h += `<div class="so-aud so-enviando"><i class="so-spin pq"></i><small>Enviando áudio…</small></div>`;
  else if(m.tipo === "foto") h += `<button class="so-mfoto priv" data-ver="${esc(m.midia)}"><img data-m="${esc(m.midia)}" alt="Foto" draggable="false"></button>`;
  if(m.tipo === "audio" && !m.pend) h += `<div class="so-aud" data-aud="${esc(m.midia)}" data-dur="${m.duracao || 0}"><button class="iconbtn sm" aria-label="Tocar áudio">${ic("play", 16)}</button><i><b></b></i><small>${fmtDur(m.duracao)}</small></div>`;
  if(m.texto && m.tipo !== "post") h += `<p>${esc(m.texto)}</p>`; else if(m.tipo === "post" && m.texto) h += `<p class="hint">${esc(m.texto)}</p>`;
  return h;
}
function desenhaMsgs(rolarFim){
  const box = $("cv-m"); if(!box || !CHAT) return;
  const L = CHAT.msgs, o = outroDe(CHAT.c), ultMinha = [...L].reverse().find(m => m.autor === NU.uid);
  const perto = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  box.innerHTML = (CHAT.fim ? `<p class="xp-chat-aviso hint">${ic("shield", 13)} Conversa privada. Seja gentil e nunca envie senhas ou dados de cartão.</p>` : `<button class="link so-antigas" id="cv-ant">Ver mensagens anteriores</button>`) +
    (L.length ? L.map((m, i) => { const eu = m.autor === NU.uid, prox = L[i + 1], ultimaDela = !eu && (!prox || prox.autor !== m.autor), dia = i === 0 || L[i - 1].criado.slice(0, 10) !== m.criado.slice(0, 10);
      return `${dia ? `<div class="so-dia">${new Date(m.criado).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}</div>` : ""}<div class="xp-msgrow ${eu ? "eu" : ""}" data-mid="${m.id}">${!eu ? (ultimaDela ? avU(o) : `<span style="width:28px;flex:0 0 28px"></span>`) : ""}<div class="xp-msg ${eu ? "eu" : ""} ${m.tipo !== "texto" ? "midia" : ""}">${msgCorpo(m)}<small>${new Date(m.criado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${eu ? " " + stIcone(m) : ""}</small></div><button class="so-mop" data-op="${m.id}" aria-label="Opções da mensagem">${ic("dots", 14)}</button></div>${eu && m === ultMinha ? `<div class="so-sttxt">${stTexto(m)}</div>` : ""}`; }).join("")
    : `<p class="empty">Comece a conversa com ${esc(nomeP(o).split(" ")[0])} 💚</p>`);
  ligaMidia(box, 600);
  const an = $("cv-ant"); if(an) an.onclick = () => carregaMsgs(L[0] && L[0].criado);
  box.querySelectorAll("[data-ver]").forEach(b => b.onclick = () => verFoto(b.dataset.ver));
  box.querySelectorAll("[data-aud]").forEach(ligaAudio);
  box.querySelectorAll("[data-post]").forEach(b => b.onclick = async () => { const ps = await feedBusca([b.dataset.post]); if(ps[0]) abrePost(ps[0]); else toast("Esta publicação não está disponível para você."); });
  const sts = [...box.querySelectorAll("[data-story]")]; if(sts.length){ const ids = [...new Set(sts.map(x => x.dataset.story))];
    SB().from("stories").select("id,midia").in("id", ids).then(r => { const vivos = new Map((r.data || []).map(s => [s.id, s.midia])); sts.forEach(x => { const m = vivos.get(x.dataset.story), sp = x.querySelector(".so-mstory-img"); if(m){ sp.dataset.m = m; } else sp.outerHTML = `<em class="so-mstory-exp">Story expirado</em>`; }); ligaMidia(box, 300); }); }
  box.querySelectorAll("[data-op]").forEach(b => b.onclick = () => opcoesMsg(CHAT.msgs.find(m => m.id === b.dataset.op)));
  if(rolarFim || perto) box.scrollTop = box.scrollHeight;
}
function opcoesMsg(m){
  if(!m || m.pend) return; const eu = m.autor === NU.uid, c = CHAT.c, itens = [["reply", "Responder", () => { fecharSheetSilencioso(); CHAT.resp = m; desenhaResp(); $("cv-t").focus(); }]];
  if(m.tipo === "texto" && m.texto) itens.push(["share", "Copiar texto", () => { fecharSheetSilencioso(); copyText(m.texto, "Texto copiado"); }]);
  itens.push(["trash", "Apagar para mim", async () => { fecharSheetSilencioso(); try{ await q(SB().rpc("ocultar_mensagem", { p_id: m.id })); CHAT.msgs = CHAT.msgs.filter(x => x.id !== m.id); desenhaMsgs(); }catch(e){ toast(ERR_MSG(e)); } }, 1]);
  if(eu) itens.push(["trash", "Apagar para nós duas", async () => { if(!confirm("Apagar esta mensagem para vocês duas?")) return; fecharSheetSilencioso(); try{ await q(SB().from("mensagens").delete().eq("id", m.id)); if(m.midia) SB().storage.from("social").remove([m.midia]); CHAT.msgs = CHAT.msgs.filter(x => x.id !== m.id); desenhaMsgs(); }catch(e){ toast(ERR_MSG(e)); } }, 1]);
  else itens.push(["flag", "Denunciar mensagem", () => { CHAT_VOLTA = c; denunciar("mensagem", m.id, () => abreConversa(c)); }, 1]);
  // menu leve por cima da conversa (sem fechar o chat)
  let box = $("so-pop"); if(!box){ box = document.createElement("div"); box.id = "so-pop"; box.className = "so-pop"; document.body.appendChild(box); }
  box.innerHTML = `<div class="so-pop-in">${itens.map(([i, t, , p], k) => `<button class="so-mi ${p ? "perigo" : ""}" data-k="${k}">${ic(i, 18)}<span>${t}</span></button>`).join("")}<button class="so-mi" data-x>${ic("close", 18)}<span>Cancelar</span></button></div>`;
  box.hidden = false; box.onclick = e => { if(e.target === box || e.target.closest("[data-x]")) box.hidden = true; };
  box.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { box.hidden = true; itens[+b.dataset.k][2](); });
}
let CHAT_VOLTA = null;
function fecharSheetSilencioso(){ const p = $("so-pop"); if(p) p.hidden = true; }
function desenhaResp(){ const box = $("cv-resp"); if(!box) return; const r = CHAT && CHAT.resp; box.innerHTML = r ? `<div class="so-quote so-quote-in"><b>Respondendo ${r.autor === NU.uid ? "a você" : esc(nomeP(r.autor).split(" ")[0])}</b><span>${esc(r.tipo === "foto" ? "📷 Foto" : r.tipo === "audio" ? "🎤 Áudio" : (r.texto || "").slice(0, 80))}</span><button class="iconbtn sm" id="cv-rx" aria-label="Cancelar resposta">${ic("close", 13)}</button></div>` : ""; const x = $("cv-rx"); if(x) x.onclick = () => { CHAT.resp = null; desenhaResp(); }; }
async function enviaMsg(c, d){
  if(ME.bloqueado) throw new Error("Sua conta está bloqueada");
  const id = novoId(), base = { id, conversa_id: c.id, autor: NU.uid, tipo: d.tipo || "texto", texto: d.texto || null, criado: new Date().toISOString(), pend: true, previa: d.blob ? URL.createObjectURL(d.blob) : null, resposta_id: d.resposta_id || null, story_id: d.story_id || null, post_id: d.post_id || null, duracao: d.duracao || null };
  const aberto = CHAT && CHAT.c.id === c.id;
  if(aberto){ CHAT.msgs.push(base); desenhaMsgs(true); }
  try{
    let midia = null;
    if(d.blob){ const ext = d.tipo === "audio" ? (/mp4|m4a|aac/.test(d.mime) ? "m4a" : /ogg/.test(d.mime) ? "ogg" : "webm") : "jpg";
      const tipo = d.tipo === "audio" ? (ext === "m4a" ? "audio/mp4" : ext === "ogg" ? "audio/ogg" : "audio/webm") : "image/jpeg";
      midia = await sobe("chat", c.id, d.blob, ext, tipo); }
    const row = { id, conversa_id: c.id, autor: NU.uid, tipo: base.tipo, texto: base.texto, midia, duracao: base.duracao, resposta_id: base.resposta_id, story_id: base.story_id, post_id: base.post_id };
    const r = await q(SB().from("mensagens").insert(row).select());
    if(aberto && CHAT){ const i = CHAT.msgs.findIndex(m => m.id === id); if(i >= 0) CHAT.msgs[i] = r[0]; desenhaMsgs(); }
    SOM.tap(); return r[0];
  }catch(e){
    if(aberto && CHAT){ CHAT.msgs = CHAT.msgs.filter(m => m.id !== id); desenhaMsgs(); }
    toast(/row-level/i.test(String(e && e.message)) ? "Não foi possível enviar. Talvez ela não esteja recebendo mensagens." : /mime|size|payload|too large/i.test(String(e && e.message)) ? "Arquivo não aceito (tipo ou tamanho)." : ERR_MSG(e));
    throw e;
  }
}
setInterval(async () => {
  if(!CHAT || document.visibilityState !== "visible" || $("sheet").hidden || !SO.on()) return;
  const c = CHAT.c, minhas = CHAT.msgs.filter(m => m.autor === NU.uid && !m.pend && !m.lida_em).map(m => m.id);
  try{
    const ult = CHAT.msgs.filter(m => !m.pend).slice(-1)[0];
    const [novas, st] = await Promise.all([
      q(SB().from("mensagens").select("*").eq("conversa_id", c.id).gt("criado", ult ? ult.criado : "1970-01-01").order("criado", { ascending: true }).limit(50)),
      minhas.length ? q(SB().from("mensagens").select("id,entregue_em,lida_em").in("id", minhas.slice(-60))) : Promise.resolve([])]);
    if(!CHAT || CHAT.c.id !== c.id) return;
    let mudou = false;
    st.forEach(x => { const m = CHAT.msgs.find(y => y.id === x.id); if(m && (m.entregue_em !== x.entregue_em || m.lida_em !== x.lida_em)){ m.entregue_em = x.entregue_em; m.lida_em = x.lida_em; mudou = true; } });
    novas.forEach(m => { if(!CHAT.msgs.some(x => x.id === m.id)){ CHAT.msgs.push(m); mudou = true; } });
    if(mudou){ desenhaMsgs(); if(novas.some(m => m.autor !== NU.uid)) marcaLidas(); }
  }catch(e){}
}, 4000);
let LIDAS_T = null;
function marcaLidas(){ clearTimeout(LIDAS_T); LIDAS_T = setTimeout(async () => { if(!CHAT || document.visibilityState !== "visible" || $("sheet").hidden) return; try{ const n = await q(SB().rpc("marcar_lidas", { p_conversa: CHAT.c.id })); if(n) atualizaBadges(); }catch(e){} }, 400); }
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible"){ if(CHAT) marcaLidas(); if(SO.on() && ME) sincroniza(); } });
function verFoto(path){
  let box = $("so-foto"); if(!box){ box = document.createElement("div"); box.id = "so-foto"; box.className = "so-foto priv"; document.body.appendChild(box); }
  box.innerHTML = `<button class="iconbtn" id="sf-x" aria-label="Fechar">${ic("close", 20)}</button><img data-m="${esc(path)}" alt="" draggable="false">`;
  box.hidden = false; ligaMidia(box, 300); $("sf-x").onclick = () => { box.hidden = true; box.innerHTML = ""; }; box.onclick = e => { if(e.target === box){ box.hidden = true; box.innerHTML = ""; } };
}
let AUD = null;
function ligaAudio(el){
  const bt = el.querySelector("button"), bar = el.querySelector("b"), dur = +el.dataset.dur || 0, sm = el.querySelector("small");
  bt.onclick = async () => {
    if(AUD && AUD.el === el){ if(AUD.a.paused) AUD.a.play(); else AUD.a.pause(); return; }
    if(AUD){ AUD.a.pause(); AUD.fim(); }
    const [u] = await urls([el.dataset.aud], 300); if(!u) return toast("Áudio indisponível");
    const a = new Audio(u); a.preload = "auto";
    const fim = () => { bt.innerHTML = ic("play", 16); bar.style.width = "0%"; sm.textContent = fmtDur(dur); };
    AUD = { a, el, fim };
    a.ontimeupdate = () => { const d = isFinite(a.duration) ? a.duration : dur || 1; bar.style.width = Math.min(100, a.currentTime / d * 100) + "%"; sm.textContent = fmtDur(a.currentTime); };
    a.onplay = () => bt.innerHTML = ic("pause", 16); a.onpause = () => bt.innerHTML = ic("play", 16); a.onended = () => { fim(); AUD = null; };
    a.play().catch(() => toast("Não deu para tocar este áudio aqui."));
    el.querySelector("i").onclick = ev => { const r = ev.currentTarget.getBoundingClientRect(), d = isFinite(a.duration) ? a.duration : dur; if(d) a.currentTime = Math.max(0, Math.min(d, (ev.clientX - r.left) / r.width * d)); };
  };
}
function fotoChat(c){
  menuLeve([["camera", "Tirar foto agora", () => pegaFoto("environment")], ["image", "Escolher da galeria", () => pegaFoto(null)]]);
  async function pegaFoto(cap){
    const f = await escolheArquivo("image/*", cap); if(!f) return; const b = await imagemValida(f, 1600); if(!b) return;
    const u = URL.createObjectURL(b); let box = $("so-prev"); if(!box){ box = document.createElement("div"); box.id = "so-prev"; box.className = "so-prev priv"; document.body.appendChild(box); }
    box.innerHTML = `<div class="so-prev-top"><button class="iconbtn" id="pv-x" aria-label="Cancelar">${ic("close", 20)}</button><b>Enviar para ${esc(nomeP(outroDe(c)).split(" ")[0])}</b></div><img src="${u}" alt="" draggable="false"><div class="so-prev-pe"><input class="input" id="pv-t" maxlength="500" placeholder="Escreva uma legenda (opcional)"><button class="btn btn-accent so-env" id="pv-ok" aria-label="Enviar foto">${ic("send", 18)}</button></div>`;
    box.hidden = false; const fecha = () => { box.hidden = true; box.innerHTML = ""; URL.revokeObjectURL(u); };
    $("pv-x").onclick = fecha;
    $("pv-ok").onclick = () => { const t = $("pv-t").value.trim(); fecha(); enviaMsg(c, { tipo: "foto", blob: b, texto: t || null }).catch(() => {}); };
    $("pv-t").onkeydown = e => { if(e.key === "Enter") $("pv-ok").click(); };
  }
}
function menuLeve(itens){
  let box = $("so-pop"); if(!box){ box = document.createElement("div"); box.id = "so-pop"; box.className = "so-pop"; document.body.appendChild(box); }
  box.innerHTML = `<div class="so-pop-in">${itens.map(([i, t, , p], k) => `<button class="so-mi ${p ? "perigo" : ""}" data-k="${k}">${ic(i, 18)}<span>${t}</span></button>`).join("")}<button class="so-mi" data-x>${ic("close", 18)}<span>Cancelar</span></button></div>`;
  box.hidden = false; box.onclick = e => { if(e.target === box || e.target.closest("[data-x]")) box.hidden = true; };
  box.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { box.hidden = true; itens[+b.dataset.k][2](); });
}
async function gravarAudio(c){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return toast("Este navegador não grava áudio. Atualize o navegador ou use Chrome/Safari recentes.");
  let stream; try{ stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }catch(e){ return toast("Permita o microfone para gravar o áudio (toque no cadeado do navegador)."); }
  const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined), partes = []; let ini = Date.now(), tm, raf, cancelado = false, actx = null;
  rec.ondataavailable = e => { if(e.data && e.data.size) partes.push(e.data); };
  const bar = $("cv-bar"), antes = bar.innerHTML; vibra(20);
  bar.innerHTML = `<div class="so-grav"><button class="iconbtn so-gv-x" id="gv-x" aria-label="Apagar gravação">${ic("trash", 19)}</button><div class="so-gv-mid"><span class="so-rec"><i></i><b id="gv-t">0:00</b></span><span class="so-onda" id="gv-onda">${"<i></i>".repeat(18)}</span></div><button class="btn btn-accent so-env" id="gv-ok" aria-label="Parar e revisar">${ic("stop", 16)}</button></div><p class="so-gv-dica">Gravando… toque no quadrado para ouvir antes de enviar</p>`;
  // medidor de voz (só visual, no próprio aparelho)
  try{ actx = new (window.AudioContext || window.webkitAudioContext)(); const an = actx.createAnalyser(); an.fftSize = 64; actx.createMediaStreamSource(stream).connect(an); const d = new Uint8Array(an.frequencyBinCount), barras = [...$("gv-onda").children];
    const anima = () => { an.getByteFrequencyData(d); const m = d.reduce((a, b) => a + b, 0) / d.length / 255; barras.forEach((b, k) => b.style.height = Math.max(4, Math.min(26, 4 + m * 60 * (0.5 + Math.abs(Math.sin(Date.now() / 160 + k))))) + "px"); raf = requestAnimationFrame(anima); }; anima(); }catch(e){}
  const para = () => { clearInterval(tm); cancelAnimationFrame(raf); stream.getTracks().forEach(t => t.stop()); try{ actx && actx.close(); }catch(e){} };
  const volta = () => { bar.innerHTML = antes; abreConversaReligar(c); };
  tm = setInterval(() => { const s = (Date.now() - ini) / 1000; const e = $("gv-t"); if(e) e.textContent = fmtDur(s); if(s >= 120){ toast("Limite de 2 minutos"); $("gv-ok") && $("gv-ok").click(); } }, 250);
  rec.onstop = () => { para(); if(cancelado) return volta(); const dur = Math.round((Date.now() - ini) / 1000); const blob = new Blob(partes, { type: rec.mimeType || mime || "audio/webm" });
    if(dur < 1 || blob.size < 500){ toast("Áudio muito curto. Segure um pouco mais."); return volta(); }
    // revisar antes de enviar: ouvir, apagar ou enviar
    const u = URL.createObjectURL(blob), a = new Audio(u);
    bar.innerHTML = `<div class="so-grav"><button class="iconbtn so-gv-x" id="gr-x" aria-label="Apagar áudio">${ic("trash", 19)}</button><div class="so-aud so-aud-rev"><button class="iconbtn sm" id="gr-play" aria-label="Ouvir">${ic("play", 16)}</button><i><b id="gr-bar"></b></i><small>${fmtDur(dur)}</small></div><button class="btn btn-accent so-env" id="gr-ok" aria-label="Enviar áudio">${ic("send", 18)}</button></div><p class="so-gv-dica">Ouça antes de enviar, se quiser</p>`;
    a.ontimeupdate = () => { const b = $("gr-bar"); if(b) b.style.width = Math.min(100, a.currentTime / (isFinite(a.duration) ? a.duration : dur) * 100) + "%"; };
    a.onended = () => { const pl = $("gr-play"); if(pl) pl.innerHTML = ic("play", 16); };
    $("gr-play").onclick = () => { if(a.paused){ a.play(); $("gr-play").innerHTML = ic("pause", 16); } else { a.pause(); $("gr-play").innerHTML = ic("play", 16); } };
    $("gr-x").onclick = () => { a.pause(); URL.revokeObjectURL(u); volta(); };
    $("gr-ok").onclick = () => { a.pause(); volta(); enviaMsg(c, { tipo: "audio", blob, mime: blob.type, duracao: Math.min(300, dur) }).catch(() => {}); };
    CHAT.rec = null; };
  CHAT.rec = { cancelar: () => { cancelado = true; try{ rec.stop(); }catch(e){ para(); } } };
  $("gv-x").onclick = () => CHAT.rec && CHAT.rec.cancelar(); $("gv-ok").onclick = () => { try{ rec.stop(); }catch(e){} };
  rec.start(250);
}
function abreConversaReligar(c){ if(!CHAT) return; const t = $("cv-t"), env = $("cv-env"), mic = $("cv-mic"); if(!t) return;
  t.oninput = () => { const tem = !!t.value.trim(); env.hidden = !tem; mic.hidden = tem; };
  const manda = async () => { const v = t.value.trim(); if(!v) return; t.value = ""; t.oninput(); const r = CHAT.resp; CHAT.resp = null; desenhaResp(); await enviaMsg(c, { tipo: "texto", texto: v, resposta_id: r ? r.id : null }); };
  env.onclick = manda; t.onkeydown = e => { if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); manda(); } };
  $("cv-foto").onclick = () => fotoChat(c);
  mic.onclick = () => gravarAudio(c); CHAT.rec = null; }

/* ---------- Tempo real + notificações ---------- */
let RT = null, RT_OK = false, NOT_N = 0;
function ligaRealtime(){
  if(!SO.on() || RT) return;
  try{
    RT = SB().channel("ck-" + NU.uid)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, p => aoMensagem(p.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensagens" }, p => aoMsgAtualizada(p.new))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificacoes", filter: `user_id=eq.${NU.uid}` }, p => aoNotificacao(p.new))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notificacoes", filter: `user_id=eq.${NU.uid}` }, p => aoNotificacao(p.new, true))
      .subscribe(st => { RT_OK = st === "SUBSCRIBED"; });
  }catch(e){ RT_OK = false; }
  setInterval(() => { if(document.visibilityState === "visible" && ME && !$("v-app").hidden) sincroniza(!RT_OK); }, 20000);
  sincroniza(true);
}
let ENTREGA_T = null;
function marcaEntregues(){ clearTimeout(ENTREGA_T); ENTREGA_T = setTimeout(() => SB().rpc("marcar_entregues").then(() => {}), 600); }
async function sincroniza(completo){
  if(!SO.on()) return; marcaEntregues(); await atualizaBadges();
  if(completo && CHAT){ const ult = CHAT.msgs.filter(m => !m.pend).slice(-1)[0]; try{ const novas = await q(SB().from("mensagens").select("*").eq("conversa_id", CHAT.c.id).gt("criado", ult ? ult.criado : "1970-01-01").order("criado", { ascending: true }).limit(100)); novas.forEach(m => { if(!CHAT.msgs.some(x => x.id === m.id)) CHAT.msgs.push(m); }); if(novas.length){ desenhaMsgs(); marcaLidas(); } }catch(e){} }
}
async function aoMensagem(m){
  if(!m || !SO.on()) return;
  if(CHAT && CHAT.c.id === m.conversa_id){
    if(!CHAT.msgs.some(x => x.id === m.id)){ CHAT.msgs.push(m); desenhaMsgs(); }
    if(m.autor !== NU.uid){ marcaLidas(); SOM.tap(); }
    return;
  }
  if(m.autor === NU.uid) return;
  marcaEntregues(); atualizaBadges();
  if((ME.silenciadas || []).includes(m.conversa_id)) return;
  await carregaPerfis([m.autor]);
  SOM.chime && SOM.chime();
  aviso(`${avU(m.autor)}<span><b>${esc(nomeP(m.autor).split(" ")[0])}</b> ${m.tipo === "foto" ? "enviou uma foto." : m.tipo === "audio" ? "enviou um áudio." : m.tipo === "story" ? "respondeu seu Story." : "enviou uma mensagem."}</span>`, async () => { const c = (await q(SB().from("conversas").select("*").eq("id", m.conversa_id)))[0]; if(c) abreConversa(c); });
}
function aoMsgAtualizada(m){ if(!CHAT || !m || CHAT.c.id !== m.conversa_id) return; const i = CHAT.msgs.findIndex(x => x.id === m.id); if(i < 0) return; if(m.ocultar_para && m.ocultar_para.includes(NU.uid)){ CHAT.msgs.splice(i, 1); } else CHAT.msgs[i] = m; desenhaMsgs(); }
async function aoNotificacao(n, atualizada){
  atualizaBadges();
  if(!n || n.lida || ["mensagem","story_resposta"].includes(n.tipo) || n.tipo === "conquista") return;
  if(atualizada && Date.now() - new Date(n.criado).getTime() > 15000) return;
  if(n.ator) await carregaPerfis([n.ator]);
  aviso(`${n.ator ? avU(n.ator) : `<span class="pav">${ic("bell", 16)}</span>`}<span>${esc(n.texto || "Nova notificação")}</span>`, () => abreNotificacao(n));
}
async function atualizaBadges(){
  if(!SO.on()) return;
  try{ const r = await SB().from("notificacoes").select("id", { count: "exact", head: true }).eq("user_id", NU.uid).eq("lida", false).not("tipo", "in", "(mensagem,story_resposta)"); NOT_N = r.count || 0; }catch(e){}
  await contaNaoLidas(); const nm = Object.values(NAOLIDAS).reduce((a, b) => a + b, 0);
  const pn = (id, n) => { const e = $(id); if(e){ e.hidden = !n; e.textContent = n > 9 ? "9+" : n; } };
  pn("cm-not-n", NOT_N); pn("cm-chat-n", nm); pn("top-not-n", NOT_N + nm);
  if((NOT_N || nm) && TAB !== "juntas") marcaNovidade(true);
}
const NT_ABA = { todas: () => true, interacoes: n => ["seguiu","solicitou","aceitou","curtida","comentario"].includes(n.tipo), mensagens: n => ["mensagem","story_resposta"].includes(n.tipo), conquistas: n => n.tipo === "conquista" };
let NTA = "todas";
async function abrirNotificacoes(){
  if(!SO.on()) return FORA();
  sheet("Notificações", `<div class="chips scroll">${[["todas","Todas"],["interacoes","Interações"],["mensagens","Mensagens"],["conquistas","Conquistas"]].map(([k, n]) => `<button class="chip" data-na="${k}" aria-pressed="${NTA === k}">${n}</button>`).join("")}</div><div id="nt-l"><div class="post skel" style="height:70px"></div></div>`, () => atualizaBadges());
  $("sheet-body").querySelectorAll("[data-na]").forEach(b => b.onclick = () => { NTA = b.dataset.na; abrirNotificacoes(); });
  let L = []; try{ L = await q(SB().from("notificacoes").select("*").eq("user_id", NU.uid).order("criado", { ascending: false }).limit(60)); }catch(e){ $("nt-l").innerHTML = `<p class="empty">${ERR_MSG(e)}</p>`; return; }
  await carregaPerfis(L.map(n => n.ator).filter(Boolean));
  const V = L.filter(NT_ABA[NTA]), box = $("nt-l"); if(!box) return;
  box.innerHTML = V.length ? V.map(n => `<button class="so-nt ${n.lida ? "" : "nova"}" data-nt="${n.id}">${n.ator ? avU(n.ator) : `<span class="pav so-nt-ic">${n.tipo === "conquista" ? "🏆" : ic("bell", 16)}</span>`}<span><b>${esc(n.texto || "")}</b><small>${tempoAtras(n.criado)}</small></span></button>`).join("")
    : `<div class="empty">${ic("bell", 32, 1.6)}<p>Nada por aqui ainda. Quando alguém seguir, curtir ou comentar, aparece aqui.</p></div>`;
  box.querySelectorAll("[data-nt]").forEach(b => b.onclick = () => abreNotificacao(L.find(n => n.id === b.dataset.nt)));
  const naoLidas = L.filter(n => !n.lida && !["mensagem","story_resposta"].includes(n.tipo)).map(n => n.id);
  if(naoLidas.length) SB().from("notificacoes").update({ lida: true }).in("id", naoLidas).then(() => atualizaBadges());
}
async function abreNotificacao(n){
  if(!n) return;
  if(["seguiu","aceitou"].includes(n.tipo)) return abrirPerfil(n.ator);
  if(n.tipo === "solicitou") return abrirPerfil(NU.uid);
  if(["curtida","comentario"].includes(n.tipo)){ const ps = await feedBusca([n.ref]); return ps[0] ? abrePost(ps[0], n.tipo === "comentario") : toast("Esta publicação não está mais disponível."); }
  if(["mensagem","story_resposta"].includes(n.tipo)){ const c = (await q(SB().from("conversas").select("*").eq("id", n.ref)))[0]; return c ? abreConversa(c) : listaConversas(); }
  if(n.tipo === "conquista") return abrirPerfil(NU.uid);
}

/* ---------- Conquistas (evolução pessoal; nunca peso, corpo ou comparação) ---------- */
const CONQ = [
  ["t1", "t", 1, "🌱", "PRIMEIRO TREINO", "Todo começo é corajoso. Você deu o primeiro passo."],
  ["t10", "t", 10, "💪", "10 TREINOS", "Dez vezes você escolheu cuidar de você."],
  ["t25", "t", 25, "✨", "25 TREINOS", "Constância virando hábito. Que orgulho!"],
  ["t50", "t", 50, "🏅", "50 TREINOS", "Cinquenta treinos. Sua dedicação é inspiradora."],
  ["t100", "t", 100, "🏆", "100 TREINOS", "Cem vezes você apareceu por você."],
  ["t200", "t", 200, "👑", "200 TREINOS", "Uma jornada que já é história."],
  ["s3", "s", 3, "🔥", "3 DIAS SEGUIDOS", "Três dias de cuidado com você."],
  ["s7", "s", 7, "🔥", "7 DIAS DE CONSISTÊNCIA", "Você apareceu por você durante 7 dias."],
  ["s15", "s", 15, "⭐", "15 DIAS DE CONSISTÊNCIA", "Quinze dias seguidos. Isso é compromisso com você."],
  ["s30", "s", 30, "🌟", "30 DIAS DE CONSISTÊNCIA", "Um mês inteiro de evolução."],
  ["s60", "s", 60, "💚", "60 DIAS DE CONSISTÊNCIA", "Sessenta dias. Você é exemplo de constância."]
];
function checaConquistas(){
  const n = (ME.treinos || []).length, s = streak(), primeira = !ME.conq; ME.conq = ME.conq || {};
  const novas = CONQ.filter(c => !ME.conq[c[0]] && (c[1] === "t" ? n >= c[2] : s >= c[2]));
  if(!novas.length) return;
  novas.forEach(c => ME.conq[c[0]] = today()); save();
  if(SO.on()) garantePerfil().then(async () => { const lista = CONQ.filter(c => ME.conq[c[0]]).map(c => ({ k: c[0], d: ME.conq[c[0]] }));
    try{ const rr = await q(SB().from("perfis").update({ conquistas: lista }).eq("user_id", NU.uid).select()); if(rr && rr[0]) EU = rr[0]; }catch(e){}
    novas.forEach(c => SB().from("notificacoes").insert({ user_id: NU.uid, tipo: "conquista", ref: c[0], texto: `Parabéns: ${c[4].toLowerCase()} ${c[3]}` }).then(() => {})); }).catch(() => {});
  if(primeira && n > 1) return;   // quem já tinha histórico: registra sem festa retroativa
  celebrar(novas[novas.length - 1]);
}
async function cartaoConq(c, mostrarUser){
  const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
  try{ await document.fonts.load("800 90px 'Bricolage Grotesque'"); }catch(e){}
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0E3D32"); g.addColorStop(.6, "#2E7D5A"); g.addColorStop(1, "#7BA77A"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalAlpha = .08; x.fillStyle = "#fff"; for(let i = 0; i < 6; i++){ x.beginPath(); x.arc(W * (.15 + i * .17), H * (.2 + (i % 3) * .3), 160 - i * 12, 0, 7); x.fill(); } x.globalAlpha = 1;
  const F1 = "'Bricolage Grotesque','Avenir Next',system-ui,sans-serif", F2 = "Figtree,system-ui,sans-serif";
  x.fillStyle = "#fff"; x.font = `800 58px ${F1}`; x.fillText("CK", 90, 140); const w = x.measureText("CK ").width; x.fillStyle = "#B9DDB2"; x.fillText("Life", 90 + w, 140);
  x.textAlign = "center"; x.font = `200px ${F2}`; x.fillText(c[3], W / 2, 520);
  x.fillStyle = "#fff"; x.font = `800 84px ${F1}`; const pal = c[4].split(" "); let l1 = "", l2 = ""; pal.forEach(p => { if(x.measureText((l1 ? l1 + " " : "") + p).width < W - 160 && !l2) l1 = l1 ? l1 + " " + p : p; else l2 = l2 ? l2 + " " + p : p; });
  x.fillText(l1, W / 2, 700); if(l2) x.fillText(l2, W / 2, 795);
  x.fillStyle = "rgba(255,255,255,.88)"; x.font = `500 44px ${F2}`; x.fillText("Mais uma conquista na minha jornada.", W / 2, l2 ? 900 : 820);
  if(mostrarUser && EU) { x.fillStyle = "#B9DDB2"; x.font = `700 42px ${F2}`; x.fillText("@" + EU.username, W / 2, l2 ? 980 : 900); }
  x.fillStyle = "rgba(255,255,255,.75)"; x.font = `600 34px ${F2}`; x.fillText("Treino em casa para mulheres · cklife.vercel.app", W / 2, H - 80);
  return new Promise(ok => cv.toBlob(ok, "image/jpeg", .9));
}
async function celebrar(c){
  let box = $("celebra"); if(!box){ box = document.createElement("div"); box.id = "celebra"; box.className = "so-celebra"; document.body.appendChild(box); }
  let comUser = true, blob = await cartaoConq(c, comUser);
  box.innerHTML = `<div class="so-cel-in"><div class="so-cel-em">${c[3]}</div><h2>${esc(c[4])}</h2><p>${esc(c[5])}</p>
    <button class="btn btn-accent btn-block btn-lg" id="ce-post">${ic("people", 18)} Postar no CK Life</button>
    <button class="btn btn-share btn-block" id="ce-share">${ic("share", 18)} Compartilhar</button>
    <button class="btn btn-line btn-block" id="ce-ok">Continuar</button>
    <div class="so-cel-q"><p>Quer celebrar com outras mulheres da comunidade?</p><div class="acts"><button class="btn btn-soft btn-sm" id="ce-foto">${ic("camera", 15)} Postar uma foto</button>${SO.on() ? `<label class="so-cel-chk"><input type="checkbox" id="ce-user" checked> Mostrar meu @ no cartão</label>` : ""}</div></div></div>`;
  box.hidden = false; confete && confete(box); SOM.coupon && SOM.coupon();
  const cq = { emoji: c[3], titulo: c[4], frase: c[5], k: c[0] };
  const fecha = () => { box.hidden = true; box.innerHTML = ""; };
  const sai = () => { fecha(); const ok = $("fim-ok"); if(ok && !$("play").hidden) ok.click(); };
  const u = $("ce-user"); if(u) u.onchange = async () => { comUser = u.checked; blob = await cartaoConq(c, comUser); };
  $("ce-ok").onclick = fecha;
  $("ce-post").onclick = () => { sai(); setTimeout(() => abreComposer(`${c[3]} ${c[4].charAt(0) + c[4].slice(1).toLowerCase()}! ${c[5]}`, blob, { conquista: cq }), 350); };
  $("ce-foto").onclick = async () => { const f = await escolheArquivo("image/*"); const b = await imagemValida(f, 1440); if(!b) return; sai(); setTimeout(() => abreComposer(`${c[3]} ${c[4].charAt(0) + c[4].slice(1).toLowerCase()}! `, b, { conquista: cq }), 350); };
  $("ce-share").onclick = async () => { const file = new File([blob], "ck-life-conquista.jpg", { type: "image/jpeg" }), txt = `${c[3]} ${c[4]} no CK Life 💚 ${location.origin}`;
    try{ if(navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: txt }); else if(navigator.share) await navigator.share({ text: txt, url: location.origin }); else copyText(txt, "Texto copiado para compartilhar"); }catch(e){} };
}

/* ---------- Integração com o resto do app ---------- */
async function iniciaSocial(){
  await detectaSocial();
  if(!SO.on()) return;
  garantePerfil().catch(() => {});
  ligaRealtime();
  const qs = new URLSearchParams(location.search), u = qs.get("u");
  if(u){ history.replaceState(null, "", location.pathname); SB().from("perfis").select("user_id").eq("username", u.toLowerCase()).then(r => { const p = r.data && r.data[0]; if(p) abrirPerfil(p.user_id); else toast("Perfil não encontrado"); }); }
}
