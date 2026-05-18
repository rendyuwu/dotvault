import { describe, expect, it } from "vitest";
import { assertSafeE2eReset } from "./setup";

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
        DATABASE_URL: "postgresql://dotvault:pass@127.0.0.1:5433/dotvault",
      })
    ).toThrow("E2E reset requires DATABASE_URL database dotvault_e2e");
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
});
