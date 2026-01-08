#!/bin/bash

echo "🔍 Verificando instalación..."

# Verificar estructura
echo "📁 Estructura de directorios:"
[ -d ".claude/agents" ] && echo "   ✅ .claude/agents" || echo "   ❌ .claude/agents"
[ -d ".claude/core" ] && echo "   ✅ .claude/core" || echo "   ❌ .claude/core"
[ -f ".claude/config.json" ] && echo "   ✅ config.json" || echo "   ❌ config.json"

# Contar agentes
agent_count=$(ls -1 .claude/agents/*.md 2>/dev/null | wc -l)
echo ""
echo "🤖 Agentes encontrados: $agent_count/15"

if [ $agent_count -eq 15 ]; then
    echo "   ✅ Todos los agentes instalados"
else
    echo "   ⚠️  Faltan algunos agentes"
fi

# Verificar config
echo ""
echo "⚙️  Configuración:"
if [ -f ".claude/config.json" ]; then
    if grep -q "orchestrator" .claude/config.json; then
        echo "   ✅ Orchestrator configurado"
    fi
    if grep -q "backend-architect" .claude/config.json; then
        echo "   ✅ Backend Architect configurado"
    fi
fi

echo ""
echo "🎯 Prueba el framework:"
echo "   claude 'Necesito crear un endpoint'"
