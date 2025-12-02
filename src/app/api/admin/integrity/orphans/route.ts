import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/admin/integrity/orphans
 * Detectar variantes huérfanas (sin producto base válido)
 * US-106: Detección de variantes huérfanas
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const variantesCollection = db.collection("productos_variantes");
    const productosCollection = db.collection("productos_base");

    // Obtener todos los IDs de productos base
    const productosIds = await productosCollection
      .find({}, { projection: { _id: 1 } })
      .map((p) => p._id.toString())
      .toArray();

    const productosIdSet = new Set(productosIds);

    // Obtener todas las variantes y filtrar las huérfanas
    const variantes = await variantesCollection.find({}).toArray();

    const orphans = variantes
      .filter((v) => !productosIdSet.has(v.productoBaseId))
      .map((v) => ({
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
