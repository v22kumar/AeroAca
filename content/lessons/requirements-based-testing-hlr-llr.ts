import type { Lesson } from "@/lib/content/schema";

export const requirementsBasedTestingHlrLlr: Lesson = {
  slug: "requirements-based-testing-hlr-llr",
  moduleId: "do178c",
  format: "arc",
  prerequisites: ["do-178c-levels-and-objectives", "writing-a-trustworthy-test-case"],
  title: "Requirements-based testing: HLR, LLR, normal-range and robustness tests",
  summary: "How a DO-178C verification engineer turns requirements into test cases: high-level and low-level requirements, derived requirements, equivalence classes, boundary values, and the robustness tests that look for what happens when inputs are wrong.",
  durationMinutes: 16,
  whyItMatters: "Requirements-based testing is the centre of verification under DO-178C and the part of the job you will do most. Interviewers ask you to take one requirement and produce test cases on the spot; a method with named steps and honest boundaries beats a list of ideas.",
  objectives: [
    "Distinguish high-level requirements, low-level requirements and derived requirements, and say what each is tested against.",
    "Derive equivalence classes and boundary values from one requirement.",
    "Separate normal-range tests from robustness tests and give examples of each.",
    "Explain why tests must come from requirements, not from the code, and what a test procedure records.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The test-selection method follows the requirements-based testing objectives of DO-178C section 6.4 (normal range and robustness test cases, test coverage of high- and low-level requirements) as summarised publicly, and standard test design technique (equivalence classes, boundary value analysis). The fuel example is synthetic and invented for teaching; it does not describe any real product.",
  },
  references: [
    { title: "RTCA DO-178C section 6, software verification process", note: "Requirements-based test case selection, normal range and robustness cases, test procedures and results." },
    { title: "Myers, The Art of Software Testing", note: "Equivalence partitioning and boundary value analysis." },
    { title: "Lesson: Writing a trustworthy test case", note: "The quantity, tolerance and condition recipe used here." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "One sentence, how many tests?",
      body: `You are handed one requirement for a fuel indication unit:

**REQ-FUEL-07**: *The unit shall set LOW_FUEL within 1 s when the fuel quantity is below 100 kg. Valid quantity is 0 to 20 000 kg.*

Your colleague writes three tests: 50 kg sets the flag, 5 000 kg does not, 15 000 kg does not. All pass. "Done," she says.

Are you done? What happens at exactly 100 kg? At 99.9? At minus 3 kg from a failed sensor? At 40 000? And what does the code do with a quantity the requirement never mentions?

Three tests do not tell you. A method does.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Tests come from the syllabus, not from the student's notes",
      body: `Picture an examiner writing questions. If the examiner writes them from the student's notes, every student passes: the questions can only ask what the student already wrote down.

Testing code against **what the code does** works the same way. It proves the code does what it does, which is always true. It tells you nothing about whether the code does what the aircraft needs.

So the questions are written from the **syllabus**, the **requirements**: statements of what the unit must do, written before and apart from the code. Then the code sits the exam.

A second rule follows. The exam must ask the **hard** questions: the edges, the invalid answers, the cases where students usually slip. A test that only checks the comfortable middle shows very little.

That gives two kinds of question: those about **normal** use, and those about **abnormal** inputs and conditions. DO-178C asks for both.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Three kinds of requirement",
      body: `Requirements are stacked. A test is always written against one layer, so you must know which.

- **System requirements** say what the whole equipment must do, for example "indicate low fuel to the crew".
- **High-level requirements (HLR)** are the software's share of that, stated in terms of the software's behaviour, like REQ-FUEL-07. They are what **system-level and integration tests** verify.
- **Low-level requirements (LLR)** come from the software design: how a function, task or module behaves, with its inputs, outputs and limits. They are what **low-level tests** verify.

Then there is the awkward one. A **derived requirement** is something the design or code needs that does not trace to any higher requirement: a buffer size, a filter, a retry count. It is allowed, but it must be written down and sent back to the safety assessment, in case it affects safety.

Every requirement needs at least one test, and every test traces to at least one requirement. That two-way link is **traceability**.

The picture on the next step shows the layers and the links.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "The V: each layer verified by tests of its own",
      diagram: "v-model-traceability",
      alt: "V-model showing system requirements, high-level software requirements, low-level requirements and code on the left, with system tests, software integration tests and unit tests on the right, joined by traces to and verified-by links.",
      caption: "Left: the requirement layers down to code. Right: the tests that verify each layer. The arrows are the traceability links; a gap in either direction is a finding.",
      body: `Find REQ-FUEL-07 on the left. Its tests live on the right, one level across. If a low-level requirement exists beneath it, that has its own tests too.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Normal-range and robustness tests",
      body: `For each requirement you write two groups of tests.

**Normal-range tests** use valid inputs and expected conditions:

- one value from each **equivalence class**, a set of inputs the requirement treats alike;
- values at and around each **boundary** between classes, because off-by-one and "less than or equal" mistakes live there;
- for a requirement with timing, a measurement of the time.

**Robustness tests** use inputs and conditions the requirement does not expect, to see that the software behaves safely:

- values outside the valid range, not-a-number, or an invalid status flag;
- missing, late or repeated input;
- error and fault paths the software contains.

A good robustness test asserts a **defined, safe response**, for example "quantity out of range sets SENSOR_FAIL and keeps LOW_FUEL as last valid", not merely "does not crash".

If the requirement does not say what to do with invalid input, the requirement is incomplete. That is a finding, raised before the tests are written.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: REQ-FUEL-07 to a test table",
      body: `**Step 1: find the classes.** The valid range is 0 to 20 000 kg. LOW_FUEL is set below 100. So the classes are:

1. below 0: invalid
2. 0 to under 100: valid, LOW_FUEL set
3. 100 to 20 000: valid, LOW_FUEL clear
4. above 20 000: invalid

**Step 2: find the boundaries.** Three: at 0, at 100 and at 20 000. Test just either side of each.

**Step 3: write the table, with the expected result from the requirement.**

| Test | Input (kg) | Expected | Kind |
|---|---|---|---|
| T1 | 99.9 | LOW_FUEL set | boundary, normal |
| T2 | 100.0 | LOW_FUEL clear ("below" means strictly less) | boundary, normal |
| T3 | 0.0 | LOW_FUEL set, no fault | boundary, normal |
| T4 | 20 000.0 | clear, no fault | boundary, normal |
| T5 | −0.1 | SENSOR_FAIL | robustness |
| T6 | 20 000.1 | SENSOR_FAIL | robustness |

**Step 4: the timing.** Change the quantity from 150 to 90 and measure the time to the flag: must be at most 1 s.

**Step 5: the missing answer.** What is the expected result for T5 and T6? The requirement does not say. Raise it as a **requirement defect**; do not invent the expected value.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "classes-guided",
        skill: "requirements-testing",
        objective: "Count the equivalence classes of a requirement (guided).",
        prompt: `A requirement says: *the unit shall set CAUTION when the bus voltage is below 24 V. Valid voltage is 18 to 32 V.* How many equivalence classes does this requirement give, counting the invalid ones?`,
        unit: "classes",
        answer: 4,
        tolerance: 0,
        hints: [
          `Two boundaries split a line into three pieces. Here the valid range gives two, and the CAUTION limit gives one more inside it.`,
          `Below 18 is invalid. Then 18 up to 24, then 24 up to 32, then above 32.`,
          `Count: below 18, 18 to under 24, 24 to 32, above 32.`,
        ],
        solution: `Four classes: **below 18 V** (invalid), **18 to under 24 V** (valid, CAUTION set), **24 to 32 V** (valid, CAUTION clear), **above 32 V** (invalid). The boundaries are 18, 24 and 32, so six boundary tests, one each side.`,
        solvedFeedback: `Right: four classes. The valid range gives the two outer edges and the CAUTION limit divides the inside.`,
        misconceptions: [
          { value: 2, tolerance: 0, feedback: `Two counts only 'caution' and 'no caution'. The invalid regions below 18 V and above 32 V are classes too, because the software must behave safely there. Four in all.` },
          { value: 3, tolerance: 0, feedback: `Three counts only the valid range and one invalid side. There is an invalid region on each end: below 18 V and above 32 V. Four in all.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "A test procedure that records what it did",
      intro: `A test procedure is repeatable steps plus recorded results. This small script runs the table from the example against a bench interface and prints one traceable line per test.`,
      language: "python",
      code: `CASES = [  # (test id, quantity in kg, expected flag)
    ("T1", 99.9, True),
    ("T2", 100.0, False),
    ("T3", 0.0, True),
    ("T4", 20000.0, False),
]
for tid, kg, expect in CASES:
    rig.set_fuel_quantity(kg)
    got = rig.read_flag("LOW_FUEL")
    verdict = "PASS" if got == expect else "FAIL"
    print(tid, "REQ-FUEL-07", kg, expect, got, verdict)`,
      notes: [
        { lines: "1-5", text: `The cases are **data**: id, input and expected result, all taken from the requirement before anything runs. The expected value is never copied from what the software did.` },
        { lines: "6-8", text: `For each case, apply the input through the test interface and read the **observable output**, here the flag. The test does not reach inside the code.` },
        { lines: "9-10", text: `Print the test id, the requirement id, the input, expected, actual and verdict on one line. The requirement id on the line is the **trace** back to what the test verifies; the log is the record.` },
      ],
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "robustness-or-normal",
        skill: "requirements-testing",
        objective: "Recognise robustness tests.",
        prompt: `For REQ-FUEL-07, select **every** test that is a **robustness** test, not a normal-range test.`,
        options: [
          { id: "a", text: "Apply −0.1 kg and check SENSOR_FAIL is raised.", correct: true, feedback: `Yes: the input is outside the valid range, and the test asserts a defined, safe response.` },
          { id: "b", text: "Apply 99.9 kg and check LOW_FUEL is set.", correct: false, feedback: `That is a normal-range boundary test: 99.9 is a valid input just below the limit.` },
          { id: "c", text: "Stop sending quantity updates for 5 s and check the unit marks the data as stale.", correct: true, feedback: `Yes: missing input is an abnormal condition. The expected response must come from a requirement, or the requirement is incomplete.` },
          { id: "d", text: "Apply 20 000 kg and check no fault is raised.", correct: false, feedback: `A valid input at the top boundary: normal-range. The robustness test is the one just above it, 20 000.1.` },
        ],
        solvedFeedback: `Right: out-of-range values and missing input are robustness cases; valid values at and around the limits are normal-range.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Where requirements-based testing goes wrong",
      body: `Four failure modes, each seen in real reviews.

**Tests written from the code.** Reading the code to decide the expected value makes every test pass and proves nothing. Expected results come from the requirement, even if that is slower.

**Vague requirements.** "Shall respond quickly" has no test. The defect is in the requirement and is reported there, not patched in the test.

**Derived requirements left unwritten.** A filter or timeout in the code with no requirement is behaviour nobody verified. It must be written down, tested and sent back to the safety assessment.

**Counting tests instead of covering requirements.** A hundred tests on one requirement and none on another is a gap. The matrix of requirements against tests is the check.

Also a limit to state honestly: requirements-based tests show the software does what the requirements say. They do not show the requirements are right. That is validation, done earlier and elsewhere in the process.

After the tests run, structural coverage tells you which code the tests did **not** touch. The next lessons turn that into findings.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "order",
        id: "rbt-order",
        skill: "requirements-testing",
        objective: "Put the steps of requirements-based verification in order.",
        prompt: `Put these steps in the order a verification engineer does them for one requirement.`,
        items: [
          { id: "review", text: "Review the requirement: is it testable, complete, and does it say what to do with invalid input?", why: `A defective requirement is cheapest to fix before any test is written.` },
          { id: "design", text: "Derive equivalence classes and boundaries and write test cases with expected results from the requirement.", why: `Expected results are fixed before running anything, so the result cannot bias them.` },
          { id: "run", text: "Run the test procedure on the target or approved test environment and record the results.", why: `The record is the evidence; it must name the build and the procedure.` },
          { id: "coverage", text: "Measure structural coverage of the code exercised by those tests.", why: `Coverage is measured from requirements-based tests, to show what they missed.` },
          { id: "gaps", text: "Analyse every gap: missing test, missing requirement, dead code or deactivated code.", why: `Coverage is only a measurement; the analysis of its shortfalls is the verification result.` },
        ],
        correctOrder: ["review", "design", "run", "coverage", "gaps"],
        solvedFeedback: `Right: review, design, run, measure, analyse. Coverage comes after the tests, not before; it cannot design them.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "requirements-based-testing-explained",
      intro: `Take one requirement and turn it into test cases, out loud, with its boundaries and a robustness case.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Writing unit tests against a low-level requirement uses exactly the same equivalence and boundary thinking.
- **Aerospace and UAV systems.** Integration tests against HLRs, including robustness cases for lost or invalid bus data, come straight from this method.
- **R&D and design.** A testable requirement is easier to design to; reviewing requirements for gaps is design work as much as verification.
- **Verification and interviews.** "Here is a requirement, what tests would you write?" is a common live exercise: classes, boundaries, robustness, expected values from the requirement.`,
    },
    {
      type: "recap",
      summary: `- Tests come from requirements, never from the code: that is what makes a passing test mean something.
- HLRs are verified by system and integration tests, LLRs by low-level tests; a derived requirement has no parent and must be written down and fed back to the safety assessment.
- Each requirement gets normal-range tests (one per equivalence class and both sides of every boundary) and robustness tests (out-of-range, missing, invalid input) with a defined safe response.
- Expected results are fixed from the requirement before running; a missing answer is a requirement defect.
- Structural coverage is measured afterwards from these tests, and its gaps are analysed.`,
      cards: [
        { id: "rbt-1", front: "What is the difference between an HLR, an LLR and a derived requirement?", back: "An HLR is the software's share of a system requirement; an LLR comes from the software design; a derived requirement has no parent in a higher requirement and must be recorded and fed back to the safety assessment." },
        { id: "rbt-2", front: "Normal-range versus robustness tests?", back: "Normal-range: valid inputs, one per equivalence class and both sides of every boundary. Robustness: out-of-range, invalid, missing or late inputs and fault paths, asserting a defined safe response." },
        { id: "rbt-3", front: "Why must expected results come from the requirement and not from the code?", back: "A test whose expected value is copied from what the code does always passes and proves nothing about what the aircraft needs." },
        { id: "rbt-4", front: "Requirement says 'below 100 kg'. What is the key boundary test?", back: "100.0 must NOT set the flag (below means strictly less) and 99.9 must set it. Off-by-one errors live at the boundary." },
      ],
    },
  ],
};
