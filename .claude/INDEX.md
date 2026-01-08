# MERN Agents Framework - Índice de Documentación

Bienvenido al framework de agentes especializados para desarrollo MERN Stack con Claude Code.

## Inicio Rápido

¿Primera vez usando el framework? Empieza aquí:

1. **[README.md](README.md)** - Introducción y guía rápida (⏱️ 5 min)
2. **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Comandos esenciales (⏱️ 3 min)
3. Prueba el framework: `claude "Analiza este proyecto"`

## Documentación Principal

### 📖 Guías Completas

| Documento | Descripción | Cuándo leer |
|-----------|-------------|-------------|
| [README.md](README.md) | Guía principal del framework | Primera vez, overview general |
| [INSTALLATION.md](INSTALLATION.md) | Guía de instalación y configuración | Setup inicial, troubleshooting |
| [EXAMPLES.md](EXAMPLES.md) | Ejemplos prácticos de uso | Aprender casos de uso |
| [QUICK-REFERENCE.md](QUICK-REFERENCE.md) | Referencia rápida | Consulta rápida de comandos |
| [SETUP-SUMMARY.md](SETUP-SUMMARY.md) | Resumen de instalación | Ver qué se instaló |

### 📂 Configuración y Estructura

| Archivo | Descripción |
|---------|-------------|
| [config.json](config.json) | Configuración del framework |
| [aliases.sh](aliases.sh) | Aliases de shell |
| [.claudeignore](../.claudeignore) | Archivos excluidos |

### 🤖 Agentes

Todos los agentes están en el directorio [agents/](agents/):

**Coordinación:**
- [orchestrator.md](agents/orchestrator.md) - Punto de entrada principal

**Desarrollo:**
- [backend-architect.md](agents/backend-architect.md) - APIs y lógica de negocio
- [frontend-architect.md](agents/frontend-architect.md) - Componentes React y UI
- [data-engineer.md](agents/data-engineer.md) - MongoDB y datos

**Calidad y Seguridad:**
- [security-guardian.md](agents/security-guardian.md) - Seguridad OWASP
- [test-engineer.md](agents/test-engineer.md) - Testing
- [qa-lead.md](agents/qa-lead.md) - Estrategia QA

**Arquitectura:**
- [solution-architect.md](agents/solution-architect.md) - Decisiones técnicas
- [code-reviewer.md](agents/code-reviewer.md) - Code review

**Operaciones:**
- [devops-engineer.md](agents/devops-engineer.md) - CI/CD y deployment
- [observability-engineer.md](agents/observability-engineer.md) - Monitoring
- [release-manager.md](agents/release-manager.md) - Releases

**Soporte:**
- [documentation-engineer.md](agents/documentation-engineer.md) - Documentación
- [product-manager.md](agents/product-manager.md) - Gestión de producto
- [ai-integration-engineer.md](agents/ai-integration-engineer.md) - Integración IA

### 📚 Archivos Core

Archivos de referencia compartidos en [core/](core/):

- [_framework-context.md](core/_framework-context.md) - Contexto del framework
- [_conflict-resolution.md](core/_conflict-resolution.md) - Resolución de conflictos
- [_shared-workflows.md](core/_shared-workflows.md) - Workflows compartidos
- [_shared-solid-principles.md](core/_shared-solid-principles.md) - Principios SOLID
- [_shared-data-modeling.md](core/_shared-data-modeling.md) - Modelado de datos

## Guías por Tarea

### 🚀 Empezar a Usar

1. Lee: [README.md](README.md) (sección Quick Start)
2. Carga aliases: `source .claude/aliases.sh`
3. Prueba: `claude "Necesito ayuda con..."`

### 💻 Desarrollo

**Backend:**
- Lee: [EXAMPLES.md](EXAMPLES.md#desarrollo-backend)
- Agente: [backend-architect.md](agents/backend-architect.md)
- Comando: `ccb "tu tarea"`

**Frontend:**
- Lee: [EXAMPLES.md](EXAMPLES.md#desarrollo-frontend)
- Agente: [frontend-architect.md](agents/frontend-architect.md)
- Comando: `ccf "tu tarea"`

**Base de Datos:**
- Lee: [EXAMPLES.md](EXAMPLES.md#base-de-datos)
- Agente: [data-engineer.md](agents/data-engineer.md)
- Comando: `ccd "tu tarea"`

### 🛡️ Calidad y Seguridad

**Testing:**
- Lee: [EXAMPLES.md](EXAMPLES.md#testing)
- Agente: [test-engineer.md](agents/test-engineer.md)
- Comando: `cct "escribe tests para..."`

**Seguridad:**
- Lee: [EXAMPLES.md](EXAMPLES.md#seguridad)
- Agente: [security-guardian.md](agents/security-guardian.md)
- Comando: `ccs "revisa seguridad de..."`

**Code Review:**
- Agente: [code-reviewer.md](agents/code-reviewer.md)
- Comando: `cc-review "revisa..."`

### 🏗️ Arquitectura

**Decisiones Técnicas:**
- Lee: [EXAMPLES.md](EXAMPLES.md#arquitectura)
- Agente: [solution-architect.md](agents/solution-architect.md)
- Comando: `claude @solution-architect "¿opción A o B?"`

### 🚀 DevOps

**Deployment:**
- Lee: [EXAMPLES.md](EXAMPLES.md#devops-y-deploy)
- Agente: [devops-engineer.md](agents/devops-engineer.md)
- Comando: `cc-deploy "configura..."`

**Monitoring:**
- Agente: [observability-engineer.md](agents/observability-engineer.md)
- Comando: `claude @observability-engineer "analiza..."`

**Releases:**
- Agente: [release-manager.md](agents/release-manager.md)
- Comando: `claude @release-manager "prepara release..."`

### 📚 Documentación

**Generar Docs:**
- Agente: [documentation-engineer.md](agents/documentation-engineer.md)
- Comando: `cc-docs "documenta..."`

## Flujos de Trabajo Completos

Ver ejemplos detallados en [EXAMPLES.md](EXAMPLES.md#workflows-completos):

1. **Nueva Feature Completa** - Coordinación multi-agente
2. **Bug Fix con Root Cause** - Debug y análisis
3. **Release a Producción** - Preparación y deploy
4. **Documentación de Feature** - Docs completa

## Comandos Útiles

### Scripts NPM

```bash
npm run claude:setup          # Setup completo
npm run claude:verify         # Verificar instalación
npm run claude:convert        # Convertir agente
npm run claude:convert-all    # Convertir todos
```

### Scripts Directos

```bash
./scripts/setup-claude-agents.sh      # Setup
./scripts/verify-setup.sh             # Verificar
./scripts/convert-agent.sh <name>     # Convertir uno
./scripts/convert-all-agents.sh       # Convertir todos
```

### Aliases

Ver todos en [aliases.sh](aliases.sh) o [QUICK-REFERENCE.md](QUICK-REFERENCE.md#aliases-rápidos)

## Troubleshooting

### Problema Común

| Problema | Solución | Documentación |
|----------|----------|---------------|
| Agentes no se reconocen | Verificar instalación | [INSTALLATION.md](INSTALLATION.md#troubleshooting) |
| Aliases no funcionan | `source .claude/aliases.sh` | [README.md](README.md#aliases) |
| Necesito reinstalar | Ver guía de reinstalación | [INSTALLATION.md](INSTALLATION.md#troubleshooting) |
| ¿Qué agente usar? | Pregunta al orchestrator | [QUICK-REFERENCE.md](QUICK-REFERENCE.md#tips) |

## Recursos Adicionales

### Stack Tecnológico

El framework soporta:
- **Frontend**: Next.js 14+, React 18+, TypeScript 5.0+, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel, MongoDB Atlas

Ver detalles en [README.md](README.md#stack-tecnológico)

### Configuración

- **Archivo principal**: [config.json](config.json)
- **MCP Servers**: Filesystem
- **Handoff Protocol**: Habilitado
- **Scope Enforcement**: Estricto

## FAQ - Preguntas Frecuentes

### ¿Cuándo usar el orchestrator?

Usa el orchestrator cuando:
- No sepas qué agente necesitas
- La tarea requiera múltiples agentes
- Sea una feature compleja

Detalles en [QUICK-REFERENCE.md](QUICK-REFERENCE.md#cuándo-usar-qué)

### ¿Cuándo usar agentes específicos?

Usa agentes específicos cuando:
- Sepas exactamente qué necesitas
- Sea una tarea puntual
- Quieras máxima rapidez

Ver ejemplos en [EXAMPLES.md](EXAMPLES.md)

### ¿Cómo combinar agentes?

Ver workflows completos en [EXAMPLES.md](EXAMPLES.md#workflows-completos)

## Navegación Rápida

### Por Nivel de Experiencia

**Principiante** (primera vez):
1. [README.md](README.md)
2. [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
3. [EXAMPLES.md](EXAMPLES.md) (ejemplos básicos)

**Intermedio** (ya usaste el framework):
1. [QUICK-REFERENCE.md](QUICK-REFERENCE.md) (consulta rápida)
2. [EXAMPLES.md](EXAMPLES.md) (casos avanzados)
3. Agentes específicos en [agents/](agents/)

**Avanzado** (customización):
1. [config.json](config.json)
2. [core/](core/) (archivos de referencia)
3. Scripts en [../scripts/](../scripts/)

### Por Objetivo

**Aprender**: README → QUICK-REFERENCE → EXAMPLES

**Trabajar**: QUICK-REFERENCE → Agente específico

**Configurar**: INSTALLATION → config.json

**Troubleshoot**: INSTALLATION (Troubleshooting) → verify-setup.sh

**Customizar**: config.json → core/ → scripts/

## Actualizado

**Última actualización**: 2026-01-07
**Versión del framework**: 1.0.0
**Estado**: ✅ Completamente funcional

---

## Ayuda

¿No encuentras lo que buscas? Pregunta al orchestrator:

```bash
claude "¿Cómo puedo...?"
claude "¿Qué agente debo usar para...?"
claude "Ayuda con..."
```

El orchestrator te guiará al recurso correcto.

---

**Happy Coding with MERN Agents!** 🚀
