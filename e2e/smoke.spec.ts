import { expect, test } from "@playwright/test";

test("landing renders in English and switches to Bahasa Indonesia", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Every trip, planned together" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Day-by-day itinerary/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByRole("button", { name: "Bahasa Indonesia" }).click();
  await expect(
    page.getByRole("heading", { name: "Setiap perjalanan, direncanakan bersama" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
});

test("no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("gallery opens and closes the item sheet", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Open item" }).click();
  const sheet = page.getByRole("dialog", { name: "Ramen Ichiran Shibuya" });
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});
