import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not configured");

const globalForMongo = globalThis as unknown as { mongoPromise?: Promise<MongoClient> };
export const clientPromise = globalForMongo.mongoPromise ?? new MongoClient(uri, { maxPoolSize: 8 }).connect();
if (process.env.NODE_ENV !== "production") globalForMongo.mongoPromise = clientPromise;

export async function promptsCollection() {
  const client = await clientPromise;
  const col = client.db("promptmatch").collection("prompts");
  await Promise.all([
    col.createIndex({ collectorKey: 1, createdAt: -1 }),
    col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 })
  ]);
  return col;
}