export interface AliasProviderLink {
  id: string;
  userId: string;
  aliasId: string;
  providerId: string;
  accountIdentifier: string | null;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
