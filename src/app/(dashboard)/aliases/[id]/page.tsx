import { getAliasDetail } from "@/lib/aliases/actions";
import { getAliasProviderLinkOptions } from "@/lib/alias-provider-links/actions";
import { AliasDetailClient } from "./alias-detail-client";

export default async function AliasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [alias, linkOptions] = await Promise.all([
    getAliasDetail(id),
    getAliasProviderLinkOptions(),
  ]);

  return <AliasDetailClient alias={alias} linkOptions={linkOptions} />;
}
