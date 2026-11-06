import type { Lesson } from "@/lib/content/schema";

export const silHilWhatEachProves: Lesson = {
  slug: "sil-hil-what-each-proves",
  moduleId: "verification",
  prerequisites: ["writing-a-trustworthy-test-case"],
  title: "SIL, HIL and what each one proves",
  summary: "Model, software, processor and hardware in the loop are four rungs of the same ladder. Learn what each proves and cannot prove, what a HIL rig is made of, and how to decide which bugs you catch where, so a review hears 'we tested the right thing at the right level' instead of 'we tested it'.",
  durationMinutes: 10,
  whyItMatters: "Automotive, avionics and medical programmes run HIL rigs around the clock, and 'what does HIL prove that bench testing cannot?' is a stock interview question for test roles. Knowing the levels lets you talk about test strategy, not just test execution.",
  objectives: [
    "Define MIL, SIL, PIL and HIL and say what artefact is real at each level.",
    "List the parts of a HIL rig and what its fault-insertion capability adds.",
    "Assign a bug class to the lowest test level that can catch it, and explain the limits of plant-model fidelity.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Terminology follows common automotive and aerospace practice (ISO 26262 part 6 verification methods, DO-178C test environments). Vendor rig names are not used.",
  },
  references: [
    { title: "ISO 26262-6 software unit and integration testing: test environments including model-, software-, processor- and hardware-in-the-loop", note: "The standard's own list of environments." },
    { title: "DO-178C section 6.4: test environments and the need for target-computer testing", note: "Why some tests must run on the real processor." },
  ],
  steps: [
    {
      type: "scenario",
      title: "A thousand green tests, one dead actuator",
      body: `A motor controller passes a thousand simulation tests: every control-law case, every fault case, nightly. On the first vehicle, the first time the motor stalls, the controller drives the output at 100 % until the fuse opens. The stall-detection logic was correct. The current-sense ADC channel was wired to the other phase, and no simulation had ever used the real ADC, the real wiring or the real timing.

Simulation proved the algorithm. It could not prove the I/O. That is the difference between software in the loop and hardware in the loop, and the reason both exist.`,
    },
    {
      type: "concept",
      title: "The four rungs",
      body: `Each level makes one more thing real and keeps the rest simulated:

| Level | What is real | What is simulated | Proves | Cannot prove |
|---|---|---|---|---|
| **MIL** (model in the loop) | The control model (Simulink, Python) | Everything else, incl. the plant | The algorithm's logic and tuning | Anything about code or hardware |
| **SIL** (software in the loop) | The generated or hand-written C, compiled for the PC | Plant, I/O, timing | Code matches the model; logic faults, numeric faults | Timing, memory, compiler-for-target behaviour, I/O |
| **PIL** (processor in the loop) | The C running on the real MCU, fed over a debug link | Plant, I/O | Target compiler, execution time, stack, fixed-point effects | I/O, electrical faults, real signals |
| **HIL** (hardware in the loop) | The real controller with its real I/O, connected electrically to a rig | The plant (motor, aircraft, patient) as a real-time model driving real signals | I/O wiring, timing under real interrupts, electrical faults, fault handling end to end | Plant behaviour the model does not include |

The scenario's bug (a mis-wired ADC channel) is invisible below HIL. A control-law tuning error is caught cheapest at MIL. A stack overflow appears at PIL. The skill is sending each bug class to the **lowest level that can catch it**, because cost and run time climb steeply up the ladder.

**What a HIL rig is made of.** A real-time computer running the plant model at a fixed step (often 1 kHz or faster); I/O boards that turn model values into real voltages, currents, PWM, CAN or ARINC frames and read the controller's outputs back; signal conditioning and load emulation (a motor emulator sinks real phase current); a **fault-insertion unit** that can open, short to ground or battery, or cross any wire on command; a breakout box for probing; and the test automation that scripts all of it. The controller under test cannot tell it is not in the vehicle, which is the point.`,
      deeper: {
        title: "Fidelity and the limits of HIL",
        body: `HIL proves the controller against the *model* of the plant. If the model omits a resonance, a sensor's temperature drift or the real motor's saturation, HIL passes and the vehicle does not. Model validation against measured plant data, and a final layer of real-plant testing (dyno, flight test, bench with the real sensor), close that gap. A HIL result is only as good as the model's validation evidence, and a good test report says so.`,
      },
    },
    {
      type: "example",
      title: "Worked example: where each bug would have been caught",
      body: `From a real-world style programme log, each defect and the lowest level that exposes it:

- Integrator wind-up on saturation → **MIL**: visible in the model with a saturated plant.
- Float-to-fixed conversion loses resolution at small errors → **PIL** (SIL on a PC uses the PC's arithmetic; PIL uses the target's).
- Control loop occasionally overruns its 1 ms slot when CAN traffic peaks → **PIL** for pure execution time, **HIL** when real CAN traffic is the trigger.
- Current-sense channel wired to the wrong phase → **HIL**: only real I/O carries the wiring.
- Open-circuit sensor read as a valid 0 → **HIL** with fault insertion: the FIU opens the wire and the logged response shows whether the fault was detected within the required time.
- Motor thermal model wrong by 30 % → **none of the above**; found on the dyno. Logged as a plant-model validation gap.

The report lists each level's coverage and its known blind spots. A reviewer trusts "HIL with fault insertion on all 42 sensor lines, plant model validated against dyno data to ±5 %" far more than "fully tested".`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "lowest-level-wiring",
        skill: "verification",
        objective: "Pick the lowest level that catches an I/O fault.",
        prompt: `A firmware bug: the ADC channel index for the current sensor is off by one. What is the **lowest** test level that can catch it?`,
        options: [
          { id: "a", text: "SIL: the code runs, so the wrong channel is read.", correct: false, feedback: `In SIL the ADC is a simulated function that returns whatever the harness provides; channel indexes are stubbed. The bug is invisible.` },
          { id: "b", text: "PIL: the real processor executes the real ADC driver.", correct: false, feedback: `PIL runs the code on the target but the inputs still come over a debug link; the real ADC pins are not driven by a real plant signal.` },
          { id: "c", text: "HIL: the rig drives a real current-sense voltage into the real pin and the wrong channel reads the wrong signal.", correct: true, feedback: `Yes. Only real I/O exercises channel mapping, wiring and signal conditioning. This is exactly the scenario's defect.` },
          { id: "d", text: "MIL: the model shows the current loop misbehaving.", correct: false, feedback: `The model has no ADC channels at all.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "hil-rig-parts",
        skill: "verification",
        objective: "Know what a HIL rig contains.",
        prompt: `Select **every** component of a typical HIL rig.`,
        options: [
          { id: "a", text: "A real-time computer running the plant model at a fixed step.", correct: true, feedback: `The plant must respond in real time to the controller's outputs.` },
          { id: "b", text: "I/O boards and signal conditioning that produce real voltages, currents, PWM and bus frames.", correct: true, feedback: `What makes the controller unable to tell it is on a rig.` },
          { id: "c", text: "A fault-insertion unit that can open, short or cross wires on command.", correct: true, feedback: `The part that lets fault-handling requirements be verified end to end.` },
          { id: "d", text: "The real motor and the real vehicle.", correct: false, feedback: `Those are the plant; HIL replaces them with a model and emulated loads. Real-plant tests are a separate, later layer.` },
          { id: "e", text: "Test automation that scripts stimuli, captures responses and produces the log.", correct: true, feedback: `A rig without automation is a very expensive bench.` },
        ],
        solvedFeedback: `Right. Real-time target, I/O and conditioning, fault insertion, automation; the real plant is what HIL stands in for.`,
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "order",
        id: "test-levels-cost",
        skill: "verification",
        objective: "Order the levels by what becomes real.",
        prompt: `Order the levels from the least real (most simulated) to the most real.`,
        items: [
          { id: "mil", text: "Model in the loop", why: "Only the control model is real." },
          { id: "sil", text: "Software in the loop", why: "The code is real, compiled for a PC." },
          { id: "pil", text: "Processor in the loop", why: "The code runs on the real target processor." },
          { id: "hil", text: "Hardware in the loop", why: "The whole controller with real I/O; only the plant is simulated." },
          { id: "plant", text: "Real plant (dyno, flight test, bench with the real sensor)", why: "Nothing simulated; the final layer that validates the plant model." },
        ],
        correctOrder: ["mil", "sil", "pil", "hil", "plant"],
        solvedFeedback: `Correct. Each rung makes one more thing real; cost and run time climb with it.`,
      },
    },
    {
      type: "interview",
      questionId: "sil-vs-hil",
      intro: `Give the four definitions in one sentence each, name what is in a rig, give one bug class per level, and end with the fidelity caveat. That answer sounds like strategy, not vocabulary.`,
    },
    {
      type: "figure",
      title: "What a HIL rig actually contains",
      diagram: "hil-architecture",
      alt: "Hardware in the loop architecture: a real time target running the plant model drives analogue, bus and fault insertion I/O into the real device under test, orchestrated by a host PC.",
      caption: `The device under test is real; everything it senses comes from a model running on a real-time target through analogue, bus and fault-insertion I/O. HIL proves the box against the model; it does not prove the model.`,
    },
    {
      type: "recap",
      summary: `- MIL: model real. SIL: code real on a PC. PIL: code real on the target. HIL: controller and I/O real, plant simulated in real time. Then the real plant.
- Each bug class goes to the lowest level that can catch it: tuning at MIL, logic at SIL, timing and fixed-point at PIL, wiring, I/O and fault handling at HIL.
- A HIL rig: real-time computer, I/O and signal conditioning, load emulation, fault-insertion unit, breakout box, automation.
- HIL proves the controller against the plant model; model validation and real-plant tests close the gap, and the report says how.`,
      cards: [
        { id: "hil-1", front: "MIL, SIL, PIL, HIL: what is real at each?", back: "MIL the model; SIL the code on a PC; PIL the code on the target MCU; HIL the whole controller with real I/O, with the plant simulated in real time." },
        { id: "hil-2", front: "What does HIL prove that SIL cannot?", back: "I/O wiring and channel mapping, timing under real interrupts and bus traffic, electrical faults and end-to-end fault handling via fault insertion." },
        { id: "hil-3", front: "Parts of a HIL rig?", back: "Real-time computer with the plant model, I/O boards and signal conditioning, load emulation, fault-insertion unit, breakout box, test automation." },
        { id: "hil-4", front: "Limit of a HIL result?", back: "It is only as good as the plant model's validation; omitted plant behaviour passes HIL and fails in the field, so real-plant tests remain." },
      ],
    },
  ],
};
