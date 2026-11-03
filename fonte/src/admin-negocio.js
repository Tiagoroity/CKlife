/* ===================== Painel · Ficha da aluna, Visão do negócio e Retenção =====================
   Tudo acrescentado: a ficha entra no topo da janela "Editar aluna"; os dois cartões entram no Dashboard.
   Contas da equipe e de teste não entram em nenhum número. Nada é inventado: só o que está registrado. */
const ngReais = () => DB().users.filter(u => !u.admin && !u.soAdmin && !u.exemplo && !ehTeste(u));
/* dias em que cada aluna apareceu (acessos registrados + treinos + aberturas) */
function ngDiasAtivos(){
  const db = DB(), M = {};
  const add = (id, d) => { if(!id || !d) return; (M[id] = M[id] || new Set()).add(String(d).slice(0, 10)); };
  Object.entries(db.acessos || {}).forEach(([d, ids]) => (ids || []).forEach(id => add(id, d)));
  db.users.forEach(u => { (u.treinos || []).forEach(t => t && add(u.id, t.d)); add(u.id, u.ultimo); add(u.id, u.acApp); add(u.id, u.acWeb); });
  return M;
}
const ngPct = (a, b) => b ? Math.round(100 * a / b) : 0;
const ngBr = d => { try{ const [a, m, x] = String(d).slice(0, 10).split("-"); return `${x}/${m}`; }catch(e){ return ""; } };

/* ---------- B) Ficha completa da aluna (topo da janela Editar aluna) ---------- */
{ const formAlunoNg = formAluno; formAluno = function(u){
  const r = formAlunoNg.apply(this, arguments);
  try{
    const box = $("mbox"); if(!box || !u) return r;
    const T = (u.treinos || []).filter(t => t && t.d).slice().sort((a, b) => String(b.d).localeCompare(String(a.d)));
    const orig = window.ckOrigemAluna ? window.ckOrigemAluna(u) : "", [st, sk] = statusPrem(u);
    const app = zApp(u) ? `📲 Instalou${u.pwaInstalado ? " em " + brD(u.pwaInstalado) : ""}` : u.acWeb ? `🌐 Usa pelo navegador (abriu ${brD(u.acWeb)})` : "❔ Ainda não abriu desde 01/11";
    const ev = [];
    if(u.criadoEm || u.criado) ev.push([u.criadoEm || u.criado, "🌱", "Chegou no CK Life" + (orig ? " · " + orig : "")]);
    if(u.pwaInstalado) ev.push([u.pwaInstalado, "📲", "Instalou o app"]);
    T.slice().reverse().slice(0, 1).forEach(t => ev.push([t.d, "🏁", "Primeiro treino · " + (t.nome || "treino")]));
    T.slice(0, 5).forEach(t => ev.push([t.d + "T23:59", "💪", (t.nome || "Treino") + (t.min ? ` · ${t.min} min` : "")]));
    if(u.ultimo) ev.push([u.ultimo + "T23:58", "👀", "Último acesso"]);
    const uniq = [], vistos = new Set(); ev.sort((a, b) => String(b[0]).localeCompare(String(a[0]))).forEach(e => { const k = e[2] + String(e[0]).slice(0, 10); if(!vistos.has(k)){ vistos.add(k); uniq.push(e); } });
    const f = typeof zFase === "function" ? zFase(u) : null, msg = f && ZAP_MSG.find(x => x[0] === f);
    const html = `<div class="ficha"><div class="ficha-top"><div class="ficha-av">${esc((u.nome || "?").trim().charAt(0).toUpperCase())}</div><div><b>${esc(u.nome || u.email)}</b><small>${esc(u.email || "")}${u.whats ? " · " + esc(u.whats) : ""}</small><div class="ficha-tags"><span class="st ${sk}">${esc(st)}</span>${ehTeste(u) ? `<span class="st off">teste · não conta</span>` : ""}</div></div></div>
      <div class="ficha-g">
        <div><span>Chegou</span><b>${esc(quandoChegou(u) || "—")}</b></div>
        <div><span>Veio de</span><b>${esc(orig || "Direto")}</b></div>
        <div><span>Cidade</span><b>${esc(cidNomeU(u) || "—")}</b></div>
        <div><span>App</span><b>${esc(app)}</b></div>
        <div><span>Treinos</span><b>${int(T.length)}${T[0] ? ` · último ${brD(T[0].d)}` : ""}</b></div>
        <div><span>Último acesso</span><b>${u.ultimo ? brD(u.ultimo) : "—"}</b></div>
      </div>
      ${uniq.length ? `<div class="ficha-tl"><span class="ficha-lbl">Linha do tempo</span>${uniq.slice(0, 8).map(e => `<div><i>${e[1]}</i><span>${esc(e[2])}</span><small>${brD(String(e[0]).slice(0, 10))}</small></div>`).join("")}</div>` : ""}
      ${msg && zDig(u.whats).length >= 10 ? `<button class="btn btn-accent btn-block" id="ficha-zap">💬 Mandar no WhatsApp: ${esc(msg[1])}</button>` : ""}
    </div>`;
    const mh = box.querySelector(".mh"); if(mh) mh.insertAdjacentHTML("afterend", html);
    const z = $("ficha-zap"); if(z) z.onclick = () => { const url = zLink(u, f); if(url) window.open(url, "_blank", "noopener"); };
  }catch(e){ console.warn("ficha", e); }
  return r;
}; }

/* ---------- E) Visão do negócio: funil do período, comparado com o período anterior ---------- */
let NG_P = 30;
function ngFunil(ini, fim, dias){
  const U = ngReais().filter(u => { const c = String(u.criado || ""); return c >= ini && c <= fim; });
  const ativa7 = u => { const s = dias[u.id]; if(!s) return false; for(const d of s) if(d >= addD(today(), -6)) return true; return false; };
  return { cad: U.length, treino: U.filter(u => (u.treinos || []).length).length, app: U.filter(zApp).length, ativa: U.filter(ativa7).length,
    teste: U.filter(u => catPlano(u) === "teste").length, pago: U.filter(u => catPlano(u) === "pago").length };
}
function ngNegocio(){
  const dias = ngDiasAtivos(), fim = today(), ini = addD(fim, -(NG_P - 1)), a = ngFunil(ini, fim, dias), b = ngFunil(addD(ini, -NG_P), addD(ini, -1), dias);
  const delta = (x, y) => { if(!y) return x ? `<em class="ng-up">novo</em>` : ""; const p = Math.round(100 * (x - y) / y); return `<em class="${p >= 0 ? "ng-up" : "ng-dn"}">${p >= 0 ? "▲" : "▼"} ${Math.abs(p)}%</em>`; };
  const passos = [["Cadastros", a.cad, b.cad, null], ["Fizeram o 1º treino", a.treino, b.treino, a.cad], ["Instalaram o app", a.app, b.app, a.cad], ["Ativas nos últimos 7 dias", a.ativa, b.ativa, a.cad], ["Em teste grátis", a.teste, b.teste, a.cad], ["Pagantes", a.pago, b.pago, a.cad]];
  const max = Math.max(1, a.cad);
  return `<div class="card ng-card" id="ng-neg"><div class="ng-h"><div><b>📈 Visão do negócio</b><small class="muted">Quem chegou nos últimos ${NG_P} dias e até onde foi. Comparado com os ${NG_P} dias anteriores.</small></div>
    <div class="ng-per" role="radiogroup" aria-label="Período">${[7, 30, 90].map(p => `<button class="chip" role="radio" data-ngp="${p}" aria-pressed="${NG_P === p}" aria-checked="${NG_P === p}">${p} dias</button>`).join("")}</div></div>
    <div class="ng-funil">${passos.map(([t, v, ant, base]) => `<div class="ng-p"><div class="ng-l"><span>${t}</span><b class="num">${int(v)}${base ? ` <small>${ngPct(v, base)}%</small>` : ""}</b>${delta(v, ant)}</div><div class="ng-bar"><i style="width:${Math.max(v ? 3 : 0, 100 * v / max)}%"></i></div></div>`).join("")}</div>
    ${ngDias14()}
    <p class="hint" style="margin:10px 0 0">A porcentagem é sobre quem se cadastrou no período. Contas da equipe e de teste não entram.</p></div>`;
}

/* cadastros e treinos por dia, últimos 14 dias */
function ngDias14(){
  const U = ngReais(), D = Array.from({ length: 14 }, (_, i) => addD(today(), i - 13));
  const cad = D.map(d => U.filter(u => String(u.criado || "").slice(0, 10) === d).length), tre = D.map(d => U.reduce((s, u) => s + (u.treinos || []).filter(t => t && t.d === d).length, 0));
  const mx = Math.max(1, ...cad, ...tre), soma = a => a.reduce((x, y) => x + y, 0);
  return `<div class="ng-d14"><div class="ng-d14-h"><b>Últimos 14 dias</b><span><i class="ng-k1"></i>Cadastros ${int(soma(cad))}</span><span><i class="ng-k2"></i>Treinos ${int(soma(tre))}</span></div>
    <div class="ng-cols">${D.map((d, i) => `<div class="ng-col" title="${ngBr(d)}: ${cad[i]} cadastro(s), ${tre[i]} treino(s)"><div class="ng-cb"><i class="ng-c1" style="height:${100 * cad[i] / mx}%"></i><i class="ng-c2" style="height:${100 * tre[i] / mx}%"></i></div><small>${i % 2 ? "" : ngBr(d)}</small></div>`).join("")}</div></div>`;
}
/* ---------- F) Retenção por semana de entrada ---------- */
function ngRetencao(){
  const dias = ngDiasAtivos(), U = ngReais().filter(u => u.criado), seg = d => { const x = new Date(d + "T12:00:00"); const k = (x.getDay() + 6) % 7; x.setDate(x.getDate() - k); return x.toISOString().slice(0, 10); };
  const semanas = []; for(let i = 7; i >= 0; i--) semanas.push(seg(addD(today(), -7 * i)));
  const linhas = semanas.map(s => {
    const C = U.filter(u => seg(String(u.criado).slice(0, 10)) === s);
    const cel = [1, 2, 3, 4].map(k => {
      const ini = addD(s, 7 * k), fim = addD(ini, 6); if(ini > today()) return null;
      const ok = C.filter(u => { const D = dias[u.id]; if(!D) return false; for(const d of D) if(d >= ini && d <= fim) return true; return false; }).length;
      return C.length ? { p: ngPct(ok, C.length), ok, n: C.length } : null;
    });
    return { s, n: C.length, cel };
  }).filter(l => l.n);
  const cor = c => c == null ? "" : `background:rgba(46,125,90,${(.08 + .82 * c.p / 100).toFixed(2)});color:${c.p >= 45 ? "#fff" : "#14503E"}`;
  const media = k => { let ok = 0, n = 0; linhas.forEach(l => { const c = l.cel[k]; if(c){ ok += c.ok; n += c.n; } }); return n ? ngPct(ok, n) : null; };
  const m1 = media(0), m4 = media(3), tot = linhas.reduce((s, l) => s + l.n, 0);
  const st = (t, v, d) => `<div class="ng-st"><span>${t}</span><b class="num">${v == null ? "—" : v + "%"}</b><small>${d}</small></div>`;
  return `<div class="card ng-card" id="ng-ret"><div class="ng-h"><div><b>🔁 Retenção por semana de entrada</b><small class="muted">De quem entrou em cada semana, quantas % voltaram na 1ª, 2ª, 3ª e 4ª semana seguinte.</small></div></div>
    ${linhas.length ? `<div class="ng-sts">${st("Voltam na 1ª semana", m1, "média das turmas")}${st("Continuam na 4ª semana", m4, m4 == null ? "ainda sem turma com 4 semanas" : "média das turmas")}<div class="ng-st"><span>Alunas analisadas</span><b class="num">${int(tot)}</b><small>últimas 8 semanas</small></div></div>
    <div class="tbl"><table class="ng-ret"><thead><tr><th>Entrada</th><th>Alunas</th><th>Sem 1</th><th>Sem 2</th><th>Sem 3</th><th>Sem 4</th></tr></thead><tbody>
      ${linhas.slice().reverse().map(l => `<tr><td>${ngBr(l.s)}</td><td class="num">${int(l.n)}</td>${l.cel.map(c => `<td class="num ng-c" style="${cor(c)}">${c == null ? "·" : `${c.p}%<small>${c.ok} de ${c.n}</small>`}</td>`).join("")}</tr>`).join("")}
    </tbody></table></div><p class="hint" style="margin:8px 0 0">"Entrada" = semana em que entraram. "·" = semana que ainda não chegou. Conta como volta qualquer acesso ou treino naquela semana.</p>` : `<p class="muted" style="margin:0">Ainda não há alunas suficientes para mostrar.</p>`}</div>`;
}
function ngPinta(){
  const main = $("adm-main"); if(!main || SEC !== "resumo") return;
  ["ng-neg", "ng-ret"].forEach(id => { const e = $(id); if(e) e.remove(); });
  const alvo = $("tar-box") || main.querySelector(".head"); if(!alvo) return;
  alvo.insertAdjacentHTML("afterend", ngNegocio() + ngRetencao());
  main.querySelectorAll("[data-ngp]").forEach(b => b.onclick = () => { NG_P = +b.dataset.ngp; ngPinta(); });
}
{ const v0 = VIEWS.resumo; if(v0) VIEWS.resumo = function(){ const r = v0.apply(this, arguments); setTimeout(ngPinta, 120); return r; }; }

/* ---------- Lista de alunas no celular: as 4 listas (cidade, idade, gênero, estado) viram um cartão com abas ---------- */
function abCelular(){
  const main = $("adm-main"); if(!main || SEC !== "alunos" || $("ab-card")) return;
  const NOMES = ["Por cidade", "Por faixa de idade", "Por gênero", "Por estado"], CURTO = ["Cidade", "Idade", "Gênero", "Estado"];
  const cards = NOMES.map(n => [...main.querySelectorAll(".card")].find(c => { const h = c.querySelector(":scope > h3"); return h && h.textContent.trim() === n; }));
  if(cards.some(c => !c)) return;
  const conteudo = cards.map(c => [...c.querySelectorAll(".hbar, .empty")].map(e => e.outerHTML));
  const topo = cards.map(c => { const H = [...c.querySelectorAll(".hbar")].map(h => { const sp = h.querySelectorAll("span"); return [sp[0] ? sp[0].textContent.trim() : "", parseInt(String(sp[1] ? sp[1].textContent : "0").replace(/\D/g, "") || "0", 10), sp[1] ? sp[1].textContent.trim().split(" ")[0] : ""]; }).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]); return H.length ? `Mais: ${H[0][0]} · ${H[0][2]}` : "Sem dados"; });
  const ICO = ["📍", "🎂", "👤", "🗺️"];
  const grade = cards[0].closest(".grid");
  const html = `<div class="card" id="ab-card"><h3>Quem são as alunas</h3><div class="ab-blocos">${CURTO.map((t, i) => `<button class="ab-b" data-ab="${i}"><span class="ab-i">${ICO[i]}</span><b>Por ${t.toLowerCase()}</b><small>${esc(topo[i])}</small><span class="ab-v">Ver lista ›</span></button>`).join("")}</div></div>`;
  (grade || cards[0]).insertAdjacentHTML("beforebegin", html);
  if(grade) grade.style.display = "none"; cards.forEach(c => { c.style.display = "none"; });
  main.querySelectorAll("[data-ab]").forEach(b => b.onclick = () => { const k = +b.dataset.ab; modal("Alunas por " + CURTO[k].toLowerCase(), `<div class="ab-lista">${(conteudo[k] || []).join("") || `<div class="empty">Sem dados</div>`}</div><button class="btn btn-line btn-block" data-close style="margin-top:14px">Voltar</button>`); });
}
{ const v0 = VIEWS.alunos; if(v0) VIEWS.alunos = function(){ const r = v0.apply(this, arguments); setTimeout(abCelular, 30); return r; }; }

/* garante as partes novas sempre que a tela é desenhada (inclusive a primeira, que acontece antes destes arquivos carregarem) */
{ let gT = null; const garante = () => { try{
    if(SEC === "alunos" && !$("ab-card")) abCelular();
    if(SEC === "resumo"){ if(!$("tar-box")) tarPinta(); if(!$("ng-neg")) ngPinta(); if(!erMostra.feito){ erMostra.feito = 1; erMostra(); } }
  }catch(e){ console.warn(e); } };
  const alvo = $("adm-main"); if(alvo) new MutationObserver(() => { clearTimeout(gT); gT = setTimeout(garante, 40); }).observe(alvo, { childList: true });
  setTimeout(garante, 0); setTimeout(garante, 600); }
