/* ===== Estado + cidade de todo o Brasil (lista oficial do IBGE) =====
   As cidades que já existem no banco (as de MT) continuam com o mesmo número.
   As outras usam o código do IBGE e a lista só é baixada quando a aluna escolhe o estado. */
const UFS = [["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"]];
let BR_CID = null, BR_PROM = null;
function brCidades(){
  if(BR_CID) return Promise.resolve(BR_CID);
  if(!BR_PROM) BR_PROM = fetch("/cidades-br.json", { cache: "force-cache" }).then(r => { if(!r.ok) throw new Error("lista"); return r.json(); }).then(j => (BR_CID = j)).catch(e => { BR_PROM = null; throw e; });
  return BR_PROM;
}
/* cidades de um estado: as do banco (mesmo número de sempre) + as do IBGE que ainda não estão no banco */
async function cidadesDoUF(uf){
  const doBanco = (DB.cidades || []).filter(c => c.uf === uf && c.ativa !== false).map(c => ({ id: +c.id, nome: c.nome }));
  let ibge = [];
  try{ ibge = ((await brCidades())[uf] || []).map(([id, nome]) => ({ id, nome })); }catch(e){ console.warn(e); }
  const tem = new Set(doBanco.map(c => norm(c.nome)));
  return doBanco.concat(ibge.filter(c => !tem.has(norm(c.nome)))).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
/* qual estado é a cidade de alguém (para abrir já preenchido) */
function ufDe(u){
  if(!u) return "";
  if(u.cidadeInfo && +u.cidadeInfo.id === +u.cidade) return u.cidadeInfo.uf || "";
  const c = (DB.cidades || []).find(x => +x.id === +u.cidade); return (c && c.uf) || "";
}
/* nome da cidade de alguém, mesmo quando ela não está no banco */
window.ckCidNome = (id, u) => {
  if(id == null || id === "") return "";
  const c = (DB.cidades || []).find(x => +x.id === +id); if(c) return c.nome;
  const p = u || (typeof ME !== "undefined" ? ME : null);
  return p && p.cidadeInfo && +p.cidadeInfo.id === +id ? p.cidadeInfo.nome : "";
};
/* liga os dois campos (estado e cidade) */
function ligaCidade(ufSel, cidSel, u){
  const selU = $(ufSel), selC = $(cidSel); if(!selU || !selC) return;
  const ufAtual = ufDe(u);
  selU.innerHTML = `<option value="">Escolha o estado</option>` + UFS.map(([s, n]) => `<option value="${s}" ${s === ufAtual ? "selected" : ""}>${esc(n)}</option>`).join("");
  const enche = async (manter) => {
    const uf = selU.value;
    if(!uf){ selC.innerHTML = `<option value="">Primeiro escolha o estado</option>`; selC.disabled = true; return; }
    selC.disabled = true; selC.innerHTML = `<option value="">Carregando cidades…</option>`;
    const L = await cidadesDoUF(uf);
    if(selU.value !== uf) return;
    if(!L.length){ selC.innerHTML = `<option value="">Não foi possível carregar. Tente de novo.</option>`; selC.disabled = false; return; }
    const atual = manter && u ? +u.cidade : null;
    selC.innerHTML = `<option value="">Escolha a cidade</option>` + L.map(c => `<option value="${c.id}" ${c.id === atual ? "selected" : ""}>${esc(c.nome)}</option>`).join("");
    selC.disabled = false;
  };
  selU.onchange = () => enche(false);
  enche(true);
}
/* o que guardar junto com a cidade escolhida */
function cidadeEscolhida(ufSel, cidSel){
  const selU = $(ufSel), selC = $(cidSel); if(!selU || !selC || !selC.value) return null;
  const o = selC.options[selC.selectedIndex];
  return { id: +selC.value, nome: o ? o.textContent : "", uf: selU.value };
}
