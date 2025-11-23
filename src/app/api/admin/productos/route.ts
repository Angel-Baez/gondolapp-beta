import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { AdminProductService } from "@/core/admin/services/AdminProductService";
import { ServerSideProductRepository } from "@/core/repositories/ServerSideProductRepository";

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
    const localRepo = new ServerSideProductRepository();
    const adminService = new AdminProductService(db, localRepo);

    // Buscar productos
    const result = await adminService.searchProducts({
      query,
      marca,
      categoria,
      page,
      limit,
    });

    // Obtener los conteos de variantes en una sola consulta agregada (evita N+1)
    const productIds = result.productos.map((p) => p.id);
    
    let productosConVariantes = result.productos.map(producto => ({
      ...producto,
      variantesCount: 0,
    }));

    if (productIds.length > 0) {
      const variantesCollection = db.collection("productos_variantes");
      const variantCounts = await variantesCollection.aggregate([
        { $match: { productoBaseId: { $in: productIds } } },
        { $group: { _id: "$productoBaseId", count: { $sum: 1 } } }
      ]).toArray();

      // Crear un mapa para acceso O(1)
      const countMap = new Map(variantCounts.map((vc: any) => [vc._id, vc.count]));

      // Mapear los productos con su conteo de variantes
      productosConVariantes = result.productos.map(producto => ({
        ...producto,
        variantesCount: countMap.get(producto.id) || 0,
      }));
    }

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
