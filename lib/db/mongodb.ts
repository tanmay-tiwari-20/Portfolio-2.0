import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim() || "portfolio";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
function connection(): Promise<MongoClient> | null {
  if (!uri) return null;
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const nextClient = new MongoClient(uri);
      global._mongoClientPromise = nextClient.connect().catch((error) => {
        global._mongoClientPromise = undefined;
        throw error;
      });
    }
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect().catch((error) => { clientPromise = null; throw error; });
  }
  return clientPromise;
}

export function isMongoConfigured(): boolean {
  return Boolean(uri && uri.length > 0);
}

export async function getMongoDb(): Promise<Db | null> {
  const pending = connection();
  if (!pending) return null;
  try {
    const connectedClient = await pending;
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
