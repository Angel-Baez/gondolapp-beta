import { getDatabase } from "@/lib/mongodb";
import { ProductoBaseMongo, ProductoVarianteMongo } from "@/types";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/productos/buscar?ean=<codigo>
 *
 * Busca un producto en MongoDB por código de barras EAN
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ean = searchParams.get("ean");

    if (!ean) {
      return NextResponse.json(
        { success: false, error: "Parámetro 'ean' requerido" },
        { status: 400 }
      );
    }

    console.log("🔍 Buscando en MongoDB EAN:", ean);

    // Conectar a MongoDB con manejo de errores mejorado
    let db;
    try {
      db = await getDatabase();
    } catch (dbError) {
      console.error("❌ Error de conexión MongoDB:", dbError);
      // Retornar error 503 (Service Unavailable) con mensaje descriptivo
      // Esto permitirá que el cliente sepa que debe usar el formulario manual
      return NextResponse.json(
        {
          success: false,
          error: "mongodb_unavailable",
          message:
            "Base de datos temporalmente no disponible. Usa el formulario manual.",
        },
        { status: 503 }
      );
    }

    const variantesCollection = db.collection<ProductoVarianteMongo>(
      "productos_variantes"
    );
    const productosCollection =
      db.collection<ProductoBaseMongo>("productos_base");

    // Buscar variante por EAN con timeout
    let variante;
    try {
      variante = await variantesCollection.findOne({ ean });
    } catch (queryError) {
      console.error("❌ Error al consultar variantes:", queryError);
      return NextResponse.json(
        {
          success: false,
          error: "query_failed",
          message: "Error al buscar en la base de datos",
        },
        { status: 503 }
      );
    }

    if (!variante) {
      console.log("❌ EAN no encontrado en MongoDB:", ean);
      return NextResponse.json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    // Validar que productoBaseId sea válido
    if (!variante.productoBaseId) {
      console.error("❌ Variante sin productoBaseId:", variante.ean);
      return NextResponse.json(
        {
          success: false,
          error: "Variante sin producto base asociado",
        },
        { status: 500 }
      );
    }

    // Convertir a ObjectId si es string
    let productoBaseId;
    try {
      productoBaseId =
        typeof variante.productoBaseId === "string"
          ? new ObjectId(variante.productoBaseId)
          : variante.productoBaseId;
    } catch (idError) {
      console.error(
        "❌ productoBaseId inválido:",
        variante.productoBaseId,
        idError
      );
      return NextResponse.json(
        {
          success: false,
          error: "ID de producto base inválido",
        },
        { status: 500 }
      );
    }

    // Obtener producto base
    const productoBase = await productosCollection.findOne({
      _id: productoBaseId as any,
    });

    if (!productoBase) {
      console.error("❌ ProductoBase no encontrado:", variante.productoBaseId);
      return NextResponse.json(
        { success: false, error: "Datos inconsistentes" },
        { status: 500 }
      );
    }

    console.log("✅ Producto encontrado:", productoBase.nombre);

    return NextResponse.json({
      success: true,
      producto: {
        base: {
          id: productoBase._id?.toString(),
          nombre: productoBase.nombre,
          marca: productoBase.marca,
          categoria: productoBase.categoria,
          imagen: productoBase.imagen,
          createdAt: productoBase.createdAt,
        },
        variante: {
          id: variante._id?.toString(),
          ean: variante.ean,
          nombreCompleto: variante.nombreCompleto,
          tipo: variante.tipo,
          tamano: variante.tamano,
          volumen: variante.volumen,
          unidad: variante.unidad,
          sabor: variante.sabor,
          imagen: variante.imagen,
          createdAt: variante.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error al buscar producto:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al buscar",
      },
      { status: 500 }
    );
  }
}
