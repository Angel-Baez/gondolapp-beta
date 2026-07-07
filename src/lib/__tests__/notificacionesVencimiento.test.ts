import { describe, expect, it } from "vitest";
import {
  construirMensaje,
  esUrgente,
  ItemNotificable,
  podarNotificados,
  seleccionarItemsANotificar,
} from "@/lib/notificacionesVencimiento";
import { AlertaNivel } from "@/types";

function diasDesdeHoy(dias: number): Date {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

function item(
  id: string,
  alertaNivel: AlertaNivel,
  diasRestantes = 0,
  nombre = `Producto ${id}`
): ItemNotificable {
  return { id, nombre, alertaNivel, fechaVencimiento: diasDesdeHoy(diasRestantes) };
}

describe("esUrgente", () => {
  it("solo vencido y crítico son urgentes", () => {
    expect(esUrgente("vencido")).toBe(true);
    expect(esUrgente("critico")).toBe(true);
    expect(esUrgente("advertencia")).toBe(false);
    expect(esUrgente("precaucion")).toBe(false);
    expect(esUrgente("normal")).toBe(false);
  });
});

describe("seleccionarItemsANotificar", () => {
  it("incluye urgentes nuevos y excluye niveles no urgentes", () => {
    const items = [item("a", "critico", 5), item("b", "advertencia", 20)];
    expect(seleccionarItemsANotificar(items, {})).toEqual([items[0]]);
  });

  it("no repite un item ya notificado en el mismo nivel", () => {
    const items = [item("a", "critico", 5)];
    expect(seleccionarItemsANotificar(items, { a: "critico" })).toEqual([]);
  });

  it("vuelve a notificar cuando un crítico pasa a vencido", () => {
    const items = [item("a", "vencido", -1)];
    expect(seleccionarItemsANotificar(items, { a: "critico" })).toEqual(items);
  });
});

describe("podarNotificados", () => {
  it("elimina del registro los items que ya no están urgentes", () => {
    const items = [item("a", "critico", 5), item("c", "normal", 90)];
    // "b" fue retirado y "c" corrigió su fecha: ambos salen del registro.
    expect(podarNotificados({ a: "critico", b: "vencido", c: "critico" }, items)).toEqual({
      a: "critico",
    });
  });
});

describe("construirMensaje", () => {
  it("para un solo item usa el nombre como título y la urgencia en el cuerpo", () => {
    const { titulo, cuerpo } = construirMensaje([
      item("a", "critico", 0, "Leche Entera 1L"),
    ]);
    expect(titulo).toBe("Leche Entera 1L");
    expect(cuerpo).toContain("¡Vence hoy!");
  });

  it("para varios items resume la cantidad y lista los nombres", () => {
    const { titulo, cuerpo } = construirMensaje([
      item("a", "vencido", -1, "Leche"),
      item("b", "critico", 2, "Yogur"),
    ]);
    expect(titulo).toBe("2 productos urgentes por vencimiento");
    expect(cuerpo).toBe("Leche, Yogur");
  });

  it("con más de 4 items corta la lista y agrega el resto como contador", () => {
    const items = ["A", "B", "C", "D", "E", "F"].map((nombre, i) =>
      item(String(i), "critico", 1, nombre)
    );
    const { cuerpo } = construirMensaje(items);
    expect(cuerpo).toBe("A, B, C, D y 2 más");
  });
});
