"use client";

import { db } from "@/lib/db";
import { useVencimientoStore } from "@/store/vencimiento";
import { ItemVencimiento, ProductoVariante } from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { VencimientoItem } from "./VencimientoItem";

interface ItemConVariante {
  item: ItemVencimiento;
  variante: ProductoVariante;
}

export function VencimientoList() {
  const { items, cargarItems, actualizarFecha, recalcularAlertas } =
    useVencimientoStore();
  const [itemsConVariantes, setItemsConVariantes] = useState<ItemConVariante[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ItemVencimiento | null>(null);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    cargarItems();

    // Recalcular alertas diariamente
    const interval = setInterval(() => {
      recalcularAlertas();
    }, 1000 * 60 * 60 * 24); // 24 horas

    return () => clearInterval(interval);
  }, []);

  // Cargar variantes para cada item
  useEffect(() => {
    const cargarVariantes = async () => {
      setLoading(true);
      const itemsCompletos = await Promise.all(
        items.map(async (item) => {
          const variante = await db.productosVariantes.get(item.varianteId);
          if (!variante) return null;
          return { item, variante };
        })
      );

      setItemsConVariantes(
        itemsCompletos.filter((item) => item !== null) as ItemConVariante[]
      );
      setLoading(false);
    };

    if (items.length > 0) {
      cargarVariantes();
    } else {
      setLoading(false);
    }
  }, [items]);

  // Agrupar por nivel de alerta
  const itemsByAlertLevel = useMemo(() => {
    const grouped = {
      critico: [] as ItemConVariante[],
      advertencia: [] as ItemConVariante[],
      precaucion: [] as ItemConVariante[],
      normal: [] as ItemConVariante[],
    };

    itemsConVariantes.forEach((itemCompleto) => {
      grouped[itemCompleto.item.alertaNivel].push(itemCompleto);
    });

    return grouped;
  }, [itemsConVariantes]);

  const handleEditClick = (item: ItemVencimiento) => {
    setEditingItem(item);
    setNewDate(item.fechaVencimiento.toISOString().split("T")[0]);
  };

  const handleSaveDate = () => {
    if (editingItem && newDate) {
      actualizarFecha(editingItem.id, new Date(newDate));
      setEditingItem(null);
      setNewDate("");
    }
  };

  const totalItems = items.length;
  const itemsCriticos = itemsByAlertLevel.critico.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-secondary" />
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Clock size={64} className="mb-4 opacity-50" />
        <p className="text-lg font-semibold">
          No hay productos con vencimiento registrado
        </p>
        <p className="text-sm">
          Escanea productos para rastrear sus fechas de vencimiento
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            Control de Vencimientos
          </h2>
          <span className="px-3 py-1 bg-accent-primary text-white rounded-lg font-bold">
            {totalItems} productos
          </span>
        </div>

        {itemsCriticos > 0 && (
          <div className="flex items-center gap-2 p-3 bg-alert-critico/10 border-2 border-alert-critico rounded-xl">
            <AlertTriangle size={20} className="text-alert-critico" />
            <p className="text-sm font-semibold text-alert-critico">
              {itemsCriticos} producto{itemsCriticos > 1 ? "s" : ""} crítico
              {itemsCriticos > 1 ? "s" : ""} (vencido
              {itemsCriticos > 1 ? "s" : ""} o por vencer)
            </p>
          </div>
        )}
      </div>

      {/* Lista de Items */}
      <div className="space-y-2">
        {/* Críticos */}
        {itemsByAlertLevel.critico.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={20} className="text-alert-critico" />
              <h3 className="text-sm font-bold text-alert-critico uppercase tracking-wider">
                Críticos
              </h3>
            </div>
            {itemsByAlertLevel.critico.map(({ item, variante }) => (
              <VencimientoItem
                key={item.id}
                item={item}
                variante={variante}
                onEdit={() => handleEditClick(item)}
              />
            ))}
          </div>
        )}

        {/* Advertencia */}
        {itemsByAlertLevel.advertencia.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-alert-advertencia" />
              <h3 className="text-sm font-bold text-alert-advertencia uppercase tracking-wider">
                Advertencia (15-30 días)
              </h3>
            </div>
            {itemsByAlertLevel.advertencia.map(({ item, variante }) => (
              <VencimientoItem
                key={item.id}
                item={item}
                variante={variante}
                onEdit={() => handleEditClick(item)}
              />
            ))}
          </div>
        )}

        {/* Precaución */}
        {itemsByAlertLevel.precaucion.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={20} className="text-alert-precaucion" />
              <h3 className="text-sm font-bold text-alert-precaucion uppercase tracking-wider">
                Precaución (30-60 días)
              </h3>
            </div>
            {itemsByAlertLevel.precaucion.map(({ item, variante }) => (
              <VencimientoItem
                key={item.id}
                item={item}
                variante={variante}
                onEdit={() => handleEditClick(item)}
              />
            ))}
          </div>
        )}

        {/* Normal */}
        {itemsByAlertLevel.normal.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={20} className="text-gray-600" />
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                Normales (+60 días)
              </h3>
            </div>
            {itemsByAlertLevel.normal.map(({ item, variante }) => (
              <VencimientoItem
                key={item.id}
                item={item}
                variante={variante}
                onEdit={() => handleEditClick(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Actualizar Fecha de Vencimiento"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Actualiza la fecha de vencimiento para este producto.
          </p>

          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            label="Nueva fecha de vencimiento"
          />

          <Button onClick={handleSaveDate} className="w-full">
            Guardar Fecha
          </Button>
        </div>
      </Modal>
    </div>
  );
}
