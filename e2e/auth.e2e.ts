import { expect, test } from "@playwright/test";
import { admin, expectLoggedIn, login } from "./helpers";

test("protects dashboard routes and supports login/logout", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await expect(page.getByRole("heading", { name: "DotVault" })).toBeVisible();
  await expect(page.getByText("Sign in to your account")).toBeVisible();
  await expect(page.getByRole("link", { name: /register|sign up/i })).toHaveCount(0);

  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();

  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password").fill(admin.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expectLoggedIn(page);

  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "dotvault_session"
  );
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("login helper reaches dashboard with bootstrapped admin", async ({ page }) => {
  await login(page);
  await expectLoggedIn(page);
});
