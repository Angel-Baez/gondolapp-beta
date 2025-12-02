"use client";

import { useState, useEffect } from "react";
import { BarChart3, Package, Barcode, AlertCircle, Image, TrendingUp, RefreshCw } from "lucide-react";
import { Button, Header } from "@/components/ui";
import { Card } from "@/components/ui/Card";
import toast from "react-hot-toast";

interface Stats {
  totalProductos: number;
  totalVariantes: number;
  productosAislados: number;
  variantesSinImagen: number;
  promedioVariantes: number;
  productosRecientes: number;
  variantesRecientes: number;
  categorias: Array<{ nombre: string; count: number }>;
  marcas: Array<{ nombre: string; count: number }>;
}

/**
 * Dashboard de estadísticas de la base de datos
 * US-111: Dashboard de estadísticas
 */
export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        toast.error("Error al cargar estadísticas");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg font-sans transition-colors">
      <div className="max-w-lg mx-auto bg-white dark:bg-dark-surface min-h-screen sm:rounded-3xl sm:my-4 shadow-2xl overflow-hidden flex flex-col transition-colors">
        <Header
          title="Estadísticas"
          subtitle="Métricas de la base de datos"
          icon={BarChart3}
          backHref="/admin/mongo"
          backText="Volver a MongoDB Compass"
        />

        <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-dark-bg transition-colors">
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p>Cargando estadísticas...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Botón de recarga */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={loadStats} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Actualizar
                </Button>
              </div>

              {/* Métricas principales */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg">
                      <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                        {stats.totalProductos}
                      </p>
                      <p className="text-xs text-cyan-700 dark:text-cyan-300">Productos Base</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                      <Barcode className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {stats.totalVariantes}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">Variantes (SKUs)</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        {stats.productosAislados}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Sin variantes</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {stats.variantesSinImagen}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">Sin imagen</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Tendencias recientes */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Últimos 7 días
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      +{stats.productosRecientes}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Productos nuevos</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      +{stats.variantesRecientes}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Variantes nuevas</p>
                  </div>
                </div>
              </Card>

              {/* Promedio */}
              <Card className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Promedio de variantes por producto:
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.promedioVariantes}
                </p>
              </Card>

              {/* Distribución por categoría */}
              {stats.categorias.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Top Categorías
                  </h3>
                  <div className="space-y-2">
                    {stats.categorias.slice(0, 5).map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                          {cat.nombre}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2">
                          {cat.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Distribución por marca */}
              {stats.marcas.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Top Marcas
                  </h3>
                  <div className="space-y-2">
                    {stats.marcas.slice(0, 5).map((marca, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                          {marca.nombre}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-2">
                          {marca.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3" />
              <p>No se pudieron cargar las estadísticas</p>
              <Button variant="outline" onClick={loadStats} className="mt-4">
                Reintentar
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
