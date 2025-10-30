// src/lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

// Get the connection string from your .env
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the postgres client
const client = postgres(connectionString);

// Create the drizzle database instance with schema
export const db = drizzle(client, { schema });
