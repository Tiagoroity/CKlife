/* ===================== Painel · WhatsApp com mensagem pronta =====================
   Na lista de alunas, ao lado do WhatsApp: abre a conversa com a aluna e a mensagem certa para a fase dela,
   já com o primeiro nome. Quem envia é a pessoa da equipe, no WhatsApp oficial (nada é enviado sozinho). */
const ZAP_MSG = [
  ["m1", "Boas-vindas", "Oi, {NOME}! Aqui é a Micaela, do CK Life 💚 Seja muito bem-vinda! Uma dica pra começar: na tela inicial toque em \"Hoje só tenho 5 min\" e faça seu primeiro treino. Leva pouquinho e já conta muito. Qualquer dúvida, é só me chamar aqui."],
  ["m9", "Como instalar o app", "Oi, {NOME}! 💚 Aqui é a Micaela do CK Life.\n\nPra deixar o app na tela do seu celular, igual um aplicativo normal, é rapidinho:\n\n👉 Abra este link: https://app.cklife.com.br\n\n📱 *Se for iPhone:*\n1. Abra o link no *Safari*\n2. Toque no botão *Compartilhar* (o quadradinho com a setinha pra cima, embaixo da tela)\n3. Escolha *\"Adicionar à Tela de Início\"*\n4. Toque em *Adicionar*\n\n🤖 *Se for Android:*\n1. Abra o link no *Chrome*\n2. Toque nos *3 pontinhos* no canto de cima\n3. Escolha *\"Instalar app\"* ou *\"Adicionar à tela inicial\"*\n4. Confirme em *Instalar*\n\nPronto! O ícone do CK Life aparece na sua tela e você entra direto. 🔥\n\n⚠️ Se abriu o link pelo Instagram ou WhatsApp e não aparecer a opção, toque nos 3 pontinhos e escolha *\"Abrir no navegador\"* (Safari ou Chrome).\n\nQualquer dúvida, me chama aqui! 💚"],
  ["m2", "Ainda não treinou", "Oi, {NOME}! Tudo bem? Conseguiu usar o app direitinho? Se ficou alguma dúvida, me fala que eu te ajudo. E se o dia estiver corrido, o treino de 5 minutos em casa já vale! 💚"],
  ["m3", "Primeiro treino feito", "{NOME}, vi que você fez seu primeiro treino! Que orgulho! 🎉 Segunda começa uma turma nova do Desafio 21 dias, todas juntas. Quer entrar com a gente? É só ir em Treinos → Desafios."],
  ["m4", "Teste acabando", "Oi, {NOME}! Passando pra te avisar que seu teste do Pro termina em 2 dias. Você já fez {X} treinos, que demais! 💚 Se quiser continuar com tudo liberado, o Pro está no app em Perfil → Plano. E se preferir seguir no gratuito, tudo bem também, você não perde nada."],
  ["m5", "Teste acabou", "{NOME}, obrigada por esses 7 dias com a gente! 💚 Você continua no CK Life gratuito, com seus treinos e seu histórico. Quando quiser o Pro de volta, é só ir em Perfil → Plano."],
  ["m6", "Ativa (pedir opinião)", "Oi, {NOME}! Vi que você está treinando direitinho, parabéns! 💪 Posso te pedir uma coisa? Me conta o que você mais gosta no app e o que podia melhorar. E se tiver uma amiga que também quer treinar em casa, chama ela pra treinar junto."],
  ["m7", "Parada (convite leve)", "Oi, {NOME}! Senti sua falta por aqui 💚 Sem cobrança, tá? A vida corre. Quando der, que tal só 5 minutinhos hoje? Voltar também é progresso."],
  ["m8", "Assinante Pro", "{NOME}, muito obrigada por assinar o Pro! 💚 Qualquer coisa que precisar, é só me chamar aqui. Se um dia quiser contar como está sendo sua experiência, a gente adoraria ouvir."]
];
const zDig = s => String(s || "").replace(/\D/g, "");
const zNome = u => { const n = String(u.nome || "").trim().split(/\s+/)[0] || ""; return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : ""; };
const zDias = d => { if(!d) return 999; const a = new Date(String(d).slice(0, 10) + "T12:00:00"), b = new Date(today() + "T12:00:00"); return Math.round((b - a) / 864e5); };
/* fase da aluna → mensagem sugerida */
function zFase(u){
  const T = (u.treinos || []).filter(t => t && t.d), n = T.length, s = (typeof PLU !== "undefined" && PLU) ? PLU[u.id] : null;
  const ult = n ? T.map(t => t.d).sort().pop() : null, cad = zDias(u.criado);
  if(s && s.pro && !s.trial && ["kiwify", "apple", "google"].includes(s.provider)) return "m8";
  if(s && s.pro && s.trial && s.fim){ const falta = -zDias(String(s.fim).slice(0, 10)); if(falta >= 0 && falta <= 2 && n >= 1) return "m4"; }
  if(n === 0) return cad <= 1 ? "m1" : cad <= 7 ? "m2" : "m7";
  if(zDias(ult) >= 7) return "m7";
  if(n === 1) return "m3";
  if(s && !s.pro && cad >= 7 && cad <= 9) return "m5";
  return "m6";
}
function zTexto(k, u){ const m = ZAP_MSG.find(x => x[0] === k); const nome = zNome(u);
  return m[2].replace(/\{NOME\}/g, nome || "tudo bem").replace(/^Oi, tudo bem!/, "Oi!").replace(/\{X\}/g, String((u.treinos || []).length)); }
function zLink(u, k){ return F.lkWhats(u.whats, zTexto(k, u)); }
function zAbre(u){
  const sug = zFase(u), nome = zNome(u) || u.nome || "aluna";
  const L = [ZAP_MSG.find(m => m[0] === sug)].concat(ZAP_MSG.filter(m => m[0] !== sug));
  modal("WhatsApp · " + nome, `<p class="hint" style="margin:0 0 10px">Escolha a mensagem. Abre o WhatsApp com o texto pronto; é só conferir e enviar. A primeira é a sugerida para a fase dela.</p>
    <div class="list" style="display:grid;gap:8px">${L.map((m, i) => `<button class="card zap-op" data-zk="${m[0]}" style="text-align:left;cursor:pointer;border:${i ? "1px solid var(--line)" : "2px solid var(--accent)"}">
      <b>${i ? "" : "✓ Sugerida · "}${esc(m[1])}</b><br><small class="muted">${esc(zTexto(m[0], u).slice(0, 140))}${zTexto(m[0], u).length > 140 ? "…" : ""}</small></button>`).join("")}</div>`);
  document.querySelectorAll("#mbox [data-zk]").forEach(b => b.onclick = () => { const url = zLink(u, b.dataset.zk); if(!url) return toast("WhatsApp inválido"); window.open(url, "_blank", "noopener"); });
}
/* coloca o botão ao lado do número em cada linha */
function zLiga(){
  const main = $("adm-main"); if(!main || SEC !== "alunos") return;
  main.querySelectorAll("tbody tr").forEach(tr => {
    if(tr.querySelector("[data-zap]")) return;
    const ed = tr.querySelector("[data-ed]"); if(!ed) return; const u = DB().users.find(x => x.id === ed.dataset.ed); if(!u) return;
    const nm0 = tr.children[0]; if(nm0 && !nm0.querySelector(".al-app")){ const ap = zApp(u); nm0.insertAdjacentHTML("beforeend", `<br><small class="al-app ${ap ? "ok" : ""}">${ap ? "📲 app instalado" : u.acWeb ? "🌐 usa pelo navegador" : "❔ ainda não abriu desde 01/11"}</small>`); }
    const nm = tr.children[0]; if(nm && !nm.querySelector(".al-orig") && window.ckOrigemAluna){ const o = window.ckOrigemAluna(u); if(o && !/^Direto/.test(o)) nm.insertAdjacentHTML("beforeend", `<br><small class="al-orig">via ${esc(o)}</small>`); }
    const td = tr.children[1]; if(!td || zDig(u.whats).length < 10) return;
    td.insertAdjacentHTML("beforeend", ` <button class="btn btn-sm zap-bt" data-zap="${u.id}" title="Mandar mensagem no WhatsApp" aria-label="Mandar mensagem no WhatsApp para ${esc(u.nome || "")}">💬</button>`);
    td.querySelector("[data-zap]").onclick = ev => { ev.stopPropagation(); zAbre(u); };
  });
}
{ let zT = null; new MutationObserver(() => { clearTimeout(zT); zT = setTimeout(zLiga, 60); }).observe($("adm-main") || document.body, { childList: true, subtree: true }); }

/* ===== Alunas quentes: treinaram 2 vezes ou mais e ainda não pagam o Pro (são as que mais assinam) ===== */
function zQuentes(){
  const lim = addD(today(), -14);
  return DB().users.filter(u => !u.admin && !u.soAdmin && !u.exemplo).map(u => {
    const T = (u.treinos || []).filter(t => t && t.d), rec = T.filter(t => t.d >= lim).length, s = (typeof PLU !== "undefined" && PLU) ? PLU[u.id] : null;
    const pagando = s && s.pro && !s.trial && ["kiwify", "apple", "google"].includes(s.provider);
    return { u, n: T.length, rec, pagando, trial: !!(s && s.trial), ult: T.length ? T.map(t => t.d).sort().pop() : "" };
  }).filter(x => x.n >= 2 && x.rec >= 1 && !x.pagando).sort((a, b) => b.rec - a.rec || b.n - a.n).slice(0, 12);
}
function zQuentesPinta(){
  const main = $("adm-main"); if(!main || SEC !== "alunos" || $("zq-box")) return;
  const h = main.querySelector(".head"); if(!h) return;
  const L = zQuentes();
  const linha = x => `<div class="zq-row"><span class="zq-n">${x.rec}</span><div class="zq-t"><b>${esc(x.u.nome || x.u.email)}</b><small>${x.n} treinos no total · último ${brD(x.ult)}${x.trial ? " · em teste grátis" : " · gratuito"}</small></div>${zDig(x.u.whats).length >= 10 ? `<button class="btn btn-sm zap-bt" data-zq="${x.u.id}" aria-label="Mandar mensagem no WhatsApp">💬</button>` : ""}</div>`;
  h.insertAdjacentHTML("afterend", `<div class="card zq-card" id="zq-box"><div class="zq-h"><b>🔥 Alunas quentes</b><small class="muted">Treinaram 2 vezes ou mais (pelo menos 1 nos últimos 14 dias) e ainda não assinam o Pro. São as que mais assinam: chame primeiro.</small></div>
    ${L.length ? `<div class="zq-lista">${L.map(linha).join("")}</div>` : `<p class="muted" style="margin:6px 0 0">Ainda ninguém nesse grupo. Assim que as alunas fizerem o 2º treino, elas aparecem aqui.</p>`}</div>`);
  main.querySelectorAll("[data-zq]").forEach(b => b.onclick = () => { const u = DB().users.find(x => x.id === b.dataset.zq); if(u) zAbre(u); });
}
{ let zqT = null; new MutationObserver(() => { clearTimeout(zqT); zqT = setTimeout(zQuentesPinta, 80); }).observe($("adm-main") || document.body, { childList: true }); }

/* ===== App na tela do celular: quantas instalaram e quem falta (com a mensagem "Como instalar o app") ===== */
const zApp = u => !!(u.pwaInstalado || u.acApp);
function zAppPinta(){
  const main = $("adm-main"); if(!main || SEC !== "alunos" || $("za-box")) return;
  const h = main.querySelector(".head"); if(!h) return;
  const A = DB().users.filter(u => !u.admin && !u.soAdmin && !u.exemplo), ins = A.filter(zApp), falta = A.filter(u => !zApp(u)).sort((a, b) => String(b.acWeb || b.criado || "").localeCompare(String(a.acWeb || a.criado || "")));
  const web = falta.filter(u => u.acWeb), pc = A.length ? Math.round(100 * ins.length / A.length) : 0;
  const linha = u => `<div class="zq-row"><span class="zq-n">🌐</span><div class="zq-t"><b>${esc(u.nome || u.email)}</b><small>${u.acWeb ? "abriu pelo navegador em " + brD(u.acWeb) : "cadastro em " + brD(u.criado || "")}</small></div>${zDig(u.whats).length >= 10 ? `<button class="btn btn-sm zap-bt" data-za="${u.id}" aria-label="Mandar como instalar o app">💬</button>` : ""}</div>`;
  const zq = $("zq-box"), alvo = zq || h;
  alvo.insertAdjacentHTML("afterend", `<div class="card zq-card" id="za-box"><div class="zq-h"><b>📲 App na tela do celular</b><small class="muted">Conta quem abriu o CK Life pelo app instalado (registro a partir de 01/11/2026; quem não abriu desde então ainda não aparece).</small></div>
    <div class="grid g3" style="margin:10px 0">${kpi("Instalaram", int(ins.length), pc + "% das alunas", "", 1)}${kpi("Usam pelo navegador", int(web.length), "abriram sem instalar")}${kpi("Sem registro ainda", int(falta.length - web.length), "não abriram desde 01/11")}</div>
    ${falta.length ? `<details><summary><b>Ver quem ainda não instalou (${falta.length})</b> · toque em 💬 para mandar o passo a passo</summary><div class="zq-lista" style="margin-top:8px">${falta.slice(0, 60).map(linha).join("")}</div>${falta.length > 60 ? `<p class="muted">Mostrando as 60 mais recentes.</p>` : ""}</details>` : `<p class="muted" style="margin:0">Todas já instalaram 🎉</p>`}</div>`);
  main.querySelectorAll("[data-za]").forEach(b => b.onclick = () => { const u = DB().users.find(x => x.id === b.dataset.za); const url = u && zLink(u, "m9"); if(url) window.open(url, "_blank", "noopener"); });
}
{ let zaT = null; new MutationObserver(() => { clearTimeout(zaT); zaT = setTimeout(zAppPinta, 120); }).observe($("adm-main") || document.body, { childList: true }); }
