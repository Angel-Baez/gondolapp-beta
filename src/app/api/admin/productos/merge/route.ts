import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ProductMergerService } from "@/core/admin/services/ProductMergerService";
import { ServerSideProductRepository } from "@/core/repositories/ServerSideProductRepository";

/**
 * POST /api/admin/productos/merge
 * Fusiona varios productos base en uno
 * 
 * Body: {
 *   targetId: string,
 *   sourceIds: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetId, sourceIds, preview = false } = body;

    if (!targetId || !sourceIds || !Array.isArray(sourceIds)) {
      return NextResponse.json(
        {
          success: false,
          error: "targetId y sourceIds son requeridos",
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const localRepo = new ServerSideProductRepository();
    const mergerService = new ProductMergerService(db, localRepo);

    // Si es preview, solo mostrar la previsualización
    if (preview) {
      const previewResult = await mergerService.previewMerge(targetId, sourceIds);
      return NextResponse.json({
        success: true,
        preview: previewResult,
      });
    }

    // Ejecutar la fusión
    const result = await mergerService.mergeProducts(targetId, sourceIds);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Error al fusionar productos",
          details: result.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Productos fusionados correctamente",
      variantesReasignadas: result.variantesReasignadas,
      productosEliminados: result.productosEliminados,
      warnings: result.errors,
    });
  } catch (error) {
    console.error("❌ Error al fusionar productos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al fusionar productos",
      },
      { status: 500 }
    );
  }
}
