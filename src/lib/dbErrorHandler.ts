import { db } from "./db";
import toast from "react-hot-toast";

/**
 * Wrapper for IndexedDB error handling with storage management
 */

// Storage quota threshold (warn at 80% usage)
const STORAGE_WARNING_THRESHOLD = 0.8;

// Maximum age for old data cleanup (90 days)
const MAX_DATA_AGE_DAYS = 90;

/**
 * Storage quota information
 */
export interface StorageQuotaInfo {
  used: number;
  total: number;
  percentage: number;
}

/**
 * Check available storage quota
 * @returns Storage info or null if API not supported
 */
export async function checkStorageQuota(): Promise<StorageQuotaInfo | null> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 0;
      const percentage = total > 0 ? used / total : 0;
      
      return { used, total, percentage };
    } catch (error) {
      console.error("[DB] Error checking storage quota:", error);
      return null;
    }
  }
  return null;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Check if storage is running low and show warning
 */
export async function checkStorageWarning(): Promise<boolean> {
  const quota = await checkStorageQuota();
  
  if (quota && quota.percentage > STORAGE_WARNING_THRESHOLD) {
    const usedMB = formatBytes(quota.used);
    const totalMB = formatBytes(quota.total);
    const percentUsed = Math.round(quota.percentage * 100);
    
    toast(
      `⚠️ Almacenamiento al ${percentUsed}% (${usedMB} / ${totalMB}). Considera limpiar datos antiguos.`,
      {
        duration: 5000,
        style: {
          background: "#FEF3C7",
          color: "#92400E",
        },
      }
    );
    return true;
  }
  return false;
}

/**
 * Handle QuotaExceededError by cleaning up old data
 */
export async function handleQuotaExceeded(): Promise<boolean> {
  console.log("[DB] Handling QuotaExceededError - cleaning up old data...");
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_DATA_AGE_DAYS);
    
    // Count items to be deleted
    let deletedCount = 0;
    
    // Clean old reposicion items that have been marked as repuesto (restocked)
    const oldReposicionItems = await db.itemsReposicion
      .filter((item) => 
        item.repuesto === true && 
        new Date(item.actualizadoAt || item.agregadoAt) < cutoffDate
      )
      .toArray();
    
    for (const item of oldReposicionItems) {
      await db.itemsReposicion.delete(item.id);
      deletedCount++;
    }
    
    // Clean old vencimiento items that have passed their expiration date by 30+ days
    const expiredCutoff = new Date();
    expiredCutoff.setDate(expiredCutoff.getDate() - 30);
    
    const oldVencimientoItems = await db.itemsVencimiento
      .filter((item) => new Date(item.fechaVencimiento) < expiredCutoff)
      .toArray();
    
    for (const item of oldVencimientoItems) {
      await db.itemsVencimiento.delete(item.id);
      deletedCount++;
    }
    
    // Clean old historical lists
    const oldHistorialItems = await db.listasHistorial
      .filter((item) => new Date(item.fechaGuardado) < cutoffDate)
      .toArray();
    
    for (const item of oldHistorialItems) {
      await db.listasHistorial.delete(item.id);
      deletedCount++;
    }
    
    if (deletedCount > 0) {
      console.log(`[DB] Cleaned up ${deletedCount} old items`);
      toast.success(`Se limpiaron ${deletedCount} registros antiguos`, {
        duration: 3000,
      });
    }
    
    return deletedCount > 0;
  } catch (error) {
    console.error("[DB] Error during cleanup:", error);
    return false;
  }
}

/**
 * Wrapper function to execute DB operations with error handling
 * @param operation The database operation to execute
 * @param errorMessage Custom error message to show on failure
 */
export async function withDBErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage = "Error en la base de datos"
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: unknown) {
    console.error("[DB] Operation failed:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      const errorName = error.name;
      
      // QuotaExceededError
      if (
        errorName === "QuotaExceededError" ||
        (typeof error.message === "string" &&
          (error.message.toLowerCase().includes("quota exceeded") ||
            error.message.toLowerCase().includes("storage full")))
      ) {
        toast.error("Almacenamiento lleno. Limpiando datos antiguos...", {
          duration: 3000,
        });
        
        const cleaned = await handleQuotaExceeded();
        
        if (cleaned) {
          // Retry operation after cleanup
          try {
            return await operation();
          } catch (retryError) {
            console.error("[DB] Retry after cleanup failed:", retryError);
            toast.error(
              "No hay suficiente espacio. Por favor, borra algunos datos manualmente.",
              { duration: 5000 }
            );
            return null;
          }
        } else {
          toast.error(
            "No se pudo liberar espacio. Intenta borrar datos manualmente.",
            { duration: 5000 }
          );
          return null;
        }
      }
      
      // Database closed/blocked
      if (
        errorName === "DatabaseClosedError" ||
        errorName === "InvalidStateError"
      ) {
        toast.error("Base de datos no disponible. Recarga la página.", {
          duration: 4000,
        });
        return null;
      }
      
      // Version change error - notify user to reload
      if (errorName === "VersionError") {
        toast.error(
          "Actualización de base de datos detectada. Por favor, recarga la página.",
          { duration: 5000 }
        );
        return null;
      }
      
      // Constraint error (duplicate key, etc)
      if (errorName === "ConstraintError") {
        toast.error("Este registro ya existe", { duration: 3000 });
        return null;
      }
    }
    
    // Generic error
    toast.error(errorMessage, { duration: 3000 });
    return null;
  }
}

/**
 * Request persistent storage to prevent data loss
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if ("storage" in navigator && "persist" in navigator.storage) {
    try {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        console.log("[DB] Storage will not be cleared automatically");
      } else {
        console.log("[DB] Storage may be cleared by the browser");
      }
      return isPersisted;
    } catch (error) {
      console.error("[DB] Error requesting persistent storage:", error);
      return false;
    }
  }
  return false;
}

/**
 * Check if storage is persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
  if ("storage" in navigator && "persisted" in navigator.storage) {
    return await navigator.storage.persisted();
  }
  return false;
}

/**
 * Initialize storage management (call on app startup)
 * @returns A cleanup function to clear intervals - MUST be called in useEffect cleanup
 * @example
 * useEffect(() => {
 *   const cleanup = initializeStorageManagement();
 *   return () => { cleanup.then(fn => fn()); };
 * }, []);
 */
export async function initializeStorageManagement(): Promise<() => void> {
  // Request persistent storage
  await requestPersistentStorage();
  
  // Check storage quota
  await checkStorageWarning();
  
  // Check periodically (every 10 minutes)
  const intervalId = setInterval(async () => {
    await checkStorageWarning();
  }, 10 * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Get database statistics
 */
export interface DatabaseStats {
  productosBase: number;
  productosVariantes: number;
  itemsReposicion: number;
  itemsVencimiento: number;
  listasHistorial: number;
  total: number;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const [
    productosBase,
    productosVariantes,
    itemsReposicion,
    itemsVencimiento,
    listasHistorial,
  ] = await Promise.all([
    db.productosBase.count(),
    db.productosVariantes.count(),
    db.itemsReposicion.count(),
    db.itemsVencimiento.count(),
    db.listasHistorial.count(),
  ]);
  
  return {
    productosBase,
    productosVariantes,
    itemsReposicion,
    itemsVencimiento,
    listasHistorial,
    total:
      productosBase +
      productosVariantes +
      itemsReposicion +
      itemsVencimiento +
      listasHistorial,
  };
}

/**
 * Clear all data from the database (use with caution!)
 */
export async function clearAllData(): Promise<boolean> {
  try {
    await Promise.all([
      db.productosBase.clear(),
      db.productosVariantes.clear(),
      db.itemsReposicion.clear(),
      db.itemsVencimiento.clear(),
      db.listasHistorial.clear(),
    ]);
    
    toast.success("Todos los datos han sido eliminados", { duration: 3000 });
    return true;
  } catch (error) {
    console.error("[DB] Error clearing database:", error);
    toast.error("Error al limpiar la base de datos", { duration: 3000 });
    return false;
  }
}
