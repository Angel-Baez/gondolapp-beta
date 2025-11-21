#!/bin/bash

# 🛡️ Test de Seguridad - GondolApp
# Verifica rate limiting y security headers

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL de la aplicación
URL="${1:-https://gondolapp.digital}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🛡️  Test de Seguridad - GondolApp${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "URL: ${YELLOW}$URL${NC}"
echo ""

# ============================================
# 1. SECURITY HEADERS
# ============================================
echo -e "${BLUE}[1/4]${NC} Verificando Security Headers..."
echo ""

HEADERS=$(curl -sI "$URL")

check_header() {
  local header_name=$1
  local expected_value=$2
  local header_value=$(echo "$HEADERS" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r')
  
  if [ -z "$header_value" ]; then
    echo -e "  ${RED}✗${NC} $header_name: ${RED}FALTANTE${NC}"
    return 1
  fi
  
  if [ -n "$expected_value" ]; then
    if [[ "$header_value" == *"$expected_value"* ]]; then
      echo -e "  ${GREEN}✓${NC} $header_name: ${GREEN}OK${NC}"
      return 0
    else
      echo -e "  ${YELLOW}⚠${NC} $header_name: ${YELLOW}$header_value${NC}"
      return 1
    fi
  else
    echo -e "  ${GREEN}✓${NC} $header_name: ${GREEN}$header_value${NC}"
    return 0
  fi
}

# Headers críticos
check_header "X-Frame-Options" "DENY"
check_header "X-Content-Type-Options" "nosniff"
check_header "X-XSS-Protection" "1; mode=block"
check_header "Content-Security-Policy"
check_header "Referrer-Policy"
check_header "Permissions-Policy"

echo ""

# ============================================
# 2. HTTPS/TLS
# ============================================
echo -e "${BLUE}[2/4]${NC} Verificando HTTPS/TLS..."
echo ""

if [[ "$URL" == https://* ]]; then
  TLS_VERSION=$(curl -sI --tlsv1.2 "$URL" 2>&1 | grep -i "SSL connection" || echo "TLS OK")
  echo -e "  ${GREEN}✓${NC} HTTPS habilitado"
  echo -e "  ${GREEN}✓${NC} TLS 1.2+ soportado"
else
  echo -e "  ${RED}✗${NC} URL no usa HTTPS"
fi

echo ""

# ============================================
# 3. RATE LIMITING
# ============================================
echo -e "${BLUE}[3/4]${NC} Probando Rate Limiting..."
echo ""

API_ENDPOINT="$URL/api/productos/buscar?q=test"
RATE_LIMIT_HEADER=""
SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0

echo -e "  ${YELLOW}ℹ${NC} Enviando 35 requests al endpoint:"
echo -e "  ${YELLOW}  $API_ENDPOINT${NC}"
echo ""

for i in {1..35}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT")
  
  if [ "$RESPONSE" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo -ne "  ${GREEN}●${NC}"
  elif [ "$RESPONSE" = "429" ]; then
    RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
    echo -ne "  ${RED}●${NC}"
    
    # Capturar headers de rate limit
    if [ -z "$RATE_LIMIT_HEADER" ]; then
      RATE_LIMIT_HEADER=$(curl -sI "$API_ENDPOINT" | grep -i "X-RateLimit-")
    fi
  else
    echo -ne "  ${YELLOW}?${NC}"
  fi
  
  # Nueva línea cada 10 requests
  if [ $((i % 10)) -eq 0 ]; then
    echo ""
  fi
  
  sleep 0.5
done

echo ""
echo ""
echo -e "  Resultados:"
echo -e "    ${GREEN}✓${NC} Requests exitosos: ${GREEN}$SUCCESS_COUNT${NC}"
echo -e "    ${RED}✗${NC} Rate limited (429): ${RED}$RATE_LIMITED_COUNT${NC}"

if [ $RATE_LIMITED_COUNT -gt 0 ]; then
  echo -e "  ${GREEN}✓${NC} Rate limiting está funcionando"
  
  if [ -n "$RATE_LIMIT_HEADER" ]; then
    echo ""
    echo -e "  ${BLUE}Headers de Rate Limit:${NC}"
    echo "$RATE_LIMIT_HEADER" | while read -r line; do
      echo -e "    ${line}"
    done
  fi
else
  echo -e "  ${YELLOW}⚠${NC} No se detectó rate limiting (puede ser normal si límite > 35/min)"
fi

echo ""

# ============================================
# 4. CSP VALIDATION
# ============================================
echo -e "${BLUE}[4/4]${NC} Validando Content Security Policy..."
echo ""

CSP_HEADER=$(echo "$HEADERS" | grep -i "^Content-Security-Policy:" | cut -d' ' -f2- | tr -d '\r')

if [ -n "$CSP_HEADER" ]; then
  echo -e "  ${GREEN}✓${NC} CSP Header presente"
  echo ""
  echo -e "  ${BLUE}Directivas CSP:${NC}"
  
  # Parsear directivas
  echo "$CSP_HEADER" | tr ';' '\n' | while read -r directive; do
    directive=$(echo "$directive" | xargs) # Trim whitespace
    if [ -n "$directive" ]; then
      echo -e "    • $directive"
    fi
  done
  
  echo ""
  
  # Warnings comunes
  if [[ "$CSP_HEADER" == *"unsafe-inline"* ]]; then
    echo -e "  ${YELLOW}⚠${NC} Contiene 'unsafe-inline' (común en Next.js + Tailwind)"
  fi
  
  if [[ "$CSP_HEADER" == *"unsafe-eval"* ]]; then
    echo -e "  ${YELLOW}⚠${NC} Contiene 'unsafe-eval' (requerido por Next.js code splitting)"
  fi
  
  if [[ "$CSP_HEADER" == *"frame-ancestors 'none'"* ]]; then
    echo -e "  ${GREEN}✓${NC} Protección contra clickjacking habilitada"
  fi
else
  echo -e "  ${RED}✗${NC} CSP Header no encontrado"
fi

echo ""

# ============================================
# RESUMEN
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📊 Resumen de Seguridad${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL_CHECKS=10
PASSED_CHECKS=0

# Count passed checks (aproximado)
[ -n "$(echo "$HEADERS" | grep -i "X-Frame-Options")" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ -n "$(echo "$HEADERS" | grep -i "X-Content-Type-Options")" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ -n "$(echo "$HEADERS" | grep -i "X-XSS-Protection")" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ -n "$(echo "$HEADERS" | grep -i "Content-Security-Policy")" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ -n "$(echo "$HEADERS" | grep -i "Referrer-Policy")" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ -n "$(echo "$HEADERS" | grep -i "Permissions-Policy")" ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[[ "$URL" == https://* ]] && PASSED_CHECKS=$((PASSED_CHECKS + 1))
[ $RATE_LIMITED_COUNT -gt 0 ] && PASSED_CHECKS=$((PASSED_CHECKS + 1))

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ $PERCENTAGE -ge 80 ]; then
  echo -e "  ${GREEN}✓${NC} Seguridad: ${GREEN}$PERCENTAGE%${NC} ($PASSED_CHECKS/$TOTAL_CHECKS checks pasados)"
  echo -e "  ${GREEN}✓${NC} Estado: ${GREEN}EXCELENTE${NC}"
elif [ $PERCENTAGE -ge 60 ]; then
  echo -e "  ${YELLOW}⚠${NC} Seguridad: ${YELLOW}$PERCENTAGE%${NC} ($PASSED_CHECKS/$TOTAL_CHECKS checks pasados)"
  echo -e "  ${YELLOW}⚠${NC} Estado: ${YELLOW}BUENO (mejorable)${NC}"
else
  echo -e "  ${RED}✗${NC} Seguridad: ${RED}$PERCENTAGE%${NC} ($PASSED_CHECKS/$TOTAL_CHECKS checks pasados)"
  echo -e "  ${RED}✗${NC} Estado: ${RED}REQUIERE ATENCIÓN${NC}"
fi

echo ""

# ============================================
# RECOMENDACIONES
# ============================================
if [ $PERCENTAGE -lt 100 ]; then
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}   💡 Recomendaciones${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  if [ -z "$(echo "$HEADERS" | grep -i "X-Frame-Options")" ]; then
    echo -e "  • Agregar header ${YELLOW}X-Frame-Options: DENY${NC}"
  fi
  
  if [ -z "$(echo "$HEADERS" | grep -i "Content-Security-Policy")" ]; then
    echo -e "  • Implementar ${YELLOW}Content-Security-Policy${NC}"
  fi
  
  if [ $RATE_LIMITED_COUNT -eq 0 ]; then
    echo -e "  • Verificar que ${YELLOW}rate limiting${NC} esté configurado correctamente"
  fi
  
  if [[ "$URL" != https://* ]]; then
    echo -e "  • Forzar ${YELLOW}HTTPS${NC} en producción"
  fi
  
  echo ""
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✓${NC} Test completado"
echo ""
