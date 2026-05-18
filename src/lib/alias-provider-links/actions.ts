"use server";

import { and, eq } from "drizzle-orm";
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
  type ProviderRow,
} from "@/lib/db/schema";

export type AliasLinkOption = Pick<
  DotAliasRow,
  "id" | "gmailAccountId" | "aliasEmail" | "archived"
> & {
  accountLabel: string;
};

export type ProviderLinkOption = Pick<
  ProviderRow,
  "id" | "name" | "category" | "archived"
>;

export type AliasProviderLinkOption = Pick<
  AliasProviderLinkRow,
  "id" | "aliasId" | "providerId" | "archived"
>;

export type AliasProviderLinkOptions = {
  aliases: AliasLinkOption[];
  providers: ProviderLinkOption[];
  existingLinks: AliasProviderLinkOption[];
};

export type AliasProviderLinkActionState = {
  error?: string;
  link?: AliasProviderLinkRow;
};

export type AliasProviderLinkCreateInput = {
  aliasId: string;
  providerId: string;
  accountIdentifier?: string | null;
  notes?: string | null;
};

export type AliasProviderLinkUpdateInput = {
  id: string;
  accountIdentifier?: string | null;
  notes?: string | null;
  archived?: boolean;
};

const nullableText = z
  .string()
  .nullable()
  .transform((value) => value?.trim() || null)
  .optional();

const createLinkSchema = z.object({
  aliasId: z.uuid(),
  providerId: z.uuid(),
  accountIdentifier: nullableText,
  notes: nullableText,
});

const updateLinkSchema = z.object({
  id: z.uuid(),
  accountIdentifier: nullableText,
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

function revalidateLinkPaths(aliasId: string, providerId: string) {
  revalidatePath("/aliases");
  revalidatePath(`/aliases/${aliasId}`);
  revalidatePath("/providers");
  revalidatePath(`/providers/${providerId}`);
  revalidatePath("/dashboard");
}

export async function getAliasProviderLinkOptions(): Promise<AliasProviderLinkOptions> {
  const user = await requireUser();
  const db = getDb();

  const aliases = await db
    .select({
      id: dotAliases.id,
      gmailAccountId: dotAliases.gmailAccountId,
      aliasEmail: dotAliases.aliasEmail,
      archived: dotAliases.archived,
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
    .where(and(eq(dotAliases.userId, user.id), eq(dotAliases.archived, false)))
    .orderBy(gmailAccounts.label, dotAliases.aliasEmail);

  const providerOptions = await db
    .select({
      id: providers.id,
      name: providers.name,
      category: providers.category,
      archived: providers.archived,
    })
    .from(providers)
    .where(and(eq(providers.userId, user.id), eq(providers.archived, false)))
    .orderBy(providers.name);

  const existingLinks = await db
    .select({
      id: aliasProviderLinks.id,
      aliasId: aliasProviderLinks.aliasId,
      providerId: aliasProviderLinks.providerId,
      archived: aliasProviderLinks.archived,
    })
    .from(aliasProviderLinks)
    .where(eq(aliasProviderLinks.userId, user.id));

  return { aliases, providers: providerOptions, existingLinks };
}

export async function createAliasProviderLinkAction(
  input: AliasProviderLinkCreateInput
): Promise<AliasProviderLinkActionState> {
  const user = await requireUserForAction();
  const parsed = createLinkSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid link" };
  }

  const db = getDb();

  try {
    const link = await db.transaction(async (tx) => {
      const [alias] = await tx
        .select({ id: dotAliases.id })
        .from(dotAliases)
        .where(
          and(
            eq(dotAliases.id, parsed.data.aliasId),
            eq(dotAliases.userId, user.id),
            eq(dotAliases.archived, false)
          )
        )
        .limit(1);

      if (!alias) return { error: "Alias not found" } as const;

      const [provider] = await tx
        .select({ id: providers.id })
        .from(providers)
        .where(
          and(
            eq(providers.id, parsed.data.providerId),
            eq(providers.userId, user.id),
            eq(providers.archived, false)
          )
        )
        .limit(1);

      if (!provider) return { error: "Provider not found" } as const;

      const [existing] = await tx
        .select()
        .from(aliasProviderLinks)
        .where(
          and(
            eq(aliasProviderLinks.userId, user.id),
            eq(aliasProviderLinks.aliasId, parsed.data.aliasId),
            eq(aliasProviderLinks.providerId, parsed.data.providerId)
          )
        )
        .limit(1);

      if (existing && !existing.archived) {
        return { error: "This alias is already linked to this provider" } as const;
      }

      if (existing) {
        const [restored] = await tx
          .update(aliasProviderLinks)
          .set({
            accountIdentifier: parsed.data.accountIdentifier ?? null,
            notes: parsed.data.notes ?? null,
            archived: false,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(aliasProviderLinks.id, existing.id))
          .returning();
        return { link: restored } as const;
      }

      const [created] = await tx
        .insert(aliasProviderLinks)
        .values({
          userId: user.id,
          aliasId: parsed.data.aliasId,
          providerId: parsed.data.providerId,
          accountIdentifier: parsed.data.accountIdentifier ?? null,
          notes: parsed.data.notes ?? null,
        })
        .returning();

      return { link: created } as const;
    });

    if ("error" in link) return { error: link.error };

    revalidateLinkPaths(parsed.data.aliasId, parsed.data.providerId);
    return { link: link.link };
  } catch (error) {
    if (
      isUniqueConstraintError(
        error,
        "alias_provider_links_user_alias_provider_unique"
      )
    ) {
      return { error: "This alias is already linked to this provider" };
    }
    throw error;
  }
}

export async function updateAliasProviderLinkAction(
  input: AliasProviderLinkUpdateInput
): Promise<AliasProviderLinkActionState> {
  const user = await requireUserForAction();
  const parsed = updateLinkSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid link update" };
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(aliasProviderLinks)
    .where(
      and(eq(aliasProviderLinks.id, parsed.data.id), eq(aliasProviderLinks.userId, user.id))
    )
    .limit(1);

  if (!existing) return { error: "Link not found" };

  const updateValues: Partial<typeof aliasProviderLinks.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.accountIdentifier !== undefined) {
    updateValues.accountIdentifier = parsed.data.accountIdentifier;
  }
  if (parsed.data.notes !== undefined) updateValues.notes = parsed.data.notes;
  if (parsed.data.archived !== undefined) {
    updateValues.archived = parsed.data.archived;
  }

  const [link] = await db
    .update(aliasProviderLinks)
    .set(updateValues)
    .where(
      and(eq(aliasProviderLinks.id, parsed.data.id), eq(aliasProviderLinks.userId, user.id))
    )
    .returning();

  revalidateLinkPaths(existing.aliasId, existing.providerId);
  return { link };
}
