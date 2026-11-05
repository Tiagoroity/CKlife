/* ===================== CORRIDA / CAMINHADA (cronômetro) =====================
   Só o tempo: ela escolhe Caminhada, Trote ou Corrida, aperta Começar e o cronômetro roda.
   O tempo é calculado pela hora de início, então continua certo com a tela bloqueada ou o app fechado.
   Calorias = intensidade (MET) × peso (kg) × horas. É estimativa e aparece como "≈".
   Ao terminar conta como treino (sequência, medalhas, 1º treino no painel). */
const COR_K = "ck_corrida";
const COR_TIPOS = [["caminhada", "Caminhada", "🚶‍♀️", 3.5, "Ritmo leve, conversando"], ["trote", "Trote", "🏃‍♀️", 7, "Corrida leve, respiração firme"], ["corrida", "Corrida", "🔥", 9.8, "Ritmo forte, ofegante"]];
const corLe = () => { try{ return JSON.parse(localStorage.getItem(COR_K) || "null"); }catch(e){ return null; } };
const corGrava = o => { try{ o ? localStorage.setItem(COR_K, JSON.stringify(o)) : localStorage.removeItem(COR_K); }catch(e){} };
const corPeso = () => { const L = (ME && ME.pesos) || []; const p = L.length ? +L[L.length - 1].kg : +(ME && ME.perfil && ME.perfil.peso); return p > 30 && p < 300 ? p : 65; };
const corTipo = k => COR_TIPOS.find(t => t[0] === k) || COR_TIPOS[0];
const corMs = s => !s ? 0 : Math.max(0, (s.pausado || Date.now()) - s.ini - (s.pausas || 0));
const corKcal = (k, ms) => Math.round(corTipo(k)[3] * corPeso() * ms / 3600000);
const corFmt = ms => { const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60, p = n => String(n).padStart(2, "0"); return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`; };
let COR_INT = null, COR_LOCK = null;

/* cartão na aba Treinos */
function corCard(){
  const el = $("t-treinar"); if(!el || $("cor-card")) return;
  const L = (ME && ME.corridas) || [], sem = L.filter(c => c.d >= addD(today(), -6)), andando = corLe();
  const alvo = el.querySelector(".capa"); const html = `<button class="cor-card" id="cor-card">
    <span class="cor-ic">🏃‍♀️</span><span class="cor-tx"><b>${andando ? "Corrida em andamento · " + corFmt(corMs(andando)) : "Corrida e caminhada"}</b><small>${andando ? "Toque para voltar ao cronômetro" : sem.length ? `${sem.length} na semana · ${int(sem.reduce((s, c) => s + (c.min || 0), 0))} min · ≈ ${int(sem.reduce((s, c) => s + (c.kcal || 0), 0))} kcal` : "Cronômetro com calorias estimadas pelo seu peso"}</small></span>
    <span class="cor-bt">${andando ? "Abrir" : "Começar"}</span></button>`;
  alvo ? alvo.insertAdjacentHTML("afterend", html) : el.insertAdjacentHTML("afterbegin", html);
  $("cor-card").onclick = () => corLe() ? corTela() : corEscolhe();
}
const rTreinarCor = rTreinar; rTreinar = function(){ const r = rTreinarCor.apply(this, arguments); try{ corCard(); }catch(e){ console.warn(e); } return r; };

/* janela cheia */
function corBox(html){
  let b = $("cor"); if(!b){ b = document.createElement("div"); b.id = "cor"; b.className = "cor"; b.setAttribute("role", "dialog"); b.setAttribute("aria-modal", "true"); document.body.appendChild(b); }
  b.innerHTML = `<div class="cor-in">${html}</div>`; document.body.classList.add("cor-on"); return b;
}
function corFecha(){ clearInterval(COR_INT); COR_INT = null; try{ COR_LOCK && COR_LOCK.release(); }catch(e){} COR_LOCK = null; const b = $("cor"); if(b) b.remove(); document.body.classList.remove("cor-on"); try{ if(TAB === "treinar") rTreinar(); }catch(e){} }

function corEscolhe(){
  corBox(`<button class="cor-x" id="cor-x" aria-label="Fechar">✕</button>
    <span class="cor-eb">Corrida e caminhada</span><h1>Qual vai ser hoje?</h1>
    <p class="cor-sub">Só o tempo conta. As calorias são estimadas pelo seu peso (${String(corPeso()).replace(".", ",")} kg).</p>
    <div class="cor-tipos">${COR_TIPOS.map(([k, n, e, , d]) => `<button class="cor-t" data-k="${k}"><span>${e}</span><b>${n}</b><small>${d}</small></button>`).join("")}</div>`);
  $("cor-x").onclick = corFecha;
  document.querySelectorAll("#cor [data-k]").forEach(b => b.onclick = () => { corGrava({ tipo: b.dataset.k, ini: Date.now(), pausas: 0, pausado: null }); SOM.chime && SOM.chime(); corTela(); });
}
async function corTelaAcesa(){ try{ if("wakeLock" in navigator) COR_LOCK = await navigator.wakeLock.request("screen"); }catch(e){} }
function corTela(){
  const s = corLe(); if(!s) return corEscolhe();
  const [, nome, emo] = corTipo(s.tipo);
  corBox(`<span class="cor-eb">${emo} ${nome}</span>
    <div class="cor-relogio" id="cor-t">${corFmt(corMs(s))}</div>
    <div class="cor-kcal">≈ <b id="cor-k">${corKcal(s.tipo, corMs(s))}</b> kcal <small>(estimativa)</small></div>
    <p class="cor-dica" id="cor-dica">${s.pausado ? "Pausado" : "Pode bloquear a tela: o tempo continua certo."}</p>
    <div class="cor-acoes"><button class="btn cor-pausa" id="cor-p">${s.pausado ? "▶ Continuar" : "⏸ Pausar"}</button><button class="btn cor-fim" id="cor-f">■ Terminar</button></div>
    <button class="cor-sair" id="cor-min">minimizar</button>`);
  const pinta = () => { const a = corLe(); if(!a) return; const ms = corMs(a); const t = $("cor-t"), k = $("cor-k"); if(t) t.textContent = corFmt(ms); if(k) k.textContent = corKcal(a.tipo, ms); };
  clearInterval(COR_INT); COR_INT = setInterval(pinta, 1000); pinta(); if(!s.pausado) corTelaAcesa();
  $("cor-p").onclick = () => { const a = corLe(); if(!a) return; if(a.pausado){ a.pausas += Date.now() - a.pausado; a.pausado = null; corTelaAcesa(); } else a.pausado = Date.now(); corGrava(a); corTela(); };
  $("cor-f").onclick = corTermina;
  $("cor-min").onclick = () => { clearInterval(COR_INT); COR_INT = null; const b = $("cor"); if(b) b.remove(); document.body.classList.remove("cor-on"); try{ if(TAB === "treinar") rTreinar(); }catch(e){} };
}
function corTermina(){
  const s = corLe(); if(!s) return corFecha();
  const ms = corMs(s), min = Math.round(ms / 60000), kcal = corKcal(s.tipo, ms), [, nome, emo] = corTipo(s.tipo);
  if(ms < 60000){
    corBox(`<span class="cor-eb">${emo} ${nome}</span><h1>Menos de 1 minuto</h1><p class="cor-sub">Para salvar, a atividade precisa ter pelo menos 1 minuto.</p>
      <div class="cor-acoes"><button class="btn cor-pausa" id="cor-volta">Continuar</button><button class="btn cor-fim" id="cor-desc">Descartar</button></div>`);
    $("cor-volta").onclick = corTela; $("cor-desc").onclick = () => { corGrava(null); corFecha(); }; return;
  }
  corGrava(null);
  ME.corridas = ME.corridas || []; ME.corridas.push({ d: today(), tipo: s.tipo, min, kcal });
  ME.treinos = ME.treinos || []; ME.treinos.push({ d: today(), h: new Date().getHours(), nome, min, kcal, exs: 0, parcial: false, corrida: s.tipo });
  save(); try{ setTimeout(() => checaConquistas(), 1200); }catch(e){}
  try{ if(ME.primeiro && !ME.primeiro.feito){ ME.primeiro.feito = today(); save(); } }catch(e){}
  corBox(`<div class="cor-ok">✓</div><span class="cor-eb">${emo} ${nome} concluída</span><h1>Mandou bem! 💚</h1>
    <div class="cor-res"><div><b>${corFmt(ms)}</b><small>tempo</small></div><div><b>≈ ${int(kcal)}</b><small>kcal (estimativa)</small></div></div>
    <p class="cor-sub">Conta como treino de hoje na sua sequência.</p>
    <div class="cor-acoes"><button class="btn cor-fim" id="cor-ok">Concluir</button></div>`);
  try{ SOM.done && SOM.done(); confete($("cor")); }catch(e){}
  $("cor-ok").onclick = corFecha;
}
/* se ela fechou o app no meio da corrida, ao abrir o app a corrida aparece de novo */
{ const abrirCor = abrirApp; abrirApp = function(){ const r = abrirCor.apply(this, arguments); try{ if(corLe()) setTimeout(() => { if(!$("cor")) corTela(); }, 1200); }catch(e){} return r; }; }
