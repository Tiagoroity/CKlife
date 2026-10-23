
/* ===================== EMOJIS, FIGURINHAS E FILTROS =====================
   Painel no chat: emojis, figurinhas do CK Life (humor da mulher que treina) e figurinhas criadas com as próprias fotos.
   Filtros de foto feitos no próprio aparelho (nada é enviado antes de ela escolher). */
const EMO = [
  ["😊", "😀😃😄😁😆😅🤣😂🙂😉😊😇🥰😍🤩😘😗😚😙🥲😋😛😜🤪😝🤗🤭🫢🤫🤔🫡🤐🤨😐😑😶🫥😏😒🙄😬😮‍💨🤥😌😔😪🤤😴😷🤒🤕🤢🤮🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕🫤😟🙁😮😯😲😳🥺🥹😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈💀💩🤡👻👽🤖😺😸😹😻😼😽🙀😿😾🙈🙉🙊"],
  ["👋", "👋🤚🖐️✋🖖🫱🫲🫳🫴👌🤌🤏✌️🤞🫰🤟🤘🤙👈👉👆🖕👇☝️🫵👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💅🤳💪🦵🦶👂👃🧠👀👁️👅👄💋🫦👶👧🧒👦👩🧑👨👩‍🦱👩‍🦰👱‍♀️👩‍🦳👩‍🦲👵🙍‍♀️🙎‍♀️🙅‍♀️🙆‍♀️💁‍♀️🙋‍♀️🧏‍♀️🙇‍♀️🤦‍♀️🤷‍♀️👩‍⚕️👩‍🍳👩‍💻👩‍🏫👸🤰🤱👯‍♀️💃🧘‍♀️🏃‍♀️🚶‍♀️🏋️‍♀️🤸‍♀️🚴‍♀️🏊‍♀️🧗‍♀️🤾‍♀️⛹️‍♀️"],
  ["💚", "💚❤️🩷🧡💛💙🩵💜🖤🩶🤍🤎❤️‍🔥❤️‍🩹❣️💕💞💓💗💖💘💝💟♥️💌💋✨⭐🌟💫🔥💥💯✅☑️✔️❌❗❓💤💢💦💨🎉🎊🎈🎁🏆🥇🥈🥉🏅🎖️👑💎"],
  ["🥗", "🍎🍏🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🥑🥦🥬🥒🌶️🫑🌽🥕🧄🧅🥔🍠🥐🍞🥖🧀🥚🍳🥞🧇🥓🍗🍖🌭🍔🍟🍕🥪🌮🌯🥗🍝🍜🍣🍱🍚🍙🍘🍥🥟🍤🍦🍧🍨🍩🍪🎂🍰🧁🍫🍬🍭🍮🍯🥛☕🍵🧃🥤🧋🍹🍷🥂💧🧊"],
  ["🌸", "🌸🌺🌻🌼🌷🌹🥀💐🌿🍀🍃🌱🌵🌴🌳🌲🍂🍁🌾🌊🌈☀️🌤️⛅🌥️🌦️🌧️⛈️🌩️❄️☃️⛄🌙🌛🌜🌚🌝🌞⭐🪐🌍🦋🐝🐞🐢🐶🐱🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🦄🐴🐬🐳🐠🦩🦚"],
  ["🏋️", "🏋️‍♀️🤸‍♀️🧘‍♀️🏃‍♀️🚴‍♀️🏊‍♀️⛹️‍♀️🥊🥋🎽👟👙👗👚👖🩱🩳🧢👜🎒🕶️💄💍🪞🧴🧼🪥🛁🛌⏰⏱️⌛📅📆📍🗺️🏠🏡🏢🏖️⛰️🚗✈️🎧🎵🎶📸📱💻📚✏️💡🧸🪴🕯️🎀🛍️💸💰🩺💊🩹🌡️"]
];
function rotulo(x, txt, cx, y, cor, maxW){
  x.font = "800 66px 'Bricolage Grotesque','Avenir Next',system-ui,sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  const pal = txt.split(" "), L = []; let l = ""; pal.forEach(p => { const t = l ? l + " " + p : p; if(x.measureText(t).width > maxW){ L.push(l); l = p; } else l = t; }); L.push(l);
  const lh = 72, w = Math.min(maxW, Math.max(...L.map(t => x.measureText(t).width))) + 44, h = L.length * lh + 26, y0 = y - h / 2;
  x.fillStyle = "#fff"; x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2 - 8, y0 - 8, w + 16, h + 16, 30) : x.rect(cx - w / 2 - 8, y0 - 8, w + 16, h + 16); x.fill();
  x.fillStyle = cor; x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2, y0, w, h, 24) : x.rect(cx - w / 2, y0, w, h); x.fill();
  x.fillStyle = "#fff"; L.forEach((t, i) => x.fillText(t, cx, y0 + 13 + lh / 2 + i * lh));
}
const MINHAS = { get(){ try{ return JSON.parse(localStorage.getItem("ck_fig_" + ME.id) || "[]"); }catch(e){ return []; } }, set(L){ try{ localStorage.setItem("ck_fig_" + ME.id, JSON.stringify(L.slice(0, 16))); }catch(e){ toast("Sem espaço para guardar mais figurinhas"); } } };
const RECENTES = { get(){ try{ return JSON.parse(localStorage.getItem("ck_emo") || "[]"); }catch(e){ return []; } }, add(e){ const L = [e, ...RECENTES.get().filter(x => x !== e)].slice(0, 24); try{ localStorage.setItem("ck_emo", JSON.stringify(L)); }catch(er){} } };
const dataBlob = u => fetch(u).then(r => r.blob());
const separa = s => window.Intl && Intl.Segmenter ? [...new Intl.Segmenter("pt", { granularity: "grapheme" }).segment(s)].map(x => x.segment) : Array.from(s);
let PAN = { aba: "emo", cat: 0, fcat: null };
function ligaEmoji(c){
  const cin = document.querySelector("#cv-bar .so-cin"); if(!cin || $("cv-emo")) return;
  $("cv-foto").insertAdjacentHTML("afterend", `<button class="iconbtn" id="cv-emo" aria-label="Emojis e figurinhas"><span style="font-size:20px;line-height:1">😊</span></button>`);
  $("cv-emo").onclick = e => { e.preventDefault(); const p = $("fg-pan"); if(p){ p.remove(); return; }
    const t = $("cv-t"); if(t) t.blur();   // painel no lugar do teclado, nunca os dois juntos
    $("cv-bar").insertAdjacentHTML("afterbegin", `<div class="fg-pan" id="fg-pan"></div>`); desenhaPainel(c); rolaFim(); };
  const t = $("cv-t"); if(t && !t.dataset.tec){ t.dataset.tec = 1; t.addEventListener("focus", () => { const p = $("fg-pan"); if(p) p.remove(); setTimeout(rolaFim, 350); }); }
  const m = $("cv-m"); if(m && !m.dataset.tec){ m.dataset.tec = 1; m.addEventListener("pointerdown", fechaTeclado); }
  const h = document.querySelector("#sheet .xp-chathead"); if(h && !h.dataset.tec){ h.dataset.tec = 1; h.addEventListener("pointerdown", fechaTeclado); }
}
/* tocar ou arrastar na conversa esconde o teclado e o painel de emojis */
function fechaTeclado(){ const t = $("cv-t"); if(t && document.activeElement === t) t.blur(); const p = $("fg-pan"); if(p) p.remove(); }
function rolaFim(){ const m = $("cv-m"); if(m) requestAnimationFrame(() => { m.scrollTop = m.scrollHeight; }); }
async function desenhaPainel(c){
  const p = $("fg-pan"); if(!p) return;
  const abas = `<div class="fg-abas"><button data-ab="emo" aria-pressed="${PAN.aba === "emo"}">😊 Emojis</button><button data-ab="fig" aria-pressed="${PAN.aba === "fig"}">✨ Figurinhas</button><button data-ab="minhas" aria-pressed="${PAN.aba === "minhas"}">📸 Minhas</button></div>`;
  let corpo = "";
  if(PAN.aba === "emo"){ const rec = RECENTES.get(), cats = [["🕘", rec.join("")], ...EMO];
    if(!rec.length && PAN.cat === 0) PAN.cat = 1;
    corpo = `<div class="fg-cats">${cats.map(([i], k) => `<button data-ct="${k}" aria-pressed="${PAN.cat === k}" ${k === 0 && !rec.length ? "hidden" : ""}>${i}</button>`).join("")}</div><div class="fg-emos">${separa(cats[PAN.cat][1]).map(e => `<button data-e="${e}">${e}</button>`).join("")}</div>`; }
  else if(PAN.aba === "fig"){ const L = await figsPara("chat"), abas2 = CTX.chat.abas.filter(a => ["recentes","favoritas"].includes(a) || filtraAba(L, a, "chat").length); if(!abas2.includes(PAN.fcat)) PAN.fcat = filtraAba(L, "recentes", "chat").length ? "recentes" : "reacoes";
    const V = filtraAba(L, PAN.fcat, "chat"); corpo = `<div class="fg-cats fg-fcats">${abas2.map(a => `<button data-fc="${a}" aria-pressed="${PAN.fcat === a}">${a === "favoritas" ? "♥" : ""}${NOME_ABA[a]}</button>`).join("")}</div><div class="fg-figs">${V.map(f => `<button data-fg="${f.id}" class="${figFav().includes(f.id) ? "fav" : ""}"><img src="${esc(figMini(f))}" alt="${esc(f.nome)}" loading="lazy" draggable="false"></button>`).join("") || `<p class="hint" style="grid-column:1/-1">${PAN.fcat === "favoritas" ? "Segure uma figurinha para favoritar ♥" : "As figurinhas que você usar aparecem aqui."}</p>`}</div>`; PAN.figL = L; }
  else { const L = MINHAS.get(); corpo = `<div class="fg-figs"><button class="fg-nova" id="fg-nova">${ic("camera", 26)}<small>Criar com foto</small></button>${L.map((u, i) => `<button data-mi="${i}"><img src="${u}" alt="Minha figurinha"></button>`).join("")}</div>${L.length ? `<p class="hint" style="margin:6px 4px 0;font-size:12px">Segure uma figurinha para apagar.</p>` : ""}`; }
  if(!$("fg-pan")) return; p.innerHTML = abas + corpo;
  p.querySelectorAll("[data-ab]").forEach(b => b.onclick = () => { PAN.aba = b.dataset.ab; desenhaPainel(c); });
  p.querySelectorAll("[data-ct]").forEach(b => b.onclick = () => { PAN.cat = +b.dataset.ct; desenhaPainel(c); });
  p.querySelectorAll("[data-e]").forEach(b => b.onclick = () => { const t = $("cv-t"); const i = t.selectionStart ?? t.value.length; t.value = t.value.slice(0, i) + b.dataset.e + t.value.slice(t.selectionEnd ?? i); t.oninput && t.oninput(); RECENTES.add(b.dataset.e); vibra(6); });
  p.querySelectorAll("[data-fc]").forEach(b => b.onclick = () => { PAN.fcat = b.dataset.fc; desenhaPainel(c); });
  p.querySelectorAll("[data-fg]").forEach(b => { const f = (PAN.figL || []).find(x => x.id === b.dataset.fg); let tm, longo = false;
    b.onpointerdown = () => { longo = false; tm = setTimeout(() => { longo = true; b.classList.toggle("fav", figFavorita(f.id)); }, 520); }; b.onpointerup = b.onpointerleave = () => clearTimeout(tm); b.oncontextmenu = e => e.preventDefault();
    b.onclick = () => { if(longo) return; b.classList.add("pop"); vibra(10); figUsada(f, "chat"); mandaFig(c, figUrl(f)); }; });
  p.querySelectorAll("[data-mi]").forEach(b => { b.onclick = () => { b.classList.add("pop"); vibra(10); mandaFig(c, MINHAS.get()[+b.dataset.mi]); };
    let tm; b.onpointerdown = () => { tm = setTimeout(() => { if(confirm("Apagar esta figurinha?")){ const L = MINHAS.get(); L.splice(+b.dataset.mi, 1); MINHAS.set(L); desenhaPainel(c); } }, 650); }; b.onpointerup = b.onpointerleave = () => clearTimeout(tm); });
  const nv = $("fg-nova"); if(nv) nv.onclick = () => criarFigurinha(c);
}
async function mandaFig(c, u){ const p = $("fg-pan"); if(p) p.remove(); const t = $("cv-t"); if(t) t.blur(); setTimeout(rolaFim, 60); const b = await dataBlob(u); enviaMsg(c, { tipo: "foto", blob: b, mime: /webp/.test(b.type) ? "image/webp" : "image/png" }).catch(() => {}); }
async function criarFigurinha(c){
  const f = await escolheArquivo("image/*"); if(!f) return; let b = await imagemValida(f, 1200); if(!b) return;
  b = await escolheFiltro(b, "Escolha um filtro"); if(!b) return;
  const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(b); });
  let box = $("so-prev"); if(!box){ box = document.createElement("div"); box.id = "so-prev"; box.className = "so-prev priv"; document.body.appendChild(box); }
  let forma = "redonda", cor = "#C2577B"; const desl = { x: 0, y: im.height > im.width * 1.1 ? 9999 : 0 };   // retrato: começa pelo topo (rosto)
  box.innerHTML = `<div class="so-prev-top"><button class="iconbtn" id="cf-x" aria-label="Cancelar">${ic("close", 20)}</button><b>Nova figurinha</b></div><div class="fg-cria"><canvas id="cf-cv" width="512" height="512"></canvas></div>
    <p class="hint" style="text-align:center;color:#cfd6d2;margin:0">Arraste a foto para ajustar</p><div class="so-prev-pe fg-cria-pe"><div class="chips">${[["redonda", "Redonda"], ["quadrada", "Quadrada"]].map(([k, n]) => `<button class="chip" data-fm="${k}" aria-pressed="${k === forma}">${n}</button>`).join("")}${["#C2577B", "#2E7D5A", "#6C5FB5", "#D08A2E", "#17211D"].map(k => `<button class="fg-cor" data-cr="${k}" style="background:${k}" aria-label="Cor"></button>`).join("")}</div>
    <input class="input" id="cf-t" maxlength="40" placeholder="Frase (opcional): Ex. Amo treinar com você"><button class="btn btn-accent btn-block" id="cf-ok">Salvar e enviar</button></div>`;
  box.hidden = false;
  const desenha = () => { const x = $("cf-cv").getContext("2d"), S = 512, t = $("cf-t").value.trim(), r = t ? 200 : 236, cy = t ? 210 : 256; x.clearRect(0, 0, S, S); x.save();
    x.beginPath(); if(forma === "redonda") x.arc(S / 2, cy, r + 10, 0, 7); else x.roundRect ? x.roundRect(S / 2 - r - 10, cy - r - 10, 2 * r + 20, 2 * r + 20, 60) : x.rect(S / 2 - r - 10, cy - r - 10, 2 * r + 20, 2 * r + 20);
    x.fillStyle = "#fff"; x.shadowColor = "rgba(0,0,0,.2)"; x.shadowBlur = 16; x.fill(); x.shadowBlur = 0;
    x.beginPath(); if(forma === "redonda") x.arc(S / 2, cy, r, 0, 7); else x.roundRect ? x.roundRect(S / 2 - r, cy - r, 2 * r, 2 * r, 52) : x.rect(S / 2 - r, cy - r, 2 * r, 2 * r); x.clip();
    const k = Math.max(2 * r / im.width, 2 * r / im.height), w = im.width * k, hh = im.height * k;
    const lx = (w - 2 * r) / 2, ly = (hh - 2 * r) / 2; desl.x = Math.max(-lx, Math.min(lx, desl.x)); desl.y = Math.max(-ly, Math.min(ly, desl.y));
    x.drawImage(im, S / 2 - w / 2 + desl.x, cy - hh / 2 + desl.y, w, hh); x.restore();
    if(t) rotulo(x, t, S / 2, 430, cor, 440); };
  if(desl.y) { desl.y = 1e5; } desenha(); if(desl.y > 0) { const k0 = desl.y; desl.y = k0 * .55; desenha(); }
  $("cf-t").oninput = desenha;
  { const cv = $("cf-cv"); let pt = null; cv.style.touchAction = "none"; cv.style.cursor = "grab";
    cv.onpointerdown = e => { pt = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if(!pt) return; const k = 512 / cv.getBoundingClientRect().width; desl.x += (e.clientX - pt[0]) * k; desl.y += (e.clientY - pt[1]) * k; pt = [e.clientX, e.clientY]; desenha(); };
    cv.onpointerup = cv.onpointercancel = () => pt = null; }
  box.querySelectorAll("[data-fm]").forEach(b => b.onclick = () => { forma = b.dataset.fm; box.querySelectorAll("[data-fm]").forEach(y => y.setAttribute("aria-pressed", y === b)); desenha(); });
  box.querySelectorAll("[data-cr]").forEach(b => b.onclick = () => { cor = b.dataset.cr; desenha(); });
  const fecha = () => { box.hidden = true; box.innerHTML = ""; };
  $("cf-x").onclick = fecha;
  $("cf-ok").onclick = () => { const cv = $("cf-cv"), mini = document.createElement("canvas"); mini.width = mini.height = 320; mini.getContext("2d").drawImage(cv, 0, 0, 320, 320);
    MINHAS.set([mini.toDataURL("image/png"), ...MINHAS.get()]); const u = cv.toDataURL("image/png"); fecha(); toast("Figurinha salva 💚"); if(c) mandaFig(c, u); else { PAN.aba = "minhas"; } };
}
/* liga o botão de emojis sempre que o chat é aberto ou a barra é refeita (depois de gravar áudio) */
const abreConversa1 = abreConversa;
abreConversa = async function(c){ const pr = abreConversa1.apply(this, arguments); setTimeout(() => ligaEmoji(c), 400); const r = await pr; ligaEmoji(c); return r; };
const religa1 = abreConversaReligar;
abreConversaReligar = function(c){ religa1.apply(this, arguments); const e = $("cv-emo"); if(e) e.remove(); ligaEmoji(c); };

/* ---------- Filtros de foto (no aparelho) ---------- */
const FILTROS = [["original", "Original"], ["natural", "Natural"], ["glow", "Glow"], ["rosado", "Rosado"], ["dourado", "Dourado"], ["suave", "Suave"], ["vivo", "Vivo"], ["pb", "P&B"]];
const FP = { natural: { b: 1.04, c: 1.04, s: 1.06 }, glow: { b: 1.06, c: 1, s: 1.04, g: .32 }, rosado: { b: 1.04, c: 1.02, s: 1.05, r: 12, gg: -2, bb: 6, g: .2 }, dourado: { b: 1.03, c: 1.05, s: 1.08, r: 14, gg: 5, bb: -10 }, suave: { b: 1.07, c: .92, s: .9, g: .22 }, vivo: { b: 1.02, c: 1.08, s: 1.28 }, pb: { b: 1.03, c: 1.12, s: 0 } };
function aplicaFiltro(cv, nome){
  const p = FP[nome]; if(!p) return cv; const x = cv.getContext("2d"), W = cv.width, H = cv.height;
  if(p.g){ const m = document.createElement("canvas"); m.width = Math.max(1, W / 10 | 0); m.height = Math.max(1, H / 10 | 0); m.getContext("2d").drawImage(cv, 0, 0, m.width, m.height); x.save(); x.globalAlpha = p.g; x.drawImage(m, 0, 0, W, H); x.restore(); }
  const d = x.getImageData(0, 0, W, H), a = d.data, cc = p.c, bb = p.b, s = p.s;
  for(let i = 0; i < a.length; i += 4){ let r = a[i] * bb, g = a[i + 1] * bb, b = a[i + 2] * bb;
    r = (r - 128) * cc + 128 + (p.r || 0); g = (g - 128) * cc + 128 + (p.gg || 0); b = (b - 128) * cc + 128 + (p.bb || 0);
    const l = .299 * r + .587 * g + .114 * b; r = l + (r - l) * s; g = l + (g - l) * s; b = l + (b - l) * s;
    a[i] = r < 0 ? 0 : r > 255 ? 255 : r; a[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; a[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b; }
  x.putImageData(d, 0, 0); return cv;
}
function paraCanvas(im, max){ const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); return c; }
function escolheFiltro(blob, titulo){
  return new Promise(async fim => {
    const u = URL.createObjectURL(blob), im = await new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = u; }); if(!im) return fim(blob);
    let box = $("so-filtro"); if(!box){ box = document.createElement("div"); box.id = "so-filtro"; box.className = "so-prev priv"; document.body.appendChild(box); }
    const base = paraCanvas(im, 900), mini = paraCanvas(im, 140); let esc0 = "original";
    box.innerHTML = `<div class="so-prev-top"><button class="iconbtn" id="fl-x" aria-label="Cancelar">${ic("close", 20)}</button><b>${titulo || "Filtros"}</b><button class="btn btn-soft btn-sm fl-mk-b" id="fl-mk">💄 Maquiagem</button><button class="btn btn-accent btn-sm" id="fl-ok" style="margin-left:auto">Usar</button></div><div class="fl-vis"><canvas id="fl-cv"></canvas></div>
      <div class="fl-mk" id="fl-mkp" hidden></div><div class="fl-row">${FILTROS.map(([k, n]) => { const m = document.createElement("canvas"); m.width = mini.width; m.height = mini.height; m.getContext("2d").drawImage(mini, 0, 0); aplicaFiltro(m, k); return `<button data-fl="${k}" aria-pressed="${k === esc0}"><img src="${m.toDataURL("image/jpeg", .7)}" alt=""><small>${n}</small></button>`; }).join("")}</div>`;
    box.hidden = false;
    const MK = { rosto: null, batom: null, blush: false, forca: .6 };
    const mostra = () => { const cv = $("fl-cv"); cv.width = base.width; cv.height = base.height; cv.getContext("2d").drawImage(base, 0, 0); aplicaFiltro(cv, esc0); if(MK.rosto) aplicaMaquiagem(cv, MK); };
    const painelMk = () => { const p = $("fl-mkp"); p.hidden = false;
      p.innerHTML = `<div class="fl-mk-l"><span>Batom</span>${[["", "Sem"], ...BATONS].map(([c, n]) => `<button class="fl-bt" data-bt="${c}" aria-pressed="${(MK.batom || "") === c}" ${c ? `style="--bt:${c}"` : ""}>${c ? "" : "∅"}<small>${n}</small></button>`).join("")}</div>
        <div class="fl-mk-l"><button class="chip" id="mk-bl" aria-pressed="${MK.blush}">🌸 Blush</button>${[[.35, "Suave"], [.6, "Média"], [.9, "Forte"]].map(([v, n]) => `<button class="chip" data-fz="${v}" aria-pressed="${MK.forca === v}">${n}</button>`).join("")}</div>`;
      p.querySelectorAll("[data-bt]").forEach(b => b.onclick = () => { MK.batom = b.dataset.bt || null; vibra(6); painelMk(); mostra(); });
      p.querySelectorAll("[data-fz]").forEach(b => b.onclick = () => { MK.forca = +b.dataset.fz; painelMk(); mostra(); });
      $("mk-bl").onclick = () => { MK.blush = !MK.blush; vibra(6); painelMk(); mostra(); }; };
    $("fl-mk").onclick = async () => { const bt = $("fl-mk"); if(MK.rosto){ const p = $("fl-mkp"); p.hidden = !p.hidden; return; }
      bt.disabled = true; bt.textContent = "Procurando rosto…";
      try{ MK.rosto = await achaRosto(base); }catch(e){ console.warn(e); }
      bt.disabled = false; bt.textContent = "💄 Maquiagem";
      if(!MK.rosto) return toast("Não encontrei um rosto nesta foto. Tente uma foto de frente e bem iluminada.");
      MK.batom = BATONS[1][0]; MK.blush = true; painelMk(); mostra(); };
    mostra();
    box.querySelectorAll("[data-fl]").forEach(b => b.onclick = () => { esc0 = b.dataset.fl; box.querySelectorAll("[data-fl]").forEach(y => y.setAttribute("aria-pressed", y === b)); vibra(6); mostra(); });
    const sai = r => { box.hidden = true; box.innerHTML = ""; URL.revokeObjectURL(u); fim(r); };
    $("fl-x").onclick = () => sai(null);
    $("fl-ok").onclick = () => { const temMk = MK.rosto && (MK.batom || MK.blush); if(esc0 === "original" && !temMk) return sai(blob); const cv = aplicaFiltro(paraCanvas(im, 1600), esc0); if(temMk) aplicaMaquiagem(cv, MK); cv.toBlob(b => sai(b || blob), "image/jpeg", .88); };
  });
}

/* ---------- Maquiagem virtual (reconhecimento de rosto no próprio aparelho; a foto não sai do celular) ---------- */
const BATONS = [["#B5655B", "Nude"], ["#D9567A", "Rosa"], ["#E56B5A", "Coral"], ["#B3122E", "Vermelho"], ["#6E1530", "Vinho"]];
const MP_V = "0.10.14";
let FACE = null;
async function achaRosto(cv){
  if(!FACE){
    const vision = await import(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_V}/vision_bundle.mjs`);
    const fs = await vision.FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_V}/wasm`);
    FACE = await vision.FaceLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "CPU" }, runningMode: "IMAGE", numFaces: 1 });
  }
  const r = FACE.detect(cv); return r && r.faceLandmarks && r.faceLandmarks[0] ? r.faceLandmarks[0].map(p => ({ x: p.x, y: p.y })) : null;
}
const LABIO_FORA = [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185], LABIO_DENTRO = [78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191];
function aplicaMaquiagem(cv, MK){
  const W = cv.width, H = cv.height, x = cv.getContext("2d"), L = MK.rosto, P = i => [L[i].x * W, L[i].y * H];
  const larg = Math.hypot(P(234)[0] - P(454)[0], P(234)[1] - P(454)[1]);
  const camada = desenho => { const m = document.createElement("canvas"); m.width = W; m.height = H; const mx = m.getContext("2d"); desenho(mx);
    const s = document.createElement("canvas"), k = Math.max(1, Math.round(larg / 90)); s.width = Math.max(1, W / k | 0); s.height = Math.max(1, H / k | 0); s.getContext("2d").drawImage(m, 0, 0, s.width, s.height); return s; };
  if(MK.batom){
    const lab = camada(mx => { mx.fillStyle = MK.batom; mx.beginPath(); LABIO_FORA.forEach((i, n) => { const [a, b] = P(i); n ? mx.lineTo(a, b) : mx.moveTo(a, b); }); mx.closePath(); LABIO_DENTRO.forEach((i, n) => { const [a, b] = P(i); n ? mx.lineTo(a, b) : mx.moveTo(a, b); }); mx.closePath(); mx.fill("evenodd"); });
    x.save(); x.globalCompositeOperation = "multiply"; x.globalAlpha = .55 * MK.forca + .1; x.drawImage(lab, 0, 0, W, H);
    x.globalCompositeOperation = "soft-light"; x.globalAlpha = .5 * MK.forca; x.drawImage(lab, 0, 0, W, H); x.restore();
  }
  if(MK.blush){
    const bl = camada(mx => { [[205, 50], [425, 280]].forEach(([c, d]) => { const [a, b] = P(c), [a2, b2] = P(d), cx = (a + a2) / 2, cy = (b + b2) / 2, r = larg * .13;
      const g = mx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "rgba(232,96,120,.9)"); g.addColorStop(1, "rgba(232,96,120,0)"); mx.fillStyle = g; mx.beginPath(); mx.arc(cx, cy, r, 0, 7); mx.fill(); }); });
    x.save(); x.globalCompositeOperation = "soft-light"; x.globalAlpha = .7 * MK.forca + .1; x.drawImage(bl, 0, 0, W, H); x.globalCompositeOperation = "multiply"; x.globalAlpha = .18 * MK.forca; x.drawImage(bl, 0, 0, W, H); x.restore();
  }
}
