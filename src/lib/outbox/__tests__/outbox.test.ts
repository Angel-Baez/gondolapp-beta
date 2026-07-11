import { beforeEach, describe, expect, it, vi } from "vitest";

const memoria = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  get: vi.fn(async (key: string) => memoria.get(key)),
  set: vi.fn(async (key: string, val: unknown) => {
    memoria.set(key, val);
  }),
  del: vi.fn(async (key: string) => {
    memoria.delete(key);
  }),
  createStore: vi.fn(() => ({})),
}));

vi.mock("@/lib/outbox/executors", () => ({
  ejecutarOperacion: vi.fn(),
}));

beforeEach(() => {
  memoria.clear();
  vi.clearAllMocks();
});

describe("enqueueOperation / countPending", () => {
  it("agrega una operación a la cola y actualiza el contador", async () => {
    const { enqueueOperation, countPending } = await import("@/lib/outbox/outbox");

    expect(await countPending()).toBe(0);
    await enqueueOperation("reposicion.actualizarCantidad", { id: "item-1", cantidad: 3 });
    expect(await countPending()).toBe(1);

    const { useOutboxStore } = await import("@/store/outbox");
    expect(useOutboxStore.getState().pendingCount).toBe(1);
  });
});

describe("processQueue", () => {
  it("procesa las operaciones en orden y vacía la cola cuando todas resuelven", async () => {
    const { enqueueOperation, processQueue, countPending } = await import(
      "@/lib/outbox/outbox"
    );
    const { ejecutarOperacion } = await import("@/lib/outbox/executors");
    vi.mocked(ejecutarOperacion).mockResolvedValue(undefined);

    await enqueueOperation("reposicion.eliminarItem", { id: "item-1" });
    await enqueueOperation("reposicion.eliminarItem", { id: "item-2" });

    await processQueue();

    expect(await countPending()).toBe(0);
    expect(ejecutarOperacion).toHaveBeenCalledTimes(2);
  });

  it("remapea el tempId de una creación offline a las operaciones encoladas después", async () => {
    const { enqueueOperation, processQueue } = await import("@/lib/outbox/outbox");
    const { ejecutarOperacion } = await import("@/lib/outbox/executors");

    await enqueueOperation("reposicion.agregarItem", {
      tempId: "offline:abc",
      varianteId: "variante-1",
      cantidad: 1,
    });
    await enqueueOperation("reposicion.actualizarCantidad", {
      id: "offline:abc",
      cantidad: 3,
    });

    vi.mocked(ejecutarOperacion).mockImplementation(async (op) => {
      if (op.type === "reposicion.agregarItem") {
        return { tempId: op.payload.tempId, realId: "real-1" };
      }
      return undefined;
    });

    await processQueue();

    expect(ejecutarOperacion).toHaveBeenCalledTimes(2);
    // La segunda llamada debe poder resolver "offline:abc" -> "real-1" via resolveId
    const resolveIdSegundaLlamada = vi.mocked(ejecutarOperacion).mock.calls[1][1];
    expect(resolveIdSegundaLlamada("offline:abc")).toBe("real-1");
  });

  it("corta la corrida y deja la cola intacta ante un error de red", async () => {
    const { enqueueOperation, processQueue, countPending } = await import(
      "@/lib/outbox/outbox"
    );
    const { ejecutarOperacion } = await import("@/lib/outbox/executors");
    vi.mocked(ejecutarOperacion).mockRejectedValue(new TypeError("Failed to fetch"));

    await enqueueOperation("reposicion.eliminarItem", { id: "item-1" });
    await processQueue();

    expect(await countPending()).toBe(1);
  });

  it("corta la corrida sin descartar ante un JWT expirado (PGRST301/401)", async () => {
    const { enqueueOperation, processQueue, countPending } = await import(
      "@/lib/outbox/outbox"
    );
    const { ejecutarOperacion } = await import("@/lib/outbox/executors");
    vi.mocked(ejecutarOperacion).mockRejectedValue(
      Object.assign(new Error("JWT expired"), { code: "PGRST301" })
    );

    await enqueueOperation("reposicion.eliminarItem", { id: "item-1" });
    await enqueueOperation("reposicion.eliminarItem", { id: "item-2" });
    await processQueue();

    // Nada se descarta: el trabajo offline se reintenta tras el refresh.
    expect(await countPending()).toBe(2);
    expect(ejecutarOperacion).toHaveBeenCalledTimes(1);
  });

  it("corta la corrida ante un 401 sin código PGRST", async () => {
    const { enqueueOperation, processQueue, countPending } = await import(
      "@/lib/outbox/outbox"
    );
    const { ejecutarOperacion } = await import("@/lib/outbox/executors");
    vi.mocked(ejecutarOperacion).mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 })
    );

    await enqueueOperation("reposicion.eliminarItem", { id: "item-1" });
    await processQueue();

    expect(await countPending()).toBe(1);
  });

  it("descarta una operación con error de datos (no de red) y sigue con el resto", async () => {
    const { enqueueOperation, processQueue, countPending } = await import(
      "@/lib/outbox/outbox"
    );
    const { ejecutarOperacion } = await import("@/lib/outbox/executors");
    vi.mocked(ejecutarOperacion)
      .mockRejectedValueOnce(new Error("item no existe"))
      .mockResolvedValueOnce(undefined);

    await enqueueOperation("reposicion.eliminarItem", { id: "item-1" });
    await enqueueOperation("reposicion.eliminarItem", { id: "item-2" });

    await processQueue();

    expect(await countPending()).toBe(0);
    expect(ejecutarOperacion).toHaveBeenCalledTimes(2);
  });
});
