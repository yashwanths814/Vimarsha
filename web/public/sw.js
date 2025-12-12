// public/sw.js

// Very minimal service worker: no POST caching, no fetch interception

const CACHE_NAME = "vimarsha-basic-v1";

// (Optional) precache some static files
const PRECACHE_URLS = ["/", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // ignore errors
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// ❌ IMPORTANT: do NOT intercept fetch at all.
// This automatically avoids any POST/Cache errors.
// If you ever want advanced caching, we can add a safe handler later.
