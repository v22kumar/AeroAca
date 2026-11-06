import type { Lesson } from "@/lib/content/schema";

export const boardBringUpChecklist: Lesson = {
  slug: "board-bring-up-checklist",
  moduleId: "integration",
  prerequisites: ["mcu-board-does-not-boot", "reading-a-power-tree", "the-dmm-and-the-bench-supply"],
  title: "A board bring-up checklist that actually gets used",
  summary: "Most bring-up checklists die in a drawer because they are long, vague and record nothing. Learn to write one that is short, measurable and leaves evidence, from the first continuity check to the first UART banner.",
  durationMinutes: 10,
  whyItMatters: "Bringing up a new board safely, and being able to show the record afterwards, is one of the clearest signals of a dependable integration engineer. Interviewers ask about it because it reveals how you think about risk, evidence and order.",
  objectives: [
    "Order bring-up into stages where each stage can only damage what has already been verified.",
    "Write checklist steps with an expected value, a tolerance, an instrument and a recorded result.",
    "Use a current-limited bench supply and pre-power resistance checks to turn a possible short into a measurement instead of smoke.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Method follows standard hardware-development practice as described in MCU vendor hardware guides (for example AN4488) and common lab procedure. Example resistance and current values are illustrative for a small 3.3 V STM32 board; use your design's numbers.",
  },
  references: [
    {
      title: "Getting started with STM32F4xxxx MCU hardware development",
      id: "AN4488",
      url: "https://www.st.com/resource/en/application_note/an4488-getting-started-with-stm32f4xxxx-mcu-hardware-development-stmicroelectronics.pdf",
      note: "Power supply scheme, decoupling, reset and boot recommendations that a checklist verifies.",
    },
    {
      title: "Bench power supply user manuals (any vendor): constant-current limit behaviour",
      note: "How the current limit is set and what the CC indicator means; the basis of the 'set a limit before power' step.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "The checklist in the drawer",
      body: `Your team has a bring-up checklist. It is four pages long, its steps say things like "verify power is OK", and the last person to fill one in left most boxes blank. On the latest build, someone powered a board straight from a 5 V wall adapter, a tantalum capacitor fitted backwards exploded, and nobody can say which steps were done before it did.

A checklist that nobody uses is not a process; it is a document. This lesson is about writing the other kind: short enough to finish, specific enough to fail, and recorded well enough that the next engineer can trust it.`,
    },
    {
      type: "concept",
      title: "Stages that protect each other",
      body: `Bring-up is ordered so that each stage can only damage what has already been checked. Four stages cover almost every board:

**1. Before power.** Visual inspection under magnification for bridges, missing parts and orientation (polarised capacitors, diodes, ICs). Compare part markings with the BOM for anything with variants (regulators, supervisors). Then **resistance to ground** on every supply rail with the board unpowered: a healthy 3.3 V rail on a small MCU board reads from a few hundred ohms to tens of kilohms depending on what is on it; **below about 10 Ω** means a short, and you stop here.

**2. First power, limited.** Use a bench supply with the **current limit set just above the expected consumption**: if the design should draw 60 mA, set 100 mA. A short then shows as the supply dropping into constant-current mode with a low voltage, not as a hot part. Watch the current for the first ten seconds; a slow rise is a part warming up and failing. Then measure every rail at the load, not at the regulator, and record the value.

**3. The MCU alive.** Reset released, clock running, debugger attaches, flash a known-good image, see the first sign of life (LED, UART banner). This is the *MCU board does not boot* lesson in checklist form.

**4. Peripheral by peripheral.** One interface at a time, with a measurement that proves it: I2C bus scan finds the expected addresses; SPI device returns its ID register; ADC reads a known reference within tolerance; UART loops back; CAN acknowledges a frame. Each one is a line with an expected value.

The order matters because it is cheap first, destructive last. Everything in stage 1 costs minutes and risks nothing; stage 2 is where a mistake costs a part; stage 4 is where firmware bugs start masquerading as hardware faults.`,
      deeper: {
        title: "Setting the current limit",
        body: `The limit is a *measurement*, not just a safety: when the supply trips into constant-current mode you learn immediately that the board draws more than designed. Set it from the design's expected current plus margin for inrush (bulk capacitors charging) and start-up peaks. Too tight and a healthy board trips on inrush; too loose and a short cooks a regulator before you notice. Many engineers start at twice the expected steady-state current and lower it once the real figure is known.

Also set the **voltage** before connecting, and double-check the polarity of the leads against the connector. The explosion in the scenario was a polarity mistake that a one-line "verify +5 V at pin 1, GND at pin 2 before connecting" step would have caught.`,
      },
    },
    {
      type: "concept",
      title: "What a usable step looks like",
      body: `A step that can be skipped, misread or passed without evidence will be. Each step needs five things:

| Field | Bad | Good |
|---|---|---|
| Action | "Verify power is OK" | "Measure 3V3 rail at C12 (near MCU VDD) with DMM, DC volts" |
| Expected | (blank) | "3.30 V" |
| Tolerance | "about right" | "3.20 to 3.40 V" |
| Actual | ☐ | "3.29 V" |
| Evidence | signature | instrument used, date, initials, photo or scope capture where it matters |

Three more rules make the list survive contact with a real bench:

- **One measurement per line.** "Check all rails" becomes one line per rail. Long lines get half-done.
- **A stop rule.** "If outside tolerance, stop and record before continuing." A checklist that tolerates "slightly low, carried on" is not protecting anything.
- **Short enough to finish.** Twenty to forty lines for a small board. If it needs more, split it by stage with a cover sheet.

The filled-in checklist then becomes the board's birth certificate: it tells the next person, and your future self, what was measured and what was assumed.`,
    },
    {
      type: "example",
      title: "Worked example: the first six lines",
      body: `For a small 3.3 V STM32 sensor board fed from 5 V:

| # | Action | Expected | Tol. | Instrument |
|---|---|---|---|---|
| 1 | Visual: polarity of C3 (tantalum, + marked), D1, U2 orientation | all per assembly drawing | n/a | magnifier |
| 2 | Marking of U3 (reset supervisor) vs BOM variant | "3.08 V variant, marking KL3A" | exact | magnifier, BOM |
| 3 | Resistance 5V→GND, board unpowered | ≥ 500 Ω | > 10 Ω | DMM Ω |
| 4 | Resistance 3V3→GND, unpowered | ≥ 300 Ω | > 10 Ω | DMM Ω |
| 5 | Bench supply set: 5.00 V, limit 100 mA, leads verified at J1 pins 1/2 | 5.00 V / 0.10 A | ±0.05 V | PSU display, DMM |
| 6 | Power on; steady-state current after 10 s | 45 mA | 30 to 70 mA | PSU display |

Line 2 is there because of the supervisor-variant mission: a checklist grows from real failures. Line 6 has a *range*, because a board drawing 5 mA is as wrong as one drawing 150 mA; both mean something is not running.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "bringup-stage-order",
        skill: "bring-up-process",
        objective: "Order bring-up so each stage protects the next.",
        prompt: `Put these bring-up activities in the order a careful engineer performs them on a first-article board. Tap items in sequence.`,
        items: [
          { id: "visual", text: "Visual inspection and BOM marking comparison", why: "Costs minutes, risks nothing, and catches reversed polarity and wrong variants before they can be powered." },
          { id: "ohms", text: "Resistance from each rail to ground, unpowered", why: "A short is a measurement at this point and a destroyed part later." },
          { id: "limit", text: "Set supply voltage and current limit; verify lead polarity at the connector", why: "Done before power so a fault shows as constant-current mode rather than damage." },
          { id: "rails", text: "Power on, watch current, measure every rail at the load", why: "First power is the first moment something can be damaged; rails must be proven before the MCU is expected to run." },
          { id: "mcu", text: "Attach debugger, flash a known-good image, confirm first sign of life", why: "Only once the rails are right does a silent MCU point at reset, clock or boot rather than power." },
          { id: "periph", text: "Verify peripherals one interface at a time with a measurement each", why: "Last, because firmware bugs here can masquerade as hardware faults and need a known-good platform underneath." },
        ],
        correctOrder: ["visual", "ohms", "limit", "rails", "mcu", "periph"],
        solvedFeedback: `Correct. Cheap and non-destructive first, firmware last. Each stage leaves evidence the next stage depends on.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "pre-power-short",
        skill: "bring-up-process",
        objective: "Act on a pre-power resistance reading.",
        prompt: `Unpowered, the 3V3 rail to ground reads **0.4 Ω**. The 5 V input reads 1.2 kΩ. What do you do?`,
        options: [
          { id: "a", text: "Power up with a 50 mA current limit and see whether it clears; some rails read low until the regulator starts.", correct: false, feedback: `A regulator being off does not make its output look like a dead short; 0.4 Ω is a wire. Powering a shorted rail, even limited, heats the short and can lift a trace. Find it first.` },
          { id: "b", text: "Stop. Record the reading, then localise the short unpowered: inspect the 3V3 net for bridges, and if nothing is visible, inject a small current and follow the voltage drop to the lowest point.", correct: true, feedback: `Right. 0.4 Ω on a rail is a solder bridge, a reversed or failed capacitor, or a wrong part. Localising it unpowered (visual first, then a milliohm-style drop measurement) costs minutes and risks nothing.` },
          { id: "c", text: "Measure the 5 V input again; 1.2 kΩ is suspicious and probably the real fault.", correct: false, feedback: `1.2 kΩ on an unpowered input with a regulator and pull-ups on it is unremarkable. The 0.4 Ω reading is the anomaly, and the stop rule applies.` },
          { id: "d", text: "Swap the regulator; a shorted LDO output is the most common cause.", correct: false, feedback: `Rework before evidence. A bridged capacitor, a reversed tantalum or a mis-fitted part are at least as likely, and the localisation step tells you which without touching anything.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "checklist-step-fields",
        skill: "bring-up-process",
        objective: "Recognise what makes a checklist step verifiable.",
        prompt: `The step reads: *"Check that the 3.3 V rail is fine."* Select **every** change needed before this step can fail or pass unambiguously.`,
        options: [
          { id: "a", text: "Name the measurement point (e.g. 'at C12 near MCU VDD') and the instrument.", correct: true, feedback: `Yes. 3.29 V at the regulator and 2.9 V at the chip are both 'the rail'; the point and the instrument make the result repeatable.` },
          { id: "b", text: "State the expected value with a tolerance.", correct: true, feedback: `Yes. 'Fine' cannot fail. '3.30 V, 3.20 to 3.40 V' can.` },
          { id: "c", text: "Add a field for the actual reading and who took it.", correct: true, feedback: `Yes. A tick box records a decision; a number records evidence. The next person can see what was measured, not only that someone was satisfied.` },
          { id: "d", text: "Add 'and also check the other rails' so one line covers them all.", correct: false, feedback: `The opposite direction. Bundled steps get half-done. One measurement per line.` },
          { id: "e", text: "Add a stop rule for readings outside tolerance.", correct: true, feedback: `Yes. Without it, 'slightly low, carried on' becomes normal and the checklist stops protecting anything.` },
        ],
        solvedFeedback: `Exactly: point, instrument, expected value with tolerance, recorded actual, and a stop rule. One measurement per line, never a bundle.`,
      },
    },
    {
      type: "interview",
      questionId: "bringup-checklist-design",
      intro: `Interviewers who have run a lab ask this to see whether you have ever been burnt. Answer with the stage order, the current limit, and what a step must contain.`,
    },
    {
      type: "figure",
      title: "Bring-up as a decision flow",
      diagram: "bring-up-flow",
      alt: "Bring-up decision flow: current limit and power, reset, clock, debugger, boot pins, then peripherals one by one.",
      caption: `One fault at a time, in this order, because each step depends on the previous one. Record every reading; a board that passes each step alone and fails together is a timing or thermal margin problem.`,
    },
    {
      type: "recap",
      summary: `- Four stages, cheap and safe first: before power (visual, BOM markings, rail resistance), first power with a current limit, MCU alive, peripherals one by one.
- Rail-to-ground resistance below about 10 Ω unpowered is a short: stop and localise it unpowered.
- Set voltage, current limit and verified polarity before connecting; the limit turns a short into a measurement.
- A step has an action with a measurement point and instrument, an expected value with tolerance, a recorded actual, and a stop rule. One measurement per line.
- The filled-in checklist is the board's birth certificate; it grows from real failures.`,
      cards: [
        { id: "bring-1", front: "The four bring-up stages, in order?", back: "Before power (visual, BOM markings, rail-to-ground resistance) → first power with current limit, rails at the load → MCU alive (reset, clock, debugger, first sign of life) → peripherals one interface at a time with a measurement each." },
        { id: "bring-2", front: "3V3 rail reads 0.4 Ω to ground unpowered. Next?", back: "Stop. It is a short (bridge, reversed/failed capacitor, wrong part). Localise it unpowered: visual, then follow the voltage drop with a small injected current. Never power it 'to see'." },
        { id: "bring-3", front: "What must a checklist step contain?", back: "Action with measurement point and instrument; expected value with tolerance; a field for the actual reading and who took it; a stop rule. One measurement per line." },
        { id: "bring-4", front: "How do you choose the bench supply current limit?", back: "Expected steady-state current plus margin for inrush and start-up, often about twice the expected current to begin with, lowered once the real figure is known. Set voltage and verify lead polarity before connecting." },
      ],
    },
  ],
};
