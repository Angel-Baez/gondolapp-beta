import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useListFilters } from "@/hooks/useListFilters";

describe("useListFilters", () => {
  it("empieza sin búsqueda y con el orden inicial", () => {
    const { result } = renderHook(() => useListFilters("recientes"));
    expect(result.current.busqueda).toBe("");
    expect(result.current.orden).toBe("recientes");
  });

  it("coincide con cualquier texto cuando la búsqueda está vacía", () => {
    const { result } = renderHook(() => useListFilters("recientes"));
    expect(result.current.coincide("Leche", "La Serenísima")).toBe(true);
  });

  it("coincide por nombre o por marca, sin importar mayúsculas", () => {
    const { result } = renderHook(() => useListFilters("recientes"));
    act(() => result.current.setBusqueda("serenisima"));
    // no coincide porque "Serenísima" con tilde != "serenisima" (coincidencia literal, no normaliza acentos)
    expect(result.current.coincide("Leche", "La Serenísima")).toBe(false);

    act(() => result.current.setBusqueda("leche"));
    expect(result.current.coincide("Leche Entera", "La Serenísima")).toBe(true);

    act(() => result.current.setBusqueda("nestlé"));
    expect(result.current.coincide("Chocolate", "Nestlé")).toBe(true);
  });

  it("actualiza el orden seleccionado", () => {
    const { result } = renderHook(() => useListFilters("recientes"));
    act(() => result.current.setOrden("nombre"));
    expect(result.current.orden).toBe("nombre");
  });
});
