import type { Lesson } from "@/lib/content/schema";

export const architectureOfATestFramework: Lesson = {
  slug: "architecture-of-a-test-framework",
  moduleId: "python-advanced",
  format: "arc",
  prerequisites: ["pytest-for-hardware-tests", "logs-to-evidence"],
  title: "The architecture of a test framework: draw it, run it, measure what it saves",
  summary: "The layers of a hardware test framework, from device driver to report; a small standard-library framework run in a lab, with a simulated device and an honest PASS, FAIL, ERROR and SKIP; reproducible runs; and how to state the time an automation saved without inflating it.",
  durationMinutes: 18,
  whyItMatters: "'Architected an automation suite' is the most common line on a test engineer's CV, and 'draw it' and 'how did you measure the saving' are the two most common follow-ups. This lesson is the drawing and the arithmetic, and a way to phrase what you did without claiming more.",
  objectives: [
    "Draw the layers of a test framework (driver, protocol, test cases, reporting, configuration) and say what each layer may and may not do.",
    "Explain how a simulated driver lets the same test cases run with and without hardware.",
    "Distinguish PASS, FAIL, ERROR and SKIP, and say why a retry must be counted, not hidden.",
    "Compute the time an automation saved including its build cost, and phrase the result and your own contribution truthfully.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The layered structure is common test-automation practice. The mini framework, the simulated device, the seed, the timeout and every result come from a SYNTHETIC program written for this lesson and reproduced exactly by the lab: five PASS, no FAIL, one ERROR, one SKIP. The time-saving figures are invented for teaching arithmetic and describe no real project. The lesson makes no claim that the learner has built a production framework.",
  },
  references: [
    { title: "pytest documentation: fixtures, parametrize, markers", url: "https://docs.pytest.org/", note: "The ideas the lab's mini framework mirrors." },
    { title: "Lesson: pytest for hardware tests", note: "The runner this architecture sits around." },
    { title: "Lesson: From logs to evidence", note: "The reporting layer's job." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "'Draw the architecture of your automation suite'",
      body: `An interview panel reads the line on a CV: *Architected a test automation suite for a bench.* The panel asks: "Draw it."

The candidate draws one big box labelled "Python scripts". The panel asks where the serial port is opened, and the candidate says "in each test". Where does the command for the device get built? "In each test." What happens if the bench changes from a serial link to a CAN adapter? A pause. "I would edit the tests."

Two hundred tests would change, because the bottom of the suite leaked into the top. That is not an architecture. It is a pile.

A real answer names layers, says what each is allowed to know, and says what changes when the hardware does. It also says honestly what part the candidate built.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The wall socket and the plug adapter",
      body: `Take a kettle, a plug adapter and a wall socket. The kettle does not know whether the wall is in London or Paris. It has one plug. The **adapter** knows about the wall.

If you move country, you change the adapter. You do not rebuild the kettle.

A test framework should work the same way. The test cases are the kettle: they say what the device must do. The layer at the bottom, the **driver**, is the adapter: the only code that knows whether the device is on a serial port, a CAN bus or a simulation. Move to a different bench and you change the driver.

Each layer talks only to the one **directly below** it, and never reaches past it. The tests do not touch the port. The report does not build commands.

That rule is simple to state and enforce, and it is what makes a suite cheap to change and easy to draw.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The layers, and what each may know",
      body: `From the bottom up:

- **Hardware.** The device under test and the instruments.
- **Drivers.** The only code that touches the hardware: opening a port, writing bytes, reading with a timeout. A simulated driver has the same methods as a real one.
- **Protocol.** Builds commands, parses replies, checks lengths and checksums. It knows the message format but not the port.
- **Test cases.** Short functions that ask for what they need and assert what they expect. They know the protocol's vocabulary, not the wiring.
- **Reporting.** Collects every result with its reason, and writes the table. It knows nothing about the device.

Beside the stack sits **configuration**: ports, timeouts, limits, the random seed and the tool version, all in one place so a run can be repeated.

Every test ends in one of four **outcomes**. **PASS**: the assertion held. **FAIL**: it did not. **ERROR**: the test could not complete, for example the device never replied, so the assertion was never reached. **SKIP**: it was not run, with a stated reason.

FAIL and ERROR differ on purpose. FAIL says the device did the wrong thing. ERROR says something else went wrong first, and needs a different investigation.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "Five layers and a configuration column",
      diagram: "test-framework-layers",
      alt: "Layered diagram of a test automation framework: hardware at the bottom, device drivers above it, protocol, test cases using fixtures and parametrisation, and reporting at the top, with configuration beside the stack.",
      caption: "Each layer talks only to the one below it. Only the drivers touch the hardware. Configuration, such as ports, versions and seeds, sits beside the stack so any layer can read it and a run can be repeated.",
      body: `Put your finger on the driver layer and follow it up. Which layers would have to change if the serial port became a CAN adapter? Only that one.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: seven results from a simulated bench",
      body: `The lab framework runs a handful of cases against a **simulated** device, written for this lesson. The header line records the run's configuration: tool *benchframework 1*, seed 1234, timeout 200 ms, hardware False.

**The results:**

- \`test_identifies_itself\`: the device replies to \`ID?\` with its name. **PASS**.
- \`test_temperature_is_plausible\`: the reading is between 15 and 35. **PASS**.
- \`test_echo_roundtrip\` with three inputs: **three PASS** results, one per input.
- \`test_reply_within_timeout[slow]\`: the device answers after 450 ms and the timeout is 200 ms. **ERROR**: *no reply to 'ECHO slow' within 200 ms*.
- \`test_flash_the_firmware\`: **SKIP**, *needs hardware*.

**The totals:** 5 PASS, 0 FAIL, 1 ERROR, 1 SKIP.

**Why ERROR and not FAIL?** The test never got far enough to compare anything. The device did not answer in time, which is a question about the device, the timeout or the link, not about what the device said.

**Why SKIP and not PASS?** There is no hardware here. A skipped test says so, and does not count as a result.

The seven lines add up: 5 + 0 + 1 + 1 = 7.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "single",
        id: "which-layer-guided",
        skill: "test-framework",
        objective: "Put a piece of code in the right layer (guided).",
        prompt: `You need a function that turns "set the supply to 5.0 V" into the exact text the instrument expects, and a function that opens the USB connection to it. Which layer holds each?`,
        hints: [
          `One of them knows the message format. The other knows how the bytes physically travel.`,
          `Building the command text is about the message. Opening the connection is about the wire.`,
          `Message format belongs to the protocol layer. Physical access belongs to the driver layer.`,
        ],
        options: [
          { id: "a", text: "Command text: protocol layer. Opening the connection: driver layer.", correct: true, feedback: `Right. The protocol layer knows the vocabulary but not the wire; the driver layer is the only code that touches the device or its port.` },
          { id: "b", text: "Both in the test case, so the test is self-contained.", correct: false, feedback: `That is the pile from the scenario: every test then knows the wiring and the message format, and a change in either rewrites them all.` },
          { id: "c", text: "Command text: driver layer. Opening the connection: reporting layer.", correct: false, feedback: `The reporting layer only collects results; it never touches the device. The driver opens the connection, and it should not decide message wording.` },
          { id: "d", text: "Both in the configuration, because they are settings.", correct: false, feedback: `Configuration holds values such as the port name and the timeout. The code that uses them lives in layers.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: five layers in one file",
      lab: "py-bench-framework",
      body: `A framework of about a hundred lines, standard library only. It has a simulated driver, a protocol function, fixtures, parametrisation, a hardware marker and a reporting table, in the same layers as the figure. Find the line where each layer starts. Then find the ERROR line and say which layer raised it.`,
      tryNext: `Change \`has_hardware\` to True in the configuration and run again: what happens to the SKIP, and why is that a good sign? Then change the timeout to 500 ms. Which result changes, and what does that tell you about a timeout being a property of the test or of the bench? Finally, add a case of your own and see which layer you touched.`,
    },
    {
      type: "concept",
      stage: "how",
      depth: "apply",
      title: "Reproducible runs and counted retries",
      body: `A suite is trusted when another person can run it and get the same answer.

**One configuration place.** The header line in the lab prints the tool version, the seed, the timeout and whether hardware is present. A report that names its configuration can be repeated.

**Seed the randomness.** The simulated device draws its temperature from a random generator seeded with 1234, so a run is the same every time. A failure on one seed can be replayed on that seed.

**Record what you tested.** The version of the suite, the firmware baseline of the device under test and the bench identifier go in the report header.

**Count the retries.** A test that fails and is run again until it passes has not become reliable. If the framework retries, it must **report** the retry, with the number of attempts, never fold it into a clean PASS. A hidden retry turns a **flaky test** into a false pass.

**Keep the simulated driver honest.** It should fail the way the real device fails, for example by replying late, so tests of timeouts and errors can run on a laptop. It is a model, and a result on it is labelled as a simulation.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "layer-violations",
        skill: "test-framework",
        objective: "Spot layer violations.",
        prompt: `Select **every** design that breaks the layering rule that each layer talks only to the one below it.`,
        options: [
          { id: "a", text: "A test case opens the serial port itself and sets the baud rate.", correct: true, feedback: `Yes: the test case reaches past the protocol layer to the hardware. Only the driver should open ports.` },
          { id: "b", text: "The reporting layer builds an ECHO command to re-check a failed result.", correct: true, feedback: `Yes: reporting should only collect and format results. Building commands is the protocol layer's job.` },
          { id: "c", text: "The protocol layer calls the driver's read and write functions.", correct: false, feedback: `That is correct layering: the protocol layer sits directly above the driver and uses it.` },
          { id: "d", text: "A test case sleeps for exactly 450 ms because the device is slow, instead of using the driver's timeout.", correct: true, feedback: `Yes: it hard-codes a hardware detail in the test. The timeout belongs in the driver or configuration, so tests stay valid when the bench changes.` },
        ],
        solvedFeedback: `Right: ports in tests, commands in reporting and device-specific sleeps in tests all leak a lower layer upward. Protocol calling driver is exactly as intended.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "How much time did it save? The honest sum",
      body: `"The automation saved 60 %" is the most quoted and least checked claim on a CV. To support it you need four numbers and an honest subtraction.

- The **manual time** for the task, per cycle, measured on a real run, not guessed.
- The **automated time** per cycle, including the person watching and reading the result.
- The **build cost**: the hours spent writing and debugging the suite.
- The **number of cycles** over which the saving is counted.

Total saving = manual total − (build cost + automated total). Then divide by the manual total.

Example, synthetic: manual regression takes **4 h** per cycle. The automated run needs **0.5 h** of attention. Building took **20 h**. Over **10** cycles: manual 40 h; automated 20 + 5 = 25 h. Saving 15 h, which is **37.5 %**.

Leaving out the build cost would give (4 − 0.5) / 4 = 87.5 %, which is true only per cycle after the build is paid for.

Also state what the claim does **not** cover: maintenance after the build, and coverage. A suite that saves time by running **fewer** checks has saved nothing.

And say your part: wrote, maintained, or designed. Use the verb that is true.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "numeric",
        id: "time-saved",
        skill: "test-framework",
        objective: "Compute the saving, build cost included.",
        prompt: `Manual regression takes 6 hours per cycle. An automated run needs 1 hour of attention per cycle. Building the automation took 30 hours. Over 10 cycles, what percentage of the manual time was saved, build cost included?`,
        unit: "%",
        answer: 33.3,
        tolerance: 0.5,
        solution: `Manual total: 6 × 10 = 60 h. Automated total: 30 build + 1 × 10 = 40 h. Saved: 60 − 40 = 20 h. As a share of manual time: 20 / 60 = 33.3 %.`,
        solvedFeedback: `Right: 33.3 %. The build cost takes a large bite out of a saving that looks like 83 % per cycle.`,
        misconceptions: [
          { value: 83.3, tolerance: 0.5, feedback: `That is (6 − 1) / 6: the saving per cycle after the build is paid for. Over 10 cycles the 30 hours of building must be counted.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "claim-wording",
        skill: "test-framework",
        objective: "Choose a truthful way to state your part and the result.",
        prompt: `You wrote most of the test cases and helped maintain the drivers of a suite whose design was set by a senior colleague. Regression time fell from 6 hours to 1 hour of attention per cycle over ten cycles, with 30 hours of build. Which sentence is best?`,
        options: [
          { id: "a", text: "Architected a test framework that cut regression time by 83 %.", correct: false, feedback: `'Architected' claims the design, which was a colleague's, and 83 % ignores the build cost. Both will be probed, and neither survives.` },
          { id: "b", text: "Wrote test cases and maintained drivers in a layered pytest framework; regression time fell from 6 h to 1 h of attention per cycle, a net saving of about a third over ten cycles once the 30 h build is counted.", correct: true, feedback: `Right: the verbs are true, the numbers are stated with how they were measured, and the saving includes the build cost.` },
          { id: "c", text: "Helped with automation.", correct: false, feedback: `True but empty. It hides specific, real work and gives a panel nothing to ask about.` },
          { id: "d", text: "Led the automation effort and reduced test time to almost nothing.", correct: false, feedback: `Claims leadership that was not held and a result no measurement supports.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "test-framework-architecture-draw-it",
      intro: `Draw the architecture of a bench automation suite, say what changes when the hardware does, and state its time saving and your part truthfully.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** A protocol parser tested through a simulated driver on a PC, then through a real port, is this architecture applied to firmware.
- **Aerospace and UAV systems.** Bench suites for a unit or a bus are layered so that a change of interface card changes one driver, and each run is logged for review.
- **R&D and design.** An automated characterisation bench is a framework: instruments are drivers, sweeps are test cases, and the reporting layer writes the table.
- **Verification and interviews.** "Draw your framework" and "how did you measure the saving?" are the two follow-ups to every automation claim; the layers and the honest sum are the answers.`,
    },
    {
      type: "recap",
      summary: `- A framework has layers: hardware, drivers (the only code touching the device), protocol, test cases and reporting, with configuration beside them. Each layer talks only to the one below.
- Outcomes are PASS, FAIL (wrong behaviour), ERROR (the test could not complete) and SKIP (not run, with a reason).
- A simulated driver lets the same tests run without hardware; label its results as simulated.
- Runs are reproducible when configuration, seed, versions and baseline are in the header; retries are counted, never hidden.
- Time saved = manual total − (build cost + automated total), as a share of the manual total; state your part with the true verb.`,
      cards: [
        { id: "tfw-1", front: "What are the layers of a test framework?", back: "Hardware, drivers (only code that touches the device), protocol (builds and parses messages), test cases (assertions via fixtures and parametrisation) and reporting, with configuration beside the stack. Each layer uses only the one below." },
        { id: "tfw-2", front: "What is the difference between a FAIL and an ERROR?", back: "FAIL: the test ran and the device did the wrong thing. ERROR: the test could not complete, for example the device never replied, so the assertion was never reached." },
        { id: "tfw-3", front: "How do you compute time saved by automation?", back: "(manual total − (build cost + automated total)) / manual total, over a stated number of cycles, with manual and automated times measured, not guessed." },
        { id: "tfw-4", front: "Why must a retry be reported?", back: "A test that passes only after a rerun is flaky, not fixed. Folding the retry into a clean PASS hides the flake and gives a false result." },
      ],
    },
  ],
};
