/* Offline support. Pages and scripts are network-first so updates show immediately,
   and fall back to the cache when there's no connection. Fonts are cache-first. */
const CACHE = "rtf-20260928111104";
const SHELL = [
  "./", "index.html", "config.js", "manifest.webmanifest", "icons/icon.svg",
  "assets/app.css", "assets/app.js", "assets/store.js",
  "assets/data/links.js", "assets/data/plan.js", "assets/data/reference.js", "assets/data/questions.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return;
  if (url.hostname.includes("fonts.g")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("index.html"))));
});
