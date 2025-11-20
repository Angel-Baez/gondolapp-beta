import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  CrearProductoDTO,
  ProductoBaseMongo,
  ProductoVarianteMongo,
} from "@/types";

/**
 * Extrae volumen y unidad de un string tipo "360g", "1L", "500ml"
 */
function extraerVolumenUnidad(tamano: string): {
  volumen: number | null;
  unidad: string | null;
} {
  const match = tamano.match(
    /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|u|unidad|unidades)/i
  );
  if (!match) return { volumen: null, unidad: null };

  let volumen = parseFloat(match[1]);
  let unidad = match[2].toUpperCase();

  if (unidad === "UNIDAD" || unidad === "UNIDADES" || unidad === "U") {
    unidad = "UNIDAD";
  }

  return { volumen, unidad };
}

/**
 * POST /api/productos/crear-manual
 *
 * Crea un producto manualmente desde el formulario o scanner
 */
export async function POST(request: NextRequest) {
  try {
    const body: CrearProductoDTO = await request.json();

    console.log("📦 Creando producto manual:", {
      ean: body.ean,
      nombre: body.productoBase?.nombre,
      marca: body.productoBase?.marca,
    });

    // Validar campos requeridos
    if (
      !body.ean ||
      !body.productoBase?.nombre ||
      !body.productoBase?.marca ||
      !body.productoBase?.categoria ||
      !body.variante?.tamano
    ) {
      console.error("❌ Validación fallida: Faltan campos requeridos", body);
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    console.log("🔌 Conectando a MongoDB...");
    const db = await getDatabase();
    console.log("✅ Conectado a MongoDB");

    const productosCollection =
      db.collection<ProductoBaseMongo>("productos_base");
    const variantesCollection = db.collection<ProductoVarianteMongo>(
      "productos_variantes"
    );

    // 1. Verificar que el EAN no exista
    const varianteExistente = await variantesCollection.findOne({
      ean: body.ean,
    });
    if (varianteExistente) {
      return NextResponse.json(
        {
          success: false,
          error: "Este código de barras ya existe en la base de datos",
        },
        { status: 409 }
      );
    }

    // 2. Buscar o crear ProductoBase
    let productoBase = await productosCollection.findOne({
      nombre: body.productoBase.nombre.trim(),
      marca: body.productoBase.marca.trim(),
    });

    let productoBaseId: string;

    if (!productoBase) {
      const nuevoProductoBase: ProductoBaseMongo = {
        nombre: body.productoBase.nombre.trim(),
        marca: body.productoBase.marca.trim(),
        categoria: body.productoBase.categoria.trim(),
        imagen: body.productoBase.imagen,
        createdAt: new Date(),
      };

      const result = await productosCollection.insertOne(
        nuevoProductoBase as any
      );
      productoBaseId = result.insertedId.toString();
    } else {
      productoBaseId = productoBase._id!.toString();
    }

    // 3. Crear Variante
    const { volumen, unidad } = extraerVolumenUnidad(body.variante.tamano);

    // Generar nombreCompleto automáticamente
    const partesNombre = [
      body.variante.tipo,
      body.variante.tamano,
      body.variante.sabor,
    ].filter(Boolean);

    const nombreCompleto = partesNombre.join(" ");

    const nuevaVariante: ProductoVarianteMongo = {
      productoBaseId,
      ean: body.ean.trim(),
      nombreCompleto,
      tipo: body.variante.tipo?.trim(),
      tamano: body.variante.tamano.trim(),
      volumen: volumen || undefined,
      unidad: unidad || undefined,
      sabor: body.variante.sabor?.trim(),
      imagen: body.variante.imagen,
      createdAt: new Date(),
    };

    const resultVariante = await variantesCollection.insertOne(
      nuevaVariante as any
    );
    const varianteId = resultVariante.insertedId.toString();

    return NextResponse.json({
      success: true,
      producto: {
        base: {
          id: productoBaseId,
          nombre: body.productoBase.nombre,
          marca: body.productoBase.marca,
          categoria: body.productoBase.categoria,
        },
        variante: {
          id: varianteId,
          ean: body.ean,
          nombreCompleto,
          tipo: body.variante.tipo,
          tamano: body.variante.tamano,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error al crear producto manual:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al crear el producto",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/productos/crear-manual
 *
 * Devuelve listas de marcas y categorías existentes para autocompletado
 */
export async function GET() {
  try {
    const db = await getDatabase();
    const productosCollection =
      db.collection<ProductoBaseMongo>("productos_base");

    // Obtener marcas y categorías únicas con timeout
    const marcas = await productosCollection.distinct("marca");
    const categorias = await productosCollection.distinct("categoria");

    return NextResponse.json({
      success: true,
      marcas: marcas.sort(),
      categorias: categorias.sort(),
    });
  } catch (error) {
    console.error("Error al obtener marcas y categorías:", error);

    // Retornar arrays vacíos en vez de error total
    // Permite que el formulario funcione sin autocompletado
    return NextResponse.json({
      success: true,
      marcas: [],
      categorias: [],
      warning: "Base de datos no disponible. Autocompletado deshabilitado.",
    });
  }
}
