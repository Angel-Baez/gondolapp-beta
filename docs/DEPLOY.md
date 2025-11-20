# 🚀 Deploy Rápido en Vercel

## Opción 1: Deploy con un Click (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Angel-Baez/gondolapp-beta)

---

## Opción 2: Desde GitHub

### Paso 1: Push a GitHub

```bash
git add .
git commit -m "chore: preparar deploy en Vercel"
git push origin main
```

### Paso 2: Importar en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click en "Import Git Repository"
3. Selecciona `Angel-Baez/gondolapp-beta`
4. Framework: **Next.js** (auto-detectado)

### Paso 3: Variables de Entorno

Añade estas variables en la configuración:

```env
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster0.xxxxx.mongodb.net/gondolapp?retryWrites=true&w=majority
NEXT_PUBLIC_GEMINI_API_KEY=tu_gemini_api_key
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash-exp
```

### Paso 4: Deploy

Click en **"Deploy"** y espera ~2-3 minutos ☕

---

## Opción 3: Desde CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## ✅ Verificación Post-Deploy

### 1. Check de PWA

- Abre la app en Chrome Mobile
- Menú > "Agregar a pantalla de inicio"
- Prueba funcionalidad offline

### 2. Test de API

```bash
curl https://tu-app.vercel.app/api/sync
```

### 3. Lighthouse Score

- Abre Chrome DevTools
- Tab "Lighthouse"
- Ejecuta auditoría
- **Objetivo**: Performance >90, PWA 100

---

## 📋 Checklist Pre-Deploy

- [x] `.env.local` en `.gitignore`
- [x] `vercel.json` configurado
- [x] Build local exitoso (`npm run build`)
- [ ] Variables de entorno preparadas
- [ ] MongoDB accesible desde internet (0.0.0.0/0)

---

## 🔧 Troubleshooting

### "MONGODB_URI is not defined"

➡️ Añade la variable en Vercel Dashboard > Settings > Environment Variables

### Build falla

➡️ Ejecuta `npm run build` localmente para ver errores

### PWA no instala

➡️ Verifica que estés usando HTTPS (Vercel lo hace automático)

---

## 📚 Documentación Completa

Ver [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md) para:

- Configuración avanzada
- Monitoreo y logs
- Optimizaciones
- Seguridad
- Troubleshooting detallado

---

## 🎯 URLs Útiles

- **Dashboard Vercel**: https://vercel.com/dashboard
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Gemini API Keys**: https://makersuite.google.com/app/apikey

---

**¿Problemas?** Revisa los logs: `vercel logs --follow`
