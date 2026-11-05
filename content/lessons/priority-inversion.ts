import type { Lesson } from "@/lib/content/schema";

export const priorityInversion: Lesson = {
  slug: "priority-inversion",
  moduleId: "rtos",
  title: "Why the high-priority task starved: priority inversion",
  summary: "A high-priority task waits on a lock held by a low-priority task, and a medium-priority task that needs neither runs for as long as it likes. Learn the three-task pattern, why a binary semaphore makes it unbounded, and what priority inheritance actually changes.",
  durationMinutes: 10,
  whyItMatters: "Priority inversion rebooted the Mars Pathfinder lander in 1997 and still causes missed deadlines in every RTOS product. It is the single most asked RTOS interview question, and the answer has a trap: 'use a mutex' is only right if you know what the mutex does that a semaphore does not.",
  objectives: [
    "Describe bounded and unbounded priority inversion with three tasks and one shared resource.",
    "Explain priority inheritance and priority ceiling, and which FreeRTOS primitives provide inheritance.",
    "Bound a high-priority task's worst-case blocking time from critical-section lengths.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Follows the standard treatment (Sha, Rajkumar and Lehoczky, 1990) and FreeRTOS documented behaviour: mutexes created with xSemaphoreCreateMutex implement priority inheritance; binary semaphores do not; mutexes must not be used from ISRs. The Pathfinder account is from public NASA and Wind River reports.",
  },
  references: [
    { title: "Sha, Rajkumar, Lehoczky: Priority inheritance protocols (IEEE Trans. Computers, 1990)", note: "Defines inheritance and ceiling protocols and the blocking bounds." },
    { title: "FreeRTOS kernel documentation: mutexes, binary semaphores, priority inheritance", note: "Which API calls give inheritance; FromISR restrictions." },
    { title: "Mars Pathfinder 1997 priority-inversion resets (public accounts by JPL and Wind River)", note: "Low-priority meteorological task held a bus mutex; a medium-priority communications task preempted it; the high-priority bus-management task missed its deadline and the watchdog reset the system." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The task that was never late, until it was",
      body: `A sensor task at the highest priority reads a sensor over SPI every 10 ms and has never missed. A configuration task at the lowest priority occasionally writes a settings page to external flash over the same SPI bus, taking 3 ms under a lock. A logging task in the middle formats text and pushes it to a UART, 20 ms at a time.

One release later, the sensor task misses its deadline by up to 20 ms, about once a minute. The trace shows it **Blocked**, waiting for the SPI lock. The lock is held by the configuration task, which is **Ready** but not **Running**. The logging task is running. The sensor task, highest priority in the system, is waiting on the lowest.`,
    },
    {
      type: "concept",
      title: "Bounded and unbounded inversion",
      body: `Three tasks: **H** (high), **M** (medium), **L** (low). H and L share a resource protected by a lock; M needs nothing.

1. L takes the lock and starts a 3 ms critical section.
2. H becomes ready, preempts L, tries the lock, blocks. So far this is **bounded** inversion: H waits at most 3 ms, the length of L's critical section. Unavoidable with mutual exclusion, and acceptable if 3 ms is budgeted.
3. M becomes ready. M is higher than L, so M preempts L. L cannot finish its critical section while M runs. H is still blocked, waiting for L, which is waiting for M, which does not care.

That is **unbounded** priority inversion: H's wait is the sum of every medium-priority task's run time, for as long as they keep coming. The scheduler is doing exactly what it was told; the priorities simply do not describe the dependency through the lock.

**Priority inheritance** fixes step 3: when H blocks on a lock held by L, the kernel temporarily raises L to H's priority. Now L outranks M, finishes its 3 ms, releases the lock, drops back to its own priority, and H runs. H's worst-case blocking is again bounded by the critical section.

**Priority ceiling** (or the immediate ceiling protocol) raises any task that takes the lock to the highest priority of any task that ever uses it, for the duration of the lock. It also prevents deadlock between nested locks, at the cost of design-time knowledge of who uses what.`,
      deeper: {
        title: "What the kernel actually does",
        body: `In FreeRTOS, a mutex from \`xSemaphoreCreateMutex()\` records its holder; when a higher-priority task blocks on it, \`xSemaphoreTake\` raises the holder's priority. A **binary semaphore** from \`xSemaphoreCreateBinary()\` has no notion of a holder (it is meant for signalling, often from an ISR), so it cannot inherit anything. Using a binary semaphore as a lock is the most common way teams build unbounded inversion by accident. Mutexes are also not allowed from ISRs: an ISR is not a task and cannot hold a priority.`,
      },
    },
    {
      type: "visual",
      title: "Three tasks, one lock",
      visual: "priority-inversion",
      body: `Toggle priority inheritance and watch H's wait change. The medium task's run length is adjustable: without inheritance it adds directly to H's delay.`,
      caption: `Illustrative timeline, not a trace from a real kernel. Critical section 3 ms, M run length adjustable.`,
    },
    {
      type: "example",
      title: "Worked example: bounding the wait",
      body: `Sensor task H, deadline 10 ms, its own work 2 ms. Configuration task L holds the SPI lock for at most 3 ms. Logging task M runs 20 ms bursts.

**Binary semaphore as the lock (no inheritance):** worst case, H blocks just after L takes the lock, then M arrives. H waits L's remaining 3 ms *plus* M's whole 20 ms burst, then runs 2 ms: 25 ms against a 10 ms deadline. Any additional medium task adds its burst too.

**Mutex with inheritance:** H blocks; L is raised to H's priority; M cannot preempt L. H waits at most 3 ms, runs 2 ms: 5 ms. Deadline met with margin.

The fix in the scenario was one line, \`xSemaphoreCreateBinary()\` → \`xSemaphoreCreateMutex()\`, plus a design change that mattered as much: the configuration task should not hold the bus lock across a 3 ms flash write at all. Copy the page under the lock in microseconds, or give the flash its own bus. Inheritance bounds the damage; short critical sections remove it.`,
    },
    {
      type: "exercise",
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
      type: "exercise",
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
      questionId: "priority-inversion-explained",
      intro: `Use three named tasks and a timeline. Say what a binary semaphore lacks and what inheritance changes. End with the design rule about critical sections.`,
    },
    {
      type: "recap",
      summary: `- Bounded inversion: H waits for L's critical section. Unbounded: medium tasks preempt L while H waits, for as long as they like.
- Priority inheritance raises the lock holder to the blocked task's priority; priority ceiling raises any holder to the highest user's priority.
- FreeRTOS: mutexes inherit, binary and counting semaphores do not, mutexes are not for ISRs.
- Worst case without inheritance = L's section + every medium burst + H's work. With inheritance = L's section + H's work.
- Short critical sections and no blocking calls under a lock are the design fix; inheritance is the safety net.`,
      cards: [
        { id: "pi-1", front: "Unbounded priority inversion in one sentence?", back: "A high task waits on a lock held by a low task, and medium tasks that need nothing preempt the low task indefinitely." },
        { id: "pi-2", front: "What does priority inheritance do?", back: "Temporarily raises the lock holder to the priority of the highest task blocked on it, so medium tasks cannot preempt it until it releases the lock." },
        { id: "pi-3", front: "FreeRTOS: which primitive inherits?", back: "Mutexes from xSemaphoreCreateMutex. Binary and counting semaphores do not; mutexes must not be used from ISRs." },
        { id: "pi-4", front: "Worst-case blocking with vs without inheritance?", back: "With: the holder's critical section. Without: the critical section plus the run time of every medium-priority task that can preempt the holder." },
      ],
    },
  ],
};
