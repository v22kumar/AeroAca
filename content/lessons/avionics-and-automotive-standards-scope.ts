import type { Lesson } from "@/lib/content/schema";

export const avionicsAndAutomotiveStandardsScope: Lesson = {
  slug: "avionics-and-automotive-standards-scope",
  moduleId: "standards",
  prerequisites: ["writing-a-trustworthy-test-case", "fmea-for-a-small-embedded-product"],
  title: "What DO-178C, DO-254 and ISO 26262 are for",
  summary: "Standards are scopes, not slogans. Learn what each avionics and automotive standard governs, how the criticality levels are assigned, what evidence a test or verification engineer actually produces under them, and how to talk about them honestly when you have worked within a process rather than owned it.",
  durationMinutes: 12,
  whyItMatters: "Job adverts list these standards; interviewers ask what they mean in practice. Candidates who can say 'DO-178C is a software process with objectives that scale by DAL, and under it I produced requirements-based test procedures with traceability' stand out from those who say 'I am DO-178C certified', which is not a thing a person can be.",
  objectives: [
    "State the scope of DO-178C, DO-254, DO-160, ARP4754A and ARP4761, and how DAL is assigned and what changes with it.",
    "State the scope of ISO 26262, how ASIL is derived, and where ASPICE and AUTOSAR sit beside it.",
    "Describe the artefacts a verification engineer produces under these standards and phrase your involvement truthfully.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Scopes, level names and the coverage objectives are stated at the level of the public standards' summaries (RTCA DO-178C and DO-254, ISO 26262:2018, Automotive SPICE). No certification claim is made and no proprietary process is described. Exact objective counts and table contents are in the standards themselves and are not reproduced.",
  },
  references: [
    { title: "RTCA DO-178C: Software Considerations in Airborne Systems and Equipment Certification", note: "Software levels A to E; objectives; structural coverage by level; supplements DO-330 (tools), DO-331 (model-based), DO-332 (OO), DO-333 (formal methods)." },
    { title: "RTCA DO-254: Design Assurance Guidance for Airborne Electronic Hardware", note: "Complex electronic hardware (FPGA, ASIC, boards) under DAL." },
    { title: "SAE ARP4754A and ARP4761", note: "Aircraft and system development; safety assessment (FHA, PSSA, SSA, FTA, FMEA)." },
    { title: "RTCA DO-160G: Environmental Conditions and Test Procedures for Airborne Equipment", note: "Temperature, vibration, EMC and other environmental qualification tests." },
    { title: "ISO 26262:2018 Road vehicles, functional safety", note: "HARA, ASIL A to D, safety goals, hardware metrics, software verification methods by ASIL." },
    { title: "Automotive SPICE (ASPICE) process assessment model", note: "Process capability levels; not a safety standard." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The sentence that ended the interview",
      body: `A candidate says: "I'm DO-178C certified and I've done ISO 26262." The interviewer, a DER (designated engineering representative) in a previous life, asks what DAL the software was, which objectives the candidate's tests satisfied, and what structural coverage the level required. The candidate has none of it, because the candidate had run tests written by someone else on a project whose paperwork mentioned the standard.

The honest sentence would have been better and shorter: "I ran requirements-based tests on a DAL C project and recorded results against the traceability matrix; I did not own the coverage analysis." That is a real contribution, it is true, and it invites the interviewer to teach rather than to catch.

This lesson is what each standard governs, so you can say the honest sentence with precision.`,
    },
    {
      type: "concept",
      title: "Avionics: the family and the DAL",
      body: `Civil avionics certification is a family of documents with distinct scopes:

- **ARP4754A** covers the *aircraft and system* development process: requirements from aircraft level down to items, and the allocation of safety requirements.
- **ARP4761** is the *safety assessment* method: functional hazard assessment (FHA), preliminary and final system safety assessments, fault trees, FMEA. It is where the **Development Assurance Level (DAL)** of each function comes from: the severity of the failure condition, from **catastrophic (A)** through hazardous (B), major (C), minor (D) to no effect (E).
- **DO-178C** is the *software* process for the DAL assigned to it. It does not tell you how to write code; it lists **objectives** (evidence that must exist) for planning, requirements, design, code, integration, verification, configuration management and quality assurance. The number of objectives, and how many need independence, rise with the level. For verification, the structural coverage required is the famous ladder: **statement coverage at DAL C, decision coverage at DAL B, and MC/DC (modified condition/decision coverage) at DAL A**; DAL D needs requirements-based test without structural coverage; DAL E has no objectives.
- **DO-254** is the equivalent for *complex electronic hardware*: FPGAs, ASICs, and boards whose function cannot be exhaustively tested; it has its own objectives by DAL and its own verification expectations (elemental analysis at the higher levels).
- **DO-160** is *environmental qualification*: temperature and altitude, vibration, humidity, power input, lightning, EMC. It is the test standard a hardware-test engineer most often runs to, section by section.

What a verification engineer produces under DO-178C: **requirements-based test cases and procedures** traced to high- and low-level requirements, **test results** with configuration identification, **structural coverage analysis** showing which code the requirements-based tests exercised and justifying the rest (dead code, deactivated code), **reviews** of the tests themselves (at higher levels by someone independent of the author), and **problem reports** when a test fails. A tool used to produce that evidence may itself need qualification under DO-330.

Nobody is "DO-178C certified". The *aircraft* is certified; the software has a *compliance* finding; a person has worked to the process, at a level, in a role.`,
      deeper: {
        title: "Why MC/DC exists",
        body: `MC/DC asks that every condition in a decision be shown to independently affect the outcome. For \`if (a && b)\` that is three test cases, not four (a true/b true, a false/b true, a true/b false), and it scales linearly with conditions where exhaustive testing scales exponentially. It is required at DAL A because it is the strongest coverage criterion that remains affordable for large flight software; it is also why DAL A projects avoid complex Boolean expressions.`,
      },
    },
    {
      type: "visual",
      title: "One industry at a time",
      visual: "standards-map",
      body: `Pick an industry. For each standard: what it governs, and what a test or hardware engineer produces under it. The last line is the honest phrasing for someone who has worked beside the process rather than owned it.`,
      caption: `Scopes summarised from the public standards; exact objectives and tables are in the documents themselves. No certification claim is implied.`,
    },
    {
      type: "concept",
      title: "Automotive: ISO 26262, the ASIL, and the two standards beside it",
      body: `**ISO 26262** is functional safety for road-vehicle electrical and electronic systems. Its process starts with a **hazard analysis and risk assessment (HARA)** that scores each hazardous event on **severity (S0–S3)**, **exposure (E0–E4)** and **controllability (C0–C3)** and reads the **ASIL** (automotive safety integrity level) from a table: **A** (lowest) to **D** (highest), or **QM** (quality management only, no safety requirement). Each hazard gets a **safety goal**; goals decompose into functional and technical safety requirements, then hardware and software requirements, down the V-model.

What changes with ASIL: the rigour of verification methods (the standard's tables mark methods as recommended or highly recommended by ASIL), the independence required for reviews and tests, the hardware architectural metrics that must be met (single-point fault metric, latent fault metric, and probabilistic metric for random hardware failures at the higher ASILs), and the need for safety mechanisms with defined diagnostic coverage and fault-tolerant time intervals. HIL with fault insertion, which you met on day 23, is the standard way to show a safety mechanism works end to end.

Two standards sit beside it and are often confused with it:

- **ASPICE** (Automotive SPICE) assesses *process capability*: are requirements managed, is testing planned, is configuration controlled? It scores processes on levels 0 to 5. It says nothing about safety and is demanded by OEMs regardless of ASIL.
- **AUTOSAR** is a *software architecture and set of interfaces* (basic software, RTE, application components, and the Adaptive platform for high-performance computers). It is a way to structure software, not a safety or process standard, though it provides building blocks that safety architectures use.

What a test engineer produces under ISO 26262: test specifications traced to safety requirements, fault-injection test results on the HIL rig, evidence that each safety mechanism detects its faults within the fault-tolerant time interval, and participation in the confirmation reviews. Under ASPICE, the evidence is the process itself: plans, traceability, review records, metrics.`,
    },
    {
      type: "example",
      title: "Worked example: one phrase per level of involvement",
      body: `The same project, described at four honest levels of involvement:

1. **Ran tests:** "On a DAL C flight-control display project I executed requirements-based test procedures on the target and recorded results against the trace matrix. Coverage analysis and test authorship were owned by others."
2. **Wrote tests:** "I wrote requirements-based test cases for the UART driver's low-level requirements, including the off-nominal cases, and they were independently reviewed as the level required."
3. **Owned coverage:** "I ran the structural coverage analysis for DAL B (decision coverage) and wrote the justifications for the uncovered defensive code."
4. **Never on such a project:** "I have not worked on a DO-178C programme. I understand the objectives scale by DAL and that verification is requirements-based with structural coverage from statement at C to MC/DC at A, and I've practised the test-case and traceability discipline it relies on."

Each sentence names the standard, the level, the artefact and the boundary of your contribution. An interviewer can verify all four. None of them says "certified".`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "coverage-by-dal",
        skill: "standards",
        objective: "Know what changes with the level.",
        prompt: `A software item is assigned DAL A. Which structural coverage objective applies to its requirements-based tests?`,
        options: [
          { id: "a", text: "Statement coverage.", correct: false, feedback: `Statement coverage is the DAL C objective.` },
          { id: "b", text: "Decision coverage.", correct: false, feedback: `Decision coverage is added at DAL B.` },
          { id: "c", text: "Modified condition/decision coverage (MC/DC).", correct: true, feedback: `Yes. DAL A requires MC/DC in addition to the lower criteria, with independence in the verification activities.` },
          { id: "d", text: "No structural coverage; requirements-based tests only.", correct: false, feedback: `That describes DAL D.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "asil-source",
        skill: "standards",
        objective: "Know where ASIL comes from.",
        prompt: `Where does a function's ASIL come from under ISO 26262?`,
        options: [
          { id: "a", text: "From the hazard analysis and risk assessment: severity, exposure and controllability of each hazardous event, read from a table.", correct: true, feedback: `Yes. S, E and C combine to an ASIL from QM to D, which then flows into safety goals and requirements.` },
          { id: "b", text: "From the ASPICE capability level the supplier achieved.", correct: false, feedback: `ASPICE scores process capability; it does not assign safety levels.` },
          { id: "c", text: "From the AUTOSAR component classification.", correct: false, feedback: `AUTOSAR is an architecture; it does not classify hazards.` },
          { id: "d", text: "From the MCU vendor's safety manual.", correct: false, feedback: `A safety manual helps you meet an ASIL target; it does not set it.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "honest-standards-claims",
        skill: "standards",
        objective: "Phrase involvement truthfully.",
        prompt: `Select **every** statement that is both accurate and honest for an engineer who executed tests written by others on a DO-178C DAL C programme.`,
        options: [
          { id: "a", text: "\"I executed requirements-based test procedures on target for a DAL C item and recorded results against the trace matrix.\"", correct: true, feedback: `Names the standard, the level, the artefact and the boundary.` },
          { id: "b", text: "\"I am DO-178C certified.\"", correct: false, feedback: `People are not certified under DO-178C; aircraft are certified and software is found compliant.` },
          { id: "c", text: "\"I understand that DAL C requires statement coverage and that the coverage analysis was performed by the verification lead.\"", correct: true, feedback: `Accurate about the level and honest about who owned the analysis.` },
          { id: "d", text: "\"I performed the structural coverage analysis and the independent reviews.\"", correct: false, feedback: `Not true for this role; it is also the first thing an interviewer will probe.` },
          { id: "e", text: "\"I have not authored DO-178C test cases, but I have practised the requirements-based test and traceability discipline they rely on.\"", correct: true, feedback: `Honest about the gap and specific about the transferable skill.` },
        ],
        solvedFeedback: `Right. Standard, level, artefact, boundary. The honest sentence is always available and usually stronger.`,
      },
    },
    {
      type: "interview",
      questionId: "standards-scope",
      intro: `Give the scope of each standard in one sentence, say how DAL and ASIL are assigned, name one artefact you would produce under each, and state your own involvement precisely.`,
    },
    {
      type: "recap",
      summary: `- ARP4754A (system development), ARP4761 (safety assessment, source of DAL), DO-178C (software objectives by DAL A–E), DO-254 (complex hardware), DO-160 (environmental tests).
- Structural coverage ladder: statement at DAL C, decision at B, MC/DC at A; requirements-based tests only at D.
- ISO 26262: HARA scores S, E, C → ASIL QM/A–D → safety goals → requirements; verification rigour, independence and hardware metrics rise with ASIL. ASPICE is process capability; AUTOSAR is architecture.
- Verification artefacts: requirements-based test cases, traced results, coverage analysis and justifications, independent reviews, problem reports, fault-injection evidence.
- Nobody is "certified"; say the standard, the level, the artefact and your boundary.`,
      cards: [
        { id: "std-1", front: "Where does DAL come from, and what does DO-178C do with it?", back: "From the ARP4761 safety assessment: failure-condition severity from catastrophic (A) to no effect (E). DO-178C scales its software objectives, independence and structural coverage by that level." },
        { id: "std-2", front: "Structural coverage by DAL?", back: "DAL C statement, DAL B decision, DAL A MC/DC; DAL D requirements-based tests without structural coverage; DAL E no objectives." },
        { id: "std-3", front: "How is an ASIL assigned?", back: "The HARA scores each hazardous event on severity, exposure and controllability and reads ASIL QM, A, B, C or D from the ISO 26262 table; each hazard gets a safety goal." },
        { id: "std-4", front: "ASPICE and AUTOSAR vs ISO 26262?", back: "ISO 26262 is functional safety. ASPICE assesses process capability (levels 0 to 5) and says nothing about safety. AUTOSAR is a software architecture, not a safety or process standard." },
      ],
    },
  ],
};
