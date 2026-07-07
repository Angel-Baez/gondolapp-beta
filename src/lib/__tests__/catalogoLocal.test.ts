import { describe, expect, it } from "vitest";
import {
  buscarPorCodigoBarrasLocal,
  buscarVariantesLocal,
  obtenerMarcasYCategoriasLocal,
  obtenerProductoPorVarianteIdLocal,
  obtenerProductosPorVarianteIdsLocal,
} from "@/lib/catalogoLocal";
import { CatalogoCompleto } from "@/services/catalogo";
import { ProductoBase, ProductoVariante } from "@/types";

function base(overrides: Partial<ProductoBase> & { id: string; nombre: string }): ProductoBase {
  return {
    marca: undefined,
    categoria: undefined,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function variante(
  overrides: Partial<ProductoVariante> & {
    id: string;
    productoBaseId: string;
    codigoBarras: string;
    nombreCompleto: string;
  }
): ProductoVariante {
  return {
    atributos: {},
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

const bases: ProductoBase[] = [
  base({ id: "base-1", nombre: "Leche", marca: "La Serenísima", categoria: "Lácteos" }),
  base({ id: "base-2", nombre: "Yerba", marca: "Playadito", categoria: "Almacén" }),
  base({ id: "base-3", nombre: "Nutriben", marca: "Alter", categoria: "Cereal Infantil" }),
];

const variantes: ProductoVariante[] = [
  variante({ id: "v1", productoBaseId: "base-1", codigoBarras: "111", nombreCompleto: "Leche Entera 1L" }),
  variante({ id: "v2", productoBaseId: "base-1", codigoBarras: "222", nombreCompleto: "Leche Descremada 1L" }),
  variante({ id: "v3", productoBaseId: "base-2", codigoBarras: "333", nombreCompleto: "Con Palo 1kg" }),
  variante({ id: "v4", productoBaseId: "base-3", codigoBarras: "444", nombreCompleto: "Trigo y Miel 400g" }),
  // huérfana a propósito: apunta a una base que no existe en el catálogo
  variante({ id: "v5", productoBaseId: "base-inexistente", codigoBarras: "555", nombreCompleto: "Fantasma" }),
];

const catalogo: CatalogoCompleto = {
  bases,
  variantes,
  definiciones: { default: [], porCategoria: {} },
};

describe("buscarPorCodigoBarrasLocal", () => {
  it("encuentra por EAN exacto", () => {
    const resultado = buscarPorCodigoBarrasLocal(catalogo, "111");
    expect(resultado?.base.nombre).toBe("Leche");
    expect(resultado?.variante.nombreCompleto).toBe("Leche Entera 1L");
  });

  it("devuelve null si el EAN no existe", () => {
    expect(buscarPorCodigoBarrasLocal(catalogo, "000")).toBeNull();
  });

  it("devuelve null si la variante existe pero su base no (huérfana)", () => {
    expect(buscarPorCodigoBarrasLocal(catalogo, "555")).toBeNull();
  });
});

describe("obtenerProductoPorVarianteIdLocal", () => {
  it("encuentra por id de variante", () => {
    expect(obtenerProductoPorVarianteIdLocal(catalogo, "v3")?.base.nombre).toBe("Yerba");
  });

  it("devuelve null si el id no existe", () => {
    expect(obtenerProductoPorVarianteIdLocal(catalogo, "no-existe")).toBeNull();
  });
});

describe("obtenerProductosPorVarianteIdsLocal", () => {
  it("arma el índice deduplicando ids repetidos", () => {
    const resultado = obtenerProductosPorVarianteIdsLocal(catalogo, ["v1", "v1", "v2"]);
    expect(Object.keys(resultado).sort()).toEqual(["v1", "v2"]);
  });

  it("omite ids inexistentes en vez de incluir undefined", () => {
    const resultado = obtenerProductosPorVarianteIdsLocal(catalogo, ["v1", "no-existe"]);
    expect(Object.keys(resultado)).toEqual(["v1"]);
  });

  it("batch vacío devuelve objeto vacío sin iterar", () => {
    expect(obtenerProductosPorVarianteIdsLocal(catalogo, [])).toEqual({});
  });

  it("omite variantes huérfanas (base inexistente)", () => {
    const resultado = obtenerProductosPorVarianteIdsLocal(catalogo, ["v5"]);
    expect(resultado).toEqual({});
  });
});

describe("buscarVariantesLocal", () => {
  it("término menor a 2 caracteres devuelve vacío", () => {
    expect(buscarVariantesLocal(catalogo, "a")).toEqual([]);
  });

  it("matchea por nombreCompleto de la variante", () => {
    const resultado = buscarVariantesLocal(catalogo, "descremada");
    expect(resultado.map((p) => p.variante.id)).toEqual(["v2"]);
  });

  it("matchea por nombre de la base (aunque no aparezca en nombreCompleto)", () => {
    const resultado = buscarVariantesLocal(catalogo, "nutriben");
    expect(resultado.map((p) => p.variante.id)).toEqual(["v4"]);
  });

  it("matchea por marca de la base (aunque no aparezca en nombreCompleto)", () => {
    const resultado = buscarVariantesLocal(catalogo, "playadito");
    expect(resultado.map((p) => p.variante.id)).toEqual(["v3"]);
  });

  it("dedupe: una variante que matchea por nombreCompleto Y por base aparece una sola vez", () => {
    // "leche" matchea nombreCompleto ("Leche Entera 1L"/"Leche Descremada 1L")
    // Y el nombre de la base ("Leche") simultáneamente para v1 y v2.
    const resultado = buscarVariantesLocal(catalogo, "leche");
    expect(resultado.map((p) => p.variante.id).sort()).toEqual(["v1", "v2"]);
  });

  it("case-insensitive", () => {
    const resultado = buscarVariantesLocal(catalogo, "LECHE");
    expect(resultado.map((p) => p.variante.id).sort()).toEqual(["v1", "v2"]);
  });

  it("sanitiza comas sin dejar de matchear", () => {
    const resultado = buscarVariantesLocal(catalogo, "leche,");
    expect(resultado.map((p) => p.variante.id).sort()).toEqual(["v1", "v2"]);
  });

  it("ignora variantes huérfanas sin crashear", () => {
    const resultado = buscarVariantesLocal(catalogo, "fantasma");
    expect(resultado).toEqual([]);
  });

  it("corta en el límite de resultados", () => {
    const muchasVariantes: ProductoVariante[] = Array.from({ length: 40 }, (_, i) =>
      variante({
        id: `bulk-${i}`,
        productoBaseId: "base-1",
        codigoBarras: `bulk-${i}`,
        nombreCompleto: `Producto Bulk ${i}`,
      })
    );
    const catalogoGrande: CatalogoCompleto = {
      bases,
      variantes: muchasVariantes,
      definiciones: { default: [], porCategoria: {} },
    };
    const resultado = buscarVariantesLocal(catalogoGrande, "bulk");
    expect(resultado.length).toBe(30);
  });
});

describe("obtenerMarcasYCategoriasLocal", () => {
  it("deduplica y ordena, excluyendo undefined", () => {
    const catalogoConDuplicados: CatalogoCompleto = {
      bases: [
        ...bases,
        base({ id: "base-4", nombre: "Otra Leche", marca: "La Serenísima", categoria: "Lácteos" }),
        base({ id: "base-5", nombre: "Sin marca ni categoría" }),
      ],
      variantes,
      definiciones: { default: [], porCategoria: {} },
    };
    const { marcas, categorias } = obtenerMarcasYCategoriasLocal(catalogoConDuplicados);
    expect(marcas).toEqual(["Alter", "La Serenísima", "Playadito"]);
    expect(categorias).toEqual(["Almacén", "Cereal Infantil", "Lácteos"]);
  });
});
