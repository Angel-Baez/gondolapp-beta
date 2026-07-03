import { describe, expect, it } from "vitest";
import {
  ADJUST_TIMEOUT_MS,
  initialScanFlowState,
  scanFlowReduce,
  ScanFlowContext,
} from "../scanFlowMachine";
import { ProductoEscaneado } from "@/hooks/useScanProduct";

const NOW = 1_700_000_000_000;
const ctxReposicion: ScanFlowContext = { scanMode: "reposicion", now: () => NOW };
const ctxVencimiento: ScanFlowContext = { scanMode: "vencimiento", now: () => NOW };

const producto: ProductoEscaneado = {
  base: { id: "base-1", nombre: "Leche", marca: "La Serenísima" },
  variante: { id: "var-1", nombreCompleto: "Leche Entera 1L", tamano: "1L" },
};

describe("scanFlowMachine", () => {
  it("arranca en scanning", () => {
    expect(initialScanFlowState).toEqual({ mode: "scanning" });
  });

  it("SCAN dispara lookup y pasa a lookingUp", () => {
    const { state, effect } = scanFlowReduce(
      initialScanFlowState,
      { type: "SCAN", ean: "111" },
      ctxReposicion
    );
    expect(state).toEqual({ mode: "lookingUp", ean: "111" });
    expect(effect).toEqual({ kind: "lookup", ean: "111" });
  });

  it("reposición: FOUND dispara auto-add y ADDED entra a adjusting con undo restaurando prevCantidad", () => {
    let r = scanFlowReduce(
      { mode: "lookingUp", ean: "111" },
      { type: "FOUND", ean: "111", producto },
      ctxReposicion
    );
    expect(r.state).toEqual({ mode: "adding", ean: "111", producto });
    expect(r.effect).toEqual({ kind: "autoAdd", producto, ean: "111" });

    // El backend mergeó con un pendiente que ya tenía cantidad 3 -> ahora 4
    r = scanFlowReduce(
      r.state,
      {
        type: "ADDED",
        item: { id: "item-1", varianteId: "var-1", cantidad: 4 },
        producto,
        ean: "111",
      },
      ctxReposicion
    );
    expect(r.state.mode).toBe("adjusting");
    if (r.state.mode !== "adjusting") throw new Error("unreachable");
    expect(r.state.card).toMatchObject({
      itemId: "item-1",
      cantidad: 4,
      prevCantidad: 3,
      deadline: NOW + ADJUST_TIMEOUT_MS,
    });

    const undo = scanFlowReduce(r.state, { type: "UNDO" }, ctxReposicion);
    expect(undo.state).toEqual({ mode: "scanning" });
    expect(undo.effect).toEqual({
      kind: "restoreCantidad",
      itemId: "item-1",
      cantidad: 3,
    });
  });

  it("reposición: item nuevo (prevCantidad 0) hace UNDO -> deleteItem", () => {
    const adjusting = scanFlowReduce(
      { mode: "adding", ean: "111", producto },
      {
        type: "ADDED",
        item: { id: "item-1", varianteId: "var-1", cantidad: 1 },
        producto,
        ean: "111",
      },
      ctxReposicion
    ).state;

    const undo = scanFlowReduce(adjusting, { type: "UNDO" }, ctxReposicion);
    expect(undo.effect).toEqual({ kind: "deleteItem", itemId: "item-1" });
  });

  it("adjusting: SET_QTY actualiza cantidad y re-arma el deadline", () => {
    const adjusting = scanFlowReduce(
      { mode: "adding", ean: "111", producto },
      {
        type: "ADDED",
        item: { id: "item-1", varianteId: "var-1", cantidad: 1 },
        producto,
        ean: "111",
      },
      ctxReposicion
    ).state;

    const later: ScanFlowContext = { scanMode: "reposicion", now: () => NOW + 1000 };
    const r = scanFlowReduce(adjusting, { type: "SET_QTY", cantidad: 6 }, later);
    expect(r.effect).toEqual({ kind: "updateCantidad", itemId: "item-1", cantidad: 6 });
    if (r.state.mode !== "adjusting") throw new Error("unreachable");
    expect(r.state.card.cantidad).toBe(6);
    expect(r.state.card.deadline).toBe(NOW + 1000 + ADJUST_TIMEOUT_MS);
  });

  it("adjusting: re-escanear el mismo EAN suma 1 sin nuevo lookup", () => {
    const adjusting = scanFlowReduce(
      { mode: "adding", ean: "111", producto },
      {
        type: "ADDED",
        item: { id: "item-1", varianteId: "var-1", cantidad: 1 },
        producto,
        ean: "111",
      },
      ctxReposicion
    ).state;

    const r = scanFlowReduce(adjusting, { type: "SCAN", ean: "111" }, ctxReposicion);
    expect(r.effect).toEqual({ kind: "updateCantidad", itemId: "item-1", cantidad: 2 });
    if (r.state.mode !== "adjusting") throw new Error("unreachable");
    expect(r.state.card.cantidad).toBe(2);
  });

  it("adjusting: escanear otro EAN compromete la card y arranca un nuevo lookup", () => {
    const adjusting = scanFlowReduce(
      { mode: "adding", ean: "111", producto },
      {
        type: "ADDED",
        item: { id: "item-1", varianteId: "var-1", cantidad: 1 },
        producto,
        ean: "111",
      },
      ctxReposicion
    ).state;

    const r = scanFlowReduce(adjusting, { type: "SCAN", ean: "222" }, ctxReposicion);
    expect(r.state).toEqual({ mode: "lookingUp", ean: "222" });
    expect(r.effect).toEqual({ kind: "lookup", ean: "222" });
  });

  it("adjusting: TIMEOUT vuelve a scanning sin efecto", () => {
    const adjusting = scanFlowReduce(
      { mode: "adding", ean: "111", producto },
      {
        type: "ADDED",
        item: { id: "item-1", varianteId: "var-1", cantidad: 1 },
        producto,
        ean: "111",
      },
      ctxReposicion
    ).state;

    const r = scanFlowReduce(adjusting, { type: "TIMEOUT" }, ctxReposicion);
    expect(r).toEqual({ state: { mode: "scanning" }, effect: null });
  });

  it("vencimiento: FOUND va directo a dating (sin auto-add)", () => {
    const r = scanFlowReduce(
      { mode: "lookingUp", ean: "111" },
      { type: "FOUND", ean: "111", producto },
      ctxVencimiento
    );
    expect(r.state).toEqual({ mode: "dating", producto });
    expect(r.effect).toBeNull();
  });

  it("dating: SHEET_DONE y SHEET_CANCEL vuelven a scanning", () => {
    const dating = { mode: "dating" as const, producto };
    expect(scanFlowReduce(dating, { type: "SHEET_DONE" }, ctxVencimiento).state).toEqual({
      mode: "scanning",
    });
    expect(scanFlowReduce(dating, { type: "SHEET_CANCEL" }, ctxVencimiento).state).toEqual({
      mode: "scanning",
    });
  });

  it("NOT_FOUND entra a unknown; CREATED en reposición dispara auto-add", () => {
    const unknown = scanFlowReduce(
      { mode: "lookingUp", ean: "999" },
      { type: "NOT_FOUND", ean: "999" },
      ctxReposicion
    );
    expect(unknown.state).toEqual({ mode: "unknown", ean: "999" });

    const created = scanFlowReduce(
      unknown.state,
      { type: "CREATED", producto },
      ctxReposicion
    );
    expect(created.state).toEqual({ mode: "adding", ean: "999", producto });
    expect(created.effect).toEqual({ kind: "autoAdd", producto, ean: "999" });
  });

  it("NOT_FOUND + CREATED en vencimiento va a dating", () => {
    const unknown = scanFlowReduce(
      { mode: "lookingUp", ean: "999" },
      { type: "NOT_FOUND", ean: "999" },
      ctxVencimiento
    );
    const created = scanFlowReduce(
      unknown.state,
      { type: "CREATED", producto },
      ctxVencimiento
    );
    expect(created.state).toEqual({ mode: "dating", producto });
  });

  it("unknown: SHEET_CANCEL vuelve a scanning", () => {
    const r = scanFlowReduce(
      { mode: "unknown", ean: "999" },
      { type: "SHEET_CANCEL" },
      ctxReposicion
    );
    expect(r.state).toEqual({ mode: "scanning" });
  });

  it("ignora FOUND/NOT_FOUND de un lookup viejo si ya cambió el EAN en curso", () => {
    const lookingUp = { mode: "lookingUp" as const, ean: "111" };
    const r = scanFlowReduce(
      lookingUp,
      { type: "FOUND", ean: "OTRO", producto },
      ctxReposicion
    );
    expect(r.state).toBe(lookingUp);
    expect(r.effect).toBeNull();
  });

  it("LOOKUP_FAILED vuelve a scanning", () => {
    const r = scanFlowReduce(
      { mode: "lookingUp", ean: "111" },
      { type: "LOOKUP_FAILED", ean: "111" },
      ctxReposicion
    );
    expect(r.state).toEqual({ mode: "scanning" });
  });

  it("ADD_FAILED vuelve a scanning", () => {
    const r = scanFlowReduce(
      { mode: "adding", ean: "111", producto },
      { type: "ADD_FAILED" },
      ctxReposicion
    );
    expect(r.state).toEqual({ mode: "scanning" });
  });
});
