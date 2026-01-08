#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 Convirtiendo todos los agentes...${NC}"
echo ""

# Array de agentes a convertir
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

converted=0
failed=0

for agent in "${agents[@]}"; do
    if ./scripts/convert-agent.sh "$agent" 2>/dev/null; then
        ((converted++))
    else
        echo -e "${YELLOW}   ⚠️  $agent no encontrado o error${NC}"
        ((failed++))
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${GREEN}✅ Convertidos: $converted${NC}"
if [ $failed -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Fallidos: $failed${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════${NC}"
