"use client";

import CrearConPreset from "@/components/CrearConPreset";
import ImportarExcel from "@/components/ImportarExcel";
import { SyncPanel } from "@/components/SyncPanel";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Cloud, Database, FileSpreadsheet, Zap, ScanBarcode } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import toast from "react-hot-toast";

// Lazy loading para optimización
const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), {
  ssr: false,
});

const FormularioProductoManual = dynamic(
  () => import("@/components/FormularioProductoManual"),
  { ssr: false }
);

type ActiveTool = "import" | "preset" | "sync" | "addProducts" | null;

export default function AdminPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  
  // Estados para flujo de añadir productos
  const [showScanner, setShowScanner] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [scannedEAN, setScannedEAN] = useState<string>("");
  const [isCheckingProduct, setIsCheckingProduct] = useState(false);

  // Constantes
  const SCANNER_REOPEN_DELAY = 500; // ms - Tiempo antes de reabrir scanner tras guardar

  // Abrir flujo de añadir productos
  const handleStartAddProducts = () => {
    setActiveTool("addProducts");
    setShowScanner(true);
  };

  // Procesar código escaneado
  const handleScanCode = async (codigoBarras: string) => {
    console.log("🔍 Código escaneado:", codigoBarras);
    setIsCheckingProduct(true);

    try {
      // Verificar existencia en IndexedDB
      const productoExistente = await db.productosVariantes
        .where("codigoBarras")
        .equals(codigoBarras)
        .first();

      if (productoExistente) {
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
    } catch (error) {
      console.error("❌ Error al verificar producto:", error);
      toast.error("Error al verificar el producto en la base de datos");
    } finally {
      setIsCheckingProduct(false);
    }
  };

  // Manejar producto creado exitosamente
  const handleProductoCreado = async (producto: any) => {
    console.log("✅ Producto creado en MongoDB:", producto);

    try {
      // Verificar existencia de ambos registros en paralelo
      const [baseExistente, varianteExistente] = await Promise.all([
        db.productosBase.get(producto.base.id),
        db.productosVariantes.get(producto.variante.id),
      ]);

      // Preparar operaciones de inserción
      const insertOperations = [];

      // Sincronizar ProductoBase con IndexedDB si no existe
      if (!baseExistente) {
        insertOperations.push(
          db.productosBase.add({
            id: producto.base.id,
            nombre: producto.base.nombre,
            marca: producto.base.marca,
            categoria: producto.base.categoria,
            imagen: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
        console.log("✅ ProductoBase preparado para sincronizar");
      }

      // Sincronizar ProductoVariante con IndexedDB si no existe
      if (!varianteExistente) {
        insertOperations.push(
          db.productosVariantes.add({
            id: producto.variante.id,
            productoBaseId: producto.base.id,
            codigoBarras: producto.variante.ean,
            nombreCompleto: producto.variante.nombreCompleto,
            tipo: producto.variante.tipo,
            tamano: producto.variante.tamano,
            sabor: undefined,
            unidadMedida: undefined,
            imagen: undefined,
            createdAt: new Date(),
          })
        );
        console.log("✅ ProductoVariante preparado para sincronizar");
      }

      // Ejecutar todas las inserciones en paralelo
      if (insertOperations.length > 0) {
        await Promise.all(insertOperations);
        console.log("✅ Sincronización con IndexedDB completada");
      }

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
    setActiveTool(null);
  };

  // Cerrar formulario sin guardar
  const handleCloseForm = () => {
    console.log("🚪 Cerrando formulario sin guardar");
    setShowManualForm(false);
    setScannedEAN("");
    setActiveTool(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto bg-white min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER - Consistente con HomePage */}
        <header className="bg-gray-900 text-white p-6 shadow-lg">
          <Link
            href="/"
            className="inline-flex items-center text-accent-primary hover:text-cyan-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Inventario
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/20 rounded-lg">
              <Database className="w-8 h-8 text-accent-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Administración</h1>
              <p className="text-sm text-gray-400 mt-1">
                Gestiona tu catálogo de productos
              </p>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {activeTool === null ? (
            <div className="space-y-6">
              {/* Selector de Herramientas */}
              <div className="grid gap-4">
                {/* Sincronización en la Nube */}
                <button
                  onClick={() => setActiveTool("sync")}
                  className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl shadow-md hover:shadow-xl transition-all group text-left border-2 border-cyan-200 hover:border-cyan-400"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition flex-shrink-0">
                      <Cloud className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Sincronización en la Nube
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Mantén tus datos sincronizados entre dispositivos usando
                        MongoDB Atlas.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-cyan-50 rounded">
                          ☁️ Backup automático
                        </span>
                        <span className="px-2 py-1 bg-cyan-50 rounded">
                          🔄 Multi-dispositivo
                        </span>
                        <span className="px-2 py-1 bg-cyan-50 rounded">
                          📊 Estadísticas
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Importar Excel */}
                <button
                  onClick={() => setActiveTool("import")}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all group text-left border-2 border-transparent hover:border-accent-primary"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition flex-shrink-0">
                      <FileSpreadsheet className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Importar desde Excel
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Carga productos masivamente desde un archivo Excel.
                        Perfecto para poblar tu catálogo inicial.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-green-50 rounded">
                          ✅ 50-100 SKU en 5 min
                        </span>
                        <span className="px-2 py-1 bg-green-50 rounded">
                          ✅ Detecta duplicados
                        </span>
                        <span className="px-2 py-1 bg-green-50 rounded">
                          ✅ Normalización automática
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Presets */}
                <button
                  onClick={() => setShowPresetModal(true)}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all group text-left border-2 border-transparent hover:border-purple-500"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition flex-shrink-0">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Creación Rápida con Presets
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Crea productos con plantillas predefinidas. Ideal para
                        categorías repetitivas.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-purple-50 rounded">
                          ⚡ 10 seg/SKU
                        </span>
                        <span className="px-2 py-1 bg-purple-50 rounded">
                          ⚡ Autocompletado
                        </span>
                        <span className="px-2 py-1 bg-purple-50 rounded">
                          ⚡ 10+ categorías
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Añadir Productos a MongoDB */}
                <button
                  onClick={handleStartAddProducts}
                  className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all group text-left border-2 border-transparent hover:border-orange-500"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition flex-shrink-0">
                      <ScanBarcode className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Añadir Productos a MongoDB
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Escanea productos no registrados y añádelos manualmente. El escáner se reabre automáticamente después de cada producto.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-orange-50 rounded">
                          📸 Escaneo continuo
                        </span>
                        <span className="px-2 py-1 bg-orange-50 rounded">
                          ✍️ Registro manual
                        </span>
                        <span className="px-2 py-1 bg-orange-50 rounded">
                          🔄 Flujo automático
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

             
            </div>
          ) : null}

          {/* Herramienta Activa: Sincronización */}
          {activeTool === "sync" && (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setActiveTool(null)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <SyncPanel />
            </div>
          )}

          {/* Herramienta Activa: Importar Excel */}
          {activeTool === "import" && (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setActiveTool(null)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <ImportarExcel />
            </div>
          )}

          {/* Modal de Presets */}
          <CrearConPreset
            isOpen={showPresetModal}
            onClose={() => setShowPresetModal(false)}
            onProductoCreado={handleProductoCreado}
          />

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
          {isCheckingProduct && (
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
        </main>
      </div>
    </div>
  );
}
