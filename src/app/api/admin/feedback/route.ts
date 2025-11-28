import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { FeedbackEstado, FeedbackPrioridad, FeedbackTipo, FeedbackCategoria } from "@/types";

// Valid enum values for query parameter validation
const VALID_TIPOS: FeedbackTipo[] = ["Bug", "Mejora", "Pregunta", "Otro"];
const VALID_ESTADOS: FeedbackEstado[] = ["Pendiente", "En progreso", "Resuelto", "Descartado"];
const VALID_PRIORIDADES: FeedbackPrioridad[] = ["Baja", "Media", "Alta", "Critica"];
const VALID_CATEGORIAS: FeedbackCategoria[] = [
  "escaneo", "inventario", "vencimientos", "ui/ux", 
  "rendimiento", "otro", "seguridad", "notificaciones",
  "integraciones", "reportes", "configuracion"
];

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/admin/feedback
 * Obtiene todos los reportes de feedback con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extraer y validar filtros de query params
    const tipo = searchParams.get("tipo");
    const estado = searchParams.get("estado");
    const prioridad = searchParams.get("prioridad");
    const categoria = searchParams.get("categoria");
    const busqueda = searchParams.get("busqueda");
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Validate query parameters against valid enum values
    if (tipo && !VALID_TIPOS.includes(tipo as FeedbackTipo)) {
      return NextResponse.json(
        { success: false, error: "Tipo de feedback no válido" },
        { status: 400 }
      );
    }
    if (estado && !VALID_ESTADOS.includes(estado as FeedbackEstado)) {
      return NextResponse.json(
        { success: false, error: "Estado de feedback no válido" },
        { status: 400 }
      );
    }
    if (prioridad && !VALID_PRIORIDADES.includes(prioridad as FeedbackPrioridad)) {
      return NextResponse.json(
        { success: false, error: "Prioridad de feedback no válida" },
        { status: 400 }
      );
    }
    if (categoria && !VALID_CATEGORIAS.includes(categoria as FeedbackCategoria)) {
      return NextResponse.json(
        { success: false, error: "Categoría de feedback no válida" },
        { status: 400 }
      );
    }

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
      query.tipo = { $in: [tipo as FeedbackTipo] };
    }

    if (estado) {
      query.estado = estado as FeedbackEstado;
    }

    if (prioridad) {
      query.prioridad = prioridad as FeedbackPrioridad;
    }

    if (categoria) {
      query.categorias = { $in: [categoria] };
    }

    // Date handling with UTC normalization
    if (desde || hasta) {
      query.creadoAt = {};
      if (desde) {
        const desdeDate = new Date(desde);
        desdeDate.setUTCHours(0, 0, 0, 0); // Start of day UTC
        query.creadoAt.$gte = desdeDate;
      }
      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setUTCHours(23, 59, 59, 999); // End of day UTC
        query.creadoAt.$lte = hastaDate;
      }
    }

    // Search with ReDoS protection
    if (busqueda) {
      // Limit search string length
      const maxLength = 100;
      const sanitizedSearch = busqueda.slice(0, maxLength);
      // Escape special regex characters
      const escapedSearch = escapeRegex(sanitizedSearch);
      
      query.$or = [
        { titulo: { $regex: escapedSearch, $options: "i" } },
        { descripcion: { $regex: escapedSearch, $options: "i" } },
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
