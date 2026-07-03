import { ProductoEscaneado } from "@/hooks/useScanProduct";
import { ItemReposicion, ScanMode } from "@/types";

/**
 * Máquina de estados del flujo de escaneo (reducer puro, sin side effects).
 *
 * El componente ScanFlow interpreta los `effect` devueltos (lookup del EAN,
 * auto-agregado, mutaciones de cantidad) y despacha los eventos de vuelta.
 * Mantenerla pura permite testear cada transición sin cámara ni red.
 *
 * Camino feliz en reposición (cero taps):
 *   scanning → SCAN → lookingUp → FOUND → adding (auto-agrega x1)
 *   → ADDED → adjusting (card flotante 4s sobre la cámara) → TIMEOUT → scanning
 */

/** Ventana en la que la card de ajuste queda visible sin interacción. */
export const ADJUST_TIMEOUT_MS = 4000;

export interface AdjustCard {
  itemId: string;
  varianteId: string;
  ean: string;
  nombre: string;
  /** Cantidad total del item en la lista (incluye merge con un pendiente previo). */
  cantidad: number;
  /** Cantidad que el item pendiente ya tenía antes de este escaneo (0 = no existía). */
  prevCantidad: number;
  /** Timestamp (ms epoch) en el que la card se auto-descarta. */
  deadline: number;
}

export type ScanFlowState =
  | { mode: "scanning" }
  | { mode: "lookingUp"; ean: string }
  | { mode: "adding"; ean: string; producto: ProductoEscaneado }
  | { mode: "adjusting"; card: AdjustCard }
  | { mode: "dating"; producto: ProductoEscaneado }
  | { mode: "unknown"; ean: string };

export type ScanFlowEvent =
  | { type: "SCAN"; ean: string }
  | { type: "FOUND"; ean: string; producto: ProductoEscaneado }
  | { type: "NOT_FOUND"; ean: string }
  | { type: "LOOKUP_FAILED"; ean: string }
  | {
      type: "ADDED";
      item: Pick<ItemReposicion, "id" | "varianteId" | "cantidad">;
      producto: ProductoEscaneado;
      ean: string;
    }
  | { type: "ADD_FAILED" }
  | { type: "SET_QTY"; cantidad: number }
  | { type: "UNDO" }
  | { type: "TIMEOUT" }
  | { type: "CREATED"; producto: ProductoEscaneado }
  | { type: "SHEET_DONE" }
  | { type: "SHEET_CANCEL" };

export type ScanFlowEffect =
  | { kind: "lookup"; ean: string }
  | { kind: "autoAdd"; producto: ProductoEscaneado; ean: string }
  | { kind: "updateCantidad"; itemId: string; cantidad: number }
  | { kind: "restoreCantidad"; itemId: string; cantidad: number }
  | { kind: "deleteItem"; itemId: string }
  | null;

export interface ScanFlowContext {
  scanMode: ScanMode;
  /** Inyectable para tests deterministas. */
  now: () => number;
}

export interface ScanFlowResult {
  state: ScanFlowState;
  effect: ScanFlowEffect;
}

export const initialScanFlowState: ScanFlowState = { mode: "scanning" };

const sinEfecto = (state: ScanFlowState): ScanFlowResult => ({
  state,
  effect: null,
});

function alEncontrarProducto(
  producto: ProductoEscaneado,
  ean: string,
  ctx: ScanFlowContext
): ScanFlowResult {
  if (ctx.scanMode === "reposicion") {
    return {
      state: { mode: "adding", ean, producto },
      effect: { kind: "autoAdd", producto, ean },
    };
  }
  return sinEfecto({ mode: "dating", producto });
}

export function scanFlowReduce(
  state: ScanFlowState,
  event: ScanFlowEvent,
  ctx: ScanFlowContext
): ScanFlowResult {
  switch (state.mode) {
    case "scanning": {
      if (event.type === "SCAN") {
        return {
          state: { mode: "lookingUp", ean: event.ean },
          effect: { kind: "lookup", ean: event.ean },
        };
      }
      return sinEfecto(state);
    }

    case "lookingUp": {
      switch (event.type) {
        case "FOUND":
          // Ignorar respuestas viejas de otro EAN (lookups que se cruzaron)
          if (event.ean !== state.ean) return sinEfecto(state);
          return alEncontrarProducto(event.producto, event.ean, ctx);
        case "NOT_FOUND":
          if (event.ean !== state.ean) return sinEfecto(state);
          return sinEfecto({ mode: "unknown", ean: event.ean });
        case "LOOKUP_FAILED":
          if (event.ean !== state.ean) return sinEfecto(state);
          return sinEfecto({ mode: "scanning" });
        default:
          // SCAN durante un lookup en curso se ignora: la cadencia física de
          // escaneo (~1/s) es más lenta que el lookup (~100-300ms cacheado)
          return sinEfecto(state);
      }
    }

    case "adding": {
      switch (event.type) {
        case "ADDED":
          return sinEfecto({
            mode: "adjusting",
            card: {
              itemId: event.item.id,
              varianteId: event.item.varianteId,
              ean: event.ean,
              nombre: event.producto.variante.nombreCompleto,
              cantidad: event.item.cantidad,
              prevCantidad: Math.max(0, event.item.cantidad - 1),
              deadline: ctx.now() + ADJUST_TIMEOUT_MS,
            },
          });
        case "ADD_FAILED":
          return sinEfecto({ mode: "scanning" });
        default:
          return sinEfecto(state);
      }
    }

    case "adjusting": {
      const { card } = state;
      switch (event.type) {
        case "SET_QTY": {
          const cantidad = Math.max(1, event.cantidad);
          if (cantidad === card.cantidad) {
            // Sin cambio real: solo re-armar la ventana de ajuste
            return sinEfecto({
              mode: "adjusting",
              card: { ...card, deadline: ctx.now() + ADJUST_TIMEOUT_MS },
            });
          }
          return {
            state: {
              mode: "adjusting",
              card: {
                ...card,
                cantidad,
                deadline: ctx.now() + ADJUST_TIMEOUT_MS,
              },
            },
            effect: { kind: "updateCantidad", itemId: card.itemId, cantidad },
          };
        }
        case "SCAN": {
          if (event.ean === card.ean) {
            // Re-escaneo del mismo producto: sumar en la misma card sin
            // otro round-trip de lookup/agregado
            const cantidad = card.cantidad + 1;
            return {
              state: {
                mode: "adjusting",
                card: {
                  ...card,
                  cantidad,
                  deadline: ctx.now() + ADJUST_TIMEOUT_MS,
                },
              },
              effect: {
                kind: "updateCantidad",
                itemId: card.itemId,
                cantidad,
              },
            };
          }
          // Otro producto: la card actual queda comprometida (ya está
          // persistida) y arranca el nuevo lookup — escaneo encadenado
          return {
            state: { mode: "lookingUp", ean: event.ean },
            effect: { kind: "lookup", ean: event.ean },
          };
        }
        case "UNDO": {
          if (card.prevCantidad > 0) {
            // El escaneo se mergeó con un pendiente previo: deshacer es
            // restaurar la cantidad anterior, no borrar el item
            return {
              state: { mode: "scanning" },
              effect: {
                kind: "restoreCantidad",
                itemId: card.itemId,
                cantidad: card.prevCantidad,
              },
            };
          }
          return {
            state: { mode: "scanning" },
            effect: { kind: "deleteItem", itemId: card.itemId },
          };
        }
        case "TIMEOUT":
          return sinEfecto({ mode: "scanning" });
        default:
          return sinEfecto(state);
      }
    }

    case "dating": {
      if (event.type === "SHEET_DONE" || event.type === "SHEET_CANCEL") {
        return sinEfecto({ mode: "scanning" });
      }
      return sinEfecto(state);
    }

    case "unknown": {
      switch (event.type) {
        case "CREATED":
          return alEncontrarProducto(event.producto, state.ean, ctx);
        case "SHEET_CANCEL":
          return sinEfecto({ mode: "scanning" });
        default:
          return sinEfecto(state);
      }
    }
  }
}
