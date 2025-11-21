# ⚡ Optimizaciones de Middleware - Cache en Memoria

**Fecha**: 20 de noviembre de 2025  
**Versión**: v2.1.1  
**Objetivo**: Reducir latencia del rate limiting de ~30ms a ~5ms

---

## 📊 Problema Detectado

Después de implementar rate limiting con Upstash Redis (v2.1.0):

| Métrica           | Antes Rate Limiting | Después Rate Limiting | Diferencia     |
| ----------------- | ------------------- | --------------------- | -------------- |
| Performance Score | 96/100              | 66/100                | **-30 puntos** |
| TBT               | 160ms               | 586ms                 | **+426ms**     |
| LCP               | 0.67s               | 1.41s                 | **+0.74s**     |

**Causa**: Cada request hace una llamada a Redis (latencia ~20-30ms por request).

---

## 💡 Solución Implementada

### 1. Cache en Memoria (In-Memory Cache)

**Concepto**: Almacenar temporalmente el estado de rate limiting de cada IP para evitar consultas innecesarias a Redis.

**Implementación**:

```typescript
// Cache con TTL de 5 segundos
const CACHE_TTL_MS = 5000;
const ipCache = new Map<string, CacheEntry>();

interface CacheEntry {
  allowed: boolean; // ¿Request permitido?
  remaining: number; // Requests restantes
  reset: number; // Timestamp de reset
  timestamp: number; // Timestamp de entrada en cache
}
```

**Flujo de Decisión**:

```
Request → Check Cache → {
  Cache HIT (< 5s):
    ✅ Usar valores cacheados (latencia: ~1ms)
    ✅ Decrementar remaining de forma optimista
    ✅ Responder sin consultar Redis

  Cache MISS o EXPIRED:
    🔍 Consultar Redis (latencia: ~20-30ms)
    💾 Guardar resultado en cache
    ✅ Responder y actualizar cache
}
```

### 2. Rate Limits Configurables (Environment Variables)

**Objetivo**: Permitir ajustar límites sin modificar código ni hacer redeploy.

**Variables**:

```bash
# .env o Vercel Environment Variables
RATE_LIMIT_API=30        # API general (default: 30/min)
RATE_LIMIT_SEARCH=20     # Búsqueda (default: 20/min)
RATE_LIMIT_CREATE=15     # Creación (default: 15/min)
RATE_LIMIT_AI=10         # IA (default: 10/min)
```

**Implementación**:

```typescript
const RATE_LIMITS = {
  api: parseInt(process.env.RATE_LIMIT_API || "30"),
  search: parseInt(process.env.RATE_LIMIT_SEARCH || "20"),
  create: parseInt(process.env.RATE_LIMIT_CREATE || "15"),
  ai: parseInt(process.env.RATE_LIMIT_AI || "10"),
};
```

**Ventajas**:

- ✅ Ajuste dinámico de límites (sin redeploy)
- ✅ A/B testing (diferentes límites por entorno)
- ✅ Escalabilidad (aumentar límites bajo demanda)

### 3. Limpieza Periódica de Cache

**Problema**: Cache podría crecer indefinidamente en memoria.

**Solución**: Garbage collector cada 60 segundos.

```typescript
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        ipCache.delete(key); // Eliminar entradas expiradas
      }
    }
  }, 60000);
}
```

---

## 📈 Impacto Esperado

### Reducción de Latencia

**Escenario Típico** (usuarios recurrentes):

| Métrica                 | Sin Cache | Con Cache | Mejora   |
| ----------------------- | --------- | --------- | -------- |
| **Latencia middleware** | ~25ms     | ~2ms      | **-92%** |
| **Llamadas a Redis**    | 100%      | ~20%      | **-80%** |
| **Cache hit ratio**     | 0%        | ~80%      | **+80%** |

**Proyección de Performance Score**:

- Actual: 66/100
- Esperado: **80-85/100** (+14-19 puntos)

### Cálculo de Cache Hit Ratio

**Asumiendo**:

- Usuario típico hace 5 requests en < 5 segundos
- TTL de cache = 5 segundos

**Cache hits**:

```
Primera request → Cache MISS → Redis (25ms)
Siguientes 4 requests → Cache HIT → In-Memory (2ms)

Hit ratio = 4/5 = 80%
Latencia promedio = (1 × 25ms + 4 × 2ms) / 5 = 6.6ms

Reducción = (25ms - 6.6ms) / 25ms = 73.6% menos latencia
```

---

## 🔧 Configuración en Vercel

### Variables de Entorno Requeridas

**Upstash Redis** (obligatorio):

```bash
UPSTASH_REDIS_REST_URL=https://us1-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYkgASQxxx...
```

**Rate Limits** (opcional - tiene defaults):

```bash
RATE_LIMIT_API=30
RATE_LIMIT_SEARCH=20
RATE_LIMIT_CREATE=15
RATE_LIMIT_AI=10
```

### Configuración en Vercel Dashboard

```bash
# Project Settings > Environment Variables

# Production
RATE_LIMIT_API=50        # Más permisivo en producción
RATE_LIMIT_SEARCH=30
RATE_LIMIT_CREATE=20
RATE_LIMIT_AI=15

# Preview (PR deployments)
RATE_LIMIT_API=30        # Límites estándar
RATE_LIMIT_SEARCH=20
RATE_LIMIT_CREATE=15
RATE_LIMIT_AI=10

# Development
# (usa defaults desde código)
```

---

## 🧪 Testing

### Test de Cache (Local)

```bash
# 1. Levantar dev server
npm run dev

# 2. Hacer 10 requests rápidos (< 5s)
for i in {1..10}; do
  curl http://localhost:3000/api/productos/buscar?q=test
  sleep 0.3
done

# Logs esperados:
# 🔍 [REDIS] Consultando rate limit para xxx.xxx.xxx.xxx (Búsqueda)
# 💨 [CACHE HIT] xxx.xxx.xxx.xxx - 19 requests restantes (Búsqueda)
# 💨 [CACHE HIT] xxx.xxx.xxx.xxx - 18 requests restantes (Búsqueda)
# ...
```

### Test de Limits Configurables

```bash
# 1. Configurar límite bajo (testing)
export RATE_LIMIT_SEARCH=3

# 2. Build y start
npm run build && npm run start

# 3. Hacer 5 requests
for i in {1..5}; do
  echo "Request $i:"
  curl -w "\nHTTP %{http_code}\n" http://localhost:3000/api/productos/buscar?q=test
  sleep 1
done

# Esperado:
# Request 1: HTTP 200
# Request 2: HTTP 200
# Request 3: HTTP 200
# Request 4: HTTP 429 (Rate limit exceeded)
# Request 5: HTTP 429
```

### Test en Producción

```bash
# Script de stress test
./scripts/test-security.sh https://gondolapp.digital

# Output esperado con cache:
# [3/4] Probando Rate Limiting...
# ●●●●●●●●●● (20 success)
# ●●●●●●●●●● (cache hits - rápidos)
# ●●●●● (5 rate limited)
#
# Tiempo total: ~8-10 segundos (vs 15-20 segundos sin cache)
```

---

## 📊 Métricas de Éxito

### KPIs a Monitorear

**Upstash Dashboard** ([console.upstash.com](https://console.upstash.com)):

1. **Comandos/día**:

   - Sin cache: ~14,000 comandos/día
   - Con cache: ~3,000 comandos/día (reducción de 78%)

2. **Latencia p95**:

   - Sin cache: ~25-30ms
   - Con cache: ~5-8ms (mejora de 70-80%)

3. **Costo**:
   - Free tier: 10,000 comandos/día
   - Con cache: Dentro del límite (30% de uso)

**Vercel Analytics**:

1. **Edge Function Duration**:

   - Sin cache: ~30-40ms promedio
   - Con cache: ~8-12ms promedio (reducción de 70%)

2. **Error Rate**:
   - Debe mantenerse < 0.1%
   - Cache no debe introducir errores

---

## 🐛 Troubleshooting

### Cache No Funciona (Logs muestran solo REDIS)

**Problema**: Siempre consulta Redis, nunca usa cache.

**Causa posible**:

1. `setInterval` no disponible en Edge Runtime
2. TTL muy corto (< tiempo entre requests)

**Solución**:

```typescript
// Verificar que setInterval existe
console.log("setInterval available:", typeof setInterval !== "undefined");

// Aumentar TTL si usuarios hacen requests muy espaciados
const CACHE_TTL_MS = 10000; // 10 segundos en vez de 5
```

### Memory Leak (Cache crece sin límite)

**Síntoma**: Uso de memoria aumenta con el tiempo.

**Causa**: Garbage collector no se ejecuta.

**Solución**:

```typescript
// Limitar tamaño máximo de cache
const MAX_CACHE_SIZE = 10000;

if (ipCache.size > MAX_CACHE_SIZE) {
  // Eliminar entradas más antiguas
  const entries = Array.from(ipCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  // Eliminar 20% más antiguas
  const toDelete = Math.floor(MAX_CACHE_SIZE * 0.2);
  for (let i = 0; i < toDelete; i++) {
    ipCache.delete(entries[i][0]);
  }
}
```

### Cache Demasiado Agresivo (Rate Limit No Funciona)

**Síntoma**: Usuarios pueden hacer más requests que el límite.

**Causa**: TTL muy largo o decrementación optimista incorrecta.

**Solución**:

```typescript
// Reducir TTL
const CACHE_TTL_MS = 2000; // 2 segundos (más estricto)

// O eliminar cache cuando remaining = 0
if (cachedEntry.remaining <= 0) {
  ipCache.delete(cacheKey); // Forzar consulta a Redis
}
```

---

## 🔮 Mejoras Futuras

### Corto Plazo (1-2 semanas)

1. **Cache Distribuido** (Vercel KV)

   - Compartir cache entre Edge Functions
   - Mejor consistencia en múltiples regiones

2. **Metrics Dashboard**

   - Visualizar cache hit ratio en tiempo real
   - Alertas si hit ratio < 60%

3. **A/B Testing**
   - Comparar performance con/sin cache
   - Diferentes TTL (2s vs 5s vs 10s)

### Medio Plazo (1 mes)

4. **Smart Cache Invalidation**

   - Invalidar cache proactivamente cuando usuario cercano al límite
   - Priorizar precisión sobre performance al acercarse al límite

5. **Regional Cache**

   - Cache separado por región (us-east, eu-west, ap-northeast)
   - Reducir latencia global

6. **Cache Warming**
   - Pre-cachear IPs conocidas al inicio
   - Reducir cold starts

---

## 📚 Referencias

- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/features/ratelimiting)
- [Vercel Edge Middleware](https://vercel.com/docs/functions/edge-middleware)
- [Vercel KV (Redis)](https://vercel.com/docs/storage/vercel-kv)
- [Cache Invalidation Patterns](https://csswizardry.com/2019/03/cache-control-for-civilians/)

---

**Última Actualización**: 20 de noviembre de 2025  
**Versión**: v2.1.1  
**Autor**: @gondolapp-dev
