import type { Lesson } from "@/lib/content/schema";

export const hilArchitectureAndBenchDesign: Lesson = {
  slug: "hil-architecture-and-bench-design",
  moduleId: "hil-fault",
  format: "arc",
  prerequisites: ["sil-hil-what-each-proves", "interface-control-and-integration-faults"],
  title: "HIL architecture and bench design: what is real, what is simulated, what is safe",
  summary: "Draw a hardware-in-the-loop rig from its four parts, decide from an interface control document what a bench needs, and plan the instruments, the electronic load and the safety interlocks. Every example is synthetic and every rig described is an illustration, not a product.",
  durationMinutes: 16,
  whyItMatters: "Validation and integration roles ask 'describe the rig you used and say what was simulated'. A candidate who can draw the rig, name what each part does and say what it cannot prove sounds like someone who has used one. A candidate who cannot is easy to spot.",
  objectives: [
    "Draw a HIL rig and name its four parts: real-time target with the plant model, I/O, fault insertion, and the host that runs the tests.",
    "Compare MIL, SIL, PIL and HIL by what is real at each level and what each cannot prove.",
    "Turn the rows of an interface control document into a list of bench resources: sources, loads, bus interfaces and measurement points.",
    "Plan interlocks and limits so a test cannot damage the unit under test or hurt the person running it.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Terminology follows common aerospace and automotive practice (model, software, processor and hardware in the loop; fault insertion; interface control documents). The rigs, signals, numbers and latencies are synthetic and invented for teaching; no vendor product, employer rig or real programme is described. The lesson does not claim the learner has built or operated a HIL rig: the portfolio work in this academy is simulated.",
  },
  references: [
    { title: "ISO 26262-6, test environments for software verification", note: "Lists model, software, processor and hardware-in-the-loop environments." },
    { title: "DO-178C section 6.4, test environments", note: "Why some tests must run on the target computer, and what a test environment must be shown to represent." },
    { title: "Lesson: SIL, HIL and what each one proves", note: "The ladder this lesson builds on." },
    { title: "Lesson: Interface control and integration faults", note: "The ICD read as a source of test cases." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The failover that was only tested by pulling a cable",
      body: `A flight-control team proves channel failover on a bench like this: run the system, walk up to the rack, pull the connector from channel B, and watch channel A take over. It works every time. The test is signed off.

Months later, on a different rig, a channel B card develops a fault and does not go quiet. It keeps transmitting nonsense on the bus, a **babbling** node. Channel A never sees a clean silence to react to, and the failover logic has never run on this input.

Nobody had simulated a channel that talks wrongly instead of stopping. The bench could only do one thing: pull a cable.

A good bench is designed to make **many kinds** of failure repeatable, safe and logged. This lesson is how that is drawn.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Fooling the box into believing it is on an aircraft",
      body: `A flight computer has no idea whether it is on an aircraft or on a bench. All it sees is electrical signals: sensor voltages, bus messages, discrete lines. If the bench produces the **same signals** an aircraft would, the box behaves as if it is flying.

Think of a flight simulator for pilots. The pilot is real, but the window, the motion and the instruments are produced by a computer. The pilot reacts to what is shown.

A hardware-in-the-loop rig is that idea for the box. The **plant**, meaning the aircraft, its sensors and its actuators, is a program. The program computes what a sensor would read, and hardware turns that number into a real voltage on a real wire. The box answers with its own outputs, which the rig reads back into the program.

Because it is a program, you can do things no aircraft allows: fly the same manoeuvre a thousand times, break a sensor on purpose, and never risk a crash.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The four rungs, and the four parts of a rig",
      body: `Each test level makes one more thing real. Choose the **lowest** level that can catch the bug you are afraid of.

| Level | Real | Simulated |
|---|---|---|
| MIL (model in the loop) | the control model | everything else |
| SIL (software in the loop) | the code, on a PC | plant, I/O, timing |
| PIL (processor in the loop) | the code, on the real chip | plant, I/O |
| HIL (hardware in the loop) | the whole unit, with real I/O | the plant only |

A HIL rig has four parts:

- **Real-time target.** A computer that runs the **plant model** at a fixed step, such as every millisecond, without missing one.
- **I/O.** Boards that turn model values into real voltages, bus frames and discretes, and read the unit's outputs back.
- **Fault insertion.** Switches that open, short or corrupt a signal on command.
- **Host.** The PC that starts scenarios, injects faults, records everything and decides pass or fail.

The unit under test sits between the I/O and the fault insertion. It is the one real thing.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "One rig, drawn once",
      diagram: "hil-architecture",
      alt: "Block diagram of a hardware-in-the-loop rig: a host PC for test automation, a real-time target running the plant model, analogue and digital bus I/O, a fault insertion stage, and the real device under test.",
      caption: "The host automates and records; the real-time target runs the plant; I/O and fault insertion sit between the model and the real device under test.",
      body: `Trace one sensor: the model computes a value, the analogue I/O makes a voltage, fault insertion may open or corrupt it, and the unit reads it. Then trace one output the other way.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "hil-real-guided",
        skill: "hil-bench",
        objective: "Say what is real and what is simulated on a HIL rig (guided).",
        prompt: `On a hardware-in-the-loop rig for a flight computer, which statement is correct?`,
        hints: [
          `The name says it: the hardware is in the loop. Which hardware is it?`,
          `The unit under test is the thing being judged, so it cannot be a model.`,
          `Something must pretend to be the aircraft. Is that real or computed?`,
        ],
        options: [
          { id: "a", text: "The flight computer and its real I/O are real; the aircraft, its sensors and its actuators are a real-time model.", correct: true, feedback: `Right. HIL keeps the unit and its electrical interfaces real and simulates the plant. That is why it finds wiring, timing and electrical faults that SIL cannot.` },
          { id: "b", text: "The flight computer's code runs on a PC; everything else is real.", correct: false, feedback: `That is closer to software in the loop, and reversed: on HIL the real unit is kept and the plant is simulated.` },
          { id: "c", text: "Everything is simulated, including the flight computer, but faster than real time.", correct: false, feedback: `That is model in the loop. HIL needs the real unit and runs the plant in real time so the unit's timing is honest.` },
          { id: "d", text: "The plant is real and only the faults are simulated.", correct: false, feedback: `A real plant would be a flight test or an iron bird. HIL exists so that the plant can be a model that you control and break safely.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "From the interface control document to a bench list",
      body: `A bench is not guessed. It is read off the **interface control document** (ICD), the agreed list of every signal that crosses the unit's boundary.

For each ICD row, write down:

- **What the unit expects.** A voltage range, a bus message and its rate, a discrete that is active low.
- **Which bench resource provides it.** A programmable supply, an analogue output, a 1553 or ARINC 429 card, a discrete with the right pull-up.
- **What the unit drives.** If it switches a heavy load, the bench needs an **electronic load** that sinks a set current, not an open wire.
- **Where you will measure.** A breakout point for a scope or a logic analyser, and a record of which is which.

Count the rows by type and you have the shopping list: so many analogue channels, so many discretes, so many bus interfaces, plus power.

Then add the rows the ICD does not contain: the **test-only** ones, such as the fault insertion points, a reset line, a debug port and the logging link. A bench that can only reproduce the ICD can only show normal operation.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: five ICD rows to a bench list",
      body: `A synthetic **LRU**, a small display and sensor unit, has this interface (invented for teaching):

| ICD row | Signal | Direction | Kind |
|---|---|---|---|
| 1 | +28 V supply | in | power, up to 2 A |
| 2 | Pressure sensor | in | analogue, 0 to 5 V |
| 3 | Gear-down switch | in | discrete, closed to ground = true |
| 4 | Attitude data | in | ARINC 429 receive, 12.5 kbit/s |
| 5 | Warning lamp | out | discrete, drives 28 V at 0.3 A |

**Bench resource for each row:**

1. A programmable supply, 28 V, current-limited to 3 A, with a switch to cut it.
2. One analogue output channel from the model, 0 to 5 V.
3. One discrete channel that **sinks to ground** on true and is **open** on false. A 5 V logic output would be the wrong kind.
4. One ARINC 429 transmit channel at the right speed.
5. An electronic load set to 0.3 A at 28 V, with a voltmeter on the lamp line.

**Added rows, not in the ICD:** a fault insertion on rows 2, 3 and 4, a test point on row 5, and a log of the unit's serial console.

Count: **five** ICD resources plus three insertion points. The ICD told us what normal looks like; the extra rows let us make it abnormal.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "apply",
      title: "The bench around the unit: instruments and automation",
      diagram: "test-bench-automation",
      alt: "Diagram of an automated test bench: a PC running pytest, PyVISA and pyserial controls a bench supply, an oscilloscope and a multimeter or load, around the device under test with a serial console and power connection.",
      caption: "The PC drives the instruments and the unit, and records what happened. The supply, the scope and the load are programmable, so the test can set a condition and measure its effect without a person at the rack.",
      body: `This is the same idea as the rig, one level down: the instruments are the I/O, the PC is the host. Find the supply: its limit is the first safety feature.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "bench-interlocks",
        skill: "hil-bench",
        objective: "Recognise real safety interlocks on a bench.",
        prompt: `A bench powers a unit from a programmable supply and a lamp circuit from an electronic load. Select **every** item that is a real interlock or limit, something the bench enforces whether or not the operator remembers.`,
        options: [
          { id: "a", text: "A current limit on the supply, set above normal draw and below the cable's rating.", correct: true, feedback: `Yes. It caps the damage of a short whatever the test script does.` },
          { id: "b", text: "A hardware emergency stop that opens the supply contactor, wired independently of the PC.", correct: true, feedback: `Yes. It still works if the software hangs. An emergency stop that depends on the test PC is not an interlock.` },
          { id: "c", text: "An over-temperature trip on the electronic load that cuts its input.", correct: true, feedback: `Yes. The bench protects the load and the person standing next to it by itself.` },
          { id: "d", text: "A line in the procedure saying 'be careful with the supply'.", correct: false, feedback: `A reminder is not an interlock. It depends on memory and attention, which is exactly what fails at the end of a long day.` },
        ],
        solvedFeedback: `Right: limits and trips that act on their own, independent of the script and of the operator.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What the rig cannot tell you, and what it adds",
      body: `Three limits to say aloud in a review.

**Model fidelity.** HIL proves the unit against the **model** of the aircraft. If the model leaves out a resonance or a sensor's drift, HIL passes and the aircraft does not. The model is validated against real data, and the HIL result is quoted with that caveat.

**Added delay.** The model runs in steps, and the I/O converts values both ways. All of that is delay the real aircraft does not have. A control loop with little margin can look worse on the rig than in flight, or hide a problem. The delay is measured and written down.

**Test-only wiring.** Fault insertion and breakout points are extra circuit. A fault insertion switch that adds capacitance to a fast bus can create a fault of its own.

Add one more limit of honesty: use the right verb. "I **used** a rig to run failover tests" and "I **designed** a rig" are different claims. Say the one you did.

A good bench report names the rig, the model version, the unit's software baseline and the measured loop delay, so the result can be repeated.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "numeric",
        id: "hil-loop-delay",
        skill: "hil-bench",
        objective: "Add up the delay a HIL rig puts in a control loop.",
        prompt: `A rig runs its plant model every **1.0 ms**. Converting a model value to an output voltage takes **0.2 ms**, and reading an input voltage back into the model takes **0.2 ms**. In the worst case, how much delay in milliseconds does the rig add between the unit's output changing and the model reacting?`,
        unit: "ms",
        answer: 1.4,
        tolerance: 0.05,
        solution: `Worst case, the unit's output changes just after the model has read its inputs, so it waits a full model step (**1.0 ms**) to be sampled, plus **0.2 ms** to read the input back, and the reaction takes **0.2 ms** to appear on the output: 1.0 + 0.2 + 0.2 = **1.4 ms**. For a control loop that runs every 5 ms, that is more than a quarter of its period, which is why the delay must be measured and reported.`,
        solvedFeedback: `Right: 1.4 ms. The rig is not free: it adds delay the aircraft does not have, and the result must say so.`,
        misconceptions: [
          { value: 1.0, tolerance: 0.05, feedback: `That counts only the model step. The conversion into and out of the real world adds 0.2 ms each way: 1.0 + 0.2 + 0.2 = 1.4 ms.` },
          { value: 0.4, tolerance: 0.05, feedback: `That counts only the two I/O conversions. A change can also wait up to a full model step before the model samples it, so add 1.0 ms: 1.4 ms.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "hil-rig-describe-and-limits",
      intro: `Describe a HIL rig you have used or studied, say what was real and what was simulated, and state what it could not prove.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A driver or a loop that is first run against a simulated bench interface can later be pointed at real hardware with only the bottom layer changed.
- **Aerospace and UAV systems.** Integration of a flight computer, a payload or a bus card is done on a rig built from the ICD; the bench list from this lesson is the first page of the plan.
- **R&D and design.** Designing a unit well means designing it testable: test points, a reset line and a debug port are decisions made in the schematic.
- **Verification and interviews.** "What did the rig simulate, what was real, and what could it not show?" is a standard question; the four parts, the model-fidelity limit and the loop delay are the answer.`,
    },
    {
      type: "recap",
      summary: `- HIL keeps the unit and its real I/O real and simulates the plant in real time; MIL, SIL and PIL make less real and each catches bugs more cheaply.
- A rig has four parts: real-time target with the plant model, I/O, fault insertion, and a host that automates and records.
- A bench is read from the ICD: every row gives a source, a load, a bus interface or a measurement; add the test-only rows the ICD lacks.
- Interlocks and limits must act on their own: supply current limit, hardware emergency stop, load over-temperature trip.
- The rig adds delay and is only as good as its model; say what you used or built and what it could not show.`,
      cards: [
        { id: "hilarch-1", front: "What are the four parts of a HIL rig?", back: "A real-time target running the plant model, I/O that makes real signals and reads the unit's outputs, fault insertion that opens, shorts or corrupts signals, and a host that automates, injects and records." },
        { id: "hilarch-2", front: "How do you size a bench from an ICD?", back: "Go row by row: for each signal record what the unit expects, which bench resource provides it, what the unit drives (an electronic load), and where you measure. Count by type, then add the test-only rows: fault insertion, reset, debug, logging." },
        { id: "hilarch-3", front: "What is a real interlock?", back: "A limit or trip that acts on its own, independent of the script and the operator: a supply current limit, a hardware emergency stop wired independently of the PC, an over-temperature trip on the load." },
        { id: "hilarch-4", front: "Name two limits of HIL results.", back: "Model fidelity (the unit is proven against the model, not the aircraft) and added loop delay from the model step and the I/O conversions, which must be measured and reported." },
      ],
    },
  ],
};
