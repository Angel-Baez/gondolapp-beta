import { buscarPorCodigoBarras } from "@/services/catalogo";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/productos/buscar?ean=<codigo>
 *
 * Busca un producto en el catálogo por código de barras.
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

    const producto = await buscarPorCodigoBarras(ean);

    if (!producto) {
      return NextResponse.json({
        success: false,
        message: "Producto no encontrado",
      });
    }

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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al buscar",
      },
      { status: 500 }
    );
  }
}
