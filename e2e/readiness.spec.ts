import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Learner readiness: prerequisites, labs, build-it and the diagnostic", () => {
  test("an advanced lesson shows its prerequisites with completion state; a starting point says so", async ({ page }) => {
    await page.goto("/lessons/priority-inversion");
    const pre = page.getByTestId("prerequisites");
    await expect(pre).toContainText("Before this lesson");
    await expect(pre.getByRole("link", { name: "Interrupts and NVIC priorities without surprises" })).toBeVisible();
    await expect(pre).toContainText("Not started");
    await page.goto("/lessons/circuit-laws-on-the-bench");
    await expect(page.getByTestId("prerequisites-none")).toContainText("starting point");
  });

  test("a lab step shows the source, the command and the verified expected output with copy buttons", async ({ page }) => {
    await page.goto("/lessons/embedded-c-register-bit-masks?step=7");
    await expect(page.getByText("Step 7 of")).toBeVisible();
    const lab = page.getByTestId("lab-step");
    await expect(lab).toContainText("Run it yourself");
    await expect(page.getByTestId("lab-code")).toContainText("#define BIT(n) (1u << (n))");
    await expect(page.getByTestId("lab-command")).toContainText("gcc -std=c11 -Wall -Wextra -o bits bits.c && ./bits");
    await expect(page.getByTestId("lab-expected")).toContainText("field[7:5] = 6               CR = 0x000002C1");
    await expect(page.getByRole("button", { name: "Copy bits.c" })).toBeVisible();
    await lab.getByText("Try next: change one thing and predict the result").click();
    await expect(lab).toContainText("FIELD_MASK(8, 5)");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("the portfolio firmware stage has a Build it section with commands and verified outputs", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByTestId("portfolio-progress")).toBeVisible();
    const stage = page.getByTestId("stage-firmware");
    await stage.locator("summary").click();
    const build = page.getByTestId("build-it-firmware");
    await expect(build).toContainText("Build it");
    await expect(build).toContainText("make sim");
    await expect(build).toContainText("# first fault NACK at t=2000 ms");
    await expect(build).toContainText("python3 sensor_model.py --fault stuck --at 3.0 --seconds 10");
  });

  test("the diagnostic turns wrong answers into a Start here list on Today, and nothing is scored", async ({ page }) => {
    await page.goto("/");
    const offer = page.getByTestId("start-here-offer");
    await expect(offer).toContainText("Find your starting level");
    await offer.getByTestId("start-here-cta").click();
    await expect(page).toHaveURL(/\/start/);
    await expect(page.getByTestId("diagnostic-progress")).toContainText("Question 1 of 14");

    // Answer every question: get the hex and mask questions wrong, everything else right.
    for (let i = 0; i < 14; i++) {
      const q = page.getByTestId("diagnostic-question");
      const progress = await page.getByTestId("diagnostic-progress").innerText();
      const numeric = q.getByTestId("numeric-input");
      if (await numeric.count()) {
        let value = "0";
        if (progress.includes("Circuit laws")) value = "1.65";
        else if (progress.includes("Hexadecimal")) value = "510"; // wrong on purpose
        else if (progress.includes("Fixed-width")) value = "4";
        else if (progress.includes("UART")) value = "10";
        await numeric.fill(value);
        await q.getByTestId("check-answer").click();
      } else {
        const options = q.getByRole("radio");
        // option A is the correct one in every single-choice diagnostic question; pick B for "Bit masks" on purpose
        await options.nth(progress.includes("Bit masks") ? 1 : 0).check();
        await q.getByTestId("check-answer").click();
      }
      await expect(q.getByTestId("exercise-feedback")).toBeVisible();
      await page.getByTestId("diagnostic-next").click();
    }
    const result = page.getByTestId("diagnostic-result");
    await expect(result).toContainText("12 of 14 answered correctly");
    await expect(result).toContainText("One lesson to take before day 1");
    await expect(result.getByTestId("start-here-embedded-c-register-bit-masks")).toBeVisible();
    await expect(result).toContainText("Because you missed: Hexadecimal, Bit masks");
    expect(await result.innerText()).not.toMatch(/\d\s*%|level \d|score[:\s]+\d/i); // no percentage, level number or numeric score anywhere
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);

    await result.getByTestId("diagnostic-to-today").click();
    const card = page.getByTestId("start-here");
    await expect(card).toContainText("Start here");
    await expect(card.getByTestId("start-here-embedded-c-register-bit-masks")).toBeVisible();
    await expect(page.getByTestId("start-here-offer")).toHaveCount(0);
    // the day-1 next action is still offered; nothing is gated
    await expect(page.getByTestId("next-action")).toContainText("Day 1 of 30");
  });

  test("skipping the diagnostic removes the offer and keeps day 1 as the start", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("start-here-offer").getByTestId("start-here-skip").click();
    await expect(page.getByTestId("start-here-offer")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("next-action")).toContainText("Day 1 of 30");
    await expect(page.getByTestId("start-here-offer")).toHaveCount(0);
  });
});
