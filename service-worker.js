// Jina la kache. Badilisha toleo (k.m., v1, v2) kila unapofanya mabadiliko kwenye faili za kukache.
const CACHE_NAME = 'malipo-app-cache-v1';

// Orodha ya faili zote muhimu ambazo zinapaswa kukachewa kwa matumizi ya nje ya mtandao.
// Hakikisha njia (paths) zote ni sahihi na faili zinapatikana.
const urlsToCache = [
  '/', // Ukurasa wa nyumbani
  '/index.html', // Faili kuu ya HTML
  '/manifest.json', // Faili ya manifest ya PWA
  '/icon.png', // Ikoni ya programu (kama ilivyofafanuliwa kwenye manifest.json)
  // Maktaba za JavaScript kutoka CDN
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

// Tukio la 'install': Hukache faili zote zilizoorodheshwa wakati service worker inasakinishwa.
// self.skipWaiting() inahakikisha service worker mpya inachukua udhibiti mara moja.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Inakache faili muhimu.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Anzisha service worker mpya mara moja
      .catch(error => {
        console.error('Service Worker: Kushindwa kukache faili zote:', error);
      })
  );
});

// Tukio la 'activate': Hufuta kache za zamani ili kuhakikisha toleo jipya linatumika.
// self.clients.claim() inaruhusu service worker mpya kuchukua udhibiti wa tabo zote zilizofunguliwa.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Inafuta kache ya zamani:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Chukua udhibiti wa wateja wote mara moja
  );
});

// Tukio la 'fetch': Hujibu maombi ya mtandao kutoka kache kwanza, kisha mtandao.
// Ikiwa faili haipo kwenye kache, inajaribu kuichukua kutoka mtandaoni na kuikache kwa matumizi ya baadaye.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Ikiwa jibu lipo kwenye kache, lirudishe.
        if (response) {
          return response;
        }
        // Vinginevyo, nenda kwenye mtandao.
        return fetch(event.request).then(
          response => {
            // Angalia ikiwa tumepokea jibu halali.
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Kache jibu jipya kwa matumizi ya baadaye.
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(error => {
          console.log('Service Worker: Kushindwa kufetch au hakuna mtandao:', event.request.url, error);
          // Kwa maombi ya HTML (kama vile urambazaji wa ukurasa), rudisha index.html kama mbadala.
          // Kwa faili zingine (kama picha, CSS, JS), kurudisha index.html si sahihi,
          // kwa hivyo ombi litaendelea kushindwa kimya kimya.
          if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
            return caches.match('/index.html'); // Rudisha index.html kama fallback kwa kurasa za HTML
          }
          return undefined; // Acha maombi mengine yashindwe kimya kimya
        });
      })
  );
});
