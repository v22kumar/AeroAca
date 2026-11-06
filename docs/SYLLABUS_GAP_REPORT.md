# Syllabus completeness and learner-experience gap report

> Historical pre-PR-13 audit. Its counts and present-tense findings are not the current state. Use [the remaining-engineering audit](ENGINEERING_GAP_AUDIT.md), [current coverage matrix](LEARNING_COVERAGE_MATRIX.md) and [implementation plan](ENGINEERING_IMPLEMENTATION_PLAN.md). Its original E–H proposals are reused; the newer plan prioritizes practical evidence and learner validation.

Date: 2026-11-06. Scope: the ten points of the Product Owner's "Final syllabus completeness and learner experience audit". Evidence: `docs/LEARNING_COVERAGE_MATRIX.md` (topic by topic), the content on `main` at `d291bf5` (production), and a read-through of every learner-facing screen. This report states gaps and the plan; the corrections follow in separate, reviewable PRs, core learner-readiness first, optional enhancements last.

## 1. Headline

The 30-day fast track is complete and every one of its days is playable. The **full curriculum is not**: of 97 topic rows in the matrix, 46 are fully covered, 23 are partial and 28 are absent. The absences cluster exactly where the Product Owner asked for depth: electronics fundamentals (circuit laws, passives, actives, filters, grounding and protection), Embedded C foundations and practical code, STM32 programming (project set-up, GPIO and clock tree, low-power), RTOS fundamentals and deadlock, Python basics and reporting, PCB layout and EMC, debugging with SWD/GDB, and host unit testing. Three cross-cutting mechanisms an independent learner needs are missing altogether: declared prerequisites, a diagnostic to find her starting level, and runnable code with reproducible expected results.

The lessons that exist are of consistent depth (650 to 1 080 words of prose, a worked example, three graded exercises with misconception feedback, an interview question with rubric, four or five review cards, two to six references, and 19 of 37 with an interactive). The problem is breadth at the topic level, not quality of what is there.

## 2. Findings by audit point

### 2.1 Module audit against `docs/CURRICULUM.md`

Done, topic by topic, in `docs/LEARNING_COVERAGE_MATRIX.md`. Summary per module (full / partial / absent rows):

| Module | Rows | Full | Partial | Absent | Verdict |
|---|---|---|---|---|---|
| 1 Fundamentals (P0) | 10 | 2 | 5 | 3 | **Shallow.** Only power, op-amps and ADC are taught; the laws and components everything else rests on are not |
| 2 Schematics and PCB (P0) | 7 | 2 | 2 | 3 | **Shallow.** Reading and datasheets are good; layout, EMC and the tools are absent |
| 3 MCU and ARM (P0) | 10 | 4 | 4 | 2 | **Uneven.** Boot, interrupts and watchdog are strong; there is no "first STM32 project", no GPIO/clock-tree lesson, and the one placeholder in the academy |
| 4 Interfaces (P0) | 9 | 5 | 2 | 2 | **Good core; RS-485/Modbus and Ethernet missing** |
| 5 Embedded C (P0) | 11 | 5 | 3 | 3 | **Shallow at the base.** Registers, pointers and bits are strong; functions/scope, stack/heap, state machines, ring buffers and any runnable exercise are missing |
| 6 Embedded C++ (P1) | 4 | 1 | 1 | 2 | Acceptable for P1 with RAII; classes/polymorphism optional |
| 7 Firmware architecture (P1) | 5 | 3 | 1 | 1 | **Debugging with SWD/GDB absent**, which the Product Owner names as a depth area |
| 8 RTOS (P0) | 6 | 1 | 3 | 2 | **Inverted.** Priority inversion is taught before tasks, the scheduler or the tick; deadlock and timing analysis absent |
| 9 Embedded Linux (P1) | 6 | 1 | 0 | 5 | Thin by design (P1); Git is the one practical gap that matters for the portfolio |
| 10 Instrumentation (P0) | 8 | 4 | 3 | 1 | **DMM and bench supply are used in every mission but never taught** |
| 11 Integration (P0) | 7 | 4 | 2 | 1 | Requirements writing exists only as a mission; change and release management absent |
| 12 Verification (P0) | 6 | 3 | 1 | 2 | Host unit testing/regression, ATE and environmental tests absent |
| 13 Python (P1) | 6 | 2 | 1 | 3 | **Assumes Python.** Basics, reports and pytest absent |
| 14 Standards (P1) | 4 | 4 | 0 | 0 | Complete at scope level |
| 15 Applications (P2) | 2 | 1 | 0 | 1 | Domain lessons are optional by the curriculum's own priority |
| 16 Interviews (P0) | 5 | 2 | 1 | 2 | Coding questions and notice period/negotiation absent |

### 2.2 Coverage matrix

Delivered: `docs/LEARNING_COVERAGE_MATRIX.md`, eight elements per topic, with the lesson that provides each and the plan for each gap, classified core / core-light / optional.

### 2.3 "Coming soon" and unpublished items

- Exactly one planned item exists in the curriculum: *Low-power modes and wake-up sources* (module 3). It is a real gap in a P0 module, so it will be **written**, not removed.
- The journey has no planned items (all 30 days published; `tests/journey.test.ts` enforces it).
- Two learner-facing sentences overstate what is unpublished: Today says "Everything else in the 16-module curriculum is listed under Learn as coming soon" and the curriculum page says "1 are planned and shown as coming soon so you can see the shape of the whole programme". Both are corrected in this PR to state the actual situation.
- Genuinely optional future topics (not placeholders): CAN FD and LIN, the six application domains of module 15, Linux shell and driver basics, C++ classes and polymorphism, DAQ hardware. They are **not** listed as planned items in the curriculum today, so nothing reads as "coming soon"; the plan is to list them on the curriculum page under an explicit "Optional, after the core" heading so the shape of the whole programme is visible without implying missing content.

### 2.4 Depth priorities

The absent and partial rows in the priority areas, with the lesson that closes each, are in the matrix. Counted: electronics fundamentals 6 new lessons, Embedded C 4, STM32 programming 4, interfaces 2, RTOS 3, Python 3, schematics/PCB 3, debugging 2 (SWD/GDB; DMM and bench supply), verification 3. Plus module 11 (requirements, architecture, release) 3, interviews 2, Git 1. Total **36 lessons** in the core and core-light plan; optional: 4 to 10 more depending on learner demand.

### 2.5 Progressive practical exercises with runnable code

Today: 9 lessons contain C, C++, Python or DTS snippets; none can be run from the app and none has an expected output. Nothing verifies them.

Plan (core): a `labs/` directory of small host-runnable programs (C with gcc, Python 3) each with an `expected.txt`; a CI test compiles and runs every lab and diffs the output, so "reproducible expected result" is enforced, not asserted. Lessons gain a `lab` step type that shows the code, the exact command and the expected output, and links to the file. Progression: print and arithmetic → masks → fixed-width wrap → ring buffer with a known-failing test → state machine → CRC-16 → detection function for the portfolio. Browser execution is **not** available in this app without a paid or heavy dependency, so `docs/LOCAL_LAB.md` documents the verified local workflow: on any PC, gcc or clang and python3; on the STM32, the documented CubeIDE/arm-none-eabi route, marked "documented, not verified in CI" because the build environment has no target toolchain and no board.

### 2.6 Diagnostic assessment and prerequisite-based start

Today: none. Every learner starts at day 1 regardless of background; recommendations exist only after mistakes.

Plan (core): a 12-to-15-question diagnostic over the foundations (circuit laws, levels, C integers and pointers, UART/I2C basics, instruments, requirements), reusing the existing graded exercise kinds; results stored in the device-local store (schema stays version 1 with an optional field, so existing progress is untouched); a "Start here" card on Today that, from the evidence only, lists the foundation lessons to take before day 1 or confirms that day 1 is the right start. No score, no label; the reasons are the wrong answers, in line with ADR-13.

### 2.7 Advanced lessons link to foundations

Today: no lesson declares prerequisites and no screen shows them, although the schema allows it.

Plan (core): every lesson declares `prerequisites`; the lesson page shows "Before this lesson" with each prerequisite's completion state; a content test requires every lesson in modules 3 to 13 to declare at least one, and every declared prerequisite to be published and earlier in the natural order.

### 2.8 Portfolio: implementation and testing

Today: the seven stages explain the design decisions well (requirements with rationale, timing budget, ICD with golden pairs, three test layers, fault injection with method). The deliverables, however, are tick boxes with instructions, there is no starter code, no host harness, and the only thing a learner can run is the in-browser simulator of the detection rules. A learner who cannot write the detection function or a C unit test gets no help from the page.

Plan (core): `labs/portfolio/` with `detect.c`/`detect.h` (the pure function, fixed-width types, history struct), `test_detect.c` (golden pairs, every fault boundary, one deliberately failing case, a tiny assertion harness), `sensor_model.py` (10 Hz readings, fault injection, ICD-format log lines) and a Makefile; each portfolio stage gains a "Build it" section with the commands and expected output, and the tick boxes keep their meaning (the learner records that she ran it). CI runs the same labs.

### 2.9 Learner-facing wording and dead ends

Reviewed every sentence on Today, Journey, Curriculum, Lesson, Mission, Interview, Progress, Review and Portfolio. Findings:

| Screen | Issue | Severity | Action |
|---|---|---|---|
| Today | "Everything else in the 16-module curriculum is listed under Learn as coming soon" implies a large unpublished body; there is one planned lesson | Misleading | Reworded in this PR |
| Curriculum | "1 are planned and shown as coming soon so you can see the shape of the whole programme" (grammar, and the shape is not visible since optional topics are not listed) | Minor | Reworded in this PR; optional-topics list follows in the content PRs |
| Today, when the journey is finished | "You have finished everything published so far ... until the next release" ignores the 11 lessons outside the fast track and the portfolio | Dead end | Reworded to point at the curriculum's extra lessons, the portfolio and the recommendations (this PR) |
| Lesson | Completion requires every exercise solved; the recap explains this clearly. No dead end found | – | – |
| Lesson | No prerequisites shown; a learner landing on `priority-inversion` from a recommendation has no path back to the basics | Gap | Prerequisites PR |
| Mission | "You have exhausted the bench. Time to commit to a diagnosis." is clear; debrief explains missing evidence | – | – |
| Portfolio | Ticks are the only interaction; a learner can tick "Hardware done" without having hardware. The page says the app never verifies; acceptable, but the stage needs the "Build it" path (2.8) | Gap | Portfolio PR |
| Progress | Readiness statuses are in words; "evidence complete" needs every interview question rated confident, which is strict but explained | – | – |
| Review | "No cards yet ... finish one first" is correct | – | – |
| Interview | The honesty note at the foot is correct | – | – |

No misleading completion states were found: lessons complete only when all exercises are solved, missions only with a justified diagnosis, journey days only when every item is done, and the portfolio evidence table shows "not done" for anything unticked.

### 2.10 Release documentation versus `main` and production

`main` at `d291bf5` is in production (`dpl_5YtF9Jv77rmVFhrDHQkU5gX8YryN`). The record of that release is PR #11, still open, so `main` itself still says the merges await authorisation. This audit branch is stacked on #11; merging #11 then this PR reconciles the status, roadmap and checklist with what is deployed. The README's counts (37 lessons, 10 missions) are correct for production today and will be updated in each content PR.

## 3. Plan: PRs in order

Core learner-readiness first. Each PR is independently reviewable, keeps CI green, preserves learner progress (store schema stays at version 1 with optional additions only) and introduces no paid service.

| # | PR | Contents | Class |
|---|---|---|---|
| A | **Audit and wording** (this PR) | `docs/LEARNING_COVERAGE_MATRIX.md`, this report, the three wording corrections, status/roadmap entries | core |
| B | **Learner-readiness platform** | `prerequisites` on all 37 lessons with "Before this lesson" on the lesson page and a content test; the diagnostic and "Start here" on Today; the `lab` step type, `labs/` with its CI test and `docs/LOCAL_LAB.md`; portfolio "Build it" labs (detection function, tests, sensor model) | core |
| C | **Fundamentals and instrumentation depth** | Circuit laws; capacitors, inductors, RC and filters; diodes and transistors as switches; logic levels and open-drain; grounding and protection; DMM and bench supply | core |
| D | **Embedded C and STM32 programming depth** | C foundations; stack, heap and memory layout; state machines; ring buffer; first STM32 project; GPIO and clock tree; MCU families and part numbers; low-power modes (removes the placeholder) | core |
| E | **Interfaces, RTOS and Python depth** | RS-485 and Modbus RTU; Ethernet and TCP/UDP; tasks, scheduler and tick; deadlines and utilisation; deadlock and lock ordering; Python for the test bench; from a log to a report; pytest for hardware tests | core |
| F | **Schematics, debugging, verification and integration depth** | Layout basics with signal integrity; EMC basics; KiCad and simulation workflow; debugging with SWD and GDB; layers and testable seams; unit tests for firmware on the PC and regression; production test and jigs; environmental qualification; writing a requirement; block diagram and timing budget; versions and release | core |
| G | **Interviews, career and Git** | Coding questions for embedded candidates (labs); notice period and negotiation; Git for a one-person firmware project; static figures for the lessons that need a diagram | core-light |
| H | **Optional breadth** | Classes and interfaces in C++; the Linux shell; CAN FD and LIN notes; application-domain orientation lessons; DAQ section; curriculum page "Optional, after the core" list | optional |

Each content PR adds the module's interview questions and glossary terms, keeps the 30-day journey unchanged (it is the fast track; `tests/journey.test.ts` guards it), updates `docs/CONTENT_REVIEW.md` (the sync test enforces it) and updates the matrix cells it closes.

## 4. What this report does not claim

It does not claim syllabus completeness. After PRs B to G the matrix should show every core and core-light row at ✓ or a justified ◐, with the optional rows labelled as such on the curriculum page; that is the point at which the claim can be made, with the matrix as the evidence. Independent learner capability is demonstrated only when a learner completes the diagnostic, follows its start list, and finishes lessons with their labs' expected outputs reproduced; the academy records the first two and the learner records the third.
