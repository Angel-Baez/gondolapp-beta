import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { FeedbackEstado, FeedbackPrioridad, FeedbackTipo } from "@/types";

/**
 * GET /api/admin/feedback
 * Obtiene todos los reportes de feedback con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer filtros de query params
    const tipo = searchParams.get("tipo") as FeedbackTipo | null;
    const estado = searchParams.get("estado") as FeedbackEstado | null;
    const prioridad = searchParams.get("prioridad") as FeedbackPrioridad | null;
    const categoria = searchParams.get("categoria");
    const busqueda = searchParams.get("busqueda");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const db = await getDatabase();
    const collection = db.collection("feedback_reportes");

    // Construir query con filtros
    interface QueryType {
      tipo?: { $in: FeedbackTipo[] };
      estado?: FeedbackEstado;
      prioridad?: FeedbackPrioridad;
      categorias?: { $in: string[] };
      creadoAt?: { $gte?: Date; $lte?: Date };
      $or?: Array<{ titulo?: { $regex: string; $options: string }; descripcion?: { $regex: string; $options: string } }>;
    }
    
    const query: QueryType = {};

    if (tipo) {
      query.tipo = { $in: [tipo] };
    }

    if (estado) {
      query.estado = estado;
    }

    if (prioridad) {
      query.prioridad = prioridad;
    }

    if (categoria) {
      query.categorias = { $in: [categoria] };
    }

    if (desde || hasta) {
      query.creadoAt = {};
      if (desde) query.creadoAt.$gte = new Date(desde);
      if (hasta) query.creadoAt.$lte = new Date(hasta);
    }

    if (busqueda) {
      query.$or = [
        { titulo: { $regex: busqueda, $options: "i" } },
        { descripcion: { $regex: busqueda, $options: "i" } },
      ];
    }

    // Obtener total para paginación
    const total = await collection.countDocuments(query);

    // Obtener reportes con paginación
    const reportes = await collection
      .find(query)
      .sort({ creadoAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Obtener estadísticas
    const stats = {
      total: await collection.countDocuments(),
      pendientes: await collection.countDocuments({ estado: "Pendiente" }),
      enProgreso: await collection.countDocuments({ estado: "En progreso" }),
      resueltos: await collection.countDocuments({ estado: "Resuelto" }),
      descartados: await collection.countDocuments({ estado: "Descartado" }),
      criticos: await collection.countDocuments({ prioridad: "Critica" }),
      altos: await collection.countDocuments({ prioridad: "Alta" }),
    };

    return NextResponse.json({
      success: true,
      reportes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("❌ Error al obtener feedbacks:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener feedbacks",
      },
      { status: 500 }
    );
  }
}
