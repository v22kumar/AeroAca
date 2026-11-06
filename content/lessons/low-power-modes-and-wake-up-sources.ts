import type { Lesson } from "@/lib/content/schema";

export const lowPowerModesAndWakeUpSources: Lesson = {
  slug: "low-power-modes-and-wake-up-sources",
  moduleId: "mcu",
  prerequisites: ["gpio-and-the-clock-tree", "interrupts-and-nvic-priorities", "the-dmm-and-the-bench-supply"],
  title: "Low-power modes and wake-up sources",
  summary: "A battery product spends most of its life asleep. Learn the three sleep depths every Cortex-M MCU offers and what each one keeps alive, how a wake-up event becomes an interrupt and what the firmware must restore, where the microamps actually go, and how to measure a sleep current without the debugger lying to you.",
  durationMinutes: 11,
  whyItMatters: "'Why does it draw 4 mA asleep when the datasheet says 2 µA?' is the most common battery-product bug, and the answer is never one thing. Interviewers ask which mode you would pick for a given wake-up latency and what the debugger does to a sleeping chip; both are in this lesson.",
  objectives: [
    "Name Sleep, Stop and Standby (and their vendor equivalents), what stays powered and clocked in each, the wake-up latency, and the state that is lost.",
    "Configure a wake-up source: EXTI on a pin, the RTC alarm or wake-up timer, a low-power UART or timer; and write the wake-up path that restores clocks and peripherals.",
    "Build a current budget from the datasheet's typical values and the duty cycle, and find the leaks: floating pins, pull-ups into a low line, peripherals left clocked, the debugger.",
    "Measure sleep current correctly with a meter range or a shunt and a scope, and recognise the debugger-connected trap.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Mode names, wake-up sources and register behaviour follow RM0368/RM0090 (PWR, EXTI, RTC chapters) and the Cortex-M4 generic user guide (SLEEPDEEP, WFI/WFE). Current figures are typical datasheet values for the STM32F401 at 25 °C and are illustrative; the L4 and G0 families have more modes and lower floors.",
  },
  references: [
    { title: "ST RM0368 / RM0090: Power controller (PWR) chapter, low-power modes table; EXTI; RTC wake-up timer", note: "Sleep, Stop and Standby entry sequences, what is retained, wake-up sources and latency." },
    { title: "Arm Cortex-M4 Devices Generic User Guide: power management (SLEEPDEEP, SLEEPONEXIT, WFI, WFE)", note: "The core-level instructions and SCR bits behind the modes." },
    { title: "ST AN4365 / AN4621 (STM32F4/L4 ultra-low-power application notes)", note: "Current optimisation: GPIO configuration in sleep, clocks, peripherals, debug interface." },
    { title: "Lesson: GPIO and the clock tree", note: "The clock configuration that is lost in Stop and must be rebuilt on wake-up." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Two microamps on the datasheet, four milliamps on the meter",
      body: `A sensor node must run for a year on two AA cells, waking every ten seconds to take a reading. The datasheet promises about 2 µA in Standby. The bench meter says 4.1 mA with the firmware "asleep". A week of hunting finds four leaks: the ST-LINK is still attached (the debug interface keeps the core clocked), an LED on a GPIO is driven high through its resistor, the I2C pull-ups feed a sensor whose SDA line is held low, and a timer peripheral left enabled keeps its clock domain awake. Fixing each one in turn: 4.1 mA → 1.3 mA → 0.9 mA → 0.4 mA → 14 µA. The last 12 µA is the RTC and a regulator's quiescent current, and they are in the budget.

The datasheet number was true. The board was not the datasheet's board. This lesson is the list.`,
    },
    {
      type: "concept",
      title: "Three depths of sleep, and what each one costs to wake from",
      body: `Every Cortex-M part has the same three levels, under vendor names:

| Mode (STM32 name) | What stops | What stays | Typical current (F401, 25 °C) | Wake-up | State lost |
|---|---|---|---|---|---|
| **Sleep** (\`WFI\` with SLEEPDEEP = 0) | the core clock only | all peripherals clocked and running, RAM, registers | about 1 to 3 mA at 16 MHz, scaling with frequency | any enabled interrupt; a few cycles | nothing |
| **Stop** (SLEEPDEEP = 1, PWR_CR PDDS = 0) | all clocks (HSI, HSE, PLL), peripherals frozen | RAM, registers, GPIO states, the regulator (optionally in low-power mode); RTC on LSE/LSI | tens of µA to ~300 µA depending on regulator mode and flash state | EXTI line, RTC alarm/wake-up, some low-power peripherals; tens of µs plus **clock restart** | the clock configuration: the chip resumes on HSI and the firmware must re-run the clock set-up |
| **Standby** (SLEEPDEEP = 1, PDDS = 1) | everything including the regulator; the 1.2 V domain is off | RTC, backup registers, backup SRAM (if enabled), wake-up pins | ~2 to 4 µA with RTC | WKUP pin rising edge, RTC alarm/wake-up, reset; **the chip reboots** through the reset vector | RAM, all registers, GPIO configuration (pins float except WKUP) |

The decision is a trade between the **floor current** and the **cost of waking**: Sleep wakes in cycles and saves little; Stop saves most of the current and costs a clock restart (hundreds of microseconds with the PLL) and the firmware's own restoration; Standby reaches the floor and costs a full reboot, so anything you need afterwards must have been written to backup registers, backup SRAM or non-volatile memory before entering.

The scenario's node (one reading every 10 s, nothing to keep between readings) is a Standby design: the reading is sent, the result stored in a backup register, the RTC wake-up timer set, Standby entered; the reset vector is the wake-up path. A device that must respond to a bus within a millisecond is a Stop design with EXTI; one that must respond within microseconds stays in Sleep.`,
      deeper: {
        title: "WFI, WFE and SLEEPONEXIT",
        body: `\`WFI\` (wait for interrupt) sleeps until an interrupt is pending; the handler runs on wake-up. \`WFE\` (wait for event) wakes on an event register set by an interrupt or by \`SEV\` without necessarily running a handler, useful for interrupt-free polling loops. \`SLEEPONEXIT\` makes the core re-enter sleep automatically when the last interrupt handler returns, which turns an interrupt-driven design into "wake, handle, sleep" with no main loop at all. All three are bits in the Cortex-M System Control Register; the HAL's \`HAL_PWR_EnterSLEEPMode\` and friends set them.`,
      },
    },
    {
      type: "concept",
      title: "Wake-up sources, and the path back",
      body: `A wake-up is an interrupt that is allowed to reach a stopped core. Three families:

- **EXTI (external interrupt) on a pin**: any GPIO can be mapped to an EXTI line (one line per pin number, shared across ports: PA0, PB0 and PC0 all map to EXTI0, so only one of them can be the source). Configure the edge, enable the line's interrupt in the NVIC, and the pin wakes the chip from Stop; from Standby only the dedicated WKUP pins work.
- **RTC**: the real-time clock runs from LSE (a 32.768 kHz crystal, accurate) or LSI (~32 kHz RC, ± 50 %, the watchdog lesson's range) in every mode. Its **alarm** (wake at a time) and **wake-up timer** (wake after a period, 1 s to 36 hours) are the periodic wake-up sources for Stop and Standby. Their interrupts route through EXTI lines 17 and 22 internally, which is why the HAL asks you to configure EXTI for an RTC wake-up.
- **Low-power peripherals**: on the L-series, a low-power UART (LPUART) can receive a character and wake the chip; on all parts, a low-power timer or a comparator can. On the F4, the USART cannot run in Stop, so a design that must wake on a serial byte uses an EXTI on the RX pin to catch the start bit, wakes, then re-enables the USART (and accepts that the first byte is lost or must be resent, which goes in the ICD).

**The path back** from Stop is firmware's job and the usual source of "it wakes but then hangs":

1. The core resumes after the \`WFI\` on **HSI**, whatever clock it was using before. Call the clock configuration again (\`SystemClock_Config\`, or a shorter version), or run on HSI deliberately and know every baud and timer changes.
2. Re-enable and reconfigure what you disabled before sleeping: peripheral clocks, the ADC (which needs a settling time), the sensor's supply if you switched it (the diodes-and-transistors lesson's high-side switch).
3. Clear the wake-up flags (PWR_CSR WUF, the EXTI pending bit, the RTC flag) so the next entry is not refused or immediately exited.
4. Re-arm the watchdog strategy: the independent watchdog keeps running in Stop on the F4 (it is on LSI), so a long Stop period must be shorter than its timeout or the watchdog must be frozen in the option bytes; this is a design decision to write down.

From Standby the path back *is* the reset vector: the startup lesson's sequence runs, \`main\` starts, and the first job is to read PWR_CSR SBF (standby flag) and WUF to learn that this is a wake-up, not a cold boot, and to fetch the saved context from the backup registers.`,
    },
    {
      type: "concept",
      title: "The budget, and where the microamps go",
      body: `**Average current** = (I_active × t_active + I_sleep × t_sleep) / period. The scenario: active 20 ms at 8 mA (clock start-up, a sensor read over I2C, a radio burst), asleep 9.98 s at 14 µA: (8 × 0.02 + 0.014 × 9.98) / 10 = 0.030 mA, 30 µA average. Two AA cells at 2000 mAh give 2000 / 0.030 = 66 000 hours, over seven years before self-discharge, so a year is comfortable. At the original 4.1 mA sleep current the same cells last 20 days. The sleep current dominates whenever the duty cycle is small, so it is where the engineering goes.

The leaks, in the order they usually appear:

1. **The debugger.** With a debug probe attached and the debug interface enabled (DBGMCU_CR bits DBG_SLEEP/STOP/STANDBY, which CubeMX sets when you tick "debug in low-power modes"), the core and its clocks stay partly awake: milliamps. Measure sleep current with the probe **disconnected** and those bits clear.
2. **GPIO.** Every output driving current (LEDs, a pull-up into a line held low, a sensor supply pin) and every floating input (which oscillates and burns tens of µA per pin) adds up. Before sleep: unused pins to analogue mode, outputs that feed loads to a known low-power state, pull-ups off where the line is held low.
3. **Peripherals left enabled.** Clock-gated peripherals cost little, but a peripheral with its clock enabled in a mode where that clock still runs (Sleep, or a low-power timer in Stop) costs its datasheet current; disable what you do not need before sleeping.
4. **External parts.** A regulator's quiescent current (1 µA to 1 mA depending on the part), a sensor's standby current, a level shifter, a pull-up network, a battery monitor divider (the circuit-laws lesson's standing current): the MCU's 2 µA is often the smallest line on the board's budget.
5. **Flash and regulator modes.** Stop with the regulator in low-power mode and flash powered down (PWR_CR LPDS, FPDS) is far below Stop with them on, at the price of wake-up time; the datasheet's table has both numbers.

Write the budget as a table with the datasheet's value for each line and the measured value beside it; the gap between them is the list of bugs.`,
    },
    {
      type: "example",
      title: "Worked example: measuring the sleep current honestly",
      body: `A multimeter's 200 µA range has a burden of about a volt (the multimeter lesson): put it in series with a 3 V node and the node drops below the MCU's brown-out level the moment it wakes and draws 8 mA. Three ways round it:

- **Meter on the mA range during active, switch to µA only while asleep**: works for manual measurements if the sleep period is long; the range change momentarily opens the circuit on some meters, which resets the board.
- **A shunt and a scope**: a 10 Ω resistor in the supply lead drops 40 mV at 4 mA and 0.14 mV at 14 µA; the scope sees the active burst clearly and the sleep floor not at all. A 1 kΩ shunt bypassed by a Schottky diode drops 14 mV at 14 µA (readable on the meter) and clamps at ~0.3 V during the burst (the diode conducts), so the board survives waking: the standard low-cost trick.
- **A dedicated current profiler** (a logging ammeter with automatic ranging, or a source-measure unit) shows the whole duty cycle, microamps to milliamps, on one trace, and reports the average directly. For a product, this is the instrument to borrow.

Record the measurement with the method, the probe state (disconnected), the firmware version and the ambient temperature; sleep currents double every 10 to 15 °C, so a 25 °C figure is not the 60 °C figure, and the test record should say which one it is.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "average-current",
        skill: "low-power",
        objective: "Compute average current from a duty cycle.",
        prompt: `A node is active for 50 ms at 12 mA every 30 s and otherwise asleep at 20 µA. What is the average current, in microamps?`,
        unit: "µA",
        answer: 40,
        tolerance: 0.5,
        solution: `Active charge per period: 12 mA × 0.05 s = 0.6 mA·s. Sleep: 0.020 mA × 29.95 s = 0.599 mA·s. Total 1.199 mA·s over 30 s = 0.03997 mA ≈ **40 µA**. Note the two halves are equal: at this duty cycle the sleep current and the active burst matter equally.`,
        solvedFeedback: `Right: 40 µA. Halving the sleep current or halving the active time each save about a quarter.`,
        misconceptions: [
          { value: 20, tolerance: 0.5, feedback: `20 µA is the sleep current alone; the active burst adds as much again at this duty cycle.` },
          { value: 400, tolerance: 5, feedback: `Off by ten: check that 50 ms is 0.05 s and the period is 30 s.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "mode-choice",
        skill: "low-power",
        objective: "Choose a low-power mode from the wake-up requirement.",
        prompt: `A device must keep its RAM state and respond to a bus request within 1 ms, while drawing as little as possible between requests, which arrive every few seconds. Which mode?`,
        options: [
          { id: "a", text: "Stop, woken by an EXTI line on the bus's request signal; the firmware restores the clock configuration on wake-up", correct: true, feedback: `Stop keeps RAM and registers, wakes in tens of microseconds plus the clock restart (well inside 1 ms), and sits at tens to hundreds of microamps. Standby would lose RAM and take a reboot.` },
          { id: "b", text: "Standby, woken by a WKUP pin", correct: false, feedback: `Standby loses RAM and every register; the wake-up is a reset, and the state would have to be rebuilt from backup registers each time.` },
          { id: "c", text: "Sleep with all peripherals running", correct: false, feedback: `Sleep keeps everything clocked and draws milliamps; it wakes fastest but saves least.` },
          { id: "d", text: "No low-power mode; poll the bus in a tight loop", correct: false, feedback: `Full run current for a few-second idle; the opposite of the requirement.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "sleep-leaks",
        skill: "low-power",
        objective: "Find the sleep-current leaks.",
        prompt: `A board draws 3 mA 'asleep' in Stop against a datasheet figure of 50 µA. Select **every** plausible contributor to check first.`,
        options: [
          { id: "a", text: "The debug probe is connected and the debug-in-Stop bit is set, keeping the core partly awake", correct: true, feedback: `The first leak on every bench; measure with the probe disconnected and DBGMCU bits clear.` },
          { id: "b", text: "An LED is still driven on through its resistor", correct: true, feedback: `A few milliamps on its own. Outputs that feed loads go to a known state before sleep.` },
          { id: "c", text: "Pull-ups feed a line that an external device holds low", correct: true, feedback: `3.3 V across 4.7 kΩ is 0.7 mA per line, all the time.` },
          { id: "d", text: "Unused pins are left as floating inputs", correct: true, feedback: `Each can oscillate and burn tens of microamps; set them to analogue mode.` },
          { id: "e", text: "The RTC is running from the LSE crystal", correct: false, feedback: `The RTC on LSE is about a microamp; it is the one thing that should be running and is in the datasheet's figure.` },
        ],
        solvedFeedback: `Right. Probe, LED, pull-ups into low lines, floating pins. The RTC is the budgeted item, not the leak.`,
      },
    },
    {
      type: "interview",
      questionId: "sleep-current-hunt",
      intro: `Name the mode and the wake-up source for the requirement, then walk the leak list with a number for each, and finish with how you measured without the burden trap.`,
    },
    {
      type: "recap",
      summary: `- Sleep: core stops, everything else runs, wakes in cycles, saves little. Stop: all clocks stop, RAM and registers kept, wakes on EXTI or RTC in tens of µs plus clock restart; firmware must restore clocks and peripherals and clear the flags. Standby: regulator off, RTC and backup domain only, wakes through reset; keep state in backup registers.
- Wake-up sources: EXTI on a pin (one line per pin number across ports; WKUP pins for Standby), RTC alarm and wake-up timer (LSE accurate, LSI ±50 %), low-power peripherals on L-series. The watchdog keeps running in Stop on the F4.
- Average current = duty-cycle weighting; sleep current dominates at low duty cycles. Leaks in order: debugger, GPIO loads and pull-ups into low lines, floating inputs, peripherals left clocked, external parts' quiescent currents, regulator and flash modes.
- Measure with the probe disconnected; a shunt with a Schottky bypass or a current profiler avoids the meter's burden voltage resetting the board; record temperature and method.`,
      cards: [
        { id: "lp-1", front: "Sleep vs Stop vs Standby in one line each?", back: "Sleep: core halted, peripherals run, instant wake, mA. Stop: clocks stopped, RAM/registers kept, wake on EXTI/RTC in tens of µs plus clock restart, tens to hundreds of µA. Standby: regulator off, only RTC and backup domain, wakes through reset, a few µA." },
        { id: "lp-2", front: "What must firmware do after waking from Stop?", back: "Re-run the clock configuration (the core resumes on HSI), re-enable and reconfigure peripherals and switched supplies, clear the wake-up flags (PWR WUF, EXTI pending, RTC), and respect the watchdog that kept running." },
        { id: "lp-3", front: "Why does the board draw milliamps 'asleep'?", back: "Debug probe attached with debug-in-low-power set; an LED or load still driven; pull-ups into a line held low; floating inputs; a peripheral left clocked; external quiescent currents. Compare a datasheet-vs-measured table line by line." },
        { id: "lp-4", front: "How do you measure 14 µA sleep current without resetting the board on wake-up?", back: "A 1 kΩ shunt bypassed by a Schottky diode: 14 mV at 14 µA for the meter, clamped near 0.3 V during the 8 mA burst; or a logging current profiler. Probe disconnected; note temperature and method." },
      ],
    },
  ],
};
