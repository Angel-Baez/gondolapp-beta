"use client";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Keyboard, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { GlassCard } from "./ui/GlassCard";
import { GlassPill } from "./ui/GlassPill";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function BarcodeScanner({
  onScan,
  onClose,
  isOpen,
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementRef = useRef<HTMLDivElement>(null);
  const scannerElementId = useRef(
    `barcode-scanner-reader-${Date.now()}`
  ).current;
  const isStoppingRef = useRef(false);
  const isStartingRef = useRef(false);

  // Tiempo para limpiar el código escaneado y permitir re-escanear el mismo código
  const SCAN_CODE_CLEAR_DELAY = 2000;

  const stopScanning = useCallback(async () => {
    // Evitar llamadas múltiples simultáneas
    if (isStoppingRef.current) {
      return;
    }

    try {
      const scanner = scannerRef.current;

      // Verificar que existe un escáner y que está en un estado válido
      if (!scanner) {
        return;
      }

      // Verificar el estado real del escáner antes de intentar detenerlo
      const scannerState = scanner.getState();

      // Solo intentar detener si el escáner está escaneando
      if (scannerState === 2) {
        // 2 = SCANNING state
        isStoppingRef.current = true;
        await scanner.stop();
        scanner.clear();
      } else {
        scanner.clear();
      }

      scannerRef.current = null;
      setIsScanning(false);
      setLastScannedCode(null);
    } catch (err: any) {
      // Silenciar errores de transición
      if (
        !err.message?.includes("Cannot stop") &&
        !err.message?.includes("Cannot transition")
      ) {
        console.error("Error al detener escáner:", err);
      }
    } finally {
      isStoppingRef.current = false;
    }
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
        if (decodedText !== lastScannedCode && !isClosing) {
          setLastScannedCode(decodedText);
          onScan(decodedText);

          if ("vibrate" in navigator) {
            navigator.vibrate(100);
          }

          // Limpiar el código escaneado después de un tiempo para permitir re-escaneo
          setTimeout(() => {
            setLastScannedCode(null);
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
    } finally {
      isStartingRef.current = false;
    }
  }, [
    isScanning,
    isClosing,
    showManualInput,
    scannerElementId,
    lastScannedCode,
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
      startScanning();
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

    if (scannerRef.current) {
      try {
        const scannerState = scannerRef.current.getState();

        // Solo intentar detener si está escaneando (state === 2)
        if (scannerState === 2) {
          isStoppingRef.current = true;
          await scannerRef.current.stop();
        }

        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err: any) {
        // Ignorar errores de transición al cerrar
        if (
          !err.message?.includes("Cannot stop") &&
          !err.message?.includes("Cannot transition")
        ) {
          console.error("Error al cerrar escáner:", err);
        }
      } finally {
        isStoppingRef.current = false;
      }
    }

    setIsScanning(false);
    setLastScannedCode(null);
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
      setLastScannedCode(null);
      setShowManualInput(false);
      setManualCode("");
      isStoppingRef.current = false;
      isStartingRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-deep-navy/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-deep-navy/90 to-transparent">
        <div className="flex items-center gap-2 text-white">
          {showManualInput ? <Keyboard size={24} /> : <Camera size={24} />}
          <h2 className="font-bold text-lg">
            {showManualInput ? "Entrada Manual" : "Escanear Código"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleInputMode}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10 text-white"
            aria-label={showManualInput ? "Usar cámara" : "Entrada manual"}
          >
            {showManualInput ? <Camera size={20} /> : <Keyboard size={20} />}
          </button>
          <button
            onClick={handleClose}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10 text-white"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scanner/Manual Input Container */}
      <div className="flex items-center justify-center h-full p-4 pt-20">
        {showManualInput ? (
          <div className="w-full max-w-md">
            <GlassCard variant="strong" className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Ingresar Código Manualmente
              </h3>
              <p className="text-sm text-white/70 mb-4">
                Ingresa el código de barras del producto:
              </p>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ej: 7501234567890"
                  className="w-full p-4 border-2 border-white/20 bg-white/10 text-white rounded-xl focus:border-neon-cyan outline-none text-lg text-center font-mono transition-colors backdrop-blur-md placeholder:text-white/40"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full mt-4 px-8 py-4 rounded-full border-2 backdrop-blur-xl font-bold text-lg transition-all duration-200 bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  Buscar Producto
                </button>
              </form>
              <p className="text-xs text-white/50 mt-4 text-center">
                💡 Tip: Puedes encontrar el código en el paquete del producto
              </p>
            </GlassCard>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl">
            <GlassCard variant="strong" className="w-full" glow>
              {/* Efecto de lente */}
              <div 
                className="absolute inset-0 rounded-3xl border-4 border-neon-cyan/30 pointer-events-none z-10" 
                style={{
                  boxShadow: 'inset 0 0 60px rgba(0, 240, 255, 0.2), 0 0 60px rgba(0, 240, 255, 0.2)'
                }} 
              />
              
              {/* Contenedor del escáner */}
              <div
                ref={readerElementRef}
                id={scannerElementId}
                className="w-full rounded-3xl overflow-hidden"
                style={{
                  minHeight: "400px",
                }}
              />

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-deep-navy/90 rounded-3xl z-20 backdrop-blur-xl">
                  <Loader2 className="h-12 w-12 text-neon-cyan animate-spin mb-3" />
                  <p className="text-white text-base font-medium">
                    Cargando cámara...
                  </p>
                </div>
              )}

            {/* Último código escaneado */}
            {lastScannedCode && isScanning && (
              <div className="absolute top-4 left-4 right-4 z-20">
                <GlassCard variant="medium" className="p-3 border-2 border-neon-cyan/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs">Último código:</p>
                      <p className="font-mono font-bold text-neon-cyan mt-1 text-sm break-all">
                        {lastScannedCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-neon-cyan rounded-full animate-pulse" />
                      <span className="text-xs text-neon-cyan font-medium">✓</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Instrucciones cuando está escaneando */}
            {isScanning && !isLoading && (
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <GlassCard variant="light" className="p-3 border border-neon-cyan/20">
                  <p className="text-white text-center text-sm font-medium">
                    📸 Mantén el código dentro del recuadro
                  </p>
                  <p className="text-white/70 text-center text-xs mt-1">
                    El escaneo es automático
                  </p>
                </GlassCard>
              </div>
            )}
            </GlassCard>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-20 left-4 right-4 z-30">
          <GlassCard variant="strong" className="p-4 border-2 border-red-500/30">
            <p className="text-sm font-semibold mb-2 text-white">⚠️ {error}</p>
            {error.includes("HTTPS") && (
              <p className="text-xs opacity-90 mt-2 text-white/80">
                💡 Para usar la cámara en móvil, la app debe estar en HTTPS.
              </p>
            )}
            {error.includes("denegado") && (
              <div className="mt-3 space-y-2">
                <p className="text-xs opacity-90 text-white/80">
                  💡 Para habilitar el permiso de cámara:
                </p>
                <ul className="text-xs opacity-80 list-disc list-inside space-y-1 text-white/70">
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
                  className="mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium w-full transition backdrop-blur-md"
                >
                  Verificar Permisos
                </button>
              </div>
            )}
            {error.includes("usada por otra") && (
              <p className="text-xs opacity-90 mt-2 text-white/80">
                💡 Cierra otras aplicaciones que puedan estar usando la cámara
                (WhatsApp, Instagram, etc.) y vuelve a intentar.
              </p>
            )}
            {error.includes("No se encontró") && (
              <p className="text-xs opacity-90 mt-2 text-white/80">
                💡 Asegúrate de que tu dispositivo tenga una cámara conectada y
                funcionando correctamente.
              </p>
            )}
            <GlassPill
              onClick={startScanning}
              variant="cyan"
              className="mt-3 w-full"
            >
              Reintentar
            </GlassPill>
          </GlassCard>
        </div>
      )}

      {/* Consejos de uso */}
      {!isScanning && !isLoading && !error && !showManualInput && (
        <div className="absolute bottom-8 left-4 right-4">
          <GlassCard variant="light" className="p-4 max-w-md mx-auto">
            <p className="text-white text-sm font-medium mb-2">
              💡 Consejos para mejor escaneo:
            </p>
            <ul className="text-white/80 text-xs space-y-1 list-disc list-inside">
              <li>Asegúrate de tener buena iluminación</li>
              <li>Mantén el código centrado en el recuadro</li>
              <li>Evita reflejos o brillos en el código</li>
              <li>Mantén el dispositivo estable</li>
            </ul>
          </GlassCard>
        </div>
      )}

      {/* Estilos para el scanner de html5-qrcode */}
      <style jsx global>{`
        #${scannerElementId} {
          width: 100% !important;
        }
        #${scannerElementId} video {
          width: 100% !important;
          border-radius: 1.5rem;
        }
        #${scannerElementId}__scan_region {
          border-radius: 1.5rem !important;
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
