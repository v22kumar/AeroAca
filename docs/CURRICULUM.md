# AeroAca engineering syllabus

A practical academy for embedded/electronics R&D, aerospace and UAV systems, avionics integration/V&V, and later intelligent systems and technical leadership. This is a long-term syllabus, not a claim that every subject is implemented or a professional qualification. The [source audit](ENGINEERING_GAP_AUDIT.md), [coverage matrix](LEARNING_COVERAGE_MATRIX.md), [four pathways](CAREER_PATHWAYS.md) and [implementation plan](ENGINEERING_IMPLEMENTATION_PLAN.md) govern changes.

## Common engineering core: reuse modules 1–16

| Existing module | Revised subject scope | Priority and practical outcome |
|---|---|---|
| 1 Electronic engineering fundamentals | Circuit laws, passives/actives, analog conditioning, digital logic/timing, regulation/protection, ADC/DAC, filters/noise, grounding/ESD, calibration | P0: design/simulate an interface and explain measured/model discrepancies |
| 2 Circuit design, schematics and PCB | Datasheets/component selection, KiCad schematic/PCB, LTspice, layout/returns, SI/EMC, DFM/DFT | P0: source projects, ERC/DRC, manufacturing/test outputs and review |
| 3 Microcontrollers, processors and ARM | Cortex architecture, STM32 build/flash/debug, register-level GPIO/ADC/timers/PWM/DMA/interrupts, clocks/memory, watchdog/reset/low power | P0: cross-build/test drivers; separate host and board evidence |
| 4 Communication interfaces | UART/SPI/I2C/CAN, Ethernet, RS-232/485/Modbus; driver timeouts/recovery, traces and integration; link to existing 1553 foundation | P0: bounded implementation and error-path tests; CAN FD/LIN optional |
| 5 Embedded C | Functions, types/pointers/arrays/structures, linkage, allocation/sections/linker scripts, registers, state machines/rings, defensive code/static analysis/MISRA awareness | P0: write/run/test/debug original code and independent boundary cases |
| 6 Modern embedded C++ | Classes/references, RAII/ownership, templates, dispatch/interfaces, resource policy, mocks and debugging | P1: compiled/tested abstraction with resource trade-offs |
| 7 Firmware architecture and drivers | HAL/BSP/test seams, startup/image layout, bootloaders/updates/rollback, peripheral drivers, GDB/JTAG/SWD, build/cross-compilation/CI | P0 build/debug/driver/recovery essentials; deeper architecture P1 |
| 8 RTOS and real-time systems | FreeRTOS tasks/scheduler/tick, queues/semaphores/notifications/mutexes, inversion/deadlock, response-time analysis | P0: bounded handoff and deadline evidence under explicit assumptions |
| 9 Embedded Linux and developer workflows | Shell/processes/logs, boot/device tree, BSP, user/kernel driver foundations; shared Git/build/debug | Git/build/debug P0; Linux/BSP/drivers P1 using emulator evidence |
| 10 Instrumentation and diagnosis | DMM/PSU/scope/logic analyzer/DAQ, power-reset-clock bring-up, SI measurement and RCA | P0: raw captures, settings/uncertainty, fix/unfix diagnosis |
| 11 Integration and product engineering | Needs/requirements/acceptance, architecture/partitioning, ICDs, bring-up, design reviews/decisions, change/configuration/release | P0 integrated reproducible product; deeper ownership shares these topics |
| 12 Verification, reliability and qualification | Host/unit/integration/regression/CI, traceability, jigs/ATE, SIL/PIL/HIL, faults/FMEA/environmental planning | P0 tests/integration; P1 advanced assurance/qualification with evidence limits |
| 13 Python for engineering and test automation | Language/bytes/files/exceptions, serial/SCPI/PyVISA, acquisition/logging/CSV/statistics/plots, pytest/reproducibility | P0 tooling and automation; reused for signals/AI |
| 14 Safety and standards awareness | DO-178C/DO-254/DO-160, ARP4754A/ARP4761; existing automotive/medical/industrial context | P1 scope/application; exact requirements need source/edition/clause and review |
| 15 Cross-industry applications | UAV/avionics, automotive, medical, industrial, FPGA and vision | P2 demand-led; canonical foundations shared, not duplicated |
| 16 Engineering communication and careers | Artifact-backed project/debug explanations, coding interviews, trade-offs, applications and honest negotiation | P0 alongside learning; no experience or job title inferred from completion |

## Advanced modules 17–31: reconciled

The original 2.0 advanced proposal ([ADVANCED_SYLLABUS_2.0_PROPOSAL.md](ADVANCED_SYLLABUS_2.0_PROPOSAL.md)) defined modules 17–25. The engineering audit, written without access to it, used the same numbers for partly different groupings. [ADVANCED_MODULE_CROSSWALK.md](ADVANCED_MODULE_CROSSWALK.md) reconciles them: **17–25 keep their original identifiers and scope**; **26–31 are new modules** for the subjects the proposal did not cover. None is in `content/curriculum.ts` yet; each appears there when its first lesson is published, after the pilot gate.

**Principal direction.** Embedded and electronics R&D and aerospace systems engineering are the principal long-term direction of this syllabus. Verification and validation (module 17 and the test half of 21) is an important specialisation and a practical near-term route to better roles, not the only professional destination.

| Module | Scope | Pathways | Batch |
|---|---|---|---|
| 17 Verification the DO-178C way | Objectives and levels, HLR/LLR/derived, requirements-based tests, traceability and problem reports, structural coverage and MC/DC with a host lab, change impact, dead code, B→C and audits; ARP4754A/4761 concepts at the systems level | B, D (A for the test lessons) | P1-4; test lessons may start at P0-5 |
| 18 Avionics data buses and telemetry | MIL-STD-1553B (pilot lesson is 18.1), ARINC 429, RS-232/422/485 and CRC framing, telemetry packets and `struct`, Ethernet/UDP, Modbus RTU | A, B, D | 18.4–18.7 P0-5; 18.1–18.3 P1-2 |
| 19 Redundant flight-control architectures | The flight-control system as a whole; duplex/triplex/quad; cross-channel exchange and voting (voter lab); testing a cross-channel link; synchronisation | B, D | P1-2 |
| 20 Deterministic timing and real-time analysis | Tasks/scheduler/tick, utilisation and response time, frame-based executives, shared memory and DPRAM, WCET on target, deadlock and lock ordering | A, B | 20.1, 20.2, 20.6 at P0-3 under module 8; rest P1-2 |
| 21 HIL, test benches and fault injection | HIL architecture, bench design from an ICD, FMEA to fault tests, protocol fault injection (injector lab), power and environment faults | B, D (A for fault injection) | P1-4; fault-injection lessons may start at P0-5 |
| 22 Advanced Python test automation | `struct`, serial and instruments, logs to evidence, `pytest` for hardware, framework architecture, reproducible runs | A, B, C, D | P0-1 and P0-5 (shared with module 13; one lesson set) |
| 23 Production debugging on target | SWD/JTAG and the probe, GDB on target, HardFault analysis (fault-decode lab), ARM9 vs Cortex-M, verifying a driver against a register spec | A, B, C, D | 23.1–23.3 P0-1b; rest P1-1 |
| 24 Flight-control systems orientation | The control loop on an aircraft or UAV, PID without mystery (step-response lab), the flight computer's software from outside | B, C | P1-3 |
| 25 Interviews for experienced engineers | Career gap or contract role, "what did you own", auditing your own claims, metrics claims, notice/CTC/negotiation, mock panel | A, B, C, D | P0-5 (shared with module 16) |
| 26 Control engineering and flight dynamics (new) | PID with anti-windup, stability and sample time, flight dynamics and frames, model-based design concepts with an open alternative | B, C | P1-3 |
| 27 Signals, navigation and estimation (new) | IMU/GNSS/air data and fault models, filtering and fusion, Kalman predict/update | B, C | P1-3 |
| 28 Engineering mathematics and AI foundations (new) | Vectors, matrices, probability, sampling, least squares; ML basics, baselines, splits, leakage | B, C | P1-3 (math), P2-1 (ML) |
| 29 Edge AI and intelligent products (new, optional) | TinyML and quantisation, anomaly detection and predictive maintenance, embedded vision, AI-assisted firmware and tests, assurance of AI-enabled systems; maturity-labelled | C (B for vision, assurance) | P2-1, P2-2 |
| 30 Autonomy and simulation engineering (new, optional) | ROS 2, PX4/ArduPilot simulation, digital twins; isolated simulation, explicit limits | B, C | P2-2 |
| 31 Engineering leadership and technical ownership (new) | Stakeholders, feasibility and trade-offs, BOM and cost, reliability and lifecycle, reviews, roadmaps, release ownership; through reviewed work on the shared product | A, B, D | P2-3 |

## Teaching and evidence

All new subjects use the learner-validated Understand → Apply → Master format **after** the three-lesson pilot is evaluated and the template adjusted. No academy-wide conversion before that gate. Start with purpose and simple intuition, useful visual/walkthrough, worked intermediate steps, meaningful guided hints and independent application/debugging, realistic problems, misconception feedback and jobs/product relevance. Prefer clear teaching over lesson counts.

Evidence progresses from prediction to code/design artifacts, runnable negative tests/raw traces, then independent review and integrated changes. Reading, completion/depth and self-ratings remain activity, not competence alone. Distinguish standards scope summaries and simplified models from verified requirements. Passing host/SIL/HIL/AI exercises never establishes flight safety.

## Shared product, four pathways and separate career program

Extend the existing **STM32 sensor-monitoring and fault-detection system**: needs → requirements → architecture → circuit/PCB → firmware → calibration → tests/faults → review → release/change. Reuse its seven stages and labs; retain separate simulated and physical evidence. Keep confidential employer artifacts and personal résumé details out of public source.

Pathway A builds/debugs embedded products; B adds aerospace architecture/assurance; C adds optional intelligent sensing/autonomy after the core; D develops technical decisions and ownership through reviewed work. Shared canonical subjects and artifacts prevent duplicate lessons. The career-goal/evidence recommendation feature is specified in `CAREER_PATHWAYS.md`, not yet implemented.

Keep `content/journey.ts` and its existing 30 days independent of this long-term syllabus. Maintain 30/60/90-day career milestones separately, adjusting to roles/time; the repository currently implements only the 30-day journey. Applications and interviews start now, without waiting for academy completion. See the implementation plan for proposed 60/90-day milestones.
