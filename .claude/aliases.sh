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
