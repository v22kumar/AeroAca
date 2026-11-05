import type { Mission } from "@/lib/content/schema";

export const freshBoardNoSignOfLife: Mission = {
  slug: "fresh-board-no-sign-of-life",
  moduleId: "mcu",
  title: "Fresh board, no sign of life",
  summary: "First unit of a new revision is back from assembly and the debugger cannot see the MCU. Isolate the fault with the fewest bench minutes.",
  durationMinutes: 12,
  budgetMinutes: 45,
  relatedLesson: "mcu-board-does-not-boot",
  scenario: `**Board:** rev B of an STM32F405 sensor node. 5 V in from the bench supply, a 3.3 V LDO, an external reset supervisor (U3), 8 MHz crystal, SWD header, one status LED on PA5.

**Expected:** power LED on, status LED blinking at 1 Hz within a second, ST-LINK attaches.

**Observed:** power LED on. Status LED dark. ST-LINK: *"No target connected"*. Rev A boards with the same firmware work.

You have the bench: multimeter, oscilloscope, debugger, a second ST-LINK, the schematic, the BOM and datasheets. Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Your lead wants a root cause and a fix proposal, with evidence, in about 45 bench-minutes.`,
  goal: `Identify the single root cause, back it with evidence a reviewer would accept, and choose a fix that addresses the cause rather than the symptom.`,
  actions: [
    {
      id: "visual",
      label: "Inspect the board under magnification",
      category: "inspect",
      costMinutes: 5,
      assessment: "useful",
      result: `Joints look clean. No bridges on the MCU or the LDO. All passives present. The reset supervisor U3 is fitted in the correct orientation; its top marking reads **"KL6E"**. You note the marking for later comparison with the BOM.`,
      assessmentNote: `A quick visual rarely finds the fault but often finds a clue. Noting a part marking costs nothing and can save an hour later.`,
      evidence: "marking-noted",
    },
    {
      id: "vin",
      label: "Measure VIN at the board",
      category: "measure",
      costMinutes: 2,
      assessment: "useful",
      result: `**5.02 V**, steady. Bench supply shows 0.03 A.`,
      assessmentNote: `Cheap and necessary. It also tells you the board is not drawing a short-circuit current.`,
      evidence: "vin-ok",
    },
    {
      id: "rail",
      label: "Measure the 3.3 V rail at the MCU VDD pin",
      category: "measure",
      costMinutes: 2,
      assessment: "key",
      result: `**3.29 V**, no visible noise on the meter. Same reading at the LDO output and at the MCU pin.`,
      assessmentNote: `This is the first gate of the boot chain and it passes. Power to the digital domain is not the problem.`,
      evidence: "vdd-ok",
    },
    {
      id: "vcap",
      label: "Measure the VCAP pins (core regulator output)",
      category: "measure",
      costMinutes: 3,
      assessment: "useful",
      result: `**1.26 V** on both VCAP pins.`,
      assessmentNote: `Proves the internal 1.2 V core regulator is up, which only happens if the chip is powered and not damaged in the power domain. A strong argument against "the MCU is dead".`,
      evidence: "core-ok",
    },
    {
      id: "nrst",
      label: "Measure NRST with the multimeter",
      category: "measure",
      costMinutes: 2,
      assessment: "key",
      result: `**0.04 V**. Expected: close to 3.3 V from the internal pull-up when nothing is asserting reset.`,
      assessmentNote: `This is the pivotal reading. The core is being held in reset, which explains "no target" completely and makes every downstream check (clock, boot pins, firmware) irrelevant until it is resolved.`,
      evidence: "nrst-low",
    },
    {
      id: "nrst-scope",
      label: "Look at NRST on the oscilloscope",
      category: "scope",
      costMinutes: 4,
      requiresAnyOf: ["nrst"],
      assessment: "useful",
      result: `Flat line at 0 V over 10 seconds, including right after power-on. No pulses, no brief release.`,
      assessmentNote: `Distinguishes a *continuous* assertion (supervisor, short, debugger) from a *reset loop* (watchdog, brown-out). This one is continuous.`,
      evidence: "nrst-continuous",
    },
    {
      id: "boot0",
      label: "Measure the BOOT0 pin",
      category: "measure",
      costMinutes: 2,
      assessment: "neutral",
      result: `**0.00 V**, pulled down through a 10 kΩ resistor as designed.`,
      assessmentNote: `Correct, but it cannot explain the symptom. A wrong BOOT0 level changes *what* runs; the debugger would still attach.`,
      evidence: "boot0-ok",
    },
    {
      id: "hse",
      label: "Probe the 8 MHz crystal",
      category: "scope",
      costMinutes: 5,
      assessment: "neutral",
      result: `No oscillation on either crystal pin.`,
      assessmentNote: `Tempting, and meaningless here. The HSE oscillator is off until firmware enables it, and off while the chip is in reset. SWD does not need it. A silent crystal on a chip that has not started is the expected observation.`,
      evidence: "hse-silent",
    },
    {
      id: "second-debugger",
      label: "Try a second ST-LINK and a new SWD cable",
      category: "firmware",
      costMinutes: 5,
      assessment: "neutral",
      result: `Same result: "No target connected". Connect-under-reset also fails.`,
      assessmentNote: `Reasonable to rule out the tool, but it produces no new information about the board. A two-minute NRST measurement would have told you more.`,
      evidence: "debugger-ok",
    },
    {
      id: "reflash",
      label: "Attempt to reflash via the system bootloader (UART)",
      category: "firmware",
      costMinutes: 10,
      assessment: "wasteful",
      result: `The bootloader never answers. BOOT0 would need to be high anyway, and the chip is not executing anything.`,
      assessmentNote: `Firmware cannot be the cause when the core is not running, and a chip that cannot answer SWD cannot run the bootloader either. Ten minutes for no information.`,
    },
    {
      id: "compare-marking",
      label: "Compare U3's marking with the BOM and datasheet",
      category: "document",
      costMinutes: 5,
      requiresAnyOf: ["visual", "nrst"],
      assessment: "key",
      result: `The BOM calls for the supervisor variant with a **3.08 V** threshold (holds reset while VDD is below 3.08 V). The datasheet marking table maps **"KL6E"** to the **4.63 V** threshold variant. With VDD at 3.3 V, that part sees an "undervoltage" condition permanently and asserts reset forever. Rev A used the correct variant.`,
      assessmentNote: `This is the root-cause evidence. A reading of 0 V on NRST says *something* holds reset; the marking table says *what* and *why*.`,
      evidence: "wrong-variant",
    },
    {
      id: "isolate-reset",
      label: "Lift the supervisor's RESET output pin and re-measure",
      category: "rework",
      costMinutes: 8,
      requiresAnyOf: ["nrst"],
      assessment: "key",
      result: `With U3's output isolated, NRST rises to **3.28 V**. ST-LINK attaches immediately. The status LED starts blinking at 1 Hz.`,
      assessmentNote: `A clean confirmation: remove the suspected cause and the system behaves. Together with the marking comparison this closes the case. On its own it tells you *where*, not *why*, so the BOM check is still needed to prevent a repeat.`,
      evidence: "reset-isolated",
    },
    {
      id: "swap-mcu",
      label: "Replace the MCU",
      category: "rework",
      costMinutes: 90,
      assessment: "risky",
      result: `After 90 minutes of hot-air rework, a new MCU, and a cleaned board: "No target connected". NRST still reads 0.04 V.`,
      assessmentNote: `The most expensive action on the bench, taken without evidence that the MCU was at fault. It risked the board, consumed a part, and changed nothing, because the cause was never inside the chip.`,
    },
  ],
  diagnoses: [
    {
      id: "mcu-dead",
      label: "The MCU was damaged during assembly",
      correct: false,
      feedback: `The core regulator output (VCAP at 1.26 V) shows the chip is alive in its power domain, and the moment NRST is released it runs the firmware correctly. Scrapping it would have destroyed evidence and left the real cause in place for every future board.`,
    },
    {
      id: "wrong-supervisor",
      label: "The reset supervisor is the wrong threshold variant and holds NRST low permanently",
      correct: true,
      requiresEvidence: ["nrst-low", "wrong-variant"],
      feedback: `Correct. A supervisor with a 4.63 V threshold on a 3.3 V rail never sees a "good" supply, so it asserts reset forever. NRST at 0 V explains "no target"; the marking table explains NRST; isolating the pin confirms it.`,
    },
    {
      id: "boot0-wrong",
      label: "BOOT0 is strapped so the chip runs the bootloader instead of the application",
      correct: false,
      feedback: `BOOT0 measures 0 V, which selects main flash. More importantly, a chip running the bootloader still answers the debugger. This diagnosis cannot produce the symptom "no target connected".`,
    },
    {
      id: "crystal",
      label: "The 8 MHz crystal is not oscillating, so the chip has no clock",
      correct: false,
      feedback: `The crystal is silent because the chip is held in reset, not the other way around. STM32 parts start from the internal HSI and the SWD port does not depend on the crystal. This is the classic red herring of a dead board.`,
    },
    {
      id: "debugger",
      label: "The ST-LINK, cable or SWD header is faulty",
      correct: false,
      feedback: `Two probes and a new cable gave the same result, and the 0 V reading on NRST is a property of the board, not the tool. A tool fault would not hold a board-level net at ground.`,
    },
  ],
  fixes: [
    {
      id: "fit-correct",
      label: "Fit the BOM-specified 3.08 V supervisor, re-verify NRST and boot, and add a marking check to incoming inspection",
      quality: "best",
      feedback: `This restores the intended design and prevents the same substitution reaching the next batch. The marking check is the part that turns a repair into an improvement.`,
    },
    {
      id: "remove-supervisor",
      label: "Remove the supervisor entirely and rely on the MCU's internal power-on and brown-out reset",
      quality: "acceptable",
      feedback: `It works on the bench, and STM32 parts do have internal POR and BOR. But it silently changes the design: the external supervisor may have been chosen for a tighter threshold or a manual-reset function. A design change needs a review, not a bench decision.`,
    },
    {
      id: "pullup-override",
      label: "Add a strong pull-up on NRST to overpower the supervisor",
      quality: "wrong",
      feedback: `The supervisor output is an open-drain driver actively pulling the line to ground; a pull-up cannot win that fight, and if it could, it would defeat every legitimate reset. It treats the symptom and misunderstands the circuit.`,
    },
  ],
  optimalPath: ["rail", "nrst", "compare-marking", "isolate-reset"],
  debrief: `The efficient path was four actions and about seventeen bench-minutes: confirm VDD, measure NRST, explain the 0 V with the marking table, confirm by isolating the pin.

What made it efficient was *order*. Each step was the cheapest measurement that eliminated the largest remaining group of causes. Power first, because nothing works without it. Reset second, because "no target" with power present is very often a held reset. Only then documents and rework.

The traps were the crystal and the MCU swap. Both are plausible if you start from "what could stop a chip" instead of "what does this symptom rule out". The debugger failing to attach rules out the crystal immediately; the VCAP reading rules out a dead chip before any rework.

In an interview, tell this story in that order: symptom, what it rules out, cheapest discriminating measurement, evidence, confirmation, fix that prevents recurrence.`,
  references: [
    { title: "Getting started with STM32F4xxxx MCU hardware development", id: "AN4488", url: "https://www.st.com/resource/en/application_note/an4488-getting-started-with-stm32f4xxxx-mcu-hardware-development-stmicroelectronics.pdf", note: "NRST, VCAP and supply recommendations." },
    { title: "Voltage supervisor datasheets (any vendor)", note: "Threshold variants are encoded in the part number suffix and the top marking. Always compare the marking table with the BOM when a reset line misbehaves." },
  ],
};
