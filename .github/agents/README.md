# GitHub Copilot Custom Agents

Este directorio contiene agentes personalizados de GitHub Copilot para GondolApp.

## ¿Qué son estos archivos?

Los archivos `.md` en este directorio definen agentes especializados que extienden las capacidades de GitHub Copilot. Cada agente tiene un rol específico y conocimiento especializado sobre diferentes aspectos de GondolApp:

| Agente | Descripción |
|--------|-------------|
| `gondola-ui-ux-specialist` | Especialista en diseño de interfaces móvil-first, componentes accesibles y experiencia de usuario |
| `gondola-security-guardian` | Guardián de seguridad para protección de APIs, rate limiting, validación y sanitización |
| `gondola-backend-architect` | Arquitecto backend para diseño de APIs REST, arquitectura SOLID, MongoDB y Redis |
| `gondola-test-engineer` | Ingeniero de testing para tests unitarios, integración, performance y seguridad |
| `gondola-pwa-specialist` | Especialista PWA para Service Worker, IndexedDB, manifest y sincronización offline |

## Propósito del YAML Frontmatter

Cada archivo de agente incluye un bloque YAML frontmatter al inicio con los siguientes campos:

```yaml
---
name: gondola-agent-name
description: Breve descripción del agente y su propósito
keywords:
  - keyword1
  - keyword2
---
```

Este frontmatter permite que GitHub Copilot (especialmente la versión web) registre correctamente los agentes como herramientas disponibles.

## ¿Por qué están duplicados en `.github/copilot/agents/`?

Los archivos están duplicados en ambas ubicaciones por compatibilidad:

- **`.github/agents/`**: Ubicación estándar para agentes de Copilot
- **`.github/copilot/agents/`**: Ubicación alternativa que algunas instalaciones de GitHub Copilot buscan

Esto asegura que los agentes estén disponibles independientemente de cómo esté configurado Copilot en tu entorno.

## Cómo invocar un agente

Para usar un agente específico en GitHub Copilot, puedes invocarlo por su nombre:

```
@copilot usa gondola-ui-ux-specialist para revisar este componente
```

O simplemente mencionar el contexto relacionado y Copilot seleccionará el agente más apropiado.

## Mantenimiento

Cuando modifiques un archivo de agente:

1. Actualiza el archivo en `.github/agents/`
2. Copia los cambios al archivo correspondiente en `.github/copilot/agents/`
3. Asegúrate de que el frontmatter YAML esté actualizado

---

*Estos agentes fueron diseñados específicamente para el contexto de GondolApp - una PWA de gestión de inventario para supermercados.*
