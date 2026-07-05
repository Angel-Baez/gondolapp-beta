import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockSupabaseFrom } from "@/tests/mocks/supabaseMock";

const fromMock = vi.fn();
const createMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class AnthropicMock {
    messages = { create: createMock };
  },
}));

beforeEach(() => {
  fromMock.mockReset();
  createMock.mockReset();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
});

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

// parsearProducto trae contexto con 3 llamadas a supabase.from:
// marcas/categorias, categoria_atributos y producto_bases.
function mockContexto() {
  fromMock.mockImplementation(
    mockSupabaseFrom(
      { data: [{ marca: "Milex", categoria: "Lácteos" }] },
      {
        data: [
          { categoria: null, clave: "tipo", etiqueta: "Tipo", orden: 0, sugerencias: [] },
          { categoria: null, clave: "sabor", etiqueta: "Sabor", orden: 1, sugerencias: [] },
          { categoria: null, clave: "tamano", etiqueta: "Tamaño", orden: 2, sugerencias: [] },
        ],
      },
      { data: [{ nombre: "Leche Milex", marca: "Milex", categoria: "Lácteos" }] }
    )
  );
}

function respuestaIA(json: unknown) {
  return {
    stop_reason: "end_turn",
    content: [{ type: "text", text: JSON.stringify(json) }],
  };
}

describe("mapearRespuestaParseo", () => {
  it("convierte el array de pares a Record y limpia vacíos", async () => {
    const { mapearRespuestaParseo } = await import("@/services/parseoProducto");
    const parsed = mapearRespuestaParseo({
      nombreBase: " Leche Milex ",
      marca: "Milex",
      categoria: "Lácteos",
      atributos: [
        { clave: "tipo", valor: "Original" },
        { clave: "tamano", valor: "2200g" },
        { clave: "  ", valor: "basura" },
        { clave: "sabor", valor: "" },
      ],
    });

    expect(parsed).toEqual({
      productoBase: { nombre: "Leche Milex", marca: "Milex", categoria: "Lácteos" },
      atributos: { tipo: "Original", tamano: "2200g" },
    });
  });

  it("categoria vacía queda undefined (opcional en el DTO)", async () => {
    const { mapearRespuestaParseo } = await import("@/services/parseoProducto");
    const parsed = mapearRespuestaParseo({
      nombreBase: "Yerba",
      marca: "Playadito",
      categoria: "",
      atributos: [],
    });
    expect(parsed.productoBase.categoria).toBeUndefined();
  });

  it("rechaza shapes inválidos con ParseoInvalidoError", async () => {
    const { mapearRespuestaParseo, ParseoInvalidoError } = await import(
      "@/services/parseoProducto"
    );
    expect(() => mapearRespuestaParseo(null)).toThrow(ParseoInvalidoError);
    expect(() =>
      mapearRespuestaParseo({ nombreBase: "", marca: "X", atributos: [] })
    ).toThrow(ParseoInvalidoError);
    expect(() =>
      mapearRespuestaParseo({ nombreBase: "X", marca: "Y", atributos: "no-array" })
    ).toThrow(ParseoInvalidoError);
    expect(() =>
      mapearRespuestaParseo({
        nombreBase: "X",
        marca: "Y",
        atributos: [{ clave: 42, valor: "Z" }],
      })
    ).toThrow(ParseoInvalidoError);
  });
});

describe("parsearProducto", () => {
  it("lanza IANoConfiguradaError sin ANTHROPIC_API_KEY (la route responde 503)", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { parsearProducto, IANoConfiguradaError } = await import(
      "@/services/parseoProducto"
    );
    await expect(parsearProducto("Leche Milex 2200g")).rejects.toThrow(
      IANoConfiguradaError
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("arma el prompt con el catálogo y devuelve el parseo mapeado", async () => {
    mockContexto();
    createMock.mockResolvedValue(
      respuestaIA({
        nombreBase: "Leche Milex",
        marca: "Milex",
        categoria: "Lácteos",
        atributos: [{ clave: "tamano", valor: "2200g" }],
      })
    );
    const { parsearProducto } = await import("@/services/parseoProducto");

    const parsed = await parsearProducto("leche milex 2200 gramos");

    expect(parsed.productoBase).toEqual({
      nombre: "Leche Milex",
      marca: "Milex",
      categoria: "Lácteos",
    });
    expect(parsed.atributos).toEqual({ tamano: "2200g" });

    // El contexto del catálogo viaja en el system prompt (matcheo canónico),
    // como bloque con cache_control para abaratar requests repetidos.
    const llamada = createMock.mock.calls[0][0];
    expect(llamada.model).toBe("claude-haiku-4-5");
    expect(llamada.system).toHaveLength(1);
    expect(llamada.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(llamada.system[0].text).toContain("Milex");
    expect(llamada.system[0].text).toContain("Leche Milex");
    expect(llamada.system[0].text).toContain("Lácteos");
    expect(llamada.messages).toEqual([
      { role: "user", content: "leche milex 2200 gramos" },
    ]);
  });

  it("rechaza respuestas truncadas (stop_reason distinto de end_turn)", async () => {
    mockContexto();
    createMock.mockResolvedValue({
      stop_reason: "max_tokens",
      content: [{ type: "text", text: "{" }],
    });
    const { parsearProducto, ParseoInvalidoError } = await import(
      "@/services/parseoProducto"
    );
    await expect(parsearProducto("algo")).rejects.toThrow(ParseoInvalidoError);
  });
});
