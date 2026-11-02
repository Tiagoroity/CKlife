/* ===================== DE ONDE A ALUNA VEIO (embaixadoras e anúncios) =====================
   Regra do ÚLTIMO CLIQUE: vale o último link com origem que ela abriu antes de se cadastrar (até 30 dias).
   - ?e=codigo  → embaixadora (ex.: cklife.com.br/?e=micaela)
   - utm_source → anúncio ou outra campanha (ex.: utm_source=meta)
   Abrir o app sem nada no link não apaga a origem anterior. Depois do cadastro, a origem fica gravada na aluna
   e não muda mais. Só guarda o código do link e a data (nenhum dado pessoal). */
const ORIG_K = "ck_orig", ORIG_DIAS = 30;
(function capturaOrigem(){
  try{
    const u = new URL(location.href), e = (u.searchParams.get("e") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    const src = (u.searchParams.get("utm_source") || "").slice(0, 40);
    if(!e && !src) return;
    const o = { em: typeof today === "function" ? today() : new Date().toISOString().slice(0, 10) };
    if(e) o.e = e; else { o.src = src; const c = u.searchParams.get("utm_campaign"), ct = u.searchParams.get("utm_content"); if(c) o.campanha = c.slice(0, 60); if(ct) o.anuncio = ct.slice(0, 60); }
    localStorage.setItem(ORIG_K, JSON.stringify(o));
    if(e){ u.searchParams.delete("e"); history.replaceState(history.state, "", u.pathname + u.search + u.hash); }
  }catch(err){}
})();
/* origem válida no momento do cadastro (ou nada) */
function origemAtual(){
  try{
    const o = JSON.parse(localStorage.getItem(ORIG_K) || "null"); if(!o || !o.em) return undefined;
    const dias = (Date.now() - new Date(o.em + "T12:00:00").getTime()) / 864e5; if(dias > ORIG_DIAS) return undefined;
    return o;
  }catch(e){ return undefined; }
}
