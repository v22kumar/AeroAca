import type { Lesson } from "@/lib/content/schema";

export const measuringWcetAndJitter: Lesson = {
  slug: "measuring-wcet-and-jitter",
  moduleId: "real-time",
  format: "arc",
  prerequisites: ["will-it-meet-its-deadline", "oscilloscope-probing"],
  title: "Measuring worst-case time and jitter on the target",
  summary: "How to measure the execution time and the jitter of a task on real hardware with a spare pin, a cycle counter and a scope, why the average tells you nothing, why a measured maximum is only a lower bound on the true worst case, and how to phrase a timing claim you can defend.",
  durationMinutes: 16,
  whyItMatters: "'Deterministic, sub-millisecond' is a claim, and the next question is always 'how did you measure it?'. Candidates who can describe a pin-toggle measurement, a high-water mark and the limits of both sound like engineers; those who quote a load percentage do not. The measured numbers also feed the response-time analysis.",
  objectives: [
    "Measure the time a task takes on a target with a GPIO toggle and a cycle counter, and keep a high-water mark.",
    "Tell elapsed time from execution time and say what interrupts do to a measurement.",
    "Compute jitter from a series of period measurements and explain why the mean is the wrong number.",
    "State what a measured maximum proves and does not prove, and phrase a claim with its method and its margin.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The measurement methods (a spare GPIO observed on an oscilloscope or logic analyser, the Cortex-M DWT cycle counter, high-water marks) are standard embedded practice. The statement that a measured maximum is a lower bound on the true worst case, and that static analysis tools give an upper bound at the cost of pessimism, follows the real-time systems literature. All timing figures are synthetic and invented for teaching, not measurements of any product.",
  },
  references: [
    { title: "Arm Cortex-M3, M4 and M7 technical reference manuals: Data Watchpoint and Trace unit (DWT)", note: "The CYCCNT cycle counter and how to enable it; not present on Cortex-M0 and M0+." },
    { title: "Wilhelm et al., The Worst-Case Execution-Time Problem: Overview of Methods and Survey of Tools, ACM TECS, 2008", note: "Measurement versus static analysis, and why the two are combined." },
    { title: "Lesson: Will it meet its deadline?", note: "Where the measured C goes." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "'Sub-millisecond, deterministic'",
      body: `A CV line reads: "Implemented a deterministic sub-millisecond control loop." In the interview you are asked: "How did you measure that?"

You say the average loop time was 400 µs. The interviewer asks about the slowest. You do not know; you only logged the mean. They ask what happened on the first call after a mode change. You have never looked.

On the bench, the loop took 400 µs almost every time and 2.4 ms once in a while. The average hid it and the deadline was 1 ms. Nobody was careless: the logging simply recorded the wrong statistic.

This lesson is the measurement that would have caught it, and the honest sentence you can say afterwards.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The worst day of the commute",
      body: `Your journey to work takes 35 minutes on average. Most days, 30 to 40. Once in a while it takes 90 because of an accident.

If you have a flight to catch, the average is useless. You plan for the worst day you can reasonably expect, and then add a margin.

A real-time task is that flight. The deadline is the departure time. A task that is quick 999 times in a thousand and slow once is a task that **will** miss the flight, and the miss will be rare, hard to reproduce and blamed on something else.

Measuring for real time is therefore a hunt for the slowest run, and for the reason it was slow. The fast runs are the least interesting data you have.

There is a second thing to measure: not how long the task took, but how much that time **varies**, because a control loop that runs at 10 ms plus or minus 5 ms behaves very differently from one that runs at 10 ms plus or minus 50 µs.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Execution time, elapsed time, high-water mark and jitter",
      body: `**Execution time** is the time the processor spends running the task's own code.

**Elapsed time** is the clock time from start to finish. If an interrupt or a higher-priority task runs in between, it counts in the elapsed time. A simple measurement gives you elapsed time, so say which you measured.

A **high-water mark** is the largest value seen so far. Keep it, not the mean: at the end of a long run it is the slowest observed time.

**Jitter** is the variation in timing. Two kinds matter:

- **Execution jitter**: the spread of the task's duration.
- **Period jitter**: how far the time between successive outputs strays from the nominal period.

Peak-to-peak jitter is the maximum minus the minimum. A mean is the wrong number for both, because it is dominated by the typical case and hides the tail.

On a target you measure with a **GPIO** pin toggled at the start and end of the code, watched on an **oscilloscope** or **logic analyser**, or by reading a free-running hardware counter. Both together are better: the pin gives an independent view.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Measurement versus analysis: what a maximum proves",
      body: `Suppose you measure the task a million times and the slowest run took 2.38 ms. What has that shown?

That the worst case is **at least** 2.38 ms. It has not shown that it is no more. The slowest path might not have been exercised, or the slowest input might not have been applied. A measured maximum is a **lower bound** on the true worst case.

**Static analysis** works the other way. A tool reads the code and a model of the processor, and computes a bound that is guaranteed to be at least the true worst case. It is **safe** but often pessimistic, and it needs a trustworthy model of caches, pipelines and memory.

Practice combines them:

- Design the test to hit the **longest paths** on purpose, using the code structure and coverage to see which ones ran.
- Apply the **worst inputs**: maximum message length, full buffers, the mode change.
- Run under **stress**: all interrupts active, DMA busy, caches cold.
- Add a **margin** to the observed maximum, and say how much and why.

Then report it as a measured value with a method, never as a proven bound.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: eight timings, one lesson",
      body: `A 10 ms control step is timed eight times with a pin toggle on a scope, in microseconds:

**410, 395, 402, 398, 405, 2380, 399, 401**

**The mean.** The sum is 5190, so the mean is **649 µs**. Against a 1000 µs budget, that looks comfortable.

**The median.** Sorted: 395, 398, 399, 401, 402, 405, 410, 2380. The median is (401 + 402) / 2 = **401.5 µs**, also comfortable.

**The maximum.** **2380 µs.** Well over the budget. One run in eight.

**The minimum.** 395 µs. The typical spread is only 15 µs; the outlier is more than five times the typical value.

**What the outlier says.** Something rare is happening: the first call after a mode change, a cache that went cold, a flash wait state, a long message, a float conversion, or an interrupt that landed inside the window. The mean and the median told you nothing about it.

**What to do.** Find the cause by correlating the slow run with the input and the events around it. Then decide: fix it, split the work, or budget for it.

**What to report:** the maximum, the method, the number of runs and the load, never the average.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "period-jitter-guided",
        skill: "wcet-measurement",
        objective: "Compute peak-to-peak period jitter (guided).",
        prompt: `A task's output edge should repeat every 10.00 ms. A logic analyser measures five successive periods: 10.00, 10.03, 9.96, 10.07 and 9.98 ms. What is the peak-to-peak period jitter, in **microseconds**?`,
        unit: "µs",
        answer: 110,
        tolerance: 1,
        hints: [
          `Peak-to-peak jitter is the largest period minus the smallest.`,
          `The largest is 10.07 ms and the smallest is 9.96 ms.`,
          `10.07 − 9.96 = 0.11 ms. Convert to microseconds: multiply by 1000.`,
        ],
        solution: `Largest 10.07 ms, smallest 9.96 ms: the difference is 0.11 ms = **110 µs**. The mean period, about 10.01 ms, would have looked almost perfect and hidden it.`,
        solvedFeedback: `Right: 110 µs. Peak-to-peak jitter looks at the extremes, which is where a deadline is missed.`,
        misconceptions: [
          { value: 0.11, tolerance: 0.005, feedback: `0.11 is in milliseconds. The question asks for microseconds: multiply by 1000 to get 110.` },
          { value: 70, tolerance: 1, feedback: `70 µs is the largest deviation from the nominal 10.00 ms (10.07). Peak-to-peak is the whole spread, from the smallest to the largest: 10.07 − 9.96 = 110 µs.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "A pin toggle, a cycle counter and a high-water mark",
      intro: `Instrumenting a task on a Cortex-M3, M4 or M7 uses the cycle counter in the DWT unit and a spare GPIO. The M0 and M0+ have no cycle counter; use a hardware timer there.`,
      language: "c",
      code: `void timing_init(void) {
    CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
    DWT->CYCCNT = 0;
    DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;
}

static uint32_t wcet_cycles;

void control_step_timed(void) {
    GPIOA->BSRR = GPIO_PIN_5;
    uint32_t t0 = DWT->CYCCNT;
    control_step();
    uint32_t dt = DWT->CYCCNT - t0;
    GPIOA->BSRR = (uint32_t)GPIO_PIN_5 << 16;
    if (dt > wcet_cycles) wcet_cycles = dt;
}`,
      notes: [
        { lines: "1-4", text: `Switch on the trace block, clear the **cycle counter** and start it. It then counts processor clock cycles, so 1 µs is 168 cycles on a 168 MHz part.` },
        { lines: "7", text: `The **high-water mark**: the largest duration seen. It lives in RAM, so a debugger or a log can read it at the end of a long run.` },
        { lines: "10", text: `Set the spare pin high through the bit-set register, in one write, so the scope sees the start edge.` },
        { lines: "11-13", text: `Read the counter, run the code, read it again. Unsigned subtraction gives the right difference even if the counter wrapped once in between.` },
        { lines: "14", text: `The reset half of the same register drops the pin: the scope sees the end edge, and the pulse width is the elapsed time.` },
        { lines: "15", text: `Keep the maximum. Note that this is **elapsed** time: an interrupt that fired inside the window is included.` },
      ],
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "Reading the pin on a scope or analyser",
      body: `**Pulse width.** Trigger the scope on the rising edge and measure the width of the high pulse. Use the scope's **persistence** or infinite-persistence mode: every run is drawn on top of the last, and the right-hand edge smears out to show the full range. The far edge of the smear is the slowest run.

**Statistics.** Many scopes show the maximum, minimum and standard deviation of a measurement over thousands of captures. Read the maximum.

**Period jitter.** Trigger on one edge and look at where the **next** edge lands. The width of the blur on it is the period jitter.

**A logic analyser** records timestamps of every edge, so you can export them and compute the maximum, minimum and histogram afterwards, over a long capture.

Mind the **sample rate**. A 1 MS/s analyser cannot resolve a 100 µs step to better than 1 µs, and a scope with too slow a timebase misses short pulses. Choose a rate at least ten times finer than the resolution you need.

Run long enough to catch the rare slow case, and write down how long.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "wcet-with-margin",
        skill: "wcet-measurement",
        objective: "Turn a measured maximum into a stated worst-case figure with a margin.",
        prompt: `Over a long stress run the slowest execution of a control step was **2380 µs**. The team's rule is to claim the observed maximum plus a **25 %** margin. What worst-case execution time, in microseconds, goes into the response-time analysis?`,
        unit: "µs",
        answer: 2975,
        tolerance: 5,
        solution: `2380 × 1.25 = **2975 µs**. The claim is "measured maximum 2380 µs over the stated run, with a 25 % margin", not "proven bound". At a 10 ms period this task alone takes about 0.30 of the processor.`,
        solvedFeedback: `Right: 2975 µs, and the sentence around it matters as much as the number: how it was measured and what margin was added.`,
        misconceptions: [
          { value: 595, tolerance: 5, feedback: `595 µs is 25 % of the maximum. A margin of 25 % means adding that on top: 2380 + 595 = 2975 µs.` },
          { value: 2380, tolerance: 5, feedback: `2380 µs is the observed maximum before the margin. The margin is added on top, because the true worst case can be larger than what you happened to see.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Why the slow run hides, and how to phrase the claim",
      body: `The slowest run is rare for a reason. Hunt for these:

- **Data-dependent paths**: the longest message, the full buffer, the unusual input.
- **First-time costs**: the first call after a mode change, a cold instruction cache, lazy initialisation.
- **Memory effects**: flash wait states, cache misses, DMA stealing bus cycles.
- **Interrupts** landing inside the window, which is why elapsed time can exceed execution time.
- **Instrumentation itself**: the pin write and counter reads add a few cycles. Measure them and subtract, or note them.

Two traps. **Optimising the average** helps nothing if the worst case is unchanged. And a **debug build** is slower than the release build you will fly; always measure the build you ship.

Then phrase the result honestly:

> "Control step: maximum observed 2.38 ms over 10 hours with all interrupts and DMA active, measured by a GPIO and a scope. Claimed worst case 2.98 ms with 25 % margin. Not a proven bound."

That sentence names the figure, the run, the load, the method, the margin and its limit. It survives follow-up questions. "Deterministic, sub-millisecond" does not.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "measurement-claims",
        skill: "wcet-measurement",
        objective: "Judge statements about timing measurement.",
        prompt: `Select **every** correct statement.`,
        options: [
          { id: "a", text: "A measured maximum is a lower bound on the true worst-case execution time, not a proof of it.", correct: true, feedback: `The slowest path or input may never have been exercised. Hence the margin and the careful wording.` },
          { id: "b", text: "A pin toggle measures elapsed time, which includes any interrupt that fires inside the window.", correct: true, feedback: `Say which you measured. For pure execution time, account for or exclude the interrupt time.` },
          { id: "c", text: "The mean loop time is the best number to put in the response-time analysis.", correct: false, feedback: `The analysis needs the worst case. The mean is dominated by the typical runs and hides the tail.` },
          { id: "d", text: "Measure the debug build, which is easier to attach to, and quote the result for the shipped firmware.", correct: false, feedback: `A debug build runs different, usually slower, code. Measure the build you ship.` },
          { id: "e", text: "Static analysis can give a safe upper bound but is often pessimistic and needs an accurate processor model.", correct: true, feedback: `That is the trade: guaranteed but conservative, against measured but not guaranteed. Practice combines them.` },
        ],
        solvedFeedback: `Right: a measurement is a lower bound; a pin gives elapsed time; the analysis needs the maximum; measure the shipped build; static analysis is safe but pessimistic.`,
      },
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "best-timing-claim",
        skill: "wcet-measurement",
        objective: "Choose the claim you could defend in an interview.",
        prompt: `Which sentence about a control loop would hold up under follow-up questions?`,
        options: [
          { id: "a", text: "The loop is deterministic and sub-millisecond.", correct: false, feedback: `It names no figure, no method and no margin. The first follow-up, "how did you measure it?", has no answer.` },
          { id: "b", text: "The average loop time is 400 µs, so there is plenty of margin against a 1 ms deadline.", correct: false, feedback: `An average says nothing about the slowest run, which is what the deadline is tested against.` },
          { id: "c", text: "Maximum observed 0.62 ms over 8 hours under full interrupt and DMA load, measured with a pin and a scope on the release build; claimed 0.78 ms with 25 % margin; not a proven bound.", correct: true, feedback: `It gives the figure, the run, the load, the method, the build, the margin and its limit. Every follow-up has an answer.` },
          { id: "d", text: "A static analysis tool proved the loop meets 1 ms.", correct: false, feedback: `Only valid if you can name the tool, the processor model and the assumptions. Claimed without those, it invites questions you cannot answer.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "wcet-measurement-claim",
      intro: `Explain how you would measure the worst-case time and the jitter of a control task on a target, what the number does and does not prove, and how you would state it.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A spare pin and a cycle counter are the first tools when anything is slow; a high-water mark costs a few bytes and settles arguments.
- **Aerospace and UAV systems.** Timing budgets for control loops and bus handlers are evidenced by measured worst cases with their method, and avionics standards expect the method to be stated.
- **R&D and design.** Early measurements of a prototype decide whether a processor, a clock rate or a memory choice meets the budget.
- **Verification and interviews.** "How did you measure it?" follows every timing claim; a pin-and-scope method, a maximum, a margin and an honest limit is the answer.`,
    },
    {
      type: "recap",
      summary: `- Deadlines are tested against the slowest run, so measure the maximum, not the mean. Keep a high-water mark.
- A pin toggle or a cycle counter measures elapsed time, which includes interrupts inside the window; say which you measured.
- Jitter is the spread: peak-to-peak is the maximum minus the minimum, for execution time or for the period.
- A measured maximum is a lower bound on the true worst case; static analysis gives a safe, pessimistic upper bound. Aim tests at the longest paths and worst inputs, stress the system, and add a stated margin.
- A defensible claim names the figure, run length, load, method, build, margin and its limit.`,
      cards: [
        { id: "wc-1", front: "Why measure the maximum rather than the mean?", back: "A deadline is missed by the slowest run, which the mean hides. Keep a high-water mark over a long stress run and analyse the cause of any outlier." },
        { id: "wc-2", front: "What does a pin toggle on a scope measure, and what does it include?", back: "Elapsed time between the start and end edges, including any interrupt or higher-priority task that ran in the window. Account for that or measure with interrupts excluded." },
        { id: "wc-3", front: "Why is a measured maximum only a lower bound?", back: "The slowest path or input may not have been exercised. Design tests for the longest paths and worst inputs, run under stress, add a margin and state the limit; static analysis can give a safe upper bound." },
        { id: "wc-4", front: "How do you compute peak-to-peak jitter?", back: "The largest measured value minus the smallest, for the task's duration or for the period between successive output edges. The mean hides it." },
      ],
    },
  ],
};
