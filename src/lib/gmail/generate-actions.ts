"use server";

import { and, count, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, requireUserForAction } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { dotAliases, gmailAccounts } from "@/lib/db/schema";
import { generateDotAliases, type GeneratedAlias } from "./generate";
import { maxAliasCount } from "./normalize";

export type GenerateAccountOption = {
  id: string;
  label: string;
  originalEmail: string;
  canonicalEmail: string;
  localPart: string;
  domain: string;
  aliasCount: number;
};

export type GeneratePreviewInput = {
  gmailAccountId: string;
  count: number;
};

export type GeneratePreviewStats = {
  totalPossible: number;
  alreadySaved: number;
  remaining: number;
  requested: number;
  generated: number;
  shortage: boolean;
};

export type GeneratePreviewResult =
  | {
      ok: true;
      aliases: GeneratedAlias[];
      stats: GeneratePreviewStats;
    }
  | { ok: false; error: string };

export type SaveGeneratedAliasesInput = {
  gmailAccountId: string;
  aliases: GeneratedAlias[];
};

export type SaveGeneratedAliasesResult =
  | { ok: true; saved: number; skipped: number }
  | { ok: false; error: string };

const previewGenerateAliasesSchema = z.object({
  gmailAccountId: z.uuid(),
  count: z.number().int().min(1),
});

const generatedAliasSchema = z.object({
  localPartWithDots: z.string().min(1),
  aliasEmail: z.string().min(1),
  dotCount: z.number().int().min(0),
});

const saveGeneratedAliasesSchema = z.object({
  gmailAccountId: z.uuid(),
  aliases: z.array(generatedAliasSchema).min(1).max(500),
});

export async function getGeneratePageAccounts(): Promise<GenerateAccountOption[]> {
  const user = await requireUser();
  const db = getDb();

  const accounts = await db
    .select()
    .from(gmailAccounts)
    .where(and(eq(gmailAccounts.userId, user.id), eq(gmailAccounts.archived, false)))
    .orderBy(desc(gmailAccounts.createdAt));

  const aliasCounts = await db
    .select({
      gmailAccountId: dotAliases.gmailAccountId,
      count: count(),
    })
    .from(dotAliases)
    .where(eq(dotAliases.userId, user.id))
    .groupBy(dotAliases.gmailAccountId);

  const countByAccountId = new Map(
    aliasCounts.map((row) => [row.gmailAccountId, row.count])
  );

  return accounts.map((account) => ({
    id: account.id,
    label: account.label,
    originalEmail: account.originalEmail,
    canonicalEmail: account.canonicalEmail,
    localPart: account.localPart,
    domain: account.domain,
    aliasCount: countByAccountId.get(account.id) ?? 0,
  }));
}

export async function previewGenerateAliasesAction(
  input: GeneratePreviewInput
): Promise<GeneratePreviewResult> {
  const parsed = previewGenerateAliasesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid generation request" };

  const user = await requireUserForAction();
  const db = getDb();

  const [account] = await db
    .select()
    .from(gmailAccounts)
    .where(
      and(
        eq(gmailAccounts.id, parsed.data.gmailAccountId),
        eq(gmailAccounts.userId, user.id),
        eq(gmailAccounts.archived, false)
      )
    )
    .limit(1);

  if (!account) return { ok: false, error: "Gmail account not found" };

  const savedAliases = await db
    .select({ localPartWithDots: dotAliases.localPartWithDots })
    .from(dotAliases)
    .where(
      and(
        eq(dotAliases.userId, user.id),
        eq(dotAliases.gmailAccountId, account.id)
      )
    );

  const existingLocalParts = new Set(
    savedAliases.map((alias) => alias.localPartWithDots)
  );
  const totalPossible = maxAliasCount(account.localPart.length);
  const alreadySaved = existingLocalParts.size;
  const remaining = Math.max(totalPossible - alreadySaved, 0);
  const requested = parsed.data.count;
  const actual = Math.min(requested, remaining, 500);
  const aliases = generateDotAliases(
    account.localPart,
    account.domain,
    actual,
    existingLocalParts
  );

  return {
    ok: true,
    aliases,
    stats: {
      totalPossible,
      alreadySaved,
      remaining,
      requested,
      generated: aliases.length,
      shortage: requested > remaining,
    },
  };
}

function dotCount(localPartWithDots: string) {
  return localPartWithDots.split(".").length - 1;
}

function isValidAliasForAccount(
  alias: GeneratedAlias,
  account: { localPart: string; domain: string }
) {
  const { localPartWithDots } = alias;

  return (
    localPartWithDots.replaceAll(".", "") === account.localPart &&
    !localPartWithDots.startsWith(".") &&
    !localPartWithDots.endsWith(".") &&
    !localPartWithDots.includes("..") &&
    alias.aliasEmail === `${localPartWithDots}@${account.domain}` &&
    alias.dotCount === dotCount(localPartWithDots)
  );
}

export async function saveGeneratedAliasesAction(
  input: SaveGeneratedAliasesInput
): Promise<SaveGeneratedAliasesResult> {
  const parsed = saveGeneratedAliasesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid save request" };

  const user = await requireUserForAction();
  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [account] = await tx
      .select()
      .from(gmailAccounts)
      .where(
        and(
          eq(gmailAccounts.id, parsed.data.gmailAccountId),
          eq(gmailAccounts.userId, user.id),
          eq(gmailAccounts.archived, false)
        )
      )
      .limit(1);

    if (!account) return { ok: false as const, error: "Gmail account not found" };

    if (
      parsed.data.aliases.some((alias) => !isValidAliasForAccount(alias, account))
    ) {
      return { ok: false as const, error: "Invalid preview aliases" };
    }

    const uniqueAliases = new Map<string, GeneratedAlias>();
    for (const alias of parsed.data.aliases) {
      if (!uniqueAliases.has(alias.aliasEmail)) {
        uniqueAliases.set(alias.aliasEmail, alias);
      }
    }

    const duplicateCount = parsed.data.aliases.length - uniqueAliases.size;
    const values = Array.from(uniqueAliases.values()).map((alias) => ({
      userId: user.id,
      gmailAccountId: account.id,
      aliasEmail: alias.aliasEmail,
      localPartWithDots: alias.localPartWithDots,
      dotCount: alias.dotCount,
      isOriginal: false,
      notes: null,
      archived: false,
    }));

    const inserted = await tx
      .insert(dotAliases)
      .values(values)
      .onConflictDoNothing({
        target: [dotAliases.userId, dotAliases.aliasEmail],
      })
      .returning({ id: dotAliases.id });

    return {
      ok: true as const,
      saved: inserted.length,
      skipped: uniqueAliases.size - inserted.length + duplicateCount,
    };
  });

  if (!result.ok) return result;

  revalidatePath("/generate");
  revalidatePath("/gmail-accounts");
  revalidatePath("/aliases");
  revalidatePath("/dashboard");

  return result;
}
