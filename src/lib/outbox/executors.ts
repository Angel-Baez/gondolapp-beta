import * as reposicionService from "@/services/reposicion";
import * as vencimientoService from "@/services/vencimiento";
import { OutboxOperation } from "./types";

export interface ResultadoEjecucion {
  /** Presente cuando la operación era una creación offline (tiene tempId). */
  tempId?: string;
  /** Id real asignado por Supabase, para remapear operaciones encoladas después. */
  realId?: string;
}

/**
 * Ejecuta una operación de la cola contra Supabase. `resolveId` traduce un
 * tempId (item creado offline) al id real, si ya se resolvió antes en la
 * misma corrida de `processQueue`.
 */
export async function ejecutarOperacion(
  op: OutboxOperation,
  resolveId: (id: string) => string
): Promise<ResultadoEjecucion | void> {
  switch (op.type) {
    case "reposicion.agregarItem": {
      const item = await reposicionService.agregarItem(
        op.payload.varianteId,
        op.payload.cantidad
      );
      return { tempId: op.payload.tempId, realId: item.id };
    }
    case "reposicion.actualizarCantidad":
      await reposicionService.actualizarCantidad(
        resolveId(op.payload.id),
        op.payload.cantidad
      );
      return;
    case "reposicion.cambiarEstado":
      await reposicionService.cambiarEstado(
        resolveId(op.payload.id),
        op.payload.estado
      );
      return;
    case "reposicion.eliminarItem":
      await reposicionService.eliminarItem(resolveId(op.payload.id));
      return;
    case "vencimiento.agregarItem": {
      const item = await vencimientoService.agregarItem(
        op.payload.varianteId,
        // El payload es YYYY-MM-DD en horario local; el sufijo T00:00:00
        // fuerza el parseo a medianoche local (new Date("YYYY-MM-DD") solo
        // sería medianoche UTC y correría la fecha un día en husos UTC-).
        new Date(`${op.payload.fechaVencimiento}T00:00:00`),
        op.payload.cantidad,
        op.payload.lote
      );
      return { tempId: op.payload.tempId, realId: item.id };
    }
    case "vencimiento.actualizarFecha":
      await vencimientoService.actualizarFecha(
        resolveId(op.payload.id),
        new Date(`${op.payload.fechaVencimiento}T00:00:00`)
      );
      return;
    case "vencimiento.actualizarCantidad":
      await vencimientoService.actualizarCantidad(
        resolveId(op.payload.id),
        op.payload.cantidad
      );
      return;
    case "vencimiento.eliminarItem":
      await vencimientoService.eliminarItem(resolveId(op.payload.id));
      return;
    case "vencimiento.retirarItem":
      await vencimientoService.retirarItem(resolveId(op.payload.id));
      return;
  }
}
