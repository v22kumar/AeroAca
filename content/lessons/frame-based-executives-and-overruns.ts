import type { Lesson } from "@/lib/content/schema";

export const frameBasedExecutivesAndOverruns: Lesson = {
  slug: "frame-based-executives-and-overruns",
  moduleId: "real-time",
  format: "arc",
  prerequisites: ["will-it-meet-its-deadline", "isr-to-task-handoff"],
  title: "Frame-based executives: minor frames, rate groups and the frame that overran",
  summary: "How a cyclic executive schedules work in fixed minor and major frames, how rate groups share the frames, how an overrun is detected, and what a shed policy saves and costs. Run a model that injects one slow task and watch the overrun spread.",
  durationMinutes: 18,
  whyItMatters: "Many flight and control computers run a frame-based executive rather than a preemptive kernel, because the schedule can be read, analysed and tested frame by frame. 'What happens when a task overruns its frame?' is a standard question, and a counted, tested policy is the answer reviewers want.",
  objectives: [
    "Explain minor frames, major frames and rate groups, and lay out a schedule that fits its frames.",
    "Compute the margin of each frame from task budgets and spot a fragile one.",
    "Detect an overrun at the frame boundary and trace how it carries into the next frames.",
    "Compare no policy with a shed policy, and say what the shed policy costs.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The cyclic-executive structure (minor and major frames, rate groups, run-to-completion tasks) follows the standard description used in avionics and control software texts. The numbers come from the frame-executive lab, a simplified model that carries unfinished work into the next frame and does not model interrupts or I/O waits; it is a simulation, not a timing measurement of any product.",
  },
  references: [
    { title: "Burns and Wellings, Real-Time Systems and Programming Languages, chapter on cyclic executives", note: "Minor and major cycles, frame sizing, handling overruns." },
    { title: "Lesson: Will it meet its deadline?", note: "Where the task budgets come from." },
    { title: "Lesson: The ISR-to-task handoff", note: "How a timer interrupt starts a frame." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The frame that overran once an hour",
      body: `A flight-control computer runs its main loop in 10 ms frames. For weeks the test rig shows nothing wrong. Then a long soak test shows a small glitch in the actuator command about once an hour: one command is a frame late.

The frame times were all measured. The average frame used 8 ms of 10. The problem frame was a rare one in which a navigation task, handling an unusual input, ran 4 ms longer than its budget. That one overrun pushed the next frame late too.

Nobody had decided in advance what the executive should do when a frame overruns. This lesson is about deciding that on purpose, with a model that makes the overrun visible.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "A timetable instead of a negotiation",
      body: `A railway runs to a **timetable**. Each train has a slot. Nobody argues at the junction about who goes first: the table says.

A frame-based executive is a timetable for software. Time is cut into equal slots. Each slot has a fixed list of jobs, run one after another. Nothing is decided at run time and nothing interrupts a job halfway.

That has two big advantages. You can read the whole schedule on one page and check by adding up that every slot fits. And, because jobs never interrupt each other, they need no locks between them.

The price is rigidity. A job that is too long must be split to fit the slots. And if one job runs over its time, the train behind it is late: the timetable has no way of making the time back.

That last point is the whole subject of this lesson.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Minor frames, major frames and rate groups",
      body: `A hardware timer interrupt starts every **minor frame**, say every 10 ms. Several minor frames make a **major frame**, after which the whole pattern repeats. Four minor frames of 10 ms make a 40 ms major frame.

Tasks that must run at different speeds are put into **rate groups** by choosing which minor frames they appear in:

| Task | Rate | Budget | Runs in minor frames |
|---|---|---|---|
| Control | 100 Hz | 5 ms | 0, 1, 2, 3 |
| Nav | 50 Hz | 3 ms | 0, 2 |
| Log | 25 Hz | 4 ms | 1 |

The **budget** is the task's worst-case execution time. The load of a frame is the sum of the budgets of the tasks in it: frame 0 is 5 + 3 = 8 ms, frame 1 is 5 + 4 = 9 ms, frame 2 is 8 ms, frame 3 is 5 ms. Every frame is at most 10 ms, so the schedule fits.

The **margin** of a frame is 10 minus its load. Frame 1 has a margin of only 1 ms. Remember that number: it decides how an overrun spreads.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "One major frame, drawn as a timetable",
      diagram: "frame-executive",
      alt: "A frame-based executive drawn as a timeline of a major frame divided into equal minor frames, with a high-rate task in every minor frame, a medium-rate task in some, a low-rate task in one, and idle time at the end of each frame.",
      caption: "Each minor frame holds a fixed list of tasks; what is left is idle time. This picture has ten minor frames in a 100 ms major frame; the lab below uses four of 10 ms.",
      body: `Look at the idle gap at the end of each frame. That gap is the margin. A frame with almost no gap is the one most likely to overrun.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Detecting an overrun, and the choices after it",
      body: `An **overrun** happens when a frame's work needs more than the frame length. The executive notices at the frame boundary: the next timer tick arrives and the previous frame has not finished.

Without a policy the unfinished work **carries** into the next frame, which now starts late and has less time. If that frame is also nearly full, it overruns too. The overrun **cascades**.

There are three honest choices.

- **Do nothing**, and let it carry. Cheap, but the delay can spread.
- **Shed** low-rate work in the next frame: drop its low-priority tasks so the frame catches up, and keep the important high-rate tasks on time.
- **Declare a fault**: set a flag, tell the fault manager, and let a higher level reset, degrade or switch channels.

Whatever is chosen, two things are not optional. The overrun must be **counted** and reported, so it is visible in a test. And the policy must be **tested** by injecting an overrun, not assumed to work.

An overrun that is silently absorbed is worse than a loud one: the bug is still there and nobody knows.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: Nav runs 4 ms long, once",
      body: `Use the schedule above. In the second major frame, minor frame 0, Nav takes its 3 ms budget **plus 4 ms**: 7 ms instead of 3.

**With no policy.**

- Frame 0: Control 5 + Nav 7 = **12 ms** needed of 10. Overrun, **2 ms carries** into the next frame.
- Frame 1: carried 2 + Control 5 + Log 4 = **11 ms**. Overrun again, **1 ms carries**.
- Frame 2: carried 1 + Control 5 + Nav 3 = **9 ms**. Fits. The cascade has died out because frame 2 had a margin of 2 ms.
- **Two overrun frames.** Both were late by up to 2 ms.

**With a shed policy** (when a frame starts late, drop the low-rate Log):

- Frame 0: 12 ms, overrun, 2 ms carries.
- Frame 1: carried 2, Control 5, **Log shed**. Needs 7 of 10 ms. The frame **starts 2 ms late**, but finishes.
- Frame 2: back to normal.
- **One overrun frame, one task shed.**

**What did shedding cost?** The Log record for that major frame was never written. That is only acceptable if a requirement says the log may drop a record under overrun, and if the drop is counted.

The model gives these exact numbers in the lab.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "frame-margin-guided",
        skill: "frame-executive",
        objective: "Compute the margin of a frame (guided).",
        prompt: `A minor frame is 10 ms. It runs Control (5 ms budget) and Nav (3 ms budget). How many milliseconds of margin does the frame have?`,
        unit: "ms",
        answer: 2,
        tolerance: 0,
        hints: [
          `Add the budgets of the tasks that run in the frame.`,
          `5 + 3 = 8 ms of work.`,
          `Margin is the frame length minus the work: 10 minus 8.`,
        ],
        solution: `The frame's load is 5 + 3 = 8 ms. Margin = 10 − 8 = **2 ms**. A task that runs more than 2 ms over its budget in this frame will make it overrun.`,
        solvedFeedback: `Right: 2 ms. That is the largest overrun this frame can absorb on its own.`,
        misconceptions: [
          { value: 8, tolerance: 0, feedback: `8 ms is the work in the frame. The margin is what is left of the 10 ms frame: 10 − 8 = 2 ms.` },
          { value: 5, tolerance: 0, feedback: `5 ms is Control's budget alone. Both tasks run in this frame: 10 − (5 + 3) = 2 ms.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "The executive loop and where it spots an overrun",
      intro: `This sketch shows the heart of a frame executive for the schedule above. The timer interrupt only counts ticks; the main loop runs the frame.`,
      language: "c",
      code: `volatile uint32_t ticks;      /* incremented by the 10 ms timer interrupt */
uint32_t overruns;

void executive(void) {
    uint32_t done = 0;
    for (;;) {
        while (ticks == done) { }   /* wait for the next 10 ms tick */
        uint32_t minor = done % 4;
        done++;
        run_control();
        if (minor == 0 || minor == 2) run_nav();
        if (minor == 1) run_log();
        if (ticks != done) overruns++;   /* next tick already came */
    }
}`,
      notes: [
        { lines: "1-2", text: `The interrupt handler does almost nothing: it adds one to \`ticks\`. \`volatile\` is needed because the handler changes it behind the loop's back. \`overruns\` is the counter a test will read.` },
        { lines: "7-9", text: `Wait until a new tick has arrived, then work out which **minor frame** this is. \`done\` counts frames started; modulo 4 gives the position in the major frame.` },
        { lines: "10-12", text: `Run the frame's tasks **one after another, to completion**, by rate group: Control every frame, Nav in frames 0 and 2, Log in frame 1. No locks are needed between them.` },
        { lines: "13", text: `The overrun check. If a **new tick** has already arrived while the frame was still running, \`ticks\` is ahead of \`done\`: the frame ran past its slot. Count it. The loop then starts the next frame at once, late, which is the carry.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: inject one slow task and compare the policies",
      lab: "c-frame-exec",
      body: `This is a **simulation** of the schedule above, run for three major frames. Case 1 has every task within budget. Case 2 makes Nav run 4 ms long once and applies no policy. Case 3 injects the same overrun with the shed policy. Compare the printed overrun and shed counts with the worked example, and find the frame whose margin decided how far the overrun spread.`,
      tryNext: `Make the injected overrun 6 ms instead of 4, and predict, frame by frame, how much each frame carries before you run it. Then move the injection to a different frame. Does a frame with a larger margin stop the cascade sooner?`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "overrun-cascade",
        skill: "frame-executive",
        objective: "Trace an overrun through the frames.",
        prompt: `Use the schedule from the lesson (Control 5 ms every frame, Nav 3 ms in frames 0 and 2, Log 4 ms in frame 1, 10 ms frames). This time Nav in frame 0 runs **6 ms** over its budget, and there is **no policy**. Starting from that frame, how many consecutive minor frames overrun?`,
        unit: "frames",
        answer: 3,
        tolerance: 0,
        solution: `Frame 0: 5 + 3 + 6 = 14 of 10, carries **4**. Frame 1: 4 + 5 + 4 = 13, carries **3**. Frame 2: 3 + 5 + 3 = 11, carries **1**. Frame 3: 1 + 5 = 6, fits. So **3** consecutive frames overrun; frame 3, with a margin of 5 ms, finally absorbs it.`,
        solvedFeedback: `Right: three frames. A larger initial overrun spreads further, and only a frame with enough margin stops it.`,
        misconceptions: [
          { value: 1, tolerance: 0, feedback: `One counts only the frame that was slow. Its unfinished work carries into frame 1 (4 ms), which then needs 13 ms and overruns too, and so on.` },
          { value: 2, tolerance: 0, feedback: `Two is the answer for the 4 ms overrun in the lesson. With 6 ms, frame 2 also needs 3 + 5 + 3 = 11 ms and overruns; frame 3 stops it.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Why shedding is a design decision, not a trick",
      body: `Shedding looks like a free fix. It is a trade, and a reviewer will ask what was traded.

**Something is lost.** The shed task did not run. The Log record for that major frame is gone. That is fine only where a requirement allows it, and never for a task a safety function relies on. Mark which tasks may be shed, in the design.

**It must be visible.** Count each shed and overrun, and put the counters in telemetry. An absorbed fault with no counter looks like a healthy system.

**It does not cure the cause.** One slow Nav input is a symptom. The cause is a worst-case execution time that was never measured for that input.

**Margin is the real protection.** A frame with 1 ms of margin turns any hiccup into a cascade. Balance the load across frames, and split long tasks so no frame is nearly full.

**The model is simplified.** It carries whole milliseconds and ignores interrupts and I/O waits. Real frames have both. Use the model to reason, and measure the real frame times on the target.

And a limit of the whole approach: a frame executive is rigid. Adding a task means redoing the table.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "overrun-policy",
        skill: "frame-executive",
        objective: "Judge overrun policies.",
        prompt: `Select **every** correct statement about overrun handling in a frame-based executive.`,
        options: [
          { id: "a", text: "An overrun must be counted and reported, even when a shed policy absorbs it.", correct: true, feedback: `An absorbed overrun with no counter is invisible, and the cause stays in the system.` },
          { id: "b", text: "A shed policy should drop only tasks the design marks as allowed to be dropped.", correct: true, feedback: `Shedding trades a lost task for time. It is only acceptable where a requirement allows the loss.` },
          { id: "c", text: "A frame with 1 ms of margin is as safe as one with 5 ms, because the average is the same.", correct: false, feedback: `Margin decides how far an overrun spreads. A nearly full frame turns one slow task into a cascade.` },
          { id: "d", text: "Testing the policy means injecting a slow task, as the model does, not just running the normal case.", correct: true, feedback: `A policy that has never been exercised is an assumption.` },
        ],
        solvedFeedback: `Right: count it, shed only what is allowed, keep margin, and test the policy by injecting an overrun.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "frame-overrun-handling",
      intro: `Explain minor and major frames, say how you detect an overrun, what happens next with and without a policy, and what shedding costs.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A main loop driven by a timer tick, with tasks assigned to frames, is the same design in a smaller system; the overrun counter is cheap to add.
- **Aerospace and UAV systems.** Flight-control and mission computers commonly use frame-based schedules; the frame table and its margins are reviewed and appear in the timing analysis.
- **R&D and design.** Choosing the frame length and the rate groups is the first design decision in a deterministic controller.
- **Verification and interviews.** "What happens when a frame overruns?" and "how would you test it?" are common; answer with detection, a policy, a counter and an injected-overrun test.`,
    },
    {
      type: "recap",
      summary: `- A frame executive runs a fixed list of tasks in each timer-driven minor frame; minor frames make a major frame that repeats. Rate groups are chosen by which frames a task appears in.
- Frame load is the sum of the budgets; margin is the frame length minus the load. Low margin makes a frame fragile.
- An overrun is noticed at the frame boundary; unfinished work carries forward and can cascade through frames with little margin.
- Policies: carry on, shed low-rate work, or declare a fault. Always count the overrun and test the policy by injecting one.
- Shedding loses the dropped work, so only allowed tasks may be shed. The model is a simulation; measure real frame times on the target.`,
      cards: [
        { id: "fr-1", front: "What are minor frames, major frames and rate groups?", back: "A timer starts each minor frame; a fixed number of them make a major frame that repeats. Tasks of different rates are put in rate groups by choosing which minor frames they run in." },
        { id: "fr-2", front: "How do you detect a frame overrun?", back: "At the end of the frame's work, check whether the next timer tick has already arrived. If so, the frame ran past its slot: count it and apply the policy." },
        { id: "fr-3", front: "Why does one overrun sometimes cascade?", back: "The unfinished work carries into the next frame, which starts late and has less time. If that frame has little margin it overruns too. A frame with enough margin stops the cascade." },
        { id: "fr-4", front: "What does a shed policy cost?", back: "The dropped task does not run, so its output for that cycle is lost. Only tasks the design allows to be dropped may be shed, and each shed must be counted and reported." },
      ],
    },
  ],
};
