#!/bin/bash

# 🚀 Script de Verificación de Optimizaciones Lighthouse
# Ejecutar después de desplegar a producción

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificación de Optimizaciones de Performance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# URL de producción
URL="https://gondolapp.digital"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "📍 URL a analizar: $URL"
echo ""

# 1. Verificar que el sitio está online
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verificando disponibilidad del sitio..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Intentar con curl siguiendo redirecciones y verificando el código de estado
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$URL")

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo -e "${GREEN}✅ Sitio online y accesible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️  Código HTTP: $HTTP_CODE${NC}"
    echo -e "${YELLOW}🔄 Intentando continuar con el análisis...${NC}"
fi
echo ""

# 2. Verificar que Lighthouse está instalado
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Verificando instalación de Lighthouse..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v lighthouse &> /dev/null; then
    LIGHTHOUSE_VERSION=$(lighthouse --version)
    echo -e "${GREEN}✅ Lighthouse instalado: $LIGHTHOUSE_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Lighthouse no encontrado. Instalando...${NC}"
    npm install -g lighthouse
fi
echo ""

# 3. Ejecutar análisis Lighthouse
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Ejecutando análisis Lighthouse..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏳ Esto puede tomar 30-60 segundos..."
echo ""

# Crear directorio para reportes
REPORT_DIR="lighthouse-reports"
mkdir -p $REPORT_DIR

# Timestamp para el reporte
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$REPORT_DIR/report_$TIMESTAMP"

# Ejecutar Lighthouse con configuración optimizada
lighthouse "$URL" \
  --output=html \
  --output=json \
  --output-path="$REPORT_FILE" \
  --preset=desktop \
  --chrome-flags="--headless" \
  --quiet

echo ""
echo -e "${GREEN}✅ Análisis completado${NC}"
echo ""

# 4. Extraer métricas del JSON
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Analizando resultados..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

JSON_REPORT="${REPORT_FILE}.report.json"

if [ -f "$JSON_REPORT" ]; then
    # Extraer scores usando jq (o python si no tienes jq)
    if command -v jq &> /dev/null; then
        PERF_SCORE=$(jq '.categories.performance.score * 100' "$JSON_REPORT" | cut -d. -f1)
        A11Y_SCORE=$(jq '.categories.accessibility.score * 100' "$JSON_REPORT" | cut -d. -f1)
        BP_SCORE=$(jq '.categories."best-practices".score * 100' "$JSON_REPORT" | cut -d. -f1)
        SEO_SCORE=$(jq '.categories.seo.score * 100' "$JSON_REPORT" | cut -d. -f1)
        
        FCP=$(jq '.audits."first-contentful-paint".numericValue' "$JSON_REPORT")
        LCP=$(jq '.audits."largest-contentful-paint".numericValue' "$JSON_REPORT")
        TBT=$(jq '.audits."total-blocking-time".numericValue' "$JSON_REPORT")
        CLS=$(jq '.audits."cumulative-layout-shift".numericValue' "$JSON_REPORT")
    else
        echo -e "${YELLOW}⚠️  jq no instalado, mostrando enlace al reporte HTML${NC}"
        echo ""
        echo "📊 Reporte HTML: file://$(pwd)/${REPORT_FILE}.report.html"
        echo ""
        open "${REPORT_FILE}.report.html" 2>/dev/null || xdg-open "${REPORT_FILE}.report.html" 2>/dev/null
        exit 0
    fi
    
    echo "📊 SCORES"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Performance
    if [ $PERF_SCORE -ge 90 ]; then
        echo -e "Performance:      ${GREEN}${PERF_SCORE}/100 ✅${NC}"
    elif [ $PERF_SCORE -ge 50 ]; then
        echo -e "Performance:      ${YELLOW}${PERF_SCORE}/100 ⚠️${NC}"
    else
        echo -e "Performance:      ${RED}${PERF_SCORE}/100 ❌${NC}"
    fi
    
    # Accessibility
    if [ $A11Y_SCORE -ge 90 ]; then
        echo -e "Accessibility:    ${GREEN}${A11Y_SCORE}/100 ✅${NC}"
    elif [ $A11Y_SCORE -ge 50 ]; then
        echo -e "Accessibility:    ${YELLOW}${A11Y_SCORE}/100 ⚠️${NC}"
    else
        echo -e "Accessibility:    ${RED}${A11Y_SCORE}/100 ❌${NC}"
    fi
    
    # Best Practices
    if [ $BP_SCORE -ge 90 ]; then
        echo -e "Best Practices:   ${GREEN}${BP_SCORE}/100 ✅${NC}"
    elif [ $BP_SCORE -ge 50 ]; then
        echo -e "Best Practices:   ${YELLOW}${BP_SCORE}/100 ⚠️${NC}"
    else
        echo -e "Best Practices:   ${RED}${BP_SCORE}/100 ❌${NC}"
    fi
    
    # SEO
    if [ $SEO_SCORE -ge 90 ]; then
        echo -e "SEO:              ${GREEN}${SEO_SCORE}/100 ✅${NC}"
    elif [ $SEO_SCORE -ge 50 ]; then
        echo -e "SEO:              ${YELLOW}${SEO_SCORE}/100 ⚠️${NC}"
    else
        echo -e "SEO:              ${RED}${SEO_SCORE}/100 ❌${NC}"
    fi
    
    echo ""
    echo "⚡ CORE WEB VITALS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    FCP_SECONDS=$(echo "scale=2; $FCP/1000" | bc)
    LCP_SECONDS=$(echo "scale=2; $LCP/1000" | bc)
    TBT_MS=$(echo "scale=0; $TBT/1" | bc)
    
    # FCP
    if (( $(echo "$FCP < 1800" | bc -l) )); then
        echo -e "FCP:              ${GREEN}${FCP_SECONDS}s ✅${NC} (< 1.8s)"
    elif (( $(echo "$FCP < 3000" | bc -l) )); then
        echo -e "FCP:              ${YELLOW}${FCP_SECONDS}s ⚠️${NC} (< 3.0s)"
    else
        echo -e "FCP:              ${RED}${FCP_SECONDS}s ❌${NC} (> 3.0s)"
    fi
    
    # LCP
    if (( $(echo "$LCP < 2500" | bc -l) )); then
        echo -e "LCP:              ${GREEN}${LCP_SECONDS}s ✅${NC} (< 2.5s)"
    elif (( $(echo "$LCP < 4000" | bc -l) )); then
        echo -e "LCP:              ${YELLOW}${LCP_SECONDS}s ⚠️${NC} (< 4.0s)"
    else
        echo -e "LCP:              ${RED}${LCP_SECONDS}s ❌${NC} (> 4.0s)"
    fi
    
    # TBT
    if [ $TBT_MS -lt 200 ]; then
        echo -e "TBT:              ${GREEN}${TBT_MS}ms ✅${NC} (< 200ms)"
    elif [ $TBT_MS -lt 600 ]; then
        echo -e "TBT:              ${YELLOW}${TBT_MS}ms ⚠️${NC} (< 600ms)"
    else
        echo -e "TBT:              ${RED}${TBT_MS}ms ❌${NC} (> 600ms)"
    fi
    
    # CLS
    if (( $(echo "$CLS < 0.1" | bc -l) )); then
        echo -e "CLS:              ${GREEN}${CLS} ✅${NC} (< 0.1)"
    elif (( $(echo "$CLS < 0.25" | bc -l) )); then
        echo -e "CLS:              ${YELLOW}${CLS} ⚠️${NC} (< 0.25)"
    else
        echo -e "CLS:              ${RED}${CLS} ❌${NC} (> 0.25)"
    fi
    
else
    echo -e "${RED}❌ No se pudo leer el reporte JSON${NC}"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Comparación con objetivo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Comparación
if [ $PERF_SCORE -ge 80 ] && [ $A11Y_SCORE -ge 95 ]; then
    echo -e "${GREEN}🎉 ¡Objetivo alcanzado!${NC}"
    echo ""
    echo "✅ Performance: $PERF_SCORE/100 (objetivo: ≥80)"
    echo "✅ Accessibility: $A11Y_SCORE/100 (objetivo: ≥95)"
elif [ $PERF_SCORE -ge 66 ] && [ $A11Y_SCORE -ge 83 ]; then
    echo -e "${YELLOW}📈 Mejora detectada, pero aún por debajo del objetivo${NC}"
    echo ""
    echo "⚠️  Performance: $PERF_SCORE/100 (objetivo: ≥80, antes: 66)"
    echo "⚠️  Accessibility: $A11Y_SCORE/100 (objetivo: ≥95, antes: 83)"
else
    echo -e "${RED}📉 Los scores han empeorado${NC}"
    echo ""
    echo "❌ Performance: $PERF_SCORE/100 (antes: 66)"
    echo "❌ Accessibility: $A11Y_SCORE/100 (antes: 83)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 Reportes guardados en: $REPORT_DIR/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "HTML: file://$(pwd)/${REPORT_FILE}.report.html"
echo "JSON: file://$(pwd)/${REPORT_FILE}.report.json"
echo ""

# Abrir reporte HTML automáticamente
open "${REPORT_FILE}.report.html" 2>/dev/null || xdg-open "${REPORT_FILE}.report.html" 2>/dev/null

echo "✅ Verificación completada"
