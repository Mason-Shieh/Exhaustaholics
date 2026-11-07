import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

export function createDatabase(connectionString = env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Database access is unavailable in demo mode.");
  }

  const client = postgres(connectionString, { prepare: false });
  return { client, db: drizzle(client, { schema }) };
}