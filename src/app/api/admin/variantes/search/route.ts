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
    const limit = parseInt(searchParams.get("limit") || "20");

    const db = await getDatabase();
    const variantesCollection = db.collection("productos_variantes");
    const productosCollection = db.collection("productos_base");

    // Construir filtro de búsqueda
    const searchFilter: any = {};

    if (query) {
      // Buscar en múltiples campos
      searchFilter.$or = [
        { ean: { $regex: query, $options: "i" } },
        { nombreCompleto: { $regex: query, $options: "i" } },
        { tipo: { $regex: query, $options: "i" } },
        { tamano: { $regex: query, $options: "i" } },
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
    const productos = await productosCollection
      .find({ _id: { $in: productoBaseIds.map(id => new ObjectId(id)) } })
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
