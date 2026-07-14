import { describe, expect, it } from "vitest";
import {
  deserializarConFechas,
  esQueryPersistible,
} from "@/lib/queryPersister";

describe("deserializarConFechas", () => {
  it("revive los campos Date serializados por JSON", () => {
    const item = {
      id: "item-1",
      fechaVencimiento: new Date("2026-07-12T03:00:00.000Z"),
      agregadoAt: new Date("2026-07-01T10:30:00.000Z"),
    };
    const restaurado = deserializarConFechas(JSON.stringify(item));

    expect(restaurado.fechaVencimiento).toBeInstanceOf(Date);
    expect(restaurado.fechaVencimiento.getTime()).toBe(
      item.fechaVencimiento.getTime()
    );
    expect(restaurado.agregadoAt.getTime()).toBe(item.agregadoAt.getTime());
  });

  it("no toca strings comunes ni fechas planas sin hora", () => {
    const restaurado = deserializarConFechas(
      JSON.stringify({
        lote: "L12345",
        nombre: "Leche Entera 1L",
        codigo: "2026-01-01",
        cantidad: 3,
      })
    );

    expect(restaurado.lote).toBe("L12345");
    expect(restaurado.nombre).toBe("Leche Entera 1L");
    expect(restaurado.codigo).toBe("2026-01-01");
    expect(restaurado.cantidad).toBe(3);
  });
});

describe("esQueryPersistible", () => {
  const T = ["tienda", "tienda-test"] as const;

  it("persiste las listas activas, el catálogo completo y los EAN resueltos (con prefijo de tienda)", () => {
    expect(esQueryPersistible([...T, "reposicion", "items"])).toBe(true);
    expect(esQueryPersistible([...T, "vencimiento", "items"])).toBe(true);
    expect(esQueryPersistible([...T, "catalogo", "completo"])).toBe(true);
    expect(esQueryPersistible([...T, "producto", "ean", "779..."])).toBe(true);
  });

  it("no persiste historial, estadísticas ni otras queries", () => {
    expect(esQueryPersistible([...T, "reposicion", "historial"])).toBe(false);
    expect(esQueryPersistible([...T, "vencimiento", "estadisticas", "mes"])).toBe(false);
    expect(esQueryPersistible(["marcas-categorias"])).toBe(false);
  });

  it("no persiste keys sin prefijo de tienda (shape pre-Fase 2)", () => {
    expect(esQueryPersistible(["reposicion", "items"])).toBe(false);
    expect(esQueryPersistible(["catalogo", "completo"])).toBe(false);
  });
});
