/* CK Life · service worker só para notificações (não guarda cache: o app sempre carrega a versão mais nova) */
const SUPA = "https://psxmyiudtuozasbqzvnu.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeG15aXVkdHVvemFzYnF6dm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDcxOTEsImV4cCI6MjEwODI4MzE5MX0.-uSUzK80Eh43YJzjLGh_yUN4tsw7DtejWiHqzQefPv8";
// confirma recebimento/toque só dos avisos da Central (sem dado pessoal: id do aviso + chave do próprio aviso)
const confirma = (d, tipo) => d && d.cid && d.rk ? fetch(`${SUPA}/rest/v1/rpc/push_confirma`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" }, body: JSON.stringify({ p_cid: d.cid, p_rk: d.rk, p_tipo: tipo }) }).catch(() => {}) : Promise.resolve();
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => {
    const aberto = L.find(c => c.visibilityState === "visible");
    // app aberto na tela: ele mesmo mostra o aviso com o som do CK Life; a notificação do sistema vem silenciosa
    if (aberto) aberto.postMessage({ tipo: "push-ao-vivo", p: { title: d.title, body: d.body, url: d.url } });
    const op = { body: d.body || "", tag: d.tag || "ck", renotify: !aberto, silent: !!aberto, icon: "/img/icone-192.png", badge: "/img/icone-192.png", vibrate: [60, 40, 60, 40, 120], data: { url: d.url || "/", cid: d.cid, rk: d.rk }, timestamp: Date.now() };
    if (d.image && /^https:\/\//.test(d.image)) op.image = d.image;
    return Promise.all([self.registration.showNotification(d.title || "CK Life", op), confirma(d, "recebido")]);
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close(); const dd = e.notification.data || {}; let url = dd.url || "/";
  try { const u = new URL(url, self.location.origin); url = u.href; } catch (er) { url = "/"; }
  const mesmo = url.startsWith(self.location.origin);
  e.waitUntil(Promise.all([confirma(dd, "clique"), mesmo ? self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => { const c = L.find(x => x.url.startsWith(self.location.origin)); if (c) { c.focus(); c.postMessage({ tipo: "push", url }); return; } return self.clients.openWindow(url); }) : self.clients.openWindow(url)]));
});
