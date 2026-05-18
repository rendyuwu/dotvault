import { expect, type Page } from "@playwright/test";
import { e2eAdmin } from "../src/lib/e2e/setup";

export const admin = e2eAdmin;

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password").fill(admin.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function expectLoggedIn(page: Page) {
  await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
}

export async function archiveFromDialog(page: Page, name: "Archive" | "Remove") {
  await page.getByRole("dialog").getByRole("button", { name }).click();
}
