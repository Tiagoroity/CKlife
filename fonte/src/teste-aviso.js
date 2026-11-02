/* ===================== AVISO GENTIL: TESTE PRO ACABANDO =====================
   Uma vez só, quando faltam 2 ou 3 dias do teste grátis: mostra o que ela já fez no CK Life e o convite para
   continuar no Pro. Sem pressão: ela pode tocar em "Agora não" e segue no gratuito sem perder nada.
   Usa os planos e a tela de assinatura que já existem (paywall). Não cria cobrança nova. */
const TA_K = "ck_teste_aviso";
function taResumo(){
  const T = ME.treinos || [], min = T.reduce((a, t) => a + (+t.min || 0), 0), dias = new Set(T.map(t => t.d)).size;
  const conq = ME.conq ? Object.keys(ME.conq).length : 0;
  return { treinos: T.length, min, dias, conq };
}
function taCard(){
  const d = typeof ENT !== "undefined" && ENT.d; if(!d || !d.trial || d.dias_restantes == null) return "";
  const falta = +d.dias_restantes; if(falta < 2 || falta > 3) return "";
  let visto = null; try{ visto = localStorage.getItem(TA_K); }catch(e){}
  if(visto || (ME && ME.testeAviso)) return "";
  const r = taResumo();
  const feito = r.treinos
    ? `Nesses dias você fez <b>${r.treinos} ${r.treinos === 1 ? "treino" : "treinos"}</b>${r.min ? ` (${r.min} min)` : ""}${r.conq ? ` e ganhou <b>${r.conq} ${r.conq === 1 ? "conquista" : "conquistas"}</b>` : ""}. Que orgulho! 💚`
    : "Ainda dá tempo de aproveitar tudo: que tal um treino de 5 minutos hoje?";
  return `<div class="ta-card" id="ta-card"><span class="eyebrow"><i class='ckc' aria-hidden='true'></i> Seu teste Pro termina em ${falta} dias</span>
    <p>${feito}</p>
    <p class="ta-sub">Se quiser continuar com tudo liberado, é só escolher um plano. Se preferir, você segue no gratuito e não perde nada: conta, histórico, amigas e conquistas continuam.</p>
    <div class="ta-bt"><button class="btn btn-accent btn-sm" id="ta-pro">Ver planos Pro</button><button class="link" id="ta-nao">Agora não</button></div></div>`;
}
const taVisto = () => { try{ localStorage.setItem(TA_K, today()); }catch(e){} try{ if(ME && !ME.testeAviso){ ME.testeAviso = today(); save(); } }catch(e){} };
const rInicioTA = rInicio;
rInicio = function(){
  const r = rInicioTA.apply(this, arguments);
  try{
    const h = taCard(); if(!h || $("ta-card")) return r;
    const alvo = document.querySelector("#t-inicio .pl-bloco") || document.querySelector("#t-inicio .xe-dia"); if(!alvo) return r;
    alvo.insertAdjacentHTML(alvo.classList.contains("pl-bloco") ? "afterend" : "afterbegin", h);
    $("ta-pro").onclick = () => { taVisto(); try{ registraEvento("teste_aviso_clicou", {}); }catch(e){} paywall("teste_dia5"); };
    $("ta-nao").onclick = () => { taVisto(); const c = $("ta-card"); if(c) c.remove(); };
    try{ registraEvento("teste_aviso_visto", {}); }catch(e){}
  }catch(e){ console.warn(e); }
  return r;
};
