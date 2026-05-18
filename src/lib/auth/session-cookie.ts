import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "dotvault_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000;
const ISSUED_AT_SKEW_MS = 60 * 1000;

export interface SessionPayload {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

interface CookieOptions {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  secure: boolean;
  maxAge: number;
  expires: Date;
}

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): unknown {
  if (!value || !BASE64URL_PATTERN.test(value)) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function signEncodedPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function timingSafeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidPayload(payload: unknown, now: number): payload is SessionPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<SessionPayload>;
  const { userId, issuedAt, expiresAt } = candidate;

  if (typeof userId !== "string" || !userId) return false;
  if (typeof issuedAt !== "number" || typeof expiresAt !== "number") return false;
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return false;
  if (!Number.isInteger(issuedAt) || !Number.isInteger(expiresAt)) return false;
  if (issuedAt < 0 || issuedAt > now + ISSUED_AT_SKEW_MS) return false;
  if (expiresAt <= issuedAt) return false;
  if (expiresAt <= now) return false;
  if (expiresAt - issuedAt > SESSION_TTL_MS + ISSUED_AT_SKEW_MS) return false;
  return true;
}

export function createSessionValue(
  userId: string,
  secret: string,
  now = Date.now()
): string {
  if (!userId) throw new Error("Session userId is required");
  const payload: SessionPayload = {
    userId,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  const encodedPayload = encodePayload(payload);
  const signature = signEncodedPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionValue(
  value: string | undefined,
  secret: string | undefined,
  now = Date.now()
): SessionPayload | null {
  if (!value || !secret) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;
  if (!BASE64URL_PATTERN.test(signature)) return null;

  const expectedSignature = signEncodedPayload(encodedPayload, secret);
  if (!timingSafeStringEqual(signature, expectedSignature)) return null;

  const payload = decodePayload(encodedPayload);
  if (!isValidPayload(payload, now)) return null;
  return payload;
}

export function getSessionCookieOptions(
  secure: boolean,
  now = Date.now()
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: new Date(now + SESSION_TTL_MS),
  };
}

export function getExpiredSessionCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: 0,
    expires: new Date(0),
  };
}
