const CACHE_NAME = "audiomab-v1";
const AUDIO_CACHE_NAME = "audiomab-audio";

// Static assets to cache for offline use
const STATIC_ASSETS = [
    "/",
    "/search",
    "/library",
    "/library/favorites",
    "/library/recent",
    "/manifest.json",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[SW] Caching static assets");
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle audio cache separately
    if (url.pathname.startsWith("/audio/")) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then((cache) => {
                return cache.match(request).then((response) => {
                    if (response) {
                        console.log("[SW] Serving audio from cache:", url.pathname);
                        return response;
                    }
                    return fetch(request);
                });
            })
        );
        return;
    }

    // Handle API requests - network only
    if (url.pathname.startsWith("/api/")) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(JSON.stringify({ error: "Offline" }), {
                    status: 503,
                    headers: { "Content-Type": "application/json" },
                });
            })
        );
        return;
    }

    // Handle navigation requests
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the response for offline
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Return cached version or fallback
                    return caches.match(request).then((response) => {
                        return response || caches.match("/");
                    });
                })
        );
        return;
    }

    // For other requests, try cache first, then network
    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(request).then((networkResponse) => {
                // Cache successful responses
                if (networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            });
        })
    );
});

// Handle share target (when user shares to the app)
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Handle share-target
    if (url.pathname === "/share-target" && event.request.method === "POST") {
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const text = formData.get("text") || formData.get("url") || "";

                // Redirect to home with the shared URL
                return Response.redirect(`/?share=${encodeURIComponent(text)}`, 303);
            })()
        );
    }
});

// Background sync for downloads
self.addEventListener("sync", (event) => {
    if (event.tag === "audio-download") {
        event.waitUntil(
            // Handle background audio downloads if needed
            Promise.resolve()
        );
    }
});
