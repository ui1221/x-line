const cacheName = "x-line-pwa-v31";
const assets = [
  ".",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "robots.txt",
  "icons/favicon-32.png",
  "icons/favicon-192.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "assets/achievements/play-days.png",
  "assets/modes/endless.png",
  "assets/modes/lines200.png",
  "assets/modes/cleanup.png",
  "assets/modes/longline.png",
  "assets/modes/blast.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
