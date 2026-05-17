import { describe, it, expect } from "vitest";
import { generateDotVariations, generateDotAliases } from "./generate";

describe("generateDotVariations", () => {
  it("returns single variation for 1-char input", () => {
    expect(generateDotVariations("a")).toEqual(["a"]);
  });

  it("returns 2 variations for 2-char input in correct order", () => {
    expect(generateDotVariations("ab")).toEqual(["ab", "a.b"]);
  });

  it("returns 4 variations for 3-char input in correct order", () => {
    expect(generateDotVariations("abc")).toEqual([
      "abc",
      "a.bc",
      "ab.c",
      "a.b.c",
    ]);
  });

  it("returns 8 variations for 4-char input in correct order", () => {
    expect(generateDotVariations("abcd")).toEqual([
      "abcd",
      "a.bcd",
      "ab.cd",
      "abc.d",
      "a.b.cd",
      "a.bc.d",
      "ab.c.d",
      "a.b.c.d",
    ]);
  });

  it("returns 2^(n-1) variations for lengths 1-10", () => {
    for (let n = 1; n <= 10; n++) {
      const input = "abcdefghij".slice(0, n);
      const results = generateDotVariations(input);
      expect(results.length).toBe(Math.pow(2, n - 1));
    }
  });

  it("never produces leading, trailing, or consecutive dots", () => {
    const results = generateDotVariations("abcde");
    for (const r of results) {
      expect(r).not.toMatch(/^\./);
      expect(r).not.toMatch(/\.$/);
      expect(r).not.toMatch(/\.\./);
    }
  });

  it("maintains left-to-right order within same dot count", () => {
    const results = generateDotVariations("abcde");
    const byDotCount = new Map<number, string[]>();
    for (const r of results) {
      const dots = (r.match(/\./g) || []).length;
      if (!byDotCount.has(dots)) byDotCount.set(dots, []);
      byDotCount.get(dots)!.push(r);
    }

    for (const [, variants] of byDotCount) {
      for (let i = 0; i < variants.length - 1; i++) {
        const posA = getPositions(variants[i]);
        const posB = getPositions(variants[i + 1]);
        expect(compareLex(posA, posB)).toBe(-1);
      }
    }
  });

  it("returns empty string input as-is", () => {
    expect(generateDotVariations("")).toEqual([""]);
  });
});

describe("generateDotAliases", () => {
  it("skips existing local parts", () => {
    const existing = new Set(["abc", "a.bc"]);
    const results = generateDotAliases("abc", "gmail.com", 10, existing);
    const locals = results.map((r) => r.localPartWithDots);
    expect(locals).not.toContain("abc");
    expect(locals).not.toContain("a.bc");
    expect(locals).toContain("ab.c");
    expect(locals).toContain("a.b.c");
  });

  it("respects count limit", () => {
    const results = generateDotAliases("abcde", "gmail.com", 3, new Set());
    expect(results.length).toBe(3);
  });

  it("returns correct aliasEmail format", () => {
    const results = generateDotAliases("ab", "gmail.com", 10, new Set());
    for (const r of results) {
      expect(r.aliasEmail).toBe(`${r.localPartWithDots}@gmail.com`);
    }
  });

  it("returns correct dotCount for each result", () => {
    const results = generateDotAliases("abcd", "gmail.com", 100, new Set());
    for (const r of results) {
      const dots = (r.localPartWithDots.match(/\./g) || []).length;
      expect(r.dotCount).toBe(dots);
    }
  });

  it("returns empty array for single-char local part", () => {
    const results = generateDotAliases("a", "gmail.com", 10, new Set());
    expect(results).toEqual([]);
  });

  it("returns empty array for count 0", () => {
    const results = generateDotAliases("abc", "gmail.com", 0, new Set());
    expect(results).toEqual([]);
  });
});

function getPositions(variant: string): number[] {
  const positions: number[] = [];
  let charIndex = 0;
  for (let i = 0; i < variant.length; i++) {
    if (variant[i] === ".") {
      positions.push(charIndex - 1);
    } else {
      charIndex++;
    }
  }
  return positions;
}

function compareLex(a: number[], b: number[]): -1 | 0 | 1 {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  if (a.length < b.length) return -1;
  if (a.length > b.length) return 1;
  return 0;
}
