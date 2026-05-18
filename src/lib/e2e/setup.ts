import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "dotenv";
import postgres from "postgres";

const E2E_DB_NAME = "dotvault_e2e";
const E2E_ENV_FILE = ".env.e2e";

const DEFAULT_E2E_ENV: Record<string, string> = {
  POSTGRES_USER: "dotvault_e2e",
  POSTGRES_PASSWORD: "dotvault_e2e_password",
  POSTGRES_DB: E2E_DB_NAME,
  DATABASE_URL:
    "postgresql://dotvault_e2e:dotvault_e2e_password@127.0.0.1:55433/dotvault_e2e",
  AUTH_SECRET: "0123456789abcdef0123456789abcdef",
  APP_URL: "http://127.0.0.1:3000",
  NODE_ENV: "test",
  BOOTSTRAP_ADMIN_EMAIL: "admin.e2e@example.com",
  BOOTSTRAP_ADMIN_PASSWORD: "correct-horse-battery-staple",
  BOOTSTRAP_ADMIN_DISPLAY_NAME: "E2E Admin",
};

export type E2eEnv = typeof DEFAULT_E2E_ENV;

export function getE2eEnvPath(root = process.cwd()): string {
  return resolve(root, E2E_ENV_FILE);
}

export function ensureE2eEnvFile(root = process.cwd()): string {
  const path = getE2eEnvPath(root);
  if (!existsSync(path)) {
    const content = `${Object.entries(DEFAULT_E2E_ENV)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")}\n`;
    writeFileSync(path, content, { mode: 0o600 });
  }
  return path;
}

export function loadE2eEnv(root = process.cwd()): E2eEnv {
  const envPath = ensureE2eEnvFile(root);
  const parsed = parse(readFileSync(envPath));
  const env = { ...DEFAULT_E2E_ENV, ...parsed };

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  return env;
}

export function assertSafeE2eReset(env: Record<string, string | undefined>) {
  if (env.NODE_ENV !== "test") {
    throw new Error("E2E reset requires NODE_ENV=test");
  }

  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error("E2E reset requires DATABASE_URL");

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("E2E reset requires valid DATABASE_URL");
  }

  if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw new Error("E2E reset requires local DATABASE_URL host");
  }

  if (parsed.port !== "55433") {
    throw new Error("E2E reset requires DATABASE_URL port 55433");
  }

  if (parsed.username !== "dotvault_e2e") {
    throw new Error("E2E reset requires DATABASE_URL user dotvault_e2e");
  }

  if (parsed.pathname !== `/${E2E_DB_NAME}`) {
    throw new Error("E2E reset requires DATABASE_URL database dotvault_e2e");
  }

  if (env.POSTGRES_DB && env.POSTGRES_DB !== E2E_DB_NAME) {
    throw new Error("E2E reset requires POSTGRES_DB=dotvault_e2e");
  }

  return parsed;
}

export async function resetE2eDatabase(env: Record<string, string | undefined>) {
  assertSafeE2eReset(env);
  const sql = postgres(env.DATABASE_URL!, { max: 1 });
  try {
    await sql`
      truncate table
        alias_provider_links,
        dot_aliases,
        gmail_accounts,
        providers,
        users
      restart identity cascade
    `;
  } finally {
    await sql.end();
  }
}

export function getE2eAdmin(env: Record<string, string | undefined> = loadE2eEnv()) {
  return {
    email: env.BOOTSTRAP_ADMIN_EMAIL ?? DEFAULT_E2E_ENV.BOOTSTRAP_ADMIN_EMAIL,
    password: env.BOOTSTRAP_ADMIN_PASSWORD ?? DEFAULT_E2E_ENV.BOOTSTRAP_ADMIN_PASSWORD,
  };
}
