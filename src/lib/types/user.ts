export interface User {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
