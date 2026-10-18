import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim() || "portfolio";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.length > 0);
}

export async function getMongoDb(): Promise<Db | null> {
  if (!clientPromise) return null;
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    return null;
  }
}

export async function testMongoConnection(): Promise<{
  success: boolean;
  message: string;
  dbName: string;
  uriMasked: string;
  collections: string[];
}> {
  if (!uri) {
    return {
      success: false,
      message: "MONGODB_URI is not set in .env. Running on local JSON storage.",
      dbName,
      uriMasked: "None",
      collections: [],
    };
  }

  // Mask sensitive parts of the URI for display
  const uriMasked = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");

  try {
    const db = await getMongoDb();
    if (!db) {
      return {
        success: false,
        message: "Could not obtain database instance.",
        dbName,
        uriMasked,
        collections: [],
      };
    }
    const cols = await db.listCollections().toArray();
    return {
      success: true,
      message: "Successfully connected to MongoDB!",
      dbName,
      uriMasked,
      collections: cols.map((c) => c.name),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed.",
      dbName,
      uriMasked,
      collections: [],
    };
  }
}
