# MERN Agents Framework - Guía Rápida

## Comandos Esenciales

```bash
# Usar orchestrator (punto de entrada)
claude "tu solicitud aquí"

# Usar agente específico
claude @nombre-agente "tu solicitud"

# Verificar instalación
npm run claude:verify

# Cargar aliases
source .claude/aliases.sh
```

## Agentes por Categoría

### 🎯 Coordinación
```bash
orchestrator              # Analiza y deriva tareas
```

### 💻 Desarrollo
```bash
@backend-architect        # APIs, servicios, lógica
@frontend-architect       # React, UI/UX, Tailwind
@data-engineer           # MongoDB, schemas, queries
```

### 🛡️ Calidad
```bash
@security-guardian       # OWASP, seguridad
@test-engineer          # Tests (unit, integration, E2E)
@qa-lead               # QA strategy, checklists
```

### 🏗️ Arquitectura
```bash
@solution-architect     # Decisiones técnicas, ADRs
@code-reviewer         # Code review, best practices
```

### 🚀 Operaciones
```bash
@devops-engineer           # CI/CD, deployment
@observability-engineer    # Monitoring, performance
@release-manager          # Versions, releases
```

### 📚 Soporte
```bash
@documentation-engineer    # Docs técnicas
@product-manager          # User stories
@ai-integration-engineer  # IA, LLMs
```

## Aliases Rápidos

```bash
# Principales
ccb "..."    # Backend Architect
ccf "..."    # Frontend Architect
ccd "..."    # Data Engineer
ccs "..."    # Security Guardian
cct "..."    # Test Engineer

# Comandos comunes
cc-review "..."   # Code Reviewer
cc-test "..."     # Test Engineer
cc-deploy "..."   # DevOps Engineer
cc-docs "..."     # Documentation Engineer
```

## Flujos Comunes

### Nueva Feature
```bash
claude "Implementa [feature]"
# Orchestrator coordina todo
```

### Bug Fix
```bash
claude "Debug: [problema]"
# Deriva al agente apropiado
```

### Code Review
```bash
claude @code-reviewer "Revisa [archivo/directorio]"
```

### Decisión Arquitectónica
```bash
claude @solution-architect "¿[opción A] o [opción B]?"
```

### Deploy
```bash
claude @devops-engineer "Deploy [entorno]"
```

## Cuándo usar qué

| Situación | Agente | Comando |
|-----------|--------|---------|
| No sé qué hacer | Orchestrator | `claude "ayuda con..."` |
| Nuevo endpoint | Backend | `ccb "endpoint..."` |
| Nuevo componente | Frontend | `ccf "componente..."` |
| Schema de DB | Data | `ccd "schema..."` |
| Revisar seguridad | Security | `ccs "revisa..."` |
| Escribir tests | Test | `cct "tests para..."` |
| Decisión técnica | Solution Arch | `claude @solution-architect` |
| Preparar release | Release Mgr | `claude @release-manager` |

## Tips

1. **Usa orchestrator cuando no estés seguro**
   - Analiza automáticamente
   - Deriva al agente correcto
   - Coordina workflows complejos

2. **Usa agentes específicos para rapidez**
   - Cuando sepas exactamente qué necesitas
   - Para tareas puntuales
   - Para máxima eficiencia

3. **Proporciona contexto**
   ```bash
   # ✅ Bueno
   claude @backend-architect "En /api/users, agrega validación de email único"

   # ❌ Malo
   claude @backend-architect "validación"
   ```

4. **Encadena agentes para workflows**
   ```bash
   # 1. Diseña
   claude @solution-architect "diseña..."

   # 2. Implementa
   claude @backend-architect "implementa según diseño..."

   # 3. Documenta
   claude @documentation-engineer "documenta..."
   ```

## Estructura de Archivos

```
.claude/
├── agents/              # 15 agentes
├── core/               # 5 archivos compartidos
├── config.json         # Configuración
├── README.md           # Docs principal
├── INSTALLATION.md     # Guía instalación
├── EXAMPLES.md         # Ejemplos de uso
└── QUICK-REFERENCE.md  # Esta guía
```

## Scripts NPM

```bash
npm run claude:setup          # Setup completo
npm run claude:verify         # Verificar instalación
npm run claude:convert        # Convertir agente
npm run claude:convert-all    # Convertir todos
npm run claude:aliases        # Ver aliases
```

## Troubleshooting Rápido

### Agente no se reconoce
```bash
npm run claude:verify
```

### Reinstalar
```bash
rm -rf .claude
npm run claude:setup
npm run claude:convert-all
```

### Aliases no funcionan
```bash
source .claude/aliases.sh
```

## Links Útiles

- [README completo](.claude/README.md)
- [Ejemplos detallados](.claude/EXAMPLES.md)
- [Instalación](.claude/INSTALLATION.md)
- [Configuración](.claude/config.json)

---

**¿Necesitas ayuda?** Pregunta al orchestrator:
```bash
claude "¿Qué agente debo usar para [tu tarea]?"
```
