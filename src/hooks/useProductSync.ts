import { useState } from "react";
import { ProductSyncService } from "@/services/ProductSyncService";
import { ProductoCompleto } from "@/services/productos";

/**
 * Hook personalizado para manejar la sincronización de productos con IndexedDB
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de gestionar estado de sincronización
 * - DIP: Delega a ProductSyncService (abstracción)
 * - DRY: Reutiliza lógica centralizada
 */
export function useProductSync() {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncProductToIndexedDB = async (producto: ProductoCompleto): Promise<boolean> => {
    setSyncing(true);
    setError(null);

    try {
      await ProductSyncService.syncProductToIndexedDB(producto);
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
