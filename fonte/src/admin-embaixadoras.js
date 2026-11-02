/* ===================== Painel · EMBAIXADORAS =====================
   Cada embaixadora ganha um link (cklife.com.br/?e=codigo). Quem se cadastra pelo link conta para ela
   (regra do último clique, até 30 dias). Aqui: criar, copiar o link, mandar no WhatsApp e ver os números
   (cadastros, quantas treinaram, quantas assinaram o Pro). A embaixadora nunca vê dados das alunas. */
AIC.embaixadoras = '<path d="M12 2l3 6 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.9 3 1.1-6.5L2.5 8.9 9 8z"/>';
SECOES.push(["embaixadoras", "Embaixadoras"]); MENU_NOME.embaixadoras = "Embaixadoras e origem";
{ const g = MENU.find(m => m[0] === "Marketing"); if(g && !g[1].some(x => x[2].includes("embaixadoras"))) g[1].push(["Embaixadoras", "embaixadoras", ["embaixadoras"]]); }
{ const mmEb = montaMenu; montaMenu = function(){ try{ if(PERM && !PERM.total && PERM.embaixadoras == null && PERM.alunos) PERM.embaixadoras = PERM.alunos === "editar" ? "ver" : PERM.alunos; }catch(e){} return mmEb.apply(this, arguments); }; }
const EB_SITE = "https://cklife.com.br/";
const ebLink = c => EB_SITE + "?e=" + encodeURIComponent(c);
const ebSlug = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);
const ebLista = () => (DB().embaixadoras = DB().embaixadoras || []);
const ebPagando = u => { const s = (typeof PLU !== "undefined" && PLU) ? PLU[u.id] : null; return !!(s && s.pro && !s.trial && ["kiwify", "apple", "google"].includes(s.provider)); };
/* de onde a aluna veio */
const ebManual = () => (DB().origemManual = DB().origemManual || []);
function ebOrigem(u){
  const man = !u.origem && ebManual().find(x => x.id === u.id);
  const o = u.origem || (man && man.o) || {};
  if(o.e){ const e = ebLista().find(x => x.id === o.e); return { k: "emb:" + o.e, nome: e ? e.nome : o.e, tipo: "Embaixadora" + (man ? " (marcada à mão)" : "") }; }
  if(o.src === "convite") return { k: "convite", nome: "Convite de aluna (compartilhou conquista)", tipo: "Indicação" };
  if(o.src === "direto") return { k: "direto_ind", nome: "Direto / indicação", tipo: "Marcada à mão" };
  if(o.src){ const ad = /meta|facebook|instagram|^fb$|^ig$/i.test(o.src); return { k: ad ? "meta" : "src:" + o.src, nome: ad ? "Anúncio Meta" : o.src, tipo: (ad ? "Anúncio" : "Campanha") + (man ? " (inclui marcadas à mão)" : "") }; }
  return { k: "direto", nome: "Direto / sem origem", tipo: "Direto" };
}
window.ckOrigemAluna = u => ebOrigem(u).nome;
function ebNumeros(){
  const alunas = DB().users.filter(u => !u.admin && !u.soAdmin && !u.exemplo && !ehTeste(u)), sete = addD(today(), -6), M = {};
  alunas.forEach(u => { const o = ebOrigem(u), m = M[o.k] = M[o.k] || { nome: o.nome, tipo: o.tipo, cad: 0, sem: 0, treinou: 0, pro: 0 };
    m.cad++; if((u.criado || "") >= sete) m.sem++; if((u.treinos || []).length) m.treinou++; if(ebPagando(u)) m.pro++; });
  return { M, total: alunas.length };
}
const ebPct = (a, b) => b ? Math.round(100 * a / b) + "%" : "–";
/* compartilhamentos de conquista feitos pelas alunas (últimos 30 dias) e quem chegou pelo convite */
const EB_SH = { workout_share_clicked: "Treino", challenge_share_clicked: "Desafio", achievement_share_clicked: "Conquista" };
function ebCompart(){
  const ini = addD(today(), -29), E = (DB().eventos || []).filter(e => String(e.c).startsWith("sh:") && e.d >= ini), us = DB().users;
  const ab = E.filter(e => EB_SH[String(e.c).split(":")[1]]), env = E.filter(e => String(e.c).split(":")[1] === "share_menu_opened"), conv = E.filter(e => /invite_clicked/.test(String(e.c).split(":")[1]));
  const porTipo = {}; ab.forEach(e => { const k = EB_SH[String(e.c).split(":")[1]]; porTipo[k] = (porTipo[k] || 0) + 1; });
  const chegaram = us.filter(u => !u.admin && !u.soAdmin && !ehTeste(u) && u.origem && u.origem.src === "convite"), quem = {};
  chegaram.forEach(u => { const c = u.origem.anuncio || "?"; quem[c] = (quem[c] || 0) + 1; });
  const top = Object.entries(quem).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, n]) => { const d = us.find(u => u.convite === c); return `<tr><td>${d ? esc(d.nome || "Aluna") : `<span class="muted">código ${esc(c)}</span>`}</td><td class="num"><b>${int(n)}</b></td></tr>`; }).join("");
  return `<div class="card"><h3>Compartilhamentos das alunas</h3><p class="hint" style="margin:0 0 10px">Últimos 30 dias. Quando a aluna conclui algo, ela pode mandar o cartão da conquista para fora do app (Instagram, WhatsApp...). O convite leva um link com código dela; quem se cadastra por ele aparece aqui. Cliques no link não dá para contar sem a pessoa entrar no app.</p>
    <div class="grid g4">${kpi("Abriram o cartão", int(ab.length), esc(Object.entries(porTipo).map(([k, n]) => `${k}: ${n}`).join(" · ") || "–"))}${kpi("Tocaram em Compartilhar", int(env.length), `${int(new Set(env.map(e => e.u)).size)} alunas`)}${kpi("Convites enviados", int(conv.length))}${kpi("Novas alunas por convite", int(chegaram.length), "desde o início", "", true)}</div>
    ${top ? `<div class="tbl" style="margin-top:10px"><table><thead><tr><th>Quem mais trouxe amigas</th><th>Cadastros</th></tr></thead><tbody>${top}</tbody></table></div>` : ""}</div>`;
}
function vEmbaixadoras(){
  const L = ebLista(), { M, total } = ebNumeros(), pode = podeEditar("embaixadoras");
  const linhaEmb = e => { const m = M["emb:" + e.id] || { cad: 0, sem: 0, treinou: 0, pro: 0 };
    return `<tr><td><b>${esc(e.nome)}</b>${e.ativa === false ? ` <span class="st off">pausada</span>` : ""}<br><small class="muted eb-link">${esc(ebLink(e.id))}</small></td>
      <td class="num"><b>${int(m.cad)}</b>${m.sem ? `<br><small class="muted">+${int(m.sem)} em 7 dias</small>` : ""}</td><td class="num">${int(m.treinou)} <small class="muted">(${ebPct(m.treinou, m.cad)})</small></td><td class="num">${int(m.pro)}</td>
      <td><div class="acts"><button class="btn btn-accent btn-sm" data-eb-cp="${esc(e.id)}">Copiar link</button>${String(e.whats || "").replace(/\D/g, "").length >= 10 ? `<button class="btn btn-sm zap-bt" data-eb-zap="${esc(e.id)}" title="Mandar o link para ela no WhatsApp">💬</button>` : ""}${pode ? `<button class="btn btn-line btn-sm" data-eb-ed="${esc(e.id)}">Editar</button>` : ""}</div></td></tr>`; };
  const orig = Object.values(M).sort((a, b) => b.cad - a.cad);
  $("adm-main").innerHTML = `<div class="head"><div><h1>Embaixadoras</h1><p class="muted">Cada embaixadora tem um link próprio. Quem se cadastra pelo link conta para ela (vale o último link que a aluna clicou antes de se cadastrar, até 30 dias). Ela nunca vê dados das alunas.</p></div>${pode ? `<button class="btn btn-accent" id="eb-n">+ Nova embaixadora</button>` : ""}</div>
    <div class="card"><h3>Embaixadoras <span class="muted num" style="font-size:16px">(${L.length})</span></h3>
      ${L.length ? `<div class="tbl"><table><thead><tr><th>Embaixadora e link</th><th>Cadastros</th><th>Já treinaram</th><th>Assinaram o Pro</th><th></th></tr></thead><tbody>${L.slice().sort((a, b) => ((M["emb:" + b.id] || {}).cad || 0) - ((M["emb:" + a.id] || {}).cad || 0)).map(linhaEmb).join("")}</tbody></table></div>`
        : `<p class="muted" style="margin:6px 0 0">Nenhuma embaixadora ainda. Toque em <b>+ Nova embaixadora</b>: o link dela é criado na hora.</p>`}
    </div>
    ${ebCompart()}
    <div class="card"><h3>De onde vêm as alunas</h3><p class="hint" style="margin:0 0 10px">Todas as ${int(total)} alunas cadastradas. A origem passou a ser registrada a partir de 01/11/2026; quem entrou antes aparece em "Direto / sem origem".</p>
      <div class="tbl"><table><thead><tr><th>Origem</th><th>Cadastros</th><th>Já treinaram</th><th>Assinaram o Pro</th></tr></thead><tbody>${orig.map(m => `<tr><td><b>${esc(m.nome)}</b><br><small class="muted">${esc(m.tipo)}</small></td><td class="num">${int(m.cad)}</td><td class="num">${int(m.treinou)} <small class="muted">(${ebPct(m.treinou, m.cad)})</small></td><td class="num">${int(m.pro)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty">Sem alunas ainda.</td></tr>`}</tbody></table></div></div>`;
  ebSemOrigem(pode);
  const n = $("eb-n"); if(n) n.onclick = () => ebForm(null);
  document.querySelectorAll("[data-eb-cp]").forEach(b => b.onclick = () => F.copyText(ebLink(b.dataset.ebCp), "Link copiado. É só mandar para ela 💚"));
  document.querySelectorAll("[data-eb-ed]").forEach(b => b.onclick = () => ebForm(ebLista().find(x => x.id === b.dataset.ebEd)));
  document.querySelectorAll("[data-eb-zap]").forEach(b => b.onclick = () => { const e = ebLista().find(x => x.id === b.dataset.ebZap); if(!e) return;
    const msg = `Oi, ${String(e.nome).split(" ")[0]}! 💚 Esse é o seu link de embaixadora do CK Life:\n${ebLink(e.id)}\n\nToda mulher que se cadastrar por ele conta para você. Pode colocar na bio, nos stories e mandar para as amigas!`;
    const url = F.lkWhats(e.whats, msg); if(url) window.open(url, "_blank", "noopener"); });
}
function ebForm(e){
  const novo = !e; e = e || { nome: "", whats: "", insta: "", ativa: true };
  modal(novo ? "Nova embaixadora" : "Editar embaixadora", `<div class="formgrid">
    <div class="field full"><label for="eb-nm">Nome</label><input class="input" id="eb-nm" value="${esc(e.nome)}" placeholder="Ex.: Micaela Souza"></div>
    <div class="field full"><label for="eb-cd">Código do link</label><input class="input" id="eb-cd" value="${esc(e.id || "")}" ${novo ? "" : "disabled"} placeholder="micaela" maxlength="30">
      <small class="muted" id="eb-pv">${novo ? "Só letras e números. O link fica: " + esc(EB_SITE) + "?e=…" : "O código não muda depois de criado, para o link dela continuar valendo."}</small></div>
    <div class="field"><label for="eb-wa">WhatsApp (opcional)</label><input class="input" id="eb-wa" value="${esc(e.whats || "")}" placeholder="(65) 99999-9999"></div>
    <div class="field"><label for="eb-ig">Instagram (opcional)</label><input class="input" id="eb-ig" value="${esc(e.insta || "")}" placeholder="@usuario"></div>
    <label class="field full" style="flex-direction:row;align-items:center;gap:10px;font-weight:700"><input type="checkbox" id="eb-at" ${e.ativa !== false ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--accent)"> Ativa</label>
  </div><div id="eb-msg"></div><div class="toolbar" style="justify-content:flex-end"><button class="btn btn-accent" id="eb-ok">${novo ? "Criar e gerar link" : "Salvar"}</button></div>`);
  const nm = $("eb-nm"), cd = $("eb-cd"), pv = $("eb-pv");
  if(novo){ let mexeu = false; cd.oninput = () => { mexeu = true; cd.value = ebSlug(cd.value); pv.textContent = "O link fica: " + ebLink(cd.value || "…"); };
    nm.oninput = () => { if(!mexeu){ cd.value = ebSlug(nm.value.split(" ")[0]); pv.textContent = "O link fica: " + ebLink(cd.value || "…"); } }; }
  $("eb-ok").onclick = () => {
    const nome = val("eb-nm"), id = novo ? ebSlug(val("eb-cd")) : e.id, msg = t => $("eb-msg").innerHTML = `<div class="msg msg-bad">${t}</div>`;
    if(!nome) return msg("Digite o nome.");
    if(!id || id.length < 2) return msg("Digite um código com pelo menos 2 letras ou números.");
    if(novo && ebLista().some(x => x.id === id)) return msg("Esse código já é de outra embaixadora. Escolha outro (ex.: " + id + "2).");
    const d = { id, nome, whats: val("eb-wa"), insta: val("eb-ig").replace(/^@/, ""), ativa: !!$("eb-at").checked, criada: e.criada || today() };
    if(novo) ebLista().push(d); else Object.assign(e, d);
    save(); fechar(); rerender();
    if(novo) F.copyText(ebLink(id), "Embaixadora criada e link copiado 💚");
  };
}
/* alunas sem origem (cadastradas antes do rastreio): marcar à mão */
function ebSemOrigem(pode){
  const L = DB().users.filter(u => !u.admin && !u.soAdmin && !u.exemplo && !ehTeste(u) && !u.origem && !ebManual().some(x => x.id === u.id)).sort((a, b) => (b.criado || "").localeCompare(a.criado || ""));
  if(!L.length || !pode) return;
  const dias = [...new Set(L.map(u => u.criado).filter(Boolean))].slice(0, 6);
  const opts = `<option value="meta">Anúncio Meta</option>${ebLista().map(e => `<option value="e:${esc(e.id)}">Embaixadora: ${esc(e.nome)}</option>`).join("")}<option value="direto">Direto / indicação</option>`;
  $("adm-main").insertAdjacentHTML("beforeend", `<div class="card eb-sem"><h3>Alunas sem origem <span class="muted num" style="font-size:16px">(${L.length})</span></h3>
    <p class="hint" style="margin:0 0 10px">Entraram antes de o app registrar a origem, então ele não tem como saber sozinho. Se você sabe de onde vieram (por exemplo, as do dia em que o anúncio começou), marque aqui. Fica anotado como "marcada à mão".</p>
    <div class="eb-rap">${dias.map(d => { const n = L.filter(u => u.criado === d).length; return `<button class="btn btn-line btn-sm" data-eb-dia="${esc(d)}">Marcar as ${n} de ${esc(brD(d))} como Anúncio Meta</button>`; }).join("")}</div>
    <div class="eb-lista">${L.slice(0, 80).map(u => `<label class="eb-al"><input type="checkbox" value="${esc(u.id)}"><span><b>${esc(u.nome || u.email)}</b><small>cadastro ${esc(brD(u.criado))}</small></span></label>`).join("")}</div>
    <div class="toolbar" style="gap:8px;flex-wrap:wrap;margin-top:10px"><select class="input" id="eb-sel" style="max-width:260px">${opts}</select><button class="btn btn-accent btn-sm" id="eb-marca">Marcar selecionadas</button></div></div>`);
  const marca = (ids, v) => { if(!ids.length) return toast("Selecione pelo menos uma aluna");
    const o = v === "meta" ? { src: "meta", manual: true } : v.startsWith("e:") ? { e: v.slice(2), manual: true } : { src: "direto", manual: true };
    ids.forEach(id => { const m = ebManual(), x = m.find(y => y.id === id); if(x) x.o = o; else m.push({ id, o, em: today() }); });
    save(); toast(ids.length + (ids.length === 1 ? " aluna marcada" : " alunas marcadas")); rerender(); };
  document.querySelectorAll("[data-eb-dia]").forEach(b => b.onclick = () => { const d = b.dataset.ebDia, ids = L.filter(u => u.criado === d).map(u => u.id);
    confirmar(`Marcar as ${ids.length} alunas cadastradas em ${brD(d)} como vindas do Anúncio Meta? Dá para mudar depois.`, () => marca(ids, "meta")); });
  $("eb-marca").onclick = () => marca([...document.querySelectorAll(".eb-al input:checked")].map(i => i.value), $("eb-sel").value);
}
VIEWS.embaixadoras = typeof comVendas === "function" ? comVendas(vEmbaixadoras) : vEmbaixadoras;
