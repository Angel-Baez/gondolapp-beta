import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

/**
 * GET /api/admin/integrity/orphans
 * Detectar variantes huérfanas (sin producto base válido)
 * US-106: Detección de variantes huérfanas
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const variantesCollection = db.collection("productos_variantes");

    // Buscar variantes huérfanas usando agregación (más eficiente que cargar todo en memoria)
    const orphansRaw = await variantesCollection.aggregate([
      {
        $lookup: {
          from: "productos_base",
          localField: "productoBaseId",
          foreignField: "_id",
          as: "producto"
        }
      },
      { $match: { producto: { $size: 0 } } }
    ]).toArray();

    const orphans = orphansRaw.map((v) => ({
      id: v._id?.toString() || "",
      productoBaseId: v.productoBaseId,
      codigoBarras: v.ean,
      nombreCompleto: v.nombreCompleto,
      tipo: v.tipo,
      tamano: v.tamano,
      sabor: v.sabor,
      imagen: v.imagen,
      createdAt: v.createdAt,
    }));

    return NextResponse.json({
      success: true,
      orphans,
      total: orphans.length,
    });
  } catch (error) {
    console.error("❌ Error al buscar huérfanos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al buscar huérfanos",
      },
      { status: 500 }
    );
  }
}
