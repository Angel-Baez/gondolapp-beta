import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabaseFrom } from "@/tests/mocks/supabaseMock";

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
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
  rpcMock.mockReset();
});

describe("listarItems", () => {
  it("mapea las filas a ItemReposicion", async () => {
    const { listarItems } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [itemRow()] }));

    const items = await listarItems("tienda-test");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "item-1", varianteId: "variante-1", cantidad: 3, estado: "pendiente" });
    expect(items[0].agregadoAt).toBeInstanceOf(Date);
  });
});

describe("agregarItem", () => {
  it("delega en la RPC agregar_item_reposicion (upsert atómico en la DB, 1 round-trip)", async () => {
    const { agregarItem } = await import("@/services/reposicion");
    // El merge (sumar cantidad, reabrir a pendiente) vive en la función SQL:
    // acá solo se verifica la delegación y el mapeo de la fila devuelta.
    rpcMock.mockResolvedValue({ data: itemRow({ cantidad: 5 }), error: null });

    const item = await agregarItem("variante-1", 2);
    expect(item.cantidad).toBe(5);
    expect(item.estado).toBe("pendiente");
    expect(item.agregadoAt).toBeInstanceOf(Date);
    expect(rpcMock).toHaveBeenCalledWith("agregar_item_reposicion", {
      p_variante_id: "variante-1",
      p_cantidad: 2,
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga el error de la RPC", async () => {
    const { agregarItem } = await import("@/services/reposicion");
    rpcMock.mockResolvedValue({ data: null, error: new Error("db error") });

    await expect(agregarItem("variante-1", 2)).rejects.toThrow("db error");
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

describe("cambiarEstadoMasivo", () => {
  it("actualiza el estado de varios items en un solo round-trip", async () => {
    const { cambiarEstadoMasivo } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ error: null }));

    await cambiarEstadoMasivo(["item-1", "item-2"], "repuesto");
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("items_reposicion");
  });
});

describe("eliminarItemsMasivo", () => {
  it("elimina varios items en un solo round-trip", async () => {
    const { eliminarItemsMasivo } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ error: null }));

    await eliminarItemsMasivo(["item-1", "item-2"]);
    expect(fromMock).toHaveBeenCalledTimes(1);
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
  it("delega en la RPC guardar_lista_reposicion (snapshot + limpieza atómicos)", async () => {
    const { guardarListaActual } = await import("@/services/reposicion");
    rpcMock.mockResolvedValue({ data: "lista-1", error: null });

    await guardarListaActual("tienda-test");
    expect(rpcMock).toHaveBeenCalledWith("guardar_lista_reposicion", {
      p_tienda_id: "tienda-test",
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga el error de la RPC (ej. 'No hay items para guardar')", async () => {
    const { guardarListaActual } = await import("@/services/reposicion");
    rpcMock.mockResolvedValue({ data: null, error: new Error("No hay items para guardar") });

    await expect(guardarListaActual("tienda-test")).rejects.toThrow("No hay items para guardar");
  });
});

describe("obtenerHistorial", () => {
  it("devuelve un array vacío si no hay listas guardadas", async () => {
    const { obtenerHistorial } = await import("@/services/reposicion");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [] }));

    const listas = await obtenerHistorial("tienda-test");
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

    const listas = await obtenerHistorial("tienda-test");
    expect(listas).toHaveLength(1);
    expect(listas[0].items).toHaveLength(1);
    expect(listas[0].resumen.totalRepuestos).toBe(1);
  });
});
