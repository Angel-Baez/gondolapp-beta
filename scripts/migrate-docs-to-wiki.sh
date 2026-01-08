#!/bin/bash

# Script para migrar documentación de docs/ a GitHub Wiki
# Uso: ./scripts/migrate-docs-to-wiki.sh <github-username> <repo-name>
#
# Ejemplo: ./scripts/migrate-docs-to-wiki.sh Angel-Baez gondolapp-beta

set -e

USERNAME=${1:-"Angel-Baez"}
REPO=${2:-"gondolapp-beta"}

if [ -z "$USERNAME" ]; then
    echo "Error: Debes proporcionar tu usuario de GitHub"
    echo "Uso: $0 <github-username> [repo-name]"
    echo "Ejemplo: $0 Angel-Baez gondolapp-beta"
    exit 1
fi

WIKI_URL="https://github.com/$USERNAME/$REPO.wiki.git"
WIKI_DIR="/tmp/${REPO}.wiki"
DOCS_DIR="$(dirname "$0")/../docs"

echo "=== Migrando documentación a GitHub Wiki ==="
echo "Usuario: $USERNAME"
echo "Repo: $REPO"
echo "Wiki URL: $WIKI_URL"
echo ""

# Verificar que existe la carpeta docs
if [ ! -d "$DOCS_DIR" ]; then
    echo "Error: No se encontró la carpeta docs/"
    exit 1
fi

# Clonar el wiki (creará uno nuevo si no existe)
echo "1. Clonando wiki..."
rm -rf "$WIKI_DIR"
git clone "$WIKI_URL" "$WIKI_DIR" 2>/dev/null || {
    echo "   El wiki no existe aún. Creando estructura inicial..."
    mkdir -p "$WIKI_DIR"
    cd "$WIKI_DIR"
    git init
    git remote add origin "$WIKI_URL"
}

cd "$WIKI_DIR"

# Copiar archivos de documentación
echo "2. Copiando archivos de documentación..."

# Archivos principales
for file in "$DOCS_DIR"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # Convertir nombres para Wiki (ARCHIVO-NOMBRE.md -> Archivo-Nombre.md)
        cp "$file" "$WIKI_DIR/$filename"
        echo "   Copiado: $filename"
    fi
done

# Archivos en subcarpetas (product/)
if [ -d "$DOCS_DIR/product" ]; then
    for file in "$DOCS_DIR/product"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "$WIKI_DIR/$filename"
            echo "   Copiado: product/$filename"
        fi
    done
fi

# Crear página Home con índice
echo "3. Creando página Home con índice..."
cat > "$WIKI_DIR/Home.md" << 'EOF'
# Gondolapp - Documentación

Bienvenido a la documentación de Gondolapp.

## Guías de Configuración
- [GEMINI-API-SETUP](GEMINI-API-SETUP) - Configuración de API de Gemini
- [MONGODB-SETUP](MONGODB-SETUP) - Configuración de MongoDB
- [SETUP-MONGODB](SETUP-MONGODB) - Setup alternativo de MongoDB
- [DEPLOY](DEPLOY) - Guía de despliegue
- [DEPLOY-VERCEL](DEPLOY-VERCEL) - Despliegue en Vercel
- [DEPLOY-CHECKLIST](DEPLOY-CHECKLIST) - Checklist de despliegue

## Arquitectura
- [ARQUITECTURA-IA-FIRST](ARQUITECTURA-IA-FIRST) - Arquitectura IA-First
- [SOLID-PRINCIPLES](SOLID-PRINCIPLES) - Principios SOLID
- [SOLID-IMPLEMENTATION-SUMMARY](SOLID-IMPLEMENTATION-SUMMARY) - Resumen implementación SOLID
- [NORMALIZACION-HIBRIDA](NORMALIZACION-HIBRIDA) - Normalización híbrida
- [API-SINCRONIZACION](API-SINCRONIZACION) - API de sincronización

## Implementación
- [IMPLEMENTACION](IMPLEMENTACION) - Guía de implementación
- [IMPLEMENTACION_COMPLETA](IMPLEMENTACION_COMPLETA) - Implementación completa
- [MONGO-COMPASS-IMPLEMENTATION](MONGO-COMPASS-IMPLEMENTATION) - Implementación con Mongo Compass
- [FEEDBACK-SYSTEM](FEEDBACK-SYSTEM) - Sistema de feedback
- [PWA-INSTALL-BANNER](PWA-INSTALL-BANNER) - Banner de instalación PWA

## Migraciones
- [MIGRATION-DB-SERVICE](MIGRATION-DB-SERVICE) - Migración de servicio DB
- [MIGRATION-USEPRODUCTSERVICE](MIGRATION-USEPRODUCTSERVICE) - Migración useProductService
- [REFACTOR-LOG](REFACTOR-LOG) - Log de refactorizaciones

## Optimizaciones
- [OPTIMIZACIONES-CACHE](OPTIMIZACIONES-CACHE) - Optimizaciones de caché
- [OPTIMIZACIONES-LIGHTHOUSE](OPTIMIZACIONES-LIGHTHOUSE) - Optimizaciones Lighthouse
- [CHANGELOG-PERFORMANCE](CHANGELOG-PERFORMANCE) - Changelog de performance

## Historial
- [HISTORIAL_LISTAS](HISTORIAL_LISTAS) - Historial de listas
- [README_HISTORIAL](README_HISTORIAL) - README del historial
- [GUIA_USO_HISTORIAL](GUIA_USO_HISTORIAL) - Guía de uso del historial

## Troubleshooting
- [TROUBLESHOOTING](TROUBLESHOOTING) - Solución de problemas
- [SOLUCION-ERROR-404-GEMINI](SOLUCION-ERROR-404-GEMINI) - Error 404 Gemini
- [SOLUCION-RESPUESTA-VACIA-IA](SOLUCION-RESPUESTA-VACIA-IA) - Respuesta vacía IA

## Otros
- [TESTING](TESTING) - Guía de testing
- [SEGURIDAD](SEGURIDAD) - Seguridad
- [CONTRIBUTING](CONTRIBUTING) - Guía de contribución
- [MEJORAS-UX-UI-MOBILE](MEJORAS-UX-UI-MOBILE) - Mejoras UX/UI Mobile
- [ESTADO-PRODUCCION](ESTADO-PRODUCCION) - Estado de producción
- [RESULTADOS-REALES](RESULTADOS-REALES) - Resultados reales
- [CHANGELOG-IA-FIRST](CHANGELOG-IA-FIRST) - Changelog IA-First
- [ANALISIS-MONDOADMIN](ANALISIS-MONDOADMIN) - Análisis MondoAdmin
EOF

# Commit y push
echo "4. Haciendo commit y push..."
git add -A
git commit -m "Migrar documentación desde docs/ del repositorio principal" || {
    echo "   No hay cambios para commitear"
}

echo ""
echo "5. Subiendo al wiki remoto..."
git push -u origin master || git push -u origin main || {
    echo ""
    echo "NOTA: Si el wiki no existe, primero debes crear una página manualmente"
    echo "en GitHub (pestaña Wiki > Create the first page) y luego ejecutar:"
    echo "  cd $WIKI_DIR && git push -u origin master"
}

echo ""
echo "=== Migración completada ==="
echo ""
echo "Próximos pasos:"
echo "1. Verifica el wiki en: https://github.com/$USERNAME/$REPO/wiki"
echo "2. Si todo está correcto, elimina docs/ del repo principal:"
echo "   git rm -r docs/"
echo "   git commit -m 'chore: mover documentación a GitHub Wiki'"
echo "   git push"
