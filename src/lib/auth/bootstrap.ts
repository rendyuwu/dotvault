import "server-only";

import { z } from "zod";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "./password";

type Env = Record<string, string | undefined>;

const bootstrapSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12),
  displayName: z.string().trim().min(1).default("Admin"),
});

export interface BootstrapAdminInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface BootstrapAdminDeps {
  countUsers: () => Promise<number>;
  createUser: (user: {
    email: string;
    displayName: string;
    passwordHash: string;
    isActive: true;
  }) => Promise<void>;
  hashPassword: (password: string) => Promise<string>;
}

export type BootstrapAdminResult =
  | { status: "created"; email: string }
  | { status: "skipped" };

export function readBootstrapAdminEnv(env: Env = process.env): BootstrapAdminInput {
  return {
    email: env.BOOTSTRAP_ADMIN_EMAIL ?? "",
    password: env.BOOTSTRAP_ADMIN_PASSWORD ?? "",
    displayName: env.BOOTSTRAP_ADMIN_DISPLAY_NAME,
  };
}

export function parseBootstrapAdminInput(input: BootstrapAdminInput) {
  const parsed = bootstrapSchema.safeParse({
    email: input.email,
    password: input.password,
    displayName: input.displayName || "Admin",
  });
  if (!parsed.success) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
  }
  return parsed.data;
}

export function createBootstrapAdminDeps(): BootstrapAdminDeps {
  const db = getDb();
  return {
    countUsers: async () => {
      const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
      return existingUsers.length;
    },
    createUser: async (user) => {
      await db.insert(users).values(user);
    },
    hashPassword,
  };
}

export async function bootstrapAdmin(
  input: BootstrapAdminInput,
  deps?: BootstrapAdminDeps
): Promise<BootstrapAdminResult> {
  const parsed = parseBootstrapAdminInput(input);
  const resolvedDeps = deps ?? createBootstrapAdminDeps();
  const existingUserCount = await resolvedDeps.countUsers();

  if (existingUserCount > 0) return { status: "skipped" };

  const passwordHash = await resolvedDeps.hashPassword(parsed.password);
  await resolvedDeps.createUser({
    email: parsed.email,
    displayName: parsed.displayName,
    passwordHash,
    isActive: true,
  });

  return { status: "created", email: parsed.email };
}
