import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let db: Db | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** Returns null when DATABASE_URL is missing — app still runs without Postgres. */
export function getDb(): Db | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;

  if (!db) {
    client = postgres(url, { max: 5, idle_timeout: 20 });
    db = drizzle(client, { schema });
  }

  return db;
}
