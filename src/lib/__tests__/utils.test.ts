import { describe, expect, it } from "vitest";
import {
  calcularDiasRestantes,
  calcularNivelAlerta,
  construirNombreCompleto,
  formatearFecha,
  generarUUID,
  mensajeVencimiento,
  ordenarClavesAtributos,
  sumarDias,
  toDateInputValue,
} from "@/lib/utils";

describe("construirNombreCompleto", () => {
  it("arma nombre + tipo + sabor + tamaño cuando todo está presente", () => {
    expect(
      construirNombreCompleto("Leche", { tipo: "Entera", sabor: "Vainilla", tamano: "1L" })
    ).toBe("Leche Entera Vainilla 1L");
  });

  it("omite tipo si no está presente, sin dejar espacios de más", () => {
    expect(construirNombreCompleto("Leche", { tamano: "1L" })).toBe("Leche 1L");
  });

  it("siempre incluye el nombre de la base aunque no haya atributos", () => {
    expect(construirNombreCompleto("Yerba", {})).toBe("Yerba");
  });

  it("ignora campos vacíos o solo espacios", () => {
    expect(construirNombreCompleto("Yerba", { tipo: "  ", tamano: "1kg" })).toBe("Yerba 1kg");
  });

  it("pone claves desconocidas al final, en orden alfabético", () => {
    expect(
      construirNombreCompleto("Destornillador", {
        medida: "PH2",
        tamano: "150mm",
        material: "Acero",
      })
    ).toBe("Destornillador 150mm Acero PH2");
  });

  it("respeta un orden de claves custom (definición por categoría)", () => {
    expect(
      construirNombreCompleto(
        "Destornillador",
        { medida: "PH2", material: "Acero" },
        ["medida", "material"]
      )
    ).toBe("Destornillador PH2 Acero");
  });
});

describe("ordenarClavesAtributos", () => {
  it("ordena las claves conocidas según el orden default", () => {
    expect(
      ordenarClavesAtributos({ tamano: "1L", tipo: "Entera", sabor: "Vainilla" })
    ).toEqual(["tipo", "sabor", "tamano"]);
  });

  it("agrega las desconocidas al final en orden alfabético", () => {
    expect(
      ordenarClavesAtributos({ zeta: "z", tamano: "1L", alfa: "a" })
    ).toEqual(["tamano", "alfa", "zeta"]);
  });
});

function diasDesdeHoy(dias: number): Date {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

describe("calcularNivelAlerta", () => {
  it("marca como vencido un producto cuya fecha ya pasó", () => {
    expect(calcularNivelAlerta(diasDesdeHoy(-1))).toBe("vencido");
    expect(calcularNivelAlerta(diasDesdeHoy(-30))).toBe("vencido");
  });

  it("marca como critico entre 0 y 15 días", () => {
    expect(calcularNivelAlerta(diasDesdeHoy(0))).toBe("critico");
    expect(calcularNivelAlerta(diasDesdeHoy(15))).toBe("critico");
  });

  it("marca como advertencia entre 16 y 30 días (más urgente que precaución)", () => {
    expect(calcularNivelAlerta(diasDesdeHoy(16))).toBe("advertencia");
    expect(calcularNivelAlerta(diasDesdeHoy(30))).toBe("advertencia");
  });

  it("marca como precaucion entre 31 y 60 días (menos urgente que advertencia)", () => {
    expect(calcularNivelAlerta(diasDesdeHoy(31))).toBe("precaucion");
    expect(calcularNivelAlerta(diasDesdeHoy(60))).toBe("precaucion");
  });

  it("marca como normal a más de 60 días", () => {
    expect(calcularNivelAlerta(diasDesdeHoy(61))).toBe("normal");
    expect(calcularNivelAlerta(diasDesdeHoy(365))).toBe("normal");
  });
});

describe("calcularDiasRestantes", () => {
  it("calcula días positivos para fechas futuras", () => {
    expect(calcularDiasRestantes(diasDesdeHoy(10))).toBe(10);
  });

  it("calcula días negativos para fechas pasadas", () => {
    expect(calcularDiasRestantes(diasDesdeHoy(-5))).toBe(-5);
  });

  it("devuelve 0 para hoy", () => {
    expect(calcularDiasRestantes(diasDesdeHoy(0))).toBe(0);
  });
});

describe("formatearFecha", () => {
  it("formatea una fecha en español", () => {
    const resultado = formatearFecha(new Date("2026-03-15T00:00:00"));
    expect(resultado).toContain("2026");
    expect(resultado.toLowerCase()).toContain("marzo");
  });
});

describe("mensajeVencimiento", () => {
  it("cubre hoy, mañana, futuro y pasado con plurales correctos", () => {
    expect(mensajeVencimiento(diasDesdeHoy(0))).toBe("¡Vence hoy!");
    expect(mensajeVencimiento(diasDesdeHoy(1))).toBe("Vence mañana");
    expect(mensajeVencimiento(diasDesdeHoy(5))).toBe("Vence en 5 días");
    expect(mensajeVencimiento(diasDesdeHoy(-1))).toBe("Venció hace 1 día");
    expect(mensajeVencimiento(diasDesdeHoy(-3))).toBe("Venció hace 3 días");
  });
});

describe("toDateInputValue", () => {
  it("serializa en horario local, no en UTC", () => {
    expect(toDateInputValue(new Date(2026, 6, 7))).toBe("2026-07-07");
  });

  it("hace roundtrip con el parseo a medianoche local (convención del módulo)", () => {
    // Invariante que rompía toISOString(): en husos UTC- la medianoche local
    // cae en el día anterior en UTC y la fecha se corría un día.
    const valor = "2026-03-15";
    expect(toDateInputValue(new Date(`${valor}T00:00:00`))).toBe(valor);
  });
});

describe("sumarDias", () => {
  it("suma días sobre una base explícita, normalizada a medianoche", () => {
    const resultado = sumarDias(7, new Date(2026, 0, 30, 15, 45));
    expect(toDateInputValue(resultado)).toBe("2026-02-06");
    expect(resultado.getHours()).toBe(0);
  });
});

describe("generarUUID", () => {
  it("genera un UUID v4 válido", () => {
    const uuid = generarUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("genera valores distintos en llamadas sucesivas", () => {
    const uuids = new Set(Array.from({ length: 20 }, () => generarUUID()));
    expect(uuids.size).toBe(20);
  });
});
