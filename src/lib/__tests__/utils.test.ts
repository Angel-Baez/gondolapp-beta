import { describe, expect, it } from "vitest";
import {
  calcularDiasRestantes,
  calcularNivelAlerta,
  formatearFecha,
  generarUUID,
} from "@/lib/utils";

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
