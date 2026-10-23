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
const salva = () => localStorage.setItem(K, JSON.stringify(db));
window.MOCKDB = () => db; window.MOCKLOG = [];
const PK = { alunas: ["id"], admins: ["user_id"], colecoes: ["nome","id"], acessos: ["dia","user_id"], compras: ["email"], eventos: ["id"], agendamentos: ["id"], avaliacoes: ["id"], ciclo: ["user_id"], conversas: ["id"], mensagens: ["id"], posts: ["id"], curtidas: ["post_id","user_id"], comentarios: ["id"] };
const uid = () => "u" + Math.random().toString(36).slice(2, 10);
class Q {
  constructor(t){ this.t = t; this.f = []; this.op = "select"; }
  select(){ this.ret = true; return this; } limit(){ return this; } order(c, o){ this.ord = [c, !o || o.ascending !== false]; return this; }
  or(expr){ const alts = expr.match(/and\(([^)]*)\)/g).map(a => a.slice(4, -1).split(",").map(x => x.split(".eq."))); this.f.push(r => alts.some(conds => conds.every(([c, v]) => String(r[c]) === v))); return this; }
  in(c, v){ this.f.push(r => v.includes(r[c])); return this; }
  eq(c, v){ this.f.push(r => r[c] === v); return this; }
  gte(c, v){ this.f.push(r => r[c] >= v); return this; }
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
    if(this.op === "select"){ let L = JSON.parse(JSON.stringify(T.filter(r => this.f.every(f => f(r))))); if(this.ord){ const [c, asc] = this.ord; L.sort((a, b) => String(a[c]).localeCompare(String(b[c])) * (asc ? 1 : -1)); } return { data: L, error: null }; }
    if(this.op === "insert" || this.op === "upsert"){
      const out = [];
      this.rows.forEach(r => { r = JSON.parse(JSON.stringify(r)); if(this.t === "eventos") r.id = T.length + 1;
        if(pk[0] === "id" && !r.id) r.id = "m" + Math.random().toString(36).slice(2, 12); if(["agendamentos","avaliacoes","conversas","mensagens","posts","comentarios"].includes(this.t) && !r.criado) r.criado = new Date().toISOString();
        if(this.t === "agendamentos" && !r.status) r.status = "solicitado"; if(this.t === "conversas" && !r.ultima_em) r.ultima_em = r.criado;
        if(this.t === "mensagens"){ const c = db.conversas.find(x => x.id === r.conversa_id); if(c){ c.ultima = r.texto.slice(0, 90); c.ultima_em = r.criado; c.ultimo_autor = r.autor; } }
        if(this.t === "avaliacoes"){ r.oculta = r.oculta || false; r.denuncias = r.denuncias || 0; r.verificada = db.agendamentos.some(a => a.user_id === r.user_id && a.alvo_id === r.alvo_id && a.status === "concluido"); }
        out.push(r);
        const i = T.findIndex(x => same(x, r));
        if(i >= 0){ if(this.op === "upsert" && !this.o.ignoreDuplicates) T[i] = { ...T[i], ...r }; }
        else { if(this.t === "alunas" && !r.premium) r.premium = { tipo: "teste", ate: "2099-01-01" }; T.push(r); } });
      salva(); return { data: this.ret ? out : null, error: null };
    }
    if(this.op === "update"){ T.forEach((r, i) => { if(this.f.every(f => f(r))) T[i] = { ...r, ...this.v }; }); salva(); return { data: null, error: null }; }
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
window.supabase = { createClient: () => client };
})();
