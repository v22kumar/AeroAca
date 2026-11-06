# Release 0.9 report: learning intelligence

Branch `feat/release-0.9`, stacked on `feat/release-0.8` (PR #8). Recommendations and readiness derived only from recorded evidence, a migration test from a Release 0.1 backup, and a performance pass on lesson pages.

## What was implemented

**Recommendations from evidence** (`lib/progress/recommend.ts`, ADR-13): an ordered list of next steps, each with the facts behind it. Retries for exercises answered wrongly or left unsolved (deep-linked to the step), lessons that exercise a weak skill or sit in the same module as the mistake, the grounding lesson for a "not yet" or "shaky" interview rating (or a rehearsal link once that lesson is complete), missions whose module lessons are all complete, and the first lesson of untouched modules. Shown on Today ("Retry and reinforce", top three) and on Progress (top six). No scores, no predictions; each line names its wrong answers, ratings or gaps.

**Readiness, explained** (`lib/progress/readiness.ts`): per module, lessons completed, missions solved with evidence, interview questions rated confident, open wrong answers, a status in words (no evidence yet → started → lessons complete → lessons and missions complete → evidence complete) and the gaps that would change it. Shown on Progress. No percentages anywhere; the browser test asserts the absence of the % sign.

**Migration test** (`tests/store-migration.test.ts`): a backup in the exact shape Release 0.1 wrote (schema version 1, before active runs, journey ticks and project ticks) imports unchanged; the journey, targeted review, recommendations and portfolio all derive from it without a migration step; a round trip is byte-equal; an unknown version is rejected without touching the current state.

**Performance pass** (ADR-14): the visual dispatcher now loads each interactive with `next/dynamic`. Measured on the CAN lesson page: none of the other eighteen visuals' code appears in its initial scripts. The largest remaining chunk is the typed content bundle (lessons, missions, glossary) that every client page needs to derive progress; it is text, compresses well and is cached by the service worker after the first load.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 10 files, 53 passed (new: recommendations from a fresh profile, from wrong answers, from shaky ratings; readiness progression; Release 0.1 backup import and round trip) |
| `npm run build` | all routes static; visuals split into their own chunks |
| `npm run test:e2e` | 130 passed (65 scenarios × Pixel 7 and Desktop Chrome). New: fresh-profile readiness and module-gap suggestions with axe WCAG 2.0 A/AA scan and a no-percent assertion; a wrong answer becomes a retry on Today with its count and reopens the step; a shaky rating recommends the grounding lesson |

Two existing browser tests were tightened rather than weakened: the Progress page's lesson rows are located below the new sections, and the "Shaky" assertion now targets the first match because the recommendation text also names the rating.

## Known gaps

- Recommendations are not yet written into journey days as items; they appear beside the day on Today.
- The content bundle is still one chunk; a per-route content split is noted in ADR-14 as a later option.
- No real-learner feedback yet (1.0 gate).
