import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const redirectMock = vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  const setSessionCookieMock = vi.fn();
  const clearSessionCookieMock = vi.fn();
  const verifyPasswordMock = vi.fn();
  const limitMock = vi.fn();
  const whereMock = vi.fn(() => ({ limit: limitMock }));
  const fromMock = vi.fn(() => ({ where: whereMock }));
  const selectMock = vi.fn(() => ({ from: fromMock }));
  const getDbMock = vi.fn(() => ({ select: selectMock }));

  return {
    clearSessionCookieMock,
    getDbMock,
    limitMock,
    redirectMock,
    setSessionCookieMock,
    verifyPasswordMock,
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirectMock,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDbMock,
}));

vi.mock("./password", () => ({
  verifyPassword: mocks.verifyPasswordMock,
}));

vi.mock("./session", () => ({
  clearSessionCookie: mocks.clearSessionCookieMock,
  setSessionCookie: mocks.setSessionCookieMock,
}));

import { loginAction, logoutAction } from "./actions";
import { initialLoginActionState } from "./action-state";

function createLoginForm(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

function mockUser(isActive = true) {
  return {
    id: "user-1",
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
  });

  it("sets session cookie and redirects active users with valid credentials", async () => {
    mocks.limitMock.mockResolvedValue([mockUser()]);
    mocks.verifyPasswordMock.mockResolvedValue(true);

    await expect(
      loginAction(initialLoginActionState, createLoginForm(" Admin@Example.com ", "correct-password"))
    ).rejects.toThrow("NEXT_REDIRECT:/dashboard");

    expect(mocks.setSessionCookieMock).toHaveBeenCalledWith("user-1");
    expect(mocks.redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects unknown users with generic error and no cookie", async () => {
    await expect(
      loginAction(initialLoginActionState, createLoginForm("missing@example.com", "password"))
    ).resolves.toEqual({ error: "Invalid email or password" });

    expect(mocks.setSessionCookieMock).not.toHaveBeenCalled();
  });

  it("rejects inactive users with generic error and no cookie", async () => {
    mocks.limitMock.mockResolvedValue([mockUser(false)]);

    await expect(
      loginAction(initialLoginActionState, createLoginForm("admin@example.com", "password"))
    ).resolves.toEqual({ error: "Invalid email or password" });

    expect(mocks.setSessionCookieMock).not.toHaveBeenCalled();
  });

  it("rejects wrong passwords with generic error and no cookie", async () => {
    mocks.limitMock.mockResolvedValue([mockUser()]);
    mocks.verifyPasswordMock.mockResolvedValue(false);

    await expect(
      loginAction(initialLoginActionState, createLoginForm("admin@example.com", "wrong-password"))
    ).resolves.toEqual({ error: "Invalid email or password" });

    expect(mocks.setSessionCookieMock).not.toHaveBeenCalled();
  });

  it("clears session cookie and redirects on logout", async () => {
    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(mocks.clearSessionCookieMock).toHaveBeenCalledTimes(1);
    expect(mocks.redirectMock).toHaveBeenCalledWith("/login");
  });
});
