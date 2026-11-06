import type { Lesson } from "@/lib/content/schema";

export const rs422Rs485AndFramedSerialWithCrc: Lesson = {
  slug: "rs-422-rs-485-and-framed-serial-with-crc",
  moduleId: "avionics-buses",
  format: "arc",
  prerequisites: ["uart-framing-and-baud", "logic-levels-thresholds-and-open-drain"],
  title: "RS-422 and RS-485: differential links, termination, and frames you can trust",
  summary: "The workhorse serial links between cards, boxes and test rigs. Learn why two wires beat one, where the terminators and the bias go, how a half-duplex line turns around, and how a CRC lets a receiver reject a damaged frame.",
  durationMinutes: 15,
  whyItMatters: "Point-to-point RS-422 between flight-computer cards and multi-drop RS-485 for instruments and sensors are everywhere in avionics and industrial work. Interviewers ask why they are differential, where the 120 Ω goes and what a CRC buys you; a working answer needs the numbers and one real failure story.",
  objectives: [
    "Explain why a differential pair rejects noise that a single wire does not, in plain words.",
    "Compare RS-232, RS-422 and RS-485 by wiring, number of drivers and receivers, and speed and length rules of thumb.",
    "Place termination and failsafe bias correctly and compute the idle voltage the bias network gives.",
    "Frame a message with a length and a CRC-16, compute and check the CRC, and explain what a CRC does and does not guarantee.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Electrical characteristics follow TIA/EIA-422 and TIA/EIA-485: differential signalling, receiver sensitivity of ±200 mV, one driver and up to ten receivers on RS-422, 32 unit loads on RS-485, 120 Ω terminations at the two ends. Speed-versus-length figures are the usual rules of thumb from the standards' curves, not guarantees. CRC-16/MODBUS parameters and the check value 0x4B37 for \"123456789\" and the example frame come from the Modbus RTU specification and public CRC catalogues and were reproduced by the lab.",
  },
  references: [
    { title: "TIA/EIA-422-B and TIA/EIA-485-A, electrical characteristics of balanced digital interfaces", note: "Differential voltage levels, receiver sensitivity, loading." },
    { title: "Texas Instruments application note: RS-485 design guide (SLLA272)", note: "Termination, failsafe bias and layout; free to download." },
    { title: "Modbus over serial line specification and implementation guide", note: "RTU framing and the CRC-16 used in the lab." },
    { title: "Lesson: UART framing and baud tolerance", note: "The byte-level frame these links carry." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "Garbage when nobody is talking",
      body: `A test rig has four instruments on one RS-485 pair, polled by a PC once a second. The polling works. But the PC's serial log fills, between polls, with a few random bytes every minute or so, and now and then one of them is read as the start of a reply, so the next real reply is rejected.

Nobody is transmitting during those quiet moments. The engineer scopes the pair between polls: it is not a clean steady level. It wanders, a few tens of millivolts either side of zero, and every so often it crosses far enough to look like a start bit to one receiver.

The fix costs two resistors. To see why, you need to know how a differential line represents a 1, a 0, and nothing at all.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "Two wires, and only the difference counts",
      body: `Imagine two people carrying a long plank between them down a bumpy path. If the ground shakes, both of them are lifted by the same amount. The plank stays level. What matters is how the plank **tilts**, not how high it is.

A **differential** link works the same way. The sender drives two wires, A and B, in opposite directions: when A goes up, B goes down. The receiver does not measure either wire against ground. It measures **A minus B**, the tilt.

Noise that lands on the cable (a motor starting nearby, a ground that is a volt higher at the far end) shifts both wires together. The tilt does not change. The noise vanishes from the result.

A single-wire link such as RS-232 measures one wire against a ground reference, so every volt of noise and every volt of ground difference arrives straight at the receiver. That is why RS-232 is for a few metres and RS-422 or RS-485 are for hundreds.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "RS-232, RS-422, RS-485 side by side",
      body: `| | RS-232 | RS-422 | RS-485 |
|---|---|---|---|
| Signalling | single-ended, ±3 to ±15 V | differential | differential |
| Drivers on a line | 1 | 1 | many |
| Receivers on a line | 1 | up to 10 | up to 32 unit loads (more with modern parts) |
| Wiring | TX, RX, ground (full duplex) | two pairs (full duplex) | one pair (half duplex) |
| Rule of thumb | metres, up to about 115 kbit/s | up to 10 Mbit/s over short runs, about 1 km at low rates | same speeds and lengths |

The receiver decides a 1 or a 0 from the **difference** between A and B. It must be at least **±200 mV** to be sure; between −200 mV and +200 mV the result is not guaranteed.

**RS-422** is for a pair of devices, or one sender and a few listeners, each direction with its own pair. **RS-485** lets many devices share **one** pair, so only one may talk at a time, and the rest listen. That is **half duplex**, and it needs a rule for who talks when, called the protocol.

Neither standard says anything about the bytes. They define only the voltages. The framing, addressing and error checking are yours to define.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Terminators and the bias that holds the idle level",
      body: `A fast edge travelling down a cable reflects from the end unless the end looks like the cable. A twisted pair is about 100 to 120 Ω, so put a **120 Ω resistor across the pair at each end** of the cable, and **only** at the two ends. Not in the middle, not at a stub.

Two 120 Ω resistors in parallel look like **60 Ω** to a driver, which it must be able to drive.

Now the scenario. When every driver is switched off, nothing holds the pair at a defined voltage. The pair floats, and a receiver sees noise around 0 V, which is inside the undefined band.

The cure is **failsafe bias**: one resistor pulls line B up to the supply, one pulls line A down to ground. They create a small steady voltage across the terminators, so the idle line sits at a valid 1 when nobody talks.

Example: 5 V supply, two 560 Ω bias resistors, 60 Ω of termination. The divider is 560 + 60 + 560 = 1180 Ω, and the voltage across the 60 Ω is 5 × 60 / 1180 = **254 mV**, just above the 200 mV threshold. Fit the bias in **one place** only.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Framing a message, and what a CRC adds",
      body: `A serial line delivers bytes. It does not say where a message starts or whether it arrived intact. A **frame** adds that: a start marker, a length, the payload, and a check value at the end.

A **CRC** (cyclic redundancy check) is the check value. The sender treats the message as one huge binary number, divides it by a fixed polynomial and sends the remainder. The receiver does the same division over what arrived. If the remainders match, the message is almost certainly intact.

A good 16-bit CRC, such as the one used here, is guaranteed to catch every single-bit error, every odd number of flipped bits, and every burst of errors up to 16 bits long. A random damaged frame slips through with probability about 1 in 65 536.

It does **not** correct anything, and it cannot say who sent the frame or whether the number inside is sensible. A CRC is worthless unless the receiver **rejects** a frame that fails, and **counts** the rejections.

"CRC-16" names a family. The polynomial, the starting value and the bit order must be agreed. Modbus uses CRC-16 with polynomial 0xA001 (reflected 0x8005), starting at 0xFFFF; the "check value" for the text 123456789 is 0x4B37.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: accept or reject this frame",
      body: `A Modbus master asked a slave for three registers and received this response, eleven bytes, shown in hex:

\`11 03 06 AE 41 56 52 43 40 49 AD\`

**Step 1: split it.** The last two bytes are the CRC, \`49 AD\`. Modbus sends the CRC **low byte first**, so the CRC value is 0xAD49. Everything before it, nine bytes, is the message.

**Step 2: compute the CRC over the nine bytes.** Running the routine in the next step gives **0xAD49**.

**Step 3: compare.** Computed 0xAD49, received 0xAD49. They match: **accept**. The three register values are 44 609, 22 098 and 17 216.

**Now damage one bit.** Flip the lowest bit of the fifth byte, 0x41 becomes 0x40. The computed CRC becomes **0x6D74**. The received CRC is still 0xAD49. They differ: **reject**.

**What would have happened without the check?** The first register would read 44 608 instead of 44 609. Off by one, plausible, and wrong, with nothing to say so. A single flipped bit is all it takes.

**The rule:** accept on a match, reject on a mismatch, and add one to a counter of rejected frames.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "term-parallel-guided",
        skill: "avionics-buses",
        objective: "Find the load a driver sees on a terminated bus (guided).",
        prompt: `A 485 bus has a 120 Ω terminator at each end of the cable and nothing else loading it. What resistance, in ohms, does a driver in the middle of the bus see across its two output wires?`,
        unit: "Ω",
        answer: 60,
        tolerance: 0.5,
        hints: [
          `Both terminators sit across the same pair of wires, so they are in parallel.`,
          `Two equal resistors in parallel give half the value of one.`,
          `Half of 120 Ω.`,
        ],
        solution: `Two 120 Ω resistors in parallel: (120 × 120) / (120 + 120) = **60 Ω**. That is the load the driver must be able to drive; drivers are specified for exactly this.`,
        solvedFeedback: `Right: 60 Ω. A third terminator in the middle would make it 40 Ω and also cause reflections, which is why there are only two.`,
        misconceptions: [
          { value: 240, tolerance: 0.5, feedback: `240 Ω is the two resistors in series. They are connected across the same two wires at opposite ends, which puts them in parallel: 60 Ω.` },
          { value: 120, tolerance: 0.5, feedback: `That is one terminator. The driver sees both, in parallel: 60 Ω.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "Computing a CRC-16, line by line",
      intro: `The whole CRC is eight lines of C. This is the routine the lab runs, with its check value.`,
      language: "c",
      code: `static uint16_t crc16_modbus(const uint8_t *data, size_t len) {
    uint16_t crc = 0xFFFFu;
    for (size_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (int b = 0; b < 8; b++)
            crc = (crc & 1u) ? (uint16_t)((crc >> 1) ^ 0xA001u)
                             : (uint16_t)(crc >> 1);
    }
    return crc;
}`,
      notes: [
        { lines: "2", text: `Start at **0xFFFF**. A non-zero start value means a message of leading zero bytes still changes the CRC, so lost zeros are noticed.` },
        { lines: "3-4", text: `Take the message one byte at a time and **XOR** it into the low byte of the running value. Each byte is mixed in before the shifting.` },
        { lines: "5-7", text: `For each of the eight bits, shift right by one. If the bit that fell off was a 1, XOR in the **polynomial 0xA001**. That conditional XOR is the division, one bit at a time.` },
        { lines: "9", text: `Return the final value. For Modbus it is sent **low byte first**; check it by computing the text "123456789": the result must be 0x4B37.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: check value, a frame, and one flipped bit",
      lab: "c-crc16",
      body: `The program computes the standard check value, builds the CRC of a Modbus request, verifies a received response, then flips one bit in the response and shows the CRC rejecting it. Notice the last line: it shows what a receiver that did not check the CRC would have used.`,
      tryNext: `Flip a different bit, then two bits in different bytes, and run it again. Predict first: will the CRC notice? Then change the starting value from 0xFFFF to 0x0000 and see which frames still verify. What does that tell you about agreeing the parameters?`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "bias-idle-voltage",
        skill: "avionics-buses",
        objective: "Compute the idle differential voltage a bias network gives.",
        prompt: `An RS-485 bus has 120 Ω terminators at both ends (60 Ω in parallel), a 5 V supply, and failsafe bias of **680 Ω** from the supply to line B and **680 Ω** from line A to ground. What differential voltage appears across the line when nobody is driving, in millivolts?`,
        unit: "mV",
        answer: 211,
        tolerance: 3,
        solution: `The three resistances form one divider across 5 V: 680 + 60 + 680 = 1420 Ω. The line sits across the 60 Ω: 5 × 60 / 1420 = 300 / 1420 = **0.211 V = 211 mV**.`,
        solvedFeedback: `Right, about 211 mV. That is above the receivers' ±200 mV threshold, but only just: the margin is 11 mV. A designer would choose smaller bias resistors for more margin.`,
        misconceptions: [
          { value: 254, tolerance: 3, feedback: `254 mV is the answer for 560 Ω bias resistors, the example in the text. With 680 Ω each the divider is 680 + 60 + 680 = 1420 Ω: 5 × 60 / 1420 = 211 mV.` },
          { value: 405, tolerance: 4, feedback: `You used one 120 Ω terminator. Both terminators are across the line, in parallel: 60 Ω. Then 5 × 60 / (680 + 60 + 680) = 211 mV.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "The last byte that was never sent: half-duplex turnaround",
      body: `On a half-duplex RS-485 link, the microcontroller has a pin that switches the transceiver between **sending** and **listening**. After the last byte of a frame the firmware must release it, so the next device can talk.

The classic bug: firmware releases the pin as soon as the UART says its **transmit data register is empty**. That happens when the last byte has been handed to the shift register, **not** when its last bit has left the pin. Release the pin then and the last byte is cut short. The receiver gets a frame whose last byte, usually the CRC, is damaged. **Every** frame fails its CRC, at every baud rate fast enough to expose it.

The fix is to wait for **transmission complete**, the flag that says the shift register is empty too, before turning the driver off, and to add a small delay if the transceiver needs one.

Other trade-offs the review will ask about:

- **Stubs** off the main cable cause reflections; keep them very short.
- **Ground difference** between boxes can exceed the common-mode range; a ground wire or isolation fixes it.
- **A babbling node** that never releases the line takes the whole bus down. A timeout and a fault-injection test belong in the plan.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "rs485-faults",
        skill: "avionics-buses",
        objective: "Match symptoms of an RS-485 link to their causes.",
        prompt: `Select **every** diagnosis that is consistent with its symptom.`,
        options: [
          { id: "a", text: "Random stray bytes between polls, mostly at the receiver nearest the master → the line floats when idle: add failsafe bias (once).", correct: true, feedback: `The scenario exactly: an undefined idle level decoded as start bits.` },
          { id: "b", text: "Every frame fails its CRC, always on the last byte, only at the higher baud rates → the driver is released before the last byte has left (transmit-empty used instead of transmit-complete).", correct: true, feedback: `The turnaround bug. It looks like a speed problem and is a timing bug in firmware.` },
          { id: "c", text: "Reliable at 9600 baud, corrupt at 1 Mbaud on a 30 m cable with no terminators → increase the receiver's input threshold.", correct: false, feedback: `The receiver threshold is fixed by the standard. The missing terminators are the reflection source; add the two 120 Ω resistors.` },
          { id: "d", text: "A fifth terminator in the middle of the cable improves the signal → true, extra terminators always help.", correct: false, feedback: `A terminator in the middle loads the driver down (40 Ω with three) and still leaves reflections from the stubs. Terminate at the two ends only.` },
        ],
        solvedFeedback: `Right: bias for idle noise, transmit-complete for the truncated last byte, terminators at the ends for reflections.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "rs-422-485-link-design",
      intro: `Compare the three standards, place the terminators and the bias, and tell one failure story with its measurement.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** An RS-485 driver is a UART plus a direction pin plus a frame parser; the turnaround bug and the CRC routine are standard interview code.
- **Aerospace and UAV systems.** Point-to-point RS-422 links join flight-computer cards, payloads and ground-support equipment; the framing and CRC are what make the link defensible in a test report.
- **R&D and design.** Termination, bias and the transceiver choice are schematic decisions; the bias arithmetic is a calculation you show in a design review.
- **Verification and interviews.** "Why differential?", "where does the 120 Ω go?" and "what does a CRC guarantee?" are near-certain questions; a corrupted-frame test is one of the first fault-injection cases.`,
    },
    {
      type: "recap",
      summary: `- Differential links measure A minus B, so noise common to both wires cancels. RS-232 is single-ended and short; RS-422 is point to multi-drop with two pairs; RS-485 is one shared half-duplex pair.
- Receivers need at least ±200 mV; terminate with 120 Ω at the two ends only (60 Ω seen by a driver); fit failsafe bias once so the idle line is a valid 1.
- A frame is a start marker, a length, a payload and a CRC. A 16-bit CRC catches all single-bit, odd-count and ≤16-bit burst errors; the receiver must reject and count failures.
- CRC-16 names a family: agree polynomial, initial value and bit order (Modbus: 0xA001, 0xFFFF; check value 0x4B37).
- Half-duplex firmware must release the driver on transmission-complete, not transmit-empty.`,
      cards: [
        { id: "rs422-1", front: "Why is a differential link robust against noise?", back: "The receiver measures the difference between the two wires; noise and ground shifts hit both wires equally and cancel in the difference. A single-ended link measures against ground and receives all of it." },
        { id: "rs422-2", front: "Where do the terminators and the failsafe bias go on an RS-485 bus?", back: "120 Ω across the pair at the two ends of the cable only (60 Ω seen by a driver). Failsafe bias once, pulling B up and A down, so the idle line gives more than 200 mV." },
        { id: "rs422-3", front: "What does a 16-bit CRC guarantee, and what does it not?", back: "It detects every single-bit error, every odd number of flipped bits and every burst up to 16 bits; a random corruption passes with probability about 1 in 65 536. It corrects nothing, does not authenticate, and does nothing unless the receiver rejects failing frames." },
        { id: "rs422-4", front: "Why does a half-duplex link corrupt the last byte of every frame?", back: "The driver is released when the UART's transmit data register is empty, before the shift register has finished. Wait for transmission complete before switching the transceiver to receive." },
      ],
    },
  ],
};
