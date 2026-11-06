# Engineering learning coverage matrix

Audit date: 2026-11-06. This supersedes the previous matrix's current-status claims. The [historical 97-topic audit](LEARNING_COVERAGE_MATRIX_BASELINE.md) is retained for traceability; its “published”/“done” wording often includes pending branches and must not be treated as production coverage.

## Evidence and scope

- Production source baseline: `main` at `d291bf50f155b2ca8aff0e18b55064a5bd9a7f8d` (37 lesson files).
- Pending cumulative source: PR #16 at `82920a440d96eb1097607568f0dcbaf715941125` (52 lesson files, 10 missions, 16 lab-manifest entries including one intentional-failure demonstration). The 15 additional lessons belong to open PRs, not production.
- Reviewed all six open PR descriptions, refs and increments (#11–16), lesson objectives, teaching/assessment structures, lab manifest/source and portfolio, curriculum, original matrix, authoring/pilot docs and recommendation/readiness functions. This is a coverage audit, not an independent technical sign-off on every code example or standards statement.
- [Open-PR inventory and audit limitations](ENGINEERING_GAP_AUDIT.md). No checked-in specification for advanced modules 17–25 was found in any open-PR tree or repository docs. Suggested advanced grouping below is provisional; reconcile against the original proposal before allocating identifiers.
- [Full machine-readable matrix](ENGINEERING_COVERAGE.csv) is authoritative for per-subject prerequisites, objectives, required depth, practical task, evidence, career relevance, priority and batch. Tasks/evidence in that file are acceptance targets, not claims that the labs exist or the learner has done them.

## Classification rules

Classification describes the state **before this planning change**. A new plan does not retroactively turn a missing implementation into an existing one.

| Classification | Meaning |
|---|---|
| Fully implemented and assessed | Source contains explanation, examples and graded assessment for the narrow scope stated; not a claim of professional competence or learner validation |
| Implemented but too shallow | Some teaching exists, but independent implementation, design, debugging or required depth is missing |
| In an existing open PR | Materially relevant additions are pending in the named PR; the row's tasks may still exceed that PR's scope |
| Planned but not implemented | A concrete topic/task was already in the curriculum or prior audit plan, but no dedicated implementation was found |
| Completely missing | No sufficient dedicated implementation or concrete prior plan found for this requested capability |
| Optional future specialization | Deliberate P2/domain extension; prerequisites and evidence still required; not currently implemented merely because listed here |

`open_prs` also records pending changes for shallow rows. `source_paths` names reusable evidence even when it is insufficient; for architecture/integration rows also reuse `content/projects/stm32-sensor-monitor.ts`. Fully assessed rows are chiefly Understand-level decode/review/scope skills. Applied protocol drivers, assurance practice and hardware work have separate rows.

## Snapshot counts

| Classification | Subject rows |
|---|---|
| In an existing open PR | 20 |
| Implemented but too shallow | 35 |
| Completely missing | 17 |
| Fully implemented and assessed | 10 |
| Planned but not implemented | 22 |
| Optional future specialization | 10 |

Counts describe inventory, never readiness. No percentage or subject-count target establishes capability.

## Subject index

See the CSV for the complete row contract. Module numbers 1–16 reuse existing modules; 17–25 are provisional groupings only.

| ID | Subject | Classification | Module | PR | Priority / batch |
|---|---|---|---|---|---|
| ENG-001 | Circuit analysis: Ohm/KCL/KVL/Thévenin | In an existing open PR | 1 | 14 | P0 / P0-4 |
| ENG-002 | Passive components and RC filtering | In an existing open PR | 1 | 14 | P0 / P0-4 |
| ENG-003 | Diodes and transistor switch design | In an existing open PR | 1 | 14 | P0 / P0-4 |
| ENG-004 | Analog electronics and signal conditioning | Implemented but too shallow | 1 | None | P0 / P0-4 |
| ENG-005 | Digital logic and electrical levels | In an existing open PR | 1 | 14 | P0 / P0-4 |
| ENG-006 | Combinational/sequential logic and timing | Completely missing | 1 | None | P0 / P0-4 |
| ENG-007 | Power regulation and thermal budgets | Implemented but too shallow | 1 | 16 | P0 / P0-4 |
| ENG-008 | Power protection and ESD | In an existing open PR | 1 | 14 | P0 / P0-4 |
| ENG-009 | ADC acquisition and noise | Implemented but too shallow | 1;3 | None | P0 / P0-2 |
| ENG-010 | DAC and PWM reconstruction | Implemented but too shallow | 1;3 | None | P0 / P0-4 |
| ENG-011 | Digital filtering and aliasing | Implemented but too shallow | 1 | None | P1 / P1-3 |
| ENG-012 | Sensor interfacing and calibration | Implemented but too shallow | 1;4;11 | None | P0 / P0-5 |
| ENG-013 | Datasheets and component selection | Implemented but too shallow | 2 | None | P0 / P0-4 |
| ENG-014 | Schematic reading and review | Fully implemented and assessed | 2 | None | P0 / REUSE |
| ENG-015 | Schematic capture in KiCad | Planned but not implemented | 2 | None | P0 / P0-4 |
| ENG-016 | PCB layout and manufacturing outputs | Planned but not implemented | 2 | None | P0 / P0-4 |
| ENG-017 | LTspice and simulation validity | Planned but not implemented | 2 | None | P0 / P0-4 |
| ENG-018 | Signal integrity and termination | Implemented but too shallow | 2;10 | None | P0 / P0-4 |
| ENG-019 | Grounding and return-current design | In an existing open PR | 1;2 | 14 | P0 / P0-4 |
| ENG-020 | EMI/EMC pre-compliance | Planned but not implemented | 2;12 | None | P0 / P0-4 |
| ENG-021 | Hardware prototyping and bring-up | Implemented but too shallow | 10;11 | None | P0 / P0-5 |
| ENG-022 | DFM DFT and production test | Planned but not implemented | 2;12 | None | P0 / P0-5 |
| ENG-023 | MCU/MPU/SoC and ARM selection | In an existing open PR | 3 | 15 | P0 / P0-2 |
| ENG-024 | Cortex-M architecture and exceptions | Implemented but too shallow | 3 | None | P0 / P0-2 |
| ENG-025 | STM32 build flash and first debug session | In an existing open PR | 3 | 15 | P0 / P0-2 |
| ENG-026 | GPIO and clock tree | In an existing open PR | 3 | 15 | P0 / P0-2 |
| ENG-027 | Timers PWM and input capture | Implemented but too shallow | 3 | None | P0 / P0-2 |
| ENG-028 | DMA and buffer ownership | Implemented but too shallow | 3;7 | None | P0 / P0-2 |
| ENG-029 | Interrupt programming and latency | Implemented but too shallow | 3 | None | P0 / P0-2 |
| ENG-030 | Watchdogs and reset diagnosis | Implemented but too shallow | 3 | None | P0 / P0-2 |
| ENG-031 | Low-power modes and wake-up | In an existing open PR | 3 | 15 | P0 / P0-2 |
| ENG-032 | UART protocol decoding | Fully implemented and assessed | 4 | None | P0 / REUSE |
| ENG-033 | I2C protocol decoding | Fully implemented and assessed | 4 | None | P0 / REUSE |
| ENG-034 | SPI protocol decoding | Fully implemented and assessed | 4 | None | P0 / REUSE |
| ENG-035 | CAN protocol and bus-off diagnosis | Fully implemented and assessed | 4 | None | P0 / REUSE |
| ENG-036 | UART SPI I2C and CAN driver implementation | Implemented but too shallow | 4;7 | None | P0 / P0-2 |
| ENG-037 | RS-232 RS-485 and Modbus | Planned but not implemented | 4 | None | P0 / P0-5 |
| ENG-038 | Ethernet IP TCP UDP and drivers | Planned but not implemented | 4;7 | None | P0 / P0-5 |
| ENG-039 | CAN FD and LIN | Optional future specialization | 4 | None | P1 / P1-2 |
| ENG-040 | C fixed-width arithmetic and bit masks | In an existing open PR | 5 | 13 | P0 / P0-1 |
| ENG-041 | C functions pointers arrays and linkage | In an existing open PR | 5 | 15 | P0 / P0-1 |
| ENG-042 | C structs packing endianness and alignment | Implemented but too shallow | 5 | 15 | P0 / P0-1 |
| ENG-043 | Memory allocation stack pools and sections | In an existing open PR | 5 | 15 | P0 / P0-1 |
| ENG-044 | Linker scripts startup and image layout | Implemented but too shallow | 5;7 | None | P0 / P0-1 |
| ENG-045 | Register-level programming | In an existing open PR | 5;3 | 13;15 | P0 / P0-2 |
| ENG-046 | State machines and nonblocking firmware | In an existing open PR | 5 | 15 | P0 / P0-1 |
| ENG-047 | Ring buffers and concurrency assumptions | In an existing open PR | 5 | 15 | P0 / P0-2 |
| ENG-048 | Defensive C MISRA awareness and static analysis | Completely missing | 5;12 | None | P0 / P0-1 |
| ENG-049 | Modern embedded C++ RAII and interfaces | Implemented but too shallow | 6 | None | P1 / P1-1 |
| ENG-050 | C++ classes templates polymorphism and target debugging | Planned but not implemented | 6;7 | None | P1 / P1-1 |
| ENG-051 | Firmware layering HAL BSP and test seams | Planned but not implemented | 7 | None | P0 / P0-1 |
| ENG-052 | Bootloaders updates rollback and recovery | Implemented but too shallow | 7 | None | P0 / P0-5 |
| ENG-053 | GDB JTAG SWD and fault diagnosis | Planned but not implemented | 7;10 | None | P0 / P0-1 |
| ENG-054 | FreeRTOS task and scheduler foundations | Planned but not implemented | 8 | None | P0 / P0-3 |
| ENG-055 | Synchronization queues semaphores notifications | Implemented but too shallow | 8 | None | P0 / P0-3 |
| ENG-056 | Priority inversion and inheritance | Implemented but too shallow | 8 | 16 | P0 / P0-3 |
| ENG-057 | Deadlock lock ordering and timeouts | Planned but not implemented | 8 | None | P0 / P0-3 |
| ENG-058 | Real-time response and deadline analysis | Planned but not implemented | 8 | None | P0 / P0-3 |
| ENG-059 | Embedded Linux boot device tree and BSP | Implemented but too shallow | 9 | None | P1 / P1-1 |
| ENG-060 | Linux shell processes and userspace drivers | Planned but not implemented | 9 | None | P1 / P1-1 |
| ENG-061 | Linux kernel driver fundamentals | Planned but not implemented | 9 | None | P1 / P1-1 |
| ENG-062 | Build systems cross-compilation and CI | Implemented but too shallow | 7;9;12 | None | P0 / P0-1 |
| ENG-063 | Git branching review and reproducible release | Planned but not implemented | 9;11 | None | P0 / P0-1 |
| ENG-064 | DMM and bench supply measurements | In an existing open PR | 10 | 14 | P0 / P0-4 |
| ENG-065 | Oscilloscope and logic analyzer practice | Implemented but too shallow | 10 | None | P0 / P0-5 |
| ENG-066 | DAQ sampling and reporting | Planned but not implemented | 10;13 | None | P0 / P0-5 |
| ENG-067 | Root-cause analysis | Fully implemented and assessed | 10 | None | P0 / REUSE |
| ENG-068 | Requirements and acceptance criteria | Implemented but too shallow | 11 | None | P0 / P0-5 |
| ENG-069 | System architecture and hardware/software partitioning | Implemented but too shallow | 11 | None | P0 / P0-5 |
| ENG-070 | Interfaces and integration | Implemented but too shallow | 11 | None | P0 / P0-5 |
| ENG-071 | Design reviews and engineering decisions | Implemented but too shallow | 2;11 | None | P2 / P2-3 |
| ENG-072 | Release change and configuration management | Planned but not implemented | 11 | None | P0 / P0-5 |
| ENG-073 | Test design and traceability | Fully implemented and assessed | 12 | None | P0 / REUSE |
| ENG-074 | Host unit integration regression and fault injection | In an existing open PR | 12 | 13 | P0 / P0-1 |
| ENG-075 | SIL HIL and model limitations | Implemented but too shallow | 12 | None | P1 / P1-4 |
| ENG-076 | FMEA and reliability engineering | Implemented but too shallow | 12 | None | P1 / P1-4 |
| ENG-077 | Environmental qualification and test planning | Planned but not implemented | 12 | None | P1 / P1-4 |
| ENG-078 | Python engineering foundations | Planned but not implemented | 13 | None | P0 / P0-1 |
| ENG-079 | Serial and instrument automation | In an existing open PR | 13 | 13 | P0 / P0-5 |
| ENG-080 | Reports statistics plotting and pytest | Planned but not implemented | 13 | None | P0 / P0-1 |
| ENG-081 | DO-178C DO-254 DO-160 and ARP scope | Fully implemented and assessed | 14 | None | P0 / REUSE |
| ENG-082 | Cross-industry standards scope | Fully implemented and assessed | 14 | None | P0 / REUSE |
| ENG-083 | Aircraft UAV and DFCC architecture | Completely missing | 17 provisional | None | P1 / P1-2 |
| ENG-084 | Redundancy cross-channel communication and voting | Completely missing | 17 provisional | None | P1 / P1-2 |
| ENG-085 | Real-time avionics architecture | Completely missing | 17 provisional | None | P1 / P1-2 |
| ENG-086 | MIL-STD-1553B word and message foundations | In an existing open PR | 4;18 provisional | 16 | P1 / P1-2 |
| ENG-087 | MIL-STD-1553B integration and schedule analysis | Completely missing | 18 provisional | None | P1 / P1-2 |
| ENG-088 | ARINC 429 and serial avionics links | Completely missing | 18 provisional | None | P1 / P1-2 |
| ENG-089 | Flight dynamics control loops and PID | Completely missing | 19 provisional | None | P1 / P1-3 |
| ENG-090 | IMU GNSS air-data sensors and fault models | Completely missing | 20 provisional | None | P1 / P1-3 |
| ENG-091 | Signal processing and sensor fusion | Completely missing | 20 provisional | None | P1 / P1-3 |
| ENG-092 | State estimation and Kalman foundations | Completely missing | 20 provisional | None | P1 / P1-3 |
| ENG-093 | MATLAB/Simulink and Model-Based Design concepts | Completely missing | 19;21 provisional | None | P2 / P2-2 |
| ENG-094 | Systems requirements ARP4754A ARP4761 concepts | Implemented but too shallow | 21 provisional | None | P1 / P1-4 |
| ENG-095 | Advanced V&V coverage robustness and independence | Implemented but too shallow | 21 provisional | None | P1 / P1-4 |
| ENG-096 | HIL SIL and fault-injection campaign | Implemented but too shallow | 21 provisional | None | P1 / P1-4 |
| ENG-097 | Engineering mathematics for signals estimation and ML | Completely missing | 22 provisional | None | P1 / P1-3 |
| ENG-098 | Machine-learning fundamentals | Optional future specialization | 22 provisional | None | P2 / P2-1 |
| ENG-099 | Edge AI TinyML quantization and inference | Optional future specialization | 23 provisional | None | P2 / P2-1 |
| ENG-100 | Anomaly detection and predictive maintenance | Optional future specialization | 23 provisional | None | P2 / P2-1 |
| ENG-101 | Embedded computer vision | Optional future specialization | 23 provisional | None | P2 / P2-2 |
| ENG-102 | Autonomy ROS 2 and PX4/ArduPilot simulation | Optional future specialization | 24 provisional | None | P2 / P2-2 |
| ENG-103 | Digital twins and simulation-based engineering | Optional future specialization | 24 provisional | None | P2 / P2-2 |
| ENG-104 | AI-assisted firmware and generated tests/analysis | Optional future specialization | 23 provisional;12 | None | P2 / P2-1 |
| ENG-105 | Verification of AI-enabled safety-critical systems | Optional future specialization | 21;23 provisional | None | P2 / P2-2 |
| ENG-106 | Customer discovery and stakeholder problems | Completely missing | 25 provisional | None | P2 / P2-3 |
| ENG-107 | Technical feasibility BOM and engineering costs | Completely missing | 11;25 provisional | None | P2 / P2-3 |
| ENG-108 | Reliability maintainability and lifecycle ownership | Implemented but too shallow | 12;25 provisional | None | P2 / P2-3 |
| ENG-109 | Roadmaps prioritization and technical leadership | Completely missing | 25 provisional | None | P2 / P2-3 |
| ENG-110 | Product integration qualification and release ownership | Implemented but too shallow | 11;12;25 provisional | None | P2 / P2-3 |
| ENG-111 | Honest career communication and portfolio | Fully implemented and assessed | 16 | None | P0 / REUSE |
| ENG-112 | Coding interviews and negotiation | Planned but not implemented | 16 | None | P0 / P0-5 |
| ENG-113 | Other application specializations FPGA automotive medical industrial | Optional future specialization | 15 | None | P2 / P2-2 |
| ENG-114 | Career-objective and prerequisite pathway recommendations | Completely missing | platform | None | P0 / P0-0 |

## Execution gate

`docs/PILOT.md` still records “Pending the first use.” Continue audit, planning and reviewable scaffolding; do not publish additional arc lessons or convert the rest of the curriculum until learner findings are recorded and the template is adjusted. [Implementation plan](ENGINEERING_IMPLEMENTATION_PLAN.md) specifies release gates and evidence. The separate 30-day fast track remains intact; 60/90-day career milestones are a career plan, not a dependency on building this academy. Applications start now.
