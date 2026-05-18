import { getGmailAccounts } from "@/lib/gmail/accounts-actions";
import { GmailAccountsClient } from "./gmail-accounts-client";

export default async function GmailAccountsPage() {
  const accounts = await getGmailAccounts();

  return <GmailAccountsClient accounts={accounts} />;
}
