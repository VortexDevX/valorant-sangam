import { MongoClient, ServerApiVersion } from "mongodb";

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function getDb() {
  if (!global.__mongoClientPromise) {
    const client = new MongoClient(getRequiredEnv("MONGODB_URI"), {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    global.__mongoClientPromise = client.connect();
  }

  const dbName = getRequiredEnv("MONGODB_DB_NAME");
  const connectedClient = await global.__mongoClientPromise;
  return connectedClient.db(dbName);
}
