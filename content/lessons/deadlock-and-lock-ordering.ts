import type { Lesson } from "@/lib/content/schema";

export const deadlockAndLockOrdering: Lesson = {
  slug: "deadlock-and-lock-ordering",
  moduleId: "real-time",
  format: "arc",
  prerequisites: ["priority-inversion", "will-it-meet-its-deadline"],
  title: "Deadlock and lock ordering: two tasks, two locks, no way out",
  summary: "How two tasks that each hold a lock and wait for the other's freeze for good, the four conditions that must all hold, how a global lock order breaks the cycle, how it differs from priority inversion, and a short word on real-time Linux.",
  durationMinutes: 16,
  whyItMatters: "A deadlock is a rare, timing-dependent freeze that testing may never see and the field finds on a Tuesday. Often the only symptom is a watchdog reset with no explanation. Spotting the cycle in a two-lock design and stating a lock-ordering rule is a standard embedded and avionics interview exercise.",
  objectives: [
    "State the four conditions for deadlock and which one each remedy removes.",
    "Trace the interleaving that produces a deadlock with two locks and two tasks.",
    "Define a global lock order, check code against it and fix a violation.",
    "Tell deadlock from priority inversion and from starvation, and say what a ceiling protocol, a timeout and a watchdog each do and do not do.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The four necessary conditions for deadlock (mutual exclusion, hold and wait, no preemption, circular wait) are the classical result of Coffman et al. (1971). The statement that the immediate priority ceiling protocol avoids deadlock holds under its stated assumptions (single-unit resources, tasks that do not block while holding a lock). Statements about PREEMPT_RT and Xenomai are general descriptions; check current documentation for versions and measure latency on your own hardware. The code example is synthetic.",
  },
  references: [
    { title: "Coffman, Elphick and Shoshani, System Deadlocks, ACM Computing Surveys, 1971", note: "The four necessary conditions." },
    { title: "Sha, Rajkumar and Lehoczky, Priority Inheritance Protocols: An Approach to Real-Time Synchronization, IEEE Transactions on Computers, 1990", note: "Priority inheritance and ceiling protocols." },
    { title: "Linux kernel documentation: real-time preemption (PREEMPT_RT) and lockdep", note: "Where the ordering of kernel locks is checked at run time." },
    { title: "Lesson: Why the high-priority task starved: priority inversion", note: "The neighbouring locking problem." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "A reset nobody could explain",
      body: `A data recorder resets itself about once a week. The reset log says only "watchdog". The code was reviewed. The watchdog is working as designed: some task stopped feeding it.

A developer finally catches it with a debugger. Two tasks are both in the blocked state. The navigation task is waiting for a lock that the logger holds. The logger is waiting for a lock that the navigation task holds. Neither is running, neither will ever be released, and the watchdog correctly resets the board.

Each task, read alone, is correct. The fault is in the **order** in which they take two locks. You will trace the interleaving, then write the one-line rule that prevents it.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Two cars, a narrow bridge each way",
      body: `Picture a river with two narrow bridges, upstream and downstream. Two vans must each cross both bridges. One goes upstream first, the other goes downstream first.

Each van drives onto its first bridge and stops, waiting for the second to be free. The second bridge is occupied by the other van, which is waiting for the first. Neither can move. Neither will ever back off. Traffic behind them stops too.

Nothing is broken. The road works. The vans drive well. The jam exists only because of the **order** in which they asked for the bridges and because each holds one while waiting for the other.

If both vans had agreed to always cross the upstream bridge first, one of them would simply wait for the other to finish, and then go. Agreeing an order is the whole cure.

Software locks behave exactly like those bridges.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The four conditions, and what each remedy removes",
      body: `A **deadlock** is a set of tasks, each waiting for something only another task in the set can release. It needs **all four** of these at once:

1. **Mutual exclusion**: a lock allows only one holder.
2. **Hold and wait**: a task holds one lock while waiting for another.
3. **No preemption of locks**: a lock cannot be taken from its holder; it must be given back.
4. **Circular wait**: task A waits for B, B waits for A, or a longer cycle.

Remove any one and deadlock cannot happen.

| Remedy | Breaks |
|---|---|
| Share data without locks, for example copy it | mutual exclusion |
| Take every lock at once, or avoid nesting | hold and wait |
| Try to take, and **give up** on a timeout | no preemption |
| A global **lock order** | circular wait |

In practice the **lock order** is the cheapest and the commonest. Mutual exclusion is the reason locks exist, so it is rarely removed, and taking everything at once wastes concurrency.

Deadlock is not **priority inversion**. In an inversion the high task waits for a lower one that will eventually finish. In a deadlock the wait never ends.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "understand",
      title: "The freeze in sixteen lines",
      intro: `Two tasks share a buffer and a log. Each needs both locks. This is the code that froze the recorder.`,
      language: "c",
      code: `mutex_t buf_lock, log_lock;

void nav_task(void) {
    take(&buf_lock);
    take(&log_lock);
    log_write(snapshot);
    give(&log_lock);
    give(&buf_lock);
}

void logger_task(void) {
    take(&log_lock);
    take(&buf_lock);
    flush(buf);
    give(&buf_lock);
    give(&log_lock);
}`,
      notes: [
        { lines: "1", text: `Two **mutexes**: one protects the shared buffer, one protects the log.` },
        { lines: "3-4", text: `The navigation task takes the buffer lock **first**.` },
        { lines: "5", text: `Then it takes the log lock. If the logger holds it, nav **waits here, still holding the buffer lock**: that is hold and wait.` },
        { lines: "11-12", text: `The logger takes the log lock first, the **opposite order** to nav.` },
        { lines: "13", text: `Then it asks for the buffer lock. If nav holds it, the logger waits here, holding the log lock. Each now waits for the other: a circular wait.` },
        { lines: "6-8", text: `The release lines are never reached in the bad case. Releasing in reverse order is good practice but does not prevent the freeze.` },
      ],
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: the interleaving, then the fix",
      body: `**The bad interleaving.**

1. Nav runs and takes the buffer lock.
2. A tick preempts nav **before** it asks for the log lock. The logger runs.
3. The logger takes the log lock.
4. The logger asks for the buffer lock. Nav holds it. The logger **blocks**.
5. Nav resumes and asks for the log lock. The logger holds it. Nav **blocks**.

Both blocked, both holding one lock. Deadlock. It needs the preemption at exactly step 2, which is why it happens once a week.

**The fix: one global order.** Number the locks: **buffer = 1, log = 2**. The rule: *a task may take a lock only if every lock it already holds has a smaller number.*

Check each task. Nav takes 1 then 2: allowed. Logger takes 2 then 1: **violates**. Change the logger to take the buffer lock first, then the log lock.

A third task, a configuration updater, uses lock 3 (config). It takes only that: allowed. If it also needs the buffer, it must take the buffer **first** (1) and config second (3), or release config and take the buffer, then retake.

Now steps 1 to 5 cannot happen: whoever takes the buffer lock first also gets the log lock next.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "which-condition-guided",
        skill: "deadlock",
        objective: "Name the deadlock condition a lock order removes (guided).",
        prompt: `A team adopts the rule: "locks are numbered, and a task may only take a lock with a higher number than any lock it already holds." Which of the four conditions for deadlock does this rule remove?`,
        hints: [
          `The four are: mutual exclusion, hold and wait, no preemption, circular wait.`,
          `The rule does not stop tasks holding locks, and it does not stop them waiting.`,
          `If every task climbs the numbers, can a wait ever go back round to where it started?`,
        ],
        options: [
          { id: "a", text: "Mutual exclusion", correct: false, feedback: `Locks still allow one holder at a time; the rule leaves that untouched. Removing it would mean not using locks at all.` },
          { id: "b", text: "Hold and wait", correct: false, feedback: `Tasks still hold a lock while waiting for another. The rule allows exactly that, as long as the numbers climb.` },
          { id: "c", text: "No preemption of locks", correct: false, feedback: `Locks still cannot be taken from their holder. A timeout would address this one.` },
          { id: "d", text: "Circular wait", correct: true, feedback: `Yes. If every task only waits for a higher-numbered lock, a chain of waits always climbs and can never return to its start, so no cycle can form.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "order",
        id: "deadlock-interleaving",
        skill: "deadlock",
        objective: "Put the events of a deadlock in order.",
        prompt: `Put these events in the order they must happen for the recorder to freeze.`,
        items: [
          { id: "nav-takes", text: "Nav takes the buffer lock.", why: `Nav must hold one lock before anything can be waited on.` },
          { id: "preempt", text: "A tick preempts nav before it asks for the log lock; the logger runs.", why: `The window exists only if nav is interrupted between its two lock requests.` },
          { id: "log-takes", text: "The logger takes the log lock.", why: `Now each task holds one lock.` },
          { id: "log-waits", text: "The logger asks for the buffer lock, which nav holds, and blocks.", why: `The logger holds the log lock and waits for the buffer lock.` },
          { id: "nav-waits", text: "Nav resumes, asks for the log lock, which the logger holds, and blocks.", why: `The cycle closes: each waits for the other, and neither can release.` },
        ],
        correctOrder: ["nav-takes", "preempt", "log-takes", "log-waits", "nav-waits"],
        solvedFeedback: `Right: nav takes one lock, is preempted, the logger takes the other, and each then asks for the lock the other holds. It needs that preemption in exactly the wrong place, which is why it is rare.`,
      },
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "Other ways out, and how to notice a deadlock",
      body: `A lock order is not the only tool.

- **Do not nest.** Take one lock, copy what you need, release it, then take the next. Most deadlocks vanish when locks stop being held together.
- **Use a timeout.** Take with a time limit, and on failure give back what you hold, log which lock, and retry or fail safe. A timeout breaks the "no preemption" condition and turns a freeze into a reported fault.
- **A priority ceiling.** With the **immediate ceiling** protocol, a task that takes a lock runs at the highest priority of any task that uses it. Under its assumptions (single-unit locks, no blocking while a lock is held), deadlock cannot occur and blocking is bounded.
- **Keep sections short.** Never call unknown code, or wait for an event, while holding a lock.

To **notice** one: a watchdog will reset a frozen system, but a reset with no record hides the cause. Log the name of the lock any timeout failed on, and keep a record of which task was blocked on what. Test with the bad interleaving forced, for example by inserting a delay between the two lock requests.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Deadlock, inversion, starvation: three different waits",
      body: `Three problems look alike from the outside, because something is waiting too long. They differ, and the fixes differ.

**Priority inversion.** A high-priority task waits for a lower-priority one that holds a lock. The wait ends when the holder finishes, but a medium task can delay the holder. Fix: priority inheritance or a ceiling.

**Deadlock.** A cycle of waits that **never** ends. Fix: break one of the four conditions, usually with a lock order.

**Starvation.** A task is never chosen because others keep taking the lock or the processor. Nothing is stuck, but it makes no progress. Fix: fair queues and bounded critical sections.

There is also **livelock**: tasks keep reacting to each other, retrying forever with no progress. A timeout and retry without randomised back-off can cause it.

Limits to remember. Inheritance does not prevent deadlock; it only shortens inversion. A lock order must cover **every** lock, including those inside libraries and drivers. And a ceiling protocol is **design-time**: someone must know which tasks use which locks, which is a reason to keep that table in the design document.

Which problem you have decides which tool applies.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "A word on real-time Linux",
      body: `Embedded Linux is not hard real time out of the box. Two common routes narrow the gap.

**PREEMPT_RT** is a set of changes that make almost all of the kernel preemptible. It turns most kernel spinlocks into sleeping locks with **priority inheritance** and runs interrupt handlers as schedulable threads. A real-time thread then has bounded, much smaller latencies. Recent mainline kernels include it.

**Xenomai** takes another route: a small real-time **co-kernel** runs beside Linux and gives real-time tasks priority over everything Linux does. Newer versions can also run on top of PREEMPT_RT.

Neither removes your own bugs. User code can still deadlock on two mutexes, and the kernel's lock rules do not cover your application's. In Linux, a run-time lock checker (**lockdep**) in debug kernels reports inconsistent lock order in the kernel before it deadlocks.

And neither replaces measurement. The usual tool for PREEMPT_RT is \`cyclictest\`, which reports worst-case wake-up latency on **your** hardware under **your** load. Never quote a latency from a web page.

For hard deadlines at the highest assurance levels, a dedicated RTOS or an executive is the more common choice.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "deadlock-fixes",
        skill: "deadlock",
        objective: "Judge fixes for a two-lock deadlock.",
        prompt: `The recorder freezes because nav takes lock A then B, and the logger takes B then A. Select **every** change that removes the deadlock.`,
        options: [
          { id: "a", text: "Make both tasks take A first and B second.", correct: true, feedback: `A global order removes the circular wait.` },
          { id: "b", text: "Have each task copy the data it needs under one lock, release it, and then take the other lock separately.", correct: true, feedback: `Not holding one lock while waiting for another removes hold and wait.` },
          { id: "c", text: "Give nav a higher priority than the logger.", correct: false, feedback: `Priority does not stop the cycle: nav can still be preempted between its two requests and the logger can still take B. It would not even reliably avoid inversion.` },
          { id: "d", text: "Take each lock with a timeout, and on failure release what is held, log it and retry.", correct: true, feedback: `The timeout breaks the no-preemption condition and turns a hang into a reported fault. It needs care to avoid livelock.` },
          { id: "e", text: "Let the watchdog reset the board when it freezes.", correct: false, feedback: `That recovers from the symptom and hides the cause. The deadlock is still in the design, and the reset is a failure in the field.` },
        ],
        solvedFeedback: `Right: a global lock order, not nesting, or a timeout with a report. Priority changes and a watchdog reset leave the cycle in place.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "deadlock-lock-ordering",
      intro: `Explain how two tasks can deadlock on two locks, how you would prevent it, and how deadlock differs from priority inversion.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Any firmware with more than one mutex needs a documented lock order; a lock table in the design notes costs an hour and saves weeks.
- **Aerospace and UAV systems.** Avionics software on an RTOS or an ARINC 653 style partitioned system is reviewed for shared resources, lock use and bounded blocking.
- **R&D and design.** Choosing message passing or data copying over nested locks is a design decision that removes whole classes of freezes.
- **Verification and interviews.** "Two tasks, two locks: what can go wrong, and how do you prevent it?" is a standard question; the four conditions and a lock order answer it.`,
    },
    {
      type: "recap",
      summary: `- Deadlock needs all four conditions: mutual exclusion, hold and wait, no preemption, circular wait. Remove one and it cannot happen.
- Two tasks taking two locks in opposite orders can freeze if one is preempted between its two requests; the fault is rare because it needs that exact timing.
- A global lock order (a task may take a lock only if all it holds are lower-numbered) removes circular wait. Other remedies: do not nest, use timeouts that report, or an immediate priority ceiling.
- Deadlock (never ends), priority inversion (ends, but late) and starvation (no progress) are different problems with different fixes.
- A watchdog reset hides a deadlock; log what each task was blocked on. Real-time Linux (PREEMPT_RT, Xenomai) does not remove application deadlocks, and its latency must be measured on your hardware.`,
      cards: [
        { id: "dd-1", front: "What are the four conditions for deadlock?", back: "Mutual exclusion, hold and wait, no preemption of locks, and circular wait. All four must hold; removing any one prevents deadlock." },
        { id: "dd-2", front: "How does a global lock order prevent deadlock?", back: "Locks are numbered and a task may take a lock only if all those it holds have lower numbers. Waits then always climb, so a cycle can never form: it removes circular wait." },
        { id: "dd-3", front: "How do deadlock and priority inversion differ?", back: "In inversion a high task waits for a lower one that will finish, possibly late. In deadlock the wait never ends. Inheritance fixes inversion but does not prevent deadlock." },
        { id: "dd-4", front: "Why is a watchdog reset a poor answer to a deadlock?", back: "It recovers from the freeze but hides the cause, and the reset is itself a failure in the field. Log what each task was blocked on, use timeouts that report, and fix the lock order." },
      ],
    },
  ],
};
