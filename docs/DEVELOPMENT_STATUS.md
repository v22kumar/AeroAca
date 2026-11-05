# AeroAca development status

Progress report against `docs/PRODUCT_ROADMAP.md`. Updated at the end of every increment.

## Current state (2026-11-05)

- **Production:** Release 0.1 at https://aeroaca.vercel.app (Vercel deployment `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo`, `main` at `3c9c722`). Vercel Authentication protects previews only. Rollback via Vercel "Promote to Production" or `git revert -m 1 3c9c722`.
- **Open PRs:** #2 Release 0.2 first increment (`feat/release-0.2` → `main`): CI green, preview re-verified after review fixes (`34fcb79`), awaiting Product Owner approval. #3 Release 0.3 (`feat/release-0.3` → `feat/release-0.2`, stacked): block 3 content, preview verified (`734ee74`). #4 Release 0.4 (`feat/release-0.4` → `feat/release-0.3`, stacked): block 4 content, preview verified (`2115f7a`). #5 Release 0.5 (`feat/release-0.5` → `feat/release-0.4`, stacked): block 5 content, preview verified (`5ac4afc`). #6 Release 0.6 (`feat/release-0.6` → `feat/release-0.5`, stacked): block 6 content; all 30 days published; preview verified (`8abfc72`). #7 Release 0.7 (`feat/release-0.7` → `feat/release-0.6`, stacked): the portfolio track; preview verified (`8ed4f7c`). #8 Release 0.8 (`feat/release-0.8` → `feat/release-0.7`, stacked): curriculum depth. #9 Release 0.9 (`feat/release-0.9` → `feat/release-0.8`, stacked): learning intelligence. Each retargets to the next base as the one below merges.
- **Published content (0.8 branch):** 37 lessons, 10 missions, 1 portfolio project (7 stages, 19 deliverables, in-browser fault-injection lab), 42 interview questions (35 with industry notes), 211 glossary terms, 19 interactive visuals, timed mock-interview mode, all 30 journey days complete, every module with published content.
- **Quality gates (0.9 branch):** lint 0/0, typecheck clean, 53 unit tests (incl. a Release 0.1 backup migration test), 130 browser tests (Pixel 7 + desktop, incl. axe WCAG 2.0 A/AA), all routes static, visuals code-split.

## Done

| Increment | Delivered | Evidence |
|---|---|---|
| 0.1 | App shell, content schema, 3 lessons, 2 missions, interview bank, progress store, PWA, glossary, warm design, a11y contrast fix, mission reload persistence | PR #1 merged; `docs/RELEASE_0.1_REPORT.md` |
| 0.2 | 30-day journey model and screens, 5 lessons, 2 missions, 4 visuals, targeted review, interview focus sets and industry notes, 30 glossary terms | PR #2; `docs/RELEASE_0.2_REPORT.md` |
| 0.3 | Journey days 11–15: bring-up checklist, test-case writing, root-cause analysis, ICD lessons; 2 missions; traceability matrix interactive; 4 interview questions; 22 glossary terms; light-mode status-colour contrast fix | PR #3; `docs/RELEASE_0.3_REPORT.md` |
| 0.4 | Journey days 16–20: startup code, priority inversion, ISR-to-task handoff, bootloaders and recovery, embedded Linux boot chain; RTOS mission; startup-sequence and priority-inversion interactives; 5 interview questions; 19 glossary terms | PR #4; `docs/RELEASE_0.4_REPORT.md` |
| 0.5 | Journey days 21–25: PyVISA and SCPI (simulated SCPI console), serial automation and test logs, SIL/HIL, FMEA (interactive worksheet); flaky-test mission; 4 interview questions; 17 glossary terms | PR #5; `docs/RELEASE_0.5_REPORT.md` |
| 0.6 | Journey days 26–30: avionics/automotive and medical/industrial standards as scope (interactive standards map), cross-industry transfer, portfolio presentation, telling a debugging story; timed mock-interview mode; 3 interview questions; 22 glossary terms; all 30 days published | PR #6; `docs/RELEASE_0.6_REPORT.md` |
| 0.7 | Portfolio track: STM32 sensor monitor in 7 stages and 19 deliverables, simulation and hardware paths recorded separately, in-browser fault-injection lab, evidence table derived from the learner's ticks; ADR-12 | PR #7; `docs/RELEASE_0.7_REPORT.md` |
| 0.8 | Curriculum depth: 11 lessons (power tree, op-amps, ADC, schematic review, datasheet triage, NVIC, CAN, pointers to hardware, RAII, driver models, logic analysers), 2 missions, 4 interactives (ADC, CAN arbitration, PWM timer, NVIC), 11 interview questions, 32 glossary terms | PR #8; `docs/RELEASE_0.8_REPORT.md` |
| 0.9 | Learning intelligence: evidence-based recommendations on Today and Progress, explained readiness by module, Release 0.1 backup migration test, on-demand visuals; ADR-13, ADR-14 | PR #9; `docs/RELEASE_0.9_REPORT.md` |

## In flight

- 1.0 gates: documented content review (a second technical reader per block), real-learner feedback incorporated, final quality gates. The remaining gates need people: a technical reviewer and a learner.

## Known gaps and blockers

- No journey day references planned content any more; the curriculum still lists planned lessons beyond the 30-day path.
- `v0.1.0` tag exists locally only: the git proxy in the build environment refuses tag pushes. **Human action:** create the tag on GitHub at `3c9c722`.
- Physical-device PWA install was verified by the Product Owner on an iPhone; Android has not been checked.
- No real-learner feedback incorporated yet (1.0 criterion).
- Targeted review is not yet scheduled into journey days automatically.

## Decisions needed from the Product Owner

1. Approve and merge PR #2 (Release 0.2 first increment), then PRs #3 to #9 (0.3 to 0.9) in order as each is retargeted to `main`.
2. Whether production should be protected (currently public by URL, as requested for a working production link).
