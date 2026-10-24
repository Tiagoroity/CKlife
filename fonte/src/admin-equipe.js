/* ===================== Painel · TIME DE INCENTIVO CK =====================
   Perfis oficiais da equipe (com selo), que comentam 1 vez por post, curtem e reagem a Stories, só coisas boas.
   Aqui: chave geral, horário, limites por dia, liga/desliga uma por uma e o histórico de tudo que fizeram. */
AIC.equipe = '<path d="M12 2l2.4 1.8 3-.4 1.2 2.8 2.8 1.2-.4 3L22.8 12l-1.8 2.4.4 3-2.8 1.2-1.2 2.8-3-.4L12 22.8l-2.4-1.8-3 .4-1.2-2.8-2.8-1.2.4-3L1.2 12 3 9.6l-.4-3 2.8-1.2L6.6 2.6l3 .4z"/><path d="M12 16s-4-2.4-4-5.1a2.1 2.1 0 0 1 4-1 2.1 2.1 0 0 1 4 1C16 13.6 12 16 12 16z"/>';
SECOES.push(["equipe", "Time de Incentivo"]); MENU_NOME.equipe = "Time de Incentivo";
MENU.forEach(([, gs]) => gs.forEach(g => { if(g[1] === "comunidade" && !g[2].includes("equipe")) g[2].push("equipe"); }));
{ const mmEq = montaMenu; montaMenu = function(){ try{ if(PERM && !PERM.total && PERM.equipe == null && PERM.comunidade) PERM.equipe = PERM.comunidade; }catch(e){} return mmEq.apply(this, arguments); }; }
let EQD = null;
const eqHora = h => String(h).padStart(2, "0") + "h";
const eqAcao = { comentou: "comentou", curtiu: "curtiu", story: "reagiu ❤️ ao Story" };
async function vEquipe(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Time de Incentivo</h1><p class="muted">Carregando…</p></div></div>`;
  try{ const r = await SB2().rpc("admin_equipe"); if(r.error) throw r.error; EQD = r.data; }
  catch(e){ $("adm-main").innerHTML = `<div class="head"><div><h1>Time de Incentivo</h1><p class="muted">Ainda não ativado. Rode o SQL <b>equipe.sql</b> no Supabase (SQL Editor) e abra esta tela de novo.</p></div></div>`; return; }
  const d = EQD, c = d.config || {}, M = d.membros || [], ativas = M.filter(m => m.ativo).length, ed = podeEditar("equipe") || podeEditar("comunidade") || PERM.total;
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Time de Incentivo</h1><p class="muted">Perfis oficiais da equipe, com selo. Cada post de aluna recebe <b>no máximo 1 comentário</b> da equipe, só com frases de incentivo. Elas curtem, reagem com ❤️ aos Stories, <b>nunca respondem, nunca mandam mensagem e não avaliam</b> produtos ou profissionais. Não têm login nem acesso ao painel.</p></div>
      <div class="toolbar"><button class="btn btn-line btn-sm" id="eq-at">${aic("resumo", 15)} Atualizar</button></div></div>
    <div class="grid g4">${kpi("Situação", c.ligado ? "Ligado" : "Desligado", `${eqHora(c.hora_ini)} às ${eqHora(c.hora_fim)} (Cuiabá)`, "equipe", 1)}${kpi("Comentários (24h)", int(d.hoje.comentarios), "1 por post, no máximo", "comunidade")}${kpi("Curtidas (24h)", int(d.hoje.curtidas), `${int(d.hoje.stories)} reações a Stories`, "comunidade")}${kpi("Perfis ligados", `${ativas} de ${M.length}`, "desligue quem quiser", "alunos")}</div>
    <div class="card eq-cfg">
      <div class="eq-cfg-l"><b>Chave geral</b><small>Desligada, nenhum perfil da equipe age.</small></div>
      <button class="mod-sw ${ed ? "" : "needs-edit"}" role="switch" id="eq-geral" aria-checked="${!!c.ligado}" aria-label="${c.ligado ? "Desligar" : "Ligar"} o Time de Incentivo"><i></i></button>
      <div class="eq-cfg-f"><label>Das <select class="input" id="eq-ini">${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === c.hora_ini ? "selected" : ""}>${eqHora(h)}</option>`).join("")}</select></label>
        <label>até <select class="input" id="eq-fim">${Array.from({ length: 24 }, (_, i) => i + 1).map(h => `<option value="${h}" ${h === c.hora_fim ? "selected" : ""}>${eqHora(h)}</option>`).join("")}</select></label>
        <label>Comentários por perfil/dia <input class="input" id="eq-mc" type="number" min="0" max="100" value="${c.max_coment_dia}"></label>
        <label>Curtidas por perfil/dia <input class="input" id="eq-mk" type="number" min="0" max="300" value="${c.max_curt_dia}"></label>
        <button class="btn btn-accent btn-sm" id="eq-salva">Salvar horário e limites</button></div></div>
    <div class="nb-sec">Perfis da equipe (${M.length})</div>
    <div class="card eq-lista">${M.map(m => `<div class="eq-m ${m.ativo ? "" : "off"}"><span class="eq-av">${esc((m.nome || "?")[0])}</span><span class="eq-n"><b>${esc(m.nome)}</b><small>@${esc(m.username || "")} · 24h: ${int(m.coment_24h)} coment. · ${int(m.curt_24h)} curt. · total ${int(m.total)}</small></span>
      <button class="mod-sw" role="switch" data-eq="${m.user_id}" aria-checked="${!!m.ativo}" aria-label="${m.ativo ? "Desligar" : "Ligar"} ${esc(m.nome)}"><i></i></button></div>`).join("") || `<p class="muted">Nenhum perfil criado.</p>`}</div>
    <div class="nb-sec">Histórico (últimas 60 ações)</div>
    <div class="card eq-log">${(d.log || []).map(l => `<div class="eq-l"><span class="num">${new Date(l.criado).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span><span><b>${esc(l.nome || "")}</b> ${eqAcao[l.acao] || esc(l.acao)}${l.texto && l.acao === "comentou" ? `: “${esc(l.texto)}”` : ""}</span></div>`).join("") || `<p class="muted">Nada ainda. A equipe age a cada 5 minutos, no horário escolhido, em posts e Stories de alunas reais.</p>`}</div>`;
  $("eq-at").onclick = vEquipe;
  $("eq-geral").onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso"); const liga = !c.ligado;
    const vai = async () => { try{ const r = await SB2().rpc("admin_equipe_config", { p_ligado: liga, p_ini: null, p_fim: null, p_coment: null, p_curt: null }); if(r.error) throw r.error; toast(liga ? "Time de Incentivo ligado" : "Time de Incentivo desligado"); vEquipe(); }catch(e){ toast("Não deu: " + (e.message || e)); } };
    liga ? vai() : confirmar("Desligar o Time de Incentivo? Nenhum perfil da equipe vai agir até você ligar de novo.", vai); };
  $("eq-salva").onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso"); const ini = +$("eq-ini").value, fim = +$("eq-fim").value;
    if(fim <= ini) return toast("O horário final precisa ser depois do inicial");
    try{ const r = await SB2().rpc("admin_equipe_config", { p_ligado: null, p_ini: ini, p_fim: fim, p_coment: Math.max(0, Math.min(100, +$("eq-mc").value || 0)), p_curt: Math.max(0, Math.min(300, +$("eq-mk").value || 0)) }); if(r.error) throw r.error; toast("Salvo"); vEquipe(); }catch(e){ toast("Não deu: " + (e.message || e)); } };
  $("adm-main").querySelectorAll("[data-eq]").forEach(b => b.onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso"); const on = b.getAttribute("aria-checked") !== "true";
    try{ const r = await SB2().rpc("admin_equipe_membro", { p_user: b.dataset.eq, p_ativo: on }); if(r.error) throw r.error; b.setAttribute("aria-checked", on); b.closest(".eq-m").classList.toggle("off", !on); toast(on ? "Perfil ligado" : "Perfil desligado"); }catch(e){ toast("Não deu: " + (e.message || e)); } });
}
VIEWS.equipe = vEquipe;
