import { describe, expect, it } from "vitest";
import { getAppUrl, getAuthSecret, getDatabaseUrl, getNodeEnv, isProduction } from "@/lib/env";

const VALID_SECRET = "0123456789abcdef0123456789abcdef";

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
});
