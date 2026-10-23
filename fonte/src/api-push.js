// CK Life · envia notificações para o celular (Web Push).
// O banco chama esta função com {id, token} de uso único; ela busca o aviso e as inscrições e envia.
// Variáveis na Vercel: VAPID_PRIVATE (obrigatória). A chave pública e a do Supabase já são públicas.
const webpush = require("web-push");
const SUPA = process.env.SUPABASE_URL || "https://psxmyiudtuozasbqzvnu.supabase.co";
const ANON = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeG15aXVkdHVvemFzYnF6dm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDcxOTEsImV4cCI6MjEwODI4MzE5MX0.-uSUzK80Eh43YJzjLGh_yUN4tsw7DtejWiHqzQefPv8";
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || "BJ7wud6TE-eeF889qLG9sRvdppjzQvNJgifeuMN8MrTEkvSYjKbSrLvPyyxPgRJLXywLSwypDdj9RaoTQm60bCc";
const rpc = (n, body) => fetch(`${SUPA}/rest/v1/rpc/${n}`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
module.exports = async (req, res) => {
  const priv = process.env.VAPID_PRIVATE;
  if (req.method === "GET") return res.status(200).json({ ok: true, configurado: !!priv });
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!priv) return res.status(200).json({ ok: false, erro: "VAPID_PRIVATE não configurada" });
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (!/^[0-9a-f-]{36}$/i.test(String(b.id || "")) || !/^[0-9a-f]{40,80}$/i.test(String(b.token || ""))) return res.status(400).json({ ok: false });
    const r = await rpc("push_pegar", { p_id: b.id, p_token: b.token }); const j = r.ok ? await r.json() : null;
    if (!j || !j.subs) return res.status(200).json({ ok: true, enviados: 0 });
    webpush.setVapidDetails("mailto:assessoriaroity@gmail.com", VAPID_PUBLIC, priv);
    let n = 0;
    await Promise.all(j.subs.map(async s => {
      try { await webpush.sendNotification(s, JSON.stringify(j.payload), { TTL: 3600, urgency: "normal" }); n++; }
      catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) await rpc("push_expirou", { p_id: b.id, p_token: b.token, p_endpoint: s.endpoint }); else console.log("push erro", e && e.statusCode); }
    }));
    return res.status(200).json({ ok: true, enviados: n });
  } catch (e) { console.log("Erro:", e && e.message); return res.status(500).json({ ok: false }); }
};
