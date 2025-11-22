# 📋 GitHub Actions Workflows

Esta carpeta contiene los workflows automatizados de GitHub Actions para el proyecto GondolApp.

## 🤖 Workflows Disponibles

### 1. CI - Build & Lint (`ci.yml`)

**Estado:** ✅ Activo  
**Trigger:** Push y Pull Requests a `main` y `develop`  
**Duración aproximada:** 2-3 minutos

**Qué hace:**

- Instala dependencias con `npm ci`
- Ejecuta el linter (`npm run lint`)
- Construye el proyecto (`npm run build`)
- Verifica tipos de TypeScript (`tsc --noEmit`)

**Matrix Testing:**

- Node.js 18.x
- Node.js 20.x

**Sin configuración adicional requerida** ✅

---

### 2. Deploy to Vercel (`deploy.yml`)

**Estado:** ⚠️ Requiere configuración  
**Trigger:** Push a `main`  
**Duración aproximada:** 3-5 minutos

**Qué hace:**

- Instala Vercel CLI
- Descarga información del entorno de producción
- Construye el proyecto para producción
- Despliega a Vercel automáticamente

**Secrets requeridos:**

- `VERCEL_TOKEN` (obligatorio)
- `VERCEL_ORG_ID` (recomendado)
- `VERCEL_PROJECT_ID` (recomendado)

**⚙️ [Ver guía de configuración](../SECRETS_SETUP.md)**

---

### 3. CodeQL Security Analysis (`codeql.yml`)

**Estado:** ✅ Activo  
**Trigger:**

- Push a `main` y `develop`
- Pull Requests a `main`
- Scheduled: Todos los lunes a medianoche

**Duración aproximada:** 5-10 minutos

**Qué hace:**

- Escanea el código en busca de vulnerabilidades
- Analiza JavaScript y TypeScript
- Genera reportes de seguridad
- Alerta sobre problemas críticos

**Ver reportes:** `Security` tab → `Code scanning alerts`

**Sin configuración adicional requerida** ✅

---

### 4. Auto Label PRs (`label.yml`)

**Estado:** ✅ Activo  
**Trigger:** PRs abiertos, editados o sincronizados  
**Duración aproximada:** < 30 segundos

**Qué hace:**

- Agrega etiquetas automáticamente según archivos modificados
- Usa configuración de `.github/labeler.yml`

**Etiquetas automáticas:**

- `components` - Cambios en componentes
- `hooks` - Cambios en hooks
- `database` - Cambios en DB o core
- `ui` - Cambios en UI
- `scanner` - Cambios en scanner
- `reposicion` - Cambios en reposición
- `vencimiento` - Cambios en vencimientos
- `api` - Cambios en APIs
- `docs` - Cambios en documentación
- `config` - Cambios en configuración
- `pwa` - Cambios en PWA

**Sin configuración adicional requerida** ✅

---

## 🎯 Orden de Ejecución Recomendado

Para un flujo de trabajo típico:

1. **Desarrollo local** → Código + commits
2. **Push a rama** → Activa `ci.yml` (lint + build)
3. **Abrir PR** → Activa `label.yml` + `ci.yml` + `codeql.yml`
4. **Merge a main** → Activa `deploy.yml` (si está configurado)

## 📊 Monitoreo

### Ver estado de workflows

```
Repositorio → Actions tab
```

### Ver logs detallados

```
Actions → Click en workflow → Click en job → Expandir steps
```

### Badges de estado

Puedes agregar badges al README:

```markdown
![CI](https://github.com/Angel-Baez/gondolapp-beta/workflows/CI%20-%20Build%20%26%20Lint/badge.svg)
![Security](https://github.com/Angel-Baez/gondolapp-beta/workflows/CodeQL%20Security%20Analysis/badge.svg)
```

## 🔧 Mantenimiento

### Actualizar versiones de actions

Los workflows usan versiones específicas:

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `github/codeql-action@v3`
- `actions/labeler@v5`

Revisa actualizaciones en: https://github.com/actions

### Modificar triggers

Edita la sección `on:` de cada workflow:

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 0 * * 1" # Lunes a medianoche
```

### Deshabilitar un workflow

**Opción 1:** Renombrar el archivo

```bash
mv ci.yml ci.yml.disabled
```

**Opción 2:** Agregar condición `if: false`

```yaml
jobs:
  build:
    if: false
    runs-on: ubuntu-latest
```

**Opción 3:** Desde la UI de GitHub

```
Actions → Workflow → ⋯ → Disable workflow
```

## 🚨 Troubleshooting

### CI falla con errores de lint

```bash
# Ejecuta localmente para ver detalles
npm run lint

# Auto-fix errores comunes
npm run lint -- --fix
```

### Build falla

```bash
# Limpia caché y reinstala
rm -rf node_modules .next
npm ci
npm run build
```

### Deploy falla

1. Verifica que los secrets estén configurados
2. Revisa los logs en Actions
3. Consulta [SECRETS_SETUP.md](../SECRETS_SETUP.md)

### CodeQL tarda mucho

Es normal. El análisis de seguridad puede tardar 5-15 minutos en proyectos grandes.

## 📈 Optimizaciones

### Caché de node_modules

Ya implementado en `ci.yml`:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: "npm"
```

### Ejecución paralela

Los workflows se ejecutan en paralelo automáticamente.

### Condicionales para reducir ejecuciones

```yaml
# Solo en cambios a código fuente
on:
  push:
    paths:
      - "src/**"
      - "package.json"
```

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Marketplace](https://github.com/marketplace?type=actions)
- [Guía de GitHub](../GITHUB_GUIDE.md)

---

**Última actualización:** 22 de noviembre de 2025
