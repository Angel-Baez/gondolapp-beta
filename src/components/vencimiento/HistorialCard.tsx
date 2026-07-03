"use client";

import { Badge } from "@/components/ui";
import { AlertaNivel, ItemVencimientoHistorial } from "@/types";
import { Calendar, PackageCheck } from "lucide-react";

const ETIQUETAS_ALERTA: Record<AlertaNivel, string> = {
  vencido: "Retirado vencido",
  critico: "Retirado crítico",
  advertencia: "Retirado con advertencia",
  precaucion: "Retirado con precaución",
  normal: "Retirado a tiempo",
};

export function HistorialCard({ item }: { item: ItemVencimientoHistorial }) {
  const formatearFecha = (fecha: Date) =>
    new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(fecha));

  return (
    <div className="island p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-headline text-fg">
            {item.productoNombre}
            {item.productoMarca && (
              <span className="text-fg-secondary font-normal ml-1">({item.productoMarca})</span>
            )}
          </p>
          <p className="text-footnote text-fg-secondary mt-0.5">{item.varianteNombre}</p>
        </div>
        <Badge alert={item.nivelAlertaAlRetirar}>{ETIQUETAS_ALERTA[item.nivelAlertaAlRetirar]}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-border text-footnote text-fg-secondary">
        <div className="flex items-center gap-1">
          <Calendar size={14} className="flex-shrink-0" />
          <span>Vencía: {formatearFecha(item.fechaVencimiento)}</span>
        </div>
        <div className="flex items-center gap-1">
          <PackageCheck size={14} className="flex-shrink-0" />
          <span>Retirado: {formatearFecha(item.fechaRetiro)}</span>
        </div>
        {item.cantidad && <span>Cantidad: {item.cantidad}</span>}
        {item.lote && <span>Lote: {item.lote}</span>}
      </div>
    </div>
  );
}
