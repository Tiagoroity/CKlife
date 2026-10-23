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
const salva = () => localStorage.setItem(K, JSON.stringify(db));
window.MOCKDB = () => db; window.MOCKLOG = [];
const PK = { alunas: ["id"], admins: ["user_id"], colecoes: ["nome","id"], acessos: ["dia","user_id"], compras: ["email"], eventos: ["id"], agendamentos: ["id"], avaliacoes: ["id"], ciclo: ["user_id"], conversas: ["id"], mensagens: ["id"], posts: ["id"], curtidas: ["post_id","user_id"], comentarios: ["id"], perfis: ["user_id"], seguidores: ["seguidor","seguido"], bloqueios: ["quem","bloqueado"], stories: ["id"], story_vistas: ["story_id","user_id"], notificacoes: ["id"], denuncias: ["id"], salvos: ["user_id","post_id"], moderacao_log: ["id"] };
const uid = () => "u" + Math.random().toString(36).slice(2, 10);
class Q {
  constructor(t){ this.t = t; this.f = []; this.op = "select"; }
  select(c, o){ this.ret = true; if(o && o.head) this.head = true; return this; } limit(){ return this; } order(c, o){ this.ord = [c, !o || o.ascending !== false]; return this; }
  or(expr){ if(/ilike/.test(expr)){ const ps = expr.split(",").map(x => x.split(".ilike.")); this.f.push(r => ps.some(([c, v]) => String(r[c] || "").toLowerCase().includes(v.replace(/%/g, "").toLowerCase()))); return this; }
    const alts = expr.match(/and\(([^)]*)\)/g).map(a => a.slice(4, -1).split(",").map(x => x.split(".eq."))); this.f.push(r => alts.some(conds => conds.every(([c, v]) => String(r[c]) === v))); return this; }
  in(c, v){ this.f.push(r => v.includes(r[c])); return this; }
  eq(c, v){ this.f.push(r => r[c] === v); return this; }
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
    async updateUser(){ return { error: null }; }
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
