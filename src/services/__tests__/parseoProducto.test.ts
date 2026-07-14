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

const fetchMock = vi.fn();

beforeEach(() => {
  fromMock.mockReset();
  createMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  delete process.env.GEMINI_API_KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GEMINI_API_KEY;
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

// Respuesta exitosa de Gemini generateContent con el JSON dado.
function respuestaGemini(json: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(json) }] },
        },
      ],
    }),
  };
}

describe("parsearProducto", () => {
  it("lanza IANoConfiguradaError sin ninguna API key (la route responde 503)", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { parsearProducto, IANoConfiguradaError } = await import(
      "@/services/parseoProducto"
    );
    await expect(parsearProducto("Leche Milex 2200g", "tienda-test")).rejects.toThrow(
      IANoConfiguradaError
    );
    expect(createMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
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

    const parsed = await parsearProducto("leche milex 2200 gramos", "tienda-test");

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
    await expect(parsearProducto("algo", "tienda-test")).rejects.toThrow(ParseoInvalidoError);
  });

  it("usa Gemini directamente cuando solo hay GEMINI_API_KEY", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.GEMINI_API_KEY = "AIza-test";
    mockContexto();
    fetchMock.mockResolvedValue(
      respuestaGemini({
        nombreBase: "Leche Milex",
        marca: "Milex",
        categoria: "Lácteos",
        atributos: [{ clave: "tamano", valor: "2200g" }],
      })
    );
    const { parsearProducto } = await import("@/services/parseoProducto");

    const parsed = await parsearProducto("leche milex 2200g", "tienda-test");

    expect(createMock).not.toHaveBeenCalled();
    expect(parsed.productoBase.nombre).toBe("Leche Milex");
    expect(parsed.atributos).toEqual({ tamano: "2200g" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("gemini-3.1-flash-lite:generateContent");
    const body = JSON.parse(init.body);
    // El catálogo viaja como systemInstruction también en Gemini
    expect(body.systemInstruction.parts[0].text).toContain("Leche Milex");
    expect(body.contents).toEqual([
      { role: "user", parts: [{ text: "leche milex 2200g" }] },
    ]);
  });

  it("cae a Gemini cuando Anthropic falla (ej: crédito agotado)", async () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    mockContexto();
    createMock.mockRejectedValue(
      new Error("Your credit balance is too low to access the Anthropic API")
    );
    fetchMock.mockResolvedValue(
      respuestaGemini({
        nombreBase: "Compota",
        marca: "Gerber",
        categoria: "",
        atributos: [],
      })
    );
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { parsearProducto } = await import("@/services/parseoProducto");

    const parsed = await parsearProducto("compota gerber", "tienda-test");

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(parsed.productoBase).toEqual({
      nombre: "Compota",
      marca: "Gerber",
      categoria: undefined,
    });
    warnSpy.mockRestore();
  });

  it("propaga el error de Anthropic si Gemini no está configurado", async () => {
    mockContexto();
    createMock.mockRejectedValue(new Error("rate limited"));
    const { parsearProducto } = await import("@/services/parseoProducto");

    await expect(parsearProducto("algo", "tienda-test")).rejects.toThrow("rate limited");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza respuestas de Gemini con finishReason distinto de STOP", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.GEMINI_API_KEY = "AIza-test";
    mockContexto();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            finishReason: "MAX_TOKENS",
            content: { parts: [{ text: "{" }] },
          },
        ],
      }),
    });
    const { parsearProducto, ParseoInvalidoError } = await import(
      "@/services/parseoProducto"
    );
    await expect(parsearProducto("algo", "tienda-test")).rejects.toThrow(ParseoInvalidoError);
  });
});
