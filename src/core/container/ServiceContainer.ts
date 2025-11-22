/**
 * Dependency Inversion Principle (DIP) - Contenedor de inyección de dependencias
 * Single Responsibility Principle (SRP) - Solo gestiona el ciclo de vida de dependencias
 * 
 * Contenedor simple de IoC (Inversion of Control)
 */

type Constructor<T = any> = new (...args: any[]) => T;
type Factory<T = any> = () => T;

export enum ServiceLifetime {
  Singleton = "singleton",
  Transient = "transient",
}

interface ServiceDescriptor<T = any> {
  lifetime: ServiceLifetime;
  implementation: Constructor<T> | Factory<T>;
  instance?: T;
}

export class ServiceContainer {
  private services = new Map<string, ServiceDescriptor>();

  /**
   * Registra un servicio singleton (una sola instancia)
   */
  registerSingleton<T>(
    key: string,
    implementation: Constructor<T> | Factory<T>
  ): void {
    this.services.set(key, {
      lifetime: ServiceLifetime.Singleton,
      implementation,
    });
  }

  /**
   * Registra un servicio transient (nueva instancia cada vez)
   */
  registerTransient<T>(
    key: string,
    implementation: Constructor<T> | Factory<T>
  ): void {
    this.services.set(key, {
      lifetime: ServiceLifetime.Transient,
      implementation,
    });
  }

  /**
   * Registra una instancia ya creada
   */
  registerInstance<T>(key: string, instance: T): void {
    this.services.set(key, {
      lifetime: ServiceLifetime.Singleton,
      implementation: () => instance,
      instance,
    });
  }

  /**
   * Resuelve un servicio del contenedor
   */
  resolve<T>(key: string): T {
    const descriptor = this.services.get(key);

    if (!descriptor) {
      throw new Error(`Servicio no registrado: ${key}`);
    }

    // Singleton: reutilizar instancia existente
    if (descriptor.lifetime === ServiceLifetime.Singleton) {
      if (!descriptor.instance) {
        descriptor.instance = this.createInstance(descriptor.implementation);
      }
      return descriptor.instance as T;
    }

    // Transient: crear nueva instancia
    return this.createInstance(descriptor.implementation) as T;
  }

  /**
   * Verifica si un servicio está registrado
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Limpia todas las instancias singleton (útil para testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Crea una instancia desde un constructor o factory
   */
  private createInstance<T>(
    implementation: Constructor<T> | Factory<T>
  ): T {
    if (this.isConstructor(implementation)) {
      return new implementation();
    }
    return implementation();
  }

  /**
   * Determina si es un constructor o factory
   */
  private isConstructor<T>(
    fn: Constructor<T> | Factory<T>
  ): fn is Constructor<T> {
    return fn.prototype && fn.prototype.constructor === fn;
  }
}

// Contenedor global singleton
export const container = new ServiceContainer();
