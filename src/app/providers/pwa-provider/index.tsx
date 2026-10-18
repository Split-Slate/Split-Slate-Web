import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

import InstallBanner from "@/features/pwa/components/install-banner";
import UpdateNotice from "@/features/pwa/components/update-notice";

import type { IconProgress } from "@/features/pwa/utils/icon-cache";

interface PropsType {
  children: ReactNode;
}

interface PwaState {
  progress: IconProgress | null;
  supported: boolean;
  installed: boolean;
  repairIcons: () => void;
  openInstall: () => void;
  showPostImportHint: () => void;
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "split-slate-install-dismissed";
const ACCEPTED_KEY = "split-slate-install-accepted";
const REMINDER_INTERVAL = 24 * 60 * 60 * 1000;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const hasInstalled = () => isStandalone() || localStorage.getItem(ACCEPTED_KEY) === "true";

const PwaContext = createContext<PwaState>({
  progress: null,
  supported: false,
  installed: false,
  repairIcons: () => undefined,
  openInstall: () => undefined,
  showPostImportHint: () => undefined,
});

// The hook shares the provider's private context; it cannot live in a separate module.
// eslint-disable-next-line react-refresh/only-export-components
export const usePwa = () => useContext(PwaContext);

const PwaProvider = ({ children }: PropsType) => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [progress, setProgress] = useState<IconProgress | null>(null);
  const [installed, setInstalled] = useState(hasInstalled);
  const supported = import.meta.env.PROD && "serviceWorker" in navigator;
  const [installNotice, setInstallNotice] = useState<"automatic" | "manual" | "import" | null>(
    () => {
      const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY));
      const now = Date.now();
      const recentlyDismissed =
        dismissedAt > 0 && dismissedAt <= now && now - dismissedAt < REMINDER_INTERVAL;
      return supported && !hasInstalled() && !recentlyDismissed ? "automatic" : null;
    },
  );
  const [instructions, setInstructions] = useState(false);
  const [installPending, setInstallPending] = useState(false);
  const applying = useRef(false);
  const installPrompt = useRef<InstallPromptEvent | null>(null);
  const prompting = useRef(false);
  const dismissedUpdate = useRef<ServiceWorker | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = noticeRef.current;
    if (!element) return;
    const measure = () => {
      document.documentElement.style.setProperty(
        "--app-notice-height",
        `${element.getBoundingClientRect().height}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--app-notice-height");
    };
  }, []);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const markInstalled = () => {
      localStorage.setItem(ACCEPTED_KEY, "true");
      setInstalled(true);
      setInstallNotice(null);
      setInstructions(false);
      installPrompt.current = null;
    };
    const refreshInstalled = () => {
      if (hasInstalled()) markInstalled();
    };
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (!hasInstalled()) installPrompt.current = event as InstallPromptEvent;
    };
    refreshInstalled();
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", markInstalled);
    window.addEventListener("storage", refreshInstalled);
    window.addEventListener("focus", refreshInstalled);
    window.addEventListener("pageshow", refreshInstalled);
    displayMode.addEventListener("change", refreshInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("storage", refreshInstalled);
      window.removeEventListener("focus", refreshInstalled);
      window.removeEventListener("pageshow", refreshInstalled);
      displayMode.removeEventListener("change", refreshInstalled);
    };
  }, []);

  useEffect(() => {
    if (!supported) return;
    let mounted = true;
    let current: ServiceWorkerRegistration | null = null;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "ICON_PROGRESS") setProgress(event.data as IconProgress);
    };
    const onControllerChange = () => {
      if (applying.current) window.location.reload();
      else check();
    };
    const onUpdate = () => {
      if (
        current?.waiting &&
        current.waiting !== dismissedUpdate.current &&
        navigator.serviceWorker.controller
      ) {
        setUpdateAvailable(true);
      }
    };
    const check = () => {
      onUpdate();
      if (!navigator.onLine) return;
      void current?.update().catch(() => undefined);
      current?.active?.postMessage({ type: "SYNC_ICONS" });
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(check, 60 * 60 * 1000);
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}service-worker.js`, { scope: import.meta.env.BASE_URL })
      .then((worker) => {
        if (!mounted) return;
        current = worker;
        setRegistration(worker);
        onUpdate();
        worker.addEventListener("updatefound", () => {
          worker.installing?.addEventListener("statechange", onUpdate);
        });
        check();
        void navigator.storage?.persist?.().catch(() => undefined);
      })
      .catch(() => {
        if (mounted) {
          setProgress({
            type: "ICON_PROGRESS",
            state: "error",
            completed: 0,
            total: 0,
            message: "Offline setup is unavailable. Try reloading online.",
          });
        }
      });
    return () => {
      mounted = false;
      window.clearInterval(interval);
      navigator.serviceWorker.removeEventListener("message", onMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("online", check);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [supported]);

  const handleUpdate = () => {
    if (!registration?.waiting) return;
    applying.current = true;
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  };
  const handleLater = () => {
    dismissedUpdate.current = registration?.waiting ?? null;
    setUpdateAvailable(false);
  };
  const handleDismissInstall = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setInstallNotice(null);
    setInstructions(false);
  };
  const performInstall = async () => {
    if (hasInstalled() || prompting.current) return;
    const event = installPrompt.current;
    setInstallNotice((notice) => notice ?? "manual");
    if (!event) {
      setInstructions(true);
      return;
    }
    installPrompt.current = null;
    prompting.current = true;
    setInstallPending(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(ACCEPTED_KEY, "true");
        setInstalled(true);
        setInstallNotice(null);
        setInstructions(false);
      } else {
        setInstructions(true);
      }
    } catch {
      setInstructions(true);
    } finally {
      prompting.current = false;
      setInstallPending(false);
    }
  };
  const repairIcons = () => {
    if (!navigator.onLine || !registration?.active) {
      setProgress({
        type: "ICON_PROGRESS",
        state: "error",
        completed: progress?.completed ?? 0,
        total: progress?.total ?? 0,
        message: !navigator.onLine
          ? "Connect to the internet, then try again. Saved icons are unchanged."
          : "Offline setup is not ready yet. Try again shortly.",
      });
      return;
    }
    setProgress({ type: "ICON_PROGRESS", state: "downloading", completed: 0, total: 0 });
    registration.active.postMessage({ type: "SYNC_ICONS" });
  };
  const openInstall = () => {
    void performInstall();
  };
  const showPostImportHint = () => {
    if (hasInstalled()) return;
    setInstructions(false);
    setInstallNotice("import");
  };
  const showUpdate = updateAvailable && !instructions;

  return (
    <PwaContext.Provider
      value={{ progress, supported, installed, repairIcons, openInstall, showPostImportHint }}
    >
      <div ref={noticeRef} className="app-notice-stack">
        <UpdateNotice available={showUpdate} onUpdate={handleUpdate} onLater={handleLater} />
        <InstallBanner
          visible={!showUpdate && !installed && installNotice !== null}
          postImport={installNotice === "import"}
          instructions={instructions}
          pending={installPending}
          onInstall={openInstall}
          onClose={handleDismissInstall}
        />
      </div>
      {children}
    </PwaContext.Provider>
  );
};

export default PwaProvider;
