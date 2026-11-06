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

## Advanced groupings 17–25: provisional reconciliation

The earlier numbered proposal was not available in repository/open-PR sources. This is a **provisional crosswalk**, not an approved replacement. Reconcile it before assigning module ids or modifying `content/curriculum.ts`. Preserve the prior advanced V&V objectives when supplied and map common subjects once.

| Provisional group | Subjects | Sequence and evidence |
|---|---|---|
| 17 Aircraft/UAV and DFCC architecture | Sensor-compute-actuator/power, redundancy/fault tolerance, cross-channel communication/voting, real-time avionics | P1-2 architecture/ICD/timing review and fault campaign |
| 18 Avionics links and integration | Deepen existing 1553 pilot into bus schedules/fault diagnosis; ARINC 429 and serial links | P1-2 after protocols/drivers/timing; golden decodes and link faults |
| 19 Flight dynamics and control engineering | Plant/feedback, PID/anti-windup, stability/sample-time limits, model-based design | P1-3 controls; P2-2 MATLAB/Simulink concepts with open simulation alternative |
| 20 Signals, navigation and estimation | IMU/GNSS/air data, processing/fusion, state estimation and Kalman fundamentals | P1-3 after math; known-truth error/residual/latency evidence |
| 21 Systems assurance and advanced V&V | Requirements/safety allocation, ARP concepts, DO scope/application, coverage/robustness/independence, SIL/HIL/fault injection/integration | P1-4; retain advanced verification aims and traceable educational assurance artifacts |
| 22 Mathematics and AI foundations | Reuse Python; vectors/matrices/probability/sampling/least squares; ML basics/baselines/splits/leakage | Math precedes P1-3; optional ML in P2-1 after practical core |
| 23 Edge AI and intelligent products | TinyML/inference/quantization, anomaly detection/predictive maintenance, embedded vision, AI-assisted firmware/tests/analysis and assurance | Optional P2-1/2 public/synthetic data, resource/failure evidence |
| 24 Autonomy and simulation engineering | ROS 2, PX4/ArduPilot simulation, digital twins, simulation/model-based engineering | Optional P2-2 after Linux/control/AI/assurance; isolated simulation with explicit limits |
| 25 Engineering leadership and technical ownership | Stakeholders/problems, feasibility/partitioning/trade-offs, BOM/cost/risk, reliability/maintainability/lifecycle, reviews/roadmaps/communication/release | P2-3 extends existing product/shared modules 11/12/16 through sustained reviewed decisions |

## Teaching and evidence

All new subjects use the learner-validated Understand → Apply → Master format **after** the three-lesson pilot is evaluated and the template adjusted. No academy-wide conversion before that gate. Start with purpose and simple intuition, useful visual/walkthrough, worked intermediate steps, meaningful guided hints and independent application/debugging, realistic problems, misconception feedback and jobs/product relevance. Prefer clear teaching over lesson counts.

Evidence progresses from prediction to code/design artifacts, runnable negative tests/raw traces, then independent review and integrated changes. Reading, completion/depth and self-ratings remain activity, not competence alone. Distinguish standards scope summaries and simplified models from verified requirements. Passing host/SIL/HIL/AI exercises never establishes flight safety.

## Shared product, four pathways and separate career program

Extend the existing **STM32 sensor-monitoring and fault-detection system**: needs → requirements → architecture → circuit/PCB → firmware → calibration → tests/faults → review → release/change. Reuse its seven stages and labs; retain separate simulated and physical evidence. Keep confidential employer artifacts and personal résumé details out of public source.

Pathway A builds/debugs embedded products; B adds aerospace architecture/assurance; C adds optional intelligent sensing/autonomy after the core; D develops technical decisions and ownership through reviewed work. Shared canonical subjects and artifacts prevent duplicate lessons. The career-goal/evidence recommendation feature is specified in `CAREER_PATHWAYS.md`, not yet implemented.

Keep `content/journey.ts` and its existing 30 days independent of this long-term syllabus. Maintain 30/60/90-day career milestones separately, adjusting to roles/time; the repository currently implements only the 30-day journey. Applications and interviews start now, without waiting for academy completion. See the implementation plan for proposed 60/90-day milestones.
