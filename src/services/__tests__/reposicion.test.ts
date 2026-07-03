import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabaseFrom } from "@/tests/mocks/supabaseMock";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

function itemRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-1",
    variante_id: "variante-1",
    cantidad: 3,
    estado: "pendiente",
    agregado_at: "2026-01-01T10:00:00Z",
    actualizado_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  fromMock.mockReset();
});

describe("listarItems", () => {
  it("mapea las filas a ItemReposicion", async () => {
    const { listarItems } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [itemRow()] }));

    const items = await listarItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "item-1", varianteId: "variante-1", cantidad: 3, estado: "pendiente" });
    expect(items[0].agregadoAt).toBeInstanceOf(Date);
  });
});

describe("agregarItem", () => {
  it("suma la cantidad a un item pendiente existente de la misma variante", async () => {
    const { agregarItem } = await import("@/services/reposicion");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: [itemRow({ cantidad: 3 })] }, // busca existente (cualquier estado)
        { data: itemRow({ cantidad: 5 }) } // update con la suma
      )
    );

    const item = await agregarItem("variante-1", 2);
    expect(item.cantidad).toBe(5);
    expect(fromMock).toHaveBeenCalledTimes(2);
  });

  it("crea un item nuevo si no hay ninguno para esa variante", async () => {
    const { agregarItem } = await import("@/services/reposicion");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: [] }, // no hay ninguno
        { data: itemRow({ id: "item-nuevo", cantidad: 4 }) } // insert
      )
    );

    const item = await agregarItem("variante-1", 4);
    expect(item.id).toBe("item-nuevo");
    expect(item.estado).toBe("pendiente");
  });

  it("reabre y fusiona cantidad contra un item ya repuesto/sin_stock de la misma variante", async () => {
    const { agregarItem } = await import("@/services/reposicion");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: [itemRow({ cantidad: 2, estado: "sin_stock" })] }, // existente, no pendiente
        { data: itemRow({ cantidad: 3, estado: "pendiente" }) } // update: suma y reabre a pendiente
      )
    );

    const item = await agregarItem("variante-1", 1);
    expect(item.cantidad).toBe(3);
    expect(item.estado).toBe("pendiente");
  });
});

describe("actualizarCantidad", () => {
  it("borra el item en vez de actualizar cuando la cantidad llega a 0", async () => {
    const { actualizarCantidad } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ error: null })); // delete

    const resultado = await actualizarCantidad("item-1", 0);
    expect(resultado).toBeNull();
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  it("actualiza la cantidad normalmente cuando es mayor a 0", async () => {
    const { actualizarCantidad } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ data: itemRow({ cantidad: 7 }) }));

    const resultado = await actualizarCantidad("item-1", 7);
    expect(resultado?.cantidad).toBe(7);
  });
});

describe("cambiarEstado", () => {
  it("actualiza el estado del item", async () => {
    const { cambiarEstado } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ data: itemRow({ estado: "repuesto" }) }));

    const item = await cambiarEstado("item-1", "repuesto");
    expect(item.estado).toBe("repuesto");
  });
});

describe("guardarListaActual", () => {
  it("lanza un error si no hay items para guardar", async () => {
    const { guardarListaActual } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [] })); // listarItems vacío

    await expect(guardarListaActual()).rejects.toThrow("No hay items para guardar");
  });

  it("snapshotea los items en el historial y limpia la lista activa", async () => {
    const { guardarListaActual } = await import("@/services/reposicion");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: [itemRow({ estado: "repuesto" })] }, // listarItems
        { data: [{ id: "variante-1", nombre_completo: "Leche 1L", producto_base_id: "base-1" }] }, // variantes
        { data: [{ id: "base-1", nombre: "Leche", marca: "La Serenísima" }] }, // bases
        { data: { id: "lista-1" } }, // insert listas_reposicion_historial
        { error: null }, // insert items_reposicion_historial
        { error: null } // delete (limpiarListaActual)
      )
    );

    await guardarListaActual();
    expect(fromMock).toHaveBeenCalledTimes(6);
    expect(fromMock).toHaveBeenNthCalledWith(4, "listas_reposicion_historial");
    expect(fromMock).toHaveBeenNthCalledWith(5, "items_reposicion_historial");
    expect(fromMock).toHaveBeenNthCalledWith(6, "items_reposicion");
  });
});

describe("obtenerHistorial", () => {
  it("devuelve un array vacío si no hay listas guardadas", async () => {
    const { obtenerHistorial } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [] }));

    const listas = await obtenerHistorial();
    expect(listas).toEqual([]);
    expect(fromMock).toHaveBeenCalledTimes(1); // no consulta items si no hay listas
  });

  it("agrupa los items por lista", async () => {
    const { obtenerHistorial } = await import("@/services/reposicion");
    const listaRow = {
      id: "lista-1",
      fecha_creacion: "2026-01-01T00:00:00Z",
      fecha_guardado: "2026-01-01T12:00:00Z",
      total_productos: 1,
      total_repuestos: 1,
      total_sin_stock: 0,
      total_pendientes: 0,
      duracion_minutos: null,
      ubicacion: null,
    };
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: [listaRow] },
        {
          data: [
            {
              id: "hist-1",
              lista_id: "lista-1",
              variante_id: "variante-1",
              producto_nombre: "Leche",
              producto_marca: "La Serenísima",
              variante_nombre: "Leche 1L",
              cantidad: 3,
              estado: "repuesto",
            },
          ],
        }
      )
    );

    const listas = await obtenerHistorial();
    expect(listas).toHaveLength(1);
    expect(listas[0].items).toHaveLength(1);
    expect(listas[0].resumen.totalRepuestos).toBe(1);
  });
});
