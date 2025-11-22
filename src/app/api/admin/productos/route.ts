import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { AdminProductService } from "@/core/admin/services/AdminProductService";
import { IndexedDBProductRepository } from "@/core/repositories/IndexedDBProductRepository";

/**
 * GET /api/admin/productos
 * Búsqueda avanzada de productos con filtros y paginación
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") || "";
    const marca = searchParams.get("marca") || "";
    const categoria = searchParams.get("categoria") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Conectar a MongoDB
    const db = await getDatabase();
    const localRepo = new IndexedDBProductRepository();
    const adminService = new AdminProductService(db, localRepo);

    // Buscar productos
    const result = await adminService.searchProducts({
      query,
      marca,
      categoria,
      page,
      limit,
    });

    // Para cada producto, contar sus variantes
    const productosConVariantes = await Promise.all(
      result.productos.map(async (producto) => {
        const count = await adminService.countVariantesByBaseId(producto.id);
        return {
          ...producto,
          variantesCount: count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      productos: productosConVariantes,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error("❌ Error al buscar productos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al buscar productos",
      },
      { status: 500 }
    );
  }
}
