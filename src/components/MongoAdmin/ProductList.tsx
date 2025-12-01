"use client";

import { ProductoBase } from "@/types";
import { Package, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ProductListItemProps {
  producto: ProductoBase & { variantesCount: number };
  onClick: () => void;
}

/**
 * Item de lista de producto con contador de variantes
 */
export function ProductListItem({ producto, onClick }: ProductListItemProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {producto.nombre}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
              {producto.marca && (
                <span className="truncate">{producto.marca}</span>
              )}
              {producto.marca && producto.categoria && (
                <span className="text-gray-400 dark:text-gray-500">•</span>
              )}
              {producto.categoria && (
                <span className="truncate">{producto.categoria}</span>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {producto.variantesCount} variante{producto.variantesCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      </div>
    </Card>
  );
}

interface ProductListProps {
  productos: (ProductoBase & { variantesCount: number })[];
  onSelectProduct: (producto: ProductoBase) => void;
}

/**
 * Lista de productos con navegación
 */
export function ProductList({ productos, onSelectProduct }: ProductListProps) {
  if (productos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
        <p>No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {productos.map((producto) => (
        <ProductListItem
          key={producto.id}
          producto={producto}
          onClick={() => onSelectProduct(producto)}
        />
      ))}
    </div>
  );
}
