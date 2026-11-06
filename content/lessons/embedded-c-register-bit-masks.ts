import type { Lesson } from "@/lib/content/schema";

export const embeddedCRegisterBitMasks: Lesson = {
  slug: "embedded-c-register-bit-masks",
  moduleId: "embedded-c",
  prerequisites: [],
  title: "Register bit masks: read, modify, write safely",
  summary: "Every peripheral is configured by bits in memory-mapped registers. Learn to read a bit-field definition, change exactly the bits you mean to, and know when a read-modify-write is not safe.",
  durationMinutes: 10,
  whyItMatters: "Register bit manipulation and the meaning of volatile come up in nearly every embedded C interview, often as a short coding exercise. Mastering them also makes datasheets and HAL source code readable instead of intimidating.",
  objectives: [
    "Set, clear, toggle and test individual bits and multi-bit fields with masks, without disturbing neighbouring bits.",
    "Explain what `volatile` guarantees for a hardware register and what it does not.",
    "Identify when a read-modify-write sequence can lose an update and name two ways to avoid it.",
  ],
  review: {
    status: "technically-reviewed",
    note: "GPIO register layout follows the STM32F4 reference manual (RM0090, GPIO MODER and BSRR). C semantics follow ISO C; the compiler behaviour described is standard optimiser behaviour.",
  },
  references: [
    {
      title: "STM32F4 reference manual, GPIO registers (MODER, ODR, BSRR)",
      id: "RM0090",
      url: "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
    },
    {
      title: "Arm Cortex-M4 Devices Generic User Guide",
      note: "Bit-banding region and exclusive access (LDREX/STREX) as atomic alternatives to read-modify-write.",
      url: "https://developer.arm.com/documentation/dui0553/latest/",
    },
    {
      title: "CMSIS-Core register definitions",
      note: "The `_Pos` and `_Msk` naming convention used by vendor headers.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "One line of C, one dead sensor",
      body: `A bring-up firmware configures an LED on PA5 as an output with this line:

\`\`\`c
GPIOA->MODER = 0x00000400;
\`\`\`

The LED works. But the debug UART on PA2/PA3 goes silent, and after the next reset the debugger can no longer attach through the SWD pins on PA13/PA14.

The line did exactly what it says: it wrote the whole 32-bit register, so every other pin on port A became an input, including the alternate-function pins for UART and the debug port. The author meant to change two bits and changed thirty-two.

This lesson is about saying precisely what you mean to hardware.`,
    },
    {
      type: "concept",
      title: "Registers, fields and masks",
      body: `A peripheral register is a fixed address in memory. Vendor headers describe it as a struct of \`volatile uint32_t\` members at a base address, so \`GPIOA->MODER\` is the 32-bit word at base + 0x00.

Inside, bits are grouped into **fields**. STM32 GPIO \`MODER\` uses two bits per pin: for pin *n*, bits [2n+1 : 2n], with values 00 input, 01 general-purpose output, 10 alternate function, 11 analogue. Pin 5 therefore owns bits 11:10.

The four operations you need, with \`m\` as a mask of the bits you care about:

| Intent | Code | Note |
|---|---|---|
| Set bits | \`reg \\|= m;\` | Only bits in \`m\` change, to 1 |
| Clear bits | \`reg &= ~m;\` | Only bits in \`m\` change, to 0 |
| Toggle bits | \`reg ^= m;\` | |
| Test a bit | \`if (reg & m)\` | Do not compare against 1; compare against 0 or against \`m\` |
| Write a field | \`reg = (reg & ~m) \\| ((v << pos) & m);\` | Clear the field, then insert the new value |
| Read a field | \`(reg & m) >> pos\` | |

Build masks from positions, and keep them unsigned: \`(1u << 31)\` is fine, \`(1 << 31)\` is undefined behaviour for a 32-bit \`int\`. CMSIS headers give you both pieces for every field, for example \`GPIO_MODER_MODER5_Pos\` (10) and \`GPIO_MODER_MODER5_Msk\` (0x3u << 10).`,
      deeper: {
        title: "Why vendor headers use _Pos and _Msk",
        body: `Writing \`(reg & GPIO_MODER_MODER5_Msk) >> GPIO_MODER_MODER5_Pos\` looks verbose, but it has two properties a bare \`0x400\` does not: a reviewer can see *which* field you mean, and if the field moves in a different device in the family, the header changes, not your code.

The pattern generalises to any field width. For a 3-bit field at position 4: mask = \`0x7u << 4\`; write value 5 = \`reg = (reg & ~(0x7u << 4)) | (5u << 4)\`. Always mask the shifted value too when the value comes from a variable, so an out-of-range value cannot spill into the neighbouring field.`,
      },
    },
    {
      type: "visual",
      title: "Watch the bits move",
      visual: "register-bits",
      body: `This is the low half of GPIOA MODER, pins 0 to 7. Tap bits to change them and watch the hex value and the equivalent C expression update. Try setting pin 5 to output (01) without touching anything else.`,
      caption: `Each pin owns a two-bit field. A whole-register write replaces all eight fields at once; a masked read-modify-write replaces only one.`,
    },
    {
      type: "concept",
      title: "What volatile does, and does not do",
      body: `Declare hardware registers as \`volatile\`. It tells the compiler that every read and write has an effect it cannot see, so it must perform each access exactly as written: no caching the value in a register, no deleting a "redundant" write, no hoisting a read out of a loop.

Without it, this common wait loop can become infinite:

\`\`\`c
uint32_t *sr = (uint32_t *)0x40011000;   /* missing volatile */
while (!(*sr & 0x80)) { }                 /* compiler may read once and spin forever */
\`\`\`

With \`volatile uint32_t *\` the compiler re-reads the status register on every iteration.

Three things \`volatile\` does **not** do:

1. It does not make an access **atomic**. \`reg |= m\` is still three instructions: load, OR, store.
2. It does not order accesses against **non-volatile** code or guarantee the hardware has finished acting on a write. Some registers need a read-back or a barrier (\`__DSB()\`) before you depend on the effect.
3. It does not protect against **side-effect reads**. Reading a data register may clear a flag or pop a FIFO; an innocent debugger watch window can do that too.`,
    },
    {
      type: "visual",
      title: "The read-modify-write hazard",
      visual: "rmw-hazard",
      body: `Step through what happens when an interrupt fires between the load and the store of \`GPIOA->ODR |= (1u << 5)\`, while the interrupt handler does \`GPIOA->ODR |= (1u << 6)\`.`,
      caption: `The main-line code stores a stale copy of ODR and silently undoes the interrupt's change. Nothing crashes; a pin is just wrong.`,
    },
    {
      type: "example",
      title: "Safe alternatives to read-modify-write",
      body: `**Use set/reset registers where the hardware provides them.** STM32 GPIO has \`BSRR\`: writing a 1 to bit *n* sets output *n*, writing a 1 to bit *n*+16 resets it, and zeros do nothing. A single store, no read, nothing to interrupt.

\`\`\`c
GPIOA->BSRR = (1u << 5);          /* PA5 high */
GPIOA->BSRR = (1u << (5 + 16));   /* PA5 low  */
\`\`\`

**Protect the sequence** when no such register exists: disable interrupts around it, or use the exclusive-access instructions (\`LDREX\`/\`STREX\`) on Cortex-M3 and later, which retry the store if anything intervened.

**Write-1-to-clear status registers are a separate trap.** If \`SR\` flags clear when you write a 1 to them, then \`SR |= FLAG_A\` reads *all* set flags and writes them back as ones, clearing every pending flag, not just A. Write the mask directly: \`SR = FLAG_A;\`. Read the register description before choosing \`|=\` versus \`=\`.

And the lesson's opening bug, done properly:

\`\`\`c
GPIOA->MODER = (GPIOA->MODER & ~GPIO_MODER_MODER5_Msk)
             | (0x1u << GPIO_MODER_MODER5_Pos);   /* PA5 output, others untouched */
\`\`\`

This is a read-modify-write too, so it belongs in initialisation code before interrupts that touch MODER are enabled.`,
    },
    {
      type: "lab",
      title: "Run it yourself: set, clear, toggle and write a field",
      lab: "c-bits",
      body: `This is the lesson's bit arithmetic as a program you can build on any PC in ten seconds. The register is an ordinary variable so it runs on the host; on the target it would be \`volatile\` and live at the peripheral's address. Build and run it with the command below, then compare every line against the expected output. Each line is one of the four operations from this lesson; work out the hex by hand *before* you look at the printed value, and only then check.`,
      tryNext: `Change the field write to put **7** into bits 7:5 and predict the new value of CR before you run it. Then change \`FIELD_MASK(7, 5)\` to \`FIELD_MASK(8, 5)\` and explain why bit 8 changed even though you only "wrote the field".`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "register",
        id: "moder-pa5-output",
        skill: "bit-ops",
        objective: "Modify one field in a register without changing others.",
        registerName: "GPIOA->MODER (bits 15:0)",
        width: 16,
        prompt: `The register currently has PA2 and PA3 in alternate-function mode (UART) and PA0 as an analogue input. Set **PA5 to general-purpose output (01)** and leave every other pin exactly as it is. Tap bits to change them.`,
        initial: 0x00A3,
        target: 0x04A3,
        fields: [
          { name: "PA7", msb: 15, lsb: 14, description: "Pin 7 mode" },
          { name: "PA6", msb: 13, lsb: 12, description: "Pin 6 mode" },
          { name: "PA5", msb: 11, lsb: 10, description: "Pin 5 mode" },
          { name: "PA4", msb: 9, lsb: 8, description: "Pin 4 mode" },
          { name: "PA3", msb: 7, lsb: 6, description: "Pin 3 mode (UART)" },
          { name: "PA2", msb: 5, lsb: 4, description: "Pin 2 mode (UART)" },
          { name: "PA1", msb: 3, lsb: 2, description: "Pin 1 mode" },
          { name: "PA0", msb: 1, lsb: 0, description: "Pin 0 mode (analogue)" },
        ],
        protectedBits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15],
        solution: `PA5 owns bits 11:10. Output mode is 01, so bit 10 becomes 1 and bit 11 stays 0. The result is 0x00A3 | 0x0400 = **0x04A3**. In C: \`MODER = (MODER & ~(0x3u << 10)) | (0x1u << 10);\``,
        solvedFeedback: `Correct: 0x04A3. Bits 11:10 now read 01 and the UART and analogue pins are untouched. This is exactly what the masked read-modify-write expression computes.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "volatile-meaning",
        skill: "volatile",
        objective: "State precisely what volatile guarantees.",
        prompt: `Which statement about \`volatile uint32_t *reg\` is correct?`,
        options: [
          { id: "a", text: "Every read and write through `reg` in the source is performed by the generated code, in source order, and none is cached or removed.", correct: true, feedback: `Correct. That is the whole guarantee, and it is enough to make polling loops and configuration writes behave. Atomicity and completion are separate concerns.` },
          { id: "b", text: "Operations such as `*reg |= 1` become atomic, so interrupts cannot interfere.", correct: false, feedback: `No. The compound assignment still compiles to a load, a modify and a store. An interrupt between the load and the store can be lost. Atomicity needs a set/reset register, a critical section or exclusive-access instructions.` },
          { id: "c", text: "The compiler inserts memory barriers so the hardware has finished processing a write before the next statement runs.", correct: false, feedback: `No. \`volatile\` constrains the compiler's view of memory, not the bus or the peripheral. If a later step depends on the write having taken effect, read the register back or use a barrier such as \`__DSB()\`.` },
          { id: "d", text: "It is only needed for variables shared with interrupt handlers, not for peripheral registers.", correct: false, feedback: `Backwards. Peripheral registers are the canonical case: their value changes without any write in your program, which is exactly what \`volatile\` tells the compiler. Shared variables also need it, plus attention to atomicity.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "w1c-status",
        skill: "bit-ops",
        objective: "Choose between |= and = based on the register's write semantics.",
        prompt: `A peripheral status register \`SR\` has flags that are cleared by writing 1 to them (write-1-to-clear, common on DMA and many bus peripherals). Flags UIF (bit 0) and CC1IF (bit 1) are both pending. You want to clear only UIF. Which line is correct?`,
        options: [
          { id: "a", text: "`PERIPH->SR |= SR_UIF;`", correct: false, feedback: `This reads SR (0b11), ORs in bit 0 (still 0b11) and writes 0b11 back, which clears **both** UIF and CC1IF. The capture-compare event is silently lost.` },
          { id: "b", text: "`PERIPH->SR = SR_UIF;`", correct: true, feedback: `Correct for write-1-to-clear. Only bit 0 is written as 1; bit 1 is written as 0, which for a W1C flag means "leave it alone". Always check the register description: STM32 timer status registers are actually the opposite convention (rc_w0, cleared by writing 0), where the right form is \`SR = ~SR_UIF;\`. The method is the same: write the register directly with exactly the pattern the hardware expects.` },
          { id: "c", text: "`PERIPH->SR &= ~SR_UIF;`", correct: false, feedback: `This writes a 0 to UIF, which on a write-1-to-clear register does nothing to it, and writes 1 to CC1IF, clearing the flag you wanted to keep. The exact opposite of the intent.` },
          { id: "d", text: "`PERIPH->SR ^= SR_UIF;`", correct: false, feedback: `Reads 0b11, flips bit 0 to get 0b10, writes 0b10: UIF is not cleared and CC1IF is. Toggle never belongs on a status register.` },
        ],
      },
    },
    {
      type: "interview",
      questionId: "volatile-rmw-explained",
      intro: `This question, or its cousin "what does volatile do", appears in nearly every embedded C interview. The strong answer is short and precise.`,
    },
    {
      type: "recap",
      summary: `- Build masks from positions with unsigned literals; set with \`|=\`, clear with \`&= ~\`, write a field by clearing then inserting.
- Whole-register writes change every field. Masked read-modify-write changes only the one you mean.
- \`volatile\` makes the compiler perform every access as written. It does not make anything atomic and does not wait for the hardware.
- A read-modify-write can lose an update if an interrupt changes the same register in between. Prefer set/reset registers like BSRR, or protect the sequence.
- Read the write semantics: on write-1-to-clear status registers, \`|=\` clears flags you did not intend to touch.`,
      cards: [
        { id: "bits-1", front: "Write value v into a field with mask m at position pos, leaving other bits alone?", back: "`reg = (reg & ~m) | ((v << pos) & m);`" },
        { id: "bits-2", front: "What does volatile guarantee? What doesn't it?", back: "Guarantees every access is performed as written, in order, not cached or removed. Does not make accesses atomic, does not add barriers, does not avoid side-effect reads." },
        { id: "bits-3", front: "Why can `ODR |= bit` lose an update?", back: "It compiles to load, OR, store. An interrupt that modifies ODR between the load and the store is overwritten by the stale store. Use BSRR, a critical section, or LDREX/STREX." },
        { id: "bits-4", front: "Clear only flag A in a write-1-to-clear status register?", back: "`SR = FLAG_A;` Not `SR |= FLAG_A`, which writes back every pending flag as 1 and clears them all." },
        { id: "bits-5", front: "Why `1u << 31` rather than `1 << 31`?", back: "Shifting a signed 32-bit int into the sign bit is undefined behaviour in C. Unsigned literals make the mask well defined." },
      ],
    },
  ],
};
