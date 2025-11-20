import {
  ItemReposicion,
  ItemVencimiento,
  ProductoBase,
  ProductoVariante,
} from "@/types";
import Dexie, { Table } from "dexie";

export class GondolAppDB extends Dexie {
  productosBase!: Table<ProductoBase, string>;
  productosVariantes!: Table<ProductoVariante, string>;
  itemsReposicion!: Table<ItemReposicion, string>;
  itemsVencimiento!: Table<ItemVencimiento, string>;

  constructor() {
    super("GondolAppDB");

    this.version(1).stores({
      productosBase: "id, nombre, categoria, marca, createdAt",
      productosVariantes:
        "id, productoBaseId, codigoBarras, nombreCompleto, createdAt",
      itemsReposicion:
        "id, varianteId, repuesto, sinStock, agregadoAt, actualizadoAt",
      itemsVencimiento:
        "id, varianteId, fechaVencimiento, alertaNivel, agregadoAt",
    });
  }
}

export const db = new GondolAppDB();
