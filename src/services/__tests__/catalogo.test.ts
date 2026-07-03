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
  tipo: "Entera",
  tamano: "1L",
  sabor: null,
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
    variante: { tamano: "1kg", tipo: "Con Palo" },
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
      nombre_completo: "Con Palo 1kg",
      tipo: "Con Palo",
      tamano: "1kg",
      sabor: null,
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

  it("crea un producto base nuevo si no existe ninguno con ese nombre+marca", async () => {
    const { crearProductoManual } = await import("@/services/catalogo");
    const baseNuevaRow = { ...baseRow, id: "base-nueva", nombre: "Yerba", marca: "Playadito" };
    const varianteNuevaRow = {
      id: "variante-nueva",
      producto_base_id: "base-nueva",
      codigo_barras: dto.ean,
      nombre_completo: "Con Palo 1kg",
      tipo: "Con Palo",
      tamano: "1kg",
      sabor: null,
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
  it("devuelve un mapa vacío sin consultar la base si no hay ids", async () => {
    const { obtenerProductosPorVarianteIds } = await import("@/services/catalogo");
    const resultado = await obtenerProductosPorVarianteIds([]);
    expect(resultado.size).toBe(0);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("arma el mapa varianteId -> {base, variante} en un solo round-trip", async () => {
    const { obtenerProductosPorVarianteIds } = await import("@/services/catalogo");
    fromMock.mockImplementation(
      mockSupabaseFrom({ data: [{ ...varianteRow, producto_bases: baseRow }] })
    );

    const resultado = await obtenerProductosPorVarianteIds(["variante-1", "variante-1"]);
    expect(resultado.size).toBe(1);
    expect(resultado.get("variante-1")?.base.nombre).toBe("Leche");
    expect(fromMock).toHaveBeenCalledTimes(1);
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
