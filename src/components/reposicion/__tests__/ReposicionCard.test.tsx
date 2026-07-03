import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ItemReposicion, ProductoBase, ProductoVariante } from "@/types";
import { ReposicionCard } from "@/components/reposicion/ReposicionCard";

const mocks = vi.hoisted(() => ({
  cambiarEstadoMasivo: vi.fn(),
}));

// Se mockea el módulo de hooks completo: el componente solo necesita las
// funciones mutate, no el stack react-query + outbox + supabase real.
vi.mock("@/hooks/useReposicion", () => ({
  useActualizarCantidadReposicion: () => ({ mutate: vi.fn() }),
  useCambiarEstadoMasivo: () => ({ mutate: mocks.cambiarEstadoMasivo }),
  useCambiarEstadoReposicion: () => ({ mutate: vi.fn() }),
  useDecrementarReposicion: () => vi.fn(),
  useEliminarReposicionItemDirecto: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/hooks/useHaptics", () => ({
  useHaptics: () => ({ haptic: vi.fn() }),
}));

const BASE: ProductoBase = {
  id: "base-1",
  nombre: "Leche Entera",
  marca: "La Serenísima",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function variante(id: string, estado: ItemReposicion["estado"] = "pendiente") {
  const item: ItemReposicion = {
    id: `item-${id}`,
    varianteId: `var-${id}`,
    cantidad: 2,
    estado,
    agregadoAt: new Date("2026-01-01T00:00:00Z"),
    actualizadoAt: new Date("2026-01-01T00:00:00Z"),
  };
  const varianteProducto: ProductoVariante = {
    id: `var-${id}`,
    productoBaseId: BASE.id,
    codigoBarras: `77900000${id}`,
    nombreCompleto: `Leche Entera ${id}L`,
    tamano: `${id}L`,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
  return { item, variante: varianteProducto };
}

describe("ReposicionCard — check rápido del header", () => {
  it("marca todas las variantes como repuesto en 1 tap sin expandir la card", () => {
    mocks.cambiarEstadoMasivo.mockClear();
    const onToggleExpand = vi.fn();
    render(
      <ReposicionCard
        productoBase={BASE}
        variantes={[variante("1"), variante("2")]}
        isExpanded={false}
        onToggleExpand={onToggleExpand}
      />
    );

    fireEvent.click(screen.getByTitle("Marcar como repuesto"));

    expect(mocks.cambiarEstadoMasivo).toHaveBeenCalledWith(
      { ids: ["item-1", "item-2"], estado: "repuesto" },
      expect.anything()
    );
    // El tap en el check no debe disparar el expand del header
    expect(onToggleExpand).not.toHaveBeenCalled();
  });

  it("no muestra el check cuando la card no está en pendientes", () => {
    render(
      <ReposicionCard
        productoBase={BASE}
        variantes={[variante("1", "repuesto")]}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />
    );
    expect(screen.queryByTitle("Marcar como repuesto")).toBeNull();
  });

  it("no muestra el check en modo selección múltiple", () => {
    render(
      <ReposicionCard
        productoBase={BASE}
        variantes={[variante("1")]}
        isExpanded={false}
        onToggleExpand={vi.fn()}
        seleccionActiva
        estaSeleccionado={() => false}
        onToggleSeleccion={vi.fn()}
      />
    );
    expect(screen.queryByTitle("Marcar como repuesto")).toBeNull();
  });

  it("oculta el badge de variantes cuando hay una sola", () => {
    render(
      <ReposicionCard
        productoBase={BASE}
        variantes={[variante("1")]}
        isExpanded={false}
        onToggleExpand={vi.fn()}
      />
    );
    expect(screen.queryByText(/variantes/)).toBeNull();
  });
});
