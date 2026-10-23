// CK Life · webhook da Kiwify (versão web).
// Segue a documentação oficial: a Kiwify envia POST com JSON e o parâmetro ?signature=<HMAC-SHA1 hex>,
// calculado sobre o CORPO BRUTO com o token do webhook como chave. Eventos repetidos são esperados.
// Variáveis na Vercel (Settings > Environment Variables):
//   KIWIFY_TOKEN               token do webhook cadastrado na Kiwify (obrigatória)
//   KIWIFY_TOKEN_ANTIGO        opcional: token anterior durante a troca (aceito por ~1 dia)
//   SUPABASE_SERVICE_ROLE_KEY  chave de serviço do Supabase (nunca vai para o app)
// O Pro só é liberado pelo banco (função kiwify_processa), nunca por redirecionamento ou pelo app.
const crypto = require("crypto");
const SUPA = process.env.SUPABASE_URL || "https://psxmyiudtuozasbqzvnu.supabase.co";

// lê o corpo BRUTO pelo stream (acessar req.body faria a Vercel converter o JSON e a assinatura não bateria)
const lerCorpo = req => new Promise((ok, no) => {
  const partes = []; req.on("data", c => partes.push(c)); req.on("end", () => ok(Buffer.concat(partes).toString("utf8"))); req.on("error", no);
});
const confere = (corpo, assinatura, token) => {
  if (!token || !/^[0-9a-f]{40}$/i.test(assinatura || "")) return false;
  const esperado = crypto.createHmac("sha1", token).update(corpo, "utf8").digest("hex");
  return crypto.timingSafeEqual(Buffer.from(esperado, "hex"), Buffer.from(String(assinatura).toLowerCase(), "hex"));
};

async function handler(req, res) {
  const token = process.env.KIWIFY_TOKEN, antigo = process.env.KIWIFY_TOKEN_ANTIGO, chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (req.method === "GET") return res.status(200).json({ ok: true, configurado: !!(token && chave) });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!token || !chave) { console.log("webhook: faltam variáveis KIWIFY_TOKEN/SUPABASE_SERVICE_ROLE_KEY"); return res.status(503).json({ ok: false, erro: "não configurado" }); }
  let corpo;
  try { corpo = await lerCorpo(req); } catch (e) { return res.status(400).json({ ok: false }); }
  const assinatura = (req.query && req.query.signature) || new URL(req.url, "http://x").searchParams.get("signature");
  if (!confere(corpo, assinatura, token) && !confere(corpo, assinatura, antigo)) { console.log("webhook: assinatura inválida"); return res.status(401).json({ ok: false, erro: "assinatura inválida" }); }
  let p; try { p = JSON.parse(corpo); } catch (e) { return res.status(400).json({ ok: false, erro: "json inválido" }); }
  if (!p.webhook_event_type) return res.status(200).json({ ok: true, ignorado: "sem webhook_event_type (ex.: carrinho abandonado)" });
  try {
    const r = await fetch(`${SUPA}/rest/v1/rpc/kiwify_processa`, { method: "POST", headers: { apikey: chave, Authorization: `Bearer ${chave}`, "Content-Type": "application/json" }, body: JSON.stringify({ p }) });
    const j = await r.json().catch(() => null);
    console.log("webhook:", p.webhook_event_type, p.order_id, r.status, JSON.stringify(j));
    if (!r.ok || (j && j.ok === false)) return res.status(500).json({ ok: false });   // a Kiwify tenta de novo
    return res.status(200).json({ ok: true });
  } catch (e) { console.log("webhook erro:", e && e.message); return res.status(500).json({ ok: false }); }
}
module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
module.exports._confere = confere;
