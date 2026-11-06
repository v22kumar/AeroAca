import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Embedded C and STM32 depth", () => {
  test("the curriculum has no coming-soon item left and lists the new lessons in modules 3 and 5", async ({ page }) => {
    await page.goto("/curriculum");
    await expect(page.getByText("Coming soon")).toHaveCount(0);
    await expect(page.getByText(/still being written/)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Low-power modes and wake-up sources/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Your first STM32 project/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /A ring buffer for the UART driver/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /State machines that survive review/ })).toBeVisible();
  });

  test("the clock-tree interactive reproduces the 84 MHz configuration and the timer doubling rule", async ({ page }) => {
    await page.goto("/lessons/gpio-and-the-clock-tree?step=3");
    await expect(page.getByText("Step 3 of")).toBeVisible();
    await expect(page.getByTestId("ct-vcoin")).toContainText("1 MHz");
    await expect(page.getByTestId("ct-sysclk")).toContainText("84 MHz");
    await expect(page.getByTestId("ct-apb1")).toContainText("42 MHz");
    await expect(page.getByTestId("ct-tim1")).toContainText("84 MHz");
    await expect(page.getByTestId("ct-tim1")).toContainText("twice the bus");
    await page.getByTestId("ct-ppre1").selectOption("1");
    await expect(page.getByTestId("ct-apb1")).toContainText("84 MHz");
    await expect(page.getByTestId("ct-apb1")).toHaveClass(/amber/); // over the 42 MHz limit
    await expect(page.getByTestId("ct-tim1")).toContainText("same as the bus");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("the ring-buffer lab shows the harness with its eight passing checks", async ({ page }) => {
    await page.goto("/lessons/a-ring-buffer-for-the-uart-driver?step=6");
    await expect(page.getByTestId("lab-code")).toContainText("#define RING_MASK (RING_SIZE - 1u)");
    await expect(page.getByTestId("lab-expected")).toContainText("PASS accepts exactly 7 of 10 bytes");
    await expect(page.getByTestId("lab-expected")).toContainText("8 passed, 0 failed");
  });

  test("the state-machine lab prints the debouncer's transition trace with one press", async ({ page }) => {
    await page.goto("/lessons/state-machines-that-survive-review?step=6");
    await expect(page.getByTestId("lab-expected")).toContainText("t= 25 ms raw=1 -> PRESSED         PRESS");
    await expect(page.getByTestId("lab-expected")).toContainText("presses counted: 1");
  });

  test("the register exercise for MODER grades the alternate-function bits and protects the LED pin", async ({ page }) => {
    await page.goto("/lessons/gpio-and-the-clock-tree?step=9");
    const grid = page.getByRole("group", { name: /GPIOA_MODER/ });
    await grid.locator('[data-bit="5"]').click();
    await grid.locator('[data-bit="7"]').click();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("struct padding and PLL exercises reject the classic wrong answers with their own explanations", async ({ page }) => {
    await page.goto("/lessons/c-foundations-for-firmware?step=8");
    await page.getByTestId("numeric-input").fill("7");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("sum of the member sizes");
    await page.getByTestId("numeric-input").fill("12");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");

    await page.goto("/lessons/your-first-stm32-project?step=7");
    await page.getByTestId("numeric-input").fill("336");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("VCO output");
    await page.getByTestId("numeric-input").fill("84");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("the low-power lesson lists its prerequisites with state, and the MCU lesson is reachable from the bit-masks chain", async ({ page }) => {
    await page.goto("/lessons/low-power-modes-and-wake-up-sources");
    const pre = page.getByTestId("prerequisites");
    await expect(pre.getByRole("link", { name: /GPIO and the clock tree/ })).toBeVisible();
    await expect(pre.getByRole("link", { name: /The multimeter and the bench supply/ })).toBeVisible();
    await page.goto("/lessons/stack-heap-and-where-your-variables-live");
    await expect(page.getByTestId("prerequisites").getByRole("link", { name: /C foundations for firmware/ })).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });
});
