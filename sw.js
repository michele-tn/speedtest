(function(){

const CACHE_NAME = "broadband-speedtest-v1"
const STATIC_CACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./favicon.ico",
  "./favicon-16x16.png",
  "./favicon-32x32.png",
  "./favicon-32x32.png",
  "./apple-touch-icon.png",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./icon_72x72.png",
  "./icon_96x96.png",
  "./icon_128x128.png",
  "./icon_144x144.png",
  "./icon_152x152.png",
  "./icon_192x192.png",
  "./icon_384x384.png",
  "./icon_512x512.png",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  //"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
]

// Install event - cache essential resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      // Cache resources individually to avoid failures
      return Promise.allSettled(
        STATIC_CACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err)
            return null
          }),
        ),
      )
    }),
  )
  self.skipWaiting()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === "document") {
          return caches.match("./index.html")
        }
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Background sync for offline test results
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle any pending operations when back online
  console.log("Background sync triggered")
}

// Push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Speed test completed!",
    icon: "./icon_192x192.png",
    badge: "./icon_72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Results",
        icon: "./icon_192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "./icon_192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Broadband SpeedTest", options))
})

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("./"))
  }
})

})();