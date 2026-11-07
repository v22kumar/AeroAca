import type { Lesson } from "@/lib/content/schema";

export const arinc429WordsLabelsAndSsm: Lesson = {
  slug: "arinc-429-words-labels-and-ssm",
  moduleId: "avionics-buses",
  format: "arc",
  prerequisites: ["fixed-width-integers-overflow-shifts", "uart-framing-and-baud"],
  title: "ARINC 429: one talker, a 32-bit word, and a field that says whether to believe it",
  summary: "The civil-aviation data bus where one transmitter broadcasts to many receivers. Learn the 32-bit word field by field, how to decode a captured word by hand, and what the sign/status bits tell a receiver to do.",
  durationMinutes: 15,
  whyItMatters: "ARINC 429 is on the skills line of most avionics roles, and panels ask the same three things: the word layout, how a label is read, and what the status bits mean. Decoding a word by hand, in front of someone, is the difference between having read about it and having used it.",
  objectives: [
    "Explain in plain words how ARINC 429 differs from a command/response bus such as MIL-STD-1553B.",
    "Draw the 32-bit word and name every field: label, source/destination identifier, data, sign/status matrix, parity.",
    "Decode a captured word by hand, including the bit-reversed label and a two's-complement data field.",
    "Say what each sign/status value tells a receiver to do with the number, and why parity alone is not enough.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Word layout (label bits 1–8, SDI 9–10, data 11–29, SSM 30–31, odd parity 32), speeds (12.5 and 100 kbit/s), the four-bit-time minimum gap, one transmitter and up to 20 receivers per bus, and the SSM meanings for BNR, BCD and discrete data follow the ARINC 429 Part 1 specification as summarised in public references. Label 203 and its 1 ft resolution are used as a SYNTHETIC example: real label meanings, ranges and resolutions come from the ARINC 429 label tables and the equipment's ICD. The lab's words were computed and checked by hand.",
  },
  references: [
    { title: "ARINC Specification 429 Part 1, Digital Information Transfer System (DITS)", note: "Word format, label and SSM definitions, electrical characteristics (licensed document; consult your organisation's copy)." },
    { title: "Public tutorials on ARINC 429 word format and labels (for example from avionics bus-interface vendors)", note: "Freely available summaries of the same layout used here." },
    { title: "Lesson: MIL-STD-1553B: the word and the message", note: "The command/response bus this one is contrasted with." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The altitude that turns into dashes",
      body: `On a bench rig, an air-data computer sends an altitude to a display unit. Most of the time the display shows 35 000 ft. Every few seconds it shows dashes for a moment and then returns.

The display's engineer says "the altitude is bad". The air-data engineer says "my altitude is fine; I send it every 50 ms". Both are describing the same wire.

A bus analyser captures the words. The numbers in the data field never change. Two bits near the end of the word do. When you finish this lesson you will be able to read those two bits, and you will see that nobody was lying: the sender was telling the receiver, in every word, whether to believe the number.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "A radio broadcast, not a conversation",
      body: `A 1553 bus is a conversation: a controller asks, a terminal answers. ARINC 429 is a **radio broadcast**.

One device, the **transmitter**, sends on a pair of wires. Up to 20 devices, the **receivers**, listen. Receivers never answer. If a receiver wants to talk back, it has its own transmitter and its own pair of wires.

Because nobody replies, every word has to explain itself. Each word carries a **label** that says what the number is ("this is altitude"), and a small **status field** that says whether to believe it ("this is a good value", "I have nothing computed", "I am in test").

The transmitter simply sends its words again and again on a fixed schedule, like a station repeating the time. A receiver that stops hearing a word knows something is wrong by the silence.`,
    },
    {
      type: "figure",
      stage: "how",
      depth: "understand",
      title: "The 32-bit word",
      diagram: "arinc429-word",
      alt: "ARINC 429 32 bit word layout: label, source destination identifier, data field, sign status matrix and parity.",
      caption: "Five fields in 32 bits: the label (8), the source/destination identifier (2), the data (19 here), the sign/status matrix (2) and the parity bit (1).",
      body: `Look at the proportions: most of the word is data. The label and the status are small, but they decide what the data means and whether it can be used.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The five fields, one at a time",
      body: `Bits are numbered 1 to 32 in the order they are sent.

- **Label (bits 1–8).** An eight-bit code, written as three **octal** digits (for example 203). It says what kind of data this is. The meaning of each label is defined in tables and in the equipment's interface control document, not in the word.
- **SDI (bits 9–10).** The **source/destination identifier**. When several equipment of the same kind share a label (two air-data computers, say), the SDI says which one this word is from or for.
- **Data (bits 11–29).** The 19 bits of payload. It may be a binary number (**BNR**, a two's-complement fraction or integer), binary-coded decimal (**BCD**), or a set of yes/no flags (**discrete**).
- **SSM (bits 30–31).** The **sign/status matrix**: two bits whose meaning depends on the data type. For BNR: 00 failure warning, 01 no computed data, 10 functional test, 11 **normal operation**.
- **Parity (bit 32).** Chosen so the total number of ones in the 32 bits is **odd**.

Speed is 12.5 or 100 kbit/s on a twisted pair. A word never starts closer than four bit times of silence after the previous one.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The label is written backwards",
      body: `Here is the detail that catches people the first time.

The label is sent **most significant bit first**. Everything else is sent **least significant bit first**. A receiver that stores the word in a 32-bit register with the first bit received as the least significant bit therefore finds the **label's bits in reverse order** in the bottom byte.

To read the label, take the low eight bits and **reverse them**, then write the result in octal.

Example. The bottom byte of a received word is \`0xC1\` = \`1100 0001\`.

1. Reverse the eight bits: \`1000 0011\`.
2. Group them in threes from the right: \`10 | 000 | 011\`.
3. Each group is an octal digit: **2, 0, 3**.

The label is **203**. If you forget to reverse, you read 301 and look up the wrong thing. This single step is the most common ARINC 429 decoding mistake.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: decode 0x6222E0C1 by hand",
      body: `A capture shows the 32-bit word **0x6222E0C1**. Write it in binary, in groups of four:

\`0110 0010 0010 0010 1110 0000 1100 0001\`

**Label.** The low byte is 1100 0001. Reversed: 1000 0011 = 0x83 = octal **203**.

**SDI.** The next two bits up (register bits 9–8) are 00 → **0**.

**Data.** Register bits 28 down to 10 are \`0 0010 0010 0010 1110 00\`. Joined: 0001000100010111000 = 0x88B8 = **35 000**. The top bit of the 19-bit field is 0, so it is positive: 35 000 counts. With the synthetic resolution of 1 ft per count this is **35 000 ft**.

**SSM.** Register bits 30–29 are 11 → **normal operation**. The number can be used.

**Parity.** Count the ones: label 3, data 6, SSM 2, the rest 0: total 11, **odd**. Parity bit 0 is correct.

**Reading:** label 203 from source 0, altitude 35 000 ft, normal operation, parity good. Now compare with the scenario's dashes: the same word with SSM = 01 would be "no computed data", and the display is right to show dashes.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "a429-label-guided",
        skill: "avionics-buses",
        objective: "Read a label out of the bottom byte (guided).",
        prompt: `The bottom byte of a received ARINC 429 word is **0x13**. What is the label, written as the three octal digits (give it as a number, for example 203)?`,
        unit: "",
        answer: 310,
        tolerance: 0,
        hints: [
          `Write 0x13 in binary: 0001 0011.`,
          `Reverse all eight bits: 1100 1000.`,
          `Group in threes from the right: 11 | 001 | 000. Each group is an octal digit.`,
        ],
        solution: `0x13 = 0001 0011. Reversed: 1100 1000 = 11 | 001 | 000 = octal **310**. (The lab prints this same pair: label 310 is transmitted as 0x13 in the register.)`,
        solvedFeedback: `Right: 310. Reverse first, then group.`,
        misconceptions: [
          { value: 23, tolerance: 0, feedback: `0x13 is 23 in octal when read directly (0o23). The label is the bit-reversed byte, so reverse 0001 0011 to 1100 1000 first, then read octal: 310.` },
          { value: 19, tolerance: 0, feedback: `19 is 0x13 in decimal. The label is read in octal, after reversing the bits of the byte: 310.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "Decoding a word in Python, line by line",
      intro: `The lab's decoder is nine lines. Reading it against the hand decode above is the quickest way to make the fields stick.`,
      language: "python",
      code: `def decode(word, resolution, data_bits=19):
    label = reverse8(word & 0xFF)
    sdi = (word >> 8) & 3
    data = (word >> 10) & ((1 << data_bits) - 1)
    if data >= 1 << (data_bits - 1):
        data -= 1 << data_bits
    ssm = (word >> 29) & 3
    parity_ok = bin(word).count("1") % 2 == 1
    return {"label": f"{label:03o}", "sdi": sdi, "value": data * resolution, "ssm": ssm, "parity_ok": parity_ok}`,
      notes: [
        { lines: "2", text: `Take the **low eight bits** with \`& 0xFF\` and **reverse** them, because the label arrives bit-reversed. Formatting the result with \`:03o\` prints three octal digits.` },
        { lines: "3", text: `Shift right by 8 to drop the label, then keep two bits: the **SDI**.` },
        { lines: "4", text: `Shift right by 10 and mask 19 ones: the **data field**. \`(1 << 19) - 1\` is a string of nineteen ones.` },
        { lines: "5-6", text: `The data is **two's complement**. If its top bit (bit 18) is set the number is negative, so subtract 2¹⁹. This is how 0x7FF06 becomes −250.` },
        { lines: "7", text: `Shift right by 29 and keep two bits: the **SSM**.` },
        { lines: "8", text: `**Odd parity**: the number of ones in the whole word must be odd. \`bin(word).count("1")\` counts them. If the count is even, the word is corrupt.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: encode and decode four altitude words",
      lab: "py-a429",
      body: `The program encodes an altitude into a word (label 203, a synthetic field), decodes it again, and shows what happens with a negative altitude, with the SSM set to failure warning, and with one bit flipped in transit. Predict each result before you run it: in particular, which of the four words fail the parity check, and which one has a perfectly valid parity but a status that tells the receiver not to use the number.`,
      tryNext: `Change the data resolution to 0.5 ft per count and encode 35 000.5 ft. Then flip two bits in the word instead of one and see whether the parity check notices. What does that tell you about what parity can and cannot catch?`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "a429-bnr-value",
        skill: "avionics-buses",
        objective: "Decode a two's-complement BNR data field.",
        prompt: `The 19-bit data field of a received word is **0x7FF06**. The field's resolution is 1 ft per count. What altitude does it represent, in feet?`,
        unit: "ft",
        answer: -250,
        tolerance: 0,
        solution: `0x7FF06 = 524 038. The top bit of a 19-bit field is bit 18; 0x7FF06 has it set (0x40000 is the top bit), so the number is negative: 524 038 − 2¹⁹ (524 288) = **−250**. At 1 ft per count: −250 ft.`,
        solvedFeedback: `Right: −250 ft. A set top bit means subtract 2^19.`,
        misconceptions: [
          { value: 524038, tolerance: 0, feedback: `That reads the field as an unsigned number. BNR data is two's complement: the top bit is the sign, and 0x7FF06 has it set. Subtract 2^19 = 524 288: −250.` },
          { value: 250, tolerance: 0, feedback: `The magnitude is right, the sign is not. The set top bit means the value is negative: −250.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "single",
        id: "a429-ssm-reading",
        skill: "avionics-buses",
        objective: "Decide what a receiver does with a status value.",
        prompt: `A BNR word with label 203 arrives with a correct parity bit and a data field that looks like a sensible altitude, but its SSM is **01** (no computed data). What should the receiver do?`,
        options: [
          { id: "a", text: "Use the altitude; the parity bit is correct, so the word is good.", correct: false, feedback: `Parity only says no single bit flipped in transit. The SSM is the sender telling you not to use the number, and it overrides a plausible-looking value.` },
          { id: "b", text: "Do not use the number; treat the parameter as unavailable (for example show dashes), and keep watching for the status to return to normal.", correct: true, feedback: `Yes. 01 means no computed data: the data field may hold a last value or zeros and is not valid. Showing dashes is the correct display behaviour, and it is what the scenario's display did.` },
          { id: "c", text: "Treat it as a bus fault and stop listening to the transmitter.", correct: false, feedback: `The transmitter is working and telling you so. A bus fault would show as parity errors, missing words or a timeout, not as a clean word with an honest status.` },
          { id: "d", text: "Ask the transmitter to resend; it will answer.", correct: false, feedback: `ARINC 429 is a one-way broadcast. Receivers cannot ask; they wait for the next scheduled word.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What 429 cannot tell you, and what receivers must do",
      body: `Three gaps in the bus are filled by the receiver, and a design review checks that they are.

**The status field changes meaning by data type.** For BNR, 11 is normal and 00 is a failure warning. For BCD, 00 and 11 mean plus and minus, and 01 is no computed data. For discrete words, 00 is normal and 11 is failure. A receiver that treats every SSM as "11 is good" misreads discrete words.

**Silence is not signalled.** If the transmitter stops, nothing arrives. The receiver needs its own **timeout**: "no new word with this label within, say, twice the update period means the data is failed." That timeout is written in the ICD.

**Parity detects only odd numbers of flipped bits.** Two flipped bits give a valid parity and a wrong altitude. There is no CRC. Equipment compensates with plausibility checks (rate-of-change limits), duplicated sources compared in a voter, and the SSM itself.

Timing is the last trap. At 12.5 kbit/s a word is 32 bits plus a four-bit gap, 36 bit times. That is 36 / 12 500 = **2.88 ms** per word, so a transmitter can send about 347 words a second; at 100 kbit/s the same 36 bit times take 0.36 ms. Update rates of different labels have to fit inside that.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "numeric",
        id: "a429-word-time",
        skill: "avionics-buses",
        objective: "Compute the time budget of a low-speed ARINC 429 bus.",
        prompt: `At the low speed of 12.5 kbit/s, how long does one word take including the minimum four-bit gap, in milliseconds? (Give two decimal places.)`,
        unit: "ms",
        answer: 2.88,
        tolerance: 0.01,
        solution: `A word is 32 bits plus a gap of at least 4 bit times: 36 bit times. One bit time at 12.5 kbit/s is 1 / 12 500 s = 80 µs. 36 × 80 µs = 2880 µs = **2.88 ms**.`,
        solvedFeedback: `Right: 2.88 ms. Bit times, not bits per second, are the way to the answer.`,
        misconceptions: [
          { value: 2.56, tolerance: 0.01, feedback: `2.56 ms is the 32 bits alone. The minimum four-bit gap is part of the budget: 36 bit times × 80 µs = 2.88 ms.` },
          { value: 0.36, tolerance: 0.01, feedback: `0.36 ms is the figure for the high speed, 100 kbit/s. At 12.5 kbit/s a bit time is 80 µs, so 36 bit times = 2.88 ms.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "arinc-429-word-and-ssm",
      intro: `Draw the word, decode one aloud, and say what the receiver is responsible for that the bus does not do.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** An ARINC 429 receiver driver is a bit-field decoder with a timeout per label; the walkthrough is the core of it.
- **Aerospace and UAV systems.** Air data, inertial and display equipment on transport aircraft talk 429; mixed architectures put a 1553 bus beside it, and a gateway between the two.
- **R&D and design.** Choosing which label updates at which rate is a bandwidth budget; a plausibility check and a data-age timeout are standard defensive design.
- **Verification and interviews.** "What does the SSM tell the receiver?" and "decode this word" are the usual panel questions. The test-case version is: send each SSM value and check the receiver's behaviour for every one.`,
    },
    {
      type: "recap",
      summary: `- ARINC 429 is a one-way broadcast: one transmitter, up to 20 receivers per pair, no reply. Words repeat on a schedule.
- 32 bits: label (1–8, octal, sent MSB first), SDI (9–10), data (11–29), SSM (30–31), odd parity (32). 12.5 or 100 kbit/s; at least four bit times between words.
- To read the label: reverse the low eight bits, then write octal. BNR data is two's complement.
- The SSM tells the receiver whether to use the number; its meaning depends on the data type (BNR, BCD, discrete).
- The receiver supplies what the bus does not: a timeout for silence, plausibility checks, and the right SSM interpretation. Parity catches odd numbers of flipped bits only.`,
      cards: [
        { id: "a429-1", front: "Fields of an ARINC 429 word?", back: "Label bits 1–8 (octal), SDI 9–10, data 11–29, SSM 30–31, odd parity bit 32. 12.5 or 100 kbit/s, one transmitter, up to 20 receivers, at least four bit times between words." },
        { id: "a429-2", front: "How do you read the label from a captured register value?", back: "Take the low eight bits, reverse their order (the label is sent MSB first, the rest LSB first), then read the result as three octal digits. Example: 0xC1 → 1000 0011 → octal 203." },
        { id: "a429-3", front: "What does SSM 01 mean on a BNR word?", back: "No computed data: the transmitter is working but the value is not valid; do not use the number (show dashes). 00 is failure warning, 10 functional test, 11 normal operation. Meanings differ for BCD and discrete words." },
        { id: "a429-4", front: "What must an ARINC 429 receiver do that the bus does not?", back: "Time out when a label's word stops arriving, apply plausibility checks (parity misses double-bit errors; there is no CRC), and interpret the SSM correctly for each data type." },
      ],
    },
  ],
};
