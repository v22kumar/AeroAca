import type { Lesson } from "@/lib/content/schema";

export const pointersToHardware: Lesson = {
  slug: "pointers-to-hardware",
  moduleId: "embedded-c",
  title: "Pointers to hardware: structs over memory maps",
  summary: "A peripheral is a block of registers at an address, and C reaches it through a pointer to a struct whose layout matches the map exactly. Learn why every member is volatile, how reserved gaps keep offsets honest, what the vendor headers do for you, and the three pointer mistakes that corrupt hardware silently.",
  durationMinutes: 10,
  whyItMatters: "Every driver you read or write is built on this pattern, and the faults it hides (a missing volatile, an off-by-four offset, a write to a read-only bit) are the ones that take days because the compiler does not complain. Interviewers ask you to explain `GPIOA->ODR` for exactly that reason.",
  objectives: [
    "Explain the struct-overlay pattern: a typedef whose members match register offsets, cast from a base address.",
    "State why registers are volatile, why reserved members exist, and how alignment and width must match the map.",
    "Recognise the common faults: missing volatile, wrong offset or width, read-modify-write on write-only or write-1-to-clear registers.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Follows the CMSIS device header convention (stm32f4xx.h) and the C standard's rules for volatile and struct layout. Addresses are STM32F4 examples.",
  },
  references: [
    { title: "CMSIS device headers (stm32f4xx.h): GPIO_TypeDef, RCC_TypeDef, __IO qualifiers", note: "The vendor's struct overlays and base-address macros." },
    { title: "STM32F4 reference manual, register maps per peripheral", id: "RM0090", note: "Offsets, widths, access types (rw, r, w, rc_w0, rc_w1)." },
    { title: "Lesson: Register bit masks: read, modify and write safely", note: "What to do once you have the pointer." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The loop that the optimiser removed",
      body: `\`while (!(UART->SR & TXE)) {}\` worked in a debug build and hung in release. The struct member \`SR\` was declared \`uint32_t\`, not \`volatile uint32_t\`. The optimiser, seeing a loop that reads the same memory with nothing writing it, hoisted the read out of the loop: one read, then a loop that could never end. Hardware writes that memory. The compiler did not know, because nobody told it.

The vendor header would have told it. This lesson is what that header does and why.`,
    },
    {
      type: "concept",
      title: "The overlay: a struct that is a memory map",
      body: `A peripheral's register map is a table of offsets from a base address. In C it becomes:

\`\`\`c
typedef struct {
  volatile uint32_t MODER;    /* 0x00 */
  volatile uint32_t OTYPER;   /* 0x04 */
  volatile uint32_t OSPEEDR;  /* 0x08 */
  volatile uint32_t PUPDR;    /* 0x0C */
  volatile uint32_t IDR;      /* 0x10 read-only */
  volatile uint32_t ODR;      /* 0x14 */
  volatile uint32_t BSRR;     /* 0x18 write-only */
  volatile uint32_t LCKR;     /* 0x1C */
  volatile uint32_t AFR[2];   /* 0x20, 0x24 */
} GPIO_TypeDef;

#define GPIOA ((GPIO_TypeDef *)0x40020000UL)
\`\`\`

\`GPIOA->ODR\` is then a read or write of address 0x40020014: the base plus the member's offset, which the compiler computes from the struct layout. Three rules keep that layout equal to the map:

- **Every member is \`volatile\`.** It tells the compiler that each read and write must happen, in order, exactly as written: hardware changes the value between reads, and a write has an effect even if nothing reads it back. CMSIS spells this \`__IO\`, \`__I\` (read-only) and \`__O\` (write-only).
- **Widths and offsets match the map.** A 32-bit register is \`uint32_t\`; a 16-bit one is \`uint16_t\` with its padding accounted for; gaps are **reserved members** (\`uint32_t RESERVED0[2];\`) so the next member lands at the right offset. Drop a reserved word and every later register is off by four: writes land on the wrong register and the symptom is anything.
- **No padding surprises.** Members are naturally aligned 32-bit words; never pack the struct, never put a \`char\` in it, and check \`offsetof(GPIO_TypeDef, BSRR) == 0x18\` with a static assertion when writing your own.

The vendor header does all of this per peripheral, plus the bit masks and positions (\`GPIO_ODR_OD5\`, \`USART_SR_TXE\`). Writing your own overlay is for parts without a header or for a teaching exercise; in a product you use the vendor's and read the map to understand it.`,
      deeper: {
        title: "Why not just a macro per register?",
        body: `\`#define GPIOA_ODR (*(volatile uint32_t *)0x40020014)\` works and some codebases use it. The struct form scales: one typedef serves every instance (GPIOA to GPIOK) through a base pointer, a driver can take a \`GPIO_TypeDef *\` parameter and be tested against a RAM-backed fake struct on the host, and the debugger shows the whole peripheral as a structure. The portfolio project's detection logic and driver separation rely on that testability.`,
      },
    },
    {
      type: "concept",
      title: "The three silent faults",
      body: `**1. Missing volatile.** The scenario. Symptoms: polling loops that hang in release, writes that disappear, reads that return stale values, behaviour that changes with optimisation level. Any code that changes behaviour between \`-O0\` and \`-O2\` should be suspected of this first.

**2. Wrong offset, width or instance.** A reserved gap omitted; a 16-bit register read as 32 bits (on some buses this faults, on others it reads the neighbour too); the base address of GPIOB used with the register of GPIOA; an old header for a different sub-family where a register moved. Symptoms: a write to one register changes another; a peripheral that half works. Check: compare \`offsetof\` with the map, and confirm the header matches the exact part number.

**3. Access-type violations.** The map marks each register and often each bit: \`rw\`, \`r\` (read-only), \`w\` (write-only), \`rc_w0\` / \`rc_w1\` (read, clear by writing 0 or 1), \`rs\` (read, set). A read-modify-write on a write-only register reads garbage and writes it back; a read-modify-write on a status register with \`rc_w0\` bits clears every flag you did not mean to clear (day 7's lesson); writing a 1 to a reserved bit is undefined. BSRR exists precisely to avoid read-modify-write on ODR: writing a bit sets or resets a pin atomically.

And one pointer discipline: never take the address of a register and keep it across a context where the peripheral may be reset or clock-gated; a register read with the peripheral clock off returns zero or faults, which is the classic "the first write after enabling the clock is lost" because the write happened before the clock was enabled in the RCC.`,
    },
    {
      type: "example",
      title: "Worked example: a tiny driver with a testable seam",
      body: `\`\`\`c
/* gpio.h: the driver takes the peripheral as a parameter. */
void gpio_set_output(GPIO_TypeDef *port, unsigned pin) {
    port->MODER = (port->MODER & ~(3u << (pin * 2))) | (1u << (pin * 2));  /* rw: RMW is fine */
}
void gpio_write(GPIO_TypeDef *port, unsigned pin, bool high) {
    port->BSRR = high ? (1u << pin) : (1u << (pin + 16));                   /* w: atomic, no RMW */
}

/* test_gpio.c, host build: a fake peripheral in RAM. */
static GPIO_TypeDef fake;
void test_write_sets_bsrr(void) {
    gpio_write(&fake, 5, true);
    assert(fake.BSRR == (1u << 5));
}
\`\`\`

The same overlay type serves the real \`GPIOA\` on the target and \`&fake\` on the host. \`static_assert(offsetof(GPIO_TypeDef, BSRR) == 0x18, "map")\` guards the layout. The RMW on MODER is correct because MODER is \`rw\` and the driver owns the whole port configuration at that moment; the write to BSRR avoids an RMW on ODR that an interrupt could race.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "missing-volatile",
        skill: "pointers",
        objective: "Diagnose optimisation-dependent hardware code.",
        prompt: `A loop polling a status register works at -O0 and hangs at -O2. What is the most likely cause?`,
        options: [
          { id: "a", text: "The register's struct member is not declared volatile, so the optimiser hoisted the read out of the loop.", correct: true, feedback: `Yes. Behaviour that changes with optimisation level is the signature. Declare every register member volatile (CMSIS __IO).` },
          { id: "b", text: "-O2 changes the peripheral's clock.", correct: false, feedback: `The compiler does not touch peripherals; it changes what reads and writes it emits.` },
          { id: "c", text: "The stack is smaller at -O2.", correct: false, feedback: `Unrelated to a polling loop that never exits.` },
          { id: "d", text: "The hardware is too slow for optimised code.", correct: false, feedback: `A polling loop waits for hardware by design; speed is not the issue, the missing read is.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "offset-arith",
        skill: "pointers",
        objective: "Compute a register address from the overlay.",
        prompt: `Using the GPIO_TypeDef shown in the lesson with base address 0x40020400 for GPIOB, what is the address of GPIOB->BSRR, in hexadecimal? Enter the numeric value (decimal is accepted).`,
        unit: "",
        answer: 1073873944,
        tolerance: 0.5,
        solution: `BSRR is at offset 0x18 (seven 32-bit members before it: 7 × 4 = 28 = 0x1C? No: MODER 0x00, OTYPER 0x04, OSPEEDR 0x08, PUPDR 0x0C, IDR 0x10, ODR 0x14, BSRR 0x18). 0x40020400 + 0x18 = **0x40020418** = 1 073 873 944 decimal.`,
        solvedFeedback: `Correct: 0x40020418. Offsets come from the struct layout, which must match the map word for word.`,
        misconceptions: [
          { value: 1073873940, tolerance: 0.5, feedback: `0x40020414 is ODR (offset 0x14). BSRR is the next word, 0x18: 0x40020418.` },
          { value: 1073872920, tolerance: 0.5, feedback: `0x40020018 uses GPIOA's base. GPIOB is at 0x40020400: 0x40020418.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "overlay-rules",
        skill: "pointers",
        objective: "Apply the overlay rules.",
        prompt: `Select **every** correct statement about struct overlays for peripherals.`,
        options: [
          { id: "a", text: "Every register member must be volatile so each access is performed as written.", correct: true, feedback: `Hardware changes memory and reacts to writes; the compiler must not elide or reorder them.` },
          { id: "b", text: "Reserved gaps in the map become reserved members so later offsets stay correct.", correct: true, feedback: `Omit one and every later register is misaddressed.` },
          { id: "c", text: "Packing the struct is a good way to save RAM.", correct: false, feedback: `The struct occupies no RAM; it is a view of hardware. Packing would break alignment and offsets.` },
          { id: "d", text: "A read-modify-write is safe on any register.", correct: false, feedback: `Not on write-only registers or on status registers with clear-on-write bits; use BSRR-style atomic registers and write the exact value intended.` },
          { id: "e", text: "Passing the peripheral pointer into a driver lets the driver be tested on the host against a RAM-backed fake.", correct: true, feedback: `The testable seam the portfolio project relies on.` },
        ],
        solvedFeedback: `Right. Volatile everywhere, reserved members, no packing, respect access types, and inject the pointer for testability.`,
      },
    },
    {
      type: "interview",
      questionId: "struct-overlay-hardware",
      intro: `Explain GPIOA->ODR from the base address up, say why volatile and reserved members exist, and name the three silent faults with their symptoms.`,
    },
    {
      type: "recap",
      summary: `- A peripheral is a struct whose members match the register map; the base-address cast makes GPIOA->ODR an access to base + offset.
- Every member volatile; widths and reserved members keep offsets exact; no packing; static-assert the offsets.
- Silent faults: missing volatile (behaviour changes with optimisation), wrong offset/width/instance/header, access-type violations (write-only, clear-on-write bits); use BSRR-style atomic registers instead of RMW where provided.
- Enable the peripheral clock before the first access; pass the peripheral pointer into drivers for host testing.`,
      cards: [
        { id: "ptr-1", front: "What does GPIOA->ODR compile to?", back: "An access to the base address (0x40020000) plus ODR's offset in the struct (0x14): a volatile 32-bit read or write of 0x40020014." },
        { id: "ptr-2", front: "Why must register members be volatile?", back: "Hardware changes them between reads and reacts to every write; volatile stops the compiler eliding, caching or reordering the accesses. The symptom of its absence is code that changes behaviour with optimisation level." },
        { id: "ptr-3", front: "Why do overlays contain RESERVED members?", back: "To reproduce gaps in the register map so every later member lands at its true offset; omitting one misaddresses every register after it." },
        { id: "ptr-4", front: "When is read-modify-write on a register wrong?", back: "On write-only registers (reads garbage), on status registers with clear-on-write bits (clears flags you did not intend), and where an atomic set/reset register such as BSRR exists to avoid the race." },
      ],
    },
  ],
};
