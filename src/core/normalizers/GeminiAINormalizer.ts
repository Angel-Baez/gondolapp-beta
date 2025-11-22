/**
 * Open/Closed Principle (OCP) - Implementación específica para IA Gemini
 * Liskov Substitution Principle (LSP) - Cumple contrato de INormalizer
 * Single Responsibility Principle (SRP) - Solo normaliza usando IA
 */

import { INormalizer } from "../interfaces/INormalizer";
import { DatosNormalizados } from "@/services/normalizador";
import { normalizarConIA } from "@/services/normalizadorIA";

export class GeminiAINormalizer implements INormalizer {
  public readonly priority = 100; // Máxima prioridad

  canHandle(rawData: any): boolean {
    // Solo puede manejar si hay API key configurada
    return !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }

  async normalize(rawData: any): Promise<DatosNormalizados | null> {
    try {
      console.log("🤖 Normalizando con IA (Gemini)...");
      return await normalizarConIA(rawData);
    } catch (error) {
      console.error("❌ Error en normalización con IA:", error);
      return null;
    }
  }
}
