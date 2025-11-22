import {
  ItemReposicion,
  ItemVencimiento,
  ListaReposicionHistorial,
  ProductoBase,
  ProductoVariante,
} from "@/types";
import Dexie, { Table } from "dexie";

export class GondolAppDB extends Dexie {
  productosBase!: Table<ProductoBase, string>;
  productosVariantes!: Table<ProductoVariante, string>;
  itemsReposicion!: Table<ItemReposicion, string>;
  itemsVencimiento!: Table<ItemVencimiento, string>;
  listasHistorial!: Table<ListaReposicionHistorial, string>;

  constructor() {
    super("GondolAppDB");

    // Version 1: Initial schema
    this.version(1).stores({
      productosBase: "id, nombre, categoria, marca, createdAt",
      productosVariantes:
        "id, productoBaseId, codigoBarras, nombreCompleto, createdAt",
      itemsReposicion:
        "id, varianteId, repuesto, sinStock, agregadoAt, actualizadoAt",
      itemsVencimiento:
        "id, varianteId, fechaVencimiento, alertaNivel, agregadoAt",
    });

    // Version 2: Add historical lists table
    this.version(2).stores({
      productosBase: "id, nombre, categoria, marca, createdAt",
      productosVariantes:
        "id, productoBaseId, codigoBarras, nombreCompleto, createdAt",
      itemsReposicion:
        "id, varianteId, repuesto, sinStock, agregadoAt, actualizadoAt",
      itemsVencimiento:
        "id, varianteId, fechaVencimiento, alertaNivel, agregadoAt",
      listasHistorial: "id, fechaGuardado, usuarioId",
    });
  }
}

export const db = new GondolAppDB();
