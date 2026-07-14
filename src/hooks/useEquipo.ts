"use client";

import { useAuth } from "@/components/AuthProvider";
import {
  invitacionesKey,
  miembrosKey,
  SIN_TIENDA,
  tiendaMetaKey,
} from "@/lib/queryKeys";
import * as equipoService from "@/services/equipo";
import type { RolTienda } from "@/store/sesion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hooks de la pantalla /tienda (Fase 3): nombre, miembros, roles e
 * invitaciones. Online-only: sin outbox ni optimismo — los errores del
 * servidor (guard "último admin", permisos) son parte del flujo y deben
 * llegar al caller tal cual.
 */

function useEquipoScope() {
  const { tiendaActiva, rol } = useAuth();
  const tiendaId = tiendaActiva ?? SIN_TIENDA;
  return {
    tiendaActiva,
    esAdmin: rol === "admin",
    META_KEY: tiendaMetaKey(tiendaId),
    MIEMBROS_KEY: miembrosKey(tiendaId),
    INVITACIONES_KEY: invitacionesKey(tiendaId),
  };
}

export function useNombreTienda() {
  const { tiendaActiva, META_KEY } = useEquipoScope();
  return useQuery({
    queryKey: META_KEY,
    queryFn: () => equipoService.obtenerNombreTienda(tiendaActiva!),
    enabled: !!tiendaActiva,
  });
}

export function useRenombrarTienda() {
  const { tiendaActiva, META_KEY } = useEquipoScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) =>
      equipoService.renombrarTienda(tiendaActiva!, nombre),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: META_KEY }),
  });
}

export function useMiembros() {
  const { tiendaActiva, MIEMBROS_KEY } = useEquipoScope();
  return useQuery({
    queryKey: MIEMBROS_KEY,
    queryFn: () => equipoService.listarMiembros(tiendaActiva!),
    enabled: !!tiendaActiva,
  });
}

export function useCambiarRol() {
  const { tiendaActiva, MIEMBROS_KEY } = useEquipoScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, rol }: { userId: string; rol: RolTienda }) =>
      equipoService.cambiarRolMiembro(tiendaActiva!, userId, rol),
    onSettled: () => queryClient.invalidateQueries({ queryKey: MIEMBROS_KEY }),
  });
}

/** Expulsar a otro miembro o salir uno mismo (misma operación de DB). */
export function useQuitarMiembro() {
  const { tiendaActiva, MIEMBROS_KEY } = useEquipoScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      equipoService.quitarMiembro(tiendaActiva!, userId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: MIEMBROS_KEY }),
  });
}

export function useInvitaciones() {
  const { tiendaActiva, esAdmin, INVITACIONES_KEY } = useEquipoScope();
  return useQuery({
    queryKey: INVITACIONES_KEY,
    queryFn: () => equipoService.listarInvitaciones(tiendaActiva!),
    // RLS solo se las muestra a admins; ni consultarlas como empleado.
    enabled: !!tiendaActiva && esAdmin,
  });
}

export function useGenerarInvitacion() {
  const { tiendaActiva, INVITACIONES_KEY } = useEquipoScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rol,
      maxUsos,
      dias,
    }: {
      rol: RolTienda;
      maxUsos: number;
      dias: number;
    }) => equipoService.generarInvitacion(tiendaActiva!, rol, maxUsos, dias),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: INVITACIONES_KEY }),
  });
}

export function useRevocarInvitacion() {
  const { INVITACIONES_KEY } = useEquipoScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitacionId: string) =>
      equipoService.revocarInvitacion(invitacionId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: INVITACIONES_KEY }),
  });
}
