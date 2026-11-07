import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Block 6: standards, transfer, portfolio, mock interview", () => {
  test("standards map switches industries and shows honest phrasing", async ({ page }) => {
    await page.goto("/lessons/avionics-and-automotive-standards-scope?step=3");
    await expect(page.getByTestId("standards-panel")).toContainText("DO-178C");
    await page.getByTestId("standards-tab-industrial").click();
    await expect(page.getByTestId("standards-panel")).toContainText("IEC 61508");
    await expect(page.getByTestId("standards-honest")).toContainText("diagnostic coverage");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("standards lesson: the certified claim is rejected with the reason", async ({ page }) => {
    await page.goto("/lessons/avionics-and-automotive-standards-scope?step=8");
    await page.getByText("I am DO-178C certified").click();
    await page.getByText("I executed requirements-based test procedures").click();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByText("People are not certified under DO-178C")).toBeVisible();
  });

  test("timed mock interview: timer runs, advances and finishes; rubric still reveals", async ({ page }) => {
    await page.goto("/interview?q=debugging-story,watchdog-strategy&session=29&mock=1");
    await expect(page.getByTestId("interview-focus")).toContainText("Session 29: 2 questions");
    await expect(page.getByTestId("mock-clock")).toHaveText("4:00");
    await page.getByTestId("mock-start").click();
    await expect(page.getByTestId("mock-clock")).toHaveText(/3:5[0-9]/);
    await page.getByTestId("mock-pause").click();
    await page.getByTestId("mock-next").click();
    await expect(page.getByTestId("mock-progress")).toContainText("Question 2 of 2");
    await page.getByTestId("mock-next").click();
    await expect(page.getByTestId("mock-done")).toBeVisible();
    await page.getByTestId("interview-debugging-story").getByTestId("reveal-rubric").click();
    await page.getByTestId("interview-debugging-story").getByTestId("rate-shaky").click();
    await expect(page.getByTestId("interview-debugging-story")).toContainText("Shaky");
  });

  test("journey: all 30 sessions are published and session 29 opens the mock", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByText("All 30 sessions are published.")).toBeVisible();
    const day29 = page.getByTestId("journey-session-29");
    await expect(day29).toContainText("Mock interview");
    await expect(day29.locator('a[href*="mock=1"]')).toHaveCount(1);
  });
});
