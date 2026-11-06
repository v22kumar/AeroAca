import type { Lesson } from "@/lib/content/schema";

export const votingMonitorsAndFailover: Lesson = {
  slug: "voting-monitors-and-failover",
  moduleId: "redundancy",
  format: "arc",
  prerequisites: ["why-flight-control-is-redundant", "state-machines-that-survive-review"],
  title: "Voting, monitors and failover: mid-value select, miscompare and persistence",
  summary: "How three channels agree on one number: the mid-value vote, the miscompare limit that flags a channel, the persistence counter that isolates it, and the fail-passive state when only two channels remain. Run a simulated voter and read its timeline.",
  durationMinutes: 18,
  whyItMatters: "'What is voted, and what happens when a channel disagrees?' is the question that follows 'draw the architecture'. A voter is small enough to write on a whiteboard, and your answer shows whether you understand detection time, nuisance trips and what the system does when it can no longer decide.",
  objectives: [
    "Compute a mid-value vote and explain why one wild channel cannot move it.",
    "Explain the miscompare limit and the persistence count, and the trade-off between them.",
    "Read a voter timeline: first flag, isolation frame, worst voted error and fail-passive entry.",
    "State what a voter cannot do: detect a fault inside its limit, or choose between two channels.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Mid-value selection, miscompare limits, persistence (confirmation) counts, isolation and the fail-passive state with two channels remaining are standard techniques in fault-tolerant control and are described here in general terms. The lab is a deterministic SIMULATION in integer tenths with synthetic signals and invented limits; it is a teaching model, not an algorithm from any real aircraft.",
  },
  references: [
    { title: "Storey, Safety-Critical Computer Systems", note: "Voting and fault masking." },
    { title: "SAE ARP4754A and ARP4761", note: "Failure conditions and common cause analysis that set the required behaviour." },
    { title: "Lesson: Why flight control is redundant", note: "Channels, fail-passive and common-mode faults." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The log says B went wrong at frame 6, but flagged it at 7",
      body: `Three channels measure the same signal. In a simulated test, a **fault injection** freezes channel B at frame 6: it keeps repeating its last value while the real signal keeps rising. The voter output stays correct throughout, never more than 0.1 unit from the truth.

But the log does not flag B until frame 7, and B is not isolated until frame 9. A colleague asks: "Why the delay? Why did it not catch B at frame 6, and why did it wait three more frames to remove it?"

Both delays are deliberate. Each is a decision with a price, and each is something you will be asked to justify. This lesson builds the voter step by step so that you can.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The middle witness, and not firing someone for one bad day",
      body: `Three witnesses describe how tall a person is: 178 cm, 179 cm and 240 cm. You do not average them. You take the **middle** answer, 179. The outlier can be anything, and the middle ignores it.

Now the witness who said 240 gets a name on the list: "disagreed once". One bad answer is not enough to throw them out, they may have misheard. But if they disagree three times in a row, they are dismissed, and from then on you ask the other two.

Two small ideas, each with a reason:

- The **middle value** makes the output immune to one wild input.
- A **count of repeated disagreements** stops one noisy moment from removing a healthy witness.

The price is time. The witness who is quietly wrong, but only a little, is not caught at once, and the dismissal takes three rounds.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Mid-value select, miscompare and persistence",
      body: `Each frame, every channel supplies its value. The voter does three things.

**1. Vote.** With three healthy channels, output the **mid-value**: sort the three and take the middle one. A single channel, however wrong, cannot be the middle.

**2. Compare.** Each channel's value is compared with the voted value. If the difference is greater than the **miscompare limit**, the channel is **flagged** for this frame. A missing value (late data) is flagged too.

**3. Confirm.** A **persistence** counter counts consecutive flagged frames for each channel. When it reaches the persistence count, the channel is **isolated**: ignored from then on. One good frame resets the counter.

The numbers come from engineering, not taste, and from the **hazard analysis** that says how quickly a fault must be removed:

- The miscompare limit must be **larger than normal disagreement**: sensor accuracy plus differences in sampling time. Too small and healthy channels are flagged.
- The persistence must be **long enough** to ignore a transient, and **short enough** that a real fault does not stay in the loop.

The total time to isolate a fault is the time for its error to exceed the limit, plus the persistence.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Two channels left: detect, but not decide",
      body: `After one channel is isolated, two remain. The voter can still **average** them, or take either, as long as they agree within the limit.

But if the two now disagree, the voter faces the duplex problem: it knows something is wrong and cannot say which channel is at fault. Choosing one would be a guess.

The honest response is the **fail-passive** state. The voter:

- stops updating its output, **holding** the last good value;
- reports the disagreement upward, so the rest of the system can act;
- leaves the decision to something with more information: a pilot, another system, or a defined safe-state action.

Note what holding does and does not do. Holding the last good value is safe for a short time on a slowly changing signal. It is not safe for long: the real signal keeps moving, and the held value drifts further from the truth every frame.

So fail-passive is a **bridge**, not a destination. The architecture must decide, in advance, what happens next.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "The two core pieces of the voter",
      intro: `The lab's voter, reduced to its two essential parts: the mid-value function and the flag-and-isolate counter. Values are integer tenths so the output is exactly reproducible.`,
      language: "c",
      code: `static int median3(int a, int b, int c) {
    if ((a >= b && a <= c) || (a <= b && a >= c)) return a;
    if ((b >= a && b <= c) || (b <= a && b >= c)) return b;
    return c;
}

bool flagged = !have[c] || abs(val[c] - voted) > MISCOMPARE_LIMIT;
if (flagged) {
    ch[c].flagged_run++;
    if (ch[c].flagged_run >= PERSISTENCE) ch[c].isolated = true;
} else {
    ch[c].flagged_run = 0;
}`,
      notes: [
        { lines: "1-5", text: `**Mid-value of three.** The first test asks whether \`a\` lies between the other two, in either order. The second does the same for \`b\`. If neither is the middle, it must be \`c\`. No sorting and no averaging, so one wild value cannot pull the result.` },
        { lines: "7", text: `**Flag.** A channel is flagged if its data is missing, or it differs from the **voted** value by more than the miscompare limit. Comparing with the vote, not with another channel, means the healthy majority is the reference.` },
        { lines: "8-10", text: `**Persistence.** Each flagged frame adds one to the channel's run. When the run reaches the persistence count, the channel is isolated.` },
        { lines: "11-13", text: `**Reset.** A frame that is not flagged sets the run to zero, so only **consecutive** flagged frames count. A fault that comes and goes every other frame never reaches the count.` },
      ],
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: channel B frozen, frame by frame",
      body: `The settings: miscompare limit **5** tenths, persistence **3** frames. The true signal rises by 5 each frame. Channel B freezes at 126 from frame 6.

| Frame | A | B | C | Voted (mid-value) | B minus voted | Result |
|---|---|---|---|---|---|---|
| 6 | 130 | 126 | 129 | 129 | −3 | within limit, not flagged |
| 7 | 135 | 126 | 134 | 134 | −8 | flagged (1 of 3) |
| 8 | 140 | 126 | 139 | 139 | −13 | flagged (2 of 3) |
| 9 | 145 | 126 | 144 | 144 | −18 | flagged (3 of 3), **isolated** |

**Why not flagged at frame 6?** The frozen value was only 3 below the vote, inside the limit of 5. A frozen channel is not wrong until the signal has moved away from it, by more than the limit.

**Why three more frames?** The persistence count. Frames 7, 8 and 9 are flagged and the third isolates B.

**What did the output do?** It stayed within 1 tenth of the truth the whole time: the two good channels held the middle.

**So detection delay is the limit plus the persistence.** Raising either makes the voter calmer and the fault last longer.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "midvalue-guided",
        skill: "voting",
        objective: "Compute a mid-value vote (guided).",
        prompt: `Three channels report 130, 126 and 129 tenths. What does the mid-value voter output?`,
        unit: "tenths",
        answer: 129,
        tolerance: 0,
        hints: [
          `Put the three values in order from smallest to largest.`,
          `The order is 126, 129, 130.`,
          `The middle one is the output. It is neither the smallest nor the largest.`,
        ],
        solution: `Sorted: 126, 129, 130. The middle is **129**. The output is not the average (128.3) and not the biggest or smallest; it is a value one of the channels actually reported.`,
        solvedFeedback: `Right: 129. This is frame 6 of the example: the frozen B is not yet far enough to matter, and the vote is the middle.`,
        misconceptions: [
          { value: 128.3, tolerance: 0.2, feedback: `That is the average. A mid-value voter takes the middle reported value, so one wild channel cannot pull it; the average would move.` },
          { value: 130, tolerance: 0, feedback: `130 is the largest. The voter takes the middle value, which is 129.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: four fault scenarios (a simulation)",
      lab: "c-voter",
      body: `The program is a **simulation** with a synthetic signal that rises 5 tenths per frame. Channels have small fixed errors (0, +1, −1 tenth). It runs four scenarios: B stuck from frame 6, C late from frame 5, A corrupted by +8.0 from frame 4, and finally B stuck from frame 3 followed by C corrupted from frame 11.

Read the notes column and the summary line under each. Notice that in scenario 2 the voted error is zero and that scenario 4 ends in FAIL-PASSIVE.`,
      tryNext: `Change PERSISTENCE from 3 to 4 and MISCOMPARE_LIMIT from 5 to 10, run again, and predict the isolation frame of channel B in scenario 1 before you look. Then try a limit of 1: which healthy channel gets flagged, and why?`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "persistence-four",
        skill: "voting",
        objective: "Predict an isolation frame from the settings.",
        prompt: `In scenario 1 (B frozen from frame 6, first flagged at frame 7) the persistence count is raised from 3 to **4**, with the miscompare limit unchanged. At which frame is channel B isolated?`,
        unit: "frame",
        answer: 10,
        tolerance: 0,
        solution: `B is flagged on frames 7, 8, 9 and 10 because it keeps drifting further from the vote. With persistence 4, the fourth consecutive flagged frame, **frame 10**, isolates it. Each extra confirmation frame delays isolation by one frame.`,
        solvedFeedback: `Right: frame 10. A larger persistence calms the voter and lengthens the fault's stay in the loop by exactly one frame per step.`,
        misconceptions: [
          { value: 9, tolerance: 0, feedback: `Frame 9 is the answer for persistence 3. With persistence 4 you need one more consecutive flagged frame: 10.` },
          { value: 11, tolerance: 0, feedback: `The first flagged frame is 7, and isolation occurs on the fourth flagged frame, 7, 8, 9, 10. Not 11.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What a voter cannot do",
      body: `A voter is simple and still has limits, and a review will find them.

**It cannot see faults inside the limit.** A channel that drifts by 3 tenths per frame is never flagged if the limit is 5 and the others drift with it. Slow drift is not caught by a miscompare check; a plausibility check or another monitor must catch it.

**It cannot choose between two.** Two channels that disagree give fail-passive and nothing more, as scenario 4 showed. The final voted error there reached 26 tenths because the held value aged while the signal moved on.

**Real channels do not sample at the same instant.** Skew between channels creates apparent disagreement when the signal changes fast, so limits must allow for the dynamics, not only the sensor accuracy.

**The voter is a single point of failure.** It needs its own protection: simplicity, built-in tests, or duplication with comparison.

**Persistence can hide an intermittent fault.** If the fault alternates good and bad frames, the run resets and the channel is never isolated. Each such failure mode in the FMEA needs its own test case.

This lab is a **simulation** with invented numbers. A real design derives limits from sensor and timing analysis and proves them in test.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "voter-statements",
        skill: "voting",
        objective: "Judge statements about voter behaviour.",
        prompt: `Select **every** statement that is correct.`,
        options: [
          { id: "a", text: "A channel stuck at its last value is only flagged once the real signal has moved away from it by more than the miscompare limit.", correct: true, feedback: `Right. Until then its value is still within the limit of the vote, which is why scenario 1 flagged B one frame after it froze.` },
          { id: "b", text: "Raising the persistence count makes nuisance isolation of healthy channels less likely, at the cost of keeping a real fault in the loop for longer.", correct: true, feedback: `Right. That is the trade-off between a calmer voter and a longer exposure to bad data.` },
          { id: "c", text: "With two channels left that disagree, the voter should output the average so the system can keep going.", correct: false, feedback: `The average of a good and a bad value is wrong by half the error and hides the fault. The correct response is fail-passive: hold and report.` },
          { id: "d", text: "A miscompare limit of zero gives the safest voter because any difference is caught.", correct: false, feedback: `Healthy channels always differ a little, from sensor error and sampling time. A limit of zero flags healthy channels and isolates them.` },
        ],
        solvedFeedback: `Right: stuck detection waits for drift beyond the limit; persistence is a calm-versus-exposure trade-off; two disagreeing channels give fail-passive; and the limit must exceed normal disagreement.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "voter-miscompare-and-isolation",
      intro: `Explain what is voted, how a channel gets flagged and isolated, and what the system does when two channels disagree.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A voter or a plausibility monitor is a small, testable function with a clear requirement; counters with reset-on-good are a common pattern in any fault-detection code.
- **Aerospace and UAV systems.** Cross-channel monitors, sensor voting and actuator comparison appear in flight control, engine control and air data systems.
- **R&D and design.** Choosing the limit and the persistence from sensor accuracy and dynamics is a design calculation, defended in review.
- **Verification and interviews.** "Walk me through the voter and the failover" is a standard question; the timeline, with the flag and isolation frames, is a convincing answer.`,
    },
    {
      type: "recap",
      summary: `- The mid-value of three channels ignores one wild channel; averaging would not.
- A channel is flagged when it differs from the voted value by more than the miscompare limit or its data is missing; consecutive flagged frames up to the persistence count isolate it, and one good frame resets the count.
- Detection time is roughly the time for the error to exceed the limit plus the persistence count; raising either calms the voter and lengthens exposure.
- With two channels left that disagree, the voter cannot choose: fail-passive, hold the last good value and report.
- A voter cannot see faults inside its limit, drifts with held values, and is itself a single point of failure.`,
      cards: [
        { id: "vot-1", front: "Why take the mid-value and not the average of three channels?", back: "The middle reported value cannot be moved by one wild channel; an average is pulled by it. The output is always a value that some channel actually reported." },
        { id: "vot-2", front: "What do the miscompare limit and the persistence count each do?", back: "The limit decides how far a channel may differ from the vote before it is flagged for a frame; the persistence count decides how many consecutive flagged frames isolate it. One good frame resets the count." },
        { id: "vot-3", front: "What does a voter do with only two channels that disagree?", back: "It cannot tell which is right, so it goes fail-passive: holds the last good value, reports the disagreement, and leaves the decision to the wider system." },
        { id: "vot-4", front: "Name two things a voter cannot detect.", back: "Faults that stay inside the miscompare limit (slow drift, small stuck-at against a slowly moving signal) and common-mode faults where all channels are wrong in the same way." },
      ],
    },
  ],
};
