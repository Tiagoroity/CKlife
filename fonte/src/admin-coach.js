/* ===================== Painel · ENGAJAMENTO & COACH =====================
   Visão geral (DAU/WAU/MAU, D1/D7/D30, recuperadas, avisos enviados/abertos, treinos depois do aviso, quem desligou),
   Mensagens (365+, editar, ligar/desligar, testar em mim), Automações (QUANDO / SE / AGUARDAR / AÇÃO),
   Inativas e segmentos (só contagens, nunca lista pessoal), Configurações (chave geral, limite por dia, silêncio).
   Tudo vem do banco. Sem número inventado: sem base, aparece "-". */
AIC.coach = '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="m17 3 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L14 5.3l2-.3z"/>';
SECOES.push(["coach", "Engajamento & Coach"]); MENU_NOME.coach = "Engajamento & Coach";
{ const g = MENU.find(m => m[0] === "Marketing"); if(g && !g[1].some(x => x[2].includes("coach"))) g[1].unshift(["Engajamento & Coach", "coach", ["coach"]]); }
{ const mmCo = montaMenu; montaMenu = function(){ try{ if(PERM && !PERM.total && PERM.coach == null && PERM.notificacoes) PERM.coach = PERM.notificacoes; }catch(e){} return mmCo.apply(this, arguments); }; }

let CO_ABA = "geral", CO_D = null, CO_M = null, CO_F = { cat: "", q: "", st: "" };
const CO_CAT = { bom_dia: "Bom dia", treino: "Treino", pre_treino: "Pré-treino", pos_treino: "Pós-treino", alimentacao: "Alimentação", hidratacao: "Hidratação", preguica: "Preguiça", humor: "Humor",
  segunda: "Segunda", sexta: "Sexta", fim_de_semana: "Fim de semana", recomeco: "Recomeço", ausencia_24h: "Ausência 24h", ausencia_48h: "Ausência 48h", ausencia_3d: "Ausência 3 dias",
  ausencia_5d: "Ausência 5 dias", ausencia_7d: "Ausência 7 dias", primeira_semana: "Primeira semana", primeiro_mes: "Primeiro mês", conquista: "Conquista", streak: "Sequência", comunidade: "Comunidade",
  autoestima: "Autoestima", disciplina: "Disciplina", motivacao: "Motivação", rotina_corrida: "Rotina corrida", treino_rapido: "Treino rápido", noite: "Noite", celebracao: "Celebração", voltou: "Voltou", faltou_voce: "Amiga, faltou você", coach_comunidade: "Post da Coach na comunidade" };
const CO_GAT = c => ({ pos_treino: "Comemorar treino", streak: "Comemorar treino (sequência)", celebracao: "Comemorar treino (marco)", voltou: "Voltou depois de pausa", ausencia_24h: "Faltou ontem",
  ausencia_48h: "Sumiu 2 dias", ausencia_3d: "Sumiu 3 dias", ausencia_5d: "Sumiu 5 dias", ausencia_7d: "Sumiu 7 dias", primeira_semana: "Primeira semana", primeiro_mes: "Um mês de CK Life",
  pre_treino: "Antes do horário", noite: "Fim de dia", comunidade: "Comunidade", faltou_voce: "Amiga, faltou você", coach_comunidade: "Post diário na comunidade", segunda: "Bom dia (segunda)", sexta: "Bom dia (sexta)", fim_de_semana: "Bom dia (fim de semana)" }[c]
  || (["bom_dia", "motivacao", "hidratacao", "autoestima", "treino_rapido", "disciplina", "alimentacao", "humor", "rotina_corrida", "treino", "preguica"].includes(c) ? "Bom dia (rodízio)" : "Reserva (manual)"));
const coPct = (a, b) => b ? Math.round(100 * a / b) + "%" : "-";
const coNome = c => CO_CAT[c] || c;

async function vCoach(){
  const ed = podeEditar("coach") || podeEditar("notificacoes") || PERM.total;
  $("adm-main").innerHTML = `<div class="head"><div><h1>Engajamento & Coach</h1><p class="muted">Carregando…</p></div></div>`;
  try{ const r = await SB2().rpc("admin_coach_resumo"); if(r.error) throw r.error; CO_D = r.data; if(!CO_D) throw new Error("sem acesso"); }
  catch(e){ $("adm-main").innerHTML = `<div class="head"><div><h1>Engajamento & Coach</h1><p class="muted">Ainda não ativado. Rode o SQL <b>coach.sql</b> no Supabase (SQL Editor) e abra esta tela de novo.</p></div></div>`; return; }
  const d = CO_D, c = d.config || {};
  const abas = [["geral", "Visão geral"], ["mensagens", "Mensagens"], ["auto", "Automações"], ["inativas", "Inativas e segmentos"], ["coletivo", "Desafio coletivo"], ["config", "Configurações"]];
  const atalhos = [["notificacoes", "Notificações (Central)"], ["comunidade", "Comunidade"], ["equipe", "Time de Incentivo"], ["figurinhas", "Conquistas e figurinhas"], ["numeros", "Números do negócio"]].filter(([k]) => VIEWS[k] && podeVer(k));
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Engajamento & Coach</h1><p class="muted">A Coach CK Life é virtual e nunca finge ser uma pessoa. O servidor manda <b>no máximo ${int(c.max_dia)} recados por dia</b> para cada aluna (contando os lembretes), respeita o horário de silêncio e as preferências dela, e nunca usa ciclo, peso ou saúde.</p></div>
      <div class="toolbar"><span class="co-st ${c.ligado ? "on" : ""}">${c.ligado ? "Coach ligada" : "Coach desligada"}</span><button class="btn btn-line btn-sm" id="co-at">${aic("resumo", 15)} Atualizar</button></div></div>
    <div class="chips scroll seg-sub" id="co-abas">${abas.map(([k, n]) => `<button class="chip" data-co="${k}" aria-pressed="${CO_ABA === k}">${n}</button>`).join("")}</div>
    <div id="co-corpo"></div>
    ${atalhos.length ? `<div class="nb-sec">Outras áreas de engajamento</div><div class="co-atalhos">${atalhos.map(([k, n]) => `<button class="btn btn-line btn-sm" data-ir="${k}">${esc(n)} ${aic("chev", 14)}</button>`).join("")}</div>` : ""}`;
  $("co-at").onclick = () => { CO_M = null; vCoach(); };
  $("co-abas").querySelectorAll("[data-co]").forEach(b => b.onclick = () => { CO_ABA = b.dataset.co; $("co-abas").querySelectorAll("[data-co]").forEach(x => x.setAttribute("aria-pressed", x === b)); coAba(ed); });
  $("adm-main").querySelectorAll("[data-ir]").forEach(b => b.onclick = () => { const t = document.querySelector(`#adm-tabs [data-s="${b.dataset.ir}"]`); if(t) t.click(); else if(VIEWS[b.dataset.ir]) VIEWS[b.dataset.ir](); });
  coAba(ed);
}
function coAba(ed){
  const box = $("co-corpo"), d = CO_D, c = d.config || {};
  if(CO_ABA === "geral"){
    const pd = d.por_dia || [], mx = Math.max(1, ...pd.map(x => x.envios));
    box.innerHTML = `
      <div class="grid g4">${kpi("Ativas hoje (DAU)", int(d.dau), `${int(d.wau)} na semana · ${int(d.mau)} no mês`, "alunos", 1)}${kpi("Voltam no dia seguinte (D1)", coPct(d.d1.ok, d.d1.base), `base: ${int(d.d1.base)} cadastros`, "resumo")}${kpi("Voltam na 1ª semana (D7)", coPct(d.d7.ok, d.d7.base), `base: ${int(d.d7.base)}`, "resumo")}${kpi("Voltam no 1º mês (D30)", coPct(d.d30.ok, d.d30.base), `base: ${int(d.d30.base)}`, "resumo")}</div>
      <div class="grid g4">${kpi("Recados (30 dias)", int(d.envios), `${int(d.push)} no celular · ${int(d.push_ok)} entregues`, "coach")}${kpi("Abertos", coPct(d.abertos, d.envios), `${int(d.abertos)} recados abertos`, "notificacoes")}${kpi("Treinou depois", coPct(d.treinos_apos, d.envios), `${int(d.treinos_apos)} treinaram até o dia seguinte`, "treinos")}${kpi("Recuperadas", int(d.recuperadas), "voltaram a treinar até 3 dias depois do recado de ausência", "alunos")}</div>
      <div class="card"><h3 style="margin:0 0 10px">Recados por dia (14 dias)</h3>${pd.length ? `<div class="co-bars">${pd.map(x => `<div class="co-bar" title="${esc(x.dia)}: ${x.envios} enviados, ${x.abertos} abertos"><i style="height:${Math.round(100 * x.envios / mx)}%"><b style="height:${x.envios ? Math.round(100 * x.abertos / x.envios) : 0}%"></b></i><small>${esc(String(x.dia).slice(8, 10))}</small></div>`).join("")}</div><p class="hint" style="margin:8px 0 0"><span class="co-lg a"></span> enviados <span class="co-lg b"></span> abertos</p>` : `<p class="muted">Nenhum recado enviado ainda. O servidor começa a mandar no próximo ciclo (a cada 10 minutos).</p>`}</div>
      <div class="card"><h3 style="margin:0 0 10px">Por categoria (30 dias)</h3>${(d.por_categoria || []).length ? `<div class="nb-tbl-wrap"><table class="nb-tbl"><thead><tr><th>Categoria</th><th>Enviados</th><th>Abertos</th><th>Taxa</th></tr></thead><tbody>${d.por_categoria.map(x => `<tr><td>${esc(coNome(x.categoria))}</td><td class="num">${int(x.envios)}</td><td class="num">${int(x.abertos)}</td><td class="num">${coPct(x.abertos, x.envios)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Sem dados ainda.</p>`}</div>
      <div class="grid g4">${kpi("Desligaram a Coach", int(d.optout), "pausaram todos os recados", "seguranca")}${kpi("Sem treinos", int(d.optout_grupos.treino), "desligaram essa categoria", "treinos")}${kpi("Sem alimentação", int(d.optout_grupos.alimentacao), "desligaram essa categoria", "receitas")}${kpi("Sem comunidade", int(d.optout_grupos.comunidade), "desligaram essa categoria", "comunidade")}</div>
      <div class="card co-ab"><b>Testes A/B</b><small class="muted">Em breve: comparar duas versões de um recado e ver qual faz mais alunas treinarem.</small></div>`;
  } else if(CO_ABA === "mensagens"){ coMensagens(ed); }
  else if(CO_ABA === "auto"){
    const R = d.regras || [];
    box.innerHTML = `<p class="muted">Cada automação manda no máximo um recado por vez. Quando duas valem ao mesmo tempo, vale a de <b>menor número de prioridade</b> (a mais importante). O limite diário e o horário de silêncio sempre valem.</p>
      <div class="co-regras">${R.map(r => `<div class="card co-rg ${r.ativo ? "" : "off"}">
        <div class="co-rg-h"><b>${esc(r.nome)}</b><span class="co-pr">prioridade <input class="input num" type="number" min="1" max="999" value="${r.prioridade}" data-rp="${esc(r.id)}" ${ed ? "" : "disabled"} aria-label="Prioridade de ${esc(r.nome)}"></span>
          <button class="mod-sw ${ed ? "" : "needs-edit"}" role="switch" data-rg="${esc(r.id)}" aria-checked="${!!r.ativo}" aria-label="${r.ativo ? "Desligar" : "Ligar"} ${esc(r.nome)}"><i></i></button></div>
        <dl class="co-qsaa"><dt>QUANDO</dt><dd>${esc(r.quando)}</dd><dt>SE</dt><dd>${esc(r.se)}</dd><dt>AGUARDAR</dt><dd>${esc(r.aguardar)}</dd><dt>AÇÃO</dt><dd>${esc(r.acao)}</dd></dl></div>`).join("")}</div>`;
    box.querySelectorAll("[data-rg]").forEach(b => b.onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso"); const on = b.getAttribute("aria-checked") !== "true";
      try{ const r = await SB2().rpc("admin_coach_regra", { p_id: b.dataset.rg, p_ativo: on, p_prioridade: null }); if(r.error) throw r.error; b.setAttribute("aria-checked", on); b.closest(".co-rg").classList.toggle("off", !on); const x = R.find(y => y.id === b.dataset.rg); if(x) x.ativo = on; toast(on ? "Automação ligada" : "Automação desligada"); }catch(e){ toast("Não deu: " + (e.message || e)); } });
    box.querySelectorAll("[data-rp]").forEach(i => i.onchange = async () => { if(!ed) return; const v = Math.max(1, Math.min(999, +i.value || 50));
      try{ const r = await SB2().rpc("admin_coach_regra", { p_id: i.dataset.rp, p_ativo: null, p_prioridade: v }); if(r.error) throw r.error; toast("Prioridade salva"); }catch(e){ toast("Não deu: " + (e.message || e)); } });
  } else if(CO_ABA === "inativas"){
    const I = d.inativas || {}, tot = Math.max(1, d.total || 0);
    box.innerHTML = `<p class="muted">Só contagens. O painel não mostra a lista de quem sumiu nem dados pessoais: quem cuida delas é a Coach, com recados gentis e no máximo uma vez por pausa.</p>
      <div class="grid g4">${kpi("3 a 6 dias sem abrir", int(I.d3), coPct(I.d3, tot) + " das alunas", "alunos")}${kpi("7 a 13 dias", int(I.d7), coPct(I.d7, tot), "alunos")}${kpi("14 a 29 dias", int(I.d14), coPct(I.d14, tot), "alunos")}${kpi("30 dias ou mais", int(I.d30), "a Coach para de chamar depois de 30 dias", "alunos")}</div>
      <div class="nb-sec">Segmentos</div>
      <div class="grid g4">${kpi("Total de alunas", int(d.total), "sem contar a equipe", "alunos")}${kpi("Novas (7 dias)", int(d.novas7), "recebem as dicas da primeira semana", "alunos")}${kpi("Ativas no mês", int(d.mau), coPct(d.mau, tot) + " do total", "alunos")}${kpi("Mensagens ativas", int(d.mensagens), "no banco de recados", "coach")}</div>`;
  } else if(CO_ABA === "coletivo"){ coColetivo(ed);
  } else if(CO_ABA === "config"){
    const hs = Array.from({ length: 24 }, (_, h) => h);
    box.innerHTML = `<div class="card eq-cfg">
      <div class="eq-cfg-l"><b>Chave geral da Coach</b><small>Desligada, o servidor não manda nenhum recado (os lembretes de treino continuam).</small></div>
      <button class="mod-sw ${ed ? "" : "needs-edit"}" role="switch" id="co-geral" aria-checked="${!!c.ligado}" aria-label="${c.ligado ? "Desligar" : "Ligar"} a Coach"><i></i></button>
      <div class="eq-cfg-f"><label>Recados por dia (máx.) <select class="input" id="co-max">${[0, 1, 2, 3].map(n => `<option value="${n}" ${n === c.max_dia ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label>Intervalo mínimo <select class="input" id="co-int">${[2, 3, 4, 6, 8].map(n => `<option value="${n}" ${n === c.intervalo_h ? "selected" : ""}>${n} horas</option>`).join("")}</select></label>
        <label>Silêncio das <select class="input" id="co-ini">${hs.map(h => `<option value="${h}" ${h === c.silencio_ini ? "selected" : ""}>${String(h).padStart(2, "0")}h</option>`).join("")}</select></label>
        <label>até <select class="input" id="co-fim">${hs.map(h => `<option value="${h}" ${h === c.silencio_fim ? "selected" : ""}>${String(h).padStart(2, "0")}h</option>`).join("")}</select></label>
        <button class="btn btn-accent btn-sm" id="co-salva">Salvar limites</button></div></div>
      <div class="card eq-cfg">
        <div class="eq-cfg-l"><b>Post diário da Coach na comunidade</b><small>Um post por dia do perfil oficial "Coach CK Life" (virtual, com selo), puxando conversa. Na segunda, mostra quantas mulheres compartilharam vitórias na semana (número real). Ela nunca responde ninguém.</small></div>
        <button class="mod-sw ${ed ? "" : "needs-edit"}" role="switch" id="co-post" aria-checked="${c.posts_comunidade !== false}" aria-label="Post diário da Coach"><i></i></button>
        <div class="eq-cfg-f"><label>Horário (Cuiabá) <select class="input" id="co-hp">${Array.from({ length: 16 }, (_, i) => i + 6).map(h => `<option value="${h}" ${h === (c.hora_post || 9) ? "selected" : ""}>${String(h).padStart(2, "0")}h</option>`).join("")}</select></label></div></div>
      <p class="hint">O horário vale no fuso de cada aluna. Cada aluna também pode escolher o próprio silêncio, até 3 recados por dia e desligar categorias em Perfil › Coach e avisos.</p>`;
    $("co-geral").onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso"); const liga = !c.ligado;
      const vai = async () => { try{ const r = await SB2().rpc("admin_coach_config", { p_ligado: liga, p_max: null, p_intervalo: null, p_ini: null, p_fim: null }); if(r.error) throw r.error; toast(liga ? "Coach ligada" : "Coach desligada"); vCoach(); }catch(e){ toast("Não deu: " + (e.message || e)); } };
      liga ? vai() : confirmar("Desligar a Coach? Nenhuma aluna vai receber recados até você ligar de novo.", vai); };
    const cp = async (lig, hora) => { if(!ed) return toast("Seu acesso não permite mudar isso"); try{ const r = await SB2().rpc("admin_coach_comunidade", { p_ligado: lig, p_hora: hora }); if(r.error) throw r.error; toast("Salvo"); vCoach(); }catch(e){ toast("Não deu: " + (e.message || e)); } };
    $("co-post").onclick = () => cp(c.posts_comunidade === false, null);
    $("co-hp").onchange = e => cp(null, +e.target.value);
    $("co-salva").onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso");
      try{ const r = await SB2().rpc("admin_coach_config", { p_ligado: null, p_max: +$("co-max").value, p_intervalo: +$("co-int").value, p_ini: +$("co-ini").value, p_fim: +$("co-fim").value }); if(r.error) throw r.error; toast("Salvo"); vCoach(); }catch(e){ toast("Não deu: " + (e.message || e)); } };
  }
}
async function coMensagens(ed){
  const box = $("co-corpo");
  if(!CO_M){ box.innerHTML = `<p class="muted">Carregando mensagens…</p>`; try{ const r = await SB2().rpc("admin_coach_mensagens"); if(r.error) throw r.error; CO_M = r.data || []; }catch(e){ box.innerHTML = `<p class="muted">Não deu para carregar: ${esc(e.message || e)}</p>`; return; } }
  const cats = [...new Set(CO_M.map(m => m.categoria))].sort((a, b) => coNome(a).localeCompare(coNome(b)));
  const q = CO_F.q.toLowerCase(), L = CO_M.filter(m => (!CO_F.cat || m.categoria === CO_F.cat) && (!CO_F.st || (CO_F.st === "on") === !!m.ativo) && (!q || (m.titulo + " " + m.texto).toLowerCase().includes(q)));
  box.innerHTML = `<div class="toolbar co-filtros"><select class="input" id="cm-cat" aria-label="Categoria"><option value="">Todas as categorias (${CO_M.length})</option>${cats.map(c => `<option value="${esc(c)}" ${c === CO_F.cat ? "selected" : ""}>${esc(coNome(c))} (${CO_M.filter(m => m.categoria === c).length})</option>`).join("")}</select>
      <select class="input" id="cm-st" aria-label="Status"><option value="">Ativas e pausadas</option><option value="on" ${CO_F.st === "on" ? "selected" : ""}>Só ativas</option><option value="off" ${CO_F.st === "off" ? "selected" : ""}>Só pausadas</option></select>
      <input class="input" id="cm-q" placeholder="Buscar no texto" value="${esc(CO_F.q)}">${ed ? `<button class="btn btn-accent btn-sm" id="cm-nova">+ Nova mensagem</button>` : ""}</div>
    <p class="hint">${L.length} ${L.length === 1 ? "mensagem" : "mensagens"}. Variáveis seguras: {primeiro_nome} {quantidade_treinos} {streak} {horario_treino} {dias_ativos} {ultima_atividade} {objetivo} {tempo_disponivel}</p>
    <div class="nb-tbl-wrap"><table class="nb-tbl co-tbl"><thead><tr><th>ID</th><th>Categoria</th><th>Texto</th><th>Tom</th><th>Gatilho</th><th>Prior.</th><th>Plano</th><th>Último envio</th><th>Uso</th><th>CTR</th><th>Conversão</th><th>Status</th><th></th></tr></thead><tbody>
      ${L.slice(0, 400).map(m => `<tr class="${m.ativo ? "" : "off"}"><td class="num">${m.id}</td><td>${esc(coNome(m.categoria))}</td><td class="co-tx"><b>${esc(m.titulo)}</b><br>${esc(m.texto)}</td><td>${esc(m.tom)}</td><td>${esc(CO_GAT(m.categoria))}</td><td class="num">${m.prioridade}</td>
        <td>${m.plano === "todos" ? "Free e PRO" : m.plano === "pro" ? "PRO" : "Free"}</td><td>${m.ultimo ? new Date(m.ultimo).toLocaleDateString("pt-BR") : "-"}</td><td class="num">${int(m.uso)}</td><td class="num">${coPct(m.abertos, m.uso)}</td><td class="num">${coPct(m.treinou, m.uso)}</td>
        <td><button class="mod-sw ${ed ? "" : "needs-edit"}" role="switch" data-ma="${m.id}" aria-checked="${!!m.ativo}" aria-label="${m.ativo ? "Pausar" : "Ativar"} mensagem ${m.id}"><i></i></button></td>
        <td class="co-ac">${ed ? `<button class="btn btn-line btn-sm" data-me="${m.id}">Editar</button>` : ""}<button class="btn btn-line btn-sm" data-mt="${m.id}" title="Manda só para você">Testar em mim</button></td></tr>`).join("") || `<tr><td colspan="13" class="muted">Nada encontrado.</td></tr>`}</tbody></table></div>`;
  $("cm-cat").onchange = e => { CO_F.cat = e.target.value; coMensagens(ed); };
  $("cm-st").onchange = e => { CO_F.st = e.target.value; coMensagens(ed); };
  let tm; $("cm-q").oninput = e => { clearTimeout(tm); tm = setTimeout(() => { CO_F.q = e.target.value; coMensagens(ed); const i = $("cm-q"); if(i){ i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); };
  const nv = $("cm-nova"); if(nv) nv.onclick = () => coEdita(null, ed);
  box.querySelectorAll("[data-me]").forEach(b => b.onclick = () => coEdita(CO_M.find(m => m.id === +b.dataset.me), ed));
  box.querySelectorAll("[data-ma]").forEach(b => b.onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso"); const on = b.getAttribute("aria-checked") !== "true";
    try{ const r = await SB2().rpc("admin_coach_msg_ativo", { p_id: +b.dataset.ma, p_ativo: on }); if(r.error) throw r.error; const m = CO_M.find(x => x.id === +b.dataset.ma); if(m) m.ativo = on; b.setAttribute("aria-checked", on); b.closest("tr").classList.toggle("off", !on); toast(on ? "Mensagem ativa" : "Mensagem pausada"); }catch(e){ toast("Não deu: " + (e.message || e)); } });
  box.querySelectorAll("[data-mt]").forEach(b => b.onclick = async () => { try{ const r = await SB2().rpc("admin_coach_testar", { p_msg: +b.dataset.mt }); if(r.error) throw r.error; toast("Recado de teste enviado para você (veja no app, em Recados da Coach)"); }catch(e){ toast("Não deu: " + (e.message || e)); } });
}
function coEdita(m, ed){
  if(!ed) return toast("Seu acesso não permite mudar isso");
  const x = m || { categoria: CO_F.cat || "motivacao", titulo: "", texto: "", tom: "acolhedor", prioridade: 5, plano: "todos", ativo: true };
  modal(m ? `Editar mensagem ${m.id}` : "Nova mensagem", `<div class="form">
    <div class="field"><label for="ce-cat">Categoria</label><select class="input" id="ce-cat">${Object.entries(CO_CAT).map(([k, n]) => `<option value="${k}" ${k === x.categoria ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
    <div class="field"><label for="ce-ti">Título (aparece em negrito no aviso)</label><input class="input" id="ce-ti" maxlength="80" value="${esc(x.titulo)}"></div>
    <div class="field"><label for="ce-tx">Texto</label><textarea class="input" id="ce-tx" maxlength="240" rows="3">${esc(x.texto)}</textarea><small class="muted" id="ce-n"></small></div>
    <div class="row2"><div class="field"><label for="ce-tom">Tom</label><select class="input" id="ce-tom">${["acolhedor", "leve", "divertido", "firme e gentil", "celebração"].map(t => `<option ${t === x.tom ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label for="ce-pr">Prioridade (1 a 10)</label><input class="input num" id="ce-pr" type="number" min="1" max="10" value="${x.prioridade}"></div></div>
    <div class="row2"><div class="field"><label for="ce-pl">Para quem</label><select class="input" id="ce-pl"><option value="todos" ${x.plano === "todos" ? "selected" : ""}>Free e PRO</option><option value="free" ${x.plano === "free" ? "selected" : ""}>Só Free</option><option value="pro" ${x.plano === "pro" ? "selected" : ""}>Só PRO</option></select></div>
      <div class="field"><label for="ce-at">Status</label><select class="input" id="ce-at"><option value="1" ${x.ativo ? "selected" : ""}>Ativa</option><option value="0" ${x.ativo ? "" : "selected"}>Pausada</option></select></div></div>
    <div class="card co-prev"><small class="muted">Prévia no celular</small><b id="ce-pt"></b><span id="ce-px"></span></div>
    <p class="hint">Sem culpa, vergonha, comparação de corpo ou promessa de resultado. O servidor bloqueia palavras proibidas.</p>
    <div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Cancelar</button><button class="btn btn-accent" id="ce-ok">Salvar</button></div></div>`);
  const ex = { primeiro_nome: "Ana", quantidade_treinos: 12, streak: 4, horario_treino: "19:00", dias_ativos: 9, ultima_atividade: "20/10", objetivo: "ter mais disposição", tempo_disponivel: 15 };
  const rd = s => s.replace(/\{([a-z_]+)\}/g, (_, k) => ex[k] != null ? ex[k] : "");
  const prev = () => { $("ce-pt").textContent = rd($("ce-ti").value) || "Título"; $("ce-px").textContent = rd($("ce-tx").value) || "Texto do recado"; $("ce-n").textContent = `${$("ce-tx").value.length}/240`; };
  ["ce-ti", "ce-tx"].forEach(id => $(id).oninput = prev); prev();
  $("ce-ok").onclick = async () => { const ti = $("ce-ti").value.trim(), tx = $("ce-tx").value.trim(); if(!ti || tx.length < 3) return toast("Preencha o título e o texto");
    const b = $("ce-ok"); b.disabled = true;
    try{ const r = await SB2().rpc("admin_coach_msg_salvar", { p_id: m ? m.id : null, p_categoria: $("ce-cat").value, p_titulo: ti, p_texto: tx, p_tom: $("ce-tom").value, p_prioridade: Math.max(1, Math.min(10, +$("ce-pr").value || 5)), p_plano: $("ce-pl").value, p_ativo: $("ce-at").value === "1" });
      if(r.error) throw r.error; $("modal").hidden = true; document.body.style.overflow = ""; toast("Mensagem salva"); CO_M = null; coMensagens(ed); }
    catch(e){ b.disabled = false; toast(e.message || String(e)); } };
}
async function coColetivo(ed){
  const box = $("co-corpo"); box.innerHTML = `<p class="muted">Carregando…</p>`; let L = [];
  try{ const r = await SB2().rpc("admin_desafios_coletivos"); if(r.error) throw r.error; L = r.data || []; }catch(e){ box.innerHTML = `<p class="muted">Rode o SQL <b>inteligencia.sql</b> para ativar. (${esc(e.message || e)})</p>`; return; }
  box.innerHTML = `<p class="muted">Meta de minutos de movimento somados pela comunidade. O total vem dos treinos reais registrados no período (nada estimado). Só um desafio ativo aparece por vez no app.</p>
    ${ed ? `<button class="btn btn-accent btn-sm" id="dc-novo">+ Novo desafio coletivo</button>` : ""}
    <div class="co-regras" style="margin-top:12px">${L.map(d => `<div class="card co-rg ${d.ativo ? "" : "off"}"><div class="co-rg-h"><b>${esc(d.titulo)}</b><button class="mod-sw ${ed ? "" : "needs-edit"}" role="switch" data-dca="${d.id}" aria-checked="${!!d.ativo}" aria-label="Ativar desafio"><i></i></button></div>
      <small>${brD(d.ini)} a ${brD(d.fim)}</small><span class="bar"><i style="width:${Math.min(100, Math.round(100 * d.total / Math.max(1, d.meta)))}%"></i></span><small class="num">${int(d.total)} / ${int(d.meta)} minutos</small></div>`).join("") || `<p class="muted">Nenhum desafio coletivo ainda.</p>`}</div>`;
  const nv = $("dc-novo"); if(nv) nv.onclick = () => { const hj = today();
    modal("Novo desafio coletivo", `<div class="form"><div class="field"><label for="dc-t">Título</label><input class="input" id="dc-t" maxlength="80" value="100.000 minutos de movimento"></div>
      <div class="row2"><div class="field"><label for="dc-m">Meta (minutos)</label><input class="input num" id="dc-m" value="100000"></div><div class="field"><label for="dc-i">Início</label><input class="input" type="date" id="dc-i" value="${hj}"></div></div>
      <div class="field"><label for="dc-f">Fim</label><input class="input" type="date" id="dc-f" value="${addD(hj, 30)}"></div>
      <div class="toolbar" style="justify-content:flex-end"><button class="btn btn-line" data-close>Cancelar</button><button class="btn btn-accent" id="dc-ok">Criar</button></div></div>`);
    $("dc-ok").onclick = async () => { try{ const r = await SB2().rpc("admin_desafio_coletivo", { p_id: null, p_titulo: $("dc-t").value, p_meta: +$("dc-m").value, p_ini: $("dc-i").value, p_fim: $("dc-f").value, p_ativo: true }); if(r.error) throw r.error; $("modal").hidden = true; document.body.style.overflow = ""; toast("Desafio criado"); coColetivo(ed); }catch(e){ toast(e.message || String(e)); } }; };
  box.querySelectorAll("[data-dca]").forEach(b => b.onclick = async () => { if(!ed) return toast("Seu acesso não permite mudar isso"); const on = b.getAttribute("aria-checked") !== "true";
    try{ const r = await SB2().rpc("admin_desafio_coletivo", { p_id: b.dataset.dca, p_titulo: null, p_meta: null, p_ini: null, p_fim: null, p_ativo: on }); if(r.error) throw r.error; toast(on ? "Desafio ativado" : "Desafio pausado"); coColetivo(ed); }catch(e){ toast(e.message || String(e)); } });
}
VIEWS.coach = vCoach;
