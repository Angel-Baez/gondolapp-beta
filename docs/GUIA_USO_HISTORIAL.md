# Guía Rápida de Uso - Historial de Listas

## Flujo Completo del Usuario

### 1️⃣ Trabajar en Lista de Reposición
**Ubicación:** Página Principal (`/`)

**Acciones:**
1. Escanear o agregar productos
2. Marcar productos:
   - ✅ **Repuesto**: Producto ya repuesto en góndola
   - ❌ **Sin Stock**: Producto no disponible en depósito
   - ⏳ **Pendiente**: Aún no procesado

**Interfaz:**
```
┌─────────────────────────────────────┐
│ Lista de Reposición    [Ver Historial] │
├─────────────────────────────────────┤
│                                     │
│  📦 PENDIENTES (5)                  │
│  ├─ Coca-Cola 1L (x3)              │
│  ├─ Leche La Serenísima (x2)       │
│  └─ ...                            │
│                                     │
│  ✅ REPUESTOS (8)                   │
│  ├─ Arroz Gallo Oro (x5)           │
│  └─ ...                            │
│                                     │
│  ❌ SIN STOCK (2)                   │
│  └─ Azúcar Ledesma (x1)            │
│                                     │
├─────────────────────────────────────┤
│     [💾 Guardar Lista y Limpiar]    │ ← Botón flotante
└─────────────────────────────────────┘
```

---

### 2️⃣ Guardar Lista
**Trigger:** Click en "Guardar Lista y Limpiar"

**Modal de Confirmación:**
```
╔═══════════════════════════════════╗
║  Guardar lista              [X]  ║
╠═══════════════════════════════════╣
║                                   ║
║  ¿Deseas guardar esta lista?      ║
║  Se guardará el estado actual     ║
║  y la lista se limpiará.          ║
║                                   ║
║  ┌─────────────────────────────┐  ║
║  │ 📊 Resumen:                │  ║
║  │ • Total: 15 productos       │  ║
║  │ • Repuestos: 8              │  ║
║  │ • Sin stock: 2              │  ║
║  │ • Pendientes: 5             │  ║
║  └─────────────────────────────┘  ║
║                                   ║
║  [Cancelar]   [Guardar]          ║
╚═══════════════════════════════════╝
```

**Resultado:**
- ✅ Lista guardada en IndexedDB
- 🧹 Lista actual limpiada
- 🔔 Notificación: "Lista guardada correctamente"
- ↩️ Vuelta a lista vacía

---

### 3️⃣ Ver Historial
**Ubicación:** Click en "Ver Historial" → `/reposicion/historial`

**Interfaz:**
```
┌─────────────────────────────────────┐
│  ← Volver                           │
│                                     │
│  📚 Historial de Listas             │
│  Revisa todas tus listas guardadas  │
├─────────────────────────────────────┤
│  📅 Filtrar por fecha  [Mostrar ▼] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 22 de noviembre, 2024 10:30   ▼│ │
│  │ 15 productos | 8 repuestos (53%)│ │
│  │ [2 sin stock] [5 pendientes]   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 21 de noviembre, 2024 15:45   ▼│ │
│  │ 23 productos | 20 repuestos (87%)│ │
│  │ [1 sin stock] [2 pendientes]   │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ 20 de noviembre, 2024 09:15   ▼│ │
│  │ 18 productos | 15 repuestos (83%)│ │
│  │ [3 sin stock] [0 pendientes]   │ │
│  └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

### 4️⃣ Ver Detalles de Lista
**Trigger:** Click en cualquier lista del historial

**Detalle Expandido:**
```
┌─────────────────────────────────────┐
│ 22 de noviembre, 2024 10:30      ▲│
│ 15 productos | 8 repuestos (53%)   │
│ [2 sin stock] [5 pendientes]       │
├─────────────────────────────────────┤
│                                     │
│ 📝 Detalle de productos             │
│                                     │
│ ✅ REPUESTOS (8)                    │
│ ┌─────────────────────────────────┐ │
│ │ Coca-Cola (Coca-Cola)           │ │
│ │ • 1000ml                        │ │
│ │ • Cantidad: 3                   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Arroz Gallo Oro (Molinos)       │ │
│ │ • 1000g                         │ │
│ │ • Cantidad: 5                   │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
│                                     │
│ ❌ SIN STOCK (2)                    │
│ ┌─────────────────────────────────┐ │
│ │ Azúcar Ledesma                  │ │
│ │ • 1000g                         │ │
│ │ • Cantidad: 1                   │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
│                                     │
│ ⏳ PENDIENTES (5)                   │
│ ...                                 │
│                                     │
│ [🗑️ Eliminar esta lista]           │
│                                     │
└─────────────────────────────────────┘
```

---

### 5️⃣ Filtrar por Fecha
**Ubicación:** Sección de filtros en página de historial

**Interfaz de Filtros:**
```
╔═══════════════════════════════════╗
║ 📅 Filtrar por fecha         [Ocultar] ║
╠═══════════════════════════════════╣
║                                   ║
║ Desde                             ║
║ ┌───────────────────────────────┐ ║
║ │ [dd/mm/yyyy] 📅               │ ║
║ └───────────────────────────────┘ ║
║                                   ║
║ Hasta                             ║
║ ┌───────────────────────────────┐ ║
║ │ [dd/mm/yyyy] 📅               │ ║
║ └───────────────────────────────┘ ║
║                                   ║
║ [Limpiar filtros]                 ║
║                                   ║
╚═══════════════════════════════════╝
```

---

### 6️⃣ Eliminar Lista
**Trigger:** Click en "Eliminar esta lista"

**Modal de Confirmación:**
```
╔═══════════════════════════════════╗
║  Eliminar lista             [X]  ║
╠═══════════════════════════════════╣
║                                   ║
║  ⚠️ ¿Estás seguro de que deseas   ║
║  eliminar esta lista?             ║
║                                   ║
║  Esta acción no se puede deshacer.║
║                                   ║
║  [Cancelar]   [Eliminar]         ║
╚═══════════════════════════════════╝
```

**Resultado:**
- 🗑️ Lista eliminada de IndexedDB
- ↻ Historial recargado automáticamente
- 🔔 Notificación: "Lista eliminada correctamente"

---

## Casos de Uso Típicos

### 📅 Reposición Diaria
**Escenario:** Empleado realiza reposición de góndolas cada mañana

**Flujo:**
1. 09:00 - Comienza escaneo de productos faltantes
2. 09:00-11:00 - Trabaja en la lista
3. 11:00 - Marca productos repuestos y sin stock
4. 11:30 - Guarda lista completa
5. **Resultado:** Historial con lista del día guardada

### 📊 Revisión Semanal
**Escenario:** Supervisor revisa desempeño semanal

**Flujo:**
1. Accede a "Ver Historial"
2. Filtra por última semana
3. Analiza listas guardadas
4. Identifica productos frecuentes sin stock
5. **Resultado:** Datos para optimizar pedidos

### 🔍 Auditoría Mensual
**Escenario:** Gerente necesita reportes mensuales

**Flujo:**
1. Accede a historial
2. Filtra por mes completo
3. Utiliza función `obtenerEstadisticas('mes')`
4. Genera reporte con datos
5. **Resultado:** Métricas de rendimiento

---

## Atajos de Teclado (Futuro)

```
Ctrl/Cmd + S  → Guardar lista actual
Ctrl/Cmd + H  → Ver historial
Escape        → Cerrar modales
```

---

## Datos Almacenados

### Por cada lista guardada:
```json
{
  "id": "uuid-único",
  "fechaGuardado": "2024-11-22T10:30:00Z",
  "resumen": {
    "totalProductos": 15,
    "totalRepuestos": 8,
    "totalSinStock": 2,
    "totalPendientes": 5
  },
  "items": [
    {
      "productoNombre": "Coca-Cola",
      "varianteNombre": "1000ml",
      "cantidad": 3,
      "estado": "repuesto"
    },
    // ... más items
  ]
}
```

### Límites:
- **Capacidad IndexedDB:** ~50MB
- **Listas por defecto:** 100 últimas
- **Items por lista:** Sin límite práctico
- **Retención:** Indefinida (hasta que usuario elimine)

---

## Tips de Uso

### ✅ Mejores Prácticas
- Guardar lista al final de cada turno
- Revisar historial semanalmente
- Eliminar listas muy antiguas (>3 meses)
- Usar filtros para búsquedas específicas

### ⚠️ Qué Evitar
- No cerrar navegador durante guardado
- No guardar listas vacías
- No eliminar listas sin revisar
- No sobrepasar 50MB de datos

---

## Soporte

Para problemas o preguntas:
1. Verificar documentación: `docs/HISTORIAL_LISTAS.md`
2. Revisar console del navegador (F12)
3. Comprobar permisos de IndexedDB
4. Contactar soporte técnico

---

**Última actualización:** 22 de noviembre de 2024
