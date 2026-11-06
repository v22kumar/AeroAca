import type { Mission } from "@/lib/content/schema";

export const theUartThatPrintsGarbage: Mission = {
  slug: "the-uart-that-prints-garbage",
  moduleId: "interfaces",
  title: "The UART that prints garbage",
  summary: "A new board's debug console shows symbols instead of text. Find out whether it is the terminal, the levels, the wiring or the clock, with the fewest measurements.",
  durationMinutes: 10,
  budgetMinutes: 30,
  whyItMatters: "A garbled console is the first thing many engineers meet on a new board. The measurement habit this mission builds, time one bit on the scope, settles the question in minutes and transfers to every clocked interface.",
  relatedLesson: "uart-framing-and-baud",
  scenario: `**Board:** a new STM32F4 controller board, first unit, 25 MHz crystal, a 3.3 V USB-to-UART adapter on the debug header (TX, RX, GND), status LED that should blink at 1 Hz.

**Firmware:** the same application that runs on the vendor evaluation board, rebuilt for this board. Console configured for 115 200 8N1.

**Observed:** on reset the terminal (115 200 8N1) shows a burst like \`ÿÿ‚à€x\` and then nothing. The status LED blinks, but fast, roughly three times a second.

Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Find the cause with evidence and propose a fix that leaves the board correct, not just the console readable.`,
  goal: `Identify the single root cause with a measurement a reviewer would accept, and choose the fix that corrects the board rather than compensating in the terminal.`,
  actions: [
    {
      id: "terminal-settings",
      label: "Re-check the terminal: port, 115 200, 8N1, no flow control",
      category: "inspect",
      costMinutes: 2,
      assessment: "useful",
      result: `Settings are correct: COM port of the adapter, 115 200 baud, 8 data bits, no parity, 1 stop bit, flow control off.`,
      assessmentNote: `Cheap and worth doing first; a wrong terminal setting is the most common cause of garbage. Here it is ruled out.`,
      evidence: "terminal-ok",
    },
    {
      id: "scope-bit-time",
      label: "Scope the board's TX pin and measure the shortest pulse",
      category: "scope",
      costMinutes: 5,
      assessment: "key",
      result: `Clean 0 to 3.3 V pulses during the burst. Shortest pulse width: **2.78 µs**. Expected for 115 200 baud: 8.68 µs. The board is transmitting at about **360 kbaud**, 3.125 times too fast.`,
      assessmentNote: `The decisive measurement. It proves the board is talking, the levels are logic level, and the rate is wrong by a specific ratio. Everything else follows from the number 3.125.`,
      evidence: "bit-time-3x",
    },
    {
      id: "led-period",
      label: "Time the status LED with the scope",
      category: "scope",
      costMinutes: 3,
      assessment: "key",
      result: `The LED toggles every **160 ms** instead of 500 ms. Period is **3.125×** too short, the same ratio as the UART.`,
      assessmentNote: `A second, independent timed behaviour scaled by the same factor. Two timed things wrong by the same ratio means the clock they share is wrong, not either peripheral.`,
      evidence: "led-3x",
    },
    {
      id: "clock-config",
      label: "Read the firmware's clock configuration and the board's crystal value",
      category: "document",
      costMinutes: 4,
      requiresAnyOf: ["scope-bit-time", "led-period"],
      assessment: "key",
      result: `The build defines \`HSE_VALUE = 8000000\`, inherited from the vendor evaluation board. The schematic and the part on the board say **25 MHz**. The PLL multiplies the real 25 MHz as if it were 8 MHz: every derived clock is 25 ÷ 8 = **3.125×** faster than the firmware believes.`,
      assessmentNote: `Root cause located and the ratio explained exactly. The scope said "3.125×"; the clock header says why.`,
      evidence: "hse-mismatch",
    },
    {
      id: "swap-adapter",
      label: "Try a different USB-to-UART adapter and cable",
      category: "firmware",
      costMinutes: 4,
      assessment: "neutral",
      result: `Same garbage, same rhythm.`,
      assessmentNote: `Reasonable to rule out the tool, but it does not add information about the board. The scope measurement would have told you more in the same time.`,
      evidence: "adapter-ok",
    },
    {
      id: "ground-check",
      label: "Check continuity between adapter GND and board GND",
      category: "measure",
      costMinutes: 2,
      assessment: "useful",
      result: `0.2 Ω. Ground is connected.`,
      assessmentNote: `Missing ground causes intermittent, cable-dependent garbage. This garbage is consistent, so ground was unlikely, but the check is quick and reviewers like to see it.`,
      evidence: "ground-ok",
    },
    {
      id: "try-baud-360k",
      label: "Set the terminal to 360 000 baud",
      category: "firmware",
      costMinutes: 3,
      requiresAnyOf: ["scope-bit-time"],
      assessment: "useful",
      result: `The banner is readable: "AeroNode v1.2 boot OK". Everything the firmware prints is intelligible at 360 kbaud.`,
      assessmentNote: `A clean confirmation of the measured rate. Note that it is a *test*, not a fix: the LED is still 3× fast and every timeout in the firmware is wrong.`,
      evidence: "readable-at-3x",
    },
    {
      id: "mco-measure",
      label: "Route SYSCLK/8 to the MCO pin and measure it",
      category: "scope",
      costMinutes: 6,
      requiresAnyOf: ["clock-config"],
      assessment: "useful",
      result: `MCO shows **65.6 MHz** where the firmware expects 21 MHz (168 MHz ÷ 8). Ratio 3.125.`,
      assessmentNote: `Direct confirmation of the system clock. After the scope and the header you already knew; this is the measurement that goes in the report.`,
      evidence: "sysclk-measured",
    },
    {
      id: "rs232-check",
      label: "Check whether the adapter is RS-232 or logic level",
      category: "inspect",
      costMinutes: 2,
      assessment: "neutral",
      result: `The adapter is a 3.3 V logic-level USB-to-UART device, as the scenario states.`,
      assessmentNote: `Level mismatch is a real failure class, but the scenario already gave the adapter type and the scope shows 0 to 3.3 V on both ends. Low information here.`,
    },
    {
      id: "reflash",
      label: "Erase and reflash the firmware",
      category: "firmware",
      costMinutes: 6,
      assessment: "wasteful",
      result: `Identical behaviour after reflash.`,
      assessmentNote: `The firmware image is not corrupt; it is configured for the wrong board. Reflashing the same configuration cannot change the outcome.`,
    },
    {
      id: "replace-crystal",
      label: "Replace the 25 MHz crystal with an 8 MHz one",
      category: "rework",
      costMinutes: 25,
      requiresAnyOf: ["clock-config"],
      assessment: "risky",
      result: `After rework the console reads correctly at 115 200 and the LED blinks at 1 Hz. The board no longer matches its schematic or its BOM, and the USB and Ethernet clock trees designed around 25 MHz are now wrong.`,
      assessmentNote: `It "works", which is what makes it dangerous. You changed the hardware to match a configuration file, broke two other subsystems, and created a unit that differs from every other unit that will be built. The fix belongs in the one line of firmware.`,
    },
  ],
  diagnoses: [
    {
      id: "terminal-baud",
      label: "The terminal is set to the wrong baud rate",
      correct: false,
      feedback: `The terminal was checked and is at 115 200. The board is the thing transmitting at 360 kbaud, and the LED blinking 3× fast has nothing to do with the terminal.`,
    },
    {
      id: "hse-value",
      label: "The firmware's clock configuration assumes an 8 MHz crystal, but the board has 25 MHz",
      correct: true,
      requiresEvidence: ["bit-time-3x", "hse-mismatch"],
      feedback: `Correct. The PLL multiplies the real crystal as if it were 8 MHz, so every clock, and therefore the UART divider and the LED timer, is 3.125× too fast. The measured bit time gave the ratio; the header gave the reason.`,
    },
    {
      id: "no-ground",
      label: "The adapter and the board do not share a ground",
      correct: false,
      feedback: `A missing ground gives intermittent, cable-sensitive corruption, not a stable 3.125× rate error, and continuity was 0.2 Ω. The LED symptom cannot be explained by grounding at all.`,
    },
    {
      id: "rs232-levels",
      label: "The adapter uses RS-232 levels on a 3.3 V UART",
      correct: false,
      feedback: `The adapter is logic level and the scope shows 0 to 3.3 V pulses. A level mismatch would not make the LED blink three times too fast.`,
    },
    {
      id: "tx-rx-swapped",
      label: "TX and RX are swapped on the header",
      correct: false,
      feedback: `Swapped pins give silence, because the terminal listens to a line nobody drives. Garbage with a consistent rhythm means data is arriving, just at the wrong rate.`,
    },
  ],
  fixes: [
    {
      id: "fix-hse-value",
      label: "Set HSE_VALUE to 25 000 000, regenerate the PLL settings for the intended 168 MHz, then re-verify MCO, the LED period and the bit time",
      quality: "best",
      feedback: `This corrects the firmware's model of the board, restores every derived clock at once, and ends with measurements that prove it. Add the board's crystal value to the project's board-definition so the next build cannot inherit the wrong one.`,
    },
    {
      id: "use-hsi",
      label: "Switch the clock tree to the internal HSI oscillator so the crystal value no longer matters",
      quality: "acceptable",
      feedback: `It makes the console and LED correct, and it is a reasonable fallback during bring-up. But HSI's accuracy (about 1 %) is marginal for USB and poor for anything needing precise timing, and the board's crystal was designed in for a reason. Use it to keep working today, not as the shipped configuration.`,
    },
    {
      id: "terminal-360k",
      label: "Document that this board's console runs at 360 000 baud and update the terminal profile",
      quality: "wrong",
      feedback: `This treats the symptom and leaves every other timed behaviour, LED, timeouts, bus clocks, wrong by 3.125×. A reviewer would also point out that 360 000 baud is a number nothing else in the product expects.`,
    },
  ],
  optimalPath: ["terminal-settings", "scope-bit-time", "led-period", "clock-config"],
  debrief: `Four actions and about fourteen bench-minutes. The terminal check removed the most common cause in two minutes. One scope measurement converted "garbage" into a number, 3.125, and that number pointed straight at the clock. The LED timing confirmed it was systemic, not a UART problem, and the clock header named the cause.

The trap was the rework: swapping the crystal makes the symptom disappear while making the product wrong. When a fix changes hardware to suit a configuration file, stop and ask which of the two was designed on purpose.

In an interview, this story is short: symptom, one measurement, a ratio, a one-line cause, a verified fix.`,
  references: [
    { title: "STM32F4 reference manual, RCC: HSE, PLL configuration and MCO", id: "RM0090", url: "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf" },
    { title: "STM32F4 reference manual, USART baud rate generation", id: "RM0090", note: "Why the generated baud scales directly with the peripheral clock." },
  ],
};
