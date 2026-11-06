# Teaching format 2.0 pilot

Three lessons rebuilt in the nine-stage Understand → Apply → Master format (ADR-16, docs/CONTENT_AUTHORING.md) and offered to the first learner on a preview deployment. No questionnaire and no interview: the learner simply uses them, and the findings come from what the app records on her device, which she can share as one export file from the Progress page if she chooses.

## The three lessons

| Lesson | Why this one | Format elements exercised |
|---|---|---|
| `reading-a-power-tree` (fundamentals) | A daily topic for power and signal-conditioning validation; the densest common 1.0 lesson | Intuition before theory, the new rail-sag interactive with guidance, every intermediate number, a guided exercise then independent ones, a load-transient complexity step, an at-work close |
| `priority-inversion` (RTOS) | Classic interview topic; the shortest 1.0 lesson yet still front-loaded terms | An analogy before any term, terms introduced one at a time, the existing interactive given guidance, a code walkthrough, hints, two complexity steps, an at-work close |
| `mil-std-1553b-the-word-and-the-message` (avionics, new) | On the target roles' skills lists; an advanced topic that must be learnable from zero in the app | The full arc from scratch: Manchester drawn, the word built field by field in a new interactive, a code walkthrough, a CI-verified lab, decode-this-word exercises, a six-cause diagnostic complexity step |

## What is recorded (device-local, exportable, never sent anywhere)

- Seconds per step (`stepTime`), capped at 20 minutes per visit, so the real duration of each stage can be compared with the stated lesson length.
- Hints used per attempt, attempts before the first correct answer, and which misconception options were chosen.
- Whether the independent exercise is solved after the guided one (the "solve a similar problem without the example" test).
- Depth chosen and switches during the lesson; `completedDepth`.
- The interview self-rating on the lesson's question, as the "can she explain it in her own words" proxy.

## What we look for

| Question | Evidence |
|---|---|
| Which explanations are confusing? | Long dwell on a step followed by a wrong first attempt on the exercise that depends on it |
| Which terminology needs clarification? | Glossary sheet opens (not recorded in 1.0; the step dwell is the proxy) and the misconception chosen |
| Can she explain the concept? | Interview self-rating; completion at Master depth |
| Can she solve a similar problem unaided? | Independent exercise solved with zero hints after the guided one |
| Does she know why it matters? | Time on the "where you will use this" step is non-zero; recap cards reviewed later |
| How long does it really take? | Sum of `stepTime` per depth against `durationMinutes` |

## Recording findings

Findings go into this file under "Findings", in neutral terms (step, pattern, change made), with no personal data. The teaching template in `docs/CONTENT_AUTHORING.md` is adjusted before further lessons are converted.

## Findings

Pending the first use.
