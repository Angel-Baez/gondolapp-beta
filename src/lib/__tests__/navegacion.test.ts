import { describe, expect, it } from "vitest";
import { destinoSeguro } from "@/lib/navegacion";

describe("destinoSeguro", () => {
  it("acepta rutas relativas de la app", () => {
    expect(destinoSeguro("/unirse?codigo=ABC23456")).toBe(
      "/unirse?codigo=ABC23456"
    );
    expect(destinoSeguro("/tienda")).toBe("/tienda");
  });

  it("rechaza URLs absolutas y protocol-relative (open redirect)", () => {
    expect(destinoSeguro("https://evil.com")).toBe("/");
    expect(destinoSeguro("//evil.com")).toBe("/");
    expect(destinoSeguro("javascript:alert(1)")).toBe("/");
  });

  it("cae a / cuando falta el parámetro", () => {
    expect(destinoSeguro(null)).toBe("/");
    expect(destinoSeguro(undefined)).toBe("/");
    expect(destinoSeguro("")).toBe("/");
  });
});
