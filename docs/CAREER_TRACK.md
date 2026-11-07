# Career track: the 30-day journey, retargeted

Status: on branch `content/career-track` (PR #20), built for the owner's review. Not merged, not deployed.

## Why this exists

The first journey, thirty calendar days, was written for the earlier goal (a microcontroller-oriented interview fast track). The goal is now roles in avionics and UAV systems integration, embedded systems, electronics R&D, hardware validation, V&V under DO-178C, and test automation, at ₹12 LPA or above, built on two to four years of avionics integration and V&V experience. This document records the audit and what was done.

## Audit: old journey against the new goal

| Gap | What the new goal needs | Before | Now |
|---|---|---|---|
| Claims and ownership | Say what you did, truthfully | Module 16 only | Module 25: two lessons, four interview questions |
| DO-178C verification | Levels, requirements-based tests, MC/DC, traceability, change impact | Scope lesson only | Module 17: four lessons, `c-mcdc` lab, MC/DC diagram |
| Avionics buses | 1553, ARINC 429, RS-422/485, telemetry | One 1553 lesson | Module 18: five lessons, four labs |
| Redundancy | Voting, monitors, cross-channel tests | None | Module 19: three lessons, `c-voter` |
| Real-time proof | Schedulability, frames, DPRAM, WCET, deadlock | One priority-inversion lesson | Module 20: six lessons, three labs |
| Benches and faults | HIL, FMEA to fault injection | One SIL/HIL lesson | Module 21: two lessons, `py-fault-inject` |
| Test automation | Logs, pytest, framework architecture | Two lessons | Module 22: three lessons, two labs |
| On-target debug | Probe, GDB, HardFault | None | Module 23: two lessons; frame parser lesson in module 5 |
| Control basics | PID, the loop | None | Module 24: one lesson, `py-pid` |

## The journey: six stages, no calendar

The journey is organised by stage, not by day. Each stage is five sessions of 15 to 45 minutes; a session takes as many sittings as it needs, and the learner moves on when it is complete. Every stage ends with an outcome written as a claim she could defend in an interview, and names the rung of the career ladder that evidence belongs to.

| Stage | Sessions | Content | After it, she can… | Ladder rung |
|---|---|---|---|---|
| 1. Say what you did; DO-178C verification | 1 to 5 | Ownership and gaps, levels, requirements-based testing, MC/DC, traceability and change impact | Describe her own work at the right ownership level; explain what a level changes, how tests come from requirements, what MC/DC shows, what a late change makes her redo | Level 1 |
| 2. Avionics buses and telemetry | 6 to 10 | 1553 (two lessons), ARINC 429, RS-422/485 with CRC, telemetry parsing | Read a 1553 monitor log, decode a 429 word and its status, place termination and bias, parse telemetry without silent loss | Level 1 |
| 3. Redundancy and real-time analysis | 11 to 15 | Why redundancy, voter, cross-channel tests, tasks and the tick, schedulability | Draw a redundant architecture, explain the voter, design a link test matrix, decide schedulability with a calculation | Level 2 |
| 4. Timing, shared memory and parsers | 16 to 20 | Frame executives, DPRAM, WCET, frame parser, deadlock | Explain a frame overrun and a shed policy, design a tear-free handshake, say how a sub-millisecond claim is measured, find a parser bug from its code | Level 2 |
| 5. Benches, fault injection and automation | 21 to 25 | HIL, fault injection, logs to evidence, pytest, framework architecture | Describe a rig and its limits, turn an FMEA row into an injected fault, draw a test framework and measure its saving honestly | Level 2 |
| 6. Debug, control, interviews and plan | 26 to 30 | GDB, HardFault, PID, claims and negotiation with a timed mock, review and the next plan | Find the line behind a HardFault, explain PID plainly, audit every CV claim, state a metric with its method, negotiate from facts | Level 2 |

Applications (sessions 5, 13, 18, 25) and two recorded rehearsals (sessions 10 and 20) run in parallel with the learning. Missions used: the requirement nobody could test, two boards one bus, the task that never runs, the flaky automated test, the board that resets every second.

## The career ladder

`docs/CAREER_LADDER.md` and `content/career-ladder.ts` hold the four rungs (engineer; senior or lead; principal or architect; chief engineer, fellow or manager) with the role titles, the pay band public salary sites reported for India in November 2026, the evidence the market asks for before it pays at that rung, and what in the academy builds it. Every band carries the public figures behind it with publisher, sample, month and page. The learner sees it on the Journey page under "Where this leads", and the Today page names the rung the current stage builds. The data describes the market; the app never promises an outcome, and the tests fail if the wording ever does.

## What is not in the stages, deliberately

Embedded and electronics foundations (modules 1 to 9: bring-up, reset, I2C/SPI/UART, C, interrupts, bootloaders, Linux) remain published and reachable from the curriculum; the starting-level diagnostic points to them when needed and the last session plans them. Pathway C and the extension modules 26 to 31 remain blueprints.

## Honest limits

- Labs marked simulation are simulations: the voter, fault injector, PID and fault-decode captures use synthetic data. None is evidence of work on real hardware.
- `pytest-for-hardware-tests` has no lab because `pytest` is not installed in the CI labs job; its code is checked by reading, not by running.
- Objective counts for DO-178C are the commonly quoted figures and are labelled as such in the lesson; the standard's tables are the authority.
- Nothing here promises a job or a salary. Negotiation content is general guidance, not legal or financial advice.
- Technical review by a second reader is still an open human gate; every new lesson is marked "technically-reviewed" at the level of the author's check against public sources, not an external audit.

## Verification

Unit tests, lint, type check, production build, the labs job and the browser suite (see the PR for the run).
