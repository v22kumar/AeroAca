import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Fundamentals depth: circuit laws, RC, switches, levels, protection, instruments", () => {
  test("the circuit-laws lesson is a starting point with a divider interactive that reports loading error", async ({ page }) => {
    await page.goto("/lessons/circuit-laws-on-the-bench");
    await expect(page.getByTestId("prerequisites-none")).toContainText("starting point");
    await page.goto("/lessons/circuit-laws-on-the-bench?step=4");
    await expect(page.getByText("Step 4 of")).toBeVisible();
    // defaults are the scenario: 100k/100k loaded by 100k
    await expect(page.getByTestId("div-open")).toContainText("1.650 V");
    await expect(page.getByTestId("div-rth")).toContainText("50.0 kΩ");
    await expect(page.getByTestId("div-loaded")).toContainText("1.100 V");
    await expect(page.getByTestId("div-error")).toContainText("33.3 %");
    await page.getByTestId("div-r1").fill("10");
    await page.getByTestId("div-r2").fill("10");
    await expect(page.getByTestId("div-rth")).toContainText("5.0 kΩ");
    await expect(page.getByTestId("div-error")).toContainText("4.8 %");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("the circuit-laws lab shows the divider program and its verified output", async ({ page }) => {
    await page.goto("/lessons/circuit-laws-on-the-bench?step=7");
    await expect(page.getByTestId("lab-code")).toContainText("def divider(v_in, r1, r2, load=None):");
    await expect(page.getByTestId("lab-expected")).toContainText("scenario, 100k/100k, 100k load");
    await expect(page.getByTestId("lab-expected")).toContainText("33.3%");
  });

  test("the RC interactive gives the time constant, threshold times and cutoff for the button scenario", async ({ page }) => {
    await page.goto("/lessons/capacitors-inductors-rc-and-filters?step=3");
    await expect(page.getByText("Step 3 of")).toBeVisible();
    await expect(page.getByTestId("rc-tau")).toContainText("1.00 ms");
    await expect(page.getByTestId("rc-thresholds")).toContainText("70 % at 1.20 ms");
    await expect(page.getByTestId("rc-fc")).toContainText("159.2 Hz");
    await expect(page.getByTestId("rc-gain")).toContainText("1.00 kHz");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("the RC cutoff exercise rejects the missing-2π answer with its own explanation", async ({ page }) => {
    await page.goto("/lessons/capacitors-inductors-rc-and-filters?step=8");
    await page.getByTestId("numeric-input").fill("6447");
    await page.getByTestId("check-answer").click();
    const fb = page.getByTestId("exercise-feedback");
    await expect(fb).toHaveAttribute("data-correct", "false");
    await expect(fb).toContainText("without the 2π");
    await page.getByTestId("numeric-input").fill("1026");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("the MOSFET gate exercise explains why the threshold voltage is the wrong number", async ({ page }) => {
    await page.goto("/lessons/diodes-and-transistors-as-switches?step=7");
    const radios = page.getByRole("radio");
    await radios.nth(1).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("microamps");
    await radios.nth(0).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("the logic-levels lesson's negative noise margin and the DMM lesson's burden voltage are graded with misconceptions", async ({ page }) => {
    await page.goto("/lessons/logic-levels-thresholds-and-open-drain?step=6");
    await page.getByTestId("numeric-input").fill("0.6");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("the sign matters");
    await page.getByTestId("numeric-input").fill("-0.6");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");

    await page.goto("/lessons/the-dmm-and-the-bench-supply?step=5");
    await expect(page.getByTestId("prerequisites-none")).toHaveCount(0); // step 5 is not the scenario
    await page.getByTestId("numeric-input").fill("0.42");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("the diagnostic's circuit-laws and multimeter questions now point at the new foundation lessons", async ({ page }) => {
    await page.goto("/start");
    await expect(page.getByTestId("diagnostic-progress")).toContainText("Circuit laws");
    await page.getByTestId("numeric-input").fill("3.3"); // wrong on purpose
    await page.getByTestId("check-answer").click();
    await page.getByTestId("diagnostic-skip").click();
    // a skipped diagnostic keeps the one answer but produces no list; retake from Today is not offered
    await page.goto("/");
    await expect(page.getByTestId("start-here-offer")).toHaveCount(0);
    await expect(page.getByTestId("start-here")).toHaveCount(0);
  });

  test("the curriculum lists the six new lessons in their modules with no coming-soon item added", async ({ page }) => {
    await page.goto("/curriculum");
    await expect(page.getByRole("link", { name: /Circuit laws you use every day/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Grounding, protection and the first thing/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /The multimeter and the bench supply/ })).toBeVisible();
    await expect(page.getByText("One item is still being written")).toBeVisible();
  });
});
