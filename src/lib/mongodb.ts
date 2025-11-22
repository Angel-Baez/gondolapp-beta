import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

// Solo mostrar advertencias en runtime, no durante el build
if (
  !MONGODB_URI &&
  typeof window === "undefined" &&
  process.env.NODE_ENV !== "production"
) {
  console.warn(
    "⚠️ MONGODB_URI no está configurado en las variables de entorno."
  );
  console.warn("Configura .env.local con MONGODB_URI para habilitar MongoDB");
}

const uri = MONGODB_URI || "";
const options = {
  // Opciones mejoradas para evitar problemas SSL con Node.js 22+
  tlsAllowInvalidCertificates: process.env.NODE_ENV === "development",
  serverSelectionTimeoutMS: 10000, // Aumentar timeout a 10s
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000, // Timeout de conexión inicial
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

// Solo inicializar el cliente si hay URI configurado
if (MONGODB_URI && typeof window === "undefined") {
  if (process.env.NODE_ENV === "development") {
    // En desarrollo, usa una variable global para preservar el cliente entre hot reloads
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // En producción, es mejor no usar una variable global
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Exportar el cliente promise para Next.js API routes
export default clientPromise;

// Helper para obtener la base de datos directamente
export async function getDatabase(): Promise<Db> {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI no está configurado. Por favor configura tu archivo .env.local con MONGODB_URI"
    );
  }

  if (!clientPromise) {
    throw new Error("MongoDB client no está inicializado");
  }

  const client = await clientPromise;
  return client.db("gondolapp"); // Nombre de tu base de datos
}
