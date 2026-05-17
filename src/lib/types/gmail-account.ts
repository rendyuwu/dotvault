export interface GmailAccount {
  id: string;
  userId: string;
  originalEmail: string;
  canonicalEmail: string;
  localPart: string;
  domain: string;
  label: string;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
