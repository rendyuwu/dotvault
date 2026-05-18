import { afterEach, describe, expect, it } from "vitest";
import { closeDbClient, getDbClient } from "./client";

describe("database client", () => {
  afterEach(async () => {
    await closeDbClient();
  });

  it("reuses one postgres client in production", () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

    try {
      const firstClient = getDbClient();
      const secondClient = getDbClient();

      expect(secondClient).toBe(firstClient);
    } finally {
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
    }
  });
});
