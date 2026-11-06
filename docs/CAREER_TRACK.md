# Career track: the 30-day journey, retargeted

Status: on branch `content/career-track`, built for the owner's review. Not merged, not deployed.

## Why this exists

The first 30-day journey was written for the earlier goal (a microcontroller-oriented interview fast track). The goal is now roles in avionics and UAV systems integration, embedded systems, electronics R&D, hardware validation, V&V under DO-178C, and test automation, at ₹12 LPA or above, built on two to four years of avionics integration and V&V experience. This document records the audit and what was done.

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

## The 30 days

Every day is 15 to 45 minutes and built only from published content.

| Days | Block | Content |
|---|---|---|
| 1 to 5 | Say what you did; DO-178C verification | Ownership and gaps, levels, requirements-based testing, MC/DC, traceability and change impact |
| 6 to 10 | Avionics buses and telemetry | 1553 (two lessons), ARINC 429, RS-422/485 with CRC, telemetry parsing |
| 11 to 15 | Redundancy and real-time | Why redundancy, voter, cross-channel tests, tasks and the tick, schedulability |
| 16 to 20 | Timing, shared memory, parsers | Frame executives, DPRAM, WCET, frame parser, deadlock |
| 21 to 25 | Benches, faults, automation | HIL, fault injection, logs to evidence, pytest, framework architecture |
| 26 to 30 | Debug, control, interviews, plan | GDB, HardFault, PID, claims and negotiation with a timed mock, review and the next 30 days |

Applications (days 5, 13, 18, 25) and two recorded rehearsals (days 10 and 20) run in parallel with the learning. Missions used: the requirement nobody could test, two boards one bus, the task that never runs, the flaky automated test, the board that resets every second.

## What is not in the 30 days, deliberately

Embedded and electronics foundations (modules 1 to 9: bring-up, reset, I2C/SPI/UART, C, interrupts, bootloaders, Linux) remain published and reachable from the curriculum; the starting-level diagnostic points to them when needed and day 30 plans them. Pathway C and the extension modules 26 to 31 remain blueprints.

## Honest limits

- Labs marked simulation are simulations: the voter, fault injector, PID and fault-decode captures use synthetic data. None is evidence of work on real hardware.
- `pytest-for-hardware-tests` has no lab because `pytest` is not installed in the CI labs job; its code is checked by reading, not by running.
- Objective counts for DO-178C are the commonly quoted figures and are labelled as such in the lesson; the standard's tables are the authority.
- Nothing here promises a job or a salary. Negotiation content is general guidance, not legal or financial advice.
- Technical review by a second reader is still an open human gate; every new lesson is marked "technically-reviewed" at the level of the author's check against public sources, not an external audit.

## Verification

Unit tests, lint, type check, production build, the labs job and the browser suite (see the PR for the run).
