import type { Lesson } from "@/lib/content/schema";

export const pollingInterruptsAndDma: Lesson = {
  slug: "polling-interrupts-and-dma",
  moduleId: "firmware-arch",
  title: "Polling, interrupts and DMA: choosing the driver model",
  summary: "Every peripheral driver is written one of three ways, and the right one follows from the data rate, the latency the data can tolerate and how much CPU is left. Learn the decision, the timer arithmetic behind a PWM output you will drive from each model, and the two DMA traps that bite on the first real board.",
  durationMinutes: 10,
  whyItMatters: "Choosing polling where DMA was needed, or an interrupt per byte at a megabit, is how a working prototype becomes a product that drops data under load. Interviewers ask 'how would you drive this peripheral and why?' to hear the trade-off, not a preference.",
  objectives: [
    "Choose between polling, interrupt and DMA from rate, latency tolerance and CPU budget, and say what each costs.",
    "Compute timer prescaler, period and compare values for a PWM frequency and duty, and the resolution that results.",
    "Avoid the DMA traps: half/complete handling, buffer ownership, and cache coherence on cores with a data cache.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Timer arithmetic per STM32 general-purpose timers (PSC, ARR, CCR); DMA behaviour per STM32 DMA chapters; cache-coherence guidance per Cortex-M7 application notes (ST AN4839).",
  },
  references: [
    { title: "STM32F4 reference manual: general-purpose timers (PWM mode), DMA controller", id: "RM0090", note: "f_PWM = f_TIM / ((PSC+1)(ARR+1)); DMA half-transfer and transfer-complete interrupts." },
    { title: "ST AN4839: Level 1 cache on STM32F7 series", note: "Cache maintenance or non-cacheable regions for DMA buffers." },
    { title: "Lesson: Queues vs shared buffers in ISR-to-task handoff", note: "What happens after the interrupt." },
  ],
  steps: [
    {
      type: "scenario",
      title: "An interrupt per byte at a megabit",
      body: `A UART at 921 600 baud receives a 2 kB telemetry block every 50 ms. The driver takes one interrupt per byte, each costing about 1 µs of entry, copy and exit on a 168 MHz part. At 92 kB/s that is 92 000 interrupts per second, about 9 % of the CPU just entering and leaving handlers, and the control loop that shares the core starts missing its deadline whenever telemetry arrives.

A DMA transfer into a circular buffer with half- and full-transfer interrupts takes two interrupts per 2 kB and about 0.01 % of the CPU. The data rate did not change; the driver model did. This lesson is the decision and the arithmetic.`,
    },
    {
      type: "concept",
      title: "Three models, one decision",
      body: `| Model | How | Costs | Good for | Bad for |
|---|---|---|---|---|
| **Polling** | The code checks a flag in a loop or at a known time | CPU spent waiting; latency = polling interval | Simple, rare, or strictly sequential operations; bring-up code; cases where the CPU has nothing else to do | Anything with other work to do or bursts to catch |
| **Interrupt** | The peripheral raises an interrupt per event; the handler captures and signals (day 18) | ~12 cycles in, ~12 out, plus the handler; one per event | Events at up to tens of kilohertz; low-latency reactions (a fault input, a CAN frame) | High-rate streams (an interrupt per byte or sample) |
| **DMA** | A controller moves data between peripheral and memory without the CPU; interrupts at half and full buffer | Setup complexity; buffer ownership rules; one interrupt per block | Streams: ADC at tens of kilohertz, audio, UART blocks, SPI displays | Tiny, irregular transfers where the setup costs more than the move |

The decision in three questions: **How often** (per second)? Below a few kilohertz, interrupts are fine; above tens of kilohertz, DMA. **How late may the data be**? A fault input needs a handler now; a telemetry block may wait for half a buffer. **How much CPU is left**? Multiply event rate by per-event cost and compare with the budget; the scenario's 9 % was the number nobody computed.

Mixed designs are normal: DMA moves the ADC samples, a half-transfer interrupt signals a task, the task polls nothing. A design review asks for the table above filled in for every peripheral.`,
      deeper: {
        title: "The two DMA traps",
        body: `**Ownership.** While DMA fills the second half of a circular buffer, the CPU may read only the first half; the half-transfer interrupt is the handover. Reading a half that DMA is still writing gives torn data. **Cache coherence.** On a core with a data cache (Cortex-M7), the CPU may read stale cached data after DMA wrote RAM, or DMA may read stale RAM before the CPU's cached write reached it. Fixes: place DMA buffers in a non-cacheable region (MPU), or invalidate the cache before reading and clean it after writing, by cache line. "DMA works on the F4 and gives garbage on the F7" is this trap, every time.`,
      },
    },
    {
      type: "visual",
      title: "Timer arithmetic for a PWM output",
      visual: "pwm-timer",
      body: `Set the timer clock, prescaler, period and compare values; read the PWM frequency, duty cycle and the number of distinct duty steps. The output is the same whether the duty is updated by polling, by an interrupt or by DMA into the compare register.`,
      caption: `f_PWM = f_TIM ÷ ((PSC + 1) × (ARR + 1)); duty = CCR ÷ (ARR + 1). STM32 general-purpose timer, edge-aligned PWM mode 1.`,
    },
    {
      type: "example",
      title: "Worked example: three peripherals, three models",
      body: `Board: 168 MHz STM32F4 running a 1 kHz control loop.

- **Fault input (over-current comparator output)**: one event, rare, must be handled within microseconds → **interrupt** (EXTI) at the most urgent priority; the handler disables the driver and signals a task.
- **Telemetry UART at 921 600 baud**: 92 kB/s stream, latency of tens of milliseconds acceptable → **DMA** circular buffer, 4 kB, half/full interrupts at priority 6 signalling a stream buffer; idle-line interrupt to catch the tail of a block.
- **PWM to a heater at 20 kHz with 1 % duty steps**: f_TIM = 84 MHz; want 100 steps → ARR = 99; (PSC + 1) = 84 MHz ÷ (20 kHz × 100) = 42 → PSC = 41; CCR = 25 for 25 %. Duty updated once per control-loop iteration by **polling** the loop's own schedule: a single register write at 1 kHz needs neither interrupt nor DMA.
- **Status LED**: toggled by the control loop → polling, trivially.

The table, filled in, is two lines per peripheral and the CPU budget sums to 11 %, mostly the control loop. The same board with an interrupt-per-byte UART summed to 20 % and missed deadlines.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "pwm-prescaler",
        skill: "driver-model",
        objective: "Compute PWM timer settings.",
        prompt: `A timer clocked at 84 MHz must produce 25 kHz PWM with 1 000 duty steps (ARR = 999). What prescaler register value PSC is required?`,
        unit: "",
        answer: 2.36,
        tolerance: 0.01,
        solution: `(PSC + 1) = f_TIM ÷ (f_PWM × (ARR + 1)) = 84 MHz ÷ (25 kHz × 1 000) = 3.36, so PSC = **2.36**: not an integer. The prescaler must be an integer, so 25 kHz with exactly 1 000 steps is impossible from 84 MHz; choose PSC = 2 (period 1 000 steps gives 28 kHz) or ARR = 1 119 with PSC = 2 (25 kHz with 1 120 steps). The arithmetic's job is to show that the requirement needs rounding, and which way.`,
        solvedFeedback: `Correct: the exact answer is 2.36, which is not an integer, so one of frequency, steps or clock must change. Recognising the conflict is the skill.`,
        misconceptions: [
          { value: 3.36, tolerance: 0.01, feedback: `3.36 is PSC + 1. The register holds PSC = 2.36, still not an integer: the requirement needs rounding.` },
          { value: 2, tolerance: 0.01, feedback: `PSC = 2 is the practical choice, but it gives 28 kHz with 1 000 steps, not 25 kHz. The exact value is 2.36; state the compromise.` },
          { value: 3, tolerance: 0.01, feedback: `PSC = 3 gives 84 MHz ÷ (4 × 1 000) = 21 kHz. The exact value is 2.36; state the compromise.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "model-choice",
        skill: "driver-model",
        objective: "Choose a driver model from the numbers.",
        prompt: `An ADC samples at 48 kHz and the data is processed in 10 ms blocks. Which driver model and why?`,
        options: [
          { id: "a", text: "DMA into a circular buffer with half- and full-transfer interrupts: 48 000 events per second is far too many interrupts, and 10 ms blocks tolerate the latency.", correct: true, feedback: `Yes. Two interrupts per block instead of 480, and the CPU does the processing, not the moving.` },
          { id: "b", text: "An interrupt per sample: it guarantees nothing is missed.", correct: false, feedback: `48 000 interrupts per second cost a large CPU fraction and jitter everything else; DMA misses nothing either.` },
          { id: "c", text: "Polling the ADC flag in the main loop.", correct: false, feedback: `A 21 µs sample period polled from a loop with other work drops samples.` },
          { id: "d", text: "A timer interrupt at 100 Hz that reads whatever the ADC has.", correct: false, feedback: `That reads one sample per 10 ms and discards 479.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "dma-traps",
        skill: "driver-model",
        objective: "Avoid the DMA traps.",
        prompt: `A DMA-based ADC driver works on an STM32F4 and returns garbage on an STM32F7 with the same code. Select **every** plausible cause or correct fix.`,
        options: [
          { id: "a", text: "The F7's data cache holds stale lines for the DMA buffer; invalidate the cache before reading the buffer.", correct: true, feedback: `The classic F4-to-F7 trap.` },
          { id: "b", text: "Place the DMA buffer in a non-cacheable MPU region.", correct: true, feedback: `The other standard fix, avoiding per-transfer cache maintenance.` },
          { id: "c", text: "DMA does not exist on the F7.", correct: false, feedback: `It does; the difference is the cache.` },
          { id: "d", text: "The CPU is reading the half of the buffer DMA is currently writing.", correct: true, feedback: `An ownership bug that may have been masked on the F4 by timing; fix the half/full handover.` },
          { id: "e", text: "Increase the ADC sample time.", correct: false, feedback: `Unrelated to garbage caused by coherence or ownership.` },
        ],
        solvedFeedback: `Right. Cache coherence (invalidate, or non-cacheable region) and buffer ownership are the two DMA traps.`,
      },
    },
    {
      type: "interview",
      questionId: "driver-model-choice",
      intro: `Give the three questions (rate, latency, CPU budget), the per-model costs, one example each, and the two DMA traps. The interrupt-per-byte arithmetic is the memorable number.`,
    },
    {
      type: "recap",
      summary: `- Polling: CPU waits, latency = interval; interrupts: per-event cost, good to tens of kilohertz and for urgent reactions; DMA: per-block cost, for streams.
- Decide by event rate, latency tolerance and CPU budget: rate × per-event cost against the budget.
- PWM: f_PWM = f_TIM ÷ ((PSC+1)(ARR+1)), duty = CCR ÷ (ARR+1); non-integer prescalers mean the requirement needs a stated compromise.
- DMA traps: buffer ownership across the half/full handover, and cache coherence on cores with a data cache (invalidate/clean, or non-cacheable region).`,
      cards: [
        { id: "drv-1", front: "Three questions that choose polling, interrupt or DMA?", back: "How often (events per second), how late may the data be (latency tolerance), how much CPU is left (rate × per-event cost against the budget)." },
        { id: "drv-2", front: "PWM frequency and duty from timer registers?", back: "f_PWM = f_TIM ÷ ((PSC + 1)(ARR + 1)); duty = CCR ÷ (ARR + 1); duty steps = ARR + 1. A non-integer PSC means frequency, steps or clock must change." },
        { id: "drv-3", front: "Why does a DMA driver that works on an F4 return garbage on an F7?", back: "The F7's data cache: the CPU reads stale cached lines after DMA wrote RAM. Invalidate the cache before reading (clean after writing), or put DMA buffers in a non-cacheable MPU region." },
        { id: "drv-4", front: "Cost of an interrupt per byte at 921 600 baud?", back: "About 92 000 interrupts per second; at roughly 1 µs each, about 9 % of a 168 MHz core doing nothing but entering and leaving handlers. DMA with half/full interrupts: two per block." },
      ],
    },
  ],
};
