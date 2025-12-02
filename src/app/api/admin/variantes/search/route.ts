import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/admin/variantes/search
 * Búsqueda independiente de variantes con información del producto padre
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    // Validate limit to prevent DoS via extremely large values
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);

    const db = await getDatabase();
    const variantesCollection = db.collection("productos_variantes");
    const productosCollection = db.collection("productos_base");

    // Construir filtro de búsqueda
    const searchFilter: any = {};

    if (query) {
      // Escapar caracteres especiales de regex en la consulta
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Buscar en múltiples campos
      searchFilter.$or = [
        { ean: { $regex: escapedQuery, $options: "i" } },
        { nombreCompleto: { $regex: escapedQuery, $options: "i" } },
        { tipo: { $regex: escapedQuery, $options: "i" } },
        { tamano: { $regex: escapedQuery, $options: "i" } },
      ];
    }

    // Contar total
    const total = await variantesCollection.countDocuments(searchFilter);

    // Calcular skip
    const skip = (page - 1) * limit;

    // Obtener variantes con paginación
    const variantes = await variantesCollection
      .find(searchFilter)
      .sort({ nombreCompleto: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Obtener información de productos base en una sola consulta
    const productoBaseIds = [...new Set(variantes.map(v => v.productoBaseId))];
    // Filter valid ObjectIds to prevent query failures
    const validProductoBaseIds = productoBaseIds.filter(id => ObjectId.isValid(id));
    const productos = await productosCollection
      .find({ _id: { $in: validProductoBaseIds.map(id => new ObjectId(id)) } })
      .toArray();

    // Crear mapa de productos
    const productosMap = new Map(productos.map(p => [p._id.toString(), p]));

    // Mapear variantes con información del producto
    const variantesConProducto = variantes.map(v => {
      const producto = productosMap.get(v.productoBaseId);
      return {
        id: v._id?.toString() || "",
        productoBaseId: v.productoBaseId,
        codigoBarras: v.ean,
        nombreCompleto: v.nombreCompleto,
        tipo: v.tipo,
        tamano: v.tamano,
        sabor: v.sabor,
        unidadMedida: v.unidad,
        imagen: v.imagen,
        createdAt: v.createdAt,
        productoNombre: producto?.nombre,
        productoMarca: producto?.marca,
      };
    });

    return NextResponse.json({
      success: true,
      variantes: variantesConProducto,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error al buscar variantes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al buscar variantes",
      },
      { status: 500 }
    );
  }
}
