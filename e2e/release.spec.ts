import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Release 0.1 checks: every primary screen and interaction on a phone-sized viewport. */

async function next(page: Page, times = 1) {
  for (let i = 0; i < times; i++) await page.getByTestId("next-step").click();
}
async function solvedFeedback(page: Page) {
  await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
}

test.describe("Lesson completion", () => {
  test("MCU lesson: ordering exercise explains misplaced steps, then completes and feeds review", async ({ page }) => {
    await page.goto("/lessons/mcu-board-does-not-boot");
    await expect(page.getByText("Why this matters for your next role")).toBeVisible();
    await next(page, 5);
    await expect(page.getByText("Step 6 of")).toBeVisible();
    const add = (t: RegExp) => page.getByRole("button", { name: t }).click();
    // Wrong order first: firmware before measurements.
    await add(/Add: Rebuild and reflash/);
    await add(/Add: Measure VDD/);
    await add(/Add: Measure NRST/);
    await add(/Add: Check the BOOT0/);
    await add(/Add: Connect the debugger/);
    await page.getByTestId("check-answer").click();
    const fb = page.getByTestId("exercise-feedback");
    await expect(fb).toHaveAttribute("data-correct", "false");
    await expect(page.getByText(/Belongs at step 5/)).toBeVisible();
    await expect(page.getByTestId("next-step")).toBeDisabled();
    await page.getByRole("button", { name: "Clear" }).click();
    await add(/Add: Measure VDD/);
    await add(/Add: Measure NRST/);
    await add(/Add: Check the BOOT0/);
    await add(/Add: Connect the debugger/);
    await add(/Add: Rebuild and reflash/);
    await page.getByTestId("check-answer").click();
    await solvedFeedback(page);
    await next(page);
    await page.getByRole("radio", { name: /SWD works from the internal oscillator/ }).check();
    await page.getByTestId("check-answer").click();
    await solvedFeedback(page);
    await next(page);
    await page.getByRole("radio", { name: /keeps asserting reset/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByText(/continuously/)).toBeVisible();
    await page.getByRole("radio", { name: /resetting itself/ }).check();
    await page.getByTestId("check-answer").click();
    await solvedFeedback(page);
    await next(page);
    await page.getByTestId("reveal-rubric").click();
    await page.getByTestId("rate-confident").click();
    await next(page);
    await expect(page.getByTestId("lesson-complete")).toBeVisible();
    await expect(page.getByText("Nicely reasoned")).toBeVisible();

    // Review all four cards from this lesson.
    await page.goto("/review");
    for (let i = 0; i < 4; i++) {
      await page.getByTestId("reveal-card").click();
      await page.getByTestId(i === 1 ? "card-again" : "card-good").click();
    }
    await expect(page.getByTestId("review-done")).toContainText("3 recalled, 1 to see again");

    // The bring-up lesson is no longer part of the career-track journey, so Today still points at day 1's
    // first item. The learner's work on it is kept and counted, not lost.
    await page.goto("/");
    await expect(page.getByTestId("next-action-cta")).toHaveText(/Start lesson/);
  });

  test("Register lesson: all three exercises, including a wrong volatile answer with explanation", async ({ page }) => {
    await page.goto("/lessons/embedded-c-register-bit-masks");
    await next(page, 7); // step 7 is the runnable lab; the register exercise is step 8
    const grid = page.getByRole("group", { name: "GPIOA->MODER (bits 15:0)" });
    await grid.locator('[data-bit="10"]').click();
    await expect(page.getByText("MODER |= 0x400u;")).toBeVisible();
    await page.getByTestId("check-answer").click();
    await solvedFeedback(page);
    await next(page);
    await page.getByRole("radio", { name: /become atomic/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByText(/load, a modify and a store/)).toBeVisible();
    await page.getByRole("radio", { name: /Every read and write through/ }).check();
    await page.getByTestId("check-answer").click();
    await solvedFeedback(page);
    await next(page);
    await page.getByRole("radio", { name: /SR \|= SR_UIF/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByText(/clears \*\*both\*\*|clears both/)).toBeVisible();
    await page.getByRole("radio", { name: /B\.\s?PERIPH->SR = SR_UIF/ }).check();
    await page.getByTestId("check-answer").click();
    await solvedFeedback(page);
    await next(page);
    await page.getByTestId("reveal-rubric").click();
    await page.getByTestId("rate-shaky").click();
    await next(page);
    await expect(page.getByTestId("lesson-complete")).toBeVisible();
    await page.goto("/progress");
    const row = page.locator("li", { hasText: "Register bit masks" }).first();
    await expect(row.getByText("Completed", { exact: true })).toBeVisible();
    await expect(row).toContainText("3/3 solved · 2 wrong");
    await expect(page.getByText("volatile and memory access")).toBeVisible();
  });
});

test.describe("Missions", () => {
  test("I2C mission: wrong diagnosis after thin evidence, then the efficient path", async ({ page }) => {
    await page.goto("/missions/the-sensor-that-never-answers");
    await page.getByTestId("action-idle-levels").click();
    await expect(page.getByTestId("action-add0-strap")).toHaveCount(0);
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-pullups").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByTestId("diagnosis-feedback")).toContainText("3.28 V");
    await page.getByTestId("fix-move-jumper").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toHaveAttribute("data-verdict", "not-solved");
    await page.getByTestId("mission-restart").click();
    for (const a of ["idle-levels", "capture", "bus-scan", "add0-strap"]) await page.getByTestId(`action-${a}`).click();
    await expect(page.getByTestId("bench-time")).toHaveText("15 / 30 min");
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-address-mismatch").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("fix-align-and-document").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toHaveAttribute("data-verdict", "solved");
    await expect(page.getByTestId("mission-outcome")).toContainText("100/100");
  });

  test("a run in progress survives reload, and a finished run is recorded once", async ({ page }) => {
    await page.goto("/missions/fresh-board-no-sign-of-life");
    await page.getByTestId("action-rail").click();
    await page.getByTestId("action-nrst").click();
    await page.reload();
    await expect(page.getByTestId("bench-time")).toHaveText("4 / 45 min");
    await expect(page.getByTestId("log-nrst")).toBeVisible();
    await expect(page.getByTestId("action-isolate-reset")).toBeVisible();
    await page.getByTestId("action-compare-marking").click();
    await page.getByTestId("action-isolate-reset").click();
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-wrong-supervisor").check();
    await page.getByTestId("submit-diagnosis").click();
    await page.getByTestId("fix-fit-correct").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toHaveAttribute("data-verdict", "solved");
    await page.reload();
    await expect(page.getByTestId("mission-outcome")).toHaveAttribute("data-verdict", "solved");
    await expect(page.getByText("1 previous run")).toBeVisible();
    // The page scrolls smoothly (globals.css). On a slow runner Playwright's hit-test can run mid-scroll and see
    // the paragraphs the button is passing, so ask for the reduced-motion layout before clicking it.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByTestId("mission-restart").click();
    await expect(page.getByTestId("bench-time")).toHaveText("0 / 45 min");
    await page.reload();
    await expect(page.getByTestId("bench-time")).toHaveText("0 / 45 min");
    await expect(page.getByText("1 previous run")).toBeVisible();
  });
});

test.describe("Interview, progress, glossary and errors", () => {
  test("interview page: reveal, rate, filter; progress lists weak questions", async ({ page }) => {
    await page.goto("/interview");
    await expect(page.getByText(/0 of \d+ rated/)).toBeVisible();
    const first = page.getByTestId("interview-mcu-no-boot-walkthrough");
    await first.getByTestId("reveal-rubric").click();
    await expect(first.getByText("A strong answer covers")).toBeVisible();
    await first.getByTestId("rate-not-yet").click();
    await expect(page.getByText(/1 of \d+ rated/)).toBeVisible();
    await page.getByRole("button", { name: "Not yet rated" }).click();
    await expect(page.getByTestId("interview-mcu-no-boot-walkthrough")).toHaveCount(0);
    await page.getByRole("button", { name: "Not yet / shaky" }).click();
    await expect(page.getByTestId("interview-mcu-no-boot-walkthrough")).toBeVisible();
    await page.goto("/progress");
    await expect(page.getByText("Interview questions to rehearse")).toBeVisible();
    await expect(page.getByText("Not yet", { exact: true })).toBeVisible();
  });

  test("progress reset clears everything after confirmation", async ({ page }) => {
    await page.goto("/lessons/mcu-board-does-not-boot");
    await next(page, 2);
    await page.goto("/progress");
    const row = page.locator("li", { hasText: "MCU board does not boot" }).first();
    await expect(row.getByText("In progress")).toBeVisible();
    await page.getByRole("button", { name: "Reset progress" }).click();
    await page.getByTestId("confirm-reset").click();
    await expect(row.getByText("Not started")).toBeVisible();
    await expect(page.getByText("0 cards enrolled")).toBeVisible();
  });

  test("unknown mission shows the not-found page with a way back", async ({ page }) => {
    await page.goto("/missions/nope");
    await expect(page.getByText("That page does not exist")).toBeVisible();
    await page.getByRole("link", { name: "Browse the curriculum" }).click();
    await expect(page).toHaveURL(/\/curriculum/);
  });
});

test.describe("Accessibility (axe)", () => {
  const screens = ["/", "/curriculum", "/lessons/mcu-board-does-not-boot", "/missions/fresh-board-no-sign-of-life", "/interview", "/progress", "/review", "/glossary"];
  for (const path of screens) {
    test(`no serious or critical axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(400);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }

  test("the definition sheet is accessible when open", async ({ page }) => {
    await page.goto("/lessons/i2c-sensor-not-acknowledging");
    await page.locator("button.term").first().click();
    await expect(page.getByTestId("term-sheet")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => v.id)).toEqual([]);
  });
});
