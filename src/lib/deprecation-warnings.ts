/**
 * Sistema de warnings para código deprecated
 */

const WARNED_FUNCTIONS = new Set<string>();

export function deprecationWarning(
  functionName: string,
  replacement: string,
  removalVersion: string = "v2.0"
) {
  // Solo mostrar warning una vez por función
  if (WARNED_FUNCTIONS.has(functionName)) return;
  
  WARNED_FUNCTIONS.add(functionName);
  
  console.warn(
    `⚠️ DEPRECATED: ${functionName}() será eliminado en ${removalVersion}\n` +
    `   Usar: ${replacement}\n` +
    `   Docs: https://github.com/Angel-Baez/gondolapp-beta/wiki/Migration-Guide`
  );
}
