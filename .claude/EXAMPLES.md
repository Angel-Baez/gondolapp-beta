# Ejemplos de Uso del Framework MERN Agents

Este documento contiene ejemplos prácticos de cómo usar los agentes del framework.

## Tabla de Contenidos

1. [Desarrollo Backend](#desarrollo-backend)
2. [Desarrollo Frontend](#desarrollo-frontend)
3. [Base de Datos](#base-de-datos)
4. [Testing](#testing)
5. [Seguridad](#seguridad)
6. [DevOps y Deploy](#devops-y-deploy)
7. [Arquitectura](#arquitectura)
8. [Workflows Completos](#workflows-completos)

---

## Desarrollo Backend

### Crear un nuevo endpoint

```bash
# Usando el orchestrator (recomendado para tareas complejas)
claude "Necesito crear un endpoint CRUD completo para gestionar productos"

# Usando directamente el backend architect
claude @backend-architect "Crea un endpoint GET /api/products que liste todos los productos con paginación"

# Con alias
ccb "Implementa endpoint POST /api/products con validación de datos"
```

### Implementar autenticación

```bash
claude @backend-architect "Implementa middleware de autenticación JWT para proteger rutas privadas"

# O mejor aún, coordinar con security guardian
claude "Necesito implementar autenticación segura con JWT"
# El orchestrator coordinará: Backend Architect + Security Guardian
```

### Crear servicio de negocio

```bash
claude @backend-architect "Crea servicio para procesar órdenes de compra con validación de stock"
```

---

## Desarrollo Frontend

### Crear componente React

```bash
# Componente simple
claude @frontend-architect "Crea componente ProductCard con imagen, título, precio y botón de compra"

# Componente complejo
claude @frontend-architect "Diseña componente de tabla de productos con filtros, búsqueda y paginación usando Tailwind"

# Con alias
ccf "Crea modal de confirmación reutilizable con animaciones Framer Motion"
```

### Implementar formulario

```bash
claude @frontend-architect "Crea formulario de registro con validación en tiempo real y manejo de errores"
```

### Optimizar UI/UX

```bash
claude @frontend-architect "Mejora el diseño del dashboard principal con mejor jerarquía visual y responsividad"
```

---

## Base de Datos

### Diseñar esquema MongoDB

```bash
# Schema simple
claude @data-engineer "Crea esquema Mongoose para productos con nombre, precio, stock y categoría"

# Schema complejo con relaciones
claude @data-engineer "Diseña esquemas relacionados para Orders, Products y Users con referencias y validaciones"

# Con alias
ccd "Optimiza esquema de usuarios agregando índices para búsqueda por email y username"
```

### Optimización de queries

```bash
claude @data-engineer "Optimiza la query de productos para incluir búsqueda por texto, filtros y paginación eficiente"
```

### Migraciones de datos

```bash
claude @data-engineer "Crea script de migración para agregar campo 'category' a todos los productos existentes"
```

---

## Testing

### Crear tests unitarios

```bash
# Tests de servicios
claude @test-engineer "Escribe tests unitarios para el servicio de autenticación usando Vitest"

# Tests de componentes
claude @test-engineer "Crea tests para el componente ProductCard verificando renderizado y eventos"

# Con alias
cct "Escribe tests de integración para el endpoint /api/products"
```

### Tests E2E

```bash
claude @test-engineer "Implementa test E2E con Playwright para el flujo completo de compra"
```

### Coverage

```bash
claude @test-engineer "Analiza el coverage actual y agrega tests para las áreas no cubiertas"
```

---

## Seguridad

### Auditoría de seguridad

```bash
# Revisión general
claude @security-guardian "Audita el código de autenticación buscando vulnerabilidades OWASP"

# Revisión específica
ccs "Revisa el endpoint /api/users/profile por posibles inyecciones SQL/NoSQL"
```

### Implementar sanitización

```bash
claude @security-guardian "Agrega sanitización de inputs en todos los endpoints de usuarios"
```

### Validación de tokens

```bash
claude @security-guardian "Implementa validación y refresh de tokens JWT con manejo de expiración"
```

---

## DevOps y Deploy

### Configurar CI/CD

```bash
# Pipeline completo
claude @devops-engineer "Configura GitHub Actions para ejecutar tests, lint y deploy a Vercel"

# Pipeline específico
claude @devops-engineer "Crea workflow de CI para ejecutar tests en cada PR"
```

### Deployment

```bash
claude @devops-engineer "Configura deployment automático a Vercel con preview deployments"
```

### Monitoring

```bash
claude @observability-engineer "Implementa logging estructurado y métricas de performance"

claude @observability-engineer "Analiza el Lighthouse score y sugiere mejoras"
```

---

## Arquitectura

### Decisiones técnicas

```bash
# Comparar opciones
claude @solution-architect "¿Debería usar REST o GraphQL para la nueva API de analytics?"

# Diseñar arquitectura
claude @solution-architect "Diseña arquitectura para sistema de notificaciones en tiempo real"

# Documentar decisión
claude @solution-architect "Crea ADR para la decisión de usar MongoDB vs PostgreSQL"
```

### Refactoring

```bash
claude @solution-architect "Propón refactoring de la estructura de carpetas para mejor escalabilidad"

claude @code-reviewer "Revisa el código del servicio de pagos y sugiere mejoras arquitectónicas"
```

---

## Workflows Completos

### Nueva Feature Completa

```bash
# El orchestrator coordinará todo el equipo
claude "Necesito implementar sistema de comentarios y ratings para productos con:
- Backend: API para crear, leer, actualizar y borrar comentarios
- Frontend: Componente de lista de comentarios y formulario
- Base de datos: Esquema relacionado con productos y usuarios
- Tests: Unitarios e integración
- Seguridad: Validación y sanitización"

# El orchestrator derivará a:
# 1. Product Manager → define requisitos
# 2. Solution Architect → diseña arquitectura
# 3. Data Engineer → crea schemas
# 4. Backend Architect → implementa API
# 5. Frontend Architect → crea UI
# 6. Security Guardian → valida seguridad
# 7. Test Engineer → escribe tests
# 8. Code Reviewer → revisa código
```

### Bug Fix con Root Cause Analysis

```bash
claude "El endpoint /api/products está devolviendo 500 cuando hay más de 100 productos. Debug y fix."

# El orchestrator:
# 1. Backend Architect → diagnostica el error
# 2. Data Engineer → revisa query performance
# 3. Observability Engineer → analiza logs
# 4. Backend Architect → implementa fix
# 5. Test Engineer → agrega test de regresión
```

### Release a Producción

```bash
claude @release-manager "Prepara release v1.2.0 con los últimos cambios"

# El release manager:
# 1. Genera changelog
# 2. Actualiza versiones
# 3. Crea PR
# 4. Coordina con QA Lead para testing final
# 5. Crea tags y release notes
```

### Documentación de Feature

```bash
claude @documentation-engineer "Documenta el nuevo sistema de autenticación incluyendo:
- README con guía de uso
- OpenAPI specs para la API
- Ejemplos de código"
```

---

## Tips y Mejores Prácticas

### Cuándo usar el Orchestrator

Usa el orchestrator cuando:
- No estés seguro de qué agente necesitas
- La tarea requiera coordinación entre múltiples agentes
- Sea una feature compleja con múltiples pasos

```bash
# Bien
claude "Necesito optimizar el rendimiento de la app"

# En lugar de
claude @observability-engineer "..." # ¿Es este el agente correcto?
```

### Cuándo usar agentes específicos

Usa agentes específicos cuando:
- Sepas exactamente qué necesitas
- Sea una tarea puntual dentro de un dominio
- Quieras máxima velocidad

```bash
# Bien
claude @backend-architect "Agrega endpoint GET /api/health"

# Bien
ccf "Cambia el color del botón principal a azul"
```

### Combinar agentes en secuencia

```bash
# Primero diseña
claude @solution-architect "Diseña arquitectura para cache de productos"

# Luego implementa
claude @backend-architect "Implementa la solución de cache propuesta"

# Finalmente documenta
claude @documentation-engineer "Documenta el sistema de cache"
```

### Usar context en comandos

```bash
# Proporciona contexto útil
claude @backend-architect "En el endpoint /api/products, agrega filtro por categoría.
El modelo Product ya tiene el campo category como string."

# En lugar de
claude @backend-architect "Agrega filtro" # Muy vago
```

---

## Shortcuts Comunes

```bash
# Desarrollo rápido
ccb "endpoint"          # Nuevo endpoint backend
ccf "componente"        # Nuevo componente frontend
ccd "schema"            # Nuevo schema de datos

# Review y calidad
cc-review "revisar"     # Code review
cc-test "tests"         # Agregar tests
ccs "seguridad"         # Validar seguridad

# Deploy
cc-deploy "deploy"      # Deployment

# Documentación
cc-docs "documentar"    # Documentación
```

---

## Ejemplos Avanzados

### Microservicios

```bash
claude @solution-architect "Diseña separación de la monolith en microservicios para:
- User Service
- Product Service
- Order Service
- Notification Service"
```

### Integración con IA

```bash
claude @ai-integration-engineer "Implementa recomendaciones de productos usando OpenAI embeddings"

claude @ai-integration-engineer "Crea chatbot con OpenAI para soporte al cliente"
```

### Performance Optimization

```bash
claude @observability-engineer "Analiza los Web Vitals y propón mejoras"

claude @backend-architect "Optimiza endpoint /api/products para reducir tiempo de respuesta"

claude @frontend-architect "Implementa code splitting y lazy loading en el dashboard"
```

### Multi-region Deployment

```bash
claude @devops-engineer "Configura deployment multi-región en Vercel con edge functions"
```

---

## Recursos Adicionales

- [README Principal](.claude/README.md)
- [Guía de Instalación](.claude/INSTALLATION.md)
- [Configuración](.claude/config.json)
- [Documentación de Agentes](.claude/agents/)
