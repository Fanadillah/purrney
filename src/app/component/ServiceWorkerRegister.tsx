"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type UpdateStatus = "idle" | "checking" | "current" | "ready" | "unsupported";

type PwaControls = {
  canInstall: boolean;
  isInstalled: boolean;
  isUpdateReady: boolean;
  updateStatus: UpdateStatus;
  installApp: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
  updateApp: () => void;
};

const PwaContext = createContext<PwaControls | null>(null);

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean(window.navigator.standalone))
  );
}

export function usePwaControls() {
  const context = useContext(PwaContext);

  if (!context) {
    throw new Error("usePwaControls must be used within ServiceWorkerRegister.");
  }

  return context;
}

export default function ServiceWorkerRegister({ children }: { children: React.ReactNode }) {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window === "undefined" ? false : isStandaloneDisplay()
  );
  const [updateReady, setUpdateReady] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const hadController = Boolean(navigator.serviceWorker.controller);
        registrationRef.current = registration;

        await registration.update();

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          if (!newWorker) {
            return;
          }

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && hadController) {
              setUpdateReady(true);
            }
          });
        });

        const onControllerChange = () => {
          if (hadController) {
            setUpdateReady(true);
          }
        };

        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        const updateWhenVisible = () => {
          if (document.visibilityState === "visible") {
            void registration.update();
          }
        };

        document.addEventListener("visibilitychange", updateWhenVisible);
        window.addEventListener("focus", updateWhenVisible);

        return () => {
          document.removeEventListener("visibilitychange", updateWhenVisible);
          window.removeEventListener("focus", updateWhenVisible);
          navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    let cleanup: (() => void) | undefined;
    void registerServiceWorker().then((nextCleanup) => {
      cleanup = nextCleanup;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome !== "dismissed") {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const checkForUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      setUpdateStatus("unsupported");
      return;
    }

    try {
      setUpdateStatus("checking");
      const registration =
        registrationRef.current ?? (await navigator.serviceWorker.getRegistration("/sw.js"));

      if (!registration) {
        setUpdateStatus("unsupported");
        return;
      }

      registrationRef.current = registration;
      await registration.update();
      setUpdateStatus(updateReady ? "ready" : "current");
    } catch (error) {
      console.error("Service worker update check failed:", error);
      setUpdateStatus("idle");
    }
  }, [updateReady]);

  const updateApp = useCallback(() => {
    window.location.reload();
  }, []);

  const value = useMemo<PwaControls>(
    () => ({
      canInstall: Boolean(installPrompt) && !isInstalled,
      isInstalled,
      isUpdateReady: updateReady,
      updateStatus: updateReady ? "ready" : updateStatus,
      installApp,
      checkForUpdate,
      updateApp,
    }),
    [checkForUpdate, installApp, installPrompt, isInstalled, updateApp, updateReady, updateStatus]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
