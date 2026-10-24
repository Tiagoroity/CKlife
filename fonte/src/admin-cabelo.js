/* ===================== Painel · CABELO PARA TREINAR =====================
   Liberação (Desativado | Beta | Ativado) guardada no banco (feature_flags), pré-visualização sem publicar,
   e cadastro dos penteados: criar, editar, duplicar, ordenar, publicar, desativar, excluir, com fotos/vídeo por passo. */
AIC.cabelo = '<path d="M12 3c-4 0-7 3-7 7 0 3 1 5 1 8h12c0-3 1-5 1-8 0-4-3-7-7-7z"/><path d="M9 21h6M8 11c1.5-2 6.5-2 8 0"/>';
SECOES.push(["cabelo", "Cabelo para Treinar"]); MENU_NOME.cabelo = "Cabelo para Treinar";
MENU.forEach(([, gs]) => gs.forEach(g => { if(g[0] === "Conteúdo" && !g[2].includes("cabelo")) g[2].push("cabelo"); }));
const CB_TIPOS = [["liso", "Liso"], ["ondulado", "Ondulado"], ["cacheado", "Cacheado"], ["crespo", "Crespo"]];
const CB_COMP = [["curto", "Curto"], ["medio", "Médio"], ["longo", "Longo"], ["muito_longo", "Muito longo"]];
const CB_TREINOS = [["musculacao", "Musculação"], ["corrida", "Corrida"], ["caminhada", "Caminhada"], ["bike", "Bike"], ["funcional", "Funcional"], ["cross", "Cross Training"], ["yoga", "Yoga"], ["pilates", "Pilates"], ["danca", "Dança"], ["intenso", "Treino intenso"], ["leve", "Treino leve"]];
const CB_ACS = [["scrunchie", "Scrunchie"], ["elastico", "Elástico"], ["faixa", "Faixa esportiva"], ["bandana", "Bandana"], ["grampos", "Grampos"], ["presilhas", "Presilhas"], ["pente", "Pente"], ["toalha", "Toalha"]];
const CB_ST = { rascunho: ["Rascunho", "off"], publicado: ["Publicado", "ok"], desativado: ["Desativado", "warn"] };
const CB_EST = { disabled: ["Desativado", "Ninguém vê. Você pode pré-visualizar."], beta: ["Beta", "Só administradores e as alunas escolhidas veem."], enabled: ["Ativado", "Todas as alunas veem."] };
let CBF = "todos", CBQ = "";
const cbSlug = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
const cbChips = (L, sel, id) => `<div class="seg-pills" id="${id}">${L.map(([k, n]) => `<button type="button" class="chip" data-v="${k}" aria-pressed="${(sel || []).includes(k)}">${n}</button>`).join("")}</div>`;
const cbLe = id => [...$(id).querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.v);
async function cbSobe(pasta, blob, ext, tipo){
  const path = `${pasta}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const r = await SB2().storage.from("cabelo").upload(path, blob, { contentType: tipo, cacheControl: "31536000", upsert: false }); if(r.error) throw r.error;
  return SB2().storage.from("cabelo").getPublicUrl(path).data.publicUrl;
}
/* imagem: mantém a proporção, até 1200 px, WebP (ou JPEG) */
async function cbImagem(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use JPG, PNG ou WebP."); if(file.size > 15 * 1048576) throw new Error("Imagem muito grande (máximo 15 MB).");
  const b = await createImageBitmap(file), w = Math.min(1200, b.width), h = Math.round(w * b.height / b.width), cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(b, 0, 0, w, h);
  let bl = await new Promise(ok => cv.toBlob(ok, "image/webp", .85)), ext = "webp", mime = "image/webp"; if(!bl || bl.type !== "image/webp"){ bl = await new Promise(ok => cv.toBlob(ok, "image/jpeg", .85)); ext = "jpg"; mime = "image/jpeg"; }
  return { bl, ext, mime, url: URL.createObjectURL(bl) };
}
function cbVideo(file){ return new Promise((ok, no) => { if(!/^video\/(mp4|webm)$/.test(file.type)) return no(new Error("Use MP4 ou WebM.")); if(file.size > 30 * 1048576) return no(new Error("Vídeo muito pesado (máximo 30 MB).")); const v = document.createElement("video"); v.preload = "metadata"; v.src = URL.createObjectURL(file); v.onloadedmetadata = () => v.duration > 120.5 ? no(new Error("O vídeo pode ter até 2 minutos.")) : ok(file); v.onerror = () => no(new Error("Não foi possível ler este vídeo.")); }); }

async function vCabelo(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Cabelo para Treinar</h1><p class="muted">Penteados rápidos para cada treino. Você decide quando as alunas veem.</p></div><div class="toolbar"><button class="btn btn-line needs-edit" id="cb-lote">Enviar miniaturas em lote</button><button class="btn btn-accent needs-edit" id="cb-new">+ Novo penteado</button></div></div>
    <div class="card cb-flag" id="cb-flag"><div class="skel" style="height:16px;width:50%"></div><div class="skel" style="height:40px;margin-top:12px"></div></div>
    <div class="cb-tools"><div class="chips">${[["todos", "Todos"], ["publicado", "Publicados"], ["rascunho", "Rascunhos"], ["desativado", "Desativados"]].map(([k, n]) => `<button class="chip" data-f="${k}" aria-pressed="${CBF === k}">${n}</button>`).join("")}</div><div class="search">${aic("busca", 16)}<input class="input" id="cb-q" placeholder="Buscar penteado" value="${esc(CBQ)}"></div></div>
    <div id="cb-l"><div class="card"><div class="skel" style="height:14px;width:70%"></div></div></div>`;
  const nw = $("cb-new"); if(nw) nw.onclick = () => cbForm();
  const lt = $("cb-lote"); if(lt) lt.onclick = cbLote;
  $("adm-main").querySelectorAll("[data-f]").forEach(b => b.onclick = () => { CBF = b.dataset.f; vCabelo(); });
  let tq; $("cb-q").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { CBQ = e.target.value; cbLista(); }, 200); };
  if(!SB2()) return $("cb-l").innerHTML = `<div class="card adm-vazio"><b>Funciona no app oficial, com o banco conectado.</b></div>`;
  cbFlag(); cbLista();
}
async function cbFlag(){
  const box = $("cb-flag"); if(!box) return; let f = null;
  try{ const r = await SB2().rpc("admin_flag", { p_chave: "cabelo" }); if(r.error) throw r.error; f = r.data; }catch(e){ box.innerHTML = semBanco(e).replace("seguranca.sql", "cabelo.sql"); return; }
  if(!f) f = { estado: "disabled", beta: [] };
  const ed = podeEditar("cabelo");
  box.innerHTML = `<div class="cb-fh"><div><span class="eyebrow">Disponibilizar para alunas</span><b class="cb-est cb-e-${f.estado}">${CB_EST[f.estado][0]}</b><small class="muted">${CB_EST[f.estado][1]}${f.atualizado ? ` · alterado em ${new Date(f.atualizado).toLocaleString("pt-BR")}` : ""}</small></div>
      <a class="btn btn-line btn-sm" href="/?preview=cabelo#abrir-cabelo" target="_blank" rel="noopener">${aic("busca", 15)} Visualizar como aluna</a></div>
    <div class="pm-seg cb-seg" role="radiogroup" aria-label="Estado">${Object.entries(CB_EST).map(([k, [n]]) => `<button type="button" role="radio" data-est="${k}" aria-checked="${f.estado === k}" ${ed ? "" : "disabled"}>${n}</button>`).join("")}</div>
    <div class="cb-beta" ${f.estado === "beta" ? "" : "hidden"}><b>Alunas no beta</b>${(f.beta || []).length ? `<div class="cb-bl">${f.beta.map(u => `<span class="cb-bu">${esc(u.nome || u.email)}<small>${esc(u.email)}</small>${ed ? `<button data-rm="${esc(u.email)}" aria-label="Tirar ${esc(u.email)} do beta">×</button>` : ""}</span>`).join("")}</div>` : `<p class="muted" style="margin:4px 0">Nenhuma aluna ainda. Administradores sempre veem no beta.</p>`}
      ${ed ? `<div class="toolbar"><input class="input" id="cb-be" type="email" placeholder="E-mail da aluna"><button class="btn btn-accent btn-sm" id="cb-ba">Adicionar ao beta</button></div>` : ""}</div>
    <p class="hint" style="margin:0">A pré-visualização abre o app com o módulo só para você. Não muda nada para as alunas.</p>`;
  box.querySelectorAll("[data-est]").forEach(b => b.onclick = () => { const e = b.dataset.est; if(e === f.estado) return;
    const muda = async () => { try{ await sq(SB2().from("feature_flags").update({ estado: e }).eq("chave", "cabelo")); toast(`Cabelo para Treinar: ${CB_EST[e][0]}`); cbFlag(); }catch(er){ toast("Não deu: " + (er.message || "sem permissão")); } };
    e === "enabled" ? confirmar("Ativar para TODAS as alunas? O módulo aparece no app delas na hora.", muda) : muda(); });
  const ba = $("cb-ba"); if(ba) ba.onclick = async () => { try{ const r = await SB2().rpc("admin_flag_beta", { p_chave: "cabelo", p_email: val("cb-be"), p_add: true }); if(r.error) throw r.error; toast("Aluna adicionada ao beta"); cbFlag(); }catch(er){ toast(er.message || "Não deu"); } };
  box.querySelectorAll("[data-rm]").forEach(b => b.onclick = async () => { try{ await SB2().rpc("admin_flag_beta", { p_chave: "cabelo", p_email: b.dataset.rm, p_add: false }); toast("Removida do beta"); cbFlag(); }catch(er){ toast("Não deu"); } });
}
let CB_L = [];
async function cbLista(){
  const box = $("cb-l"); if(!box) return;
  try{ CB_L = await sq(SB2().from("penteados").select("id,nome,slug,status,tipos,comprimentos,treinos,minutos,thumb,imagem,video_url,destaque,ordem").order("ordem")); }catch(e){ box.innerHTML = semBanco(e).replace("seguranca.sql", "cabelo.sql"); return; }
  const qq = sem(CBQ.trim()), V = CB_L.filter(p => (CBF === "todos" || p.status === CBF) && (!qq || sem(p.nome + " " + p.slug).includes(qq)));
  const ed = podeEditar("cabelo");
  box.innerHTML = V.length ? `<div class="adm-adlist">${V.map(p => { const [st, k] = CB_ST[p.status]; return `<div class="adm-adrow cb-row">
      <span class="adm-adth">${p.thumb || p.imagem ? `<img src="${esc(p.thumb || p.imagem)}" alt="" loading="lazy">` : aic("cabelo", 20)}</span>
      <span class="adm-adtx"><b>${esc(p.nome)}${p.destaque ? ` <span class="st ok">Destaque</span>` : ""}</b><small>${p.tipos.map(t => (CB_TIPOS.find(x => x[0] === t) || [, t])[1]).join(", ")} · ${p.comprimentos.map(t => (CB_COMP.find(x => x[0] === t) || [, t])[1]).join(", ")}</small><small>${p.minutos} min · ${p.treinos.length} treinos${p.video_url ? " · com vídeo" : ""}${!(p.thumb || p.imagem) ? " · mídia pendente" : ""}</small></span>
      <span class="st ${k}">${st}</span>
      <span class="acts">${ed ? `<button class="btn btn-line btn-sm" data-up="${p.id}" aria-label="Subir">↑</button><button class="btn btn-line btn-sm" data-dn="${p.id}" aria-label="Descer">↓</button>` : ""}<button class="btn btn-line btn-sm" data-ed="${p.id}">${ed ? "Editar" : "Ver"}</button>${ed ? `<button class="btn btn-line btn-sm" data-dup="${p.id}">Duplicar</button><button class="btn btn-sm ${p.status === "publicado" ? "btn-line" : "btn-accent"}" data-pub="${p.id}">${p.status === "publicado" ? "Desativar" : "Publicar"}</button><button class="btn btn-bad btn-sm" data-del="${p.id}">Excluir</button>` : ""}</span></div>`; }).join("")}</div>`
    : `<div class="card adm-vazio"><span>${aic("cabelo", 28)}</span><b>Nenhum penteado aqui</b><p class="muted">Rode o cabelo.sql para trazer os penteados iniciais ou crie um novo.</p></div>`;
  const ach = id => CB_L.find(p => p.id === id);
  box.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => cbForm(b.dataset.ed));
  box.querySelectorAll("[data-dup]").forEach(b => b.onclick = () => cbForm(b.dataset.dup, true));
  box.querySelectorAll("[data-pub]").forEach(b => b.onclick = async () => { const p = ach(b.dataset.pub), novo = p.status === "publicado" ? "desativado" : "publicado"; try{ await sq(SB2().from("penteados").update({ status: novo }).eq("id", p.id)); toast(novo === "publicado" ? "Publicado" : "Desativado"); cbLista(); }catch(e){ toast(e.message || "Não deu"); } });
  box.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { const p = ach(b.dataset.del); confirmar(`Excluir "${p.nome}" e os passos dele? Não dá para desfazer. Se quiser só esconder, use Desativar.`, async () => { try{ await sq(SB2().from("penteados").delete().eq("id", p.id)); toast("Penteado excluído"); cbLista(); }catch(e){ toast(e.message || "Não deu"); } }); });
  const move = async (id, d) => { const L = CB_L.slice(), i = L.findIndex(p => p.id === id), j = i + d; if(j < 0 || j >= L.length) return; const a = L[i], b2 = L[j];
    try{ await Promise.all([sq(SB2().from("penteados").update({ ordem: b2.ordem }).eq("id", a.id)), sq(SB2().from("penteados").update({ ordem: a.ordem === b2.ordem ? a.ordem + d : a.ordem }).eq("id", b2.id))]); cbLista(); }catch(e){ toast("Não deu para reordenar"); } };
  box.querySelectorAll("[data-up]").forEach(b => b.onclick = () => move(b.dataset.up, -1));
  box.querySelectorAll("[data-dn]").forEach(b => b.onclick = () => move(b.dataset.dn, 1));
}
async function cbForm(id, duplicar){
  let p = { nome: "", slug: "", descricao: "", tipos: [], comprimentos: [], treinos: [], minutos: 2, dificuldade: "facil", fixacao: "media", acessorios: [], thumb: null, imagem: null, video_url: null, destaque: false, ordem: (CB_L.length + 1) * 10, status: "rascunho" }, S = [];
  if(id){ try{ p = (await sq(SB2().from("penteados").select("*").eq("id", id)))[0] || p; S = await sq(SB2().from("penteado_passos").select("*").eq("penteado_id", id).order("numero")); }catch(e){ return toast("Não deu para abrir"); } }
  if(duplicar){ p = { ...p, id: undefined, nome: p.nome + " (cópia)", slug: cbSlug(p.slug + "-copia-" + Date.now().toString(36).slice(-3)), status: "rascunho", destaque: false }; S = S.map(s => ({ ...s, id: undefined })); }
  if(!S.length) S = [1, 2, 3, 4].map(n => ({ numero: n, titulo: "", instrucao: "", midia: null, vista: "back" }));
  const M = { thumb: null, imagem: null, video: null, passos: {} };
  const ed = podeEditar("cabelo");
  const passoHtml = (s, i) => `<div class="cb-passo" data-i="${i}"><div class="cb-ph"><b>Passo ${i + 1}</b><span><button type="button" class="btn btn-line btn-sm" data-pup="${i}" aria-label="Subir passo">↑</button><button type="button" class="btn btn-line btn-sm" data-prm="${i}" aria-label="Remover passo">×</button></span></div>
      <div class="formgrid"><div class="field"><label>Título</label><input class="input" data-pt="titulo" value="${esc(s.titulo || "")}" maxlength="60"></div><div class="field"><label>Vista</label><select class="input" data-pt="vista">${[["front", "Frente"], ["side", "Lateral"], ["back", "Trás"], ["detail", "Detalhe"]].map(([k, n]) => `<option value="${k}" ${s.vista === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="field full"><label>Instrução</label><textarea class="input" data-pt="instrucao" maxlength="300">${esc(s.instrucao || "")}</textarea></div>
      <div class="field full"><div class="ad-up"><span class="cb-mini">${s.midia ? `<img src="${esc(s.midia)}" alt="">` : "Sem mídia"}</span><input type="file" accept="image/jpeg,image/png,image/webp" data-pf="${i}" hidden><button type="button" class="btn btn-line btn-sm" data-pp="${i}">${s.midia ? "Trocar imagem" : "Imagem do passo"}</button>${s.midia ? `<button type="button" class="btn btn-line btn-sm" data-px="${i}">Remover</button>` : ""}</div></div></div></div>`;
  modal(id && !duplicar ? "Editar penteado" : "Novo penteado", `<div class="formgrid">
    <div class="field"><label for="cf-n">Nome</label><input class="input" id="cf-n" value="${esc(p.nome)}" maxlength="60"></div>
    <div class="field"><label for="cf-s">Slug (endereço)</label><input class="input" id="cf-s" value="${esc(p.slug)}" maxlength="70" placeholder="gerado pelo nome"></div>
    <div class="field full"><label for="cf-d">Descrição curta</label><input class="input" id="cf-d" value="${esc(p.descricao || "")}" maxlength="160" placeholder="Rápido, confortável e firme para exercícios intensos."></div>
    <div class="field full"><label>Tipo de cabelo</label>${cbChips(CB_TIPOS, p.tipos, "cf-t")}</div>
    <div class="field full"><label>Comprimento</label>${cbChips(CB_COMP, p.comprimentos, "cf-c")}</div>
    <div class="field full"><label>Treinos indicados</label>${cbChips(CB_TREINOS, p.treinos, "cf-tr")}</div>
    <div class="field"><label for="cf-m">Tempo (min)</label><input class="input num" id="cf-m" type="number" min="1" max="60" value="${esc(p.minutos)}"></div>
    <div class="field"><label for="cf-di">Dificuldade</label><select class="input" id="cf-di">${[["facil", "Fácil"], ["media", "Média"], ["avancada", "Avançada"]].map(([k, n]) => `<option value="${k}" ${p.dificuldade === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="field"><label for="cf-f">Fixação</label><select class="input" id="cf-f">${[["leve", "Leve"], ["media", "Média"], ["alta", "Alta"]].map(([k, n]) => `<option value="${k}" ${p.fixacao === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="field"><label for="cf-o">Ordem</label><input class="input num" id="cf-o" type="number" value="${esc(p.ordem)}"></div>
    <div class="field full"><label>Acessórios</label>${cbChips(CB_ACS, p.acessorios, "cf-a")}</div>
    <div class="field full"><label>Mídia</label><div class="cb-midias">
      <div class="cb-mid"><span class="cb-mini" id="cf-thv">${p.thumb ? `<img src="${esc(p.thumb)}" alt="">` : "Miniatura"}</span><input type="file" id="cf-thf" accept="image/jpeg,image/png,image/webp" hidden><button type="button" class="btn btn-line btn-sm" id="cf-thb">${p.thumb ? "Trocar" : "Enviar"} miniatura</button></div>
      <div class="cb-mid"><span class="cb-mini" id="cf-imv">${p.imagem ? `<img src="${esc(p.imagem)}" alt="">` : "Imagem principal"}</span><input type="file" id="cf-imf" accept="image/jpeg,image/png,image/webp" hidden><button type="button" class="btn btn-line btn-sm" id="cf-imb">${p.imagem ? "Trocar" : "Enviar"} imagem</button></div>
      <div class="cb-mid"><span class="cb-mini" id="cf-vdv">${p.video_url ? "Vídeo ✓" : "Sem vídeo"}</span><input type="file" id="cf-vdf" accept="video/mp4,video/webm" hidden><button type="button" class="btn btn-line btn-sm" id="cf-vdb">${p.video_url ? "Trocar" : "Enviar"} vídeo</button>${p.video_url ? `<button type="button" class="btn btn-line btn-sm" id="cf-vdx">Remover vídeo</button>` : ""}</div></div>
      <small class="hint">Use fotos reais e consistentes (mesma luz e fundo). Sem mídia, o app mostra um espaço elegante de “Mídia pendente”.</small></div>
    <div class="field full"><label>Passo a passo</label><div id="cf-ps">${S.map(passoHtml).join("")}</div><button type="button" class="btn btn-line btn-sm" id="cf-padd">+ Adicionar passo</button></div>
    <label class="field xf-chk"><input type="checkbox" id="cf-de" ${p.destaque ? "checked" : ""}> Destaque</label>
    <div class="field"><label for="cf-st">Status</label><select class="input" id="cf-st">${Object.entries(CB_ST).map(([k, [n]]) => `<option value="${k}" ${p.status === k ? "selected" : ""}>${n}</option>`).join("")}</select></div>
  </div><div id="cf-msg"></div><div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Cancelar</button>${ed ? `<button class="btn btn-accent" id="cf-ok">Salvar penteado</button>` : ""}</div>`);
  $("mbox").classList.add("mbox-wide");
  ["cf-t", "cf-c", "cf-tr", "cf-a"].forEach(g => $(g).querySelectorAll("[data-v]").forEach(b => b.onclick = () => b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true")));
  $("cf-n").oninput = () => { if(!id || duplicar) $("cf-s").value = cbSlug($("cf-n").value); };
  const lePassos = () => [...$("cf-ps").querySelectorAll(".cb-passo")].map((el, i) => ({ ...(S[+el.dataset.i] || {}), numero: i + 1, titulo: el.querySelector('[data-pt="titulo"]').value.trim(), instrucao: el.querySelector('[data-pt="instrucao"]').value.trim(), vista: el.querySelector('[data-pt="vista"]').value, _i: +el.dataset.i }));
  const desenhaPassos = () => { const atual = lePassos(); S = atual.map(x => { const { _i, ...r } = x; if(M.passos[_i]) M.passos["n" + x.numero] = M.passos[_i]; return r; }); const nm = {}; Object.keys(M.passos).filter(k => k[0] === "n").forEach(k => nm[+k.slice(1) - 1] = M.passos[k]); M.passos = nm; $("cf-ps").innerHTML = S.map(passoHtml).join(""); ligaPassos(); };
  const ligaPassos = () => {
    $("cf-ps").querySelectorAll("[data-pp]").forEach(b => b.onclick = () => $("cf-ps").querySelector(`[data-pf="${b.dataset.pp}"]`).click());
    $("cf-ps").querySelectorAll("[data-pf]").forEach(inp => inp.onchange = async e => { const f = e.target.files[0]; if(!f) return; try{ const r = await cbImagem(f); M.passos[+inp.dataset.pf] = r; inp.closest(".cb-passo").querySelector(".cb-mini").innerHTML = `<img src="${r.url}" alt="">`; }catch(er){ toast(er.message); } });
    $("cf-ps").querySelectorAll("[data-px]").forEach(b => b.onclick = () => { S = lePassos().map(x => { const { _i, ...r } = x; return r; }); S[+b.dataset.px].midia = null; delete M.passos[+b.dataset.px]; $("cf-ps").innerHTML = S.map(passoHtml).join(""); ligaPassos(); });
    $("cf-ps").querySelectorAll("[data-prm]").forEach(b => b.onclick = () => { if($("cf-ps").children.length <= 1) return toast("Deixe pelo menos um passo"); b.closest(".cb-passo").remove(); desenhaPassos(); });
    $("cf-ps").querySelectorAll("[data-pup]").forEach(b => b.onclick = () => { const el = b.closest(".cb-passo"), ant = el.previousElementSibling; if(ant){ el.parentNode.insertBefore(el, ant); desenhaPassos(); } });
  };
  ligaPassos();
  $("cf-padd").onclick = () => { desenhaPassos(); if(S.length >= 12) return toast("Máximo de 12 passos"); S.push({ numero: S.length + 1, titulo: "", instrucao: "", midia: null, vista: "back" }); $("cf-ps").innerHTML = S.map(passoHtml).join(""); ligaPassos(); };
  const pega = (btn, inp, viewer, chave, fn) => { $(btn).onclick = () => $(inp).click(); $(inp).onchange = async e => { const f = e.target.files[0]; if(!f) return; try{ M[chave] = await fn(f); $(viewer).innerHTML = chave === "video" ? "Vídeo pronto ✓" : `<img src="${M[chave].url}" alt="">`; }catch(er){ toast(er.message); } }; };
  pega("cf-thb", "cf-thf", "cf-thv", "thumb", cbImagem); pega("cf-imb", "cf-imf", "cf-imv", "imagem", cbImagem); pega("cf-vdb", "cf-vdf", "cf-vdv", "video", cbVideo);
  const vx = $("cf-vdx"); if(vx) vx.onclick = () => { p.video_url = null; M.video = null; $("cf-vdv").textContent = "Sem vídeo"; vx.remove(); };
  const ok = $("cf-ok"); if(ok) ok.onclick = async () => {
    const passos = lePassos(), d = { nome: val("cf-n"), slug: cbSlug(val("cf-s") || val("cf-n")), descricao: val("cf-d") || null, tipos: cbLe("cf-t"), comprimentos: cbLe("cf-c"), treinos: cbLe("cf-tr"), minutos: Math.max(1, Math.min(60, +val("cf-m") || 2)), dificuldade: val("cf-di"), fixacao: val("cf-f"), acessorios: cbLe("cf-a"), ordem: +val("cf-o") || 100, destaque: $("cf-de").checked, status: val("cf-st") };
    const err = d.nome.length < 2 ? "Escreva o nome." : d.slug.length < 2 ? "Slug inválido." : !d.tipos.length ? "Escolha pelo menos um tipo de cabelo." : !d.comprimentos.length ? "Escolha pelo menos um comprimento." : !d.treinos.length ? "Escolha pelo menos um treino." : passos.some(x => x.instrucao.length < 2) ? "Escreva a instrução de todos os passos (ou remova o passo vazio)." : "";
    if(err){ $("cf-msg").innerHTML = `<div class="msg msg-bad">${err}</div>`; return; }
    ok.disabled = true; ok.textContent = "Salvando…";
    try{
      if(M.thumb) d.thumb = await cbSobe("thumb", M.thumb.bl, M.thumb.ext, M.thumb.mime); else d.thumb = p.thumb || null;
      if(M.imagem) d.imagem = await cbSobe("img", M.imagem.bl, M.imagem.ext, M.imagem.mime); else d.imagem = p.imagem || null;
      if(M.video) d.video_url = await cbSobe("video", M.video, M.video.type === "video/webm" ? "webm" : "mp4", M.video.type); else d.video_url = p.video_url || null;
      const salvo = id && !duplicar ? (await sq(SB2().from("penteados").update(d).eq("id", id).select()))[0] : (await sq(SB2().from("penteados").insert(d).select()))[0];
      const rows = [];
      for(const x of passos){ const nova = M.passos[x._i]; rows.push({ penteado_id: salvo.id, numero: x.numero, titulo: x.titulo || null, instrucao: x.instrucao, vista: x.vista, midia: nova ? await cbSobe("passo", nova.bl, nova.ext, nova.mime) : (x.midia || null) }); }
      await sq(SB2().from("penteado_passos").delete().eq("penteado_id", salvo.id));
      if(rows.length) await sq(SB2().from("penteado_passos").insert(rows));
      fechar(); toast(id && !duplicar ? "Penteado atualizado" : "Penteado criado"); cbLista();
    }catch(e){ ok.disabled = false; ok.textContent = "Salvar penteado"; $("cf-msg").innerHTML = `<div class="msg msg-bad">${/duplicate|unique/i.test(e.message || "") ? "Já existe um penteado com esse slug." : esc(e.message || "Não foi possível salvar")}</div>`; }
  };
}
/* várias fotos de uma vez: o nome do arquivo (ex.: rabo-alto.png) diz de qual penteado é */
function cbLote(){
  const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.accept = "image/jpeg,image/png,image/webp"; inp.style.display = "none"; document.body.appendChild(inp);
  inp.onchange = async () => { const fs = [...inp.files]; inp.remove(); if(!fs.length) return;
    if(!CB_L.length) try{ CB_L = await sq(SB2().from("penteados").select("id,nome,slug,status,tipos,comprimentos,treinos,minutos,thumb,imagem,video_url,destaque,ordem").order("ordem")); }catch(e){}
    const plano = fs.map(f => { const sl = cbSlug(f.name.replace(/\.[a-z0-9]+$/i, "").replace(/\s*\(\d+\)$/, "")); return { f, sl, p: CB_L.find(x => x.slug === sl) }; });
    modal("Enviar miniaturas em lote", `<p class="muted" style="margin:0">${plano.filter(x => x.p).length} de ${fs.length} fotos com penteado correspondente. A foto vira a miniatura (e a imagem principal, se o penteado ainda não tiver).</p>
      <div class="cb-lote" id="cb-lt">${plano.map((x, i) => `<div class="cb-li" data-i="${i}"><span>${esc(x.f.name)}</span><b class="${x.p ? "" : "bad"}">${x.p ? "→ " + esc(x.p.nome) : "sem penteado com esse nome"}</b><i>${x.p ? "aguardando" : ""}</i></div>`).join("")}</div>
      <div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Fechar</button>${plano.some(x => x.p) ? `<button class="btn btn-accent" id="cb-lt-ok">Enviar ${plano.filter(x => x.p).length} fotos</button>` : ""}</div>`);
    $("mbox").classList.add("mbox-wide");
    const ok = $("cb-lt-ok"); if(ok) ok.onclick = async () => { ok.disabled = true; let n = 0;
      for(const [i, x] of plano.entries()){ if(!x.p) continue; const st = $("cb-lt").querySelector(`[data-i="${i}"] i`); st.textContent = "enviando…";
        try{ const im = await cbImagem(x.f), url = await cbSobe("thumb", im.bl, im.ext, im.mime); const d = { thumb: url }; if(!x.p.imagem) d.imagem = url; await sq(SB2().from("penteados").update(d).eq("id", x.p.id)); x.p.thumb = url; st.textContent = "✓ pronto"; st.className = "ok"; n++; }
        catch(e){ st.textContent = "erro: " + (e.message || "").slice(0, 40); st.className = "bad"; } }
      ok.textContent = `${n} enviadas`; toast(`${n} miniaturas atualizadas`); cbLista(); };
  };
  inp.click();
}
VIEWS.cabelo = vCabelo;
/* Módulos do app: atalho para a liberação do Cabelo para Treinar */
const vModulosCb = vModulos; vModulos = function(){ vModulosCb(); const l = document.querySelector("#adm-main .mod-list"); if(!l || !SB2()) return;
  l.insertAdjacentHTML("beforeend", `<div class="mod-row" id="mod-cab"><span class="mod-ai">${aic("cabelo", 20)}</span><span class="mod-info"><b>Cabelo para Treinar</b><small>Penteados para cada treino. Tem estado próprio: Desativado, Beta ou Ativado.</small><small class="mod-st" id="mod-cab-st">…</small></span><span class="mod-acts"><button class="btn btn-line btn-sm" id="mod-cab-go">Gerenciar</button></span></div>`);
  $("mod-cab-go").onclick = () => ir("cabelo");
  SB2().rpc("admin_flag", { p_chave: "cabelo" }).then(r => { const e = $("mod-cab-st"); if(e) e.textContent = r.data ? CB_EST[r.data.estado][0] : "Rode o cabelo.sql"; }, () => {}); };
VIEWS.modulos = vModulos;
