"use server";

import { and, count, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import {
  aliasProviderLinks,
  dotAliases,
  gmailAccounts,
  providers,
} from "@/lib/db/schema";

export type DashboardSummary = {
  gmailAccountCount: number;
  activeAliasCount: number;
  archivedAliasCount: number;
  activeProviderCount: number;
  activeAliasProviderLinkCount: number;
};

function readCount(row: { count: number } | undefined) {
  return row?.count ?? 0;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const user = await requireUser();
  const db = getDb();

  const [
    [activeGmailAccount],
    [activeAlias],
    [archivedAlias],
    [activeProvider],
    [activeAliasProviderLink],
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(gmailAccounts)
      .where(eq(gmailAccounts.userId, user.id)),
    db
      .select({ count: count() })
      .from(dotAliases)
      .where(and(eq(dotAliases.userId, user.id), eq(dotAliases.archived, false))),
    db
      .select({ count: count() })
      .from(dotAliases)
      .where(and(eq(dotAliases.userId, user.id), eq(dotAliases.archived, true))),
    db
      .select({ count: count() })
      .from(providers)
      .where(and(eq(providers.userId, user.id), eq(providers.archived, false))),
    db
      .select({ count: count() })
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
      ),
  ]);

  return {
    gmailAccountCount: readCount(activeGmailAccount),
    activeAliasCount: readCount(activeAlias),
    archivedAliasCount: readCount(archivedAlias),
    activeProviderCount: readCount(activeProvider),
    activeAliasProviderLinkCount: readCount(activeAliasProviderLink),
  };
}
