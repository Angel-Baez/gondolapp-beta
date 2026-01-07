"use client";

import { usePWA } from "@/hooks/usePWA";
import { useState } from "react";

export default function InstallBanner() {
  const {
    isIOS,
    isSamsungInternet,
    browserName,
    isInstallable,
    promptInstall,
    showIOSInstall,
    showManualInstall,
  } = usePWA();
  const [isVisible, setIsVisible] = useState(true);

  const handleInstallClick = () => {
    if (isInstallable) {
      promptInstall();
    } else if (isIOS) {
      alert(
        "Para instalar en iOS:\n\n1. Toca el botón 'Compartir' (cuadrado con flecha hacia arriba)\n2. Desplázate y selecciona 'Añadir a pantalla de inicio'\n3. Toca 'Añadir' en la parte superior derecha"
      );
    } else if (isSamsungInternet) {
      alert(
        "Para instalar en Samsung Internet:\n\n1. Toca el menú (tres líneas) en la parte inferior\n2. Selecciona 'Añadir página a'\n3. Elige 'Pantalla de inicio'\n4. Toca 'Añadir'"
      );
    } else if (browserName === "Firefox") {
      alert(
        "Para instalar en Firefox:\n\n1. Toca el menú (tres puntos)\n2. Selecciona 'Instalar'\n3. Confirma en el diálogo que aparece"
      );
    } else if (browserName === "Edge") {
      alert(
        "Para instalar en Edge:\n\n1. Toca el menú (tres puntos)\n2. Selecciona 'Aplicaciones'\n3. Toca 'Instalar esta aplicación'\n4. Confirma la instalación"
      );
    } else {
      alert(
        "Para instalar esta aplicación:\n\n1. Abre el menú del navegador\n2. Busca la opción 'Añadir a pantalla de inicio' o 'Instalar app'\n3. Confirma la instalación"
      );
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Guardar en localStorage que el usuario cerró el banner
    localStorage.setItem("pwa-banner-dismissed", "true");
  };

  // No mostrar si fue cerrado previamente
  if (!isVisible) return null;

  // No mostrar si no es installable, no es iOS y no requiere instalación manual
  if (!isInstallable && !showIOSInstall && !showManualInstall) return null;

  // Determinar el texto del título según el navegador/dispositivo
  const getTitle = () => {
    if (isSamsungInternet) return "Instalar en Samsung Internet";
    if (isIOS) return "Instalar en iOS";
    if (browserName === "Firefox") return "Instalar en Firefox";
    if (browserName === "Edge") return "Instalar en Edge";
    return "Instalar GondolApp";
  };

  // Determinar el texto de ayuda
  const getHelpText = () => {
    if (isSamsungInternet) {
      return "Toca el menú (☰) → 'Añadir página a' → 'Pantalla de inicio'";
    }
    if (isIOS && !isInstallable) {
      return "Toca 'Compartir' (⎋) → 'Añadir a pantalla de inicio'";
    }
    if (browserName === "Firefox") {
      return "Toca el menú (⋮) → 'Instalar'";
    }
    if (browserName === "Edge") {
      return "Toca el menú (⋯) → 'Aplicaciones' → 'Instalar'";
    }
    if (showManualInstall) {
      return `Toca el menú de ${browserName} → 'Añadir a pantalla de inicio'`;
    }
    return "Instala la app para acceso rápido y sin pestañas";
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[92%] max-w-xl">
      <div className="bg-white dark:bg-slate-800 border shadow-lg rounded-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="font-medium text-sm">{getTitle()}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            {getHelpText()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md text-sm"
            >
              Instalar
            </button>
          ) : (
            <button
              onClick={handleInstallClick}
              className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-2 rounded-md text-sm"
            >
              Cómo instalar
            </button>
          )}

          <button
            onClick={handleClose}
            aria-label="Cerrar"
            className="text-slate-500 hover:text-slate-700 p-2 rounded"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
