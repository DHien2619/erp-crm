/* ERP-CRM service worker — offline cơ bản (app shell + offline fallback).
   Dữ liệu tài chính KHÔNG cache (luôn lấy mạng để chính xác). */
const CACHE = "erp-crm-v1";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Bỏ qua cross-origin (Supabase, Lark, font...) — luôn lấy mạng.
  if (url.origin !== self.location.origin) return;
  // Không cache API (dữ liệu động).
  if (url.pathname.startsWith("/api/")) return;

  // Điều hướng (HTML): network-first, fallback cache rồi offline.html.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Tài nguyên tĩnh: cache-first, nền cập nhật.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
