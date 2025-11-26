# GondolApp - Guía de Contribución

¡Gracias por tu interés en contribuir a GondolApp! 🎉

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Guías de Estilo](#guías-de-estilo)
- [Estructura del Proyecto](#estructura-del-proyecto)

## 🤝 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas un ambiente respetuoso y profesional.

## 🚀 ¿Cómo puedo contribuir?

### Reportar Bugs

1. Verifica que el bug no haya sido reportado anteriormente
2. Usa la plantilla de [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml)
3. Incluye toda la información solicitada
4. Agrega screenshots si es posible

### Sugerir Funcionalidades

1. Usa la plantilla de [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml)
2. Describe claramente el problema que resuelve
3. Considera las implicaciones para PWA y modo offline

### Pull Requests

1. Fork el repositorio
2. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/mi-nueva-funcionalidad
   ```
3. Realiza tus cambios siguiendo las guías de estilo
4. Asegúrate que los tests pasen:
   ```bash
   npm run lint
   npm run build
   ```
5. Commit con mensajes descriptivos (ver convenciones abajo)
6. Push a tu fork
7. Abre un Pull Request usando la plantilla

## 🔄 Proceso de Desarrollo

### Configuración Local

```bash
# Clonar el repositorio
git clone https://github.com/Angel-Baez/gondolapp-beta.git
cd gondolapp-beta

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Estructura de Ramas

- `main`: Rama principal (producción)
- `develop`: Rama de desarrollo
- `feature/nombre`: Nuevas funcionalidades
- `fix/nombre`: Corrección de bugs
- `refactor/nombre`: Refactorización de código

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(scope): descripción breve

[cuerpo opcional]

[footer opcional]
```

**Tipos:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato, sin cambios de código
- `refactor`: Refactorización
- `perf`: Mejora de rendimiento
- `test`: Agregar tests
- `chore`: Mantenimiento

**Ejemplos:**

```
feat(scanner): agregar soporte para códigos QR
fix(reposicion): corregir cálculo de cantidades
docs(readme): actualizar instrucciones de instalación
```

## 📐 Guías de Estilo

### TypeScript

- Usar TypeScript estricto
- Evitar `any`, preferir tipos específicos
- Documentar interfaces y tipos complejos
- Usar optional chaining (`?.`) para acceso seguro

### React

- Usar componentes funcionales con hooks
- Preferir composición sobre herencia
- Extraer lógica compleja a custom hooks
- Mantener componentes pequeños y enfocados

### Tailwind CSS

- Seguir el patrón de colores existente:
  - Cyan (`bg-cyan-500`) para reposición
  - Red (`bg-red-500`) para vencimientos
- Usar clases utilitarias, evitar CSS custom
- Mantener consistencia en espaciado y sombras

### Dexie.js / IndexedDB

- Siempre usar `useLiveQuery` para queries reactivas
- Envolver escrituras en `useMutation` de React Query
- Verificar existencia antes de insertar
- Manejar errores gracefully

## 🏗️ Estructura del Proyecto

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   └── reposicion/     # Páginas
├── components/         # Componentes React
│   ├── reposicion/    # Específicos de reposición
│   ├── vencimiento/   # Específicos de vencimientos
│   └── ui/            # Componentes UI reutilizables
├── core/              # Arquitectura SOLID
│   ├── services/      # Lógica de negocio
│   ├── repositories/  # Acceso a datos
│   └── interfaces/    # Contratos
├── lib/               # Utilidades
│   ├── db.ts          # Schema de Dexie
│   └── hooks/         # Custom hooks
└── store/             # Estado global (Zustand)
```

## 🧪 Testing

Antes de enviar un PR, verifica:

- [ ] El código compila sin errores (`npm run build`)
- [ ] El linter pasa (`npm run lint`)
- [ ] Funciona en Chrome, Safari y Firefox
- [ ] Funciona en modo offline
- [ ] El scanner funciona en dispositivos móviles
- [ ] No hay errores en la consola
- [ ] Los cambios son responsive

## 📱 Consideraciones PWA

- Todos los cambios deben funcionar offline
- Considerar el tamaño del Service Worker
- Verificar que las imágenes estén optimizadas
- Probar en dispositivos móviles reales

## 🔒 Seguridad

- No commitear credenciales o API keys
- Usar variables de entorno para datos sensibles
- Validar todas las entradas de usuario
- Sanitizar datos antes de guardar en IndexedDB

## 📞 ¿Necesitas Ayuda?

- Revisa la [documentación](docs/)
- Abre una [discusión](https://github.com/Angel-Baez/gondolapp-beta/discussions)
- Lee las [instrucciones para Copilot](.github/copilot-instructions.md)

## 🙏 Reconocimientos

Gracias a todos los contribuidores que hacen este proyecto posible.

---

**¿Listo para contribuir?** ¡Abre tu primer issue o PR! 🚀
