import type { Lesson } from "@/lib/content/schema";

export const mcuBoardDoesNotBoot: Lesson = {
  slug: "mcu-board-does-not-boot",
  moduleId: "mcu",
  title: "MCU board does not boot",
  summary: "A silent board is a power, reset, clock or boot-configuration problem far more often than a firmware one. Learn the order that finds it fastest.",
  durationMinutes: 9,
  objectives: [
    "Check power, reset, clock and boot configuration in an order that eliminates the most likely causes first.",
    "Explain what the debugger can and cannot tell you when a core is held in reset or running from the wrong memory.",
    "Recognise the classic firmware hang when the external crystal never becomes ready.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Pin names and boot behaviour follow STM32F4 documentation (RM0090, AN2606, AN4488). Other MCU families differ in detail but not in method.",
  },
  references: [
    {
      title: "STM32F405/415, F407/417, F427/437, F429/439 reference manual",
      id: "RM0090",
      url: "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
      note: "Sections on RCC (clock control) and the reset and clock chapter.",
    },
    {
      title: "STM32 microcontroller system memory boot mode",
      id: "AN2606",
      url: "https://www.st.com/resource/en/application_note/an2606-stm32-microcontroller-system-memory-boot-mode-stmicroelectronics.pdf",
      note: "BOOT pin sampling and the built-in bootloader.",
    },
    {
      title: "Getting started with STM32F4xxxx MCU hardware development",
      id: "AN4488",
      url: "https://www.st.com/resource/en/application_note/an4488-getting-started-with-stm32f4xxxx-mcu-hardware-development-stmicroelectronics.pdf",
      note: "Decoupling, VCAP, NRST and crystal recommendations.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "The board that does nothing",
      body: `A new revision of a small STM32F4 sensor board is back from assembly. You apply 5 V from the bench supply. The green power LED lights. The status LED that should blink at 1 Hz once firmware starts stays dark. The debugger reports **"No target connected"**.

Your colleague's first instinct is to reflash the firmware. Yours should not be.

In this lesson you will build a short, ordered checklist that finds the fault in the fewest measurements, and you will learn what each measurement actually proves. The method applies to almost any microcontroller board, not only STM32.`,
    },
    {
      type: "concept",
      title: "Four things must be true before any code runs",
      body: `A microcontroller executes its first instruction only when all of these hold:

1. **Power.** Every supply pin is inside its specified range: the digital supply (VDD), the analogue supply (VDDA, often tied to VDD through a filter), and on STM32F4 the **VCAP** pins that expose the internal 1.2 V core regulator and need their external capacitors.
2. **Reset released.** The active-low **NRST** pin must be high. Anything holding it low, a supervisor IC, a debugger, a shorted reset capacitor, keeps the core frozen.
3. **A clock.** STM32 parts start from the internal RC oscillator (HSI, 16 MHz on F4) regardless of any external crystal. The crystal (HSE) only matters once firmware switches to it.
4. **Boot source.** The **BOOT0** pin (with BOOT1 or option bits on some families) is sampled right after reset and decides whether execution starts from main flash, the system-memory bootloader or SRAM.

A board that is "dead" has usually failed one of these, and they are cheap to test in this order: power, reset, clock, boot. Firmware comes last because it cannot be the cause if the core never starts.`,
      deeper: {
        title: "Why the debugger says 'no target'",
        body: `SWD talks to the debug access port inside the chip. That port needs the core domain powered and clocked. It does **not** need the external crystal, and it does **not** need valid firmware in flash.

So "No target connected" narrows the search sharply:

- Core domain unpowered (VDD or VCAP wrong), or
- Reset held low continuously (many debuggers cannot attach while NRST is asserted), or
- SWD pins not reaching the chip (wrong pins, damaged trace, debugger wiring), or
- The SWD pins were reconfigured by firmware as GPIO, which only matters if the chip actually runs. In that case a **connect under reset** usually recovers it.

A chip running the ROM bootloader because BOOT0 is high still answers the debugger. A chip whose crystal is dead still answers the debugger. Neither explains "no target".`,
      },
    },
    {
      type: "visual",
      title: "The boot chain",
      visual: "mcu-boot-chain",
      body: `Tap each stage to see what to measure and what a good reading looks like. The values are typical of an STM32F4 board at 3.3 V; always confirm limits in the datasheet for your part.`,
      caption: `Power → reset → clock → boot source → first instruction. Each stage gates the next, which is why the checklist runs left to right.`,
    },
    {
      type: "concept",
      title: "Measure, do not assume",
      body: `**Power.** Measure at the MCU pins, not at the regulator output. A 3.3 V rail reading 3.29 V at the regulator but 2.4 V at the chip points to a broken trace or a bad ferrite bead. Then measure current: a board drawing a few milliamps with nothing running, or hundreds of milliamps with a warm part, both tell a story. The STM32F4 core regulator output on VCAP should sit around 1.2 V; if it is at 0 V with VDD present, the chip is not alive.

**Reset.** NRST has a weak internal pull-up (tens of kΩ). With a multimeter it should read close to VDD. Reading near 0 V means something is actively pulling it low. If it reads correctly on a meter, look with a scope: short repeating pulses mean the chip keeps resetting itself (watchdog, brown-out detector or a firmware fault that ends in a reset).

**Clock.** Because the HSI starts automatically, a dead crystal does not stop boot. It stops firmware that switches to HSE and waits for the ready flag:

\`\`\`c
RCC->CR |= RCC_CR_HSEON;
while (!(RCC->CR & RCC_CR_HSERDY)) { }   /* hangs forever if the crystal never starts */
\`\`\`

The symptom is a board that answers the debugger, halts inside that loop, and never reaches \`main()\` logic. Probing a crystal pin with a normal 10x probe adds capacitance and can stop a marginal oscillator; prefer the MCO (master clock output) pin or a low-capacitance probe.

**Boot source.** On STM32F4, BOOT0 low selects main flash. BOOT0 high with BOOT1 low selects the system bootloader; BOOT0 high with BOOT1 high selects SRAM. A floating BOOT0 behaves randomly between power cycles. The pin is sampled on the fourth rising edge of SYSCLK after reset, so it must be stable at that moment, not just eventually.`,
    },
    {
      type: "example",
      title: "Worked example: three boards, three readings",
      body: `| Observation | Most likely stage | Next move |
|---|---|---|
| VDD 3.30 V, VCAP 0.0 V, current 2 mA, no target | Power (core regulator) | Check VCAP capacitors fitted and not shorted; check the chip is the right part/orientation |
| VDD 3.30 V, VCAP 1.22 V, NRST 0.05 V flat, no target | Reset held | Find what pulls NRST low: supervisor, debugger, shorted cap, push button |
| VDD 3.30 V, NRST 3.3 V, debugger connects, PC stuck in \`while(!HSERDY)\` | Clock (HSE) | Check crystal, load caps, solder; confirm HSE bypass vs crystal mode in firmware |

Notice that each row needed only a meter, and the third needed the debugger halting the core. None of them needed a firmware rebuild.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "boot-check-order",
        skill: "debug-order",
        objective: "Order bring-up checks so each measurement eliminates the largest remaining cause.",
        prompt: `A board shows a lit power LED, no activity, and "No target connected". Put these checks in the order a senior engineer would do them. Tap items in sequence.`,
        items: [
          { id: "vdd", text: "Measure VDD and VCAP at the MCU pins", why: "Nothing downstream can work without correct supplies, and a meter answers this in seconds." },
          { id: "nrst", text: "Measure NRST with a meter, then a scope", why: "With power confirmed, reset is the next gate. 'No target' is commonly a held reset." },
          { id: "boot0", text: "Check the BOOT0 level", why: "Cheap to check once the core could run; a wrong level changes what runs, not whether the debugger connects." },
          { id: "swd", text: "Connect the debugger, halt and read the program counter", why: "Once power and reset are right, the debugger tells you exactly where the core is stuck." },
          { id: "rebuild", text: "Rebuild and reflash the firmware", why: "Only after the core is proven to run and you have a reason to suspect the image." },
        ],
        correctOrder: ["vdd", "nrst", "boot0", "swd", "rebuild"],
        solvedFeedback: `Correct. Power, reset, boot configuration, then the debugger, then firmware. Each step is cheaper and more likely than the one after it, so this order minimises expected time to diagnosis.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "crystal-no-target",
        skill: "clock",
        objective: "Separate what the debugger needs from what firmware needs.",
        prompt: `The 8 MHz crystal on a board shows no oscillation on the scope, and the debugger reports "No target connected". A colleague concludes the crystal is the root cause. What is the best response?`,
        options: [
          {
            id: "a",
            text: "Agree: without the crystal the chip has no clock, so nothing can run.",
            correct: false,
            feedback: `Not on STM32. The internal RC oscillator (HSI) runs from reset without any external part, and the SWD port does not depend on the crystal. A silent crystal cannot by itself cause "no target".`,
          },
          {
            id: "b",
            text: "Disagree: SWD works from the internal oscillator, so look at power and reset first; the crystal being quiet may just mean the core is in reset or has not enabled HSE yet.",
            correct: true,
            feedback: `Right. The HSE oscillator is off until firmware turns it on, and it is off while the chip is in reset. A quiet crystal is an *expected* observation on a chip that has not started, not evidence of a crystal fault.`,
          },
          {
            id: "c",
            text: "Replace the crystal and its load capacitors, then retest.",
            correct: false,
            feedback: `This is rework without evidence. Even if the crystal were faulty, it would not explain the debugger failing to attach. Measure power and NRST first; they take two minutes.`,
          },
          {
            id: "d",
            text: "Set BOOT0 high to use the bootloader, which runs without a crystal.",
            correct: false,
            feedback: `The bootloader runs from the HSI like everything else at reset, so this changes nothing about the clock, and it does not address why SWD cannot see the core. It also adds a variable to the experiment.`,
          },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "reset-pulses",
        skill: "reset",
        objective: "Interpret NRST waveforms.",
        prompt: `On the scope, NRST sits at 3.3 V but drops to 0 V for about 20 µs every 1.6 seconds. The status LED flickers briefly at the same rate. Which explanation fits best?`,
        context: `The firmware enables the independent watchdog early in \`main()\`.`,
        options: [
          {
            id: "a",
            text: "The reset supervisor has the wrong voltage threshold and keeps asserting reset.",
            correct: false,
            feedback: `A supervisor with the threshold above VDD would hold NRST low *continuously*, not pulse it. The line here is high most of the time, so the chip is being released and then reset again.`,
          },
          {
            id: "b",
            text: "The chip is starting, running for about 1.6 s, then resetting itself, consistent with an unserviced watchdog.",
            correct: true,
            feedback: `Yes. Periodic short reset pulses with a brief flicker of activity mean the core runs and then something resets it. An independent watchdog that is enabled but never refreshed produces exactly this. Halting with the debugger just before the pulse, or reading the reset-cause flags in RCC_CSR, confirms it.`,
          },
          {
            id: "c",
            text: "The debugger is toggling NRST while trying to connect.",
            correct: false,
            feedback: `A debugger attach would be a one-off pulse when you press connect, not a regular 1.6 s rhythm, and it would not make the status LED flicker in time with it.`,
          },
          {
            id: "d",
            text: "The crystal takes 1.6 s to start, so the chip resets while waiting.",
            correct: false,
            feedback: `Waiting for HSE ready does not generate a reset; it simply spins in a loop. Resets come from the watchdog, the brown-out detector, the NRST pin, a software reset or a lockup, and the pattern here points at a watchdog.`,
          },
        ],
      },
    },
    {
      type: "interview",
      questionId: "mcu-no-boot-walkthrough",
      intro: `You will be asked a version of this in almost every hardware or firmware interview. Practise saying it out loud, in order, with what each measurement proves.`,
    },
    {
      type: "recap",
      summary: `- Nothing runs until power, reset, clock and boot source are all correct, in that order of dependency.
- Measure at the MCU pins. VDD, VCAP (core regulator), NRST, BOOT0.
- "No target connected" means power, reset or SWD wiring, not firmware or the crystal.
- A quiet crystal on a chip in reset proves nothing; HSI starts the chip, and firmware waiting for HSERDY is a hang, not a reset.
- Periodic NRST pulses mean the chip runs then resets itself: suspect a watchdog or brown-out, and read the reset-cause flags.`,
      cards: [
        { id: "mcu-boot-1", front: "Order of bring-up checks for a dead board?", back: "Power at the pins (VDD, VDDA, VCAP) → NRST released → clock (HSI starts automatically) → BOOT0 level → debugger halt and read PC → only then firmware." },
        { id: "mcu-boot-2", front: "What does 'No target connected' rule in and out?", back: "In: core unpowered, NRST held low, SWD wiring/pins. Out: dead crystal, wrong BOOT0 level, bad firmware image. The debug port works from HSI without valid flash." },
        { id: "mcu-boot-3", front: "Symptom of a dead HSE crystal in firmware?", back: "Board boots and the debugger attaches, but the core spins in `while(!(RCC->CR & RCC_CR_HSERDY))` and never reaches application logic." },
        { id: "mcu-boot-4", front: "NRST pulses low every ~1.6 s. Suspect?", back: "The chip starts and then resets itself: unserviced watchdog or brown-out. Confirm with reset-cause flags (RCC_CSR) or halt before the pulse." },
      ],
    },
  ],
};
