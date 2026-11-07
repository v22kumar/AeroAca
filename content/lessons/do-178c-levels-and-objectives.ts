import type { Lesson } from "@/lib/content/schema";

export const do178cLevelsAndObjectives: Lesson = {
  slug: "do-178c-levels-and-objectives",
  moduleId: "do178c",
  format: "arc",
  prerequisites: ["avionics-and-automotive-standards-scope", "writing-a-trustworthy-test-case"],
  title: "DO-178C: what a software level really changes on your desk",
  summary: "Levels A to E, what the failure condition behind each one means, what an objective is, and how the level changes the evidence you must produce. Learn to answer 'what level was it and what did that mean for you?' without overclaiming.",
  durationMinutes: 15,
  whyItMatters: "Almost every avionics software or V&V job advert names DO-178C. The interview question is never 'what does it stand for' but 'what level, and what did that change in your work?'. A precise answer, with no claim of certifying anything yourself, is the difference between a trainee and a colleague.",
  objectives: [
    "Say what each software level A to E means in terms of the failure condition behind it, and who decides it.",
    "Explain what an objective is, and name the process areas that carry objectives.",
    "Describe how the level changes the evidence: independence, structural coverage and the number of objectives.",
    "Phrase your own role under the standard truthfully, and spot the common misstatements about certification.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Level names, the link to failure-condition severity, the supplement list (DO-330, DO-331, DO-332, DO-333), DO-248C and the structural-coverage rule by level follow the public summaries of RTCA DO-178C / EUROCAE ED-12C. The objective counts 71, 69, 62, 26 and 0 are the commonly quoted figures and are labelled as such: the tables in the standard are the authority. No process of any employer is described and no certification claim is made.",
  },
  references: [
    { title: "RTCA DO-178C / EUROCAE ED-12C: Software Considerations in Airborne Systems and Equipment Certification", note: "Levels, objectives (Annex A tables), the processes." },
    { title: "RTCA DO-248C: Supporting Information for DO-178C and DO-278A", note: "Discussion papers and FAQs; free summaries exist." },
    { title: "SAE ARP4754A and ARP4761", note: "Where the failure condition and the level come from: the system safety assessment." },
    { title: "Lesson: Avionics and automotive standards, scope only", note: "The wider map this lesson goes deeper into." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "'It is a Level C box'",
      body: `You join a team that tests the software for a cockpit display unit. In the first stand-up, the lead says: "It is Level C, so we do not need MC/DC, but every test must trace to a requirement." You nod, then wonder what you just agreed to.

What is Level C? Who decided it? What would change if it were Level A? And why does the lead care about MC/DC but not about the number of lines of code?

By the end of this lesson, that one sentence from the lead should unpack into a list of real work items, and you should know which parts of it are your job.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The level is the cost of being wrong",
      body: `Think of building rules. A garden shed, a house and a bridge are all built, but nobody inspects a shed the way they inspect a bridge. The more people could be hurt if it fails, the more proof the builder must show.

Avionics software works the same way. The more severe the worst thing the software could cause, the more evidence the supplier must hand over. The level is just a label for how much proof that is.

Two points often missed:

- The level is about the **consequence of failure**, not about how complicated the code is. A tiny routine can be at the top level.
- The **software team does not choose it**. The people who study the whole aircraft function decide how bad a failure would be, and the level follows from that.

So "Level C" tells you what the worst credible failure would do, and therefore how much proof is expected.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Levels A to E, in one table",
      body: `DO-178C is the process standard for airborne software. It names five software levels, often called the **DAL** (development assurance level).

| Level | Worst failure condition | Commonly quoted objectives |
|---|---|---|
| A | Catastrophic: may prevent continued safe flight and landing | 71 |
| B | Hazardous: large reduction in safety margins, serious injury | 69 |
| C | Major: significant reduction in safety margins or workload | 62 |
| D | Minor: slight reduction, nuisance | 26 |
| E | No effect on safety | 0 |

An **objective** is a thing the evidence must show, for example "test cases are traceable to requirements" or "the code meets its low-level requirements". It is not an instruction on how, only on what must be demonstrated.

The counts above are the figures usually quoted from the standard's tables; always check the document for the exact list. The lower the level, the fewer objectives, and several of the objectives that remain are held to a weaker standard.

Level E software has no objectives, so a statement such as "the display unit is DAL E" means the standard asks nothing of it.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "What each level asks for",
      diagram: "do178-levels",
      alt: "Table of the five DO-178C software levels A to E with failure condition, objective counts and the structural coverage required at each level.",
      caption: "Level, failure condition, commonly quoted objective count, and structural coverage: statement at C, plus decision at B, plus MC/DC at A, with coupling analysis at A to C.",
      body: `Read the last column from the bottom up. Each level up adds a coverage criterion on top of the one below. That column is what the lead meant by "no MC/DC at C".`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Where the objectives live",
      body: `The objectives are grouped by the **process** they belong to. A verification engineer lives mainly in the fourth one, but needs to know the others exist.

- **Planning**: the plans say how the project will meet the objectives (software development, verification, configuration management, quality assurance) and the **PSAC** (Plan for Software Aspects of Certification) agrees this with the certification authority.
- **Development**: requirements, design, code and integration.
- **Verification**: reviews, analyses and tests, plus **structural coverage**.
- **Configuration management and quality assurance**: baselines, change control, problem reports and audits.
- **Certification liaison**: the reviews with the authority at stages of involvement.

Two ideas hold the whole set together. The first is **traceability**: every requirement traces down to code and up to tests. The second is **requirements-based testing**: tests come from requirements, and coverage is measured afterwards to find what the tests missed.

The software is never certified by itself. It is accepted as part of a **system**, which is part of an aircraft or engine.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: from failure condition to a work list",
      body: `A team has two functions in one box.

**Function 1: cabin reading-light control.** The system safety assessment says its failure is a nuisance at worst. Level: **D** (minor). Work: a short list of objectives, requirements and tests, no structural coverage objective.

**Function 2: an attitude display used for primary flight.** A wrong or frozen display could mislead the crew in a way that leaves them unable to fly safely. Suppose the assessment calls this **hazardous**. Level: **B**.

**What changes for the verification engineer at B, compared with D?**

1. More objectives apply, and more of them must be done **with independence**: a person other than the author checks.
2. Every requirement needs tests, **and** the tests must reach 100 % **statement** and **decision** coverage of the code, with each uncovered piece explained.
3. Data and control coupling between components must be analysed.
4. All of it traced and under change control.

**What did not change?** The need for clear, testable requirements. A vague requirement is a defect at every level.

**Your sentence in an interview:** "On a Level B function, my tests came from requirements, I ran them on a target, and I reviewed the coverage report and analysed the gaps."`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "dal-from-failure-guided",
        skill: "do178c",
        objective: "Assign the software level that follows from a failure condition (guided).",
        prompt: `The system safety assessment concludes that loss of a flap-position indication would cause a **major** failure condition: a significant reduction in safety margins and a significant increase in crew workload, but no loss of control. Which software level follows?`,
        hints: [
          `Read the table: each failure condition has one level next to it.`,
          `Catastrophic is A, hazardous is B. Where does major come next?`,
          `Major sits between hazardous and minor.`,
        ],
        options: [
          { id: "a", text: "Level A", correct: false, feedback: `Level A is for catastrophic conditions: loss of the aircraft or its occupants. A major condition is two steps down.` },
          { id: "b", text: "Level B", correct: false, feedback: `Level B is for hazardous conditions: a large reduction in safety margins or serious injury. Major is one step less severe.` },
          { id: "c", text: "Level C", correct: true, feedback: `Right. Major maps to Level C: statement coverage and 62 commonly quoted objectives. Note that you did not choose the level; the safety assessment did.` },
          { id: "d", text: "Level D", correct: false, feedback: `Level D is minor: a slight reduction in safety margins. Major is more serious than that.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "How the level changes your evidence",
      body: `Three things move as the level goes up. Name them in an answer and you sound like you have done the work.

**1. The number of objectives.** Fewer at the low levels, as in the table.

**2. Independence.** At the higher levels, more objectives must be met by someone other than the person who produced the work. The reviewer of a requirement is not its author; the person who verifies a test result is not the one who wrote the test. Independence is about people and tools, not about a different room.

**3. Structural coverage.** After the requirements-based tests have run, you measure which code they exercised:

- Level C: every **statement** executed.
- Level B: also every **decision** taken both ways.
- Level A: also **MC/DC**, each condition shown to change the outcome on its own.

At A to C there is also **data coupling and control coupling** analysis: do the tests exercise how the components pass data and control to each other.

**What does not change:** the process still starts from requirements, traces, reviews, controls change and files problem reports. The level changes the amount and strength of evidence, not the nature of the work.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "dal-statements",
        skill: "do178c",
        objective: "Separate true statements about levels from common misstatements.",
        prompt: `Select **every** statement that is true.`,
        options: [
          { id: "a", text: "The software level follows from the failure condition identified by the system safety assessment, not from the size of the code.", correct: true, feedback: `True. A small routine can be Level A and a large one Level D.` },
          { id: "b", text: "At Level C the tests must still be traced to requirements; only the structural coverage criterion is lighter than at A.", correct: true, feedback: `True. The requirements-based approach applies at every level with objectives; what grows is the coverage criterion and the independence.` },
          { id: "c", text: "A Level A function is exempt from statement coverage because MC/DC replaces it.", correct: false, feedback: `False. MC/DC is added on top of decision and statement coverage at Level A, it does not replace them.` },
          { id: "d", text: "Passing all the tests proves the software complies at its level.", correct: false, feedback: `False. Passing tests is one objective. Compliance needs plans, reviews, traceability, coverage and configuration evidence as well.` },
        ],
        solvedFeedback: `Right: the level comes from the consequence of failure; requirements-based testing applies at every level; MC/DC adds to the lower criteria; tests alone are not compliance.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "The traps in how people talk about it",
      body: `Four statements an interviewer may use to test you, and why each is wrong or incomplete.

**"The software is DO-178C certified."** Software is not certified alone. An aircraft, engine or equipment is certified or approved; the software is shown to **comply** with the objectives as part of that system. Say "developed and verified to DO-178C Level B".

**"I am DO-178C certified."** No such personal certificate exists. Say what you did: "I wrote and ran requirements-based test procedures under a DO-178C process."

**"The level came from the code."** It comes from the system safety assessment (ARP4754A and ARP4761), sometimes lowered by an architecture with independent protection. The software team receives it; it does not pick it.

**"DO-178C is a testing standard."** It is a process standard. Testing is one part. The supplements add detail for models (DO-331), object orientation (DO-332), formal methods (DO-333), and **tool qualification** (DO-330), which applies when a tool could hide an error that nothing else would catch.

For wording questions the companion document DO-248C collects clarifications and discussion.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "dal-claim-wording",
        skill: "do178c",
        objective: "Choose the truthful description of your own role.",
        prompt: `You spent two years writing and running test procedures for a Level B function, reviewed by a colleague, with a coverage report analysed by the lead. Which sentence belongs on your CV?`,
        options: [
          { id: "a", text: "DO-178C Level B certified verification engineer.", correct: false, feedback: `There is no personal certification, and the wording claims more than the work. An interviewer will probe it and the answer will not hold.` },
          { id: "b", text: "Wrote and executed requirements-based test procedures for a DAL B function under a DO-178C process; contributed to coverage analysis with the lead.", correct: true, feedback: `Yes. It names the work, the level and the process, and states your part in the coverage analysis honestly: you contributed, the lead owned it.` },
          { id: "c", text: "Responsible for DO-178C compliance of the avionics software.", correct: false, feedback: `That claims ownership of the whole compliance case, which sits with the project and its quality and certification roles. It invites questions you cannot answer.` },
          { id: "d", text: "Familiar with DO-178C.", correct: false, feedback: `True but empty. It hides real, specific work and does not distinguish you from someone who read a summary.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "do-178c-levels-explained",
      intro: `Explain what a software level is, who sets it, what changes between levels, and phrase your own role honestly.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Your code is written under coding standards and traced to low-level requirements; the level tells you how strictly, and whether structural coverage will be measured on it.
- **Aerospace and UAV systems.** Every integration and test plan names the level of the functions it touches; the level sets the review and independence rules you plan around.
- **R&D and design.** A new function starts with a failure-condition question: the answer limits what you may reuse and what you must prove.
- **Verification and interviews.** "What level was it and what did that change?" is the standard opening question; the answer is the list in this lesson.`,
    },
    {
      type: "recap",
      summary: `- The software level (A to E) follows from the worst failure condition set by the system safety assessment: catastrophic, hazardous, major, minor, no effect.
- An objective is something the evidence must show. Commonly quoted counts: 71, 69, 62, 26, 0; the tables in the standard are the authority.
- The level changes the number of objectives, how many need independence, and the structural coverage criterion: statement (C), plus decision (B), plus MC/DC (A).
- The software is not certified alone and no person is DO-178C certified: say what you did, at what level, under what process.`,
      cards: [
        { id: "d178-1", front: "Who decides a software's DAL, and from what?", back: "The system safety assessment (ARP4754A / ARP4761) decides the worst failure condition; the level follows from it: catastrophic A, hazardous B, major C, minor D, no effect E. The software team receives it." },
        { id: "d178-2", front: "What does the level change in your verification work?", back: "The number of objectives, how many need independence, and the structural coverage criterion: statement at C, plus decision at B, plus MC/DC at A, with coupling analysis at A to C." },
        { id: "d178-3", front: "Why is 'DO-178C certified software' a wrong phrase?", back: "Software is not certified alone: aircraft and equipment are certified, and software is shown to comply with the objectives as part of the system. Say 'developed and verified to DO-178C Level X'." },
        { id: "d178-4", front: "What is an objective in DO-178C?", back: "A statement of what the evidence must show, such as 'test cases are traceable to requirements'. It names the result, not the method." },
      ],
    },
  ],
};
