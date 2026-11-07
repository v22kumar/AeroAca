import type { Lesson } from "@/lib/content/schema";

export const hardfaultAnalysis: Lesson = {
  slug: "hardfault-analysis",
  moduleId: "debug-target",
  format: "arc",
  prerequisites: ["debug-probe-and-gdb-on-target", "stack-heap-and-where-your-variables-live"],
  title: "HardFault analysis: from a stopped core to the line that caused it",
  summary: "What a Cortex-M core records when it faults, how to read the fault status registers and the stacked program counter, why precise and imprecise bus faults point to different places, and how to turn an address into a source line. Practised on four synthetic captures decoded by a lab.",
  durationMinutes: 17,
  whyItMatters: "'The board hangs after the update' is the commonest embedded failure report. The engineer who can stop in the fault handler, read two registers and name the line within minutes is worth far more than the one who adds prints and waits for the next hang.",
  objectives: [
    "Say what the core records at a fault: the status registers, the faulting address registers and the stacked exception frame.",
    "Decode a CFSR value into the fault it names, and read HFSR to know whether to look there.",
    "Find the stacked program counter, from the right stack, and map it to a source line.",
    "Explain why an imprecise bus fault, a stack overflow and a fault inside the handler each need a different approach.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Register layouts and bit positions (HFSR.FORCED bit 30, CFSR as MMFSR bits 0 to 7, BFSR bits 8 to 15, UFSR bits 16 to 31, BFAR and MMFAR validity bits, the eight-word exception frame with the stacked PC at index 6, and EXC_RETURN bit 2 selecting the stack) follow the Armv7-M Architecture Reference Manual. The four captures in the lab are synthetic examples constructed for teaching, not output from a real device, and the addresses are invented. The handler code is the widely published pattern, shown for explanation, not as production firmware.",
  },
  references: [
    { title: "Armv7-M Architecture Reference Manual, System Control Block: CFSR, HFSR, MMFAR and BFAR", note: "Fault status register layouts and the exception entry stack frame." },
    { title: "Arm Cortex-M3 / M4 Devices Generic User Guide, fault handling", note: "Free; fault types and what each status bit means." },
    { title: "GNU binutils: addr2line", note: "Maps a code address to a source file and line using the ELF's debug information." },
    { title: "Lesson: The debug probe and GDB", note: "Halting the core and reading memory." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The unit that hangs after the update",
      body: `A bench unit ran fine for weeks. After a firmware update it stops responding a few seconds after power-up. The outputs freeze. Nothing is printed.

You attach the probe and halt the core. It is sitting in a tiny \`while (1)\` loop inside **HardFault_Handler**, the function the core jumps to when it does something illegal.

The program counter shows the handler, not the code that did the illegal thing. The loop has erased the trail. But the core did not forget: it wrote down **why** it faulted, and it pushed a copy of the registers it was using onto the stack just before it jumped. The answer to "which line" is sitting in memory a few words from the stack pointer.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The black box in the aircraft",
      body: `After an accident, investigators do not ask the aircraft what happened; they read the recorder that was running the whole time. It holds two kinds of information: **what kind of failure** was detected, and **what the aircraft was doing** at that moment.

A Cortex-M core carries the same two things. When it faults, hardware writes a **reason** into a few status registers: a bit for "bad data address", another for "divide by zero", another for "bad instruction". It also **saves the context**: the registers it was using, including the address of the instruction it was executing, are pushed onto the stack before the fault handler starts.

So you never have to guess. You read the reason, you read the saved context, and you turn one address into a line of source.

The skill is in knowing **where** each piece lives and in what **order** to read them, because a few traps exist: the reason bits can be misleading, the context may be on a different stack than you expect, and sometimes the saved address is after the cause, not at it.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The fault registers and where to read them",
      body: `Cortex-M cores have three kinds of configurable fault: **memory management** (an MPU violation), **bus fault** (a bad access to the bus) and **usage fault** (such as an undefined instruction or a divide by zero). If a handler for one is not enabled, or a fault occurs while handling another, the fault escalates to a **hard fault**.

Two registers tell the story:

- **HFSR**, the HardFault status register. Bit 30, **FORCED**, means "a configurable fault escalated to here; look in CFSR".
- **CFSR**, the configurable fault status register, 32 bits in three bytes: the memory management byte (bits 0 to 7), the bus fault byte (bits 8 to 15) and the usage fault byte (bits 16 to 31).

Two address registers hold a faulting data address, valid only when a status bit says so: **BFAR** for bus faults and **MMFAR** for memory faults.

In debugger terms the registers are ordinary memory: CFSR is at 0xE000ED28, HFSR at 0xE000ED2C, MMFAR at 0xE000ED34 and BFAR at 0xE000ED38. Read them as soon as the core halts in the handler: further faults overwrite them.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "The path from HardFault to the faulting line",
      diagram: "hardfault-decode",
      alt: "Flow from the HardFault handler through reading HFSR, reading CFSR, reading the stacked program counter and mapping the address to a source line, ending in fixing the cause.",
      caption: "Read HFSR (FORCED means look in CFSR), read CFSR for the cause, read the stacked PC from the active stack, map the address to a source line, fix the cause.",
      body: `This is the order to follow. Skipping straight to the stacked address works for a precise fault. The status registers are what tell you whether you may trust it.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The stacked frame, and precise versus imprecise",
      body: `On exception entry the core pushes eight words onto the active stack, in this order of increasing address: **R0, R1, R2, R3, R12, LR, PC, xPSR**. The stacked **program counter** is the seventh word, at offset 24 bytes from the stack pointer, so \`frame[6]\` when \`frame\` points to the pushed block.

Which stack? Bit 2 of the value in LR at handler entry (the EXC_RETURN code) says: clear means the main stack, set means the process stack used by an RTOS task. A handler that always reads the main stack will read the wrong frame in a task.

Now the trap. A **precise** bus fault is reported at the instruction that caused it: the stacked PC **is** the guilty instruction. An **imprecise** fault comes from a **buffered write**: the core issued the store and moved on, and the bus error returned later. The stacked PC then points **after** the real cause, possibly several instructions on. In a debug build you can disable the write buffer so imprecise faults become precise.

The stacked **LR** is the return address of the caller: with its low bit set on Thumb code, so subtract one to look it up.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: decoding a synthetic capture by hand",
      body: `This capture is **synthetic**, made up for teaching.

HFSR = 0x40000000, CFSR = 0x00008200, stacked PC = 0x0800214A.

**Step 1: HFSR.** 0x40000000 is bit 30 set: **FORCED**. A configurable fault escalated. Read CFSR.

**Step 2: CFSR.** 0x00008200 has bits 15 and 9 set. Bits 8 to 15 are the bus fault byte, so this is a **bus fault**. Within that byte, bit 7 (CFSR bit 15) is **BFARVALID**: the faulting address is in BFAR. Bit 1 (CFSR bit 9) is **PRECISERR**: a precise data bus error.

**Step 3: BFAR.** It reads 0x00000000. The core tried to access address zero: a **null pointer** dereference.

**Step 4: precise, so trust the PC.** The stacked PC 0x0800214A is the instruction that did the access.

**Step 5: to a line.** \`arm-none-eabi-addr2line -e app.elf -f -i 0x0800214A\` prints a function and a file and line.

**Step 6: the fix.** Read the line, find the pointer that was never set, and fix the initialisation. Then write a regression test that provokes it.

One address, two status registers, six steps.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "cfsr-bit-guided",
        skill: "hardfault",
        objective: "Find which CFSR bit a value sets (guided).",
        prompt: `A capture shows CFSR = 0x00000400. Which bit number (counting from 0 at the least significant bit) is set?`,
        unit: "bit number",
        answer: 10,
        tolerance: 0,
        hints: [
          `0x400 is a single bit set. Write it in binary: a 1 followed by zeros.`,
          `Each hex digit is four bits. The digit 4 in the hundreds place of 0x400 covers bits 8 to 11.`,
          `0x400 = 0x100 × 4 = 2⁸ × 4 = 2¹⁰.`,
        ],
        solution: `0x400 = 1024 = 2¹⁰, so **bit 10** is set. Bit 10 is in the bus fault byte (bits 8 to 15), where bit 2 of that byte is **IMPRECISERR**: an imprecise data bus error.`,
        solvedFeedback: `Right: bit 10, which is bit 2 of the bus fault byte: IMPRECISERR. Remember that for this one the stacked PC is after the cause.`,
        misconceptions: [
          { value: 4, tolerance: 0, feedback: `4 is the hex digit, not the bit number. The digit 4 sits two digits up (0x400), covering bits 8 to 11: 0x400 is 2¹⁰, bit 10.` },
          { value: 2, tolerance: 0, feedback: `2 is the bit within the bus fault byte (IMPRECISERR). The question asks for the bit number in the whole 32-bit CFSR: 8 + 2 = 10.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: four captures, decoded",
      lab: "c-fault-decode",
      body: `The program decodes four **synthetic** captures (made-up register values, not from a real device): a null pointer, an index past the end of RAM, a divide by zero and an imprecise fault after a stack overflow. For each one read the output in this order: HFSR, the CFSR cause, the address registers if valid, the stacked PC, then the notes. Which capture's stacked PC can you **not** trust?`,
      tryNext: `Edit capture C so that the CFSR has bit 17 set instead of bit 25. Predict which line of output changes. Then change capture D's stacked stack pointer to 0x20001000 and predict whether the stack overflow note still prints.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "A handler that picks the right stack and keeps the evidence",
      intro: `A widely used pattern, shown for explanation. It hands the pushed frame to a C function where the values are easy to read in the debugger.`,
      language: "c",
      code: `__attribute__((naked)) void HardFault_Handler(void) {
    __asm volatile(
        "tst lr, #4     \\n"
        "ite eq         \\n"
        "mrseq r0, msp  \\n"
        "mrsne r0, psp  \\n"
        "b fault_c      \\n");
}

void fault_c(uint32_t *frame) {
    volatile uint32_t pc = frame[6], lr = frame[5];
    volatile uint32_t cfsr = SCB->CFSR, bfar = SCB->BFAR;
    for (;;) { }
}`,
      notes: [
        { lines: "1-2", text: `A **naked** function has no compiler prologue, so nothing touches the stack or the registers before this code reads them.` },
        { lines: "3-6", text: `Test bit 2 of LR, the EXC_RETURN value. If it is clear, copy the **main stack pointer** into R0; if set, the **process stack pointer**. R0 becomes the argument of the next call: a pointer to the pushed frame.` },
        { lines: "7", text: `Branch to a normal C function. The frame pointer is already in R0, where C expects its first argument.` },
        { lines: "10-12", text: `Read the stacked LR and PC from the frame (index 5 and 6) and the two status registers into **volatile** locals, so the compiler cannot optimise them away and you can inspect them in the debugger.` },
        { lines: "13", text: `Park here so the debugger can halt and read. In a product, log these words to non-volatile memory and reset instead.` },
      ],
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "capture-reading",
        skill: "hardfault",
        objective: "Read the lab's synthetic captures correctly.",
        prompt: `Using the four captures in the lab, select **every** statement that is correct.`,
        options: [
          { id: "a", text: "Capture A: BFAR is 0, so the code dereferenced a null pointer, and the stacked PC (0x0800214A) is the instruction that did it.", correct: true, feedback: `Yes: precise error with BFAR valid and equal to zero; the PC is at the cause, so addr2line on it gives the line.` },
          { id: "b", text: "Capture B: BFAR is 0x20020010, past the 0x2001FFFF end of RAM, so a pointer or an array index ran off the end.", correct: true, feedback: `Yes. The address is valid but not in any RAM the part has; a bounds error is the likely cause.` },
          { id: "c", text: "Capture C: UFSR shows DIVBYZERO, so BFAR holds the address of the zero divisor.", correct: false, feedback: `BFAR is only valid for a bus fault with BFARVALID set. A usage fault such as divide by zero has no data address; the stacked PC is the divide instruction.` },
          { id: "d", text: "Capture D: the stacked PC is the instruction that caused the fault, so addr2line on it finds the bug.", correct: false, feedback: `Imprecise: the PC is after the cause. The SP near the bottom of RAM points at a stack overflow, so look at the stack depth and the writes just before that PC.` },
        ],
        solvedFeedback: `Right: A and B are precise with a valid address; C has no address register to use; D's PC is after the cause and the real suspect is the stack.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "When the evidence itself is damaged",
      body: `Three situations where the simple recipe fails, and what to do.

**Stack overflow.** If the stack has grown below its region, the core cannot even push the exception frame: the stacking fails and sets **STKERR** in the bus fault byte (MSTKERR in the memory byte). The stacked PC is then not trustworthy. Check the stack pointer against the linker map: a stack that has run into the data below it is the cause, and the fault is only the symptom.

**A fault inside the fault handler.** If the handler itself faults, the core **locks up** at a priority where no handler can run. Only a reset, often by a watchdog, recovers it. Keep the handler tiny and its stack usage fixed.

**Imprecise faults.** The status register says imprecise and the PC is late. Turn off the write buffer in debug, or look backwards from the PC for stores to peripheral or invalid addresses.

Add one honest limit: the registers say what **kind** of illegal access happened, not why the program allowed it. A null pointer dereference is a symptom. The root cause is the missing initialisation or the lifetime error behind it, found by reading the line and its callers.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "order",
        id: "hardfault-order",
        skill: "hardfault",
        objective: "Put the steps of a HardFault analysis in order.",
        prompt: `Put these steps in the order you would do them, from a halted core in the handler.`,
        items: [
          { id: "hfsr", text: "Read HFSR and check whether FORCED is set.", why: `It tells you whether the cause is in CFSR or whether a vector table read failed.` },
          { id: "cfsr", text: "Read CFSR (and BFAR or MMFAR if their valid bits are set) before anything runs again.", why: `The registers hold the cause and the address; a second fault could overwrite them.` },
          { id: "pc", text: "Pick the stack from EXC_RETURN and read the stacked PC and LR, taking care if the fault was imprecise or the stack overflowed.", why: `The wrong stack gives a plausible but wrong address; an imprecise fault means the PC is after the cause.` },
          { id: "line", text: "Map the PC to a source line with the map file or addr2line.", why: `Only now the address becomes a line you can read.` },
          { id: "fix", text: "Fix the cause, then add a test that provokes the same fault.", why: `A fix with no test can silently return in the next update.` },
        ],
        correctOrder: ["hfsr", "cfsr", "pc", "line", "fix"],
        solvedFeedback: `Right: HFSR, CFSR and address registers, stacked frame, source line, fix and a test.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "hardfault-analysis-explained",
      intro: `Walk through how you find the line that caused a HardFault, including the imprecise case and a stack overflow.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Every Cortex-M project eventually hangs in HardFault_Handler; a handler that logs CFSR, BFAR and the stacked PC turns each field failure into a line number.
- **Aerospace and UAV systems.** Fault capture to non-volatile memory is how a unit explains an in-flight reset afterwards; the log is analysed on the ground.
- **R&D and design.** Stack sizing, MPU regions and the choice of what the handler does (halt, log, reset) are design decisions with a safety argument.
- **Verification and interviews.** "How do you find the line that caused a HardFault?" is asked often; the registers, the right stack and the imprecise trap are the answer.`,
    },
    {
      type: "recap",
      summary: `- A fault leaves two records: the status registers (HFSR, CFSR, BFAR, MMFAR) saying what kind of illegal access, and the stacked frame holding the context.
- HFSR.FORCED means look in CFSR. CFSR bytes: memory (0 to 7), bus (8 to 15), usage (16 to 31). BFAR and MMFAR are valid only if their status bit says so.
- The stacked PC is frame[6] on the stack named by EXC_RETURN bit 2. Precise fault: it is the cause. Imprecise: it is after the cause.
- A stack overflow can stop the frame being saved; check the stack pointer against the map before trusting the PC.
- Read the registers first, map the PC to a line, fix the cause and add a test that provokes it.`,
      cards: [
        { id: "hf-1", front: "What does HFSR.FORCED mean and what do you do?", back: "Bit 30 of HFSR: a configurable fault (memory, bus or usage) escalated to a hard fault. Read CFSR to find which one." },
        { id: "hf-2", front: "Where is the faulting instruction's address, and how do you find the right stack?", back: "The stacked PC is the seventh word (frame[6]) of the eight-word frame pushed on entry. Bit 2 of EXC_RETURN in LR selects the main stack (clear) or the process stack (set)." },
        { id: "hf-3", front: "Precise versus imprecise bus fault?", back: "Precise: the stacked PC is the faulting instruction. Imprecise: a buffered write failed later, so the PC is after the cause; disable the write buffer in debug to make it precise." },
        { id: "hf-4", front: "Which symptoms suggest a stack overflow in a fault capture?", back: "A stack pointer near the bottom of its region or inside .bss, STKERR or MSTKERR in CFSR, or an imprecise fault right after deep calls. The stacked PC may be unreliable." },
      ],
    },
  ],
};
