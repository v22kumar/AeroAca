import type { Lesson } from "@/lib/content/schema";

export const sameSkillsDifferentIndustries: Lesson = {
  slug: "same-skills-different-industries",
  moduleId: "applications",
  prerequisites: ["avionics-and-automotive-standards-scope"],
  title: "Same skills, different industries: how to talk about transfer",
  summary: "An avionics test engineer applying to automotive, medical, industrial or consumer roles has the skills and the wrong vocabulary. Learn the one-sentence pattern that transfers a skill with its evidence, what each industry values that the others do not, and the claims that do not survive a follow-up question.",
  durationMinutes: 10,
  whyItMatters: "The cover note and the first five minutes of an interview decide whether an avionics background reads as 'rigorous, relevant' or 'narrow, slow'. The difference is how transfer is stated. This is also where inflated claims live, and where honesty is a competitive advantage because it is rare.",
  objectives: [
    "Use the transfer pattern: what I did, the evidence, the target industry's name for it.",
    "State what each target industry values most and how an avionics background maps onto it.",
    "Recognise claims that inflate experience and replace them with precise ones.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Industry characterisations are general and conservative; standards references match the two standards lessons. The honesty rule is the academy's own and is not negotiable.",
  },
  references: [
    { title: "Lesson: What DO-178C, DO-254 and ISO 26262 are for", note: "Avionics and automotive vocabulary." },
    { title: "Lesson: Medical and industrial standards in one page each", note: "Medical and industrial vocabulary." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Two cover notes for the same person",
      body: `**Note A:** "Associate avionics engineer with experience of DO-178C/DO-254 environments, board testing and debugging. Seeking to apply my skills in the automotive sector."

**Note B:** "I test and debug avionics boards: I have brought up first-article units with a current-limited supply and a written checklist, located an I2C fault from a logic-analyser capture, and written test procedures whose expected results are measured and traced. In automotive terms that is bring-up, bus-level debugging and requirements-based verification; I have practised HIL concepts and fault insertion in simulation and would say so plainly."

Both are true. Note A asks the reader to translate. Note B does the translation, offers evidence, and states the boundary of the HIL claim. Hiring managers remember Note B and trust it.`,
    },
    {
      type: "concept",
      title: "The transfer sentence, and what each industry values",
      body: `The pattern is three parts: **what I did** (a verb and an object), **the evidence** (a number, an instrument, an artefact), **their name for it**. "I wrote test procedures with measured expected results traced to requirements (34 procedures, all run on target); in your terms, verification protocols for the DHF."

What each target values most, and how avionics maps:

- **Automotive**: volume, cost and cycle time alongside safety; ISO 26262 with HIL and fault insertion; CAN and diagnostics (UDS); ASPICE process evidence. Avionics maps well onto rigour and traceability; be explicit that you can move faster when the level allows, and show it with a bench story that took an afternoon, not a quarter.
- **Medical**: risk-driven everything (ISO 14971), the DHF as the product's memory, essential performance under EMC, usability. Avionics maps onto evidence discipline; learn to say "risk control" where you said "safety requirement".
- **Industrial**: robustness in bad environments, long product lives, PLC and fieldbus (Modbus, PROFINET, EtherCAT), IEC 61508 for safety functions, and more hands-on commissioning. Avionics maps onto environmental testing (DO-160 is a strong card) and fault isolation on site.
- **Consumer**: cost, EMC/regulatory (CE, FCC), volume test stations, fast iteration. Avionics maps onto test design and root-cause analysis; the gap to name is speed and the habit of asking "what is the cheapest sufficient evidence?".
- **Across all of them**: the Python automation, logic-analyser and oscilloscope skills, the bring-up discipline and the root-cause method transfer unchanged. Name them with evidence and they carry the application.`,
      deeper: {
        title: "Training is not employment",
        body: `A lesson you completed, a simulated mission you solved and a portfolio project you built are real learning and legitimate to describe, as learning. They are not employment history and must never be presented as if they were. "I have practised HIL concepts and fault insertion in simulation" is strong; "I have HIL experience" when you have not touched a rig is a claim one question will collapse. This academy's content is training; your real responsibilities are your own, and the two live in separate sentences.`,
      },
    },
    {
      type: "example",
      title: "Worked example: five claims, rewritten",
      body: `| Inflated | Precise and honest |
|---|---|
| "Experienced in ISO 26262." | "I have not worked on an ISO 26262 programme. I know how ASIL is derived and what fault-injection evidence it asks for, and I have run requirements-based tests under an equivalent avionics process at DAL C." |
| "HIL testing experience." | "I have practised HIL concepts and designed fault-injection cases in a simulated environment; I have not operated a rig." |
| "Led the bring-up of a new board." | "I executed the bring-up checklist for the first-article unit under a senior engineer, found a 3 Ω short before power-up with the unpowered rail check, and recorded every reading." |
| "Expert in Python test automation." | "I have written a PyVISA logging script and a pyserial request-reply helper with timestamps and tag matching, and used them to characterise a flaky serial test." |
| "Strong RTOS background." | "I can explain priority inversion with a timeline and have traced a simulated inversion to a binary semaphore; I have not shipped RTOS firmware." |

Every right-hand sentence is shorter to verify, and each one leaves the interviewer something to ask about that you can answer.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "transfer-sentence-pick",
        skill: "applications",
        objective: "Recognise the transfer pattern.",
        prompt: `Which sentence best transfers an avionics test skill to a medical-device application?`,
        options: [
          { id: "a", text: "\"I have DO-178C experience and want to move into medical devices.\"", correct: false, feedback: `Leaves the reader to translate and offers no evidence.` },
          { id: "b", text: "\"I wrote 34 test procedures with measured expected results traced to requirements and ran them on target; in your terms, verification protocols for the DHF traced to risk controls.\"", correct: true, feedback: `What you did, the evidence, their name for it.` },
          { id: "c", text: "\"Medical and avionics are basically the same, so my experience applies directly.\"", correct: false, feedback: `A claim about the industries, not about you, and not true in the details that matter (risk file, essential performance, usability).` },
          { id: "d", text: "\"I am familiar with IEC 62304 and ISO 13485.\"", correct: false, feedback: `'Familiar' is unverifiable and invites the question you may not be able to answer.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "honest-claims-transfer",
        skill: "applications",
        objective: "Separate training from employment.",
        prompt: `You have completed this academy's missions and lessons but never worked on an automotive programme. Select **every** statement you may honestly make.`,
        options: [
          { id: "a", text: "\"I have practised fault-injection test design and HIL concepts in simulation.\"", correct: true, feedback: `True, and labelled as practice.` },
          { id: "b", text: "\"I have HIL experience.\"", correct: false, feedback: `Without a rig, this is the claim that collapses on the first follow-up.` },
          { id: "c", text: "\"I can explain how ASIL is derived and what evidence a safety mechanism needs.\"", correct: true, feedback: `A knowledge claim, verifiable in the interview.` },
          { id: "d", text: "\"I worked on ISO 26262 projects.\"", correct: false, feedback: `Training is not employment history.` },
          { id: "e", text: "\"My real responsibilities were avionics board test and debugging; the automotive vocabulary is from study and practice.\"", correct: true, feedback: `The separation stated explicitly, which is exactly what a careful interviewer wants to hear.` },
        ],
        solvedFeedback: `Right. Practice is described as practice, knowledge as knowledge, employment as employment.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "transfer-paragraph-order",
        skill: "applications",
        objective: "Structure a transfer paragraph.",
        prompt: `Order the parts of a strong cover-note paragraph for a cross-industry application.`,
        items: [
          { id: "did", text: "What you actually do now, with one concrete example and a number", why: "Evidence first; it earns the reader's attention." },
          { id: "map", text: "The target industry's name for those skills", why: "Does the translation for the reader." },
          { id: "gap", text: "The honest boundary: what you have practised but not done professionally", why: "Pre-empts the follow-up and signals trustworthiness." },
          { id: "ask", text: "What you want to learn there and why their domain", why: "Shows the move is deliberate, not a scatter-gun." },
        ],
        correctOrder: ["did", "map", "gap", "ask"],
        solvedFeedback: `Correct. Evidence, translation, boundary, intent.`,
      },
    },
    {
      type: "interview",
      questionId: "honest-experience",
      intro: `Use the transfer sentence for one real skill, then state one boundary plainly. Interviewers trust the boundary more than the claim.`,
    },
    {
      type: "recap",
      summary: `- Transfer sentence: what I did, the evidence, their name for it.
- Automotive values speed with safety and HIL evidence; medical values risk-driven records and essential performance; industrial values robustness, fieldbus and on-site fault isolation; consumer values cost, EMC and fast iteration. Instrument, automation, bring-up and root-cause skills transfer unchanged.
- Training is not employment: practice is described as practice, knowledge as knowledge.
- Cover-note order: evidence, translation, boundary, intent.`,
      cards: [
        { id: "xfer-1", front: "The transfer sentence pattern?", back: "What I did (verb and object), the evidence (number, instrument, artefact), the target industry's name for it." },
        { id: "xfer-2", front: "What does each industry value most?", back: "Automotive: speed with safety, HIL evidence, ASPICE. Medical: risk-driven records, DHF, essential performance. Industrial: robustness, fieldbus, on-site fault isolation. Consumer: cost, EMC, fast iteration." },
        { id: "xfer-3", front: "How do you describe academy practice in an application?", back: "As practice, explicitly: 'I have practised X in simulation'; never as employment history or as 'experience' without the boundary." },
        { id: "xfer-4", front: "Order of a transfer paragraph?", back: "Concrete evidence of what you do now; the target's name for it; the honest boundary; what you want to learn there and why." },
      ],
    },
  ],
};
