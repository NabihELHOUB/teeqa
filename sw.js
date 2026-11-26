// Service worker de TEEQA en ligne (21 nov. 2026) : seulement les notifications (Web Push).
// Copié à la racine de la publication par deploiement/publier.sh. Il ne garde rien en cache : l'appli se charge toujours
// fraîche depuis GitHub Pages (pas de version périmée coincée sur un téléphone).
// iPhone : les notifications ne marchent que pour l'appli ajoutée à l'écran d'accueil (Partager › Sur l'écran d'accueil),
// iOS 16.4 ou plus, et chaque notification reçue DOIT être affichée (sinon Safari coupe l'abonnement) : c'est ce qu'on fait.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  const titre = d.title || 'TEEQA';
  e.waitUntil(self.registration.showNotification(titre, {
    body: d.body || 'Du nouveau sur votre chantier.',
    icon: 'assets/icone/icon-192.png',
    badge: 'assets/icone/icon-192.png',
    tag: d.tag || undefined,
    lang: 'fr',
    data: { route: d.route || '#/home' },
  }));
});

// Toucher la notification : ouvre l'appli (ou la ramène devant) sur le bon écran.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const route = (e.notification.data && e.notification.data.route) || '#/home';
  const cible = new URL('index.html' + (route.startsWith('#') ? route : '#/home'), self.registration.scope).href;
  e.waitUntil((async () => {
    const fen = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of fen) {
      if (c.url.startsWith(self.registration.scope)) { await c.focus(); if ('navigate' in c) return c.navigate(cible); return; }
    }
    return self.clients.openWindow(cible);
  })());
});

// Abonnement changé par le navigateur : l'appli le réenregistre à sa prochaine ouverture (cloud.activerNotifications).
self.addEventListener('pushsubscriptionchange', () => {});
