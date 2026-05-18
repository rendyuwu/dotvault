import { getExistingGmailCanonicalEmails } from "@/lib/gmail/accounts-actions";
import { NewGmailAccountForm } from "./new-gmail-account-form";

export default async function NewGmailAccountPage() {
  const existingCanonicalEmails = await getExistingGmailCanonicalEmails();

  return (
    <NewGmailAccountForm existingCanonicalEmails={existingCanonicalEmails} />
  );
}
