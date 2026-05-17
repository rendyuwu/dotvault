export interface Provider {
  id: string;
  userId: string;
  name: string;
  website: string | null;
  category: string | null;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
