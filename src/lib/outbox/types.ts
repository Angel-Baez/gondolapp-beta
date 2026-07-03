import { generarUUID } from "@/lib/utils";
import { EstadoReposicion } from "@/types";

/**
 * Cada operación referencia items por id. Cuando el item fue creado offline,
 * ese id es un "tempId" (prefijo "offline:") hasta que la creación se
 * sincronice y se resuelva contra el id real de Supabase.
 */
export type OutboxOperation =
  | {
      id: string;
      type: "reposicion.agregarItem";
      payload: { tempId: string; varianteId: string; cantidad: number };
      createdAt: number;
    }
  | {
      id: string;
      type: "reposicion.actualizarCantidad";
      payload: { id: string; cantidad: number };
      createdAt: number;
    }
  | {
      id: string;
      type: "reposicion.cambiarEstado";
      payload: { id: string; estado: EstadoReposicion };
      createdAt: number;
    }
  | {
      id: string;
      type: "reposicion.eliminarItem";
      payload: { id: string };
      createdAt: number;
    }
  | {
      id: string;
      type: "vencimiento.agregarItem";
      payload: {
        tempId: string;
        varianteId: string;
        fechaVencimiento: string;
        cantidad?: number;
        lote?: string;
      };
      createdAt: number;
    }
  | {
      id: string;
      type: "vencimiento.actualizarFecha";
      payload: { id: string; fechaVencimiento: string };
      createdAt: number;
    }
  | {
      id: string;
      type: "vencimiento.actualizarCantidad";
      payload: { id: string; cantidad: number };
      createdAt: number;
    }
  | {
      id: string;
      type: "vencimiento.eliminarItem";
      payload: { id: string };
      createdAt: number;
    }
  | {
      id: string;
      type: "vencimiento.retirarItem";
      payload: { id: string };
      createdAt: number;
    };

export type OutboxOperationType = OutboxOperation["type"];

export type PayloadOf<T extends OutboxOperationType> = Extract<
  OutboxOperation,
  { type: T }
>["payload"];

/** Prefijo que marca un id generado en el cliente mientras el item no existe todavía en Supabase. */
export const TEMP_ID_PREFIX = "offline:";

export function esTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX);
}

export function crearTempId(): string {
  return `${TEMP_ID_PREFIX}${generarUUID()}`;
}
