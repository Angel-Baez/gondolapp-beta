# ⚖️ Resolución de Conflictos entre Agentes

> **Este documento define la jerarquía y procesos para resolver conflictos cuando diferentes agentes dan recomendaciones contradictorias.**

---

## 🏛️ Jerarquía de Prioridades

Cuando hay conflicto entre recomendaciones, aplicar este orden de prioridad:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRIORIDAD MÁXIMA                             │
├─────────────────────────────────────────────────────────────────────┤
│  1. 🔒 SEGURIDAD                                                    │
│     security-guardian > cualquier otra recomendación                 │
│     - Vulnerabilidades OWASP                                         │
│     - Exposición de datos sensibles                                  │
│     - Autenticación/Autorización                                     │
├─────────────────────────────────────────────────────────────────────┤
│  2. ✅ FUNCIONALIDAD CORRECTA                                       │
│     - El código debe funcionar correctamente                         │
│     - Comportamiento esperado según requisitos                       │
├─────────────────────────────────────────────────────────────────────┤
│  3. 📊 PERFORMANCE CRÍTICA                                          │
│     observability-engineer cuando impacta UX                         │
│     - Core Web Vitals                                                │
│     - Tiempo de respuesta de API < 200ms                             │
├─────────────────────────────────────────────────────────────────────┤
│  4. 🧪 TESTABILIDAD                                                 │
│     test-engineer para mantenibilidad                                │
│     - Código debe ser testeable                                      │
│     - Cobertura mínima 80%                                           │
├─────────────────────────────────────────────────────────────────────┤
│  5. 📐 ARQUITECTURA                                                 │
│     solution-architect para consistencia                             │
│     - Patrones establecidos                                          │
│     - Decisiones documentadas en ADRs                                │
├─────────────────────────────────────────────────────────────────────┤
│  6. 🎨 ESTILO Y CONVENCIONES                                        │
│     code-reviewer para consistencia                                  │
│     - Naming conventions                                             │
│     - Estructura de archivos                                         │
│                         PRIORIDAD MENOR                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Escenarios de Conflicto Comunes

### Escenario 1: Seguridad vs Performance

**Conflicto:**
- `security-guardian`: "Implementar rate limiting estricto (10 req/min)"
- `observability-engineer`: "Rate limiting afecta UX, usuarios legítimos bloqueados"

**Resolución:**
```typescript
// ✅ PRIORIZAR SEGURIDAD con mitigación de impacto en UX

// Implementar rate limiting adaptativo
const rateLimitConfig = {
  // Rate limit base estricto
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto (base)
  
  // Pero con excepciones para usuarios autenticados
  keyGenerator: (req: Request) => {
    // Usuarios autenticados tienen límite más alto
    if (req.user) {
      return `authenticated:${req.user.id}`;
    }
    return req.ip;
  },
  
  // Límites diferenciados
  handler: (req, res) => {
    const limit = req.user ? 100 : 10;
    // ...
  },
  
  // Headers informativos para UX
  standardHeaders: true,
  legacyHeaders: false,
};

// Comunicar límites al usuario
// X-RateLimit-Remaining: 5
// X-RateLimit-Reset: 1234567890
```

**Documentar decisión:**
```markdown
## ADR-001: Rate Limiting Adaptativo

**Contexto:** Necesidad de proteger API contra abuso sin impactar UX.

**Decisión:** Implementar rate limiting con límites diferenciados:
- Usuarios anónimos: 10 req/min
- Usuarios autenticados: 100 req/min

**Consecuencias:**
- ✅ Protección contra ataques de fuerza bruta
- ✅ UX aceptable para usuarios legítimos
- ⚠️ Complejidad adicional en configuración
```

---

### Escenario 2: DX (Developer Experience) vs Performance

**Conflicto:**
- `backend-architect`: "Usar Mongoose populate() para código más limpio"
- `data-engineer`: "Populate es lento, usar aggregation pipeline"

**Resolución:**
```typescript
// ✅ EVALUAR CASO POR CASO

// Para queries simples y desarrollo rápido: populate
// Aceptable cuando:
// - Dataset pequeño (< 1000 documentos)
// - No es ruta crítica de performance
// - Prototipado / MVP

async function getOrderWithCustomer(orderId: string) {
  return OrderModel.findById(orderId)
    .populate("customerId", "name email")
    .lean();
}

// Para queries críticas o datasets grandes: aggregation
// Necesario cuando:
// - Dataset grande
// - Ruta crítica (dashboard, listados)
// - Necesita métricas calculadas

async function getOrdersWithMetrics(filters: OrderFilters) {
  return OrderModel.aggregate([
    { $match: buildMatchStage(filters) },
    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
        pipeline: [{ $project: { name: 1, email: 1 } }],
      },
    },
    { $unwind: "$customer" },
    // ... más stages
  ]);
}
```

**Regla general:**
| Criterio | Usar Populate | Usar Aggregation |
|----------|---------------|------------------|
| Docs relacionados | < 10 | > 10 |
| Frecuencia de uso | Bajo | Alto |
| Necesita cálculos | No | Sí |
| Etapa del proyecto | MVP/Prototipo | Producción |

---

### Escenario 3: Pureza Arquitectónica vs Pragmatismo

**Conflicto:**
- `solution-architect`: "Cada capa debe ser independiente, inyectar dependencias"
- `frontend-architect`: "Para este componente simple, es over-engineering"

**Resolución:**
```typescript
// ✅ APLICAR "REGLA DE TRES"
// Abstraer cuando el patrón se repite 3+ veces

// BIEN: Componente simple, acceso directo
// Solo se usa en un lugar, no necesita abstracción
function UserAvatar({ userId }: { userId: string }) {
  const { data: user } = useSWR(`/api/users/${userId}`);
  return <Avatar src={user?.avatar} alt={user?.name} />;
}

// BIEN: Lógica repetida, abstraer
// Se usa en múltiples componentes
function useUser(userId: string) {
  return useSWR<User>(`/api/users/${userId}`, fetcher);
}

function UserAvatar({ userId }: { userId: string }) {
  const { data: user } = useUser(userId);
  return <Avatar src={user?.avatar} alt={user?.name} />;
}

function UserCard({ userId }: { userId: string }) {
  const { data: user } = useUser(userId);
  // ...
}

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useUser(userId);
  // ...
}
```

**Checklist de cuándo abstraer:**
- [ ] ¿Se repite 3+ veces?
- [ ] ¿Tiene lógica de negocio?
- [ ] ¿Necesita ser testeable independientemente?
- [ ] ¿Es probable que cambie la implementación?

Si ≥2 son "Sí" → Abstraer

---

### Escenario 4: Tests Completos vs Velocidad de Entrega

**Conflicto:**
- `test-engineer`: "Necesitamos 90% de coverage y tests E2E"
- `product-manager`: "Tenemos deadline, entregar primero"

**Resolución:**
```typescript
// ✅ TESTING ESTRATÉGICO

// Prioridad 1: Tests para código crítico (SIEMPRE)
// - Autenticación
// - Pagos
// - Lógica de negocio core

describe("AuthService", () => {
  it("should validate credentials correctly", async () => { /* ... */ });
  it("should handle invalid tokens", async () => { /* ... */ });
  it("should refresh tokens before expiry", async () => { /* ... */ });
});

// Prioridad 2: Tests de integración para flujos principales
// - Happy path de features principales

describe("POST /api/orders", () => {
  it("should create order successfully", async () => { /* ... */ });
});

// Prioridad 3: Tests unitarios para lógica compleja
// - Cálculos
// - Transformaciones de datos

describe("calculateOrderTotal", () => {
  it("should apply discount correctly", () => { /* ... */ });
});

// Prioridad 4: Tests E2E para flujos críticos (puede diferirse)
// - Checkout completo
// - Registro de usuario
```

**Matriz de decisión:**

| Área | Deadline Tight | Tiempo Normal |
|------|----------------|---------------|
| Auth/Security | Tests obligatorios | Tests completos |
| Core Business | Tests básicos | Tests completos |
| UI Components | Snapshot tests | Tests interacción |
| Utils/Helpers | Diferir | Tests unitarios |

---

### Escenario 5: Accesibilidad vs Diseño Visual

**Conflicto:**
- `frontend-architect`: "Contraste WCAG AA requiere texto más oscuro"
- *Diseñador*: "El diseño usa gris claro por estética"

**Resolución:**
```typescript
// ✅ ACCESIBILIDAD ES OBLIGATORIA (No negociable)

// ANTES: Diseño original (falla WCAG)
const Card = () => (
  <div className="bg-white">
    <p className="text-gray-400">Texto con bajo contraste</p> {/* 2.5:1 ratio ❌ */}
  </div>
);

// DESPUÉS: Ajustado para WCAG AA (4.5:1 mínimo)
const Card = () => (
  <div className="bg-white">
    <p className="text-gray-600">Texto con contraste suficiente</p> {/* 5.7:1 ratio ✅ */}
  </div>
);

// Alternativa: Ajustar fondo si el texto debe ser claro
const CardAlt = () => (
  <div className="bg-gray-800">
    <p className="text-gray-300">Texto claro sobre fondo oscuro</p> {/* 7:1 ratio ✅ */}
  </div>
);
```

**Regla:** Accesibilidad WCAG 2.1 AA es requisito legal en muchos países. No es negociable.

---

## 📋 Template de Resolución de Conflictos

Cuando encuentres un conflicto, documenta usando este template:

```markdown
## Conflicto: [Título descriptivo]

### Contexto
- **Agente A dice:** [Recomendación A]
- **Agente B dice:** [Recomendación B]
- **Situación específica:** [Descripción del caso]

### Análisis
- **Impacto de opción A:** [Pros/Cons]
- **Impacto de opción B:** [Pros/Cons]

### Decisión
Aplicando la jerarquía de prioridades:
1. ¿Hay implicaciones de seguridad? [Sí/No]
2. ¿Afecta funcionalidad core? [Sí/No]
3. ¿Impacta performance crítica? [Sí/No]

**Resolución elegida:** [Opción A/B/Híbrida]

### Implementación
```typescript
// Código que implementa la resolución
```

### Consecuencias
- ✅ Beneficios de esta decisión
- ⚠️ Trade-offs aceptados
- 📝 Deuda técnica a revisar en el futuro (si aplica)
```

---

## 🤝 Proceso de Escalación

Si no puedes resolver un conflicto:

```
1. Consultar _core/_framework-context.md para lineamientos
   ↓
2. Consultar project-context.yml para preferencias del proyecto
   ↓
3. Invocar @orchestrator para mediación
   ↓
4. Documentar en ADR para decisiones significativas
   ↓
5. Escalar a tech lead / arquitecto senior si es necesario
```

---

## 🔄 Revisión de Decisiones

Las decisiones de resolución de conflictos deben revisarse:

- **Cada sprint:** Revisar si las decisiones siguen siendo válidas
- **Cada release:** Evaluar impacto de decisiones tomadas
- **Post-mortem:** Analizar si conflictos mal resueltos causaron problemas

---

> **Recuerda:** El objetivo no es ganar debates, sino entregar software de calidad que sea seguro, funcional, y mantenible.
