import type { Lesson } from "@/lib/content/schema";

export const logicAnalysersDecodingABus: Lesson = {
  slug: "logic-analysers-decoding-a-bus",
  moduleId: "instrumentation",
  prerequisites: ["oscilloscope-probing", "uart-framing-and-baud"],
  title: "Logic analysers: decoding a bus you did not design",
  summary: "A logic analyser turns a bus into a time-stamped list of bytes, but only if the sample rate, thresholds, triggers and decoder settings are right, and only after you have worked out what the bus is. Learn the setup rules, how to identify an unknown protocol from its idle levels and edges, and how to turn a capture into evidence.",
  durationMinutes: 10,
  whyItMatters: "Integration and field faults are decided by what is on the wire, and the logic analyser is the instrument that shows it. Being able to set one up correctly, decode a bus from first principles and export a capture as evidence is expected in every hardware-test role.",
  objectives: [
    "Set up a capture: channels, ground, thresholds, sample rate (at least four to ten times the fastest edge rate), memory depth and a trigger.",
    "Identify an unknown serial bus from idle levels, clock presence, edge timing and framing, then configure the decoder.",
    "Turn a capture into evidence: timestamps, decoded bytes, annotations, exported file.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Guidance is generic to USB and bench logic analysers (sigrok/PulseView, Saleae-class, Keysight MSO). Sample-rate and threshold rules follow their documentation.",
  },
  references: [
    { title: "sigrok / PulseView documentation: protocol decoders, sample rate, triggers", note: "Open-source reference for decoder settings." },
    { title: "Lesson: UART framing and baud tolerance; SPI modes; I2C sensor not acknowledging", note: "The protocols being decoded." },
    { title: "Lesson: Oscilloscope probing without lying to yourself", note: "When the analyser's digital view is not enough: levels, ringing, slow edges." },
  ],
  steps: [
    {
      type: "scenario",
      title: "The capture that decoded to nonsense",
      body: `A tester captured an I2C bus at 1 MS/s, decoded it, and reported "the sensor sends random bytes". The bus was running at 400 kHz; 1 MS/s gave two and a half samples per bit, which is not enough to place edges, and the decoder's address-width setting was wrong on top. Recaptured at 10 MS/s with the right settings, the bus showed clean transactions and one NACK after a specific register write, which was the fault.

Analysers do not lie, but they report exactly what they were set up to see. This lesson is the setup, then the reading.`,
    },
    {
      type: "concept",
      title: "Setting up a capture that can be trusted",
      body: `- **Ground first.** The analyser's ground to the target's ground, short lead; without it the signals float and thresholds are meaningless.
- **Threshold.** Set the logic threshold for the target's levels: about 1.5 V for 3.3 V logic, 2.5 V for 5 V, 0.9 V for 1.8 V. A wrong threshold turns slow edges into glitches or misses low-swing signals entirely.
- **Sample rate.** At least **four times** the fastest edge rate for decoding, **ten times** for timing measurements. 400 kHz I2C: 4 MS/s minimum, 10 MS/s comfortable. 8 MHz SPI: 40 to 80 MS/s. If the analyser cannot do that with all channels enabled, reduce the channel count.
- **Memory depth and duration.** Depth ÷ sample rate = capture length; a 1 s window at 10 MS/s needs 10 M samples per channel. Streaming analysers capture to the PC and are limited by USB bandwidth; buffered ones by on-board memory.
- **Trigger.** Capture around the event: edge on a chip-select, a pattern on a bus, a decoded value (an I2C address, a UART byte) where the analyser supports protocol triggers. Pre-trigger memory shows what led up to it.
- **Analogue sanity.** A logic analyser shows 0 and 1; it cannot show a 2.1 V "high" that the receiver sees as low, ringing, or a slow edge. When the decode is odd but the setup is right, put a scope on the same line (day 6).

Then the decoder: UART needs baud, data bits, parity, stop bits, polarity (inverted lines exist); SPI needs CPOL, CPHA, bit order, word size and which line is chip select; I2C needs address width (7 or 10 bit) and whether addresses are shown shifted; CAN needs the bit rate and sample point. A decoder with one wrong setting produces confident garbage, which is the scenario.`,
    },
    {
      type: "concept",
      title: "Reading a bus from first principles",
      body: `When the protocol is unknown or the documentation is missing:

1. **Count the lines and find the idle levels.** One data line idle high: likely UART (or 1-Wire). Two lines idle high with open-drain-shaped rising edges (slower than the falling ones): I2C. Three or four lines with one square clock and a chip select that frames bursts: SPI. A differential pair that idles at about 2.5 V each: CAN or RS-485.
2. **Is there a clock?** A line with a perfectly regular edge rate during activity is a clock; data lines change near its edges. No clock means asynchronous (UART) and the bit time must be measured.
3. **Measure the shortest pulse.** Its width is the bit time: 8.68 µs is 115 200 baud; 2.5 µs on a clock is 400 kHz I2C; a 125 ns clock period is 8 MHz SPI. Compare with standard rates and pick the nearest.
4. **Find the framing.** UART: a falling start edge, then 8 bit periods, then a high stop; count bits between start and stop. SPI: how many clocks per chip-select assertion; which clock edge the data is stable on gives CPHA, the idle clock level gives CPOL. I2C: START (SDA falls while SCL high), 8 bits, an ACK bit, STOP. CAN: 11 or 29 identifier bits after SOF, then a stuff pattern.
5. **Decode a known transaction** to confirm: a device's *IDN?-style command and reply, a register read whose value you know, the sensor's ID register.

With the protocol identified, configure the decoder and verify it against the known transaction before trusting it on the unknown one.`,
      deeper: {
        title: "Captures as evidence",
        body: `A capture that will appear in a report needs: the analyser model and firmware, sample rate and thresholds, the channel-to-signal map, the trigger condition, an absolute timestamp, and the decoded transaction annotated with what it means ("byte 3 = 0x09 0xC4, big-endian, 25.00 °C"). Export the raw capture (the analyser's native file plus a CSV of decoded bytes) and keep it with the test record. A screenshot alone is a picture of a claim; the file is the evidence.`,
      },
    },
    {
      type: "example",
      title: "Worked example: identifying a mystery link",
      body: `Two lines on a connector, no documentation. Capture at 20 MS/s, threshold 1.5 V, ground attached.

- Both lines idle high. Line A's rising edges are slower than its falling edges (the shape of a pull-up); line B's are square: open-drain data and a push-pull clock → I2C with SDA = A, SCL = B.
- Shortest SCL pulse 1.25 µs → 2.5 µs period → 400 kHz.
- A falls while B is high at the start of each burst: START. Nine clocks per byte (8 + ACK). The first byte after START is 0x90: address 0x48 shifted left with the write bit, a common temperature-sensor address.
- Decoder set to I2C, 7-bit, shifted display; the decode shows write 0x48 [0x00], then read 0x48 [0x19 0x00]: register 0 (temperature), 0x1900 → 25.0 °C on a TMP102.
- Export: capture file, CSV of transactions, annotation. Total time: twelve minutes, no datasheet needed to get this far, and the datasheet confirmed it.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "sample-rate-min",
        skill: "logic-analyser",
        objective: "Choose a sample rate.",
        prompt: `You need to decode an SPI bus clocked at 10 MHz and also measure its setup time to within about 10 ns. Using the ten-times rule for timing measurements, what minimum sample rate do you set, in MS/s?`,
        unit: "MS/s",
        answer: 100,
        tolerance: 1,
        solution: `Ten times the 10 MHz clock: **100 MS/s** (10 ns sample period, matching the required resolution). Decoding alone could manage at 40 MS/s; timing to 10 ns cannot.`,
        solvedFeedback: `Correct: 100 MS/s. Four times for decoding, ten times for timing.`,
        misconceptions: [
          { value: 40, tolerance: 1, feedback: `40 MS/s is the four-times rule, enough to decode but with 25 ns resolution, not the 10 ns the timing measurement needs: 100 MS/s.` },
          { value: 20, tolerance: 1, feedback: `Twice the clock is Nyquist for a sine; a digital bus needs edges placed, so at least four times, and ten times for timing: 100 MS/s.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "identify-bus",
        skill: "logic-analyser",
        objective: "Identify a bus from its signature.",
        prompt: `A capture shows two lines, both idle high. One has rising edges noticeably slower than its falling edges; the other is a clean square wave in bursts; the first line falls while the second is high at the start of each burst. What is the bus?`,
        options: [
          { id: "a", text: "I2C: open-drain SDA (slow pull-up rises), push-pull SCL, and a START condition (SDA falling while SCL is high).", correct: true, feedback: `Yes. Set the decoder to I2C with 7-bit addresses and confirm against a known register read.` },
          { id: "b", text: "UART with a separate clock line.", correct: false, feedback: `UART has no clock, and its data line is push-pull with symmetric edges.` },
          { id: "c", text: "SPI without a chip select.", correct: false, feedback: `SPI data lines are push-pull (symmetric edges) and there is no START condition.` },
          { id: "d", text: "CAN.", correct: false, feedback: `CAN is a differential pair idling near 2.5 V with no separate clock.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "capture-evidence",
        skill: "logic-analyser",
        objective: "Make a capture into evidence.",
        prompt: `Select **every** item a logic-analyser capture needs to serve as evidence in a test record.`,
        options: [
          { id: "a", text: "Sample rate, thresholds and the channel-to-signal map.", correct: true, feedback: `Without them the capture cannot be reproduced or trusted.` },
          { id: "b", text: "The trigger condition and an absolute timestamp.", correct: true, feedback: `Ties the capture to the event and to the log.` },
          { id: "c", text: "The exported native capture file and a CSV of decoded transactions, not just a screenshot.", correct: true, feedback: `A screenshot is a picture of a claim; the file can be re-decoded.` },
          { id: "d", text: "The tester's opinion of the firmware team.", correct: false, feedback: `Not evidence.` },
          { id: "e", text: "An annotation of what the decoded bytes mean against the interface document.", correct: true, feedback: `The interpretation step, with the ICD as the reference.` },
        ],
        solvedFeedback: `Right. Setup, trigger and time, the files, and the interpretation against the document.`,
      },
    },
    {
      type: "interview",
      questionId: "logic-analyser-decode",
      intro: `Give the setup rules with numbers, then the first-principles identification steps, then what makes a capture evidence. The nonsense-decode story is the one to tell.`,
    },
    {
      type: "recap",
      summary: `- Setup: ground, threshold for the logic family, sample rate ≥ 4× the edge rate for decoding and 10× for timing, memory depth for the window, a trigger with pre-trigger memory; a scope when levels or edges are in doubt.
- Decoder settings must match the bus (baud/parity, CPOL/CPHA/order, address width, bit rate); one wrong setting is confident garbage.
- Unknown bus: count lines and idle levels, find the clock, measure the shortest pulse for the rate, find the framing, confirm on a known transaction.
- Evidence: setup, trigger, timestamp, exported files, annotation against the ICD.`,
      cards: [
        { id: "la-1", front: "Minimum logic-analyser sample rate?", back: "At least four times the fastest edge rate to decode, ten times to measure timing; reduce channel count if needed to reach it." },
        { id: "la-2", front: "How do you tell I2C from SPI from UART in a capture?", back: "I2C: two lines idle high, slow open-drain rising edges on SDA, START when SDA falls with SCL high. SPI: square clock, push-pull data, chip select framing bursts. UART: one data line idle high, no clock, start bit falling edge." },
        { id: "la-3", front: "How do you find an unknown bit rate?", back: "Measure the shortest pulse (or the clock period): 8.68 µs is 115 200 baud, 2.5 µs clock is 400 kHz I2C, 125 ns is 8 MHz SPI; pick the nearest standard rate." },
        { id: "la-4", front: "What turns a capture into evidence?", back: "Analyser model, sample rate, thresholds, channel map, trigger, absolute timestamp, exported native file and decoded CSV, and an annotation against the interface document." },
      ],
    },
  ],
};
