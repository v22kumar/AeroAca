import type { Lesson } from "@/lib/content/schema";

export const medicalAndIndustrialStandardsScope: Lesson = {
  slug: "medical-and-industrial-standards-scope",
  moduleId: "standards",
  prerequisites: ["avionics-and-automotive-standards-scope"],
  title: "Medical and industrial standards in one page each",
  summary: "IEC 62304, IEC 60601-1, ISO 13485, ISO 14971, IEC 61508 and IEC 62443: what each governs, which number you will hear in an interview, and what a hardware or test engineer produces under them. No certification claims, no slogans.",
  durationMinutes: 10,
  whyItMatters: "Medical and industrial employers list these standards the way avionics lists DO-178C. The skills you already have (test cases with evidence, traceability, FMEA, fault injection) are exactly what these standards ask for; knowing the vocabulary lets you say so.",
  objectives: [
    "State the scope of IEC 62304, IEC 60601-1 (and -1-2), ISO 13485 and ISO 14971 and how they relate.",
    "State the scope of IEC 61508, what a SIL target means, and where IEC 61511 and IEC 62443 sit.",
    "Map your existing verification skills onto the artefacts each standard expects.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Scopes and class and level names are stated at the level of the standards' public summaries. Numeric targets (SIL PFD bands) are the published order-of-magnitude ranges. No certification claim is made.",
  },
  references: [
    { title: "IEC 62304: Medical device software, software life cycle processes", note: "Software safety classes A, B, C; activities by class." },
    { title: "IEC 60601-1 and IEC 60601-1-2: Medical electrical equipment, basic safety and essential performance; EMC", note: "Leakage currents, insulation, means of protection; EMC immunity and emissions." },
    { title: "ISO 13485 and ISO 14971", note: "Quality management system for medical devices; risk management for medical devices." },
    { title: "IEC 61508: Functional safety of E/E/PE safety-related systems", note: "SIL 1 to 4; PFD and PFH targets; systematic capability; hardware fault tolerance." },
    { title: "IEC 61511 and IEC 62443", note: "Process-industry safety instrumented systems; industrial automation cybersecurity." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Same bench, different vocabulary",
      body: `An engineer who has spent two years testing avionics boards interviews for a medical-device test role. The interviewer asks about the design history file, software safety class, essential performance and the risk file. The engineer has produced the equivalents of all four, under other names: configuration-controlled test evidence, DAL, the function that must keep working, and the safety assessment.

The interviewer is not testing whether the engineer has read IEC 62304. The interviewer is testing whether the engineer can see that a test with a traced expected result is the same artefact in both industries. This lesson is the dictionary.`,
    },
    {
      type: "concept",
      title: "Medical: four standards that fit together",
      body: `- **ISO 13485** is the *quality management system* for medical devices: the processes, records and controls the organisation runs. Everything below produces records that live in it, in particular the **design history file (DHF)**, the evidence that the device was designed and verified as planned.
- **ISO 14971** is *risk management*: identify hazards, estimate and evaluate risk, control it, and keep a **risk management file** through the product's life. It is the medical cousin of the hazard analysis and FMEA you have already met, and it is where the limits in safety requirements come from.
- **IEC 62304** is the *software life cycle*: planning, requirements, architecture, detailed design, unit implementation and verification, integration testing, system testing, release, maintenance, and problem resolution. Software is assigned a **safety class**: **A** (no injury possible), **B** (non-serious injury possible), **C** (death or serious injury possible); the activities and documentation required grow with the class. The classification comes from the risk analysis, not from how complex the code is.
- **IEC 60601-1** is the *electrical safety* standard for medical electrical equipment: **basic safety** (no electrical, mechanical or thermal hazard to patient or operator: leakage currents, insulation, creepage and clearance, **means of protection** for patient and operator) and **essential performance** (the functions that, if lost or degraded, create an unacceptable risk). **IEC 60601-1-2** is the EMC collateral: emissions and immunity limits, with essential performance maintained during immunity tests. Particular standards (60601-2-xx) add requirements per device type.

What a hardware or test engineer produces: verification protocols and reports in the DHF, traced to requirements and to risk controls; leakage-current and dielectric test records for 60601-1; EMC test plans naming the essential performance that must hold during each immunity test; and for software, unit and integration test records at the rigour the class demands. A **verification test with a measured expected result and a trace** is the same thing it was in avionics; it now also cites the risk control it verifies.`,
    },
    {
      type: "concept",
      title: "Industrial: IEC 61508 and its neighbours",
      body: `**IEC 61508** is the generic *functional safety* standard for electrical, electronic and programmable electronic safety-related systems: emergency shutdowns, interlocks, safety PLCs, safe torque off in a drive. Its measure is the **safety integrity level, SIL 1 to 4**, assigned to a safety function from the risk reduction it must provide. Each SIL carries a target for the probability of dangerous failure: for low-demand functions the **PFD (probability of failure on demand)** bands are about 10⁻¹ to 10⁻² for SIL 1 down to 10⁻⁴ to 10⁻⁵ for SIL 4, each level an order of magnitude; for continuous functions the equivalent is **PFH (probability of dangerous failure per hour)**. Meeting a SIL needs three things together: the random-hardware-failure numbers (from FMEDA, failure rates and diagnostic coverage), **hardware fault tolerance** (how many faults the architecture survives), and **systematic capability** (the development process rigour, including software techniques by SIL).

The same word "SIL" here is a *safety integrity level*; it has nothing to do with software-in-the-loop from day 23, and nothing to do with DAL or ASIL, which are not convertible to it. Interviewers notice when candidates treat the three as one scale.

Sector standards derive from it: **IEC 61511** for process-industry safety instrumented systems, **IEC 62061** and **ISO 13849** for machinery (ISO 13849 uses **performance levels a to e**), **EN 50128/50129** for rail. **IEC 62443** is separate: *industrial automation cybersecurity*, with security levels for zones and conduits, increasingly demanded alongside functional safety.

What a hardware or test engineer produces: FMEDA inputs (failure modes and diagnostic coverage of each part), proof-test procedures that exercise the safety function and its diagnostics, fault-injection evidence that each diagnostic detects its fault within the process safety time, and verification records against the safety requirements specification. The FMEA from day 24 is the front half of the FMEDA.`,
      deeper: {
        title: "Diagnostic coverage in one sentence",
        body: `Diagnostic coverage is the fraction of dangerous failures that a built-in test or monitor detects before they matter. A watchdog, a plausibility check, a readback of an output, a CRC on a configuration: each one raises coverage, and the FMEDA credits it only if a test has shown it works. That is why the fault-injection tests you design are the evidence behind the number.`,
      },
    },
    {
      type: "example",
      title: "Worked example: the dictionary",
      body: `| You have done | Avionics name | Medical name | Industrial name |
|---|---|---|---|
| Analysed what can go wrong and how badly | ARP4761 FHA, FMEA, FTA | ISO 14971 risk analysis, risk file | IEC 61508 hazard and risk analysis, FMEDA |
| Received a criticality level | DAL A–E | Software class A–C; essential performance | SIL 1–4; performance level a–e |
| Written tests with traced, measured expected results | Requirements-based test procedures | Verification protocols in the DHF | Verification against the safety requirements specification |
| Injected faults to prove detection | Fault insertion on the rig | Risk-control verification | Diagnostic coverage proof tests |
| Kept configuration and problem records | CM and problem reports under DO-178C | DHF, CAPA, problem resolution under 62304 | Modification and impact analysis under 61508 |
| Run environmental and EMC tests | DO-160 sections | 60601-1 and 60601-1-2 | Product standards and IEC 61000 series |

The honest transfer sentence uses the left column as the claim and the target column as the vocabulary: "I have written fault-injection tests that prove a monitor detects an open sensor within its time limit; in your terms, the evidence behind diagnostic coverage."`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "leakage-standard",
        skill: "standards",
        objective: "Match a test to its standard.",
        prompt: `A medical device's patient-connected input must be tested for leakage current and insulation. Which standard specifies those tests and limits?`,
        options: [
          { id: "a", text: "IEC 62304.", correct: false, feedback: `62304 is the software life cycle; it has no electrical limits.` },
          { id: "b", text: "IEC 60601-1.", correct: true, feedback: `Yes. Basic safety: leakage currents, dielectric strength, creepage and clearance, means of patient and operator protection.` },
          { id: "c", text: "ISO 13485.", correct: false, feedback: `13485 is the quality management system; it says the tests must be planned and recorded, not what they are.` },
          { id: "d", text: "IEC 61508.", correct: false, feedback: `61508 is functional safety for safety-related control systems, not medical electrical safety.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "sil-not-asil",
        skill: "standards",
        objective: "Keep the level systems apart.",
        prompt: `A colleague says "our SIL 2 interlock is basically ASIL B, which is like DAL C". What is the accurate response?`,
        options: [
          { id: "a", text: "Agree: the scales are equivalent and convertible.", correct: false, feedback: `They are not. Each is assigned by a different method against different risk models, and none of the standards provides a conversion.` },
          { id: "b", text: "SIL, ASIL and DAL are assigned by different standards against different risk models and are not convertible; each must be derived in its own framework.", correct: true, feedback: `Yes. SIL from IEC 61508 risk reduction, ASIL from the ISO 26262 HARA, DAL from the ARP4761 failure-condition severity. Similar-sounding ladders, no exchange rate.` },
          { id: "c", text: "SIL here means software-in-the-loop, so the comparison is meaningless.", correct: false, feedback: `In this sentence SIL is the safety integrity level; the acronym clash is real, but the correction is about convertibility.` },
          { id: "d", text: "Only DAL matters because aerospace is the strictest.", correct: false, feedback: `Each standard is authoritative in its own industry; strictness is not the point.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "class-c-implications",
        skill: "standards",
        objective: "Know what changes with the class.",
        prompt: `Software is classified Class C under IEC 62304. Select **every** correct statement.`,
        options: [
          { id: "a", text: "The class came from the risk analysis: a failure could contribute to death or serious injury.", correct: true, feedback: `Classification follows harm, not code complexity.` },
          { id: "b", text: "Detailed design and unit verification are required for the software units.", correct: true, feedback: `Class C adds the most activities, including detailed design and unit-level verification.` },
          { id: "c", text: "The class can be lowered by writing simpler code.", correct: false, feedback: `Only a risk control external to the software (a hardware interlock, for example) that changes the harm can justify a lower class.` },
          { id: "d", text: "Its verification records belong in the design history file and trace to requirements and risk controls.", correct: true, feedback: `The DHF is where the evidence lives under ISO 13485.` },
          { id: "e", text: "Class C means the device is SIL 3.", correct: false, feedback: `Different standard, different scale, not convertible.` },
        ],
        solvedFeedback: `Right. Class from harm, more activities at C, evidence in the DHF traced to risk controls, and no conversion to other ladders.`,
      },
    },
    {
      type: "interview",
      questionId: "transfer-across-industries",
      intro: `Name the standards by scope, then make one honest transfer sentence: a thing you have done, in the target industry's vocabulary, with its evidence.`,
    },
    {
      type: "recap",
      summary: `- Medical: ISO 13485 (QMS, DHF), ISO 14971 (risk file), IEC 62304 (software life cycle, classes A/B/C from harm), IEC 60601-1 (basic safety, essential performance) and -1-2 (EMC).
- Industrial: IEC 61508 (functional safety, SIL 1–4 from required risk reduction; PFD/PFH, hardware fault tolerance, systematic capability), IEC 61511 (process), ISO 13849 (machinery, PL a–e), IEC 62443 (cybersecurity).
- SIL, ASIL and DAL are not convertible; "SIL" also collides with software-in-the-loop.
- Your artefacts transfer: traced tests with measured results, fault-injection evidence, FMEA → FMEDA, configuration and problem records, environmental and EMC test records.`,
      cards: [
        { id: "med-1", front: "How do ISO 13485, ISO 14971, IEC 62304 and IEC 60601-1 relate?", back: "13485 is the quality system holding the records (DHF); 14971 is risk management (risk file); 62304 is the software life cycle with classes A/B/C from harm; 60601-1 is electrical basic safety and essential performance, with -1-2 for EMC." },
        { id: "med-2", front: "What does a SIL target require?", back: "Random-hardware-failure numbers within the PFD/PFH band (from FMEDA and diagnostic coverage), the required hardware fault tolerance, and systematic capability from the development process." },
        { id: "med-3", front: "Are SIL, ASIL and DAL convertible?", back: "No. Each is assigned by its own standard against its own risk model; none provides a conversion. SIL also collides with software-in-the-loop." },
        { id: "med-4", front: "What is diagnostic coverage and what is its evidence?", back: "The fraction of dangerous failures a monitor detects in time; credited in the FMEDA only when a fault-injection test has shown the monitor works." },
      ],
    },
  ],
};
