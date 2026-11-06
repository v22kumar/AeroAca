import type { Lesson } from "@/lib/content/schema";

export const interfaceControlAndIntegrationFaults: Lesson = {
  slug: "interface-control-and-integration-faults",
  moduleId: "integration",
  prerequisites: ["uart-framing-and-baud", "fixed-width-integers-overflow-shifts"],
  title: "Interface control documents and integration faults",
  summary: "Two boards that each pass their own tests can still fail together. Learn what an interface control document must pin down, the six ways integrations usually break, and how a golden frame and a reference measurement settle an argument between teams.",
  durationMinutes: 10,
  whyItMatters: "Integration is where professional hardware-test experience shines in interviews: the faults are between subsystems, the evidence is on the wire, and the fix is usually a document. Byte order, units and scaling errors have lost real spacecraft and real products.",
  objectives: [
    "List what an interface control document (ICD) must specify for a digital link: electrical, timing, framing, data representation and error handling.",
    "Recognise the common integration faults: byte order, units and scaling, signedness, timing and timeouts, levels, ground.",
    "Decode a multi-byte field correctly from a capture, and design an integration test with a golden frame and a reference value.",
  ],
  review: {
    status: "technically-reviewed",
    note: "ICD content list follows common aerospace and automotive practice (interface requirement specifications under systems-engineering standards). The Mars Climate Orbiter units mismatch is public record (NASA MCO Mishap Investigation Board, 1999). Byte-order arithmetic is exact.",
  },
  references: [
    { title: "NASA Mars Climate Orbiter Mishap Investigation Board Phase I Report (1999)", note: "Ground software produced thruster data in pound-seconds; the flight software expected newton-seconds. The canonical units-mismatch integration failure." },
    { title: "Systems-engineering interface definition practice (e.g. INCOSE Systems Engineering Handbook, interface management)", note: "What an interface requirement or control document contains and who owns it." },
  ],
  steps: [
    {
      type: "scenario",
      title: "Both boards pass. The system fails.",
      body: `The sensor board team reports their unit tested: every temperature within ±0.2 °C of the reference. The controller team reports theirs tested: every message parsed and logged. Plugged together, the controller logs **501.85 °C** in a room at 25 °C.

The sensor sends a 16-bit value in hundredths of a degree, most-significant byte first, exactly as its document says. The controller reads it least-significant byte first, exactly as its author assumed. Nobody lied. Nobody tested the interface.

This lesson is about the document that should have existed and the measurement that finds the fault in minutes.`,
    },
    {
      type: "concept",
      title: "What an ICD pins down",
      body: `An **interface control document** is the contract between two sides of a boundary. For a digital link it specifies, at minimum:

- **Electrical:** connector and pinout, signal levels (3.3 V logic, RS-485 differential…), drive and load limits, termination, ground and isolation.
- **Timing:** baud or clock rate with tolerance, bit order, timeouts, inter-frame gaps, which side is master, power-up and ready timing.
- **Framing:** start of frame, length, message IDs, checksum or CRC (polynomial, initial value, covered bytes), escape rules.
- **Data representation:** for every field its width, **byte order** (big-endian: most-significant byte first; little-endian: least-significant first), **signedness** (two's complement or offset), **units and scaling** (hundredths of a degree; 0.01 °C per LSB; offset −40 °C), valid range and the value that means "invalid".
- **Behaviour:** what each side does on CRC failure, timeout, out-of-range values and version mismatch.
- **Ownership and versioning:** who may change it, and a version number carried in the frames so a mismatch is detectable.

The last point is the one teams skip. A field that says "temperature" without byte order, scaling and units is not a specification; it is an invitation to guess.`,
      deeper: {
        title: "Where the famous failures hide",
        body: `The Mars Climate Orbiter was lost because one component produced thruster impulse in pound-force seconds and another consumed it as newton-seconds, a factor of 4.45, across an interface whose document specified SI. Nothing on either side failed its own test. The lesson that board took away is the one this lesson teaches: interfaces are tested *across*, with a known input on one side and a measured output on the other.`,
      },
    },
    {
      type: "concept",
      title: "The six usual suspects",
      body: `When two tested subsystems fail together, the fault is almost always one of these, and each has a signature:

| Fault | Signature | First check |
|---|---|---|
| **Byte order** | Values wildly wrong but structured: 25.00 arrives as 501.85 (0x09C4 read as 0xC409) | Compare a captured frame byte by byte with the ICD |
| **Units / scaling** | Wrong by a constant factor or offset: ×10, ×4.45, −273 | Send a known reference value and compute the ratio |
| **Signedness** | Correct until a negative value: −1 arrives as 65 535 | Test a negative and a boundary value |
| **Timing / timeouts** | Works when idle, fails under load or after N frames | Logic-analyser timestamps against the ICD's timeouts |
| **Levels** | Works on the bench, fails on the cable; or one side damaged | Scope the line at both ends |
| **Ground / isolation** | Intermittent, cable-dependent, worse when something else switches | Measure the potential between the two grounds |

A **CRC that passes** is a powerful clue: it says the bytes arrived intact, so the fault is in interpretation (order, scaling, sign), not in transmission (noise, levels, timing).

The integration test that catches all six is the same: a **golden frame** (a byte sequence from the ICD with known field values, fed in by the test), a **reference value** (a physical quantity both sides can measure independently), and a check at the boundary in both directions, including negative and boundary values.`,
    },
    {
      type: "example",
      title: "Worked example: decoding 0x09 0xC4",
      body: `ICD: *Temperature, 16-bit signed two's complement, big-endian, 0.01 °C per LSB.*

Capture after the frame header: \`09 C4\`.

- Big-endian: value = 0x09 × 256 + 0xC4 = 2 304 + 196 = **2 500** → 25.00 °C. Correct.
- Little-endian misread: 0xC4 × 256 + 0x09 = 50 176 + 9 = **50 185** → 501.85 °C. The scenario's number, exactly.

The controller's parser did \`value = buf[0] | (buf[1] << 8)\`, which is little-endian. The ICD says big-endian. The one-line fix is \`value = (buf[0] << 8) | buf[1]\`, cast to \`int16_t\` so that −5.00 °C (0xFE0C) comes out as −500 and not 65 036.

Then the integration test: feed the golden frame \`09 C4\` and assert 2 500; feed \`FE 0C\` and assert −500; place both boards next to a reference thermometer and assert the logged value within ±0.5 °C. The last test is the one that would have caught this before the first customer did.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "endian-decode",
        skill: "integration",
        objective: "Decode a multi-byte field per the ICD.",
        prompt: `ICD: pressure, 16-bit unsigned, **little-endian**, 0.1 mbar per LSB. The capture shows the two bytes \`E8 03\` in transmission order. What pressure does this represent, in mbar?`,
        unit: "mbar",
        answer: 100.0,
        tolerance: 0.05,
        solution: `Little-endian: the first byte is the least significant. value = 0x03 × 256 + 0xE8 = 768 + 232 = **1 000**; × 0.1 mbar = **100.0 mbar**. Reading it big-endian would give 0xE803 = 59 395 → 5 939.5 mbar, an obviously impossible atmospheric pressure, which is itself a clue.`,
        solvedFeedback: `Correct: 100.0 mbar. You applied byte order first and scaling second, in the order the ICD defines them.`,
        misconceptions: [
          { value: 5939.5, tolerance: 0.1, feedback: `That is the big-endian reading (0xE803 = 59 395 × 0.1). The ICD says little-endian: 0x03E8 = 1 000 → 100.0 mbar.` },
          { value: 1000, tolerance: 0.5, feedback: `1 000 is the raw value; the ICD's scaling is 0.1 mbar per LSB, so the pressure is 100.0 mbar.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "crc-passes-clue",
        skill: "integration",
        objective: "Use a passing CRC as evidence.",
        prompt: `Between two boards, every frame's CRC checks out, yet the controller's decoded values are nonsense. Which class of fault does the passing CRC make **least** likely?`,
        options: [
          { id: "a", text: "Byte order or scaling in the parser.", correct: false, feedback: `A passing CRC makes these *more* likely: the bytes are intact and the mistake is in interpreting them.` },
          { id: "b", text: "Noise, marginal levels or timing corrupting bits on the wire.", correct: true, feedback: `Right. The CRC covers the bytes as received; if it verifies, the transmission delivered what was sent. Look at interpretation: order, sign, scaling, field offsets.` },
          { id: "c", text: "A field-offset error, reading temperature from the humidity bytes.", correct: false, feedback: `An interpretation fault; the CRC says nothing about which bytes you then read.` },
          { id: "d", text: "A units mismatch between the two ICD versions.", correct: false, feedback: `Also interpretation. A CRC cannot tell you that both sides agree on what the numbers mean.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "icd-contents",
        skill: "integration",
        objective: "Specify an interface field completely.",
        prompt: `An ICD entry reads: *"Byte 4–5: battery voltage."* Select **every** item that must be added before two teams can implement it independently and agree.`,
        options: [
          { id: "a", text: "Byte order (big- or little-endian).", correct: true, feedback: `Without it, the two implementations differ by a factor of about 256.` },
          { id: "b", text: "Scaling and units (e.g. 1 mV per LSB).", correct: true, feedback: `'Voltage' could be mV, 10 mV, or a raw ADC code; the consumer has to know.` },
          { id: "c", text: "Signedness and valid range, including the invalid-value code.", correct: true, feedback: `Voltages are non-negative, but the range and the 'not available' value still need stating, and other fields will be signed.` },
          { id: "d", text: "The name of the engineer who designed the sensor board.", correct: false, feedback: `Ownership of the document matters; a person's name on a field does not define the field.` },
          { id: "e", text: "The ADC resolution used to measure the voltage.", correct: false, feedback: `Internal to the sender. The ICD specifies the representation on the wire, not how the value was obtained; accuracy belongs in a requirement, not the format.` },
        ],
        solvedFeedback: `Right. A field is specified by its width, byte order, signedness, scaling with units, range and invalid code. How the sender obtained it is the sender's business.`,
      },
    },
    {
      type: "interview",
      questionId: "icd-contents-question",
      intro: `Name the categories, give one example fault for each of byte order, units and signedness, and describe the golden-frame test.`,
    },
    {
      type: "recap",
      summary: `- An ICD specifies electrical, timing, framing, data representation (width, byte order, signedness, scaling and units, range, invalid value), behaviour on errors, ownership and versioning.
- Six usual integration faults: byte order, units/scaling, signedness, timing, levels, ground. Each has a signature.
- A passing CRC means the bytes arrived intact: look at interpretation, not transmission.
- Decode by byte order first, then signedness, then scaling. 0x09C4 big-endian is 2 500; read little-endian it is 50 185.
- Test across the interface: golden frames in both directions, negative and boundary values, and a physical reference both sides can measure.`,
      cards: [
        { id: "icd-1", front: "What must an ICD specify for a data field?", back: "Width, byte order, signedness, scaling with units, valid range and the invalid-value code. Plus, for the link: levels, timing, framing, CRC definition, error behaviour, version." },
        { id: "icd-2", front: "0x09 0xC4 big-endian at 0.01 °C/LSB?", back: "0x09C4 = 2 500 → 25.00 °C. Read little-endian it is 0xC409 = 50 185 → 501.85 °C, the signature of a byte-order fault." },
        { id: "icd-3", front: "Every CRC passes but values are nonsense. Where is the fault?", back: "Interpretation (byte order, signedness, scaling, field offsets), not transmission; the CRC proves the bytes arrived as sent." },
        { id: "icd-4", front: "What is a golden-frame test?", back: "Feed a byte sequence from the ICD with known field values, including negative and boundary values, and assert the decoded result; pair it with a physical reference both sides can measure." },
      ],
    },
  ],
};
