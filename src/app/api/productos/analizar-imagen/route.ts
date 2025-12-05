import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/productos/analizar-imagen
 *
 * Analyzes a product image using Gemini AI Vision and extracts product information
 * for auto-filling the manual product form.
 */

// Default confidence when AI doesn't provide one
const DEFAULT_CONFIDENCE = 0.5;

const IMAGE_ANALYSIS_PROMPT = `Eres un experto en productos de supermercado. Analiza esta imagen de un producto y extrae la información visible.

INSTRUCCIONES:
1. Observa cuidadosamente la imagen del producto
2. Extrae SOLO la información que puedas ver claramente en la imagen
3. Si no puedes ver algún campo, déjalo como string vacío ""
4. El campo "tamano" debe incluir el número y la unidad (ej: "500ml", "1L", "360g")

RESPONDE ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto adicional):

{
  "nombreBase": "nombre del producto (sin marca ni tamaño)",
  "marca": "marca del producto",
  "categoria": "categoría general (Bebidas, Lácteos, Snacks, Limpieza, etc.)",
  "tipo": "variante o tipo específico si aplica (Light, Sin Lactosa, Original, etc.)",
  "tamano": "tamaño con unidad (ej: 500ml, 1L, 360g)",
  "sabor": "sabor si aplica (Fresa, Vainilla, etc.)",
  "confianza": 0.0 a 1.0
}

Si la imagen no es de un producto o no puedes extraer información, responde:
{
  "nombreBase": "",
  "marca": "",
  "categoria": "",
  "tipo": "",
  "tamano": "",
  "sabor": "",
  "confianza": 0.0
}`;

interface AnalysisResult {
  nombreBase: string;
  marca: string;
  categoria: string;
  tipo: string;
  tamano: string;
  sabor: string;
  confianza: number;
}

export async function POST(request: NextRequest) {
  try {
    // Prefer server-side env var, fallback to NEXT_PUBLIC for backwards compatibility
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("⚠️ GEMINI_API_KEY no configurada");
      return NextResponse.json(
        { success: false, error: "Servicio de IA no disponible", code: "AI_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó imagen", code: "NO_IMAGE" },
        { status: 400 }
      );
    }

    // Validate mime type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const actualMimeType = mimeType || "image/jpeg";
    
    if (!validMimeTypes.includes(actualMimeType)) {
      return NextResponse.json(
        { success: false, error: "Formato de imagen no soportado", code: "INVALID_MIME_TYPE" },
        { status: 400 }
      );
    }

    console.log("📸 Analizando imagen de producto con IA...");
    const startTime = Date.now();

    const genAI = new GoogleGenerativeAI(apiKey);
    // Prefer server-side env var, fallback to NEXT_PUBLIC for backwards compatibility
    const modelId = process.env.GEMINI_MODEL || process.env.NEXT_PUBLIC_GEMINI_MODEL || "gemini-2.0-flash-exp";
    
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent extraction
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40,
      },
    });

    // Remove data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: actualMimeType,
          data: cleanBase64,
        },
      },
      { text: IMAGE_ANALYSIS_PROMPT },
    ]);

    const response = result.response;
    const text = response.text();

    const latency = Date.now() - startTime;
    console.log(`✅ IA respondió en ${latency}ms`);
    console.log("📝 Respuesta cruda:", text);

    if (!text || text.trim().length === 0) {
      console.error("❌ La IA devolvió una respuesta vacía");
      return NextResponse.json(
        { success: false, error: "Respuesta vacía de IA", code: "AI_EMPTY_RESPONSE" },
        { status: 502 }
      );
    }

    // Parse JSON response
    let analysisResult: AnalysisResult;
    try {
      // Clean potential markdown formatting
      let cleanJson = text.trim();
      
      // Remove markdown code blocks if present
      const markdownMatch = cleanJson.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownMatch) {
        cleanJson = markdownMatch[1];
      } else {
        // Try to find JSON object in text
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanJson = jsonMatch[0];
        }
      }
      
      analysisResult = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("❌ Error parseando respuesta de IA:", text);
      return NextResponse.json(
        { success: false, error: "Respuesta de IA mal formateada", code: "AI_PARSE_ERROR" },
        { status: 502 }
      );
    }

    // Validate required fields exist and ensure they are strings
    if (typeof analysisResult.nombreBase !== "string") {
      analysisResult.nombreBase = "";
    }
    if (typeof analysisResult.marca !== "string") {
      analysisResult.marca = "";
    }
    if (typeof analysisResult.categoria !== "string") {
      analysisResult.categoria = "";
    }
    if (typeof analysisResult.tipo !== "string") {
      analysisResult.tipo = "";
    }
    if (typeof analysisResult.tamano !== "string") {
      analysisResult.tamano = "";
    }
    if (typeof analysisResult.sabor !== "string") {
      analysisResult.sabor = "";
    }
    if (typeof analysisResult.confianza !== "number") {
      analysisResult.confianza = DEFAULT_CONFIDENCE;
    }

    console.log("📊 Datos extraídos:", analysisResult);
    console.log(
      JSON.stringify({
        type: "ai_image_analysis",
        latency,
        confidence: analysisResult.confianza,
        success: true,
      })
    );

    return NextResponse.json({
      success: true,
      data: analysisResult,
      metadata: {
        latency,
        model: modelId,
      },
    });
  } catch (error) {
    console.error("❌ Error en análisis de imagen:", error);
    
    // Handle specific Gemini API errors
    if (error instanceof Error) {
      if (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED")) {
        return NextResponse.json(
          { success: false, error: "Límite de IA excedido, intente en unos segundos", code: "AI_RATE_LIMIT" },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      
      if (error.message.includes("SAFETY")) {
        return NextResponse.json(
          { success: false, error: "La imagen no pudo ser analizada por restricciones de seguridad", code: "AI_SAFETY_BLOCK" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: "Error al analizar la imagen", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
