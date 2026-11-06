import type { Lesson } from "@/lib/content/schema";

export const circuitLawsOnTheBench: Lesson = {
  slug: "circuit-laws-on-the-bench",
  moduleId: "fundamentals",
  prerequisites: [],
  title: "Circuit laws you use every day on the bench",
  summary: "Ohm's law, Kirchhoff's two laws, the voltage divider and the Thévenin equivalent are the whole of the arithmetic behind sag, pull-ups, sense resistors and loading. Learn them as bench tools, with the numbers you will actually meet.",
  durationMinutes: 11,
  whyItMatters: "Every power, interface and measurement fault in this academy is settled with a few lines of this arithmetic. Interviewers ask divider and loading questions in the first five minutes because an engineer who cannot do them in her head cannot reason about a board.",
  objectives: [
    "Apply Ohm's law and Kirchhoff's voltage and current laws to a series-parallel circuit and keep the units straight.",
    "Compute a voltage divider's output, its source resistance, and how much a load or a meter changes it.",
    "Replace a divider or a supply-plus-trace by its Thévenin equivalent and use it to predict sag and loading.",
    "Compute power dissipation and choose a resistor rating with margin.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Standard circuit theory; the worked numbers were checked by hand and by the lab program. Component values are illustrative.",
  },
  references: [
    { title: "Horowitz and Hill, The Art of Electronics, 3rd edition, chapter 1 (Foundations)", note: "Ohm's law, dividers, Thévenin equivalents, loading, power." },
    { title: "Agarwal and Lang, Foundations of Analog and Digital Electronic Circuits, chapters 1 to 3", note: "Kirchhoff's laws and the lumped-circuit abstraction, with the assumptions that make them valid." },
    { title: "Lesson: Reading a power tree", note: "Where this arithmetic is applied to rails, traces and connectors." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The 1.65 V that read 1.1 V",
      body: `A junior engineer builds a divider to bring a 3.3 V signal down to 1.65 V for an ADC input: two 100 kΩ resistors. The meter says 1.65 V. The ADC reads a code that corresponds to 1.1 V, and the reading wanders when the board warms up.

Nothing is broken. The ADC's sampling capacitor and the pin's leakage load the divider, and a 50 kΩ source resistance is far too high for that input. The engineer who can see a divider as "1.65 V behind 50 kΩ" predicts this before building it. That view is the Thévenin equivalent, and it is the point of this lesson.`,
    },
    {
      type: "concept",
      title: "Three laws, one habit",
      body: `**Ohm's law.** V = I × R. Across a resistor, the voltage equals the current through it times its resistance. On the bench this reads three ways: the voltage you will see across a known resistor carrying a known current (a sense resistor: 0.1 Ω at 2 A is 0.2 V); the current you can infer from a measured voltage across a known resistor; and the resistance a path must have to drop a measured voltage at a measured current (a trace that drops 0.32 V at 0.8 A is 0.4 Ω).

**Kirchhoff's current law (KCL).** The currents into a node sum to the currents out of it. Charge does not pile up at a junction. This is why a rail's current budget is a sum, and why current measured at the supply equals the sum of every load, including the ones you forgot.

**Kirchhoff's voltage law (KVL).** Around any closed loop the voltage rises and drops sum to zero. Walk from the regulator output through the trace, the connector, the load and back through the ground return: the regulator's 3.3 V equals the trace drop plus the connector drop plus what the load gets plus the ground-return drop. The last term is the one people forget: **ground has resistance too**, and a ground return shared with a motor is why a sensor's "ground" sits at 0.2 V.

The habit: write units on every number (V, A, Ω, W) and check that each equation's units agree. 0.8 A × 0.4 Ω = 0.32 V, not 0.32 anything else. Most arithmetic slips on the bench are unit slips: milliamps multiplied as amps, kilohms as ohms.`,
      deeper: {
        title: "When the laws stop applying",
        body: `Kirchhoff's laws assume a *lumped* circuit: the wires have no resistance, inductance or capacitance of their own, and nothing changes faster than a signal crosses the board. Both assumptions fail at some point. A 40 cm trace is a resistor at DC (the power-tree lesson) and an inductor and transmission line for nanosecond edges (the layout lesson). The laws still hold if you draw those parasitic elements into the circuit; the mistake is leaving them out.`,
      },
    },
    {
      type: "concept",
      title: "The divider, and what it looks like from the outside",
      body: `Two resistors in series across a voltage V_in produce, at their junction,

V_out = V_in × R2 / (R1 + R2)

with R2 the resistor to ground. Equal resistors halve the voltage. 3.3 V through 10 kΩ then 10 kΩ gives 1.65 V, and the two resistors draw 3.3 V / 20 kΩ = 165 µA all the time, which is a battery question.

That is the divider with nothing connected. Connect anything and the output moves, because from the outside a divider looks like an ideal voltage source V_out **in series with a resistance** equal to R1 and R2 in parallel:

R_th = R1 × R2 / (R1 + R2)

This is the **Thévenin equivalent**, and it is the single most useful idea in bench electronics. The 10 kΩ / 10 kΩ divider is "1.65 V behind 5 kΩ". The scenario's 100 kΩ / 100 kΩ divider is "1.65 V behind 50 kΩ". Now any load is a second divider: a 100 kΩ load on the first gives 1.65 × 100 / (5 + 100) = 1.571 V (a 5 % error); on the second, 1.65 × 100 / (50 + 100) = 1.100 V, the scenario's reading.

The same picture describes a **supply plus its distribution**: a regulator at 3.3 V behind 0.4 Ω of trace and connector is a Thévenin source, and its output under 0.8 A is 3.3 − 0.8 × 0.4 = 2.98 V. Sag is the Thévenin resistance times the current. A **meter** is a load too: a 10 MΩ input across a 1 MΩ divider node pulls the reading down by about 9 %; across a 10 kΩ node it is invisible. Know the source resistance of the node before you believe the meter.

Rule of thumb for an ADC input: the source resistance should be well below what the ADC's datasheet allows for its sample time (often 10 kΩ or less for a few hundred nanoseconds of sampling); otherwise buffer it with an op-amp or lengthen the sample time. The ADC lesson carries the exact arithmetic.`,
    },
    {
      type: "visual",
      title: "Divider, source resistance and loading",
      visual: "divider-thevenin",
      body: `Set R1, R2 and the load, and read the unloaded output, the Thévenin resistance, the loaded output and the error. Try the scenario's 100 kΩ pair with a 100 kΩ load, then make the resistors ten times smaller and watch the error fall while the standing current rises.`,
      caption: `Illustrative calculator. The loaded output is the second divider formed by the Thévenin resistance and the load. Resistors are treated as exact; real 1 % parts add their own ±2 % to the ratio.`,
    },
    {
      type: "concept",
      title: "Power, and the rating you must not meet",
      body: `A resistor converts electrical power into heat at P = V × I = I² × R = V² / R. The sense resistor above dissipates 0.2 V × 2 A = 0.4 W; a 0.25 W part cooks. A 10 kΩ pull-up to 3.3 V dissipates 3.3² / 10 000 = 1.1 mW when the line is low; any part survives that.

Ratings are **maxima at a stated ambient temperature**, usually 70 °C, and derate above it; a resistor at its rated power runs hot enough to drift and age. The engineering rule is to use **half the rating** at most, and to check what the part is next to. The same arithmetic sizes a shunt for a current measurement: pick the resistance for a readable voltage (tens to hundreds of millivolts at full current), then check the power at full current, then check how much of your supply voltage the shunt steals (its **burden**).

Series resistances add; parallel resistances combine as the product over the sum (for two) or as the reciprocal of the sum of reciprocals (for more), and the parallel combination is always smaller than the smallest member. Two 10 kΩ in parallel are 5 kΩ: the Thévenin resistance of the divider, again.`,
    },
    {
      type: "example",
      title: "Worked example: three questions on one node",
      body: `A 5 V rail through a 4.7 kΩ resistor into a 2.2 kΩ resistor to ground feeds a comparator input.

1. **Unloaded output.** 5 × 2.2 / (4.7 + 2.2) = 5 × 0.3188 = **1.594 V**. Standing current 5 / 6.9 kΩ = 0.725 mA. Dissipation in the 4.7 kΩ: 0.725² × 4700 = 2.5 mW.
2. **Thévenin resistance.** 4.7 × 2.2 / 6.9 = **1.499 kΩ**. The node is "1.594 V behind 1.5 kΩ".
3. **Loading.** The comparator input leaks 1 µA into its pin at this voltage. Error = 1 µA × 1.5 kΩ = **1.5 mV**, negligible. A 1 MΩ meter: 1.594 × 1000 / (1.5 + 1000) = 1.5916 V, a 2.4 mV drop, also negligible. Swap the resistors for 470 kΩ and 220 kΩ to save the 0.7 mA: the Thévenin resistance becomes 150 kΩ, the leakage error 150 mV, and the design is broken. Low standing current and low source resistance pull against each other; the divider's resistance is chosen between them, which is the real design decision.

The lab program below prints these three numbers for any pair of resistors and a load, so you can check your own arithmetic before you trust it.`,
    },
    {
      type: "lab",
      title: "Run it yourself: divider, Thévenin, loading",
      lab: "py-divider",
      body: `A twelve-line Python program that does the lesson's arithmetic for the scenario's two dividers and the worked example, printing the unloaded output, the Thévenin resistance, the loaded output and the error. Run it, compare with the expected output, then do each line by hand once; the point is that your hand arithmetic and the program agree.`,
      tryNext: `Add a fourth case: 3.3 V through 10 kΩ and 10 kΩ, loaded by a meter of 10 MΩ. Predict the error in millivolts before you run it. Then change the meter to 1 MΩ and the resistors to 1 MΩ each.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "divider-loaded",
        skill: "circuit-laws",
        objective: "Compute a loaded divider output via the Thévenin equivalent.",
        prompt: `A 3.3 V rail feeds a 22 kΩ resistor in series with a 22 kΩ resistor to ground. A 47 kΩ load is connected across the lower resistor. What is the output voltage?`,
        unit: "V",
        answer: 1.34,
        tolerance: 0.02,
        solution: `Unloaded: 1.65 V behind R_th = 22 × 22 / 44 = 11 kΩ. Loaded: 1.65 × 47 / (11 + 47) = 1.65 × 0.8103 = **1.337 V**. Equivalent view: 47 kΩ in parallel with 22 kΩ is 14.99 kΩ, and 3.3 × 14.99 / (22 + 14.99) = 1.337 V.`,
        solvedFeedback: `Right. The load forms a second divider with the Thévenin resistance; 0.31 V of error from a load twice the divider's resistance.`,
        misconceptions: [
          { value: 1.65, tolerance: 0.02, feedback: `1.65 V is the unloaded output. The 47 kΩ load draws current through the upper resistor and pulls the node down.` },
          { value: 1.1, tolerance: 0.03, feedback: `That would be the result if the Thévenin resistance were 22 kΩ. It is the two resistors in parallel, 11 kΩ, because the supply is a short for this purpose.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "shunt-power",
        skill: "circuit-laws",
        objective: "Size a sense resistor's power rating.",
        prompt: `A current-sense resistor of 50 mΩ carries a maximum of 3 A. What power does it dissipate at that current, in watts?`,
        unit: "W",
        answer: 0.45,
        tolerance: 0.01,
        solution: `P = I² × R = 9 × 0.05 = **0.45 W**. A 1 W part keeps the half-rating margin; the voltage across it is 3 × 0.05 = 150 mV, a readable signal that steals 150 mV from the load's supply.`,
        solvedFeedback: `Correct: 0.45 W. I squared times R; the current enters twice.`,
        misconceptions: [
          { value: 0.15, tolerance: 0.01, feedback: `0.15 is I × R, the voltage across the shunt in volts. Power is V × I = 0.15 × 3 = 0.45 W.` },
          { value: 45, tolerance: 1, feedback: `That treats 50 mΩ as 50 Ω. Watch the prefix: milliohms.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "kirchhoff-bench",
        skill: "circuit-laws",
        objective: "Apply the laws to bench situations.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "A ground return shared between a motor and a sensor can lift the sensor's 'ground' by I × R of the return path.", correct: true, feedback: `KVL around the loop: the return conductor drops voltage like any other, and the sensor's reference moves with the motor current.` },
          { id: "b", text: "A 10 MΩ meter reads a 1 MΩ / 1 MΩ divider node about 9 % low.", correct: true, feedback: `The node is V/2 behind 500 kΩ; loaded by 10 MΩ it reads V/2 × 10 / 10.5 = 0.952 × V/2.` },
          { id: "c", text: "The current leaving a supply equals the sum of all load currents, including leakage and quiescent currents.", correct: true, feedback: `KCL at the supply node. The 'mystery' 2 mA on a sleeping board is usually a regulator's quiescent current plus pull-ups.` },
          { id: "d", text: "Two 10 kΩ resistors in parallel have a resistance of 20 kΩ.", correct: false, feedback: `In parallel they are 5 kΩ. Parallel resistance is always smaller than the smallest member; series resistances add.` },
          { id: "e", text: "A resistor should be run at its full power rating to make use of it.", correct: false, feedback: `Ratings are maxima at a stated ambient; running at the rating means a hot, drifting part. Use half or less.` },
        ],
        solvedFeedback: `Right. Ground has resistance, meters are loads, supplies see the sum of everything, parallel is smaller, and ratings are not targets.`,
      },
    },
    {
      type: "interview",
      questionId: "divider-loading",
      intro: `Say the Thévenin view first ("1.65 V behind 50 kΩ"), then the loaded number, then what you would change and why.`,
    },
    {
      type: "recap",
      summary: `- V = I × R; KCL: currents into a node sum to currents out; KVL: voltages round a loop sum to zero, ground return included. Write the units.
- Divider: V_out = V_in × R2 / (R1 + R2). From outside it is V_out behind R_th = R1 ∥ R2; any load or meter is a second divider against R_th.
- A supply plus trace and connector is a Thévenin source; sag = R_th × I.
- Power: V × I = I² × R = V² / R; use at most half the rating; a shunt is sized for readable voltage, power, and acceptable burden.`,
      cards: [
        { id: "law-1", front: "Thévenin resistance of a divider?", back: "R1 in parallel with R2: R1 × R2 / (R1 + R2). The divider is its unloaded output 'behind' that resistance; a 100 kΩ / 100 kΩ pair is 1.65 V behind 50 kΩ." },
        { id: "law-2", front: "How much does a load change a divider's output?", back: "Treat the load as a second divider against the Thévenin resistance: V_loaded = V_th × R_load / (R_th + R_load). A load ten times R_th costs about 9 %." },
        { id: "law-3", front: "Why does a sensor's ground sit above zero?", back: "KVL: the ground return has resistance and carries other loads' current; its I × R lifts every 'ground' along it. Separate returns or a ground plane fix it." },
        { id: "law-4", front: "Resistor power and rating?", back: "P = I² × R = V² / R. Use at most half the rated power at the real ambient; a 50 mΩ shunt at 3 A dissipates 0.45 W and needs a 1 W part." },
      ],
    },
  ],
};
