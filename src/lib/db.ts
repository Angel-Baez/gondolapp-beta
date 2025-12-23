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

// ✅ Hacer db privado (solo interno en este archivo)
const db = new GondolAppDB();

// ✅ Exportar facade controlado
export const dbService = {
  // Productos Base
  async getProductosBase() {
    return await db.productosBase.toArray();
  },
  
  async getProductoBaseById(id: string) {
    return await db.productosBase.get(id);
  },
  
  async countProductosBase() {
    return await db.productosBase.count();
  },
  
  async searchProductosBase(term: string) {
    return await db.productosBase
      .filter(p => {
        const nombre = p.nombre.toLowerCase();
        const marca = p.marca?.toLowerCase() || "";
        const busqueda = term.toLowerCase();
        return nombre.includes(busqueda) || marca.includes(busqueda);
      })
      .toArray();
  },

  // Variantes
  async getVariantes() {
    return await db.productosVariantes.toArray();
  },
  
  async getVarianteById(id: string) {
    return await db.productosVariantes.get(id);
  },
  
  async getVarianteByBarcode(barcode: string) {
    return await db.productosVariantes
      .where("codigoBarras")
      .equals(barcode)
      .first();
  },
  
  async countVariantes() {
    return await db.productosVariantes.count();
  },

  async addProductoBase(base: ProductoBase) {
    return await db.productosBase.add(base);
  },

  async addVariante(variante: ProductoVariante) {
    return await db.productosVariantes.add(variante);
  },

  // Items Reposición
  async getItemsReposicion(options?: { orderBy?: string; reverse?: boolean }) {
    if (options?.orderBy) {
      let query = db.itemsReposicion.orderBy(options.orderBy);
      if (options.reverse) {
        query = query.reverse();
      }
      return await query.toArray();
    }
    return await db.itemsReposicion.toArray();
  },
  
  async countItemsReposicion() {
    return await db.itemsReposicion.count();
  },

  async getItemReposicionById(id: string) {
    return await db.itemsReposicion.get(id);
  },

  async getItemReposicionByVarianteId(
    varianteId: string,
    filters: { repuesto: boolean; sinStock: boolean }
  ) {
    return await db.itemsReposicion
      .where("varianteId")
      .equals(varianteId)
      .and((item) => item.repuesto === filters.repuesto && item.sinStock === filters.sinStock)
      .first();
  },

  async getAllItemsReposicion() {
    return await db.itemsReposicion.toArray();
  },

  async addItemReposicion(item: ItemReposicion) {
    return await db.itemsReposicion.add(item);
  },

  async updateItemReposicion(id: string, changes: Partial<ItemReposicion>) {
    return await db.itemsReposicion.update(id, changes);
  },

  async deleteItemReposicion(id: string) {
    return await db.itemsReposicion.delete(id);
  },

  // Items Vencimiento
  async getItemsVencimiento(options?: { orderBy?: string }) {
    if (options?.orderBy) {
      return await db.itemsVencimiento.orderBy(options.orderBy).toArray();
    }
    return await db.itemsVencimiento.toArray();
  },
  
  async countItemsVencimiento() {
    return await db.itemsVencimiento.count();
  },

  async getItemVencimientoById(id: string) {
    return await db.itemsVencimiento.get(id);
  },

  async getAllItemsVencimiento() {
    return await db.itemsVencimiento.toArray();
  },

  async addItemVencimiento(item: ItemVencimiento) {
    return await db.itemsVencimiento.add(item);
  },

  async updateItemVencimiento(id: string, changes: Partial<ItemVencimiento>) {
    return await db.itemsVencimiento.update(id, changes);
  },

  async deleteItemVencimiento(id: string) {
    return await db.itemsVencimiento.delete(id);
  },

  // Listas Historial
  async getListasHistorial(options?: { 
    orderBy?: string; 
    reverse?: boolean; 
    limit?: number 
  }) {
    let query = db.listasHistorial.orderBy(options?.orderBy || "fechaGuardado");
    
    if (options?.reverse) {
      query = query.reverse();
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.toArray();
  },
  
  async countListasHistorial() {
    return await db.listasHistorial.count();
  },

  async addListaHistorial(lista: ListaReposicionHistorial) {
    return await db.listasHistorial.add(lista);
  },

  async getListasHistorialByDateRange(desde: Date, hasta: Date) {
    return await db.listasHistorial
      .where("fechaGuardado")
      .between(desde, hasta)
      .toArray();
  },

  async deleteListaHistorial(id: string) {
    return await db.listasHistorial.delete(id);
  },

  // Clear operations
  async clearProductosBase() {
    return await db.productosBase.clear();
  },

  async clearVariantes() {
    return await db.productosVariantes.clear();
  },

  async clearItemsReposicion() {
    return await db.itemsReposicion.clear();
  },

  async clearItemsVencimiento() {
    return await db.itemsVencimiento.clear();
  },

  async clearListasHistorial() {
    return await db.listasHistorial.clear();
  },

  // BulkPut operations
  async bulkPutProductosBase(items: ProductoBase[]) {
    return await db.productosBase.bulkPut(items);
  },

  async bulkPutVariantes(items: ProductoVariante[]) {
    return await db.productosVariantes.bulkPut(items);
  },

  async bulkPutItemsReposicion(items: ItemReposicion[]) {
    return await db.itemsReposicion.bulkPut(items);
  },

  async bulkPutItemsVencimiento(items: ItemVencimiento[]) {
    return await db.itemsVencimiento.bulkPut(items);
  },

  // Operaciones transaccionales (para casos especiales)
  async transaction<T>(
    mode: "r" | "rw" | "r?" | "rw?",
    tables: string[],
    callback: () => Promise<T>
  ): Promise<T> {
    return await db.transaction(mode, tables as any, callback);
  },
};

// ✅ Para componentes que ABSOLUTAMENTE necesitan acceso directo
// (temporal, durante la migración)
export const __unsafeDirectDbAccess = db;

// ✅ Re-exportar la clase para IndexedDBProductRepository
export { db as _internalDb };
