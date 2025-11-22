import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { AdminProductService } from "@/core/admin/services/AdminProductService";
import { IndexedDBProductRepository } from "@/core/repositories/IndexedDBProductRepository";

/**
 * GET /api/admin/productos/[id]
 * Obtiene un producto con todas sus variantes
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

    const producto = await adminService.getProductoBaseConVariantes(id);

    if (!producto) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      producto,
    });
  } catch (error) {
    console.error("❌ Error al obtener producto:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener producto",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/productos/[id]
 * Actualiza un producto base
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

    await adminService.updateProductoBase(id, body);

    return NextResponse.json({
      success: true,
      message: "Producto actualizado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al actualizar producto",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/productos/[id]
 * Elimina un producto base (solo si no tiene variantes)
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

    await adminService.deleteProductoBase(id);

    return NextResponse.json({
      success: true,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al eliminar producto",
      },
      { status: 500 }
    );
  }
}
