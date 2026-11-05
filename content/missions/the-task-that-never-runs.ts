import type { Mission } from "@/lib/content/schema";

export const theTaskThatNeverRuns: Mission = {
  slug: "the-task-that-never-runs",
  moduleId: "rtos",
  title: "The task that never runs",
  summary: "The highest-priority task in a FreeRTOS system misses its deadline once a minute. Find the inversion with a trace, not a guess, and choose a fix that bounds the wait instead of hiding it.",
  durationMinutes: 12,
  budgetMinutes: 40,
  whyItMatters: "RTOS timing faults are invisible to a debugger's single-step and to printf. The engineer who reaches for the trace and the task states, and who knows what a mutex does that a semaphore does not, is the one who fixes this in an afternoon.",
  relatedLesson: "priority-inversion",
  scenario: `**System:** STM32F4 running FreeRTOS. Tasks: \`sensor\` (priority 4, SPI read every 10 ms, deadline 10 ms), \`comms\` (priority 3, UART protocol, bursts up to 25 ms), \`logger\` (priority 2, formats text to UART, 15 ms bursts), \`config\` (priority 1, writes a settings page to external SPI flash about once a minute, takes the SPI "lock" for the write).

**Symptom:** since the last release, \`sensor\` misses its 10 ms deadline about once a minute by 15 to 40 ms. The release added the settings page write. Nothing crashes; the watchdog does not fire.

Every reading below is **simulated for this mission**, written to be realistic; it is not data from real hardware.

Find out why the highest-priority task waits, and fix it so it cannot happen again.`,
  goal: `Identify unbounded priority inversion through the SPI lock, show which primitive and which design choice caused it, and choose the fix that bounds the sensor task's blocking time.`,
  actions: [
    {
      id: "task-list",
      label: "Dump task priorities, states and stack high-water marks (vTaskList / uxTaskGetSystemState)",
      category: "firmware",
      costMinutes: 3,
      assessment: "useful",
      result: `sensor 4 (Blocked), comms 3 (Ready), logger 2 (Running), config 1 (Ready). Stack margins all above 40 %. Snapshot taken during a miss.`,
      assessmentNote: `One snapshot already shows the shape: the highest task is Blocked, the lowest is Ready, a middle task is Running. Stack overflow is ruled out at the same time.`,
      evidence: "states-snapshot",
    },
    {
      id: "trace",
      label: "Record a kernel trace (SEGGER SystemView or the trace hooks) across one miss",
      category: "firmware",
      costMinutes: 8,
      assessment: "key",
      result: `Timeline: config takes the SPI lock at t=0 and starts the flash write; sensor becomes ready at t=1.2 ms, calls xSemaphoreTake on the lock, Blocked; logger becomes ready at t=1.5 ms and runs 15 ms; comms runs 12 ms; config resumes at t=28.5 ms, releases at t=31.3 ms; sensor runs at t=31.3 ms. Deadline missed by 23 ms. config's priority never changed while sensor waited.`,
      assessmentNote: `The decisive evidence: the lock holder was preempted by middle tasks while the high task waited, and its priority was not raised. That last detail says the lock is not a mutex.`,
      evidence: "trace-inversion",
    },
    {
      id: "lock-code",
      label: "Read how the SPI lock is created and used",
      category: "firmware",
      costMinutes: 4,
      assessment: "key",
      result: `\`spi_lock = xSemaphoreCreateBinary(); xSemaphoreGive(spi_lock);\` Taken with portMAX_DELAY around every SPI transaction. config holds it for the whole flash page write (poll-for-ready loop, about 3 ms).`,
      assessmentNote: `A binary semaphore used as a lock: no holder, no priority inheritance. And a 3 ms critical section with a polling loop inside it. Both halves of the fault.`,
      evidence: "binary-semaphore",
    },
    {
      id: "scope-cs",
      label: "Scope the sensor's SPI chip-select and the flash chip-select",
      category: "scope",
      costMinutes: 6,
      assessment: "useful",
      result: `Sensor CS pulses every 10.0 ms, then a 33 ms gap once a minute; the flash CS is asserted for the first 3 ms of the gap and the bus is idle for the remaining 30 ms.`,
      assessmentNote: `Confirms the bus itself is idle for most of the stall: the sensor is not waiting for the bus, it is waiting for the scheduler. Good corroboration of the trace.`,
      evidence: "bus-idle",
    },
    {
      id: "raise-sensor",
      label: "Raise the sensor task's priority to 5",
      category: "firmware",
      costMinutes: 3,
      assessment: "wasteful",
      result: `No change. The sensor task is already the highest; being higher does not help it get a lock held by a task that cannot run.`,
      assessmentNote: `Priority is not the problem; the lock's lack of inheritance is. Raising the waiter changes nothing.`,
    },
    {
      id: "delay-logger",
      label: "Add vTaskDelay(1) inside the logger's formatting loop",
      category: "firmware",
      costMinutes: 4,
      assessment: "risky",
      result: `Misses drop from once a minute to once every few minutes and get shorter; comms bursts still produce 12 ms misses.`,
      assessmentNote: `It changes how often the inversion shows, not whether it can happen. The next medium-priority burst brings it back, and the logger's throughput is now worse for no reason.`,
    },
    {
      id: "swap-mutex",
      label: "Change the lock to xSemaphoreCreateMutex() and re-run the trace",
      category: "firmware",
      costMinutes: 5,
      requiresAnyOf: ["lock-code"],
      assessment: "key",
      result: `Trace: when sensor blocks on the lock, config's priority is raised to 4; logger and comms stay Ready; config releases at t=3.1 ms; sensor runs; worst miss over 10 minutes is 0 (worst latency 3.4 ms within the 10 ms deadline).`,
      assessmentNote: `Confirmation by fix: the holder is now inherited up to the waiter's priority and the medium tasks no longer preempt it. The remaining 3 ms is the bounded part.`,
      evidence: "inheritance-confirmed",
    },
    {
      id: "disable-config",
      label: "Disable the settings page write to see if the misses stop",
      category: "firmware",
      costMinutes: 3,
      assessment: "neutral",
      result: `Misses stop. The feature is also gone.`,
      assessmentNote: `Confirms the release note's suspicion, but you already knew the write was involved; it does not say why a priority-1 task can stall a priority-4 one.`,
    },
    {
      id: "isr-check",
      label: "Measure the longest interrupt handler with a GPIO toggle and the scope",
      category: "scope",
      costMinutes: 5,
      assessment: "neutral",
      result: `Longest ISR 18 µs (UART DMA complete). Nothing near milliseconds.`,
      assessmentNote: `Reasonable to rule out, cheap, and it does: a 30 ms stall is not an interrupt.`,
    },
  ],
  diagnoses: [
    {
      id: "inversion",
      label: "Unbounded priority inversion: the SPI lock is a binary semaphore (no priority inheritance), so medium tasks preempt config while sensor waits for it",
      correct: true,
      requiresEvidence: ["trace-inversion", "binary-semaphore"],
      feedback: `Correct. The trace shows the holder preempted while the high task waited with no priority change; the code shows why: a binary semaphore has no holder to inherit. The 3 ms polling write under the lock is the bounded part and the second thing to fix.`,
    },
    {
      id: "stack",
      label: "The sensor task's stack is overflowing and corrupting the scheduler",
      correct: false,
      feedback: `High-water marks are above 40 % on every task, and the misses are clean waits with no corruption. Not a stack fault.`,
    },
    {
      id: "bus-slow",
      label: "The SPI bus is too slow to serve both the sensor and the flash",
      correct: false,
      feedback: `The scope shows the bus idle for 30 of the 33 ms stall. The sensor waits for the scheduler, not for the bus.`,
    },
    {
      id: "isr-long",
      label: "A long interrupt handler is blocking the sensor task",
      correct: false,
      feedback: `The longest ISR is 18 µs. A 30 ms stall with tasks visibly running in the trace is a scheduling matter, not an interrupt one.`,
    },
    {
      id: "priority-too-low",
      label: "The sensor task's priority is too low",
      correct: false,
      feedback: `It is already the highest in the system, and raising it to 5 changed nothing. Priority does not get a lock from a holder that cannot run.`,
    },
  ],
  fixes: [
    {
      id: "mutex-and-short",
      label: "Use a mutex (priority inheritance) for the SPI lock, and shorten config's critical section: copy the page under the lock, poll the flash's busy flag outside it or give the flash its own bus",
      quality: "best",
      feedback: `Inheritance bounds the wait at the critical section; shortening the critical section brings that bound from 3 ms to microseconds. Both halves fixed, and the design rule (no long or blocking work under a lock) goes into the review checklist.`,
    },
    {
      id: "mutex-only",
      label: "Replace the binary semaphore with a mutex and ship",
      quality: "acceptable",
      feedback: `The misses stop: the wait is bounded at config's 3 ms section, inside the 10 ms deadline. The 3 ms polling loop under a lock remains a hazard for the next, tighter deadline.`,
    },
    {
      id: "delay-fix",
      label: "Keep the binary semaphore and add delays to the logger and comms tasks so they yield more often",
      quality: "wrong",
      feedback: `Unbounded inversion stays unbounded; it just happens less often. The risky action showed comms bursts still produce misses, and any future medium task reintroduces the fault.`,
    },
  ],
  optimalPath: ["task-list", "trace", "lock-code", "swap-mutex"],
  debrief: `Four actions and twenty minutes, most of them the trace. The task-state snapshot pointed at a scheduling fault in three minutes; the trace proved the inversion and showed the holder's priority never rising; the lock's creation call explained why; and the mutex swap confirmed it by fix.

The traps were the two things engineers reach for first: raise the priority of the task that is late, and add delays to the tasks that are busy. Neither touches the mechanism. The design rule that prevents the next one is in the fix: locks that inherit, and critical sections that do not poll, block or write flash.

In an interview this is the story that proves you understand priority inheritance rather than having read about it: trace, task states, the primitive, the bound.`,
  references: [
    { title: "FreeRTOS: mutexes vs binary semaphores, priority inheritance, vTaskList and trace hooks", note: "Documented behaviour used in the evidence." },
    { title: "SEGGER SystemView and FreeRTOS trace macros", note: "Kernel event tracing used as the key action." },
  ],
};
