"use client";

import { calcularDiasRestantes, formatearFecha } from "@/lib/utils";
import { useEliminarVencimientoItem, useRetirarVencimientoItem } from "@/hooks/useVencimiento";
import { AlertaNivel, ItemVencimientoConAlerta, ProductoVariante } from "@/types";
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

// Clases literales (no interpoladas) para que el scanner de Tailwind las genere.
const RAIL_POR_ALERTA: Record<AlertaNivel, string> = {
  vencido: "border-l-alert-vencido",
  critico: "border-l-alert-critico",
  advertencia: "border-l-alert-advertencia",
  precaucion: "border-l-alert-precaucion",
  normal: "border-l-alert-normal",
};

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
    <div className={`island p-4 border-l-[3px] ${RAIL_POR_ALERTA[item.alertaNivel]}`}>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {variante.imagen && (
            <img
              src={variante.imagen}
              alt={variante.nombreCompleto}
              className="w-14 h-14 object-cover rounded-field flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-headline text-fg leading-tight">
              {variante.nombreCompleto}
            </p>
            {variante.tamano && (
              <p className="text-footnote text-fg-secondary mt-0.5 truncate">
                {variante.tamano}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Badge alert={item.alertaNivel} className="text-subhead">
            {getMensajeVencimiento()}
          </Badge>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-footnote text-fg-secondary">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="flex-shrink-0" />
              <span>{formatearFecha(item.fechaVencimiento)}</span>
            </div>

            {item.cantidad && <span className="font-medium">Cantidad: {item.cantidad}</span>}

            {item.lote && <span className="text-fg-secondary">Lote: {item.lote}</span>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <button
            onClick={handleRetirar}
            disabled={retirarItem.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-estado-repuesto disabled:opacity-50 text-white rounded-field font-semibold text-subhead transition-colors"
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
            className="w-11 h-11"
          >
            <m.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Edit2 size={18} />
            </m.div>
          </IconButton>

          <IconButton
            variant="ghost"
            onClick={handleEliminar}
            title="Quitar de la lista (sin registrar retiro)"
            className="w-11 h-11"
          >
            <m.div
              whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
              whileTap={{ scale: 0.85 }}
            >
              <Trash2 size={18} />
            </m.div>
          </IconButton>
        </div>
      </div>
    </div>
  );
}
