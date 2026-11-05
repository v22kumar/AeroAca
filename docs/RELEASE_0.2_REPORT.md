# Release 0.2 report (first increment)

Branch `feat/release-0.2`, built on the production Release 0.1 (`main` at `3c9c722`, tag `v0.1.0`).

## What was implemented

**30-day guided journey** (`content/journey.ts`, `lib/progress/journey.ts`, Today and `/journey`)
- 30 days in the six fast-track blocks, each a 15 to 45 minute session (enforced by a test). Days 1–10 are fully specified from published content; days 11–30 follow the curriculum plan and reference planned lessons, which are shown as *coming soon* and can never be marked done.
- Items per day: lessons, missions, interview rehearsal (opens the Interview page focused on that day's questions), spaced review, and career actions the learner ticks herself (send one application, record a mock answer, write the bring-up card).
- Today now shows "Day N of 30", the day's checklist with real statuses, the one next step, and the session length. Position in the journey is derived from progress facts, never stored, so restoring a backup or completing content out of order cannot desynchronise it. Progress counts completed days only.

**New content** (all technically reviewed against the cited documents; simulations labelled)
- Lessons: *Watchdogs and reset loops* (IWDG/WWDG, timeout arithmetic with LSI tolerance, refresh placement, RCC_CSR), *UART framing and baud tolerance* (frame anatomy, baud error budget, STM32 USARTDIV, reading garbage as a clue), *SPI modes, chip select and the first byte of garbage* (CPOL/CPHA from datasheet wording, CS framing, prescaler choice), *Fixed-width integers, overflow and shifts* (wrap-around, promotion, undefined shifts, wrap-safe elapsed time), *Oscilloscope probing without lying to yourself* (probe loading, compensation, ground-lead ringing, bandwidth, aliasing).
- Missions: *The board that resets every second* (watchdog fired by a new blocking call; register evidence, firmware diff, fix judgement) and *The UART that prints garbage* (clock configuration inherited from the wrong board; the hardware-rework trap).
- Interactive visuals: UART frame with receiver-rate error and sample points; SPI polarity/phase diagram with a device-expectation mismatch readout; IWDG timeout calculator with LSI range; sampling/aliasing simulation.
- Interview bank: 15 questions (5 new) with structured rubrics; 8 carry cross-industry notes for avionics, automotive, medical, industrial and consumer work.
- Glossary: 99 terms (30 new) covering UART, SPI, clocks, watchdogs, integers and instrumentation.

**Adaptive revision**: the Review page now lists every exercise answered wrongly or left unsolved, grouped by skill with the real wrong-attempt count, each linking straight back to that lesson step (`?step=N`). No mastery percentages anywhere.

**Content review of 0.1 lessons**: re-read against RM0090, UM10204 and the TMP102 datasheet; no corrections were needed beyond those already made in 0.1 (the write-1-to-clear exercise was generalised away from STM32 timers, which use rc_w0). All simulated readings remain labelled.

## Coverage of the Release 0.2 requirements

| Requirement | This increment | Remaining |
|---|---|---|
| 30-day guided journey | All 30 days defined; days 1–10 complete with real content; derived progression; Today and Journey screens | Lessons for days 11–30 |
| Learning progression | Fundamentals first within each block (bring-up → reset → probing → I2C → UART → SPI → C) ; every lesson builds from first principles with a "go deeper" layer | More cross-links between lessons |
| New engineering content | UART, SPI, watchdog/reset, STM32 peripherals (IWDG, USART, SPI, RCC), embedded C, instrumentation | System integration, verification, Python automation (planned days 11–25) |
| Interactive engineering | 4 new interactive visuals, 15 new exercises incl. numeric misconception feedback, 2 branching missions | Circuit-diagram interactives for the fundamentals module |
| Adaptive revision | Targeted review from real mistakes, deep links to retry | Scheduling targeted retries into journey days automatically |
| Interview preparation | 15 scenario questions, rubrics, probes, industry notes, journey-driven focus sets | Mock-interview timer |
| Content quality | References per lesson, simulations labelled, 0.1 lessons re-reviewed | Second human technical review |
| Learner experience | Same calm mobile-first UI; one extra page (`/journey`); no new navigation items | — |

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` (Vitest) | 7 files, 43 tests passed (content validity for 8 lessons and 4 missions, journey validity and progression, targeted review, grading, mission engine, store, glossary matcher, profile) |
| `npm run build` | 22 routes, all prerendered static |
| `npm run test:e2e` (Playwright, Pixel 7 + Desktop Chrome) | 66 passed (33 scenarios × 2), including: journey checklist and career-action persistence, journey page, interview focus sets and industry notes, wrong answer → targeted review → retry via deep link → solved, watchdog and SPI numeric misconception feedback, IWDG calculator, SPI mismatch readout, aliasing readout, both new missions, plus the full 0.1 suite and axe WCAG 2.0 A/AA scans |

Two content defects were caught by the new tests and fixed before the PR: a watchdog exercise whose tolerance accepted the "forgot the +1" misconception as correct, and a journey rule that let days consisting only of a review auto-complete on a fresh profile.

## Known gaps

- Days 11–30 reference 20 planned lessons and missions; those days can be worked through (review, interview, career actions) but never count as complete until the content ships.
- Targeted review surfaces mistakes; it does not yet schedule them into a journey day automatically.
- The interview "focus set" is driven by the journey; there is no timer or recording helper for mock interviews (the career action asks the learner to use her phone).
- The `v0.1.0` tag exists locally but the git proxy in the build environment refused to push tags; it should be created on GitHub (Releases → new tag at `3c9c722`).
