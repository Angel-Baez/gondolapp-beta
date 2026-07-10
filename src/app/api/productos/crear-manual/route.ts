import { crearClienteServidor } from "@/lib/supabaseServer";
import {
  crearProductoManual,
  obtenerDefinicionesAtributos,
  obtenerMarcasYCategorias,
} from "@/services/catalogo";
import { AtributosVariante, CategoriaAtributo, CrearProductoDTO } from "@/types";
import { NextRequest, NextResponse } from "next/server";

/** El body viene de la red: no confiar en el shape de CrearProductoDTO. */
function esObjetoPlanoDeStrings(valor: unknown): valor is AtributosVariante {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor) &&
    Object.values(valor).every((v) => typeof v === "string")
  );
}

/**
 * Normaliza whitespace y, si el valor matchea case-insensitive una
 * sugerencia de la definición, lo sustituye por la forma canónica. Es la
 * única defensa contra "Vainilla"/"vainilla"/"VAINILLA" conviviendo en el
 * jsonb (el schema no valida valores): el datalist del formulario empuja
 * hacia el canon y acá se consolida lo que llegue tipeado distinto.
 */
function canonicalizarAtributos(
  atributos: AtributosVariante,
  defs: CategoriaAtributo[]
): AtributosVariante {
  const sugerenciasPorClave = new Map(defs.map((d) => [d.clave, d.sugerencias ?? []]));
  return Object.fromEntries(
    Object.entries(atributos).map(([clave, valor]) => {
      const normalizado = valor.replace(/\s+/g, " ").trim();
      const canonico = sugerenciasPorClave
        .get(clave)
        ?.find((s) => s.toLowerCase() === normalizado.toLowerCase());
      return [clave, canonico ?? normalizado];
    })
  );
}

/**
 * POST /api/productos/crear-manual
 *
 * Crea un producto manualmente desde el formulario o scanner
 */
export async function POST(request: NextRequest) {
  try {
    // Cliente por-request con el JWT del usuario: desde la migración 0012
    // `anon` no tiene acceso y el singleton browser operaría como anon.
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

    const body: CrearProductoDTO = await request.json();

    if (!body.ean || !body.productoBase?.nombre || !body.productoBase?.marca) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const atributosCrudos = body.variante?.atributos ?? {};
    if (!esObjetoPlanoDeStrings(atributosCrudos)) {
      return NextResponse.json(
        { success: false, error: "atributos debe ser un objeto plano de strings" },
        { status: 400 }
      );
    }

    // Si las definiciones no se pueden leer, se crea igual sin canonicalizar:
    // perder el alta por un fallo del lookup sería peor que un valor sin canon.
    let atributos = atributosCrudos;
    try {
      const defs = await obtenerDefinicionesAtributos(supabase);
      const categoria = body.productoBase.categoria?.trim();
      const defsAplicables =
        (categoria && defs.porCategoria[categoria]) || defs.default;
      atributos = canonicalizarAtributos(atributosCrudos, defsAplicables);
    } catch {
      // sin canonicalización
    }

    const producto = await crearProductoManual(
      {
        ...body,
        variante: { ...body.variante, atributos },
      },
      supabase
    );

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
          atributos: producto.variante.atributos,
          // Derivado para consumidores que siguen esperando el campo plano.
          tamano: producto.variante.atributos["tamano"],
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
 * Devuelve marcas y categorías existentes para autocompletado, más las
 * definiciones de atributos que arman el formulario dinámico del alta.
 *
 * TODO: sin consumidores desde jul 2026 — useMarcasCategorias ahora deriva
 * del catálogo completo cacheado (ver useCatalogoCompleto) en vez de
 * pegarle a este endpoint. Se deja como red de recuperación por si ese
 * cache nunca carga; considerar remover si en unos meses se confirma que
 * nadie lo llama.
 */
export async function GET() {
  try {
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

    const [{ marcas, categorias }, defs] = await Promise.all([
      obtenerMarcasYCategorias(supabase),
      obtenerDefinicionesAtributos(supabase),
    ]);
    return NextResponse.json({
      success: true,
      marcas,
      categorias,
      atributosDefault: defs.default,
      atributosPorCategoria: defs.porCategoria,
    });
  } catch {
    return NextResponse.json({
      success: true,
      marcas: [],
      categorias: [],
      atributosDefault: [],
      atributosPorCategoria: {},
      warning: "Catálogo no disponible. Autocompletado deshabilitado.",
    });
  }
}
