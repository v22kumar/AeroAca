import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Career track (modules 17 to 25): every new lesson opens, shows its title and is free of serious accessibility violations. */
const SLUGS = [
  "architecture-of-a-test-framework",
  "arinc-429-words-labels-and-ssm",
  "building-a-frame-parser-and-breaking-it",
  "career-gap-contract-and-ownership",
  "claims-metrics-and-negotiation",
  "control-loop-and-pid",
  "deadlock-and-lock-ordering",
  "debug-probe-and-gdb-on-target",
  "do-178c-levels-and-objectives",
  "frame-based-executives-and-overruns",
  "from-fmea-to-fault-injection",
  "hardfault-analysis",
  "hil-architecture-and-bench-design",
  "logs-to-evidence",
  "measuring-wcet-and-jitter",
  "mil-std-1553b-controller-terminals-and-faults",
  "mil-std-1553b-the-word-and-the-message",
  "pytest-for-hardware-tests",
  "requirements-based-testing-hlr-llr",
  "rs-422-rs-485-and-framed-serial-with-crc",
  "shared-memory-dpram-handshakes",
  "structural-coverage-and-mcdc",
  "tasks-the-scheduler-and-the-tick",
  "telemetry-packets-and-parsing-with-struct",
  "testing-a-cross-channel-link",
  "traceability-problem-reports-and-change-impact",
  "voting-monitors-and-failover",
  "why-flight-control-is-redundant",
  "will-it-meet-its-deadline",
];

test.describe("Career track lessons", () => {
  for (const slug of SLUGS) {
    test(`lesson ${slug} opens and is accessible`, async ({ page }) => {
      await page.goto(`/lessons/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByTestId("next-step").or(page.getByText(/Step 1 of/)).first()).toBeVisible();
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    });
  }

  test("the journey starts with 'say what you did' and day 29 opens the timed mock", async ({ page }) => {
    await page.goto("/journey");
    await expect(page.getByTestId("journey-day-1")).toContainText("Say exactly what you did");
    await expect(page.getByTestId("journey-day-2")).toContainText("software level");
    const day29 = page.getByTestId("journey-day-29");
    await expect(day29).toContainText("Mock interview");
    await expect(day29.locator('a[href*="mock=1"]')).toHaveCount(1);
  });

  test("the curriculum lists the career track modules", async ({ page }) => {
    await page.goto("/curriculum");
    await expect(page.getByText("DO-178C verification in practice")).toBeVisible();
    await expect(page.getByText("Interviews for experienced engineers")).toBeVisible();
  });
});
