export type NormalizeSuccess = {
  ok: true;
  originalEmail: string;
  canonicalEmail: string;
  localPart: string;
  domain: string;
};

export type NormalizeError = {
  ok: false;
  error: string;
  code:
    | "INVALID_FORMAT"
    | "INVALID_DOMAIN"
    | "EMPTY_LOCAL_PART"
    | "PLUS_ADDRESSING"
    | "INVALID_SYNTAX";
};

export type NormalizeResult = NormalizeSuccess | NormalizeError;

export function normalizeGmail(input: string): NormalizeResult {
  const trimmed = input.trim().toLowerCase();

  const atIndex = trimmed.indexOf("@");
  if (atIndex === -1 || trimmed.indexOf("@", atIndex + 1) !== -1) {
    return { ok: false, error: "Invalid email format", code: "INVALID_FORMAT" };
  }

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (domain !== "gmail.com") {
    return {
      ok: false,
      error: "Only @gmail.com addresses are supported",
      code: "INVALID_DOMAIN",
    };
  }

  if (localPart.includes("+")) {
    return {
      ok: false,
      error: "Plus-addressing is not supported",
      code: "PLUS_ADDRESSING",
    };
  }

  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return {
      ok: false,
      error: "Invalid Gmail syntax: leading, trailing, or consecutive dots",
      code: "INVALID_SYNTAX",
    };
  }

  const canonical = localPart.replace(/\./g, "");

  if (canonical.length === 0) {
    return {
      ok: false,
      error: "Local part is empty after normalization",
      code: "EMPTY_LOCAL_PART",
    };
  }

  return {
    ok: true,
    originalEmail: trimmed,
    canonicalEmail: `${canonical}@gmail.com`,
    localPart: canonical,
    domain: "gmail.com",
  };
}

export function maxAliasCount(canonicalLocalPartLength: number): number {
  if (canonicalLocalPartLength <= 0) return 0;
  return Math.pow(2, canonicalLocalPartLength - 1);
}
