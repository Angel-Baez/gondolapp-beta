import { beforeEach, describe, expect, it } from "vitest";
import { useRecentsStore, useRecientes, useFrecuentes } from "../recents";
import { renderHook } from "@testing-library/react";

describe("recents store", () => {
  beforeEach(() => {
    useRecentsStore.setState({ entries: {} });
  });

  it("registrarUso crea una entrada nueva con count 1", () => {
    useRecentsStore
      .getState()
      .registrarUso({ varianteId: "v1", nombre: "Leche", marca: "La Serenísima" });

    const entry = useRecentsStore.getState().entries["v1"];
    expect(entry.count).toBe(1);
    expect(entry.nombre).toBe("Leche");
  });

  it("registrarUso de nuevo sobre el mismo producto suma count y actualiza lastUsed", async () => {
    useRecentsStore.getState().registrarUso({ varianteId: "v1", nombre: "Leche" });
    const primerUso = useRecentsStore.getState().entries["v1"].lastUsed;

    await new Promise((r) => setTimeout(r, 5));
    useRecentsStore.getState().registrarUso({ varianteId: "v1", nombre: "Leche" });

    const entry = useRecentsStore.getState().entries["v1"];
    expect(entry.count).toBe(2);
    expect(entry.lastUsed).toBeGreaterThanOrEqual(primerUso);
  });

  it("useRecientes ordena por lastUsed descendente", () => {
    useRecentsStore.setState({
      entries: {
        v1: { varianteId: "v1", nombre: "A", count: 1, lastUsed: 100 },
        v2: { varianteId: "v2", nombre: "B", count: 1, lastUsed: 300 },
        v3: { varianteId: "v3", nombre: "C", count: 1, lastUsed: 200 },
      },
    });

    const { result } = renderHook(() => useRecientes());
    expect(result.current.map((e) => e.varianteId)).toEqual(["v2", "v3", "v1"]);
  });

  it("useFrecuentes ordena por count descendente", () => {
    useRecentsStore.setState({
      entries: {
        v1: { varianteId: "v1", nombre: "A", count: 5, lastUsed: 100 },
        v2: { varianteId: "v2", nombre: "B", count: 1, lastUsed: 300 },
        v3: { varianteId: "v3", nombre: "C", count: 9, lastUsed: 200 },
      },
    });

    const { result } = renderHook(() => useFrecuentes());
    expect(result.current.map((e) => e.varianteId)).toEqual(["v3", "v1", "v2"]);
  });

  it("useRecientes respeta el límite pasado", () => {
    useRecentsStore.setState({
      entries: {
        v1: { varianteId: "v1", nombre: "A", count: 1, lastUsed: 1 },
        v2: { varianteId: "v2", nombre: "B", count: 1, lastUsed: 2 },
        v3: { varianteId: "v3", nombre: "C", count: 1, lastUsed: 3 },
      },
    });

    const { result } = renderHook(() => useRecientes(2));
    expect(result.current).toHaveLength(2);
  });
});
