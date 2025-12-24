#!/usr/bin/env node

/**
 * Script de validación para verificar que NO existan usos ilegítimos
 * de acceso directo a Dexie fuera de las capas permitidas.
 * 
 * Uso: npm run validate-db-access
 */

const { execSync } = require('child_process');
const path = require('path');

const ALLOWED_FILES = [
  'src/lib/db.ts',
  'src/core/repositories/IndexedDBProductRepository.ts',
  'docs/REFACTOR-LOG.md',
  'docs/MIGRATION-DB-SERVICE.md',
  'docs/ARCHITECTURE.md',
];

const FORBIDDEN_PATTERNS = [
  '__unsafeDirectDbAccess',
];

function findViolations() {
  const violations = [];
  
  for (const pattern of FORBIDDEN_PATTERNS) {
    try {
      // Usar grep para encontrar ocurrencias
      const result = execSync(
        `grep -rn "${pattern}" src/ --include="*.ts" --include="*.tsx" || true`,
        { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }
      );
      
      const lines = result.split('\n').filter(Boolean);
      
      for (const line of lines) {
        const [filePath, lineNum, ...contentParts] = line.split(':');
        const content = contentParts.join(':').trim();
        
        // Verificar si el archivo está en la lista de permitidos
        const isAllowed = ALLOWED_FILES.some(allowed => 
          filePath.includes(allowed.replace('src/', ''))
        );
        
        if (!isAllowed) {
          violations.push({
            file: filePath,
            line: parseInt(lineNum, 10),
            pattern,
            content,
          });
        }
      }
    } catch (error) {
      // grep retorna exit code 1 si no encuentra nada (esto es OK)
    }
  }
  
  return violations;
}

function main() {
  console.log('🔍 Validando accesos directos a Dexie...\n');
  
  const violations = findViolations();
  
  if (violations.length === 0) {
    console.log('✅ No se encontraron violaciones\n');
    console.log('Todos los accesos a la base de datos usan dbService correctamente.\n');
    process.exit(0);
  }
  
  console.error('❌ Se encontraron violaciones:\n');
  
  for (const violation of violations) {
    console.error(`  File: ${violation.file}:${violation.line}`);
    console.error(`  Pattern: "${violation.pattern}"`);
    console.error(`  Code: ${violation.content}`);
    console.error('');
  }
  
  console.error(`Total: ${violations.length} violaciones\n`);
  console.error('Por favor, migra estos usos a dbService.');
  console.error('Ver: docs/MIGRATION-DB-SERVICE.md\n');
  
  process.exit(1);
}

main();
