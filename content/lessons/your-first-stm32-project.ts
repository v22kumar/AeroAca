import type { Lesson } from "@/lib/content/schema";

export const yourFirstStm32Project: Lesson = {
  slug: "your-first-stm32-project",
  moduleId: "mcu",
  prerequisites: ["mcu-board-does-not-boot", "embedded-c-register-bit-masks", "c-foundations-for-firmware"],
  title: "Your first STM32 project: from CubeMX to a toggling pin, and what the generated code did",
  summary: "The path from an empty Nucleo board to a pin that toggles under your control, with every generated file explained rather than trusted: the clock and pin configuration, the HAL call that writes the register you met in the bit-masks lesson, flashing and halting with the debugger, and the printf-over-UART that turns the board into a bench instrument.",
  durationMinutes: 12,
  whyItMatters: "Every STM32 role expects you to create a project, configure a pin and a clock, flash it and look at it in the debugger without help. Interviewers ask what HAL_GPIO_WritePin actually does and where the 16 MHz came from; the engineer who has read the generated code once answers both.",
  objectives: [
    "Create a CubeMX/CubeIDE project for a Nucleo board, configure one GPIO output and one UART, and know what each generated file is for.",
    "Trace HAL_GPIO_WritePin down to the BSRR register write, and the SystemClock_Config function down to the RCC registers.",
    "Build, flash and debug: set a breakpoint, step, inspect a register in the peripheral view, and read the fault registers when it stops unexpectedly.",
    "Redirect printf to the UART so the board reports in text, and verify the toggle rate with a scope or logic analyser rather than by eye.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Steps follow STM32CubeIDE and STM32CubeMX user manuals (UM2609, UM1718) and the STM32F4 HAL description (UM1725) for the F401/F446 Nucleo boards; register names from RM0090/RM0368. The tool route is documented from the vendor's instructions and is not executed in the academy's CI, which has no target toolchain or board; the host-runnable lab exercises the same register arithmetic.",
  },
  references: [
    { title: "ST UM2609: STM32CubeIDE user guide", id: "UM2609", note: "Project creation, build, debug perspective, SFR (peripheral register) view." },
    { title: "ST UM1718: STM32CubeMX user manual", id: "UM1718", note: "Pinout, clock configuration tab, code generation options." },
    { title: "ST UM1725: Description of STM32F4 HAL and low-layer drivers", id: "UM1725", note: "HAL_GPIO_WritePin, HAL_UART_Transmit, HAL_Delay, the Init structures." },
    { title: "ST RM0368 (STM32F401) / RM0090 (STM32F405/407/415/417) reference manuals", note: "GPIO BSRR/MODER, RCC_CR/CFGR/PLLCFGR, USART registers." },
    { title: "docs/LOCAL_LAB.md in this repository", note: "Toolchain installation; the STM32 route is documented, not verified in CI." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The project that worked and taught nothing",
      body: `A new engineer follows a tutorial: CubeMX, tick a pin, generate, paste \`HAL_GPIO_TogglePin\` and \`HAL_Delay(500)\` into the loop, flash. The LED blinks. Asked in a review what clock the core runs at, where the 500 ms comes from, and what the toggle call writes, she cannot say; asked why the blink is 503 ms on the scope, she has no idea where to look.

The board is the same board the senior engineer uses. The difference is whether the generated code was read. This lesson creates the same project and reads it.`,
    },
    {
      type: "concept",
      title: "Creating the project, and what the tool generated",
      body: `In CubeIDE: **File → New → STM32 Project**, select the board (Board Selector tab, "NUCLEO-F401RE" or whichever Nucleo you have; the board definition pre-wires the LED on PA5, the user button on PC13, and USART2 on PA2/PA3 to the ST-LINK's virtual COM port). Accept the default peripheral initialisation. In the **Pinout** view confirm PA5 is \`GPIO_Output\` (label LD2) and USART2 is Asynchronous. In the **Clock Configuration** tab, note the numbers: the Nucleo-F401 default is HSI (16 MHz internal RC) feeding the PLL to give 84 MHz SYSCLK, with HSE (from the ST-LINK's 8 MHz MCO) available if you select it. **Project → Generate Code** (Alt-K).

The tree it produces, and what each part is:

| Path | What it is | Who edits it |
|---|---|---|
| \`Core/Src/main.c\` | \`main()\`: HAL_Init, SystemClock_Config, MX_GPIO_Init, MX_USART2_UART_Init, then your loop between \`USER CODE BEGIN/END\` markers | you, only between the markers (regeneration keeps them) |
| \`Core/Src/stm32f4xx_hal_msp.c\` | low-level init called by the HAL: enables the USART clock, puts PA2/PA3 into alternate function 7 | generated |
| \`Core/Src/stm32f4xx_it.c\` | interrupt handlers (SysTick_Handler calls HAL_IncTick) | you, for your own ISRs |
| \`Core/Src/system_stm32f4xx.c\` | \`SystemInit\` (runs before main: FPU, vector table offset) and \`SystemCoreClock\` | generated |
| \`Core/Startup/startup_stm32f401retx.s\` | the reset handler and vector table from the startup lesson | generated |
| \`Drivers/STM32F4xx_HAL_Driver/\` | the HAL: C functions over the registers | never |
| \`Drivers/CMSIS/\` | Arm core headers and the device header with every register as a struct (the pointers lesson's overlay pattern) | never |
| \`STM32F401RETX_FLASH.ld\` | the linker script: flash and RAM origins and sizes, section placement, \`_Min_Stack_Size\` | you, when you need to |
| \`*.ioc\` | the CubeMX configuration; regenerate from it, never hand-edit | the tool |

The **USER CODE** markers are the contract: code outside them is overwritten on the next generate. Keep your own modules in separate files under \`Core/Src\` and call them from inside the markers.`,
      deeper: {
        title: "HAL, LL and bare registers",
        body: `The HAL (hardware abstraction layer) is portable across STM32 families and verbose; the LL (low-layer) drivers are thin inline wrappers close to the registers; bare register writes through the CMSIS struct are what both compile to. A project can mix them. Read the HAL once so you know what it does, use it where its portability helps (initialisation, UART, I2C), and drop to LL or registers where its overhead matters (an ISR that must take two microseconds). The module 7 layering lesson covers where each belongs.`,
      },
    },
    {
      type: "concept",
      title: "Reading two generated functions down to the registers",
      body: `**The pin.** \`MX_GPIO_Init\` enables the GPIOA clock (\`__HAL_RCC_GPIOA_CLK_ENABLE()\`, which sets bit 0 of \`RCC->AHB1ENR\`: the peripheral-clock rule from the glossary) and fills a \`GPIO_InitTypeDef\` (Pin = GPIO_PIN_5, Mode = GPIO_MODE_OUTPUT_PP, Pull = GPIO_NOPULL, Speed = LOW) and calls \`HAL_GPIO_Init\`, which performs the read-modify-write on \`GPIOA->MODER\` (bits 11:10 = 01, output) and \`OTYPER\`, \`OSPEEDR\`, \`PUPDR\` that the bit-masks lesson's register exercise had you do by hand. Then

\`\`\`c
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);   /* -> GPIOA->BSRR = GPIO_PIN_5;         */
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET); /* -> GPIOA->BSRR = GPIO_PIN_5 << 16;   */
HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);                 /* -> reads ODR, writes BSRR with set and reset halves */
\`\`\`

The set/reset register is the atomic write from the bit-masks lesson's "safe alternatives"; that is why the HAL uses it. Open \`stm32f4xx_hal_gpio.c\` and read the four lines of \`HAL_GPIO_WritePin\`; it is shorter than this paragraph.

**The clock.** \`SystemClock_Config\` fills \`RCC_OscInitTypeDef\` (HSI on, PLL on, source HSI, PLLM = 16, PLLN = 336, PLLP = 4, PLLQ = 7) and \`RCC_ClkInitTypeDef\` (SYSCLK from PLL, AHB /1, APB1 /2, APB2 /1, flash latency 2 wait states). The arithmetic: 16 MHz / M 16 = 1 MHz into the PLL; × N 336 = 336 MHz VCO; / P 4 = **84 MHz** SYSCLK; APB1 = 42 MHz (its limit), APB2 = 84 MHz. \`HAL_RCC_OscConfig\` writes \`RCC->PLLCFGR\` and waits for \`PLLRDY\` in \`RCC->CR\` (the crystal-ready wait from the board-does-not-boot lesson, here for the PLL); \`HAL_RCC_ClockConfig\` sets the flash latency first (running 84 MHz with 0 wait states faults), then switches \`RCC->CFGR\` SW bits to the PLL and waits for SWS to confirm. \`SystemCoreClock\` is updated to 84 000 000 and \`HAL_InitTick\` reprograms SysTick for a 1 ms interrupt, which is what \`HAL_Delay\` counts. The GPIO-and-clock-tree lesson has a calculator for these dividers.`,
    },
    {
      type: "concept",
      title: "Build, flash, debug, and the fault you will meet",
      body: `**Build** (the hammer): the console ends with the \`arm-none-eabi-size\` line from the memory lesson: text, data, bss. Read it every build; a jump in bss is a new buffer. **Debug** (the bug icon) flashes the image through the ST-LINK over SWD and stops at the first line of \`main\`. Resume (F8) and the LED blinks; pause and the program counter is inside \`HAL_Delay\`, where it spends almost all its time.

The debug perspective has what you need: **Breakpoints** (double-click a line; set one on the toggle and resume to see it hit every 500 ms), **Variables** and **Expressions**, the **SFRs** view (the peripheral registers live: watch \`GPIOA->ODR\` bit 5 change as you step), and **Registers** for the core (PC, SP, xPSR). Step over (F6) a HAL call and read ODR before and after: the lesson's whole claim about BSRR is verifiable in ten seconds.

The fault you will meet first: the program stops in \`HardFault_Handler\`, an infinite loop in \`stm32f4xx_it.c\`. Open the **Fault Analyzer** view (or read \`SCB->CFSR\`): it names the cause (a precise bus fault at an address, an unaligned access, a usage fault from an undefined instruction) and the faulting address. The three usual causes at this stage are a peripheral used before its clock was enabled (reads return zero or fault), a stack overflow from the memory lesson, and a pointer to a peripheral that this part does not have. The debugging lesson in module 7 goes from the fault registers to the faulting line.

**Verify with an instrument, not an eye.** Scope PA5 (Arduino header D13 on a Nucleo): the period is 1000 ms ± the SysTick's tolerance plus the loop's own time, so 1003 ms is normal and 1000.0 is suspicious; the HSI is ± 1 % so an HSI-clocked UART is at the edge of the baud-tolerance budget from the UART lesson, which is the reason to move to HSE for serial work.`,
    },
    {
      type: "example",
      title: "Worked example: printf over the UART, and the loop without delays",
      body: `Add to \`main.c\` inside the user-code markers:

\`\`\`c
/* USER CODE BEGIN 0 */
#include <stdio.h>
int _write(int fd, char *buf, int len) {            /* newlib calls this for printf */
    (void)fd;
    HAL_UART_Transmit(&huart2, (uint8_t *)buf, (uint16_t)len, 100);
    return len;
}
/* USER CODE END 0 */
\`\`\`

\`\`\`c
/* USER CODE BEGIN WHILE */
uint32_t last_toggle = HAL_GetTick(), last_log = last_toggle;
printf("boot: SYSCLK %lu Hz, reset cause 0x%08lX\\r\\n", SystemCoreClock, RCC->CSR);
RCC->CSR |= RCC_CSR_RMVF;                             /* clear the reset flags, as the watchdog lesson said */
while (1) {
    uint32_t now = HAL_GetTick();
    if (now - last_toggle >= 500u) { HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5); last_toggle = now; }
    if (now - last_log >= 1000u) { printf("t=%lu ms, ODR5=%lu\\r\\n", now, (GPIOA->ODR >> 5) & 1u); last_log = now; }
}
/* USER CODE END WHILE */
\`\`\`

Three things this version does that the tutorial's did not: it prints the clock and the reset cause at boot, so the board tells you what it is; it uses the wrap-safe elapsed pattern from the fixed-width lesson instead of \`HAL_Delay\`, so the loop never blocks and a second job fits; and the log line is evidence you can paste into a test record. Open the ST-LINK's virtual COM port at 115200 8N1 in any terminal and watch it. If the terminal shows garbage, the UART lesson's baud-tolerance diagnosis applies, and the HSI's ± 1 % is the first suspect.

The lab below cannot flash a board from the academy's CI, so it does the part that is pure arithmetic: the PLL and bus dividers, the SysTick reload for 1 ms, and the BSRR values for set, reset and toggle, printed by a host program whose output you compare against the register view in the debugger.`,
    },
    {
      type: "lab",
      title: "Run it yourself: the clock arithmetic and the register values, on the host",
      lab: "c-stm32-arith",
      body: `A host program with the same numbers CubeMX generated: PLL M/N/P from a 16 MHz HSI, the resulting SYSCLK and APB clocks, the SysTick reload for a 1 ms tick, the USART2 baud-rate register for 115200 at 42 MHz with the resulting actual baud and error, and the BSRR words for setting, resetting and toggling PA5 from a given ODR. Compare each value with what the debugger's SFR view shows on the board. Nothing here needs hardware; everything here is checked against the board when you have one.`,
      tryNext: `Change HSI to HSE 8 MHz with M = 8 and recompute. Then change the target SYSCLK to 100 MHz with the same VCO rules (VCO input 1 to 2 MHz, VCO output 192 to 432 MHz, P in {2, 4, 6, 8}) and see which N and P satisfy them; then check APB1 stays at or below 42 MHz.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "pll-sysclk",
        skill: "stm32-project",
        objective: "Compute SYSCLK from the PLL settings.",
        prompt: `HSI is 16 MHz. The PLL is configured with M = 16, N = 336, P = 4. What is SYSCLK in MHz?`,
        unit: "MHz",
        answer: 84,
        tolerance: 0,
        solution: `16 / 16 = 1 MHz into the VCO; × 336 = 336 MHz; / 4 = **84 MHz**. With P = 2 it would be 168 MHz, which the F401 cannot run; the F407 can.`,
        solvedFeedback: `Right. Divide by M, multiply by N, divide by P, and check the part's maximum.`,
        misconceptions: [
          { value: 336, tolerance: 0, feedback: `336 MHz is the VCO output, before the P divider. SYSCLK is VCO / P.` },
          { value: 21, tolerance: 0, feedback: `You divided by both M and P and multiplied by nothing; the sequence is / M, × N, / P.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "hal-writepin",
        skill: "stm32-project",
        objective: "Know what HAL_GPIO_WritePin writes.",
        prompt: `What does \`HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_RESET)\` compile down to on an STM32F4?`,
        options: [
          { id: "a", text: "A single store to GPIOA->BSRR with bit 21 set (pin 5 in the reset half), which clears ODR bit 5 atomically without a read-modify-write", correct: true, feedback: `Yes: the set/reset register, so an interrupt between a read and a write cannot lose another pin's state.` },
          { id: "b", text: "A read-modify-write of GPIOA->ODR clearing bit 5", correct: false, feedback: `That is what naive code does and what the bit-masks lesson warned about. The HAL uses BSRR precisely to avoid it.` },
          { id: "c", text: "A write to GPIOA->MODER changing the pin to input", correct: false, feedback: `MODER selects the pin's mode; the pin stays an output. Only its level changes.` },
          { id: "d", text: "A call into the bootloader's GPIO service", correct: false, feedback: `The HAL is ordinary C compiled into your image; there is no service layer on a bare-metal STM32.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "first-project-rules",
        skill: "stm32-project",
        objective: "Apply the rules of working with generated code.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "Code placed outside the USER CODE markers in main.c is overwritten the next time CubeMX regenerates.", correct: true, feedback: `The markers are the contract; keep your modules in separate files and call them from inside the markers.` },
          { id: "b", text: "A peripheral's registers can be read and written before its clock is enabled in RCC.", correct: false, feedback: `Reads return zero or the access faults; enabling the peripheral clock is the first line of every init function for a reason.` },
          { id: "c", text: "Flash wait states must be raised before switching SYSCLK to a higher frequency.", correct: true, feedback: `HAL_RCC_ClockConfig does it in that order; the reverse faults because flash cannot keep up.` },
          { id: "d", text: "A blink period of 1003 ms measured on a scope means the SysTick is broken.", correct: false, feedback: `HAL_Delay and the elapsed pattern both have a tick of granularity plus the loop's own time; a few milliseconds is normal. A 1 % error across a long interval would point at the HSI's tolerance.` },
          { id: "e", text: "The program counter stopping in HardFault_Handler is diagnosed from SCB->CFSR and the fault address registers, not by guessing.", correct: true, feedback: `The Fault Analyzer view reads them for you; the debugging lesson goes from there to the faulting line.` },
        ],
        solvedFeedback: `Right. Markers, clock before access, wait states before speed, instruments over eyes, fault registers over guesses.`,
      },
    },
    {
      type: "interview",
      questionId: "first-stm32-project",
      intro: `Walk through creation, the two generated functions down to their registers, flashing and the debugger, and how you verified the pin and the clock with an instrument.`,
    },
    {
      type: "recap",
      summary: `- CubeIDE project from the board selector; generated tree: main.c (your code between USER CODE markers), msp (low-level init), it.c (handlers), system file (SystemInit, SystemCoreClock), startup assembly, HAL, CMSIS, linker script, .ioc.
- MX_GPIO_Init enables the port clock in RCC and writes MODER/OTYPER/OSPEEDR/PUPDR; HAL_GPIO_WritePin is one store to BSRR (atomic). SystemClock_Config: HSI 16 / M 16 × N 336 / P 4 = 84 MHz; flash wait states before the switch; SysTick reprogrammed for 1 ms.
- Build and read the size line; debug over SWD, breakpoints, SFR view to watch ODR; HardFault → CFSR and fault address.
- printf through _write to the UART; wrap-safe elapsed loop instead of HAL_Delay; verify the toggle and the baud with a scope, and expect HSI's ±1 % in the UART budget.`,
      cards: [
        { id: "stm-1", front: "What does HAL_GPIO_WritePin do, and why that way?", back: "One store to GPIOx->BSRR: the pin's bit in the low half sets, in the high half (bit + 16) resets. Atomic, so no read-modify-write hazard with interrupts. HAL_GPIO_Init did the MODER/OTYPER/OSPEEDR/PUPDR configuration after enabling the port clock in RCC." },
        { id: "stm-2", front: "SYSCLK from HSI 16 MHz, M 16, N 336, P 4?", back: "16/16 = 1 MHz VCO input; ×336 = 336 MHz VCO; /4 = 84 MHz. APB1 /2 = 42 MHz (its limit on the F401). Flash latency raised before the switch; SysTick set for 1 ms." },
        { id: "stm-3", front: "What is overwritten on regeneration?", back: "Everything in generated files outside the USER CODE BEGIN/END markers. Keep your modules in their own files and call them from inside the markers; never hand-edit the .ioc." },
        { id: "stm-4", front: "First three causes of a HardFault in a new project?", back: "A peripheral accessed before its clock was enabled, a stack overflow (memory lesson), a pointer to a peripheral this part lacks. Read SCB->CFSR and the fault address in the Fault Analyzer, then the debugging lesson's procedure." },
      ],
    },
  ],
};
