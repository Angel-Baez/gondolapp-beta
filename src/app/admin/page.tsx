"use client";

import CrearConPreset from "@/components/CrearConPreset";
import ImportarExcel from "@/components/ImportarExcel";
import { SyncPanel } from "@/components/SyncPanel";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Cloud, Database, FileSpreadsheet, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ActiveTool = "import" | "preset" | "sync" | null;

export default function AdminPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const handleProductoCreado = (producto: any) => {
    console.log("✅ Producto creado:", producto);
    alert(`Producto "${producto.base.nombre}" creado exitosamente`);
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
        </main>
      </div>
    </div>
  );
}
