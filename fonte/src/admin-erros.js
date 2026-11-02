/* ===================== Painel · Erros no app das alunas (últimos 7 dias) =====================
   Mostra os erros que aconteceram no celular das alunas, agrupados, sem nome nem e-mail.
   Sem o primeiros-passos.sql, o cartão simplesmente não aparece. */
let ER_L = null;
const erSB = () => F.nuvem && F.nuvem.ativo && F.nuvem.sb;
const erQuando = s => { try{ const d = new Date(s), m = Math.round((Date.now() - d) / 6e4); return m < 60 ? `há ${Math.max(1, m)} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); }catch(e){ return ""; } };
function erPinta(){
  const main = $("adm-main"); if(!main || ER_L == null) return;
  const h = main.querySelector(".head"); if(!h) return;
  let box = $("er-app"); if(!box){ (main.querySelector("#av-nova") || h).insertAdjacentHTML("afterend", `<div class="card" id="er-app" style="margin-bottom:14px"></div>`); box = $("er-app"); }
  const L = ER_L, tot = L.reduce((s, x) => s + (+x.vezes || 0), 0);
  box.innerHTML = `<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:22px" aria-hidden="true">🛠️</span><div style="flex:1;min-width:200px"><b>Erros no app das alunas</b><br><small class="muted">${L.length ? `${int(tot)} erro${tot > 1 ? "s" : ""} em ${L.length} tipo${L.length > 1 ? "s" : ""} nos últimos 7 dias. Sem nome nem e-mail.` : "Nenhum erro nos últimos 7 dias 💚"}</small></div></div>
    ${L.length ? `<div class="er-lista">${L.slice(0, 8).map(x => `<div class="er-row"><code>${esc(x.msg)}</code><small class="muted">${int(x.vezes)}× · ${int(x.alunas)} aluna${+x.alunas > 1 ? "s" : ""} · ${[+x.iphone ? `iPhone ${int(x.iphone)}` : "", +x.android ? `Android ${int(x.android)}` : "", +x.outros ? `outros ${int(x.outros)}` : ""].filter(Boolean).join(" · ")}${x.onde ? ` · tela: ${esc(x.onde)}` : ""} · ${esc(erQuando(x.ultimo))}</small></div>`).join("")}</div>
      <p class="hint" style="margin:8px 0 0">Mande um print desta lista para o suporte técnico corrigir.</p>` : ""}`;
}
async function erMostra(){ const sb = erSB(); if(!sb) return; try{ const r = await sb.rpc("admin_erros", { p_dias: 7 }); if(r.error) throw r.error; ER_L = r.data || []; }catch(e){ ER_L = null; const b = $("er-app"); if(b) b.remove(); return; } erPinta(); }
{ const v0 = VIEWS.resumo; if(v0) VIEWS.resumo = function(){ const r = v0.apply(this, arguments); setTimeout(erMostra, 50); setTimeout(() => { if(!$("er-app") && ER_L) erPinta(); }, 1400); return r; }; }
