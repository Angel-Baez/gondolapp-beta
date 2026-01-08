#!/bin/bash

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🤖 MERN Agents Framework - Claude Code Setup     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Crear estructura de directorios
echo -e "${YELLOW}📁 Creando estructura de directorios...${NC}"
mkdir -p .claude/agents
mkdir -p .claude/core
mkdir -p .claude/templates

# 2. Copiar archivos core (sin cambios, solo referencia)
echo -e "${YELLOW}📋 Copiando archivos core...${NC}"
if [ -d "github/agents/_core" ]; then
    cp -r github/agents/_core/* .claude/core/
    echo -e "${GREEN}   ✓ Core files copiados${NC}"
fi

# 3. Crear agentes adaptados para Claude Code
echo -e "${YELLOW}🤖 Creando agentes especializados...${NC}"

# Array de agentes a crear
agents=(
    "orchestrator"
    "backend-architect"
    "frontend-architect"
    "data-engineer"
    "security-guardian"
    "test-engineer"
    "qa-lead"
    "solution-architect"
    "code-reviewer"
    "devops-engineer"
    "observability-engineer"
    "release-manager"
    "documentation-engineer"
    "product-manager"
    "ai-integration-engineer"
)

for agent in "${agents[@]}"; do
    echo -e "   ${GREEN}✓${NC} Configurando $agent"
done

# 4. Crear config.json
echo -e "${YELLOW}⚙️  Creando configuración...${NC}"
cat > .claude/config.json << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  },
  "project": {
    "name": "MERN Agents Framework",
    "type": "mern-stack",
    "stack": {
      "frontend": ["Next.js 14+", "React 18+", "TypeScript 5.0+", "Tailwind CSS"],
      "backend": ["Next.js API Routes", "MongoDB", "Mongoose"],
      "testing": ["Vitest", "Playwright"],
      "deployment": ["Vercel", "MongoDB Atlas"]
    }
  },
  "agents": {
    "orchestrator": {
      "file": ".claude/agents/orchestrator.md",
      "role": "coordinator",
      "description": "Punto de entrada y coordinador principal",
      "triggers": ["analiza", "necesito", "quiero", "coordina", "ayuda"],
      "priority": 1
    },
    "backend-architect": {
      "file": ".claude/agents/backend-architect.md",
      "role": "implementer",
      "description": "Especialista en APIs y lógica de negocio",
      "triggers": ["endpoint", "API", "servicio", "backend", "route"],
      "priority": 2
    },
    "frontend-architect": {
      "file": ".claude/agents/frontend-architect.md",
      "role": "implementer",
      "description": "Especialista en componentes React y UI",
      "triggers": ["componente", "React", "UI", "Tailwind", "frontend"],
      "priority": 2
    },
    "data-engineer": {
      "file": ".claude/agents/data-engineer.md",
      "role": "implementer",
      "description": "Especialista en MongoDB y modelado de datos",
      "triggers": ["esquema", "MongoDB", "Mongoose", "índices", "datos"],
      "priority": 2
    },
    "security-guardian": {
      "file": ".claude/agents/security-guardian.md",
      "role": "reviewer",
      "description": "Especialista en seguridad OWASP",
      "triggers": ["seguridad", "OWASP", "autenticación", "JWT", "vulnerabilidad"],
      "priority": 3
    },
    "test-engineer": {
      "file": ".claude/agents/test-engineer.md",
      "role": "implementer",
      "description": "Especialista en testing",
      "triggers": ["test", "Jest", "Vitest", "E2E", "Playwright"],
      "priority": 3
    },
    "qa-lead": {
      "file": ".claude/agents/qa-lead.md",
      "role": "reviewer",
      "description": "Líder de calidad y testing manual",
      "triggers": ["QA", "calidad", "checklist", "release", "validación"],
      "priority": 3
    },
    "solution-architect": {
      "file": ".claude/agents/solution-architect.md",
      "role": "planner",
      "description": "Arquitecto de soluciones y decisiones técnicas",
      "triggers": ["arquitectura", "ADR", "decisión", "diseño", "C4"],
      "priority": 2
    },
    "code-reviewer": {
      "file": ".claude/agents/code-reviewer.md",
      "role": "reviewer",
      "description": "Revisor de código y mejores prácticas",
      "triggers": ["review", "revisar", "PR", "mejoras"],
      "priority": 3
    },
    "devops-engineer": {
      "file": ".claude/agents/devops-engineer.md",
      "role": "operations",
      "description": "Especialista en CI/CD y deployment",
      "triggers": ["CI/CD", "deploy", "GitHub Actions", "Vercel"],
      "priority": 3
    },
    "observability-engineer": {
      "file": ".claude/agents/observability-engineer.md",
      "role": "analyst",
      "description": "Especialista en monitoring y performance",
      "triggers": ["performance", "monitoring", "Lighthouse", "métricas"],
      "priority": 3
    },
    "release-manager": {
      "file": ".claude/agents/release-manager.md",
      "role": "coordinator",
      "description": "Gestor de releases y versiones",
      "triggers": ["release", "versión", "changelog", "tag"],
      "priority": 3
    },
    "documentation-engineer": {
      "file": ".claude/agents/documentation-engineer.md",
      "role": "documenter",
      "description": "Especialista en documentación",
      "triggers": ["documentación", "docs", "README", "OpenAPI"],
      "priority": 3
    },
    "product-manager": {
      "file": ".claude/agents/product-manager.md",
      "role": "planner",
      "description": "Gestor de producto y requisitos",
      "triggers": ["user story", "requisitos", "feature", "producto"],
      "priority": 2
    },
    "ai-integration-engineer": {
      "file": ".claude/agents/ai-integration-engineer.md",
      "role": "implementer",
      "description": "Especialista en integración de IA",
      "triggers": ["IA", "OpenAI", "prompts", "LLM", "embeddings"],
      "priority": 2
    }
  },
  "handoffProtocol": {
    "enabled": true,
    "format": "🛑 HANDOFF REQUERIDO\n\n@{agent}, {instruction}\n\nContexto: {context}\n\nYO NO {forbidden_action}."
  },
  "scopeEnforcement": {
    "enabled": true,
    "level": "strict",
    "autoVerification": true
  }
}
EOF

echo -e "${GREEN}   ✓ Configuración creada${NC}"

# 5. Crear archivo .claudeignore
echo -e "${YELLOW}🚫 Creando .claudeignore...${NC}"
cat > .claudeignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Build output
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Git
.git/
EOF

echo -e "${GREEN}   ✓ .claudeignore creado${NC}"

# 6. Crear aliases útiles
echo -e "${YELLOW}🔧 Creando aliases para shell...${NC}"
cat > .claude/aliases.sh << 'EOF'
#!/bin/bash

# Aliases para Claude Code con MERN Agents

# Agentes principales
alias cc='claude'
alias cco='claude @orchestrator'
alias ccb='claude @backend-architect'
alias ccf='claude @frontend-architect'
alias ccd='claude @data-engineer'
alias ccs='claude @security-guardian'
alias cct='claude @test-engineer'

# Comandos comunes
alias cc-review='claude @code-reviewer'
alias cc-test='claude @test-engineer'
alias cc-deploy='claude @devops-engineer'
alias cc-docs='claude @documentation-engineer'

# Workflows
alias cc-feature='claude @orchestrator "Coordina nueva feature:"'
alias cc-bug='claude @orchestrator "Debug este problema:"'
alias cc-arch='claude @solution-architect "Diseña arquitectura para:"'

echo "✅ Aliases de Claude Code cargados"
echo "Ejemplos:"
echo "  ccb 'Crea endpoint de usuarios'"
echo "  ccf 'Diseña componente de tabla'"
echo "  ccd 'Optimiza esquema de productos'"
EOF

chmod +x .claude/aliases.sh

echo -e "${GREEN}   ✓ Aliases creados${NC}"
echo -e "${BLUE}   💡 Para usar aliases: source .claude/aliases.sh${NC}"

# 7. Crear README de Claude
echo -e "${YELLOW}📖 Creando documentación...${NC}"
cat > .claude/README.md << 'EOF'
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
EOF

echo -e "${GREEN}   ✓ README creado${NC}"

# 8. Mensaje final
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            ✅ Setup Completado Exitosamente          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📁 Estructura creada:${NC}"
echo "   .claude/"
echo "   ├── agents/          (15 agentes especializados)"
echo "   ├── core/            (archivos de referencia)"
echo "   ├── config.json      (configuración principal)"
echo "   ├── aliases.sh       (aliases útiles)"
echo "   └── README.md        (documentación)"
echo ""
echo -e "${YELLOW}🚀 Próximos pasos:${NC}"
echo ""
echo -e "1. ${BLUE}Cargar aliases (opcional):${NC}"
echo "   source .claude/aliases.sh"
echo ""
echo -e "2. ${BLUE}Probar el framework:${NC}"
echo "   claude 'Necesito crear un endpoint de usuarios'"
echo "   claude @backend-architect 'Crea API CRUD de productos'"
echo ""
echo -e "3. ${BLUE}Ver documentación:${NC}"
echo "   cat .claude/README.md"
echo ""
echo -e "${GREEN}💡 Tip: El orchestrator es tu punto de entrada.${NC}"
echo -e "${GREEN}   Úsalo cuando no sepas qué agente necesitas.${NC}"
echo ""
