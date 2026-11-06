import type { Lesson } from "@/lib/content/schema";

export const writingATrustworthyTestCase: Lesson = {
  slug: "writing-a-trustworthy-test-case",
  moduleId: "verification",
  prerequisites: ["board-bring-up-checklist"],
  title: "Writing a test case that a reviewer can trust",
  summary: "A test proves something only if its expected result can fail. Learn the anatomy of a verifiable test case, how it traces to a requirement, and how to turn 'works correctly' into a number with a method.",
  durationMinutes: 10,
  whyItMatters: "Verification work is where testing and integration experience becomes visible to a hiring manager. Being able to write a test that a reviewer, an auditor or a customer can trust transfers directly into avionics, automotive and medical roles, where traceability is not optional.",
  objectives: [
    "Write a test case with preconditions, steps, a measurable expected result, a method and a pass criterion.",
    "Trace a test to a requirement and recognise untested requirements and orphan tests in a traceability matrix.",
    "Distinguish verification from validation, and test levels from unit to regression.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Terminology follows common systems-engineering usage (verification: built right; validation: right thing built) as used in standards such as DO-178C, ISO 26262 and IEC 62304, without claiming compliance with any of them.",
  },
  references: [
    {
      title: "IEEE/ISO/IEC 29119 software testing standard, test documentation concepts",
      note: "Test case structure (preconditions, inputs, expected results) and traceability.",
    },
    {
      title: "DO-178C, ISO 26262-6, IEC 62304: verification and traceability requirements (overview level)",
      note: "Each requires requirements-to-test traceability; the mechanics taught here are what those processes consume. No certification claim is made.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "'Verify the UART works correctly'",
      body: `A test procedure lands on your desk for review. Step 7 reads: *"Connect the terminal and verify the UART works correctly."* Expected result: *"UART OK."*

Two engineers ran it last month. One passed it because text appeared. The other passed it because the LED blinked while the terminal was open. Neither noticed that the banner was printing at the wrong baud rate and only readable because the terminal auto-detected it.

A test that cannot fail has not tested anything. This lesson is about writing the kind that can.`,
    },
    {
      type: "concept",
      title: "Anatomy of a test case",
      body: `A trustworthy test case has seven parts, and a reviewer looks for all of them:

1. **Identifier and title.** TC-UART-003, "Console banner at nominal baud".
2. **Trace.** The requirement it verifies, by ID: *REQ-IF-012: The console shall transmit the banner "READY vX.Y" at 115 200 baud, 8N1, within 500 ms of reset.* No trace means nobody can say why the test exists or what fails if it fails.
3. **Preconditions.** Board powered at nominal voltage, firmware version, terminal configured 115 200 8N1, logic analyser on TX.
4. **Steps.** Numbered, one action each, no judgement words.
5. **Expected result with a method.** *"Analyser decodes 'READY v' followed by digits; first start bit within 500 ms of NRST rising edge; measured bit time 8.68 µs ± 2 %."* A number, a tolerance, and how it is measured.
6. **Pass criterion.** All expected results met; any miss is a fail. No "mostly".
7. **Record.** Actual values, instrument IDs, firmware hash, date, tester.

**Verification** asks *"did we build it right?"*: does the product meet its requirements. **Validation** asks *"did we build the right thing?"*: does it meet the user's need. A perfectly verified wrong requirement is still a product failure, which is why requirements get reviewed too.

Test **levels** differ in what they isolate: **unit** (a function, on a host), **integration** (two parts together: driver plus peripheral), **system** (the whole product against its requirements), **regression** (re-running earlier tests after a change to prove nothing broke). Each level has its own cases; a system test is not a substitute for a unit test.`,
      deeper: {
        title: "Negative tests and boundaries",
        body: `A requirement with a number implies tests at and beyond the boundary. "Within 500 ms" needs a test that proves a 500 ms banner passes and a test that proves a 600 ms banner is detected as a failure, otherwise the measurement method itself is unverified. Fault-injection tests (pull a sensor, corrupt a frame, brown the supply) are the negative side of integration testing and are where most field failures would have been found.`,
      },
    },
    {
      type: "visual",
      title: "Requirements to tests: the traceability matrix",
      visual: "traceability",
      body: `Each row is a requirement, each column a test. Tap cells to link them. The matrix will tell you which requirements have no test (gaps) and which tests verify nothing (orphans). Try to cover every requirement with the fewest tests.`,
      caption: `Illustrative matrix for a small sensor node. In a real project the matrix is generated from the requirement and test identifiers, not drawn by hand, but the two faults it exposes are the same.`,
    },
    {
      type: "concept",
      title: "From 'works' to a number",
      body: `Rewriting a vague expected result is a skill with a repeatable recipe. Ask four questions:

- **What quantity?** Timing, voltage, count, string content, state.
- **What value and tolerance?** From the requirement; if the requirement has none, the requirement is the defect.
- **Under what condition?** Nominal supply, cold, after reset, with a fault injected.
- **Measured how?** Instrument and method, so two testers get the same number.

| Vague | Testable |
|---|---|
| UART works correctly | Analyser decodes "READY v" at 115 200 8N1; bit time 8.68 µs ± 2 %; first start bit ≤ 500 ms after NRST rises |
| Sensor reads accurately | Reported temperature within ±0.5 °C of the reference thermometer at 25 °C and 60 °C, 10 samples each |
| Watchdog protects the system | With the main loop halted by the debugger, NRST pulses within 1.0 s ± LSI tolerance (0.7 to 1.9 s); RCC_CSR shows IWDGRSTF after restart |
| Low battery is handled | At supply = 3.1 V ± 0.05 V, the LOW_BATT flag is set in the status message within 2 s and the LED pattern changes to 2 Hz |

Notice that every testable version names something an instrument shows. If you cannot say what the instrument will show, you cannot write the test, and that is the moment to go back to the requirement's author.`,
    },
    {
      type: "example",
      title: "Worked example: TC-UART-003",
      body: `**Trace:** REQ-IF-012.
**Preconditions:** DUT powered at 3.30 V; firmware build a1b2c3; terminal 115 200 8N1; logic analyser channel 0 on TP5 (TX), channel 1 on NRST, 10 MS/s.
**Steps:**
1. Arm analyser, trigger on NRST rising edge.
2. Press and release SW1 (reset).
3. Capture 1 s.
4. Decode channel 0 as UART 115 200 8N1.
**Expected results:**
- E1: decoded text begins "READY v" followed by one or more digits, a dot, one or more digits.
- E2: time from NRST rising edge to first start bit ≤ 500 ms.
- E3: shortest pulse in the capture 8.68 µs ± 2 % (8.51 to 8.85 µs).
**Pass criterion:** E1, E2 and E3 all met.
**Record:** E1 text, E2 ms, E3 µs, analyser serial, tester, date.

Last month's wrong-baud banner fails E3 immediately, and a slow boot fails E2. Neither tester could have passed it by accident.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "testable-expected-result",
        skill: "verification",
        objective: "Recognise an expected result that can fail.",
        prompt: `Requirement: *"The node shall report a sensor fault within 250 ms of the sensor being disconnected."* Which expected result makes the test trustworthy?`,
        options: [
          { id: "a", text: "A fault is reported promptly after disconnection.", correct: false, feedback: `'Promptly' is the word the requirement replaced with a number. Two testers will disagree about what it means.` },
          { id: "b", text: "The FAULT bit is observed in the status message; the test passes if the tester judges the delay acceptable.", correct: false, feedback: `A judgement in the pass criterion makes the result depend on the tester. The number and method must be in the expected result.` },
          { id: "c", text: "Logic analyser: time from the sensor-connector open event (channel 2) to the first status frame with FAULT = 1 (channel 0) is ≤ 250 ms; repeated 5 times, all ≤ 250 ms.", correct: true, feedback: `Correct. A quantity, a bound, a measurement method with named signals, and a repeat count. It fails cleanly at 251 ms and it tells the next tester exactly what to set up.` },
          { id: "d", text: "The firmware log contains 'sensor fault' after the disconnect.", correct: false, feedback: `It checks that *a* fault is reported but not *when*, which is the whole point of the requirement.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "trace-matrix-faults",
        skill: "verification",
        objective: "Read a traceability matrix for gaps and orphans.",
        prompt: `A matrix shows: REQ-1 → TC-1, TC-2; REQ-2 → (none); REQ-3 → TC-3; TC-4 → (no requirement). Select **every** true statement.`,
        options: [
          { id: "a", text: "REQ-2 is unverified and the product cannot be shown to meet it.", correct: true, feedback: `Yes. A requirement with no test is a gap; passing every test says nothing about it.` },
          { id: "b", text: "TC-4 is an orphan: either it tests an unwritten requirement, or it is wasted effort.", correct: true, feedback: `Yes. Orphan tests often reveal a missing requirement (write it) or a test that should be deleted.` },
          { id: "c", text: "REQ-1 is over-tested and TC-2 should be removed.", correct: false, feedback: `Two tests on one requirement is normal: nominal and boundary, or two levels. Remove tests for a reason, not for symmetry.` },
          { id: "d", text: "If TC-3 fails, REQ-3 is not met in that build.", correct: true, feedback: `Yes, and that is the value of tracing: a failure maps to a requirement, which maps to an impact.` },
          { id: "e", text: "The matrix proves the requirements themselves are correct.", correct: false, feedback: `Traceability is verification bookkeeping. Whether the requirements are the right ones is validation, a separate activity.` },
        ],
        solvedFeedback: `Right. Gaps and orphans are what the matrix exists to expose, and a trace turns a failed test into a statement about a requirement. Correctness of the requirements is validation.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "bit-time-tolerance",
        skill: "verification",
        objective: "Derive a measurable tolerance from a requirement.",
        prompt: `A test's expected result requires the UART bit time to be within ±2 % of nominal at 115 200 baud. What is the **upper** limit of the acceptable bit time, in microseconds, to two decimal places?`,
        unit: "µs",
        answer: 8.85,
        tolerance: 0.01,
        solution: `Nominal bit time = 1 ÷ 115 200 = 8.68 µs. Upper limit = 8.68 × 1.02 = **8.85 µs** (the lower limit is 8.51 µs). Writing both limits into the expected result lets the tester read pass or fail straight off the analyser's measurement.`,
        solvedFeedback: `Correct: 8.85 µs. A tolerance that lives in the test, not in the tester's head.`,
        misconceptions: [
          { value: 8.68, tolerance: 0.01, feedback: `8.68 µs is the nominal value. The question asks for the upper limit at +2 %: 8.68 × 1.02 = 8.85 µs.` },
          { value: 8.51, tolerance: 0.01, feedback: `8.51 µs is the lower limit (−2 %). The upper limit is 8.85 µs.` },
        ],
      },
    },
    {
      type: "interview",
      questionId: "test-case-timing-requirement",
      intro: `This question is asked in verification, integration and firmware interviews alike. Walk through the seven parts and give the measurement method.`,
    },
    {
      type: "figure",
      title: "Requirements to tests, both directions",
      diagram: "v-model-traceability",
      alt: "V model showing system, high level and low level requirements on the left, code at the bottom, and the corresponding test levels on the right with traceability links.",
      caption: `Every requirement has tests and every test has a requirement, at each level. Coverage of the code comes from these requirements-based tests, not from extra ones written to make the number go up.`,
    },
    {
      type: "recap",
      summary: `- Seven parts: ID, trace, preconditions, steps, expected result with method, pass criterion, record.
- An expected result needs a quantity, a value with tolerance, a condition and a measurement method. If you cannot say what the instrument shows, go back to the requirement.
- Verification: built right. Validation: right thing built. Levels: unit, integration, system, regression.
- The traceability matrix exposes gaps (requirements without tests) and orphans (tests without requirements).
- Boundaries and fault injection prove the method can detect a failure, not only confirm a success.`,
      cards: [
        { id: "test-1", front: "Seven parts of a trustworthy test case?", back: "Identifier/title, trace to requirement, preconditions, numbered steps, expected result with tolerance and method, pass criterion, record of actuals and instruments." },
        { id: "test-2", front: "Verification vs validation?", back: "Verification: did we build it right (meets requirements). Validation: did we build the right thing (meets the need). A perfectly verified wrong requirement still fails validation." },
        { id: "test-3", front: "What does a traceability matrix expose?", back: "Gaps: requirements with no test. Orphans: tests with no requirement. And it maps a failed test to the requirement and impact it affects." },
        { id: "test-4", front: "Turn 'UART works correctly' into a testable result.", back: "Analyser decodes 'READY v…' at 115 200 8N1; bit time 8.68 µs ± 2 % (8.51 to 8.85 µs); first start bit ≤ 500 ms after NRST rises." },
      ],
    },
  ],
};
