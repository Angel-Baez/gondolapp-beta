#!/bin/bash

# Script para convertir un agente del formato Copilot a Claude Code

if [ $# -eq 0 ]; then
    echo "Uso: ./convert-agent.sh <nombre-agente>"
    echo "Ejemplo: ./convert-agent.sh backend-architect"
    exit 1
fi

AGENT_NAME=$1
SOURCE=".github/agents/${AGENT_NAME}.md"
DEST=".claude/agents/${AGENT_NAME}.md"

if [ ! -f "$SOURCE" ]; then
    echo "❌ No se encontró: $SOURCE"
    exit 1
fi

echo "🔄 Convirtiendo $AGENT_NAME..."

# Extraer contenido después del frontmatter YAML
# (después de la segunda línea de ---)
awk '/^---$/{n++; next} n>=2' "$SOURCE" > "$DEST"

# Agregar header para Claude Code
sed -i '' '1i\
# '"${AGENT_NAME//-/ }"' (Claude Code)\
\
**Convertido de MERN Agents Framework**\
' "$DEST"

echo "✅ Convertido: $DEST"
