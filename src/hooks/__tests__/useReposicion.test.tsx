import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ItemReposicion } from "@/types";

vi.mock("@/services/reposicion", () => ({
  actualizarCantidad: vi.fn(),
  eliminarItem: vi.fn(),
  agregarItem: vi.fn(),
  cambiarEstado: vi.fn(),
  listarItems: vi.fn(),
  guardarListaActual: vi.fn(),
  obtenerHistorial: vi.fn(),
  eliminarListaHistorial: vi.fn(),
  obtenerEstadisticas: vi.fn(),
}));

vi.mock("react-hot-toast", () => {
  let ultimoRenderProp: ((t: { id: string }) => React.ReactNode) | null = null;
  const toastFn = Object.assign(
    vi.fn((renderProp: (t: { id: string }) => React.ReactNode) => {
      ultimoRenderProp = renderProp;
      return "toast-1";
    }),
    { dismiss: vi.fn() }
  );
  return {
    default: toastFn,
    __getUltimoRenderProp: () => ultimoRenderProp,
  };
});

const ITEM: ItemReposicion = {
  id: "item-1",
  varianteId: "variante-1",
  cantidad: 1,
  estado: "pendiente",
  agregadoAt: new Date("2026-01-01T00:00:00Z"),
  actualizadoAt: new Date("2026-01-01T00:00:00Z"),
};

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("useDecrementarReposicion", () => {
  it("baja la cantidad normalmente cuando queda arriba de 1", async () => {
    const { useDecrementarReposicion } = await import("@/hooks/useReposicion");
    const { actualizarCantidad } = await import("@/services/reposicion");
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useDecrementarReposicion(), {
      wrapper: wrapper(queryClient),
    });

    act(() => result.current({ ...ITEM, cantidad: 3 }));

    await waitFor(() => expect(actualizarCantidad).toHaveBeenCalledWith("item-1", 2));
  });

  it("al llegar a 0 saca el item del cache al toque y borra recién tras el timeout", async () => {
    vi.useFakeTimers();
    const { useDecrementarReposicion } = await import("@/hooks/useReposicion");
    const { eliminarItem } = await import("@/services/reposicion");
    const queryClient = new QueryClient();
    queryClient.setQueryData(["reposicion", "items"], [ITEM]);

    const { result } = renderHook(() => useDecrementarReposicion(), {
      wrapper: wrapper(queryClient),
    });

    act(() => result.current(ITEM));

    // Optimista: desaparece del cache de inmediato
    expect(queryClient.getQueryData(["reposicion", "items"])).toEqual([]);
    expect(eliminarItem).not.toHaveBeenCalled();

    // Pasado el tiempo de "deshacer", se confirma el borrado real
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(eliminarItem).toHaveBeenCalledWith("item-1");
    vi.useRealTimers();
  });

  it("Deshacer restaura el item y nunca llega a borrarlo", async () => {
    vi.useFakeTimers();
    const { useDecrementarReposicion } = await import("@/hooks/useReposicion");
    const { eliminarItem } = await import("@/services/reposicion");
    const toastModule = (await import("react-hot-toast")) as unknown as {
      __getUltimoRenderProp: () => (t: { id: string }) => React.ReactNode;
    };
    const queryClient = new QueryClient();
    queryClient.setQueryData(["reposicion", "items"], [ITEM]);

    const { result } = renderHook(() => useDecrementarReposicion(), {
      wrapper: wrapper(queryClient),
    });

    act(() => result.current(ITEM));
    expect(queryClient.getQueryData(["reposicion", "items"])).toEqual([]);

    const renderProp = toastModule.__getUltimoRenderProp();
    render(<>{renderProp({ id: "toast-1" })}</>);
    act(() => screen.getByText("Deshacer").click());

    expect(queryClient.getQueryData(["reposicion", "items"])).toEqual([ITEM]);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(eliminarItem).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
