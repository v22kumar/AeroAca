import type { JourneyDay } from "@/lib/content/schema";

/**
 * The 30-day interview fast track as a guided journey.
 * Days 1–10 are fully specified from published content. Days 11–30 follow the
 * fast-track plan (docs/CURRICULUM.md) and reference planned content, which is
 * shown as coming soon and can never be marked complete.
 *
 * Each day is a realistic 20–40 minute session. The learner moves to the next
 * day when the current one is complete; there is no calendar pressure.
 */
export const journey: JourneyDay[] = [
  {
    day: 1,
    title: "A dead board, in order",
    focus: "The bring-up checklist every interviewer asks about, learned from first principles.",
    block: 1,
    items: [
      { kind: "lesson", slug: "mcu-board-does-not-boot" },
      { kind: "interview", questionIds: ["mcu-no-boot-walkthrough"] },
      { kind: "apply", id: "bringup-card", title: "Write your bring-up order on an index card", detail: "Power at the pins, reset, clock, boot, debugger, firmware. Keep it by your desk and say it out loud once.", minutes: 5 },
    ],
  },
  {
    day: 2,
    title: "Reset: held, pulsed, or self-inflicted",
    focus: "Diagnose a held reset on the bench, then learn what makes a chip reset itself.",
    block: 1,
    items: [
      { kind: "mission", slug: "fresh-board-no-sign-of-life" },
      { kind: "lesson", slug: "watchdogs-and-reset-loops" },
      { kind: "review" },
    ],
  },
  {
    day: 3,
    title: "Trust your scope",
    focus: "Know what the probe adds before you believe a waveform.",
    block: 1,
    items: [
      { kind: "lesson", slug: "oscilloscope-probing" },
      { kind: "interview", questionIds: ["reset-loop-cause", "swd-vs-crystal"] },
      { kind: "apply", id: "debug-story-60s", title: "Draft the 60-second version of one real debugging story", detail: "Symptom, the measurement that decided it, the fix. Your own work only; no study project dressed up as experience.", minutes: 8 },
    ],
  },
  {
    day: 4,
    title: "What a NACK proves",
    focus: "I2C from the wire up: idle levels, the address byte, the ninth clock.",
    block: 1,
    items: [
      { kind: "lesson", slug: "i2c-sensor-not-acknowledging" },
      { kind: "review" },
      { kind: "interview", questionIds: ["i2c-nack-systematic"] },
    ],
  },
  {
    day: 5,
    title: "Look at the wire first",
    focus: "Solve an I2C fault with evidence, then learn the serial link every board starts with.",
    block: 1,
    items: [
      { kind: "mission", slug: "the-sensor-that-never-answers" },
      { kind: "lesson", slug: "uart-framing-and-baud" },
      { kind: "review" },
    ],
  },
  {
    day: 6,
    title: "A number, not a guess",
    focus: "Turn garbage on a console into a ratio, then into a one-line cause.",
    block: 2,
    items: [
      { kind: "mission", slug: "the-uart-that-prints-garbage" },
      { kind: "interview", questionIds: ["uart-garbage-diagnosis", "i2c-pullup-sizing"] },
      { kind: "apply", id: "application-1", title: "Send one application today", detail: "Pick a role that lists bring-up, test or integration. Applications run in parallel with learning, not after it.", minutes: 20 },
    ],
  },
  {
    day: 7,
    title: "Four modes, one edge",
    focus: "SPI polarity and phase, read from a datasheet and from a shifted byte.",
    block: 2,
    items: [
      { kind: "lesson", slug: "spi-modes-and-chip-select" },
      { kind: "review" },
      { kind: "interview", questionIds: ["spi-first-byte-shifted"] },
    ],
  },
  {
    day: 8,
    title: "Say exactly what you mean to hardware",
    focus: "Masks, fields, volatile and the read-modify-write hazard.",
    block: 2,
    items: [
      { kind: "lesson", slug: "embedded-c-register-bit-masks" },
      { kind: "interview", questionIds: ["volatile-rmw-explained"] },
      { kind: "review" },
    ],
  },
  {
    day: 9,
    title: "Integers with sharp edges",
    focus: "Promotion, wrap-around, undefined shifts and the 49-day bug.",
    block: 2,
    items: [
      { kind: "lesson", slug: "fixed-width-integers-overflow-shifts" },
      { kind: "interview", questionIds: ["bit-field-write", "overflow-elapsed-time"] },
      { kind: "review" },
    ],
  },
  {
    day: 10,
    title: "Prove the reset source",
    focus: "Close the first block with a reset-loop investigation and an honest story about your experience.",
    block: 2,
    items: [
      { kind: "mission", slug: "the-board-that-resets-every-second" },
      { kind: "interview", questionIds: ["watchdog-strategy", "debugging-story", "honest-experience"] },
      { kind: "apply", id: "mock-interview-1", title: "Record yourself answering two questions", detail: "Phone voice memo, 90 seconds each: the bring-up walkthrough and the I2C NACK question. Listen back once and note one thing to tighten.", minutes: 15 },
    ],
  },
  // ---- Block 3: integration, verification, RCA (days 11–15) ----
  { day: 11, title: "A bring-up checklist that gets used", focus: "Turn the method into a document a team will follow, with numbers in every line.", block: 3, items: [{ kind: "lesson", slug: "board-bring-up-checklist" }, { kind: "interview", questionIds: ["bringup-checklist-design", "probe-loading"] }, { kind: "review" }] },
  { day: 12, title: "Requirements to test cases", focus: "Traceability from a requirement to a test a reviewer can trust, and where the number comes from.", block: 3, items: [{ kind: "lesson", slug: "writing-a-trustworthy-test-case" }, { kind: "mission", slug: "the-requirement-nobody-could-test" }, { kind: "review" }] },
  { day: 13, title: "Root-cause analysis, written down", focus: "From symptom to cause to prevention, in a form a design review accepts.", block: 3, items: [{ kind: "lesson", slug: "root-cause-analysis" }, { kind: "interview", questionIds: ["rca-intermittent"] }, { kind: "apply", id: "application-2", title: "Send one application", detail: "Integration or verification role this time. Use a real debugging story from your own work in the cover note.", minutes: 20 }, { kind: "review" }] },
  { day: 14, title: "Integration day", focus: "Interfaces, ICDs and what goes wrong between subsystems that each pass their own tests.", block: 3, items: [{ kind: "lesson", slug: "interface-control-and-integration-faults" }, { kind: "mission", slug: "two-boards-one-bus-no-agreement" }, { kind: "interview", questionIds: ["icd-contents-question"] }, { kind: "review" }] },
  { day: 15, title: "Block review", focus: "Consolidate blocks 1 to 3 with targeted review and three mock questions.", block: 3, items: [{ kind: "review" }, { kind: "interview", questionIds: ["mcu-no-boot-walkthrough", "i2c-nack-systematic", "test-case-timing-requirement"] }, { kind: "apply", id: "mock-interview-2", title: "Record three answers and compare with day 10", detail: "Two repeated questions and one new one. Are they shorter, more ordered, more measured?", minutes: 15 }] },
  // ---- Block 4: RTOS, boot, firmware, Linux (days 16–20) ----
  { day: 16, title: "From reset vector to main()", focus: "What startup code does before your first line runs, and the three faults when it is skipped.", block: 4, items: [{ kind: "lesson", slug: "from-reset-vector-to-main" }, { kind: "interview", questionIds: ["startup-before-main", "reset-loop-cause"] }, { kind: "review" }] },
  { day: 17, title: "Tasks and priorities", focus: "RTOS scheduling and why the high-priority task starved.", block: 4, items: [{ kind: "lesson", slug: "priority-inversion" }, { kind: "mission", slug: "the-task-that-never-runs" }, { kind: "review" }] },
  { day: 18, title: "ISR to task handoff", focus: "Queues, semaphores and the data race you cannot see.", block: 4, items: [{ kind: "lesson", slug: "isr-to-task-handoff" }, { kind: "interview", questionIds: ["isr-task-handoff", "volatile-rmw-explained"] }, { kind: "review" }] },
  { day: 19, title: "Bootloaders and recovery", focus: "Updating firmware safely and getting a bricked unit back.", block: 4, items: [{ kind: "lesson", slug: "bootloaders-images-and-recovery" }, { kind: "interview", questionIds: ["bootloader-safe-update"] }, { kind: "apply", id: "application-3", title: "Send one application", detail: "Firmware or embedded software role. Mention the update and recovery design you can now describe.", minutes: 20 }, { kind: "review" }] },
  { day: 20, title: "Embedded Linux in a day", focus: "Boot chain, device tree, kernel versus user space, enough to converse and to find a missing device.", block: 4, items: [{ kind: "lesson", slug: "embedded-linux-boot-chain" }, { kind: "interview", questionIds: ["linux-boot-chain"] }, { kind: "review" }] },
  // ---- Block 5: ATE, HIL, Python, reliability (days 21–25) ----
  { day: 21, title: "Talk to an instrument", focus: "PyVISA and SCPI: automate one measurement and log it so a reviewer can trust it.", block: 5, items: [{ kind: "lesson", slug: "talking-to-an-instrument-with-pyvisa" }, { kind: "interview", questionIds: ["automate-a-measurement"] }, { kind: "review" }] },
  { day: 22, title: "Serial from Python", focus: "pyserial, framing, stale buffers and a request-reply exchange that cannot drift.", block: 5, items: [{ kind: "lesson", slug: "serial-automation-and-test-logs" }, { kind: "mission", slug: "the-flaky-automated-test" }, { kind: "review" }] },
  { day: 23, title: "HIL and SIL", focus: "What hardware-in-the-loop proves that a bench cannot, and what it cannot prove either.", block: 5, items: [{ kind: "lesson", slug: "sil-hil-what-each-proves" }, { kind: "interview", questionIds: ["sil-vs-hil", "watchdog-strategy"] }, { kind: "review" }] },
  { day: 24, title: "Reliability and FMEA", focus: "Failure modes, effects and the evidence behind a reliability claim.", block: 5, items: [{ kind: "lesson", slug: "fmea-for-a-small-embedded-product" }, { kind: "interview", questionIds: ["fmea-walkthrough"] }, { kind: "apply", id: "application-4", title: "Send one application", detail: "Test automation or reliability role. Mention a measurement you have automated, even if it was the simulated DMM here, and say so honestly.", minutes: 20 }, { kind: "review" }] },
  { day: 25, title: "Block review", focus: "Targeted review of blocks 4 and 5, plus a Python read-through.", block: 5, items: [{ kind: "review" }, { kind: "interview", questionIds: ["overflow-elapsed-time", "spi-first-byte-shifted", "bit-field-write", "flaky-test-diagnosis"] }] },
  // ---- Block 6: cross-industry cases and mock interviews (days 26–30) ----
  { day: 26, title: "Avionics and automotive", focus: "DO-178C/DO-254 and ISO 26262: scope, not slogans.", block: 6, items: [{ kind: "planned", title: "Lesson: What DO-178C, DO-254 and ISO 26262 are for", minutes: 12 }, { kind: "review" }] },
  { day: 27, title: "Medical and industrial", focus: "IEC 62304, IEC 60601, IEC 61508: how the same skills transfer.", block: 6, items: [{ kind: "planned", title: "Lesson: Medical and industrial standards in one page each", minutes: 12 }, { kind: "review" }, { kind: "interview", questionIds: ["probe-loading", "uart-garbage-diagnosis"] }] },
  { day: 28, title: "Your portfolio exercise", focus: "The STM32 sensor-monitoring project, described truthfully.", block: 6, items: [{ kind: "planned", title: "Lesson: Presenting a portfolio project without inflating it", minutes: 10 }, { kind: "apply", id: "portfolio-outline", title: "Write a one-page outline of your portfolio project", detail: "Sensor, interface, watchdog, diagnostics, tests, fault injection. Mark clearly what is simulated and what runs on hardware.", minutes: 25 }] },
  { day: 29, title: "Mock interview", focus: "A full 30-minute simulated technical interview using the question bank.", block: 6, items: [{ kind: "interview", questionIds: ["mcu-no-boot-walkthrough", "i2c-nack-systematic", "volatile-rmw-explained", "watchdog-strategy", "debugging-story"] }, { kind: "apply", id: "mock-interview-3", title: "Run a timed mock interview with a friend or a timer", detail: "Five questions, no notes, four minutes each. Score yourself with the rubrics afterwards.", minutes: 20 }] },
  { day: 30, title: "Review and plan the next 30", focus: "What is solid, what is shaky, and what the next month should contain.", block: 6, items: [{ kind: "review" }, { kind: "apply", id: "next-30-plan", title: "Write your next 30-day plan from the weak-area list", detail: "Use the Progress page: every wrong attempt and every 'shaky' rating is a line in the plan.", minutes: 15 }] },
];

export const journeyBlocks: Record<number, { days: string; focus: string }> = {
  1: { days: "1–5", focus: "Circuit fundamentals, schematics, MCU and measurements" },
  2: { days: "6–10", focus: "Embedded C, UART, SPI, I2C and CAN" },
  3: { days: "11–15", focus: "Integration, verification, RCA and traceability" },
  4: { days: "16–20", focus: "RTOS, boot, firmware, Linux and driver concepts" },
  5: { days: "21–25", focus: "ATE, HIL, Python and reliability" },
  6: { days: "26–30", focus: "Cross-industry cases and mock interviews" },
};
