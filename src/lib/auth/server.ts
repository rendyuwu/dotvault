import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { users, type UserRow } from "@/lib/db/schema";
import type { User } from "@/lib/types";
import { readSessionCookie } from "./session";

export function toPublicUser(user: UserRow): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await readSessionCookie();
  if (!session) return null;

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || !user.isActive) return null;
  return toPublicUser(user);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireUserForAction(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
