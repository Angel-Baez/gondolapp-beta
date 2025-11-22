"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useProductVerification } from "@/hooks/useProductVerification";
import { useProductSync } from "@/hooks/useProductSync";

// Lazy loading para optimización
const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), {
  ssr: false,
});

const FormularioProductoManual = dynamic(
  () => import("@/components/FormularioProductoManual"),
  { ssr: false }
);

interface AddProductWorkflowProps {
  onComplete: () => void;
}

/**
 * AddProductWorkflow component - Maneja el flujo completo de añadir productos
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable del flujo de añadir productos
 * - DIP: Depende de abstracciones (hooks)
 * - OCP: Extensible sin modificar código existente
 */
export function AddProductWorkflow({ onComplete }: AddProductWorkflowProps) {
  const [showScanner, setShowScanner] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [scannedEAN, setScannedEAN] = useState("");

  const { checkExists, checking } = useProductVerification();
  const { syncProductToIndexedDB } = useProductSync();

  // Constantes
  const SCANNER_REOPEN_DELAY = 500; // ms - Tiempo antes de reabrir scanner tras guardar

  // Procesar código escaneado
  const handleScanCode = async (codigoBarras: string) => {
    console.log("🔍 Código escaneado:", codigoBarras);

    const { exists } = await checkExists(codigoBarras);

    if (exists) {
      // Producto ya registrado
      toast.success(
        `✅ El producto con código ${codigoBarras} ya está registrado`,
        { duration: 4000, position: "top-center" }
      );
      // Scanner permanece abierto, no hacer nada más
    } else {
      // Producto nuevo - abrir formulario
      console.log("📝 Abriendo formulario para producto nuevo");
      setScannedEAN(codigoBarras);
      setShowScanner(false);
      setShowManualForm(true);
    }
  };

  // Manejar producto creado exitosamente
  const handleProductoCreado = async (producto: any) => {
    console.log("✅ Producto creado en MongoDB:", producto);

    try {
      // Sincronizar con IndexedDB
      await syncProductToIndexedDB(producto);

      // Mostrar notificación de éxito
      toast.success(
        `✅ "${producto.base.nombre} ${producto.variante.nombreCompleto}" guardado correctamente`,
        { duration: 3000, position: "top-center" }
      );

      // Cerrar formulario
      setShowManualForm(false);
      setScannedEAN("");

      // IMPORTANTE: Reabrir scanner después del delay configurado
      setTimeout(() => {
        console.log("🔄 Reabriendo scanner para continuar...");
        setShowScanner(true);
      }, SCANNER_REOPEN_DELAY);
    } catch (error) {
      console.error("❌ Error al sincronizar con IndexedDB:", error);
      toast.error(
        "Producto guardado en MongoDB, pero hubo un error al sincronizar con el almacenamiento local. Por favor, recarga la página.",
        { duration: 5000 }
      );
    }
  };

  // Cerrar scanner y volver al menú
  const handleCloseScanner = () => {
    console.log("🚪 Cerrando scanner");
    setShowScanner(false);
    onComplete();
  };

  // Cerrar formulario sin guardar
  const handleCloseForm = () => {
    console.log("🚪 Cerrando formulario sin guardar");
    setShowManualForm(false);
    setScannedEAN("");
    onComplete();
  };

  return (
    <>
      {/* BarcodeScanner - Solo visible cuando se activa */}
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={handleCloseScanner}
          onScan={handleScanCode}
        />
      )}

      {/* FormularioProductoManual - Solo visible cuando hay EAN escaneado */}
      {showManualForm && scannedEAN && (
        <FormularioProductoManual
          eanEscaneado={scannedEAN}
          isOpen={showManualForm}
          onClose={handleCloseForm}
          onProductoCreado={handleProductoCreado}
        />
      )}

      {/* Loading Overlay - Mientras verifica si producto existe */}
      {checking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mb-4" />
              <p className="text-lg font-bold text-gray-900">
                Verificando producto...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Consultando base de datos
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
