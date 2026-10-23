/* ===================== Painel · ANÚNCIOS com imagem 1080x1080 e vídeo até 30 s =====================
   Mídia vai para a pasta "anuncios" do Supabase (leitura pública; envio só por quem pode editar Campanhas — conferido no banco).
   Imagem: recortada ao centro em 1080x1080 e comprimida no navegador. Vídeo: MP4/WebM, até 30 s e 25 MB, com capa gerada. */
const AD_LOC = [["feed", "Feed da comunidade"], ["explorar", "Explorar"], ["inicio", "Início (card discreto)"]];
const AD_FMT = { texto: "Texto", imagem: "Imagem 1080×1080", video: "Vídeo até 30 s" };
const AD_MAX_VIDEO = 25 * 1024 * 1024;
const urlPub = path => SB2().storage.from("anuncios").getPublicUrl(path).data.publicUrl;
async function sobeAnuncio(pasta, blob, ext, tipo){
  const path = `${pasta}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const r = await SB2().storage.from("anuncios").upload(path, blob, { contentType: tipo, cacheControl: "31536000", upsert: false });
  if(r.error) throw r.error; return urlPub(path);
}
/* imagem: recorte central 1:1, 1080 px, WebP (ou JPEG se o navegador não fizer WebP) */
async function preparaImagem(file, lado = 1080){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use uma imagem JPG, PNG ou WebP.");
  if(file.size > 15 * 1024 * 1024) throw new Error("Imagem muito grande (máximo 15 MB).");
  const bmp = await createImageBitmap(file), q = Math.min(bmp.width, bmp.height), cv = document.createElement("canvas");
  cv.width = cv.height = lado; const g = cv.getContext("2d"); g.imageSmoothingQuality = "high";
  g.drawImage(bmp, (bmp.width - q) / 2, (bmp.height - q) / 2, q, q, 0, 0, lado, lado);
  const avisos = []; if(bmp.width !== bmp.height) avisos.push("A imagem não era quadrada: recortamos o centro."); if(q < lado) avisos.push(`A imagem tem ${q} px; o ideal é 1080×1080 para ficar nítida.`);
  let blob = await new Promise(ok => cv.toBlob(ok, "image/webp", .86)), ext = "webp", mime = "image/webp";
  if(!blob || blob.type !== "image/webp"){ blob = await new Promise(ok => cv.toBlob(ok, "image/jpeg", .86)); ext = "jpg"; mime = "image/jpeg"; }
  return { blob, ext, mime, avisos, url: URL.createObjectURL(blob) };
}
/* vídeo: confere tipo, tamanho e duração; tira uma capa para carregar leve */
function preparaVideo(file){
  return new Promise((ok, no) => {
    if(!/^video\/(mp4|webm)$/.test(file.type)) return no(new Error("Use um vídeo MP4 ou WebM."));
    if(file.size > AD_MAX_VIDEO) return no(new Error(`Vídeo muito pesado (${(file.size / 1048576).toFixed(1)} MB). O máximo é 25 MB: exporte em 720p ou 1080p.`));
    const v = document.createElement("video"), u = URL.createObjectURL(file); v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = u;
    v.onerror = () => no(new Error("Não foi possível ler este vídeo."));
    v.onloadedmetadata = () => { if(!isFinite(v.duration) || v.duration > 30.5) return no(new Error(`O vídeo tem ${Math.round(v.duration)} s. O máximo é 30 segundos.`)); v.currentTime = Math.min(.8, v.duration / 3); };
    v.onseeked = () => { const w = Math.min(1080, v.videoWidth), h = Math.round(w * v.videoHeight / v.videoWidth), cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(v, 0, 0, w, h);
      cv.toBlob(capa => ok({ file, capa, dur: v.duration, prop: +(v.videoWidth / v.videoHeight).toFixed(3), url: u, avisos: v.videoWidth < 720 ? ["Resolução baixa: o ideal é pelo menos 720 px de largura."] : [] }), "image/jpeg", .8); };
  });
}
vCampanhas = function(){
  const db = DB(), hoje = today();
  const noAr = c => c.ativa && c.inicio <= hoje && (!c.fim || c.fim >= hoje);
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Anúncios</h1><p class="muted">Cards integrados ao Feed, Explorar e Início, com imagem, vídeo ou texto. Só aparecem para quem usa o plano grátis a partir do 31º dia, nunca durante treino, chat ou telas de segurança.</p></div><button class="btn btn-accent needs-edit" id="cp-new">+ Novo anúncio</button></div>
    <div class="grid g3">${kpi("No ar agora", int(db.campanhas.filter(noAr).length), "", "campanhas", 1)}${kpi("Com imagem ou vídeo", int(db.campanhas.filter(c => c.midia).length))}${kpi("Pausados ou fora do período", int(db.campanhas.filter(c => !noAr(c)).length))}</div>
    ${db.campanhas.length ? `<div class="adm-adlist">${db.campanhas.map(c => { const on = noAr(c); return `<div class="adm-adrow">
      <span class="adm-adth">${c.formato === "imagem" && c.midia ? `<img src="${esc(c.midia)}" alt="" loading="lazy">` : c.formato === "video" && c.capa ? `<img src="${esc(c.capa)}" alt="" loading="lazy"><i>${aic("campanhas", 14)}</i>` : aic("campanhas", 20)}</span>
      <span class="adm-adtx"><b>${esc(c.titulo || "(sem título)")}</b>${ex(c)}<small>${esc(anuNome(c.anunc) || "Sem anunciante")} · ${AD_FMT[c.formato || "texto"]} · ${(c.locais && c.locais.length ? c.locais : ["feed", "explorar"]).map(l => (AD_LOC.find(x => x[0] === l) || [, l])[1].split(" (")[0]).join(", ")}</small><small>${brD(c.inicio)}${c.fim ? " a " + brD(c.fim) : " em diante"} · ${GEN[c.genero] || "Todos"}${c.cidade ? " · " + esc(cidNome(c.cidade)) : ""}</small></span>
      <span class="st ${on ? "ok" : c.ativa ? "warn" : "off"}">${on ? "No ar" : c.ativa ? "Fora do período" : "Pausado"}</span>
      <span class="acts needs-edit"><button class="btn btn-line btn-sm" data-ed="${c.id}">Editar</button><button class="btn btn-line btn-sm" data-dup="${c.id}">Duplicar</button></span></div>`; }).join("")}</div>`
    : `<div class="card adm-vazio"><span>${aic("campanhas", 28)}</span><b>Nenhum anúncio ainda</b><p class="muted">Cadastre um anunciante e crie o primeiro anúncio com imagem ou vídeo.</p><button class="btn btn-accent btn-sm needs-edit" id="cp-new2">Criar anúncio</button></div>`}`;
  const n = $("cp-new"), n2 = $("cp-new2"); if(n) n.onclick = () => formCamp(); if(n2) n2.onclick = () => formCamp();
  $("adm-main").querySelectorAll("[data-ed]").forEach(b => b.onclick = () => formCamp(db.campanhas.find(c => c.id === b.dataset.ed)));
  $("adm-main").querySelectorAll("[data-dup]").forEach(b => b.onclick = () => { const c = db.campanhas.find(x => x.id === b.dataset.dup); db.campanhas.push({ ...c, id: F.uid(), titulo: (c.titulo || "Anúncio") + " (cópia)", ativa: false, exemplo: false }); save(); toast("Anúncio duplicado (pausado)"); rerender(); });
};
VIEWS.campanhas = vCampanhas;
formCamp = function(c){
  if(!DB().anunciantes.length){ toast("Cadastre um anunciante primeiro"); return ir("anunciantes"); }
  c = c || { anunc: "", titulo: "", texto: "", destino: "whatsapp", botao: "Falar no WhatsApp", whats: "", msg: "Oi! Vi seu anúncio no CK Life.", insta: "", site: "", genero: "todos", idMin: "", idMax: "", cidade: "", inicio: today(), fim: "", ativa: true, formato: "imagem", locais: ["feed", "explorar"] };
  const M = { formato: c.formato || (c.midia ? "imagem" : "texto"), midia: c.midia || "", capa: c.capa || "", prop: c.prop || 1, dur: c.dur || 0, novo: null }, locais = c.locais && c.locais.length ? c.locais : ["feed", "explorar"];
  modal(c.id ? "Editar anúncio" : "Novo anúncio", `<div class="ad-form"><div class="formgrid">
    <div class="field full"><label for="fc-a">Anunciante</label><select class="input" id="fc-a">${optAnu(c.anunc)}</select></div>
    <div class="field full"><label>Formato</label><div class="seg-pills" id="fc-fmt">${Object.entries(AD_FMT).map(([k, n]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="${M.formato === k}">${n}</button>`).join("")}</div></div>
    <div class="field full" id="fc-mid"><label>Arquivo</label><div class="ad-up"><input type="file" id="fc-file" hidden><button type="button" class="btn btn-line" id="fc-pick">${aic("pdf", 16)} Escolher arquivo</button><span class="hint" id="fc-fh"></span></div><div id="fc-av"></div></div>
    <div class="field full"><label for="fc-t">Título (opcional)</label><input class="input" id="fc-t" value="${esc(c.titulo)}" maxlength="70"></div>
    <div class="field full"><label for="fc-x">Texto curto (opcional, até 140 letras)</label><textarea class="input" id="fc-x" maxlength="140">${esc(c.texto)}</textarea></div>
    <div class="field"><label for="fc-d">O botão leva para</label><select class="input" id="fc-d">${Object.entries(DEST).map(([k, n]) => `<option value="${k}" ${c.destino === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="field"><label for="fc-b">Texto do botão (CTA)</label><input class="input" id="fc-b" value="${esc(c.botao)}" maxlength="28"></div>
    <div class="field dz dz-whatsapp"><label for="fc-w">WhatsApp da empresa com DDD</label><input class="input" id="fc-w" value="${esc(c.whats)}" inputmode="tel"></div>
    <div class="field dz dz-whatsapp"><label for="fc-m">Mensagem que já vem escrita</label><input class="input" id="fc-m" value="${esc(c.msg)}"></div>
    <div class="field full dz dz-instagram"><label for="fc-i">@ do Instagram</label><input class="input" id="fc-i" value="${esc(c.insta)}"></div>
    <div class="field full dz dz-site"><label for="fc-s">Endereço do site</label><input class="input" id="fc-s" value="${esc(c.site)}" placeholder="https://"></div>
    <div class="field full"><label>Onde aparece</label><div class="seg-pills" id="fc-loc">${AD_LOC.map(([k, n]) => `<button type="button" class="chip" data-l="${k}" aria-pressed="${locais.includes(k)}">${n}</button>`).join("")}</div></div>
    <div class="field"><label for="fc-g">Público</label><select class="input" id="fc-g"><option value="todos" ${c.genero === "todos" ? "selected" : ""}>Todos</option><option value="feminino" ${c.genero === "feminino" ? "selected" : ""}>Só mulheres</option><option value="masculino" ${c.genero === "masculino" ? "selected" : ""}>Só homens</option></select></div>
    <div class="field"><label for="fc-c">Cidade</label><select class="input" id="fc-c">${optCid(c.cidade, true)}</select></div>
    <div class="field"><label for="fc-i1">Idade mínima</label><input class="input num" id="fc-i1" value="${esc(c.idMin)}" inputmode="numeric"></div>
    <div class="field"><label for="fc-i2">Idade máxima</label><input class="input num" id="fc-i2" value="${esc(c.idMax)}" inputmode="numeric"></div>
    <div class="field"><label for="fc-ini">Começa em</label><input class="input" type="date" id="fc-ini" value="${esc(c.inicio)}"></div>
    <div class="field"><label for="fc-fim">Termina em (opcional)</label><input class="input" type="date" id="fc-fim" value="${esc(c.fim)}"></div>
    <label class="field full xf-chk"><input type="checkbox" id="fc-on" ${c.ativa ? "checked" : ""}> Anúncio ativo</label>
  </div><aside class="ad-prev"><span class="eyebrow">Prévia no app</span><div id="fc-prev"></div></aside></div>
  <div id="fc-msg"></div><div class="toolbar" style="justify-content:space-between">${c.id ? `<button class="btn btn-bad" id="fc-del">Excluir</button>` : "<span></span>"}<button class="btn btn-accent" id="fc-ok">Salvar anúncio</button></div>`);
  $("mbox").classList.add("mbox-wide");
  const dados = () => ({ anunc: val("fc-a"), titulo: val("fc-t"), texto: val("fc-x"), destino: val("fc-d"), botao: val("fc-b") || "Saiba mais", whats: val("fc-w"), msg: val("fc-m"), insta: val("fc-i"), site: val("fc-s"), genero: val("fc-g"), cidade: +val("fc-c") || "", idMin: +val("fc-i1") || "", idMax: +val("fc-i2") || "", inicio: val("fc-ini") || today(), fim: val("fc-fim"), ativa: val("fc-on"),
    formato: M.formato, locais: [...$("fc-loc").querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.l) });
  const prev = () => { const d = dados(), an = DB().anunciantes.find(a => a.id === d.anunc) || { nome: "Anunciante" };
    const midia = M.novo ? M.novo.url : M.midia, capa = M.novo && M.novo.capaUrl ? M.novo.capaUrl : M.capa;
    $("fc-prev").innerHTML = window.FV && window.FV.CKAD ? window.FV.CKAD.card({ ...d, midia, capa, prop: M.novo ? M.novo.prop : M.prop }, an) : (window.CKAD ? window.CKAD.card({ ...d, midia, capa, prop: M.novo ? M.novo.prop : M.prop }, an) : "");
    const v = $("fc-prev").querySelector("video"); if(v){ v.src = v.dataset.src; v.preload = "metadata"; const p = $("fc-prev").querySelector(".adx-play"); const t = e => { e.preventDefault(); v.paused ? v.play() : v.pause(); }; if(p) p.onclick = t; v.onclick = t; v.onplay = () => v.closest(".adx").classList.add("tocando"); v.onpause = () => v.closest(".adx").classList.remove("tocando"); const s = $("fc-prev").querySelector(".adx-som"); if(s) s.onclick = e => { e.preventDefault(); v.muted = !v.muted; }; }
    $("fc-prev").querySelectorAll("a").forEach(a => a.onclick = e => e.preventDefault()); };
  const fmtUI = () => { $("fc-fmt").querySelectorAll("[data-f]").forEach(b => b.setAttribute("aria-pressed", b.dataset.f === M.formato)); $("fc-mid").hidden = M.formato === "texto";
    $("fc-file").accept = M.formato === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp";
    $("fc-fh").textContent = M.formato === "video" ? "MP4 ou WebM · até 30 s · até 25 MB" : "JPG, PNG ou WebP · recortamos em 1080×1080"; prev(); };
  $("fc-fmt").querySelectorAll("[data-f]").forEach(b => b.onclick = () => { if(M.formato !== b.dataset.f){ M.formato = b.dataset.f; if(!(M.novo && M.novo.tipo === M.formato) && !(c.formato === M.formato && c.midia)) { M.novo = null; } } fmtUI(); });
  $("fc-loc").querySelectorAll("[data-l]").forEach(b => b.onclick = () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); prev(); });
  $("fc-pick").onclick = () => $("fc-file").click();
  $("fc-file").onchange = async e => { const f = e.target.files[0]; e.target.value = ""; if(!f) return; $("fc-av").innerHTML = `<div class="skel" style="height:16px;width:60%"></div>`;
    try{
      if(M.formato === "video"){ const v = await preparaVideo(f); M.novo = { ...v, tipo: "video", capaUrl: v.capa ? URL.createObjectURL(v.capa) : "" }; }
      else { const i = await preparaImagem(f); M.novo = { ...i, tipo: "imagem" }; }
      $("fc-av").innerHTML = M.novo.avisos && M.novo.avisos.length ? `<div class="msg msg-warn">${M.novo.avisos.map(esc).join("<br>")}</div>` : `<div class="msg msg-ok">Arquivo pronto. Ele é enviado quando você salvar.</div>`; prev();
    }catch(er){ $("fc-av").innerHTML = `<div class="msg msg-bad">${esc(er.message || "Arquivo inválido")}</div>`; }
  };
  ["fc-a", "fc-t", "fc-x", "fc-b", "fc-d"].forEach(id => $(id).addEventListener("input", prev));
  const dz = () => $("mbox").querySelectorAll(".dz").forEach(e => e.hidden = !e.classList.contains("dz-" + val("fc-d")));
  $("fc-d").addEventListener("change", dz); dz(); fmtUI();
  $("fc-ok").onclick = async () => {
    const d = dados(), temMidia = !!(M.novo || (c.midia && c.formato === M.formato));
    const err = !d.anunc ? "Escolha o anunciante." : M.formato !== "texto" && !temMidia ? "Escolha o arquivo do anúncio." : M.formato === "texto" && !d.titulo ? "No formato texto, escreva o título." : !d.locais.length ? "Escolha pelo menos um lugar onde o anúncio aparece."
      : d.destino === "whatsapp" && String(d.whats).replace(/\D/g, "").length < 10 ? "Informe o WhatsApp com DDD." : d.destino === "instagram" && !d.insta ? "Informe o @ do Instagram." : d.destino === "site" && !/^https?:\/\/|^[\w-]+\.[\w.-]+/.test(d.site) ? "Informe o endereço do site." : d.fim && d.fim < d.inicio ? "A data final é antes da inicial." : "";
    if(err){ $("fc-msg").innerHTML = `<div class="msg msg-bad">${err}</div>`; return; }
    const bt = $("fc-ok"); bt.disabled = true; bt.textContent = "Enviando…";
    try{
      if(M.novo){
        if(!SB2()) throw new Error("Envio de mídia funciona no app oficial, com o banco conectado.");
        if(M.novo.tipo === "imagem"){ d.midia = await sobeAnuncio("img", M.novo.blob, M.novo.ext, M.novo.mime); d.capa = ""; d.prop = 1; d.dur = 0; }
        else { d.midia = await sobeAnuncio("video", M.novo.file, M.novo.file.type === "video/webm" ? "webm" : "mp4", M.novo.file.type); d.capa = M.novo.capa ? await sobeAnuncio("capa", M.novo.capa, "jpg", "image/jpeg") : ""; d.prop = M.novo.prop; d.dur = Math.round(M.novo.dur); }
      } else if(M.formato === "texto"){ d.midia = ""; d.capa = ""; }
      else { d.midia = c.midia; d.capa = c.capa || ""; d.prop = c.prop || 1; d.dur = c.dur || 0; }
      if(c.id) Object.assign(c, d); else DB().campanhas.push({ id: F.uid(), ...d });
      save(); fechar(); toast(c.id ? "Anúncio atualizado" : "Anúncio criado"); rerender();
    }catch(er){ bt.disabled = false; bt.textContent = "Salvar anúncio"; $("fc-msg").innerHTML = `<div class="msg msg-bad">Não foi possível enviar: ${esc(er.message || er.error || "erro")}. Confira se o SQL da Central foi rodado.</div>`; }
  };
  const del = $("fc-del"); if(del) del.onclick = () => confirmar("Excluir este anúncio? Ele sai do app na hora.", () => { DB().campanhas = DB().campanhas.filter(x => x.id !== c.id); save(); toast("Anúncio excluído"); rerender(); });
};
