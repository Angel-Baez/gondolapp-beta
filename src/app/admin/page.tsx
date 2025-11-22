"use client";

import { useState } from "react";
import CrearConPreset from "@/components/CrearConPreset";
import ImportarExcel from "@/components/ImportarExcel";
import { SyncPanel } from "@/components/SyncPanel";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/AdminPage/Header";
import { ToolSelector } from "@/components/AdminPage/ToolSelector";
import { AddProductWorkflow } from "@/components/AdminPage/AddProductWorkflow";
import { useProductSync } from "@/hooks/useProductSync";
import toast from "react-hot-toast";

type ActiveTool = "import" | "preset" | "sync" | "addProducts" | null;

/**
 * AdminPage - Refactorizada siguiendo principios SOLID
 * 
 * ✅ SOLID Principles aplicados:
 * - SRP: Solo responsable de composición de componentes
 * - OCP: Extensible sin modificar código existente
 * - LSP: Componentes intercambiables
 * - DIP: Depende de abstracciones (componentes reutilizables)
 */
export default function AdminPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const { syncProductToIndexedDB } = useProductSync();

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
    } catch (error) {
      console.error("❌ Error al sincronizar con IndexedDB:", error);
      toast.error(
        "Producto guardado en MongoDB, pero hubo un error al sincronizar con el almacenamiento local. Por favor, recarga la página.",
        { duration: 5000 }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-lg mx-auto bg-white min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col">
        <Header />

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {activeTool === null ? (
            <ToolSelector
              onSelectTool={setActiveTool}
              onOpenPreset={() => setShowPresetModal(true)}
            />
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

          {/* Herramienta Activa: Añadir Productos */}
          {activeTool === "addProducts" && (
            <AddProductWorkflow onComplete={() => setActiveTool(null)} />
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
