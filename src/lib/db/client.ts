import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  dotvaultPostgres?: postgres.Sql;
};

const sql = globalForDb.dotvaultPostgres ?? postgres(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForDb.dotvaultPostgres = sql;
}

export const db = drizzle(sql, { schema });
export { sql as dbClient };
