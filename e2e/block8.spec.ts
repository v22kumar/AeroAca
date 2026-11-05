import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Curriculum depth: fundamentals, schematics, CAN, NVIC, drivers", () => {
  test("ADC calculator: LSB and code follow the reference; ripple survives averaging", async ({ page }) => {
    await page.goto("/lessons/adc-resolution-reference-and-noise?step=3");
    await expect(page.getByTestId("adc-lsb")).toContainText("0.806 mV");
    await expect(page.getByTestId("adc-code")).toContainText("code 1241");
    await page.getByTestId("adc-n").fill("256");
    await expect(page.getByTestId("adc-noise")).toContainText("ripple part 0.88 LSB (unchanged)");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("CAN arbitration: the lower identifier wins at the first differing bit", async ({ page }) => {
    await page.goto("/lessons/can-arbitration-error-frames-and-bus-off?step=3");
    for (let i = 0; i < 11; i++) await page.getByTestId("can-step").click();
    await expect(page.getByTestId("can-result")).toContainText("node A sent recessive");
    await expect(page.getByTestId("can-result")).toContainText("Node B (0x11F) continues");
    await page.goto("/lessons/can-arbitration-error-frames-and-bus-off?step=7");
    await page.getByTestId("numeric-input").fill("120");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("one terminator alone");
    await page.getByTestId("numeric-input").fill("60");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("NVIC table: grouping changes preemption; kernel-call rule follows the limit", async ({ page }) => {
    await page.goto("/lessons/interrupts-and-nvic-priorities?step=3");
    await expect(page.getByTestId("nvic-row-0")).toContainText("CAN RX, UART RX");
    await expect(page.getByTestId("nvic-row-0")).toContainText("forbidden");
    await page.getByTestId("nvic-group").selectOption("2");
    await expect(page.getByTestId("nvic-row-1")).toContainText("same level as UART RX");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("PWM calculator and the non-integer prescaler exercise", async ({ page }) => {
    await page.goto("/lessons/polling-interrupts-and-dma?step=3");
    await expect(page.getByTestId("pwm-freq")).toContainText("20.000 kHz");
    await expect(page.getByTestId("pwm-duty")).toContainText("25.00 %");
    await page.goto("/lessons/polling-interrupts-and-dma?step=5");
    await page.getByTestId("numeric-input").fill("3.36");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("PSC + 1");
    await page.getByTestId("numeric-input").fill("2.36");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("rail-sag mission: scope at the load and path resistance isolate I × R; setpoint raise is risky", async ({ page }) => {
    await page.goto("/missions/the-rail-that-sags");
    await page.getByTestId("action-raise-setpoint").click();
    await expect(page.getByTestId("log-raise-setpoint")).toContainText("Risky");
    await page.getByTestId("action-scope-load").click();
    await expect(page.getByTestId("log-scope-load")).toContainText("2.90 V");
    await page.getByTestId("action-measure-path").click();
    await page.getByTestId("action-add-bulk").click();
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-regulator-weak").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "false");
    await page.getByTestId("fix-path-and-bulk").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toBeVisible();
  });

  test("schematic mission: boot strap and I2C boundary findings; the shifter demand is wasteful", async ({ page }) => {
    await page.goto("/missions/the-schematic-that-almost-shipped");
    await page.getByTestId("action-demand-shifter").click();
    await expect(page.getByTestId("log-demand-shifter")).toContainText("Wasteful");
    await expect(page.getByTestId("action-write-findings")).toHaveCount(0);
    await page.getByTestId("action-walk-boot").click();
    await page.getByTestId("action-walk-i2c").click();
    await page.getByTestId("action-write-findings").click();
    await expect(page.getByTestId("log-write-findings")).toContainText("R-01");
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-must-fix-set").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("fix-findings-release").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toBeVisible();
  });

  test("curriculum shows the new modules published and one planned lesson remains", async ({ page }) => {
    await page.goto("/curriculum");
    await expect(page.getByRole("link", { name: /Reading a power tree/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /RAII for peripherals/ })).toBeVisible();
    await expect(page.getByText("Coming soon").first()).toBeVisible();
  });
});
