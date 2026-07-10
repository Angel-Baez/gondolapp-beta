import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Config de los tests de integración: corren contra un stack de Supabase
 * REAL (local vía `supabase start`, o el branch de staging), sin jsdom y
 * sin ningún mock. Ver src/tests/integration/README.md para levantarlo.
 *
 * Separado del run default a propósito: `npm test` debe seguir siendo verde
 * sin Docker ni stack local. Esta suite es el gate de la Fase 2 del
 * proyecto multi-tienda (docs/SPECMULTIUSER.md §2.4).
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/integration/**/*.test.ts'],
    // Sin setupFiles: acá no se mockea nada.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
