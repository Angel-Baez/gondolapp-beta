import { beforeAll, describe, expect, it } from "vitest";
import {
  crearClienteAdmin,
  crearUsuarioDePrueba,
  eliminarUsuarioDePrueba,
  verificarConfiguracion,
} from "./helpers";

/**
 * Smoke test del harness: verifica que el stack responde, que la Admin API
 * puede crear/borrar usuarios y que un usuario autenticado con JWT real
 * puede consultar sin error. No asegura nada sobre RLS — eso es la suite de
 * aislamiento de la Fase 2 (docs/SPECMULTIUSER.md §2.4); este test debe
 * seguir verde en todas las fases.
 */

beforeAll(() => {
  verificarConfiguracion();
});

describe("harness de integración (smoke)", () => {
  it("crea un usuario real, consulta autenticado y lo elimina", async () => {
    const admin = crearClienteAdmin();
    const usuario = await crearUsuarioDePrueba(admin);
    expect(usuario.id).toBeTruthy();

    // El contenido visible depende de la fase de RLS; que la query no
    // falle es lo único invariante entre fases.
    const { error } = await usuario.client
      .from("producto_bases")
      .select("id", { head: true, count: "exact" });
    expect(error).toBeNull();

    await eliminarUsuarioDePrueba(admin, usuario);
  });
});
