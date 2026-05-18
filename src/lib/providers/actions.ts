"use server";

import { and, count, desc, eq, ilike, ne } from "drizzle-orm";
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

export type ProviderListItem = ProviderRow & {
  linkCount: number;
};

export type ProviderDetail = ProviderRow & {
  links: Array<
    AliasProviderLinkRow & {
      alias: DotAliasRow;
      account: Pick<GmailAccountRow, "id" | "label">;
    }
  >;
};

export type ProviderActionState = {
  error?: string;
  provider?: ProviderRow;
};

export type ProviderListInput = {
  includeArchived?: boolean;
};

export type ProviderCreateInput = {
  name: string;
  website?: string | null;
  category?: string | null;
  notes?: string | null;
};

export type ProviderUpdateInput = ProviderCreateInput & {
  id: string;
  archived?: boolean;
};

const nullableText = z
  .string()
  .nullable()
  .transform((value) => value?.trim() || null)
  .optional();

const createProviderSchema = z.object({
  name: z.string().trim().min(1, "Provider name is required"),
  website: nullableText,
  category: nullableText,
  notes: nullableText,
});

const updateProviderSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Provider name is required").optional(),
  website: nullableText,
  category: nullableText,
  notes: nullableText,
  archived: z.boolean().optional(),
});

function isUniqueConstraintError(error: unknown, constraintName: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint_name" in error &&
    error.constraint_name === constraintName
  );
}

async function activeProviderNameExists(
  userId: string,
  name: string,
  excludeId?: string
) {
  const filters = [
    eq(providers.userId, userId),
    eq(providers.archived, false),
    ilike(providers.name, name),
  ];
  if (excludeId) filters.push(ne(providers.id, excludeId));

  const [existing] = await getDb()
    .select({ id: providers.id })
    .from(providers)
    .where(and(...filters))
    .limit(1);

  return Boolean(existing);
}

export async function getArchivedProviderCount(): Promise<number> {
  const user = await requireUser();
  const [row] = await getDb()
    .select({ count: count() })
    .from(providers)
    .where(and(eq(providers.userId, user.id), eq(providers.archived, true)));

  return row?.count ?? 0;
}

export async function getProviders(
  input: ProviderListInput = {}
): Promise<ProviderListItem[]> {
  const user = await requireUser();
  const db = getDb();
  const filters = [eq(providers.userId, user.id)];
  if (!input.includeArchived) filters.push(eq(providers.archived, false));

  const providerRows = await db
    .select()
    .from(providers)
    .where(and(...filters))
    .orderBy(providers.archived, desc(providers.createdAt));

  const linkCounts = await db
    .select({
      providerId: aliasProviderLinks.providerId,
      count: count(),
    })
    .from(aliasProviderLinks)
    .innerJoin(
      dotAliases,
      and(
        eq(dotAliases.id, aliasProviderLinks.aliasId),
        eq(dotAliases.userId, user.id),
        eq(dotAliases.archived, false)
      )
    )
    .where(
      and(
        eq(aliasProviderLinks.userId, user.id),
        eq(aliasProviderLinks.archived, false)
      )
    )
    .groupBy(aliasProviderLinks.providerId);

  const countsByProviderId = new Map(
    linkCounts.map((row) => [row.providerId, row.count])
  );

  return providerRows.map((provider) => ({
    ...provider,
    linkCount: countsByProviderId.get(provider.id) ?? 0,
  }));
}

export async function getProviderDetail(
  id: string
): Promise<ProviderDetail | null> {
  const user = await requireUser();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return null;

  const db = getDb();
  const [provider] = await db
    .select()
    .from(providers)
    .where(and(eq(providers.id, parsed.data), eq(providers.userId, user.id)))
    .limit(1);

  if (!provider) return null;

  const links = await db
    .select({
      link: aliasProviderLinks,
      alias: dotAliases,
      account: {
        id: gmailAccounts.id,
        label: gmailAccounts.label,
      },
    })
    .from(aliasProviderLinks)
    .innerJoin(
      dotAliases,
      and(
        eq(dotAliases.id, aliasProviderLinks.aliasId),
        eq(dotAliases.userId, user.id),
        eq(dotAliases.archived, false)
      )
    )
    .innerJoin(
      gmailAccounts,
      and(
        eq(gmailAccounts.id, dotAliases.gmailAccountId),
        eq(gmailAccounts.userId, user.id)
      )
    )
    .where(
      and(
        eq(aliasProviderLinks.providerId, parsed.data),
        eq(aliasProviderLinks.userId, user.id),
        eq(aliasProviderLinks.archived, false)
      )
    )
    .orderBy(dotAliases.aliasEmail);

  return {
    ...provider,
    links: links.map((row) => ({
      ...row.link,
      alias: row.alias,
      account: row.account,
    })),
  };
}

export async function createProviderAction(
  input: ProviderCreateInput
): Promise<ProviderActionState> {
  const user = await requireUserForAction();
  const parsed = createProviderSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid provider" };
  }

  if (await activeProviderNameExists(user.id, parsed.data.name)) {
    return { error: `A provider named "${parsed.data.name}" already exists` };
  }

  try {
    const [provider] = await getDb()
      .insert(providers)
      .values({
        userId: user.id,
        name: parsed.data.name,
        website: parsed.data.website ?? null,
        category: parsed.data.category ?? null,
        notes: parsed.data.notes ?? null,
      })
      .returning();

    revalidatePath("/providers");
    revalidatePath("/dashboard");
    return { provider };
  } catch (error) {
    if (isUniqueConstraintError(error, "providers_user_name_unique")) {
      return { error: "This provider already exists" };
    }
    throw error;
  }
}

export async function updateProviderAction(
  input: Partial<ProviderUpdateInput> & { id: string }
): Promise<ProviderActionState> {
  const user = await requireUserForAction();
  const parsed = updateProviderSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid provider update" };
  }

  if (
    parsed.data.name &&
    (await activeProviderNameExists(user.id, parsed.data.name, parsed.data.id))
  ) {
    return { error: `A provider named "${parsed.data.name}" already exists` };
  }

  const updateValues: Partial<typeof providers.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.name !== undefined) updateValues.name = parsed.data.name;
  if (parsed.data.website !== undefined) updateValues.website = parsed.data.website;
  if (parsed.data.category !== undefined) {
    updateValues.category = parsed.data.category;
  }
  if (parsed.data.notes !== undefined) updateValues.notes = parsed.data.notes;
  if (parsed.data.archived !== undefined) {
    updateValues.archived = parsed.data.archived;
  }

  try {
    const [provider] = await getDb()
      .update(providers)
      .set(updateValues)
      .where(and(eq(providers.id, parsed.data.id), eq(providers.userId, user.id)))
      .returning();

    if (!provider) return { error: "Provider not found" };

    revalidatePath("/providers");
    revalidatePath(`/providers/${parsed.data.id}`);
    revalidatePath("/aliases");
    revalidatePath("/dashboard");
    return { provider };
  } catch (error) {
    if (isUniqueConstraintError(error, "providers_user_name_unique")) {
      return { error: "This provider already exists" };
    }
    throw error;
  }
}
