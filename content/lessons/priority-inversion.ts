import type { Lesson } from "@/lib/content/schema";

/**
 * Teaching format 2.0 pilot lesson. Slug and the three original exercise ids are kept so
 * earlier progress still counts.
 */
export const priorityInversion: Lesson = {
  slug: "priority-inversion",
  moduleId: "rtos",
  format: "arc",
  prerequisites: ["interrupts-and-nvic-priorities"],
  title: "Why the high-priority task starved: priority inversion",
  summary: "The most important task in the system waits on the least important one, and a task in the middle that needs nothing keeps it waiting. Learn to see it, bound it, and fix it with the right lock.",
  durationMinutes: 14,
  whyItMatters: "Priority inversion reset the Mars Pathfinder lander in 1997 and still causes missed deadlines in every real-time product. It is the single most asked RTOS interview question, and the answer has a trap: 'use a mutex' is only right if you can say what a mutex does that a semaphore does not.",
  objectives: [
    "Tell the three-task story in plain words, then with the right terms: task, priority, lock, critical section, blocked.",
    "Explain bounded and unbounded inversion and compute the worst-case wait with and without priority inheritance.",
    "Choose the FreeRTOS primitive that provides inheritance and read the code that uses it.",
    "Name the design rule that removes most of the problem, and the trade-offs of inheritance versus ceiling.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Follows the standard treatment (Sha, Rajkumar and Lehoczky, 1990) and FreeRTOS documented behaviour: mutexes created with xSemaphoreCreateMutex implement priority inheritance; binary semaphores do not; mutexes must not be used from ISRs. The Pathfinder account is from public NASA and Wind River reports. The timeline interactive is illustrative, not a kernel trace.",
  },
  references: [
    { title: "Sha, Rajkumar, Lehoczky: Priority inheritance protocols (IEEE Trans. Computers, 1990)", note: "Defines inheritance and ceiling protocols and the blocking bounds." },
    { title: "FreeRTOS kernel documentation: mutexes, binary semaphores, priority inheritance", note: "Which API calls give inheritance; FromISR restrictions." },
    { title: "Mars Pathfinder 1997 priority-inversion resets (public accounts by JPL and Wind River)", note: "A low-priority task held a bus mutex; a medium-priority task preempted it; the high-priority task missed its deadline and the watchdog reset the system." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The task that was never late, until it was",
      body: `A controller runs three jobs. The **sensor** job is the most important: every 10 ms it reads a sensor over the SPI bus, and it has never been late. The **configuration** job is the least important: now and then it writes a settings page to a flash chip on the same SPI bus, which takes 3 ms. The **logging** job sits in the middle: it formats text and sends it out, 20 ms at a stretch.

After a small release, the sensor job starts missing its 10 ms slot by up to 20 ms, about once a minute. Nothing crashes. The trace shows the sensor job *waiting*, the configuration job *ready but not running*, and the logging job running happily.

The most important task in the system is waiting on the least important one, because of a task that has nothing to do with either. This lesson explains how that happens and what fixes it.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Three people and one key",
      body: `Picture a small workshop with one store-room key.

**Lata** has the lowest seniority. She takes the key to fetch a part; it takes her about three minutes.

**Hari** is the most senior person, and his job cannot wait. Thirty seconds after Lata goes in, Hari needs the store room. The rule in this workshop is that senior work interrupts junior work, so Hari steps in front of Lata, but he cannot get into the store room without the key. He has to wait for Lata to finish. Fair enough: three minutes at most.

Now **Meena** arrives. She is more senior than Lata but junior to Hari, and she does not need the store room at all. By the workshop rule, Meena's work interrupts Lata's. So Lata stands aside holding the key, Meena works for twenty minutes, and Hari waits the whole time, not for Lata, but for Meena, who has nothing to do with his problem.

That is the whole story. The fix is also easy to say in these terms: *while Lata holds a key that Hari is waiting for, treat Lata as if she were as senior as Hari*. Then Meena cannot interrupt her, Lata finishes in three minutes, hands over the key, and Hari waits three minutes at most.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The same story in the words a kernel uses",
      body: `Now the real names, one at a time.

- A **task** is a job the real-time operating system runs: Lata, Hari and Meena are tasks. Call them **L**, **H** and **M** for low, high and medium.
- A **priority** is the seniority number. The **scheduler** always runs the highest-priority task that is ready to run; a higher one arriving **preempts** a lower one, the way Hari stepped in front of Lata.
- A **lock** is the key: a thing only one task may hold at a time, protecting a shared resource (the SPI bus). The time a task spends holding the lock is its **critical section**: Lata's three minutes in the store room.
- A task that is waiting for a lock is **blocked**: it cannot run until the lock is released. A task that could run but is being held back by a higher-priority task is **ready**.

So: L enters its critical section. H preempts L, tries the lock, and blocks. M preempts L. Now H is blocked, L is ready but never runs, and M runs for as long as it likes. The scheduler is doing exactly what the priorities told it to do. The priorities just never said that H depends on L through the lock.`,
    },
    {
      type: "visual",
      stage: "how",
      depth: "understand",
      title: "See it: three tasks, one lock",
      visual: "priority-inversion",
      body: `**Try this first.** Leave inheritance off. Drag M's run length to 20 ms and read how long H takes from ready to done. Drag it to 30 ms. H's wait grows with M, which has nothing to do with H.

**Then** tick priority inheritance and drag M again. H's time stops moving: it is now set only by L's 3 ms critical section.`,
      caption: `Illustrative timeline, not a trace from a real kernel. Amber is L inside its critical section (holding the lock); grey is waiting. L's critical section is 3 ms; H's own work is 2 ms.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Bounded and unbounded inversion",
      body: `There are two different waits in the story, and only one of them is a bug.

**Bounded inversion.** H blocks on a lock L holds, and waits for L's critical section to finish: at most 3 ms. This is unavoidable whenever two tasks share a resource that only one may use at a time. It is acceptable as long as the 3 ms is known and budgeted for in H's deadline.

**Unbounded inversion.** While H is blocked, a medium-priority task M preempts L. L cannot finish its critical section while M runs, so H waits for M too. Add a second medium task and H waits for that one as well. The wait has no upper bound that depends on H or L; it depends on everything in between, forever.

The name comes from the result: for the duration, the system behaves as if H's and L's priorities were *inverted*.

Three ways to recognise it on a trace: the high task is blocked, not running; the lock holder is ready, not running; and something of medium priority is running. If you see all three, it is inversion, not a slow driver.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "What inheritance and ceiling actually do",
      body: `**Priority inheritance.** When H blocks on a lock held by L, the kernel temporarily raises L to H's priority. M can no longer preempt L. L finishes its critical section, releases the lock, drops back to its own priority, and H runs. H's worst-case wait is once again bounded by the critical section.

**Priority ceiling** (the immediate ceiling protocol used by OSEK/AUTOSAR OS) does the raising earlier: any task that *takes* the lock is raised at once to the highest priority of any task that ever uses that lock. It needs design-time knowledge of who uses what, and in return it also prevents deadlock between nested locks.

**In FreeRTOS**, a **mutex** from \`xSemaphoreCreateMutex()\` records which task holds it, and that is what lets the kernel inherit: when a higher task blocks in \`xSemaphoreTake\`, the holder's priority is raised. A **binary semaphore** from \`xSemaphoreCreateBinary()\` has no idea who holds it. It is a signal, meant for "something happened", often from an interrupt. Used as a lock, it can inherit nothing, and that misuse is the most common way teams build unbounded inversion by accident. Mutexes also cannot be used from an interrupt handler: an interrupt is not a task and has no priority to lend.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: bounding the sensor task's wait",
      body: `Numbers from the scenario. Sensor task H: deadline 10 ms, its own work 2 ms. Configuration task L: holds the SPI lock for at most 3 ms. Logging task M: 20 ms bursts.

**With a binary semaphore as the lock (no inheritance).** Worst case: H blocks just after L takes the lock, and M arrives right after.

1. H waits for L's remaining critical section: **3 ms**.
2. M preempts L, so L cannot release the lock until M is done: **+ 20 ms**.
3. L releases; H runs its own work: **+ 2 ms**.
4. Total: 3 + 20 + 2 = **25 ms**, against a 10 ms deadline. A second medium task would add its burst as well.

**With a mutex (inheritance).**

1. H blocks; the kernel raises L to H's priority. M arrives but cannot preempt L.
2. L finishes its critical section: **3 ms**.
3. H runs its work: **+ 2 ms**.
4. Total: 3 + 2 = **5 ms**. Deadline met with 5 ms to spare.

**The fix that shipped** was one line, \`xSemaphoreCreateBinary()\` to \`xSemaphoreCreateMutex()\`, plus a design change that mattered as much: the configuration task should never have held the bus lock across a 3 ms flash write. Copy the page under the lock in microseconds and write to flash outside it, or give the flash its own bus. Inheritance bounds the damage; short critical sections remove most of it.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "inversion-guided",
        skill: "rtos",
        objective: "Compute the worst-case wait without inheritance (guided).",
        prompt: `H's own work takes **2 ms**. L holds the shared lock for **3 ms** at most. One medium task can run a **10 ms** burst while L holds the lock. The lock is a **binary semaphore**. What is H's worst-case time from becoming ready to finishing, in ms?`,
        unit: "ms",
        answer: 15,
        tolerance: 0.5,
        hints: [
          `Without inheritance, H waits for L's whole critical section first: that is 3 ms.`,
          `While L holds the lock, the medium task can preempt L for its full burst, and H has to wait for that too: add 10 ms.`,
          `Once L releases the lock, H still has its own 2 ms of work to do. Add that to the waits.`,
        ],
        solution: `L's critical section 3 ms + the medium burst 10 ms + H's own work 2 ms = **15 ms**. With a mutex and inheritance the medium task could not preempt L, and the answer would be 3 + 2 = 5 ms.`,
        solvedFeedback: `Right: 15 ms. Three terms, and the middle one is the unbounded part.`,
        misconceptions: [
          { value: 5, tolerance: 0.5, feedback: `5 ms is the answer *with* inheritance (3 + 2). With a binary semaphore the medium burst is added too: 3 + 10 + 2 = 15 ms.` },
          { value: 13, tolerance: 0.5, feedback: `You left out H's own 2 ms of work after it gets the lock: 3 + 10 + 2 = 15 ms.` },
          { value: 12, tolerance: 0.5, feedback: `12 ms counts the medium burst and H's work but not L's critical section. H waits for all three: 3 + 10 + 2 = 15 ms.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "inversion-bound",
        skill: "rtos",
        objective: "Bound worst-case blocking with and without inheritance.",
        prompt: `H's work takes 2 ms. L's critical section on the shared lock is 4 ms. Two medium-priority tasks can each run a 15 ms burst while L holds the lock. With a **binary semaphore** as the lock, what is H's worst-case time from becoming ready to finishing its work, in ms?`,
        unit: "ms",
        answer: 36,
        tolerance: 0.5,
        solution: `Without inheritance, H waits L's full critical section (4 ms) plus every medium burst that can preempt L (15 + 15 ms), then runs 2 ms: 4 + 30 + 2 = **36 ms**. With a mutex and inheritance the same case is 4 + 2 = 6 ms.`,
        solvedFeedback: `Correct: 36 ms. The medium tasks' bursts add directly to H's wait because L cannot run while they do.`,
        misconceptions: [
          { value: 6, tolerance: 0.5, feedback: `6 ms is the answer *with* priority inheritance (4 ms critical section + 2 ms work). A binary semaphore does not inherit, so the medium bursts also count.` },
          { value: 21, tolerance: 0.5, feedback: `You counted one medium burst. Both medium tasks outrank L and both can run before L finishes: 4 + 15 + 15 + 2 = 36 ms.` },
          { value: 34, tolerance: 0.5, feedback: `Close: do not forget H's own 2 ms of work after it finally gets the lock. 4 + 30 + 2 = 36 ms.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "single",
        id: "inheritance-primitive",
        skill: "rtos",
        objective: "Pick the primitive that provides inheritance.",
        prompt: `In FreeRTOS, which primitive gives priority inheritance to the task holding it?`,
        options: [
          { id: "a", text: "A binary semaphore from xSemaphoreCreateBinary().", correct: false, feedback: `A binary semaphore has no holder; it is for signalling (often from an ISR) and provides no inheritance. Used as a lock, it creates unbounded inversion.` },
          { id: "b", text: "A mutex from xSemaphoreCreateMutex().", correct: true, feedback: `Yes. The mutex records its holder and raises the holder's priority when a higher-priority task blocks on it. It must be taken and given by tasks, never from an ISR.` },
          { id: "c", text: "A counting semaphore with a count of 1.", correct: false, feedback: `Counting semaphores track a count, not a holder, and do not inherit.` },
          { id: "d", text: "A task notification used as a lock.", correct: false, feedback: `Notifications are lightweight signals to one task; they have no holder and no inheritance.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "The fix in code, line by line",
      intro: `The configuration task after the fix: a mutex instead of a binary semaphore, and a critical section that copies a page in microseconds instead of writing flash for 3 ms.`,
      language: "c",
      code: `static SemaphoreHandle_t spi_lock;

void bus_init(void) {
    spi_lock = xSemaphoreCreateMutex();        /* not xSemaphoreCreateBinary() */
}

static void config_task(void *arg) {
    (void)arg;
    uint8_t page[256];
    for (;;) {
        wait_for_settings_change();
        if (xSemaphoreTake(spi_lock, pdMS_TO_TICKS(50)) == pdTRUE) {
            copy_settings_page(page);           /* microseconds, under the lock */
            xSemaphoreGive(spi_lock);
        } else {
            log_error("config: SPI lock timeout");
        }
        flash_write_page(page);                 /* 3 ms, no lock held */
    }
}`,
      notes: [
        { lines: "1", text: `One handle for the lock that protects the SPI bus. Every task that touches the bus takes this before and gives it after.` },
        { lines: "3-5", text: `The lock is created as a **mutex**. A mutex remembers which task holds it, which is what lets the kernel raise that task's priority when a higher task blocks on it. The original code created a binary semaphore here, which remembers nothing.` },
        { lines: "12", text: `Take the lock with a **timeout**. If the bus is not free within 50 ms something is wrong, and the task should say so rather than wait forever. A timeout is a safety net, not a fix: if it fires often, the design is wrong.` },
        { lines: "13-14", text: `The **critical section** is now only the copy of a 256-byte page: microseconds. The lock is released immediately after. This is the design change that removes most of the inversion, independent of inheritance.` },
        { lines: "18", text: `The 3 ms flash write happens with **no lock held**, so even if the logging task preempts here, nobody who needs the SPI bus is kept waiting. (In the real board the flash was on the same SPI bus, which is why the first version held the lock; the second version gave the flash its own bus.)` },
      ],
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What inheritance does not fix",
      body: `Inheritance bounds one kind of wait. Four things it leaves alone.

**Nested locks and deadlock.** If L holds lock A and wants lock B, while H holds B and wants A, inheritance raises L to H's priority and both wait forever. Inheritance does not prevent deadlock; a fixed **lock ordering** (always take A before B) or the ceiling protocol does.

**Chains.** With H blocked on L, and L blocked on an even lower task K, the kernel must raise K too. Chains are legal and slow; a design that needs them is usually holding locks for too long.

**Interrupts.** An interrupt handler cannot take a mutex and cannot be raised. Data shared between an interrupt and a task needs a different pattern (a queue, or a short section with interrupts masked), which the ISR handoff lesson covers.

**Timeouts as a disguise.** A \`xSemaphoreTake\` with a timeout turns a blocked-forever task into a task that fails every so often. The log fills with "lock timeout" and the inversion is still there; the symptom has changed shape.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Inheritance or ceiling: the trade-off a reviewer asks about",
      body: `Both protocols bound the wait. They cost different things.

**Inheritance** costs nothing at design time and acts only when a conflict actually happens. Its worst case is a chain through several holders, and it does nothing about deadlock.

**Ceiling** needs a table of which tasks use which locks, and it raises priority on *every* take, even when nobody is waiting, so unrelated tasks are delayed a little all the time. In exchange it gives a simpler worst case (one critical section, no chains) and makes deadlock between locks impossible.

Automotive operating-system standards chose ceiling, because the task set of an engine controller is known completely at design time. Most general-purpose RTOS kernels default to inheritance, because their task sets are not. Knowing which one your kernel implements, and being able to say *why* that choice fits the product, is the Tier-2 interview answer.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "inversion-remedies",
        skill: "rtos",
        objective: "Choose remedies that reduce inversion.",
        prompt: `Select **every** change that reduces the sensor task's worst-case blocking in the scenario.`,
        options: [
          { id: "a", text: "Replace the binary semaphore with a mutex (priority inheritance).", correct: true, feedback: `Bounds H's wait by L's critical section instead of by every medium burst.` },
          { id: "b", text: "Shorten L's critical section: copy the page under the lock, write to flash outside it, or give the flash its own bus.", correct: true, feedback: `Reduces the bounded part too. Inheritance limits the damage; short critical sections remove most of it.` },
          { id: "c", text: "Raise the logging task's priority above the sensor task so it finishes sooner.", correct: false, feedback: `Now the logger preempts the sensor task directly. Priorities should reflect deadlines, and the logger has none.` },
          { id: "d", text: "Add a 1 ms vTaskDelay inside the logging task's loop.", correct: false, feedback: `Reduces how often the inversion appears without bounding it. The next medium task, or a longer log burst, brings it back.` },
          { id: "e", text: "Never hold the bus lock across a blocking call or a long operation; review every lock scope.", correct: true, feedback: `The design rule that prevents the next instance.` },
        ],
        solvedFeedback: `Right: inheritance plus short, non-blocking critical sections. Reshuffling priorities or adding delays hides the symptom.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "priority-inversion-explained",
      intro: `Use three named tasks and a timeline. Say what a binary semaphore lacks and what inheritance changes. End with the design rule about critical sections, and if pushed, the inheritance-versus-ceiling trade-off.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Every shared bus, buffer or peripheral in an RTOS project is a lock decision. The review question is "how long is each critical section, and what primitive protects it?"
- **Aerospace and UAV systems.** Partitioned avionics operating systems avoid shared locks across partitions precisely because of this analysis; inside a partition, and in every flight-controller firmware built on an RTOS, the same three-task story applies. A timing budget for a safety task must include its worst-case blocking.
- **Verification and integration.** A high-rate task that is late only sometimes, with a trace showing it blocked while something in the middle runs, is inversion. Knowing the three signs saves days of blaming the driver.
- **Interviews.** The classic question. The strong answer has three named tasks, a timeline, the primitive that inherits and the one that does not, and the design rule. The Pathfinder story is a good close.`,
    },
    {
      type: "recap",
      summary: `- Three tasks, one lock: H blocks on L; M preempts L; H waits for M, which needs nothing. The scheduler did what the priorities said.
- Bounded inversion (L's critical section) is unavoidable and budgetable. Unbounded inversion (every medium burst) is the bug.
- Priority inheritance raises the lock holder to the blocked task's priority. Ceiling raises any holder to the highest user's priority at take time and also prevents deadlock.
- FreeRTOS: mutexes inherit; binary and counting semaphores do not; mutexes are not for interrupt handlers.
- Worst case without inheritance = critical section + every medium burst + H's work. With inheritance = critical section + H's work.
- Short critical sections with no blocking calls under a lock are the design fix; inheritance is the safety net.`,
      cards: [
        { id: "pi-1", front: "Unbounded priority inversion in one sentence?", back: "A high task waits on a lock held by a low task, and medium tasks that need nothing preempt the low task indefinitely." },
        { id: "pi-2", front: "What does priority inheritance do?", back: "Temporarily raises the lock holder to the priority of the highest task blocked on it, so medium tasks cannot preempt it until it releases the lock." },
        { id: "pi-3", front: "FreeRTOS: which primitive inherits?", back: "Mutexes from xSemaphoreCreateMutex. Binary and counting semaphores do not; mutexes must not be used from ISRs." },
        { id: "pi-4", front: "Worst-case blocking with vs without inheritance?", back: "With: the holder's critical section. Without: the critical section plus the run time of every medium-priority task that can preempt the holder." },
        { id: "pi-5", front: "What does inheritance not fix?", back: "Deadlock between nested locks (use lock ordering or ceiling), chains through several holders, sharing with interrupt handlers, and the design fault of long critical sections." },
      ],
    },
  ],
};
