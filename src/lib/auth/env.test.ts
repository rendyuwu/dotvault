import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getAppUrl, getAuthSecret, getDatabaseUrl, getNodeEnv, isProduction } from "@/lib/env";

const VALID_SECRET = "0123456789abcdef0123456789abcdef";
const ROOT = resolve(__dirname, "../../..");

function readRootFile(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function parseEnv(content: string): Record<string, string> {
  return Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
}

describe("environment helpers", () => {
  it("requires core env vars", () => {
    expect(() => getDatabaseUrl({})).toThrow("DATABASE_URL is required");
    expect(() => getNodeEnv({})).toThrow("NODE_ENV is required");
    expect(() => getAuthSecret({ NODE_ENV: "test" })).toThrow("AUTH_SECRET is required");
  });

  it("validates auth secret length", () => {
    expect(() =>
      getAuthSecret({ NODE_ENV: "test", AUTH_SECRET: "too-short" })
    ).toThrow("AUTH_SECRET must be at least 32 characters");
  });

  it("rejects placeholder auth secrets in production", () => {
    expect(() =>
      getAuthSecret({
        NODE_ENV: "production",
        AUTH_SECRET: "dotvault-dev-auth-secret-change-me",
      })
    ).toThrow("AUTH_SECRET must not use a placeholder value in production");
  });

  it("accepts strong production auth secrets", () => {
    expect(
      getAuthSecret({ NODE_ENV: "production", AUTH_SECRET: VALID_SECRET })
    ).toBe(VALID_SECRET);
  });

  it("validates APP_URL when requested", () => {
    expect(() => getAppUrl({ APP_URL: "not-url" })).toThrow("APP_URL must be a valid URL");
    expect(getAppUrl({ APP_URL: "http://127.0.0.1:3000" })).toBe("http://127.0.0.1:3000/");
  });

  it("detects production mode", () => {
    expect(isProduction({ NODE_ENV: "production" })).toBe(true);
    expect(isProduction({ NODE_ENV: "development" })).toBe(false);
  });

  it("keeps env example aligned with required env vars", () => {
    const sample = parseEnv(readRootFile(".env.example"));

    expect(sample).toMatchObject({
      DATABASE_URL: expect.any(String),
      AUTH_SECRET: expect.any(String),
      APP_URL: expect.any(String),
      NODE_ENV: expect.any(String),
      BOOTSTRAP_ADMIN_EMAIL: expect.any(String),
      BOOTSTRAP_ADMIN_PASSWORD: expect.any(String),
    });
    expect(sample.POSTGRES_PASSWORD).toContain("replace-");
    expect(sample.BOOTSTRAP_ADMIN_PASSWORD).toContain("replace-");
    expect(sample.AUTH_SECRET).toContain("change-me");
    expect(() =>
      getAuthSecret({ NODE_ENV: "production", AUTH_SECRET: sample.AUTH_SECRET })
    ).toThrow();
  });

  it("documents PostgreSQL backups through compose", () => {
    const backupDocs = readRootFile("BACKUP.md");

    expect(backupDocs).toContain("pg_dump");
    expect(backupDocs).toContain("postgres");
    expect(backupDocs).toContain("postgres_data");
  });
});
