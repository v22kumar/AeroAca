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
- Hints used per attempt, attempt timestamps and correctness, and attempts before the first correct answer. Selected answer ids and misconception choices are not stored; those require observation and cannot be reconstructed from the export.
- Whether the independent exercise is solved after the guided one (the "solve a similar problem without the example" test).
- Current preferred depth and deepest completed depth (`completedDepth`). There is no depth-switch event history or per-depth time breakdown; per-lesson overrides are not a durable event log.
- The interview self-rating on the lesson's question, as a learner-reported practice signal only. It does not establish ability to explain the concept.

## What we look for

| Question | Evidence |
|---|---|
| Which explanations are confusing? | Long dwell on a step followed by a wrong first attempt on the exercise that depends on it |
| Which terminology needs clarification? | Optional observation of confusing terms. Glossary opens and selected misconception options are not recorded; dwell/correctness alone cannot identify the term |
| Can she explain the concept? | Optional observed explanation in her own words. Self-rating and Master-depth completion are activity, not proof |
| Can she solve a similar problem unaided? | Zero-hint independent exercise is a useful task signal; a new unseen variant and retained reasoning provide stronger evidence than retrying a known answer |
| Does she know why it matters? | Optional observed connection to a practical problem. Non-zero dwell and recap review show activity only |
| How long does it really take? | Aggregate capped `stepTime` against `durationMinutes`, noting idle time/revisits. The export cannot attribute time to depth or reconstruct depth switches |

## Recording findings

Findings go into this file under "Findings", in neutral terms (step, pattern, change made), with no personal data. The teaching template in `docs/CONTENT_AUTHORING.md` is adjusted before further lessons are converted.

Keep the export private and voluntary; record no personal results in public source. Document uncertainty and any missing observation. Reading, time, self-ratings and completion cannot establish engineering competence alone. The [implementation plan](ENGINEERING_IMPLEMENTATION_PLAN.md) keeps new-content rollout behind this learner-evaluation gate; no questionnaire or interview is required to use the pilot.

## Findings

Pending the first use.
