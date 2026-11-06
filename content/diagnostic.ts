import type { Exercise } from "@/lib/content/schema";

/**
 * The starting-level diagnostic: fourteen short questions over the foundations the
 * 30-day fast track assumes. Each wrong answer points at the lesson that teaches that
 * foundation (`foundations`), and the "Start here" list on Today is built only from
 * those wrong answers (ADR-15). No score is computed or shown.
 */
export type DiagnosticQuestion = { topic: string; foundations: string[]; exercise: Exercise };

export const diagnostic: DiagnosticQuestion[] = [
  {
    topic: "Circuit laws",
    foundations: ["circuit-laws-on-the-bench"],
    exercise: {
      kind: "numeric",
      id: "diag-divider",
      skill: "power",
      objective: "Apply Ohm's law to a divider.",
      prompt: "A 3.3 V rail feeds a 10 kΩ resistor in series with a 10 kΩ load to ground. What voltage appears across the load?",
      unit: "V",
      answer: 1.65,
      tolerance: 0.05,
      solution: "Two equal resistors in series split the voltage equally: 3.3 V × 10 / (10 + 10) = 1.65 V.",
      solvedFeedback: "Right. Every sag, divider and pull-up calculation in the academy is this arithmetic.",
      misconceptions: [{ value: 3.3, tolerance: 0.05, feedback: "That is the rail voltage. The series resistor drops half of it before the load." }],
    },
  },
  {
    topic: "Decoupling",
    foundations: ["capacitors-inductors-rc-and-filters", "reading-a-power-tree"],
    exercise: {
      kind: "single",
      id: "diag-decoupling",
      skill: "power",
      objective: "Place a decoupling capacitor.",
      prompt: "Where should a 100 nF decoupling capacitor for a microcontroller go?",
      options: [
        { id: "a", text: "As close as possible to the chip's supply pin, between that pin and ground", correct: true, feedback: "Yes: the loop from pin to capacitor to ground must be short, or the capacitor cannot supply the fast current the chip demands." },
        { id: "b", text: "Next to the regulator output, where the rail is generated", correct: false, feedback: "Bulk capacitance belongs at the regulator; decoupling belongs at the load's pin. The power-tree lesson separates the two jobs." },
        { id: "c", text: "Anywhere on the same net; copper is a conductor", correct: false, feedback: "Copper has inductance. A few centimetres of trace is enough to make a 100 nF capacitor useless above a few megahertz." },
      ],
    },
  },
  {
    topic: "Logic levels",
    foundations: ["logic-levels-thresholds-and-open-drain"],
    exercise: {
      kind: "single",
      id: "diag-levels",
      skill: "schematic",
      objective: "Judge level compatibility between two logic families.",
      prompt: "A 5 V-only sensor output drives a 3.3 V microcontroller input that is **not** 5 V tolerant. What is the honest assessment?",
      options: [
        { id: "a", text: "It may work on the bench for a while and damage the input over time; a level shifter or divider is required", correct: true, feedback: "Right. Exceeding the absolute maximum rating is not an immediate failure, which is exactly why it ships." },
        { id: "b", text: "It is fine: logic high is logic high", correct: false, feedback: "Absolute maximum ratings are in the datasheet for this case. The schematic-review lesson's level-compatibility check exists because this is common." },
        { id: "c", text: "The microcontroller will refuse to read the pin", correct: false, feedback: "Nothing refuses. The pin reads high and the input structure is stressed beyond its rating." },
      ],
    },
  },
  {
    topic: "Hexadecimal",
    foundations: ["embedded-c-register-bit-masks"],
    exercise: {
      kind: "numeric",
      id: "diag-hex",
      skill: "bit-ops",
      objective: "Convert hexadecimal to decimal.",
      prompt: "What is `0x5A` in decimal?",
      unit: "",
      answer: 90,
      tolerance: 0,
      solution: "5 × 16 + 10 = 90. In binary, 0101 1010.",
      solvedFeedback: "Right. Register values are read and written in hex throughout the firmware lessons.",
      misconceptions: [{ value: 510, tolerance: 0, feedback: "Digits are weighted by powers of 16, not written side by side: 5 × 16 + 10." }],
    },
  },
  {
    topic: "Bit masks",
    foundations: ["embedded-c-register-bit-masks"],
    exercise: {
      kind: "single",
      id: "diag-mask",
      skill: "bit-ops",
      objective: "Clear one bit without touching the others.",
      prompt: "Which statement clears bit 3 of `x` and leaves every other bit unchanged?",
      options: [
        { id: "a", text: "`x &= ~(1u << 3);`", correct: true, feedback: "Yes: AND with the inverted mask. Only bit 3 meets a zero." },
        { id: "b", text: "`x = 0;`", correct: false, feedback: "That clears every bit. In a control register that disables the whole peripheral." },
        { id: "c", text: "`x |= (1u << 3);`", correct: false, feedback: "OR sets the bit; it never clears one." },
        { id: "d", text: "`x ^= (1u << 3);`", correct: false, feedback: "XOR toggles: it clears bit 3 only if it was set, and sets it if it was clear." },
      ],
    },
  },
  {
    topic: "Fixed-width integers",
    foundations: ["fixed-width-integers-overflow-shifts"],
    exercise: {
      kind: "numeric",
      id: "diag-wrap",
      skill: "integers",
      objective: "Predict unsigned wrap-around.",
      prompt: "`uint8_t a = 250; a = a + 10;` What does `a` hold afterwards?",
      unit: "",
      answer: 4,
      tolerance: 0,
      solution: "250 + 10 = 260; stored into eight bits it becomes 260 − 256 = 4. Unsigned arithmetic wraps modulo 2⁸; this is defined behaviour and the source of the 49.7-day bug class.",
      solvedFeedback: "Right. The fixed-width lesson builds the elapsed-time pattern on exactly this.",
      misconceptions: [{ value: 260, tolerance: 0, feedback: "260 does not fit in eight bits. The value wraps." }, { value: 255, tolerance: 0, feedback: "Unsigned types wrap; they do not saturate at the maximum." }],
    },
  },
  {
    topic: "Pointers",
    foundations: ["pointers-to-hardware"],
    exercise: {
      kind: "single",
      id: "diag-pointer",
      skill: "pointers",
      objective: "Read a pointer dereference.",
      prompt: "`uint32_t *p = (uint32_t *)0x40020000; *p = 5;` What does the second statement do?",
      options: [
        { id: "a", text: "Writes the value 5 to the 32-bit word at address 0x40020000", correct: true, feedback: "Yes. That address is a peripheral register on an STM32F4, which is how firmware talks to hardware." },
        { id: "b", text: "Makes `p` point to address 5", correct: false, feedback: "That would be `p = (uint32_t *)5;`. The star dereferences: it reaches the thing pointed to." },
        { id: "c", text: "Stores 5 in a local variable named `*p`", correct: false, feedback: "`*p` is an expression, not a variable name. It denotes the memory `p` points at." },
      ],
    },
  },
  {
    topic: "UART framing",
    foundations: ["uart-framing-and-baud"],
    exercise: {
      kind: "numeric",
      id: "diag-uart-bits",
      skill: "uart",
      objective: "Count bits on the wire for one byte.",
      prompt: "A UART configured 8N1 sends one data byte. How many bit periods does that take on the wire?",
      unit: "bits",
      answer: 10,
      tolerance: 0,
      solution: "One start bit, eight data bits, no parity, one stop bit: 10. At 115200 baud that is 86.8 µs per byte.",
      solvedFeedback: "Right. Throughput and timeout arithmetic in the serial lessons starts here.",
      misconceptions: [{ value: 8, tolerance: 0, feedback: "Eight is the payload. The start and stop bits are on the wire too." }],
    },
  },
  {
    topic: "I2C acknowledge",
    foundations: ["i2c-sensor-not-acknowledging"],
    exercise: {
      kind: "single",
      id: "diag-i2c-nack",
      skill: "i2c-addressing",
      objective: "Interpret a NACK after the address byte.",
      prompt: "The master sends an I2C address byte and sees no acknowledge. What does that prove?",
      options: [
        { id: "a", text: "No device at that address pulled SDA low on the ninth clock; wiring, address, power or the device's state could be the cause", correct: true, feedback: "Yes: a NACK is absence of evidence of a listener, not a diagnosis. The I2C lesson is the ordered search." },
        { id: "b", text: "The sensor is broken and must be replaced", correct: false, feedback: "A wrong 7-bit versus 8-bit address gives the same NACK with a perfectly good sensor." },
        { id: "c", text: "The pull-up resistors are missing", correct: false, feedback: "Missing pull-ups show as lines that never go high, a different symptom you check first with a meter." },
      ],
    },
  },
  {
    topic: "Oscilloscope basics",
    foundations: ["oscilloscope-probing"],
    exercise: {
      kind: "single",
      id: "diag-scope-bw",
      skill: "instrumentation",
      objective: "Match scope bandwidth to a signal.",
      prompt: "You want to see whether the edges of an 8 MHz clock are clean. Which oscilloscope is adequate?",
      options: [
        { id: "a", text: "100 MHz bandwidth with a compensated 10× probe", correct: true, feedback: "Yes. Edges contain harmonics well above the fundamental; the probing lesson gives the rule of thumb and why ground-lead length matters as much." },
        { id: "b", text: "10 MHz bandwidth; the clock is 8 MHz", correct: false, feedback: "At 10 MHz the scope shows a rounded sine. Edge quality, ringing and overshoot are invisible." },
        { id: "c", text: "Bandwidth does not matter if the sample rate is high", correct: false, feedback: "Sample rate decides aliasing; analogue bandwidth decides what the front end lets through. Both matter." },
      ],
    },
  },
  {
    topic: "Multimeter",
    foundations: ["the-dmm-and-the-bench-supply"],
    exercise: {
      kind: "single",
      id: "diag-dmm-current",
      skill: "bring-up-process",
      objective: "Connect a meter to measure current.",
      prompt: "To measure the current a board draws from a 5 V supply with a multimeter, you connect the meter",
      options: [
        { id: "a", text: "In series with the supply lead, on the current range, so all the current flows through the meter", correct: true, feedback: "Yes. And the meter's burden voltage drops a little of your 5 V, which matters on marginal rails." },
        { id: "b", text: "Across the supply terminals on the current range", correct: false, feedback: "That shorts the supply through the meter's low-resistance current shunt and blows the fuse (or the supply)." },
        { id: "c", text: "Across the supply terminals on the voltage range and divide by the resistance of the board", correct: false, feedback: "A board is not a fixed resistance. Measure the current directly, or measure the voltage across a known sense resistor." },
      ],
    },
  },
  {
    topic: "Testable requirements",
    foundations: ["writing-a-trustworthy-test-case"],
    exercise: {
      kind: "single",
      id: "diag-requirement",
      skill: "verification",
      objective: "Recognise a requirement a test can fail.",
      prompt: "Which of these is a requirement a test can fail?",
      options: [
        { id: "a", text: "The alarm output shall assert within 2.0 s of sensor disconnection, measured from the disconnection event to the output edge", correct: true, feedback: "Yes: a quantity, a limit, a measurement method. The verification lessons start from this shape." },
        { id: "b", text: "The alarm shall respond quickly to sensor faults", correct: false, feedback: "Quickly is not a number. No test can fail it." },
        { id: "c", text: "The system should be reliable", correct: false, feedback: "Neither a quantity nor a method; and 'should' is not even an obligation." },
      ],
    },
  },
  {
    topic: "Interrupts",
    foundations: ["interrupts-and-nvic-priorities"],
    exercise: {
      kind: "single",
      id: "diag-isr",
      skill: "nvic",
      objective: "State the first rule of interrupt handlers.",
      prompt: "An interrupt handler for a UART receive event should",
      options: [
        { id: "a", text: "Read the byte, clear or acknowledge the interrupt source, hand the data to the main code and return quickly", correct: true, feedback: "Yes: short, source cleared, data handed off. The NVIC and handoff lessons add priorities and the queue." },
        { id: "b", text: "Parse the whole message and print a log line before returning", correct: false, feedback: "Long handlers delay every lower-priority interrupt and the main loop; printing in an ISR is a classic fault." },
        { id: "c", text: "Wait in a loop until the next byte arrives so no data is lost", correct: false, feedback: "Blocking inside an interrupt blocks everything at or below its priority. Data is kept by a buffer, not by waiting." },
      ],
    },
  },
  {
    topic: "Python bytes and text",
    foundations: ["serial-automation-and-test-logs"],
    exercise: {
      kind: "single",
      id: "diag-py-bytes",
      skill: "python-automation",
      objective: "Distinguish bytes from str in Python 3.",
      prompt: "In Python 3, what is the value of `b\"25.0\" == \"25.0\"`?",
      options: [
        { id: "a", text: "`False`: a bytes object and a str are different types and never compare equal", correct: true, feedback: "Yes. A serial port gives you bytes; decode before comparing with text. The serial lesson's lab shows it." },
        { id: "b", text: "`True`: they contain the same characters", correct: false, feedback: "They do not contain characters in the same sense. One is a byte sequence, the other is Unicode text; Python 3 keeps them apart on purpose." },
        { id: "c", text: "It raises a `TypeError`", correct: false, feedback: "Comparing for equality is allowed and simply returns `False` (with a warning under `python3 -b`). Ordering comparisons would raise." },
      ],
    },
  },
];

export function getDiagnosticQuestion(id: string): DiagnosticQuestion | undefined {
  return diagnostic.find((q) => q.exercise.id === id);
}
