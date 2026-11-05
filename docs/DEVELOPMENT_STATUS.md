# AeroAca development status

Progress report against `docs/PRODUCT_ROADMAP.md`. Updated at the end of every increment.

## Current state (2026-11-05)

- **Production:** Release 0.1 at https://aeroaca.vercel.app (Vercel deployment `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo`, `main` at `3c9c722`). Vercel Authentication protects previews only. Rollback via Vercel "Promote to Production" or `git revert -m 1 3c9c722`.
- **Open PR:** #2 Release 0.2 first increment (`feat/release-0.2`). CI green, preview verified at `https://aeroaca-git-feat-release-02-aero-aca.vercel.app`. An independent code review found ten issues (two journey-logic defects among them); all fixed and re-tested. Awaiting Product Owner approval; not merged.
- **Published content:** 8 lessons, 4 missions, 15 interview questions (8 with industry notes), 99 glossary terms, 8 interactive visuals, journey days 1–10 complete.
- **Quality gates (0.2 branch):** lint 0/0, typecheck clean, 43 unit tests, 66 browser tests (Pixel 7 + desktop, incl. axe WCAG 2.0 A/AA), 22 static routes.

## Done

| Increment | Delivered | Evidence |
|---|---|---|
| 0.1 | App shell, content schema, 3 lessons, 2 missions, interview bank, progress store, PWA, glossary, warm design, a11y contrast fix, mission reload persistence | PR #1 merged; `docs/RELEASE_0.1_REPORT.md` |
| 0.2 | 30-day journey model and screens, 5 lessons, 2 missions, 4 visuals, targeted review, interview focus sets and industry notes, 30 glossary terms | PR #2; `docs/RELEASE_0.2_REPORT.md` |

## In flight

- 0.3 (days 11–15): started on `feat/release-0.3`, stacked on `feat/release-0.2` (PR to follow, base `feat/release-0.2` until #2 merges).

## Known gaps and blockers

- Journey days 11–30 reference 20 planned lessons/missions.
- `v0.1.0` tag exists locally only: the git proxy in the build environment refuses tag pushes. **Human action:** create the tag on GitHub at `3c9c722`.
- Physical-device PWA install was verified by the Product Owner on an iPhone; Android has not been checked.
- No real-learner feedback incorporated yet (1.0 criterion).
- Targeted review is not yet scheduled into journey days automatically.

## Decisions needed from the Product Owner

1. Approve and merge PR #2 (Release 0.2 first increment).
2. Whether production should be protected (currently public by URL, as requested for a working production link).
