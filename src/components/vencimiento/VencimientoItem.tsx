"use client";

import { calcularDiasRestantes, formatearFecha } from "@/lib/utils";
import { useEliminarVencimientoItem, useRetirarVencimientoItem } from "@/hooks/useVencimiento";
import { ItemVencimientoConAlerta, ProductoVariante } from "@/types";
import { Calendar, Edit2, PackageCheck, Trash2 } from "lucide-react";
import { Badge, IconButton } from "../ui";
import { motion as m } from "framer-motion";
import { useHaptics } from "@/hooks/useHaptics";
import { toast } from "react-hot-toast";

interface VencimientoItemProps {
  item: ItemVencimientoConAlerta;
  variante: ProductoVariante;
  onEdit: () => void;
}

export function VencimientoItem({ item, variante, onEdit }: VencimientoItemProps) {
  const retirarItem = useRetirarVencimientoItem();
  const eliminarItem = useEliminarVencimientoItem();
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

  const handleRetirar = () => {
    haptic([30, 30, 30]);
    retirarItem.mutate(item.id, {
      onSuccess: () => toast.success("Producto retirado de la góndola"),
      onError: () => toast.error("Error al retirar el producto"),
    });
  };

  const handleEliminar = () => {
    haptic([50, 100, 50]);
    eliminarItem.mutate(item.id, {
      onSuccess: () => toast("Producto quitado de la lista", { icon: "🗑️" }),
    });
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl shadow-md p-3 sm:p-4 transition-colors">
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

        <div className="space-y-2">
          <Badge alert={item.alertaNivel} className="text-xs sm:text-sm">
            {getMensajeVencimiento()}
          </Badge>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="flex-shrink-0" />
              <span>{formatearFecha(item.fechaVencimiento)}</span>
            </div>

            {item.cantidad && <span className="font-medium">Cantidad: {item.cantidad}</span>}

            {item.lote && <span className="text-gray-500 dark:text-gray-400">Lote: {item.lote}</span>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
          <button
            onClick={handleRetirar}
            disabled={retirarItem.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            <PackageCheck size={16} />
            Retirar
          </button>

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

          <IconButton
            variant="ghost"
            onClick={handleEliminar}
            title="Quitar de la lista (sin registrar retiro)"
            className="w-10 h-10 sm:w-11 sm:h-11"
          >
            <m.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
              whileTap={{ scale: 0.85 }}
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5" />
            </m.div>
          </IconButton>
        </div>
      </div>
    </div>
  );
}
