import type { Lesson } from "@/lib/content/schema";

export const claimsMetricsAndNegotiation: Lesson = {
  slug: "claims-metrics-and-negotiation",
  moduleId: "interviews-experienced",
  format: "arc",
  prerequisites: ["career-gap-contract-and-ownership", "presenting-a-portfolio-project-honestly"],
  title: "Claims, metrics and negotiation: say only what you can back up",
  summary: "Audit every line of your CV with an explain, demonstrate, substantiate test; state a metric with how it was measured; tell 'architected' from 'wrote and maintained'; and understand notice periods and CTC well enough to negotiate from facts, without promises about outcomes.",
  durationMinutes: 16,
  whyItMatters: "A claim on a CV is an invitation to be asked about it. 'Architected a framework that cut regression time by 60 %' will be followed by 'draw it' and 'how did you measure that?'. Candidates who can answer protect the claim and their credibility; candidates who cannot lose both. The offer conversation that follows is easier when you know what the numbers mean.",
  objectives: [
    "Test each of your claims for explain, demonstrate and substantiate, and reword or drop the ones that fail.",
    "State a metric with its baseline, how it was measured, over what runs and by whom, and compute a percentage change correctly.",
    "Choose between 'architected', 'designed', 'wrote and maintained' and 'contributed to' from the facts.",
    "Describe CTC, fixed and variable pay and notice periods in general terms, and negotiate by asking from facts, not bluffing.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The explain, demonstrate and substantiate test and the metric checklist are the academy's own teaching devices. The notes on CTC, fixed and variable pay and notice periods describe common practice in India in general terms; they are not legal, tax or financial advice, and contracts differ. No outcome of any negotiation is implied or promised. All examples and figures are synthetic.",
  },
  references: [
    { title: "Lesson: The gap, the short contract, and 'what did you own?'", note: "The ownership ladder this lesson extends to claims and metrics." },
    { title: "Lesson: Presenting a portfolio project without inflating it", note: "Phrases that inflate a claim and their exact replacements." },
    { title: "Your own offer letter and employment contract", note: "The authority on notice period, buy-out, variable pay and what is included in CTC; read them rather than relying on general descriptions." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "'Architected', 'reduced by 60 %'",
      body: `Ravi's CV has one line he is proud of: **"Architected an automation framework that reduced regression time by 60 %."**

In the interview the panel asks three things. "Can you draw the architecture?" He draws three boxes and cannot say what sits between them. "How did you measure the 60 %?" He says the old run took about fifty minutes and the new one about twenty, and that he only timed each once. "Who designed the framework?" He says the lead did, and he wrote the scheduler script and the report generator.

Every part of the line was close to true. The line as written was not. The panel now has to decide how much of the rest of the CV to trust, and the offer, if it comes, is made with that doubt in the room.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "A claim is a loan against your credibility",
      body: `Every claim on a CV is something the interviewer can ask you to **repay**: with a drawing, a number, or the name of someone who saw the work. A claim you can repay builds trust. One you cannot repay costs more than the claim was worth, because it makes the interviewer wonder about the others.

So the test for any line is not "does it sound good?" but "what happens when they ask me to prove it?".

Think of a bank that lends only against something it can see. Your credibility is the same: it grows when each claim has an **asset behind it** that you can show.

That gives a quiet advantage to the exact claim. "Wrote and maintained the scheduler and report scripts for a regression framework designed by the lead" is smaller. It also survives every question, and the interviewer trusts the rest of what you say.

The aim is a CV in which every line is a loan you can repay in the interview room.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The audit: explain, demonstrate, substantiate",
      body: `For each line of your CV, ask three questions. A line needs all three.

**Explain.** Can you say how it works, from first principles, to a colleague, without notes? If the line names a protocol, a tool or a method, explain it. "Used MIL-STD-1553B" needs you to describe the word, the message and the roles.

**Demonstrate.** Can you show it? Draw it on a whiteboard, write the key ten lines, run it, or walk through the artefact. "Architected a framework" needs a drawing of layers and what lives in each.

**Substantiate.** Is there evidence a third party could check: a log, a report, a repository, a number with its method, or a person who can confirm it?

If a line fails one test, you have three choices. **Reword** it to what you can back up. **Prepare** until you can pass. **Drop** it. Keeping a failing line is the one choice that always costs you.

A claim you can explain and demonstrate but not substantiate is usually a good project with weak evidence. Say what you did and offer to show it.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "A metric is a number plus its method",
      body: `A bare number such as "60 % faster" is a claim, not a result. A **metric** carries its method with it. State six things:

1. **The quantity.** Regression run time, not "performance".
2. **The baseline.** Fifty minutes before, on which bench, with which tests.
3. **The new value.** Twenty minutes after, on the same bench and the same tests.
4. **How it was measured.** Wall-clock time from the run log, or a stopwatch.
5. **How many runs.** The median of ten runs before and ten after is a result; one run each is an anecdote.
6. **Who can confirm it.** A report, a CI history, a colleague.

Then the arithmetic. The **percentage reduction** is (old − new) ÷ old. From 50 to 20 minutes: (50 − 20) ÷ 50 = **60 %**. The same change as a speed-up is 50 ÷ 20 = **2.5 times**. Do not mix the two: "60 % faster" can be heard as either, so say "time cut by 60 %".

If you did not measure carefully, say that: "roughly, from single runs" is honest and still useful. An honest approximation beats a precise-sounding guess.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: Ravi's line, rebuilt",
      body: `**The original.** "Architected an automation framework that reduced regression time by 60 %."

**Audit.**

- *Explain:* he can describe the layers he wrote: scheduler and report.
- *Demonstrate:* he can draw those two layers; he cannot draw the whole.
- *Substantiate:* he has one timing before and one after, and the lead designed the framework.

**Facts to put in.** Before: about 50 minutes. After: about 20. Measured by wall clock from the run log, one run each, on one bench. He wrote the scheduler script, which runs three independent test sequences in parallel, and the report generator. The lead designed the framework.

**The rewrite.** "Wrote and maintained the scheduler and report scripts in a regression framework designed by my lead. The scheduler runs three independent sequences in parallel; the nightly run on one bench went from about 50 minutes to about 20 (time cut by about 60 %, from one timed run each, so approximate). I can draw the two layers I wrote."

**What changed.** The verb matches the work. The number carries its method and its limit. The offer to draw is something he can do. The line is longer and much harder to attack.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "percent-reduction-guided",
        skill: "claims",
        objective: "Compute a percentage reduction correctly (guided).",
        prompt: `A nightly regression took **50 minutes** before a change and **20 minutes** after. By what percentage was the run time **cut**?`,
        unit: "%",
        answer: 60,
        tolerance: 0.5,
        hints: [
          `A reduction is measured against the old value, not the new one.`,
          `Subtract first: how many minutes were saved?`,
          `Divide the minutes saved by the old time, then multiply by 100.`,
        ],
        solution: `Saved: 50 − 20 = 30 minutes. Reduction: 30 ÷ 50 = 0.6, that is **60 %**. The speed-up factor is a different number: 50 ÷ 20 = 2.5 times.`,
        solvedFeedback: `Right: 60 %. Always divide by the old value, and say "time cut by 60 %" so that it is not heard as a speed-up.`,
        misconceptions: [
          { value: 40, tolerance: 0.5, feedback: `40 % is what remains: 20 ÷ 50. The reduction is the 30 minutes saved divided by the old 50 minutes: 60 %.` },
          { value: 150, tolerance: 0.5, feedback: `150 % is the increase in speed, since 50 ÷ 20 = 2.5 times, a rise of 150 %. The time was cut by 60 %. Say which one you mean.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "A claim rewrite, line by line",
      intro: `One rewritten CV line, annotated. The scenario is synthetic. Each phrase is there to answer a question the interviewer is likely to ask.`,
      language: "text",
      code: `Wrote and maintained the scheduler and report scripts
in a regression framework designed by the lead.
The scheduler runs three independent test sequences in parallel.
Nightly run on one bench: about 50 min to about 20 min
(time cut by about 60 %, one timed run each, so approximate).
Run logs and a short design sketch available on request.`,
      notes: [
        { lines: "1-2", text: `The **verb** and the **boundary**. "Wrote and maintained" is the rung the facts support, and "designed by the lead" says honestly where the design credit sits.` },
        { lines: "3", text: `The **mechanism**. One sentence on *why* it is faster lets the interviewer test your understanding, and you can explain it.` },
        { lines: "4-5", text: `The **metric with its method**: baseline, new value, which bench, and the sample size. "Approximate" states the limit before anyone has to find it.` },
        { lines: "6", text: `The **substantiation**: what exists and can be shown. Only write it if it is true.` },
      ],
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "percent-reduction-independent",
        skill: "claims",
        objective: "Compute a percentage reduction without help.",
        prompt: `After a change to the build, a test suite takes **27 minutes** where it took **45 minutes**. By what percentage was the time **cut**?`,
        unit: "%",
        answer: 40,
        tolerance: 0.5,
        solution: `Saved: 45 − 27 = 18 minutes. 18 ÷ 45 = 0.4, that is **40 %**. The speed-up is 45 ÷ 27 ≈ 1.67 times.`,
        solvedFeedback: `Right: 40 %. The method is the same every time: minutes saved over the old time.`,
        misconceptions: [
          { value: 60, tolerance: 0.5, feedback: `60 % is what remains: 27 ÷ 45. The time cut is 18 ÷ 45 = 40 %.` },
          { value: 67, tolerance: 1, feedback: `67 % is the speed-up (45 ÷ 27 ≈ 1.67, a rise of about 67 %). The time was cut by 40 %.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "claim-audit",
        skill: "claims",
        objective: "Apply explain, demonstrate and substantiate to CV lines.",
        prompt: `Select **every** line that passes the audit for the candidate described.`,
        options: [
          { id: "a", text: "'Wrote and ran bench test procedures for a 1553 link.' The candidate can describe the word and the message, show a procedure, and has the run logs.", correct: true, feedback: `Passes all three: explained, shown, and evidenced by logs.` },
          { id: "b", text: "'Architected the test strategy.' The candidate followed a strategy written by the lead and cannot draw it.", correct: false, feedback: `Fails explain and demonstrate, and the verb is a rung too high. Reword it to the part the candidate did.` },
          { id: "c", text: "'Reduced test time by 60 %.' The candidate has one stopwatch timing before and after, and says so when asked.", correct: true, feedback: `It passes if it is worded with its limit ("from single timed runs, so approximate") and the candidate can say what changed. Honest approximation is substantiation of a kind.` },
          { id: "d", text: "'Expert in DO-178C.' The candidate has read summaries and written test procedures traced to requirements.", correct: false, feedback: `"Expert" fails: the work was real but narrow. Say what was done: "wrote requirements-based test procedures under a DO-178C process".` },
        ],
        solvedFeedback: `Right: a line passes when you can explain it, show it and point to evidence. The ones that fail are reworded to what is true, not hidden.`,
      },
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "Notice period, CTC and negotiating from facts",
      body: `This is general information about common practice in India, not legal, tax or financial advice. Your own offer letter and contract decide.

**Notice period.** Many contracts require a fixed notice, often thirty to ninety days. Some employers release people earlier, and some allow a **buy-out**, where a payment replaces part of the notice. Whether either is possible is the employer's decision. Do not promise a start date you cannot keep; say what the contract says and ask what is possible.

**CTC** is cost to company, the total a year. It is not the amount that arrives each month. It usually includes **fixed** pay, **variable** pay that depends on targets and may not be paid in full, and employer contributions and benefits. Ask for the **breakup** in writing and compare **fixed with fixed**.

**Negotiating from facts.** Ask rather than demand. Use what you can support: your scope, your evidence, public ranges for the role. Never bluff about another offer.

No interview, course or lesson can promise an outcome. Salary depends on the employer, the role and the market.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Where claims and numbers go wrong",
      body: `Common traps, each seen in real interviews.

**Metrics that are not comparable.** The "before" ran on an old bench and the "after" on a faster PC. The change you credit is not the only one. Say what else changed.

**One run, stated precisely.** "59.4 %" from a single timing sounds exact and is not. Round to the precision you have.

**Vanity metrics.** "Wrote 400 test cases" says nothing about requirements covered or defects found. Prefer a count that connects to an outcome.

**Verb creep.** "Designed" becomes "architected" becomes "owned" across versions of a CV. Re-audit each version against the ownership ladder.

**Confidential figures.** If numbers belong to an employer, give a relative result ("cut by about half") or the method without the absolute figures, and say why.

**The offer stage.** Treat an offer as a set of facts: fixed pay, variable pay and its conditions, notice, start date. Do not accept or decline on the headline figure alone, and do not negotiate in anger.

Finally, a limit: an honest, modest record that you can fully defend will usually serve you better over years than a larger one that cannot be repaid.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "numeric",
        id: "variable-share",
        skill: "negotiation",
        objective: "Read the structure of a CTC figure (a made-up example).",
        prompt: `A synthetic offer letter states a CTC of **₹12 lakh** a year: **₹9.6 lakh fixed** and **up to ₹2.4 lakh variable**, paid only if targets are met in full. What percentage of the stated CTC is **not guaranteed**?`,
        unit: "%",
        answer: 20,
        tolerance: 0.5,
        solution: `The variable part is 2.4 ÷ 12 = 0.2, that is **20 %** of the stated CTC. It depends on targets and may be paid in part or not at all. The fixed 80 % (9.6 lakh) is the figure to compare with another offer's fixed pay. These numbers are invented for the exercise and say nothing about any real role.`,
        solvedFeedback: `Right: 20 %. Compare fixed with fixed, and ask in writing how the variable part is earned.`,
        misconceptions: [
          { value: 80, tolerance: 0.5, feedback: `80 % is the fixed share, the part that is paid. The variable share is the remaining 2.4 out of 12, 20 %.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "offer-response",
        skill: "negotiation",
        objective: "Choose a fact-based response to an offer.",
        prompt: `You receive an offer. The fixed pay is below what you hoped for, the notice period in your current contract is 60 days, and the recruiter asks for your start date. What is the best response?`,
        options: [
          { id: "a", text: "Say you have a better offer elsewhere, which you do not, to push the figure up.", correct: false, feedback: `A bluff can be checked and costs you the offer and your credibility. Negotiate from facts you can support.` },
          { id: "b", text: "Say you can start in two weeks to show enthusiasm, then sort out the notice period afterwards.", correct: false, feedback: `A date you cannot keep damages trust. State what the contract says and ask what is possible.` },
          { id: "c", text: "Thank them, ask for the written breakup of fixed and variable pay, say your notice is 60 days under your contract and ask whether an earlier release is possible, and ask whether the fixed pay is open to discussion given your relevant experience.", correct: true, feedback: `Yes: it asks rather than demands, states the notice period honestly, compares on facts, and makes no claim about what you will get. The employer decides what is possible.` },
          { id: "d", text: "Accept at once; any offer is a win and negotiating is risky.", correct: false, feedback: `Asking politely about the breakup and the start date is normal. An offer is a set of facts to read before you decide.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "how-did-you-measure-it",
      intro: `Take one number from your own CV and defend it: the quantity, the baseline, how it was measured, over how many runs, and who can confirm it.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Commit messages, release notes and design reviews all quote numbers; stating them with their method is the habit that makes a team trust you.
- **Aerospace and UAV systems.** Avionics reviews and audits ask for evidence behind every claim in a test report; the audit in this lesson is the same question in a different room.
- **R&D and design.** Reporting a result as a number plus its method, and its limits, is what lets a design decision rest on it.
- **Verification and interviews.** "How did you measure that?" and "draw the architecture" are standard follow-ups; the offer conversation that comes after is calmer when your record is fully defensible.`,
    },
    {
      type: "recap",
      summary: `- Every claim is a loan against your credibility: the interviewer may ask you to repay it with a drawing, a number or a name.
- Audit each line: explain, demonstrate, substantiate. Reword, prepare or drop what fails.
- A metric is a number plus its method: quantity, baseline, new value, how measured, how many runs, who can confirm. Reduction is (old − new) ÷ old; say "time cut by", not "faster".
- Choose the verb the facts support: architected needs a design you can draw and own; wrote and maintained is exact and defensible.
- Notice period, CTC, fixed and variable pay are matters for your own contract: ask for the breakup in writing, compare fixed with fixed, ask rather than demand, never bluff. Nothing here promises any outcome.`,
      cards: [
        { id: "clm-1", front: "What is the explain, demonstrate, substantiate test?", back: "For each CV line: can you explain how it works, show it (draw, run, walk through), and point to evidence a third party could check. Reword, prepare or drop any line that fails." },
        { id: "clm-2", front: "What does a metric need besides the number?", back: "The quantity, the baseline, how it was measured, over how many runs, and who or what can confirm it; plus its limits, stated honestly." },
        { id: "clm-3", front: "A test run drops from 50 minutes to 20. What is the reduction and what is the speed-up?", back: "Reduction: (50 − 20) ÷ 50 = 60 %, time cut by 60 %. Speed-up: 50 ÷ 20 = 2.5 times. Say which one you mean." },
        { id: "clm-4", front: "How do you approach an offer's CTC and notice period?", back: "Ask for the written breakup, compare fixed with fixed, check how variable pay is earned, state your contractual notice honestly and ask what is possible; ask rather than demand and never bluff. Outcomes are not guaranteed." },
      ],
    },
  ],
};
