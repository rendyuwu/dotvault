import { getArchivedProviderCount, getProviders } from "@/lib/providers/actions";
import { ProvidersClient } from "./providers-client";

function value(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const raw = searchParams[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const includeArchived = value(params, "archived") === "1";
  const [providers, archivedCount] = await Promise.all([
    getProviders({ includeArchived }),
    getArchivedProviderCount(),
  ]);

  return (
    <ProvidersClient
      providers={providers}
      archivedCount={archivedCount}
      includeArchived={includeArchived}
    />
  );
}
