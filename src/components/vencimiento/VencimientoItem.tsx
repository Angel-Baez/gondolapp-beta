"use client";

import { calcularDiasRestantes, formatearFecha } from "@/lib/utils";
import { useVencimientoStore } from "@/store/vencimiento";
import { ItemVencimiento, ProductoVariante } from "@/types";
import { Calendar, ChevronLeft, Edit2, Trash2 } from "lucide-react";
import { Badge, IconButton } from "../ui";
import { SwipeableCard, SwipeActions } from "../ui/SwipeableCard";
import { motion as m } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "react-hot-toast";

interface VencimientoItemProps {
  item: ItemVencimiento;
  variante: ProductoVariante;
  onEdit: () => void;
}

export function VencimientoItem({
  item,
  variante,
  onEdit,
}: VencimientoItemProps) {
  const { eliminarItem } = useVencimientoStore();
  const { haptic } = useHaptics();
  const diasRestantes = calcularDiasRestantes(item.fechaVencimiento);

  const getMensajeVencimiento = () => {
    if (diasRestantes < 0) {
      return `Venció hace ${Math.abs(diasRestantes)} días`;
    } else if (diasRestantes === 0) {
      return "¡Vence hoy!";
    } else if (diasRestantes === 1) {
      return "Vence mañana";
    } else {
      return `Vence en ${diasRestantes} días`;
    }
  };

  const handleDelete = () => {
    haptic([50, 100, 50]);
    eliminarItem(item.id);
    toast.error(
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2"
      >
        <m.div
          initial={{ y: 0 }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.4 }}
        >
          <Trash2 className="text-red-500 w-5 h-5" />
        </m.div>
        <span>Producto eliminado</span>
      </m.div>,
      { duration: 2000 }
    );
  };

  return (
    <SwipeableCard
      rightAction={SwipeActions.delete(handleDelete)}
      className="mb-3"
    >
      <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md p-3 sm:p-4 transition-colors">
        <div className="space-y-3">
          {/* Info Section */}
          <div className="flex items-start gap-3">
            {variante.imagen && (
              <img
                src={variante.imagen}
                alt={variante.nombreCompleto}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-tight">
                {variante.nombreCompleto}
              </p>
              {variante.tamano && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {variante.tamano}
                </p>
              )}
            </div>
          </div>

          {/* Alert Badge y Metadata */}
          <div className="space-y-2">
            <Badge alert={item.alertaNivel} className="text-xs sm:text-sm">
              {getMensajeVencimiento()}
            </Badge>

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar size={14} className="flex-shrink-0" />
                <span>{formatearFecha(item.fechaVencimiento)}</span>
              </div>

              {item.cantidad && (
                <span className="font-medium">Cantidad: {item.cantidad}</span>
              )}

              {item.lote && (
                <span className="text-gray-500 dark:text-gray-400">Lote: {item.lote}</span>
              )}
            </div>
          </div>

          {/* Actions - Edit button + swipe hint */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
            <IconButton
              onClick={() => {
                haptic(50);
                onEdit();
              }}
              title="Editar fecha"
              className="w-10 h-10 sm:w-11 sm:h-11"
            >
              <m.div
                whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Edit2 size={18} className="sm:w-5 sm:h-5" />
              </m.div>
            </IconButton>

            {/* Swipe Hint */}
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <ChevronLeft size={14} />
              <span>desliza para eliminar</span>
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
}
