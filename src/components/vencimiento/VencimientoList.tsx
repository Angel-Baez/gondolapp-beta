"use client";

import { Button, Input, Modal } from "@/components/ui";
import { useProductosDeItems } from "@/hooks/useProductosDeItems";
import {
  useActualizarFechaVencimiento,
  useVencimientoItems,
} from "@/hooks/useVencimiento";
import { AlertaNivel, ItemVencimientoConAlerta, ProductoVariante } from "@/types";
import { motion as m } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Skull,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { VencimientoItem } from "./VencimientoItem";

interface ItemConVariante {
  item: ItemVencimientoConAlerta;
  variante: ProductoVariante;
}

const SECCIONES: Array<{
  nivel: AlertaNivel;
  titulo: string;
  icon: any;
  colorClass: string;
}> = [
  { nivel: "vencido", titulo: "Vencidos", icon: Skull, colorClass: "text-alert-vencido" },
  { nivel: "critico", titulo: "Críticos (0-15 días)", icon: AlertCircle, colorClass: "text-alert-critico" },
  { nivel: "advertencia", titulo: "Advertencia (15-30 días)", icon: AlertTriangle, colorClass: "text-alert-advertencia" },
  { nivel: "precaucion", titulo: "Precaución (30-60 días)", icon: Zap, colorClass: "text-alert-precaucion" },
  { nivel: "normal", titulo: "Normales (+60 días)", icon: CheckCircle2, colorClass: "text-gray-600 dark:text-gray-400" },
];

export function VencimientoList() {
  const { data: items = [], isLoading: loadingItems } = useVencimientoItems();
  const { data: productosPorVariante, isLoading: loadingProductos } = useProductosDeItems(
    items.map((i) => i.varianteId)
  );
  const actualizarFecha = useActualizarFechaVencimiento();

  const [editingItem, setEditingItem] = useState<ItemVencimientoConAlerta | null>(null);
  const [newDate, setNewDate] = useState("");

  const itemsConVariantes = useMemo<ItemConVariante[]>(() => {
    if (!productosPorVariante) return [];
    return items
      .map((item) => {
        const producto = productosPorVariante.get(item.varianteId);
        if (!producto) return null;
        return { item, variante: producto.variante };
      })
      .filter((v): v is ItemConVariante => v !== null);
  }, [items, productosPorVariante]);

  const itemsByAlertLevel = useMemo(() => {
    const grouped: Record<AlertaNivel, ItemConVariante[]> = {
      vencido: [],
      critico: [],
      advertencia: [],
      precaucion: [],
      normal: [],
    };
    itemsConVariantes.forEach((itemCompleto) => {
      grouped[itemCompleto.item.alertaNivel].push(itemCompleto);
    });
    return grouped;
  }, [itemsConVariantes]);

  const handleEditClick = (item: ItemVencimientoConAlerta) => {
    setEditingItem(item);
    setNewDate(item.fechaVencimiento.toISOString().split("T")[0]);
  };

  const handleSaveDate = async () => {
    if (editingItem && newDate) {
      await actualizarFecha.mutateAsync({
        id: editingItem.id,
        fechaVencimiento: new Date(newDate),
      });
      setEditingItem(null);
      setNewDate("");
    }
  };

  const totalItems = items.length;
  const itemsUrgentes = itemsByAlertLevel.vencido.length + itemsByAlertLevel.critico.length;
  const loading = loadingItems || (items.length > 0 && loadingProductos);

  if (loading) {
    return (
      <div className="space-y-4 py-10 px-4">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-secondary" />
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-gray-500 dark:text-gray-400">
        <m.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Clock size={48} className="mb-3 sm:mb-4 opacity-50 sm:w-16 sm:h-16" />
        </m.div>
        <p className="text-base sm:text-lg font-semibold text-center">
          No hay productos con vencimiento registrado
        </p>
        <p className="text-xs sm:text-sm text-center mt-1">
          Escanea productos para rastrear sus fechas de vencimiento
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
            Control de Vencimientos
          </h2>
          <span className="px-2.5 sm:px-3 py-1 bg-accent-primary text-white rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap">
            {totalItems} producto{totalItems !== 1 ? "s" : ""}
          </span>
        </div>

        {itemsUrgentes > 0 && (
          <div className="flex items-start gap-2 p-3 bg-alert-critico/10 dark:bg-alert-critico/20 border-2 border-alert-critico rounded-xl">
            <AlertTriangle size={18} className="text-alert-critico flex-shrink-0 mt-0.5 sm:w-5 sm:h-5" />
            <p className="text-xs sm:text-sm font-semibold text-alert-critico leading-tight">
              {itemsUrgentes} producto{itemsUrgentes > 1 ? "s" : ""} urgente
              {itemsUrgentes > 1 ? "s" : ""} (vencido{itemsUrgentes > 1 ? "s" : ""} o por vencer)
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        {SECCIONES.map(({ nivel, titulo, icon: Icon, colorClass }) => {
          const itemsSeccion = itemsByAlertLevel[nivel];
          if (itemsSeccion.length === 0) return null;

          return (
            <div key={nivel}>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Icon size={18} className={`${colorClass} flex-shrink-0 sm:w-5 sm:h-5`} />
                <h3 className={`text-xs sm:text-sm font-bold ${colorClass} uppercase tracking-wider`}>
                  {titulo}
                </h3>
              </div>
              {itemsSeccion.map(({ item, variante }) => (
                <VencimientoItem
                  key={item.id}
                  item={item}
                  variante={variante}
                  onEdit={() => handleEditClick(item)}
                />
              ))}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Actualizar Fecha de Vencimiento"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Actualiza la fecha de vencimiento para este producto.
          </p>

          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            label="Nueva fecha de vencimiento"
          />

          <Button onClick={handleSaveDate} disabled={actualizarFecha.isPending} className="w-full">
            {actualizarFecha.isPending ? "Guardando..." : "Guardar Fecha"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
