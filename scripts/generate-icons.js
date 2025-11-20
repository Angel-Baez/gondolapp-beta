const fs = require("fs");
const path = require("path");

// SVG para 192x192
const svg192 = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#6366F1"/>
  <text x="96" y="96" font-size="80" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">GA</text>
</svg>`;

// SVG para 512x512
const svg512 = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#6366F1"/>
  <text x="256" y="256" font-size="220" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">GA</text>
</svg>`;

// Favicon (16x16)
const svgFavicon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#6366F1"/>
</svg>`;

// Crear directorio public si no existe
const publicDir = path.join(__dirname, "..", "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Guardar los archivos
fs.writeFileSync(path.join(publicDir, "icon-192x192.svg"), svg192);
fs.writeFileSync(path.join(publicDir, "icon-512x512.svg"), svg512);
fs.writeFileSync(path.join(publicDir, "favicon.svg"), svgFavicon);

console.log("✅ Iconos SVG creados exitosamente en /public");
console.log("   - icon-192x192.svg");
console.log("   - icon-512x512.svg");
console.log("   - favicon.svg");
console.log("\n💡 Para crear PNG reales, usa una herramienta como:");
console.log("   - https://realfavicongenerator.net/");
console.log("   - o convierte los SVG con ImageMagick/Sharp");
