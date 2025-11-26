"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useProductVerification } from "@/hooks/useProductVerification";
import { useProductSync } from "@/hooks/useProductSync";
import { ProductoCompleto } from "@/services/productos";

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

export function AddProductWorkflow({ onComplete }: AddProductWorkflowProps) {
  const [showScanner, setShowScanner] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [scannedEAN, setScannedEAN] = useState("");

  // ✅ Flags de protección
  const isProcessingScan = useRef(false);
  const isSavingProduct = useRef(false); // ← NUEVO

  const { checkExists, checking } = useProductVerification();
  const { syncProductToIndexedDB } = useProductSync();

  const SCANNER_REOPEN_DELAY = 500;

  const handleScanCode = async (codigoBarras: string) => {
    console.log("🔍 Código escaneado:", codigoBarras);
    isProcessingScan.current = true;

    try {
      const { exists } = await checkExists(codigoBarras);

      if (exists) {
        toast.success(
          `✅ El producto con código ${codigoBarras} ya está registrado`,
          { duration: 3000, position: "top-center" }
        );
        console.log("✅ Producto existente, scanner sigue activo");
        
        setTimeout(() => {
          isProcessingScan.current = false;
        }, 500);
      } else {
        console.log("📝 Producto nuevo detectado, abriendo formulario...");
        
        setScannedEAN(codigoBarras);
        setShowScanner(false);
        
        setTimeout(() => {
          setShowManualForm(true);
          isProcessingScan.current = false;
        }, 150);
      }
    } catch (error) {
      console.error("❌ Error al verificar producto:", error);
      toast.error("Error al verificar el producto. Intenta de nuevo.");
      
      setTimeout(() => {
        isProcessingScan.current = false;
      }, 500);
    }
  };

  const handleProductoCreado = async (producto: ProductoCompleto) => {
    console.log("✅ Producto creado en MongoDB:", producto);
    
    // ✅ NUEVO: Marcar que estamos guardando
    isSavingProduct.current = true;

    try {
      await syncProductToIndexedDB(producto);

      toast.success(
        `✅ "${producto.base.nombre} ${producto.variante.nombreCompleto}" guardado correctamente`,
        { duration: 3000, position: "top-center" }
      );

      setShowManualForm(false);
      setScannedEAN("");

      setTimeout(() => {
        console.log("🔄 Reabriendo scanner para continuar...");
        setShowScanner(true);
        // ✅ Liberar el flag DESPUÉS de reabrir el scanner
        isSavingProduct.current = false;
      }, SCANNER_REOPEN_DELAY);
    } catch (error) {
      console.error("❌ Error al sincronizar con IndexedDB:", error);
      toast.error(
        "Producto guardado en MongoDB, pero hubo un error al sincronizar con el almacenamiento local. Por favor, recarga la página.",
        { duration: 5000 }
      );
      // ✅ Liberar el flag incluso en caso de error
      isSavingProduct.current = false;
    }
  };

  const handleCloseScanner = () => {
    if (isProcessingScan.current) {
      console.log("⚠️ Ignorando cierre automático del scanner - procesando escaneo...");
      return;
    }

    console.log("🚪 Usuario cerró el scanner manualmente");
    setShowScanner(false);
    setScannedEAN("");
    onComplete();
  };

  const handleCloseForm = () => {
    // ✅ CRÍTICO: Ignorar si estamos guardando
    if (isSavingProduct.current) {
      console.log("⚠️ Ignorando cierre automático del formulario - guardando producto...");
      return;
    }

    console.log("🚪 Usuario cerró el formulario sin guardar");
    setShowManualForm(false);
    setScannedEAN("");
    
  };

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          isOpen={showScanner}
          onClose={handleCloseScanner}
          onScan={handleScanCode}
        />
      )}

      {showManualForm && scannedEAN && (
        <FormularioProductoManual
          eanEscaneado={scannedEAN}
          isOpen={showManualForm}
          onClose={handleCloseForm}
          onProductoCreado={handleProductoCreado}
        />
      )}

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