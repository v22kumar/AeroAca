import type { Lesson } from "@/lib/content/schema";

export const readingAPowerTree: Lesson = {
  slug: "reading-a-power-tree",
  moduleId: "fundamentals",
  prerequisites: ["circuit-laws-on-the-bench", "capacitors-inductors-rc-and-filters"],
  title: "Reading a power tree: regulators, rails and decoupling",
  summary: "Every board is a tree of rails. Learn to read it from the input down: what each regulator needs to stay in regulation, where the heat goes, why a rail that measures fine at the regulator can sag at the load, and what decoupling is actually for.",
  durationMinutes: 10,
  whyItMatters: "Most 'the board does weird things' faults are power faults: a rail that droops under a burst, a regulator that drops out when the battery sags, a missing capacitor that turns a clean rail into a noisy one. Reading the power tree first is what separates an engineer who measures from one who swaps parts.",
  objectives: [
    "Read a power tree: input, each regulator's type, dropout or headroom, current budget and dissipation.",
    "Explain why rails are measured at the load under load, and how trace and connector resistance produce sag.",
    "State what decoupling and bulk capacitance each do and where they go.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Regulator behaviour, dissipation arithmetic and decoupling guidance follow standard vendor application notes (TI, ST LDO and buck application notes). Numbers in the example are illustrative.",
  },
  references: [
    { title: "Texas Instruments: Understanding the terms and definitions of LDO voltage regulators (SLVA079)", note: "Dropout, headroom, PSRR, load transient." },
    { title: "ST AN4879 / vendor decoupling guidance for STM32", note: "100 nF per VDD pin close to the pin, bulk capacitance per rail." },
    { title: "Lesson: MCU board does not boot", note: "Power, reset, clock checks in order." },
  ],
  steps: [
    {
      type: "scenario",
      title: "3.31 V at the regulator, 2.9 V at the sensor",
      body: `A radio module transmits in 20 ms bursts at 800 mA. During each burst the sensor beside it resets. The 3.3 V regulator's output pin reads 3.31 V on the multimeter all day. The sensor's supply pin, scoped during a burst, dips to 2.9 V for the length of the burst and rings on the way back. The regulator is fine. The 40 cm of thin trace and a connector between them are not, and there is no bulk capacitor at the far end.

Reading the power tree would have predicted this before the first burst. This lesson is the reading.`,
    },
    {
      type: "concept",
      title: "The tree, top down",
      body: `Draw the input at the top and every rail below it with its regulator, then ask four questions per regulator:

1. **What type?** A **linear regulator (LDO)** drops the excess voltage as heat: simple, quiet, inefficient. A **switching regulator (buck, boost)** converts with an inductor: efficient (85 to 95 %), noisier, needs layout care. The type tells you where the heat and the noise will be.
2. **Does it have headroom?** An LDO needs its input above its output by at least the **dropout voltage** (tens of millivolts to a volt, depending on the part and the current). A 3.3 V LDO fed from a 3.6 V battery that sags to 3.4 V under load is at the edge; at 3.3 V it is out of regulation and the rail follows the input. Write the minimum input beside each LDO.
3. **What does it dissipate?** For an LDO, P = (V_in − V_out) × I_out. 5 V in, 3.3 V out, 500 mA: 0.85 W, which on a SOT-223 with 60 °C/W of thermal resistance is a 51 °C rise. Write the dissipation and the junction temperature beside it. For a buck, losses are a few per cent of output power.
4. **What is the current budget?** Sum the loads on the rail, including bursts, and compare with the regulator's rating and with the input's ability to supply it (a USB port gives 500 mA, a coin cell a few milliamps continuous).

Rails are also **sequenced** on many boards: a core rail that must come up before an I/O rail, an enable pin driven by a power-good output. A tree with sequencing has arrows between regulators; a board that misbehaves at power-up often has an arrow nobody drew.`,
      deeper: {
        title: "PSRR and the noise you inherit",
        body: `An LDO rejects input ripple by its power-supply rejection ratio, which is high at low frequencies and falls with frequency; a buck's switching ripple at hundreds of kilohertz may pass through an LDO almost unattenuated. Sensitive analogue rails are therefore fed from an LDO with a filter in front of it, and the tree should show the ripple each rail inherits from the one above.`,
      },
    },
    {
      type: "concept",
      title: "Measuring at the load, and what capacitors are for",
      body: `A regulator regulates at its own output pin. Between that pin and the load are traces, vias and connectors, each with resistance: a 0.5 mm trace of 40 cm is roughly 0.3 Ω; a connector contact adds tens of milliohms. **Sag = I × R**: 800 mA through 0.4 Ω is 0.32 V, which is the scenario's dip. So the rule is **measure at the load, under load, with the scope**, not at the regulator with a multimeter. A multimeter averages a 20 ms dip into nothing.

Capacitors fix two different problems:

- **Decoupling** (100 nF ceramic, one per supply pin, within millimetres of it): supplies the nanosecond-scale current spikes of switching logic that no regulator and no trace can deliver in time, and keeps that noise off the rail. Placement is everything; a decoupling capacitor 2 cm from the pin is an inductor in series with a capacitor.
- **Bulk** (1 to 100 µF, at the regulator output and at a remote load): supplies the millisecond-scale bursts (a radio, a motor start, an SD card write) while the regulator and the trace catch up. The scenario's fix is a 47 µF capacitor at the radio plus a wider trace: the capacitor supplies the burst locally and the trace resistance stops mattering.

Bulk capacitance also sets the **load-transient** response: a regulator with too little output capacitance overshoots and rings when a load steps, which is what the scenario's scope showed on the recovery. The regulator datasheet states the minimum and the ESR range it is stable with.`,
    },
    {
      type: "example",
      title: "Worked example: the sensor node's tree",
      body: `| Rail | Regulator | Input | Min input (dropout) | Loads | Dissipation | Notes |
|---|---|---|---|---|---|---|
| 5 V | USB | — | 4.75–5.25 V | buck + radio LDO | — | 500 mA budget from USB |
| 3.3 V digital | Buck, 1 A | 5 V | 4.0 V | MCU 60 mA, flash 20 mA, radio 800 mA burst | ≈ 0.1 W | 47 µF at the radio; 0.4 Ω trace fixed by widening |
| 3.3 V analogue | LDO 150 mA | 5 V | 3.6 V (0.3 V dropout) | sensor 5 mA, ADC ref 2 mA | 12 mW | LC filter in front; PSRR 40 dB at 1 kHz |
| 1.2 V core | Internal LDO | 3.3 V | — | MCU core | internal | 2.2 µF per vendor note |

Two things the table made visible: the radio burst alone is 80 % of the USB budget, so a 200 ms burst train would brown out the input, and the analogue LDO inherits the buck's ripple unless filtered. Both were design decisions once they were written down.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "ldo-dissipation",
        skill: "power",
        objective: "Compute LDO dissipation.",
        prompt: `An LDO regulates 12 V down to 3.3 V and supplies 300 mA. What power does it dissipate, in watts?`,
        unit: "W",
        answer: 2.61,
        tolerance: 0.02,
        solution: `P = (V_in − V_out) × I = (12 − 3.3) × 0.3 = **2.61 W**. On a small package this is a serious heat problem; a buck pre-regulator to 5 V would cut it to 0.51 W, or a buck alone to about 0.1 W.`,
        solvedFeedback: `Correct: 2.61 W. The voltage *difference* times the current, not the output power.`,
        misconceptions: [
          { value: 0.99, tolerance: 0.02, feedback: `0.99 W is the output power (3.3 V × 0.3 A). The LDO dissipates the difference: (12 − 3.3) × 0.3 = 2.61 W.` },
          { value: 3.6, tolerance: 0.02, feedback: `3.6 W is the input power (12 V × 0.3 A). The load takes 0.99 W of it; the LDO dissipates the remaining 2.61 W.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "sag-at-load",
        skill: "power",
        objective: "Explain a rail that sags only at the load.",
        prompt: `A rail measures 3.31 V at the regulator output with a multimeter and the remote load resets during 20 ms current bursts. What is the most likely explanation and the first measurement?`,
        options: [
          { id: "a", text: "The regulator is faulty; replace it.", correct: false, feedback: `The regulator output is in regulation. The fault is between it and the load.` },
          { id: "b", text: "Trace and connector resistance drop I × R during the burst, and a multimeter averages the dip away; scope the load's supply pin during a burst.", correct: true, feedback: `Yes. Measure at the load, under load, with the scope. The fix is bulk capacitance at the load and a lower-resistance path.` },
          { id: "c", text: "The load's decoupling capacitor is too large and is shorting the rail.", correct: false, feedback: `Capacitors do not short rails in steady state; a larger bulk capacitor at the load would reduce the dip.` },
          { id: "d", text: "The multimeter is miscalibrated.", correct: false, feedback: `Calibration cannot explain a 20 ms event; the meter's averaging can.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "capacitor-roles",
        skill: "power",
        objective: "Know what each capacitor does.",
        prompt: `Select **every** correct statement about decoupling and bulk capacitors.`,
        options: [
          { id: "a", text: "A 100 nF decoupling capacitor must be within millimetres of the supply pin it serves.", correct: true, feedback: `Distance adds inductance that defeats it at the frequencies that matter.` },
          { id: "b", text: "Bulk capacitance at a remote load supplies millisecond bursts while the regulator and trace catch up.", correct: true, feedback: `The scenario's fix.` },
          { id: "c", text: "One large capacitor at the regulator replaces all per-pin decoupling.", correct: false, feedback: `It cannot deliver nanosecond spikes at the far end of a trace; per-pin decoupling remains.` },
          { id: "d", text: "A regulator datasheet states the output capacitance and ESR range it is stable with.", correct: true, feedback: `Too little capacitance or the wrong ESR makes the regulator ring or oscillate on load steps.` },
          { id: "e", text: "Decoupling capacitors are optional on slow boards.", correct: false, feedback: `Logic edges are nanoseconds regardless of the clock rate; decoupling is about edges, not clock frequency.` },
        ],
        solvedFeedback: `Right. Decoupling near the pin for edges, bulk at the load for bursts, and the regulator's stability requirements respected.`,
      },
    },
    {
      type: "interview",
      questionId: "power-rail-sag",
      intro: `Walk the tree top down, then tell the sag story with I × R, the scope at the load, and the two-part fix.`,
    },
    {
      type: "recap",
      summary: `- Per regulator: type (LDO or switcher), headroom above dropout, dissipation (V_in − V_out) × I for an LDO, current budget including bursts, sequencing.
- Measure at the load, under load, with a scope; a multimeter averages dips away. Sag = I × R of traces and connectors.
- Decoupling (100 nF at each pin) handles nanosecond edges; bulk (µF at regulator and remote loads) handles millisecond bursts and sets transient response.
- Analogue rails inherit the ripple above them unless filtered; PSRR falls with frequency.`,
      cards: [
        { id: "pwr-1", front: "LDO dissipation?", back: "(V_in − V_out) × I_out. 12 V to 3.3 V at 300 mA is 2.61 W; a buck pre-regulator or a buck alone cuts it by an order of magnitude." },
        { id: "pwr-2", front: "Why does a rail sag at the load but not at the regulator?", back: "Trace and connector resistance: sag = I × R during the burst. Measure at the load under load with a scope; fix with bulk capacitance at the load and a lower-resistance path." },
        { id: "pwr-3", front: "Decoupling vs bulk capacitance?", back: "Decoupling: 100 nF within millimetres of each supply pin for nanosecond edges. Bulk: microfarads at the regulator and at remote loads for millisecond bursts and transient response." },
        { id: "pwr-4", front: "What does an LDO need to stay in regulation?", back: "Input above output by at least the dropout voltage at the load current, output capacitance in the datasheet's stable range, and dissipation within the package's thermal limit." },
      ],
    },
  ],
};
