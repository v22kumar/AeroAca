# AeroAca development status

Progress report against `docs/PRODUCT_ROADMAP.md`. Updated at the end of every increment.

## Current state (2026-11-05)

- **Production:** Release 0.1 at https://aeroaca.vercel.app (Vercel deployment `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo`, `main` at `3c9c722`). Vercel Authentication protects previews only. Rollback via Vercel "Promote to Production" or `git revert -m 1 3c9c722`.
- **Open PRs:** #2 Release 0.2 first increment (`feat/release-0.2` → `main`): CI green, preview re-verified after review fixes (`34fcb79`), awaiting Product Owner approval. #3 Release 0.3 (`feat/release-0.3` → `feat/release-0.2`, stacked): block 3 content; retarget to `main` once #2 merges.
- **Published content (0.3 branch):** 12 lessons, 6 missions, 19 interview questions (12 with industry notes), 121 glossary terms, 9 interactive visuals, journey days 1–15 complete.
- **Quality gates (0.3 branch):** lint 0/0, typecheck clean, 43 unit tests, 76 browser tests (Pixel 7 + desktop, incl. axe WCAG 2.0 A/AA), all routes static.

## Done

| Increment | Delivered | Evidence |
|---|---|---|
| 0.1 | App shell, content schema, 3 lessons, 2 missions, interview bank, progress store, PWA, glossary, warm design, a11y contrast fix, mission reload persistence | PR #1 merged; `docs/RELEASE_0.1_REPORT.md` |
| 0.2 | 30-day journey model and screens, 5 lessons, 2 missions, 4 visuals, targeted review, interview focus sets and industry notes, 30 glossary terms | PR #2; `docs/RELEASE_0.2_REPORT.md` |
| 0.3 | Journey days 11–15: bring-up checklist, test-case writing, root-cause analysis, ICD lessons; 2 missions; traceability matrix interactive; 4 interview questions; 22 glossary terms; light-mode status-colour contrast fix | PR #3; `docs/RELEASE_0.3_REPORT.md` |

## In flight

- 0.4 (days 16–20): startup code and reset vector, RTOS basics, ISR-to-task handoff, bootloaders, embedded Linux orientation. Next on a branch stacked on `feat/release-0.3`.

## Known gaps and blockers

- Journey days 16–30 reference planned lessons/missions (12 of 30 days).
- `v0.1.0` tag exists locally only: the git proxy in the build environment refuses tag pushes. **Human action:** create the tag on GitHub at `3c9c722`.
- Physical-device PWA install was verified by the Product Owner on an iPhone; Android has not been checked.
- No real-learner feedback incorporated yet (1.0 criterion).
- Targeted review is not yet scheduled into journey days automatically.

## Decisions needed from the Product Owner

1. Approve and merge PR #2 (Release 0.2 first increment), then PR #3 (0.3) after it is retargeted to `main`.
2. Whether production should be protected (currently public by URL, as requested for a working production link).
