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

    // Batch fetch all unique productoBaseIds to avoid N+1 queries
    const allProductBaseIds = [
      ...new Set(
        duplicateEans.flatMap((group) =>
          group.variantes.map((v: any) => v.productoBaseId)
        )
      ),
    ].filter((id) => ObjectId.isValid(id));
    
    const productos = await productosCollection
      .find({
        _id: { $in: allProductBaseIds.map((id) => new ObjectId(id)) },
      })
      .toArray();
    const productoMap = new Map(
      productos.map((p: any) => [p._id.toString(), p.nombre])
    );

    // Build response using lookup map
    const duplicatesWithProducts = duplicateEans.map((group) => {
      const variantesConProducto = group.variantes.map((variante: any) => {
        const productoNombre = productoMap.get(variante.productoBaseId) || null;
        return {
          id: variante.id.toString(),
          nombreCompleto: variante.nombreCompleto,
          productoBaseId: variante.productoBaseId,
          productoNombre,
        };
      });

      return {
        ean: group._id,
        count: group.count,
        variantes: variantesConProducto,
      };
    });

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
