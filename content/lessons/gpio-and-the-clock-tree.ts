import type { Lesson } from "@/lib/content/schema";

export const gpioAndTheClockTree: Lesson = {
  slug: "gpio-and-the-clock-tree",
  moduleId: "mcu",
  prerequisites: ["your-first-stm32-project", "logic-levels-thresholds-and-open-drain"],
  title: "GPIO and the clock tree: the two configurations under every peripheral",
  summary: "Every STM32 peripheral sits on a pin and a clock, and both are configured by you. Learn the GPIO pin's five settings and what each one costs, how alternate functions route a pin to a peripheral, how the clock tree turns one oscillator into a dozen bus and peripheral clocks, and how to compute and verify every frequency in it.",
  durationMinutes: 11,
  whyItMatters: "'The UART prints nothing' and 'the timer runs at the wrong rate' are pin and clock configuration errors more often than anything else. Reading MODER and RCC_CFGR in the debugger and saying what every bit means is a baseline STM32 skill, and clock-tree arithmetic is a standard interview question.",
  objectives: [
    "Configure a GPIO pin: mode, output type, speed, pull, alternate function; explain the symptom of each one wrong.",
    "Route a pin to a peripheral through the alternate-function registers and check the datasheet's pin table for conflicts.",
    "Trace the clock tree from HSI/HSE through the PLL to SYSCLK, HCLK, APB1/APB2 and the peripheral clocks, with the limits that apply to each.",
    "Compute timer and UART clock inputs from the tree, verify a clock on MCO with a scope, and read the RCC registers to confirm the configuration the firmware actually produced.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Register fields and limits follow RM0368 (STM32F401) and RM0090 (STM32F405/407); the timer-clock doubling rule and APB limits are from those manuals' RCC chapters. The interactive and the lab compute from the same formulas; other families (G0, L4, H7) have more clock domains but the same structure.",
  },
  references: [
    { title: "ST RM0368 / RM0090 reference manuals: GPIO (MODER, OTYPER, OSPEEDR, PUPDR, AFRL/AFRH) and RCC (CR, PLLCFGR, CFGR, AHB1ENR, APB1ENR, APB2ENR) chapters", note: "Field definitions, reset values and the clock-tree figure." },
    { title: "ST STM32F401xE datasheet: pinout and alternate-function mapping tables, I/O characteristics", note: "Which AF number routes which peripheral to which pin; speed versus load capacitance." },
    { title: "Lesson: Your first STM32 project", note: "Where the generated MX_GPIO_Init and SystemClock_Config functions come from." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The timer that ran twice as fast",
      body: `A PWM output designed for 20 kHz measures 40 kHz on the scope. The prescaler and period are right for a 42 MHz timer clock, which is the APB1 frequency the engineer read from the clock tab. The timer's clock is not APB1: on an F4, when the APB prescaler is not 1, timers on that bus are clocked at **twice** the bus frequency, 84 MHz. One footnote in the reference manual's clock-tree figure; a factor of two in every timer on the bus.

Next to it, a UART that printed nothing turned out to be a pin left in \`GPIO_MODE_OUTPUT\` instead of alternate function, driving the TX line as a plain output while the USART block toggled nothing. Two configurations, two classic faults; this lesson is both.`,
    },
    {
      type: "concept",
      title: "A GPIO pin's five settings, and the symptom of each one wrong",
      body: `Every pin has five registers' worth of configuration, two bits per pin in each 32-bit register (one bit per pin for OTYPER):

| Setting | Register | Values | Wrong setting shows as |
|---|---|---|---|
| **Mode** | MODER | 00 input, 01 output, 10 alternate function, 11 analogue | Output stuck high or low though the peripheral is "running" (should be AF); a reading that floats (should be input); an ADC channel reading noise (should be analogue, to disconnect the digital input buffer) |
| **Output type** | OTYPER | 0 push-pull, 1 open-drain | An I2C line that cannot be shared or a 5 V device driven at 3.3 V (should be open-drain, logic-levels lesson); a line that only rises slowly because it is open-drain with no pull-up |
| **Speed** | OSPEEDR | 00 low … 11 very high | Edges too slow for a fast SPI clock (increase); ringing, crosstalk and EMI from a slow signal driven at very high speed (decrease). Speed is slew rate, and the datasheet gives it per load capacitance |
| **Pull** | PUPDR | 00 none, 01 up, 10 down | A button input that floats and reads random values (needs a pull); a bus that fights an external pull-up (should be none); 40 kΩ internal pulls that are too weak for I2C (external pull-ups, logic-levels lesson) |
| **Alternate function** | AFRL (pins 0–7), AFRH (pins 8–15) | AF0 … AF15 | USART block alive but the wrong AF number routes the pin to a different peripheral (SPI instead of USART); check the datasheet's AF table for this pin, not a neighbour's |

Three rules. **Enable the port's clock first** (RCC AHB1ENR) or every write is silently ignored. **Analogue mode for ADC inputs and unused pins**: it disconnects the Schmitt input buffer and saves current; unused pins left as floating inputs oscillate and burn microamps (the low-power lesson). **Reset state** is input, no pull, except the SWD pins (PA13/PA14) which are AF with pulls so the debugger works; reconfigure those and you lose the debugger, which is a classic self-inflicted "board does not boot".

The HAL's \`GPIO_InitTypeDef\` is these five fields; \`HAL_GPIO_Init\` writes the five registers with read-modify-write masks. In the debugger's SFR view, \`GPIOA->MODER\` for PA2 (USART2 TX) must read 10 at bits 5:4 and \`AFRL\` must read 7 (AF7 = USART1/2/3 on the F4) at bits 11:8. Thirty seconds of reading beats an hour of speculation.`,
      deeper: {
        title: "Locking and the pin table",
        body: `GPIOx_LCKR locks a pin's configuration until the next reset: used for pins whose misconfiguration would be dangerous (a motor-driver enable). The datasheet's pin table also lists each pin's **additional functions** (ADC channel, wake-up) and whether it is 5 V tolerant (FT) and whether it is on the FSMC or USB. Reading the full row for every pin you use is part of the schematic review lesson's walk.`,
      },
    },
    {
      type: "visual",
      title: "The clock tree, with every divider",
      visual: "clock-tree",
      body: `Choose the source (HSI or HSE), the PLL dividers and the bus prescalers, and read every resulting frequency with its limit: VCO ranges, SYSCLK, HCLK, APB1 and APB2, the timer clocks with the doubling rule, and the SysTick reload. Reproduce the first-project numbers (84 MHz) and then the scenario's timer at 84 MHz on a 42 MHz bus.`,
      caption: `Illustrative calculator for the STM32F4 tree: VCO input 1 to 2 MHz, VCO output 192 to 432 MHz, SYSCLK ≤ 84 MHz (F401) or 168 MHz (F407), APB1 ≤ 42 MHz, APB2 ≤ 84 MHz; timer clock = bus clock × 2 when the bus prescaler is not 1. Other families differ in limits and domains; the structure is the same.`,
    },
    {
      type: "concept",
      title: "Reading the clock tree from the oscillator out",
      body: `The tree has one trunk and many branches:

1. **Sources.** HSI: a 16 MHz internal RC oscillator, ± 1 % after factory trim, always available, what the chip boots on. HSE: an external crystal (4 to 26 MHz) or a clock input (the Nucleo's ST-LINK provides 8 MHz on MCO), ± 20 to 50 ppm, needed for USB, accurate UART at high baud, and anything timed to the outside world. LSI (about 32 kHz, for the independent watchdog, the watchdog lesson's ± 50 % range) and LSE (32.768 kHz crystal for the RTC).
2. **PLL.** Input / **M** must land in 1 to 2 MHz; × **N** must land the VCO in 192 to 432 MHz; / **P** (2, 4, 6, 8) gives the PLL output; / **Q** gives 48 MHz for USB and SDIO. A configuration that violates the ranges may still "work" on the bench and fail at temperature.
3. **SYSCLK** is selected by RCC_CFGR SW from HSI, HSE or PLL, and the switch happens only after the source is ready (RDY flags) and the flash wait states are set for the target frequency (first-project lesson).
4. **HCLK** = SYSCLK / AHB prescaler: the core, the memories, DMA, and the SysTick (HCLK or HCLK/8).
5. **APB1** = HCLK / PPRE1 (≤ 42 MHz on the F401/F4) and **APB2** = HCLK / PPRE2 (≤ 84 MHz): the peripherals are grouped onto the two buses; USART2, I2C, TIM2 to TIM7 on APB1; USART1, SPI1, TIM1, TIM8, ADC on APB2. A peripheral's clock input is its bus clock, **except timers**: if the bus prescaler is 1 the timer clock equals the bus clock; if it is 2 or more, the timer clock is **twice** the bus clock (the scenario). The F4's RCC_DCKCFGR TIMPRE bit changes this rule; read the figure for your part.
6. **Peripheral enables.** Each peripheral has an enable bit in AHB1ENR/APB1ENR/APB2ENR; until it is set, the block is unclocked and its registers read as zero. Every HAL init function starts by setting it.

Arithmetic you should be able to do in your head for your board: HSI 16 → /16 → ×336 → /4 → 84 MHz SYSCLK; HCLK 84; APB1 42, APB2 84; TIM2 (APB1) at 84 MHz because PPRE1 = 2; USART2 (APB1) at 42 MHz; SysTick reload 83 999 for 1 ms. The lab prints exactly these.`,
    },
    {
      type: "concept",
      title: "Verifying the clock you think you have",
      body: `The configuration you wrote and the one the chip is running can differ (a PLL that never locked, a fallback to HSI by the clock security system, a wrong define for HSE_VALUE). Three checks, from cheapest to strongest:

- **Read RCC in the debugger.** \`RCC->CFGR\` SWS bits say which source is actually driving SYSCLK; \`RCC->CR\` has the HSIRDY/HSERDY/PLLRDY flags; \`RCC->PLLCFGR\` has M, N, P, Q as the hardware sees them. If SWS says HSI while you expected PLL, the PLL never became ready and the HAL fell through (or timed out).
- **Compute from the registers**, not from the \`.ioc\`: \`SystemCoreClock\` is a variable the firmware sets from what it *tried* to do; \`HAL_RCC_GetSysClockFreq()\` computes from the registers and is what to print at boot.
- **Put a clock on a pin.** MCO1 (PA8) and MCO2 (PC9) can output HSI, HSE, PLL or SYSCLK divided by 1 to 5; scope it and the frequency is a measurement, not a belief. A 1 % error on an HSI-derived clock is normal; a factor of two is a prescaler; a clock that is exactly 16 MHz when you expected 84 is the fallback.

A UART whose baud is 1 % off because of HSI is fine at 115200 (the UART lesson's tolerance budget); USB needs the 48 MHz from a crystal-fed PLL and fails on HSI; the ADC's sample timing and a timer-based PWM period inherit whatever error the tree carries. Writing the clock tree down for your board, with the measured MCO frequency, is a one-time job that pays back on every peripheral.`,
    },
    {
      type: "example",
      title: "Worked example: three peripherals, three configurations",
      body: `An F401 board at 84 MHz (HSI, PPRE1 = 2, PPRE2 = 1).

| Peripheral | Pins and GPIO settings | Clock input | Derived setting |
|---|---|---|---|
| USART2 at 115200 | PA2, PA3: MODER = AF (10), OTYPER push-pull, OSPEEDR very high, PUPDR none (pull-up on RX if the line can float), AFRL = 7 | APB1 42 MHz | BRR = 0x16D (USARTDIV 22.8125), actual 115 068 baud, −0.11 % |
| TIM2 PWM at 20 kHz, 1000 steps | PA5 as TIM2_CH1: MODER = AF, AFRL = 1 (TIM2 is AF1), speed high | APB1 42 MHz × 2 = **84 MHz** (PPRE1 ≠ 1) | PSC = 4 − 1 = 3, ARR = 1000 − 1 = 999: 84 MHz / 4 / 1000 = 21 kHz; for exactly 20 kHz, PSC = 3 − 1, ARR = 1400 − 1 (84 / 3 / 1400 = 20.000 kHz) |
| ADC1 channel 0 | PA0: MODER = analogue (11), no pull | APB2 84 MHz / ADC prescaler 4 = 21 MHz (≤ 36 MHz limit) | 12-bit conversion in 15 cycles at 21 MHz ≈ 0.71 µs plus sample time |

The scenario's 40 kHz PWM is the second row with the doubling rule missed: PSC and ARR chosen for 42 MHz give 20 kHz × 2. The driver-model lesson's PWM calculator shows the prescaler and period arithmetic; the interactive above shows where the 84 MHz comes from.`,
    },
    {
      type: "lab",
      title: "Run it yourself: every frequency in the tree, from the registers' numbers",
      lab: "c-stm32-arith",
      body: `The same program as the first-project lesson, now read as a clock-tree walk: PLL stages with range checks, HCLK and both APB clocks against their limits, SysTick reload, the USART2 divider with the actual baud and error, and the GPIO register words for PA5. Change PPRE1 to 1 in your head and predict which lines change (and which limit is then violated) before you run anything.`,
      tryNext: `Add the timer-clock rule to the program: print TIM2's clock as APB1 × 2 when PPRE1 ≠ 1, then compute PSC and ARR for exactly 20 kHz with 1000 steps and see whether an integer solution exists at 84 MHz (it does not; the worked example chose 1400 steps for that reason).`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "timer-clock-rule",
        skill: "gpio-clock",
        objective: "Apply the APB timer-clock doubling rule.",
        prompt: `SYSCLK is 168 MHz, AHB prescaler 1, APB1 prescaler 4. What is the clock input to TIM3 (on APB1), in MHz? (Assume the default F4 rule, TIMPRE = 0.)`,
        unit: "MHz",
        answer: 84,
        tolerance: 0,
        solution: `APB1 = 168 / 4 = 42 MHz. The prescaler is not 1, so timers on APB1 run at 2 × 42 = **84 MHz**. A PWM designed for 42 MHz would run twice as fast, the scenario's fault.`,
        solvedFeedback: `Right. Bus clock 42, timer clock 84: the footnote that doubles every timer on a prescaled bus.`,
        misconceptions: [
          { value: 42, tolerance: 0, feedback: `42 MHz is the APB1 bus clock, which USART2 and I2C use. Timers on a bus with prescaler ≠ 1 get twice the bus clock.` },
          { value: 168, tolerance: 0, feedback: `168 MHz is SYSCLK/HCLK. APB1 divides by 4, then the timer rule doubles: 84 MHz.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "register",
        id: "moder-af-pins",
        skill: "gpio-clock",
        objective: "Set two pins to alternate function without touching their neighbours.",
        prompt: `GPIOA_MODER currently has PA5 as output (01) and PA13/PA14 as AF for SWD. Configure **PA2 and PA3** for alternate function (10) so USART2 can drive them, leaving every other pin unchanged.`,
        registerName: "GPIOA_MODER (bits 15:0, pins 0 to 7)",
        width: 16,
        initial: 0x0400,
        target: 0x04A0,
        fields: [
          { name: "MODER0 (PA0)", msb: 1, lsb: 0, description: "00 input" },
          { name: "MODER1 (PA1)", msb: 3, lsb: 2, description: "00 input" },
          { name: "MODER2 (PA2, USART2_TX)", msb: 5, lsb: 4, description: "Set to 10 (alternate function)" },
          { name: "MODER3 (PA3, USART2_RX)", msb: 7, lsb: 6, description: "Set to 10 (alternate function)" },
          { name: "MODER4 (PA4)", msb: 9, lsb: 8, description: "00 input" },
          { name: "MODER5 (PA5, LED)", msb: 11, lsb: 10, description: "01 output: leave it" },
          { name: "MODER6 (PA6)", msb: 13, lsb: 12, description: "00 input" },
          { name: "MODER7 (PA7)", msb: 15, lsb: 14, description: "00 input" },
        ],
        protectedBits: [10, 11],
        solution: `PA2 → bits 5:4 = 10 → bit 5 set; PA3 → bits 7:6 = 10 → bit 7 set. 0x0400 | (1 << 5) | (1 << 7) = **0x04A0**. The AF number itself (7 for USART2) goes into AFRL bits 11:8 and 15:12, a separate register.`,
        solvedFeedback: `Right. Two pins moved to AF, the LED untouched; next the AFRL nibbles select which peripheral.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "gpio-clock-faults",
        skill: "gpio-clock",
        objective: "Match symptoms to pin and clock configuration faults.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "A USART whose TX pin is left in output mode drives a constant level and transmits nothing, although the USART registers show it busy.", correct: true, feedback: `The peripheral toggles its internal signal; the pin is not connected to it until MODER says alternate function and AFR selects it.` },
          { id: "b", text: "RCC->CFGR SWS reading HSI when the firmware configured the PLL means the PLL never became ready and the switch did not happen.", correct: true, feedback: `The switch waits for PLLRDY; on timeout the HAL returns an error that generated code often ignores. Read SWS, not SystemCoreClock.` },
          { id: "c", text: "Unused pins should be left as floating inputs.", correct: false, feedback: `Floating inputs oscillate with noise and consume current; configure them as analogue (or output low) per the vendor's low-power guidance.` },
          { id: "d", text: "The internal pull-ups are suitable as I2C bus pull-ups.", correct: false, feedback: `About 40 kΩ: far too weak for the rise-time budget (logic-levels lesson). Use external 2.2 to 4.7 kΩ.` },
          { id: "e", text: "Putting SYSCLK on MCO and scoping it turns the clock frequency from a belief into a measurement.", correct: true, feedback: `One pin, one scope, one number; the first thing to do when a baud or a PWM is off by a suspicious ratio.` },
        ],
        solvedFeedback: `Right. AF mode connects pins to peripherals; SWS tells the truth; floating pins are a fault; internal pulls are weak; MCO measures.`,
      },
    },
    {
      type: "interview",
      questionId: "clock-tree-walk",
      intro: `Walk the tree from the oscillator to a timer, with the limits at each stage and the doubling rule; then say how you would verify it on the board.`,
    },
    {
      type: "recap",
      summary: `- GPIO: MODER (input/output/AF/analogue), OTYPER (push-pull/open-drain), OSPEEDR (slew), PUPDR, AFRL/AFRH (which peripheral). Port clock first; analogue for ADC and unused pins; do not touch PA13/PA14.
- Clock tree: HSI 16 MHz ±1 % or HSE crystal → PLL (/M to 1–2 MHz, ×N to 192–432 MHz, /P) → SYSCLK (after RDY and flash latency) → HCLK → APB1 (≤42) and APB2 (≤84); peripheral enables per bus.
- Timers on a bus with prescaler ≠ 1 run at twice the bus clock. USART and I2C run at the bus clock.
- Verify: RCC->CFGR SWS and the RDY flags in the debugger; compute from registers (HAL_RCC_GetSysClockFreq), not from SystemCoreClock; scope MCO.`,
      cards: [
        { id: "gc-1", front: "Five GPIO settings and the register for each?", back: "Mode (MODER: input, output, AF, analogue), output type (OTYPER: push-pull/open-drain), speed (OSPEEDR), pull (PUPDR), alternate function number (AFRL/AFRH). Port clock enabled in RCC first." },
        { id: "gc-2", front: "Why did the timer run twice as fast?", back: "On the F4, a timer on a bus whose prescaler is not 1 is clocked at twice the bus frequency: APB1 at 42 MHz gives TIM2 84 MHz. USART and I2C use the bus clock as is." },
        { id: "gc-3", front: "PLL constraints on the F4?", back: "VCO input (source / M) 1 to 2 MHz; VCO output (× N) 192 to 432 MHz; P in {2, 4, 6, 8}; Q gives 48 MHz for USB. Then flash wait states before switching SW; wait for SWS to confirm." },
        { id: "gc-4", front: "How do you verify the clock the chip is really running?", back: "RCC->CFGR SWS (actual source) and RCC->CR RDY flags in the debugger; HAL_RCC_GetSysClockFreq() computed from registers; SYSCLK on MCO (PA8) measured with a scope. SystemCoreClock is what the firmware intended, not what happened." },
      ],
    },
  ],
};
