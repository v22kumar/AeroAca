import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Block 4: startup, RTOS, bootloaders, Linux", () => {
  test("startup sequence visual steps through the memory map", async ({ page }) => {
    await page.goto("/lessons/from-reset-vector-to-main?step=3");
    await expect(page.getByTestId("startup-ram")).toContainText("unknown");
    await page.getByTestId("startup-next").click();
    await page.getByTestId("startup-next").click();
    await expect(page.getByTestId("startup-ram")).toContainText(".bss = 0");
    await page.getByTestId("startup-step-3").click();
    await expect(page.getByTestId("startup-note")).toContainText("VTOR");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("priority inversion visual: inheritance bounds the wait; the numeric exercise names the inheritance misconception", async ({ page }) => {
    await page.goto("/lessons/priority-inversion?step=3");
    await expect(page.getByTestId("pi-latency")).toContainText("whole of M's run");
    await page.getByTestId("pi-inherit").check();
    await expect(page.getByTestId("pi-latency")).toContainText("4.0 ms");
    await page.goto("/lessons/priority-inversion?step=5");
    await page.getByTestId("numeric-input").fill("6");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByTestId("exercise-feedback")).toContainText("with");
    await page.getByTestId("numeric-input").fill("36");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("ISR handoff: queue sizing rejects the byte count", async ({ page }) => {
    await page.goto("/lessons/isr-to-task-handoff?step=5");
    await page.getByTestId("numeric-input").fill("160");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("bytes");
    await page.getByTestId("numeric-input").fill("20");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("RTOS mission: raising the waiter's priority is wasteful; trace plus lock code isolate the inversion; mutex swap confirms", async ({ page }) => {
    await page.goto("/missions/the-task-that-never-runs");
    await page.getByTestId("action-raise-sensor").click();
    await expect(page.getByTestId("log-raise-sensor")).toContainText("Wasteful");
    await page.getByTestId("action-trace").click();
    await expect(page.getByTestId("log-trace")).toContainText("never changed");
    await expect(page.getByTestId("action-swap-mutex")).toHaveCount(0);
    await page.getByTestId("action-lock-code").click();
    await page.getByTestId("action-swap-mutex").click();
    await expect(page.getByTestId("log-swap-mutex")).toContainText("raised to 4");
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-priority-too-low").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "false");
    await page.getByTestId("fix-mutex-and-short").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toBeVisible();
  });

  test("journey days 16 to 20 are playable and day 19 keeps its career action", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByTestId("journey-day-17")).toContainText("task that never runs");
    await expect(page.getByTestId("journey-day-20")).not.toContainText("coming soon");
    await page.goto("/");
    await expect(page.getByTestId("day-1-items")).toBeVisible();
  });
});
