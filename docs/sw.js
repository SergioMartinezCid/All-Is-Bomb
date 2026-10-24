/* Service worker: keeps every file of the game on the device, so it can be installed and played offline. */
importScripts('js/cards.js');

const CACHE = 'aib-3';
const { INST_LIST, EXPANSIONS } = self.AIB;
const FILES = [
  './', 'index.html', 'style.css', 'manifest.json',
  'js/cards.js', 'js/engine.js', 'js/sound.js', 'js/ui.js',
  'img/favicon.svg', 'img/favicon.png', 'img/icon-180.png', 'img/icon-192.png', 'img/icon-512.png', 'img/icon-maskable.png',
  ...INST_LIST.flatMap(i => [`img/cards/${i.id}_p.webp`, `img/cards/${i.id}_i.webp`]),
  ...Object.keys(EXPANSIONS).map(k => `img/icons/${k}.webp`),
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Font files never change: serve them from the cache. Everything else (card art can be re-rendered)
// goes to the network first, so updates show up straight away, and falls back to the stored copy offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || (url.origin !== location.origin && !FONT_HOSTS.includes(url.hostname))) return;
  if (url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetchAndKeep(req, url)));
  } else {
    e.respondWith(fetchAndKeep(req, url).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(hit => hit || Response.error())));
  }
});

function fetchAndKeep(req, url) {
  return fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') {
      // Own files are stored without their ?v= tag, so each update replaces the old copy.
      const key = url.origin === location.origin ? url.origin + url.pathname : req;
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(key, copy));
    }
    return res;
  });
}
