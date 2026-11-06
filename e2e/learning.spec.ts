import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(0);
}

test.describe("Today and navigation", () => {
  test("shows one next action and navigates through the bottom nav", async ({ page, isMobile }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One good step");
    await expect(page.getByText(/, Sushmita$/)).toBeVisible();
    const cta = page.getByTestId("next-action-cta");
    await expect(cta).toHaveText(/Start lesson/);
    await expectNoHorizontalOverflow(page);

    const nav = page.getByRole("navigation", { name: "Primary" }).filter({ visible: true });
    await nav.getByRole("link", { name: "Learn" }).click();
    await expect(page).toHaveURL(/\/curriculum/);
    await expect(page.getByText("Coming soon").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await nav.getByRole("link", { name: "Interview" }).click();
    await expect(page).toHaveURL(/\/interview/);
    await nav.getByRole("link", { name: "Progress" }).click();
    await expect(page).toHaveURL(/\/progress/);
    await expect(page.getByText("stored only in this browser")).toBeVisible();
    test.info().annotations.push({ type: "viewport", description: isMobile ? "mobile" : "desktop" });
  });

  test("planned lessons are not playable", async ({ page }) => {
    await page.goto("/curriculum");
    const planned = page.locator("li", { hasText: "Coming soon" }).first();
    await expect(planned.getByRole("link")).toHaveCount(0);
    await page.goto("/lessons/does-not-exist");
    await expect(page.getByText("does not exist")).toBeVisible();
  });
});

test.describe("Lesson flow", () => {
  test("completes the I2C lesson with answer-specific feedback and persists after reload", async ({ page }) => {
    await page.goto("/lessons/i2c-sensor-not-acknowledging");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("I2C sensor");
    const next = page.getByTestId("next-step");

    // scenario -> concept -> visual -> concept -> example
    for (let i = 0; i < 5; i++) await next.click();

    // Exercise 1: single choice. Wrong first, then right.
    await expect(page.getByText("Step 6 of")).toBeVisible();
    await page.getByRole("radio", { name: /0x94/ }).check();
    await page.getByTestId("check-answer").click();
    const fb = page.getByTestId("exercise-feedback");
    await expect(fb).toHaveAttribute("data-correct", "false");
    await expect(fb).toContainText("write");
    await expect(next).toBeDisabled();
    await page.getByRole("radio", { name: /0x95/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(fb).toHaveAttribute("data-correct", "true");
    await expect(next).toBeEnabled();

    // Reload mid-lesson: should resume at the same step with the exercise solved.
    await page.reload();
    await expect(page.getByText("Step 6 of")).toBeVisible();
    await expect(page.getByText("Solved on a previous visit")).toBeVisible();
    await next.click();

    // Exercise 2: multi choice with per-option notes.
    await page.getByRole("checkbox", { name: /stuck holding SDA low/ }).check();
    await page.getByRole("checkbox", { name: /wrong slave address/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByText("Address errors never change the idle level")).toBeVisible();
    await page.getByRole("checkbox", { name: /wrong slave address/ }).uncheck();
    await page.getByRole("checkbox", { name: /pull-up resistor is missing/ }).check();
    await page.getByRole("checkbox", { name: /shorted to ground/ }).check();
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
    await next.click();

    // Exercise 3: numeric with a named misconception.
    await page.getByTestId("numeric-input").fill("1.5");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("one");
    await page.getByTestId("numeric-input").fill("3.0");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
    await next.click();

    // Interview step then recap.
    await page.getByTestId("reveal-rubric").click();
    await page.getByTestId("rate-shaky").click();
    await next.click();
    await expect(page.getByTestId("lesson-complete")).toBeVisible();

    // Persisted: Today now offers the next item, Progress shows completion, review cards are due.
    await page.goto("/");
    await expect(page.getByTestId("next-action-cta")).toHaveText(/Start lesson/);
    await page.goto("/progress");
    const row = page.locator("li", { hasText: "I2C sensor not acknowledging" }).first();
    await expect(row.getByText("Completed", { exact: true })).toBeVisible();
    await expect(page.getByText(/5 cards enrolled · 5 due now/)).toBeVisible();
    await expect(page.getByText("Shaky").first()).toBeVisible();

    // Review session works.
    await page.goto("/review");
    await page.getByTestId("reveal-card").click();
    await page.getByTestId("card-good").click();
    await expect(page.getByText("Card 2 of 5")).toBeVisible();
  });

  test("register exercise grades protected bits", async ({ page }) => {
    await page.goto("/lessons/embedded-c-register-bit-masks");
    const next = page.getByTestId("next-step");
    for (let i = 0; i < 6; i++) await next.click();
    await expect(page.getByText("Step 7 of")).toBeVisible();
    const grid = page.getByRole("group", { name: "GPIOA->MODER (bits 15:0)" });
    await grid.locator('[data-bit="4"]').click(); // touches a UART pin
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toContainText("belong to other pins");
    await grid.locator('[data-bit="4"]').click();
    await grid.locator('[data-bit="10"]').click();
    await expect(page.getByTestId("bitgrid-hex")).toHaveText("0x04A3");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });
});

test.describe("Mission flow", () => {
  test("branches on decisions: wrong path vs. evidence-backed path", async ({ page }) => {
    await page.goto("/missions/fresh-board-no-sign-of-life");
    await expect(page.getByText("No target connected").first()).toBeVisible();
    // Gated action not visible before NRST is measured
    await expect(page.getByTestId("action-isolate-reset")).toHaveCount(0);

    // Wrong path: crystal red herring, then MCU swap
    await page.getByTestId("action-hse").click();
    await expect(page.getByTestId("log-hse")).toContainText("Low information");
    await page.getByTestId("action-swap-mcu").click();
    await expect(page.getByTestId("bench-time")).toHaveText("95 / 45 min");
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-crystal").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByTestId("diagnosis-feedback")).toContainText("HSI");
    await page.getByTestId("fix-pullup-override").check();
    await page.getByTestId("submit-fix").click();
    const outcome = page.getByTestId("mission-outcome");
    await expect(outcome).toHaveAttribute("data-verdict", "not-solved");
    await expect(outcome).toContainText("Risky actions: 1");

    // Run again on the efficient path
    await page.getByTestId("mission-restart").click();
    await expect(page.getByTestId("bench-time")).toHaveText("0 / 45 min");
    await page.getByTestId("action-rail").click();
    await page.getByTestId("action-nrst").click();
    await expect(page.getByTestId("action-isolate-reset")).toBeVisible();
    await page.getByTestId("action-compare-marking").click();
    await page.getByTestId("action-isolate-reset").click();
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-wrong-supervisor").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("fix-fit-correct").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toHaveAttribute("data-verdict", "solved");
    await expect(page.getByTestId("mission-outcome")).toContainText("100/100");

    // Persisted after reload
    await page.reload();
    await expect(page.getByText("2 previous runs")).toBeVisible();
    await page.goto("/progress");
    const row = page.locator("li", { hasText: "Fresh board, no sign of life" }).first();
    await expect(row.getByText("Completed", { exact: true })).toBeVisible();
    await expect(row).toContainText("best 100/100 with evidence");
  });
});

test.describe("PWA", () => {
  test("serves a valid manifest, icons and service worker", async ({ page, request }) => {
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    const json = await manifest.json();
    expect(json.display).toBe("standalone");
    expect(json.icons.some((i: { sizes: string; purpose?: string }) => i.sizes === "512x512" && i.purpose === "maskable")).toBe(true);
    for (const icon of json.icons as { src: string }[]) {
      const res = await request.get(icon.src);
      expect(res.ok(), icon.src).toBe(true);
      expect(res.headers()["content-type"]).toContain("image/png");
    }
    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBe(true);
    expect(sw.headers()["cache-control"]).toContain("no-cache");
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
    const registered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return "unsupported";
      const reg = await navigator.serviceWorker.ready;
      return reg.active ? "active" : "pending";
    });
    expect(["active", "pending"]).toContain(registered);
  });
});

test.describe("Glossary", () => {
  test("terms inside a lesson open a definition sheet; the glossary page searches", async ({ page }) => {
    await page.goto("/lessons/mcu-board-does-not-boot");
    const term = page.locator("button.term").first();
    await expect(term).toBeVisible();
    await term.click();
    const sheet = page.getByTestId("term-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Why it matters")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);

    await page.goto("/glossary");
    await page.getByTestId("glossary-search").fill("pull-up");
    const list = page.getByTestId("glossary-list");
    await expect(list.locator("summary", { hasText: /^pull-up$/ })).toHaveCount(1);
    expect(await list.locator("li").count()).toBeLessThan(10);
    await page.getByTestId("glossary-search").fill("zzzz");
    await expect(page.getByText("No term matches")).toBeVisible();
  });

  test("the greeting uses a custom name after it is saved", async ({ page }) => {
    await page.goto("/progress");
    await page.getByTestId("name-input").fill("Sush");
    await page.getByTestId("name-input").blur();
    await page.goto("/");
    await expect(page.getByText(/, Sush$/)).toBeVisible();
  });
});

test.describe("Accessibility basics", () => {
  test("keyboard can reach and operate the primary action", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab"); // skip link
    await expect(page.getByText("Skip to content")).toBeFocused();
    await page.keyboard.press("Enter");
    const cta = page.getByTestId("next-action-cta");
    await cta.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/lessons\//);
  });
});
