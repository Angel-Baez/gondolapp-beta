"use client";

import { calcularDiasRestantes, formatearFecha } from "@/lib/utils";
import { useVencimientoStore } from "@/store/vencimiento";
import { ItemVencimiento, ProductoVariante } from "@/types";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import { Badge, IconButton } from "../ui";


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

  return (
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-3">
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
            <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
              {variante.nombreCompleto}
            </p>
            {variante.tamano && (
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
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

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="flex-shrink-0" />
              <span>{formatearFecha(item.fechaVencimiento)}</span>
            </div>

            {item.cantidad && (
              <span className="font-medium">Cantidad: {item.cantidad}</span>
            )}

            {item.lote && (
              <span className="text-gray-500">Lote: {item.lote}</span>
            )}
          </div>
        </div>

        {/* Actions - En fila completa */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <IconButton
            onClick={onEdit}
            title="Editar fecha"
            className="w-10 h-10 sm:w-11 sm:h-11"
          >
            <Edit2 size={18} className="sm:w-5 sm:h-5" />
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
  );
}
