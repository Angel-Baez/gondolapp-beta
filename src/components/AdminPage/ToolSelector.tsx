import { Cloud, FileSpreadsheet, Zap, ScanBarcode, Database } from "lucide-react";
import Link from "next/link";

type ActiveTool = "import" | "preset" | "sync" | "addProducts" | null;

interface ToolSelectorProps {
  onSelectTool: (tool: ActiveTool) => void;
  onOpenPreset: () => void;
}

/**
 * ToolSelector component para AdminPage
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de mostrar y seleccionar herramientas
 * - ISP: Interface específica con props claras
 */
export function ToolSelector({ onSelectTool, onOpenPreset }: ToolSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {/* Sincronización en la Nube */}
        <button
          onClick={() => onSelectTool("sync")}
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
          onClick={() => onSelectTool("import")}
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
          onClick={onOpenPreset}
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
          onClick={() => onSelectTool("addProducts")}
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
                Escanea productos no registrados y añádelos manualmente. El
                escáner se reabre automáticamente después de cada producto.
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

        {/* MongoDB Compass Admin */}
        <Link href="/admin/mongo">
          <button
            className="w-full p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-md hover:shadow-xl transition-all group text-left border-2 border-indigo-200 hover:border-indigo-400"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition flex-shrink-0">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  MongoDB Compass Admin
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Administra, edita y corrige productos directamente en MongoDB.
                  Fusiona duplicados y reasigna variantes.
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-indigo-50 rounded">
                    🔍 Búsqueda avanzada
                  </span>
                  <span className="px-2 py-1 bg-indigo-50 rounded">
                    ✏️ Edición CRUD
                  </span>
                  <span className="px-2 py-1 bg-indigo-50 rounded">
                    🔀 Fusionar duplicados
                  </span>
                </div>
              </div>
            </div>
          </button>
        </Link>
      </div>
    </div>
  );
}
