"use client";

import { ProductoVariante } from "@/types";
import { Edit, Trash2, ArrowRightLeft, Barcode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface VariantListItemProps {
  variante: ProductoVariante;
  onEdit: () => void;
  onReassign: () => void;
  onDelete: () => void;
}

/**
 * Item individual de variante con acciones
 */
function VariantListItem({
  variante,
  onEdit,
  onReassign,
  onDelete,
}: VariantListItemProps) {
  const handleDelete = () => {
    if (confirm("¿Estás seguro de que deseas eliminar esta variante?")) {
      onDelete();
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">
            {variante.nombreCompleto}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
            <Barcode className="w-3 h-3" />
            <span className="font-mono">{variante.codigoBarras}</span>
          </div>
          {variante.tamano && (
            <div className="mt-1 text-xs text-gray-500">
              {variante.tipo && <span>{variante.tipo} • </span>}
              {variante.tamano}
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onEdit}
            className="!p-2"
            title="Editar variante"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            onClick={onReassign}
            className="!p-2"
            title="Reasignar a otro producto"
          >
            <ArrowRightLeft className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="!p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Eliminar variante"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface VariantListProps {
  variantes: ProductoVariante[];
  onEdit: (variante: ProductoVariante) => void;
  onReassign: (variante: ProductoVariante) => void;
  onDelete: (varianteId: string) => Promise<void>;
}

/**
 * Lista de variantes con acciones
 */
export function VariantList({
  variantes,
  onEdit,
  onReassign,
  onDelete,
}: VariantListProps) {
  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {variantes.map((variante) => (
        <VariantListItem
          key={variante.id}
          variante={variante}
          onEdit={() => onEdit(variante)}
          onReassign={() => onReassign(variante)}
          onDelete={() => onDelete(variante.id)}
        />
      ))}
    </div>
  );
}
