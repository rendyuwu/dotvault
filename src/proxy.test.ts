import { describe, expect, it } from "vitest";
import { createSessionValue } from "@/lib/auth/session-cookie";
import { getProxyRedirectPath, isProtectedPath } from "./proxy";

const SECRET = "0123456789abcdef0123456789abcdef";
const SESSION = createSessionValue("user-1", SECRET);

const protectedPaths = [
  "/dashboard",
  "/gmail-accounts",
  "/gmail-accounts/new",
  "/generate",
  "/aliases",
  "/aliases/example",
  "/providers",
  "/providers/example",
  "/settings",
];

describe("proxy auth redirects", () => {
  it("recognizes all protected dashboard paths", () => {
    for (const path of protectedPaths) {
      expect(isProtectedPath(path)).toBe(true);
    }
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("redirects unauthenticated protected requests to login", () => {
    for (const path of protectedPaths) {
      expect(getProxyRedirectPath(path, undefined, SECRET)).toBe("/login");
    }
  });

  it("allows authenticated protected requests", () => {
    for (const path of protectedPaths) {
      expect(getProxyRedirectPath(path, SESSION, SECRET)).toBeNull();
    }
  });

  it("lets login page perform DB-backed authenticated redirects", () => {
    expect(getProxyRedirectPath("/login", SESSION, SECRET)).toBeNull();
    expect(getProxyRedirectPath("/login", undefined, SECRET)).toBeNull();
  });
});
