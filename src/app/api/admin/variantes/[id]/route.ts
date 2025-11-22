import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { AdminProductService } from "@/core/admin/services/AdminProductService";
import { IndexedDBProductRepository } from "@/core/repositories/IndexedDBProductRepository";

/**
 * GET /api/admin/variantes/[id]
 * Obtiene una variante por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = await getDatabase();
    const localRepo = new IndexedDBProductRepository();
    const adminService = new AdminProductService(db, localRepo);

    const variante = await adminService.getVarianteById(id);

    if (!variante) {
      return NextResponse.json(
        { success: false, error: "Variante no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      variante,
    });
  } catch (error) {
    console.error("❌ Error al obtener variante:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener variante",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/variantes/[id]
 * Actualiza una variante
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const db = await getDatabase();
    const localRepo = new IndexedDBProductRepository();
    const adminService = new AdminProductService(db, localRepo);

    await adminService.updateVariante(id, body);

    return NextResponse.json({
      success: true,
      message: "Variante actualizada correctamente",
    });
  } catch (error) {
    console.error("❌ Error al actualizar variante:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al actualizar variante",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/variantes/[id]
 * Elimina una variante
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const db = await getDatabase();
    const localRepo = new IndexedDBProductRepository();
    const adminService = new AdminProductService(db, localRepo);

    await adminService.deleteVariante(id);

    return NextResponse.json({
      success: true,
      message: "Variante eliminada correctamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar variante:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar variante",
      },
      { status: 500 }
    );
  }
}
