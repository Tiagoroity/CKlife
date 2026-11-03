/* ===================== Painel · Tarefas de hoje =====================
   Uma lista só, no topo do Dashboard, com quem chamar hoje no WhatsApp (mensagem pronta).
   Cada aluna aparece em um grupo só (o mais importante). Tocou no 💬 ou em ✓, ela sai da lista de hoje.
   Não muda nada no resto do painel. */
const TAR_K = "ck_tarefas_feitas";
const tarFeitas = () => { try{ const o = JSON.parse(localStorage.getItem(TAR_K) || "{}"); return new Set(o[today()] || []); }catch(e){ return new Set(); } };
const tarMarca = id => { try{ const s = tarFeitas(); s.add(id); localStorage.setItem(TAR_K, JSON.stringify({ [today()]: [...s] })); }catch(e){} };
const TAR_GRUPOS = [
  ["novas", "🌱", "Chegaram e ainda não treinaram", "Mande a boas-vindas e o treino de 5 min."],
  ["teste", "⏳", "Teste grátis acabando", "Hora de lembrar do Pro, com carinho."],
  ["app", "📲", "Não instalaram o app", "Mande o passo a passo de instalar."],
  ["sumiu", "💚", "Sumiram há alguns dias", "Convite leve para voltar, sem cobrança."]
];
function tarLista(){
  const feitas = tarFeitas(), G = { novas: [], teste: [], app: [], sumiu: [] };
  DB().users.filter(u => !u.admin && !u.soAdmin && !u.exemplo && !ehTeste(u) && !feitas.has(u.id) && zDig(u.whats).length >= 10).forEach(u => {
    const T = (u.treinos || []).filter(t => t && t.d), n = T.length, cad = zDias(u.criado), f = zFase(u);
    const ult = n ? T.map(t => t.d).sort().pop() : null;
    if(n === 0 && cad >= 0 && cad <= 7) G.novas.push([u, cad <= 1 ? "m1" : "m2"]);
    else if(f === "m4") G.teste.push([u, "m4"]);
    else if(!zApp(u) && cad <= 14) G.app.push([u, "m9"]);
    else if(n > 0 && zDias(ult) >= 3 && zDias(ult) <= 14) G.sumiu.push([u, "m7"]);
  });
  Object.keys(G).forEach(k => { G[k] = ordenaAlunas(G[k].map(x => x[0]), "recentes").map(u => G[k].find(x => x[0] === u)); });
  return G;
}
let TAR_ABERTO = {};
function tarPinta(){
  const main = $("adm-main"); if(!main || SEC !== "resumo") return;
  const h = main.querySelector(".head"); if(!h) return;
  const old = $("tar-box"); if(old) old.remove();
  const G = tarLista(), tot = Object.values(G).reduce((s, L) => s + L.length, 0);
  const linha = ([u, k]) => `<div class="zq-row"><div class="zq-t"><b>${esc(u.nome || u.email)}</b><small>chegou ${esc(quandoChegou(u))}${(u.treinos || []).length ? ` · ${int((u.treinos || []).length)} treino${(u.treinos || []).length > 1 ? "s" : ""}` : ""}</small></div>
    <button class="btn btn-sm zap-bt" data-tz="${u.id}" data-tk="${k}" aria-label="Mandar mensagem no WhatsApp">💬</button><button class="btn btn-sm btn-line tar-ok" data-tf="${u.id}" aria-label="Marcar como feito">✓</button></div>`;
  h.insertAdjacentHTML("afterend", `<div class="card tar-card" id="tar-box"><div class="tar-h"><div><b>✅ Tarefas de hoje</b><small class="muted">${tot ? `${int(tot)} aluna${tot > 1 ? "s" : ""} para chamar hoje · a mensagem já vai pronta` : "Tudo em dia por hoje 💚"}</small></div></div>
    ${TAR_GRUPOS.filter(([k]) => G[k].length).map(([k, e, t, d]) => `<details class="tar-g" data-g="${k}" ${TAR_ABERTO[k] ? "open" : ""}><summary><span class="tar-e">${e}</span><span class="tar-tt"><b>${t}</b><small>${d}</small></span><span class="tar-n">${int(G[k].length)}</span></summary>
      <div class="zq-lista">${G[k].slice(0, 40).map(linha).join("")}</div>${G[k].length > 40 ? `<p class="muted" style="margin:6px 0 0">Mostrando as 40 mais recentes.</p>` : ""}</details>`).join("")}</div>`);
  const box = $("tar-box");
  box.querySelectorAll(".tar-g").forEach(d => d.ontoggle = () => { TAR_ABERTO[d.dataset.g] = d.open; });
  box.querySelectorAll("[data-tz]").forEach(b => b.onclick = () => { const u = DB().users.find(x => x.id === b.dataset.tz); const url = u && zLink(u, b.dataset.tk); if(url) window.open(url, "_blank", "noopener"); tarMarca(b.dataset.tz); setTimeout(tarPinta, 400); });
  box.querySelectorAll("[data-tf]").forEach(b => b.onclick = () => { tarMarca(b.dataset.tf); tarPinta(); });
}
{ const v0 = VIEWS.resumo; if(v0) VIEWS.resumo = function(){ const r = v0.apply(this, arguments); setTimeout(tarPinta, 60); return r; }; }
