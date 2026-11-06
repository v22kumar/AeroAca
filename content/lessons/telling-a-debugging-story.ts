import type { Lesson } from "@/lib/content/schema";

export const tellingADebuggingStory: Lesson = {
  slug: "telling-a-debugging-story",
  moduleId: "interviews",
  title: "Telling a debugging story: evidence, decision, outcome",
  summary: "'Tell me about a hard bug' is the question every hardware interview contains. Learn the evidence-decision-outcome structure, the 90-second and five-minute versions, which numbers to keep, what to cut, and how to run the timed mock interview on day 29 so the story comes out the same under pressure.",
  durationMinutes: 10,
  whyItMatters: "A debugging story is the one answer that shows method, instruments, judgment and honesty at once. Candidates who ramble, or who tell a hero story without evidence, lose the question that was theirs to win. The structure here is what the missions in this academy have been practising all month.",
  objectives: [
    "Tell a debugging story as symptom, evidence, decision, outcome, prevention, in 90 seconds and in five minutes.",
    "Choose the three numbers and the one instrument that make the story verifiable.",
    "Use the mock-interview timer to rehearse under time pressure and grade with the rubric afterwards.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The structure is a domain-specific form of the common situation-action-result pattern, adapted to put measurements at the centre. The example stories are the academy's simulated missions, labelled as such.",
  },
  references: [
    { title: "Missions in this academy (days 1 to 22)", note: "Each ends with a debrief written in this structure; any of them is a rehearsal story, labelled as simulated practice." },
    { title: "Lesson: Root-cause analysis and the five whys that matter", note: "The evidence chain the story narrates." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Two tellings of the resetting board",
      body: `**Telling one:** "So the board kept resetting and nobody could figure it out, and I spent like two days on it, tried everything, swapped the regulator, reflashed it, and eventually I found it was the watchdog, so I fixed that and it worked."

**Telling two:** "A board reset every second. First I read the reset-cause register: the independent-watchdog flag was set, so it was a watchdog reset, not power. The log showed the last line before each reset was a new flash-write call; scoping the supply showed no dip. I measured the write at 1.3 seconds against a 1-second watchdog timeout. The fix was to move the write out of the main loop and refresh the watchdog inside the long operation; I confirmed it by reintroducing the blocking call and watching the reset return. Then I added a release test that checks the longest loop iteration against the timeout."

Same bug. The second telling has a register, a log line, a scope, two numbers, a confirmation and a prevention. It takes 50 seconds.`,
    },
    {
      type: "concept",
      title: "Symptom, evidence, decision, outcome, prevention",
      body: `Five beats, in order, with a rule for each:

1. **Symptom**, one sentence, with a rate or a number. "Reset every second." "One sample in ten thousand." "501.85 °C in a 25 °C room."
2. **Evidence**, two or three measurements, each with its instrument, in the order you took them, and what each one *ruled out*. "RCC_CSR showed IWDGRSTF: a watchdog reset, not brown-out." Ruling things out is what separates method from luck.
3. **Decision**, the moment you chose where to look next or what to change, and why. "Two candidates remained; I measured the one I could measure in a minute."
4. **Outcome**, the fix and the *confirmation in both directions*: the symptom gone over a meaningful period, and brought back by reintroducing the cause. One number here: "zero resets in 72 hours against a baseline of one per second."
5. **Prevention**, what you changed so it cannot recur: a test, a check, a checklist line, a design rule. Interviewers for senior roles listen for this beat above all.

**The 90-second version** has one measurement per beat and three numbers in total. **The five-minute version** adds the hypotheses you discarded, the trap you avoided (or fell into and climbed out of), and the write-up. Prepare both; the interviewer's follow-up tells you which to use.

What to cut: how long it took, how stressed everyone was, who was wrong, and any step that produced no evidence. What never to cut: the instrument, the number, the confirmation, and the boundary ("this was a simulated exercise" or "I was pairing with the senior engineer who suggested the register").`,
      deeper: {
        title: "Using the academy's missions as rehearsal stories",
        body: `Every mission debrief in this academy is already in this shape. Retell three of them aloud, labelled honestly as simulated practice: "In a simulated exercise, a board reset every second…". The structure is identical to a real story and the labelling is what keeps it honest. Then tell one real story from your own work in the same shape; it will come out better for the rehearsal.`,
      },
    },
    {
      type: "example",
      title: "Worked example: the 90-second story, annotated",
      body: `*Symptom.* "A sensor board and a controller each passed their own tests, but together the controller logged 501.85 °C in a 25 °C room." (one number)

*Evidence.* "I captured a frame on the logic analyser: the temperature bytes were 09 C4, which under the interface document's big-endian definition is exactly 25.00 °C, so the sensor was correct. The CRC passed, which ruled out the link. The controller's parser assembled the bytes little-endian." (instrument, two rule-outs, one line of code)

*Decision.* "The side that departed from the document had to change, not the document, because three other consumers implemented it correctly."

*Outcome.* "Fixing the parser gave 25.00 °C; I confirmed with a negative value, FF E6, decoding to −0.26 °C."

*Prevention.* "Golden-frame unit tests for the parser, including negative and invalid-code values, and a reference-thermometer check across the real link."

Boundary: "That one is from a simulated exercise; the real story I'd give you is…" Total: about 80 seconds, three numbers, one instrument, both confirmations, one prevention.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "story-beats-order",
        skill: "communication",
        objective: "Order the beats of a debugging story.",
        prompt: `Put the beats of a debugging story in order.`,
        items: [
          { id: "symptom", text: "Symptom, with a number or rate", why: "One sentence that frames the problem." },
          { id: "evidence", text: "Measurements with instruments, each ruling something out", why: "Method, not luck." },
          { id: "decision", text: "The decision point and its reason", why: "Judgment." },
          { id: "outcome", text: "Fix and confirmation in both directions, with a number", why: "Proof of causation." },
          { id: "prevention", text: "What was changed so it cannot recur", why: "The senior beat." },
        ],
        correctOrder: ["symptom", "evidence", "decision", "outcome", "prevention"],
        solvedFeedback: `Correct. Symptom, evidence, decision, outcome, prevention.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "story-cut",
        skill: "communication",
        objective: "Know what to cut.",
        prompt: `Your five-minute story must become 90 seconds. Which element do you cut **first**?`,
        options: [
          { id: "a", text: "The two days it took and how stressed the team was.", correct: true, feedback: `Yes. Duration and emotion carry no evidence. Cut them first, then any step that produced no measurement.` },
          { id: "b", text: "The instrument you used for the key measurement.", correct: false, feedback: `The instrument is what makes the measurement believable; it stays in every version.` },
          { id: "c", text: "The confirmation that reintroducing the cause brought the symptom back.", correct: false, feedback: `Confirmation in both directions is the proof of causation; cutting it turns the story into a guess that worked.` },
          { id: "d", text: "The prevention step.", correct: false, feedback: `Prevention is the beat senior interviewers listen for; keep it even if it is one clause.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "story-strong-elements",
        skill: "communication",
        objective: "Recognise a strong telling.",
        prompt: `Select **every** element that makes a debugging story stronger.`,
        options: [
          { id: "a", text: "A named instrument for each key measurement.", correct: true, feedback: `Scope, analyser, register read, log: each one makes the evidence checkable.` },
          { id: "b", text: "What each measurement ruled out.", correct: true, feedback: `Rule-outs show the method.` },
          { id: "c", text: "A statement that nobody else could solve it.", correct: false, feedback: `A hero frame adds nothing and invites scepticism.` },
          { id: "d", text: "The boundary: simulated practice, or who you were working with.", correct: true, feedback: `Honesty costs nothing here and buys trust for the rest of the interview.` },
          { id: "e", text: "Swapping five parts in a row until it worked, described as thoroughness.", correct: false, feedback: `Part-swapping without a discriminating measurement is the opposite of method; if it happened, tell it as the trap you learned from.` },
        ],
        solvedFeedback: `Right. Instruments, rule-outs and boundaries; no heroes, no shotgun swaps.`,
      },
    },
    {
      type: "interview",
      questionId: "debugging-story",
      intro: `Tell your 90-second version now, out loud, with the timer if you like. Then grade it against the rubric: did it have an instrument, a number, both confirmations, a prevention and a boundary?`,
    },
    {
      type: "recap",
      summary: `- Five beats: symptom with a number; evidence with instruments and rule-outs; decision with a reason; outcome with confirmation both ways and a number; prevention.
- 90-second version: one measurement per beat, three numbers. Five-minute version adds discarded hypotheses, the trap and the write-up.
- Cut duration, emotion, blame and evidence-free steps. Never cut the instrument, the number, the confirmation or the boundary.
- Rehearse with the academy's missions, labelled as simulated, then with one real story; use the timed mock on day 29.`,
      cards: [
        { id: "story-1", front: "Five beats of a debugging story?", back: "Symptom (with a number), evidence (instruments, rule-outs), decision (with a reason), outcome (fix, confirmation both ways, a number), prevention." },
        { id: "story-2", front: "What do you cut first when shortening a story?", back: "Duration, emotion, blame, and any step that produced no measurement. Keep the instrument, the number, the confirmation and the boundary." },
        { id: "story-3", front: "What makes the outcome beat credible?", back: "Confirmation in both directions: the symptom gone over a meaningful period, and brought back by reintroducing the cause, with a number." },
        { id: "story-4", front: "How do you use a simulated mission as a story?", back: "Tell it in the five beats and label it: 'in a simulated exercise…'. Then tell a real one in the same shape." },
      ],
    },
  ],
};
