"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireUserForAction } from "./server";
import type { ChangePasswordActionState, LoginActionState } from "./action-state";
import { hashPassword, verifyPassword } from "./password";
import { clearSessionCookie, setSessionCookie } from "./session";

const INVALID_LOGIN_ERROR = "Invalid email or password";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "New password must be at least 12 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
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

export async function changePasswordAction(
  _state: ChangePasswordActionState,
  formData: FormData
): Promise<ChangePasswordActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid password change request",
      success: null,
    };
  }

  const user = await requireUserForAction();
  const db = getDb();
  const [currentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!currentUser || !currentUser.isActive) {
    return { error: "Unable to change password", success: null };
  }

  const passwordMatches = await verifyPassword(
    currentUser.passwordHash,
    parsed.data.currentPassword
  );
  if (!passwordMatches) {
    return { error: "Current password is incorrect", success: null };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date().toISOString() })
    .where(eq(users.id, user.id));

  return { error: null, success: "Password updated" };
}
