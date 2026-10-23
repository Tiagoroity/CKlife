/* ===================== Painel · Expansão: Explorar, agenda, loja, banners, avaliações, métricas, Meu Ciclo =====================
   Fica dentro do admin.js (mesma IIFE). Cadastros de catálogo ficam nas coleções (empresas, servicos, produtos, banners, categorias);
   agendamentos e avaliações ficam em tabelas próprias; o ciclo só aparece em números gerais. */
if(F.xpGarante) F.xpGarante();
Object.assign(AIC, {
  empresas:'<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/>',
  servicos:'<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="16" r="3"/>',
  agendamentos:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M8 15l2 2 4-4"/>',
  produtos:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  banners:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 21h10M3 13l5-4 4 3 3-2 6 4"/>',
  cupons:'<path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  categorias:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  avaliacoes:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  destaques:'<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/>',
  explorarm:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  ciclo:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5s3 3.4 3 5.5a3 3 0 0 1-6 0c0-2.1 3-5.5 3-5.5z"/>'
});
SECOES.push(["empresas","Empresas e academias"],["servicos","Serviços"],["agendamentos","Agendamentos"],["avaliacoes","Avaliações"],["destaques","Destaques"],["produtos","Loja e produtos"],["cupons","Cupons"],["banners","Banners"],["categorias","Categorias"],["explorarm","Métricas do Explorar"],["ciclo","Módulo Ciclo"]);
SECOES.find(s => s[0] === "parceiros")[1] = "Clube CK";
GRUPOS.length = 0;
GRUPOS.push(["Visão geral", ["resumo","metricas","explorarm"]], ["Explorar", ["empresas","profissionais","servicos","agendamentos","avaliacoes","destaques"]], ["Clube e loja", ["parceiros","cupons","produtos","banners"]],
  ["Anúncios", ["anunciantes","campanhas","financeiro"]], ["Conteúdo do app", ["alunos","comunidade","receitas","exercicios","avisos","ciclo"]], ["Ajustes", ["cidades","segmentos","categorias","admins","config"]]);

/* ---------- utilidades ---------- */
const XERRA = e => F.XERR ? F.XERR(e) : false;
const AVISO_BANCO = `<div class="card"><b>Esta área precisa ser ativada no banco.</b><p class="muted" style="margin:6px 0 0">Rode o arquivo <b>expansao.sql</b> no Supabase (SQL Editor) uma vez. Depois atualize esta página.</p></div>`;
const PROIBIDO = /(garant\p{L}*\s+(de\s+)?(emagre|resultado|perd|cura|sa[uú]de)|resultados?\s+garantid|(emagre\p{L}*|perca|perder|perde|elimine|eliminar|secar?)\s+(at[eé]\s+)?\d+\s*(kg|quilos)|\d+\s*(kg|quilos)\s+em\s+\d+\s*(dias?|semanas?)|\bcura\b|\bcurar\b|\bcura-se|100\s*%\s*(eficaz|garantid)|sem\s+efeitos?\s+colaterais|milagr|diagn[oó]stico\s+(autom|garantid))/iu;
const alerta = txt => `<div class="msg msg-bad">${txt}</div>`;
function contaX(dias){
  const lim = addD(today(), -(dias || 120)), m = {};
  DB().eventos.forEach(e => { if(!String(e.c).startsWith("x:") || e.d < lim) return; const [, t, id, ac] = String(e.c).split(":"), k = t + ":" + id; m[k] = m[k] || { ver: 0, clk: 0 }; if(ac === "ver") m[k].ver++; else { m[k].clk++; m[k][ac] = (m[k][ac] || 0) + 1; } });
  return m;
}
function fotoArquivo(file, max){ return new Promise((ok, no) => { const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); const data = c.toDataURL("image/jpeg", .85); c.toBlob(b => ok({ blob: b, data }), "image/jpeg", .85); }; im.onerror = no; im.src = rd.result; }; rd.onerror = no; rd.readAsDataURL(file); }); }
async function subirFoto(file, pasta, max){
  const r = await fotoArquivo(file, max), N = F.nuvem;
  if(N && N.ativo && N.subirImg && r.blob){ try{ return await N.subirImg(r.blob, pasta); }catch(e){ console.warn(e); toast("A pasta de imagens ainda não foi ativada no banco. A foto ficou salva junto do cadastro."); } }
  return r.data;
}
const DSEMA = [["MO","Seg"],["TU","Ter"],["WE","Qua"],["TH","Qui"],["FR","Sex"],["SA","Sáb"],["SU","Dom"]];
const MODOS = [["presencial","Presencial"],["online","Online"],["ambos","Presencial e online"]];
const optsDe = (L, sel) => L.map(o => { const [v, n] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(sel ?? "") ? "selected" : ""}>${esc(n)}</option>`; }).join("");
function testaLink(kind, v){
  const u = kind === "whats" ? F.lkWhats(v) : kind === "insta" ? F.lkInsta(v) : kind === "mapa" ? F.lkMapa(v) : F.lkSite(v);
  if(!u) return toast("Preencha o campo para testar"); window.open(u, "_blank", "noopener");
}

/* ---------- Construtor de cadastros ---------- */
function campoHtml(c, x, IM){
  const id = "xf-" + c.k, v = x[c.k] ?? c.pad ?? "", full = c.full ? " full" : "";
  const lab = `<label for="${id}">${esc(c.l)}</label>`, dica = c.dica ? `<small class="hint">${esc(c.dica)}</small>` : "";
  const teste = c.testa ? `<button type="button" class="btn btn-line btn-sm xf-test" data-testa="${c.testa}" data-alvo="${id}">Testar link</button>` : "";
  switch(c.t){
    case "area": return `<div class="field${full}">${lab}<textarea class="input" id="${id}" maxlength="${c.max || 1500}">${esc(v)}</textarea>${dica}</div>`;
    case "num": case "money": return `<div class="field${full}">${lab}<input class="input num" id="${id}" value="${esc(v)}" inputmode="decimal">${dica}</div>`;
    case "sel": { const L = typeof c.op === "function" ? c.op(x) : c.op; return `<div class="field${full}">${lab}<select class="input" id="${id}">${optsDe(L, v)}</select>${dica}</div>`; }
    case "cid": return `<div class="field${full}">${lab}<select class="input" id="${id}">${c.vazio ? `<option value="">${esc(c.vazio)}</option>` : ""}${DB().cidades.map(ci => `<option value="${ci.id}" ${+v === +ci.id ? "selected" : ""}>${esc(ci.nome)}${ci.ativa ? "" : " (inativa)"}</option>`).join("")}</select>${dica}</div>`;
    case "chk": return `<label class="field xf-chk${full}"><input type="checkbox" id="${id}" ${v ? "checked" : ""}> ${esc(c.l)}</label>`;
    case "date": return `<div class="field${full}">${lab}<input class="input" type="date" id="${id}" value="${esc(v)}">${dica}</div>`;
    case "img": IM[c.k] = x[c.k] || ""; return `<div class="field${full}">${lab}<div class="xf-img" id="${id}-p">${IM[c.k] ? `<img src="${esc(IM[c.k])}" alt="">` : ""}</div><div class="toolbar"><input class="input" type="file" accept="image/*" id="${id}"><button type="button" class="btn btn-line btn-sm" data-imgx="${c.k}">Tirar</button></div>${dica}</div>`;
    case "imgs": IM[c.k] = (x[c.k] || []).slice(); return `<div class="field full">${lab}<div class="xf-gal" id="${id}-p"></div><input class="input" type="file" accept="image/*" multiple id="${id}">${dica}</div>`;
    case "agenda": { const a = x.agenda || { dias: ["MO","TU","WE","TH","FR"], ini: "08:00", fim: "18:00", passo: 60 };
      return `<div class="field full"><label>Agenda para agendamentos (dias e horários)</label><div class="chips" id="xf-ag-d">${DSEMA.map(([k, n]) => `<button type="button" class="chip" data-d="${k}" aria-pressed="${(a.dias || []).includes(k)}">${n}</button>`).join("")}</div>
        <div class="row4" style="margin-top:8px"><div class="field"><label for="xf-ag-i">Início</label><input class="input" type="time" id="xf-ag-i" value="${esc(a.ini)}"></div><div class="field"><label for="xf-ag-f">Fim</label><input class="input" type="time" id="xf-ag-f" value="${esc(a.fim)}"></div><div class="field"><label for="xf-ag-p">Intervalo (min)</label><input class="input num" id="xf-ag-p" value="${esc(a.passo || 60)}" inputmode="numeric"></div></div></div>`; }
    default: return `<div class="field${full}">${lab}${teste ? `<div class="xf-linha"><input class="input" id="${id}" value="${esc(v)}" ${c.t === "tel" ? `inputmode="tel"` : ""} placeholder="${esc(c.ph || "")}">${teste}</div>` : `<input class="input" id="${id}" value="${esc(v)}" placeholder="${esc(c.ph || "")}" ${c.t === "tel" ? `inputmode="tel"` : ""}>`}${dica}</div>`;
  }
}
function lerCampo(c, IM){
  const id = "xf-" + c.k;
  if(c.t === "img" || c.t === "imgs") return IM[c.k];
  if(c.t === "chk") return $(id).checked;
  if(c.t === "num" || c.t === "money"){ const s = $(id).value.trim().replace(/\./g, c.t === "money" ? "" : ".").replace(",", "."); return s === "" ? "" : (isFinite(+s) ? +s : ""); }
  if(c.t === "cid"){ const s = $(id).value; return s === "" ? "" : +s; }
  if(c.t === "agenda") return { dias: [...$("xf-ag-d").querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.d), ini: $("xf-ag-i").value || "08:00", fim: $("xf-ag-f").value || "18:00", passo: Math.max(10, +$("xf-ag-p").value || 60) };
  return $(id).value.trim();
}
function formX(cfg, item){
  const novo = !item, x = item ? { ...item } : { ativo: true, ordem: (DB()[cfg.col] || []).length + 1, ...(cfg.pad || {}) }, IM = {};
  modal((novo ? "Novo · " : "Editar · ") + cfg.um, `<div class="formgrid">${cfg.campos.map(c => campoHtml(c, x, IM)).join("")}</div><div id="xf-aviso"></div>
    <div class="toolbar" style="justify-content:space-between">${!novo ? `<span class="acts"><button class="btn btn-bad" id="xf-del">Excluir</button><button class="btn btn-line" id="xf-dup">Duplicar</button></span>` : "<span></span>"}<button class="btn btn-accent" id="xf-ok">Salvar</button></div>`);
  const box = $("mbox");
  box.querySelectorAll("[data-testa]").forEach(b => b.onclick = () => testaLink(b.dataset.testa, $(b.dataset.alvo).value));
  const ag = $("xf-ag-d"); if(ag) ag.querySelectorAll("[data-d]").forEach(b => b.onclick = () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"));
  cfg.campos.filter(c => c.t === "img").forEach(c => { const inp = $("xf-" + c.k), prev = $("xf-" + c.k + "-p");
    inp.onchange = async () => { const f = inp.files && inp.files[0]; if(!f) return; prev.innerHTML = `<span class="muted">Enviando…</span>`; try{ IM[c.k] = await subirFoto(f, cfg.col, c.max || 900); prev.innerHTML = `<img src="${esc(IM[c.k])}" alt="">`; }catch(e){ prev.innerHTML = ""; toast("Não deu para ler essa imagem"); } };
    box.querySelector(`[data-imgx="${c.k}"]`).onclick = () => { IM[c.k] = ""; prev.innerHTML = ""; }; });
  cfg.campos.filter(c => c.t === "imgs").forEach(c => { const inp = $("xf-" + c.k), prev = $("xf-" + c.k + "-p");
    const pinta = () => { prev.innerHTML = IM[c.k].map((u, i) => `<span><img src="${esc(u)}" alt=""><button type="button" data-gx="${i}" aria-label="Tirar">×</button></span>`).join("") || `<small class="muted">Nenhuma foto ainda.</small>`; prev.querySelectorAll("[data-gx]").forEach(b => b.onclick = () => { IM[c.k].splice(+b.dataset.gx, 1); pinta(); }); };
    pinta();
    inp.onchange = async () => { const fs = [...(inp.files || [])].slice(0, 12 - IM[c.k].length); for(const f of fs){ try{ IM[c.k].push(await subirFoto(f, cfg.col, c.max || 1000)); pinta(); }catch(e){} } inp.value = ""; }; });
  if(cfg.aoAbrir) cfg.aoAbrir(x);
  $("xf-ok").onclick = () => {
    const d = {}; cfg.campos.forEach(c => d[c.k] = lerCampo(c, IM));
    const falta = cfg.campos.filter(c => c.obrig && (d[c.k] === "" || d[c.k] == null)).map(c => c.l);
    if(falta.length){ $("xf-aviso").innerHTML = alerta("Preencha: " + falta.join(", ") + "."); return; }
    if(cfg.ajusta) cfg.ajusta(d, x);
    const txt = cfg.campos.filter(c => ["text","area"].includes(c.t || "text")).map(c => d[c.k]).join(" ");
    if(PROIBIDO.test(txt)){ $("xf-aviso").innerHTML = alerta("O texto tem promessa de resultado garantido, cura ou alegação médica. Isso não é permitido no CK Life. Reescreva sem garantias."); return; }
    const erro = cfg.valida && cfg.valida(d, x); if(erro){ $("xf-aviso").innerHTML = alerta(erro); return; }
    const L = DB()[cfg.col] = DB()[cfg.col] || [];
    if(novo) L.push({ id: F.uid(), ...d }); else Object.assign(item, d);
    save(); fechar(); toast(cfg.um + " salvo"); rerender();
  };
  const del = $("xf-del"); if(del) del.onclick = () => confirmar(`Excluir ${item.nome || item.titulo || "este item"}?`, () => { DB()[cfg.col] = DB()[cfg.col].filter(y => y.id !== item.id); if(cfg.aoExcluir) cfg.aoExcluir(item); save(); toast("Excluído"); rerender(); });
  const dup = $("xf-dup"); if(dup) dup.onclick = () => { const c = JSON.parse(JSON.stringify(item)); delete c.id; delete c.exemplo; c.nome = c.nome ? c.nome + " (cópia)" : c.nome; c.titulo = c.titulo ? c.titulo + " (cópia)" : c.titulo; DB()[cfg.col].push({ ...c, id: F.uid() }); save(); fechar(); toast("Cópia criada"); rerender(); };
}
const XQ = {};
function crud(cfg){
  const db = DB(), q = XQ[cfg.col] || { q: "", f: "" };
  let L = (db[cfg.col] || []).slice().sort((a, b) => (!!b.destaque - !!a.destaque) || (+a.ordem || 0) - (+b.ordem || 0) || String(a.nome || a.titulo || "").localeCompare(String(b.nome || b.titulo || "")));
  if(q.f && cfg.filtros) L = L.filter(cfg.filtros.find(f => f[0] === q.f)[2]);
  if(q.q){ const s = q.q.toLowerCase(); L = L.filter(x => JSON.stringify([x.nome, x.titulo, x.tipo, x.cat, x.marca, x.desc]).toLowerCase().includes(s)); }
  const M = contaX(30);
  $("adm-main").innerHTML = `<div class="head"><div><h1>${esc(cfg.titulo)}</h1><p class="muted">${cfg.sub}</p></div><button class="btn btn-accent needs-edit" id="xc-new">+ ${esc(cfg.novo)}</button></div>
    ${cfg.topo ? cfg.topo() : ""}
    <div class="toolbar"><input class="input" id="xc-q" placeholder="Buscar" value="${esc(q.q)}" style="max-width:280px">${cfg.filtros ? `<div class="chips">${[["", "Todos"], ...cfg.filtros].map(f => `<button class="chip" data-xf="${f[0]}" aria-pressed="${q.f === f[0]}">${esc(f[1])}</button>`).join("")}</div>` : ""}</div>
    <div class="tbl"><table><thead><tr>${cfg.cols.map(c => `<th>${c[0]}</th>`).join("")}<th></th></tr></thead><tbody>
      ${L.map(x => `<tr>${cfg.cols.map(c => `<td${c[2] ? ` class="${c[2]}"` : ""}>${c[1](x, M)}</td>`).join("")}<td><div class="acts">${cfg.acoes ? cfg.acoes(x) : ""}<button class="btn btn-line btn-sm needs-edit" data-xtg="${x.id}">${x.ativo === false ? "Ativar" : "Desativar"}</button><button class="btn btn-line btn-sm needs-edit" data-xed="${x.id}">Editar</button></div></td></tr>`).join("") || `<tr><td colspan="${cfg.cols.length + 1}" class="empty">${esc(cfg.vazio || "Nada cadastrado ainda.")}</td></tr>`}
    </tbody></table></div>`;
  const n = $("xc-new"); if(n) n.onclick = () => formX(cfg);
  let tq; $("xc-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { XQ[cfg.col] = { ...q, q: e.target.value.trim().toLowerCase() }; rerender(); const i = $("xc-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
  $("adm-main").querySelectorAll("[data-xf]").forEach(b => b.onclick = () => { XQ[cfg.col] = { ...q, f: b.dataset.xf }; rerender(); });
  const acha = id => db[cfg.col].find(x => x.id === id);
  $("adm-main").querySelectorAll("[data-xed]").forEach(b => b.onclick = () => formX(cfg, acha(b.dataset.xed)));
  $("adm-main").querySelectorAll("[data-xtg]").forEach(b => b.onclick = () => { const x = acha(b.dataset.xtg); x.ativo = x.ativo === false; save(); toast(x.ativo ? "Ativado" : "Desativado"); rerender(); });
  if(cfg.liga) cfg.liga(acha);
}
const stAt = x => `<span class="st ${x.ativo === false ? "off" : "ok"}">${x.ativo === false ? "Inativo" : "Ativo"}</span>`;
const selos = x => [x.parceira ? `<span class="st ok">Parceira</span>` : "", x.destaque ? `<span class="st warn">Destaque</span>` : "", x.verificado ? `<span class="st ok">Verificado</span>` : ""].join(" ");
const vc = (M, k) => { const m = M[k] || { ver: 0, clk: 0 }; return `${int(m.ver)} / ${int(m.clk)}`; };
const fotoMini = u => u ? `<img class="xf-mini" src="${esc(u)}" alt="">` : "";

/* ---------- Empresas e academias ---------- */
const CFG_EMP = { col: "empresas", um: "Empresa", titulo: "Empresas e academias", novo: "Nova empresa", sub: "Academias, estúdios, clínicas e lojas que aparecem no Explorar, filtrados pela cidade da aluna.",
  filtros: [["acad", "Academias", x => /academ/i.test(x.tipo || "")], ["parc", "Parceiras", x => x.parceira], ["dest", "Destaques", x => x.destaque], ["off", "Inativas", x => x.ativo === false]],
  campos: [
    { k: "logo", l: "Logo", t: "img", max: 400 }, { k: "capa", l: "Foto de capa", t: "img", max: 1200 },
    { k: "nome", l: "Nome", obrig: true }, { k: "tipo", l: "Categoria", t: "sel", op: () => F.xcats("empresa") },
    { k: "cidade", l: "Cidade", t: "cid", obrig: true }, { k: "bairro", l: "Bairro" },
    { k: "end", l: "Endereço completo", full: true, testa: "mapa", dica: "Usado no botão Como chegar (abre o mapa)." },
    { k: "horario", l: "Horário de funcionamento", full: true, ph: "Seg a sex 6h às 22h · Sáb 8h às 12h" },
    { k: "modalidades", l: "Modalidades", full: true, ph: "Musculação, funcional, pilates" }, { k: "planos", l: "Planos e preços", t: "area", full: true },
    { k: "whats", l: "WhatsApp com DDD", t: "tel", testa: "whats" }, { k: "msg", l: "Primeira mensagem do WhatsApp", ph: "Olá! Encontrei vocês pelo CK Life e gostaria de saber mais." },
    { k: "insta", l: "Instagram", testa: "insta", ph: "@perfil" }, { k: "site", l: "Site", testa: "site" },
    { k: "beneficio", l: "Benefício CK Life (opcional)", full: true, ph: "Ex.: matrícula grátis para alunas CK Life" },
    { k: "desc", l: "Descrição", t: "area", full: true }, { k: "galeria", l: "Galeria de fotos (até 12)", t: "imgs" }, { k: "agenda", t: "agenda" },
    { k: "parceira", l: "Parceira CK", t: "chk" }, { k: "destaque", l: "Destaque", t: "chk" }, { k: "ativo", l: "Aparece no app", t: "chk" }, { k: "ordem", l: "Ordem", t: "num" }],
  cols: [["Empresa", x => `<div class="xf-nome">${fotoMini(x.logo || x.capa)}<span><b>${esc(x.nome)}</b>${ex(x)}<br><small class="muted">${esc(x.tipo || "")}</small></span></div>`], ["Cidade", x => esc(cidNome(x.cidade))], ["Selos", selos],
    ["Serviços", x => int(DB().servicos.filter(s => s.dono_tipo === "empresa" && s.dono === x.id).length), "num"], ["Vistas / cliques (30d)", (x, M) => vc(M, "emp:" + x.id), "num"], ["Status", stAt]],
  aoExcluir: x => { DB().servicos = DB().servicos.filter(s => !(s.dono_tipo === "empresa" && s.dono === x.id)); }
};
/* ---------- Profissionais (amplia o cadastro que já existia, mesma lista) ---------- */
const STP = { ativo: ["Ativo", "ok"], pendente: ["Pendente", "warn"], suspenso: ["Suspenso", "bad"] };
const CFG_PROF = { col: "profissionais", um: "Profissional", titulo: "Profissionais", novo: "Novo profissional", sub: "Personal, nutricionista, fisioterapeuta, estética e outros. Aprovação, verificação, presencial ou online e agenda.",
  pad: { status: "ativo", modo: "presencial" },
  filtros: [["pend", "Pendentes", x => x.status === "pendente"], ["susp", "Suspensos", x => x.status === "suspenso"], ["onl", "Online", x => ["online","ambos"].includes(x.modo)], ["ver", "Verificados", x => x.verificado]],
  campos: [
    { k: "foto", l: "Foto de perfil", t: "img", max: 500 }, { k: "nome", l: "Nome", obrig: true },
    { k: "tipo", l: "Categoria", t: "sel", op: x => { const L = F.xcats("prof"); return x.tipo && !L.some(c => c.toLowerCase() === String(x.tipo).toLowerCase()) ? [x.tipo, ...L] : L; } },
    { k: "modo", l: "Atendimento", t: "sel", op: MODOS }, { k: "cidade", l: "Cidade", t: "cid", vazio: "Só online (todo o Brasil)" },
    { k: "end", l: "Endereço de atendimento", full: true, testa: "mapa" }, { k: "registro", l: "Registro profissional", ph: "CREF, CRN, CREFITO, CRP..." },
    { k: "valor", l: "Valor base (R$, opcional)", t: "money" },
    { k: "whats", l: "WhatsApp com DDD", t: "tel", testa: "whats" }, { k: "msg", l: "Primeira mensagem do WhatsApp", ph: "Olá! Encontrei você pelo CK Life e gostaria de saber mais." },
    { k: "insta", l: "Instagram", testa: "insta" }, { k: "site", l: "Site", testa: "site" },
    { k: "desc", l: "Descrição", t: "area", full: true }, { k: "agenda", t: "agenda" },
    { k: "status", l: "Situação", t: "sel", op: [["ativo","Ativo"],["pendente","Pendente (aguardando aprovação)"],["suspenso","Suspenso"]] },
    { k: "verificado", l: "Registro verificado (selo)", t: "chk" }, { k: "destaque", l: "Destaque", t: "chk" }, { k: "ativo", l: "Aparece no app", t: "chk" }, { k: "ordem", l: "Ordem", t: "num" }],
  valida: d => soDig(d.whats).length < 10 && !d.site ? "Informe um WhatsApp com DDD ou um site para contato." : "",
  cols: [["Profissional", x => `<div class="xf-nome">${fotoMini(x.foto)}<span><b>${esc(x.nome)}</b>${ex(x)}<br><small class="muted">${esc(x.tipo || "")}${x.registro ? " · " + esc(x.registro) : ""}</small></span></div>`], ["Atendimento", x => esc((MODOS.find(m => m[0] === (x.modo || "presencial")) || [])[1] || "")], ["Cidade", x => esc(cidNome(x.cidade) || "Online")],
    ["Selos", selos], ["Situação", x => { const s = STP[x.status || "ativo"]; return `<span class="st ${s[1]}">${s[0]}</span>`; }], ["Vistas / cliques (30d)", (x, M) => vc(M, "prof:" + x.id), "num"], ["App", stAt]],
  acoes: x => `${(x.status || "ativo") !== "ativo" ? `<button class="btn btn-accent btn-sm needs-edit" data-pst="${x.id}|ativo">Aprovar</button>` : `<button class="btn btn-line btn-sm needs-edit" data-pst="${x.id}|suspenso">Suspender</button>`}${x.status === "pendente" ? `<button class="btn btn-bad btn-sm needs-edit" data-pst="${x.id}|rejeitar">Rejeitar</button>` : ""}<button class="btn btn-line btn-sm needs-edit" data-pver="${x.id}">${x.verificado ? "Tirar selo" : "Verificar"}</button>`,
  liga: acha => {
    $("adm-main").querySelectorAll("[data-pst]").forEach(b => b.onclick = () => { const [id, st] = b.dataset.pst.split("|"), x = acha(id);
      if(st === "rejeitar") return confirmar(`Rejeitar e excluir o cadastro de ${x.nome}?`, () => { DB().profissionais = DB().profissionais.filter(y => y.id !== id); save(); toast("Cadastro rejeitado"); rerender(); });
      x.status = st; save(); toast(st === "ativo" ? "Profissional aprovado" : "Profissional suspenso"); rerender(); });
    $("adm-main").querySelectorAll("[data-pver]").forEach(b => b.onclick = () => { const x = acha(b.dataset.pver); x.verificado = !x.verificado; save(); toast(x.verificado ? "Selo de verificado aplicado" : "Selo retirado"); rerender(); });
  },
  aoExcluir: x => { DB().servicos = DB().servicos.filter(s => !(s.dono_tipo === "profissional" && s.dono === x.id)); }
};
const soDig = s => String(s || "").replace(/\D/g, "");
/* ---------- Serviços ---------- */
const donoOpts = () => [["", "Escolha"], ...DB().profissionais.map(p => ["profissional:" + p.id, "Profissional · " + p.nome]), ...DB().empresas.map(e => ["empresa:" + e.id, "Empresa · " + e.nome])];
const donoNome = s => { const d = s.dono_tipo === "empresa" ? DB().empresas.find(e => e.id === s.dono) : DB().profissionais.find(p => p.id === s.dono); return d ? d.nome : "(removido)"; };
const CFG_SERV = { col: "servicos", um: "Serviço", titulo: "Serviços", novo: "Novo serviço", sub: "O que a aluna pode agendar: sempre ligado a um profissional ou empresa, com preço, promoção, duração e modalidade.",
  pad: { modo: "presencial", dur: 60 },
  filtros: [["onl", "Online", x => ["online","ambos"].includes(x.modo)], ["promo", "Em promoção", x => +x.promo && +x.promo < +x.preco]],
  campos: [{ k: "donoK", l: "De quem é o serviço", t: "sel", op: donoOpts, full: true, obrig: true }, { k: "nome", l: "Nome do serviço", obrig: true }, { k: "modo", l: "Modalidade", t: "sel", op: MODOS },
    { k: "preco", l: "Preço (R$)", t: "money", dica: "0 = grátis" }, { k: "promo", l: "Preço promocional (R$, opcional)", t: "money" }, { k: "dur", l: "Duração (min)", t: "num" },
    { k: "desc", l: "Descrição", t: "area", full: true }, { k: "ativo", l: "Aparece no app", t: "chk" }, { k: "ordem", l: "Ordem", t: "num" }],
  aoAbrir: x => { const s = $("xf-donoK"); if(s && x.dono) s.value = x.dono_tipo + ":" + x.dono; },
  ajusta: d => { const [t, id] = String(d.donoK || "").split(":"); d.dono_tipo = t || ""; d.dono = id || ""; if(!t) d.donoK = ""; else delete d.donoK; },
  valida: d => d.promo !== "" && d.preco !== "" && +d.promo >= +d.preco ? "O preço promocional precisa ser menor que o preço normal." : "",
  cols: [["Serviço", x => `<b>${esc(x.nome)}</b>${ex(x)}`], ["De", x => esc(donoNome(x))], ["Modalidade", x => esc((MODOS.find(m => m[0] === x.modo) || [, "Presencial"])[1])], ["Preço", x => +x.promo && +x.promo < +x.preco ? `<s class="muted">${money(x.preco)}</s> <b>${money(x.promo)}</b>` : x.preco === 0 ? "Grátis" : money(x.preco), "num"], ["Duração", x => x.dur ? x.dur + " min" : "-", "num"], ["Status", stAt]]
};
/* ---------- Loja e produtos ---------- */
const TIPOP = [["proprio","Produto próprio (CK Life)"],["parceiro","Loja parceira"],["afiliado","Link de afiliado"]];
const CFG_PROD = { col: "produtos", um: "Produto", titulo: "Loja e produtos", novo: "Novo produto", sub: "Loja nacional (não depende da cidade). A compra acontece no site da loja: o app abre o link exatamente como foi colado, mantendo os parâmetros de rastreio.",
  pad: { tipo: "parceiro", botao: "COMPRAR" },
  filtros: [["proprio", "Próprios", x => x.tipo === "proprio"], ["afiliado", "Afiliados", x => x.tipo === "afiliado"], ["dest", "Destaques", x => x.destaque]],
  campos: [{ k: "foto", l: "Foto do produto", t: "img", max: 900 }, { k: "nome", l: "Nome", obrig: true }, { k: "marca", l: "Marca ou loja" }, { k: "cat", l: "Categoria", t: "sel", op: () => F.xcats("produto") }, { k: "tipo", l: "Tipo", t: "sel", op: TIPOP },
    { k: "preco", l: "Preço (R$)", t: "money" }, { k: "promo", l: "Preço promocional (R$)", t: "money" },
    { k: "url", l: "Link de compra ou de afiliado", full: true, obrig: true, testa: "site", dica: "Cole o link completo (com ?ref=, utm_ etc.). Ele é aberto sem alterações." }, { k: "botao", l: "Texto do botão", t: "sel", op: ["COMPRAR", "VER PRODUTO"] },
    { k: "desc", l: "Descrição", t: "area", full: true }, { k: "destaque", l: "Destaque", t: "chk" }, { k: "ativo", l: "Aparece no app", t: "chk" }, { k: "ordem", l: "Ordem", t: "num" }],
  valida: d => !/^https?:\/\/\S+\.\S+/i.test(F.lkSite(d.url)) ? "O link precisa ser um endereço de site válido." : "",
  cols: [["Produto", x => `<div class="xf-nome">${fotoMini(x.foto)}<span><b>${esc(x.nome)}</b>${ex(x)}<br><small class="muted">${esc(x.marca || "")}</small></span></div>`], ["Categoria", x => esc(x.cat || "")], ["Tipo", x => esc((TIPOP.find(t => t[0] === x.tipo) || [, ""])[1])], ["Preço", x => +x.promo && +x.promo < +x.preco ? `<s class="muted">${money(x.preco)}</s> <b>${money(x.promo)}</b>` : money(x.preco), "num"],
    ["Vistas (30d)", (x, M) => int((M["prod:" + x.id] || {}).ver || 0), "num"], ["Cliques em comprar", (x, M) => int((M["prod:" + x.id] || {}).comprar || 0), "num"], ["Status", stAt]],
  acoes: x => `<button class="btn btn-line btn-sm" data-tl="${esc(x.url || "")}">Testar link</button>`,
  liga: () => $("adm-main").querySelectorAll("[data-tl]").forEach(b => b.onclick = () => testaLink("site", b.dataset.tl))
};
/* ---------- Banners ---------- */
const LOCAIS = [["explorar","Explorar (topo)"],["inicio","Início"],["loja","Loja"],["clube","Clube CK"]];
const destinoOpts = () => [["url","Site (link)"],["whatsapp","WhatsApp (número no campo Link)"],["clube:","Clube CK (lista)"], ...DB().empresas.map(e => ["empresa:" + e.id, "Empresa · " + e.nome]), ...DB().profissionais.map(p => ["profissional:" + p.id, "Profissional · " + p.nome]), ...DB().produtos.map(p => ["produto:" + p.id, "Produto · " + p.nome]), ...DB().parceiros.map(p => ["clube:" + p.id, "Clube · " + p.nome])];
const CFG_BAN = { col: "banners", um: "Banner", titulo: "Banners", novo: "Novo banner", sub: "Faixas com foto no Explorar, na Início, na Loja e no Clube CK. Nunca aparecem na Comunidade. Medem vistas e cliques.",
  pad: { local: "explorar", destK: "url" },
  filtros: LOCAIS.map(([k, n]) => [k, n.split(" ")[0], x => x.local === k]),
  campos: [{ k: "img", l: "Imagem (horizontal)", t: "img", max: 1400 }, { k: "titulo", l: "Título", obrig: true }, { k: "texto", l: "Texto curto", full: true }, { k: "local", l: "Onde aparece", t: "sel", op: LOCAIS },
    { k: "destK", l: "Ao tocar, abre", t: "sel", op: destinoOpts, full: true }, { k: "url", l: "Link ou WhatsApp (quando o destino for site/WhatsApp)", full: true, testa: "site" },
    { k: "cidade", l: "Cidade", t: "cid", vazio: "Todas as cidades" }, { k: "inicio", l: "Começa em", t: "date" }, { k: "fim", l: "Termina em", t: "date" }, { k: "ativo", l: "Ativo", t: "chk" }, { k: "ordem", l: "Ordem", t: "num" }],
  aoAbrir: x => { const s = $("xf-destK"); if(s) s.value = x.destino && !["url","whatsapp"].includes(x.destino) ? x.destino + ":" + (x.alvo || "") : (x.destino || "url"); },
  ajusta: d => { const [t, id] = String(d.destK || "url").split(":"); d.destino = t; d.alvo = id || ""; delete d.destK; },
  valida: d => (d.destino === "url" && !d.url) ? "Informe o link do site." : (d.destino === "whatsapp" && soDig(d.url).length < 10) ? "Informe o WhatsApp com DDD no campo Link." : (d.inicio && d.fim && d.fim < d.inicio) ? "A data final é antes da inicial." : "",
  cols: [["Banner", x => `<div class="xf-nome">${fotoMini(x.img)}<span><b>${esc(x.titulo)}</b>${ex(x)}<br><small class="muted">${esc(x.texto || "")}</small></span></div>`], ["Local", x => esc((LOCAIS.find(l => l[0] === x.local) || [, ""])[1])], ["Cidade", x => esc(cidNome(x.cidade) || "Todas")], ["Período", x => `${x.inicio ? brD(x.inicio) : "sempre"}${x.fim ? " a " + brD(x.fim) : ""}`],
    ["Vistas / cliques (30d)", (x, M) => vc(M, "ban:" + x.id), "num"], ["Status", x => x.fim && x.fim < today() ? `<span class="st warn">Encerrado</span>` : stAt(x)]]
};
/* ---------- Categorias ---------- */
const GRUPOSC = [["prof","Profissionais"],["empresa","Empresas"],["produto","Produtos"]];
const CFG_CAT = { col: "categorias", um: "Categoria", titulo: "Categorias", novo: "Nova categoria", sub: "Categorias de profissionais, empresas e produtos. Enquanto um grupo estiver vazio, o app usa as categorias padrão.",
  pad: { grupo: "prof" }, filtros: GRUPOSC.map(([k, n]) => [k, n, x => x.grupo === k]),
  campos: [{ k: "grupo", l: "Grupo", t: "sel", op: GRUPOSC }, { k: "nome", l: "Nome", obrig: true }, { k: "ordem", l: "Ordem", t: "num" }, { k: "ativo", l: "Ativa", t: "chk" }],
  valida: (d, x) => DB().categorias.some(c => c.id !== x.id && c.grupo === d.grupo && c.nome.toLowerCase() === d.nome.toLowerCase()) ? "Já existe uma categoria com esse nome neste grupo." : "",
  topo: () => `<div class="card"><b>Categorias padrão</b><p class="muted" style="margin:6px 0 10px">Copie as categorias padrão para poder editar, renomear ou desativar.</p><div class="acts needs-edit">${GRUPOSC.map(([k, n]) => DB().categorias.some(c => c.grupo === k) ? "" : `<button class="btn btn-line btn-sm" data-imp="${k}">Copiar padrão de ${n}</button>`).join("") || `<span class="muted">Todos os grupos já têm categorias próprias.</span>`}</div></div>`,
  cols: [["Categoria", x => `<b>${esc(x.nome)}</b>`], ["Grupo", x => esc((GRUPOSC.find(g => g[0] === x.grupo) || [, ""])[1])], ["Em uso", x => { const db = DB(), n = x.grupo === "prof" ? db.profissionais.filter(p => (p.tipo || "").toLowerCase() === x.nome.toLowerCase()).length : x.grupo === "empresa" ? db.empresas.filter(e => (e.tipo || "").toLowerCase() === x.nome.toLowerCase()).length : db.produtos.filter(p => (p.cat || "").toLowerCase() === x.nome.toLowerCase()).length; return int(n); }, "num"], ["Ordem", x => int(x.ordem || 0), "num"], ["Status", stAt]],
  liga: () => $("adm-main").querySelectorAll("[data-imp]").forEach(b => b.onclick = () => { const g = b.dataset.imp; F.XCAT[g].forEach((n, i) => DB().categorias.push({ id: F.uid(), grupo: g, nome: n, ordem: i + 1, ativo: true })); save(); toast("Categorias copiadas"); rerender(); })
};
function vEmpresas(){ crud(CFG_EMP); }
function vProfX(){ crud(CFG_PROF); }
function vServicos(){ crud(CFG_SERV); }
function vProdutos(){ crud(CFG_PROD); }
function vBanners(){ crud(CFG_BAN); }
function vCategorias(){ crud(CFG_CAT); }

/* ---------- Clube CK: o cadastro de parceiros ganha benefício, categoria, contatos e "cupom livre" ---------- */
const formParc0 = formParc;
formParc = function(p){
  formParc0(p);
  const alvo = p || null, grid = $("mbox").querySelector(".formgrid"); if(!grid) return;
  const x = alvo || {};
  grid.insertAdjacentHTML("beforeend", `
    <div class="field full"><label for="pa-b">Benefício (o que aparece no Clube CK)</label><input class="input" id="pa-b" value="${esc(x.beneficio || "")}" placeholder="Ex.: 10% em toda a loja"></div>
    <div class="field"><label for="pa-cat">Categoria</label><select class="input" id="pa-cat">${optsDe(["", ...F.xcats("empresa")], x.cat || "")}</select></div>
    <div class="field"><label for="pa-w">WhatsApp</label><div class="xf-linha"><input class="input" id="pa-w" value="${esc(x.whats || "")}" inputmode="tel"><button type="button" class="btn btn-line btn-sm" data-t2="whats">Testar</button></div></div>
    <div class="field"><label for="pa-i">Instagram</label><div class="xf-linha"><input class="input" id="pa-i" value="${esc(x.insta || "")}"><button type="button" class="btn btn-line btn-sm" data-t2="insta">Testar</button></div></div>
    <div class="field"><label for="pa-s">Site</label><div class="xf-linha"><input class="input" id="pa-s" value="${esc(x.site || "")}"><button type="button" class="btn btn-line btn-sm" data-t2="site">Testar</button></div></div>
    <div class="field full"><label for="pa-ds">Descrição</label><textarea class="input" id="pa-ds">${esc(x.desc || "")}</textarea></div>
    <label class="field xf-chk"><input type="checkbox" id="pa-lv" ${x.livre ? "checked" : ""}> Cupom livre no Clube CK (qualquer aluna pega)</label>
    <label class="field xf-chk"><input type="checkbox" id="pa-dt" ${x.destaque ? "checked" : ""}> Destaque</label>`);
  const sel = $("pa-c"); if(sel && !sel.querySelector('option[value=""]')) sel.insertAdjacentHTML("afterbegin", `<option value="" ${!x.cidade ? "selected" : ""}>Todas as cidades</option>`);
  if(sel && !x.cidade && alvo) sel.value = "";
  $("mbox").querySelectorAll("[data-t2]").forEach(b => b.onclick = () => testaLink(b.dataset.t2, $({ whats: "pa-w", insta: "pa-i", site: "pa-s" }[b.dataset.t2]).value));
  const ok = $("pa-ok"), salva0 = ok.onclick;
  ok.onclick = () => {
    const extra = { beneficio: val("pa-b"), cat: val("pa-cat"), whats: val("pa-w"), insta: val("pa-i"), site: val("pa-s"), desc: val("pa-ds"), livre: $("pa-lv").checked, destaque: $("pa-dt").checked };
    if(PROIBIDO.test(extra.beneficio + " " + extra.desc)){ $("pa-msg").innerHTML = alerta("O texto tem promessa de resultado garantido, cura ou alegação médica. Reescreva sem garantias."); return; }
    const antes = new Set(DB().parceiros.map(y => y.id));
    salva0();
    const alvoFinal = alvo || DB().parceiros.find(y => !antes.has(y.id));
    if(alvoFinal && $("modal").hidden){ Object.assign(alvoFinal, extra); if(!alvoFinal.cidade) alvoFinal.cidade = ""; save(); rerender(); }
  };
};

/* ---------- Cupons ---------- */
let XCU = { f: "", q: "" };
function vCupons(){
  const db = DB(), nome = id => (F.DB.users.find(u => u.id === id) || {}).nome || "Aluna", parc = id => (db.parceiros.find(p => p.id === id) || {}).nome || "(parceiro removido)";
  let L = db.cupons.slice().sort((a, b) => String(b.d).localeCompare(String(a.d)));
  if(XCU.f === "livre") L = L.filter(c => !c.usado); else if(XCU.f === "usado") L = L.filter(c => c.usado); else if(XCU.f === "clube") L = L.filter(c => c.clube);
  if(XCU.q){ const s = XCU.q.toLowerCase(); L = L.filter(c => (c.codigo + " " + nome(c.user) + " " + parc(c.parc)).toLowerCase().includes(s)); }
  $("adm-main").innerHTML = `<div class="head"><div><h1>Cupons</h1><p class="muted">Cupons entregues às alunas (prêmio por treinos ou pegos no Clube CK). A loja valida com o PIN.</p></div></div>
    <div class="grid g3">${kpi("Cupons entregues", int(db.cupons.length), "", "cupons", 1)}${kpi("Disponíveis", int(db.cupons.filter(c => !c.usado).length))}${kpi("Usados", int(db.cupons.filter(c => c.usado).length), pct(db.cupons.filter(c => c.usado).length, db.cupons.length) + " de uso")}</div>
    <div class="toolbar"><input class="input" id="cu-q" placeholder="Buscar código, aluna ou loja" value="${esc(XCU.q)}" style="max-width:300px"><div class="chips">${[["","Todos"],["livre","Disponíveis"],["usado","Usados"],["clube","Do Clube CK"]].map(([k, n]) => `<button class="chip" data-cf="${k}" aria-pressed="${XCU.f === k}">${n}</button>`).join("")}</div><button class="btn btn-line btn-sm" id="cu-pl">Copiar planilha</button></div>
    <div class="tbl"><table><thead><tr><th>Código</th><th>Aluna</th><th>Parceiro</th><th>Origem</th><th>Data</th><th>Status</th><th></th></tr></thead><tbody>
      ${L.slice(0, 500).map(c => `<tr><td class="num"><b>${esc(c.codigo)}</b></td><td>${esc(nome(c.user))}</td><td>${esc(parc(c.parc))}</td><td>${c.clube ? "Clube CK" : "Treinos"}</td><td class="num">${brD(c.d)}</td><td>${c.usado ? `<span class="st off">Usado ${brD(c.usadoEm)}</span>` : `<span class="st ok">Disponível</span>`}</td><td><div class="acts needs-edit">${c.usado ? `<button class="btn btn-line btn-sm" data-cre="${c.id}">Reativar</button>` : `<button class="btn btn-line btn-sm" data-cus="${c.id}">Marcar usado</button>`}<button class="btn btn-bad btn-sm" data-cdl="${c.id}">Excluir</button></div></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Nenhum cupom.</td></tr>`}
    </tbody></table></div>`;
  let tq; $("cu-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { XCU.q = e.target.value.trim(); rerender(); const i = $("cu-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
  $("adm-main").querySelectorAll("[data-cf]").forEach(b => b.onclick = () => { XCU.f = b.dataset.cf; rerender(); });
  $("cu-pl").onclick = () => planilha(["Código","Aluna","Parceiro","Origem","Data","Usado em"], L.map(c => [c.codigo, nome(c.user), parc(c.parc), c.clube ? "Clube CK" : "Treinos", c.d, c.usadoEm || ""]), "Cupons");
  const acha = id => db.cupons.find(c => c.id === id);
  $("adm-main").querySelectorAll("[data-cus]").forEach(b => b.onclick = () => { const c = acha(b.dataset.cus); c.usado = true; c.usadoEm = today(); save(); toast("Cupom marcado como usado"); rerender(); });
  $("adm-main").querySelectorAll("[data-cre]").forEach(b => b.onclick = () => { const c = acha(b.dataset.cre); c.usado = false; c.usadoEm = ""; save(); toast("Cupom disponível de novo"); rerender(); });
  $("adm-main").querySelectorAll("[data-cdl]").forEach(b => b.onclick = () => confirmar(`Excluir o cupom ${acha(b.dataset.cdl).codigo}?`, () => { db.cupons = db.cupons.filter(c => c.id !== b.dataset.cdl); F.DB.cupons = db.cupons; save(); rerender(); }));
}

/* ---------- Agendamentos (inclui acompanhamentos online) ---------- */
let XAG = { st: "", per: "prox", modo: "", q: "" }, AGL = [];
const MSG_ST = { confirmado: (a, n) => `Olá, ${n}! Seu agendamento de ${a.servico_nome || "atendimento"} com ${a.alvo_nome} em ${brD(a.data)} às ${a.hora} está CONFIRMADO. Até lá! 💚 Equipe CK Life`, cancelado: (a, n) => `Olá, ${n}. Precisamos cancelar seu agendamento de ${a.servico_nome || "atendimento"} em ${brD(a.data)} às ${a.hora}. Quer remarcar? Equipe CK Life`, concluido: (a, n) => `Olá, ${n}! Obrigada por vir. Que tal avaliar o atendimento no app CK Life? 💚` };
async function vAgendamentos(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Agendamentos</h1><p class="muted">Pedidos das alunas. Confirme, conclua ou cancele. Inclui os acompanhamentos online.</p></div><button class="btn btn-line btn-sm" id="ag-at">Atualizar</button></div><div id="ag-b"><div class="card">Carregando…</div></div>`;
  $("ag-at").onclick = rerender;
  try{ AGL = await F.XP.ag.listar(true); }catch(e){ $("ag-b").innerHTML = XERRA(e) ? AVISO_BANCO : `<div class="card">Sem conexão agora.</div>`; return; }
  desenhaAg();
}
function desenhaAg(){
  const h = today(), Fp = { prox: a => a.data >= h, hoje: a => a.data === h, pass: a => a.data < h, todos: () => true }[XAG.per];
  let L = AGL.filter(Fp).filter(a => !XAG.st || a.status === XAG.st).filter(a => !XAG.modo || (a.modo || "presencial") === XAG.modo);
  if(XAG.q){ const s = XAG.q.toLowerCase(); L = L.filter(a => [a.nome, a.alvo_nome, a.servico_nome, a.whats].join(" ").toLowerCase().includes(s)); }
  L.sort((a, b) => XAG.per === "pass" ? (b.data + b.hora).localeCompare(a.data + a.hora) : (a.data + a.hora).localeCompare(b.data + b.hora));
  const cnt = st => AGL.filter(a => a.status === st && a.data >= h).length, ST = F.STAG;
  $("ag-b").innerHTML = `<div class="grid g4">${kpi("Aguardando confirmação", int(cnt("solicitado")), "", "agendamentos", 1)}${kpi("Confirmados (próximos)", int(cnt("confirmado")))}${kpi("Hoje", int(AGL.filter(a => a.data === h && a.status !== "cancelado").length))}${kpi("Online (próximos)", int(AGL.filter(a => a.modo === "online" && a.data >= h && a.status !== "cancelado").length))}</div>
    <div class="toolbar"><input class="input" id="ag-q" placeholder="Buscar aluna, profissional ou serviço" value="${esc(XAG.q)}" style="max-width:300px">
      <select class="input" id="ag-per" style="max-width:170px">${optsDe([["prox","Próximos"],["hoje","Hoje"],["pass","Passados"],["todos","Todos"]], XAG.per)}</select>
      <select class="input" id="ag-st" style="max-width:190px">${optsDe([["","Todos os status"], ...Object.entries(ST).map(([k, v]) => [k, v[0]])], XAG.st)}</select>
      <select class="input" id="ag-md" style="max-width:220px">${optsDe([["","Presencial e online"],["presencial","Só presencial"],["online","Acompanhamentos online"]], XAG.modo)}</select>
      <button class="btn btn-line btn-sm" id="ag-pl">Copiar planilha</button></div>
    <div class="tbl"><table><thead><tr><th>Quando</th><th>Aluna</th><th>Serviço</th><th>Com</th><th>Modo</th><th>Status</th><th></th></tr></thead><tbody>
      ${L.map(a => `<tr><td class="num"><b>${brD(a.data)}</b><br>${esc(a.hora)}</td><td><b>${esc(a.nome || "")}</b><br><small class="muted">${esc(a.whats || "")}</small></td><td>${esc(a.servico_nome || "")}${a.preco ? `<br><small class="muted">${money(a.preco)}</small>` : ""}${a.obs ? `<br><small class="muted">“${esc(a.obs)}”</small>` : ""}</td><td>${esc(a.alvo_nome || "")}</td><td>${a.modo === "online" ? "Online" : "Presencial"}</td>
        <td><select class="input needs-edit" data-ags="${a.id}" style="padding:6px 8px;font-size:13px">${optsDe(Object.entries(ST).map(([k, v]) => [k, v[0]]), a.status)}</select>${a.nota_adm ? `<br><small class="muted">${esc(a.nota_adm)}</small>` : ""}</td>
        <td><div class="acts">${soDig(a.whats).length >= 10 ? `<a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="${esc(F.lkWhats(a.whats, (MSG_ST[a.status] || MSG_ST.confirmado)(a, String(a.nome || "").split(" ")[0])))}">WhatsApp</a>` : ""}<button class="btn btn-line btn-sm needs-edit" data-agn="${a.id}">Nota</button></div></td></tr>`).join("") || `<tr><td colspan="7" class="empty">Nenhum agendamento neste filtro.</td></tr>`}
    </tbody></table></div>`;
  let tq; $("ag-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { XAG.q = e.target.value.trim(); desenhaAg(); const i = $("ag-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); };
  $("ag-per").onchange = e => { XAG.per = e.target.value; desenhaAg(); }; $("ag-st").onchange = e => { XAG.st = e.target.value; desenhaAg(); }; $("ag-md").onchange = e => { XAG.modo = e.target.value; desenhaAg(); };
  $("ag-pl").onclick = () => planilha(["Data","Hora","Aluna","WhatsApp","Serviço","Com","Modo","Status","Valor"], L.map(a => [a.data, a.hora, a.nome, a.whats, a.servico_nome, a.alvo_nome, a.modo, (ST[a.status] || [a.status])[0], a.preco || ""]), "Agendamentos");
  $("adm-main").querySelectorAll("[data-ags]").forEach(s => s.onchange = async () => { const a = AGL.find(x => x.id === s.dataset.ags), v = s.value; try{ await F.XP.ag.status(a.id, v); a.status = v; toast("Status: " + ST[v][0]); desenhaAg(); }catch(e){ toast(XERRA(e) ? "Ative o banco da expansão primeiro" : "Não deu agora"); s.value = a.status; } });
  $("adm-main").querySelectorAll("[data-agn]").forEach(b => b.onclick = () => { const a = AGL.find(x => x.id === b.dataset.agn);
    modal("Nota para a aluna", `<p class="muted" style="margin:0">Aparece no app em Meus agendamentos. Ex.: “Chegar 10 min antes”, “Link da chamada será enviado no WhatsApp”.</p><textarea class="input" id="agn-t" maxlength="300">${esc(a.nota_adm || "")}</textarea><button class="btn btn-accent" id="agn-ok">Salvar</button>`);
    $("agn-ok").onclick = async () => { const t = val("agn-t"); try{ await F.XP.ag.status(a.id, a.status, t); a.nota_adm = t; fechar(); toast("Nota salva"); desenhaAg(); }catch(e){ toast("Não deu agora"); } }; });
}

/* ---------- Avaliações (moderação) ---------- */
let XAV = { f: "den" }, AVL = [];
const alvoNome = a => { const db = DB(), L = { empresa: db.empresas, profissional: db.profissionais, produto: db.produtos, clube: db.parceiros, servico: db.servicos }[a.alvo_tipo] || [], x = L.find(y => y.id === a.alvo_id); return x ? x.nome : "(removido)"; };
async function vAvaliacoes(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Avaliações</h1><p class="muted">Notas e comentários das alunas. Empresas e profissionais não editam avaliações. Aqui você oculta o que fere as regras.</p></div><button class="btn btn-line btn-sm" id="av-at">Atualizar</button></div><div id="av-b"><div class="card">Carregando…</div></div>`;
  $("av-at").onclick = rerender;
  try{ AVL = await F.XP.av.todas(true); }catch(e){ $("av-b").innerHTML = XERRA(e) ? AVISO_BANCO : `<div class="card">Sem conexão agora.</div>`; return; }
  desenhaAv();
}
function desenhaAv(){
  const L = AVL.filter({ den: a => a.denuncias > 0 && !a.oculta, oc: a => a.oculta, todas: () => true }[XAV.f]);
  const media = AVL.filter(a => !a.oculta).reduce((s, a, _, A) => s + a.nota / A.length, 0);
  $("av-b").innerHTML = `<div class="grid g3">${kpi("Avaliações", int(AVL.length), AVL.length ? "média " + media.toFixed(1).replace(".", ",") : "", "avaliacoes", 1)}${kpi("Com denúncia", int(AVL.filter(a => a.denuncias > 0 && !a.oculta).length))}${kpi("Ocultas", int(AVL.filter(a => a.oculta).length))}</div>
    <div class="chips">${[["den","Denunciadas"],["oc","Ocultas"],["todas","Todas"]].map(([k, n]) => `<button class="chip" data-avf="${k}" aria-pressed="${XAV.f === k}">${n}</button>`).join("")}</div>
    <div class="tbl"><table><thead><tr><th>Sobre</th><th>Aluna</th><th>Nota</th><th>Comentário</th><th>Data</th><th>Denúncias</th><th></th></tr></thead><tbody>
      ${L.map(a => `<tr><td><b>${esc(alvoNome(a))}</b><br><small class="muted">${esc(a.alvo_tipo)}</small></td><td>${esc(a.nome)}${a.verificada ? `<br><span class="st ok">Serviço realizado</span>` : ""}</td><td class="num">${"★".repeat(a.nota)}</td><td class="wrapcell">${esc(a.texto || "")}</td><td class="num">${brD(String(a.criado).slice(0, 10))}</td><td class="num">${int(a.denuncias || 0)}</td>
        <td><div class="acts needs-edit"><button class="btn btn-line btn-sm" data-avo="${a.id}">${a.oculta ? "Mostrar" : "Ocultar"}</button>${a.denuncias ? `<button class="btn btn-line btn-sm" data-avz="${a.id}">Manter</button>` : ""}<button class="btn btn-bad btn-sm" data-avd="${a.id}">Excluir</button></div></td></tr>`).join("") || `<tr><td colspan="7" class="empty">${XAV.f === "den" ? "Nenhuma avaliação denunciada. Tudo certo!" : "Nada por aqui."}</td></tr>`}
    </tbody></table></div>`;
  $("adm-main").querySelectorAll("[data-avf]").forEach(b => b.onclick = () => { XAV.f = b.dataset.avf; desenhaAv(); });
  const acha = id => AVL.find(a => a.id === id), faz = async (a, campos, msg) => { try{ await F.XP.av.moderar(a.id, campos); Object.assign(a, campos); toast(msg); desenhaAv(); }catch(e){ toast("Não deu agora"); } };
  $("adm-main").querySelectorAll("[data-avo]").forEach(b => b.onclick = () => { const a = acha(b.dataset.avo); faz(a, { oculta: !a.oculta }, a.oculta ? "Avaliação visível" : "Avaliação ocultada"); });
  $("adm-main").querySelectorAll("[data-avz]").forEach(b => b.onclick = () => faz(acha(b.dataset.avz), { denuncias: 0 }, "Denúncias zeradas: avaliação mantida"));
  $("adm-main").querySelectorAll("[data-avd]").forEach(b => b.onclick = () => confirmar("Excluir esta avaliação?", async () => { try{ await F.XP.av.apagar(b.dataset.avd); AVL = AVL.filter(a => a.id !== b.dataset.avd); toast("Excluída"); desenhaAv(); }catch(e){ toast("Não deu agora"); } }));
}

/* ---------- Destaques ---------- */
function vDestaques(){
  const db = DB(), G = [["empresas","Empresas e academias"],["profissionais","Profissionais"],["produtos","Produtos"],["parceiros","Clube CK"]];
  $("adm-main").innerHTML = `<div class="head"><div><h1>Destaques</h1><p class="muted">O que aparece primeiro no Explorar. Marque o destaque e ajuste a ordem (menor número aparece antes).</p></div></div>
    ${G.map(([col, n]) => `<div class="card"><h3 style="margin-bottom:8px">${n}</h3><div class="tbl"><table><thead><tr><th>Nome</th><th>Destaque</th><th>Ordem</th></tr></thead><tbody>${(db[col] || []).filter(x => x.ativo !== false).sort((a, b) => (!!b.destaque - !!a.destaque) || (+a.ordem || 0) - (+b.ordem || 0)).map(x => `<tr><td><b>${esc(x.nome)}</b></td><td><input type="checkbox" class="needs-edit" data-dk="${col}|${x.id}" ${x.destaque ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"></td><td><input class="input num needs-edit" data-do="${col}|${x.id}" value="${esc(x.ordem || 0)}" style="max-width:90px;padding:6px 10px"></td></tr>`).join("") || `<tr><td colspan="3" class="empty">Nada ativo.</td></tr>`}</tbody></table></div></div>`).join("")}`;
  const acha = k => { const [col, id] = k.split("|"); return db[col].find(x => x.id === id); };
  $("adm-main").querySelectorAll("[data-dk]").forEach(c => c.onchange = () => { acha(c.dataset.dk).destaque = c.checked; save(); toast(c.checked ? "Em destaque" : "Destaque retirado"); });
  $("adm-main").querySelectorAll("[data-do]").forEach(i => i.onchange = () => { acha(i.dataset.do).ordem = +i.value || 0; save(); toast("Ordem salva"); });
}

/* ---------- Métricas do Explorar ---------- */
let XMD = 30;
const ACOES = { whats: "WhatsApp", insta: "Instagram", site: "Site", mapa: "Como chegar", comprar: "Comprar", agendar: "Agendamentos", cupom: "Cupons pegos", fav: "Favoritos", clk: "Cliques no banner" };
function vExplorarM(){
  const M = contaX(XMD), db = DB(), tipos = [["emp","Empresas", db.empresas],["prof","Profissionais", db.profissionais],["prod","Produtos", db.produtos],["parc","Clube CK", db.parceiros],["ban","Banners", db.banners]];
  const tot = Object.values(M).reduce((a, m) => ({ ver: a.ver + m.ver, clk: a.clk + m.clk }), { ver: 0, clk: 0 }), ac = {}; Object.values(M).forEach(m => Object.keys(ACOES).forEach(k => ac[k] = (ac[k] || 0) + (m[k] || 0)));
  $("adm-main").innerHTML = `<div class="head"><div><h1>Métricas do Explorar</h1><p class="muted">Visualizações e cliques em academias, profissionais, produtos, benefícios e banners. Nenhum dado de saúde entra aqui.</p></div><select class="input" id="xm-d" style="max-width:160px">${optsDe([[7,"7 dias"],[30,"30 dias"],[90,"90 dias"]], XMD)}</select></div>
    <div class="grid g4">${kpi("Visualizações", int(tot.ver), "", "explorarm", 1)}${kpi("Cliques", int(tot.clk), pct(tot.clk, tot.ver) + " de cliques")}${kpi("Agendamentos", int(ac.agendar || 0))}${kpi("Cliques em comprar", int(ac.comprar || 0))}</div>
    <div class="card"><h3 style="margin-bottom:8px">Cliques por ação</h3>${hbars(Object.entries(ACOES).map(([k, n]) => ({ nome: n, v: ac[k] || 0 })).filter(x => x.v))}</div>
    ${tipos.map(([t, n, L]) => { const rows = (L || []).map(x => ({ x, m: M[t + ":" + x.id] || { ver: 0, clk: 0 } })).filter(r => r.m.ver || r.m.clk).sort((a, b) => b.m.clk - a.m.clk || b.m.ver - a.m.ver).slice(0, 15);
      return `<div class="card"><h3 style="margin-bottom:8px">${n}</h3>${rows.length ? `<div class="tbl"><table><thead><tr><th>Nome</th><th>Vistas</th><th>Cliques</th><th>Taxa</th><th>Detalhe</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.x.nome || r.x.titulo)}</b></td><td class="num">${int(r.m.ver)}</td><td class="num">${int(r.m.clk)}</td><td class="num">${pct(r.m.clk, r.m.ver)}</td><td><small class="muted">${Object.keys(ACOES).filter(k => r.m[k]).map(k => `${ACOES[k]}: ${r.m[k]}`).join(" · ")}</small></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Sem movimento neste período.</p>`}</div>`; }).join("")}
    <button class="btn btn-line" id="xm-pl">Copiar planilha</button>`;
  $("xm-d").onchange = e => { XMD = +e.target.value; rerender(); };
  $("xm-pl").onclick = () => { const linhas = []; tipos.forEach(([t, n, L]) => (L || []).forEach(x => { const m = M[t + ":" + x.id]; if(m) linhas.push([n, x.nome || x.titulo, m.ver, m.clk, ...Object.keys(ACOES).map(k => m[k] || 0)]); })); planilha(["Tipo","Nome","Vistas","Cliques", ...Object.values(ACOES)], linhas, "Métricas do Explorar"); };
}

/* ---------- Módulo Ciclo: só números gerais ---------- */
async function vCiclo(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Módulo Ciclo</h1><p class="muted">Recurso opcional das alunas. Por privacidade, o painel mostra apenas números gerais. Ninguém da equipe vê dados individuais.</p></div></div><div id="ci-b"><div class="card">Carregando…</div></div>`;
  let r = null; try{ r = await F.XP.ciclo.resumo(); }catch(e){ $("ci-b").innerHTML = XERRA(e) ? AVISO_BANCO : `<div class="card">Sem conexão agora.</div>`; return; }
  if(!r){ $("ci-b").innerHTML = `<div class="card">Seu acesso não inclui esta área.</div>`; return; }
  $("ci-b").innerHTML = `<div class="grid g3">${kpi("Alunas usando", int(r.ativas), "", "ciclo", 1)}${kpi("Já ativaram alguma vez", int(r.total))}${kpi("Check-ins nos últimos 7 dias", int(r.checkins_7d))}</div>
    <div class="card"><h3>Regras de privacidade</h3><ul class="muted" style="margin:8px 0 0;padding-left:18px;line-height:1.7"><li>Os dados ficam numa tabela que só a própria aluna lê e grava.</li><li>Não são usados para anúncios, marketplace, segmentação, afiliados ou parceiros.</li><li>Não aparecem para academias, empresas, profissionais, outras alunas nem anunciantes.</li><li>O app sempre mostra previsões como estimativa e avisa que não é método contraceptivo.</li></ul></div>`;
}

/* ---------- Resumo: bloco do Explorar ---------- */
const vResumo0 = vResumo;
function vResumoX(){
  vResumo0();
  const db = DB(), pend = db.profissionais.filter(p => p.status === "pendente").length;
  $("adm-main").insertAdjacentHTML("beforeend", `<div class="card"><div class="sec-title"><h3>Explorar</h3><button class="btn btn-line btn-sm" id="rx-ag">Ver agendamentos</button></div>
    <div class="grid g4" style="margin-top:10px">${kpi("Empresas ativas", int(db.empresas.filter(e => e.ativo !== false).length), "", "empresas")}${kpi("Profissionais ativos", int(db.profissionais.filter(p => p.ativo !== false && (p.status || "ativo") === "ativo").length), pend ? pend + " pendente(s)" : "", "profissionais")}${kpi("Produtos na loja", int(db.produtos.filter(p => p.ativo !== false).length), "", "produtos")}<span id="rx-ags">${kpi("Agendamentos aguardando", "…", "", "agendamentos")}</span></div></div>`);
  $("rx-ag").onclick = () => ir("agendamentos");
  F.XP.ag.listar(true).then(L => { const e = $("rx-ags"); if(e) e.innerHTML = kpi("Agendamentos aguardando", int(L.filter(a => a.status === "solicitado" && a.data >= today()).length), "", "agendamentos", 1); }).catch(() => { const e = $("rx-ags"); if(e) e.innerHTML = kpi("Agendamentos", "-", "ative o banco", "agendamentos"); });
}

/* ---------- Papéis prontos nas permissões ---------- */
const formPerm0 = formPerm;
formPerm = function(u){
  formPerm0(u);
  const g = $("pm-g"); if(!g) return;
  g.insertAdjacentHTML("beforebegin", `<div class="acts" style="margin:4px 0 8px"><span class="muted" style="align-self:center">Papel pronto:</span><button class="btn btn-line btn-sm" data-papel="super">Super Admin</button><button class="btn btn-line btn-sm" data-papel="adm">Administrador</button><button class="btn btn-line btn-sm" data-papel="op">Operador</button></div>`);
  const OPER = ["agendamentos","avaliacoes","comunidade","cupons"];
  $("mbox").querySelectorAll("[data-papel]").forEach(b => b.onclick = () => { const p = b.dataset.papel;
    $("pm-t").checked = p === "super"; $("pm-t").onchange();
    g.querySelectorAll("select").forEach(s => { const k = s.dataset.k; s.value = p === "adm" ? (["admins","config"].includes(k) ? "ver" : "editar") : p === "op" ? (OPER.includes(k) ? "editar" : ["admins","config","financeiro","ciclo"].includes(k) ? "" : "ver") : ""; });
    toast("Papel aplicado. Clique em Salvar permissões."); });
};

Object.assign(VIEWS, { resumo: vResumoX, empresas: vEmpresas, profissionais: vProfX, servicos: vServicos, agendamentos: vAgendamentos, avaliacoes: vAvaliacoes, destaques: vDestaques, produtos: vProdutos, cupons: vCupons, banners: vBanners, categorias: vCategorias, explorarm: vExplorarM, ciclo: vCiclo });
