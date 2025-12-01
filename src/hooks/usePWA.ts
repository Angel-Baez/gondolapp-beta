"use client";

import { CircleCheck, Rocket, Wifi, WifiOff } from "lucide-react";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type UsePWAResult = {
  isIOS: boolean;
  isAndroid: boolean;
  isSamsungInternet: boolean;
  browserName: string;
  isInstallable: boolean;
  showIOSInstall: boolean;
  showManualInstall: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
  applyUpdate: () => void;
};

export function usePWA(): UsePWAResult {
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSamsungInternet, setIsSamsungInternet] = useState(false);
  const [browserName, setBrowserName] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);

  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const waitingWorker = useRef<ServiceWorker | null>(null);
  const updateCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Persist dismissal to avoid nagging the user
  const DISMISS_KEY = "gondolapp_pwa_install_dismissed";

  // Función para detectar el navegador
  const detectBrowser = (ua: string) => {
    if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
    if (/edg/i.test(ua)) return "Edge";
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
    if (/firefox/i.test(ua)) return "Firefox";
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
    if (/opera|opr/i.test(ua)) return "Opera";
    return "Unknown";
  };

  // Apply update - send SKIP_WAITING to service worker
  const applyUpdate = useCallback(() => {
    if (waitingWorker.current) {
      waitingWorker.current.postMessage({ type: "SKIP_WAITING" });
      setHasUpdate(false);
      // Reload will be handled by controllerchange event listener
    }
  }, []);

  // Show update toast with interactive action button
  const showUpdateToast = useCallback(() => {
    toast(
      (t) =>
        createElement(
          "div",
          { className: "flex items-center gap-3" },
          createElement(Rocket, { size: 20 }),
          createElement("span", null, "Nueva versión disponible"),
          createElement(
            "button",
            {
              onClick: () => {
                if (waitingWorker.current) {
                  waitingWorker.current.postMessage({ type: "SKIP_WAITING" });
                  setHasUpdate(false);
                }
                toast.dismiss(t.id);
              },
              className:
                "px-3 py-1 bg-white text-cyan-600 rounded font-semibold text-sm hover:bg-gray-100 transition",
            },
            "Actualizar ahora"
          )
        ),
      {
        duration: Infinity,
        position: "bottom-center",
        style: {
          background: "#06B6D4",
          color: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          padding: "12px 16px",
        },
      }
    );
  }, []);

  useEffect(() => {
    // Device / browser detection
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const navStandalone =
      typeof navigator !== "undefined"
        ? (navigator as Navigator & { standalone?: boolean }).standalone
        : undefined;
    const iOS = /iphone|ipad|ipod/i.test(ua) || navStandalone === true;
    const android = /android/i.test(ua);
    const samsungInternet = /samsungbrowser/i.test(ua);
    const browser = detectBrowser(ua);

    setIsIOS(iOS);
    setIsAndroid(android);
    setIsSamsungInternet(samsungInternet);
    setBrowserName(browser);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    // Online/Offline detection
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexión restaurada", {
        duration: 2000,
        icon: createElement(Wifi, { size: 20, className: "text-green-500" }),
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast("Sin conexión - Modo offline activo", {
        duration: 3000,
        icon: createElement(WifiOff, { size: 20, className: "text-amber-600" }),
        style: {
          background: "#FEF3C7",
          color: "#92400E",
        },
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Service worker registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado con éxito:", registration);

          // Check for updates periodically - store in ref for cleanup
          updateCheckIntervalRef.current = setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour

          // Detect updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available
                  waitingWorker.current = newWorker;
                  setHasUpdate(true);
                  showUpdateToast();
                }
              });
            }
          });

          // If there's already a waiting worker
          if (registration.waiting) {
            waitingWorker.current = registration.waiting;
            setHasUpdate(true);
            showUpdateToast();
          }
        })
        .catch((error) => {
          console.error("Error al registrar Service Worker:", error);
        });

      // Listen for controller change (when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // beforeinstallprompt (Chrome / Android)
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      if (!dismissed) setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // appinstalled event
    const onAppInstalled = () => {
      console.log("PWA instalada en la pantalla de inicio");
      localStorage.setItem(DISMISS_KEY, "1");
      setIsInstallable(false);
      setShowIOSInstall(false);
      toast.success("¡App instalada correctamente!", {
        duration: 3000,
        icon: createElement(CircleCheck, {
          size: 20,
          className: "text-green-500",
        }),
      });
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // iOS detection: show manual install instructions if not in standalone
    const isInStandalone = () =>
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    if (iOS && !isInStandalone() && !dismissed) {
      // show iOS install instructions
      setShowIOSInstall(true);
    }

    // Samsung Internet y otros navegadores que no soportan beforeinstallprompt
    // Mostrar instrucciones manuales después de un tiempo
    if (!dismissed && (samsungInternet || (android && browser !== "Chrome"))) {
      setTimeout(() => {
        setShowManualInstall(true);
      }, 3000); // Mostrar después de 3 segundos
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      // Clean up update check interval
      if (updateCheckIntervalRef.current) {
        clearInterval(updateCheckIntervalRef.current);
        updateCheckIntervalRef.current = null;
      }
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt.current) {
      try {
        await deferredPrompt.current.prompt();
        const choiceResult = await deferredPrompt.current.userChoice;
        if (choiceResult && choiceResult.outcome === "accepted") {
          console.log("User accepted the A2HS prompt");
          localStorage.setItem(DISMISS_KEY, "1");
          setIsInstallable(false);
          deferredPrompt.current = null;
        } else {
          console.log("User dismissed the A2HS prompt");
        }
      } catch (err) {
        console.warn("Prompt failed:", err);
      }
    } else {
      // no prompt available (likely iOS). Keep showIOSInstall true so banner shows instructions
      setShowIOSInstall(true);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setIsInstallable(false);
    setShowIOSInstall(false);
    setShowManualInstall(false);
  };

  return {
    isIOS,
    isAndroid,
    isSamsungInternet,
    browserName,
    isInstallable,
    showIOSInstall,
    showManualInstall,
    isOnline,
    hasUpdate,
    promptInstall,
    dismiss,
    applyUpdate,
  };
}

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
