import type { Lesson } from "@/lib/content/schema";

export const telemetryPacketsAndParsingWithStruct: Lesson = {
  slug: "telemetry-packets-and-parsing-with-struct",
  moduleId: "avionics-buses",
  format: "arc",
  prerequisites: ["rs-422-rs-485-and-framed-serial-with-crc", "serial-automation-and-test-logs"],
  title: "Telemetry packets: design the frame, then parse it so that nothing is silently lost",
  summary: "A telemetry frame is a small contract between a sender and every tool that reads it. Learn what belongs in the header, how to pack and unpack it with Python's struct, how to detect lost, corrupted and out-of-order frames, and how to resynchronise after garbage.",
  durationMinutes: 16,
  whyItMatters: "A telemetry parser is the first piece of test automation most avionics test engineers write, and the claim 'my script parses the bus' invites two follow-ups: show me the frame layout, and what happens when a frame is lost? A parser that counts what it could not use is evidence; one that silently skips is a liability.",
  objectives: [
    "Design a telemetry frame: sync, version, sequence number, timestamp, payload, CRC; and justify each field.",
    "Write the matching struct format string, compute the frame length and avoid the padding trap.",
    "Detect lost, corrupted and out-of-order frames from the sequence number, including wrap-around, and report them instead of dropping them.",
    "Resynchronise after garbage without misreading a stray sync byte as a frame, and explain what a parser must count.",
  ],
  review: {
    status: "technically-reviewed",
    note: "Python's struct module behaviour (standard sizes and no padding with the > prefix, native alignment with @) follows the Python standard-library documentation. CRC-16/CCITT-FALSE parameters (polynomial 0x1021, initial value 0xFFFF, check value 0x29B1 for \"123456789\") follow public CRC catalogues and were reproduced by the lab. The frame layout is invented for this lesson.",
  },
  references: [
    { title: "Python documentation: struct, interpreting bytes as packed binary data", note: "Format characters, byte-order prefixes, standard versus native sizes." },
    { title: "Catalogue of parametrised CRC algorithms (public online catalogue)", note: "CRC-16/CCITT-FALSE and CRC-16/MODBUS parameters and check values." },
    { title: "Lesson: RS-422 and RS-485: differential links, termination, and frames you can trust", note: "Framing and the CRC idea this lesson reuses." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "The parser that said everything was fine",
      body: `A test engineer writes a Python script to read a flight sensor node's telemetry over a serial link and plot the temperature. The plot looks smooth. The script prints "parsed 5000 frames, 0 errors".

A colleague runs the node's own log for the same period. It shows 5 004 frames were sent. Four are missing from the plot, and nobody can say which, or why, because the script skipped anything it did not understand and said nothing.

The temperature plot is fine. The claim "0 errors" is wrong. In a test report, that is the difference between evidence and a story. This lesson is about designing the frame and writing a parser that **counts everything it cannot use**.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "A frame is a small envelope with a contract",
      body: `Think of a posted letter. The envelope has an address and a stamp; inside is the message. Every sorting machine along the way reads only the envelope.

A telemetry frame has the same layers. A few bytes of **header** say where the frame starts, which format it uses, which number it is, and when it was taken. The **payload** is the measurement itself. A **check value** at the end says whether anything was damaged on the way.

Each header field answers a question a receiver will one day need to ask:

- *Where does a frame begin?* A **sync byte**.
- *Can I read this?* A **version**.
- *Did I miss one?* A **sequence number** that counts up.
- *When was this measured?* A **timestamp**.
- *Is it intact?* A **CRC**.

If a field cannot answer a real question, leave it out. If a question cannot be answered, add a field.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The frame, byte by byte, and its struct format",
      body: `The lesson's frame is 14 bytes, with every multi-byte number **big-endian** (most significant byte first):

| Offset | Size | Field | struct code |
|---|---|---|---|
| 0 | 1 | sync (0xA5) | \`B\` |
| 1 | 1 | version | \`B\` |
| 2 | 2 | sequence, 0 to 65 535, wraps | \`H\` |
| 4 | 4 | timestamp, ms since start | \`I\` |
| 8 | 2 | temperature, signed, 0.01 °C | \`h\` |
| 10 | 2 | voltage, unsigned, mV | \`H\` |
| 12 | 2 | CRC-16 over bytes 0 to 11 | \`H\` |

Python's \`struct\` module turns a format string into pack and unpack. The format is \`">BBHIhH"\` for the first twelve bytes. The leading \`>\` means **big-endian with standard sizes and no padding**: B is 1 byte, H is 2, I is 4, h is 2.

Without that prefix, Python uses the machine's native layout and may insert **padding** to align each field. A format that works on your laptop would then produce a different frame length on another machine. Always write the byte-order prefix.

\`struct.calcsize(">BBHIhH")\` gives 12; plus the two CRC bytes, the frame is **14 bytes**.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "Sequence numbers: how a receiver knows what it missed",
      body: `The sequence number counts up by one per frame. A receiver remembers the last one it accepted and the next must be one greater.

If the next frame is not last + 1, something was lost: the **gap** is how many. If it is lower, frames arrived out of order or were repeated.

The counter has 16 bits, so after 65 535 it wraps to 0. A comparison "is it bigger than the last one?" breaks at the wrap. Use **modular arithmetic** instead: the number lost is \`(received − expected) mod 65 536\`.

Example: expected 65 534, received 1. The numbers 65 534, 65 535, 0 were skipped: (1 − 65 534) mod 65 536 = **3** lost.

Three counts every parser must keep and print: **frames good**, **frames corrupt** (failed CRC), **frames lost** (sum of the gaps). Their total must equal what the sender says it sent.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: what the parser sees in a damaged stream",
      body: `The lab's stream is 89 bytes: frames with sequence numbers 0, 1, 2, 3, 5, 6, so frame 4 was never sent. Two things are done to it: one bit is flipped inside frame 2, and three garbage bytes (0xFF 0xA5 0x00) are inserted before frame 5.

**Frames 0 and 1.** Sync matches, CRC matches, sequence 0 then 1. Good, good.

**Frame 2.** Sync matches but the CRC does not. **Corrupt.** The parser discards it and counts it. It does not trust the frame's length and skips one byte, looking for the next sync.

**Frame 3.** The next valid frame arrives with sequence 3. Expected 2. The gap is 1: frame 2 is **lost** (it was corrupt, so it counts as lost data).

**The garbage.** 0xFF is not a sync byte, skipped. 0xA5 *is*, so the parser tries a frame from there, the CRC fails, and it skips on. A random byte that happens to equal the sync value is a **false sync**, and the CRC is what protects you from it.

**Frames 5 and 6.** Sequence 5 after 3, expected 4, **one lost**: frame 4, which was never sent. Frame 6 follows cleanly.

Totals: 5 good, 2 corrupt reads (one real, one false sync), 2 lost. The report accounts for every byte.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "frame-length-guided",
        skill: "avionics-buses",
        objective: "Compute a struct frame length (guided).",
        prompt: `A frame has the format \`">BBHIhH"\` followed by a 2-byte CRC. How many bytes is the complete frame?`,
        unit: "bytes",
        answer: 14,
        tolerance: 0,
        hints: [
          `Add the sizes of the six codes: B is 1 byte, H is 2 bytes, I is 4 bytes, h is 2 bytes.`,
          `B + B + H + I + h + H = 1 + 1 + 2 + 4 + 2 + 2.`,
          `That is the header. Then add the 2 bytes of CRC.`,
        ],
        solution: `1 + 1 + 2 + 4 + 2 + 2 = 12 bytes of header, plus the 2-byte CRC = **14 bytes**. (struct.calcsize(">BBHIhH") returns 12.)`,
        solvedFeedback: `Right: 14 bytes. The > prefix guarantees standard sizes with no padding, so the sum of the field sizes is the length.`,
        misconceptions: [
          { value: 12, tolerance: 0, feedback: `12 is the struct header alone. The CRC is two more bytes at the end: 14.` },
          { value: 16, tolerance: 0, feedback: `That would be the size if padding bytes were added for alignment, which happens with a native (@) format but not with the > prefix. With >, it is the plain sum: 12 + 2 = 14.` },
        ],
      },
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "apply",
      title: "A resynchronising parser, line by line",
      intro: `The parser's job is to find frames in a stream where garbage can appear anywhere. It must never trust a length or a sync byte it has not checked. This is the lab's parser with the report formatting trimmed away.`,
      language: "python",
      code: `def parse(stream):
    out, i, expected, skipped = [], 0, None, 0
    while i + FRAME_LEN <= len(stream):
        if stream[i] != SYNC:
            i += 1; skipped += 1
            continue
        chunk = stream[i:i + FRAME_LEN]
        sync, ver, seq, ts, temp, volt = HEADER.unpack(chunk[:HEADER.size])
        (crc,) = struct.unpack(">H", chunk[HEADER.size:])
        if crc16(chunk[:HEADER.size]) != crc:
            out.append(("BAD CRC", i))
            i += 1; skipped += 1
            continue
        if expected is not None and seq != expected:
            out.append(("GAP", (seq - expected) & 0xFFFF))
        out.append(("OK", seq))
        expected = (seq + 1) & 0xFFFF
        i += FRAME_LEN
    return out, skipped`,
      notes: [
        { lines: "3-6", text: `Scan forward until a **sync byte** is found. Every byte skipped is counted, because a parser that discards bytes without counting them is the scenario's liar.` },
        { lines: "7-9", text: `Take a full frame-length chunk and **unpack** it with the struct format. The header and the two CRC bytes are unpacked separately so the CRC is computed over exactly the header.` },
        { lines: "10-13", text: `If the CRC fails, record it and move on by **one byte, not one frame**. A frame that failed its CRC cannot be trusted to have the right length, and the real next frame may start anywhere inside it.` },
        { lines: "14-15", text: `Compare the sequence number with the expected one. The difference is taken **modulo 65 536** (\`& 0xFFFF\`) so the wrap from 65 535 to 0 is not reported as a huge gap.` },
        { lines: "16-18", text: `A good frame: record it, set the next expected sequence (again modulo 65 536), and jump a whole frame length.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: parse the damaged stream and read the counts",
      lab: "py-telemetry",
      body: `The program builds the 89-byte stream described above, parses it, prints one line per event and the totals, then checks the sequence wrap with a separate short stream. Compare each line with the worked example before you read the totals.`,
      tryNext: `Add a frame with the wrong version number (version 2) to the stream. Decide first: should the parser accept it? Then change the code so the version is checked and an unknown version is counted separately instead of being parsed as if it were version 1.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "numeric",
        id: "seq-gap-wrap",
        skill: "avionics-buses",
        objective: "Compute frames lost across a sequence wrap.",
        prompt: `The parser's last accepted frame had sequence 65 534, so it expects 65 535 next. The next good frame has sequence **2**. How many frames were lost? (The counter is 16 bits and wraps from 65 535 to 0.)`,
        unit: "frames",
        answer: 3,
        tolerance: 0,
        solution: `The next expected was 65 535; the received is 2. Lost = (received − expected) mod 65 536 = (2 − 65 535) mod 65 536 = **3**: the frames numbered 65 535, 0 and 1 are missing.`,
        solvedFeedback: `Right: 3. Modular arithmetic handles the wrap; subtracting and getting −65 533 would be wrong.`,
        misconceptions: [
          { value: -65533, tolerance: 0, feedback: `That is the plain difference, 2 − 65 535. The counter wraps, so take it modulo 65 536 (add 65 536): 3.` },
          { value: 2, tolerance: 0, feedback: `That is the received sequence number, not the number lost. The missing frames were 65 535, 0 and 1: three of them.` },
        ],
      },
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "single",
        id: "struct-format-choice",
        skill: "avionics-buses",
        objective: "Choose the struct format that matches a frame layout.",
        prompt: `A frame is: sync (1 byte), sequence (unsigned, 2 bytes, big-endian), temperature (signed, 2 bytes, big-endian), voltage (unsigned, 2 bytes, big-endian). Which format string reads it on any machine?`,
        options: [
          { id: "a", text: `"BHhH"`, correct: false, feedback: `With no prefix Python uses the machine's native byte order and alignment, and may insert padding after the 1-byte sync. The frame would not be the same length on every machine.` },
          { id: "b", text: `">BHhH"`, correct: true, feedback: `Yes: big-endian, standard sizes, no padding. B = sync, H = unsigned 16-bit sequence, h = signed 16-bit temperature, H = unsigned 16-bit voltage. 7 bytes.` },
          { id: "c", text: `">BHHH"`, correct: false, feedback: `The temperature is signed. H would read a negative temperature as a large positive number. Use h.` },
          { id: "d", text: `"<BHhH"`, correct: false, feedback: `The < prefix means little-endian. The frame is big-endian, so every multi-byte field would be read byte-swapped.` },
        ],
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What the parser must refuse to hide",
      body: `A parser can fail quietly in four ways, and each deserves a counter.

**It trusts a length.** If the frame carries a length field, the parser reads that many bytes. A corrupt length byte then swallows the real next frame. Check the CRC **before** you trust the length, or re-scan from the byte after the sync as the walkthrough does.

**It trusts a sync byte.** One random byte equals 0xA5 about once in 256. The CRC check is what makes false syncs harmless, and a CRC that is itself corrupted passes about once in 65 536 frames. At a hundred frames a second that is one bad frame every eleven minutes. Add a plausibility check (is the temperature in range?) where the cost of a wrong value matters.

**It drops duplicates silently.** A repeated sequence number means the sender or the link repeated a frame. Count it separately from "lost".

**It hides time.** The timestamp lets you detect a frame that arrives late or a sender whose clock jumped. A test report should say how late a frame can be before the data counts as lost.

Finally, decide where the counters live. A report printing "5 000 good, 4 lost, 2 corrupt of 5 006 sent" is evidence. One that prints only the plot is a picture.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "numeric",
        id: "link-share",
        skill: "avionics-buses",
        objective: "Check that a telemetry stream fits its link.",
        prompt: `Telemetry is sent as 14-byte frames, 100 frames per second, over a 115 200 baud serial link using 8 data bits, no parity and 1 stop bit (10 bits on the wire per byte). What share of the link's capacity does the telemetry use, as a percentage with one decimal place?`,
        unit: "%",
        answer: 12.2,
        tolerance: 0.1,
        solution: `Bits per frame: 14 bytes × 10 bits = 140. Per second: 140 × 100 = 14 000 bits. Link capacity 115 200 bits per second. Share = 14 000 / 115 200 = **12.15 %**, about 12.2 %.`,
        solvedFeedback: `Right: about 12 %. Counting 10 bits per byte (start, 8 data, stop), not 8, is the step people miss.`,
        misconceptions: [
          { value: 9.7, tolerance: 0.1, feedback: `That counts 8 bits per byte, forgetting the start and stop bits: 11 200 / 115 200. On the wire a byte costs 10 bit times: 14 000 / 115 200 = 12.2 %.` },
          { value: 122, tolerance: 1, feedback: `That is a factor of ten out. 14 bytes × 10 bits × 100 frames = 14 000 bits per second; divide by 115 200 for 0.122, or 12.2 %.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "telemetry-packet-design",
      intro: `Describe the frame you would design, what the parser counts, and what happens at the sequence wrap and after garbage.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** The same frame is built on the target in C (a packed struct or explicit byte writes) and parsed on the host; the two must agree, which is what an interface control document is for.
- **Aerospace and UAV systems.** Telemetry from air vehicles and ground test rigs is framed this way; the sequence number and the CRC are what make recorded data defensible.
- **R&D and design.** Choosing field sizes, the byte order, the update rate and the link budget is a design task; the link-share arithmetic is the first check.
- **Verification and interviews.** "My script parsed the bus" invites "how do you know nothing was lost?"; the counters are the answer. A parser tested with a lost frame, a corrupt frame and a wrap is a classic automation task.`,
    },
    {
      type: "recap",
      summary: `- A frame has a sync, a version, a sequence number, a timestamp, the payload and a CRC; each field answers a question a receiver will ask.
- struct: always write the byte-order prefix (">" for big-endian, standard sizes, no padding). ">BBHIhH" is 12 bytes; with a 2-byte CRC, 14.
- Lost frames are (received − expected) mod 65 536; the wrap must not be reported as a huge gap.
- Resync one byte at a time after a failed CRC; a frame that failed its CRC cannot be trusted to have the right length.
- Count good, corrupt, lost, duplicate and skipped bytes, and print them next to the result.`,
      cards: [
        { id: "telem-1", front: "What belongs in a telemetry frame header, and why?", back: "A sync byte (where it starts), a version (can I read it), a sequence number (did I miss one), a timestamp (when), then the payload and a CRC (is it intact)." },
        { id: "telem-2", front: "Why write the prefix in a struct format string?", back: "'>' (or '<') selects an explicit byte order with standard sizes and no padding. Without it, struct uses the machine's native layout and may insert padding, so the same format can mean different frames on different machines." },
        { id: "telem-3", front: "How do you count lost frames across a 16-bit sequence wrap?", back: "(received − expected) mod 65 536. Example: expected 65 535, received 2: three lost (65 535, 0, 1)." },
        { id: "telem-4", front: "What must a telemetry parser count, and why?", back: "Good frames, corrupt frames (bad CRC), lost frames (sequence gaps), duplicates and skipped bytes, printed beside the result. A parser that silently drops what it cannot use turns 'zero errors' into a false claim." },
      ],
    },
  ],
};
