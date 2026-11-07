import type { Lesson } from "@/lib/content/schema";

export const careerGapContractAndOwnership: Lesson = {
  slug: "career-gap-contract-and-ownership",
  moduleId: "interviews-experienced",
  format: "arc",
  prerequisites: ["presenting-a-portfolio-project-honestly", "telling-a-debugging-story"],
  title: "The gap, the short contract, and 'what did you own?'",
  summary: "The first questions an experienced engineer is asked are not technical: what happened in that gap, why was that role short, and what exactly did you own. Learn a forty-five-second shape for the first two and a four-rung ladder for the third, all with true statements.",
  durationMinutes: 14,
  whyItMatters: "These questions come in the first ten minutes and decide whether the technical hour is spent on your strengths or on repairing doubt. Candidates with two to four years of experience lose the most here: long, defensive answers about the gap, and ownership claims that are bigger than the work.",
  objectives: [
    "Answer a question about a gap or a short contract in about forty-five seconds: fact, use, now.",
    "Describe your part in a team result with the right rung of the ownership ladder: did, contributed, led, owned.",
    "Rewrite a loose ownership sentence into one that survives two follow-up questions.",
    "Keep training, simulated practice and professional experience apart in your own words.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The answer shape and the ownership ladder are the academy's own teaching devices, built from common hiring-panel questions for engineers with two to four years of experience. They are communication guidance, not legal or employment advice. All names, durations and projects in the examples are synthetic.",
  },
  references: [
    { title: "Lesson: Presenting a portfolio project without inflating it", note: "The simulated-versus-hardware discipline this lesson applies to your own history." },
    { title: "Lesson: Telling a debugging story", note: "The evidence, decision, outcome shape reused for ownership follow-ups." },
    { title: "Lesson: Same skills, different industries", note: "The transfer sentence used in the last beat of the gap answer." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "Three minutes on a fourteen-month gap",
      body: `Asha has three years of bench test experience: five months on a fixed-term contract, then a permanent role, then fourteen months away from work for family care and self-study. In the interview the first question is friendly: "I see a gap on the CV. What happened?"

She answers for three minutes. She apologises twice, explains the family situation in detail, lists every course she watched, and ends with "so it was not wasted time". The interviewer smiles politely and moves on. Her next answer, to "What did you own on the flight rig?", is "I owned the HIL bench", which is not true: she wrote and ran test procedures on a bench the lead designed.

Neither answer was a lie. Both made the interviewer less sure. This lesson fixes both.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The question behind the question",
      body: `When an interviewer asks about a gap, they are almost never asking for your story. They are checking one thing: **is there a risk I should know about?** A short, calm, true answer closes that question. A long one opens it.

Think of a boarding-gate announcement: it says what, when and what next, in a few seconds, and nobody feels lied to. Nobody expects the pilot's biography.

"What did you own?" hides a different check: **will this person tell me the truth about their work?** Interviewers compare what you say with what the rest of your answers suggest. A claim that is a size too large makes them doubt the true parts too.

So the aim is not to impress. It is to be **easy to believe**: short on what is private, exact on what is professional, and ready for the next question.

You can always decline detail politely. "That was a family matter; it is resolved, and I am ready to work" is a complete answer.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The forty-five-second shape: fact, use, now",
      body: `Three beats, about fifteen seconds each.

**1. Fact.** What happened, in one plain sentence, at the level of detail you are comfortable sharing. "I took fourteen months away from work for family care."

**2. Use.** What you did that is true and relevant, or what you kept current. Name something concrete: a small project, a standard you read, a skill you practised. Be exact about what kind of activity it was. Course work and self-built projects are **training**, not **professional experience**, and you should say so in your own words.

**3. Now.** Why you are ready and why this role. One sentence, ideally a **transfer sentence** that connects what you did before to what the job needs.

For a **short contract**, the shape is the same. Fact: "a five-month fixed-term contract". Use: what you delivered in that time. Now: what you took from it.

Do not apologise, do not over-explain, do not fill the silence with detail nobody asked for. After the third beat, stop and let them speak.

What you say must be checkable. A reference call or a CV check should find the same story you told.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The ownership ladder: did, contributed, led, owned",
      body: `"What did you own?" has four honest answers. Each is one rung of a ladder, and each has a different test.

- **Did.** You carried out work that someone else defined. Test: could someone have given you the same task and got the same output? "I wrote and ran the bench test procedures for the cross-channel link."
- **Contributed.** You produced a share of a team result. Say how much. "I wrote 14 of the 40 test cases in the failover plan."
- **Led.** You directed other people on a piece of work. Test: did someone else's output depend on your decisions? "I coordinated the regression run for one release across three engineers."
- **Owned.** You were **accountable** for the result and the decisions, including the ones that went wrong. Test: if it failed, who would be asked? Who signed it?

Most junior and mid-level verification work is **did** or **contributed**, and that is a respectable thing to say. The risk is a rung too high, because the next question will test the rung: "who decided that?" and "what would you change?".

Choose the verb first. The noun follows.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: Asha's two answers, rebuilt",
      body: `**The gap answer, forty-five seconds.**

*Fact:* "I took fourteen months away from work for family care."

*Use:* "During that time I kept my skills current: I read the public MIL-STD-1553B and DO-178C summaries and built a small test-automation project that parses synthetic telemetry frames and checks their CRCs. That is self-directed practice, not paid work, and I would be glad to show it."

*Now:* "Before the break I tested avionics buses on a bench, and this role is the same kind of work on a larger rig, which is why I applied."

Then stop. About a hundred words, and every sentence checkable.

**The ownership answer.** Facts: Asha wrote and ran procedures; the lead designed the bench; a reviewer signed the reports.

*Weak:* "I owned the HIL bench."

*Exact:* "I **wrote and ran** the bench test procedures for the link; the bench architecture was the lead's. I **contributed** 14 of the 40 failover cases, and I found and reported two defects with their traces."

The rung is stated. The interviewer can ask "what did you decide?" and the answer is available.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "gap-first-sentence",
        skill: "interview-ownership",
        objective: "Choose the opening sentence of a gap answer (guided).",
        prompt: `You were out of work for nine months after a project ended. Which is the best **first sentence** when the interviewer asks about the gap?`,
        hints: [
          `The first beat is the fact: what happened, in one plain sentence.`,
          `Avoid apologising, and avoid starting with detail nobody asked for.`,
          `Look for the option that states the fact calmly and is easy to check.`,
        ],
        options: [
          { id: "a", text: "I am so sorry about that gap, it really was a very difficult time for me and I hope you will understand.", correct: false, feedback: `An apology invites the interviewer to look for the problem. The question is whether there is a risk, and this answer suggests there might be.` },
          { id: "b", text: "My last project ended in March and I took nine months to look for the right kind of role and to keep my skills current.", correct: true, feedback: `Right: one plain, checkable fact, calm in tone. It leaves room for the second beat, what you did to keep current.` },
          { id: "c", text: "I was working as a freelance consultant for several international clients during that time.", correct: false, feedback: `If that is not true, it will not survive a reference check, and it is exactly the kind of invention that makes every other claim doubtful.` },
          { id: "d", text: "That is a private matter and I would rather not discuss anything about it.", correct: false, feedback: `Declining detail is fine; declining the whole question is not. Give the fact in one sentence and decline the rest politely.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "Reading a forty-five-second answer line by line",
      intro: `This is a complete gap answer, a short contract included, written out so you can see what each sentence is doing. All details are synthetic.`,
      language: "text",
      code: `After my five-month contract ended I took a planned career break.
The contract was fixed-term by design: I wrote bench test procedures
for a data-bus link and delivered them, and the project then closed.
During the break I kept current on the public standards and built a
small test project that checks synthetic telemetry frames; it is
self-directed practice, not paid work, and I can show it.
This role is the same kind of work on a larger rig.`,
      notes: [
        { lines: "1", text: `The **fact**, in one plain sentence. No apology, no detail beyond what is needed.` },
        { lines: "2-3", text: `The short contract is explained by what was **delivered**, not by excuses. "Fixed-term by design" is only worth saying if it is true; otherwise state the true reason in one clause.` },
        { lines: "4-6", text: `The **use**: concrete, and labelled correctly as practice, not employment. The label is what keeps the sentence honest, and the offer to show it is what makes it believable.` },
        { lines: "7", text: `The **now**: one sentence linking past work to this job. Then stop talking.` },
      ],
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "ownership-rungs",
        skill: "interview-ownership",
        objective: "Match each sentence to facts it can truthfully describe.",
        prompt: `The facts: you **wrote 14 of 40** failover test cases and **ran them** on a bench the lead designed; a reviewer signed the test report; you reported two defects. Select **every** sentence that is accurate for these facts.`,
        options: [
          { id: "a", text: "I wrote and ran failover test procedures on the bench; the bench design was the lead's.", correct: true, feedback: `Accurate: the rung is "did", and it credits the lead with the design.` },
          { id: "b", text: "I contributed 14 of the 40 failover test cases and reported two defects.", correct: true, feedback: `Accurate: "contributed" with the share stated. It is checkable against the test plan.` },
          { id: "c", text: "I owned the failover verification.", correct: false, feedback: `Owning means accountability for the result and its decisions. A reviewer signed the report and the lead designed the bench, so the next question, "who decided that?", would not have an answer.` },
          { id: "d", text: "I led the failover test effort.", correct: false, feedback: `Leading means others' work depended on your decisions. Nothing in the facts says you directed anyone.` },
        ],
        solvedFeedback: `Right: did and contributed are accurate and defensible; led and owned claim a rung the facts do not support.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "The follow-ups, and where honest answers wobble",
      body: `Each answer above triggers a second question. Prepare for it.

**"Why was that role only five months?"** State the true reason in one clause: fixed-term, project ended, restructure, or your own decision to move. Never blame a person. If it was your decision, say what you were looking for.

**"What did you do in the gap?"** Do not inflate it. A course is **training**; a self-built project is **portfolio work**; neither is paid **professional experience**. Saying so yourself is stronger than being asked.

**"Who decided that?"** The ownership follow-up. If you did the task, say who set it. If you made a design choice, say which one and why; this is the **debugging story** shape again: evidence, decision, outcome.

**"Can we speak to your lead?"** Assume yes. Every sentence should still be true when they are on the phone.

**Confidentiality.** A contract or employer may restrict detail. Describe the **type** of system, your part and the kind of result, and say plainly that you cannot give more.

Limits: no wording makes a weak record strong. These shapes make a true record easy to believe; they do not replace the record.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "order",
        id: "gap-answer-order",
        skill: "interview-ownership",
        objective: "Put the beats of a gap answer in order.",
        prompt: `Put the parts of a forty-five-second gap answer in the order you would say them.`,
        items: [
          { id: "fact", text: "State what happened in one plain sentence.", why: `The fact comes first: it closes the question "is there a risk?" before any detail can open it.` },
          { id: "use", text: "Say what you did or kept current, labelled as training or work.", why: `Concrete, checkable activity shows the time was used, and the correct label keeps it honest.` },
          { id: "now", text: "Link your past work to this role in one sentence.", why: `The transfer sentence turns the answer from a defence into a reason to hire.` },
          { id: "stop", text: "Stop talking and let the interviewer respond.", why: `Extra words after the last beat reopen the question. Silence is part of the answer.` },
        ],
        correctOrder: ["fact", "use", "now", "stop"],
        solvedFeedback: `Right: fact, use, now, then stop.`,
      },
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "ownership-follow-up",
        skill: "interview-ownership",
        objective: "Answer an ownership follow-up truthfully.",
        prompt: `You said "I wrote and ran the failover procedures". The interviewer asks: **"What was the hardest decision you made?"** You did not choose the bench design or the plan, but you did choose how to detect a stuck-at fault in the logs. What do you say?`,
        options: [
          { id: "a", text: "Describe the bench architecture decision as though it were yours, since you worked with it daily.", correct: false, feedback: `That claims a decision you did not make. The lead can be called and will say otherwise.` },
          { id: "b", text: "Say you did not make any decisions, you only followed instructions.", correct: false, feedback: `It is probably untrue, since you chose how to detect the fault, and it undersells real work.` },
          { id: "c", text: "Describe the stuck-at detection choice: what the options were, what evidence you used, what you decided and what happened; say the plan and bench were the lead's.", correct: true, feedback: `Yes. It uses the evidence, decision, outcome shape on a decision that was genuinely yours, and it credits the rest to the lead.` },
          { id: "d", text: "Change the subject to a project from a previous job where you owned more.", correct: false, feedback: `Dodging the question makes the interviewer wonder what is wrong with this one. Answer it with the decision you actually made.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "what-did-you-own",
      intro: `Answer "What did you own?" for a piece of work from your own history. Name the rung, name who decided the rest, and have one real decision ready.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Pull requests and stand-ups use the same ladder: "I did the driver, the design was reviewed by the lead" is a sentence you will say weekly.
- **Aerospace and UAV systems.** Programmes with many suppliers and reviewers expect people to be exact about their part; avionics teams notice quickly when an ownership claim is a size too large.
- **R&D and design.** Design reviews reward saying which decisions were yours and which were inherited.
- **Verification and interviews.** "What did you own?" and "what happened in the gap?" are asked in the first ten minutes of nearly every interview; a calm forty-five-second answer is the best use of them.`,
    },
    {
      type: "recap",
      summary: `- An interviewer asking about a gap or a short contract is checking for risk. Answer in about forty-five seconds: fact, use, now, then stop.
- Label your activity correctly: courses and self-built projects are training and portfolio work, not professional experience.
- The ownership ladder is did, contributed, led, owned. Choose the verb the facts support; the next question will test the rung.
- Every sentence must still be true when the interviewer phones your lead.
- Confidentiality limits detail, not honesty: describe the type of system, your part and the kind of result.`,
      cards: [
        { id: "own-1", front: "What is the forty-five-second shape for a gap or short-contract answer?", back: "Fact (one plain sentence), use (what you did or kept current, labelled correctly), now (why you are ready for this role), then stop." },
        { id: "own-2", front: "What are the four rungs of the ownership ladder and the test for the top one?", back: "Did, contributed, led, owned. Owned means accountable for the result and its decisions: if it failed, you would be asked, and you signed it." },
        { id: "own-3", front: "How should you describe a course or a self-built project done during a gap?", back: "As training or portfolio work, self-directed practice, not paid professional experience, and offer to show it." },
        { id: "own-4", front: "Why is 'I owned the bench' risky if you only ran test procedures?", back: "The follow-up 'who decided that?' has no honest answer, and the lead may contradict it. One claim a size too large makes the true parts doubtful." },
      ],
    },
  ],
};
