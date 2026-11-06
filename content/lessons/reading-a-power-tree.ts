import type { Lesson } from "@/lib/content/schema";

/**
 * Teaching format 2.0 pilot lesson (see docs/CONTENT_AUTHORING.md, "Teaching format 2.0").
 * Slug and the three original exercise ids are kept so earlier progress still counts.
 */
export const readingAPowerTree: Lesson = {
  slug: "reading-a-power-tree",
  moduleId: "fundamentals",
  format: "arc",
  prerequisites: ["circuit-laws-on-the-bench", "capacitors-inductors-rc-and-filters"],
  title: "Reading a power tree: regulators, rails and decoupling",
  summary: "Every board is a tree of voltages. Learn to read it from the input down, to see why a rail that measures fine at the regulator can still reset the load, and what each kind of capacitor is really for.",
  durationMinutes: 14,
  whyItMatters: "Most 'the board does weird things' faults are power faults. Reading the power tree first, and measuring in the right place, is what separates an engineer who finds the cause from one who swaps parts. It is also the first page of every design review.",
  objectives: [
    "Explain, in plain words and then with I × R, why a load can see a lower voltage than the regulator produces.",
    "Say what decoupling and bulk capacitors each do, and where each one has to be.",
    "Read a power tree top down: regulator type, headroom, dissipation, current budget, sequencing.",
    "Recognise a load-transient problem and name the trade-offs in fixing it.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Regulator behaviour, dissipation arithmetic and decoupling guidance follow standard vendor application notes (TI, ST). Numbers in the examples are illustrative. The rail-sag interactive is a simple I × R model, not a circuit simulation, and says so.",
  },
  references: [
    { title: "Texas Instruments: Understanding the terms and definitions of LDO voltage regulators (SLVA079)", note: "Dropout, headroom, PSRR, load transient." },
    { title: "ST AN4879 / vendor decoupling guidance for STM32", note: "100 nF per VDD pin close to the pin, bulk capacitance per rail." },
    { title: "Lesson: Circuit laws you use every day on the bench", note: "Ohm's law and the divider, which this lesson applies to a wire." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "3.31 V at the regulator, 2.9 V at the sensor",
      body: `A small board has a radio module and a temperature sensor on the same 3.3 V supply. Every time the radio transmits, the sensor resets.

The engineer puts a multimeter on the regulator's output pin: **3.31 V**, steady, all day. The regulator looks perfect. The sensor still resets.

Then she puts an oscilloscope on the sensor's own supply pin and triggers on a radio burst. For 20 ms the voltage **dips to 2.9 V**, and the sensor's reset threshold is 3.0 V.

Same rail, two instruments, two answers. This lesson is about why, and about reading a board's power so you predict this before the first burst.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "A power tree is a family tree of voltages",
      body: `Draw the board's power input at the top. Below it, every part that makes a lower voltage from a higher one. Below each of those, the things that run on that voltage. That picture is the **power tree**, and every board has one whether or not anyone drew it.

The part that makes a steady voltage is a **regulator**. Its job is to hold its output pin at, say, 3.30 V no matter how much current the loads take. A good regulator does exactly that: *at its own pin*.

Here is the catch that the scenario turns on: between the regulator's pin and the sensor's pin there is a length of copper trace and a connector. Copper is not a perfect conductor. When a lot of current flows through it, some voltage is lost along the way, exactly like a long garden hose loses pressure. The regulator cannot see or fix a loss that happens after its pin.

So the question "what voltage is the rail?" has no single answer. It depends on *where* you measure and *when*.`,
    },
    {
      type: "visual",
      stage: "how",
      depth: "understand",
      title: "See it: the same rail at two places",
      visual: "rail-sag",
      body: `**Try this first.** Drag the burst current to 800 mA and the path resistance to 0.40 Ω. Read the voltage the load sees. Then tick the bulk capacitor and watch what changes.

**Then try:** at what path resistance does a 500 mA burst stop resetting the sensor? And at 800 mA, how low must the resistance be without the capacitor?`,
      caption: `Illustrative model: load voltage = regulator voltage − burst current × path resistance. With a bulk capacitor at the load, the model lets a quarter of the burst flow through the trace, because the capacitor supplies the rest locally. Real boards also have inductance and regulator response time; the direction of every effect here is right, the exact numbers are not a simulation.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Sag is Ohm's law applied to a wire",
      body: `The voltage lost along a conductor is current times resistance: **V = I × R**. Engineers call the loss **sag** or **drop**.

A 40 cm trace, 0.5 mm wide, has roughly 0.3 Ω. A connector adds a few hundredths of an ohm per contact. Call the whole path 0.4 Ω.

- Sensor alone, 5 mA: sag = 0.005 A × 0.4 Ω = **0.002 V**. Invisible.
- Radio burst, 800 mA: sag = 0.8 A × 0.4 Ω = **0.32 V**. The load sees 3.30 − 0.32 = **2.98 V**, below the 3.0 V reset threshold.

Two measurement rules follow:

1. **Measure at the load, not at the regulator.** The regulator pin cannot show you a loss that happens after it.
2. **Measure under load, with a scope.** A multimeter averages. A 20 ms dip once a second becomes a tiny change in the average, and the meter shows 3.29 V. The scope, triggered on the burst, shows the dip itself.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Two kinds of capacitor for two kinds of problem",
      body: `A capacitor stores charge and gives it back when the voltage tries to fall. Boards use capacitors on supply rails for two different jobs, and the two are often confused.

**Bulk capacitor: the millisecond problem.** Put a capacitor of a few tens of microfarads *right at the load*. During the 20 ms burst it supplies most of the current itself; the trace only has to carry the average. Far less current through 0.4 Ω means far less sag. This is the scenario's fix: a 47 µF capacitor at the radio, plus a wider trace.

**Decoupling capacitor: the nanosecond problem.** Digital chips draw tiny, very fast spikes of current every time their logic switches, billions of times a second. No regulator and no trace can respond that fast. A 100 nF capacitor within a few millimetres of each supply pin supplies those spikes and keeps the noise off the rail. Distance matters: a decoupling capacitor 2 cm away behaves like a small inductor in series with a capacitor and stops working at exactly the frequencies it was meant for.

One rule of thumb for each: bulk at the load for bursts, 100 nF at every supply pin for edges.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "What each regulator needs: headroom and somewhere for the heat",
      body: `Reading the tree, ask two questions of every regulator.

**Does it have headroom?** A **linear regulator (LDO)** can only hold its output if its input is higher by at least its **dropout voltage**, typically 0.1 to 1 V depending on the part and the current. A 3.3 V LDO fed from a battery that sags to 3.4 V has 0.1 V of headroom; if the dropout is 0.3 V, the output simply follows the input down. Write the minimum input beside each LDO.

**Where does the heat go?** An LDO turns the voltage difference into heat: **P = (V_in − V_out) × I_out**.

- 5 V in, 3.3 V out, 500 mA: P = (5 − 3.3) × 0.5 = 1.7 × 0.5 = **0.85 W**.
- A small SOT-223 package has about 60 °C/W of thermal resistance, so 0.85 W × 60 °C/W = **51 °C** above ambient: near 91 °C at a 40 °C ambient, legal and hot.

A **switching regulator** (a buck stepping down, a boost stepping up) moves energy through an inductor instead of burning the difference: 85 to 95 % efficient, so the same job dissipates about a tenth of the power, at the cost of switching noise and layout care. The regulator type tells you where the heat and the noise will be.`,
      deeper: {
        title: "PSRR and the noise a rail inherits",
        body: `An LDO rejects ripple on its input by its power-supply rejection ratio (PSRR), which is high at low frequencies and falls with frequency. A buck's switching ripple at hundreds of kilohertz may pass through an LDO almost unattenuated, so sensitive analogue rails get a small filter in front of their LDO, and the tree should note the ripple each rail inherits from the one above.`,
      },
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: the sensor node's tree, line by line",
      body: `The board from the scenario, written as a tree. Every number below is derived, not guessed.

| Rail | Regulator | Input | Minimum input | Loads | Dissipation | Notes |
|---|---|---|---|---|---|---|
| 5 V | USB port | — | 4.75 V | the two regulators below | — | USB gives 500 mA; that is the budget for the whole board |
| 3.3 V digital | Buck, rated 1 A | 5 V | 4.0 V | MCU 60 mA + flash 20 mA + radio 800 mA in bursts | about 0.1 W | Burst is 80 % of the USB budget: a long burst train would brown out the input |
| 3.3 V analogue | LDO, rated 150 mA | 5 V | 3.6 V (0.3 V dropout) | sensor 5 mA + ADC reference 2 mA | (5 − 3.3) × 0.007 = 0.012 W | Filter in front so the buck's ripple does not reach the ADC |
| 1.2 V core | inside the MCU | 3.3 V | — | processor core | internal | 2.2 µF as the vendor note says |

**How each number was found.** The buck's minimum input is from its datasheet. The LDO's is 3.3 + 0.3 dropout. The LDO's dissipation is the 1.7 V difference times its 7 mA of load. The USB budget line is the one most people skip, and it is the one that would have predicted the scenario: 800 mA through a 0.4 Ω path is 0.32 V of sag, and the radio sits 40 cm from the regulator.

**Two decisions the table forced.** (1) A 47 µF capacitor at the radio and a wider trace. (2) An LC filter in front of the analogue LDO. Both were cheap on paper and expensive after the boards were built.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "sag-guided",
        skill: "power",
        objective: "Compute the voltage a load sees during a burst (guided).",
        prompt: `A regulator holds **3.30 V** at its pin. The trace and connector to a motor driver add up to **0.30 Ω**. The driver draws a **500 mA** burst. What voltage does the driver see during the burst, in volts?`,
        unit: "V",
        answer: 3.15,
        tolerance: 0.01,
        hints: [
          `The loss along the wire is current × resistance. First convert the current to amperes: 500 mA = 0.5 A.`,
          `Sag = 0.5 A × 0.30 Ω. Multiply them: that is the voltage lost along the path.`,
          `The load sees the regulator's voltage minus the sag: 3.30 V − 0.15 V.`,
        ],
        solution: `Sag = I × R = 0.5 A × 0.30 Ω = **0.15 V**. The driver sees 3.30 − 0.15 = **3.15 V**. Fine for most 3.3 V logic (thresholds are usually 3.0 V), but there is only 0.15 V of margin left for anything else.`,
        solvedFeedback: `Right: 0.15 V of sag, 3.15 V at the load. You just did the calculation the scenario's engineer needed before the boards were built.`,
        misconceptions: [
          { value: 0.15, tolerance: 0.01, feedback: `0.15 V is the sag itself. The question asks what the load *sees*: the regulator's 3.30 V minus that sag, 3.15 V.` },
          { value: 150, tolerance: 1, feedback: `You multiplied 500 by 0.3 without converting milliamps to amps. 500 mA is 0.5 A; 0.5 × 0.3 = 0.15 V; the load sees 3.15 V.` },
          { value: 3.3, tolerance: 0.005, feedback: `3.30 V is what the regulator pin shows. The load is at the far end of 0.30 Ω carrying 0.5 A, so it sees 0.15 V less: 3.15 V.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "sag-at-load",
        skill: "power",
        objective: "Explain a rail that sags only at the load.",
        prompt: `A rail measures 3.31 V at the regulator output with a multimeter, and the remote load resets during 20 ms current bursts. What is the most likely explanation, and the first measurement to make?`,
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
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "ldo-dissipation",
        skill: "power",
        objective: "Compute LDO dissipation.",
        prompt: `An LDO regulates 12 V down to 3.3 V and supplies 300 mA. What power does it dissipate, in watts?`,
        unit: "W",
        answer: 2.61,
        tolerance: 0.02,
        solution: `P = (V_in − V_out) × I = (12 − 3.3) × 0.3 = 8.7 × 0.3 = **2.61 W**. On a small package this is a serious heat problem; a buck pre-regulator down to 5 V would cut it to (5 − 3.3) × 0.3 = 0.51 W, and a buck alone to about 0.1 W.`,
        solvedFeedback: `Correct: 2.61 W. The voltage *difference* times the current, not the output power.`,
        misconceptions: [
          { value: 0.99, tolerance: 0.02, feedback: `0.99 W is the output power (3.3 V × 0.3 A). The LDO dissipates the difference: (12 − 3.3) × 0.3 = 2.61 W.` },
          { value: 3.6, tolerance: 0.02, feedback: `3.6 W is the input power (12 V × 0.3 A). The load takes 0.99 W of it; the LDO dissipates the remaining 2.61 W.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "check",
      depth: "apply",
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
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "In spec, and still resetting: the load-transient problem",
      body: `Suppose the team adds the 47 µF capacitor and widens the trace. The sag is gone. A week later a different symptom: the rail **rings** for 200 µs after each burst ends, overshooting to 3.6 V, and a part rated to 3.6 V absolute maximum is now living on the edge.

Nothing is out of specification. The regulator is in regulation; the capacitor is a good one. What changed is the regulator's **load transient response**: when the load current steps from 800 mA to 5 mA in microseconds, the regulator's control loop takes time to notice and back off. During that time the extra current charges the output capacitance and the voltage overshoots.

The size of the overshoot depends on the loop speed, the output capacitance *and its ESR* (equivalent series resistance). Every regulator datasheet gives the range of capacitance and ESR it is stable with; outside that range the output rings or, at light load, oscillates outright. "Add a bigger capacitor" is therefore not free: it is a change to the regulator's control loop.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Four ways out, and the constraint that decides",
      body: `The trade-offs a reviewer expects you to name:

- **More output capacitance** lowers sag and overshoot, but a very low-ESR ceramic can push some LDOs into oscillation, and large capacitance draws an inrush current at power-up that can trip the input's current limit.
- **A faster regulator** fixes the transient but usually costs more and may be noisier.
- **Soften the load**: ramp the radio's power amplifier over 100 µs instead of 1 µs. Fixes the cause and costs firmware, not parts.
- **Sequencing**: if the sensor must come up only after its rail is stable, an enable pin driven by a power-good signal is a line in the tree that nobody drew until something misbehaved at power-up.

The engineering decision is not "which is right" but "which constraint is binding here": cost, board space, the regulator already chosen, or a firmware team with time. The power tree is where you write that decision down, so the next person does not rediscover it.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "transient-tradeoff",
        skill: "power",
        objective: "Reason about a load-transient trade-off.",
        prompt: `After adding 470 µF of low-ESR ceramic at an LDO's output, the rail oscillates at a few kilohertz whenever the load is light. The LDO datasheet lists a stable output range of 10 to 100 µF with ESR between 10 mΩ and 1 Ω. What is the best explanation and action?`,
        options: [
          { id: "a", text: "The capacitor is defective; replace it with another 470 µF ceramic.", correct: false, feedback: `A second identical part will oscillate too. The capacitance and ESR are outside the range the regulator's control loop was designed for.` },
          { id: "b", text: "The output capacitance and ESR are outside the regulator's stable range, so its control loop oscillates; return to the datasheet range, or add a small series resistance, or choose a regulator rated for large low-ESR loads.", correct: true, feedback: `Yes. Stability is a property of the regulator plus its output network. The datasheet range is the contract, and the trade-off is sag margin against stability and inrush.` },
          { id: "c", text: "The oscillation is harmless ripple from the upstream buck converter.", correct: false, feedback: `Buck ripple is at hundreds of kilohertz and does not depend on the LDO's load; a few-kilohertz oscillation that appears only at light load is the LDO's own loop.` },
          { id: "d", text: "Add even more capacitance until the oscillation stops.", correct: false, feedback: `More of the thing that caused it moves the pole further, and the inrush at power-up grows with it.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "power-rail-sag",
      intro: `Walk the tree top down, then tell the sag story with I × R, the scope at the load, and the two-part fix. If the interviewer pushes, name the transient trade-off.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A firmware log full of unexplained resets, with a reset-cause register saying "brown-out", is this lesson. Before touching the code, scope the supply pin during the heaviest activity.
- **Aerospace and UAV systems.** Power distribution units, LRU supply margins and the electronic-load tests that prove them are power trees with sequencing arrows. A validation plan for a card starts with the tree and the minimum-input column.
- **Electronics R&D and design review.** The tree table in the worked example is page one of a hardware review. Reviewers look for the burst column and the budget line first.
- **Verification and interviews.** "A rail measures fine but the load resets" is a standard interview scenario; the strong answer is the measurement rule (at the load, under load, with a scope) followed by the two-part fix and, if pushed, the transient trade-off.`,
    },
    {
      type: "recap",
      summary: `- A power tree is every voltage on the board from the input down. Regulators hold their *own pin*; the copper after it is not free.
- Sag = I × R along traces and connectors. Measure at the load, under load, with a scope; a multimeter averages dips away.
- Bulk capacitance at the load handles millisecond bursts; 100 nF within millimetres of each supply pin handles nanosecond edges.
- Per regulator: headroom above dropout, dissipation (V_in − V_out) × I for an LDO, current budget including bursts, sequencing.
- Load transients are a trade-off between sag margin, regulator stability (capacitance and ESR range) and inrush.`,
      cards: [
        { id: "pwr-1", front: "LDO dissipation?", back: "(V_in − V_out) × I_out. 12 V to 3.3 V at 300 mA is 2.61 W; a buck pre-regulator or a buck alone cuts it by an order of magnitude." },
        { id: "pwr-2", front: "Why does a rail sag at the load but not at the regulator?", back: "Trace and connector resistance: sag = I × R during the burst. Measure at the load under load with a scope; fix with bulk capacitance at the load and a lower-resistance path." },
        { id: "pwr-3", front: "Decoupling vs bulk capacitance?", back: "Decoupling: 100 nF within millimetres of each supply pin for nanosecond edges. Bulk: microfarads at the regulator and at remote loads for millisecond bursts and transient response." },
        { id: "pwr-4", front: "What does an LDO need to stay in regulation?", back: "Input above output by at least the dropout voltage at the load current, output capacitance and ESR in the datasheet's stable range, and dissipation within the package's thermal limit." },
        { id: "pwr-5", front: "What trade-off does a big low-ESR output capacitor bring?", back: "Less sag and overshoot, but possible regulator instability outside its stable capacitance/ESR range and a larger inrush at power-up. The datasheet range is the contract." },
      ],
    },
  ],
};
