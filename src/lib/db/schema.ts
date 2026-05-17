import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});

export const gmailAccounts = pgTable(
  "gmail_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    originalEmail: text("original_email").notNull(),
    canonicalEmail: text("canonical_email").notNull(),
    localPart: text("local_part").notNull(),
    domain: text("domain").notNull().default("gmail.com"),
    label: text("label").notNull().default(""),
    notes: text("notes"),
    archived: boolean("archived").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("gmail_accounts_user_canonical_email_unique").on(
      table.userId,
      table.canonicalEmail
    ),
    index("gmail_accounts_user_archived_idx").on(table.userId, table.archived),
  ]
);

export const dotAliases = pgTable(
  "dot_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gmailAccountId: uuid("gmail_account_id")
      .notNull()
      .references(() => gmailAccounts.id, { onDelete: "cascade" }),
    aliasEmail: text("alias_email").notNull(),
    localPartWithDots: text("local_part_with_dots").notNull(),
    dotCount: integer("dot_count").notNull(),
    isOriginal: boolean("is_original").notNull().default(false),
    notes: text("notes"),
    archived: boolean("archived").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("dot_aliases_user_alias_email_unique").on(
      table.userId,
      table.aliasEmail
    ),
    index("dot_aliases_user_gmail_account_idx").on(
      table.userId,
      table.gmailAccountId
    ),
    index("dot_aliases_user_archived_idx").on(table.userId, table.archived),
    check("dot_aliases_dot_count_nonnegative", sql`${table.dotCount} >= 0`),
  ]
);

export const providers = pgTable(
  "providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    website: text("website"),
    category: text("category"),
    notes: text("notes"),
    archived: boolean("archived").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("providers_user_name_unique").on(table.userId, table.name),
    index("providers_user_archived_idx").on(table.userId, table.archived),
  ]
);

export const aliasProviderLinks = pgTable(
  "alias_provider_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    aliasId: uuid("alias_id")
      .notNull()
      .references(() => dotAliases.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    accountIdentifier: text("account_identifier"),
    notes: text("notes"),
    archived: boolean("archived").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("alias_provider_links_user_alias_provider_unique").on(
      table.userId,
      table.aliasId,
      table.providerId
    ),
    index("alias_provider_links_user_archived_idx").on(
      table.userId,
      table.archived
    ),
    index("alias_provider_links_alias_idx").on(table.aliasId),
    index("alias_provider_links_provider_idx").on(table.providerId),
  ]
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type GmailAccountRow = typeof gmailAccounts.$inferSelect;
export type NewGmailAccountRow = typeof gmailAccounts.$inferInsert;
export type DotAliasRow = typeof dotAliases.$inferSelect;
export type NewDotAliasRow = typeof dotAliases.$inferInsert;
export type ProviderRow = typeof providers.$inferSelect;
export type NewProviderRow = typeof providers.$inferInsert;
export type AliasProviderLinkRow = typeof aliasProviderLinks.$inferSelect;
export type NewAliasProviderLinkRow = typeof aliasProviderLinks.$inferInsert;
