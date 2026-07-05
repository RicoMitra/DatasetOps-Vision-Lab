import { expect, test } from "@playwright/test";
import path from "node:path";

test("dashboard renders import and Fast Scan entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("DatasetOps Vision Lab")).toBeVisible();
  await expect(page.getByText("Run Python Audit Engine first")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Import latest-report.json" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browser Fast Scan" })).toBeVisible();
  await expect(page.getByText("No semantic object understanding.")).toBeVisible();
  await expect(page.getByText("Not checked in Fast Scan").first()).toBeVisible();
});

test("mobile viewport has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasOverflow).toBe(false);
});

test("imports latest-report.json and renders evidence", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Import latest-report.json").setInputFiles(path.resolve("../..", "tests/fixtures/latest-report.json"));

  await expect(page.getByText("samples/tiny-dataset")).toBeVisible();
  await expect(page.getByText("52.8")).toBeVisible();
  await expect(page.getByText("Exact duplicate images appear across train/validation/test splits.")).toBeVisible();
});
