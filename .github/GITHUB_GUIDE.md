# 🚀 Guía de Integración con GitHub

Esta guía te ayudará a aprovechar al máximo las funcionalidades de GitHub integradas en el proyecto GondolApp.

## 📋 Contenido

- [Workflows Automatizados](#workflows-automatizados)
- [Plantillas de Issues y PRs](#plantillas-de-issues-y-prs)
- [Control de Versiones](#control-de-versiones)
- [Comandos Útiles](#comandos-útiles)
- [Configuración de Secrets](#configuración-de-secrets)

## 🤖 Workflows Automatizados

### CI - Build & Lint (`ci.yml`)

**Se ejecuta en:** Push y PRs a `main` y `develop`

**Qué hace:**

- ✅ Ejecuta el linter
- 🏗️ Construye el proyecto
- 📝 Verifica errores de TypeScript
- 🧪 Prueba en Node.js 18.x y 20.x

**Ver estado:** Busca el badge verde/rojo en tu PR

### Deploy a Vercel (`deploy.yml`)

**Se ejecuta en:** Push a `main`

**Qué hace:**

- 📦 Construye la app para producción
- 🚀 Despliega automáticamente a Vercel
- 🌐 Genera una URL de preview para PRs

**Configuración requerida:**

1. Ve a Settings → Secrets and variables → Actions
2. Agrega `VERCEL_TOKEN` (obtén uno en https://vercel.com/account/tokens)

### Análisis de Seguridad (`codeql.yml`)

**Se ejecuta en:**

- Push a `main` y `develop`
- Todos los PRs
- Lunes a medianoche (automático)

**Qué hace:**

- 🔒 Escanea el código en busca de vulnerabilidades
- 📊 Genera reportes de seguridad
- 🚨 Alerta sobre problemas críticos

**Ver reportes:** Security tab → Code scanning alerts

### Auto-Etiquetado (`label.yml`)

**Se ejecuta en:** Al abrir o editar PRs

**Qué hace:**

- 🏷️ Agrega etiquetas automáticamente según archivos modificados
- Ejemplos:
  - Cambios en `src/components/` → etiqueta `components`
  - Cambios en `docs/` → etiqueta `docs`
  - Cambios en scanner → etiqueta `scanner`

## 📝 Plantillas de Issues y PRs

### Crear un Bug Report

1. Ve a Issues → New Issue
2. Selecciona "🐛 Bug Report"
3. Llena los campos:
   - Descripción clara del bug
   - Pasos para reproducir
   - Sección afectada
   - Entorno (dispositivo, navegador, OS)
   - Screenshots si aplica

### Solicitar una Nueva Funcionalidad

1. Ve a Issues → New Issue
2. Selecciona "✨ Feature Request"
3. Describe:
   - Problema que resuelve
   - Solución propuesta
   - Categoría
   - Prioridad

### Abrir un Pull Request

Cuando crees un PR, se pre-llenará con:

- ✅ Checklist de cambios
- 🧪 Lista de testing
- 📝 Plantilla estructurada

**Consejos:**

- Marca todos los checkboxes aplicables
- Agrega screenshots si hay cambios visuales
- Referencia el issue relacionado con `Closes #123`

## 🔄 Control de Versiones

### Flujo de Trabajo Recomendado

```bash
# 1. Actualizar rama main
git checkout main
git pull origin main

# 2. Crear rama para tu feature
git checkout -b feature/nombre-descriptivo

# 3. Hacer cambios y commits
git add .
git commit -m "feat(scanner): agregar soporte para QR codes"

# 4. Push a tu rama
git push origin feature/nombre-descriptivo

# 5. Abrir PR en GitHub
```

### Convenciones de Nombres de Ramas

- `feature/nombre` - Nueva funcionalidad
- `fix/nombre` - Corrección de bugs
- `refactor/nombre` - Refactorización
- `docs/nombre` - Documentación
- `chore/nombre` - Mantenimiento

### Formato de Commits (Conventional Commits)

```
tipo(scope): descripción corta

[descripción detallada opcional]
```

**Tipos:**

- `feat` - Nueva funcionalidad
- `fix` - Bug fix
- `docs` - Documentación
- `style` - Formato de código
- `refactor` - Refactorización
- `perf` - Mejora de rendimiento
- `test` - Tests
- `chore` - Mantenimiento

**Ejemplos:**

```bash
git commit -m "feat(reposicion): agregar filtro por categoría"
git commit -m "fix(scanner): corregir detección de códigos cortos"
git commit -m "docs(readme): actualizar instrucciones de instalación"
git commit -m "perf(db): optimizar queries de vencimientos"
```

## 🛠️ Comandos Útiles

### Gestión de Ramas

```bash
# Ver ramas locales
git branch

# Ver ramas remotas
git branch -r

# Cambiar de rama
git checkout nombre-rama

# Crear y cambiar a nueva rama
git checkout -b feature/nueva-funcionalidad

# Eliminar rama local
git branch -d nombre-rama

# Eliminar rama remota
git push origin --delete nombre-rama
```

### Sincronización

```bash
# Traer cambios del remoto
git fetch origin

# Traer y fusionar cambios
git pull origin main

# Actualizar tu rama con cambios de main
git checkout feature/mi-rama
git rebase main

# Subir cambios
git push origin mi-rama

# Forzar push (¡cuidado!)
git push --force-with-lease origin mi-rama
```

### Historial y Revisión

```bash
# Ver commits recientes
git log --oneline -10

# Ver cambios en archivos
git status

# Ver diferencias
git diff

# Ver diferencias en un archivo específico
git diff src/components/BarcodeScanner.tsx

# Ver cambios entre ramas
git diff main..feature/mi-rama
```

### Stash (Guardar cambios temporalmente)

```bash
# Guardar cambios sin commit
git stash

# Ver stashes guardados
git stash list

# Aplicar último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{0}
```

## 🔐 Configuración de Secrets

Para que los workflows funcionen correctamente, configura estos secrets:

### 1. VERCEL_TOKEN (Para deploys automáticos)

```bash
# 1. Ve a https://vercel.com/account/tokens
# 2. Crea un nuevo token
# 3. En GitHub: Settings → Secrets → New repository secret
# 4. Nombre: VERCEL_TOKEN
# 5. Pega el token
```

### 2. Variables de Entorno para la App

Crea un archivo `.env.local` (NO lo commitees):

```env
MONGODB_URI=tu_uri_de_mongodb
GEMINI_API_KEY=tu_api_key_de_gemini
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

En Vercel, agrega estas mismas variables en:
Settings → Environment Variables

## 📊 Monitoreo y Mantenimiento

### Ver Estado de Workflows

1. Ve a la tab "Actions" en GitHub
2. Revisa el estado de los últimos runs
3. Click en un workflow para ver detalles
4. Revisa logs si hay errores

### Notificaciones

GitHub te notificará cuando:

- ❌ Un workflow falla
- ✅ Un PR está listo para merge
- 💬 Alguien comenta en tu PR/Issue
- 🔒 Se detecta una vulnerabilidad

Configura en: Settings → Notifications

### Protección de Ramas

Recomendación para `main`:

1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Habilitar:
   - ✅ Require pull request reviews (1 reviewer)
   - ✅ Require status checks to pass (CI)
   - ✅ Require branches to be up to date
   - ✅ Include administrators

## 🎯 Mejores Prácticas

### ✅ DO

- Hacer commits pequeños y frecuentes
- Escribir mensajes de commit descriptivos
- Crear PRs con un propósito claro
- Mantener las ramas actualizadas con `main`
- Hacer code review de otros PRs
- Cerrar ramas después de merge

### ❌ DON'T

- Commitear archivos grandes o binarios
- Hacer commits directos a `main`
- Dejar PRs abiertos por mucho tiempo
- Ignorar los warnings del CI
- Commitear credenciales o secrets
- Forzar push sin razón justificada

## 🆘 Troubleshooting

### "Your branch is behind 'origin/main'"

```bash
git pull origin main
# Si hay conflictos, resuélvelos
git push origin tu-rama
```

### "Merge conflicts"

```bash
# 1. Actualiza tu rama
git checkout tu-rama
git fetch origin
git merge origin/main

# 2. Resuelve conflictos en los archivos marcados
# 3. Marca como resueltos
git add archivo-con-conflicto.tsx

# 4. Completa el merge
git commit -m "fix: resolver conflictos con main"
git push origin tu-rama
```

### "CI failing"

1. Ve a Actions → Click en el run fallido
2. Revisa los logs del step que falló
3. Ejecuta localmente:
   ```bash
   npm run lint
   npm run build
   ```
4. Corrige errores y push nuevamente

### "Can't push to protected branch"

No puedes hacer push directo a `main`. Debes:

1. Crear una rama
2. Hacer cambios ahí
3. Abrir un PR

## 📚 Recursos Adicionales

- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Guía de Contribución](../CONTRIBUTING.md)
- [Documentación del Proyecto](../docs/)

---

**¿Preguntas?** Abre una [discusión](https://github.com/Angel-Baez/gondolapp-beta/discussions) o consulta la [documentación](../docs/).
