# 🔄 Flujos de Trabajo - Workflows del Equipo

> **Este documento define los flujos de trabajo estándar para el equipo de desarrollo.**
> Todos los agentes deben seguir estos flujos al recomendar procesos.

---

## 📋 Índice de Flujos

1. [Nueva Feature](#-flujo-nueva-feature)
2. [Bug Fix](#-flujo-bug-fix)
3. [Refactoring](#-flujo-refactoring)
4. [Hotfix (Producción)](#-flujo-hotfix)
5. [Release](#-flujo-release)

---

## 🆕 Flujo: Nueva Feature

### Diagrama

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   📝 PLANEAR    │───▶│   💻 DESARROLLAR │───▶│   🧪 PROBAR     │
│                 │    │                 │    │                 │
│ • User Story    │    │ • Backend       │    │ • Unit Tests    │
│ • Criterios AC  │    │ • Frontend      │    │ • Integration   │
│ • Diseño Técnico│    │ • Data Layer    │    │ • E2E           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                       ┌─────────────────┐    ┌───────▼─────────┐
                       │   🚀 DEPLOY     │◀───│   👀 REVIEW     │
                       │                 │    │                 │
                       │ • Staging       │    │ • Code Review   │
                       │ • Production    │    │ • QA Review     │
                       └─────────────────┘    └─────────────────┘
```

### Paso 1: Planear (Product Manager + Solution Architect)

```markdown
## User Story Template

**Como** [tipo de usuario]
**Quiero** [acción/funcionalidad]
**Para** [beneficio/valor]

### Criterios de Aceptación (META)

| # | Criterio | Medible | Específico | Testeable | Alcanzable |
|---|----------|---------|------------|-----------|------------|
| 1 | El usuario puede... | ✓ | ✓ | ✓ | ✓ |
| 2 | El sistema debe... | ✓ | ✓ | ✓ | ✓ |

### Notas Técnicas
- Dependencias: ...
- Consideraciones de seguridad: ...
- Impacto en performance: ...
```

**Agentes involucrados:**
- `@product-manager` - Definir user story y criterios
- `@solution-architect` - Diseño técnico y ADR si es necesario

### Paso 2: Desarrollar (Backend/Frontend/Data)

```bash
# 1. Crear branch desde develop
git checkout develop
git pull origin develop
git checkout -b feature/TICKET-123-nombre-descriptivo

# 2. Desarrollar incrementalmente
# Commit frecuentes con conventional commits
git commit -m "feat(module): add user registration endpoint"
git commit -m "feat(module): add registration form component"
git commit -m "test(module): add unit tests for registration"

# 3. Push y crear PR
git push origin feature/TICKET-123-nombre-descriptivo
```

**Agentes involucrados:**
- `@backend-architect` - Endpoints y lógica de negocio
- `@frontend-architect` - Componentes UI
- `@data-engineer` - Modelos y esquemas
- `@security-guardian` - Revisión de seguridad

### Paso 3: Probar (Test Engineer + QA)

```typescript
// Estructura de tests
tests/
├── unit/
│   ├── services/
│   │   └── user.service.test.ts      # Lógica de negocio
│   └── components/
│       └── registration-form.test.tsx # Componentes
├── integration/
│   └── api/
│       └── users.test.ts              # Endpoints
└── e2e/
    └── registration.spec.ts           # Flujo completo
```

**Checklist de Testing:**
- [ ] Tests unitarios para servicios (>80% coverage)
- [ ] Tests unitarios para componentes críticos
- [ ] Tests de integración para endpoints
- [ ] Test E2E para el happy path
- [ ] Tests de accesibilidad (axe)

**Agentes involucrados:**
- `@test-engineer` - Escribir tests
- `@qa-lead` - Validación manual y estrategia

### Paso 4: Review (Code Reviewer + QA)

```markdown
## PR Checklist

### Código
- [ ] Sigue convenciones del proyecto
- [ ] Sin código comentado o console.logs
- [ ] Tipos TypeScript correctos
- [ ] Manejo de errores apropiado
- [ ] Principios SOLID aplicados

### Tests
- [ ] Tests pasan en CI
- [ ] Coverage >= 80%
- [ ] Tests E2E actualizados

### Documentación
- [ ] README actualizado si es necesario
- [ ] JSDoc en funciones públicas
- [ ] Comentarios donde sea necesario

### Seguridad
- [ ] Sin credenciales hardcodeadas
- [ ] Validación de inputs
- [ ] Sanitización de outputs
```

**Agentes involucrados:**
- `@code-reviewer` - Revisión de código
- `@qa-lead` - Validación funcional
- `@security-guardian` - Revisión de seguridad

### Paso 5: Deploy (DevOps)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Staging
        run: |
          # Deploy a staging para validación final
```

**Agentes involucrados:**
- `@devops-engineer` - CI/CD y deployment
- `@observability-engineer` - Monitoreo post-deploy

---

## 🐛 Flujo: Bug Fix

### Diagrama

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  🔍 REPRODUCIR  │───▶│  🔬 ANALIZAR    │───▶│  🛠️ CORREGIR    │
│                 │    │                 │    │                 │
│ • Pasos repro   │    │ • Root cause    │    │ • Implementar   │
│ • Screenshots   │    │ • Impacto       │    │ • Test que falla│
│ • Logs          │    │ • Prioridad     │    │ • Corregir      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                              ┌───────▼─────────┐
                                              │  ✅ VERIFICAR   │
                                              │                 │
                                              │ • Test pasa     │
                                              │ • No regresión  │
                                              └─────────────────┘
```

### Paso 1: Reproducir y Documentar

```markdown
## Bug Report Template

**Descripción:** Breve descripción del bug

**Pasos para reproducir:**
1. Ir a...
2. Hacer click en...
3. Ver error...

**Comportamiento esperado:**
El sistema debería...

**Comportamiento actual:**
El sistema muestra/hace...

**Evidencia:**
- Screenshots: [adjuntar]
- Logs: [adjuntar]
- Video: [link si aplica]

**Entorno:**
- Browser: Chrome 120
- OS: Windows 11
- Version: 1.2.3
```

### Paso 2: Analizar Root Cause

```typescript
// Checklist de análisis
/*
1. ¿En qué capa está el bug?
   - [ ] Frontend (componente/estado)
   - [ ] API (endpoint/validación)
   - [ ] Servicio (lógica de negocio)
   - [ ] Data (modelo/query)

2. ¿Es un bug de regresión?
   - [ ] Sí - ¿qué commit lo introdujo? (git bisect)
   - [ ] No - siempre estuvo así

3. ¿Impacto?
   - [ ] Crítico - bloquea funcionalidad core
   - [ ] Alto - afecta muchos usuarios
   - [ ] Medio - workaround disponible
   - [ ] Bajo - cosmético/menor
*/
```

### Paso 3: Corregir con TDD

```typescript
// 1. Primero, escribir test que reproduzca el bug
describe("UserService", () => {
  it("should handle special characters in email", async () => {
    // Este test debe FALLAR antes del fix
    const dto = { email: "user+test@domain.com", password: "Test1234!" };
    const result = await userService.createUser(dto);
    expect(result.email).toBe("user+test@domain.com");
  });
});

// 2. Correr test y verificar que falla
// npm run test -- --grep "special characters"

// 3. Implementar el fix
// src/core/services/user.service.ts
async createUser(dto: CreateUserDTO): Promise<User> {
  // FIX: Usar validación que acepta caracteres especiales
  const email = dto.email.toLowerCase(); // Ya no strip + ni otros
  // ...
}

// 4. Correr test y verificar que pasa
// npm run test -- --grep "special characters"

// 5. Correr todos los tests para verificar no regresión
// npm run test
```

### Branch Naming

```bash
# Formato: bugfix/TICKET-descripcion-corta
git checkout -b bugfix/BUG-456-email-special-chars
```

---

## ♻️ Flujo: Refactoring

### Cuándo Refactorizar

| Señal | Acción |
|-------|--------|
| Código duplicado (>3 veces) | Extraer a función/componente |
| Función >50 líneas | Dividir en funciones más pequeñas |
| Clase >300 líneas | Aplicar SRP, extraer clases |
| Complejidad ciclomática >10 | Simplificar lógica |
| Test difícil de escribir | Mejorar diseño (DIP) |

### Proceso Seguro de Refactoring

```typescript
// 1. ANTES de refactorizar: Asegurar cobertura de tests
// Si no hay tests, escribirlos primero

describe("PaymentService", () => {
  // Tests existentes que documentan el comportamiento actual
  it("should process payment successfully", async () => { /* ... */ });
  it("should handle declined cards", async () => { /* ... */ });
  it("should validate amount", async () => { /* ... */ });
});

// 2. Hacer refactoring en pasos pequeños
// Cada paso debe pasar todos los tests

// Paso 1: Extraer método
// Paso 2: Renombrar variable
// Paso 3: Mover a nueva clase
// ... etc

// 3. DESPUÉS: Los tests siguen pasando = refactoring exitoso
```

### Técnicas de Refactoring Comunes

```typescript
// 1. Extract Function
// ANTES
function processOrder(order: Order) {
  // 50 líneas de código...
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.21;
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + tax + shipping;
  // más código...
}

// DESPUÉS
function processOrder(order: Order) {
  const totals = calculateTotals(order);
  // código más limpio...
}

function calculateTotals(order: Order): OrderTotals {
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  const shipping = calculateShipping(subtotal);
  return { subtotal, tax, shipping, total: subtotal + tax + shipping };
}

// 2. Replace Conditional with Polymorphism
// ANTES
function getShippingCost(type: string, weight: number): number {
  switch (type) {
    case "standard": return weight * 0.5;
    case "express": return weight * 1.5;
    case "overnight": return weight * 3;
    default: throw new Error("Unknown shipping type");
  }
}

// DESPUÉS
interface ShippingStrategy {
  calculate(weight: number): number;
}

class StandardShipping implements ShippingStrategy {
  calculate(weight: number): number { return weight * 0.5; }
}

class ExpressShipping implements ShippingStrategy {
  calculate(weight: number): number { return weight * 1.5; }
}

// 3. Introduce Parameter Object
// ANTES
function createUser(
  name: string,
  email: string,
  password: string,
  role: string,
  department: string,
  manager: string
) { /* ... */ }

// DESPUÉS
interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  manager: string;
}

function createUser(dto: CreateUserDTO) { /* ... */ }
```

---

## 🚨 Flujo: Hotfix

> **Para bugs críticos en producción que requieren fix inmediato**

### Diagrama

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  🚨 DETECTAR    │───▶│  ⚡ FIX RÁPIDO  │───▶│  🚀 DEPLOY PROD │
│                 │    │                 │    │                 │
│ • Alerta/Reporte│    │ • Branch hotfix │    │ • Review rápido │
│ • Evaluar impact│    │ • Fix minimal   │    │ • Deploy directo│
│ • Notificar team│    │ • Test crítico  │    │ • Verificar     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                              ┌───────▼─────────┐
                                              │  🔄 BACKPORT    │
                                              │                 │
                                              │ • Merge a main  │
                                              │ • Merge a develop│
                                              └─────────────────┘
```

### Proceso

```bash
# 1. Crear branch desde main (producción)
git checkout main
git pull origin main
git checkout -b hotfix/CRITICAL-descripcion

# 2. Implementar fix mínimo necesario
# - NO agregar features
# - NO refactorizar
# - SOLO el fix

# 3. Test mínimo pero suficiente
npm run test -- --grep "related-test"

# 4. Push y PR a main
git push origin hotfix/CRITICAL-descripcion
# Crear PR a main con label "hotfix"

# 5. Review acelerado (1 approver suficiente)
# Deploy a producción

# 6. Backport a develop
git checkout develop
git pull origin develop
git merge hotfix/CRITICAL-descripcion
git push origin develop
```

### Comunicación Durante Hotfix

```markdown
## Slack/Teams Notification Template

🚨 **HOTFIX EN PROGRESO**

**Problema:** [Descripción breve]
**Impacto:** [Usuarios afectados / funcionalidad rota]
**Estado:** [En análisis / Implementando / Testing / Deploying]
**ETA:** [Estimación de resolución]
**Responsable:** @nombre

**Actualizaciones:**
- HH:MM - Problema detectado
- HH:MM - Root cause identificado
- HH:MM - Fix implementado
- HH:MM - Deployando a producción
- HH:MM - ✅ Verificado y resuelto
```

---

## 📦 Flujo: Release

### Versionado Semántico

```
MAJOR.MINOR.PATCH

MAJOR - Cambios incompatibles (breaking changes)
MINOR - Nuevas features compatibles
PATCH - Bug fixes compatibles
```

### Proceso de Release

```bash
# 1. Crear branch de release desde develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Actualizar versión
npm version minor --no-git-tag-version
# o: npm version patch / npm version major

# 3. Actualizar CHANGELOG.md
# (Ver template abajo)

# 4. Commit de release
git add .
git commit -m "chore(release): prepare v1.2.0"

# 5. PR a main
# Review y merge

# 6. Tag en main
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# 7. Backport a develop
git checkout develop
git merge main
git push origin develop

# 8. Crear GitHub Release
# (Automático vía GitHub Actions o manual)
```

### CHANGELOG Template

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- Nuevo sistema de notificaciones push (#123)
- Soporte para múltiples idiomas (#124)

### Changed
- Mejorado rendimiento de carga de dashboard (#125)
- Actualizada dependencia Next.js a v14.1 (#126)

### Fixed
- Corregido error en validación de emails (#127)
- Solucionado memory leak en componente de chat (#128)

### Security
- Actualizado bcrypt por vulnerabilidad CVE-2024-XXXX (#129)

### Deprecated
- El endpoint `/api/v1/users` será removido en v2.0 (#130)

## [1.1.0] - 2024-01-01
...
```

---

## 🤖 Agentes por Flujo

| Flujo | Agentes Principales | Agentes de Soporte |
|-------|--------------------|--------------------|
| Nueva Feature | `product-manager`, `backend-architect`, `frontend-architect` | `solution-architect`, `data-engineer`, `test-engineer` |
| Bug Fix | `backend-architect` o `frontend-architect`, `test-engineer` | `qa-lead` |
| Refactoring | `code-reviewer`, `backend-architect` o `frontend-architect` | `test-engineer` |
| Hotfix | `devops-engineer`, desarrollador responsable | `security-guardian` |
| Release | `release-manager`, `devops-engineer` | `qa-lead`, `documentation-engineer` |

---

> **Nota:** Estos flujos son guías flexibles. Adapta según el contexto y urgencia de cada situación.
