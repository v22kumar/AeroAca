# Study plan: 30 / 60 / 90 days

A plan for an engineer in work, on about ten hours a week on the phone plus two laptop or bench sessions of about an hour. Every block says what to study, practise, revise, build and apply for. Dates slide; the order does not. Module numbers refer to the [full curriculum map](FULL_CURRICULUM_MAP.md). Where a module is still a blueprint (17 to 31 except the published 1553 lesson), the "study" entry names the written topic breakdown and the labs that already exist; the lesson follows when it is published.

The 30-day journey inside the app (`/journey`) stays as it is: it is the foundations fast track. This plan is the career plan around it. Applications start on day one.

## Days 1 to 30: interview readiness

**Goal.** Every claim on your profile is defensible for three minutes without notes; one component built, broken and tested; applications out.

| Week | Study | Practise | Revise | Build | Apply for |
|---|---|---|---|---|---|
| 1 | Module 25 topics: career gap or contract role, "what did you own", auditing your own claims, metrics claims. Module 17 topics 17.1 to 17.3: levels, HLR/LLR, requirements-based tests | Speak each claim aloud for three minutes; write the three debugging stories (evidence, decision, outcome) | Module 16's two lessons; diagnostic at `/start` | Nothing yet; set up the laptop: gcc, make, python3, git (see `LOCAL_LAB.md`) | Avionics/UAV integration, hardware validation, V&V roles |
| 2 | Module 18: the published 1553 lesson at Apply depth; ARINC 429 and RS-422/485 topics from the breakdown; the CRC-16 and 1553 word labs | Decode three words by hand; run `c-1553-word`; predict before running | Module 4 UART and CAN lessons at Understand | P0-1a frame parser: read the spec, build the clean version, run the tests | Same, plus embedded roles that welcome a test background |
| 3 | Module 19 topics: redundancy, voting, cross-channel links; module 20 topics 20.1 and 20.2 (scheduler, response time) with the scheduler lab | Compute two response times by hand; draw a triplex with a voter | Module 8's two lessons at Master depth | Frame parser: find the shown fault with GDB, fix it, keep the before/after logs | Same |
| 4 | Module 22 topics 22.1 and 22.4: `struct`, `pytest`; module 23 topics 23.1 to 23.3: probe, GDB, HardFault | Parse a binary record in Python; write two `pytest` tests for the parser | Module 5 state-machine and ring-buffer lessons | Frame parser: find the unseen fault, write the missing test; publish the repository with a README that says what it proves | Same; first panel interviews |

**Exit check.** Three-minute answers for: DO-178C levels and coverage; a 1553 word and why a terminal stays silent; voting and failover; worst-case response time with blocking; the parser story from build to fault to test.

## Days 31 to 60: capability

**Goal.** Public evidence for the claims that matter most: a redundant link verified the DO-178C way, stages 2 to 4; debugging on target; automation that reports.

| Week | Study | Practise | Revise | Build | Apply for |
|---|---|---|---|---|---|
| 5 | Module 17 topics 17.4 to 17.7: traceability and problem reports, coverage with gcov, change impact, dead code | A hand MC/DC table for a three-condition decision | Module 12's three lessons | Portfolio track 2, stage 2: framed link with CRC, unit tests | Roles naming DO-178C practice |
| 6 | Module 19 topic 19.3 to 19.4 with the voter lab; module 21 topics 21.1 to 21.3: HIL architecture, bench design, FMEA to faults | Design the fault matrix for the link; predict detection times | Module 11 ICD lesson | Stage 3: three-channel voter with stuck, late and corrupt channels; detection log | Same, plus systems integration roles |
| 7 | Module 20 topics 20.3 to 20.4: frame-based executives, shared memory and DPRAM handshakes | Draw the major/minor frame for the link; write the handshake sequence | Module 7 startup lesson | Stage 4: requirements-based tests, gcov report, traceability matrix, one problem report with change impact | Same |
| 8 | Module 23 topics 23.1 to 23.3 in depth; module 22 topics 22.2 to 22.3: serial, logs to evidence | A HardFault analysed from fault registers to a line (board if available, host lab otherwise) | Module 10 scope and analyser lessons | `pytest` suite over stages 2 to 4 with a report; GDB transcript retained | Same; second-round panels |

**Exit check.** Stages 1 to 4 public with READMEs; the coverage report, the traceability matrix and the voter log open in a browser; you can explain the architecture of your automation suite on a whiteboard.

## Days 61 to 90: depth and interviews at Tier 2

**Goal.** The remaining portfolio stages, the systems-level vocabulary, and weekly timed panels until nothing hollow remains.

| Week | Study | Practise | Revise | Build | Apply for |
|---|---|---|---|---|---|
| 9 | Module 21 topics 21.4 to 21.5: protocol fault injection, power and environment faults; module 17 topic 17.8: B to C, supplements, SOI audits | Inject faults with the Python injector; argue what each detection proves | Module 12 FMEA lesson | Stage 5: fault-injection campaign with results table | Senior-leaning integration and V&V roles |
| 10 | Module 24: control loop, PID, the flight computer from outside; module 23 topics 23.4 to 23.5: ARM9 vs Cortex-M, driver against a register spec | Discrete PID step response; a register-map test against a mock | Module 3 clock-tree lesson | Stage 6: automation suite with fixtures, markers, HTML/CSV report and an architecture diagram | Same |
| 11 | Module 20 topic 20.5: WCET and jitter on target; module 14 one-pagers (DO-254, MIL-STD-461, MIL-STD-810, AS9100) | Measure one task's execution time with a GPIO and a scope (board) or state the plan | Module 9 Linux boot lesson | Stage 7: timing analysis, margin table, bench design for two boards over RS-422 | Same |
| 12 | Module 25 topics 25.4 to 25.5: metrics claims, notice, negotiation | Two timed mock panels per week from modules 17 to 24; one includes "draw your framework", one "do MC/DC for this decision" | Everything in the spaced-review queue | Evidence repository linked from your profile; one write-up per stage | Offers compared with the negotiation lesson's method |

**Exit check.** Seven portfolio stages public; three mock panels passed at Tier 2 depth without a hollow answer; a one-page summary of what each piece of evidence proves and what it does not.

## After day 90: the long-term direction

Pathway A and B deepen through the P1 batches as they publish (control and estimation, 26 and 27; Linux and C++, 6 and 9). Pathway C (28 to 30) is optional and comes after the core. Pathway D (31) grows through reviewed decisions on the portfolio product: requirements from a brief, decision records, BOM and cost, risk register, roadmap, a design review you run. None of it is required to apply; all of it is how the next role after this one is earned.

## What this plan is not

It is not a promise of an offer by day 90, not a prerequisite for applying, and not a measure of you. If a week slips, keep the order and move the dates.
