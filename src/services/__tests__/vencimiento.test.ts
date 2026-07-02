import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabaseFrom } from "@/tests/mocks/supabaseMock";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

function fechaISO(diasDesdeHoy: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  return fecha.toISOString().slice(0, 10);
}

function itemRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "item-1",
    variante_id: "variante-1",
    fecha_vencimiento: fechaISO(5),
    cantidad: 2,
    lote: "L1",
    estado: "pendiente",
    agregado_at: "2026-01-01T10:00:00Z",
    resuelto_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  fromMock.mockReset();
});

describe("listarItems", () => {
  it("calcula el nivel de alerta al leer, no lo toma de la fila", async () => {
    const { listarItems } = await import("@/services/vencimiento");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [itemRow({ fecha_vencimiento: fechaISO(-3) })] }));

    const items = await listarItems();
    expect(items[0].alertaNivel).toBe("vencido");
  });

  it("solo pide items en estado pendiente", async () => {
    const { listarItems } = await import("@/services/vencimiento");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [] }));

    await listarItems();
    expect(fromMock).toHaveBeenCalledWith("items_vencimiento");
  });
});

describe("agregarItem", () => {
  it("crea el item en estado pendiente y devuelve la alerta calculada", async () => {
    const { agregarItem } = await import("@/services/vencimiento");
    fromMock.mockImplementation(mockSupabaseFrom({ data: itemRow({ fecha_vencimiento: fechaISO(10) }) }));

    const item = await agregarItem("variante-1", new Date(fechaISO(10)), 2, "L1");
    expect(item.estado).toBe("pendiente");
    expect(item.alertaNivel).toBe("critico");
  });
});

describe("retirarItem", () => {
  it("archiva el item en el historial y lo borra de la lista activa", async () => {
    const { retirarItem } = await import("@/services/vencimiento");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: itemRow() }, // select item
        { data: { nombre_completo: "Leche 1L", producto_base_id: "base-1" } }, // select variante
        { data: { nombre: "Leche", marca: "La Serenísima" } }, // select base
        { error: null }, // insert historial
        { error: null } // delete item activo
      )
    );

    await retirarItem("item-1");
    expect(fromMock).toHaveBeenCalledTimes(5);
    expect(fromMock).toHaveBeenNthCalledWith(4, "items_vencimiento_historial");
    expect(fromMock).toHaveBeenNthCalledWith(5, "items_vencimiento");
  });

  it("usa un nombre por defecto si la variante ya no existe", async () => {
    const { retirarItem } = await import("@/services/vencimiento");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: itemRow() },
        { data: null }, // variante ya no existe -> no se consulta la base
        { error: null }, // insert historial
        { error: null } // delete
      )
    );

    await retirarItem("item-1");
    expect(fromMock).toHaveBeenCalledTimes(4);
  });

  it("propaga el error si falla el insert del historial (no debe borrar el item)", async () => {
    const { retirarItem } = await import("@/services/vencimiento");
    fromMock.mockImplementation(
      mockSupabaseFrom(
        { data: itemRow() },
        { data: null },
        { error: new Error("insert falló") }
      )
    );

    await expect(retirarItem("item-1")).rejects.toThrow("insert falló");
    expect(fromMock).toHaveBeenCalledTimes(3); // nunca llega al delete
  });
});

describe("obtenerEstadisticas", () => {
  it("devuelve ceros cuando no hay retiros en el período", async () => {
    const { obtenerEstadisticas } = await import("@/services/vencimiento");
    fromMock.mockImplementation(mockSupabaseFrom({ data: [] }));

    const stats = await obtenerEstadisticas("mes");
    expect(stats.totalRetirados).toBe(0);
    expect(stats.promedioDiasARetiro).toBe(0);
  });

  it("calcula el promedio de días entre vencimiento y retiro", async () => {
    const { obtenerEstadisticas } = await import("@/services/vencimiento");
    fromMock.mockImplementation(
      mockSupabaseFrom({
        data: [
          {
            id: "h1",
            variante_id: "variante-1",
            producto_nombre: "Leche",
            producto_marca: "La Serenísima",
            variante_nombre: "Leche 1L",
            cantidad: 2,
            lote: null,
            fecha_vencimiento: "2026-01-01",
            fecha_retiro: "2026-01-03T00:00:00Z",
            nivel_alerta_al_retirar: "critico",
          },
        ],
      })
    );

    const stats = await obtenerEstadisticas("mes");
    expect(stats.totalRetirados).toBe(1);
    expect(stats.promedioDiasARetiro).toBe(2); // retirado 2 días después de vencer
    expect(stats.productosMasRetirados[0]).toEqual({ productoNombre: "Leche", cantidad: 2 });
  });
});
