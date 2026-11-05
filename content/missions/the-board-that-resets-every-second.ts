import type { Mission } from "@/lib/content/schema";

export const theBoardThatResetsEverySecond: Mission = {
  slug: "the-board-that-resets-every-second",
  moduleId: "mcu",
  title: "The board that resets every second",
  summary: "A working product starts rebooting after a firmware update. Read the reset-cause flags, prove the source, and fix the design rather than the symptom.",
  durationMinutes: 10,
  budgetMinutes: 30,
  whyItMatters: "Reset loops are a classic field failure and a classic interview scenario. The discipline here, read the flags before you form a theory, is the fastest route through almost every intermittent-reset investigation.",
  relatedLesson: "watchdogs-and-reset-loops",
  scenario: `**Board:** a deployed STM32F4 sensor node, powered from a 5 V supply through a 3.3 V LDO, with an independent watchdog configured for a **1.0 s** timeout (prescaler ÷32, reload 999).

**Change:** firmware 2.4 added logging to an SD card. Nothing in hardware changed.

**Observed:** after updating to 2.4 the node reboots about once every **1.1 s**. It never reaches the "ready" state. Units still on firmware 2.3 run normally.

Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Prove which reset source is firing and propose a fix that a design review would accept.`,
  goal: `Name the reset source with register evidence, link it to the specific change in firmware 2.4, and choose a fix that preserves the watchdog's protective purpose.`,
  actions: [
    {
      id: "read-csr",
      label: "Read RCC_CSR reset-cause flags after a reboot",
      category: "firmware",
      costMinutes: 3,
      assessment: "key",
      result: `**IWDGRSTF = 1**, PINRSTF = 1, BORRSTF = 0, SFTRSTF = 0, WWDGRSTF = 0.`,
      assessmentNote: `One register read answers "which source". The independent watchdog fired. PINRSTF accompanies most internal resets on STM32 and is not informative on its own; BORRSTF clear rules out the supply.`,
      evidence: "iwdg-flag",
    },
    {
      id: "scope-nrst-vdd",
      label: "Scope NRST and VDD together during a reset",
      category: "scope",
      costMinutes: 5,
      assessment: "useful",
      result: `NRST shows a short low pulse every **1.10 s**. VDD stays at 3.29 V throughout, no dip within 10 mV.`,
      assessmentNote: `Independent confirmation: a periodic pulse with a rock-steady supply is a watchdog or software reset, not a brown-out. The 1.1 s period is the 1.0 s timeout plus the time to reach the blocking point after boot.`,
      evidence: "periodic-pulse-stable-vdd",
    },
    {
      id: "diff-firmware",
      label: "Read the firmware diff between 2.3 and 2.4",
      category: "document",
      costMinutes: 5,
      assessment: "key",
      result: `2.4 adds \`sd_init()\` to the start of the main loop's first iteration. It polls the card with a **1.5 s** timeout, blocking, with interrupts enabled. The IWDG refresh is at the end of the main loop and is reached only after \`sd_init()\` returns.`,
      assessmentNote: `The link between the flag and the change. A 1.5 s blocking call under a 1.0 s watchdog can never complete. This is the root cause.`,
      evidence: "blocking-call",
    },
    {
      id: "iwdg-config",
      label: "Verify the IWDG configuration and compute the timeout",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `Prescaler code 3 (÷32), reload 999, LSI nominal 32 kHz: 32 × 1000 ÷ 32 000 = **1.00 s**. At the LSI limits it could be 0.68 s to 1.88 s.`,
      assessmentNote: `Confirms the arithmetic behind the period you see. Note the LSI tolerance: on a warm unit the real timeout might be shorter than nominal, so 2.3 was closer to the edge than anyone realised.`,
      evidence: "timeout-1s",
    },
    {
      id: "revert",
      label: "Flash firmware 2.3 on the same unit",
      category: "firmware",
      costMinutes: 4,
      assessment: "useful",
      result: `The unit runs normally. Reflashing 2.4 brings the reboot back.`,
      assessmentNote: `A clean bisect to the firmware. It does not say *what* in 2.4, but it rules out hardware and narrows the search to the diff.`,
      evidence: "firmware-bisected",
    },
    {
      id: "measure-current",
      label: "Measure the board's supply current during boot",
      category: "measure",
      costMinutes: 3,
      assessment: "neutral",
      result: `Peaks at 95 mA while the SD card initialises, well within the LDO's rating; VDD unaffected.`,
      assessmentNote: `Sensible if you suspected the SD card's inrush was dragging the rail down, but the scope already showed a stable VDD and BORRSTF was clear.`,
      evidence: "current-ok",
    },
    {
      id: "check-supervisor",
      label: "Measure the reset supervisor output",
      category: "measure",
      costMinutes: 3,
      assessment: "neutral",
      result: `High (3.28 V) between resets; it follows NRST low only during the watchdog pulse.`,
      assessmentNote: `A supervisor fault would hold NRST low or pulse it with VDD dips; neither is happening. Low information once the flags are read.`,
    },
    {
      id: "halt-before-reset",
      label: "Attach the debugger and halt the core just before 1 s",
      category: "firmware",
      costMinutes: 6,
      requiresAnyOf: ["read-csr", "scope-nrst-vdd"],
      assessment: "useful",
      result: `The program counter is inside \`sd_init()\`, in a polling loop waiting for the card's ready response.`,
      assessmentNote: `Direct observation of where the time goes. Together with the flag and the diff, this is a complete chain of evidence.`,
      evidence: "pc-in-sd-init",
    },
    {
      id: "disable-iwdg-test",
      label: "Build 2.4 with the watchdog disabled and run it",
      category: "firmware",
      costMinutes: 5,
      assessment: "wasteful",
      result: `The unit boots and logs. The SD initialisation takes 1.4 s.`,
      assessmentNote: `It confirms the watchdog is the mechanism, which the flag already told you, while producing a build that must never leave the bench. The time would have been better spent on the diff.`,
    },
    {
      id: "replace-ldo",
      label: "Replace the 3.3 V regulator",
      category: "rework",
      costMinutes: 20,
      assessment: "risky",
      result: `No change. The unit still reboots every 1.1 s on 2.4.`,
      assessmentNote: `Rework against the evidence: VDD was stable and BORRSTF was clear. Twenty minutes and a disturbed board for nothing.`,
    },
  ],
  diagnoses: [
    {
      id: "brown-out",
      label: "The SD card's inrush current causes a brown-out reset",
      correct: false,
      feedback: `BORRSTF is clear, VDD holds at 3.29 V through the event, and current peaks at a modest 95 mA. The evidence excludes the supply.`,
    },
    {
      id: "watchdog-blocking",
      label: "The independent watchdog fires because the new blocking SD initialisation (up to 1.5 s) prevents the 1.0 s refresh",
      correct: true,
      requiresEvidence: ["iwdg-flag", "blocking-call"],
      feedback: `Correct. IWDGRSTF proves the source, the diff explains it: a 1.5 s blocking call can never return before a 1.0 s watchdog fires, so the refresh at the end of the loop is unreachable and the unit loops forever.`,
    },
    {
      id: "supervisor",
      label: "The reset supervisor has become marginal and pulses NRST",
      correct: false,
      feedback: `The supervisor output is high between resets and only follows NRST during the pulse the chip itself generates. A supervisor fault would not set IWDGRSTF.`,
    },
    {
      id: "hard-fault-loop",
      label: "A hard fault in the SD driver ends in a software reset",
      correct: false,
      feedback: `A software reset sets SFTRSTF, which is clear, and the halted core was found polling normally inside sd_init(), not in a fault handler.`,
    },
    {
      id: "lsi-drift",
      label: "The LSI oscillator has drifted, shortening the watchdog timeout",
      correct: false,
      feedback: `LSI tolerance is real and worth margin, but 2.3 runs normally on the same unit with the same LSI. The variable that changed is the firmware, and the diff shows a 1.5 s block under a 1.0 s timeout.`,
    },
  ],
  fixes: [
    {
      id: "non-blocking-init",
      label: "Make SD initialisation non-blocking with its own timeout, driven from the main loop so the single end-of-loop refresh is reached every cycle; keep the 1.0 s watchdog",
      quality: "best",
      feedback: `This keeps the watchdog meaningful: it still fires if the application genuinely stalls. It also fixes the design flaw, a long blocking call in a watchdog-supervised loop, rather than hiding it. Add a test that boots with no SD card fitted.`,
    },
    {
      id: "refresh-inside-init",
      label: "Add watchdog refreshes inside the sd_init() polling loop",
      quality: "acceptable",
      feedback: `It stops the reboot and is a quick patch. But every refresh scattered into a driver is a place where a hung driver keeps the watchdog happy, and the next long call will need the same patch. Acceptable as an interim fix with a ticket to restructure.`,
    },
    {
      id: "longer-timeout",
      label: "Increase the watchdog timeout to 5 s",
      quality: "wrong",
      feedback: `It makes the symptom disappear and the product worse: a hung sensor node now takes five seconds longer to recover, and the next 6 s blocking call reopens the fault. Changing a protective limit to accommodate a bug inverts the purpose of the watchdog.`,
    },
  ],
  optimalPath: ["read-csr", "diff-firmware", "halt-before-reset"],
  debrief: `Three actions, fourteen bench-minutes. One register read named the source. The diff named the cause. Halting the core showed the exact loop.

What kept it short was refusing to theorise before reading RCC_CSR. Brown-out, supervisor and LSI drift were all plausible stories; the flags made two of them impossible in three minutes, and the "2.3 still works" fact made the third irrelevant.

The fix question is where judgement shows. Lengthening the watchdog is the fastest change and the worst one. The right fix restores the invariant the watchdog is there to protect: every cycle of the main loop completes in bounded time.`,
  references: [
    { title: "STM32F4 reference manual, Independent watchdog and RCC_CSR", id: "RM0090", url: "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf" },
    { title: "STM32F405/407 datasheet, LSI oscillator characteristics", note: "17 kHz to 47 kHz, 32 kHz typical: the reason IWDG timeouts need margin." },
  ],
};
