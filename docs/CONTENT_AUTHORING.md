# Content authoring guide

Everything a learner reads or interacts with lives under `content/` as typed data. The schemas in `lib/content/schema.ts` are the contract; `npm test` enforces it.

## Principles (from the product brief)

- Problem first, then theory. Every lesson opens with a scenario an engineer would recognise.
- Every exercise has an explicit **objective**, a **skill** tag, a correct answer and **feedback that explains why**, for wrong answers as well as right ones.
- Simulated readings are labelled as simulated. Never present them as measurements.
- Cite references (datasheets, reference manuals, standards) with document ids and URLs where stable.
- No employer-confidential material, no résumé claims, no invented standards requirements.

## Lesson structure

A `Lesson` has: `slug`, `moduleId` (must match `content/curriculum.ts`), `title`, `summary`, `durationMinutes`, `objectives`, `steps`, `references` and a `review` status (`technically-reviewed` or `draft`, shown to the learner).

`steps` must start with `scenario`, end with `recap`, and contain at least one `exercise` and one `interview` step. Step types:

| type | fields |
|---|---|
| `scenario` | `title`, `body` |
| `concept` | `title`, `body`, optional `deeper: { title, body }` (collapsed by default) |
| `visual` | `title`, `visual` (an id from `visualIdSchema`), optional `body`, `caption` |
| `example` | `title`, `body` |
| `exercise` | `exercise` (see below) |
| `interview` | `questionId` from `content/interview.ts`, optional `intro` |
| `recap` | `summary`, `cards: [{ id, front, back }]` (become spaced-review cards; ids must be globally unique) |

Prose fields are Markdown (GFM tables, code fences, inline code, bold, lists).

## Teaching format 2.0: the nine-stage arc with Understand → Apply → Master

Written after the first learner's feedback on 1.0 ("it's not easy understanding"). A lesson that declares `format: "arc"` follows this structure and `tests/teaching-format.test.ts` enforces the rules below. Keep the rollout to the three pilot lessons until learner findings are recorded in `docs/PILOT.md` and this template is adjusted. After that gate, approved new subjects use the learner-validated format and legacy conversions proceed in small evaluated slices, not a platform-wide conversion. See `docs/ENGINEERING_IMPLEMENTATION_PLAN.md`.

| Stage (`stage`) | Step types | Rule |
|---|---|---|
| `why` | `scenario` | A real situation in under 120 words; what the learner will be able to do |
| `intuition` | `concept` | Plain language, an analogy or picture in words, no term used before it is explained, one idea |
| `how` | `visual`, `walkthrough` | Every interactive's `body` starts with **Try this first.** and says what to do; every code block longer than six lines has a `walkthrough` step with line-range notes |
| `theory` | `concept` | Terms introduced one at a time; calculations show every intermediate value |
| `example` | `example` | Start to finish, every decision justified, before the first exercise |
| `practice` | `exercise`, `lab` | The first exercise is guided (`hints`, revealed one at a time, recorded with the attempt) at `understand` depth; an independent exercise of the same shape follows without hints |
| `complexity` | `concept`, `scenario` | A failure mode, unexpected behaviour or trade-off, at `master` depth |
| `check` | `exercise`, `interview` | Explain, calculate, debug or justify, with misconception feedback |
| `work` | `concept` | Four short bullets: embedded development, aerospace and UAV, R&D or design, verification and interviews |

Rules: at most **220 words** per concept step body (`deeper` is extra and collapsed); one idea per step; at least one `visual` or `walkthrough`; every step except the scenario and recap carries a `depth`.

**Depth.** `depth: "understand" | "apply" | "master"` on a step means it is shown at that depth or deeper. Untagged steps show at every depth, so 1.0 lessons are unchanged. The learner picks the depth in the player (remembered as a preference, overridable per lesson, switchable mid-lesson without losing position or solved exercises). Completion is recorded per depth (`completedDepth`); the app says "completed at Apply depth", never "mastered". Every depth must still be a playable lesson: scenario, at least one exercise, recap.

**Walkthrough step.** `{ type: "walkthrough", title, intro?, language, code, notes: [{ lines: "8-11", text }] }`. Notes are in line order and may not exceed the code's length.

**Hints.** `hints: string[]` on any exercise. The player reveals them one at a time on request; the attempt records how many were used and a solve says "solved with 2 hints".

## Prerequisites

Every lesson declares `prerequisites`: the slugs of the lessons it rests on, in the order a learner should take them. An empty list means a deliberate starting point; `tests/content.test.ts` allows that only for the three entry lessons (circuit laws, the multimeter and bench supply, register bit masks) and refuses cycles and unpublished slugs. The lesson page shows the list as "Before this lesson" with each prerequisite's completion state. Prerequisites inform; they never lock a lesson.

## Runnable labs (`lab` steps)

A `lab` step shows a program the learner builds and runs on her own PC, with the exact command and the output she should see. The step holds only `title`, `body` (what to do and what to notice), `lab` (an id from `labs/manifest.json`) and an optional `tryNext` (a change to make and predict). The code, command and expected output come from `lib/labs/generated.ts`, which `node scripts/sync-labs.mjs` produces by **running** every lab; `tests/labs.test.ts` runs them again in CI and fails on any difference. To add a lab:

1. Put the program in its own folder under `labs/<language>/<name>/` (standard C11 or Python standard library, deterministic output, one screen).
2. Add an entry to `labs/manifest.json` with `id`, `dir`, `language`, `file` and the `command` as the learner will type it from that folder.
3. Run `node scripts/sync-labs.mjs`, check the generated expected output by eye, and commit `lib/labs/generated.ts` with the lab.
4. Reference the lab from a lesson `lab` step or a portfolio stage's `buildIt.steps`.

`docs/LOCAL_LAB.md` is the learner's set-up guide; keep it true when a lab needs something new.

## Exercise kinds

- `single`: options with exactly one `correct: true`; every option carries its own `feedback`.
- `multi`: select-all-that-apply; feedback per option plus `solvedFeedback`.
- `order`: items with a `why` note each, `correctOrder`, `solvedFeedback`. The UI is tap-to-order (no drag).
- `numeric`: `answer`, `tolerance`, `unit`, `solution` (worked), `solvedFeedback`, optional `misconceptions` with targeted feedback for specific wrong values.
- `register`: `width` (8/16/32), `initial`, `target`, `fields`, optional `protectedBits` (changing them is called out), `solution`, `solvedFeedback`.

Skill tags (`skill`) drive the weak-area list; add a label for new tags in `lib/progress/selectors.ts` (`skillLabels`).

## Adding an interactive visual

1. Add the id to `visualIdSchema` in `lib/content/schema.ts`.
2. Create a client component under `components/visuals/` (SVG with `viewBox`, `width: 100%`, keyboard-operable controls, `aria-label`s).
3. Map it in `components/visuals/Visual.tsx`.

## Missions

A `Mission` has `scenario`, `goal`, `budgetMinutes`, `actions`, `diagnoses`, `fixes`, `optimalPath`, `debrief`, `references` and optionally `relatedLesson`.

Actions: `id`, `label`, `category`, `costMinutes`, optional `requiresAnyOf` (ids that unlock it), `result` (what is observed), `assessment` (`key` | `useful` | `neutral` | `wasteful` | `risky`), `assessmentNote` (why), optional `evidence` tag.

Diagnoses: exactly one `correct: true`, with `requiresEvidence` listing the evidence tags a reviewer would demand. Every wrong diagnosis needs a substantive explanation (the tests check length).

Fixes: exactly one `quality: "best"`, others `acceptable` or `wrong`, each with feedback.

The tests check that `optimalPath` is reachable in order, collects all required evidence, and fits within `budgetMinutes`.

## Glossary

`content/glossary.ts` holds every technical term. Each entry has `term`, optional `aliases`, `short` (one plain sentence), `detail` (precision), `why` (what it means for her work or an interview) and optional `relatedLesson`.

Terms are matched automatically in rendered Markdown by `lib/content/glossary-matcher.ts`: the first occurrence per block becomes tappable. Aliases written in capitals (ACK, START, CAN) match case-sensitively so ordinary words stay plain; everything else is case-insensitive. Code, links and headings are never matched. Exercise option labels are deliberately not matched so a tap selects the option.

When you introduce a new technical word in a lesson, add it to the glossary in the same change. The test suite checks ids and aliases are unique and that every lesson contains tappable terms.

## The 30-day journey

`content/journey.ts` lists 30 days. Each day has a `title`, a one-sentence `focus`, a fast-track `block` (1–6) and `items`:

| kind | meaning | complete when |
|---|---|---|
| `lesson` / `mission` | a published slug | lesson completed / mission solved with evidence |
| `interview` | question ids to rehearse | every question has a self-rating |
| `review` | spaced review | no cards due |
| `apply` | a real-world career action with `id`, `title`, `detail`, `minutes` | the learner ticks it |
| `planned` | content not yet published, with a `title` and `minutes` | never |

A day is complete when every *available* item is done; planned items are shown as coming soon and are ignored for completion. Keep each day between 15 and 45 minutes (the tests check this). When a planned lesson is published, replace the `planned` item with a `lesson` item in the same day.

## Interview questions

`content/interview.ts`: `id`, `moduleId`, `topic`, `question`, `probes`, `rubric.strong`, `rubric.weak`, `sampleAnswer`, optional `relatedLesson`, optional `industries` (sector + note on how the question plays out in avionics, automotive, medical, industrial or consumer work). Questions should probe reasoning; the rubric should be specific enough that a learner can self-grade honestly.

## Curriculum

`content/curriculum.ts` lists all 16 modules. Each lesson or mission entry is `{ title, status: "published" | "planned", slug? }`. Published entries must have a slug that exists in the registry; planned entries must not have a slug. The UI never shows planned content as playable.

## Portfolio "Build it"

A stage may carry `buildIt: { intro, steps: [{ title, lab, note }] }`. Each `lab` is a manifest id under `labs/portfolio`; the page shows the command and the verified expected output so the stage teaches implementation and testing, and the tick boxes record that the learner ran them.

## Checklist before publishing

- [ ] `npm test` passes (schema, cross-references, answer keys).
- [ ] Every wrong option's feedback says *why* it is wrong.
- [ ] Numbers and pin names checked against the cited reference.
- [ ] Simulated values are labelled.
- [ ] `review.status` is honest.
- [ ] Walk the lesson on a phone-width viewport (`npm run dev`, DevTools device mode).

### Timed mock interviews

A journey interview item may set `mock: true`. Its link then opens the Interview page with `?mock=1`, which shows a four-minute-per-question timer above the focus set (start, pause, next, finish). The rubrics reveal afterwards as usual and nothing about the timer is stored. Day 29 uses it.

## The starting-level diagnostic

`content/diagnostic.ts` holds the questions (ordinary exercises with a `topic` and the `foundations` lessons a wrong answer points to). Keep it short (about ten minutes), one question per foundation, and map every question to published lessons. The "Start here" list is derived only from wrong answers (`lib/progress/diagnostic.ts`); never add a score.

## Portfolio projects

`content/projects/*.ts` hold `Project` objects validated by `projectSchema`: `slug`, `title`, `summary`, `whyItMatters`, `simulationNote`, `hardwareNote`, `references`, and `stages`. Each stage has `id`, `title`, `goal`, `body` (Markdown), optional `visual`, `relatedLessons` (lesson or mission slugs) and `deliverables`. A deliverable has `id`, `title`, `detail`, `evidence` (what to keep) and `path`: `doc` (written), `sim` (simulation), `hw` (hardware) or `both` (two separate records). Register the project in `content/index.ts` (`projects`). Ticks are stored under `applyDone` as `project:<slug>:<stage>:<deliverable>:<path>`; never mark anything done from content.

