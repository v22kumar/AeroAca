import type { Lesson } from "@/lib/content/schema";

/**
 * Teaching format 2.0 pilot lesson: an advanced avionics topic taught from zero inside the app.
 * Lives in the interfaces module until the avionics data-bus module exists.
 */
export const milStd1553bTheWordAndTheMessage: Lesson = {
  slug: "mil-std-1553b-the-word-and-the-message",
  moduleId: "interfaces",
  format: "arc",
  prerequisites: ["uart-framing-and-baud", "fixed-width-integers-overflow-shifts"],
  title: "MIL-STD-1553B: the word and the message",
  summary: "The data bus of military aircraft and many satellites, from the wire up: how a bit is coded, what the 20-bit word carries, the three word types, how a bus controller and its terminals talk, and how to read a captured word by hand.",
  durationMinutes: 16,
  whyItMatters: "MIL-STD-1553B appears on the skills line of most avionics job descriptions and in every avionics integration lab. Being able to decode a captured command word by hand, and to say why a terminal did not answer, is the difference between 'familiar with' and 'has used'.",
  objectives: [
    "Explain in plain words how one bus with one controller and many terminals stays orderly.",
    "Describe the physical layer: 1 Mbit/s, Manchester II coding, dual redundant shielded twisted pair.",
    "Build and decode a 20-bit word: sync, 16 data bits, odd parity; name the fields of command, status and data words.",
    "Walk through the three message formats and their timing, and list the reasons a terminal does not respond.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Word formats, field widths, timing figures (response time 4 to 12 µs, intermessage gap at least 4 µs, no-response timeout 14 µs) and mode-code conventions follow MIL-STD-1553B and its Notice 2. The lab's parity values were computed and checked by hand. Example terminal addresses and subaddresses are synthetic.",
  },
  references: [
    { title: "MIL-STD-1553B, Digital Time Division Command/Response Multiplex Data Bus (with Notice 2)", note: "Sections 4.3 (word formats), 4.3.3.5 (message formats), 4.3.3.7 (response and intermessage times)." },
    { title: "MIL-HDBK-1553A, Multiplex Applications Handbook", note: "Tutorial material on coupling, cabling and typical terminal designs." },
    { title: "Lesson: UART framing and baud tolerance", note: "The serial frame this lesson builds on; 1553 replaces start/stop bits with sync and Manchester coding." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The terminal that never answered",
      body: `A bus analyser is connected to the avionics bus of a test rig. The bus controller sends a command to terminal 5 every 20 ms, and terminal 5 answers every time: a status word, then four data words.

One command, sent every two seconds, gets **no answer at all**. The analyser marks it "no response". The team suspects the cable, then the terminal's firmware, and swaps both. The silence continues.

The engineer who finds it does not touch the hardware. She reads the command word on the analyser as sixteen bits, splits them into their fields by hand, and sees that the command asks terminal 5 for something it was never designed to supply. The terminal is behaving exactly as the standard says it should.

To do what she did you need to know what a 1553 word is, bit by bit. That is this lesson.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "One wire, one boss, many terminals",
      body: `Think of a classroom where only the teacher may start a conversation. The teacher names a student and asks a question; that student answers; nobody else speaks until the teacher names them. There is never a collision, because there is never a moment when two people might start talking at once.

MIL-STD-1553B works like that classroom. One device, the **bus controller**, decides who speaks and when. Every other device is a **remote terminal**; it speaks only when the controller addresses it, and only to say what it was asked. A **bus monitor** listens to everything and records it, like a note-taker who never speaks.

Everything on the bus is said in fixed-size **words**, each the same length, each starting with a distinctive pattern so the listener knows where a word begins, and each ending with a check bit so the listener knows whether it heard correctly.

That is already enough to explain why the bus is so predictable: there is one boss, every exchange is a question followed by an answer, and every word has the same shape. The rest of the lesson is the exact shape of the word and the exact rules of the exchange.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The wire: one bit every microsecond, each bit a transition",
      body: `**Speed.** The bus runs at **1 megabit per second**: one bit every microsecond, fixed by the standard.

**Coding.** A UART sends a 1 as a high level and a 0 as a low level for the whole bit. 1553 instead uses **Manchester II bi-phase** coding: every bit is a *transition in the middle of the bit time*. A **1 is high then low**; a **0 is low then high**. Two things follow. The signal has no steady level, so it carries no average voltage and can pass through a transformer. And there is a transition in every bit, so the receiver can recover the clock from the data itself; no separate clock wire, no baud-rate tolerance problem.

\`\`\`
bit value:      1      0      0      1
                ‾‾|__  __|‾‾  __|‾‾  ‾‾|__
                 1 µs each; a transition in the middle of every bit
\`\`\`

**Cable.** A shielded twisted pair, driven differentially, with a terminating resistor at each end. Terminals connect through a **coupling transformer**, which isolates each terminal so a shorted terminal does not take the bus down.

**Redundancy.** Almost every installation has **two complete buses, A and B**. The controller normally uses A and switches to B if a terminal does not answer on A. A terminal must listen on both and answer on the one it was addressed on.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The word: 20 bit times, three parts",
      body: `Every word on the bus takes **20 microseconds**: 20 bit times, in three parts.

**Sync (3 bit times).** A pattern that *breaks* the Manchester rule: one and a half bit times high, then one and a half low (or the reverse). Because real data always has a transition in the middle of every bit, this pattern can never appear inside data, so the receiver can always find the start of a word. Command and status words use one polarity of sync; data words use the opposite. That is how a listener tells a data word from a command word without counting anything.

**Data (16 bit times).** Sixteen bits, sent most significant bit first. What they mean depends on the word type, which the next step covers.

**Parity (1 bit time).** One bit chosen so that the total number of ones in the 17 bits (16 data + parity) is **odd**. Count the ones in the 16 data bits: if the count is even, the parity bit is 1; if it is odd, the parity bit is 0. A receiver that counts an even total knows the word was corrupted and **rejects it without responding**.

So a word is: sync, sixteen bits, one parity bit. Twenty microseconds, every time.`,
    },
    {
      type: "visual",
      stage: "how",
      depth: "understand",
      title: "See it: build a command word field by field",
      visual: "mil1553-word",
      body: `**Try this first.** Set RT address to 5, tick T/R, set subaddress to 3 and word count to 4. Read the sixteen bits and the hex value. Count the ones yourself and check the parity bit.

**Then** move the word count to 0 and read what it means. Then set the subaddress to 31 and watch the last field change its meaning.`,
      caption: `A command word's 16 data bits with the three-bit-time sync on the left and the parity bit on the right. Bit times are numbered as the standard does: 1 to 3 sync, 4 to 19 data, 20 parity. The colours mark the four fields.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The command word: four fields, left to right",
      body: `Only the bus controller sends command words. Their sixteen data bits are four fields, read left to right:

| Field | Bits | Meaning |
|---|---|---|
| Remote terminal address | 5 | Which terminal, 0 to 30. Address **31 is broadcast** to all. |
| T/R | 1 | **1**: the terminal must *transmit*. **0**: the terminal will *receive* what follows. |
| Subaddress or mode | 5 | Which "mailbox" in the terminal, 1 to 30. **0 or 31** means the last field is a mode code, not a count. |
| Word count or mode code | 5 | How many data words follow or are requested, 1 to 31; **0 means 32**. Or, after subaddress 0 or 31, a mode code such as 2 = "transmit status word", 8 = "reset remote terminal". |

Two fields change meaning depending on another field, and that is where every decoding mistake happens: the last five bits are a *count* unless the subaddress is 0 or 31, and a count of zero is not zero.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Status and data words",
      body: `**Status word.** Only a terminal sends these, as the first word of its answer. The first five bits are the terminal's own address again, so the controller can check who replied. The remaining bits are single-bit flags: **message error** (the terminal saw a problem with the command or data it received), instrumentation, service request, broadcast command received, **busy**, subsystem flag, dynamic bus control acceptance, and **terminal flag** (the terminal has an internal fault). All flags zero is a clean answer.

**Data word.** Sixteen bits of payload. What they mean, how they are scaled and which subaddress they live in is agreed between the two ends in an interface control document, not by the standard.

One shape, three meanings. A listener tells them apart by the sync polarity (command and status one way, data the other) and by position in the message: a command is always first, a status is always the first word a terminal sends.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "The message: three formats",
      body: `A **message** is one command and its answer. The three common formats:

1. **Controller to terminal (receive).** The controller sends a command word with T/R = 0, then N data words. The terminal answers with its **status word**. On the wire: command, data, status.
2. **Terminal to controller (transmit).** The controller sends a command word with T/R = 1. The terminal answers with its **status word followed by N data words**.
3. **Terminal to terminal.** The controller sends *two* commands: a receive command to terminal B, then a transmit command to terminal A. A answers with status and data; B, having received the data, answers with its status. The controller only orchestrates.

A whole transmit message with 4 data words takes about 20 (command) + 8 (response gap) + 20 (status) + 4 × 20 (data) = **128 µs**, so the bus can carry several thousand such messages a second. Which terminal is asked when is the controller's schedule, organised as repeating **major and minor frames**.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "apply",
      title: "Timing: the clock that judges every answer",
      body: `Faults show in the timing, so the standard fixes three numbers.

**Response time: 4 to 12 µs.** A terminal must begin its status word between 4 and 12 µs after the command ends (measured mid-bit of the command's parity to mid-bit of the status sync).

**No response: 14 µs.** If the controller hears nothing within 14 µs, it logs a **no-response** error. It will usually retry, often on the other bus.

**Intermessage gap: at least 4 µs.** The controller leaves at least 4 µs of silence between one message and the next, so terminals can tell messages apart.

**Broadcast is the exception.** A command to address 31 reaches every terminal, and **no terminal sends a status word**, because thirty-one answers at once would collide. A bus monitor therefore shows every broadcast as "no response" by design, and a controller that wants to know whether a broadcast arrived asks each terminal afterwards with a mode code.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: decode 0x2C64 by hand",
      body: `A bus monitor shows a command word with data bits **0x2C64**. Decode it the way the engineer in the scenario did.

**Step 1: write the sixteen bits.** 0x2C64 is hex; each hex digit is four bits.

| hex | 2 | C | 6 | 4 |
|---|---|---|---|---|
| binary | 0010 | 1100 | 0110 | 0100 |

So the word is \`0010 1100 0110 0100\`.

**Step 2: cut the fields, left to right: 5, 1, 5, 5.**

| field | bits | value |
|---|---|---|
| RT address | \`00101\` | 5 |
| T/R | \`1\` | 1: transmit |
| Subaddress | \`00011\` | 3 |
| Word count | \`00100\` | 4 |

**Reading:** "Terminal 5, transmit 4 data words from subaddress 3." The terminal should answer with a status word and four data words.

**Step 3: parity.** Count the ones: 0010 has 1, 1100 has 2, 0110 has 2, 0100 has 1. Total **6**, which is even, so the parity bit on the wire must be **1** to make the total odd (7). If the analyser shows a parity bit of 0 on this word, the word was corrupted in flight, and a correct terminal rejects it and stays silent.

**Step 4: the scenario.** The command that got no answer was 0x2C60: the same word with a word count field of **0**, which means **32 data words**. Terminal 5's subaddress 3 holds four words. Asked for thirty-two, the terminal treats the command as illegal for that subaddress, sets the message-error bit in its status and sends no data, or, in some designs, does not respond at all. Either way the analyser reports a fault, and the fault is in the controller's schedule, not the terminal or the cable. One field, read by hand, found it.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "Encoding and decoding a command word in C, line by line",
      intro: `The heart of the lab below: pack the four fields into sixteen bits, unpack them again, and compute odd parity. This is also exactly what the firmware in a terminal or an analyser does.`,
      language: "c",
      code: `typedef struct {
    unsigned rt;   /* 5 bits, 0..31 */
    unsigned tr;   /* 1 bit */
    unsigned sa;   /* 5 bits */
    unsigned wc;   /* 5 bits */
} command_t;

static uint16_t encode_command(command_t c) {
    return (uint16_t)(((c.rt & 0x1Fu) << 11) | ((c.tr & 0x1u) << 10)
                    | ((c.sa & 0x1Fu) << 5)  |  (c.wc & 0x1Fu));
}

static command_t decode_command(uint16_t w) {
    command_t c;
    c.rt = (w >> 11) & 0x1Fu;
    c.tr = (w >> 10) & 0x1u;
    c.sa = (w >> 5)  & 0x1Fu;
    c.wc =  w        & 0x1Fu;
    return c;
}

static unsigned odd_parity_bit(uint16_t w) {
    unsigned ones = 0;
    for (unsigned i = 0; i < 16; i++) ones += (w >> i) & 1u;
    return (ones % 2u == 0u) ? 1u : 0u;
}`,
      notes: [
        { lines: "1-6", text: `A plain struct for the four fields of a command word. The comments carry the bit widths; the struct itself does not enforce them, so the encoder masks each field.` },
        { lines: "8-11", text: `**Packing.** Each field is masked to its width (\`& 0x1F\` keeps five bits, \`& 0x1\` keeps one) and shifted to its position: the terminal address occupies the top five bits, so it is shifted left by 11 (16 − 5); T/R is bit 10; the subaddress starts at bit 5; the word count sits in the bottom five bits. The pieces are combined with OR because their bits never overlap.` },
        { lines: "13-20", text: `**Unpacking** is the mirror image: shift each field down to the bottom, then mask to its width. Shifting before masking means the mask is always the simple field width.` },
        { lines: "22-26", text: `**Odd parity.** Count the ones in the sixteen bits. If the count is even, the parity bit must be 1 to make the total odd; if odd, 0. A receiver does the same count over all seventeen bits and rejects the word if the total is even.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: encode four commands and decode a capture",
      lab: "c-1553-word",
      body: `The program encodes the four commands discussed in this lesson (including word count 0 and a mode code), prints each as hex with its parity bit, then decodes a captured word and shows what a wrong parity bit would mean. Compare its 0x2C64 line with the worked example you just did by hand.`,
      tryNext: `Change the captured word to 0x6022 and predict the four fields before running. Then write a word for "broadcast, receive, subaddress 7, 2 words" (address 31) and check that your parity bit matches the program's.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "w1553-rt-guided",
        skill: "avionics-buses",
        objective: "Read the terminal address out of a command word (guided).",
        prompt: `A bus monitor shows a command word with data bits **0x6022**. Which remote terminal is it addressed to? (Give the address as a number.)`,
        unit: "",
        answer: 12,
        tolerance: 0,
        hints: [
          `Write the sixteen bits first. 6 = 0110, 0 = 0000, 2 = 0010, 2 = 0010, so the word is 0110 0000 0010 0010.`,
          `The terminal address is the first (leftmost) five bits of the sixteen.`,
          `The leftmost five bits are 01100. Convert that binary number to decimal: 8 + 4.`,
        ],
        solution: `0x6022 = \`0110 0000 0010 0010\`. The first five bits are \`01100\` = 8 + 4 = **12**. The rest decodes as T/R = 0 (the terminal will receive), subaddress \`00001\` = 1, word count \`00010\` = 2: "terminal 12, receive two words into subaddress 1". The lab prints this same word.`,
        solvedFeedback: `Right: terminal 12. You read a 1553 command word by hand.`,
        misconceptions: [
          { value: 6, tolerance: 0, feedback: `6 is the first hex digit, which is only four bits. The address is the first *five* bits: 0110 0 = 01100 = 12.` },
          { value: 24, tolerance: 0, feedback: `24 would be the first five bits read as 11000. The word begins 0110 0000, so the first five bits are 01100 = 12.` },
          { value: 96, tolerance: 0, feedback: `0x60 = 96 is the whole first byte. The address is only the top five bits of it: 01100 = 12.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "single",
        id: "w1553-decode-mode",
        skill: "avionics-buses",
        objective: "Decode a command word including the mode-code case.",
        prompt: `A captured command word has data bits **0x2FE2**. What does it mean?`,
        options: [
          { id: "a", text: "Terminal 5, transmit 2 data words from subaddress 31.", correct: false, feedback: `Subaddress 31 (and 0) does not name a mailbox: it marks the command as a **mode command**, so the last field is a mode code, not a word count.` },
          { id: "b", text: "Terminal 5, transmit, mode code 2: transmit your status word.", correct: true, feedback: `0x2FE2 = 0010 1111 1110 0010: address 00101 = 5, T/R = 1, subaddress 11111 = 31 (mode), code 00010 = 2, which is "transmit status word". The terminal answers with its status word only.` },
          { id: "c", text: "Broadcast to all terminals, receive 2 words into subaddress 31.", correct: false, feedback: `Broadcast is address 31 = 11111 in the *first* five bits; here the first five bits are 00101 = 5. The 11111 is in the subaddress field.` },
          { id: "d", text: "A data word carrying the value 0x2FE2.", correct: false, feedback: `A data word has the opposite sync polarity and is never interpreted by fields. The question says it is a command word, so the fields apply.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "w1553-parity",
        skill: "avionics-buses",
        objective: "Compute the parity bit of a word.",
        prompt: `What parity bit (0 or 1) must accompany the command word **0x2C60** on the wire?`,
        unit: "",
        answer: 0,
        tolerance: 0,
        solution: `0x2C60 = \`0010 1100 0110 0000\`. Ones: 1 + 2 + 2 + 0 = **5**, which is already odd, so the parity bit is **0**. (Compare 0x2C64, whose six ones needed a parity bit of 1.)`,
        solvedFeedback: `Right: 0. Five ones are already odd, so the parity bit adds nothing.`,
        misconceptions: [
          { value: 1, tolerance: 0, feedback: `A parity bit of 1 would make six ones in total, which is even. 1553 uses *odd* parity: 0x2C60 has five ones, so the parity bit is 0.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Why a terminal stays silent: six causes",
      body: `"No response" on an analyser is a symptom with at least six causes, and the trace tells them apart.

1. **Parity or Manchester error in the command.** The terminal rejected a corrupted word. Look at the analyser's error flags on the command itself.
2. **Illegal command for that terminal.** Well-formed, but it asks for a subaddress, word count or mode code the terminal does not implement (the scenario's 32 words from a 4-word subaddress). A terminal that implements illegal-command detection answers with the **message-error bit** set and no data; one that does not may stay silent.
3. **Broadcast.** Address 31 never gets a status word. Not a fault.
4. **Wrong bus.** The terminal was addressed on bus B while it is connected only to A, or its B coupler is open. The controller's retry on the other bus tells you.
5. **Busy or faulted terminal.** The busy bit withholds data; the terminal flag reports an internal fault. Both are *answers*, so the analyser shows a flagged status word, not "no response".
6. **Late.** The terminal answered after 14 µs. The controller logged no response; an analyser with a wider window shows a late status. Marginal cable length, coupler type or a slow terminal design.`,
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "Cheapest first, and the retry trade-off",
      body: `The six causes are listed in the order to investigate them, cheapest first: read the command's error flags and fields on the analyser (minutes, no tools), check for broadcast, check which bus, read the status flags, and only then measure timing or open the cable.

The design trade-off a reviewer asks about is the controller's **retry policy**. A controller that retries at once on the other bus hides marginal terminals and marginal cables until the day both buses are marginal; one that does not retry fails loudly on a single corrupted word. Neither is right in general. What matters is that the policy is written down, that every retry is **logged** so the maintenance data shows a terminal going marginal before it fails, and that the interface control document for the bus says which it is. A test plan for the bus then has a case that forces a retry and checks the log.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "multi",
        id: "w1553-no-response",
        skill: "avionics-buses",
        objective: "Diagnose a no-response fault from the evidence.",
        prompt: `An analyser shows "no response" for one command every 2 s to terminal 5; all other commands to terminal 5 are answered within 6 µs. The command's parity is good. Select **every** statement that follows.`,
        options: [
          { id: "a", text: "The cable or coupler to terminal 5 is the most likely cause.", correct: false, feedback: `Terminal 5 answers every other command within 6 µs on the same cable and coupler. The physical path is working.` },
          { id: "b", text: "The command's parity bit is good, so corruption of the command word is unlikely.", correct: true, feedback: `A good parity bit does not prove the word is uncorrupted (two flipped bits pass), but it removes the most common cause, and the fault is repeatable on one specific command, which corruption is not.` },
          { id: "c", text: "Decode the failing command's fields and compare them with terminal 5's interface control document.", correct: true, feedback: `The next step: a well-formed command for a subaddress, word count or mode code the terminal does not implement is the classic repeatable no-response.` },
          { id: "d", text: "If the failing command's address field is 31, the silence is by design.", correct: true, feedback: `Broadcast commands never receive a status word. The analyser shows them as no response.` },
          { id: "e", text: "Replacing terminal 5's firmware is the quickest way to find out.", correct: false, feedback: `Swapping parts before reading the word is what the team in the scenario did for a week. Decode first; it takes a minute.` },
        ],
        solvedFeedback: `Right. The evidence rules out the physical path, points at the one command that differs, and the standard tells you what a terminal does with a command it cannot serve.`,
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "mil-1553-word-walk",
      intro: `Draw the 20-bit word, name the three word types and their fields, walk one message with its timing, then decode a word out loud. End with the no-response checklist.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Avionics integration and validation.** Bus analyser captures are the primary evidence in an integration lab. Reading a command word by hand, and knowing the response-time window and the broadcast rule, lets you tell a wiring fault from a schedule fault in minutes.
- **Embedded development and R&D.** The encoder, decoder and parity routine in the walkthrough are the same code a terminal's firmware or a test tool runs; the struct-and-mask pattern transfers to every framed protocol. When you design a new unit's interface, the subaddress map and word counts you choose become its ICD.
- **Test automation.** A Python script that parses analyser logs needs exactly these field positions; the lab is the reference implementation to test it against.
- **Interviews.** "Describe a 1553 word" is the screening question; "why would a terminal not respond" is the panel question. The six causes in order are the strong answer.`,
    },
    {
      type: "recap",
      summary: `- One bus controller, up to 31 remote terminals, optional monitors; every exchange is a command and its response. 1 Mbit/s, Manchester II (1 = high-low, 0 = low-high), shielded twisted pair, transformer coupled, dual redundant buses A and B.
- A word is 20 bit times: 3 of sync (an invalid Manchester pattern; opposite polarity for data words), 16 data bits MSB first, 1 odd-parity bit.
- Command word: RT address (5), T/R (1), subaddress or mode (5), word count or mode code (5). Address 31 = broadcast; subaddress 0 or 31 = mode command; word count 0 = 32.
- Status word: RT address then flags (message error, busy, terminal flag, ...). Data word: 16 payload bits defined by the ICD.
- Messages: BC→RT (command, data, status), RT→BC (command; status, data), RT→RT (two commands). Response 4 to 12 µs; no response after 14 µs; gap at least 4 µs; broadcast gets no status.
- No response: corrupted command, illegal command for that terminal, broadcast, wrong bus, busy or faulted terminal (a flagged status, not silence), late response.`,
      cards: [
        { id: "m1553-1", front: "Shape of a MIL-STD-1553B word?", back: "20 bit times at 1 Mbit/s: 3 of sync (invalid Manchester; command/status one polarity, data the other), 16 data bits MSB first, 1 odd-parity bit." },
        { id: "m1553-2", front: "Fields of a command word?", back: "RT address 5 bits (31 = broadcast), T/R 1 bit (1 = terminal transmits), subaddress 5 bits (0 or 31 = mode command), word count or mode code 5 bits (count 0 = 32 words)." },
        { id: "m1553-3", front: "Response timing on 1553?", back: "A terminal starts its status word 4 to 12 µs after the command ends; the controller declares no response at 14 µs; at least 4 µs between messages. Broadcast commands get no status word at all." },
        { id: "m1553-4", front: "Why does Manchester coding suit an avionics bus?", back: "A transition in every bit carries the clock with the data (no baud tolerance problem) and gives the signal no DC component, so it passes through isolating coupling transformers." },
        { id: "m1553-5", front: "A terminal gives no response to one repeatable command; others fine. First step?", back: "Decode the command's fields and compare with the terminal's ICD: an illegal subaddress, word count or mode code is the classic cause. Check for broadcast (address 31). Only then suspect the path." },
      ],
    },
  ],
};
