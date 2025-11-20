# 🔧 Troubleshooting - GondolApp MongoDB

## Error 500 en `/api/productos/crear-manual`

### Síntomas

```
POST http://localhost:3000/api/productos/crear-manual 500 (Internal Server Error)
```

### Causas Comunes y Soluciones

#### 1. ❌ MONGODB_URI no configurado

**Error en consola del servidor**:

```
❌ MONGODB_URI no está configurado en las variables de entorno.
```

**Solución**:

```bash
# 1. Verifica que existe .env.local
ls -la .env.local

# 2. Si no existe, créalo desde el ejemplo
cp .env.example .env.local

# 3. Edita y agrega tu connection string
nano .env.local

# Agrega esta línea:
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/gondolapp

# 4. REINICIA el servidor
# Ctrl+C en la terminal donde corre npm run dev
npm run dev
```

**Nota**: Next.js solo carga `.env.local` al iniciar el servidor.

---

#### 2. ❌ Connection String Inválido

**Error en consola del servidor**:

```
MongoServerError: bad auth : authentication failed
```

**Solución**:

1. Ve a MongoDB Atlas → Database Access
2. Verifica que el usuario existe
3. Resetea la password si es necesario
4. Actualiza `MONGODB_URI` en `.env.local`
5. Reinicia el servidor

---

#### 3. ❌ IP no permitida

**Error en consola del servidor**:

```
MongoNetworkError: connection timed out
```

**Solución**:

1. Ve a MongoDB Atlas → Network Access
2. Click en "Add IP Address"
3. Selecciona "Allow Access from Anywhere" (0.0.0.0/0)
   - O agrega tu IP específica
4. Guarda y espera 1-2 minutos
5. Intenta de nuevo

---

#### 4. ❌ Base de datos no seleccionada

**Error en consola del servidor**:

```
Error: database name cannot be empty
```

**Solución**:
Verifica que tu `MONGODB_URI` incluya el nombre de la base de datos:

```bash
# ❌ MALO (sin nombre de DB)
mongodb+srv://user:pass@cluster.mongodb.net/

# ✅ BUENO (con nombre de DB)
mongodb+srv://user:pass@cluster.mongodb.net/gondolapp
```

---

#### 5. ❌ Módulo `mongodb` no instalado

**Error en consola del servidor**:

```
Module not found: Can't resolve 'mongodb'
```

**Solución**:

```bash
npm install mongodb xlsx
```

---

#### 6. ❌ IndexedDB en servidor

**Error en consola del servidor**:

```
ReferenceError: indexedDB is not defined
```

**Solución**:
Este error ocurre si intentas usar Dexie en API routes. **NO uses IndexedDB en el servidor**.

```typescript
// ❌ MALO (en API route)
import { db as dexieDb } from "@/lib/db";
await dexieDb.productosBase.add(...);

// ✅ BUENO (solo MongoDB en API routes)
const db = await getDatabase();
await db.collection("productos_base").insertOne(...);
```

---

## Verificación Paso a Paso

### 1. Verifica Variables de Entorno

```bash
# Ver contenido de .env.local (sin mostrar password completo)
cat .env.local | grep MONGODB_URI | cut -c1-40
```

Deberías ver algo como:

```
MONGODB_URI=mongodb+srv://usuario:pass
```

### 2. Test de Conexión

Crea un archivo temporal `test-mongo.js`:

```javascript
const { MongoClient } = require("mongodb");

const uri = "TU_MONGODB_URI_AQUI";

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Conexión exitosa");
    const db = client.db("gondolapp");
    const collections = await db.listCollections().toArray();
    console.log(
      "Colecciones:",
      collections.map((c) => c.name)
    );
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  } finally {
    await client.close();
  }
}

testConnection();
```

Ejecuta:

```bash
node test-mongo.js
```

### 3. Verifica Logs del Servidor

Con el servidor corriendo (`npm run dev`), intenta crear un producto y revisa la terminal.

Busca estos mensajes:

```
📦 Creando producto manual: { ean: '...', nombre: '...', marca: '...' }
🔌 Conectando a MongoDB...
✅ Conectado a MongoDB
```

Si ves `❌` en algún paso, ese es tu problema.

---

## Debugging Avanzado

### Habilitar logs de MongoDB

En `.env.local`:

```bash
MONGODB_VERBOSE_LOGGING=true
```

### Ver estructura de colecciones

```bash
# En la terminal de tu servidor
curl -X GET http://localhost:3000/api/productos/crear-manual
```

Deberías ver:

```json
{
  "success": true,
  "marcas": ["Nestlé", "Coca-Cola"],
  "categorias": ["Leche en Polvo", "Refrescos"]
}
```

---

## Problemas Conocidos

### Hot Reload no detecta cambios en `.env.local`

**Síntoma**: Cambias `MONGODB_URI` pero sigue fallando.

**Solución**:

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

### Error: "Invalid scheme, expected connection string..."

**Síntoma**: Error al parsear el connection string.

**Solución**: Asegúrate de que NO haya espacios en `MONGODB_URI`:

```bash
# ❌ MALO
MONGODB_URI = mongodb+srv://...

# ✅ BUENO
MONGODB_URI=mongodb+srv://...
```

### Cluster en pausa (M0 Free Tier)

**Síntoma**: Timeout después de inactividad prolongada.

**Solución**:

1. Ve a MongoDB Atlas
2. Verifica que el cluster esté activo (no "Paused")
3. Si está pausado, haz click en "Resume"

---

## Checklist de Diagnóstico

- [ ] `.env.local` existe y contiene `MONGODB_URI`
- [ ] Connection string incluye usuario, password y nombre de DB
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] IP permitida en MongoDB Atlas Network Access
- [ ] Usuario existe en Database Access con permisos
- [ ] Cluster está activo (no pausado)
- [ ] Módulos instalados (`mongodb`, `xlsx`)
- [ ] No hay uso de IndexedDB en API routes

---

## Contacto

Si el problema persiste después de seguir esta guía:

1. Revisa los logs completos del servidor
2. Copia el error exacto
3. Verifica la configuración de MongoDB Atlas
4. Consulta la documentación: `/docs/MONGODB-SETUP.md`
