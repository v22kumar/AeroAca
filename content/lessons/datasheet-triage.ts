import type { Lesson } from "@/lib/content/schema";

export const datasheetTriage: Lesson = {
  slug: "datasheet-triage",
  moduleId: "pcb",
  prerequisites: ["reading-a-power-tree"],
  title: "Datasheet triage: the five numbers that matter",
  summary: "A datasheet is two hundred pages; a decision needs five numbers and their conditions. Learn to find supply range, logic levels, current, timing and thermal limits fast, to read the footnotes that change them, and to tell absolute maximum from recommended operating from typical.",
  durationMinutes: 10,
  whyItMatters: "Every part choice, every review finding and half of all debugging comes back to a datasheet number read correctly or not. Interviewers hand candidates a datasheet page for exactly this reason.",
  objectives: [
    "Locate the five numbers: supply, levels, current, timing, thermal, with their test conditions.",
    "Distinguish absolute maximum ratings, recommended operating conditions, and typical versus min/max.",
    "Derive a design margin from the numbers and the conditions.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Reflects the common structure of semiconductor datasheets (JEDEC-style sections). Example values are typical of common parts and are illustrative.",
  },
  references: [
    { title: "Any MCU or sensor datasheet: Absolute maximum ratings, Recommended operating conditions, Electrical characteristics, Thermal information", note: "Section names vary; the structure does not." },
    { title: "Lesson: Reading a schematic like a reviewer", note: "Where the numbers are used." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Typical is not a promise",
      body: `A sensor's datasheet says "supply current 1.2 mA". The battery budget was built on it. In production, a third of the units drew 2.1 mA and failed the battery-life test. The 1.2 mA was in the **typical** column, at 25 °C, with the sensor in its low-power mode; the **maximum** column, two centimetres to the right, said 2.5 mA at 85 °C in the mode the firmware actually used.

Triage is reading the right column under the right conditions. This lesson is the five numbers and the three columns.`,
    },
    {
      type: "concept",
      title: "Three columns, three sections",
      body: `Datasheets separate three kinds of statement, and confusing them is the most common error:

- **Absolute maximum ratings**: the limits beyond which the part may be damaged. Not operating conditions: a part run *at* its absolute maximum is not guaranteed to work, only not to die instantly. Design never touches these; they are for protection analysis (what a 5 V transient on a 3.3 V pin does).
- **Recommended operating conditions**: the ranges within which the electrical characteristics are guaranteed. This is where design lives: supply voltage range, temperature range, input levels.
- **Electrical characteristics**: the numbers, each with **min / typ / max** columns and **test conditions** (supply, temperature, load, mode). **Typical** is what a sample did at 25 °C; **min and max** are what every part is guaranteed to do across the stated conditions. Budgets use min and max; typical is for marketing and for estimating, never for guaranteeing.

The footnotes and the conditions column change the numbers: "at VDD = 3.3 V, 25 °C" means the value at 85 °C may be in a graph three pages later. A number without its conditions is not yet a number.`,
    },
    {
      type: "concept",
      title: "The five numbers",
      body: `For almost any digital or mixed-signal part, five numbers answer "can I use this, and how?":

1. **Supply**: operating range (e.g. 1.7 to 3.6 V) and the absolute maximum (4.0 V); for regulators, dropout at your current. Check headroom (day 1 of this module).
2. **Logic levels**: **VIH / VIL** (what the part's inputs accept as high and low) and **VOH / VOL** (what its outputs produce at a stated current). Two parts talk only if VOH of the driver exceeds VIH of the receiver and VOL is below VIL, with margin, at the current involved; and whether a pin tolerates voltages above its own supply (5 V tolerant).
3. **Current**: quiescent, active per mode, and **peak** (a radio's transmit burst, a flash write); plus what a pin can source or sink. The budget uses max, at the hottest temperature and the real mode.
4. **Timing**: the clock or data-rate limits, setup and hold times at an interface, power-on and reset timing (how long after supply before the part is ready), conversion or settling times. These are the numbers that set loop budgets and timeouts.
5. **Thermal**: **θJA** (junction-to-ambient thermal resistance for a stated board) and the maximum junction temperature; dissipation × θJA + ambient must stay below T_J max with margin. The stated board is usually larger than yours, so derate.

Write the five with their conditions in one table before choosing or reviewing a part; the table is also the first thing to reach for when the part misbehaves.`,
      deeper: {
        title: "Graphs beat tables",
        body: `The tables give a few points; the typical-characteristics graphs give the shape: supply current against temperature, output voltage against load, frequency against supply. When the table says "max 2.5 mA at 85 °C" and your product lives at 40 °C, the graph says what to budget. Graphs are typical, so apply the same max-to-typical ratio the table shows.`,
      },
    },
    {
      type: "example",
      title: "Worked example: can this sensor talk to this MCU?",
      body: `Sensor: VDD 2.7 to 5.5 V; VOH ≥ 0.8 × VDD at 1 mA; VIH ≥ 0.7 × VDD. MCU: VDD 3.3 V; pins FT (5 V tolerant); VIH ≥ 0.7 × 3.3 = 2.31 V; VOL ≤ 0.4 V at 8 mA.

- Sensor at 3.3 V, open-drain I2C with 4.7 kΩ to 3.3 V: sensor high = 3.3 V ≥ 2.31 V ✓; MCU low 0.4 V ≤ sensor VIL (0.3 × 3.3 = 0.99 V) ✓. Works.
- Sensor at 5 V, pull-ups to 5 V, MCU FT pins: MCU sees 5 V high ✓ (FT), its VIH met ✓; MCU low 0.4 V ≤ 0.3 × 5 = 1.5 V ✓. Works, only because the pins are FT.
- Sensor at 5 V, MCU pin **not** FT: 5 V exceeds the pin's absolute maximum (VDD + 0.3 V = 3.6 V). Level shifter required. This is scenario finding R-03 from the review lesson.

Current: sensor max 2.5 mA at 85 °C in continuous mode; budget 2.5 mA, not 1.2. Timing: 35 ms from power-on to first valid conversion; the firmware must wait. Thermal: negligible at 8 mW.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "typ-vs-max",
        skill: "datasheet",
        objective: "Choose the right column.",
        prompt: `A battery-life budget needs the sensor's supply current in its active mode over the product's −20 to 60 °C range. Which number do you use?`,
        options: [
          { id: "a", text: "The typical value at 25 °C, since most units will be near it.", correct: false, feedback: `Typical is a sample at one temperature; a third of production may exceed it, as the scenario showed.` },
          { id: "b", text: "The maximum value in the active mode over the specified temperature range, read from the max column or the temperature graph with the max-to-typical ratio applied.", correct: true, feedback: `Yes. Budgets use guaranteed numbers under the real conditions; typical is for estimates only.` },
          { id: "c", text: "The absolute maximum supply current rating.", correct: false, feedback: `Absolute maximum ratings are damage limits, not operating numbers; most parts do not even state a current there.` },
          { id: "d", text: "The value in the low-power mode, because the firmware could use it.", correct: false, feedback: `Budget the mode the firmware actually uses; a wished-for mode is not a number.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "thermal-margin",
        skill: "datasheet",
        objective: "Compute junction temperature.",
        prompt: `A regulator dissipates 0.8 W in a package with θJA = 60 °C/W on the datasheet's test board, in a 50 °C enclosure. What junction temperature does the datasheet arithmetic predict, in °C?`,
        unit: "°C",
        answer: 98,
        tolerance: 0.5,
        solution: `T_J = T_A + P × θJA = 50 + 0.8 × 60 = **98 °C**. Against a 125 °C maximum that is 27 °C of margin on the datasheet's board; a smaller board has a higher θJA and less margin, so derate and measure.`,
        solvedFeedback: `Correct: 98 °C. Remember the θJA board is usually bigger than yours.`,
        misconceptions: [
          { value: 48, tolerance: 0.5, feedback: `48 °C is the rise alone (0.8 × 60). Add the ambient: 50 + 48 = 98 °C.` },
          { value: 75, tolerance: 0.5, feedback: `You may have used 25 °C ambient. The enclosure is at 50 °C: 50 + 48 = 98 °C.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "five-numbers",
        skill: "datasheet",
        objective: "Name the five numbers.",
        prompt: `Select **every** item that belongs in the five-number triage table for a digital part.`,
        options: [
          { id: "a", text: "Supply range and absolute maximum, with dropout for regulators.", correct: true, feedback: `Headroom and protection analysis start here.` },
          { id: "b", text: "VIH/VIL and VOH/VOL at stated currents, and 5 V tolerance.", correct: true, feedback: `Whether two parts can talk.` },
          { id: "c", text: "The package's colour and marking.", correct: false, feedback: `Useful for inspection, not for triage.` },
          { id: "d", text: "Quiescent, active-mode and peak current, and pin drive limits, at max over temperature.", correct: true, feedback: `The budget.` },
          { id: "e", text: "Timing: rates, setup/hold, power-on and reset times; and thermal: θJA and T_J max.", correct: true, feedback: `Loop budgets, timeouts and heat.` },
        ],
        solvedFeedback: `Right. Supply, levels, current, timing, thermal, each with its conditions.`,
      },
    },
    {
      type: "interview",
      questionId: "datasheet-triage",
      intro: `Name the three sections and the three columns, then the five numbers with one example each of a condition that changes them. The typical-current story is the one to tell.`,
    },
    {
      type: "recap",
      summary: `- Absolute maximum (damage limits, never design points), recommended operating conditions (where design lives), electrical characteristics (min/typ/max with conditions).
- Budgets use min and max under the real conditions; typical is for estimates.
- Five numbers: supply and dropout; VIH/VIL and VOH/VOL and tolerance; quiescent, active and peak current and pin drive; timing (rates, setup/hold, power-on, reset); thermal (θJA, T_J max, derated for your board).
- A number without its conditions is not yet a number; graphs give the shape between table points.`,
      cards: [
        { id: "ds-1", front: "Absolute maximum vs recommended operating conditions?", back: "Absolute maximum: limits beyond which the part may be damaged; never design points. Recommended operating: the ranges within which the characteristics are guaranteed; where design lives." },
        { id: "ds-2", front: "When may you use a typical value?", back: "For estimates only. Budgets and guarantees use min or max under the product's real temperature, supply and mode." },
        { id: "ds-3", front: "The five triage numbers?", back: "Supply (range, abs max, dropout); logic levels (VIH/VIL, VOH/VOL, tolerance); current (quiescent, active, peak, pin drive); timing (rates, setup/hold, power-on, reset); thermal (θJA, T_J max)." },
        { id: "ds-4", front: "Junction temperature from the datasheet?", back: "T_J = T_A + P × θJA, with θJA for the datasheet's test board; derate for a smaller board and measure." },
      ],
    },
  ],
};
