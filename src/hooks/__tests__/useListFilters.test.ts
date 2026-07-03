import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useListFilters } from "@/hooks/useListFilters";
import { useUiStore } from "@/store/ui";

describe("useListFilters", () => {
  beforeEach(() => {
    // El store es un singleton de módulo: resetear filtros entre tests
    useUiStore.setState({
      filters: {
        reposicion: { busqueda: "", orden: "recientes" },
        vencimiento: { busqueda: "", orden: "vencimiento" },
      },
    });
  });

  it("empieza sin búsqueda y con el orden inicial", () => {
    const { result } = renderHook(() =>
      useListFilters("reposicion", "recientes")
    );
    expect(result.current.busqueda).toBe("");
    expect(result.current.orden).toBe("recientes");
  });

  it("coincide con cualquier texto cuando la búsqueda está vacía", () => {
    const { result } = renderHook(() =>
      useListFilters("reposicion", "recientes")
    );
    expect(result.current.coincide("Leche", "La Serenísima")).toBe(true);
  });

  it("coincide por nombre o por marca, sin importar mayúsculas", () => {
    const { result } = renderHook(() =>
      useListFilters("reposicion", "recientes")
    );
    act(() => result.current.setBusqueda("serenisima"));
    // no coincide porque "Serenísima" con tilde != "serenisima" (coincidencia literal, no normaliza acentos)
    expect(result.current.coincide("Leche", "La Serenísima")).toBe(false);

    act(() => result.current.setBusqueda("leche"));
    expect(result.current.coincide("Leche Entera", "La Serenísima")).toBe(true);

    act(() => result.current.setBusqueda("nestlé"));
    expect(result.current.coincide("Chocolate", "Nestlé")).toBe(true);
  });

  it("actualiza el orden seleccionado", () => {
    const { result } = renderHook(() =>
      useListFilters("reposicion", "recientes")
    );
    act(() => result.current.setOrden("nombre"));
    expect(result.current.orden).toBe("nombre");
  });

  it("mantiene la búsqueda por vista al cambiar de tab", () => {
    const repo = renderHook(() => useListFilters("reposicion", "recientes"));
    act(() => repo.result.current.setBusqueda("leche"));

    const venc = renderHook(() => useListFilters("vencimiento", "vencimiento"));
    expect(venc.result.current.busqueda).toBe("");
    expect(repo.result.current.busqueda).toBe("leche");
  });
});
