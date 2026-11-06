# Content-completion PR: validation checklist and deferred checks

Execution rule for this PR: **content first, CI later.** Work was committed locally at checkpoints without pushing; one consolidated push and one full validation cycle happen at the end. This file records what was checked locally while writing, what was deliberately deferred, and every known technical uncertainty, so nothing is claimed that was not run.

## Checked while writing (cheap, local, no CI)

| Check | Result | When |
|---|---|---|
| Every SVG in `public/diagrams/` parses as XML | 42 files, 0 invalid | after generation |
| Markdown links between the new documents resolve to existing files | see "Link check" below | before the final push |
| No personal identifiers (phone, e-mail, employer or programme names, dates of employment, education details) in the new documents | grep for a fixed list, manual read of the career guide | before the final push |
| Technical facts spot-checked against sources: 1553 word/timing figures (MIL-STD-1553B), ARINC 429 word layout, DO-178C objective counts per level (Annex A: 71/69/62/26/0), STM32F4 PLL arithmetic to 84 MHz, LVTTL thresholds, CAN frame fields, response-time example (6 → 12 → 14) | consistent with the published lessons and the standards' public summaries; a second technical reader is still required | while writing |

## Deferred to the single final cycle (recorded, not skipped)

| Check | Why deferred | Command |
|---|---|---|
| Unit tests incl. content, content-review, teaching-format, labs rebuild | no content data or lab changed in this PR; run once at the end to prove it | `npm test` |
| Lint and typecheck | one script added (`scripts/gen-diagrams.py`, Python; not linted by ESLint) | `npm run lint && npm run typecheck` |
| Production build and route check | diagrams are static files under `public/`, no route change expected | `npx next build` |
| Playwright (Pixel 7 + desktop) | no UI change; run the full suite once to confirm | `npx playwright test --trace off` |
| Accessibility (axe) | diagrams are not yet embedded in app pages; the docs are read on GitHub | included in the Playwright run |
| CI on the pushed head | one push at the end | GitHub Actions |
| Second technical reader of the new documents | human gate, as for every content item | `CONTENT_REVIEW.md` process |

## Known technical uncertainties (to be confirmed by the technical reader)

- DO-178C objective counts per level are quoted from Annex A as commonly summarised (71, 69, 62, 26); the exact count depends on how the supplements' objectives are tallied for a given project. The diagram says so.
- The frame-executive diagram uses a 100 ms major frame with 10 ms minor frames as a teaching example; real systems vary.
- The response-time timeline is one legal worst-case ordering consistent with the equation, not the only one.
- The redundant-channel diagram shows a generic triplex with a voter per channel; real architectures differ (command/monitor pairs, dissimilar channels). The lesson text says so.
- Logic-level values are LVTTL (3.3 V); other families differ.
- ARINC 429 "at least four bit times of null between words" is the standard's inter-word gap; equipment often uses more.

## What this PR does not claim

Modules 17 to 31 are written blueprints, not playable lessons; the app's curriculum page is unchanged. Diagrams are source assets and documented specs; embedding them in lesson steps is listed under "implement next" in the PR description. No learner evaluation, technical accuracy or job outcome is established by any check in this file.

## Final-cycle record

Filled in when the consolidated push is made.

| Check | Command | Result | Notes |
|---|---|---|---|
| | | | |
