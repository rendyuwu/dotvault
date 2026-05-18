import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  aliasProviderLinks,
  dotAliases,
  gmailAccounts,
  providers,
  users,
} from "./schema";

function readInitialMigration() {
  const migrationDir = join(process.cwd(), "drizzle");
  const migrationFile = readdirSync(migrationDir).find((file) => file.endsWith(".sql"));

  if (!migrationFile) {
    throw new Error("Drizzle migration SQL file not found");
  }

  return readFileSync(join(migrationDir, migrationFile), "utf8");
}

describe("database schema", () => {
  it("exports required tables", () => {
    expect(users).toBeDefined();
    expect(gmailAccounts).toBeDefined();
    expect(dotAliases).toBeDefined();
    expect(providers).toBeDefined();
    expect(aliasProviderLinks).toBeDefined();
  });

  it("stores password hash without plaintext password column", () => {
    const migration = readInitialMigration();

    expect(migration).toContain('"password_hash" text NOT NULL');
    expect(migration).not.toMatch(/"password"\s+text/i);
  });

  it("enforces required uniqueness constraints", () => {
    const migration = readInitialMigration();

    expect(migration).toContain(
      'CREATE UNIQUE INDEX "gmail_accounts_user_canonical_email_unique" ON "gmail_accounts" USING btree ("user_id","canonical_email")'
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "dot_aliases_user_alias_email_unique" ON "dot_aliases" USING btree ("user_id","alias_email")'
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "providers_user_name_unique" ON "providers" USING btree ("user_id","name")'
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "alias_provider_links_user_alias_provider_unique" ON "alias_provider_links" USING btree ("user_id","alias_id","provider_id")'
    );
  });

  it("stores original alias fields for Gmail account creation", () => {
    const migration = readInitialMigration();

    expect(migration).toContain('"gmail_account_id" uuid NOT NULL');
    expect(migration).toContain('"dot_count" integer NOT NULL');
    expect(migration).toContain('"is_original" boolean DEFAULT false NOT NULL');
  });
});
