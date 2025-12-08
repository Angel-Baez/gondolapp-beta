# 🏗️ Framework Context - MERN Stack + Next.js + TypeScript

> **Este archivo define el contexto técnico compartido entre todos los agentes del framework.**
> Todos los agentes deben leer este archivo para entender el stack tecnológico y la arquitectura.

---

## 📚 Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 14+ | Framework React con App Router |
| **React** | 18+ | Biblioteca de UI |
| **TypeScript** | 5.0+ | Tipado estático |
| **Tailwind CSS** | 3.4+ | Utility-first CSS |
| **shadcn/ui** | latest | Componentes UI accesibles |
| **Zustand** | 4+ | Estado global ligero |
| **React Hook Form** | 7+ | Manejo de formularios |
| **Zod** | 3+ | Validación de esquemas |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js API Routes** | 14+ | Endpoints serverless |
| **MongoDB** | 7.0+ | Base de datos NoSQL |
| **Mongoose** | 8.0+ | ODM para MongoDB |
| **NextAuth.js** | 5+ | Autenticación |
| **bcryptjs** | 2+ | Hash de contraseñas |
| **jose** | 5+ | JWT handling |

### Infraestructura

| Tecnología | Propósito |
|------------|-----------|
| **Vercel** | Deployment y hosting |
| **MongoDB Atlas** | Base de datos cloud |
| **GitHub Actions** | CI/CD |
| **Vitest** | Testing unitario |
| **Playwright** | Testing E2E |

---

## 🏛️ Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Next.js App Router (src/app/)                                          ││
│  │  ├── Pages & Layouts                                                    ││
│  │  ├── Server Components (RSC)                                            ││
│  │  └── Client Components ('use client')                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  React Components (src/components/)                                     ││
│  │  ├── ui/        → Componentes base (Button, Input, Card...)             ││
│  │  ├── features/  → Componentes de features (UserCard, ProductList...)    ││
│  │  └── layouts/   → Layouts compartidos                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                            APPLICATION LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  API Routes (src/app/api/)                                              ││
│  │  ├── REST Endpoints                                                     ││
│  │  ├── Request Validation (Zod)                                           ││
│  │  └── Response Formatting                                                ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Services (src/core/services/)                                          ││
│  │  ├── Business Logic                                                     ││
│  │  ├── Use Cases                                                          ││
│  │  └── Orchestration                                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                              DOMAIN LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Domain (src/core/domain/)                                              ││
│  │  ├── Entities        → Objetos de negocio                               ││
│  │  ├── Value Objects   → Objetos inmutables                               ││
│  │  ├── Interfaces      → Contratos (IUserRepository, etc.)                ││
│  │  └── Exceptions      → Errores de dominio                               ││
│  └─────────────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────────────┤
│                          INFRASTRUCTURE LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Repositories (src/core/repositories/)                                  ││
│  │  ├── MongoDB Implementation                                             ││
│  │  ├── Data Mapping                                                       ││
│  │  └── Query Building                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  External Services (src/lib/)                                           ││
│  │  ├── Database Connection                                                ││
│  │  ├── Auth Providers                                                     ││
│  │  └── Third-party APIs                                                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Proyecto Estándar

```
proyecto/
├── .github/
│   ├── workflows/                    # GitHub Actions
│   │   ├── ci.yml
│   │   └── deploy.yml
│   └── copilot/
│       └── agents/                   # Agentes del framework
│           ├── _core/
│           └── *.md
│
├── public/
│   ├── icons/                        # Íconos PWA
│   └── manifest.json                 # Web App Manifest
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Grupo: rutas de auth
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/              # Grupo: rutas protegidas
│   │   │   ├── layout.tsx            # Layout con sidebar
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   └── [entity]/             # CRUD dinámico
│   │   │       ├── page.tsx          # Lista
│   │   │       ├── new/
│   │   │       │   └── page.tsx      # Crear
│   │   │       └── [id]/
│   │   │           ├── page.tsx      # Ver detalle
│   │   │           └── edit/
│   │   │               └── page.tsx  # Editar
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── [entity]/
│   │   │       ├── route.ts          # GET (list), POST (create)
│   │   │       └── [id]/
│   │   │           └── route.ts      # GET, PUT, DELETE
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx                # Root Layout
│   │   └── page.tsx                  # Landing page
│   │
│   ├── components/
│   │   ├── ui/                       # Componentes base (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── features/                 # Componentes de features
│   │   │   ├── auth/
│   │   │   │   ├── login-form.tsx
│   │   │   │   └── register-form.tsx
│   │   │   └── [entity]/
│   │   │       ├── [entity]-list.tsx
│   │   │       ├── [entity]-card.tsx
│   │   │       └── [entity]-form.tsx
│   │   │
│   │   └── layouts/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   │
│   ├── core/
│   │   ├── domain/                   # Capa de dominio
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   └── [entity].entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── email.vo.ts
│   │   │   │   └── money.vo.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── user.repository.ts
│   │   │   │   └── [entity].repository.ts
│   │   │   └── exceptions/
│   │   │       ├── domain.exception.ts
│   │   │       └── validation.exception.ts
│   │   │
│   │   ├── services/                 # Lógica de negocio
│   │   │   ├── user.service.ts
│   │   │   └── [entity].service.ts
│   │   │
│   │   └── repositories/             # Implementación de repos
│   │       ├── user.repository.ts
│   │       └── [entity].repository.ts
│   │
│   ├── lib/                          # Utilidades y configuración
│   │   ├── db/
│   │   │   ├── connection.ts         # Conexión MongoDB
│   │   │   └── models/               # Modelos Mongoose
│   │   │       ├── user.model.ts
│   │   │       └── [entity].model.ts
│   │   ├── auth/
│   │   │   └── auth.config.ts        # NextAuth config
│   │   ├── validations/
│   │   │   └── schemas.ts            # Zod schemas
│   │   └── utils/
│   │       ├── cn.ts                 # Class names utility
│   │       └── formatters.ts
│   │
│   └── types/                        # Tipos TypeScript
│       ├── index.ts
│       ├── api.types.ts
│       └── [entity].types.ts
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── components/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       └── *.spec.ts
│
├── .env.local                        # Variables de entorno (no commitear)
├── .env.example                      # Ejemplo de variables
├── .eslintrc.json
├── .gitignore
├── components.json                   # Config shadcn/ui
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 🎯 Patrones de Diseño Recomendados

### 1. Repository Pattern

```typescript
// src/core/domain/interfaces/user.repository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filter?: UserFilter): Promise<User[]>;
  create(user: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

// src/core/repositories/user.repository.ts
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }
  
  private toDomain(doc: UserDocument): User {
    return new User({
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      role: doc.role,
    });
  }
}
```

### 2. Service Layer Pattern

```typescript
// src/core/services/user.service.ts
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(dto: CreateUserDTO): Promise<User> {
    // Validaciones de negocio
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new DomainException("El email ya está registrado");
    }

    // Lógica de negocio
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    
    return this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
  }
}
```

### 3. DTO Pattern

```typescript
// src/types/user.types.ts
export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
}

// Validación con Zod
export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().min(2, "Nombre muy corto"),
});
```

### 4. Factory Pattern para Componentes

```typescript
// src/components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        isLoading && "opacity-50 cursor-not-allowed"
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
```

---

## 🔧 Comandos Estándar

```bash
# Desarrollo
npm run dev                  # Servidor de desarrollo
npm run build               # Build de producción
npm run start               # Servidor de producción

# Testing
npm run test                # Tests unitarios (Vitest)
npm run test:watch          # Tests en modo watch
npm run test:coverage       # Cobertura de tests
npm run test:e2e            # Tests E2E (Playwright)

# Calidad de código
npm run lint                # ESLint
npm run lint:fix            # ESLint con auto-fix
npm run format              # Prettier
npm run type-check          # TypeScript check

# Base de datos
npm run db:seed             # Seed de datos iniciales
npm run db:migrate          # Migraciones (si aplica)

# Otros
npm run analyze             # Análisis de bundle
npm run lighthouse          # Auditoría Lighthouse
```

---

## 📖 Referencias

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)

---

> **Nota:** Este archivo es la fuente de verdad para el stack tecnológico. Consulta `project-context.yml` para la configuración específica de cada proyecto.
