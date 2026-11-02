/* ===================== COMPARTILHAR CONQUISTA (fora do app) =====================
   Uma peça só, usada em todo o CK Life: ckCompartilhar({ tipo, emoji, titulo, grande, sub, frases, ... }).
   - Gera um cartão CK Life (Stories 9:16 com área segura, ou quadrado 1:1).
   - Abre o menu nativo do celular (Instagram, WhatsApp, Facebook, Telegram... o que estiver instalado).
     Não existe ligação direta com um app específico pelo navegador: quem mostra as opções é o sistema.
   - Sem menu nativo: salva a imagem e copia o convite.
   - Nunca coloca peso, medidas, fotos, e-mail, telefone, nome completo ou dado de saúde no cartão.
   - Junto vai um convite com link individual (código aleatório, sem dado pessoal) para medir quem chega por ele.
   Não publica nada dentro da Comunidade. */
const SH_SITE = "https://cklife.com.br/";
function shCodigo(){
  try{ if(ME && !ME.convite){ ME.convite = Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/g, "x"); save(); } }catch(e){}
  return (ME && ME.convite) || "";
}
const shLink = tipo => SH_SITE + "?utm_source=convite&utm_medium=compartilhar&utm_campaign=" + encodeURIComponent(tipo || "conquista") + (shCodigo() ? "&utm_content=" + shCodigo() : "");
/* registra o evento (painel de eventos + tabela de eventos do admin, só o nome e o tipo) */
function shEvento(nome, tipo){
  try{ registraEvento(nome, { tipo }); }catch(e){}
  try{ DB.eventos.push({ t: "clk", c: `sh:${nome}:${tipo || ""}`, u: ME.id, d: today() }); save(); }catch(e){}
}
const shEvNome = o => o.evento || (o.tipo === "treino" || o.tipo === "planob" ? "workout_share_clicked" : /^desafio/.test(o.tipo) ? "challenge_share_clicked" : "achievement_share_clicked");

/* ---------- o cartão (canvas) ---------- */
function shQuebra(x, txt, max){
  const out = []; String(txt || "").split("\n").forEach(par => { let l = ""; par.split(" ").forEach(p => { const t = l ? l + " " + p : p; if(x.measureText(t).width > max && l){ out.push(l); l = p; } else l = t; }); out.push(l); });
  return out;
}
async function shCartao(o, fmt){
  const W = 1080, H = fmt === "quadrado" ? 1080 : 1920, st = H > W, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
  try{ await Promise.all([document.fonts.load("800 90px 'Bricolage Grotesque'"), document.fonts.load("600 40px Figtree")]); }catch(e){}
  const F1 = "'Bricolage Grotesque','Avenir Next',system-ui,sans-serif", F2 = "Figtree,system-ui,sans-serif";
  const g = x.createLinearGradient(0, 0, W * .5, H); g.addColorStop(0, "#0B2A22"); g.addColorStop(.55, "#1F5C46"); g.addColorStop(1, "#6E9E6D"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalAlpha = .07; x.fillStyle = "#fff"; [[.12, .16, 240], [.9, .32, 190], [.1, .74, 170], [.85, .9, 260]].forEach(([a, b, r]) => { x.beginPath(); x.arc(W * a, H * b, r, 0, 7); x.fill(); }); x.globalAlpha = 1;
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  // Stories: nada importante nos 260px de cima nem nos 360px de baixo (barra e resposta do Instagram)
  let y = st ? 330 : 120;
  const ico = await carregaImg("img/icone-192.png");
  x.font = `800 ${st ? 58 : 50}px ${F1}`; const w1 = x.measureText("CK ").width, w2 = x.measureText("Life").width, isz = st ? 74 : 62, gap = 18, tot = (ico ? isz + gap : 0) + w1 + w2;
  let x0 = W / 2 - tot / 2;
  if(ico){ x.save(); x.beginPath(); x.roundRect ? x.roundRect(x0, y - isz * .78, isz, isz, isz * .26) : x.rect(x0, y - isz * .78, isz, isz); x.clip(); x.drawImage(ico, x0, y - isz * .78, isz, isz); x.restore(); x0 += isz + gap; }
  x.textAlign = "left"; x.fillStyle = "#fff"; x.fillText("CK ", x0, y); x.fillStyle = "#B9DDB2"; x.fillText("Life", x0 + w1, y); x.textAlign = "center";
  // bloco central, centralizado na altura útil
  const blocos = [];
  if(o.emoji) blocos.push(["em", st ? 300 : 170]);
  if(o.titulo){ x.font = `800 ${st ? 88 : 64}px ${F1}`; shQuebra(x, o.titulo, W - 160).forEach(l => blocos.push(["ti", st ? 104 : 76, l])); }
  if(o.grande) blocos.push(["gr", st ? 240 : 150, o.grande]);
  if(o.sub) blocos.push(["su", st ? 84 : 62, o.sub]);
  const fr = o.frase || "";
  if(fr){ blocos.push(["sp", st ? 60 : 30]); x.font = `600 ${st ? 62 : 46}px ${F2}`; shQuebra(x, "“" + fr + "”", W - 200).forEach(l => blocos.push(["fr", st ? 84 : 60, l])); }
  const alt = blocos.reduce((a, b) => a + b[1], 0), topo = st ? 420 : 170, fundo = st ? H - 470 : H - 150;
  y = topo + Math.max(0, (fundo - topo - alt) / 2);
  blocos.forEach(([k, h, t]) => {
    if(k === "em"){ x.font = `${h * .82}px ${F2}`; x.fillStyle = "#fff"; x.fillText(o.emoji, W / 2, y + h * .8); }
    else if(k === "ti"){ x.font = `800 ${st ? 88 : 64}px ${F1}`; x.fillStyle = "#fff"; x.fillText(t, W / 2, y + h * .8); }
    else if(k === "gr"){ let fs = h * .95; do { x.font = `800 ${fs}px ${F1}`; fs -= 6; } while(x.measureText(t).width > W - 160 && fs > 60); x.fillStyle = "#fff"; x.fillText(t, W / 2, y + h * .82); }
    else if(k === "su"){ x.font = `800 ${st ? 50 : 40}px ${F2}`; x.fillStyle = "#B9DDB2"; if("letterSpacing" in x) x.letterSpacing = "3px"; x.fillText(t, W / 2, y + h * .72); if("letterSpacing" in x) x.letterSpacing = "0px"; }
    else if(k === "fr"){ x.font = `600 ${st ? 62 : 46}px ${F2}`; x.fillStyle = "rgba(255,255,255,.92)"; x.fillText(t, W / 2, y + h * .78); }
    y += h;
  });
  // rodapé
  x.font = `700 ${st ? 46 : 34}px ${F2}`; x.fillStyle = "rgba(255,255,255,.85)"; x.fillText("cklife.com.br", W / 2, st ? H - 400 : H - 70);
  return new Promise(ok => cv.toBlob(ok, "image/jpeg", .9));
}

/* ---------- a tela: prévia do cartão + Compartilhar ---------- */
async function ckCompartilhar(o){
  o = Object.assign({ tipo: "conquista", frases: [] }, o || {});
  const frases = (o.frases && o.frases.length ? o.frases : [o.frase || ""]).filter(f => f !== undefined);
  let fi = 0, fmt = "stories", file = null, url = null, gerando = null;
  const evento = shEvNome(o); shEvento(evento, o.tipo);
  const convite = () => (o.convite || "Estou treinando no CK Life 💚\nVem comigo:") + " " + shLink(o.tipo);
  const temNativo = () => !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  sheet("Compartilhar conquista", `<div class="sh-wrap">
    <div class="sh-prev" id="sh-prev" data-f="stories"><span class="sh-load">Criando seu cartão…</span></div>
    <div class="sh-ops"><div class="seg sh-seg" role="tablist"><button aria-pressed="true" data-shf="stories">Stories</button><button aria-pressed="false" data-shf="quadrado">Quadrado</button></div>
      ${frases.length > 1 ? `<button class="link" id="sh-frase">${ic("star", 14)} Outra frase</button>` : ""}</div>
    <button class="btn btn-accent btn-block btn-lg" id="sh-go" disabled>${ic("share", 18)} Compartilhar</button>
    <div class="sh-alt"><button class="btn btn-line btn-sm" id="sh-salvar">${ic("image", 15)} Salvar imagem</button><button class="btn btn-line btn-sm" id="sh-conv">${ic("people", 15)} Convidar amiga</button></div>
    ${o.comunidade && typeof SO !== "undefined" && SO.on() ? `<button class="link" id="sh-com" style="align-self:center">Prefere postar nos Stories da comunidade?</button>` : ""}
    <p class="hint sh-hint">Abre as opções do seu celular: Instagram, WhatsApp, Facebook e outros. O convite com link vai junto (e fica copiado para colar onde quiser). No cartão não aparece peso, medidas nem nenhum dado pessoal.</p></div>`, () => $("sheet").classList.remove("sh-top"));
  $("sheet").classList.add("sh-top");   // fica por cima da tela de fim de treino
  const pinta = async () => {
    const meu = gerando = {}; const b = $("sh-go"); if(b) b.disabled = true;
    const blob = await shCartao(Object.assign({}, o, { frase: frases[fi] }), fmt); if(meu !== gerando) return;
    file = new File([blob], `ck-life-${o.tipo}.jpg`, { type: "image/jpeg" });
    if(url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob);
    const p = $("sh-prev"); if(p){ p.dataset.f = fmt; p.innerHTML = `<img src="${url}" alt="Prévia do cartão da conquista">`; }
    if(b) b.disabled = false;
  };
  const baixa = () => { if(!file) return; const a = document.createElement("a"); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); };
  const copia = t => { try{ navigator.clipboard && navigator.clipboard.writeText(t).catch(() => {}); }catch(e){} };
  document.querySelectorAll("[data-shf]").forEach(b => b.onclick = () => { if(fmt === b.dataset.shf) return; fmt = b.dataset.shf; document.querySelectorAll("[data-shf]").forEach(z => z.setAttribute("aria-pressed", z === b)); pinta(); });
  const bf = $("sh-frase"); if(bf) bf.onclick = () => { fi = (fi + 1) % frases.length; pinta(); };
  $("sh-go").onclick = async () => {
    if(!file) return; const tx = convite(); shEvento("share_menu_opened", o.tipo);
    if(temNativo()){ copia(tx); try{ await navigator.share({ files: [file], text: tx }); }catch(e){ if(e && e.name !== "AbortError") { baixa(); copyText(tx, "Imagem salva e convite copiado 💚"); } } return; }
    baixa();
    if(navigator.share){ try{ await navigator.share({ text: tx }); }catch(e){} toast("Imagem salva. Agora é só postar 💚"); }
    else copyText(tx, "Imagem salva e convite copiado. É só postar 💚");
  };
  $("sh-salvar").onclick = () => { baixa(); copia(convite()); toast(navigator.canShare ? "Se a imagem não aparecer, toque e segure nela para salvar 💚" : "Imagem salva 💚"); };
  $("sh-conv").onclick = async () => { const tx = convite(); shEvento(/^desafio/.test(o.tipo) ? "challenge_invite_clicked" : "invite_clicked", o.tipo);
    if(navigator.share){ try{ await navigator.share({ text: tx }); return; }catch(e){ if(e && e.name === "AbortError") return; } }
    copyText(tx, "Convite copiado. É só colar no WhatsApp 💚"); };
  const bc = $("sh-com"); if(bc) bc.onclick = () => { fecharSheet(); o.comunidade(); };
  pinta();
}

/* ---------- textos de cada momento ---------- */
const SH_FR_TREINO = ["Hoje eu apareci por mim. 💚", "Mais um passo dado. 💚", "Feito é melhor que perfeito.", "Eu escolhi continuar."];
const shNomeDesafio = D => D[1] === 21 ? "CK 21 DIAS JUNTAS" : D[2].toUpperCase();
const shConvDesafio = D => `Estou fazendo o ${D[1] === 21 ? "CK 21 Dias Juntas" : D[2]} 💚\nVem comigo no CK Life:`;
const pad2 = n => String(n).padStart(2, "0");
/* treino que acabou de terminar: dentro de desafio, Plano B ou treino normal */
function shDoTreino(t){
  const pb = shPlanoBAtivo();
  if(pb) return { tipo: "planob", emoji: "💚", titulo: "PLANO B CONCLUÍDO", frases: [`Hoje eu só tinha ${pb} minutos.\nE fiz os ${pb}.`, "Pouco ainda conta.", "Feito é melhor que perfeito."] };
  const z = typeof desafioAtual === "function" ? desafioAtual() : null;
  if(z && ME.desafio && !(ME.desafio.fim && ME.desafio.fim < today())){
    const n = z.feitos, tot = z.D[1], base = { sub: shNomeDesafio(z.D), convite: shConvDesafio(z.D) };
    if(n >= tot) return Object.assign(base, { tipo: "desafio_ok", emoji: "🏆", titulo: "EU COMPLETEI O", grande: `${tot}/${tot}`, sub: shNomeDesafio(z.D), frases: ["Eu fui até o fim. 💚", "Prometi pra mim. E cumpri."] });
    const marco = { 3: ["✨", "3 dias. O hábito começou."], 7: ["🔥", "Uma semana. Eu continuo."], 14: ["💚", "Falta pouco."] }[n];
    if(marco) return Object.assign(base, { tipo: "desafio_marco", emoji: null, titulo: null, grande: `${n}/${tot} ${marco[0]}`, frases: [marco[1], ...SH_FR_TREINO] });
    return Object.assign(base, { tipo: "desafio_dia", emoji: "🔥", titulo: "TREINO CONCLUÍDO", grande: `DIA ${pad2(n)}/${tot}`, frases: SH_FR_TREINO });
  }
  return { tipo: "treino", emoji: "🔥", titulo: "TREINO CONCLUÍDO", sub: t && t.nome ? String(t.nome).toUpperCase().slice(0, 40) : "", frases: SH_FR_TREINO };
}
/* Plano B: marca quando ela escolhe um treino curto no Plano B; vale para o treino terminado em até 3 horas */
let SH_PB = null;
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-pb]"); if(!b) return; const m = { t5: 5, t10: 10, t15: 15, alo: 10, cam: 10 }[b.dataset.pb]; SH_PB = m ? { m, em: Date.now() } : null; }, true);
const shPlanoBAtivo = () => SH_PB && Date.now() - SH_PB.em < 3 * 36e5 ? SH_PB.m : 0;
/* conquista/medalha/sequência (c = [id, tipo, n, emoji, TÍTULO, frase]) */
function shDaConquista(c){
  const dz = /^(d\d+)-/.exec(c[0] || ""), D = dz && typeof DESAFIOS !== "undefined" && DESAFIOS.find(x => x[0] === dz[1]);
  if(D) return { tipo: "desafio_ok", emoji: "🏆", titulo: "EU COMPLETEI O", grande: `${D[1]}/${D[1]}`, sub: shNomeDesafio(D), convite: shConvDesafio(D), frases: ["Eu fui até o fim. 💚", "Prometi pra mim. E cumpri."] };
  return { tipo: c[1] === "s" ? "sequencia" : "medalha", emoji: c[3], titulo: c[4], frases: [c[5], "Mais uma conquista na minha jornada. 💚"].filter(Boolean) };
}

/* ---------- ligações ---------- */
/* fim do treino: "Compartilhar conquista" abre o cartão; Stories da comunidade continua como opção dentro dele */
const fimTreinoSh = fimTreino;
fimTreino = function(parcial){
  const r = fimTreinoSh.apply(this, arguments);
  try{
    const t = (ME.treinos || []).slice(-1)[0]; if(parcial || !t) return r;
    const o = shDoTreino(t); if(o.tipo === "planob") SH_PB = null;
    o.comunidade = () => compartilharConquista(t);
    let b = $("fim-conq");
    if(!b){ const ok = $("fim-ok"); if(ok){ ok.insertAdjacentHTML("beforebegin", `<button class="btn btn-accent btn-lg btn-block" id="fim-conq"></button>`); b = $("fim-conq"); } }
    if(b){ b.innerHTML = `${ic("share", 18)} Compartilhar conquista`; b.onclick = () => ckCompartilhar(o); }
    const old = $("fim-share"); if(old) old.hidden = true;   // o cartão novo substitui o antigo (mesma função, mais formatos)
    const ok = $("fim-ok"); if(ok && !ok.dataset.sh){ ok.dataset.sh = 1; ok.textContent = "Continuar"; }
    const h = document.querySelector("#play .done-hero h2"); if(h && !/🔥/.test(h.textContent) && o.tipo !== "planob") h.textContent = "🔥 " + h.textContent;
    if(o.tipo === "planob" && h){ h.textContent = "💚 Plano B concluído!"; const p = h.nextElementSibling; if(p && p.tagName === "P") p.textContent = "Pouco ainda conta. E você fez."; }
  }catch(e){ console.warn(e); }
  return r;
};
/* celebração de conquista (medalhas, sequência, desafio concluído, aniversário...) */
const celebrarSh = celebrar;
celebrar = async function(c){
  const r = await celebrarSh.apply(this, arguments);
  try{
    const b = $("ce-share"); if(b && c){ b.innerHTML = `${ic("share", 18)} Compartilhar conquista`; b.onclick = () => { const bx = $("celebra"); if(bx){ bx.hidden = true; bx.innerHTML = ""; } ckCompartilhar(shDaConquista(c)); }; }
  }catch(e){ console.warn(e); }
  return r;
};
