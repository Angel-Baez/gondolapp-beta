#!/bin/bash

# ============================================
# Agent System Initialization Script
# ============================================
# This script initializes the agent system for a new project.
# Usage: ./init-agents.sh [project-type]
# 
# Project types: pwa | saas | ecommerce | dashboard | custom
#
# Example:
#   ./init-agents.sh pwa
#   ./init-agents.sh saas
#   ./init-agents.sh custom
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="${SCRIPT_DIR}"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Print colored message
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Header
echo ""
echo "============================================"
echo "  Agent System Initialization"
echo "  MERN + Next.js + TypeScript Framework"
echo "============================================"
echo ""

# Check if project type was provided
PROJECT_TYPE="${1:-}"

if [ -z "$PROJECT_TYPE" ]; then
    echo "Select a project type:"
    echo ""
    echo "  1) pwa        - Progressive Web App (offline-first, mobile)"
    echo "  2) saas       - SaaS Platform (multi-tenant, subscriptions)"
    echo "  3) ecommerce  - E-commerce (products, cart, checkout)"
    echo "  4) dashboard  - Admin Dashboard (data tables, CRUD)"
    echo "  5) custom     - Custom project (minimal template)"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1) PROJECT_TYPE="pwa" ;;
        2) PROJECT_TYPE="saas" ;;
        3) PROJECT_TYPE="ecommerce" ;;
        4) PROJECT_TYPE="dashboard" ;;
        5) PROJECT_TYPE="custom" ;;
        *) 
            print_error "Invalid choice. Please run again and select 1-5."
            exit 1
            ;;
    esac
fi

# Validate project type
VALID_TYPES=("pwa" "saas" "ecommerce" "dashboard" "custom")
if [[ ! " ${VALID_TYPES[@]} " =~ " ${PROJECT_TYPE} " ]]; then
    print_error "Invalid project type: $PROJECT_TYPE"
    print_info "Valid types: ${VALID_TYPES[*]}"
    exit 1
fi

print_info "Initializing agents for project type: ${PROJECT_TYPE}"
echo ""

# Step 1: Check if project-context.yml exists
CONFIG_FILE="${PROJECT_ROOT}/project-context.yml"

if [ -f "$CONFIG_FILE" ]; then
    print_warning "project-context.yml already exists at ${CONFIG_FILE}"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        print_info "Keeping existing configuration."
    else
        cp "${AGENTS_DIR}/project-context.example.yml" "$CONFIG_FILE"
        print_success "Created new project-context.yml"
    fi
else
    cp "${AGENTS_DIR}/project-context.example.yml" "$CONFIG_FILE"
    print_success "Created project-context.yml at ${CONFIG_FILE}"
fi

# Step 2: Update project type in config
if [ -f "$CONFIG_FILE" ]; then
    # Use sed to update the project type
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/type: \".*\"/type: \"${PROJECT_TYPE}\"/" "$CONFIG_FILE"
    else
        # Linux
        sed -i "s/type: \".*\"/type: \"${PROJECT_TYPE}\"/" "$CONFIG_FILE"
    fi
    print_success "Set project type to: ${PROJECT_TYPE}"
fi

# Step 3: Display template information
echo ""
print_info "Project template: ${PROJECT_TYPE}"
echo ""

case $PROJECT_TYPE in
    "pwa")
        echo "  Template: PWA/Retail"
        echo "  Features:"
        echo "    • Offline-first architecture with IndexedDB"
        echo "    • Service Worker for caching"
        echo "    • Mobile-first design (touch-optimized)"
        echo "    • Barcode scanning support"
        echo "    • Background sync"
        echo ""
        echo "  Key agents:"
        echo "    • pwa-specialist - Offline functionality"
        echo "    • frontend-architect - Mobile UI"
        echo "    • backend-architect - API + sync"
        ;;
    "saas")
        echo "  Template: SaaS Platform"
        echo "  Features:"
        echo "    • Multi-tenant architecture"
        echo "    • Authentication with multiple providers"
        echo "    • Subscription billing (Stripe)"
        echo "    • Role-based access control"
        echo "    • API-first design"
        echo ""
        echo "  Key agents:"
        echo "    • backend-architect - Multi-tenant APIs"
        echo "    • security-guardian - Auth & RBAC"
        echo "    • data-engineer - Tenant isolation"
        ;;
    "ecommerce")
        echo "  Template: E-commerce"
        echo "  Features:"
        echo "    • Product catalog with variants"
        echo "    • Shopping cart & checkout"
        echo "    • Payment processing (Stripe)"
        echo "    • Order management"
        echo "    • SEO optimization"
        echo ""
        echo "  Key agents:"
        echo "    • backend-architect - Commerce APIs"
        echo "    • frontend-architect - Product pages"
        echo "    • data-engineer - Product schema"
        ;;
    "dashboard")
        echo "  Template: Admin Dashboard"
        echo "  Features:"
        echo "    • Data tables with filtering"
        echo "    • CRUD operations"
        echo "    • Role-based access"
        echo "    • Charts & analytics"
        echo "    • Audit logging"
        echo ""
        echo "  Key agents:"
        echo "    • backend-architect - CRUD APIs"
        echo "    • frontend-architect - Dashboard UI"
        echo "    • data-engineer - Reporting queries"
        ;;
    "custom")
        echo "  Template: Custom"
        echo "  Features:"
        echo "    • Minimal starting point"
        echo "    • All features optional"
        echo "    • Configure in project-context.yml"
        echo ""
        echo "  Key agents:"
        echo "    • orchestrator - Start here"
        echo "    • solution-architect - Design"
        ;;
esac

# Step 4: Verify agent files exist
echo ""
print_info "Verifying agent files..."

REQUIRED_FILES=(
    "_core/_framework-context.md"
    "_core/_shared-solid-principles.md"
    "_core/_shared-data-modeling.md"
    "_core/_shared-workflows.md"
    "_core/_conflict-resolution.md"
    "orchestrator.md"
    "product-manager.md"
    "solution-architect.md"
    "backend-architect.md"
    "frontend-architect.md"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "${AGENTS_DIR}/${file}" ]; then
        echo "  ✓ ${file}"
    else
        echo "  ✗ ${file} (missing)"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    print_warning "Some agent files are missing. The system may not work correctly."
else
    print_success "All core agent files present."
fi

# Step 5: Check template exists
TEMPLATE_DIR="${AGENTS_DIR}/_templates/${PROJECT_TYPE/pwa/pwa-retail}"

if [ "$PROJECT_TYPE" == "pwa" ]; then
    TEMPLATE_DIR="${AGENTS_DIR}/_templates/pwa-retail"
elif [ "$PROJECT_TYPE" == "saas" ]; then
    TEMPLATE_DIR="${AGENTS_DIR}/_templates/saas-platform"
elif [ "$PROJECT_TYPE" == "dashboard" ]; then
    TEMPLATE_DIR="${AGENTS_DIR}/_templates/admin-dashboard"
fi

if [ -d "$TEMPLATE_DIR" ]; then
    print_success "Template found: ${TEMPLATE_DIR}"
else
    if [ "$PROJECT_TYPE" != "custom" ]; then
        print_warning "Template directory not found: ${TEMPLATE_DIR}"
    fi
fi

# Step 6: Final instructions
echo ""
echo "============================================"
echo "  Initialization Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Review and customize project-context.yml"
echo "     Located at: ${CONFIG_FILE}"
echo ""
echo "  2. Start using agents with:"
echo "     @orchestrator <your request>"
echo ""
echo "  3. Read the agent documentation:"
echo "     ${AGENTS_DIR}/README.md"
echo ""
echo "For help, run: ./init-agents.sh --help"
echo ""

# Help option
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo ""
    echo "Usage: ./init-agents.sh [project-type]"
    echo ""
    echo "Project types:"
    echo "  pwa        - Progressive Web App (offline-first)"
    echo "  saas       - SaaS Platform (multi-tenant)"
    echo "  ecommerce  - E-commerce store"
    echo "  dashboard  - Admin Dashboard"
    echo "  custom     - Custom project"
    echo ""
    echo "Options:"
    echo "  --help, -h   Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./init-agents.sh pwa"
    echo "  ./init-agents.sh saas"
    echo "  ./init-agents.sh"  # Interactive mode
    echo ""
fi
