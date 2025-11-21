# 📱 Banner de Instalación PWA - GondolApp

## Resumen

Sistema inteligente de detección y promoción de instalación PWA con soporte completo para iOS, Android y navegadores de escritorio.

---

## 🎯 Características Implementadas

### 1. Detección Inteligente de Dispositivos

**Ubicación**: `src/hooks/usePWA.ts`

```typescript
// Detección de iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

// Detección de Android
const isAndroid = /Android/.test(navigator.userAgent);

// Detección de Safari en iOS
const isSafariIOS = isIOS && /Safari/.test(navigator.userAgent);

// Detección de navegadores Chrome-like
const isChromeLike = /Chrome|Chromium|CriOS|Edge|Edg/.test(navigator.userAgent);
```

### 2. Estados del Banner

El banner se muestra en diferentes contextos:

| Estado          | Condición                               | Acción                  |
| --------------- | --------------------------------------- | ----------------------- |
| **Installable** | `beforeinstallprompt` event capturado   | Botón "Instalar" activo |
| **iOS Safari**  | Dispositivo iOS + Safari + No instalado | Instrucciones manuales  |
| **Instalado**   | App ya instalada (standalone)           | Banner oculto           |
| **Dismissed**   | Usuario cerró el banner                 | Oculto permanentemente  |

### 3. Detección de Instalación Existente

```typescript
// Verifica si ya está instalado
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;

// Verifica iOS home screen
const isIOSHomeScreen = isIOS && (window.navigator as any).standalone === true;
```

### 4. Persistencia del Banner

**LocalStorage**: `pwa-banner-dismissed`

- Si el usuario cierra el banner, no se vuelve a mostrar
- Se puede resetear borrando localStorage
- Útil para no ser intrusivo

---

## 🎨 Diseño del Banner

### Componente InstallBanner

**Ubicación**: `src/components/InstallBanner.tsx`

**Características visuales**:

- ✅ Posición fija en la parte inferior (z-index 50)
- ✅ Responsive (92% de ancho en móvil, max 600px en desktop)
- ✅ Fondo blanco con sombra (dark mode compatible)
- ✅ Animación de entrada suave
- ✅ Botón de cerrar (X) siempre visible

### Estados Visuales

#### A. Instalable (Android/Chrome/Edge)

```tsx
<button className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-md">
  Instalar
</button>
```

**Acción**: Dispara el prompt nativo del navegador

#### B. iOS Safari (Instrucciones)

```tsx
<div className="text-xs text-slate-600">
  Para instalar en iOS: toca el botón "Compartir" y luego "Añadir a pantalla de
  inicio".
</div>
<button className="bg-slate-100 hover:bg-slate-200">Cómo instalar</button>
```

**Acción**: Muestra alert con instrucciones paso a paso

---

## 🔧 Arquitectura Técnica

### Hook usePWA

**Ubicación**: `src/hooks/usePWA.ts`

**Estado exportado**:

```typescript
{
  isInstallable: boolean;          // Prompt disponible
  isIOS: boolean;                  // Dispositivo iOS
  isAndroid: boolean;              // Dispositivo Android
  isSafariIOS: boolean;            // Safari en iOS
  isChromeLike: boolean;           // Chrome/Chromium/Edge
  isStandalone: boolean;           // Ya instalado
  showIOSInstall: boolean;         // Mostrar instrucciones iOS
  promptInstall: () => Promise<void>;  // Función de instalación
  dismiss: () => void;             // Cerrar banner
}
```

**Lógica de `showIOSInstall`**:

```typescript
const showIOSInstall =
  isIOS &&
  isSafariIOS &&
  !isStandalone &&
  !localStorage.getItem("pwa-banner-dismissed");
```

Solo se muestra si:

1. Es dispositivo iOS
2. Es Safari (no Chrome/Firefox en iOS)
3. No está ya instalado
4. No fue cerrado previamente

### PWAProvider

**Ubicación**: `src/app/PWAProvider.tsx`

**Simplificado**:

```typescript
export default function PWAProvider() {
  return <InstallBanner />;
}
```

El banner maneja su propia lógica de visibilidad internamente.

---

## 🚀 Flujo de Instalación

### 1. Android/Chrome/Edge

```
Usuario visita app
  ↓
beforeinstallprompt event capturado
  ↓
Banner aparece con botón "Instalar"
  ↓
Usuario hace clic en "Instalar"
  ↓
Prompt nativo del navegador
  ↓
Usuario acepta
  ↓
App instalada (icono en home screen)
  ↓
Banner desaparece automáticamente
```

### 2. iOS Safari

```
Usuario visita app en Safari iOS
  ↓
Banner aparece con instrucciones
  ↓
Usuario hace clic en "Cómo instalar"
  ↓
Alert con instrucciones detalladas:
  1. Toca botón "Compartir" (📤)
  2. Desplázate y toca "Añadir a pantalla de inicio"
  3. Toca "Añadir"
  ↓
App instalada (icono en home screen)
  ↓
Próxima visita: Banner oculto (standalone mode)
```

### 3. Desktop (Chrome/Edge)

```
Usuario visita app en desktop
  ↓
beforeinstallprompt event capturado
  ↓
Banner aparece (opcional: puede estar en header)
  ↓
Usuario hace clic en "Instalar"
  ↓
Ventana nativa de instalación
  ↓
App instalada como app de escritorio
```

---

## 📊 Métricas y Analytics

### Eventos a Trackear (Futuro)

```typescript
// Cuando se muestra el banner
analytics.track("pwa_banner_shown", {
  platform: isIOS ? "ios" : isAndroid ? "android" : "desktop",
  browser: navigator.userAgent,
  installable: isInstallable,
});

// Cuando el usuario hace clic en "Instalar"
analytics.track("pwa_install_clicked", {
  platform: /* ... */,
});

// Cuando la instalación se completa
analytics.track("pwa_installed", {
  platform: /* ... */,
});

// Cuando el usuario cierra el banner
analytics.track("pwa_banner_dismissed", {
  platform: /* ... */,
});
```

### KPIs Sugeridos

- **Install Rate**: % de usuarios que instalan vs. que ven el banner
- **Dismissal Rate**: % de usuarios que cierran el banner
- **Platform Distribution**: iOS vs Android vs Desktop
- **Return Rate**: % de usuarios que vuelven después de instalar

---

## 🧪 Testing

### Checklist de Pruebas

#### Android (Chrome/Edge)

- [ ] Banner aparece en primera visita
- [ ] Botón "Instalar" funciona
- [ ] Prompt nativo se muestra
- [ ] Banner desaparece después de instalar
- [ ] Banner se puede cerrar con X
- [ ] Banner no reaparece después de cerrar

#### iOS (Safari)

- [ ] Banner aparece en Safari iOS
- [ ] Instrucciones son claras
- [ ] Alert se muestra al hacer clic en "Cómo instalar"
- [ ] Banner desaparece en standalone mode
- [ ] Banner no aparece en Chrome/Firefox iOS (no soportado)

#### Desktop

- [ ] Banner aparece en Chrome/Edge
- [ ] Botón "Instalar" funciona
- [ ] App se instala como app de escritorio
- [ ] Icono aparece en dock/taskbar

### Comandos de Testing

```bash
# 1. Build local
npm run build

# 2. Servir en localhost
npm start

# 3. Abrir en dispositivo móvil (mismo WiFi)
# Usar IP local: http://192.168.x.x:3000

# 4. Testing en iOS: Usar Safari
# Testing en Android: Usar Chrome

# 5. Resetear banner (consola del navegador)
localStorage.removeItem('pwa-banner-dismissed');
location.reload();
```

### Herramientas de Testing

- **Chrome DevTools**: Application > Manifest
- **Lighthouse**: PWA audit
- **iOS Simulator**: Safari en Xcode
- **Android Emulator**: Chrome en Android Studio

---

## 🔧 Configuración del Manifest

**Ubicación**: `public/manifest.json`

**Campos críticos para instalación**:

```json
{
  "name": "GondolApp",
  "short_name": "GondolApp",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#06b6d4",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Campos específicos de iOS** (en `<head>`):

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="GondolApp" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

---

## 🐛 Troubleshooting

### Problema: Banner no aparece en Android

**Causas**:

1. App ya instalada
2. HTTPS no habilitado (requerido)
3. Manifest.json inválido
4. Service Worker no registrado
5. Usuario cerró el banner previamente

**Solución**:

```typescript
// Verificar en consola
console.log("Installable:", isInstallable);
console.log("Dismissed:", localStorage.getItem("pwa-banner-dismissed"));
console.log(
  "Standalone:",
  window.matchMedia("(display-mode: standalone)").matches
);
```

### Problema: Banner no aparece en iOS

**Causas**:

1. No es Safari (Chrome/Firefox no soportan PWA en iOS)
2. App ya instalada
3. Banner fue cerrado

**Solución**:

```typescript
// Verificar en consola
console.log("Is iOS:", /iPad|iPhone|iPod/.test(navigator.userAgent));
console.log("Is Safari:", /Safari/.test(navigator.userAgent));
console.log("Standalone:", (window.navigator as any).standalone);
```

### Problema: Prompt no se dispara

**Causa**: `beforeinstallprompt` solo se dispara una vez

**Solución**:

```typescript
// En DevTools > Application > Clear storage
// O desinstalar la app y limpiar cache
```

---

## 📱 Soporte de Navegadores

| Navegador            | Android    | iOS          | Desktop      |
| -------------------- | ---------- | ------------ | ------------ |
| **Chrome**           | ✅ Full    | ❌ No PWA    | ✅ Full      |
| **Edge**             | ✅ Full    | ❌ No PWA    | ✅ Full      |
| **Safari**           | ❌         | ✅ Parcial\* | ✅ Parcial\* |
| **Firefox**          | ⚠️ Limited | ❌ No PWA    | ⚠️ Limited   |
| **Samsung Internet** | ✅ Full    | -            | -            |

\*Safari soporta PWA pero sin `beforeinstallprompt`. Instalación manual via menú Compartir.

---

## 🔮 Mejoras Futuras

### Corto Plazo

- [ ] **A/B Testing**: Probar diferentes textos y diseños
- [ ] **Animaciones**: Entrada suave del banner (slide-up)
- [ ] **Haptic Feedback**: En iOS al presionar botones
- [ ] **Toast Notification**: Confirmación post-instalación

### Medio Plazo

- [ ] **Smart Timing**: Mostrar banner después de X interacciones
- [ ] **Segmentación**: Diferentes mensajes por tipo de usuario
- [ ] **Analytics Integration**: Google Analytics events
- [ ] **Multi-idioma**: Soporte i18n para instrucciones

### Largo Plazo

- [ ] **Push Notifications**: Promover reinstalación si desinstalan
- [ ] **App Rating**: Solicitar valoración después de N días de uso
- [ ] **Update Banner**: Notificar cuando hay nueva versión
- [ ] **Rich Install Prompt**: Banner personalizado más atractivo

---

## 📚 Referencias

- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [Web.dev: Add to Home Screen](https://web.dev/customize-install/)
- [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Can I Use: beforeinstallprompt](https://caniuse.com/beforeinstallprompt)

---

**Última Actualización**: 20 de noviembre de 2025  
**Versión**: v2.1.1  
**Autor**: @gondolapp-dev
