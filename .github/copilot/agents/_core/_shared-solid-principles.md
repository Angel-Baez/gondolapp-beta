# 🏛️ Principios SOLID para TypeScript y React

> **Este documento define los principios SOLID con ejemplos prácticos para el stack MERN + Next.js + TypeScript.**
> Todos los agentes deben aplicar estos principios en sus recomendaciones de código.

---

## 📚 Resumen de Principios

| Principio | Descripción | Beneficio |
|-----------|-------------|-----------|
| **S** - Single Responsibility | Una clase/función tiene una sola razón para cambiar | Código más mantenible |
| **O** - Open/Closed | Abierto para extensión, cerrado para modificación | Código más flexible |
| **L** - Liskov Substitution | Subtipos deben ser sustituibles por sus tipos base | Código más predecible |
| **I** - Interface Segregation | Interfaces específicas mejor que una general | Código más desacoplado |
| **D** - Dependency Inversion | Depender de abstracciones, no de concreciones | Código más testeable |

---

## S - Single Responsibility Principle (SRP)

### Definición
> Una clase o módulo debe tener **una sola razón para cambiar**.

### ❌ Violación del SRP

```typescript
// src/core/services/user.service.ts
// MAL: Este servicio hace demasiadas cosas
class UserService {
  async createUser(data: CreateUserDTO) {
    // Validación
    if (!data.email.includes("@")) {
      throw new Error("Email inválido");
    }
    
    // Hash de password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    // Persistencia
    const user = await UserModel.create({
      ...data,
      password: hashedPassword,
    });
    
    // Envío de email
    await sendGrid.send({
      to: user.email,
      subject: "Bienvenido",
      template: "welcome",
    });
    
    // Logging
    console.log(`Usuario creado: ${user.id}`);
    
    // Analytics
    await analytics.track("user_created", { userId: user.id });
    
    return user;
  }
}
```

### ✅ Aplicando SRP

```typescript
// src/lib/validations/user.schema.ts
export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8),
  name: z.string().min(2),
});

// src/core/services/password.service.ts
export class PasswordService {
  private readonly SALT_ROUNDS = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// src/core/services/email.service.ts
export class EmailService {
  async sendWelcome(user: User): Promise<void> {
    await this.send({
      to: user.email,
      subject: "Bienvenido",
      template: "welcome",
      data: { name: user.name },
    });
  }
}

// src/core/services/user.service.ts
export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly eventBus: EventBus
  ) {}

  async createUser(dto: CreateUserDTO): Promise<User> {
    const hashedPassword = await this.passwordService.hash(dto.password);
    
    const user = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    
    // Emitir evento para side effects
    await this.eventBus.emit(new UserCreatedEvent(user));
    
    return user;
  }
}

// src/core/events/handlers/user-created.handler.ts
export class UserCreatedHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly analytics: AnalyticsService
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    await Promise.all([
      this.emailService.sendWelcome(event.user),
      this.analytics.track("user_created", { userId: event.user.id }),
    ]);
  }
}
```

### Aplicación en React Components

```tsx
// ❌ MAL: Componente con múltiples responsabilidades
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);
  
  const handleUpdate = async (data: UpdateUserDTO) => {
    await fetch(`/api/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  };
  
  if (loading) return <Spinner />;
  
  return (
    <form onSubmit={handleUpdate}>
      {/* Formulario complejo */}
    </form>
  );
}

// ✅ BIEN: Separación de responsabilidades
// Hook para data fetching
function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => userApi.getById(userId),
  });
}

// Hook para mutations
function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

// Componente de presentación
function UserProfileForm({ user, onSubmit }: UserProfileFormProps) {
  const form = useForm<UpdateUserDTO>({
    defaultValues: user,
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="name" render={/* ... */} />
        <FormField name="email" render={/* ... */} />
        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}

// Componente contenedor
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  const { mutate: updateUser } = useUpdateUser();
  
  if (isLoading) return <Skeleton />;
  if (!user) return <NotFound />;
  
  return <UserProfileForm user={user} onSubmit={updateUser} />;
}
```

---

## O - Open/Closed Principle (OCP)

### Definición
> Las entidades de software deben estar **abiertas para extensión** pero **cerradas para modificación**.

### ❌ Violación del OCP

```typescript
// MAL: Necesitamos modificar la clase cada vez que agregamos un tipo de notificación
class NotificationService {
  async send(type: string, recipient: string, message: string) {
    switch (type) {
      case "email":
        await this.sendEmail(recipient, message);
        break;
      case "sms":
        await this.sendSMS(recipient, message);
        break;
      case "push":
        await this.sendPush(recipient, message);
        break;
      // Cada nuevo tipo requiere modificar esta clase
      default:
        throw new Error("Tipo no soportado");
    }
  }
}
```

### ✅ Aplicando OCP

```typescript
// src/core/domain/interfaces/notification.interface.ts
export interface INotificationChannel {
  type: string;
  send(recipient: string, message: string): Promise<void>;
}

// src/core/services/notifications/email.channel.ts
export class EmailChannel implements INotificationChannel {
  type = "email";
  
  async send(recipient: string, message: string): Promise<void> {
    await resend.emails.send({
      to: recipient,
      subject: "Notificación",
      html: message,
    });
  }
}

// src/core/services/notifications/sms.channel.ts
export class SMSChannel implements INotificationChannel {
  type = "sms";
  
  async send(recipient: string, message: string): Promise<void> {
    await twilio.messages.create({
      to: recipient,
      body: message,
    });
  }
}

// src/core/services/notifications/push.channel.ts
export class PushChannel implements INotificationChannel {
  type = "push";
  
  async send(recipient: string, message: string): Promise<void> {
    await webPush.sendNotification(recipient, message);
  }
}

// src/core/services/notification.service.ts
export class NotificationService {
  private channels: Map<string, INotificationChannel> = new Map();

  registerChannel(channel: INotificationChannel): void {
    this.channels.set(channel.type, channel);
  }

  async send(type: string, recipient: string, message: string): Promise<void> {
    const channel = this.channels.get(type);
    if (!channel) {
      throw new Error(`Canal de notificación '${type}' no registrado`);
    }
    await channel.send(recipient, message);
  }
}

// Uso: Agregar nuevos canales sin modificar NotificationService
const notificationService = new NotificationService();
notificationService.registerChannel(new EmailChannel());
notificationService.registerChannel(new SMSChannel());
notificationService.registerChannel(new PushChannel());
// Fácil agregar: notificationService.registerChannel(new WhatsAppChannel());
```

### Aplicación en React Components

```tsx
// ✅ Componente extensible con slots y composición
interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

function Card({ children, header, footer }: CardProps) {
  return (
    <div className="rounded-lg border bg-card">
      {header && <div className="border-b p-4">{header}</div>}
      <div className="p-4">{children}</div>
      {footer && <div className="border-t p-4">{footer}</div>}
    </div>
  );
}

// Extensión sin modificar Card
function UserCard({ user }: { user: User }) {
  return (
    <Card
      header={<Avatar user={user} />}
      footer={<UserActions userId={user.id} />}
    >
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </Card>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card
      header={<ProductImage src={product.image} />}
      footer={<AddToCartButton productId={product.id} />}
    >
      <h3>{product.name}</h3>
      <Price amount={product.price} />
    </Card>
  );
}
```

---

## L - Liskov Substitution Principle (LSP)

### Definición
> Los objetos de una clase derivada deben poder **sustituir** a los objetos de la clase base sin alterar el comportamiento correcto del programa.

### ❌ Violación del LSP

```typescript
// MAL: Square viola LSP al heredar de Rectangle
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  
  setWidth(width: number): void {
    this.width = width;
  }
  
  setHeight(height: number): void {
    this.height = height;
  }
  
  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(width: number): void {
    this.width = width;
    this.height = width; // Viola LSP: cambia comportamiento esperado
  }
  
  setHeight(height: number): void {
    this.width = height;
    this.height = height; // Viola LSP
  }
}

// Este código falla con Square
function increaseRectangleWidth(rect: Rectangle) {
  const originalHeight = rect.getArea() / rect.width;
  rect.setWidth(rect.width + 10);
  // Esperamos que la altura permanezca igual
  // Pero con Square, la altura también cambia
}
```

### ✅ Aplicando LSP

```typescript
// BIEN: Usar interfaces y composición
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private readonly width: number,
    private readonly height: number
  ) {}
  
  getArea(): number {
    return this.width * this.height;
  }
  
  withWidth(width: number): Rectangle {
    return new Rectangle(width, this.height);
  }
  
  withHeight(height: number): Rectangle {
    return new Rectangle(this.width, height);
  }
}

class Square implements Shape {
  constructor(private readonly side: number) {}
  
  getArea(): number {
    return this.side * this.side;
  }
  
  withSide(side: number): Square {
    return new Square(side);
  }
}

// Ahora cualquier Shape puede calcular su área correctamente
function printArea(shape: Shape) {
  console.log(`Área: ${shape.getArea()}`);
}
```

### Aplicación en React Components

```tsx
// ✅ Props base que todos los inputs deben soportar
interface InputBaseProps {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
}

// Todos los inputs heredan y extienden correctamente
interface TextInputProps extends InputBaseProps {
  type?: "text" | "email" | "password";
  placeholder?: string;
}

interface SelectInputProps extends InputBaseProps {
  options: { value: string; label: string }[];
}

interface DateInputProps extends InputBaseProps {
  minDate?: Date;
  maxDate?: Date;
}

// Componente genérico que acepta cualquier input que cumpla la interfaz base
function FormField({ input: Input, ...props }: { input: React.ComponentType<InputBaseProps> } & InputBaseProps) {
  return (
    <div className="space-y-1">
      <Input {...props} />
      {props.error && <span className="text-destructive text-sm">{props.error}</span>}
    </div>
  );
}
```

---

## I - Interface Segregation Principle (ISP)

### Definición
> Los clientes no deben depender de interfaces que no utilizan. Es mejor tener **interfaces específicas** que una interfaz general.

### ❌ Violación del ISP

```typescript
// MAL: Interfaz demasiado grande
interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar: string;
  preferences: UserPreferences;
  subscription: Subscription;
  paymentMethods: PaymentMethod[];
  orders: Order[];
  
  // Métodos
  authenticate(password: string): boolean;
  updateProfile(data: UpdateProfileDTO): void;
  changePassword(oldPassword: string, newPassword: string): void;
  subscribe(plan: Plan): void;
  cancelSubscription(): void;
  addPaymentMethod(method: PaymentMethod): void;
  placeOrder(order: Order): void;
}

// Un componente de perfil no necesita métodos de pagos u órdenes
```

### ✅ Aplicando ISP

```typescript
// BIEN: Interfaces segregadas por responsabilidad

// src/core/domain/interfaces/user-auth.interface.ts
interface IUserAuth {
  id: string;
  email: string;
  passwordHash: string;
  authenticate(password: string): boolean;
  changePassword(oldPassword: string, newPassword: string): void;
}

// src/core/domain/interfaces/user-profile.interface.ts
interface IUserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  updateProfile(data: UpdateProfileDTO): void;
}

// src/core/domain/interfaces/user-subscription.interface.ts
interface IUserSubscription {
  userId: string;
  subscription: Subscription | null;
  subscribe(plan: Plan): void;
  cancelSubscription(): void;
}

// src/core/domain/interfaces/user-payments.interface.ts
interface IUserPayments {
  userId: string;
  paymentMethods: PaymentMethod[];
  addPaymentMethod(method: PaymentMethod): void;
  removePaymentMethod(methodId: string): void;
}

// Los servicios solo dependen de lo que necesitan
class ProfileService {
  constructor(private readonly userProfile: IUserProfile) {}
}

class PaymentService {
  constructor(private readonly userPayments: IUserPayments) {}
}
```

### Aplicación en React Props

```tsx
// ❌ MAL: Props inflados
interface UserCardProps {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
  createdAt: Date;
  lastLogin: Date;
  isOnline: boolean;
  subscription: Subscription;
  orders: Order[];
  onEdit: () => void;
  onDelete: () => void;
  onMessage: () => void;
  onViewOrders: () => void;
  // ... 20 props más
}

// ✅ BIEN: Props segregadas
interface UserAvatarProps {
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface UserInfoProps {
  name: string;
  email: string;
  role: string;
}

interface UserActionsProps {
  userId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Componentes compuestos que usan solo lo que necesitan
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <UserAvatar name={user.name} avatar={user.avatar} />
      <UserInfo name={user.name} email={user.email} role={user.role} />
      <UserActions userId={user.id} />
    </Card>
  );
}

function UserAvatar({ name, avatar, isOnline }: UserAvatarProps) {
  return (
    <div className="relative">
      <Avatar src={avatar} alt={name} />
      {isOnline && <OnlineIndicator />}
    </div>
  );
}
```

---

## D - Dependency Inversion Principle (DIP)

### Definición
> - Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de **abstracciones**.
> - Las abstracciones no deben depender de los detalles. Los detalles deben depender de las **abstracciones**.

### ❌ Violación del DIP

```typescript
// MAL: Servicio de alto nivel depende directamente de implementación
import { MongoClient } from "mongodb";

class UserService {
  private client: MongoClient;
  
  constructor() {
    // Dependencia directa de MongoDB
    this.client = new MongoClient(process.env.MONGODB_URI!);
  }
  
  async findUser(id: string) {
    const db = this.client.db("myapp");
    return db.collection("users").findOne({ _id: id });
  }
}

// Problemas:
// 1. No se puede testear sin MongoDB real
// 2. No se puede cambiar a otra BD sin modificar el servicio
// 3. Acoplamiento fuerte
```

### ✅ Aplicando DIP

```typescript
// src/core/domain/interfaces/user.repository.ts
// ABSTRACCIÓN: Define el contrato, no la implementación
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

// src/core/services/user.service.ts
// ALTO NIVEL: Depende de la abstracción
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }
    return user;
  }

  async createUser(dto: CreateUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException("El email ya está registrado");
    }
    return this.userRepository.create(dto);
  }
}

// src/core/repositories/mongodb/user.repository.ts
// BAJO NIVEL: Implementación concreta de MongoDB
export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email }).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async create(data: CreateUserDTO): Promise<User> {
    const doc = await UserModel.create(data);
    return this.toDomain(doc);
  }

  private toDomain(doc: UserDocument): User {
    return new User({
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
    });
  }
}

// src/lib/di/container.ts
// Inyección de dependencias
const userRepository = new MongoUserRepository();
const userService = new UserService(userRepository);

// tests/unit/services/user.service.test.ts
// Fácil de testear con mocks
describe("UserService", () => {
  it("should create user", async () => {
    const mockRepository: IUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const service = new UserService(mockRepository);
    const result = await service.createUser(createUserDto);

    expect(result).toEqual(mockUser);
    expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
  });
});
```

### Aplicación en React con Context

```tsx
// src/contexts/auth.context.tsx
// Abstracción del servicio de auth
interface IAuthService {
  login(credentials: Credentials): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
}

// Context que provee la abstracción
const AuthContext = createContext<IAuthService | null>(null);

// Hook para consumir
export function useAuth(): IAuthService {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Provider con implementación real
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authService: IAuthService = useMemo(() => ({
    login: async (credentials) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      return response.json();
    },
    logout: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    getCurrentUser: () => session?.user ?? null,
  }), [session]);

  return (
    <AuthContext.Provider value={authService}>
      {children}
    </AuthContext.Provider>
  );
}

// Componentes dependen de la abstracción
function LoginButton() {
  const { login } = useAuth();
  // ...
}

// Tests pueden proveer mock
function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const mockAuth: IAuthService = {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: () => mockUser,
  };
  
  return (
    <AuthContext.Provider value={mockAuth}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 📋 Checklist de Revisión SOLID

Usa esta checklist al revisar código:

### Single Responsibility
- [ ] ¿La clase/componente tiene una sola razón para cambiar?
- [ ] ¿El nombre describe claramente su única responsabilidad?
- [ ] ¿Tiene menos de 200 líneas?

### Open/Closed
- [ ] ¿Se puede extender el comportamiento sin modificar el código existente?
- [ ] ¿Usa composición sobre herencia?
- [ ] ¿Las variaciones están encapsuladas en clases separadas?

### Liskov Substitution
- [ ] ¿Las clases derivadas pueden sustituir a las base sin problemas?
- [ ] ¿Los overrides mantienen el contrato de la base?
- [ ] ¿No hay excepciones inesperadas en subclases?

### Interface Segregation
- [ ] ¿Las interfaces son pequeñas y específicas?
- [ ] ¿Los clientes solo dependen de lo que usan?
- [ ] ¿No hay métodos sin implementar o con `throw new NotImplementedError()`?

### Dependency Inversion
- [ ] ¿Las dependencias se inyectan, no se instancian?
- [ ] ¿Se depende de abstracciones (interfaces)?
- [ ] ¿Es fácil de testear con mocks?

---

> **Referencia:** Consulta ejemplos adicionales en el código del proyecto y aplica estos principios consistentemente.
