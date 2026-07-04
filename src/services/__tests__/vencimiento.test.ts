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
  rpcMock.mockReset();
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
  it("delega en la RPC retirar_item_vencimiento (archivo + borrado atómicos)", async () => {
    const { retirarItem } = await import("@/services/vencimiento");
    rpcMock.mockResolvedValue({ data: null, error: null });

    await retirarItem("item-1");
    expect(rpcMock).toHaveBeenCalledWith("retirar_item_vencimiento", { p_item_id: "item-1" });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("propaga el error de la RPC", async () => {
    const { retirarItem } = await import("@/services/vencimiento");
    rpcMock.mockResolvedValue({ data: null, error: new Error("item no encontrado") });

    await expect(retirarItem("item-1")).rejects.toThrow("item no encontrado");
  });
});

describe("retirarItemsMasivo", () => {
  it("retira todo el lote con una sola RPC atómica", async () => {
    const { retirarItemsMasivo } = await import("@/services/vencimiento");
    rpcMock.mockResolvedValue({ data: null, error: null });

    await retirarItemsMasivo(["item-1", "item-2"]);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith("retirar_items_vencimiento", {
      p_item_ids: ["item-1", "item-2"],
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("cae al retiro item por item si la función masiva aún no existe (PGRST202)", async () => {
    const { retirarItemsMasivo } = await import("@/services/vencimiento");
    rpcMock
      .mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST202", message: "function not found" },
      })
      .mockResolvedValue({ data: null, error: null });

    await retirarItemsMasivo(["item-1", "item-2"]);
    // 1 intento masivo + 2 retiros individuales
    expect(rpcMock).toHaveBeenCalledTimes(3);
    expect(rpcMock).toHaveBeenCalledWith("retirar_item_vencimiento", { p_item_id: "item-1" });
    expect(rpcMock).toHaveBeenCalledWith("retirar_item_vencimiento", { p_item_id: "item-2" });
  });

  it("propaga errores que no sean de función inexistente", async () => {
    const { retirarItemsMasivo } = await import("@/services/vencimiento");
    rpcMock.mockResolvedValue({
      data: null,
      error: Object.assign(new Error("boom"), { code: "XX000" }),
    });

    await expect(retirarItemsMasivo(["item-1"])).rejects.toThrow("boom");
    expect(rpcMock).toHaveBeenCalledTimes(1);
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
            // Mediodía local (sin Z): fecha_vencimiento se parsea a medianoche
            // local, así el diff da 2 días en cualquier huso horario. Con
            // medianoche UTC el test fallaba en husos negativos (floor de 1.875).
            fecha_retiro: "2026-01-03T12:00:00",
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
