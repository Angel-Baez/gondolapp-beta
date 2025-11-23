"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useState } from "react";
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

              if (data.data.productosBase?.length) {
                await db.productosBase.bulkAdd(data.data.productosBase);
              }
              if (data.data.variantes?.length) {
                await db.productosVariantes.bulkAdd(data.data.variantes);
              }
              if (data.data.reposicion?.length) {
                await db.itemsReposicion.bulkAdd(data.data.reposicion);
              }
              if (data.data.vencimientos?.length) {
                await db.itemsVencimiento.bulkAdd(data.data.vencimientos);
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
          <h2 className="text-2xl font-bold text-gray-800">
            Sincronización en la Nube
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Mantén tus datos sincronizados entre dispositivos
          </p>
        </div>
        <Button
          onClick={() => fetchStats(filterDays)}
          variant="outline"
          disabled={loading}
          className="text-sm"
        >
          🔄 Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-600">
                Productos Base
              </p>
              <p className="text-3xl font-bold text-cyan-900 mt-2">
                {stats?.productosBase ?? "-"}
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Variantes</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {stats?.variantes ?? "-"}
              </p>
            </div>
            <div className="text-4xl">🏷️</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Reposición</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {stats?.reposicion ?? "-"}
              </p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">
                Vencimientos
              </p>
              <p className="text-3xl font-bold text-orange-900 mt-2">
                {stats?.vencimientos ?? "-"}
              </p>
            </div>
            <div className="text-4xl">⏰</div>
          </div>
        </Card>
      </div>

      {/* Filtro de tiempo */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Mostrar datos de:
          </span>
          <div className="flex gap-2">
            {[7, 30, 90, 365].map((days) => (
              <button
                key={days}
                onClick={() => {
                  setFilterDays(days);
                  fetchStats(days);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterDays === days
                    ? "bg-cyan-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {days === 365 ? "1 año" : `${days} días`}
              </button>
            ))}
            <button
              onClick={() => {
                setFilterDays(0);
                fetchStats();
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterDays === 0
                  ? "bg-cyan-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todo
            </button>
          </div>
        </div>
      </Card>

      {/* Acciones de Sincronización */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">☁️</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">
                  Subir a la Nube
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Guarda tus datos locales en MongoDB Atlas para acceder desde
                  otros dispositivos
                </p>
              </div>
            </div>
            <Button
              onClick={syncToCloud}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600"
            >
              {loading ? "Sincronizando..." : "⬆️ Subir Datos"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📥</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">
                  Descargar de la Nube
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Descarga los datos guardados en MongoDB a este dispositivo
                </p>
              </div>
            </div>
            <Button
              onClick={syncFromCloud}
              disabled={loading}
              variant="outline"
              className="w-full border-cyan-500 text-cyan-600 hover:bg-cyan-50"
            >
              {loading ? "Descargando..." : "⬇️ Descargar Datos"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Resultados de sincronización */}
      {syncResults && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-bold text-green-800 text-lg mb-4">
            ✅ Sincronización Completada
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-700 mb-2">
                Registros Insertados:
              </p>
              <ul className="space-y-1 text-green-600">
                {Object.entries(syncResults.inserted).map(([key, value]) => (
                  <li key={key}>
                    • {key}: {value}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-green-700 mb-2">
                Registros Actualizados:
              </p>
              <ul className="space-y-1 text-green-600">
                {Object.entries(syncResults.updated).map(([key, value]) => (
                  <li key={key}>
                    • {key}: {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {syncResults.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-700 mb-2">
                Errores ({syncResults.errors.length}):
              </p>
              <ul className="space-y-1 text-sm text-red-600">
                {syncResults.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>
                    • {err.type} - {err.item}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Última sincronización */}
      {lastSync && (
        <p className="text-xs text-gray-500 text-center">
          Última actualización:{" "}
          {new Date(lastSync).toLocaleString("es-ES", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}
