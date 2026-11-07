import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Block 3: integration, verification, root cause", () => {
  test("ICD lesson: endian decode names the big-endian misreading, then accepts the correct value", async ({ page }) => {
    await page.goto("/lessons/interface-control-and-integration-faults?step=5");
    await expect(page.getByText("Step 5 of")).toBeVisible();
    await page.getByTestId("numeric-input").fill("5939.5");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByTestId("exercise-feedback")).toContainText("big-endian reading");
    await page.getByTestId("numeric-input").fill("100");
    await page.getByTestId("check-answer").click();
    await expect(page.getByTestId("exercise-feedback")).toHaveAttribute("data-correct", "true");
  });

  test("traceability matrix reports gaps, orphans and a bad link, and completes when every requirement is covered", async ({ page }) => {
    await page.goto("/lessons/writing-a-trustworthy-test-case?step=3");
    await expect(page.getByTestId("trace-gaps")).toContainText("REQ-2, REQ-3, REQ-4 have no test");
    await page.getByTestId("trace-REQ-2-TC-4").click();
    await expect(page.getByTestId("trace-wrong")).toContainText("1 link");
    await page.getByTestId("trace-REQ-2-TC-4").click();
    await page.getByTestId("trace-REQ-2-TC-2").click();
    await page.getByTestId("trace-REQ-3-TC-3").click();
    await page.getByTestId("trace-REQ-4-TC-5").click();
    await expect(page.getByTestId("trace-gaps")).toContainText("No gaps");
    await expect(page.getByTestId("trace-orphans")).toContainText("TC-4");
    await expect(page.getByTestId("trace-complete")).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(axe.violations).toEqual([]);
  });

  test("integration mission: the capture plus the parser isolate the byte-order fault; the fudge factor is marked risky", async ({ page }) => {
    await page.goto("/missions/two-boards-one-bus-no-agreement");
    await page.getByTestId("action-capture-frame").click();
    await expect(page.getByTestId("log-capture-frame")).toContainText("09 C4");
    await page.getByTestId("action-fudge-scaling").click();
    await expect(page.getByTestId("log-fudge-scaling")).toContainText("fudge factor");
    await page.getByTestId("action-controller-parser").click();
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-bus-noise").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "false");
    await expect(page.getByTestId("diagnosis-feedback")).toContainText("CRC");
    await page.getByTestId("fix-fix-parser-and-test").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toBeVisible();
  });

  test("verification mission: deriving the limit from a measurement is rejected; the hazard analysis is the source", async ({ page }) => {
    await page.goto("/missions/the-requirement-nobody-could-test");
    await page.getByTestId("action-read-req").click();
    await page.getByTestId("action-measure-latency").click();
    await page.getByTestId("action-write-from-measurement").click();
    await expect(page.getByTestId("log-write-from-measurement")).toContainText("inverts verification");
    await page.getByTestId("action-hazard-analysis").click();
    await expect(page.getByTestId("log-hazard-analysis")).toContainText("2 s");
    await page.getByTestId("go-diagnose").click();
    await page.getByTestId("diagnosis-untestable").check();
    await page.getByTestId("submit-diagnosis").click();
    await expect(page.getByTestId("diagnosis-feedback")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("fix-rewrite-and-trace").check();
    await page.getByTestId("submit-fix").click();
    await expect(page.getByTestId("mission-outcome")).toBeVisible();
  });

  test("journey session 11 is playable: the redundancy lesson and its interview question are real items", async ({ page }) => {
    await page.goto("/journey");
    const day11 = page.getByTestId("journey-session-11");
    await expect(day11).toContainText("flight control is redundant");
    await expect(day11).not.toContainText("coming soon");
    await page.goto("/interview?q=redundancy-architecture-explained&session=11");
    await expect(page.getByTestId("interview-focus")).toContainText("Session 11");
    await page.getByTestId("interview-redundancy-architecture-explained").getByTestId("reveal-rubric").click();
    await expect(page.getByText("The same question in other industries")).toBeVisible();
  });
});
