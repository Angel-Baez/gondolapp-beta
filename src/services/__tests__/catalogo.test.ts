import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabaseFrom } from "@/tests/mocks/supabaseMock";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

const varianteRow = {
  id: "variante-1",
  producto_base_id: "base-1",
  codigo_barras: "7791234567890",
  nombre_completo: "Leche Entera 1L",
  atributos: { tipo: "Entera", tamano: "1L" },
  imagen: null,
  created_at: "2026-01-01T00:00:00Z",
};

const baseRow = {
  id: "base-1",
  nombre: "Leche",
  marca: "La Serenísima",
  categoria: "Lácteos",
  imagen: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  fromMock.mockReset();
});

describe("buscarPorCodigoBarras", () => {
  it("devuelve null si no encuentra la variante", async () => {
    const { buscarPorCodigoBarras } = await import("@/services/catalogo");
    fromMock.mockImplementation(mockSupabaseFrom({ data: null }));

    const resultado = await buscarPorCodigoBarras("0000000000000");
    expect(resultado).toBeNull();
  });

  it("devuelve base + variante cuando el código existe (un solo round-trip)", async () => {
    const { buscarPorCodigoBarras } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom({ data: { ...varianteRow, producto_bases: baseRow } })
    );

    const resultado = await buscarPorCodigoBarras(varianteRow.codigo_barras);
    expect(resultado).not.toBeNull();
    expect(resultado!.variante.codigoBarras).toBe("7791234567890");
    expect(resultado!.base.nombre).toBe("Leche");
    expect(resultado!.base.marca).toBe("La Serenísima");
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("propaga el error si la consulta falla", async () => {
    const { buscarPorCodigoBarras } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom({ error: new Error("conexión perdida") })
    );

    await expect(buscarPorCodigoBarras("123")).rejects.toThrow("conexión perdida");
  });
});

describe("crearProductoManual", () => {
  const dto = {
    ean: "7799999999999",
    productoBase: { nombre: "Yerba", marca: "Playadito", categoria: "Almacén" },
    variante: { atributos: { tamano: "1kg", tipo: "Con Palo" } },
  };

  it("rechaza si el código de barras ya existe", async () => {
    const { crearProductoManual } = await import("@/services/catalogo");
    // Los dos checks de existencia se disparan en paralelo, así que ambos
    // necesitan una respuesta mockeada aunque el segundo no se use.
    fromMock.mockImplementation(
      mockSupabaseFrom({ data: { id: "ya-existe" } }, { data: null })
    );

    await expect(crearProductoManual(dto)).rejects.toThrow("ya existe en el catálogo");
  });

  it("reutiliza el producto base si ya existe uno con el mismo nombre+marca", async () => {
    const { crearProductoManual } = await import("@/services/catalogo");
    const nuevaVarianteRow = {
      id: "variante-nueva",
      producto_base_id: "base-1",
      codigo_barras: dto.ean,
      nombre_completo: "Yerba Con Palo 1kg",
      atributos: { tipo: "Con Palo", tamano: "1kg" },
      imagen: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: null }, // no existe el EAN
        { data: baseRow }, // ya existe el producto base -> se reutiliza
        { data: nuevaVarianteRow } // insert de la variante
      )
    );

    const resultado = await crearProductoManual(dto);
    expect(resultado.base.id).toBe("base-1");
    expect(resultado.variante.id).toBe("variante-nueva");
    expect(fromMock).toHaveBeenCalledTimes(3);
  });

  it("no manda nombre_completo (lo deriva el trigger de BD) y sanitiza atributos", async () => {
    const { crearProductoManual } = await import("@/services/catalogo");
    const dtoSucio = {
      ean: "7777777777777",
      productoBase: { nombre: "Yerba", marca: "Playadito", categoria: "Almacén" },
      variante: { atributos: { tipo: " Con Palo ", sabor: "  ", tamano: "1kg" } },
    };
    let payloadInsertado: Record<string, unknown> | undefined;
    fromMock.mockImplementation((tabla: string) => {
      if (tabla === "producto_variantes") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          insert: (payload: Record<string, unknown>) => {
            payloadInsertado = payload;
            return {
              select: () => ({
                single: async () => ({
                  data: {
                    ...payload,
                    id: "variante-nueva",
                    nombre_completo: "Yerba Con Palo 1kg", // lo pondría el trigger
                    created_at: "2026-01-01T00:00:00Z",
                  },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      return {
        select: () => ({
          // El lookup de base usa ilike (igualdad case-insensitive, ver 0010)
          ilike: () => ({ ilike: () => ({ maybeSingle: async () => ({ data: baseRow, error: null }) }) }),
        }),
      };
    });

    await crearProductoManual(dtoSucio);

    expect(payloadInsertado).not.toHaveProperty("nombre_completo");
    expect(payloadInsertado?.atributos).toEqual({ tipo: "Con Palo", tamano: "1kg" });
  });

  it("crea un producto base nuevo si no existe ninguno con ese nombre+marca", async () => {
    const { crearProductoManual } = await import("@/services/catalogo");
    const baseNuevaRow = { ...baseRow, id: "base-nueva", nombre: "Yerba", marca: "Playadito" };
    const varianteNuevaRow = {
      id: "variante-nueva",
      producto_base_id: "base-nueva",
      codigo_barras: dto.ean,
      nombre_completo: "Yerba Con Palo 1kg",
      atributos: { tipo: "Con Palo", tamano: "1kg" },
      imagen: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: null }, // no existe el EAN
        { data: null }, // no existe el producto base -> hay que crearlo
        { data: baseNuevaRow }, // insert de producto_bases
        { data: varianteNuevaRow } // insert de la variante
      )
    );

    const resultado = await crearProductoManual(dto);
    expect(resultado.base.id).toBe("base-nueva");
    expect(fromMock).toHaveBeenCalledTimes(4);
  });
});

describe("obtenerProductosPorVarianteIds", () => {
  it("devuelve un objeto vacío sin consultar la base si no hay ids", async () => {
    const { obtenerProductosPorVarianteIds } = await import("@/services/catalogo");
    const resultado = await obtenerProductosPorVarianteIds([]);
    expect(Object.keys(resultado)).toHaveLength(0);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("arma el índice varianteId -> {base, variante} en un solo round-trip", async () => {
    const { obtenerProductosPorVarianteIds } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom({ data: [{ ...varianteRow, producto_bases: baseRow }] })
    );

    const resultado = await obtenerProductosPorVarianteIds(["variante-1", "variante-1"]);
    expect(Object.keys(resultado)).toHaveLength(1);
    expect(resultado["variante-1"]?.base.nombre).toBe("Leche");
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("sobrevive el round-trip JSON del persister (regresión: Map serializaba como {})", async () => {
    const { obtenerProductosPorVarianteIds } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom({ data: [{ ...varianteRow, producto_bases: baseRow }] })
    );

    const resultado = await obtenerProductosPorVarianteIds(["variante-1"]);
    const restaurado = JSON.parse(JSON.stringify(resultado));
    expect(restaurado["variante-1"]?.base.nombre).toBe("Leche");
  });
});

describe("obtenerDefinicionesAtributos", () => {
  it("separa el default global (categoria null) de las definiciones por categoría", async () => {
    const { obtenerDefinicionesAtributos } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom({
        data: [
          { categoria: null, clave: "tipo", etiqueta: "Tipo", orden: 0, sugerencias: [] },
          { categoria: null, clave: "sabor", etiqueta: "Sabor", orden: 1, sugerencias: [] },
          {
            categoria: "Ferretería",
            clave: "medida",
            etiqueta: "Medida",
            orden: 0,
            sugerencias: ["PH1", "PH2"],
          },
        ],
      })
    );

    const defs = await obtenerDefinicionesAtributos();

    expect(defs.default.map((d) => d.clave)).toEqual(["tipo", "sabor"]);
    expect(defs.porCategoria["Ferretería"]).toEqual([
      { clave: "medida", etiqueta: "Medida", orden: 0, sugerencias: ["PH1", "PH2"] },
    ]);
    // sugerencias vacías se normalizan a undefined (no ensuciar el JSON persistido)
    expect(defs.default[0].sugerencias).toBeUndefined();
  });
});

describe("obtenerMarcasYCategorias", () => {
  it("deduplica y ordena marcas y categorías", async () => {
    const { obtenerMarcasYCategorias } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom({
        data: [
          { marca: "Nestlé", categoria: "Lácteos" },
          { marca: "Nestlé", categoria: "Lácteos" },
          { marca: "Arcor", categoria: "Golosinas" },
          { marca: null, categoria: null },
        ],
      })
    );

    const { marcas, categorias } = await obtenerMarcasYCategorias();
    expect(marcas).toEqual(["Arcor", "Nestlé"]);
    expect(categorias).toEqual(["Golosinas", "Lácteos"]);
  });
});

describe("obtenerCatalogoCompleto", () => {
  it("trae bases + variantes + definiciones en paralelo y las mapea", async () => {
    const { obtenerCatalogoCompleto } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: [baseRow] }, // producto_bases
        { data: [varianteRow] }, // producto_variantes
        {
          data: [
            { categoria: null, clave: "tipo", etiqueta: "Tipo", orden: 0, sugerencias: [] },
          ],
        } // categoria_atributos (dentro de obtenerDefinicionesAtributos)
      )
    );

    const catalogo = await obtenerCatalogoCompleto();

    expect(catalogo.bases).toEqual([expect.objectContaining({ id: "base-1", nombre: "Leche" })]);
    expect(catalogo.variantes).toEqual([
      expect.objectContaining({ id: "variante-1", codigoBarras: "7791234567890" }),
    ]);
    expect(catalogo.definiciones.default.map((d) => d.clave)).toEqual(["tipo"]);
    expect(fromMock).toHaveBeenCalledTimes(3);
  });

  it("propaga el error si falla la consulta de bases", async () => {
    const { obtenerCatalogoCompleto } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { error: new Error("bases caídas") },
        { data: [] },
        { data: [] }
      )
    );

    await expect(obtenerCatalogoCompleto()).rejects.toThrow("bases caídas");
  });

  it("propaga el error si falla la consulta de variantes", async () => {
    const { obtenerCatalogoCompleto } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: [] },
        { error: new Error("variantes caídas") },
        { data: [] }
      )
    );

    await expect(obtenerCatalogoCompleto()).rejects.toThrow("variantes caídas");
  });
});

describe("buscarProductos", () => {
  it("no consulta la base si el término sanitizado queda muy corto", async () => {
    const { buscarProductos } = await import("@/services/catalogo");
    const resultado = await buscarProductos(" ,%) (");

    expect(resultado).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("sanitiza antes de decidir el largo mínimo: ',,a,' sin comas queda en 1 char y no consulta", async () => {
    const { buscarProductos } = await import("@/services/catalogo");
    // Sin sanitizar tiene 4 caracteres (pasaría el mínimo); sanitizado
    // ("a") queda en 1 y debe cortar antes de tocar la base — así se prueba
    // que la sanitización corre ANTES del chequeo de longitud mínima.
    const resultado = await buscarProductos(",,a,");

    expect(resultado).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("buscarVariantes", () => {
  it("no consulta la base si el término sanitizado queda muy corto", async () => {
    const { buscarVariantes } = await import("@/services/catalogo");
    const resultado = await buscarVariantes("a,");

    expect(resultado).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("mergea las dos búsquedas en paralelo y dedupe por variante.id", async () => {
    const { buscarVariantes } = await import("@/services/catalogo");
    const otraVariante = {
      ...varianteRow,
      id: "variante-2",
      nombre_completo: "Leche Descremada 1L",
    };

    fromMock.mockImplementation(
      mockSupabaseFrom(
        // Query 1: ilike sobre nombre_completo de la variante
        { data: [{ ...varianteRow, producto_bases: baseRow }] },
        // Query 2: .or() sobre la base referenciada (mismo variante-1 repetido + una nueva)
        {
          data: [
            { ...varianteRow, producto_bases: baseRow },
            { ...otraVariante, producto_bases: baseRow },
          ],
        }
      )
    );

    const resultado = await buscarVariantes("leche");

    expect(resultado).toHaveLength(2);
    expect(resultado.map((p) => p.variante.id).sort()).toEqual([
      "variante-1",
      "variante-2",
    ]);
    expect(fromMock).toHaveBeenCalledTimes(2);
  });
});
