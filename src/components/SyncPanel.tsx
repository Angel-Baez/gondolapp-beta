"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { 
  Cloud, 
  RefreshCw, 
  ListChecks, 
  CheckCircle2, 
  AlertTriangle, 
  Database,
  BarChart3,
  Loader2,
  Upload,
  Download
} from "lucide-react";
import toast from "react-hot-toast";
import { confirmAsync } from "@/lib/confirm";

interface SyncStats {
  productosBase: number;
  variantes: number;
  reposicion: number;
  vencimientos: number;
}

interface SyncResults {
  inserted: Partial<SyncStats>;
  updated: Partial<SyncStats>;
  errors: Array<{ type: string; item: string; error: string }>;
}

export function SyncPanel() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResults | null>(null);
  const [filterDays, setFilterDays] = useState<number>(7);

  // Obtener estadísticas
  const fetchStats = async (days?: number) => {
    try {
      setLoading(true);
      const desde = days
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const params = new URLSearchParams();
      if (desde) params.append("desde", desde);
      params.append("limit", "1");

      const response = await fetch(`/api/sync?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats({
          productosBase: data.pagination.total.productosBase || 0,
          variantes: data.pagination.total.variantes || 0,
          reposicion: data.pagination.total.reposicion || 0,
          vencimientos: data.pagination.total.vencimientos || 0,
        });
        setLastSync(data.timestamp);
      }
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar desde IndexedDB a MongoDB
  const syncToCloud = async () => {
    try {
      setLoading(true);
      setSyncResults(null);

      // Obtener datos de IndexedDB (usar tu implementación de Dexie)
      const { db } = await import("@/lib/db");

      const [productosBase, variantes, reposicion, vencimientos] =
        await Promise.all([
          db.productosBase.toArray(),
          db.productosVariantes.toArray(),
          db.itemsReposicion.toArray(),
          db.itemsVencimiento.toArray(),
        ]);

      // Enviar a MongoDB
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productosBase,
          variantes,
          reposicion,
          vencimientos,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncResults(data.results);
        await fetchStats(); // Actualizar estadísticas
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error al sincronizar:", error);
      toast.error("Error al sincronizar datos");
    } finally {
      setLoading(false);
    }
  };

  // Descargar desde MongoDB a IndexedDB
  const syncFromCloud = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sync?tipo=all");
      const data = await response.json();

      if (data.success) {
        const { db } = await import("@/lib/db");

        // Limpiar datos locales (opcional)
        const confirmar = await confirmAsync({
          title: "¿Reemplazar datos locales?",
          description:
            "¿Deseas reemplazar todos los datos locales con los datos de la nube? Esta acción no se puede deshacer.",
          confirmLabel: "Sí, reemplazar",
          cancelLabel: "Cancelar",
          variant: "danger",
        });
        if (confirmar) {
          await db.transaction(
            "rw",
            [
              db.productosBase,
              db.productosVariantes,
              db.itemsReposicion,
              db.itemsVencimiento,
            ],
            async () => {
              await db.productosBase.clear();
              await db.productosVariantes.clear();
              await db.itemsReposicion.clear();
              await db.itemsVencimiento.clear();

              // Usar bulkPut en vez de bulkAdd para manejar correctamente los IDs
              if (data.data.productosBase?.length) {
                await db.productosBase.bulkPut(data.data.productosBase);
              }
              if (data.data.variantes?.length) {
                await db.productosVariantes.bulkPut(data.data.variantes);
              }
              if (data.data.reposicion?.length) {
                await db.itemsReposicion.bulkPut(data.data.reposicion);
              }
              if (data.data.vencimientos?.length) {
                await db.itemsVencimiento.bulkPut(data.data.vencimientos);
              }
            }
          );

          toast.success("✅ Datos descargados correctamente");
        }
      }
    } catch (error) {
      console.error("Error al descargar:", error);
      toast.error("Error al descargar datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Cloud className="text-blue-500" size={20} />
            Estado de la Nube
          </h3>
          <p className="text-sm text-gray-500">
            {lastSync 
              ? `Última sinc: ${new Date(lastSync).toLocaleTimeString()}` 
              : "Verifica el estado actual de MongoDB"}
          </p>
        </div>
        <button 
          onClick={() => fetchStats(filterDays)}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Refrescar Estadísticas"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Estadísticas */}
      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Productos" value={stats.productosBase} icon={Database} color="indigo" />
          <MetricCard label="Variantes" value={stats.variantes} icon={BarChart3} color="purple" />
          <MetricCard label="Reposición" value={stats.reposicion} icon={ListChecks} color="amber" />
          <MetricCard label="Vencimientos" value={stats.vencimientos} icon={AlertTriangle} color="rose" />
        </div>
      ) : (
        <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
          <p className="text-gray-400 text-sm">No hay datos recientes</p>

        </div>
      )}

      {/* Acciones de Sincronización */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
            <Button
              onClick={syncToCloud}
              disabled={loading}
              className="w-full py-3 bg-cyan-400 text-white rounded-xl shadow-sm hover:bg-cyan-500 hover:shadow-md transition-all flex items-center justify-center gap-2 font-medium active:scale-[0.99]"
            >
              {loading ? (
                <><Loader2 className="animate-spin" />Sincronizando</>
              ) : (
                <><Upload /> Subir Datos </>
              )}
            </Button>
          
            <Button
              onClick={syncFromCloud}
              disabled={loading}
              variant="outline"
              className="w-full py-3 bg-white text-gray-900 rounded-xl shadow-sm hover:bg-gray-200 hover:shadow-md transition-all flex items-center justify-center gap-2 font-medium active:scale-[0.99]"
            >
              {loading ? (
                <><Loader2 className="animate-spin" />Descargando</>
              ) : (
                <><Download /> Descargar Datos </>
              )}
            </Button>
         
      </div>

      {/* Resultados de sincronización */}
     {syncResults && (
        <div className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              Reporte de Cambios
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Nuevos</span>
                <ul className="mt-1 space-y-0.5">
                  {Object.entries(syncResults.inserted).map(([k, v]) => (
                    v ? <li key={k} className="flex justify-between text-gray-600">
                      <span>{k}</span> <span className="font-mono font-bold text-green-600">+{v}</span>
                    </li> : null
                  ))}
                  {Object.keys(syncResults.inserted).length === 0 && <li className="text-gray-400 italic">Nada nuevo</li>}
                </ul>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Actualizados</span>
                <ul className="mt-1 space-y-0.5">
                  {Object.entries(syncResults.updated).map(([k, v]) => (
                    v ? <li key={k} className="flex justify-between text-gray-600">
                      <span>{k}</span> <span className="font-mono font-bold text-blue-600">~{v}</span>
                    </li> : null
                  ))}
                   {Object.keys(syncResults.updated).length === 0 && <li className="text-gray-400 italic">Sin cambios</li>}
                </ul>
              </div>
            </div>

            {syncResults.errors.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-red-600 font-bold text-xs uppercase mb-1">Errores ({syncResults.errors.length})</p>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {syncResults.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-500 truncate">
                      {err.item}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  }[color as string] || "bg-gray-50 text-gray-600";

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
      <div className={`p-2 rounded-lg mb-2 ${colorStyles}`}>
        <Icon size={18} />
      </div>
      <span className="text-2xl font-bold text-gray-900 leading-none">{value}</span>
      <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">{label}</span>
    </div>
  );
}