import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const redirectMock = vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  const setSessionCookieMock = vi.fn();
  const clearSessionCookieMock = vi.fn();
  const verifyPasswordMock = vi.fn();
  const hashPasswordMock = vi.fn();
  const requireUserForActionMock = vi.fn();
  const limitMock = vi.fn();
  const whereMock = vi.fn(() => ({ limit: limitMock }));
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  const updateWhereMock = vi.fn();
  const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
  const updateMock = vi.fn(() => ({ set: updateSetMock }));
  const getDbMock = vi.fn(() => ({ select: selectMock, update: updateMock }));

  return {
    clearSessionCookieMock,
    fromMock,
    getDbMock,
    hashPasswordMock,
    limitMock,
    redirectMock,
    requireUserForActionMock,
    selectMock,
    setSessionCookieMock,
    updateMock,
    updateSetMock,
    updateWhereMock,
    verifyPasswordMock,
    whereMock,
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirectMock,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDbMock,
}));

vi.mock("./password", () => ({
  hashPassword: mocks.hashPasswordMock,
  verifyPassword: mocks.verifyPasswordMock,
}));

vi.mock("./server", () => ({
  requireUserForAction: mocks.requireUserForActionMock,
}));

vi.mock("./session", () => ({
  clearSessionCookie: mocks.clearSessionCookieMock,
  setSessionCookie: mocks.setSessionCookieMock,
}));

import { changePasswordAction, loginAction, logoutAction } from "./actions";
import {
  initialChangePasswordActionState,
  initialLoginActionState,
} from "./action-state";

function createLoginForm(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

function createChangePasswordForm({
  currentPassword = "current-password",
  newPassword = "new-password-123",
  confirmPassword = newPassword,
}: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
} = {}) {
  const formData = new FormData();
  formData.set("currentPassword", currentPassword);
  formData.set("newPassword", newPassword);
  formData.set("confirmPassword", confirmPassword);
  return formData;
}

function mockUser(isActive = true) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    email: "admin@example.com",
    displayName: "Admin",
    passwordHash: "$argon2id$hash",
    isActive,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  };
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limitMock.mockResolvedValue([]);
    mocks.verifyPasswordMock.mockResolvedValue(false);
    mocks.hashPasswordMock.mockResolvedValue("$argon2id$new-hash");
    mocks.requireUserForActionMock.mockResolvedValue(mockUser());
  });

  it("sets session cookie and redirects active users with valid credentials", async () => {
    mocks.limitMock.mockResolvedValue([mockUser()]);
    mocks.verifyPasswordMock.mockResolvedValue(true);

    await expect(
      loginAction(
        initialLoginActionState,
        createLoginForm(" Admin@Example.com ", "correct-password")
      )
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(mocks.setSessionCookieMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001"
    );
    expect(mocks.redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects unknown users with generic error and no cookie", async () => {
    await expect(
      loginAction(
        initialLoginActionState,
        createLoginForm("missing@example.com", "password")
      )
    ).resolves.toEqual({ error: "Invalid email or password" });

    expect(mocks.setSessionCookieMock).not.toHaveBeenCalled();
  });

  it("rejects inactive users with generic error and no cookie", async () => {
    mocks.limitMock.mockResolvedValue([mockUser(false)]);

    await expect(
      loginAction(
        initialLoginActionState,
        createLoginForm("admin@example.com", "password")
      )
    ).resolves.toEqual({ error: "Invalid email or password" });

    expect(mocks.setSessionCookieMock).not.toHaveBeenCalled();
  });

  it("rejects wrong passwords with generic error and no cookie", async () => {
    mocks.limitMock.mockResolvedValue([mockUser()]);
    mocks.verifyPasswordMock.mockResolvedValue(false);

    await expect(
      loginAction(
        initialLoginActionState,
        createLoginForm("admin@example.com", "wrong-password")
      )
    ).resolves.toEqual({ error: "Invalid email or password" });

    expect(mocks.setSessionCookieMock).not.toHaveBeenCalled();
  });

  it("clears session cookie and redirects on logout", async () => {
    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.clearSessionCookieMock).toHaveBeenCalledTimes(1);
    expect(mocks.redirectMock).toHaveBeenCalledWith("/login");
  });

  it("rejects invalid change password form data before DB update", async () => {
    const formData = new FormData();

    await expect(
      changePasswordAction(initialChangePasswordActionState, formData)
    ).resolves.toEqual({
      error: "Invalid input: expected string, received null",
      success: null,
    });

    expect(mocks.requireUserForActionMock).not.toHaveBeenCalled();
    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("rejects too-short new passwords before DB update", async () => {
    await expect(
      changePasswordAction(
        initialChangePasswordActionState,
        createChangePasswordForm({ newPassword: "short", confirmPassword: "short" })
      )
    ).resolves.toEqual({
      error: "New password must be at least 12 characters",
      success: null,
    });

    expect(mocks.requireUserForActionMock).not.toHaveBeenCalled();
    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched new password confirmation before DB update", async () => {
    await expect(
      changePasswordAction(
        initialChangePasswordActionState,
        createChangePasswordForm({ confirmPassword: "different-password-123" })
      )
    ).resolves.toEqual({ error: "New passwords do not match", success: null });

    expect(mocks.requireUserForActionMock).not.toHaveBeenCalled();
    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated password changes before DB update", async () => {
    mocks.requireUserForActionMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      changePasswordAction(initialChangePasswordActionState, createChangePasswordForm())
    ).rejects.toThrow("Unauthorized");

    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("rejects missing users before DB update", async () => {
    mocks.limitMock.mockResolvedValue([]);

    await expect(
      changePasswordAction(initialChangePasswordActionState, createChangePasswordForm())
    ).resolves.toEqual({ error: "Unable to change password", success: null });

    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("rejects inactive users before DB update", async () => {
    mocks.limitMock.mockResolvedValue([mockUser(false)]);

    await expect(
      changePasswordAction(initialChangePasswordActionState, createChangePasswordForm())
    ).resolves.toEqual({ error: "Unable to change password", success: null });

    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("rejects wrong current passwords before DB update", async () => {
    mocks.limitMock.mockResolvedValue([mockUser()]);
    mocks.verifyPasswordMock.mockResolvedValue(false);

    await expect(
      changePasswordAction(initialChangePasswordActionState, createChangePasswordForm())
    ).resolves.toEqual({ error: "Current password is incorrect", success: null });

    expect(mocks.verifyPasswordMock).toHaveBeenCalledWith(
      "$argon2id$hash",
      "current-password"
    );
    expect(mocks.updateMock).not.toHaveBeenCalled();
  });

  it("updates only password hash on successful password change", async () => {
    mocks.limitMock.mockResolvedValue([mockUser()]);
    mocks.verifyPasswordMock.mockResolvedValue(true);
    mocks.hashPasswordMock.mockResolvedValue("$argon2id$new-hash");

    await expect(
      changePasswordAction(initialChangePasswordActionState, createChangePasswordForm())
    ).resolves.toEqual({ error: null, success: "Password updated" });

    expect(mocks.hashPasswordMock).toHaveBeenCalledWith("new-password-123");
    expect(mocks.updateSetMock).toHaveBeenCalledWith({
      passwordHash: "$argon2id$new-hash",
      updatedAt: expect.any(String),
    });
    expect(mocks.updateSetMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ password: expect.any(String) })
    );
    expect(mocks.setSessionCookieMock).not.toHaveBeenCalled();
    expect(mocks.clearSessionCookieMock).not.toHaveBeenCalled();
  });
});
