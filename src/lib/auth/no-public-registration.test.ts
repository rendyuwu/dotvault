import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const authDir = join(process.cwd(), "src/app/(auth)");
const appDir = join(process.cwd(), "src/app");

function readAppFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("no public registration surface", () => {
  it("does not expose signup or register routes", () => {
    expect(existsSync(join(authDir, "signup"))).toBe(false);
    expect(existsSync(join(authDir, "register"))).toBe(false);
    expect(existsSync(join(appDir, "api/users"))).toBe(false);
    expect(existsSync(join(appDir, "api/auth/register"))).toBe(false);
    expect(existsSync(join(appDir, "api/auth/signup"))).toBe(false);
  });

  it("keeps login UI free of registration links", () => {
    const loginPage = readAppFile("src/app/(auth)/login/page.tsx");
    const loginForm = readAppFile("src/app/(auth)/login/login-form.tsx");
    const combined = `${loginPage}\n${loginForm}`;

    expect(combined).not.toMatch(/href=["'].*(?:signup|register)/i);
    expect(combined).not.toMatch(/sign\s*up|register/i);
  });
});
