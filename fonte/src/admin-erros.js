/* ===================== Painel · Erros no app das alunas (últimos 7 dias) =====================
   Mostra os erros que aconteceram no celular das alunas, agrupados, sem nome nem e-mail.
   Sem o primeiros-passos.sql, o cartão simplesmente não aparece. */
let ER_L = null;
const ER_K = "ck_erros_vistos";
const erVistos = () => { try{ return JSON.parse(localStorage.getItem(ER_K) || "{}") || {}; }catch(e){ return {}; } };
const erVisto = x => { const v = erVistos()[x.msg]; return !!v && String(v) >= String(x.ultimo); };   // volta a aparecer se acontecer de novo
const erMarca = L => { try{ const v = erVistos(); L.forEach(x => v[x.msg] = x.ultimo); localStorage.setItem(ER_K, JSON.stringify(v)); }catch(e){} };
const erSB = () => F.nuvem && F.nuvem.ativo && F.nuvem.sb;
const erQuando = s => { try{ const d = new Date(s), m = Math.round((Date.now() - d) / 6e4); return m < 60 ? `há ${Math.max(1, m)} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); }catch(e){ return ""; } };
function erPinta(){
  const main = $("adm-main"); if(!main || ER_L == null) return;
  const h = main.querySelector(".head"); if(!h) return;
  let box = $("er-app"); if(!box){ (main.querySelector("#av-nova") || h).insertAdjacentHTML("afterend", `<div class="card" id="er-app" style="margin-bottom:14px"></div>`); box = $("er-app"); }
  const L = ER_L.filter(x => !erVisto(x)), tot = L.reduce((s, x) => s + (+x.vezes || 0), 0);
  if(!L.length){ const b = $("er-app"); if(b) b.remove(); return; }
  box.innerHTML = `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:22px" aria-hidden="true">🛠️</span><div style="flex:1;min-width:200px"><b>Erros no app das alunas</b><br><small class="muted">${L.length ? `${int(tot)} erro${tot > 1 ? "s" : ""} em ${L.length} tipo${L.length > 1 ? "s" : ""} nos últimos 7 dias. Sem nome nem e-mail.` : "Nenhum erro nos últimos 7 dias 💚"}</small></div></div>
    ${L.length ? `<div class="er-lista">${L.slice(0, 8).map((x, i) => `<div class="er-row"><div style="display:flex;gap:8px;align-items:flex-start"><code style="flex:1">${esc(x.msg)}</code><button class="btn btn-line btn-sm" data-erok="${i}">OK, já vi</button></div><small class="muted">${int(x.vezes)}× · ${int(x.alunas)} aluna${+x.alunas > 1 ? "s" : ""} · ${[+x.iphone ? `iPhone ${int(x.iphone)}` : "", +x.android ? `Android ${int(x.android)}` : "", +x.outros ? `outros ${int(x.outros)}` : ""].filter(Boolean).join(" · ")}${x.onde ? ` · tela: ${esc(x.onde)}` : ""} · ${esc(erQuando(x.ultimo))}</small></div>`).join("")}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap"><p class="hint" style="margin:0">Mandou para análise? Toque em "OK, já vi" e ele some. Se acontecer de novo, volta a aparecer.</p><button class="btn btn-accent btn-sm" id="er-tudo">OK em todos</button></div>` : ""}`;
  box.querySelectorAll("[data-erok]").forEach(b => b.onclick = () => { erMarca([L[+b.dataset.erok]]); erPinta(); });
  const td = $("er-tudo"); if(td) td.onclick = () => { erMarca(L); erPinta(); };
}
async function erMostra(){ const sb = erSB(); if(!sb) return; try{ const r = await sb.rpc("admin_erros", { p_dias: 7 }); if(r.error) throw r.error; ER_L = r.data || []; }catch(e){ ER_L = null; const b = $("er-app"); if(b) b.remove(); return; } erPinta(); }
{ const v0 = VIEWS.resumo; if(v0) VIEWS.resumo = function(){ const r = v0.apply(this, arguments); setTimeout(erMostra, 50); setTimeout(() => { if(!$("er-app") && ER_L) erPinta(); }, 1400); return r; }; }
