/**
 * Single Responsibility Principle (SRP) - Solo operaciones CRUD de admin
 * Dependency Inversion Principle (DIP) - Depende de interfaces MongoDB y repositorios
 * Open/Closed Principle (OCP) - Extiende ProductService sin modificarlo
 */

import { Db, ObjectId } from "mongodb";
import {
  IAdminProductRepository,
  SearchProductsResult,
  ProductSearchFilters,
  VariantSearchFilters,
  ProductoCompleto,
} from "../interfaces/IAdminProductRepository";
import { ProductoBase, ProductoVariante, ProductoBaseMongo, ProductoVarianteMongo } from "@/types";
import { AdminValidator } from "../validators/AdminValidator";
import { IndexedDBProductRepository } from "@/core/repositories/IndexedDBProductRepository";
import { ProductSyncService } from "@/services/ProductSyncService";

/**
 * Servicio de administración de productos
 * Implementa operaciones CRUD sobre MongoDB y sincroniza con IndexedDB
 */
export class AdminProductService implements IAdminProductRepository {
  constructor(
    private db: Db,
    private localRepo: IndexedDBProductRepository
  ) {}

  /**
   * Búsqueda avanzada de productos con filtros y paginación
   */
  async searchProducts(filters: ProductSearchFilters): Promise<SearchProductsResult> {
    const {
      query = "",
      marca = "",
      categoria = "",
      page = 1,
      limit = 20,
    } = filters;

    // Validar parámetros de paginación
    const validation = AdminValidator.validateSearchParams({ page, limit });
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const collection = this.db.collection<ProductoBaseMongo>("productos_base");

    // Construir filtro de búsqueda
    const searchFilter: any = {};

    if (query) {
      searchFilter.nombre = { $regex: query, $options: "i" };
    }

    if (marca) {
      searchFilter.marca = { $regex: marca, $options: "i" };
    }

    if (categoria) {
      searchFilter.categoria = { $regex: categoria, $options: "i" };
    }

    // Contar total de resultados
    const total = await collection.countDocuments(searchFilter);

    // Calcular skip
    const skip = (page - 1) * limit;

    // Obtener productos con paginación
    const productos = await collection
      .find(searchFilter)
      .sort({ nombre: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Convertir a formato ProductoBase
    const productosBase: ProductoBase[] = productos.map((p) => ({
      id: p._id?.toString() || "",
      nombre: p.nombre,
      marca: p.marca,
      categoria: p.categoria,
      imagen: p.imagen,
      createdAt: p.createdAt,
      updatedAt: p.createdAt, // MongoDB no tiene updatedAt por defecto
    }));

    return {
      productos: productosBase,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Búsqueda de variantes con filtros
   */
  async searchVariants(filters: VariantSearchFilters): Promise<ProductoVariante[]> {
    const { query = "", productoBaseId = "", ean = "" } = filters;

    const collection = this.db.collection<ProductoVarianteMongo>("productos_variantes");

    // Construir filtro
    const searchFilter: any = {};

    if (query) {
      searchFilter.nombreCompleto = { $regex: query, $options: "i" };
    }

    if (productoBaseId) {
      searchFilter.productoBaseId = productoBaseId;
    }

    if (ean) {
      searchFilter.ean = ean;
    }

    const variantes = await collection
      .find(searchFilter)
      .sort({ nombreCompleto: 1 })
      .toArray();

    return variantes.map((v) => ({
      id: v._id?.toString() || "",
      productoBaseId: v.productoBaseId,
      codigoBarras: v.ean,
      nombreCompleto: v.nombreCompleto,
      tipo: v.tipo,
      tamano: v.tamano,
      sabor: v.sabor,
      unidadMedida: v.unidad,
      imagen: v.imagen,
      createdAt: v.createdAt,
    }));
  }

  /**
   * Obtiene un producto base por ID
   */
  async getProductoBaseById(id: string): Promise<ProductoBase | null> {
    const validation = AdminValidator.validateObjectId(id);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const collection = this.db.collection<ProductoBaseMongo>("productos_base");
    const producto = await collection.findOne({ _id: new ObjectId(id) as any });

    if (!producto) {
      return null;
    }

    return {
      id: producto._id?.toString() || "",
      nombre: producto.nombre,
      marca: producto.marca,
      categoria: producto.categoria,
      imagen: producto.imagen,
      createdAt: producto.createdAt,
      updatedAt: producto.createdAt,
    };
  }

  /**
   * Obtiene una variante por ID
   */
  async getVarianteById(id: string): Promise<ProductoVariante | null> {
    const validation = AdminValidator.validateObjectId(id);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const collection = this.db.collection<ProductoVarianteMongo>("productos_variantes");
    const variante = await collection.findOne({ _id: new ObjectId(id) as any });

    if (!variante) {
      return null;
    }

    return {
      id: variante._id?.toString() || "",
      productoBaseId: variante.productoBaseId,
      codigoBarras: variante.ean,
      nombreCompleto: variante.nombreCompleto,
      tipo: variante.tipo,
      tamano: variante.tamano,
      sabor: variante.sabor,
      unidadMedida: variante.unidad,
      imagen: variante.imagen,
      createdAt: variante.createdAt,
    };
  }

  /**
   * Obtiene un producto base con todas sus variantes
   */
  async getProductoBaseConVariantes(id: string): Promise<ProductoCompleto | null> {
    const base = await this.getProductoBaseById(id);
    if (!base) {
      return null;
    }

    const variantes = await this.getVariantesByBaseId(id);

    return {
      base,
      variantes,
    };
  }

  /**
   * Actualiza un producto base
   * Sincroniza con IndexedDB después de actualizar MongoDB
   */
  async updateProductoBase(id: string, data: Partial<ProductoBase>): Promise<void> {
    // Validar ID
    const idValidation = AdminValidator.validateObjectId(id);
    if (!idValidation.valid) {
      throw new Error(idValidation.errors.join(", "));
    }

    // Validar datos
    const dataValidation = AdminValidator.validateProductoBase(data);
    if (!dataValidation.valid) {
      throw new Error(dataValidation.errors.join(", "));
    }

    const collection = this.db.collection<ProductoBaseMongo>("productos_base");

    // Construir objeto de actualización (solo campos permitidos)
    const updateData: any = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.marca !== undefined) updateData.marca = data.marca;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.imagen !== undefined) updateData.imagen = data.imagen;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error("Producto no encontrado");
    }

    // Sincronizar con IndexedDB si existe localmente
    try {
      await this.localRepo.updateBase(id, updateData);
    } catch (error) {
      // Si no existe en IndexedDB, no es un error crítico
      console.warn("⚠️ No se pudo sincronizar con IndexedDB:", error);
    }
  }

  /**
   * Actualiza una variante
   */
  async updateVariante(id: string, data: Partial<ProductoVariante>): Promise<void> {
    // Validar ID
    const idValidation = AdminValidator.validateObjectId(id);
    if (!idValidation.valid) {
      throw new Error(idValidation.errors.join(", "));
    }

    // Validar datos
    const dataValidation = AdminValidator.validateVariante({
      nombreCompleto: data.nombreCompleto,
      ean: data.codigoBarras,
      tipo: data.tipo,
      tamano: data.tamano,
    });
    if (!dataValidation.valid) {
      throw new Error(dataValidation.errors.join(", "));
    }

    const collection = this.db.collection<ProductoVarianteMongo>("productos_variantes");

    // Construir objeto de actualización
    const updateData: any = {};
    if (data.nombreCompleto !== undefined) updateData.nombreCompleto = data.nombreCompleto;
    if (data.codigoBarras !== undefined) updateData.ean = data.codigoBarras;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.tamano !== undefined) updateData.tamano = data.tamano;
    if (data.sabor !== undefined) updateData.sabor = data.sabor;
    if (data.imagen !== undefined) updateData.imagen = data.imagen;
    if (data.unidadMedida !== undefined) updateData.unidad = data.unidadMedida;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error("Variante no encontrada");
    }
  }

  /**
   * Elimina un producto base (solo si no tiene variantes)
   */
  async deleteProductoBase(id: string): Promise<void> {
    const validation = AdminValidator.validateObjectId(id);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    // Verificar que no tenga variantes
    const count = await this.countVariantesByBaseId(id);
    if (count > 0) {
      throw new Error(
        `No se puede eliminar el producto porque tiene ${count} variante(s) asociada(s)`
      );
    }

    const collection = this.db.collection<ProductoBaseMongo>("productos_base");
    const result = await collection.deleteOne({ _id: new ObjectId(id) as any });

    if (result.deletedCount === 0) {
      throw new Error("Producto no encontrado");
    }
  }

  /**
   * Elimina una variante
   */
  async deleteVariante(id: string): Promise<void> {
    const validation = AdminValidator.validateObjectId(id);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const collection = this.db.collection<ProductoVarianteMongo>("productos_variantes");
    const result = await collection.deleteOne({ _id: new ObjectId(id) as any });

    if (result.deletedCount === 0) {
      throw new Error("Variante no encontrada");
    }
  }

  /**
   * Cuenta las variantes de un producto base
   */
  async countVariantesByBaseId(baseId: string): Promise<number> {
    const validation = AdminValidator.validateObjectId(baseId);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const collection = this.db.collection<ProductoVarianteMongo>("productos_variantes");
    return await collection.countDocuments({ productoBaseId: baseId });
  }

  /**
   * Obtiene todas las variantes de un producto base
   */
  async getVariantesByBaseId(baseId: string): Promise<ProductoVariante[]> {
    const validation = AdminValidator.validateObjectId(baseId);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    return await this.searchVariants({ productoBaseId: baseId });
  }
}
