import type { Lesson } from "@/lib/content/schema";

export const watchdogsAndResetLoops: Lesson = {
  slug: "watchdogs-and-reset-loops",
  moduleId: "mcu",
  title: "Watchdogs and reset loops",
  summary: "A watchdog is a promise the firmware makes to the hardware. Learn how the STM32 independent watchdog keeps time, how to size its timeout, and how to prove which reset source is restarting your board.",
  durationMinutes: 9,
  whyItMatters: "Every product that must not hang in the field uses a watchdog, and every bring-up engineer eventually meets a board that resets itself. Knowing how to read the reset-cause flags and size a timeout is a practical, interview-ready skill across avionics, automotive and medical work.",
  objectives: [
    "Explain what the independent watchdog does, what clocks it and why it cannot be stopped once started.",
    "Compute an IWDG timeout from the prescaler and reload value, and choose values for a required timeout.",
    "Distinguish a watchdog reset from a brown-out or pin reset using the reset-cause flags and a scope.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Register behaviour follows the STM32F4 reference manual (RM0090, independent watchdog and RCC chapters). The LSI frequency range comes from the STM32F405/407 datasheet. Values in exercises are worked examples, not measurements.",
  },
  references: [
    {
      title: "STM32F4 reference manual, Independent watchdog (IWDG) and RCC clock control/status register",
      id: "RM0090",
      url: "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
      note: "IWDG_KR key values, IWDG_PR prescaler codes, IWDG_RLR reload, RCC_CSR reset flags.",
    },
    {
      title: "STM32F405xx/407xx datasheet, LSI oscillator characteristics",
      note: "LSI runs at 32 kHz typical but is specified between 17 kHz and 47 kHz, which is why IWDG timeouts need margin.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "It worked yesterday",
      body: `A sensor node that ran for weeks starts rebooting about once a second after a firmware update. The update added SD-card logging. Nothing else changed.

The new engineer's first theory is a power problem. The second is a bad flash. Both would take an hour to chase.

A senior engineer reads one register and knows the answer in a minute. This lesson gives you that register, the arithmetic behind the watchdog that fired, and the habit of proving a reset source before you touch anything.`,
    },
    {
      type: "concept",
      title: "A promise the firmware keeps, or else",
      body: `A **watchdog** is a down-counter that resets the chip when it reaches zero. Firmware stops that from happening by reloading the counter regularly, a step people call *kicking*, *feeding* or *refreshing* the watchdog. If the program hangs, crashes into a fault handler, or spends too long in one place, the refresh stops arriving and the hardware restarts the system.

STM32 parts have two:

- The **independent watchdog (IWDG)** runs from its own low-speed internal oscillator (**LSI**, nominally 32 kHz). It keeps counting even if the main clock fails, which is the point. Once it is started it **cannot be stopped** by software; only a reset stops it. Writing 0xCCCC to its key register starts it, 0xAAAA reloads it, 0x5555 unlocks the prescaler and reload registers.
- The **window watchdog (WWDG)** runs from the bus clock and must be refreshed inside a *window*: too late resets the chip, and so does too early. It catches code that is running but not doing what it should, such as a loop that spins and refreshes without ever finishing the real work.

The IWDG is the one on most boards, so the rest of the lesson uses it.`,
      deeper: {
        title: "Where to refresh, and where never to",
        body: `The refresh should sit in **one place** that is only reached when the whole system has done a complete cycle of useful work, typically the end of the main loop after every subsystem has reported in. Spreading refreshes through the code, or putting one in a timer interrupt, produces a watchdog that keeps running while the application is dead.

A timer-interrupt refresh is the classic mistake: the interrupt keeps firing even after the main loop has hung on a blocking call, so the watchdog never trips and the product sits silently broken.`,
      },
    },
    {
      type: "visual",
      title: "Sizing the timeout",
      visual: "iwdg-timeout",
      body: `The timeout is set by two registers. Change the prescaler and the reload value and watch the timeout move. The LSI is not precise, so the range at the specified oscillator limits is shown too.`,
      caption: `Timeout = prescaler × (reload + 1) ÷ f_LSI. The prescaler codes 0 to 6 select ÷4 to ÷256; the reload register is 12 bits, so 0 to 4095. Illustrative calculator, not a measurement.`,
    },
    {
      type: "concept",
      title: "Reading the reset source",
      body: `The chip records why it last reset. On STM32F4 the flags live in **RCC_CSR**:

| Flag | Meaning |
|---|---|
| IWDGRSTF | Independent watchdog reset |
| WWDGRSTF | Window watchdog reset |
| BORRSTF | Brown-out reset (supply dipped below the threshold) |
| PINRSTF | NRST pin pulled low (button, supervisor, debugger) |
| SFTRSTF | Software reset (NVIC_SystemReset) |
| LPWRRSTF | Illegal low-power mode entry |
| PORRSTF | Power-on / power-down reset |

The flags are sticky: they stay set across resets until firmware writes the RMVF bit to clear them. A good startup routine reads them, logs them, then clears them, so the log of a field unit tells you *why* it restarted and not just *that* it did.

With a scope you can confirm the picture: a watchdog reset shows a short NRST pulse at a regular interval with VDD rock steady; a brown-out shows VDD dipping at the moment of the pulse; a supervisor fault holds NRST low continuously (the subject of the *MCU board does not boot* lesson).`,
    },
    {
      type: "example",
      title: "Worked example: the once-a-second reboot",
      body: `The node's IWDG is configured with prescaler code 3 (÷32) and reload 999:

timeout = 32 × (999 + 1) ÷ 32 000 Hz = **1.00 s**

The new SD-card logging calls a library initialisation that polls the card for up to 1.5 s with interrupts enabled but the main loop blocked. The refresh at the end of the main loop is never reached in time. The watchdog fires, the chip resets, startup runs the SD initialisation again, and the loop repeats about once a second.

Three facts a reviewer will want to see before any fix:

1. RCC_CSR after the reset shows **IWDGRSTF = 1** and BORRSTF = 0.
2. The reset interval on NRST matches the computed timeout.
3. Reverting the update makes it stop.

Then the fix is a design decision, not a guess: make the card initialisation non-blocking with its own timeout, or refresh inside it with a strict budget, but never simply stretch the watchdog to cover a bad loop.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "iwdg-timeout-calc",
        skill: "watchdog",
        objective: "Compute an IWDG timeout from prescaler and reload.",
        prompt: `An STM32F4 IWDG has prescaler code 4 (÷64) and reload value 2499. With the LSI at its nominal 32 kHz, what is the timeout in milliseconds?`,
        unit: "ms",
        answer: 5000,
        tolerance: 0.5,
        solution: `Timeout = 64 × (2499 + 1) ÷ 32 000 = 64 × 2500 ÷ 32 000 = **5 000 ms**, five seconds. At the datasheet's LSI limits (17 kHz to 47 kHz) the real value could lie anywhere between about 3.4 s and 9.4 s, which is why timeouts are chosen with margin.`,
        solvedFeedback: `Correct, 5 000 ms. Notice the "+1": the counter counts from the reload value down to 0 inclusive. Forgetting it is a 0.04 % error here but a 50 % error when the reload is 1.`,
        misconceptions: [
          { value: 4998, tolerance: 1, feedback: `You used the reload value without the +1. The counter counts reload + 1 ticks (from 2499 down to 0), so the timeout is 64 × 2500 ÷ 32 000 = 5 000 ms.` },
          { value: 78.1, tolerance: 1, feedback: `That is 2500 ÷ 32 000 in milliseconds: you forgot the prescaler. The LSI is divided by 64 before it reaches the counter, so each tick is 2 ms, not 31 µs.` },
          { value: 5, tolerance: 0.01, feedback: `5 is the answer in seconds. The question asks for milliseconds: 5 000 ms.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "reset-source-flags",
        skill: "reset",
        objective: "Prove a reset source before acting.",
        prompt: `A board restarts every 2 s. After a restart, RCC_CSR reads with **BORRSTF = 1, IWDGRSTF = 0, PINRSTF = 1**. The IWDG timeout is 2.0 s. What is the most defensible next step?`,
        options: [
          { id: "a", text: "Increase the watchdog timeout; the interval matches the IWDG period, so it must be the watchdog.", correct: false, feedback: `The flags say otherwise: IWDGRSTF is clear. A matching interval is circumstantial; the register is evidence. Changing the watchdog here would mask the real fault.` },
          { id: "b", text: "Scope VDD at the MCU pin while the fault happens; the brown-out flag says the supply dipped below the threshold.", correct: true, feedback: `Right. BORRSTF is set, so the supply fell below the brown-out level. Something draws a surge every 2 s, or the regulator or input is marginal. PINRSTF often appears alongside other sources on STM32 and does not change the conclusion. The scope will show the dip and its timing.` },
          { id: "c", text: "Replace the reset supervisor; PINRSTF is set, so the pin was pulled low.", correct: false, feedback: `PINRSTF is set by many reset sequences on STM32 because the internal reset also drives NRST low briefly, so it is weak evidence on its own. The specific flag, BORRSTF, points at the supply.` },
          { id: "d", text: "Reflash the firmware; a fault handler is probably calling a software reset.", correct: false, feedback: `A software reset would set SFTRSTF, which is clear. Reflashing without evidence is the expensive guess this lesson exists to prevent.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "watchdog-refresh-placement",
        skill: "watchdog",
        objective: "Place the refresh where it proves the system is healthy.",
        prompt: `Select **every** refresh placement that would let the watchdog fire when the main loop is stuck in a blocking call.`,
        options: [
          { id: "a", text: "Once at the end of the main loop, after all subsystems have run.", correct: true, feedback: `Good placement. If the loop blocks, the refresh is not reached and the watchdog does its job.` },
          { id: "b", text: "Inside a 10 ms timer interrupt handler.", correct: false, feedback: `This defeats the watchdog: the interrupt keeps firing while the main loop is hung, so the refresh continues and the fault is never caught.` },
          { id: "c", text: "At the end of the main loop, but only if every subsystem set its 'alive' flag this cycle.", correct: true, feedback: `Even better than a plain end-of-loop refresh: a subsystem that silently stops reporting also causes a reset, which is usually what you want in a safety-relevant product.` },
          { id: "d", text: "At the top of each driver function, so a slow driver cannot cause a reset.", correct: false, feedback: `Refreshing everywhere turns the watchdog into decoration. A driver that is called but never completes keeps refreshing it on each entry; the design goal is for the watchdog to notice when work is not completing.` },
        ],
        solvedFeedback: `Exactly. The refresh should be reachable only by a full, healthy cycle of the application. Interrupt-driven and scattered refreshes keep a dead system alive in appearance only.`,
      },
    },
    {
      type: "interview",
      questionId: "watchdog-strategy",
      intro: `Watchdog questions separate people who have shipped products from people who have read about them. Keep the answer concrete: clock, timeout, where the refresh lives, what the reset flags tell you.`,
    },
    {
      type: "recap",
      summary: `- The IWDG counts down on the LSI (nominally 32 kHz, specified 17 to 47 kHz) and resets the chip at zero. Once started it cannot be stopped.
- Timeout = prescaler × (reload + 1) ÷ f_LSI. Choose values with margin for the LSI tolerance.
- Refresh in one place, reached only by a healthy full cycle. Never from a timer interrupt.
- RCC_CSR flags record the reset cause; read, log and clear them at startup.
- Prove the source with the flags and a scope before changing anything.`,
      cards: [
        { id: "wdg-1", front: "IWDG timeout formula on STM32F4?", back: "prescaler × (reload + 1) ÷ f_LSI, with prescaler ÷4 to ÷256 (codes 0 to 6), reload 0 to 4095, LSI nominally 32 kHz but 17 to 47 kHz by datasheet." },
        { id: "wdg-2", front: "Why not refresh the watchdog from a timer interrupt?", back: "The interrupt keeps running while the main loop is hung, so the watchdog is refreshed and never fires. Refresh once per healthy main-loop cycle instead." },
        { id: "wdg-3", front: "Which register tells you why an STM32 last reset?", back: "RCC_CSR: IWDGRSTF, WWDGRSTF, BORRSTF, PINRSTF, SFTRSTF, LPWRRSTF, PORRSTF. Sticky until RMVF is written." },
        { id: "wdg-4", front: "Board resets every 1 s after adding a 1.5 s blocking call. Cause and fix?", back: "The IWDG (1 s timeout) fires because the end-of-loop refresh is never reached. Make the call non-blocking with its own timeout; do not simply lengthen the watchdog." },
      ],
    },
  ],
};
