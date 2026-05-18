"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { LoginActionState } from "./action-state";
import { verifyPassword } from "./password";
import { clearSessionCookie, setSessionCookie } from "./session";

const INVALID_LOGIN_ERROR = "Invalid email or password";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

function invalidLogin(): LoginActionState {
  return { error: INVALID_LOGIN_ERROR };
}

export async function loginAction(
  _state: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return invalidLogin();

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!user || !user.isActive) return invalidLogin();

  const passwordMatches = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!passwordMatches) return invalidLogin();

  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
