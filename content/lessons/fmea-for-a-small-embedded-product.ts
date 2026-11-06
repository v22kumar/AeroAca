import type { Lesson } from "@/lib/content/schema";

export const fmeaForASmallEmbeddedProduct: Lesson = {
  slug: "fmea-for-a-small-embedded-product",
  moduleId: "verification",
  title: "FMEA for a small embedded product",
  summary: "Failure mode and effects analysis is a table that asks, for every part and function, 'how can this fail, what happens, how likely, how would we know?'. Learn the columns, the severity-occurrence-detection scoring, what a single point of failure is, and how an FMEA line turns into a design change and a test.",
  durationMinutes: 10,
  whyItMatters: "FMEA is the common language of reliability across automotive (AIAG-VDA), aerospace, medical and industrial products. Being able to walk through one line of an FMEA for a sensor input, from failure mode to the test that verifies the mitigation, is a strong signal in interviews for test, verification and systems roles.",
  objectives: [
    "Fill an FMEA row: item, function, failure mode, effect, cause, current controls, severity, occurrence, detection.",
    "Score S, O and D consistently, compute risk priority, and know why modern practice prefers action-priority tables to a bare RPN.",
    "Identify single points of failure and choose actions that reduce occurrence or raise detection, then trace each action to a test.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Structure follows the AIAG-VDA FMEA Handbook (2019) and IEC 60812. Scoring scales are the conventional 1 to 10; the handbook's Action Priority replacement for RPN is noted. No proprietary FMEA is reproduced.",
  },
  references: [
    { title: "AIAG & VDA FMEA Handbook (2019): seven-step approach, Action Priority tables", note: "Current automotive practice; AP replaces RPN thresholds." },
    { title: "IEC 60812: Failure modes and effects analysis (FMEA and FMECA)", note: "Generic standard for the method." },
    { title: "Lesson: Writing a test case that a reviewer can trust", note: "Where an FMEA's detection controls become test cases." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The heater that never knew the sensor was gone",
      body: `A process heater reads a thermistor through an ADC and switches a heating element to hold 60 °C. The thermistor's connector works loose in the field. An open thermistor reads as a very high resistance, which the firmware converts to −40 °C, so the controller turns the heater on at full power and keeps it there. Nothing in the design asked the question "what if the sensor is open?".

An FMEA asks exactly that question, for every input, before the first unit ships. One row of the table would have added a range check, a plausibility check and a test that opens the sensor and watches the heater turn off.`,
    },
    {
      type: "concept",
      title: "The row, and the three numbers",
      body: `An FMEA is a table. For each **item** (a part, a signal, a function) you list:

- **Function**: what it must do ("report process temperature within ±1 °C").
- **Failure mode**: how it can fail to do that, one per row: open circuit, short to ground, drift, stuck value, intermittent.
- **Effect**: what the failure does at the system level, and to the user ("heater runs at 100 %; housing exceeds 90 °C").
- **Cause**: the mechanism (loose connector, corrosion, wrong part).
- **Current controls**: what already prevents the cause or detects the mode (connector latch; none for detection).

Then three scores, each 1 to 10:

- **Severity (S)**: how bad the effect is. 1 negligible; 9 to 10 a safety hazard or regulatory violation. Severity belongs to the *effect* and does not change with a detection added; only a design change that removes the effect lowers it.
- **Occurrence (O)**: how often the cause produces the mode, given the prevention controls. 1 remote; 10 almost certain.
- **Detection (D)**: how likely the current controls are to catch the mode *before it reaches the user*. 1 certain detection; 10 no detection at all. Note the inversion: a high D is bad.

The classic product **RPN = S × O × D** (1 to 1000) ranks rows. It has known flaws: a 9 × 2 × 2 = 36 safety item can rank below a 4 × 5 × 5 = 100 nuisance, so the 2019 AIAG-VDA handbook replaced RPN thresholds with **Action Priority** tables that look at S first, then O, then D. Either way, the table is a prioritisation tool, not a verdict, and anything with S ≥ 9 gets an action regardless of the product.

A **single point of failure** is a mode whose single occurrence produces the top-level effect with nothing in between: one sensor, one range check, one relay. FMEA rows with S ≥ 9 and no independent detection are the SPOFs, and they get redundancy or a diverse check first.`,
      deeper: {
        title: "Design FMEA, process FMEA and the firmware column",
        body: `A **design FMEA** covers the product as designed; a **process FMEA** covers how it is built (a solder bridge, a wrong part placed) and feeds production test. Firmware appears in both: as a cause (an unchecked range), as a control (a plausibility check, a watchdog, a CRC) and as an item in its own right (the ADC driver's failure modes). The best FMEAs for embedded products list firmware detection controls explicitly and trace each to a test case, which is how the test plan grows from the analysis instead of from habit.`,
      },
    },
    {
      type: "visual",
      title: "Scoring one row",
      visual: "fmea-worksheet",
      body: `Score the heater's open-thermistor row. Move severity, occurrence and detection and watch the risk priority and the action priority band change; then add the range check and the open-sensor test and see which number each one moves.`,
      caption: `Illustrative worksheet using the conventional 1 to 10 scales and a simplified action-priority banding. Real programmes use the handbook tables for their industry.`,
    },
    {
      type: "example",
      title: "Worked example: the thermistor row, before and after",
      body: `**Before**

| Item | Failure mode | Effect | Cause | Prevention | Detection | S | O | D | RPN |
|---|---|---|---|---|---|---|---|---|---|
| Thermistor input | Open circuit | Reads −40 °C; heater 100 %; housing > 90 °C | Loose connector | Connector latch | none | 9 | 4 | 10 | 360 |

S is 9 because a burn hazard exists. D is 10 because nothing detects the open; the firmware happily converts the out-of-range value.

**Actions**
1. Firmware range check: ADC codes outside the thermistor's valid window are a sensor fault; heater off, alarm on. *Raises detection* (D 10 → 2).
2. Plausibility: temperature cannot change faster than 2 °C per second; a jump is a fault. *Raises detection further* for intermittent contacts.
3. Locking connector with a retention clip. *Lowers occurrence* (O 4 → 2).
4. Test case TC-TH-01: open the thermistor at the connector during heating; expected: heater output off within 1.0 s and alarm asserted, measured on the output line. Traced to this row and to the hazard.

**After**: S 9 (unchanged: the effect, if it occurred, is as bad), O 2, D 2 → RPN 36. The severity did not move and should not have; the row is now low priority because the mode is rare and caught. The scenario's field failure would have been a logged alarm and a service visit, not a burnt housing.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "rpn-calc",
        skill: "reliability",
        objective: "Compute and interpret an RPN.",
        prompt: `A row scores severity 8, occurrence 3 and detection 6. After adding a self-test that detects the mode at power-up, detection becomes 3. What is the RPN **after** the action?`,
        unit: "",
        answer: 72,
        tolerance: 0.5,
        solution: `RPN = S × O × D = 8 × 3 × 3 = **72** (it was 8 × 3 × 6 = 144 before). Severity stays at 8: detection does not change how bad the effect would be, only how likely it is to reach the user.`,
        solvedFeedback: `Correct: 72. And severity still says this row needs attention whatever the RPN; action-priority tables look at S first for that reason.`,
        misconceptions: [
          { value: 144, tolerance: 0.5, feedback: `144 is the RPN before the action (8 × 3 × 6). With detection improved to 3 it is 8 × 3 × 3 = 72.` },
          { value: 27, tolerance: 0.5, feedback: `You lowered severity to 3 as well. A detection control never changes severity; the effect, should it happen, is as bad as before. 8 × 3 × 3 = 72.` },
          { value: 14, tolerance: 0.5, feedback: `RPN is a product, not a sum: 8 × 3 × 3 = 72.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "spof-pick",
        skill: "reliability",
        objective: "Identify a single point of failure.",
        prompt: `In the heater, which of these is a single point of failure for the "housing overheats" effect?`,
        options: [
          { id: "a", text: "The thermistor input with a firmware range check and a plausibility check.", correct: false, feedback: `Two diverse detections stand between the mode and the effect; it is no longer single.` },
          { id: "b", text: "A single relay that is the only means of removing power from the element, with no independent thermal cut-out.", correct: true, feedback: `Yes. If the relay welds closed, nothing else stops the heating. A thermal fuse or a second, independently driven switch is the usual mitigation, and the FMEA row with S = 10 and no detection is what makes it visible.` },
          { id: "c", text: "The status LED driver.", correct: false, feedback: `Its failure has a low-severity effect and nothing to do with heating.` },
          { id: "d", text: "The UART used for logging.", correct: false, feedback: `Loss of logging does not cause the effect.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "fmea-actions-effect",
        skill: "reliability",
        objective: "Know which score each action moves.",
        prompt: `Select **every** statement that correctly says which FMEA score an action changes.`,
        options: [
          { id: "a", text: "Adding a firmware range check on a sensor lowers detection (D).", correct: true, feedback: `It makes the mode more likely to be caught before the effect; D falls.` },
          { id: "b", text: "Adding a range check lowers severity (S).", correct: false, feedback: `Severity belongs to the effect. Only a design change that makes the effect less harmful (a thermal fuse that limits the housing temperature) lowers S.` },
          { id: "c", text: "Specifying a locking connector lowers occurrence (O).", correct: true, feedback: `It attacks the cause, so the mode happens less often.` },
          { id: "d", text: "A test case that opens the sensor and checks the heater turns off verifies the detection control and belongs in the row's trace.", correct: true, feedback: `An FMEA action without a test is a promise; the test is the evidence.` },
          { id: "e", text: "Any row with S ≥ 9 can be left without action if its RPN is below 100.", correct: false, feedback: `Safety-severity rows get an action regardless of RPN; this is exactly why action-priority tables replaced RPN thresholds.` },
        ],
        solvedFeedback: `Right. Prevention lowers O, detection lowers D, only design-level effect changes lower S, every action traces to a test, and high severity overrides the arithmetic.`,
      },
    },
    {
      type: "interview",
      questionId: "fmea-walkthrough",
      intro: `Walk one row, with numbers, from failure mode to the test case. Say what severity means and why your action did not change it. That is the whole method in two minutes.`,
    },
    {
      type: "recap",
      summary: `- FMEA row: item, function, failure mode, effect, cause, prevention and detection controls, S, O, D.
- S is the effect's harm (unchanged by detection); O is the cause's likelihood (lowered by prevention); D is how likely the mode is caught before the user (lowered by detection); high D is bad.
- RPN = S × O × D ranks rows but mis-ranks safety items; action-priority tables look at S first; S ≥ 9 always gets an action.
- A single point of failure is a mode with nothing between it and the top-level effect; redundancy or diverse detection first.
- Every action becomes a design change and a traced test case.`,
      cards: [
        { id: "fmea-1", front: "What are S, O and D?", back: "Severity of the effect (1 to 10, 10 worst), occurrence of the cause (10 most frequent), detection of the mode before the user (10 means no detection). High D is bad." },
        { id: "fmea-2", front: "Which score does a firmware range check change?", back: "Detection (D) falls. Severity does not change; only a design change that reduces the effect's harm lowers S." },
        { id: "fmea-3", front: "Why did action-priority tables replace RPN thresholds?", back: "RPN can rank a 9×2×2 = 36 safety item below a 4×5×5 = 100 nuisance; AP looks at severity first, then occurrence, then detection." },
        { id: "fmea-4", front: "What is a single point of failure in FMEA terms?", back: "A failure mode whose single occurrence produces the top-level effect with no independent prevention or detection between them; the rows with high S and no detection." },
      ],
    },
  ],
};
