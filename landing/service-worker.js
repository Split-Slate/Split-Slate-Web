"use strict";

// Bump for EVERY landing HTML, CSS, script, font, or screenshot change before uploading a release.
// Finish the complete snapshot before activating and refreshing open landing pages once.
const CACHE_VERSION = "2026-10-12-v5";
const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `split-slate-landing:${SCOPE.href}:`;
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const PAGE_URL = SCOPE.href;
const INDEX_URL = new URL("index.html", SCOPE).href;
// Internal cache metadata, not a fetched asset or an intercepted public URL.
const UPDATE_INFO_URL = new URL(".landing-update-info", SCOPE).href;
const ASSET_PATHS = [
  "./",
  "styles.css",
  "animations.js",
  "scroll-story.js",
  "offline.js",
  "constants/story-data.js",
  "components/workspace/index.js",
  "components/story-phone/index.js",
  "components/scroll-story/index.js",
  "components/screenshot-gallery/index.js",
  "utils/story-timeline.js",
  "favicon.svg",
  "fonts/montserrat-regular.woff2",
  "fonts/saira-bold.woff2",
  "fonts/space-grotesk-semibold.woff2",
  "fonts/plus-jakarta-sans.woff2",
  "images/group-desktop.png",
  "images/group-mobile.png",
  "images/expense-desktop.png",
  "images/expense-mobile-1.png",
  "images/expense-mobile-2.png",
  "images/balances-desktop.png",
  "images/balances-mobile-1.png",
  "images/balances-mobile-2.png",
];
const ASSET_URLS = ASSET_PATHS.map((path) => new URL(path, SCOPE).href);
const ASSET_SET = new Set(ASSET_URLS);

const isUsable = (response, url) => {
  const isHtml = (response.headers.get("content-type") || "").includes("text/html");
  // Reject failed/redirected requests and Netlify's HTML fallbacks masquerading as missing assets.
  return (
    response.ok &&
    !response.redirected &&
    response.type !== "opaque" &&
    (url === PAGE_URL ? isHtml : !isHtml)
  );
};

const installSnapshot = async () => {
  // Fetch everything before writing. Unopened/lazy screenshots and the phone font are included.
  // Failed installation leaves the prior active worker/cache intact rather than claiming offline
  // support with an incomplete snapshot. cache: reload bypasses stale browser HTTP-cache entries.
  const responses = await Promise.all(
    ASSET_URLS.map(async (url) => {
      const response = await fetch(
        new Request(url, { cache: "reload", credentials: "same-origin" }),
      );
      if (!isUsable(response, url)) throw new Error(`Could not cache landing asset: ${url}`);
      return response;
    }),
  );
  const cache = await caches.open(CACHE_NAME);
  try {
    await Promise.all(ASSET_URLS.map((url, index) => cache.put(url, responses[index])));
    // Persist across worker suspension between install and activate. An existing active worker
    // means an upgrade; first installation must not refresh a page that is already current.
    await cache.put(
      UPDATE_INFO_URL,
      new Response(
        JSON.stringify({
          refresh: Boolean(self.registration.active),
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
  } catch (error) {
    await caches.delete(CACHE_NAME);
    throw error;
  }
  await self.skipWaiting();
};

self.addEventListener("install", (event) => {
  event.waitUntil(installSnapshot());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const updateInfo = await cache.match(UPDATE_INFO_URL);
      const refresh = updateInfo ? (await updateInfo.json()).refresh === true : false;
      // Consume BEFORE requesting navigation, so worker restarts/new page loads cannot loop.
      await cache.delete(UPDATE_INFO_URL);
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
      if (refresh) {
        const windows = await self.clients.matchAll({ type: "window" });
        windows.forEach((client) => {
          const url = new URL(client.url);
          url.search = "";
          url.hash = "";
          if (url.href !== PAGE_URL && url.href !== INDEX_URL) return;
          // Worker-owned navigation also refreshes legacy pages without an update listener.
          // Keep the client's actual query/hash, and do not await navigation: its fetch needs
          // this activation event to finish. Each matched tab gets a single navigation request.
          client.navigate(client.url).catch((error) => {
            console.warn("Split Slate landing: automatic update refresh failed.", error);
          });
        });
      }
    })(),
  );
});

const cachedResponse = async (url) => {
  let cache;
  try {
    cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(url);
    if (cached) return cached;
  } catch {
    // An unavailable Cache API must not prevent a normal online fetch.
  }
  try {
    // Recover an evicted entry when online; never store an error page as an asset.
    const response = await fetch(new Request(url, { cache: "reload", credentials: "same-origin" }));
    if (cache && isUsable(response, url)) {
      try {
        await cache.put(url, response.clone());
      } catch {
        // Storage failure must not discard a usable online response.
      }
    }
    return response;
  } catch {
    return new Response("This file is unavailable offline. Reconnect and revisit the website.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
};

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin) return;
  // A tracking query does not create a separate offline page/asset. Fragments never reach fetch.
  url.search = "";
  url.hash = "";
  const isLandingPage =
    request.mode === "navigate" && (url.href === SCOPE.href || url.href === INDEX_URL);
  // Precache the directory entry, not /index.html: static hosts can redirect the latter to /.
  // Both navigation aliases share this cached response without depending on an offline redirect.
  const cacheKey = isLandingPage ? PAGE_URL : url.href;
  if (!isLandingPage && !ASSET_SET.has(cacheKey)) return;
  // Only the explicit landing allowlist is intercepted. No app routes, API, external origin,
  // backups, or arbitrary navigation is fetched/cached by this worker.
  event.respondWith(cachedResponse(cacheKey));
});
