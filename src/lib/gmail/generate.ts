export interface GeneratedAlias {
  localPartWithDots: string;
  aliasEmail: string;
  dotCount: number;
}

function* combinationsGen(n: number, k: number): Generator<number[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (k > n) return;

  const indices = Array.from({ length: k }, (_, i) => i);
  yield [...indices];

  while (true) {
    let i = k - 1;
    while (i >= 0 && indices[i] === n - k + i) {
      i--;
    }
    if (i < 0) return;
    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
    yield [...indices];
  }
}

export function generateDotVariations(localPart: string): string[] {
  const n = localPart.length;
  if (n <= 1) return [localPart];

  const positions = n - 1;
  const results: string[] = [];

  for (let dotCount = 0; dotCount <= positions; dotCount++) {
    for (const combo of combinationsGen(positions, dotCount)) {
      const posSet = new Set(combo);
      let variant = "";
      for (let i = 0; i < n; i++) {
        variant += localPart[i];
        if (i < n - 1 && posSet.has(i)) {
          variant += ".";
        }
      }
      results.push(variant);
    }
  }

  return results;
}

export function generateDotAliases(
  localPart: string,
  domain: string,
  count: number,
  existingLocalParts: Set<string>
): GeneratedAlias[] {
  const n = localPart.length;
  if (n <= 1 || count <= 0) return [];

  const positions = n - 1;
  const results: GeneratedAlias[] = [];

  for (let dotCount = 0; dotCount <= positions; dotCount++) {
    for (const combo of combinationsGen(positions, dotCount)) {
      const posSet = new Set(combo);
      let variant = "";
      for (let i = 0; i < n; i++) {
        variant += localPart[i];
        if (i < n - 1 && posSet.has(i)) {
          variant += ".";
        }
      }

      if (existingLocalParts.has(variant)) continue;

      results.push({
        localPartWithDots: variant,
        aliasEmail: `${variant}@${domain}`,
        dotCount,
      });

      if (results.length >= count) return results;
    }
  }

  return results;
}
