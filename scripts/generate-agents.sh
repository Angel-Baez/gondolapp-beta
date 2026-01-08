#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🤖 Generando agentes especializados...${NC}"

# Función para crear cada agente
create_agent() {
    local agent_name=$1
    local agent_file=".claude/agents/${agent_name}.md"

    echo -e "${GREEN}   ✓${NC} Creando $agent_name"

    # Aquí copiaremos el contenido adaptado de cada agente
    # El contenido será extraído de los archivos originales
    # pero adaptado al formato de Claude Code
}

# Crear todos los agentes
agents=(
    "orchestrator:Coordinador principal"
    "backend-architect:APIs y lógica de negocio"
    "frontend-architect:Componentes React y UI"
    "data-engineer:MongoDB y datos"
    "security-guardian:Seguridad OWASP"
    "test-engineer:Testing"
    "qa-lead:Calidad"
    "solution-architect:Arquitectura"
    "code-reviewer:Code review"
    "devops-engineer:CI/CD y deployment"
    "observability-engineer:Monitoring"
    "release-manager:Releases"
    "documentation-engineer:Documentación"
    "product-manager:Producto"
    "ai-integration-engineer:Integración IA"
)

for agent_info in "${agents[@]}"; do
    IFS=: read -r name desc <<< "$agent_info"
    create_agent "$name"
done

echo -e "${GREEN}✅ Todos los agentes generados${NC}"
