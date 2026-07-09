// Magical Bakery Online — Service Worker (minimal、 offline 時は接続待ち UI に依存)
const CACHE_NAME = "magical-bakery-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // WebSocket 経由 / parties path / API は cache せずそのまま
  if (url.pathname.startsWith("/parties/") || url.pathname.startsWith("/api/")) {
    return;
  }
  // navigation requests: network first, fallback cache
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => caches.match("/index.html")),
    );
    return;
  }
  // static assets: cache first
  e.respondWith(
    caches.match(e.request).then((cached) => cached ?? fetch(e.request)),
  );
});
