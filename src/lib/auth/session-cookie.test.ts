import { describe, expect, it } from "vitest";
import {
  createSessionValue,
  getExpiredSessionCookieOptions,
  getSessionCookieOptions,
  SESSION_MAX_AGE_SECONDS,
  SESSION_TTL_MS,
  timingSafeStringEqual,
  verifySessionValue,
} from "./session-cookie";

const NOW = 1_800_000_000_000;
const SECRET = "0123456789abcdef0123456789abcdef";

describe("session cookie values", () => {
  it("verifies valid signed session values", () => {
    const value = createSessionValue("user-1", SECRET, NOW);

    expect(verifySessionValue(value, SECRET, NOW)).toEqual({
      userId: "user-1",
      issuedAt: NOW,
      expiresAt: NOW + SESSION_TTL_MS,
    });
  });

  it("rejects tampered signatures", () => {
    const value = createSessionValue("user-1", SECRET, NOW);
    const tampered = value.replace(/.$/, "x");

    expect(verifySessionValue(tampered, SECRET, NOW)).toBeNull();
  });

  it("rejects expired sessions", () => {
    const value = createSessionValue("user-1", SECRET, NOW);

    expect(verifySessionValue(value, SECRET, NOW + SESSION_TTL_MS + 1)).toBeNull();
  });

  it("rejects malformed values", () => {
    expect(verifySessionValue(undefined, SECRET, NOW)).toBeNull();
    expect(verifySessionValue("", SECRET, NOW)).toBeNull();
    expect(verifySessionValue("not-json.signature", SECRET, NOW)).toBeNull();
    expect(verifySessionValue("too.many.parts", SECRET, NOW)).toBeNull();
    expect(verifySessionValue("bad-payload.", SECRET, NOW)).toBeNull();
  });

  it("uses timing-safe string comparison", () => {
    expect(timingSafeStringEqual("abc", "abc")).toBe(true);
    expect(timingSafeStringEqual("abc", "abd")).toBe(false);
    expect(timingSafeStringEqual("abc", "abcd")).toBe(false);
  });

  it("sets V4-compliant cookie options", () => {
    expect(getSessionCookieOptions(false, NOW)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    expect(getSessionCookieOptions(true, NOW)).toMatchObject({ secure: true });
    expect(getExpiredSessionCookieOptions(true)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: 0,
    });
  });
});
