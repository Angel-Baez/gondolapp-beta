# Universal Framework Context: MERN Stack + Next.js + TypeScript

> This file contains the shared context that all agents must understand.
> Each agent should reference this context instead of duplicating it.
> Project-specific details are defined in `project-context.yml` at the repository root.

## Framework Overview

This agent system is designed for modern full-stack applications built with the **MERN Stack** (MongoDB, Express/Next.js, React, Node.js) using **TypeScript** as the primary language.

### Supported Project Types

| Type | Description | Key Features |
|------|-------------|--------------|
| **PWA/Retail** | Progressive Web Apps for retail/inventory | Offline-first, barcode scanning, mobile-first |
| **SaaS Platform** | Multi-tenant software platforms | Authentication, subscription, API-first |
| **E-commerce** | Online stores and marketplaces | Cart, payments, inventory, SEO |
| **Admin Dashboard** | Back-office management systems | Data visualization, CRUD, reporting |
| **Custom** | Any other MERN+Next.js project | Configurable per project needs |

## Standard Technology Stack

### Frontend Layer

| Technology | Purpose | Version Range |
|------------|---------|---------------|
| **Next.js** | Framework (App Router, Server Components) | 14.x - 15.x |
| **TypeScript** | Language (strict mode recommended) | 5.x |
| **React** | UI Library | 18.x - 19.x |
| **Tailwind CSS** | Styling framework | 3.x |
| **Framer Motion** | Animations (optional) | 10.x+ |
| **Zustand** | Client-side UI state (ephemeral only) | 4.x |
| **React Query / TanStack Query** | Server state management | 5.x |

### Backend Layer

| Technology | Purpose | When to Use |
|------------|---------|-------------|
| **Next.js API Routes** | Backend API endpoints | Default for monolithic apps |
| **Express.js** | Standalone backend server | Microservices, complex APIs |
| **MongoDB** | Primary database | Default for document storage |
| **PostgreSQL** | Relational database | When relations are complex |
| **Redis** | Caching, rate limiting, sessions | Performance, security |
| **Prisma / Mongoose** | ORM / ODM | Database abstraction |

### Infrastructure Layer

| Technology | Purpose | Alternatives |
|------------|---------|--------------|
| **Vercel** | Hosting, Edge Functions | AWS, Railway, Render |
| **MongoDB Atlas** | Managed MongoDB | Self-hosted, AWS DocumentDB |
| **Upstash Redis** | Serverless Redis | Redis Cloud, self-hosted |
| **GitHub Actions** | CI/CD pipelines | GitLab CI, CircleCI |

### Optional Integrations

| Technology | Purpose | When to Add |
|------------|---------|-------------|
| **Dexie.js** | IndexedDB for offline storage | PWA/Offline-first apps |
| **NextAuth.js** | Authentication | Multi-provider auth needed |
| **Stripe** | Payments | E-commerce, subscriptions |
| **OpenAI / Gemini** | AI features | AI-powered features |
| **Sentry** | Error tracking | Production monitoring |

## Universal Architecture: SOLID Principles

All projects should follow SOLID principles with appropriate complexity based on project size.

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React Components + Tailwind + State Management              │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
│  Hooks + Controllers + Use Cases                             │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                      │
│  Services (Facades) + Validators + Transformers              │
├─────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                         │
│  Repositories + Data Sources (Strategy Pattern)              │
├─────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                      │
│  Database Clients + External APIs + Cache                    │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns by Use Case

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Repository** | Abstracting data persistence | `IProductRepository` |
| **Strategy** | Interchangeable algorithms/sources | `IDataSource` implementations |
| **Chain of Responsibility** | Processing pipelines | Normalizers, validators |
| **Facade** | Simplifying complex subsystems | Service classes |
| **Factory** | Conditional object creation | Data source factory |
| **Observer** | Reactive updates | Live queries, subscriptions |
| **Dependency Injection** | Decoupling components | IoC Container |

### Standard Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes
│   ├── (routes)/         # Page routes
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/               # Reusable UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── core/                 # Business logic (SOLID)
│   ├── interfaces/       # Abstractions (DIP)
│   ├── repositories/     # Data access (SRP)
│   ├── services/         # Business logic (Facade)
│   ├── validators/       # Input validation
│   └── container/        # IoC Container (DI)
├── lib/                  # Utilities and helpers
│   ├── db.ts             # Database client
│   ├── auth.ts           # Authentication
│   └── utils.ts          # General utilities
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── styles/               # Global styles
```

## Quality Standards

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lighthouse Performance | ≥ 90/100 | CI/CD pipeline |
| Lighthouse Accessibility | ≥ 90/100 | CI/CD pipeline |
| LCP (Largest Contentful Paint) | < 2.5s | Core Web Vitals |
| FID (First Input Delay) | < 100ms | Core Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.1 | Core Web Vitals |
| Time to Interactive | < 3.5s | Lighthouse |

### Accessibility Standards

| Standard | Requirement | Verification |
|----------|-------------|--------------|
| WCAG Level | AA minimum | Automated + Manual |
| Touch Targets | ≥ 44x44px | Design review |
| Color Contrast | 4.5:1 (text), 3:1 (UI) | Contrast checker |
| Screen Reader | Full support | Manual testing |
| Keyboard Navigation | Full support | Manual testing |

### Security Standards

| Area | Requirement | Implementation |
|------|-------------|----------------|
| Input Validation | All user inputs | Zod schema validation |
| Output Encoding | Prevent XSS | React auto-escaping |
| Authentication | Secure sessions | NextAuth.js / JWT |
| Authorization | Role-based access | Middleware checks |
| Rate Limiting | API protection | Redis-based limiter |
| HTTPS | Required | Platform config |
| CSP | Strict policy | Next.js headers |

## Development Workflow

### Standard Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
npm run test     # Run tests
npm run test:e2e # End-to-end tests
```

### Git Workflow

```
main (production)
  └── develop (integration)
       ├── feature/xxx (new features)
       ├── fix/xxx (bug fixes)
       └── chore/xxx (maintenance)
```

### Code Review Requirements

- All PRs require at least one approval
- Tests must pass in CI
- Linting must pass
- No decrease in code coverage
- Security scan must pass

## Configuration Variables

Projects can customize behavior using these placeholder variables in `project-context.yml`:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{PROJECT_NAME}}` | Project name | "MyApp" |
| `{{PROJECT_TYPE}}` | Project type | "pwa", "saas", "ecommerce" |
| `{{PROJECT_DESCRIPTION}}` | Brief description | "Inventory management PWA" |
| `{{DB_TYPE}}` | Primary database | "mongodb", "postgresql" |
| `{{AUTH_PROVIDER}}` | Authentication system | "nextauth", "clerk", "custom" |
| `{{HOSTING_PLATFORM}}` | Deployment target | "vercel", "aws", "railway" |

## Agent Integration

All agents in this system should:

1. **Reference this context** instead of duplicating information
2. **Respect project-specific configuration** from `project-context.yml`
3. **Follow SOLID principles** appropriate to project complexity
4. **Maintain clear boundaries** of responsibility
5. **Provide handoff documentation** to downstream agents
6. **Support all project types** with conditional guidance

---

> **Note**: This context should be updated when new universal patterns are identified or framework versions change significantly. Project-specific details belong in `project-context.yml` or the appropriate template in `_templates/`.
