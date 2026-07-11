import { crearClienteServidor } from "@/lib/supabaseServer";
import { construirNombreCompleto, ORDEN_ATRIBUTOS_DEFAULT } from "@/lib/utils";
import { obtenerDefinicionesAtributos } from "@/services/catalogo";
import {
  IANoConfiguradaError,
  ParseoInvalidoError,
  parsearProducto,
} from "@/services/parseoProducto";
import { NextRequest, NextResponse } from "next/server";

// Cap de costo/abuso: nadie tipea un nombre de producto más largo que esto.
const MAX_TEXTO = 200;

/**
 * POST /api/productos/parsear
 *
 * Parsea el texto libre de un producto con IA y devuelve los campos
 * normalizados para la pantalla de confirmación. Cualquier `!success` es
 * señal para que el cliente caiga al formulario manual.
 */
export async function POST(request: NextRequest) {
  // Gate 401: protege el gasto de IA detrás de auth (no solo del rate
  // limit por IP) y da un cliente con el JWT del usuario para que RLS
  // scopee las lecturas del catálogo.
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "No autenticado" },
      { status: 401 }
    );
  }

  let texto: unknown;
  try {
    ({ texto } = await request.json());
  } catch {
    return NextResponse.json(
      { success: false, error: "Body inválido" },
      { status: 400 }
    );
  }

  if (typeof texto !== "string" || !texto.trim()) {
    return NextResponse.json(
      { success: false, error: "Falta el texto del producto" },
      { status: 400 }
    );
  }
  if (texto.length > MAX_TEXTO) {
    return NextResponse.json(
      { success: false, error: `El texto no puede superar ${MAX_TEXTO} caracteres` },
      { status: 400 }
    );
  }

  try {
    const parsed = await parsearProducto(texto.trim(), supabase);

    // Preview del nombre con el mismo orden de claves que usará el trigger
    // de BD al crear (definición de la categoría, o default global).
    let orden: readonly string[] = ORDEN_ATRIBUTOS_DEFAULT;
    try {
      const defs = await obtenerDefinicionesAtributos(supabase);
      const categoria = parsed.productoBase.categoria;
      const defsAplicables =
        (categoria && defs.porCategoria[categoria]) ||
        (defs.default.length ? defs.default : null);
      if (defsAplicables) orden = defsAplicables.map((d) => d.clave);
    } catch {
      // sin definiciones: orden default
    }
    const nombrePreview = construirNombreCompleto(
      parsed.productoBase.nombre,
      parsed.atributos,
      orden
    );

    return NextResponse.json({ success: true, parsed, nombrePreview });
  } catch (error) {
    if (error instanceof IANoConfiguradaError) {
      return NextResponse.json(
        { success: false, error: "IA no configurada" },
        { status: 503 }
      );
    }
    const message =
      error instanceof ParseoInvalidoError
        ? error.message
        : "No se pudo analizar el producto";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
