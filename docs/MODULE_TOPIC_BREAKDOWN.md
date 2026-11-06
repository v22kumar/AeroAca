# Module topic breakdown: every major subject, topic by topic, at three depths

The explicit topic list behind the [full curriculum map](FULL_CURRICULUM_MAP.md). For each subject family, every topic has:

- **Understand**: the one-sentence intuition, written so it can be read alone by a tired engineer on a phone.
- **Apply**: what you do with it at work (calculate, code, measure, decide).
- **Master**: the failure mode, limit or trade-off that separates knowing from owning.
- **Where**: the module and, when published, the lesson or lab; otherwise "blueprint". Nothing marked blueprint is playable yet.

Abbreviations are expanded the first time they appear in each family. Diagrams named here are in [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md).

## 1. Electronics fundamentals (module 1)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Ohm's law, KCL, KVL | Current is what flows, voltage is what pushes it, resistance is what resists; what flows into a node flows out, and the drops around any loop add up to the source. | Compute every current and drop in a two-loop circuit; size a series resistor for an LED with margin. | Where KCL seems to fail (hidden paths, leakage) and why a measured node disagrees with the calculation by exactly the meter's burden. | 1: `circuit-laws-on-the-bench`; lab `py-divider` |
| Voltage divider and Thévenin | Two resistors split a voltage in proportion; any network seen from two terminals behaves like one source and one resistor. | Design a divider for an ADC input; compute the loading error when the ADC's input resistance is finite. | Thévenin resistance sets settling time with the ADC's sample capacitor; when a divider must be buffered. | 1: `circuit-laws-on-the-bench`; interactive divider-thevenin |
| Capacitors, RC time constant | A capacitor stores charge and resists sudden voltage change; after one time constant it has covered 63 % of the way. | Compute τ = RC, the time to reach a threshold, the cutoff of an RC filter; debounce a button in hardware. | Tolerances and leakage make τ a range; ESR and dielectric type matter at frequency; an RC filter's phase shift matters in a control loop. | 1: `capacitors-inductors-rc-and-filters`; lab `py-rc`; interactive rc-step |
| Inductors and basic filters | An inductor resists sudden current change; with a capacitor it makes a filter that passes some frequencies and blocks others. | Compute a first-order cutoff; choose a filter order for an anti-alias requirement; read a Bode plot. | Component Q and parasitics; why a buck's inductor saturates; a filter's group delay in a sampled loop. | 1: same lesson; deepening blueprint |
| Diodes and transistors as switches | A diode lets current one way with a small toll; a transistor is a switch controlled by a small signal. | Choose a MOSFET for a load, compute gate drive and dissipation; add a flyback diode to an inductive load. | Threshold voltage is not the on voltage; gate charge and switching loss; body diode; thermal runaway in a BJT. | 1: `diodes-and-transistors-as-switches` |
| Logic levels, thresholds, open-drain | A pin is "high" only above a threshold and "low" only below one; in between is undefined; open-drain pins can only pull down. | Compute noise margin between two parts; size a pull-up for speed and current; mix 3.3 V and 5 V parts safely. | Negative noise margin that works at room temperature; 5 V-tolerant pins; bus contention from two drivers. | 1: `logic-levels-thresholds-and-open-drain` |
| Power trees and regulators | Every board is a tree of voltages made by regulators; a regulator holds its own pin, not the far end of the wire. | Read a tree top-down: type, headroom, dissipation, budget, sequencing; compute an LDO's heat. | Load transients and output-capacitor stability; brown-out behaviour; sequencing arrows nobody drew. | 1: `reading-a-power-tree` (2.0 format); interactive rail-sag; diagram power-tree |
| Decoupling and bulk capacitance | Small capacitors at each pin feed nanosecond spikes; big ones at the load feed millisecond bursts. | Place 100 nF per supply pin; size bulk at a bursty load; check the regulator's stable range. | Distance equals inductance; ESR and stability; inrush from large capacitance. | 1: same lesson |
| Op-amp sanity checks | An op-amp drives its output until its two inputs match, if it can. | Check gain, rail headroom, offset and bandwidth against the requirement; spot a saturated stage. | Stability with capacitive loads; input bias current in high-impedance sources; rail-to-rail is not quite. | 1: `op-amp-sanity-checks` |
| ADC resolution, reference, noise | An ADC turns a voltage into a count; the reference sets what one count means; noise sets how many counts are real. | Compute LSB size, count for a voltage, effective bits from measured noise; average to gain bits. | Reference noise and drift dominate; sample time versus source impedance; aliasing of noise into band. | 1: `adc-resolution-reference-and-noise`; interactive adc-quantisation; diagram adc-chain |
| Grounding, protection, ESD | Current returns to where it came from, through the path you built or the one you did not; protection parts take the hit so the chip does not. | Add TVS and series resistance to an exposed line; route a single return; add reverse-polarity protection. | Ground shift between boards; TVS clamping voltage versus the pin's rating; protection that slows a signal. | 1: `grounding-protection-and-the-first-thing-that-breaks` |
| Signal conditioning end to end | A sensor's tiny or offset signal is scaled, shifted and filtered to fit the ADC. | Design an instrumentation-amplifier stage, an anti-alias filter and a scaling network with a tolerance budget. | Common-mode range, CMRR, offset drift over temperature, saturation at the edges of the range. | 1: blueprint (P0-4a) |
| Combinational and sequential logic timing | Logic gates decide now; flip-flops remember on a clock edge; both take time. | Read setup and hold; compute a maximum clock from propagation delays; debounce in logic. | Metastability on asynchronous inputs; glitches on combinational outputs; clock-domain crossing. | 1: blueprint (P0-4a) |
| Calibration | Measuring a known thing to correct what the instrument reports. | Two-point and multi-point calibration; store coefficients; verify against a held-out point. | Drift, hysteresis, over-fitting a curve to few points; when to recalibrate. | 1/11: blueprint (P0-5) |

## 2. Circuit design, schematics and PCB (module 2)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Schematic reading and review | A schematic is a claim about how parts connect; reviewing it is checking the claim against the datasheets and the use. | Produce a findings list: floating pins, missing pull-ups, level boundaries, decoupling, sequencing. | Reviewing for what is absent (test points, protection, debug access); ranking findings by consequence. | 2: `reading-a-schematic-like-a-reviewer`; mission "The schematic that almost shipped" |
| Datasheet triage | A datasheet has five numbers that matter for your use and two hundred that do not. | Find absolute maximums, recommended operating conditions, timing, power, package; read the typical-versus-maximum trap. | Conditions under which a parameter is specified; errata; lifecycle status. | 2: `datasheet-triage` |
| Component selection | Choosing a part is choosing its tolerances, package, availability and the mistakes it makes easy. | Select a regulator, a MOSFET, a connector for a requirement with a short justification each. | Second sourcing, lead time, derating, obsolescence. | 2: blueprint (P0-4a) |
| Schematic capture in KiCad | Drawing the circuit in a tool that checks it. | Capture a sensor interface with ERC clean, net names, power flags, a BOM. | Hierarchical sheets, library hygiene, symbols that lie. | 2: blueprint (P0-4a) |
| PCB layout, stack-up, returns | Copper has resistance and inductance; every signal's current returns beneath it. | Lay out a two-layer board: decoupling at pins, short returns, no split under a signal. | Return-path discontinuities at slots and connectors; via inductance; thermal relief versus heat. | 2: blueprint (P0-4b) |
| Signal integrity and termination | A fast edge on a long trace reflects unless the far end looks like the trace. | Terminate a clock or bus line; estimate when a trace is "long" for an edge. | Series versus parallel termination trade-offs; crosstalk; measured versus simulated SI. | 2: blueprint (P0-4b) |
| EMI/EMC pre-compliance | Everything radiates a little; the standards say how much is too much and how to test. | Identify likely emitters (switchers, clocks), add filtering, plan a pre-compliance scan. | Common-mode currents on cables; a filter that helps emissions and hurts susceptibility. | 2: blueprint (P0-4b) |
| DFM, DFT and production test | A board must be buildable by a machine and testable by a jig. | Add test points, fiducials, keep-outs; plan a production-test flow; produce Gerbers, drill, BOM, pick-and-place. | Test coverage of a jig; what a failed board teaches the design. | 2: blueprint (P0-4b) |
| LTspice and simulation validity | A simulation is a model answering the question you asked, not the board. | Sweep an RC, an op-amp stage, a switch; compare with hand calculation. | Model limits (ideal sources, missing parasitics); when simulation and measurement disagree, which to trust. | 2: blueprint (P0-4a) |

## 3. Analog and digital electronics (modules 1, 2; shared)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Amplifier topologies | Inverting, non-inverting and difference amplifiers each move and scale a signal in a specific way. | Choose and compute gain and offset for a sensor; check input range. | Noise gain versus signal gain; input impedance consequences; precision versus speed. | 1: `op-amp-sanity-checks`; deepening blueprint |
| Comparators and hysteresis | A comparator says bigger or smaller; hysteresis stops it chattering at the boundary. | Design a threshold detector with hysteresis; use a Schmitt input. | Response time, input offset, oscillation with slow inputs. | 1: blueprint (part of signal conditioning) |
| DAC and PWM as a DAC | A DAC makes a voltage from a number; a PWM output filtered by an RC approximates one. | Choose PWM frequency and filter for a required ripple and settling time. | Resolution versus update rate; non-linearity; glitch energy. | 1/3: partly in `polling-interrupts-and-dma`; blueprint |
| Digital logic families and interfacing | Different families have different voltages, speeds and drive. | Interface 1.8 V, 3.3 V and 5 V parts; choose a level shifter. | Bidirectional shifting; auto-direction shifters on I2C; drive strength and slew. | 1: `logic-levels-thresholds-and-open-drain`; blueprint for shifters |
| Timing diagrams | A timing diagram is the contract between two parts drawn in time. | Read setup, hold, propagation, enable timings from a datasheet; check a bus against them. | Worst-case corners; clock skew; what a violated hold time looks like on a scope. | 4, 10: interactives uart-frame, spi-modes; diagram spi-timing |
| Noise and interference | Unwanted signals get in through wires, fields and shared returns. | Identify conducted versus radiated paths; add filtering and shielding where each works. | Ground loops; common-mode versus differential noise; why twisting helps. | 1: grounding lesson; 2 blueprint |

## 4. Power and signal conditioning (modules 1, 2, 11; shared)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Linear versus switching regulators | A linear regulator burns the difference as heat; a switcher moves energy through an inductor. | Choose by efficiency, noise, cost; compute dissipation and junction temperature. | PSRR versus frequency; switching ripple reaching analogue rails; light-load behaviour. | 1: `reading-a-power-tree` |
| Headroom and dropout | A linear regulator needs its input above its output by a margin or it stops regulating. | Write the minimum input beside each regulator; check against the battery's sag. | Dropout rising with current and temperature; brown-out thresholds. | 1: same |
| Load transients and stability | When the load steps, the regulator's control loop takes time; the output dips or overshoots. | Check output capacitance and ESR against the datasheet's stable range. | Oscillation at light load with low-ESR ceramics; inrush at power-up. | 1: same lesson, Master steps |
| Rail sag and measurement | Copper drops voltage under current; measure at the load, under load, with a scope. | Compute I × R sag; add bulk capacitance at the load; widen the trace. | Why a multimeter hides a 20 ms dip; sequencing of multiple rails. | 1: same; interactive rail-sag |
| Power budgets and sequencing | Every rail has a budget and some must come up in order. | Sum loads including bursts against source capability; draw sequencing arrows and power-good signals. | Inrush and current limits; brown-out during a burst train; enable pins driven from power-good. | 1: same; 11 blueprint |
| Sensor front ends | A sensor's signal must be amplified, offset, filtered and protected before the ADC. | Design the chain with a tolerance budget; choose reference and anti-alias filter. | Saturation at range edges; temperature drift; common-mode range of an in-amp. | 1: blueprint (P0-4a) |
| Protection: TVS, fuses, reverse polarity | Parts placed to absorb what the circuit cannot. | Choose TVS clamping voltage and energy; add a fuse or eFuse; reverse-polarity MOSFET. | Clamping voltage above the pin rating; leakage; protection that filters the signal you need. | 1: grounding and protection lesson |
| Thermal budgets | Heat has to go somewhere; a package has a thermal resistance to air. | Compute junction temperature from dissipation and θJA; derate. | Board copper as heatsink; airflow; thermal runaway. | 1: power-tree lesson, Apply step |

## 5. ARM and STM32 (module 3; shared with 7, 23)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| MCU, MPU, SoC; Cortex-M/R/A | An MCU is a complete small computer on a chip; the Cortex letters say what it is for (M: control, R: real-time, A: applications). | Pick a family and read a part number (core, flash, pins, temperature). | Trade-offs: MCU with RTOS versus MPU with Linux; lifecycle and second sources. | 3: `choosing-and-reading-an-mcu` |
| Power, reset, clock, boot order | A dead board is checked in that order because each depends on the previous. | Measure rails, reset line, oscillator, boot pins; read the reset-cause register. | Boards that run only with the debugger attached; brown-out resets; option bytes. | 3: `mcu-board-does-not-boot`; missions; diagram bring-up-flow |
| First STM32 project | The code generator writes startup, clock and pin setup; knowing what it wrote is the lesson. | Build, flash and toggle a pin; read the generated clock and GPIO configuration. | Doing it once without the generator; what the HAL hides. | 3: `your-first-stm32-project` |
| GPIO and the clock tree | Every peripheral needs a clock and every pin needs a mode; both are register bits. | Configure MODER, OTYPER, PUPDR, AFR; walk HSE → PLL → AHB/APB to 84 MHz; apply the timer-doubling rule. | Peripheral clock enable forgotten; PLL limits; flash wait states at speed. | 3: `gpio-and-the-clock-tree`; interactive clock-tree; diagram clock-tree |
| Interrupts and NVIC priorities | An interrupt pauses the main program for a handler; a lower number is a higher priority on the NVIC. | Set group and sub-priorities; keep FreeRTOS syscall interrupts below the configured limit; write a short handler. | Nested interrupts; shared data with the main loop; latency and jitter; tail chaining. | 3: `interrupts-and-nvic-priorities`; interactive nvic-priorities; diagram interrupt-flow |
| Timers, PWM, input capture | A timer counts clocks; compare registers make PWM; capture registers timestamp edges. | Compute prescaler and period for a frequency; set duty; measure a pulse width. | Non-integer prescalers; update events; dead time; timer synchronisation. | 3: interactive pwm-timer in `polling-interrupts-and-dma`; implementation lab blueprint (P0-2a) |
| DMA and buffer ownership | DMA moves data without the processor; someone must own each buffer at each moment. | Set up circular DMA for a UART or ADC; handle half and full callbacks. | Late consumer overwriting; cache coherency on larger cores; DMA with a ring buffer. | 7: `polling-interrupts-and-dma`; lab blueprint (P0-2a) |
| Watchdogs and reset diagnosis | A watchdog resets the chip unless fed; the reset-cause register says why you are here. | Choose timeout and feeding point; log reset cause at boot; design a safe state. | Windowed watchdogs; feeding from the wrong task; a reset loop that hides a fault. | 3: `watchdogs-and-reset-loops`; interactive iwdg-timeout |
| Low-power modes and wake-up | Stop the clocks you do not need; something must wake you. | Choose sleep/stop/standby; configure a wake-up source; measure current. | Peripherals that keep drawing; wake-up latency; debugger keeping the core awake. | 3: `low-power-modes-and-wake-up-sources` |
| Cortex-M exception model, fault registers | Faults are exceptions with registers that say what went wrong and where. | Read CFSR/HFSR and the stacked PC to the faulting instruction. | Imprecise faults; stack overflow symptoms; fault escalation. | 23: blueprint (P0-1b); diagram hardfault-decode |
| Memory map and sections | Flash, RAM and peripherals live at addresses; the linker places code and data. | Read a map file; find where a variable lives; size the stack from the high-water mark. | Linker scripts; relocations; what overflows into what. | 5: `stack-heap-and-where-your-variables-live`; lab `c-memory`; diagram memory-map |

## 6. Embedded C and C++ (modules 5, 6)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Register bit masks and read-modify-write | A register is a row of switches; set, clear and toggle one without touching the others. | Use masks, shifts and field macros; write a field safely. | The read-modify-write hazard with interrupts; atomic alternatives (bit-banding, BSRR). | 5: `embedded-c-register-bit-masks`; lab `c-bits`; interactive register-bits, rmw-hazard |
| Functions, scope, static, const | Where a name is visible and how long it lives decide what can go wrong. | Use `static` for file scope and persistence; `const` for data that must not change; split headers and sources. | Linkage and one-definition errors; `const` on pointers two ways; initialisation order. | 5: `c-foundations-for-firmware`; lab `c-functions` |
| Fixed-width integers, overflow, shifts | `uint32_t` wraps at a known place; signed overflow is undefined; shifts have rules. | Compute elapsed time across wrap; use unsigned arithmetic for counters; mask before shift. | Promotion rules; shifting a negative value; the 49-day bug. | 5: `fixed-width-integers-overflow-shifts`; lab `c-elapsed` |
| Pointers to hardware and volatile | A peripheral is a struct at an address; `volatile` tells the compiler every access matters. | Overlay a struct on a memory map; access registers through a volatile pointer. | What `volatile` does not do (atomicity); compiler reordering; memory barriers. | 5: `pointers-to-hardware`; interactive struct overlay |
| Stack, heap, sections | Automatic variables live on the stack, globals in .data/.bss, dynamic memory on the heap, constants in flash. | Size the stack from a high-water mark; avoid the heap after start-up. | Stack overflow symptoms; fragmentation; static pools. | 5: `stack-heap-and-where-your-variables-live`; lab `c-memory` |
| Structs, packing, endianness, alignment | A struct's size depends on alignment; bytes have an order on the wire. | Compute struct size with padding; pack a frame; swap byte order. | Unaligned access faults; packed structs and performance; portable serialisation. | 5: `pointers-to-hardware`, struct-size exercise; frame-packing lab blueprint |
| State machines | A state machine is a list of states and the events that move between them, with no waiting inside. | Design and implement a non-blocking debouncer or protocol parser with a transition table. | Unreachable states; event queues; hierarchical machines. | 5: `state-machines-that-survive-review`; lab `c-debounce`; diagram state-machine-debounce |
| Ring buffers and concurrency | A circular queue where a producer and consumer never need to wait for each other if the rules are kept. | Implement head/tail indices with one writer and one reader; test full/empty. | Index atomicity; compiler ordering; two writers; power-of-two sizes. | 5: `a-ring-buffer-for-the-uart-driver`; lab `c-ring`; diagram ring-buffer |
| Unit testing C without a framework | A test is a function that checks a claim and fails loudly. | Write a `CHECK` macro, a counter and a non-zero exit; test every sentence of a contract. | Negative tests that prove the harness catches defects; test seams and fakes. | 5: blueprint P0-1a (frame parser) |
| Build, Make/CMake, Git, CI for firmware | One command builds from a clean checkout; version control records why. | Write a Makefile; branch, review, tag; run tests in CI. | Reproducible builds and tool versions; cross-compiling in CI without a board. | 5/7/9: blueprint (P0-1a, P0-1b) |
| Defensive C, static analysis, MISRA awareness | Some C is legal and dangerous; tools and rules catch the known traps. | Enable warnings, sanitizers and a static analyser; fix what they find. | MISRA as awareness, not compliance; rules that cost more than they save. | 5: blueprint (P0-1b) |
| C++ RAII and ownership | An object acquires a resource when created and releases it when destroyed, whatever the exit path. | Guard a critical section or a peripheral with a scoped object. | Exceptions and heap policy on a microcontroller; destructors that must not fail. | 6: `raii-for-peripherals` |
| C++ classes, interfaces, templates | Classes group data and behaviour; interfaces let drivers be swapped; templates do it at compile time. | Write a driver interface; test with a mock; compare virtual dispatch and templates. | Code size, indirect calls, RTTI; what to forbid in firmware. | 6: blueprint (P1-1) |

## 7. RTOS and real-time systems (modules 8, 20)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Tasks, states, the scheduler, the tick | A task is a function with its own stack and priority; the scheduler runs the highest-priority ready one; the tick is the heartbeat. | Create tasks with measured stacks and rate-monotonic priorities; block with delays and notifications. | Polling tasks that starve others; context-switch cost; tickless idle. | 8/20: blueprint 20.1 (drafted); lab `c-sched` (verified); diagram rtos-task-states |
| Queues, semaphores, notifications, mutexes | Ways for tasks and interrupts to hand things to each other safely. | Hand data from an ISR to a task with a queue; signal with a notification; protect with a mutex. | Torn reads with shared buffers; FromISR rules; queue sizing. | 8: `isr-to-task-handoff` |
| Priority inversion, inheritance, ceiling | A high task waits on a low one because a middle one keeps the low one from finishing. | Bound the wait with and without inheritance; use a mutex, not a binary semaphore, as a lock. | What inheritance does not fix: deadlock, chains, interrupts; ceiling trade-offs. | 8: `priority-inversion` (2.0 format); diagram priority-inversion-timeline |
| Deadlock and lock ordering | Two tasks each hold what the other needs. | Impose a lock order; use timeouts as detection, not cure. | Ceiling protocol as prevention; lock-free alternatives. | 20: blueprint 20.6 |
| Utilisation and response-time analysis | Add up each task's share of the processor; then compute the worst time from release to finish, including who can interrupt and who can block. | Apply the rate-monotonic bound; iterate the response-time equation with a blocking term. | Interrupts as top-priority tasks; release jitter; why average load proves nothing. | 20: blueprint 20.2 (drafted); diagram response-time |
| Frame-based executives | Many flight computers run a fixed schedule of minor frames inside a major frame instead of a preemptive RTOS. | Allocate rate groups to frames; detect an overrun. | Overrun policies; mixing an executive with interrupts; determinism arguments. | 20: blueprint 20.3; diagram frame-executive |
| Shared memory and DPRAM handshakes | Two processors share a memory; flags and mailboxes say who may write when. | Implement producer/consumer with sequence flags; measure latency. | Races from flag order; cache and ordering; dual-port arbitration. | 20: blueprint 20.4 |
| WCET and jitter measurement | The longest a task ever takes, measured, with margin. | Toggle a GPIO around a task and scope it; use cycle counters; build a margin table. | Data-dependent paths; cache effects; measuring the maximum, not the typical. | 20: blueprint 20.5 |
| Xenomai, PREEMPT_RT, bare RTOS | Three ways to get bounded latency: a co-kernel beside Linux, a patched Linux kernel, or no Linux. | Place each on a latency and complexity scale; choose for a requirement. | What "real-time Linux" does not promise; when to drop to a microcontroller. | 20: blueprint 20.6; 9 |

## 8. Embedded Linux (module 9)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Boot chain and device tree | Bootloader loads the kernel; the device tree tells the kernel what hardware exists. | Trace boot messages; change a device-tree node and see the driver bind. | Secure boot; overlays; a wrong compatible string. | 9: `embedded-linux-boot-chain`; diagram boot-chain |
| Shell, processes, logs | The shell is how you ask the system questions; processes are what runs; logs are what it says. | Find a process, read `dmesg` and journal, use `strace` once. | Signals, zombies, log rotation that hides evidence. | 9: blueprint (P1-1) |
| BSP and cross-build | The board support package is everything that makes a kernel run on this board; you build it on a PC for the board. | Cross-compile an application; understand the sysroot. | Reproducible BSP builds; kernel configuration debt. | 9: blueprint (P1-1) |
| User-space drivers | Talk to hardware through files the kernel exposes (sysfs, i2c-dev, spidev, GPIO character device). | Read a sensor on i2c-dev from Python or C. | When user space is too slow or too unsafe; permissions. | 9: blueprint (P1-1) |
| Kernel driver fundamentals | A kernel module that the kernel calls when the device appears. | Read a minimal module skeleton; load and unload it in an emulator. | Concurrency inside the kernel; what a crash in kernel space costs. | 9: blueprint (P1-1) |
| Real-time on Linux | See family 7, last row. | | | 20/9 |

## 9. Debugging and instrumentation (modules 10, 23)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Multimeter and bench supply | The two instruments you touch first; both can lie if used carelessly. | Choose range and mode; understand burden voltage in current mode; set current limits before power-up. | Averaging hides dips; input impedance loading; floating supplies. | 10: `the-dmm-and-the-bench-supply` |
| Oscilloscope probing | A scope shows voltage against time; the probe is part of the circuit. | Choose 1×/10×, ground near the signal, set bandwidth and trigger; avoid aliasing. | Probe loading on fast edges; ground-lead inductance; differential probing for floating signals. | 10: `oscilloscope-probing`; interactive aliasing |
| Logic analysers and protocol decode | Many digital channels timestamped and decoded. | Decode a bus you did not design; find a wrong baud or a missing ACK. | Sample rate versus edge rate; what the decoder assumes. | 10: `logic-analysers-decoding-a-bus` |
| DAQ sampling and reporting | Sample, store, report, with settings and uncertainty recorded. | Capture with a USB DAQ or the MCU; state sample rate and resolution; report with uncertainty. | Anti-aliasing before the DAQ; synchronisation across channels. | 10/13: blueprint (P0-5) |
| Root-cause analysis | Ask why until you reach something you can change and verify. | Build a fault tree from evidence; design the discriminating experiment; verify the fix removes the cause. | Intermittent faults; multiple causes; confirmation bias. | 10: `root-cause-analysis`; diagram rca-flow |
| Bring-up order | Power, reset, clock, debug, peripherals, in that order. | Run the checklist on a new board with a current limit set. | Boards that pass each step and fail together; thermal and timing margins. | 11: `board-bring-up-checklist`; diagram bring-up-flow |
| The debug probe (SWD/JTAG) | A small box that talks to the core's debug port so your PC can stop, read and write it. | Flash and attach with ST-Link or J-Link; know what SWDIO/SWCLK are. | What the probe cannot see (peripheral state while halted); debug authentication. | 23: blueprint 23.1; diagram debug-chain |
| GDB on target | Breakpoints stop; watchpoints stop on a data change; the stack tells you how you got there. | Step through an ISR; read a peripheral register; unwind a stack. | Optimised code and missing variables; watchpoint limits; semihosting cost. | 23: blueprint 23.2 |
| HardFault analysis | Fault registers and the stacked return address point at the line. | Decode CFSR/HFSR; find the faulting instruction; fix. | Imprecise faults; faults from stack overflow; fault handlers that fault. | 23: blueprint 23.3; lab `c-fault-decode`; diagram hardfault-decode |
| Driver verification against a register spec | The spec says what each register bit does; the test checks the driver does that and nothing else. | Test a driver against a mock register map; verify on an FPGA or chip. | Timing (wait states), interrupt lines, versioned register maps in an ICD. | 23: blueprint 23.5 |

## 10. Communication protocols (module 4; drivers with 7)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| UART framing and baud | Start bit, data bits, optional parity, stop bit; both sides must agree on speed within a few percent. | Compute baud error and tolerance; decode a frame on a scope; set up a UART with a ring buffer. | Overrun errors; framing errors from wrong stop bits; autobaud. | 4: `uart-framing-and-baud`; interactive uart-frame; diagram uart-frame |
| SPI modes and chip select | A clock, two data lines and a select; four modes differ in which edge and idle level. | Pick CPOL/CPHA from a datasheet; handle chip select timing; debug a shifted first byte. | Multi-slave topologies; speed versus trace length; DMA transfers. | 4: `spi-modes-and-chip-select`; interactive spi-modes; diagram spi-timing |
| I2C addressing, ACK, pull-ups | Two open-drain wires, addresses, acknowledgements; pull-ups make the "1". | Size pull-ups for bus capacitance and speed; find a NACK's cause; recover a stuck bus. | Clock stretching; address conflicts; 10-bit addressing; repeated start. | 4: `i2c-sensor-not-acknowledging`; interactive i2c-waveform; diagram i2c-transaction |
| CAN arbitration, errors, bus-off | Many nodes, one differential pair; the lowest identifier wins; error counters take a bad node off the bus. | Read a frame; predict arbitration; diagnose bus-off; set bit timing and sample point. | Bit stuffing; error-passive behaviour; CAN FD differences; higher layers. | 4: `can-arbitration-error-frames-and-bus-off`; interactive can-arbitration; diagram can-frame |
| Driver contract: timeouts, retries, recovery | A driver must say how long it waits, how often it retries, and how it recovers. | Write a bounded driver for one bus with error paths; test NACK, timeout, overflow. | Blocking inside a control loop; retry storms; recovery that loses data. | 4/7: blueprint (P0-2b) |
| RS-232, RS-422, RS-485 | Single-ended versus differential signalling; one driver or many; termination at the ends. | Choose the standard for distance and nodes; terminate and bias a line; frame with CRC. | Failsafe biasing; ground potential differences; half-duplex turnaround. | 18: blueprint 18.4; lab `c-crc16` (drafted, verified) |
| Modbus RTU | A simple master/slave protocol over RS-485 with function codes and a CRC. | Read holding registers; decode an exception response. | Timing gaps between frames; exception codes for unimplemented functions. | 18: blueprint 18.7 (drafted) |
| Ethernet, TCP, UDP | Addresses, ports, reliable streams versus best-effort datagrams. | Choose UDP or TCP for telemetry; compute a payload budget; capture with a sniffer. | Fragmentation; latency versus reliability; multicast. | 18: blueprint 18.6 (drafted); lab `py-udp-echo` (verified) |
| CAN FD and LIN | Faster, longer CAN frames; a cheap single-wire bus for simple nodes. | Recognise their frames and use cases. | Mixed CAN/CAN FD networks; LIN scheduling. | 4: optional (P1) |

## 11. Avionics buses (module 18)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| MIL-STD-1553B physical layer | One megabit per second, every bit a transition, over a shielded pair through transformers, with a second bus for redundancy. | Explain Manchester II, sync, coupling; identify bus A and B on a rig. | Why the sync breaks the Manchester rule; stub lengths and coupling types. | 18.1: published lesson; diagram mil1553-word |
| 1553 word types and fields | Command, status and data words share one 20-bit shape; the fields of a command word say who, which way, where, how many. | Decode a word by hand; compute odd parity; build a word in the interactive. | Mode codes and the field that changes meaning; broadcast; word count zero. | 18.1: published; lab `c-1553-word`; interactive mil1553-word |
| 1553 messages and timing | A command and its answer; the response window and the gap decide what counts as a fault. | Walk BC→RT, RT→BC and RT→RT; compute message duration. | No-response causes in order; retry policy trade-off; bus loading. | 18.1 published; 18.2 blueprint; diagram mil1553-message |
| 1553 schedules and monitor logs | The controller's major and minor frames; a monitor's log is the evidence. | Read a synthetic monitor log; find a late terminal or an illegal command. | Schedule design for latency; monitor timestamp resolution. | 18.2: blueprint; lab `py-1553-decode` (planned) |
| ARINC 429 | One talker, up to twenty listeners, 32-bit words with a label, data, sign/status and parity, at two speeds. | Encode a BNR altitude word; decode a capture; read the label in octal. | SDI use; SSM meanings; word gap and timing; mixed speeds. | 18.3: blueprint; lab `py-a429`; diagram arinc429-word |
| Telemetry packet design | Header, length, sequence, timestamp, payload, CRC: the parts every telemetry frame needs and why. | Design a frame; parse a binary log with `struct`; detect sequence gaps and bad CRCs. | Endianness across tools; versioning the format; bandwidth budgets. | 18.5: blueprint; lab `py-telemetry-parse` |
| Serial avionics links (RS-422) | See family 10; in avionics it is the daily point-to-point link between cards. | Frame and check a message; verify over a loopback. | Determinism arguments for a serial link; failure detection by timeout. | 18.4: blueprint |

## 12. System integration (module 11; with 19)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Requirements and acceptance criteria | A requirement says what must be true and how you would know. | Write testable requirements with measurable criteria; avoid "shall be fast". | Derived requirements; conflicting stakeholders; requirements that cannot be verified. | 11/12: `writing-a-trustworthy-test-case`; blueprint for writing requirements |
| Architecture and partitioning | Decide what is hardware, what is firmware, what is software, and where the boundaries are. | Draw a block diagram with interfaces and timing budgets; justify each boundary. | Partitioning for safety; dissimilarity; cost of a boundary. | 11: blueprint (P0-5a); diagram system-architecture |
| Interface control documents | The written contract between two sides of an interface: signals, formats, timing, error behaviour. | Write and review an ICD; find the gap between two teams' assumptions. | Versioning an ICD; what happens when one side changes. | 11: `interface-control-and-integration-faults`; mission "Two boards, one bus, no agreement" |
| Board bring-up | The ordered checklist that finds faults one at a time. | Run it; record results; stop at the first failure. | Checklists that get skipped and why; thermal and timing margins at bring-up. | 11: `board-bring-up-checklist` |
| Integration faults | When two parts that each work fail together. | Isolate to a side of the interface with evidence; fix the contract, not the symptom. | Byte order, timing, electrical boundaries, assumptions in both ICDs. | 11: ICD lesson and mission |
| Design reviews and decision records | A review is a structured search for what is wrong; a decision record is why you chose. | Prepare and present a review; write an architecture decision record. | Reviews that approve everything; decisions without alternatives. | 11/31: blueprint |
| Change, configuration and release | Every change has an impact; configuration says exactly what was built; a release is reproducible. | Run a change through impact analysis to release notes; tag and reproduce a build. | Change impact under DO-178C; rollback; field update strategy. | 11/7/31: blueprint; see also 17.6 |
| Redundancy and voting | See family 13 and module 19. | | | 19 |

## 13. HIL, SIL and fault injection (modules 12, 21, 19)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| SIL, PIL, HIL: what each proves | Software in the loop proves logic; processor in the loop proves the compiled code; hardware in the loop proves the box with real I/O. | Choose the level for a requirement; state what each result does not prove. | Model validity; timing fidelity; cost per level. | 12: `sil-hil-what-each-proves` |
| HIL architecture | A plant model, real-time target, I/O and a fault insertion unit, wrapped around the real device. | Draw the HIL for a given LRU; say what is real and what is simulated. | Latency of the loop; I/O fidelity; synchronisation. | 21: blueprint 21.1; diagram hil-architecture |
| Bench design from an ICD | The ICD tells you what the bench must provide and measure. | Choose instruments, loads, interlocks; write the bench spec. | Safety interlocks; what the bench cannot reproduce. | 21: blueprint 21.2 |
| FMEA and reliability | List how each part can fail, what happens, how you detect it, what you do. | Run an FMEA on a small product; rank by severity and detectability; derive mitigations. | Common-cause failures; FMEA that stops at the component. | 12: `fmea-for-a-small-embedded-product`; interactive fmea-worksheet |
| FMEA to fault-injection tests | Each failure mode becomes an injected fault and an expected detection. | Build the fault matrix; define pass criteria and detection times. | Faults that cannot be injected safely; coverage of the matrix. | 21: blueprint 21.3; diagram fault-injection-flow |
| Protocol fault injection | Corrupt, delay, drop, repeat and babble on purpose and watch what the system does. | Inject with a Python tool; assert detection and recovery. | Babbling nodes; faults the protocol cannot distinguish; test oracles. | 21: blueprint 21.4; lab `py-fault-inject` |
| Redundancy, voting, failover testing | Channels compare and vote; tests prove isolation and failover. | Implement a voter; inject stuck, late and corrupt channels; log detection and isolation times. | Persistence counters; common-mode faults; dissimilar channels. | 19: blueprint 19.3 to 19.4; lab `c-voter`; diagram redundant-channels |
| Power and environmental fault testing | Brown-out, sequencing faults, temperature and vibration margins. | Plan tests with an electronic load and a chamber; state what MIL-STD-810 and 461 cover. | Margins versus specifications; what a synthetic test can claim. | 21: blueprint 21.5; 14 one-pagers |

## 14. Verification and validation (modules 12, 17, 14)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Test-case design | A test has a precondition, an action, an expected result and a measurable pass criterion. | Write tests for a timing requirement; include robustness cases. | Equivalence classes and boundaries; tests that pass for the wrong reason. | 12: `writing-a-trustworthy-test-case` |
| Traceability | Every requirement has tests and every test has a requirement, both directions. | Build a matrix; find gaps, orphans and bad links. | Derived requirements; traceability under change. | 12: interactive traceability; 17.4 blueprint; diagram v-model-traceability |
| DO-178C objectives and levels | Five levels from A to E; the higher the level, the more objectives and the stricter the coverage. | State what changes per level; map coverage to level. | Independence; what "Level A" does and does not mean on a CV. | 17.1: blueprint; 14 scope lesson; diagram do178-levels |
| High- and low-level requirements | System requirements become software high-level requirements, then low-level ones a test can hit. | Split a requirement; identify derived requirements and feed them back. | Requirements that are really design; traceability to safety assessment (ARP4754A/4761 concepts). | 17.2: blueprint |
| Requirements-based testing | Tests come from requirements, not from code. | Write normal and robustness tests; execute on host and target. | Test independence; coverage gaps as a signal of missing requirements. | 17.3: blueprint |
| Structural coverage: statement, decision, MC/DC | Did the tests execute every statement, every decision outcome, and show each condition independently affects the decision? | Run gcov on a host build; build an MC/DC table by hand. | Coverage from requirements-based tests only; unreachable code analysis. | 17.5: blueprint; lab `c-coverage` |
| Problem reports and change impact | A defect has a lifecycle; a fix has an impact beyond the line it changes. | Write a problem report; do a change impact analysis; re-verify the affected set. | Re-verification cost; regression strategy under configuration control. | 17.4, 17.6: blueprint |
| Dead, deactivated, unreachable code | Code that cannot run, code that is switched off by configuration, code no test reaches. | Classify an uncovered branch and justify. | What a reviewer accepts as justification. | 17.7: blueprint |
| DO-178B to C, supplements, audits | The 2011 revision clarified objectives and added supplements for tools, models, object orientation and formal methods; audits happen in four stages. | Name DO-330/331/332/333 and SOI 1 to 4 and what each checks. | What changes for a project moving from B to C. | 17.8: blueprint |
| Standards scope (DO-254, DO-160, ISO 26262, IEC 62304/60601, IEC 61508, MIL-STD-461/810, AS9100) | Each standard has a scope and a vocabulary; none is "passed" by a lesson. | State scope and applicability; speak without claiming compliance. | Edition and clause discipline; "supported" versus "performed". | 14: two published lessons; one-pagers blueprint |
| Environmental qualification planning | Temperature, vibration, humidity, altitude tests show margins. | Plan a qualification test sequence; state what each method covers. | Levels from the standard versus the product's own requirement. | 12/21: blueprint |

## 15. Python automation (modules 13, 22)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Python foundations for engineers | Bytes are not strings; files, exceptions and functions are the tools of a test script. | Convert bytes and strings correctly; handle a timeout; structure a script into functions. | Encodings; exception hygiene; scripts that grow into frameworks without design. | 13: lab `py-bytes-str`; blueprint lesson |
| Serial and instrument control | Talk to a device over a serial port or to an instrument with SCPI over PyVISA, with framing and timeouts. | Send a request and parse a reply; set a timeout; retry without `sleep`. | Flakiness from timing assumptions; instrument quirks; dialects. | 13: `talking-to-an-instrument-with-pyvisa`, `serial-automation-and-test-logs`; lab `py-request-reply`; mission "The flaky automated test" |
| Binary data with `struct` | Pack and unpack bytes into numbers with an explicit format and byte order. | Parse a telemetry record; check a CRC; handle endianness. | Bit fields; variable-length records; alignment in the format string. | 22.1: blueprint; lab `py-struct-frames` |
| Logs to evidence | Parse logs with regular expressions; produce a table a reviewer can read. | Extract fields; compute statistics; write CSV and a plot. | Logs that change format; time zones; what the report must not hide. | 22.3: blueprint; lab `py-log-report` |
| `pytest` for hardware tests | Fixtures set up ports and devices; parametrisation runs one test over many cases; markers skip what needs a board. | Write a suite over the codecs with fixtures, parametrisation, markers and an HTML/CSV report. | Test isolation with shared hardware; flaky-test policy; reports as evidence. | 22.4: blueprint; lab `py-pytest-suite`; diagram test-framework-layers |
| Framework architecture | Layers: device drivers, protocol, test cases, reporting, configuration. | Draw your framework; name each layer's responsibility; measure the time it saves honestly. | Over-engineering; configuration sprawl; where the framework and the product share code. | 22.5: blueprint |
| Reproducible runs | Seeds, versions, environments, what to commit. | Pin versions; record tool versions in the report; make the run repeatable. | Non-determinism from hardware; what reproducibility does not guarantee. | 22.6: blueprint |
| DAQ and reporting | See family 9. | | | 10/13 |

## 16. Control systems (modules 24, 26)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| The control loop | Measure, compare with the goal, act, repeat. | Draw the loop for an aircraft or UAV with sensors, estimator, controller, actuators. | Latency in the loop; sensor and actuator limits; mode logic. | 24.1: blueprint; diagram control-loop-pid |
| PID intuition | P reacts to the error now, I remembers past error, D anticipates its change. | Implement discrete PID; show a step response; tune by hand. | Integrator wind-up; derivative noise; sample time and stability. | 24.2: blueprint; lab `py-pid-step` |
| Plant models and feedback | A plant is what you control; a model is how you predict it. | Model a first-order plant; close the loop; compare prediction and simulation. | Model error; nonlinearity; saturation. | 26: blueprint |
| Anti-windup and filtering | Stop the integrator growing when the actuator is saturated; filter the derivative. | Add clamping or back-calculation; add a derivative filter. | Trade-offs between response and robustness. | 26: blueprint |
| Stability and sample time | Discrete loops run at a rate; too slow a rate destabilises a loop that was fine in continuous time. | Relate sample time to bandwidth; find the rate at which a loop oscillates. | Margins; jitter in sample time; aliasing in feedback. | 26: blueprint |
| Flight dynamics basics and frames | Body and earth frames; the six quantities a flight computer tracks. | Convert between frames; describe pitch, roll, yaw rates and what sensors measure them. | Coupling between axes; why small-angle assumptions break. | 26: blueprint |
| Model-based design concepts | Build the controller as a model, simulate, generate code, verify against the model. | Describe a Simulink workflow and an open Python alternative; name DO-331's role. | Model coverage; model-code equivalence; tool qualification. | 26/30: blueprint |

## 17. Signals, estimation and sensor fusion (module 27; with 1, 28)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Sampling and aliasing | Sampling too slowly makes a fast signal look like a slow one. | Choose a sample rate and an anti-alias filter for a signal. | Aliasing of noise; undersampling on purpose. | 1: interactive aliasing; 27 blueprint |
| Digital filtering | Average and weight recent samples to remove what you do not want. | Implement moving average, IIR low-pass; see the delay it adds. | Group delay in a loop; coefficient quantisation; fixed-point filters. | 27: blueprint |
| Sensors and their faults (IMU, GNSS, air data) | Every sensor has bias, noise, drift and ways to fail. | Describe each sensor's error model; detect dropout and stuck values. | Vibration in an IMU; multipath in GNSS; icing in air data. | 27: blueprint |
| Sensor fusion basics | Combine sensors so each covers the other's weakness. | Design a complementary filter for attitude from gyro and accelerometer. | Weighting under changing conditions; detecting a sensor lying. | 27: blueprint |
| Kalman filter fundamentals | Predict where you think you are, measure, trust each by how uncertain it is, update. | Implement a one-dimensional Kalman filter; interpret the residual. | Tuning covariances; divergence; non-linear extensions. | 27: blueprint; diagram kalman-loop |
| Probability and least squares | Noise is a distribution; fitting finds the parameters that make the data most likely. | Fit a calibration line; compute residuals. | Over-fitting; outliers; what a covariance matrix says. | 28: blueprint |
| Vectors and matrices | States and measurements are vectors; relationships are matrices. | Write a state vector and a measurement matrix for a simple system. | Conditioning; what a matrix inverse costs on a microcontroller. | 28: blueprint |

## 18. AI-enabled embedded systems (modules 28, 29, 30)

| Topic | Understand | Apply | Master | Where | Maturity |
|---|---|---|---|---|---|
| ML fundamentals, baselines, splits | A model learns a mapping from examples; a baseline says whether it learned anything; a split says whether it will generalise. | Set up a problem with a non-ML baseline and a clean train/validation/test split. | Leakage; metrics that mislead; class imbalance. | 28: blueprint | Established |
| TinyML and quantisation | A small model can run on a microcontroller if its numbers are made small and its memory fits. | Quantise a model; measure memory and latency on a Cortex-M or in simulation. | Accuracy lost to quantisation; operator support; power. | 29: blueprint | Established |
| Anomaly detection and predictive maintenance | Learn what normal looks like and flag what is not. | Build a detector from telemetry features with a tunable false-alarm rate against a threshold baseline. | Drift; the economics of false alarms versus missed faults. | 29: blueprint | Emerging |
| Embedded computer vision | Cameras, pipelines, classical detection, and where a neural model fits. | Set up a pipeline; measure compute budget; evaluate failure cases. | Lighting and distribution shift; latency; what a demo hides. | 29: blueprint | Established tools, evolving |
| AI-assisted firmware and test generation | Assistants draft drivers and tests; the engineer verifies against the datasheet and the requirement. | Use an assistant to draft a driver and tests; review and correct; keep the oracle independent. | What assistants get wrong on hardware; ownership of coverage and traceability. | 29: blueprint | Emerging |
| Autonomy stack and safety monitors | Perceive, plan, act, with a monitor that can override. | Describe the stack; place the safety monitor; run a simulation with a fault. | What simulation proves; operational design domain. | 30: blueprint; diagram autonomy-stack | Established vocabulary |
| ROS 2 and flight-stack simulation | Nodes, topics, QoS, frames; PX4 or ArduPilot in a simulator. | Run a simulation; inject a dropout; read the logs. | Timing and QoS surprises; sim-to-real gaps. | 30: blueprint | Established tools |
| Digital twins and MBSE | A model kept in step with the real system; a system described in models before it is built. | Describe what a twin is validated against; use SysML vocabulary. | Twins that drift; models that outlive their validity. | 30: blueprint | Established (MBSE), emerging (twins) |
| Verification of AI-enabled safety-critical systems | DO-178C assumes code you can trace to requirements; a learned function is not that. | State the gap; describe runtime assurance and current guidance direction. | What certification will and will not accept today. | 29/17: blueprint | Research |

## 19. Engineering leadership and product ownership (module 31; with 11, 12, 16)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Stakeholders and problems | A product exists because someone has a problem; find out who and what before designing. | Turn a synthetic brief into problem statements and acceptance criteria. | Conflicting stakeholders; problems stated as solutions. | 31: blueprint |
| Feasibility, partitioning, trade-offs | Could it be built, by whom, at what cost, and which of three designs is right? | Compare competing designs with a decision record. | Decisions without alternatives; reversible versus irreversible choices. | 31/11: blueprint |
| BOM, cost and supply risk | Every part has a price, a lead time and a risk. | Build a BOM and cost roll-up with dated assumptions; flag single-source parts. | Volume pricing; obsolescence; what cost hides (test, support). | 31: blueprint |
| Reliability, maintainability, lifecycle | A product lives for years; design for failure rates, repair and update. | Estimate MTBF from parts; plan service and field updates. | Wear-out; software maintenance cost; end of life. | 31/12: blueprint |
| Reviews, roadmaps, prioritisation | A review finds what is wrong; a roadmap says what comes when; prioritisation says why. | Run a design review; write a roadmap; prioritise defects and features with criteria. | Reviews that rubber-stamp; roadmaps as promises. | 31/11: blueprint |
| Release ownership and change | Someone owns whether this build goes out and what changed. | Own a controlled release: notes, configuration, rollback plan. | Release under certification; field incidents. | 31/11/7: blueprint |
| Cross-functional collaboration | Hardware, firmware, systems and test need different things from each other; the interfaces between teams are ICDs too. | Write the agreement between two teams; run a joint review. | Blame-free incident reviews; ownership boundaries. | 31/16: blueprint |

## 20. Career, communication and interviews (modules 16, 25)

| Topic | Understand | Apply | Master | Where |
|---|---|---|---|---|
| Presenting a project honestly | Say what you did, what you observed, what you decided, what happened; separate training from employment. | Present the portfolio with evidence per claim. | Pressure to inflate; how reviewers detect it. | 16: `presenting-a-portfolio-project-honestly` |
| The debugging story | Evidence, decision, outcome, in that order, in two minutes. | Tell three stories from your own work without confidential detail. | Stories where you were wrong first; what you changed afterwards. | 16: `telling-a-debugging-story` |
| Career gap or contract role | Explain truthfully in under a minute and move on. | Prepare and rehearse the answer. | Questions that probe it twice. | 25.1: blueprint |
| "What did you own?" | Verification and integration engineers own campaigns, procedures, findings and fixes; say which. | Answer for each project on your profile. | Where "led" and "architected" are and are not true. | 25.2: blueprint |
| Auditing your own claims | For each claim: can you explain it, demonstrate it, substantiate it? | Audit three synthetic bullets, then your own. | Softening without hiding; evidence you can build in 30 days. | 25.3: blueprint |
| Metrics claims | A percentage needs a method: measured, estimated or inherited. | State how a number was obtained. | Numbers that invite the wrong follow-up. | 25.4: blueprint |
| Coding interviews | Bit operations, strings and buffers, state machines, a parser, a scheduler model: on paper, then in code. | Practise the coding gym from modules 5 and 20. | Explaining while writing; testing what you wrote. | 5, 20; 16/25 blueprint |
| Notice, CTC and negotiation | Facts first: market, role, your evidence; then a range and a reason. | Compare offers on total value; negotiate without bluffing. | When to decline; counter-offers from the current employer. | 25.5: blueprint |
| Cross-industry transfer | The same skill has different names in different sectors. | Map your skills to another sector's vocabulary and standards. | Overclaiming domain knowledge you do not have. | 15: `same-skills-different-industries` |
