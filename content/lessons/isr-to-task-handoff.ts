import type { Lesson } from "@/lib/content/schema";

export const isrToTaskHandoff: Lesson = {
  slug: "isr-to-task-handoff",
  moduleId: "rtos",
  prerequisites: ["priority-inversion", "a-ring-buffer-for-the-uart-driver"],
  title: "Queues vs shared buffers in ISR-to-task handoff",
  summary: "An interrupt captures a sample; a task processes it. The handoff between them is where torn reads, lost samples and 'it works on the bench' bugs live. Learn the shared-buffer race, why a queue fixes it, the FromISR rules, and how to size the queue from rates.",
  durationMinutes: 10,
  whyItMatters: "Every embedded product with an RTOS has this handoff somewhere, and the shared-buffer-plus-flag version is the bug that passes every test until the field. 'How do you get data from an ISR to a task safely?' is a standard firmware interview question.",
  objectives: [
    "Show how a shared buffer and a flag produce torn reads and lost samples between an ISR and a task.",
    "Use a queue, a stream buffer or a double buffer with DMA for the handoff, and apply the FromISR and yield rules.",
    "Size a queue from the production and service rates, with margin.",
  ],
  review: {
    status: "technically-reviewed",
    note: "FreeRTOS API behaviour (FromISR variants, portYIELD_FROM_ISR, queue copy semantics, interrupt priority limits for API calls) follows the kernel documentation. The race analysis is general to any preemptive system.",
  },
  references: [
    { title: "FreeRTOS kernel documentation: queues, stream buffers, interrupt management, configMAX_SYSCALL_INTERRUPT_PRIORITY", note: "Which API may be called from ISRs and at which interrupt priorities." },
    { title: "ARM Cortex-M interrupt priorities and NVIC (ARMv7-M ARM)", note: "Lower number is higher priority; priority grouping." },
  ],
  steps: [
    {
      type: "scenario",
      title: "One sample in ten thousand",
      body: `An ADC interrupt at 10 kHz writes a 16-bit sample and a timestamp into a global struct and sets \`ready = 1\`. A task spins on \`ready\`, copies the struct, clears the flag, and filters the data. The filter output shows a spike about once a second, always a sample with a plausible value and a timestamp from the *previous* sample.

The task read the timestamp, the interrupt fired and overwrote both fields, the task read the new sample. A **torn read**. Once a second at 10 kHz is one race in ten thousand. It would never show on a bench for five minutes. It shows in every unit in the field.`,
    },
    {
      type: "concept",
      title: "Why the shared buffer races",
      body: `An interrupt can fire between *any two instructions* of the task. A struct copy is many instructions. So the task can see half the old record and half the new one (torn read), or the ISR can overwrite a record the task has not yet taken (lost sample), or the task can clear \`ready\` just after the ISR set it for a new sample (lost signal).

\`volatile\` does not help: it makes the compiler re-read the variable, it does not make a multi-word copy atomic (the fixed-width integers lesson covered the same trap for read-modify-write). Disabling interrupts around the copy works but adds latency to every interrupt in the system and is easy to get wrong.

The structural fix is a handoff primitive the kernel makes atomic:

- **Queue**: the ISR *copies* the record into the queue with \`xQueueSendFromISR\`; the task blocks in \`xQueueReceive\` and wakes when data arrives. Each item is copied whole, so there is no torn read, and the queue holds a backlog so a late task loses nothing until the queue is full.
- **Stream or message buffer**: for byte streams such as UART receive, cheaper than a queue of single bytes; single reader, single writer.
- **Double buffer with DMA**: for high-rate ADC or audio, the peripheral fills one half while the task processes the other; the half-complete interrupt only signals which half is ready. No per-sample interrupt at all.
- **Task notification**: when the ISR only needs to say "something happened" and the data lives in a peripheral register or a DMA buffer.

Rule of thumb: the ISR *captures and signals*; the task *decides and processes*. Anything that can block, allocate, print or take more than a few microseconds belongs in the task.`,
      deeper: {
        title: "The FromISR rules",
        body: `In FreeRTOS every API call made from an interrupt must be the \`FromISR\` variant: \`xQueueSendFromISR\`, \`xSemaphoreGiveFromISR\`, \`vTaskNotifyGiveFromISR\`. They never block, and they report through \`pxHigherPriorityTaskWoken\` whether a task of higher priority than the one interrupted is now ready; the ISR ends with \`portYIELD_FROM_ISR(woken)\` so that task runs immediately instead of at the next tick. Calling a non-FromISR function from an ISR trips a \`configASSERT\` or corrupts kernel state. And the interrupt's NVIC priority must be numerically at or above \`configMAX_SYSCALL_INTERRUPT_PRIORITY\` (lower urgency) to be allowed to call the kernel at all; a higher-urgency interrupt may not touch the API.`,
      },
    },
    {
      type: "example",
      title: "Worked example: the ADC handoff rewritten",
      body: `\`\`\`c
typedef struct { uint16_t sample; uint32_t t_us; } adc_rec_t;
static QueueHandle_t adc_q;             /* created with xQueueCreate(32, sizeof(adc_rec_t)) */

void ADC_IRQHandler(void) {
    adc_rec_t r = { .sample = ADC1->DR, .t_us = timer_now_us() };
    BaseType_t woken = pdFALSE;
    xQueueSendFromISR(adc_q, &r, &woken);  /* copies r; drops it if the queue is full */
    portYIELD_FROM_ISR(woken);
}

void filter_task(void *arg) {
    adc_rec_t r;
    for (;;) {
        if (xQueueReceive(adc_q, &r, portMAX_DELAY) == pdTRUE) {
            filter_push(r.sample, r.t_us);
        }
    }
}
\`\`\`

The record is built on the ISR's stack and copied whole into the queue; the task receives a whole record. No flag, no spin, no torn read.

**Sizing the queue.** The ISR produces one record every 100 µs. If the task can be delayed by up to 2 ms (a lower-priority task holding a lock, a long interrupt, a tick), 20 records arrive in that time. The queue needs at least 20 slots; 32 gives margin and is a power of two. If \`xQueueSendFromISR\` ever returns \`errQUEUE_FULL\`, count it: a dropped-sample counter in the ISR is the cheapest diagnostic you will ever add.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "torn-read-cause",
        skill: "rtos",
        objective: "Recognise a torn read.",
        prompt: `A task copies a two-field global struct that an ISR updates. Once in a while the copy contains the new sample with the old timestamp. What happened?`,
        options: [
          { id: "a", text: "The interrupt fired between the task's two field reads, so the copy mixes two records (a torn read).", correct: true, feedback: `Yes. The copy is several instructions; an interrupt between them produces a record that never existed. Only an atomic handoff (queue copy, or interrupts masked around the copy) prevents it.` },
          { id: "b", text: "The compiler cached the struct in registers; declaring it volatile fixes it.", correct: false, feedback: `volatile forces re-reads, but a re-read of two fields is still two instructions with a gap between them. The race remains.` },
          { id: "c", text: "The ADC produced a bad conversion.", correct: false, feedback: `The sample is plausible and the timestamp is exactly the previous one: the signature of a torn copy, not of a bad conversion.` },
          { id: "d", text: "The task's priority is too low.", correct: false, feedback: `Priority changes how often the race happens, not whether it can. At 10 kHz, any gap in a multi-instruction copy will eventually be hit.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "queue-sizing",
        skill: "rtos",
        objective: "Size a queue from rates.",
        prompt: `An ISR produces one 8-byte record every 250 µs. The consuming task can be delayed for up to 5 ms by other work. What is the **minimum** queue length (in items) that avoids dropping records during that delay?`,
        unit: "items",
        answer: 20,
        tolerance: 0.5,
        solution: `Records arriving during the worst-case delay = 5 ms ÷ 250 µs = **20**. That is the minimum; in practice choose 32 for margin and add a dropped-record counter to find out whether the delay assumption holds.`,
        solvedFeedback: `Correct: 20 items (and you would provision more). The rate ratio is the whole calculation; the hard part is knowing the real worst-case delay.`,
        misconceptions: [
          { value: 160, tolerance: 1, feedback: `160 is the number of bytes (20 × 8). Queue length is in items; the item size is given at creation.` },
          { value: 4, tolerance: 0.5, feedback: `5 ms ÷ 250 µs is 20, not 4. Check the units: 250 µs = 0.25 ms.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "isr-rules",
        skill: "rtos",
        objective: "Apply the ISR rules.",
        prompt: `Select **every** statement that is true about an interrupt handler in a FreeRTOS system.`,
        options: [
          { id: "a", text: "It must use the FromISR API variants and never a call that can block.", correct: true, feedback: `The FromISR variants never block and report whether a context switch is needed.` },
          { id: "b", text: "It should end with portYIELD_FROM_ISR if the call woke a higher-priority task.", correct: true, feedback: `Otherwise the woken task waits for the next tick, adding up to one tick of latency.` },
          { id: "c", text: "It may take a mutex to protect shared data.", correct: false, feedback: `Mutexes are for tasks; an ISR cannot hold one or inherit a priority. Use a queue, a FromISR semaphore give, or a short critical section.` },
          { id: "d", text: "Its NVIC priority must be numerically at or above configMAX_SYSCALL_INTERRUPT_PRIORITY if it calls the kernel.", correct: true, feedback: `Interrupts of higher urgency than that level are not allowed to call any FreeRTOS API.` },
          { id: "e", text: "It should format and print a log line so the event is recorded immediately.", correct: false, feedback: `Printing takes milliseconds and may block. Capture and signal; let a task print.` },
        ],
        solvedFeedback: `Right. FromISR only, yield when a higher task woke, no mutexes, respect the syscall priority limit, keep it to capture-and-signal.`,
      },
    },
    {
      type: "interview",
      questionId: "isr-task-handoff",
      intro: `Name the race, name the primitive, state the FromISR rule and the sizing calculation. Mention the dropped-record counter: it shows you have shipped one of these.`,
    },
    {
      type: "figure",
      title: "Task states, so the handoff makes sense",
      diagram: "rtos-task-states",
      alt: "RTOS task state diagram with Ready, Running, Blocked and Suspended states and the events that move a task between them.",
      caption: `A task waiting on a queue is Blocked; the ISR's give moves it to Ready; the scheduler runs it when nothing higher is ready. Keep every task Blocked except when it has work.`,
    },
    {
      type: "recap",
      summary: `- A shared buffer and a flag between an ISR and a task gives torn reads, lost samples and lost signals; volatile does not fix multi-word copies.
- Queues copy whole items atomically and buffer a backlog; stream buffers for byte streams; DMA double buffers for high rates; notifications when only a signal is needed.
- ISR: capture and signal with FromISR calls, yield if a higher task woke, never block, never take a mutex, respect configMAX_SYSCALL_INTERRUPT_PRIORITY.
- Queue length ≥ production rate × worst-case consumer delay, plus margin; count drops.`,
      cards: [
        { id: "isr-1", front: "What is a torn read?", back: "A multi-field copy interrupted part-way, so the result mixes two records that never coexisted. volatile does not prevent it." },
        { id: "isr-2", front: "Why does a queue fix the ISR-to-task handoff?", back: "The kernel copies each item atomically and holds a backlog, so the task never sees a partial record and a late task loses nothing until the queue is full." },
        { id: "isr-3", front: "Three FromISR rules?", back: "Use only FromISR variants (they never block); end with portYIELD_FROM_ISR if a higher task woke; the interrupt's priority must be at or above configMAX_SYSCALL_INTERRUPT_PRIORITY." },
        { id: "isr-4", front: "Minimum queue length from rates?", back: "Production rate × worst-case consumer delay, in items. Then add margin and count drops in the ISR." },
      ],
    },
  ],
};
