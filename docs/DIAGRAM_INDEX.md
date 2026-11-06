# Diagram index

Every teaching diagram, what it shows, and where it is used. Files live in `public/diagrams/` and are generated from `scripts/gen-diagrams.py` (edit the data there, run the script, commit the SVGs). Each SVG is 640 units wide, readable at phone width, carries a `<title>`, and switches colours for dark mode. Diagrams are added only where they make a concept easier to understand; none is decorative. "Used in" names the document and the lesson that embeds it with a `figure` step; diagrams for blueprint modules are embedded when those lessons are written. The `rtos-task-states` diagram is also embedded in `isr-to-task-handoff` until module 20.1 publishes.

## Orientation

| File | Shows | Used in |
|---|---|---|
| `pathways-map.svg` | The four pathways standing on the shared foundation modules 1 to 16, with each pathway's advanced modules and its status for the learner | FULL_CURRICULUM_MAP, CAREER_PATHWAYS |
| `study-journey.svg` | The three phases of the 30/60/90-day plan: refresh and defend, build evidence, depth, with modules and evidence per phase | FULL_CURRICULUM_MAP, STUDY_PLAN_30_60_90 |
| `system-architecture.svg` | Block architecture of the portfolio STM32 sensor monitor: sensor, conditioning, MCU, telemetry link, host, power | FULL_CURRICULUM_MAP portfolio section; portfolio stage 1 |

## Electronics fundamentals, power and signal conditioning (modules 1, 2)

| File | Shows | Used in |
|---|---|---|
| `power-tree.svg` | A power tree from a 5 V input through a buck and an LDO to loads, with the trace resistance that makes the radio's rail sag and the I × R arithmetic | Lesson `reading-a-power-tree` (pilot); topic breakdown family 4 |
| `rc-step-response.svg` | The exponential RC step response with the 63 %, 95 % and 99 % points at 1τ, 3τ, 5τ and the threshold-time and cutoff formulas | Lesson `capacitors-inductors-rc-and-filters`; family 1 |
| `mosfet-switch.svg` | An N-channel MOSFET as a low-side switch driven from a 3.3 V GPIO, with gate resistor, load and flyback diode, and the rules (full VGS, gate charge, I²R) | Lesson `diodes-and-transistors-as-switches`; family 1 |
| `logic-levels.svg` | LVTTL driver output levels (VOH, VOL) against receiver thresholds (VIH, VIL) with the two noise margins and the undefined band | Lesson `logic-levels-thresholds-and-open-drain`; family 3 |
| `adc-chain.svg` | Sensor → amplifier → anti-alias filter → ADC with its reference → code, annotated with where noise enters and the effective-bits note | Lesson `adc-resolution-reference-and-noise`; families 1, 4 |

## Microcontrollers and firmware (modules 3, 5, 7)

| File | Shows | Used in |
|---|---|---|
| `mcu-block.svg` | Inside a Cortex-M microcontroller: core, NVIC, bus matrix, flash, SRAM, clock tree, debug port, peripheral buses and peripherals | Lesson `choosing-and-reading-an-mcu`; family 5 |
| `clock-tree.svg` | HSE 8 MHz → PLL ÷8 ×336 ÷4 → 84 MHz SYSCLK → AHB ÷1, APB1 ÷2, APB2 ÷1, with the timer-clock doubling rule | Lesson `gpio-and-the-clock-tree`; family 5 |
| `interrupt-flow.svg` | Flow from a peripheral event through enable and priority checks to context save, handler and return or tail-chain | Lesson `interrupts-and-nvic-priorities`; family 5 |
| `memory-map.svg` | Flash (vector table, .text, .rodata, .data initial values) and RAM (.data, .bss, heap up, stack down) with the startup copy | Lesson `stack-heap-and-where-your-variables-live`; family 6 |
| `state-machine-debounce.svg` | Four-state debouncer (released, maybe pressed, pressed, maybe released) sampled every 5 ms with confirmation after four samples | Lesson `state-machines-that-survive-review`; family 6 |
| `ring-buffer.svg` | Eight-slot ring with head and tail, the full/empty rules, and why one writer and one reader need no lock | Lesson `a-ring-buffer-for-the-uart-driver`; family 6 |
| `boot-chain.svg` | MCU reset → startup → SystemInit → main beside Linux boot ROM → bootloader → kernel + device tree → login | Lessons `from-reset-vector-to-main`, `embedded-linux-boot-chain`; families 5, 8 |

## Communication protocols and avionics buses (modules 4, 18)

| File | Shows | Used in |
|---|---|---|
| `uart-frame.svg` | 8N1 frame for 0x4B: idle, start, eight data bits LSB first, stop, with bit-time and error notes | Lesson `uart-framing-and-baud`; family 10 |
| `spi-timing.svg` | Mode 0 timing: CS, SCK, MOSI, MISO, sampling on rising edges, MSB first | Lesson `spi-modes-and-chip-select`; family 10 |
| `i2c-transaction.svg` | An I2C write: start, 7-bit address, W, ACK, data, ACK, stop, with the SDA/SCL rule and NACK causes | Lesson `i2c-sensor-not-acknowledging`; family 10 |
| `can-frame.svg` | Classic CAN data frame fields from SOF through identifier, control, data, CRC, ACK, EOF with arbitration and error-state notes | Lesson `can-arbitration-error-frames-and-bus-off`; family 10 |
| `mil1553-word.svg` | 20-bit-time command word: sync, RT address, T/R, subaddress, word count, parity, with the 0x2C64 example | Lesson `mil-std-1553b-the-word-and-the-message`; family 11 |
| `mil1553-message.svg` | BC→RT and RT→BC message timelines with the 4–12 µs response window, ≥4 µs gap and the no-response causes | Same lesson (18.1) and 18.2; family 11 |
| `arinc429-word.svg` | 32-bit ARINC 429 word: label, SDI, data, SSM, parity, with speeds and the no-command/response note | Module 18.3 (blueprint); family 11 |

## Real time and debugging (modules 8, 20, 23)

| File | Shows | Used in |
|---|---|---|
| `rtos-task-states.svg` | Ready, Running, Blocked, Suspended and the events that move a task between them | Module 20.1 (blueprint, drafted); family 7 |
| `priority-inversion-timeline.svg` | Two timelines of H, M, L: without inheritance H waits for M's whole run; with a mutex H waits only for L's critical section | Lesson `priority-inversion` (pilot); family 7 |
| `frame-executive.svg` | 100 ms major frame of ten 10 ms minor frames with 100 Hz, 50 Hz and 10 Hz rate groups and idle time | Module 20.3 (blueprint); family 7 |
| `response-time.svg` | A worst-case response-time timeline for task C under A and B with 1 ms blocking, finishing at 14 ms, with the iterated equation | Module 20.2 (blueprint, drafted); family 7 |
| `debug-chain.svg` | GDB → probe → SWD/JTAG → debug access port → core, with breakpoint/watchpoint notes | Module 23.1 (blueprint); family 9 |
| `hardfault-decode.svg` | HardFault → HFSR → CFSR → stacked PC → map file → fix, with the imprecise-fault note | Module 23.3 (blueprint); family 9 |

## Integration, verification, benches (modules 11, 12, 17, 19, 21, 22)

| File | Shows | Used in |
|---|---|---|
| `bring-up-flow.svg` | Current limit and power → reset → clock → debugger → boot pins → peripherals, with the fix branch at each step | Lesson `board-bring-up-checklist`; family 9 |
| `rca-flow.svg` | Symptom → evidence → ranked hypotheses → discriminating experiment → cause → fix, verify, prevent, with the loop | Lesson `root-cause-analysis`; family 9 |
| `v-model-traceability.svg` | Requirements levels on the left, code at the bottom, test levels on the right, traceability both ways | Lessons `writing-a-trustworthy-test-case`, `requirements-based-testing-hlr-llr`; family 14 |
| `test-bench-automation.svg` | PC with pytest/PyVISA driving a supply, scope and multimeter and talking to the DUT over serial | Lessons `talking-to-an-instrument-with-pyvisa`, `serial-automation-and-test-logs`; family 15 |
| `do178-levels.svg` | Levels A to E against failure condition, objective count and required structural coverage | Lessons `do-178c-levels-and-objectives`, `avionics-and-automotive-standards-scope`; family 14 |
| `mcdc-pairs.svg` | Truth table of (A && B) \|\| C with each condition's independence pair and the four-test MC/DC set | Lesson `structural-coverage-and-mcdc`; family 14 |
| `redundant-channels.svg` | Triplex flight-control channels with sensors, computers, voters and actuators joined by cross-channel data links | Module 19 (blueprint); family 13 |
| `hil-architecture.svg` | Real-time target with the plant model, analogue/bus/fault-insertion I/O, device under test, host PC | Lesson `sil-hil-what-each-proves`; module 21.1; family 13 |
| `fault-injection-flow.svg` | FMEA failure mode → injected fault → expected detection → observed → verdict | Module 21.3 (blueprint); lesson `fmea-for-a-small-embedded-product`; family 13 |
| `test-framework-layers.svg` | Hardware, drivers, protocol, test cases, reporting, with configuration alongside | Module 22.5 (blueprint); family 15 |

## Control, estimation, AI, ownership (modules 24, 26 to 31)

| File | Shows | Used in |
|---|---|---|
| `control-loop-pid.svg` | Setpoint, error, PID (P now, I past, D trend), actuator, plant, sensor feedback | Module 24.2 (blueprint); family 16 |
| `kalman-loop.svg` | Predict and update as a loop fed by measurements, with Q and R and the divergence note | Module 27 (blueprint); family 17 |
| `edge-ai-pipeline.svg` | Data → baseline → train and split → quantise → deploy on a Cortex-M → monitor, with the honesty checks | Module 29 (blueprint); family 18 |
| `autonomy-stack.svg` | Sensors → perception → estimation → planning → control → actuators with a verified safety monitor that can override | Module 30 (blueprint); family 18 |
| `product-lifecycle.svg` | Need → requirements → architecture → design → build → verify → release → operate → change, with the ownership artefacts at the centre | Module 31 (blueprint); family 19 |

## Not yet drawn (specified, to add with the lesson)

| Diagram | For | Spec |
|---|---|---|
| Signal-conditioning chain with tolerances | Module 1 signal-conditioning lesson | In-amp gain stage, offset network, anti-alias filter, scaling to ADC, with a tolerance budget table beside each stage |
| KiCad flow: schematic → ERC → layout → DRC → outputs | Module 2 | Process diagram with the artefact produced at each step |
| DMA buffer ownership timeline | Module 3 / 7 DMA lesson | Half/full callbacks against a circular buffer with a late consumer overwriting |
| 1553 schedule (major/minor frames of bus messages) | Module 18.2 | Like `frame-executive` but with messages per minor frame and bus loading |
| Cross-channel link test matrix | Module 19.4 | Table of fault × expected detection × time budget |
| DPRAM handshake sequence | Module 20.4 | Sequence diagram of two processors and a flag/mailbox exchange, with the race case |
| GDB session annotated | Module 23.2 | Annotated transcript (backtrace, watchpoint hit) as a code-walkthrough visual |
