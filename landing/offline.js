(() => {
  "use strict";

  const script = document.currentScript;
  if (
    !script || !window.isSecureContext || !("serviceWorker" in navigator) ||
    !["http:", "https:"].includes(window.location.protocol)
  ) {
    return;
  }

  // Resolve against this script, so a root deployment and a /landing/ preview have distinct scopes.
  const base = new URL("./", script.src);
  const workerUrl = new URL("service-worker.js", base);
  const register = async () => {
    try {
      const existing = await navigator.serviceWorker.getRegistration(base.href);
      const workers = [existing?.active, existing?.waiting, existing?.installing];
      if (
        existing?.scope === base.href &&
        workers.some((worker) => worker && worker.scriptURL !== workerUrl.href)
      ) {
        // Never replace another site's/app's worker accidentally on the same scope.
        console.warn("Split Slate landing offline cache: another service worker owns this scope.");
        return;
      }
      if (existing?.scope === base.href && existing.updateViaCache === "none") {
        // Explicitly check at startup, even when this page was served by the old offline cache.
        await existing.update();
        return;
      }
      await navigator.serviceWorker.register(workerUrl.href, {
        scope: base.href,
        updateViaCache: "none",
      });
    } catch (error) {
      // Registration/storage restrictions must not break the online page or its story/gallery.
      console.warn("Split Slate landing: offline caching/update check is unavailable.", error);
    }
  };

  // This deferred script runs during page startup; do not wait for images/window.load.
  register();
})();
