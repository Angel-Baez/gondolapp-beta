import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSeleccionMultiple } from "@/hooks/useSeleccionMultiple";

describe("useSeleccionMultiple", () => {
  it("empieza inactivo y sin selección", () => {
    const { result } = renderHook(() => useSeleccionMultiple());
    expect(result.current.activo).toBe(false);
    expect(result.current.cantidad).toBe(0);
  });

  it("activar entra en modo selección", () => {
    const { result } = renderHook(() => useSeleccionMultiple());
    act(() => result.current.activar());
    expect(result.current.activo).toBe(true);
  });

  it("toggle agrega y quita ids de la selección", () => {
    const { result } = renderHook(() => useSeleccionMultiple());
    act(() => result.current.toggle("item-1"));
    expect(result.current.estaSeleccionado("item-1")).toBe(true);
    expect(result.current.cantidad).toBe(1);

    act(() => result.current.toggle("item-1"));
    expect(result.current.estaSeleccionado("item-1")).toBe(false);
    expect(result.current.cantidad).toBe(0);
  });

  it("seleccionarTodos reemplaza la selección completa", () => {
    const { result } = renderHook(() => useSeleccionMultiple());
    act(() => result.current.toggle("item-1"));
    act(() => result.current.seleccionarTodos(["item-2", "item-3"]));

    expect(result.current.estaSeleccionado("item-1")).toBe(false);
    expect(result.current.seleccionados.sort()).toEqual(["item-2", "item-3"]);
  });

  it("limpiarSeleccion vacía la selección sin salir del modo selección", () => {
    const { result } = renderHook(() => useSeleccionMultiple());
    act(() => {
      result.current.activar();
      result.current.toggle("item-1");
    });
    act(() => result.current.limpiarSeleccion());

    expect(result.current.activo).toBe(true);
    expect(result.current.cantidad).toBe(0);
  });

  it("cancelar sale del modo selección y vacía la selección", () => {
    const { result } = renderHook(() => useSeleccionMultiple());
    act(() => {
      result.current.activar();
      result.current.toggle("item-1");
    });
    act(() => result.current.cancelar());

    expect(result.current.activo).toBe(false);
    expect(result.current.cantidad).toBe(0);
  });
});
