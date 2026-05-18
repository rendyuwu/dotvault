import { describe, expect, it } from "vitest";
import { assertSafeE2eReset, getE2eAdmin } from "./setup";

describe("e2e database safety", () => {
  it("refuses resets outside test env", () => {
    expect(() =>
      assertSafeE2eReset({
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://user:pass@127.0.0.1:55433/dotvault_e2e",
      })
    ).toThrow("E2E reset requires NODE_ENV=test");
  });

  it("refuses the default development database", () => {
    expect(() =>
      assertSafeE2eReset({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://dotvault_e2e:pass@127.0.0.1:55433/dotvault",
      })
    ).toThrow("E2E reset requires DATABASE_URL database dotvault_e2e");
  });

  it("refuses remote e2e-looking databases", () => {
    expect(() =>
      assertSafeE2eReset({
        NODE_ENV: "test",
        POSTGRES_DB: "dotvault_e2e",
        DATABASE_URL:
          "postgresql://dotvault_e2e:pass@staging.example.com:55433/dotvault_e2e",
      })
    ).toThrow("E2E reset requires local DATABASE_URL host");
  });

  it("refuses wrong e2e ports", () => {
    expect(() =>
      assertSafeE2eReset({
        NODE_ENV: "test",
        POSTGRES_DB: "dotvault_e2e",
        DATABASE_URL:
          "postgresql://dotvault_e2e:pass@127.0.0.1:5432/dotvault_e2e",
      })
    ).toThrow("E2E reset requires DATABASE_URL port 55433");
  });

  it("refuses wrong e2e database users", () => {
    expect(() =>
      assertSafeE2eReset({
        NODE_ENV: "test",
        POSTGRES_DB: "dotvault_e2e",
        DATABASE_URL:
          "postgresql://postgres:pass@127.0.0.1:55433/dotvault_e2e",
      })
    ).toThrow("E2E reset requires DATABASE_URL user dotvault_e2e");
  });

  it("accepts only the dedicated e2e database", () => {
    expect(() =>
      assertSafeE2eReset({
        NODE_ENV: "test",
        POSTGRES_DB: "dotvault_e2e",
        DATABASE_URL:
          "postgresql://dotvault_e2e:pass@127.0.0.1:55433/dotvault_e2e",
      })
    ).not.toThrow();
  });

  it("reads admin credentials from loaded e2e env", () => {
    expect(
      getE2eAdmin({
        BOOTSTRAP_ADMIN_EMAIL: "override@example.com",
        BOOTSTRAP_ADMIN_PASSWORD: "override-password",
      })
    ).toEqual({
      email: "override@example.com",
      password: "override-password",
    });
  });
});
