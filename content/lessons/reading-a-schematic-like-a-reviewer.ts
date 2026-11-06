import type { Lesson } from "@/lib/content/schema";

export const readingASchematicLikeAReviewer: Lesson = {
  slug: "reading-a-schematic-like-a-reviewer",
  moduleId: "pcb",
  prerequisites: ["reading-a-power-tree", "logic-levels-thresholds-and-open-drain", "mcu-board-does-not-boot"],
  title: "Reading a schematic like a reviewer",
  summary: "A schematic review is a fixed walk, not a browse: power, reset, clock, boot and debug first, then every interface at its boundary, then the things that are missing. Learn the order, the ten checks that catch most board spins, and how to write a review comment that gets acted on.",
  durationMinutes: 10,
  whyItMatters: "A found-in-review fault costs an hour; the same fault found on the bench costs a board spin and three weeks. Hardware teams invite test engineers into schematic review precisely because they know how boards fail; this lesson is how to use that seat.",
  objectives: [
    "Walk a schematic in review order and know what to check at each stop.",
    "Apply the ten checks: rails and decoupling, reset, clock, boot pins, debug, pull-ups, level compatibility, protection, test points, net names.",
    "Write a review finding with the evidence, the consequence and the proposed change.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Checklist items follow common hardware design-review practice and the STM32 hardware getting-started application notes (AN4488 for STM32F4 hardware development). No proprietary checklist is reproduced.",
  },
  references: [
    { title: "ST AN4488: Getting started with STM32F4xxxx MCU hardware development", note: "Power, reset, clock, boot mode and debug recommendations." },
    { title: "Lesson: MCU board does not boot", note: "The bring-up order mirrors the review order." },
    { title: "Lesson: I2C sensor not acknowledging", note: "Pull-ups and levels at the bus boundary." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The review that did not happen",
      body: `A sensor board went to fabrication after a "looks fine" glance at the schematic. On the bench: the I2C bus had no pull-ups (the designer assumed the sensor module had them; it did not), BOOT0 floated (the board booted into the ROM bootloader on humid mornings), and a 5 V sensor's SDA was wired straight into a 3.3 V pin that was not 5 V tolerant. Three faults, one spin, three weeks.

Each one is on the ten-check list below, and each takes a minute to find on paper.`,
    },
    {
      type: "concept",
      title: "The walk: power, reset, clock, boot, debug, then boundaries",
      body: `Review in the order the board will be brought up, because that is the order faults will appear:

1. **Power.** Every rail traced from input to loads: regulator type, headroom, dissipation, enable and sequencing, **decoupling per supply pin** (100 nF each, bulk per rail), and the analogue rail's filtering. Check the MCU's VCAP or core-regulator capacitors against the vendor note.
2. **Reset.** NRST pull-up and capacitor per the vendor, a way to assert reset by hand (button or test point), and nothing else on the net that could hold it.
3. **Clock.** Crystal load capacitors computed for the crystal's C_L and the board's stray; the crystal footprint matches the part; an alternative path (internal oscillator) is possible by firmware.
4. **Boot and configuration pins.** BOOT0 and any mode straps tied through a resistor to a defined level, never floating, with a jumper or test point to override. Same for any sensor address pins.
5. **Debug.** SWD or JTAG on a connector with its own ground, reachable with the enclosure on; a UART console pinned out.
6. **Boundaries.** For each interface where two parts meet: **levels** (a 5 V output into a 3.3 V input needs a 5 V-tolerant pin or a level shifter; check VIH/VIL against VOH/VOL), **pull-ups** (open-drain buses need them, once, at a computed value; push-pull outputs must not fight each other), **termination** (CAN, RS-485), **protection** (ESD on anything leaving the box, series resistors on exposed lines), **direction** (TX to RX), and **ground** (shared, or isolated with a reason).
7. **What is missing.** Test points on every rail and bus; a current-measurement jumper on the input; LEDs on a rail and a GPIO; fiducials and mounting holes; the net names matching the firmware's pin map.

The walk takes an hour on a medium board. It is the same hour that becomes three weeks when skipped.`,
      deeper: {
        title: "Reference designs and datasheets in review",
        body: `Every MCU and most sensors have a reference schematic in the datasheet or an application note. The review question is not "does this look reasonable?" but "where does this differ from the reference, and is each difference deliberate?". A difference with a reason is design; a difference without one is the finding.`,
      },
    },
    {
      type: "concept",
      title: "Writing a finding that gets acted on",
      body: `A review comment that says "I2C looks wrong" is ignored. One that says what, why and what instead is fixed:

> **R-07 (must fix).** Net I2C1_SDA / SCL: no pull-up resistors on the schematic; the sensor module datasheet (section 4.2) states none on board. Open-drain bus without pull-ups: no communication. Proposed: 4.7 kΩ to 3V3 on each line near the MCU; value per the bus capacitance estimate (≈ 100 pF).

Elements: an ID, a severity (must fix, should fix, question), the net or reference designator, the evidence (which datasheet, which page), the consequence, and the proposed change with its reasoning. Findings are listed in a table, and the designer's responses are recorded beside them. That table is the review's deliverable and a configuration-management record.

Severity matters: a board can ship with a "should fix" open and a note; it cannot ship with a "must fix" open. Reviewers who mark everything "must fix" are soon ignored; reviewers who find the three real faults and say so plainly are invited back.`,
    },
    {
      type: "example",
      title: "Worked example: the sensor board, reviewed",
      body: `| ID | Severity | Net / ref | Finding | Evidence | Proposed |
|---|---|---|---|---|---|
| R-01 | must fix | BOOT0 | Floating; boots to ROM loader on noise | AN4488 §boot | 10 kΩ to GND, jumper to 3V3 |
| R-02 | must fix | I2C1_SDA/SCL | No pull-ups; module has none | Module DS §4.2 | 4.7 kΩ to 3V3 each |
| R-03 | must fix | U4 SDA → PB7 | 5 V device drives a non-5V-tolerant pin | MCU DS pin table: PB7 not FT | Bidirectional level shifter; pull-ups both sides |
| R-04 | should fix | 3V3A | No filter between buck output and ADC reference | AN2834 | Ferrite + 10 µF + 100 nF at VREF+ |
| R-05 | should fix | NRST | No test point or button | AN4488 | Add TP and button |
| R-06 | question | X1 | Load caps 20 pF for a crystal needing C_L = 12 pF | Crystal DS | Confirm stray; likely 18 pF |
| R-07 | should fix | — | No test points on 5V, 3V3, 3V3A, SDA, SCL | — | Add TPs |

Three must-fix items found in forty minutes: the three that cost the spin in the scenario.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "review-walk-order",
        skill: "schematic",
        objective: "Order the review walk.",
        prompt: `Put the schematic review stops in the order you walk them.`,
        items: [
          { id: "power", text: "Power: rails, regulators, decoupling per pin, sequencing", why: "Everything depends on it; first to fail at bring-up." },
          { id: "reset", text: "Reset: NRST pull-up, capacitor, manual assert", why: "Second thing a board needs." },
          { id: "clock", text: "Clock: crystal, load capacitors, fallback", why: "Third." },
          { id: "boot", text: "Boot and configuration straps: defined levels, override", why: "The floating-pin spin." },
          { id: "debug", text: "Debug and console connectors", why: "Without them nothing else can be diagnosed." },
          { id: "bounds", text: "Every interface boundary: levels, pull-ups, termination, protection, direction, ground", why: "Where parts from different designers meet." },
          { id: "missing", text: "What is missing: test points, jumpers, LEDs, net names vs firmware pin map", why: "Found only by asking." },
        ],
        correctOrder: ["power", "reset", "clock", "boot", "debug", "bounds", "missing"],
        solvedFeedback: `Correct. The bring-up order, then boundaries, then absences.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "level-tolerance",
        skill: "schematic",
        objective: "Spot a level-compatibility fault.",
        prompt: `A 5 V sensor's open-drain SDA line is connected to an MCU pin marked "FT" (5 V tolerant) in the datasheet's pin table, with a 4.7 kΩ pull-up to 5 V. The MCU's VIH is 0.7 × VDD at VDD = 3.3 V. Is this acceptable?`,
        options: [
          { id: "a", text: "Yes: the FT pin tolerates 5 V, the pull-up to 5 V gives a high level the MCU recognises, and open-drain means the MCU never drives against 5 V.", correct: true, feedback: `Correct. 5 V-tolerant input, open-drain bus pulled to the sensor's level, and the MCU's VIH (2.31 V) is met. The MCU's own open-drain output pulls low only. Confirm the MCU pin is configured open-drain, not push-pull.` },
          { id: "b", text: "No: any 5 V on a 3.3 V MCU pin destroys it.", correct: false, feedback: `FT pins are specified to tolerate 5 V; that is what the marking means. The check is to read the pin table, not to assume.` },
          { id: "c", text: "No: the pull-up must go to 3.3 V so the MCU is not exposed to 5 V.", correct: false, feedback: `A 3.3 V pull-up could fail the sensor's VIH (often 0.7 × 5 V = 3.5 V). With an FT pin, pulling to 5 V is the correct choice; with a non-FT pin, a level shifter is needed.` },
          { id: "d", text: "No: open-drain buses cannot cross voltage domains.", correct: false, feedback: `Open-drain buses cross domains routinely, either with a tolerant pin as here or with a MOSFET level shifter.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "finding-elements",
        skill: "schematic",
        objective: "Write an actionable finding.",
        prompt: `Select **every** element a schematic review finding should contain.`,
        options: [
          { id: "a", text: "An ID and a severity (must fix, should fix, question).", correct: true, feedback: `So the list can be tracked and prioritised.` },
          { id: "b", text: "The net name or reference designator.", correct: true, feedback: `So the designer finds it in seconds.` },
          { id: "c", text: "The evidence: which datasheet, note or calculation.", correct: true, feedback: `So the finding can be verified rather than argued.` },
          { id: "d", text: "A remark about the designer's experience.", correct: false, feedback: `Findings are about the design. Nothing else belongs in them.` },
          { id: "e", text: "The consequence and a proposed change with its reasoning.", correct: true, feedback: `What goes wrong if ignored, and what to do instead.` },
        ],
        solvedFeedback: `Right. ID, severity, location, evidence, consequence, proposal; never the person.`,
      },
    },
    {
      type: "interview",
      questionId: "schematic-review",
      intro: `Give the walk in order, name the three faults from the scenario and how each is found on paper, and describe the finding format. Mention the reference-design comparison.`,
    },
    {
      type: "recap",
      summary: `- Walk in bring-up order: power (decoupling per pin), reset, clock, boot straps, debug; then every boundary (levels, pull-ups, termination, protection, direction, ground); then what is missing (test points, jumpers, LEDs, net names).
- Compare with the vendor reference design; every difference needs a reason.
- A finding has ID, severity, net, evidence, consequence, proposal; the table of findings and responses is the deliverable.
- Floating boot pins, missing pull-ups and level mismatches are the three faults that cost the most spins.`,
      cards: [
        { id: "rev-1", front: "Schematic review order?", back: "Power, reset, clock, boot straps, debug; then each interface boundary; then what is missing." },
        { id: "rev-2", front: "What to check at every interface boundary?", back: "Levels (VIH/VIL vs VOH/VOL, 5 V tolerance), pull-ups (once, computed), termination, protection, direction, ground." },
        { id: "rev-3", front: "Elements of an actionable review finding?", back: "ID, severity, net or reference designator, evidence (datasheet page or calculation), consequence, proposed change with reasoning." },
        { id: "rev-4", front: "Three faults that most often cost a board spin?", back: "Floating boot or configuration straps, missing pull-ups on an open-drain bus, and a level mismatch (5 V into a non-tolerant pin)." },
      ],
    },
  ],
};
