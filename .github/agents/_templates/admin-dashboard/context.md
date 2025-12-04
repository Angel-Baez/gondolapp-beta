# Admin Dashboard Template Context

> Project template for back-office management systems, admin panels, and internal tools.
> This template is ideal for CMS backends, analytics dashboards, and operational tools.

## Template Overview

**Type**: Admin Dashboard
**Example Projects**: CMS admin, analytics dashboards, CRM, internal tools, monitoring systems
**Key Characteristics**: Data visualization, CRUD operations, role-based access, desktop-focused

## Target Users

**Primary**: Internal staff / Administrators
- Desktop workstation use
- Extended daily sessions
- Need keyboard shortcuts
- Power user features valued
- Data density preference

**Secondary**: Managers / Executives
- Dashboard/overview views
- Report generation
- Less technical interaction

## Technology Stack Specifics

### Required Technologies

| Technology | Purpose | Configuration |
|------------|---------|---------------|
| **NextAuth.js** | Authentication | SSO/LDAP integration |
| **PostgreSQL** | Relational data | Complex queries, reporting |
| **Prisma** | ORM | Type-safe database access |
| **React Table / TanStack Table** | Data tables | Sorting, filtering, pagination |
| **Recharts / Tremor** | Visualizations | Charts and graphs |

### Recommended Additions

| Technology | Purpose | When to Add |
|------------|---------|-------------|
| **AG Grid** | Advanced tables | Large datasets, Excel-like |
| **Radix UI / shadcn/ui** | Components | Consistent, accessible UI |
| **React Hook Form** | Forms | Complex data entry |
| **date-fns** | Date handling | Date ranges, formatting |
| **xlsx / Papa Parse** | Import/Export | CSV/Excel operations |

## Data Architecture

### Database-Centric Design

```
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Users     │  │    Roles     │  │    Permissions   │  │
│  │  • id        │  │  • id        │  │  • id            │  │
│  │  • email     │  │  • name      │  │  • resource      │  │
│  │  • roleId    │  │  • perms[]   │  │  • action        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Content    │  │  Analytics   │  │   Audit Logs     │  │
│  │  (varies)    │  │  (metrics)   │  │  (history)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Core Data Models

```typescript
// User with RBAC
interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  roleId: string;
  role: Role;
  lastLoginAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;            // Can't be deleted
  createdAt: Date;
}

interface Permission {
  id: string;
  resource: string;             // 'users', 'posts', 'orders'
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

// Audit Log
interface AuditLog {
  id: string;
  userId: string;
  user: AdminUser;
  action: string;               // 'user.create', 'post.update'
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Generic CRUD Entity
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById?: string;
}
```

### Prisma Schema Pattern

```prisma
model User {
  id          String      @id @default(cuid())
  email       String      @unique
  name        String
  roleId      String
  role        Role        @relation(fields: [roleId], references: [id])
  isActive    Boolean     @default(true)
  lastLoginAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  auditLogs   AuditLog[]
  @@map("admin_users")
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  permissions Permission[]
  isSystem    Boolean      @default(false)
  users       User[]
  
  @@map("roles")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String
  resource   String
  resourceId String?
  oldValue   Json?
  newValue   Json?
  ipAddress  String
  userAgent  String
  createdAt  DateTime @default(now())
  
  @@index([userId])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

## UI/UX Requirements

### Desktop-Optimized Design

| Aspect | Requirement | Reason |
|--------|-------------|--------|
| Min Width | 1280px | Data tables need space |
| Layout | Fixed sidebar + content | Navigation always visible |
| Density | Compact by default | More data visible |
| Keyboard | Full navigation | Power users |
| Dark Mode | Required | Extended use comfort |

### Standard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [☰] [Logo]                    [🔍 Quick search... ⌘K]  [🔔] [👤 User ▼]    │
├───────────┬─────────────────────────────────────────────────────────────────┤
│           │  [Breadcrumb: Dashboard > Users]                                │
│  SIDEBAR  ├─────────────────────────────────────────────────────────────────┤
│           │                                                                  │
│ Dashboard │  ┌─────────────────────────────────────────────────────────────┐│
│ Analytics │  │  Page Title                         [+ Add User] [Export]  ││
│ ─────────│  └─────────────────────────────────────────────────────────────┘│
│ Users    │                                                                  │
│ Roles    │  ┌─────────────────────────────────────────────────────────────┐│
│ Content  │  │  Filters: [Status ▼] [Role ▼] [Date Range]  [Clear All]    ││
│   Posts  │  └─────────────────────────────────────────────────────────────┘│
│   Media  │                                                                  │
│ ─────────│  ┌─────────────────────────────────────────────────────────────┐│
│ Reports  │  │  ☐  Name         Email          Role      Status   Actions  ││
│ Settings │  │  ─────────────────────────────────────────────────────────  ││
│ ─────────│  │  ☐  John Smith   john@...       Admin     Active   [...] ││
│ Audit Log│  │  ☐  Jane Doe     jane@...       Editor    Active   [...]  ││
│           │  │  ☐  Bob Wilson   bob@...        Viewer    Inactive [...]  ││
│           │  │                                                             ││
│           │  ├─────────────────────────────────────────────────────────────┤│
│           │  │  Showing 1-20 of 156        [< Prev] [1] [2] [3] [Next >] ││
│           │  └─────────────────────────────────────────────────────────────┘│
│           │                                                                  │
└───────────┴─────────────────────────────────────────────────────────────────┘
```

### Color System

```typescript
const colors = {
  // Brand
  primary: 'blue-600',
  primaryHover: 'blue-700',
  
  // Status
  success: 'green-600',
  warning: 'amber-600',
  error: 'red-600',
  info: 'blue-500',
  
  // Data visualization
  chart: [
    'blue-500',
    'emerald-500',
    'amber-500',
    'rose-500',
    'violet-500',
    'cyan-500'
  ],
  
  // Background (Light/Dark)
  background: { light: 'gray-100', dark: 'gray-950' },
  surface: { light: 'white', dark: 'gray-900' },
  sidebar: { light: 'gray-50', dark: 'gray-900' },
  
  // Text
  text: {
    primary: { light: 'gray-900', dark: 'gray-100' },
    secondary: { light: 'gray-600', dark: 'gray-400' },
    muted: { light: 'gray-400', dark: 'gray-500' }
  }
};
```

## Key Features

### Data Tables

```typescript
// TanStack Table configuration
const columns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar src={row.original.avatar} />
        <span>{row.getValue('name')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge>{row.original.role.name}</Badge>,
    filterFn: 'equals',
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.getValue('isActive') ? 'success' : 'secondary'}>
        {row.getValue('isActive') ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <RowActions user={row.original} />,
  },
];
```

### Command Palette (⌘K)

```typescript
// Global search/command functionality
const commands = [
  // Navigation
  { name: 'Go to Dashboard', action: () => router.push('/'), keywords: ['home'] },
  { name: 'Go to Users', action: () => router.push('/users'), keywords: ['people'] },
  
  // Actions
  { name: 'Create User', action: () => openModal('createUser'), keywords: ['add', 'new'] },
  { name: 'Export Data', action: () => exportData(), keywords: ['download', 'csv'] },
  
  // Search
  { name: 'Search Users', action: () => searchUsers(query) },
  { name: 'Search Content', action: () => searchContent(query) },
];
```

### Form Patterns

```typescript
// React Hook Form with Zod validation
const userSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  roleId: z.string().min(1, 'Role is required'),
  isActive: z.boolean().default(true),
});

function UserForm({ user, onSubmit }: UserFormProps) {
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: user ?? { email: '', name: '', roleId: '', isActive: true },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField control={form.control} name="email" render={...} />
        <FormField control={form.control} name="name" render={...} />
        <FormField control={form.control} name="roleId" render={...} />
        <FormField control={form.control} name="isActive" render={...} />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}
```

### Dashboard Widgets

```typescript
// Key metrics display
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;            // Percentage change
  trend?: 'up' | 'down';
  icon?: React.ComponentType;
}

// Chart widget
interface ChartWidgetProps {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData[];
  period: 'day' | 'week' | 'month' | 'year';
}

// Activity feed
interface ActivityItem {
  id: string;
  user: { name: string; avatar?: string };
  action: string;
  target?: string;
  timestamp: Date;
}
```

## Authorization

### Permission Checking

```typescript
// Middleware for API routes
export function withPermission(permission: string) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { role: { include: { permissions: true } } }
    });
    
    const hasPermission = user?.role.permissions.some(
      p => p.resource === permission.split(':')[0] && 
           (p.action === permission.split(':')[1] || p.action === 'manage')
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return null; // Continue to handler
  };
}

// Usage
export async function POST(req: NextRequest) {
  const authError = await withPermission('users:create')(req);
  if (authError) return authError;
  
  // Handle request...
}
```

### UI Permission Gates

```typescript
// Permission-based rendering
function PermissionGate({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { user } = useSession();
  
  if (!hasPermission(user, permission)) {
    return fallback;
  }
  
  return children;
}

// Usage
<PermissionGate permission="users:delete">
  <Button variant="destructive">Delete User</Button>
</PermissionGate>
```

## Audit Logging

```typescript
// Automatic audit logging service
class AuditService {
  async log(params: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    oldValue?: unknown;
    newValue?: unknown;
    request: NextRequest;
  }) {
    await db.auditLog.create({
      data: {
        ...params,
        ipAddress: params.request.headers.get('x-forwarded-for') ?? 'unknown',
        userAgent: params.request.headers.get('user-agent') ?? 'unknown',
      }
    });
  }
}

// Usage in API routes
await auditService.log({
  userId: session.user.id,
  action: 'user.update',
  resource: 'users',
  resourceId: user.id,
  oldValue: existingUser,
  newValue: updatedUser,
  request: req,
});
```

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Lighthouse Performance | ≥ 85 | Dashboards can be heavier |
| Time to First Data | < 1s | Initial table load |
| Table Pagination | < 200ms | Page switching |
| Form Submission | < 500ms | CRUD operations |
| Search Response | < 300ms | Quick search |

## Quality Checklist

### Before Release

- [ ] All CRUD operations work correctly
- [ ] RBAC permissions enforced on API and UI
- [ ] Audit logging capturing all changes
- [ ] Bulk operations work with large datasets
- [ ] Export/import functions tested
- [ ] Keyboard navigation works
- [ ] Dark mode renders correctly
- [ ] Loading states on all async operations

### Security

- [ ] All API routes check permissions
- [ ] Audit log cannot be tampered with
- [ ] Session timeout configured
- [ ] Sensitive data masked in logs
- [ ] Rate limiting on login attempts

---

> **Note**: This template prioritizes functionality and data density over visual flair. Admin interfaces should be efficient tools, not showcases.
