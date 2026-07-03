import { crearProductoManual, obtenerMarcasYCategorias } from "@/services/catalogo";
import { CrearProductoDTO } from "@/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/productos/crear-manual
 *
 * Crea un producto manualmente desde el formulario o scanner
 */
export async function POST(request: NextRequest) {
  try {
    const body: CrearProductoDTO = await request.json();

    if (!body.ean || !body.productoBase?.nombre || !body.productoBase?.marca) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const producto = await crearProductoManual(body);

    return NextResponse.json({
      success: true,
      producto: {
        base: {
          id: producto.base.id,
          nombre: producto.base.nombre,
          marca: producto.base.marca,
          categoria: producto.base.categoria,
        },
        variante: {
          id: producto.variante.id,
          nombreCompleto: producto.variante.nombreCompleto,
          tamano: producto.variante.tamano,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear el producto";
    const status = message.includes("ya existe") ? 409 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * GET /api/productos/crear-manual
 *
 * Devuelve listas de marcas y categorías existentes para autocompletado
 */
export async function GET() {
  try {
    const { marcas, categorias } = await obtenerMarcasYCategorias();
    return NextResponse.json({ success: true, marcas, categorias });
  } catch {
    return NextResponse.json({
      success: true,
      marcas: [],
      categorias: [],
      warning: "Catálogo no disponible. Autocompletado deshabilitado.",
    });
  }
}
