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

test("city search fills in the country and time zone", async ({ page }) => {
  await page.goto("/gallery");
  const box = page.getByRole("combobox", { name: "City" });
  await box.fill("bish");
  await page.getByRole("option", { name: /Bishkek/ }).click();
  await expect(box).toHaveValue("Bishkek");
  await expect(page.getByTestId("picked-city")).toHaveText("KG · Asia/Bishkek");
});

test("plan board: stays span nights, tours show details, add opens the type picker", async ({
  page,
}) => {
  await page.goto("/gallery");
  await expect(page.getByText("Night 2 of 2")).toBeVisible();
  await expect(page.getByText("Check-out")).toBeVisible();

  await page.getByRole("button", { name: /Charyn Canyon day tour/ }).click();
  const detail = page.getByRole("dialog", { name: "Charyn Canyon day tour" });
  await expect(detail.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
    "href",
    "https://wa.me/77015550123",
  );
  await expect(detail.getByText("Kolsai Lake 1")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Add", exact: true }).nth(1).click();
  const add = page.getByRole("dialog", { name: /Add to Day 1/ });
  await add.getByRole("button", { name: /Tour/ }).click();
  await expect(add.getByLabel("Tour operator")).toBeVisible();
  await expect(add.getByLabel("Currency")).toHaveValue("KZT");
});

test("trip dates editor keeps the length and warns before removing days", async ({ page }) => {
  await page.goto("/gallery");
  await page.getByRole("button", { name: "Set dates" }).click();
  const sheet = page.getByRole("dialog", { name: "Trip dates" });
  await sheet.getByLabel("First day").fill("2027-05-01");
  await expect(sheet.getByLabel("Last day")).toHaveValue("2027-05-07");
  await sheet.getByLabel("Last day").fill("2027-05-05");
  await expect(sheet.getByRole("status")).toContainText("Days 6–7 will be removed");
});

test("flights show their own time zones", async ({ page }) => {
  await page.goto("/gallery");
  await expect(page.getByRole("button", { name: /Jakarta → Almaty/ })).toContainText(
    "08:15 WIB → 13:40 Almaty",
  );
});
