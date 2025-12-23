// service-worker.js
const CACHE_NAME = 'webtonotive-cache-v1';
const urlsToCache = [
    './', // الصفحة الرئيسية
    // يمكن إضافة ملفات أخرى هنا
];

// التثبيت
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache ouvert');
                return cache.addAll(urlsToCache);
            })
    );
});

// التفعيل
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// الاستجابة للطلبات
self.addEventListener('fetch', event => {
    // استراتيجية Cache First
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // من التخزين المؤقت
                }
                
                // جلب من الشبكة
                return fetch(event.request)
                    .then(response => {
                        // لا تخزن إلا الردود الناجحة
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // نسخ الرد للتخزين
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.log('Fetch échoué:', error);
                        // يمكن إعادة توجيه إلى صفحة Offline هنا
                    });
            })
    );
});