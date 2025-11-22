/**
 * Open/Closed Principle (OCP) - Implementación fallback manual
 * Liskov Substitution Principle (LSP) - Cumple contrato de INormalizer
 * Single Responsibility Principle (SRP) - Solo normaliza manualmente
 */

import { INormalizer } from "../interfaces/INormalizer";
import { DatosNormalizados, normalizarManualmente } from "@/services/normalizador";

export class ManualNormalizer implements INormalizer {
  public readonly priority = 10; // Baja prioridad (fallback)

  canHandle(rawData: any): boolean {
    // Siempre puede manejar datos (fallback universal)
    return true;
  }

  async normalize(rawData: any): Promise<DatosNormalizados | null> {
    try {
      console.log("📝 Normalizando manualmente (fallback)...");
      return normalizarManualmente(rawData);
    } catch (error) {
      console.error("❌ Error en normalización manual:", error);
      return null;
    }
  }
}
