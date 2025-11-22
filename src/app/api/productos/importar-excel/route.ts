import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getDatabase } from "@/lib/mongodb";
import {
  ProductoBaseMongo,
  ProductoVarianteMongo,
  ResultadoImportacion,
} from "@/types";

/**
 * Extrae volumen y unidad de un string tipo "360g", "1L", "500ml"
 */
function extraerVolumenUnidad(tamano: string): {
  volumen: number | null;
  unidad: string | null;
} {
  const match = tamano.match(
    /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|u|unidad|unidades)/i
  );
  if (!match) return { volumen: null, unidad: null };

  const volumen = parseFloat(match[1]);
  let unidad = match[2].toUpperCase();

  // Normalizar unidades
  if (unidad === "UNIDAD" || unidad === "UNIDADES" || unidad === "U") {
    unidad = "UNIDAD";
  }

  return { volumen, unidad };
}

/**
 * POST /api/productos/importar-excel
 *
 * Recibe un archivo Excel con columnas:
 * - ProductoBase: Nombre del producto base (ej: "Nido")
 * - Marca: Marca (ej: "Nestlé")
 * - Categoria: Categoría (ej: "Leche en Polvo")
 * - TipoVariante: Tipo de variante (ej: "Crecimiento")
 * - Tamaño: Tamaño con unidad (ej: "360g")
 * - EAN: Código de barras
 * - Sabor: (Opcional) Sabor
 * - Imagen: (Opcional) URL de imagen
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Leer archivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

    // Conectar a MongoDB
    const db = await getDatabase();
    const productosCollection =
      db.collection<ProductoBaseMongo>("productos_base");
    const variantesCollection = db.collection<ProductoVarianteMongo>(
      "productos_variantes"
    );

    // Contadores
    const contadores = {
      productosBase: 0,
      variantes: 0,
      duplicados: 0,
      errores: 0,
    };

    const errores: Array<{ fila: number; error: string }> = [];

    // Procesar cada fila
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const numeroFila = i + 2; // +2 porque Excel empieza en 1 y hay header

      try {
        // Validar campos requeridos
        if (
          !row.ProductoBase ||
          !row.Marca ||
          !row.Categoria ||
          !row.EAN ||
          !row.Tamaño
        ) {
          errores.push({
            fila: numeroFila,
            error:
              "Faltan campos requeridos (ProductoBase, Marca, Categoria, EAN, Tamaño)",
          });
          contadores.errores++;
          continue;
        }

        // Normalizar EAN (quitar espacios y convertir a string)
        const ean = String(row.EAN).trim();

        // Buscar o crear ProductoBase
        let productoBase = await productosCollection.findOne({
          nombre: row.ProductoBase.trim(),
          marca: row.Marca.trim(),
        });

        if (!productoBase) {
          const nuevoProductoBase: ProductoBaseMongo = {
            nombre: row.ProductoBase.trim(),
            marca: row.Marca.trim(),
            categoria: row.Categoria.trim(),
            imagen: row.Imagen ? String(row.Imagen).trim() : undefined,
            createdAt: new Date(),
          };

          const result = await productosCollection.insertOne(
            nuevoProductoBase as any
          );
          productoBase = {
            ...nuevoProductoBase,
            _id: result.insertedId.toString(),
          };
          contadores.productosBase++;
        }

        // Verificar si el EAN ya existe
        const varianteExistente = await variantesCollection.findOne({ ean });

        if (varianteExistente) {
          errores.push({
            fila: numeroFila,
            error: `EAN ${ean} ya existe en la base de datos`,
          });
          contadores.duplicados++;
          continue;
        }

        // Extraer volumen y unidad
        const { volumen, unidad } = extraerVolumenUnidad(row.Tamaño.trim());

        // Generar nombreCompleto automáticamente
        const partesNombre = [
          row.TipoVariante ? String(row.TipoVariante).trim() : null,
          row.Tamaño ? String(row.Tamaño).trim() : null,
          row.Sabor ? String(row.Sabor).trim() : null,
        ].filter(Boolean);

        const nombreCompleto = partesNombre.join(" ");

        // Crear Variante
        const nuevaVariante: ProductoVarianteMongo = {
          productoBaseId: productoBase._id!.toString(),
          ean,
          nombreCompleto,
          tipo: row.TipoVariante ? String(row.TipoVariante).trim() : undefined,
          tamano: row.Tamaño.trim(),
          volumen: volumen || undefined,
          unidad: unidad || undefined,
          sabor: row.Sabor ? String(row.Sabor).trim() : undefined,
          imagen: row.Imagen ? String(row.Imagen).trim() : undefined,
          createdAt: new Date(),
        };

        await variantesCollection.insertOne(nuevaVariante as any);
        contadores.variantes++;
      } catch (error) {
        console.error(`Error procesando fila ${numeroFila}:`, error);
        errores.push({
          fila: numeroFila,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
        contadores.errores++;
      }
    }

    const resultado: ResultadoImportacion = {
      success: true,
      contadores,
      errores: errores.length > 0 ? errores : undefined,
    };

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al importar Excel:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al procesar el archivo",
      },
      { status: 500 }
    );
  }
}
