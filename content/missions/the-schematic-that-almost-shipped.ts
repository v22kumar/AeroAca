import type { Mission } from "@/lib/content/schema";

export const theSchematicThatAlmostShipped: Mission = {
  slug: "the-schematic-that-almost-shipped",
  moduleId: "pcb",
  title: "The schematic that almost shipped",
  summary: "A sensor-node schematic is due at the fab house tomorrow. Walk it in review order, find the faults on paper with datasheet evidence, and write findings the designer will act on.",
  durationMinutes: 10,
  budgetMinutes: 40,
  whyItMatters: "Reviewing is the cheapest debugging there is. This mission trains the walk and the discipline of citing a datasheet for every finding, which is what makes a reviewer trusted.",
  relatedLesson: "reading-a-schematic-like-a-reviewer",
  scenario: `**Design:** a battery sensor node. STM32F4 (3.3 V, most pins marked FT, PB6/PB7 used for I2C1), a 5 V humidity sensor module on I2C (datasheet: "no on-board pull-ups; VIH ≥ 0.7 × VDD"), a 3.3 V buck regulator, a crystal, an SWD header, BOOT0 shown with no connection, a 3.3 V analogue rail taken straight from the buck output to the ADC reference pin.

**Constraint:** the schematic goes to fabrication tomorrow; a spin costs three weeks.

Every document excerpt below is **simulated for this mission**, written to be realistic; it is not a real product's design.

Walk the schematic in review order, gather the datasheet evidence, and decide what must be fixed before release.`,
  goal: `Find the must-fix faults (floating BOOT0, missing I2C pull-ups, a 5 V device on a pin whose tolerance must be checked, an unfiltered ADC reference) with evidence, and write findings that lead to the right changes.`,
  actions: [
    {
      id: "walk-power",
      label: "Walk the power tree and decoupling",
      category: "document",
      costMinutes: 5,
      assessment: "useful",
      result: `Buck 3.3 V at 1 A; 100 nF at each VDD pin; 2.2 µF on VCAP per the vendor note; 10 µF bulk. The ADC reference pin VREF+ is tied directly to the buck output with no filter.`,
      assessmentNote: `Power is largely right; the unfiltered reference is a should-fix finding (ADC accuracy), with AN2834 as the evidence.`,
      evidence: "vref-unfiltered",
    },
    {
      id: "walk-reset-clock",
      label: "Check reset and clock against the vendor note",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `NRST: 100 nF to ground, internal pull-up, no button or test point. Crystal 8 MHz, C_L = 12 pF, load caps 18 pF each: consistent with ~6 pF stray.`,
      assessmentNote: `Reset is acceptable with a should-fix for a test point; the clock arithmetic checks out. Noting what is right is part of a review.`,
      evidence: "reset-clock-ok",
    },
    {
      id: "walk-boot",
      label: "Check BOOT0 and configuration straps",
      category: "document",
      costMinutes: 2,
      assessment: "key",
      result: `BOOT0 has no connection. AN4488: BOOT0 must be tied through a resistor to a defined level; a floating BOOT0 can select system-memory boot.`,
      assessmentNote: `A must-fix with the vendor note as evidence: the humid-morning ROM-bootloader fault, found on paper.`,
      evidence: "boot0-floating",
    },
    {
      id: "walk-i2c",
      label: "Walk the I2C boundary: pull-ups, levels, pin tolerance",
      category: "document",
      costMinutes: 6,
      assessment: "key",
      result: `No pull-ups anywhere on SDA/SCL; the module datasheet confirms none on board. The sensor runs at 5 V and expects VIH ≥ 3.5 V. MCU pin table: PB6 and PB7 are FT (5 V tolerant).`,
      assessmentNote: `Two findings from one boundary: pull-ups missing (must fix) and the level question answered by the pin table: FT pins allow pull-ups to 5 V with the MCU in open-drain mode, so no level shifter is needed, but the pull-ups must go to 5 V for the sensor's VIH.`,
      evidence: "i2c-boundary",
    },
    {
      id: "walk-debug",
      label: "Check debug and console",
      category: "document",
      costMinutes: 2,
      assessment: "neutral",
      result: `SWD on a 10-pin header with ground; USART2 on a 3-pin header. Fine.`,
      assessmentNote: `Quick and right: SWD with ground and a console header are present. No finding, which is also worth recording.`,
    },
    {
      id: "walk-missing",
      label: "List what is missing: test points, jumpers, LEDs",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `No test points on 3V3, SDA, SCL or VREF+; no current-measurement jumper on the battery input; one LED on a GPIO.`,
      assessmentNote: `Should-fix findings that make every later bench session faster; cheap at review time.`,
      evidence: "missing-tps",
    },
    {
      id: "assume-module-pullups",
      label: "Assume the sensor module has pull-ups, as most breakout boards do",
      category: "document",
      costMinutes: 1,
      assessment: "risky",
      result: `The module datasheet, section 4.2, states no on-board pull-ups. The assumption would have shipped a bus that cannot communicate.`,
      assessmentNote: `Assumptions are not evidence. One minute with the datasheet replaces three weeks.`,
    },
    {
      id: "demand-shifter",
      label: "Require a level shifter on I2C because the sensor is 5 V",
      category: "document",
      costMinutes: 3,
      assessment: "wasteful",
      result: `The designer points to the MCU pin table: PB6/PB7 are FT. A shifter adds parts and a failure point for no benefit; pull-ups to 5 V with open-drain MCU pins meet both sides' levels.`,
      assessmentNote: `A finding without the pin-table evidence; the review should check tolerance, not assume incompatibility.`,
    },
    {
      id: "write-findings",
      label: "Write the findings table with IDs, severity, evidence and proposals",
      category: "document",
      costMinutes: 6,
      requiresAnyOf: ["walk-boot", "walk-i2c"],
      assessment: "key",
      result: `R-01 must fix BOOT0 10 kΩ to GND + jumper (AN4488); R-02 must fix 4.7 kΩ pull-ups to 5 V on SDA/SCL, MCU pins open-drain (module DS §4.2, MCU pin table FT); R-03 should fix ferrite + 10 µF + 100 nF on VREF+ (AN2834); R-04 should fix NRST test point and button; R-05 should fix test points and current jumper. Designer accepts R-01 to R-03 before release.`,
      assessmentNote: `The deliverable: each finding with location, evidence, consequence and proposal, and the designer's response recorded.`,
      evidence: "findings-written",
    },
  ],
  diagnoses: [
    {
      id: "must-fix-set",
      label: "Two must-fix faults: BOOT0 floating, and the I2C bus has no pull-ups (the 5 V sensor is compatible via the FT pins once pull-ups go to 5 V with open-drain MCU pins); plus an unfiltered ADC reference as should-fix",
      correct: true,
      requiresEvidence: ["boot0-floating", "i2c-boundary"],
      feedback: `Correct. Both must-fix findings are backed by the vendor note and the datasheets, and the level question is settled by the pin table rather than by assumption.`,
    },
    {
      id: "needs-shifter",
      label: "The I2C bus needs a level shifter because the sensor is 5 V",
      correct: false,
      feedback: `The MCU pins are FT; with pull-ups to 5 V and open-drain MCU outputs both sides' levels are met. The shifter is unnecessary; the missing pull-ups are the fault.`,
    },
    {
      id: "clean",
      label: "The schematic is fine to release; issues can be fixed with firmware",
      correct: false,
      feedback: `Firmware cannot add pull-ups or tie BOOT0. Both faults are hardware and both cost a spin.`,
    },
    {
      id: "crystal",
      label: "The crystal load capacitors are wrong and the board will not boot",
      correct: false,
      feedback: `18 pF load caps for C_L = 12 pF with about 6 pF stray is the standard arithmetic. The clock is fine.`,
    },
  ],
  fixes: [
    {
      id: "findings-release",
      label: "Issue the findings table; release after R-01 (BOOT0 strap) and R-02 (pull-ups to 5 V, open-drain pins) are incorporated; schedule R-03 to R-05 for this spin if time allows",
      quality: "best",
      feedback: `Must-fix items block release; should-fix items are recorded and scheduled. The table is the configuration record.`,
    },
    {
      id: "fix-must-only",
      label: "Fix BOOT0 and the pull-ups, drop the rest to save the deadline",
      quality: "acceptable",
      feedback: `The board will work. The unfiltered reference will cost ADC accuracy and the missing test points will cost bench time; both are cheap now and expensive later, so record them as open.`,
    },
    {
      id: "ship",
      label: "Release as is and fix on the next spin",
      quality: "wrong",
      feedback: `A bus that cannot communicate and a boot pin that floats are not next-spin items; the first spin would be unusable.`,
    },
  ],
  optimalPath: ["walk-boot", "walk-i2c", "write-findings"],
  debrief: `Three actions, fourteen minutes, two must-fix faults with datasheet evidence and a findings table. Walking in review order found the boot strap and the bus boundary; reading the pin table settled the level question without adding a part.

The traps were assuming (the module has pull-ups) and over-prescribing (a shifter the pins do not need). Both are what happens when a reviewer argues from habit instead of from the document.

In an interview, the story is "I review in bring-up order, I cite the datasheet for every finding, and I separate must-fix from should-fix so the release decision is clear".`,
  references: [
    { title: "ST AN4488 (BOOT0, NRST, crystal), ST AN2834 (ADC reference), the MCU pin table (FT pins)", note: "The evidence behind each finding." },
  ],
};
