
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
const FIG = [
  ["Treino", [["💪", "Treinei!", "#2E7D5A"], ["🍑", "Glúteo em construção", "#C2577B"], ["🫠", "Pós-treino: destruída", "#6C5FB5"], ["💅", "Tô morta, mas tô linda", "#C2577B"], ["🙃", "Agachamento? Nunca vi", "#D08A2E"], ["💧", "Água, mana!", "#2B7BB9"], ["✨", "Foco, força e fé", "#0E3D32"], ["🏃‍♀️", "Bora treinar?", "#2E7D5A"]]],
  ["Humor", [["😅", "Hoje não, amanhã eu juro", "#D08A2E"], ["😴", "Só mais 5 minutinhos", "#6C5FB5"], ["🙈", "Cadê minha motivação?", "#C2577B"], ["🌪️", "Modo TPM: ativado", "#8E3B5C"], ["🍫", "Chocolate é self-care", "#7A4A2A"], ["😩", "Dia de cabelo ruim", "#6C5FB5"], ["😭", "Hoje eu choro", "#2B7BB9"], ["😌", "Plena", "#2E7D5A"], ["☕", "Café primeiro", "#7A4A2A"], ["😬", "Ansiosa", "#D08A2E"]]],
  ["Amigas", [["💚", "Bora juntas?", "#2E7D5A"], ["🥹", "Orgulho de você!", "#C2577B"], ["👏", "Arrasou, amiga!", "#D08A2E"], ["🥰", "Saudade de você!", "#C2577B"], ["🙏", "Muito obrigada!", "#0E3D32"], ["🤣", "Kkkkkkk", "#D08A2E"], ["🫶", "Tamo junto", "#6C5FB5"], ["🌙", "Boa noite!", "#17211D"]]]
];
const FIGC = new Map();
function rotulo(x, txt, cx, y, cor, maxW){
  x.font = "800 66px 'Bricolage Grotesque','Avenir Next',system-ui,sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  const pal = txt.split(" "), L = []; let l = ""; pal.forEach(p => { const t = l ? l + " " + p : p; if(x.measureText(t).width > maxW){ L.push(l); l = p; } else l = t; }); L.push(l);
  const lh = 72, w = Math.min(maxW, Math.max(...L.map(t => x.measureText(t).width))) + 44, h = L.length * lh + 26, y0 = y - h / 2;
  x.fillStyle = "#fff"; x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2 - 8, y0 - 8, w + 16, h + 16, 30) : x.rect(cx - w / 2 - 8, y0 - 8, w + 16, h + 16); x.fill();
  x.fillStyle = cor; x.beginPath(); x.roundRect ? x.roundRect(cx - w / 2, y0, w, h, 24) : x.rect(cx - w / 2, y0, w, h); x.fill();
  x.fillStyle = "#fff"; L.forEach((t, i) => x.fillText(t, cx, y0 + 13 + lh / 2 + i * lh));
}
async function figurinha(e, txt, cor){
  const k = e + txt; if(FIGC.has(k)) return FIGC.get(k);
  try{ await document.fonts.load("800 50px 'Bricolage Grotesque'"); }catch(er){}
  const S = 512, c = document.createElement("canvas"); c.width = c.height = S; const x = c.getContext("2d");
  x.textAlign = "center"; x.textBaseline = "middle"; x.font = `200px system-ui,"Apple Color Emoji","Segoe UI Emoji",sans-serif`;
  x.shadowColor = "rgba(0,0,0,.18)"; x.shadowBlur = 18; x.fillText(e, S / 2, 150); x.shadowBlur = 0;
  rotulo(x, txt, S / 2, 375, cor, 460);
  const u = c.toDataURL("image/png"); FIGC.set(k, u); return u;
}
const MINHAS = { get(){ try{ return JSON.parse(localStorage.getItem("ck_fig_" + ME.id) || "[]"); }catch(e){ return []; } }, set(L){ try{ localStorage.setItem("ck_fig_" + ME.id, JSON.stringify(L.slice(0, 16))); }catch(e){ toast("Sem espaço para guardar mais figurinhas"); } } };
const RECENTES = { get(){ try{ return JSON.parse(localStorage.getItem("ck_emo") || "[]"); }catch(e){ return []; } }, add(e){ const L = [e, ...RECENTES.get().filter(x => x !== e)].slice(0, 24); try{ localStorage.setItem("ck_emo", JSON.stringify(L)); }catch(er){} } };
const dataBlob = u => fetch(u).then(r => r.blob());
const separa = s => window.Intl && Intl.Segmenter ? [...new Intl.Segmenter("pt", { granularity: "grapheme" }).segment(s)].map(x => x.segment) : Array.from(s);
let PAN = { aba: "emo", cat: 0 };
function ligaEmoji(c){
  const cin = document.querySelector("#cv-bar .so-cin"); if(!cin || $("cv-emo")) return;
  $("cv-foto").insertAdjacentHTML("afterend", `<button class="iconbtn" id="cv-emo" aria-label="Emojis e figurinhas"><span style="font-size:20px;line-height:1">😊</span></button>`);
  $("cv-emo").onclick = () => { const p = $("fg-pan"); if(p){ p.remove(); return; } $("cv-bar").insertAdjacentHTML("afterbegin", `<div class="fg-pan" id="fg-pan"></div>`); desenhaPainel(c); };
}
async function desenhaPainel(c){
  const p = $("fg-pan"); if(!p) return;
  const abas = `<div class="fg-abas"><button data-ab="emo" aria-pressed="${PAN.aba === "emo"}">😊 Emojis</button><button data-ab="fig" aria-pressed="${PAN.aba === "fig"}">✨ Figurinhas</button><button data-ab="minhas" aria-pressed="${PAN.aba === "minhas"}">📸 Minhas</button></div>`;
  let corpo = "";
  if(PAN.aba === "emo"){ const rec = RECENTES.get(), cats = [["🕘", rec.join("")], ...EMO];
    if(!rec.length && PAN.cat === 0) PAN.cat = 1;
    corpo = `<div class="fg-cats">${cats.map(([i], k) => `<button data-ct="${k}" aria-pressed="${PAN.cat === k}" ${k === 0 && !rec.length ? "hidden" : ""}>${i}</button>`).join("")}</div><div class="fg-emos">${separa(cats[PAN.cat][1]).map(e => `<button data-e="${e}">${e}</button>`).join("")}</div>`; }
  else if(PAN.aba === "fig"){ corpo = `<div class="fg-figs">${(await Promise.all(FIG.map(async ([g, L]) => `<p class="fg-g">${g}</p>` + (await Promise.all(L.map(async ([e, t, cor], i) => `<button data-fg="${esc(g)}|${i}"><img src="${await figurinha(e, t, cor)}" alt="${esc(t)}"></button>`))).join("")))).join("")}</div>`; }
  else { const L = MINHAS.get(); corpo = `<div class="fg-figs"><button class="fg-nova" id="fg-nova">${ic("camera", 26)}<small>Criar com foto</small></button>${L.map((u, i) => `<button data-mi="${i}"><img src="${u}" alt="Minha figurinha"></button>`).join("")}</div>${L.length ? `<p class="hint" style="margin:6px 4px 0;font-size:12px">Segure uma figurinha para apagar.</p>` : ""}`; }
  if(!$("fg-pan")) return; p.innerHTML = abas + corpo;
  p.querySelectorAll("[data-ab]").forEach(b => b.onclick = () => { PAN.aba = b.dataset.ab; desenhaPainel(c); });
  p.querySelectorAll("[data-ct]").forEach(b => b.onclick = () => { PAN.cat = +b.dataset.ct; desenhaPainel(c); });
  p.querySelectorAll("[data-e]").forEach(b => b.onclick = () => { const t = $("cv-t"); const i = t.selectionStart ?? t.value.length; t.value = t.value.slice(0, i) + b.dataset.e + t.value.slice(t.selectionEnd ?? i); t.oninput && t.oninput(); RECENTES.add(b.dataset.e); vibra(6); });
  p.querySelectorAll("[data-fg]").forEach(b => b.onclick = async () => { const [g, i] = b.dataset.fg.split("|"), f = FIG.find(x => x[0] === g)[1][+i]; b.classList.add("pop"); vibra(10); mandaFig(c, await figurinha(...f)); });
  p.querySelectorAll("[data-mi]").forEach(b => { b.onclick = () => { b.classList.add("pop"); vibra(10); mandaFig(c, MINHAS.get()[+b.dataset.mi]); };
    let tm; b.onpointerdown = () => { tm = setTimeout(() => { if(confirm("Apagar esta figurinha?")){ const L = MINHAS.get(); L.splice(+b.dataset.mi, 1); MINHAS.set(L); desenhaPainel(c); } }, 650); }; b.onpointerup = b.onpointerleave = () => clearTimeout(tm); });
  const nv = $("fg-nova"); if(nv) nv.onclick = () => criarFigurinha(c);
}
async function mandaFig(c, u){ const p = $("fg-pan"); if(p) p.remove(); enviaMsg(c, { tipo: "foto", blob: await dataBlob(u), mime: "image/png" }).catch(() => {}); }
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
    box.innerHTML = `<div class="so-prev-top"><button class="iconbtn" id="fl-x" aria-label="Cancelar">${ic("close", 20)}</button><b>${titulo || "Filtros"}</b><button class="btn btn-accent btn-sm" id="fl-ok" style="margin-left:auto">Usar</button></div><div class="fl-vis"><canvas id="fl-cv"></canvas></div>
      <div class="fl-row">${FILTROS.map(([k, n]) => { const m = document.createElement("canvas"); m.width = mini.width; m.height = mini.height; m.getContext("2d").drawImage(mini, 0, 0); aplicaFiltro(m, k); return `<button data-fl="${k}" aria-pressed="${k === esc0}"><img src="${m.toDataURL("image/jpeg", .7)}" alt=""><small>${n}</small></button>`; }).join("")}</div>`;
    box.hidden = false;
    const mostra = () => { const cv = $("fl-cv"); cv.width = base.width; cv.height = base.height; cv.getContext("2d").drawImage(base, 0, 0); aplicaFiltro(cv, esc0); };
    mostra();
    box.querySelectorAll("[data-fl]").forEach(b => b.onclick = () => { esc0 = b.dataset.fl; box.querySelectorAll("[data-fl]").forEach(y => y.setAttribute("aria-pressed", y === b)); vibra(6); mostra(); });
    const sai = r => { box.hidden = true; box.innerHTML = ""; URL.revokeObjectURL(u); fim(r); };
    $("fl-x").onclick = () => sai(null);
    $("fl-ok").onclick = () => { if(esc0 === "original") return sai(blob); const cv = aplicaFiltro(paraCanvas(im, 1600), esc0); cv.toBlob(b => sai(b || blob), "image/jpeg", .88); };
  });
}
