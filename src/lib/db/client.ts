import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDatabaseUrl } from "../env";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  dotvaultPostgres?: postgres.Sql;
};

export function getDbClient() {
  const existingClient = globalForDb.dotvaultPostgres;
  if (existingClient) return existingClient;

  const client = postgres(getDatabaseUrl());
  globalForDb.dotvaultPostgres = client;

  return client;
}

export function getDb() {
  return drizzle(getDbClient(), { schema });
}

export async function closeDbClient() {
  const client = globalForDb.dotvaultPostgres;
  if (!client) return;
  await client.end();
  globalForDb.dotvaultPostgres = undefined;
}
