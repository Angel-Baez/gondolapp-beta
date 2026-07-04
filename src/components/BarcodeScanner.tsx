"use client";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { motion as m } from "framer-motion";
import { Camera, Keyboard, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
  /** Modo/label opcional mostrado en el header (ej. "Reposición"). */
  modeLabel?: string;
  /** Mientras es true, la cámara sigue corriendo pero los escaneos se
   * ignoran (un sheet está abierto) — evita el costo de reiniciar la
   * cámara al cerrar el sheet. */
  paused?: boolean;
  /** Contenido flotante inyectado sobre la vista de cámara (ej. QuickAdjustCard). */
  overlay?: React.ReactNode;
  /** Si se provee, muestra un link en la entrada manual para buscar por nombre en su lugar. */
  onSearchInstead?: () => void;
}

export default function BarcodeScanner({
  onScan,
  onClose,
  isOpen,
  modeLabel,
  paused = false,
  overlay,
  onSearchInstead,
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementRef = useRef<HTMLDivElement>(null);
  const scannerElementId = useRef(
    `barcode-scanner-reader-${Date.now()}`
  ).current;
  const isStoppingRef = useRef(false);
  const isStartingRef = useRef(false);
  // Ref (no state) para que onScanSuccess la lea sin entrar en las deps de
  // startScanning: togglear `paused` no debe reiniciar la cámara.
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  // Promesa del start() en curso: permite esperar a que termine antes de
  // detener, para no dejar la cámara abierta sin referencia (bug que
  // obligaba a recargar la página para poder volver a abrirla).
  const startingPromiseRef = useRef<Promise<void> | null>(null);
  // Ref (no state): html5-qrcode invoca el onScanSuccess con el que se
  // inició la cámara, así que un state quedaría congelado en su closure y
  // el dedupe nunca filtraría — cada frame decodificado (30 fps) dispararía
  // un onScan del mismo código.
  const lastScannedCodeRef = useRef<string | null>(null);
  const clearScannedCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tiempo para limpiar el código escaneado y permitir re-escanear el mismo código
  const SCAN_CODE_CLEAR_DELAY = 2000;

  const stopScanning = useCallback(async () => {
    // Evitar llamadas múltiples simultáneas
    if (isStoppingRef.current) {
      return;
    }

    // Si hay un start() en curso, esperar a que resuelva/falle antes de
    // intentar detener: si no, el resultado del start() deja la cámara
    // encendida sin que nada la referencie para poder pararla después.
    if (isStartingRef.current && startingPromiseRef.current) {
      try {
        await startingPromiseRef.current;
      } catch {
        // El error ya se maneja dentro de startScanning
      }
    }

    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }

    isStoppingRef.current = true;
    try {
      // Verificar el estado real del escáner antes de intentar detenerlo
      const scannerState = scanner.getState();

      // Solo intentar detener si el escáner está escaneando
      if (scannerState === 2) {
        // 2 = SCANNING state
        await scanner.stop();
      }
    } catch (err: any) {
      // Silenciar errores de transición
      if (
        !err.message?.includes("Cannot stop") &&
        !err.message?.includes("Cannot transition")
      ) {
        console.error("Error al detener escáner:", err);
      }
    }

    // Pase lo que pase con stop(), siempre liberar la referencia: de lo
    // contrario el guard de startScanning() queda bloqueado para siempre
    // y hay que recargar la página para volver a abrir la cámara.
    try {
      scanner.clear();
    } catch {
      // Ignorar: el elemento puede ya no estar en el DOM
    }
    scannerRef.current = null;
    setIsScanning(false);
    lastScannedCodeRef.current = null;
    isStoppingRef.current = false;
  }, []);

  const startScanning = useCallback(async () => {
    // Evitar llamadas múltiples simultáneas
    if (isStartingRef.current) {
      return;
    }

    if (isScanning || scannerRef.current || isClosing || showManualInput) {
      return;
    }

    // Verificar que el elemento existe ANTES de hacer cualquier cosa
    if (!readerElementRef.current) {
      return;
    }

    isStartingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      // Crear el escáner directamente sin solicitar permisos previos
      // (html5-qrcode maneja los permisos automáticamente)
      const scanner = new Html5Qrcode(scannerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      // Configuración optimizada para detección rápida
      const config = {
        fps: 30, // Aumentado de 10 a 30 para detección más rápida
        qrbox: { width: 280, height: 180 }, // Área de escaneo más grande
        aspectRatio: 1.77,
        disableFlip: false,
      };

      const onScanSuccess = (decodedText: string) => {
        if (pausedRef.current) return;
        if (decodedText !== lastScannedCodeRef.current && !isClosing) {
          lastScannedCodeRef.current = decodedText;
          onScan(decodedText);

          if ("vibrate" in navigator) {
            navigator.vibrate(100);
          }

          // Limpiar el código escaneado después de un tiempo para permitir re-escaneo
          if (clearScannedCodeTimerRef.current) {
            clearTimeout(clearScannedCodeTimerRef.current);
          }
          clearScannedCodeTimerRef.current = setTimeout(() => {
            lastScannedCodeRef.current = null;
          }, SCAN_CODE_CLEAR_DELAY);
        }
      };

      const onScanError = () => {
        // Ignorar errores menores
      };

      // Obtener cámaras y iniciar en paralelo para mayor velocidad
      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        throw new Error("No se encontraron cámaras disponibles");
      }

      // Buscar cámara trasera preferentemente (sin logs verbosos)
      let selectedCamera = devices[0];
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("trasera") ||
          device.label.toLowerCase().includes("environment")
      );

      if (backCamera) {
        selectedCamera = backCamera;
      }

      // Iniciar escáner inmediatamente
      await scanner.start(
        selectedCamera.id,
        config,
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error("❌ Error al iniciar escáner:", err);

      let errorMessage = "Error al acceder a la cámara";

      if (err.name === "NotAllowedError") {
        errorMessage =
          "Permiso de cámara denegado. Haz clic en el icono de cámara en la barra de direcciones y permite el acceso.";
      } else if (err.name === "NotFoundError") {
        errorMessage =
          "No se encontró ninguna cámara. Verifica que tu dispositivo tenga una cámara conectada.";
      } else if (err.name === "NotReadableError") {
        errorMessage =
          "La cámara está siendo usada por otra aplicación. Cierra otras apps que puedan estar usando la cámara.";
      } else if (
        err.message?.includes("Camera streaming not supported") ||
        err.message?.includes("getUserMedia")
      ) {
        errorMessage =
          "El navegador no puede acceder a la cámara. Asegúrate de estar usando HTTPS o localhost.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsLoading(false);
      setIsScanning(false);
      setShowManualInput(true);

      // Liberar la referencia del escáner fallido: si no, el guard de
      // arriba (`scannerRef.current`) bloquea cualquier reintento hasta
      // que se recargue la página.
      try {
        scannerRef.current?.clear();
      } catch {
        // Ignorar
      }
      scannerRef.current = null;
    } finally {
      isStartingRef.current = false;
    }
  }, [
    isScanning,
    isClosing,
    showManualInput,
    scannerElementId,
    stopScanning,
    onScan,
    onClose,
  ]);

  useEffect(() => {
    if (!isOpen || showManualInput) {
      return;
    }

    // Reducir delay de 100ms a 50ms para inicio más rápido
    const timer = setTimeout(() => {
      startingPromiseRef.current = startScanning();
    }, 50);

    return () => {
      clearTimeout(timer);
      // Solo detener si realmente hay un escáner activo
      if (scannerRef.current && !isStoppingRef.current) {
        stopScanning();
      }
    };
  }, [isOpen, showManualInput]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode(""); // Limpiar el campo para el próximo escaneo
      // NO llamar onClose() - el padre controla el flujo
    }
  };

  const handleToggleInputMode = async () => {
    // Si está escaneando, detener primero
    if (scannerRef.current && isScanning) {
      await stopScanning();
    }
    setShowManualInput(!showManualInput);
  };

  const handleClose = async () => {
    if (isClosing || isStoppingRef.current) {
      return;
    }

    setIsClosing(true);

    // Reutiliza stopScanning: espera cualquier start() en curso y SIEMPRE
    // libera scannerRef.current pase lo que pase, incluso si stop() falla.
    // Antes, un error en stop() dejaba la referencia "colgada" y bloqueaba
    // reabrir la cámara hasta recargar la página.
    await stopScanning();

    setIsScanning(false);
    lastScannedCodeRef.current = null;
    setError(null);
    setIsLoading(false);

    onClose();

    // CRÍTICO: Resetear el flag después de que onClose se ejecute
    setTimeout(() => {
      setIsClosing(false);
    }, 100);
  };

  // Resetear estados cuando el componente se cierra completamente
  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      setIsScanning(false);
      setIsLoading(false);
      setError(null);
      lastScannedCodeRef.current = null;
      setShowManualInput(false);
      setManualCode("");
      isStoppingRef.current = false;
      isStartingRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header glass */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-white glass rounded-full pl-3 pr-4 h-11">
          {showManualInput ? <Keyboard size={18} /> : <Camera size={18} />}
          <h2 className="font-semibold text-sm">
            {showManualInput
              ? "Entrada manual"
              : modeLabel
              ? `Escaneando · ${modeLabel}`
              : "Escanear código"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleInputMode}
            className="w-11 h-11 rounded-full glass flex items-center justify-center text-white"
            aria-label={showManualInput ? "Usar cámara" : "Entrada manual"}
          >
            {showManualInput ? <Camera size={18} /> : <Keyboard size={18} />}
          </button>
          <button
            onClick={handleClose}
            className="w-11 h-11 rounded-full glass flex items-center justify-center text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scanner/Manual Input Container */}
      <div className="flex items-center justify-center h-full p-4 pt-20">
        {showManualInput ? (
          <div className="w-full max-w-md">
            <div className="glass rounded-sheet p-6">
              <h3 className="text-title2 text-white mb-1">Ingresar código manualmente</h3>
              <p className="text-subhead text-white/70 mb-4">
                Escribí el código de barras del producto
              </p>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ej: 7501234567890"
                  className="w-full h-14 px-4 rounded-field bg-white/10 text-white placeholder:text-white/40 outline-none text-lg text-center font-mono focus:ring-2 focus:ring-accent/60"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full mt-4 h-14 bg-accent disabled:bg-white/10 disabled:text-white/40 text-on-accent font-semibold rounded-field transition-colors"
                >
                  Buscar producto
                </button>
              </form>
              {onSearchInstead && (
                <button
                  onClick={onSearchInstead}
                  className="w-full mt-3 h-11 text-white/70 text-subhead font-medium"
                >
                  Buscar por nombre en vez de código
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            {/* Contenedor del escáner: tamaño/estilo estables a propósito
                para no forzar un reflow del <video> (evita reinicios de cámara) */}
            <div
              ref={readerElementRef}
              id={scannerElementId}
              className="mx-auto rounded-card overflow-hidden bg-black"
              style={{
                width: "100%",
                minHeight: "400px",
              }}
            />

            {/* Marco del viewfinder + línea de escaneo */}
            {isScanning && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative w-[280px] h-[180px] rounded-card border-2 border-white/70 overflow-hidden">
                  <m.div
                    className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_8px_2px_rgba(6,182,212,0.8)]"
                    animate={{ top: ["6%", "94%", "6%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map(
                    (corner) => (
                      <span
                        key={corner}
                        className={`absolute w-5 h-5 border-white ${
                          corner === "top-left"
                            ? "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg"
                            : corner === "top-right"
                            ? "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg"
                            : corner === "bottom-left"
                            ? "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg"
                            : "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg"
                        }`}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 rounded-card z-20">
                <Loader2 className="h-12 w-12 text-accent animate-spin mb-3" />
                <p className="text-white text-base font-medium">
                  Cargando cámara...
                </p>
              </div>
            )}

            {/* Instrucción mínima cuando está escaneando (sin overlay del padre) */}
            {isScanning && !isLoading && !overlay && (
              <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
                <div className="glass rounded-full px-4 py-2">
                  <p className="text-white text-caption font-medium">
                    Centrá el código en el recuadro
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay flotante inyectado por el padre (ej. QuickAdjustCard).
          Fuera de la rama de cámara: también debe verse tras agregar un
          producto por entrada manual. */}
      {overlay}

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4 p-4 bg-alert-critico/90 backdrop-blur-sm text-white rounded-xl shadow-lg z-10">
          <p className="text-sm font-semibold mb-2">⚠️ {error}</p>
          {error.includes("HTTPS") && (
            <p className="text-xs opacity-90 mt-2">
              💡 Para usar la cámara en móvil, la app debe estar en HTTPS.
            </p>
          )}
          {error.includes("denegado") && (
            <div className="mt-3 space-y-2">
              <p className="text-xs opacity-90">
                💡 Para habilitar el permiso de cámara:
              </p>
              <ul className="text-xs opacity-80 list-disc list-inside space-y-1">
                <li>Toca el icono de candado/info en la barra de direcciones</li>
                <li>Busca "Cámara" o "Permisos del sitio"</li>
                <li>Cambia el permiso a "Permitir"</li>
                <li>Recarga la página</li>
              </ul>
              <button
                onClick={() => {
                  // Try to open site settings (works on some browsers)
                  if ("permissions" in navigator) {
                    navigator.permissions
                      .query({ name: "camera" as PermissionName })
                      .then((result) => {
                        if (result.state === "denied") {
                          toast.error(
                            "Debes cambiar el permiso en la configuración del navegador",
                            { duration: 4000 }
                          );
                        } else {
                          startScanning();
                        }
                      })
                      .catch((err) => {
                        console.warn(
                          "[BarcodeScanner] Permission query failed:",
                          err
                        );
                        toast(
                          "No se puede verificar permisos. Intentando acceder a la cámara...",
                          { duration: 2000 }
                        );
                        startScanning();
                      });
                  } else {
                    startScanning();
                  }
                }}
                className="mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium w-full transition"
              >
                Verificar Permisos
              </button>
            </div>
          )}
          {error.includes("usada por otra") && (
            <p className="text-xs opacity-90 mt-2">
              💡 Cierra otras aplicaciones que puedan estar usando la cámara
              (WhatsApp, Instagram, etc.) y vuelve a intentar.
            </p>
          )}
          {error.includes("No se encontró") && (
            <p className="text-xs opacity-90 mt-2">
              💡 Asegúrate de que tu dispositivo tenga una cámara conectada y
              funcionando correctamente.
            </p>
          )}
          <button
            onClick={startScanning}
            className="mt-3 px-4 py-2 bg-white text-alert-critico rounded-lg text-sm font-bold w-full hover:bg-gray-100 transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Consejos de uso */}
      {!isScanning && !isLoading && !error && !showManualInput && (
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="glass rounded-card p-4 max-w-md mx-auto">
            <p className="text-white text-subhead font-medium mb-2">
              Consejos para mejor escaneo
            </p>
            <ul className="text-white/70 text-footnote space-y-1 list-disc list-inside">
              <li>Asegúrate de tener buena iluminación</li>
              <li>Mantén el código centrado en el recuadro</li>
              <li>Evita reflejos o brillos en el código</li>
              <li>Mantén el dispositivo estable</li>
            </ul>
          </div>
        </div>
      )}

      {/* Estilos para el scanner de html5-qrcode */}
      <style jsx global>{`
        #${scannerElementId} {
          width: 100% !important;
        }
        #${scannerElementId} video {
          width: 100% !important;
          border-radius: var(--radius-card);
        }
        #${scannerElementId}__scan_region {
          border-radius: var(--radius-card) !important;
        }
        #${scannerElementId}__dashboard_section_csr {
          display: none !important;
        }
        #${scannerElementId}__dashboard_section {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
