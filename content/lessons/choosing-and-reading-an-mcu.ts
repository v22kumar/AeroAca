import type { Lesson } from "@/lib/content/schema";

export const choosingAndReadingAnMcu: Lesson = {
  slug: "choosing-and-reading-an-mcu",
  moduleId: "mcu",
  prerequisites: ["the-dmm-and-the-bench-supply"],
  title: "Choosing and reading an MCU: families, cores and what a part number says",
  summary: "Microcontroller, microprocessor and system-on-chip are three different design problems. Learn what separates them, what the Cortex-M, R and A cores are for, how to decode an STM32 part number into memory, package and features, and the six questions that pick a part for a product instead of for a tutorial.",
  durationMinutes: 9,
  whyItMatters: "A job advert says 'Cortex-M4F, 512 kB flash, CAN FD'; an interviewer asks why you would not run that firmware on a Raspberry Pi; a schematic says STM32F446RET6 and you must know whether it has the peripheral you need. This lesson is the vocabulary everything else in the module assumes.",
  objectives: [
    "Distinguish MCU, MPU and SoC by memory, operating system, boot and the problems each is chosen for.",
    "Place Cortex-M0+/M3/M4/M7/M33, Cortex-R and Cortex-A by their roles, and name what the F in M4F and the DSP extensions add.",
    "Decode an STM32 part number into family, line, pin count, flash size, package and temperature grade, and find the right reference manual and datasheet.",
    "Select an MCU for a stated product with the six questions: peripherals and pins, memory with margin, performance, power, toolchain and ecosystem, lifecycle and price.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Core descriptions follow Arm's Cortex-M/R/A documentation; the STM32 numbering scheme follows ST's part-numbering notes in the family datasheets. Memory sizes and examples are real part numbers at the time of writing; prices and availability are not stated because they change.",
  },
  references: [
    { title: "Arm: Cortex-M processor comparison table and the Cortex-M4 technical reference manual (FPU, DSP extensions)", note: "What distinguishes M0+, M3, M4, M7, M33." },
    { title: "ST STM32F446xC/E datasheet, section 'Ordering information'", note: "The part-number decoding scheme used across the STM32 families." },
    { title: "Lesson: From reset vector to main()", note: "The boot process that separates an MCU (runs from flash at reset) from an MPU (needs a bootloader and external memory)." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The prototype on a Raspberry Pi",
      body: `A team prototypes a sensor controller on a Raspberry Pi because Python is quick. It works. Then the requirements arrive: respond to a fault within 2 ms every time, run from a 3.7 V cell for a week, start in under 100 ms, cost under five dollars, work at −40 °C. The Pi boots Linux in twenty seconds, draws 2 W, has no deterministic response, and is a 25-dollar computer rated to 0 °C.

The team did not choose the wrong computer; they chose the wrong *kind* of computer, and nothing in the prototype had told them. The portfolio project's STM32 is the right kind. This lesson is why, and how to read what it is.`,
    },
    {
      type: "concept",
      title: "MCU, MPU, SoC: three answers to 'where is the memory?'",
      body: `A **microcontroller (MCU)** has its program flash and RAM **on the chip**, boots directly from that flash at reset (the startup lesson), runs one firmware image with or without a small RTOS, and has the peripherals of the embedded world on board: timers, ADC, UART, I2C, SPI, CAN. Tens of kilobytes to a couple of megabytes of flash; a few kilobytes to a megabyte of RAM; tens of megahertz to a few hundred; milliwatts; deterministic interrupt latency measured in cycles; a few cents to a few dollars. The STM32, the NXP Kinetis and LPC, the Microchip PIC32 and SAM, the Nordic nRF, the ESP32 are MCUs.

A **microprocessor (MPU)** has the core and the peripherals but **no useful program memory on the chip**: it boots from a small ROM into an external flash or SD card, loads an operating system (usually Linux) into external DRAM, and runs applications on top. Hundreds of megahertz to gigahertz, hundreds of megabytes to gigabytes of DRAM, watts, boot times in seconds, no hard real-time guarantee without a real-time kernel or a co-processor. The i.MX, the AM335x (BeagleBone), the Broadcom chips in a Raspberry Pi.

A **system-on-chip (SoC)** is the general term for integrating several subsystems on one die: an application processor with a GPU, a video decoder, a modem; or, in the embedded sense, an MPU with an MCU-class core beside it (the i.MX 8M's Cortex-M4 next to its Cortex-A53s, the STM32MP1). The real-time work goes to the M core; Linux and the user interface to the A cores. "SoC" without qualification tells you little; ask which cores and which memory.

The deciding questions: does it need an operating system with a filesystem, networking stacks and a display (MPU), or does it need deterministic timing, instant boot, microwatts and a price in cents (MCU)? Many products need both, and the SoC or a two-chip design is the answer.`,
      deeper: {
        title: "FPGAs and DSPs",
        body: `A field-programmable gate array is configured hardware, not a processor: logic you describe runs in parallel at the clock edge, for things no sequential core can do in time (a 1 Gsample/s data path, hundreds of PWM channels, custom protocols). A digital signal processor is a core optimised for multiply-accumulate loops. Modern MCUs absorb a lot of both roles (the M4's DSP instructions, the M7's performance); the applications module touches where FPGAs still win.`,
      },
    },
    {
      type: "concept",
      title: "The Arm cores you will meet",
      body: `Most 32-bit MCUs use an Arm **Cortex-M** core licensed by the chip vendor, who adds memory and peripherals. The letters are roles, the numbers are capability:

| Core | Typical use | What it adds |
|---|---|---|
| **M0 / M0+** | lowest cost and power, simple control | Thumb instruction subset, no hardware divide, 2-cycle multiply; the "8-bit replacement" |
| **M3** | general control | full Thumb-2, hardware divide, the NVIC with priority grouping from the interrupts lesson, MPU option |
| **M4 / M4F** | control plus signal processing | M3 plus DSP instructions (single-cycle MAC, SIMD); **F** = single-precision floating-point unit, which turns a 100-cycle software float into one instruction |
| **M7** | highest Cortex-M performance | superscalar pipeline, caches, tightly coupled memories, optional double-precision FPU; cache coherence becomes your problem (driver-model lesson) |
| **M33 / M23** | security | TrustZone for Armv8-M: a secure and a non-secure world on one core |

Reading "Cortex-M4F at 84 MHz" therefore says: hardware floating point (use \`float\`, not \`double\`, or you are back in software), DSP instructions for filters, an NVIC with configurable priorities, and roughly 100 DMIPS. The STM32F4 is this; the F0/G0/L0 are M0/M0+; the F1 and L1 are M3; the F7/H7 are M7; the L5/U5 are M33.

**Cortex-R** (R5, R52) is for hard real-time with safety: lock-step dual cores, ECC memories, deterministic latency, used in automotive ECUs (TI Hercules, Renesas RH850 competitors) and storage controllers. **Cortex-A** (A7, A53, A72…) is the application-processor core with a memory management unit for Linux. Knowing which letter a part has tells an interviewer you know what the part is for.

Non-Arm cores exist and matter: **RISC-V** (an open instruction set now in Espressif's ESP32-C series and many new MCUs), Xtensa in the original ESP32, and the 8-bit AVR and PIC families that still ship in volume. The questions below apply to all of them.`,
    },
    {
      type: "concept",
      title: "Decoding a part number: STM32F446RET6",
      body: `ST's scheme, which most vendors echo in their own form:

| Field | Example | Meaning |
|---|---|---|
| **STM32** | STM32 | 32-bit Arm MCU family |
| **F4** | F | series: F = mainstream, L = low power, G = mainstream newer, H = high performance, W = wireless, U = ultra-low-power, MP = MPU |
| **446** | 446 | line within the series: core (F4 = Cortex-M4F), peripheral set, max frequency (the 446 adds a second CAN, SAI, QSPI over the 401) |
| **R** | R | pin count: F = 20, G = 28, K = 32, T = 36, C = 48, R = 64, V = 100, Z = 144, I = 176 |
| **E** | E | flash size: 4 = 16 kB, 6 = 32, 8 = 64, B = 128, C = 256, D = 384, **E = 512**, F = 768, G = 1024, H = 1536, I = 2048 |
| **T** | T | package: T = LQFP, H = BGA, U = QFN, Y = WLCSP |
| **6** | 6 | temperature grade: 6 = −40 to 85 °C, 7 = −40 to 105 °C, 3 = −40 to 125 °C |

So STM32F446RET6 is a Cortex-M4F mainstream part, 446 line, 64-pin LQFP, 512 kB flash, industrial temperature. The **datasheet** (one per line, e.g. "STM32F446xC/E") gives pins, electrical limits, peripheral counts and the alternate-function table; the **reference manual** (one per group of lines, RM0390 for the F446, RM0090 for F405/407/415/417, RM0368 for F401) describes every register; **errata sheets** list the silicon bugs and are read before blaming your code; **application notes** cover specific topics; the **programming manual** (PM0214 for Cortex-M4 on STM32) describes the core and its fault registers. Finding the right four documents for a part number in two minutes is a skill you will use weekly.

The same number tells you what will **not** work: a 401 has one CAN, no Ethernet; a 64-pin part cannot expose every peripheral at once (the AF table has conflicts); a grade-6 part is not for an under-bonnet product.`,
    },
    {
      type: "example",
      title: "Worked example: picking the part for the portfolio monitor, and for a product version",
      body: `**The portfolio monitor** (one I2C sensor, one UART, one GPIO alarm, an independent watchdog, 10 Hz loop) needs almost nothing: any Cortex-M0+ with I2C, USART and IWDG, 32 kB flash, 8 kB RAM. A Nucleo-F401RE is used because it is on the desk, has the ST-LINK and the virtual COM port, and its documentation is excellent; that is a tutorial choice, not a product choice, and the report should say so.

**A product version** (the same monitor sold as a module: two sensors, CAN output to a vehicle bus, logging to an SD card, 5-year supply, −40 to 105 °C) goes through the six questions:

1. **Peripherals and pins**: 2 × I2C, 1 × CAN (CAN FD if the bus is modern), SDIO or SPI for the card, USART for debug, IWDG, enough GPIO: the 446's set fits; a 401 fails on CAN count. Check the AF table on a 64-pin package for conflicts; if two needed functions collide, go to 100 pins.
2. **Memory with margin**: the firmware estimate is 180 kB flash and 40 kB RAM (memory lesson's size report, plus the SD library); choose 512 kB flash and 128 kB RAM so there is a 2× margin for updates and logging buffers.
3. **Performance**: the 10 Hz loop needs nothing, but CAN at 500 kbit/s with filtering and SD writes benefit from an M4; 84 to 180 MHz is plenty.
4. **Power**: mains or vehicle powered; sleep modes matter less (otherwise an L4 and the low-power lesson).
5. **Toolchain and ecosystem**: CubeIDE, HAL, FreeRTOS, FatFS available; the team knows it; a second-source family within ST (G4) exists.
6. **Lifecycle and price**: ST's longevity commitment covers the F4 for ten years from the commitment date; grade-7 temperature; price checked in volume, not quoted here because it moves.

Result: an STM32F446RET7 or VET7 (100 pins if the AF table forces it). The decision is a one-page table a reviewer can argue with, which is the point.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "decode-part-number",
        skill: "mcu-families",
        objective: "Decode an STM32 part number.",
        prompt: `What does **STM32L476VGT6** tell you?`,
        options: [
          { id: "a", text: "Low-power series, 476 line (Cortex-M4F), 100 pins, 1 MB flash, LQFP package, −40 to 85 °C", correct: true, feedback: `L = low power; V = 100 pins; G = 1024 kB; T = LQFP; 6 = 85 °C grade. The 476 line is an M4F with the L4's low-power modes.` },
          { id: "b", text: "Mainstream F series, 64 pins, 512 kB flash, BGA package", correct: false, feedback: `L, not F; V is 100 pins (R would be 64); G is 1 MB (E would be 512 kB); T is LQFP (H would be BGA).` },
          { id: "c", text: "An MPU running Linux with 1 GB of external DRAM", correct: false, feedback: `STM32L4 is an MCU with on-chip flash and RAM; the MPUs are the STM32MP1 series, numbered differently.` },
          { id: "d", text: "A Cortex-M0+ part for −40 to 125 °C", correct: false, feedback: `The 476 is an M4F; grade 6 is 85 °C (3 would be 125 °C).` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "mcu-vs-mpu",
        skill: "mcu-families",
        objective: "Choose the kind of processor for a requirement set.",
        prompt: `A product must respond to a sensor fault within 2 ms every time, start in under 100 ms, run for a week on a small battery and cost a few dollars. It has no display or network. Which kind of part, and why?`,
        options: [
          { id: "a", text: "A microcontroller: on-chip flash boots in milliseconds, interrupt latency is deterministic and in cycles, sleep currents are microamps, and the price is in cents to a few dollars", correct: true, feedback: `Every requirement points at an MCU; a Linux MPU fails boot time, determinism, power and price at once.` },
          { id: "b", text: "A Linux microprocessor, because Python makes development faster", correct: false, feedback: `Development speed is real, but twenty-second boots, watts of power and non-deterministic response violate four of the five requirements.` },
          { id: "c", text: "An FPGA, because it is the fastest", correct: false, feedback: `An FPGA is for parallel data paths no core can handle; for a 2 ms response on one sensor it is cost and power without benefit.` },
          { id: "d", text: "A Cortex-A SoC with a GPU", correct: false, feedback: `No display, no network, a battery and a few dollars: nothing here needs an application processor.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "core-facts",
        skill: "mcu-families",
        objective: "Know what the core letters and numbers imply.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "On a Cortex-M4F, \`float\` arithmetic uses the hardware FPU but \`double\` falls back to software routines.", correct: true, feedback: `The M4F's FPU is single precision only; use float, or an M7 with double-precision FPU.` },
          { id: "b", text: "A Cortex-M0+ has no hardware divide, so a division in an interrupt handler costs tens of cycles of software.", correct: true, feedback: `One reason the M0+ is for simple control and why fixed-point tricks (shifts, masks) matter there.` },
          { id: "c", text: "Cortex-R cores are the application-processor cores for Linux.", correct: false, feedback: `Cortex-A is for Linux (it has an MMU); Cortex-R is for hard real-time and safety with lock-step cores.` },
          { id: "d", text: "A 64-pin package can expose every peripheral of its line at once.", correct: false, feedback: `The alternate-function table has conflicts; a product that needs many peripherals goes to a larger package.` },
          { id: "e", text: "The errata sheet should be read before concluding a peripheral misbehaviour is your bug.", correct: true, feedback: `Silicon bugs are documented; several famous I2C and timer 'mysteries' are errata entries.` },
        ],
        solvedFeedback: `Right. FPU precision, divide cost, the roles of R and A, pin conflicts, and the errata habit.`,
      },
    },
    {
      type: "interview",
      questionId: "mcu-selection",
      intro: `Separate MCU from MPU in two sentences, decode the part number aloud, then run the six questions for the product.`,
    },
    {
      type: "figure",
      title: "Inside the microcontroller",
      diagram: "mcu-block",
      alt: "Block diagram of a Cortex-M microcontroller: core, NVIC, bus matrix, flash, SRAM, clock tree, debug port and peripherals on the APB buses.",
      caption: `The core talks to flash, SRAM and the peripherals over a bus matrix; the clock tree enables each block; the debug port is how the probe reaches the core. Every peripheral needs its clock enabled and its pins configured before it does anything.`,
    },
    {
      type: "recap",
      summary: `- MCU: flash and RAM on chip, boots from flash in milliseconds, deterministic interrupts, milliwatts, cents to dollars. MPU: external memory, bootloader and OS, seconds to boot, watts, no hard real time without help. SoC: several subsystems on one die; ask which cores.
- Cortex-M0+ (minimal), M3 (general), M4F (DSP + single-precision FPU), M7 (caches, performance), M33 (TrustZone); Cortex-R for safety real time; Cortex-A for Linux. RISC-V is arriving.
- STM32F446RET6: F4 mainstream, 446 line (M4F), R = 64 pins, E = 512 kB, T = LQFP, 6 = 85 °C. Four documents per part: datasheet, reference manual, errata, programming manual.
- Six selection questions: peripherals and pins (check the AF table), memory with 2× margin, performance, power, toolchain and ecosystem, lifecycle and price.`,
      cards: [
        { id: "mcu-1", front: "MCU versus MPU in one line each?", back: "MCU: program memory on chip, boots from flash at reset, deterministic, milliwatts, cents. MPU: external DRAM and storage, bootloader plus OS, seconds to boot, watts, applications and networking." },
        { id: "mcu-2", front: "What does the F in Cortex-M4F buy, and its limit?", back: "A hardware floating-point unit for single precision: float operations in one or a few cycles instead of ~100 in software. double is still software; the M7 offers double precision." },
        { id: "mcu-3", front: "Decode STM32F446RET6.", back: "F4 mainstream series, 446 line (Cortex-M4F, dual CAN, SAI, QSPI), R = 64 pins, E = 512 kB flash, T = LQFP, 6 = −40 to 85 °C." },
        { id: "mcu-4", front: "Six questions that pick an MCU for a product?", back: "Peripherals and pins (AF table conflicts), memory with margin for updates, performance for the worst task, power and sleep modes, toolchain and ecosystem including a second source, lifecycle and price in volume." },
      ],
    },
  ],
};
