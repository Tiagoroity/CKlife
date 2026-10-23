/* ===================== CK Life · Expansão: Explorar, agenda, avaliações, favoritos, loja, Meu Ciclo e chat =====================
   Fica dentro do app.js (mesma IIFE). Usa DB/ME/save/sheet/toast/ic do app. Tabelas novas: agendamentos, avaliacoes, ciclo, conversas, mensagens. */
Object.assign(P, {
  explorar:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/>',
  insta:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".8" fill="currentColor"/>',
  whats:'<path d="M4 20l1.3-4A8 8 0 1 1 8 18.8z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', ok:'<path d="M12 2l2.4 2.1 3.2-.3.8 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.8 3.1-3.2-.3L12 22l-2.4-2.1-3.2.3-.8-3.1L2.8 15.5l1.2-3-1.2-3 2.8-1.6.8-3.1 3.2.3z"/><path d="M8.5 12l2.5 2.5 4.5-4.5"/>',
  gift:'<path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7S10 2 7 3s0 4 5 4zM12 7s2-5 5-4 0 4-5 4z"/>',
  ciclo:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5s3 3.4 3 5.5a3 3 0 0 1-6 0c0-2.1 3-5.5 3-5.5z"/>',
  shield:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/>', flag:'<path d="M5 21V4h11l-2 4 2 4H5"/>', edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>'
});
const XERR = e => /PGRST20[0-9]|42P01|42883|does not exist|schema cache|Could not find/i.test(String(e && ((e.code || "") + " " + (e.message || "")) || e));
const XAVISO = "Esta parte está sendo ativada. Volte daqui a pouco!";
const xnuvem = () => NU.ativo && NU.sb;
const LX = {
  get(n){ try{ return JSON.parse(localStorage.getItem(KEY + "_x_" + n) || "null"); }catch(e){ return null; } },
  set(n, v){ try{ localStorage.setItem(KEY + "_x_" + n, JSON.stringify(v)); }catch(e){} },
  del(n){ try{ localStorage.removeItem(KEY + "_x_" + n); }catch(e){} }
};
const lxArr = n => LX.get(n) || [];
async function sbq(p){ const r = await p; if(r.error) throw r.error; return r.data; }
const agora = () => new Date().toISOString();
const brl = v => (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const soDig = s => String(s || "").replace(/\D/g, "");
const ativo = x => !!x && x.ativo !== false;
const ordena = (a, b) => (!!b.destaque - !!a.destaque) || ((+a.ordem || 0) - (+b.ordem || 0)) || String(a.nome || "").localeCompare(String(b.nome || ""));

/* ---------- Categorias (o painel gerencia; estas são o padrão) ---------- */
const XCAT = {
  prof: ["Personal Trainer","Nutricionista","Fisioterapeuta","Psicólogo","Dermatologista","Esteticista","Massoterapeuta","Cabeleireiro","Manicure","Designer de sobrancelhas","Maquiador","Outros"],
  empresa: ["Academia","Estúdio de pilates","Crossfit e funcional","Clínica","Estética e beleza","Salão de beleza","Loja fitness","Alimentação saudável","Outros"],
  produto: ["Suplementos","Roupas fitness","Acessórios","Equipamentos","Alimentação","Beleza e cuidados","Outros"]
};
function xcats(g){ const L = (DB.categorias || []).filter(c => c.grupo === g && c.ativo !== false).sort((a, b) => (+a.ordem || 0) - (+b.ordem || 0)).map(c => c.nome); return L.length ? L : XCAT[g]; }
const mesmaCat = (a, b) => norm(a || "") === norm(b || "");

/* ---------- Dados de exemplo (só no modo demonstração, sem banco) ---------- */
function xpGarante(){
  ["empresas","servicos","produtos","banners","categorias","parceiros","profissionais","cupons","eventos"].forEach(k => { if(!Array.isArray(DB[k])) DB[k] = []; });
  if(!NU.ativo && !DB.xpSemente) xpSemente();
}
function xpSemente(){
  DB.xpSemente = true;
  const ag = { dias: ["MO","TU","WE","TH","FR"], ini: "08:00", fim: "18:00", passo: 60 };
  DB.empresas.push(
    { id:"em1", nome:"Academia Força Total", tipo:"Academia", cidade:1, end:"Av. Historiador Rubens de Mendonça, 1500", bairro:"Bosque da Saúde", horario:"Seg a sex 5h às 23h · Sáb 8h às 14h", modalidades:"Musculação, funcional, dança, spinning", planos:"Mensal R$ 119 · Trimestral R$ 99/mês · Anual R$ 79/mês", whats:"65998112201", msg:"", insta:"forcatotal", site:"", beneficio:"Matrícula grátis para alunas CK Life", desc:"Academia completa com área feminina e aulas coletivas.", logo:"", capa:"img/ex-agacho.jpg", galeria:["img/ex-desenv.jpg","img/ex-ponte.jpg","img/ex-afundocasa.jpg"], parceira:true, destaque:true, ativo:true, ordem:1, agenda: { ...ag, dias:["MO","TU","WE","TH","FR","SA"], ini:"07:00", fim:"20:00" }, exemplo:true },
    { id:"em2", nome:"Studio Equilíbrio Pilates", tipo:"Estúdio de pilates", cidade:1, end:"Rua das Orquídeas, 210", bairro:"Jardim Cuiabá", horario:"Seg a sex 6h às 21h", modalidades:"Pilates solo, pilates aparelho, alongamento", planos:"2x na semana R$ 280/mês", whats:"65999990010", msg:"", insta:"studioequilibrio", site:"", beneficio:"Aula experimental grátis", desc:"Turmas pequenas, só para mulheres.", logo:"", capa:"img/ex-pranchalat.jpg", galeria:[], parceira:true, destaque:false, ativo:true, ordem:2, agenda: ag, exemplo:true },
    { id:"em3", nome:"Move Funcional VG", tipo:"Crossfit e funcional", cidade:2, end:"Av. Couto Magalhães, 800", bairro:"Centro", horario:"Seg a sáb 6h às 22h", modalidades:"Funcional, HIIT", planos:"Mensal R$ 139", whats:"65999990011", msg:"", insta:"", site:"", beneficio:"", desc:"Treinos em grupo de 45 minutos.", logo:"", capa:"img/ex-escalador.jpg", galeria:[], parceira:false, destaque:false, ativo:true, ordem:3, agenda: ag, exemplo:true });
  DB.profissionais.forEach(p => { if(p.exemplo && !p.modo) Object.assign(p, p.id === "pf1"
    ? { tipo:"Personal Trainer", modo:"ambos", cidade:1, end:"Bosque da Saúde (ou na sua casa)", registro:"CREF 012345-G/MT", insta:"", site:"", verificado:true, destaque:true, status:"ativo", agenda: ag }
    : { modo:"online", cidade:"", end:"", registro:"CRN1 12345", insta:"", site:"", verificado:true, destaque:false, status:"ativo", agenda: { ...ag, ini:"09:00", fim:"17:00" } }); });
  DB.profissionais.push(
    { id:"pf3", nome:"Dra. Juliana Prado", tipo:"Fisioterapeuta", whats:"65999990003", desc:"Fisioterapia para dores nas costas e pós-parto.", valor:120, ordem:3, ativo:true, foto:"", modo:"presencial", cidade:1, end:"Rua Barão de Melgaço, 300", registro:"CREFITO 98765-F", insta:"", site:"", verificado:true, destaque:false, status:"ativo", agenda: ag, exemplo:true },
    { id:"pf4", nome:"Camila Torres", tipo:"Esteticista", whats:"65999990004", desc:"Limpeza de pele, drenagem e massagem modeladora.", valor:90, ordem:4, ativo:true, foto:"", modo:"presencial", cidade:2, end:"Av. Filinto Müller, 55", registro:"", insta:"", site:"", verificado:false, destaque:false, status:"ativo", agenda: { dias:["TU","WE","TH","FR","SA"], ini:"09:00", fim:"19:00", passo:60 }, exemplo:true },
    { id:"pf5", nome:"Bianca Lopes", tipo:"Psicólogo", whats:"65999990005", desc:"Terapia online para ansiedade, autoestima e relação com a comida.", valor:140, ordem:5, ativo:true, foto:"", modo:"online", cidade:"", end:"", registro:"CRP 18/01234", insta:"", site:"", verificado:true, destaque:true, status:"ativo", agenda: { dias:["MO","WE","FR"], ini:"10:00", fim:"20:00", passo:60 }, exemplo:true });
  DB.servicos.push(
    { id:"sv1", dono_tipo:"profissional", dono:"pf1", nome:"Aula com personal (1h)", desc:"Treino individual montado para o seu objetivo.", preco:80, promo:70, dur:60, modo:"ambos", ativo:true, ordem:1, exemplo:true },
    { id:"sv2", dono_tipo:"profissional", dono:"pf1", nome:"Avaliação física", desc:"Medidas, composição corporal e plano de treino.", preco:100, promo:"", dur:45, modo:"presencial", ativo:true, ordem:2, exemplo:true },
    { id:"sv3", dono_tipo:"profissional", dono:"pf2", nome:"Consulta nutricional online", desc:"Plano alimentar personalizado com retorno em 30 dias.", preco:150, promo:129, dur:60, modo:"online", ativo:true, ordem:1, exemplo:true },
    { id:"sv4", dono_tipo:"profissional", dono:"pf3", nome:"Sessão de fisioterapia", desc:"", preco:120, promo:"", dur:50, modo:"presencial", ativo:true, ordem:1, exemplo:true },
    { id:"sv5", dono_tipo:"profissional", dono:"pf4", nome:"Limpeza de pele", desc:"", preco:110, promo:90, dur:60, modo:"presencial", ativo:true, ordem:1, exemplo:true },
    { id:"sv6", dono_tipo:"profissional", dono:"pf5", nome:"Sessão de terapia online", desc:"", preco:140, promo:"", dur:50, modo:"online", ativo:true, ordem:1, exemplo:true },
    { id:"sv7", dono_tipo:"empresa", dono:"em2", nome:"Aula experimental de pilates", desc:"Conheça o estúdio sem compromisso.", preco:0, promo:"", dur:50, modo:"presencial", ativo:true, ordem:1, exemplo:true },
    { id:"sv8", dono_tipo:"empresa", dono:"em1", nome:"Visita e aula experimental", desc:"Conheça a academia com um professor.", preco:0, promo:"", dur:60, modo:"presencial", ativo:true, ordem:1, exemplo:true });
  DB.produtos.push(
    { id:"pr1", nome:"Garrafa CK Life 1 litro", desc:"Garrafa com marcação de horários para bater sua meta de água.", cat:"Acessórios", tipo:"proprio", preco:69.9, promo:59.9, foto:"", url:"https://exemplo.com.br/garrafa-ck", botao:"COMPRAR", marca:"CK Life", destaque:true, ativo:true, ordem:1, exemplo:true },
    { id:"pr2", nome:"Whey protein baunilha 900 g", desc:"Proteína para completar as refeições do dia.", cat:"Suplementos", tipo:"afiliado", preco:149.9, promo:"", foto:"", url:"https://exemplo.com.br/whey?ref=cklife&utm_source=cklife&utm_medium=app", botao:"VER PRODUTO", marca:"Nutri Suplementos", destaque:false, ativo:true, ordem:2, exemplo:true },
    { id:"pr3", nome:"Legging de compressão", desc:"Tecido que não fica transparente no agachamento.", cat:"Roupas fitness", tipo:"parceiro", preco:129.9, promo:99.9, foto:"", url:"https://exemplo.com.br/legging", botao:"COMPRAR", marca:"Loja Move Fitness", destaque:true, ativo:true, ordem:3, exemplo:true });
  DB.banners.push(
    { id:"bn1", titulo:"Matrícula grátis na Força Total", texto:"Benefício exclusivo para alunas CK Life.", img:"img/ex-desenv.jpg", local:"explorar", destino:"empresa", alvo:"em1", url:"", inicio:"", fim:"", ordem:1, ativo:true, cidade:1, exemplo:true },
    { id:"bn2", titulo:"Garrafa CK Life com desconto", texto:"Bata sua meta de água todos os dias.", img:"img/ex-wallsit.jpg", local:"loja", destino:"produto", alvo:"pr1", url:"", inicio:"", fim:"", ordem:1, ativo:true, cidade:"", exemplo:true });
  DB.parceiros.forEach(p => { if(p.exemplo && p.beneficio == null) Object.assign(p, p.id === "pc1" ? { beneficio:"10% em toda a loja", cat:"Alimentação saudável", livre:true, destaque:true, whats:"6533221100", insta:"", site:"", desc:"Produtos naturais, grãos e suplementos." } : { beneficio:"15% em roupas fitness", cat:"Loja fitness", livre:false, destaque:false, whats:"", insta:"", site:"", desc:"" }); });
  save();
}
xpGarante();

/* ---------- Camada de dados das tabelas novas (banco de verdade; no modo demonstração, guarda no aparelho) ---------- */
const AG_COLS = ["alvo_tipo","alvo_id","alvo_nome","servico_id","servico_nome","data","hora","preco","modo","local","obs"];
const XP = {
  ag: {
    async listar(admin){ if(!xnuvem()){ const L = lxArr("agend"); return admin ? L : L.filter(a => a.user_id === ME.id); } return sbq(NU.sb.from("agendamentos").select("*").order("data", { ascending: true }).limit(3000)); },
    async criar(o){
      const base = {}; AG_COLS.forEach(k => { if(o[k] !== undefined && o[k] !== "") base[k] = o[k]; });
      if(!xnuvem()){ const a = { id: novoId(), user_id: ME.id, nome: ME.nome, whats: ME.whats || "", status: "solicitado", criado: agora(), atualizado: agora(), ...base }; const L = lxArr("agend"); L.push(a); LX.set("agend", L); return a; }
      const r = await sbq(NU.sb.from("agendamentos").insert({ ...base, user_id: NU.uid, nome: ME.nome, whats: ME.whats || "" }).select()); return r[0];
    },
    async status(id, st, nota){
      if(!xnuvem()){ const L = lxArr("agend"), a = L.find(x => x.id === id); if(a){ a.status = st; if(nota != null) a.nota_adm = nota; a.atualizado = agora(); } LX.set("agend", L); return; }
      const up = { status: st }; if(nota != null) up.nota_adm = nota; await sbq(NU.sb.from("agendamentos").update(up).eq("id", id));
    },
    async apagar(id){ if(!xnuvem()){ LX.set("agend", lxArr("agend").filter(a => a.id !== id)); return; } await sbq(NU.sb.from("agendamentos").delete().eq("id", id)); },
    async ocupados(tipo, id, de, ate){
      if(!xnuvem()) return lxArr("agend").filter(a => a.alvo_tipo === tipo && a.alvo_id === id && a.data >= de && a.data <= ate && ["solicitado","confirmado"].includes(a.status)).map(a => ({ data: a.data, hora: a.hora }));
      try{ return await sbq(NU.sb.rpc("horarios_ocupados", { p_tipo: tipo, p_id: id, p_de: de, p_ate: ate })); }catch(e){ return []; }
    }
  },
  av: {
    async todas(admin){ if(!xnuvem()) return lxArr("aval").filter(a => admin || !a.oculta || a.user_id === ME.id); return sbq(NU.sb.from("avaliacoes").select(admin ? "*" : "alvo_tipo,alvo_id,nota,oculta").order("criado", { ascending: false }).limit(5000)); },
    async de(tipo, id){
      if(!xnuvem()) return lxArr("aval").filter(a => a.alvo_tipo === tipo && a.alvo_id === id && (!a.oculta || a.user_id === ME.id)).sort((a, b) => String(b.criado).localeCompare(String(a.criado)));
      return sbq(NU.sb.from("avaliacoes").select("*").eq("alvo_tipo", tipo).eq("alvo_id", id).order("criado", { ascending: false }).limit(100));
    },
    async salvar(tipo, id, nota, texto){
      if(!xnuvem()){
        const L = lxArr("aval"); let a = L.find(x => x.alvo_tipo === tipo && x.alvo_id === id && x.user_id === ME.id);
        if(a) Object.assign(a, { nota, texto, nome: ME.nome });
        else L.push({ id: novoId(), alvo_tipo: tipo, alvo_id: id, user_id: ME.id, nome: ME.nome, nota, texto, verificada: lxArr("agend").some(g => g.user_id === ME.id && g.alvo_id === id && g.status === "concluido"), oculta: false, denuncias: 0, criado: agora() });
        LX.set("aval", L); return;
      }
      const ex = await sbq(NU.sb.from("avaliacoes").select("id").eq("alvo_tipo", tipo).eq("alvo_id", id).eq("user_id", NU.uid));
      if(ex[0]) await sbq(NU.sb.from("avaliacoes").update({ nota, texto, nome: ME.nome }).eq("id", ex[0].id));
      else await sbq(NU.sb.from("avaliacoes").insert({ alvo_tipo: tipo, alvo_id: id, user_id: NU.uid, nome: ME.nome, nota, texto }));
    },
    async denunciar(id){ if(!xnuvem()){ const L = lxArr("aval"), a = L.find(x => x.id === id); if(a) a.denuncias = (a.denuncias || 0) + 1; LX.set("aval", L); return; } await sbq(NU.sb.rpc("denunciar_avaliacao", { p_id: id })); },
    async moderar(id, campos){ if(!xnuvem()){ const L = lxArr("aval"), a = L.find(x => x.id === id); if(a) Object.assign(a, campos); LX.set("aval", L); return; } await sbq(NU.sb.from("avaliacoes").update(campos).eq("id", id)); },
    async apagar(id){ if(!xnuvem()){ LX.set("aval", lxArr("aval").filter(a => a.id !== id)); return; } await sbq(NU.sb.from("avaliacoes").delete().eq("id", id)); }
  },
  ciclo: {
    async ler(){ if(!xnuvem()) return LX.get("ciclo_" + ME.id); const r = await sbq(NU.sb.from("ciclo").select("ativo,dados").eq("user_id", NU.uid)); return r[0] ? { ...(r[0].dados || {}), ativo: r[0].ativo } : null; },
    async gravar(d){ if(!xnuvem()){ LX.set("ciclo_" + ME.id, d); return; } await sbq(NU.sb.from("ciclo").upsert({ user_id: NU.uid, ativo: d.ativo !== false, dados: d, atualizado: agora() })); },
    async apagar(){ if(!xnuvem()){ LX.del("ciclo_" + ME.id); return; } await sbq(NU.sb.from("ciclo").delete().eq("user_id", NU.uid)); },
    async resumo(){
      if(!xnuvem()){ let ativas = 0, total = 0, ck = 0; const lim = addD(today(), -6); try{ Object.keys(localStorage).filter(k => k.startsWith(KEY + "_x_ciclo_")).forEach(k => { const d = JSON.parse(localStorage.getItem(k) || "{}"); total++; if(d.ativo !== false){ ativas++; ck += Object.keys(d.checkins || {}).filter(x => x >= lim).length; } }); }catch(e){} return { ativas, total, checkins_7d: ck }; }
      return sbq(NU.sb.rpc("ciclo_resumo"));
    }
  },
  chat: {
    async conversas(){ if(!xnuvem()) return lxArr("conv").filter(c => c.a === ME.id || c.b === ME.id).sort((a, b) => String(b.ultima_em).localeCompare(String(a.ultima_em))); return sbq(NU.sb.from("conversas").select("*").order("ultima_em", { ascending: false }).limit(100)); },
    async abrir(o){
      const foto = await miniFoto(ME.foto, 64);
      if(!xnuvem()){ const L = lxArr("conv"); let c = L.find(x => (x.a === ME.id && x.b === o.id) || (x.b === ME.id && x.a === o.id));
        if(!c){ c = { id: novoId(), a: ME.id, b: o.id, nome_a: ME.nome, foto_a: foto, nome_b: o.nome, foto_b: o.foto || "", ultima: "", ultima_em: agora(), ultimo_autor: null, lida_a: agora(), lida_b: null, criado: agora() }; L.push(c); LX.set("conv", L); }
        return c; }
      const busca = () => sbq(NU.sb.from("conversas").select("*").or(`and(a.eq.${NU.uid},b.eq.${o.id}),and(a.eq.${o.id},b.eq.${NU.uid})`));
      let r = await busca(); if(r[0]) return r[0];
      const ins = await NU.sb.from("conversas").insert({ a: NU.uid, b: o.id, nome_a: ME.nome, foto_a: foto, nome_b: o.nome, foto_b: o.foto || "" }).select();
      if(ins.error){ r = await busca(); if(r[0]) return r[0]; throw ins.error; }
      return ins.data[0];
    },
    async mensagens(cid){ if(!xnuvem()) return lxArr("msg").filter(m => m.conversa_id === cid).sort((a, b) => String(a.criado).localeCompare(String(b.criado))); return sbq(NU.sb.from("mensagens").select("*").eq("conversa_id", cid).order("criado", { ascending: true }).limit(400)); },
    async enviar(c, texto){
      if(!xnuvem()){ const m = { id: novoId(), conversa_id: c.id, autor: ME.id, texto, criado: agora() }, M = lxArr("msg"); M.push(m); LX.set("msg", M);
        const L = lxArr("conv"), x = L.find(y => y.id === c.id); if(x){ x.ultima = texto.slice(0, 90); x.ultima_em = m.criado; x.ultimo_autor = ME.id; x[x.a === ME.id ? "lida_a" : "lida_b"] = m.criado; LX.set("conv", L); } return m; }
      const r = await sbq(NU.sb.from("mensagens").insert({ conversa_id: c.id, autor: NU.uid, texto }).select()); return r[0];
    },
    async apagarMsg(m){ if(!xnuvem()){ LX.set("msg", lxArr("msg").filter(x => x.id !== m.id)); return; } await sbq(NU.sb.from("mensagens").delete().eq("id", m.id)); },
    async lida(c){ const lado = c.a === ME.id ? "lida_a" : "lida_b", t = agora(); c[lado] = t;
      if(!xnuvem()){ const L = lxArr("conv"), x = L.find(y => y.id === c.id); if(x){ x[lado] = t; LX.set("conv", L); } return; }
      try{ await NU.sb.from("conversas").update({ [lado]: t }).eq("id", c.id); }catch(e){} }
  }
};

/* ---------- Métricas: visualizações e cliques (na tabela de eventos que já existe, com prefixo x:) ---------- */
const XVISTO = new Set();
function xev(tipo, id, acao){
  if(!ME || !id) return;
  if(acao === "ver"){ const k = tipo + ":" + id; if(XVISTO.has(k)) return; XVISTO.add(k); }
  DB.eventos.push({ t: acao === "ver" ? "imp" : "clk", c: `x:${tipo}:${id}:${acao}`, u: ME.id, d: today() }); save();
}

/* ---------- Links ---------- */
const MSG_PADRAO = "Olá! Encontrei vocês pelo CK Life e gostaria de saber mais.";
const lkWhats = (n, msg) => { const d = soDig(n).replace(/^55(?=\d{10,11}$)/, ""); return d.length >= 10 ? `https://wa.me/55${d}?text=${encodeURIComponent(msg || (DB.config && DB.config.msgWhats) || MSG_PADRAO)}` : ""; };
const lkInsta = h => { h = String(h || "").trim(); if(!h) return ""; if(/^https?:\/\//i.test(h)) return h; return "https://instagram.com/" + h.replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, ""); };
const lkSite = u => { u = String(u || "").trim(); return !u ? "" : /^https?:\/\//i.test(u) ? u : "https://" + u; };
const xcidNome = id => (DB.cidades.find(c => +c.id === +id) || {}).nome || "";
const lkMapa = (end, cid) => end ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([end, xcidNome(cid)].filter(Boolean).join(", ")) : "";
function abreLink(url, tipo, id, acao){ if(!url) return toast("Link indisponível no momento"); xev(tipo, id, acao); SOM.tap(); window.open(url, "_blank", "noopener"); }

/* ---------- Cidade (sem GPS) ---------- */
let XCID = null;
const cidadeVer = () => XCID != null ? XCID : ME.cidade;
function escolheCidade(depois){
  const cids = DB.cidades.filter(c => c.ativa !== false);
  sheet("Cidade", `<p class="hint" style="margin:0">A cidade vale para academias, profissionais presenciais e benefícios. Loja e atendimento online são para todo o Brasil.</p>
    <div class="search">${ic("search", 18)}<input class="input" id="xc-q" placeholder="Buscar cidade" autocomplete="off"></div>
    <div class="list" id="xc-l"></div>`);
  const desenha = () => { const q = norm($("xc-q").value); const L = cids.filter(c => !q || norm(c.nome).includes(q));
    $("xc-l").innerHTML = L.map(c => `<div class="card xp-cidrow"><b>${esc(c.nome)}${c.uf ? ` <small class="muted">${esc(c.uf)}</small>` : ""}</b><div class="acts">${+c.id === +ME.cidade ? `<span class="st ok">Minha cidade</span>` : `<button class="btn btn-line btn-sm" data-ver="${c.id}">Só ver agora</button><button class="btn btn-accent btn-sm" data-minha="${c.id}">Mudar para esta</button>`}</div></div>`).join("") || `<p class="empty">Nenhuma cidade encontrada. Se a sua não aparece, fale com o suporte.</p>`;
    $("xc-l").querySelectorAll("[data-ver]").forEach(b => b.onclick = () => { XCID = +b.dataset.ver; fecharSheet(); toast(`Vendo ${xcidNome(XCID)}`); (depois || rerender)(); });
    $("xc-l").querySelectorAll("[data-minha]").forEach(b => b.onclick = () => { ME.cidade = +b.dataset.minha; XCID = null; save(); SOM.check(); fecharSheet(); toast("Cidade atualizada"); (depois || rerender)(); }); };
  $("xc-q").oninput = desenha; desenha();
}

/* ---------- Avaliações ---------- */
let AVM = { t: 0, m: {} };
async function medias(force){
  if(!force && Date.now() - AVM.t < 180000) return AVM.m;
  try{ const L = await XP.av.todas(); const m = {}; L.filter(a => !a.oculta).forEach(a => { const k = a.alvo_tipo + ":" + a.alvo_id; m[k] = m[k] || { s: 0, n: 0 }; m[k].s += +a.nota; m[k].n++; }); AVM = { t: Date.now(), m }; }catch(e){ AVM.t = Date.now(); }
  return AVM.m;
}
const notaFmt = x => (x.s / x.n).toFixed(1).replace(".", ",");
const notaHtml = (tipo, id) => { const x = AVM.m[tipo + ":" + id]; return x ? `<span class="xp-nota">★ ${notaFmt(x)} <small>(${x.n})</small></span>` : ""; };
const estrelas = n => `<span class="xp-est" aria-label="${n} de 5 estrelas">${[1,2,3,4,5].map(i => `<i class="${i <= n ? "on" : ""}">★</i>`).join("")}</span>`;
async function blocoAvaliacoes(el, tipo, id, nome){
  if(!el) return;
  el.innerHTML = `<div class="sec-title"><h3>Avaliações</h3><button class="btn btn-line btn-sm" id="xa-novo">${ic("star", 15)} Avaliar</button></div><div class="post skel" style="height:80px"></div>`;
  let L = [];
  try{ L = await XP.av.de(tipo, id); }catch(e){ el.innerHTML = `<div class="sec-title"><h3>Avaliações</h3></div><p class="hint">${XERR(e) ? XAVISO : "Não deu para carregar as avaliações agora."}</p>`; return; }
  const vis = L.filter(a => !a.oculta), media = vis.length ? vis.reduce((s, a) => s + +a.nota, 0) / vis.length : 0, minha = L.find(a => a.user_id === ME.id);
  el.innerHTML = `<div class="sec-title"><h3>Avaliações</h3><button class="btn btn-line btn-sm" id="xa-novo">${ic(minha ? "edit" : "star", 15)} ${minha ? "Editar a minha" : "Avaliar"}</button></div>
    ${vis.length ? `<div class="xp-media"><b>${media.toFixed(1).replace(".", ",")}</b>${estrelas(Math.round(media))}<small>${vis.length} ${vis.length === 1 ? "avaliação" : "avaliações"}</small></div>` : `<p class="hint" style="margin:6px 0">Ainda sem avaliações. Já foi atendida aqui? Conte como foi.</p>`}
    ${L.slice(0, 30).map(a => `<div class="xp-av"><div class="xp-avh">${avPost(a.nome, "")}<div><b>${esc(a.nome)}</b><small>${tempoAtras(a.criado)}${a.verificada ? ` · <span class="xp-verif">${ic("check", 12, 3)} Serviço realizado</span>` : ""}${a.oculta ? " · oculta pela moderação" : ""}</small></div>${estrelas(+a.nota)}</div>${a.texto ? `<p>${esc(a.texto)}</p>` : ""}
      ${a.user_id === ME.id ? `<button class="link" data-xadel="${a.id}">Excluir minha avaliação</button>` : `<button class="link xp-den" data-xaden="${a.id}">${ic("flag", 13)} Denunciar avaliação</button>`}</div>`).join("")}`;
  const volta = SHEET_ATUAL; $("xa-novo").onclick = () => avaliar(tipo, id, nome, minha, volta);
  el.querySelectorAll("[data-xaden]").forEach(b => b.onclick = () => { if(!confirm("Denunciar esta avaliação para a moderação?")) return; XP.av.denunciar(b.dataset.xaden).then(() => { toast("Obrigada. A moderação vai analisar."); b.remove(); }).catch(e => toast(XERR(e) ? XAVISO : "Não deu agora")); });
  el.querySelectorAll("[data-xadel]").forEach(b => b.onclick = () => { if(!confirm("Excluir sua avaliação?")) return; XP.av.apagar(b.dataset.xadel).then(() => { AVM.t = 0; toast("Avaliação excluída"); blocoAvaliacoes(el, tipo, id, nome); }).catch(() => toast("Não deu agora")); });
}
function avaliar(tipo, id, nome, minha, depois){
  let nota = minha ? +minha.nota : 0;
  sheet("Avaliar " + nome, `<p class="hint" style="margin:0">Sua avaliação aparece com seu nome para outras alunas. Seja sincera e respeitosa.</p>
    <div class="xp-estsel" id="xa-est">${[1,2,3,4,5].map(i => `<button data-n="${i}" aria-label="${i} estrelas">★</button>`).join("")}</div>
    <textarea class="input" id="xa-t" maxlength="600" placeholder="Conte como foi o atendimento (opcional)">${esc((minha && minha.texto) || "")}</textarea>
    <button class="btn btn-accent btn-block btn-lg" id="xa-ok">Publicar avaliação</button>`, depois || null);
  const pinta = () => $("xa-est").querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.n <= nota));
  $("xa-est").querySelectorAll("button").forEach(b => b.onclick = () => { nota = +b.dataset.n; SOM.tap(); pinta(); }); pinta();
  $("xa-ok").onclick = async () => { if(!nota) return toast("Escolha de 1 a 5 estrelas"); const b = $("xa-ok"); b.disabled = true;
    try{ await XP.av.salvar(tipo, id, nota, $("xa-t").value.trim()); AVM.t = 0; SOM.check(); toast("Avaliação publicada"); fecharSheet(); }
    catch(e){ console.warn(e); toast(XERR(e) ? XAVISO : "Não deu para publicar agora"); b.disabled = false; } };
}
/* lembra qual detalhe estava aberto, para voltar depois de avaliar/agendar */
let SHEET_ATUAL = null;

/* ---------- Favoritos ---------- */
const eFav = (t, id) => (ME.favx || []).includes(t + ":" + id);
function togFav(t, id, btn){ ME.favx = ME.favx || []; const k = t + ":" + id, on = !ME.favx.includes(k); ME.favx = ME.favx.filter(x => x !== k); if(on){ ME.favx.push(k); xev(t, id, "fav"); } save(); SOM.tap(); vibra(10); if(btn){ btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", on); } toast(on ? "Salvo nos favoritos" : "Removido dos favoritos"); }
const favBtn = (t, id) => `<button class="xp-fav ${eFav(t, id) ? "on" : ""}" data-fav="${t}|${id}" aria-label="Salvar nos favoritos" aria-pressed="${eFav(t, id)}">${ic("heart", 20)}</button>`;
function ligaFav(root){ root.querySelectorAll("[data-fav]").forEach(b => b.onclick = e => { e.stopPropagation(); const [t, id] = b.dataset.fav.split("|"); togFav(t, id, b); }); }

/* ---------- Listas visíveis ---------- */
const modoDe = p => p.modo || "presencial";
const eOnline = p => ["online","ambos"].includes(modoDe(p));
const ePresencial = p => ["presencial","ambos"].includes(modoDe(p));
const profOk = p => ativo(p) && (p.status || "ativo") === "ativo";
const naCidade = x => !x.cidade || +x.cidade === +cidadeVer();
const L_emp = () => DB.empresas.filter(ativo).filter(e => +e.cidade === +cidadeVer() || e.online).sort(ordena);
const L_prof = modo => DB.profissionais.filter(profOk).filter(p => modo === "online" ? eOnline(p) : modo === "presencial" ? ePresencial(p) && naCidade(p) : eOnline(p) || (ePresencial(p) && naCidade(p))).sort(ordena);
const donoDe = s => s.dono_tipo === "empresa" ? DB.empresas.find(e => e.id === s.dono) : DB.profissionais.find(p => p.id === s.dono);
const donoOk = s => { const d = donoDe(s); if(!d) return false; return s.dono_tipo === "empresa" ? ativo(d) && (+d.cidade === +cidadeVer() || ["online","ambos"].includes(s.modo)) : profOk(d) && (["online","ambos"].includes(s.modo || modoDe(d)) ? eOnline(d) || naCidade(d) : naCidade(d)); };
const L_serv = () => DB.servicos.filter(ativo).filter(donoOk).sort(ordena);
const L_prod = () => DB.produtos.filter(ativo).sort(ordena);
const L_parc = () => DB.parceiros.filter(p => p.ativo && (!p.validade || p.validade >= today()) && naCidade(p)).sort(ordena);
const modoTxt = m => ({ presencial: "Presencial", online: "Online", ambos: "Presencial e online" })[m] || "Presencial";
const precoHtml = (preco, promo) => { const p = +preco || 0, q = +promo || 0; if(!p && !q) return preco === 0 || preco === "0" ? `<b class="xp-preco">Grátis</b>` : ""; return q && q < p ? `<span class="xp-preco"><s>${brl(p)}</s> <b>${brl(q)}</b></span>` : `<b class="xp-preco">${brl(p || q)}</b>`; };
const valorDe = s => { const p = +s.preco || 0, q = +s.promo || 0; return q && q < p ? q : p; };
const ximg = (src, cls, ic0) => src ? `<span class="${cls}"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('xp-ph');this.remove()"></span>` : `<span class="${cls} xp-ph">${ic(ic0 || "leaf", 30, 1.6)}</span>`;
const inic = n => esc(String(n || "?").replace(/^Dra?\.\s*/, "").trim()[0] || "?");

/* ---------- Cartões ---------- */
const cardEmp = e => `<button class="xp-card" data-emp="${e.id}">${ximg(e.capa || e.logo, "xp-cimg", "home")}<span class="xp-cb"><b>${esc(e.nome)}</b><small>${esc(e.tipo || "")}${e.bairro ? " · " + esc(e.bairro) : ""}</small><span class="xp-tags">${e.parceira ? `<i class="xp-tag ok">Parceira CK</i>` : ""}${e.beneficio ? `<i class="xp-tag">${ic("gift", 12)} Benefício</i>` : ""}${notaHtml("empresa", e.id)}</span></span></button>`;
const cardProf = p => { const sv = DB.servicos.filter(s => ativo(s) && s.dono_tipo === "profissional" && s.dono === p.id), min = sv.length ? Math.min(...sv.map(valorDe).filter(v => v > 0)) : +p.valor || 0;
  return `<button class="xp-card xp-cprof" data-prof="${p.id}"><span class="xp-pav">${p.foto ? `<img src="${esc(p.foto)}" alt="" loading="lazy">` : inic(p.nome)}</span><span class="xp-cb"><b>${esc(p.nome)}${p.verificado ? ` <i class="xp-ver" title="Verificado">${ic("ok", 15)}</i>` : ""}</b><small>${esc(p.tipo || "")}</small><span class="xp-tags"><i class="xp-tag">${modoTxt(modoDe(p))}</i>${notaHtml("profissional", p.id)}</span>${isFinite(min) && min > 0 ? `<small class="xp-apartir">a partir de <b>${brl(min)}</b></small>` : ""}</span></button>`; };
const cardProd = p => `<button class="xp-card" data-prod="${p.id}">${ximg(p.foto, "xp-cimg xp-pimg", "bag")}<span class="xp-cb"><b>${esc(p.nome)}</b><small>${esc(p.marca || p.cat || "")}</small>${precoHtml(p.preco, p.promo)}</span></button>`;
const cardParc = p => `<button class="xp-card" data-parc="${p.id}">${ximg(p.logo, "xp-cimg xp-logoimg", "gift")}<span class="xp-cb"><b>${esc(p.nome)}</b><small>${esc(p.beneficio || (p.desconto ? p.desconto + "% de desconto" : ""))}</small><span class="xp-tags"><i class="xp-tag ok">${p.desconto ? p.desconto + "% off" : "Clube CK"}</i></span></span></button>`;
const servRow = s => { const d = donoDe(s) || {}; return `<div class="card xp-serv"><div><b>${esc(s.nome)}</b><small>${esc(d.nome || "")} · ${s.dur ? s.dur + " min · " : ""}${modoTxt(s.modo)}</small>${s.desc ? `<p class="hint" style="margin:4px 0 0">${esc(s.desc)}</p>` : ""}</div><div class="xp-servr">${precoHtml(s.preco, s.promo)}<button class="btn btn-accent btn-sm" data-agserv="${s.id}">Agendar</button></div></div>`; };
function ligaCards(root){
  root.querySelectorAll("[data-emp]").forEach(b => b.onclick = () => abrirEmp(b.dataset.emp));
  root.querySelectorAll("[data-prof]").forEach(b => b.onclick = () => abrirProf(b.dataset.prof));
  root.querySelectorAll("[data-prod]").forEach(b => b.onclick = () => abrirProd(b.dataset.prod));
  root.querySelectorAll("[data-parc]").forEach(b => b.onclick = () => abrirParc(b.dataset.parc));
  root.querySelectorAll("[data-agserv]").forEach(b => b.onclick = () => { const s = DB.servicos.find(x => x.id === b.dataset.agserv); if(s) agendar(s.dono_tipo, s.dono, s.id); });
  ligaBanners(root); ligaFav(root);
}

/* ---------- Banners ---------- */
function bannersDe(local){ const d = today(); return DB.banners.filter(b => ativo(b) && b.local === local && (!b.inicio || b.inicio <= d) && (!b.fim || b.fim >= d) && (!b.cidade || +b.cidade === +cidadeVer())).sort((a, b) => (+a.ordem || 0) - (+b.ordem || 0)); }
function bannersHtml(local){ const L = bannersDe(local); return L.length ? `<div class="hscroll xp-bans">${L.map(b => `<button class="xp-ban" data-ban="${b.id}">${ximg(b.img, "xp-bimg", "star")}<span class="xp-btx"><b>${esc(b.titulo)}</b>${b.texto ? `<small>${esc(b.texto)}</small>` : ""}</span></button>`).join("")}</div>` : ""; }
function ligaBanners(root){ root.querySelectorAll("[data-ban]").forEach(el => { const b = DB.banners.find(x => x.id === el.dataset.ban); if(!b) return; xev("ban", b.id, "ver"); el.onclick = () => abreBanner(b); }); }
function abreBanner(b){
  xev("ban", b.id, "clk"); SOM.tap();
  if(b.destino === "empresa") return abrirEmp(b.alvo);
  if(b.destino === "profissional") return abrirProf(b.alvo);
  if(b.destino === "produto") return abrirProd(b.alvo);
  if(b.destino === "clube"){ if(b.alvo) return abrirParc(b.alvo); XS.sec = "clube"; XS.q = ""; return tab("explorar"); }
  if(b.destino === "whatsapp") return window.open(lkWhats(b.url), "_blank", "noopener");
  if(b.url) window.open(lkSite(b.url), "_blank", "noopener");
}

/* ---------- EXPLORAR ---------- */
let XS = { sec: "inicio", q: "", cat: "", modo: "" };
const XSECS = [["inicio","Destaques"],["academias","Academias"],["profissionais","Profissionais"],["servicos","Serviços"],["clube","Clube CK"],["loja","Loja"]];
function rExplorar(){
  xpGarante();
  const tmp = XCID != null && +XCID !== +ME.cidade;
  $("t-explorar").innerHTML = `${capa("Explorar", "Academias, profissionais, benefícios e produtos para a sua evolução.", "", "img/ex-skater.jpg")}
    <div class="xp-cid">${ic("pin", 18)}<span>${tmp ? "Vendo agora" : "Minha cidade"}: <b>${esc(xcidNome(cidadeVer()) || "escolha")}</b></span>${tmp ? `<button class="link" id="xc-volta">Voltar</button>` : ""}<button class="btn btn-line btn-sm" id="xc-alt">Alterar</button></div>
    <div class="search">${ic("search", 18)}<input class="input" id="xq" type="search" placeholder="Buscar academia, profissional, serviço ou produto" value="${esc(XS.q)}" autocomplete="off"></div>
    <div class="chips scroll">${XSECS.map(([k, n]) => `<button class="chip" data-xs="${k}" aria-pressed="${!XS.q && XS.sec === k}">${n}</button>`).join("")}</div>
    <div id="xp-body" class="xp-body"></div>`;
  $("xc-alt").onclick = () => escolheCidade(rExplorar);
  const v = $("xc-volta"); if(v) v.onclick = () => { XCID = null; rExplorar(); };
  $("t-explorar").querySelectorAll("[data-xs]").forEach(b => b.onclick = () => { XS.sec = b.dataset.xs; XS.q = ""; XS.cat = ""; XS.modo = ""; SOM.tap(); rExplorar(); });
  let tq; $("xq").oninput = e => { clearTimeout(tq); tq = setTimeout(() => { XS.q = e.target.value.trim(); $("t-explorar").querySelectorAll("[data-xs]").forEach(b => b.setAttribute("aria-pressed", !XS.q && XS.sec === b.dataset.xs)); xpCorpo(); }, 220); };
  xpCorpo();
  medias().then(() => { if(TAB === "explorar" && $("xp-body")) xpCorpo(); });
}
const secTit = (t, sec, n) => `<div class="sec-title"><h3>${t}</h3>${sec && n > 3 ? `<button class="link" data-xver="${sec}">Ver tudo</button>` : ""}</div>`;
const vazio = (txt, extra) => `<div class="card empty xp-vazio">${ic("explorar", 32, 1.6)}<b>${txt}</b>${extra || ""}</div>`;
const grade = L => `<div class="xp-grid">${L.join("")}</div>`;
const chipsCat = (L, cur) => L.length > 1 ? `<div class="chips scroll">${["", ...L].map(c => `<button class="chip" data-xcat="${esc(c)}" aria-pressed="${norm(cur) === norm(c)}">${c ? esc(c) : "Todas"}</button>`).join("")}</div>` : "";
function xpCorpo(){
  const el = $("xp-body"); if(!el) return;
  const cid = esc(xcidNome(cidadeVer()) || "sua cidade");
  let h = "";
  if(XS.q){
    const q = norm(XS.q), tem = x => norm([x.nome, x.tipo, x.cat, x.desc, x.marca, x.bairro, x.modalidades, x.beneficio].filter(Boolean).join(" ")).includes(q);
    const E = L_emp().filter(tem), Pf = L_prof().filter(tem), S = L_serv().filter(s => tem(s) || tem(donoDe(s) || {})), Pr = L_prod().filter(tem), C = L_parc().filter(tem);
    const n = E.length + Pf.length + S.length + Pr.length + C.length;
    h = n ? `${E.length ? secTit("Academias e lugares") + grade(E.map(cardEmp)) : ""}${Pf.length ? secTit("Profissionais") + grade(Pf.map(cardProf)) : ""}${S.length ? secTit("Serviços") + S.map(servRow).join("") : ""}${C.length ? secTit("Clube CK") + grade(C.map(cardParc)) : ""}${Pr.length ? secTit("Loja") + grade(Pr.map(cardProd)) : ""}`
      : vazio(`Nada encontrado para “${esc(XS.q)}”.`, `<p>Tente outra palavra ou veja os destaques.</p>`);
  } else if(XS.sec === "inicio"){
    const E = L_emp(), perto = [...E.map(cardEmp), ...L_prof("presencial").filter(p => p.cidade && +p.cidade === +cidadeVer()).map(cardProf)];
    const on = L_prof("online"), C = L_parc(), Pr = L_prod();
    h = `${bannersHtml("explorar")}
      ${secTit("Perto de você", "academias", perto.length)}${perto.length ? `<div class="hscroll xp-row">${perto.slice(0, 10).join("")}</div>` : vazio(`Ainda não temos parceiros em ${cid}.`, `<p>Enquanto isso, veja o atendimento online, que vale para todo o Brasil.</p>`)}
      ${secTit("Atendimento online", "profissionais", on.length)}${on.length ? `<div class="hscroll xp-row">${on.slice(0, 10).map(cardProf).join("")}</div>` : vazio("Ainda não temos profissionais online.")}
      ${secTit("Clube CK", "clube", C.length)}${C.length ? `<div class="hscroll xp-row">${C.slice(0, 10).map(cardParc).join("")}</div>` : vazio(`Ainda não temos benefícios em ${cid}.`)}
      ${secTit("Loja CK", "loja", Pr.length)}${Pr.length ? `<div class="hscroll xp-row">${Pr.slice(0, 10).map(cardProd).join("")}</div>` : vazio("A loja está sendo preparada.")}`;
  } else if(XS.sec === "academias"){
    const E = L_emp(), cats = xcats("empresa").filter(c => E.some(e => mesmaCat(e.tipo, c))), L = XS.cat ? E.filter(e => mesmaCat(e.tipo, XS.cat)) : E;
    h = `${chipsCat(cats, XS.cat)}${L.length ? grade(L.map(cardEmp)) : vazio(`Ainda não temos academias parceiras em ${cid}.`, `<button class="btn btn-line btn-sm" data-xcid>Ver outra cidade</button>`)}`;
  } else if(XS.sec === "profissionais"){
    const B = L_prof(XS.modo), cats = xcats("prof").filter(c => B.some(p => mesmaCat(p.tipo, c))), L = XS.cat ? B.filter(p => mesmaCat(p.tipo, XS.cat)) : B;
    h = `<div class="seg seg-sm">${[["","Todos"],["presencial","Presencial"],["online","Online"]].map(([k, n]) => `<button data-xmodo="${k}" aria-pressed="${XS.modo === k}">${n}</button>`).join("")}</div>${chipsCat(cats, XS.cat)}
      ${L.length ? grade(L.map(cardProf)) : vazio(XS.modo === "presencial" ? `Ainda não temos profissionais presenciais em ${cid}.` : "Nenhum profissional encontrado.", XS.modo !== "online" ? `<button class="btn btn-line btn-sm" data-xmodo-on>Ver atendimento online</button>` : "")}`;
  } else if(XS.sec === "servicos"){
    const B = L_serv(), L = XS.modo ? B.filter(s => (s.modo || "presencial") === XS.modo || s.modo === "ambos") : B;
    h = `<div class="seg seg-sm">${[["","Todos"],["presencial","Presencial"],["online","Online"]].map(([k, n]) => `<button data-xmodo="${k}" aria-pressed="${XS.modo === k}">${n}</button>`).join("")}</div>${L.length ? L.map(servRow).join("") : vazio(`Ainda não temos serviços para agendar em ${cid}.`)}`;
  } else if(XS.sec === "clube"){
    const C = L_parc();
    h = `${bannersHtml("clube")}<div class="xp-clubehead">${ic("gift", 26)}<div><b>Clube CK</b><p>Descontos e vantagens em parceiros. ${C.some(p => !p.livre) ? `Alguns benefícios você ganha treinando: a cada ${DB.config.treinosParaCupom || 8} treinos, um cupom novo.` : ""}</p></div></div>
      ${C.length ? grade(C.map(cardParc)) : vazio(`Ainda não temos benefícios em ${cid}.`, `<button class="btn btn-line btn-sm" data-xcid>Ver outra cidade</button>`)}`;
  } else if(XS.sec === "loja"){
    const B = L_prod(), cats = xcats("produto").filter(c => B.some(p => mesmaCat(p.cat, c))), L = XS.cat ? B.filter(p => mesmaCat(p.cat, XS.cat)) : B;
    h = `${bannersHtml("loja")}${chipsCat(cats, XS.cat)}${L.length ? grade(L.map(cardProd)) : vazio("A loja está sendo preparada. Volte em breve!")}<p class="hint" style="text-align:center">A compra é feita no site da loja. Alguns links são de parceiros ou afiliados.</p>`;
  }
  el.innerHTML = h;
  ligaCards(el);
  el.querySelectorAll("[data-xver]").forEach(b => b.onclick = () => { XS.sec = b.dataset.xver; XS.cat = ""; XS.modo = b.dataset.xver === "profissionais" && b.closest(".xp-body") && b.parentNode.textContent.includes("online") ? "online" : ""; rExplorar(); });
  el.querySelectorAll("[data-xcat]").forEach(b => b.onclick = () => { XS.cat = b.dataset.xcat; SOM.tap(); xpCorpo(); });
  el.querySelectorAll("[data-xmodo]").forEach(b => b.onclick = () => { XS.modo = b.dataset.xmodo; XS.cat = ""; SOM.tap(); xpCorpo(); });
  el.querySelectorAll("[data-xmodo-on]").forEach(b => b.onclick = () => { XS.sec = "profissionais"; XS.modo = "online"; XS.cat = ""; rExplorar(); });
  el.querySelectorAll("[data-xcid]").forEach(b => b.onclick = () => escolheCidade(rExplorar));
}

/* ---------- Detalhes ---------- */
const botao = (cls, icone, txt, attr) => `<button class="btn ${cls}" ${attr}>${ic(icone, 17)} ${txt}</button>`;
function acoesContato(x, t, extra){
  const b = [];
  if(x.whats) b.push(botao("btn-line", "whats", "WhatsApp", `data-lk="whats"`));
  if(x.insta) b.push(botao("btn-line", "insta", "Instagram", `data-lk="insta"`));
  if(x.site) b.push(botao("btn-line", "globe", "Site", `data-lk="site"`));
  if(x.end) b.push(botao("btn-line", "pin", "Como chegar", `data-lk="mapa"`));
  return (extra || "") + (b.length ? `<div class="xp-acts">${b.join("")}</div>` : "");
}
function ligaContato(root, x, t){
  const L = { whats: () => lkWhats(x.whats, x.msg), insta: () => lkInsta(x.insta), site: () => lkSite(x.site), mapa: () => lkMapa(x.end, x.cidade) };
  root.querySelectorAll("[data-lk]").forEach(b => b.onclick = () => abreLink(L[b.dataset.lk](), t, x.id, b.dataset.lk));
}
function detalheSheet(titulo, html, reabre){ SHEET_ATUAL = reabre; sheet(titulo, html, () => { if(TAB === "explorar" && $("xp-body")) xpCorpo(); }); }
function abrirEmp(id){
  const e = DB.empresas.find(x => x.id === id); if(!e || !ativo(e)) return toast("Este lugar não está mais disponível");
  xev("emp", e.id, "ver");
  const sv = DB.servicos.filter(s => ativo(s) && s.dono_tipo === "empresa" && s.dono === e.id).sort(ordena);
  detalheSheet(e.nome, `<div class="xp-hero">${ximg(e.capa || e.logo, "xp-himg", "home")}${e.logo ? `<img class="xp-hlogo" src="${esc(e.logo)}" alt="">` : ""}${favBtn("emp", e.id)}</div>
    <div class="xp-dh"><h2>${esc(e.nome)}</h2><p class="muted">${esc(e.tipo || "")}${e.bairro ? " · " + esc(e.bairro) : ""}${xcidNome(e.cidade) ? " · " + esc(xcidNome(e.cidade)) : ""}</p>
    <div class="xp-tags">${e.parceira ? `<i class="xp-tag ok">Parceira CK</i>` : ""}${e.destaque ? `<i class="xp-tag">${ic("star", 12)} Destaque</i>` : ""}${notaHtml("empresa", e.id)}</div></div>
    ${e.beneficio ? `<div class="xp-benef">${ic("gift", 22)}<div><b>Benefício CK Life</b><p>${esc(e.beneficio)}</p><small>Mostre o app na recepção.</small></div></div>` : ""}
    ${acoesContato(e, "emp", sv.length ? `<button class="btn btn-accent btn-block btn-lg" id="xd-ag">${ic("calendar", 18)} Agendar visita ou aula</button>` : "")}
    ${e.desc ? `<p>${esc(e.desc)}</p>` : ""}
    <div class="card xp-info">${e.end ? `<div>${ic("pin", 17)}<span><b>Endereço</b>${esc(e.end)}</span></div>` : ""}${e.horario ? `<div>${ic("clock", 17)}<span><b>Horário</b>${esc(e.horario)}</span></div>` : ""}${e.modalidades ? `<div>${ic("treinar", 17)}<span><b>Modalidades</b>${esc(e.modalidades)}</span></div>` : ""}${e.planos ? `<div>${ic("tag", 17)}<span><b>Planos</b>${esc(e.planos)}</span></div>` : ""}</div>
    ${(e.galeria || []).length ? `<h3>Fotos</h3><div class="hscroll xp-gal">${e.galeria.map(g => `<img src="${esc(g)}" alt="" loading="lazy" onerror="this.remove()">`).join("")}</div>` : ""}
    ${sv.length ? `<h3>Serviços</h3>${sv.map(servRow).join("")}` : ""}
    <div id="xd-av" class="xp-avs"></div>`, () => abrirEmp(id));
  const b = $("sheet-body"); ligaContato(b, e, "emp"); ligaFav(b); ligaCards(b);
  const ag = $("xd-ag"); if(ag) ag.onclick = () => agendar("empresa", e.id, sv.length === 1 ? sv[0].id : null);
  blocoAvaliacoes($("xd-av"), "empresa", e.id, e.nome);
}
function abrirProf(id){
  const p = DB.profissionais.find(x => x.id === id); if(!p || !profOk(p)) return toast("Este profissional não está disponível");
  xev("prof", p.id, "ver");
  const sv = DB.servicos.filter(s => ativo(s) && s.dono_tipo === "profissional" && s.dono === p.id).sort(ordena);
  const pres = ePresencial(p) && (naCidade(p) || !p.cidade), onl = eOnline(p);
  detalheSheet(p.nome, `<div class="xp-ph-top"><span class="xp-pav xl">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : inic(p.nome)}</span>${favBtn("prof", p.id)}</div>
    <div class="xp-dh" style="text-align:center"><h2>${esc(p.nome)}${p.verificado ? ` <i class="xp-ver" title="Verificado pela CK Life">${ic("ok", 20)}</i>` : ""}</h2><p class="muted">${esc(p.tipo || "")}${p.registro ? " · " + esc(p.registro) : ""}</p>
      <div class="xp-tags" style="justify-content:center"><i class="xp-tag">${modoTxt(modoDe(p))}</i>${p.cidade ? `<i class="xp-tag">${ic("pin", 12)} ${esc(xcidNome(p.cidade))}</i>` : ""}${notaHtml("profissional", p.id)}</div></div>
    <div class="xp-acts xp-acts-main">${pres ? `<button class="btn btn-accent btn-lg" id="xd-agp">${ic("calendar", 18)} Agendar</button>` : ""}${onl ? `<button class="btn ${pres ? "btn-ink" : "btn-accent"} btn-lg" id="xd-ago">${ic("chat", 18)} Agendar online</button>` : ""}</div>
    ${acoesContato(p, "prof")}
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ""}
    ${p.verificado ? `<p class="hint">${ic("ok", 14)} Registro profissional conferido pela equipe CK Life.</p>` : ""}
    ${sv.length ? `<h3>Serviços e valores</h3>${sv.map(servRow).join("")}` : p.valor ? `<div class="card xp-serv"><div><b>Atendimento</b><small>${modoTxt(modoDe(p))}</small></div><div class="xp-servr">${precoHtml(p.valor)}</div></div>` : ""}
    <div id="xd-av" class="xp-avs"></div>`, () => abrirProf(id));
  const b = $("sheet-body"); ligaContato(b, p, "prof"); ligaFav(b); ligaCards(b);
  const a1 = $("xd-agp"); if(a1) a1.onclick = () => agendar("profissional", p.id, null, "presencial");
  const a2 = $("xd-ago"); if(a2) a2.onclick = () => agendar("profissional", p.id, null, "online");
  blocoAvaliacoes($("xd-av"), "profissional", p.id, p.nome);
}
const TIPO_PROD = { proprio: "Produto CK Life", parceiro: "Loja parceira", afiliado: "Link de afiliado" };
function abrirProd(id){
  const p = DB.produtos.find(x => x.id === id); if(!p || !ativo(p)) return toast("Produto indisponível");
  xev("prod", p.id, "ver");
  detalheSheet(p.nome, `<div class="xp-hero">${ximg(p.foto, "xp-himg xp-pimg", "bag")}${favBtn("prod", p.id)}</div>
    <div class="xp-dh"><h2>${esc(p.nome)}</h2><p class="muted">${esc(p.marca || "")}${p.cat ? " · " + esc(p.cat) : ""}</p>${precoHtml(p.preco, p.promo)}</div>
    <button class="btn btn-accent btn-block btn-lg" id="xd-buy">${ic("bag", 18)} ${esc(p.botao || (p.tipo === "afiliado" ? "VER PRODUTO" : "COMPRAR"))}</button>
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ""}
    <p class="hint">${ic("shield", 14)} ${esc(TIPO_PROD[p.tipo] || "Loja parceira")}. A compra é feita no site da loja, não pelo app.${p.tipo === "afiliado" ? " A CK Life pode receber uma comissão, sem custo extra para você." : ""}</p>
    <div id="xd-av" class="xp-avs"></div>`, () => abrirProd(id));
  const b = $("sheet-body"); ligaFav(b);
  $("xd-buy").onclick = () => abreLink(lkSite(p.url), "prod", p.id, "comprar");
  blocoAvaliacoes($("xd-av"), "produto", p.id, p.nome);
}
function abrirParc(id){
  const p = DB.parceiros.find(x => x.id === id); if(!p || !p.ativo) return toast("Benefício indisponível");
  xev("parc", p.id, "ver");
  const meu = (DB.cupons || []).find(c => c.parc === p.id && c.user === ME.id && !c.usado), meta = DB.config.treinosParaCupom || 8, falta = meta - ((ME.treinos || []).length % meta);
  detalheSheet(p.nome, `<div class="xp-hero xp-hero-sm">${ximg(p.logo, "xp-himg xp-logoimg", "gift")}${favBtn("parc", p.id)}</div>
    <div class="xp-dh"><h2>${esc(p.nome)}</h2><p class="muted">${esc(p.cat || "Clube CK")}${xcidNome(p.cidade) ? " · " + esc(xcidNome(p.cidade)) : ""}</p></div>
    <div class="xp-benef">${ic("gift", 22)}<div><b>${esc(p.beneficio || (p.desconto + "% de desconto"))}</b>${p.regras ? `<p>${esc(p.regras)}</p>` : ""}<small>${p.validade ? "Válido até " + brD(p.validade) : "Sem data de validade"}</small></div></div>
    ${meu ? `<div class="coupon"><b>Seu cupom</b><span class="code">${esc(meu.codigo)}</span><span class="hint">Na loja, abra Perfil › Meus cupons e peça para o atendente digitar o PIN.</span></div>`
      : p.livre ? `<button class="btn btn-accent btn-block btn-lg" id="xd-cup">${ic("tag", 18)} Pegar meu cupom</button>`
      : `<div class="card"><b>Ganhe treinando</b><p class="hint" style="margin:6px 0 0">Este benefício vem como prêmio: a cada ${meta} treinos você ganha um cupom. Faltam ${falta} ${falta === 1 ? "treino" : "treinos"}.</p></div>`}
    ${acoesContato({ ...p, whats: p.whats || "", end: p.end }, "parc")}
    ${p.desc ? `<p>${esc(p.desc)}</p>` : ""}
    <div id="xd-av" class="xp-avs"></div>`, () => abrirParc(id));
  const b = $("sheet-body"); ligaContato(b, p, "parc"); ligaFav(b);
  const cu = $("xd-cup"); if(cu) cu.onclick = () => {
    if(ME.bloqueado) return toast("Sua conta está bloqueada");
    DB.cupons.push({ id: uid(), parc: p.id, user: ME.id, codigo: "CK" + Math.random().toString(36).slice(2, 7).toUpperCase(), d: today(), usado: false, usadoEm: "", clube: true });
    xev("parc", p.id, "cupom"); save(); SOM.coupon(); toast("Cupom liberado! Ele fica em Perfil › Meus cupons."); abrirParc(id); };
  blocoAvaliacoes($("xd-av"), "clube", p.id, p.nome);
}

/* ---------- AGENDAMENTO: serviço → data → horário → revisão → confirmação ---------- */
const DCOD = ["SU","MO","TU","WE","TH","FR","SA"];
const minDe = h => { const [a, b] = String(h || "0:0").split(":").map(Number); return a * 60 + (b || 0); };
const hDe = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
function agendar(tipo, donoId, servId, modoPref){
  const dono = tipo === "profissional" ? DB.profissionais.find(p => p.id === donoId) : DB.empresas.find(e => e.id === donoId);
  if(!dono) return toast("Indisponível no momento");
  if(ME.bloqueado) return toast("Sua conta está bloqueada");
  let servs = DB.servicos.filter(s => ativo(s) && s.dono_tipo === tipo && s.dono === donoId).sort(ordena);
  if(modoPref) servs = servs.filter(s => (s.modo || "presencial") === modoPref || s.modo === "ambos");
  const generico = { id: "", nome: tipo === "profissional" ? "Atendimento" : "Visita", preco: dono.valor || "", promo: "", dur: 60, modo: modoPref || modoDe(dono) };
  const A = { tipo, dono, servs, serv: servs.find(s => s.id === servId) || (servs.length === 1 ? servs[0] : servs.length ? null : generico), data: "", hora: "", modo: modoPref || "", obs: "", ocup: [], passo: 0 };
  A.passo = A.serv ? 1 : 0;
  const ag = dono.agenda || { dias: ["MO","TU","WE","TH","FR"], ini: "08:00", fim: "18:00", passo: 60 };
  A.datas = []; for(let i = 0; i < 30 && A.datas.length < 18; i++){ const d = addD(today(), i), w = new Date(d + "T12:00:00").getDay(); if((ag.dias || []).includes(DCOD[w])) A.datas.push(d); }
  A.ag = ag;
  XP.ag.ocupados(tipo, donoId, today(), addD(today(), 31)).then(L => { A.ocup = L || []; if(A.passo === 2) passoAg(A); });
  passoAg(A);
}
function horariosDe(A){
  const ag = A.ag, dur = +A.serv.dur || 60, passo = +ag.passo || 60, out = [], ini = minDe(ag.ini || "08:00"), fim = minDe(ag.fim || "18:00");
  const agoraMin = new Date().getHours() * 60 + new Date().getMinutes() + 60;
  for(let m = ini; m + Math.min(dur, passo) <= fim; m += passo){ const h = hDe(m); if(A.data === today() && m < agoraMin) continue; out.push({ h, livre: !A.ocup.some(o => String(o.data) === A.data && String(o.hora) === h) }); }
  return out;
}
function passoAg(A){
  const nomes = ["Serviço","Data","Horário","Revisão"], s = A.serv, titulo = `Agendar · ${A.dono.nome}`;
  const topo = `<div class="xp-steps">${nomes.map((n, i) => `<span class="${i < A.passo ? "ok" : i === A.passo ? "on" : ""}">${i < A.passo ? ic("check", 12, 3) : i + 1}<b>${n}</b></span>`).join("")}</div>`;
  let h = "";
  if(A.passo === 0){
    h = `<h3>Escolha o serviço</h3>${A.servs.map(x => `<button class="card xp-opt" data-sv="${x.id}"><span><b>${esc(x.nome)}</b><small>${x.dur ? x.dur + " min · " : ""}${modoTxt(x.modo)}</small></span>${precoHtml(x.preco, x.promo)}</button>`).join("")}`;
  } else if(A.passo === 1){
    h = `<h3>Escolha a data</h3>${A.datas.length ? `<div class="xp-datas">${A.datas.map(d => { const dt = new Date(d + "T12:00:00"); return `<button data-dt="${d}" aria-pressed="${A.data === d}"><small>${dt.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</small><b>${dt.getDate()}</b><small>${dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</small></button>`; }).join("")}</div>` : `<p class="empty">Sem datas disponíveis nas próximas semanas. Fale pelo WhatsApp.</p>`}`;
  } else if(A.passo === 2){
    const H = horariosDe(A);
    h = `<h3>Escolha o horário</h3><p class="hint" style="margin:0 0 8px">${brD(A.data)} · horário de Cuiabá/local do atendimento</p>${H.length ? `<div class="xp-horas">${H.map(x => `<button data-hr="${x.h}" ${x.livre ? "" : "disabled"} aria-pressed="${A.hora === x.h}">${x.h}</button>`).join("")}</div>` : `<p class="empty">Nenhum horário livre neste dia. Escolha outra data.</p>`}`;
  } else if(A.passo === 3){
    const temDois = s.modo === "ambos" || (!s.id && modoDe(A.dono) === "ambos");
    if(!A.modo) A.modo = s.modo && s.modo !== "ambos" ? s.modo : (temDois ? "presencial" : modoDe(A.dono) === "online" ? "online" : "presencial");
    h = `<h3>Confira e confirme</h3><div class="card xp-rev">
        <div><span>Com</span><b>${esc(A.dono.nome)}</b></div><div><span>Serviço</span><b>${esc(s.nome)}</b></div>
        <div><span>Data</span><b>${new Date(A.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</b></div><div><span>Horário</span><b>${A.hora}</b></div>
        ${valorDe(s) ? `<div><span>Valor</span><b>${brl(valorDe(s))}</b></div>` : ""}${s.dur ? `<div><span>Duração</span><b>${s.dur} min</b></div>` : ""}
        ${A.modo === "presencial" && A.dono.end ? `<div><span>Local</span><b>${esc(A.dono.end)}</b></div>` : ""}</div>
      ${temDois ? `<div class="seg">${["presencial","online"].map(m => `<button data-md="${m}" aria-pressed="${A.modo === m}">${modoTxt(m)}</button>`).join("")}</div>` : ""}
      <div class="field"><label for="xg-o">Observação (opcional)</label><textarea class="input" id="xg-o" maxlength="500" placeholder="Ex.: primeira vez, tenho dor no joelho...">${esc(A.obs)}</textarea></div>
      <p class="hint">${ic("shield", 14)} O pedido fica como <b>Solicitado</b> até a confirmação. Nenhum pagamento é feito pelo app.</p>
      <button class="btn btn-accent btn-block btn-lg" id="xg-ok">Confirmar agendamento</button>`;
  }
  sheet(titulo, topo + h + (A.passo > (A.servs.length > 1 ? 0 : 1) ? `<button class="btn btn-line btn-block" id="xg-volta">${ic("back", 16)} Voltar</button>` : ""));
  const b = $("sheet-body");
  b.querySelectorAll("[data-sv]").forEach(x => x.onclick = () => { A.serv = A.servs.find(s => s.id === x.dataset.sv); A.passo = 1; SOM.tap(); passoAg(A); });
  b.querySelectorAll("[data-dt]").forEach(x => x.onclick = () => { A.data = x.dataset.dt; A.hora = ""; A.passo = 2; SOM.tap(); passoAg(A); });
  b.querySelectorAll("[data-hr]").forEach(x => x.onclick = () => { A.hora = x.dataset.hr; A.passo = 3; SOM.tap(); passoAg(A); });
  b.querySelectorAll("[data-md]").forEach(x => x.onclick = () => { A.obs = $("xg-o").value; A.modo = x.dataset.md; passoAg(A); });
  const v = $("xg-volta"); if(v) v.onclick = () => { if(A.passo === 3 && $("xg-o")) A.obs = $("xg-o").value; A.passo = Math.max(A.servs.length > 1 ? 0 : 1, A.passo - 1); passoAg(A); };
  const ok = $("xg-ok"); if(ok) ok.onclick = async () => {
    ok.disabled = true; ok.classList.add("carregando");
    try{
      const a = await XP.ag.criar({ alvo_tipo: A.tipo, alvo_id: A.dono.id, alvo_nome: A.dono.nome, servico_id: s.id || "", servico_nome: s.nome, data: A.data, hora: A.hora, preco: valorDe(s) || null, modo: A.modo, local: A.modo === "online" ? "Online" : A.dono.end || "", obs: $("xg-o").value.trim() });
      xev(A.tipo === "empresa" ? "emp" : "prof", A.dono.id, "agendar"); SOM.done ? SOM.done() : SOM.check(); vibra([60, 40, 60]);
      const msg = `Olá! Fiz uma solicitação pelo CK Life: ${s.nome} em ${brD(A.data)} às ${A.hora} (${modoTxt(A.modo).toLowerCase()}). Meu nome é ${ME.nome}.`;
      sheet("Agendamento solicitado", `<div class="xp-okhero">${ic("check", 44, 3)}<h2>Pedido enviado!</h2><p>${esc(s.nome)} com ${esc(A.dono.nome)}<br><b>${brD(A.data)} às ${A.hora}</b></p><span class="st warn">Solicitado</span></div>
        <p class="hint" style="text-align:center">Você recebe a confirmação pela equipe. Acompanhe em Perfil › Meus agendamentos.</p>
        ${A.dono.whats ? `<a class="btn btn-accent btn-block btn-lg" href="${esc(lkWhats(A.dono.whats, msg))}" target="_blank" rel="noopener" id="xg-wa">${ic("whats", 18)} Avisar pelo WhatsApp</a>` : ""}
        <button class="btn btn-line btn-block" id="xg-meus">Ver meus agendamentos</button>`);
      const wa = $("xg-wa"); if(wa) wa.onclick = () => xev(A.tipo === "empresa" ? "emp" : "prof", A.dono.id, "whats");
      $("xg-meus").onclick = () => meusAgendamentos();
      void a;
    }catch(e){ console.warn(e); ok.disabled = false; ok.classList.remove("carregando"); toast(XERR(e) ? XAVISO : "Não deu para agendar agora. Tente de novo."); }
  };
}
const STAG = { solicitado: ["Solicitado","warn"], confirmado: ["Confirmado","ok"], concluido: ["Concluído","ok"], cancelado: ["Cancelado","off"], faltou: ["Não compareceu","bad"] };
let MAV = "prox";
async function meusAgendamentos(){
  sheet("Meus agendamentos", `<div class="seg">${[["prox","Próximos"],["conc","Concluídos"],["canc","Cancelados"]].map(([k, n]) => `<button data-ma="${k}" aria-pressed="${MAV === k}">${n}</button>`).join("")}</div><div id="ma-l"><div class="post skel" style="height:90px"></div></div>`);
  $("sheet-body").querySelectorAll("[data-ma]").forEach(b => b.onclick = () => { MAV = b.dataset.ma; meusAgendamentos(); });
  let L = [];
  try{ L = await XP.ag.listar(); }catch(e){ $("ma-l").innerHTML = `<p class="empty">${XERR(e) ? XAVISO : "Sem conexão agora."}</p>`; return; }
  const hoje = today(), F = { prox: a => ["solicitado","confirmado"].includes(a.status) && a.data >= hoje, conc: a => a.status === "concluido" || a.status === "faltou" || (["solicitado","confirmado"].includes(a.status) && a.data < hoje), canc: a => a.status === "cancelado" }[MAV];
  const V = L.filter(F).sort((a, b) => MAV === "prox" ? (a.data + a.hora).localeCompare(b.data + b.hora) : (b.data + b.hora).localeCompare(a.data + a.hora));
  const el = $("ma-l"); if(!el) return;
  el.innerHTML = V.length ? V.map(a => { const st = STAG[a.status] || ["", ""], dt = new Date(a.data + "T12:00:00"), dono = a.alvo_tipo === "profissional" ? DB.profissionais.find(p => p.id === a.alvo_id) : DB.empresas.find(e => e.id === a.alvo_id);
    return `<div class="card xp-agcard"><div class="xp-agd"><b>${dt.getDate()}</b><small>${dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</small><small>${esc(a.hora)}</small></div><div class="xp-agi"><b>${esc(a.servico_nome || "Atendimento")}</b><small>${esc(a.alvo_nome || "")} · ${modoTxt(a.modo)}</small><span class="st ${st[1]}">${st[0]}</span>${a.nota_adm ? `<small class="hint">${esc(a.nota_adm)}</small>` : ""}
      <div class="acts">${MAV === "prox" ? `<button class="btn btn-line btn-sm" data-cancel="${a.id}">Cancelar</button>` : ""}${dono && dono.whats ? `<a class="btn btn-line btn-sm" href="${esc(lkWhats(dono.whats, `Olá! Sobre meu agendamento pelo CK Life: ${a.servico_nome || ""} em ${brD(a.data)} às ${a.hora}.`))}" target="_blank" rel="noopener">WhatsApp</a>` : ""}${a.status === "concluido" && dono ? `<button class="btn btn-accent btn-sm" data-avag="${a.alvo_tipo}|${a.alvo_id}">Avaliar</button>` : ""}${MAV !== "prox" && dono ? `<button class="btn btn-line btn-sm" data-denovo="${a.alvo_tipo}|${a.alvo_id}|${a.servico_id || ""}">Agendar de novo</button>` : ""}</div></div></div>`; }).join("")
    : `<div class="empty">${ic("calendar", 32, 1.6)}<p>${MAV === "prox" ? "Nenhum agendamento marcado." : MAV === "conc" ? "Nenhum atendimento concluído ainda." : "Nenhum agendamento cancelado."}</p>${MAV === "prox" ? `<button class="btn btn-accent btn-sm" id="ma-exp">Encontrar profissionais</button>` : ""}</div>`;
  const ex = $("ma-exp"); if(ex) ex.onclick = () => { fecharSheet(); XS.sec = "profissionais"; XS.q = ""; tab("explorar"); };
  el.querySelectorAll("[data-cancel]").forEach(b => b.onclick = () => { if(!confirm("Cancelar este agendamento?")) return; XP.ag.status(b.dataset.cancel, "cancelado").then(() => { toast("Agendamento cancelado"); meusAgendamentos(); }).catch(e => toast(XERR(e) ? XAVISO : "Não deu agora")); });
  el.querySelectorAll("[data-avag]").forEach(b => b.onclick = () => { const [t, id] = b.dataset.avag.split("|"), d = t === "profissional" ? DB.profissionais.find(p => p.id === id) : DB.empresas.find(e => e.id === id); avaliar(t, id, d.nome, null, () => meusAgendamentos()); });
  el.querySelectorAll("[data-denovo]").forEach(b => b.onclick = () => { const [t, id, sv] = b.dataset.denovo.split("|"); agendar(t, id, sv || null); });
}

/* ---------- Meus favoritos ---------- */
function meusFavoritos(){
  const F = (ME.favx || []).map(k => { const [t, id] = k.split(":"); const x = t === "emp" ? DB.empresas.find(e => e.id === id) : t === "prof" ? DB.profissionais.find(p => p.id === id) : t === "prod" ? DB.produtos.find(p => p.id === id) : t === "parc" ? DB.parceiros.find(p => p.id === id) : null; return x ? [t, x] : null; }).filter(Boolean);
  const card = ([t, x]) => t === "emp" ? cardEmp(x) : t === "prof" ? cardProf(x) : t === "prod" ? cardProd(x) : cardParc(x);
  sheet("Meus favoritos", F.length ? grade(F.map(card)) : `<div class="empty">${ic("heart", 34, 1.6)}<p>Toque no coração em academias, profissionais, produtos e benefícios para salvar aqui.</p><button class="btn btn-accent btn-sm" id="mf-exp">Ir para o Explorar</button></div>`);
  ligaCards($("sheet-body")); const b = $("mf-exp"); if(b) b.onclick = () => { fecharSheet(); tab("explorar"); };
}

/* ===================== MEU CICLO (opcional, privado; só a própria aluna vê) ===================== */
let CIC = null, CIC_OK = false, CIC_ERR = "";
async function cicloCarrega(force){
  if(CIC_OK && !force) return CIC;
  try{ CIC = await XP.ciclo.ler(); CIC_OK = true; CIC_ERR = ""; }catch(e){ CIC_ERR = XERR(e) ? XAVISO : "Sem conexão agora."; }
  return CIC;
}
async function cicloGrava(){ try{ CIC.atualizado = today(); await XP.ciclo.gravar(CIC); return true; }catch(e){ console.warn(e); toast(XERR(e) ? XAVISO : "Sem conexão. Tente de novo."); return false; } }
const dd = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 864e5);
function cicloCalc(c){
  if(!c) return null;
  const per = (c.periodos || []).filter(p => p && p.ini).slice().sort((a, b) => a.ini.localeCompare(b.ini));
  const ult = per.length ? per[per.length - 1] : (c.ultima ? { ini: c.ultima } : null); if(!ult) return null;
  const gaps = []; for(let i = 1; i < per.length; i++){ const g = dd(per[i - 1].ini, per[i].ini); if(g >= 15 && g <= 60) gaps.push(g); }
  const media = gaps.length >= 2 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : (+c.ciclo || 28);
  const durs = per.filter(p => p.fim).map(p => dd(p.ini, p.fim) + 1).filter(n => n >= 1 && n <= 12);
  const dur = durs.length >= 2 ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : (+c.dur || 5);
  const varia = gaps.length >= 2 ? Math.max(...gaps) - Math.min(...gaps) : null;
  let margem = c.reg === "irregular" ? 5 : c.reg === "regular" ? 2 : 3; if(varia != null) margem = Math.max(2, Math.min(7, Math.ceil(varia / 2) + 1));
  const hoje = today(), diaCiclo = dd(ult.ini, hoje) + 1;
  const prox = addD(ult.ini, media), proxIni = addD(prox, -margem), proxFim = addD(prox, margem);
  const ovu = addD(prox, -14), fertIni = addD(ovu, -5), fertFim = addD(ovu, 1);
  const fimUlt = ult.fim || addD(ult.ini, dur - 1), emPeriodo = hoje >= ult.ini && hoje <= fimUlt && !(ult.fim && hoje > ult.fim);
  const atraso = hoje > proxFim ? dd(prox, hoje) : 0;
  let fase = "lutea";
  if(emPeriodo) fase = "menstrual"; else if(atraso > 0) fase = "atraso"; else if(Math.abs(dd(ovu, hoje)) <= 1) fase = "ovulatoria"; else if(hoje >= fertIni && hoje <= fertFim) fase = "fertil"; else if(hoje < fertIni) fase = "folicular";
  return { per, ult, media, dur, margem, varia, gaps, diaCiclo, prox, proxIni, proxFim, ovu, fertIni, fertFim, emPeriodo, atraso, fase, aberto: !ult.fim && diaCiclo <= 12 };
}
const FASE = {
  menstrual: ["Menstruação", "Seu corpo está começando um novo ciclo. A energia pode variar de um dia para o outro: respeite seu ritmo. Água, boa alimentação e movimento leve podem ajudar no desconforto."],
  folicular: ["Fase folicular", "Depois da menstruação, muitas mulheres sentem a energia voltando. Se o corpo estiver bem, pode ser um bom momento para treinos que você gosta de desafiar."],
  fertil: ["Janela fértil (estimativa)", "Período estimado com maior chance de gravidez. É apenas uma estimativa e não deve ser usada para evitar gravidez."],
  ovulatoria: ["Ovulação (estimativa)", "Data aproximada da ovulação. Algumas mulheres notam mais disposição; outras, um leve desconforto. Cada corpo é único."],
  lutea: ["Fase lútea", "Na segunda metade do ciclo podem aparecer inchaço, mais fome ou mudanças de humor. Sono, água e treinos que fazem bem a você ajudam."],
  atraso: ["Além da previsão", "A previsão é só uma estimativa. Ciclos variam por vários motivos."]
};
const fmtCurto = d => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
const faixa = (a, b) => `${fmtCurto(a)} a ${fmtCurto(b)}`;
const CK_OPC = {
  fluxo: [["nenhum","Nenhum"],["leve","Leve"],["medio","Médio"],["intenso","Intenso"]],
  sint: [["colica","Cólica"],["cabeca","Dor de cabeça"],["inchaco","Inchaço"],["seios","Seios sensíveis"],["acne","Acne"],["cansaco","Cansaço"],["enjoo","Enjoo"],["lombar","Dor lombar"],["doce","Vontade de doce"]],
  humor: [["bem","😊 Bem"],["normal","😐 Normal"],["baixo","😔 Para baixo"],["irritada","😤 Irritada"],["ansiosa","😰 Ansiosa"]],
  energia: [["alta","Alta"],["media","Média"],["baixa","Baixa"]],
  sono: [["bom","Bom"],["regular","Regular"],["ruim","Ruim"]]
};
const ckNome = (k, v) => ((CK_OPC[k] || []).find(x => x[0] === v) || [, v])[1];
async function abrirCiclo(){
  sheet("Meu Ciclo", `<div class="post skel" style="height:140px"></div>`);
  await cicloCarrega(true);
  if(CIC_ERR && !CIC){ $("sheet-body").innerHTML = `<div class="empty">${ic("ciclo", 34, 1.6)}<p>${CIC_ERR}</p></div>`; return; }
  if(!CIC || CIC.ativo === false || !(CIC.periodos || []).length) return cicloIntro();
  cicloTela();
}
function cicloIntro(){
  sheet("Meu Ciclo", `<div class="xp-cic-intro">${ic("ciclo", 46, 1.5)}<h2>Acompanhe seu ciclo, do seu jeito</h2>
    <ul class="xp-lista"><li>${ic("shield", 16)} <span><b>Opcional e privado.</b> Só você vê. Não usamos para anúncios, não mostramos a parceiros, profissionais nem outras alunas.</span></li>
      <li>${ic("calendar", 16)} <span>Previsões são <b>estimativas</b>, com uma faixa de dias. Cada ciclo é único.</span></li>
      <li>${ic("treinar", 16)} <span>Você pode adaptar o treino do dia conforme se sente. <b>Quem decide é você.</b></span></li>
      <li>${ic("flag", 16)} <span><b>Não é método contraceptivo</b> e não faz diagnóstico. Em caso de dúvida, procure um profissional de saúde.</span></li></ul></div>
    <h3>Para começar</h3>
    <div class="formgrid">
      <div class="field full"><label for="ci-u">Primeiro dia da última menstruação</label><input class="input" type="date" id="ci-u" max="${today()}" value="${esc((CIC && CIC.ativo !== false && CIC.ultima) || "")}"></div>
      <div class="field"><label for="ci-d">Quantos dias costuma durar</label><input class="input num" id="ci-d" type="number" min="1" max="12" value="${(CIC && CIC.dur) || 5}"></div>
      <div class="field"><label for="ci-c">Duração do ciclo (dias)</label><input class="input num" id="ci-c" type="number" min="18" max="60" value="${(CIC && CIC.ciclo) || 28}"></div>
    </div>
    <p class="hint" style="margin:0">Não sabe a duração do ciclo? Deixe 28. O app ajusta com o tempo.</p>
    <div class="seg" id="ci-r">${[["regular","Regular"],["irregular","Irregular"],["naosei","Não sei"]].map(([k, n]) => `<button data-r="${k}" aria-pressed="${((CIC && CIC.reg) || "naosei") === k}">${n}</button>`).join("")}</div>
    <button class="btn btn-accent btn-block btn-lg" id="ci-ok">${CIC && CIC.ativo !== false && (CIC.periodos || []).length ? "Salvar ajustes" : "Ativar Meu Ciclo"}</button>`);
  let reg = (CIC && CIC.reg) || "naosei";
  $("ci-r").querySelectorAll("[data-r]").forEach(b => b.onclick = () => { reg = b.dataset.r; $("ci-r").querySelectorAll("[data-r]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("ci-ok").onclick = async () => {
    const u = $("ci-u").value, du = Math.round(+$("ci-d").value), cl = Math.round(+$("ci-c").value);
    if(!u || u > today()) return toast("Informe a data do primeiro dia da última menstruação");
    if(!(du >= 1 && du <= 12)) return toast("A duração da menstruação deve ficar entre 1 e 12 dias");
    if(!(cl >= 18 && cl <= 60)) return toast("A duração do ciclo deve ficar entre 18 e 60 dias");
    const hist = CIC && CIC.ativo !== false ? (CIC.periodos || []).slice() : [];
    if(!hist.some(p => p.ini === u)){ const ant = hist.filter(p => p.ini < u).sort((a, b) => a.ini.localeCompare(b.ini)).pop(); if(ant && !ant.fim) ant.fim = addD(ant.ini, Math.min(dd(ant.ini, u) - 1, du - 1)); hist.push({ ini: u, fim: addD(u, du - 1) < today() ? addD(u, du - 1) : null }); }
    hist.sort((a, b) => a.ini.localeCompare(b.ini));
    CIC = { ...(CIC || {}), ativo: true, ultima: hist[hist.length - 1].ini, dur: du, ciclo: cl, reg, periodos: hist, checkins: (CIC && CIC.checkins) || {}, adapt: (CIC && CIC.adapt) || {}, cardInicio: CIC && CIC.cardInicio === false ? false : true, notif: !!(CIC && CIC.notif), criado: (CIC && CIC.criado) || today() };
    if(await cicloGrava()){ SOM.check(); toast("Meu Ciclo ativado"); cicloTela(); }
  };
}
let CMES = 0;
function cicloTela(){
  const k = cicloCalc(CIC); if(!k) return cicloIntro();
  const f = FASE[k.fase], ckHoje = (CIC.checkins || {})[today()];
  const ref = new Date(); ref.setDate(1); ref.setMonth(ref.getMonth() + CMES);
  const ano = ref.getFullYear(), mes = ref.getMonth(), ini = (new Date(ano, mes, 1).getDay() + 6) % 7, nd = new Date(ano, mes + 1, 0).getDate();
  const dias = new Set(); k.per.forEach((p, i) => { const fim = p.fim || (i === k.per.length - 1 ? (today() < addD(p.ini, k.dur - 1) ? today() : addD(p.ini, k.dur - 1)) : addD(p.ini, k.dur - 1)); for(let d = p.ini; d <= fim; d = addD(d, 1)) dias.add(d); });
  const prevP = new Set(); for(let i = 0; i < k.dur; i++) prevP.add(addD(k.prox, i));
  const cls = d => [dias.has(d) ? "per" : prevP.has(d) && d > today() ? "pprev" : "", d >= k.fertIni && d <= k.fertFim && !dias.has(d) ? "fert" : "", d === k.ovu ? "ovu" : "", d === today() ? "hoje" : "", (CIC.checkins || {})[d] ? "ck" : ""].filter(Boolean).join(" ");
  const nomeMes = (s => s.charAt(0).toUpperCase() + s.slice(1))(ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
  const nCk = Object.keys(CIC.checkins || {}).length;
  sheet("Meu Ciclo", `<div class="xp-cic-top f-${k.fase}"><span class="eyebrow">Dia ${k.diaCiclo} do ciclo · estimativa</span><h2>${f[0]}</h2><p>${f[1]}</p></div>
    ${k.atraso > 0 ? `<div class="xp-atraso"><b>Sua menstruação ainda não foi registrada. Está ${k.atraso} ${k.atraso === 1 ? "dia" : "dias"} além da previsão.</b>
      <div class="acts"><button class="btn btn-accent btn-sm" id="cc-reg2">Registrar menstruação</button><button class="btn btn-line btn-sm" id="cc-cfg2">Atualizar ciclo</button><button class="btn btn-line btn-sm" id="cc-mot">Entender possíveis motivos</button></div></div>` : ""}
    <div class="xp-prev">
      <div><span>${ic("drop", 15)} Próxima menstruação</span><b>${faixa(k.proxIni, k.proxFim)}</b><small>estimativa · ciclo de ${k.media} dias</small></div>
      <div><span>${ic("leaf", 15)} Janela fértil</span><b>${faixa(k.fertIni, k.fertFim)}</b><small>estimativa</small></div>
      <div><span>${ic("sun", 15)} Ovulação</span><b>por volta de ${fmtCurto(k.ovu)}</b><small>estimativa ± 2 dias</small></div>
    </div>
    <div class="xp-acts xp-acts-main">${k.aberto && k.emPeriodo ? `<button class="btn btn-ink" id="cc-fim">${ic("check", 17)} Menstruação terminou</button>` : `<button class="btn btn-ink" id="cc-reg">${ic("drop", 17)} Menstruação começou</button>`}<button class="btn btn-accent" id="cc-ck">${ic("edit", 17)} ${ckHoje ? "Editar check-in" : "Como estou hoje"}</button></div>
    <button class="btn btn-line btn-block" id="cc-adapt">${ic("treinar", 17)} ADAPTAR TREINO DE HOJE</button>
    <div class="card xp-cal"><div class="sec-title"><button class="iconbtn sm" id="cc-ant" aria-label="Mês anterior">${ic("back", 16)}</button><b>${nomeMes}</b><button class="iconbtn sm" id="cc-prox" aria-label="Próximo mês" style="transform:rotate(180deg)">${ic("back", 16)}</button></div>
      <div class="xp-calg">${["S","T","Q","Q","S","S","D"].map(d => `<i>${d}</i>`).join("")}${Array.from({ length: ini }, () => "<span></span>").join("")}${Array.from({ length: nd }, (_, i) => { const d = `${ano}-${pad(mes + 1)}-${pad(i + 1)}`; return `<button class="${cls(d)}" data-cd="${d}" ${d > today() ? "disabled" : ""}>${i + 1}</button>`; }).join("")}</div>
      <div class="xp-leg"><span class="per">Menstruação</span><span class="pprev">Prevista</span><span class="fert">Janela fértil</span><span class="ovu">Ovulação</span><span class="ck">Check-in</span></div>
      <p class="hint" style="margin:6px 0 0">Toque num dia passado para fazer ou ver o check-in.</p></div>
    ${cicloPadroes(k, nCk)}
    <div class="card" style="padding:6px 16px">
      ${setRow("cc-cfg", "gear", "Ajustar meu ciclo", `Menstruação de ${k.dur} dias · ciclo de ${+CIC.ciclo || 28} dias`)}
      ${setRow("cc-card", "home", "Mostrar card na Início", "", sw(CIC.cardInicio !== false))}
      ${setRow("cc-not", "clock", "Lembrete discreto", "Aviso 2 dias antes da previsão, sem palavras íntimas", sw(!!CIC.notif))}
      ${setRow("cc-hist", "calendar", "Histórico de ciclos", `${k.per.length} ${k.per.length === 1 ? "registro" : "registros"}`)}
      ${setRow("cc-off", "lock", "Desativar e apagar meus dados", "Apaga tudo do Meu Ciclo")}
    </div>
    <p class="hint" style="text-align:center">${ic("shield", 13)} Só você vê estes dados. Não é método contraceptivo nem diagnóstico.</p>`);
  const on = (id, fn) => { const e = $(id); if(e) e.onclick = fn; };
  on("cc-reg", () => registraPeriodo()); on("cc-reg2", () => registraPeriodo()); on("cc-fim", () => fimPeriodo());
  on("cc-ck", () => checkin(today())); on("cc-adapt", adaptarTreino); on("cc-mot", motivosAtraso);
  on("cc-cfg", cicloIntro); on("cc-cfg2", cicloIntro); on("cc-hist", historicoCiclo);
  on("cc-ant", () => { CMES--; cicloTela(); }); on("cc-prox", () => { CMES++; cicloTela(); });
  on("cc-card", async () => { CIC.cardInicio = CIC.cardInicio === false; await cicloGrava(); cicloTela(); });
  on("cc-not", async () => { const v = !CIC.notif; if(v && "Notification" in window && Notification.permission === "default"){ try{ await Notification.requestPermission(); }catch(e){} } CIC.notif = v; await cicloGrava(); toast(v ? "Lembrete discreto ligado" : "Lembrete desligado"); cicloTela(); });
  on("cc-off", () => { if(!confirm("Apagar todos os dados do Meu Ciclo? Isso não pode ser desfeito.")) return; XP.ciclo.apagar().then(() => { CIC = null; toast("Dados do Meu Ciclo apagados"); fecharSheet(); if(TAB === "inicio") rInicio(); }).catch(e => toast(XERR(e) ? XAVISO : "Não deu agora")); });
  $("sheet-body").querySelectorAll("[data-cd]").forEach(b => b.onclick = () => checkin(b.dataset.cd));
}
function cicloPadroes(k, nCk){
  const pode = k.gaps.length >= 2, ck = Object.values(CIC.checkins || {});
  if(!pode && nCk < 7) return `<div class="card"><h3 style="font-size:16px">Seus padrões</h3><p class="hint" style="margin:6px 0 0">Os padrões aparecem depois de alguns ciclos registrados e pelo menos 7 check-ins. Até agora: ${k.per.length} ${k.per.length === 1 ? "ciclo" : "ciclos"} e ${nCk} check-ins.</p></div>`;
  const cont = {}; ck.forEach(c => (c.sint || []).forEach(s => cont[s] = (cont[s] || 0) + 1));
  const top = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<div class="card"><h3 style="font-size:16px">Seus padrões</h3>
    ${pode ? `<p style="margin:8px 0 0">Seu ciclo médio: <b>${k.media} dias</b>${k.varia != null ? ` (variação de ${k.varia} ${k.varia === 1 ? "dia" : "dias"})` : ""}.</p>` : ""}
    ${top.length && nCk >= 7 ? `<p style="margin:8px 0 0">O que você mais registrou: ${top.map(([s, n]) => `<b>${esc(ckNome("sint", s))}</b> (${n}x)`).join(", ")}.</p>` : ""}
    <p class="hint" style="margin:8px 0 0">Informação para você se conhecer melhor. Não é diagnóstico.</p></div>`;
}
function registraPeriodo(){
  sheet("Menstruação começou", `<div class="field"><label for="rp-d">Primeiro dia</label><input class="input" type="date" id="rp-d" max="${today()}" value="${today()}"></div><button class="btn btn-accent btn-block btn-lg" id="rp-ok">Registrar</button><button class="btn btn-line btn-block" id="rp-v">Voltar</button>`);
  $("rp-v").onclick = cicloTela;
  $("rp-ok").onclick = async () => {
    const d = $("rp-d").value; if(!d || d > today()) return toast("Escolha uma data até hoje");
    const k = cicloCalc(CIC), per = CIC.periodos = CIC.periodos || [];
    if(per.some(p => p.ini === d)) return toast("Esse dia já está registrado");
    const ant = per.filter(p => p.ini < d).sort((a, b) => a.ini.localeCompare(b.ini)).pop();
    if(ant && dd(ant.ini, d) < 10 && !confirm("Esse início está muito perto do anterior. Registrar mesmo assim?")) return;
    if(ant && !ant.fim) ant.fim = addD(ant.ini, Math.min(dd(ant.ini, d) - 1, (k && k.dur || 5) - 1));
    per.push({ ini: d, fim: null }); per.sort((a, b) => a.ini.localeCompare(b.ini)); CIC.ultima = per[per.length - 1].ini;
    if(await cicloGrava()){ SOM.check(); toast("Registrado"); cicloTela(); }
  };
}
async function fimPeriodo(){ const p = (CIC.periodos || []).slice().sort((a, b) => a.ini.localeCompare(b.ini)).pop(); if(!p) return; p.fim = today() < p.ini ? p.ini : today(); if(await cicloGrava()){ SOM.check(); toast("Fim registrado"); cicloTela(); } }
function motivosAtraso(){
  sheet("Possíveis motivos", `<p>É comum o ciclo variar de vez em quando. Alguns motivos frequentes:</p>
    <ul class="xp-lista"><li>Estresse, ansiedade ou mudanças na rotina</li><li>Sono irregular ou viagens</li><li>Mudança grande no treino ou na alimentação</li><li>Perda ou ganho de peso</li><li>Início, troca ou pausa de anticoncepcional e outros remédios</li><li>Amamentação, pós-parto ou mudanças hormonais da idade</li><li>Condições de saúde que só um profissional pode avaliar</li></ul>
    <p>Se houver possibilidade de gravidez, um teste ou um profissional de saúde podem esclarecer. O app não faz diagnóstico.</p>
    <p class="hint">Se o atraso continuar, se vier com dor forte ou outros sinais que preocupem, procure um profissional de saúde.</p>
    <button class="btn btn-accent btn-block" id="mo-reg">Registrar menstruação</button><button class="btn btn-line btn-block" id="mo-v">Voltar</button>`);
  $("mo-reg").onclick = registraPeriodo; $("mo-v").onclick = cicloTela;
}
function historicoCiclo(){
  const per = (CIC.periodos || []).slice().sort((a, b) => b.ini.localeCompare(a.ini));
  sheet("Histórico de ciclos", per.length ? `<div class="list">${per.map((p, i) => { const prox = per[i - 1]; return `<div class="card xp-hist"><div><b>${brD(p.ini)}</b><small>${p.fim ? `${dd(p.ini, p.fim) + 1} dias de menstruação` : "duração não registrada"}${prox ? ` · ciclo de ${dd(p.ini, prox.ini)} dias` : " · ciclo atual"}</small></div><button class="link" data-hdel="${p.ini}">Excluir</button></div>`; }).join("")}</div>` : `<p class="empty">Sem registros.</p>`) ;
  $("sheet-body").insertAdjacentHTML("beforeend", `<button class="btn btn-line btn-block" id="hi-v">Voltar</button>`); $("hi-v").onclick = cicloTela;
  $("sheet-body").querySelectorAll("[data-hdel]").forEach(b => b.onclick = async () => { if((CIC.periodos || []).length <= 1) return toast("Mantenha pelo menos um registro, ou desative o Meu Ciclo."); if(!confirm("Excluir este registro?")) return; CIC.periodos = CIC.periodos.filter(p => p.ini !== b.dataset.hdel); if(await cicloGrava()) historicoCiclo(); });
}
function checkin(dia){
  const c = { fluxo: "", sint: [], humor: "", energia: "", sono: "", nota: "", ...((CIC.checkins || {})[dia] || {}) };
  const grupo = (k, multi) => `<div class="chips" data-g="${k}">${CK_OPC[k].map(([v, n]) => `<button class="chip" data-v="${v}" aria-pressed="${multi ? c[k].includes(v) : c[k] === v}">${n}</button>`).join("")}</div>`;
  sheet(dia === today() ? "Como você está hoje?" : "Check-in de " + brD(dia), `<p class="hint" style="margin:0">Marque só o que quiser. Fica salvo só para você.</p>
    <h3>Fluxo</h3>${grupo("fluxo")}<h3>Sintomas</h3>${grupo("sint", true)}<h3>Humor</h3>${grupo("humor")}<h3>Energia</h3>${grupo("energia")}<h3>Sono</h3>${grupo("sono")}
    <div class="field"><label for="ck-n">Anotações</label><textarea class="input" id="ck-n" maxlength="400" placeholder="Algo que queira lembrar">${esc(c.nota)}</textarea></div>
    <button class="btn btn-accent btn-block btn-lg" id="ck-ok">Salvar check-in</button>${(CIC.checkins || {})[dia] ? `<button class="btn btn-line btn-block" id="ck-del">Apagar este check-in</button>` : ""}<button class="btn btn-line btn-block" id="ck-v">Voltar</button>`);
  $("sheet-body").querySelectorAll("[data-g]").forEach(g => { const k = g.dataset.g, multi = k === "sint"; g.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { const v = b.dataset.v; if(multi){ c.sint = c.sint.includes(v) ? c.sint.filter(x => x !== v) : [...c.sint, v]; b.setAttribute("aria-pressed", c.sint.includes(v)); } else { c[k] = c[k] === v ? "" : v; g.querySelectorAll("[data-v]").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === c[k])); } SOM.tap(); }); });
  $("ck-v").onclick = cicloTela;
  $("ck-ok").onclick = async () => { c.nota = $("ck-n").value.trim(); CIC.checkins = CIC.checkins || {}; CIC.checkins[dia] = c; if(await cicloGrava()){ SOM.check(); toast("Check-in salvo"); if(dia === today()) adaptarTreino(); else cicloTela(); } };
  const del = $("ck-del"); if(del) del.onclick = async () => { delete CIC.checkins[dia]; if(await cicloGrava()) cicloTela(); };
}
function adaptarTreino(){
  const c = (CIC && (CIC.checkins || {})[today()]) || null, k = cicloCalc(CIC), sinais = [];
  if(c){ if(c.energia === "baixa") sinais.push("energia baixa"); if((c.sint || []).includes("colica")) sinais.push("cólica"); if(c.fluxo === "intenso") sinais.push("fluxo intenso"); if(c.sono === "ruim") sinais.push("sono ruim"); }
  const txt = sinais.length ? `Você registrou ${sinais.join(", ")} hoje. Um treino mais leve pode ser uma boa opção, mas a escolha é sua.` : k && k.fase === "menstrual" ? "Algumas mulheres preferem algo mais leve nestes dias; outras treinam normalmente. Escolha o que faz sentido para o seu corpo hoje." : "Escolha o que faz sentido para o seu corpo hoje.";
  const OP = [["manter","treinar","Manter o treino de hoje","O treino do seu programa, normal."],["leve","bolt","Treino mais leve","5 minutos para ativar o corpo sem pesar."],["mob","leaf","Mobilidade e alongamento","Soltar o corpo e aliviar tensões."],["caminhada","pin","Caminhada","Movimento leve ao ar livre ou em casa."],["descanso","moon","Descanso","Descansar também faz parte da evolução."]];
  sheet("Adaptar treino de hoje", `<p>${esc(txt)}</p><div class="list">${OP.map(([k2, i, t, s]) => `<button class="card xp-opt" data-ad="${k2}"><span class="si">${ic(i, 20)}</span><span><b>${t}</b><small>${s}</small></span></button>`).join("")}</div>
    <p class="hint">${ic("shield", 13)} Sentiu dor forte, tontura ou algo diferente do normal? Pare e procure orientação de um profissional de saúde.</p>`);
  const marca = async v => { if(CIC){ CIC.adapt = CIC.adapt || {}; CIC.adapt[today()] = v; await cicloGrava(); } };
  $("sheet-body").querySelectorAll("[data-ad]").forEach(b => b.onclick = async () => { const v = b.dataset.ad; await marca(v); SOM.tap();
    if(v === "manter"){ fecharSheet(); abrirTreinoPreview(treinoDoDia()); }
    else if(v === "leve"){ fecharSheet(); abrirTreinoPreview(treinoRapido(QUICK.find(q => q.id === "q-dia"))); }
    else if(v === "mob"){ fecharSheet(); abrirTreinoPreview(treinoRapido(QUICK.find(q => q.id === "q-alo"))); }
    else if(v === "caminhada"){ sheet("Caminhada", `<p>Quanto tempo você caminhou (ou vai caminhar)?</p><div class="chips">${[15, 20, 30, 45, 60].map(m => `<button class="chip" data-cm="${m}">${m} min</button>`).join("")}</div><p class="hint">Registrar soma na sua evolução.</p>`);
      $("sheet-body").querySelectorAll("[data-cm]").forEach(x => x.onclick = () => { const m = +x.dataset.cm; ME.treinos = ME.treinos || []; ME.treinos.push({ d: today(), h: new Date().getHours(), nome: "Caminhada", prog: null, plano: null, dia: null, rapido: "caminhada", min: m, kcal: Math.round(m * 4.2), exs: 0, parcial: false }); save(); SOM.done ? SOM.done() : SOM.check(); fecharSheet(); toast(`Caminhada de ${m} min registrada. Isso aí!`); rerender(); }); }
    else { fecharSheet(); toast("Descanso registrado. Recuperar também é evoluir. 💚"); }
  });
}
function cicloCardHtml(){
  if(!CIC || CIC.ativo === false || CIC.cardInicio === false) return "";
  const k = cicloCalc(CIC); if(!k) return "";
  const msg = k.atraso > 0 ? `${k.atraso} ${k.atraso === 1 ? "dia" : "dias"} além da previsão` : k.fase === "menstrual" ? `Dia ${k.diaCiclo} · menstruação` : `Dia ${k.diaCiclo} · ${FASE[k.fase][0].toLowerCase()}`;
  return `<div class="card xp-cic-card"><span class="xp-cic-ic">${ic("ciclo", 24, 1.7)}</span><div><b>Meu Ciclo</b><small>${esc(msg)} · estimativa</small></div><div class="acts"><button class="btn btn-soft btn-sm" id="xi-ck">Check-in</button><button class="btn btn-soft btn-sm" id="xi-ad">Adaptar treino</button></div><button class="iconbtn sm xp-x" id="xi-x" aria-label="Esconder este card">${ic("close", 14)}</button><button class="xp-cover" id="xi-ab" aria-label="Abrir Meu Ciclo"></button></div>`;
}
function ligaCicloCard(){
  const on = (id, fn) => { const e = $(id); if(e) e.onclick = ev => { ev.stopPropagation(); fn(); }; };
  on("xi-ab", abrirCiclo); on("xi-ck", () => { sheet("Meu Ciclo", ""); checkin(today()); }); on("xi-ad", adaptarTreino);
  on("xi-x", async () => { CIC.cardInicio = false; await cicloGrava(); toast("Card escondido. Você reativa em Perfil › Meu Ciclo."); rInicio(); });
}
function cicloLembrete(){
  if(!CIC || !CIC.notif || CIC.ativo === false) return; const k = cicloCalc(CIC); if(!k) return;
  if(today() === addD(k.prox, -2) && CIC.avisado !== today()){ CIC.avisado = today(); cicloGrava();
    try{ if("Notification" in window && Notification.permission === "granted") new Notification("CK Life", { body: "Você tem um lembrete no seu acompanhamento.", icon: "img/icone-192.png", tag: "ck-ciclo" }); }catch(e){} }
}

/* ---------- Início: card do ciclo, próximo agendamento e banner ---------- */
function xpInicio(){
  const el = $("xp-ini"); if(!el) return;
  el.innerHTML = bannersHtml("inicio"); ligaBanners(el);
  cicloCarrega().then(() => { const box = $("xp-ini"); if(!box || TAB !== "inicio") return; const h = cicloCardHtml(); if(h && !$("xi-ab")){ box.insertAdjacentHTML("afterbegin", h); ligaCicloCard(); } cicloLembrete(); });
  XP.ag.listar().then(L => { const box = $("xp-ini"); if(!box || TAB !== "inicio") return; const a = (L || []).filter(x => ["solicitado","confirmado"].includes(x.status) && x.data >= today()).sort((x, y) => (x.data + x.hora).localeCompare(y.data + y.hora))[0];
    if(a && !$("xi-ag")){ box.insertAdjacentHTML("beforeend", `<button class="card xp-proxag" id="xi-ag">${ic("calendar", 22)}<span><b>${esc(a.servico_nome || "Agendamento")}</b><small>${brD(a.data)} às ${esc(a.hora)} · ${esc(a.alvo_nome || "")}</small></span><span class="st ${STAG[a.status][1]}">${STAG[a.status][0]}</span></button>`); $("xi-ag").onclick = meusAgendamentos; } }).catch(() => {});
}

/* ---------- Perfil: novas entradas ---------- */
function perfilXP(){
  const nf = (ME.favx || []).length;
  return `<div class="card" style="padding:6px 16px">
    ${setRow("px-prog", "evolucao", "Meu progresso", "Calendário, medalhas, peso e medidas")}
    ${setRow("px-ciclo", "ciclo", "Meu Ciclo", "Opcional e privado")}
    ${setRow("px-ag", "calendar", "Meus agendamentos", "Próximos, concluídos e cancelados")}
    ${setRow("px-fav", "heart", "Meus favoritos", nf ? `${nf} ${nf === 1 ? "salvo" : "salvos"}` : "Academias, profissionais e produtos")}
    ${setRow("px-cid", "pin", "Minha cidade", esc(xcidNome(ME.cidade) || "Escolha sua cidade"))}
    ${setRow("px-priv", "shield", "Privacidade", "Seus dados e quem vê o quê")}
  </div>`;
}
function ligaPerfilXP(){
  const on = (id, fn) => { const e = $(id); if(e) e.onclick = fn; };
  on("px-prog", () => tab("evolucao")); on("px-ciclo", abrirCiclo); on("px-ag", meusAgendamentos); on("px-fav", meusFavoritos);
  on("px-cid", () => escolheCidade(rPerfil)); on("px-priv", privacidade);
  on("px-share", () => { const s = streak(), n = (ME.treinos || []).length; abreComposer(s > 1 ? `🔥 ${s} dias seguidos treinando no CK Life! Já são ${n} treinos. Bora juntas?` : `💪 Já são ${n} treinos no CK Life! Bora juntas?`); });
  on("px-prof", () => { XS.sec = "profissionais"; XS.q = ""; tab("explorar"); });
}
function privacidade(){
  const bl = ME.chatBloq || [];
  sheet("Privacidade", `<div class="card"><h3 style="font-size:16px">O que outras alunas veem</h3><p class="hint" style="margin:6px 0 0">Seu nome, sua foto de perfil e o que você publicar na Comunidade. Só isso.</p></div>
    <div class="card"><h3 style="font-size:16px">O que nunca é compartilhado</h3><p class="hint" style="margin:6px 0 0">Meu Ciclo, peso, medidas, sintomas e qualquer dado de saúde. Nada disso vai para anúncios, parceiros, academias ou profissionais. Compartilhar uma conquista é sempre escolha sua.</p></div>
    <div class="card"><h3 style="font-size:16px">Alunas bloqueadas no chat</h3>${bl.length ? bl.map(b => `<div class="xp-cidrow"><b>${esc(b.nome)}</b><button class="btn btn-line btn-sm" data-desb="${b.id}">Desbloquear</button></div>`).join("") : `<p class="hint" style="margin:6px 0 0">Ninguém bloqueado.</p>`}</div>
    <div class="card" style="padding:6px 16px">${setRow("pv-ciclo", "ciclo", "Apagar dados do Meu Ciclo", "Remove tudo o que você registrou")}${linkSuporte() ? setRow("pv-sup", "speaker", "Pedir exclusão da conta", "Fale com o suporte") : ""}</div>`);
  $("sheet-body").querySelectorAll("[data-desb]").forEach(b => b.onclick = () => { ME.chatBloq = (ME.chatBloq || []).filter(x => x.id !== b.dataset.desb); save(); privacidade(); });
  $("pv-ciclo").onclick = () => { if(!confirm("Apagar todos os dados do Meu Ciclo?")) return; XP.ciclo.apagar().then(() => { CIC = null; toast("Dados do Meu Ciclo apagados"); }).catch(e => toast(XERR(e) ? XAVISO : "Não deu agora")); };
  const s = $("pv-sup"); if(s) s.onclick = () => window.open(linkSuporte(), "_blank", "noopener");
}

/* ===================== CHAT ENTRE ALUNAS ===================== */
let CONV = [], CHAT_T = null, CHAT_ABERTA = null;
const lidaDe = c => c.a === ME.id ? c.lida_a : c.lida_b;
const naoLida = c => c.ultimo_autor && c.ultimo_autor !== ME.id && (!lidaDe(c) || new Date(lidaDe(c)) < new Date(c.ultima_em));
const outroDe = c => c.a === ME.id ? { id: c.b, nome: c.nome_b, foto: c.foto_b } : { id: c.a, nome: c.nome_a, foto: c.foto_a };
const bloqueada = id => (ME.chatBloq || []).some(b => b.id === id);
async function confereChat(){
  try{ CONV = await XP.chat.conversas(); }catch(e){ return; }
  const n = CONV.filter(c => naoLida(c) && !bloqueada(outroDe(c).id)).length, d = $("cm-chat-n");
  if(d){ d.hidden = !n; d.textContent = n; }
  if(n && TAB !== "juntas") marcaNovidade(true);
}
const chatBotao = () => `<div class="xp-chatbar"><button class="btn btn-line btn-sm" id="cm-chat">${ic("chat", 17)} Conversas <i class="xp-badge" id="cm-chat-n" hidden></i></button><button class="btn btn-line btn-sm" id="cm-share">${ic("flame", 16)} Compartilhar sequência</button></div>`;
function ligaChatBotao(){
  const b = $("cm-chat"); if(b) b.onclick = listaConversas;
  const s = $("cm-share"); if(s) s.onclick = () => { const st = streak(), n = (ME.treinos || []).length; abreComposer(st > 1 ? `🔥 ${st} dias seguidos treinando no CK Life! Já são ${n} treinos. Bora juntas?` : `💪 Já são ${n} treinos no CK Life! Bora juntas?`); };
  confereChat();
}
async function listaConversas(){
  sheet("Conversas", `<div id="cv-l"><div class="post skel" style="height:70px"></div></div>`);
  try{ CONV = await XP.chat.conversas(); }catch(e){ $("cv-l").innerHTML = `<p class="empty">${XERR(e) ? "O chat está sendo ativado. Volte daqui a pouco!" : "Sem conexão agora."}</p>`; return; }
  const L = CONV.filter(c => !bloqueada(outroDe(c).id));
  $("cv-l").innerHTML = L.length ? L.map(c => { const o = outroDe(c); return `<button class="xp-conv ${naoLida(c) ? "nova" : ""}" data-cv="${c.id}">${avPost(o.nome, o.foto)}<span class="xp-ct"><b>${esc(o.nome || "Aluna")}</b><small>${c.ultima ? (c.ultimo_autor === ME.id ? "Você: " : "") + esc(c.ultima) : "Diga oi 👋"}</small></span><small>${c.ultima ? tempoAtras(c.ultima_em) : ""}</small></button>`; }).join("")
    : `<div class="empty">${ic("chat", 34, 1.6)}<p>Nenhuma conversa ainda. Toque no nome de uma aluna no feed para mandar uma mensagem.</p></div>`;
  $("cv-l").querySelectorAll("[data-cv]").forEach(b => b.onclick = () => abreConversa(CONV.find(c => c.id === b.dataset.cv)));
}
function perfilPublico(u){
  if(!u || u.id === ME.id) return;
  const posts = (FEED || []).filter(p => p.user === u.id);
  sheet(u.nome || "Aluna", `<div class="xp-ph-top">${avPost(u.nome, u.foto).replace('class="pav"', 'class="pav xl"')}</div><div class="xp-dh" style="text-align:center"><h2>${esc(u.nome || "Aluna")}</h2><p class="muted">${posts.length} ${posts.length === 1 ? "publicação" : "publicações"} na comunidade</p></div>
    <div class="xp-acts xp-acts-main"><button class="btn btn-accent btn-lg" id="pp-msg">${ic("chat", 18)} Enviar mensagem</button></div>
    ${posts.filter(p => p.img).length ? `<div class="xp-pgrid">${posts.filter(p => p.img).slice(0, 9).map(p => `<img src="${esc(p.img)}" alt="" loading="lazy">`).join("")}</div>` : ""}
    <button class="link xp-den" id="pp-bl">${ic("flag", 13)} ${bloqueada(u.id) ? "Desbloquear" : "Bloquear"} ${esc((u.nome || "").split(" ")[0])}</button>`);
  $("pp-msg").onclick = async () => { if(bloqueada(u.id)) return toast("Desbloqueie para conversar"); if(ME.bloqueado) return toast("Sua conta está bloqueada"); try{ const c = await XP.chat.abrir(u); abreConversa(c); }catch(e){ toast(XERR(e) ? "O chat está sendo ativado. Volte daqui a pouco!" : "Não deu para abrir a conversa agora"); } };
  $("pp-bl").onclick = () => { if(bloqueada(u.id)){ ME.chatBloq = ME.chatBloq.filter(x => x.id !== u.id); toast("Desbloqueada"); } else { if(!confirm(`Bloquear ${u.nome}? Você não verá mais as mensagens dela.`)) return; ME.chatBloq = [...(ME.chatBloq || []), { id: u.id, nome: u.nome }]; toast("Bloqueada"); } save(); perfilPublico(u); };
}
async function abreConversa(c){
  if(!c) return; const o = outroDe(c); CHAT_ABERTA = c.id; clearInterval(CHAT_T);
  sheet("Conversa", `<button class="xp-chathead" id="cv-perfil">${avPost(o.nome, o.foto)}<span><b>${esc(o.nome || "Aluna")}</b><small>Ver perfil</small></span></button><p class="hint xp-chat-aviso">${ic("shield", 13)} Seja gentil. Nunca envie senhas, dados de cartão ou documentos.</p><div class="xp-msgs" id="cv-m"><div class="post skel" style="height:60px"></div></div>
    <div class="cbar"><input class="input" id="cv-t" maxlength="2000" placeholder="Mensagem" autocomplete="off"><button class="btn btn-accent" id="cv-env" aria-label="Enviar">${ic("send", 18)}</button></div>`, () => { CHAT_ABERTA = null; clearInterval(CHAT_T); confereChat(); });
  const ext = $("cv-perfil"); if(ext) ext.onclick = () => perfilPublico(o);
  let ultimo = "";
  const desenha = async () => {
    let M = []; try{ M = await XP.chat.mensagens(c.id); }catch(e){ if(!ultimo) $("cv-m").innerHTML = `<p class="empty">${XERR(e) ? "O chat está sendo ativado." : "Sem conexão agora."}</p>`; return; }
    if(CHAT_ABERTA !== c.id || !$("cv-m")) return;
    const sig = M.length + ":" + (M.length ? M[M.length - 1].id : ""); if(sig === ultimo) return; ultimo = sig;
    const box = $("cv-m"), noFim = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = M.length ? M.map((m, i) => { const eu = m.autor === ME.id, ultimaDela = !eu && (!M[i + 1] || M[i + 1].autor !== m.autor); return `<div class="xp-msgrow ${eu ? "eu" : ""}">${!eu ? (ultimaDela ? avPost(o.nome, o.foto) : `<span style="width:28px;flex:0 0 28px"></span>`) : ""}<div class="xp-msg ${eu ? "eu" : ""}" data-mid="${m.id}"><p>${esc(m.texto)}</p><small>${new Date(m.criado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${eu ? ` · <button class="link" data-mdel="${m.id}">apagar</button>` : ""}</small></div></div>`; }).join("") : `<p class="empty">Comece a conversa com ${esc((o.nome || "").split(" ")[0])} 💚</p>`;
    box.querySelectorAll("[data-mdel]").forEach(b => b.onclick = () => { const m = M.find(x => x.id === b.dataset.mdel); if(m && confirm("Apagar esta mensagem?")) XP.chat.apagarMsg(m).then(() => { ultimo = ""; desenha(); }).catch(() => toast("Não deu agora")); });
    if(noFim || M.length < 30) box.scrollTop = box.scrollHeight;
    XP.chat.lida(c);
  };
  await desenha();
  CHAT_T = setInterval(() => { if(document.visibilityState === "visible" && CHAT_ABERTA === c.id) desenha(); }, 4000);
  const env = async () => { const t = $("cv-t").value.trim(); if(!t) return; if(ME.bloqueado) return toast("Sua conta está bloqueada"); $("cv-env").disabled = true;
    try{ await XP.chat.enviar(c, t); $("cv-t").value = ""; SOM.tap(); ultimo = ""; await desenha(); }catch(e){ toast(XERR(e) ? "O chat está sendo ativado." : "Não deu para enviar agora"); }
    $("cv-env").disabled = false; $("cv-t").focus(); };
  $("cv-env").onclick = env; $("cv-t").onkeydown = e => { if(e.key === "Enter") env(); };
}
setInterval(() => { if(ME && !$("v-app").hidden && document.visibilityState === "visible" && !CHAT_ABERTA) confereChat(); }, 45000);

/* troca Treinos/Nutrição e voltar ao Perfil */
const areaSw = cur => `<div class="seg xp-area" role="group"><button data-area="treinar" aria-pressed="${cur === "treinar"}">${ic("treinar", 17)} Treinos</button><button data-area="dieta" aria-pressed="${cur === "dieta"}">${ic("dieta", 17)} Nutrição</button></div>`;
document.addEventListener("click", e => { const b = e.target.closest("[data-area]"); if(b && ME && !$("v-app").hidden){ e.preventDefault(); tab(b.dataset.area); } });
