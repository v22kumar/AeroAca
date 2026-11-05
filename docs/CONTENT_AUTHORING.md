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

## Interview questions

`content/interview.ts`: `id`, `moduleId`, `topic`, `question`, `probes`, `rubric.strong`, `rubric.weak`, `sampleAnswer`, optional `relatedLesson`. Questions should probe reasoning; the rubric should be specific enough that a learner can self-grade honestly.

## Curriculum

`content/curriculum.ts` lists all 16 modules. Each lesson or mission entry is `{ title, status: "published" | "planned", slug? }`. Published entries must have a slug that exists in the registry; planned entries must not have a slug. The UI never shows planned content as playable.

## Checklist before publishing

- [ ] `npm test` passes (schema, cross-references, answer keys).
- [ ] Every wrong option's feedback says *why* it is wrong.
- [ ] Numbers and pin names checked against the cited reference.
- [ ] Simulated values are labelled.
- [ ] `review.status` is honest.
- [ ] Walk the lesson on a phone-width viewport (`npm run dev`, DevTools device mode).
