import type { Lesson } from "@/lib/content/schema";

export const presentingAPortfolioProjectHonestly: Lesson = {
  slug: "presenting-a-portfolio-project-honestly",
  moduleId: "interviews",
  title: "Presenting a portfolio project without inflating it",
  summary: "A portfolio project is evidence only if it is described exactly. Learn the one-page outline that interviewers can read in two minutes, how to mark what ran on hardware and what was simulated, which numbers to include, and the five phrases that turn a good project into a doubtful one.",
  durationMinutes: 10,
  whyItMatters: "For a candidate moving between industries, a self-built project is often the only artefact an interviewer can inspect. Described precisely, it shows design, test and honesty at once. Described loosely, it raises the question of what else is loose.",
  objectives: [
    "Write a one-page project outline: problem, constraints, what was built, what is simulated versus on hardware, evidence, what is next.",
    "Choose the numbers and artefacts that make a project verifiable: tests, logs, fault-injection results, measurements.",
    "Replace inflating phrases with exact ones.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The outline structure follows what engineering hiring panels commonly ask for in a project walkthrough. The simulated-versus-hardware rule is the academy's own and applies to its portfolio track.",
  },
  references: [
    { title: "docs/PRODUCT_ROADMAP.md (this academy): portfolio track definition", note: "STM32 sensor monitoring and fault detection; simulated path and optional hardware path separated." },
    { title: "Lesson: Writing a test case that a reviewer can trust", note: "The evidence standard the outline reuses." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The project that was better than its description",
      body: `A candidate's CV says "Developed an STM32-based sensor monitoring system with watchdog and fault detection." The interviewer asks what the fault detection detects, how it was tested, and what hardware it ran on. The answers: an open-sensor range check and a stuck-value timer; tested by unplugging the sensor and watching an LED; on a development board with one sensor.

That is a genuinely good small project. The CV line made it sound like a product, so each true answer felt like a retreat. Written as it was, "Built a one-sensor STM32 monitor with an independent watchdog, open-sensor and stuck-value detection, and 14 fault-injection test cases; runs on a Nucleo board, with the sensor model also simulated for CI", the same project would have been the strongest thing on the page.`,
    },
    {
      type: "concept",
      title: "The one-page outline",
      body: `Six headings, each a few lines, in this order:

1. **Problem and scope.** What the thing does, for whom, and what it deliberately does not do. One sentence of each. "Monitors one temperature sensor over I2C and raises an alarm output within 2 s of a sensor fault. Not a product; no enclosure, no certification."
2. **Constraints and decisions.** The two or three choices that shaped it and why: the MCU, the bus, the watchdog strategy, the timing budget. Decisions with reasons are what interviewers probe, so give the reasons first.
3. **What was built.** Architecture in five lines: tasks or loop, drivers, detection logic, outputs. A block diagram is worth more than a paragraph.
4. **Simulated versus on hardware.** A table. Each capability has a row: *runs on hardware (which board), runs in simulation (what simulates the sensor and the fault), not implemented*. This table is the honesty of the whole document, and it is where an interviewer's trust is won or lost.
5. **Evidence.** Numbers and artefacts: test cases (how many, what they cover, how many fault injections), measured results (alarm latency from a logic-analyser capture), logs, a CI run. Each one something the interviewer could ask to see.
6. **What is next, and what I would do differently.** Two or three items. This is where judgment shows, and where you can mention the limits you know about before someone else finds them.

The whole page uses the test-case standard from day 12: an expected result that an instrument shows, with a method. "Alarm asserts within 2 s" is a requirement; "alarm latency measured 310 to 360 ms over 15 injected faults, logic analyser on the sensor line and the alarm output" is evidence.`,
      deeper: {
        title: "What the simulated-versus-hardware table looks like",
        body: `| Capability | Hardware | Simulation | Status |
|---|---|---|---|
| I2C sensor read at 10 Hz | Nucleo-F446 + TMP102 | Python sensor model over a virtual bus | Both |
| Open-sensor detection | Tested by disconnecting the sensor | Model returns NACK | Both |
| Stuck-value detection | Not tested on hardware (needs a heat source) | Model holds a value | Simulation only |
| Watchdog restart on hung loop | Tested with a debugger halt, RCC_CSR checked | n/a | Hardware only |

Every cell is a sentence you can defend.`,
      },
    },
    {
      type: "example",
      title: "Worked example: the same project, inflated and exact",
      body: `| Inflating phrase | Exact phrase |
|---|---|
| "Production-ready firmware" | "Runs on a Nucleo board; no enclosure, no EMC, no production test." |
| "Robust fault detection" | "Open-sensor (NACK) and stuck-value (no change for 5 s) detection; 14 fault-injection test cases, all passing on the simulator, 9 of them also on hardware." |
| "Fully tested" | "Unit tests for the detection logic (22 cases) and fault-injection tests on the simulator; no environmental or long-duration testing." |
| "We designed" (alone) | "I designed and wrote the firmware; the sensor model was adapted from the vendor's register description." |
| "Industry standard" | "Alarm latency requirement of 2 s derived by analogy to a hazard-analysis argument; not against any standard." |

The exact column is longer and better. It also contains three admissions (no EMC, 5 hardware tests short, no standard), each of which an interviewer would have found anyway, and each of which now reads as judgment rather than as a gap.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "inflating-phrase",
        skill: "communication",
        objective: "Spot the inflating phrase.",
        prompt: `Which description of a Nucleo-based sensor monitor project would survive follow-up questions?`,
        options: [
          { id: "a", text: "\"Production-grade STM32 sensor monitoring platform with comprehensive fault detection.\"", correct: false, feedback: `'Production-grade', 'platform' and 'comprehensive' each invite a question the project cannot answer.` },
          { id: "b", text: "\"One-sensor STM32 monitor on a Nucleo board with open-sensor and stuck-value detection and an independent watchdog; 14 fault-injection tests, 9 run on hardware, alarm latency measured 310 to 360 ms.\"", correct: true, feedback: `Scope, board, detections, evidence with numbers and a boundary. Everything is checkable.` },
          { id: "c", text: "\"Designed an avionics-style monitoring system following DO-178C principles.\"", correct: false, feedback: `'Avionics-style' and 'DO-178C principles' claim a rigour the project did not undergo.` },
          { id: "d", text: "\"Built a sensor project.\"", correct: false, feedback: `Honest but empty; it gives the interviewer nothing to examine.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "outline-evidence",
        skill: "communication",
        objective: "Choose verifiable evidence.",
        prompt: `Select **every** item that belongs in the evidence section of a portfolio outline.`,
        options: [
          { id: "a", text: "Number of fault-injection test cases, and how many ran on hardware versus simulation.", correct: true, feedback: `Countable and checkable.` },
          { id: "b", text: "Measured alarm latency with the instrument and the number of trials.", correct: true, feedback: `A measurement with a method.` },
          { id: "c", text: "\"Extensively tested.\"", correct: false, feedback: `An adjective, not evidence.` },
          { id: "d", text: "A link to the repository with the CI run that executes the simulator tests.", correct: true, feedback: `The interviewer can open it.` },
          { id: "e", text: "A statement that the design follows industry best practice.", correct: false, feedback: `Unverifiable; replace with the specific decision and its reason.` },
        ],
        solvedFeedback: `Right. Counts, measurements with methods, and artefacts someone can open.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "outline-order",
        skill: "communication",
        objective: "Order the one-page outline.",
        prompt: `Put the six headings of the one-page project outline in order.`,
        items: [
          { id: "problem", text: "Problem and scope, including what it does not do", why: "Frames everything that follows." },
          { id: "constraints", text: "Constraints and the decisions they forced, with reasons", why: "What interviewers probe." },
          { id: "built", text: "What was built: architecture in five lines or a block diagram", why: "The thing itself." },
          { id: "simvshw", text: "Simulated versus on hardware, as a table", why: "The honesty of the document." },
          { id: "evidence", text: "Evidence: test counts, measurements with method, artefacts", why: "Verifiable claims." },
          { id: "next", text: "What is next and what I would do differently", why: "Judgment and known limits." },
        ],
        correctOrder: ["problem", "constraints", "built", "simvshw", "evidence", "next"],
        solvedFeedback: `Correct. Scope, decisions, build, the honesty table, evidence, judgment.`,
      },
    },
    {
      type: "interview",
      questionId: "portfolio-honest",
      intro: `Walk through your own outline in two minutes using the six headings. Say the simulated-versus-hardware boundary out loud before you are asked.`,
    },
    {
      type: "recap",
      summary: `- One-page outline: problem and scope; constraints and decisions; what was built; simulated vs hardware table; evidence; what is next.
- Evidence means counts, measurements with instrument and trials, and artefacts someone can open.
- Inflating phrases (production-ready, robust, fully tested, industry standard, "we") are replaced by exact ones with boundaries.
- Admissions stated first read as judgment; discovered later they read as gaps.`,
      cards: [
        { id: "port-1", front: "Six headings of a portfolio outline?", back: "Problem and scope; constraints and decisions; what was built; simulated vs hardware; evidence; what is next." },
        { id: "port-2", front: "What counts as evidence in a project description?", back: "Test counts with their split between hardware and simulation, measurements with instrument and trial count, and artefacts (repo, CI run, log) the interviewer can open." },
        { id: "port-3", front: "Replace 'robust fault detection'.", back: "Name the detections and the proof: 'open-sensor and stuck-value detection; 14 fault-injection tests, 9 on hardware'." },
        { id: "port-4", front: "Why state the simulated-versus-hardware boundary first?", back: "An interviewer will find it; stated first it shows judgment, discovered later it undermines every other claim." },
      ],
    },
  ],
};
