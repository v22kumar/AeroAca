import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Portfolio track", () => {
  test("stages render, ticks persist, simulation and hardware are recorded separately in the evidence table", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByRole("heading", { name: "STM32 sensor monitoring and fault detection" })).toBeVisible();
    await expect(page.getByTestId("portfolio-progress")).toContainText("0 of");
    await expect(page.getByTestId("stage-requirements")).toContainText("current");
    // Stage 4 has a "both" deliverable: tick only the simulation path.
    const stage = page.getByTestId("stage-firmware");
    await stage.locator("summary").click();
    await page.getByTestId("tick-detect-fn-sim").check();
    await expect(page.getByTestId("deliverable-detect-fn")).not.toHaveClass(/line-through/);
    await expect(page.getByTestId("evidence-summary")).toContainText("Simulation 1/");
    await expect(page.getByTestId("evidence-summary")).toContainText("hardware 0/");
    await expect(page.getByTestId("evidence-summary")).toContainText("Hardware path not attempted");
    await page.reload();
    await page.getByTestId("stage-firmware").locator("summary").click(); // stage bodies mount when opened
    await expect(page.getByTestId("tick-detect-fn-sim")).toBeChecked();
    await expect(page.getByTestId("tick-detect-fn-hw")).not.toBeChecked();
    const row = page.getByTestId("evidence-table").locator("tr", { hasText: "Detection logic as a pure, hardware-free function" });
    await expect(row).toContainText("done");
    await expect(row).toContainText("not done");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("sensor-monitor lab: an injected NACK is detected within the limit; slow drift is reported as a gap", async ({ page }) => {
    await page.goto("/portfolio");
    await page.getByTestId("stage-fault-injection").locator("summary").click();
    await page.getByTestId("lab-run").click();
    await expect(page.getByTestId("lab-result")).toContainText("Declared NACK");
    await expect(page.getByTestId("lab-result")).toContainText("within the 2.0 s requirement");
    await page.getByTestId("lab-fault").selectOption("stuck");
    await page.getByTestId("lab-run").click();
    await expect(page.getByTestId("lab-result")).toContainText("Declared STUCK");
    await expect(page.getByTestId("lab-result")).toContainText("outside the 2.0 s requirement");
    await page.getByTestId("lab-fault").selectOption("drift");
    await page.getByTestId("lab-run").click();
    await expect(page.getByTestId("lab-result")).toContainText("known gap");
    await expect(page.getByText("Simulation. This models the detection rules")).toBeVisible();
  });

  test("journey day 28 links to the portfolio track and the curriculum header links to it", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByTestId("apply-link-portfolio-outline")).toHaveAttribute("href", "/portfolio");
    await page.goto("/curriculum");
    await page.getByTestId("portfolio-link").click();
    await expect(page).toHaveURL(/\/portfolio/);
  });
});
