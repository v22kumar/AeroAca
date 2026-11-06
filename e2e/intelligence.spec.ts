import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Learning intelligence from evidence", () => {
  test("a fresh profile sees module-gap suggestions and a readiness list with no percentages", async ({ page }) => {
    await page.goto("/progress");
    await expect(page.getByTestId("readiness-summary")).toContainText("0 of 17 modules have complete evidence");
    await expect(page.getByTestId("readiness-fundamentals")).toContainText("no evidence yet");
    await expect(page.getByTestId("readiness-fundamentals")).toContainText("Missing:");
    const text = await page.getByTestId("readiness").innerText();
    expect(text).not.toMatch(/%/);
    await expect(page.getByTestId("recommendations")).toContainText("no lesson started yet");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("a wrong answer becomes a retry on Today with its count, and the link reopens that step", async ({ page }) => {
    await page.goto("/lessons/i2c-sensor-not-acknowledging?step=8");
    await page.getByTestId("numeric-input").fill("1.5");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await page.goto("/");
    const rec = page.getByTestId("recommendations").getByTestId("rec-retry").first();
    await expect(rec).toContainText("1 wrong attempt");
    await rec.click();
    await expect(page).toHaveURL(/i2c-sensor-not-acknowledging\?step=8/);
    await expect(page.getByText("Step 8 of")).toBeVisible();
    await page.goto("/progress");
    await expect(page.getByTestId("readiness-interfaces")).toContainText("started");
    await expect(page.getByTestId("readiness-interfaces")).toContainText("1 open wrong");
  });

  test("a shaky interview rating recommends the grounding lesson", async ({ page }) => {
    await page.goto("/interview?q=watchdog-strategy");
    await expect(page.getByText(/of \d+ rated/)).toBeVisible(); // hydrated
    const card = page.getByTestId("interview-watchdog-strategy");
    await card.getByTestId("reveal-rubric").click();
    await card.getByTestId("rate-shaky").click();
    await expect(card).toContainText("Shaky");
    await page.goto("/progress");
    const rec = page.getByTestId("recommendations").locator("a", { hasText: "Watchdogs and reset loops" });
    await expect(rec).toContainText("shaky");
  });
});
