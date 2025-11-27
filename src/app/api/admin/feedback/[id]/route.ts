import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { FeedbackEstado, FeedbackPrioridad } from "@/types";

/**
 * GET /api/admin/feedback/[id]
 * Obtiene un reporte de feedback específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de feedback no válido" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("feedback_reportes");

    const reporte = await collection.findOne({ _id: new ObjectId(id) });

    if (!reporte) {
      return NextResponse.json(
        { success: false, error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    // Marcar como leído si no lo estaba
    if (!reporte.leidoEn) {
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { leidoEn: new Date() },
          $push: { 
            historial: { 
              fecha: new Date(), 
              mensaje: "Reporte marcado como leído" 
            } 
          } as never
        }
      );
    }

    return NextResponse.json({
      success: true,
      reporte,
    });
  } catch (error) {
    console.error("❌ Error al obtener feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener feedback",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/feedback/[id]
 * Actualiza un reporte de feedback
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de feedback no válido" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("feedback_reportes");

    // Verificar que existe
    const existente = await collection.findOne({ _id: new ObjectId(id) });
    if (!existente) {
      return NextResponse.json(
        { success: false, error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    const ahora = new Date();
    const updateFields: Record<string, unknown> = {
      actualizadoEn: ahora,
    };
    const historialEntries: Array<{ fecha: Date; mensaje: string }> = [];

    // Actualizar estado
    if (body.estado && body.estado !== existente.estado) {
      updateFields.estado = body.estado as FeedbackEstado;
      historialEntries.push({
        fecha: ahora,
        mensaje: `Estado cambiado de "${existente.estado}" a "${body.estado}"`,
      });

      // Si se marca como resuelto, registrar fecha
      if (body.estado === "Resuelto") {
        updateFields.resolvedAt = ahora;
      }
    }

    // Actualizar prioridad
    if (body.prioridad && body.prioridad !== existente.prioridad) {
      updateFields.prioridad = body.prioridad as FeedbackPrioridad;
      historialEntries.push({
        fecha: ahora,
        mensaje: `Prioridad cambiada de "${existente.prioridad}" a "${body.prioridad}"`,
      });
    }

    // Añadir respuesta al usuario
    if (body.respuesta) {
      updateFields.respuesta = body.respuesta;
      historialEntries.push({
        fecha: ahora,
        mensaje: "Se añadió respuesta al usuario",
      });
    }

    // Añadir nota interna
    if (body.nuevaNota) {
      const nuevaNota = {
        texto: body.nuevaNota.texto,
        fecha: ahora,
        autor: body.nuevaNota.autor || "Admin",
      };
      
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $push: { notas: nuevaNota } as never }
      );

      historialEntries.push({
        fecha: ahora,
        mensaje: `Nota interna añadida por ${nuevaNota.autor}`,
      });
    }

    // Aplicar actualizaciones
    if (historialEntries.length > 0) {
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: updateFields,
          $push: { historial: { $each: historialEntries } } as never
        }
      );
    } else if (Object.keys(updateFields).length > 1) {
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reporte actualizado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al actualizar feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al actualizar feedback",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feedback/[id]
 * Elimina un reporte de feedback
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de feedback no válido" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection("feedback_reportes");

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reporte eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar feedback",
      },
      { status: 500 }
    );
  }
}
