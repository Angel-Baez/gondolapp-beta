import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpiryQuickSheet } from "@/components/scanner/ExpiryQuickSheet";
import { sumarDias } from "@/lib/utils";

const PRODUCTO = { nombre: "Yogur Bebible 1L" };

function renderSheet(props: Partial<React.ComponentProps<typeof ExpiryQuickSheet>> = {}) {
  const onSubmit = vi.fn();
  render(
    <ExpiryQuickSheet
      isOpen
      producto={PRODUCTO}
      onSubmit={onSubmit}
      onClose={vi.fn()}
      isPending={false}
      {...props}
    />
  );
  return { onSubmit };
}

describe("ExpiryQuickSheet", () => {
  it("un tap en un preset registra directo, sin pasar por Registrar", () => {
    const { onSubmit } = renderSheet();

    fireEvent.click(screen.getByText("+30d"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const { fecha } = onSubmit.mock.calls[0][0];
    expect(fecha.getTime()).toBe(sumarDias(30).getTime());
  });

  it("muestra el chip Misma fecha cuando hay ultimaFecha y confirma en 1 tap", () => {
    const ultimaFecha = sumarDias(45);
    const { onSubmit } = renderSheet({ ultimaFecha });

    fireEvent.click(screen.getByText(/^Misma fecha/));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ fecha: ultimaFecha })
    );
  });

  it("no muestra el chip Misma fecha sin ultimaFecha previa", () => {
    renderSheet();
    expect(screen.queryByText(/^Misma fecha/)).toBeNull();
  });

  it("incluye cantidad y lote de Más opciones al confirmar con preset", () => {
    const { onSubmit } = renderSheet();

    fireEvent.click(screen.getByText("Más opciones (cantidad, lote)"));
    fireEvent.change(screen.getByPlaceholderText("Cantidad (opcional)"), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByPlaceholderText("Lote (opcional, ej: L12345)"), {
      target: { value: "L99" },
    });
    fireEvent.click(screen.getByText("+7d"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ cantidad: 6, lote: "L99" })
    );
  });

  it("con isPending los presets no vuelven a disparar", () => {
    const { onSubmit } = renderSheet({ isPending: true });
    fireEvent.click(screen.getByText("+15d"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("la fecha manual sigue registrando con el botón", () => {
    const { onSubmit } = renderSheet();

    const inputFecha = document.querySelector('input[type="date"]')!;
    fireEvent.change(inputFecha, { target: { value: "2026-08-15" } });
    fireEvent.click(screen.getByText("Registrar"));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    // Medianoche local, consistente con sumarDias y el mapeo del servicio
    expect(onSubmit.mock.calls[0][0].fecha).toEqual(new Date("2026-08-15T00:00:00"));
  });
});
