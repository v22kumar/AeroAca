import type { Lesson } from "@/lib/content/schema";

export const structuralCoverageAndMcdc: Lesson = {
  slug: "structural-coverage-and-mcdc",
  moduleId: "do178c",
  format: "arc",
  prerequisites: ["requirements-based-testing-hlr-llr", "embedded-c-register-bit-masks"],
  title: "Structural coverage and MC/DC: what the tests never touched",
  summary: "Statement, decision and MC/DC coverage built up from one small decision, run in a lab that finds the independence pairs for you, and the analysis of what an uncovered line means: a missing test, a missing requirement, dead code or deactivated code.",
  durationMinutes: 18,
  whyItMatters: "MC/DC is the part of DO-178C interviewers like to probe, because candidates repeat the definition without being able to show it on a three-condition decision. Showing it on paper, then explaining what to do with a coverage gap, is the clearest sign you have done the work.",
  objectives: [
    "Define statement, decision and MC/DC coverage and say which level requires which.",
    "Find the independence pair for each condition of a small decision and build a minimal MC/DC test set.",
    "Explain why n conditions need at least n + 1 tests, and why decision coverage alone is not enough.",
    "Analyse an uncovered line: missing test, missing requirement, dead code or deactivated code.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Definitions of statement, decision, condition and MC/DC coverage and their assignment to levels C, B and A follow the public summaries of DO-178C section 6.4.4.2 and the CAST position papers. The independence pairs and minimal test sets shown here were produced by the lab in this lesson by exhaustive search and agree with the standard worked example for (A and B) or C. The masking variant is described in words only.",
  },
  references: [
    { title: "RTCA DO-178C section 6.4.4, structural coverage analysis", note: "Statement, decision and MC/DC criteria; analysis of shortfalls; data and control coupling." },
    { title: "Hayhurst et al., A Practical Tutorial on Modified Condition/Decision Coverage (NASA/TM-2001-210876)", note: "Free NASA tutorial; the independence pair method used here." },
    { title: "Certification Authorities Software Team position papers (CAST)", note: "Including the paper on masking MC/DC." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "All pass, and the lead is still not happy",
      body: `Your requirements-based tests all pass. The coverage tool reports **94 % statement coverage and 88 % decision coverage**. The lead says the function is at Level A and the numbers are not acceptable.

You open the report. One function stands out:

\`if ((armed && valid) || override) fire();\`

Three conditions, one decision. Your two tests, one that fires and one that does not, give 100 % decision coverage of that line. The lead still says it is not enough. How can a line be 100 % covered and still not good enough?

The answer is a precise idea: showing that each condition **on its own** can change the result.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Coverage is a highlighter, not a grade",
      body: `Imagine running a highlighter over the code every time a test walks through it. After all the tests, the unhighlighted parts are the places **no test went**.

That is all structural coverage is. It does **not** say the highlighted code is correct, and it does not say the tests were good. It says where the tests **never reached**.

Why does that matter? Code that no test reached is code nobody has checked. It might be a feature missing a requirement, a leftover from an old design, or a bug waiting for the right input.

The levels ask for finer and finer highlighters. The coarsest: was each **line** executed? Finer: was each **branch** taken both ways? Finest in this lesson: did each **condition** in a branch matter?

And one rule governs how it is used: coverage is measured from the **requirements-based tests**. You do not write tests to colour the code in; you write them from requirements, then see what was left uncoloured.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Statement, decision, condition and MC/DC",
      body: `Take \`if ((A && B) || C)\`. A, B and C are **conditions**: simple true-or-false expressions. The whole expression is the **decision**.

- **Statement coverage** (Level C): every statement ran at least once. The line above is covered by one test that enters it.
- **Decision coverage** (Level B, plus statement): every decision took **both outcomes**, true and false. Two tests are enough: one that gives true, one that gives false.
- **Condition coverage**: every condition was true once and false once. It can be met without the decision ever being false.
- **MC/DC** (Level A, plus decision and statement): every condition was shown to **independently** change the decision's outcome.

"Independently" has a precise meaning: for each condition there is a **pair** of tests that differ **only in that condition** and give **different outcomes**. Then that condition alone made the difference.

How many tests? Each condition needs a pair, but pairs can share tests. For a decision of n independent conditions the smallest set has **n + 1** tests, instead of the 2ⁿ of every combination.

Decision coverage hides weak conditions; MC/DC does not.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "The independence pairs for (A and B) or C",
      diagram: "mcdc-pairs",
      alt: "Truth table of the decision (A and B) or C with eight rows and the independence pair for each of the three conditions highlighted, and the four rows that make a complete MC/DC set shaded.",
      caption: "All eight combinations; the shaded rows TFF, FTF, TTF and TFT make a complete MC/DC set. Condition A's pair is FTF with TTF, B's is TFF with TTF, C's is TFF with TFT.",
      body: `Take condition A. Find two rows that differ **only** in A and give different results: FTF gives F, TTF gives T. That is A's pair. Do the same for B and C and notice how the rows are shared.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: why TTT and FFF are not enough",
      body: `The decision is \`(A && B) || C\`. A tester picks two tests: **TTT** (result true) and **FFF** (result false).

**Decision coverage?** The decision was true once and false once. **Yes**, 100 %. The tool reports a green tick.

**Is A shown to matter?** Look for a test pair that differs only in A. TTT and FFF differ in **all three** conditions. Nothing isolates A. The same is true of B and C. **No condition is shown independent.**

What could be wrong and still pass? If the code accidentally read \`(A && B) || A\` instead of \`C\`, TTT and FFF would still give the right answers. C is never tested on its own.

**Build the real set.** For each condition, find its pair in the table:

- A: **FTF** (false) and **TTF** (true)
- B: **TFF** (false) and **TTF** (true)
- C: **TFF** (false) and **TFT** (true)

The union is four tests: **TFF, FTF, TTF, TFT**. That is n + 1 = 4 for n = 3, and it is exactly the shaded set in the figure.

**What it costs:** 4 tests instead of the 8 combinations, and it catches the mistake that two tests could not.`,
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: find the pairs and the smallest set",
      lab: "c-mcdc",
      body: `The program takes three decisions, lists every independence pair for every condition, and then searches **all** subsets of the combinations for the smallest set that gives every condition a pair. The last case checks the two-test set from the worked example.`,
      tryNext: `Add a fourth decision of your own, for example \`A && B && C\`. Predict the smallest MC/DC set before you run it. Then note: in which of the decisions does one condition have several pairs to choose from, and which has only one? What does that tell you about the choice of tests?`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "mcdc-count-guided",
        skill: "mcdc",
        objective: "Count the tests in a minimal MC/DC set (guided).",
        prompt: `The decision is \`A && B\`: two conditions, both must be true. What is the smallest number of tests that achieves MC/DC?`,
        unit: "tests",
        answer: 3,
        tolerance: 0,
        hints: [
          `For n independent conditions the smallest set has n + 1 tests.`,
          `Here n = 2. Which rows of the truth table do you need? A needs a pair differing only in A, B needs a pair differing only in B.`,
          `TT is in both pairs: TT with FT for A, and TT with TF for B. Count the distinct rows.`,
        ],
        solution: `Three tests: **TT** (true), **FT** (false) and **TF** (false). A's pair is TT with FT, B's pair is TT with TF, and they share TT. That is n + 1 = 3. The row FF is not needed.`,
        solvedFeedback: `Right: three. The pairs share the all-true row, which is why the count is n + 1 and not 2n.`,
        misconceptions: [
          { value: 2, tolerance: 0, feedback: `Two tests (TT and FF, or TT and TF) give decision coverage, but no condition is isolated. MC/DC needs a pair per condition: TT with FT for A and TT with TF for B, three tests.` },
          { value: 4, tolerance: 0, feedback: `Four is every combination: TT, TF, FT and FF. MC/DC does not need FF, because neither pair uses it. Three tests are enough.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "mcdc-count-six",
        skill: "mcdc",
        objective: "Apply the n + 1 rule.",
        prompt: `A Level A function contains one decision with **six** independent conditions combined with && and ||, none repeated. What is the smallest number of tests that can achieve MC/DC for it?`,
        unit: "tests",
        answer: 7,
        tolerance: 0,
        solution: `n + 1 = 6 + 1 = **7** tests. Exhaustive testing would need 2⁶ = 64 combinations. The saving is the reason MC/DC is practical, and the lab showed the rule holding for three and four conditions.`,
        solvedFeedback: `Right: seven. A decision with six conditions has 64 combinations, but MC/DC needs only n + 1.`,
        misconceptions: [
          { value: 64, tolerance: 0, feedback: `64 is all the combinations, 2⁶. MC/DC chooses the few combinations in which each condition has a pair, and the pairs share tests: n + 1 = 7.` },
          { value: 12, tolerance: 0, feedback: `Twelve is 2n, two tests for each condition with nothing shared. The pairs usually share tests, so the smallest set is n + 1 = 7.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "A line nobody reached: four causes and an honest answer",
      body: `After the tests, the coverage report shows lines or conditions never reached. At Level A and B each one needs an **analysis**, and there are only four answers.

**1. A missing test.** The code is required but no test went there. Write the requirements-based test.

**2. A missing requirement.** The code does something no requirement mentions. Either write the requirement, a **derived** one, and test it, or remove the code.

**3. Dead code.** Code that **cannot** execute, such as a branch whose condition is always false. It must be removed or justified; its presence is a design defect.

**4. Deactivated code.** Code that is present but disabled in this configuration, for example behind a build option. It needs evidence that it stays off, or separate verification where it is on.

Three honest limits:

- The criterion applies to the **source**. At Level A, if the compiler makes branches the source does not show, further verification may be needed.
- Short-circuit evaluation hides conditions: the **masking** form of MC/DC accepts pairs where one condition's effect masks another.
- Coverage proves nothing about the **quality** of the tests. A test with no assertion colours the code green.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "gap-analysis",
        skill: "mcdc",
        objective: "Choose the right response to a coverage gap.",
        prompt: `The coverage report shows these uncovered pieces. Select **every** response that is correct.`,
        options: [
          { id: "a", text: "A guard branch in an interrupt handler checks a state that a requirement says can happen, but no test reached it → write a requirements-based test that creates the state.", correct: true, feedback: `A missing test: the behaviour is required, so a test is owed.` },
          { id: "b", text: "A branch tests \`if (mode > 5)\` but mode is a three-bit field and cannot exceed 7, and the design only ever sets 0 to 3 → treat it as possibly dead code: justify it, or remove it, and record the analysis.", correct: true, feedback: `Code that cannot execute is analysed and either removed or justified. A defensive check may be kept deliberately, but then a requirement and a robustness test should exist.` },
          { id: "c", text: "A function no requirement mentions is never called → write a quick test that calls it so the percentage reaches 100 %.", correct: false, feedback: `That colours the code without verifying anything, and hides a missing requirement. Either write the requirement and test it, or remove the function.` },
          { id: "d", text: "The tool says 100 % statement coverage, so the decision and MC/DC analysis can be skipped at Level A.", correct: false, feedback: `Level A needs statement, decision and MC/DC. Statement coverage is the weakest of the three and can be 100 % with a decision tested in one direction only.` },
        ],
        solvedFeedback: `Right: a required behaviour gets a test; unreachable code is justified or removed; colouring the code without a requirement hides a defect; and the criterion is the one the level names.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "structural-coverage-mcdc-explained",
      intro: `Define the three criteria, show MC/DC on a three-condition decision, and say what you do with a coverage gap.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Writing branch-light code with few conditions per decision makes MC/DC cheap; this is a design habit as well as a test one.
- **Aerospace and UAV systems.** Coverage reports are reviewed with the lead at each test cycle; the gap analysis is where most of the thinking goes.
- **R&D and design.** A decision with many conditions is expensive to verify; splitting it into named intermediate values is a design choice that follows from this.
- **Verification and interviews.** "Show MC/DC on a three-condition decision" is a standard whiteboard question; the truth table and the pairs are the answer.`,
    },
    {
      type: "recap",
      summary: `- Structural coverage measures which code the requirements-based tests reached; it is a highlighter, not a grade.
- Statement coverage is Level C, plus decision coverage at B, plus MC/DC at A.
- MC/DC needs an independence pair per condition: two tests that differ only in that condition and give different outcomes. Smallest set: n + 1 tests.
- Two tests can give 100 % decision coverage and still show no condition independent.
- Each uncovered piece is analysed: missing test, missing requirement, dead code or deactivated code. Never colour the code in to reach a number.`,
      cards: [
        { id: "mcdc-1", front: "What does MC/DC require that decision coverage does not?", back: "Every condition shown to independently affect the outcome: for each condition a pair of tests differing only in it and giving different results. Decision coverage only needs both outcomes seen." },
        { id: "mcdc-2", front: "Minimal MC/DC set for (A && B) || C?", back: "Four tests: TFF, FTF, TTF, TFT (n + 1). A's pair is FTF/TTF, B's TFF/TTF, C's TFF/TFT." },
        { id: "mcdc-3", front: "Which structural coverage is required at each DAL?", back: "C: statement. B: statement and decision. A: statement, decision and MC/DC. D: no structural coverage objective." },
        { id: "mcdc-4", front: "What are the four answers to an uncovered line?", back: "A missing test, a missing requirement (write a derived requirement or remove the code), dead code (remove or justify), or deactivated code (show it stays off)." },
      ],
    },
  ],
};
