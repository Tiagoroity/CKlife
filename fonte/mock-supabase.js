/* Supabase falso, só para teste local. Guarda tudo no localStorage. */
(function(){
const K = "mocksb";
let db = null; try{ db = JSON.parse(localStorage.getItem(K)); }catch(e){}
if(!db){ db = { alunas: [], admins: [], colecoes: [], eventos: [], acessos: [], compras: [], users: [], sess: null };
  [[1,"Cuiabá"],[2,"Várzea Grande"],[5,"Outra cidade"]].forEach(([id, nome]) => db.colecoes.push({ nome: "cidades", id: String(id), dados: { id, nome, uf: "MT", ativa: true } }));
  db.colecoes.push({ nome: "config", id: "1", dados: { nomeApp: "CK Life", checkout: "", suporte: "", treinosParaCupom: 8, premiumPreco: 19.9 } });
  db.colecoes.push({ nome: "avisos", id: "boasvindas", dados: { id: "boasvindas", titulo: "Bem-vinda ao CK Life", texto: "Aviso vindo do banco.", d: "2026-10-22", ativo: true } }); }
// tabelas da expansão: só existem se o teste ligar MOCKEXP (simula ter rodado o expansao.sql)
if(localStorage.getItem("MOCKEXP") === "1") ["agendamentos","avaliacoes","ciclo","conversas","mensagens","posts","curtidas","comentarios"].forEach(t => { if(!db[t]) db[t] = []; });
if(localStorage.getItem("MOCKSOCIAL") === "1") ["perfis","seguidores","bloqueios","stories","story_vistas","notificacoes","denuncias","salvos","moderacao_log","arquivos"].forEach(t => { if(!db[t]) db[t] = []; });
if(localStorage.getItem("MOCKSEG") === "1"){ ["documentos","solicitacoes","solicitacao_eventos","consentimentos","incidentes","incidente_eventos","auditoria","retencao","inventario","ripd","seguranca_config"].forEach(t => { if(!db[t]) db[t] = []; });
  if(!db.seguranca_config.length){ db.seguranca_config.push({ chave: "idade_minima", valor: 18, nota: "VALIDAÇÃO JURÍDICA" }, { chave: "idade_validada", valor: false }, { chave: "mfa_admin_obrigatorio", valor: false }, { chave: "prazo_lgpd_dias", valor: 15 });
    db.retencao.push({ categoria: "conta", finalidade: "Manter a conta", prazo: "A DEFINIR — VALIDAÇÃO JURÍDICA NECESSÁRIA", acao: "anonimizar", validado: false });
    db.inventario.push({ id: "i1", dado: "Meu Ciclo", categoria: "saúde", finalidade: "Previsão do ciclo", base_legal: "VALIDAÇÃO JURÍDICA NECESSÁRIA", sensivel: true });
    db.ripd.push({ id: "r1", processo: "Meu Ciclo", risco: "Exposição de dado sensível", probabilidade: "baixa", impacto: "alto", status: "rascunho" });
    db.documentos.push({ id: "d1", tipo: "privacidade", nome: "Política de Privacidade", versao: "1.0", conteudo: "Texto de teste da política.", status: "publicado", novo_aceite: true, vigencia: "2026-10-23", criado: new Date().toISOString() }); } }
db.consentimentos_atuais = db.consentimentos;
if(localStorage.getItem("MOCKPLANO")){ ["planos","app_config","verificacoes","recursos","campanhas_oferta","assinaturas","webhook_eventos"].forEach(t => { if(!db[t]) db[t] = []; });
  if(!db.planos.length){ db.planos.push({ id: "pro_mensal", nome: "CK Life Pro Mensal", periodo: "mes", preco: 19.99, ativo: true, ordem: 1, provider: "kiwify", checkout_url: "https://example.com/checkout-mensal" }, { id: "pro_anual", nome: "CK Life Pro Anual", periodo: "ano", preco: 155.88, parcelas: 12, parcela_valor: 12.99, parcelamento: true, ativo: true, ordem: 2, provider: "kiwify", checkout_url: "https://example.com/checkout-anual" });
    db.app_config.push({ chave: "treino_voz", valor: { ativo: true, idioma: "pt-BR", velocidade: 1, modo: "sempre", contagem: 3, permitir_pular: true } }); } }
if(localStorage.getItem("MOCKNOV") === "1"){ ["grupos","membros_grupo","figurinhas","humor_diario","desafio_participantes","push_inscricoes"].forEach(t => { if(!db[t]) db[t] = []; });
  if(!db.grupos.length) [["iniciantes","Iniciantes","🌱","#2E7D5A","Para quem está começando agora."],["treino-em-casa","Treino em casa","🏠","#0E3D32","Dicas para treinar em casa."],["corrida","Corrida e caminhada","🏃‍♀️","#D08A2E","Do primeiro km à prova."]].forEach(([slug, nome, emoji, cor, descricao], i) => db.grupos.push({ id: "g" + i, slug, nome, emoji, cor, descricao, ativo: true, ordem: i })); }
const salva = () => localStorage.setItem(K, JSON.stringify(db));
window.MOCKDB = () => db; window.MOCKLOG = [];
const PK = { planos: ["id"], app_config: ["chave"], verificacoes: ["id"], recursos: ["id"], campanhas_oferta: ["id"], assinaturas: ["id"], webhook_eventos: ["id"], figurinhas_catalogo: ["id"], figurinha_uso: ["figurinha_id","onde","dia"], grupos: ["id"], membros_grupo: ["grupo_id","user_id"], figurinhas: ["id"], humor_diario: ["user_id","dia"], desafio_participantes: ["id"], push_inscricoes: ["endpoint"], documentos: ["id"], solicitacoes: ["id"], solicitacao_eventos: ["id"], consentimentos: ["id"], incidentes: ["id"], incidente_eventos: ["id"], auditoria: ["id"], retencao: ["categoria"], inventario: ["id"], ripd: ["id"], seguranca_config: ["chave"], alunas: ["id"], admins: ["user_id"], colecoes: ["nome","id"], acessos: ["dia","user_id"], compras: ["email"], eventos: ["id"], agendamentos: ["id"], avaliacoes: ["id"], ciclo: ["user_id"], conversas: ["id"], mensagens: ["id"], posts: ["id"], curtidas: ["post_id","user_id"], comentarios: ["id"], perfis: ["user_id"], seguidores: ["seguidor","seguido"], bloqueios: ["quem","bloqueado"], stories: ["id"], story_vistas: ["story_id","user_id"], notificacoes: ["id"], denuncias: ["id"], salvos: ["user_id","post_id"], moderacao_log: ["id"] };
const uid = () => "u" + Math.random().toString(36).slice(2, 10);
class Q {
  constructor(t){ this.t = t; this.f = []; this.op = "select"; }
  select(c, o){ this.ret = true; if(o && o.head) this.head = true; return this; } limit(){ return this; } order(c, o){ this.ord = [c, !o || o.ascending !== false]; return this; }
  or(expr){ if(/ilike/.test(expr)){ const ps = expr.split(",").map(x => x.split(".ilike.")); this.f.push(r => ps.some(([c, v]) => String(r[c] || "").toLowerCase().includes(v.replace(/%/g, "").toLowerCase()))); return this; }
    const alts = expr.match(/and\(([^)]*)\)/g).map(a => a.slice(4, -1).split(",").map(x => x.split(".eq."))); this.f.push(r => alts.some(conds => conds.every(([c, v]) => String(r[c]) === v))); return this; }
  in(c, v){ this.f.push(r => v.includes(r[c])); return this; }
  eq(c, v){ this.f.push(r => r[c] === v); return this; }
  is(c, v){ this.f.push(r => (r[c] ?? null) === v); return this; }
  gte(c, v){ this.f.push(r => r[c] >= v); return this; }
  gt(c, v){ this.f.push(r => r[c] > v); return this; } lt(c, v){ this.f.push(r => r[c] < v); return this; } neq(c, v){ this.f.push(r => r[c] !== v); return this; }
  not(c, op, v){ const L = String(v).replace(/[()]/g, "").split(","); this.f.push(r => !L.includes(r[c])); return this; }
  upsert(rows, o){ this.op = "upsert"; this.rows = [].concat(rows); this.o = o || {}; return this; }
  insert(rows){ this.op = "insert"; this.rows = [].concat(rows); return this; }
  update(v){ this.op = "update"; this.v = v; return this; }
  delete(){ this.op = "delete"; return this; }
  then(ok, no){ try{ ok(this.exec()); }catch(e){ no ? no(e) : ok({ data: null, error: e }); } }
  exec(){
    if(!db[this.t]) return { data: null, error: { code: "PGRST205", message: "Could not find the table 'public." + this.t + "' in the schema cache" } };
    const T = db[this.t], pk = PK[this.t], same = (a, b) => pk.every(k => String(a[k]) === String(b[k]));
    window.MOCKLOG.push(this.op + " " + this.t);
    if(window.MOCKFALHA && this.op !== "select"){ window.MOCKFALHA = false; window.MOCKLOG.push("FALHOU " + this.t); return { data: null, error: { message: "falha simulada" } }; }
    if(this.op === "select" && this.head){ return { data: null, count: T.filter(r => this.f.every(f => f(r))).length, error: null }; }
    if(this.op === "select"){ let L = JSON.parse(JSON.stringify(T.filter(r => this.f.every(f => f(r))))); if(this.ord){ const [c, asc] = this.ord; L.sort((a, b) => String(a[c]).localeCompare(String(b[c])) * (asc ? 1 : -1)); } return { data: L, error: null }; }
    if(this.op === "insert" || this.op === "upsert"){
      const out = [];
      this.rows.forEach(r => { r = JSON.parse(JSON.stringify(r)); if(this.t === "eventos") r.id = T.length + 1;
        if(pk[0] === "id" && !r.id) r.id = "m" + Math.random().toString(36).slice(2, 12); if(["agendamentos","avaliacoes","conversas","mensagens","posts","comentarios"].includes(this.t) && !r.criado) r.criado = new Date().toISOString();
        if(this.t === "agendamentos" && !r.status) r.status = "solicitado";
        if(this.t === "perfis"){ if(T.some(x => x.username === String(r.username).toLowerCase() && x.user_id !== r.user_id)) throw { code: "23505", message: "duplicate key perfis_username_idx" }; r.username = String(r.username).toLowerCase(); r.criado = r.criado || new Date().toISOString(); r.interesses = r.interesses || []; r.conquistas = r.conquistas || []; r.mensagens = r.mensagens || "todas"; }
        if(this.t === "seguidores"){ const pf = db.perfis.find(x => x.user_id === r.seguido); r.status = pf && pf.privado ? "pendente" : "ativo"; db.notificacoes.push({ id: "n" + Math.random().toString(36).slice(2), user_id: r.seguido, ator: r.seguidor, tipo: r.status === "pendente" ? "solicitou" : "seguiu", ref: "", texto: "Alguém " + (r.status === "pendente" ? "pediu para seguir você." : "começou a seguir você."), lida: false, criado: new Date().toISOString() }); }
        if(this.t === "stories"){ r.criado = new Date().toISOString(); r.expira = new Date(Date.now() + 864e5).toISOString(); r.oculto = false; }
        if(this.t === "mensagens"){ r.tipo = r.tipo || "texto"; r.ocultar_para = []; r.entregue_em = null; r.lida_em = null; const c = db.conversas.find(x => x.id === r.conversa_id); if(c){ const dest = c.a === r.autor ? c.b : c.a; const ex = db.notificacoes.find(n => n.user_id === dest && n.tipo === "mensagem" && n.ref === r.conversa_id); if(ex){ ex.lida = false; ex.criado = r.criado; } else db.notificacoes.push({ id: "n" + Math.random().toString(36).slice(2), user_id: dest, ator: r.autor, tipo: "mensagem", ref: r.conversa_id, texto: "Nova mensagem", lida: false, criado: r.criado }); } }
        if(this.t === "notificacoes" || this.t === "denuncias"){ r.criado = new Date().toISOString(); if(this.t === "denuncias") r.status = "aberta"; if(this.t === "notificacoes") r.lida = false; } if(this.t === "conversas" && !r.ultima_em) r.ultima_em = r.criado;
        if(this.t === "mensagens"){ const c = db.conversas.find(x => x.id === r.conversa_id); if(c){ c.ultima = (r.texto || (r.tipo === 'foto' ? '📷 Foto' : r.tipo === 'audio' ? '🎤 Áudio' : '')).slice(0, 90); c.ultima_em = r.criado; c.ultimo_autor = r.autor; } }
        if(this.t === "avaliacoes"){ r.oculta = r.oculta || false; r.denuncias = r.denuncias || 0; r.verificada = db.agendamentos.some(a => a.user_id === r.user_id && a.alvo_id === r.alvo_id && a.status === "concluido"); }
        if(this.t === "verificacoes"){ r.status = "pending"; r.codigo = "K7Q2XZ"; r.criado = new Date().toISOString(); }
        if(this.t === "figurinhas" || this.t === "membros_grupo") r.criado = new Date().toISOString(); if(this.t === "membros_grupo" && !r.user_id) r.user_id = db.sess;
        if(this.t === "solicitacoes"){ r.protocolo = "CK-20261023-" + Math.random().toString(36).slice(2, 8).toUpperCase(); r.status = "recebida"; r.criado = new Date().toISOString(); r.prazo = "2026-11-07"; }
        if(this.t === "consentimentos" || this.t === "incidentes" || this.t === "documentos") r.criado = r.criado || new Date().toISOString();
        if(this.t === "incidentes"){ r.codigo = "INC-" + Date.now(); r.avaliar_comunicacao = ["alto","critico"].includes(r.risco) || r.sensiveis; r.prazo_comunicacao = "2026-10-28"; }
        out.push(r);
        const i = T.findIndex(x => same(x, r));
        if(i >= 0){ if(this.op === "upsert" && !this.o.ignoreDuplicates) T[i] = { ...T[i], ...r }; }
        else { if(this.t === "alunas" && !r.premium) r.premium = { tipo: "teste", ate: "2099-01-01" }; T.push(r); } });
      salva(); return { data: this.ret ? out : null, error: null };
    }
    if(this.op === "update"){ const out = []; T.forEach((r, i) => { if(this.f.every(f => f(r))){ T[i] = { ...r, ...this.v }; out.push(T[i]); } }); salva(); return { data: this.ret ? JSON.parse(JSON.stringify(out)) : null, error: null }; }
    if(this.op === "delete"){ db[this.t] = T.filter(r => !this.f.every(f => f(r))); salva(); return { data: null, error: null }; }
  }
}
const sessao = () => db.sess ? { user: db.users.find(u => u.id === db.sess) } : null;
const client = {
  from: t => new Q(t),
  rpc: async (n, a) => {
    const me = db.sess;
    if(n === "existe_admin") return { data: db.admins.length > 0, error: null };
    if(n === "virar_primeiro_admin"){ if(!me) return { data: false, error: null }; if(db.admins.length) return { data: db.admins.some(x => x.user_id === me), error: null }; const u = db.users.find(x => x.id === me); db.admins.push({ user_id: me, email: u.email, nome: a.p_nome, perms: { total: true }, desde: "2026-10-22" }); salva(); return { data: true, error: null }; }
    if(n === "validar_cupom"){ const c = db.colecoes.find(x => x.nome === "cupons" && x.id === a.p_cupom), p = c && db.colecoes.find(x => x.nome === "pins" && x.id === c.dados.parc); const ok = !!(p && p.dados === a.p_pin); if(ok){ c.dados.usado = true; salva(); } return { data: ok, error: null }; }
    if(!db.agendamentos) return { data: null, error: { code: "PGRST202", message: "Could not find the function public." + n } };
    const me2 = db.sess;
    if(db.perfis){
      if(n === "username_livre") return { data: /^[a-z0-9._]{3,20}$/.test(a.u) && !db.perfis.some(p => p.username === a.u && p.user_id !== me2), error: null };
      if(n === "perfil_contagens"){ const s = db.seguidores.find(x => x.seguidor === me2 && x.seguido === a.alvo); return { data: { posts: db.posts.filter(p => p.user_id === a.alvo).length, seguidores: db.seguidores.filter(x => x.seguido === a.alvo && x.status === "ativo").length, seguindo: db.seguidores.filter(x => x.seguidor === a.alvo && x.status === "ativo").length, eu_sigo: s ? s.status : null, me_segue: db.seguidores.some(x => x.seguidor === a.alvo && x.seguido === me2 && x.status === "ativo") }, error: null }; }
      if(n === "nao_lidas"){ const m = {}; db.mensagens.forEach(x => { const c = db.conversas.find(y => y.id === x.conversa_id); if(c && [c.a, c.b].includes(me2) && x.autor !== me2 && !x.lida_em) m[x.conversa_id] = (m[x.conversa_id] || 0) + 1; }); return { data: Object.entries(m).map(([conversa_id, n]) => ({ conversa_id, n })), error: null }; }
      if(n === "marcar_entregues"){ let k = 0; db.mensagens.forEach(x => { const c = db.conversas.find(y => y.id === x.conversa_id); if(c && [c.a, c.b].includes(me2) && x.autor !== me2 && !x.entregue_em){ x.entregue_em = new Date().toISOString(); k++; } }); salva(); return { data: k, error: null }; }
      if(n === "marcar_lidas"){ let k = 0; db.mensagens.forEach(x => { if(x.conversa_id === a.p_conversa && x.autor !== me2 && !x.lida_em){ x.lida_em = new Date().toISOString(); x.entregue_em = x.entregue_em || x.lida_em; k++; } }); db.notificacoes.forEach(x => { if(x.user_id === me2 && x.ref === a.p_conversa) x.lida = true; }); salva(); return { data: k, error: null }; }
      if(n === "ocultar_mensagem"){ const x = db.mensagens.find(y => y.id === a.p_id); if(x){ x.ocultar_para = [...(x.ocultar_para || []), me2]; salva(); } return { data: !!x, error: null }; }
      if(n === "denuncia_conteudo"){ const d = db.denuncias.find(x => x.id === a.p_id); const t = d && ({ post: db.posts, mensagem: db.mensagens, story: db.stories, comentario: db.comentarios })[d.tipo]; const x = t && t.find(y => y.id === d.alvo_id); return { data: x ? { texto: x.texto, midia: x.midia } : { removido: true }, error: null }; }
      if(n === "moderar"){ const d = db.denuncias.find(x => x.id === a.p_id); if(d){ d.status = a.p_acao === "descartar" ? "descartada" : "resolvida"; d.acao = a.p_acao; db.moderacao_log.push({ id: "l" + Date.now(), admin: me2, acao: a.p_acao, alvo_tipo: d.tipo, criado: new Date().toISOString() }); salva(); } return { data: true, error: null }; }
    }
    if(n === "horarios_ocupados") return { data: db.agendamentos.filter(x => x.alvo_tipo === a.p_tipo && x.alvo_id === a.p_id && ["solicitado","confirmado"].includes(x.status)).map(x => ({ data: x.data, hora: x.hora })), error: null };
    if(n === "denunciar_avaliacao"){ const x = db.avaliacoes.find(v => v.id === a.p_id); if(x) x.denuncias++; salva(); return { data: null, error: null }; }
    if(db.solicitacoes){
      if(n === "auditar"){ db.auditoria.push({ id: "a" + Date.now() + Math.random(), ator: me2, acao: a.p_acao, recurso: a.p_recurso, alvo: a.p_alvo, resultado: a.p_resultado || "ok", criado: new Date().toISOString() }); salva(); return { data: null, error: null }; }
      if(n === "seguranca_resumo") return { data: { usuarias: db.alunas.length, ativas_30d: 1, suspensas: 0, bloqueadas: 0, denuncias_abertas: (db.denuncias || []).filter(d => d.status === "aberta").length, denuncias_criticas: 0, denuncias_24h: 0, lgpd_abertas: db.solicitacoes.length, lgpd_exclusao: db.solicitacoes.filter(x => x.tipo === "eliminacao").length, lgpd_vencendo: 0, incidentes_abertos: db.incidentes.length, incidentes_analise: 0, incidentes_comunicacao: db.incidentes.filter(i => i.avaliar_comunicacao).length, acessos_admin_7d: db.auditoria.filter(x => x.acao === "login_admin").length, acessos_negados_7d: 0, config_alterada_7d: 0, midias_privadas: (db.arquivos || []).length, docs_publicados: db.documentos.filter(d => d.status === "publicado").length, retencao_pendente: 1, inventario_pendente: 1 }, error: null };
      if(n === "seguranca_checagens") return { data: { tabelas_sem_rls: [], buckets: [{ id: "social", publico: false, arquivos: 3, limite: 10485760, tipos: ["image/jpeg"] }, { id: "posts", publico: true, arquivos: 2 }, { id: "catalogo", publico: true, arquivos: 5 }], orfaos_social: 0, stories_vencidos_com_arquivo: 0, conteudo_moderado: 0, auditoria_imutavel: true, limites_ativos: 5, mfa_obrigatorio: false, admins: db.admins.length, admins_total: 1, idade_minima: 18, idade_validada: false }, error: null };
      if(n === "exportar_meus_dados") return { data: { conta: db.alunas.find(x => x.id === me2), perfil: (db.perfis || []).find(x => x.user_id === me2), posts: (db.posts || []).filter(x => x.user_id === me2) }, error: null };
      if(n === "nota_solicitacao" || n === "nota_incidente") return { data: null, error: null };
    }
    if(db.grupos){
      if(n === "registra_figurinha"){ if(!db.figurinha_uso) db.figurinha_uso = []; const d = new Date().toISOString().slice(0, 10), x = db.figurinha_uso.find(u => u.figurinha_id === a.p_id && u.onde === a.p_onde && u.dia === d); if(x) x.n++; else db.figurinha_uso.push({ figurinha_id: a.p_id, onde: a.p_onde, dia: d, n: 1 }); salva(); return { data: null, error: null }; }
      if(n === "grupos_info") return { data: db.grupos.filter(g => g.ativo).map(g => ({ ...g, membros: db.membros_grupo.filter(m => m.grupo_id === g.id).length, eu: db.membros_grupo.some(m => m.grupo_id === g.id && m.user_id === me2) })), error: null };
      if(n === "desafio_contagem"){ const c = d => new Set(db.desafio_participantes.filter(x => x.desafio === d && !x.saiu).map(x => x.user_id)).size; return { data: { d7: c("d7") + 3, d21: c("d21"), d30: c("d30") }, error: null }; }
    }
    if(n === "meu_plano" && localStorage.getItem("MOCKPLANO")){ const m = localStorage.getItem("MOCKPLANO"), pro = m === "trial" || m === "pro" || m === "trial1", agora = new Date().toISOString();
      const RS = ["programas_completos","treinos_rapidos_todos","adaptacao_treino","desafios_longos","graficos_avancados","sugestoes_energia","receitas_todas","cardapio","modo_cozinha","ciclo_avancado","stickers_todos","figurinha_propria","filtros_todos","maquiagem","selos_dados","video_longo","clube_pro","verificacao","sem_anuncios"];
      const of = localStorage.getItem("MOCKOFERTA") ? { id: "of1", campanha: "trial-dia5", titulo: "CK Life Pro", subtitulo: "Continue vivendo a experiência completa.", expira: new Date(Date.now() + 47 * 3600e3).toISOString(), preco_mensal_promo: 11.99, meses_promo: 12, preco_anual_promo: 119.88, parcelas_anual: 12, parcela_anual_valor: 9.99, checkout_mensal_url: "https://example.com/promo-m", checkout_anual_url: "https://example.com/promo-a" } : null;
      return { data: { status: m === "free" || m === "free31" ? "free" : m === "pro" ? "active" : "trialing", pro, trial: m.startsWith("trial"), plano: m === "pro" ? "pro_anual" : "pro_mensal", provider: m === "pro" ? "kiwify" : "trial", agora, dias_restantes: m === "trial1" ? 1 : m === "trial" ? 6 : null, anuncios: m === "free31", oferta: of, verificacao: (db.verificacoes.find(v => v.user_id === me2) || {}).status || "not_requested",
        recursos: Object.fromEntries(RS.map(r => [r, pro || r === "video_longo"])), limites: { stickers_todos: pro ? null : 25, treinos_rapidos_todos: pro ? null : 3, filtros_todos: pro ? null : 3, video_longo: pro ? 60 : 15 } }, error: null }; }
    if((n === "oferta_ativar" || n === "oferta_evento" || n === "registra_evento") && localStorage.getItem("MOCKPLANO")) return { data: n === "oferta_ativar" && localStorage.getItem("MOCKOFERTA") ? null : null, error: null };
    if(n === "admin_planos_usuarias" && localStorage.getItem("MOCKPLANO")) return { data: Object.fromEntries((db.alunas || []).map((a, i) => [a.id, i === 0 ? { pro: true, trial: false, provider: "kiwify", plano: "pro_mensal", fim: new Date(Date.now() + 30 * 864e5).toISOString() } : { pro: true, trial: true, provider: "trial", plano: "pro_mensal", fim: new Date(Date.now() + 5 * 864e5).toISOString() }])), error: null };
    if(n === "admin_vendas" && localStorage.getItem("MOCKPLANO")) return { data: [{ quando: new Date().toISOString(), evento: "order_approved", pedido: "LEOLOP4", valor: 19.99, status: "processado", email: "teste@ck.com", nome: "Aluna Teste", plano: "pro_mensal" }, { quando: new Date().toISOString(), evento: "pix_created", pedido: "LEOLOP4", valor: null, status: "ignorado", email: "teste@ck.com", nome: "Aluna Teste" }], error: null };
    if(n === "verificacao_selfie"){ const v = db.verificacoes.find(x => x.id === a.p_id); if(v){ v.selfie = a.p_selfie; salva(); } return { data: null, error: null }; }
    if(n === "ciclo_resumo") return { data: { ativas: db.ciclo.filter(c => c.ativo).length, total: db.ciclo.length, checkins_7d: 0 }, error: null };
    return { data: null, error: { message: "rpc desconhecida " + n } };
  },
  auth: {
    onAuthStateChange(){ return { data: { subscription: { unsubscribe(){} } } }; },
    async getSession(){ return { data: { session: sessao() } }; },
    async getUser(){ const s = sessao(); return { data: { user: s && s.user } }; },
    async signUp({ email, password }){ if(db.users.some(u => u.email === email)) return { data: {}, error: { message: "User already registered" } }; const u = { id: uid(), email, password }; db.users.push(u); db.sess = u.id; salva(); return { data: { user: { id: u.id, email }, session: { user: u } }, error: null }; },
    async signInWithPassword({ email, password }){ const u = db.users.find(x => x.email === email && x.password === password); if(!u) return { data: {}, error: { message: "Invalid login credentials" } }; db.sess = u.id; salva(); return { data: { user: { id: u.id, email } }, error: null }; },
    async signOut(){ db.sess = null; salva(); return { error: null }; },
    async resetPasswordForEmail(){ return { error: null }; },
    async updateUser(){ return { error: null }; },
    mfa: { async listFactors(){ return { data: { all: [], totp: [] }, error: null }; }, async getAuthenticatorAssuranceLevel(){ return { data: { currentLevel: "aal1", nextLevel: "aal1" }, error: null }; }, async enroll(){ return { data: null, error: { message: "MFA indisponível no teste" } }; } }
  }
};
// storage simulado (guarda data URL no localStorage) + tempo real desligado (o app usa o plano B)
client.storage = { from: () => ({
  upload: async (path, blob) => { if(!db.arquivos) return { error: { message: "Bucket not found" } }; const url = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); }); db.arquivos.push({ path, url }); salva(); return { data: { path }, error: null }; },
  createSignedUrls: async paths => ({ data: paths.map(p => { const f = (db.arquivos || []).find(x => x.path === p); return { path: p, signedUrl: f ? f.url : null, error: f ? null : "not found" }; }), error: null }),
  createSignedUrl: async p => { const f = (db.arquivos || []).find(x => x.path === p); return { data: f ? { signedUrl: f.url } : null, error: f ? null : { message: "not found" } }; },
  remove: async () => ({ data: [], error: null }), getPublicUrl: p => ({ data: { publicUrl: p } })
}) };
client.channel = () => { const ch = { on: () => ch, subscribe: cb => { setTimeout(() => cb && cb("CLOSED"), 10); return ch; } }; return ch; };
window.supabase = { createClient: () => client };
})();
