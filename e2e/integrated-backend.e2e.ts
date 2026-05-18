import { expect, test } from "@playwright/test";
import { archiveFromDialog, login } from "./helpers";

test("preserves integrated backend golden path", async ({ page }) => {
  await login(page);

  await page.getByRole("link", { name: "Gmail Accounts", exact: true }).click();
  await page.getByRole("link", { name: "Add Account" }).first().click();
  await page.getByLabel("Gmail Address").fill(" A.Bcde@gmail.com ");
  await page.getByLabel("Label").fill("E2E Gmail");
  await page.getByLabel(/Notes/).fill("E2E Gmail notes");
  await expect(page.getByText("Canonical:")).toBeVisible();
  await expect(page.getByText("abcde@gmail.com")).toBeVisible();
  await page.getByRole("button", { name: "Add Account" }).click();
  await expect(page).toHaveURL(/\/gmail-accounts$/);
  await expect(page.getByText("E2E Gmail", { exact: true })).toBeVisible();
  await expect(page.getByText("a.bcde@gmail.com")).toBeVisible();
  await expect(page.getByText("canonical: abcde@gmail.com")).toBeVisible();
  await expect(page.getByText("1 aliases")).toBeVisible();

  await page.getByRole("link", { name: "Add Account" }).first().click();
  await page.getByLabel("Gmail Address").fill("abcde@gmail.com");
  await page.getByLabel("Label").fill("Duplicate Gmail");
  await expect(page.getByText("This Gmail account already exists")).toBeVisible();

  await page.getByRole("link", { name: "Generate", exact: true }).click();
  await page.getByLabel("Gmail Account").selectOption({ label: "E2E Gmail — a.bcde@gmail.com" });
  await expect(page.getByText("Total Possible")).toBeVisible();
  await expect(page.getByText("16")).toBeVisible();
  await page.getByLabel("Number to Generate").fill("3");
  await page.getByRole("button", { name: "Generate Preview" }).click();
  await expect(page.getByText("Preview (3 aliases)")).toBeVisible();
  await expect(page.getByRole("cell", { name: "a.bcde@gmail.com" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "ab.cde@gmail.com" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "abc.de@gmail.com" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy All" })).toBeVisible();
  await page.getByRole("button", { name: "Save Aliases" }).click();
  await expect(page.getByText("3 aliases saved")).toBeVisible();

  await page.getByRole("button", { name: "Generate Preview" }).click();
  await expect(page.getByRole("cell", { name: "abcd.e@gmail.com" })).toBeVisible();

  await page.getByRole("link", { name: "Aliases", exact: true }).click();
  await page.getByLabel("Search aliases by email").fill("ab.cde");
  await page.keyboard.press("Enter");
  await expect(page.getByText("ab.cde")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy ab.cde@gmail.com" })).toBeVisible();
  await page.getByRole("link", { name: "View ab.cde@gmail.com details" }).click();
  await expect(page).toHaveURL(/\/aliases\//);
  await expect(page.getByText("ab.cde@gmail.com")).toBeVisible();
  await page.getByRole("button", { name: "Edit notes" }).click();
  await page.getByPlaceholder("Add notes about this alias...").fill("Alias e2e note");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Alias e2e note")).toBeVisible();

  await page.getByRole("link", { name: "Providers", exact: true }).click();
  await page.getByRole("button", { name: "Add Provider" }).first().click();
  await page.locator("#new-provider-name").fill("E2E Provider");
  await page.locator("#new-provider-website").fill("example.com");
  await page.locator("#new-provider-category").fill("Developer Tools");
  await page.locator("#new-provider-notes").fill("Provider e2e note");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("E2E Provider")).toBeVisible();
  await page.getByText("E2E Provider").click();
  await expect(page).toHaveURL(/\/providers\//);
  await page.getByRole("button", { name: "Edit provider" }).click();
  await page.locator("#edit-provider-name").fill("E2E Provider Updated");
  await page.locator("#edit-provider-category").fill("QA Tools");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "E2E Provider Updated" })).toBeVisible();
  await expect(page.getByText("QA Tools")).toBeVisible();
  await page.getByRole("button", { name: "Edit notes" }).click();
  await page.getByPlaceholder("Add notes about this provider...").fill("Provider detail note");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Provider detail note")).toBeVisible();

  await page.goto("/aliases?search=ab.cde");
  await page.getByRole("link", { name: "View ab.cde@gmail.com details" }).click();
  await page.getByRole("button", { name: "Link Provider" }).click();
  let dialog = page.getByRole("dialog", { name: "Link Provider" });
  await dialog.getByLabel("Provider", { exact: true }).selectOption({ label: "E2E Provider Updated (QA Tools)" });
  await dialog.getByLabel("Account Identifier").fill("acct-ab-cde");
  await dialog.getByLabel("Notes").fill("Initial link note");
  await dialog.getByRole("button", { name: "Create Link" }).click();
  await expect(page.getByText("Link created")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 2_000 });
  await expect(page.getByText("E2E Provider Updated")).toBeVisible();
  await expect(page.getByText("acct-ab-cde")).toBeVisible();

  await page.getByRole("button", { name: "Link Provider" }).click();
  dialog = page.getByRole("dialog", { name: "Link Provider" });
  await dialog.getByLabel("Provider", { exact: true }).selectOption({ label: "E2E Provider Updated (QA Tools)" });
  await expect(dialog.getByText("This alias is already linked to this provider.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Create Link" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "Edit E2E Provider Updated link" }).click();
  await page.getByPlaceholder("Account identifier").fill("acct-updated");
  await page.getByPlaceholder("Link notes").fill("Updated link note");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("acct-updated")).toBeVisible();
  await expect(page.getByText("Updated link note")).toBeVisible();
  await page.getByRole("link", { name: "E2E Provider Updated", exact: true }).click();
  await expect(page.getByText("ab.cde@gmail.com")).toBeVisible();
  await expect(page.getByText("acct-updated")).toBeVisible();

  await page.getByRole("button", { name: "Edit link" }).click();
  await page.locator("tbody input").first().fill("provider-side-id");
  await page.locator("tbody input").nth(1).fill("Provider-side link note");
  await page.getByRole("button", { name: "Save link" }).click();
  await expect(page.getByText("provider-side-id")).toBeVisible();
  await expect(page.getByText("Provider-side link note")).toBeVisible();

  await page.getByRole("button", { name: "Remove link" }).click();
  await archiveFromDialog(page, "Remove");
  await expect(page.getByText("No aliases linked yet.")).toBeVisible();

  await page.getByRole("button", { name: "Archive provider" }).click();
  await archiveFromDialog(page, "Archive");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("archived")).toBeVisible();
  await page.goto("/providers");
  await expect(page.getByText("E2E Provider Updated")).toHaveCount(0);
  await page.getByLabel(/Show archived/).click();
  await expect(page).toHaveURL(/\/providers\?archived=1$/);
  await expect(page.getByText("E2E Provider Updated")).toBeVisible();

  await page.goto("/aliases?search=ab.cde");
  await page.getByRole("link", { name: "View ab.cde@gmail.com details" }).click();
  await page.getByRole("button", { name: "Archive alias" }).click();
  await archiveFromDialog(page, "Archive");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("archived")).toBeVisible();
  await page.goto("/aliases?search=ab.cde");
  await expect(page.getByText("ab.cde@gmail.com")).toHaveCount(0);
  await page.getByLabel(/Archived/).click();
  await expect(page).toHaveURL(/\/aliases\?search=ab\.cde&archived=1$/);
  await expect(page.getByText("ab.cde")).toBeVisible();

  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Acceptable Use Policy" })).toBeVisible();
  await expect(page.getByText("Provider signup bots")).toBeVisible();
  await expect(page.getByText("CAPTCHA bypass")).toBeVisible();
  await expect(page.getByText("ban evasion")).toBeVisible();
});
