import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  crearClienteAdmin,
  crearUsuarioDePrueba,
  eliminarUsuarioDePrueba,
  verificarConfiguracion,
  UsuarioDePrueba,
} from "./helpers";

/**
 * Suite de aislamiento RLS — el gate de la Fase 2 (docs/SPECMULTIUSER.md
 * §2.4): dos usuarios × dos tiendas, por tabla × operación, las RPCs con
 * ids ajenos y el caso multi-membresía de guardar_lista_reposicion.
 *
 * Corre contra un stack real con las migraciones 0001–0015 aplicadas
 * (`supabase start` + `supabase db reset`); ver docs/TESTING.md.
 */

let admin: SupabaseClient;
let userA: UsuarioDePrueba; // admin de tienda A
let userB: UsuarioDePrueba; // admin de tienda B; luego empleado de A (canje)
let tiendaA: string;
let tiendaB: string;
let varianteA: string; // variante del catálogo de A
let varianteB: string;
let itemReposicionA: string; // item de reposición pendiente en A
let itemVencimientoA: string;

async function crearCatalogo(
  client: SupabaseClient,
  tiendaId: string,
  nombre: string,
  ean: string
): Promise<string> {
  const { data: base, error: baseError } = await client
    .from("producto_bases")
    .insert({ tienda_id: tiendaId, nombre, marca: "MarcaTest" })
    .select("id")
    .single();
  if (baseError) throw baseError;
  const { data: variante, error: varError } = await client
    .from("producto_variantes")
    .insert({ producto_base_id: base.id, codigo_barras: ean, atributos: {} })
    .select("id")
    .single();
  if (varError) throw varError;
  return variante.id as string;
}

/** Borra todo lo de una tienda con service_role (bypasea RLS y triggers de invoker). */
async function limpiarTienda(tiendaId: string): Promise<void> {
  for (const tabla of [
    "items_reposicion",
    "items_vencimiento",
    "items_reposicion_historial",
    "listas_reposicion_historial",
    "items_vencimiento_historial",
    "producto_variantes",
    "producto_bases",
    "categoria_atributos",
  ]) {
    await admin.from(tabla).delete().eq("tienda_id", tiendaId);
  }
  await admin.from("tiendas").delete().eq("id", tiendaId);
}

beforeAll(async () => {
  verificarConfiguracion();
  admin = crearClienteAdmin();
  userA = await crearUsuarioDePrueba(admin, "rls-a");
  userB = await crearUsuarioDePrueba(admin, "rls-b");

  const { data: tA, error: eA } = await userA.client.rpc("crear_tienda_con_admin", {
    p_nombre: "Tienda A",
  });
  if (eA) throw eA;
  tiendaA = tA as string;

  const { data: tB, error: eB } = await userB.client.rpc("crear_tienda_con_admin", {
    p_nombre: "Tienda B",
  });
  if (eB) throw eB;
  tiendaB = tB as string;

  varianteA = await crearCatalogo(userA.client, tiendaA, "Leche A", "7790000000001");
  varianteB = await crearCatalogo(userB.client, tiendaB, "Leche B", "7790000000002");

  const { data: item, error: itemError } = await userA.client.rpc(
    "agregar_item_reposicion",
    { p_variante_id: varianteA, p_cantidad: 2 }
  );
  if (itemError) throw itemError;
  itemReposicionA = (item as { id: string }).id;

  const { data: venc, error: vencError } = await userA.client
    .from("items_vencimiento")
    .insert({ variante_id: varianteA, fecha_vencimiento: "2030-01-01" })
    .select("id")
    .single();
  if (vencError) throw vencError;
  itemVencimientoA = venc.id as string;
}, 60_000);

afterAll(async () => {
  if (tiendaA) await limpiarTienda(tiendaA);
  if (tiendaB) await limpiarTienda(tiendaB);
  if (userA) await eliminarUsuarioDePrueba(admin, userA);
  if (userB) await eliminarUsuarioDePrueba(admin, userB);
}, 60_000);

describe("aislamiento por tabla", () => {
  it("SELECT: B no ve el catálogo ni las listas de A", async () => {
    for (const tabla of [
      "producto_bases",
      "producto_variantes",
      "categoria_atributos",
      "items_reposicion",
      "items_vencimiento",
    ]) {
      const { data, error } = await userB.client
        .from(tabla)
        .select("id")
        .eq("tienda_id", tiendaA);
      expect(error, tabla).toBeNull();
      expect(data, tabla).toEqual([]);
    }
  });

  it("SELECT: cada uno ve lo suyo", async () => {
    const { data: propioA } = await userA.client
      .from("producto_variantes")
      .select("id")
      .eq("tienda_id", tiendaA);
    expect(propioA).toHaveLength(1);
    const { data: propioB } = await userB.client
      .from("producto_variantes")
      .select("id")
      .eq("tienda_id", tiendaB);
    expect(propioB).toHaveLength(1);
  });

  it("INSERT: B no puede crear una base con tienda_id de A (WITH CHECK)", async () => {
    const { error } = await userB.client
      .from("producto_bases")
      .insert({ tienda_id: tiendaA, nombre: "Intrusa", marca: "X" });
    expect(error).not.toBeNull();
  });

  it("INSERT: B no puede crear un item apuntando a una variante de A (trigger de derivación)", async () => {
    const { error } = await userB.client
      .from("items_reposicion")
      .insert({ variante_id: varianteA, cantidad: 1, estado: "pendiente" });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/fuera de tus tiendas|inexistente/i);
  });

  it("UPDATE/DELETE: B no modifica ni borra items de A (0 filas afectadas)", async () => {
    const { data: actualizado } = await userB.client
      .from("items_reposicion")
      .update({ cantidad: 99 })
      .eq("id", itemReposicionA)
      .select();
    expect(actualizado).toEqual([]);

    await userB.client.from("items_reposicion").delete().eq("id", itemReposicionA);
    const { data: sigueVivo } = await userA.client
      .from("items_reposicion")
      .select("id, cantidad")
      .eq("id", itemReposicionA)
      .single();
    expect(sigueVivo).not.toBeNull();
    expect(sigueVivo!.cantidad).toBe(2);
  });
});

describe("RPCs con ids ajenos", () => {
  it("agregar_item_reposicion con variante de A falla para B", async () => {
    const { error } = await userB.client.rpc("agregar_item_reposicion", {
      p_variante_id: varianteA,
      p_cantidad: 1,
    });
    expect(error).not.toBeNull();
  });

  it("retirar_item_vencimiento con item de A falla para B", async () => {
    const { error } = await userB.client.rpc("retirar_item_vencimiento", {
      p_item_id: itemVencimientoA,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/no encontrado/i);
  });

  it("retirar_items_vencimiento con ids de A no borra nada", async () => {
    const { error } = await userB.client.rpc("retirar_items_vencimiento", {
      p_item_ids: [itemVencimientoA],
    });
    expect(error).toBeNull(); // set-based: los ajenos simplemente no matchean
    const { data } = await userA.client
      .from("items_vencimiento")
      .select("id")
      .eq("id", itemVencimientoA);
    expect(data).toHaveLength(1);
  });

  it("guardar_lista_reposicion de la tienda A falla para B (no miembro)", async () => {
    const { error } = await userB.client.rpc("guardar_lista_reposicion", {
      p_tienda_id: tiendaA,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/no sos miembro/i);
  });

  it("obtener_estadisticas_vencimiento de A devuelve vacío para B", async () => {
    const { data, error } = await userB.client.rpc(
      "obtener_estadisticas_vencimiento",
      {
        p_tienda_id: tiendaA,
        p_desde: "2000-01-01T00:00:00Z",
        p_hasta: "2100-01-01T00:00:00Z",
      }
    );
    expect(error).toBeNull();
    expect((data as { total_retirados: number }).total_retirados).toBe(0);
  });

  it("generar_codigo_invitacion de A falla para B (no admin de A)", async () => {
    const { error } = await userB.client.rpc("generar_codigo_invitacion", {
      p_tienda_id: tiendaA,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/admin/i);
  });
});

describe("invitaciones y multi-membresía", () => {
  let codigo: string;

  it("el admin de A genera un código y B lo canjea (queda empleado de A)", async () => {
    const { data, error } = await userA.client.rpc("generar_codigo_invitacion", {
      p_tienda_id: tiendaA,
      p_rol: "empleado",
      p_max_usos: 1,
      p_dias: 1,
    });
    expect(error).toBeNull();
    codigo = data as string;
    expect(codigo).toHaveLength(8);

    const { data: tienda, error: canjeError } = await userB.client.rpc(
      "canjear_invitacion",
      { p_codigo: codigo }
    );
    expect(canjeError).toBeNull();
    expect(tienda).toBe(tiendaA);
  });

  it("re-canjear siendo miembro no quema usos y un tercero ya no entra", async () => {
    // B ya es miembro: re-canje idempotente.
    const { error: reCanje } = await userB.client.rpc("canjear_invitacion", {
      p_codigo: codigo,
    });
    expect(reCanje).toBeNull();

    // El único uso lo consumió B: un tercero es rechazado.
    const userC = await crearUsuarioDePrueba(admin, "rls-c");
    try {
      const { error } = await userC.client.rpc("canjear_invitacion", {
        p_codigo: codigo,
      });
      expect(error).not.toBeNull();
      expect(error!.message).toMatch(/inválido|vencido|agotado/i);
    } finally {
      await eliminarUsuarioDePrueba(admin, userC);
    }
  });

  it("un código revocado no se puede canjear", async () => {
    const { data: nuevo } = await userA.client.rpc("generar_codigo_invitacion", {
      p_tienda_id: tiendaA,
    });
    await userA.client
      .from("tienda_invitaciones")
      .update({ revocada: true })
      .eq("codigo", nuevo as string);

    const userC = await crearUsuarioDePrueba(admin, "rls-d");
    try {
      const { error } = await userC.client.rpc("canjear_invitacion", {
        p_codigo: nuevo as string,
      });
      expect(error).not.toBeNull();
    } finally {
      await eliminarUsuarioDePrueba(admin, userC);
    }
  });

  it("multi-membresía + privacidad: guardar la lista de A archiva SOLO lo propio", async () => {
    // B (ahora miembro de A y de B) tiene pendientes propios en ambas
    // tiendas; A además tiene el item de la admin (invisible para B).
    const { error: aggAError } = await userB.client.rpc("agregar_item_reposicion", {
      p_variante_id: varianteA,
      p_cantidad: 3,
    });
    expect(aggAError).toBeNull();
    const { error: aggBError } = await userB.client.rpc("agregar_item_reposicion", {
      p_variante_id: varianteB,
      p_cantidad: 5,
    });
    expect(aggBError).toBeNull();

    const { error: guardarError } = await userB.client.rpc(
      "guardar_lista_reposicion",
      { p_tienda_id: tiendaA }
    );
    expect(guardarError).toBeNull();

    // Los items PROPIOS de B en A se archivaron…
    const { data: itemsBenA } = await userB.client
      .from("items_reposicion")
      .select("id")
      .eq("tienda_id", tiendaA);
    expect(itemsBenA).toEqual([]);
    // …los de la admin en A siguen pendientes (lista privada por usuario)…
    const { data: itemsAdminA } = await userA.client
      .from("items_reposicion")
      .select("id")
      .eq("tienda_id", tiendaA);
    expect(itemsAdminA).toHaveLength(1);
    expect(itemsAdminA![0].id).toBe(itemReposicionA);
    // …y los de B en la tienda B siguen intactos (el WHERE por tienda).
    const { data: itemsB } = await userB.client
      .from("items_reposicion")
      .select("id")
      .eq("tienda_id", tiendaB);
    expect(itemsB).toHaveLength(1);
  });

  it("un empleado no puede borrar historial (delete admin-only)", async () => {
    // El guardado anterior dejó una lista en el historial de A. B es
    // empleado de A: puede verla pero no borrarla.
    const { data: listas } = await userB.client
      .from("listas_reposicion_historial")
      .select("id")
      .eq("tienda_id", tiendaA);
    expect(listas!.length).toBeGreaterThan(0);

    await userB.client
      .from("listas_reposicion_historial")
      .delete()
      .eq("id", listas![0].id);
    const { data: sigue } = await userA.client
      .from("listas_reposicion_historial")
      .select("id")
      .eq("id", listas![0].id);
    expect(sigue).toHaveLength(1);
  });

  it("el mismo EAN es creable en dos tiendas (unicidad por tienda)", async () => {
    // El EAN de la variante de A, creado en B: debe pasar.
    const varianteId = await crearCatalogo(
      userB.client,
      tiendaB,
      "Leche Clon",
      "7790000000001"
    );
    expect(varianteId).toBeTruthy();
  });
});

describe("privacidad de la lista de reposición (migración 0017)", () => {
  // Estado heredado: A tiene a userA (admin, con un item pendiente) y a
  // userB (empleado, sin items en A tras el guardado anterior).

  it("un miembro no ve, edita ni borra los items pendientes de otro", async () => {
    const { data: visibles } = await userB.client
      .from("items_reposicion")
      .select("id")
      .eq("id", itemReposicionA);
    expect(visibles).toEqual([]);

    const { data: actualizados } = await userB.client
      .from("items_reposicion")
      .update({ cantidad: 99 })
      .eq("id", itemReposicionA)
      .select();
    expect(actualizados).toEqual([]);

    const { data: borrados } = await userB.client
      .from("items_reposicion")
      .delete()
      .eq("id", itemReposicionA)
      .select();
    expect(borrados).toEqual([]);
  });

  it("no se puede insertar un item a nombre de otro (WITH CHECK)", async () => {
    const { error } = await userB.client.from("items_reposicion").insert({
      variante_id: varianteA,
      cantidad: 1,
      agregado_por: userA.id,
    });
    expect(error).not.toBeNull();
  });

  it("dos usuarios pueden tener la misma variante pendiente (unicidad por usuario)", async () => {
    // Ana ya tiene varianteA pendiente; B agrega la suya sin mergear la ajena.
    const { data, error } = await userB.client.rpc("agregar_item_reposicion", {
      p_variante_id: varianteA,
      p_cantidad: 1,
    });
    expect(error).toBeNull();
    expect((data as { id: string }).id).not.toBe(itemReposicionA);

    // El item de Ana quedó como estaba (cantidad 2, sin merge cruzado).
    const { data: deAna } = await userA.client
      .from("items_reposicion")
      .select("cantidad")
      .eq("id", itemReposicionA)
      .single();
    expect(deAna!.cantidad).toBe(2);

    // Limpieza: B borra su propio item.
    await userB.client
      .from("items_reposicion")
      .delete()
      .eq("id", (data as { id: string }).id);
  });

  it("los nombres de perfil son visibles entre compañeros de tienda", async () => {
    const { data, error } = await userB.client
      .from("perfiles")
      .select("nombre")
      .eq("user_id", userA.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0].nombre).toBe(userA.email.split("@")[0]);
  });
});

describe("gestión de equipo (Fase 3, migraciones 0016/0017)", () => {
  // Estado heredado del describe anterior: A tiene a userA (admin) y a
  // userB (empleado, vía canje); B tiene solo a userB (admin).

  it("miembros_de_tienda es admin-only: el admin ve nombres y emails", async () => {
    const { data, error } = await userA.client.rpc("miembros_de_tienda", {
      p_tienda_id: tiendaA,
    });
    expect(error).toBeNull();
    const miembros = data as {
      user_id: string;
      email: string;
      nombre: string;
      rol: string;
    }[];
    expect(miembros).toHaveLength(2);
    expect(miembros.map((m) => m.email)).toEqual(
      expect.arrayContaining([userA.email, userB.email])
    );
    expect(miembros.find((m) => m.user_id === userA.id)?.rol).toBe("admin");
    expect(miembros.find((m) => m.user_id === userB.id)?.rol).toBe("empleado");
    expect(miembros.find((m) => m.user_id === userB.id)?.nombre).toBe(
      userB.email.split("@")[0]
    );
  });

  it("miembros_de_tienda devuelve vacío a un empleado", async () => {
    const { data, error } = await userB.client.rpc("miembros_de_tienda", {
      p_tienda_id: tiendaA,
    });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("un empleado no enumera las membresías ajenas de su tienda", async () => {
    const { data } = await userB.client
      .from("tienda_miembros")
      .select("user_id")
      .eq("tienda_id", tiendaA);
    expect(data).toHaveLength(1);
    expect(data![0].user_id).toBe(userB.id);
  });

  it("miembros_de_tienda de una tienda ajena devuelve vacío", async () => {
    // userA nunca fue miembro de B: ni filas ni error que revele existencia.
    const { data, error } = await userA.client.rpc("miembros_de_tienda", {
      p_tienda_id: tiendaB,
    });
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("el último admin no puede degradarse a empleado", async () => {
    const { error } = await userA.client
      .from("tienda_miembros")
      .update({ rol: "empleado" })
      .eq("tienda_id", tiendaA)
      .eq("user_id", userA.id);
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/sin admin/i);
  });

  it("el último admin no puede salir de la tienda", async () => {
    const { error } = await userA.client
      .from("tienda_miembros")
      .delete()
      .eq("tienda_id", tiendaA)
      .eq("user_id", userA.id);
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/sin admin/i);
  });

  it("con otro admin nombrado, el fundador sí puede salir", async () => {
    // userA promueve a userB…
    const { error: promoError } = await userA.client
      .from("tienda_miembros")
      .update({ rol: "admin" })
      .eq("tienda_id", tiendaA)
      .eq("user_id", userB.id);
    expect(promoError).toBeNull();

    // …y ahora sí puede irse.
    const { error: salidaError } = await userA.client
      .from("tienda_miembros")
      .delete()
      .eq("tienda_id", tiendaA)
      .eq("user_id", userA.id);
    expect(salidaError).toBeNull();

    // Para userA la tienda A dejó de existir.
    const { data } = await userA.client
      .from("tiendas")
      .select("id")
      .eq("id", tiendaA);
    expect(data).toEqual([]);
  });
});
