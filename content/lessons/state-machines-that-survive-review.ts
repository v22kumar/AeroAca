import type { Lesson } from "@/lib/content/schema";

export const stateMachinesThatSurviveReview: Lesson = {
  slug: "state-machines-that-survive-review",
  moduleId: "embedded-c",
  prerequisites: ["c-foundations-for-firmware", "capacitors-inductors-rc-and-filters"],
  title: "State machines that survive review",
  summary: "Almost everything a microcontroller does is a state machine: a button, a protocol parser, a motor sequence, a connection. Learn to draw one, write it as an enum and a switch with explicit transitions, keep time with a tick instead of delays, and test it on your PC with a scripted input before it ever sees hardware.",
  durationMinutes: 11,
  whyItMatters: "Firmware written as a tangle of flags and delays works until the second feature. An explicit state machine is what a reviewer can read, what a test can drive, and what an interviewer asks you to sketch on the whiteboard in the first technical round.",
  objectives: [
    "Identify the states, events and transitions of a behaviour and draw them before writing code.",
    "Implement a state machine in C as an enum, a struct of context and a switch that handles every event in every state, with entry and exit actions where needed.",
    "Replace blocking delays with a tick-driven design so several machines share one loop and the watchdog is refreshed on time.",
    "Write a scripted test that feeds events and checks states and outputs, including the transitions that must not happen.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Standard embedded-software practice (Samek, Gomaa). The debouncer in the lab was run on gcc and clang and its transition trace is the expected output.",
  },
  references: [
    { title: "Miro Samek, Practical UML Statecharts in C/C++, 2nd edition, chapters 1 to 3", note: "Why explicit state machines; the switch-based implementation and its limits; hierarchical machines." },
    { title: "Hassan Gomaa, Real-Time Software Design for Embedded Systems, state machine modelling chapters", note: "States, events, guards, actions; deriving machines from requirements." },
    { title: "Lesson: Capacitors, inductors, the RC time constant and the filters they make", note: "Why the button bounced and why hysteresis or firmware debounce fixes it." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The flag that meant three things",
      body: `A door-lock controller has a global \`bool busy\`. It is set when the motor starts, cleared when it stops, also set during a firmware update, and checked in eleven places. A bug report: the lock sometimes refuses commands for ever. Two engineers spend a day with a debugger and find that a failed update left \`busy\` set because the error path forgot to clear it; another path then saw "busy" and never ran the motor.

Rewritten as a five-state machine with explicit transitions (IDLE, LOCKING, UNLOCKING, UPDATING, FAULT), the same controller has no \`busy\` flag, one place that changes state, and a table of what every event does in every state. The error path cannot "forget" anything because the transition out of UPDATING is written down and tested. This lesson is that rewrite.`,
    },
    {
      type: "concept",
      title: "States, events, transitions: draw first",
      body: `A **state** is a mode the system is in that changes how it responds. An **event** is something that happens: a button edge, a byte arriving, a timer expiring, a command. A **transition** says: in this state, on this event, do these actions and go to that state. A **guard** is a condition on a transition (on BYTE, if it is the terminator...). Entry and exit **actions** run when a state is entered or left (start the motor on entering LOCKING; stop it on leaving).

Draw it before coding. Circles for states, arrows for transitions labelled \`event [guard] / action\`. Then fill the **transition table**: states down the side, events across the top, each cell either a transition or "ignore" (or "impossible, log it"). The empty cells are the design review: "what happens if a STOP command arrives while UPDATING?" is a question the table forces you to answer and the flag version never asked.

Two smells that say a state machine is missing:

- **Flags that are read in many places and written in several.** Each flag is a hidden state variable; two flags are four states, three are eight, and most combinations are meaningless but reachable.
- **Delays in the control flow** (\`HAL_Delay(50)\` between steps). A delay is a state ("waiting for the motor to settle") written as a blocking call; during it nothing else runs, the watchdog starves, and the sequence cannot be interrupted.

The RC lesson's button is the smallest real example: RELEASED, MAYBE_PRESSED, PRESSED, MAYBE_RELEASED; the event is the sampled pin level every tick; the guard is "N consecutive agreeing samples".`,
      deeper: {
        title: "Hierarchical states and when switch stops scaling",
        body: `When many states share behaviour (every state except FAULT handles the RESET command the same way), a flat switch repeats code. Hierarchical state machines nest states so the common handling is written once in a parent state; Samek's book is the standard treatment and his framework (QP) implements it. For a machine with under ten states and a handful of events, the flat switch below is the right tool and the one interviewers expect you to write from memory.`,
      },
    },
    {
      type: "concept",
      title: "The C pattern: enum, context, switch",
      body: `\`\`\`c
typedef enum { S_IDLE, S_LOCKING, S_UNLOCKING, S_UPDATING, S_FAULT } lock_state_t;
typedef enum { EV_TICK, EV_CMD_LOCK, EV_CMD_UNLOCK, EV_MOTOR_DONE, EV_UPDATE_START, EV_UPDATE_END, EV_UPDATE_FAIL } lock_event_t;

typedef struct {
    lock_state_t state;
    uint32_t     entered_ms;     /* when the current state was entered, for timeouts */
    uint8_t      retries;
} lock_t;

static void enter(lock_t *m, lock_state_t next, uint32_t now_ms) {
    /* exit actions of the old state, entry actions of the new one, in one place */
    if (m->state == S_LOCKING || m->state == S_UNLOCKING) motor_stop();
    m->state = next;
    m->entered_ms = now_ms;
    if (next == S_LOCKING) motor_run(DIR_LOCK);
    if (next == S_UNLOCKING) motor_run(DIR_UNLOCK);
    if (next == S_FAULT) alarm_on();
}

void lock_step(lock_t *m, lock_event_t ev, uint32_t now_ms) {
    switch (m->state) {
    case S_IDLE:
        if (ev == EV_CMD_LOCK)     enter(m, S_LOCKING, now_ms);
        else if (ev == EV_CMD_UNLOCK) enter(m, S_UNLOCKING, now_ms);
        else if (ev == EV_UPDATE_START) enter(m, S_UPDATING, now_ms);
        break;                                   /* every other event: ignored, by design */
    case S_LOCKING:
    case S_UNLOCKING:
        if (ev == EV_MOTOR_DONE) enter(m, S_IDLE, now_ms);
        else if (ev == EV_TICK && now_ms - m->entered_ms > 3000u) enter(m, S_FAULT, now_ms);  /* timeout */
        break;
    case S_UPDATING:
        if (ev == EV_UPDATE_END || ev == EV_UPDATE_FAIL) enter(m, S_IDLE, now_ms);  /* the path the flag forgot */
        break;
    case S_FAULT:
        if (ev == EV_CMD_UNLOCK && m->retries++ < 3) enter(m, S_UNLOCKING, now_ms);
        break;
    }
}
\`\`\`

Four rules make this reviewable: **one function changes the state** (\`enter\`), so entry and exit actions cannot be skipped; **every state handles every event** (explicitly or by falling through to "ignored"), so the table and the code match; **time is an event** (\`EV_TICK\` with \`now_ms\`), so timeouts need no delay and the unsigned subtraction survives the wrap (the fixed-width lesson); and **the context is a struct the caller owns**, so two locks are two structs and the machine is testable on a PC with no hardware.

The hardware calls (\`motor_run\`, \`alarm_on\`) sit behind a small interface so the host test can replace them with functions that record what was called: the testable seam from the pointers lesson.`,
    },
    {
      type: "concept",
      title: "Ticks, not delays: several machines, one loop",
      body: `The main loop becomes:

\`\`\`c
for (;;) {
    uint32_t now = tick_ms();                       /* from SysTick */
    while (uart_rx_get(&b)) parser_step(&parser, b, now);
    debounce_step(&button, gpio_read(BTN), now);
    lock_step(&lock, button_pressed(&button) ? EV_CMD_LOCK : EV_TICK, now);
    logger_step(&log, now);
    iwdg_refresh();                                 /* only here, after every step ran */
}
\`\`\`

No step blocks. A machine that needs to wait records \`entered_ms\` and checks elapsed time on the next tick. The loop period is bounded by the longest single step (microseconds to a millisecond), so the watchdog can be set tight (the watchdog lesson) and a stuck step is caught. A periodic job (log once a second) is itself a two-state machine: WAITING until a second has elapsed, then EMIT and back.

This is also the structure an RTOS replaces with tasks (the RTOS module): each machine becomes a task that blocks on its event queue. The machines do not change; only the loop does. Writing them as machines first is why the move to an RTOS later is cheap.`,
    },
    {
      type: "example",
      title: "Worked example: a line parser for the ICD log format",
      body: `The portfolio's log line is \`AA,<ms>,<temp>,<alarm>,<fault>\\n\`. A parser that accepts bytes one at a time:

| State | Event | Action | Next |
|---|---|---|---|
| WAIT_A1 | byte 'A' | — | WAIT_A2 |
| WAIT_A1 | other | count garbage | WAIT_A1 |
| WAIT_A2 | byte 'A' | start a new line buffer | FIELDS |
| WAIT_A2 | other | — | WAIT_A1 |
| FIELDS | byte ',' | close field, field++ | FIELDS (or ERROR if field > 4) |
| FIELDS | digit, '-' or letter | append (ERROR if the buffer is full) | FIELDS |
| FIELDS | '\\n' | if field == 4: deliver the line | WAIT_A1 |
| FIELDS | other | count garbage | WAIT_A1 |
| ERROR | '\\n' | count a bad line | WAIT_A1 |
| ERROR | other | — | ERROR |

Three things the table made explicit that a \`strtok\` loop would not: a line that is too long cannot overrun the buffer (the FULL guard), a line with the wrong number of fields is counted rather than half-delivered, and resynchronisation after garbage happens automatically on the next "AA". The host test feeds the parser a good line, a truncated line, a line with six fields and 300 bytes of noise, and checks the delivered count, the bad-line count and the final state. The lab below does the same for the debouncer, with the trace of every transition as the expected output.`,
    },
    {
      type: "lab",
      title: "Run it yourself: a debouncer as a state machine, with its transition trace",
      lab: "c-debounce",
      body: `The RC lesson's bouncing button, debounced in firmware as a four-state machine ticked every 5 ms. The program feeds fifteen raw samples (a bouncy press, a hold, a bouncy release) and prints the state after every tick and the single PRESS event. Follow the trace against the state diagram: the two bounces at 5 ms and 50 ms are absorbed by the MAYBE states, and exactly one press is counted.`,
      tryNext: `Change \`STABLE_SAMPLES\` to 2 and predict which tick emits PRESS. Then add a fifth state, HELD, entered after 500 ms in PRESSED, emitting a HOLD event once; decide in the table what a release during HELD does before you write the case.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "sm-design-order",
        skill: "state-machines",
        objective: "Order the steps of designing a state machine.",
        prompt: `Put the steps of turning a behaviour into a reviewable state machine in order.`,
        items: [
          { id: "a", text: "List the states (modes that change how the system responds) and the events (what can happen)", why: "States and events are the axes of everything that follows." },
          { id: "b", text: "Fill the transition table: every state × every event, including the cells that are 'ignored'", why: "The table forces the questions the flag version never asked." },
          { id: "c", text: "Write the enum, the context struct and one function that performs every state change with its entry and exit actions", why: "One place changes state, so actions cannot be skipped." },
          { id: "d", text: "Drive it from a tick with time as an event, not delays, and put the hardware behind a seam", why: "Several machines share one loop; the watchdog is refreshed; the host test can replace the hardware." },
          { id: "e", text: "Write a scripted host test that feeds events and checks states, outputs and the transitions that must not happen", why: "The machine is proven before it meets hardware; the test is the table made executable." },
        ],
        correctOrder: ["a", "b", "c", "d", "e"],
        solvedFeedback: `Right: axes, table, one state-changing function, tick-driven with a seam, scripted test.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "sm-flags-smell",
        skill: "state-machines",
        objective: "Recognise a hidden state machine.",
        prompt: `A module has \`bool connected\`, \`bool authenticating\` and \`bool error\`, read and written across six functions. What is the engineering problem?`,
        options: [
          { id: "a", text: "Three flags are eight combinations, most of them meaningless but reachable; nobody has written down what each event does in each combination, so error paths leave inconsistent flags. One enum of the real states with a transition table replaces them.", correct: true, feedback: `Yes. The flags are a state machine nobody drew. The scenario's stuck 'busy' flag is the same fault.` },
          { id: "b", text: "Booleans use too much RAM", correct: false, feedback: `Three bytes are not the problem; three independent variables that must agree are.` },
          { id: "c", text: "Nothing: flags are the normal way to track status", correct: false, feedback: `For one independent fact a flag is fine. Three flags describing one connection's mode are a state machine written badly.` },
          { id: "d", text: "The flags should be volatile", correct: false, feedback: `volatile is about interrupts and hardware, not about the design problem of combinations that should not exist.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "sm-rules",
        skill: "state-machines",
        objective: "Apply the implementation rules.",
        prompt: `Select **every** correct statement about the C pattern in this lesson.`,
        options: [
          { id: "a", text: "A single \`enter()\` function that performs exit and entry actions means no transition can forget to stop the motor.", correct: true, feedback: `Entry and exit actions live in one place; the scenario's forgotten clear becomes impossible.` },
          { id: "b", text: "Timeouts are implemented by comparing \`now_ms - entered_ms\` on a tick event, which also survives the 32-bit wrap.", correct: true, feedback: `Time as an event; unsigned subtraction from the fixed-width lesson.` },
          { id: "c", text: "A \`HAL_Delay(3000)\` inside the LOCKING case is an acceptable way to implement the motor timeout.", correct: false, feedback: `It blocks every other machine and starves the watchdog for three seconds. The timeout is a tick-driven check.` },
          { id: "d", text: "Events a state does not handle should be left out of the code so the switch stays short.", correct: false, feedback: `They should be explicitly ignored (or logged as impossible) so the table and the code agree; a reviewer must see the decision.` },
          { id: "e", text: "Keeping the hardware calls behind a small interface lets the machine be tested on a PC with recorded calls instead of a motor.", correct: true, feedback: `The testable seam; the lab and the portfolio tests both use it.` },
        ],
        solvedFeedback: `Right. One state-changing function, time as an event, no delays, explicit ignores, and a seam for the host test.`,
      },
    },
    {
      type: "interview",
      questionId: "design-a-state-machine",
      intro: `Draw it aloud: states, events, the table, then the C skeleton; mention the tick and the test.`,
    },
    {
      type: "figure",
      title: "The debounce machine as a diagram",
      diagram: "state-machine-debounce",
      alt: "Four state debounce machine with released, maybe pressed, pressed and maybe released states and transitions on sampled input with a four sample confirmation.",
      caption: `Each tick reads the input once and follows at most one arrow. A bounce sends the machine back without an event; only four consistent samples confirm a press or a release.`,
    },
    {
      type: "recap",
      summary: `- States are modes; events are what happens; transitions are event [guard] / action → state. Draw the diagram and fill the full table (every state × every event) before coding.
- Smells: flags read in many places and written in several; blocking delays in control flow.
- C pattern: enum of states, enum of events, context struct the caller owns, one enter() for exit/entry actions, switch over states handling every event, time as an EV_TICK with now_ms (wrap-safe subtraction).
- Tick-driven main loop: no step blocks; watchdog refreshed after every step; the same machines become RTOS tasks later. Hardware behind a seam so a host test can drive the machine with scripted events.`,
      cards: [
        { id: "sm-1", front: "Why is a set of boolean flags a smell?", back: "n flags are 2ⁿ combinations, most meaningless but reachable, with no table of what each event does in each. Replace with one enum of real states and a transition table; error paths then cannot leave the flags inconsistent." },
        { id: "sm-2", front: "What does the single enter() function buy?", back: "Exit actions of the old state and entry actions of the new one happen in one place for every transition, so no path can forget to stop a motor or clear an alarm." },
        { id: "sm-3", front: "How is a timeout done without a delay?", back: "Record entered_ms on entry; on each EV_TICK test now_ms - entered_ms > limit (unsigned, wrap-safe). The loop never blocks and the watchdog is refreshed after every step." },
        { id: "sm-4", front: "How do you test a state machine before hardware?", back: "Keep hardware calls behind a small interface, replace them with recording stubs on the PC, feed scripted events (including the ones that must be ignored) and check the state, the outputs and the counters; the transition table becomes the test list." },
      ],
    },
  ],
};
