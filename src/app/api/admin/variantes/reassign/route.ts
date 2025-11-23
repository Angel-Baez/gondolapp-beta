import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { VariantReassignerService } from "@/core/admin/services/VariantReassignerService";
import { ServerSideProductRepository } from "@/core/repositories/ServerSideProductRepository";

/**
 * POST /api/admin/variantes/reassign
 * Reasigna una o varias variantes a otro producto base
 * 
 * Body: {
 *   varianteId?: string,       // Para reasignar una sola
 *   varianteIds?: string[],    // Para reasignar múltiples
 *   nuevoProductoBaseId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { varianteId, varianteIds, nuevoProductoBaseId } = body;

    if (!nuevoProductoBaseId) {
      return NextResponse.json(
        {
          success: false,
          error: "nuevoProductoBaseId es requerido",
        },
        { status: 400 }
      );
    }

    if (!varianteId && (!varianteIds || !Array.isArray(varianteIds))) {
      return NextResponse.json(
        {
          success: false,
          error: "Debe proporcionar varianteId o varianteIds",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const localRepo = new ServerSideProductRepository();
    const reassignerService = new VariantReassignerService(db, localRepo);

    // Reasignación simple
    if (varianteId) {
      const result = await reassignerService.reassignVariant(
        varianteId,
        nuevoProductoBaseId
      );

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    // Reasignación masiva
    if (varianteIds) {
      const result = await reassignerService.bulkReassign(
        varianteIds,
        nuevoProductoBaseId
      );

      return NextResponse.json({
        success: result.errors.length === 0,
        message: `${result.success} variante(s) reasignada(s) correctamente`,
        successCount: result.success,
        errors: result.errors.length > 0 ? result.errors : undefined,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Parámetros inválidos",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error al reasignar variante:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al reasignar variante",
      },
      { status: 500 }
    );
  }
}
