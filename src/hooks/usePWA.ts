"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type UsePWAResult = {
  isIOS: boolean;
  isAndroid: boolean;
  isSamsungInternet: boolean;
  browserName: string;
  isInstallable: boolean;
  showIOSInstall: boolean;
  showManualInstall: boolean;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
};

export function usePWA(): UsePWAResult {
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSamsungInternet, setIsSamsungInternet] = useState(false);
  const [browserName, setBrowserName] = useState("");

  const deferredPrompt = useRef<any>(null);

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

  useEffect(() => {
    // Device / browser detection
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const iOS =
      /iphone|ipad|ipod/i.test(ua) || (navigator as any).standalone === true;
    const android = /android/i.test(ua);
    const samsungInternet = /samsungbrowser/i.test(ua);
    const browser = detectBrowser(ua);

    setIsIOS(iOS);
    setIsAndroid(android);
    setIsSamsungInternet(samsungInternet);
    setBrowserName(browser);

    // Service worker registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado con éxito:", registration);

          // Detect updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  toast(
                    "Nueva versión disponible 🚀 Actualiza la página para obtener la última versión.",
                    {
                      duration: Infinity,
                      position: "bottom-center",
                      style: {
                        background: "#fff",
                        color: "#333",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                    }
                  );
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Error al registrar Service Worker:", error);
        });
    }

    // beforeinstallprompt (Chrome / Android)
    const onBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPrompt.current = e;
      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      if (!dismissed) setIsInstallable(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as any
    );

    // appinstalled event
    const onAppInstalled = () => {
      console.log("PWA instalada en la pantalla de inicio");
      localStorage.setItem(DISMISS_KEY, "1");
      setIsInstallable(false);
      setShowIOSInstall(false);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    // iOS detection: show manual install instructions if not in standalone
    const isInStandalone = () => (window.navigator as any).standalone === true;
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
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as any
      );
      window.removeEventListener("appinstalled", onAppInstalled);
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
    promptInstall,
    dismiss,
  };
}
