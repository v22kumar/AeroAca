# AeroAca development status

Progress report against `docs/PRODUCT_ROADMAP.md`. Updated at the end of every increment.

## Current state (2026-11-06)

- **Production:** Release 1.0 candidate at https://aeroaca.vercel.app (Vercel deployment `dpl_5YtF9Jv77rmVFhrDHQkU5gX8YryN`, `main` at `d291bf5`, deployed 2026-11-06 after the Product Owner authorised the merges). Verified on production: 55 routes 200, the full 130-test browser suite green on Pixel 7 and desktop. Rollback: promote `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo` (Release 0.1) or any intermediate production deployment in the Vercel dashboard; `git revert -m 1 <merge-sha>` per increment. Record: `docs/RELEASE_CANDIDATE_1.0.md`.
- **Merged:** PRs #2 to #10 merged into `main` in dependency order on 2026-11-06 (merge commits `a607e29`, `d388bbd`, `dbdec3d`, `557dd90`, `c731134`, `2fdf435`, `4d0e12c`, `65f64e7`, `d291bf5`), each followed by a green `main` CI run before the next merge. No conflicts, no fixes needed.
- **Open PRs:** none from the release chain. `docs/release-1.0-record` (this record) is the only open branch.
- **Published content (production):** 37 lessons, 10 missions, 1 portfolio project (7 stages, 19 deliverables, in-browser fault-injection lab), 42 interview questions (35 with industry notes), 211 glossary terms, 19 interactive visuals, timed mock-interview mode, all 30 journey days complete, every module with published content.
- **Quality gates (production commit):** lint 0/0, typecheck clean, 56 unit tests (incl. a Release 0.1 backup migration test), 130 browser tests (Pixel 7 + desktop, incl. axe WCAG 2.0 A/AA), all routes static, visuals code-split.

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

- **Syllabus completeness audit (2026-11-06):** `docs/LEARNING_COVERAGE_MATRIX.md` audits all 16 modules topic by topic (97 rows: 46 full, 23 partial, 28 absent) and `docs/SYLLABUS_GAP_REPORT.md` states the gaps and the PR plan (A audit and wording; B learner-readiness platform: prerequisites, diagnostic, runnable labs, portfolio build-it; C to F depth in fundamentals, Embedded C and STM32, interfaces/RTOS/Python, schematics/debugging/verification; G interviews, career, Git; H optional breadth). Core learner-readiness PRs come first; optional enhancements are kept separate. No feature work outside this plan.

- 1.0 learner acceptance: production serves the release candidate. `docs/RELEASE_1.0_CHECKLIST.md` states every gate with evidence; two need people: second-reader signatures in `docs/CONTENT_REVIEW.md`, and Sushmita's feedback on the representative set. Sign-off and the `v1.0.0` tag wait for both. No feature development until then; only release-readiness fixes.

## Known gaps and blockers

- No journey day references planned content any more; the curriculum still lists planned lessons beyond the 30-day path.
- Tags: `v0.1.0` exists locally only (the git proxy in the build environment refuses tag pushes). **Human action:** create `v0.1.0` on GitHub at `3c9c722`; create `v1.0.0` at the signed-off commit after learner acceptance.
- Physical-device PWA install was verified by the Product Owner on an iPhone; Android has not been checked.
- No real-learner feedback incorporated yet (1.0 criterion).
- Targeted review is not yet scheduled into journey days automatically.

## Decisions needed from the Product Owner

1. Merge the release record PR (`docs/release-1.0-record`) so `main` carries the deployment evidence.
2. Whether `main` should get branch protection (require the `CI` status check and a pull request). It currently has none; the gate today is the green CI run per PR plus the documented procedure.
3. Whether production should be protected (currently public by URL, as requested for a working production link).
4. Name the independent technical reader for `docs/CONTENT_REVIEW.md` and schedule Sushmita's learner feedback on production; 1.0 sign-off and the `v1.0.0` tag stay open until both are done.
5. Create the `v0.1.0` tag at `3c9c722` on GitHub.
