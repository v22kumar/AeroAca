import { expect, test } from "@playwright/test";

test.describe("30-day journey", () => {
  test("Today shows day 1 with a checklist; ticking a career action persists; the journey page lists 30 days", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("next-action")).toContainText("Day 1 of 30");
    await expect(page.getByTestId("next-action-cta")).toHaveText(/Start lesson/);
    const items = page.getByTestId("day-1-items");
    await expect(items.locator("li")).toHaveCount(3);
    await page.getByTestId("apply-bringup-card").check();
    await page.reload();
    await expect(page.getByTestId("apply-bringup-card")).toBeChecked();
    await expect(page.getByTestId("day-progress")).toContainText("1/3 done today · 0 of 30 days complete");

    await page.getByRole("link", { name: "All 30 days" }).click();
    await expect(page).toHaveURL(/\/journey/);
    await expect(page.getByTestId("journey-day-30")).toBeVisible();
    await expect(page.getByTestId("journey-day-11")).not.toContainText("coming soon");
    await expect(page.getByTestId("journey-day-21")).toContainText("coming soon");
    await expect(page.getByText("Days 1 to 20 are fully published. 7 of 30 days still reference lessons that are being written")).toBeVisible();
  });

  test("journey interview items open a focused question set and complete the day item when all are rated", async ({ page }) => {
    await page.goto("/interview?q=mcu-no-boot-walkthrough,swd-vs-crystal&day=3");
    await expect(page.getByTestId("interview-focus")).toContainText("Day 3: 2 questions");
    await page.getByTestId("interview-mcu-no-boot-walkthrough").getByTestId("reveal-rubric").click();
    await page.getByTestId("interview-mcu-no-boot-walkthrough").getByTestId("rate-shaky").click();
    await page.getByTestId("interview-swd-vs-crystal").getByTestId("reveal-rubric").click();
    await page.getByTestId("interview-swd-vs-crystal").getByTestId("rate-confident").click();
    await page.goto("/journey");
    await expect(page.getByTestId("journey-day-3")).toContainText("1/3 done");
    await page.goto("/interview?q=mcu-no-boot-walkthrough,swd-vs-crystal");
    await expect(page.getByTestId("interview-focus")).toContainText("2 questions");
    await expect(page.getByTestId("interview-mcu-no-boot-walkthrough")).toBeVisible();
    await expect(page.getByTestId("interview-swd-vs-crystal")).toBeVisible();
    await expect(page.getByTestId("interview-i2c-nack-systematic")).toHaveCount(0);
    await page.getByRole("button", { name: "Show all" }).click();
    await expect(page.getByTestId("interview-i2c-nack-systematic")).toBeVisible();
    await page.getByTestId("interview-mcu-no-boot-walkthrough").getByTestId("reveal-rubric").click();
    await expect(page.getByText("The same question in other industries").first()).toBeVisible();
  });
});

test.describe("Targeted review", () => {
  test("a wrong answer creates a retry link that deep-links to that step", async ({ page }) => {
    await page.goto("/lessons/uart-framing-and-baud?step=6");
    await expect(page.getByText("Step 6 of")).toBeVisible();
    await page.getByRole("radio", { name: /0xCA/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await page.goto("/review");
    const targeted = page.getByTestId("targeted-review");
    await expect(targeted).toContainText("UART framing and baud");
    await expect(targeted).toContainText("1 wrong attempt");
    await page.getByTestId("retry-uart-lsb-first").click();
    await expect(page).toHaveURL(/step=6/);
    await expect(page.getByText("Step 6 of")).toBeVisible();
    await page.getByRole("radio", { name: /0x53/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
    await page.goto("/review");
    await expect(page.getByTestId("targeted-review")).toContainText("solved after 1 wrong");
  });
});

test.describe("New lessons and missions", () => {
  test("watchdog lesson: numeric misconception feedback and IWDG calculator", async ({ page }) => {
    await page.goto("/lessons/watchdogs-and-reset-loops?step=3");
    await expect(page.getByTestId("iwdg-timeout")).toHaveText("1.00 s");
    await page.goto("/lessons/watchdogs-and-reset-loops?step=6");
    await page.getByTestId("numeric-input").fill("4998");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("+1");
    await page.getByTestId("numeric-input").fill("5000");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("SPI lesson: mode mismatch explanation in the visual; prescaler exercise", async ({ page }) => {
    await page.goto("/lessons/spi-modes-and-chip-select?step=3");
    await expect(page.getByTestId("spi-mismatch")).toContainText("agree");
    await page.getByText("1: idle high").click();
    await expect(page.getByTestId("spi-mismatch")).toContainText("polarity differs");
    await page.goto("/lessons/spi-modes-and-chip-select?step=8");
    await page.getByTestId("numeric-input").fill("10.5");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("above the 10 MHz maximum");
  });

  test("oscilloscope lesson: aliasing readout responds", async ({ page }) => {
    await page.goto("/lessons/oscilloscope-probing?step=4");
    await expect(page.getByTestId("alias-readout")).toContainText("below the Nyquist limit");
    await page.getByLabel("Sample rate in megasamples per second").fill("50");
    await expect(page.getByTestId("alias-readout")).toContainText("above the Nyquist limit");
  });

  test("reset-loop mission: wrong fix is judged, efficient path solves", async ({ page }) => {
    await page.goto("/missions/the-board-that-resets-every-second");
    await page.getByTestId("action-read-csr").click();
    await expect(page.getByTestId("log-read-csr")).toContainText("Key evidence");
    await page.getByTestId("action-diff-firmware").click();
    await page.getByTestId("action-halt-before-reset").click();
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-watchdog-blocking").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("fix-longer-timeout").check();
    await page.getByTestId("submit-fix").click();
    const outcome = page.getByTestId("mission-outcome");
    await expect(outcome).toHaveAttribute("data-verdict", "solved");
    await expect(outcome).toContainText("Wrong");
    await expect(page.getByText("inverts the purpose of the watchdog")).toBeVisible();
  });

  test("UART mission: the hardware rework trap is marked risky", async ({ page }) => {
    await page.goto("/missions/the-uart-that-prints-garbage");
    await page.getByTestId("action-scope-bit-time").click();
    await page.getByTestId("action-clock-config").click();
    await page.getByTestId("action-replace-crystal").click();
    await expect(page.getByTestId("log-replace-crystal")).toContainText("Risky");
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-hse-value").check();
    await page.getByTestId("submit-diagnosis").click();
    await page.getByTestId("fix-fix-hse-value").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toContainText("Risky actions: 1");
  });
});
