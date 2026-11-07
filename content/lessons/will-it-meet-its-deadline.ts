import type { Lesson } from "@/lib/content/schema";

export const willItMeetItsDeadline: Lesson = {
  slug: "will-it-meet-its-deadline",
  moduleId: "real-time",
  format: "arc",
  prerequisites: ["tasks-the-scheduler-and-the-tick", "priority-inversion"],
  title: "Will it meet its deadline? Utilisation, response time and blocking",
  summary: "A real-time system is one where late is wrong. State a timing requirement as period, deadline and worst-case execution time, test a task set with the utilisation bound and with response-time analysis, add interrupt and blocking time honestly, and check the hand calculation against a scheduler model.",
  durationMinutes: 18,
  whyItMatters: "'Is 80 % CPU load acceptable?' is the wrong question and interviewers know it. 'Does every task finish before its deadline in the worst case, and by how much?' is the right one, and a short calculation answers it. Avionics, automotive and medical teams expect you to have done it at least once and to say what you assumed.",
  objectives: [
    "Write a timing requirement as period, deadline and worst-case execution time, and say why average load is not the question.",
    "Apply the rate-monotonic utilisation bound and know that it is sufficient, not necessary.",
    "Compute worst-case response times by iteration for a fixed-priority task set, including blocking from a shared lock.",
    "Check a hand calculation against a scheduler model and report the slack as evidence.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Rate-monotonic analysis follows Liu and Layland (1973) and the response-time equation of Joseph and Pandya (1986) as presented in standard real-time texts. Every number in the worked example and exercises was recomputed by hand and the three-task cases were checked against the scheduler model lab. The model is a simplified single-core simulation, not a timing measurement of any product.",
  },
  references: [
    { title: "Liu and Layland, Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment, Journal of the ACM, 1973", note: "The utilisation bound n(2^(1/n) − 1) and the optimality of rate-monotonic priorities." },
    { title: "Burns and Wellings, Real-Time Systems and Programming Languages", note: "The iterative response-time equation with blocking and release jitter." },
    { title: "Lesson: Why the high-priority task starved: priority inversion", note: "Where the blocking term comes from and how inheritance bounds it." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The 80 % that was not enough",
      body: `A review asks whether a motor controller is safe to ship. The engineer shows the RTOS statistics: CPU load 80 %, idle 20 %. Approved.

In the field, once every few hours, a control task finishes 3 ms late and the current limit trips. The load figure was an average over seconds. In one unlucky millisecond three tasks were released together, a serial interrupt arrived, and the control task waited for a lock the logger was holding. The average said 80 %. That millisecond said well over 100 %.

Nobody had computed the worst case, and nothing in the design said what the deadline was. This lesson is that computation, and it is short.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The Friday rush, not the weekly average",
      body: `A restaurant kitchen can handle two hundred orders a week without trouble. That says nothing about 7 p.m. on Friday, when ten tables order at once and the cook is already busy with a large party.

A guest does not care about the weekly average. They care whether **their** plate arrives before they give up. So the cook asks a different question: in the **worst** rush I can imagine, how long does each plate take?

Real-time engineering asks the same thing of software. Each task is a plate with a time limit. You do not ask how busy the processor is on average. You ask: when every task is released together, interrupts arrive at their fastest and a shared lock is held for as long as it ever is, does each task still finish in time, and with how much to spare?

Everything in this lesson is a way of doing that sum with numbers you can defend.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Period, deadline and worst-case execution time",
      body: `Each periodic task has three numbers.

- **Period T**: how often it is released.
- **Deadline D**: how long after release it must be finished, often D = T.
- **Worst-case execution time C**: the longest it ever runs with nothing interrupting it.

A task started by an event, such as a received frame, has a **minimum inter-arrival time**, which is used as its T.

The system is **schedulable** if every task meets its deadline in every possible pattern of releases. The pattern that hurts most is the **critical instant**: every task released at the same moment.

C must be honest. It is a **measured maximum** over every code path and data case, with margin, and it includes the regions where interrupts are off. A routine that takes longer on long messages has a worst case you must find, not a typical value.

Classify each task as hard (a miss is a failure), firm (the late result is useless but harmless) or soft (quality drops). Analysis effort goes to the hard ones.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Test one: utilisation and the rate-monotonic bound",
      body: `**Utilisation** is U = the sum of C / T over all tasks: the fraction of the processor the set demands in the long run. If U is above 1 the set is overloaded and nothing can save it.

With **rate-monotonic** priorities (the shorter the period, the higher the priority) and D = T, Liu and Layland showed the set is schedulable if

U ≤ n × (2^(1/n) − 1)

| Tasks n | Bound |
|---|---|
| 1 | 1.000 |
| 2 | 0.828 |
| 3 | 0.780 |
| 4 | 0.757 |
| many | 0.693 |

The limit, 0.693, is ln 2.

Read it carefully: it is **sufficient, not necessary**. Below the bound you are done. Above it the set may still be fine; for example, if every period divides the next one, the set is schedulable right up to U = 1. Above the bound you simply cannot say yet, so you compute exactly.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Test two: worst-case response time",
      body: `The **response time** R of a task is the time from its release to its completion in the worst case. For fixed priorities:

R = C + B + the sum, over every higher-priority task j, of ⌈R / T_j⌉ × C_j

- **C** is the task's own execution time.
- **B** is the **blocking time**: how long a lower-priority task can hold a lock this task needs. With priority inheritance, it is the longest single critical section of any lower task that shares the lock.
- Each term of the sum counts how many times task j **preempts** during the window of length R, and what that costs. ⌈x⌉ means x rounded up.

R appears on both sides, so iterate. Start with R = C + B. Work out the right-hand side. Put the answer back in. Repeat until it stops changing. If it passes the deadline, stop: that is a miss.

Schedulable means R ≤ D for **every** task. The difference D − R is the **slack**, the margin a reviewer wants as a number.

Interrupt handlers count as the highest-priority tasks, at their maximum rate.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: three tasks, then the logger grows",
      body: `Tasks, all in ms, rate-monotonic, D = T: **Sensor** C = 1, T = 4. **Control** C = 2, T = 8. **Logger** C = 3, T = 12.

**Utilisation.** 1/4 + 2/8 + 3/12 = 0.25 + 0.25 + 0.25 = 0.75. The bound for three tasks is 0.780. Since 0.75 is below it, the set is schedulable. Done in one line.

**Response times anyway.**

- Sensor: nothing above it, so R = 1. Slack 3.
- Control: R = 2 + ⌈R/4⌉ × 1. Start at 2: 2 + 1 = 3. Again: ⌈3/4⌉ = 1, so 3. **R = 3**, slack 5.
- Logger: R = 3 + ⌈R/4⌉ × 1 + ⌈R/8⌉ × 2. Start at 3: 3 + 1 + 2 = 6. Then ⌈6/4⌉ = 2 and ⌈6/8⌉ = 1: 3 + 2 + 2 = 7. Then ⌈7/4⌉ = 2, ⌈7/8⌉ = 1: 7 again. **R = 7**, slack 5.

**Now a lock.** Suppose Control shares a buffer with Logger, and Logger holds it for up to 2 ms. B = 2 for Control. R = 2 + 2 + ⌈R/4⌉. Start at 4: 4 + 1 = 5; then ⌈5/4⌉ = 2, so 6; again 6. **R = 6**, double the 3 without the lock, but still within 8.

**Logger grows to C = 7.** U = 0.25 + 0.25 + 0.583 = 1.083, above 1. Iterating: 7, then 11, then 14, already past D = 12. **A miss**, found on paper before any board.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "utilisation-guided",
        skill: "timing-analysis",
        objective: "Compute the utilisation of a task set (guided).",
        prompt: `Three periodic tasks: A runs 1 ms every 5 ms, B runs 2 ms every 10 ms, C runs 3 ms every 20 ms. What is the total utilisation U, as a fraction (for example 0.50)?`,
        unit: "",
        answer: 0.55,
        tolerance: 0.005,
        hints: [
          `Utilisation of one task is its execution time divided by its period.`,
          `A: 1/5, B: 2/10, C: 3/20. Write each as a decimal.`,
          `0.20 + 0.20 + 0.15.`,
        ],
        solution: `A: 1/5 = 0.20. B: 2/10 = 0.20. C: 3/20 = 0.15. Total **0.55**. The three-task bound is 0.780, so this set is comfortably schedulable under rate-monotonic priorities.`,
        solvedFeedback: `Right: 0.55, well below the 0.780 bound for three tasks, so no response-time calculation is needed to accept it.`,
        misconceptions: [
          { value: 0.15, tolerance: 0.005, feedback: `0.15 is only task C. Utilisation is the sum over all tasks: 0.20 + 0.20 + 0.15 = 0.55.` },
          { value: 6, tolerance: 0.05, feedback: `6 is the sum of the execution times in ms. Utilisation divides each by its own period first: 0.20 + 0.20 + 0.15 = 0.55.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "The iteration in ten lines of C",
      intro: `Response-time analysis is a loop that stops when the answer stops changing. This function does it for task i; tasks are sorted from highest priority (index 0) to lowest.`,
      language: "c",
      code: `uint32_t response_time(const task_t *t, int i, uint32_t blocking) {
    uint32_t r = t[i].c + blocking;
    for (;;) {
        uint32_t next = t[i].c + blocking;
        for (int j = 0; j < i; j++)
            next += ((r + t[j].t - 1) / t[j].t) * t[j].c;
        if (next == r) return r;
        if (next > t[i].d) return next;
        r = next;
    }
}`,
      notes: [
        { lines: "1-2", text: `Start at **C plus blocking**: the least the task can possibly take. Everything else adds to this.` },
        { lines: "4-6", text: `One pass of the equation. For each higher-priority task j, \`(r + T - 1) / T\` is ⌈r / T⌉ in integer arithmetic: how many releases of j fall inside the window. Multiply by its C.` },
        { lines: "7", text: `If the new value equals the old one, the iteration has **converged**: that is the worst-case response time.` },
        { lines: "8", text: `If it has grown past the deadline, stop and report it: a miss, and no point iterating further.` },
        { lines: "9", text: `Otherwise feed the new value back in and go round again. The values only ever increase, so the loop always ends.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: the scheduler model agrees with the hand calculation",
      lab: "c-sched",
      body: `This program is a **simulation** of a fixed-priority preemptive scheduler with a 1 ms tick, running the same three tasks as the worked example. Compare the worst response it prints for each task with the hand figures: 1, 3 and 7 ms. The second case grows the Logger to 7 ms and counts deadline misses. The model drops an unfinished job at the next release, so its worst-response column shows only jobs that completed.`,
      tryNext: `Change the Logger's execution time to 4 ms, then 5, and predict the response time and the utilisation before each run. At what execution time does the Logger first miss? Check your answer with the iteration, then with the model.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "rm-bound-three",
        skill: "timing-analysis",
        objective: "Apply the rate-monotonic bound.",
        prompt: `Three tasks have utilisations 0.30, 0.25 and 0.20. What is the Liu and Layland bound for three tasks, to two decimal places? Then decide whether the bound alone proves this set schedulable.`,
        unit: "",
        answer: 0.78,
        tolerance: 0.005,
        solution: `n × (2^(1/n) − 1) for n = 3 is 3 × (1.2599 − 1) = **0.78**. The set has U = 0.75, which is below the bound, so the bound alone proves it schedulable.`,
        solvedFeedback: `Right. Below the bound, the one-line test is enough; above it, compute response times.`,
        misconceptions: [
          { value: 0.69, tolerance: 0.005, feedback: `0.693 is the limit as the number of tasks becomes large. For three tasks the bound is higher: 0.78.` },
          { value: 1, tolerance: 0.005, feedback: `1.0 is the bound for one task, or for a set whose periods are harmonic. For three arbitrary periods it is 0.78.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "response-time-blocking",
        skill: "timing-analysis",
        objective: "Compute a worst-case response time by iteration.",
        prompt: `Task A: C = 2 ms, T = 10 ms (highest priority). Task B: C = 4 ms, T = 20 ms. Task C: C = 5 ms, T = 50 ms, and it can be blocked for up to 1 ms by a lower-priority task holding a shared lock (priority inheritance is in use). What is task C's worst-case response time, in milliseconds?`,
        unit: "ms",
        answer: 14,
        tolerance: 0,
        solution: `R = 5 + 1 + ⌈R/10⌉ × 2 + ⌈R/20⌉ × 4. Start at R = 6: ⌈6/10⌉ × 2 = 2 and ⌈6/20⌉ × 4 = 4, so R = 12. Then ⌈12/10⌉ = 2 gives 4 and ⌈12/20⌉ = 1 gives 4, so R = 14. Then ⌈14/10⌉ = 2 gives 4 and ⌈14/20⌉ = 1 gives 4: R = 14 again. Converged: **14 ms**, with 36 ms of slack against the 50 ms deadline.`,
        solvedFeedback: `Right: 14 ms. Two releases of A, one of B, and 1 ms of blocking, on top of its own 5 ms.`,
        misconceptions: [
          { value: 12, tolerance: 0, feedback: `12 ms is the first pass (6 + 2 + 4). The 12 ms window contains a second release of task A, so go round again: 6 + 4 + 4 = 14, which then holds.` },
          { value: 13, tolerance: 0, feedback: `13 ms drops something. R = 5 (own) + 1 (blocking) + 2 × 2 (A twice) + 1 × 4 (B once) = 14.` },
          { value: 11, tolerance: 0, feedback: `11 ms leaves out the blocking term and counts A only once. Include both: 14.` },
        ],
      },
    },
    {
      type: "figure",
      stage: "check",
      depth: "apply",
      title: "The same 14 ms, drawn on a timeline",
      diagram: "response-time",
      alt: "Timeline of tasks A, B and C showing a lower-priority task holding a lock for 1 ms, task C running in two pieces separated by A and B, and the worst-case response time of 14 ms.",
      caption: "Task C waits 1 ms for the lock, runs 3 ms, is preempted by A again, then finishes its last 2 ms: R = 14 ms.",
      body: `Check your answer against the picture. Find the 1 ms of blocking, the two releases of A and the one release of B, and see where task C's own 5 ms sits between them.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What the calculation leaves out, and how to be honest about it",
      body: `The equation is exact only for its assumptions. Say which ones you made.

**Interrupts.** An interrupt handler preempts every task. Add each one, at its maximum rate and execution time, to the higher-priority set for every task. Leaving them out makes every response time optimistic.

**Context switches and the tick.** Each preemption costs a switch, and a task released between ticks waits for the next one. Add them or write down why they are negligible.

**Blocking.** The B term assumes priority inheritance or a ceiling. With a plain binary semaphore, B has no bound, which is the starvation in the priority-inversion lesson.

**Execution times.** C is a measured maximum, never a typical value. The analysis is only as true as the numbers put into it.

**Deadlines.** The calculation assumes D is at most T and each job finishes before the next is released.

State the result with its assumptions, for example: "Control: R = 6 ms of an 8 ms deadline, assuming ISR load of 0.2 and a 2 ms maximum lock hold, C measured over one hour under stress." That sentence is evidence. "It runs fine" is not.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "timing-rules",
        skill: "timing-analysis",
        objective: "Apply the rules of timing analysis.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "An average CPU load of 80 % says nothing about whether a hard deadline is met in the worst case.", correct: true, feedback: `The analysis is about the critical instant, not the typical second.` },
          { id: "b", text: "Interrupt handlers are included as the highest-priority tasks, with their maximum rate and execution time.", correct: true, feedback: `Every interrupt preempts every task; leaving them out makes every response time optimistic.` },
          { id: "c", text: "The rate-monotonic bound is necessary: a set above it always misses a deadline.", correct: false, feedback: `It is sufficient only. Sets above it, harmonic ones especially, are often schedulable; compute response times to decide.` },
          { id: "d", text: "With priority inheritance, a task's blocking time is the longest critical section of any lower-priority task that shares a lock with it.", correct: true, feedback: `That is the bound from the inversion lesson, used as B in the equation.` },
          { id: "e", text: "Worst-case execution time can be taken as the typical value measured on the bench.", correct: false, feedback: `C is the measured maximum across every path, with margin. A typical value makes the whole analysis fiction.` },
        ],
        solvedFeedback: `Right: worst case, not average; interrupts included; the bound is sufficient only; blocking from the longest lower critical section; C is a maximum.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "is-it-schedulable",
      intro: `State period, deadline and execution time for each task, do the utilisation check, then compute one response time aloud with the blocking term and say what you would measure.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Choosing task periods, priorities and critical-section lengths is this calculation; it tells you what a new feature can afford before you write it.
- **Aerospace and UAV systems.** Flight software timing budgets are stated and reviewed as period, deadline, worst-case time and slack; avionics reviews ask for the assumptions, not the load average.
- **R&D and design.** Early utilisation estimates decide whether a processor is big enough, long before the firmware exists.
- **Verification and interviews.** "Is this task set schedulable?" and "why does average load prove nothing?" are standard questions; a response-time iteration worked aloud is a strong answer.`,
    },
    {
      type: "recap",
      summary: `- A timing requirement is period, deadline and worst-case execution time per task; C is a measured maximum. Average load is not the question; the critical instant is.
- Utilisation U = sum of C/T; above 1 is overload. The rate-monotonic bound 0.828, 0.780, 0.757 down to 0.693 is sufficient only.
- Response time: R = C + B + sum of ceil(R/T_j) × C_j over higher priorities, iterated until it settles or passes D. Interrupts count as top-priority tasks; B is the longest lower critical section with inheritance.
- Schedulable means R is at most D for every task; report the slack and the assumptions.
- A scheduler model is a good cross-check but is a simulation, not a measurement of the real system.`,
      cards: [
        { id: "dl-1", front: "Why is '80 % CPU load' not a schedulability argument?", back: "It is an average over seconds. Deadlines are met or missed at the critical instant, when every task is released together, interrupts arrive at their fastest and locks are held longest. Analyse the worst case." },
        { id: "dl-2", front: "What is the rate-monotonic utilisation bound?", back: "U ≤ n(2^(1/n) − 1): 0.828 for two tasks, 0.780 for three, 0.757 for four, tending to 0.693. It is sufficient, not necessary; harmonic periods can reach 1.0." },
        { id: "dl-3", front: "State the response-time equation.", back: "R = C + B + sum over higher-priority j of ceil(R / T_j) × C_j, iterated from R = C + B until it converges or passes D. Include interrupts as top-priority tasks and blocking from the longest lower critical section." },
        { id: "dl-4", front: "What does a good timing claim sound like?", back: "A number with its assumptions: 'Control R = 6 ms of 8 ms, with ISR load 0.2, lock hold at most 2 ms, C measured over an hour under stress.' It names slack and what was assumed." },
      ],
    },
  ],
};
