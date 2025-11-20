"use client";

import { useReposicionStore } from "@/store/reposicion";
import { ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/Badge";
import { IconButton } from "../ui/Button";

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
        className={`p-4 flex items-center justify-between cursor-pointer ${colors.hover} transition`}
      >
        <div className="flex items-center gap-3 flex-1">
          {productoBase.imagen && (
            <img
              src={productoBase.imagen}
              alt={productoBase.nombre}
              className="w-12 h-12 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">
              {productoBase.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {productoBase.marca && (
                <span className="text-xs text-gray-500">
                  {productoBase.marca}
                </span>
              )}
              <Badge variant="primary">{variantes.length} variantes</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {cantidadTotal > 0 && (
            <div
              className={`px-3 py-1 ${colors.badge} text-white rounded-lg font-bold`}
            >
              x{cantidadTotal}
            </div>
          )}
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
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
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {variante.nombreCompleto}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
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

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      {/* Quantity Control */}
                      {!item.repuesto && !item.sinStock && (
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() =>
                              actualizarCantidad(item.id, item.cantidad - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 font-bold"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-bold">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() =>
                              actualizarCantidad(item.id, item.cantidad + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {item.repuesto || item.sinStock ? (
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg font-bold">
                          x{item.cantidad}
                        </span>
                      ) : null}

                      {/* Action Buttons */}
                      <IconButton
                        variant={item.repuesto ? "primary" : "ghost"}
                        onClick={() => marcarRepuesto(item.id, !item.repuesto)}
                        title={
                          item.repuesto
                            ? "Desmarcar repuesto"
                            : "Marcar como repuesto"
                        }
                      >
                        <CheckCircle size={20} />
                      </IconButton>

                      <IconButton
                        variant={item.sinStock ? "destructive" : "ghost"}
                        onClick={() => marcarSinStock(item.id, !item.sinStock)}
                        title={
                          item.sinStock
                            ? "Desmarcar sin stock"
                            : "Marcar como sin stock"
                        }
                      >
                        <XCircle size={20} />
                      </IconButton>

                      <IconButton
                        variant="ghost"
                        onClick={() => eliminarItem(item.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </IconButton>
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
