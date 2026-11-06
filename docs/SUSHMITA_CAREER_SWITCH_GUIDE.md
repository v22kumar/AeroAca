# Sushmita's career-switch guide

This is the one page to read first. It says where you stand, where the academy is taking you, what to apply for now, and what to study in which order. Everything else in `docs/` hangs off it: the [full curriculum map](FULL_CURRICULUM_MAP.md), the [topic breakdown](MODULE_TOPIC_BREAKDOWN.md), the [four pathways](CAREER_PATHWAYS.md), the [30/60/90-day plan](STUDY_PLAN_30_60_90.md), the [learner guide](LEARNER_GUIDE.md) for "where do I start" questions, and the [diagram index](DIAGRAM_INDEX.md).

Personal details are kept out of this public file on purpose. The profile below is the technical shape of the experience, not a CV. Nothing here guarantees a job, an offer or a salary; it is a plan for becoming demonstrably better at the work.

## 1. Where you stand

**Technical profile, abstracted.** Two to three years in safety-critical avionics: integration and verification of flight-control computer cards and signal-conditioning hardware; validation of redundant data links between flight-control channels; Embedded C test routines over differential serial links; white-box and black-box testing of firmware on an ARM9 platform; low-level driver verification against custom hardware; a Python suite that parsed avionics bus telemetry and cut regression effort; multi-protocol bench validation (CAN, RS-232/422/485, UART, Ethernet) with oscilloscopes, multimeters, electronic loads and HIL rigs; flashing and bring-up with ST-Link and J-Link; requirements-to-test traceability under a DO-178B process.

**What that already is.** A hardware-software integration engineer with verification depth, a working vocabulary of avionics, and daily bench skills. That is the profile Pathway B (Aerospace and Systems Engineering) and Pathway A (Embedded and Electronics R&D) both build on.

**What it is not yet, in a panel's eyes.** Authorship of shipped firmware; designed-and-built electronics; independent timing analysis; a redundancy architecture you can defend; a verification mini-project you can show (coverage, traceability); fluency in the two avionics buses on your skills line down to the bit; a Python framework you can draw. Each of those is a module in this academy and a stage in the portfolio.

## 2. Strongest target role families (in order)

| Role family | Why it fits now | What panels test | Academy modules that make it demonstrable |
|---|---|---|---|
| **Avionics / UAV systems integration engineer** | Your daily work, told well | Data buses, redundancy, ICDs, timing budgets, bench and HIL, DO-178C literacy | 18, 19, 20, 21, 11, 17 (lessons 17.1 to 17.4) |
| **Embedded systems engineer (test-and-integration background welcome)** | C test routines, bring-up, debugging on target | Embedded C depth, drivers, interrupts and timing, debugging, one built thing | 5, 3, 7, 23, 20, portfolio |
| **Electronics R&D / hardware validation engineer** | Signal conditioning, instruments, power validation | Schematic review, power trees, ADC chains, measurement, bring-up | 1, 2, 10, 11 |
| **Verification & validation engineer (DO-178C)** | Strongest existing exposure; the door, not the ceiling | Objectives and levels, requirements-based tests, coverage and MC/DC, traceability, audits | 17, 12, 21 |
| **Embedded test automation engineer** | The Python suite | `pytest`, binary parsing, serial and instrument control, reports, framework architecture | 22, 13 |

**Best pathway now:** B (Aerospace and Systems Engineering), with A (Embedded and Electronics R&D) as the principal long-term direction. V&V is a specialisation inside B that you can lead with in interviews; it should not become the whole identity. C (AI and Intelligent Systems) and D (Engineering Leadership and Technical Product Ownership) are long-term extensions that reuse everything built here.

## 3. Apply for now, in parallel with study

Apply from week one. Learning advanced firmware does not create years of experience, and experience you already have is enough for the first two role families above when it is told with evidence.

- **Apply now:** avionics/UAV integration, hardware validation, V&V, and embedded roles that say "test and integration background welcome".
- **Apply after the first portfolio stage is public (about day 30):** embedded systems engineer roles that expect a built-and-tested component.
- **Apply after the coverage mini-project and voter lab (about day 60):** roles that name DO-178C practice or redundant architectures explicitly.

## 4. Study in parallel: the first six weeks at a glance

| Thread | What | Why first |
|---|---|---|
| Make every claim defensible | Module 25 (interviews for experienced engineers), then 18.1 to 18.3 (1553, 429), 19.3 (voting), 17.1 to 17.3 (DO-178C levels, RBT) | These are the questions you will be asked in the first three interviews |
| Build one thing properly | P0-1a: the frame parser built, broken and tested (module 5, then 23.1 to 23.3 for GDB) | Turns "tested firmware" into "writes and tests firmware" |
| Refresh, do not relearn | Modules 1, 3, 4, 10 at Understand depth only where the diagnostic finds a gap | You know most of this; the academy's job is the gaps |

## 5. Build confidence in, refresh, learn deeply

| Build confidence in (you know it, say it crisply) | Refresh (quick passes) | Learn deeply (new capability) |
|---|---|---|
| Bench measurement and bring-up order | Circuit laws, RC, logic levels, power trees | Embedded C authorship under test (5, P0-1) |
| Protocol decoding on a scope or analyser | UART, SPI, I2C, CAN frame details | Avionics buses to the bit (18) |
| Fault isolation with evidence | Interrupts, NVIC, watchdogs | Redundancy and voting (19) |
| Requirements-to-test traceability | Test-case writing, SIL/HIL | Timing analysis and executives (20) |
| Explaining your own debugging stories | Root-cause method | Debugging on target with GDB and fault registers (23) |
| | Python basics, serial | `pytest` framework and binary parsing (22) |
| | | Coverage, MC/DC, change impact (17) |

## 6. The 30 / 60 / 90 in one line each

- **Days 1 to 30, interview readiness:** every claim defensible; buses, voting, DO-178C levels, timing basics; frame parser built and tested; applications started. Detail: [STUDY_PLAN_30_60_90.md](STUDY_PLAN_30_60_90.md).
- **Days 31 to 60, capability:** portfolio stages 2 to 4 (link with CRC, voter with fault injection, coverage and traceability); HIL and fault-injection lessons; GDB on target; `pytest` suite started.
- **Days 61 to 90, depth:** portfolio stages 5 to 7; flight-control orientation and PID; ARM9 vs Cortex-M and driver verification; weekly mock panels; negotiation.

## 7. How the journey supports growth toward R&D and product ownership

The portfolio product (an STM32 sensor monitor in the foundations, and a redundant telemetry link in the advanced track) is deliberately the same object seen from four directions. In Pathway A you build and debug it. In Pathway B you give it an architecture, buses, redundancy and a verification argument. In Pathway C, later, you add estimation and an edge model and measure what they cost. In Pathway D, later, you write its requirements from a synthetic stakeholder brief, its BOM and cost roll-up, its decision records, its risk register and its roadmap, and you run its design review. Nothing in that progression is a promise of a title; it is the sequence of evidence that technical leads and product owners are made from.

## 8. Rules the academy keeps for you

- Nothing is marked complete because it was opened. Completion means the exercises at your chosen depth were solved; "completed at Apply depth" says exactly that and never "mastered".
- Simulations are labelled; host labs are not board results; a passing lab is not flight safety.
- Prerequisites inform; nothing is locked. If a step feels like a jump, the "Before this lesson" card is the way back.
- No employer material, no personal data, no paid services, no job guarantees.
