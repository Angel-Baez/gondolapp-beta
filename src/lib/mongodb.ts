import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "❌ MONGODB_URI no está configurado en las variables de entorno."
  );
  console.error("Por favor:");
  console.error("1. Crea un archivo .env.local en la raíz del proyecto");
  console.error('2. Agrega: MONGODB_URI="tu-connection-string-aqui"');
  console.error("3. Reinicia el servidor (npm run dev)\n");
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

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

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

// Exportar el cliente promise para Next.js API routes
export default clientPromise;

// Helper para obtener la base de datos directamente
export async function getDatabase(): Promise<Db> {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI no está configurado. Por favor configura tu archivo .env.local con MONGODB_URI"
    );
  }

  const client = await clientPromise;
  return client.db("gondolapp"); // Nombre de tu base de datos
}
