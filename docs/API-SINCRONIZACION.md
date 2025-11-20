# 🔄 API de Sincronización - Documentación

## Endpoints Disponibles

### **GET /api/sync** - Obtener Datos con Filtros

#### Query Parameters:

| Parámetro | Tipo     | Default | Descripción                                                     |
| --------- | -------- | ------- | --------------------------------------------------------------- |
| `tipo`    | string   | "all"   | Tipo de datos: "productos", "reposicion", "vencimientos", "all" |
| `desde`   | ISO Date | -       | Filtrar desde esta fecha                                        |
| `hasta`   | ISO Date | -       | Filtrar hasta esta fecha                                        |
| `page`    | number   | 1       | Número de página                                                |
| `limit`   | number   | 100     | Items por página (max: 500)                                     |
| `estado`  | string   | -       | "pendiente" o "repuesto" (solo para reposición)                 |

#### Ejemplos de Uso:

```bash
# Obtener todos los datos (paginados)
GET /api/sync

# Solo productos de los últimos 7 días
GET /api/sync?tipo=productos&desde=2025-11-13T00:00:00Z

# Items de reposición pendientes (página 2)
GET /api/sync?tipo=reposicion&estado=pendiente&page=2

# Vencimientos críticos de último mes con límite de 50
GET /api/sync?tipo=vencimientos&desde=2025-10-20T00:00:00Z&limit=50
```

#### Respuesta Exitosa:

```json
{
  "success": true,
  "data": {
    "productosBase": [...],
    "variantes": [...],
    "reposicion": [...],
    "vencimientos": [...]
  },
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": {
      "productosBase": 245,
      "variantes": 512,
      "reposicion": 34,
      "vencimientos": 18
    },
    "hasMore": true
  },
  "timestamp": "2025-11-20T10:30:00.000Z"
}
```

---

### **POST /api/sync** - Sincronizar con Upsert

Actualiza registros existentes o inserta nuevos según claves únicas.

#### Claves de Upsert:

- **ProductoBase**: `nombre` + `marca`
- **Variante**: `ean` (único)
- **Reposición**: `varianteId` + `repuesto=false`
- **Vencimiento**: `varianteId` + `fechaVencimiento`

#### Body Example:

```json
{
  "productosBase": [
    {
      "nombre": "Coca-Cola",
      "marca": "Coca-Cola Company",
      "categoria": "Refrescos",
      "createdAt": "2025-11-20T00:00:00Z"
    }
  ],
  "variantes": [
    {
      "ean": "7894900011517",
      "nombreCompleto": "Coca-Cola 2L",
      "productoBaseId": "673d...",
      "tamano": "2L",
      "createdAt": "2025-11-20T00:00:00Z"
    }
  ],
  "reposicion": [
    {
      "varianteId": "abc123",
      "cantidad": 10,
      "repuesto": false,
      "agregadoAt": "2025-11-20T08:00:00Z"
    }
  ],
  "vencimientos": [
    {
      "varianteId": "abc123",
      "fechaVencimiento": "2025-12-31",
      "alertaNivel": "normal",
      "agregadoAt": "2025-11-20T08:00:00Z"
    }
  ]
}
```

#### Respuesta Exitosa:

```json
{
  "success": true,
  "message": "Sincronización completada",
  "results": {
    "inserted": {
      "productosBase": 5,
      "variantes": 12,
      "reposicion": 3,
      "vencimientos": 2
    },
    "updated": {
      "productosBase": 2,
      "variantes": 8,
      "reposicion": 1,
      "vencimientos": 0
    },
    "errors": []
  }
}
```

---

## 🎨 Panel de Administración

### Acceso:

```
https://tu-app.com/admin → "Sincronización en la Nube"
```

### Funcionalidades:

#### 1. **Estadísticas en Tiempo Real**

- 📦 Total de productos base
- 🏷️ Total de variantes
- 📋 Items en reposición
- ⏰ Items con fecha de vencimiento

#### 2. **Filtros Temporales**

- Últimos 7 días
- Últimos 30 días
- Últimos 90 días
- Último año
- Todo

#### 3. **Subir a la Nube** ⬆️

- Guarda datos locales (IndexedDB) en MongoDB
- Usa lógica de upsert (no duplica)
- Muestra resumen: insertados/actualizados/errores

#### 4. **Descargar de la Nube** ⬇️

- Descarga datos desde MongoDB
- Opción de reemplazar datos locales
- Confirma antes de sobrescribir

---

## 🚀 Casos de Uso

### 1. Sincronizar entre Celular y Tablet

**En el Celular (Dispositivo A):**

```javascript
// 1. Subir datos locales
fetch("/api/sync", {
  method: "POST",
  body: JSON.stringify({
    /* datos */
  }),
});
```

**En la Tablet (Dispositivo B):**

```javascript
// 2. Descargar datos actualizados
const datos = await fetch("/api/sync?tipo=all");
// 3. Guardar en IndexedDB local
```

### 2. Backup Diario Automático

```javascript
// En tu PWA service worker o script
setInterval(async () => {
  const backup = await fetch("/api/sync");
  const data = await backup.json();

  // Guardar en localStorage como respaldo
  localStorage.setItem(
    "backup_" + new Date().toISOString(),
    JSON.stringify(data.data)
  );
}, 24 * 60 * 60 * 1000); // Cada 24 horas
```

### 3. Consulta Selectiva de Productos Recientes

```javascript
// Solo productos agregados hoy
const hoy = new Date().toISOString().split("T")[0];
const response = await fetch(`/api/sync?tipo=productos&desde=${hoy}T00:00:00Z`);
const { data } = await response.json();

console.log(`Productos nuevos hoy: ${data.productosBase.length}`);
```

---

## ⚠️ Consideraciones

### Performance:

- Usa `limit` para controlar el tamaño de respuesta
- Filtra por `tipo` para obtener solo lo necesario
- La paginación evita timeouts en bases grandes

### Seguridad:

- ⚠️ **TODO**: Agregar autenticación (actualmente pública)
- Considera usar API Keys o JWT tokens
- Valida datos antes de hacer upsert

### Offline:

- La app funciona 100% offline con IndexedDB
- Sincroniza cuando haya conexión disponible
- Los datos locales siempre tienen prioridad

---

## 📊 Monitoreo

### Ver logs de sincronización:

```bash
# En terminal del servidor
npm run dev

# Buscar en consola:
# ✅ Sincronización completada
# ❌ Error en sync POST: ...
```

### Verificar datos en MongoDB Atlas:

1. Ir a https://cloud.mongodb.com
2. Browse Collections → `gondolapp_db`
3. Ver colecciones:
   - `productos_base`
   - `productos_variantes`
   - `items_reposicion`
   - `items_vencimiento`

---

## 🛠️ Troubleshooting

### Error: "mongodb_unavailable"

**Solución**: Verifica conexión en `.env.local`:

```env
MONGODB_URI=mongodb+srv://...
```

### Error: Duplicación de registros

**Causa**: No se cumple la clave de upsert (ej: EAN diferente)
**Solución**: Valida que los EAN sean consistentes

### Sincronización lenta

**Solución**:

- Usa filtro `desde` para reducir datos
- Baja el `limit` a 50-100 items
- Considera paginación

---

## 📝 TODO (Mejoras Futuras)

- [ ] Autenticación con JWT
- [ ] Sincronización automática en segundo plano
- [ ] Resolución de conflictos (merge estratégico)
- [ ] Compresión de datos grandes
- [ ] Sincronización incremental (solo cambios)
- [ ] Webhooks para notificar cambios
