import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

/**
 * GET /api/admin/stats
 * Estadísticas de las colecciones de productos
 * US-111: Dashboard de estadísticas
 * 
 * Note: For optimal performance, ensure these indexes exist:
 * - db.productos_base.createIndex({ createdAt: 1 })
 * - db.productos_variantes.createIndex({ createdAt: 1 })
 * - db.productos_variantes.createIndex({ productoBaseId: 1 })
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const productosCollection = db.collection("productos_base");
    const variantesCollection = db.collection("productos_variantes");

    // Contar totales
    const [totalProductos, totalVariantes] = await Promise.all([
      productosCollection.countDocuments({}),
      variantesCollection.countDocuments({}),
    ]);

    // Productos sin variantes (más eficiente: dos pasos)
    const baseIdsConVariante = await variantesCollection.distinct("productoBaseId");
    const productosAislados = await productosCollection.countDocuments({
      _id: { $nin: baseIdsConVariante }
    });

    // Variantes sin imagen
    const variantesSinImagen = await variantesCollection.countDocuments({
      $or: [
        { imagen: { $exists: false } },
        { imagen: null },
        { imagen: "" }
      ]
    });

    // Distribución por categoría (top 10)
    const categorias = await productosCollection.aggregate([
      {
        $group: {
          _id: "$categoria",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $nin: [null, ""] }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();

    // Distribución por marca (top 10)
    const marcas = await productosCollection.aggregate([
      {
        $group: {
          _id: "$marca",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          _id: { $nin: [null, ""] }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();

    // Promedio de variantes por producto
    const promedioVariantes = totalProductos > 0 
      ? Math.round((totalVariantes / totalProductos) * 100) / 100 
      : 0;

    // Productos creados en los últimos 7 días
    const fechaHaceUnaSemana = new Date();
    fechaHaceUnaSemana.setDate(fechaHaceUnaSemana.getDate() - 7);

    const productosRecientes = await productosCollection.countDocuments({
      createdAt: { $gte: fechaHaceUnaSemana }
    });

    const variantesRecientes = await variantesCollection.countDocuments({
      createdAt: { $gte: fechaHaceUnaSemana }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalProductos,
        totalVariantes,
        productosAislados,
        variantesSinImagen,
        promedioVariantes,
        productosRecientes,
        variantesRecientes,
        categorias: categorias.map(c => ({ nombre: c._id || "Sin categoría", count: c.count })),
        marcas: marcas.map(m => ({ nombre: m._id || "Sin marca", count: m.count })),
      }
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener estadísticas",
      },
      { status: 500 }
    );
  }
}
