/* ===================== NOTIFICAÇÕES: som do CK Life e lembrete de treino no servidor =====================
   Som: com o app aberto, toca a assinatura sonora do CK Life (sons.js > notif). Com o app fechado, o celular usa o som
   do sistema (Android/iPhone não deixam um site/PWA escolher o som da notificação); a vibração tem um ritmo próprio.
   Lembrete: fica salvo no banco (tabela lembretes) e o servidor envia ~20 min antes, mesmo com o app fechado. */
const SOMN_K = "cklife_som_notif";
const somNotifOn = () => { try{ return localStorage.getItem(SOMN_K) !== "0"; }catch(e){ return true; } };
const tocaNotif = () => { if(somNotifOn() && SOM.notif) SOM.notif(); };
/* todo aviso que aparece dentro do app toca o som do CK Life */
const avisoNt = aviso; aviso = function(){ tocaNotif(); vibra && vibra([60, 40, 60]); return avisoNt.apply(this, arguments); };
/* aviso que chegou pelo celular com o app aberto: mostra dentro do app (o do sistema vem sem som) */
if("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => { const d = e.data || {};
  if(d.tipo === "push-ao-vivo" && d.p) aviso(`<span class="pav nt-ic">${ic("bell", 16)}</span><span><b>${esc(d.p.title || "CK Life")}</b> ${esc(d.p.body || "")}</span>`, d.p.url && d.p.url !== "/" ? () => { try{ const u = new URL(d.p.url, location.origin); if(u.origin === location.origin) location.href = u.pathname + u.search; else window.open(u.href, "_blank", "noopener"); }catch(x){} } : null); });

/* ---------- Lembrete de treino (servidor) ---------- */
const fusoLocal = () => { try{ return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Cuiaba"; }catch(e){ return "America/Cuiaba"; } };
async function sincLembrete(L){
  if(!(NU.ativo && NU.sb && NU.uid)) return false;
  try{
    if(!L || !L.celular){ await q(SB().from("lembretes").delete().eq("user_id", NU.uid).eq("tipo", "treino")); return true; }
    await q(SB().from("lembretes").upsert({ user_id: NU.uid, tipo: "treino", hora: L.hora, dias: L.dias, antecedencia: L.antes ?? 20, fuso: fusoLocal(), ativo: true, pausado_ate: L.pulaAte || null }, { onConflict: "user_id,tipo" }));
    return true;
  }catch(e){ console.warn("lembrete", e); return false; }
}
editaLembrete = function(){
  const L = ME.lembrete || { dias: ["MO", "WE", "FR"], hora: "07:00", celular: true, antes: 20 }, cel = L.celular !== false, hojeK = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][new Date().getDay()];
  sheet("Lembrete de treino", `<p class="lead" style="margin:0">Escolha os dias e o horário do seu treino. A gente avisa no celular <b>20 minutos antes</b>, mesmo com o app fechado.</p>
    <div><h4 style="margin-bottom:10px">Dias</h4><div class="chips" id="lb-d">${DSEM.map(([k, n]) => `<button class="chip" data-d="${k}" aria-pressed="${L.dias.includes(k)}">${n}</button>`).join("")}</div></div>
    <div class="formgrid lb-g"><div class="field"><label for="lb-h">Horário do treino</label><input class="input" id="lb-h" type="time" value="${L.hora}"></div>
      <div class="field"><label for="lb-a">Avisar antes</label><select class="input" id="lb-a">${[10, 15, 20, 30, 45, 60].map(m => `<option value="${m}" ${(L.antes ?? 20) === m ? "selected" : ""}>${m} minutos</option>`).join("")}</select></div></div>
    <label class="lb-nav"><input type="checkbox" id="lb-c" ${cel ? "checked" : ""}> Avisar no celular (notificação do CK Life)</label>
    ${ME.lembrete && L.dias.includes(hojeK) ? `<label class="lb-nav"><input type="checkbox" id="lb-p" ${L.pulaAte === today() ? "checked" : ""}> Hoje não vou treinar (não avisar hoje)</label>` : ""}
    <button class="btn btn-accent btn-block btn-lg" id="lb-ok">${ic("bell", 18)} Salvar lembrete</button>
    <button class="btn btn-line btn-block" id="lb-cal">${ic("calendar", 18)} Também colocar no calendário do celular</button>
    ${ME.lembrete ? `<button class="link lb-off" id="lb-off">Desligar lembrete</button>` : ""}
    <p class="hint" style="margin:0">O aviso usa o fuso do seu celular (${esc(fusoLocal().replace(/_/g, " "))}). No iPhone, os avisos funcionam com o CK Life instalado na tela de início.</p>`);
  $("lb-d").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); SOM.tap(); });
  const ler = () => { const dias = [...$("lb-d").querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.d); return dias.length ? { dias, hora: $("lb-h").value || "07:00", antes: +$("lb-a").value || 20, celular: $("lb-c").checked, pulaAte: $("lb-p") && $("lb-p").checked ? today() : null } : null; };
  $("lb-ok").onclick = async () => {
    const n = ler(); if(!n) return toast("Escolha pelo menos um dia");
    ME.lembrete = { ...n, nav: false }; save();
    if(n.celular && !pushLigado()) await ativarNotificacoes();
    const ok = await sincLembrete(ME.lembrete); ME.lembrete.sinc = ok ? JSON.stringify(n) : null; save();
    SOM.chime && SOM.chime(); fecharSheet();
    toast(!n.celular ? "Lembrete salvo (sem aviso no celular)" : ok ? `Pronto! Aviso ${n.antes} min antes do treino` : "Lembrete salvo. O aviso no celular liga quando você estiver conectada.");
    if(TAB === "perfil") rPerfil(); else if(TAB === "inicio") rInicio();
  };
  $("lb-cal").onclick = async () => { const n = ler(); if(!n) return toast("Escolha pelo menos um dia");
    const blob = new Blob([icsLembrete(n.dias, n.hora)], { type: "text/calendar;charset=utf-8" }), file = new File([blob], "lembrete-ck-life.ics", { type: "text/calendar" });
    if(navigator.canShare && navigator.canShare({ files: [file] }) && /android/i.test(navigator.userAgent)) await navigator.share({ files: [file], title: "Lembrete CK Life" }).catch(() => {});
    else { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = "lembrete-ck-life.ics"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); }
    toast("Confirme no calendário do celular"); };
  const off = $("lb-off"); if(off) off.onclick = async () => { delete ME.lembrete; save(); await sincLembrete(null); fecharSheet(); toast("Lembrete desligado"); if(TAB === "perfil") rPerfil(); else if(TAB === "inicio") rInicio(); };
};
/* quem já tinha lembrete salvo só no aparelho passa a receber pelo servidor */
setTimeout(() => { const L = ME && ME.lembrete; if(!L || L.celular === false) return; const k = JSON.stringify({ dias: L.dias, hora: L.hora, antes: L.antes ?? 20, celular: true, pulaAte: L.pulaAte || null });
  if(L.sinc !== k && pushLigado()) sincLembrete({ ...L, celular: true }).then(ok => { if(ok){ L.celular = true; L.sinc = k; save(); } }); }, 12000);

/* ---------- Perfil: som das notificações ---------- */
const rPerfilNt = rPerfil; rPerfil = function(){ rPerfilNt.apply(this, arguments); const pp = $("p-push"); if(!pp || $("p-somn")) return;
  pp.insertAdjacentHTML("afterend", setRow("p-somn", "speaker", "Som do CK Life", somNotifOn() ? "Toque próprio nos avisos com o app aberto" : "Desligado", sw(somNotifOn())));
  $("p-somn").onclick = () => { const v = !somNotifOn(); try{ localStorage.setItem(SOMN_K, v ? "1" : "0"); }catch(e){} if(v) SOM.notif && SOM.notif(); rPerfil(); }; };

/* ---------- Ao tocar no aviso: abre a área certa do app ---------- */
const IR_TAB = { treino: "treinar", treinar: "treinar", agua: "dieta", refeicao: "dieta", dieta: "dieta", nutricao: "dieta", juntas: "juntas", comunidade: "juntas", explorar: "explorar", perfil: "perfil", inicio: "inicio", sistema: "inicio", evolucao: "evolucao" };
function irPorUrl(url){ try{ const u = new URL(url, location.origin), k = u.searchParams.get("ir") || u.searchParams.get("n"); const t = IR_TAB[k]; if(t && typeof tab === "function" && ME){ tab(t); return true; } }catch(e){} return false; }
if("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => { if(e.data && e.data.tipo === "push") irPorUrl(e.data.url); });
{ let n = 0; const t = setInterval(() => { if(ME && !$("v-app").hidden){ clearInterval(t); if(/[?&](ir|n)=/.test(location.search) && irPorUrl(location.href)) history.replaceState(null, "", location.pathname + location.hash); } else if(++n > 40) clearInterval(t); }, 500); }

/* notificação da Central na lista do app: abre o produto/compra (link) ou a área do app */
const abreNotificacaoNt = abreNotificacao; abreNotificacao = async function(n){
  if(n && n.tipo === "sistema" && n.link){ if(/^https:\/\//.test(n.link)){ window.open(n.link, "_blank", "noopener"); return; } if(irPorUrl(n.link)){ fecharSheet && fecharSheet(); return; } }
  return abreNotificacaoNt.apply(this, arguments);
};
