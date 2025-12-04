# SaaS Platform Template Context

> Project template for Software as a Service platforms with multi-tenancy, subscriptions, and API-first architecture.
> This template is ideal for B2B tools, productivity apps, and cloud-based services.

## Template Overview

**Type**: SaaS Platform
**Example Projects**: Project management, CRM, analytics dashboards, collaboration tools
**Key Characteristics**: Multi-tenant, subscription billing, API-first, user management

## Target Users

**Primary**: Business users (B2B)
- Working on desktop/laptop
- Expect professional, polished interface
- Need collaboration features
- Require data security and privacy

**Secondary**: Administrators
- Tenant/organization management
- User provisioning
- Billing management
- Audit logs

**Tertiary**: API consumers
- Third-party integrations
- Webhooks
- Developer portal

## Technology Stack Specifics

### Required Technologies

| Technology | Purpose | Configuration |
|------------|---------|---------------|
| **NextAuth.js** | Authentication | Multi-provider (OAuth, email) |
| **Stripe** | Subscription billing | Plans, metering, invoices |
| **PostgreSQL/MongoDB** | Multi-tenant data | Row-level security or tenant ID |
| **Redis** | Sessions, rate limiting | Distributed cache |
| **Resend/SendGrid** | Transactional email | Verification, notifications |

### Recommended Additions

| Technology | Purpose | When to Add |
|------------|---------|-------------|
| **Clerk/Auth0** | Advanced auth | SSO, SAML requirements |
| **LaunchDarkly** | Feature flags | A/B testing, gradual rollout |
| **Segment** | Analytics | User tracking, funnel analysis |
| **Sentry** | Error tracking | Production monitoring |
| **OpenTelemetry** | Observability | Distributed tracing |

## Data Architecture

### Multi-Tenancy Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION                          │
│                                                              │
│  Option 1: Shared Database, Tenant Column (Recommended)     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SELECT * FROM projects WHERE tenant_id = ?            │ │
│  │  • Simplest to implement                                │ │
│  │  • Good for most SaaS                                   │ │
│  │  • Use row-level security policies                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Option 2: Shared Database, Separate Schemas                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  SELECT * FROM tenant_123.projects                      │ │
│  │  • Better isolation                                     │ │
│  │  • More complex migrations                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Option 3: Separate Databases per Tenant                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Connect to tenant_123_db, SELECT * FROM projects      │ │
│  │  • Maximum isolation                                    │ │
│  │  • Expensive, complex                                   │ │
│  │  • Enterprise tier only                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Core Data Models

```typescript
// Organization (Tenant)
interface Organization {
  id: string;
  name: string;
  slug: string;                    // subdomain
  plan: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

// User with Organization Membership
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedAt: Date;
  joinedAt?: Date;
}

// Tenant-scoped Resource
interface Project {
  id: string;
  organizationId: string;          // Tenant isolation
  name: string;
  description?: string;
  createdById: string;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

### API Structure

```typescript
// Tenant-aware API middleware
async function withTenant(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) throw new UnauthorizedError();
  
  const organizationId = req.headers.get('x-organization-id');
  if (!organizationId) throw new BadRequestError('Organization required');
  
  // Verify membership
  const membership = await db.organizationMembers.findFirst({
    where: {
      userId: session.user.id,
      organizationId
    }
  });
  
  if (!membership) throw new ForbiddenError();
  
  return { session, organizationId, membership };
}
```

## UI/UX Requirements

### Desktop-First Design

| Aspect | Requirement | Notes |
|--------|-------------|-------|
| Minimum Width | 1024px | Responsive down to 768px |
| Navigation | Sidebar + Top bar | Collapsible on tablet |
| Tables | Full-featured | Sorting, filtering, pagination |
| Forms | Multi-step wizards | Progress indication |
| Dark Mode | Required | System preference + manual |

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo]  [Search...]  [Notifications 🔔]  [User Avatar ▼]          │
├─────────┬──────────────────────────────────────────────────────────┤
│         │                                                           │
│  Nav    │   ┌─────────────────────────────────────────────────┐   │
│         │   │              Page Header                          │   │
│ [Home]  │   │  Title              [+ New] [Export] [Filter]   │   │
│ [Proj]  │   └─────────────────────────────────────────────────┘   │
│ [Team]  │                                                           │
│ [...]   │   ┌─────────────────────────────────────────────────┐   │
│         │   │                                                   │   │
│ ──────  │   │              Main Content                         │   │
│         │   │                                                   │   │
│ [Set]   │   │  • Tables                                         │   │
│ [Bil]   │   │  • Cards                                          │   │
│         │   │  • Charts                                         │   │
│         │   │                                                   │   │
│         │   └─────────────────────────────────────────────────┘   │
│         │                                                           │
└─────────┴──────────────────────────────────────────────────────────┘
```

### Color System

```typescript
const colors = {
  // Brand
  primary: 'indigo-600',
  primaryHover: 'indigo-700',
  
  // Semantic
  success: 'green-600',
  warning: 'amber-600',
  error: 'red-600',
  info: 'blue-600',
  
  // Neutral
  background: {
    light: 'white',
    dark: 'gray-900'
  },
  surface: {
    light: 'gray-50',
    dark: 'gray-800'
  },
  text: {
    primary: { light: 'gray-900', dark: 'gray-100' },
    secondary: { light: 'gray-600', dark: 'gray-400' }
  }
};
```

## Authentication & Authorization

### Auth Flow

```typescript
// NextAuth.js configuration
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM
    })
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub!;
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify',
    error: '/auth/error'
  }
};
```

### Role-Based Access Control

```typescript
type Permission = 
  | 'project:read'
  | 'project:write'
  | 'project:delete'
  | 'team:invite'
  | 'team:remove'
  | 'billing:read'
  | 'billing:write';

const rolePermissions: Record<Role, Permission[]> = {
  owner: ['*'], // All permissions
  admin: ['project:read', 'project:write', 'project:delete', 'team:invite', 'team:remove', 'billing:read'],
  member: ['project:read', 'project:write'],
  viewer: ['project:read']
};

function hasPermission(membership: OrganizationMember, permission: Permission): boolean {
  const permissions = rolePermissions[membership.role];
  return permissions.includes('*') || permissions.includes(permission);
}
```

## Subscription & Billing

### Stripe Integration

```typescript
// Plan configuration
const plans = {
  free: {
    name: 'Free',
    price: 0,
    limits: { projects: 3, members: 5, storage: '1GB' }
  },
  pro: {
    name: 'Pro',
    price: 29,
    stripePriceId: 'price_xxx',
    limits: { projects: 50, members: 25, storage: '50GB' }
  },
  enterprise: {
    name: 'Enterprise',
    price: 'custom',
    limits: { projects: 'unlimited', members: 'unlimited', storage: '500GB' }
  }
};

// Usage metering
async function checkPlanLimit(orgId: string, resource: string): Promise<boolean> {
  const org = await db.organizations.findUnique({ where: { id: orgId } });
  const limit = plans[org.plan].limits[resource];
  if (limit === 'unlimited') return true;
  
  const current = await db[resource].count({ where: { organizationId: orgId } });
  return current < limit;
}
```

## API Design

### RESTful Endpoints

```typescript
// Standard CRUD pattern
GET    /api/v1/organizations/:orgId/projects           // List
POST   /api/v1/organizations/:orgId/projects           // Create
GET    /api/v1/organizations/:orgId/projects/:id       // Get
PATCH  /api/v1/organizations/:orgId/projects/:id       // Update
DELETE /api/v1/organizations/:orgId/projects/:id       // Delete

// Response format
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}

// Error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "name", "message": "Name is required" }
    ]
  }
}
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Lighthouse Performance | ≥ 90 | Desktop focus |
| Time to First Byte | < 200ms | Edge deployment |
| API Response Time (p95) | < 500ms | Most endpoints |
| Dashboard Load | < 2s | After authentication |
| Uptime | 99.9% | SLA commitment |

## Security Requirements

| Area | Requirement |
|------|-------------|
| Authentication | Multi-factor available |
| Session | Secure, HttpOnly cookies |
| Data | Encrypted at rest |
| API | Rate limited, API keys |
| Audit | All actions logged |
| Compliance | GDPR, SOC 2 ready |

## Quality Checklist

### Before Release

- [ ] Multi-tenant data isolation verified
- [ ] RBAC working correctly
- [ ] Stripe webhooks handling all events
- [ ] Email notifications sending
- [ ] Rate limiting configured
- [ ] API documentation complete
- [ ] Error tracking configured
- [ ] Audit logging enabled

### Security Audit

- [ ] No cross-tenant data leaks
- [ ] Authentication flows secure
- [ ] API keys properly scoped
- [ ] Secrets not in client bundle
- [ ] CORS configured correctly
- [ ] CSP headers set

---

> **Note**: This template prioritizes security, scalability, and professional polish. All features should consider multi-tenant implications.
