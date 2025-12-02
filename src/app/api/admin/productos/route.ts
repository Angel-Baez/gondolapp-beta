import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { AdminProductService } from "@/core/admin/services/AdminProductService";
import { ServerSideProductRepository } from "@/core/repositories/ServerSideProductRepository";
import { ObjectId } from "mongodb";

/**
 * Detectar tipo de búsqueda automáticamente
 * - 24 caracteres hex → ObjectId
 * - 8-14 dígitos → EAN
 * - Otro → texto normal
 */
function detectSearchType(query: string): "objectId" | "ean" | "text" {
  if (!query) return "text";
  
  // ObjectId: 24 caracteres hexadecimales
  if (/^[0-9a-fA-F]{24}$/.test(query)) {
    return "objectId";
  }
  
  // EAN: 8-14 dígitos numéricos
  if (/^\d{8,14}$/.test(query)) {
    return "ean";
  }
  
  return "text";
}

/**
 * GET /api/admin/productos
 * Búsqueda avanzada de productos con filtros y paginación
 * Soporta búsqueda por ObjectId, EAN y texto
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q") || "";
    const marca = searchParams.get("marca") || "";
    const categoria = searchParams.get("categoria") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Conectar a MongoDB
    const db = await getDatabase();
    const localRepo = new ServerSideProductRepository();
    const adminService = new AdminProductService(db, localRepo);

    // Detectar tipo de búsqueda
    const searchType = detectSearchType(query);

    // Si es búsqueda por ObjectId, buscar directamente
    if (searchType === "objectId") {
      try {
        const producto = await adminService.getProductoBaseById(query);
        if (producto) {
          const variantesCollection = db.collection("productos_variantes");
          const count = await variantesCollection.countDocuments({ productoBaseId: query });
          
          return NextResponse.json({
            success: true,
            productos: [{ ...producto, variantesCount: count }],
            total: 1,
            page: 1,
            totalPages: 1,
            searchType: "objectId",
          });
        }
      } catch {
        // Si falla, continuar con búsqueda normal
      }
    }

    // Si es búsqueda por EAN, buscar variante y luego su producto base
    if (searchType === "ean") {
      const variantesCollection = db.collection("productos_variantes");
      const variante = await variantesCollection.findOne({ ean: query });
      
      if (variante) {
        const producto = await adminService.getProductoBaseById(variante.productoBaseId);
        if (producto) {
          const count = await variantesCollection.countDocuments({ productoBaseId: producto.id });
          
          return NextResponse.json({
            success: true,
            productos: [{ ...producto, variantesCount: count }],
            total: 1,
            page: 1,
            totalPages: 1,
            searchType: "ean",
            matchedEan: query,
          });
        }
      }
    }

    // Búsqueda normal por texto
    const result = await adminService.searchProducts({
      query,
      marca,
      categoria,
      page,
      limit,
    });

    // Obtener los conteos de variantes en una sola consulta agregada (evita N+1)
    const productIds = result.productos.map((p) => p.id);
    
    let productosConVariantes = result.productos.map(producto => ({
      ...producto,
      variantesCount: 0,
    }));

    if (productIds.length > 0) {
      const variantesCollection = db.collection("productos_variantes");
      const variantCounts = await variantesCollection.aggregate([
        { $match: { productoBaseId: { $in: productIds } } },
        { $group: { _id: "$productoBaseId", count: { $sum: 1 } } }
      ]).toArray();

      // Crear un mapa para acceso O(1)
      const countMap = new Map(variantCounts.map((vc: any) => [vc._id, vc.count]));

      // Mapear los productos con su conteo de variantes
      productosConVariantes = result.productos.map(producto => ({
        ...producto,
        variantesCount: countMap.get(producto.id) || 0,
      }));
    }

    return NextResponse.json({
      success: true,
      productos: productosConVariantes,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      searchType: "text",
    });
  } catch (error) {
    console.error("❌ Error al buscar productos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al buscar productos",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/productos
 * Crear un nuevo producto base
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, marca, categoria, imagen } = body;

    // Validar campo requerido
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre del producto es requerido" },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    const db = await getDatabase();
    const collection = db.collection("productos_base");

    // Crear documento
    const nuevoProducto = {
      nombre: nombre.trim(),
      marca: marca?.trim() || "",
      categoria: categoria?.trim() || "",
      imagen: imagen?.trim() || undefined,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(nuevoProducto);

    return NextResponse.json({
      success: true,
      producto: {
        id: result.insertedId.toString(),
        ...nuevoProducto,
      },
      message: "Producto creado correctamente",
    });
  } catch (error) {
    console.error("❌ Error al crear producto:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear producto",
      },
      { status: 500 }
    );
  }
}
