import type { Lesson } from "@/lib/content/schema";

export const fromFmeaToFaultInjection: Lesson = {
  slug: "from-fmea-to-fault-injection",
  moduleId: "hil-fault",
  format: "arc",
  prerequisites: ["fmea-for-a-small-embedded-product", "hil-architecture-and-bench-design", "telemetry-packets-and-parsing-with-struct"],
  title: "From an FMEA to fault injection: prove the monitor can see the failure",
  summary: "Turn each failure mode in an FMEA into one injected fault, one expected detection and one recorded verdict. A simulated telemetry link and its monitor, run in a lab, show six faults caught and one, a slow drift, that is a finding.",
  durationMinutes: 17,
  whyItMatters: "'How would you inject a late frame?' and 'what did you inject?' are the questions that separate people who have tested failover from people who have watched it work. The honest answer includes a failure the monitor missed, and what you did about it.",
  objectives: [
    "Derive a fault-injection test from an FMEA row: failure mode, injected fault, expected detection, budget and verdict.",
    "Name the four families of link fault: corrupt, late or lost, stuck, and babbling or replayed.",
    "Build an injector that applies exactly one fault, starts from a clean baseline and asserts on a specific detection.",
    "Report a failure mode the monitor cannot detect as a finding, and say what the options are.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The method (FMEA failure mode to injected fault, expected detection and detection-time budget) is standard fault-injection practice. The link, the monitor, the frame format and every number come from a SIMULATED model written for this lesson, run by the lab in this lesson and reproduced exactly: seven failure modes, six detected, one finding. No real equipment or programme is described.",
  },
  references: [
    { title: "IEC 60812, analysis techniques for system reliability: FMEA", note: "Failure modes, effects and detection." },
    { title: "SAE ARP4761, safety assessment guidelines", note: "Where failure conditions and detection claims come from." },
    { title: "Lesson: FMEA for a small embedded product", note: "The table this lesson turns into tests." },
    { title: "Lesson: Telemetry packets and parsing", note: "The sequence number and CRC the monitor checks." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "'Show me the test for that row'",
      body: `A review is going through an FMEA for a sensor link. Row 6 says: *Failure mode: sensor value frozen. Detection: the monitor flags a value that does not change for four frames.* The severity is high, and the occurrence is low.

The reviewer asks a simple question: "Which test shows the monitor actually does that?"

Silence. The monitor was written, the row was written, and nobody ever froze a value to see what happened. Perhaps it works. Perhaps the detection counts the wrong thing, or the threshold is never reached.

An unexercised detection is a hope. A fault-injection test turns it into evidence, and sometimes the evidence says the monitor is blind.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The smoke alarm you never tested",
      body: `A smoke alarm on the ceiling shows a green light. That tells you it has power. It does not tell you it will sound when there is smoke.

The only way to know is to press the test button, or to hold a small smoke source under it, and listen. The test is not the alarm. It is a **deliberate, controlled fault** that proves the alarm can see it.

A monitor in a system is the same. A green status means the code runs. It does not mean the code **recognises** the failures it is claimed to recognise.

So for every failure the monitor is meant to catch, you create exactly that failure on purpose, once, in a known place, and check that the alarm sounds, and how soon.

If the alarm stays quiet, you have learned something valuable and cheap: the failure would have gone unnoticed in service too.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "One FMEA row, one test, four fields",
      body: `A **failure mode and effects analysis** lists the ways a part can fail, what each one does and how it would be **detected**. The detection column is a **claim**. Fault injection checks the claim.

Each row becomes a test with four fields:

1. **Injected fault.** What you do to the link, exactly: flip one bit, drop one frame, delay one by 40 ms, freeze the value.
2. **Expected detection.** The specific event the monitor must raise, such as a bad CRC or a sequence gap.
3. **Budget.** How soon: within one frame, within four.
4. **Verdict.** PASS if the expected event is raised in time, FINDING if it is not.

Faults on a link fall into four families:

- **Corrupt**: a bit flips, a CRC fails.
- **Late or lost**: a frame is missing or arrives after its time.
- **Stuck**: the value freezes, though frames still arrive.
- **Babbling or replayed**: a sender talks wrongly, or repeats an old valid frame.

Start from the FMEA, not from what is easy to inject.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "From failure mode to a recorded verdict",
      diagram: "fault-injection-flow",
      alt: "Flow from an FMEA failure mode, to an injected fault, to the expected detection, to the observed result in the log, to a pass or fail verdict with the detection time.",
      caption: "Failure mode, injected fault, expected detection, observed result, verdict. Every box is recorded, including the time of detection.",
      body: `Read the flow left to right as one test. The last box is the one a reviewer opens: it holds the observed detection time, not just a tick.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: two rows from a simulated link",
      body: `The simulated sender sends one frame every **10 ms**: a sequence number, a value and a CRC. The monitor checks every frame. The fault is injected at **frame 10**.

**Row A: bit flip in transit.** Inject: flip one bit of frame 10. Expected detection: **BAD_CRC**, within **1** frame. Observed: BAD_CRC at frame 10, which is 0 frames after the fault. Verdict: **PASS**.

**Row B: sensor value frozen.** Inject: from frame 10, keep sending the value that frame 10 carried, with fresh sequence numbers and valid CRCs. Expected: **STUCK**, within **4** frames. Observed: STUCK at frame 13, 3 frames after the fault. Verdict: **PASS**.

**Why 3 and not 4?** Frames 10, 11, 12 and 13 hold the same value. The monitor raises STUCK when it has seen the same value four times in a row, which happens at the fourth frame, frame 13.

**Detection time.** 3 frames at 10 ms each is **30 ms** after the fault began, inside the 40 ms budget.

Notice what the test does **not** do. It does not accept "some event was raised". It asserts the specific event the FMEA row claims.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "detect-time-guided",
        skill: "fault-injection",
        objective: "Convert a detection frame into a detection time (guided).",
        prompt: `A fault is injected at frame 10 on a link that sends one frame every 10 ms. The monitor raises the expected event at frame 13. How many milliseconds after the fault began was it detected?`,
        unit: "ms",
        answer: 30,
        tolerance: 0.5,
        hints: [
          `Detection time is the number of frames between the fault and the detection, times the frame period.`,
          `Frames between 10 and 13 is 13 minus 10.`,
          `3 frames times 10 ms.`,
        ],
        solution: `13 − 10 = 3 frames after the fault, and each frame is 10 ms: 3 × 10 = **30 ms**. The test reports the delay, not only that it happened, because the FMEA row has a budget to check it against.`,
        solvedFeedback: `Right: 30 ms. The same calculation turns every row of the table into a detection time you can compare with its budget.`,
        misconceptions: [
          { value: 130, tolerance: 0.5, feedback: `130 ms is the time since the start of the run (frame 13 at 10 ms each). The detection time is measured from the moment the fault began, frame 10: 3 frames, 30 ms.` },
          { value: 40, tolerance: 0.5, feedback: `40 ms counts four frames, 10 to 13 inclusive. The fault began at frame 10, so detection at frame 13 is 3 frames later: 30 ms.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: seven failure modes, one injector",
      lab: "py-fault-inject",
      body: `A simulated sender, a monitor and an injector, all in plain Python. The table has seven FMEA-style rows. For each, the injector applies exactly one fault, and the script prints the expected event, when it was detected and a verdict. First it runs once with **no** fault and insists on zero events. Look at the last row of the table.`,
      tryNext: `Add an eighth row of your own, for example a value that jumps by a fixed amount and stays there. Predict which monitor event, if any, will catch it before you run it. Then change the stuck-detection count from 4 to 6 and see which row's verdict changes, and why a budget and a threshold must agree.`,
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "Building an injector that a reviewer can trust",
      body: `Four habits make the difference between a test and a demonstration.

**One fault at a time.** Inject exactly one fault, at a known frame. If two things go wrong at once you cannot say which one the monitor saw.

**A clean baseline first.** Run the same scenario with **no** fault and require **zero** events. If the clean run raises an event, the monitor has false alarms and every later PASS means less.

**Assert the specific event.** The test says "BAD_CRC within 1 frame", not "something was reported". A monitor that raises SEQ_GAP for everything would pass the weak version.

**Record the time.** Log the frame or time of injection and of detection, so the budget is checked, not assumed.

Put the fault in the right place. A fault on the wire is a different test from a fault in the sender's software, and a fault inserted by a **fault-insertion unit** on a real rig is different again. Say which one you did.

Finally, keep the table beside the code: row, fault, expected event, budget. A reader should see the FMEA claim and the test side by side.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "weak-injection-tests",
        skill: "fault-injection",
        objective: "Spot the weaknesses in a fault-injection test.",
        prompt: `A colleague's test injects faults and prints PASS. Select **every** feature that makes the test weak.`,
        options: [
          { id: "a", text: "It passes if the monitor raises **any** event after the injection.", correct: true, feedback: `Weak: a monitor that reports an unrelated event would pass. The test must assert the specific event the FMEA row claims.` },
          { id: "b", text: "It never runs the scenario without a fault, so the false-alarm rate is unknown.", correct: true, feedback: `Weak: a monitor that complains about clean data makes every PASS meaningless. A clean baseline with zero events comes first.` },
          { id: "c", text: "It injects a bit flip, a lost frame and a late frame all in the same run.", correct: true, feedback: `Weak: with three faults at once, the monitor's events cannot be matched to the faults. One fault at a time.` },
          { id: "d", text: "It records the frame at which the fault was injected and the frame of detection.", correct: false, feedback: `That is a strength, not a weakness: it lets the detection time be compared with the budget.` },
        ],
        solvedFeedback: `Right: assert the specific event, start from a clean baseline, inject one fault at a time, and record both times.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "A finding is the test doing its job",
      body: `In the lab, six of seven modes are detected. The seventh, a **slow drift** that stays inside the valid range, is not. The monitor reported nothing.

That is not a failed test. The test worked: it showed a failure mode the monitor cannot see. It is reported as a **finding**, not hidden or reworded.

What can a team do with a finding?

- **Add a detection**, for example a rate-of-change check, or a comparison with a second sensor.
- **Accept it with a reason**, if the effect is minor or another mechanism covers it, and write the reason down.
- **Change the FMEA**, so the detection column no longer claims what is not true.

What it must **not** do: loosen the test, widen the budget or retune the threshold until the row passes.

Three more limits to state. A passing table covers only the modes in the FMEA, so a missing row is a missing test. Some faults, such as a valid frame replayed, look healthy at one layer and are caught at another, here by the sequence number. And a finding on a simulation says the **method** works; the same table is run again on the real link.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "drift-response",
        skill: "fault-injection",
        objective: "Choose the correct response to a failure mode the monitor cannot detect.",
        prompt: `Your injection table shows "slow drift, still in range" is **not detected**. The FMEA row claims it is detected by the range check. What is the right response?`,
        options: [
          { id: "a", text: "Report it as a finding, then either add a detection that can see it (such as a rate-of-change or cross-channel check), or revise the FMEA claim with a written justification.", correct: true, feedback: `Right. The evidence contradicts the claim, so either the system or the claim changes, and the record shows which and why.` },
          { id: "b", text: "Narrow the test so the drift ends inside a range the monitor checks, and mark it PASS.", correct: false, feedback: `That tunes the test to pass. The failure mode is real; a range check cannot see a value that is still in range, so the claim is wrong.` },
          { id: "c", text: "Drop the row: nobody has seen a drift on the real sensor.", correct: false, feedback: `Absence of observation is not absence of the failure mode. The FMEA row exists because the mode is credible; removing it hides the gap.` },
          { id: "d", text: "Widen the detection budget until the monitor eventually notices.", correct: false, feedback: `If the monitor never raises the event, no budget is long enough. The budget comes from the effect on the system, not from the monitor's convenience.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "fmea-to-fault-injection-test-plan",
      intro: `You are given an FMEA with seven failure modes for a telemetry link. Explain how you would test its detections, and what you would do with one that fails.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A monitor you write, such as a CRC check, a timeout or a plausibility check, is only finished when an injected fault has made it fire.
- **Aerospace and UAV systems.** Cross-channel links and bus monitors are verified with exactly this table: one row per failure mode, one injected fault, one recorded detection time.
- **R&D and design.** Writing the detection column of an FMEA honestly is a design task; knowing it will be tested makes the claims more careful.
- **Verification and interviews.** "What did you inject, how did you know it was detected and how fast?" is the standard follow-up to any claim of fault testing.`,
    },
    {
      type: "recap",
      summary: `- Each FMEA row becomes a fault-injection test: injected fault, expected detection, budget and verdict.
- Link faults fall into four families: corrupt, late or lost, stuck, and babbling or replayed.
- A trustworthy injector injects one fault at a time, starts from a clean baseline with zero events, asserts the specific expected event and records the detection time.
- A failure mode the monitor cannot detect is a finding: add a detection or revise the claim; never tune the test until it passes.
- In the simulated link, six of seven modes were detected; the slow drift was a finding.`,
      cards: [
        { id: "fmeafi-1", front: "What are the four fields of a fault-injection test derived from an FMEA row?", back: "The injected fault (exactly what you do), the expected detection (a specific event), the budget (how soon) and the verdict (PASS if raised in time, otherwise a FINDING)." },
        { id: "fmeafi-2", front: "Why run a clean baseline before injecting?", back: "To prove the monitor raises zero events on healthy data. A monitor with false alarms makes every later PASS meaningless." },
        { id: "fmeafi-3", front: "Why assert a specific event rather than any event?", back: "A monitor that raises the wrong or a generic event would pass the weak test. The FMEA row claims a particular detection, and that is what the test must check." },
        { id: "fmeafi-4", front: "What do you do when injection shows a failure mode is not detected?", back: "Report it as a finding, then add a detection that can see it or revise the FMEA claim with a written reason. Never loosen the test, widen the budget or retune the threshold to get a pass." },
      ],
    },
  ],
};
