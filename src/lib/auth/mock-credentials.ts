import { mockUsers } from "@/lib/mock-data";
import type { User } from "@/lib/types";

const MOCK_PASSWORD = "admin123";

export function validateCredentials(
  email: string,
  password: string
): User | null {
  const user = mockUsers.find(
    (u) => u.email === email.trim().toLowerCase() && u.isActive
  );
  if (!user || password !== MOCK_PASSWORD) return null;
  return user;
}
