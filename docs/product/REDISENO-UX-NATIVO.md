# 📱 Rediseño UX Nativo - Especificación de Producto

> **Documento de Requisitos de Producto (PRD)**  
> **Fecha:** 9 de diciembre de 2025  
> **Versión:** 1.0  
> **Estado:** Aprobado para implementación

---

## 📋 Resumen Ejecutivo

### Objetivo

Rediseñar la PWA GondolApp para que se sienta como una aplicación móvil nativa, mejorando la ergonomía y siguiendo los patrones de diseño de iOS y Android.

### Problema Actual

- La app tiene apariencia de sitio web responsive, no de app nativa
- Los controles no están optimizados para uso con una mano
- Falta feedback táctil y visual en las interacciones
- Los modales y navegación no siguen patrones móviles nativos

### Resultado Esperado

Una PWA que los usuarios no distingan de una app nativa, con:

- Navegación ergonómica (zona del pulgar)
- Feedback háptico y visual inmediato
- Gestos nativos (swipe, pull-to-refresh)
- Componentes con look & feel nativo

---

## 🎯 KPIs de Éxito

| Métrica                 | Valor Actual | Objetivo | Plazo   |
| ----------------------- | ------------ | -------- | ------- |
| Tasa de instalación PWA | ~15%         | ≥30%     | 30 días |
| Session duration móvil  | --           | +20%     | 30 días |
| Bounce rate móvil       | --           | -15%     | 30 días |
| User satisfaction       | --           | ≥4.5/5   | 60 días |

---

## 📐 Requisitos de Diseño

### Principios Guía

1. **Thumb-Zone First**: Todo lo importante al alcance del pulgar
2. **Instant Feedback**: Respuesta visual < 100ms, háptica inmediata
3. **Native Patterns**: Seguir HIG (iOS) y Material Design (Android)
4. **Offline-Ready**: La UI debe funcionar sin conexión

### Zonas de Interacción (Thumb Zone)

```
┌─────────────────────────────┐
│      ZONA DIFÍCIL           │  ← Header: solo info, no acciones
│      (Hard to reach)        │
├─────────────────────────────┤
│                             │
│      ZONA MEDIA             │  ← Contenido scrolleable
│      (Reachable)            │
│                             │
├─────────────────────────────┤
│      ZONA NATURAL           │  ← Tab bar + FAB + Acciones principales
│      (Easy to reach)        │
└─────────────────────────────┘
```

---

## 📝 User Stories

### Épica: Experiencia Móvil Nativa (EPIC-001)

---

### US-001: Navegación Tab Bar Inferior

**Como** usuario de la app en móvil  
**Quiero** una barra de navegación fija en la parte inferior  
**Para** cambiar entre secciones con el pulgar fácilmente

#### Criterios de Aceptación

| #   | Criterio                                      | Verificable |
| --- | --------------------------------------------- | ----------- |
| 1   | Tab bar fija en parte inferior de la pantalla | ✓           |
| 2   | Altura mínima de 49px (iOS) o 56px (Material) | ✓           |
| 3   | Iconos claros con labels de texto             | ✓           |
| 4   | Tab activo con indicador visual distintivo    | ✓           |
| 5   | Soporta safe areas (notch, home indicator)    | ✓           |
| 6   | Máximo 5 tabs visibles                        | ✓           |
| 7   | Animación suave al cambiar de tab             | ✓           |

#### Tabs Requeridos

| Tab | Icono | Label        | Ruta                  |
| --- | ----- | ------------ | --------------------- |
| 1   | 📦    | Reposición   | `/` o `/reposicion`   |
| 2   | ⏰    | Vencimientos | `/vencimientos`       |
| 3   | ➕    | Escanear     | Acción (abre scanner) |
| 4   | 📊    | Historial    | `/historial`          |
| 5   | ⚙️    | Más          | `/admin` o menú       |

#### Especificaciones Técnicas (para arquitecto)

- Componente: `<BottomTabBar />`
- Posición: `fixed bottom-0`
- Z-index: Por encima del contenido, debajo de modales
- Safe area: `pb-safe` o `env(safe-area-inset-bottom)`

---

### US-002: Floating Action Button (FAB)

**Como** usuario que agrega productos frecuentemente  
**Quiero** un botón flotante siempre visible  
**Para** iniciar el escaneo rápidamente desde cualquier vista

#### Criterios de Aceptación

| #   | Criterio                                       | Verificable |
| --- | ---------------------------------------------- | ----------- |
| 1   | Tamaño: 56x56px mínimo                         | ✓           |
| 2   | Posición: esquina inferior derecha             | ✓           |
| 3   | Separación: 16px del borde, encima del tab bar | ✓           |
| 4   | Sombra prominente para elevación               | ✓           |
| 5   | Feedback háptico al tocar                      | ✓           |
| 6   | Animación de presión (scale down)              | ✓           |
| 7   | Oculto cuando scanner está abierto             | ✓           |

#### Comportamiento

```
Estado normal:     [  📷  ]  ← Icono de cámara/scanner
Estado presionado: [  📷  ]  ← Scale 0.95, sombra reducida
```

---

### US-003: Bottom Sheet para Modales

**Como** usuario móvil  
**Quiero** que los formularios aparezcan como sheets desde abajo  
**Para** tener una experiencia consistente con apps nativas

#### Criterios de Aceptación

| #   | Criterio                                            | Verificable |
| --- | --------------------------------------------------- | ----------- |
| 1   | Aparece desde abajo con animación slide-up          | ✓           |
| 2   | Tiene "handle" visual para indicar que es draggable | ✓           |
| 3   | Se puede cerrar deslizando hacia abajo              | ✓           |
| 4   | Backdrop oscuro (50% opacity)                       | ✓           |
| 5   | Tap en backdrop cierra el sheet                     | ✓           |
| 6   | Altura máxima: 90vh                                 | ✓           |
| 7   | Bordes superiores redondeados (16px)                | ✓           |

#### Estados del Sheet

```
┌─────────────────────────────┐
│░░░░░░░░░ BACKDROP ░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────┤
│          ════════           │  ← Handle (40x4px, rounded)
│                             │
│   [Contenido del Sheet]     │
│                             │
│   ┌─────────────────────┐   │
│   │  Acción Principal   │   │  ← Botón principal
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

#### Usos del Bottom Sheet

- Modal de cantidad al agregar producto
- Formulario de producto manual
- Selector de fecha de vencimiento
- Confirmaciones importantes

---

### US-004: Swipe Actions en Listas

**Como** usuario de iOS/Android  
**Quiero** poder deslizar items para revelar acciones  
**Para** editar o eliminar productos rápidamente

#### Criterios de Aceptación

| #   | Criterio                                               | Verificable |
| --- | ------------------------------------------------------ | ----------- |
| 1   | Swipe izquierda revela acción de eliminar (rojo)       | ✓           |
| 2   | Swipe derecha revela acción secundaria (editar/marcar) | ✓           |
| 3   | Feedback háptico al revelar acciones                   | ✓           |
| 4   | Animación elástica al soltar                           | ✓           |
| 5   | Swipe completo ejecuta la acción                       | ✓           |
| 6   | El item vuelve a posición original si no se completa   | ✓           |

#### Especificación Visual

```
Estado normal:
┌─────────────────────────────────────┐
│  📦 Coca-Cola 2L          x3    ▸  │
└─────────────────────────────────────┘

Swipe izquierda (eliminar):
┌─────────────────────────────────────┐
│ Cola 2L          x3    ▸  │🗑 Eliminar│
└─────────────────────────────────────┘
                            └── Fondo rojo

Swipe derecha (marcar repuesto):
┌─────────────────────────────────────┐
│✓ Repuesto│  📦 Coca-Cola 2L    x3   │
└─────────────────────────────────────┘
└── Fondo verde
```

---

### US-005: Pull to Refresh

**Como** usuario  
**Quiero** poder deslizar hacia abajo para actualizar  
**Para** refrescar las listas de forma intuitiva

#### Criterios de Aceptación

| #   | Criterio                                          | Verificable |
| --- | ------------------------------------------------- | ----------- |
| 1   | Pull down desde el top de la lista activa refresh | ✓           |
| 2   | Indicador visual de progreso mientras se arrastra | ✓           |
| 3   | Spinner nativo mientras carga                     | ✓           |
| 4   | Feedback háptico al activar el refresh            | ✓           |
| 5   | Threshold: 80px de pull para activar              | ✓           |

---

### US-006: Feedback Háptico

**Como** usuario móvil  
**Quiero** recibir vibración táctil en acciones importantes  
**Para** confirmar que mi interacción fue registrada

#### Criterios de Aceptación

| #   | Criterio                                                   | Verificable |
| --- | ---------------------------------------------------------- | ----------- |
| 1   | Vibración ligera al tocar botones                          | ✓           |
| 2   | Vibración media al completar acciones                      | ✓           |
| 3   | Vibración fuerte en errores o warnings                     | ✓           |
| 4   | Vibración success al escanear producto                     | ✓           |
| 5   | Respeta configuración del sistema (si haptics desactivado) | ✓           |

#### Tipos de Feedback

| Evento              | Tipo      | Patrón          |
| ------------------- | --------- | --------------- |
| Tap en botón        | Light     | 10ms            |
| Scan exitoso        | Success   | 15ms-pause-15ms |
| Agregar item        | Medium    | 20ms            |
| Eliminar item       | Warning   | 30ms            |
| Error               | Error     | 50ms-50ms-50ms  |
| Swipe action reveal | Selection | 10ms            |

#### Nota Técnica

Ya existe `useHaptics.ts` - verificar que soporte estos patrones.

---

### US-007: Estados de Carga (Skeleton)

**Como** usuario  
**Quiero** ver placeholders mientras carga el contenido  
**Para** saber que la app está funcionando y qué esperar

#### Criterios de Aceptación

| #   | Criterio                                      | Verificable |
| --- | --------------------------------------------- | ----------- |
| 1   | Skeleton con forma similar al contenido final | ✓           |
| 2   | Animación shimmer de izquierda a derecha      | ✓           |
| 3   | Transición suave a contenido real (fade)      | ✓           |
| 4   | No mostrar skeleton si carga < 200ms          | ✓           |

---

### US-008: Header Compacto

**Como** usuario móvil  
**Quiero** que el header ocupe el mínimo espacio posible  
**Para** ver más contenido en pantalla

#### Criterios de Aceptación

| #   | Criterio                                         | Verificable |
| --- | ------------------------------------------------ | ----------- |
| 1   | Header altura máxima: 56px                       | ✓           |
| 2   | Solo muestra título y acciones esenciales        | ✓           |
| 3   | Se oculta/reduce al hacer scroll down (opcional) | ✓           |
| 4   | Respeta safe area top (notch)                    | ✓           |

---

### US-009: Cards con Estilo Nativo

**Como** usuario  
**Quiero** que las tarjetas de producto se vean modernas  
**Para** tener una experiencia visual premium

#### Criterios de Aceptación

| #   | Criterio                                  | Verificable |
| --- | ----------------------------------------- | ----------- |
| 1   | Bordes redondeados consistentes (12-16px) | ✓           |
| 2   | Sombras sutiles para elevación            | ✓           |
| 3   | Padding interno consistente (16px)        | ✓           |
| 4   | Separación entre cards (8-12px)           | ✓           |
| 5   | Feedback visual al tocar (highlight)      | ✓           |

---

### US-010: Animaciones y Transiciones

**Como** usuario  
**Quiero** transiciones suaves entre estados  
**Para** que la app se sienta fluida y responsiva

#### Criterios de Aceptación

| #   | Criterio                                             | Verificable |
| --- | ---------------------------------------------------- | ----------- |
| 1   | Todas las animaciones a 60fps                        | ✓           |
| 2   | Duración estándar: 200-300ms                         | ✓           |
| 3   | Easing: ease-out para entradas, ease-in para salidas | ✓           |
| 4   | Reducir animaciones si `prefers-reduced-motion`      | ✓           |

#### Animaciones Requeridas

| Elemento         | Animación                | Duración |
| ---------------- | ------------------------ | -------- |
| Tab change       | Fade + slight slide      | 200ms    |
| Modal open       | Slide up + fade backdrop | 300ms    |
| Modal close      | Slide down + fade out    | 250ms    |
| List item add    | Slide in from right      | 200ms    |
| List item remove | Slide out + collapse     | 250ms    |
| FAB press        | Scale down to 0.95       | 100ms    |
| Button press     | Scale down to 0.98       | 50ms     |

---

## 🎨 Especificaciones de Diseño

### Sistema de Espaciado

```
4px  - micro (iconos inline)
8px  - xs (entre elementos relacionados)
12px - sm (padding interno cards)
16px - md (padding estándar, gaps)
24px - lg (secciones)
32px - xl (áreas principales)
```

### Radios de Borde

```
4px  - botones pequeños, inputs
8px  - cards pequeñas, chips
12px - cards, botones grandes
16px - bottom sheets, modales
24px - FAB
full - avatares, indicadores
```

### Sombras (Elevación)

```css
/* Nivel 1 - Cards en reposo */
shadow-sm: 0 1px 2px rgba(0,0,0,0.05)

/* Nivel 2 - Cards hover/active */
shadow-md: 0 4px 6px rgba(0,0,0,0.1)

/* Nivel 3 - FAB, elementos flotantes */
shadow-lg: 0 10px 15px rgba(0,0,0,0.1)

/* Nivel 4 - Modales, bottom sheets */
shadow-xl: 0 20px 25px rgba(0,0,0,0.15)
```

### Tamaños Táctiles

```
Mínimo absoluto: 44x44px (Apple HIG)
Recomendado: 48x48px (Material Design)
FAB: 56x56px
Tab bar items: 49-56px altura, mínimo 64px ancho
```

### Safe Areas

```css
/* iOS notch y home indicator */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

---

## 🏗️ Arquitectura de Componentes Sugerida

### Nuevos Componentes Requeridos

```
src/components/
├── native/
│   ├── BottomTabBar.tsx        # Navegación inferior
│   ├── FloatingActionButton.tsx # FAB
│   ├── BottomSheet.tsx         # Modal tipo sheet
│   ├── SwipeableRow.tsx        # Item con swipe actions
│   ├── PullToRefresh.tsx       # Pull to refresh wrapper
│   ├── SkeletonLoader.tsx      # Skeleton para loading
│   ├── NativeCard.tsx          # Card con estilo nativo
│   └── HapticButton.tsx        # Botón con feedback háptico
```

### Hooks Requeridos

```
src/hooks/
├── useHaptics.ts          # ✅ Ya existe - revisar
├── useIsMobile.ts         # ✅ Ya existe
├── useBottomSheet.ts      # Nuevo - estado del sheet
├── useSwipeGesture.ts     # Nuevo - detección de swipe
├── usePullToRefresh.ts    # Nuevo - PTR logic
└── useSafeArea.ts         # Nuevo - safe area values
```

---

## 📱 Priorización (MoSCoW)

### Must Have (Sprint 1)

- [ ] US-001: Tab Bar inferior
- [ ] US-002: FAB para escaneo
- [ ] US-003: Bottom Sheet para modales
- [ ] US-006: Feedback háptico

### Should Have (Sprint 2)

- [ ] US-004: Swipe actions en listas
- [ ] US-008: Header compacto
- [ ] US-009: Cards con estilo nativo
- [ ] US-010: Animaciones y transiciones

### Could Have (Sprint 3)

- [ ] US-005: Pull to refresh
- [ ] US-007: Skeleton loaders
- [ ] Header que se oculta al scroll

### Won't Have (Diferido)

- Navegación por gestos entre tabs
- Animaciones complejas de página
- 3D Touch / Force Touch

---

## ✅ Definition of Done

Cada User Story se considera completa cuando:

- [ ] Código implementado siguiendo arquitectura existente
- [ ] Funciona en iOS Safari y Android Chrome
- [ ] Funciona offline (no rompe PWA)
- [ ] Tests unitarios para lógica de hooks
- [ ] Feedback háptico integrado donde corresponda
- [ ] Animaciones a 60fps verificado
- [ ] Safe areas respetadas
- [ ] Área táctil ≥ 44px verificada
- [ ] Revisión de código aprobada
- [ ] QA en dispositivos reales (iPhone + Android)

---

## 🔗 Referencias

### Guías de Diseño

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design 3](https://m3.material.io/)
- [Web.dev PWA Patterns](https://web.dev/patterns/pwa/)

### Contexto del Proyecto

- Stack: Next.js 14 + TypeScript + Tailwind CSS
- Ver: `docs/MEJORAS-UX-UI-MOBILE.md` (mejoras previas)
- Ver: `.github/copilot-instructions.md` (arquitectura)

---

## 📤 Handoff

**Este documento está listo para el equipo técnico.**

### Asignaciones Sugeridas

| Rol                    | Responsabilidad                               |
| ---------------------- | --------------------------------------------- |
| **Frontend Architect** | Diseño de componentes, sistema de animaciones |
| **Developer**          | Implementación de US según prioridad          |
| **QA**                 | Testing en dispositivos iOS y Android reales  |

### Siguiente Paso

El Frontend Architect debe crear los ADRs técnicos para:

1. Estrategia de animaciones (CSS vs Framer Motion vs React Spring)
2. Gestión de gestos (librería vs implementación custom)
3. Estructura de componentes nativos

---

> **Nota:** Este documento define QUÉ construir. Las decisiones de CÓMO implementar son responsabilidad del equipo técnico.
