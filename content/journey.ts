import type { JourneyDay } from "@/lib/content/schema";

/**
 * The 30-day journey for an experienced avionics integration and V&V engineer who is moving
 * towards avionics and UAV systems integration, embedded, hardware validation and test automation
 * roles. It follows the career track (modules 17 to 25): say what you did, DO-178C verification,
 * avionics buses, redundancy, real-time analysis, benches and fault injection, test automation,
 * on-target debugging, control basics, then mock interviews and a plan.
 *
 * Every day is a 15 to 45 minute session built only from published content. There is no calendar
 * pressure: the learner moves on when the day is complete. Embedded and electronics foundations
 * (modules 1 to 9) are not in these 30 days; the diagnostic points to them where needed and day 30
 * plans them.
 */
export const journey: JourneyDay[] = [
  {
    day: 1,
    title: "Say exactly what you did",
    focus: "Answer 'what did you own?' and explain a gap or a short contract in under a minute, truthfully.",
    block: 1,
    items: [
      {"kind": "lesson", "slug": "career-gap-contract-and-ownership"},
      {"kind": "interview", "questionIds": ["what-did-you-own", "career-gap-or-short-contract"]},
      {"kind": "apply", "id": "ownership-sentences", "title": "Write three sentences that say what you did, contributed to, and owned", "detail": "One sentence per level on your most recent project: did, contributed to, owned. Use the verbs you can defend with an example. No numbers you cannot explain.", "minutes": 8},
    ],
  },
  {
    day: 2,
    title: "What a software level changes",
    focus: "DO-178C levels A to E: who sets them, what an objective is, what changes on your desk.",
    block: 1,
    items: [
      {"kind": "lesson", "slug": "do-178c-levels-and-objectives"},
      {"kind": "interview", "questionIds": ["do-178c-levels-explained"]},
      {"kind": "review"},
    ],
  },
  {
    day: 3,
    title: "From one requirement to the right tests",
    focus: "Equivalence classes, boundaries and robustness cases from a single requirement, and why expected results never come from the code.",
    block: 1,
    items: [
      {"kind": "lesson", "slug": "requirements-based-testing-hlr-llr"},
      {"kind": "mission", "slug": "the-requirement-nobody-could-test"},
      {"kind": "interview", "questionIds": ["requirements-based-testing-explained"]},
    ],
  },
  {
    day: 4,
    title: "Show MC/DC on a whiteboard",
    focus: "Statement, decision and MC/DC, with the independence pairs for a three-condition decision and what to do with an uncovered line.",
    block: 1,
    items: [
      {"kind": "lesson", "slug": "structural-coverage-and-mcdc"},
      {"kind": "interview", "questionIds": ["structural-coverage-mcdc-explained"]},
      {"kind": "review"},
    ],
  },
  {
    day: 5,
    title: "A requirement changed late: what do you redo?",
    focus: "Traceability, problem reports and change impact, written down so an auditor can follow it.",
    block: 1,
    items: [
      {"kind": "lesson", "slug": "traceability-problem-reports-and-change-impact"},
      {"kind": "interview", "questionIds": ["change-impact-and-traceability"]},
      {"kind": "apply", "id": "application-1", "title": "Send one application today", "detail": "Pick a role that lists systems integration, V&V, test automation or embedded. Applications run in parallel with learning, not after it.", "minutes": 20},
    ],
  },
  {
    day: 6,
    title: "The 1553 word and the message",
    focus: "The command, status and data words, the three message formats and what the bus controller does.",
    block: 2,
    items: [
      {"kind": "lesson", "slug": "mil-std-1553b-the-word-and-the-message"},
      {"kind": "interview", "questionIds": ["mil-1553-word-walk"]},
      {"kind": "review"},
    ],
  },
  {
    day: 7,
    title: "1553 on a real rig",
    focus: "Schedule, bus load and reading a monitor log: which of eight messages needs explaining and why.",
    block: 2,
    items: [
      {"kind": "lesson", "slug": "mil-std-1553b-controller-terminals-and-faults"},
      {"kind": "interview", "questionIds": ["mil-1553-bus-fault-triage"]},
      {"kind": "review"},
    ],
  },
  {
    day: 8,
    title: "ARINC 429: believe the status first",
    focus: "One transmitter, a 32-bit word, labels and the sign/status matrix that says whether to use the number.",
    block: 2,
    items: [
      {"kind": "lesson", "slug": "arinc-429-words-labels-and-ssm"},
      {"kind": "interview", "questionIds": ["arinc-429-word-and-ssm"]},
      {"kind": "review"},
    ],
  },
  {
    day: 9,
    title: "Differential links and frames you can trust",
    focus: "RS-422 and RS-485: termination, bias, turnaround and a CRC that the receiver must act on.",
    block: 2,
    items: [
      {"kind": "lesson", "slug": "rs-422-rs-485-and-framed-serial-with-crc"},
      {"kind": "mission", "slug": "two-boards-one-bus-no-agreement"},
      {"kind": "interview", "questionIds": ["rs-422-485-link-design"]},
    ],
  },
  {
    day: 10,
    title: "Telemetry you can audit",
    focus: "Design a frame, parse it with struct, and count what you lose. Then say it aloud.",
    block: 2,
    items: [
      {"kind": "lesson", "slug": "telemetry-packets-and-parsing-with-struct"},
      {"kind": "interview", "questionIds": ["telemetry-packet-design"]},
      {"kind": "apply", "id": "mock-interview-1", "title": "Record yourself answering two questions", "detail": "Phone voice memo, 90 seconds each: the DO-178C level question and the 1553 monitor-log question. Listen back once and note one thing to tighten.", "minutes": 15},
    ],
  },
  {
    day: 11,
    title: "Why flight control is redundant",
    focus: "Fail-operational, fail-passive and fail-safe; duplex, triplex, quad; and the common-mode fault that redundancy does not cure.",
    block: 3,
    items: [
      {"kind": "lesson", "slug": "why-flight-control-is-redundant"},
      {"kind": "interview", "questionIds": ["redundancy-architecture-explained"]},
      {"kind": "review"},
    ],
  },
  {
    day: 12,
    title: "The voter and the monitor",
    focus: "Mid-value voting, miscompare limits, persistence and isolation, run on a simulated three-channel voter.",
    block: 3,
    items: [
      {"kind": "lesson", "slug": "voting-monitors-and-failover"},
      {"kind": "interview", "questionIds": ["voter-miscompare-and-isolation"]},
      {"kind": "review"},
    ],
  },
  {
    day: 13,
    title: "Test the cross-channel link",
    focus: "Integrity, latency, dropout and failover: the test matrix, and what a pulled cable alone does not prove.",
    block: 3,
    items: [
      {"kind": "lesson", "slug": "testing-a-cross-channel-link"},
      {"kind": "interview", "questionIds": ["cross-channel-link-test-plan"]},
      {"kind": "apply", "id": "application-2", "title": "Send one application", "detail": "Aim at a systems-integration, flight-control test or hardware-validation role. Tailor one line to the role, using only work you can defend.", "minutes": 20},
    ],
  },
  {
    day: 14,
    title: "Tasks, priorities and the tick",
    focus: "What the scheduler does, and why the high-priority task never ran.",
    block: 3,
    items: [
      {"kind": "lesson", "slug": "tasks-the-scheduler-and-the-tick"},
      {"kind": "mission", "slug": "the-task-that-never-runs"},
      {"kind": "interview", "questionIds": ["scheduler-tick-and-task-states"]},
    ],
  },
  {
    day: 15,
    title: "Will it meet its deadline?",
    focus: "Utilisation, the rate-monotonic bound and a response-time iteration with blocking, then a first block review.",
    block: 3,
    items: [
      {"kind": "lesson", "slug": "will-it-meet-its-deadline"},
      {"kind": "interview", "questionIds": ["is-it-schedulable", "do-178c-levels-explained"]},
      {"kind": "review"},
    ],
  },
  {
    day: 16,
    title: "The 10 ms frame and what overran",
    focus: "Minor and major frames, rate groups, overrun detection and a shed policy that is a decision, not a fix.",
    block: 4,
    items: [
      {"kind": "lesson", "slug": "frame-based-executives-and-overruns"},
      {"kind": "interview", "questionIds": ["frame-overrun-handling"]},
      {"kind": "review"},
    ],
  },
  {
    day: 17,
    title: "Shared memory without tearing",
    focus: "Dual-port RAM, sequence-counter handshakes and the torn read a naive write allows.",
    block: 4,
    items: [
      {"kind": "lesson", "slug": "shared-memory-dpram-handshakes"},
      {"kind": "interview", "questionIds": ["dpram-handshake-design"]},
      {"kind": "review"},
    ],
  },
  {
    day: 18,
    title: "Prove the timing, do not hope",
    focus: "Measuring WCET and jitter on a target, and why average CPU load proves nothing.",
    block: 4,
    items: [
      {"kind": "lesson", "slug": "measuring-wcet-and-jitter"},
      {"kind": "interview", "questionIds": ["wcet-measurement-claim"]},
      {"kind": "apply", "id": "application-3", "title": "Send one application", "detail": "Roles that mention real-time, determinism or on-target test. Name the one measurement from this block you could explain at a whiteboard.", "minutes": 20},
    ],
  },
  {
    day: 19,
    title: "Build a frame parser, then break it",
    focus: "A parser written clean, then two broken variants you diagnose from the code before you run them.",
    block: 4,
    items: [
      {"kind": "lesson", "slug": "building-a-frame-parser-and-breaking-it"},
      {"kind": "interview", "questionIds": ["frame-parser-robustness"]},
      {"kind": "review"},
    ],
  },
  {
    day: 20,
    title: "Deadlock and lock ordering",
    focus: "Four conditions, lock ordering and a mock interview that starts the second half.",
    block: 4,
    items: [
      {"kind": "lesson", "slug": "deadlock-and-lock-ordering"},
      {"kind": "interview", "questionIds": ["deadlock-lock-ordering"]},
      {"kind": "apply", "id": "mock-interview-2", "title": "Record yourself answering two more questions", "detail": "Voice memo, 90 seconds each: the voter question and the schedulability question. Compare with the rubric after you listen.", "minutes": 15},
    ],
  },
  {
    day: 21,
    title: "What the rig is and what it is not",
    focus: "HIL architecture and bench design from an interface document, and what is simulated.",
    block: 5,
    items: [
      {"kind": "lesson", "slug": "hil-architecture-and-bench-design"},
      {"kind": "interview", "questionIds": ["hil-rig-describe-and-limits"]},
      {"kind": "review"},
    ],
  },
  {
    day: 22,
    title: "From an FMEA to fault injection",
    focus: "Turn failure modes into injected CRC, timing, stuck-at and babbling faults, and assert detection.",
    block: 5,
    items: [
      {"kind": "lesson", "slug": "from-fmea-to-fault-injection"},
      {"kind": "interview", "questionIds": ["fmea-to-fault-injection-test-plan"]},
      {"kind": "review"},
    ],
  },
  {
    day: 23,
    title: "Logs to evidence",
    focus: "Parse a bench log, count what passed, failed and was missing, and write a report a reviewer can read.",
    block: 5,
    items: [
      {"kind": "lesson", "slug": "logs-to-evidence"},
      {"kind": "interview", "questionIds": ["logs-to-evidence-report"]},
      {"kind": "review"},
    ],
  },
  {
    day: 24,
    title: "pytest for hardware tests",
    focus: "Fixtures, parametrisation and markers for hardware versus simulation, then a flaky test diagnosis.",
    block: 5,
    items: [
      {"kind": "lesson", "slug": "pytest-for-hardware-tests"},
      {"kind": "mission", "slug": "the-flaky-automated-test"},
      {"kind": "interview", "questionIds": ["pytest-hardware-test-structure"]},
    ],
  },
  {
    day: 25,
    title: "Draw the architecture of your automation",
    focus: "Layers of a test framework and the honest way to measure the time it saved.",
    block: 5,
    items: [
      {"kind": "lesson", "slug": "architecture-of-a-test-framework"},
      {"kind": "interview", "questionIds": ["test-framework-architecture-draw-it"]},
      {"kind": "apply", "id": "application-4", "title": "Send one application", "detail": "Test-automation and validation roles. Keep one sentence ready that says which layer of a framework you wrote and which you used.", "minutes": 20},
    ],
  },
  {
    day: 26,
    title: "Debug on the chip",
    focus: "The debug probe, breakpoints and watchpoints, and reading a peripheral under GDB.",
    block: 6,
    items: [
      {"kind": "lesson", "slug": "debug-probe-and-gdb-on-target"},
      {"kind": "interview", "questionIds": ["debug-probe-gdb-explained"]},
      {"kind": "review"},
    ],
  },
  {
    day: 27,
    title: "From a HardFault to a line of source",
    focus: "Decode the fault registers and the stacked PC, then investigate a board that resets every second.",
    block: 6,
    items: [
      {"kind": "lesson", "slug": "hardfault-analysis"},
      {"kind": "mission", "slug": "the-board-that-resets-every-second"},
      {"kind": "interview", "questionIds": ["hardfault-analysis-explained"]},
    ],
  },
  {
    day: 28,
    title: "The control loop in plain words",
    focus: "PID without mystery on a simulated plant, and a portfolio outline you can defend.",
    block: 6,
    items: [
      {"kind": "lesson", "slug": "control-loop-and-pid"},
      {"kind": "interview", "questionIds": ["pid-explained-to-a-new-graduate"]},
      {"kind": "apply", "id": "portfolio-outline", "title": "Write a one-page outline of the portfolio project", "detail": "Problem, what you built, what is simulated and what is hardware, one result with how it was measured. Use the portfolio screen. Label simulation as simulation.", "minutes": 12, "href": "/portfolio"},
    ],
  },
  {
    day: 29,
    title: "Mock interview",
    focus: "Claims, metrics and negotiation, then a timed mock across the whole track.",
    block: 6,
    items: [
      {"kind": "lesson", "slug": "claims-metrics-and-negotiation"},
      {"kind": "interview", "questionIds": ["how-did-you-measure-it", "do-178c-levels-explained", "voter-miscompare-and-isolation", "what-did-you-own"], "mock": true},
    ],
  },
  {
    day: 30,
    title: "Review and plan the next 30",
    focus: "What is solid, what is shaky, and what comes next: embedded foundations, real-time depth or control, chosen from your own evidence.",
    block: 6,
    items: [
      {"kind": "review"},
      {"kind": "apply", "id": "next-30-plan", "title": "Write your next 30-day plan from the weak-area list", "detail": "Use the Progress page: every wrong attempt and every shaky rehearsal is a candidate. Pick the pathway you want (embedded and electronics R&D, or aerospace and systems) and choose the modules from the curriculum.", "minutes": 15},
    ],
  },
];

export const journeyBlocks: Record<number, { days: string; focus: string }> = {
  1: { days: "1–5", focus: "Say what you did; DO-178C verification" },
  2: { days: "6–10", focus: "Avionics buses and telemetry" },
  3: { days: "11–15", focus: "Redundancy and real-time analysis" },
  4: { days: "16–20", focus: "Timing, shared memory and parsers" },
  5: { days: "21–25", focus: "Benches, fault injection and test automation" },
  6: { days: "26–30", focus: "On-target debug, control basics, mock interviews and your plan" },
};
