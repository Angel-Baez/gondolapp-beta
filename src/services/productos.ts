import { db } from "@/lib/db";
import { ProductoBase, ProductoVariante } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { generarIdBase } from "./normalizador";

export interface ProductoCompleto {
  base: ProductoBase;
  variante: ProductoVariante;
}

/**
 * FLUJO PRINCIPAL: Escaneo → Cache Local (IndexedDB) → MongoDB → Manual
 *
 * Ya NO consulta Open Food Facts ni IA
 */
export async function obtenerOCrearProducto(
  ean: string
): Promise<ProductoCompleto | null> {
  try {
    console.log("🔍 Buscando producto:", ean);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PASO 1: Buscar en IndexedDB Local (Cache Offline)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const varianteExistente = await db.productosVariantes
      .where("codigoBarras")
      .equals(ean)
      .first();

    if (varianteExistente) {
      const productoBase = await db.productosBase.get(
        varianteExistente.productoBaseId
      );

      if (productoBase) {
        console.log(
          "✅ Producto encontrado en cache local:",
          productoBase.nombre
        );
        return { base: productoBase, variante: varianteExistente };
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PASO 2: Consultar MongoDB (API)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log("📡 Consultando MongoDB...");

    try {
      const response = await fetch(`/api/productos/buscar?ean=${ean}`);

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.producto) {
          console.log(
            "✅ Producto encontrado en MongoDB:",
            data.producto.base.nombre
          );

          // Sincronizar con IndexedDB local
          const base = data.producto.base;
          const variante = data.producto.variante;

          // Guardar en IndexedDB para uso offline
          await db.productosBase.put({
            id: base.id,
            nombre: base.nombre,
            marca: base.marca,
            categoria: base.categoria,
            imagen: base.imagen,
            createdAt: new Date(base.createdAt),
            updatedAt: new Date(),
          });

          await db.productosVariantes.put({
            id: variante.id,
            productoBaseId: base.id,
            codigoBarras: variante.ean,
            nombreCompleto: variante.nombreCompleto,
            tipo: variante.tipo,
            tamano: variante.tamano,
            sabor: variante.sabor,
            unidadMedida: variante.unidad,
            imagen: variante.imagen,
            createdAt: new Date(variante.createdAt),
          });

          console.log("✅ Producto sincronizado con IndexedDB");

          // Obtener los productos guardados con manejo de undefined
          const baseGuardado = await db.productosBase.get(base.id);
          const varianteGuardada = await db.productosVariantes.get(variante.id);

          if (!baseGuardado || !varianteGuardada) {
            console.error("❌ Error al recuperar producto de IndexedDB");
            return null;
          }

          return {
            base: baseGuardado,
            variante: varianteGuardada,
          };
        }
      } else if (response.status === 503) {
        // Servicio MongoDB no disponible
        const data = await response.json();
        console.warn(
          "⚠️ MongoDB temporalmente no disponible:",
          data.message || "Servicio no disponible"
        );
      } else {
        console.warn(`⚠️ API respondió con status ${response.status}`);
      }
    } catch (error) {
      console.error("⚠️ Error al consultar MongoDB:", error);
      // Continuar al flujo de formulario manual
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PASO 3: Producto NO encontrado
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.warn("❌ Producto no encontrado en MongoDB:", ean);
    console.log("💡 Se debe abrir el formulario manual para registrarlo");

    return null;
  } catch (error) {
    console.error("❌ Error en obtenerOCrearProducto:", error);
    return null;
  }
}

/**
 * Obtiene un producto completo por ID de variante
 */
export async function obtenerProductoCompleto(
  varianteId: string
): Promise<ProductoCompleto | null> {
  try {
    const variante = await db.productosVariantes.get(varianteId);
    if (!variante) return null;

    const base = await db.productosBase.get(variante.productoBaseId);
    if (!base) return null;

    return { base, variante };
  } catch (error) {
    console.error("Error al obtener producto completo:", error);
    return null;
  }
}

/**
 * Busca productos base por nombre
 */
export async function buscarProductosBase(
  termino: string
): Promise<ProductoBase[]> {
  try {
    const productos = await db.productosBase
      .filter((p) => {
        const nombre = p.nombre.toLowerCase();
        const marca = p.marca?.toLowerCase() || "";
        const busqueda = termino.toLowerCase();
        return nombre.includes(busqueda) || marca.includes(busqueda);
      })
      .toArray();

    return productos;
  } catch (error) {
    console.error("Error al buscar productos:", error);
    return [];
  }
}

/**
 * Obtiene todas las variantes de un producto base
 */
export async function obtenerVariantesDeBase(
  productoBaseId: string
): Promise<ProductoVariante[]> {
  try {
    return await db.productosVariantes
      .where("productoBaseId")
      .equals(productoBaseId)
      .toArray();
  } catch (error) {
    console.error("Error al obtener variantes:", error);
    return [];
  }
}

/**
 * Crea un producto nuevo sin datos de Open Food Facts
 * (usado cuando el código no existe en la API externa)
 */
export async function crearProductoManual(
  ean: string,
  datosProducto: {
    nombreBase: string;
    marca?: string;
    nombreVariante?: string;
    tipo?: string;
    tamano?: string;
    sabor?: string;
  }
): Promise<ProductoCompleto> {
  const { nombreBase, marca, nombreVariante, tipo, tamano, sabor } =
    datosProducto;

  console.log("🔍 Datos recibidos para crear producto manual:", {
    nombreBase,
    marca,
    nombreVariante,
    tipo,
    tamano,
    sabor,
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASO 1: Buscar o Crear Producto Base
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const idBase = generarIdBase(marca || "", nombreBase);
  const productosExistentes = await db.productosBase.toArray();

  let productoBase = productosExistentes.find((p) => {
    const idExistente = generarIdBase(p.marca || "", p.nombre);
    return idExistente === idBase;
  });

  if (!productoBase) {
    // Crear nuevo ProductoBase
    productoBase = {
      id: uuidv4(),
      nombre: nombreBase.trim(),
      marca: marca?.trim() || undefined,
      categoria: undefined,
      imagen: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.productosBase.add(productoBase);
    console.log("✨ Nuevo producto base creado:", productoBase.nombre);
  } else {
    console.log("✅ Producto base existente encontrado:", productoBase.nombre);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASO 2: Construir nombre completo de la variante
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const nombreCompletoVariante =
    nombreVariante?.trim() ||
    [nombreBase, marca, tipo, tamano, sabor].filter(Boolean).join(" ");

  console.log(
    "📝 Nombre completo de variante generado:",
    nombreCompletoVariante
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PASO 3: Crear ProductoVariante
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const variante: ProductoVariante = {
    id: uuidv4(),
    productoBaseId: productoBase.id,
    codigoBarras: ean,
    nombreCompleto: nombreCompletoVariante,
    tipo: tipo?.trim() || undefined,
    tamano: tamano?.trim() || undefined,
    sabor: sabor?.trim() || undefined,
    unidadMedida: undefined,
    imagen: undefined,
    createdAt: new Date(),
  };

  await db.productosVariantes.add(variante);

  console.log("✅ Producto manual creado:", {
    base: productoBase.nombre,
    marca: productoBase.marca,
    variante: variante.nombreCompleto,
  });

  return { base: productoBase, variante };
}
