import "server-only";

const MIN_AUTH_SECRET_LENGTH = 32;
const PLACEHOLDER_SECRET_PATTERNS = [
  /change[-_]?me/i,
  /placeholder/i,
  /dotvault-dev-auth-secret-change-me/i,
  /^dev[-_]?secret$/i,
];

type Env = Record<string, string | undefined>;

function readRequiredEnv(env: Env, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function isPlaceholderSecret(value: string): boolean {
  return PLACEHOLDER_SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export function getNodeEnv(env: Env = process.env): string {
  return readRequiredEnv(env, "NODE_ENV");
}

export function isProduction(env: Env = process.env): boolean {
  return getNodeEnv(env) === "production";
}

export function getDatabaseUrl(env: Env = process.env): string {
  return readRequiredEnv(env, "DATABASE_URL");
}

export function getAppUrl(env: Env = process.env): string {
  const value = readRequiredEnv(env, "APP_URL");
  try {
    return new URL(value).toString();
  } catch {
    throw new Error("APP_URL must be a valid URL");
  }
}

export function getAuthSecret(env: Env = process.env): string {
  const value = readRequiredEnv(env, "AUTH_SECRET");
  if (value.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters`);
  }
  if (isProduction(env) && isPlaceholderSecret(value)) {
    throw new Error("AUTH_SECRET must not use a placeholder value in production");
  }
  return value;
}
