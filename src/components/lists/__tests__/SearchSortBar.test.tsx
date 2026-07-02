import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchSortBar } from "@/components/lists/SearchSortBar";

const OPCIONES = [
  { value: "recientes", label: "Más recientes" },
  { value: "nombre", label: "Nombre (A-Z)" },
];

describe("SearchSortBar", () => {
  it("dispara onBusquedaChange al escribir", () => {
    const onBusquedaChange = vi.fn();
    render(
      <SearchSortBar
        busqueda=""
        onBusquedaChange={onBusquedaChange}
        orden="recientes"
        onOrdenChange={vi.fn()}
        opcionesOrden={OPCIONES}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Buscar producto..."), {
      target: { value: "leche" },
    });
    expect(onBusquedaChange).toHaveBeenCalledWith("leche");
  });

  it("dispara onOrdenChange al cambiar el select", () => {
    const onOrdenChange = vi.fn();
    render(
      <SearchSortBar
        busqueda=""
        onBusquedaChange={vi.fn()}
        orden="recientes"
        onOrdenChange={onOrdenChange}
        opcionesOrden={OPCIONES}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "nombre" } });
    expect(onOrdenChange).toHaveBeenCalledWith("nombre");
  });

  it("renderiza todas las opciones de orden", () => {
    render(
      <SearchSortBar
        busqueda=""
        onBusquedaChange={vi.fn()}
        orden="recientes"
        onOrdenChange={vi.fn()}
        opcionesOrden={OPCIONES}
      />
    );

    expect(screen.getByRole("option", { name: "Más recientes" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Nombre (A-Z)" })).toBeInTheDocument();
  });
});
