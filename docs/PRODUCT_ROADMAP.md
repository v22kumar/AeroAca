# AeroAca product roadmap

Authoritative plan toward AeroAca 1.0. Updated at the end of every increment; see `docs/DEVELOPMENT_STATUS.md` for what is done and what is in flight.

## 1.0 definition of done (from the Product Owner mandate)

- All 16 curriculum modules have substantive published content (objectives, scenario lessons, interactive exercises, worked examples, misconceptions, troubleshooting, assessment with answer-specific feedback, interview questions with rubrics, references, industry applications).
- All 30 journey days are completable with no placeholder days.
- Major topics have meaningful exercises; the interactive laboratory is functional.
- The STM32 sensor-monitoring portfolio track is usable (simulation-only path plus optional hardware exercises, verified vs simulated results clearly separated).
- Assessment and revision work from actual learner evidence; no fabricated mastery or readiness percentages.
- Interview preparation is integrated into the journey.
- Technical content has passed documented review.
- Learner data survives upgrades (schema-versioned, migration-safe store).
- Works on supported mobile and desktop browsers; accessibility, security, performance and automated gates pass.
- Production deployment and rollback documented and verified.
- At least one real learner has completed representative lessons and missions and feedback is incorporated.

## Release plan

| Release | Scope | Status |
|---|---|---|
| 0.1 | Vertical slice: 3 lessons, 2 missions, interview bank, device-local progress, PWA, glossary | **In production** (`v0.1.0`, `3c9c722`) |
| 0.2 | 30-day journey (days 1–10 complete), 5 lessons, 2 missions, 4 visuals, targeted review, industry notes | PR #2, awaiting approval |
| 0.3 | Journey days 11–15: bring-up checklist, test-case writing, root-cause analysis, interface control; 2 missions; requirements-to-test traceability interactive | In PR (#3) |
| 0.4 | Days 16–20: startup code to main(), RTOS scheduling and priority inversion, ISR-to-task handoff, bootloaders and recovery, embedded Linux boot chain; RTOS scheduling interactive; 2 missions |  In PR (#4) |
| 0.5 | Days 21–25: PyVISA/SCPI, serial automation and test logs, SIL/HIL, FMEA, block review; Python code-reading exercises; 1–2 missions | Planned |
| 0.6 | Days 26–30: standards (DO-178C/DO-254, ISO 26262, IEC 62304/60601/61508) as scope not slogans; portfolio presentation; mock-interview tooling | Planned |
| 0.7 | Portfolio track: STM32 sensor monitoring and fault detection, requirements → architecture → interfaces → firmware → tests → fault injection → report | Planned |
| 0.8 | Remaining curriculum depth: electronics fundamentals (circuit laws, op-amps, ADC), schematics/PCB, CAN frame interpretation, ADC/PWM/interrupt exercises, Embedded C++ | Planned |
| 0.9 | Learning intelligence: prerequisite recommendations, targeted retries scheduled into days, explained readiness view; progress migrations; performance pass | Planned |
| 1.0 | Documented content review, real-learner feedback incorporated, final gates | Planned |

## Module coverage targets

| # | Module | Lessons target | Missions target | Status |
|---|---|---|---|---|
| 1 | Electronic engineering fundamentals | 3 | 1 | planned (0.8) |
| 2 | Circuit design, schematics and PCB | 2 | 1 | planned (0.8) |
| 3 | Microcontrollers, processors and ARM | 4 | 2 | 2 lessons, 2 missions published |
| 4 | Communication interfaces | 4 | 3 | 3 lessons, 2 missions published; CAN planned |
| 5 | Embedded C | 3 | 1 | 2 lessons published |
| 6 | Embedded C++ | 2 | 0 | planned (0.8) |
| 7 | Firmware architecture and drivers | 2 | 1 | 2 lessons published (0.4) |
| 8 | RTOS and real-time systems | 2 | 1 | 2 lessons, 1 mission published (0.4) |
| 9 | Embedded Linux | 1 | 0 | 1 lesson published (0.4) |
| 10 | Instrumentation and fault diagnosis | 2 | 1 | 1 lesson published |
| 11 | System integration and product engineering | 2 | 1 | 2 lessons, 1 mission published (0.3) |
| 12 | Verification, reliability and qualification | 3 | 1 | 1 lesson, 1 mission published (0.3); FMEA planned (0.5) |
| 13 | Python and test automation | 2 | 1 | planned (0.5) |
| 14 | Safety and standards awareness | 2 | 0 | planned (0.6) |
| 15 | Applications across industries | 1 | 0 | planned (0.6) |
| 16 | Engineering communication and interviews | 2 | 0 | planned (0.6); interview bank live |

Targets are minimums for substantive coverage, not quotas; a module is done when a learner can meet the success criteria for its topics, not when the count is reached.

## Principles that do not change

- Problem first, then theory; simulations always labelled; references on every lesson.
- One next action; no streaks, badges or fake percentages.
- Device-local progress until a real need for sync is demonstrated; no paid AI services without approval.
- Content is typed data validated in CI; adding content never requires UI changes.
- Every increment ships behind a PR with lint, typecheck, unit, browser and accessibility checks, and a verified preview.
