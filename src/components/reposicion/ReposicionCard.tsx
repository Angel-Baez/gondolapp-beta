"use client";

import { useHaptics } from "@/hooks/useHaptics";
import { useReposicionStore } from "@/store/reposicion";
import { ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { AnimatePresence, motion as m } from "framer-motion";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MoveHorizontal,
  Trash2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "../ui";
import { SwipeableCard, SwipeActions } from "../ui/SwipeableCard";

interface ReposicionCardProps {
  productoBase: ProductoBase;
  variantes: Array<{
    item: ItemReposicion;
    variante: ProductoVariante;
  }>;
  seccion: "pendiente" | "repuesto" | "sinStock";
  // ✅ Estado de expansión controlado desde el padre para evitar colapsos
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ReposicionCard({
  productoBase,
  variantes,
  seccion,
  isExpanded,
  onToggleExpand,
}: ReposicionCardProps) {
  const { marcarRepuesto, marcarSinStock, actualizarCantidad, eliminarItem } =
    useReposicionStore();
  const { haptic } = useHaptics();

  const cantidadTotal = variantes.reduce((acc, v) => acc + v.item.cantidad, 0);

  // Helper to create swipe actions based on current item state
  const createSwipeActions = (item: ItemReposicion) => {
    const isPending = !item.repuesto && !item.sinStock;
    const isRepuesto = item.repuesto;
    const isSinStock = item.sinStock;

    // Action: Mark as Repuesto (complete)
    const handleMarkRepuesto = () => {
      marcarRepuesto(item.id, true);
      haptic([30, 30, 30]);
      toast.success(
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <CheckCircle className="text-emerald-500 w-5 h-5" />
          <span>Marcado como repuesto</span>
        </m.div>,
        { duration: 2000 }
      );
    };

    // Action: Mark as Sin Stock
    const handleMarkSinStock = () => {
      marcarSinStock(item.id, true);
      haptic([30, 30, 30]);
      toast.success(
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <XCircle className="text-red-500 w-5 h-5" />
          <span>Marcado sin stock</span>
        </m.div>,
        { duration: 2000 }
      );
    };

    // Action: Return to Pending
    const handleReturnToPending = () => {
      // Reset both flags to return to pending state
      if (item.repuesto) marcarRepuesto(item.id, false);
      if (item.sinStock) marcarSinStock(item.id, false);
      haptic([30, 30, 30]);
      toast(
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="text-cyan-500 w-5 h-5" />
          <span>Devuelto a pendientes</span>
        </m.div>,
        { duration: 2000 }
      );
    };

    // Action: Delete item
    const handleDelete = () => {
      eliminarItem(item.id);
      haptic([50, 100, 50]);
      toast.error(
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Trash2 className="text-red-500 w-5 h-5" />
          <span>Producto eliminado</span>
        </m.div>,
        { duration: 2000 }
      );
    };

    // Configure actions based on current state
    if (isPending) {
      // Pendientes: Swipe left → Repuesto, Swipe right → Sin Stock
      return {
        leftAction: SwipeActions.markComplete(handleMarkRepuesto),
        rightAction: SwipeActions.markOutOfStock(handleMarkSinStock),
      };
    } else if (isRepuesto) {
      // Repuestos: Swipe left → Volver a Pendiente, Swipe right → Sin Stock
      return {
        leftAction: SwipeActions.returnToPending(handleReturnToPending),
        rightAction: SwipeActions.markOutOfStock(handleMarkSinStock),
      };
    } else if (isSinStock) {
      // Sin Stock: Swipe left → Volver a Pendiente, Swipe right → Eliminar
      return {
        leftAction: SwipeActions.returnToPending(handleReturnToPending),
        rightAction: SwipeActions.delete(handleDelete),
      };
    }

    return { leftAction: undefined, rightAction: undefined };
  };

  // Colores según sección
  const sectionColors = {
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
    sinStock: {
      border: "border-red-200 dark:border-red-800",
      badge: "bg-red-500",
      hover: "hover:bg-red-50 dark:hover:bg-red-900/30",
    },
  };

  const colors = sectionColors[seccion];

  // Get swipe hint text based on section
  const getSwipeHint = () => {
    if (seccion === "pendiente") {
      return "← Repuesto | Sin Stock →";
    } else if (seccion === "repuesto") {
      return "← Pendiente | Sin Stock →";
    } else {
      return "← Pendiente | Eliminar →";
    }
  };

  return (
    <div
      className={`bg-white dark:bg-dark-surface rounded-xl shadow-md overflow-hidden border-2 ${colors.border} transition-colors`}
    >
      {/* Header */}
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
            <ChevronUp
              size={20}
              className="sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400 flex-shrink-0"
            />
          ) : (
            <ChevronDown
              size={20}
              className="sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400 flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Body - Variantes */}
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
              {variantes.map(({ item, variante }) => {
                const { leftAction, rightAction } = createSwipeActions(item);

                return (
                  <SwipeableCard
                    key={item.id}
                    leftAction={leftAction}
                    rightAction={rightAction}
                    className="rounded-none"
                  >
                    <div className="p-3 sm:p-4">
                      <div className="space-y-3">
                    {/* Info */}
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
                          {item.repuesto && (
                            <Badge variant="success">REPUESTO</Badge>
                          )}
                          {item.sinStock && (
                            <Badge variant="danger">SIN STOCK</Badge>
                          )}
                          {!item.repuesto && !item.sinStock && (
                            <Badge variant="default">PENDIENTE</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls - Quantity + swipe hint */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-dark-border">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-3">
                        {!item.repuesto && !item.sinStock && (
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-card rounded-lg p-1">
                            {/* Botón MENOS */}
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() =>
                                actualizarCantidad(item.id, item.cantidad - 1)
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-dark-border active:bg-gray-300 dark:active:bg-dark-border font-bold text-lg text-gray-700 dark:text-gray-200 transition-colors"
                              aria-label="Disminuir cantidad"
                            >
                              -
                            </m.button>
                            <span className="w-12 text-center font-bold text-base text-gray-900 dark:text-gray-100">
                              {item.cantidad}
                            </span>
                            {/* Botón MÁS */}
                            <m.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() =>
                                actualizarCantidad(item.id, item.cantidad + 1)
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-dark-border active:bg-gray-300 dark:active:bg-dark-border font-bold text-lg text-gray-700 dark:text-gray-200 transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </m.button>
                          </div>
                        )}

                        {(item.repuesto || item.sinStock) && (
                          <span className="px-3 py-1.5 bg-gray-200 dark:bg-dark-card text-gray-700 dark:text-gray-200 rounded-lg font-bold text-sm">
                            x{item.cantidad}
                          </span>
                        )}
                      </div>

                      {/* Swipe Hint - Shows available actions */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <MoveHorizontal size={14} />
                        <span>{getSwipeHint()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SwipeableCard>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
