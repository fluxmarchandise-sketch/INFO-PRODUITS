// sw.js
const CACHE_NAME = 'gestion-reserve-v1';
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
    'https://unpkg.com/idb@7/build/umd.js'
];

// التثبيت - تخزين الملفات في الكاش
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Mise en cache des fichiers pour le mode hors ligne');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// التنشيط - تنظيف الكاش القديم
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// جلب الملفات من الكاش عند عدم وجود اتصال
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا وجد الملف في الكاش، استخدمه
                if (response) {
                    return response;
                }
                
                // وإلا جبعه من الشبكة
                return fetch(event.request).then(response => {
                    // لا تخزن الملفات الديناميكية (TSV/CSV) في الكاش
                    if (!event.request.url.includes('.tsv') && 
                        !event.request.url.includes('.csv') &&
                        !event.request.url.includes('google.com')) {
                        return caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                // إذا فشل الجلب من الشبكة وكان الملف HTML، أعرض الصفحة المخزنة
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/');
                }
            })
    );
});