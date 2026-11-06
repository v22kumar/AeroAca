import type { Lesson } from "@/lib/content/schema";

export const aRingBufferForTheUartDriver: Lesson = {
  slug: "a-ring-buffer-for-the-uart-driver",
  moduleId: "embedded-c",
  prerequisites: ["c-foundations-for-firmware", "interrupts-and-nvic-priorities", "uart-framing-and-baud"],
  title: "A ring buffer for the UART driver",
  summary: "Bytes arrive in an interrupt and are consumed in the main loop at a different rhythm. The ring buffer is the data structure that joins them: fixed size, no allocation, and safe between one producer and one consumer without a lock if you follow three rules. Build one, test it on your PC including the wrap and the full case, and know exactly what it does when it overflows.",
  durationMinutes: 10,
  whyItMatters: "Every UART, SPI and CAN driver has one, and 'write a ring buffer' is the single most common embedded coding-interview task. The full-versus-empty ambiguity, the index wrap and the ISR-safety argument are what the interviewer is listening for.",
  objectives: [
    "Implement a fixed-size circular buffer with head and tail indices, power-of-two masking, and a defined behaviour when full.",
    "Explain why a single-producer, single-consumer ring buffer needs no lock when each index is written by one side only and the data is written before the index is published.",
    "Choose the capacity from the production rate and the worst-case consumer latency, and detect and count overruns.",
    "Test it on the host: empty, one element, full, FIFO order, and a thousand wraps, with a harness that can fail.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The single-producer single-consumer argument assumes each index is a naturally aligned type the core writes atomically (true for 8/16/32-bit stores on Cortex-M) and that the compiler is prevented from reordering the data store after the index store (volatile indices here; a release barrier in stricter code). The lab's output is the expected result.",
  },
  references: [
    { title: "Arm Cortex-M4 Devices Generic User Guide: memory access behaviour (single-copy atomicity of aligned word, halfword and byte accesses)", note: "Why an aligned index store cannot be observed half-written." },
    { title: "FreeRTOS stream buffer documentation (single-reader single-writer design)", note: "The same SPSC pattern as a kernel service, with its stated restrictions." },
    { title: "Lesson: Queues vs shared buffers in ISR-to-task handoff", note: "What goes wrong with a shared buffer and a flag, and when a queue is the better tool." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The byte that arrived while nobody was looking",
      body: `A protocol parser reads bytes from a UART with a single global \`last_byte\` and a \`got_byte\` flag set by the interrupt. At 9600 baud it is perfect. At 115200 baud, when the main loop spends 200 µs formatting a log line, two bytes arrive during that time and the first is overwritten: one lost byte per log line, a CRC failure every few seconds, and a bug report that says "the link is unreliable at high speed".

The link is fine. The driver has a buffer of one. This lesson replaces it with a buffer of N that the interrupt fills and the loop drains, and makes the loss, when N is still too small, a counted event instead of a mystery.`,
    },
    {
      type: "concept",
      title: "Head, tail, and the slot you keep empty",
      body: `A **ring (circular) buffer** is a fixed array with two indices: **head**, where the producer writes next, and **tail**, where the consumer reads next. Both advance and wrap to zero at the end of the array. The buffer is **empty** when head equals tail. The buffer is **full** when advancing head would make it equal tail. That rule costs one slot: a buffer of 8 holds 7 bytes. The alternative, keeping a separate count, needs both sides to modify the same variable, which is exactly what breaks the lock-free argument below. Keep the empty slot.

Make the capacity a **power of two** and the wrap is a mask: \`next = (head + 1) & (SIZE - 1)\`, one AND instead of a compare-and-reset, and no modulo (division) in an interrupt.

**Put and get:**

\`\`\`c
bool ring_put(ring_t *r, uint8_t byte) {
    uint8_t next = (r->head + 1u) & RING_MASK;
    if (next == r->tail) return false;      /* full: refuse; the caller counts the overrun */
    r->buf[r->head] = byte;                 /* 1. write the data */
    r->head = next;                         /* 2. then publish the index */
    return true;
}
bool ring_get(ring_t *r, uint8_t *out) {
    if (r->tail == r->head) return false;   /* empty */
    *out = r->buf[r->tail];
    r->tail = (r->tail + 1u) & RING_MASK;
    return true;
}
\`\`\`

What to do when **full** is a design decision that must be written down: refuse the new byte and count an **overrun** (the usual choice for a receive buffer: the newest data is lost but the stream stays coherent), or overwrite the oldest (right for a log of recent samples where the newest matters most). Never silently do either. The UART peripheral itself has the same rule: its one-byte data register sets an ORE flag when a byte arrives before the last one was read, and the handoff lesson's "one sample in ten thousand" is that flag being ignored.`,
      deeper: {
        title: "Why not a count variable?",
        body: `With a count, both the ISR (increment) and the loop (decrement) modify it, and a read-modify-write from both sides is the register lesson's hazard: the loop reads count, the ISR increments it, the loop writes back the stale value, and a byte is counted twice or not at all. You would need to disable interrupts around every access. Head and tail, each owned by one side, need nothing.`,
      },
    },
    {
      type: "concept",
      title: "Why one producer and one consumer need no lock",
      body: `The ISR writes \`head\` and only \`head\`; the main loop writes \`tail\` and only \`tail\`. Each side **reads** the other's index but never writes it. That gives three guarantees, provided three conditions hold:

1. **Each index is written atomically.** A \`uint8_t\` or an aligned \`uint32_t\` store on Cortex-M is a single instruction that cannot be observed half-done, so the other side sees either the old or the new value, never a mixture.
2. **Data before index.** The producer writes the byte into the slot *then* advances head. If the consumer sees the new head, the byte is already there. Reversed, the consumer could read a slot before it is filled. The \`volatile\` on the indices stops the compiler reordering those two stores; on cores with weaker memory ordering a release barrier (\`__DMB()\`) is used; Cortex-M3/M4/M7 single-core do not reorder these stores, so volatile suffices there, and saying so is part of a good answer.
3. **A stale read is safe.** The producer's full check reads \`tail\`; if the consumer advances tail just after, the producer refused a byte it could have accepted: conservative, never wrong. The consumer's empty check reads \`head\`; a stale head makes it miss a byte it will get on the next call. Both errors are in the safe direction.

Two producers (two ISRs writing the same ring) or two consumers break the argument immediately: both would modify the same index. Then you need a lock, a critical section, or one ring per producer. Interviewers ask precisely this: "what if two tasks write to it?"`,
    },
    {
      type: "concept",
      title: "Sizing it, and knowing when it was too small",
      body: `Capacity comes from two numbers: the **production rate** and the **worst-case time the consumer is away**. At 115200 baud 8N1 a byte arrives every 86.8 µs. If the main loop can be away for 2 ms (the longest step in the tick loop plus the highest-priority interrupts), 23 bytes can arrive; round up to the next power of two and double for margin: 64. The handoff lesson does the same arithmetic for a queue.

Then **measure**: keep a high-water mark (the largest count seen, updated in put) and an **overrun counter** (incremented when put returns false), and expose both through the driver's statistics function. On the bench after an hour: high-water 19 of 63, overruns 0, and the sizing is evidence rather than hope. In the field, a non-zero overrun count in the log is the first thing to look at when "the link is unreliable".

The ring is bytes in, bytes out; **framing** (where a message starts and ends) is the parser's job, a state machine that pulls bytes from the ring (the state-machine lesson's ICD parser). Keeping the two separate means the ISR stays ten instructions long and the parser can be tested without an interrupt in sight.`,
    },
    {
      type: "example",
      title: "Worked example: the scenario's driver, rewritten",
      body: `\`\`\`c
/* uart_rx.c */
#define RX_RING_SIZE 64u
static ring_t rx;                                  /* head written by the ISR, tail by the loop */
static volatile uint32_t rx_overruns, rx_high_water;

void USART2_IRQHandler(void) {
    uint32_t sr = USART2->SR;
    uint8_t byte = (uint8_t)USART2->DR;            /* reading DR clears RXNE (and ORE on this family) */
    if (sr & USART_SR_ORE) rx_overruns++;          /* the peripheral's own one-byte buffer overran */
    if (!ring_put(&rx, byte)) rx_overruns++;       /* our ring was full */
    uint8_t n = ring_count(&rx);
    if (n > rx_high_water) rx_high_water = n;
}

bool uart_rx_get(uint8_t *out) { return ring_get(&rx, out); }
void uart_rx_stats(uint32_t *overruns, uint32_t *high_water) { *overruns = rx_overruns; *high_water = rx_high_water; }
\`\`\`

The main loop drains with \`while (uart_rx_get(&b)) parser_step(&p, b, now);\`. At 115200 baud with the loop away for 200 µs, at most three bytes queue; the high-water mark on the bench reads 3; the "unreliable link" is gone and, if it ever returns, the overrun counter says so. The whole ISR is a handful of instructions and never touches the parser. The lab below is the ring and its test harness, host-buildable.`,
    },
    {
      type: "lab",
      title: "Run it yourself: the ring buffer and eight tests that can fail",
      lab: "c-ring",
      body: `The ring from this lesson with an eight-test harness: empty at start, one element in and out, exactly seven of ten bytes accepted (the kept-empty slot), the count, a refused put when full, FIFO order on drain, empty after drain, and a thousand put/get pairs so the indices wrap past the array end over a hundred times. Build and run; every line should read PASS and the summary 8 passed, 0 failed.`,
      tryNext: `Change \`RING_SIZE\` to 16 and predict the 'accepts exactly' line. Then swap the two statements in \`ring_put\` (publish head before writing the data) and explain, in one sentence, which test would catch that bug on a real interrupt-driven target even though all eight still pass on the single-threaded host.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "ring-capacity",
        skill: "ring-buffer",
        objective: "Size a receive ring from rate and latency.",
        prompt: `A UART runs at 230400 baud, 8N1. The main loop can be away from the driver for at most 1.5 ms. How many bytes can arrive in that time? (Give the exact count; the ring would be sized to the next power of two with margin.)`,
        unit: "bytes",
        answer: 34,
        tolerance: 1,
        solution: `One byte is 10 bit periods: 10 / 230400 = 43.4 µs. In 1.5 ms: 1500 / 43.4 = **34.6**, so 34 complete bytes (35 if one is mid-flight). A 64-slot ring (63 usable) gives margin; 128 if the latency estimate is soft.`,
        solvedFeedback: `Right: about 35 bytes in 1.5 ms at 230400 baud. Then measure the high-water mark to confirm the estimate.`,
        misconceptions: [
          { value: 43, tolerance: 1, feedback: `43 is the number of 8-bit payloads if you forgot the start and stop bits: each byte is 10 bits on the wire at 8N1.` },
          { value: 345, tolerance: 5, feedback: `That is the number of bits in 1.5 ms (345), not bytes. Divide by the 10 bits per frame.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "ring-full-empty",
        skill: "ring-buffer",
        objective: "Explain the kept-empty slot.",
        prompt: `A ring buffer with an 8-slot array reports that it accepts only 7 bytes before refusing. Is this a bug?`,
        options: [
          { id: "a", text: "No: with only head and tail indices, 'head == tail' must mean empty, so 'full' is defined as head one slot behind tail, and one slot is always kept empty. The alternative, a shared count, would need a lock between the ISR and the loop.", correct: true, feedback: `Yes. Seven of eight is the price of a lock-free full/empty distinction, and it is cheap.` },
          { id: "b", text: "Yes: the capacity should be 8 and the comparison is off by one", correct: false, feedback: `Making it hold 8 makes 'head == tail' ambiguous between empty and full; you would need a count or a flag that both sides write.` },
          { id: "c", text: "Yes: the mask should be SIZE instead of SIZE − 1", correct: false, feedback: `The mask SIZE − 1 is correct for a power-of-two size; it is unrelated to the kept-empty slot.` },
          { id: "d", text: "No, but the ring should overwrite the oldest byte instead of refusing", correct: false, feedback: `For a receive stream, overwriting corrupts message order silently; refusing and counting the overrun is the normal choice. Either way the kept slot is not a bug.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "ring-lockfree",
        skill: "ring-buffer",
        objective: "State the conditions of the lock-free argument.",
        prompt: `Select **every** statement that is required for the single-producer, single-consumer ring to be safe without a lock.`,
        options: [
          { id: "a", text: "Each index is written by one side only: head by the producer, tail by the consumer.", correct: true, feedback: `The whole argument rests on this. Two producers break it.` },
          { id: "b", text: "The producer writes the data into the slot before it advances head.", correct: true, feedback: `Otherwise the consumer can read a slot before it is filled; volatile indices (and a barrier on weaker cores) keep the order.` },
          { id: "c", text: "Each index is a type the core stores atomically, such as an aligned uint8_t or uint32_t.", correct: true, feedback: `A half-written index would be a corrupt index; aligned byte and word stores on Cortex-M are single-copy atomic.` },
          { id: "d", text: "Interrupts are disabled around every put and get.", correct: false, feedback: `That is the lock the design avoids. It is needed only when the one-writer-per-index rule is broken.` },
          { id: "e", text: "The buffer size is a power of two.", correct: false, feedback: `A power of two makes the wrap a cheap mask; it is an efficiency choice, not a safety condition.` },
        ],
        solvedFeedback: `Right. One writer per index, data before index, atomic index stores. Masks are for speed; disabling interrupts is what you avoid.`,
      },
    },
    {
      type: "interview",
      questionId: "write-a-ring-buffer",
      intro: `Write put and get aloud, then give the full/empty rule, the three lock-free conditions and the overrun decision; finish with how you would size and test it.`,
    },
    {
      type: "figure",
      title: "The ring buffer, drawn",
      diagram: "ring-buffer",
      alt: "Eight slot ring buffer with head and tail pointers, the full and empty rules, and the single writer single reader condition that makes it lock free.",
      caption: `Head belongs to the writer, tail to the reader; each side only reads the other's index. Empty is head equal to tail; full keeps one slot free so the two cases cannot be confused.`,
    },
    {
      type: "recap",
      summary: `- Fixed array, head (producer) and tail (consumer), power-of-two size so the wrap is a mask; empty when head == tail; full when head + 1 == tail, keeping one slot empty.
- Full is a decision: refuse and count an overrun (receive streams) or overwrite the oldest (recent-sample logs); never silent.
- Lock-free for one producer and one consumer when each index has one writer, data is written before the index is published, and index stores are atomic; stale reads err on the safe side. Two writers need a lock or two rings.
- Size from byte rate × worst consumer absence, rounded up with margin; keep a high-water mark and an overrun counter as evidence. Framing belongs to the parser, not the ring.`,
      cards: [
        { id: "ring-1", front: "Full and empty in a two-index ring?", back: "Empty: head == tail. Full: (head + 1) & mask == tail. One slot stays empty so the two states are distinguishable without a shared count. 8 slots hold 7." },
        { id: "ring-2", front: "Why is a single-producer single-consumer ring lock-free?", back: "Head is written only by the producer, tail only by the consumer; the data is written before head is published; aligned index stores are atomic on Cortex-M. A stale read of the other side's index only makes a put or get conservative." },
        { id: "ring-3", front: "What should happen when the ring is full?", back: "A written-down choice: refuse the byte and increment an overrun counter (receive streams), or overwrite the oldest (recent-sample logs). Expose the counter and a high-water mark through a stats function." },
        { id: "ring-4", front: "Size a UART receive ring?", back: "Bytes per second (baud / 10 for 8N1) × the worst time the consumer is away, rounded up to a power of two with margin; then confirm with the high-water mark on the bench." },
      ],
    },
  ],
};
