import type { Lesson } from "@/lib/content/schema";

export const buildingAFrameParserAndBreakingIt: Lesson = {
  slug: "building-a-frame-parser-and-breaking-it",
  moduleId: "embedded-c",
  format: "arc",
  prerequisites: ["state-machines-that-survive-review", "rs-422-rs-485-and-framed-serial-with-crc", "uart-framing-and-baud"],
  title: "A frame parser in C, and the two bugs that only a careful test finds",
  summary: "Write a byte-at-a-time parser for a framed serial protocol as a small state machine with a contract and one test per sentence of it. Then run two broken versions, predict from the code why each fails, and learn what an off-by-one and a missing resynchronisation look like in a test report.",
  durationMinutes: 20,
  whyItMatters: "A serial frame parser is the commonest 'write this in C' interview exercise and the commonest source of field bugs in firmware that talks to anything. Being able to say what the parser promises, test each promise, and find a guard-byte overwrite by reasoning is the difference between 'I wrote a parser' and 'I can defend one'.",
  objectives: [
    "State the contract of a frame parser as separate, testable sentences.",
    "Read a four-state parser and say what each state does with a byte.",
    "Predict from a one-line difference which contract sentence a broken version violates, then confirm it by running the test.",
    "Explain why a behaviour test can pass while the parser corrupts memory, and what finds that.",
  ],
  review: {
    status: "technically-reviewed",
    note: "The frame format (start byte 0x7E, length, payload, CRC-8 with polynomial 0x07) is a teaching design, not a published standard. The parser and its two broken variants were compiled and run: the clean parser passes eight checks; variant A (CRC byte stored in the payload buffer) fails the guard-byte check at the maximum length with all behavioural checks passing; variant B (rejected frame dropped without rescanning) fails the inner-frame check. The guard byte stands for the variable that would follow the buffer in RAM and is modelled inside the parser structure so the overwrite is observable on a PC. AddressSanitizer does not detect an overflow between members of the same structure, which is why the test checks the byte explicitly.",
  },
  references: [
    { title: "Lesson: RS-422 and RS-485 and framed serial with CRC", note: "The framing and CRC ideas used here, with CRC-16 instead of CRC-8." },
    { title: "Lesson: State machines that survive review", note: "The pattern the parser follows." },
    { title: "SEI CERT C Coding Standard, ARR30-C and ARR38-C", note: "Do not form or use out-of-bounds pointers or array subscripts." },
    { title: "Lab files frame.h, frame.c and test_frame.c in this lesson", note: "The contract, the parser and the tests, all short enough to read in one sitting." },
  ],
  steps: [
    {
      type: "scenario",
      stage: "why",
      title: "Passed every test I wrote",
      body: `You write a parser for a sensor's serial protocol. You test it with good frames, a bad checksum and some junk before a frame. Everything passes. It goes into the unit.

In the field, two strange things happen. Once a day a variable that sits next to the receive buffer changes by itself, and the cause is never found. And once in a while a perfectly good frame is missing from the log, always one that came **right after a damaged one**.

Both bugs were in the parser. Neither could be seen with the tests you wrote, because none of them asked the right question: "what happens to the memory **around** the buffer?" and "what happens to a good frame **hidden inside** a bad one?"

In this lesson you build a parser that asks both questions, and then run two broken versions to see how those tests catch them.`,
    },
    {
      type: "concept",
      stage: "intuition",
      depth: "understand",
      title: "The clerk with a fixed tray and a bag of mail",
      body: `Picture a clerk who reads one letter at a time off a conveyor belt and files it. The clerk has a tray with room for exactly 64 letters. The clerk never sees the whole bag, only the letter in front of them.

Two promises make a good clerk.

**Promise one: never overfill the tray.** The 65th letter must not be pushed onto the desk next to it, where it would crush someone else's paperwork. The harm is silent: the letters in the tray are fine, and the damage shows up elsewhere, later.

**Promise two: never lose a good letter because of a bad one.** If a parcel turns out to be damaged, the clerk must not throw away the whole bag. A good parcel could have been **inside** the damaged one. The clerk puts the contents back on the belt and reads them again.

A **parser** is that clerk: one byte at a time, a fixed buffer, and a stream that contains noise. Everything about writing one well comes down to those two promises.`,
    },
    {
      type: "concept",
      stage: "theory",
      depth: "understand",
      title: "The frame, the contract and the four states",
      body: `The teaching frame on the wire is: \`0x7E | length | payload | crc8\`. The payload is 1 to 64 bytes, and the CRC covers the length byte and the payload.

The parser's **contract** is written as five sentences, and each one has a test:

1. Bytes before a start byte are ignored.
2. A length of 0, or above the maximum, is rejected.
3. A frame with a bad CRC is never delivered.
4. The parser never writes outside its own buffer, for any input.
5. After any rejected frame the parser **resynchronises**: a good frame that began inside the rejected bytes is still found.

The code is a **state machine** with four states, one action per byte:

- **wait for start**: ignore everything until 0x7E;
- **length**: check the length is 1 to 64;
- **payload**: store bytes until the length is reached;
- **CRC**: compare, then deliver or reject.

The idea: a test per sentence means a failing test names the sentence that was broken. The fourth and fifth sentences are the ones people forget.`,
    },
    {
      type: "walkthrough",
      stage: "how",
      depth: "understand",
      title: "The parser's one-byte step",
      intro: `This is the whole state machine: the function that handles one incoming byte. It is the clean version.`,
      language: "c",
      code: `static bool step(frame_parser_t *p, uint8_t b) {
    switch (p->state) {
    case S_WAIT_START:
        if (b == FRAME_START) { p->raw[0] = b; p->nraw = 1; p->state = S_LEN; }
        return true;
    case S_LEN:
        p->raw[p->nraw++] = b;
        if (b == 0u || b > PAYLOAD_MAX) { p->bad_len++; p->state = S_WAIT_START; return false; }
        p->len = b; p->idx = 0; p->state = S_PAYLOAD;
        return true;
    case S_PAYLOAD:
        p->raw[p->nraw++] = b;
        p->mem[p->idx++] = b;
        if (p->idx == p->len) p->state = S_CRC;
        return true;
    case S_CRC:
        p->raw[p->nraw++] = b;
        p->state = S_WAIT_START;
        if (frame_crc8(&p->raw[1], (size_t)p->len + 1u) == b) {
            p->good++;
            if (p->cb) p->cb(p->mem, p->len, p->ctx);
            return true;
        }
        p->bad_crc++;
        return false;
    }
    return true;
}`,
      notes: [
        { lines: "3-5", text: `**Waiting.** Ignore every byte until the start byte. When it arrives, remember it in \`raw\` (every byte since the start is kept there) and move to the length state. Sentence 1.` },
        { lines: "6-10", text: `**Length.** Keep the byte, then reject 0 or anything above the maximum: count it, go back to waiting, and return **false** to say "a frame was rejected". Sentence 2. Otherwise start counting payload.` },
        { lines: "11-15", text: `**Payload.** Store each byte at \`mem[idx]\` and **then** advance. The buffer holds the maximum payload plus one guard byte; this code never touches the guard. When the count reaches the length, wait for the CRC. Sentence 4.` },
        { lines: "16-25", text: `**CRC.** Compute over the length and payload, compare, deliver once if good (sentence 3), otherwise count the failure and return **false**. The \`false\` is what the caller uses to rescan: sentence 5.` },
      ],
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Run it yourself: the clean parser and its eight checks",
      lab: "c-frame",
      body: `Read \`frame.h\` first: the contract is in its header comment. Then read the test file: each test carries the number of the sentence it checks. The program should print \`8 checks, 0 failed\`. Notice that the buffer in \`frame_parser_t\` has **one more byte than the maximum payload**: the extra byte stands for a variable that would follow the buffer in RAM, and test 5 checks that it is never touched.`,
      tryNext: `Before changing anything: which single line of the parser, if you changed it, would make test 5's second check fail but leave every other check passing? Write the line down, then go to the next lab and see whether it matches.`,
    },
    {
      type: "example",
      stage: "example",
      depth: "understand",
      title: "Worked example: predict the failure from the one-line difference",
      body: `Two broken versions differ from the clean parser by a few lines each. Reading the difference is faster than running a debugger.

**Version A adds one line** in the CRC state: \`p->mem[p->idx] = b;\` with the comment "keep the CRC byte with the payload".

At that moment \`idx\` equals \`len\`. For a payload of 10 bytes, \`mem[10]\` is inside the 65-byte buffer: harmless. For a payload of exactly **64** bytes, \`mem[64]\` is the **guard byte**: the CRC byte lands on the neighbour. Every frame is still delivered, correct and with the right payload. So the behaviour tests pass. Only the check "the byte after the buffer was untouched" fails. **One failing check out of eight, and nothing visible in the output.**

**Version B replaces the whole rescan** with \`(void)step(p, byte);\`: "a rejected frame is simply dropped". Consider test 7: an outer frame with a wrong CRC whose payload happens to contain a complete inner frame (7E 02 AA BB and its CRC). The outer parser consumes **all** the bytes as its own payload, rejects at the end and forgets them. The inner frame is lost. Expected one delivery, got none.

**The lesson:** read the difference, name the sentence of the contract it breaks (4 for A, 5 for B), and only then run.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "understand",
      exercise: {
        kind: "numeric",
        id: "frame-bytes-guided",
        skill: "frame-parser",
        objective: "Count the bytes of the largest legal frame (guided).",
        prompt: `The frame is a start byte, a length byte, the payload and a one-byte CRC. The maximum payload is 64 bytes. How many bytes does the largest legal frame occupy on the wire?`,
        unit: "bytes",
        answer: 67,
        tolerance: 0,
        hints: [
          `List the fields in order and give each a size in bytes.`,
          `Start (1), length (1), payload (up to 64), CRC (1).`,
          `1 + 1 + 64 + 1.`,
        ],
        solution: `1 + 1 + 64 + 1 = **67 bytes**. That is why the parser keeps \`raw\` at PAYLOAD_MAX + 3 = 67 bytes: it must be able to remember every byte of the longest frame so it can replay them after a rejection.`,
        solvedFeedback: `Right: 67. The three bytes of overhead (start, length, CRC) are the "+ 3" in the buffer size.`,
        misconceptions: [
          { value: 64, tolerance: 0, feedback: `64 is only the payload. The frame also carries a start byte, a length byte and a CRC byte: three more.` },
          { value: 66, tolerance: 0, feedback: `That forgets one of the three overhead bytes: start, length and CRC. 64 + 3 = 67.` },
        ],
      },
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Break it, version A: predict, then read the failure",
      lab: "c-frame-known-failure-a",
      body: `Cover the expected output. Read the difference you found in the worked example and say which check will fail. Then compare. This run is a **known failure**: the program exits with an error on purpose, and the report names the check that failed and the line of the test. Notice that seven of the eight checks pass.`,
      tryNext: `The parser's struct puts the guard byte inside it so that you can see the overwrite on a PC. In real firmware the neighbour is a different variable. Why would a memory-checking tool on the PC (AddressSanitizer) **not** flag this overflow in this lab? Answer, then read the explanation in the next exercise.`,
    },
    {
      type: "lab",
      stage: "practice",
      depth: "apply",
      title: "Break it, version B: the good frame that was lost",
      lab: "c-frame-known-failure-b",
      body: `Again, cover the output first. Read the one-line replacement of the rescan and say which contract sentence it breaks and which test will notice. Then run. Compare the failure message with test 7: the name of the check is the name of the scenario.`,
      tryNext: `Change the test so the corrupt outer frame is **followed** by the inner frame instead of containing it (outer bad, then a separate good frame). Predict whether version B still fails. Explain why or why not.`,
    },
    {
      type: "exercise",
      stage: "practice",
      depth: "apply",
      exercise: {
        kind: "multi",
        id: "what-catches-a",
        skill: "frame-parser",
        objective: "Choose what would catch version A in a real project.",
        prompt: `Version A overwrites a neighbouring variable only for a 64-byte payload and delivers every frame correctly. Select **every** measure that would reliably catch it.`,
        options: [
          { id: "a", text: "A test that sends the maximum-length frame and checks the memory just past the buffer is unchanged.", correct: true, feedback: `Yes: the bug is a write outside the buffer, so the test must look outside it. A boundary payload plus a guard check does exactly this.` },
          { id: "b", text: "A static analysis or review rule that flags every store whose index can equal the buffer size.", correct: true, feedback: `Yes: in the CRC state idx equals len, which can reach 64, the guard position; a tool or a reviewer focused on array bounds can find that.` },
          { id: "c", text: "AddressSanitizer on a PC build, with the guard byte modelled as another member of the same structure.", correct: false, feedback: `No: the write is inside the structure's own memory, so the sanitiser sees nothing wrong. It catches overflows into other objects, not between members of one object. That is why the guard test is explicit.` },
          { id: "d", text: "Counting the delivered frames: all of them arrive, so the parser is fine.", correct: false, feedback: `Delivery counts show the behaviour is right and say nothing about memory outside the buffer. The silent part of the bug is exactly that the behaviour stays correct.` },
        ],
        solvedFeedback: `Right: a boundary test with a guard check, and a bounds-focused review or analysis. A sanitiser misses intra-object overflow, and delivery counts cannot see it.`,
      },
    },
    {
      type: "concept",
      stage: "complexity",
      depth: "master",
      title: "What robust costs, and what the lab does not prove",
      body: `Fixing sentence 5 has a price you should be able to quote. The clean parser replays rejected bytes from a queue of 2 × (64 + 3) = **134 bytes on the stack**, inside every call of \`frame_feed\`. Each replay is shorter than the one before, so the loop always ends, but the worst case is real work for one byte. On a small part with a tight interrupt budget that is a number to **measure**, not assume.

Other limits to state aloud:

- **Where it runs.** Called from an interrupt, the parser must be short; called from a task, the byte source must be a **ring buffer** that cannot overrun.
- **A CRC-8 is weak.** It lets roughly one corrupted frame in 256 through. The protocol decides the strength; the parser can only check what the frame carries.
- **Eight tests is a floor.** A deterministic fuzz test, random bytes from a fixed seed with the contract checked after each, finds cases you did not think of.
- **The lab runs on a PC.** It shows the logic; stack use, speed and interrupt timing on the target still need to be measured.`,
    },
    {
      type: "exercise",
      stage: "check",
      depth: "master",
      exercise: {
        kind: "single",
        id: "bad-fix-b",
        skill: "frame-parser",
        objective: "Judge a proposed fix for lost frames.",
        prompt: `A teammate fixes version B's lost frames by making the parser, after any rejected frame, skip ahead by the rejected frame's **length field** before looking for the next start byte. Why is that wrong?`,
        options: [
          { id: "a", text: "It is fine: skipping the length is faster than replaying bytes.", correct: false, feedback: `It is faster, and it brings back the original bug: it throws away the bytes where a good frame may start.` },
          { id: "b", text: "The length field of a damaged frame cannot be trusted, and skipping by it can jump over a good frame that began inside the damaged one.", correct: true, feedback: `Right. The length may itself be the corrupted byte. Rescanning byte by byte from just after the failed start byte is the only way to be sure that no frame is skipped.` },
          { id: "c", text: "The length field is always correct, so the change is harmless.", correct: false, feedback: `A damaged frame can have any bad byte, including the length. Trusting it after a rejection is trusting a value you already know is unreliable.` },
          { id: "d", text: "It only matters for frames longer than 32 bytes.", correct: false, feedback: `Length does not change the principle. A short outer frame containing an inner frame is lost in the same way, as test 7 shows with a five-byte payload.` },
        ],
      },
    },
    {
      type: "interview",
      stage: "check",
      depth: "master",
      questionId: "frame-parser-robustness",
      intro: `Describe a serial frame parser, what it promises, and how you would test those promises.`,
    },
    {
      type: "concept",
      stage: "work",
      depth: "understand",
      title: "Where you will use this",
      body: `- **Embedded development.** Every UART, RS-485 and radio link needs a parser; the contract-and-tests habit makes it small and trustworthy.
- **Aerospace and UAV systems.** Telemetry and command links drop and corrupt bytes; resynchronising without losing frames is a requirement, and the counters of good, bad and skipped frames are test evidence.
- **R&D and design.** Choosing the frame format, the length limit and the CRC is a design trade-off between overhead, robustness and CPU time.
- **Verification and interviews.** "Write a parser and tell me how you would test it" is a common live task; a contract with one test per sentence is a strong answer.`,
    },
    {
      type: "recap",
      summary: `- A parser reads one byte at a time into a fixed buffer from a noisy stream. It makes two promises: never write outside the buffer, never lose a good frame because of a bad one.
- Write the contract as sentences and give each a test; a failing test then names the sentence it broke.
- Version A (CRC byte stored in the payload buffer) overwrites the guard byte only at the maximum length, while every delivery stays correct. Only a guard check finds it.
- Version B (no rescan) loses a good frame hidden inside a rejected one. After a rejection, replay the bytes after the start byte.
- Robustness has a cost: bytes of stack, work per byte, and the strength of the CRC. Measure on the target.`,
      cards: [
        { id: "fp-1", front: "What are the two promises of a robust frame parser?", back: "Never write outside its own buffer for any input, and never lose a good frame because an earlier frame was bad (resynchronise after rejection)." },
        { id: "fp-2", front: "Why can a parser pass every behaviour test and still corrupt memory?", back: "An off-by-one that writes past the buffer need not change any delivered frame. Only a test that checks the memory beyond the buffer, such as a guard byte at maximum length, can see it." },
        { id: "fp-3", front: "How should a parser resynchronise after a rejected frame?", back: "Replay the bytes after the failed start byte through the state machine, since a good frame may begin inside them. Never skip by the damaged frame's own length." },
        { id: "fp-4", front: "Why does AddressSanitizer miss an overflow between two members of one struct?", back: "Both members live in one object, so the access is not out of bounds for the sanitiser. Use an explicit guard check, or review array bounds, to find it." },
      ],
    },
  ],
};
