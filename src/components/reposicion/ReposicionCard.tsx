"use client";

import { useHaptics } from "@/hooks/useHaptics";
import { useReposicionStore } from "@/store/reposicion";
import { ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { AnimatePresence, motion as m, motion } from "framer-motion";
import {
  Ban,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Badge, IconButton } from "../ui";

interface ReposicionCardProps {
  productoBase: ProductoBase;
  variantes: Array<{
    item: ItemReposicion;
    variante: ProductoVariante;
  }>;
  seccion: "pendiente" | "repuesto" | "sinStock";
}

export function ReposicionCard({
  productoBase,
  variantes,
  seccion,
}: ReposicionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { marcarRepuesto, marcarSinStock, actualizarCantidad, eliminarItem } =
    useReposicionStore();
  const { haptic } = useHaptics();

  const cantidadTotal = variantes.reduce((acc, v) => acc + v.item.cantidad, 0);

  // Colores según sección
  const sectionColors = {
    pendiente: {
      border: "border-cyan-200",
      badge: "bg-cyan-500",
      hover: "hover:bg-cyan-50",
    },
    repuesto: {
      border: "border-emerald-200",
      badge: "bg-emerald-500",
      hover: "hover:bg-emerald-50",
    },
    sinStock: {
      border: "border-red-200",
      badge: "bg-red-500",
      hover: "hover:bg-red-50",
    },
  };

  const colors = sectionColors[seccion];

  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${colors.border}`}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
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
            <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate">
              {productoBase.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {productoBase.marca && (
                <span className="text-xs text-gray-500 truncate">
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
              className="sm:w-6 sm:h-6 text-gray-600 flex-shrink-0"
            />
          ) : (
            <ChevronDown
              size={20}
              className="sm:w-6 sm:h-6 text-gray-600 flex-shrink-0"
            />
          )}
        </div>
      </div>

      {/* Body - Variantes */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100"
          >
            <div className="divide-y divide-gray-100">
              {variantes.map(({ item, variante }) => (
                <div key={item.id} className="p-3 sm:p-4">
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
                        <p className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                          {variante.nombreCompleto}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {variante.tamano && (
                            <span className="text-xs text-gray-500">
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

                    {/* Controls - Ahora en fila completa para más espacio */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                      {/* Quantity Control */}
                      <div className="flex items-center gap-3">
                        {!item.repuesto && !item.sinStock && (
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() =>
                                actualizarCantidad(item.id, item.cantidad - 1)
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 active:bg-gray-300 font-bold text-lg transition-colors"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-bold text-base">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() =>
                                actualizarCantidad(item.id, item.cantidad + 1)
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-200 active:bg-gray-300 font-bold text-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                        )}

                        {(item.repuesto || item.sinStock) && (
                          <span className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm">
                            x{item.cantidad}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons - Más grandes y con mejor espaciado */}
                      <div className="flex items-center gap-2">
                        <IconButton
                          variant={item.repuesto ? "primary" : "ghost"}
                          onClick={() => {
                            marcarRepuesto(item.id, !item.repuesto);
                            // Haptic feedback (Android compatibles)
                            haptic(item.repuesto ? 50 : [30, 30, 30]);
                            if (!item.repuesto) {
                              toast.success(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  <CheckCircle className="text-emerald-500 w-5 h-5" />
                                  <span>Producto marcado como repuesto</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            } else {
                              toast(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  <RefreshCw className="text-cyan-500 w-5 h-5" />
                                  <span>Producto desmarcado como repuesto</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            }
                          }}
                          title={
                            item.repuesto
                              ? "Desmarcar repuesto"
                              : "Marcar como repuesto"
                          }
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          <CheckCircle size={20} className="sm:w-6 sm:h-6" />
                        </IconButton>

                        <IconButton
                          variant={item.sinStock ? "destructive" : "ghost"}
                          onClick={() => {
                            marcarSinStock(item.id, !item.sinStock);
                            // Haptic feedback (Android compatibles)
                            haptic(item.sinStock ? 50 : [30, 30, 30]);
                            if (!item.sinStock) {
                              toast.success(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  <Ban className="text-red-500 w-5 h-5" />
                                  <span>Producto marcado sin stock</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            } else {
                              toast(
                                <m.div
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.8, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="flex items-center gap-2"
                                >
                                  <RefreshCw className="text-cyan-500 w-5 h-5" />
                                  <span>Producto reactivado</span>
                                </m.div>,
                                { duration: 2000 }
                              );
                            }
                          }}
                          title={
                            item.sinStock
                              ? "Desmarcar sin stock"
                              : "Marcar como sin stock"
                          }
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          <XCircle size={20} className="sm:w-6 sm:h-6" />
                        </IconButton>

                        <IconButton
                          variant="ghost"
                          onClick={() => eliminarItem(item.id)}
                          title="Eliminar"
                          className="w-10 h-10 sm:w-11 sm:h-11"
                        >
                          <Trash2 size={18} className="sm:w-5 sm:h-5" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
