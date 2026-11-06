import type { Lesson } from "@/lib/content/schema";

export const stackHeapAndWhereYourVariablesLive: Lesson = {
  slug: "stack-heap-and-where-your-variables-live",
  moduleId: "embedded-c",
  prerequisites: ["c-foundations-for-firmware", "from-reset-vector-to-main"],
  title: "Stack, heap and where your variables live",
  summary: "A microcontroller has a few hundred kilobytes of flash and a few tens of kilobytes of RAM, divided into sections with different rules. Learn which variables land in flash, which in RAM, how the stack grows and overflows, why most firmware never calls malloc, and how to read the map file that tells you where everything went.",
  durationMinutes: 11,
  whyItMatters: "The three faults that take longest to find in firmware are a stack overflow corrupting a neighbouring variable, an uninitialised local that happens to be zero on the bench, and a heap that fragments after a week. Each is a question about where a variable lives, and each is a standard interview question for exactly that reason.",
  objectives: [
    "Name the memory sections (.text, .rodata, .data, .bss, stack, heap), say what goes in each and what the startup code does to them.",
    "Explain how the stack grows, what a frame holds, how an overflow corrupts memory, and how to size and guard the stack.",
    "State why firmware avoids dynamic allocation, and use static pools and fixed buffers instead.",
    "Read a map file or size report to see flash and RAM usage per section and find what is consuming them.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Section behaviour follows the GNU linker and the Arm Cortex-M startup conventions used by STM32Cube and most vendor toolchains. The lab runs on a host, where the operating system provides the stack and heap; the section semantics are the same.",
  },
  references: [
    { title: "Arm Cortex-M4 Devices Generic User Guide: memory model and stack behaviour", note: "Full-descending stack, MSP/PSP, stack alignment." },
    { title: "GNU ld manual: output sections and the map file (-Map, --print-memory-usage)", note: "Reading .text/.rodata/.data/.bss sizes and symbol placement." },
    { title: "Lesson: From reset vector to main()", note: "The startup code that copies .data and zeroes .bss before main." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The variable that changed when nobody wrote to it",
      body: `A configuration struct at the top of RAM reads correctly after boot, then its first field becomes 0x20000A3C after the UART handler runs with a long message. Nothing in the code writes that field. A debugger watchpoint fires inside a logging function that formats a 256-byte local string buffer, called from the interrupt, with the stack sized at 1 kB.

The stack grew down into the struct. The struct did not change; the memory under it did. Finding this took two days because "where does the stack end?" was a question nobody had asked. This lesson asks it.`,
    },
    {
      type: "concept",
      title: "Six places a byte can live",
      body: `The linker divides memory into **sections**, and every variable or function ends up in exactly one:

| Section | Lives in | Contains | At start-up |
|---|---|---|---|
| **.text** | flash | your compiled code and the vector table | runs in place |
| **.rodata** | flash | const-initialised data: tables, strings, const structs | read in place |
| **.data** | RAM (image in flash) | initialised globals and statics: \`uint32_t x = 5;\` | copied from flash to RAM by the startup code |
| **.bss** | RAM | zero-initialised or uninitialised globals and statics | zeroed by the startup code (costs no flash) |
| **stack** | RAM, usually the top | locals, return addresses, saved registers, interrupt frames | pointer set from the vector table's first word |
| **heap** | RAM, between .bss and the stack | anything \`malloc\` hands out | empty; grows upward on demand |

Two consequences you use every day. **Globals cost RAM and initialised ones cost flash too**; a 4 kB table declared without const is 4 kB of flash *and* 4 kB of RAM plus a copy at boot. **Locals cost stack**, and the stack is finite and shared with every interrupt that can fire while the function runs.

The startup lesson showed the copy and zero loops; this is why a global that is "obviously zero" is zero (\`.bss\`) and why a global initialised to a value survives a reset but a local does not. The vendor's **linker script** (\`.ld\`) places these sections at addresses; the map file records the result.`,
      deeper: {
        title: "RAM regions on real parts",
        body: `Many STM32 parts have more than one RAM region (SRAM1/SRAM2, CCM RAM that DMA cannot reach, backup SRAM that survives standby). The linker script decides which section goes where; a DMA buffer placed in CCM RAM silently never transfers. When a peripheral or a feature "does nothing", the map file's address for its buffer is a quick check.`,
      },
    },
    {
      type: "concept",
      title: "The stack: frames, growth, overflow",
      body: `On Cortex-M the stack is **full-descending**: the stack pointer starts at the top of RAM and moves to *lower* addresses as things are pushed. Each function call pushes a **frame**: the return address, any registers the function must preserve, and its local variables. A 256-byte local buffer is 256 bytes of frame. Recursion multiplies frames. An **interrupt** pushes its own frame (8 registers, 32 bytes, or 104 with the floating-point unit's registers) onto whatever stack is active, *then* calls the handler, which pushes its locals. Nested interrupts stack again.

**Overflow** is the stack pointer passing the lowest address reserved for it and continuing into whatever is below: usually the top of \`.bss\` or the heap, which is the scenario's configuration struct. Nothing stops it by default; the corruption is silent until the overwritten variable is used. Three defences, in order of strength:

1. **Size it from evidence**: fill the stack region with a pattern at boot (0xA5A5A5A5), run every mode including the worst interrupt nesting, and read how far down the pattern was overwritten (the **high-water mark**); add 25 to 50 % margin. RTOS kernels provide this per task (\`uxTaskGetStackHighWaterMark\` in FreeRTOS).
2. **Guard it**: place the stack at the **bottom** of RAM so an overflow hits the end of the memory region and faults immediately (a bus fault you can see) instead of a neighbour; or program the memory protection unit to make the page below the stack inaccessible.
3. **Keep frames small**: no large local arrays in interrupt handlers or deep call chains; \`static\` buffers or a pool instead; no recursion in firmware; watch \`printf\`-family functions, which use hundreds of bytes of stack.

An **uninitialised local** is whatever the previous frame left there: often zero on the first call on the bench, something else in the field. Compilers warn (\`-Wall -Wextra -Wuninitialized\`); treat the warning as a fault.`,
    },
    {
      type: "concept",
      title: "Why firmware does not malloc, and what it does instead",
      body: `\`malloc\` and \`free\` manage a heap at run time. Three properties make them unwelcome in most firmware:

- **Fragmentation**: after enough allocations and frees of different sizes, the free space is scattered in pieces too small to use, and an allocation fails although the total free is sufficient. There is no bound on when this happens, so there is no test that proves it will not.
- **No recovery path**: when \`malloc\` returns NULL at 3 a.m. in a field unit, what does the firmware do? Most code does not check, and the NULL is written through.
- **Timing**: allocation time varies, which breaks real-time budgets, and the heap is shared state that needs locking between tasks and interrupts.

Safety standards (DO-178C, ISO 26262, IEC 62304 at the higher classes) restrict or forbid dynamic allocation after initialisation for these reasons. The alternatives are older and simpler:

- **Static allocation**: every buffer declared at file level with a size chosen from the specification (the ICD's maximum frame length, the queue depth from the handoff lesson's rate arithmetic). RAM use is then known at link time and printed in the size report.
- **Fixed-size pools**: an array of N blocks of one size with a free list or a used bitmap; allocation is constant-time, cannot fragment, and \`N\` exhausted is a defined, testable condition.
- **Allocate once at start-up** if a library insists on \`malloc\`, then never free: the heap size is then also known.

If a third-party stack (a TCP/IP library, a file system) needs a heap, give it its own fixed region and a failure handler, and measure its high-water mark the same way as the stack.`,
    },
    {
      type: "example",
      title: "Worked example: reading a size report and a map file",
      body: `After a build, the toolchain prints (arm-none-eabi-size):

\`\`\`
   text    data     bss     dec     hex filename
  48216     612   18740   67568   107f0 monitor.elf
\`\`\`

- **Flash used** = text + data = 48 828 bytes (the .data initial image lives in flash too).
- **RAM used at start** = data + bss = 19 352 bytes, before the stack and heap. On a 64 kB part that leaves about 45 kB for stack and heap; the linker script's \`_Min_Stack_Size\` and \`_Min_Heap_Size\` reserve the minimum and the link fails if they do not fit.

Something made bss 18 kB. The map file (\`-Wl,-Map=monitor.map\`) lists every symbol with its section and size; sorting the \`.bss\` entries finds \`log_buffer 16384\`: a 16 kB log buffer someone sized "generously". Halving it recovers 8 kB. The same file answers the scenario's question: the stack region's start and end addresses, and the address of the configuration struct just below it.

The lab below prints which section each kind of variable landed in, shows the stack growing downward, demonstrates a bounded copy that cannot overrun, and hands out blocks from a pool. On the host the operating system plays the part of the linker script, but the rules are the same.`,
    },
    {
      type: "lab",
      title: "Run it yourself: sections, the stack's direction, a safe copy and a pool",
      lab: "c-memory",
      body: `Four things in one run: an initialised global (.data), a zeroed global (.bss) and a const table (.rodata) printed with their section names; a recursion that measures the stack's direction and that fifty nested calls consume more than half a kilobyte; a copy into an eight-byte buffer that truncates and terminates instead of overrunning; and a four-block static pool handing out its first block. Frame sizes differ between compilers, so the output states direction and order of magnitude rather than an exact byte count.`,
      tryNext: `Change \`recurse(50, ...)\` to \`recurse(5, ...)\` and predict the stack line. Then change \`fill_buffer_safely\` to a plain \`strcpy\` and compile with \`-Wall -Wextra -O2\`: read what the compiler says about the overrun before you run anything (and do not run it on a target).`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "section-placement",
        skill: "memory-layout",
        objective: "Place variables in their sections.",
        prompt: `\`static const uint16_t crc_table[256];\` (initialised), \`static uint8_t rx_buf[512];\` (no initialiser) and \`uint32_t baud = 115200;\` are declared at file level. Where does each live after start-up?`,
        options: [
          { id: "a", text: "crc_table in flash (.rodata); rx_buf in RAM (.bss, zeroed at boot); baud in RAM (.data, copied from a flash image at boot)", correct: true, feedback: `Yes. const-initialised data stays in flash; uninitialised statics are zeroed; initialised non-const globals are copied.` },
          { id: "b", text: "All three in RAM, because variables are always in RAM", correct: false, feedback: `const-initialised data is placed in flash and read in place; that is the point of declaring the table const.` },
          { id: "c", text: "crc_table and baud in flash; rx_buf on the stack", correct: false, feedback: `baud is written at run time (no const), so it must be in RAM; a file-level array is never on the stack.` },
          { id: "d", text: "rx_buf is uninitialised garbage until written", correct: false, feedback: `File-level and static variables without an initialiser are in .bss and are zeroed by the startup code. Only locals are garbage.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "stack-budget",
        skill: "memory-layout",
        objective: "Estimate stack need from frames and interrupt nesting.",
        prompt: `A main loop's deepest call chain uses 1 200 bytes of stack. The worst case adds one interrupt whose hardware frame is 104 bytes (with FPU registers) and whose handler uses 300 bytes of locals, and a second, higher-priority interrupt nesting on top with a 104-byte frame and 80 bytes of locals. What is the minimum stack size in bytes before any safety margin?`,
        unit: "bytes",
        answer: 1788,
        tolerance: 0,
        solution: `1 200 + (104 + 300) + (104 + 80) = **1 788 bytes**. With 50 % margin, reserve 2 688; round to 3 kB and confirm with a high-water-mark measurement.`,
        solvedFeedback: `Right. Every interrupt that can nest adds its hardware frame plus its handler's locals on top of the deepest main-line chain.`,
        misconceptions: [
          { value: 1580, tolerance: 0, feedback: `You added the handlers' locals but not the two hardware frames the core pushes before each handler runs (104 bytes each with the FPU enabled).` },
          { value: 1200, tolerance: 0, feedback: `The main line alone. Interrupts use the same stack and can fire at the deepest point; add their frames and locals.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "heap-and-stack-rules",
        skill: "memory-layout",
        objective: "Apply the stack and heap rules of firmware.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "Placing the stack at the bottom of RAM makes an overflow hit the end of the memory region and fault immediately instead of silently corrupting a neighbour.", correct: true, feedback: `A fault you can see beats a corruption you cannot.` },
          { id: "b", text: "A 256-byte local array in an interrupt handler is a reasonable way to format a log line.", correct: false, feedback: `It is 256 bytes of stack at the worst possible moment, and formatting functions add hundreds more. Use a static buffer or defer formatting to the main loop.` },
          { id: "c", text: "Dynamic allocation can fragment the heap so that an allocation fails although enough total memory is free, with no bound on when.", correct: true, feedback: `The reason safety standards restrict it after initialisation.` },
          { id: "d", text: "A fixed-size pool allocates in constant time and turns exhaustion into a defined, testable condition.", correct: true, feedback: `N blocks, N known; the failure mode is in the test plan.` },
          { id: "e", text: "An uninitialised local variable is reliably zero.", correct: false, feedback: `It is whatever the last frame left there; zero on the bench by luck, something else in the field. Compilers warn; fix the warning.` },
        ],
        solvedFeedback: `Right. Guard the stack by placement, keep interrupt frames small, avoid run-time allocation, use pools, and never trust an uninitialised local.`,
      },
    },
    {
      type: "interview",
      questionId: "stack-overflow-diagnosis",
      intro: `Describe the symptom, the watchpoint, the frame arithmetic, then the three defences; finish with the map file.`,
    },
    {
      type: "recap",
      summary: `- .text and .rodata in flash; .data copied to RAM at boot (costs both); .bss zeroed (costs RAM only); stack at the top of RAM, full-descending; heap between.
- A frame holds the return address, saved registers and locals; interrupts push 32 or 104 bytes then their handler's locals; nesting adds. Size from a high-water mark plus margin; guard by placing the stack at the bottom of RAM or with the MPU; keep handler frames small; no recursion.
- No malloc after initialisation: fragmentation, no recovery path, variable timing. Static buffers sized from the specification; fixed pools; allocate once if a library insists.
- The size report gives flash (text + data) and RAM (data + bss); the map file names every symbol's section and size.`,
      cards: [
        { id: "mem-1", front: "Where do .data, .bss and .rodata live and what does startup do to them?", back: ".rodata: flash, read in place. .data: initialised globals, image in flash copied to RAM at boot. .bss: zero or uninitialised globals, RAM, zeroed at boot. Locals are on the stack and start as garbage." },
        { id: "mem-2", front: "How does a stack overflow corrupt a variable nobody writes?", back: "The full-descending stack grows into the memory below its reserved region, usually the top of .bss, and overwrites whatever lives there. Defences: high-water-mark sizing with margin, stack at the bottom of RAM or an MPU guard, small frames in handlers." },
        { id: "mem-3", front: "Why do firmware and safety standards avoid malloc?", back: "Heap fragmentation with no bound on when it bites, no sensible action on NULL in the field, variable timing and shared state. Use static buffers sized from the spec and fixed-size pools; allocate once at start-up if a library insists." },
        { id: "mem-4", front: "Reading `text 48216 data 612 bss 18740`?", back: "Flash = text + data = 48 828 B. RAM at start = data + bss = 19 352 B, before stack and heap. The map file (-Map) lists each symbol's section and size to find what is large." },
      ],
    },
  ],
};
