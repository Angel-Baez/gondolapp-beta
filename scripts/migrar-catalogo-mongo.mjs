/**
 * Migra el catálogo de productos (productos_base / productos_variantes) de
 * MongoDB a Supabase. Es un script de un solo uso para el corte a la nueva
 * arquitectura — correrlo una vez y listo.
 *
 * Uso (los tres son obligatorios; si .env.local ya tiene los de Supabase,
 * alcanza con pasar MONGODB_URI):
 *   npm install --no-save mongodb
 *   MONGODB_URI="mongodb+srv://..." \
 *   NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co" \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..." \
 *   node scripts/migrar-catalogo-mongo.mjs
 */

import { MongoClient } from "mongodb";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

function cargarEnvLocal() {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.join(dir, "..", ".env.local");
  if (!existsSync(envPath)) return;

  const contenido = readFileSync(envPath, "utf-8");
  for (const linea of contenido.split("\n")) {
    const match = linea.trim().match(/^([A-Z_]+)=(.*)$/);
    if (!match) continue;
    const valor = match[2].trim().replace(/^["']|["']$/g, "");
    if (valor && !process.env[match[1]]) {
      process.env[match[1]] = valor;
    }
  }
}

async function main() {
  cargarEnvLocal();

  const mongoUri = process.env.MONGODB_URI;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!mongoUri) throw new Error("Falta MONGODB_URI");
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Falta NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Agregalas a .env.local o pasalas como variables de entorno al correr el script."
    );
  }
  console.log(`Usando Supabase en ${supabaseUrl}`);

  const mongo = new MongoClient(mongoUri);
  const supabase = createClient(supabaseUrl, supabaseKey);

  await mongo.connect();
  console.log("Conectado a MongoDB");

  const db = mongo.db("gondolapp");
  const basesMongo = await db.collection("productos_base").find({}).toArray();
  const variantesMongo = await db.collection("productos_variantes").find({}).toArray();

  console.log(`Encontrados ${basesMongo.length} productos base y ${variantesMongo.length} variantes en Mongo`);

  // Mapa Mongo _id (string) -> UUID nuevo de Supabase
  const idBaseMap = new Map();

  console.log("Migrando productos base...");
  for (const base of basesMongo) {
    const { data, error } = await supabase
      .from("producto_bases")
      .insert({
        nombre: base.nombre,
        marca: base.marca ?? null,
        categoria: base.categoria ?? null,
        imagen: base.imagen ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`Error migrando base "${base.nombre}":`, error.message);
      continue;
    }
    idBaseMap.set(base._id.toString(), data.id);
  }
  console.log(`${idBaseMap.size}/${basesMongo.length} productos base migrados`);

  console.log("Migrando variantes...");
  let variantesMigradas = 0;
  let variantesOmitidas = 0;
  for (const variante of variantesMongo) {
    const productoBaseId = idBaseMap.get(String(variante.productoBaseId));
    if (!productoBaseId) {
      console.warn(`Variante "${variante.ean}" sin producto base migrado, se omite`);
      variantesOmitidas++;
      continue;
    }

    const { error } = await supabase.from("producto_variantes").insert({
      producto_base_id: productoBaseId,
      codigo_barras: variante.ean,
      nombre_completo: variante.nombreCompleto,
      tipo: variante.tipo ?? null,
      tamano: variante.tamano ?? null,
      sabor: variante.sabor ?? null,
      imagen: variante.imagen ?? null,
    });

    if (error) {
      console.error(`Error migrando variante "${variante.ean}":`, error.message);
      variantesOmitidas++;
      continue;
    }
    variantesMigradas++;
  }

  console.log(`${variantesMigradas}/${variantesMongo.length} variantes migradas (${variantesOmitidas} omitidas)`);

  await mongo.close();
  console.log("Listo.");
}

main().catch((err) => {
  console.error("Migración fallida:", err);
  process.exit(1);
});
