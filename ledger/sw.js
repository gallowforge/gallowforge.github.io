// Ledger is now Ballast, at /ballast/. A phone or browser that installed the app at /ledger/
// still runs its old service worker, which checks this address for updates. This version
// takes over once, clears the old caches, removes itself and sends open pages to Ballast.
// Data saved on the device is kept: it belongs to the site, not to this worker.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('ledger-')).map((k) => caches.delete(k)));
      await self.registration.unregister();
      const open = await self.clients.matchAll({ type: 'window' });
      await Promise.all(
        open.map((c) => c.navigate(c.url.replace('/ledger/', '/ballast/')).catch(() => {})),
      );
    })(),
  );
});
