import { MongoClient } from "mongodb";

const globalForMongo = globalThis as unknown as { mongoPromise?: Promise<MongoClient> };

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!globalForMongo.mongoPromise) {
    globalForMongo.mongoPromise = new MongoClient(uri, { maxPoolSize: 8 }).connect();
  }
  return globalForMongo.mongoPromise;
}

export async function promptsCollection() {
  const client = await getClientPromise();
  const col = client.db("promptmatch").collection("prompts");
  await Promise.all([
    col.createIndex({ collectorKey: 1, createdAt: -1 }),
    col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 })
  ]);
  return col;
}
