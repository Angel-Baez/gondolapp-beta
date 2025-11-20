"use client";

import { useEffect } from "react";

export function usePWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registrado con éxito:", registration);

          // Verificar actualizaciones
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Nueva versión disponible
                  if (confirm("Nueva versión disponible. ¿Actualizar ahora?")) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Error al registrar Service Worker:", error);
        });
    }

    // Detectar cuando se añade a la pantalla de inicio
    window.addEventListener("appinstalled", () => {
      console.log("PWA instalada en la pantalla de inicio");
    });

    // Detectar cuando se muestra el prompt de instalación
    let deferredPrompt: any;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log("PWA instalable");

      // Puedes mostrar tu propio botón de instalación aquí
    });
  }, []);
}
