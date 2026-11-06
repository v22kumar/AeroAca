import type { Lesson } from "@/lib/content/schema";

export const interruptsAndNvicPriorities: Lesson = {
  slug: "interrupts-and-nvic-priorities",
  moduleId: "mcu",
  prerequisites: ["from-reset-vector-to-main", "gpio-and-the-clock-tree"],
  title: "Interrupts and NVIC priorities without surprises",
  summary: "On a Cortex-M a smaller priority number wins, priorities split into preemption and sub-priority by a grouping register, and an RTOS reserves the urgent end for interrupts that never call it. Learn the rules, the deadlock that HAL_Delay in an interrupt causes, and how to measure interrupt latency and duration.",
  durationMinutes: 10,
  whyItMatters: "Interrupt faults are intermittent, timing-dependent and invisible to printf. 'Why does the board hang when I call this in the ISR?' and 'how do you set interrupt priorities?' are standard embedded interview questions with precise answers.",
  objectives: [
    "Explain NVIC priority numbering, preemption versus sub-priority grouping, pending and active states, and tail chaining.",
    "Apply the rules for ISR content and priority assignment, including the RTOS syscall limit and the SysTick deadlock.",
    "Measure interrupt latency and handler duration with a GPIO and a scope.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Follows the ARMv7-M architecture (NVIC, PRIGROUP in AIRCR, BASEPRI/PRIMASK) and STM32 implementations with four priority bits; FreeRTOS constraints per the kernel documentation. The HAL_Delay deadlock is a documented STM32 HAL behaviour.",
  },
  references: [
    { title: "ARMv7-M Architecture Reference Manual: exception model, NVIC, priority grouping", note: "Priority numbers, PRIGROUP, pending/active, tail chaining." },
    { title: "STM32F4 reference manual and programming manual (PM0214)", id: "RM0090", note: "NVIC with 4 priority bits (16 levels); HAL_NVIC_SetPriorityGrouping." },
    { title: "FreeRTOS: configMAX_SYSCALL_INTERRUPT_PRIORITY and Cortex-M caveats", note: "Why only lower-urgency interrupts may call the kernel." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The handler that waited for a tick that could not come",
      body: `A UART receive interrupt calls \`HAL_Delay(1)\` to wait for a line driver to settle. The board hangs on the first byte. HAL_Delay counts SysTick ticks; SysTick's interrupt has the lowest priority in the system; the UART handler, at a higher priority, is running and so SysTick can never preempt it to increment the counter. The handler waits for ever for a tick that its own existence prevents.

Three rules would have prevented it, and they are the whole of this lesson: a smaller number wins, nothing in a handler waits for a lower-urgency interrupt, and handlers capture and signal rather than delay.`,
    },
    {
      type: "concept",
      title: "Numbers, grouping, states",
      body: `**Smaller number, higher urgency.** Priority 0 preempts priority 5. STM32 parts implement 4 priority bits, so 16 levels (0 to 15); writing 200 into the register gives 12 (the top four bits). Reset, NMI and HardFault have fixed negative priorities and preempt everything.

**Preemption versus sub-priority.** The 4 bits are split by the priority group (AIRCR.PRIGROUP; HAL's \`HAL_NVIC_SetPriorityGrouping\`). With group 4 (the usual choice and what HAL sets by default on STM32), all 4 bits are **preemption priority**: an interrupt with a smaller number interrupts a running handler with a larger one. With other groupings some bits become **sub-priority**, which only orders handlers that are pending at the same time; a sub-priority never preempts a running handler. Mixed groupings are where "I set priority 3 and it still did not preempt" comes from: it had a higher sub-priority, not a higher preemption priority.

**Pending and active.** An interrupt becomes *pending* when its source fires; the NVIC runs it when its priority allows, making it *active*; if the source fires again while it is active, it becomes pending again and runs once more after. Clearing the peripheral's flag inside the handler, early, matters: clear it at the end and a second event during the handler can be lost, or the handler can re-enter once for a stale flag.

**Tail chaining and latency.** Entering a handler takes about 12 cycles (register stacking); leaving one directly into another pending handler skips the unstack and restack. Worst-case latency for an interrupt is the stacking time plus the longest time interrupts are masked (a critical section) plus the longest handler of equal or higher priority that may be running. That sum is a number you can bound by design and verify with a scope.`,
      deeper: {
        title: "Masking: PRIMASK versus BASEPRI",
        body: `\`__disable_irq()\` sets PRIMASK and blocks every configurable interrupt. BASEPRI blocks only interrupts at or below a given urgency, which is how FreeRTOS implements critical sections: it raises BASEPRI to configMAX_SYSCALL_INTERRUPT_PRIORITY, so interrupts more urgent than that keep running and may not use the kernel, while everything the kernel cares about is masked. A critical section's length is therefore part of the latency budget of every interrupt it masks.`,
      },
    },
    {
      type: "visual",
      title: "Who preempts whom",
      visual: "nvic-priorities",
      body: `Set the priority grouping and the numbers of three interrupts and a critical-section mask; the diagram shows which can preempt which and which may call the RTOS.`,
      caption: `Illustrative, for a 4-bit NVIC as on STM32F4. Other parts have 3 or 8 bits.`,
    },
    {
      type: "concept",
      title: "Rules for handlers and priorities, and how to measure",
      body: `**Handlers:** clear the source flag early; capture data and signal a task (queue, semaphore, notification, all FromISR variants; day 18); never wait for anything, never call a function that waits (HAL_Delay, blocking HAL transmit, printf), never take a mutex; keep the duration to microseconds and measure it.

**Priorities:** assign by deadline, not by importance; the thing that loses data if late (an ADC at 1 MHz, a CAN receive) sits at the urgent end; SysTick and anything that services the kernel sit at the lazy end. With FreeRTOS, every interrupt that calls the kernel must have a priority number **greater than or equal to** configMAX_SYSCALL_INTERRUPT_PRIORITY (less urgent); more urgent interrupts may run at any time but must not touch the API. Document the table; it is part of the design.

**Measurement:** set a GPIO high at handler entry and low at exit; on a scope, the pulse width is the handler duration and the delay from the peripheral event (e.g. the UART start bit, or a timer output) to the rising edge is the latency. Infinite-persistence display shows the worst case over minutes. This is the evidence for the timing budget and for the "no handler longer than X µs" rule in review.`,
    },
    {
      type: "example",
      title: "Worked example: a priority table that works",
      body: `STM32F4, FreeRTOS with configMAX_SYSCALL_INTERRUPT_PRIORITY = 5 (i.e. priorities 5 to 15 may call the kernel), grouping 4.

| Interrupt | Priority | Calls kernel? | Rule |
|---|---|---|---|
| ADC DMA half/complete (1 kHz loop) | 2 | **No**: sets a flag read by a task via a timer-driven notification at priority 6 | Most urgent; data lost if late; above the syscall limit so it cannot use the API |
| CAN RX FIFO | 5 | Yes: xQueueSendFromISR | At the limit; may use FromISR calls |
| UART RX | 6 | Yes: stream buffer FromISR | |
| Timer for logging | 8 | Yes: notify | |
| SysTick (kernel tick) | 15 | kernel | Least urgent, as the kernel requires |
| PendSV (context switch) | 15 | kernel | Lowest |

The scenario's handler would sit at 6 and must not call HAL_Delay; the line-driver settle is a timer-scheduled task action. Every handler is measured: longest 18 µs (CAN RX), budgeted at 50 µs.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "hal-delay-isr",
        skill: "nvic",
        objective: "Explain the ISR deadlock.",
        prompt: `A board hangs when a UART interrupt handler calls HAL_Delay(1). Why?`,
        options: [
          { id: "a", text: "HAL_Delay waits for SysTick ticks; SysTick has a lower urgency than the UART handler and cannot preempt it, so the tick count never advances.", correct: true, feedback: `Yes. A handler must never wait for an interrupt of equal or lower urgency. Capture and signal; let a task wait.` },
          { id: "b", text: "HAL_Delay uses too much stack.", correct: false, feedback: `Stack is not the issue; the function simply never returns.` },
          { id: "c", text: "Interrupts are disabled inside all handlers, so nothing else can run.", correct: false, feedback: `Higher-urgency interrupts do preempt handlers; SysTick is lower urgency, which is the point.` },
          { id: "d", text: "The UART interrupt has a bug and re-triggers continuously.", correct: false, feedback: `The hang is explained entirely by the priority relationship; re-triggering would show as a different symptom.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "preempt-levels",
        skill: "nvic",
        objective: "Count preemption levels from the grouping.",
        prompt: `An NVIC implements 4 priority bits. The priority grouping assigns 2 bits to preemption priority and 2 to sub-priority. How many distinct **preemption** levels are available?`,
        unit: "levels",
        answer: 4,
        tolerance: 0.1,
        solution: `2 preemption bits give 2² = **4** preemption levels (0 to 3), each with 4 sub-priorities that only order pending handlers and never preempt. With grouping 4 (all bits preemption) there would be 16.`,
        solvedFeedback: `Correct: 4. Sub-priority bits never preempt a running handler.`,
        misconceptions: [
          { value: 16, tolerance: 0.1, feedback: `16 is the total number of priority values (4 bits). Only the 2 preemption bits create preemption levels: 4.` },
          { value: 2, tolerance: 0.1, feedback: `2 bits give 2² = 4 levels, not 2.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "isr-priority-rules",
        skill: "nvic",
        objective: "Apply the priority rules.",
        prompt: `Select **every** true statement about Cortex-M interrupt priorities.`,
        options: [
          { id: "a", text: "A smaller priority number is more urgent and preempts a larger one.", correct: true, feedback: `0 beats 5.` },
          { id: "b", text: "Sub-priority bits decide which of two pending handlers runs first but never preempt a running handler.", correct: true, feedback: `Only preemption bits preempt.` },
          { id: "c", text: "Interrupts more urgent than configMAX_SYSCALL_INTERRUPT_PRIORITY may call FreeRTOS FromISR functions.", correct: false, feedback: `The opposite: only interrupts at or below that urgency (numerically greater or equal) may call the kernel.` },
          { id: "d", text: "Clearing the peripheral's interrupt flag early in the handler avoids lost or spurious re-entries.", correct: true, feedback: `A flag cleared at the end can lose an event that arrives during the handler.` },
          { id: "e", text: "Interrupt latency is bounded by stacking time plus the longest masked section plus the longest handler of equal or higher urgency.", correct: true, feedback: `And it is measurable with a GPIO and a scope.` },
        ],
        solvedFeedback: `Right. Smaller wins, sub-priority never preempts, kernel calls only from the lazy side of the limit, clear flags early, and bound latency by design and measurement.`,
      },
    },
    {
      type: "interview",
      questionId: "nvic-priorities",
      intro: `Give the three rules, explain grouping, tell the HAL_Delay deadlock, and describe the GPIO-and-scope measurement. A priority table with a reason per row is the strong close.`,
    },
    {
      type: "recap",
      summary: `- Smaller number wins; STM32 has 4 bits (16 levels); grouping splits them into preemption and sub-priority; only preemption bits preempt.
- Pending and active states; clear the source flag early; tail chaining saves unstack/restack.
- Handlers capture and signal with FromISR calls; never wait, never call anything that waits (HAL_Delay on a lower-urgency SysTick deadlocks), never take a mutex.
- Priorities by deadline; interrupts that call the kernel sit at or below configMAX_SYSCALL_INTERRUPT_PRIORITY in urgency; SysTick and PendSV lowest.
- Measure latency and duration with a GPIO on a scope; bound latency by stacking + masked time + longest higher-or-equal handler.`,
      cards: [
        { id: "nvic-1", front: "Which Cortex-M priority number preempts which?", back: "The smaller number is more urgent and preempts the larger. Only preemption bits (set by the grouping) preempt; sub-priority bits only order simultaneously pending handlers." },
        { id: "nvic-2", front: "Why does HAL_Delay in an interrupt handler hang the board?", back: "It waits for SysTick ticks; SysTick is less urgent than the handler and cannot preempt it, so the count never advances. Handlers must never wait for lower-urgency interrupts." },
        { id: "nvic-3", front: "FreeRTOS rule for interrupt priorities?", back: "Only interrupts with a priority number ≥ configMAX_SYSCALL_INTERRUPT_PRIORITY (less urgent) may call FromISR API; more urgent ones must not touch the kernel. SysTick and PendSV are lowest." },
        { id: "nvic-4", front: "How do you measure interrupt latency and handler duration?", back: "GPIO high at entry, low at exit; on a scope the pulse width is duration and the gap from the peripheral event to the rising edge is latency; infinite persistence shows the worst case." },
      ],
    },
  ],
};
