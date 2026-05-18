import { describe, expect, it, vi } from "vitest";
import {
  bootstrapAdmin,
  parseBootstrapAdminInput,
  readBootstrapAdminEnv,
  type BootstrapAdminDeps,
} from "./bootstrap";

describe("admin bootstrap", () => {
  it("reads bootstrap environment variables", () => {
    expect(
      readBootstrapAdminEnv({
        BOOTSTRAP_ADMIN_EMAIL: "Admin@Example.com",
        BOOTSTRAP_ADMIN_PASSWORD: "long-password",
        BOOTSTRAP_ADMIN_DISPLAY_NAME: "Owner",
      })
    ).toEqual({
      email: "Admin@Example.com",
      password: "long-password",
      displayName: "Owner",
    });
  });

  it("rejects missing or weak bootstrap input", () => {
    expect(() => parseBootstrapAdminInput({ email: "", password: "" })).toThrow(
      "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required"
    );
    expect(() =>
      parseBootstrapAdminInput({ email: "admin@example.com", password: "short" })
    ).toThrow("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required");
  });

  it("normalizes email and default display name", () => {
    expect(
      parseBootstrapAdminInput({
        email: " Admin@Example.com ",
        password: "long-secure-password",
      })
    ).toEqual({
      email: "admin@example.com",
      password: "long-secure-password",
      displayName: "Admin",
    });
  });

  it("skips bootstrap when a user already exists", async () => {
    const deps: BootstrapAdminDeps = {
      countUsers: vi.fn(async () => 1),
      createUser: vi.fn(),
      hashPassword: vi.fn(),
    };

    await expect(
      bootstrapAdmin({ email: "admin@example.com", password: "long-secure-password" }, deps)
    ).resolves.toEqual({ status: "skipped" });
    expect(deps.hashPassword).not.toHaveBeenCalled();
    expect(deps.createUser).not.toHaveBeenCalled();
  });

  it("creates first admin with hashed password only", async () => {
    const deps: BootstrapAdminDeps = {
      countUsers: vi.fn(async () => 0),
      createUser: vi.fn(async () => undefined),
      hashPassword: vi.fn(async () => "$argon2id$hash"),
    };

    await expect(
      bootstrapAdmin({ email: "Admin@Example.com", password: "long-secure-password" }, deps)
    ).resolves.toEqual({ status: "created", email: "admin@example.com" });
    expect(deps.hashPassword).toHaveBeenCalledWith("long-secure-password");
    expect(deps.createUser).toHaveBeenCalledWith({
      email: "admin@example.com",
      displayName: "Admin",
      passwordHash: "$argon2id$hash",
      isActive: true,
    });
    expect(deps.createUser).not.toHaveBeenCalledWith(
      expect.objectContaining({ password: "long-secure-password" })
    );
  });
});
