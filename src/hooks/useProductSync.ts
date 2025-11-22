import { useState } from "react";
import { db } from "@/lib/db";

/**
 * Hook personalizado para manejar la sincronización de productos con IndexedDB
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de sincronizar productos
 * - DIP: Abstrae operaciones de IndexedDB
 */
export function useProductSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncProductToIndexedDB = async (producto: any): Promise<boolean> => {
    setSyncing(true);
    setError(null);

    try {
      // Verificar existencia de ambos registros en paralelo
      const [baseExistente, varianteExistente] = await Promise.all([
        db.productosBase.get(producto.base.id),
        db.productosVariantes.get(producto.variante.id),
      ]);

      // Preparar operaciones de inserción
      const insertOperations = [];

      // Sincronizar ProductoBase con IndexedDB si no existe
      if (!baseExistente) {
        insertOperations.push(
          db.productosBase.add({
            id: producto.base.id,
            nombre: producto.base.nombre,
            marca: producto.base.marca,
            categoria: producto.base.categoria,
            imagen: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
        console.log("✅ ProductoBase preparado para sincronizar");
      }

      // Sincronizar ProductoVariante con IndexedDB si no existe
      if (!varianteExistente) {
        insertOperations.push(
          db.productosVariantes.add({
            id: producto.variante.id,
            productoBaseId: producto.base.id,
            codigoBarras: producto.variante.ean,
            nombreCompleto: producto.variante.nombreCompleto,
            tipo: producto.variante.tipo,
            tamano: producto.variante.tamano,
            sabor: undefined,
            unidadMedida: undefined,
            imagen: undefined,
            createdAt: new Date(),
          })
        );
        console.log("✅ ProductoVariante preparado para sincronizar");
      }

      // Ejecutar todas las inserciones en paralelo
      if (insertOperations.length > 0) {
        await Promise.all(insertOperations);
        console.log("✅ Sincronización con IndexedDB completada");
      }

      setSyncing(false);
      return true;
    } catch (err) {
      console.error("❌ Error al sincronizar con IndexedDB:", err);
      setError(
        "Error al sincronizar con el almacenamiento local. Por favor, recarga la página."
      );
      setSyncing(false);
      return false;
    }
  };

  return { syncProductToIndexedDB, syncing, error };
}
