import { useState } from "react";
import { dbService } from "@/lib/db";
import { ProductoVariante } from "@/types";

/**
 * Hook personalizado para manejar la verificación de productos en IndexedDB
 * 
 * ✅ SOLID Principles:
 * - SRP: Solo responsable de verificar existencia de productos
 * - DIP: Encapsula acceso a IndexedDB
 */
export function useProductVerification() {
  const [checking, setChecking] = useState(false);

  const checkExists = async (
    barcode: string
  ): Promise<{ exists: boolean; variante?: ProductoVariante }> => {
    setChecking(true);
    try {
      const variante = await dbService.getVarianteByBarcode(barcode);

      return { exists: !!variante, variante };
    } finally {
      setChecking(false);
    }
  };

  return { checkExists, checking };
}
