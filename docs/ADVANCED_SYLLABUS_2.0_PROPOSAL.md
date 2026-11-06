# AeroAca 2.0 advanced syllabus: the original proposal (modules 17 to 25)

**Provenance.** Proposed on 2026-11-06 as the review package for the 2.0 retargeting and approved in principle by the Product Owner the same day. It was reviewed outside the repository, which is why the engineering audit in `ENGINEERING_GAP_AUDIT.md` could not find it. It is checked in here **unchanged in substance** (a private section about one learner's background is omitted, and three phrases were made generic) so that its module identifiers and lesson plans are preserved. `ADVANCED_MODULE_CROSSWALK.md` reconciles it with the later four-pathway structure and the 114-subject matrix; `ENGINEERING_IMPLEMENTATION_PLAN.md` governs sequencing. Where this file and the implementation plan differ on *order*, the plan wins; where they differ on *module identity and scope*, the crosswalk records the decision.

**Status words.** Everything below is a proposal of scope. No module here is a published capability; the learner-pilot gate in `PILOT.md` precedes any rollout. AeroAca does not guarantee a job, an offer or a salary.

## B. Career pathway (public-safe)

**Learner profile AeroAca 2.0 is built for:** an embedded or avionics engineer with two to four years in integration, testing and validation of safety-critical electronics, moving to roles in avionics verification and validation, flight-control integration, embedded systems validation, hardware-in-the-loop test and embedded test automation.

**Target role families and what they test**

| Role family | Tested in interviews | AeroAca 2.0 modules |
|---|---|---|
| Avionics software V&V (DO-178C) | Objectives and levels, requirements-based testing, structural coverage and MC/DC, traceability, problem reports, audits; a bus or two; a debugging story | 17, 18, 25, foundations 12 and 16 |
| Flight-control and UAV integration | Redundancy and failover, data links, timing, HIL, bring-up, CAN and serial, a bring-up story | 19, 20, 21, 18, 24, foundations 3, 4, 10, 11 |
| Embedded systems validation and HIL | Bench design, fault injection, FMEA to tests, Python automation, instruments, reporting | 21, 22, foundations 10, 12, 13 |
| Embedded test automation | `pytest`, binary protocol parsing, serial and instrument control, reports, framework architecture | 22, 18.5, foundations 13 |
| Firmware engineering (secondary) | Embedded C depth, RTOS, drivers, debugging on target, timing | 20, 23, foundations 5, 7, 8 |

**Pathway logic.** The first family pays for demonstrated verification practice; the second for demonstrated systems understanding. Both are served by one portfolio (section D) whose stages produce evidence a panel can inspect. Foundations stay available for the gaps a diagnostic finds and for learners entering from other industries.

**Honesty rules carried over from 1.0:** training is not employment history; simulations are labelled; nothing in the app claims certification, a job or a salary.

---

## C. Revised syllabus

### C.1 Structure

- **Tier F: Foundations and cross-industry (modules 1 to 16).** Kept whole. Shown as "Foundations: refresh or fill gaps". The diagnostic routes into them; the advanced track links back to them as prerequisites. Open PRs #13 and #14 and the STM32 branch land here as refresh content.
- **Tier A: Advanced avionics and verification track (modules 17 to 25, new).** Core for the target roles. Every lesson follows the 1.0 lesson standard (scenario, concept with references, worked example, exercises with misconception feedback, interview question with rubric, recap cards) **plus** the two additions below that make it problem-solving rather than definitions.

### C.2 Two pedagogical additions (platform work, batch 1)

1. **Artefact exercises.** The learner is given a synthetic artefact (a bus trace, a 1553 word dump, a coverage report, a requirement set, a timing log, a fault register dump) and must find the defect, compute the answer or write the missing test. Implemented with the existing exercise kinds (numeric, multi, order, register) on top of a new `artefact` step that renders the artefact as a code block or table. No new grading logic.
2. **Design briefs.** An open-ended task ("design the fault-injection matrix for this link", "write the test cases for this requirement", "draw this bench") with a hidden model answer and a self-check rubric of five to seven criteria, recorded as evidence the way interview ratings are (ADR-13: evidence, not scores). Implemented as a new `brief` step type with the rubric stored in content; completion requires the self-check, which is honest about being a self-check.

Every Tier A lesson has at least one artefact exercise or one design brief. Labs stay CI-verified where the toolchain allows (gcc, Python); labs needing hardware are labelled "needs a board" with a local workflow.

### C.3 Tier A modules and lessons

Durations are reading-and-exercise minutes on a phone; labs add 15 to 40 minutes at a laptop.

**Module 17: Verification the DO-178C way (P0)**
- 17.1 What DO-178C asks for: objectives, levels A to E, and what changes per level. *Artefact:* a table of objectives; mark which apply at Level C.
- 17.2 High-level and low-level requirements, derived requirements, and the feedback to safety assessment. *Brief:* split a synthetic requirement into testable LLRs.
- 17.3 Requirements-based testing: normal range, robustness, equivalence classes, boundaries. *Brief:* write the test set for a synthetic "mode switch" requirement.
- 17.4 Traceability both ways and the problem-report lifecycle. *Artefact:* a trace matrix with a gap, an orphan and a bad link (extends the 1.0 interactive).
- 17.5 Structural coverage in practice: statement, decision, MC/DC, with a host-build coverage run. *Lab `c-coverage`:* gcc/gcov on a 60-line module with tests; expected report reproduced in CI. *Artefact:* MC/DC truth table for a three-condition decision.
- 17.6 Change impact analysis and re-verification: what a one-line fix really costs. *Brief:* CIA for a synthetic defect fix.
- 17.7 Dead code, deactivated code and unreachable branches: the analysis a reviewer expects. *Artefact:* a coverage report with an uncovered branch; decide which it is.
- 17.8 DO-178B to DO-178C: supplements (DO-330, 331, 332, 333), parameter data items, tool qualification; SOI audits 1 to 4 and what is asked at each.
- 17.9 One page each: DO-254, MIL-STD-461, MIL-STD-810, AS9100. Scope and vocabulary; what "supported" versus "performed" means when describing past work.
- Mission 17.M: "The coverage gap before the audit": find why 100 % traceability still leaves an objective unmet.

**Module 18: Avionics data buses and telemetry (P0)**
- 18.1 MIL-STD-1553B: the word (sync, 16 bits, odd parity), command/status/data words, Manchester II. *Lab `c-1553-word`:* encode and decode words, verify parity; expected output in CI. *Artefact:* decode a dump of five words.
- 18.2 MIL-STD-1553B: bus controller, remote terminals, monitor; message formats, response time, intermessage gap, bus A/B, coupling; what a bus analyser shows. *Lab `py-1553-decode`:* parse a synthetic monitor log into messages and flag a late response.
- 18.3 ARINC 429: 32-bit word, label, SDI, data (BNR, BCD, discrete), SSM, parity, 12.5 and 100 kbit/s, one talker up to twenty listeners. *Lab `py-a429`:* encode a BNR altitude word and decode a capture.
- 18.4 RS-232, RS-422, RS-485: single-ended vs differential, topology, termination, failsafe bias, and framed serial with CRC-16. *Lab `c-crc16`* (drafted, verified). *Artefact:* a scope sketch of a mis-terminated line.
- 18.5 Designing and parsing a telemetry packet: header, length, sequence, timestamp, payload, CRC; endianness; `struct`. *Lab `py-telemetry-parse`:* parse a binary log, detect a sequence gap and a bad CRC.
- 18.6 Ethernet, TCP and UDP for embedded telemetry: when each is right, payload budgets, capture with a sniffer. *Lab `py-udp-echo`* (drafted, verified).
- 18.7 Modbus RTU over RS-485 as the industrial cousin (drafted; keeps cross-industry transfer).
- Mission 18.M: "The remote terminal that answers late": isolate a 1553 timing fault from a synthetic monitor log.

**Module 19: Redundant flight-control architectures (P0)**
- 19.1 Why redundancy: failure rates, fail-operational vs fail-passive vs fail-safe, dissimilarity, common-mode faults.
- 19.2 Channel architectures: duplex, triplex, quad; command/monitor pairs; what each tolerates. *Artefact:* given a fault, decide what a triplex does.
- 19.3 Cross-channel data exchange and voting: mid-value select, averaging, miscompare thresholds, persistence counters, channel isolation. *Lab `c-voter`:* three-channel voter with injected stuck, late and corrupted channels; detection and isolation times printed and verified.
- 19.4 Testing a cross-channel link: integrity, latency, dropout, failover; the test matrix and its pass criteria. *Brief:* write the CCDL-style test plan for the voter lab.
- 19.5 Synchronisation and frame alignment between channels; what happens at start-up and after a reset.
- Mission 19.M: "Channel B disagrees": evidence-backed isolation of a redundant-channel fault.

**Module 20: Deterministic timing and real-time analysis (P0)** (absorbs the 1.0 RTOS module as prerequisites)
- 20.1 Tasks, the scheduler and the tick (drafted; lab `c-sched` verified).
- 20.2 Will it meet its deadline? Utilisation and response-time analysis (drafted; exercise answer corrected to 14 ms).
- 20.3 Frame-based executives: the avionics norm. Major and minor frames, rate groups, overrun handling, why many flight computers do not use a preemptive RTOS. *Lab `c-frame-exec`:* a minor-frame executive with an injected overrun and its detection.
- 20.4 Shared memory and dual-port RAM handshakes: flags, semaphores, mailboxes, producer-consumer, measuring latency. *Lab `c-dpram-handshake`:* a two-thread model with a timestamped handshake and a race when the flag order is wrong.
- 20.5 Measuring WCET and jitter on target: GPIO and scope, cycle counters, trace; building the margin table a reviewer wants. "Needs a board" with a local workflow.
- 20.6 Deadlock and lock ordering; and one page on Xenomai, PREEMPT_RT and bare RTOS latency classes.
- Mission 20.M: "The 10 ms frame that overran once an hour."

**Module 21: HIL, test benches and fault injection (P0)**
- 21.1 HIL architecture: plant model, I/O, real-time target, fault insertion unit, what is real and what is simulated; SIL, PIL, HIL compared (extends 1.0).
- 21.2 Designing a bench for an LRU: interfaces from the ICD, instruments, electronic load, power sequencing, safety interlocks. *Brief:* bench for a synthetic actuator controller.
- 21.3 From FMEA to fault-injection tests: failure modes to injected faults to expected detections. *Brief:* fault matrix for the telemetry link.
- 21.4 Protocol fault injection in practice: CRC errors, late and missing frames, stuck-at, babbling node, out-of-range values. *Lab `py-fault-inject`:* inject faults into the simulated link and assert detection.
- 21.5 Power and environment faults: brown-out, rail sequencing, temperature margin; MIL-STD-810 and 461 as the context, not the content.
- Mission 21.M: "The fault the bench never injected."

**Module 22: Python test automation, advanced (P0)** (replaces the P1 tier of 1.0 module 13)
- 22.1 Binary data in Python: `struct`, endianness, bit fields, checksums. *Lab `py-struct-frames`.*
- 22.2 Serial and instruments: `pyserial` framing and timeouts, SCPI review, retries without `sleep`-driven flakiness (links to the 1.0 flaky-test mission).
- 22.3 Logs to evidence: regex parsing, pandas-free CSV, a report that a reviewer can read. *Lab `py-log-report`.*
- 22.4 `pytest` for hardware tests: fixtures for ports and devices, parametrisation, markers for "needs hardware", the HTML/CSV report. *Lab `py-pytest-suite`* over the module 18 codecs.
- 22.5 The architecture of a test framework: layers (device drivers, protocol, test cases, reporting), configuration, how to describe one in an interview and how to measure the time it saves honestly. *Brief:* draw and describe the architecture of the labs you built.
- 22.6 Reproducible test runs: seeds, versions, environments, what to commit.

**Module 23: Production debugging on target (P1)**
- 23.1 What the probe does: SWD and JTAG, the debug access port, ST-Link vs J-Link, flashing vs debugging.
- 23.2 GDB on target: breakpoints vs watchpoints, stepping through an ISR, stack unwinding, reading peripherals.
- 23.3 HardFault analysis: CFSR, HFSR, the stacked PC, imprecise faults, from registers to the line. *Lab `c-fault-decode`:* decode synthetic fault registers; "needs a board" extension with a real fault.
- 23.4 ARM9 vs Cortex-M for the verification engineer: VIC vs NVIC, MMU and caches, why a legacy platform behaves differently.
- 23.5 Verifying a driver against a register specification and an FPGA: memory-mapped registers, wait states, interrupt lines, an ICD for the register map, a test against a mock. *Lab `c-regmap-test`.*
- Mission 23.M: "HardFault after the firmware update."

**Module 24: Flight-control systems orientation (P1)**
- 24.1 The control loop on an aircraft or UAV: sensors (IMU, air data, GNSS), estimation, control laws, actuators, modes.
- 24.2 PID without mystery: what each term fixes and breaks, discrete PID in C, tuning vocabulary. *Lab `py-pid-step`.*
- 24.3 What the flight-control computer's software looks like from the outside: rate groups, monitors, built-in test, data recording; how a verification engineer reads it.

**Module 25: Interviews for experienced engineers (P0)**
- 25.1 Explaining a career gap or a contract role truthfully and briefly.
- 25.2 "What did you own?": answering as a verification or integration engineer without inflating or shrinking.
- 25.3 Auditing your own claims: the explain/demonstrate/substantiate test, applied to a synthetic CV. *Brief:* audit three synthetic bullets.
- 25.4 Metrics claims: how to state a percentage you measured, estimated or inherited.
- 25.5 Notice period, CTC and negotiation (planned in 1.0; written here).
- Timed mock panel: Tier-2 question sets drawn from modules 17 to 24.

### C.4 Foundations: changes only
- Module 13 (Python) keeps its two lessons as the entry to module 22.
- Module 12 keeps its three lessons as prerequisites to module 17.
- Module 8 keeps its two lessons as prerequisites to module 20.
- Module 4 gains nothing; buses move to module 18.
- Module 1 gains one lesson: signal conditioning (instrumentation amplifier, scaling, anti-alias) since it is a daily topic for the profile.
- Everything in open PRs #13, #14 and the STM32 branch lands as written, labelled refresh.

### C.5 Learner experience changes
- Curriculum page: two tiers with a one-line explanation; the non-guarantee line.
- Diagnostic: an "experienced" entry that samples modules 17 to 22 and routes to them; the beginner entry stays.
- Journey: a second 30-day fast track over Tier A (the 1.0 journey stays as the foundations track); the Today page lets the learner choose or switch, progress preserved.
- Readiness and recommendations: computed per tier.
- Copy: "why this matters for your next role" rewritten for V&V and integration roles throughout Tier A.
- Progress store: version stays 1; new optional fields only (`track`, brief self-checks), so every backup imports unchanged.

---

## D. Portfolio track 2: "A redundant telemetry link, verified the DO-178C way"

Public, synthetic, labelled as training. Each stage has written, simulation and (where possible) hardware paths, ticked separately as in 1.0, with Build-it labs whose outputs CI reproduces.

| Stage | Deliverable | Evidence it produces | Maps to matrix rows |
|---|---|---|---|
| 1. Requirements and ICD | 12 to 15 numbered requirements for a two-channel telemetry link (frame format, rates, CRC, timeouts, failover), an ICD page, a hazard list | Requirements file, ICD | 2, 8 |
| 2. Framed serial link with CRC | C encoder/decoder for the frame (header, sequence, timestamp, payload, CRC-16), unit tests | `c-link` lab output | 6, 7 |
| 3. Three-channel voter | Mid-value select, miscompare monitor, isolation after N frames; fault injection (stuck, late, corrupt) | `c-voter` output with detection times | 8 |
| 4. Requirements-based tests, coverage, traceability | Tests per requirement, gcov statement and branch report, one MC/DC table, a traceability matrix, one problem report with CIA | `c-coverage` report, matrix | 1, 2, 3 |
| 5. Fault-injection campaign | FMEA for the link, fault matrix, Python injector, results table | `py-fault-inject` report | 11, 12 |
| 6. Automation suite | `pytest` suite over stages 2 to 5 with fixtures, markers, HTML/CSV report, architecture diagram and README | `py-pytest-suite` report | 13 |
| 7. Timing analysis and bench | Frame budget, response-time calculation, WCET measurement plan; bench design for the link on real hardware (two boards, RS-422 transceivers) with the "needs a board" path | Margin table, bench drawing | 9, 10, 11, 14 |

The 1.0 sensor-monitor track stays as the foundations portfolio.

---

## F. Implementation batches (each passes schema, consistency, unit, labs and the relevant browser and accessibility checks before merge)

| Batch | Content | Platform | Checks before merge |
|---|---|---|---|
| 0. Land the foundation PRs | #13 readiness platform, #14 fundamentals, STM32 branch (push, PR) relabelled "refresh" | none | Full CI on each (already green except the sheet fix, now in) |
| 1. Two-tier platform | Curriculum tiers, non-guarantee line, experienced diagnostic entry, Tier A journey, `artefact` and `brief` steps, store fields (optional), copy pass | yes | Unit (schema, store migration from 1.0 backups), e2e on tiers/diagnostic/journey, axe |
| 2. Module 17 + 18.4 to 18.5 | 9 lessons, mission, coverage lab, CRC lab, telemetry parse lab | none | Content tests, labs in CI, e2e for artefact and brief steps, axe |
| 3. Module 18 (rest) + 19 | 1553B, ARINC 429, UDP, Modbus; redundancy module; two missions; four labs | none | Same |
| 4. Module 20 + 21 | Publish drafts; frame executive, DPRAM, WCET, deadlock; HIL and fault injection; two missions; four labs | none | Same |
| 5. Module 22 + portfolio track 2 | Advanced Python; seven stages with Build-it labs; `pytest` in CI (add to the labs job) | portfolio track selector | Same plus portfolio e2e |
| 6. Modules 23, 24, 25 + mock panel bank | Debugging, flight-control orientation, interviews; Tier A interview questions; glossary | mock panel tiers | Same |
| 7. Docs and release 2.0 | CAREER_PATHWAY.md, CURRICULUM.md, PORTFOLIO_TRACK_2.md, LEARNING_COVERAGE_MATRIX.md rows, CONTENT_REVIEW.md rows, README and product brief corrected | none | Full suite, Lighthouse, production verification, rollback recorded |

Order rationale: batch 1 is the platform every later batch needs; batches 2 to 4 are the rows the panels test first; batch 5 is the evidence; batch 6 the depth and the interview layer. Each batch is one PR against main after batch 0 lands, so nothing stacks more than one deep.

**Rules:** no employer or programme detail as content; no personal data in the public repository; no job or salary claims; no skipped checks.

