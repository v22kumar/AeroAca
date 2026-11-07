import type { Lesson } from "@/lib/content/schema";

export const traceabilityProblemReportsAndChangeImpact: Lesson = {
  slug: "traceability-problem-reports-and-change-impact",
  moduleId: "do178c",
  format: "arc",
  prerequisites: ["requirements-based-testing-hlr-llr", "structural-coverage-and-mcdc"],
  title: "Traceability, problem reports and change impact: what must be re-verified?",
  summary: "How requirements, tests and code are linked, what a good problem report holds, and how to answer the question every late change raises: what exactly do we have to redo, and why? Worked on a threshold change in a synthetic fuel unit.",
  durationMinutes: 16,
  whyItMatters: "In a real project the requirements change after the first test run, and the verification engineer is the person who must say what the change touches. A calm, evidence-based change impact answer is one of the most valued skills on a certified project and a favourite interview scenario.",
  objectives: [
    "Describe a traceability matrix, and spot gaps and orphans in one.",
    "Write a problem report that someone else can reproduce, classify and close.",
    "Carry out a change impact analysis: what to review, update, re-run and re-measure, with the reason for each.",
    "Explain how baselines and change control make the evidence trustworthy.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Traceability between system requirements, high-level requirements, low-level requirements, code and tests, problem reporting, configuration management and change impact analysis follow the DO-178C software verification, configuration management and quality assurance processes as summarised publicly. The fuel unit, identifiers and numbers are synthetic and invented for teaching.",
  },
  references: [
    { title: "RTCA DO-178C sections 7 and 11, configuration management and the life-cycle data", note: "Baselines, change control, problem reports, traceability data." },
    { title: "RTCA DO-178C section 6.4.2 and 6.3", note: "Test coverage of requirements and review of the traceability." },
    { title: "Lesson: Requirements-based testing", note: "REQ-FUEL-07 and its test table used again here." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The threshold moves from 100 to 120",
      body: `Late in the project the customer changes **REQ-FUEL-07**: LOW_FUEL must now be set below **120 kg**, not 100. A one-character change in the code.

The project manager asks you, as the verification engineer: "What do we need to redo?"

The programmer says "just re-run the two boundary tests". The test lead says "re-run everything, to be safe". A third person says "it is only a constant, no test needed".

Each answer is quick, and each could be wrong. You need a method that produces an answer you can defend to an auditor, and that stays defensible next month when someone asks "why did you not re-run the display tests?".`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Know which rooms share the pipe",
      body: `Before a plumber cuts a pipe, they find out which taps are on it. They do not shut off the whole building, and they do not guess.

A project is the same. A change to one requirement can reach the code that implements it, the tests that check it, and neighbours that use its output. **Traceability** is the map of which parts hang off which: from a requirement down to the design and code, and up from each test to the requirement it checks.

With the map you can answer three questions fast:

- What does this change **touch**?
- What must be **looked at again**, and what is only **run again**?
- What is **not** affected, and can we say why?

Without the map, every change is either a gamble or a full restart.

A second idea keeps the map honest: nothing changes silently. Every change is recorded, approved and linked to the exact version it produced. That discipline is called **configuration management**.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The traceability matrix: gaps, orphans and links",
      body: `A **traceability matrix** lists the links between items in neighbouring layers: system requirement to HLR, HLR to LLR, LLR to code, and each requirement to the tests and test results that verify it.

Read it in both directions. Each direction finds a different fault.

- **A gap**: a requirement with no test. Behaviour nobody verified.
- **An orphan test**: a test that traces to no requirement. Either a requirement is missing, or the test is not needed.
- **Orphan code**: code with no low-level requirement above it. It is a **derived requirement**, a missing one, or dead code.

Matrices are generated from identifiers kept in the requirement and test tools, and checked by review. A hand-drawn matrix drifts away from the truth within a week.

Each link is also a **claim** that someone has reviewed: "this test is sufficient for that requirement". A link with no review is a guess, however tidy the table looks.

The next step is an interactive matrix. Use it to find gaps and orphans.`,
    },
    {
      type: "visual",
      stage: "how",
      depth: "understand",
      title: "Build a matrix: find the gap and the orphan",
      visual: "traceability",
      body: `**Try this first.** Tap cells to link tests to requirements. Before you finish, predict which requirement will have no test and which test will verify nothing, then check. Then cover every requirement with as few tests as you can.`,
      caption: `Illustrative matrix for a small sensor node. In a real project it is generated from requirement and test identifiers, but the two faults it exposes, gaps and orphans, are the same.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "Problem reports and baselines",
      body: `When a test fails or someone finds a fault, it becomes a **problem report**. A good one lets a stranger reproduce, understand and close it. It records:

- an **id**, the **build or baseline** it was found on, and who found it;
- the **steps** to reproduce, exactly, and the **observed** and **expected** result;
- the **requirement** it concerns, taken from the matrix;
- an assessment: does it affect safety, and what is its **severity**;
- the life of the report: opened, analysed, fixed, **re-verified** by someone, closed.

A **baseline** is a frozen, labelled set of items: requirements, code, tests, tool versions. Test results are only evidence if they name the baseline they ran on. Change control means nothing leaves a baseline except through an approved, recorded change.

The report is closed when the fix has been **re-verified**, not when the code is changed. A report closed on the programmer's word alone is a missing piece of evidence.

Reports and baselines are how an auditor later reconstructs what happened, so they are written for a stranger.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: the 100 kg to 120 kg change",
      body: `**The matrix before the change** (synthetic):

| Item | Traces to |
|---|---|
| REQ-FUEL-07 (HLR) | LLR-FUEL-07a threshold, LLR-FUEL-07b timing |
| fuel.c | LLR-FUEL-07a, LLR-FUEL-07b |
| T1 (99.9 kg), T2 (100.0 kg) | REQ-FUEL-07, boundary at the threshold |
| T3, T4, T5, T6 (range ends and invalid) | REQ-FUEL-07 |
| T7 (150 kg to 90 kg timing) | LLR-FUEL-07b |
| D-03 (display shows LOW FUEL text) | REQ-DISP-03, uses the LOW_FUEL flag |

**Step 1: what changes?** REQ-FUEL-07 and LLR-FUEL-07a, the threshold. **Review** both, and the code constant. Check any other requirement that depends on the order of thresholds.

**Step 2: which tests change?** T1 and T2 sit on the boundary: new inputs 119.9 and 120.0. T3 to T6 are range ends and invalid values, whose inputs do not change. T7: 150 to 90 still crosses 120. **Edit T1 and T2. Two tests.**

**Step 3: what is re-run?** T1 to T7 all re-run: they exercise the changed function. D-03 re-runs too, for it consumes the flag, with no edit.

**Step 4: coverage.** The change touches no branch, but re-measure on the new baseline: the numbers belong to a build.

**Step 5: record the reasoning.** Write the impact analysis down. In a month the answer "why did you not edit D-03" is in the file.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "orphan-guided",
        skill: "traceability",
        objective: "Classify a traceability finding and respond (guided).",
        prompt: `A review of the matrix shows test **T12** traces to no requirement. It checks that the unit stays quiet for 30 seconds after power-on. What is T12 called, and what is the right first response?`,
        hints: [
          `A requirement with no test is a gap. What is the name for the opposite?`,
          `The behaviour might be wanted. If so, something is missing above the test.`,
          `The right response asks which of the two is true: the test is unnecessary, or a requirement is missing.`,
        ],
        options: [
          { id: "a", text: "A gap; add a requirement for it without further thought.", correct: false, feedback: `A gap is a requirement without a test. T12 is the other way round. And adding a requirement automatically skips the question of whether the behaviour is wanted.` },
          { id: "b", text: "An orphan test; find out whether the 30 s quiet period is intended behaviour. If so, a requirement is missing; if not, the test is unnecessary.", correct: true, feedback: `Right. An orphan test points to either a missing requirement or a test with no purpose. Both are findings and both must be resolved, not ignored.` },
          { id: "c", text: "Fine as it is; extra tests never do harm.", correct: false, feedback: `An orphan test verifies nothing the project has agreed to need. Tests are maintained and run, so unneeded ones cost time and hide real gaps.` },
          { id: "d", text: "Delete T12 to make the matrix clean.", correct: false, feedback: `Deleting it hides what it may be telling you: that a behaviour exists with no requirement. Find out why it exists first.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "problem-report-fields",
        skill: "traceability",
        objective: "Recognise a problem report someone else can use.",
        prompt: `Select **every** item that belongs in a good problem report.`,
        options: [
          { id: "a", text: "The build or baseline identifier the failure was seen on.", correct: true, feedback: `Without it nobody can tell which code the failure belongs to, and the fix cannot be matched to it.` },
          { id: "b", text: "Exact steps to reproduce, with the observed and the expected result.", correct: true, feedback: `A stranger must be able to reproduce it and see what was wrong.` },
          { id: "c", text: "The requirement concerned, taken from the traceability matrix.", correct: true, feedback: `It links the failure to what the software was supposed to do, and tells you what to re-verify.` },
          { id: "d", text: "A note that says 'works on my machine'.", correct: false, feedback: `That is not evidence. A report states what was observed on which baseline, so it can be reproduced or shown not to reproduce.` },
        ],
        solvedFeedback: `Right: baseline, reproduction steps with observed and expected, and the requirement. A claim that it works somewhere else is not data.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Impact analysis: the shortcuts and why they fail",
      body: `Back to the three answers from the scenario.

**"Re-run only the two boundary tests."** Those two are the ones that need **editing**. The others still exercise the changed function and must be **run** again; a constant can break a neighbour through a shared variable or data type.

**"Re-run everything."** Cheap when automated, and sensible. But it is not an analysis: it does not say what must be **reviewed**, which tests need **editing**, or which requirements depend on the changed one. The auditor asks for the reasoning, not only the run.

**"It is only a constant."** The size of the edit says nothing about the size of the effect. Requirements, tests and a displayed value all depended on it.

Impact analysis answers four things, in writing: what is **reviewed**, what is **updated**, what is **re-run**, and what is **re-measured**, with a reason for anything left out.

Limits to state honestly: the analysis is only as good as the matrix; hidden coupling through shared data is found by data and control coupling analysis; and a change to a tool or compiler can affect everything, so it is treated as a larger change.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "numeric",
        id: "impact-edits",
        skill: "traceability",
        objective: "Count the tests whose inputs or expected values must be edited.",
        prompt: `Using the matrix in the worked example, REQ-FUEL-07 changes from 100 kg to 120 kg. T1 is 99.9 kg, T2 is 100.0 kg, T3 is 0.0 kg, T4 is 20 000.0 kg, T5 is −0.1 kg, T6 is 20 000.1 kg, T7 drops the quantity from 150 kg to 90 kg and times the flag. How many of the seven tests need their inputs or expected values **edited**?`,
        unit: "tests",
        answer: 2,
        tolerance: 0,
        solution: `Only **T1** (99.9 becomes 119.9) and **T2** (100.0 becomes 120.0) sit on the threshold. T3 to T6 test the ends of the valid range and invalid values, which did not change. T7 still crosses the new threshold: 150 is above 120 and 90 is below it. All seven are still **re-run**, but two are **edited**.`,
        solvedFeedback: `Right: two. Editing and re-running are different decisions, and the impact record should say which is which.`,
        misconceptions: [
          { value: 7, tolerance: 0, feedback: `Seven is the number to **re-run**. Only the two tests that sit on the 100 kg threshold need their inputs edited. Keep the two questions apart in the record.` },
          { value: 1, tolerance: 0, feedback: `Both boundary tests move: T1 (99.9, just below the old limit) and T2 (100.0, just at it). Each has to move to straddle 120.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "change-impact-and-traceability",
      intro: `A requirement changes late in the project. Say what you would review, update, re-run and re-measure, and why.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Every code change should name the requirement it implements or fixes; commit messages that carry the id are the start of a trace.
- **Aerospace and UAV systems.** Integration test plans and problem reports are written against baselines; a late change is routine, not unusual.
- **R&D and design.** Keeping requirement identifiers in the design documents makes later review and reuse far cheaper.
- **Verification and interviews.** "A requirement changed, what do you redo?" is a standard scenario question; review, update, re-run, re-measure, with reasons, is the answer.`,
    },
    {
      type: "recap",
      summary: `- A traceability matrix links requirements, code and tests in both directions. Gaps (requirement without a test), orphan tests and orphan code are findings.
- Every link is a reviewed claim; matrices are generated from identifiers, not drawn by hand.
- A problem report names the baseline, the reproduction steps, observed and expected results and the requirement; it closes only after re-verification.
- Change impact analysis states what is reviewed, updated, re-run and re-measured, with a reason for anything left out.
- Editing a test and re-running a test are different decisions; the record should say which was done and why.`,
      cards: [
        { id: "trc-1", front: "What are a gap and an orphan in a traceability matrix?", back: "A gap is a requirement with no test (unverified behaviour). An orphan test traces to no requirement: a missing requirement or an unnecessary test. Orphan code has no low-level requirement above it." },
        { id: "trc-2", front: "What belongs in a problem report?", back: "An id, the baseline it was found on, exact steps to reproduce, observed and expected results, the requirement concerned, an assessment of safety effect and severity, and a life cycle ending in re-verification." },
        { id: "trc-3", front: "What does a change impact analysis state?", back: "What is reviewed, what is updated, what is re-run and what is re-measured, with the reason for anything left out, all recorded against the new baseline." },
        { id: "trc-4", front: "Why is 'it is only a constant' a poor impact answer?", back: "The size of the edit says nothing about its reach. Requirements, tests and downstream consumers may all depend on the value; the matrix shows which." },
      ],
    },
  ],
};
