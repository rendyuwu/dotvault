"use server";

import { and, count, desc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, requireUserForAction } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import {
  aliasProviderLinks,
  dotAliases,
  gmailAccounts,
  providers,
  type AliasProviderLinkRow,
  type DotAliasRow,
  type GmailAccountRow,
  type ProviderRow,
} from "@/lib/db/schema";

export type AliasListItem = DotAliasRow & {
  accountLabel: string;
  linkCount: number;
};

export type AliasDetail = DotAliasRow & {
  account: Pick<GmailAccountRow, "id" | "label" | "originalEmail" | "canonicalEmail">;
  links: Array<
    AliasProviderLinkRow & {
      provider: ProviderRow;
    }
  >;
};

export type AliasAccountOption = Pick<
  GmailAccountRow,
  "id" | "label" | "archived"
>;

export type AliasActionState = {
  error?: string;
};

export type AliasListInput = {
  search?: string;
  gmailAccountId?: string;
  includeArchived?: boolean;
};

export type AliasUpdateInput = {
  id: string;
  notes?: string | null;
  archived?: boolean;
};

const listSchema = z.object({
  search: z.string().optional(),
  gmailAccountId: z.uuid().optional(),
  includeArchived: z.boolean().optional(),
});

const updateAliasSchema = z.object({
  id: z.uuid(),
  notes: z
    .string()
    .nullable()
    .transform((value) => value?.trim() || null)
    .optional(),
  archived: z.boolean().optional(),
});

export async function getAliases(
  input: AliasListInput = {}
): Promise<AliasListItem[]> {
  const user = await requireUser();
  const parsed = listSchema.parse(input);
  const db = getDb();
  const search = parsed.search?.trim();

  const filters = [eq(dotAliases.userId, user.id)];
  if (!parsed.includeArchived) filters.push(eq(dotAliases.archived, false));
  if (parsed.gmailAccountId) {
    filters.push(eq(dotAliases.gmailAccountId, parsed.gmailAccountId));
  }
  if (search) filters.push(ilike(dotAliases.aliasEmail, `%${search}%`));

  const aliases = await db
    .select({
      alias: dotAliases,
      accountLabel: gmailAccounts.label,
    })
    .from(dotAliases)
    .innerJoin(
      gmailAccounts,
      and(
        eq(gmailAccounts.id, dotAliases.gmailAccountId),
        eq(gmailAccounts.userId, user.id)
      )
    )
    .where(and(...filters))
    .orderBy(dotAliases.archived, desc(dotAliases.createdAt));

  const linkCounts = await db
    .select({
      aliasId: aliasProviderLinks.aliasId,
      count: count(),
    })
    .from(aliasProviderLinks)
    .innerJoin(
      providers,
      and(
        eq(providers.id, aliasProviderLinks.providerId),
        eq(providers.userId, user.id),
        eq(providers.archived, false)
      )
    )
    .where(
      and(
        eq(aliasProviderLinks.userId, user.id),
        eq(aliasProviderLinks.archived, false)
      )
    )
    .groupBy(aliasProviderLinks.aliasId);

  const countsByAliasId = new Map(
    linkCounts.map((row) => [row.aliasId, row.count])
  );

  return aliases.map((row) => ({
    ...row.alias,
    accountLabel: row.accountLabel,
    linkCount: countsByAliasId.get(row.alias.id) ?? 0,
  }));
}

export async function getArchivedAliasCount(): Promise<number> {
  const user = await requireUser();
  const [row] = await getDb()
    .select({ count: count() })
    .from(dotAliases)
    .where(and(eq(dotAliases.userId, user.id), eq(dotAliases.archived, true)));

  return row?.count ?? 0;
}

export async function getAliasAccountOptions(): Promise<AliasAccountOption[]> {
  const user = await requireUser();

  return getDb()
    .select({
      id: gmailAccounts.id,
      label: gmailAccounts.label,
      archived: gmailAccounts.archived,
    })
    .from(gmailAccounts)
    .where(eq(gmailAccounts.userId, user.id))
    .orderBy(gmailAccounts.archived, gmailAccounts.label);
}

export async function getAliasDetail(id: string): Promise<AliasDetail | null> {
  const user = await requireUser();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return null;

  const db = getDb();
  const [row] = await db
    .select({
      alias: dotAliases,
      account: {
        id: gmailAccounts.id,
        label: gmailAccounts.label,
        originalEmail: gmailAccounts.originalEmail,
        canonicalEmail: gmailAccounts.canonicalEmail,
      },
    })
    .from(dotAliases)
    .innerJoin(
      gmailAccounts,
      and(
        eq(gmailAccounts.id, dotAliases.gmailAccountId),
        eq(gmailAccounts.userId, user.id)
      )
    )
    .where(and(eq(dotAliases.id, parsed.data), eq(dotAliases.userId, user.id)))
    .limit(1);

  if (!row) return null;

  const links = await db
    .select({
      link: aliasProviderLinks,
      provider: providers,
    })
    .from(aliasProviderLinks)
    .innerJoin(
      providers,
      and(
        eq(providers.id, aliasProviderLinks.providerId),
        eq(providers.userId, user.id),
        eq(providers.archived, false)
      )
    )
    .where(
      and(
        eq(aliasProviderLinks.aliasId, parsed.data),
        eq(aliasProviderLinks.userId, user.id),
        eq(aliasProviderLinks.archived, false)
      )
    )
    .orderBy(providers.name);

  return {
    ...row.alias,
    account: row.account,
    links: links.map((linkRow) => ({
      ...linkRow.link,
      provider: linkRow.provider,
    })),
  };
}

export async function updateAliasAction(
  input: AliasUpdateInput
): Promise<AliasActionState> {
  const user = await requireUserForAction();
  const parsed = updateAliasSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid alias update" };
  }

  const updateValues: Partial<typeof dotAliases.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.notes !== undefined) updateValues.notes = parsed.data.notes;
  if (parsed.data.archived !== undefined) {
    updateValues.archived = parsed.data.archived;
  }

  const [updated] = await getDb()
    .update(dotAliases)
    .set(updateValues)
    .where(and(eq(dotAliases.id, parsed.data.id), eq(dotAliases.userId, user.id)))
    .returning({ id: dotAliases.id });

  if (!updated) return { error: "Alias not found" };

  revalidatePath("/aliases");
  revalidatePath(`/aliases/${parsed.data.id}`);
  revalidatePath("/dashboard");
  return {};
}
