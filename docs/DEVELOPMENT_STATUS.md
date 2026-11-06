# AeroAca development status

Progress report against `docs/PRODUCT_ROADMAP.md`. Updated at the end of every increment.

## Current state (2026-11-05)

- **Production:** Release 0.1 at https://aeroaca.vercel.app (Vercel deployment `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo`, `main` at `3c9c722`). Vercel Authentication protects previews only. Rollback via Vercel "Promote to Production" or `git revert -m 1 3c9c722`.
- **Open PRs:** #2 Release 0.2 first increment (`feat/release-0.2` → `main`): CI green, preview re-verified after review fixes (`34fcb79`), awaiting Product Owner approval. #3 Release 0.3 (`feat/release-0.3` → `feat/release-0.2`, stacked): block 3 content, preview verified (`734ee74`). #4 Release 0.4 (`feat/release-0.4` → `feat/release-0.3`, stacked): block 4 content. Each retargets to the next base as the one below merges.
- **Published content (0.4 branch):** 17 lessons, 7 missions, 24 interview questions (17 with industry notes), 140 glossary terms, 11 interactive visuals, journey days 1–20 complete.
- **Quality gates (0.4 branch):** lint 0/0, typecheck clean, 43 unit tests, 86 browser tests (Pixel 7 + desktop, incl. axe WCAG 2.0 A/AA), all routes static.

## Done

| Increment | Delivered | Evidence |
|---|---|---|
| 0.1 | App shell, content schema, 3 lessons, 2 missions, interview bank, progress store, PWA, glossary, warm design, a11y contrast fix, mission reload persistence | PR #1 merged; `docs/RELEASE_0.1_REPORT.md` |
| 0.2 | 30-day journey model and screens, 5 lessons, 2 missions, 4 visuals, targeted review, interview focus sets and industry notes, 30 glossary terms | PR #2; `docs/RELEASE_0.2_REPORT.md` |
| 0.3 | Journey days 11–15: bring-up checklist, test-case writing, root-cause analysis, ICD lessons; 2 missions; traceability matrix interactive; 4 interview questions; 22 glossary terms; light-mode status-colour contrast fix | PR #3; `docs/RELEASE_0.3_REPORT.md` |
| 0.4 | Journey days 16–20: startup code, priority inversion, ISR-to-task handoff, bootloaders and recovery, embedded Linux boot chain; RTOS mission; startup-sequence and priority-inversion interactives; 5 interview questions; 19 glossary terms | PR #4; `docs/RELEASE_0.4_REPORT.md` |

## In flight

- 0.5 (days 21–25): PyVISA and SCPI, serial automation, hardware-in-the-loop, FMEA, logic-analyser decoding. Next on a branch stacked on `feat/release-0.4`.

## Known gaps and blockers

- Journey days 21–30 reference planned lessons/missions (7 of 30 days).
- `v0.1.0` tag exists locally only: the git proxy in the build environment refuses tag pushes. **Human action:** create the tag on GitHub at `3c9c722`.
- Physical-device PWA install was verified by the Product Owner on an iPhone; Android has not been checked.
- No real-learner feedback incorporated yet (1.0 criterion).
- Targeted review is not yet scheduled into journey days automatically.

## Decisions needed from the Product Owner

1. Approve and merge PR #2 (Release 0.2 first increment), then PR #3 (0.3) and PR #4 (0.4) in order as each is retargeted to `main`.
2. Whether production should be protected (currently public by URL, as requested for a working production link).
