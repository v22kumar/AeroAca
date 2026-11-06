import type { Lesson } from "@/lib/content/schema";

export const uartFramingAndBaud: Lesson = {
  slug: "uart-framing-and-baud",
  moduleId: "interfaces",
  prerequisites: ["oscilloscope-probing"],
  title: "UART framing and baud tolerance",
  summary: "The debug console is the first thing a board says to you. Learn how a UART frame is built, why baud rates must agree within a few percent, and how to read garbage on the terminal as a precise clue.",
  durationMinutes: 10,
  whyItMatters: "A silent or garbled serial console is the first wall most engineers hit on a new board. Diagnosing it from the waveform in five minutes is a small, visible win that interviewers and colleagues both notice.",
  objectives: [
    "Draw a UART frame bit by bit: start, data (LSB first), optional parity, stop.",
    "Explain why a baud-rate mismatch of a few percent produces framing errors and garbage, and compute the actual baud an STM32 USART generates.",
    "Separate the physical faults (levels, ground, swapped pins) from configuration faults (baud, clock) using a scope and the terminal symptoms.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Frame format is the de-facto asynchronous serial standard; baud generation follows the STM32F4 USART chapter (RM0090, 16× oversampling). Tolerance figures are derived in the text; waveforms in the visual are illustrative.",
  },
  references: [
    {
      title: "STM32F4 reference manual, USART: frame format, baud rate generation and tolerance",
      id: "RM0090",
      url: "https://www.st.com/resource/en/reference_manual/rm0090-stm32f405415-stm32f407417-stm32f427437-and-stm32f429439-advanced-armbased-32bit-mcus-stmicroelectronics.pdf",
      note: "USARTDIV mantissa/fraction, oversampling by 16 or 8, and the receiver tolerance tables.",
    },
    {
      title: "TIA/EIA-232 (RS-232) overview",
      note: "RS-232 uses ±3 V to ±15 V signalling with inverted logic; it is not compatible with 3.3 V logic-level UART pins without a transceiver.",
    },
  ],
  steps: [
    {
      type: "scenario",
      title: "ÿÿ‚à€ on the terminal",
      body: `You connect a USB-to-serial adapter to a new board's debug header, open a terminal at 115200 8N1, and press reset. Instead of a banner you get a burst of symbols like \`ÿÿ‚à€x\`, then silence until the next reset.

Three things could be happening, and they look identical from the terminal: the baud rates disagree, the signal levels are wrong, or the board's clock is not what the firmware thinks it is. Each has a different fix and a different ten-second measurement that proves it.`,
    },
    {
      type: "concept",
      title: "Anatomy of a frame",
      body: `A **UART** sends bytes with no clock wire. Both ends agree on a **baud rate** (bits per second) and on a frame layout; the receiver recovers timing from the edges.

The line **idles high**. A frame is:

1. One **start bit**, low. Its falling edge tells the receiver "a byte begins now".
2. **Data bits**, usually 8, **least-significant bit first**. The byte 0x41 ('A', binary 0100 0001) goes out as 1,0,0,0,0,0,1,0.
3. An optional **parity bit** (even or odd), a one-bit checksum.
4. One or more **stop bits**, high, which guarantee the line is idle before the next start bit.

"115200 8N1" means 115 200 baud, 8 data bits, no parity, 1 stop bit: ten bit-times per byte, so about 11 520 bytes per second and 8.68 µs per bit.

The receiver samples each bit near its centre. It expects the stop bit to be high; if it reads low there, it declares a **framing error**: the timing has drifted or the sender is running at a different rate.`,
      deeper: {
        title: "Why a few percent is the limit",
        body: `The receiver resynchronises on every start bit, then counts bit-times from there. Any rate error accumulates across the frame. By the stop bit, the tenth bit, the sampling point has drifted by 10 × (error). The sample must stay inside the bit, so the combined error of transmitter and receiver has to stay under roughly half a bit over ten bits: about ±5 % total, which is why each side is usually held to 2 to 3 %.

STM32 USARTs generate the rate by dividing the peripheral clock: USARTDIV = f_CK ÷ (16 × baud) with 16× oversampling. With f_CK = 16 MHz and 115 200 baud, USARTDIV = 8.68; the register holds mantissa 8 and fraction 11/16 = 0.6875, so the real rate is 16 000 000 ÷ (16 × 8.6875) = 115 108 baud, 0.08 % low. Fine. With a clock the firmware believes is 8 MHz but which is really 25 MHz, every baud rate is 3.125× too fast, and that is the garbage of the opening scenario.`,
      },
    },
    {
      type: "visual",
      title: "Watch a byte go down the wire",
      visual: "uart-frame",
      body: `Choose a byte and a parity setting and see the frame the way a scope shows it: start, data LSB-first, parity, stop. Then shift the receiver's rate a few percent and watch where its sampling points land.`,
      caption: `Illustrative waveform. The receiver's sample points (dots) must land inside each bit; a rate error moves them later and later across the frame until the stop bit is sampled in the wrong place.`,
    },
    {
      type: "concept",
      title: "Reading garbage as a clue",
      body: `**Nothing at all.** TX and RX are crossed the wrong way (the board's TX must go to the adapter's RX), the port is wrong, or the firmware never configured the pins as alternate function. Scope the board's TX pin: if it toggles at reset, the board is talking and the problem is the path.

**Garbage with the right rhythm.** Bursts arrive when you expect text, but the characters are wrong: a baud mismatch or a clock mismatch. Measure one bit on the scope. The shortest pulse in a burst is one bit-time; 1 ÷ (bit-time) is the real baud. If it is 8.68 µs the board is at 115 200 and your terminal is wrong. If it is 2.78 µs the board is running 3× fast and its clock configuration is wrong.

**Garbage that depends on the cable.** Intermittent, improves when you touch things: a missing or shared ground. UART needs a common ground; a cable with only TX and RX connected has no reference.

**Mostly 0xFF, or nothing, with a "serial" port that is really RS-232.** RS-232 swings ±3 V to ±15 V with inverted logic. Connect that to a 3.3 V pin and you get nonsense at best and a damaged pin at worst. Logic-level UART (0 to 3.3 V) and RS-232 need a transceiver between them.

**Occasional corrupt characters under load.** Receive overrun: the firmware did not read the data register before the next byte arrived. Check the overrun flag and move reception to an interrupt or DMA.`,
    },
    {
      type: "example",
      title: "Worked example: the 3× clock",
      body: `Bit period measured on the scope: **2.78 µs**. 1 ÷ 2.78 µs ≈ **360 kbaud**.

Expected: 115 200 baud, 8.68 µs. Ratio: 360 000 ÷ 115 200 = **3.125**.

The board's crystal is 25 MHz. The firmware's clock configuration header still says 8 MHz (the value of the vendor's evaluation board). The PLL multiplies whatever it is given, so the system clock is 3.125× faster than the firmware believes. Every timed thing is wrong by the same ratio: the 1 Hz heartbeat LED blinks at about 3 Hz, and the UART divider produces 360 kbaud.

Set the terminal to 360 kbaud and the text becomes readable, which proves the diagnosis, but that is not the fix. The fix is to correct the clock configuration so the firmware's idea of the clock matches the board, then re-verify the LED period and the bit time.`,
    },
    {
      type: "exercise",
      exercise: {
        kind: "single",
        id: "uart-lsb-first",
        skill: "uart",
        objective: "Decode a frame from the wire.",
        prompt: `A logic analyser shows, after the start bit, the data bits in time order **1, 1, 0, 0, 1, 0, 1, 0** (8N1). Which byte was sent?`,
        options: [
          { id: "a", text: "0xCA (1100 1010)", correct: false, feedback: `That reads the bits in time order as if the first were the most significant. UART sends the **least** significant bit first, so the first bit on the wire is bit 0.` },
          { id: "b", text: "0x53 (0101 0011)", correct: true, feedback: `Correct. Reversing the time order gives bit7…bit0 = 0,1,0,1,0,0,1,1 = 0x53, the ASCII character 'S'.` },
          { id: "c", text: "0x35 (0011 0101)", correct: false, feedback: `0x35 is 'S' with its nibbles swapped. The frame is reversed bit by bit, not nibble by nibble: 1,1,0,0,1,0,1,0 read backwards is 0,1,0,1,0,0,1,1.` },
          { id: "d", text: "0xAC (1010 1100)", correct: false, feedback: `That is the time-order value shifted by one position, as if the start bit were a data bit. The start bit is a framing bit and is not part of the byte.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "numeric",
        id: "usart-actual-baud",
        skill: "uart",
        objective: "Compute the actual baud an STM32 USART produces.",
        prompt: `An STM32 USART runs from a 42 MHz peripheral clock with 16× oversampling. For 115 200 baud, USARTDIV = 42 000 000 ÷ (16 × 115 200) = 22.786. The register can only hold a fraction in sixteenths, so the firmware programs 22 + 13/16 = 22.8125. What baud rate is actually generated? Give it to the nearest 10 baud.`,
        unit: "baud",
        answer: 115068,
        tolerance: 40,
        solution: `Actual baud = 42 000 000 ÷ (16 × 22.8125) = 42 000 000 ÷ 365 = **115 068 baud**, about 0.11 % below 115 200. Well inside the few-percent budget. The quantised fraction is why STM32 baud rates are rarely exact and why the reference manual publishes error tables.`,
        solvedFeedback: `Correct: about 115 070 baud, an error of 0.11 %. The receiver re-synchronises on every start bit, so an error this small never accumulates far enough to matter.`,
        misconceptions: [
          { value: 115200, tolerance: 20, feedback: `That is the target, not the result. The divider was rounded to 22.8125, so the generated rate is 42 000 000 ÷ (16 × 22.8125) ≈ 115 068 baud.` },
          { value: 1841200, tolerance: 2000, feedback: `You divided by the mantissa only (22.8125) and forgot the 16× oversampling. The bit rate is the sampling rate ÷ 16.` },
        ],
      },
    },
    {
      type: "exercise",
      exercise: {
        kind: "multi",
        id: "uart-garbage-causes",
        skill: "uart",
        objective: "Match terminal symptoms to physical and configuration causes.",
        prompt: `The terminal shows a burst of garbage characters every time the board resets, with a consistent rhythm, and a scope shows clean 0 to 3.3 V pulses on the board's TX pin with a shortest pulse of 8.7 µs. Select **every** cause still consistent with these observations.`,
        options: [
          { id: "a", text: "The terminal is set to 9600 baud.", correct: true, feedback: `Consistent. The board is transmitting at 115 200 (8.7 µs bits); a terminal at 9600 samples far too slowly and produces garbage with the right rhythm.` },
          { id: "b", text: "The board's clock configuration assumes the wrong crystal.", correct: false, feedback: `Not consistent. A wrong clock assumption changes the bit time. 8.7 µs is exactly 115 200 baud, so the board's clock and divider are right.` },
          { id: "c", text: "TX and RX are swapped.", correct: false, feedback: `Not consistent. Swapped pins give silence, not garbage: the terminal is listening to a line nobody drives.` },
          { id: "d", text: "The terminal is set to 7 data bits with even parity.", correct: true, feedback: `Consistent. A frame-format mismatch at the correct baud still scrambles characters, because the receiver assigns bits to the wrong positions and misreads the stop bit.` },
          { id: "e", text: "The adapter is an RS-232 device, not a logic-level one.", correct: false, feedback: `Not consistent with clean 0 to 3.3 V pulses being received at all; an RS-232 input expects ±V levels and would typically read the logic-level signal as a constant mark or nothing. It would also risk the pin in the other direction.` },
        ],
        solvedFeedback: `Right. The scope measurement fixes the board's rate at 115 200 and its levels at logic level, which leaves only the terminal's own settings, baud or frame format, as the culprit.`,
      },
    },
    {
      type: "interview",
      questionId: "uart-garbage-diagnosis",
      intro: `This question is popular because the answer shows whether you measure or guess. Lead with the scope.`,
    },
    {
      type: "recap",
      summary: `- Frame: idle high, start bit low, 8 data bits LSB first, optional parity, stop bit high. 115 200 8N1 is 8.68 µs per bit.
- The receiver resynchronises on each start bit; combined rate error must stay under about ±5 % over the frame, so each side is held to 2 to 3 %.
- STM32 baud = f_CK ÷ (16 × USARTDIV) with the fraction quantised to sixteenths; errors of 0.1 % are normal.
- Nothing: path or pins. Garbage with rhythm: baud or clock, measure one bit. Intermittent: ground. RS-232 levels need a transceiver.
- A clock-configuration error scales every timed behaviour by the same ratio: LED period and baud rate together.`,
      cards: [
        { id: "uart-1", front: "Order of bits in a UART frame?", back: "Start (low), data bits least-significant first, optional parity, stop (high). Line idles high." },
        { id: "uart-2", front: "Why must baud rates agree within a few percent?", back: "Timing error accumulates from the start bit; by the stop bit (10 bits later) the sampling point must still be inside the bit, so combined error must stay under roughly ±5 %." },
        { id: "uart-3", front: "Terminal shows rhythmic garbage; TX bit time measures 2.78 µs. Diagnosis?", back: "The board is sending at about 360 kbaud, 3.125× the expected 115 200: its clock configuration assumes the wrong crystal. Fix the clock config, not the terminal." },
        { id: "uart-4", front: "Terminal shows nothing at all. First check?", back: "Scope the board's TX pin at reset. If it toggles, the path is wrong (TX/RX swap, wrong port, no ground). If it does not, the firmware never drove the pin (alternate-function or clock enable)." },
        { id: "uart-5", front: "Can a 3.3 V UART pin connect to an RS-232 port directly?", back: "No. RS-232 uses ±3 to ±15 V with inverted logic; a transceiver (level shifter) is required in both directions." },
      ],
    },
  ],
};
