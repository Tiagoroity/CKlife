
/* ===================== FIGURINHAS CK LIFE (catálogo único) =====================
   Fonte: cartelas oficiais da pasta fotos-ck-life, recortadas (img/figurinhas). Um catálogo para Stories, chat,
   comentários, comunidade e reações. O admin ativa/desativa e cadastra novas sem mexer no código.
   Favoritas e recentes ficam na conta da aluna (ME.figFav / ME.figRec) e valem em todos os lugares. */
const FCAT = { L: null, cats: [], t: 0, prom: null };
async function catalogo(){
  if(FCAT.L && Date.now() - FCAT.t < 600000) return FCAT.L;
  if(FCAT.prom) return FCAT.prom;
  FCAT.prom = (async () => {
    let L = null, cats = [];
    try{ const j = await (await fetch("img/figurinhas/catalogo.json", { cache: "force-cache" })).json(); L = j.figurinhas; cats = j.categorias; }catch(e){ L = []; }
    if(NU.ativo && NU.sb){ try{ const r = await NU.sb.from("figurinhas_catalogo").select("*").order("ordem"); if(!r.error && r.data && r.data.length) L = r.data; }catch(e){} }
    FCAT.L = (L || []).filter(f => f.ativa !== false); FCAT.cats = cats.length ? cats : FCAT.cats; FCAT.t = Date.now(); FCAT.prom = null; return FCAT.L;
  })();
  return FCAT.prom;
}
const FIG_CATS = [["motivacao", "Motivação"], ["treino", "Treino"], ["conquistas", "Conquistas"], ["constancia", "Constância"], ["humor", "Humor"], ["reacoes", "Reações"], ["comunidade", "Comunidade"], ["autocuidado", "Autocuidado"], ["ciclo", "Ciclo e bem-estar"], ["ck", "CK Life"]];
const figUrl = f => /^https?:/.test(f.arquivo) ? f.arquivo : f.arquivo;
const figMini = f => f.mini || f.arquivo;
/* figurinhas com número só aparecem quando o número é verdade para ela (ex.: "7 dias de constância" com sequência >= 7) */
const figVale = f => { const d = (f.tags || []).find(t => t.startsWith("dado:sequencia:")); return !d || streak() >= +d.split(":")[2]; };
const ONDE = { story: "em_stories", chat: "em_chat", comentario: "em_comentarios", comunidade: "em_comunidade", reacao: "em_reacoes" };
async function figsPara(onde){ return (await catalogo()).filter(f => f[ONDE[onde] || "em_stories"] !== false && figVale(f)); }
const figFav = () => ME.figFav || [], figRec = () => ME.figRec || [];
function figUsada(f, onde){
  ME.figRec = [f.id, ...figRec().filter(x => x !== f.id)].slice(0, 24); save();
  if(NU.ativo && NU.sb) NU.sb.rpc("registra_figurinha", { p_id: f.id, p_onde: onde }).then(() => {}, () => {});
}
function figFavorita(id){ const on = !figFav().includes(id); ME.figFav = on ? [id, ...figFav()] : figFav().filter(x => x !== id); save(); vibra(10); toast(on ? "Favoritada ♥" : "Removida das favoritas"); return on; }
/* ordem por contexto (sem IA): o que faz sentido primeiro */
const CTX = {
  posTreino: { abas: ["voce", "conquistas", "treino", "constancia", "ck", "humor"], tag: "pos-treino" },
  story: { abas: ["voce", "recentes", "favoritas", "motivacao", "humor", "ck", "treino", "conquistas", "constancia", "comunidade", "autocuidado", "ciclo", "reacoes"] },
  chat: { abas: ["recentes", "favoritas", "reacoes", "humor", "comunidade", "motivacao", "treino", "ck", "autocuidado"] },
  comentario: { abas: ["recentes", "favoritas", "apoio", "reacoes", "humor", "conquistas", "comunidade", "motivacao"], tag: "apoio" },
  comunidade: { abas: ["voce", "recentes", "favoritas", "treino", "conquistas", "motivacao", "humor", "comunidade", "ck"] },
  ciclo: { abas: ["autocuidado", "ciclo", "recentes", "favoritas"], tag: "acolhimento" }
};
const NOME_ABA = { voce: "Para você", recentes: "Recentes", favoritas: "Favoritas", apoio: "Apoio", ...Object.fromEntries(FIG_CATS) };
function filtraAba(L, aba, ctx){
  const por = ids => ids.map(id => L.find(f => f.id === id)).filter(Boolean);
  if(aba === "recentes") return por(figRec());
  if(aba === "favoritas") return por(figFav());
  if(aba === "apoio") return L.filter(f => (f.tags || []).includes("apoio") || f.categoria === "comunidade");
  if(aba === "voce"){ const tg = (CTX[ctx] || {}).tag; const base = tg ? L.filter(f => (f.tags || []).includes(tg)) : L.filter(f => f.destaque);
    return [...new Map([...por(figFav()), ...base, ...por(figRec())].map(f => [f.id, f])).values()].slice(0, 40); }
  return L.filter(f => f.categoria === aba || (f.tags || []).includes(aba));
}
/* seletor (bottom sheet próprio, por cima do que estiver aberto) */
async function escolheFigurinha(onde, ctx){
  const L = await figsPara(onde);
  return new Promise(fim => {
    let box = $("fg-sel"); if(!box){ box = document.createElement("div"); box.id = "fg-sel"; box.className = "fg-sel"; document.body.appendChild(box); }
    const abas = (CTX[ctx || onde] || CTX.story).abas.filter(a => ["voce", "recentes", "favoritas"].includes(a) || filtraAba(L, a, ctx).length);
    let aba = abas.find(a => filtraAba(L, a, ctx || onde).length) || abas[0], busca = "";
    box.innerHTML = `<div class="fg-sel-in" role="dialog" aria-label="Figurinhas"><div class="fg-sel-top"><b>Figurinhas</b><button class="iconbtn sm" id="fs-x" aria-label="Fechar">${ic("close", 16)}</button></div>
      <div class="search fg-busca">${ic("search", 16)}<input class="input" id="fs-q" placeholder="Buscar figurinha" autocomplete="off"></div>
      <div class="chips scroll" id="fs-abas"></div><div class="fg-sel-grid" id="fs-g"></div><p class="hint fg-dica">Toque para usar · segure para favoritar ♥</p></div>`;
    box.hidden = false;
    const sai = v => { box.hidden = true; box.innerHTML = ""; fim(v); };
    const desenha = () => {
      $("fs-abas").innerHTML = busca ? "" : abas.map(a => `<button class="chip" data-ab="${a}" aria-pressed="${a === aba}">${a === "favoritas" ? "♥ " : ""}${NOME_ABA[a] || a}</button>`).join("");
      const n = s => unicodedata(s);
      const V = busca ? L.filter(f => n(f.nome + " " + (f.tags || []).join(" ") + " " + f.categoria).includes(n(busca))) : filtraAba(L, aba, ctx || onde);
      $("fs-g").innerHTML = V.length ? V.map(f => `<button class="fg-it ${figFav().includes(f.id) ? "fav" : ""}" data-f="${f.id}" aria-label="${esc(f.nome)}"><img src="${esc(figMini(f))}" alt="${esc(f.nome)}" loading="lazy" draggable="false"></button>`).join("")
        : `<p class="hint fg-vazio">${aba === "favoritas" ? "Segure uma figurinha para favoritar ♥" : aba === "recentes" ? "As figurinhas que você usar aparecem aqui." : "Nada encontrado."}</p>`;
      $("fs-abas").querySelectorAll("[data-ab]").forEach(b => b.onclick = () => { aba = b.dataset.ab; desenha(); });
      $("fs-g").querySelectorAll("[data-f]").forEach(b => { const f = L.find(x => x.id === b.dataset.f); let tm, longo = false;
        b.onpointerdown = () => { longo = false; tm = setTimeout(() => { longo = true; const on = figFavorita(f.id); b.classList.toggle("fav", on); }, 520); };
        b.onpointerup = b.onpointerleave = () => clearTimeout(tm);
        b.oncontextmenu = e => e.preventDefault();
        b.onclick = () => { if(longo) return; b.classList.add("pop"); vibra(8); sai(f); }; });
    };
    $("fs-x").onclick = () => sai(null); box.onclick = e => { if(e.target === box) sai(null); };
    let tq; $("fs-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { busca = e.target.value.trim(); desenha(); }, 150); };
    desenha();
  });
}
const unicodedata = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const figCarrega = src => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = no; i.src = src; });

/* ---------- selos com dados reais (só números verdadeiros da aluna) ---------- */
function selosReais(extra){
  const s = streak(), n = (ME.treinos || []).length, sem = semanaAtualDias(), feitos = diasTreino(), nSem = sem.filter(d => feitos.has(d)).length, meta = (ME.perfil && ME.perfil.dias) || 3, L = [];
  if(extra && extra.treino) L.push(["🔥", "Treino concluído", `${extra.treino.nome} · ${extra.treino.min} min`]);
  if(s >= 2) L.push(["🔥", `${s} dias de sequência`, "Constância on"]);
  if(n >= 1) L.push(["💪", `${n} ${n === 1 ? "treino" : "treinos"}`, "no CK Life"]);
  if(nSem >= 2) L.push(["📅", `${nSem} treinos essa semana`, nSem >= meta ? "Meta da semana concluída" : `Meta: ${meta}`]);
  return L;
}
function seloCanvas([emo, tit, sub]){
  const S = 640, c = document.createElement("canvas"); c.width = S; c.height = 300; const x = c.getContext("2d");
  x.shadowColor = "rgba(0,0,0,.22)"; x.shadowBlur = 18; x.shadowOffsetY = 4;
  x.fillStyle = "#fff"; x.beginPath(); x.roundRect ? x.roundRect(14, 14, S - 28, 272, 46) : x.rect(14, 14, S - 28, 272); x.fill(); x.shadowBlur = 0; x.shadowOffsetY = 0;
  const g = x.createLinearGradient(0, 0, S, 300); g.addColorStop(0, "#0E3D32"); g.addColorStop(1, "#2E7D5A"); x.fillStyle = g;
  x.beginPath(); x.roundRect ? x.roundRect(26, 26, S - 52, 248, 38) : x.rect(26, 26, S - 52, 248); x.fill();
  x.textAlign = "center"; x.font = "64px system-ui"; x.fillText(emo, S / 2, 100);
  x.fillStyle = "#fff"; x.font = "800 50px 'Bricolage Grotesque',system-ui"; x.fillText(tit, S / 2, 172, S - 90);
  x.fillStyle = "#B9DDB2"; x.font = "600 30px Figtree,system-ui"; x.fillText(sub, S / 2, 222, S - 90);
  return c.toDataURL("image/png");
}

/* ===================== EDITOR DE STORY ===================== */
async function editorStory(base, opt){
  opt = opt || {};
  let box = $("st-ed"); if(!box){ box = document.createElement("div"); box.id = "st-ed"; box.className = "st-ed priv"; document.body.appendChild(box); }
  const fundoU = base ? URL.createObjectURL(base) : null;
  const camadas = []; let sel = null;
  box.innerHTML = `<div class="st-top"><button class="iconbtn" id="se-x" aria-label="Cancelar">${ic("close", 20)}</button><span class="st-acoes" id="se-acoes" hidden><button class="iconbtn" id="se-frente" aria-label="Trazer para frente">${ic("plus", 18)}</button><button class="iconbtn" id="se-dup" aria-label="Duplicar">⧉</button><button class="iconbtn st-lixo" id="se-del" aria-label="Excluir">${ic("trash", 18)}</button></span></div>
    <div class="st-palco" id="se-p">${fundoU ? `<img class="st-fundo" src="${fundoU}" alt="" draggable="false">` : `<div class="st-fundo st-grad"></div>`}<div class="st-camadas" id="se-c"></div><span class="st-ass">CK <b>Life</b></span></div>
    <div class="st-barra"><button id="se-fig"><i>✨</i><small>Figurinhas</small></button><button id="se-txt"><i>Aa</i><small>Texto</small></button>${selosReais(opt.dados).length ? `<button id="se-dad"><i>🔥</i><small>Meus dados</small></button>` : ""}<button id="se-pub" class="st-pub"><b>Publicar</b></button></div>`;
  box.hidden = false; document.body.style.overflow = "hidden";
  const palco = $("se-p"), cam = $("se-c");
  const fecha = () => { box.hidden = true; box.innerHTML = ""; document.body.style.overflow = ""; if(fundoU) URL.revokeObjectURL(fundoU); };
  const aplica = l => { l.el.style.transform = `translate(-50%,-50%) translate(${l.x * palco.clientWidth}px,${l.y * palco.clientHeight}px) rotate(${l.r}rad) scale(${l.s})`; };
  const seleciona = l => { sel = l; camadas.forEach(k => k.el.classList.toggle("sel", k === l)); $("se-acoes").hidden = !l; };
  const adiciona = (tipo, conteudo, extra) => {
    const el = document.createElement("div"); el.className = "st-cam st-" + tipo;
    if(tipo === "fig") el.innerHTML = `<img src="${esc(conteudo)}" alt="" draggable="false">`; else { el.textContent = conteudo; el.style.background = extra.cor; }
    cam.appendChild(el);
    const l = { tipo, conteudo, el, x: .5 + (Math.random() - .5) * .12, y: .42 + (Math.random() - .5) * .12, s: 1, r: (Math.random() - .5) * .18, cor: extra && extra.cor, fig: extra && extra.fig };
    camadas.push(l); aplica(l); seleciona(l); gestos(l); vibra(8); return l;
  };
  function gestos(l){
    const P = new Map(); let ini = null;
    const estado = () => { const v = [...P.values()]; if(v.length === 1) return { cx: v[0].x, cy: v[0].y, d: 0, a: 0 }; const [a, b] = v; return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, d: Math.hypot(b.x - a.x, b.y - a.y), a: Math.atan2(b.y - a.y, b.x - a.x) }; };
    const reinicia = () => { ini = { e: estado(), x: l.x, y: l.y, s: l.s, r: l.r }; };
    l.el.addEventListener("pointerdown", e => { e.stopPropagation(); l.el.setPointerCapture(e.pointerId); P.set(e.pointerId, { x: e.clientX, y: e.clientY }); seleciona(l); reinicia(); });
    l.el.addEventListener("pointermove", e => { if(!P.has(e.pointerId)) return; P.set(e.pointerId, { x: e.clientX, y: e.clientY }); const e2 = estado(), W = palco.clientWidth, H = palco.clientHeight;
      l.x = Math.min(1.1, Math.max(-.1, ini.x + (e2.cx - ini.e.cx) / W)); l.y = Math.min(1.1, Math.max(-.1, ini.y + (e2.cy - ini.e.cy) / H));
      if(P.size >= 2 && ini.e.d){ l.s = Math.min(5, Math.max(.25, ini.s * e2.d / ini.e.d)); l.r = ini.r + (e2.a - ini.e.a); }
      aplica(l); });
    const solta = e => { P.delete(e.pointerId); if(P.size) reinicia(); };
    l.el.addEventListener("pointerup", solta); l.el.addEventListener("pointercancel", solta);
    l.el.addEventListener("wheel", e => { e.preventDefault(); l.s = Math.min(5, Math.max(.25, l.s * (e.deltaY < 0 ? 1.08 : .92))); aplica(l); }, { passive: false });
  }
  palco.addEventListener("pointerdown", e => { if(e.target === palco || e.target.classList.contains("st-fundo") || e.target === cam) seleciona(null); });
  $("se-x").onclick = () => { if(camadas.length && !confirm("Descartar este Story?")) return; fecha(); };
  $("se-del").onclick = () => { if(!sel) return; sel.el.remove(); camadas.splice(camadas.indexOf(sel), 1); seleciona(null); vibra(12); };
  $("se-dup").onclick = () => { if(!sel) return; const l = adiciona(sel.tipo, sel.conteudo, { cor: sel.cor, fig: sel.fig }); Object.assign(l, { s: sel.s, r: sel.r, x: sel.x + .05, y: sel.y + .05 }); aplica(l); };
  $("se-frente").onclick = () => { if(!sel) return; cam.appendChild(sel.el); camadas.push(camadas.splice(camadas.indexOf(sel), 1)[0]); };
  $("se-fig").onclick = async () => { const f = await escolheFigurinha("story", opt.contexto || "story"); if(!f) return; const l = adiciona("fig", figUrl(f), { fig: f }); l.s = .9; aplica(l); };
  const dd = $("se-dad"); if(dd) dd.onclick = () => { const L = selosReais(opt.dados);
    menuLeve(L.map(s => ["star", `${s[0]} ${s[1]}`, () => { const l = adiciona("fig", seloCanvas(s), {}); l.s = 1.15; l.y = .8; aplica(l); }])); };
  $("se-txt").onclick = () => {
    const cores = CORES_ST; let cor = cores[0];
    const t = document.createElement("div"); t.className = "st-txt-ed"; t.innerHTML = `<input class="input" maxlength="80" placeholder="Escreva aqui" id="se-ti"><div class="so-cores">${cores.map(c => `<button style="background:${c}" data-c="${c}" aria-label="Cor"></button>`).join("")}</div><button class="btn btn-accent" id="se-tok">Pronto</button>`;
    box.appendChild(t); $("se-ti").focus();
    t.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { cor = b.dataset.c; t.querySelectorAll("[data-c]").forEach(y => y.setAttribute("aria-pressed", y === b)); });
    const ok = () => { const v = $("se-ti").value.trim(); t.remove(); if(v) adiciona("txt", v, { cor }); };
    $("se-tok").onclick = ok; $("se-ti").onkeydown = e => { if(e.key === "Enter") ok(); };
  };
  if(opt.inicial) for(const f of opt.inicial){ const l = adiciona("fig", figUrl(f), { fig: f }); l.s = .8; l.y = .3; aplica(l); }
  seleciona(null);
  $("se-pub").onclick = async () => {
    const bt = $("se-pub"); bt.disabled = true; bt.classList.add("carregando");
    try{
      const final = await renderStory(base, camadas, palco);
      if(!SO.on()) throw Object.assign(new Error("Entre na comunidade para publicar Stories"), { nosso: true });
      await garantePerfil(); const midia = await sobe("story", NU.uid, final, "jpg", "image/jpeg");
      await q(SB().from("stories").insert({ user_id: NU.uid, midia, texto: null, cor: CORES_ST[0] }));
      camadas.filter(l => l.fig && l.fig.id).forEach(l => figUsada(l.fig, "story"));
      SOM.done ? SOM.done() : SOM.check(); vibra([30, 40, 30]); fecha(); carregaStories();
      posPublicar(final);
    }catch(e){ console.warn(e); toast(e.nosso ? e.message : ERR_MSG(e)); bt.disabled = false; bt.classList.remove("carregando"); }
  };
}
async function renderStory(base, camadas, palco){
  const W = 1080, H = 1920, c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  if(base){ const im = await figCarrega(URL.createObjectURL(base)); const k = Math.max(W / im.width, H / im.height); x.drawImage(im, (W - im.width * k) / 2, (H - im.height * k) / 2, im.width * k, im.height * k); }
  else { const g = x.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, "#0B2A22"); g.addColorStop(.55, "#1F5C46"); g.addColorStop(1, "#6E9E6D"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  const k = W / palco.clientWidth;
  for(const l of camadas){
    x.save(); x.translate(l.x * W, l.y * H); x.rotate(l.r); x.scale(l.s, l.s);
    const r = l.el.getBoundingClientRect(), w0 = l.el.offsetWidth * k, h0 = l.el.offsetHeight * k; void r;
    if(l.tipo === "fig"){ try{ const im = await figCarrega(l.conteudo); x.drawImage(im, -w0 / 2, -h0 / 2, w0, h0); }catch(e){} }
    else { x.fillStyle = l.cor; x.beginPath(); x.roundRect ? x.roundRect(-w0 / 2, -h0 / 2, w0, h0, 18 * k) : x.rect(-w0 / 2, -h0 / 2, w0, h0); x.fill();
      x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = `800 ${Math.round(parseFloat(getComputedStyle(l.el).fontSize) * k)}px 'Bricolage Grotesque',system-ui`; x.fillText(l.conteudo, 0, 2 * k, w0 - 20 * k); }
    x.restore();
  }
  // assinatura discreta
  x.font = "800 34px 'Bricolage Grotesque',system-ui"; x.textAlign = "right"; x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 8;
  x.fillStyle = "rgba(255,255,255,.92)"; const w1 = x.measureText("Life").width; x.fillText("Life", W - 44, H - 60); x.fillStyle = "rgba(255,255,255,.92)"; x.fillText("CK ", W - 44 - w1, H - 60);
  return new Promise(ok => c.toBlob(ok, "image/jpeg", .9));
}
function posPublicar(blob){
  if(!$("play").hidden) fimPlay();   // saiu do treino concluído: fecha o treino e mostra o resultado
  const u = URL.createObjectURL(blob);
  sheet("Story publicado 💚", `<div class="xe-st-prev"><img src="${u}" alt="Seu Story"></div><p class="hint" style="text-align:center">Fica no ar por 24 horas no CK Life.</p>
    ${navigator.share ? `<button class="btn btn-accent btn-block btn-lg" id="pp-sh">${ic("share", 18)} Compartilhar no Instagram, WhatsApp…</button>` : `<button class="btn btn-accent btn-block btn-lg" id="pp-dl">Salvar imagem</button>`}
    <button class="btn btn-line btn-block" id="pp-ok">Concluir</button>`, () => URL.revokeObjectURL(u));
  const sh = $("pp-sh"); if(sh) sh.onclick = async () => { const file = new File([blob], "ck-life-story.jpg", { type: "image/jpeg" });
    try{ if(navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: "Create. Keep. Live. 💚 #CKLife" }); else await navigator.share({ text: "Create. Keep. Live. 💚 " + location.origin }); }catch(e){} };
  const dl = $("pp-dl"); if(dl) dl.onclick = () => { const a = document.createElement("a"); a.href = u; a.download = "ck-life-story.jpg"; document.body.appendChild(a); a.click(); a.remove(); };
  $("pp-ok").onclick = fecharSheet;
}
/* Story pelo botão "+" passa a abrir o editor (fotos); vídeo continua no fluxo de vídeo */
const criarStoryE = criarStory;
criarStory = async function(){
  if(ME.bloqueado) return toast("Sua conta está bloqueada");
  const f = await escolheArquivo("image/*,video/*"); if(!f) return;
  if(/^video\//.test(f.type || "")) return storyVideo(f);
  let b = await imagemValida(f, 1920); if(!b) return; b = await escolheFiltro(b); if(!b) return;
  editorStory(b, { contexto: "story" });
};
void criarStoryE;
/* ---------- depois do treino: compartilhar minha conquista ---------- */
async function compartilharConquista(t){
  const dados = { treino: t };
  const inicial = async () => { const L = await figsPara("story"); return ["hoje-teve", "create-keep-live"].map(id => L.find(f => f.id === id)).filter(Boolean).slice(0, 1); };
  menuLeve([["camera", "Tirar uma selfie", async () => { const f = await escolheArquivo("image/*", "user"); if(!f) return; let b = await imagemValida(f, 1920); if(!b) return; b = await escolheFiltro(b); if(b) editorStory(b, { contexto: "posTreino", dados, inicial: await inicial() }); }],
    ["image", "Escolher uma foto", async () => { const f = await escolheArquivo("image/*"); if(!f) return; let b = await imagemValida(f, 1920); if(!b) return; b = await escolheFiltro(b); if(b) editorStory(b, { contexto: "posTreino", dados, inicial: await inicial() }); }],
    ["star", "Sem foto (fundo CK Life)", async () => editorStory(null, { contexto: "posTreino", dados, inicial: await inicial() })]]);
}
setTimeout(() => { catalogo().catch(() => {}); }, 4000);
