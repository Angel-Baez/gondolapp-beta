import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eanQueryKey, useScanProduct } from "@/hooks/useScanProduct";
import type { ProductoCompleto } from "@/services/catalogo";

vi.mock("@/services/catalogo", () => ({
  buscarPorCodigoBarras: vi.fn(),
}));

const PRODUCTO: ProductoCompleto = {
  base: {
    id: "base-1",
    nombre: "Leche Entera",
    marca: "La Serenísima",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  variante: {
    id: "var-1",
    productoBaseId: "base-1",
    codigoBarras: "7790000000001",
    nombreCompleto: "Leche Entera 1L",
    tamano: "1L",
    createdAt: new Date(),
  },
};

function setup(queryClient = new QueryClient()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useScanProduct(), { wrapper });
  return { result, queryClient };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useScanProduct", () => {
  it("producto en catálogo → found, y queda cacheado por EAN", async () => {
    const { buscarPorCodigoBarras } = await import("@/services/catalogo");
    vi.mocked(buscarPorCodigoBarras).mockResolvedValue(PRODUCTO);
    const { result, queryClient } = setup();

    const res = await result.current.scanProduct("7790000000001");

    expect(res.status).toBe("found");
    if (res.status !== "found") throw new Error("unreachable");
    expect(res.producto.variante.id).toBe("var-1");
    expect(queryClient.getQueryData(eanQueryKey("7790000000001"))).toBeTruthy();

    // Segundo escaneo del mismo EAN: sale del cache, sin otro round-trip
    await result.current.scanProduct("7790000000001");
    expect(buscarPorCodigoBarras).toHaveBeenCalledTimes(1);
  });

  it("null del servicio → not_found (habilita el alta manual)", async () => {
    const { buscarPorCodigoBarras } = await import("@/services/catalogo");
    vi.mocked(buscarPorCodigoBarras).mockResolvedValue(null);
    const { result } = setup();

    const res = await result.current.scanProduct("999");
    expect(res.status).toBe("not_found");
  });

  it("throw del servicio (red caída) → error, nunca not_found", async () => {
    const { buscarPorCodigoBarras } = await import("@/services/catalogo");
    vi.mocked(buscarPorCodigoBarras).mockRejectedValue(
      new Error("TypeError: Failed to fetch")
    );
    const { result } = setup();

    const res = await result.current.scanProduct("7790000000001");
    expect(res.status).toBe("error");
  });

  it("seedProducto deja el EAN resuelto para el próximo escaneo", async () => {
    const { buscarPorCodigoBarras } = await import("@/services/catalogo");
    const { result } = setup();

    result.current.seedProducto("555", {
      base: { id: "b", nombre: "Nuevo" },
      variante: { id: "v", nombreCompleto: "Nuevo 500g" },
    });

    const res = await result.current.scanProduct("555");
    expect(res.status).toBe("found");
    expect(buscarPorCodigoBarras).not.toHaveBeenCalled();
  });
});
