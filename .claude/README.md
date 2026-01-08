# 🤖 MERN Agents Framework - Claude Code

Framework de agentes especializados para desarrollo MERN Stack con Claude Code.

## 🚀 Quick Start

```bash
# Usar orquestador (analiza y deriva)
claude "Necesito crear sistema de login"

# Usar agente específico
claude @backend-architect "Crea endpoint CRUD de usuarios"
claude @frontend-architect "Diseña componente de tabla"
claude @data-engineer "Optimiza esquema de productos"
```

## 📋 Agentes Disponibles

### Desarrollo
- **@orchestrator** - Coordinador y punto de entrada
- **@backend-architect** - APIs, servicios, lógica de negocio
- **@frontend-architect** - Componentes React, UI/UX
- **@data-engineer** - MongoDB, esquemas, queries

### Calidad
- **@security-guardian** - Seguridad OWASP
- **@test-engineer** - Tests unitarios, integración, E2E
- **@qa-lead** - Estrategia QA, checklists

### Operaciones
- **@devops-engineer** - CI/CD, deployment
- **@observability-engineer** - Monitoring, performance
- **@release-manager** - Versiones, releases

### Soporte
- **@solution-architect** - Decisiones arquitectónicas, ADRs
- **@code-reviewer** - Code review
- **@documentation-engineer** - Documentación
- **@product-manager** - User stories, requisitos
- **@ai-integration-engineer** - Integración de IA

## 🔧 Aliases

```bash
# Cargar aliases
source .claude/aliases.sh

# Usar aliases
ccb "Crea endpoint de usuarios"     # Backend
ccf "Diseña componente de tabla"    # Frontend
ccd "Optimiza esquema"               # Data
ccs "Revisa seguridad"               # Security
cct "Escribe tests"                  # Testing
```

## 📖 Stack Tecnológico

- **Frontend:** Next.js 14+, React 18+, TypeScript 5.0+, Tailwind CSS
- **Backend:** Next.js API Routes, MongoDB, Mongoose
- **Testing:** Vitest, Playwright
- **Deploy:** Vercel, MongoDB Atlas

## 🎯 Workflows Comunes

### Nueva Feature
```bash
claude "Necesito sistema de notificaciones"
# Orchestrator coordina: Product Manager → Solution Architect → Implementadores
```

### Bug Fix
```bash
claude "El login está dando error 500"
# Orchestrator deriva a Backend Architect para diagnosticar
```

### Code Review
```bash
claude @code-reviewer "Revisa este PR"
```

### Arquitectura
```bash
claude @solution-architect "Decide: REST vs GraphQL para la API"
```

## 📚 Documentación

- Core files: `.claude/core/`
- Agentes: `.claude/agents/`
- Config: `.claude/config.json`

## 🆘 Ayuda

Si no sabes qué agente usar:
```bash
claude "Ayuda con [tu problema]"
```

El Orchestrator analizará y te guiará al agente correcto.
