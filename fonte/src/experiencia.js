
/* ===================== EXPERIÊNCIA CK LIFE =====================
   "Meu dia" no Início (check-in, Meu Ritmo, sequência, contexto), momentos especiais com Story automático,
   desafios pessoais, Minha Jornada e coleção de conquistas. Tudo pessoal: nada de ranking de corpo, peso ou ciclo. */
const XMARCOS = [3, 7, 15, 30, 50, 100];
const FIM_TIT = ["Treino concluído.", "Hoje teve!", "Constância construída.", "Mais um check ✓"];
const FIM_MSG = ["Você apareceu por você hoje.", "Mais um passo na sua evolução.", "Você está construindo sua melhor versão.", "Cada treino conta. Esse contou muito.", "Seu ritmo, sua evolução."];
const XHUMOR = [["1", "😴", "Cansada"], ["2", "😌", "Tranquila"], ["3", "🙂", "Bem"], ["4", "🔥", "Animada"]];
const XENERGIA = [["baixa", "Pouca energia"], ["ok", "Normal"], ["alta", "Muita energia"]];
const HUM = { get(){ try{ return JSON.parse(localStorage.getItem("ck_hum_" + ME.id) || "{}"); }catch(e){ return {}; } }, set(v){ try{ localStorage.setItem("ck_hum_" + ME.id, JSON.stringify(v)); }catch(e){} } };   // fica só no aparelho
const humorHoje = () => HUM.get()[today()];
/* Meu Ritmo: consistência pessoal dos últimos 14 dias (treinos, check-ins e cuidados). Não é medida de saúde. */
function meuRitmo(){
  const dias = Array.from({ length: 14 }, (_, i) => addD(today(), -i)), feitos = diasTreino(), meta = (ME.perfil && ME.perfil.dias) || 3;
  const tr = dias.filter(d => feitos.has(d)).length, ck = (H => dias.filter(d => H[d]).length)(HUM.get());
  const cuid = dias.filter(d => { const x = (ME.diario || {})[d]; return x && (x.agua || REFS.some(([k]) => (x[k] || []).length)); }).length;
  const v = Math.round(Math.min(60, 60 * tr / (meta * 2)) + Math.min(15, 15 * ck / 7) + Math.min(15, 15 * cuid / 10) + (streak() > 0 ? 10 : 0));
  const txt = v >= 80 ? "Semana incrível 💚" : v >= 55 ? "Bom ritmo 💚" : v >= 30 ? "Construindo sua rotina" : (ME.treinos || []).length >= 3 ? "Vamos retomar juntas?" : (ME.treinos || []).length ? "Bom começo 💚" : "Seu ritmo começa hoje";
  return { v: Math.min(100, v), txt };
}
function xLeve(){ return QUICK.find(q => /mobil|along/i.test(q.foco + q.nome)) || QUICK[QUICK.length - 1]; }
/* último item visto no Explorar (para "continue de onde parou") */
const XULT = { get(){ try{ return JSON.parse(localStorage.getItem("ck_ult_" + ME.id) || "null"); }catch(e){ return null; } }, set(v){ try{ localStorage.setItem("ck_ult_" + ME.id, JSON.stringify(v)); }catch(e){} } };
[["abrirEmp", "emp"], ["abrirProf", "prof"], ["abrirProd", "prod"]].forEach(([fn, t]) => {
  const L = { emp: () => DB.empresas, prof: () => DB.profissionais, prod: () => DB.produtos }[t];
  const orig = { abrirEmp, abrirProf, abrirProd }[fn];
  const novo = function(id){ const r = orig.apply(this, arguments); try{ const x = (L() || []).find(y => y.id === id); if(x) XULT.set({ t, id, nome: x.nome, foto: x.foto || x.logo || "", em: Date.now() }); }catch(e){} return r; };
  if(fn === "abrirEmp") abrirEmp = novo; else if(fn === "abrirProf") abrirProf = novo; else abrirProd = novo;
});

/* ---------- Início: meu dia ---------- */
const rInicio0 = rInicio;
rInicio = function(){
  rInicio0.apply(this, arguments);
  const box = $("t-inicio"); if(!box || !ME) return;
  const s = streak(), feitos = diasTreino(), hojeFeito = feitos.has(today()), T = treinoDoDia(), hm = humorHoje(), nome = esc(ME.nome.split(" ")[0]), h = new Date().getHours();
  const tx = box.querySelector(".capa-tx");
  if(tx){ const hi = tx.querySelector(".hi"), h1 = tx.querySelector("h1"), p = tx.querySelector("p");
    if(hi) hi.textContent = `${saudacao()}, ${ME.nome.split(" ")[0]} ${h < 12 ? "☀️" : "💚"}`;
    if(h1) h1.textContent = hojeFeito ? "Treino de hoje feito. Que orgulho!" : s >= 2 ? `${s} dias mantendo sua sequência 🔥` : hm && hm.e === "baixa" ? "Hoje, no seu ritmo." : "Vamos cuidar de você hoje?";
    if(p) p.textContent = hojeFeito ? "Que tal registrar como você está ou ver a comunidade?" : `Hoje tem ${T.nome}.`; }
  const fr = box.querySelector(".frase-dia"); if(fr) fr.remove();
  const r = meuRitmo(), prox = XMARCOS.find(m => m > s), anel = 2 * Math.PI * 34;
  const ctx = [];
  if(!hojeFeito && hm && (hm.e === "baixa" || hm.h === "1")){ const L = xLeve(); ctx.push(`<div class="xe-rec"><span class="eyebrow">Recuperação</span><b>Seu corpo pediu um ritmo diferente hoje.</b><p>Você contou que está com pouca energia. Que tal algo leve? Seu treino de hoje continua disponível.</p><button class="btn btn-accent btn-sm" id="xe-leve">${ic("play", 14)} Ver treino leve · ${esc(L.nome)}</button></div>`); }
  const ult = XULT.get(); if(ult && Date.now() - ult.em < 3 * 864e5 && !ME.xUltOff) ctx.push(`<div class="xe-ctx" id="xe-ult"><span class="xe-ctx-f">${ult.foto ? `<img src="${esc(ult.foto)}" alt="" loading="lazy" onerror="this.remove()">` : ic("explorar", 20)}</span><span><small>Você estava vendo</small><b>${esc(ult.nome)}</b></span><button class="btn btn-soft btn-sm" id="xe-ult-go">Continuar</button><button class="iconbtn sm" id="xe-ult-x" aria-label="Dispensar">${ic("close", 14)}</button></div>`);
  const dz = desafioAtual(); if(dz) ctx.push(desafioCard(dz, true));
  const html = `<div class="xe-dia">
    ${!hm ? `<div class="xe-ck card"><b>Como você está hoje?</b><div class="xe-hum">${XHUMOR.map(([k, e, n]) => `<button data-hm="${k}" aria-label="${n}"><i>${e}</i><small>${n}</small></button>`).join("")}</div></div>`
      : `<button class="xe-ck-ok" id="xe-ck-ed">${XHUMOR.find(x => x[0] === hm.h)[1]} <span>Hoje você está <b>${XHUMOR.find(x => x[0] === hm.h)[2].toLowerCase()}</b>${hm.e ? ` · ${XENERGIA.find(x => x[0] === hm.e)[1].toLowerCase()}` : ""}</span><em>mudar</em></button>`}
    <div class="xe-rit card"><div class="xe-ring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="34" class="bg"/><circle cx="40" cy="40" r="34" class="fg" style="--c:${anel};stroke-dasharray:${anel};stroke-dashoffset:${anel * (1 - r.v / 100)}"/></svg><b class="num">${r.v}</b></div>
      <div class="xe-rit-tx"><span class="eyebrow">Meu Ritmo</span><b>${r.txt}</b><small>Treinos, check-ins e cuidados dos últimos 14 dias</small></div>
      <div class="xe-seq ${s ? "on" : ""}"><i>🔥</i><b class="num">${s}</b><small>${s === 1 ? "dia" : "dias"}</small></div></div>
    <p class="xe-seq-tx">${s >= 3 ? "Você está construindo uma rotina." : s ? "Boa! Continue amanhã para crescer sua sequência." : (ME.treinos || []).length ? "Hoje começa uma nova sequência." : "Seu primeiro treino começa sua sequência."}${prox ? ` <span class="muted">Próximo marco: ${prox} dias.</span>` : ""}</p>
    ${ctx.join("")}</div>`;
  const alvo = box.querySelector(".today"); if(alvo) alvo.insertAdjacentHTML(hm && hm.e === "baixa" ? "beforebegin" : "afterend", html);
  box.querySelectorAll("[data-hm]").forEach(b => b.onclick = () => { b.classList.add("pop"); vibra(12); SOM.tap && SOM.tap(); setTimeout(() => checkinDia(b.dataset.hm), 180); });
  const ed = $("xe-ck-ed"); if(ed) ed.onclick = () => checkinDia(hm.h, true);
  const lv = $("xe-leve"); if(lv) lv.onclick = () => abrirTreinoPreview(treinoRapido(xLeve()));
  const ug = $("xe-ult-go"); if(ug) ug.onclick = () => ({ emp: abrirEmp, prof: abrirProf, prod: abrirProd })[ult.t](ult.id);
  const ux = $("xe-ult-x"); if(ux) ux.onclick = () => { XULT.set(null); rInicio(); };
  ligaDesafio(box);
};
function checkinDia(h, editar){
  sheet("Como você está hoje?", `<div class="xe-hum grande">${XHUMOR.map(([k, e, n]) => `<button data-hm="${k}" aria-pressed="${k === h}"><i>${e}</i><small>${n}</small></button>`).join("")}</div>
    <h3 style="font-size:16px;margin:16px 0 8px">E a sua energia?</h3><div class="chips">${XENERGIA.map(([k, n]) => `<button class="chip" data-en="${k}" aria-pressed="${((humorHoje() || {}).e || "") === k}">${n}</button>`).join("")}</div>
    <p class="hint" style="margin-top:14px">${ic("lock", 13)} Fica só neste aparelho. Usamos isso para deixar o seu dia no CK Life mais do seu jeito.</p>
    <button class="btn btn-accent btn-block btn-lg" id="ck-ok">Pronto</button>`, rInicio);
  let hs = h, en = (humorHoje() || {}).e || "";
  const b = $("sheet-body");
  b.querySelectorAll("[data-hm]").forEach(x => x.onclick = () => { hs = x.dataset.hm; b.querySelectorAll("[data-hm]").forEach(y => y.setAttribute("aria-pressed", y === x)); });
  b.querySelectorAll("[data-en]").forEach(x => x.onclick = () => { en = x.dataset.en; b.querySelectorAll("[data-en]").forEach(y => y.setAttribute("aria-pressed", y === x)); });
  $("ck-ok").onclick = () => { const H = HUM.get(); H[today()] = { h: hs, e: en || null };
    const ks = Object.keys(H).sort(); if(ks.length > 60) ks.slice(0, ks.length - 60).forEach(k => delete H[k]); HUM.set(H); SOM.check && SOM.check(); vibra(15); fecharSheet(); toast(en === "baixa" ? "Anotado. Hoje vamos no seu ritmo 💚" : editar ? "Atualizado 💚" : "Obrigada por contar 💚"); };
}

/* ---------- Desafios pessoais (sem competição de corpo) ---------- */
const DESAFIOS = [["d7", 7, "Desafio 7 dias", "Uma semana cuidando de você", "🌱"], ["d21", 21, "Desafio 21 dias", "O tempo de criar um hábito", "✨"], ["d30", 30, "Desafio 30 dias", "Um mês de evolução", "🏆"]];
function desafioAtual(){ const d = ME.desafio; if(!d) return null; const D = DESAFIOS.find(x => x[0] === d.id); if(!D) return null;
  const feitos = [...diasTreino()].filter(x => x >= d.ini).length; return { D, ini: d.ini, feitos: Math.min(feitos, D[1]), ok: feitos >= D[1] }; }
function desafioCard(z, compacto){ const pc = Math.round(100 * z.feitos / z.D[1]);
  return `<div class="xe-des ${compacto ? "comp" : ""}"><span class="xe-des-em">${z.D[4]}</span><div><span class="eyebrow">Seu desafio</span><b>${esc(z.D[2])}</b><small class="num">${z.feitos} de ${z.D[1]} dias de treino</small><span class="bar"><i style="width:${pc}%"></i></span></div>${compacto ? `<button class="iconbtn sm" data-desver aria-label="Ver desafio">${ic("back", 16)}</button>` : ""}</div>`; }
function ligaDesafio(box){ box.querySelectorAll("[data-desver]").forEach(b => b.onclick = () => { TV = "programas"; tab("treinar"); }); }
function verificaDesafio(){ const z = desafioAtual(); if(!z || !z.ok || ME.desafio.fim) return;
  ME.desafio.fim = today(); ME.desafiosOk = (ME.desafiosOk || []).concat([{ id: z.D[0], d: today() }]); save();
  setTimeout(() => celebrar([z.D[0] + "-" + today(), "x", 0, z.D[4], z.D[2].toUpperCase() + " CONCLUÍDO", `${z.D[1]} dias de treino. Você foi até o fim.`]), 2400); }
function blocoDesafios(){ const z = desafioAtual();
  return `<div class="xe-desafios"><div class="sec-title"><h3>Desafios</h3>${(ME.desafiosOk || []).length ? `<span class="muted num" style="font-size:13px">${ME.desafiosOk.length} concluído${ME.desafiosOk.length > 1 ? "s" : ""}</span>` : ""}</div>
    ${z && !z.ok ? desafioCard(z) + `<button class="link" id="des-sair" style="margin-top:6px">Sair do desafio</button>` : `<div class="hscroll xe-des-row">${DESAFIOS.map(D => `<button class="xe-des-op" data-des="${D[0]}"><i>${D[4]}</i><b>${D[2]}</b><small>${D[3]}</small><span>Participar</span></button>`).join("")}</div>`}</div>`; }
const rTreinar0 = rTreinar;
rTreinar = function(){ rTreinar0.apply(this, arguments); const el = $("t-treinar"), sg = el && el.querySelector(".seg"); if(!sg || TV !== "programas") return;
  sg.insertAdjacentHTML("afterend", blocoDesafios());
  el.querySelectorAll("[data-des]").forEach(b => b.onclick = () => { const D = DESAFIOS.find(x => x[0] === b.dataset.des);
    sheet(D[2], `<div class="xe-des-hero"><i>${D[4]}</i><h2>${D[2]}</h2><p>${D[3]}. Treine em ${D[1]} dias diferentes, no seu tempo. Cada dia com treino conta, sem pressa e sem comparação.</p></div><button class="btn btn-accent btn-block btn-lg" id="des-ok">Participar</button>`);
    $("des-ok").onclick = () => { ME.desafio = { id: D[0], ini: today() }; save(); SOM.check && SOM.check(); vibra([20, 30, 20]); fecharSheet(); toast("Desafio começou! Bora 💚"); rTreinar(); }; });
  const sa = $("des-sair"); if(sa) sa.onclick = () => { if(!confirm("Sair do desafio? Seus treinos continuam salvos.")) return; ME.desafio = null; save(); rTreinar(); };
};

/* ---------- Momentos especiais ---------- */
CONQ.splice(CONQ.findIndex(c => c[0] === "t50"), 0, ["t30", "t", 30, "💚", "30 TREINOS", "30 vezes que você escolheu continuar."]);
CONQ.push(["s50", "s", 50, "💫", "50 DIAS DE CONSISTÊNCIA", "Cinquenta dias seguidos. Que jornada."], ["s100", "s", 100, "👑", "100 DIAS DE CONSISTÊNCIA", "Cem dias. Isso é quem você é agora."]);
async function storyMomento(emoji, titulo, sub){
  const W = 1080, H = 1920, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
  try{ await document.fonts.load("800 90px 'Bricolage Grotesque'"); }catch(e){}
  const g = x.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, "#0B2A22"); g.addColorStop(.55, "#1F5C46"); g.addColorStop(1, "#6E9E6D"); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalAlpha = .07; x.fillStyle = "#fff"; [[.2, .18, 260], [.85, .35, 200], [.15, .72, 180], [.8, .86, 280]].forEach(([a, b, r]) => { x.beginPath(); x.arc(W * a, H * b, r, 0, 7); x.fill(); }); x.globalAlpha = 1;
  const F1 = "'Bricolage Grotesque','Avenir Next',system-ui,sans-serif", F2 = "Figtree,system-ui,sans-serif";
  x.textAlign = "center"; x.font = `260px ${F2}`; x.fillText(emoji, W / 2, H * .4);
  x.fillStyle = "#fff"; x.font = `800 96px ${F1}`; const pal = titulo.split(" "), lin = []; let l = ""; pal.forEach(p => { const t = l ? l + " " + p : p; if(x.measureText(t).width > W - 160){ lin.push(l); l = p; } else l = t; }); lin.push(l);
  lin.forEach((t, i) => x.fillText(t, W / 2, H * .52 + i * 108));
  x.fillStyle = "rgba(255,255,255,.86)"; x.font = `500 50px ${F2}`; x.fillText(sub, W / 2, H * .52 + lin.length * 108 + 40);
  x.fillStyle = "#fff"; x.font = `800 60px ${F1}`; const w1 = x.measureText("CK ").width, w2 = x.measureText("Life").width, x0 = W / 2 - (w1 + w2) / 2; x.textAlign = "left"; x.fillText("CK ", x0, H - 150); x.fillStyle = "#B9DDB2"; x.fillText("Life", x0 + w1, H - 150);
  return new Promise(ok => cv.toBlob(ok, "image/jpeg", .88));
}
async function publicarMomento(emoji, titulo, sub){
  if(!SO.on()) return toast("Entre na comunidade para publicar Stories");
  const blob = await storyMomento(emoji, titulo, sub);
  sheet("Adicionar aos Stories", `<div class="xe-st-prev"><img src="${await blobParaURL(blob)}" alt="Prévia do Story"></div><p class="hint" style="text-align:center">${ic("clock", 13)} Fica visível por 24 horas para quem pode ver seu perfil.</p><button class="btn btn-accent btn-block btn-lg" id="xm-pub">Publicar</button>`);
  $("xm-pub").onclick = async () => { const b = $("xm-pub"); b.disabled = true; b.classList.add("carregando");
    try{ await garantePerfil(); const midia = await sobe("story", NU.uid, blob, "jpg", "image/jpeg"); await q(SB().from("stories").insert({ user_id: NU.uid, midia, texto: null, cor: CORES_ST[0] }));
      SOM.done ? SOM.done() : SOM.check(); vibra([30, 40, 30]); fecharSheet(); toast("No ar nos seus Stories 💚"); carregaStories(); }
    catch(e){ toast(ERR_MSG(e)); b.disabled = false; b.classList.remove("carregando"); } };
}
const celebrar0 = celebrar;
celebrar = async function(c){ await celebrar0(c); vibra([40, 60, 120]);
  const sh = $("ce-share"); if(sh && SO.on()){ sh.insertAdjacentHTML("beforebegin", `<button class="btn btn-share btn-block" id="ce-story">${ic("plus", 18)} Adicionar aos Stories</button>`);
    $("ce-story").onclick = () => { const bx = $("celebra"); if(bx){ bx.hidden = true; bx.innerHTML = ""; } compartilharConquista((ME.treinos || []).slice(-1)[0] && (ME.treinos || []).slice(-1)[0].d === today() ? (ME.treinos || []).slice(-1)[0] : null); }; }
  const em = document.querySelector("#celebra .so-cel-in"); if(em && !em.querySelector(".xe-moment")) em.insertAdjacentHTML("afterbegin", `<span class="xe-moment">CK Moment</span>`);
};
const fimTreino0 = fimTreino;
fimTreino = function(parcial){ fimTreino0.apply(this, arguments);
  const sh = $("fim-share"), t = (ME.treinos || []).slice(-1)[0];
  if(!parcial && t){
    // momento CK Life: mensagem variada + Create · Keep · Live
    const h = document.querySelector("#play .done-hero h2"), pp = h && h.nextElementSibling;
    if(h) h.textContent = FIM_TIT[Math.floor(Math.random() * FIM_TIT.length)];
    if(pp && pp.tagName === "P") pp.textContent = FIM_MSG[Math.floor(Math.random() * FIM_MSG.length)];
    if(h) h.insertAdjacentHTML("beforebegin", `<div class="ckl-mom" aria-label="${MARCA.slogan}"><span>CREATE <i>✓</i></span><span>KEEP <i>✓</i></span><span>LIVE <i>♥</i></span></div>`);
    const ok = $("fim-ok"); if(ok){ ok.insertAdjacentHTML("beforebegin", `<button class="btn btn-accent btn-lg btn-block" id="fim-conq">${ic("share", 18)} Compartilhar minha conquista</button>`); ok.classList.remove("btn-accent"); ok.classList.add("btn-share");
      $("fim-conq").onclick = () => { if(!SO.on()) return toast("Entre na comunidade para publicar Stories"); compartilharConquista(t); }; } }
  verificaDesafio();
};
/* aniversário de jornada: uma vez por ano */
function surpresaAniversario(){ if(!ME || !ME.criado) return; const c = ME.criado, h = today(), anos = +h.slice(0, 4) - +c.slice(0, 4);
  if(anos >= 1 && c.slice(5) === h.slice(5) && ME.xAniv !== h.slice(0, 4)){ ME.xAniv = h.slice(0, 4); save(); setTimeout(() => celebrar(["aniv" + anos, "x", 0, "🎂", anos === 1 ? "1 ANO DE JORNADA" : `${anos} ANOS DE JORNADA`, "Obrigada por crescer com a gente."]), 2500); } }
const abrirApp0 = abrirApp;
abrirApp = function(){ abrirApp0.apply(this, arguments); try{ surpresaAniversario(); }catch(e){} };

/* ---------- Minha Jornada e coleção de conquistas ---------- */
function eventosJornada(){
  const E = [], T = ME.treinos || [];
  if(ME.criado) E.push([ME.criado, "🌿", "Entrou no CK Life"]);
  if(T.length) E.push([T[0].d, "🌱", "Primeiro treino"]);
  Object.entries(ME.conq || {}).forEach(([k, d]) => { const c = CONQ.find(x => x[0] === k); if(c && k !== "t1") E.push([d, c[3], c[4].charAt(0) + c[4].slice(1).toLowerCase()]); });
  (ME.desafiosOk || []).forEach(z => { const D = DESAFIOS.find(x => x[0] === z.id); if(D) E.push([z.d, D[4], D[2] + " concluído"]); });
  return E.filter(e => e[0]).sort((a, b) => a[0].localeCompare(b[0]));
}
function minhaJornada(){
  const E = eventosJornada(), M = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
  sheet("Minha Jornada", `<p class="hint">Sua história no CK Life. Só você vê.</p><div class="xe-tl">${E.map(([d, e, t]) => `<div class="xe-tl-i"><span class="xe-tl-d num"><b>${d.slice(8, 10)}</b>${M[+d.slice(5, 7) - 1]}${d.slice(0, 4) !== today().slice(0, 4) ? " " + d.slice(2, 4) : ""}</span><i>${e}</i><b>${esc(t)}</b></div>`).join("")}
    <div class="xe-tl-i hoje"><span class="xe-tl-d"><b>Hoje</b></span><i>💚</i><b>Sua história continua…</b></div></div>`);
}
function colecaoConquistas(){
  const n = (ME.treinos || []).length, s = streak(), tem = ME.conq || {};
  sheet("Conquistas", `<p class="hint">${Object.keys(tem).length} de ${CONQ.length} desbloqueadas. Cada uma conta a sua história.</p><div class="xe-col">${CONQ.map(c => { const ok = tem[c[0]], falta = c[2] - (c[1] === "t" ? n : s);
    return `<button class="xe-cq ${ok ? "ok" : ""}" data-cq="${c[0]}"><i>${ok ? c[3] : "🔒"}</i><b>${esc(c[4].charAt(0) + c[4].slice(1).toLowerCase())}</b><small>${ok ? brD(ok) : c[1] === "t" ? `faltam ${Math.max(1, falta)} treino${falta > 1 ? "s" : ""}` : `${c[2]} dias seguidos`}</small></button>`; }).join("")}</div>`);
  $("sheet-body").querySelectorAll(".xe-cq.ok").forEach(b => b.onclick = () => { const c = CONQ.find(x => x[0] === b.dataset.cq); fecharSheet(); celebrar(c); });
}
const rPerfil0 = rPerfil;
rPerfil = function(){ rPerfil0.apply(this, arguments); const el = $("t-perfil"); if(!el) return;
  const nc = Object.keys(ME.conq || {}).length, ne = eventosJornada().length, alvo = el.querySelector(".pstats");
  if(alvo) alvo.insertAdjacentHTML("afterend", `<div class="xe-hist"><button id="xe-jor"><i>🗺️</i><b>Minha Jornada</b><small>${ne} momento${ne === 1 ? "" : "s"}</small></button><button id="xe-cqs"><i>🏆</i><b>Conquistas</b><small>${nc} de ${CONQ.length}</small></button></div>`);
  $("xe-jor").onclick = minhaJornada; $("xe-cqs").onclick = colecaoConquistas;
};

/* ---------- Comunidade: entrada de publicação e vazios com próximo passo ---------- */
const XFRASES = ["O que você fez por você hoje?", "Conta pra gente como foi seu dia 💚", "Qual foi sua vitória de hoje?"];
setInterval(() => { const c = [...document.querySelectorAll("#cm-nova > span")].find(x => /compartilhar/.test(x.textContent)); if(c && !c.dataset.x){ c.dataset.x = 1; c.textContent = (ME && diasTreino().has(today())) ? "Treino feito? Conta como foi 💚" : XFRASES[new Date().getDate() % XFRASES.length]; } }, 1200);

/* ---------- Explorar: busca com sugestões ---------- */
const rExplorar0 = rExplorar;
rExplorar = function(){ rExplorar0.apply(this, arguments); const q0 = $("xq"); if(!q0 || q0.dataset.sug) return; q0.dataset.sug = 1;
  q0.closest(".search").insertAdjacentHTML("afterend", `<div class="chips scroll xe-sug" id="xe-sug" hidden>${["Academia", "Nutricionista", "Personal", "Pilates", "Legging", "Skincare"].map(s => `<button class="chip" data-sug="${s}">${s}</button>`).join("")}</div>`);
  const sg = $("xe-sug"); q0.addEventListener("focus", () => { if(!q0.value) sg.hidden = false; }); q0.addEventListener("input", () => { sg.hidden = !!q0.value; });
  sg.querySelectorAll("[data-sug]").forEach(b => b.onmousedown = e => { e.preventDefault(); q0.value = b.dataset.sug; q0.dispatchEvent(new Event("input")); sg.hidden = true; }); };
