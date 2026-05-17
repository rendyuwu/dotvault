export interface DotAlias {
  id: string;
  userId: string;
  gmailAccountId: string;
  aliasEmail: string;
  localPartWithDots: string;
  dotCount: number;
  isOriginal: boolean;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
