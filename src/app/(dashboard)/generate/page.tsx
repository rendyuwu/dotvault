import { getGeneratePageAccounts } from "@/lib/gmail/generate-actions";
import { GenerateClient } from "./generate-client";

export default async function GeneratePage() {
  const accounts = await getGeneratePageAccounts();

  return <GenerateClient accounts={accounts} />;
}
