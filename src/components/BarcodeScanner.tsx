"use client";

import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, X, Keyboard, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

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

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
        setLastScannedCode(null);
        console.log("🛑 Escáner detenido");
      }
    } catch (err) {
      console.error("Error al detener escáner:", err);
    }
  }, [isScanning]);

  const startScanning = useCallback(async () => {
    if (isScanning || scannerRef.current || isClosing) return;

    try {
      setIsLoading(true);
      setError(null);

      // Verificar que el elemento existe
      if (!readerElementRef.current) {
        throw new Error("El contenedor del escáner no está disponible");
      }

      // PASO 1: Solicitar permisos de cámara PRIMERO
      console.log("📷 Solicitando permisos de cámara...");
      let stream: MediaStream | null = null;

      try {
        // Intentar con cámara trasera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        console.log("✅ Permisos concedidos (cámara trasera)");
      } catch (err) {
        console.warn("⚠️ Intentando con cualquier cámara...");
        // Si falla, usar cualquier cámara
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log("✅ Permisos concedidos (cámara frontal/default)");
      }

      // Detener stream temporal (solo necesitábamos permisos)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // PASO 2: Crear el escáner con todos los formatos
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

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.77,
        disableFlip: false,
      };

      const onScanSuccess = (decodedText: string) => {
        if (decodedText !== lastScannedCode && !isClosing) {
          console.log(`✅ Código escaneado: ${decodedText}`);
          setLastScannedCode(decodedText);
          onScan(decodedText);

          if ("vibrate" in navigator) {
            navigator.vibrate(100);
          }

          setTimeout(() => {
            stopScanning();
            onClose();
          }, 500);
        }
      };

      const onScanError = () => {
        // Ignorar errores menores
      };

      // PASO 3: Obtener cámaras disponibles
      console.log("🎥 Obteniendo lista de cámaras...");
      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        throw new Error("No se encontraron cámaras disponibles");
      }

      console.log(`📹 Cámaras encontradas (${devices.length}):`, devices);

      // Buscar cámara trasera preferentemente
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
        console.log("✅ Usando cámara trasera:", selectedCamera.label);
      } else {
        console.log("✅ Usando primera cámara:", selectedCamera.label);
      }

      // PASO 4: Iniciar escáner
      await scanner.start(
        selectedCamera.id,
        config,
        onScanSuccess,
        onScanError
      );

      setIsScanning(true);
      setIsLoading(false);
      console.log("✅ Escáner iniciado correctamente");
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
    }
  }, [
    isScanning,
    isClosing,
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

    const timer = setTimeout(() => {
      startScanning();
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanning();
    };
  }, [isOpen, showManualInput, startScanning, stopScanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      onClose();
    }
  };

  const handleClose = async () => {
    if (isClosing) return;

    setIsClosing(true);

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error al cerrar escáner:", err);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-2 text-white">
          {showManualInput ? <Keyboard size={24} /> : <Camera size={24} />}
          <h2 className="font-bold text-lg">
            {showManualInput ? "Entrada Manual" : "Escanear Código"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm text-white"
            aria-label={showManualInput ? "Usar cámara" : "Entrada manual"}
          >
            {showManualInput ? <Camera size={20} /> : <Keyboard size={20} />}
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition backdrop-blur-sm text-white"
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
            <div className="bg-white rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ingresar Código Manualmente
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Ingresa el código de barras del producto:
              </p>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ej: 7501234567890"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-accent-primary outline-none text-lg text-center font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full mt-4 py-3 bg-accent-primary hover:bg-accent-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
                >
                  Buscar Producto
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4 text-center">
                💡 Tip: Puedes encontrar el código en el paquete del producto
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-md">
            {/* Contenedor del escáner */}
            <div
              ref={readerElementRef}
              id={scannerElementId}
              className="mx-auto rounded-lg overflow-hidden bg-black"
              style={{
                width: "100%",
                minHeight: "400px",
              }}
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 rounded-lg z-20">
                <Loader2 className="h-16 w-16 text-white animate-spin mb-4" />
                <p className="text-white text-sm">Iniciando cámara...</p>
                <p className="text-white/70 text-xs mt-2">
                  Esto puede tomar unos segundos
                </p>
              </div>
            )}

            {/* Último código escaneado */}
            {lastScannedCode && isScanning && (
              <div className="absolute top-0 left-0 right-0 p-4">
                <div className="bg-green-600/90 border border-green-400 rounded-lg p-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs">Último código:</p>
                      <p className="font-mono font-bold text-white mt-1 text-sm break-all">
                        {lastScannedCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs text-white font-medium">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instrucciones cuando está escaneando */}
            {isScanning && !isLoading && (
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="bg-accent-primary/20 border border-accent-primary/30 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-white text-center text-sm font-medium">
                    📸 Mantén el código dentro del recuadro verde
                  </p>
                  <p className="text-white/70 text-center text-xs mt-1">
                    El escaneo es automático
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
            <p className="text-xs opacity-90 mt-2">
              💡 Ve a la configuración de tu navegador y permite el acceso a la
              cámara.
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
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
            <p className="text-white text-sm font-medium mb-2">
              💡 Consejos para mejor escaneo:
            </p>
            <ul className="text-white/80 text-xs space-y-1 list-disc list-inside">
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
          border-radius: 1rem;
        }
        #${scannerElementId}__scan_region {
          border-radius: 1rem !important;
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
