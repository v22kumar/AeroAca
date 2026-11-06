import type { Lesson } from "@/lib/content/schema";

export const sharedMemoryDpramHandshakes: Lesson = {
  slug: "shared-memory-dpram-handshakes",
  moduleId: "real-time",
  format: "arc",
  prerequisites: ["isr-to-task-handoff", "pointers-to-hardware"],
  title: "Shared memory between processors: torn reads and the sequence-counter handshake",
  summary: "Two processors share a small record in dual-port RAM. Learn why a reader can see half of an old update and half of a new one, how a sequence counter detects it, what the handshake does not protect against, and how to measure its latency.",
  durationMinutes: 17,
  whyItMatters: "Dual-port RAM and shared memory join processors, cards and FPGAs in many avionics and control designs. A torn read is a rare, data-dependent fault that testing finds only by luck. Being able to explain the handshake, and to design a test that forces the bad interleaving, is a skill interviewers value highly.",
  objectives: [
    "Explain what dual-port RAM guarantees and what it does not, and define a torn read.",
    "Describe the sequence-counter handshake for one writer and one reader, and why it detects a torn read.",
    "Force the bad interleaving in a model and read the result.",
    "State the limits of the handshake and say how to measure its latency and retries on a target.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The sequence-counter (seqlock) protocol is a standard technique for a single writer and any number of readers. The lab steps a writer and a reader one memory access at a time, so every interleaving is exactly reproducible; it is a simulation of the protocol, not a model of any specific dual-port RAM part, cache or compiler. Statements about barriers, caches and reordering describe the general hazard and the need to check the target's memory model.",
  },
  references: [
    { title: "Dual-port RAM datasheets, for example from Infineon (Cypress) or Renesas (IDT)", note: "Arbitration of simultaneous access to the same address, busy and semaphore flags, interrupt mailboxes." },
    { title: "Linux kernel documentation: seqlock and seqcount", note: "The same sequence-counter idea used in an operating system; one writer, retrying readers." },
    { title: "Lesson: The ISR-to-task handoff", note: "The single-processor version of the same data-race problem." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The display that twitched once an hour",
      body: `A flight computer and a display processor share a dual-port RAM. The computer writes a three-word record: roll, pitch and heading. The display processor reads it every 20 ms and draws the horizon.

Once in a while the horizon twitches for one frame, then recovers. The three numbers on that frame never made sense together: the roll came from the new update and the heading from the old one. Each word was correct on its own. The record as a whole never existed.

Each processor's code looks right. The memory part behaved to its datasheet. Yet the display saw an impossible attitude. You will find out how, and make the bad interleaving happen on demand.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Copying from a whiteboard someone is rewriting",
      body: `Two people share a whiteboard with three numbers on it. One keeps the board up to date. The other copies the three numbers onto a notepad.

If the copier finishes before the first person starts rewriting, they get the old set. If they start after the rewrite is done, they get the new set. Either is fine.

The trouble is a copy that happens **in the middle** of a rewrite. The copier gets the first two numbers new and the last one old. Each number is real. The set is a fiction.

Notice that nobody did anything wrong. Both were careful. The fault is that **writing three numbers is not one action**, so someone can look between the first and the last.

The cure is a sign on the board: "wet paint, rewriting". The copier checks the sign before and after copying. If it was up, or changed in between, they throw the copy away and copy again.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "What dual-port RAM guarantees, and what it does not",
      body: `A **dual-port RAM** is a memory with two sides. Each processor has its own address and data bus into the same cells, so both can access it at once.

What the part guarantees is small: if both sides touch the **same address** at the same moment, internal arbitration makes the access safe, often by making one side wait or by raising a busy flag. A single word is never read half-changed.

What it does **not** guarantee is that a **group** of words changes together. A record of three words is three separate writes. A reader can read between them.

That is a **torn read**: a read that returns words from two different updates. It is a data race, the same kind as in the interrupt-to-task handoff, but between processors, so a critical section on one side cannot prevent it.

Designers deal with it in a few ways: an **ownership flag**, a **mailbox** with a doorbell interrupt, **double buffering** with an index swap, or a **sequence counter**. This lesson takes the last one in depth.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The sequence-counter handshake",
      body: `Add one word to the record: a **sequence counter**, starting even.

**The writer** (only one):

1. Add one to the counter. It is now **odd**: "update in progress".
2. Write the data words.
3. Add one again. It is **even**: "update complete".

**The reader:**

1. Read the counter. If it is **odd**, the writer is inside an update: try again.
2. Copy the data words.
3. Read the counter again. If it **changed**, the writer started or finished an update during the copy: throw the copy away and try again.
4. Otherwise accept: nothing changed while it copied, so the copy is a complete, consistent record.

So a reader can get an **old** record, or a **new** one, but never a mixture. An old record is fine: it was true once.

The reader pays with retries. The writer never waits for the reader, which is why this suits a fast writer, such as a control loop, and slow readers, such as a display.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: the same bad moment, with and without the counter",
      body: `The record starts as [0 0 0]. The writer is updating it to [7 7 7]. Write **W** for a step by the writer and **R** for a step by the reader, one memory access each.

**Without a handshake.** The writer has three steps (write each word). The reader has three (read each word).

- **WWWRRR**: the writer finishes, then the reader reads [7 7 7]. Fine.
- **RRRWWW**: the reader finishes first: [0 0 0]. Fine, old but consistent.
- **WWRRRW**: the writer has written two words, the reader reads all three, and the writer then writes the third. The reader sees **[7 7 0]**. Torn.

**With the counter.** The writer has five steps (counter up, three words, counter up). The reader has five (counter, three words, counter).

Take the same awkward timing, **WWWRRRRRWW**. The writer has made the counter odd and written two words when the reader starts. The reader reads an **odd** counter... then reads the words and the counter again. It sees the counter had changed or was odd, so it **rejects** the read and tries again after the writer finishes. It ends with [7 7 7].

**The point:** the counter turns a silent mixture into a detected, repeated read.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "torn-count-guided",
        skill: "shared-memory",
        objective: "Count what a naive reader sees from a half-finished update (guided).",
        prompt: `The writer is updating a three-word record from [0 0 0] to [7 7 7] with no handshake. It has stored the first **two** words when the reader reads all three words. How many of the three words the reader sees are from the **new** update?`,
        unit: "words",
        answer: 2,
        tolerance: 0,
        hints: [
          `The writer stores w0, then w1, then w2, one at a time.`,
          `At this moment it has stored w0 and w1 but not w2.`,
          `The reader sees w0 and w1 as 7, and w2 as 0.`,
        ],
        solution: `The reader sees **[7 7 0]**: two new words and one old. That mixture is a torn read: it was never a real record.`,
        solvedFeedback: `Right: two new words, one old. Each word is genuine; the set is a fiction.`,
        misconceptions: [
          { value: 3, tolerance: 0, feedback: `Three would be a complete update. The writer has not stored the third word yet, so the reader still sees the old 0 there.` },
          { value: 1, tolerance: 0, feedback: `One counts only the last word stored. The first two words are both already stored, so two are new.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "Writer and reader, line by line",
      intro: `Both sides of the handshake in C. The record has the counter and three data words. This is a sketch for one writer and one reader.`,
      language: "c",
      code: `typedef struct { volatile uint32_t seq; volatile int32_t w[3]; } shared_t;

void writer_update(shared_t *s, const int32_t v[3]) {
    s->seq++;                          /* odd: update in progress */
    barrier();
    for (int i = 0; i < 3; i++) s->w[i] = v[i];
    barrier();
    s->seq++;                          /* even: update complete */
}

bool reader_get(const shared_t *s, int32_t out[3]) {
    for (int tries = 0; tries < 4; tries++) {
        uint32_t a = s->seq;
        if (a & 1u) continue;          /* writer is inside an update */
        for (int i = 0; i < 3; i++) out[i] = s->w[i];
        barrier();
        if (s->seq == a) return true;  /* nothing changed while copying */
    }
    return false;                      /* give up, and count it */
}`,
      notes: [
        { lines: "1", text: `The counter and the data live together in the shared memory. \`volatile\` tells the compiler the other processor can change them at any time.` },
        { lines: "4", text: `The writer's first act is to make the counter **odd**. Any reader that looks now knows a change is under way.` },
        { lines: "5-7", text: `The \`barrier()\` calls stop the compiler and the processor reordering the data writes across the counter changes. Without them the counter could appear to change **after** the data, and the whole scheme fails.` },
        { lines: "8", text: `The counter becomes **even** again: the record is complete.` },
        { lines: "12-14", text: `The reader reads the counter. If it is odd, it skips this attempt and tries again.` },
        { lines: "15-17", text: `Copy the data, then read the counter once more. If it is unchanged, the copy is clean and is accepted.` },
        { lines: "19", text: `The retry count is **bounded**. After four failed attempts the reader gives up and reports it, so a stuck writer cannot hang the reader. The failure should be counted, not ignored.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: force the bad interleaving, then add the counter",
      lab: "c-dpram",
      body: `This is a **simulation**: it does not use threads. It steps the writer and the reader one memory access at a time, in an order you give as a string of W and R, so every interleaving is exactly reproducible. Find the naive case that prints **TORN READ**, then see the same bad moment detected and retried with the counter. Notice also that a lucky interleaving, such as strict alternation, passes without a counter.`,
      tryNext: `Add a new schedule string of your own to the naive trials, for example WRRRWW, and predict the reader's result before you run it. Then find a schedule with the counter version in which the reader has to retry more than once.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "seq-updates-between-reads",
        skill: "shared-memory",
        objective: "Read the counter to infer what the writer did.",
        prompt: `A reader reads the sequence counter and gets 12. It copies the three data words. It reads the counter again and gets 14. How many **complete** writer updates happened between the reader's two reads of the counter? (Each update adds 2.)`,
        unit: "updates",
        answer: 1,
        tolerance: 0,
        solution: `The counter went from 12 to 14, a rise of 2, and each complete update adds 2 (one for "in progress", one for "done"). So **1** complete update happened during the copy. The two reads differ, so the reader **rejects** the copy and retries.`,
        solvedFeedback: `Right: one update, and the changed counter makes the reader reject its copy and try again.`,
        misconceptions: [
          { value: 2, tolerance: 0, feedback: `Two is the rise in the counter, not the number of updates. Each complete update adds two to the counter: one on starting, one on finishing. A rise of 2 is one update.` },
          { value: 0, tolerance: 0, feedback: `The counter changed, so the writer did something in between: a whole update. The unchanged-counter case would be zero.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "Measuring latency and retries on a real target",
      body: `A handshake is safe only if it is also fast enough. You want two numbers: how **old** the data is when the reader gets it, and how **often** the reader has to retry.

**Age of the data.** Put a free-running timestamp in the record, written by the writer just before the final counter increase. The reader subtracts it from its own clock when it accepts. Keep a **high-water mark**: the largest age seen over a long run, not the average.

**Edge to edge on a scope.** The writer toggles a spare pin when it finishes an update and the reader toggles another when it accepts one. A logic analyser or oscilloscope shows the delay between the two edges, and its spread shows the jitter.

**Retries.** Count how many attempts each read took, and keep the maximum. A rising retry count means the writer is updating too often, or is being held up mid-update.

**Stress it.** Run with the writer at its fastest rate and the reader loaded, for hours. Torn reads and long retries appear under stress, not on a quiet bench.

Report the maximum, the run time and the load.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What the handshake does not protect against",
      body: `The sequence counter solves one problem. It does not solve these.

**Two writers.** The scheme assumes one. Two writers can both make the counter odd and clash. Give each writer its own record, or add a lock.

**Reordering.** Compilers and processors may reorder memory accesses. Without barriers, or without the shared region being uncached, the counter can change at the wrong moment relative to the data. \`volatile\` alone is not a barrier. Check the target's memory model.

**A stuck writer.** If the writer stops with the counter odd, every read fails. The reader's bounded retry and a failure counter turn a hang into a reported fault.

**Spinning on one core.** If reader and writer are tasks on the **same** core and the reader has the higher priority, it can spin forever while the preempted writer never gets to finish. That is priority inversion in another form.

**Stale data.** A consistent record can still be old. Check an age or a counter that moves.

**Big records.** The longer the update, the more likely a retry. Double buffering with an index swap avoids retries entirely, at the cost of memory.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "dpram-limits",
        skill: "shared-memory",
        objective: "Judge claims about the handshake.",
        prompt: `Select **every** correct statement about the sequence-counter handshake.`,
        options: [
          { id: "a", text: "It lets a reader detect that a copy overlapped a writer's update, and retry.", correct: true, feedback: `That is exactly what the odd counter and the second read of the counter detect.` },
          { id: "b", text: "It assumes a single writer; two writers can corrupt the counter.", correct: true, feedback: `Both could make the counter odd and clash. Use one record per writer or add a lock.` },
          { id: "c", text: "Marking the fields volatile alone makes it safe on any processor.", correct: false, feedback: `Volatile stops compiler optimisations but is not a hardware barrier. Barriers, or an uncached shared region, are needed too.` },
          { id: "d", text: "A reader that retries without limit is a good design, because it always gets a result in the end.", correct: false, feedback: `A stuck writer, or a spinning higher-priority reader on one core, makes it loop forever. Bound the retries and report a failure.` },
          { id: "e", text: "A consistent record may still be stale, so a timestamp or a moving counter should be checked as well.", correct: true, feedback: `Consistent and fresh are different properties. The handshake gives the first only.` },
        ],
        solvedFeedback: `Right: it detects overlap; it needs one writer; barriers matter; retries must be bounded; consistency does not mean freshness.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "dpram-handshake-design",
      intro: `Explain a torn read, describe the sequence-counter handshake, say what it does not protect against, and how you would measure its latency.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Any record shared between an interrupt handler and a task, two cores or a processor and an FPGA has this problem; the counter or a double buffer is the standard cure.
- **Aerospace and UAV systems.** Avionics designs often exchange state between cards through shared memory; the handshake, its retry limit and its failure counter appear in the interface design.
- **R&D and design.** Choosing between a counter, a double buffer and a mailbox is a design decision with a memory, latency and complexity cost.
- **Verification and interviews.** "How would you test for a torn read?" is a favourite: force the bad interleaving in a model, then stress the real system and count retries.`,
    },
    {
      type: "recap",
      summary: `- Dual-port RAM makes a single word safe, but a record of several words can change between a reader's accesses: a torn read, a mixture of two updates.
- Sequence-counter handshake: the writer makes the counter odd, writes the data, makes it even. The reader accepts only if the counter was even and unchanged across its copy; otherwise it retries.
- The reader may get old data but never a mixture. The writer never waits for the reader.
- Limits: one writer only; barriers or an uncached region are needed; retries must be bounded and counted; a consistent record may still be stale.
- Measure the age of the data (a high-water mark, not an average), edge-to-edge delay on a scope, and the retry count under stress.`,
      cards: [
        { id: "dp-1", front: "What is a torn read?", back: "A read of a multi-word record that returns words from two different updates, because the writer changed some words between the reader's accesses. Each word is valid; the set never existed." },
        { id: "dp-2", front: "How does the sequence-counter handshake work?", back: "The writer makes the counter odd, writes the data, then makes it even. The reader accepts a copy only if the counter was even before and unchanged after; otherwise it retries." },
        { id: "dp-3", front: "What are the limits of the handshake?", back: "A single writer; barriers or an uncached region are needed; retries must be bounded and counted; stale but consistent data is possible; a reader spinning above a preempted writer on one core can hang." },
        { id: "dp-4", front: "How do you measure a handshake's latency?", back: "Put a timestamp in the record and keep the high-water mark of its age at the reader; toggle pins at writer-finish and reader-accept and measure the delay on a scope; count the retries under stress." },
      ],
    },
  ],
};
