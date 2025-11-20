"use client";

import { calcularDiasRestantes, formatearFecha } from "@/lib/utils";
import { useVencimientoStore } from "@/store/vencimiento";
import { ItemVencimiento, ProductoVariante } from "@/types";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { IconButton } from "../ui/Button";

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
    <div className="bg-white rounded-xl shadow-md p-4 mb-3">
      <div className="flex items-start justify-between gap-4">
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start gap-3">
            {variante.imagen && (
              <img
                src={variante.imagen}
                alt={variante.nombreCompleto}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="font-bold text-gray-900">
                {variante.nombreCompleto}
              </p>
              {variante.tamano && (
                <p className="text-sm text-gray-500">{variante.tamano}</p>
              )}
            </div>
          </div>

          {/* Alert Badge */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge alert={item.alertaNivel}>{getMensajeVencimiento()}</Badge>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar size={14} />
              <span>{formatearFecha(item.fechaVencimiento)}</span>
            </div>

            {item.cantidad && (
              <span className="text-sm text-gray-600">
                Cantidad: {item.cantidad}
              </span>
            )}

            {item.lote && (
              <span className="text-sm text-gray-500">Lote: {item.lote}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <IconButton onClick={onEdit} title="Editar fecha">
            <Edit2 size={18} />
          </IconButton>

          <IconButton
            variant="ghost"
            onClick={() => eliminarItem(item.id)}
            title="Eliminar"
          >
            <Trash2 size={18} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
