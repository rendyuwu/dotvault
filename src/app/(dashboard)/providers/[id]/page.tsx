import { getAliasProviderLinkOptions } from "@/lib/alias-provider-links/actions";
import { getProviderDetail } from "@/lib/providers/actions";
import { ProviderDetailClient } from "./provider-detail-client";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [provider, linkOptions] = await Promise.all([
    getProviderDetail(id),
    getAliasProviderLinkOptions(),
  ]);

  return <ProviderDetailClient provider={provider} linkOptions={linkOptions} />;
}
