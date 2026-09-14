import mongoose from "mongoose";

/**
 * Cached connection. Next.js dev reloads modules on every edit and serverless
 * -style workers can spin up repeatedly, so the connection promise is parked
 * on globalThis to avoid exhausting the Mongo connection pool.
 */
const globalForMongoose = globalThis;

if (!globalForMongoose.__skynestMongoose) {
  globalForMongoose.__skynestMongoose = { conn: null, promise: null };
}

const cache = globalForMongoose.__skynestMongoose;

mongoose.set("strictQuery", true);

export async function dbConnect() {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and fill it in."
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB || undefined,
        // Fail fast instead of hanging a request for 30s when Mongo is down.
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 1,
        // Buffering hides connection problems behind slow requests.
        bufferCommands: false,
      })
      .then((m) => m.connection);
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Reset so the next request retries instead of reusing a rejected promise.
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

export default dbConnect;
