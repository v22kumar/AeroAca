import type { Lesson } from "@/lib/content/schema";

export const fromResetVectorToMain: Lesson = {
  slug: "from-reset-vector-to-main",
  moduleId: "firmware-arch",
  prerequisites: ["mcu-board-does-not-boot", "embedded-c-register-bit-masks"],
  title: "From reset vector to main(): what startup code does",
  summary: "Between the reset line releasing and your first line of C, a few hundred instructions set the stack, copy initialised data, zero the rest, configure the clock and relocate the vector table. When any of them is skipped, main() runs in a world that lies to it.",
  durationMinutes: 10,
  whyItMatters: "Faults that happen before main() look like black magic until you know the sequence: globals with garbage in them, interrupts landing in the wrong handler after a bootloader jump, a board that runs at 16 MHz when it should run at 168. Interviewers for firmware roles ask 'what happens before main' to see whether you have ever looked.",
  objectives: [
    "Read a Cortex-M vector table: initial stack pointer, reset handler, exception and interrupt vectors, and the Thumb bit.",
    "Explain what the reset handler does in order: .data copy, .bss zero, SystemInit, constructors, main.",
    "Diagnose the three classic pre-main faults: garbage globals, wrong vector table after a jump, wrong clock.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Sequence and addresses follow the ARMv7-M architecture and STM32F4 reference manual and CMSIS startup files (startup_stm32f4xx.s, system_stm32f4xx.c). Addresses are STM32F4 examples; other parts differ.",
  },
  references: [
    { title: "ARMv7-M Architecture Reference Manual, exception model and vector table", note: "Vector table layout, initial SP and reset vector, VTOR." },
    { title: "STM32F405/415, STM32F407/417 reference manual", id: "RM0090", note: "Boot configuration (BOOT pins, memory aliasing at 0x0000 0000), RCC reset state." },
    { title: "CMSIS-Core device startup and system files", note: "Reset_Handler, SystemInit, __libc_init_array conventions used by vendor templates." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The counter that started at 0x5A3C",
      body: `A bootloader validates the application image, then jumps to it. The application has a global \`uint32_t samples = 0;\` and a UART that prints it every second. The first print says **23100**. Not zero. Then the UART interrupt stops working, and the board runs at a quarter of the expected speed.

Three faults, one cause: the bootloader jumped to \`main()\` directly, skipping the application's reset handler. Nothing zeroed \`samples\`, nothing moved the vector table, nothing configured the clock. This lesson is what the reset handler would have done.`,
    },
    {
      type: "concept",
      title: "The vector table",
      body: `On a Cortex-M, the first thing the core does after reset is read **two words** from address 0x0000 0000:

- word 0: the **initial main stack pointer** (MSP), typically the top of RAM, e.g. 0x2002 0000 on a part with 128 KB of RAM starting at 0x2000 0000;
- word 1: the **reset vector**, the address of \`Reset_Handler\` with bit 0 set (the **Thumb bit**; the instruction itself sits at the even address).

The words after that are exception handlers (NMI, HardFault, SVC, PendSV, SysTick) and then one vector per peripheral interrupt. On STM32, 0x0000 0000 is an alias: the BOOT pins choose whether it maps to flash at 0x0800 0000, system memory (the ROM bootloader) or SRAM. So the table you wrote lives at 0x0800 0000 and the core sees it at 0.

The **VTOR** register (Vector Table Offset Register) tells the core where to find the table *after* boot. It resets to 0; a program placed anywhere else, such as an application behind a bootloader at 0x0800 8000, must set VTOR to its own table or every interrupt goes to the bootloader's handlers.`,
      deeper: {
        title: "Why bit 0?",
        body: `Cortex-M executes only Thumb code. A branch to an address with bit 0 clear is an attempt to switch to ARM state, which the core cannot do, so it raises a fault (INVSTATE in the usage-fault status). That is why vector tables and function pointers to handlers have odd addresses, and why a bootloader that jumps with a clean even address faults immediately.`,
      },
    },
    {
      type: "visual",
      title: "What moves before main()",
      visual: "startup-sequence",
      body: `Step through the reset handler. Flash holds the code and the *initial values* of initialised globals; RAM holds the globals themselves, uninitialised at power-up. Watch what each step fills in.`,
      caption: `Illustrative memory map for an STM32F4 (flash at 0x0800 0000, RAM at 0x2000 0000). Section sizes are not to scale.`,
    },
    {
      type: "concept",
      title: "The reset handler, in order",
      body: `A vendor \`Reset_Handler\` (assembly, a few dozen lines) does the following, and the order matters:

1. **Optionally set SP again** from the vector table, so the handler works when entered by a jump rather than a reset.
2. **Copy .data**: initialised globals (\`int x = 5;\`) live in RAM at run time, but their initial values are stored in flash by the linker. The handler copies them from the flash **load address** to the RAM **run address**. The linker script defines both and the symbols \`_sdata\`, \`_edata\`, \`_sidata\` that the loop uses.
3. **Zero .bss**: uninitialised and zero-initialised globals (\`int count;\`, \`int n = 0;\`) are placed in .bss, which takes no flash space and is cleared with a loop from \`_sbss\` to \`_ebss\`. C guarantees these start at zero only because this loop runs.
4. **Call SystemInit()**: configures the clock tree (switch from the 16 MHz HSI the chip wakes on to the PLL at 168 MHz), enables the FPU access bits, and on most vendor files sets VTOR to the table's address.
5. **Call __libc_init_array()**: runs C++ static constructors and any \`__attribute__((constructor))\` functions.
6. **Call main()**. If main ever returns, the handler loops for ever or resets.

The three scenario faults map directly: skipped step 3 (garbage globals), skipped step 4's VTOR write (interrupts in the wrong table), skipped step 4's clock setup (16 MHz HSI). A bootloader must therefore jump to the **reset handler** read from the application's vector table, after setting MSP from word 0, not to main.`,
    },
    {
      type: "example",
      title: "Worked example: a correct jump from a bootloader",
      body: `Application at 0x0800 8000. The bootloader has verified its CRC.

\`\`\`c
typedef void (*entry_t)(void);
uint32_t sp    = *(volatile uint32_t *)0x08008000u;        /* word 0: initial MSP */
uint32_t entry = *(volatile uint32_t *)0x08008004u;        /* word 1: Reset_Handler | 1 */
__disable_irq();                                           /* no interrupt during the switch */
/* deinit peripherals the bootloader used: stop SysTick, disable UART IRQ, etc. */
SCB->VTOR = 0x08008000u;                                   /* interrupts now use the app's table */
__set_MSP(sp);
((entry_t)entry)();                                        /* never returns */
\`\`\`

Sanity checks before jumping: word 0 is inside RAM (0x2000 0000 to 0x2002 0000) and word 1 is inside the application's flash range with bit 0 set. An erased sector reads 0xFFFF FFFF for both, and those checks are what stop a jump into nothing.

The application's own reset handler then copies .data, zeroes .bss and calls SystemInit, which sets VTOR again (harmless) and the clock. Interrupts are re-enabled by the application when it is ready.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "startup-order",
        skill: "startup",
        objective: "Order the reset handler's work.",
        prompt: `Put the steps of a Cortex-M reset handler in the order they run.`,
        items: [
          { id: "sp", text: "Core loads the initial MSP from word 0 of the vector table", why: "Hardware does this before any instruction executes." },
          { id: "data", text: "Copy .data initial values from flash to RAM", why: "Initialised globals must have their values before anything reads them." },
          { id: "bss", text: "Zero .bss", why: "Zero-initialised and uninitialised globals must be cleared before use." },
          { id: "sysinit", text: "SystemInit: clock tree, FPU, VTOR", why: "Done after memory is valid, before C code that depends on the clock." },
          { id: "ctor", text: "__libc_init_array: C++ constructors", why: "Constructors may use globals and the clock, so they run after both are set." },
          { id: "main", text: "main()", why: "Your code, last." },
        ],
        correctOrder: ["sp", "data", "bss", "sysinit", "ctor", "main"],
        solvedFeedback: `Correct. Stack first (hardware), then memory (data copy, bss zero), then the system (clock, VTOR), then constructors, then main.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "garbage-global-cause",
        skill: "startup",
        objective: "Diagnose garbage in a global at the start of main.",
        prompt: `After a bootloader jump, \`uint32_t samples = 0;\` reads 23100 at the first line of \`main()\`. The same firmware flashed at 0x0800 0000 without the bootloader reads 0. What is the most likely cause?`,
        options: [
          { id: "a", text: "The bootloader jumped to main() directly, so the application's .bss was never zeroed.", correct: true, feedback: `Yes. A zero-initialised global lives in .bss; it is zero only because the reset handler clears it. Jumping past the reset handler leaves whatever the bootloader left in that RAM.` },
          { id: "b", text: "The variable should have been declared volatile.", correct: false, feedback: `volatile changes how the compiler reads the variable, not whether RAM was initialised.` },
          { id: "c", text: "The flash sector holding the initial value is corrupt.", correct: false, feedback: `A zero-initialised global has no stored initial value; it is in .bss, not .data, so there is nothing in flash to corrupt.` },
          { id: "d", text: "The stack overflowed into the global.", correct: false, feedback: `Possible in general, but it would not disappear when the same firmware runs without the bootloader, and the value appears at the very first line of main.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "bootloader-jump-checks",
        skill: "startup",
        objective: "Know what a safe jump requires.",
        prompt: `Select **every** step a bootloader must take before and during a jump to an application at 0x0800 8000.`,
        options: [
          { id: "a", text: "Read the initial MSP from 0x0800 8000 and set MSP to it.", correct: true, feedback: `Word 0 of the application's table is its stack top; the hardware would have done this on a real reset.` },
          { id: "b", text: "Jump to the address in 0x0800 8004 (the reset handler), not to main.", correct: true, feedback: `The reset handler does the .data copy, .bss zero and SystemInit the application relies on.` },
          { id: "c", text: "Set VTOR to 0x0800 8000 so interrupts use the application's table.", correct: true, feedback: `Otherwise every interrupt lands in the bootloader's handlers, which no longer own the peripherals.` },
          { id: "d", text: "Disable interrupts and quiesce peripherals the bootloader used before jumping.", correct: true, feedback: `A SysTick or UART interrupt arriving mid-switch, with the old table and the new stack, is a HardFault.` },
          { id: "e", text: "Erase the bootloader's own sector to free flash.", correct: false, feedback: `Never. The bootloader is the recovery path; erasing it bricks the unit.` },
        ],
        solvedFeedback: `Right. Stack from word 0, entry from word 1, VTOR to the new table, interrupts off and peripherals quiet across the switch, bootloader left intact.`,
      },
    },
    {
      type: "interview",
      questionId: "startup-before-main",
      intro: `Walk through the sequence and then name one fault for each skipped step. Interviewers want the order and the why, not the assembly.`,
    },
    {
      type: "recap",
      summary: `- Vector table: word 0 initial MSP, word 1 reset handler with the Thumb bit set, then exception and interrupt vectors. VTOR points the core at it.
- Reset handler: copy .data (flash → RAM), zero .bss, SystemInit (clock, FPU, VTOR), constructors, main.
- Garbage in a zero-initialised global at the top of main means .bss was never zeroed; interrupts in the wrong handler after a jump means VTOR was never set; a slow board means SystemInit never ran.
- A bootloader jumps to the application's reset handler with MSP from word 0, VTOR set and interrupts off, and never erases itself.`,
      cards: [
        { id: "start-1", front: "First two words of a Cortex-M vector table?", back: "Word 0: initial main stack pointer. Word 1: address of Reset_Handler with bit 0 (Thumb) set." },
        { id: "start-2", front: "What does the reset handler do, in order?", back: "Copy .data from flash to RAM, zero .bss, SystemInit (clock, FPU, VTOR), run constructors, call main." },
        { id: "start-3", front: "A zero-initialised global reads garbage at main() after a bootloader jump. Why?", back: ".bss was never zeroed: the bootloader jumped to main instead of the application's reset handler." },
        { id: "start-4", front: "Why must a bootloader set VTOR before jumping?", back: "The core looks up interrupt handlers through VTOR; left at the bootloader's table, every interrupt runs the bootloader's handlers." },
      ],
    },
  ],
};
