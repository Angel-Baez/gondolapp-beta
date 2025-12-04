# PWA/Retail Template Context

> Project template for Progressive Web Apps focused on retail, inventory management, and offline-first functionality.
> This template is ideal for apps like point-of-sale systems, inventory trackers, and field service applications.

## Template Overview

**Type**: PWA/Retail
**Example Projects**: Inventory management, POS systems, field inspection apps
**Key Characteristics**: Offline-first, mobile-first, barcode/QR scanning, real-time sync

## Target Users

**Primary**: Retail/warehouse staff working in field conditions
- Frequently wearing gloves
- Need quick one-handed operations
- Variable lighting conditions
- Unstable or no network connectivity
- Mid-range mobile devices

**Secondary**: Managers and supervisors
- Dashboard views
- Reporting and analytics
- Configuration

## Technology Stack Specifics

### Required Technologies

| Technology | Purpose | Configuration |
|------------|---------|---------------|
| **Dexie.js** | IndexedDB wrapper | Primary local storage |
| **html5-qrcode** | Barcode scanning | Camera integration |
| **Service Worker** | Offline support | Custom caching strategy |
| **Web App Manifest** | PWA installation | Full standalone mode |
| **Framer Motion** | Animations | Optimized for mobile |

### Recommended Additions

| Technology | Purpose | When to Add |
|------------|---------|-------------|
| **Background Sync API** | Deferred sync | Unreliable networks |
| **Push Notifications** | Alerts | Expiry warnings, restocks |
| **Web Share API** | Sharing | Export/sharing features |
| **Geolocation API** | Location tracking | Multi-location inventory |

## Data Architecture

### Offline-First Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              IndexedDB (Dexie.js)                    │    │
│  │  • Products (cached from server)                     │    │
│  │  • Inventory items (local modifications)             │    │
│  │  • Pending sync queue                                │    │
│  │  • User preferences                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │ Sync when online                  │
│                          ▼                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVER (API)                              │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │    MongoDB      │  │         Redis                   │   │
│  │  • Products     │  │  • Rate limiting                │   │
│  │  • Inventory    │  │  • Session cache                │   │
│  │  • Users        │  │  • Real-time sync state         │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Typical Data Models

```typescript
// Product (cached from server)
interface Product {
  id: string;
  barcode: string;           // EAN-13/UPC
  name: string;
  brand?: string;
  category?: string;
  image?: string;
  syncedAt: Date;
}

// Inventory Item (local with sync)
interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  location?: string;
  expiryDate?: Date;
  alertLevel?: 'normal' | 'warning' | 'critical';
  modifiedAt: Date;
  syncedAt?: Date;           // null = pending sync
}

// Sync Queue
interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data: unknown;
  timestamp: Date;
  retries: number;
}
```

### IndexedDB Schema (Dexie)

```typescript
this.version(1).stores({
  products: 'id, barcode, name, category, syncedAt',
  inventoryItems: 'id, productId, location, expiryDate, [location+expiryDate]',
  syncQueue: 'id, operation, table, timestamp'
});
```

## UI/UX Requirements

### Mobile-First Constraints

| Aspect | Requirement | Reason |
|--------|-------------|--------|
| Touch Targets | ≥ 48x48px | Glove-friendly |
| Font Size | ≥ 16px body, ≥ 24px headings | Quick reading |
| Contrast | WCAG AAA (7:1) | Variable lighting |
| One-Handed | All primary actions | Device held in one hand |
| Landscape | Not required | Portrait primary |

### Core UI Patterns

```
┌─────────────────────────────────┐
│  [Logo]  Status: 🟢 Online     │  ← Persistent header with sync status
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐  │
│   │     Main Content        │  │  ← Scrollable content area
│   │                         │  │
│   │     • List/Cards        │  │
│   │     • Details           │  │
│   │                         │  │
│   └─────────────────────────┘  │
│                                 │
├─────────────────────────────────┤
│  [Tab1] [Tab2] [+Scan] [Tab4]  │  ← Bottom navigation with FAB
└─────────────────────────────────┘
```

### Color System

```typescript
const colors = {
  // Primary actions
  primary: 'cyan-500',       // Main CTA
  secondary: 'gray-500',     // Secondary actions
  
  // Alert levels
  critical: 'red-500',       // Expires soon
  warning: 'yellow-500',     // Attention needed
  caution: 'orange-500',     // Monitor
  normal: 'gray-400',        // OK
  
  // Feedback
  success: 'green-500',
  error: 'red-500',
  info: 'blue-500',
  
  // Background
  background: 'gray-50',
  card: 'white',
  overlay: 'black/50'
};
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Lighthouse Performance | ≥ 96 | Must be excellent for PWA |
| First Contentful Paint | < 1.5s | App shell should be instant |
| Time to Interactive | < 2.5s | Critical for productivity |
| Offline Load | < 500ms | From Service Worker |
| Scan to Add | < 3s | Key workflow metric |

## Key Features

### Barcode Scanning

```typescript
// Scanner configuration for retail environment
const scannerConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  supportedFormats: [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128
  ]
};
```

### Expiry Tracking

```typescript
// Alert level calculation
function calculateAlertLevel(expiryDate: Date): AlertLevel {
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry <= 15) return 'critical';
  if (daysUntilExpiry <= 30) return 'warning';
  if (daysUntilExpiry <= 60) return 'caution';
  return 'normal';
}
```

### Offline Sync

```typescript
// Sync strategy
class SyncService {
  private isOnline = navigator.onLine;
  
  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  
  private async handleOnline() {
    this.isOnline = true;
    await this.processQueue();
  }
  
  private handleOffline() {
    this.isOnline = false;
  }
  
  async queueOperation(operation: SyncOperation) {
    await db.syncQueue.add(operation);
    if (this.isOnline) {
      this.processQueue();
    }
  }
}
```

## Service Worker Strategy

```javascript
// Cache strategies by request type
const strategies = {
  // App shell: Cache first, update in background
  static: 'CacheFirst',
  
  // API data: Network first, fall back to cache
  api: 'NetworkFirst',
  
  // Product images: Cache first with long expiry
  images: 'CacheFirst',
  
  // External API (e.g., Open Food Facts): Stale while revalidate
  external: 'StaleWhileRevalidate'
};
```

## Quality Checklist

### Before Release

- [ ] Works completely offline after first load
- [ ] All data persists in IndexedDB
- [ ] Sync queue processes when online
- [ ] Scanner works on iOS Safari and Android Chrome
- [ ] Install prompt appears correctly
- [ ] Touch targets are ≥ 48px
- [ ] Contrast meets WCAG AAA
- [ ] Lighthouse PWA audit passes
- [ ] Performance score ≥ 96

### Accessibility

- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] High contrast mode supported
- [ ] Motion can be reduced
- [ ] Error messages are clear

---

> **Note**: This template prioritizes offline functionality and speed over visual complexity. All aesthetic choices should support quick, reliable operation in challenging retail environments.
