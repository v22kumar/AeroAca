> **Release 1.1 in production** (`main` e88c7f0, deployment `dpl_9A4aAbUDG4e3qpihS6wpXkZP1vvA`, record in `docs/RELEASE_1.1_RECORD.md`): PRs #11 to #18 merged in order and verified on production.
>
> **Career track (branch `content/career-track`, awaiting owner review):** modules 17 to 25 are now playable for the goal of avionics and UAV systems integration, V&V, embedded, validation and test-automation roles: 24 new lessons in the arc format, 17 new CI-verified labs, 43 diagrams, 87 interview questions, and the 30-day journey retargeted to the career goal. See `docs/CAREER_TRACK.md`. Modules 26 to 31 remain blueprints.
>
> **Written learning blueprint (merged in PR #18):** career-switch guide, full curriculum map for 31 modules, topic breakdown for 20 subject families at three depths, learner guide, 30/60/90 plan, 42 teaching diagrams with a generator and index. Documentation and static assets only; modules 17 to 31 remain blueprints, not playable lessons.
>
> In progress: teaching format 2.0 pilot (ADR-16, docs/PILOT.md). The remaining-engineering audit, four-pathway specification and revised syllabus are prepared; new curriculum rollout remains gated on learner pilot evaluation and approved P0 scope. See [implementation plan](ENGINEERING_IMPLEMENTATION_PLAN.md) and [validation](ENGINEERING_VALIDATION.md).

# AeroAca development status

Progress report against `docs/PRODUCT_ROADMAP.md`. Updated at the end of every increment.

## Current state (2026-11-06)

- **Production:** Release 1.0 candidate at https://aeroaca.vercel.app (Vercel deployment `dpl_5YtF9Jv77rmVFhrDHQkU5gX8YryN`, `main` at `d291bf5`, deployed 2026-11-06 after the Product Owner authorised the merges). Verified on production: 55 routes 200, the full 130-test browser suite green on Pixel 7 and desktop. Rollback: promote `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo` (Release 0.1) or any intermediate production deployment in the Vercel dashboard; `git revert -m 1 <merge-sha>` per increment. Record: `docs/RELEASE_CANDIDATE_1.0.md`.
- **Merged:** PRs #2 to #10 merged into `main` in dependency order on 2026-11-06 (merge commits `a607e29`, `d388bbd`, `dbdec3d`, `557dd90`, `c731134`, `2fdf435`, `4d0e12c`, `65f64e7`, `d291bf5`), each followed by a green `main` CI run before the next merge. No conflicts, no fixes needed.
- **Open PRs at the engineering-audit snapshot:** #11 release record → #12 audit → #13 learner readiness → #14 fundamentals → #15 Embedded C/STM32 → #16 teaching pilot → #17 engineering audit and reconciled syllabus (documentation only). These form a dependency stack and are integrated in that order after review, each with a green CI run on the retargeted merge result before the next; source/check evidence is in [the engineering audit](ENGINEERING_GAP_AUDIT.md). Pending content is not production content.
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
- **PR B, learner-readiness platform (`feat/learner-readiness`):** prerequisites declared on all 37 lessons with "Before this lesson" on the lesson page and a content test (existence, no cycles, only the four starting points empty); the starting-level diagnostic at `/start` (14 questions, first answer counts, no score) with a "Start here" list on Today derived from the wrong answers; the `lab` step and `labs/` (8 programs, manifest, `scripts/sync-labs.mjs`, `tests/labs.test.ts` that rebuilds and reruns every lab in CI); `docs/LOCAL_LAB.md`; portfolio "Build it" with the detection function, 16 unit tests plus a known failure, host harness and sensor model. Store schema stays at version 1 (optional `diagnostic` field). ADR-15.
- **PR C, fundamentals and instrumentation depth (`feat/fundamentals-depth`):** six lessons that the matrix marked absent or shallow: circuit laws (divider/Thévenin interactive, lab), capacitors/inductors/RC/filters (RC step interactive, lab), diodes and transistors as switches, logic levels/thresholds/open-drain/pull-up sizing, grounding and protection, the multimeter and bench supply. Six interview questions with industry notes, 16 glossary terms, 6 new skill labels. Prerequisites rewired so the new lessons are the foundations (starting points are now circuit laws, the multimeter lesson and register bit masks); the diagnostic's circuit-laws, decoupling, logic-levels and multimeter questions point at them. The 30-day journey is unchanged.
- **PR D, Embedded C and STM32 programming depth (`feat/embedded-c-stm32-depth`):** eight lessons: C foundations (functions, scope, static, const, arrays, structs and padding), stack/heap/memory layout, state machines, ring buffer, choosing and reading an MCU, your first STM32 project (CubeMX to registers, debugger, printf over UART), GPIO and the clock tree (clock-tree interactive, MODER register exercise), low-power modes and wake-up sources (the last planned item, now published: **no "coming soon" item remains in the curriculum**). Five runnable C labs (functions, memory sections, debouncer state machine, ring buffer with 8 checks, STM32 clock and register arithmetic), 8 interview questions with industry notes, 14 glossary terms, 8 skill labels. STM32 target steps are documented from the vendor manuals and marked not verified in CI. Journey unchanged.

- 1.0 learner acceptance: production serves the release candidate. `docs/RELEASE_1.0_CHECKLIST.md` states every gate with evidence; two need people: second-reader signatures in `docs/CONTENT_REVIEW.md`, and Sushmita's feedback on the representative set. Sign-off and the `v1.0.0` tag wait for both. No feature development until then; only release-readiness fixes.

## Known gaps and blockers

- The cumulative #16 curriculum has no placeholder lessons, but the full engineering syllabus still has substantial missing/shallow subjects. No journey day references planned content; [the matrix](LEARNING_COVERAGE_MATRIX.md) tracks subject gaps independently of playable lesson counts.
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
