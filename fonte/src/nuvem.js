/* Banco de dados na nuvem (Supabase). Sem configuração, o app roda em modo demonstração (dados só no aparelho). */
(function(){
"use strict";
const C = window.APP_CONFIG || {};
const ativo = !!(C.SUPABASE_URL && !/COLE_AQUI/.test(C.SUPABASE_URL) && C.SUPABASE_ANON_KEY && !/COLE_AQUI/.test(C.SUPABASE_ANON_KEY) && window.supabase);
const N = { ativo, uid: null, admin: false, existeAdmin: false };
window.NUVEM = N;
if(!ativo) return;
const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
N.sb = sb;
const pad = n => String(n).padStart(2, "0");
const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const menosDias = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const LISTAS = ["cidades","segmentos","anunciantes","campanhas","parceiros","profissionais","avisos","receitasExtras","exercExtras","pagamentos","cupons","empresas","servicos","produtos","banners","categorias"];
const UNICOS = ["config","freq","receitasOcultas"];
const COLS_USER = ["id","email","nome","whats","nasc","cidade","criado","ultimo","bloqueado","premium"];
const FORA = new Set(["senha","admin","perms","adminDesde","exemplo","genero", ...COLS_USER]);
const J = x => JSON.stringify(x === undefined ? null : x);
async function q(p){ const r = await p; if(r.error) throw r.error; return r.data; }

N.vazio = () => ({ versao: 1, nuvem: true, criado: hoje(), config: { nomeApp: "CK Life", checkout: C.KIWIFY_URL || "", suporte: C.SUPORTE || "", treinosParaCupom: 8, premiumPreco: 19.9 }, freq: { cliques: 25, minutos: 4, intervalo: 3, maxDia: 6 },
  users: [], eventos: [], acessos: {}, cidades: [], segmentos: [], anunciantes: [], campanhas: [], pagamentos: [], profissionais: [], parceiros: [], cupons: [], avisos: [], receitasExtras: [], receitasOcultas: [], exercExtras: [], empresas: [], servicos: [], produtos: [], banners: [], categorias: [] });

/* linha da tabela <-> pessoa no app */
function paraUser(r, adm){
  const u = { ...(r.dados || {}), genero: "feminino" };
  COLS_USER.forEach(k => { if(r[k] !== undefined) u[k] = r[k]; });
  if(adm){ u.admin = true; u.perms = adm.perms || { total: true }; u.adminDesde = adm.desde; }
  return u;
}
function paraLinha(u){
  const dados = {}; Object.keys(u).forEach(k => { if(!FORA.has(k)) dados[k] = u[k]; });
  const r = { dados }; COLS_USER.forEach(k => { r[k] = u[k] === undefined || u[k] === "" ? null : u[k]; });
  if(r.cidade != null) r.cidade = +r.cidade || null;
  return r;
}

/* fotografia do que veio do banco, para gravar só o que mudou */
let SNAP = null;
function fotografa(DB){
  const s = { users: {}, adms: {}, cols: {}, unicos: {}, ev: DB.eventos.length, acc: new Set() };
  DB.users.forEach(u => { s.users[u.id] = J(paraLinha(u)); if(u.admin) s.adms[u.id] = J(u.perms || { total: true }); });
  LISTAS.forEach(n => { s.cols[n] = {}; (DB[n] || []).forEach(x => s.cols[n][String(x.id)] = J(x)); });
  UNICOS.forEach(n => s.unicos[n] = J(DB[n]));
  Object.entries(DB.acessos || {}).forEach(([d, L]) => L.forEach(id => s.acc.add(d + "|" + id)));
  SNAP = s;
}

/* entrada */
N.iniciar = async (DB, modoAdm, aoRecuperar) => {
  sb.auth.onAuthStateChange((ev) => { if(ev === "PASSWORD_RECOVERY" && aoRecuperar) aoRecuperar(); });
  try{ (await q(sb.from("colecoes").select("nome,id,dados").in("nome", ["cidades","config"]))).forEach(r => { if(r.nome === "config") Object.assign(DB.config, r.dados); else DB.cidades.push(r.dados); }); }catch(e){ console.warn(e); }
  DB.cidades.sort((a, b) => String(a.nome).localeCompare(b.nome));
  try{ N.existeAdmin = !!(await q(sb.rpc("existe_admin"))); }catch(e){}
  const { data: { session } } = await sb.auth.getSession();
  if(session){
    // internet oscilou ao abrir: tenta de novo antes de mandar para a tela de entrada
    for(let t = 0; t < 3; t++){
      try{ await N.carregar(DB, session.user, modoAdm); break; }
      catch(e){ console.warn("Falha ao carregar, tentando de novo", e); if(t === 2) throw e; await new Promise(r => setTimeout(r, 1500)); }
    }
  }
};
N.carregar = async (DB, user, modoAdm) => {
  N.uid = user.id; N.email = user.email;
  const admRows = await q(sb.from("admins").select("*"));
  const souAdm = admRows.find(a => a.user_id === user.id);
  N.admin = !!souAdm;
  Object.assign(DB, N.vazio(), { config: DB.config });
  const cols = await q(sb.from("colecoes").select("nome,id,dados"));
  const pins = {};
  cols.forEach(r => { if(r.nome === "pins") pins[r.id] = r.dados; else if(UNICOS.includes(r.nome)) DB[r.nome] = r.dados; else if(DB[r.nome]) DB[r.nome].push(r.dados); });
  DB.parceiros.forEach(p => { if(pins[p.id] != null) p.pin = pins[p.id]; });
  DB.cidades.sort((a, b) => String(a.nome).localeCompare(b.nome));
  if(N.admin && modoAdm){
    const [al, ev, ac] = await Promise.all([q(sb.from("alunas").select("*")), q(sb.from("eventos").select("t,c,u,d").gte("d", menosDias(120)).limit(50000)), q(sb.from("acessos").select("dia,user_id").gte("dia", menosDias(120)).limit(50000))]);
    const admBy = Object.fromEntries(admRows.map(a => [a.user_id, a]));
    DB.users = al.map(r => paraUser(r, admBy[r.id]));
    admRows.filter(a => !al.some(r => r.id === a.user_id)).forEach(a => DB.users.push({ id: a.user_id, email: a.email, nome: a.nome || a.email, admin: true, perms: a.perms, adminDesde: a.desde, criado: a.desde, soAdmin: true, genero: "feminino" }));
    DB.eventos = ev; ac.forEach(r => (DB.acessos[r.dia] = DB.acessos[r.dia] || []).push(r.user_id));
  } else {
    const al = await q(sb.from("alunas").select("*").eq("id", user.id));
    if(al[0]) DB.users = [paraUser(al[0], souAdm)];
    const ev = await q(sb.from("eventos").select("t,c,u,d").eq("u", user.id).eq("d", hoje()));
    DB.eventos = ev;
  }
  fotografa(DB);
};
N.cadastrar = async (email, senha) => {
  const { data, error } = await sb.auth.signUp({ email, password: senha, options: { emailRedirectTo: location.origin + location.pathname } });
  if(error) return { erro: traduz(error) };
  return { id: data.user && data.user.id, confirmar: !data.session };
};
N.entrar = async (email, senha) => { const { data, error } = await sb.auth.signInWithPassword({ email, password: senha }); return error ? { erro: traduz(error) } : { user: data.user }; };
N.sair = async () => { try{ await sb.auth.signOut(); }catch(e){} };
N.reset = async email => { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); return error ? traduz(error) : null; };
N.novaSenha = async senha => { const { error } = await sb.auth.updateUser({ password: senha }); return error ? traduz(error) : null; };
N.primeiroAdmin = async nome => !!(await q(sb.rpc("virar_primeiro_admin", { p_nome: nome })));
N.subirImg = async (blob, pasta) => {
  const path = `${pasta || "geral"}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.jpg`;
  const up = await sb.storage.from("catalogo").upload(path, blob, { contentType: "image/jpeg", upsert: true }); if(up.error) throw up.error;
  return sb.storage.from("catalogo").getPublicUrl(path).data.publicUrl;
};
N.validarCupom = async (id, pin) => !!(await q(sb.rpc("validar_cupom", { p_cupom: id, p_pin: pin })));
function traduz(e){
  const m = (e && e.message) || String(e);
  if(/Invalid login/i.test(m)) return "E-mail ou senha não conferem.";
  if(/already registered|already been registered/i.test(m)) return "Já existe uma conta com esse e-mail.";
  if(/Email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos e tente de novo.";
  if(/Password should be/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  if(/rate limit|seconds/i.test(m)) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  return "Não deu certo: " + m;
}

/* gravação: só o que mudou, alguns instantes depois da última alteração */
let tm = null, rodando = false, deNovo = false, avisar = null;
N.aoErro = f => avisar = f;
N.salvar = DB => { N._db = DB; clearTimeout(tm); tm = setTimeout(() => grava(DB), 700); };
// grava na hora quando a aluna sai do app, troca de aba ou bloqueia o celular
const agora = () => { if(tm){ clearTimeout(tm); tm = null; if(N._db) grava(N._db); } };
window.addEventListener("pagehide", agora);
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden") agora(); });
async function grava(DB){
  N._db = DB; tm = null;
  if(!SNAP || !N.uid) return;
  if(rodando){ deNovo = true; return; }
  rodando = true;
  const ops = [], s = SNAP;
  // cópia do retrato antes desta rodada: se a gravação falhar, volta e tenta de novo
  const antes = { users: { ...s.users }, adms: { ...s.adms }, cols: Object.fromEntries(Object.entries(s.cols).map(([k, v]) => [k, { ...v }])), unicos: { ...s.unicos }, ev: s.ev, acc: new Set(s.acc) };
  try{
    /* pessoas */
    const vistos = new Set();
    for(const u of DB.users){
      vistos.add(u.id);
      if(u.soAdmin && !N.admin) continue;
      const lin = paraLinha(u), js = J(lin);
      if(!u.soAdmin && s.users[u.id] !== js){
        if(u.id === N.uid) ops.push(q(sb.from("alunas").upsert({ ...lin, atualizado: new Date().toISOString() })));
        else if(N.admin){ const { dados, ...cols } = lin; ops.push(q(sb.from("alunas").update(cols).eq("id", u.id))); }
        s.users[u.id] = js;
      }
      if(N.admin){
        const pa = u.admin ? J(u.perms || { total: true }) : null;
        if(pa !== (s.adms[u.id] || null)){
          if(pa) ops.push(q(sb.from("admins").upsert({ user_id: u.id, email: u.email, nome: u.nome, perms: u.perms || { total: true } })));
          else ops.push(q(sb.from("admins").delete().eq("user_id", u.id)));
          if(pa) s.adms[u.id] = pa; else delete s.adms[u.id];
        }
      }
    }
    if(N.admin) Object.keys(s.users).forEach(id => { if(!vistos.has(id)){ ops.push(q(sb.from("alunas").delete().eq("id", id))); delete s.users[id]; } });
    /* listas */
    for(const n of LISTAS){
      if(!N.admin && n !== "cupons") continue;
      const atual = {}; (DB[n] || []).forEach(x => atual[String(x.id)] = x);
      for(const [id, x] of Object.entries(atual)){
        const js = J(x); if(s.cols[n][id] === js) continue;
        if(!N.admin && (x.user !== N.uid || s.cols[n][id])) { s.cols[n][id] = js; continue; }
        let dados = x;
        if(n === "parceiros"){ const { pin, ...resto } = x; dados = resto; ops.push(q(sb.from("colecoes").upsert({ nome: "pins", id, dados: String(pin || "") }))); }
        ops.push(q(sb.from("colecoes").upsert({ nome: n, id, dados })));
        s.cols[n][id] = js;
      }
      if(N.admin) Object.keys(s.cols[n]).forEach(id => { if(!atual[id]){ ops.push(q(sb.from("colecoes").delete().eq("nome", n).eq("id", id))); if(n === "parceiros") ops.push(q(sb.from("colecoes").delete().eq("nome", "pins").eq("id", id))); delete s.cols[n][id]; } });
    }
    if(N.admin) for(const n of UNICOS){ const js = J(DB[n]); if(s.unicos[n] !== js){ ops.push(q(sb.from("colecoes").upsert({ nome: n, id: "1", dados: DB[n] }))); s.unicos[n] = js; } }
    /* anúncios vistos e clicados */
    if(DB.eventos.length > s.ev){ const novos = DB.eventos.slice(s.ev).filter(e => e.u === N.uid).map(e => ({ t: e.t, c: e.c, u: e.u, d: e.d })); if(novos.length) ops.push(q(sb.from("eventos").insert(novos))); s.ev = DB.eventos.length; }
    /* acessos por dia */
    const acc = []; Object.entries(DB.acessos || {}).forEach(([d, L]) => L.forEach(id => { const k = d + "|" + id; if(!s.acc.has(k)){ s.acc.add(k); if(id === N.uid) acc.push({ dia: d, user_id: id }); } }));
    if(acc.length) ops.push(q(sb.from("acessos").upsert(acc, { ignoreDuplicates: true })));
    await Promise.all(ops);
  }catch(e){
    console.warn("Erro ao salvar", e); if(avisar) avisar(e);
    Object.assign(s, antes, { ev: s.ev });
    clearTimeout(tm); tm = setTimeout(() => grava(DB), 4000);
  }
  rodando = false;
  if(deNovo){ deNovo = false; grava(DB); }
}
})();
