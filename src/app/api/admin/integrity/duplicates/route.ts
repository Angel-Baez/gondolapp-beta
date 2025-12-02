import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/admin/integrity/duplicates
 * Detectar EANs duplicados en variantes
 * US-107: Escaneo global de EANs duplicados
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const variantesCollection = db.collection("productos_variantes");
    const productosCollection = db.collection("productos_base");

    // Agregación para encontrar EANs duplicados
    const duplicateEans = await variantesCollection.aggregate([
      {
        $group: {
          _id: "$ean",
          count: { $sum: 1 },
          variantes: {
            $push: {
              id: "$_id",
              nombreCompleto: "$nombreCompleto",
              productoBaseId: "$productoBaseId",
            },
          },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]).toArray();

    // Obtener nombres de productos para cada variante
    const duplicatesWithProducts = await Promise.all(
      duplicateEans.map(async (group) => {
        const variantesConProducto = await Promise.all(
          group.variantes.map(async (variante: any) => {
            let productoNombre = null;
            try {
              const producto = await productosCollection.findOne({
                _id: new ObjectId(variante.productoBaseId) as any,
              });
              productoNombre = producto?.nombre;
            } catch {
              // Producto no encontrado
            }

            return {
              id: variante.id.toString(),
              nombreCompleto: variante.nombreCompleto,
              productoBaseId: variante.productoBaseId,
              productoNombre,
            };
          })
        );

        return {
          ean: group._id,
          count: group.count,
          variantes: variantesConProducto,
        };
      })
    );

    return NextResponse.json({
      success: true,
      duplicates: duplicatesWithProducts,
      total: duplicatesWithProducts.length,
    });
  } catch (error) {
    console.error("❌ Error al buscar duplicados:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al buscar duplicados",
      },
      { status: 500 }
    );
  }
}
