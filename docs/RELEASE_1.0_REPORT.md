# Release 1.0 preparation report

Branch `feat/release-1.0`, stacked on `feat/release-0.9` (PR #9), with every lower branch merged forward. This increment adds no learning content; it closes the gates that can be closed without another person and documents the two that cannot.

## What was implemented

**Content review log** (`docs/CONTENT_REVIEW.md`): one row per published lesson and mission with the item's own `review.status`, reference count, exercise count, interactive id and whether simulated or illustrative material is labelled, plus a **second reader** column that is `pending` for every row. `tests/content-review.test.ts` fails CI if a published item has no row or the row's status disagrees with the content, so the log cannot drift. The log names the items a second reader should take first (standards, CAN, NVIC, ADC, SCPI dialect, mission numbers).

**Release checklist** (`docs/RELEASE_1.0_CHECKLIST.md`): the eleven gates of the 1.0 definition of done, each with its state, evidence and what remains. Nine are met (one with notes); two need people: second-reader signatures and real-learner feedback.

**Stacked-merge procedure** (`docs/DEPLOYMENT.md`): how to merge PRs #2 to #10 in order, retargeting each to `main` as the one below merges, with the revert and rollback paths, and how a low-stack fix is merged forward (as done for the scrollable-table fix).

**Performance and accessibility pass**, measured with Lighthouse 12 (mobile emulation) against the local production build:

| Page | Before (perf / a11y / best practices) | After | Change |
|---|---|---|---|
| Today `/` | 84 / 100 / 100, CLS 0.177 | 98 / 100 / 100, CLS 0.049 | loading skeleton sized like the real cards |
| Lesson (CAN) | 92 / 100 / 100 | 94 / 100 / 100 | visuals already on demand (0.9) |
| Portfolio `/portfolio` | 70 / 98 / 100, TBT 620 ms | 75 / 100 / 100, TBT 450 ms | stage bodies mount only when a stage is opened; a heading-order fault fixed |

Two accessibility defects found by Lighthouse that axe had not flagged were fixed: a heading level jump on the portfolio page, and glossary term buttons whose accessible name did not start with their visible text when the visible word was an alias (WCAG 2.5.3). The CI failure on PRs #6 to #8 (a horizontally scrollable table without keyboard access on the mobile viewport) was fixed on `feat/release-0.6` and merged forward; CI is green on every open PR.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 11 files, 56 passed (new: content review log in sync with content) |
| `npm run build` | all routes static |
| `npm run test:e2e` | 130 passed (65 scenarios × Pixel 7 and Desktop Chrome); the portfolio spec reopens a stage after reload because stage bodies now mount on open |
| GitHub Actions | green on `feat/release-0.6` to `feat/release-0.9` after the merge-forward |

## What remains for 1.0

- A second technical reader signs `docs/CONTENT_REVIEW.md` rows, standards and bus/interrupt items first.
- A real learner completes the representative set (days 1–3, one mission, one timed mock, portfolio stage 1) and feedback is incorporated in a 1.0.x patch.
- The Product Owner merges PRs #2 to #10 in order, verifies production, and creates the `v0.1.0` and `v1.0.0` tags on GitHub.
