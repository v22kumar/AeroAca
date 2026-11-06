# Learning coverage matrix

Topic-level audit of the 16 modules in `docs/CURRICULUM.md` against the published content on `main` (37 lessons, 10 missions, 42 interview questions, 1 portfolio project, 19 interactives), carried out on 2026-11-06 by reading every lesson's objectives, steps, exercises and references, every mission, the interview bank, the journey and the portfolio. Counts and schema tests were not used as evidence of coverage; each cell names the lesson or mission that provides it.

## How to read it

Each row is one topic or practical skill from the module's line in `docs/CURRICULUM.md`. The eight columns are the elements an independent learner needs:

| Column | Means |
|---|---|
| Theory | A concept step explains the idea, with references |
| Prereq | The knowledge the topic rests on is taught earlier in the academy **and the lesson links to it** |
| Example | A worked example with real numbers or code |
| Diagram | An interactive or figure that shows the mechanism |
| Guided | Practice with answer-specific feedback: interactive, mission or lab |
| Assess | Graded exercises the learner solves without being told the answer first |
| Trouble | Diagnosis of the failure modes: symptoms, measurements, fixes |
| Interview | At least one interview question with rubric on the topic |

Cells: **✓** present (lesson slug in brackets where it is not obvious from the row), **◐** partial (present but thin, implicit, or in another module's lesson), **✗** absent. The last column says what closes the gap and whether it is **core** (needed before an independent learner can be said to cover the module), **core-light** (short lesson, no new interactive) or **optional** (a future topic the curriculum lists at P2 or as breadth, clearly labelled so it never reads as missing).

**Prereq column, all rows:** at the time of the audit the lesson schema had a `prerequisites` field but no lesson set it and no screen showed it; cells were marked ◐ (foundation exists, not linked) or ✗ (foundation does not exist). **PR B closed the linking half:** every lesson now declares prerequisites, the lesson page shows "Before this lesson" with each prerequisite's completion state, and a content test enforces declaration, existence and acyclicity. The ✗ cells remain until the missing foundation lessons (PRs C to F) exist and are declared.

## A. Electronics and hardware engineering

### 1. Electronic engineering fundamentals (P0)

Published: `reading-a-power-tree`, `op-amp-sanity-checks`, `adc-resolution-reference-and-noise`; mission `the-rail-that-sags`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Circuit laws: Ohm, KVL/KCL, dividers, Thévenin, source resistance | ✗ (used implicitly as I × R in the power tree) | ✗ | ◐ (sag arithmetic) | ✗ | ✗ | ◐ (one numeric in power tree) | ◐ | ◐ | **core**: new lesson *Circuit laws you use every day on the bench* with a divider/Thévenin interactive and numeric exercises |
| Passive components: R, C, L behaviour, RC time constant, tolerance, ESR, decoupling | ◐ (decoupling only, power tree) | ✗ | ◐ | ✗ | ✗ | ◐ | ◐ | ✗ | **core**: new lesson *Capacitors, inductors and the RC time constant* with an RC step-response interactive; includes a runnable Python check |
| Active components: diodes, BJT/MOSFET as switches, LDO vs switching regulator | ◐ (regulator types, power tree) | ✗ | ◐ | ✗ | ✗ | ◐ | ◐ | ◐ | **core**: new lesson *Diodes and transistors as switches* (gate drive, saturation, flyback, level shifting) |
| Op-amps: headroom, operating point, virtual short, stability | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | add an op-amp stage figure (core-light) |
| Filters: RC low-pass, cutoff, anti-aliasing, order | ◐ (named in ADC lesson and aliasing visual) | ✗ | ✗ | ◐ (aliasing) | ◐ | ✗ | ✗ | ✗ | **core**: covered by the RC lesson above (cutoff, −3 dB, anti-alias before an ADC) |
| ADC: resolution, LSB, reference, noise, averaging | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| DAC and PWM as a DAC | ✗ | ✗ | ◐ (PWM arithmetic in `polling-interrupts-and-dma`) | ◐ (pwm-timer) | ◐ | ◐ | ✗ | ✗ | **optional**: short section in the RC lesson (PWM + RC low-pass = DAC) |
| Digital logic: levels, thresholds, open-drain, pull-ups, noise margin | ◐ (I2C lesson, schematic review) | ✗ | ◐ | ◐ (i2c-waveform) | ◐ | ◐ | ◐ | ◐ | **core-light**: new lesson *Logic levels, thresholds and open-drain* (3.3 V/5 V interfacing, VIH/VIL, pull-up sizing) |
| Power regulation: rails, headroom, dissipation, decoupling | ✓ | ◐ | ✓ | ✗ | ✓ (mission) | ✓ | ✓ | ✓ | add a power-tree figure (core-light) |
| Grounding and protection: ground returns, ESD/TVS, reverse polarity, fusing | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *Grounding, protection and the first thing that breaks* |

### 2. Circuit design, schematics and PCB (P0)

Published: `reading-a-schematic-like-a-reviewer`, `datasheet-triage`; mission `the-schematic-that-almost-shipped`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Schematic reading in review order | ✓ | ◐ | ✓ | ✗ | ✓ (mission) | ✓ | ✓ | ✓ | none |
| Datasheets: sections, columns, conditions, margins | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | none |
| Reference designs and component selection | ◐ (margin in datasheet triage) | ✗ | ◐ | ✗ | ✗ | ◐ | ✗ | ✗ | **core-light**: section in the layout lesson below (start from the vendor reference design, what to change and what not to) |
| Layout principles: decoupling placement, return paths, trace width and current, connectors | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *Layout basics that decide whether the schematic works* with a trace-width/return-path interactive |
| Signal integrity: rise time, bandwidth, termination, crosstalk | ◐ (`oscilloscope-probing` bandwidth) | ✗ | ◐ | ◐ | ✗ | ◐ | ◐ | ◐ | **core**: section in the layout lesson (edge rate, when a trace is a transmission line, series termination) |
| EMI/EMC basics: emissions, immunity, slew, filtering, shielding | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *EMC for people who are not EMC engineers* (what fails pre-compliance and why) |
| KiCad and LTspice workflow | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core** (practical skill): new lesson *A schematic in KiCad and a simulation you can trust* with a verified local workflow; the simulation result is checked against the RC lesson's Python model |

### 3. Microcontrollers, processors and ARM (P0)

Published: `mcu-board-does-not-boot`, `interrupts-and-nvic-priorities`, `watchdogs-and-reset-loops`; missions `fresh-board-no-sign-of-life`, `the-board-that-resets-every-second`. Planned: *Low-power modes and wake-up sources* (the only "coming soon" item in the academy).

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| MCU vs MPU vs SoC; Cortex-M/R/A; what an STM32 part number tells you | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *Choosing and reading an MCU: families, cores, part numbers* |
| STM32 project set-up: CubeMX/CubeIDE, HAL, build, flash with ST-LINK, first GPIO toggle | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core** (STM32 programming priority): new lesson *Your first STM32 project: from CubeMX to a toggling pin* with a verified local workflow and a host-runnable lab for the logic |
| GPIO modes and alternate functions; clock tree (HSE/HSI, PLL, prescalers) | ◐ (clock readiness in no-boot lesson) | ✗ | ◐ | ◐ (mcu-boot-chain) | ✗ | ◐ | ✓ | ◐ | **core**: new lesson *GPIO and the clock tree* with a clock-tree calculator interactive |
| Interrupts and NVIC | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| Timers: time base, PWM, input capture | ◐ (`polling-interrupts-and-dma`) | ◐ | ✓ | ✓ (pwm-timer) | ✓ | ✓ | ◐ | ✓ | input capture: **optional** section |
| DMA | ◐ (`polling-interrupts-and-dma`) | ◐ | ✓ | ✗ | ✗ | ✓ | ◐ | ✓ | acceptable; a DMA ring figure is core-light |
| Memory: flash, SRAM, sections, map file | ◐ (`from-reset-vector-to-main`) | ◐ | ✓ | ✓ (startup-sequence) | ✓ | ✓ | ✓ | ✓ | map-file reading goes into the debugging lesson (module 7) |
| Boot and reset | ✓ | ◐ | ✓ | ✓ | ✓ (mission) | ✓ | ✓ | ✓ | none |
| Watchdog | ✓ | ◐ | ✓ | ✓ | ✓ (mission) | ✓ | ✓ | ✓ | none |
| Low-power modes and wake-up sources | ✗ **planned** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: write it (sleep/stop/standby, wake sources, measuring current, the debugger-keeps-it-awake trap); this removes the last placeholder |

### 4. Communication interfaces (P0)

Published: `i2c-sensor-not-acknowledging`, `uart-framing-and-baud`, `spi-modes-and-chip-select`, `can-arbitration-error-frames-and-bus-off`; missions `the-sensor-that-never-answers`, `the-uart-that-prints-garbage`; `logic-analysers-decoding-a-bus` (module 10) covers tracing.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| UART framing, baud, errors | ✓ | ◐ | ✓ | ✓ | ✓ (mission) | ✓ | ✓ | ✓ | none |
| RS-232 and RS-485: levels, differential signalling, direction control, termination, biasing | ◐ (levels mentioned in UART lesson) | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ | ✗ | **core**: new lesson *RS-485 and Modbus RTU: one pair, many nodes* (also covers Modbus below) |
| I2C | ✓ | ◐ | ✓ | ✓ | ✓ (mission) | ✓ | ✓ | ✓ | none |
| SPI | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| CAN | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| CAN FD, LIN | ◐ (CAN FD named) / ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **optional** (automotive breadth); say so on the curriculum page |
| Ethernet, IP, TCP/UDP basics; reading a packet capture | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *Ethernet and TCP/UDP for embedded engineers* with a runnable Python UDP echo lab |
| Modbus RTU/TCP | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: in the RS-485 lesson, with a runnable CRC-16 lab |
| Bus tracing and failure diagnosis | ✓ (`logic-analysers-decoding-a-bus`) | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | none |

## B. Embedded software and firmware

### 5. Embedded C (P0)

Published: `embedded-c-register-bit-masks`, `pointers-to-hardware`, `fixed-width-integers-overflow-shifts`. No mission.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Types and fixed-width integers, promotion, overflow, shifts | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | add a runnable lab (wrap-around elapsed time) |
| Functions, scope, `static`, `const`, header/source split, linkage | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *C foundations for firmware: functions, scope, static and const* with runnable labs |
| Pointers and arrays; pointer arithmetic; pointers to hardware | ✓ (hardware) / ◐ (arrays) | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | arrays and pointer arithmetic go into the foundations lesson |
| Structures, unions, bitfields, packing and alignment | ✓ (overlay) / ◐ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | packing/alignment lab in the foundations lesson |
| Bit manipulation | ✓ | ◐ | ✓ | ✓ (register-bits, rmw-hazard) | ✓ | ✓ | ✓ | ✓ | add a runnable lab (mask macros with expected output) |
| `volatile` | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| Stack vs heap; memory layout (.text/.data/.bss); why firmware avoids `malloc` | ◐ (.data/.bss in startup lesson) | ◐ | ◐ | ◐ | ✗ | ◐ | ◐ | ✗ | **core**: new lesson *Stack, heap and where your variables live* with a runnable lab |
| Registers | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| State machines | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *State machines that survive review* with a runnable lab (debounce, protocol parser) |
| Ring buffers and ISR-safe data structures | ◐ (`isr-to-task-handoff` concept) | ◐ | ◐ | ✗ | ✗ | ◐ | ◐ | ◐ | **core**: new lesson *A ring buffer for the UART driver* with a runnable lab and a known-failing test |
| Small firmware exercises with runnable code and expected results | ✗ (9 lessons show code; none is runnable or verified) | – | – | – | ✗ | ✗ | – | – | **core**: `labs/` with a host build, expected outputs checked in CI, and `docs/LOCAL_LAB.md` for the verified local workflow |

### 6. Embedded C++ (P1)

Published: `raii-for-peripherals`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| RAII, guards, the embedded subset | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | add a runnable lab |
| Classes, constructors, references | ◐ (listed in the subset) | ◐ | ◐ | ✗ | ✗ | ◐ | ✗ | ✗ | **optional**: new lesson *Classes and interfaces for drivers: virtual, mocks and tests* |
| Polymorphism and modular interfaces | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | same optional lesson |
| Debugging C++ on a target | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | covered by the module 7 debugging lesson (name mangling, static init) |

### 7. Firmware architecture and drivers (P1)

Published: `from-reset-vector-to-main`, `bootloaders-images-and-recovery`, `polling-interrupts-and-dma`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Startup code and vector table | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| Bootloader, images, update, recovery | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | a slot/flag figure is core-light |
| HAL, BSP, driver and application layers; testable seams | ◐ (`pointers-to-hardware` seam) | ◐ | ◐ | ✗ | ✗ | ◐ | ✗ | ◐ | **core-light**: new lesson *Layers: HAL, BSP, drivers and the seam that lets you test on a PC* |
| Polling, interrupt, DMA driver models | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| JTAG/SWD and GDB: breakpoints, watchpoints, HardFault analysis, map and listing files | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core** (debugging priority): new lesson *Debugging with SWD and GDB: from a HardFault to the faulting line* with a runnable host-GDB lab |

### 8. RTOS and real-time systems (P0)

Published: `priority-inversion`, `isr-to-task-handoff`; mission `the-task-that-never-runs`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Tasks, states, the scheduler, the tick, idle, stack sizing, FreeRTOS basics | ◐ (assumed by both lessons) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *Tasks, the scheduler and the tick: FreeRTOS from the first task* with a task-state interactive and a host-runnable scheduler model lab |
| Priorities and scheduling policy (preemptive, cooperative, time slicing) | ◐ | ◐ | ◐ | ◐ (priority-inversion) | ◐ | ◐ | ◐ | ◐ | same lesson |
| Deadlines and timing analysis (periods, utilisation, worst case) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *Will it meet its deadline? Periods, utilisation and worst case* with numeric exercises |
| Mutex, semaphore, queue, notifications | ◐ (handoff and inversion lessons) | ◐ | ✓ | ✗ | ✓ (mission) | ✓ | ✓ | ✓ | a queue figure is core-light |
| Priority inversion | ✓ | ◐ | ✓ | ✓ | ✓ (mission) | ✓ | ✓ | ✓ | none |
| Deadlocks and lock ordering | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *Deadlock, lock ordering and timeouts* with a runnable lab that reproduces one |

### 9. Embedded Linux (P1)

Published: `embedded-linux-boot-chain`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Boot chain, device tree, kernel vs user space, dmesg | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | a boot-chain figure is core-light |
| Shell, filesystem, processes, logs | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **optional**: new lesson *The shell an embedded engineer needs* (P1 breadth; label as optional) |
| Driver basics (sysfs, i2c-dev, a kernel module's skeleton) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **optional** |
| Git | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *Git for a one-person firmware project* (the portfolio needs it) with a verified local workflow |
| Build tools: make/CMake, cross-compilation, toolchains | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: covered by `docs/LOCAL_LAB.md` and the first-STM32 lesson (Makefile, arm-none-eabi) |
| GDB on Linux | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | covered by the module 7 debugging lesson (host GDB lab) |

## C. Product R&D, integration and debugging

### 10. Instrumentation and fault diagnosis (P0)

Published: `oscilloscope-probing`, `root-cause-analysis`, `logic-analysers-decoding-a-bus`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| DMM: ranges, burden voltage, continuity, diode test, input impedance | ✗ (used in missions without being taught) | ✗ | ✗ | ✗ | ◐ (missions) | ✗ | ◐ | ✗ | **core**: new lesson *The DMM and the bench supply: the two instruments you touch first* |
| Oscilloscope | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| Logic analyser | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | a timing-diagram figure is core-light |
| Bench PSU: current limit, sense, sequencing | ◐ (`board-bring-up-checklist`) | ◐ | ◐ | ✗ | ◐ (mission) | ◐ | ✓ | ◐ | same new lesson as the DMM |
| DAQ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **optional**: section in the Python reports lesson (sampling with a USB DAQ or the MCU as a DAQ) |
| Power, reset, clock checks | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |
| Signal integrity on the bench | ◐ | ◐ | ◐ | ◐ | ✗ | ◐ | ◐ | ◐ | layout lesson (module 2) |
| Root-cause analysis | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | none |

### 11. System integration and product engineering (P0)

Published: `board-bring-up-checklist`, `interface-control-and-integration-faults`; mission `two-boards-one-bus-no-agreement`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Requirements: writing testable requirements, quantities, rationale | ◐ (mission `the-requirement-nobody-could-test`, portfolio stage 1) | ◐ | ◐ | ✗ | ✓ (mission) | ◐ | ◐ | ◐ | **core**: new lesson *Writing a requirement a test can fail* |
| Architecture: block diagram, decisions with reasons, timing budget | ◐ (portfolio stage 2) | ◐ | ◐ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *A block diagram and a timing budget before any code* |
| Interfaces and ICDs | ✓ | ◐ | ✓ | ✗ | ✓ (mission) | ✓ | ✓ | ✓ | none |
| Board bring-up | ✓ | ◐ | ✓ | ✗ | ✓ (missions, module 3) | ✓ | ✓ | ✓ | none |
| Prototype integration | ✓ (mission) | ◐ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | none |
| Design reviews | ✓ (`reading-a-schematic-like-a-reviewer`) | ◐ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | none |
| Changes and release: versioning, change control, release notes, configuration | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *Versions, changes and a release you can reproduce* |

### 12. Verification, reliability and qualification (P0)

Published: `writing-a-trustworthy-test-case`, `sil-hil-what-each-proves`, `fmea-for-a-small-embedded-product`; mission `the-requirement-nobody-could-test`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Test design and traceability | ✓ | ◐ | ✓ | ✓ (traceability) | ✓ | ✓ | ✓ | ✓ | none |
| Unit, integration, system and regression testing; host unit tests for firmware; CI | ◐ (levels named) | ◐ | ✗ | ✗ | ✗ | ◐ | ✗ | ◐ | **core**: new lesson *Unit tests for firmware on your PC, and a regression suite that runs itself* with a runnable lab (Unity-style harness) |
| ATE and test jigs | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *Production test: jigs, ATE and what a go/no-go test proves* |
| SIL/HIL | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | none |
| Environmental tests: thermal, vibration, humidity, EMC pre-compliance | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core-light**: new lesson *Environmental qualification: what the chamber proves* |
| FMEA | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none |

### 13. Python and test automation (P1)

Published: `talking-to-an-instrument-with-pyvisa`, `serial-automation-and-test-logs`; mission `the-flaky-automated-test`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Python basics for test engineers: running scripts, venv, bytes vs str, files, functions, exceptions | ✗ (both lessons assume it) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *Python for the test bench: the fifth of the language you need* with runnable labs |
| Serial communication | ✓ | ◐ | ✓ | ✗ | ✓ (mission) | ✓ | ✓ | ✓ | add a runnable lab (the request-reply helper against a fake port) |
| SCPI and PyVISA | ✓ | ◐ | ✓ | ✓ (scpi-console) | ✓ | ✓ | ✓ | ✓ | none |
| Data acquisition and logging | ◐ | ◐ | ◐ | ✗ | ✗ | ◐ | ✗ | ✗ | same as reports lesson |
| Reports: CSV, summary statistics, plots, a test report | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *From a log to a report: CSV, statistics and a plot a reviewer trusts* with a runnable lab |
| pytest and reproducible testing | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **core**: new lesson *pytest for hardware tests: fixtures, parametrisation, skipping when the bench is absent* with a runnable lab |

## D. Cross-industry specialisation

### 14. Safety and standards awareness (P1)

Published: `avionics-and-automotive-standards-scope`, `medical-and-industrial-standards-scope`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| DO-178C, DO-254, DO-160, ARP4754A/4761, DAL | ✓ | ◐ | ✓ | ✓ (standards-map) | ✓ | ✓ | – | ✓ | none at scope level |
| ISO 26262, ASIL, ASPICE, AUTOSAR | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | – | ✓ | none |
| IEC 62304, 60601, ISO 13485, ISO 14971 | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | – | ◐ | second interview question is core-light |
| IEC 61508, 61511, 62443 | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | – | ◐ | same |

### 15. Applications across industries (P2)

Published: `same-skills-different-industries`.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Talking about transfer between industries | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | – | ✓ | none |
| Avionics/UAV, automotive ECU and diagnostics, medical electronics, PLC and motor control, FPGA, cameras and streaming | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | **optional** (P2 by design): one orientation lesson per domain can follow learner demand; the curriculum page should say these are optional future topics, not missing ones |

## E. Interviews and career

### 16. Engineering communication and interviews (P0)

Published: `presenting-a-portfolio-project-honestly`, `telling-a-debugging-story`; 42 interview questions with rubrics; timed mock mode.

| Topic | Theory | Prereq | Example | Diagram | Guided | Assess | Trouble | Interview | Gap and plan |
|---|---|---|---|---|---|---|---|---|---|
| Truthful responsibilities and portfolio presentation | ✓ | ◐ | ✓ | ✗ | ✓ (mock) | ✓ | – | ✓ | none |
| Project reasoning and design trade-offs | ◐ (portfolio lesson, architecture stage) | ◐ | ◐ | ✗ | ◐ | ◐ | – | ◐ | module 11 architecture lesson covers trade-offs |
| Troubleshooting stories | ✓ | ◐ | ✓ | ✗ | ✓ (mock) | ✓ | – | ✓ | none |
| Foundational coding questions (bit tricks, buffers, endianness, string to integer) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | – | ◐ | **core-light**: new lesson *Coding questions interviewers actually ask embedded candidates* with runnable labs and expected outputs |
| Notice period and pay negotiation | ✗ | – | ✗ | – | ✗ | ✗ | – | ✗ | **core-light**: new lesson *Notice period, offers and negotiation without bluffing* (text only, no numbers invented) |

## Cross-cutting findings

| Finding | Evidence | Plan |
|---|---|---|
| No lesson declares prerequisites and no screen shows them | `prerequisites` appears only in `lib/content/schema.ts`; 0 of 37 lessons set it | **Done in PR B.** All 37 lessons declare prerequisites (four deliberate starting points declare none); "Before this lesson" on the lesson page with completion state; `tests/content.test.ts` enforces existence, no cycles, and that only the starting points are empty |
| No way for a learner to find her starting level | No diagnostic; recommendations begin only after mistakes; Today starts at day 1 for everyone | **Done in PR B.** `/start`: 14 questions over the foundations, first answer counts, no score; wrong answers become the "Start here" list on Today (foundation lesson plus the topic missed), which empties as the lessons are completed; skippable; stored under the optional `diagnostic` field so old backups import unchanged (ADR-15). Questions re-point to the new foundation lessons as PRs C to F publish them |
| Runnable code and reproducible results | 9 lessons show C, C++, Python or DTS snippets; none has a run command or an expected output; nothing is verified | **Platform done in PR B.** `labs/` with 8 labs (4 lesson labs: bit masks, elapsed time across the wrap, bytes versus text, request-reply; 4 portfolio labs), `labs/manifest.json`, `scripts/sync-labs.mjs` that runs them and generates `lib/labs/generated.ts`, `tests/labs.test.ts` that rebuilds and reruns every lab in CI and diffs the output; `lab` step in the lesson player (source, command, expected output, copy buttons, "try next"); `docs/LOCAL_LAB.md`. Lab steps now in 3 lessons; the remaining labs arrive with their lessons in PRs C to G |
| Diagrams | 19 lessons have an interactive; 18 have none (fixed-width integers, RCA, bring-up, ICD, ISR handoff, bootloaders, Linux boot, serial, SIL/HIL, medical standards, transfer, portfolio, story, power tree, op-amp, schematic, datasheet, pointers, RAII, logic analyser) | Static figures (SVG) for the mechanisms that benefit most: power tree, op-amp stage, bootloader slots, queue handoff, Linux boot chain, logic-analyser timing; the prose-only communication lessons do not need one |
| "Coming soon" | One planned item (low-power modes). The Today page says "Everything else in the 16-module curriculum is listed under Learn as coming soon", which implies much more; the curriculum page says "1 are planned" | Write the low-power lesson; reword Today; make the curriculum page distinguish "planned for the next release" from "optional future topics" |
| Portfolio teaches decisions, not implementation | Stage bodies explain design decisions well; deliverables are tick boxes with evidence instructions; there is no starter code, no host harness, no step-by-step build-and-test walkthrough; the lab visual demonstrates the detection rules but the learner never runs code | **Done in PR B.** `labs/portfolio/`: `detect.h`/`detect.c` (pure detection function, TMP102 conversion), `test_detect.c` (16 checks: golden pairs, every fault boundary, the timestamp wrap, plus a deliberate failure under `--known-failure`), `sim.c` host harness printing ICD log lines, `sensor_model.py` with deterministic fault injection, `Makefile`. Stages 4, 5 and 6 carry "Build it" steps with the commands and the CI-verified outputs |
| Interview coverage is thin where lessons are thin | 1 question each for Embedded Linux, standards, applications, C++; none for the gap topics above | Each new lesson brings its interview step, as the schema requires |
| Release documentation drift | PR #11 (release record) is open; `main` still reads "awaiting authorisation" in `docs/DEVELOPMENT_STATUS.md` and the roadmap; README counts will change with the new lessons | Merge #11; this audit's PR updates the status and roadmap for the audit itself; each content PR updates counts |
