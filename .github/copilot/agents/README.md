# GitHub Copilot Custom Agents

Este directorio contiene **16 agentes personalizados** de GitHub Copilot para GondolApp, organizados por áreas de especialización.

## 🆕 Novedades del Sistema v1.0.0

- **Agente Orquestador**: Nuevo punto de entrada para dirigir solicitudes al agente correcto
- **Contexto Compartido**: Archivo centralizado para evitar duplicación entre agentes
- **Versionado**: Todos los agentes ahora tienen versión, fecha de actualización y changelog
- **Arquitectura Dividida**: El Tech Lead ahora delega a `solution-architect` y `code-reviewer`

## 🎯 Punto de Entrada: Orquestador

Para comenzar cualquier tarea, usa primero el **orquestador**:

```
@gondola-orchestrator Necesito [describir lo que necesitas]
```

El orquestador analizará tu solicitud y te recomendará el agente o flujo de trabajo más apropiado.

## ¿Qué son estos archivos?

| Archivo | Propósito |
|---------|-----------|
| `gondola-orchestrator.md` | **Punto de entrada** - Analiza solicitudes y recomienda agentes |
| `_shared-context.md` | Contexto compartido de GondolApp (stack, arquitectura, etc.) |
| `*.md` (otros) | Agentes especializados por rol |

## Catálogo de Agentes

### 🎯 Orquestación

| Agente | Descripción |
|--------|-------------|
| `gondola-orchestrator` | **PUNTO DE ENTRADA** - Analiza solicitudes, recomienda agentes y proporciona flujos de trabajo |

### 🏗️ Arquitectura & Liderazgo Técnico

| Agente | Descripción |
|--------|-------------|
| `tech-lead-architect` | Coordinador técnico - delega a solution-architect y code-reviewer |
| `solution-architect` | Diseño de arquitectura de alto nivel, ADRs, diagramas C4 |
| `code-reviewer` | Revisión de PRs, estándares de código, mentoring |
| `gondola-backend-architect` | Arquitecto backend - APIs REST, SOLID, MongoDB, Redis |

### 💻 Desarrollo & Especialidades

| Agente | Descripción |
|--------|-------------|
| `gondola-ui-ux-specialist` | Diseño de interfaces móvil-first con accesibilidad WCAG 2.1 AA |
| `gondola-pwa-specialist` | Service Worker, IndexedDB, manifest, sincronización offline |
| `ai-integration-engineer` | Integración de Gemini AI, normalización, embeddings |
| `data-engineer-modeler` | Esquemas MongoDB/IndexedDB, pipelines, migraciones |

### 🔒 Seguridad & Calidad

| Agente | Descripción |
|--------|-------------|
| `gondola-security-guardian` | Seguridad OWASP Top 10, rate limiting, validación |
| `gondola-test-engineer` | Tests unitarios, integración, E2E con Playwright |
| `qa-lead` | Estrategia de QA, criterios de aceptación, releases |

### 🚀 DevOps & Operaciones

| Agente | Descripción |
|--------|-------------|
| `devops-ci-cd-engineer` | GitHub Actions, Vercel, automatización |
| `observability-performance-engineer` | Métricas, Lighthouse, Core Web Vitals |
| `release-manager` | Versionado semántico, changelogs, deploys |

### 📋 Producto & Documentación

| Agente | Descripción |
|--------|-------------|
| `product-manager-strategist` | User stories con criterios META, roadmap |
| `documentation-engineer` | Documentación técnica, OpenAPI, guías |

## Sistema de Versionado

Todos los agentes siguen versionado semántico con el siguiente frontmatter:

```yaml
version: "1.0.0"
last_updated: "2025-12-02"
changelog:
  - "1.0.0: Versión inicial con límites de responsabilidad y handoffs"
```

## Flujo de Trabajo Recomendado

Para una nueva funcionalidad, el flujo multi-agente es:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  0. ORQUESTACIÓN    →  gondola-orchestrator                                    │
│     Punto de entrada - analiza y dirige al agente correcto                     │
├────────────────────────────────────────────────────────────────────────────────┤
│  1. DEFINICIÓN      →  product-manager-strategist                              │
│     User stories con criterios META, KPIs                                      │
├────────────────────────────────────────────────────────────────────────────────┤
│  2. ARQUITECTURA    →  solution-architect                                      │
│     ADRs, diagramas C4, evaluación de tecnologías                              │
├────────────────────────────────────────────────────────────────────────────────┤
│  3. IMPLEMENTACIÓN  →  Agentes especializados según el feature:                │
│     • Backend: gondola-backend-architect                                       │
│     • UI/UX: gondola-ui-ux-specialist (con WCAG 2.1 AA)                        │
│     • PWA/Offline: gondola-pwa-specialist                                      │
│     • IA: ai-integration-engineer                                              │
│     • Datos: data-engineer-modeler                                             │
│     • Seguridad: gondola-security-guardian (OWASP Top 10)                      │
├────────────────────────────────────────────────────────────────────────────────┤
│  4. CODE REVIEW     →  code-reviewer                                           │
│     Revisión de estándares, SOLID, mentoring                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│  5. TESTING & QA    →  gondola-test-engineer / qa-lead                         │
│     Tests unitarios, E2E con Playwright, criterios de aceptación               │
├────────────────────────────────────────────────────────────────────────────────┤
│  6. DOCUMENTACIÓN   →  documentation-engineer                                  │
│     API docs (OpenAPI), guías, README                                          │
├────────────────────────────────────────────────────────────────────────────────┤
│  7. RELEASE         →  release-manager / devops-ci-cd-engineer                 │
│     Changelog, versionado, despliegue                                          │
└────────────────────────────────────────────────────────────────────────────────┘
```

## ⚠️ Límites de Responsabilidad de Cada Agente

Cada agente tiene instrucciones claras sobre:

- **✅ LO QUE DEBE HACER**: Su scope y entregables específicos
- **❌ LO QUE NO DEBE HACER**: Tareas fuera de su responsabilidad
- **📋 FLUJO DE TRABAJO**: Pasos a seguir cuando recibe una tarea
- **🔄 HANDOFF**: A qué agente pasar el trabajo cuando termina su parte

### Sintaxis de Invocación

Cada agente incluye al final una sección de cómo invocar otros agentes:

```markdown
## Cómo Invocar Otro Agente

Cuando termines tu trabajo, sugiere al usuario el siguiente comando:

> "Para continuar, ejecuta: `@[nombre-agente] [descripción de la tarea]`"
```

### Ejemplo de Workflow Correcto

```
Usuario: "Quiero agregar notificaciones push a GondolApp"

0️⃣ gondola-orchestrator
   ANALIZA: Solicitud de nueva funcionalidad PWA
   RECOMIENDA: Iniciar con product-manager-strategist
   
1️⃣ product-manager-strategist
   ENTREGA: User Story + Criterios META + KPIs
   HANDOFF → solution-architect
   
2️⃣ solution-architect
   ENTREGA: ADR con arquitectura propuesta + diagramas C4
   HANDOFF → gondola-pwa-specialist + gondola-backend-architect

3️⃣ gondola-pwa-specialist
   ENTREGA: Código de Service Worker para push notifications
   HANDOFF → code-reviewer

4️⃣ gondola-backend-architect
   ENTREGA: API Route para enviar notificaciones
   HANDOFF → code-reviewer

5️⃣ code-reviewer
   ENTREGA: PR aprobado con feedback aplicado
   HANDOFF → gondola-test-engineer

6️⃣ gondola-test-engineer
   ENTREGA: Tests unitarios, integración y E2E con Playwright
   HANDOFF → qa-lead

7️⃣ qa-lead
   ENTREGA: Checklist de QA validado
   HANDOFF → release-manager

8️⃣ release-manager
   ENTREGA: Release notes + tag + deploy coordinado
```

### ⚡ Regla de Oro

> **Cada agente debe entregar su trabajo documentado y luego indicar qué agente debería continuar.**
>
> Si un agente intenta hacer el trabajo de otro, debe responder educadamente indicando qué agente es el apropiado.

## Propósito del YAML Frontmatter

Cada archivo de agente incluye un bloque YAML frontmatter al inicio:

```yaml
---
name: agent-name
id: agent-name
visibility: repository
title: Agent Title
description: Breve descripción del agente y su propósito
keywords:
  - keyword1
  - keyword2
entrypoint: Agent Title
version: "1.0.0"
last_updated: "2025-12-02"
changelog:
  - "1.0.0: Versión inicial con límites de responsabilidad y handoffs"
---
```

Este frontmatter permite:
- Registro correcto de agentes en GitHub Copilot
- Versionado y tracking de cambios
- Búsqueda por keywords

## ¿Por qué están duplicados en `.github/copilot/agents/`?

Los archivos están duplicados en ambas ubicaciones por compatibilidad:

- **`.github/agents/`**: Ubicación estándar para agentes de Copilot
- **`.github/copilot/agents/`**: Ubicación alternativa que algunas instalaciones de GitHub Copilot buscan

Esto asegura que los agentes estén disponibles independientemente de cómo esté configurado Copilot en tu entorno.

## Contexto Compartido

El archivo `_shared-context.md` contiene información común que todos los agentes deben conocer:

- Descripción de GondolApp
- Stack tecnológico
- Arquitectura SOLID
- Modelo de datos
- Flujo principal de la app

Cada agente referencia este archivo con:

```markdown
> **Referencia**: Para contexto detallado sobre GondolApp, consulta [_shared-context.md](./_shared-context.md)
```

## Cómo invocar un agente

Para usar un agente específico en GitHub Copilot, puedes invocarlo por su nombre:

```
@copilot usa product-manager-strategist para definir esta funcionalidad
@copilot usa tech-lead-architect para diseñar la arquitectura
@copilot usa gondola-ui-ux-specialist para revisar este componente
```

O simplemente mencionar el contexto relacionado y Copilot seleccionará el agente más apropiado.

## Mantenimiento

Cuando modifiques un archivo de agente:

1. Actualiza el archivo en `.github/agents/`
2. Copia los cambios al archivo correspondiente en `.github/copilot/agents/`
3. Asegúrate de que el frontmatter YAML esté actualizado

### Script de sincronización

```bash
# Sincronizar todos los agentes
cp .github/agents/*.md .github/copilot/agents/
```

---

_Estos 14 agentes fueron diseñados específicamente para el contexto de GondolApp - una PWA de gestión de inventario para supermercados con arquitectura offline-first, normalización con IA y despliegue en Vercel._
