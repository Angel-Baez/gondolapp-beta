import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { CrearFeedbackDTO, FeedbackReporte } from "@/types";
import { sanitizarTexto, validarEmail } from "@/lib/feedbackUtils";

/**
 * POST /api/feedback
 * Crea un nuevo reporte de feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body: CrearFeedbackDTO = await request.json();

    // Validaciones básicas
    if (!body.titulo || body.titulo.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "El título es obligatorio" },
        { status: 400 }
      );
    }

    if (body.titulo.length > 100) {
      return NextResponse.json(
        { success: false, error: "El título no puede exceder 100 caracteres" },
        { status: 400 }
      );
    }

    if (!body.descripcion || body.descripcion.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "La descripción es obligatoria" },
        { status: 400 }
      );
    }

    if (!body.tipo || body.tipo.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar al menos un tipo de feedback" },
        { status: 400 }
      );
    }

    if (!body.categorias || body.categorias.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar al menos una categoría" },
        { status: 400 }
      );
    }

    if (body.userEmail && !validarEmail(body.userEmail)) {
      return NextResponse.json(
        { success: false, error: "El formato del email no es válido" },
        { status: 400 }
      );
    }

    // Sanitizar campos de texto
    const tituloSanitizado = sanitizarTexto(body.titulo);
    const descripcionSanitizada = sanitizarTexto(body.descripcion);
    const emailSanitizado = body.userEmail ? sanitizarTexto(body.userEmail) : undefined;

    // Crear el documento de feedback
    const ahora = new Date();
    const nuevoFeedback: Omit<FeedbackReporte, "_id"> = {
      tipo: body.tipo,
      titulo: tituloSanitizado,
      descripcion: descripcionSanitizada,
      estado: "Pendiente",
      prioridad: body.prioridad || "Media",
      categorias: body.categorias,
      metadata: {
        navegador: body.metadata?.navegador || "Desconocido",
        dispositivo: body.metadata?.dispositivo || "Desconocido",
        versionApp: body.metadata?.versionApp || "1.0.0",
        url: body.metadata?.url || "",
        userAgent: body.metadata?.userAgent || "",
        sistemaOperativo: body.metadata?.sistemaOperativo,
        resolucionPantalla: body.metadata?.resolucionPantalla,
      },
      screenshots: body.screenshots || [],
      userEmail: emailSanitizado,
      userId: undefined,
      notas: [],
      respuesta: undefined,
      creadoAt: ahora,
      resolvedAt: undefined,
      actualizadoEn: ahora,
      leidoEn: undefined,
      historial: [
        {
          fecha: ahora,
          mensaje: `Reporte creado${emailSanitizado ? ` por ${emailSanitizado}` : " (anónimo)"}`,
        },
      ],
    };

    const db = await getDatabase();
    const collection = db.collection("feedback_reportes");

    // After line 98 in route.ts
    if (body.screenshots && Array.isArray(body.screenshots)) {
      for (const screenshot of body.screenshots) {
        // Base64 string length roughly equals 4/3 of original byte size
        const estimatedBytes = (screenshot.length * 3) / 4;
        const maxBytes = 5 * 1024 * 1024; // 5MB
        if (estimatedBytes > maxBytes) {
          return NextResponse.json(
          { success: false, error: "Screenshot exceeds 5MB limit" },
          { status: 400 }
        );
      }
    }
  }
    
    const result = await collection.insertOne(nuevoFeedback);

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, error: "Error al guardar el feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Feedback enviado correctamente",
      feedbackId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("❌ Error al crear feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al procesar el feedback",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * Obtiene estadísticas básicas de feedback (público)
 */
export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection("feedback_reportes");

    // Obtener conteos básicos
    const totalReportes = await collection.countDocuments();
    const pendientes = await collection.countDocuments({ estado: "Pendiente" });
    const resueltos = await collection.countDocuments({ estado: "Resuelto" });

    return NextResponse.json({
      success: true,
      stats: {
        total: totalReportes,
        pendientes,
        resueltos,
      },
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener estadísticas",
      },
      { status: 500 }
    );
  }
}
