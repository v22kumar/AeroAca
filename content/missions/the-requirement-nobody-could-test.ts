import type { Mission } from "@/lib/content/schema";

export const theRequirementNobodyCouldTest: Mission = {
  slug: "the-requirement-nobody-could-test",
  moduleId: "verification",
  title: "The requirement nobody could test",
  summary: "A verification review stalls on one sentence. Turn an untestable requirement into a measurable one with a traceable test, without inventing numbers.",
  durationMinutes: 10,
  budgetMinutes: 40,
  whyItMatters: "Rewriting a vague requirement into something a test can fail is a daily task in verification roles and a favourite interview exercise. The trap is making up the number yourself.",
  relatedLesson: "writing-a-trustworthy-test-case",
  scenario: `**Project:** an industrial sensor node with a safety-relevant over-temperature alarm output.

**Requirement under review:** *REQ-SYS-041: "The system shall respond quickly to sensor faults."*

**Test procedure as written:** *"Disconnect the sensor and verify that the system responds quickly. Expected: pass."*

The customer's safety engineer has rejected the test. Your lead has asked you to resolve it before Friday's review. The hazard analysis, the architecture document and the bench are available. Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Produce a requirement that can be verified and a test that verifies it, with the number coming from the right place.`,
  goal: `Replace the untestable requirement with a measurable one whose limit is justified by the hazard analysis, and trace a test with a method to it.`,
  actions: [
    {
      id: "read-req",
      label: "Read the requirement and the rejected test closely",
      category: "document",
      costMinutes: 3,
      assessment: "useful",
      result: `"Quickly" has no quantity, no condition (which faults? which sensor?) and no measurement method. The test's expected result, "pass", cannot fail. The reviewer's rejection is correct.`,
      assessmentNote: `Naming exactly what is missing (quantity, condition, method) is the first step; it tells you what the rewrite must supply.`,
      evidence: "defect-named",
    },
    {
      id: "hazard-analysis",
      label: "Read the hazard analysis for the over-temperature alarm",
      category: "document",
      costMinutes: 6,
      assessment: "key",
      result: `Hazard H-07: "Undetected sensor fault leads to missed over-temperature alarm." Mitigation: "Sensor fault shall be annunciated before the process can exceed the alarm threshold." Process thermal time constant: the analysis states the process cannot rise more than 1 °C in 2 s, and the alarm margin is 2 °C. Required detection and annunciation: **≤ 2 s**.`,
      assessmentNote: `This is where the number comes from: the hazard analysis, not the engineer's taste and not the hardware's current performance. A limit derived here is defensible in any review.`,
      evidence: "limit-from-hazard",
    },
    {
      id: "ask-stakeholder",
      label: "Ask the customer's safety engineer what 'quickly' meant",
      category: "document",
      costMinutes: 5,
      assessment: "useful",
      result: `"It must be fast enough that a sensor fault can never hide an over-temperature event. The hazard analysis has the numbers; use those."`,
      assessmentNote: `The right instinct, and it points you to the authoritative source rather than inventing a value in the meeting.`,
      evidence: "stakeholder-consulted",
    },
    {
      id: "architecture",
      label: "Trace the fault-detection path in the architecture document",
      category: "document",
      costMinutes: 5,
      assessment: "useful",
      result: `Sensor sampled at 10 Hz; a disconnected sensor reads as an open-circuit ADC code; the firmware declares a fault after 3 consecutive invalid samples (300 ms); the alarm output is driven in the next 50 ms control cycle. Design intent: about 350 ms.`,
      assessmentNote: `Useful for the test design (where to probe, what to expect), and it shows the design comfortably meets a 2 s limit, but the design's number is not the requirement's number.`,
      evidence: "path-known",
    },
    {
      id: "measure-latency",
      label: "Measure the actual detection-to-alarm latency on the bench",
      category: "scope",
      costMinutes: 8,
      assessment: "useful",
      result: `Logic analyser, channel 1 on the sensor connector's detect pin, channel 2 on the alarm output: 5 trials, 310 to 360 ms from disconnect to alarm. Mean 340 ms.`,
      assessmentNote: `Good evidence that the design works and a rehearsal of the test method. It is not, by itself, a basis for the requirement's limit.`,
      evidence: "latency-measured",
    },
    {
      id: "write-from-measurement",
      label: "Rewrite the requirement as '≤ 400 ms' because that is what the hardware does",
      category: "document",
      costMinutes: 4,
      requiresAnyOf: ["measure-latency"],
      assessment: "wasteful",
      result: `The reviewer asks where 400 ms comes from. "It's what we measured" is not an answer: a requirement derived from the implementation verifies nothing about the need, and will break the moment the design changes.`,
      assessmentNote: `Deriving requirements from measurements inverts verification. The limit has to come from the hazard or the customer need.`,
    },
    {
      id: "rewrite-req",
      label: "Rewrite REQ-SYS-041 with the hazard-derived limit, condition and method",
      category: "document",
      costMinutes: 6,
      requiresAnyOf: ["hazard-analysis"],
      assessment: "key",
      result: `*REQ-SYS-041 (rev B): "On disconnection, short-circuit or out-of-range reading of the process temperature sensor, the system shall assert the ALARM output within 2.0 s of the fault onset, as measured from the sensor-line event to the ALARM output edge." Rationale: H-07, process rise ≤ 1 °C per 2 s against a 2 °C alarm margin.*`,
      assessmentNote: `Quantity, condition, method and a rationale that points at the hazard analysis. This is the version a safety engineer signs.`,
      evidence: "req-rewritten",
    },
    {
      id: "write-test",
      label: "Write TC-SYS-041 with fault injection and a traced expected result",
      category: "document",
      costMinutes: 6,
      requiresAnyOf: ["rewrite-req"],
      assessment: "key",
      result: `Three fault injections (open circuit, short to ground, out-of-range via a simulator), 5 trials each; logic analyser from the injection event to the ALARM edge; expected: every trial ≤ 2.0 s; record all 15 values. Traced to REQ-SYS-041 rev B and H-07.`,
      assessmentNote: `A test that can fail, covers each fault condition named in the requirement, and leaves 15 numbers behind as evidence.`,
      evidence: "test-written",
    },
    {
      id: "skip-review",
      label: "Mark the original test as passed; the measured 340 ms is obviously 'quick'",
      category: "firmware",
      costMinutes: 2,
      assessment: "risky",
      result: `The safety engineer rejects it again and escalates: a subjective pass on a safety-relevant requirement is a process failure, not a disagreement.`,
      assessmentNote: `Even when the system is fine, passing an untestable test on judgement destroys the credibility of every other test in the file.`,
    },
  ],
  diagnoses: [
    {
      id: "untestable",
      label: "The requirement is untestable: it lacks a quantity, a condition and a measurement method, and the limit must come from the hazard analysis",
      correct: true,
      requiresEvidence: ["defect-named", "limit-from-hazard"],
      feedback: `Correct. Naming the three missing elements explains the rejection; the hazard analysis supplies the only defensible number. The rewrite and the test follow directly.`,
    },
    {
      id: "design-too-slow",
      label: "The design is too slow and must be sped up before the test can pass",
      correct: false,
      feedback: `The bench shows about 340 ms against a hazard-derived limit of 2 s. The design is fine; the requirement and the test were the defects.`,
    },
    {
      id: "test-method-only",
      label: "The requirement is fine; only the test needs an instrument and a number",
      correct: false,
      feedback: `A test cannot supply the number the requirement omits. If the test says 400 ms and the requirement says "quickly", the next reviewer asks which one is the contract.`,
    },
    {
      id: "reviewer-wrong",
      label: "The reviewer is being pedantic; 'quickly' is understood by everyone on the project",
      correct: false,
      feedback: `Two testers passed the original test for two different reasons. "Understood by everyone" is the assumption that integration failures are made of, and on a safety-relevant output it is not acceptable.`,
    },
  ],
  fixes: [
    {
      id: "rewrite-and-trace",
      label: "Issue REQ-SYS-041 rev B with the hazard-derived 2.0 s limit, conditions and method; trace TC-SYS-041 with fault injection to it and to H-07",
      quality: "best",
      feedback: `The number has a source, the test can fail, the trace closes the loop to the hazard. This survives the review and the next design change.`,
    },
    {
      id: "test-with-assumption",
      label: "Write the test against a 2.0 s limit now, flagged as 'pending requirement update', and raise a change request for the requirement",
      quality: "acceptable",
      feedback: `Workable under time pressure if the change request is real and tracked, but a test that leads its requirement is a temporary state, not a fix.`,
    },
    {
      id: "subjective-pass",
      label: "Keep the requirement; add 'as judged by the test engineer' to the test's pass criterion",
      quality: "wrong",
      feedback: `A pass criterion that depends on who is in the room is exactly what the reviewer rejected. On a safety-relevant output it would not survive an audit.`,
    },
  ],
  optimalPath: ["read-req", "hazard-analysis", "rewrite-req", "write-test"],
  debrief: `Four actions and about twenty-one minutes of document work; the bench was optional. The decisive move was going to the hazard analysis for the number instead of to the oscilloscope. Measurements tell you what the design does; requirements say what it must do, and the gap between them is the margin a reviewer wants to see.

The trap was the most natural thing on the bench: measuring 340 ms and writing "≤ 400 ms". It looks rigorous and it is backwards.

In an interview, this story is about where numbers come from: hazard analysis or customer need for the requirement, instrument and method for the test, and a trace between them.`,
  references: [
    { title: "IEC 61508 / ISO 26262 / DO-178C: requirements shall be verifiable (overview level)", note: "All three require measurable requirements and traceability from hazards to requirements to tests; no certification claim is made here." },
  ],
};
