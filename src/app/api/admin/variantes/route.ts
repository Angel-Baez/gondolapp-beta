import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { AdminValidator } from "@/core/admin/validators/AdminValidator";

/**
 * POST /api/admin/variantes
 * Crear una nueva variante
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productoBaseId, ean, nombreCompleto, tipo, tamano, sabor, imagen } = body;

    // Validar campos requeridos
    if (!productoBaseId) {
      return NextResponse.json(
        { success: false, error: "El productoBaseId es requerido" },
        { status: 400 }
      );
    }

    if (!ean || typeof ean !== "string" || !ean.trim()) {
      return NextResponse.json(
        { success: false, error: "El código de barras (EAN) es requerido" },
        { status: 400 }
      );
    }

    if (!nombreCompleto || typeof nombreCompleto !== "string" || !nombreCompleto.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre completo de la variante es requerido" },
        { status: 400 }
      );
    }

    // Validar formato del EAN
    const eanValidation = AdminValidator.validateVariante({
      ean: ean.trim(),
      nombreCompleto: nombreCompleto.trim(),
    });
    
    if (!eanValidation.valid) {
      return NextResponse.json(
        { success: false, error: eanValidation.errors.join(", ") },
        { status: 400 }
      );
    }

    // Validar ObjectId del producto base
    const idValidation = AdminValidator.validateObjectId(productoBaseId);
    if (!idValidation.valid) {
      return NextResponse.json(
        { success: false, error: "ID de producto base inválido" },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    const db = await getDatabase();
    const productosCollection = db.collection("productos_base");
    const variantesCollection = db.collection("productos_variantes");

    // Verificar que el producto base existe
    let productoBase;
    try {
      productoBase = await productosCollection.findOne({
        _id: new ObjectId(productoBaseId),
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "ID de producto base inválido" },
        { status: 400 }
      );
    }

    if (!productoBase) {
      return NextResponse.json(
        { success: false, error: "Producto base no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el EAN no exista ya
    const existingVariante = await variantesCollection.findOne({
      ean: ean.trim(),
    });

    if (existingVariante) {
      // Obtener el nombre del producto al que pertenece
      let existingProduct = null;
      try {
        existingProduct = await productosCollection.findOne({
          _id: new ObjectId(existingVariante.productoBaseId),
        });
      } catch (err) {
        // Si el productoBaseId existente no es válido, continuar sin nombre
      }

      return NextResponse.json(
        {
          success: false,
          error: `El código de barras ya existe en el producto "${existingProduct?.nombre || "Desconocido"}"`,
          existingProduct: existingProduct?.nombre,
        },
        { status: 409 }
      );
    }

    // Extraer volumen y unidad del tamaño si existe
    let volumen: number | undefined;
    let unidad: string | undefined;

    if (tamano) {
      const tamanoMatch = tamano.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb)?$/i);
      if (tamanoMatch) {
        volumen = parseFloat(tamanoMatch[1]);
        unidad = tamanoMatch[2]?.toUpperCase();
      }
    }

    // Crear documento de variante
    const nuevaVariante = {
      productoBaseId,
      ean: ean.trim(),
      nombreCompleto: nombreCompleto.trim(),
      tipo: tipo?.trim() || undefined,
      tamano: tamano?.trim() || undefined,
      volumen,
      unidad,
      sabor: sabor?.trim() || undefined,
      imagen: imagen?.trim() || undefined,
      createdAt: new Date(),
    };

    const result = await variantesCollection.insertOne(nuevaVariante);

    return NextResponse.json({
      success: true,
      variante: {
        id: result.insertedId.toString(),
        productoBaseId: nuevaVariante.productoBaseId,
        codigoBarras: nuevaVariante.ean,
        nombreCompleto: nuevaVariante.nombreCompleto,
        tipo: nuevaVariante.tipo,
        tamano: nuevaVariante.tamano,
        volumen: nuevaVariante.volumen,
        unidad: nuevaVariante.unidad,
        sabor: nuevaVariante.sabor,
        imagen: nuevaVariante.imagen,
        createdAt: nuevaVariante.createdAt,
      },
      message: "Variante creada correctamente",
    });
  } catch (error) {
    console.error("❌ Error al crear variante:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear variante",
      },
      { status: 500 }
    );
  }
}
