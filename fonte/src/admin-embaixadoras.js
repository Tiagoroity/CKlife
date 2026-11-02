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
function ebOrigem(u){
  const o = u.origem || {};
  if(o.e){ const e = ebLista().find(x => x.id === o.e); return { k: "emb:" + o.e, nome: e ? e.nome : o.e, tipo: "Embaixadora" }; }
  if(o.src){ const ad = /meta|facebook|instagram|^fb$|^ig$/i.test(o.src); return { k: ad ? "meta" : "src:" + o.src, nome: ad ? "Anúncio Meta" : o.src, tipo: ad ? "Anúncio" : "Campanha" }; }
  return { k: "direto", nome: "Direto / sem origem", tipo: "Direto" };
}
window.ckOrigemAluna = u => ebOrigem(u).nome;
function ebNumeros(){
  const alunas = DB().users.filter(u => !u.admin && !u.soAdmin && !u.exemplo), sete = addD(today(), -6), M = {};
  alunas.forEach(u => { const o = ebOrigem(u), m = M[o.k] = M[o.k] || { nome: o.nome, tipo: o.tipo, cad: 0, sem: 0, treinou: 0, pro: 0 };
    m.cad++; if((u.criado || "") >= sete) m.sem++; if((u.treinos || []).length) m.treinou++; if(ebPagando(u)) m.pro++; });
  return { M, total: alunas.length };
}
const ebPct = (a, b) => b ? Math.round(100 * a / b) + "%" : "–";
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
    <div class="card"><h3>De onde vêm as alunas</h3><p class="hint" style="margin:0 0 10px">Todas as ${int(total)} alunas cadastradas. A origem passou a ser registrada a partir de 01/11/2026; quem entrou antes aparece em "Direto / sem origem".</p>
      <div class="tbl"><table><thead><tr><th>Origem</th><th>Cadastros</th><th>Já treinaram</th><th>Assinaram o Pro</th></tr></thead><tbody>${orig.map(m => `<tr><td><b>${esc(m.nome)}</b><br><small class="muted">${esc(m.tipo)}</small></td><td class="num">${int(m.cad)}</td><td class="num">${int(m.treinou)} <small class="muted">(${ebPct(m.treinou, m.cad)})</small></td><td class="num">${int(m.pro)}</td></tr>`).join("") || `<tr><td colspan="4" class="empty">Sem alunas ainda.</td></tr>`}</tbody></table></div></div>`;
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
VIEWS.embaixadoras = typeof comVendas === "function" ? comVendas(vEmbaixadoras) : vEmbaixadoras;
