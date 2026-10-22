// CK Life · recebe os avisos de venda da Kiwify e libera (ou corta) o Premium da aluna.
// Variáveis na Vercel: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, WEBHOOK_CHAVE
module.exports = async (req, res) => {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY, chave = process.env.WEBHOOK_CHAVE;
  if (req.method === "GET") return res.status(200).json({ ok: true, configurado: !!(url && key && chave) });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!chave || (req.query && req.query.chave) !== chave) return res.status(401).json({ ok: false, erro: "chave inválida" });
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    console.log("Kiwify recebido:", JSON.stringify(b).slice(0, 1500));
    const cliente = b.Customer || b.customer || {};
    const email = String(cliente.email || b.email || "").trim().toLowerCase();
    if (!email) return res.status(200).json({ ok: true, ignorado: "sem e-mail" });
    const evento = String(b.webhook_event_type || b.event || "").toLowerCase();
    const st = String(b.order_status || b.status || "").toLowerCase();
    let status = null;
    if (/refund|reembols|chargeback|charged_back|cancel|expired|late|overdue/.test(evento + " " + st)) status = "cancelado";
    else if (/approved|aprovad|paid|renewed|renovad|complete/.test(evento + " " + st)) status = "aprovado";
    if (!status) return res.status(200).json({ ok: true, ignorado: evento || st || "evento desconhecido" });
    const produto = (b.Product && (b.Product.product_name || b.Product.name)) || b.product_name || "";
    const r = await fetch(`${url}/rest/v1/compras?on_conflict=email`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ email, status, produto, atualizado: new Date().toISOString() })
    });
    if (!r.ok) { const t = await r.text(); console.log("Erro no Supabase:", r.status, t); return res.status(500).json({ ok: false }); }
    return res.status(200).json({ ok: true, email, status });
  } catch (e) {
    console.log("Erro:", e && e.message);
    return res.status(500).json({ ok: false });
  }
};
