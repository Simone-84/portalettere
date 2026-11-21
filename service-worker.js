/* Service worker: riceve le push FCM in background, mostra la notifica
   e aggiorna il badge numerico sull'icona. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// >>> INCOLLA QUI le chiavi del tuo progetto Firebase (stesse di index.html)
firebase.initializeApp({
  apiKey: "AIzaSyD0HO_uIMkmRH60tU2SZlRsmK0xfizmR8M",
  authDomain: "app-ritiro-oggi---portalettere.firebaseapp.com",
  projectId: "app-ritiro-oggi---portalettere",
  messagingSenderId: "1000347001952",
  appId: "1:1000347001952:web:0239d27f697927aaf70f05"
});

const messaging = firebase.messaging();

// Aggiorna il badge = numero di notifiche ancora non aperte
async function aggiornaBadge() {
  const aperte = await self.registration.getNotifications();
  if (!("setAppBadge" in self.navigator)) return;
  if (aperte.length > 0) await self.navigator.setAppBadge(aperte.length);
  else await self.navigator.clearAppBadge();
}

// Messaggi "data-only": gestiamo noi la notifica (necessario anche per iOS)
messaging.onBackgroundMessage(async (payload) => {
  const d = payload.data || {};
  await self.registration.showNotification("Nuova prenotazione", {
    body: "Hai una nuova prenotazione",
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: d.codiceSpedizione,          // un codice = una notifica
    renotify: true,                   // suona anche se il tag esiste già
    requireInteraction: true,
    data: { link: d.linkSharePoint, codice: d.codiceSpedizione }
  });
  await aggiornaBadge();
});

// Tocco sulla notifica: apre (o riporta in primo piano) l'app Ritiro Oggi
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  event.waitUntil((async () => {
    await aggiornaBadge();
    const aperte = await clients.matchAll({ type: "window", includeUncontrolled: true });
    if (aperte.length > 0) {
      aperte[0].postMessage({ codice: d.codice, link: d.link });
      return aperte[0].focus();
    }
    const url = self.registration.scope + "index.html?codice=" + encodeURIComponent(d.codice || "") + "&link=" + encodeURIComponent(d.link || "");
    return clients.openWindow(url);
  })());
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
