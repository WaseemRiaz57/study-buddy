import { mkdir, readFile, writeFile } from "node:fs/promises";

async function getBuildId() {
  try {
    return (await readFile(".next/BUILD_ID", "utf8")).trim();
  } catch {
    return Date.now().toString(36);
  }
}

const buildId = await getBuildId();
const swSource = `const CACHE_PREFIX = "studybuddy";
const CACHE_VERSION = ${JSON.stringify(buildId)};
const STATIC_CACHE = \`\${CACHE_PREFIX}-static-\${CACHE_VERSION}\`;
const PAGE_CACHE = \`\${CACHE_PREFIX}-pages-\${CACHE_VERSION}\`;
const STATIC_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
            .filter((cacheName) => ![STATIC_CACHE, PAGE_CACHE].includes(cacheName))
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    ["image", "audio", "font"].includes(request.destination)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (["script", "style", "worker"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response("StudyBuddy is offline. Reconnect to load this page.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  });

  return cachedResponse || networkResponsePromise;
}
`;

await mkdir("public", { recursive: true });
await writeFile("public/sw.js", swSource);

console.log("Generated PWA service worker at public/sw.js.");
