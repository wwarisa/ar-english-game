/**
 * sw.js — Service Worker (ทำให้เล่นออฟไลน์ + ติดตั้งเป็นแอปได้)
 * ------------------------------------------------------------
 * Strategy:
 *  - Precache the app shell on install (แคชไฟล์หลักตอนติดตั้ง)
 *  - Cache-first for our own files; network fallback (เร็ว + ออฟไลน์)
 *  - CDN A-Frame/AR.js are cached at runtime when AR is used
 *  Bump CACHE version to force an update (เปลี่ยนเวอร์ชันเพื่ออัปเดต)
 */
const CACHE = "safari-v2.1.0";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./config/vocabulary.js",
  "./manifest.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        // Runtime-cache same-origin + CDN assets (แคชระหว่างใช้งาน)
        try {
          const url = new URL(req.url);
          const cacheable = url.origin === location.origin ||
            /aframe|ar-js|githack|jsdelivr|unpkg/i.test(url.host);
          if (cacheable && res.ok && res.type !== "opaque") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
        } catch (err) {}
        return res;
      }).catch(() => hit); // offline & not cached
    })
  );
});
