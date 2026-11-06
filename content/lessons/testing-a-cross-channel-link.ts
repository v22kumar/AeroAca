import type { Lesson } from "@/lib/content/schema";

export const testingACrossChannelLink: Lesson = {
  slug: "testing-a-cross-channel-link",
  moduleId: "redundancy",
  format: "arc",
  prerequisites: ["voting-monitors-and-failover", "serial-automation-and-test-logs"],
  title: "Testing a cross-channel link: integrity, latency, dropout, failover and frame alignment",
  summary: "How to plan and run the tests that show a link between redundant channels is trustworthy: what to check on every frame, how to build a fault matrix from the failure modes, how to keep channels aligned in time, and why the link tests are not the same as the voter tests. Includes a simulated injector.",
  durationMinutes: 18,
  whyItMatters: "'How did you test the cross-channel link?' is a standard question for anyone who has worked on redundant systems. A pulled cable is not an answer. A matrix of faults, expected detections and recorded results is, and it is something you can build yourself.",
  objectives: [
    "List what must be checked on every frame of a cross-channel link: integrity, freshness, order and plausibility.",
    "Explain frame alignment and start-up synchronisation and why compared values must belong to the same frame.",
    "Build a fault matrix: failure mode, injection, expected detection, expected response and pass criterion.",
    "Explain what link-level checks cannot catch and where the cross-channel comparison takes over.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Per-frame integrity (CRC), sequence numbers, timeouts, plausibility checks, frame alignment and failover tests are described in general terms drawn from standard fault-tolerant system practice and FMEA-driven testing. The lab is a SIMULATION: a synthetic link, an invented monitor and invented limits, not any real cross-channel link or protocol.",
  },
  references: [
    { title: "Lesson: Voting, monitors and failover", note: "The voter that consumes this link's data." },
    { title: "Lesson: RS-422, RS-485 and framed serial with CRC", note: "Framing and CRC used by the link." },
    { title: "SAE ARP4761, Safety assessment process", note: "Failure modes that drive the fault matrix." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "'We pulled the cable and it failed over'",
      body: `A test engineer reports on a cross-channel link between two flight computers: "Pulled the cable during the run, channel B was isolated, the system carried on. Link tested."

A reviewer asks five questions. What if one bit flips in a frame? What if a frame arrives late, not never? What if the sender replays an old frame? What if the two channels run one frame apart? What if the cable is only unplugged for two frames?

None of those was tested. The link may well be fine, but the report cannot say so. A cable pull exercises exactly one failure mode, and the loudest one.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Three questions for every frame",
      body: `Imagine you receive a postcard from a friend every morning. Before you believe it, you ask three things.

**Is it intact?** Is the writing readable, or smudged and altered? A damaged postcard cannot be trusted, even if it looks plausible.

**Is it fresh?** Is today's postcard the one that arrived, or is the mail carrier delivering yesterday's again? Is it late?

**Is it in step?** Does it describe the same morning as the one you are looking at, or are you comparing your Monday with their Tuesday?

A cross-channel link carries the other channel's data, and the voter will use it. So each frame must answer all three before any value is voted: intact, fresh and in step.

A fourth, softer question follows: does the number make sense at all? That is a plausibility check, separate from the link.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "What the link checks, and which fault each catches",
      body: `Each question has a mechanism and a failure mode it catches.

| Check | Question | Catches |
|---|---|---|
| **CRC** | intact? | bit errors in transit |
| **Sequence number** | fresh and complete? | lost frames, repeated old frames, out-of-order frames |
| **Timeout** | on time? | late or missing frames |
| **Plausibility** | sensible? | out-of-range values with a valid CRC |
| **Frame number or timestamp** | in step? | misaligned channels |

Each mechanism has a blind spot, and that is why several are used together.

- A CRC says nothing about **freshness**: an old valid frame replayed forever has a perfect CRC.
- A sequence number says nothing about **intact data** unless the CRC covers it.
- A plausibility check cannot catch a **wrong but plausible** value.

The response matters as much as the detection. A single bad frame might be skipped, a run of bad frames flagged, a long silence declared a dropout, and each of those is a separate requirement with its own test.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Frame alignment and start-up",
      body: `Two flight computers each have their own clock. Left alone, the clocks drift, and the channels slide out of step. Compare channel A's frame 100 with channel B's frame 101 and a moving signal looks like a fault.

So redundant channels are **synchronised**. A common method: each channel sends a frame marker with its sequence number, and each adjusts its own frame start to follow the others within an allowed skew.

Rules a test plan checks:

- **Compare like with like.** A vote uses values from the same frame number, not whatever arrived last.
- **Skew is bounded.** The allowed offset between channels is a requirement, and a test measures it.
- **Start-up has a rule.** Channels power up at different times. Each waits a bounded time for the others, then continues alone or inhibits, as the design says.
- **Re-joining has a rule.** A channel that resets must re-synchronise before it is trusted again. Being trusted too early is a hazard.

Alignment faults are quiet: the data looks healthy and the vote still drifts.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "From a failure mode to a recorded test",
      diagram: "fault-injection-flow",
      alt: "Flow from an FMEA failure mode to an injected fault, the expected detection, the observed result and the verdict and record.",
      caption: "Each test begins with a failure mode and ends with a recorded verdict, including how long detection took.",
      body: `Read it left to right. The expected detection is written **before** the fault is injected, so the observed result is compared with a prediction, not explained afterwards.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: a fault matrix for one link",
      body: `A simulated link sends a frame every **10 ms**. The monitor declares a frame late if it arrives more than **25 ms** after the previous one. Channel B sends to channel A.

| # | Failure mode | Injection | Expected detection | Expected response |
|---|---|---|---|---|
| 1 | Bit error | flip one bit of one frame | bad CRC on that frame | frame discarded, counted |
| 2 | Lost frame | skip one frame | sequence gap of one | gap counted |
| 3 | Late frame | delay one frame by 40 ms | late event on that frame | flagged, not used |
| 4 | Stale replay | repeat an old valid frame | sequence error | flagged, not used |
| 5 | Out of range | send 5000, valid CRC | range event | flagged |
| 6 | Frozen value | repeat one value for 4 frames | stuck event within 4 frames | channel flagged |
| 7 | Dropout | stop for 3 frames | late events, then persistence | channel isolated after the persistence count |

**Steps.** Row 1: the CRC is the only check that can see a flipped bit. Row 4: the CRC is **valid**, so only the sequence number can catch it. Row 7: one lost frame must **not** isolate the channel, only a run does.

**Pass criteria** are numbers: detected within N frames, isolated after M, the voted output never beyond a stated error.

**Record** each row's result with the build used. A row without a recorded result did not happen.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "which-check-guided",
        skill: "link-testing",
        objective: "Choose the check that catches a replayed frame (guided).",
        prompt: `The sender replays an old frame forever. Each replayed frame was valid when first sent, so its CRC is correct and its value is in range. Which check catches it?`,
        hints: [
          `The CRC and the range check both pass. What does a replayed frame lack that a new one has?`,
          `A new frame has a counter that has moved on by one.`,
          `Look for the check that compares successive frames, not one frame alone.`,
        ],
        options: [
          { id: "a", text: "The CRC, because the frame is old.", correct: false, feedback: `The CRC was computed when the frame was sent and is still correct. It says the bytes are intact, not that the frame is fresh.` },
          { id: "b", text: "The sequence number: the frame's counter does not follow the previous frame's.", correct: true, feedback: `Right. A repeated old frame carries an old counter, so the receiver sees a gap or repeat. Intact and fresh are different questions.` },
          { id: "c", text: "The range check, because old values are out of range.", correct: false, feedback: `An old frame was valid and in range when it was sent; it is still in range now. Range cannot see age.` },
          { id: "d", text: "No check can catch it; it needs a person to look at the data.", correct: false, feedback: `The sequence number exists for exactly this. Automated detection of replays is cheap and standard.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: inject seven faults into a simulated link",
      lab: "py-fault-inject",
      body: `A **simulation**: a synthetic link, a monitor that checks CRC, sequence, timeout, range and a stuck value, and an injector that adds exactly one fault at frame 10. Each row of an FMEA-style table says which event must fire and within how many frames.

Seven failure modes go in. Six are detected within their budgets and one is reported as a **finding**, the slow drift that stays in range. Read the last verdict carefully: the lab prints it rather than hiding it.`,
      tryNext: `Add an eighth failure mode of your own, for example a burst of three corrupt frames, and write its expected event and budget before you run it. Then change STUCK_FRAMES from 4 to 8 and see which row stops passing, and why.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "crc-alone",
        skill: "link-testing",
        objective: "Know the blind spots of the CRC.",
        prompt: `A link relies on a CRC alone. Select **every** fault it will **not** catch.`,
        options: [
          { id: "a", text: "A frame that is dropped entirely.", correct: true, feedback: `Nothing arrives, so there is no CRC to fail. Only a sequence gap or a timeout sees it.` },
          { id: "b", text: "A valid old frame repeated.", correct: true, feedback: `The CRC is correct. Freshness needs a sequence number.` },
          { id: "c", text: "A frame that arrives 40 ms late but intact.", correct: true, feedback: `The bytes are fine. Lateness needs a timeout.` },
          { id: "d", text: "A single flipped bit in a frame.", correct: false, feedback: `That is exactly what a CRC catches: every single-bit error is detected.` },
        ],
        solvedFeedback: `Right: loss, replay and lateness slip past a CRC; a flipped bit does not. That is why the link uses a CRC with a sequence number and a timeout.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What link tests miss, and the test of the failover itself",
      body: `**The drift finding.** The lab's last row: a slow bias that stays in range, with a valid CRC, a good sequence and a normal arrival time. Every link check passes. Only comparing the value with the **other channels** exposes it, and only once it exceeds the miscompare limit. So the link tests and the voter tests are separate and both needed.

**Intermittent faults.** A fault that alternates good and bad frames can reset a consecutive-count and never isolate. Test the pattern, not only the burst.

**Dropout length.** A one-frame dropout must be tolerated and a long one must isolate the channel. The boundary, how many frames, is a requirement with its own test on both sides.

**Failover itself.** After isolating a channel, test what the system **does**: the voted output stays bounded, the fail-passive state is entered when two channels disagree, and the transitions are logged.

**Re-join.** Test a channel that resets and comes back: it must not be trusted until it is aligned.

Honest limit: a simulated injector proves the monitor logic. The physical link, connectors and EMC need bench tests on the real hardware.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "intermittent-reset",
        skill: "link-testing",
        objective: "Spot a gap in a persistence-based design.",
        prompt: `A link monitor isolates a channel after **3 consecutive** bad frames and resets its count on any good frame. A fault makes the channel's frames bad on every second frame. What happens, and what does the test plan need?`,
        options: [
          { id: "a", text: "The channel is isolated after 6 frames, because half of them are bad.", correct: false, feedback: `The count resets on every good frame, so it never exceeds 1. Total bad frames do not matter, only consecutive ones.` },
          { id: "b", text: "The channel is never isolated, although half its frames are bad; the test plan needs an intermittent-fault test and probably a different counting rule.", correct: true, feedback: `Right. A consecutive count cannot see alternating faults. A leaky counter or a bad-frames-in-N rule catches them, and a test with the alternating pattern proves it.` },
          { id: "c", text: "The CRC will catch the pattern and isolate the channel.", correct: false, feedback: `The CRC flags each bad frame, but the isolation decision is the count's. It resets on the good frames in between.` },
          { id: "d", text: "This cannot happen in a real link.", correct: false, feedback: `Intermittent faults, loose connectors and marginal drivers produce exactly this pattern, and they are among the hardest to find.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "cross-channel-link-test-plan",
      intro: `How would you test a link between redundant channels? Give the matrix, the pass criteria and the faults a link test cannot see.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Frame counters, CRC checks and timeouts are code you will write once and reuse in every link.
- **Aerospace and UAV systems.** Cross-channel links, actuator buses and payload links all need a plan with injected faults and recorded results.
- **R&D and design.** Defining the allowed skew, the timeout and the persistence is a design decision that the test matrix then checks.
- **Verification and interviews.** "How did you test failover?" is answered with a matrix, expected detections and the recorded verdicts, and with what the tests could not cover.`,
    },
    {
      type: "recap",
      summary: `- Every frame answers: is it intact (CRC), fresh and complete (sequence number, timeout), in step (frame number), and sensible (plausibility).
- Each check has a blind spot: a CRC cannot see loss, replay or lateness; plausibility cannot see wrong-but-plausible values.
- Channels are synchronised and compared by frame number; start-up and re-join have bounded, tested rules.
- A fault matrix lists failure mode, injection, expected detection, expected response and a numeric pass criterion, written before the run and recorded after it.
- Drift inside the limit and intermittent faults slip past link checks and counters; they need cross-channel comparison and their own tests.`,
      cards: [
        { id: "ccl-1", front: "What three questions must every cross-channel frame answer?", back: "Is it intact (CRC), fresh and complete (sequence number, timeout) and in step with this channel's frame (frame number)? A fourth: is the value plausible." },
        { id: "ccl-2", front: "Which faults does a CRC miss?", back: "Lost frames, replayed old valid frames, late frames and wrong-but-valid values. It catches bit errors; a sequence number and a timeout cover the rest." },
        { id: "ccl-3", front: "What are the columns of a fault matrix?", back: "Failure mode, injection, expected detection, expected response and pass criterion, with the result and the build recorded afterwards." },
        { id: "ccl-4", front: "Why can an intermittent fault escape a persistence counter?", back: "A consecutive count resets on every good frame, so alternating good and bad frames never reach the count. Use a leaky counter or bad-in-N rule and test the alternating pattern." },
      ],
    },
  ],
};
