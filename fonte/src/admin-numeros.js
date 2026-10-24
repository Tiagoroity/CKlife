/* ===================== Painel · NÚMEROS DO NEGÓCIO =====================
   Retenção, turmas por semana de cadastro, funil, dinheiro e ativas por dia.
   Tudo calculado com dados reais que o painel já recebe (usuárias, acessos, treinos, planos e vendas da Kiwify).
   Nada é estimado ou inventado; quando não há base suficiente aparece "-". */
AIC.numeros = '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>';
SECOES.push(["numeros", "Números do negócio"]);
MENU_NOME.numeros = "Números do negócio";
{ const g = MENU.find(m => m[0] === "Dados"); if(g && !g[1].some(x => x[2].includes("numeros"))) g[1].unshift(["Números do negócio", "numeros", ["numeros"]]); }

const CANCEL_EV = ["subscription_canceled", "subscription_expired", "order_refunded", "chargeback", "refunded"];
function nbPct(a, b){ return b ? Math.round(100 * a / b) : null; }
const nbFmt = v => v == null ? "-" : v + "%";
async function vNumeros(){
  $("adm-main").innerHTML = `<div class="head"><div><h1>Números do negócio</h1><p class="muted">Carregando…</p></div></div>`;
  try{ if((!PLU || !VENDAS) && typeof carregaVendasAdm === "function") await carregaVendasAdm(); }catch(e){}
  if(!$("adm-main")) return;
  const db = DB(), al = metricasAlunos(), U = al.U, hoje = today();
  // dias de atividade de cada usuária (abriu o app ou treinou)
  const dias = new Map(); const marca = (id, d) => { if(!dias.has(id)) dias.set(id, new Set()); dias.get(id).add(d); };
  Object.entries(db.acessos || {}).forEach(([d, L]) => (L || []).forEach(id => marca(id, d)));
  U.forEach(u => (u.treinos || []).forEach(t => t && t.d && marca(u.id, t.d)));
  const ativaEntre = (u, d0, d1) => { const s = dias.get(u.id); if(!s) return false; for(const d of s) if(d >= d0 && d <= d1) return true; return false; };
  // turmas por semana de cadastro (últimas 8 semanas, começando na segunda)
  const seg = d => { const x = new Date(d + "T12:00:00"); return addD(d, -((x.getDay() + 6) % 7)); };
  const semAtual = seg(hoje), turmas = [];
  for(let k = 8; k >= 1; k--){ const ini = addD(semAtual, -7 * k), fim = addD(ini, 6), base = U.filter(u => u.criado && u.criado.slice(0, 10) >= ini && u.criado.slice(0, 10) <= fim);
    const cols = [1, 2, 3, 4].map(w => { const a = addD(ini, 7 * w), b = addD(a, 6); if(a > hoje) return null; return base.length ? nbPct(base.filter(u => ativaEntre(u, a, b)).length, base.length) : null; });
    turmas.push({ ini, n: base.length, cols }); }
  // funil
  const comTreino = U.filter(u => (u.treinos || []).length >= 1).length, tres = U.filter(u => (u.treinos || []).length >= 3).length;
  const testou = U.filter(u => { const s = PLU && PLU[u.id]; return s ? (s.trial || s.pro) : false; }).length || (al.teste + al.pagos);
  const funil = [["Cadastraram", al.total], ["Fizeram o 1º treino", comTreino], ["Treinaram 3 vezes ou mais", tres], ["Testaram o Pro", testou], ["Pagam o Pro", al.pagos]];
  // dinheiro (vendas reais da Kiwify)
  const V = VENDAS || [], mes = hoje.slice(0, 7), mesAnt = addD(mes + "-01", -1).slice(0, 7);
  const vendasDoMes = V.filter(v => vendaOk(v) && String(v.quando).slice(0, 7) === mes);
  const recMes = vendasDoMes.reduce((s, v) => s + (+v.valor || 0), 0), recAnt = typeof vendasMes === "function" ? vendasMes(mesAnt) : 0;
  const ticket = vendasDoMes.length ? recMes / vendasDoMes.length : 0;
  const canc30 = V.filter(v => CANCEL_EV.includes(v.evento) && String(v.quando).slice(0, 10) >= addD(hoje, -29)).length;
  const churn = nbPct(canc30, al.pagos + canc30);
  const fidel = nbPct(al.dau, al.mau);
  const ser = al.serie || [], maxS = Math.max(1, ...ser.map(x => x.alunos || 0));
  const cor = v => v == null ? "transparent" : `color-mix(in srgb,#2E7D5A ${Math.max(8, Math.min(100, v))}%,#F1F5EE)`;
  const corTx = v => v != null && v >= 55 ? "#fff" : "var(--ink)";
  $("adm-main").innerHTML = `
    <div class="head"><div><h1>Números do negócio</h1><p class="muted">Tudo com dados reais do app. Com poucas alunas os percentuais variam bastante: o retrato fica confiável com algumas semanas de uso.</p></div>
      <div class="toolbar"><button class="btn btn-line btn-sm" id="nb-at">${aic("resumo", 15)} Atualizar</button></div></div>
    <div class="nb-sec">Usuárias</div>
    <div class="grid g4">
      ${kpi("Total de usuárias", int(al.total), `+${int(al.novos7)} nos últimos 7 dias`, "alunos", 1)}
      ${kpi("Ativas hoje", int(al.dau), `${int(al.wau)} na semana · ${int(al.mau)} no mês`, "resumo")}
      ${kpi("Fidelidade", nbFmt(fidel), "das ativas do mês, quantas aparecem num dia", "metricas")}
      ${kpi("Pagantes", int(al.pagos), `${al.total ? pct(al.pagos, al.total) : "0%"} das usuárias · ${int(al.teste)} em teste`, "financeiro")}
    </div>
    <div class="nb-sec">Voltam depois de…</div>
    <div class="grid g3 nb-ret">
      ${[["1 dia", al.r1, "Voltaram no dia seguinte ou depois"], ["7 dias", al.r7, "Ainda usam depois de uma semana"], ["30 dias", al.r30, "Ainda usam depois de um mês"]].map(([t, v, s]) => `<div class="card nb-rt"><span class="muted">${t}</span><b class="num">${fmtRet(v)}</b><small>${s}</small></div>`).join("")}
    </div>
    <div class="nb-sec">Turmas por semana de cadastro</div>
    <div class="card nb-coh"><p class="muted nb-exp">Cada linha é quem se cadastrou numa semana. As colunas mostram quantas dessas ainda usaram o app 1, 2, 3 e 4 semanas depois.</p>
      <div class="nb-tbl-wrap"><table class="nb-tbl"><thead><tr><th>Semana</th><th>Cadastros</th><th>+1 sem</th><th>+2 sem</th><th>+3 sem</th><th>+4 sem</th></tr></thead><tbody>
      ${turmas.map(t => `<tr><td class="nb-sem">${brD(t.ini).slice(0, 5)}</td><td class="num">${int(t.n)}</td>${t.cols.map(v => `<td class="num nb-c" style="background:${cor(v)};color:${corTx(v)}">${v == null ? (t.n ? "…" : "-") : v + "%"}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div></div>
    <div class="nb-sec">Funil: do cadastro ao pagamento</div>
    <div class="card nb-fun">${funil.map(([t, n], i) => { const p = nbPct(n, al.total) || 0, ant = i ? funil[i - 1][1] : null; return `<div class="nb-fl"><div class="nb-fl-t"><b>${t}</b><span class="num">${int(n)} · ${al.total ? p + "%" : "-"}${ant != null && ant ? ` <small>(${nbPct(n, ant)}% da etapa anterior)</small>` : ""}</span></div><span class="nb-bar"><i style="width:${p}%"></i></span></div>`; }).join("")}</div>
    <div class="nb-sec">Dinheiro</div>
    <div class="grid g4">
      ${kpi("Receita do mês", money(recMes), `${int(vendasDoMes.length)} pagamento(s) aprovados`, "financeiro", 1)}
      ${kpi("Mês anterior", money(recAnt), recAnt ? `${recMes >= recAnt ? "▲" : "▼"} ${pct(Math.abs(recMes - recAnt), recAnt)} em relação a este mês` : "sem vendas no mês anterior", "financeiro")}
      ${kpi("Ticket médio", money(ticket), "valor médio por pagamento no mês", "financeiro")}
      ${kpi("Cancelamentos (30 dias)", int(canc30), churn == null ? "sem base ainda" : `taxa de cancelamento: ${churn}%`, "alerta")}
    </div>
    <div class="nb-sec">Ativas por dia (30 dias)</div>
    <div class="card nb-graf"><div class="nb-bars" role="img" aria-label="Usuárias ativas por dia">${ser.map(x => `<span title="${brD(x.dia)}: ${int(x.alunos || 0)}"><i style="height:${Math.round(100 * (x.alunos || 0) / maxS)}%"></i></span>`).join("")}</div>
      <div class="nb-eixo"><small>${ser[0] ? brD(ser[0].dia).slice(0, 5) : ""}</small><small>máx. ${int(maxS)} por dia</small><small>hoje</small></div></div>
    <p class="hint">Fidelidade = ativas hoje ÷ ativas no mês. Taxa de cancelamento = cancelamentos em 30 dias ÷ (pagantes + cancelamentos). Fontes: acessos e treinos do app, planos e vendas da Kiwify.</p>`;
  $("nb-at").onclick = async () => { PLU = null; VENDAS = null; vNumeros(); };
}
VIEWS.numeros = vNumeros;
/* quem vê os Relatórios (métricas) ou o Financeiro também vê os Números do negócio */
const montaMenuNB = montaMenu; montaMenu = function(){ try{ if(PERM && !PERM.total && PERM.numeros == null){ const v = PERM.metricas || PERM.financeiro || PERM.monetizacao; if(v) PERM.numeros = v === "editar" ? "ver" : v; } }catch(e){} return montaMenuNB.apply(this, arguments); };
