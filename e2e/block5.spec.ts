import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Block 5: automation, HIL, FMEA", () => {
  test("SCPI console: identity, configuration, a reading, an unknown command and the error queue", async ({ page }) => {
    await page.goto("/lessons/talking-to-an-instrument-with-pyvisa?step=3");
    const input = page.getByTestId("scpi-input");
    await input.fill("*IDN?");
    await page.getByTestId("scpi-send").click();
    await expect(page.getByTestId("scpi-log")).toContainText("SIM-DMM");
    await input.fill("SENS:VOLT:DC:NPLC 10");
    await page.getByTestId("scpi-send").click();
    await expect(page.getByTestId("scpi-state")).toContainText("NPLC 10");
    await input.fill("READ?");
    await page.getByTestId("scpi-send").click();
    await expect(page.getByTestId("scpi-log")).toContainText("reply after 200 ms");
    await input.fill("MEAS:VLOT:DC?");
    await page.getByTestId("scpi-send").click();
    await expect(page.getByTestId("scpi-state")).toContainText("error queue 1");
    await input.fill("SYST:ERR?");
    await page.getByTestId("scpi-send").click();
    await expect(page.getByTestId("scpi-log")).toContainText("-113");
    await expect(page.getByTestId("scpi-state")).toContainText("error queue 0");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("PyVISA lesson: NPLC arithmetic names the 60 Hz misconception", async ({ page }) => {
    await page.goto("/lessons/talking-to-an-instrument-with-pyvisa?step=6");
    await page.getByTestId("numeric-input").fill("1333");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("60 Hz");
    await page.getByTestId("numeric-input").fill("1600");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("FMEA worksheet: detection action lowers RPN, severity stays; the exercise rejects lowering severity", async ({ page }) => {
    await page.goto("/lessons/fmea-for-a-small-embedded-product?step=3");
    await expect(page.getByTestId("fmea-rpn")).toContainText("9 × 4 × 10 = 360");
    await page.getByTestId("fmea-range-check").check();
    await expect(page.getByTestId("fmea-rpn")).toContainText("9 × 4 × 2 = 72");
    await page.getByTestId("fmea-lock").check();
    await expect(page.getByTestId("fmea-rpn")).toContainText("9 × 2 × 2 = 36");
    await expect(page.getByTestId("fmea-band")).toContainText("Medium");
    await page.goto("/lessons/fmea-for-a-small-embedded-product?step=5");
    await page.getByTestId("numeric-input").fill("27");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("never changes severity");
    await page.getByTestId("numeric-input").fill("72");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("flaky-test mission: the log and the helper isolate the late reply; sleep is risky; protocol fix confirms", async ({ page }) => {
    await page.goto("/missions/the-flaky-automated-test");
    await page.getByTestId("action-add-sleep").click();
    await expect(page.getByTestId("log-add-sleep")).toContainText("Risky");
    await page.getByTestId("action-read-log").click();
    await expect(page.getByTestId("log-read-log")).toContainText("1 030 ms");
    await expect(page.getByTestId("action-fix-protocol")).toHaveCount(0);
    await page.getByTestId("action-read-code").click();
    await page.getByTestId("action-fix-protocol").click();
    await expect(page.getByTestId("log-fix-protocol")).toContainText("zero failures");
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-late-reply-misattributed").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("fix-protocol").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toBeVisible();
  });

  test("journey days 21 to 25 are playable", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByTestId("journey-day-24")).toContainText("flaky automated test");
    await expect(page.getByTestId("journey-day-25")).not.toContainText("coming soon");
  });
});
