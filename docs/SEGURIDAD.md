# 🛡️ Guía de Seguridad - GondolApp

## Índice

1. [Rate Limiting](#rate-limiting)
2. [Security Headers](#security-headers)
3. [Content Security Policy](#content-security-policy)
4. [MongoDB Security](#mongodb-security)
5. [API Keys y Secretos](#api-keys-y-secretos)
6. [Testing de Seguridad](#testing-de-seguridad)
7. [Monitoreo](#monitoreo)

---

## Rate Limiting

### 🚀 Implementación

**Ubicación**: `src/middleware.ts`

**Proveedor**: [Upstash Redis](https://upstash.com) - Edge-compatible

### Límites por Endpoint

| Endpoint                      | Límite | Ventana  | Propósito                              |
| ----------------------------- | ------ | -------- | -------------------------------------- |
| `/api/*` (general)            | 30 req | 1 minuto | Protección general de API              |
| `/api/productos/buscar`       | 20 req | 1 minuto | Búsqueda intensiva con Open Food Facts |
| `/api/productos/crear-manual` | 15 req | 1 minuto | Prevenir creación masiva               |
| IA/Normalización              | 10 req | 1 minuto | Proteger Gemini AI (costoso)           |

### Algoritmo

**Sliding Window**: Cuenta requests en ventana deslizante, más preciso que fixed window.

```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true, // Habilita métricas en Upstash
});
```

### Headers RFC 6585

Cada respuesta incluye headers estándar:

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1704067200
```

### Respuesta 429 (Too Many Requests)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please wait 45 seconds before trying again.",
  "retryAfter": 45
}
```

**Status Code**: `429` + `Retry-After` header

### Configuración Upstash

#### 1. Crear Base de Datos

```bash
# 1. Ir a https://console.upstash.com
# 2. Create Database
# 3. Name: gondolapp-rate-limit
# 4. Region: us-east-1 (mismo que Vercel)
# 5. Type: Regional (más barato, suficiente)
```

#### 2. Variables de Entorno (Vercel)

```bash
UPSTASH_REDIS_REST_URL=https://us1-charming-fox-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYkgASQ...token-largo...xyz
```

**Ubicación en Vercel**:

- Project Settings > Environment Variables
- Aplica a: Production, Preview, Development

#### 3. Plan Gratuito (Free Tier)

```
✅ 10,000 comandos/día
✅ 256 MB almacenamiento
✅ TLS encryption
✅ REST API
```

**Estimación de uso**:

- 30 req/min _ 60 min _ 8 hrs laborables = 14,400 req/día
- Con 4 limiters = ~4,000 comandos Redis/día
- **Margen cómodo: 60% del límite gratuito**

---

## Security Headers

### 🔐 Headers Aplicados

**Ubicación**: `src/middleware.ts` → `addSecurityHeaders()`

### Content-Security-Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
connect-src 'self' https://generativelanguage.googleapis.com https://*.mongodb.net;
frame-ancestors 'none';
```

**Cambios respecto a versión anterior:**
- ❌ Removido: `https://images.openfoodfacts.org`
- ✅ Mantenido: Gemini AI y MongoDB Atlas

#### Directivas Explicadas

| Directiva                    | Valor              | Razón                               |
| ---------------------------- | ------------------ | ----------------------------------- |
| `default-src 'self'`         | Solo mismo origen  | Base restrictiva                    |
| `script-src 'unsafe-eval'`   | Permite eval()     | **Next.js code splitting requiere** |
| `script-src 'unsafe-inline'` | Permite inline JS  | **Next.js hydration requiere**      |
| `style-src 'unsafe-inline'`  | Permite inline CSS | **Tailwind CSS requiere**           |
| `img-src https: data: blob:` | Imágenes externas  | Cámara y assets                     |
| `connect-src`                | APIs específicas   | Gemini AI + MongoDB Atlas           |
| `frame-ancestors 'none'`     | Sin iframes        | Previene clickjacking               |

#### ⚠️ Riesgos de `unsafe-eval` y `unsafe-inline`

**Estado Actual**: Necesarios para Next.js + Tailwind

**Mejoras Futuras**:

```typescript
// TODO: Implementar nonces para CSP estricto
const nonce = generateNonce();

// En layout.tsx
<script nonce={nonce}>...</script>

// En CSP
script-src 'self' 'nonce-${nonce}';
```

### X-Frame-Options

```
X-Frame-Options: DENY
```

**Protección**: Previene que tu app sea embebida en `<iframe>` (clickjacking).

### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

**Protección**: Previene MIME sniffing (navegadores respetan Content-Type declarado).

### X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```

**Protección**: Habilita filtro XSS en navegadores legacy (IE, Edge antiguo).

### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

**Comportamiento**:

- Mismo origen → URL completa
- Cross-origin HTTPS → Solo origen
- Downgrade HTTPS→HTTP → Sin referrer

### Permissions-Policy

```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Restricciones**:

- ❌ Camera deshabilitada (app usa MediaDevices API directamente)
- ❌ Microphone deshabilitado
- ❌ Geolocation deshabilitado

**Nota**: `camera=()` vacío = sin permisos. Modificar si app web necesita cámara:

```typescript
// Para habilitar cámara en mismo origen:
headers.set("Permissions-Policy", "camera=(self)");
```

---

## Content Security Policy

### 🛠️ Testing CSP

#### 1. Verificar Headers

```bash
curl -I https://gondolapp.digital | grep -i "content-security"
```

**Esperado**:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...
```

#### 2. Browser Console

Abre DevTools > Console. Errores de CSP se ven así:

```
Refused to load script from 'https://evil.com/script.js'
because it violates the following CSP directive: "script-src 'self'".
```

#### 3. CSP Evaluator

Usa [CSP Evaluator de Google](https://csp-evaluator.withgoogle.com/):

1. Pega tu CSP
2. Verifica warnings

**Warnings esperados**:

```
⚠️ 'unsafe-inline' allows inline scripts (required by Next.js)
⚠️ 'unsafe-eval' allows eval() (required by Next.js)
```

### 📊 CSP Reporting (Opcional)

#### Modo Report-Only

Para testing sin bloquear:

```typescript
headers.set("Content-Security-Policy-Report-Only", cspDirective);
```

#### Endpoint de Reportes

```typescript
// CSP con report-uri
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  report-uri /api/csp-report;
`;

// src/app/api/csp-report/route.ts
export async function POST(req: Request) {
  const report = await req.json();
  console.error("CSP Violation:", report);
  // Enviar a servicio de logging (Sentry, LogRocket, etc.)
  return new Response("OK", { status: 200 });
}
```

---

## MongoDB Security

### 🗄️ Mejores Prácticas

#### 1. Network Access

**Opción A: IP Whitelist (Recomendado para desarrollo)**

```
# MongoDB Atlas > Network Access > Add IP Address
0.0.0.0/0  # Permite todas las IPs (Vercel usa IPs dinámicas)
```

**Opción B: Vercel Integration (Recomendado para producción)**

```bash
vercel integration add mongodb-atlas
```

**Ventajas**:

- ✅ IPs automáticas de Vercel
- ✅ Sin configuración manual
- ✅ Más seguro que 0.0.0.0/0

#### 2. Database User

```javascript
// Crea usuario con permisos mínimos
Username: gondolapp-api
Password: <genera contraseña fuerte de 32 caracteres>
Database User Privileges: readWrite en `gondolapp` database
```

**❌ NO uses rol `Atlas Admin`** (exceso de permisos).

#### 3. Connection String

```bash
# Formato seguro
MONGODB_URI=mongodb+srv://gondolapp-api:<password>@cluster.mongodb.net/gondolapp?retryWrites=true&w=majority

# ✅ Incluye:
# - SRV (service discovery automático)
# - retryWrites=true (reintentos automáticos)
# - w=majority (write concern seguro)
```

#### 4. Cifrado en Tránsito

MongoDB Atlas usa **TLS 1.2+** por defecto. Verifica:

```bash
# En connection string, debe tener:
&tls=true&tlsAllowInvalidCertificates=false
```

---

## API Keys y Secretos

### 🔑 Gestión de Secretos

#### Variables de Entorno

**Nunca comitear secretos**. Usa `.env.local`:

```bash
# .env.local (git-ignored)
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=AIzaSyC...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AYkgASQ...
```

#### Rotación de Claves

**Gemini AI API Key**:

```bash
# Cada 90 días, genera nueva key:
# 1. https://aistudio.google.com/app/apikey
# 2. Create API Key
# 3. Actualiza GEMINI_API_KEY en Vercel
# 4. Revoca key antigua
```

**MongoDB Password**:

```bash
# Cada 180 días:
# 1. MongoDB Atlas > Database Access > Edit User
# 2. Edit Password > Generate Password
# 3. Actualiza MONGODB_URI en Vercel
```

#### Vercel Environment Variables

**Scope por entorno**:

```bash
# Production (gondolapp.digital)
GEMINI_API_KEY=AIzaSyC_PROD_KEY

# Preview (PR deployments)
GEMINI_API_KEY=AIzaSyC_STAGING_KEY

# Development (vercel dev)
GEMINI_API_KEY=AIzaSyC_DEV_KEY
```

### 🚫 Prevención de Leaks

#### Git Hooks (Pre-commit)

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Detecta API keys en staging
git diff --cached --name-only | xargs grep -E "(AIzaSy|mongodb\+srv://|AYkgASQ)" && {
  echo "⚠️  API key detectada en commit!"
  exit 1
}
```

#### Scanners

```bash
# Instala gitleaks
brew install gitleaks

# Escanea historial
gitleaks detect --source . --verbose
```

---

## Testing de Seguridad

### 🧪 Tests Automatizados

#### 1. Rate Limiting Test

```bash
# Script de bombardeo
for i in {1..35}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://gondolapp.digital/api/productos/buscar?q=coca
  sleep 1
done

# Esperado:
# 200 (x30)
# 429 (x5) ← Rate limit activado
```

#### 2. Security Headers Test

```bash
# Verifica headers con SecurityHeaders.com
curl -I https://gondolapp.digital | \
  grep -E "(X-Frame-Options|X-Content-Type|Content-Security-Policy)"

# Esperado:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Content-Security-Policy: default-src 'self'; ...
```

#### 3. Lighthouse Security Audit

```bash
npx lighthouse https://gondolapp.digital \
  --only-categories=best-practices \
  --view

# Verifica:
# ✅ HTTPS (score 100)
# ✅ Mixed content (score 100)
# ✅ Security headers (warnings mínimos)
```

### 🔍 Penetration Testing

#### OWASP ZAP (Automated Scan)

```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://gondolapp.digital \
  -r owasp-report.html

# Análisis:
# - XSS vulnerabilities
# - SQL injection (N/A, usamos MongoDB)
# - CSRF tokens
# - Clickjacking protection
```

#### Manual Testing Checklist

- [ ] **XSS**: Inyectar `<script>alert('XSS')</script>` en inputs
- [ ] **CSRF**: Crear formulario malicioso externo
- [ ] **Clickjacking**: Embeber app en iframe
- [ ] **Rate Limit Bypass**: Cambiar IP/User-Agent
- [ ] **API Fuzzing**: Enviar payloads inválidos

---

## Monitoreo

### 📊 Métricas de Seguridad

#### 1. Upstash Analytics

Dashboard: [console.upstash.com](https://console.upstash.com)

**Métricas clave**:

- Requests/minuto por endpoint
- Rate limit hits (429 responses)
- Latencia p95 de Redis
- IPs bloqueadas frecuentemente

#### 2. Vercel Analytics

Dashboard: [vercel.com/analytics](https://vercel.com)

**Seguridad**:

- Picos de 429 responses
- Anomalías en tráfico por geo
- Edge function errors

#### 3. MongoDB Atlas Monitoring

Dashboard: [MongoDB Atlas > Metrics](https://cloud.mongodb.com)

**Alertas sugeridas**:

- Connections > 100 (posible ataque)
- Slow queries > 1000ms
- Failed authentication attempts

### 🚨 Alertas (Opcional)

#### Upstash Webhook

```typescript
// src/middleware.ts - Agregar logging
if (!success) {
  // Envía alerta si mismo IP excede límite 10x en 1 hora
  await fetch("https://hooks.slack.com/...", {
    method: "POST",
    body: JSON.stringify({
      text: `⚠️ Rate limit abuse: IP ${ip} blocked (${limit} req/min)`,
    }),
  });
}
```

#### Vercel Log Drains

```bash
# Envía logs a servicio externo (Datadog, Logtail, etc.)
vercel integration add datadog
```

---

## Mejoras Futuras

### 🔮 Roadmap de Seguridad

#### Corto Plazo (1-3 meses)

- [ ] **WAF (Web Application Firewall)**: Cloudflare o Vercel Edge Config
- [ ] **CAPTCHA**: Agregar hCaptcha en formularios sensibles
- [ ] **Audit Logs**: Registrar acciones críticas (crear/editar productos)

#### Medio Plazo (3-6 meses)

- [ ] **CSP Nonces**: Eliminar `unsafe-inline` de CSP
- [ ] **Subresource Integrity (SRI)**: Hashes para scripts externos
- [ ] **2FA**: Autenticación de dos factores para admin

#### Largo Plazo (6-12 meses)

- [ ] **Bug Bounty Program**: HackerOne o Bugcrowd
- [ ] **SOC 2 Compliance**: Si app escala a empresas
- [ ] **Penetration Test Profesional**: Contratar firma de seguridad

---

## Recursos

### 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Mozilla Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Vercel Edge Middleware](https://vercel.com/docs/functions/edge-middleware)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

### 🛠️ Herramientas

- [SecurityHeaders.com](https://securityheaders.com) - Test de headers
- [SSL Labs](https://www.ssllabs.com/ssltest/) - Test de TLS/SSL
- [OWASP ZAP](https://www.zaproxy.org/) - Vulnerability scanner
- [Gitleaks](https://github.com/gitleaks/gitleaks) - Secret scanner

---

**Última Actualización**: 2024-12-20  
**Versión**: 1.0.0  
**Autor**: @gondolapp-dev
