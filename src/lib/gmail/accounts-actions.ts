"use server";

import { and, count, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, requireUserForAction } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { dotAliases, gmailAccounts } from "@/lib/db/schema";
import { normalizeGmail } from "./normalize";

export type GmailAccountListItem = typeof gmailAccounts.$inferSelect & {
  aliasCount: number;
};

export type GmailAccountActionState = {
  error?: string;
};

export type GmailAccountUpdateInput = {
  id: string;
  label?: string;
  notes?: string | null;
  archived?: boolean;
};

const createGmailAccountSchema = z.object({
  email: z.string().min(1, "Email is required"),
  label: z.string().trim().min(1, "Label is required"),
  notes: z.string().transform((value) => value.trim() || null),
});

const updateGmailAccountSchema = z.object({
  id: z.uuid(),
  label: z.string().transform((value) => value.trim() || "Untitled").optional(),
  notes: z
    .string()
    .nullable()
    .transform((value) => value?.trim() || null)
    .optional(),
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

export async function getGmailAccounts(): Promise<GmailAccountListItem[]> {
  const user = await requireUser();
  const db = getDb();

  const accounts = await db
    .select()
    .from(gmailAccounts)
    .where(eq(gmailAccounts.userId, user.id))
    .orderBy(gmailAccounts.archived, desc(gmailAccounts.createdAt));

  const aliasCounts = await db
    .select({
      gmailAccountId: dotAliases.gmailAccountId,
      count: count(),
    })
    .from(dotAliases)
    .where(and(eq(dotAliases.userId, user.id), eq(dotAliases.archived, false)))
    .groupBy(dotAliases.gmailAccountId);

  const countByAccountId = new Map(
    aliasCounts.map((row) => [row.gmailAccountId, row.count])
  );

  return accounts.map((account) => ({
    ...account,
    aliasCount: countByAccountId.get(account.id) ?? 0,
  }));
}

export async function getExistingGmailCanonicalEmails(): Promise<string[]> {
  const user = await requireUser();

  const rows = await getDb()
    .select({ canonicalEmail: gmailAccounts.canonicalEmail })
    .from(gmailAccounts)
    .where(eq(gmailAccounts.userId, user.id));

  return rows.map((row) => row.canonicalEmail);
}

export async function createGmailAccountAction(
  _state: GmailAccountActionState,
  formData: FormData
): Promise<GmailAccountActionState> {
  const user = await requireUserForAction();
  const parsed = createGmailAccountSchema.safeParse({
    email: formData.get("email"),
    label: formData.get("label"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid Gmail account" };
  }

  const normalized = normalizeGmail(parsed.data.email);
  if (!normalized.ok) return { error: normalized.error };

  const db = getDb();

  try {
    const created = await db.transaction(async (tx) => {
      const [account] = await tx
        .insert(gmailAccounts)
        .values({
          userId: user.id,
          originalEmail: normalized.originalEmail,
          canonicalEmail: normalized.canonicalEmail,
          localPart: normalized.localPart,
          domain: normalized.domain,
          label: parsed.data.label,
          notes: parsed.data.notes,
        })
        .onConflictDoNothing({
          target: [gmailAccounts.userId, gmailAccounts.canonicalEmail],
        })
        .returning();

      if (!account) return null;

      await tx.insert(dotAliases).values({
        userId: user.id,
        gmailAccountId: account.id,
        aliasEmail: normalized.canonicalEmail,
        localPartWithDots: normalized.localPart,
        dotCount: 0,
        isOriginal: true,
        notes: null,
        archived: false,
      });

      return account;
    });

    if (!created) return { error: "This Gmail account already exists" };
  } catch (error) {
    if (
      isUniqueConstraintError(
        error,
        "gmail_accounts_user_canonical_email_unique"
      ) ||
      isUniqueConstraintError(error, "dot_aliases_user_alias_email_unique")
    ) {
      return { error: "This Gmail account already exists" };
    }

    throw error;
  }

  revalidatePath("/gmail-accounts");
  revalidatePath("/dashboard");
  redirect("/gmail-accounts");
}

export async function updateGmailAccountAction(
  input: GmailAccountUpdateInput
): Promise<GmailAccountActionState> {
  const user = await requireUserForAction();
  const parsed = updateGmailAccountSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid update" };
  }

  const updateValues: Partial<typeof gmailAccounts.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (parsed.data.label !== undefined) updateValues.label = parsed.data.label;
  if (parsed.data.notes !== undefined) updateValues.notes = parsed.data.notes;
  if (parsed.data.archived !== undefined) {
    updateValues.archived = parsed.data.archived;
  }

  const [updated] = await getDb()
    .update(gmailAccounts)
    .set(updateValues)
    .where(
      and(eq(gmailAccounts.id, parsed.data.id), eq(gmailAccounts.userId, user.id))
    )
    .returning({ id: gmailAccounts.id });

  if (!updated) return { error: "Gmail account not found" };

  revalidatePath("/gmail-accounts");
  revalidatePath("/dashboard");
  return {};
}
