"use client";

import { useHaptics } from "@/hooks/useHaptics";
import {
  useActualizarCantidadReposicion,
  useCambiarEstadoReposicion,
  useDecrementarReposicion,
  useEliminarReposicionItemDirecto,
} from "@/hooks/useReposicion";
import { EstadoReposicion, ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { AnimatePresence, motion as m } from "framer-motion";
import {
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge, IconButton } from "../ui";

interface ReposicionCardProps {
  productoBase: ProductoBase;
  variantes: Array<{
    item: ItemReposicion;
    variante: ProductoVariante;
  }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ReposicionCard({
  productoBase,
  variantes,
  isExpanded,
  onToggleExpand,
}: ReposicionCardProps) {
  const cambiarEstado = useCambiarEstadoReposicion();
  const decrementar = useDecrementarReposicion();
  const actualizarCantidad = useActualizarCantidadReposicion();
  const eliminar = useEliminarReposicionItemDirecto();
  const { haptic } = useHaptics();

  const cantidadTotal = variantes.reduce((acc, v) => acc + v.item.cantidad, 0);
  const seccion = variantes[0]?.item.estado ?? "pendiente";

  const sectionColors: Record<EstadoReposicion, { border: string; badge: string; hover: string }> = {
    pendiente: {
      border: "border-cyan-200 dark:border-cyan-800",
      badge: "bg-cyan-500",
      hover: "hover:bg-cyan-50 dark:hover:bg-cyan-900/30",
    },
    repuesto: {
      border: "border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-500",
      hover: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
    },
    sin_stock: {
      border: "border-red-200 dark:border-red-800",
      badge: "bg-red-500",
      hover: "hover:bg-red-50 dark:hover:bg-red-900/30",
    },
  };

  const colors = sectionColors[seccion];

  const toggleEstado = (item: { id: string; estado: EstadoReposicion }, target: EstadoReposicion) => {
    const nuevoEstado = item.estado === target ? "pendiente" : target;
    cambiarEstado.mutate({ id: item.id, estado: nuevoEstado });
    haptic(nuevoEstado === "pendiente" ? 50 : [30, 30, 30]);

    if (target === "repuesto") {
      if (nuevoEstado === "repuesto") {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-500 w-5 h-5" />
            <span>Producto marcado como repuesto</span>
          </div>,
          { duration: 2000 }
        );
      } else {
        toast(
          <div className="flex items-center gap-2">
            <RefreshCw className="text-cyan-500 w-5 h-5" />
            <span>Producto desmarcado como repuesto</span>
          </div>,
          { duration: 2000 }
        );
      }
    } else {
      if (nuevoEstado === "sin_stock") {
        toast.success(
          <div className="flex items-center gap-2">
            <Ban className="text-red-500 w-5 h-5" />
            <span>Producto marcado sin stock</span>
          </div>,
          { duration: 2000 }
        );
      } else {
        toast(
          <div className="flex items-center gap-2">
            <RefreshCw className="text-cyan-500 w-5 h-5" />
            <span>Producto reactivado</span>
          </div>,
          { duration: 2000 }
        );
      }
    }
  };

  return (
    <div
      className={`bg-white dark:bg-dark-surface rounded-xl shadow-md overflow-hidden border-2 ${colors.border} transition-colors`}
    >
      <div
        onClick={onToggleExpand}
        className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer ${colors.hover} transition-colors`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {productoBase.imagen && (
            <img
              src={productoBase.imagen}
              alt={productoBase.nombre}
              className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg leading-tight truncate">
              {productoBase.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {productoBase.marca && (
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {productoBase.marca}
                </span>
              )}
              <Badge variant="primary">{variantes.length} variantes</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
          {cantidadTotal > 0 && (
            <div
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 ${colors.badge} text-white rounded-lg font-bold text-sm sm:text-base`}
            >
              x{cantidadTotal}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp size={20} className="sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown size={20} className="sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100 dark:border-dark-border"
          >
            <div className="divide-y divide-gray-100 dark:divide-dark-border">
              {variantes.map(({ item, variante }) => (
                <div key={item.id} className="p-3 sm:p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {variante.imagen && (
                        <img
                          src={variante.imagen}
                          alt={variante.nombreCompleto}
                          className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight">
                          {variante.nombreCompleto}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {variante.tamano && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {variante.tamano}
                            </span>
                          )}
                          {item.estado === "repuesto" && <Badge variant="success">REPUESTO</Badge>}
                          {item.estado === "sin_stock" && <Badge variant="danger">SIN STOCK</Badge>}
                          {item.estado === "pendiente" && <Badge variant="default">PENDIENTE</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-dark-border">
                      <div className="flex items-center gap-3">
                        {item.estado === "pendiente" && (
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-card rounded-lg p-1">
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => decrementar(item)}
                              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-dark-border active:bg-gray-300 dark:active:bg-dark-border font-bold text-lg text-gray-700 dark:text-gray-200 transition-colors"
                            >
                              -
                            </m.button>
                            <span className="w-12 text-center font-bold text-base text-gray-900 dark:text-gray-100">
                              {item.cantidad}
                            </span>
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              whileHover={{ scale: 1.05 }}
                              onClick={() =>
                                actualizarCantidad.mutate({ id: item.id, cantidad: item.cantidad + 1 })
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-dark-border active:bg-gray-300 dark:active:bg-dark-border font-bold text-lg text-gray-700 dark:text-gray-200 transition-colors"
                            >
                              +
                            </m.button>
                          </div>
                        )}

                        {item.estado !== "pendiente" && (
                          <span className="px-3 py-1.5 bg-gray-200 dark:bg-dark-card text-gray-700 dark:text-gray-200 rounded-lg font-bold text-sm">
                            x{item.cantidad}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <IconButton
                          variant={item.estado === "repuesto" ? "primary" : "ghost"}
                          onClick={() => toggleEstado(item, "repuesto")}
                          title={item.estado === "repuesto" ? "Desmarcar repuesto" : "Marcar como repuesto"}
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          <m.div
                            animate={item.estado === "repuesto" ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <CheckCircle size={20} className="sm:w-6 sm:h-6" />
                          </m.div>
                        </IconButton>

                        <IconButton
                          variant={item.estado === "sin_stock" ? "destructive" : "ghost"}
                          onClick={() => toggleEstado(item, "sin_stock")}
                          title={item.estado === "sin_stock" ? "Desmarcar sin stock" : "Marcar como sin stock"}
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          <m.div
                            animate={
                              item.estado === "sin_stock"
                                ? { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }
                                : { scale: 1 }
                            }
                            transition={{
                              duration: 0.6,
                              repeat: item.estado === "sin_stock" ? Infinity : 0,
                              repeatDelay: 1,
                            }}
                          >
                            <XCircle size={20} className="sm:w-6 sm:h-6" />
                          </m.div>
                        </IconButton>

                        <IconButton
                          variant="ghost"
                          onClick={() => {
                            eliminar.mutate(item.id);
                            haptic([50, 100, 50]);
                            toast.error(
                              <div className="flex items-center gap-2">
                                <Trash2 className="text-red-500 w-5 h-5" />
                                <span>Producto eliminado</span>
                              </div>,
                              { duration: 2000 }
                            );
                          }}
                          title="Eliminar"
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          <m.div
                            whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                          >
                            <Trash2 size={18} className="sm:w-5 sm:h-5" />
                          </m.div>
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

