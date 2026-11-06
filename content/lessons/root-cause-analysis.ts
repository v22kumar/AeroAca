import type { Lesson } from "@/lib/content/schema";

export const rootCauseAnalysis: Lesson = {
  slug: "root-cause-analysis",
  moduleId: "instrumentation",
  prerequisites: ["mcu-board-does-not-boot"],
  title: "Root-cause analysis and the five whys that matter",
  summary: "A symptom tells you where to look; a root cause tells you what to change so it never comes back. Learn the evidence chain from reproduce to prevent, the questions that separate causes from coincidences, and how to write it up so a review accepts it.",
  durationMinutes: 10,
  whyItMatters: "Every mission in this academy ends in a root cause and a fix that prevents recurrence; this lesson is the method behind them. 'Tell me about a root-cause analysis you ran' is one of the most common behavioural-technical interview questions in hardware and firmware roles.",
  objectives: [
    "Distinguish symptom, contributing cause and root cause, and know when to stop asking why.",
    "Run the evidence chain: reproduce, isolate, confirm by fix-and-unfix, prevent.",
    "Write an RCA that separates evidence from inference and corrective from preventive action.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Methods are standard quality-engineering practice (five whys, cause-and-effect categories, fault-tree reasoning, 8D-style write-ups) presented at the level used in engineering reviews. No proprietary process is reproduced.",
  },
  references: [
    { title: "Ishikawa (cause-and-effect) diagrams and the five whys, as described in standard quality-engineering texts", note: "Categories: design, component, process, environment, firmware, measurement." },
    { title: "Fault tree analysis basics (IEC 61025 overview level)", note: "Top event, AND/OR gates, basic events; used here only as a way of thinking, not as a quantitative method." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The fix that fixed nothing",
      body: `A field unit reboots every few hours. The first engineer finds the watchdog firing and increases its timeout. The reboots stop for a week, then return at a lower rate. The second engineer finds a stack overflow in a logging task and doubles the stack. Quiet for a month. Then a different unit does the same thing.

Nobody asked why the logging task's stack grew, which was a buffer sized from a configuration value that a new sensor type had doubled. Each fix addressed the last thing seen. None addressed the cause, so the problem kept moving.

This lesson is about asking the question that stops the problem from moving.`,
    },
    {
      type: "concept",
      title: "Symptom, cause, root cause",
      body: `A **symptom** is what you observe: the reboot. A **cause** is something that produces the symptom directly: the watchdog fired because the task overran. A **root cause** is the earliest point in the chain where a change would have prevented the whole sequence, *and* that is within your control to change: the buffer was sized from an unchecked configuration value.

Three tests tell you whether you have reached a root cause:

1. **If this were fixed, would the symptom be impossible, not just less likely?** Doubling the stack makes overflow less likely; bounding the buffer makes it impossible.
2. **Is it a condition, not a person?** "The engineer forgot" is never a root cause; "nothing checks the configuration range" is.
3. **Does fixing it prevent the whole class, not just this instance?** A range check on every configuration value prevents the next doubled parameter too.

**Five whys** is the simple tool: ask why of each answer until the tests above are met. It fails in two ways: stopping early at the first cause (the watchdog) or going too far into the abstract ("because we are under time pressure"). Stop at the first condition you can change and verify.

When the chain branches, **cause-and-effect categories** keep you honest: for each of *design, component, process, environment, firmware, measurement*, ask "could something here produce this symptom?" and go looking for evidence for or against it. Most investigations that stall have skipped a category.`,
      deeper: {
        title: "Fault-tree thinking for intermittent faults",
        body: `For an intermittent fault, draw the symptom as a top event and ask what combinations of lower events produce it. A reboot might require (overrun) AND (watchdog enabled); overrun might be (large buffer) OR (slow I/O) OR (interrupt storm). Each leaf is something you can measure or inject. The tree turns "it happens sometimes" into a list of experiments, and it exposes AND gates, where two conditions must coincide, which is why intermittent faults are intermittent.`,
      },
    },
    {
      type: "concept",
      title: "The evidence chain",
      body: `An RCA that a review accepts has four stages, each with evidence:

**Reproduce.** Make the symptom happen on demand, or capture it when it happens (single-shot trigger, logging with timestamps, reset-cause flags). Until you can reproduce or capture it, you are guessing. For intermittent faults, measure the *rate* so you can tell later whether a fix changed anything.

**Isolate.** Narrow the cause with discriminating measurements: each measurement should split the remaining hypotheses roughly in half. Swap one thing at a time. Reading RCC_CSR splits "watchdog" from "brown-out" in one register; halting the core splits "where" from "why".

**Confirm.** Two steps, not one. *Fix and the symptom disappears* is necessary but not sufficient, because many fixes hide symptoms. *Unfix and it returns*, or inject the cause deliberately and watch the symptom appear, is what proves causation. With a measured rate, "disappears" means a statistically meaningful period, not "quiet since lunch".

**Prevent.** A **corrective** action fixes the units in front of you. A **preventive** action changes the condition that allowed it: a range check, a test case, a checklist line, a design rule. A write-up with only corrective actions is a repair report, not an RCA.

A common failure of the chain is confusing *correlation* with *cause*: the reboots started after the firmware update, but the update also shipped with a new sensor type and a new batch of boards. "After" is a lead, not a conclusion; the confirm step is what turns it into one.`,
    },
    {
      type: "example",
      title: "Worked example: the moving reboot, done properly",
      body: `**Symptom.** Field units reboot every 2 to 6 hours; rate 0.3 per day per unit. RCC_CSR shows IWDGRSTF on every unit sampled.

**Reproduce.** On the bench, enable logging with timestamps and run for 24 h: two reboots, each preceded by a burst of sensor-log writes.

**Isolate.** Halting on a watchdog pre-warning shows the logging task's stack high-water mark at 100 %. The task's buffer is \`cfg.max_samples × 24\` bytes on the stack; \`cfg.max_samples\` is 64 for the new sensor type and 32 for the old one.

**Confirm.** Setting \`max_samples\` back to 32 on a new-sensor unit: no reboot in 72 h. Setting it to 64 on an old-sensor unit: reboot within 4 h. Causation shown in both directions.

**Root cause.** Stack-allocated buffer sized by an unbounded configuration value; nothing checks the range at load time.

**Corrective.** Move the buffer to a fixed, statically sized allocation; reject configurations above the bound.
**Preventive.** Range-check every configuration field at load; add a unit test for the bound; add a stack high-water check to the release test; add "configuration bounds" to the design review checklist.
**Verification.** 30-day field rate after the release: 0 reboots across 40 units (previously 0.3 per unit-day).`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "root-cause-pick",
        skill: "rca",
        objective: "Separate a root cause from a contributing cause.",
        prompt: `A CAN bus drops frames once a day. Investigation: the transceiver overheats; it overheats because the bus is in a dominant state for long periods; that happens because one node's firmware holds TX dominant when its queue is full; the queue fills because the node's interrupt priority is lower than a logging interrupt that runs for 2 ms. Which is the root cause?`,
        options: [
          { id: "a", text: "The transceiver overheats.", correct: false, feedback: `A symptom one level down. Replacing the transceiver changes nothing about why it is driven dominant.` },
          { id: "b", text: "The node's firmware holds TX dominant when its queue is full.", correct: false, feedback: `Closer, and worth fixing, but it is a consequence of the queue filling. Fixing only this leaves the queue starvation in place to cause the next symptom.` },
          { id: "c", text: "The CAN interrupt priority is below a long-running logging interrupt, so the queue starves.", correct: true, feedback: `Yes. It is a condition you can change (priority assignment and a bound on interrupt duration), fixing it makes the queue starvation impossible rather than rarer, and a preventive rule (no interrupt may run longer than X µs; priorities reviewed) prevents the class.` },
          { id: "d", text: "The engineer who assigned interrupt priorities made a mistake.", correct: false, feedback: `People are never root causes in an RCA; conditions are. The condition is that nothing in the process checked priorities against interrupt durations.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "rca-chain-order",
        skill: "rca",
        objective: "Run the evidence chain in order.",
        prompt: `A sensor node reads 3 °C high about one day in five. Put the investigation steps in the order that builds an acceptable RCA.`,
        items: [
          { id: "rate", text: "Log readings with timestamps against a reference for two weeks to measure the error rate and conditions", why: "Reproduce or capture first, and measure the rate, so later changes can be judged." },
          { id: "categories", text: "List candidate causes by category (design, component, environment, firmware, measurement) and the measurement that would test each", why: "Isolation needs hypotheses that measurements can split; categories stop you skipping one." },
          { id: "measure", text: "Run the discriminating measurements: supply during the error, self-heating, reference drift, conversion code path", why: "Each measurement halves the hypothesis space; evidence replaces opinion." },
          { id: "confirm", text: "Inject the suspected cause (e.g. run the heater load) and watch the error appear; remove it and watch it vanish", why: "Confirmation in both directions is what proves causation rather than correlation." },
          { id: "prevent", text: "Write corrective and preventive actions and define how the fix will be verified in the field", why: "Prevention changes the condition; verification closes the loop with a measured rate." },
        ],
        correctOrder: ["rate", "categories", "measure", "confirm", "prevent"],
        solvedFeedback: `Correct. Reproduce and measure, hypothesise by category, isolate with discriminating measurements, confirm both ways, then prevent and verify.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "preventive-actions",
        skill: "rca",
        objective: "Tell preventive actions from corrective ones.",
        prompt: `The root cause was an unbounded configuration value sizing a stack buffer. Select **every** action that is preventive (changes the condition for the whole class) rather than only corrective.`,
        options: [
          { id: "a", text: "Rework the 40 field units with the corrected firmware.", correct: false, feedback: `Necessary, and corrective: it fixes these units and nothing else.` },
          { id: "b", text: "Range-check every configuration field at load time and reject out-of-range files.", correct: true, feedback: `Preventive. The next doubled parameter is caught before it can size anything.` },
          { id: "c", text: "Add a stack high-water-mark check to the release test and fail the build above 70 %.", correct: true, feedback: `Preventive. A different overflow from a different cause is also caught before release.` },
          { id: "d", text: "Double the logging task's stack size as a safety margin.", correct: false, feedback: `A margin without a bound is the fix that fixed nothing in the scenario. It makes the symptom rarer, not impossible.` },
          { id: "e", text: "Add 'configuration bounds and stack sizing' to the design-review checklist.", correct: true, feedback: `Preventive. It changes the process that let the design through.` },
        ],
        solvedFeedback: `Right. Corrective actions repair instances; preventive actions remove the condition, add detection, or change the process. A review expects at least one of each.`,
      },
    },
    {
      type: "interview",
      questionId: "rca-intermittent",
      intro: `Describe the chain, name the measurements, and say how you confirmed causation in both directions. Interviewers listen for the confirm step; most candidates skip it.`,
    },
    {
      type: "recap",
      summary: `- Symptom → cause → root cause. A root cause is a changeable condition whose fix makes the symptom impossible for the whole class. People are never root causes.
- Five whys stops at the first condition you can change and verify; cause-and-effect categories stop you skipping a branch.
- Evidence chain: reproduce (and measure the rate), isolate with discriminating measurements, confirm by fix-and-unfix or injection, prevent.
- Correlation ("after the update") is a lead, not a conclusion.
- Write-up: symptom and impact, evidence, root cause, corrective and preventive actions, verification with a measured rate.`,
      cards: [
        { id: "rca-1", front: "Three tests for a root cause?", back: "Fixing it makes the symptom impossible (not rarer); it is a condition, not a person; fixing it prevents the whole class, not just this instance." },
        { id: "rca-2", front: "What does the confirm step require?", back: "Causation in both directions: the fix removes the symptom over a meaningful period, and reintroducing or injecting the cause brings it back." },
        { id: "rca-3", front: "Corrective vs preventive action?", back: "Corrective repairs the affected units. Preventive changes the condition, adds detection, or changes the process so the class cannot recur." },
        { id: "rca-4", front: "Why measure the failure rate before fixing?", back: "So 'it stopped' can be judged against the baseline rather than against a few quiet hours; intermittent faults need a measured rate to prove a fix." },
      ],
    },
  ],
};
