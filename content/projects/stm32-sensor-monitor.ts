import type { Project } from "@/lib/content/schema";

export const stm32SensorMonitor: Project = {
  slug: "stm32-sensor-monitor",
  title: "STM32 sensor monitoring and fault detection",
  summary: "A one-sensor temperature monitor on an STM32 that detects an open, stuck or implausible sensor and raises an alarm output within a stated time, built in seven stages from requirements to a one-page report. Every stage names what is written, what runs in simulation and what needs the board.",
  whyItMatters: "This is the project the academy's day-28 outline describes and the one an interviewer can inspect. Done honestly, it shows requirements, an interface document, a driver, a detection design, traced tests and fault-injection evidence, which are the artefacts every embedded, test and verification role asks about.",
  simulationNote: `The **simulation path** needs no hardware. The detection logic is a pure function you can run on a host PC against a Python sensor model that injects faults, and this page includes an in-browser simulator of the same model so you can measure detection latency now. Simulation proves the logic and the timing budget of the design; it cannot prove the I2C driver, the wiring, the watchdog or the real alarm output. The app records which path you completed for each deliverable and never merges them.`,
  hardwareNote: `The **hardware path** is optional and needs an STM32 Nucleo board (any Cortex-M part with I2C, a UART and an independent watchdog), a TMP102 or similar I2C temperature sensor, a USB-serial adapter and, for the fault-injection stage, a logic analyser or oscilloscope. A heat source (hair dryer at a distance) is enough for the stuck-value and drift cases. If you do not have the hardware, complete the simulation path and say so in the report; that is the honest, interview-ready result.`,
  references: [
    { title: "Texas Instruments TMP102 datasheet", note: "Register map (temperature 0x00, configuration 0x01), 12-bit two's complement, 0.0625 °C per LSB, address 0x48 to 0x4B." },
    { title: "STM32F4 reference manual", id: "RM0090", note: "I2C, USART, IWDG, RCC_CSR reset-cause flags." },
    { title: "Lesson: Writing a test case that a reviewer can trust", note: "The evidence standard every deliverable uses." },
    { title: "Lesson: Presenting a portfolio project without inflating it", note: "The report format for stage 7." },
  ],
  stages: [
    {
      id: "requirements",
      title: "Requirements",
      goal: "Write six to eight requirements that a test can fail, with the two-second alarm limit justified.",
      relatedLessons: ["writing-a-trustworthy-test-case", "the-requirement-nobody-could-test"],
      body: `Start with what the monitor must do, in sentences a test can fail. A draft set, to be edited rather than copied:

- **R1** The monitor shall read the temperature sensor over I2C at 10 Hz ± 10 %.
- **R2** The monitor shall assert the ALARM output within **2.0 s** of the onset of a sensor fault, measured from the fault event to the ALARM edge.
- **R3** A sensor fault is any of: no acknowledge on the bus (open sensor), a reading outside −40 °C to +125 °C, a change of more than 5 °C between consecutive samples, or no change at all for 5 s.
- **R4** On a sensor fault the monitor shall emit one log line stating the fault type and the last valid reading.
- **R5** The monitor shall emit one log line per second over UART at 115200 8N1 with a millisecond timestamp, the reading in 0.01 °C and the alarm state.
- **R6** If the main loop stops for more than 1.0 s the independent watchdog shall reset the MCU, and the reset cause shall be logged after restart.
- **R7** Configuration values (thresholds, periods) shall be range-checked at start-up; out-of-range values shall be rejected and logged.

Where does 2.0 s come from? Write a short **hazard-style argument** (not a standard): a heater controlled from this reading cannot raise a housing by more than X °C in 2 s, so a fault annunciated within 2 s keeps the margin. State the numbers you assume. This is the day-12 rule: the limit comes from the need, not from what the firmware happens to achieve.`,
      deliverables: [
        { id: "req-list", title: "Requirements R1 to R7 with IDs, quantities and measurement methods", detail: "Edit the draft; every requirement names a quantity and how it would be measured.", path: "doc", evidence: "The requirements file (Markdown or a table) with a version number." },
        { id: "limit-rationale", title: "Rationale for the 2.0 s alarm limit", detail: "A hazard-style argument with your assumed numbers; say explicitly that it is not against any standard.", path: "doc", evidence: "One paragraph in the requirements file." },
      ],
    },
    {
      id: "architecture",
      title: "Architecture",
      goal: "Decide the structure and the timing budget before writing the driver.",
      relatedLessons: ["from-reset-vector-to-main", "watchdogs-and-reset-loops", "isr-to-task-handoff"],
      body: `A block diagram with five boxes is enough: sensor driver (I2C), detection logic (pure function), alarm output (GPIO), logger (UART), supervisor (watchdog refresh and configuration checks). Then the decisions, with reasons:

- **Super-loop or RTOS?** A 10 Hz loop with a 1 s log is comfortably a super-loop with a tick; say why you chose it, and what would push you to tasks (a second sensor, a protocol stack).
- **Timing budget:** a TMP102 read is two I2C transactions, about 0.3 ms at 100 kHz; the detection function is microseconds; a 60-byte log line at 115200 baud is about 5 ms. Show the loop fits in 100 ms with margin and that no step blocks longer than the watchdog allows.
- **Watchdog strategy:** refresh once per loop iteration only after every step completed (day 2's rule); timeout 1 s from R6; derive the IWDG prescaler and reload from the LSI range (day 2's calculator).
- **Detection as a pure function:** \`fault_t detect(sample_t now, const history_t *h)\` with no hardware access, so the same code runs on the host against the Python model and on the target.`,
      deliverables: [
        { id: "block-diagram", title: "Block diagram and the three decisions with reasons", detail: "Loop vs tasks, timing budget, watchdog strategy.", path: "doc", evidence: "A diagram image or ASCII block diagram plus a half page of reasons." },
        { id: "timing-budget", title: "Timing budget table", detail: "Each loop step with its worst-case time and the margin against 100 ms and against the watchdog.", path: "doc", evidence: "A table with a total and a margin." },
      ],
    },
    {
      id: "interfaces",
      title: "Interfaces",
      goal: "Write the ICD for the log line and the alarm output, and summarise the sensor's register map.",
      relatedLessons: ["interface-control-and-integration-faults", "i2c-sensor-not-acknowledging", "uart-framing-and-baud"],
      body: `Two interfaces leave the board and one enters it. Specify each the way day 14 taught: width, byte order, signedness, scaling and units, range, invalid value, timing, error behaviour, version.

- **Log line (UART out):** \`AA,<ms>,<temp_centi>,<alarm>,<fault>\\n\` with \`ms\` an unsigned 32-bit millisecond counter, \`temp_centi\` a signed integer in 0.01 °C (−4000 to 12500; 32767 means invalid), \`alarm\` 0 or 1, \`fault\` one of NONE, NACK, RANGE, JUMP, STUCK, CONFIG. 115200 8N1, one line per second plus one on each fault transition. Version field or a header line at boot with firmware version and reset cause.
- **ALARM output (GPIO):** active high, 3.3 V, asserted within 2.0 s of fault onset, held until the next valid reading has persisted for 5 s (state the hysteresis you choose).
- **Sensor (I2C in):** TMP102 at 0x48, temperature register 0x00, two bytes big-endian, 12-bit left-justified two's complement, 0.0625 °C per LSB; configuration register 0x01 for conversion rate. Write the conversion formula and a golden pair: \`0x19 0x00\` → 25.00 °C; \`0xE7 0x00\` → −25.00 °C.

Golden values in the ICD become unit-test inputs in stage 5 and the byte-order trap from day 14 cannot reach the report.`,
      deliverables: [
        { id: "icd", title: "Interface control document for the log line and the alarm output", detail: "Every field with width, order, sign, scaling, range, invalid code; timing and error behaviour; a version.", path: "doc", evidence: "The ICD file with golden examples." },
        { id: "sensor-map", title: "Sensor register summary with conversion formula and two golden pairs", detail: "From the datasheet; include the negative example.", path: "doc", evidence: "A half page in the ICD or a separate note." },
      ],
    },
    {
      id: "firmware",
      buildIt: {
        intro: `**Build it.** The detection function, a test harness and the sensor model exist as runnable files under \`labs/portfolio\` in the academy's repository (\`detect.h\`, \`detect.c\`, \`test_detect.c\`, \`sim.c\`, \`sensor_model.py\`, \`Makefile\`). Copy the folder, read \`detect.c\` against R3 line by line, then run the steps below and compare with the expected output. They run on any PC with gcc or clang, make and Python 3; nothing here needs the board. Do not stop at "it compiles": the point of the next stage is that the tests can fail.`,
        steps: [
          { title: "Run the sensor model alone and read its output format", lab: "portfolio-sensor-model", note: "One line per 10 Hz sample: `t_ms,acked,temp_centi`. The noise sequence is fixed so your output matches this one exactly. From t = 3 000 ms the value freezes: that is the stuck fault the detection must catch at 5 s." },
          { title: "Run the detection function against an injected NACK", lab: "portfolio-sim-run", note: "The host harness pipes the model into the real `detect()` and prints ICD log lines. The alarm column goes to 1 on the first NACK at t = 2 000 ms and the reading becomes 32767 (invalid). Latency here is one sample; on hardware you will measure it with the analyser." },
        ],
      },
      title: "Firmware and sensor model",
      goal: "Implement the detection logic as a pure function, a Python sensor model with fault injection, and (on hardware) the driver, watchdog and logger.",
      relatedLessons: ["embedded-c-register-bit-masks", "fixed-width-integers-overflow-shifts", "serial-automation-and-test-logs"],
      body: `Write the detection function first, in portable C with fixed-width types and no hardware access; keep the history (last valid reading, time of last change) in a struct the caller owns. Then the **sensor model** in Python: a class that returns readings at 10 Hz from a base temperature with noise, and can inject NACK, out-of-range, a step jump, a stuck value or drift at a chosen time. Run the C function against the model through a thin wrapper (ctypes, or compile the function with a tiny C harness that reads samples from stdin) and log one line per sample in the ICD format. That is the simulation path, complete.

On hardware: the TMP102 read (two transactions, check the ACK, convert per the ICD), the UART logger using the ICD format, the ALARM GPIO, the IWDG configured from the stage-2 numbers and refreshed once per loop after every step, and a boot banner with firmware version and the RCC_CSR reset cause. Keep the detection function byte-identical to the host build.

Label your repository README with what runs where. Nothing in this stage is "done" until the simulation log and, if you have the board, the hardware log both exist.`,
      deliverables: [
        { id: "detect-fn", title: "Detection logic as a pure, hardware-free function", detail: "Fixed-width types; NACK, range, jump, stuck and config faults; history struct owned by the caller.", path: "both", evidence: "The source file, and a host build that runs it (simulation) or the target build that runs it (hardware)." },
        { id: "sensor-model", title: "Python sensor model with fault injection", detail: "10 Hz readings with noise; inject NACK, range, jump, stuck, drift at a chosen time; emits ICD-format log lines.", path: "sim", evidence: "The model script and one log file with an injected fault." },
        { id: "driver-logger", title: "TMP102 driver, UART logger, ALARM output and boot banner on the board", detail: "ACK checked, conversion per the ICD, log line per the ICD, banner with version and reset cause.", path: "hw", evidence: "A captured boot banner and ten log lines from the real board." },
        { id: "watchdog", title: "Independent watchdog configured from the timing budget and refreshed after every step", detail: "Timeout per R6; prescaler and reload derived with the LSI range; refresh placement per day 2.", path: "hw", evidence: "The IWDG configuration lines and a logged reset cause after a deliberate hang (stage 6)." },
      ],
    },
    {
      id: "tests",
      buildIt: {
        intro: `**Build it.** The unit tests below are the first layer. Each one is a line that can fail; the harness is twenty lines of C with no framework to install. Run them, then run the deliberately failing case to prove the harness reports failure (a test suite that cannot fail proves nothing, day 12's rule). Then write TC-01 to TC-07 as documents and record which ran where.`,
        steps: [
          { title: "Run the unit tests: golden pairs, every fault boundary, the timestamp wrap", lab: "portfolio-detect-tests", note: "16 checks. Read the two range lines carefully: −40.01 °C is a range fault; −40.00 °C is in range but a 65 °C jump, so it reports JUMP. The boundary is the specification, made executable." },
          { title: "Prove the harness can fail", lab: "portfolio-detect-known-failure", note: "The same binary with `--known-failure` adds one check whose expectation is wrong on purpose (a 4.99 °C change reported as a jump). It must print FAIL and a non-zero count. Keep this run's output in your evidence folder next to the passing one." },
        ],
      },
      title: "Tests and traceability",
      goal: "Write test cases that can fail, trace them to requirements, and run them where they can run.",
      relatedLessons: ["writing-a-trustworthy-test-case", "talking-to-an-instrument-with-pyvisa"],
      body: `Three layers, each with its own evidence:

1. **Unit tests of the detection function** on the host: the two golden sensor pairs, each fault type at its boundary (−40.01 °C, +125.01 °C, a 5.01 °C jump, exactly 5.0 s of no change), and a known-failing case to prove the harness can fail. Count them.
2. **Test cases TC-01 to TC-07** traced to R1 to R7, each with preconditions, steps, an expected result with a method and a pass criterion (day 12's template). TC-02 (alarm within 2.0 s) names the instrument: logic analyser on the sensor line and the ALARM pin, five trials per fault type.
3. **Execution records**: which TCs ran in simulation, which on hardware, which not at all, with dates and results. A test case that has not run is listed as not run, never as passed.

A traceability matrix (requirement × test case) with no gaps and no orphans goes into the report. The day-12 traceability interactive is the model.`,
      deliverables: [
        { id: "unit-tests", title: "Unit tests of the detection function, including the golden pairs and a known-failing case", detail: "Host build; count the cases.", path: "sim", evidence: "The test file and a run log with the count of passes and the deliberate failure." },
        { id: "test-cases", title: "Test cases TC-01 to TC-07 traced to R1 to R7", detail: "Preconditions, steps, expected result with method, pass criterion; a traceability matrix with no gaps or orphans.", path: "doc", evidence: "The test specification and the matrix." },
        { id: "tc-run", title: "Test cases executed and recorded", detail: "Each TC marked run-in-simulation, run-on-hardware, or not run, with results.", path: "both", evidence: "The execution record with dates; simulation and hardware columns kept separate." },
      ],
    },
    {
      id: "fault-injection",
      buildIt: {
        intro: `**Build it.** The simulation path for this stage is the host harness: inject each fault with the model, read the first-fault line and the alarm transition, and record the latency as (first alarm sample − fault onset). The in-browser simulator below runs the same rules; the harness is the one you can put in a repository.`,
        steps: [
          { title: "Inject a NACK at 2.0 s and read the detection latency", lab: "portfolio-sim-run", note: "Onset 2 000 ms, first alarm at 2 000 ms: latency one sample (100 ms) in simulation. Repeat with `--fault stuck --at 3.0 --seconds 10 | ./sim_bin` and expect the first STUCK at 8 000 ms (5.0 s after the value froze), which is **outside** R2's 2.0 s. That is a finding for the FMEA row and the report, not a bug to hide." },
        ],
      },
      title: "Fault injection",
      goal: "Inject each fault, measure detection latency, and record the numbers with the method.",
      visual: "sensor-monitor-lab",
      relatedLessons: ["sil-hil-what-each-proves", "fmea-for-a-small-embedded-product", "oscilloscope-probing"],
      body: `Use the simulator below first: inject each fault at a chosen time, read the detection latency from the log, and record it. Then, on hardware, repeat what you can: disconnect the sensor during operation (NACK), short SDA to ground (NACK or bus stuck), warm the sensor with a heat source (jump or drift, depending on how fast), hold it at a constant temperature to provoke a stuck-value fault, and halt the core with the debugger to prove the watchdog resets within R6's limit and the reset cause is logged.

For each injection record: the fault, the method, the instrument, the number of trials, the measured latency (min, max), and whether it ran in simulation or on hardware. Latency on hardware is measured from the fault event to the ALARM edge on the logic analyser, not from a log timestamp.

Then write one FMEA row per fault type (day 24): the detection you built is the control; score severity, occurrence and detection before and after.`,
      deliverables: [
        { id: "sim-injection", title: "Simulator fault injection: every fault type, latency recorded", detail: "Use the in-browser simulator or your Python model; record min and max latency per fault over at least five runs.", path: "sim", evidence: "A results table labelled simulation." },
        { id: "hw-injection", title: "Hardware fault injection with the logic analyser", detail: "Disconnect, short, heat, hold; five trials each where possible; latency from fault event to ALARM edge.", path: "hw", evidence: "Analyser captures and a results table labelled hardware." },
        { id: "watchdog-proof", title: "Watchdog reset demonstrated with the reset cause logged", detail: "Halt the core; measure time to reset; read the banner's reset cause after restart.", path: "hw", evidence: "A capture of the reset and the banner line." },
        { id: "fmea-rows", title: "FMEA rows for each fault type, before and after your detection", detail: "S, O, D with the built detection as the control; note which rows stay high and why.", path: "doc", evidence: "A five-row FMEA table." },
      ],
    },
    {
      id: "report",
      title: "Report",
      goal: "Write the one-page outline with the simulated-versus-hardware table generated from what you actually did.",
      relatedLessons: ["presenting-a-portfolio-project-honestly", "telling-a-debugging-story"],
      body: `Six headings, from day 28: problem and scope (with what it does not do), constraints and decisions, what was built, simulated versus hardware (the table this page builds from your ticks), evidence (counts and measurements with methods), what is next. One page.

The evidence table below is derived from the deliverables you ticked on this page. It separates the simulation path from the hardware path and shows "not done" where you have not ticked; the app never fills it in for you. Copy it into the report as it stands. If the hardware column is empty, the honest sentence is "simulation path complete; hardware path not attempted", and that sentence, with the simulation evidence behind it, is a strong interview answer.`,
      deliverables: [
        { id: "outline", title: "One-page outline in the six headings", detail: "Scope, decisions, build, simulated vs hardware, evidence, next.", path: "doc", evidence: "The report file." },
        { id: "story", title: "A 90-second debugging story from this project", detail: "One real fault you hit while building it, in the five beats; or, if none, the stuck-value case as a labelled simulated story.", path: "doc", evidence: "Five sentences in the report's appendix." },
      ],
    },
  ],
};
