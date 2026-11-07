import type { Lesson } from "@/lib/content/schema";

export const debugProbeAndGdbOnTarget: Lesson = {
  slug: "debug-probe-and-gdb-on-target",
  moduleId: "debug-target",
  format: "arc",
  prerequisites: ["from-reset-vector-to-main", "pointers-to-hardware"],
  title: "The debug probe and GDB: stopping the chip instead of printing at it",
  summary: "What sits between GDB on your PC and the core on the board, the difference between SWD and JTAG and between an ST-LINK and a J-Link, and how to use breakpoints, watchpoints and memory reads to find a fault without disturbing the program more than you must.",
  durationMinutes: 15,
  whyItMatters: "'Fault isolation with ST-LINK and J-Link' is a line on many CVs and a standard interview probe. The candidate who can draw the chain from GDB to the core, say when a watchpoint beats a breakpoint, and name what halting the core does to a running system shows hands-on competence in two minutes.",
  objectives: [
    "Draw the chain from GDB on the PC to the core and memory on the chip, naming every link.",
    "Compare SWD with JTAG and an ST-LINK with a J-Link without claiming more than the datasheets say.",
    "Choose between a breakpoint and a watchpoint for a given question, and know that both use a small, fixed number of hardware comparators.",
    "Read a peripheral register and a memory block under GDB, and name three things halting the core disturbs.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The debug architecture (Arm debug interface, debug access port, memory access port), the two-wire SWD and four-or-five-wire JTAG interfaces, the Flash Patch and Breakpoint unit and the Data Watchpoint and Trace unit follow the public Arm CoreSight and Armv7-M documentation. Comparator counts vary by core and are described as 'a small number, typically four to eight breakpoints and up to four watchpoints'; check the part's documentation. The GDB session is an illustrative sequence with the open-source OpenOCD server, not captured output; the STM32F4 GPIOA output data register address 0x40020014 follows the public reference manual. No claim is made about commercial probe licensing; check the vendor's current terms.",
  },
  references: [
    { title: "Arm Debug Interface Architecture Specification (ADIv5) and Armv7-M Architecture Reference Manual, debug chapters", note: "Debug port, access ports, breakpoint and watchpoint units." },
    { title: "GDB documentation: breakpoints, watchpoints and examining memory", note: "Free online manual; the commands used in the walkthrough." },
    { title: "OpenOCD user's guide", note: "An open-source GDB server for SWD and JTAG probes." },
    { title: "Lesson: Pointers to hardware", note: "Registers are memory-mapped addresses, which is why GDB can read them." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The bug that hid when you looked at it",
      body: `A flight-test rig runs a control loop at 1 kHz. Once in a few minutes a counter jumps from 7 to 0 and the loop stumbles. You add a \`printf\` to see the value. The bug disappears. You remove the \`printf\`. It comes back.

The print was slow, took time inside the loop and changed the timing of everything around it. The program you were watching was not the program that had the bug.

You need a way to look **inside** the chip without writing a single line into the program: stop the core on a chosen event, read memory and registers, and let it run again. That is what a debug probe and GDB do, and the choice of how you stop it decides whether you disturb the fault or catch it.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "A second, tiny computer with a pause button",
      body: `Think of a mechanic's stethoscope and a remote pause button for an engine. You do not take the engine apart to listen. You attach something small, press pause at the instant you care about, listen, and release.

A **debug probe** is that device. It is a small computer on a lead, plugged into your PC at one end and wired to a few pins of the chip at the other. Inside the chip there is a built-in circuit that obeys the probe: it can freeze the core, let it step one instruction, and read or write any address the core can reach.

Your PC runs **GDB**, which speaks in terms of source lines and variable names. In between sits a small server that turns GDB's requests into probe commands.

Because memory and peripheral registers are all at addresses, "read the value of a register" and "read a variable" are the same kind of request. That is why one tool can inspect both.

The price: a frozen core is a core that no longer meets its deadlines.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "SWD, JTAG, ST-LINK and J-Link",
      body: `The wire between probe and chip is one of two standards.

- **JTAG** uses four signals plus an optional reset: TCK, TMS, TDI and TDO. It is older, can chain several chips on one cable, and is found on almost every processor family.
- **SWD** (serial wire debug) uses **two** signals, SWDIO and SWCLK, plus ground. It reaches the same debug features on Arm Cortex-M parts with fewer pins, which is why it is the common choice on small boards.

Behind the pins, both reach the **debug access port**, which in turn reaches the core's memory bus through an access port. Everything the core can address, the probe can address.

Two probes you will meet:

- **ST-LINK** is the probe ST builds onto its Nucleo and Discovery boards and sells separately. It is cheap and works best with ST parts.
- **J-Link** is SEGGER's probe family. It supports many vendors' chips, is known for speed and a rich feature set, and has several editions with different licence terms: check the vendor's current terms before relying on one.

Both talk to GDB through a **GDB server**: OpenOCD is an open-source one, and each vendor ships its own.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "The debug chain, link by link",
      diagram: "debug-chain",
      alt: "Debug chain from GDB and a GDB server on the PC, through a probe such as ST-LINK or J-Link, over SWD or JTAG with SWDIO and SWCLK, to the debug port and the core and memory.",
      caption: "GDB and the server on the PC, the probe, the two-wire SWD or four-wire JTAG link, the debug access port, and the core with its memory. A fault at any link looks like 'cannot connect'.",
      body: `When the debugger will not connect, walk this chain from the left: is the server running, does it see the probe, is the cable wired, is the chip powered, is the debug port still enabled by the firmware.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Breakpoints and watchpoints",
      body: `Both stop the core when something happens. They answer different questions.

A **breakpoint** stops when the core is **about to execute** a chosen address. Use it to ask "does the program get here, and what is the state when it does?".

A **watchpoint** stops when the core **reads or writes** a chosen data address. Use it to ask "who changes this variable?". It stops on the instruction that touched it, so the stack and the program counter show the guilty code.

Both are built from a handful of **hardware comparators** in the chip: a few for breakpoints (the flash patch unit) and a few for watchpoints (the data watchpoint unit). The numbers vary by core, so you can have only a small, fixed number of each at once.

A **software breakpoint** instead replaces the instruction with a trap. It uses no comparator but works only where the debugger can rewrite the code, which for flash needs a flash write.

Rule of thumb: a changing value is a watchpoint question; a code path is a breakpoint question.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: who zeroes the counter?",
      body: `Back to the scenario: \`sample_count\` jumps from 7 to 0 now and then.

**Step 1: pick the right tool.** The question is "who writes this variable", so use a **watchpoint**. A breakpoint on every line that could write it would need dozens of comparators.

**Step 2: set it.** Find the variable's address with \`print &sample_count\`, then \`watch sample_count\`. GDB uses one data comparator and reports a **hardware watchpoint**.

**Step 3: run until it triggers.** GDB stops on the instruction **after** the write completes and shows the old and the new value:

\`Old value = 7\`, \`New value = 0\`, then a line such as \`uart_rx_isr () at src/uart.c:58\` (illustrative).

**Step 4: read the stack.** \`backtrace\` shows who called whom. The write comes from an **interrupt handler** that was clearing a different counter through a pointer with the wrong offset.

**Step 5: remember what you disturbed.** The core was halted, so timers kept counting, and unless the debug settings froze them, a **watchdog** may have bitten during the stop.

The printf version changed the timing; the watchpoint version only paused it.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "watch-or-break-guided",
        skill: "debug-probe",
        objective: "Choose between a breakpoint and a watchpoint (guided).",
        prompt: `A global flag \`motor_enabled\` becomes 0 at some unknown moment and nothing in your code looks like it clears it. Which tool finds the code that does it?`,
        hints: [
          `Ask what you are really looking for: a place in the code, or a moment when data changes?`,
          `A breakpoint stops when an address is about to run. A watchpoint stops when an address is read or written.`,
          `You know the data address but not the code. Which tool starts from the data?`,
        ],
        options: [
          { id: "a", text: "A breakpoint at the start of main.", correct: false, feedback: `That stops once, at the start, and tells you nothing about a change that happens later.` },
          { id: "b", text: "A watchpoint on the address of motor_enabled, set to trigger on a write.", correct: true, feedback: `Right. It stops on the instruction that writes the flag, and the backtrace shows the code responsible. This is the case where the data is known and the code is not.` },
          { id: "c", text: "Breakpoints on every function in the project.", correct: false, feedback: `You would run out of hardware comparators long before that, and halting that often would change the timing you are chasing.` },
          { id: "d", text: "A printf of the flag in the main loop.", correct: false, feedback: `That samples the flag only when the loop runs and slows the program. The write may happen and be undone between two prints.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "A short GDB session, line by line",
      intro: `An illustrative session with the open-source OpenOCD server and an STM32F4 board, not captured output. The commands, not the values, are the point.`,
      language: "bash",
      code: `openocd -f interface/stlink.cfg -f target/stm32f4x.cfg
arm-none-eabi-gdb build/app.elf
(gdb) target extended-remote :3333
(gdb) monitor reset halt
(gdb) load
(gdb) break control_step
(gdb) continue
(gdb) watch sample_count
(gdb) x/4wx 0x40020014
(gdb) info registers pc
(gdb) backtrace`,
      notes: [
        { lines: "1", text: `Start the **GDB server**. It finds the probe, opens the debug port on the chip and listens, by default on port 3333 for GDB.` },
        { lines: "2-3", text: `Start GDB on the **ELF file**, which holds the symbols that map addresses to source lines, then connect it to the server.` },
        { lines: "4-5", text: `\`monitor\` sends a command to the server: reset the chip and **halt** it at the first instruction. \`load\` writes the program into flash through the probe.` },
        { lines: "6-7", text: `Set a **breakpoint** on a function and run. The core stops there with the source line shown.` },
        { lines: "8", text: `Set a **watchpoint** on a variable. GDB reports it as a hardware watchpoint when a comparator is available.` },
        { lines: "9", text: `Examine four words in hex at address 0x40020014, which on this part is a GPIO port's output data **register**. A peripheral register reads like memory.` },
        { lines: "10-11", text: `Show the **program counter** and the call stack where the core stopped.` },
      ],
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "probe-facts",
        skill: "debug-probe",
        objective: "Separate true statements about probes and breakpoints from myths.",
        prompt: `Select **every** statement that is true.`,
        options: [
          { id: "a", text: "SWD reaches the same debug features as JTAG on a Cortex-M part using two signal wires instead of four or five.", correct: true, feedback: `True. That is why SWD is the usual connector on small boards.` },
          { id: "b", text: "A chip has only a small, fixed number of hardware breakpoint and watchpoint comparators.", correct: true, feedback: `True. When they run out, the debugger either refuses or falls back to software breakpoints, which work only where it can rewrite the code.` },
          { id: "c", text: "Because a probe reads memory, it can read peripheral registers too, since those are memory-mapped addresses.", correct: true, feedback: `True. Examining 0x40020014 shows a GPIO register in the same way as a variable.` },
          { id: "d", text: "A J-Link works with any chip and an ST-LINK with none other than ST parts, with no exceptions.", correct: false, feedback: `Too absolute. J-Link supports many vendors, and ST-LINK is designed for ST parts, but support depends on the specific device and the probe's firmware; check the documentation for your part.` },
        ],
        solvedFeedback: `Right: SWD is the two-wire route to the same debug port; comparators are scarce; registers are memory; and "works with any chip" statements need checking against the part.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What halting costs, and when the probe cannot connect",
      body: `Stopping the core is not free. Three side effects to name in a review.

**Time keeps moving.** Peripherals such as timers keep running while the core is stopped unless the part freezes them in debug. A **watchdog** that is not frozen resets the chip during your breakpoint. A motor driven by a stopped control loop can run away: never halt a loop that holds a real actuator.

**Optimisation hides lines.** With high optimisation the compiler reorders and removes code, so stepping jumps about and variables read as "optimised out". Debug the build that has the bug, but know what it does to the view.

**The port may be closed.** If firmware reconfigures the two SWD pins as ordinary **GPIO**, or a readout protection is set, the probe cannot connect. The standard recovery is to hold **NRST** low and connect "under reset", before the firmware can run.

For real-time questions where halting is unacceptable, use non-stopping tools: trace, a real-time print channel or a logic analyser on a spare pin.

Limit to say aloud: a debugger shows what happened, not why the design allowed it.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "cannot-connect",
        skill: "debug-probe",
        objective: "Recover a board the debugger cannot connect to.",
        prompt: `A new firmware build reconfigured the two SWD pins as ordinary GPIO outputs. Now the debugger says it cannot connect to the target, although the board is powered and the probe's LED is lit. What is the standard first recovery step?`,
        options: [
          { id: "a", text: "Replace the probe; it must be faulty.", correct: false, feedback: `The probe is fine: the cause is on the chip. The firmware took over the pins the probe needs, so the port never answers.` },
          { id: "b", text: "Hold the chip in reset (NRST low) and connect under reset, then erase or reflash a build that leaves the SWD pins alone.", correct: true, feedback: `Right. While reset is held, the firmware has not run and the pins are still in their default debug function, so the probe can attach and erase the flash.` },
          { id: "c", text: "Lower the SWD clock to 1 kHz and try again.", correct: false, feedback: `Slowing the clock helps with long or noisy cables. It does nothing when the pins are no longer in their debug function.` },
          { id: "d", text: "Add a printf to the firmware to see what it is doing.", correct: false, feedback: `You cannot load new firmware, and the cause is already known from the pin change. Printing is the habit this lesson replaces.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "debug-probe-gdb-explained",
      intro: `Draw the debug chain, choose between a breakpoint and a watchpoint, and say what halting the core disturbs.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Reading a register under GDB beats guessing from a datasheet; setting a watchpoint beats adding prints to a time-critical loop.
- **Aerospace and UAV systems.** On a flight-computer card a halted core can leave actuators uncommanded, so engineers choose non-stopping tools and say why.
- **R&D and design.** Board bring-up depends on a working debug port: routing SWD to a header and keeping those pins free are schematic decisions.
- **Verification and interviews.** "How did you isolate the fault?" is answered with the chain, the comparator that caught it and what was disturbed.`,
    },
    {
      type: "recap",
      summary: `- A debug probe plus a GDB server lets GDB stop the core, step it and read memory and registers without changing the program.
- The chain: GDB, GDB server, probe, SWD (two wires) or JTAG (four or five), debug access port, core and memory.
- A breakpoint asks about code ("does it get here?"); a watchpoint asks about data ("who changes this?"). Both use few hardware comparators.
- Halting the core freezes your program but not the world: timers, watchdogs and actuators may not stop. Use non-stopping tools for real-time questions.
- If the port will not connect, check the chain from the left; if firmware repurposed the SWD pins, connect under reset.`,
      cards: [
        { id: "dbg-1", front: "Name the links from GDB to the core.", back: "GDB, GDB server (such as OpenOCD), the probe (ST-LINK or J-Link), SWD or JTAG, the debug access port, then the core and its memory and peripherals." },
        { id: "dbg-2", front: "Breakpoint or watchpoint: which finds the code that changes a variable?", back: "A watchpoint on the variable's address: it stops on the instruction that reads or writes it. A breakpoint stops where code is about to run." },
        { id: "dbg-3", front: "What does halting the core not stop?", back: "Peripherals such as timers keep running unless the part freezes them in debug; a watchdog can reset the chip; a halted control loop can leave an actuator running." },
        { id: "dbg-4", front: "The debugger cannot connect after a firmware change. First recovery step?", back: "Hold NRST low and connect under reset, before the firmware can reconfigure the SWD pins or lock the port; then erase and load a good build." },
      ],
    },
  ],
};
