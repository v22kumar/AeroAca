# Content review log

Documented review state of every published lesson and mission, kept current at each release. Columns are generated from the content files themselves (`review.status`, reference count, exercise count, interactive id, whether simulated or illustrative material is labelled as such); the **human review** column is filled in by a named second reader and is the 1.0 gate.

Review levels:
- **author review**: written against the cited references and self-checked for arithmetic and terminology by the author (this academy's build process). Every item below has this.
- **automated checks**: schema validation, exercise answer and misconception consistency, glossary coverage, minute budgets and browser tests on every item (CI).
- **second technical reader**: a person with experience in the item's domain has read it and signed the row. **Pending for every item**; this is the open 1.0 gate.

| Kind | Slug | Title | review.status | References | Exercises | Interactive | Simulation labelled | Second reader |
|---|---|---|---|---|---|---|---|---|
| lesson | `circuit-laws-on-the-bench` | Circuit laws you use every day on the bench | technically-reviewed | 3 | 3 | divider-thevenin | yes | pending |
| lesson | `capacitors-inductors-rc-and-filters` | Capacitors, inductors, the RC time constant and the filters they make | technically-reviewed | 3 | 3 | rc-step | yes | pending |
| lesson | `diodes-and-transistors-as-switches` | Diodes and transistors as switches | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `logic-levels-thresholds-and-open-drain` | Logic levels, thresholds, open-drain and the pull-up | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `grounding-protection-and-the-first-thing-that-breaks` | Grounding, protection and the first thing that breaks | technically-reviewed | 4 | 3 | none | yes | pending |
| lesson | `the-dmm-and-the-bench-supply` | The multimeter and the bench supply: the two instruments you touch first | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `c-foundations-for-firmware` | C foundations for firmware: functions, scope, static, const, arrays and structs | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `stack-heap-and-where-your-variables-live` | Stack, heap and where your variables live | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `state-machines-that-survive-review` | State machines that survive review | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `a-ring-buffer-for-the-uart-driver` | A ring buffer for the UART driver | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `choosing-and-reading-an-mcu` | Choosing and reading an MCU: families, cores and what a part number says | technically-reviewed | 3 | 3 | none | yes | pending |
| lesson | `your-first-stm32-project` | Your first STM32 project: from CubeMX to a toggling pin, and what the generated code did | technically-reviewed | 5 | 3 | none | yes | pending |
| lesson | `gpio-and-the-clock-tree` | GPIO and the clock tree: the two configurations under every peripheral | technically-reviewed | 3 | 3 | clock-tree | yes | pending |
| lesson | `low-power-modes-and-wake-up-sources` | Low-power modes and wake-up sources | technically-reviewed | 4 | 3 | none | yes | pending |
| lesson | `adc-resolution-reference-and-noise` | ADC resolution, reference and noise | technically-reviewed | 3 | 3 | adc-quantisation | yes | pending |
| lesson | `avionics-and-automotive-standards-scope` | What DO-178C, DO-254 and ISO 26262 are for | technically-reviewed | 6 | 3 | standards-map | n/a | pending |
| lesson | `board-bring-up-checklist` | A board bring-up checklist that actually gets used | technically-reviewed | 2 | 3 | — | yes | pending |
| lesson | `bootloaders-images-and-recovery` | Bootloaders, images and recovery paths | technically-reviewed | 3 | 3 | — | n/a | pending |
| lesson | `can-arbitration-error-frames-and-bus-off` | CAN: arbitration, error frames and bus-off | technically-reviewed | 4 | 3 | can-arbitration | yes | pending |
| lesson | `datasheet-triage` | Datasheet triage: the five numbers that matter | technically-reviewed | 2 | 3 | — | yes | pending |
| lesson | `embedded-c-register-bit-masks` | Register bit masks: read, modify, write safely | technically-reviewed | 3 | 3 | register-bits | n/a | pending |
| lesson | `embedded-linux-boot-chain` | Boot chain and device tree, from bootloader to login | technically-reviewed | 3 | 3 | — | n/a | pending |
| lesson | `fixed-width-integers-overflow-shifts` | Fixed-width integers, overflow and shifts | technically-reviewed | 2 | 3 | — | n/a | pending |
| lesson | `fmea-for-a-small-embedded-product` | FMEA for a small embedded product | technically-reviewed | 3 | 3 | fmea-worksheet | yes | pending |
| lesson | `from-reset-vector-to-main` | From reset vector to main(): what startup code does | technically-reviewed | 3 | 3 | startup-sequence | yes | pending |
| lesson | `i2c-sensor-not-acknowledging` | I2C sensor not acknowledging | technically-reviewed | 3 | 3 | i2c-waveform | yes | pending |
| lesson | `interface-control-and-integration-faults` | Interface control documents and integration faults | technically-reviewed | 2 | 3 | — | n/a | pending |
| lesson | `interrupts-and-nvic-priorities` | Interrupts and NVIC priorities without surprises | technically-reviewed | 3 | 3 | nvic-priorities | yes | pending |
| lesson | `isr-to-task-handoff` | Queues vs shared buffers in ISR-to-task handoff | technically-reviewed | 2 | 3 | — | n/a | pending |
| lesson | `logic-analysers-decoding-a-bus` | Logic analysers: decoding a bus you did not design | technically-reviewed | 3 | 3 | — | n/a | pending |
| lesson | `mcu-board-does-not-boot` | MCU board does not boot | technically-reviewed | 3 | 3 | mcu-boot-chain | n/a | pending |
| lesson | `medical-and-industrial-standards-scope` | Medical and industrial standards in one page each | technically-reviewed | 5 | 3 | — | n/a | pending |
| lesson | `op-amp-sanity-checks` | Op-amp sanity checks on the bench | technically-reviewed | 2 | 3 | — | yes | pending |
| lesson | `oscilloscope-probing` | Oscilloscope probing without lying to yourself | technically-reviewed | 2 | 3 | aliasing | yes | pending |
| lesson | `pointers-to-hardware` | Pointers to hardware: structs over memory maps | technically-reviewed | 3 | 3 | — | n/a | pending |
| lesson | `polling-interrupts-and-dma` | Polling, interrupts and DMA: choosing the driver model | technically-reviewed | 3 | 3 | pwm-timer | n/a | pending |
| lesson | `presenting-a-portfolio-project-honestly` | Presenting a portfolio project without inflating it | technically-reviewed | 2 | 3 | — | yes | pending |
| lesson | `priority-inversion` | Why the high-priority task starved: priority inversion (2.0 format, pilot) | technically-reviewed | 3 | 4 | priority-inversion | yes | pending |
| lesson | `mil-std-1553b-the-word-and-the-message` | MIL-STD-1553B: the word and the message (2.0 format, pilot) | technically-reviewed | 3 | 4 | mil1553-word | yes | pending |
| lesson | `raii-for-peripherals` | RAII for peripherals and critical sections | technically-reviewed | 3 | 3 | — | n/a | pending |
| lesson | `reading-a-power-tree` | Reading a power tree: regulators, rails and decoupling (2.0 format, pilot) | technically-reviewed | 3 | 5 | rail-sag | yes | pending |
| lesson | `reading-a-schematic-like-a-reviewer` | Reading a schematic like a reviewer | technically-reviewed | 3 | 3 | — | n/a | pending |
| lesson | `root-cause-analysis` | Root-cause analysis and the five whys that matter | technically-reviewed | 2 | 3 | — | n/a | pending |
| lesson | `same-skills-different-industries` | Same skills, different industries: how to talk about transfer | technically-reviewed | 2 | 3 | — | yes | pending |
| lesson | `serial-automation-and-test-logs` | Serial communication and test logs in Python | technically-reviewed | 2 | 3 | — | n/a | pending |
| lesson | `sil-hil-what-each-proves` | SIL, HIL and what each one proves | technically-reviewed | 2 | 3 | — | yes | pending |
| lesson | `spi-modes-and-chip-select` | SPI modes, chip select and the first byte of garbage | technically-reviewed | 2 | 3 | spi-modes | yes | pending |
| lesson | `talking-to-an-instrument-with-pyvisa` | Talking to a bench instrument with PyVISA | technically-reviewed | 4 | 3 | scpi-console | yes | pending |
| lesson | `telling-a-debugging-story` | Telling a debugging story: evidence, decision, outcome | technically-reviewed | 2 | 3 | — | yes | pending |
| lesson | `uart-framing-and-baud` | UART framing and baud tolerance | technically-reviewed | 2 | 3 | uart-frame | yes | pending |
| lesson | `watchdogs-and-reset-loops` | Watchdogs and reset loops | technically-reviewed | 2 | 3 | iwdg-timeout | yes | pending |
| lesson | `writing-a-trustworthy-test-case` | Writing a test case that a reviewer can trust | technically-reviewed | 2 | 3 | traceability | yes | pending |
| mission | `fresh-board-no-sign-of-life` | Fresh board, no sign of life | n/a | 2 | — | — | yes | pending |
| mission | `the-board-that-resets-every-second` | The board that resets every second | n/a | 2 | — | — | yes | pending |
| mission | `the-flaky-automated-test` | The flaky automated test | n/a | 1 | — | — | yes | pending |
| mission | `the-rail-that-sags` | The rail that sags | n/a | 1 | — | — | yes | pending |
| mission | `the-requirement-nobody-could-test` | The requirement nobody could test | n/a | 1 | — | — | yes | pending |
| mission | `the-schematic-that-almost-shipped` | The schematic that almost shipped | n/a | 1 | — | — | yes | pending |
| mission | `the-sensor-that-never-answers` | The sensor that never answers | n/a | 2 | — | — | yes | pending |
| mission | `the-task-that-never-runs` | The task that never runs | n/a | 2 | — | — | yes | pending |
| mission | `the-uart-that-prints-garbage` | The UART that prints garbage | n/a | 2 | — | — | yes | pending |
| mission | `two-boards-one-bus-no-agreement` | Two boards, one bus, no agreement | n/a | 1 | — | — | yes | pending |
| lesson | `mil-std-1553b-controller-terminals-and-faults` | 1553 on a real rig: the schedule, the load and reading a monitor log (2.0 format) | technically-reviewed | 3 | 5 | mil1553 figure, py-mon1553 lab | yes | pending |
| lesson | `arinc-429-words-labels-and-ssm` | ARINC 429: one talker, a 32-bit word, and a field that says whether to believe it (2.0 format) | technically-reviewed | 3 | 5 | arinc429 figure, py-a429 lab | yes | pending |
| lesson | `rs-422-rs-485-and-framed-serial-with-crc` | RS-422 and RS-485: differential links, termination, and frames you can trust (2.0 format) | technically-reviewed | 4 | 4 | c-crc16 lab | yes | pending |
| lesson | `telemetry-packets-and-parsing-with-struct` | Telemetry packets: design the frame, then parse it so that nothing is silently lost (2.0 format) | technically-reviewed | 3 | 5 | py-telemetry lab | yes | pending |
| lesson | `do-178c-levels-and-objectives` | DO-178C: what a software level really changes | technically-reviewed | 4 | 5 | figure (do178-levels) | yes | pending |
| lesson | `requirements-based-testing-hlr-llr` | Requirements-based testing: HLR, LLR, normal-range and robustness | technically-reviewed | 3 | 3 + 1 ordering | figure (v-model), walkthrough | yes | pending |
| lesson | `structural-coverage-and-mcdc` | Structural coverage and MC/DC | technically-reviewed | 3 | 4 | figure (mcdc-pairs), lab c-mcdc | yes | pending |
| lesson | `traceability-problem-reports-and-change-impact` | Traceability, problem reports and change impact | technically-reviewed | 3 | 3 | traceability visual | yes | pending |
| lesson | `why-flight-control-is-redundant` | Why flight control is redundant | technically-reviewed | 4 | 4 | figure (redundant-channels) | yes | pending |
| lesson | `voting-monitors-and-failover` | Voting, monitors and failover | technically-reviewed | 3 | 3 | lab c-voter, walkthrough | yes | pending |
| lesson | `testing-a-cross-channel-link` | Testing a cross-channel link | technically-reviewed | 3 | 3 | figure (fault-injection-flow), lab py-fault-inject | yes | pending |
| lesson | `tasks-the-scheduler-and-the-tick` | Tasks, the scheduler and the tick | technically-reviewed | 3 | 3 | figure (rtos-task-states), lab c-sched, walkthrough | yes | pending |
| lesson | `will-it-meet-its-deadline` | Will it meet its deadline? Utilisation, response time and blocking | technically-reviewed | 3 | 4 | figure (response-time), walkthrough, lab c-sched | yes | pending |
| lesson | `frame-based-executives-and-overruns` | Frame-based executives: minor frames, rate groups and the frame that overran | technically-reviewed | 3 | 4 | figure (frame-executive), walkthrough, lab c-frame-exec | yes | pending |
| lesson | `shared-memory-dpram-handshakes` | Shared memory between processors: torn reads and the sequence-counter handshake | technically-reviewed | 3 | 3 | walkthrough, lab c-dpram | yes | pending |
| lesson | `measuring-wcet-and-jitter` | Measuring worst-case time and jitter on the target | technically-reviewed | 3 | 4 | walkthrough | no | pending |
| lesson | `deadlock-and-lock-ordering` | Deadlock and lock ordering: two tasks, two locks, no way out | technically-reviewed | 4 | 3 | walkthrough | no | pending |
| lesson | `hil-architecture-and-bench-design` | HIL architecture and bench design | technically-reviewed | 4 | 3 + 1 numeric | figures (hil-architecture, test-bench-automation) | yes | pending |
| lesson | `from-fmea-to-fault-injection` | From an FMEA to fault injection | technically-reviewed | 4 | 3 + 1 numeric | figure (fault-injection-flow), lab py-fault-inject | yes | pending |
| lesson | `logs-to-evidence` | From logs to evidence | technically-reviewed | 3 | 3 + 1 numeric | walkthrough, lab py-log-report | yes | pending |
| lesson | `pytest-for-hardware-tests` | pytest for hardware tests | technically-reviewed | 3 | 4 | walkthroughs (code shown, not run in CI; no lab) | yes | pending |
| lesson | `architecture-of-a-test-framework` | The architecture of a test framework | technically-reviewed | 3 | 4 + 1 numeric | figure (test-framework-layers), lab py-bench-framework | yes | pending |
| lesson | `debug-probe-and-gdb-on-target` | The debug probe and GDB: stopping the chip instead of printing at it | technically-reviewed | 4 | 3 | figure (debug-chain), walkthrough (illustrative GDB session, not captured) | no | pending |
| lesson | `hardfault-analysis` | HardFault analysis: from a stopped core to the line that caused it | technically-reviewed | 4 | 3 | figure (hardfault-decode), walkthrough, lab c-fault-decode (synthetic captures) | yes | pending |
| lesson | `building-a-frame-parser-and-breaking-it` | A frame parser in C, and the two bugs that only a careful test finds | technically-reviewed | 4 | 3 | walkthrough, labs c-frame, c-frame-known-failure-a, c-frame-known-failure-b | yes | pending |
| lesson | `control-loop-and-pid` | The control loop and PID without mystery | technically-reviewed | 3 | 3 | figure (control-loop-pid), walkthrough, lab py-pid (simulation) | yes | pending |
| lesson | `career-gap-contract-and-ownership` | The gap, the short contract, and 'what did you own?' | technically-reviewed | 3 | 4 | walkthrough | yes | pending |
| lesson | `claims-metrics-and-negotiation` | Claims, metrics and negotiation: say only what you can back up | technically-reviewed | 3 | 5 | walkthrough | no | pending |

## Items the second reader should look at first

- Standards lessons (`avionics-and-automotive-standards-scope`, `medical-and-industrial-standards-scope`): scope-level statements about DO-178C coverage objectives, ISO 26262 ASIL derivation, IEC 61508 PFD bands and IEC 62304 classes should be read by someone who has worked under each.
- CAN lesson: error-counter arithmetic and recovery rule (ISO 11898-1).
- NVIC lesson: grouping and the FreeRTOS syscall-priority rule for the reader's own part family.
- ADC lesson: sample-time guidance is STM32-specific (AN2834); other families differ.
- PyVISA/SCPI lesson and console: the SCPI dialect is Keysight-style; other vendors spell commands differently.
- Every mission: the simulated readings are labelled as such in the scenario; the reader should confirm the numbers are plausible for the described hardware.

## How to record a review

Add the reader's initials and date in the last column (for example `JD 2026-11-20`) and, if changes were needed, a one-line note. Content changes go through the normal PR process; the row is updated in the same PR.
