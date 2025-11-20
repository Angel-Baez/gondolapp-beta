# ✅ Checklist Deploy Vercel - GondolApp

## Pre-Deploy

### Configuración de Archivos

- [x] `vercel.json` - Configuración de Vercel con headers y regiones
- [x] `.vercelignore` - Archivos a excluir del deploy
- [x] `.eslintrc.json` - Configuración de ESLint
- [x] `.env.example` - Template de variables de entorno actualizado
- [x] `DEPLOY.md` - Guía rápida de despliegue
- [x] `docs/DEPLOY-VERCEL.md` - Documentación completa

### Build y Tests

- [x] `npm run build` - Build exitoso ✅
- [x] Verificación de errores de TypeScript ✅
- [x] Imágenes optimizadas configuradas
- [x] PWA configurado (manifest.json + sw.js)

### Seguridad

- [x] `.env.local` en `.gitignore` ✅
- [x] Headers de seguridad configurados
- [x] Variables sensibles no expuestas en código

---

## Variables de Entorno para Vercel

Configura estas variables en Vercel Dashboard > Settings > Environment Variables:

```bash
# MongoDB (OBLIGATORIO)
MONGODB_URI=mongodb+srv://gabibaez8_db_user:PASSWORD@cluster0.msbl18h.mongodb.net/gondolapp?retryWrites=true&w=majority

# Gemini AI (OBLIGATORIO)
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC18n3jok2bsddYhylJ3wO0SBMskkRbabw
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash
```

**⚠️ IMPORTANTE**: Usa las credenciales reales del archivo `.env.local`

---

## Deploy Steps

### 1. Push a GitHub

```bash
git add .
git commit -m "chore: preparar deploy en Vercel"
git push origin main
```

### 2. Conectar a Vercel

1. Ve a https://vercel.com/new
2. Import Git Repository: `Angel-Baez/gondolapp-beta`
3. Framework: Next.js (auto-detectado)

### 3. Configurar Variables

- Añade `MONGODB_URI`
- Añade `NEXT_PUBLIC_GEMINI_API_KEY`
- Añade `NEXT_PUBLIC_GEMINI_MODEL`

### 4. Deploy

- Click "Deploy"
- Espera 2-3 minutos

---

## Post-Deploy Verification

### Checks Obligatorios

#### 1. ✅ Homepage carga

```bash
curl https://tu-app.vercel.app
```

#### 2. ✅ API funciona

```bash
# Health check
curl https://tu-app.vercel.app/api/sync

# Buscar producto
curl "https://tu-app.vercel.app/api/productos/buscar?ean=7790310081457"
```

#### 3. ✅ PWA instala

- Abre en Chrome Mobile
- Menú > "Agregar a pantalla de inicio"
- Verifica ícono en home screen
- Abre y verifica splash screen

#### 4. ✅ Offline funciona

- Abre la app
- Activa modo avión
- Navega por la app
- Verifica que funcione

#### 5. ✅ Escáner funciona

- Permite acceso a cámara
- Escanea código de barras
- Verifica que busque en API
- Verifica que guarde en IndexedDB

---

## MongoDB Atlas Configuration

### Whitelist IPs (OBLIGATORIO)

En MongoDB Atlas > Network Access:

```
IP Address: 0.0.0.0/0
Comment: Vercel serverless functions
```

**⚠️ Nota**: Vercel usa IPs dinámicas, necesitas permitir todas las IPs.

### Alternativa Segura

Usa MongoDB Vercel Integration:

```bash
vercel integration add mongodb-atlas
```

---

## Performance Targets

Ejecutar Lighthouse en producción:

```bash
lighthouse https://tu-app.vercel.app --view
```

### Objetivos

- 🎯 Performance: >90
- 🎯 PWA: 100
- 🎯 Accessibility: >90
- 🎯 Best Practices: 100
- 🎯 SEO: >90

---

## Troubleshooting Común

### ❌ Build falla con error de MongoDB

**Causa**: Conexión a MongoDB durante build time  
**Solución**: Normal, el build continúa. Verificar que `MONGODB_URI` esté en variables de entorno.

### ❌ API devuelve 500

**Causa**: MongoDB no accesible  
**Solución**:

1. Verificar whitelist de IPs (0.0.0.0/0)
2. Verificar `MONGODB_URI` en Vercel
3. Revisar logs: `vercel logs --follow`

### ❌ PWA no instala

**Causa**: Varios posibles  
**Solución**:

1. Verificar HTTPS (Vercel lo hace automático)
2. Verificar `/manifest.json` carga
3. Verificar `/sw.js` carga
4. DevTools > Application > Service Workers

### ❌ Cámara no funciona

**Causa**: Permisos o HTTP  
**Solución**:

1. HTTPS requerido ✅ (Vercel automático)
2. Verificar permisos del navegador
3. Probar en dispositivo real (no emulador)

---

## Comandos Útiles

```bash
# Ver deployments
vercel ls

# Logs en tiempo real
vercel logs gondolapp-beta --follow

# Ver solo errores
vercel logs gondolapp-beta --follow | grep ERROR

# Información del proyecto
vercel inspect

# Rollback a versión anterior
vercel rollback [deployment-url]

# Eliminar deployment
vercel rm [deployment-url]
```

---

## Monitoreo Continuo

### Logs de Producción

```bash
vercel logs gondolapp-beta --prod --follow
```

### Analytics (Opcional)

```bash
npm install @vercel/analytics
```

### Uptime Monitoring

- Usar: UptimeRobot, Pingdom, o StatusCake
- Endpoint: `https://tu-app.vercel.app/api/sync`
- Frecuencia: 5 minutos

---

## Rollback Plan

Si algo sale mal en producción:

```bash
# 1. Ver deployments recientes
vercel ls

# 2. Hacer rollback al anterior
vercel rollback [url-del-deployment-anterior]

# 3. O redeploy desde CLI
vercel --prod
```

---

## Next Steps

Después del deploy exitoso:

1. [ ] Configurar dominio personalizado (opcional)
2. [ ] Configurar alertas de uptime
3. [ ] Configurar Vercel Analytics
4. [ ] Documentar URL de producción
5. [ ] Notificar al equipo
6. [ ] Actualizar README con URL en vivo

---

## URLs de Referencia

- 🔗 **Vercel Dashboard**: https://vercel.com/dashboard
- 🔗 **MongoDB Atlas**: https://cloud.mongodb.com
- 🔗 **Gemini API**: https://makersuite.google.com/app/apikey
- 🔗 **Next.js Deploy Docs**: https://nextjs.org/docs/deployment

---

**Status**: ✅ Listo para deploy  
**Fecha**: 20 Noviembre 2025  
**Próximo paso**: `git push origin main` y conectar en Vercel
