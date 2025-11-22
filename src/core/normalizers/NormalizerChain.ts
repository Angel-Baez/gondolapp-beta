/**
 * Chain of Responsibility Pattern
 * Open/Closed Principle (OCP) - Nuevos normalizadores sin modificar cadena
 * Single Responsibility Principle (SRP) - Solo gestiona la cadena de normalizadores
 */

import { INormalizer, INormalizerChain } from "../interfaces/INormalizer";
import { DatosNormalizados } from "@/services/normalizador";

export class NormalizerChain implements INormalizerChain {
  private normalizers: INormalizer[] = [];

  addNormalizer(normalizer: INormalizer): void {
    this.normalizers.push(normalizer);
    // Ordenar por prioridad (mayor a menor)
    this.normalizers.sort((a, b) => b.priority - a.priority);
  }

  async normalize(rawData: any): Promise<DatosNormalizados | null> {
    console.log(`🔗 Ejecutando cadena de normalizadores (${this.normalizers.length} disponibles)`);

    for (const normalizer of this.normalizers) {
      if (normalizer.canHandle(rawData)) {
        console.log(`✓ Intentando con ${normalizer.constructor.name} (prioridad: ${normalizer.priority})`);
        
        const result = await normalizer.normalize(rawData);
        
        if (result) {
          console.log(`✅ Normalización exitosa con ${normalizer.constructor.name}`);
          return result;
        }
        
        console.log(`⚠️ ${normalizer.constructor.name} no pudo normalizar, continuando...`);
      }
    }

    console.error("❌ Ningún normalizador pudo procesar los datos");
    return null;
  }

  /**
   * Obtiene la lista de normalizadores registrados
   */
  getNormalizers(): ReadonlyArray<INormalizer> {
    return [...this.normalizers];
  }
}
