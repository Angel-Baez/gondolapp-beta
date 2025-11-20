# 🎨 Mejoras UX/UI Mobile - GondolApp

## ✅ Implementadas (20 Nov 2025)

### Cards de Reposición y Vencimientos

- ✅ **Iconos táctiles mejorados**: Tamaño mínimo de 44x44px según estándares iOS/Android
- ✅ **Layouts responsive**: Uso de clases `sm:` para adaptar tamaños en pantallas más grandes
- ✅ **Controles de cantidad más grandes**: Botones +/- con mejor área táctil (36px → 44px)
- ✅ **Separación visual mejorada**: Layout vertical en móviles para info + controles
- ✅ **Imágenes optimizadas**: Tamaños diferenciados móvil (56px) vs desktop (64px)
- ✅ **Textos truncados**: Prevención de overflow con `truncate` y `min-w-0`
- ✅ **Badges responsivos**: Tamaño de fuente adaptativo (10px móvil, 12px desktop)
- ✅ **Spacing adaptativo**: Padding y gaps reducidos en móviles
- ✅ **Headers de sección mejorados**: Iconos y textos con mejor jerarquía visual
- ✅ **IconButton actualizado**: Bordes redondeados (rounded-lg vs rounded-full) y mejor centrado

---

## 🚀 Mejoras Prioritarias Recomendadas

### 1. **Gestos Táctiles Nativos**

**Impacto**: Alto | **Esfuerzo**: Medio

- Swipe horizontal en cards para revelar acciones rápidas (eliminar, editar)
- Pull-to-refresh en listas para recarga de datos
- Long-press en items para selección múltiple

```tsx
// Ejemplo con framer-motion
<motion.div
  drag="x"
  dragConstraints={{ left: -100, right: 0 }}
  onDragEnd={(e, info) => {
    if (info.offset.x < -50) eliminarItem(id);
  }}
>
```

---

### 2. **Feedback Visual Inmediato**

**Impacto**: Alto | **Esfuerzo**: Bajo

- **Loading skeletons** en vez de spinners genéricos
- **Animaciones de éxito/error** al completar acciones
- **Haptic feedback** en iOS (vibración sutil al marcar repuesto/sin stock)
- **Toast notifications** para confirmaciones no intrusivas

```tsx
// Biblioteca recomendada: react-hot-toast
import { toast } from "react-hot-toast";

toast.success("Producto marcado como repuesto", {
  icon: "✅",
  duration: 2000,
});
```

---

### 3. **Búsqueda y Filtros Avanzados**

**Impacto**: Alto | **Esfuerzo**: Medio

- **Barra de búsqueda sticky** en top de listas
- **Filtros rápidos** por categoría, marca, nivel de alerta
- **Ordenamiento** (alfabético, fecha agregada, cantidad)
- **Chips de filtros activos** visibles y removibles

```tsx
<div className="sticky top-0 z-10 bg-white shadow-md p-3">
  <SearchBar />
  <FilterChips />
</div>
```

---

### 4. **Modo Oscuro (Dark Mode)**

**Impacto**: Medio | **Esfuerzo**: Medio

- Implementar con `next-themes` y Tailwind's dark mode
- Paleta de colores adaptada para conservar contraste de alertas
- Toggle accesible en configuración

```tsx
// tailwind.config.ts
darkMode: 'class',

// Clases con soporte dark
bg-white dark:bg-gray-900
text-gray-900 dark:text-gray-100
```

---

### 5. **Indicadores de Estado Persistentes**

**Impacto**: Medio | **Esfuerzo**: Bajo

- **Badge de conteo** en tabs de navegación (ej: "Pendientes (5)")
- **Barra de progreso** al reponer items (% completado)
- **Estado offline** visible con banner sticky
- **Última sincronización** timestamp visible

```tsx
<Badge className="absolute -top-1 -right-1">{pendientesCount}</Badge>
```

---

### 6. **Acciones Rápidas en Cards Colapsadas**

**Impacto**: Alto | **Esfuerzo**: Bajo

- Botones de acción rápida visibles SIN necesidad de expandir
- Checkbox para marcar como "repuesto" directo en header
- Contadores de cantidad editables en modo colapsado

---

### 7. **Bottom Sheet Modals**

**Impacto**: Medio | **Esfuerzo**: Medio

- Reemplazar modales centrados por bottom sheets (más ergonómico en móviles)
- Animación de slide-up nativa
- Arrastrable para cerrar

```tsx
// Biblioteca: react-spring-bottom-sheet
<BottomSheet
  open={isOpen}
  onDismiss={close}
  snapPoints={({ maxHeight }) => maxHeight * 0.6}
/>
```

---

### 8. **Mejoras en el Escáner**

**Impacto**: Alto | **Esfuerzo**: Medio

- **Guías visuales** en la cámara (rectángulo overlay)
- **Feedback sonoro** al escanear exitoso (opcional, configurable)
- **Historial de últimos escaneos** (quick re-add)
- **Zoom** manual en la cámara para códigos pequeños

---

### 9. **Tutoriales Contextuales (Onboarding)**

**Impacto**: Medio | **Esfuerzo**: Medio

- **Tooltips** en primera visita (ej: "Desliza para eliminar")
- **Spotlight** en funciones clave
- **Empty states** informativos con CTAs claros

```tsx
// Biblioteca: react-joyride
<Joyride
  steps={[{ target: ".scan-button", content: "Toca aquí para escanear" }]}
/>
```

---

### 10. **Accesibilidad (a11y)**

**Impacto**: Alto | **Esfuerzo**: Medio

- **Textos alternativos** en imágenes de productos
- **Labels** semánticos en iconos (`aria-label`)
- **Roles ARIA** en componentes interactivos
- **Navegación por teclado** funcional (para usuarios de screen readers)
- **Contraste mínimo** WCAG AA (ya implementado con colores actuales)

```tsx
<IconButton
  aria-label="Marcar como repuesto"
  role="button"
  title="Marcar como repuesto"
>
  <CheckCircle />
</IconButton>
```

---

### 11. **Performance Optimizations**

**Impacto**: Medio | **Esfuerzo**: Bajo-Medio

- **Virtualización de listas largas** con `react-window`
- **Lazy loading** de imágenes con blur placeholder
- **Memoización** agresiva en componentes pesados
- **Reducción de re-renders** con `useMemo`/`useCallback`

```tsx
import { FixedSizeList } from "react-window";

<FixedSizeList height={600} itemCount={items.length} itemSize={80}>
  {Row}
</FixedSizeList>;
```

---

### 12. **Notificaciones Push (Vencimientos)**

**Impacto**: Alto | **Esfuerzo**: Alto

- **Push notifications** para productos próximos a vencer
- **Configuración de umbrales** (notificar 7 días antes, etc.)
- **Integración con Service Worker** ya existente

---

### 13. **Compartir Listas**

**Impacto**: Medio | **Esfuerzo**: Medio

- **Exportar PDF/CSV** de lista de reposición
- **Compartir vía WhatsApp/Email**
- **Generar link temporal** para compartir con proveedores

---

### 14. **Widget de Estadísticas**

**Impacto**: Bajo | **Esfuerzo**: Medio

- **Dashboard** con métricas clave:
  - Total productos pendientes
  - Productos vencidos esta semana
  - Categorías más requeridas
- **Gráficos simples** con Chart.js o Recharts

---

### 15. **Mejoras en Imágenes**

**Impacto**: Bajo | **Esfuerzo**: Bajo

- **Lazy loading** con `loading="lazy"`
- **Placeholder blur** mientras carga
- **Fallback image** cuando falla la carga de Open Food Facts

```tsx
<img
  src={imagen}
  alt={nombre}
  loading="lazy"
  onError={(e) => (e.target.src = "/placeholder.png")}
  className="blur-sm data-[loaded=true]:blur-0"
/>
```

---

## 📊 Matriz de Priorización

| Mejora             | Impacto | Esfuerzo | Prioridad   |
| ------------------ | ------- | -------- | ----------- |
| Gestos táctiles    | Alto    | Medio    | 🔥 **Alta** |
| Feedback visual    | Alto    | Bajo     | 🔥 **Alta** |
| Búsqueda/Filtros   | Alto    | Medio    | 🔥 **Alta** |
| Acciones rápidas   | Alto    | Bajo     | 🔥 **Alta** |
| Bottom sheets      | Medio   | Medio    | ⚠️ Media    |
| Mejoras escáner    | Alto    | Medio    | ⚠️ Media    |
| Dark mode          | Medio   | Medio    | ⚠️ Media    |
| Accesibilidad      | Alto    | Medio    | ⚠️ Media    |
| Push notifications | Alto    | Alto     | ℹ️ Baja     |
| Compartir listas   | Medio   | Medio    | ℹ️ Baja     |

---

## 🎯 Roadmap Sugerido

### Sprint 1 (1 semana)

- ✅ Mejoras en cards (COMPLETADO)
- Feedback visual (toast notifications)
- Acciones rápidas en headers

### Sprint 2 (1 semana)

- Gestos táctiles (swipe to delete)
- Búsqueda y filtros básicos
- Loading skeletons

### Sprint 3 (2 semanas)

- Bottom sheet modals
- Mejoras en escáner
- Dark mode

### Sprint 4 (1 semana)

- Accesibilidad a11y
- Performance (virtualización)
- Onboarding contextual

---

## 🛠️ Librerías Recomendadas

```bash
# Gestos y animaciones
npm install framer-motion@latest
npm install @use-gesture/react

# Notificaciones
npm install react-hot-toast

# Bottom sheets
npm install react-spring-bottom-sheet

# Virtualización
npm install react-window

# Onboarding
npm install react-joyride

# Dark mode
npm install next-themes

# Charts
npm install recharts
```

---

## 📱 Testing en Dispositivos Reales

### Checklist

- [ ] iPhone SE (pantalla pequeña, 375px)
- [ ] iPhone 14 Pro (notch)
- [ ] Samsung Galaxy S22 (Android)
- [ ] iPad (tablet, landscape mode)
- [ ] Chrome DevTools mobile emulation
- [ ] Lighthouse mobile audit (>90 score)

### Herramientas

- **BrowserStack** para testing cross-device
- **Chrome Remote Debugging** para debug en Android
- **Safari Web Inspector** para debug en iOS

---

## 💡 Notas de Implementación

### Mantener

- ✅ Paleta de colores actual (buena legibilidad)
- ✅ Sistema de alertas por colores (intuitivo)
- ✅ Arquitectura offline-first (crítico para PWA)
- ✅ Estructura de componentes (bien modularizada)

### Evitar

- ❌ Animaciones excesivas (afectan performance)
- ❌ Modales que bloquean toda la pantalla
- ❌ Fuentes muy pequeñas (<12px en móvil)
- ❌ Botones < 44x44px (problema de accesibilidad)

---

**Última actualización**: 20 Noviembre 2025
