# GitHub Copilot Custom Agents

Este directorio contiene **14 agentes personalizados** de GitHub Copilot para GondolApp, organizados por áreas de especialización.

## ¿Qué son estos archivos?

Los archivos `.md` en este directorio definen agentes especializados que extienden las capacidades de GitHub Copilot. Cada agente tiene un rol específico y conocimiento especializado sobre diferentes aspectos de GondolApp.

## Catálogo de Agentes

### 🏗️ Arquitectura & Liderazgo Técnico

| Agente                      | Descripción                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `tech-lead-architect`       | Líder técnico y arquitecto de soluciones - diseño de sistemas, decisiones arquitectónicas, mentoring técnico y estándares de código |
| `gondola-backend-architect` | Arquitecto backend para diseño de APIs REST, arquitectura SOLID, MongoDB y Redis                                                    |

### 💻 Desarrollo & Especialidades

| Agente                     | Descripción                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `gondola-ui-ux-specialist` | Especialista en diseño de interfaces móvil-first, componentes accesibles y experiencia de usuario                          |
| `gondola-pwa-specialist`   | Especialista PWA para Service Worker, IndexedDB, manifest y sincronización offline                                         |
| `ai-integration-engineer`  | Ingeniero de integración de IA - implementación de Gemini AI, normalización de productos, embeddings y prompts optimizados |
| `data-engineer-modeler`    | Ingeniero de datos - diseño de esquemas MongoDB, IndexedDB, pipelines de agregación y optimización de queries              |

### 🔒 Seguridad & Calidad

| Agente                      | Descripción                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `gondola-security-guardian` | Guardián de seguridad para protección de APIs, rate limiting, validación y sanitización                |
| `gondola-test-engineer`     | Ingeniero de testing para tests unitarios, integración, performance y seguridad                        |
| `qa-lead`                   | Líder de QA - estrategia de testing, criterios de aceptación, gestión de releases y testing end-to-end |

### 🚀 DevOps & Operaciones

| Agente                               | Descripción                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `devops-ci-cd-engineer`              | Ingeniero DevOps - pipelines de GitHub Actions, despliegue en Vercel, automatización de builds         |
| `observability-performance-engineer` | Ingeniero de observabilidad - métricas, logging, alertas, optimización de Core Web Vitals y Lighthouse |
| `release-manager`                    | Gestor de releases - versionado semántico, changelogs, coordinación de deploys                         |

### 📋 Producto & Documentación

| Agente                       | Descripción                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `product-manager-strategist` | Estratega de producto - definición de roadmap, user stories, priorización de backlog        |
| `documentation-engineer`     | Ingeniero de documentación - documentación técnica, API docs, guías de usuario y onboarding |

## Flujo de Trabajo Recomendado

Para una nueva funcionalidad, el flujo de trabajo multi-agente sugerido es:

```
┌────────────────────────────────────────────────────────────────────┐
│  1. DEFINICIÓN      →  product-manager-strategist                  │
│     User stories, criterios de aceptación, KPIs                    │
├────────────────────────────────────────────────────────────────────┤
│  2. ARQUITECTURA    →  tech-lead-architect / gondola-backend-      │
│     Diseño técnico, interfaces, decisiones arquitectónicas         │
├────────────────────────────────────────────────────────────────────┤
│  3. IMPLEMENTACIÓN  →  Agentes especializados según el feature:    │
│     • UI/UX: gondola-ui-ux-specialist                              │
│     • PWA/Offline: gondola-pwa-specialist                          │
│     • IA/Normalización: ai-integration-engineer                    │
│     • Base de datos: data-engineer-modeler                         │
│     • Seguridad: gondola-security-guardian                         │
├────────────────────────────────────────────────────────────────────┤
│  4. TESTING & QA    →  gondola-test-engineer / qa-lead             │
│     Tests unitarios, integración, criterios de aceptación          │
├────────────────────────────────────────────────────────────────────┤
│  5. DOCUMENTACIÓN   →  documentation-engineer                      │
│     API docs, guías, README                                        │
├────────────────────────────────────────────────────────────────────┤
│  6. RELEASE         →  release-manager / devops-ci-cd-engineer     │
│     Changelog, versionado, despliegue                              │
└────────────────────────────────────────────────────────────────────┘
```

## ⚠️ Límites de Responsabilidad de Cada Agente

Cada agente tiene instrucciones claras sobre:

- **✅ LO QUE DEBE HACER**: Su scope y entregables específicos
- **❌ LO QUE NO DEBE HACER**: Tareas fuera de su responsabilidad
- **📋 FLUJO DE TRABAJO**: Pasos a seguir cuando recibe una tarea
- **🔄 HANDOFF**: A qué agente pasar el trabajo cuando termina su parte

### Ejemplo de Workflow Correcto

```
Usuario: "Quiero agregar notificaciones push a GondolApp"

1️⃣ product-manager-strategist
   ENTREGA: User Story + Criterios de Aceptación + KPIs
   HANDOFF → tech-lead-architect

2️⃣ tech-lead-architect
   ENTREGA: ADR con arquitectura propuesta + diagramas
   HANDOFF → gondola-pwa-specialist + gondola-backend-architect

3️⃣ gondola-pwa-specialist
   ENTREGA: Código de Service Worker para push notifications
   HANDOFF → gondola-test-engineer

4️⃣ gondola-backend-architect
   ENTREGA: API Route para enviar notificaciones
   HANDOFF → gondola-test-engineer

5️⃣ gondola-test-engineer
   ENTREGA: Tests unitarios y de integración
   HANDOFF → qa-lead

6️⃣ qa-lead
   ENTREGA: Checklist de QA validado
   HANDOFF → release-manager

7️⃣ release-manager
   ENTREGA: Release notes + tag + deploy coordinado
```

### ⚡ Regla de Oro

> **Cada agente debe entregar su trabajo documentado y luego indicar qué agente debería continuar.**
>
> Si un agente intenta hacer el trabajo de otro, debe responder educadamente indicando qué agente es el apropiado.

## Propósito del YAML Frontmatter

Cada archivo de agente incluye un bloque YAML frontmatter al inicio con los siguientes campos:

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
---
```

Este frontmatter permite que GitHub Copilot registre correctamente los agentes como herramientas disponibles.

## ¿Por qué están duplicados en `.github/copilot/agents/`?

Los archivos están duplicados en ambas ubicaciones por compatibilidad:

- **`.github/agents/`**: Ubicación estándar para agentes de Copilot
- **`.github/copilot/agents/`**: Ubicación alternativa que algunas instalaciones de GitHub Copilot buscan

Esto asegura que los agentes estén disponibles independientemente de cómo esté configurado Copilot en tu entorno.

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
