/**
 * Script para limpiar productos base duplicados en IndexedDB
 *
 * INSTRUCCIONES:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este código completo
 * 3. Presiona Enter
 * 4. El script agrupará las variantes bajo un solo ProductoBase
 */

(async function limpiarDuplicados() {
  console.log("🧹 Iniciando limpieza de productos duplicados...");

  // Abrir IndexedDB
  const dbRequest = indexedDB.open("gondolapp-db", 3);

  dbRequest.onsuccess = async (event) => {
    const db = event.target.result;
    const transaction = db.transaction(
      ["productosBase", "productosVariantes"],
      "readwrite"
    );

    const productosBaseStore = transaction.objectStore("productosBase");
    const productosVariantesStore =
      transaction.objectStore("productosVariantes");

    // Leer todos los productos base
    const productosBaseRequest = productosBaseStore.getAll();
    productosBaseRequest.onsuccess = async () => {
      const productosBase = productosBaseRequest.result;

      // Agrupar por nombre + marca
      const grupos = {};
      productosBase.forEach((base) => {
        const key = `${base.nombre.toLowerCase()}-${(
          base.marca || ""
        ).toLowerCase()}`;
        if (!grupos[key]) {
          grupos[key] = [];
        }
        grupos[key].push(base);
      });

      // Procesar duplicados
      let duplicadosEliminados = 0;
      let variantesActualizadas = 0;

      for (const [key, bases] of Object.entries(grupos)) {
        if (bases.length > 1) {
          console.log(
            `📦 Encontrados ${bases.length} duplicados de: ${bases[0].nombre}`
          );

          // Mantener el primero, eliminar los demás
          const productoBasePrincipal = bases[0];
          const duplicados = bases.slice(1);

          // Actualizar variantes de los duplicados
          for (const duplicado of duplicados) {
            // Buscar variantes asociadas
            const variantesRequest =
              productosVariantesStore.index("productoBaseId");
            const variantesCursor = variantesRequest.openCursor(
              IDBKeyRange.only(duplicado.id)
            );

            variantesCursor.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor) {
                const variante = cursor.value;
                variante.productoBaseId = productoBasePrincipal.id;
                cursor.update(variante);
                variantesActualizadas++;
                console.log(`  ✓ Variante movida: ${variante.nombreCompleto}`);
                cursor.continue();
              }
            };

            // Eliminar producto base duplicado
            productosBaseStore.delete(duplicado.id);
            duplicadosEliminados++;
          }
        }
      }

      transaction.oncomplete = () => {
        console.log(`✅ Limpieza completada:`);
        console.log(
          `   - ${duplicadosEliminados} productos base duplicados eliminados`
        );
        console.log(`   - ${variantesActualizadas} variantes reagrupadas`);
        console.log("🔄 Recarga la página para ver los cambios");
      };
    };

    transaction.onerror = (error) => {
      console.error("❌ Error en la transacción:", error);
    };
  };

  dbRequest.onerror = (error) => {
    console.error("❌ Error al abrir la base de datos:", error);
  };
})();
