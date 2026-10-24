/* 簡單離線快取：先用網絡，失敗先用快取（內容更新後即刻見到） */
const CACHE = 'ta-v6';
const CORE = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest', 'assets/icon.svg',
  'js/vendor/marked.min.js', 'js/store.js', 'js/charts.js', 'js/data-glossary.js', 'js/data-quizzes.js',
  'content/level1.js', 'content/level2.js', 'content/level3.js', 'content/level4.js', 'content/level5.js', 'content/level6.js', 'content/level7.js', 'content/level8.js', 'content/qa.js',
  'js/tools.js', 'js/tools2.js', 'js/sim.js', 'js/replay.js', 'js/journal.js', 'js/learn.js', 'js/data.js', 'js/lab.js', 'js/edge.js', 'js/vendor/firebase-app-compat.js', 'js/vendor/firebase-auth-compat.js', 'js/vendor/firebase-firestore-compat.js', 'js/cloud-config.js', 'js/cloud.js', 'assets/google.svg', 'js/app.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
  );
});
