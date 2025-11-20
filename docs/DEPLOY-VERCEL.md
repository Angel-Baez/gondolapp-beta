# 🚀 Despliegue en Vercel - GondolApp

## Preparación del Proyecto

### 1. Variables de Entorno

Configura las siguientes variables en el dashboard de Vercel (Settings > Environment Variables):

```bash
# MongoDB (REQUERIDO)
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/gondolapp?retryWrites=true&w=majority

# Gemini AI (REQUERIDO para normalización de productos)
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash-exp
```

**Importante**:

- Las variables con prefijo `NEXT_PUBLIC_` están disponibles en el cliente
- `MONGODB_URI` solo está disponible en el servidor (API routes)

---

## 2. Configuración de Vercel

### Archivo `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Headers de Seguridad Configurados

- ✅ **X-Content-Type-Options**: Previene MIME sniffing
- ✅ **X-Frame-Options**: Protección contra clickjacking
- ✅ **X-XSS-Protection**: Protección XSS
- ✅ **Service-Worker-Allowed**: Permite PWA en toda la app
- ✅ **Cache-Control**: Optimizado para SW y manifest

---

## 3. Despliegue Paso a Paso

### Opción A: Desde GitHub (Recomendado)

1. **Conecta tu repositorio a Vercel**

   ```bash
   # Asegúrate de que tu código esté en GitHub
   git push origin main
   ```

2. **Importa el proyecto en Vercel**

   - Ve a [vercel.com/new](https://vercel.com/new)
   - Selecciona tu repositorio `gondolapp-beta`
   - Framework Preset: **Next.js** (auto-detectado)

3. **Configura variables de entorno**

   - Añade `MONGODB_URI`
   - Añade `NEXT_PUBLIC_GEMINI_API_KEY`
   - Añade `NEXT_PUBLIC_GEMINI_MODEL`

4. **Deploy**
   - Click en "Deploy"
   - Espera ~2-3 minutos

### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy a preview
vercel

# Deploy a producción
vercel --prod
```

---

## 4. Post-Despliegue

### Verificar PWA

1. Abre tu app en Chrome mobile
2. Menú > "Agregar a pantalla de inicio"
3. Verifica que funcione offline

### Probar API Routes

```bash
# Health check
curl https://tu-app.vercel.app/api/sync

# Buscar producto
curl https://tu-app.vercel.app/api/productos/buscar?ean=7790310081457
```

### Lighthouse Audit

```bash
# Instalar
npm install -g lighthouse

# Ejecutar
lighthouse https://tu-app.vercel.app --view
```

**Objetivos**:

- Performance: >90
- PWA: 100
- Accessibility: >90
- Best Practices: 100

---

## 5. Dominios Personalizados

### Añadir dominio

```bash
vercel domains add gondolapp.com
```

En tu proveedor DNS, añade:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

---

## 6. Configuración Avanzada

### Build Settings

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto)
- **Install Command**: `npm install`
- **Node Version**: 20.x (auto-detectado)

### Environment Variables por Entorno

```bash
# Producción
MONGODB_URI=mongodb+srv://...prod...
NEXT_PUBLIC_GEMINI_API_KEY=prod_key

# Preview (opcional)
MONGODB_URI=mongodb+srv://...dev...
NEXT_PUBLIC_GEMINI_API_KEY=dev_key
```

---

## 7. CI/CD Automático

Cada push a `main` desplegará automáticamente:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# ✅ Auto-deploy en Vercel
```

### Preview Deployments

Cada PR genera un preview único:

```bash
git checkout -b feature/nueva-funcion
git push origin feature/nueva-funcion
# ✅ URL de preview: gondolapp-git-feature-nueva-funcion.vercel.app
```

---

## 8. Monitoreo y Analytics

### Vercel Analytics (Opcional)

```bash
npm install @vercel/analytics
```

```tsx
// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Logs en Tiempo Real

```bash
vercel logs gondolapp-beta --follow
```

---

## 9. Optimizaciones para Producción

### Recomendaciones Aplicadas

✅ **Imágenes Optimizadas**

```js
// next.config.js
images: {
  remotePatterns: [
    { hostname: "images.openfoodfacts.org" }
  ],
}
```

✅ **PWA Configurado**

- Service Worker en `/public/sw.js`
- Manifest en `/public/manifest.json`

✅ **API Routes con Edge Runtime** (opcional)

```ts
export const runtime = "edge"; // Para menor latencia
```

---

## 10. Troubleshooting

### Error: "MONGODB_URI is not defined"

**Solución**: Verifica que la variable esté en Settings > Environment Variables

### Error: Build failed

```bash
# Prueba el build localmente primero
npm run build
```

### PWA no funciona

1. Verifica que sea **HTTPS** (Vercel auto)
2. Revisa `/sw.js` en DevTools > Application
3. Fuerza refresco: Shift + F5

### API Route Timeout

Vercel tiene límite de **10 segundos** para serverless functions.

**Solución**: Optimiza queries de MongoDB con índices:

```js
// En MongoDB Atlas
db.productosBase.createIndex({ nombre: "text" });
db.productosVariantes.createIndex({ codigoBarras: 1 });
```

---

## 11. Seguridad

### Whitelist de IPs MongoDB (Recomendado)

En MongoDB Atlas > Network Access:

```
0.0.0.0/0  # Permite todas las IPs (Vercel usa IPs dinámicas)
```

**Alternativa más segura**: Usa MongoDB Vercel Integration

```bash
vercel integration add mongodb-atlas
```

### Rate Limiting (Opcional)

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const ip = request.ip ?? "unknown";
  // Implementar rate limiting por IP
}
```

---

## 12. Costos

### Vercel Free Tier (Hobby)

- ✅ 100 GB bandwidth/mes
- ✅ Serverless Functions: 100 horas/mes
- ✅ Builds: Ilimitados
- ✅ Preview deployments: Ilimitados
- ✅ SSL automático
- ✅ CI/CD automático

**Suficiente para**:

- ~10,000 usuarios activos/mes
- ~100,000 page views/mes

### MongoDB Atlas Free Tier (M0)

- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Compartido vCPU

**Suficiente para**:

- ~5,000 productos
- ~10,000 scans/mes

---

## 13. Checklist Pre-Deploy

- [ ] `.env.local` en `.gitignore` (✅ ya configurado)
- [ ] Variables de entorno configuradas en Vercel
- [ ] `npm run build` ejecuta sin errores
- [ ] MongoDB accesible desde 0.0.0.0/0
- [ ] Service Worker funciona en local
- [ ] API routes responden correctamente
- [ ] Lighthouse score >90 en Performance

---

## 14. URLs de Referencia

- **Dashboard Vercel**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Docs Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [cloud.mongodb.com](https://cloud.mongodb.com)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

## 15. Comandos Útiles

```bash
# Ver deployments
vercel ls

# Logs de producción
vercel logs gondolapp-beta --prod

# Eliminar deployment
vercel rm <deployment-url>

# Ver detalles del proyecto
vercel inspect

# Rollback a deployment anterior
vercel rollback <deployment-url>
```

---

**Última actualización**: 20 Noviembre 2025
