# Release 1.1 record: syllabus completion chain deployed

Date: 2026-11-06. Authorised by the Product Owner ("merge all and put live").

## What went live

`main` at `e88c7f0d1f4a874b5516caf4b61b84bedfb40585`, Vercel production deployment `dpl_9A4aAbUDG4e3qpihS6wpXkZP1vvA`, https://aeroaca.vercel.app. Rollback candidate: the previous production deployment `dpl_5YtF9Jv77rmVFhrDHQkU5gX8YryN` (Release 1.0, `main` at `d291bf5`), promotable from the Vercel dashboard; or `git revert -m 1` of the merge commits below in reverse order.

| Order | PR | Merge commit | Content |
|---|---|---|---|
| 1 | #11 | `b55727f` | Release 1.0 deployment record |
| 2 | #12 | `0e142da` | Syllabus coverage matrix, gap report, wording corrections |
| 3 | #13 | `f0c539d` | Prerequisites, starting-level diagnostic, CI-verified labs, portfolio Build-it, accessibility fixes |
| 4 | #14 | `2753e51` | Six fundamentals and instrumentation lessons, two interactives, two labs |
| 5 | #15 | `c3dce44` | Eight Embedded C and STM32 lessons, clock-tree interactive, five labs |
| 6 | #16 | `3cd8b84` | Teaching format 2.0 pilot: depth levels, lesson map, hints, walkthroughs; three rebuilt lessons; 1553 lesson and lab |
| 7 | #17 | `5dc0f28` | Engineering audit, four pathways, 114-subject matrix, reconciled advanced modules 17 to 31, P0-1a specification |
| 8 | #18 | `e88c7f0` | Full written curriculum, topic breakdown, career-switch guide, learner guide, study plans, 42 diagrams, figure step embedded in 28 lessons |

Each PR had a green CI run on its own head before merging. `main` CI after the final merge: run 42212642807, success. The chain was merged in one pass on the Product Owner's instruction; intermediate `main` runs were not awaited between merges.

## Verification on production

| Check | Result |
|---|---|
| Every page, lesson (52), mission (10), PWA file and diagram (42) URL | 114 routes, all 200 |
| Full browser suite against https://aeroaca.vercel.app (Pixel 7 + desktop, incl. axe) | 184 passed, 1 flaky, 1 failed: the figure-load assertion sampled `naturalWidth` once before the SVG arrived over the production link; fixed in PR #19 (poll; figure no longer lazy-loaded) and re-run against production: passed on both profiles |
| Diagrams served | `image/svg+xml`, 200 |
| Learner progress | Store version unchanged (1); new fields optional; 1.0 backups import unchanged (unit-tested) |

## Content now in production

52 lessons (three in the 2.0 format), 10 missions, 16 CI-verified labs, 57 interview questions, 42 diagrams embedded through 29 figure steps, the starting-level diagnostic, prerequisites on every lesson, the portfolio with Build-it labs, and the written blueprint for modules 17 to 31 under `docs/`. Modules 17 to 31 remain blueprints, not playable lessons; the app's curriculum page lists only published content.

## Open gates carried forward

- Learner pilot findings (`docs/PILOT.md`) before the 2.0 format is rolled out further; P0-1a is the first lesson after it.
- Second technical reader for every content item (`docs/CONTENT_REVIEW.md`), including the six uncertainties listed in `docs/CONTENT_PR_VALIDATION_CHECKLIST.md`.
- Tags: `v1.1.0` at `e88c7f0` to be created on GitHub by a human (the build environment's git proxy refuses tag pushes).
