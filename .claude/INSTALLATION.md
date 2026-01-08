# Instalación del Framework MERN Agents para Claude Code

## Estado de la Instalación

### ✅ Instalado y Funcionando

La instalación del framework de agentes ha sido completada exitosamente.

```
📦 Estructura instalada:
.claude/
├── agents/              (15 agentes especializados)
│   ├── orchestrator.md
│   ├── backend-architect.md
│   ├── frontend-architect.md
│   ├── data-engineer.md
│   ├── security-guardian.md
│   ├── test-engineer.md
│   ├── qa-lead.md
│   ├── solution-architect.md
│   ├── code-reviewer.md
│   ├── devops-engineer.md
│   ├── observability-engineer.md
│   ├── release-manager.md
│   ├── documentation-engineer.md
│   ├── product-manager.md
│   └── ai-integration-engineer.md
├── core/                (5 archivos de referencia compartidos)
│   ├── _conflict-resolution.md
│   ├── _framework-context.md
│   ├── _shared-data-modeling.md
│   ├── _shared-solid-principles.md
│   └── _shared-workflows.md
├── templates/           (para futuras plantillas)
├── config.json          (configuración del framework)
├── aliases.sh           (aliases de shell)
├── README.md            (documentación principal)
└── INSTALLATION.md      (este archivo)
```

## Scripts Disponibles

### Comandos NPM

```bash
# Ejecutar setup completo (si necesitas reinstalar)
npm run claude:setup

# Verificar instalación
npm run claude:verify

# Convertir un agente específico
npm run claude:convert <nombre-agente>

# Convertir todos los agentes
npm run claude:convert-all

# Cargar aliases (requiere source)
source .claude/aliases.sh
```

### Scripts Directos

```bash
# Setup completo
./scripts/setup-claude-agents.sh

# Verificar instalación
./scripts/verify-setup.sh

# Convertir agente específico
./scripts/convert-agent.sh backend-architect

# Convertir todos los agentes
./scripts/convert-all-agents.sh
```

## Uso del Framework

### 1. Comandos Básicos

```bash
# Usar el orquestador (punto de entrada recomendado)
claude "Necesito crear un sistema de autenticación"

# Usar un agente específico
claude @backend-architect "Crea endpoint CRUD de usuarios"
claude @frontend-architect "Diseña componente de tabla de productos"
claude @data-engineer "Optimiza esquema de MongoDB para productos"
```

### 2. Aliases Rápidos

Carga los aliases primero:
```bash
source .claude/aliases.sh
```

Luego úsalos:
```bash
ccb "Crea endpoint de usuarios"        # Backend Architect
ccf "Diseña componente de dashboard"   # Frontend Architect
ccd "Optimiza índices de MongoDB"      # Data Engineer
ccs "Revisa seguridad del endpoint"    # Security Guardian
cct "Escribe tests para la API"        # Test Engineer
```

### 3. Workflows Comunes

#### Nueva Feature
```bash
claude "Necesito implementar sistema de notificaciones push"
# El Orchestrator coordinará automáticamente:
# 1. Product Manager → define requisitos
# 2. Solution Architect → diseña arquitectura
# 3. Backend/Frontend/Data Engineers → implementan
# 4. Security Guardian → valida seguridad
# 5. Test Engineer → escribe tests
```

#### Bug Fix
```bash
claude "El login está devolviendo error 500 en producción"
# El Orchestrator derivará al agente apropiado
```

#### Code Review
```bash
claude @code-reviewer "Revisa los cambios en src/app/api/users"
```

#### Decisión Arquitectónica
```bash
claude @solution-architect "Decide: ¿REST o GraphQL para la nueva API?"
```

## Agentes Disponibles

### 🎯 Coordinadores
- **orchestrator**: Punto de entrada principal, analiza y deriva tareas

### 💻 Desarrollo
- **backend-architect**: APIs, servicios, lógica de negocio
- **frontend-architect**: Componentes React, UI/UX, Tailwind
- **data-engineer**: MongoDB, esquemas, queries, optimización

### 🛡️ Calidad y Seguridad
- **security-guardian**: Seguridad OWASP, autenticación, JWT
- **test-engineer**: Tests unitarios, integración, E2E
- **qa-lead**: Estrategia QA, checklists manuales

### 🏗️ Arquitectura
- **solution-architect**: Decisiones técnicas, ADRs, C4 models
- **code-reviewer**: Code review, mejores prácticas

### 🚀 Operaciones
- **devops-engineer**: CI/CD, GitHub Actions, deployment
- **observability-engineer**: Monitoring, performance, Lighthouse
- **release-manager**: Versiones, changelog, releases

### 📚 Soporte
- **documentation-engineer**: Documentación técnica, OpenAPI
- **product-manager**: User stories, requisitos, features
- **ai-integration-engineer**: Integración de IA, LLMs, OpenAI

## Stack Tecnológico Soportado

```json
{
  "frontend": [
    "Next.js 14+",
    "React 18+",
    "TypeScript 5.0+",
    "Tailwind CSS"
  ],
  "backend": [
    "Next.js API Routes",
    "MongoDB",
    "Mongoose"
  ],
  "testing": [
    "Vitest",
    "Playwright"
  ],
  "deployment": [
    "Vercel",
    "MongoDB Atlas"
  ]
}
```

## Verificación de la Instalación

Para verificar que todo está correctamente instalado:

```bash
npm run claude:verify
```

Deberías ver:
```
✅ .claude/agents
✅ .claude/core
✅ config.json
✅ Todos los agentes instalados (15/15)
✅ Orchestrator configurado
✅ Backend Architect configurado
```

## Troubleshooting

### Los agentes no se reconocen

1. Verifica que estés en el directorio raíz del proyecto
2. Ejecuta `npm run claude:verify` para verificar la instalación
3. Revisa que exista el archivo `.claude/config.json`

### Error al ejecutar scripts

Asegúrate de que los scripts tienen permisos de ejecución:
```bash
chmod +x scripts/*.sh
```

### Necesito reinstalar

```bash
# Eliminar instalación anterior
rm -rf .claude

# Reinstalar
npm run claude:setup
npm run claude:convert-all
```

## Próximos Pasos

1. **Lee la documentación principal**: `cat .claude/README.md`
2. **Carga los aliases**: `source .claude/aliases.sh`
3. **Prueba el orchestrator**: `claude "Analiza mi proyecto"`
4. **Experimenta con agentes específicos**

## Recursos

- **Documentación principal**: [.claude/README.md](.claude/README.md)
- **Configuración**: [.claude/config.json](.claude/config.json)
- **Agentes**: [.claude/agents/](.claude/agents/)
- **Core files**: [.claude/core/](.claude/core/)

## Ayuda

Si no sabes qué agente usar, simplemente pregunta al orchestrator:
```bash
claude "¿Qué agente debería usar para optimizar mi base de datos?"
```

El orchestrator te guiará al agente correcto.
