/**
 * Normalización con IA (Google Gemini) - FUENTE PRINCIPAL
 * Detecta marcas, sub-marcas y líneas comerciales inteligentemente
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { DatosNormalizados } from "./normalizador";

const SYSTEM_PROMPT = `
Eres un experto en inventario y productos de supermercado dominicano (retail). Tu única tarea es analizar datos crudos y devolver un objeto JSON perfectamente estructurado.

INSTRUCCIONES CRÍTICAS PARA LA RESPUESTA (SIEMPRE CUMPLIR):
1. FORMATO: Responde SIEMPRE y ÚNICAMENTE con el objeto JSON puro (sin comillas, sin markdown \`\`\`json, sin texto extra).
2. MARCA: Detecta la MARCA real (fabricante/propietario) priorizando el conocimiento local: Rica, Milex, Nestlé, Coca-Cola, Country Club, Abbott, Similac.
   - Si 'brands' es ambiguo (ej: 'Arla' para 'Milex Kinder'), usa la marca comercial principal ('Milex').
3. NOMBRE BASE: Es la LÍNEA COMERCIAL o SUB-MARCA (ej: Listamilk, Kinder Gold, Cereal Integral, Similac).
   - El Nombre Base debe ser conciso y no contener la marca ni el tamaño.
   - Si no existe sub-marca (ej: "Yogurt Natural Danone"), el nombreBase debe ser "Yogurt".
   - IMPORTANTE: Incluso si los datos son mínimos, DEBES inferir un nombreBase razonable basado en el product_name.
4. NOMBRE VARIANTE: Versión específica + TAMAÑO.
   - DEBE incluir el volumen y unidad SIEMPRE que se encuentre o se infiera.
   - EJEMPLO: "Sin Lactosa 1L", "Zero 500ML", "Fresa 125G".
   
5. VOLUMEN y UNIDAD: Extrae valor numérico y unidad.
   - UNIDAD debe ser siempre en MAYÚSCULAS (L, ML, G, KG).
   - Si no se detecta volumen, usa null/null.
6. CATEGORÍA: Nombre genérico en español (Leche, Refresco, Yogurt, Pasta, Aceite, Fórmula Infantil).
7. TIPO y SABOR: Rellena estas claves solo si aplican (ej: Tipo: 'Sin Lactosa', Sabor: 'Fresa').
8. NUNCA DEVUELVAS RESPUESTA VACÍA: Incluso con datos mínimos, genera un JSON válido con valores inferidos.

ESTRUCTURA JSON REQUERIDA:
{
  "marca": string,
  "nombreBase": string,
  "nombreVariante": string,
  "categoria": string,
  "variante": {
    "volumen": number | null,
    "unidad": "L" | "ML" | "G" | "KG" | null,
    "tipo": string, // opcional
    "sabor": string // opcional
  }
}

EJEMPLO DE ENTRADA/SALIDA (REFERENCIA CRÍTICA):

Entrada: {
  "product_name": "Leche UHT Rica Listamilk Sin Lactosa 1L",
  "brands": "Rica",
  "quantity": "1L"
}
Salida:
{
  "marca": "Rica",
  "nombreBase": "Listamilk",
  "nombreVariante": "Listamilk Sin Lactosa 1L",
  "categoria": "Leche",
  "variante": {
    "volumen": 1,
    "unidad": "L",
    "tipo": "Sin Lactosa"
  }
}

Entrada: {
  "product_name": "Milex kinder gold",
  "brands": "Arla",
  "quantity": "900g"
}
Salida:
{
  "marca": "Milex",
  "nombreBase": "Kinder Gold",
  "nombreVariante": "Kinder Gold 900G",
  "categoria": "Leche en Polvo",
  "variante": {
    "volumen": 900,
    "unidad": "G",
    "tipo": "Gold"
  }
}

Entrada: {
  "product_name": "Yogurt Danone Fresa",
  "brands": "Danone"
}
Salida:
{
  "marca": "Danone",
  "nombreBase": "Yogurt",
  "nombreVariante": "Yogurt Fresa",
  "categoria": "Yogurt",
  "variante": {
    "volumen": null,
    "unidad": null,
    "sabor": "Fresa"
  }
}

Entrada: {
  "product_name": "similac",
  "brands": "Abbott",
  "quantity": null
}
Salida:
{
  "marca": "Abbott",
  "nombreBase": "Similac",
  "nombreVariante": "Similac",
  "categoria": "Fórmula Infantil",
  "variante": {
    "volumen": null,
    "unidad": null,
    "tipo": "Original"
  }
}
`;

/**
 * Normaliza producto usando Gemini IA
 */
export async function normalizarConIA(
  rawProductOFF: any
): Promise<DatosNormalizados | null> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY no configurada");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY
    );

    // Usar gemini-2.5-flash que está disponible en tu API Key
    // Verificado con: curl "https://generativelanguage.googleapis.com/v1/models?key=..."
    const MODEL_ID = process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.5-flash";

    const model = genAI.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        temperature: 0.3, // Creatividad moderada para inferir datos faltantes
        maxOutputTokens: 2048, // Aumentado para respuestas completas
        topP: 0.8,
        topK: 40,
      },
    });

    // Preparar datos para IA (incluir más campos para extraer tamaño/volumen)
    const product = rawProductOFF.product || {};

    const inputLimpio = {
      product_name: product.product_name || "Producto sin nombre",
      brands: product.brands || "Genérico",
      quantity: product.quantity || product.product_quantity || null,
      serving_size: product.serving_size || null, // Tamaño de porción
      net_weight: product.product_quantity || null, // Peso neto
      categories: product.categories_tags?.slice(0, 3) || [],
      generic_name: product.generic_name || null,
      ingredients_text:
        product.ingredients_text_es || product.ingredients_text || null,
    };

    // Validar que tengamos al menos algo de información
    if (!inputLimpio.product_name && !inputLimpio.brands) {
      console.error(
        "❌ Datos insuficientes para normalización IA:",
        inputLimpio
      );
      return null;
    }

    console.log("📥 Input para IA:", inputLimpio);

    console.log(`🤖 Consultando IA (modelo: ${MODEL_ID})...`);
    const startTime = Date.now();

    const result = await model.generateContent([
      {
        text: `${SYSTEM_PROMPT}

Ahora normaliza este producto específico y devuelve SOLO el JSON:

${JSON.stringify(inputLimpio, null, 2)}`,
      },
    ]);

    const response = result.response;
    const text = response.text();

    console.log(`✅ IA respondió en ${Date.now() - startTime}ms`);
    console.log("📝 Respuesta cruda:", text);

    // Validar que la respuesta no esté vacía
    if (!text || text.trim().length === 0) {
      console.error("❌ La IA devolvió una respuesta vacía");
      console.error("🔍 Input enviado:", JSON.stringify(inputLimpio, null, 2));
      console.error(
        `💡 Sugerencia: Cambia NEXT_PUBLIC_GEMINI_MODEL a "gemini-pro" en .env.local`
      );
      return null;
    }

    // Intento robusto de parseo JSON: la IA a veces envuelve en texto o markdown
    let datosIA: any = null;
    try {
      datosIA = JSON.parse(text);
    } catch (err) {
      // Intentar extraer JSON desde bloques markdown ```json...```
      const markdownMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        try {
          datosIA = JSON.parse(markdownMatch[1]);
        } catch (err2) {
          console.error("❌ Error parseando JSON desde markdown:", err2);
        }
      }

      // Último intento: buscar cualquier objeto JSON en el texto y completarlo si está truncado
      if (!datosIA) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonText = jsonMatch[0];

          // Si el JSON está truncado, intentar completarlo
          if (!jsonText.trim().endsWith("}")) {
            console.warn("⚠️ JSON truncado detectado, intentando completar...");
            // Contar llaves abiertas vs cerradas
            const openBraces = (jsonText.match(/\{/g) || []).length;
            const closeBraces = (jsonText.match(/\}/g) || []).length;
            const missing = openBraces - closeBraces;

            // Agregar las llaves faltantes
            for (let i = 0; i < missing; i++) {
              jsonText += "}";
            }
          }

          try {
            datosIA = JSON.parse(jsonText);
          } catch (err2) {
            console.error("❌ Error parseando JSON desde texto:", err2);
          }
        }
      }

      if (!datosIA) {
        console.error("❌ No se pudo extraer JSON de la respuesta de IA");
        console.error("Respuesta completa:", text);
        console.error("Input enviado:", JSON.stringify(inputLimpio, null, 2));
        return null;
      }
    }

    console.log("📊 Datos parseados:", datosIA); // Validar estructura
    if (!datosIA.marca || !datosIA.nombreBase || !datosIA.nombreVariante) {
      console.error("❌ IA devolvió datos incompletos:", datosIA);
      console.error("💡 Campos requeridos: marca, nombreBase, nombreVariante");
      return null;
    }

    // Validar que variante tenga la estructura mínima
    if (!datosIA.variante) {
      console.warn("⚠️ Variante no definida, usando valores por defecto");
      datosIA.variante = {
        volumen: null,
        unidad: null,
      };
    }

    // Retornar con estructura completa
    return {
      marca: datosIA.marca,
      nombreBase: datosIA.nombreBase,
      nombreVariante: datosIA.nombreVariante,
      categoria: datosIA.categoria || "Sin categoría",
      imagen:
        rawProductOFF.product?.image_front_url ||
        rawProductOFF.product?.image_url,
      variante: {
        volumen: datosIA.variante?.volumen,
        unidad: datosIA.variante?.unidad,
        tipo: datosIA.variante?.tipo,
        sabor: datosIA.variante?.sabor,
      },
      raw: rawProductOFF,
    };
  } catch (error: any) {
    console.error("❌ Error en normalización IA:", error.message);
    return null;
  }
}
