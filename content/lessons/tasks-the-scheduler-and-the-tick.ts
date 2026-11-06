import type { Lesson } from "@/lib/content/schema";

export const tasksTheSchedulerAndTheTick: Lesson = {
  slug: "tasks-the-scheduler-and-the-tick",
  moduleId: "real-time",
  format: "arc",
  prerequisites: ["state-machines-that-survive-review", "interrupts-and-nvic-priorities", "stack-heap-and-where-your-variables-live"],
  title: "Tasks, the scheduler and the tick: who runs, and why the low-priority one suffers",
  summary: "What a task is, the four states it moves through, what the scheduler does on every tick and every wake-up, how fixed-priority preemption picks who runs, and what happens to the lowest-priority task when load rises. Read a scheduler timeline in a simulation, then write a minimal FreeRTOS application.",
  durationMinutes: 16,
  whyItMatters: "Most embedded and avionics job descriptions name an RTOS, and the first RTOS interview question is 'what does the scheduler do when the tick fires?'. Priority inversion, deadlines and frame-based executives all assume you can read a timeline of tasks.",
  objectives: [
    "Define a task (code, stack, priority, state) and draw the four task states and the events that move a task between them.",
    "Explain fixed-priority preemptive scheduling, the tick, time slicing among equal priorities and the idle task.",
    "Read a scheduler timeline, compute utilisation and find which task suffers when load rises.",
    "Write the skeleton of a FreeRTOS application and avoid the usual period-drift and starvation mistakes.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Task states, the tick, fixed-priority preemptive scheduling, rate-monotonic priority assignment and the FreeRTOS calls shown (xTaskCreate with stack depth in words, vTaskDelayUntil, vTaskStartScheduler, higher number means higher priority) follow the public FreeRTOS documentation. The lab is a deterministic SIMULATION of a one-core scheduler with a 1 ms tick; it models scheduling decisions, not the cost of context switches or interrupts.",
  },
  references: [
    { title: "FreeRTOS kernel documentation: tasks and scheduling", note: "Task states, priorities, vTaskDelayUntil, idle task." },
    { title: "Liu and Layland, Scheduling algorithms for multiprogramming in a hard real-time environment (1973)", note: "Rate-monotonic priorities and the utilisation bound; the next lesson." },
    { title: "Lesson: Priority inversion", note: "What happens when a task blocks on a lock." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The control loop is fine, the log has holes",
      body: `A small controller runs three activities: a sensor read every 4 ms, a control calculation every 8 ms, and a data logger every 12 ms. Everything is fine on the bench.

Then someone changes the logger's message format to print floating-point numbers. The logger now takes 7 ms to run instead of 3.

The control loop still looks perfect on the oscilloscope. The sensor samples are on time. But the log file has gaps: whole records are missing, and nobody sees an error.

Why did the two important tasks not notice, and why did the least important one suffer? The answer is what a scheduler does every millisecond.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "One cook, a bell, and a rack of tickets",
      body: `Picture a kitchen with one cook. Orders arrive as tickets. A bell rings every millisecond.

At each bell the cook looks at the rack and asks: **which ticket is most urgent?** If a more urgent ticket has arrived than the one in hand, the cook puts the current dish aside, cooks the urgent one, and later picks up the first again where it was left. If nothing is waiting, the cook stands idle.

Three ideas. A **task** is one kind of order with its own place to keep unfinished work. The **tick** is the bell. The **scheduler** is the rule the cook follows: always work on the most urgent ticket.

Now see the cost. The most urgent tickets are never delayed by the others. But the least urgent one gets whatever time is left, and when the kitchen is overloaded, it is the one that waits, and waits, and sometimes never gets done.

That is your logger.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "A task and its four states",
      body: `A **task** is an ordinary function with an endless loop, plus three things the kernel gives it: its own **stack** (so it can be paused and resumed), a **priority**, and a **state**.

At any moment a task is in exactly one of four states:

- **Running**: it has the processor. On one core, only one task is running.
- **Ready**: it could run, but a higher-priority task has the processor.
- **Blocked**: it is waiting for something, a time delay, a message in a queue, a semaphore, a notification. It takes no processor time.
- **Suspended**: it has been taken out of scheduling until explicitly resumed.

The loop in a typical task does its work, then **blocks** until it is needed again. A task that never blocks never gives lower-priority tasks a turn.

Tasks are not interrupts. An interrupt handler runs in response to hardware and is brief. A task is scheduled by the kernel, may block, and can be preempted by other tasks. Handlers hand work to tasks with the **FromISR** calls, covered in an earlier lesson.

The figure shows what moves a task from one state to another.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "How a task moves between states",
      diagram: "rtos-task-states",
      alt: "State diagram of RTOS task states Ready, Running, Blocked and Suspended with the events that move a task between them.",
      caption: "Ready to Running when the scheduler picks it; Running to Ready when preempted by a higher-priority task; Running to Blocked on a blocking call; Blocked to Ready on an event or timeout.",
      body: `Trace one task around the loop: it runs, calls a delay and blocks, the delay expires and it becomes ready, and the scheduler runs it again when no higher-priority task is ready.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "What the scheduler does, and when",
      body: `The kernel runs the scheduler at two kinds of moment.

**On every tick.** A timer interrupt, the system tick, usually fires every 1 ms. The kernel increments its tick count, wakes any task whose delay has expired, and asks: is a ready task now more urgent than the running one?

**Whenever a task changes state.** If the running task blocks, or an interrupt gives a semaphore that wakes a waiting task, the scheduler runs at once and picks again.

The rule, in **fixed-priority preemptive** scheduling, is simple:

- The processor always runs the **highest-priority ready task**. A task of higher priority that becomes ready **preempts** the running one immediately.
- Among tasks of **equal priority**, the kernel can share time by switching each tick, called time slicing.
- If no task is ready, the **idle task** runs. It is the lowest priority and often puts the processor to sleep.

A common way to choose priorities for periodic work is **rate-monotonic**: the shorter the period, the higher the priority. Here the 4 ms sensor task gets the highest, the 8 ms control task the middle, and the 12 ms logger the lowest.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "A minimal FreeRTOS application",
      intro: `The skeleton of the three-task system. It needs the FreeRTOS kernel to build, so it is shown here, not run in the lab; the lab below models the same scheduling in plain C.`,
      language: "c",
      code: `static void sensor_task(void *arg) {
    TickType_t wake = xTaskGetTickCount();
    for (;;) {
        read_sensor();
        vTaskDelayUntil(&wake, pdMS_TO_TICKS(4));
    }
}

int main(void) {
    hardware_init();
    xTaskCreate(sensor_task, "sensor", 256, NULL, 3, NULL);
    xTaskCreate(control_task, "control", 256, NULL, 2, NULL);
    xTaskCreate(logger_task, "logger", 384, NULL, 1, NULL);
    vTaskStartScheduler();
    for (;;) { }
}`,
      notes: [
        { lines: "1-2", text: `A task is a function that never returns. It reads the current tick count once, before the loop, as its reference for the period.` },
        { lines: "4-5", text: `Do the work, then **block until the next period** with \`vTaskDelayUntil\`. It waits until an absolute time, so the period stays exactly 4 ticks however long the work took. Plain \`vTaskDelay(4)\` would wait 4 ticks **after** the work, stretching the period.` },
        { lines: "11-13", text: `Each task is created with a name, a **stack depth in words** (not bytes), and a **priority**: in FreeRTOS a larger number is a higher priority. Sensor has the highest, logger the lowest, matching the rate-monotonic rule.` },
        { lines: "14", text: `Start the scheduler. This call does not return; from here the kernel decides who runs. The loop after it is never reached.` },
      ],
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: reading a scheduler timeline",
      body: `The lab models the three tasks on one core with a 1 ms tick: Sensor 1 ms of work every 4 ms, Control 2 ms every 8 ms, Logger 3 ms every 12 ms. Priority follows the period. Each character in the timeline is 1 ms: **S** sensor, **C** control, **L** logger, **.** idle.

\`SCCLSLL.SCC.SLLLSCC.S...\`

**Reading it.**

- ms 0: Sensor runs 1 ms, then Control 2 ms (ms 1 to 2).
- ms 3: Logger starts.
- ms 4: Sensor is released again. Higher priority than Logger, it **preempts** it for 1 ms.
- ms 5 and 6: Logger resumes and finishes its third millisecond. Its response time, from release at 0 to completion at 7, is **7 ms**.
- ms 7: idle.

**Utilisation:** 1/4 + 2/8 + 3/12 = 0.25 + 0.25 + 0.25 = **0.75**. The processor is busy 75 % of the time.

**Now the change.** The logger takes 7 ms. Utilisation becomes 0.25 + 0.25 + 7/12 = **1.08**: more work arrives than the processor can do. The timeline has no idle time left, Sensor and Control still meet every deadline (they outrank the logger), and the Logger misses **10** deadlines in 240 ms.

So the important tasks looked fine, and the least important one carried all the damage.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "preempt-guided",
        skill: "scheduling",
        objective: "Predict who runs when a higher-priority task becomes ready (guided).",
        prompt: `The logger is running. At 4 ms the sensor task's period expires and it becomes ready. The sensor has higher priority than the logger. What does a fixed-priority preemptive scheduler do?`,
        hints: [
          `Which task has the higher priority, and which has the processor now?`,
          `The scheduler always runs the highest-priority ready task. At the moment the sensor becomes ready, who is that?`,
          `What happens to the logger's unfinished work while the sensor runs?`,
        ],
        options: [
          { id: "a", text: "The logger finishes first; the sensor waits until it blocks or ends.", correct: false, feedback: `That is cooperative scheduling. In a preemptive kernel a higher-priority ready task takes the processor at once, at the next scheduling point, usually the tick.` },
          { id: "b", text: "The sensor preempts the logger; the logger goes to Ready with its progress kept, and resumes when no higher-priority task is ready.", correct: true, feedback: `Right. The logger's registers and stack are saved, it moves from Running to Ready, and it picks up exactly where it stopped. That is the timeline's ms 4.` },
          { id: "c", text: "The two share the processor equally, a millisecond each.", correct: false, feedback: `Time slicing shares time only between tasks of **equal** priority. A higher priority always wins.` },
          { id: "d", text: "The logger is cancelled and restarts at its next period.", correct: false, feedback: `A preempted task is not cancelled. It keeps its stack and resumes. Restarting would lose all its progress.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: two cases, one scheduler (a simulation)",
      lab: "c-sched",
      body: `A **simulation** of a fixed-priority preemptive scheduler with a 1 ms tick, running for 240 ms. It prints the first 24 ms as a timeline, then the utilisation, the worst response time of each task and the number of deadline misses. Case 1 is the 3 ms logger; case 2 makes it 7 ms.

Watch which of the three tasks changes between the cases, and which do not.`,
      tryNext: `Change the Logger to 4 ms and then 5 ms and run again. At what execution time do the first deadline misses appear? Then swap the priorities of the Sensor and the Logger and see which task now suffers, and why a rate-monotonic assignment protects the short-period tasks.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "utilisation-new-set",
        skill: "scheduling",
        objective: "Compute the processor utilisation of a task set.",
        prompt: `A task set: Sensor 1 ms every 4 ms, Control 2 ms every 8 ms, and a Logger that now takes **5 ms** every **12 ms**. What is the total utilisation, as a percentage of the processor?`,
        unit: "%",
        answer: 91.7,
        tolerance: 0.3,
        solution: `Add each task's execution time divided by its period: 1/4 + 2/8 + 5/12 = 0.25 + 0.25 + 0.4167 = 0.9167, which is **91.7 %**. Below 100 %, but not by much: utilisation under 100 % is necessary, not sufficient, for meeting deadlines. The next lesson shows how to check.`,
        solvedFeedback: `Right: about 91.7 %. It leaves little margin, and the next lesson shows why that alone does not prove the deadlines are met.`,
        misconceptions: [
          { value: 75, tolerance: 0.3, feedback: `75 % is the original set with a 3 ms logger. With a 5 ms logger the third term is 5/12, about 0.417, giving 91.7 %.` },
          { value: 8.0, tolerance: 0.5, feedback: `You added the execution times (1 + 2 + 5 = 8). Each time must be divided by its own period before adding: 0.25 + 0.25 + 0.417.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Why 'it looked fine' is not evidence",
      body: `The scenario's trap is general: the tasks that **matter most** hide the damage, because the scheduler protects them by sacrificing the rest.

**Average load proves little.** A processor at 75 % can still miss a deadline if the busy moments line up. Response time, not average load, is what meets a deadline. The next lesson computes it.

**A task that never blocks starves the rest.** A loop that polls without a delay keeps the processor from every lower-priority task. Always block, with a delay, a queue, a semaphore or a task notification.

**Period drift.** \`vTaskDelay(4)\` after the work makes the period work plus 4. Use \`vTaskDelayUntil\` for a fixed period.

**Stack sizes are per task.** Each task needs a stack big enough for its deepest call chain. Measure it with the **stack high-water mark** instead of guessing, because a **stack overflow** corrupts a neighbour silently.

**The tick has a cost.** A 1 ms tick gives 1 ms timing resolution and a steady interrupt load; a faster tick improves resolution and costs processor time.

**Honest limit.** The lab ignores context-switch time and interrupt time. Real response times are a little worse, and a measurement on the target is needed to know by how much.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "scheduler-statements",
        skill: "scheduling",
        objective: "Judge statements about scheduling.",
        prompt: `Select **every** statement that is correct.`,
        options: [
          { id: "a", text: "In the overloaded case, the Sensor and Control tasks still meet their deadlines because they have higher priority than the Logger.", correct: true, feedback: `Right. Higher-priority tasks are never delayed by lower-priority ones in a preemptive fixed-priority scheduler, which is why the logger absorbed the damage.` },
          { id: "b", text: "A task that polls in a loop with no delay and no blocking call can starve every lower-priority task.", correct: true, feedback: `Right. A ready task that never blocks keeps the processor whenever it is the highest-priority ready task.` },
          { id: "c", text: "Calling vTaskDelay(4) at the end of each loop iteration gives an exact 4 ms period.", correct: false, feedback: `It waits 4 ticks after the work, so the period is the work time plus 4 ms and drifts. vTaskDelayUntil with a saved wake time keeps the period fixed.` },
          { id: "d", text: "If total utilisation is under 100 %, every deadline is guaranteed to be met.", correct: false, feedback: `Under 100 % is necessary, not sufficient. Blocking and the order of execution can still cause a miss; response-time analysis checks it.` },
        ],
        solvedFeedback: `Right: preemption protects higher priorities; non-blocking loops starve lower ones; vTaskDelayUntil fixes the period; and utilisation under 100 % is necessary, not sufficient.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "scheduler-tick-and-task-states",
      intro: `Explain what the scheduler does on a tick, what the four task states are, and why the lowest-priority task suffers first when load rises.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Every FreeRTOS or Zephyr project starts with tasks, priorities and stack sizes; the skeleton in this lesson is the first thing you write.
- **Aerospace and UAV systems.** Flight software runs fixed-priority or frame-based schedules; reading a timeline is how you see which function is at risk when load grows.
- **R&D and design.** Choosing priorities, periods and stack sizes is design work; rate-monotonic assignment is the default to justify any change from.
- **Verification and interviews.** "What does the scheduler do on a tick?" and "why did the least important task fail first?" are near-certain questions; the timeline is the answer.`,
    },
    {
      type: "recap",
      summary: `- A task is a function with its own stack, a priority and a state; the four states are Running, Ready, Blocked and Suspended.
- The scheduler runs on every tick and every state change and always runs the highest-priority ready task; equal priorities may share time; the idle task runs when nothing is ready.
- Rate-monotonic priorities give the shortest period the highest priority.
- When load rises, the lowest-priority task misses first and the important tasks look fine; utilisation is the sum of execution time over period.
- Always block; use vTaskDelayUntil for fixed periods; size stacks from the high-water mark.`,
      cards: [
        { id: "tsk-1", front: "What are the four states of an RTOS task?", back: "Running (has the processor), Ready (could run, a higher priority is running), Blocked (waiting for a delay, queue, semaphore or notification) and Suspended (taken out of scheduling until resumed)." },
        { id: "tsk-2", front: "What does the scheduler do on a tick?", back: "Increments the tick count, wakes tasks whose delay has expired, and runs the highest-priority ready task, preempting the running one if a higher-priority task is now ready." },
        { id: "tsk-3", front: "Why does the lowest-priority task suffer first when the processor is overloaded?", back: "Higher-priority tasks are never delayed by lower ones, so they run on time and the lowest-priority task gets only the remaining time and misses its deadlines." },
        { id: "tsk-4", front: "Why use vTaskDelayUntil rather than vTaskDelay for a periodic task?", back: "vTaskDelay waits a fixed time after the work, so the period is work plus delay and drifts. vTaskDelayUntil waits until an absolute wake time, keeping the period exact." },
      ],
    },
  ],
};
