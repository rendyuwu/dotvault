import {
  getAliasAccountOptions,
  getAliases,
  getArchivedAliasCount,
} from "@/lib/aliases/actions";
import { AliasesClient } from "./aliases-client";

function value(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const raw = searchParams[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function AliasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = value(params, "search") ?? "";
  const gmailAccountId = value(params, "account") || undefined;
  const includeArchived = value(params, "archived") === "1";

  const [aliases, accounts, archivedCount] = await Promise.all([
    getAliases({ search, gmailAccountId, includeArchived }),
    getAliasAccountOptions(),
    getArchivedAliasCount(),
  ]);

  return (
    <AliasesClient
      aliases={aliases}
      accounts={accounts}
      archivedCount={archivedCount}
      search={search}
      gmailAccountId={gmailAccountId ?? ""}
      includeArchived={includeArchived}
    />
  );
}
