import { randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "1" && process.env.DATABASE_URL;
const describeDb = shouldRunDbTests ? describe : describe.skip;

let sql: Sql | undefined;
const cleanupUserIds: string[] = [];

async function requireMigratedSchema(client: Sql) {
  const rows = await client<[{ users: string | null; aliases: string | null; links: string | null }]>`
    select
      to_regclass('public.users')::text as users,
      to_regclass('public.dot_aliases')::text as aliases,
      to_regclass('public.alias_provider_links')::text as links
  `;

  if (!rows[0]?.users || !rows[0]?.aliases || !rows[0]?.links) {
    throw new Error("DB concurrency tests require migrated DotVault schema");
  }
}

async function createUser(client: Sql) {
  const userId = randomUUID();
  cleanupUserIds.push(userId);
  await client`
    insert into users (id, email, password_hash, is_active)
    values (${userId}, ${`db-test-${userId}@example.com`}, '$argon2id$db-test', true)
  `;
  return userId;
}

describeDb("database uniqueness under concurrent writes", () => {
  beforeAll(async () => {
    sql = postgres(process.env.DATABASE_URL!, { max: 4 });
    await requireMigratedSchema(sql);
  });

  afterEach(async () => {
    if (!sql) return;
    while (cleanupUserIds.length > 0) {
      const userId = cleanupUserIds.pop()!;
      await sql`delete from users where id = ${userId}`;
    }
  });

  afterAll(async () => {
    await sql?.end();
    sql = undefined;
  });

  it("prevents duplicate dot aliases under concurrent inserts", async () => {
    const client = sql!;
    const userId = await createUser(client);
    const accountId = randomUUID();
    const aliasEmail = `db.alias.${accountId}@gmail.com`;

    await client`
      insert into gmail_accounts (
        id, user_id, original_email, canonical_email, local_part, domain, label, archived
      )
      values (
        ${accountId}, ${userId}, ${aliasEmail}, ${aliasEmail.replaceAll(".", "")},
        'dbalias', 'gmail.com', 'DB Test', false
      )
    `;

    const insertAlias = () => client`
      insert into dot_aliases (
        user_id, gmail_account_id, alias_email, local_part_with_dots,
        dot_count, is_original, archived
      )
      values (${userId}, ${accountId}, ${aliasEmail}, 'db.alias', 1, false, false)
    `;

    const results = await Promise.allSettled([insertAlias(), insertAlias()]);
    const rows = await client<[{ count: string }]>`
      select count(*)::text as count
      from dot_aliases
      where user_id = ${userId} and alias_email = ${aliasEmail}
    `;

    expect(rows[0].count).toBe("1");
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("prevents duplicate alias/provider links under concurrent inserts", async () => {
    const client = sql!;
    const userId = await createUser(client);
    const accountId = randomUUID();
    const aliasId = randomUUID();
    const providerId = randomUUID();
    const aliasEmail = `db.link.${aliasId}@gmail.com`;

    await client`
      insert into gmail_accounts (
        id, user_id, original_email, canonical_email, local_part, domain, label, archived
      )
      values (
        ${accountId}, ${userId}, ${aliasEmail}, ${aliasEmail.replaceAll(".", "")},
        'dblink', 'gmail.com', 'DB Test', false
      )
    `;
    await client`
      insert into dot_aliases (
        id, user_id, gmail_account_id, alias_email, local_part_with_dots,
        dot_count, is_original, archived
      )
      values (${aliasId}, ${userId}, ${accountId}, ${aliasEmail}, 'db.link', 1, false, false)
    `;
    await client`
      insert into providers (id, user_id, name, archived)
      values (${providerId}, ${userId}, ${`Provider ${providerId}`}, false)
    `;

    const insertLink = () => client`
      insert into alias_provider_links (user_id, alias_id, provider_id, archived)
      values (${userId}, ${aliasId}, ${providerId}, false)
    `;

    const results = await Promise.allSettled([insertLink(), insertLink()]);
    const rows = await client<[{ count: string }]>`
      select count(*)::text as count
      from alias_provider_links
      where user_id = ${userId} and alias_id = ${aliasId} and provider_id = ${providerId}
    `;

    expect(rows[0].count).toBe("1");
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });
});
