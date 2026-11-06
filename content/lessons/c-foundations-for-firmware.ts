import type { Lesson } from "@/lib/content/schema";

export const cFoundationsForFirmware: Lesson = {
  slug: "c-foundations-for-firmware",
  moduleId: "embedded-c",
  prerequisites: ["embedded-c-register-bit-masks"],
  title: "C foundations for firmware: functions, scope, static, const, arrays and structs",
  summary: "The register and integer lessons assumed you can read C. This one makes sure: how functions and files share or hide names, what static and const really do on a microcontroller, why an array is not a pointer but behaves like one, and how structs are laid out in memory with the padding you did not ask for.",
  durationMinutes: 11,
  whyItMatters: "Firmware is a handful of files that share state through carefully chosen names. An engineer who cannot explain why a variable is static, why a table is const, or why sizeof a struct is 12 and not 9 cannot review a driver, and interviewers probe exactly these in the coding round.",
  objectives: [
    "Explain scope and linkage: local, file-scope static, and external; choose static by default and expose only what another file needs.",
    "Use const for tables and parameters and know where const data lives on a target.",
    "Pass arrays to functions correctly (pointer plus length), do pointer arithmetic in elements not bytes, and avoid the two classic off-by-one faults.",
    "Define and initialise structs, pass them by pointer, and predict their size including alignment padding.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Semantics follow ISO C11. Sizes and padding assume the 32-bit Arm EABI (natural alignment: 4-byte alignment for 32-bit members) which also holds for the host builds in the lab. The lab's output was produced by gcc and checked with clang.",
  },
  references: [
    { title: "ISO/IEC 9899:2011 (C11): 6.2.2 linkages of identifiers, 6.7.3 type qualifiers, 6.3.2.1 array-to-pointer conversion, 6.7.2.1 structure layout", note: "The normative text for scope, linkage, const, array decay and padding." },
    { title: "Arm Procedure Call Standard for the Arm Architecture (AAPCS32)", note: "Alignment rules that determine struct padding on Cortex-M.", url: "https://github.com/ARM-software/abi-aa" },
    { title: "Lesson: Pointers to hardware", note: "The struct-overlay pattern this lesson's struct layout rules make safe." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The counter that two files shared by accident",
      body: `A UART driver has a global \`count\` for bytes received. A logging module, written by someone else, also has a global \`count\`. Both compile; the linker merges them into one variable, and the receive counter resets every time a log line is written. The fix was one word in front of each declaration: \`static\`.

A week later a sensor's calibration table is corrupted at run time because a bug writes through a pointer into it. The table was a plain array in RAM; declared \`const\`, it would have lived in flash and the write would have faulted immediately instead of silently.

Neither story is about algorithms. Both are about the four or five C keywords this lesson is for.`,
    },
    {
      type: "concept",
      title: "Scope, linkage and the static keyword",
      body: `Every name in C has a **scope** (where it can be used) and, for file-level names, a **linkage** (whether other files can see it).

- A variable declared **inside a function** is local: it exists only while the function runs, lives on the stack, and is uninitialised garbage unless you set it.
- A variable declared **at file level** exists for the whole program. By default it has **external linkage**: every other file that declares \`extern uint32_t count;\` refers to the same object, which is the scenario's collision.
- Put **\`static\`** in front of a file-level variable or function and it gets **internal linkage**: visible only inside that file. This is the default you want. A module exposes a handful of functions in its header and keeps everything else static; the compiler can then also optimise it harder.
- **\`static\` inside a function** means something different: the variable keeps its value between calls and is initialised once (before main, by the startup code). A sequence counter, a "first call" flag, a one-time buffer. It is still private to the function.

The rule for firmware: every file-level name is \`static\` unless its header declares it; every shared variable is accessed through a function, not an \`extern\`, so you can later add a lock or a bounds check in one place.

Functions follow the same rules. A **prototype** in a header (\`uint32_t ring_count(const ring_t *r);\`) tells other files the signature; the definition in one \`.c\` file provides the body. Calling a function with no prototype in scope was allowed in old C and is a bug in C11: the compiler cannot check the arguments.`,
      deeper: {
        title: "extern, inline and the one-definition rule",
        body: `\`extern\` declares a name defined elsewhere without allocating it; it belongs in a header only for the rare genuinely global object (a system tick counter, say), and the header should be included by the file that defines it so the types agree. \`static inline\` in a header gives every file its own private copy of a tiny function with no call overhead, the usual way to wrap a register access. A non-static function or variable may be defined exactly once across the whole program; defining it in two files is the scenario's link-time collision, which some linkers report and others silently merge.`,
      },
    },
    {
      type: "concept",
      title: "const, and where things live",
      body: `**\`const\`** promises the compiler that the program does not write to this object through this name. Three uses matter in firmware:

1. **Tables**: \`static const uint16_t crc_table[256] = { ... };\` The linker places const-initialised data in **flash** (the \`.rodata\` section) and it costs no RAM. Without const the same table is copied to RAM at start-up (\`.data\`) and can be corrupted, as in the scenario.
2. **Pointer parameters**: \`uint32_t sum(const uint8_t *data, size_t len)\` says the function reads the buffer and does not modify it; callers can pass const buffers and reviewers know the contract. Read it right to left: \`data\` is a pointer to const uint8_t. A \`uint8_t *const p\` is a const pointer to mutable data; rare.
3. **Configuration**: a const struct of settings compiled in, versus a RAM copy that can be range-checked and changed; the portfolio's configuration check (R7) uses both.

\`const\` is not **\`volatile\`**: const says the program will not write it; volatile says something outside the program might change it or care about every access. A read-only hardware status register is \`volatile const\`: you never write it, and the compiler must re-read it every time.

**#define** versus const: a \`#define\` is text replacement with no type and no address; a \`static const\` has both and shows up in the debugger. Use const for values, \`#define\` for things that must be compile-time constants in old-style C (array sizes in C89, preprocessor conditions) and for register addresses where the vendor headers already do.`,
    },
    {
      type: "concept",
      title: "Arrays, pointers and the length you must carry",
      body: `An array is a fixed block of elements with a known size. When you **pass it to a function, use it in an expression or compare it**, it **decays** to a pointer to its first element and loses its length. So a function that takes an array must also take its length, and \`sizeof\` on the parameter gives the size of a pointer (4 on Cortex-M), not of the array. The pattern:

\`\`\`c
uint32_t sum_u8(const uint8_t *data, size_t len);
uint8_t frame[5];
sum_u8(frame, sizeof frame);           /* sizeof works here: frame is still an array */
\`\`\`

**Pointer arithmetic is in elements**, not bytes: \`p + 1\` on a \`uint32_t *\` moves four bytes. \`p[i]\` is \`*(p + i)\`; the two notations are interchangeable. Subtracting two pointers into the same array gives the element count between them.

The two faults that account for most buffer bugs: **off-by-one at the end** (\`for (i = 0; i <= len; i++)\` touches one element past the array) and **forgetting the string terminator** (a \`char name[8]\` holds at most seven characters plus the \`'\\0'\`; \`strcpy\` of an eight-character string writes nine bytes). Prefer loops bounded by the length you carried, and copy routines that take the destination size and always terminate. The memory lesson shows one.

Strings in C are byte arrays ending in \`'\\0'\`; there is no length field. \`sizeof "ABC"\` is 4. Serial protocols and ICDs (the integration lesson) are byte arrays with explicit lengths precisely to avoid this.`,
    },
    {
      type: "concept",
      title: "Structs: layout, padding and passing by pointer",
      body: `A **struct** groups members in declaration order. The compiler inserts **padding** so that each member sits at an address that is a multiple of its alignment (on Arm: 2 for 16-bit, 4 for 32-bit) and pads the end so arrays of the struct keep that alignment. So

\`\`\`c
typedef struct { uint32_t t_ms; int32_t temp_centi; uint8_t flags; } sample_t;   /* sizeof = 12 */
typedef struct { uint8_t flags; uint32_t t_ms; int32_t temp_centi; } worse_t;    /* also 12, but flags then 3 pad bytes */
typedef struct { uint8_t a; uint32_t b; uint8_t c; } worst_t;                    /* 12 for 6 bytes of data */
\`\`\`

Order members largest first to minimise padding. Never assume a struct's layout matches a wire protocol's bytes: the padding is not on the wire, and byte order may differ (the ICD lesson). **Serialise explicitly**, one field at a time, or use packed attributes knowingly and read the compiler's documentation on the cost (unaligned access faults on some cores).

**Initialise with designated initialisers**: \`sample_t s = { .temp_centi = 2500 };\` sets the named member and zeroes the rest; \`= {0}\` zeroes everything. Uninitialised locals are garbage. **Pass structs by pointer** (\`void stamp(sample_t *s, uint32_t now)\`) so the function modifies the caller's object and no 12-byte copy is made; pass \`const sample_t *\` when the function only reads. Returning a small struct by value is fine on modern compilers; large structs go through a pointer.

The struct-overlay pattern for hardware registers (the pointers lesson) is a struct whose padding is deliberately specified with reserved members so the layout matches the memory map exactly; that is the one place padding is designed rather than tolerated.`,
    },
    {
      type: "example",
      title: "Worked example: a module header and its private file",
      body: `\`\`\`c
/* uart_rx.h: everything another file may use */
#include <stdbool.h>
#include <stdint.h>
void     uart_rx_init(void);
bool     uart_rx_get(uint8_t *out);     /* false when empty */
uint32_t uart_rx_overruns(void);        /* read-only view of a private counter */
\`\`\`

\`\`\`c
/* uart_rx.c: the private state and the ISR */
#include "uart_rx.h"
static ring_t rx_ring;                  /* internal linkage: invisible to other files */
static volatile uint32_t overruns;      /* written in the ISR, read in main: volatile */
static const uint32_t BAUD = 115200u;   /* flash, typed, visible in the debugger */

void uart_rx_init(void) { ring_init(&rx_ring); /* configure the peripheral */ }
bool uart_rx_get(uint8_t *out) { return ring_get(&rx_ring, out); }
uint32_t uart_rx_overruns(void) { return overruns; }

void USART2_IRQHandler(void) {          /* external linkage: the vector table names it */
    uint8_t byte = read_data_register();
    if (!ring_put(&rx_ring, byte)) overruns++;
}
\`\`\`

Everything a reviewer wants is visible: two names leave the file through the header plus the ISR the hardware needs; the counter the ISR writes is volatile and read through a function; the constant is const. The lab below runs the scope, static, const, array and struct rules on your PC.`,
    },
    {
      type: "lab",
      title: "Run it yourself: static, const, arrays and a struct's size",
      lab: "c-functions",
      body: `One file that exercises each rule: a file-scope static counter, a function-local static that remembers, a const seed, an array passed with its length and indexed through a pointer, and a struct stamped through a pointer with its padded size printed. Build and run; compare every line. The sequence line takes the three values into variables first because the order in which arguments are evaluated inside one call is unspecified in C, which is itself a rule worth remembering.`,
      tryNext: `Reorder the struct to \`{ uint8_t flags; uint32_t t_ms; int32_t temp_centi; }\` and predict \`sizeof\`. Then try \`{ uint8_t flags; uint8_t spare; uint16_t small; uint32_t t_ms; }\` and predict again before running. Finally remove \`static\` from \`next_sequence\`'s inner \`seq\` and explain the new output.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "struct-size",
        skill: "c-foundations",
        objective: "Predict a struct's size with alignment padding.",
        prompt: `On a 32-bit Arm target, what is \`sizeof\` of \`struct { uint8_t a; uint32_t b; uint16_t c; }\`?`,
        unit: "bytes",
        answer: 12,
        tolerance: 0,
        solution: `\`a\` at offset 0, three bytes of padding so \`b\` sits at 4, \`c\` at 8, then two bytes of end padding so the struct's size is a multiple of its 4-byte alignment: **12**. Reordered as \`{ b, c, a }\` it would be 8.`,
        solvedFeedback: `Right. Seven bytes of data, five of padding; order largest first to shrink it.`,
        misconceptions: [
          { value: 7, tolerance: 0, feedback: `Seven is the sum of the member sizes. Alignment inserts padding before \`b\` (3 bytes) and at the end (2 bytes).` },
          { value: 10, tolerance: 0, feedback: `You padded before \`b\` but not at the end. The struct's size must be a multiple of its largest alignment (4), so 10 rounds up to 12.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "static-meaning",
        skill: "c-foundations",
        objective: "Distinguish the two meanings of static.",
        prompt: `In one file, \`static uint32_t errors;\` appears at file level and \`static uint8_t buf[64];\` appears inside a function. What does \`static\` do in each case?`,
        options: [
          { id: "a", text: "At file level it hides the name from other files; inside the function it keeps the buffer alive and its contents preserved between calls instead of recreating it on the stack each time", correct: true, feedback: `Yes: internal linkage at file scope, persistent storage at block scope. Same keyword, two jobs.` },
          { id: "b", text: "Both make the variable constant", correct: false, feedback: `That is \`const\`. \`static\` is about visibility and lifetime, never about writability.` },
          { id: "c", text: "At file level it places the variable in flash; inside the function it makes it global", correct: false, feedback: `Placement in flash comes from \`const\` initialisation. A function-local static remains private to the function.` },
          { id: "d", text: "It has no effect at file level; inside the function it makes the buffer thread-safe", correct: false, feedback: `File-level static is the main tool against name collisions. Nothing about static makes a buffer safe to share with an interrupt; that needs the handoff lesson's techniques.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "arrays-pointers-const",
        skill: "c-foundations",
        objective: "Apply the array, pointer and const rules.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "Inside \`void f(uint8_t buf[])\`, \`sizeof buf\` is the size of a pointer, not of the caller's array.", correct: true, feedback: `The parameter is a pointer however it is written; carry the length separately.` },
          { id: "b", text: "\`static const uint16_t table[256]\` is placed in flash and costs no RAM on a typical Cortex-M build.", correct: true, feedback: `const-initialised data goes to .rodata; without const it is copied into .data in RAM at start-up.` },
          { id: "c", text: "\`p + 1\` on a \`uint32_t *p\` advances the address by one byte.", correct: false, feedback: `Pointer arithmetic is in elements: four bytes for a 32-bit type.` },
          { id: "d", text: "A \`char name[8]\` can safely hold an eight-character string.", correct: false, feedback: `Eight characters plus the terminating \`'\\0'\` is nine bytes; the array holds seven characters.` },
          { id: "e", text: "A read-only hardware status register should be declared \`volatile const\`.", correct: true, feedback: `const because the program never writes it; volatile because the hardware changes it and every read must happen.` },
        ],
        solvedFeedback: `Right. Parameters decay, const tables live in flash, arithmetic is in elements, strings need their terminator, and status registers are volatile const.`,
      },
    },
    {
      type: "interview",
      questionId: "c-static-const-review",
      intro: `Answer as a reviewer: say what each keyword buys, where the data ends up, and the fault each one prevents.`,
    },
    {
      type: "recap",
      summary: `- File-level names are static (internal linkage) unless the header exposes them; function-local static persists between calls. Share state through functions, not extern.
- const: tables in flash (.rodata), read-only pointer parameters, compiled-in configuration. volatile const for read-only hardware registers. Prefer typed const over #define for values.
- Arrays decay to pointers when passed: carry the length; sizeof a parameter is a pointer's size; arithmetic is in elements; strings need the terminator; bound every loop by the carried length.
- Structs are padded to member alignment; order largest first; never overlay a struct on wire bytes without an explicit serialiser; designated initialisers; pass by pointer, const when read-only.`,
      cards: [
        { id: "cf-1", front: "Two meanings of static?", back: "At file level: internal linkage, the name is invisible to other files (the default you want). Inside a function: the variable persists between calls and is initialised once." },
        { id: "cf-2", front: "Why declare a lookup table const?", back: "const-initialised data is placed in flash (.rodata): no RAM used, no start-up copy, and a stray write faults instead of corrupting it. Without const it is copied into RAM (.data)." },
        { id: "cf-3", front: "What happens when an array is passed to a function?", back: "It decays to a pointer to its first element and loses its length; sizeof the parameter is the pointer's size. Pass the length separately and bound every loop by it." },
        { id: "cf-4", front: "sizeof struct { uint8_t a; uint32_t b; uint16_t c; } on Arm?", back: "12: a at 0, 3 bytes padding, b at 4, c at 8, 2 bytes end padding to keep 4-byte alignment. Reordered { b, c, a } it is 8. Padding is never on the wire." },
      ],
    },
  ],
};
