import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Teaching format 2.0 pilot: depth, hints, lesson map, walkthrough", () => {
  test("a 2.0 lesson opens at Understand depth with the lesson map; deeper steps are hidden and announced; switching keeps the step", async ({ page }) => {
    await page.goto("/lessons/reading-a-power-tree");
    await expect(page.getByTestId("depth-selector")).toBeVisible();
    await expect(page.getByTestId("depth-understand")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("lesson-map")).toContainText("Why am I learning this");
    await expect(page.getByTestId("lesson-map")).toContainText("Where you will use this");
    await expect(page.getByTestId("step-heading")).toContainText("Step 1 of");
    const understandTotal = Number((await page.getByTestId("step-heading").innerText()).match(/of (\d+)/i)![1]);
    await expect(page.getByTestId("hidden-steps")).toContainText("Apply depth");
    await expect(page.getByTestId("hidden-steps")).toContainText("Master depth");
    // go to the intuition step, then switch to Master: the step stays, the total grows
    await page.getByTestId("next-step").click();
    await expect(page.getByTestId("step-heading")).toContainText("Build intuition");
    await page.getByTestId("depth-master").click();
    await expect(page.getByTestId("step-heading")).toContainText("Build intuition");
    const masterTotal = Number((await page.getByTestId("step-heading").innerText()).match(/of (\d+)/i)![1]);
    expect(masterTotal).toBeGreaterThan(understandTotal);
    await expect(page.getByTestId("hidden-steps")).toHaveCount(0);
    // the preference is remembered on another 2.0 lesson
    await page.goto("/lessons/priority-inversion");
    await expect(page.getByTestId("depth-master")).toHaveAttribute("aria-checked", "true");
  });

  test("a 1.0 lesson shows no depth selector and behaves as before", async ({ page }) => {
    await page.goto("/lessons/i2c-sensor-not-acknowledging");
    await expect(page.getByTestId("depth-selector")).toHaveCount(0);
    await expect(page.getByTestId("step-heading")).toContainText("Scenario");
  });

  test("guided practice: hints reveal one at a time, the solve is labelled honestly, and completion at Understand depth offers to go deeper", async ({ page }) => {
    await page.goto("/lessons/reading-a-power-tree?step=9");
    await expect(page.getByTestId("step-heading")).toContainText("Practise");
    await expect(page.getByTestId("hint-shown")).toHaveCount(0);
    await page.getByTestId("show-hint").click();
    await expect(page.getByTestId("hint-shown")).toHaveCount(1);
    await expect(page.getByTestId("hint-shown").first()).toContainText("500 mA = 0.5 A");
    await page.getByTestId("show-hint").click();
    await expect(page.getByTestId("hint-shown")).toHaveCount(2);
    await page.getByTestId("numeric-input").fill("0.15");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("sag itself");
    await page.getByTestId("numeric-input").fill("3.15");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
    await expect(page.getByTestId("solved-with-hints")).toContainText("2 hints");
    // the other Understand exercise, then the recap completes at Understand depth
    await page.getByTestId("next-step").click();
    await page.getByRole("radio", { name: /Trace and connector resistance/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("lesson-map").getByRole("button", { name: "Where you will use this" }).click();
    await page.getByTestId("next-step").click();
    await expect(page.getByTestId("lesson-complete")).toContainText("Understand depth");
    await expect(page.getByTestId("lesson-complete")).toContainText("exercises wait at a deeper level");
    await expect(page.getByTestId("completed-depth")).toContainText("Understand");
    await page.getByTestId("go-deeper").click();
    await expect(page.getByTestId("depth-apply")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("lesson-incomplete")).toBeVisible();
  });

  test("the 1553 lesson: interactive builds the word, the walkthrough explains the code line by line, and the lab shows the verified output", async ({ page }) => {
    await page.goto("/lessons/mil-std-1553b-the-word-and-the-message?step=5");
    await expect(page.getByTestId("step-heading")).toContainText("See how it works");
    await expect(page.getByTestId("w1553-readout")).toContainText("0x2C64");
    await expect(page.getByTestId("w1553-readout")).toContainText("parity bit is 1");
    await page.getByTestId("w1553-wc").fill("0");
    await expect(page.getByTestId("w1553-readout")).toContainText("32 data words");
    await page.goto("/lessons/mil-std-1553b-the-word-and-the-message?step=13");
    await expect(page.getByTestId("walkthrough")).toBeVisible();
    await expect(page.getByTestId("walkthrough-note")).toHaveCount(4);
    await expect(page.getByTestId("walkthrough-note").nth(1)).toContainText("Lines 8 to 11");
    await expect(page.getByTestId("walkthrough-note").nth(1)).toContainText("shifted left by 11");
    await page.getByTestId("next-step").click();
    await expect(page.getByTestId("lab-expected")).toContainText("0x2C64 parity=1");
    await expect(page.getByTestId("lab-expected")).toContainText("parity error, word rejected");
    await page.waitForTimeout(400); // let the step's entrance animation finish before sampling colours
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });

  test("the 1553 guided exercise and the mode-code exercise grade the classic misreadings", async ({ page }) => {
    await page.goto("/lessons/mil-std-1553b-the-word-and-the-message?step=15");
    await page.getByTestId("numeric-input").fill("6");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("only four bits");
    await page.getByTestId("numeric-input").fill("12");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
    await page.goto("/lessons/mil-std-1553b-the-word-and-the-message?step=16");
    await page.getByRole("radio", { name: /transmit 2 data words from subaddress 31/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("mode command");
    await page.getByRole("radio", { name: /mode code 2/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("the rail-sag interactive reproduces the scenario and the capacitor saves the sensor", async ({ page }) => {
    await page.goto("/lessons/reading-a-power-tree?step=3");
    await expect(page.getByTestId("sag-readout")).toContainText("2.98 V");
    await expect(page.getByTestId("sag-readout")).toContainText("the sensor resets");
    await page.getByTestId("sag-bulk").check();
    await expect(page.getByTestId("sag-readout")).toContainText("keeps running");
    await page.waitForTimeout(400);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });

  test("figure steps render the diagram with alt text and a caption, in 1.0 and 2.0 lessons", async ({ page }) => {
    await page.goto("/lessons/reading-a-power-tree?step=4");
    await expect(page.getByTestId("step-heading")).toContainText("See how it works");
    const img = page.getByTestId("figure-image");
    await expect(img).toHaveAttribute("src", "/diagrams/power-tree.svg");
    await expect(img).toHaveAttribute("alt", /Power tree from a 5 volt input/);
    await expect(page.getByTestId("figure-step")).toContainText("0.4 Ω of copper");
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0), { timeout: 30_000 }).toBe(true);
    await page.goto("/lessons/uart-framing-and-baud");
    await page.getByRole("button", { name: /In one picture/ }).click();
    await expect(page.getByTestId("step-heading")).toContainText("In one picture");
    await expect(page.getByTestId("figure-image")).toHaveAttribute("src", "/diagrams/uart-frame.svg");
    await page.waitForTimeout(400);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  });

  test("the curriculum lists the 1553 lesson and the glossary knows its terms", async ({ page }) => {
    await page.goto("/curriculum");
    await expect(page.getByRole("link", { name: "MIL-STD-1553B: the word and the message" })).toBeVisible();
    await page.goto("/glossary");
    await page.getByTestId("glossary-search").fill("remote terminal");
    await expect(page.getByTestId("glossary-list")).toContainText("remote terminal");
    await expect(page.getByTestId("glossary-list")).toContainText("speaks only when the bus controller addresses it");
  });
});
