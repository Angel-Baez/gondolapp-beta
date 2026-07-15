import { supabase } from "@/lib/supabase";
import type { RolTienda } from "@/store/sesion";

/**
 * Gestión de tienda y equipo (Fase 3, docs/SPECMULTIUSER.md §3.3):
 * tiendas, miembros, roles e invitaciones. Todo online-only — esta capa no
 * pasa por el outbox: administrar el equipo sin conexión no es un caso de
 * uso y los errores (guard "último admin", código inválido) deben verse
 * en el momento.
 */

export interface MiembroTienda {
  userId: string;
  email: string;
  nombre: string;
  rol: RolTienda;
  creadoAt: Date;
}

export interface InvitacionTienda {
  id: string;
  codigo: string;
  rol: RolTienda;
  usos: number;
  maxUsos: number;
  expiraAt: Date;
  revocada: boolean;
  creadaAt: Date;
}

interface MiembroRow {
  user_id: string;
  email: string;
  nombre: string;
  rol: RolTienda;
  creado_at: string;
}

interface InvitacionRow {
  id: string;
  codigo: string;
  rol: RolTienda;
  usos: number;
  max_usos: number;
  expira_at: string;
  revocada: boolean;
  created_at: string;
}

export async function obtenerNombreTienda(tiendaId: string): Promise<string> {
  const { data, error } = await supabase
    .from("tiendas")
    .select("nombre")
    .eq("id", tiendaId)
    .single();
  if (error) throw error;
  return data.nombre as string;
}

export async function renombrarTienda(
  tiendaId: string,
  nombre: string
): Promise<void> {
  const { error } = await supabase
    .from("tiendas")
    .update({ nombre: nombre.trim() })
    .eq("id", tiendaId);
  if (error) throw error;
}

export async function listarMiembros(
  tiendaId: string
): Promise<MiembroTienda[]> {
  const { data, error } = await supabase.rpc("miembros_de_tienda", {
    p_tienda_id: tiendaId,
  });
  if (error) throw error;
  return ((data ?? []) as MiembroRow[]).map((row) => ({
    userId: row.user_id,
    email: row.email,
    nombre: row.nombre,
    rol: row.rol,
    creadoAt: new Date(row.creado_at),
  }));
}

/** Nombre propio (tabla perfiles): lo ven los compañeros en la atribución
 * de items y listas. */
export async function obtenerMiNombre(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data.nombre as string;
}

export async function actualizarMiNombre(
  userId: string,
  nombre: string
): Promise<void> {
  const { error } = await supabase
    .from("perfiles")
    .update({ nombre: nombre.trim() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function cambiarRolMiembro(
  tiendaId: string,
  userId: string,
  rol: RolTienda
): Promise<void> {
  const { error } = await supabase
    .from("tienda_miembros")
    .update({ rol })
    .eq("tienda_id", tiendaId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Expulsar a otro miembro (admin) o salir uno mismo: misma fila, misma
 * policy (delete admin-o-propio). El guard "último admin" puede rechazarlo. */
export async function quitarMiembro(
  tiendaId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("tienda_miembros")
    .delete()
    .eq("tienda_id", tiendaId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function listarInvitaciones(
  tiendaId: string
): Promise<InvitacionTienda[]> {
  const { data, error } = await supabase
    .from("tienda_invitaciones")
    .select("id, codigo, rol, usos, max_usos, expira_at, revocada, created_at")
    .eq("tienda_id", tiendaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as InvitacionRow[]).map((row) => ({
    id: row.id,
    codigo: row.codigo,
    rol: row.rol,
    usos: row.usos,
    maxUsos: row.max_usos,
    expiraAt: new Date(row.expira_at),
    revocada: row.revocada,
    creadaAt: new Date(row.created_at),
  }));
}

export async function generarInvitacion(
  tiendaId: string,
  rol: RolTienda,
  maxUsos: number,
  dias: number
): Promise<string> {
  const { data, error } = await supabase.rpc("generar_codigo_invitacion", {
    p_tienda_id: tiendaId,
    p_rol: rol,
    p_max_usos: maxUsos,
    p_dias: dias,
  });
  if (error) throw error;
  return data as string;
}

export async function revocarInvitacion(invitacionId: string): Promise<void> {
  const { error } = await supabase
    .from("tienda_invitaciones")
    .update({ revocada: true })
    .eq("id", invitacionId);
  if (error) throw error;
}

/** Devuelve el id de la tienda a la que se unió. */
export async function canjearInvitacion(codigo: string): Promise<string> {
  const { data, error } = await supabase.rpc("canjear_invitacion", {
    p_codigo: codigo.trim().toUpperCase(),
  });
  if (error) throw error;
  return data as string;
}

/** Devuelve el id de la tienda creada (el creador queda como admin). */
export async function crearTienda(nombre: string): Promise<string> {
  const { data, error } = await supabase.rpc("crear_tienda_con_admin", {
    p_nombre: nombre.trim(),
  });
  if (error) throw error;
  return data as string;
}
