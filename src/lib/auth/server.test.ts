import { describe, expect, it } from "vitest";
import type { UserRow } from "@/lib/db/schema";
import { toPublicUser } from "./server";

describe("server auth helpers", () => {
  it("maps database users to public users without password hash", () => {
    const user = toPublicUser({
      id: "user-1",
      email: "admin@example.com",
      displayName: "Admin",
      passwordHash: "$argon2id$secret",
      isActive: true,
      createdAt: "2026-05-17T00:00:00.000Z",
      updatedAt: "2026-05-17T00:00:00.000Z",
    } satisfies UserRow);

    expect(user).toEqual({
      id: "user-1",
      email: "admin@example.com",
      displayName: "Admin",
      isActive: true,
      createdAt: "2026-05-17T00:00:00.000Z",
      updatedAt: "2026-05-17T00:00:00.000Z",
    });
    expect(user).not.toHaveProperty("passwordHash");
  });
});
