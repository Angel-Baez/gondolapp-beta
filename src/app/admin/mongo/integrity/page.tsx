"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Trash2, RefreshCw, Barcode, Copy } from "lucide-react";
import { Button, Header } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import { ProductoVariante } from "@/types";
import { confirmAsync } from "@/lib/confirm";
import toast from "react-hot-toast";

interface OrphanVariante extends ProductoVariante {
  productoBaseId: string;
}

interface DuplicateGroup {
  ean: string;
  count: number;
  variantes: Array<{
    id: string;
    nombreCompleto: string;
    productoBaseId: string;
    productoNombre?: string;
  }>;
}

/**
 * Página de verificación de integridad de datos
 * US-106: Detección de variantes huérfanas
 * US-107: Escaneo global de EANs duplicados
 */
export default function IntegrityCheckPage() {
  // Estado de huérfanos
  const [orphans, setOrphans] = useState<OrphanVariante[]>([]);
  const [loadingOrphans, setLoadingOrphans] = useState(false);
  const [orphansChecked, setOrphansChecked] = useState(false);

  // Estado de duplicados
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [duplicatesChecked, setDuplicatesChecked] = useState(false);

  /**
   * Buscar variantes huérfanas
   */
  const checkOrphans = async () => {
    setLoadingOrphans(true);
    try {
      const response = await fetch("/api/admin/integrity/orphans");
      const data = await response.json();

      if (data.success) {
        setOrphans(data.orphans);
        setOrphansChecked(true);
        if (data.orphans.length === 0) {
          toast.success("No se encontraron variantes huérfanas");
        } else {
          toast(`Se encontraron ${data.orphans.length} variante(s) huérfana(s)`, {
            icon: "⚠️",
          });
        }
      } else {
        toast.error("Error al verificar huérfanos");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al verificar huérfanos");
    } finally {
      setLoadingOrphans(false);
    }
  };

  /**
   * Buscar EANs duplicados
   */
  const checkDuplicates = async () => {
    setLoadingDuplicates(true);
    try {
      const response = await fetch("/api/admin/integrity/duplicates");
      const data = await response.json();

      if (data.success) {
        setDuplicates(data.duplicates);
        setDuplicatesChecked(true);
        if (data.duplicates.length === 0) {
          toast.success("No se encontraron EANs duplicados");
        } else {
          toast(`Se encontraron ${data.duplicates.length} EAN(s) duplicado(s)`, {
            icon: "⚠️",
          });
        }
      } else {
        toast.error("Error al verificar duplicados");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al verificar duplicados");
    } finally {
      setLoadingDuplicates(false);
    }
  };

  /**
   * Eliminar variante huérfana
   */
  const deleteOrphan = async (varianteId: string) => {
    try {
      const confirmed = await confirmAsync({
        title: "¿Eliminar variante huérfana?",
        description: "Esta acción eliminará la variante de forma permanente.",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        variant: "danger",
      });

      if (!confirmed) return;

      const response = await fetch(`/api/admin/variantes/${varianteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Variante eliminada");
        setOrphans(orphans.filter(o => o.id !== varianteId));
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la eliminación");
    }
  };

  /**
   * Copiar EAN al portapapeles
   */
  const copyEan = (ean: string) => {
    navigator.clipboard.writeText(ean);
    toast.success("EAN copiado");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col transition-colors">
        <Header
          title="Integridad de Datos"
          subtitle="Verificar consistencia de la base de datos"
          icon={AlertTriangle}
          backHref="/admin/mongo"
          backText="Volver a MongoDB Compass"
        />

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg transition-colors space-y-6">
          {/* Sección: Variantes Huérfanas */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Variantes Huérfanas
              </h2>
              <Button
                variant="outline"
                onClick={checkOrphans}
                disabled={loadingOrphans}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingOrphans ? "animate-spin" : ""}`} />
                {loadingOrphans ? "Verificando..." : "Verificar"}
              </Button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Variantes cuyo producto base ya no existe en la base de datos.
            </p>

            {orphansChecked && (
              <>
                {orphans.length === 0 ? (
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        No hay variantes huérfanas
                      </span>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {orphans.map((orphan) => (
                      <Card key={orphan.id} className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {orphan.nombreCompleto}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                              <Barcode className="w-3 h-3" />
                              <span className="font-mono">{orphan.codigoBarras}</span>
                            </div>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Producto base: {orphan.productoBaseId} (no existe)
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => deleteOrphan(orphan.id)}
                            className="!p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Sección: EANs Duplicados */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                EANs Duplicados
              </h2>
              <Button
                variant="outline"
                onClick={checkDuplicates}
                disabled={loadingDuplicates}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingDuplicates ? "animate-spin" : ""}`} />
                {loadingDuplicates ? "Verificando..." : "Verificar"}
              </Button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Códigos de barras que están asignados a más de una variante.
            </p>

            {duplicatesChecked && (
              <>
                {duplicates.length === 0 ? (
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        No hay EANs duplicados
                      </span>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {duplicates.map((group) => (
                      <Card key={group.ean} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Barcode className="w-5 h-5 text-amber-600" />
                            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                              {group.ean}
                            </span>
                            <button
                              onClick={() => copyEan(group.ean)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-card rounded"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded">
                            {group.count} duplicados
                          </span>
                        </div>

                        <div className="space-y-2">
                          {group.variantes.map((variante, idx) => (
                            <div
                              key={variante.id}
                              className="text-sm p-2 bg-gray-50 dark:bg-dark-card rounded flex items-center justify-between"
                            >
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {variante.nombreCompleto}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {variante.productoNombre || "Producto desconocido"}
                                </p>
                              </div>
                              {idx > 0 && (
                                <span className="text-xs text-red-600 dark:text-red-400">
                                  Duplicado
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
