import { getDatabase } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sync
 * Obtiene productos y listas desde MongoDB con filtros y paginación
 *
 * Query params:
 * - tipo: "productos" | "reposicion" | "vencimientos" | "all" (default: "all")
 * - desde: fecha ISO (filtrar desde esta fecha)
 * - hasta: fecha ISO (filtrar hasta esta fecha)
 * - page: número de página (default: 1)
 * - limit: items por página (default: 100, max: 500)
 * - estado: "pendiente" | "repuesto" | "all" (para reposición)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") || "all";
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const estado = searchParams.get("estado");

    const db = await getDatabase();
    const skip = (page - 1) * limit;

    // Construir filtro de fechas
    const fechaFilter: any = {};
    if (desde || hasta) {
      if (desde) fechaFilter.$gte = new Date(desde);
      if (hasta) fechaFilter.$lte = new Date(hasta);
    }

    let data: any = {};
    let total: any = {};

    // Productos
    if (tipo === "productos" || tipo === "all") {
      const baseQuery = fechaFilter.$gte ? { createdAt: fechaFilter } : {};
      const variantesQuery = fechaFilter.$gte ? { createdAt: fechaFilter } : {};

      const [productosBase, variantes, countBase, countVariantes] =
        await Promise.all([
          db
            .collection("productos_base")
            .find(baseQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          db
            .collection("productos_variantes")
            .find(variantesQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          db.collection("productos_base").countDocuments(baseQuery),
          db.collection("productos_variantes").countDocuments(variantesQuery),
        ]);

      data.productosBase = productosBase;
      data.variantes = variantes;
      total.productosBase = countBase;
      total.variantes = countVariantes;
    }

    // Reposición
    if (tipo === "reposicion" || tipo === "all") {
      const repoQuery: any = {};
      if (fechaFilter.$gte) repoQuery.agregadoAt = fechaFilter;
      if (estado === "pendiente") repoQuery.repuesto = false;
      if (estado === "repuesto") repoQuery.repuesto = true;

      const [reposicion, countRepo] = await Promise.all([
        db
          .collection("items_reposicion")
          .find(repoQuery)
          .sort({ agregadoAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection("items_reposicion").countDocuments(repoQuery),
      ]);

      data.reposicion = reposicion;
      total.reposicion = countRepo;
    }

    // Vencimientos
    if (tipo === "vencimientos" || tipo === "all") {
      const vencQuery: any = {};
      if (fechaFilter.$gte) vencQuery.agregadoAt = fechaFilter;

      const [vencimientos, countVenc] = await Promise.all([
        db
          .collection("items_vencimiento")
          .find(vencQuery)
          .sort({ fechaVencimiento: 1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection("items_vencimiento").countDocuments(vencQuery),
      ]);

      data.vencimientos = vencimientos;
      total.vencimientos = countVenc;
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: Object.values(total).some((t: any) => t > page * limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en sync GET:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al sincronizar",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync
 * Sincroniza datos con upsert (actualizar si existe, insertar si no)
 *
 * Body: {
 *   productosBase?: Array<{nombre, marca, categoria, ...}>,
 *   variantes?: Array<{ean, nombreCompleto, productoBaseId, ...}>,
 *   reposicion?: Array<{varianteId, cantidad, ...}>,
 *   vencimientos?: Array<{varianteId, fechaVencimiento, ...}>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();

    const { productosBase, variantes, reposicion, vencimientos } = body;
    const results: any = {
      inserted: {},
      updated: {},
      errors: [],
    };

    // UPSERT Productos Base (por nombre + marca)
    if (productosBase?.length) {
      let inserted = 0,
        updated = 0;
      for (const producto of productosBase) {
        try {
          const result = await db.collection("productos_base").updateOne(
            { nombre: producto.nombre, marca: producto.marca },
            {
              $set: {
                ...producto,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: producto.createdAt || new Date(),
              },
            },
            { upsert: true }
          );
          if (result.upsertedCount > 0) inserted++;
          else if (result.modifiedCount > 0) updated++;
        } catch (err) {
          results.errors.push({
            type: "productoBase",
            item: producto.nombre,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }
      results.inserted.productosBase = inserted;
      results.updated.productosBase = updated;
    }

    // UPSERT Variantes (por EAN único)
    if (variantes?.length) {
      let inserted = 0,
        updated = 0;
      for (const variante of variantes) {
        try {
          const result = await db.collection("productos_variantes").updateOne(
            { ean: variante.ean },
            {
              $set: {
                ...variante,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: variante.createdAt || new Date(),
              },
            },
            { upsert: true }
          );
          if (result.upsertedCount > 0) inserted++;
          else if (result.modifiedCount > 0) updated++;
        } catch (err) {
          results.errors.push({
            type: "variante",
            item: variante.ean,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }
      results.inserted.variantes = inserted;
      results.updated.variantes = updated;
    }

    // UPSERT Items Reposición (por varianteId + repuesto=false)
    if (reposicion?.length) {
      let inserted = 0,
        updated = 0;
      for (const item of reposicion) {
        try {
          const result = await db.collection("items_reposicion").updateOne(
            {
              varianteId: item.varianteId,
              repuesto: false,
            },
            {
              $set: {
                ...item,
                actualizadoAt: new Date(),
              },
              $setOnInsert: {
                agregadoAt: item.agregadoAt || new Date(),
              },
            },
            { upsert: true }
          );
          if (result.upsertedCount > 0) inserted++;
          else if (result.modifiedCount > 0) updated++;
        } catch (err) {
          results.errors.push({
            type: "reposicion",
            item: item.varianteId,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }
      results.inserted.reposicion = inserted;
      results.updated.reposicion = updated;
    }

    // UPSERT Items Vencimiento (por varianteId + fechaVencimiento)
    if (vencimientos?.length) {
      let inserted = 0,
        updated = 0;
      for (const item of vencimientos) {
        try {
          const result = await db.collection("items_vencimiento").updateOne(
            {
              varianteId: item.varianteId,
              fechaVencimiento: item.fechaVencimiento,
            },
            {
              $set: {
                ...item,
                actualizadoAt: new Date(),
              },
              $setOnInsert: {
                agregadoAt: item.agregadoAt || new Date(),
              },
            },
            { upsert: true }
          );
          if (result.upsertedCount > 0) inserted++;
          else if (result.modifiedCount > 0) updated++;
        } catch (err) {
          results.errors.push({
            type: "vencimiento",
            item: item.varianteId,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }
      results.inserted.vencimientos = inserted;
      results.updated.vencimientos = updated;
    }

    return NextResponse.json({
      success: true,
      message: "Sincronización completada",
      results,
    });
  } catch (error) {
    console.error("❌ Error en sync POST:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al sincronizar",
      },
      { status: 500 }
    );
  }
}
