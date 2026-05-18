import { describe, expect, it } from "vitest";
import { normalizeGmail } from "./normalize";

describe("normalizeGmail", () => {
  it("trims, lowercases, and canonicalizes Gmail dots", () => {
    expect(normalizeGmail(" Ren.Di.Wijaya@GMAIL.COM ")).toEqual({
      ok: true,
      originalEmail: "ren.di.wijaya@gmail.com",
      canonicalEmail: "rendiwijaya@gmail.com",
      localPart: "rendiwijaya",
      domain: "gmail.com",
    });
  });

  it("rejects non-Gmail domains", () => {
    expect(normalizeGmail("rendi@example.com")).toEqual({
      ok: false,
      error: "Only @gmail.com addresses are supported",
      code: "INVALID_DOMAIN",
    });
  });

  it("rejects plus addressing", () => {
    expect(normalizeGmail("rendi+test@gmail.com")).toEqual({
      ok: false,
      error: "Plus-addressing is not supported",
      code: "PLUS_ADDRESSING",
    });
  });

  it.each([".rendi@gmail.com", "rendi.@gmail.com", "ren..di@gmail.com"])(
    "rejects invalid dot syntax: %s",
    (email) => {
      expect(normalizeGmail(email)).toEqual({
        ok: false,
        error: "Invalid Gmail syntax: leading, trailing, or consecutive dots",
        code: "INVALID_SYNTAX",
      });
    }
  );

  it("rejects invalid email format", () => {
    expect(normalizeGmail("rendi.gmail.com")).toEqual({
      ok: false,
      error: "Invalid email format",
      code: "INVALID_FORMAT",
    });
  });
});
