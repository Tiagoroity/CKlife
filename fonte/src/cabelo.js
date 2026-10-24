/* ===================== CABELO PARA TREINAR (módulo novo; liberado pelo painel) =====================
   Visível só quando o servidor diz (meus_recursos: desativado | beta | ativado). Qualquer falha = escondido.
   Administradora pode pré-visualizar com ?preview=cabelo (não deixa público). Conteúdo carregado só ao abrir. */
const CAB = { vis: false, prev: false, L: null, passos: {}, favs: new Set(), carregou: false, sel: { tipo: "", comp: "", treino: "", tempo: 0, dif: "", fix: "" }, lembrar: false, mais: false, rec: null };
const CAB_TIPOS = [["liso", "Liso"], ["ondulado", "Ondulado"], ["cacheado", "Cacheado"], ["crespo", "Crespo"]];
const CAB_COMP = [["curto", "Curto"], ["medio", "Médio"], ["longo", "Longo"], ["muito_longo", "Muito longo"]];
const CAB_TREINOS = [["musculacao", "Musculação"], ["corrida", "Corrida"], ["caminhada", "Caminhada"], ["bike", "Bike"], ["funcional", "Funcional"], ["cross", "Cross Training"], ["yoga", "Yoga"], ["pilates", "Pilates"], ["danca", "Dança"], ["intenso", "Treino intenso"], ["leve", "Treino leve"]];
const CAB_DIF = { facil: "Fácil", media: "Média", avancada: "Avançada" }, CAB_FIX = { leve: "Fixação leve", media: "Fixação média", alta: "Fixação alta" };
const CAB_ACS = { scrunchie: "Scrunchie", elastico: "Elástico", faixa: "Faixa esportiva", bandana: "Bandana", grampos: "Grampos", presilhas: "Presilhas", pente: "Pente", toalha: "Toalha" };
const CAB_VISTA = { front: "vista de frente", side: "vista lateral", back: "vista de trás", detail: "detalhe" };
const CAB_INTENSO = new Set(["corrida", "cross", "funcional", "intenso", "danca"]), CAB_LEVE = new Set(["yoga", "pilates", "caminhada", "leve"]);
const cabNome = (L, k) => (L.find(x => x[0] === k) || [, k])[1];
const cabOn = () => CAB.vis || CAB.prev;

/* ---------- visibilidade (servidor manda; erro = escondido) ---------- */
async function cabVisibilidade(){
  try{ const r = await SB().rpc("meus_recursos"); CAB.vis = !r.error && !!(r.data && r.data.cabelo === true); }catch(e){ CAB.vis = false; }
  try{ if(/[?&]preview=cabelo\b/.test(location.search) && ME && ME.admin){ sessionStorage.setItem("ck_prev_cabelo", "1"); history.replaceState(null, "", location.pathname + location.hash); } CAB.prev = !!(ME && ME.admin && sessionStorage.getItem("ck_prev_cabelo") === "1"); }catch(e){ CAB.prev = false; }
  if(cabOn()){ if(TAB === "inicio") rInicio(); else if(TAB === "perfil") rPerfil(); if(CAB.prev && /abrir-cabelo/.test(location.hash)) abreCabelo(); }
}
{ let n = 0; const t = setInterval(() => { if(NU.ativo && NU.sb && NU.uid && ME){ clearInterval(t); cabVisibilidade(); } else if(++n > 60) clearInterval(t); }, 1500); }

/* ---------- dados (sob demanda) ---------- */
const cabTenta = async f => { try{ return (await f()) || []; }catch(e){ return []; } };
async function cabCarrega(){
  if(CAB.carregou) return CAB.L;
  const [p, f, pr] = await Promise.all([
    q(SB().from("penteados").select("id,nome,slug,descricao,familia,tipos,comprimentos,treinos,minutos,dificuldade,fixacao,acessorios,thumb,imagem,video_url,destaque,ordem,status").order("ordem")),
    cabTenta(() => q(SB().from("penteado_favoritos").select("penteado_id").eq("user_id", NU.uid))),
    cabTenta(() => q(SB().from("cabelo_prefs").select("tipo,comprimento").eq("user_id", NU.uid)))
  ]);
  CAB.L = (p || []).filter(x => x.status === "publicado"); CAB.favs = new Set(f.map(x => x.penteado_id));
  if(pr[0]){ CAB.lembrar = true; if(!CAB.sel.tipo) CAB.sel.tipo = pr[0].tipo || ""; if(!CAB.sel.comp) CAB.sel.comp = pr[0].comprimento || ""; }
  CAB.carregou = true; return CAB.L;
}
async function cabPassos(id){
  if(CAB.passos[id]) return CAB.passos[id];
  const L = await q(SB().from("penteado_passos").select("numero,titulo,instrucao,midia,vista").eq("penteado_id", id).order("numero")); CAB.passos[id] = L || []; return CAB.passos[id];
}

/* ---------- recomendação: tipo, comprimento, treino, intensidade, fixação e tempo ---------- */
function cabNota(p, s){
  if(s.tipo && !p.tipos.includes(s.tipo)) return -1;
  if(s.comp && !p.comprimentos.includes(s.comp)) return -1;
  if(s.tempo && p.minutos > s.tempo) return -1;
  if(s.dif && p.dificuldade !== s.dif) return -1;
  if(s.fix && p.fixacao !== s.fix) return -1;
  let n = 1;
  if(s.treino){ if(p.treinos.includes(s.treino)) n += 4; else return -1; }
  if(s.treino && CAB_INTENSO.has(s.treino)) n += p.fixacao === "alta" ? 2 : p.fixacao === "media" ? 1 : -1;
  if(s.treino && CAB_LEVE.has(s.treino)) n += p.fixacao === "alta" ? 0 : 1;
  if(s.treino === "bike" && /baixo|nuca/i.test(p.nome + " " + p.descricao)) n += 2;
  if(["yoga", "pilates"].includes(s.treino) && /lateral|deitada|baixo/i.test(p.nome + " " + p.descricao)) n += 1.5;
  if(p.destaque) n += .5;
  n += Math.max(0, 1 - p.minutos / 10);
  return n;
}
const cabLista = s => (CAB.L || []).map(p => ({ p, n: cabNota(p, s) })).filter(x => x.n >= 0).sort((a, b) => b.n - a.n || a.p.ordem - b.p.ordem).map(x => x.p);

/* ---------- telas ---------- */
/* foto/vídeo do painel tem prioridade; sem mídia, ilustração própria do CK Life (cabelo-arte.js) */
const cabMidia = (url, rot, cls, p, opt) => url ? `<img class="${cls}" src="${esc(url)}" alt="${esc(rot)}" loading="lazy" decoding="async">` : p && window.CKCABARTE ? `<span class="${cls} cab-desenho">${window.CKCABARTE(p, { tipo: CAB.sel.tipo, ...(opt || {}) })}</span>` : `<span class="${cls} cab-pend" role="img" aria-label="Mídia pendente">${ic("camera", 22, 1.6)}<small>Mídia pendente</small></span>`;
const cabCard = (p, destaque) => `<article class="cab-card ${destaque ? "rec" : ""}" data-pt="${p.id}">
    <div class="cab-cm">${cabMidia(p.thumb || p.imagem, p.nome, "cab-img", p)}</div>
    <div class="cab-cb">${destaque ? `<span class="cab-rec-tag">✨ Hoje você vai de…</span>` : ""}<b>${esc(p.nome)}</b><p>${esc(p.descricao || "")}</p>
      <div class="cab-meta"><span>${ic("clock", 13)} ${p.minutos} min</span><span>${CAB_DIF[p.dificuldade]}</span><span>${CAB_FIX[p.fixacao]}</span></div>
      <small class="cab-tr">${p.treinos.slice(0, 3).map(t => cabNome(CAB_TREINOS, t)).join(" • ")}</small>
      <div class="cab-act"><button class="btn btn-accent btn-sm" data-tut="${p.id}">Ver tutorial</button><button class="cab-fav ${CAB.favs.has(p.id) ? "on" : ""}" data-fav="${p.id}" aria-pressed="${CAB.favs.has(p.id)}" aria-label="${CAB.favs.has(p.id) ? "Remover dos meus penteados" : "Salvar em meus penteados"}">${ic("heart", 18)}</button></div></div></article>`;
const cabChips = (L, k, atual) => `<div class="cab-chips" role="group">${L.map(([v, n]) => `<button class="chip" data-k="${k}" data-v="${v}" aria-pressed="${atual === v}">${n}</button>`).join("")}</div>`;
async function abreCabelo(){
  if(!cabOn()) return;
  registraEvento && registraEvento("cabelo_aberto");
  sheet("Cabelo para Treinar", `<div class="cab" id="cab"><div class="cab-skel"><div class="skel" style="height:120px;border-radius:22px"></div><div class="skel" style="height:16px;width:60%;margin-top:16px"></div><div class="skel" style="height:44px;margin-top:10px"></div></div></div>`);
  try{ await cabCarrega(); }catch(e){ const b = $("cab"); if(b) b.innerHTML = `<div class="card empty">Não deu para carregar agora. Tente de novo em instantes.</div>`; return; }
  cabTela();
}
function cabTela(){
  const box = $("cab"); if(!box) return; const s = CAB.sel, L = cabLista(s), algo = s.tipo || s.comp || s.treino;
  const rec = CAB.rec && L.find(p => p.id === CAB.rec), lista = rec ? [rec, ...L.filter(p => p !== rec)] : L;
  box.innerHTML = `${CAB.prev && !CAB.vis ? `<div class="cab-prev">${ic("star", 15)} Pré-visualização: só você está vendo. Para as alunas o módulo segue desativado.</div>` : ""}
    <section class="cab-hero"><span class="eyebrow">Novo no CK Life</span><h2>Cabelo para Treinar</h2><p>Seu cabelo. Seu treino. Seu jeito.</p>
      <button class="cab-meus" id="cab-meus">${ic("heart", 16)} Meus penteados${CAB.favs.size ? ` <b>${CAB.favs.size}</b>` : ""}</button></section>
    <section class="cab-q"><h3>Como está seu cabelo hoje?</h3>${cabChips(CAB_TIPOS, "tipo", s.tipo)}${cabChips(CAB_COMP, "comp", s.comp)}
      <label class="cab-lem"><input type="checkbox" id="cab-lem" ${CAB.lembrar ? "checked" : ""}> Lembrar meu tipo e comprimento</label></section>
    <section class="cab-q"><h3>Qual é o treino de hoje?</h3>${cabChips(CAB_TREINOS, "treino", s.treino)}
      <button class="link cab-mais" id="cab-mais" aria-expanded="${CAB.mais}">${CAB.mais ? "Menos filtros" : "Mais filtros"}</button>
      <div class="cab-filtros" ${CAB.mais ? "" : "hidden"}>
        <small>Tempo disponível</small>${cabChips([[2, "Até 2 min"], [5, "Até 5 min"], [10, "Até 10 min"]], "tempo", s.tempo)}
        <small>Dificuldade</small>${cabChips(Object.entries(CAB_DIF), "dif", s.dif)}
        <small>Fixação</small>${cabChips(Object.entries(CAB_FIX).map(([k, n]) => [k, n.replace("Fixação ", "")]), "fix", s.fix)}</div></section>
    <button class="btn btn-accent btn-block btn-lg cab-escolhe" id="cab-esc">Escolhe por mim ✨</button>
    <section class="cab-res" aria-live="polite">${algo ? `<p class="cab-msg">${L.length ? "Selecionamos opções para o seu treino de hoje." : ""}</p>` : `<h3>Penteados para treinar</h3>`}
      ${lista.length ? `<div class="cab-grid">${lista.slice(0, algo ? 12 : 8).map(p => cabCard(p, p === rec)).join("")}</div>` : `<div class="card cab-vazio"><b>Ainda não encontramos uma opção perfeita para essa combinação.</b><button class="btn btn-line btn-sm" id="cab-outras">Ver outras opções</button></div>`}</section>
    <section class="card cab-cuid"><h3>Cuidados no treino</h3><ul>
      <li>Evite acessórios muito apertados: firme não precisa doer.</li><li>Evite prender o cabelo muito molhado com muita força.</li>
      <li>Prefira elásticos confortáveis, como scrunchies e elásticos sem metal.</li><li>Depois de treinos intensos, deixe o couro cabeludo respirar quando puder.</li></ul></section>
    <section class="cab-kit"><h3>Seu kit de treino</h3><div class="cab-kitc">${Object.values(CAB_ACS).map(n => `<span>${esc(n)}</span>`).join("")}</div></section>`;
  box.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { const k = b.dataset.k, v = k === "tempo" ? +b.dataset.v : b.dataset.v; s[k] = s[k] === v ? (k === "tempo" ? 0 : "") : v; CAB.rec = null; SOM.tap(); if(CAB.lembrar && (k === "tipo" || k === "comp")) cabSalvaPrefs(); cabTela(); });
  $("cab-lem").onchange = e => { CAB.lembrar = e.target.checked; cabSalvaPrefs(); toast(CAB.lembrar ? "Vamos lembrar do seu cabelo" : "Preferência apagada"); };
  $("cab-mais").onclick = () => { CAB.mais = !CAB.mais; cabTela(); };
  $("cab-esc").onclick = () => { const R = cabLista(s); if(!R.length) return toast("Escolha outro filtro para eu sugerir"); const top = R.slice(0, 3); CAB.rec = top[Math.floor(Math.random() * top.length)].id; SOM.chime && SOM.chime(); registraEvento && registraEvento("cabelo_recomendado"); cabTela(); const r = box.querySelector(".cab-card.rec"); if(r) r.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const ou = $("cab-outras"); if(ou) ou.onclick = () => { s.treino = ""; s.tempo = 0; s.dif = ""; s.fix = ""; cabTela(); };
  $("cab-meus").onclick = cabMeus;
  cabLiga(box);
}
function cabLiga(box){
  box.querySelectorAll("[data-tut]").forEach(b => b.onclick = () => cabTutorial(b.dataset.tut));
  box.querySelectorAll("[data-fav]").forEach(b => b.onclick = e => { e.stopPropagation(); cabFav(b.dataset.fav, b); });
}
async function cabFav(id, b){
  const on = !CAB.favs.has(id); on ? CAB.favs.add(id) : CAB.favs.delete(id); vibra && vibra(10);
  document.querySelectorAll(`[data-fav="${id}"]`).forEach(x => { x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); x.classList.add("pulsa"); setTimeout(() => x.classList.remove("pulsa"), 350); });
  try{ if(on) await q(SB().from("penteado_favoritos").insert({ penteado_id: id })); else await q(SB().from("penteado_favoritos").delete().eq("penteado_id", id).eq("user_id", NU.uid)); toast(on ? "Salvo em Meus penteados" : "Removido de Meus penteados"); }
  catch(e){ on ? CAB.favs.delete(id) : CAB.favs.add(id); toast("Não deu para salvar agora"); }
}
async function cabSalvaPrefs(){
  try{ if(CAB.lembrar) await q(SB().from("cabelo_prefs").upsert({ user_id: NU.uid, tipo: CAB.sel.tipo || null, comprimento: CAB.sel.comp || null, atualizado: new Date().toISOString() })); else await q(SB().from("cabelo_prefs").delete().eq("user_id", NU.uid)); }catch(e){}
}
function cabMeus(){
  const L = (CAB.L || []).filter(p => CAB.favs.has(p.id));
  sheet("Meus penteados", L.length ? `<div class="cab-grid" id="cab-meus-l">${L.map(p => cabCard(p)).join("")}</div>` : `<div class="card cab-vazio">${ic("heart", 26, 1.6)}<b>Nenhum penteado salvo ainda</b><p class="hint" style="margin:0">Toque no coração para guardar os seus favoritos aqui.</p></div>`, () => { if($("cab")) cabTela(); });
  const b = $("cab-meus-l"); if(b) cabLiga(b);
  if(!$("cab")) setTimeout(() => {}, 0);
}
async function cabTutorial(id){
  const p = (CAB.L || []).find(x => x.id === id); if(!p) return;
  registraEvento && registraEvento("cabelo_tutorial", { penteado: p.slug });
  sheet(p.nome, `<div class="cab-tut" id="cab-tut"><div class="skel" style="height:200px;border-radius:22px"></div></div>`, () => abreCabelo());
  let S = []; try{ S = await cabPassos(id); }catch(e){}
  const box = $("cab-tut"); if(!box) return;
  box.innerHTML = `<div class="cab-thero">${cabMidia(p.imagem || p.thumb, p.nome, "cab-timg", p)}</div>
    <p class="cab-tdesc">${esc(p.descricao || "")}</p>
    <div class="cab-meta"><span>${ic("clock", 13)} ${p.minutos} min</span><span>${CAB_DIF[p.dificuldade]}</span><span>${CAB_FIX[p.fixacao]}</span></div>
    ${p.acessorios.length ? `<p class="cab-prec"><b>Você vai precisar:</b> ${p.acessorios.map(a => esc(CAB_ACS[a] || a)).join(", ")}</p>` : ""}
    ${p.video_url ? `<button class="btn btn-line btn-block" id="cab-vid">${ic("play", 16)} Ver tutorial</button><div id="cab-vbox"></div>` : ""}
    <ol class="cab-passos">${S.map(x => `<li class="cab-passo"><div class="cab-pm">${cabMidia(x.midia, `Passo ${x.numero}, ${CAB_VISTA[x.vista] || ""}`, "cab-pimg", p, { vista: x.vista, passo: x.numero })}<span class="cab-vista">${esc(CAB_VISTA[x.vista] || "")}</span></div><div><span class="eyebrow">${x.numero >= 5 && /^(Resultado|Lado|Visto|Detalhe)/.test(x.titulo || "") ? "Resultado" : "Passo " + x.numero}</span><b>${esc(x.titulo || "")}</b><p>${esc(x.instrucao)}</p></div></li>`).join("")}</ol>
    <div class="cab-fim"><b>Pronta para treinar. 💚</b><div class="cab-act"><button class="cab-fav lg ${CAB.favs.has(p.id) ? "on" : ""}" data-fav="${p.id}" aria-pressed="${CAB.favs.has(p.id)}" aria-label="Salvar">${ic("heart", 18)} Salvar</button>${typeof abreComposer === "function" && SO.on() ? `<button class="btn btn-line btn-sm" id="cab-look">Mostrar meu look no CK Life</button>` : ""}</div></div>`;
  cabLiga(box);
  const v = $("cab-vid"); if(v) v.onclick = () => { $("cab-vbox").innerHTML = `<video class="cab-video" src="${esc(p.video_url)}" controls playsinline preload="metadata"></video>`; v.remove(); $("cab-vbox").querySelector("video").play().catch(() => {}); };
  const lk = $("cab-look"); if(lk) lk.onclick = () => { fecharSheet(); abreComposer(`Hoje fui de ${p.nome} no treino 💚 #CabeloParaTreinar`); };
}

/* ---------- onde aparece: Início (card) e Perfil (perto do Meu Ciclo) ---------- */
const rInicioCab = rInicio; rInicio = function(){ rInicioCab.apply(this, arguments); if(!cabOn()) return; const box = $("t-inicio"), alvo = box && (box.querySelector(".pa-conv") || box.querySelector(".today")); if(!alvo || box.querySelector(".cab-ini")) return;
  alvo.insertAdjacentHTML("afterend", `<button class="cab-ini" id="cab-ini"><span class="cab-ini-ic">${ic("star", 20, 2)}</span><span><b>Quero treinar. E o cabelo?</b><small>Penteados rápidos para o treino de hoje</small></span>${ic("back", 16)}</button>`);
  $("cab-ini").onclick = () => { if(!CAB.sel.treino){ const t = treinoDoDia(); const n = (t && t.nome || "").toLowerCase(); CAB.sel.treino = /hiit|cardio|queima|intens/.test(n) ? "intenso" : /mobil|along/.test(n) ? "leve" : "funcional"; } abreCabelo(); }; };
const rPerfilCab = rPerfil; rPerfil = function(){ rPerfilCab.apply(this, arguments); if(!cabOn()) return; const c = $("px-ciclo"); if(!c || $("px-cab")) return;
  c.insertAdjacentHTML("afterend", setRow("px-cab", "star", "Cabelo para Treinar", "Penteados rápidos para cada treino")); $("px-cab").onclick = abreCabelo; };
