/* CK Life · service worker só para notificações (não guarda cache: o app sempre carrega a versão mais nova) */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "CK Life", { body: d.body || "", tag: d.tag || "ck", renotify: true, icon: "/img/icone-192.png", badge: "/img/icone-192.png", data: { url: d.url || "/" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(L => { const c = L.find(x => x.url.startsWith(self.location.origin)); if (c) { c.focus(); c.postMessage({ tipo: "push", url }); return; } return self.clients.openWindow(url); }));
});
